import { createCarouselRuntime } from './carousel-runtime.js';

export const initializeThemeModule = createCarouselRuntime({
  rootSelector: '[data-testimonial-carousel]',
  slideSelector: '.testimonial-item, .carousel-slide',
  onInitialize(root) {
    const item = root.querySelector('.testimonial-item');
    if (!item) return;
    const syncGap = () => {
      const gap = Number.parseFloat(window.getComputedStyle(item).getPropertyValue('--testimonial-gap-desktop'));
      if (Number.isFinite(gap)) root.style.setProperty('--testimonial-controls-gap-half', `${gap / 2}px`);
    };
    syncGap();
    window.addEventListener('resize', syncGap);
    return () => window.removeEventListener('resize', syncGap);
  },
});
