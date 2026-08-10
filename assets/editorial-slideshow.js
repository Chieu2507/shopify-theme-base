import { A11y, EffectFade, Swiper } from './swiper-loader.js';

class EditorialSlideshow extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.slider = this.querySelector('[data-editorial-slideshow-slider]');
    this.navigator = this.querySelector('[data-editorial-navigator]');
    this.tabsContainer = this.querySelector('[data-editorial-slide-tabs]');
    this.previousButton = this.querySelector('[data-editorial-previous]');
    this.nextButton = this.querySelector('[data-editorial-next]');
    this.autoplayToggle = this.querySelector('[data-editorial-autoplay-toggle]');
    this.navigatorToggle = this.querySelector('[data-editorial-navigator-toggle]');
    this.tabs = [];
    this.progressBars = [];
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.compactNavigator = window.matchMedia('(min-width: 750px) and (max-width: 1540px)');
    this.isCompactNavigator = this.compactNavigator.matches;
    this.navigatorViewportInitialized = false;
    this.autoplaySetting = this.dataset.autoplay === 'true';
    this.autoplayDelay = Math.max(1000, Number(this.dataset.autoplayDelay) || 6000);
    this.autoplayManuallyPaused = false;
    this.manualPauseProgress = null;
    this.progressStartedAt = null;
    this.progressStartElapsed = 0;
    this.progressStartIndex = null;
    this.firstSlideImage = null;
    this.navigatorRevealTimer = null;
    this.navigatorRevealFallbackTimer = null;
    this.navigatorMorphTimer = null;
    this.navigatorSizeTimer = null;
    this.navigatorSettleFrame = null;
    this.pointerFocusTimer = null;
    this.isPointerFocus = false;
    this.pauseReasons = new Set();
    this.slideSignature = '';
    this.slideRefreshFrame = null;
    this.slideObserver = null;
    this.isInViewport = !('IntersectionObserver' in window);
    this.loadFirstViewportHeight();

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBlockSelect = this.handleBlockSelect.bind(this);
    this.handleMotionPreferenceChange = this.handleMotionPreferenceChange.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handleCompactNavigatorChange = this.handleCompactNavigatorChange.bind(this);
    this.handleViewportResize = this.handleViewportResize.bind(this);
    this.handleFirstSlideImageChange = this.handleFirstSlideImageChange.bind(this);

    this.buildNavigatorTabs();
    this.addEventListener('keydown', this.handleKeydown, { signal });
    this.addEventListener('pointerdown', this.handlePointerDown, { signal });
    this.addEventListener('focusin', () => this.handleFocusIn(), { signal });
    this.addEventListener('focusout', (event) => this.handleFocusOut(event), { signal });
    this.bindNavigatorTabs();
    this.autoplayToggle?.addEventListener('click', () => this.toggleAutoplay(), { signal });
    this.navigatorToggle?.addEventListener('click', () => this.toggleNavigator(), { signal });
    this.previousButton?.addEventListener('click', () => this.selectIndex((this.activeIndex || 0) - 1), { signal });
    this.nextButton?.addEventListener('click', () => this.selectIndex((this.activeIndex || 0) + 1), { signal });
    document.addEventListener('visibilitychange', this.handleVisibilityChange, { signal });
    document.addEventListener('shopify:block:select', this.handleBlockSelect, { signal });
    this.reduceMotion.addEventListener?.('change', this.handleMotionPreferenceChange, { signal });
    this.compactNavigator.addEventListener?.('change', this.handleCompactNavigatorChange, { signal });
    window.addEventListener('resize', this.handleViewportResize, { signal });

    if (this.dataset.heightMode === 'adapt') {
      this.firstSlideImage = this.slider?.querySelector('.editorial-slideshow__slide:first-child img');
      this.firstSlideImage?.addEventListener('load', this.handleFirstSlideImageChange, { signal });
      window.addEventListener('resize', this.handleFirstSlideImageChange, { signal });
      this.updateFirstSlideImageRatio();
    }

    if (this.autoplayToggle && !this.autoplaySetting) {
      this.autoplayToggle.disabled = true;
      this.autoplayToggle.setAttribute('aria-pressed', 'false');
    }

    this.initialize();
    this.observeSlideCollection();

    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver(
        (entries) => {
          this.isInViewport = entries.some((entry) => entry.isIntersecting);
          this.syncPlayback();
        },
        { threshold: 0.01 },
      );
      this.visibilityObserver.observe(this);
    }
  }

  disconnectedCallback() {
    this.destroyFirstViewportHeight?.();
    this.destroyFirstViewportHeight = null;
    this.slideObserver?.disconnect();
    this.slideObserver = null;
    if (this.slideRefreshFrame) window.cancelAnimationFrame(this.slideRefreshFrame);
    this.slideRefreshFrame = null;
    this.abortController?.abort();
    this.abortController = null;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
    this.clearAutoplayTimer();
    this.cancelProgressFrame();
    if (this.firstSlideImageRatioFrame) window.cancelAnimationFrame(this.firstSlideImageRatioFrame);
    this.firstSlideImageRatioFrame = null;
    this.firstSlideImage = null;
    this.clearNavigatorRevealTimer();
    this.clearNavigatorMorph();
    if (this.pointerFocusTimer) window.clearTimeout(this.pointerFocusTimer);
    this.pointerFocusTimer = null;
    this.isPointerFocus = false;
    this.navigator?.classList.remove('is-transitioning');
    this.navigator?.classList.remove('is-collapsed');
    this.navigator?.setAttribute('hidden', '');
    this.classList.remove('editorial-slideshow--navigator-collapsed', 'editorial-slideshow--has-navigator');
    this.navigatorViewportInitialized = false;
    this.swiper?.destroy(true, true);
    this.swiper = null;
    this.pauseReasons?.clear();
  }

  getSlides() {
    return this.slider
      ? [...this.slider.querySelectorAll('.editorial-slideshow__slide:not(.swiper-slide-duplicate)')]
      : [];
  }

  preloadSlideImage(slide) {
    slide?.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      if (!image.complete || image.naturalWidth === 0) image.loading = 'eager';
    });
  }

  preloadAdjacentSlides(index = this.activeIndex || 0) {
    const slides = this.getSlides();
    if (slides.length < 2) return;

    const normalizedIndex = (index + slides.length) % slides.length;
    const getSlideAtIndex = (slideIndex) => {
      const blockId = this.tabs[slideIndex]?.dataset.editorialBlockId;
      return slides.find((slide) => slide.dataset.blockId === blockId) || slides[slideIndex];
    };
    [normalizedIndex, normalizedIndex - 1, normalizedIndex + 1].forEach((slideIndex) => {
      this.preloadSlideImage(getSlideAtIndex((slideIndex + slides.length) % slides.length));
    });
  }

  getSlideSignature() {
    return this.getSlides()
      .map((slide) => [
        slide.dataset.blockId,
        slide.dataset.editorialNavLabel,
        slide.dataset.editorialNavDetail,
        slide.dataset.editorialDesktopRatio,
        slide.dataset.editorialMobileRatio,
      ].join('::'))
      .join('|');
  }

  bindNavigatorTabs() {
    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.selectIndex(Number.parseInt(tab.dataset.editorialIndex, 10));
      }, { signal: this.abortController?.signal });
    });
  }

  observeSlideCollection() {
    if (!this.slider || !('MutationObserver' in window)) return;

    this.slideObserver = new MutationObserver(() => this.queueSlideRefresh());
    this.slideObserver.observe(this.slider, {
      attributes: true,
      attributeFilter: [
        'data-block-id',
        'data-editorial-nav-label',
        'data-editorial-nav-detail',
        'data-editorial-desktop-ratio',
        'data-editorial-mobile-ratio',
      ],
      childList: true,
      subtree: true,
    });
  }

  queueSlideRefresh() {
    if (this.slideRefreshFrame) return;

    this.slideRefreshFrame = window.requestAnimationFrame(() => {
      this.slideRefreshFrame = window.requestAnimationFrame(() => {
        this.slideRefreshFrame = null;
        if (this.isConnected) this.refreshSlideCollection();
      });
    });
  }

  refreshSlideCollection() {
    const nextSignature = this.getSlideSignature();
    const activeSlide = this.getSlides().find((slide) => slide.classList.contains('swiper-slide-active'));
    if (nextSignature === this.slideSignature && activeSlide) return;

    const activeBlockId = activeSlide?.dataset.blockId
      || this.tabs[this.activeIndex || 0]?.dataset.editorialBlockId;
    this.classList.remove('editorial-slideshow--ready');
    this.destroySwiper();
    this.buildNavigatorTabs();
    this.bindNavigatorTabs();

    const nextSlides = this.getSlides();
    const nextActiveIndex = nextSlides.findIndex((slide) => slide.dataset.blockId === activeBlockId);
    this.initialize(nextActiveIndex >= 0 ? nextActiveIndex : 0);
  }

  updateNavigatorToggleState(isCollapsed) {
    if (!this.navigatorToggle) return;

    this.navigatorToggle.setAttribute('aria-expanded', String(!isCollapsed));
    this.navigatorToggle.setAttribute(
      'aria-label',
      isCollapsed
        ? this.navigatorToggle.dataset.labelExpand || 'Expand slideshow navigation'
        : this.navigatorToggle.dataset.labelCollapse || 'Collapse slideshow navigation',
    );
  }

  syncNavigatorViewportState({ resetCompact = false } = {}) {
    if (!this.navigator) return;

    if (!this.classList.contains('editorial-slideshow--has-navigator')) {
      this.classList.remove('editorial-slideshow--navigator-collapsed');
      const isCompact = this.compactNavigator.matches;
      this.navigator.classList.toggle('is-collapsed', isCompact);
      this.updateNavigatorToggleState(isCompact);
      return;
    }

    this.clearNavigatorMorph();
    this.navigator.classList.remove('is-transitioning');

    if (this.compactNavigator.matches) {
      if (!this.navigatorViewportInitialized || resetCompact) this.navigator.classList.add('is-collapsed');

      const isCollapsed = this.navigator.classList.contains('is-collapsed');
      this.classList.toggle('editorial-slideshow--navigator-collapsed', isCollapsed);
      this.updateNavigatorToggleState(isCollapsed);
      this.navigatorViewportInitialized = true;
      return;
    }

    this.navigator.classList.remove('is-collapsed');
    this.classList.remove('editorial-slideshow--navigator-collapsed');
    this.updateNavigatorToggleState(false);
    this.navigatorViewportInitialized = true;
  }

  syncSlideRatios() {
    const firstSlide = this.getSlides()[0];
    if (!firstSlide) return;

    const desktopRatio = Number(firstSlide.dataset.editorialDesktopRatio);
    const mobileRatio = Number(firstSlide.dataset.editorialMobileRatio);
    if (desktopRatio > 0) this.style.setProperty('--editorial-slideshow-desktop-ratio', desktopRatio);
    if (mobileRatio > 0) this.style.setProperty('--editorial-slideshow-mobile-ratio', mobileRatio);
  }

  buildNavigatorTabs() {
    if (!this.tabsContainer) return;

    this.tabsContainer.replaceChildren();
    this.getSlides().forEach((slide, index) => {
      const tab = document.createElement('button');
      const label = document.createElement('span');
      const detail = document.createElement('span');
      const number = document.createElement('span');
      const progress = document.createElement('span');
      const progressBar = document.createElement('span');
      const isActive = index === 0;

      tab.className = `editorial-slideshow__tab${isActive ? ' is-active' : ''}`;
      tab.type = 'button';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
      tab.dataset.editorialSlideTab = '';
      tab.dataset.editorialIndex = String(index);
      tab.dataset.editorialBlockId = slide.dataset.blockId || '';

      label.className = 'editorial-slideshow__tab-label';
      label.textContent = slide.dataset.editorialNavLabel || 'Slide';
      detail.className = 'editorial-slideshow__tab-detail';
      detail.textContent = slide.dataset.editorialNavDetail || 'EDITORIAL';
      number.className = 'editorial-slideshow__tab-number';
      number.textContent = String(index + 1).padStart(2, '0');
      progress.className = 'editorial-slideshow__tab-progress';
      progress.setAttribute('aria-hidden', 'true');
      progressBar.setAttribute('aria-hidden', 'true');
      progress.append(progressBar);
      tab.append(label, detail, number, progress);
      this.tabsContainer.append(tab);
    });

    this.tabs = [...this.tabsContainer.querySelectorAll('[data-editorial-slide-tab]')];
    this.progressBars = [...this.tabsContainer.querySelectorAll('.editorial-slideshow__tab-progress span')];
    this.syncSlideRatios();
  }

  handleFirstSlideImageChange() {
    if (this.firstSlideImageRatioFrame) return;

    this.firstSlideImageRatioFrame = window.requestAnimationFrame(() => {
      this.firstSlideImageRatioFrame = null;
      this.updateFirstSlideImageRatio();
    });
  }

  updateFirstSlideImageRatio() {
    if (this.dataset.heightMode !== 'adapt' || !this.firstSlideImage?.naturalWidth || !this.firstSlideImage?.naturalHeight) return;

    this.style.setProperty(
      '--editorial-slideshow-mobile-ratio',
      this.firstSlideImage.naturalWidth / this.firstSlideImage.naturalHeight,
    );
  }

  async loadFirstViewportHeight() {
    const abortController = this.abortController;
    const moduleUrl = this.dataset.firstViewportHeightModule;
    if (!moduleUrl) return;

    const { setupFirstViewportHeight } = await import(moduleUrl);
    if (this.abortController !== abortController || !this.isConnected) return;

    this.destroyFirstViewportHeight = setupFirstViewportHeight(this, { mobileBreakpoint: 989 });
  }

  syncNavigatorAvailability(slideCount) {
    const hasNavigator = Boolean(this.navigator && slideCount > 1 && this.tabs.length > 1);
    this.classList.toggle('editorial-slideshow--has-navigator', hasNavigator);
    this.navigator?.toggleAttribute('hidden', !hasNavigator);

    if (hasNavigator) {
      this.syncNavigatorViewportState();
      return true;
    }

    this.clearNavigatorRevealTimer();
    this.clearNavigatorMorph();
    this.navigator?.classList.remove('is-transitioning');
    this.classList.remove('editorial-slideshow--navigator-collapsed');
    return false;
  }

  destroySwiper() {
    this.clearNavigatorRevealTimer();
    this.clearNavigatorMorph();
    this.clearAutoplayTimer();
    this.cancelProgressFrame();
    this.swiper?.destroy(true, true);
    this.swiper = null;
  }

  initialize(initialSlide = 0) {
    const slideCount = this.getSlides().length;
    this.slideCount = slideCount;
    this.slideSignature = this.getSlideSignature();
    this.syncNavigatorAvailability(slideCount);
    this.classList.toggle('editorial-slideshow--ready', slideCount > 0);
    if (!slideCount) return;

    this.preloadAdjacentSlides(initialSlide);

    try {
      this.swiper = new Swiper(this.slider, {
        modules: [A11y, EffectFade],
        slidesPerView: 1,
        speed: this.reduceMotion.matches ? 0 : 1000,
        effect: 'fade',
        fadeEffect: {
          crossFade: true,
        },
        initialSlide: Math.max(0, Math.min(initialSlide, slideCount - 1)),
        loop: false,
        rewind: slideCount > 1,
        watchOverflow: true,
        grabCursor: slideCount > 1,
        a11y: {
          enabled: true,
          prevSlideMessage: this.previousButton?.getAttribute('aria-label') || '',
          nextSlideMessage: this.nextButton?.getAttribute('aria-label') || '',
          slideRole: 'group',
        },
      });
    } catch (error) {
      this.classList.remove('editorial-slideshow--ready');
      throw error;
    }

    this.swiper.on('slideChange', () => {
      this.syncActiveState(this.swiper.realIndex, true);
    });
    this.swiper.on('slideChangeTransitionStart', () => this.setNavigatorTransitioning(true));
    const revealNavigator = () => {
      this.setNavigatorTransitioning(false);
      this.syncPlayback();
    };
    this.swiper.on('slideChangeTransitionEnd', revealNavigator);
    this.swiper.on('transitionEnd', revealNavigator);
    this.syncActiveState(this.swiper.realIndex || 0, false);
    this.syncPlayback();
  }

  clearNavigatorRevealTimer() {
    if (this.navigatorRevealTimer) window.clearTimeout(this.navigatorRevealTimer);
    if (this.navigatorRevealFallbackTimer) window.clearTimeout(this.navigatorRevealFallbackTimer);
    this.navigatorRevealTimer = null;
    this.navigatorRevealFallbackTimer = null;
  }

  setNavigatorTransitioning(isTransitioning) {
    if (!this.navigator) return;

    this.clearNavigatorRevealTimer();

    if (isTransitioning) {
      if (!this.navigator.classList.contains('is-collapsed')) this.navigator.classList.add('is-transitioning');

      const transitionDuration = this.reduceMotion.matches ? 0 : Number(this.swiper?.params.speed) || 0;
      if (transitionDuration > 0) {
        this.navigatorRevealFallbackTimer = window.setTimeout(() => {
          this.navigatorRevealFallbackTimer = null;
          this.setNavigatorTransitioning(false);
        }, transitionDuration + 80);
      } else {
        this.setNavigatorTransitioning(false);
      }

      return;
    }

    if (this.reduceMotion.matches) {
      this.navigator.classList.remove('is-transitioning');
      return;
    }

    this.navigatorRevealTimer = window.setTimeout(() => {
      this.navigator?.classList.remove('is-transitioning');
      this.navigatorRevealTimer = null;
    }, 60);
  }

  get canAutoplay() {
    return this.autoplaySetting && this.slideCount > 1 && !this.reduceMotion.matches;
  }

  get isPlaying() {
    return this.canAutoplay && !this.autoplayManuallyPaused && this.pauseReasons.size === 0 && this.isInViewport && !document.hidden;
  }

  syncActiveState(index, restartProgress = true) {
    if (!this.tabs.length) return;

    const activeIndex = Math.max(0, Math.min(index, this.tabs.length - 1));
    this.activeIndex = activeIndex;
    this.preloadAdjacentSlides(activeIndex);
    this.tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === activeIndex;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    if (restartProgress) {
      this.manualPauseProgress = null;
      this.progressStartedAt = null;
      this.progressStartElapsed = 0;
      this.progressStartIndex = activeIndex;
      this.resetProgress();
      this.syncPlayback();
    }
  }

  selectIndex(index, moveFocus = false) {
    if (!this.swiper || this.slideCount < 2) return;

    const nextIndex = (index + this.slideCount) % this.slideCount;
    this.preloadAdjacentSlides(nextIndex);
    if (moveFocus) this.tabs[nextIndex]?.focus();
    this.swiper.slideTo(nextIndex);
  }

  toggleNavigator() {
    this.setNavigatorCollapsed(!this.navigator?.classList.contains('is-collapsed'));
  }

  clearNavigatorMorph() {
    if (this.navigatorMorphTimer) window.clearTimeout(this.navigatorMorphTimer);
    if (this.navigatorSizeTimer) window.clearTimeout(this.navigatorSizeTimer);
    if (this.navigatorSettleFrame) window.cancelAnimationFrame(this.navigatorSettleFrame);
    this.navigatorMorphTimer = null;
    this.navigatorSizeTimer = null;
    this.navigatorSettleFrame = null;
    this.navigator?.classList.remove('is-collapsing', 'is-expanding', 'is-settling', 'is-toggle-revealing', 'is-vertical-sizing');
    this.navigator?.style.removeProperty('height');
  }

  animateCollapsedNavigatorHeight() {
    if (!this.navigator) return;

    this.navigator.classList.add('is-vertical-sizing');
    const targetHeight = this.navigator.offsetHeight;
    this.navigator.style.height = '52px';
    void this.navigator.offsetHeight;
    this.navigator.style.height = `${targetHeight}px`;
    this.navigatorSizeTimer = window.setTimeout(() => {
      this.navigator?.classList.remove('is-vertical-sizing');
      this.navigator?.style.removeProperty('height');
      this.navigator?.classList.add('is-toggle-revealing');
      this.navigatorSizeTimer = window.setTimeout(() => {
        this.navigator?.classList.remove('is-toggle-revealing');
        this.navigatorSizeTimer = null;
      }, 240);
    }, 430);
  }

  animateExpandedNavigatorHeight() {
    if (!this.navigator) return;

    const currentHeight = this.navigator.offsetHeight;
    this.navigator.classList.add('is-vertical-sizing');
    this.navigator.style.height = `${currentHeight}px`;
    void this.navigator.offsetHeight;
    this.navigator.style.height = '52px';
  }

  setNavigatorCollapsed(isCollapsed) {
    if (!this.navigator || !this.compactNavigator.matches) return;

    this.clearNavigatorMorph();
    this.navigator.classList.remove('is-transitioning');
    this.classList.toggle('editorial-slideshow--navigator-collapsed', isCollapsed);

    this.updateNavigatorToggleState(isCollapsed);

    if (this.reduceMotion.matches) {
      this.navigator.classList.toggle('is-collapsed', isCollapsed);
      return;
    }

    this.navigator.classList.add(isCollapsed ? 'is-collapsing' : 'is-expanding');
    if (!isCollapsed) {
      this.animateExpandedNavigatorHeight();
      this.navigatorMorphTimer = window.setTimeout(() => {
        this.navigator?.classList.remove('is-collapsed', 'is-vertical-sizing');
        this.navigator?.style.removeProperty('height');
        this.navigatorMorphTimer = window.setTimeout(() => {
          this.navigator?.classList.remove('is-expanding');
          this.navigatorMorphTimer = null;
        }, 260);
      }, 420);
      return;
    }

    this.navigatorMorphTimer = window.setTimeout(() => {
      this.navigator?.classList.toggle('is-collapsed', isCollapsed);
      this.navigator?.classList.remove('is-collapsing');
      this.animateCollapsedNavigatorHeight();
      this.navigatorMorphTimer = null;
    }, 420);
  }

  handleCompactNavigatorChange(event) {
    const isCompact = Boolean(event.matches);
    const crossedBreakpoint = isCompact !== this.isCompactNavigator;
    this.isCompactNavigator = isCompact;
    this.syncNavigatorViewportState({ resetCompact: isCompact && crossedBreakpoint });
  }

  handleViewportResize() {
    const isCompact = this.compactNavigator.matches;
    if (isCompact !== this.isCompactNavigator) {
      this.handleCompactNavigatorChange({ matches: isCompact });
      return;
    }

    this.syncNavigatorViewportState();
  }

  handleKeydown(event) {
    if (!event.target.closest('[data-editorial-slide-tab]')) return;

    const currentIndex = this.activeIndex || 0;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectIndex(currentIndex + 1, true);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectIndex(currentIndex - 1, true);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.selectIndex(0, true);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.selectIndex(this.slideCount - 1, true);
    }
  }

  handlePointerDown() {
    this.isPointerFocus = true;
    this.pauseReasons.delete('focus');
    this.syncPlayback();

    if (this.pointerFocusTimer) window.clearTimeout(this.pointerFocusTimer);
    this.pointerFocusTimer = window.setTimeout(() => {
      this.isPointerFocus = false;
      this.pointerFocusTimer = null;
    }, 0);
  }

  handleFocusIn() {
    if (this.isPointerFocus) return;
    this.pauseReasons.add('focus');
    this.syncPlayback();
  }

  handleFocusOut(event) {
    if (!this.contains(event.relatedTarget)) this.pauseReasons.delete('focus');
    this.syncPlayback();
  }

  handleVisibilityChange() {
    if (document.hidden) this.pauseReasons.add('document');
    else this.pauseReasons.delete('document');
    this.syncPlayback();
  }

  handleMotionPreferenceChange() {
    if (this.swiper) this.swiper.params.speed = this.reduceMotion.matches ? 0 : 1000;
    if (this.reduceMotion.matches) this.setNavigatorTransitioning(false);
    if (this.reduceMotion.matches) this.pauseReasons.add('reduced-motion');
    else this.pauseReasons.delete('reduced-motion');
    this.syncPlayback();
  }

  handleBlockSelect(event) {
    if (!this.swiper || event.detail?.sectionId !== this.dataset.sectionId) return;

    const selectedSlide = this.querySelector(`[data-block-id="${CSS.escape(event.detail.blockId)}"]`);
    if (!selectedSlide) return;

    const slides = [...this.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)')];
    const index = slides.indexOf(selectedSlide);
    if (index < 0) return;

    this.autoplayManuallyPaused = true;
    this.updateAutoplayToggle();
    this.swiper.slideTo(index, 0);
    this.setNavigatorTransitioning(false);
  }

  toggleAutoplay() {
    if (!this.autoplaySetting) return;

    if (!this.autoplayManuallyPaused) {
      this.manualPauseProgress = {
        elapsed: this.getCurrentProgressElapsed(),
        index: this.activeIndex || 0,
      };
    }

    this.autoplayManuallyPaused = !this.autoplayManuallyPaused;
    this.updateAutoplayToggle();
    this.syncPlayback();
  }

  updateAutoplayToggle() {
    if (!this.autoplayToggle) return;

    const isPlaying = !this.autoplayManuallyPaused;
    const pauseLabel = this.autoplayToggle.dataset.labelPause || 'Pause slideshow';
    const resumeLabel = this.autoplayToggle.dataset.labelResume || 'Resume slideshow';
    this.autoplayToggle.setAttribute('aria-pressed', String(isPlaying));
    this.autoplayToggle.setAttribute('aria-label', isPlaying ? pauseLabel : resumeLabel);
  }

  syncPlayback() {
    this.clearAutoplayTimer();
    this.cancelProgressFrame();
    const activeIndex = this.activeIndex || 0;
    this.progressStartedAt = null;
    this.progressBars.forEach((bar, index) => {
      bar.style.transition = 'none';
      bar.style.transform = this.autoplayManuallyPaused && index === activeIndex ? 'scaleX(1)' : 'scaleX(0)';
    });

    if (!this.isPlaying) return;

    const resumeElapsed = this.manualPauseProgress?.index === activeIndex
      ? this.manualPauseProgress.elapsed
      : 0;
    const remainingDelay = Math.max(0, this.autoplayDelay - resumeElapsed);
    this.manualPauseProgress = null;

    const progressBar = this.progressBars[activeIndex];
    if (!progressBar) {
      this.autoplayTimer = window.setTimeout(() => {
        this.selectIndex(activeIndex + 1);
      }, remainingDelay);
      return;
    }

    progressBar.style.transform = `scaleX(${resumeElapsed / this.autoplayDelay})`;
    this.progressFrame = window.requestAnimationFrame(() => {
      progressBar.style.transition = `transform ${remainingDelay}ms linear`;
      progressBar.style.transform = 'scaleX(1)';
      this.progressStartedAt = performance.now();
      this.progressStartElapsed = resumeElapsed;
      this.progressStartIndex = activeIndex;
      this.autoplayTimer = window.setTimeout(() => {
        this.selectIndex(activeIndex + 1);
      }, remainingDelay);
    });
  }

  getCurrentProgressElapsed() {
    const activeIndex = this.activeIndex || 0;
    if (this.progressStartedAt === null || this.progressStartIndex !== activeIndex) return 0;

    return Math.min(
      this.autoplayDelay,
      this.progressStartElapsed + performance.now() - this.progressStartedAt,
    );
  }

  resetProgress() {
    this.progressBars.forEach((bar) => {
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(0)';
    });
  }

  clearAutoplayTimer() {
    if (this.autoplayTimer) window.clearTimeout(this.autoplayTimer);
    this.autoplayTimer = null;
  }

  cancelProgressFrame() {
    if (this.progressFrame) window.cancelAnimationFrame(this.progressFrame);
    this.progressFrame = null;
  }
}

if (!customElements.get('editorial-slideshow')) {
  customElements.define('editorial-slideshow', EditorialSlideshow);
}
