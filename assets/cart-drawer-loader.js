(() => {
  const loaderScript = document.currentScript;
  const source = loaderScript?.dataset.cartDrawerModule;
  const triggerSelector = '[data-cart-drawer-open]';
  let modulePromise;

  const getDrawer = () => document.querySelector('cart-drawer');

  const cleanup = () => {
    document.removeEventListener('pointerover', handleIntent);
    document.removeEventListener('focusin', handleIntent);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('product:add:success', handleProductAdd);
    document.removeEventListener('cart:add:success', handleProductAdd);
  };

  const load = () => {
    if (customElements.get('cart-drawer')) return Promise.resolve(getDrawer());
    if (!source) return Promise.reject(new Error('Cart drawer module URL is unavailable.'));

    if (!modulePromise) {
      modulePromise = import(new URL(source, document.baseURI).href)
        .then(() => customElements.whenDefined('cart-drawer'))
        .then(() => {
          cleanup();
          return getDrawer();
        })
        .catch((error) => {
          modulePromise = null;
          console.error('[Jovie] Cart drawer failed to load.', error);
          throw error;
        });
    }

    return modulePromise;
  };

  function handleIntent(event) {
    if (!event.target.closest?.(triggerSelector)) return;
    load().catch(() => {});
  }

  function handleClick(event) {
    const trigger = event.target.closest?.(triggerSelector);
    if (!trigger || customElements.get('cart-drawer')) return;

    event.preventDefault();
    load()
      .then((drawer) => drawer?.open(trigger))
      .catch(() => {
        if (trigger.href) window.location.assign(trigger.href);
      });
  }

  function handleProductAdd(event) {
    if (!event.detail?.item || customElements.get('cart-drawer')) return;
    load()
      .then((drawer) => drawer?.open(event.detail.button || null))
      .catch(() => {});
  }

  document.addEventListener('pointerover', handleIntent, { passive: true });
  document.addEventListener('focusin', handleIntent);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('product:add:success', handleProductAdd);
  document.addEventListener('cart:add:success', handleProductAdd);

  if (window.Shopify?.designMode) load().catch(() => {});
})();
