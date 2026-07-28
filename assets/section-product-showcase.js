if (!customElements.get('noryvelle-pebble-products')) {
  class NoryvellePebbleProducts extends HTMLElement {
    connectedCallback() {
      this.controller = new AbortController();
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.addEventListener('click', this.handleClick.bind(this), { signal: this.controller.signal });
      this.addEventListener('keydown', this.handleKeydown.bind(this), { signal: this.controller.signal });
      document.addEventListener('shopify:block:select', this.handleBlockSelect.bind(this), {
        signal: this.controller.signal,
      });
      this.querySelectorAll('[data-npp-rail]').forEach((rail) => {
        rail.addEventListener('scroll', () => this.updateArrows(rail), {
          passive: true,
          signal: this.controller.signal,
        });
        this.updateArrows(rail);
      });
    }

    disconnectedCallback() {
      this.controller?.abort();
    }

    handleClick(event) {
      const tab = event.target.closest('[data-npp-tab]');
      if (tab && this.contains(tab)) {
        this.selectTab(tab);
        return;
      }

      const arrow = event.target.closest('[data-npp-previous], [data-npp-next]');
      if (!arrow || !this.contains(arrow)) return;
      const rail = arrow.closest('[data-npp-panel]')?.querySelector('[data-npp-rail]');
      if (!rail) return;
      const card = rail.querySelector('.noryvelle-pebble-products__product');
      const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
      const distance = (card?.getBoundingClientRect().width || rail.clientWidth) + gap;
      rail.scrollBy({
        left: arrow.hasAttribute('data-npp-previous') ? -distance : distance,
        behavior: this.reduceMotion ? 'auto' : 'smooth',
      });
    }

    handleKeydown(event) {
      const tab = event.target.closest('[data-npp-tab]');
      if (!tab) return;
      const tabs = Array.from(this.querySelectorAll('[data-npp-tab]'));
      const currentIndex = tabs.indexOf(tab);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
      if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex === currentIndex) return;
      event.preventDefault();
      this.selectTab(tabs[nextIndex], true);
    }

    handleBlockSelect(event) {
      const panel = this.querySelector(`[data-npp-panel][data-block-id="${CSS.escape(event.detail?.blockId || '')}"]`);
      if (!panel) return;
      const tab = this.querySelector(`[data-npp-tab][aria-controls="${CSS.escape(panel.id)}"]`);
      this.selectTab(tab);
    }

    selectTab(selectedTab, moveFocus = false) {
      if (!selectedTab) return;
      this.querySelectorAll('[data-npp-tab]').forEach((tab) => {
        const selected = tab === selectedTab;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });
      this.querySelectorAll('[data-npp-panel]').forEach((panel) => {
        panel.hidden = panel.id !== selectedTab.getAttribute('aria-controls');
      });
      const panel = this.querySelector(`#${CSS.escape(selectedTab.getAttribute('aria-controls'))}`);
      const rail = panel?.querySelector('[data-npp-rail]');
      if (rail) requestAnimationFrame(() => this.updateArrows(rail));
      if (moveFocus) selectedTab.focus();
    }

    updateArrows(rail) {
      const panel = rail.closest('[data-npp-panel]');
      const previous = panel?.querySelector('[data-npp-previous]');
      const next = panel?.querySelector('[data-npp-next]');
      if (!previous || !next) return;
      const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
      previous.disabled = rail.scrollLeft <= 1;
      next.disabled = rail.scrollLeft >= maximum - 1;
    }
  }

  customElements.define('noryvelle-pebble-products', NoryvellePebbleProducts);
}
