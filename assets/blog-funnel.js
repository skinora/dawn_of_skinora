/* =============================================================================
   blog-funnel.js
   1) Sporing av CTA-klikk i bloggartikler  → Shopify.analytics.publish
   2) Mobil sticky-bar (<= 749 px)

   Lastes KUN av sections/sk-blog-article.liquid, med defer.
   Ingen avhengigheter. Ingen globale bivirkninger utenfor artikkelsider.
   ============================================================================= */
(function () {
  'use strict';

  if (window.__skBlogFunnel) return;
  window.__skBlogFunnel = true;

  /* ---------------------------------------------------------------------------
     1) SPORING
     Ett event per klikk på en CTA med data-blog-cta.

       Shopify.analytics.publish('blog_cta_click', {
         article: 'nyheter/torr-hud-overgangsalder',
         variant: 'kompakt' | 'full' | 'sticky',
         type:    'produkt' | 'quiz' | 'epost',
         target:  '/products/skinora-radiance-face'
       })

     Delegert på document i capture-fasen, så eventet telles selv om
     quiz-boot-skriptet kaller preventDefault for å åpne modalen i stedet.

     Kun korte kodeverdier sendes — aldri knappetekst eller annen fritekst.
     Samme regel som i sk-quiz.js og sk-cta-click-tracking.liquid.
     --------------------------------------------------------------------------- */
  function publish(payload) {
    try {
      if (window.Shopify && window.Shopify.analytics && typeof window.Shopify.analytics.publish === 'function') {
        window.Shopify.analytics.publish('blog_cta_click', payload);
      }
    } catch (e) {
      /* sporing skal aldri kunne stoppe en navigasjon */
    }
  }

  document.addEventListener(
    'click',
    function (event) {
      var el = event.target && event.target.closest && event.target.closest('[data-blog-cta]');
      if (!el) return;

      publish({
        article: el.getAttribute('data-blog-cta') || '',
        variant: el.getAttribute('data-cta-variant') || '',
        type: el.getAttribute('data-cta-type') || '',
        target: el.getAttribute('href') || ''
      });
    },
    true
  );

  /* ---------------------------------------------------------------------------
     2) STICKY-BAR
     --------------------------------------------------------------------------- */
  var bar = document.querySelector('[data-blog-funnel-sticky]');
  if (!bar) return;

  var STORAGE_KEY = 'sk_blog_funnel_sticky_closed';
  var SHOW_AFTER = 0.35; // 35 % av scrollbar høyde
  var mq = window.matchMedia('(max-width: 749px)');

  var dismissed = false;
  try {
    dismissed = sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch (e) {
    /* private-modus / blokkerte cookies: baren vises som normalt */
  }

  /* Fullkortet og footeren. Er en av dem synlig, har brukeren allerede
     CTA-en foran seg og baren skal vike. */
  var suppressors = 0;
  var watchTargets = [];
  var fullCard = document.querySelector('[data-blog-funnel-full]');
  if (fullCard) watchTargets.push(fullCard);
  var footer = document.querySelector('.footer, footer.shopify-section, [id*="__footer"]');
  if (footer) watchTargets.push(footer);

  if ('IntersectionObserver' in window && watchTargets.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!entry.target.__bfSeen) {
              entry.target.__bfSeen = true;
              suppressors += 1;
            }
          } else if (entry.target.__bfSeen) {
            entry.target.__bfSeen = false;
            suppressors -= 1;
          }
        });
        update();
      },
      { rootMargin: '0px 0px -10% 0px' }
    );
    watchTargets.forEach(function (t) {
      io.observe(t);
    });
  }

  /* Klaviyo-popup / -teaser. Ligger på z-index 90000 og eier bunnen av
     skjermen når den er oppe. Vårt eget innbygde skjema (inne i et
     funnel-kort) teller ikke — det er en del av sidens innhold. */
  function klaviyoOverlayOpen() {
    var nodes = document.querySelectorAll(
      '[class*="kl-private-reset"], [class*="kl-teaser"], div[data-testid="klaviyo-form"]'
    );
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest('.blog-funnel-card')) continue;
      if (n.offsetParent !== null && n.getBoundingClientRect().height > 0) return true;
    }
    return false;
  }

  /* Quiz-modalen låser scroll med .overflow-hidden på <body> (sk-quiz.js).
     Samme klasse brukes av handlekurv-skuffen og menyskuffen. */
  function overlayOpen() {
    return document.body.classList.contains('overflow-hidden') || klaviyoOverlayOpen();
  }

  function scrolledEnough() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (max <= 0) return false;
    return (window.scrollY || doc.scrollTop || 0) / max >= SHOW_AFTER;
  }

  var visible = false;
  function setVisible(next) {
    if (next === visible) return;
    visible = next;
    bar.classList.toggle('is-visible', next);
    bar.setAttribute('aria-hidden', next ? 'false' : 'true');
    /* Flytter Shopifys personvernbanner opp over baren. Mekanismen finnes
       allerede i sk-base.css (html.sk-sticky-bar-visible). */
    document.documentElement.classList.toggle('sk-sticky-bar-visible', next);
  }

  function update() {
    if (dismissed || !mq.matches) {
      setVisible(false);
      return;
    }
    setVisible(scrolledEnough() && suppressors === 0 && !overlayOpen());
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      update();
    });
  }

  var closeBtn = bar.querySelector('[data-blog-funnel-sticky-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      dismissed = true;
      setVisible(false);
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch (e) {
        /* lagring feilet — baren er uansett skjult for denne visningen */
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', update);

  /* Fanger opp Klaviyo-popup og skuffer som åpnes uten scroll. */
  if ('MutationObserver' in window) {
    var mo = new MutationObserver(onScroll);
    mo.observe(document.body, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'] });
  }

  update();
})();
