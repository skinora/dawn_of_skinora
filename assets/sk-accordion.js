/**
 * sk-accordion.js  —  lightweight accordion toggle  (~0.5 KB)
 * Drop-in replacement for Bootstrap JS collapse in FAQ sections.
 * Re-uses the same data-bs-* attributes so zero markup changes needed.
 */
(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-bs-toggle="collapse"]');
    if (!btn) return;

    e.preventDefault();

    var targetSel = btn.getAttribute('data-bs-target');
    var target = targetSel && document.querySelector(targetSel);
    if (!target) return;

    var isOpen = target.classList.contains('show');

    /* ---- Accordion behaviour: close siblings first ---- */
    var parentSel = target.getAttribute('data-bs-parent');
    if (parentSel) {
      var parent = document.querySelector(parentSel);
      if (parent) {
        parent.querySelectorAll('.collapse.show').forEach(function (sib) {
          if (sib === target) return; /* skip the one we're toggling */
          sib.classList.remove('show');
          var sibBtn = parent.querySelector('[data-bs-target="#' + sib.id + '"]');
          if (sibBtn) {
            sibBtn.classList.add('collapsed');
            sibBtn.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    /* ---- Toggle current panel ---- */
    if (isOpen) {
      target.classList.remove('show');
      btn.classList.add('collapsed');
      btn.setAttribute('aria-expanded', 'false');
    } else {
      target.classList.add('show');
      btn.classList.remove('collapsed');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
})();
