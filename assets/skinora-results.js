/* skinora-results.js
   Minimal IntersectionObserver: stagger-reveal cards and trigger connector. */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function init(root) {
    if (!root || root.dataset.skinoraResultsInit === '1') return;
    root.dataset.skinoraResultsInit = '1';

    var cards = root.querySelectorAll('.skinora-results__card');

    if (!('IntersectionObserver' in window)) {
      // Graceful fallback: just show everything
      root.classList.add('is-visible');
      cards.forEach(function (c) {
        c.classList.add('is-visible');
      });
      return;
    }

    // Stagger reveal per card
    var cardObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var card = entry.target;
          var delay = parseInt(card.dataset.delay || '0', 10);
          setTimeout(function () {
            card.classList.add('is-visible');
          }, delay);
          obs.unobserve(card);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );

    cards.forEach(function (card, i) {
      card.dataset.delay = String(i * 150);
      cardObserver.observe(card);
    });

    // Section-level observer for connector animation
    var rootObserver = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          root.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.2 },
    );
    rootObserver.observe(root);

    // Align horizontal connector to vertical center of the numbered circles.
    // Circles sit at the seam between image (4:5) and panel.
    function alignConnector() {
      if (window.innerWidth < 1024) return;
      var firstCard = root.querySelector('.skinora-results__card');
      var num = firstCard && firstCard.querySelector('.skinora-results__num');
      var grid = root.querySelector('.skinora-results__grid');
      if (!num || !grid) return;
      var gridRect = grid.getBoundingClientRect();
      var numRect = num.getBoundingClientRect();
      var topPx = numRect.top - gridRect.top + numRect.height / 2;
      // Convert to % of grid height for stable behavior on resize
      var pct = (topPx / gridRect.height) * 100;
      root.style.setProperty('--sr-h-connector-top', pct + '%');
    }

    alignConnector();
    var resizeRaf;
    window.addEventListener(
      'resize',
      function () {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(alignConnector);
      },
      { passive: true },
    );
  }

  function boot() {
    document.querySelectorAll('.skinora-results').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Re-init when Shopify theme editor reloads section
  document.addEventListener('shopify:section:load', function (e) {
    var s = e.target.querySelector('.skinora-results');
    if (s) init(s);
  });
})();
