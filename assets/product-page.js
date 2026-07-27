import { A11y, Pagination, Swiper, Thumbs } from './swiper-loader.js';
import EffectFade from './swiper-12.2.0-effect-fade.min.mjs';
import './cart-feedback.js';

class ProductPage extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController();
    this.signal = this.abortController.signal;
    this.sectionId = this.dataset.sectionId;
    this.form = this.querySelector('[data-product-form]');
    this.status = this.querySelector('[data-product-status]');
    this.inventoryWarning = this.querySelector('[data-product-inventory-warning]');
    this.productContext = this.dataset.productContext || 'product-page';
    this.variants = this.readJson('[data-product-variants]');
    this.media = this.readJson('[data-product-media]');
    this.variant = this.variants.find((variant) => String(variant.id) === this.querySelector('[data-variant-id]')?.value) || this.variants[0];
    this.bind();
    this.bindSizeChart();
    this.bindStickyCart();
    this.initializeGallery();
    this.bindGalleryInteractions();
    this.bindGalleryResponsiveness();
    this.bindGalleryLifecycle();
    this.initializeAccordions();
    if (this.productContext !== 'quick-view') {
      this.initializeRecommendations();
      this.initializeRecentlyViewed();
    }
    this.updateOptionLabels();
    if (this.variant?.featured_media?.id) this.showMedia(String(this.variant.featured_media.id));
    this.loadPickupAvailability();
    this.updateOptionAvailability();
    this.restoreQuantity();
    window.addEventListener('popstate', () => this.resolveFromUrl(), { signal: this.signal });
    this.dispatch('product:variant-change', { variant: this.variant, initial: true });
  }

  disconnectedCallback() {
    if (this.lightbox?.classList.contains('is-open')) this.closeLightbox();
    else document.documentElement.classList.remove('product-lightbox-open');
    this.abortController?.abort();
    if (this.galleryMediaQuery?.removeListener && this.galleryMediaChange) this.galleryMediaQuery.removeListener(this.galleryMediaChange);
    if (this.galleryRefreshFrame) cancelAnimationFrame(this.galleryRefreshFrame);
    this.destroyGallery();
    this.lightboxSwiper?.destroy(true, true);
    this.lightboxSwiper = null;
    this.galleryObserver?.disconnect();
    this.galleryResizeObserver?.disconnect();
    this.stickyCartObserver?.disconnect();
    this.stickyCartFooterObserver?.disconnect();
    document.removeEventListener('shopify:section:load', this.onSectionLoad);
  }

  readJson(selector) {
    try { return JSON.parse(this.querySelector(selector)?.textContent || '[]'); } catch { return []; }
  }

  bind() {
    this.querySelectorAll('[data-product-option]').forEach((input) => input.addEventListener('change', () => this.onOptionChange(), { signal: this.signal }));
    this.querySelectorAll('[data-quantity-increase], [data-quantity-decrease]').forEach((button) => button.addEventListener('click', () => this.changeQuantity(button.hasAttribute('data-quantity-increase') ? 1 : -1), { signal: this.signal }));
    this.querySelector('[data-quantity-input]')?.addEventListener('change', () => this.normalizeQuantity(), { signal: this.signal });
    this.form?.addEventListener('submit', (event) => this.addToCart(event), { signal: this.signal });
    this.querySelector('[data-buy-now]')?.addEventListener('click', () => this.buyNow(), { signal: this.signal });
  }

  bindSizeChart() {
    const dialog = this.querySelector('[data-size-chart-dialog]');
    if (!dialog) return;
    const panel = dialog.querySelector('.product-size-chart__panel');
    const closeButton = dialog.querySelector('[data-size-chart-close]');
    this.closeSizeChart = () => {
      if (!dialog.classList.contains('is-open') || dialog.classList.contains('is-closing')) return;
      dialog.classList.add('is-closing');
      panel?.addEventListener('animationend', () => {
        dialog.classList.remove('is-open', 'is-closing');
        dialog.setAttribute('aria-hidden', 'true');
        dialog.removeAttribute('scroll-lock');
      }, { once: true, signal: this.signal });
    };
    this.querySelectorAll('[data-size-chart-open]').forEach((button) => {
      button.addEventListener('click', () => {
        if (!dialog.classList.contains('is-open')) {
          dialog.classList.remove('is-closing');
          dialog.classList.add('is-open');
          dialog.setAttribute('aria-hidden', 'false');
          dialog.setAttribute('scroll-lock', '');
          closeButton?.focus({ preventScroll: true });
        }
      }, { signal: this.signal });
    });
    this.querySelectorAll('[data-size-chart-close]').forEach((button) => {
      button.addEventListener('click', this.closeSizeChart, { signal: this.signal });
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeSizeChart();
      }
    }, { signal: this.signal });
  }

  bindStickyCart() {
    const sticky = this.querySelector('[data-sticky-cart]');
    const buyButtons = this.querySelector('[data-product-buy-buttons]');
    if (!sticky || !buyButtons) return;
    const stickyButton = sticky.querySelector('[data-sticky-cart-add]');
    stickyButton?.addEventListener('click', (event) => {
      event.preventDefault();
      if (stickyButton.disabled) return;
      this.addToCart(event, stickyButton);
    }, { signal: this.signal });
    this.stickyCartPassedBuyButtons = false;
    this.stickyCartFooterVisible = false;
    const updateStickyCartVisibility = () => {
      const shouldShow = this.stickyCartPassedBuyButtons && !this.stickyCartFooterVisible;
      sticky.classList.toggle('is-visible', shouldShow);
      sticky.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    };
    this.stickyCartObserver = new IntersectionObserver(([entry]) => {
      this.stickyCartPassedBuyButtons = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      updateStickyCartVisibility();
    }, { threshold: 0.01 });
    this.stickyCartObserver.observe(buyButtons);
    const footer = document.querySelector('footer.footer');
    if (footer) {
      this.stickyCartFooterObserver = new IntersectionObserver(([entry]) => {
        this.stickyCartFooterVisible = entry.isIntersecting;
        updateStickyCartVisibility();
      }, { threshold: 0.01 });
      this.stickyCartFooterObserver.observe(footer);
    }
  }

  getGalleryMode() {
    const gallery = this.querySelector('[data-product-gallery]');
    if (!gallery) return null;
    if (this.galleryMediaQuery?.matches ?? window.matchMedia('(max-width: 989px)').matches) return 'mobile';
    return gallery.classList.contains('product-gallery--carousel') ? 'desktop' : null;
  }

  getActiveMediaId() {
    return this.mainGallery?.slides[this.mainGallery.activeIndex]?.dataset.mediaId || null;
  }

  destroyGallery() {
    this.mainGallery?.destroy(true, true);
    this.thumbnailGallery?.destroy(true, true);
    this.mainGallery = null;
    this.thumbnailGallery = null;
    this.galleryMode = null;
  }

  initializeGallery(preferredMediaId = null) {
    const mode = this.getGalleryMode();
    const isMobile = mode === 'mobile';
    const gallery = this.querySelector('[data-product-gallery]');
    const main = this.querySelector('[data-product-main-gallery]');
    if (!main || !mode) return;
    if (this.mainGallery && this.galleryMode === mode) {
      this.thumbnailGallery?.update();
      this.mainGallery.update();
      return;
    }

    this.destroyGallery();
    this.galleryMode = mode;
    const thumbnail = this.querySelector('[data-product-thumbnail-gallery]');
    const thumbnailGap = Number.parseInt(getComputedStyle(this).getPropertyValue('--gallery-thumbnail-gap'), 10) || 8;
    const shouldLoop = main.querySelectorAll('.swiper-slide').length > 1;
    const showPagination = isMobile || gallery.classList.contains('product-gallery--quick-view');

    // Follow Swiper's Thumbs Gallery pattern: create the thumbnail instance first,
    // then pass that live instance into the main gallery.
    if (thumbnail) {
      this.thumbnailGallery = new Swiper(thumbnail, {
        modules: [A11y],
        slidesPerView: 'auto',
        spaceBetween: thumbnailGap,
        direction: !isMobile && gallery.classList.contains('product-gallery--thumbs-left') ? 'vertical' : 'horizontal',
        loop: shouldLoop,
        watchSlidesProgress: true,
        slideToClickedSlide: true,
        a11y: { enabled: true },
      });
    }

    this.mainGallery = new Swiper(main, {
      modules: showPagination ? [A11y, Pagination, Thumbs] : [A11y, Thumbs],
      slidesPerView: 1,
      speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
      simulateTouch: true,
      allowTouchMove: true,
      loop: shouldLoop,
      ...(showPagination ? { pagination: { el: this.querySelector('[data-product-gallery-pagination]'), clickable: true } } : {}),
      ...(this.thumbnailGallery ? { thumbs: { swiper: this.thumbnailGallery, autoScrollOffset: 1 } } : {}),
      a11y: { enabled: true },
    });
    this.mainGallery.on('slideChange', () => {
      const slide = this.mainGallery.slides[this.mainGallery.activeIndex];
      const mediaId = slide?.dataset.mediaId;
      this.dispatch('product:media-change', { mediaId });
    });
    if (preferredMediaId) this.showMedia(preferredMediaId, true);
  }

bindGalleryInteractions() {
  if (this.galleryInteractionsBound) return;
  this.galleryInteractionsBound = true;

  this.addEventListener('click', (event) => {
    const close = event.target.closest('[data-lightbox-close]');
    if (close) {
      this.closeLightbox();
      return;
    }


    const lightboxSlide = event.target.closest('[data-lightbox-slide]');
    if (lightboxSlide?.classList.contains('is-active')) {
      if (this.lightboxSuppressClick) {
        this.lightboxSuppressClick = false;
        return;
      }
      this.toggleLightboxZoom(lightboxSlide);
      return;
    }

    const media = event.target.closest('[data-product-media][data-zoom-mode]');
    if (!media || !this.contains(media)) return;
    const mode = media.dataset.zoomMode;
    if (mode === 'open_lightbox') this.openLightbox(media.dataset.mediaId, media);
    if (mode === 'click_hover') media.classList.toggle('is-zoomed');
  }, { signal: this.signal });

this.addEventListener('pointerdown', (event) => {
  const slide = event.target.closest('[data-lightbox-slide].is-active.is-zoomed');
  if (!slide || event.button !== 0) return;
  const panX = Number(slide.dataset.panX || 0);
  const panY = Number(slide.dataset.panY || 0);
  this.lightboxDrag = {
    slide,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    panX,
    panY,
    moved: false,
  };
  slide.classList.add('is-dragging');
  slide.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}, { signal: this.signal });

  this.addEventListener('pointermove', (event) => {
    if (this.lightboxDrag?.pointerId === event.pointerId) {
      const drag = this.lightboxDrag;
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      const { minX, maxX, minY, maxY } = this.getLightboxPanBounds(drag.slide);
      const resist = (value, min, max) => {
        if (value > max) return max + (value - max) * 0.25;
        if (value < min) return min + (value - min) * 0.25;
        return value;
      };
      const panX = resist(drag.panX + deltaX, minX, maxX);
      const panY = resist(drag.panY + deltaY, minY, maxY);
      this.setLightboxPan(drag.slide, panX, panY);
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) drag.moved = true;
      event.preventDefault();
      return;
    }

    const media = event.target.closest('[data-product-media][data-zoom-mode="click_hover"]');
    if (!media || !media.classList.contains('is-zoomed')) return;
    const bounds = media.getBoundingClientRect();
    media.style.setProperty('--zoom-x', String(Math.round(((event.clientX - bounds.left) / bounds.width) * 100)) + '%');
    media.style.setProperty('--zoom-y', String(Math.round(((event.clientY - bounds.top) / bounds.height) * 100)) + '%');
  }, { signal: this.signal });

this.addEventListener('pointerup', (event) => this.finishLightboxDrag(event), { signal: this.signal });
this.addEventListener('pointercancel', (event) => this.finishLightboxDrag(event), { signal: this.signal });

  this.addEventListener('keydown', (event) => {
    const lightboxSlide = event.target.closest('[data-lightbox-slide]');
    if (lightboxSlide?.classList.contains('is-active') && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.toggleLightboxZoom(lightboxSlide);
      return;
    }

    const media = event.target.closest('[data-product-media][data-zoom-mode]');
    if (media && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      const mode = media.dataset.zoomMode;
      if (mode === 'open_lightbox') this.openLightbox(media.dataset.mediaId, media);
      if (mode === 'click_hover') media.classList.toggle('is-zoomed');
      return;
    }

    if (!this.lightbox?.classList.contains('is-open')) return;
    if (event.key === 'Escape') this.closeLightbox();
    if (event.key === 'ArrowLeft') this.changeLightboxSlide(-1);
    if (event.key === 'ArrowRight') this.changeLightboxSlide(1);
    if (event.key === 'Tab') {
      const focusable = [...this.lightbox.querySelectorAll('button:not([disabled]), [tabindex="0"]')]
        .filter((element) => element.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (event.target === first || !this.lightbox.contains(event.target))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (event.target === last || !this.lightbox.contains(event.target))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }
  }, { signal: this.signal });
}

getLightboxPanBounds(slide) {
  const zoomWidth = Number(slide?.dataset.zoomWidth || 0);
  const zoomHeight = Number(slide?.dataset.zoomHeight || 0);
  const viewportWidth = slide?.clientWidth || 0;
  const viewportHeight = slide?.clientHeight || 0;
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
  const image = slide.querySelector('img');
  if (image) image.style.transform = `translate3d(${x}px, ${y}px, 0px) scale3d(1, 1, 1)`;
}

prepareLightboxZoom(slide) {
  const image = slide?.querySelector('img');
  if (!slide || !image) return;
  image.loading = 'eager';
  const viewportWidth = slide.clientWidth || window.innerWidth;
  const viewportHeight = slide.clientHeight || window.innerHeight;
  const sourceWidth = image.naturalWidth || Number(image.getAttribute('width')) || viewportWidth;
  const sourceHeight = image.naturalHeight || Number(image.getAttribute('height')) || viewportHeight;
  const minimumScale = Math.max(viewportWidth / sourceWidth, viewportHeight / sourceHeight, 1);
  const zoomWidth = Math.round(sourceWidth * minimumScale);
  const zoomHeight = Math.round(sourceHeight * minimumScale);
  slide.dataset.zoomWidth = String(zoomWidth);
  slide.dataset.zoomHeight = String(zoomHeight);
  slide.style.setProperty('--lightbox-zoom-width', String(zoomWidth) + 'px');
  slide.style.setProperty('--lightbox-zoom-height', String(zoomHeight) + 'px');
  image.style.transformOrigin = '0px 0px';
  const { minX, maxX, minY, maxY } = this.getLightboxPanBounds(slide);
  this.setLightboxPan(slide, (minX + maxX) / 2, (minY + maxY) / 2);
  if (!image.complete) {
    image.addEventListener('load', () => {
      if (slide.classList.contains('is-zoomed')) this.prepareLightboxZoom(slide);
    }, { once: true, signal: this.signal });
  }
}

clampLightboxPan(slide) {
  if (!slide) return;
  const { minX, maxX, minY, maxY } = this.getLightboxPanBounds(slide);
  const panX = Math.max(minX, Math.min(maxX, Number(slide.dataset.panX || 0)));
  const panY = Math.max(minY, Math.min(maxY, Number(slide.dataset.panY || 0)));
  this.setLightboxPan(slide, panX, panY);
}

finishLightboxDrag(event) {
  const drag = this.lightboxDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  drag.slide.classList.remove('is-dragging');
  drag.slide.querySelector('img')?.getBoundingClientRect();
  this.clampLightboxPan(drag.slide);
  drag.slide.releasePointerCapture?.(event.pointerId);
  this.lightboxSuppressClick = drag.moved && event.type === 'pointerup';
  if (this.lightboxSuppressClick) {
    window.setTimeout(() => { this.lightboxSuppressClick = false; }, 0);
  }
  this.lightboxDrag = null;
}

resetLightboxPan(slide) {
  this.setLightboxPan(slide, 0, 0);
}

clearLightboxZoom(slide) {
  if (!slide) return;
  slide.classList.remove('is-zoomed', 'is-dragging');
  slide.removeAttribute('data-zoom-width');
  slide.removeAttribute('data-zoom-height');
  slide.style.removeProperty('--lightbox-zoom-width');
  slide.style.removeProperty('--lightbox-zoom-height');
  this.resetLightboxPan(slide);
  const image = slide.querySelector('img');
  image?.style.removeProperty('transform');
  image?.style.removeProperty('transform-origin');
}

toggleLightboxZoom(slide) {
  const zoomed = slide.classList.toggle('is-zoomed');
  if (zoomed) this.prepareLightboxZoom(slide);
  else this.clearLightboxZoom(slide);
  if (this.lightboxSwiper) this.lightboxSwiper.allowTouchMove = !zoomed;
}

initializeLightboxSwiper() {
  const lightbox = this.getLightbox();
  const viewport = lightbox?.querySelector('[data-lightbox-swiper]');
  if (!viewport) return null;
  if (this.lightboxSwiper?.el === viewport && !this.lightboxSwiper.destroyed) {
    this.lightboxSwiper.update();
    return this.lightboxSwiper;
  }
  this.lightboxSwiper?.destroy(true, true);
  const slideCount = viewport.querySelectorAll("[data-lightbox-slide]").length;
  this.lightboxSwiper = new Swiper(viewport, {
    modules: [A11y, EffectFade],
    effect: 'fade',
    fadeEffect: { crossFade: true },
    slidesPerView: 1,
    initialSlide: this.lightboxIndex || 0,
    speed: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280,
    rewind: slideCount > 1,
    allowTouchMove: true,
    simulateTouch: true,
    observer: true,
    observeParents: true,
    a11y: { enabled: true },
  });
  const bindNavigationButton = (selector, direction) => {
    const button = lightbox.querySelector(selector);
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const swiper = this.lightboxSwiper;
      // console.log('[Product lightbox] navigation click', {
      //   direction: direction > 0 ? 'next' : 'previous',
      //   available: Boolean(swiper && !swiper.destroyed),
      //   activeIndex: swiper?.activeIndex,
      //   realIndex: swiper?.realIndex,
      //   loop: swiper?.params?.loop,
      //   animating: swiper?.animating,
      // });
      if (!swiper || swiper.destroyed) return;
      const targetIndex = (swiper.realIndex + direction + slideCount) % slideCount;
      if (swiper.params.loop) swiper.slideToLoop(targetIndex, swiper.params.speed, true);
      else swiper.slideTo(targetIndex, swiper.params.speed, true);
    }, { signal: this.signal });
  };
  bindNavigationButton('[data-lightbox-next]', 1);
  bindNavigationButton('[data-lightbox-previous]', -1);
  this.lightboxSwiper.on('slideChange', () => {
    this.lightboxIndex = this.lightboxSwiper.realIndex;
    this.updateLightbox();
  });
  return this.lightboxSwiper;
}

getLightbox() {
  if (!this.lightbox || !this.contains(this.lightbox)) this.lightbox = this.querySelector('[data-product-lightbox]');
  return this.lightbox;
}

updateLightbox() {
  const lightbox = this.getLightbox();
  if (!lightbox) return;
  const slides = [...lightbox.querySelectorAll('[data-lightbox-slide]')];
  if (!slides.length) return;
  const swiper = this.lightboxSwiper && !this.lightboxSwiper.destroyed ? this.lightboxSwiper : null;
  const totalSlides = new Set(slides.map((slide) => slide.dataset.mediaId)).size;
  const activeSlide = swiper?.slides?.[swiper.activeIndex] || slides[this.lightboxIndex || 0];
  const activeIndex = swiper?.realIndex ?? this.lightboxIndex ?? 0;
  this.lightboxIndex = (activeIndex + totalSlides) % totalSlides;
  slides.forEach((slide) => {
    const active = slide === activeSlide;
    slide.classList.toggle('is-active', active);
    slide.tabIndex = active ? 0 : -1;
    if (!active) {
      this.clearLightboxZoom(slide);
    }
  });
  const current = lightbox.querySelector('[data-lightbox-current]');
  const total = lightbox.querySelector('[data-lightbox-total]');
  if (current) current.textContent = String(this.lightboxIndex + 1);
  if (total) total.textContent = String(totalSlides);
  if (swiper) swiper.allowTouchMove = !activeSlide?.classList.contains('is-zoomed');
}

openLightbox(mediaId, restoreTarget = null) {
  const lightbox = this.getLightbox();
  if (!lightbox) return;
  const slides = [...lightbox.querySelectorAll('[data-lightbox-slide]')];
  const matchingSlide = slides.find((slide) => String(slide.dataset.mediaId) === String(mediaId));
  const mediaIndex = Number(matchingSlide?.dataset.lightboxIndex);
  this.lightboxIndex = Number.isFinite(mediaIndex) ? mediaIndex : 0;
  this.lightboxRestoreTarget = restoreTarget || document.activeElement;
  slides.forEach((slide) => this.clearLightboxZoom(slide));
  lightbox.classList.add('is-open');
  lightbox.setAttribute('scroll-lock', '');
  lightbox.setAttribute('aria-hidden', 'false');
  lightbox.removeAttribute('inert');
  document.documentElement.classList.add('product-lightbox-open');
  const swiper = this.initializeLightboxSwiper();
  swiper?.update();
  const targetIndex = swiper?.params.loop ? swiper.getSlideIndexByData(this.lightboxIndex) : this.lightboxIndex;
  if (swiper && Number.isFinite(targetIndex)) swiper.slideTo(targetIndex, 0, false);
  this.updateLightbox();
  lightbox.querySelector('[data-lightbox-close]')?.focus({ preventScroll: true });
}

closeLightbox() {
  const lightbox = this.getLightbox();
  if (!lightbox?.classList.contains('is-open')) return;
  lightbox.classList.remove('is-open');
  lightbox.removeAttribute('scroll-lock');
  lightbox.querySelectorAll('[data-lightbox-slide]').forEach((slide) => {
    this.clearLightboxZoom(slide);
  });
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.setAttribute('inert', '');
  document.documentElement.classList.remove('product-lightbox-open');
  this.lightboxRestoreTarget?.focus?.({ preventScroll: true });
}

changeLightboxSlide(delta) {
  const lightbox = this.getLightbox();
  if (!lightbox?.classList.contains('is-open')) return;
  if (this.lightboxSwiper && !this.lightboxSwiper.destroyed) {
    if (delta > 0) this.lightboxSwiper.slideNext();
    else this.lightboxSwiper.slidePrev();
    return;
  }
  this.lightboxIndex += delta;
  this.updateLightbox();
}

  bindGalleryResponsiveness() {
    this.galleryMediaQuery = window.matchMedia('(max-width: 989px)');
    this.galleryMediaChange = () => this.refreshGallery(true);
    if (this.galleryMediaQuery.addEventListener) this.galleryMediaQuery.addEventListener('change', this.galleryMediaChange, { signal: this.signal });
    else this.galleryMediaQuery.addListener(this.galleryMediaChange);
  }

  bindGalleryLifecycle() {
    this.galleryNode = this.querySelector('[data-product-gallery]');
    this.gallerySignature = this.galleryNode?.className || '';
    this.refreshGallery = this.refreshGallery.bind(this);
    this.onSectionLoad = (event) => {
      if (event.target === this || event.target?.contains(this)) this.refreshGallery(true);
    };
    document.addEventListener('shopify:section:load', this.onSectionLoad);
    this.galleryObserver = new MutationObserver(() => this.refreshGallery());
    this.galleryObserver.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    if ('ResizeObserver' in window && this.galleryNode) {
      this.galleryResizeObserver = new ResizeObserver(() => {
        if (this.getGalleryMode() !== this.galleryMode) this.refreshGallery(true);
        else {
          this.thumbnailGallery?.update();
          this.mainGallery?.update();
        }
      });
      this.galleryResizeObserver.observe(this.galleryNode);
    }
  }

  refreshGallery(force = false) {
    const gallery = this.querySelector('[data-product-gallery]');
    const signature = gallery?.className || '';
    if (!force && gallery === this.galleryNode && signature === this.gallerySignature) return;
    if (this.galleryRefreshFrame) cancelAnimationFrame(this.galleryRefreshFrame);
    // Theme Editor changes markup and preview dimensions in separate frames. Waiting
    // for two paints ensures Swiper measures the active breakpoint, not the previous one.
    this.galleryRefreshFrame = requestAnimationFrame(() => {
      this.galleryRefreshFrame = requestAnimationFrame(() => {
        this.galleryRefreshFrame = null;
        const nextGallery = this.querySelector('[data-product-gallery]');
        const nextSignature = nextGallery?.className || '';
        if (!force && nextGallery === this.galleryNode && nextSignature === this.gallerySignature) return;
        const activeMediaId = this.getActiveMediaId();
        this.destroyGallery();
        this.galleryResizeObserver?.disconnect();
        this.galleryNode = nextGallery;
        this.gallerySignature = nextSignature;
        if ('ResizeObserver' in window && nextGallery) {
          this.galleryResizeObserver = new ResizeObserver(() => {
            if (this.getGalleryMode() !== this.galleryMode) this.refreshGallery(true);
            else {
              this.thumbnailGallery?.update();
              this.mainGallery?.update();
            }
          });
          this.galleryResizeObserver.observe(nextGallery);
        }
        this.initializeGallery(activeMediaId || this.variant?.featured_media?.id ? String(activeMediaId || this.variant?.featured_media?.id) : null);
      });
    });
  }

  initializeAccordions() {
    this.querySelectorAll('[data-accordion-content]').forEach((content) => {
      const details = content.closest('details');
      const toggle = details?.querySelector('[data-accordion-toggle]');
      const update = () => {
        const maxHeight = Number(content.dataset.maxHeight || 240);
        const isOverflowing = content.scrollHeight > maxHeight + 1;
        details?.classList.toggle('product-accordion--overflowing', isOverflowing);
        if (toggle) {
          toggle.hidden = !isOverflowing;
          if (!isOverflowing) {
            content.classList.remove('is-expanded');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.textContent = 'View more';
          }
        }
      };
      toggle?.addEventListener('click', () => {
        const expanded = content.classList.toggle('is-expanded');
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.textContent = expanded ? 'View less' : 'View more';
      }, { signal: this.signal });
      details?.addEventListener('toggle', update, { signal: this.signal });
      requestAnimationFrame(update);
    });
  }

  async initializeRecommendations() {
    const targets = this.querySelectorAll('[data-product-recommendations][data-url], [data-complementary-recommendations][data-url]');
    for (const target of targets) {
      const isDesignMode = target.dataset.designMode === 'true' || Boolean(window.Shopify?.designMode);
      try {
        const response = await fetch(target.dataset.url, { signal: this.signal, headers: { Accept: 'text/html' } });
        if (!response.ok) throw new Error('Recommendations unavailable');
        const template = document.createElement('template');
        template.innerHTML = await response.text();
        const source = template.content.querySelector('[data-recommendation-source]');
        const list = source?.querySelector('ul');
        if (list?.querySelector('li')) {
          target.querySelector('[data-recommendation-list]')?.replaceWith(list);
          target.hidden = false;
          target.removeAttribute('aria-busy');
        }
        else if (isDesignMode) {
          target.hidden = false;
          target.removeAttribute('aria-busy');
        } else {
          target.remove();
        }
      } catch (error) {
        if (error.name === 'AbortError') continue;
        if (isDesignMode) {
          target.hidden = false;
          target.removeAttribute('aria-busy');
        } else {
          target.remove();
        }
      }
    }
  }

  async initializeRecentlyViewed() {
    const section = document.querySelector('[data-recently-viewed]');
    const handle = this.dataset.productHandle;
    if (!section || !handle) return;
    const storageKey = 'omniselle:recently-viewed';
    let handles = [];
    try { handles = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { handles = []; }
    handles = [handle, ...handles.filter((item) => item !== handle)].slice(0, 6);
    try { localStorage.setItem(storageKey, JSON.stringify(handles)); } catch { return; }
    const products = await Promise.all(handles.slice(1, Number(section.dataset.limit || 4) + 1).map(async (item) => {
      try {
        const response = await fetch(`/products/${encodeURIComponent(item)}.js`, { headers: { Accept: 'application/json' }, signal: this.signal });
        return response.ok ? response.json() : null;
      } catch { return null; }
    }));
    const visible = products.filter(Boolean);
    if (!visible.length) return;
    const list = section.querySelector('[data-recently-viewed-list]');
    if (!list) return;
    list.replaceChildren(...visible.map((product) => {
      const item = document.createElement('article');
      item.className = 'recently-viewed-products__item';
      const imageLink = document.createElement('a');
      imageLink.className = 'recently-viewed-products__image';
      imageLink.href = product.url;
      const image = document.createElement('img');
      image.src = product.featured_image || '';
      image.alt = product.title;
      image.loading = 'lazy';
      imageLink.append(image);
      const heading = document.createElement('h3');
      const titleLink = document.createElement('a');
      titleLink.href = product.url;
      titleLink.textContent = product.title;
      const price = document.createElement('span');
      price.textContent = product.price;
      heading.append(titleLink, price);
      item.append(imageLink, heading);
      return item;
    }));
    section.hidden = false;
  }

  onOptionChange() {
    const options = this.selectedOptions();
    const variant = this.variants.find((item) => item.options.every((value, index) => value === options[index]));
    this.updateOptionLabels();
    this.dispatch('product:option-change', { options, variant });
    this.updateOptionAvailability();
    if (variant) this.applyVariant(variant);
    else {
      this.variant = null;
      this.updateVariantState();
    }
  }

  selectedOptions() {
    return [...this.querySelectorAll('fieldset[data-option-position]')].map((group) => {
      const select = group.querySelector('select[data-product-option]');
      return select?.value || group.querySelector('input[data-product-option]:checked')?.value || '';
    });
  }

  updateOptionLabels() {
    this.querySelectorAll('fieldset[data-option-position]').forEach((group) => {
      const label = group.querySelector('[data-option-label]');
      const select = group.querySelector('select[data-product-option]');
      const selected = select || group.querySelector('input[data-product-option]:checked');
      if (label && selected) label.textContent = selected.value;
    });
  }

  updateOptionAvailability() {
    const selected = this.selectedOptions();
    this.querySelectorAll('fieldset[data-option-position]').forEach((group) => {
      const position = Number(group.dataset.optionPosition) - 1;
      const isPossible = (optionValue) => this.variants.some((variant) => variant.available && variant.options[position] === optionValue && variant.options.every((value, index) => index === position || !selected[index] || value === selected[index]));
      const select = group.querySelector('select[data-product-option]');
      if (select) {
        [...select.options].forEach((option) => { option.disabled = !isPossible(option.value) && !option.selected; });
        return;
      }
      group.querySelectorAll('input[data-product-option]').forEach((input) => {
        input.disabled = !isPossible(input.value) && !input.checked;
      });
    });
  }

  updateVariantState() {
    this.clearInventoryWarning();
    const available = Boolean(this.variant?.available);
    const id = this.querySelector('[data-variant-id]');
    if (id) id.value = this.variant?.id || '';
    const button = this.querySelector('[data-add-to-cart]');
    const label = this.querySelector('[data-add-to-cart-label]');
    if (button) button.disabled = !available;
    if (label) label.textContent = this.variant ? (available ? 'Add to cart' : 'Sold out') : 'Unavailable';
    const buyNow = this.querySelector('[data-buy-now]');
    const buyNowLabel = this.querySelector('[data-buy-now-label]');
    if (buyNow) buyNow.disabled = !available;
    if (buyNowLabel) buyNowLabel.textContent = this.variant ? (available ? 'Buy it now' : 'Sold out') : 'Unavailable';
    const stickyButton = this.querySelector('[data-sticky-cart-add]');
    const stickyLabel = this.querySelector('[data-sticky-cart-label]');
    const stickyVariant = this.querySelector('[data-sticky-cart-variant]');
    const stickyImage = this.querySelector('[data-sticky-cart-image]');
    if (stickyButton) stickyButton.disabled = !available;
    if (stickyLabel) stickyLabel.textContent = this.variant ? (available ? 'Add to cart' : 'Sold out') : 'Unavailable';
    if (stickyVariant) {
      const variantTitle = this.variant?.title || '';
      stickyVariant.textContent = variantTitle;
      stickyVariant.hidden = !variantTitle || variantTitle === 'Default Title';
    }
    if (stickyImage) {
      const variantImage = this.variant?.featured_image?.src || this.variant?.featured_media?.preview_image?.src;
      stickyImage.src = variantImage || stickyImage.dataset.fallbackSrc || stickyImage.src;
    }
    const inventory = this.querySelector('[data-inventory-message]');
    if (inventory) inventory.textContent = !this.variant ? 'Unavailable' : available ? (this.variant.inventory_management && this.variant.inventory_quantity > 0 && this.variant.inventory_quantity <= 10 ? `Only ${this.variant.inventory_quantity} left` : 'In stock') : 'Sold out';
    const onSale = Number(this.variant?.compare_at_price) > Number(this.variant?.price);
    this.querySelector('[data-product-badge-sale]')?.toggleAttribute('hidden', !onSale);
    this.querySelector('[data-product-badge-sold-out]')?.toggleAttribute('hidden', available);
    this.dispatch('product:variant-change', { variant: this.variant });
  }

  applyVariant(variant) {
    this.variant = variant;
    this.updateVariantState();
    this.updatePrice();
    this.updateSku();
    this.updateQuantityRules();
    if (variant.featured_media?.id) this.showMedia(String(variant.featured_media.id));
    this.loadPickupAvailability();
    if (this.dataset.updateUrl !== 'false') {
      const url = new URL(this.dataset.productUrl, window.location.origin);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    }
  }

  updatePrice() {
    if (!this.variant) return;
    const price = this.querySelector("[data-price]");
    const comparePrice = this.querySelector("[data-compare-price]");
    const saleBadge = this.querySelector("[data-sale-badge]");
    const saleBadgeValue = this.querySelector("[data-sale-badge-value]");
    if (price) price.textContent = this.formatPrice(this.variant.price);
    const stickyPrice = this.querySelector('[data-sticky-cart-price]');
    const stickyComparePrice = this.querySelector('[data-sticky-cart-compare-price]');
    const stickyPrices = this.querySelector('[data-sticky-cart-prices]');
    if (stickyPrice) stickyPrice.textContent = this.formatPrice(this.variant.price);
    const onSale = Number(this.variant.compare_at_price) > Number(this.variant.price);
    stickyPrices?.classList.toggle('is-sale', onSale);
    if (stickyComparePrice) {
      stickyComparePrice.textContent = onSale ? this.formatPrice(this.variant.compare_at_price) : '';
      stickyComparePrice.hidden = !onSale;
    }
    this.querySelector("[data-product-price]")?.classList.toggle("product-price--sale", onSale);
    if (saleBadge) {
      saleBadge.hidden = !onSale;
      if (onSale && saleBadgeValue) {
        const discountAmount = Number(this.variant.compare_at_price) - Number(this.variant.price);
        const showPercentage = saleBadge.dataset.discountMode === "true";
        saleBadgeValue.textContent = showPercentage
          ? `${Math.round((discountAmount * 100) / Number(this.variant.compare_at_price))}% OFF`
          : `${this.formatPrice(discountAmount)} OFF`;
      }
    }
    if (comparePrice) {
      comparePrice.textContent = onSale ? this.formatPrice(this.variant.compare_at_price) : "";
      comparePrice.classList.toggle("is-hidden", !onSale);
    }
  }

  updateSku() {
    const sku = this.querySelector('[data-product-sku]');
    if (!sku) return;
    sku.textContent = this.variant?.sku || '';
    sku.hidden = !this.variant?.sku;
  }

  updateQuantityRules() {
    const input = this.querySelector('[data-quantity-input]');
    if (!input || !this.variant) return;
    const rules = this.variant.quantity_rule || {};
    input.min = rules.min || 1;
    input.step = rules.increment || 1;
    if (rules.max) input.max = rules.max;
    else input.removeAttribute('max');
    this.normalizeQuantity();
  }

  formatMoney(amount) {
    return new Intl.NumberFormat(document.documentElement.lang || 'en', {
      style: 'currency',
      currency: this.dataset.currency || "USD",
      currencyDisplay: "symbol",
    }).format(Number(amount || 0) / 100);
  }

  formatPrice(amount) {
    const money = this.formatMoney(amount);
    return this.dataset.showCurrencyCode === "true" ? `${money} ${this.dataset.currency || "USD"}` : money;
  }

  resolveFromUrl() {
    const variantId = new URL(window.location.href).searchParams.get('variant');
    const variant = this.variants.find((item) => String(item.id) === String(variantId));
    if (variant && String(variant.id) !== String(this.variant?.id)) this.applyVariant(variant);
  }

  showMedia(mediaId, instant = false) {
    if (!this.mainGallery) return;
    const slide = Array.from(this.mainGallery.slides || []).find((candidate) => String(candidate.dataset.mediaId) === String(mediaId));
    const realIndex = Number.parseInt(slide?.dataset.swiperSlideIndex, 10);
    if (Number.isFinite(realIndex) && typeof this.mainGallery.slideToLoop === 'function') {
      this.mainGallery.slideToLoop(realIndex, instant ? 0 : undefined);
      return;
    }
    const index = Array.from(this.mainGallery.slides || []).findIndex((candidate) => String(candidate.dataset.mediaId) === String(mediaId));
    if (index >= 0) this.mainGallery.slideTo(index, instant ? 0 : undefined);
  }

  async loadPickupAvailability() {
    const container = this.querySelector('[data-pickup-availability]');
    if (!container || !this.variant?.id) return;
    container.dataset.variantId = this.variant.id;
    try {
      const url = new URL(`/variants/${this.variant.id}`, window.location.origin);
      url.searchParams.set('section_id', 'pickup-availability');
      const response = await fetch(url, { signal: this.signal });
      if (!response.ok) return;
      container.innerHTML = await response.text();
    } catch (error) { if (error.name !== 'AbortError') container.replaceChildren(); }
  }

  changeQuantity(delta) {
    const input = this.querySelector('[data-quantity-input]');
    if (!input) return;
    input.value = Number(input.value || input.min || 1) + delta * Number(input.step || 1);
    this.normalizeQuantity();
  }

  normalizeQuantity() {
    const input = this.querySelector('[data-quantity-input]');
    if (!input) return;
    const min = Number(input.min || 1), max = input.max ? Number(input.max) : Infinity, increment = Number(input.step || 1);
    const raw = Math.max(min, Math.min(max, Number(input.value) || min));
    input.value = min + Math.round((raw - min) / increment) * increment;
    this.clearInventoryWarning();
    this.dispatch('product:quantity-change', { quantity: Number(input.value) });
  }

  restoreQuantity() {
    if (!this.dataset.restoreQuantity) return;
    const input = this.querySelector('[data-quantity-input]');
    if (!input) return;
    input.value = this.dataset.restoreQuantity;
    this.normalizeQuantity();
    delete this.dataset.restoreQuantity;
  }

  async addToCart(event, sourceButton = null) {
    event?.preventDefault();
    if (!this.variant?.available || !this.form) return;
    this.normalizeQuantity();
    const primaryButton = this.querySelector('[data-add-to-cart]');
    const buttons = [...new Set([primaryButton, sourceButton].filter(Boolean))];
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
    });
    this.clearInventoryWarning();
    this.setStatus('Adding to cart…');
    this.dispatch('product:add:start', { variant: this.variant });
    try {
      const response = await fetch(window.routes?.cart_add_url || '/cart/add.js', { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: new FormData(this.form), signal: this.signal });
      const item = await response.json();
      if (!response.ok) {
        const error = new Error(item.description || item.message || 'Unable to add this item to your cart.');
        error.payload = item;
        error.status = response.status;
        error.url = response.url;
        throw error;
      }
      this.setStatus('');
      buttons.forEach((button) => this.showAddedState(button));
      let cart = null;
      try { cart = await this.refreshCartCount(); } catch { /* Cart count refresh is non-blocking after a successful add. */ }
      document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true, detail: { item, cart } }));
      const featuredImage = [...this.querySelectorAll('[data-media-id] img')].find((candidate) => candidate.closest('[data-media-id]')?.dataset.mediaId === String(this.variant?.featured_media?.id) && candidate.getBoundingClientRect().width > 0)
        || [...this.querySelectorAll('.product-gallery__main img, .product-gallery__desktop img, .product-gallery__desktop-main img')].find((candidate) => candidate.getBoundingClientRect().width > 0);
      this.dispatch('product:add:success', { item, cart, button: sourceButton || primaryButton, image: featuredImage, imageUrl: featuredImage?.currentSrc || featuredImage?.src });
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[Omniselle] Add to cart failed', {
        error,
        variantId: this.variant?.id,
        payload: error.payload || null,
      });
      const availableQuantity = await this.resolveAvailableStock(error.payload);
      if (availableQuantity !== null) this.showInventoryWarning(availableQuantity);
      this.setStatus(error.message, true);
      this.dispatch('product:add:error', { error, availableQuantity });
    } finally {
      buttons.forEach((button) => {
        button.classList.remove('is-loading');
        button.removeAttribute('aria-busy');
        if (this.isConnected) button.disabled = button.classList.contains('is-added') || !this.variant?.available;
      });
    }
  }

  showAddedState(button) {
    const label = button?.querySelector('[data-add-to-cart-label]');
    if (!button) return;
    button.disabled = true;
    if (label) {
      label.dataset.defaultText ||= label.textContent;
      label.textContent = label.dataset.addToCartAddedLabel || 'Added';
    }
    button.classList.add('is-added');
    clearTimeout(this.addedStateTimer);
    this.addedStateTimer = setTimeout(() => {
      button.classList.remove('is-added');
      if (label?.dataset.defaultText) label.textContent = label.dataset.defaultText;
      if (this.isConnected) button.disabled = !this.variant?.available;
    }, 1800);
  }

  async refreshCartCount() {
    const response = await fetch('/cart.js', { headers: { Accept: 'application/json' }, signal: this.signal });
    if (!response.ok) throw new Error('Cart count unavailable');
    const cart = await response.json();
    document.querySelectorAll('.header__cart').forEach((cartLink) => {
      const count = cartLink.querySelector('.header__cart-count');
      if (cart.item_count > 0) {
        const nextCount = count || document.createElement('span');
        nextCount.className = 'header__cart-count';
        nextCount.setAttribute('aria-label', `Cart contains ${cart.item_count} items`);
        nextCount.textContent = cart.item_count;
        if (!count) cartLink.append(nextCount);
        nextCount.classList.remove('is-updated');
        requestAnimationFrame(() => nextCount.classList.add('is-updated'));
      } else count?.remove();
    });
    return cart;
  }

  async buyNow() {
    if (!this.variant?.available || !this.form) return;
    this.normalizeQuantity();
    const button = this.querySelector('[data-buy-now]');
    button.disabled = true;
    this.clearInventoryWarning();
    this.setStatus('Preparing checkout…');
    try {
      const response = await fetch(window.routes?.cart_add_url || '/cart/add.js', { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: new FormData(this.form), signal: this.signal });
      const item = await response.json();
      if (!response.ok) {
        const error = new Error(item.description || item.message || 'Unable to start checkout.');
        error.payload = item;
        error.status = response.status;
        error.url = response.url;
        throw error;
      }
      window.location.assign('/checkout');
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[Omniselle] Buy now failed', {
        error,
        variantId: this.variant?.id,
        payload: error.payload || null,
      });
      const availableQuantity = await this.resolveAvailableStock(error.payload);
      if (availableQuantity !== null) this.showInventoryWarning(availableQuantity);
      this.setStatus(error.message, true);
      if (this.isConnected) button.disabled = false;
    }
  }

  async resolveAvailableStock(payload = {}) {
    const message = [payload.description, payload.message].filter(Boolean).join(' ');
    const inventoryError = /stock|inventory|only\s+(?:add\s+)?\d+|can't add more|cannot add more/i.test(message);
    if (!inventoryError) return null;

    const match = message.match(/only\s+(?:add\s+)?(\d+)/i)
      || message.match(/(\d+)\s+(?:items?\s+)?available/i);
    if (match) return Number(match[1]);

    const inventoryQuantity = Number(this.variant?.inventory_quantity);
    const tracksInventory = Boolean(this.variant?.inventory_management)
      && this.variant?.inventory_policy !== 'continue'
      && Number.isFinite(inventoryQuantity);
    if (!tracksInventory) return null;

    try {
      const response = await fetch('/cart.js', { headers: { Accept: 'application/json' }, signal: this.signal });
      if (!response.ok) return Math.max(0, inventoryQuantity);
      const cart = await response.json();
      const quantityInCart = cart.items
        .filter((item) => String(item.variant_id || item.id) === String(this.variant.id))
        .reduce((total, item) => total + Number(item.quantity || 0), 0);
      return Math.max(0, inventoryQuantity - quantityInCart);
    } catch (error) {
      if (error.name === 'AbortError') return null;
      return Math.max(0, inventoryQuantity);
    }
  }

  showInventoryWarning(count) {
    if (!this.inventoryWarning || !Number.isFinite(Number(count))) return;
    const quantity = Math.max(0, Number(count));
    const template = quantity === 1
      ? this.inventoryWarning.dataset.messageOne
      : this.inventoryWarning.dataset.messageOther;
    this.inventoryWarning.textContent = (template || 'Only [count] items available in stock').replace('[count]', quantity);
    this.inventoryWarning.hidden = false;
  }

  clearInventoryWarning() {
    if (!this.inventoryWarning) return;
    this.inventoryWarning.textContent = '';
    this.inventoryWarning.hidden = true;
  }

  setStatus(message, error = false) { if (this.status) { this.status.textContent = message; this.status.dataset.error = error; } }
  dispatch(name, detail) { this.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: { productId: this.dataset.productId, sectionId: this.sectionId, ...detail } })); }
}

if (!customElements.get('product-page')) customElements.define('product-page', ProductPage);
