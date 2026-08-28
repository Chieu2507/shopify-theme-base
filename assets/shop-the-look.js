class ShopTheLook extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;

    this.initialized = true;
    this.hotspots = Array.from(this.querySelectorAll('[data-shop-the-look-hotspot]'));
    this.products = Array.from(this.querySelectorAll('[data-shop-the-look-product]'));
    this.bundleStatus = this.querySelector('[data-shop-the-look-bundle-status]');
    this.onClick = this.handleClick.bind(this);
    this.onKeydown = this.handleKeydown.bind(this);
    this.onBlockSelect = this.handleBlockSelect.bind(this);
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeydown);
    document.addEventListener('shopify:block:select', this.onBlockSelect);
    this.selectProduct(0);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeydown);
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    window.clearTimeout(this.resetTimer);
    this.initialized = false;
  }

  selectProduct(index, moveFocus = false) {
    if (!this.products.length) return;

    const nextIndex = Math.min(Math.max(Number(index) || 0, 0), this.products.length - 1);
    this.hotspots.forEach((hotspot, hotspotIndex) => {
      hotspot.setAttribute('aria-pressed', String(hotspotIndex === nextIndex));
    });
    this.products.forEach((product, productIndex) => {
      product.classList.toggle('is-active', productIndex === nextIndex);
    });

    if (moveFocus) this.hotspots[nextIndex]?.focus();
  }

  handleClick(event) {
    const hotspot = event.target.closest('[data-shop-the-look-hotspot]');
    if (hotspot && this.contains(hotspot)) {
      event.preventDefault();
      this.selectProduct(this.hotspots.indexOf(hotspot));
      return;
    }

    const button = event.target.closest('[data-shop-the-look-bundle-add]');
    if (!button || !this.contains(button)) return;

    this.addBundle(button);
  }

  handleKeydown(event) {
    const hotspot = event.target.closest('[data-shop-the-look-hotspot]');
    if (!hotspot || !this.contains(hotspot)) return;

    const currentIndex = this.hotspots.indexOf(hotspot);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = currentIndex + 1;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = currentIndex - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.hotspots.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    this.selectProduct(nextIndex, true);
  }

  handleBlockSelect(event) {
    const index = this.products.findIndex((product) => product.dataset.blockId === event.detail?.blockId);
    if (index >= 0) this.selectProduct(index);
  }

  parseBundleItems(button) {
    try {
      const items = JSON.parse(button.dataset.shopTheLookBundleItems || '[]');
      return Array.isArray(items) ? items : [];
    } catch (_) {
      return [];
    }
  }

  async addBundle(button) {
    if (button.getAttribute('aria-disabled') === 'true' || button.classList.contains('is-loading')) return;

    const items = this.parseBundleItems(button);
    if (!items.length) return;

    const label = button.querySelector('[data-shop-the-look-bundle-label]');
    const initialLabel = button.dataset.shopTheLookBundleAddLabel || label?.textContent || '';
    const addingLabel = button.dataset.shopTheLookBundleAddingLabel || initialLabel;
    const addedLabel = button.dataset.shopTheLookBundleAddedLabel || initialLabel;
    const errorLabel = button.dataset.shopTheLookBundleErrorLabel || 'Unable to add this set to your bag.';
    const root = window.Shopify?.routes?.root || '/';
    const cartAddUrl = window.routes?.cart_add_url || root + 'cart/add.js';

    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    if (label) label.textContent = addingLabel;
    if (this.bundleStatus) this.bundleStatus.textContent = addingLabel;

    try {
      const response = await fetch(cartAddUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ items }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.description || payload.message || errorLabel);

      let cart = null;
      try {
        const cartResponse = await fetch(root + 'cart.js', { headers: { Accept: 'application/json' } });
        if (cartResponse.ok) cart = await cartResponse.json();
      } catch (_) {
        // The cart drawer refreshes independently when the add succeeds.
      }

      const addedItems = Array.isArray(payload.items) ? payload.items : [];
      const firstItem = addedItems[0] || null;
      if (label) label.textContent = addedLabel;
      if (this.bundleStatus) this.bundleStatus.textContent = addedLabel;
      button.classList.add('is-added');

      document.dispatchEvent(new CustomEvent('cart:updated', {
        bubbles: true,
        detail: { item: firstItem, items: addedItems, cart, button },
      }));
      document.dispatchEvent(new CustomEvent('cart:add:success', {
        bubbles: true,
        detail: { item: firstItem, items: addedItems, cart, button },
      }));

      this.resetTimer = window.setTimeout(() => {
        if (!button.isConnected) return;
        button.classList.remove('is-added');
        button.removeAttribute('aria-busy');
        if (label) label.textContent = initialLabel;
        if (this.bundleStatus) this.bundleStatus.textContent = '';
      }, 1600);
    } catch (error) {
      console.error('[Spinel] Shop the look bundle add failed', error);
      if (label) label.textContent = initialLabel;
      if (this.bundleStatus) this.bundleStatus.textContent = error.message || errorLabel;
      button.removeAttribute('aria-busy');
    } finally {
      button.classList.remove('is-loading');
    }
  }
}

if (!customElements.get('shop-the-look')) customElements.define('shop-the-look', ShopTheLook);
