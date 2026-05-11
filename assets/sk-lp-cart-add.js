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

      /* 2. Add to cart via AJAX */
      const addRes = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ id: variant.id, quantity: 1 }] }),
      });
      if (!addRes.ok) throw new Error('Add-to-cart failed');

      /* 3. Success state */
      btn.textContent = 'Lagt til \u2713';

      /* 4. Refresh and open cart drawer */
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        cartDrawer.classList.remove('is-empty');
        const drawerItems = cartDrawer.querySelector('cart-drawer-items');
        if (drawerItems) drawerItems.classList.remove('is-empty');

        const sectionsUrl = '/cart?sections=cart-drawer,cart-icon-bubble';
        const sectionsRes = await fetch(sectionsUrl);
        const sections = await sectionsRes.json();

        cartDrawer.renderContents({ id: variant.id, sections: sections });
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
