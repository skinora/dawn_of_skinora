/**
 * Okendo Product Listing Star Rating Handler
 * Ensures Okendo widgets are initialized/refreshed when product grids are dynamically updated
 * (AJAX filters, infinite scroll, predictive search, etc.)
 */

(function () {
  'use strict';

  // Configuration
  const CONFIG = {
    debounceDelay: 300,
    selectors: {
      productGrid: '.product-grid, .sk-product-listing__grid, .collection-product-list',
      okendoWidget: '[data-oke-reviews-product-listing-star-rating]',
    },
  };

  let debounceTimer = null;

  /**
   * Initialize or refresh Okendo widgets
   */
  function refreshOkendoWidgets() {
    // Check if Okendo is loaded
    if (typeof window.okeWidgetApi === 'undefined' || !window.okeWidgetApi) {
      console.warn('Okendo: API not yet loaded, retrying...');
      setTimeout(refreshOkendoWidgets, 500);
      return;
    }

    try {
      // Trigger Okendo widget initialization
      window.okeWidgetApi.initWidget('all');

      if (window.skDebug) {
        console.log('Okendo: Widgets refreshed');
      }
    } catch (error) {
      console.error('Okendo: Failed to refresh widgets', error);
    }
  }

  /**
   * Debounced refresh to avoid excessive calls
   */
  function debouncedRefresh() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(refreshOkendoWidgets, CONFIG.debounceDelay);
  }

  /**
   * Set up MutationObserver to watch for DOM changes in product grids
   */
  function setupMutationObserver() {
    const productGrids = document.querySelectorAll(CONFIG.selectors.productGrid);

    if (productGrids.length === 0) {
      if (window.skDebug) {
        console.log('Okendo: No product grids found');
      }
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let shouldRefresh = false;

      mutations.forEach((mutation) => {
        // Check if Okendo widgets were added/removed
        if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
          const hasOkendoWidget = Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeType === 1 &&
              ((node.matches && node.matches(CONFIG.selectors.okendoWidget)) ||
                (node.querySelector && node.querySelector(CONFIG.selectors.okendoWidget)))
          );

          if (hasOkendoWidget) {
            shouldRefresh = true;
          }
        }
      });

      if (shouldRefresh) {
        debouncedRefresh();
      }
    });

    // Observe each product grid
    productGrids.forEach((grid) => {
      observer.observe(grid, {
        childList: true,
        subtree: true,
      });
    });

    if (window.skDebug) {
      console.log(`Okendo: Watching ${productGrids.length} product grid(s) for changes`);
    }
  }

  /**
   * Initialize on page load
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    // Initial refresh after a short delay (allow Okendo script to load)
    setTimeout(() => {
      refreshOkendoWidgets();
      setupMutationObserver();
    }, 1000);

    // Listen for Shopify section reloads (theme editor)
    document.addEventListener('shopify:section:load', debouncedRefresh);
    document.addEventListener('shopify:section:reorder', debouncedRefresh);

    if (window.skDebug) {
      console.log('Okendo: Product listing handler initialized');
    }
  }

  // Start initialization
  init();
})();
