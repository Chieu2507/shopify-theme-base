const productFeatureModules = [
  './variant-picker.js',
  './product-buy-buttons.js',
  './product-description.js',
  './product-inventory.js',
  './product-media.js',
  './product-information-extras.js',
];

let productFeaturesPromise;

const nextFrame = () => new Promise((resolve) => window.requestAnimationFrame(resolve));

const loadProductFeatures = () => {
  if (!productFeaturesPromise) {
    productFeaturesPromise = Promise.all(productFeatureModules.map((moduleUrl) => import(moduleUrl)))
      .catch((error) => {
        productFeaturesPromise = null;
        throw error;
      });
  }

  return productFeaturesPromise;
};

const sectionContent = (root) => {
  if (!root) return null;
  if (root.matches?.('[data-quick-view-overlay]')) return root;
  return root.querySelector?.('[data-quick-view-overlay]');
};

class QuickViewController {
  constructor(dialog) {
    this.dialog = dialog;
    this.sectionRoot = dialog.closest('.shopify-section');
    this.overlay = window.ThemeOverlay?.get(dialog);
    this.abortController = new AbortController();
    this.requestController = null;
    this.currentUrl = '';
    this.opener = null;
    this.signal = this.abortController.signal;

    if (!this.overlay) return;

    this.handleClick = this.handleClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleRetry = this.handleRetry.bind(this);

    document.addEventListener('click', this.handleClick, { capture: true, signal: this.signal });
    document.addEventListener('submit', this.handleSubmit, { capture: true, signal: this.signal });
    document.addEventListener('shopify:section:unload', (event) => {
      if (event.target === this.sectionRoot || event.target?.contains?.(this.sectionRoot)) this.destroy();
    }, { signal: this.signal });
    this.dialog.addEventListener('close', this.handleClose, { signal: this.signal });
  }

  get content() {
    return this.dialog.querySelector('[data-quick-view-content]');
  }

  get sectionId() {
    return this.dialog.dataset.quickViewSectionId;
  }

  productUrl(trigger) {
    const rawUrl = trigger?.dataset.productCardQuickViewUrl || trigger?.href;
    if (!rawUrl) return null;

    try {
      const url = new URL(rawUrl, document.baseURI || window.location.href);
      if (url.origin !== window.location.origin) return null;
      return url;
    } catch (error) {
      return null;
    }
  }

  handleClick(event) {
    const retry = event.target.closest?.('[data-quick-view-retry]');
    if (retry && this.dialog.contains(retry)) {
      event.preventDefault();
      this.handleRetry();
      return;
    }

    const trigger = event.target.closest?.('[data-product-card-quick-view]');
    if (!trigger) return;

    const url = this.productUrl(trigger);
    if (!url) return;

    event.preventDefault();
    this.open(url, trigger);
  }

  handleSubmit(event) {
    const form = event.target.closest?.('form[action*="/cart/add"]');
    if (!form || !this.dialog.contains(form) || !form.querySelector('[name="id"]')?.value) return;

    // The cart drawer listens to the same submit event. Let it start its request,
    // then close this overlay without stealing the drawer's focus.
    window.queueMicrotask(() => this.overlay?.close({ restoreFocus: false }));
  }

  handleRetry() {
    if (!this.currentUrl) return;
    this.open(this.currentUrl, this.opener);
  }

  setStatus(status, message = '') {
    const content = this.content;
    if (!content) return;

    const layout = content.querySelector('[data-quick-view-layout]');
    const loading = content.querySelector('[data-quick-view-loading]');
    const error = content.querySelector('[data-quick-view-error]');
    const errorMessage = content.querySelector('[data-quick-view-error-message]');

    if (layout) layout.hidden = status !== 'content';
    if (loading) loading.hidden = status !== 'loading';
    if (error) error.hidden = status !== 'error';
    if (errorMessage && message) errorMessage.textContent = message;
  }

  async fetchContent(url, signal) {
    if (!this.sectionId) throw new Error('Quick view section is unavailable.');

    url.searchParams.set('section_id', this.sectionId);
    const response = await fetch(url.href, {
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
      signal,
    });
    if (!response.ok) throw new Error(`Unable to load quick view (${response.status}).`);

    const html = await response.text();
    const template = document.createElement('template');
    template.innerHTML = html;
    const content = template.content.querySelector('[data-quick-view-content]');
    if (!content || content.dataset.quickViewHasProduct !== 'true') {
      throw new Error('The requested product is unavailable.');
    }

    return content;
  }

  replaceContent(nextContent) {
    const currentContent = this.content;
    if (!currentContent) return;

    const fragment = nextContent.cloneNode(true);
    currentContent.replaceChildren(...fragment.childNodes);
    currentContent.dataset.quickViewHasProduct = 'true';
    if (nextContent.dataset.quickViewProductId) {
      currentContent.dataset.quickViewProductId = nextContent.dataset.quickViewProductId;
    }
  }

  async open(url, opener) {
    if (!this.overlay || !this.content) return;

    let targetUrl;
    try {
      targetUrl = url instanceof URL ? new URL(url.href) : new URL(url, document.baseURI || window.location.href);
    } catch (error) {
      this.setStatus('error', this.dialog.dataset.quickViewErrorLabel || error.message);
      return;
    }

    this.requestController?.abort();
    if (this.dialog.open) this.overlay.close({ immediate: true, restoreFocus: false });

    this.currentUrl = targetUrl.href;
    this.opener = opener;
    const requestController = new AbortController();
    this.requestController = requestController;
    this.setStatus('loading');
    this.dialog.setAttribute('aria-busy', 'true');

    try {
      const nextContent = await this.fetchContent(targetUrl, requestController.signal);
      if (requestController.signal.aborted || this.requestController !== requestController) return;

      this.replaceContent(nextContent);
      await loadProductFeatures();
      if (requestController.signal.aborted || this.requestController !== requestController) return;
      this.setStatus('content');

      // Let the browser commit the product DOM before presenting the overlay.
      // This keeps the first visible frame useful instead of showing a spinner.
      await nextFrame();
      if (requestController.signal.aborted || this.requestController !== requestController) return;

      this.dialog.removeAttribute('aria-busy');
      this.overlay.open({ opener, focus: true });
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (this.requestController !== requestController) return;
      console.error('[Spinel] Quick view failed to load product.', error);
      this.setStatus('error', this.dialog.dataset.quickViewErrorLabel || error.message);
      this.dialog.removeAttribute('aria-busy');
      this.overlay.open({ opener, focus: true });
      this.dialog.querySelector('[data-quick-view-retry]')?.focus({ preventScroll: true });
    } finally {
      if (this.requestController === requestController && !requestController.signal.aborted) {
        this.dialog.removeAttribute('aria-busy');
      }
    }
  }

  handleClose() {
    this.requestController?.abort();
    this.requestController = null;
    this.dialog.removeAttribute('aria-busy');
    this.setStatus('loading');
  }

  destroy() {
    this.requestController?.abort();
    this.overlay?.destroy();
    this.abortController.abort();
    controllers.delete(this.dialog);
    if (this.sectionRoot) controllersBySection.delete(this.sectionRoot);
  }
}

const controllers = new WeakMap();
const controllersBySection = new WeakMap();

const initializeQuickViews = (root = document) => {
  const dialog = sectionContent(root);
  if (!dialog || controllers.has(dialog)) return;

  const controller = new QuickViewController(dialog);
  if (controller.overlay) {
    controllers.set(dialog, controller);
    if (controller.sectionRoot) controllersBySection.set(controller.sectionRoot, controller);
  }
};

const destroyQuickViews = (root) => {
  if (!root) return;
  const controller = controllersBySection.get(root)
    || (() => {
      const dialog = sectionContent(root);
      return dialog && controllers.get(dialog);
    })();
  controller?.destroy();
};

const controllerKey = '__quickViewController';
if (!window[controllerKey]) {
  window[controllerKey] = { initialize: initializeQuickViews };
  document.addEventListener('shopify:section:load', (event) => initializeQuickViews(event.target));
  document.addEventListener('shopify:section:unload', (event) => destroyQuickViews(event.target));
}

initializeQuickViews(document);
