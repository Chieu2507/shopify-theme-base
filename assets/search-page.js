(() => {
  const instances = new WeakMap();
  const initialize = (root) => {
    if (instances.has(root)) return;
    const controller = new AbortController();
    const options = { signal: controller.signal };
    const tabs = Array.from(root.querySelectorAll('[data-search-page-tab]'));
    const panels = root.querySelectorAll('[data-search-page-panel]');
    const input = root.querySelector('input[name="q"]');
    const clear = root.querySelector('[data-search-page-clear]');
    const select = (tab, focus = false) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.searchPagePanel !== tab.dataset.searchPageTab; });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab), options);
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        select(tabs[next], true);
      }, options);
    });
    if (tabs.length) select(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
    if (input && clear) {
      const syncClear = () => { clear.hidden = !input.value; };
      input.addEventListener('input', syncClear, options);
      clear.addEventListener('click', () => {
        input.value = '';
        syncClear();
        input.focus();
      }, options);
      syncClear();
    }
    root.classList.add('search-page--enhanced');
    instances.set(root, controller);
  };
  const roots = (parent) => [
    ...(parent.matches?.('[data-search-page]') ? [parent] : []),
    ...parent.querySelectorAll('[data-search-page]')
  ];
  const initializeRoot = (parent = document) => roots(parent).forEach(initialize);
  document.addEventListener('shopify:section:load', (event) => initializeRoot(event.target));
  document.addEventListener('shopify:section:unload', (event) => roots(event.target).forEach((root) => {
    instances.get(root)?.abort();
    instances.delete(root);
  }));
  initializeRoot();
})();
