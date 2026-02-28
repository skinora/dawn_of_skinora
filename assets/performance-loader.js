/**
 * performance-loader.js — lightweight lazy-loading primitives.
 *
 * Usage:
 *   window.SKLoader.onIdle(src, { timeout: 5000 })
 *   window.SKLoader.onVisible(src, '#reviews')
 *   window.SKLoader.onInteraction(src)
 *   window.SKLoader.css(href)            // deferred CSS link
 *   window.SKLoader.onInteraction(src, { events: ['click'], target: '#my-btn' })
 */
(function () {
  'use strict';

  var loaded = {};

  function injectScript(src) {
    if (loaded[src]) return;
    loaded[src] = true;
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }

  function injectCSS(href) {
    if (loaded[href]) return;
    loaded[href] = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.media = 'print';
    l.onload = function () {
      this.media = 'all';
    };
    document.head.appendChild(l);
  }

  /**
   * Load script when the browser is idle.
   * @param {string} src - Script URL
   * @param {object} [opts]
   * @param {number} [opts.timeout=5000] - max wait (ms) before forcing load
   */
  function onIdle(src, opts) {
    var timeout = (opts && opts.timeout) || 5000;
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        function () {
          injectScript(src);
        },
        { timeout: timeout },
      );
    } else {
      setTimeout(function () {
        injectScript(src);
      }, timeout);
    }
  }

  /**
   * Load script when a target element scrolls into view.
   * @param {string} src - Script URL
   * @param {string} selector - CSS selector to observe
   * @param {object} [opts]
   * @param {string} [opts.rootMargin='200px'] - IntersectionObserver root margin
   */
  function onVisible(src, selector, opts) {
    var rootMargin = (opts && opts.rootMargin) || '200px';

    function go() {
      var el = document.querySelector(selector);
      if (!el) {
        onIdle(src);
        return;
      }
      if (!('IntersectionObserver' in window)) {
        onIdle(src);
        return;
      }

      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              injectScript(src);
              io.disconnect();
              return;
            }
          }
        },
        { rootMargin: rootMargin },
      );
      io.observe(el);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', go);
    } else {
      go();
    }
  }

  /**
   * Load script on first user interaction.
   * @param {string} src - Script URL
   * @param {object} [opts]
   * @param {string[]} [opts.events] - DOM events to listen for (default: mouseover, touchstart, scroll, keydown)
   * @param {string|Element} [opts.target] - Selector or element to listen on (default: document)
   */
  function onInteraction(src, opts) {
    var events = (opts && opts.events) || ['mouseover', 'touchstart', 'scroll', 'keydown'];
    var target = document;
    if (opts && opts.target) {
      target = typeof opts.target === 'string' ? document.querySelector(opts.target) || document : opts.target;
    }
    function handler() {
      injectScript(src);
      events.forEach(function (e) {
        target.removeEventListener(e, handler);
      });
    }
    events.forEach(function (e) {
      target.addEventListener(e, handler, { once: true, passive: true });
    });
  }

  window.SKLoader = {
    onIdle: onIdle,
    onVisible: onVisible,
    onInteraction: onInteraction,
    css: injectCSS,
    inject: injectScript,
  };
})();
