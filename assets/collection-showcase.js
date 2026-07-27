import { A11y, EffectFade, Swiper } from './swiper-loader.js?v=effect-fade-1';
import { initializeWhenVisible } from './initialize-when-visible.js';

class CollectionShowcase extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;

    this.initialized = true;
    this.tabs = Array.from(this.querySelectorAll('[data-collection-showcase-tab]'));
    this.items = Array.from(this.querySelectorAll('[data-collection-showcase-item]'));
    this.panels = Array.from(this.querySelectorAll('[data-collection-showcase-panel]'));
    this.onClick = this.handleClick.bind(this);
    this.onPointerOver = this.handlePointerOver.bind(this);
    this.onFocusIn = this.handleFocusIn.bind(this);
    this.onKeydown = this.handleKeydown.bind(this);
    this.onBlockSelect = this.handleBlockSelect.bind(this);

    this.addEventListener('click', this.onClick);
    this.addEventListener('pointerover', this.onPointerOver);
    this.addEventListener('focusin', this.onFocusIn);
    this.addEventListener('keydown', this.onKeydown);
    document.addEventListener('shopify:block:select', this.onBlockSelect);
    this.sliderReady = false;
    this.cancelDeferredInitialization = initializeWhenVisible(this, () => this.activateSlider());
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('pointerover', this.onPointerOver);
    this.removeEventListener('focusin', this.onFocusIn);
    this.removeEventListener('keydown', this.onKeydown);
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    this.cancelDeferredInitialization?.();
    this.swiper?.destroy(true, true);
    this.swiper = null;
    this.initialized = false;
  }

  initializeSlider() {
    const slider = this.querySelector('[data-collection-showcase-slider]');
    if (!slider || !this.panels.length) return;

    this.swiper = new Swiper(slider, {
      modules: [A11y, EffectFade],
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520,
      slidesPerView: 1,
      rewind: this.panels.length > 1,
      simulateTouch: this.panels.length > 1,
      allowTouchMove: this.panels.length > 1,
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
    if (index < 0 || index >= this.tabs.length) return;

    this.activateSlider();
    this.swiper?.slideTo(index);
    this.syncActiveState(index);

    if (moveFocus) this.tabs[index].focus();
  }

  syncActiveState(index) {
    this.tabs.forEach((tab, tabIndex) => {
      const isActive = tabIndex === index;
      tab.setAttribute('aria-pressed', String(isActive));
    });

    this.items.forEach((item, itemIndex) => {
      item.classList.toggle('collection-showcase__item--active', itemIndex === index);
    });

    this.panels.forEach((panel, panelIndex) => {
      const isActive = panelIndex === index;
      panel.setAttribute('aria-hidden', String(!isActive));
      panel.toggleAttribute('inert', !isActive);
    });
  }

  handleClick(event) {
    const tab = event.target.closest('[data-collection-showcase-tab]');
    if (!tab || !this.contains(tab)) return;

    const index = this.tabs.indexOf(tab);
    if (index >= 0) this.selectIndex(index);
  }

  handlePointerOver(event) {
    const tab = event.target.closest('[data-collection-showcase-tab]');
    if (!tab || !this.contains(tab) || tab.contains(event.relatedTarget)) return;

    const index = this.tabs.indexOf(tab);
    if (index >= 0) this.selectIndex(index);
  }

  handleFocusIn(event) {
    const tab = event.target.closest('[data-collection-showcase-tab]');
    if (!tab || !this.contains(tab)) return;

    const index = this.tabs.indexOf(tab);
    if (index >= 0) this.selectIndex(index);
  }

  handleKeydown(event) {
    const tab = event.target.closest('[data-collection-showcase-tab]');
    if (!tab || !this.contains(tab)) return;

    const currentIndex = this.tabs.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % this.tabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.tabs.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    this.selectIndex(nextIndex, true);
  }

  handleBlockSelect(event) {
    const index = this.items.findIndex((item) => item.dataset.blockId === event.detail?.blockId);
    if (index >= 0) this.selectIndex(index);
  }
}

if (!customElements.get('collection-showcase')) {
  customElements.define('collection-showcase', CollectionShowcase);
}
