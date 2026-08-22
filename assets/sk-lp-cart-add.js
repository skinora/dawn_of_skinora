/**
 * sk-lp-cart-add.js
 * —————————————————————————————————————————————————————
 * Intercepts submit on form.lp-cta-form elements, adds the
 * product to cart via AJAX, then opens the cart drawer.
 *
 * Graceful degradation: each form has action="/cart/add" with a
 * hidden variant-id input, so if JS fails the browser submits
 * the form natively and the product is still added.
 *
 * Usage (Liquid):
 *   <form action="/cart/add" method="post"
 *         enctype="multipart/form-data" class="lp-cta-form">
 *     <input type="hidden" name="id" value="{{ variant.id }}">
 *     <input type="hidden" name="quantity" value="1">
 *     <button type="submit" class="lp-btn">
 *       Kjøp nå
 *     </button>
 *   </form>
 * —————————————————————————————————————————————————————
 */
(function skLpCartAdd() {
  'use strict';

  document.addEventListener('submit', async function (e) {
    const form = e.target.closest('form.lp-cta-form');
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    /* Varianten leses fra skjemaets eget id-felt — den kunden faktisk har
       valgt.

       Tidligere hentet denne /products/<handle>.js og gjettet seg fram med
       variants.find(v => v.available), altså FØRSTE tilgjengelige variant
       uansett hva kunden hadde valgt. På en landingsside med én variant traff
       gjettingen alltid, så feilen var usynlig der. På produktsiden med
       Face / Face + Neck la den feil variant i kurven, til feil pris.

       Skjemaet har hele tiden sendt riktig id — den ble bare aldri lest.
       Bonus: én rundtur mindre før varen er i kurven. */
    const idInput = form.querySelector('input[name="id"]');

    /* Produktsiden selger to tilbud — «Face» og «Face + Neck» — som IKKE er
       Shopify-varianter, men egne radiokort (input[name="sk-offer"]). Når
       kunden bytter, oppdaterer sk-radiance-product sine skjulte id-felter,
       men bare innenfor sin egen seksjon. Dette skjemaet ligger i seksjonen
       «Hva kan du forvente», altså utenfor, og beholder derfor base-varianten.
       Målt 22. aug: valgt Face + Neck (6 990 kr), fikk Face (3 690 kr).

       Seksjonen publiserer det aktive valget som window.__SK_ACTIVE_VARIANT_ID.
       Det er den eneste kontrakten som krysser seksjonsgrensen, så vi leser den.

       Guarden på sk-offer-radioene er med vilje: bare sider som faktisk har
       tilbudsvelgeren skal la globalen overstyre. Landingssidene har ingen
       velger og skal bruke sitt eget skjema. */
    const hasOfferPicker = document.querySelector('input[name="sk-offer"]');
    const variantId =
      (hasOfferPicker && window.__SK_ACTIVE_VARIANT_ID) || (idInput && idInput.value);

    /* Uten variant-id kan vi ikke gjøre dette trygt. La nettleseren submitte
       nativt — samme reserve som ved JS-feil. */
    if (!variantId) return;

    const qtyInput = form.querySelector('input[name="quantity"]');
    const quantity = (qtyInput && parseInt(qtyInput.value, 10)) || 1;

    /* Prevent native submit — AJAX takes over */
    e.preventDefault();

    /* ── Prevent double-submits ── */
    if (btn.classList.contains('is-loading')) return;
    btn.classList.add('is-loading');
    btn.disabled = true;

    const originalText = btn.textContent;
    btn.textContent = 'Legger til…';

    /* Skiller «kom aldri i kurven» fra «kom i kurven, men noe etterpå
       feilet». Uten det skillet kalte catch-grenen form.submit() også når
       tillegget hadde gått bra, og la varen inn en gang til. */
    let added = false;

    try {
      /* Legg i kurv — drawer-seksjonene bes om i SAMME kall. De er gratis i
         add-svaret, så hele operasjonen er én rundtur. */
      const addRes = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: variantId, quantity: quantity }],
          sections: 'cart-drawer,cart-icon-bubble',
          sections_url: window.location.pathname,
        }),
      });
      if (!addRes.ok) throw new Error('Add-to-cart failed');
      const addData = await addRes.json();
      added = true;

      /* Success state */
      btn.textContent = 'Lagt til ✓';

      /* Open cart drawer with the sections we already have */
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        cartDrawer.classList.remove('is-empty');
        const drawerItems = cartDrawer.querySelector('cart-drawer-items');
        if (drawerItems) drawerItems.classList.remove('is-empty');

        if (addData && addData.sections) {
          cartDrawer.renderContents(addData);
        } else {
          /* Fallback hvis seksjonene mangler i svaret */
          const sectionsRes = await fetch('/cart?sections=cart-drawer,cart-icon-bubble');
          cartDrawer.renderContents({ id: variantId, sections: await sectionsRes.json() });
        }
      } else {
        window.location.href = '/cart';
        return;
      }

      /* Revert button text after brief delay */
      setTimeout(function () {
        btn.textContent = originalText;
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }, 1500);
    } catch (err) {
      console.error('[sk-lp-cart-add]', err);
      btn.textContent = originalText;
      btn.classList.remove('is-loading');
      btn.disabled = false;
      /* Reserve KUN hvis varen aldri kom i kurven. Feiler noe etter at
         tillegget lyktes — for eksempel drawer-rendringen — skal vi ikke
         legge den inn på nytt. */
      if (!added) form.submit();
    }
  });
})();
