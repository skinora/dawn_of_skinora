if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        if (!this.form) return;

        if (this.variantIdInput) this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton ? this.submitButton.querySelector('span') : null;

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (!this.form || !this.submitButton) return;
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner')?.classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.variantIdInput && this.variantIdInput.value) {
          // Ensure we only ever submit a single variant id, even if the form contains
          // multiple [name="id"] inputs (which can lead to incorrect /cart/add behavior).
          formData.set('id', this.variantIdInput.value);
        }

        const isSkDebugMode = (() => {
          try {
            const href = String(window.location.href || '');
            const search = String(window.location.search || '');
            return href.includes('skdebug=1') || search.includes('skdebug=1');
          } catch (e) {
            return false;
          }
        })();

        if (isSkDebugMode) {
          try {
            // eslint-disable-next-line no-console
            console.log('[skdebug] product-form submit', {
              formId: this.form.id || null,
              formDataId: formData.get('id'),
              activeVariantId: window.__SK_ACTIVE_VARIANT_ID || null,
            });
          } catch (e) {}
        }
        // Re-check for cart drawer element in case it loaded after constructor
        this.cart = this.cart || document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              if (isSkDebugMode) {
                try {
                  // eslint-disable-next-line no-console
                  console.log('[skdebug] /cart/add error json', response);
                } catch (e) {}
              }

              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(
                response.description || response.message || response.errors || 'Kunne ikke legge i handlekurv.'
              );

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            const startMarker = CartPerformance.createStartingMarker('add:wait-for-subscribers');
            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              }).then(() => {
                CartPerformance.measureFromMarker('add:wait-for-subscribers', startMarker);
              });
            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    CartPerformance.measure('add:paint-updated-sections', () => {
                      this.cart.renderContents(response);
                    });
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              CartPerformance.measure('add:paint-updated-sections', () => {
                this.cart.renderContents(response);
              });
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner')?.classList.add('hidden');

            CartPerformance.measureFromEvent('add:user-action', evt);
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text && this.submitButtonText) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          if (this.submitButtonText) this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return (
          this.form.querySelector('[name="id"][data-sk-selected-variant-id]') ||
          this.form.querySelector('[data-sk-selected-variant-id]') ||
          this.form.querySelector('[name=id]')
        );
      }
    }
  );
}
