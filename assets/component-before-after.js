class BeforeAfterSlider {
  constructor(element) {
    this.element = element;
    this.slider = element.querySelector('[data-ba-slider]');
    if (!this.slider) return;

    this.percent = this.getInitialPercent();
    this.dragging = false;

    this.setPercent(this.percent);
    this.bindEvents();
  }

  getInitialPercent() {
    const value = parseFloat(this.element.dataset.initial);
    if (Number.isFinite(value)) {
      return value;
    }
    return 50;
  }

  clamp(value) {
    return Math.max(0, Math.min(100, value));
  }

  pointerX(event) {
    if (event.touches && event.touches.length) {
      return event.touches[0].clientX;
    }
    return event.clientX;
  }

  eventToPercent(event) {
    const rect = this.element.getBoundingClientRect();
    const x = this.pointerX(event) - rect.left;
    return (x / rect.width) * 100;
  }

  setPercent(value) {
    const clamped = this.clamp(value);
    this.percent = clamped;
    this.element.style.setProperty('--before-after-percent', `${clamped}%`);
    this.slider.setAttribute('aria-valuenow', Math.round(clamped));
  }

  bindEvents() {
    this.onPointerDown = this.handlePointerDown.bind(this);
    this.onPointerMove = this.handlePointerMove.bind(this);
    this.onPointerUp = this.handlePointerUp.bind(this);
    this.onKeyDown = this.handleKeyDown.bind(this);

    this.slider.addEventListener('pointerdown', this.onPointerDown);
    this.slider.addEventListener('keydown', this.onKeyDown);
  }

  handlePointerDown(event) {
    event.preventDefault();
    this.dragging = true;
    this.element.dataset.dragging = 'true';
    if (event.pointerId !== undefined && this.slider.setPointerCapture) {
      try {
        this.slider.setPointerCapture(event.pointerId);
      } catch (error) {}
    }
    this.setPercent(this.eventToPercent(event));
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  handlePointerMove(event) {
    if (!this.dragging) return;
    event.preventDefault();
    this.setPercent(this.eventToPercent(event));
  }

  handlePointerUp(event) {
    if (!this.dragging) return;
    this.dragging = false;
    delete this.element.dataset.dragging;
    if (event && event.pointerId !== undefined && this.slider.releasePointerCapture) {
      try {
        this.slider.releasePointerCapture(event.pointerId);
      } catch (error) {}
    }
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
  }

  handleKeyDown(event) {
    const step = event.shiftKey ? 10 : 5;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.setPercent(this.percent - step);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.setPercent(this.percent + step);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.setPercent(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.setPercent(100);
    }
  }
}

function initBeforeAfterSliders(scope = document) {
  const sliders = Array.from(scope.querySelectorAll('[data-before-after]'));
  sliders.forEach((element) => {
    if (!element.dataset.beforeAfterBound) {
      element.dataset.beforeAfterBound = 'true';
      new BeforeAfterSlider(element);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initBeforeAfterSliders());
} else {
  initBeforeAfterSliders();
}

document.addEventListener('shopify:section:load', (event) => {
  if (event.detail && event.detail.sectionElement) {
    initBeforeAfterSliders(event.detail.sectionElement);
  }
});

document.addEventListener('shopify:section:unload', (event) => {
  if (event.detail && event.detail.sectionElement) {
    const sliders = event.detail.sectionElement.querySelectorAll('[data-before-after]');
    sliders.forEach((element) => {
      delete element.dataset.beforeAfterBound;
    });
  }
});
