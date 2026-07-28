import { A11y, Navigation, Swiper } from './swiper-loader.js';
import { initializeWhenVisible } from './initialize-when-visible.js';

class FeaturedCollection extends HTMLElement {
  connectedCallback() {
    this.tabs = Array.from(this.querySelectorAll('[data-featured-collection-tab]'));
    this.panels = Array.from(this.querySelectorAll('[data-featured-collection-panel]'));
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.swipers = new Map();
    this.onClick = this.handleClick.bind(this);
    this.onKeydown = this.handleKeydown.bind(this);
    this.onBlockSelect = this.handleBlockSelect.bind(this);
    this.onProductsLoaded = this.refreshCarousels.bind(this);
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeydown);
    this.addEventListener('featured-collection:products-loaded', this.onProductsLoaded);
    document.addEventListener('shopify:block:select', this.onBlockSelect);
    this.carouselsReady = false;
    this.cancelDeferredInitialization = initializeWhenVisible(this, () => this.activateCarousels());
    this.loadRecentlyViewedProducts();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeydown);
    this.removeEventListener('featured-collection:products-loaded', this.onProductsLoaded);
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    this.cancelDeferredInitialization?.();
    window.clearTimeout(this.panelAnimationTimer);
    this.swipers.forEach((swiper) => swiper.destroy(true, true));
    this.swipers.clear();
  }

  createVisibleCarousels() {
    this.panels.filter((panel) => !panel.hidden).forEach((panel) => this.createCarousel(panel));
  }

  activateCarousels() {
    if (this.carouselsReady) return;
    this.carouselsReady = true;
    this.createVisibleCarousels();
  }

  createCarousel(panel, replace = false) {
    if (panel.hidden) return;
    const carousel = panel.querySelector('[data-featured-collection-carousel]');
    const scroller = panel.querySelector('[data-featured-collection-scroller]');
    if (!carousel || !scroller || !scroller.querySelector('.swiper-slide')) return;

    const existing = this.swipers.get(panel);
    if (existing && !replace) {
      existing.update();
      this.updateProgress(panel, existing);
      return;
    }
    if (existing) existing.destroy(true, true);

    const productGap = Number.parseFloat(getComputedStyle(this).getPropertyValue('--featured-collection-product-gap')) || 0;
    const mobileProductGap = 8;
    const desktopColumns = Number.parseInt(this.dataset.desktopColumns, 10) || 4;
    const mobileColumns = Number.parseInt(this.dataset.mobileColumns, 10) || 1;
    const tabletColumns = this.classList.contains('featured-collection--has-promotion') ? 1 : Math.min(desktopColumns, 2);
    const productCount = scroller.querySelectorAll('.swiper-slide').length;
    const slidesWithPreview = (columns) => columns + (productCount > columns ? 0.15 : 0);
    const swiper = new Swiper(carousel, {
      modules: [A11y, Navigation],
      slidesPerView: slidesWithPreview(mobileColumns),
      spaceBetween: mobileProductGap,
      speed: this.reduceMotion ? 0 : 360,
      watchOverflow: true,
      navigation: {
        prevEl: panel.querySelector('[data-featured-collection-previous]'),
        nextEl: panel.querySelector('[data-featured-collection-next]'),
      },
      a11y: { enabled: true, slideRole: 'listitem' },
      breakpoints: {
        750: { slidesPerView: slidesWithPreview(tabletColumns), spaceBetween: productGap },
        990: { slidesPerView: slidesWithPreview(desktopColumns), spaceBetween: productGap },
      },
    });
    swiper.on('update resize slideChange transitionEnd', () => this.updateProgress(panel, swiper));
    this.swipers.set(panel, swiper);
    this.updateProgress(panel, swiper);
  }

  refreshCarousels(event) {
    if (!this.carouselsReady) return;
    const panel = event.detail?.panel;
    if (panel && this.contains(panel)) {
      this.createCarousel(panel, true);
      return;
    }
    this.panels = Array.from(this.querySelectorAll('[data-featured-collection-panel]'));
    this.createVisibleCarousels();
  }

  async loadRecentlyViewedProducts() {
    const panels = Array.from(this.querySelectorAll('[data-featured-collection-panel][data-featured-collection-source="recently_viewed"]'));
    if (!panels.length || this.dataset.designMode === 'true') return;

    let handles = [];
    try {
      const stored = JSON.parse(localStorage.getItem('jovie:recently-viewed') || '[]');
      handles = Array.isArray(stored) ? stored : [];
    } catch (_) {}

    const limit = Number.parseInt(this.dataset.productsToShow, 10) || 4;
    const products = await Promise.all(handles.slice(0, limit).map(async (handle) => {
      try {
        const response = await fetch(`/products/${encodeURIComponent(handle)}.js`, { headers: { Accept: 'application/json' } });
        return response.ok ? response.json() : null;
      } catch (_) {
        return null;
      }
    }));
    const visibleProducts = products.filter(Boolean);

    panels.forEach((panel) => {
      const list = panel.querySelector('[data-featured-collection-scroller]');
      const tab = this.tabs.find((candidate) => candidate.getAttribute('aria-controls') === panel.id);
      if (!visibleProducts.length || !list) {
        panel.remove();
        tab?.remove();
        return;
      }
      list.replaceChildren(...visibleProducts.map((product) => this.createRecentlyViewedCard(product)));
    });

    this.tabs = Array.from(this.querySelectorAll('[data-featured-collection-tab]'));
    this.panels = Array.from(this.querySelectorAll('[data-featured-collection-panel]'));
    if (!this.tabs.length || !this.panels.length) {
      this.hidden = true;
      return;
    }

    const selectedTab = this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || this.tabs[0];
    this.selectTab(selectedTab);
    this.hidden = false;
    this.dispatchEvent(new CustomEvent('featured-collection:products-loaded', { bubbles: true }));
  }

  createRecentlyViewedCard(product) {
    const item = document.createElement('li');
    item.className = 'featured-collection__product swiper-slide';
    const card = document.createElement('article');
    card.className = 'product-card product-card--recently-viewed';

    const media = document.createElement('div');
    media.className = 'product-card__media product-card__media--portrait';
    const mediaLink = document.createElement('a');
    mediaLink.className = 'product-card__media-link';
    mediaLink.href = product.url;
    const image = document.createElement('img');
    image.className = 'product-card__image';
    image.src = product.featured_image || '';
    image.alt = product.title || '';
    image.loading = 'lazy';
    mediaLink.append(image);
    media.append(mediaLink);

    const content = document.createElement('div');
    content.className = 'product-card__content';
    const details = document.createElement('div');
    details.className = 'product-card__details';
    const heading = document.createElement('h3');
    heading.className = 'product-card__title';
    const title = document.createElement('a');
    title.href = product.url;
    title.textContent = product.title || '';
    const price = document.createElement('span');
    price.className = 'product-card__price';
    price.textContent = this.formatMoney(product.price);
    heading.append(title);
    details.append(heading, price);
    content.append(details);
    card.append(media, content);
    item.append(card);
    return item;
  }

  formatMoney(cents) {
    if (window.Shopify?.formatMoney) return window.Shopify.formatMoney(cents, window.theme?.moneyWithCurrencyFormat || window.theme?.moneyFormat);
    return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: window.Shopify?.currency?.active || 'USD' }).format(Number(cents || 0) / 100);
  }

  selectTab(tab, moveFocus = false) {
    if (!tab) return;
    const currentTab = this.tabs.find((candidate) => candidate.getAttribute('aria-selected') === 'true');
    this.tabs.forEach((candidate) => {
      const isSelected = candidate === tab;
      candidate.setAttribute('aria-selected', String(isSelected));
      candidate.tabIndex = isSelected ? 0 : -1;
    });
    this.panels.forEach((panel) => {
      panel.hidden = panel.id !== tab.getAttribute('aria-controls');
    });
    const selectedPanel = this.querySelector(`#${CSS.escape(tab.getAttribute('aria-controls'))}`);
    if (selectedPanel && currentTab !== tab) this.animatePanel(selectedPanel);
    if (selectedPanel) this.createCarousel(selectedPanel);
    if (moveFocus) tab.focus();
  }

  animatePanel(panel) {
    if (this.reduceMotion) return;
    window.clearTimeout(this.panelAnimationTimer);
    this.panels.forEach((candidate) => candidate.classList.remove('featured-collection__panel--entering'));
    void panel.offsetWidth;
    panel.classList.add('featured-collection__panel--entering');
    this.panelAnimationTimer = window.setTimeout(() => {
      panel.classList.remove('featured-collection__panel--entering');
    }, 600);
  }

  updateProgress(panel, swiper) {
    const progressBar = panel.querySelector('[data-featured-collection-progress]');
    const progressTrack = progressBar?.closest('.featured-collection__progress');
    if (!progressBar || !swiper?.slides?.length) return;

    const desktopColumns = Number(this.dataset.desktopColumns) || 1;
    const hasOverflow = swiper.slides.length > desktopColumns;
    if (progressTrack) progressTrack.hidden = !hasOverflow;
    if (!hasOverflow) return;

    const visible = Math.min(Math.max(swiper.slidesPerViewDynamic(), Number(swiper.params.slidesPerView) || 1), swiper.slides.length);
    const thumbSize = Math.min(1, visible / swiper.slides.length);
    progressBar.style.setProperty('--featured-collection-progress', thumbSize + (swiper.progress * (1 - thumbSize)));
  }

  handleClick(event) {
    const tab = event.target.closest('[data-featured-collection-tab]');
    if (tab && this.contains(tab)) this.selectTab(tab);
  }

  handleKeydown(event) {
    const currentTab = event.target.closest('[data-featured-collection-tab]');
    if (!currentTab) return;
    const currentIndex = this.tabs.indexOf(currentTab);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % this.tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.tabs.length - 1;
    if (nextIndex === currentIndex) return;
    event.preventDefault();
    this.selectTab(this.tabs[nextIndex], true);
  }

  handleBlockSelect(event) {
    const tab = this.tabs.find((candidate) => candidate.dataset.blockId === event.detail?.blockId);
    if (tab) {
      this.activateCarousels();
      this.selectTab(tab);
    }
  }
}

if (!customElements.get('featured-collection')) customElements.define('featured-collection', FeaturedCollection);
