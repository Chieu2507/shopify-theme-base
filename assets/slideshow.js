import { EffectFade, Pagination } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const states = new WeakMap();
const selector = '[data-slideshow]';
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isVisible = (element) => element.getClientRects().length > 0;
const slideSelector = '[data-slideshow-slide]';

const createSlideClone = (slide, sourceIndex, position) => {
  const clone = slide.cloneNode(true);
  clone.removeAttribute('id');
  clone.removeAttribute('data-slideshow-slide');
  clone.setAttribute('aria-hidden', 'true');
  clone.setAttribute('data-slideshow-clone', position);
  clone.setAttribute('data-slideshow-clone-source', String(sourceIndex));
  clone.classList.remove('swiper-slide-active', 'swiper-slide-next', 'swiper-slide-prev', 'swiper-slide-visible', 'swiper-slide-fully-visible');
  clone.classList.add('swiper-slide-clone');
  clone.querySelectorAll('[id], [data-shopify-editor-block], [data-shopify-editor-block-id], [data-shopify-editor-block-type]').forEach((element) => {
    element.removeAttribute('id');
    element.removeAttribute('data-shopify-editor-block');
    element.removeAttribute('data-shopify-editor-block-id');
    element.removeAttribute('data-shopify-editor-block-type');
  });
  clone.querySelectorAll('a, button, input, select, textarea, summary, video').forEach((element) => {
    element.setAttribute('tabindex', '-1');
    element.setAttribute('aria-hidden', 'true');
  });
  if ('inert' in clone) clone.inert = true;
  return clone;
};

const createTwoSlideLoop = (carousel) => {
  const wrapper = carousel.querySelector('.swiper-wrapper');
  const slides = wrapper ? [...wrapper.querySelectorAll(`:scope > ${slideSelector}`)] : [];
  if (slides.length !== 2) return null;

  // Swiper 12's loop rearranges original slides; it does not make duplicate
  // nodes. A centered, two-slide carousel needs one physical slide on either
  // side, so add inert clones to the Swiper track itself. The active index is
  // reset to the matching original after a clone is reached.
  const previousClone = createSlideClone(slides[1], 1, 'previous');
  const nextClone = createSlideClone(slides[0], 0, 'next');
  wrapper.prepend(previousClone);
  wrapper.append(nextClone);

  return {
    initialSlide: 1,
    logicalIndex: (activeIndex) => (activeIndex === 0 || activeIndex === 2 ? 1 : 0),
    originalIndex: (logicalIndex) => logicalIndex + 1,
    restore(swiper) {
      if (swiper.destroyed) return;
      if (swiper.activeIndex === 0) swiper.slideTo(2, 0, false);
      if (swiper.activeIndex === 3) swiper.slideTo(1, 0, false);
    },
    destroy() {
      previousClone.remove();
      nextClone.remove();
    },
  };
};

const updateParallax = (root) => {
  if (reducedMotion()) return;
  root.querySelectorAll(`.swiper-wrapper > ${slideSelector}`).forEach((slide) => {
    const media = slide.querySelector('[data-slideshow-media]');
    const effect = slide.dataset.parallax;
    if (!media || !effect || effect === 'none') return;
    const bounds = slide.getBoundingClientRect();
    const progress = Math.max(-1, Math.min(1, ((window.innerHeight / 2) - (bounds.top + (bounds.height / 2))) / Math.max(bounds.height, 1)));
    if (effect === 'vertical') media.style.transform = `translate3d(0, ${Math.round(progress * 32)}px, 0) scale(1.08)`;
    if (effect === 'horizontal') media.style.transform = `translate3d(${Math.round(progress * 32)}px, 0, 0) scale(1.08)`;
    if (effect === 'zoom') media.style.transform = `scale(${(1.04 + Math.abs(progress) * 0.08).toFixed(3)})`;
  });
};

const paginationOptions = (root) => {
  const element = root.querySelector('[data-slideshow-pagination]');
  if (!element) return {};
  const type = element.dataset.paginationType;
  const paginationType = type === 'progress_bar' ? 'progressbar' : type === 'numbers' ? 'fraction' : 'bullets';
  return {
    pagination: {
      el: element,
      type: paginationType,
      clickable: paginationType === 'bullets',
      renderFraction: type === 'numbers'
        ? (currentClass, totalClass) => `<span class="${currentClass}"></span><span class="slideshow__pagination-separator" aria-hidden="true"> / </span><span class="${totalClass}"></span>`
        : undefined,
    },
  };
};

const createTwoSlidePagination = (root, swiper, loop) => {
  const element = root.querySelector('[data-slideshow-pagination]');
  if (!element || !loop) return null;
  const type = element.dataset.paginationType;
  const controller = new AbortController();
  const update = () => {
    const current = loop.logicalIndex(swiper.activeIndex);
    if (type === 'numbers') {
      element.innerHTML = `<span class="swiper-pagination-current">${current + 1}</span><span class="slideshow__pagination-separator" aria-hidden="true"> / </span><span class="swiper-pagination-total">2</span>`;
    } else if (type === 'progress_bar') {
      element.innerHTML = '<span class="swiper-pagination-progressbar-fill"></span>';
      const fill = element.querySelector('.swiper-pagination-progressbar-fill');
      if (fill) fill.style.transform = `translate3d(0,0,0) scaleX(${current + 1 === 2 ? 1 : 0.5})`;
    } else {
      element.querySelectorAll('[data-slideshow-pagination-index]').forEach((bullet) => {
        bullet.classList.toggle('swiper-pagination-bullet-active', Number(bullet.dataset.slideshowPaginationIndex) === current);
      });
    }
  };

  if (type === 'bullets') {
    element.innerHTML = [0, 1].map((index) => `<button class="swiper-pagination-bullet" type="button" data-slideshow-pagination-index="${index}" aria-label="Go to slide ${index + 1}"></button>`).join('');
    element.addEventListener('click', (event) => {
      const bullet = event.target.closest('[data-slideshow-pagination-index]');
      if (!bullet) return;
      event.preventDefault();
      swiper.slideTo(loop.originalIndex(Number(bullet.dataset.slideshowPaginationIndex)));
    }, { signal: controller.signal });
  }
  swiper.on('activeIndexChange', update);
  update();
  return {
    destroy() {
      controller.abort();
      swiper.off('activeIndexChange', update);
      element.replaceChildren();
    },
  };
};

const startAutoplay = (root, swiper) => {
  if (root.dataset.autoplay !== 'true' || reducedMotion()) return null;
  const delay = Math.min(60000, Math.max(3000, Number(root.dataset.autoplayDelay) || 6000));
  const pauseOnHover = root.dataset.pauseOnHover !== 'false';

  return window.setInterval(() => {
    if (
      document.hidden ||
      !isVisible(root) ||
      (pauseOnHover && root.matches(':hover')) ||
      root.contains(document.activeElement) ||
      swiper.isLocked
    ) return;

    swiper.slideNext();
  }, delay);
};

const bindNavigation = (root, swiper) => {
  const controller = new AbortController();
  const options = { capture: true, signal: controller.signal };
  const previous = root.querySelector('[data-slideshow-previous]');
  const next = root.querySelector('[data-slideshow-next]');
  const move = (direction) => (event) => {
    event.preventDefault();
    if (swiper.destroyed) return;
    if (direction < 0) swiper.slidePrev();
    else swiper.slideNext();
  };

  previous?.addEventListener('click', move(-1), options);
  next?.addEventListener('click', move(1), options);
  [previous, next].filter(Boolean).forEach((control) => control.setAttribute('aria-controls', carouselId(swiper)));
  return controller;
};

const carouselId = (swiper) => swiper.el.id || '';

const init = (root) => {
  if (!(root instanceof HTMLElement) || states.has(root)) return;
  const carousel = root.querySelector('[data-slideshow-swiper]');
  if (!carousel) return;
  const pageWidth = root.classList.contains('slideshow--width-page');
  const slideCount = carousel.querySelectorAll(`.swiper-wrapper > ${slideSelector}`).length;
  const twoSlidePage = pageWidth && slideCount === 2;
  const twoSlideLoop = twoSlidePage ? createTwoSlideLoop(carousel) : null;
  // Page layout exposes adjacent slides, which requires Swiper's slide effect.
  const fade = !pageWidth && root.dataset.transition === 'fade';
  const autoplay = root.dataset.autoplay === 'true' && !reducedMotion();
  const options = {
    modules: twoSlideLoop ? [] : (fade ? [EffectFade, Pagination] : [Pagination]),
    slidesPerView: 1,
    // Keep page-width slides visually separate while letting Swiper include the
    // gap in its translate, drag, loop, and pagination calculations.
    spaceBetween: pageWidth && !fade ? 24 : 0,
    centeredSlides: pageWidth,
    loop: !twoSlidePage && slideCount > 1,
    initialSlide: twoSlideLoop?.initialSlide || 0,
    watchOverflow: true,
    speed: reducedMotion() ? 0 : 600,
    effect: fade ? 'fade' : 'slide',
    fadeEffect: fade ? { crossFade: true } : undefined,
    ...(twoSlideLoop ? {} : paginationOptions(root)),
  };
  const swiper = createSwiperCarousel(carousel, options);
  if (!swiper) {
    twoSlideLoop?.destroy();
    return;
  }
  const twoSlidePagination = createTwoSlidePagination(root, swiper, twoSlideLoop);
  if (twoSlideLoop) swiper.on('slideChangeTransitionEnd', twoSlideLoop.restore);
  const navigationController = bindNavigation(root, swiper);
  const interval = autoplay ? startAutoplay(root, swiper) : null;
  let frame = 0;
  const scheduleParallax = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => { frame = 0; updateParallax(root); });
  };
  window.addEventListener('scroll', scheduleParallax, { passive: true });
  swiper.on('slideChangeTransitionEnd', scheduleParallax);
  scheduleParallax();
  const updateLockedState = () => root.classList.toggle('slideshow--single-slide', Boolean(swiper.isLocked));
  swiper.on('lock unlock update resize', updateLockedState);
  updateLockedState();
  states.set(root, { carousel, swiper, scheduleParallax, frame, interval, navigationController, updateLockedState, twoSlideLoop, twoSlidePagination });
};

const destroy = (root) => {
  const state = states.get(root);
  if (!state) return;
  window.removeEventListener('scroll', state.scheduleParallax);
  if (state.frame) window.cancelAnimationFrame(state.frame);
  if (state.interval) window.clearInterval(state.interval);
  state.navigationController.abort();
  if (state.twoSlideLoop) {
    state.swiper.off('slideChangeTransitionEnd', state.twoSlideLoop.restore);
    state.twoSlidePagination?.destroy();
    state.twoSlideLoop.destroy();
  }
  state.swiper.off('lock unlock update resize', state.updateLockedState);
  destroySwiperCarousel(state.swiper);
  states.delete(root);
};

const initWithin = (root = document) => {
  if (root.matches?.(selector)) init(root);
  root.querySelectorAll?.(selector).forEach(init);
};
const destroyWithin = (root) => {
  if (root.matches?.(selector)) destroy(root);
  root.querySelectorAll?.(selector).forEach(destroy);
};

document.addEventListener('shopify:section:load', (event) => initWithin(event.target));
document.addEventListener('shopify:section:unload', (event) => destroyWithin(event.target));
document.addEventListener('shopify:block:select', (event) => {
  const root = event.target.closest?.(selector);
  const state = root && states.get(root);
  const slide = event.target.closest?.('[data-slideshow-slide]');
  // The two-slide page loop adds inert clones to the wrapper. Keep editor
  // selection mapped to its two logical source slides.
  const slides = state?.carousel.querySelectorAll('.swiper-wrapper > [data-slideshow-slide]');
  const index = slides ? [...slides].indexOf(slide) : -1;
  if (state && slide && index >= 0) state.swiper.slideTo(state.twoSlideLoop?.originalIndex(index) ?? index);
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initWithin(), { once: true });
else initWithin();
