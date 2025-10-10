class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.hoverTimeout = null;
    
    // Add hover event listeners
    this.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    // Prevent default click behavior on summary to avoid toggle conflicts
    const summary = this.mainDetailsToggle.querySelector('summary');
    if (summary) {
      summary.addEventListener('click', this.onSummaryClick.bind(this));
    }
    
    // Handle nested submenus
    this.setupNestedMenus();
  }

  onMouseEnter() {
    // Clear any pending close timeout
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    // Open the menu
    this.open();
  }

  onMouseLeave() {
    // Delay closing to allow moving between menu items
    this.hoverTimeout = setTimeout(() => {
      this.close();
    }, 200);
  }

  onSummaryClick(event) {
    // Prevent default click behavior since we're using hover
    event.preventDefault();
  }

  open() {
    if (!this.mainDetailsToggle.hasAttribute('open')) {
      this.mainDetailsToggle.setAttribute('open', '');
      this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', true);
    }
  }

  setupNestedMenus() {
    // Handle nested dropdown menus
    const nestedDetails = this.querySelectorAll('details[id^="Details-HeaderSubMenu"]');
    nestedDetails.forEach(details => {
      const parentLi = details.closest('li');
      if (parentLi) {
        parentLi.addEventListener('mouseenter', () => {
          details.setAttribute('open', '');
        });
        parentLi.addEventListener('mouseleave', () => {
          details.removeAttribute('open');
        });
        
        // Prevent click on nested summary
        const summary = details.querySelector('summary');
        if (summary) {
          summary.addEventListener('click', (e) => {
            e.preventDefault();
          });
        }
      }
    });
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }
}

customElements.define('header-menu', HeaderMenu);
