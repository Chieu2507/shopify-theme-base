const productFeatureModules = [
  './variant-picker.js',
  './product-buy-buttons.js',
  './product-description.js',
  './product-inventory.js',
  './product-media.js',
  './product-information-extras.js',
];

let productFeaturesPromise;

const nextFrame = () => new Promise((resolve) => {
  if (window.requestAnimationFrame) {
    window.requestAnimationFrame(resolve);
  } else {
    window.setTimeout(resolve, 0);
  }
});

const waitForImage = (image) => new Promise((resolve) => {
  let settled = false;
  let timeout;
  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    image.removeEventListener?.('load', finish);
    image.removeEventListener?.('error', finish);
    const decoded = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
    Promise.resolve(decoded).catch(() => {}).finally(resolve);
  };

  if (image.complete) {
    finish();
    return;
  }

  image.addEventListener?.('load', finish, { once: true });
  image.addEventListener?.('error', finish, { once: true });
  timeout = window.setTimeout(finish, 1800);
});

const waitForContentReady = async (content) => {
  const images = [...content.querySelectorAll('img')];
  const primaryImages = images
    .filter((image) => image.getAttribute('loading') !== 'lazy')
    .slice(0, 2);
  if (!primaryImages.length && images[0]) primaryImages.push(images[0]);
  await Promise.all(primaryImages.map(waitForImage));
  await nextFrame();
};

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
  if (root.matches?.('[data-quick-add-overlay]')) return root;
  return root.querySelector?.('[data-quick-add-overlay]');
};

class QuickAddController {
  constructor(dialog) {
    this.dialog = dialog;
    this.sectionRoot = dialog.closest('.shopify-section');
    this.overlay = window.ThemeOverlay?.get(dialog);
    this.abortController = new AbortController();
    this.requestController = null;
    this.currentUrl = '';
    this.opener = null;
    this.restoreFocus = true;
    this.loadingTrigger = null;
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
    return this.dialog.querySelector('[data-quick-add-content]');
  }

  get sectionId() {
    return this.dialog.dataset.quickAddSectionId;
  }

  productUrl(trigger) {
    const rawUrl = trigger?.dataset.productCardQuickAddUrl || trigger?.href;
    if (!rawUrl) return null;

    try {
      const url = new URL(rawUrl, document.baseURI || window.location.href);
      if (url.origin !== window.location.origin) return null;
      return url;
    } catch (error) {
      return null;
    }
  }

  setTriggerLoading(trigger, isLoading) {
    if (!trigger) return;

    const wrapper = trigger.closest?.('[data-product-card-quick-add-overlay-wrapper]');
    if (isLoading) {
      if (this.loadingTrigger && this.loadingTrigger !== trigger) this.setTriggerLoading(this.loadingTrigger, false);
      this.loadingTrigger = trigger;
      trigger.dataset.quickAddLoading = 'true';
      trigger.setAttribute('aria-busy', 'true');
      if (wrapper) wrapper.dataset.quickAddLoading = 'true';
      return;
    }

    delete trigger.dataset.quickAddLoading;
    trigger.removeAttribute('aria-busy');
    if (wrapper) delete wrapper.dataset.quickAddLoading;
    if (this.loadingTrigger === trigger) this.loadingTrigger = null;
  }

  clearTriggerLoading() {
    this.setTriggerLoading(this.loadingTrigger, false);
  }

  handleClick(event) {
    const retry = event.target.closest?.('[data-quick-add-retry]');
    if (retry && this.dialog.contains(retry)) {
      event.preventDefault();
      this.handleRetry();
      return;
    }

    const trigger = event.target.closest?.('[data-product-card-quick-add-overlay]');
    if (!trigger) return;
    if (trigger.dataset.quickAddLoading === 'true') return;

    const url = this.productUrl(trigger);
    if (!url) return;

    event.preventDefault();
    this.open(url, trigger, { restoreFocus: event.detail === 0 });
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
    this.open(this.currentUrl, this.opener, { restoreFocus: this.restoreFocus });
  }

  setStatus(status, message = '') {
    const content = this.content;
    if (!content) return;

    const layout = content.querySelector('[data-quick-add-layout]');
    const loading = content.querySelector('[data-quick-add-loading]');
    const error = content.querySelector('[data-quick-add-error]');
    const errorMessage = content.querySelector('[data-quick-add-error-message]');

    if (layout) layout.hidden = status !== 'content';
    if (loading) loading.hidden = status !== 'loading';
    if (error) error.hidden = status !== 'error';
    if (errorMessage && message) errorMessage.textContent = message;
  }

  async fetchContent(url, signal) {
    if (!this.sectionId) throw new Error('Quick add section is unavailable.');

    url.searchParams.set('section_id', this.sectionId);
    const response = await fetch(url.href, {
      credentials: 'same-origin',
      headers: { Accept: 'text/html' },
      signal,
    });
    if (!response.ok) throw new Error(`Unable to load quick add (${response.status}).`);

    const html = await response.text();
    const template = document.createElement('template');
    template.innerHTML = html;
    const content = template.content.querySelector('[data-quick-add-content]');
    if (!content || content.dataset.quickAddHasProduct !== 'true') {
      throw new Error('The requested product is unavailable.');
    }

    return content;
  }

  replaceContent(nextContent) {
    const currentContent = this.content;
    if (!currentContent) return;

    const fragment = nextContent.cloneNode(true);
    currentContent.replaceChildren(...fragment.childNodes);
    currentContent.dataset.quickAddHasProduct = 'true';
    if (nextContent.dataset.quickAddProductId) {
      currentContent.dataset.quickAddProductId = nextContent.dataset.quickAddProductId;
    }
  }

  async open(url, opener, { restoreFocus = true } = {}) {
    if (!this.overlay || !this.content) return;

    let targetUrl;
    try {
      targetUrl = url instanceof URL ? new URL(url.href) : new URL(url, document.baseURI || window.location.href);
    } catch (error) {
      this.setStatus('error', this.dialog.dataset.quickAddErrorLabel || error.message);
      return;
    }

    this.requestController?.abort();
    if (this.dialog.open) this.overlay.close({ immediate: true, restoreFocus: false });
    this.clearTriggerLoading();

    this.currentUrl = targetUrl.href;
    this.opener = opener;
    this.restoreFocus = restoreFocus;
    this.setTriggerLoading(opener, true);
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
      await waitForContentReady(this.content);
      if (requestController.signal.aborted || this.requestController !== requestController) return;

      // Commit the product DOM before presenting the overlay so Quick Add never
      // flashes an empty panel or exposes a loading spinner as its first frame.
      await nextFrame();
      if (requestController.signal.aborted || this.requestController !== requestController) return;

      this.dialog.removeAttribute('aria-busy');
      this.clearTriggerLoading();
      this.overlay.open({ opener, focus: true, defer: true, restoreFocus });
      window.requestAnimationFrame(() => {
        this.content.querySelectorAll('[data-product-media-gallery]').forEach((gallery) => gallery.refreshGallery?.());
      });
    } catch (error) {
      if (error.name === 'AbortError') return;
      if (this.requestController !== requestController) return;
      console.error('[Spinel] Quick add failed to load product.', error);
      this.setStatus('error', this.dialog.dataset.quickAddErrorLabel || error.message);
      this.dialog.removeAttribute('aria-busy');
      this.clearTriggerLoading();
      this.overlay.open({ opener, focus: true, defer: true, restoreFocus });
      this.dialog.querySelector('[data-quick-add-retry]')?.focus({ preventScroll: true });
    } finally {
      if (this.requestController === requestController && !requestController.signal.aborted) {
        this.dialog.removeAttribute('aria-busy');
      }
    }
  }

  handleClose() {
    this.requestController?.abort();
    this.requestController = null;
    this.clearTriggerLoading();
    this.dialog.removeAttribute('aria-busy');
    this.setStatus('loading');
  }

  destroy() {
    this.requestController?.abort();
    this.clearTriggerLoading();
    this.overlay?.destroy();
    this.abortController.abort();
    controllers.delete(this.dialog);
    if (this.sectionRoot) controllersBySection.delete(this.sectionRoot);
  }
}

const controllers = new WeakMap();
const controllersBySection = new WeakMap();

const initializeQuickAdds = (root = document) => {
  const dialog = sectionContent(root);
  if (!dialog || controllers.has(dialog)) return;

  const controller = new QuickAddController(dialog);
  if (controller.overlay) {
    controllers.set(dialog, controller);
    if (controller.sectionRoot) controllersBySection.set(controller.sectionRoot, controller);
  }
};

const destroyQuickAdds = (root) => {
  if (!root) return;
  const controller = controllersBySection.get(root)
    || (() => {
      const dialog = sectionContent(root);
      return dialog && controllers.get(dialog);
    })();
  controller?.destroy();
};

const controllerKey = '__quickAddController';
if (!window[controllerKey]) {
  window[controllerKey] = { initialize: initializeQuickAdds };
  document.addEventListener('shopify:section:load', (event) => initializeQuickAdds(event.target));
  document.addEventListener('shopify:section:unload', (event) => destroyQuickAdds(event.target));
}

initializeQuickAdds(document);
