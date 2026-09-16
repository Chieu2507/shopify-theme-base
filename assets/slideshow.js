import { EffectFade, Pagination } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const states = new WeakMap();
const selector = '[data-slideshow]';
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const updateParallax = (root) => {
  if (reducedMotion()) return;
  root.querySelectorAll('[data-slideshow-slide]').forEach((slide) => {
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
  return {
    pagination: {
      el: element,
      type: type === 'progress_bar' ? 'progressbar' : 'bullets',
      clickable: type === 'bullets',
      renderBullet: type === 'numbers' ? (index, className) => `<button class="${className}" type="button" aria-label="Go to slide ${index + 1}">${String(index + 1).padStart(2, '0')}</button>` : undefined,
    },
  };
};

const init = (root) => {
  if (!(root instanceof HTMLElement) || states.has(root)) return;
  const carousel = root.querySelector('[data-slideshow-swiper]');
  if (!carousel) return;
  const fade = root.dataset.transition === 'fade';
  const autoplay = root.dataset.autoplay === 'true' && !reducedMotion();
  const options = {
    modules: fade ? [EffectFade, Pagination] : [Pagination],
    slidesPerView: 1,
    watchOverflow: true,
    speed: reducedMotion() ? 0 : 600,
    effect: fade ? 'fade' : 'slide',
    fadeEffect: fade ? { crossFade: true } : undefined,
    autoplay: autoplay ? { delay: Math.max(3000, Number(root.dataset.autoplayDelay) || 6000), disableOnInteraction: false, pauseOnMouseEnter: root.dataset.pauseOnHover !== 'false' } : false,
    controls: { scope: root, previous: '[data-slideshow-previous]', next: '[data-slideshow-next]' },
    ...paginationOptions(root),
  };
  const swiper = createSwiperCarousel(carousel, options);
  if (!swiper) return;
  let frame = 0;
  const scheduleParallax = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => { frame = 0; updateParallax(root); });
  };
  window.addEventListener('scroll', scheduleParallax, { passive: true });
  swiper.on('slideChangeTransitionEnd', scheduleParallax);
  scheduleParallax();
  states.set(root, { carousel, swiper, scheduleParallax, frame });
};

const destroy = (root) => {
  const state = states.get(root);
  if (!state) return;
  window.removeEventListener('scroll', state.scheduleParallax);
  if (state.frame) window.cancelAnimationFrame(state.frame);
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
  if (state && slide) state.swiper.slideTo([...state.carousel.querySelectorAll('[data-slideshow-slide]')].indexOf(slide));
});

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initWithin(), { once: true });
else initWithin();
