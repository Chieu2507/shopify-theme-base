class PdpDrawerElement extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.drawer = this.querySelector('[data-pdp-drawer]');
    this.overlay = window.ThemeOverlay.get(this.drawer);
    this.trigger = this.querySelector('[data-pdp-drawer-open]');
    const options = { signal: this.abortController.signal };
    this.trigger?.addEventListener('click', () => this.open(), options);
    document.addEventListener('shopify:block:select', (event) => {
      if (event.target === this || this.contains(event.target) || this.drawer?.contains(event.target)) {
        this.open({ focus: false });
      }
    }, options);
    document.addEventListener('shopify:block:deselect', (event) => {
      if (event.target === this || this.contains(event.target) || this.drawer?.contains(event.target)) this.close();
    }, options);
    document.addEventListener('shopify:section:unload', (event) => {
      if (event.target.contains(this)) this.close({ restoreFocus: false, immediate: true });
    }, options);
  }
  disconnectedCallback() {
    this.overlay?.destroy();
    this.abortController?.abort();
    this.abortController = null;
  }
  open(options = {}) { this.overlay?.open({ opener: this.trigger, ...options }); }
  close(options = {}) { this.overlay?.close(options); }
}

class ProductPickupAvailability extends PdpDrawerElement {
  connectedCallback() {
    super.connectedCallback();
    if (!this.abortController) return;
    this.message = this.querySelector('[data-pickup-availability-message]');
    this.stores = this.drawer?.querySelector('[data-pickup-availability-stores]');
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
    this.productRoot ||= this.closest('[data-product-information]');
    this.button = this.querySelector('[data-sticky-add-to-cart-button]');
    this.price = this.querySelector('[data-sticky-add-to-cart-price]');
    this.comparePrice = this.querySelector('[data-sticky-add-to-cart-compare-price]');
    this.prices = this.querySelector('[data-sticky-add-to-cart-prices]');
    this.variantText = this.querySelector('[data-sticky-add-to-cart-variant]');
    this.variantSelect = this.querySelector('[data-sticky-add-to-cart-variant-select]');
    this.image = this.querySelector('[data-sticky-add-to-cart-image]');
    this.sourceButtons = this.productRoot?.querySelector('[data-product-buy-buttons]');
    this.editorSelected = false;
    this.productRoot?.addEventListener('variant:change', (event) => this.update(event.detail?.variantId, event.detail?.available), { signal: this.abortController.signal });
    this.button?.addEventListener('click', () => this.submit(), { signal: this.abortController.signal });
    this.variantSelect?.addEventListener('change', () => this.selectVariant(this.variantSelect.value), { signal: this.abortController.signal });
    document.addEventListener('shopify:section:unload', (event) => {
      if (this.productRoot && event.target.contains(this.productRoot)) this.remove();
    }, { signal: this.abortController.signal });
    document.addEventListener('shopify:block:select', (event) => {
      if (!this.matchesEditorBlockEvent(event)) return;
      this.editorSelected = true;
      this.syncVisibility();
    }, { signal: this.abortController.signal });
    document.addEventListener('shopify:block:deselect', (event) => {
      if (!this.matchesEditorBlockEvent(event)) return;
      this.editorSelected = false;
      this.syncVisibility();
    }, { signal: this.abortController.signal });

    this.passedBuyButtons = false;
    this.footerVisible = false;
    if (this.sourceButtons && 'IntersectionObserver' in window) {
      this.buyButtonsObserver = new IntersectionObserver(([entry]) => {
        this.passedBuyButtons = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        this.syncVisibility();
      }, { threshold: 0.01 });
      this.buyButtonsObserver.observe(this.sourceButtons);

      const footer = document.querySelector('footer.footer');
      if (footer) {
        this.footerObserver = new IntersectionObserver(([entry]) => {
          this.footerVisible = entry.isIntersecting;
          this.syncVisibility();
        }, { threshold: 0.01 });
        this.footerObserver.observe(footer);
      }
    } else if (this.sourceButtons) {
      const checkPosition = () => {
        this.passedBuyButtons = this.sourceButtons.getBoundingClientRect().bottom < 0;
        this.syncVisibility();
      };
      window.addEventListener('scroll', checkPosition, { passive: true, signal: this.abortController.signal });
      window.addEventListener('resize', checkPosition, { passive: true, signal: this.abortController.signal });
      checkPosition();
    }

    // Keep the Theme Block editor contract in Liquid, but render the fixed UI
    // at the document root so transformed Product Details cannot contain it.
    if (this.parentElement !== document.body) document.body.append(this);
  }

  disconnectedCallback() {
    window.requestAnimationFrame(() => {
      if (this.isConnected) return;
      this.buyButtonsObserver?.disconnect();
      this.footerObserver?.disconnect();
      this.abortController?.abort();
      this.abortController = null;
      this.buyButtonsObserver = null;
      this.footerObserver = null;
      this.productRoot = null;
    });
  }

  syncVisibility() {
    const visible = Boolean(this.sourceButtons?.isConnected && (this.editorSelected || (this.passedBuyButtons && !this.footerVisible)));
    this.classList.toggle('is-visible', visible);
    this.setAttribute('aria-hidden', String(!visible));
    this.inert = !visible;
  }

  matchesEditorBlockEvent(event) {
    let editorBlockId = '';
    try {
      editorBlockId = JSON.parse(this.getAttribute('data-shopify-editor-block') || '{}').id || '';
    } catch {
      editorBlockId = '';
    }
    const selectedBlockId = String(event.detail?.blockId || '');
    return event.target === this
      || this.contains(event.target)
      || selectedBlockId === String(this.dataset.blockId || '')
      || selectedBlockId === String(editorBlockId);
  }

  update(variantId, available) {
    const template = this.querySelector(`[data-sticky-add-to-cart-template="${CSS.escape(String(variantId || ''))}"]`);
    if (template) {
      if (this.price) this.price.textContent = template.dataset.price || '';
      const comparePrice = template.dataset.comparePrice || '';
      if (this.comparePrice) {
        this.comparePrice.textContent = comparePrice;
        this.comparePrice.hidden = !comparePrice;
      }
      this.prices?.classList.toggle('is-sale', Boolean(comparePrice));
      if (this.variantText) this.variantText.textContent = template.dataset.title || '';
      if (this.variantSelect) this.variantSelect.value = String(variantId || '');
      if (this.image) this.image.src = template.dataset.imageSrc || this.image.dataset.fallbackSrc || this.image.src;
    }
    const enabled = Boolean(variantId && (template ? template.dataset.available === 'true' : available));
    this.button.disabled = !enabled;
    this.button.setAttribute('aria-disabled', String(!enabled));
    const label = this.querySelector('[data-sticky-add-to-cart-label]');
    if (label) label.textContent = enabled ? this.dataset.addToCartLabel : this.dataset.soldOutLabel;
    this.dataset.currentVariantId = String(variantId || '');
    this.dataset.available = String(enabled);
  }

  selectVariant(variantId) {
    const picker = this.productRoot?.querySelector('variant-picker');
    const variant = picker?.variants?.find((item) => String(item.id) === String(variantId));
    if (!picker || !variant) return;
    picker.optionGroups().forEach((group, index) => {
      const value = variant.options?.[index];
      const select = group.querySelector('select[data-option-control]');
      if (select) select.value = value;
      group.querySelectorAll('input[data-option-control]').forEach((input) => {
        input.checked = String(input.value) === String(value);
      });
    });
    picker.sync({ updateUrl: true, source: 'sticky-cart' });
  }

  submit() {
    if (this.button?.disabled) return;
    const form = this.productRoot?.querySelector('[data-product-form]');
    form?.requestSubmit?.();
  }
}

class PopupBlock extends PdpDrawerElement {}

if (!customElements.get('product-pickup-availability')) customElements.define('product-pickup-availability', ProductPickupAvailability);
if (!customElements.get('product-recommendations')) customElements.define('product-recommendations', ProductRecommendations);
if (!customElements.get('product-sticky-add-to-cart')) customElements.define('product-sticky-add-to-cart', ProductStickyAddToCart);
if (!customElements.get('popup-block')) customElements.define('popup-block', PopupBlock);
