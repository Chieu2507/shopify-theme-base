import { EffectFade, Pagination, Thumbs } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const LIGHTBOX_ZOOM_SCALE = 2.25;
const LIGHTBOX_DRAG_THRESHOLD = 4;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class ProductMediaGallery extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;

    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    this.mobileQuery = window.matchMedia('(max-width: 767.98px)');
    this.productInformation = this.closest('[data-product-information]');

    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleLightboxPointerDown = this.handleLightboxPointerDown.bind(this);
    this.handleLightboxPointerMove = this.handleLightboxPointerMove.bind(this);
    this.handleLightboxPointerUp = this.handleLightboxPointerUp.bind(this);
    this.handleLightboxDragStart = this.handleLightboxDragStart.bind(this);
    this.handleBreakpoint = this.handleBreakpoint.bind(this);
    this.handleVariantChange = this.handleVariantChange.bind(this);

    this.addEventListener('click', this.handleClick, { signal: this.signal });
    this.addEventListener('keydown', this.handleKeydown, { signal: this.signal });
    this.addEventListener('pointerdown', this.handleLightboxPointerDown, { signal: this.signal });
    this.addEventListener('pointermove', this.handleLightboxPointerMove, { signal: this.signal });
    this.addEventListener('pointerup', this.handleLightboxPointerUp, { signal: this.signal });
    this.addEventListener('pointercancel', this.handleLightboxPointerUp, { signal: this.signal });
    this.addEventListener('dragstart', this.handleLightboxDragStart, { signal: this.signal });
    this.mobileQuery.addEventListener('change', this.handleBreakpoint, { signal: this.signal });
    this.productInformation?.addEventListener('variant:change', this.handleVariantChange, { signal: this.signal });
    this.lightbox?.addEventListener('close', () => this.destroyLightbox(), { signal: this.signal });
    this.lightbox?.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.lightbox.close();
    }, { signal: this.signal });

    this.applyVariantMediaFilter(this.dataset.currentVariantId);
    this.syncThumbnailVisibility();
    this.initializeGallery();
    this.initializeShopifyMedia();
  }

  disconnectedCallback() {
    window.requestAnimationFrame(() => {
      if (this.isConnected) return;

      this.abortController?.abort();
      this.abortController = null;
      this.destroyGallery();
      this.destroyLightbox();
    });
  }

  get mainElement() {
    return this.querySelector('[data-product-main-swiper]');
  }

  get thumbnailElement() {
    return this.querySelector('[data-product-thumbnail-swiper]');
  }

  get lightbox() {
    return this.querySelector('[data-product-media-lightbox]');
  }

  get lightboxZoomState() {
    if (!this._lightboxZoomState) {
      this._lightboxZoomState = {
        scale: 1,
        x: 0,
        y: 0,
        image: null,
        slide: null,
        dragging: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        originX: 0,
        originY: 0,
        moved: false,
        suppressClickUntil: 0,
      };
    }

    return this._lightboxZoomState;
  }

  get galleryMode() {
    if (this.mobileQuery.matches) return 'mobile';
    return ['left_thumbnails', 'bottom_thumbnails'].includes(this.dataset.desktopLayout) ? 'desktop-carousel' : 'desktop-static';
  }

  visibleSlides() {
    return Array.from(this.querySelectorAll('[data-product-media]')).filter((slide) => !slide.hidden);
  }

  activeMediaId() {
    const activeSlide = this.mainSwiper?.slides?.[this.mainSwiper.activeIndex];
    if (activeSlide && !activeSlide.hidden) return activeSlide.dataset.mediaId || '';

    return this.visibleSlides()[0]?.dataset.mediaId || '';
  }

  variantIdsFor(element) {
    return (element?.dataset.variantIds || '')
      .split(',')
      .map((variantId) => variantId.trim())
      .filter(Boolean);
  }

  setMediaVisibility(element, hidden) {
    if (!element) return;

    element.hidden = hidden;
    element.style.display = hidden ? 'none' : '';
    element.setAttribute('aria-hidden', String(hidden));
  }

  applyVariantMediaFilter(variantId) {
    if (this.dataset.filterVariantMedia !== 'true') return false;

    const slides = Array.from(this.querySelectorAll('[data-product-media]'));
    const normalizedVariantId = String(variantId || '');
    const hasLinkedMedia = Boolean(normalizedVariantId) && slides.some((slide) =>
      this.variantIdsFor(slide).includes(normalizedVariantId),
    );

    slides.forEach((slide) => {
      const variantIds = this.variantIdsFor(slide);
      const hidden = hasLinkedMedia && variantIds.length > 0 && !variantIds.includes(normalizedVariantId);
      this.setMediaVisibility(slide, hidden);
    });

    return true;
  }

  destroyGallery() {
    destroySwiperCarousel(this.mainSwiper);
    destroySwiperCarousel(this.thumbnailSwiper);
    this.mainSwiper = null;
    this.thumbnailSwiper = null;
    this.activeGalleryMode = null;
  }

  initializeGallery(preferredMediaId = '') {
    const main = this.mainElement;
    if (!main) return;

    const mode = this.galleryMode;
    if (mode === 'desktop-static') {
      this.destroyGallery();
      if (preferredMediaId) this.scrollToMedia(preferredMediaId, true);
      return;
    }

    if (this.mainSwiper && this.activeGalleryMode === mode) {
      this.thumbnailSwiper?.update();
      this.mainSwiper.update();
      if (preferredMediaId) this.showMedia(preferredMediaId, true);
      return;
    }

    this.destroyGallery();
    this.activeGalleryMode = mode;
    const isMobile = mode === 'mobile';
    const showThumbnails = !isMobile || this.dataset.mobileLayout === 'thumbnails';
    const showPagination = isMobile && this.dataset.mobileLayout === 'slider' && this.dataset.mobileShowPagination === 'true';
    const gapProperty = isMobile ? '--product-media-gap-mobile' : '--product-media-gap';
    const thumbnailGapProperty = isMobile ? '--product-media-thumbnail-gap-mobile' : '--product-media-thumbnail-gap';
    const computedStyle = getComputedStyle(this);
    const gapValue = Number.parseFloat(computedStyle.getPropertyValue(gapProperty));
    const gap = Number.isFinite(gapValue) ? gapValue : (isMobile ? 10 : 12);
    const thumbnailGapValue = Number.parseFloat(computedStyle.getPropertyValue(thumbnailGapProperty));
    const thumbnailGap = Number.isFinite(thumbnailGapValue) ? thumbnailGapValue : gap;

    if (showThumbnails && this.thumbnailElement) {
      this.thumbnailSwiper = createSwiperCarousel(this.thumbnailElement, {
        slidesPerView: 'auto',
        spaceBetween: thumbnailGap,
        direction: !isMobile && this.dataset.desktopLayout === 'left_thumbnails' ? 'vertical' : 'horizontal',
        watchSlidesProgress: true,
        a11y: { enabled: true },
      });
    }

    const pagination = this.querySelector('[data-product-media-pagination]');
    this.mainSwiper = createSwiperCarousel(main, {
      modules: showPagination ? [Pagination, Thumbs] : [Thumbs],
      slidesPerView: 1,
      spaceBetween: gap,
      speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
      watchOverflow: true,
      controls: {
        scope: this,
        previous: '[data-product-media-previous]',
        next: '[data-product-media-next]'
      },
      ...(showPagination && pagination ? { pagination: { el: pagination, clickable: true } } : {}),
      ...(this.thumbnailSwiper ? { thumbs: { swiper: this.thumbnailSwiper, autoScrollOffset: 1 } } : {}),
      a11y: { enabled: true },
    });

    if (preferredMediaId) this.showMedia(preferredMediaId, true);
  }

  handleBreakpoint() {
    const activeMediaId = this.activeMediaId();
    this.initializeGallery(activeMediaId);
  }

  handleVariantChange(event) {
    const variantId = String(event.detail?.variantId || event.detail?.variant?.id || '');
    const featuredMediaId = event.detail?.variant?.featured_media?.id;
    window.requestAnimationFrame(() => {
      this.dataset.currentVariantId = variantId;
      const filtersVariantMedia = this.applyVariantMediaFilter(variantId);
      this.syncThumbnailVisibility();
      const visibleMediaIds = new Set(this.visibleSlides().map((slide) => String(slide.dataset.mediaId)));
      const mediaId = featuredMediaId && visibleMediaIds.has(String(featuredMediaId))
        ? String(featuredMediaId)
        : this.activeMediaId();

      if (filtersVariantMedia) {
        this.destroyGallery();
        this.initializeGallery(mediaId);
        return;
      }

      if (this.galleryMode === 'desktop-static') {
        if (mediaId) this.scrollToMedia(String(mediaId), true);
        return;
      }
      this.mainSwiper?.update();
      this.thumbnailSwiper?.update();
      if (mediaId) this.showMedia(String(mediaId), true);
    });
  }

  handleClick(event) {
    const target = event.target;
    if (!target?.closest) return;

    if (target.closest('[data-product-lightbox-close]')) {
      this.lightbox?.close();
      return;
    }

    const lightboxThumbnail = target.closest('[data-product-lightbox-thumbnail]');
    if (lightboxThumbnail) {
      const slides = Array.from(this.lightboxSwiper?.slides || []);
      const index = slides.findIndex((slide) => String(slide.dataset.mediaId) === String(lightboxThumbnail.dataset.mediaId));
      if (index >= 0) this.lightboxSwiper?.slideTo(index);
      return;
    }

    const lightboxImage = target.closest('.product-media-lightbox__image');
    if (lightboxImage) {
      this.toggleLightboxZoom(lightboxImage, event);
      return;
    }

    const thumbnail = target.closest('[data-product-media-thumbnail]');
    if (thumbnail) {
      if (this.galleryMode === 'desktop-static') {
        this.scrollToMedia(thumbnail.dataset.mediaId);
      }
      return;
    }

    const media = target.closest('[data-product-media-content]');
    if (!media) return;
    this.activateMedia(media);
  }

  handleKeydown(event) {
    const target = event.target;
    if (!target?.closest) return;

    const lightboxSlide = target.closest('.product-media-lightbox__slide');
    if (lightboxSlide && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      const image = lightboxSlide.querySelector('.product-media-lightbox__image');
      if (image) this.toggleLightboxZoom(image, event);
      return;
    }

    const media = target.closest('[data-product-media-content]');
    if (!media || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    this.activateMedia(media);
  }

  handleLightboxPointerDown(event) {
    const image = event.target?.closest?.('.product-media-lightbox__image');
    const state = this.lightboxZoomState;
    if (!image || !this.lightboxSwiper || state.scale <= 1 || image !== state.image) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.originX = state.x;
    state.originY = state.y;
    state.moved = false;
    state.slide?.classList.add('is-dragging');
    image.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  handleLightboxPointerMove(event) {
    const state = this.lightboxZoomState;
    if (!state.dragging || state.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;
    if (!state.moved && Math.hypot(deltaX, deltaY) < LIGHTBOX_DRAG_THRESHOLD) return;
    state.moved = true;
    state.x = state.originX + deltaX;
    state.y = state.originY + deltaY;
    this.applyLightboxZoom();
    event.preventDefault();
    event.stopPropagation();
  }

  handleLightboxPointerUp(event) {
    const state = this.lightboxZoomState;
    if (!state.dragging || state.pointerId !== event.pointerId) return;

    state.image?.releasePointerCapture?.(event.pointerId);
    state.dragging = false;
    state.pointerId = null;
    state.slide?.classList.remove('is-dragging');
    if (state.moved) {
      state.suppressClickUntil = performance.now() + 250;
      event.preventDefault();
      event.stopPropagation();
    }
  }

  handleLightboxDragStart(event) {
    if (event.target?.closest?.('.product-media-lightbox__image')) event.preventDefault();
  }

  getLightboxPanBounds(image, scale = this.lightboxZoomState.scale) {
    const viewport = this.querySelector('[data-product-lightbox-swiper]');
    const viewportWidth = viewport?.clientWidth || image.clientWidth;
    const viewportHeight = viewport?.clientHeight || image.clientHeight;
    const imageWidth = image.clientWidth || viewportWidth;
    const imageHeight = image.clientHeight || viewportHeight;

    return {
      x: Math.max(0, (imageWidth * scale - viewportWidth) / 2),
      y: Math.max(0, (imageHeight * scale - viewportHeight) / 2),
    };
  }

  toggleLightboxZoom(image, event = {}) {
    const state = this.lightboxZoomState;
    if (state.suppressClickUntil > performance.now()) {
      state.suppressClickUntil = 0;
      return;
    }

    const activeSlide = this.lightboxSwiper?.slides?.[this.lightboxSwiper.activeIndex];
    const slide = image.closest('.product-media-lightbox__slide');
    if (!activeSlide || slide !== activeSlide) return;

    if (state.scale > 1) {
      this.resetLightboxZoom();
      return;
    }

    const viewport = this.querySelector('[data-product-lightbox-swiper]');
    const rect = viewport?.getBoundingClientRect() || slide.getBoundingClientRect();
    const centerX = rect.left + (rect.width / 2);
    const centerY = rect.top + (rect.height / 2);
    const pointerX = Number.isFinite(event.clientX) && event.clientX ? event.clientX : centerX;
    const pointerY = Number.isFinite(event.clientY) && event.clientY ? event.clientY : centerY;
    const scale = LIGHTBOX_ZOOM_SCALE;
    const bounds = this.getLightboxPanBounds(image, scale);

    state.image = image;
    state.slide = slide;
    state.scale = scale;
    state.x = clamp((1 - scale) * (pointerX - centerX), -bounds.x, bounds.x);
    state.y = clamp((1 - scale) * (pointerY - centerY), -bounds.y, bounds.y);
    this.applyLightboxZoom();
  }

  applyLightboxZoom() {
    const state = this.lightboxZoomState;
    if (!state.image || !state.slide) return;

    const bounds = this.getLightboxPanBounds(state.image);
    state.x = clamp(state.x, -bounds.x, bounds.x);
    state.y = clamp(state.y, -bounds.y, bounds.y);
    state.image.style.transform = state.scale > 1
      ? `translate3d(${state.x}px, ${state.y}px, 0) scale3d(${state.scale}, ${state.scale}, 1)`
      : '';
    state.slide.classList.toggle('is-zoomed', state.scale > 1);
    state.slide.setAttribute('aria-pressed', String(state.scale > 1));
    if (this.lightboxSwiper) this.lightboxSwiper.allowTouchMove = state.scale <= 1;
  }

  resetLightboxZoom() {
    const state = this.lightboxZoomState;
    this.lightbox?.querySelectorAll('.product-media-lightbox__slide').forEach((slide) => {
      slide.classList.remove('is-zoomed', 'is-dragging');
      slide.setAttribute('aria-pressed', 'false');
      slide.querySelector('.product-media-lightbox__image')?.style.removeProperty('transform');
    });
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    state.image = null;
    state.slide = null;
    state.dragging = false;
    state.pointerId = null;
    state.moved = false;
    state.suppressClickUntil = 0;
    if (this.lightboxSwiper) this.lightboxSwiper.allowTouchMove = true;
  }

  activateMedia(media) {
    if (!media.classList.contains('product-media--interactive')) return;
    if (this.dataset.zoom === 'open_lightbox') this.openLightbox(media.dataset.mediaId, media);
    if (this.dataset.zoom === 'click_hover') media.classList.toggle('is-zoomed');
  }

  syncThumbnailVisibility() {
    const slides = Array.from(this.querySelectorAll('[data-product-media]'));
    this.querySelectorAll('[data-product-media-thumbnail]').forEach((thumbnail) => {
      const slide = slides.find((item) => item.dataset.mediaId === thumbnail.dataset.mediaId);
      this.setMediaVisibility(thumbnail, Boolean(slide?.hidden));
    });
  }

  showMedia(mediaId, instant = false) {
    const slides = Array.from(this.mainSwiper?.slides || []);
    const index = slides.findIndex((slide) => String(slide.dataset.mediaId) === String(mediaId));
    if (index >= 0) this.mainSwiper.slideTo(index, instant ? 0 : undefined);
  }

  scrollToMedia(mediaId, instant = false) {
    const target = Array.from(this.querySelectorAll('[data-product-media]')).find(
      (media) => String(media.dataset.mediaId) === String(mediaId),
    );
    if (!target || target.hidden) return;
    target.scrollIntoView({
      behavior: instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'nearest',
    });
    this.querySelectorAll('[data-product-media-thumbnail]').forEach((thumbnail) => {
      thumbnail.setAttribute('aria-current', String(thumbnail.dataset.mediaId === String(mediaId)));
    });
  }

  openLightbox(mediaId, opener) {
    if (!this.lightbox?.showModal) return;
    this.lightboxOpener = opener;
    this.destroyLightbox(false);
    this.lightbox.showModal();
    document.documentElement.classList.add('product-media-lightbox-open');

    const viewport = this.querySelector('[data-product-lightbox-swiper]');
    if (!viewport) return;
    this.lightboxSwiper = createSwiperCarousel(viewport, {
      modules: [EffectFade],
      effect: 'fade',
      fadeEffect: { crossFade: true },
      slidesPerView: 1,
      watchOverflow: true,
      speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240,
      controls: {
        scope: this.lightbox,
        previous: '[data-product-lightbox-previous]',
        next: '[data-product-lightbox-next]'
      },
      a11y: { enabled: true },
    });
    this.resetLightboxZoom();
    const index = Array.from(this.lightboxSwiper.slides).findIndex(
      (slide) => String(slide.dataset.mediaId) === String(mediaId),
    );
    if (index >= 0) this.lightboxSwiper.slideTo(index, 0);
    this.updateLightboxCounter();
    this.lightboxSwiper.on('slideChange', () => {
      this.resetLightboxZoom();
      this.updateLightboxCounter();
    });
  }

  updateLightboxCounter() {
    const current = this.querySelector('[data-product-lightbox-current]');
    const total = this.querySelector('[data-product-lightbox-total]');
    const activeIndex = this.lightboxSwiper?.realIndex ?? this.lightboxSwiper?.activeIndex ?? 0;
    if (current) current.textContent = String(activeIndex + 1);
    if (total) total.textContent = String(this.lightboxSwiper?.slides?.length || 0);
    this.updateLightboxThumbnailState(activeIndex);
  }

  updateLightboxThumbnailState(activeIndex = 0) {
    this.querySelectorAll('[data-product-lightbox-thumbnail]').forEach((thumbnail, index) => {
      const isActive = index === activeIndex;
      thumbnail.classList.toggle('is-active', isActive);
      thumbnail.setAttribute('aria-current', String(isActive));
      if (isActive && typeof thumbnail.scrollIntoView === 'function') {
        thumbnail.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  }

  destroyLightbox(restoreFocus = true) {
    this.resetLightboxZoom();
    destroySwiperCarousel(this.lightboxSwiper);
    this.lightboxSwiper = null;
    document.documentElement.classList.remove('product-media-lightbox-open');
    if (restoreFocus && this.lightboxOpener?.isConnected) this.lightboxOpener.focus();
    if (restoreFocus) this.lightboxOpener = null;
  }

  initializeShopifyMedia() {
    const modelViewers = this.querySelectorAll('model-viewer');
    if (!modelViewers.length || !window.Shopify?.loadFeatures) return;
    window.Shopify.loadFeatures([
      {
        name: 'model-viewer-ui',
        version: '1.0',
        onLoad: (error) => {
          if (error || !window.Shopify?.ModelViewerUI) return;
          modelViewers.forEach((modelViewer) => {
            if (modelViewer.dataset.modelViewerInitialized === 'true') return;
            new window.Shopify.ModelViewerUI(modelViewer);
            modelViewer.dataset.modelViewerInitialized = 'true';
          });
        },
      },
    ]);
  }
}

if (!customElements.get('product-media-gallery')) {
  customElements.define('product-media-gallery', ProductMediaGallery);
}
