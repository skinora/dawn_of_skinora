/**
 * sk-lp-cart-add.js
 * —————————————————————————————————————————————————————
 * Intercepts clicks on .lp-btn[data-product-handle] buttons,
 * adds the first available variant to cart via /cart/add.js,
 * then refreshes and opens the cart drawer.
 *
 * Usage:
 *   <button class="lp-btn"
 *           data-product-handle="skinora-radiance-face">
 *     Kjøp nå
 *   </button>
 *
 * Loaded once in layout or via a shared LP snippet.
 * —————————————————————————————————————————————————————
 */
(function skLpCartAdd() {
  'use strict';

  document.addEventListener('click', async function (e) {
    const btn = e.target.closest('.lp-btn[data-product-handle]');
    if (!btn) return;
    e.preventDefault();

    const handle = btn.dataset.productHandle;
    if (!handle) return;

    /* ── Prevent double-clicks ── */
    if (btn.classList.contains('is-loading')) return;
    btn.classList.add('is-loading');

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

      /* 3. Refresh and open cart drawer */
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        /* Remove empty-state classes so the filled cart UI is visible */
        cartDrawer.classList.remove('is-empty');
        const drawerItems = cartDrawer.querySelector('cart-drawer-items');
        if (drawerItems) drawerItems.classList.remove('is-empty');

        /* Fetch fresh sections so the drawer shows the updated cart */
        const sectionsUrl = '/cart?sections=cart-drawer,cart-icon-bubble';
        const sectionsRes = await fetch(sectionsUrl);
        const sections = await sectionsRes.json();

        cartDrawer.renderContents({ id: variant.id, sections: sections });
      } else {
        /* Fallback: redirect to cart page if drawer not present */
        window.location.href = '/cart';
      }
    } catch (err) {
      console.error('[sk-lp-cart-add]', err);
      /* Fallback: navigate to product page */
      window.location.href = '/products/' + handle;
    } finally {
      btn.classList.remove('is-loading');
    }
  });
})();
