class StickyScroll extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.stage = this.querySelector('[data-sticky-scroll-stage]');
    this.steps = this.querySelector('[data-sticky-scroll-steps]');
    this.designMode = this.dataset.designMode === 'true';
    this.desktopQuery = window.matchMedia('(min-width: 768px)');
    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.activeIndex = 0;
    this.scrollFrame = null;
    this.refreshFrame = null;

    this.handleScroll = this.handleScroll.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.handleBlockSelect = this.handleBlockSelect.bind(this);
    this.refresh = this.refresh.bind(this);

    window.addEventListener('scroll', this.handleScroll, { passive: true, signal });
    window.addEventListener('resize', this.handleViewportChange, { signal });
    this.desktopQuery.addEventListener?.('change', this.handleViewportChange, { signal });
    document.addEventListener('shopify:block:select', this.handleBlockSelect, { signal });
    document.addEventListener('shopify:section:load', this.refresh, { signal });
    document.addEventListener('shopify:section:reorder', this.refresh, { signal });

    if (this.designMode && 'MutationObserver' in window) {
      this.mutationObserver = new MutationObserver(() => this.scheduleRefresh());
      this.mutationObserver.observe(this.stage, { childList: true, subtree: true });
    }

    this.refresh();
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = null;
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    if (this.scrollFrame) window.cancelAnimationFrame(this.scrollFrame);
    if (this.refreshFrame) window.cancelAnimationFrame(this.refreshFrame);
    this.scrollFrame = null;
    this.refreshFrame = null;
  }

  get panels() {
    return [...this.querySelectorAll('[data-sticky-scroll-panel]')];
  }

  scheduleRefresh() {
    if (this.refreshFrame) return;
    this.refreshFrame = window.requestAnimationFrame(() => {
      this.refreshFrame = null;
      this.refresh();
    });
  }

  refresh() {
    const panels = this.panels;
    this.style.setProperty('--sticky-scroll-panel-count', Math.max(panels.length, 1));
    this.buildSteps();

    if (!this.desktopQuery.matches || panels.length === 0) {
      this.classList.remove('is-enhanced');
      panels.forEach((panel) => {
        panel.classList.remove('is-active');
        panel.removeAttribute('aria-hidden');
        panel.inert = false;
      });
      return;
    }

    this.classList.add('is-enhanced');
    this.updateFromScroll();
  }

  buildSteps() {
    if (!this.steps) return;
    const panels = this.panels;
    this.steps.replaceChildren();

    panels.forEach((panel, index) => {
      const step = document.createElement('button');
      step.type = 'button';
      step.className = 'sticky-scroll__step';
      step.dataset.stickyScrollStep = String(index);
      step.setAttribute('aria-label', `Go to step ${index + 1}`);
      step.addEventListener('click', () => this.scrollToPanel(index));
      this.steps.append(step);
    });
  }

  handleScroll() {
    if (!this.classList.contains('is-enhanced') || this.scrollFrame) return;
    this.scrollFrame = window.requestAnimationFrame(() => {
      this.scrollFrame = null;
      this.updateFromScroll();
    });
  }

  handleViewportChange() {
    this.refresh();
  }

  updateFromScroll() {
    const panels = this.panels;
    if (!this.desktopQuery.matches || panels.length === 0) return;

    const rootTop = this.getBoundingClientRect().top + window.scrollY;
    const availableScroll = Math.max(1, this.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, (window.scrollY - rootTop) / availableScroll));
    const activeIndex = Math.min(panels.length - 1, Math.floor(progress * panels.length));

    panels.forEach((panel, index) => {
      const isActive = index === activeIndex;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      if (!this.designMode) panel.inert = !isActive;
    });

    this.activeIndex = activeIndex;
    this.steps?.querySelectorAll('[data-sticky-scroll-step]').forEach((step, index) => {
      const isActive = index === activeIndex;
      step.classList.toggle('is-active', isActive);
      if (isActive) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
  }

  scrollToPanel(index) {
    const panels = this.panels;
    const panel = panels[index];
    if (!panel) return;

    if (!this.desktopQuery.matches || panels.length < 2) {
      panel.scrollIntoView({ behavior: this.reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    const rootTop = this.getBoundingClientRect().top + window.scrollY;
    const availableScroll = Math.max(0, this.offsetHeight - window.innerHeight);
    const target = rootTop + availableScroll * (index / (panels.length - 1));
    window.scrollTo({ top: target, behavior: this.reducedMotionQuery.matches ? 'auto' : 'smooth' });
  }

  handleBlockSelect(event) {
    const selectedPanel = event.target.closest?.('[data-sticky-scroll-panel]')
      || event.target.querySelector?.('[data-sticky-scroll-panel]');
    if (!selectedPanel || !this.contains(selectedPanel)) return;

    const index = Number.parseInt(selectedPanel.dataset.stickyScrollIndex, 10);
    if (Number.isInteger(index)) this.scrollToPanel(index);
  }
}

if (!customElements.get('sticky-scroll')) {
  customElements.define('sticky-scroll', StickyScroll);
}
