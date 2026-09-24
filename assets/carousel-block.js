import { EffectFade, Pagination } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const instances = new WeakMap();
const desktopBreakpoint = 768;

const number = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const bindCarouselAutoplay = (swiper, root, delay, pauseOnHover) => {
  if (!swiper || swiper.destroyed || prefersReducedMotion()) return () => {};

  const interval = window.setInterval(() => {
    if (
      document.hidden ||
      swiper.destroyed ||
      swiper.isLocked ||
      (pauseOnHover && swiper.wrapperEl?.matches(':hover')) ||
      root.contains(document.activeElement)
    ) return;

    swiper.isEnd ? swiper.slideTo(0) : swiper.slideNext();
  }, Math.min(60000, Math.max(1000, number(delay, 4000))));

  return () => window.clearInterval(interval);
};

const bindRevealAutoplay = (state, root, delay, pauseOnHover) => {
  if (!state || prefersReducedMotion()) return () => {};

  const interval = window.setInterval(() => {
    if (
      document.hidden ||
      (pauseOnHover && root.matches(':hover')) ||
      root.contains(document.activeElement)
    ) return;

    state.goTo(state.currentIndex + 1);
  }, Math.min(60000, Math.max(1000, number(delay, 4000))));

  return () => window.clearInterval(interval);
};

const initializeReveal = (root) => {
  const slides = Array.from(root.querySelectorAll('[data-carousel-slide]'));
  if (!slides.length) return;

  const buttons = Array.from(root.querySelectorAll('[data-carousel-pagination-button]'));
  const wrapper = root.querySelector('.reveal-carousel__wrapper');
  const controller = new AbortController();
  let dragSession = null;
  const state = {
    reveal: true,
    slides,
    buttons,
    currentIndex: 0,
    visibleIndex: 0,
    isAnimating: false,
    queuedIndex: null,
    destroyed: false,
    slideAnimation: null,
    suppressClick: false,
    goTo: () => {},
    revealCleanup: () => {
      state.destroyed = true;
      state.queuedIndex = null;
      resetDrag();
      state.suppressClick = false;
      controller.abort();
      state.slideAnimation?.cancel();
      state.slideAnimation = null;
    }
  };

  buttons.forEach((button, buttonIndex) => {
    const slide = slides[buttonIndex];
    const template = slide?.querySelector('[data-carousel-pagination-template]');
    if (template && !button.querySelector('.press-quotes__pagination-media')) {
      button.append(template.content.cloneNode(true));
    }

    const media = button.querySelector('.press-quotes__pagination-media');
    const imageRatio = slide?.dataset.pressImageRatio;
    const imageRadius = slide?.dataset.pressImageRadius;
    if (media && imageRatio) media.style.setProperty('--press-quotes-image-ratio', imageRatio);
    if (media && imageRadius) media.style.setProperty('--press-quotes-image-radius', imageRadius);

    const desktopWidth = slide?.dataset.pressImageWidthDesktop;
    const mobileWidth = slide?.dataset.pressImageWidthMobile;
    if (desktopWidth) button.style.setProperty('--press-quotes-image-width', `${desktopWidth}px`);
    if (mobileWidth) button.style.setProperty('--press-quotes-image-width-mobile', `${mobileWidth}px`);
  });

  const normalizeIndex = (index) => {
    const nextIndex = number(index, 0);
    return ((nextIndex % slides.length) + slides.length) % slides.length;
  };

  const updatePagination = (index) => {
    buttons.forEach((button, buttonIndex) => {
      const isSelected = buttonIndex === index;
      button.setAttribute('aria-current', String(isSelected));
      button.classList.toggle('is-selected', isSelected);
    });
  };

  const centerPaginationButton = (index, behavior = 'smooth') => {
    const button = buttons[index];
    const pagination = button?.closest('.reveal-carousel__pagination, .press-quotes__pagination');
    if (!button || !pagination || pagination.scrollWidth <= pagination.clientWidth) return;

    window.requestAnimationFrame(() => {
      if (state.currentIndex !== index) return;
      const paginationRect = pagination.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const targetLeft = pagination.scrollLeft
        + buttonRect.left
        - paginationRect.left
        - (pagination.clientWidth - buttonRect.width) / 2;
      const maxScrollLeft = pagination.scrollWidth - pagination.clientWidth;
      const left = Math.min(maxScrollLeft, Math.max(0, targetLeft));

      if (typeof pagination.scrollTo === 'function') {
        pagination.scrollTo({ left, behavior });
      } else {
        pagination.scrollLeft = left;
      }
    });
  };

  const resetDrag = () => {
    wrapper?.classList.remove('is-dragging');
    root.classList.remove('reveal-carousel--dragging');
    dragSession = null;
  };

  const clearSlideStyles = (slide) => {
    slide?.style.removeProperty('opacity');
    slide?.style.removeProperty('transform');
  };

  const cancelSlideAnimation = () => {
    state.slideAnimation?.cancel();
    state.slideAnimation = null;
  };

  const updateLayout = (index, { alignPagination = true, behavior = 'smooth' } = {}) => {
    const previousIndex = state.currentIndex;
    state.currentIndex = index;
    state.visibleIndex = index;

    slides.forEach((slide, slideIndex) => {
      const isSelected = slideIndex === index;
      slide.classList.toggle('is-selected', isSelected);
      slide.setAttribute('aria-hidden', String(!isSelected));
    });
    updatePagination(index);
    root.classList.add('reveal-initialized');
    if (alignPagination) centerPaginationButton(index, behavior);

    root.dispatchEvent(new CustomEvent('reveal-carousel:select', {
      detail: { index, cell: slides[index] }
    }));
    root.dispatchEvent(new CustomEvent('reveal-carousel:change', {
      detail: {
        index,
        cell: slides[index],
        direction: index > previousIndex ? 'next' : 'previous'
      }
    }));
  };

  const animateElement = async (slide, keyframes, options) => {
    const animation = slide.animate(keyframes, options);
    state.slideAnimation = animation;

    try {
      await animation.finished;
      return true;
    } catch {
      return false;
    } finally {
      if (state.slideAnimation === animation) state.slideAnimation = null;
    }
  };

  const animateSlideTransition = async (
    nextIndex,
    { immediate = false, alignPagination = true } = {}
  ) => {
    const currentSlide = slides[state.visibleIndex];
    const nextSlide = slides[nextIndex];

    if (!currentSlide || !nextSlide || currentSlide === nextSlide) {
      updateLayout(nextIndex, {
        alignPagination,
        behavior: immediate || prefersReducedMotion() ? 'auto' : 'smooth'
      });
      return;
    }

    if (
      immediate ||
      prefersReducedMotion() ||
      slides.length < 2 ||
      typeof currentSlide.animate !== 'function' ||
      typeof nextSlide.animate !== 'function'
    ) {
      cancelSlideAnimation();
      clearSlideStyles(currentSlide);
      clearSlideStyles(nextSlide);
      updateLayout(nextIndex, { alignPagination, behavior: 'auto' });
      return;
    }

    state.isAnimating = true;

    try {
      const didExit = await animateElement(
        currentSlide,
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-10px)' }
        ],
        {
          duration: 250,
          easing: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
          fill: 'forwards'
        }
      );

      if (!didExit || state.destroyed) return;

      updateLayout(nextIndex, { alignPagination, behavior: 'smooth' });
      clearSlideStyles(currentSlide);

      const didEnter = await animateElement(
        nextSlide,
        [
          { opacity: 0, transform: 'translateY(10px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        {
          duration: 400,
          easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
          fill: 'forwards'
        }
      );

      if (!didEnter || state.destroyed) return;
      clearSlideStyles(nextSlide);
    } finally {
      state.isAnimating = false;

      if (!state.destroyed && state.queuedIndex !== null && state.queuedIndex !== state.currentIndex) {
        const queuedIndex = state.queuedIndex;
        state.queuedIndex = null;
        await animateSlideTransition(queuedIndex);
      } else {
        state.queuedIndex = null;
      }
    }

    if (!state.destroyed) {
      root.dispatchEvent(new CustomEvent('reveal-carousel:settle', {
        detail: { index: nextIndex, cell: nextSlide }
      }));
    }
  };

  state.goTo = (index, options = {}) => {
    const nextIndex = normalizeIndex(index);
    if (state.isAnimating) {
      state.queuedIndex = nextIndex;
      return;
    }

    return animateSlideTransition(nextIndex, options);
  };

  buttons.forEach((button, buttonIndex) => {
    button.addEventListener('click', () => state.goTo(buttonIndex), { signal: controller.signal });
    button.addEventListener('keydown', (event) => {
      let nextIndex = null;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = buttonIndex - 1;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = buttonIndex + 1;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = buttons.length - 1;
      if (nextIndex === null) return;

      event.preventDefault();
      state.goTo(nextIndex);
      buttons[normalizeIndex(nextIndex)]?.focus();
    }, { signal: controller.signal });
  });

  if (wrapper && slides.length > 1) {
    const fastDragDuration = 320;
    const fastDragVelocity = 0.15;
    const dragCommitDistance = () => Math.max(36, Math.min(72, wrapper.clientWidth * 0.08 || 48));
    const isInteractiveTarget = (target) => target?.closest?.('a, button, input, textarea, select, [contenteditable="true"]');
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    wrapper.addEventListener('pointerdown', (event) => {
      if (!event.isPrimary || event.button !== 0 || isInteractiveTarget(event.target)) return;

      dragSession = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: now(),
        active: false,
        cancelled: false
      };
    }, { signal: controller.signal });

    window.addEventListener('pointermove', (event) => {
      if (!dragSession || event.pointerId !== dragSession.pointerId) return;

      const deltaX = event.clientX - dragSession.startX;
      const deltaY = event.clientY - dragSession.startY;
      if (dragSession.active || dragSession.cancelled) {
        if (dragSession.active) event.preventDefault();
        return;
      }

      const elapsed = now() - dragSession.startedAt;
      const distance = Math.abs(deltaX);
      if (distance < dragCommitDistance()) {
        if (elapsed > fastDragDuration) dragSession.cancelled = true;
        return;
      }

      if (
        Math.abs(deltaY) >= distance ||
        elapsed > fastDragDuration ||
        distance / Math.max(elapsed, 1) < fastDragVelocity
      ) {
        dragSession.cancelled = true;
        return;
      }

      dragSession.active = true;
      wrapper.classList.add('is-dragging');
      root.classList.add('reveal-carousel--dragging');
      event.preventDefault();
    }, { passive: false, signal: controller.signal });

    window.addEventListener('pointerup', (event) => {
      if (!dragSession || event.pointerId !== dragSession.pointerId) return;

      const deltaX = event.clientX - dragSession.startX;
      const shouldChange = dragSession.active && Math.abs(deltaX) >= dragCommitDistance();
      resetDrag();
      if (!shouldChange) return;

      state.suppressClick = true;
      window.setTimeout(() => {
        state.suppressClick = false;
      }, 0);
      state.goTo(state.currentIndex + (deltaX < 0 ? 1 : -1));
    }, { signal: controller.signal });

    window.addEventListener('pointercancel', resetDrag, { signal: controller.signal });
    wrapper.addEventListener('click', (event) => {
      if (!state.suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      state.suppressClick = false;
    }, { capture: true, signal: controller.signal });
  }

  updateLayout(0, { behavior: 'auto' });
  instances.set(root, state);

  const autoplay = root.dataset.swiperAutoplay === 'true';
  state.autoplayCleanup = autoplay
    ? bindRevealAutoplay(
        state,
        root,
        number(root.dataset.swiperAutoplayDelay, 4000),
        root.dataset.swiperAutoplayPauseOnHover !== 'false'
      )
    : null;
};

const initialize = (root) => {
  if (!root || instances.has(root)) return;
  if (root.dataset.carouselMode === 'reveal') return initializeReveal(root);

  const viewport = root.querySelector('[data-swiper-carousel]');
  const wrapper = viewport?.querySelector('.swiper-wrapper');
  if (!viewport || !wrapper) return;

  const pagination = viewport.querySelector('.swiper-pagination');
  const showDesktop = root.dataset.swiperPaginationDesktop === 'true';
  const showMobile = root.dataset.swiperPaginationMobile === 'true';
  if (pagination) {
    pagination.dataset.paginationVisibleDesktop = String(showDesktop);
    pagination.dataset.paginationVisibleMobile = String(showMobile);
  }

  const paginationType = root.dataset.swiperPaginationType === 'progress_bar' ? 'progressbar' : 'bullets';
  const autoplay = root.dataset.swiperAutoplay === 'true';
  const fractionControls = root.dataset.carouselControlsStyle === 'fraction';
  const loop = root.dataset.carouselLoop === 'true';
  const showNextSlidePreview = viewport.dataset.swiperNextSlidePreview === 'true';
  const transition = root.dataset.transition === 'fade' ? 'fade' : 'slide';
  const fade = transition === 'fade' && !showNextSlidePreview;
  const paginationModules = pagination ? [Pagination] : [];
  const modules = fade ? [EffectFade, ...paginationModules] : paginationModules;
  const options = {
    loop,
    effect: fade ? 'fade' : 'slide',
    ...(fade ? { fadeEffect: { crossFade: true } } : {}),
    preventInteractionOnTransition: true,
    speed: prefersReducedMotion() ? 0 : 600,
    slidesPerView: number(root.dataset.swiperColumnsMobile, 1),
    spaceBetween: number(root.dataset.swiperGapMobile, 12),
    breakpoints: {
      [desktopBreakpoint]: {
        slidesPerView: number(root.dataset.swiperColumnsDesktop, 4),
        spaceBetween: number(root.dataset.swiperGapDesktop, 16),
        ...(showNextSlidePreview ? { centeredSlides: true, spaceBetween: 24 } : {})
      }
    },
    controls: {
      scope: root,
      previous: fractionControls ? '[data-carousel-fraction-previous]' : '[data-carousel-previous]',
      next: fractionControls ? '[data-carousel-fraction-next]' : '[data-carousel-next]'
    },
    ...(modules.length ? { modules } : {}),
    ...(pagination ? { pagination: { el: pagination, type: paginationType, clickable: paginationType === 'bullets' } } : {})
  };

  const swiper = createSwiperCarousel(viewport, options);
  if (!swiper) return;
  const testimonialItem = root.querySelector('.testimonial-item');
  let testimonialGapCleanup = null;
  if (testimonialItem) {
    const syncTestimonialGap = () => {
      const styles = window.getComputedStyle(testimonialItem);
      const gap = Number.parseFloat(styles.getPropertyValue('--testimonial-gap-desktop'));
      if (Number.isFinite(gap)) root.style.setProperty('--testimonial-controls-gap-half', `${gap / 2}px`);
    };
    syncTestimonialGap();
    window.addEventListener('resize', syncTestimonialGap);
    testimonialGapCleanup = () => window.removeEventListener('resize', syncTestimonialGap);
  }
  const updateLockedState = () => {
    if (!swiper.destroyed) root.classList.toggle('carousel-block--locked', Boolean(swiper.isLocked));
  };
  swiper.on('resize breakpoint update observerUpdate', updateLockedState);
  updateLockedState();
  const lockedCleanup = () => swiper.off('resize breakpoint update observerUpdate', updateLockedState);
  const notifySlideChange = () => {
    document.dispatchEvent(new CustomEvent('theme:carousel:slidechange', { detail: { root } }));
  };
  swiper.on('slideChange', notifySlideChange);
  const slideChangeCleanup = () => swiper.off('slideChange', notifySlideChange);
  let fractionCleanup = null;
  if (fractionControls) {
    const current = root.querySelector('[data-carousel-fraction-current]');
    const total = root.querySelector('[data-carousel-fraction-total]');
    const updateFraction = () => {
      if (swiper.destroyed) return;
      const realSlides = swiper.slides.filter((slide) => !slide.classList.contains('swiper-slide-duplicate'));
      const slideCount = loop ? realSlides.length : swiper.slides.length;
      const currentIndex = loop ? swiper.realIndex + 1 : swiper.activeIndex + 1;
      if (current) current.textContent = String(currentIndex);
      if (total) total.textContent = String(slideCount);
    };
    swiper.on('init slideChange update', updateFraction);
    updateFraction();
    fractionCleanup = () => swiper.off('init slideChange update', updateFraction);
  }
  const state = {
    swiper,
    testimonialGapCleanup,
    lockedCleanup,
    slideChangeCleanup,
    fractionCleanup,
    autoplayCleanup: autoplay
      ? bindCarouselAutoplay(
          swiper,
          root,
          number(root.dataset.swiperAutoplayDelay, 4000),
          root.dataset.swiperAutoplayPauseOnHover !== 'false'
        )
      : null
  };
  instances.set(root, state);
};

const destroy = (root) => {
  const state = instances.get(root);
  if (!state) return;
  state.autoplayCleanup?.();
  state.testimonialGapCleanup?.();
  state.lockedCleanup?.();
  state.slideChangeCleanup?.();
  state.fractionCleanup?.();
  state.revealCleanup?.();
  if (state.swiper) destroySwiperCarousel(state.swiper);
  instances.delete(root);
};

const initializeRoot = (root = document, refreshExisting = false) => {
  const initializeOrRefresh = (carouselRoot) => {
    if (!refreshExisting || !instances.has(carouselRoot)) {
      initialize(carouselRoot);
      return;
    }

    const state = instances.get(carouselRoot);
    if (state?.swiper && !state.swiper.destroyed) state.swiper.update();
  };

  if (root.matches?.('[data-carousel-block]')) initializeOrRefresh(root);
  root.querySelectorAll?.('[data-carousel-block]').forEach(initializeOrRefresh);
};
const destroyRoot = (root) => {
  if (root.matches?.('[data-carousel-block]')) destroy(root);
  root.querySelectorAll?.('[data-carousel-block]').forEach(destroy);
};

document.addEventListener('shopify:section:load', (event) => initializeRoot(event.target));
document.addEventListener('shopify:section:select', (event) => initializeRoot(event.target, true));
document.addEventListener('shopify:section:unload', (event) => destroyRoot(event.target));
document.addEventListener('shopify:block:select', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const root = target?.closest('[data-carousel-block]');
  if (!root) return initializeRoot(target || event.target);

  initialize(root);
  const state = instances.get(root);
  const slide = target.closest('.carousel-slide, .testimonial-item, .press-item, .product-callout');
  const paginationButton = target.closest('[data-carousel-pagination-button]');
  if (!state) return;

  if (state.reveal) {
    const index = paginationButton
      ? number(paginationButton.dataset.carouselPaginationIndex, -1)
      : state.slides.indexOf(slide);
    if (index >= 0) state.goTo(index, { immediate: Boolean(event.detail?.load) });
    return;
  }

  if (!slide) return;
  const index = Array.from(state.swiper?.slides || []).indexOf(slide);
  if (index < 0 || !state.swiper || state.swiper.destroyed) return;

  const duration = event.detail?.load || prefersReducedMotion() ? 0 : state.swiper.params.speed;
  if (state.swiper.params.loop && typeof state.swiper.slideToLoop === 'function') {
    const realIndex = number(slide.dataset.swiperSlideIndex, index);
    state.swiper.slideToLoop(realIndex, duration);
    return;
  }

  state.swiper.slideTo(index, duration);
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initializeRoot(), { once: true });
else initializeRoot();
