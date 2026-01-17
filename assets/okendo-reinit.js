(function () {
  function debounce(fn, wait) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  // Try to re-initialize Okendo widgets if API exists.
  // We must not assume an exact function name; check available globals.
  function tryRenderOkendo() {
    try {
      // Common patterns: Okendo attaches something on window.okeReviews or window.okendo
      // Since API names can change, attempt a few safe calls if present.
      if (window.okeReviews && typeof window.okeReviews.refresh === 'function') {
        window.okeReviews.refresh();
        return;
      }
      if (window.okendo && typeof window.okendo.refresh === 'function') {
        window.okendo.refresh();
        return;
      }
      if (window.Okendo && typeof window.Okendo.refresh === 'function') {
        window.Okendo.refresh();
        return;
      }
      // If no API is exposed, do nothing. Okendo may auto-scan on load only.
    } catch (e) {
      // no-op
    }
  }

  const debouncedRender = debounce(tryRenderOkendo, 250);

  // Observe product grids and rerun when new nodes inserted
  document.addEventListener('DOMContentLoaded', function () {
    const targets = [
      document.querySelector('[data-section-type="main-collection-product-grid"]'),
      document.querySelector('.product-grid'),
      document.querySelector('#ProductGridContainer'),
      document.body,
    ].filter(Boolean);

    const observer = new MutationObserver(function (mutations) {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches && (node.matches('.okeReviews') || node.querySelector('.okeReviews'))) {
            debouncedRender();
            return;
          }
        }
      }
    });

    targets.forEach((t) => observer.observe(t, { childList: true, subtree: true }));
  });
})();
