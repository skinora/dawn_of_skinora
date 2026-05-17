/* =============================================================
   sk-lp-results-timeline — before/after comparison slider
   - Pointer Events (unified mouse/touch/pen)
   - Click anywhere on slider to jump
   - Drag handle (or anywhere on the image area)
   - Keyboard: ←/→ (step 2%), Home/End (0/100), Shift+arrows (step 10%)
   - One-time hint sweep on first viewport entry (skipped if reduced motion)
   - Multiple sliders per page; each independent
   - Re-init safe (Shopify theme editor)
   ============================================================= */

(function () {
  'use strict';

  function initSlider(slider) {
    if (!slider || slider.dataset.baInit === '1') return;
    slider.dataset.baInit = '1';

    var before = slider.querySelector('[data-ba-before]');
    var divider = slider.querySelector('[data-ba-divider]');
    var handle = slider.querySelector('[data-ba-handle]');
    if (!before || !divider || !handle) return;

    var pos = 50;

    function setPos(p) {
      pos = Math.max(0, Math.min(100, p));
      before.style.clipPath = 'inset(0 ' + (100 - pos) + '% 0 0)';
      divider.style.left = pos + '%';
      handle.style.left = pos + '%';
      handle.setAttribute('aria-valuenow', Math.round(pos));
    }

    function pctFromClientX(clientX) {
      var rect = slider.getBoundingClientRect();
      if (rect.width === 0) return pos;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    // Pointer drag
    var activePointer = null;

    function onPointerDown(e) {
      // Ignore non-primary pointers and right-click
      if (e.button !== undefined && e.button !== 0) return;
      activePointer = e.pointerId;
      try {
        slider.setPointerCapture(activePointer);
      } catch (err) {
        /* ignore */
      }
      setPos(pctFromClientX(e.clientX));
      e.preventDefault();
    }

    function onPointerMove(e) {
      if (e.pointerId !== activePointer) return;
      setPos(pctFromClientX(e.clientX));
    }

    function onPointerUp(e) {
      if (e.pointerId !== activePointer) return;
      try {
        slider.releasePointerCapture(activePointer);
      } catch (err) {
        /* ignore */
      }
      activePointer = null;
    }

    slider.addEventListener('pointerdown', onPointerDown);
    slider.addEventListener('pointermove', onPointerMove);
    slider.addEventListener('pointerup', onPointerUp);
    slider.addEventListener('pointercancel', onPointerUp);

    // Keyboard on handle
    handle.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 2;
      switch (e.key) {
        case 'ArrowLeft':
        case 'Left':
          setPos(pos - step);
          break;
        case 'ArrowRight':
        case 'Right':
          setPos(pos + step);
          break;
        case 'Home':
          setPos(0);
          break;
        case 'End':
          setPos(100);
          break;
        default:
          return;
      }
      e.preventDefault();
    });

    // Initial position
    setPos(50);

    // Hint sweep on first viewport entry (skipped if reduced motion)
    var prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      var hinted = false;
      var observer = new IntersectionObserver(
        function (entries) {
          if (!entries[0].isIntersecting || hinted) return;
          hinted = true;
          observer.disconnect();
          // Quick sweep: 50 → 75 → 50 over 1.2s
          var duration = 1200;
          var start = null;
          function sweep(ts) {
            if (start === null) start = ts;
            var elapsed = ts - start;
            var half = duration / 2;
            if (elapsed < half) {
              setPos(50 + 25 * (elapsed / half));
              requestAnimationFrame(sweep);
            } else if (elapsed < duration) {
              setPos(75 - 25 * ((elapsed - half) / half));
              requestAnimationFrame(sweep);
            } else {
              setPos(50);
            }
          }
          requestAnimationFrame(sweep);
        },
        { threshold: 0.4 }
      );
      observer.observe(slider);
    }
  }

  function initAll(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-ba-slider]').forEach(initSlider);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll();
    });
  } else {
    initAll();
  }

  // Re-init when Shopify theme editor reloads the section
  document.addEventListener('shopify:section:load', function (e) {
    initAll(e.target);
  });
})();
