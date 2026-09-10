/* =============================================================================
   Custom Pixel: «Blog CTA click»
   -----------------------------------------------------------------------------
   Limes inn i Shopify admin → Innstillinger → Kundehendelser (Customer events)
   → Legg til custom pixel → navn «Blog CTA click».

   Tillatelser: Analytics. (Ikke Marketing/Preferences — vi sender ingen
   annonsedata og setter ingen egne cookies.)

   Abonnerer på hendelsen temaet publiserer fra assets/blog-funnel.js:

     Shopify.analytics.publish('blog_cta_click', {
       article: 'nyheter/torr-hud-overgangsalder',
       variant: 'kompakt' | 'full' | 'sticky',
       type:    'produkt' | 'quiz' | 'epost',
       target:  '/products/skinora-radiance-face'
     })

   Nyttelasten lander i event.customData.

   -----------------------------------------------------------------------------
   OM GA4-VIDERESENDINGEN
   Pixelen kjører i en sandkasse-iframe på et ANNET origin enn butikken. Laster
   vi gtag.js der uten videre, genererer den sin egen client_id, og klikkene
   havner i en egen GA4-sesjon som ikke kan knyttes til besøket. Derfor leses
   _ga-cookien via browser.cookie og client_id settes eksplisitt. Da havner
   eventet i riktig sesjon og riktig attribusjon.

   Måle-ID-en G-59CPLXB6PZ er den samme som Google-kanalen bruker på
   storefronten (se layout/theme.liquid). Bytt den hvis den endres.
   ============================================================================= */

var GA4_MEASUREMENT_ID = 'G-59CPLXB6PZ';

var gaReady = (function () {
  // Henter client_id fra _ga-cookien: "GA1.1.1234567890.1699999999"
  return browser.cookie
    .get('_ga')
    .then(function (raw) {
      var parts = String(raw || '').split('.');
      return parts.length >= 4 ? parts[2] + '.' + parts[3] : null;
    })
    .catch(function () {
      return null;
    })
    .then(function (clientId) {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
      document.head.appendChild(s);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());

      var config = { send_page_view: false };
      if (clientId) config.client_id = clientId;
      window.gtag('config', GA4_MEASUREMENT_ID, config);
    })
    .catch(function () {
      /* GA4 ikke tilgjengelig — abonnementet under fungerer uansett, og
         hendelsen vises fortsatt i Customer events-testmodus. */
    });
})();

analytics.subscribe('blog_cta_click', function (event) {
  var d = (event && event.customData) || {};

  var payload = {
    // GA4-parameternavn: små bokstaver, ingen mellomrom.
    blog_article: String(d.article || ''),
    cta_variant: String(d.variant || ''),
    cta_type: String(d.type || ''),
    cta_target: String(d.target || '')
  };

  gaReady.then(function () {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'blog_cta_click', payload);
    }
  });
});

/* =============================================================================
   ETTER INSTALLASJON — i GA4
   -----------------------------------------------------------------------------
   1. Admin → Egendefinerte definisjoner → opprett fire egendefinerte
      dimensjoner (omfang: Hendelse) med parameternavnene over:
      blog_article, cta_variant, cta_type, cta_target.
      Uten dette lagres verdiene, men kan ikke brukes i rapporter.
   2. Marker blog_cta_click som konvertering hvis den skal telles som mål.

   TESTING
   - Shopify: Kundehendelser → pixelen → «Kontroller» / testmodus. Klikk en
     CTA i en artikkel; hendelsen skal dukke opp med customData.
   - GA4: DebugView (legg til ?_dbg=1 eller bruk GA Debugger-utvidelsen).

   KJENT BEGRENSNING
   Klikk på <a>-CTA-er navigerer bort umiddelbart. Shopify.analytics.publish
   sender via postMessage til sandkassen, og i sjeldne tilfeller rekker ikke
   sandkassen å videresende før siden byttes. Sticky-baren og quiz-triggerne
   er minst utsatt (quiz-modalen navigerer ikke i det hele tatt).
   ============================================================================= */
