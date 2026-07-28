import { A11y, Navigation, Pagination, Swiper } from './swiper-loader.js';
import { initializeWhenVisible } from './initialize-when-visible.js';

class CollectionList extends HTMLElement {
  connectedCallback() {
    this.slider = this.querySelector('[data-collection-list-slider]');
    this.pagination = this.querySelector('[data-collection-list-pagination]');
    this.previousButton = this.querySelector('[data-collection-list-previous]');
    this.nextButton = this.querySelector('[data-collection-list-next]');
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

  getDevice() {
    if (this.mobileMedia.matches) return 'mobile';
    if (this.tabletMedia.matches) return 'tablet';
    return 'desktop';
  }

  refresh() {
    if (!this.isReady) return;
    const device = this.getDevice();
    if (device === this.currentDevice) return;
    this.currentDevice = device;

    const layout = this.dataset[`layout${this.capitalize(device)}`] || 'slider';
    this.dataset.currentLayout = layout;
    this.destroySlider();

    if (layout === 'slider') this.createSlider(device);
  }

  createSlider(device) {
    if (!this.slider?.querySelector('.swiper-slide')) return;

    const columns = device === 'mobile' ? 1.2 : Number.parseInt(this.dataset[`columns${this.capitalize(device)}`], 10) || 1;
    const configuredGap = Number.parseFloat(getComputedStyle(this).getPropertyValue('--collection-list-column-gap')) || 0;
    const gap = device === 'mobile' ? 8 : configuredGap;
    const showPagination = device !== 'mobile' && this.dataset.showPagination === 'true' && Boolean(this.pagination);
    const slideCount = this.slider.querySelectorAll('.swiper-slide').length;
    const previousMessage = this.previousButton?.getAttribute('aria-label') || '';
    const nextMessage = this.nextButton?.getAttribute('aria-label') || '';

    this.swiper = new Swiper(this.slider, {
      modules: [A11y, Navigation, Pagination],
      slidesPerView: columns,
      spaceBetween: gap,
      speed: this.reduceMotion.matches ? 0 : 360,
      watchOverflow: true,
      grabCursor: slideCount > columns,
      navigation: {
        prevEl: this.previousButton,
        nextEl: this.nextButton,
      },
      pagination: showPagination
        ? {
            el: this.pagination,
            clickable: true,
          }
        : false,
      a11y: {
        enabled: true,
        prevSlideMessage: previousMessage,
        nextSlideMessage: nextMessage,
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
    if (!slide) return;
    const index = Array.from(this.querySelectorAll('.swiper-slide')).indexOf(slide);
    if (index >= 0) this.swiper.slideTo(index);
  }

  capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}

if (!customElements.get('collection-list')) customElements.define('collection-list', CollectionList);
