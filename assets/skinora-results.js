/* skinora-results.js
   Mobile carousel: dot navigation, active-dot tracking via IntersectionObserver,
   keyboard arrow support. Desktop is a static 3-up flex row — JS is a no-op there. */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  function init(section) {
    if (!section || section.dataset.srInit === '1') return;
    section.dataset.srInit = '1';

    var grid = section.querySelector('.skinora-results__grid');
    var dots = section.querySelectorAll('.skinora-results__dot');
    if (!grid || !dots.length) return;

    var cards = grid.querySelectorAll('.skinora-results__card');
    if (!cards.length) return;

    function setActive(i) {
      dots.forEach(function (d, di) {
        d.setAttribute('aria-current', di === i ? 'true' : 'false');
      });
    }

    // Tap dot → scroll to corresponding card
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var i = Number(dot.dataset.index || 0);
        var card = cards[i];
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
    });

    setActive(0);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
              var i = Array.prototype.indexOf.call(cards, entry.target);
              if (i >= 0) setActive(i);
            }
          });
        },
        { root: grid, threshold: [0.6] },
      );
      cards.forEach(function (c) {
        io.observe(c);
      });
    }

    // Keyboard support on the carousel container
    grid.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var current = -1;
      dots.forEach(function (d, di) {
        if (d.getAttribute('aria-current') === 'true') current = di;
      });
      if (current < 0) current = 0;
      var next = e.key === 'ArrowRight' ? Math.min(current + 1, cards.length - 1) : Math.max(current - 1, 0);
      cards[next].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  function boot() {
    document.querySelectorAll('.skinora-results').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', function (e) {
    var s = e.target.querySelector('.skinora-results');
    if (s) init(s);
  });
})();
