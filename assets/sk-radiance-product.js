/* sk-radiance-product — flyttet ut av sections/sk-radiance-product.liquid.
   Verdiene som før kom fra Liquid (seksjons-id, pengeformat, produkt og
   variant) leses fra <script type="application/json" data-sk-rp-config> i
   seksjonen. */
(function () {
  const cfgEl = document.querySelector('script[data-sk-rp-config]');
  if (!cfgEl) return;
  const cfg = JSON.parse(cfgEl.textContent);
  document.addEventListener('DOMContentLoaded', async function () {
    // =========================
    // HERO SWIPER
    // =========================
    (function initHeroSwiper() {
      if (typeof Swiper === 'undefined') return;

      const sectionEl = document.getElementById('sk-radiance-product-hero-' + cfg.sectionId);
      if (!sectionEl) return;

      const swiperRoot = sectionEl.querySelector('.sk-hero-media-swiper');
      if (!swiperRoot) return;

      const swiperElement = swiperRoot.querySelector('.swiper') || swiperRoot;
      if (!swiperElement) return;

      const prevButton = swiperRoot.querySelector('.sk-hero-arrow--prev');
      const nextButton = swiperRoot.querySelector('.sk-hero-arrow--next');
      const thumbnails = sectionEl.querySelectorAll('.sk-hero-thumb img');
      const galleryPrevButton = sectionEl.querySelector('.sk-hero-gallery-controls .sk-hero-arrow--prev');
      const galleryNextButton = sectionEl.querySelector('.sk-hero-gallery-controls .sk-hero-arrow--next');
      const galleryRow = sectionEl.querySelector('.sk-hero-gallery');

      const slideCount = thumbnails.length || swiperElement.querySelectorAll('.swiper-slide').length;
      const shouldLoop = slideCount > 1;

      /* slidesPerView: 1 — IKKE endre til en broekdel her.
         Et forsoek paa peek-kant (1.08, senere 1.18) ble rullet tilbake:
         hero-bildene har tekst bakt inn i selve filen ("UKE 4-6",
         "JEVNERE HUDTONE" osv.), og siden slidene bruker
         object-fit: cover, beskjaerer en smalere slide teksten bort.
         Paa 375px krympet sliden fra 375 til 316 px og kuttet ordene i
         begge kanter.

         Peek er dessuten feil virkemiddel for dette galleriet: kantene av
         produktbildene er samme flate krem (maalt rgb(244,236,228) paa
         begge sider), saa selv en bred kant hadde ingenting aa vise.
         Karusellene som TAALER peek er sk-before-after og
         sk-led-light-work — der er kortene innholdsrike helt ut i kanten. */
      const swiperOptions = {
        slidesPerView: 1,
        loop: shouldLoop,
        allowTouchMove: true,
        speed: 400,
      };
      if (prevButton && nextButton) swiperOptions.navigation = { prevEl: prevButton, nextEl: nextButton };

      const heroSwiper = new Swiper(swiperElement, swiperOptions);

      /* Ruller kun raden sidelengs. scrollIntoView ville ogsaa flyttet
         selve siden naar raden ligger utenfor skjermen. */
      function centerThumbInRow(thumb) {
        if (!galleryRow || !thumb) return;
        const rowRect = galleryRow.getBoundingClientRect();
        const thumbRect = thumb.getBoundingClientRect();
        if (!rowRect.width) return;
        const left = galleryRow.scrollLeft + (thumbRect.left - rowRect.left) - (rowRect.width - thumbRect.width) / 2;
        galleryRow.scrollTo({ left: left, behavior: 'smooth' });
      }

      function updateActiveThumb(index) {
        thumbnails.forEach((thumb, thumbIndex) => {
          thumb.classList.toggle('is-active', thumbIndex === index);
        });
        centerThumbInRow(thumbnails[index]);
      }

      updateActiveThumb(typeof heroSwiper.realIndex === 'number' ? heroSwiper.realIndex : heroSwiper.activeIndex || 0);

      heroSwiper.on('slideChange', function () {
        const index = typeof heroSwiper.realIndex === 'number' ? heroSwiper.realIndex : heroSwiper.activeIndex;
        updateActiveThumb(index);
      });

      thumbnails.forEach((thumb, index) => {
        thumb.addEventListener('click', function () {
          if (shouldLoop && typeof heroSwiper.slideToLoop === 'function') {
            heroSwiper.slideToLoop(index);
            return;
          }
          heroSwiper.slideTo(index);
        });
      });

      function scrollGallery(direction) {
        if (!galleryRow) return;
        const step = Math.max(150, galleryRow.clientWidth * 0.6);
        galleryRow.scrollBy({ left: direction === 'next' ? step : -step, behavior: 'smooth' });
      }

      if (galleryPrevButton) galleryPrevButton.addEventListener('click', () => scrollGallery('prev'));
      if (galleryNextButton) galleryNextButton.addEventListener('click', () => scrollGallery('next'));

      // ---- Lightbox: klikk på hero-bilde forstørrer galleriet ----
      const lightbox = document.getElementById('sk-hero-lightbox-' + cfg.sectionId);
      if (lightbox) {
        const lbSlides = Array.from(lightbox.querySelectorAll('.sk-hero-lightbox__slide'));
        const lbCounter = lightbox.querySelector('.sk-hero-lightbox__counter');
        const lbClose = lightbox.querySelector('.sk-hero-lightbox__close');
        const lbPrev = lightbox.querySelector('.sk-hero-lightbox__nav--prev');
        const lbNext = lightbox.querySelector('.sk-hero-lightbox__nav--next');
        let lbIndex = 0;
        let lastFocused = null;

        function lbSetActive(index) {
          lbIndex = (index + lbSlides.length) % lbSlides.length;
          lbSlides.forEach((slide, i) => slide.classList.toggle('is-active', i === lbIndex));
          if (lbCounter) lbCounter.textContent = lbIndex + 1 + ' / ' + lbSlides.length;
        }

        function lbOnKeydown(e) {
          if (e.key === 'Escape') closeLightbox();
          else if (e.key === 'ArrowLeft') lbSetActive(lbIndex - 1);
          else if (e.key === 'ArrowRight') lbSetActive(lbIndex + 1);
        }

        function openLightbox(index) {
          lastFocused = document.activeElement;
          lbSetActive(index);
          lightbox.hidden = false;
          document.body.style.overflow = 'hidden';
          document.addEventListener('keydown', lbOnKeydown);
          if (lbClose) lbClose.focus();
        }

        function closeLightbox() {
          lightbox.hidden = true;
          document.body.style.overflow = '';
          document.removeEventListener('keydown', lbOnKeydown);
          if (shouldLoop && typeof heroSwiper.slideToLoop === 'function') heroSwiper.slideToLoop(lbIndex);
          else heroSwiper.slideTo(lbIndex);
          if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
        }

        swiperElement.addEventListener('click', function (e) {
          if (!e.target.closest('.swiper-slide img')) return;
          const index = typeof heroSwiper.realIndex === 'number' ? heroSwiper.realIndex : heroSwiper.activeIndex || 0;
          openLightbox(index);
        });

        if (lbClose) lbClose.addEventListener('click', closeLightbox);
        if (lbPrev) lbPrev.addEventListener('click', () => lbSetActive(lbIndex - 1));
        if (lbNext) lbNext.addEventListener('click', () => lbSetActive(lbIndex + 1));

        // Klikk på bakgrunnen (utenfor selve bildet) lukker
        lightbox.addEventListener('click', function (e) {
          if (
            e.target.classList.contains('sk-hero-lightbox__slide')
            || e.target.classList.contains('sk-hero-lightbox__stage')
          ) {
            closeLightbox();
          }
        });

        // Swipe på mobil
        let lbStartX = 0;
        let lbSwiping = false;
        lightbox.addEventListener(
          'touchstart',
          function (e) {
            if (!e.touches || e.touches.length !== 1) return;
            lbStartX = e.touches[0].clientX;
            lbSwiping = true;
          },
          { passive: true }
        );
        lightbox.addEventListener('touchend', function (e) {
          if (!lbSwiping || !e.changedTouches || e.changedTouches.length !== 1) return;
          const deltaX = e.changedTouches[0].clientX - lbStartX;
          if (Math.abs(deltaX) > 40) lbSetActive(deltaX < 0 ? lbIndex + 1 : lbIndex - 1);
          lbSwiping = false;
        });
      }
    })();

    // =========================
    // OFFER SWITCHING (Single vs Bundle)
    // - Updates: hidden variant id, shared price, buy/notify, card prices, sold-out state
    // =========================
    const root = document.getElementById('sk-radiance-product-hero-' + cfg.sectionId);
    if (!root) return;

    const baseHandle = root.dataset.baseHandle;
    const bundleHandleFromMeta = root.dataset.bundleHandle;
    const moneyFormat = root.dataset.moneyFormat || cfg.moneyFormat;
    const baseTitle = cfg.title;
    const bundleTitleFallback = cfg.bundleTitle;

    // If you do NOT use metafield custom.bundle_product, put your bundle handle here:
    const fallbackBundleHandle = '';
    const bundleHandle = bundleHandleFromMeta || fallbackBundleHandle;

    const baseVariant = {
      id: cfg.variant.id,
      price: cfg.variant.price,
      compare_at_price: cfg.variant.compare_at_price,
      available: cfg.variant.available
    };

    const offerRadios = root.querySelectorAll('input[name="sk-offer"]');
    const bundleCard = root.querySelector('[data-sk-bundle-card]');
    const singleCard = root.querySelector('[data-sk-offer-card="single"]');
    const bundleCardWrap = root.querySelector('[data-sk-offer-card="bundle"]');

    const hiddenVariantInput = root.querySelector('[data-sk-selected-variant-id]');
    const sharedPriceEl = root.querySelector('[data-sk-shared-price]');
    const buyWrapper = root.querySelector('[data-sk-buy-wrapper]');
    const notifyWrapper = root.querySelector('[data-sk-notify-wrapper]');
    const notifyBtn = root.querySelector('[data-sk-notify-button]');

    const cardPriceBundle = root.querySelector('[data-sk-card-price="bundle"]');

    const productForm =
      root.querySelector('form[action^="/cart/add"]') ||
      root.querySelector('form[action*="/cart/add"]') ||
      document.querySelector('form[action^="/cart/add"]') ||
      document.querySelector('form[action*="/cart/add"]');

    const mainProductSection = document.getElementById('MainProduct-' + cfg.sectionId);

    const applyVariantToInput = (input, variantId) => {
      if (!input || !variantId) return;
      const nextValue = String(variantId);
      input.value = nextValue;
      input.setAttribute('value', nextValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const getVariantInputs = () => {
      const inputs = [];

      if (productForm) {
        inputs.push(...productForm.querySelectorAll('input[name="id"]'));
        inputs.push(...productForm.querySelectorAll('.product-variant-id'));
      }

      inputs.push(...root.querySelectorAll('input[name="id"]'));
      inputs.push(...root.querySelectorAll('.product-variant-id'));

      return Array.from(new Set(inputs));
    };
    window.__SK_ACTIVE_VARIANT_ID = window.__SK_ACTIVE_VARIANT_ID || baseVariant.id;
    window.__SK_ACTIVE_OFFER = window.__SK_ACTIVE_OFFER || 'single';

    const clearProductFormErrors = () => {
      document.querySelectorAll('.product-form__error-message-wrapper').forEach((wrap) => {
        wrap.hidden = true;
        wrap.style.display = 'none';
        const msg = wrap.querySelector('.product-form__error-message');
        if (msg) msg.textContent = '';
      });

      document
        .querySelectorAll('[data-product-form-error], .form__message, .product-form__error')
        .forEach((el) => {
          el.hidden = true;
          el.style.display = 'none';
          if (el.tagName === 'P' || el.tagName === 'DIV') el.textContent = '';
        });
    };

    const setActiveVariantId = (variantId, offer = 'single') => {
      if (!variantId) return [];

      window.__SK_ACTIVE_VARIANT_ID = variantId;
      window.__SK_ACTIVE_OFFER = offer;

      applyVariantToInput(hiddenVariantInput, variantId);

      const inputs = getVariantInputs();

      inputs.forEach((input) => applyVariantToInput(input, variantId));

      // Force-update any other common id inputs (dynamic checkout / buy-now patterns)
      root.querySelectorAll('input[name="id"], input[name="items[0][id]"]').forEach((el) => {
        applyVariantToInput(el, variantId);
      });

      /* Seksjonen «Hva kan du forvente» rendrer sin egen form.lp-cta-form
         UTENFOR denne seksjonen, så ingen av selektorene over treffer den.
         Målt 22. aug: skjemaet beholdt base-varianten selv når kunden hadde
         valgt Face + Neck.

         sk-lp-cart-add.js leser nå window.__SK_ACTIVE_VARIANT_ID og legger
         riktig variant i kurven uansett, så dette er ikke lenger en aktiv
         feil. Men skjemaet skal ikke stå igjen med feil verdi: svikter
         globalen, faller skriptet tilbake på nettopp dette feltet — og da er
         den gamle feilen stille tilbake.

         Selektoren er bevisst smal. Et document-wide input[name="id"] ville
         truffet handlekurvskuffen og produktkort. */
      document.querySelectorAll('form.lp-cta-form input[name="id"]').forEach((el) => {
        applyVariantToInput(el, variantId);
      });

      if (mainProductSection) {
        mainProductSection
          .querySelectorAll(
            'form[action^="/cart/add"], form[action*="/cart/add"], form[action^="/cart"], form[action*="/cart"]'
          )
          .forEach((form) => {
            form.querySelectorAll('input[name="id"], .product-variant-id, [data-sk-selected-variant-id]').forEach((el) => {
              applyVariantToInput(el, variantId);
            });
          });
      }

      clearProductFormErrors();

      return inputs;
    };


    const normalizeMoneyString = (value) =>
      typeof value === 'string' ? value.trim() : value;

    const defaultMoneyFormat = moneyFormat || '{{ amount }}';

    const formatWithDelimiters = (amountInCents, precision = 2, thousands = ',', decimal = '.') => {
      if (amountInCents == null || isNaN(amountInCents)) return '0';

      const negative = amountInCents < 0 ? '-' : '';
      const base = Math.abs(amountInCents / 100).toFixed(Math.max(precision, 0));
      const [integerPart, decimalPart = ''] = base.split('.');
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);

      if (precision === 0) {
        return `${negative}${formattedInteger}`;
      }

      return `${negative}${formattedInteger}${decimal}${decimalPart}`;
    };

    const formatMoneyFallback = (cents, formatString = defaultMoneyFormat) => {
      let value = typeof cents === 'string' ? cents.replace('.', '') : cents;
      value = isNaN(value) ? 0 : Number(value);

      const placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
      const formatMatch = formatString.match(placeholderRegex);
      const placeholder = formatMatch ? formatMatch[1] : 'amount';
      let formattedValue = '';

      switch (placeholder) {
        case 'amount_no_decimals':
          formattedValue = formatWithDelimiters(value, 0);
          break;
        case 'amount_with_comma_separator':
          formattedValue = formatWithDelimiters(value, 2, '.', ',');
          break;
        case 'amount_no_decimals_with_comma_separator':
          formattedValue = formatWithDelimiters(value, 0, '.', ',');
          break;
        case 'amount_no_decimals_with_space_separator':
          formattedValue = formatWithDelimiters(value, 0, ' ', ',');
          break;
        case 'amount_no_decimals_with_apostrophe_separator':
          formattedValue = formatWithDelimiters(value, 0, "'", '.');
          break;
        case 'amount':
        default:
          formattedValue = formatWithDelimiters(value, 2);
      }

      return formatString.replace(placeholderRegex, formattedValue);
    };

    const formatMoney = (cents) => {
      try {
        if (window.Shopify && typeof window.Shopify.formatMoney === 'function') {
          return normalizeMoneyString(window.Shopify.formatMoney(cents, moneyFormat));
        }
      } catch (e) {}
      return normalizeMoneyString(formatMoneyFallback(cents));
    };

    const fetchProductJson = async (handle) => {
      const safeHandle = encodeURIComponent(String(handle || '').trim());
      const res = await fetch(`/products/${safeHandle}.js`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`Failed to load product JSON: ${handle}`);
      return await res.json();
    };

    const calcSavingsPercent = (compareAt, price) => {
      if (!compareAt || !price || compareAt <= price) return 0;
      return Math.round(((compareAt - price) / compareAt) * 100);
    };

    const ensureBadgeEl = (container) => {
      let badge = container.querySelector('.sk-price__badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'sk-price__badge';
        container.appendChild(badge);
      }
      return badge;
    };

    const pickDefaultVariant = (productJson) => {
      if (!productJson || !productJson.variants) return null;
      return productJson.variants.find((v) => v.available) || productJson.variants[0] || null;
    };

    const replaceSharedPrice = (variant) => {
      if (!sharedPriceEl || !variant) return;

      const valueEl = sharedPriceEl.querySelector('.sk-price__value');
      const currentEl = sharedPriceEl.querySelector('.sk-price__current');
      if (!currentEl) return;

      const priceContainer = currentEl.closest('.sk-price') || sharedPriceEl;
      const badgeEl = ensureBadgeEl(priceContainer);

      const compareAt = variant.compare_at_price;
      const price = variant.price;

      const shouldShowCompare = compareAt && compareAt > price;
      const pct = calcSavingsPercent(compareAt, price);

      if (valueEl) {
        valueEl.textContent = shouldShowCompare ? formatMoney(compareAt) : '';
        valueEl.removeAttribute('hidden');
        valueEl.style.visibility = shouldShowCompare ? 'visible' : 'hidden';
      }

      badgeEl.textContent = shouldShowCompare && pct > 0 ? `Spar ${pct}%` : '';

      currentEl.textContent = formatMoney(price);
    };

    const setAvailabilityUI = (available) => {
      if (buyWrapper) buyWrapper.style.display = available ? '' : 'none';
      if (notifyWrapper) notifyWrapper.style.display = available ? 'none' : 'block';
    };

    const setSubmitAvailabilityUI = (available) => {
      const scope = mainProductSection || root;
      if (!scope) return;

      const forms = Array.from(
        scope.querySelectorAll('form[action^="/cart/add"], form[action*="/cart/add"]')
      );
      if (!forms.length && productForm) forms.push(productForm);

      forms.forEach((form) => {
        const productFormEl = form.closest('product-form') || form;
        const submitBtn = productFormEl.querySelector('button[type="submit"], input[type="submit"]');
        if (!submitBtn) return;

        if (available) {
          submitBtn.removeAttribute('disabled');
          submitBtn.removeAttribute('aria-disabled');
        } else {
          submitBtn.setAttribute('disabled', 'disabled');
          submitBtn.setAttribute('aria-disabled', 'true');
        }

        const soldOutMessage = submitBtn.querySelector('.sold-out-message');
        const submitText = submitBtn.querySelector('span');
        if (soldOutMessage && submitText) {
          soldOutMessage.classList.toggle('hidden', !!available);
          submitText.classList.toggle('hidden', !available);
        }
      });
    };

    const setCardUnavailable = (cardEl, isUnavailable, variantId) => {
      if (!cardEl) return;
      cardEl.classList.toggle('is-unavailable', !!isUnavailable);
      cardEl.setAttribute('aria-disabled', isUnavailable ? 'true' : 'false');
      const cardNotifyBtn = cardEl.querySelector('[data-sk-card-notify-button]');
      if (cardNotifyBtn) {
        if (variantId) {
          cardNotifyBtn.setAttribute('data-variant-id', variantId);
        }
        cardNotifyBtn.classList.toggle('is-visible', !!isUnavailable);
      }
      const radioInput = cardEl.querySelector('input[type="radio"]');
      if (radioInput) {
        radioInput.disabled = !!isUnavailable;
      }
    };

    const setNotifyVariant = (variantId) => {
      if (!notifyBtn) return;
      notifyBtn.setAttribute('data-variant-id', variantId);
    };

    const openNotifyFlow = (variantId) => {
      if (!notifyWrapper) return;
      if (variantId) setNotifyVariant(variantId);
      notifyWrapper.style.display = 'block';
      notifyWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (notifyBtn) notifyBtn.click();
    };

    const cardNotifyButtons = root.querySelectorAll('[data-sk-card-notify-button]');
    cardNotifyButtons.forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openNotifyFlow(btn.dataset.variantId || root.dataset.baseVariantId);
      });
    });

    const setBundleCardPrice = (variant) => {
      if (!cardPriceBundle || !variant) return;
      const valueEl = cardPriceBundle.querySelector('.sk-price__value');
      const currentEl = cardPriceBundle.querySelector('.sk-price__current');
      const priceContainer = (currentEl && currentEl.closest('.sk-price')) || cardPriceBundle;
      const badgeEl = ensureBadgeEl(priceContainer);

      const pct = calcSavingsPercent(variant.compare_at_price, variant.price);

      if (valueEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          valueEl.textContent = formatMoney(variant.compare_at_price);
        } else {
          valueEl.textContent = '';
        }
      }
      badgeEl.textContent = pct > 0 ? `Spar ${pct}%` : '';
      if (currentEl) {
        currentEl.textContent = formatMoney(variant.price);
      }
    };

    const hydrateBundleCard = async () => {
      if (!bundleHandle) {
        if (bundleCard) bundleCard.style.display = 'none';
        return null;
      }

      try {
        const bundleJson = await fetchProductJson(bundleHandle);
        const bundleVariant = pickDefaultVariant(bundleJson);
        if (!bundleVariant) return null;

        setBundleCardPrice(bundleVariant);
        setCardUnavailable(bundleCardWrap, !bundleVariant.available, bundleVariant.id);

        return { product: bundleJson, variant: bundleVariant };
      } catch (e) {
        if (bundleCard) bundleCard.style.display = 'none';
        return null;
      }
    };

    const applyOffer = async (offerType, bundleData) => {
      let activeVariant = null;
      let activeProductId = null;

      if (offerType === 'single') {
        activeVariant = baseVariant;
        activeProductId = root.dataset.baseProductId;
      }

      if (offerType === 'bundle') {
        if (!bundleData || !bundleData.variant) return;
        activeVariant = bundleData.variant;
        activeProductId = bundleData.product?.id;
      }

      if (!activeVariant) return;

      setActiveVariantId(activeVariant.id, offerType);
      setNotifyVariant(activeVariant.id);
      
      // Update product-id input if it exists
      const productIdInputs = document.querySelectorAll('input[name="product-id"]');
      if (productIdInputs.length && activeProductId) {
        productIdInputs.forEach(input => {
          input.value = activeProductId;
        });
      }
      
      replaceSharedPrice(activeVariant);
      setAvailabilityUI(!!activeVariant.available);
      setSubmitAvailabilityUI(!!activeVariant.available);

      setCardUnavailable(singleCard, offerType === 'single' && !activeVariant.available, baseVariant.id);
      setCardUnavailable(bundleCardWrap, offerType === 'bundle' && !activeVariant.available, (bundleData && bundleData.variant) ? bundleData.variant.id : null);

      const offerTitle = offerType === 'bundle'
        ? (bundleData && bundleData.product && bundleData.product.title) || bundleTitleFallback || baseTitle
        : baseTitle;

      const priceText = formatMoney(activeVariant.price);
      const savingsPct = calcSavingsPercent(activeVariant.compare_at_price, activeVariant.price);
      const compareText =
        activeVariant.compare_at_price && activeVariant.compare_at_price > activeVariant.price
          ? formatMoney(activeVariant.compare_at_price)
          : '';
      const badgeText = savingsPct > 0 ? `Spar ${savingsPct}%` : '';
      document.dispatchEvent(new CustomEvent('sk:offerchange', {
        detail: {
          offer: offerType,
          variantId: activeVariant.id,
          price: activeVariant.price,
          compare_at_price: activeVariant.compare_at_price,
          priceText,
          compareText,
          badgeText,
          available: activeVariant.available,
          handle: offerType === 'single' ? baseHandle : bundleHandle,
          title: offerTitle
        }
      }));
    };

    const handleOfferChangeEvent = (event) => {
      const detail = event && event.detail;
      if (!detail || !detail.variantId) return;
      setActiveVariantId(detail.variantId, detail.offer || 'single');
    };

    document.addEventListener('sk:offerchange', handleOfferChangeEvent);

    // 1) Hydrate bundle card + store data
    const bundleData = await hydrateBundleCard();

    // 2) Listen to offer changes
    offerRadios.forEach((radio) => {
      radio.addEventListener('change', async function () {
        if (!this.checked) return;

        try {
          if (this.value === 'bundle') {
            await applyOffer('bundle', bundleData);
          } else {
            await applyOffer('single', bundleData);
          }
        } catch (e) {
          // fail safe: revert to single
          offerRadios.forEach((r) => {
            if (r.value === 'single') r.checked = true;
          });
          await applyOffer('single', bundleData);
        }
      });
    });

    // 3) Ensure initial offer is applied AND sticky bar is hydrated
    clearProductFormErrors();
    await applyOffer('single', bundleData);
  });
})();
