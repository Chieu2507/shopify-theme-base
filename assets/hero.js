(() => {
  const states = new WeakMap();

  const destroy = (hero) => {
    const state = states.get(hero);
    if (!state) return;
    window.removeEventListener('scroll', state.schedule);
    window.removeEventListener('resize', state.schedule);
    if (state.frame) window.cancelAnimationFrame(state.frame);
    state.media?.style.removeProperty('transform');
    if (state.sticky) {
      state.sticky.style.removeProperty('position');
      state.sticky.style.removeProperty('top');
      state.sticky.style.removeProperty('left');
      state.sticky.style.removeProperty('width');
    }
    states.delete(hero);
  };

  const init = (hero) => {
    if (!(hero instanceof HTMLElement) || states.has(hero)) return;

    const media = hero.querySelector('[data-hero-media]');
    const sticky = hero.querySelector('.hero__content--sticky');
    const effect = hero.dataset.heroParallax;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!(media instanceof HTMLElement) && !(sticky instanceof HTMLElement)) return;

    const resetSticky = () => {
      if (!(sticky instanceof HTMLElement)) return;
      sticky.style.removeProperty('position');
      sticky.style.removeProperty('top');
      sticky.style.removeProperty('left');
      sticky.style.removeProperty('width');
    };

    const updateSticky = () => {
      if (!(sticky instanceof HTMLElement) || window.innerWidth <= 767.98) {
        resetSticky();
        return;
      }

      resetSticky();
      const heroBounds = hero.getBoundingClientRect();
      const contentBounds = sticky.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const stickyTop = Number.parseFloat(window.getComputedStyle(sticky).top) || 0;
      const start = contentBounds.top + scrollTop - stickyTop;
      const end = heroBounds.top + scrollTop + heroBounds.height - stickyTop;

      if (scrollTop <= start) return;

      if (scrollTop >= end) {
        sticky.style.position = 'absolute';
        sticky.style.top = `${Math.max(0, heroBounds.height - contentBounds.height)}px`;
        sticky.style.left = `${Math.max(0, contentBounds.left - heroBounds.left)}px`;
        sticky.style.width = `${contentBounds.width}px`;
        return;
      }

      sticky.style.position = 'fixed';
      sticky.style.top = `${stickyTop}px`;
      sticky.style.left = `${contentBounds.left}px`;
      sticky.style.width = `${contentBounds.width}px`;
    };

    const update = () => {
      if (effect && media instanceof HTMLElement && !reduceMotion) {
        const bounds = hero.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const progress = Math.max(-1, Math.min(1, (viewportCenter - (bounds.top + (bounds.height / 2))) / Math.max(bounds.height, 1)));
        let transform = 'translate3d(0, 0, 0) scale(1.08)';
        if (effect === 'fixed') transform = `translate3d(0, ${Math.max(-160, Math.min(160, -bounds.top)).toFixed(2)}px, 0) scale(1.08)`;
        if (effect === 'vertical') transform = `translate3d(0, ${(progress * 80).toFixed(2)}px, 0) scale(1.08)`;
        if (effect === 'horizontal') transform = `translate3d(${(progress * 80).toFixed(2)}px, 0) scale(1.08)`;
        if (effect === 'zoom') transform = `translate3d(0, 0, 0) scale(${(1.04 + (Math.abs(progress) * 0.12)).toFixed(3)})`;
        media.style.transform = transform;
      }
      updateSticky();
    };
    const state = {
      frame: 0,
      media,
      schedule: () => {
        if (state.frame) return;
        state.frame = window.requestAnimationFrame(() => {
          state.frame = 0;
          update();
        });
      },
    };

    states.set(hero, state);
    window.addEventListener('scroll', state.schedule, { passive: true });
    window.addEventListener('resize', state.schedule, { passive: true });
    state.schedule();
  };

  const initWithin = (root = document) => root.querySelectorAll?.('[data-hero-parallax], [data-hero-sticky]').forEach(init);
  const destroyWithin = (root) => root.querySelectorAll?.('[data-hero-parallax], [data-hero-sticky]').forEach(destroy);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initWithin());
  } else {
    initWithin();
  }

  document.addEventListener('shopify:section:load', (event) => initWithin(event.target));
  document.addEventListener('shopify:section:unload', (event) => destroyWithin(event.target));
})();
