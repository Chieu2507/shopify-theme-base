import { EffectFade, Pagination, Thumbs } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const LIGHTBOX_ZOOM_SCALE = 2.25;
const LIGHTBOX_DRAG_THRESHOLD = 4;
const LIGHTBOX_DISMISS_AXIS_RATIO = 1.15;
const LIGHTBOX_DISMISS_ANIMATION_MS = 240;
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

    this.addEventListener('click', this.handleClick, { signal: this.signal, capture: true });
    this.addEventListener('keydown', this.handleKeydown, { signal: this.signal });
    this.addEventListener('pointerdown', this.handleLightboxPointerDown, { signal: this.signal, capture: true });
    this.addEventListener('pointermove', this.handleLightboxPointerMove, { signal: this.signal, capture: true });
    this.addEventListener('pointerup', this.handleLightboxPointerUp, { signal: this.signal, capture: true });
    this.addEventListener('pointercancel', this.handleLightboxPointerUp, { signal: this.signal, capture: true });
    this.addEventListener('dragstart', this.handleLightboxDragStart, { signal: this.signal, capture: true });
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
        dismissCandidate: false,
        dismissDragging: false,
        dismissAnimating: false,
        dismissPointerId: null,
        dismissAxis: null,
        dismissStartX: 0,
        dismissStartY: 0,
        dismissOffset: 0,
        dismissImage: null,
        dismissSlide: null,
        dismissTimer: null,
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
      event.stopPropagation();
      return;
    }

    const lightboxThumbnail = target.closest('[data-product-lightbox-thumbnail]');
    if (lightboxThumbnail) {
      const slides = Array.from(this.lightboxSwiper?.slides || []);
      const index = slides.findIndex((slide) => String(slide.dataset.mediaId) === String(lightboxThumbnail.dataset.mediaId));
      if (index >= 0) this.lightboxSwiper?.slideTo(index);
      event.stopPropagation();
      return;
    }

    const lightboxImage = target.closest('.product-media-lightbox__image');
    if (lightboxImage) {
      this.toggleLightboxZoom(lightboxImage, event);
      event.stopPropagation();
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
    if (!image || !this.lightboxSwiper || state.dismissAnimating) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    if (state.scale <= 1) {
      const slide = image.closest('.product-media-lightbox__slide');
      const activeSlide = this.lightboxSwiper.slides?.[this.lightboxSwiper.activeIndex];
      if (!slide || slide !== activeSlide) return;

      state.dismissCandidate = true;
      state.dismissDragging = false;
      state.dismissPointerId = event.pointerId;
      state.dismissAxis = null;
      state.dismissStartX = event.clientX;
      state.dismissStartY = event.clientY;
      state.dismissOffset = 0;
      state.dismissImage = image;
      state.dismissSlide = slide;
      return;
    }

    if (image !== state.image) return;

    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.originX = state.x;
    state.originY = state.y;
    state.moved = false;
    state.slide?.classList.add('is-dragging');
    image.setPointerCapture?.(event.pointerId);
    event.stopPropagation();
  }

  handleLightboxPointerMove(event) {
    const state = this.lightboxZoomState;
    if (state.dragging && state.pointerId === event.pointerId) {
      const deltaX = event.clientX - state.startX;
      const deltaY = event.clientY - state.startY;
      if (!state.moved && Math.hypot(deltaX, deltaY) < LIGHTBOX_DRAG_THRESHOLD) return;
      state.moved = true;
      const bounds = this.getLightboxPanBounds(state.slide);
      const resist = (value, min, max) => {
        if (value > max) return max + ((value - max) * 0.25);
        if (value < min) return min + ((value - min) * 0.25);
        return value;
      };
      state.x = resist(state.originX + deltaX, bounds.minX, bounds.maxX);
      state.y = resist(state.originY + deltaY, bounds.minY, bounds.maxY);
      this.applyLightboxZoom();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!state.dismissCandidate || state.dismissPointerId !== event.pointerId) return;

    const deltaX = event.clientX - state.dismissStartX;
    const deltaY = event.clientY - state.dismissStartY;
    if (!state.dismissAxis) {
      if (Math.hypot(deltaX, deltaY) < LIGHTBOX_DRAG_THRESHOLD) return;
      if (Math.abs(deltaY) <= Math.abs(deltaX) * LIGHTBOX_DISMISS_AXIS_RATIO) {
        state.dismissAxis = 'horizontal';
        this.resetLightboxDismiss();
        return;
      }

      state.dismissAxis = 'vertical';
      state.dismissDragging = true;
      state.dismissImage?.setPointerCapture?.(event.pointerId);
      this.lightbox?.classList.add('is-dismiss-dragging');
      if (this.lightboxSwiper) this.lightboxSwiper.allowTouchMove = false;
    }

    if (state.dismissAxis !== 'vertical') return;
    state.dismissOffset = deltaY;
    this.applyLightboxDismiss();
    event.preventDefault();
    event.stopPropagation();
  }

  handleLightboxPointerUp(event) {
    const state = this.lightboxZoomState;
    if (state.dragging && state.pointerId === event.pointerId) {
      state.image?.releasePointerCapture?.(event.pointerId);
      state.dragging = false;
      state.pointerId = null;
      state.slide?.classList.remove('is-dragging');
      this.clampLightboxPan(state.slide);
      if (state.moved) {
        state.suppressClickUntil = performance.now() + 250;
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    if (!state.dismissCandidate || state.dismissPointerId !== event.pointerId) return;

    if (state.dismissAxis === 'vertical') {
      this.finishLightboxDismiss();
      state.suppressClickUntil = performance.now() + 250;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.resetLightboxDismiss();
  }

  handleLightboxDragStart(event) {
    if (event.target?.closest?.('.product-media-lightbox__image')) event.preventDefault();
  }

  getLightboxPanBounds(slide) {
    const viewport = this.querySelector('[data-product-lightbox-swiper]');
    const zoomWidth = Number(slide?.dataset.zoomWidth || 0);
    const zoomHeight = Number(slide?.dataset.zoomHeight || 0);
    const viewportWidth = slide?.clientWidth || viewport?.clientWidth || 0;
    const viewportHeight = slide?.clientHeight || viewport?.clientHeight || 0;

    return {
      minX: Math.min(0, viewportWidth - zoomWidth),
      maxX: 0,
      minY: Math.min(0, viewportHeight - zoomHeight),
      maxY: 0,
    };
  }

  setLightboxPan(slide, x, y) {
    if (!slide) return;
    slide.dataset.panX = String(x);
    slide.dataset.panY = String(y);
    const image = slide.querySelector('.product-media-lightbox__image');
    if (image) image.style.transform = `translate3d(${x}px, ${y}px, 0px) scale3d(1, 1, 1)`;
  }

  prepareLightboxZoom(slide) {
    const image = slide?.querySelector('.product-media-lightbox__image');
    if (!slide || !image) return { x: 0, y: 0 };

    image.loading = 'eager';
    const viewportWidth = slide.clientWidth || window.innerWidth;
    const viewportHeight = slide.clientHeight || window.innerHeight;
    const sourceWidth = image.naturalWidth || Number(image.getAttribute('width')) || viewportWidth;
    const sourceHeight = image.naturalHeight || Number(image.getAttribute('height')) || viewportHeight;
    const coverScale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight, 1);
    const zoomWidth = Math.round(sourceWidth * coverScale * LIGHTBOX_ZOOM_SCALE);
    const zoomHeight = Math.round(sourceHeight * coverScale * LIGHTBOX_ZOOM_SCALE);
    slide.dataset.zoomWidth = String(zoomWidth);
    slide.dataset.zoomHeight = String(zoomHeight);
    slide.style.setProperty('--lightbox-zoom-width', `${zoomWidth}px`);
    slide.style.setProperty('--lightbox-zoom-height', `${zoomHeight}px`);
    image.style.transformOrigin = '0 0';

    const bounds = this.getLightboxPanBounds(slide);
    const x = (bounds.minX + bounds.maxX) / 2;
    const y = (bounds.minY + bounds.maxY) / 2;
    this.setLightboxPan(slide, x, y);
    if (!image.complete) {
      image.addEventListener('load', () => {
        if (slide.classList.contains('is-zoomed')) this.prepareLightboxZoom(slide);
      }, { once: true, signal: this.signal });
    }
    return { x, y };
  }

  clampLightboxPan(slide) {
    if (!slide) return;
    const bounds = this.getLightboxPanBounds(slide);
    const x = clamp(Number(slide.dataset.panX || 0), bounds.minX, bounds.maxX);
    const y = clamp(Number(slide.dataset.panY || 0), bounds.minY, bounds.maxY);
    this.setLightboxPan(slide, x, y);
  }

  get lightboxPanel() {
    return this.lightbox?.querySelector('.product-media-lightbox__panel');
  }

  getLightboxDismissThreshold() {
    const viewport = this.querySelector('[data-product-lightbox-swiper]');
    const height = viewport?.clientHeight || window.innerHeight;
    return Math.max(96, Math.min(240, height * 0.18));
  }

  applyLightboxDismiss() {
    const panel = this.lightboxPanel;
    if (!panel) return;

    const viewport = this.querySelector('[data-product-lightbox-swiper]');
    const height = viewport?.clientHeight || window.innerHeight;
    const progress = clamp(Math.abs(this.lightboxZoomState.dismissOffset) / Math.max(1, height), 0, 1);
    panel.style.setProperty('--lightbox-dismiss-y', `${this.lightboxZoomState.dismissOffset}px`);
    panel.style.setProperty('--lightbox-dismiss-opacity', String(1 - (progress * 0.4)));
  }

  finishLightboxDismiss() {
    const state = this.lightboxZoomState;
    const panel = this.lightboxPanel;
    if (!panel) {
      this.resetLightboxDismiss();
      return;
    }

    state.dismissCandidate = false;
    state.dismissDragging = false;
    const pointerId = state.dismissPointerId;
    state.dismissPointerId = null;
    state.dismissImage?.releasePointerCapture?.(pointerId);
    state.dismissImage = null;
    state.dismissSlide = null;
    this.lightbox?.classList.remove('is-dismiss-dragging');

    if (Math.abs(state.dismissOffset) < this.getLightboxDismissThreshold()) {
      state.dismissOffset = 0;
      this.lightbox?.classList.add('is-dismiss-snapping');
      this.applyLightboxDismiss();
      window.clearTimeout(state.dismissTimer);
      state.dismissTimer = window.setTimeout(() => {
        this.lightbox?.classList.remove('is-dismiss-snapping');
      }, LIGHTBOX_DISMISS_ANIMATION_MS);
      if (this.lightboxSwiper) this.lightboxSwiper.allowTouchMove = true;
      return;
    }

    state.dismissAnimating = true;
    this.lightbox?.classList.add('is-dismiss-animating');
    const viewport = this.querySelector('[data-product-lightbox-swiper]');
    const height = viewport?.clientHeight || window.innerHeight;
    state.dismissOffset = Math.sign(state.dismissOffset || 1) * height;
    this.applyLightboxDismiss();
    window.clearTimeout(state.dismissTimer);
    state.dismissTimer = window.setTimeout(() => {
      if (this.lightbox?.open) this.lightbox.close();
    }, LIGHTBOX_DISMISS_ANIMATION_MS);
  }

  resetLightboxDismiss() {
    const state = this.lightboxZoomState;
    window.clearTimeout(state.dismissTimer);
    state.dismissTimer = null;
    state.dismissCandidate = false;
    state.dismissDragging = false;
    state.dismissAnimating = false;
    state.dismissPointerId = null;
    state.dismissAxis = null;
    state.dismissOffset = 0;
    state.dismissImage = null;
    state.dismissSlide = null;
    this.lightbox?.classList.remove('is-dismiss-dragging', 'is-dismiss-snapping', 'is-dismiss-animating');
    this.lightboxPanel?.style.removeProperty('--lightbox-dismiss-y');
    this.lightboxPanel?.style.removeProperty('--lightbox-dismiss-opacity');
    if (this.lightboxSwiper) this.lightboxSwiper.allowTouchMove = true;
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

    state.image = image;
    state.slide = slide;
    state.scale = LIGHTBOX_ZOOM_SCALE;
    const pan = this.prepareLightboxZoom(slide);
    state.x = pan.x;
    state.y = pan.y;
    this.applyLightboxZoom();
  }

  applyLightboxZoom() {
    const state = this.lightboxZoomState;
    if (!state.image || !state.slide) return;

    if (state.scale > 1) this.setLightboxPan(state.slide, state.x, state.y);
    else state.image.style.removeProperty('transform');
    state.slide.classList.toggle('is-zoomed', state.scale > 1);
    state.slide.setAttribute('aria-pressed', String(state.scale > 1));
    if (this.lightboxSwiper) this.lightboxSwiper.allowTouchMove = state.scale <= 1;
  }

  clearLightboxZoom(slide) {
    if (!slide) return;

    slide.classList.remove('is-zoomed', 'is-dragging');
    slide.setAttribute('aria-pressed', 'false');
    slide.removeAttribute('data-zoom-width');
    slide.removeAttribute('data-zoom-height');
    slide.removeAttribute('data-pan-x');
    slide.removeAttribute('data-pan-y');
    slide.style.removeProperty('--lightbox-zoom-width');
    slide.style.removeProperty('--lightbox-zoom-height');

    const image = slide.querySelector('.product-media-lightbox__image');
    image?.style.removeProperty('transform');
    image?.style.removeProperty('transform-origin');
  }

  resetLightboxZoom() {
    const state = this.lightboxZoomState;
    this.resetLightboxDismiss();
    this.lightbox?.querySelectorAll('.product-media-lightbox__slide').forEach((slide) => {
      this.clearLightboxZoom(slide);
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
