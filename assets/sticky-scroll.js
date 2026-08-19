class StickyScroll extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.stage = this.querySelector('[data-sticky-scroll-stage]');
    this.steps = this.querySelector('[data-sticky-scroll-steps]');
    this.designMode = this.dataset.designMode === 'true';
    this.desktopQuery = window.matchMedia('(min-width: 768px)');
    this.mobileLayout = this.dataset.mobileLayout || 'stacked';
    this.scrollEffectStyle = this.dataset.scrollEffectStyle || '';
    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.header = document.querySelector('[data-header], .header');
    this.activeIndex = 0;
    this.hasActivePanel = false;
    this.mediaTransitionFrame = null;
    this.mediaTransitionTimeout = null;
    this.previousProgress = 0;
    this.scrollFrame = null;
    this.refreshFrame = null;

    this.handleScroll = this.handleScroll.bind(this);
    this.handleViewportChange = this.handleViewportChange.bind(this);
    this.handleBlockSelect = this.handleBlockSelect.bind(this);
    this.handleSectionRefresh = this.handleSectionRefresh.bind(this);
    this.refresh = this.refresh.bind(this);

    window.addEventListener('scroll', this.handleScroll, { passive: true, signal });
    window.addEventListener('resize', this.handleViewportChange, { signal });
    this.desktopQuery.addEventListener?.('change', this.handleViewportChange, { signal });
    document.addEventListener('shopify:block:select', this.handleBlockSelect, { signal });
    document.addEventListener('shopify:section:load', this.handleSectionRefresh, { signal });
    document.addEventListener('shopify:section:reorder', this.handleSectionRefresh, { signal });

    if (this.designMode && 'MutationObserver' in window) {
      this.mutationObserver = new MutationObserver((mutations) => {
        const hasPanelChange = mutations.some((mutation) => {
          if (mutation.type === 'attributes') {
            return mutation.target.closest?.('[data-sticky-scroll-panel]');
          }

          return [...mutation.addedNodes, ...mutation.removedNodes].some((node) =>
            node.nodeType === Node.ELEMENT_NODE
            && (node.matches?.('[data-sticky-scroll-panel]') || node.querySelector?.('[data-sticky-scroll-panel]'))
          );
        });

        if (hasPanelChange) this.scheduleRefresh();
      });
      this.mutationObserver.observe(this.stage, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'srcset', 'style'],
      });
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
    if (this.mediaTransitionFrame) window.cancelAnimationFrame(this.mediaTransitionFrame);
    if (this.mediaTransitionTimeout) window.clearTimeout(this.mediaTransitionTimeout);
    this.scrollFrame = null;
    this.refreshFrame = null;
  }

  get panels() {
    return [...this.querySelectorAll('[data-sticky-scroll-panel]')];
  }

  get mediaLayers() {
    return [...this.querySelectorAll('[data-image-stack-media-index]')];
  }

  syncSceneMediaLayers(panels = this.panels) {
    const stack = this.querySelector('[data-image-stack-media-stack]');
    if (this.scrollEffectStyle !== 'scene' || !stack) return;

    const currentLayers = [...stack.querySelectorAll('[data-image-stack-media-index]')];
    const sources = panels.map((panel) => panel.querySelector('.image-stack__media'));
    const isCurrent = currentLayers.length === sources.length
      && currentLayers.every((layer, index) => layer.dataset.sourceMarkup === sources[index]?.innerHTML);

    if (isCurrent) return;

    const fragment = document.createDocumentFragment();
    sources.forEach((source, index) => {
      if (!source) return;

      const layer = document.createElement('div');
      layer.className = 'image-stack__media-layer';
      layer.dataset.imageStackMediaIndex = String(index);
      layer.dataset.sourceMarkup = source.innerHTML;
      layer.style.setProperty('--image-stack-card-ratio', source.closest('[data-sticky-scroll-panel]')?.style.getPropertyValue('--image-stack-card-ratio') || '4 / 5');
      layer.style.setProperty('--sticky-scroll-image-position', source.closest('[data-sticky-scroll-panel]')?.style.getPropertyValue('--sticky-scroll-image-position') || 'center center');
      layer.innerHTML = source.innerHTML;
      fragment.append(layer);
    });

    stack.replaceChildren(fragment);
  }

  shouldEnhance() {
    return this.desktopQuery.matches || this.mobileLayout === 'sticky';
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
    const headerHeight = this.updateHeaderOffset();
    this.style.setProperty('--sticky-scroll-panel-count', Math.max(panels.length, 1));
    this.syncSceneMediaLayers(panels);
    this.buildSteps();

    if (!this.shouldEnhance() || panels.length === 0) {
      this.classList.remove('is-enhanced');
      this.style.removeProperty('--sticky-scroll-scroll-height');
      panels.forEach((panel) => {
        panel.classList.remove('is-active', 'is-before', 'is-after');
        panel.removeAttribute('aria-hidden');
        panel.inert = false;
      });
      return;
    }

    this.classList.add('is-enhanced');
    const stageHeight = Math.max(1, this.stage.getBoundingClientRect().height);
    // A sticky element positioned below a fixed header reaches the bottom of
    // its containing block one header-height earlier than a top: 0 element.
    // Reserve that distance so the final panel remains pinned until progress
    // reaches 100%, rather than dropping out of the stage prematurely.
    this.style.setProperty('--sticky-scroll-scroll-height', `${stageHeight * panels.length * 1.2 + headerHeight}px`);
    this.updateFromScroll();
  }

  updateHeaderOffset() {
    if (!this.header?.isConnected) {
      this.header = document.querySelector('[data-header], .header');
    }

    const headerHeight = this.header?.getBoundingClientRect().height || 0;
    const offset = Math.ceil(headerHeight);
    this.style.setProperty('--sticky-scroll-header-offset', `${offset}px`);
    return offset;
  }

  buildSteps() {
    if (!this.steps) return;
    const panels = this.panels;
    const existingSteps = this.steps.querySelectorAll('[data-sticky-scroll-step]');

    if (existingSteps.length === panels.length) return;

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

  handleSectionRefresh(event) {
    if (event.target?.contains(this)) this.scheduleRefresh();
  }

  updateFromScroll() {
    const panels = this.panels;
    if (!this.shouldEnhance() || panels.length === 0) return;

    const rootTop = this.getBoundingClientRect().top + window.scrollY;
    const rootStyles = window.getComputedStyle(this);
    const paddingTop = Number.parseFloat(rootStyles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(rootStyles.paddingBottom) || 0;
    const headerHeight = Number.parseFloat(rootStyles.getPropertyValue('--sticky-scroll-header-offset')) || 0;
    const stageHeight = Math.max(1, this.stage.getBoundingClientRect().height);
    const scrollStart = rootTop + paddingTop - headerHeight;
    const availableScroll = Math.max(1, this.offsetHeight - paddingTop - paddingBottom - stageHeight - headerHeight);
    const progress = Math.min(1, Math.max(0, (window.scrollY - scrollStart) / availableScroll));
    const activeIndex = Math.min(panels.length - 1, Math.floor(progress * panels.length));

    const isMovingBackward = progress < this.previousProgress;
    this.dataset.scrollDirection = isMovingBackward ? 'backward' : 'forward';
    this.updateEffectProgress(panels, progress);

    panels.forEach((panel, index) => {
      const isActive = index === activeIndex;
      panel.classList.toggle('is-active', isActive);
      panel.classList.toggle('is-before', index < activeIndex);
      panel.classList.toggle('is-after', index > activeIndex);
      panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      if (!this.designMode) panel.inert = !isActive;
    });

    this.mediaLayers.forEach((layer) => {
      const layerIndex = Number.parseInt(layer.dataset.imageStackMediaIndex, 10);
      const panel = panels[layerIndex];
      if (!panel) return;

      layer.classList.toggle('is-active', panel.classList.contains('is-active'));
      layer.classList.toggle('is-before', panel.classList.contains('is-before'));
      layer.classList.toggle('is-after', panel.classList.contains('is-after'));
      layer.classList.remove('is-entering', 'is-leaving');
    });

    const activeChanged = this.hasActivePanel && activeIndex !== this.activeIndex;
    if (activeChanged && this.scrollEffectStyle === 'scene') {
      if (this.mediaTransitionFrame) window.cancelAnimationFrame(this.mediaTransitionFrame);
      if (this.mediaTransitionTimeout) window.clearTimeout(this.mediaTransitionTimeout);
      this.mediaLayers.forEach((layer) => {
        layer.classList.remove('is-reverse-entering', 'is-reverse-exiting');
      });

      if (isMovingBackward) {
        const outgoingLayer = this.mediaLayers.find((layer) =>
          Number.parseInt(layer.dataset.imageStackMediaIndex, 10) === this.activeIndex
        );

        if (outgoingLayer) {
          // Reverse the downward reveal: keep the departing image above the
          // newly-active one, then clip it from the top edge to expose the
          // image beneath. This makes upward scrolling the true inverse.
          outgoingLayer.classList.add('is-reverse-entering');
          void outgoingLayer.offsetWidth;
          this.mediaTransitionFrame = window.requestAnimationFrame(() => {
            this.mediaTransitionFrame = window.requestAnimationFrame(() => {
              this.mediaTransitionFrame = null;
              outgoingLayer.classList.remove('is-reverse-entering');
              outgoingLayer.classList.add('is-reverse-exiting');
              this.mediaTransitionTimeout = window.setTimeout(() => {
                this.mediaTransitionTimeout = null;
                outgoingLayer.classList.remove('is-reverse-exiting');
              }, 760);
            });
          });
        }
      } else {
        const incomingLayer = this.mediaLayers.find((layer) =>
          Number.parseInt(layer.dataset.imageStackMediaIndex, 10) === activeIndex
        );

        if (incomingLayer) {
          incomingLayer.classList.add('is-entering');
          void incomingLayer.offsetWidth;
          this.mediaTransitionFrame = window.requestAnimationFrame(() => {
            this.mediaTransitionFrame = window.requestAnimationFrame(() => {
              this.mediaTransitionFrame = null;
              incomingLayer.classList.remove('is-entering');
            });
          });
        }
      }
    }

    this.activeIndex = activeIndex;
    this.hasActivePanel = true;
    this.steps?.querySelectorAll('[data-sticky-scroll-step]').forEach((step, index) => {
      const isActive = index === activeIndex;
      step.classList.toggle('is-active', isActive);
      if (isActive) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });

    this.previousProgress = progress;
  }

  updateEffectProgress(panels, progress) {
    if (this.scrollEffectStyle !== 'horizontal') return;

    const scaledProgress = progress * panels.length;

    panels.forEach((panel, index) => {
      panel.style.setProperty('--image-stack-scene-z-index', String(index + 1));

      const sceneProgress = index === 0
        ? 1
        : Math.min(1, Math.max(0, scaledProgress - index));
      panel.style.setProperty('--image-stack-scene-reveal', `${(sceneProgress * 100).toFixed(3)}%`);
    });
  }

  scrollToPanel(index) {
    const panels = this.panels;
    const panel = panels[index];
    if (!panel) return;

    if (!this.shouldEnhance() || panels.length < 2) {
      panel.scrollIntoView({ behavior: this.reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    const rootTop = this.getBoundingClientRect().top + window.scrollY;
    const rootStyles = window.getComputedStyle(this);
    const paddingTop = Number.parseFloat(rootStyles.paddingTop) || 0;
    const paddingBottom = Number.parseFloat(rootStyles.paddingBottom) || 0;
    const headerHeight = Number.parseFloat(rootStyles.getPropertyValue('--sticky-scroll-header-offset')) || 0;
    const stageHeight = Math.max(1, this.stage.getBoundingClientRect().height);
    const availableScroll = Math.max(0, this.offsetHeight - paddingTop - paddingBottom - stageHeight - headerHeight);
    const target = rootTop + paddingTop - headerHeight + availableScroll * (index / (panels.length - 1));
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
