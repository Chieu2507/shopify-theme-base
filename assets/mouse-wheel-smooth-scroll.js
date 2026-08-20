/**
 * Add gentle inertia to conventional mouse-wheel input only.
 *
 * Trackpads and touch screens already provide high-frequency inertial input,
 * so they deliberately keep the browser's native scroll path. This avoids
 * competing with scroll-driven section effects while making a discrete mouse
 * wheel feel closer to a touchpad.
 */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const root = document.documentElement;
  const excludedSelector = [
    '[data-mouse-wheel-native]',
    'dialog',
    '[role="dialog"]',
    '.swiper',
    'input',
    'textarea',
    'select',
    '[contenteditable="true"]',
  ].join(',');
  const scrollableOverflow = /(?:auto|scroll|overlay)/;
  let targetY = window.scrollY;
  let frameId = null;
  let isAnimating = false;

  const maxScrollY = () => Math.max(0, root.scrollHeight - window.innerHeight);

  const isScrollLocked = () => root.classList.contains('scroll-locked') || root.hasAttribute('scroll-lock');

  const isDiscreteMouseWheel = (event) => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE || event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return true;
    return Math.abs(event.deltaY) >= 40;
  };

  const toPixels = (event) => {
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 20;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
    return event.deltaY;
  };

  const hasScrollableAncestor = (target, deltaY) => {
    let node = target instanceof Element ? target : null;

    while (node && node !== document.body && node !== root) {
      const style = window.getComputedStyle(node);
      const isScrollable = node.scrollHeight > node.clientHeight && scrollableOverflow.test(style.overflowY);
      const canMove = deltaY < 0 ? node.scrollTop > 0 : node.scrollTop < node.scrollHeight - node.clientHeight;

      if (isScrollable && canMove) return true;
      node = node.parentElement;
    }

    return false;
  };

  const stop = () => {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = null;
    isAnimating = false;
    targetY = window.scrollY;
  };

  const tick = () => {
    const currentY = window.scrollY;
    const difference = targetY - currentY;

    if (Math.abs(difference) < 0.5) {
      window.scrollTo(0, targetY);
      stop();
      return;
    }

    isAnimating = true;
    window.scrollTo(0, currentY + difference * 0.18);
    frameId = window.requestAnimationFrame(tick);
  };

  const onWheel = (event) => {
    if (!isDiscreteMouseWheel(event) || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || isScrollLocked()) return;
    if (event.target instanceof Element && event.target.closest(excludedSelector)) return;

    const deltaY = toPixels(event);
    if (!deltaY || hasScrollableAncestor(event.target, deltaY)) return;

    event.preventDefault();
    targetY = Math.min(maxScrollY(), Math.max(0, targetY + deltaY));

    if (!frameId) frameId = window.requestAnimationFrame(tick);
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', () => {
    if (!isAnimating) targetY = window.scrollY;
  }, { passive: true });
  window.addEventListener('resize', () => {
    targetY = Math.min(targetY, maxScrollY());
  }, { passive: true });
})();
