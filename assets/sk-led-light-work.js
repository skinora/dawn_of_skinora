/* sk-led-light-work — flyttet ut av sections/sk-led-light-work.liquid. */
/* Shimmer-animasjonen er fjernet sammen med kortdesignet. Den svepte en
   gradient over merket hvert gang kortet kom i viewport - dekorativ
   bevegelse uten informasjonsverdi, og en IntersectionObserver per kort
   i kjoeretid. Funksjonene beholdes som tomme saa kallstedene under ikke
   brekker; de kan fjernes naar noen gaar gjennom JS-en i seksjonen. */
function skTriggerShimmer() {}
function skTriggerAllShimmers() {}
function skInitShimmerObserver() { return null; }

document.addEventListener('DOMContentLoaded', function () {
  var sectionEl = document.querySelector('.sk-wavelengths');
  if (!sectionEl) {
    skTriggerAllShimmers();
    return;
  }

  skInitShimmerObserver(sectionEl);

  /* --- Mobile scroll-snap carousel --- */
  var track = sectionEl.querySelector('.sk-llw-track');
  var slides = sectionEl.querySelectorAll('.sk-llw-slide');
  var dots = sectionEl.querySelectorAll('.sk-llw-dot');
  var prevBtn = sectionEl.querySelector('.sk-wavelengths__arrow--prev');
  var nextBtn = sectionEl.querySelector('.sk-wavelengths__arrow--next');
  if (!track || !slides.length) {
    skTriggerAllShimmers(sectionEl);
    return;
  }

  var activeIndex = 0;

  function setActive(idx) {
    if (idx === activeIndex && idx !== 0) return;
    activeIndex = idx;
    dots.forEach(function (d, i) {
      d.classList.toggle('sk-llw-dot--active', i === idx);
    });
    /* Shimmer on active slide */
    if (slides[idx]) {
      slides[idx].querySelectorAll('.sk-tag').forEach(skTriggerShimmer);
    }
    updateArrows();
  }

  /* Track active slide via IntersectionObserver */
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.5) {
          setActive(Array.prototype.indexOf.call(slides, e.target));
        }
      });
    },
    { root: track, threshold: 0.5 }
  );
  slides.forEach(function (s) {
    io.observe(s);
  });

  function updateArrows() {
    if (!prevBtn || !nextBtn) return;
    prevBtn.dataset.visible = track.scrollLeft > 2 ? 'true' : 'false';
    nextBtn.dataset.visible = track.scrollLeft + track.clientWidth < track.scrollWidth - 2 ? 'true' : 'false';
  }
  var arrowTicking = false;
  track.addEventListener(
    'scroll',
    function () {
      if (!arrowTicking) {
        arrowTicking = true;
        requestAnimationFrame(function () {
          updateArrows();
          arrowTicking = false;
        });
      }
    },
    { passive: true }
  );

  /* Cache slide width — updated via ResizeObserver to avoid per-click reflow */
  var cachedSlideW = slides[0] ? slides[0].offsetWidth + 20 : 0;
  if (window.ResizeObserver && slides[0]) {
    new ResizeObserver(function (entries) {
      cachedSlideW = entries[0].contentRect.width + 20;
    }).observe(slides[0]);
  }
  function step(dir) {
    track.scrollBy({ left: dir * cachedSlideW, behavior: 'smooth' });
  }
  if (prevBtn)
    prevBtn.addEventListener('click', function () {
      step(-1);
    });
  if (nextBtn)
    nextBtn.addEventListener('click', function () {
      step(1);
    });

  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      var i = parseInt(d.dataset.index, 10);
      if (slides[i]) slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    });
  });

  updateArrows();
  requestAnimationFrame(function () {
    skTriggerAllShimmers(sectionEl);
  });
});
