import { EffectFade, Pagination } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const states = new WeakMap();
const selector = '[data-slideshow]';
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const isVisible = (element) => element.getClientRects().length > 0;
const slideSelector = '[data-slideshow-slide]';

const createPeekSlide = (slide, side) => {
  const peek = slide.cloneNode(true);
  peek.removeAttribute('id');
  peek.setAttribute('aria-hidden', 'true');
  peek.setAttribute('data-slideshow-clone', side);
  peek.classList.remove('swiper-slide-active', 'swiper-slide-next', 'swiper-slide-prev', 'swiper-slide-visible', 'swiper-slide-fully-visible');
  peek.classList.add('slideshow__peek', `slideshow__peek--${side}`);
  peek.querySelectorAll('[id], [data-shopify-editor-block], [data-shopify-editor-block-id], [data-shopify-editor-block-type]').forEach((element) => {
    element.removeAttribute('id');
    element.removeAttribute('data-shopify-editor-block');
    element.removeAttribute('data-shopify-editor-block-id');
    element.removeAttribute('data-shopify-editor-block-type');
  });
  peek.querySelectorAll('a, button, input, select, textarea, summary, video').forEach((element) => {
    element.setAttribute('tabindex', '-1');
    element.setAttribute('aria-hidden', 'true');
  });
  if ('inert' in peek) peek.inert = true;
  return peek;
};

const createTwoSlidePeeks = (carousel, swiper) => {
  if (swiper.slides.length !== 2) return null;
  const slides = [...swiper.slides];
  const peeks = [];

  // A centered Swiper with only two logical slides has no spare slide to keep
  // both visual edges filled. Build stable, decorative copies up front so a
  // swipe never removes/reinserts a node during paint (the source of the
  // visible flash). Each copy is aria-hidden/inert; only the adjacent source
  // for each side is faded in after a transition completes.
  slides.forEach((slide) => {
    ['previous', 'next'].forEach((side) => {
      const peek = createPeekSlide(slide, side);
      peek.dataset.sourceIndex = String(slides.indexOf(slide));
      carousel.append(peek);
      peeks.push(peek);
    });
  });

  const update = () => {
    if (swiper.destroyed) return;
    const activeIndex = swiper.realIndex === 1 ? 1 : 0;
    const neighbourIndex = activeIndex === 1 ? 0 : 1;
    peeks.forEach((peek) => {
      peek.classList.toggle('slideshow__peek--active', peek.dataset.sourceIndex === String(neighbourIndex));
    });
  };
  const destroy = () => {
    peeks.forEach((peek) => peek.remove());
  };
  update();
  return { update, destroy };
};

const updateParallax = (root) => {
  if (reducedMotion()) return;
  root.querySelectorAll(slideSelector).forEach((slide) => {
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
  // Page layout exposes adjacent slides, which requires Swiper's slide effect.
  const fade = !pageWidth && root.dataset.transition === 'fade';
  const autoplay = root.dataset.autoplay === 'true' && !reducedMotion();
  const options = {
    modules: fade ? [EffectFade, Pagination] : [Pagination],
    slidesPerView: 1,
    // Keep page-width slides visually separate while letting Swiper include the
    // gap in its translate, drag, loop, and pagination calculations.
    spaceBetween: pageWidth && !fade ? 24 : 0,
    centeredSlides: pageWidth,
    loop: !twoSlidePage && slideCount > 1,
    rewind: twoSlidePage,
    watchOverflow: true,
    speed: reducedMotion() ? 0 : 600,
    effect: fade ? 'fade' : 'slide',
    fadeEffect: fade ? { crossFade: true } : undefined,
    ...paginationOptions(root),
  };
  const swiper = createSwiperCarousel(carousel, options);
  if (!swiper) return;
  const pagePeeks = twoSlidePage ? createTwoSlidePeeks(carousel, swiper) : null;
  if (pagePeeks) swiper.on('slideChangeTransitionEnd', pagePeeks.update);
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
  states.set(root, { carousel, swiper, scheduleParallax, frame, interval, navigationController, updateLockedState, pagePeeks });
};

const destroy = (root) => {
  const state = states.get(root);
  if (!state) return;
  window.removeEventListener('scroll', state.scheduleParallax);
  if (state.frame) window.cancelAnimationFrame(state.frame);
  if (state.interval) window.clearInterval(state.interval);
  state.navigationController.abort();
  if (state.pagePeeks) {
    state.swiper.off('slideChangeTransitionEnd', state.pagePeeks.update);
    state.pagePeeks.destroy();
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
  // The two-slide page fallback adds aria-hidden visual peeks outside the
  // Swiper wrapper. Keep editor selection mapped to the logical slide list,
  // not to those decorative clones.
  const slides = state?.carousel.querySelectorAll('.swiper-wrapper > [data-slideshow-slide]');
  const index = slides ? [...slides].indexOf(slide) : -1;
  if (state && slide && index >= 0) state.swiper.slideTo(index);
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initWithin(), { once: true });
else initWithin();
