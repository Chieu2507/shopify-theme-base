import Swiper from './swiper-12.2.0.min.mjs';
import A11y from './swiper-12.2.0-a11y.min.mjs';
import Navigation from './swiper-12.2.0-navigation.min.mjs';
import Parallax from './swiper-12.2.0-parallax.min.mjs';

class JovieSlideshow extends HTMLElement {
  connectedCallback() {
    this.slider = this.querySelector('[data-slideshow-slider]');
    this.previousButton = this.querySelector('[data-slideshow-previous]');
    this.nextButton = this.querySelector('[data-slideshow-next]');
    this.currentSlide = this.querySelector('[data-slideshow-current]');
    this.totalSlides = this.querySelector('[data-slideshow-total]');
    this.progress = this.querySelector('[data-slideshow-progress]');
    this.progressBar = this.querySelector('[data-slideshow-progress-bar]');
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.isDoubleSlide = this.dataset.desktopStyle === 'double';
    this.isDesktop = window.matchMedia('(min-width: 750px)');
    this.onViewportChange = () => this.updateControls();
    this.onBlockSelect = this.handleBlockSelect.bind(this);
    this.onVisibilityChange = this.handleVisibilityChange.bind(this);
    this.onMouseEnter = this.pauseAutoplay.bind(this);
    this.onMouseLeave = this.scheduleAutoplay.bind(this);

    document.addEventListener('shopify:block:select', this.onBlockSelect);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.isDesktop.addEventListener?.('change', this.onViewportChange);
    this.addEventListener('mouseenter', this.onMouseEnter);
    this.addEventListener('mouseleave', this.onMouseLeave);
    this.isVisible = !('IntersectionObserver' in window);
    this.initialize();

    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver((entries) => {
        this.isVisible = entries.some((entry) => entry.isIntersecting);
        if (this.isVisible) this.scheduleAutoplay();
        else this.pauseAutoplay();
      });
      this.visibilityObserver.observe(this);
    }
  }

  disconnectedCallback() {
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.isDesktop?.removeEventListener?.('change', this.onViewportChange);
    this.removeEventListener('mouseenter', this.onMouseEnter);
    this.removeEventListener('mouseleave', this.onMouseLeave);
    this.visibilityObserver?.disconnect();
    window.clearTimeout(this.autoplayTimer);
    window.cancelAnimationFrame(this.autoplayProgressFrame);
    this.swiper?.destroy(true, true);
    this.swiper = null;
  }

  initialize() {
    if (!this.slider || !this.slider.querySelector('.swiper-slide')) return;

    const slideCount = this.slider.querySelectorAll('.swiper-slide').length;
    this.slideCount = slideCount;
    const desktopSlides = this.isDoubleSlide ? 2 : 1;
    this.autoplayEnabled = this.dataset.autoplay === 'true' && !this.reduceMotion.matches && slideCount > 1;
    this.autoplayDelay = Math.max(1, Number.parseInt(this.dataset.autoplayDelay, 10) || 5) * 1000;
    const gap = Math.max(0, Number.parseInt(this.dataset.slideGap, 10) || 0);

    // Reveal every slide before Swiper measures the track. The pre-hydration
    // fallback hides non-active slides and otherwise makes mobile Safari treat
    // the carousel as a single locked slide.
    this.classList.add('slideshow--ready');

    this.swiper = new Swiper(this.slider, {
      modules: [A11y, Navigation, Parallax],
      slidesPerView: 1,
      spaceBetween: gap,
      speed: this.reduceMotion.matches ? 0 : 1000,
      loop: !this.isDoubleSlide && slideCount > desktopSlides,
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
      breakpoints: {
        750: {
          slidesPerView: desktopSlides,
        },
      },
    });

    this.updateControls();
    this.swiper.on('slideChange', () => {
      this.resetAutoplayProgress();
      this.updateControls();
    });
    this.swiper.on('slideChangeTransitionEnd', () => this.scheduleAutoplay());
    this.scheduleAutoplay();
  }

  updateControls() {
    if (!this.swiper) return;

    const visibleSlides = this.isDoubleSlide && this.isDesktop.matches ? 2 : 1;
    const total = this.isDoubleSlide
      ? Math.max(1, this.slideCount - visibleSlides + 1)
      : this.slideCount;
    const current = this.swiper.realIndex + 1;

    if (this.currentSlide) this.currentSlide.textContent = current;
    if (this.totalSlides) this.totalSlides.textContent = total;
    if (this.progress) {
      this.progress.setAttribute('aria-valuemax', total);
      this.progress.setAttribute('aria-valuenow', Math.min(current, total));
    }
  }

  handleBlockSelect(event) {
    if (!this.swiper || event.detail?.sectionId !== this.dataset.sectionId) return;

    const selectedSlide = this.querySelector(`[data-block-id="${CSS.escape(event.detail.blockId)}"]`);
    if (!selectedSlide) return;

    const index = Number.parseInt(selectedSlide.dataset.swiperSlideIndex, 10);
    const fallbackIndex = Array.from(this.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)')).indexOf(selectedSlide);
    this.pauseAutoplay();
    this.swiper.slideToLoop(Number.isNaN(index) ? Math.max(fallbackIndex, 0) : index, 0);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      this.pauseAutoplay();
    } else {
      this.scheduleAutoplay();
    }
  }

  scheduleAutoplay() {
    window.clearTimeout(this.autoplayTimer);
    if (!this.autoplayEnabled || document.hidden || !this.isVisible || !this.swiper) {
      this.resetAutoplayProgress();
      return;
    }

    const remainingDelay = Math.max(0, this.autoplayDelay - (this.autoplayProgressElapsed || 0));
    this.startAutoplayProgress();
    this.autoplayTimer = window.setTimeout(() => this.swiper?.slideNext(), remainingDelay);
  }

  pauseAutoplay() {
    window.clearTimeout(this.autoplayTimer);
    this.pauseAutoplayProgress();
  }

  startAutoplayProgress() {
    if (!this.progressBar) return;

    const elapsed = Math.min(this.autoplayProgressElapsed || 0, this.autoplayDelay);
    const remaining = Math.max(0, this.autoplayDelay - elapsed);
    window.cancelAnimationFrame(this.autoplayProgressFrame);
    this.progressBar.style.transition = 'none';
    this.progressBar.style.transform = `scaleX(${elapsed / this.autoplayDelay})`;
    this.progressBar.getBoundingClientRect();
    this.autoplayProgressFrame = window.requestAnimationFrame(() => {
      this.autoplayProgressFrame = window.requestAnimationFrame(() => {
        this.autoplayProgressStartedAt = performance.now();
        this.progressBar.style.transition = `transform ${remaining}ms linear`;
        this.progressBar.style.transform = 'scaleX(1)';
      });
    });
  }

  pauseAutoplayProgress() {
    if (!this.progressBar) return;

    window.cancelAnimationFrame(this.autoplayProgressFrame);
    if (this.autoplayProgressStartedAt) {
      this.autoplayProgressElapsed = Math.min(
        this.autoplayDelay,
        (this.autoplayProgressElapsed || 0) + performance.now() - this.autoplayProgressStartedAt,
      );
    }
    this.autoplayProgressStartedAt = 0;
    this.progressBar.style.transition = 'none';
    this.progressBar.style.transform = `scaleX(${(this.autoplayProgressElapsed || 0) / this.autoplayDelay})`;
  }

  resetAutoplayProgress() {
    this.autoplayProgressElapsed = 0;
    this.autoplayProgressStartedAt = 0;
    if (!this.progressBar) return;

    window.cancelAnimationFrame(this.autoplayProgressFrame);
    this.progressBar.style.transition = 'none';
    this.progressBar.style.transform = 'scaleX(0)';
  }
}

if (!customElements.get('jovie-slideshow')) {
  customElements.define('jovie-slideshow', JovieSlideshow);
}
