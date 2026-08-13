import { A11y, Navigation, Swiper } from './swiper-loader.js';
import { initializeWhenVisible } from './initialize-when-visible.js';

class ShopTheLook extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.hotspots = Array.from(this.querySelectorAll('[data-shop-the-look-hotspot]'));
    this.products = Array.from(this.querySelectorAll('[data-shop-the-look-product]'));
    this.paginationCount = this.querySelector('[data-shop-the-look-pagination-count]');
    this.paginationProgress = this.querySelector('[data-shop-the-look-pagination-progress]');
    this.onClick = this.handleClick.bind(this);
    this.onKeydown = this.handleKeydown.bind(this);
    this.onBlockSelect = this.handleBlockSelect.bind(this);
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeydown);
    document.addEventListener('shopify:block:select', this.onBlockSelect);
    this.sliderReady = false;
    this.cancelDeferredInitialization = initializeWhenVisible(this, () => this.activateSlider());
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeydown);
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    this.cancelDeferredInitialization?.();
    this.swiper?.destroy(true, true);
    this.swiper = null;
    this.initialized = false;
  }

  initializeSlider() {
    const slider = this.querySelector('[data-shop-the-look-slider]');
    if (!slider || !this.products.length) return;

    this.swiper = new Swiper(slider, {
      modules: [A11y, Navigation],
      slidesPerView: 1,
      autoHeight: true,
      speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 360,
      rewind: this.products.length > 1,
      watchOverflow: true,
      navigation: {
        prevEl: this.querySelector('[data-shop-the-look-previous]'),
        nextEl: this.querySelector('[data-shop-the-look-next]'),
      },
      a11y: {
        enabled: true,
        slideRole: null,
        slideLabelMessage: null,
      },
      on: {
        init: (swiper) => this.syncActiveState(swiper.activeIndex),
        slideChange: (swiper) => this.syncActiveState(swiper.activeIndex),
      },
    });
  }

  activateSlider() {
    if (this.sliderReady) return;
    this.sliderReady = true;
    this.initializeSlider();
  }

  selectIndex(index, moveFocus = false) {
    if (!this.products.length) return;
    this.activateSlider();
    if (!this.swiper) return;
    const nextIndex = (index + this.products.length) % this.products.length;
    this.swiper.slideTo(nextIndex);
    this.syncActiveState(nextIndex);
    if (moveFocus) this.hotspots[nextIndex]?.focus();
  }

  syncActiveState(index) {
    this.hotspots.forEach((hotspot, hotspotIndex) => {
      const isActive = hotspotIndex === index;
      hotspot.setAttribute('aria-selected', String(isActive));
      hotspot.tabIndex = isActive ? 0 : -1;
    });

    this.products.forEach((product, productIndex) => {
      const isActive = productIndex === index;
      product.setAttribute('aria-hidden', String(!isActive));
      product.toggleAttribute('inert', !isActive);
    });

    this.updatePagination(index);
  }

  updatePagination(index) {
    const total = this.products.length;
    if (!total) return;
    if (this.paginationCount) {
      const currentLabel = String(index + 1).padStart(2, '0');
      const totalLabel = String(total).padStart(2, '0');
      this.paginationCount.textContent = `${currentLabel} / ${totalLabel}`;
    }
    if (this.paginationProgress) {
      this.paginationProgress.style.setProperty('--featured-collection-progress', (index + 1) / total);
    }
  }

  handleClick(event) {
    const hotspot = event.target.closest('[data-shop-the-look-hotspot]');
    if (!hotspot || !this.contains(hotspot)) return;
    this.selectIndex(this.hotspots.indexOf(hotspot));
  }

  handleKeydown(event) {
    const hotspot = event.target.closest('[data-shop-the-look-hotspot]');
    if (!hotspot || !this.contains(hotspot)) return;

    const currentIndex = this.hotspots.indexOf(hotspot);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = currentIndex + 1;
    if (event.key === 'ArrowLeft') nextIndex = currentIndex - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.hotspots.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    this.selectIndex(nextIndex, true);
  }

  handleBlockSelect(event) {
    const index = this.products.findIndex((product) => product.dataset.blockId === event.detail?.blockId);
    if (index >= 0) this.selectIndex(index);
  }
}

if (!customElements.get('shop-the-look')) customElements.define('shop-the-look', ShopTheLook);
