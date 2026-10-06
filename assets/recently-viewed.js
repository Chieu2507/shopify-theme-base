(() => {
  const key = 'spinel:recently-viewed:v1';
  const read = () => {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(data) ? data.filter((path) => typeof path === 'string' && /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?products\/[a-z0-9-]+$/i.test(path)).slice(0, 8) : [];
    } catch { return []; }
  };
  const viewed = document.querySelector('[data-recently-viewed-card]')?.dataset.productUrl;
  if (viewed) {
    try { localStorage.setItem(key, JSON.stringify([viewed, ...read().filter((url) => url !== viewed)].slice(0, 8))); } catch { /* Storage may be unavailable. */ }
  }
  const instances = new WeakMap();
  const initialize = async (root) => {
    if (instances.has(root)) return;
    const controller = new AbortController();
    instances.set(root, controller);
    const paths = read().slice(0, Number(root.dataset.limit) || 4);
    const grid = root.querySelector('[data-recently-viewed-grid]');
    if (!paths.length || !grid) return;
    const cards = await Promise.all(paths.map(async (path) => {
      try {
        const url = new URL(path, window.location.origin);
        url.searchParams.set('section_id', 'recently-viewed-card');
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return null;
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        return doc.querySelector('[data-recently-viewed-card]')?.content.cloneNode(true) || null;
      } catch { return null; }
    }));
    if (controller.signal.aborted || !root.isConnected) return;
    cards.filter(Boolean).forEach((card) => grid.append(card));
    if (grid.children.length) {
      root.hidden = false;
      window.ThemeAnimations?.init(grid);
      grid.dispatchEvent(new CustomEvent('collection:products-loaded', { bubbles: true }));
    }
  };
  const roots = (parent) => [
    ...(parent.matches?.('[data-recently-viewed]') ? [parent] : []),
    ...parent.querySelectorAll('[data-recently-viewed]')
  ];
  const init = (parent = document) => roots(parent).forEach(initialize);
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  document.addEventListener('shopify:section:unload', (event) => roots(event.target).forEach((root) => {
    instances.get(root)?.abort();
    instances.delete(root);
  }));
  init();
})();
