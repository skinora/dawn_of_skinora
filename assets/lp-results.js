(function () {
  function initSection(section) {
    if (!section || section.dataset.lpResultsInit === '1') return;
    var grid = section.querySelector('.lp-results__timeline');
    var dots = section.querySelectorAll('.lp-results__dot');
    if (!grid || !dots.length) return;
    var cards = grid.querySelectorAll('.lp-results__step');
    if (!cards.length) return;

    section.dataset.lpResultsInit = '1';

    function setActive(i) {
      dots.forEach(function (d, di) {
        d.setAttribute('aria-current', di === i ? 'true' : 'false');
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var i = Number(dot.dataset.index);
        var card = cards[i];
        if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      });
    });

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
    setActive(0);

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

  function initAll() {
    document.querySelectorAll('.lp-results').forEach(initSection);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (e) {
    var sec = e.target.querySelector('.lp-results');
    if (sec) initSection(sec);
  });
})();
