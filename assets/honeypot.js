/* ============================================================
   HONEYPOT — 2-layer anti-spam for contact forms
   Layer 1: Hidden honeypot field (catches auto-fill bots)
   Layer 2: Time-based validation (catches instant-submit bots)

   Usage:
     Works automatically on any form containing
     the class "hp-protected" or [data-hp-protected].
   ============================================================ */

(function initHoneypot() {
  'use strict';

  var MIN_SUBMIT_TIME_MS = 3000; // 3 seconds minimum
  var DEBUG = new URLSearchParams(window.location.search).has('skdebug');

  function log() {
    if (DEBUG) {
      console.log.apply(console, ['[Honeypot]'].concat(Array.prototype.slice.call(arguments)));
    }
  }

  /**
   * Initialise honeypot protection on a single form element.
   */
  function protectForm(form) {
    if (form.dataset.hpInitialised) return;
    form.dataset.hpInitialised = 'true';

    // ── Layer 2: Timestamp ──────────────────────────────────
    var loadTime = Date.now();
    var tsField = form.querySelector('#hp-timestamp');
    if (tsField) {
      tsField.value = loadTime.toString();
    }

    log('Form protected.');

    // ── Submit handler ──────────────────────────────────────
    form.addEventListener('submit', function (e) {
      var errors = [];

      // Layer 1: Honeypot field must be empty
      var honeypotField = form.querySelector('#hp-website');
      if (honeypotField && honeypotField.value.trim() !== '') {
        errors.push('honeypot');
        log('BLOCKED – honeypot field filled:', honeypotField.value);
      }

      // Layer 2: Time check
      var elapsed = Date.now() - loadTime;
      if (elapsed < MIN_SUBMIT_TIME_MS) {
        errors.push('time');
        log('BLOCKED – too fast:', elapsed + 'ms (min ' + MIN_SUBMIT_TIME_MS + 'ms)');
      }

      // Block submission if any layer fails
      if (errors.length > 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
        log('Submission blocked. Failed layers:', errors.join(', '));

        // Honeypot/time failures = definite bot – silently fail.
        return false;
      }

      log('Submission allowed. Elapsed:', elapsed + 'ms');
    });
  }

  // ── Auto-init ───────────────────────────────────────────
  function init() {
    var forms = document.querySelectorAll('.hp-protected, [data-hp-protected]');
    forms.forEach(protectForm);
    log('Initialised on', forms.length, 'form(s)');
  }

  // Run on DOMContentLoaded, or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
