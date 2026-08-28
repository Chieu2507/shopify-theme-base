if (!window.__spinelShopTheLookEditorScrollGuard) {
  window.__spinelShopTheLookEditorScrollGuard = true;
  const sectionScrollPositions = new Map();
  const pendingScrollRestorations = new Map();
  const restorationTimers = new Map();

  const clearScrollRestoration = (sectionId) => {
    const timer = restorationTimers.get(sectionId);
    if (timer) window.clearTimeout(timer);
    restorationTimers.delete(sectionId);
    pendingScrollRestorations.delete(sectionId);
  };

  const getSectionRoot = (sectionId) => (
    sectionId
      ? document.querySelector(`shop-the-look[data-section-id="${CSS.escape(sectionId)}"]`)
      : null
  );

  const restoreScrollPosition = (sectionId, position) => {
    const shopTheLook = getSectionRoot(sectionId);
    if (!shopTheLook) return;

    const currentScrollTop = window.scrollY;
    const currentSectionTop = shopTheLook.getBoundingClientRect().top;
    const nextScrollTop = Math.max(0, Math.round(currentScrollTop + currentSectionTop - position.sectionTop));
    const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    window.scrollTo({
      top: Math.min(nextScrollTop, maxScrollTop),
      left: position.left,
      behavior: 'auto',
    });
  };

  const scheduleScrollRestoration = (sectionId, position) => {
    clearScrollRestoration(sectionId);
    pendingScrollRestorations.set(sectionId, position);

    let frame = 0;
    const restoreAfterLayout = () => {
      const pendingPosition = pendingScrollRestorations.get(sectionId);
      if (!pendingPosition) return;

      restoreScrollPosition(sectionId, pendingPosition);
      if (frame++ < 8) window.requestAnimationFrame(restoreAfterLayout);
    };

    window.requestAnimationFrame(restoreAfterLayout);
    [50, 150, 300, 600, 1000].forEach((delay) => {
      window.setTimeout(() => {
        const pendingPosition = pendingScrollRestorations.get(sectionId);
        if (pendingPosition) restoreScrollPosition(sectionId, pendingPosition);
      }, delay);
    });

    restorationTimers.set(sectionId, window.setTimeout(() => clearScrollRestoration(sectionId), 1400));
  };

  const getShopTheLook = (target, sectionId) => {
    const find = (element) => {
      if (!(element instanceof Element)) return null;

      const shopTheLook = element.matches('shop-the-look')
        ? element
        : element.closest('shop-the-look') || element.querySelector('shop-the-look');
      if (!shopTheLook) return null;
      if (!sectionId || shopTheLook.dataset.sectionId === sectionId) return shopTheLook;
      return null;
    };

    return find(target) || (sectionId ? document.querySelector(`shop-the-look[data-section-id="${CSS.escape(sectionId)}"]`) : null);
  };

  const getSectionId = (event, shopTheLook) => event.detail?.sectionId || shopTheLook?.dataset.sectionId;

  document.addEventListener('shopify:section:unload', (event) => {
    if (!window.Shopify?.designMode) return;

    const shopTheLook = getShopTheLook(event.target, event.detail?.sectionId);
    const sectionId = getSectionId(event, shopTheLook);
    if (sectionId && shopTheLook) {
      sectionScrollPositions.set(sectionId, {
        left: window.scrollX,
        sectionTop: shopTheLook.getBoundingClientRect().top,
      });
    }
  }, true);

  document.addEventListener('shopify:section:load', (event) => {
    if (!window.Shopify?.designMode) return;

    const shopTheLook = getShopTheLook(event.target, event.detail?.sectionId);
    const sectionId = getSectionId(event, shopTheLook);
    const scrollPosition = sectionId ? sectionScrollPositions.get(sectionId) : undefined;
    if (!scrollPosition) return;

    sectionScrollPositions.delete(sectionId);
    scheduleScrollRestoration(sectionId, scrollPosition);
  });

  document.addEventListener('shopify:section:select', (event) => {
    if (!window.Shopify?.designMode || event.detail?.load !== true) return;

    const shopTheLook = getShopTheLook(event.target, event.detail?.sectionId);
    const sectionId = getSectionId(event, shopTheLook);
    const scrollPosition = sectionId ? pendingScrollRestorations.get(sectionId) : undefined;
    if (!scrollPosition) return;

    scheduleScrollRestoration(sectionId, scrollPosition);
  });

  document.addEventListener('shopify:block:select', (event) => {
    if (!window.Shopify?.designMode || event.detail?.load !== true) return;

    const shopTheLook = getShopTheLook(event.target, event.detail?.sectionId);
    const sectionId = getSectionId(event, shopTheLook);
    const scrollPosition = sectionId ? pendingScrollRestorations.get(sectionId) : undefined;
    if (!scrollPosition) return;

    scheduleScrollRestoration(sectionId, scrollPosition);
  });

  const cancelPendingRestorations = () => {
    pendingScrollRestorations.forEach((_, sectionId) => clearScrollRestoration(sectionId));
  };

  document.addEventListener('pointerdown', cancelPendingRestorations, { capture: true, passive: true });
  document.addEventListener('wheel', cancelPendingRestorations, { capture: true, passive: true });
  document.addEventListener('touchstart', cancelPendingRestorations, { capture: true, passive: true });
}

const editorInstances = new Set();

const handleEditorBlockSelect = (event) => {
  editorInstances.forEach((instance) => instance.handleBlockSelect(event));
};

const handleEditorBlockDeselect = (event) => {
  editorInstances.forEach((instance) => instance.handleBlockDeselect(event));
};

const registerEditorInstance = (instance) => {
  if (!editorInstances.size) {
    document.addEventListener('shopify:block:select', handleEditorBlockSelect);
    document.addEventListener('shopify:block:deselect', handleEditorBlockDeselect);
  }
  editorInstances.add(instance);
};

const unregisterEditorInstance = (instance) => {
  editorInstances.delete(instance);
  if (editorInstances.size) return;
  document.removeEventListener('shopify:block:select', handleEditorBlockSelect);
  document.removeEventListener('shopify:block:deselect', handleEditorBlockDeselect);
};

class ShopTheLook extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;

    this.initialized = true;
    this.hotspots = Array.from(this.querySelectorAll('[data-shop-the-look-hotspot]'));
    this.products = Array.from(this.querySelectorAll('[data-shop-the-look-product]'));
    this.annotations = Array.from(this.querySelectorAll('[data-shop-the-look-hotspot-annotation]'));
    this.editorMode = this.dataset.editorMode === 'true' || Boolean(window.Shopify?.designMode);
    this.bundleStatus = this.querySelector('[data-shop-the-look-bundle-status]');
    this.onClick = this.handleClick.bind(this);
    this.onKeydown = this.handleKeydown.bind(this);
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeydown);
    if (this.editorMode) registerEditorInstance(this);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeydown);
    if (this.editorMode) unregisterEditorInstance(this);
    window.clearTimeout(this.resetTimer);
    this.initialized = false;
  }

  selectProduct(index, moveFocus = false) {
    if (!this.products.length) return;

    const nextIndex = Math.min(Math.max(Number(index) || 0, 0), this.products.length - 1);
    this.classList.add('has-active-product');
    this.hotspots.forEach((hotspot, hotspotIndex) => {
      hotspot.setAttribute('aria-pressed', String(hotspotIndex === nextIndex));
    });
    this.products.forEach((product, productIndex) => {
      product.classList.toggle('is-active', productIndex === nextIndex);
    });
    this.annotations.forEach((annotation, annotationIndex) => {
      annotation.classList.toggle('is-editor-selected', this.editorMode && annotationIndex === nextIndex);
    });

    if (moveFocus) this.hotspots[nextIndex]?.focus();
  }

  handleBlockSelect(event) {
    if (!this.editorMode) return;

    const blockId = event.detail?.blockId;
    const index = this.annotations.findIndex((annotation) => annotation.dataset.blockId === blockId);
    if (index < 0) return;

    this.selectProduct(index);
  }

  handleBlockDeselect(event) {
    if (!this.editorMode) return;

    const blockId = event.detail?.blockId;
    if (blockId && !this.annotations.some((annotation) => annotation.dataset.blockId === blockId)) return;
    if (!blockId && event.target instanceof Element && !this.contains(event.target)) return;

    this.annotations.forEach((annotation) => annotation.classList.remove('is-editor-selected'));
    this.classList.remove('has-active-product');
    this.hotspots.forEach((hotspot) => hotspot.setAttribute('aria-pressed', 'false'));
    this.products.forEach((product) => product.classList.remove('is-active'));
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
