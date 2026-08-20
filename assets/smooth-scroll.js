/**
 * Desktop document smooth scrolling.
 *
 * Lenis owns only the root page scroller. Native scrolling remains untouched
 * for touch devices and every nested scroll region (drawers, modals, Swiper,
 * inputs), so no competing wheel handlers can introduce scroll jitter.
 */
const root = document.documentElement;
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const isThemeEditor = Boolean(window.Shopify?.designMode);
const isEnabled = root.dataset.desktopSmoothScroll === 'all' && !isReducedMotion && !isTouchDevice && !isThemeEditor;

if (isEnabled) {
  const lerp = Number(root.dataset.desktopSmoothScrollLerp || '0.1');
  const speed = Number(root.dataset.desktopSmoothScrollSpeed || '1');
  const preventSelector = [
    '[data-lenis-prevent]',
    'dialog',
    '[role="dialog"]',
    '.swiper',
    '.cart-drawer__body',
    '.quick-view__body',
    '.header__mobile-drawer',
    '.header__localization-sheet',
    'input',
    'textarea',
    'select',
    '[contenteditable="true"]',
  ].join(',');

  import('https://unpkg.com/lenis@1.3.16/dist/lenis.mjs')
    .then(({ default: Lenis }) => {
      const lenis = new Lenis({
        lerp: Number.isFinite(lerp) ? lerp : 0.1,
        wheelMultiplier: Number.isFinite(speed) ? speed : 1,
        smoothWheel: true,
        syncTouch: false,
        autoRaf: false,
        prevent: (node) => node instanceof Element && Boolean(node.closest(preventSelector)),
      });

      const raf = (time) => {
        lenis.raf(time);
        window.requestAnimationFrame(raf);
      };

      window.requestAnimationFrame(raf);
      window.SpinelSmoothScroll = lenis;
    })
    .catch(() => {
      // The browser falls back to its native scroll if the optional module is unavailable.
    });
}
