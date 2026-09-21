import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const carouselSelector = '[data-cart-drawer-recommendation-list]';
const instances = new WeakMap();

const getSlides = (carousel) => {
  const wrapper = carousel.querySelector(':scope > .swiper-wrapper');
  return Array.from(wrapper?.children || []);
};

const updateDots = (carousel, index) => {
  carousel.closest('[data-cart-drawer-recommendations]')
    ?.querySelectorAll('[data-cart-drawer-recommendation-dot]')
    .forEach((dot, dotIndex) => {
      dot.setAttribute('aria-current', String(dotIndex === index));
    });
};

const destroy = (carousel) => {
  const instance = instances.get(carousel);
  if (!instance) return;

  instance.syncEvents.forEach(([eventName, handler]) => instance.swiper.off(eventName, handler));
  instance.resizeObserver?.disconnect();
  destroySwiperCarousel(carousel);
  instances.delete(carousel);
};

const initialize = (carousel) => {
  const recommendations = carousel.closest('[data-cart-drawer-recommendations]');
  if (!recommendations || recommendations.hidden || !getSlides(carousel).length) return;

  const existing = instances.get(carousel);
  if (existing?.swiper && !existing.swiper.destroyed) {
    existing.swiper.update();
    updateDots(carousel, existing.swiper.activeIndex);
    return;
  }

  const swiper = createSwiperCarousel(carousel, {
    slidesPerView: 1,
    spaceBetween: 0,
    cssMode: true,
    observer: true,
    observeParents: true,
  });
  if (!swiper) return;

  const sync = () => updateDots(carousel, swiper.activeIndex);
  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => {
      if (swiper.destroyed || !carousel.clientWidth) return;
      swiper.update();
      sync();
    });
  const syncEvents = ['slideChange', 'update', 'lock', 'unlock'].map((eventName) => {
    swiper.on(eventName, sync);
    return [eventName, sync];
  });
  resizeObserver?.observe(carousel);
  instances.set(carousel, { swiper, syncEvents, resizeObserver });
  sync();
};

const initializeRoot = (root = document) => {
  if (root.matches?.(carouselSelector)) initialize(root);
  root.querySelectorAll?.(carouselSelector).forEach(initialize);
};

const scheduleInitialize = (root) => {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => initializeRoot(root));
  });
};

const destroyRoot = (root) => {
  const carousels = [];
  if (root.matches?.(carouselSelector)) carousels.push(root);
  root.querySelectorAll?.(carouselSelector).forEach((carousel) => carousels.push(carousel));
  carousels.forEach(destroy);
};

document.addEventListener('cart:updated', (event) => {
  scheduleInitialize(event.detail?.drawer || document.querySelector('[data-cart-drawer]'));
});

document.addEventListener('cart-drawer:open', (event) => {
  scheduleInitialize(event.detail?.drawer || document.querySelector('[data-cart-drawer]'));
});

document.addEventListener('cart-drawer:recommendation-dot', (event) => {
  const carousel = event.detail?.list;
  const instance = carousel && instances.get(carousel);
  const index = Number(event.detail?.index);
  if (!instance?.swiper || instance.swiper.destroyed || !Number.isInteger(index)) return;

  instance.swiper.slideTo(index);
  updateDots(carousel, index);
});

document.addEventListener('shopify:section:load', (event) => scheduleInitialize(event.target));
document.addEventListener('shopify:section:select', (event) => scheduleInitialize(event.target));
document.addEventListener('shopify:section:unload', (event) => destroyRoot(event.target));

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initializeRoot(), { once: true });
} else {
  initializeRoot();
}
