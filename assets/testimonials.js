import { A11y, Navigation, Pagination, Swiper } from './swiper-loader.js';
import { initializeWhenVisible } from './initialize-when-visible.js';

class TestimonialsSlider extends HTMLElement {
  connectedCallback() {
    this.slider = this.querySelector('[data-testimonials-slider]');
    this.pagination = this.querySelector('[data-testimonials-pagination]');
    this.previousButton = this.querySelector('[data-testimonials-previous]');
    this.nextButton = this.querySelector('[data-testimonials-next]');
    this.mobileMedia = window.matchMedia('(max-width: 749px)');
    this.tabletMedia = window.matchMedia('(max-width: 989px)');
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
    this.destroySlider();
    if (layout === 'slider') this.createSlider(device);
  }

  createSlider(device) {
    if (!this.slider?.querySelector('.swiper-slide')) return;

    const configuredColumns = Number.parseInt(this.dataset[`columns${device.charAt(0).toUpperCase()}${device.slice(1)}`], 10) || 1;
    const slidesPerView = configuredColumns;
    const gap = Number.parseFloat(getComputedStyle(this).getPropertyValue('--testimonials-column-gap')) || 0;
    const slideCount = this.slider.querySelectorAll('.swiper-slide').length;

    this.swiper = new Swiper(this.slider, {
      modules: [A11y, Navigation, Pagination],
      slidesPerView,
      spaceBetween: gap,
      speed: this.reduceMotion.matches ? 0 : 360,
      watchOverflow: true,
      grabCursor: slideCount > slidesPerView,
      navigation: {
        prevEl: this.previousButton,
        nextEl: this.nextButton,
      },
      pagination: this.dataset.showPagination === 'true' && this.pagination
        ? { el: this.pagination, clickable: true }
        : false,
      a11y: {
        enabled: true,
        prevSlideMessage: 'Previous testimonial',
        nextSlideMessage: 'Next testimonial',
        slideRole: null,
      },
    });
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
    if (index >= 0) this.swiper.slideTo(index);
  }
}

if (!customElements.get('testimonials-slider')) customElements.define('testimonials-slider', TestimonialsSlider);
