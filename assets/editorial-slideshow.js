import Swiper from './swiper-12.2.0.min.mjs';
import A11y from './swiper-12.2.0-a11y.min.mjs';
import EffectFade from './swiper-12.2.0-effect-fade.min.mjs';
import Navigation from './swiper-12.2.0-navigation.min.mjs';
import Parallax from './swiper-12.2.0-parallax.min.mjs';

class EditorialSlideshow extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;
    this.slider = this.querySelector('[data-editorial-slideshow-slider]');
    this.navigator = this.querySelector('[data-editorial-navigator]');
    this.previousButton = this.querySelector('[data-editorial-previous]');
    this.nextButton = this.querySelector('[data-editorial-next]');
    this.autoplayToggle = this.querySelector('[data-editorial-autoplay-toggle]');
    this.tabs = [...this.querySelectorAll('[data-editorial-slide-tab]')];
    this.progressBars = [...this.querySelectorAll('.editorial-slideshow__tab-progress span')];
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.hoverMedia = window.matchMedia('(hover: hover) and (pointer: fine)');
    this.autoplaySetting = this.dataset.autoplay === 'true';
    this.autoplayDelay = Math.max(1000, Number(this.dataset.autoplayDelay) || 6000);
    this.autoplayManuallyPaused = false;
    this.navigatorRevealTimer = null;
    this.navigatorRevealFallbackTimer = null;
    this.pauseReasons = new Set();
    this.isInViewport = !('IntersectionObserver' in window);

    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleBlockSelect = this.handleBlockSelect.bind(this);
    this.handleMotionPreferenceChange = this.handleMotionPreferenceChange.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);

    this.addEventListener('keydown', this.handleKeydown, { signal });
    this.addEventListener('mouseenter', () => this.handleMouseEnter(), { signal });
    this.addEventListener('mouseleave', () => this.handleMouseLeave(), { signal });
    this.addEventListener('focusin', () => this.handleFocusIn(), { signal });
    this.addEventListener('focusout', (event) => this.handleFocusOut(event), { signal });
    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        this.selectIndex(Number.parseInt(tab.dataset.editorialIndex, 10));
      }, { signal });
    });
    this.autoplayToggle?.addEventListener('click', () => this.toggleAutoplay(), { signal });
    document.addEventListener('visibilitychange', this.handleVisibilityChange, { signal });
    document.addEventListener('shopify:block:select', this.handleBlockSelect, { signal });
    this.reduceMotion.addEventListener?.('change', this.handleMotionPreferenceChange, { signal });

    if (this.autoplayToggle && !this.autoplaySetting) {
      this.autoplayToggle.disabled = true;
      this.autoplayToggle.setAttribute('aria-pressed', 'false');
    }

    this.initialize();

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
    this.abortController?.abort();
    this.abortController = null;
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
    this.clearAutoplayTimer();
    this.cancelProgressFrame();
    this.clearNavigatorRevealTimer();
    this.navigator?.classList.remove('is-transitioning');
    this.swiper?.destroy(true, true);
    this.swiper = null;
    this.pauseReasons?.clear();
  }

  initialize() {
    if (!this.slider?.querySelector('.swiper-slide')) return;

    const slideCount = this.slider.querySelectorAll('.swiper-slide').length;
    this.slideCount = slideCount;
    this.classList.add('editorial-slideshow--ready');

    this.swiper = new Swiper(this.slider, {
      modules: [A11y, EffectFade, Navigation, Parallax],
      slidesPerView: 1,
      speed: this.reduceMotion.matches ? 0 : 1000,
      effect: 'fade',
      fadeEffect: {
        crossFade: true,
      },
      loop: slideCount > 1,
      parallax: true,
      watchOverflow: true,
      grabCursor: slideCount > 1,
      navigation: {
        prevEl: this.previousButton,
        nextEl: this.nextButton,
      },
      a11y: {
        enabled: true,
        prevSlideMessage: this.previousButton?.getAttribute('aria-label') || '',
        nextSlideMessage: this.nextButton?.getAttribute('aria-label') || '',
        slideRole: 'group',
      },
    });

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
      this.navigator.classList.add('is-transitioning');

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
    }, 120);
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
    this.tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === activeIndex;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    if (restartProgress) {
      this.resetProgress();
      this.syncPlayback();
    }
  }

  selectIndex(index, moveFocus = false) {
    if (!this.swiper || this.slideCount < 2) return;

    const nextIndex = (index + this.slideCount) % this.slideCount;
    if (moveFocus) this.tabs[nextIndex]?.focus();
    this.swiper.slideToLoop(nextIndex);
  }

  handleKeydown(event) {
    if (!event.target.closest('[data-editorial-slide-tab]')) return;

    const currentIndex = this.activeIndex || 0;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.selectIndex(currentIndex + 1, true);
    } else if (event.key === 'ArrowLeft') {
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

  handleMouseEnter() {
    if (this.hoverMedia.matches) {
      this.pauseReasons.add('hover');
      this.syncPlayback();
    }
  }

  handleMouseLeave() {
    this.pauseReasons.delete('hover');
    this.syncPlayback();
  }

  handleFocusIn() {
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
    this.swiper.slideToLoop(index, 0);
    this.setNavigatorTransitioning(false);
  }

  toggleAutoplay() {
    if (!this.autoplaySetting) return;

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
    this.progressBars.forEach((bar) => {
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(0)';
    });

    if (!this.isPlaying) return;

    const progressBar = this.progressBars[this.activeIndex || 0];
    if (!progressBar) return;

    progressBar.style.transition = `transform ${this.autoplayDelay}ms linear`;
    progressBar.style.transform = 'scaleX(1)';
    this.progressFrame = window.requestAnimationFrame(() => {
      this.autoplayTimer = window.setTimeout(() => {
        this.swiper?.slideNext();
      }, this.autoplayDelay);
    });
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
