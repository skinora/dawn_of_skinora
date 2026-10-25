/* sk-product-specifications — flyttet ut av sections/sk-product-specifications.liquid.
   Seksjons-id leses fra data-section-id på rotelementet. */
(function () {
  var wrap = document.querySelector('.sk-product-specifications .sk-specs__media');
  if (!wrap) return;

  var modelViewer = wrap.querySelector('model-viewer');
  if (modelViewer) {
    /* media_tag hard-coder background-color:#000000 inline på model-viewer;
       nulles ut her (kan ikke overstyres i CSS uten !important) slik at
       .sk-specs__media sin lyse bakgrunn vises. --poster-color røres ikke. */
    modelViewer.style.backgroundColor = 'transparent';

    /* Shopify-genererte poster-JPEG for 3D-modellen har helsvart bakgrunn
       bakt inn i selve bildefilen — fjernes så den lyse bakgrunnen vises
       under lasting og den transparente 3D-canvasen etterpå.
       MEN: removeAttribute('poster') + dismissPoster() trigger EAGER
       last av .glb + model-viewer-runtime. Kjørte vi det på sidelast,
       ble hele modellen (flere MB) lastet med en gang selv om seksjonen
       er langt nede på siden — det var tregheten. Utsett til seksjonen
       nærmer seg viewporten via IntersectionObserver. */
    var activateModel = function () {
      modelViewer.removeAttribute('poster');
      if (typeof modelViewer.dismissPoster === 'function') {
        modelViewer.dismissPoster();
      }
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries, obs) {
        for (var k = 0; k < entries.length; k++) {
          if (entries[k].isIntersecting) {
            obs.disconnect();
            activateModel();
            break;
          }
        }
      }, { rootMargin: '300px 0px' });
      io.observe(wrap);
    } else {
      activateModel();
    }
  }

  var hint = document.getElementById('sk-hint-' + document.querySelector('.sk-product-specifications').dataset.sectionId);
  if (!hint) return;

  var mq = window.matchMedia && window.matchMedia('(max-width: 990px)');

  var hidden = false;
  var hide = function () {
    if (hidden) return;
    hidden = true;
    hint.classList.add('is-hidden');
  };

  var applyMobileZoom = function () {
    if (!modelViewer || !mq || !mq.matches) return;

    try {
      if (typeof modelViewer.getCameraOrbit === 'function') {
        var orbit = modelViewer.getCameraOrbit();
        if (orbit && typeof orbit.radius === 'number' && orbit.radius > 0) {
          var nextRadius = orbit.radius * 0.85;
          modelViewer.setAttribute(
            'camera-orbit',
            orbit.theta + 'rad ' + orbit.phi + 'rad ' + nextRadius + 'm'
          );
          return;
        }
      }

      modelViewer.setAttribute('camera-orbit', '0deg 75deg 2.6m');
    } catch (e) {
      // no-op
    }
  };

  if (modelViewer) {
    modelViewer.addEventListener('load', applyMobileZoom);
  }

  wrap.addEventListener('pointerdown', hide, { passive: true });
  wrap.addEventListener('touchstart', hide, { passive: true });
  wrap.addEventListener('mousedown', hide);

  setTimeout(hide, 5500);
})();
