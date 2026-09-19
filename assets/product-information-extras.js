const PDP_DRAWER_CLOSE_DELAY = 350;
const PDP_DRAWER_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const syncPdpDrawerScrollLock = () => {
  const isOpen = Boolean(document.querySelector('[data-pdp-drawer].is-open'));
  document.documentElement.classList.toggle('pdp-drawer-open', isOpen);
  document.body.classList.toggle('pdp-drawer-open', isOpen);
};

class PdpDrawerElement extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.drawer = this.querySelector('[data-pdp-drawer]');
    this.panel = this.drawer?.querySelector('[data-pdp-drawer-panel]');
    this.trigger = this.querySelector('[data-pdp-drawer-open]');
    this.closeButton = this.panel?.querySelector('[data-pdp-drawer-close]');
    this.closeTimer = null;
    this.previousFocus = null;

    this.trigger?.addEventListener('click', () => this.open(), { signal: this.abortController.signal });
    this.drawer?.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-pdp-drawer-close]')) {
        event.preventDefault();
        this.close();
      }
    }, { signal: this.abortController.signal });
    this.drawer?.addEventListener('keydown', (event) => this.handleKeydown(event), { signal: this.abortController.signal });
    document.addEventListener('shopify:block:select', (event) => {
      if (event.target === this || this.contains(event.target)) this.open({ focus: false });
    }, { signal: this.abortController.signal });
    document.addEventListener('shopify:block:deselect', (event) => {
      if (event.target === this) this.close({ force: true });
    }, { signal: this.abortController.signal });
    document.addEventListener('shopify:section:unload', (event) => {
      if (event.target === this || event.target?.contains?.(this)) this.close({ force: true, restoreFocus: false });
    }, { signal: this.abortController.signal });
  }

  disconnectedCallback() {
    this.close({ force: true, restoreFocus: false });
    this.abortController?.abort();
    this.abortController = null;
  }

  getFocusable() {
    return Array.from(this.panel?.querySelectorAll(PDP_DRAWER_FOCUSABLE_SELECTOR) || [])
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
  }

  handleKeydown(event) {
    if (!this.drawer?.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close({ force: true });
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  open({ focus = true } = {}) {
    if (!this.drawer || this.drawer.classList.contains('is-open')) return;
    const shouldAnimate = !this.drawer.classList.contains('is-closing');
    window.clearTimeout(this.closeTimer);
    this.closeTimer = null;
    if (shouldAnimate) this.previousFocus = document.activeElement;
    this.drawer.hidden = false;
    this.drawer.setAttribute('aria-hidden', 'false');
    this.drawer.classList.remove('is-closing');
    if (shouldAnimate) {
      this.drawer.classList.remove('is-open');
      this.panel?.getBoundingClientRect();
    }
    this.drawer.classList.add('is-open');
    this.trigger?.setAttribute('aria-expanded', 'true');
    syncPdpDrawerScrollLock();

    if (focus) {
      window.requestAnimationFrame(() => {
        if (!this.drawer?.classList.contains('is-open')) return;
        (this.closeButton || this.panel)?.focus({ preventScroll: true });
      });
    }
  }

  close({ force = false, restoreFocus = true } = {}) {
    if (!this.drawer || this.drawer.hidden || (!this.drawer.classList.contains('is-open') && !this.drawer.classList.contains('is-closing'))) return;
    if (!force && this.editorSelected) return;
    this.drawer.classList.remove('is-open');
    this.drawer.classList.add('is-closing');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.trigger?.setAttribute('aria-expanded', 'false');
    syncPdpDrawerScrollLock();
    window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => {
      if (!this.drawer?.classList.contains('is-open')) {
        this.drawer?.classList.remove('is-closing');
        if (this.drawer) this.drawer.hidden = true;
      }
    }, PDP_DRAWER_CLOSE_DELAY);

    const restoreTarget = this.previousFocus;
    this.previousFocus = null;
    if (restoreFocus && restoreTarget?.isConnected && !restoreTarget.hidden) restoreTarget.focus();
  }
}

class ProductPickupAvailability extends PdpDrawerElement {
  connectedCallback() {
    super.connectedCallback();
    if (!this.abortController) return;
    this.message = this.querySelector('[data-pickup-availability-message]');
    this.stores = this.querySelector('[data-pickup-availability-stores]');
    const root = this.closest('[data-product-information]');
    root?.addEventListener('variant:change', (event) => this.update(event.detail?.variantId), { signal: this.abortController.signal });
  }

  update(variantId) {
    const template = this.querySelector(`[data-pickup-availability-template="${CSS.escape(String(variantId || ''))}"]`);
    const hasPickup = template?.dataset.hasPickup === 'true';
    if (!hasPickup) {
      this.close({ force: true, restoreFocus: false });
      this.hidden = true;
      return;
    }
    this.hidden = false;
    const content = template.content;
    const message = content.querySelector('[data-pickup-availability-message-template]');
    const stores = content.querySelector('[data-pickup-availability-stores-template]');
    if (message && this.message) this.message.innerHTML = message.innerHTML;
    if (stores && this.stores) this.stores.innerHTML = stores.innerHTML;
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

class PopupBlock extends PdpDrawerElement {}

if (!customElements.get('product-pickup-availability')) customElements.define('product-pickup-availability', ProductPickupAvailability);
if (!customElements.get('product-recommendations')) customElements.define('product-recommendations', ProductRecommendations);
if (!customElements.get('product-sticky-add-to-cart')) customElements.define('product-sticky-add-to-cart', ProductStickyAddToCart);
if (!customElements.get('popup-block')) customElements.define('popup-block', PopupBlock);
