const SCROLL_ANIMATION_TRIGGER_CLASSNAME = 'scroll-trigger';
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = 'scroll-trigger--offscreen';
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = 'animate--zoom-in';
const SCROLL_ANIMATION_CANCEL_CLASSNAME = 'scroll-trigger--cancel';

// Scroll in animation logic
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute('data-cascade'))
          elementTarget.setAttribute('style', `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
  const animationTriggerElements = Array.from(rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME));
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add('scroll-trigger--design-mode');
    });
    return;
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '0px 0px -50px 0px',
  });
  animationTriggerElements.forEach((element) => observer.observe(element));
}

// Zoom in animation logic
function initializeScrollZoomAnimationTrigger() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const animationTriggerElements = Array.from(document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME));

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;

  animationTriggerElements.forEach((element) => {
    let elementIsVisible = false;
    // Cache geometric values — updated only when element resizes (avoids forced reflow on scroll)
    let cachedOffsetTop = 0;
    let cachedHeight = 0;

    function updateCachedGeometry() {
      const rect = element.getBoundingClientRect();
      cachedOffsetTop = rect.top + window.scrollY;
      cachedHeight = rect.height;
    }

    const visibilityObserver = new IntersectionObserver((elements) => {
      elements.forEach((entry) => {
        elementIsVisible = entry.isIntersecting;
      });
    });
    visibilityObserver.observe(element);

    // Use ResizeObserver to keep cached geometry fresh without scroll-time reflows
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => updateCachedGeometry());
      ro.observe(element);
    }

    // Initial geometry read (single reflow at init, not per-scroll)
    updateCachedGeometry();
    element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeenCached(cachedOffsetTop, cachedHeight));

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!elementIsVisible || ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          element.style.setProperty(
            '--zoom-in-ratio',
            1 + scaleAmount * percentageSeenCached(cachedOffsetTop, cachedHeight),
          );
          ticking = false;
        });
      },
      { passive: true },
    );
  });
}

function percentageSeenCached(elementPositionY, elementHeight) {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;

  if (elementPositionY > scrollY + viewportHeight) {
    // If we haven't reached the element yet
    return 0;
  } else if (elementPositionY + elementHeight < scrollY) {
    // If we've completely scrolled past the element
    return 100;
  }

  // When the element is in the viewport
  const distance = scrollY + viewportHeight - elementPositionY;
  let percentage = distance / ((viewportHeight + elementHeight) / 100);
  return Math.round(percentage);
}

window.addEventListener('DOMContentLoaded', () => {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
});

if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => initializeScrollAnimationTrigger(event.target, true));
  document.addEventListener('shopify:section:reorder', () => initializeScrollAnimationTrigger(document, true));
}
