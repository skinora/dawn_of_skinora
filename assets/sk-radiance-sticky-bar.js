/* sk-radiance-sticky-bar — flyttet ut av snippets/sk-radiance-sticky-bar.liquid.
   Seksjons-id og knappetekster leses fra data-attributtene på
   [data-sk-sticky-source] (kilde-malen i snippeten). */
(function () {
  const cfgEl = document.querySelector('[data-sk-sticky-source]');
  if (!cfgEl) return;
  const sectionId = cfgEl.dataset.sectionId;
  const addingLabel = cfgEl.dataset.addingLabel;
  const addLabel = cfgEl.dataset.addLabel;
  const soldOutLabel = cfgEl.dataset.soldOutLabel;
  const sourceId = 'stickyBottomBar-' + sectionId;
  const portalId = sourceId + '-portal';
  let latestOfferDetail = null;

  function mountPortal() {
    const source = document.getElementById(sourceId);
    if (!source) return null;

    let portal = document.getElementById(portalId);
    if (!portal) {
      portal = document.createElement('div');
      portal.id = portalId;
      portal.className = 'sk-radiance-sticky-bottom-bar--portal';
      portal.innerHTML = source.innerHTML;
      document.body.appendChild(portal);
    }
    return portal;
  }

  /* ── Synlighet styrt av hoved-ATC, ikke av scroll ────────────────────────
     Foer: updateVisibility() maalte hele #MainProduct-seksjonen og ble kun
     kalt fra scroll- og resize-hendelser — aldri ved init. Derfor manglet
     .visible ved foerste paint, baren sto paa translateY(100%) utenfor
     skjermen, og den dukket foerst opp naar brukeren scrollet. Paa en side
     der knappen uansett ligger under folden var det stikk motsatt av hva
     baren er til for.

     Naa er regelen den enkle: baren er en STEDFORTREDER for hoved-knappen.
     Er knappen synlig, trengs ingen stedfortreder. Er den ute av syne,
     trengs den. En IntersectionObserver svarer paa akkurat det spoersmaalet
     uten aa vite noe om scroll-posisjon eller -retning, og den fyrer ved
     observe() — saa tilstanden er riktig fra foerste frame. */
  function setBarVisible(portal, visible) {
    portal.classList.toggle('visible', visible);
    document.documentElement.classList.toggle('sk-sticky-bar-visible', visible);
  }

  function observeMainAtc(portal) {
    const main = document.getElementById('MainProduct-' + sectionId) || document;
    const atc =
      main.querySelector('[data-sk-main-atc]') ||
      main.querySelector('.sk-radiance-buy-buttons button[type="submit"]') ||
      main.querySelector('form[action*="/cart/add"] button[type="submit"]') ||
      main.querySelector('button[name="add"]');

    if (!atc || typeof IntersectionObserver === 'undefined') {
      /* Finner vi ikke knappen, er det tryggere aa vise baren enn aa la
         siden staa uten kjoepsmulighet i det hele tatt. */
      setBarVisible(portal, true);
      return;
    }

    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          /* ── Retningen er avgjoerende ────────────────────────────────────
             Foerste versjon brukte bare !entry.isIntersecting. Det er feil,
             fordi «ikke synlig» daekker TO motsatte tilstander:

               knappen er OVER viewporten  -> brukeren har scrollet forbi,
                                              baren skal opp
               knappen er UNDER viewporten -> brukeren har ikke kommet dit
                                              enda, baren skal ligge

             Paa mobil laa hoved-ATC paa 693 px i dokumentet, mens en ekte
             telefon ofte har ~650-700 px synlig naar nettleserlinja er
             framme. Knappen var altsaa saavidt under folden ved lasting,
             og baren spratt opp med én gang — foer kunden hadde rukket aa
             se at det finnes en kjoepsknapp i det hele tatt.

             boundingClientRect.bottom < 0 betyr at hele knappen har
             passert oppover forbi toppen av skjermen. Det, og bare det,
             er «scrollet bort fra kjoepsknappen». Ingen tilstand aa holde
             styr paa — geometrien svarer selv. */
          setBarVisible(portal, entry.boundingClientRect.bottom <= 0);
        });
      },
      /* ── Terskelen MAA inneholde 0 ────────────────────────────────────
         Foerste retningsfiks brukte threshold: 0.35 alene. Da varslet
         observeren kun naar knappen krysset 35 % synlighet — og i det
         oeyeblikket er den fortsatt delvis synlig, saa bottom > 0 og
         baren ble liggende. Naar knappen deretter forsvant helt ut paa
         toppen kom det INGEN ny callback, fordi det ikke fantes noen
         terskel paa 0 aa krysse. Betingelsen ble dermed aldri evaluert
         i det ene oeyeblikket den ville sagt ja, og baren kom aldri.

         Med 0 i lista fyrer observeren ogsaa naar siste piksel forlater
         skjermen. Det er noeyaktig det tidspunktet baren skal opp.

         rootMargin -24px i bunn staar igjen: en knapp som saavidt
         stikker inn under nettleserlinja teller ikke som synlig. Den
         paavirker kun naar intersection regnes ut, ikke
         boundingClientRect, som alltid maales mot ekte viewport. */
      { rootMargin: '0px 0px -24px 0px', threshold: [0, 0.35] }
    ).observe(atc);
  }

  function findProductForm(btn) {
    const mainSection = document.getElementById('MainProduct-' + sectionId);
    if (mainSection) {
      const sectionForm = mainSection.querySelector('form[action^="/cart/add"], form[action*="/cart/add"]');
      if (sectionForm) return sectionForm;

      const anyForm = mainSection.querySelector('form');
      if (anyForm) return anyForm;
    }

    const fallback = document.querySelector(
      'form[action^="/cart/add"], form[action*="/cart/add"], form[action^="/cart"], form[action*="/cart"]'
    );
    return fallback || null;
  }

  function applyVariantToInput(input, variantId) {
    if (!input || !variantId) return;
    const nextValue = String(variantId);
    input.value = nextValue;
    input.setAttribute('value', nextValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function safeSubmitForm(form) {
    if (!form) return false;
    const submitBtn = form.querySelector(
      'button[type="submit"], input[type="submit"], [data-add-to-cart], .add-to-cart'
    );
    if (submitBtn) {
      try {
        submitBtn.click();
        return true;
      } catch (error) {}
    }
    if (typeof form.requestSubmit === 'function') {
      try {
        form.requestSubmit();
        return true;
      } catch (error) {}
    }
    if (typeof form.submit === 'function') {
      try {
        form.submit();
        return true;
      } catch (error) {}
    }
    return false;
  }

  function handlePortalClick(event) {
    const btn = event.target.closest && event.target.closest('[data-sk-sticky-cta]');
    if (!btn) return;
    event.preventDefault();
    const form = findProductForm(btn);
    if (!form) return;

    if (latestOfferDetail && latestOfferDetail.variantId) {
      const mainSection = document.getElementById('MainProduct-' + sectionId);
      const scope = mainSection || form;
      scope
        .querySelectorAll('input[name="id"], .product-variant-id, [data-sk-selected-variant-id]')
        .forEach((input) => applyVariantToInput(input, latestOfferDetail.variantId));
    }

    /* Tilbakemelding på DENNE knappen. safeSubmitForm() sender hovedskjemaet,
       så product-form.js gir «Legger til …» på hovedknappen – men den er
       scrollet ut av syne når sticky-baren er synlig, så klikket her så helt
       uresponsivt ut i de ~0,7 s kallet tar. Vi speiler samme mønster lokalt.
       cartUpdate/cartError (pub-sub) rydder opp; timeout er sikkerhetsnett. */
    if (!btn.dataset.skAdding) {
      btn.dataset.skAdding = '1';
      btn.dataset.skLabel = btn.textContent;
      btn.textContent = addingLabel;
      btn.classList.add('is-adding');
      btn.setAttribute('aria-disabled', 'true');
      restoreStickyCta(btn);
    }

    safeSubmitForm(form);
  }

  /* Gjenopprett knappen når kurven har svart (eller etter timeout). */
  function restoreStickyCta(btn) {
    let done = false;
    const restore = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      btn.textContent = btn.dataset.skLabel || btn.textContent;
      btn.classList.remove('is-adding');
      btn.removeAttribute('aria-disabled');
      delete btn.dataset.skAdding;
      delete btn.dataset.skLabel;
    };
    const timer = setTimeout(restore, 4000);
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      const un1 = subscribe(PUB_SUB_EVENTS.cartUpdate, () => { restore(); un1 && un1(); });
      const un2 = subscribe(PUB_SUB_EVENTS.cartError, () => { restore(); un2 && un2(); });
    }
  }

  function updateSticky(detail) {
    latestOfferDetail = detail;
    const portal = document.getElementById(portalId);
    if (!portal || !detail) return;

    const variantInput = portal.querySelector('[data-sk-sticky-variant]');
    if (variantInput && detail.variantId) {
      applyVariantToInput(variantInput, detail.variantId);
    }

    portal.querySelector('[data-sk-sticky-title]').textContent = detail.title;
    portal.querySelector('.sk-price__current').textContent = detail.priceText || '';
    portal.querySelector('.sk-price__value').textContent = detail.compareText || '';

    let badgeEl = portal.querySelector('.sk-price__badge');
    if (!badgeEl) {
      badgeEl = document.createElement('span');
      badgeEl.className = 'sk-price__badge';
      portal.querySelector('.sk-radiance-sticky-bottom-bar__price').appendChild(badgeEl);
    }
    badgeEl.textContent = detail.badgeText || '';

    const btn = portal.querySelector('[data-sk-sticky-cta]');
    btn.disabled = !detail.available;
    btn.setAttribute('aria-disabled', detail.available ? 'false' : 'true');
    btn.textContent = detail.available ? addLabel : soldOutLabel;
  }

  const portal = mountPortal();
  if (!portal) return;

  portal.addEventListener('click', handlePortalClick);

  /* Scroll- og resize-lytterne er borte med vilje. De maalte layout ved hver
     hendelse og krevde en rAF-gate for ikke aa gi reflow-storm paa mobil,
     der resize fyrer gjentatte ganger naar nettleserlinja skjules under
     scrolling. IntersectionObserver gjoer maalingen utenfor hovedtraaden og
     kaller bare tilbake naar svaret faktisk endrer seg. */
  observeMainAtc(portal);

  document.addEventListener('sk:offerchange', (e) => updateSticky(e.detail));
})();
