/* =============================================================================
   skinora-video-story.js
   Styrer hver [data-video-story] for seg (flere forekomster kolliderer ikke):
   - laster videokilden først når seksjonen nærmer seg skjermen
   - spiller kun når videoen er synlig, pauser utenfor
   - prefers-reduced-motion: ingen autoplay, poster + play-knapp
   - lydknapp, og myk rulling fra knappen til kjøpsskjemaet
   ============================================================================= */
(function () {
  if (window.skinoraVideoStoryInit) return;
  window.skinoraVideoStoryInit = true;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function findBuyTarget(hash) {
    var id = hash && hash.charAt(0) === '#' ? hash.slice(1) : '';
    var el = id ? document.getElementById(id) : null;
    if (el) return el;
    // #product-form finnes ikke som id i temaet; skjemaet heter product-form-<seksjon>.
    return (
      document.querySelector('[id^="MainProduct-"] form[id^="product-form-"]') ||
      document.querySelector('form[id^="product-form-"]') ||
      document.querySelector('product-form, form[action*="/cart/add"]')
    );
  }

  function initCta(root) {
    var cta = root.querySelector('[data-vs-cta]');
    if (!cta) return;
    var href = cta.getAttribute('href') || '';
    if (href.charAt(0) !== '#') return;
    cta.addEventListener('click', function (e) {
      var target = findBuyTarget(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
      var button = target.querySelector('button[type="submit"], [name="add"]');
      if (button) {
        try {
          button.focus({ preventScroll: true });
        } catch (err) {
          /* eldre nettlesere */
        }
      }
    });
  }

  function initFile(root, video) {
    var playBtn = root.querySelector('[data-vs-play]');
    var soundBtn = root.querySelector('[data-vs-sound]');
    var soundLabel = root.querySelector('[data-vs-sound-label]');
    var loaded = false;
    var visible = false;
    var userPaused = false;
    var userStarted = false;

    function load() {
      if (loaded) return;
      loaded = true;
      video.querySelectorAll('source[data-src]').forEach(function (s) {
        s.src = s.getAttribute('data-src');
        s.removeAttribute('data-src');
      });
      video.load();
    }

    function canAutoplay() {
      return !reduceMotion.matches || userStarted;
    }

    function tryPlay() {
      if (!visible || userPaused || !canAutoplay()) return;
      load();
      var p = video.play();
      if (p && p.catch) {
        p.catch(function () {
          // Strømsparing o.l. blokkerer autoplay – vis play-knappen i stedet.
          if (playBtn) playBtn.hidden = false;
        });
      }
    }

    video.addEventListener('playing', function () {
      if (playBtn) playBtn.hidden = true;
    });
    video.addEventListener('pause', function () {
      // Pause fra kontrollene (show_controls) skal ikke overstyres av observeren.
      if (visible && !document.hidden && video.controls) userPaused = true;
    });

    if (playBtn) {
      if (reduceMotion.matches) playBtn.hidden = false;
      playBtn.addEventListener('click', function () {
        userStarted = true;
        userPaused = false;
        load();
        video.play();
      });
    }

    var unmuteBtn = root.querySelector('[data-vs-unmute]');

    function setSound(on) {
      video.muted = !on;
      if (soundBtn) {
        var text = on ? 'Slå av lyd' : 'Slå på lyd';
        soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        soundBtn.setAttribute('aria-label', text);
        if (soundLabel) soundLabel.textContent = text;
      }
      // Den store ▶ har gjort jobben sin når lyden først er på.
      if (on && unmuteBtn) unmuteBtn.hidden = true;
      if (on && video.paused) {
        userStarted = true;
        userPaused = false;
        load();
        video.play();
      }
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        setSound(video.muted);
      });
    }

    if (unmuteBtn) {
      unmuteBtn.addEventListener('click', function () {
        load();
        try {
          video.currentTime = 0;
        } catch (err) {
          /* metadata ikke lastet ennå – starter uansett fra 0 */
        }
        setSound(true);
      });
    }

    var preloadObs = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          load();
          preloadObs.disconnect();
        }
      },
      { rootMargin: '300px 0px' }
    );
    preloadObs.observe(video);

    var playObs = new IntersectionObserver(
      function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          tryPlay();
        } else if (!video.paused) {
          video.pause();
        }
      },
      { threshold: 0.35 }
    );
    playObs.observe(video);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) video.pause();
      else tryPlay();
    });
  }

  function initEmbed(root, frame) {
    var type = frame.getAttribute('data-vs-embed');
    var playBtn = root.querySelector('[data-vs-play]');
    var soundBtn = root.querySelector('[data-vs-sound]');
    var soundLabel = root.querySelector('[data-vs-sound-label]');
    var loaded = false;
    var ready = false;
    var muted = true;
    var userStarted = false;
    var visible = false;

    function send(cmd) {
      if (!frame.contentWindow) return;
      var msg =
        type === 'youtube'
          ? JSON.stringify({ event: 'command', func: cmd, args: [] })
          : JSON.stringify({
              method: { playVideo: 'play', pauseVideo: 'pause', mute: 'setMuted', unMute: 'setMuted' }[cmd],
              value: cmd === 'mute'
            });
      frame.contentWindow.postMessage(msg, '*');
    }

    function load() {
      if (loaded) return;
      loaded = true;
      var src = frame.getAttribute('data-src');
      var autoplay = !reduceMotion.matches || userStarted;
      src += '&autoplay=' + (autoplay ? 1 : 0);
      frame.addEventListener('load', function () {
        ready = true;
        if (visible && (!reduceMotion.matches || userStarted)) send('playVideo');
      });
      frame.src = src;
    }

    if (playBtn && reduceMotion.matches) {
      playBtn.hidden = false;
      playBtn.addEventListener('click', function () {
        userStarted = true;
        playBtn.hidden = true;
        if (loaded && ready) send('playVideo');
        else load();
      });
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        muted = !muted;
        send(muted ? 'mute' : 'unMute');
        var text = muted ? 'Slå på lyd' : 'Slå av lyd';
        soundBtn.setAttribute('aria-pressed', muted ? 'false' : 'true');
        soundBtn.setAttribute('aria-label', text);
        if (soundLabel) soundLabel.textContent = text;
      });
    }

    new IntersectionObserver(
      function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) {
          if (reduceMotion.matches && !userStarted) return;
          if (!loaded) load();
          else if (ready) send('playVideo');
        } else if (ready) {
          send('pauseVideo');
        }
      },
      { threshold: 0.35 }
    ).observe(frame);
  }

  function init(root) {
    if (root.dataset.vsReady) return;
    root.dataset.vsReady = 'true';
    initCta(root);
    var video = root.querySelector('[data-vs-video]');
    var frame = root.querySelector('[data-vs-embed]');
    if (video) initFile(root, video);
    else if (frame) initEmbed(root, frame);
  }

  function initAll() {
    document.querySelectorAll('[data-video-story]').forEach(init);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();

  // Temaredigeringsprogrammet laster seksjonen på nytt ved endringer.
  document.addEventListener('shopify:section:load', function (e) {
    var root = e.target.querySelector('[data-video-story]');
    if (root) init(root);
  });
})();
