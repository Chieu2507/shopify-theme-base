(() => {
  const states = new WeakMap();

  const destroy = (hero) => {
    const state = states.get(hero);
    if (!state) return;
    window.removeEventListener('scroll', state.schedule);
    window.removeEventListener('resize', state.schedule);
    if (state.frame) window.cancelAnimationFrame(state.frame);
    state.media?.style.removeProperty('transform');
    states.delete(hero);
  };

  const init = (hero) => {
    if (!(hero instanceof HTMLElement) || states.has(hero) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const media = hero.querySelector('[data-hero-media]');
    if (!(media instanceof HTMLElement)) return;
    const effect = hero.dataset.heroParallax;
    const update = () => {
      const bounds = hero.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const progress = Math.max(-1, Math.min(1, (viewportCenter - (bounds.top + (bounds.height / 2))) / Math.max(bounds.height, 1)));
      let transform = 'translate3d(0, 0, 0) scale(1.08)';
      if (effect === 'fixed') transform = `translate3d(0, ${Math.max(-160, Math.min(160, -bounds.top)).toFixed(2)}px, 0) scale(1.08)`;
      if (effect === 'vertical') transform = `translate3d(0, ${(progress * 80).toFixed(2)}px, 0) scale(1.08)`;
      if (effect === 'horizontal') transform = `translate3d(${(progress * 80).toFixed(2)}px, 0, 0) scale(1.08)`;
      if (effect === 'zoom') transform = `translate3d(0, 0, 0) scale(${(1.04 + (Math.abs(progress) * 0.12)).toFixed(3)})`;
      media.style.transform = transform;
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

  const initWithin = (root = document) => root.querySelectorAll?.('[data-hero-parallax]').forEach(init);
  const destroyWithin = (root) => root.querySelectorAll?.('[data-hero-parallax]').forEach(destroy);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initWithin());
  } else {
    initWithin();
  }

  document.addEventListener('shopify:section:load', (event) => initWithin(event.target));
  document.addEventListener('shopify:section:unload', (event) => destroyWithin(event.target));
})();
