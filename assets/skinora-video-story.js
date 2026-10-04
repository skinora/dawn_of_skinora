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

  // GA4-hendelser via sidens egen gtag (lastes av Google & YouTube-appen – vi
  // venter på den, definerer den aldri). Navnene er registrert i GA4; ikke
  // endre dem uten å oppdatere de egendefinerte dimensjonene der.
  function track(root, name, params) {
    var payload = params || {};
    payload.video_placement = root.getAttribute('data-vs-placement') || 'pdp';
    (function waitForGtag(triesLeft) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, payload);
        return;
      }
      if (triesLeft > 0) setTimeout(function () { waitForGtag(triesLeft - 1); }, 250);
    })(20);
  }

  // position: «below» = knappen under videoen (eneste plassering i dag).
  function initCta(root, cta, position) {
    if (!cta) return;
    cta.addEventListener('click', function () {
      var video = root.querySelector('[data-vs-video]');
      track(root, 'video_story_cta_click', {
        cta_position: position,
        with_sound: video && !video.muted ? 'true' : 'false'
      });
    });
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

    var soundStarted = false;

    function setSound(on) {
      // Første gang lyden slås på – uansett knapp – starter videoen fra
      // begynnelsen, så man ikke hører den midt i en setning.
      if (on && !soundStarted) {
        soundStarted = true;
        track(root, 'video_story_unmute', { with_sound: 'true' });
        load();
        try {
          video.currentTime = 0;
        } catch (err) {
          /* metadata ikke lastet ennå – starter uansett fra 0 */
        }
      }
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
        setSound(true);
      });
    }

    // Videoen går i løkke, så «ended» utløses aldri. Sett ferdig = spilt til
    // siste halve sekund. Sendes én gang dempet og én gang med lyd per sidevisning,
    // slik at with_sound skiller den dempede løkken fra en reell visning.
    var completed = { 'true': false, 'false': false };
    var endcard = root.querySelector('[data-vs-endcard]');
    var replayBtn = root.querySelector('[data-vs-replay]');

    video.addEventListener('timeupdate', function () {
      if (!video.duration || video.currentTime < video.duration - 0.5) return;
      var withSound = video.muted ? 'false' : 'true';
      if (!completed[withSound]) {
        completed[withSound] = true;
        track(root, 'video_story_complete', { with_sound: withSound });
      }
      // Sluttkort bare for den som valgte lyd – den dempede løkken går videre.
      if (withSound === 'true' && endcard && endcard.hidden) {
        userPaused = true;
        video.pause();
        endcard.hidden = false;
      }
    });

    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        endcard.hidden = true;
        userPaused = false;
        userStarted = true;
        try {
          video.currentTime = 0;
        } catch (err) {
          /* starter uansett fra begynnelsen ved neste løkke */
        }
        video.play();
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
        if (!muted && !root.dataset.vsUnmuteTracked) {
          root.dataset.vsUnmuteTracked = 'true';
          track(root, 'video_story_unmute', { with_sound: 'true' });
        }
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
    initCta(root, root.querySelector('[data-vs-cta]'), 'below');
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
