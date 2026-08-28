class ShopTheLook extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;

    this.initialized = true;
    this.bundleStatus = this.querySelector('[data-shop-the-look-bundle-status]');
    this.onClick = this.handleClick.bind(this);
    this.addEventListener('click', this.onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    window.clearTimeout(this.resetTimer);
    this.initialized = false;
  }

  handleClick(event) {
    const button = event.target.closest('[data-shop-the-look-bundle-add]');
    if (!button || !this.contains(button)) return;

    this.addBundle(button);
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
