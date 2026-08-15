import { A11y, Navigation, Swiper } from './swiper-loader.js';
import { initializeWhenVisible } from './initialize-when-visible.js';

class TestimonialsSlider extends HTMLElement {
  connectedCallback() {
    this.slider = this.querySelector('[data-testimonials-slider]');
    this.controls = this.querySelector('[data-testimonials-controls]');
    this.previousButton = this.querySelector('[data-testimonials-previous]');
    this.nextButton = this.querySelector('[data-testimonials-next]');
    this.currentCount = this.querySelector('[data-testimonials-current]');
    this.totalCount = this.querySelector('[data-testimonials-total]');
    this.mobileMedia = window.matchMedia('(max-width: 767.98px)');
    this.tabletMedia = window.matchMedia('(max-width: 1149.98px)');
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.currentDevice = null;
    this.swiper = null;
    this.onBreakpointChange = this.refresh.bind(this);
    this.onBlockSelect = this.handleBlockSelect.bind(this);

    this.mobileMedia.addEventListener('change', this.onBreakpointChange);
    this.tabletMedia.addEventListener('change', this.onBreakpointChange);
    document.addEventListener('shopify:block:select', this.onBlockSelect);
    this.isReady = false;
    this.cancelDeferredInitialization = initializeWhenVisible(this, () => {
      this.isReady = true;
      this.refresh();
    });
  }

  disconnectedCallback() {
    this.mobileMedia?.removeEventListener('change', this.onBreakpointChange);
    this.tabletMedia?.removeEventListener('change', this.onBreakpointChange);
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    this.cancelDeferredInitialization?.();
    this.destroySlider();
  }

  refresh() {
    if (!this.isReady) return;
    const device = this.mobileMedia.matches ? 'mobile' : this.tabletMedia.matches ? 'tablet' : 'desktop';
    if (device === this.currentDevice) return;
    this.currentDevice = device;
    const layout = this.dataset[`layout${device.charAt(0).toUpperCase()}${device.slice(1)}`] || 'slider';
    this.dataset.currentLayout = layout;
    this.updateControls(layout);
    this.destroySlider();
    if (layout === 'slider') this.createSlider(device);
  }

  createSlider(device) {
    if (!this.slider?.querySelector('.swiper-slide')) return;

    const configuredColumns = Number.parseInt(this.dataset[`columns${device.charAt(0).toUpperCase()}${device.slice(1)}`], 10) || 1;
    const slidesPerView = configuredColumns;
    const styles = getComputedStyle(this);
    const gapProperty = device === 'mobile' ? '--testimonials-mobile-column-gap' : '--testimonials-column-gap';
    const gap = Number.parseFloat(styles.getPropertyValue(gapProperty)) || 0;
    const slideCount = this.slider.querySelectorAll('.swiper-slide').length;
    this.swiper = new Swiper(this.slider, {
      modules: [A11y, Navigation],
      slidesPerView,
      spaceBetween: gap,
      speed: this.reduceMotion.matches ? 0 : 360,
      watchOverflow: true,
      grabCursor: slideCount > slidesPerView,
      loop: slideCount > 1,
      navigation: {
        prevEl: this.previousButton,
        nextEl: this.nextButton,
      },
      a11y: {
        enabled: true,
        prevSlideMessage: this.previousButton?.getAttribute('aria-label') || '',
        nextSlideMessage: this.nextButton?.getAttribute('aria-label') || '',
        slideRole: null,
      },
      on: {
        init: () => this.updateCounter(slideCount),
        slideChange: () => this.updateCounter(slideCount),
      },
    });
  }

  updateCounter(slideCount) {
    if (!this.currentCount || !this.totalCount) return;
    const currentIndex = (this.swiper?.realIndex ?? 0) + 1;
    this.currentCount.textContent = String(currentIndex).padStart(2, '0');
    this.totalCount.textContent = String(slideCount).padStart(2, '0');
  }

  updateControls(layout) {
    if (!this.controls) return;
    const slideCount = this.slider?.querySelectorAll('.swiper-slide').length || 0;
    this.controls.hidden = layout !== 'slider' || slideCount <= 1;
  }

  destroySlider() {
    this.swiper?.destroy(true, true);
    this.swiper = null;
  }

  handleBlockSelect(event) {
    if (!this.isReady) {
      this.isReady = true;
      this.cancelDeferredInitialization?.();
      this.refresh();
    }
    if (!this.swiper || event.detail?.sectionId !== this.dataset.sectionId) return;
    const slide = this.querySelector(`[data-block-id="${CSS.escape(event.detail.blockId)}"]`);
    const index = slide ? Array.from(this.querySelectorAll('.swiper-slide')).indexOf(slide) : -1;
    if (index < 0) return;
    if (this.swiper.params.loop && typeof this.swiper.slideToLoop === 'function') {
      this.swiper.slideToLoop(index);
      return;
    }
    this.swiper.slideTo(index);
  }
}

if (!customElements.get('testimonials-slider')) customElements.define('testimonials-slider', TestimonialsSlider);
