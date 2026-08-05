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
 *     <button type="submit" class="lp-btn"
 *             data-product-handle="skinora-clear">
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

    const handle = btn.dataset.productHandle;
    if (!handle) return;

    /* Prevent native submit — AJAX takes over */
    e.preventDefault();

    /* ── Prevent double-submits ── */
    if (btn.classList.contains('is-loading')) return;
    btn.classList.add('is-loading');
    btn.disabled = true;

    const originalText = btn.textContent;
    btn.textContent = 'Legger til\u2026';

    try {
      /* 1. Fetch product JSON to get the first available variant */
      const productRes = await fetch('/products/' + handle + '.js', { cache: 'default' });
      if (!productRes.ok) throw new Error('Product not found');
      const product = await productRes.json();

      const variant =
        product.variants.find(function (v) {
          return v.available;
        }) || product.variants[0];

      /* 2. Add to cart via AJAX \u2014 drawer-seksjonene bes om i SAMME kall.
         Tidligere var dette tre sekvensielle rundturer (produkt-JSON \u2192 add \u2192
         /cart?sections=\u2026) \u00e0 ~0,7 s = ~2,1 s f\u00f8r skuffen \u00e5pnet. Seksjonene er
         gratis i add-svaret, s\u00e5 vi er nede i to. */
      const addRes = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: variant.id, quantity: 1 }],
          sections: 'cart-drawer,cart-icon-bubble',
          sections_url: window.location.pathname,
        }),
      });
      if (!addRes.ok) throw new Error('Add-to-cart failed');
      const addData = await addRes.json();

      /* 3. Success state */
      btn.textContent = 'Lagt til \u2713';

      /* 4. Open cart drawer with the sections we already have */
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
          cartDrawer.renderContents({ id: variant.id, sections: await sectionsRes.json() });
        }
      } else {
        window.location.href = '/cart';
        return;
      }

      /* 5. Revert button text after brief delay */
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
      /* Fallback: submit the form natively */
      form.submit();
    }
  });
})();
