/*
 * sk-quiz.js — produktveiviseren som ett web component: <sk-quiz>
 * ---------------------------------------------------------------
 * Ingen rammeverk, ingen build. ES-modul slik at den kan lastes med dynamisk
 * import ved første klikk (modal), eller som vanlig modul på egen side.
 *
 * Tekstinnhold: spørsmål/alternativer fra window.SK_QUIZ_DATA (sk-quiz-data.js).
 * Chrome-tekster (knapper, overskrifter) fra en JSON-config lagt av seksjonen,
 * slik at INGEN synlig tekst hardkodes her.
 *
 * Personvern: svar kun i minne + sessionStorage (sk_quiz_v1). Aldri i URL.
 * Eneste tillatte parameter er ?modal=quiz. Ingen egne cookies. E-post sendes
 * bare når brukeren trykker send OG samtykke er krysset av manuelt.
 */

const SS_KEY = 'sk_quiz_v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 t – «fortsett der du slapp» i samme økt

/* ---------- Små hjelpere ---------- */
const el = (tag, attrs = {}, kids = []) => {
  const n = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'text') n.textContent = attrs[k];
    else if (k === 'html') n.innerHTML = attrs[k];
    else if (k in n && k !== 'list') n[k] = attrs[k];
    else n.setAttribute(k, attrs[k]);
  }
  (Array.isArray(kids) ? kids : [kids]).forEach((c) => c && n.appendChild(c));
  return n;
};

const dl = (event, extra) => {
  // Kun korte kodeverdier i dataLayer – aldri fritekst eller personopplysninger.
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(Object.assign({ event }, extra || {}));
};

const money = (ore) =>
  new Intl.NumberFormat('nb-NO').format(Math.round(ore / 100)) + ' kr';

/* ---------- Ruting: første treff vinner ---------- */
function resolveHandle(data, answers) {
  for (const r of data.rules) {
    if (r.default) return r.handle;
    let ok = true;
    if (r.equals) for (const k in r.equals) if (answers[k] !== r.equals[k]) ok = false;
    if (ok && r.inList) for (const k in r.inList) if (!r.inList[k].includes(answers[k])) ok = false;
    if (ok && r.anyEquals) ok = r.anyEquals.some(([k, v]) => answers[k] === v);
    if (ok) return r.handle;
  }
  return data.rules[data.rules.length - 1].handle;
}

/* =====================================================================
   <sk-quiz> — selve veiviseren
   ===================================================================== */
class SkQuiz extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;
    this.data = window.SK_QUIZ_DATA;
    this.cfg = this._readConfig();
    this.L = this.cfg.labels || {};
    this.answers = {};
    this.stepIndex = 0;
    this.mode = this.getAttribute('mode') || 'page';

    const saved = this._load();
    if (saved && saved.answers && Object.keys(saved.answers).length) {
      this._renderResume(saved);
    } else {
      this._renderStep();
    }
    dl('sk_quiz_open', { quiz_mode: this.mode });
  }

  _readConfig() {
    const id = this.getAttribute('config');
    const node = id && document.getElementById(id);
    try { return node ? JSON.parse(node.textContent) : {}; }
    catch (e) { return {}; }
  }

  /* ---------- Lagring (sessionStorage) ---------- */
  _save() {
    try {
      sessionStorage.setItem(SS_KEY, JSON.stringify({
        answers: this.answers, stepIndex: this.stepIndex, ts: Date.now()
      }));
    } catch (e) { /* privat modus e.l. – ignorer */ }
  }
  _load() {
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d.ts || Date.now() - d.ts > MAX_AGE_MS) { sessionStorage.removeItem(SS_KEY); return null; }
      return d;
    } catch (e) { return null; }
  }
  _clear() { try { sessionStorage.removeItem(SS_KEY); } catch (e) {} }

  /* ---------- «Fortsett der du slapp» ---------- */
  _renderResume(saved) {
    this.innerHTML = '';
    this.appendChild(el('div', { class: 'sk-quiz__resume', role: 'group' }, [
      el('p', { class: 'sk-quiz__resume-title', text: this.L.resume_title || 'Du har en påbegynt veiviser.' }),
      el('div', { class: 'sk-quiz__resume-actions' }, [
        el('button', {
          class: 'sk-quiz__btn sk-quiz__btn--primary', type: 'button',
          text: this.L.resume_continue || 'Fortsett der du slapp',
          onclick: () => { this.answers = saved.answers; this.stepIndex = Math.min(saved.stepIndex || 0, this.data.steps.length); this._renderStep(); }
        }),
        el('button', {
          class: 'sk-quiz__btn sk-quiz__btn--ghost', type: 'button',
          text: this.L.resume_restart || 'Start på nytt',
          onclick: () => { this._clear(); this.answers = {}; this.stepIndex = 0; this._renderStep(); }
        })
      ])
    ]));
  }

  /* ---------- Fremdriftsindikator ---------- */
  _progress() {
    const total = this.data.steps.length;
    const cur = Math.min(this.stepIndex + 1, total);
    const wrap = el('div', { class: 'sk-quiz__progress-wrap' });
    const bar = el('div', {
      class: 'sk-quiz__progress', role: 'progressbar',
      'aria-valuemin': '1', 'aria-valuemax': String(total), 'aria-valuenow': String(cur),
      'aria-label': this.L.progress_label || 'Fremdrift'
    }, [el('span', { class: 'sk-quiz__progress-fill', style: `width:${(cur / total) * 100}%` })]);
    const text = el('p', {
      class: 'sk-quiz__progress-text',
      text: (this.L.step_of || 'Steg {n} av {total}').replace('{n}', cur).replace('{total}', total)
    });
    wrap.append(bar, text);
    return wrap;
  }

  /* ---------- Ett steg ---------- */
  _renderStep() {
    const step = this.data.steps[this.stepIndex];
    if (!step) return this._renderResult();
    this.innerHTML = '';

    const live = el('p', { class: 'sk-quiz__sr-only', 'aria-live': 'polite', id: 'sk-quiz-live' });
    const heading = el('h2', {
      class: 'sk-quiz__question', id: 'sk-quiz-q', tabindex: '-1', text: step.legend
    });

    const fs = el('fieldset', { class: 'sk-quiz__fieldset' });
    fs.appendChild(el('legend', { class: 'sk-quiz__sr-only', text: step.legend }));

    step.options.forEach((opt, i) => {
      const inputId = `${step.id}-${opt.value}`;
      const input = el('input', {
        type: 'radio', name: step.key, id: inputId, value: opt.value,
        class: 'sk-quiz__radio', checked: this.answers[step.key] === opt.value
      });
      input.addEventListener('change', () => {
        this.answers[step.key] = opt.value;
        this._save();
        fs.querySelectorAll('.sk-quiz__option').forEach((l) => l.classList.remove('is-selected'));
        label.classList.add('is-selected');
        next.disabled = false;
      });
      const label = el('label', {
        class: 'sk-quiz__option' + (this.answers[step.key] === opt.value ? ' is-selected' : ''),
        for: inputId
      }, [input, el('span', { class: 'sk-quiz__option-label', text: opt.label })]);
      fs.appendChild(label);
    });

    // Navigasjon
    const back = el('button', {
      class: 'sk-quiz__btn sk-quiz__btn--ghost', type: 'button',
      text: this.L.back || 'Tilbake', disabled: this.stepIndex === 0,
      onclick: () => { if (this.stepIndex > 0) { this.stepIndex--; this._save(); this._renderStep(); } }
    });
    const next = el('button', {
      class: 'sk-quiz__btn sk-quiz__btn--primary', type: 'button',
      text: this.stepIndex === this.data.steps.length - 1 ? (this.L.see_result || 'Se anbefaling') : (this.L.next || 'Neste'),
      disabled: !this.answers[step.key],
      onclick: () => { this.stepIndex++; this._save(); dl('sk_quiz_step', { quiz_step: this.stepIndex + 1 }); this.stepIndex >= this.data.steps.length ? this._renderResult() : this._renderStep(); }
    });

    this.append(
      live,
      this._progress(),
      heading,
      fs,
      el('div', { class: 'sk-quiz__nav' }, [back, next])
    );

    // Fokus: første steg/åpning → første alternativ; ellers spørsmålsoverskriften
    if (this.stepIndex === 0 && !this._navigated) {
      const first = fs.querySelector('.sk-quiz__radio');
      if (first) first.focus();
    } else {
      heading.focus();
    }
    this._navigated = true;
    live.textContent = step.legend;
    dl('sk_quiz_step', { quiz_step: this.stepIndex + 1 });
  }

  /* ---------- Resultat ---------- */
  async _renderResult() {
    const handle = resolveHandle(this.data, this.answers);
    const meta = (this.data.products && this.data.products[handle]) || {};
    dl('sk_quiz_result', { quiz_result: handle });
    this.innerHTML = '';

    const box = el('div', { class: 'sk-quiz__result', role: 'group', 'aria-labelledby': 'sk-quiz-result-h' });
    box.appendChild(el('p', { class: 'sk-quiz__loading', text: this.L.loading || 'Finner din anbefaling …', 'aria-live': 'polite' }));
    this.appendChild(box);

    let p = null;
    try {
      const res = await fetch(`${this.cfg.productBase || '/products/'}${handle}.js`, { headers: { Accept: 'application/json' } });
      if (res.ok) p = await res.json();
    } catch (e) { /* faller tilbake til lenke under */ }

    box.innerHTML = '';
    const productUrl = p ? p.url : `${this.cfg.productBase || '/products/'}${handle}`;
    const variantId = p && (p.first_available_variant || p.variants.find((v) => v.available) || p.variants[0]);

    if (meta.badge) box.appendChild(el('p', { class: 'sk-quiz__result-badge', text: meta.badge }));
    box.appendChild(el('p', { class: 'sk-quiz__result-eyebrow', text: this.L.result_eyebrow || 'Vår anbefaling' }));
    box.appendChild(el('h2', { class: 'sk-quiz__result-title', id: 'sk-quiz-result-h', tabindex: '-1', text: p ? p.title : (this.L.result_fallback_title || 'Anbefalt maske') }));
    if (meta.reason) box.appendChild(el('p', { class: 'sk-quiz__result-reason', text: meta.reason }));
    if (p) box.appendChild(el('p', { class: 'sk-quiz__result-price', text: money(p.price) }));
    if (p && p.featured_image) {
      box.appendChild(el('img', { class: 'sk-quiz__result-img', src: p.featured_image, alt: p.title, loading: 'lazy', width: '320', height: '320' }));
    }

    // Legg i handlekurv – med produktside som ekte fallback-lenke
    const addBtn = el('a', {
      class: 'sk-quiz__btn sk-quiz__btn--primary sk-quiz__result-cta', href: productUrl,
      text: this.L.add_to_cart || 'Legg i handlekurv'
    });
    addBtn.addEventListener('click', (e) => {
      if (!variantId) return; // ingen JS-add mulig → følg lenken til produktsiden
      e.preventDefault();
      this._addToCart(variantId.id, addBtn);
    });
    box.appendChild(addBtn);
    box.appendChild(el('a', { class: 'sk-quiz__result-link', href: productUrl, text: this.L.view_product || 'Se produktet' }));

    // Clear-selvtest hvis relevant
    if (meta.clearAssessment && this.cfg.clearAssessmentUrl) {
      box.appendChild(el('a', { class: 'sk-quiz__result-assess', href: this.cfg.clearAssessmentUrl, text: this.L.clear_link_label || 'Passer Clear for deg?' }));
    }

    // Valgfri e-post (ALDRI en mur). Samtykke ikke forhåndskrysset.
    // Protokoll-koden følger med, så Klaviyo kan sende en TILPASSET protokoll.
    box.appendChild(this._emailForm({
      handle: handle,
      protocol: meta.protocol || handle,
      productTitle: p ? p.title : ''
    }));

    box.appendChild(el('button', {
      class: 'sk-quiz__btn sk-quiz__btn--ghost sk-quiz__restart', type: 'button',
      text: this.L.restart || 'Start på nytt',
      onclick: () => { this._clear(); this.answers = {}; this.stepIndex = 0; this._navigated = false; this._renderStep(); }
    }));

    box.querySelector('#sk-quiz-result-h').focus();
  }

  async _addToCart(id, btn) {
    btn.textContent = this.L.adding || 'Legger til …';
    // Be Shopify rendre skuff-seksjonene med i svaret, så temaets egen
    // renderContents() kan oppdatere OG åpne skuffen (Dawn-mønsteret).
    const drawer = document.querySelector('cart-drawer');
    const sectionIds = drawer && typeof drawer.getSectionsToRender === 'function'
      ? drawer.getSectionsToRender().map((s) => s.id)
      : null;
    try {
      const r = await fetch(this.cfg.cartAddUrl || '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(sectionIds
          ? { items: [{ id: id, quantity: 1 }], sections: sectionIds, sections_url: window.location.pathname }
          : { items: [{ id: id, quantity: 1 }] })
      });
      if (!r.ok) throw new Error('add failed');
      const data = await r.json();
      dl('sk_quiz_add_to_cart', { quiz_result: resolveHandle(this.data, this.answers) });
      btn.textContent = this.L.added || 'Lagt til ✓';
      this._closeModal();                 // 1) lukk quiz-modalen (hvis åpen)
      this._openCartDrawer(drawer, data); // 2) åpne temaets skuff med oppdatert innhold
    } catch (e) {
      // JS feilet → send brukeren til produktsiden (btn.href)
      window.location.href = btn.getAttribute('href');
    }
  }

  // Lukk quiz-modalen hvis vi står i den. På egen side finnes ingen dialog → no-op.
  _closeModal() {
    const dialog = typeof this.closest === 'function' ? this.closest('dialog.sk-quiz-modal') : null;
    if (dialog && dialog.open) dialog.close(); // 'close'-handler rydder scroll-lås + historikk
  }

  _openCartDrawer(drawer, data) {
    drawer = drawer || document.querySelector('cart-drawer');
    // Temaets egen måte: oppdater innhold og åpne (renderContents kaller open()).
    if (drawer && typeof drawer.renderContents === 'function' && data && data.sections) {
      drawer.renderContents(data);
      return;
    }
    if (drawer && typeof drawer.open === 'function') { drawer.open(); return; }
    window.location.href = '/cart'; // fallback hvis ingen skuff finnes
  }

  /* Klaviyo Client-Side Subscribe API – ingen backend, kun public company_id.
     Melder profilen inn i «Veiviser»-listen med protokoll-koden som egenskap,
     slik at flowen kan branche clear/radiance. Consent kommer fra listens
     opt-in-innstilling i Klaviyo (brukeren krysset av manuelt før dette kalles).
     Guardet: gjør ingenting hvis nøklene mangler. Verifiser gjerne revision-
     datoen mot gjeldende Klaviyo-dokumentasjon. */
  _klaviyoSubscribe(email, ctx) {
    const k = this.cfg.klaviyo || {};
    if (!k.companyId || !k.listId) return;
    const body = {
      data: {
        type: 'subscription',
        attributes: {
          custom_source: 'Veiviser',
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: email,
                properties: { sk_quiz_protocol: ctx.protocol, sk_quiz_product: ctx.handle }
              }
            }
          }
        },
        relationships: { list: { data: { type: 'list', id: k.listId } } }
      }
    };
    return fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(k.companyId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', revision: '2024-10-15' },
      body: JSON.stringify(body),
      mode: 'cors',
      keepalive: true
    }).catch(function () { /* stille – event er allerede sendt som fallback */ });
  }

  _emailForm(ctx) {
    ctx = ctx || {};
    // {product}-token i overskrift/undertekst fylles med anbefalt produkt.
    // Uten produktnavn (fetch feilet) fjernes «for {product}» pent.
    const fill = (s) => {
      if (!s) return s;
      return ctx.productTitle
        ? s.replace('{product}', ctx.productTitle)
        : s.replace(/\s*for\s+\{product\}/i, '').replace('{product}', '').trim();
    };
    const form = el('form', { class: 'sk-quiz__email', novalidate: 'novalidate' });
    const cbId = 'sk-quiz-consent';
    const email = el('input', {
      type: 'email', class: 'sk-quiz__email-input', name: 'email',
      placeholder: this.L.email_placeholder || 'din@epost.no',
      autocomplete: 'email', 'aria-label': this.L.email_placeholder || 'E-post'
    });
    const consent = el('input', { type: 'checkbox', id: cbId, class: 'sk-quiz__consent-box' }); // IKKE forhåndskrysset
    const consentLabel = el('label', { class: 'sk-quiz__consent', for: cbId }, [
      consent, el('span', { text: this.L.consent || 'Ja, send meg råd på e-post. Kan avmeldes når som helst.' })
    ]);
    const send = el('button', { type: 'submit', class: 'sk-quiz__btn sk-quiz__btn--ghost', text: this.L.email_send || 'Send' });
    const msg = el('p', { class: 'sk-quiz__email-msg', 'aria-live': 'polite' });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!consent.checked || !email.value) { msg.textContent = this.L.email_need_consent || 'Kryss av for samtykke og fyll inn e-post.'; return; }
      dl('sk_quiz_email_submit', { quiz_protocol: ctx.protocol }); // kun kort kode, ingen e-post/fritekst
      // Meld inn i Klaviyo (hvis konfigurert) + send event for evt. egen wiring.
      this._klaviyoSubscribe(email.value, ctx);
      document.dispatchEvent(new CustomEvent('sk-quiz:email', { detail: { email: email.value, handle: ctx.handle, protocol: ctx.protocol } }));
      form.innerHTML = '';
      form.appendChild(el('p', { class: 'sk-quiz__email-msg', text: this.L.email_thanks || 'Takk! Vi sender deg noen gode råd.' }));
    });

    const parts = [
      el('p', { class: 'sk-quiz__email-heading', text: fill(this.L.email_heading || 'Få din gratis LED-protokoll') })
    ];
    if (this.L.email_sub) parts.push(el('p', { class: 'sk-quiz__email-sub', text: fill(this.L.email_sub) }));
    parts.push(el('div', { class: 'sk-quiz__email-row' }, [email, send]), consentLabel, msg);
    parts.forEach((p) => form.appendChild(p));
    return form;
  }
}

if (!customElements.get('sk-quiz')) customElements.define('sk-quiz', SkQuiz);

/* =====================================================================
   Modal — <dialog> med showModal() (fokusfelle + Escape gratis)
   ===================================================================== */
let modalOpen = false;

export function openQuizModal(cfg) {
  if (modalOpen) return;
  modalOpen = true;
  const L = (cfg && cfg.labels) || {};

  const dialog = el('dialog', { class: 'sk-quiz-modal', 'aria-modal': 'true', 'aria-labelledby': 'sk-quiz-q' });
  const closeBtn = el('button', {
    class: 'sk-quiz-modal__close', type: 'button', 'aria-label': L.close || 'Lukk', html: '&times;'
  });
  const quiz = el('sk-quiz', { mode: 'modal', config: cfg.configId || 'sk-quiz-config' });
  dialog.append(closeBtn, el('div', { class: 'sk-quiz-modal__body' }, [quiz]));
  document.body.appendChild(dialog);
  document.body.classList.add('overflow-hidden'); // samme scroll-lås som temaet ellers

  const close = () => {
    if (!modalOpen) return;
    modalOpen = false;
    document.body.classList.remove('overflow-hidden');
    if (dialog.open) dialog.close();
    dialog.remove();
    if (history.state && history.state.skQuiz) history.back();
  };

  closeBtn.addEventListener('click', close);
  dialog.addEventListener('cancel', () => { /* la 'close' rydde */ });
  dialog.addEventListener('close', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); }); // klikk utenfor

  // Historikk: tilbakeknappen lukker modalen istedenfor å forlate siden.
  const url = new URL(window.location.href);
  url.searchParams.set('modal', 'quiz'); // eneste tillatte parameter
  history.pushState({ skQuiz: true }, '', url);
  window.addEventListener('popstate', function onPop() {
    if (modalOpen) { window.removeEventListener('popstate', onPop); close(); }
  });

  dialog.showModal();
}

// Egen side: init alle <sk-quiz> som allerede er i DOM.
export function initInline() {
  document.querySelectorAll('sk-quiz').forEach((q) => { if (q.isConnected) q.connectedCallback(); });
}

// Auto-init hvis modulen lastes direkte på quiz-siden.
if (document.currentScript || document.querySelector('sk-quiz')) initInline();

export default { openQuizModal, initInline };
