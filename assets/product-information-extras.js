class ProductPickupAvailability extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.message = this.querySelector('[data-pickup-availability-message]');
    const root = this.closest('[data-product-information]');
    root?.addEventListener('variant:change', (event) => this.update(event.detail?.variantId), { signal: this.abortController.signal });
  }

  disconnectedCallback() { this.abortController?.abort(); this.abortController = null; }

  update(variantId) {
    const template = this.querySelector(`[data-pickup-availability-template="${CSS.escape(String(variantId || ''))}"]`);
    if (template && this.message) this.message.innerHTML = template.innerHTML;
  }
}

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    const track = this.querySelector('[data-product-recommendations-track]');
    if (!track) return;
    this.querySelector('[data-product-recommendations-previous]')?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
    this.querySelector('[data-product-recommendations-next]')?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
  }
}

class ProductStickyAddToCart extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.button = this.querySelector('[data-sticky-add-to-cart-button]');
    this.price = this.querySelector('[data-sticky-add-to-cart-price]');
    this.root = this.closest('[data-product-information]');
    this.sourceButton = this.root?.querySelector('[data-add-to-cart-button]');
    this.root?.addEventListener('variant:change', (event) => this.update(event.detail?.variantId, event.detail?.available), { signal: this.abortController.signal });
    this.button?.addEventListener('click', () => this.submit(), { signal: this.abortController.signal });
    if (this.sourceButton) {
      new IntersectionObserver(([entry]) => this.classList.toggle('is-visible', !entry.isIntersecting), { threshold: 0.15 }).observe(this.sourceButton);
    } else {
      this.classList.add('is-visible');
    }
  }

  disconnectedCallback() { this.abortController?.abort(); this.abortController = null; }

  update(variantId, available) {
    const template = this.querySelector(`[data-sticky-add-to-cart-template="${CSS.escape(String(variantId || ''))}"]`);
    if (template) this.price.textContent = template.content.textContent.trim();
    const enabled = Boolean(variantId && available);
    this.button.disabled = !enabled;
    this.button.setAttribute('aria-disabled', String(!enabled));
  }

  submit() {
    if (this.button?.disabled) return;
    const form = this.root?.querySelector('[data-product-form]');
    form?.requestSubmit?.();
  }
}

class PopupBlock extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.dialog = this.querySelector('[data-popup-dialog]');
    this.querySelector('[data-popup-open]')?.addEventListener('click', () => this.dialog?.showModal(), { signal: this.abortController.signal });
    this.querySelector('[data-popup-close]')?.addEventListener('click', () => this.dialog?.close(), { signal: this.abortController.signal });
    this.dialog?.addEventListener('click', (event) => { if (event.target === this.dialog) this.dialog.close(); }, { signal: this.abortController.signal });
  }
  disconnectedCallback() { this.abortController?.abort(); this.abortController = null; }
}

if (!customElements.get('product-pickup-availability')) customElements.define('product-pickup-availability', ProductPickupAvailability);
if (!customElements.get('product-recommendations')) customElements.define('product-recommendations', ProductRecommendations);
if (!customElements.get('product-sticky-add-to-cart')) customElements.define('product-sticky-add-to-cart', ProductStickyAddToCart);
if (!customElements.get('popup-block')) customElements.define('popup-block', PopupBlock);
