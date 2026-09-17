const instances = new WeakMap();

const initialize = (section) => {
  if (!section || instances.has(section)) return;
  const tabs = [...section.querySelectorAll('[data-collections-with-tabs-tab]')];
  const panels = [...section.querySelectorAll('[data-collections-with-tabs-panel]')];
  if (!tabs.length || !panels.length) return;

  const controller = new AbortController();
  let timer = 0;
  let progressFrame = 0;
  let activationFrame = 0;
  let paused = false;
  const duration = Math.max(1, Number(section.dataset.autoRotateSpeed || 6)) * 1000;
  const clearRotation = (resetProgress = true) => {
    window.clearTimeout(timer);
    window.cancelAnimationFrame(progressFrame);
    timer = 0;
    progressFrame = 0;
    if (resetProgress) tabs.forEach((tab) => tab.style.setProperty('--collections-with-tabs-progress-scale', '0'));
  };
  const animateProgress = () => {
    if (section.dataset.autoRotate !== 'true' || tabs.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const startedAt = performance.now();
    const tick = (now) => {
      const activeTab = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
      activeTab?.style.setProperty('--collections-with-tabs-progress-scale', String(Math.min(1, (now - startedAt) / duration)));
      if (now - startedAt < duration) progressFrame = window.requestAnimationFrame(tick);
    };
    progressFrame = window.requestAnimationFrame(tick);
  };
  const activate = (id, focus = false) => {
    const activeTab = tabs.find((tab) => tab.dataset.collectionsWithTabsId === id) || tabs[0];
    const activeId = activeTab.dataset.collectionsWithTabsId;
    tabs.forEach((tab) => {
      const active = tab === activeTab;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    const activePanel = panels.find((panel) => panel.dataset.collectionsWithTabsId === activeId) || panels[0];
    window.cancelAnimationFrame(activationFrame);
    panels.forEach((panel) => {
      panel.hidden = panel !== activePanel;
      panel.dataset.active = 'false';
    });
    activationFrame = window.requestAnimationFrame(() => { activePanel.dataset.active = 'true'; });
    if (focus) activeTab.focus();
    scheduleRotation();
  };
  const canRotate = () => section.dataset.autoRotate === 'true'
    && tabs.length > 1
    && !paused
    && !document.hidden
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scheduleRotation = () => {
    clearRotation();
    if (!canRotate()) return;
    animateProgress();
    timer = window.setTimeout(() => {
      if (!canRotate()) return;
      const active = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
      activate(tabs[(active + 1) % tabs.length].dataset.collectionsWithTabsId);
    }, duration);
  };
  section.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-collections-with-tabs-tab]');
    if (tab && section.contains(tab)) activate(tab.dataset.collectionsWithTabsId);
  }, { signal: controller.signal });
  section.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[data-collections-with-tabs-tab]');
    if (!tab || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = tabs.indexOf(tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + tabs.length) % tabs.length;
    activate(tabs[next].dataset.collectionsWithTabsId, true);
  }, { signal: controller.signal });
  const pause = () => {
    paused = true;
    clearRotation();
  };
  const resume = () => {
    paused = false;
    scheduleRotation();
  };
  section.addEventListener('focusin', pause, { signal: controller.signal });
  section.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (section.contains(document.activeElement)) return;
      resume();
    }, 0);
  }, { signal: controller.signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else resume();
  }, { signal: controller.signal });
  activate(tabs[0].dataset.collectionsWithTabsId);
  instances.set(section, { controller, clearRotation, get activationFrame() { return activationFrame; } });
};

const destroy = (section) => {
  const state = instances.get(section);
  if (!state) return;
  state.controller.abort();
  state.clearRotation();
  window.cancelAnimationFrame(state.activationFrame);
  instances.delete(section);
};
const initializeRoot = (root = document) => {
  if (root.matches?.('[data-collections-with-tabs]')) initialize(root);
  root.querySelectorAll?.('[data-collections-with-tabs]').forEach(initialize);
};
const destroyRoot = (root) => {
  if (root.matches?.('[data-collections-with-tabs]')) destroy(root);
  root.querySelectorAll?.('[data-collections-with-tabs]').forEach(destroy);
};
document.addEventListener('shopify:section:load', (event) => initializeRoot(event.target));
document.addEventListener('shopify:section:unload', (event) => destroyRoot(event.target));
document.addEventListener('shopify:block:select', (event) => {
  const item = event.target.closest?.('.collections-with-tabs-item');
  const section = item?.closest('[data-collections-with-tabs]');
  const tab = item?.querySelector('[data-collections-with-tabs-tab]');
  if (!section || !tab) return;
  tab?.click();
});
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', () => initializeRoot(), { once: true }) : initializeRoot();
