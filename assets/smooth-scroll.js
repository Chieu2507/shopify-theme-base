(() => {
  if (window.SpinelSmoothScroll) return;

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopPointer = window.matchMedia('(min-width: 990px) and (hover: hover) and (pointer: fine)');
  const scrollableOverflow = /^(auto|scroll|overlay)$/;
  const nativeScrollSelector = 'dialog[open], [scroll-lock][open], [scroll-lock].is-open, [data-smooth-scroll-native], input, textarea, select, option, [contenteditable="true"]';
  const damping = 0.14;
  let destination = window.scrollY;
  let renderedPosition = window.scrollY;
  let frame = 0;
  let lastFrameTime = 0;

  const getMaximumScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

  const cancel = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastFrameTime = 0;
    destination = window.scrollY;
    renderedPosition = window.scrollY;
  };

  const isActive = () => (
    desktopPointer.matches
    && !reducedMotion.matches
    && !root.classList.contains('scroll-locked')
    && !window.Shopify?.designMode
  );

  const canNestedElementScroll = (target, delta) => {
    let element = target instanceof Element ? target : target?.parentElement;
    if (!element) return false;
    if (element.closest(nativeScrollSelector)) return true;

    while (element && element !== document.body && element !== root) {
      const overflowY = window.getComputedStyle(element).overflowY;
      if (
        scrollableOverflow.test(overflowY)
        && element.scrollHeight > element.clientHeight + 1
      ) {
        const atStart = element.scrollTop <= 0;
        const atEnd = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
        if (delta < 0 && !atStart || delta > 0 && !atEnd) return true;
      }
      element = element.parentElement;
    }

    return false;
  };

  const normalizeDelta = (event) => {
    let delta = event.deltaY;
    if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16;
    if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= window.innerHeight;
    const limit = clamp(window.innerHeight * 0.32, 160, 320);
    return clamp(delta, -limit, limit);
  };

  const update = (time) => {
    if (!isActive()) {
      cancel();
      return;
    }

    const maximumScroll = getMaximumScroll();
    destination = clamp(destination, 0, maximumScroll);
    const current = window.scrollY;
    const distance = destination - current;

    if (Math.abs(distance) <= 0.5) {
      renderedPosition = destination;
      window.scrollTo({ top: destination, left: window.scrollX, behavior: 'auto' });
      frame = 0;
      lastFrameTime = 0;
      return;
    }

    const elapsed = lastFrameTime ? clamp(time - lastFrameTime, 8, 48) : 16.67;
    const easing = 1 - Math.pow(1 - damping, elapsed / 16.67);
    lastFrameTime = time;
    renderedPosition = current + distance * easing;
    window.scrollTo({
      top: renderedPosition,
      left: window.scrollX,
      behavior: 'auto'
    });
    frame = window.requestAnimationFrame(update);
  };

  const onWheel = (event) => {
    if (
      !isActive()
      || event.defaultPrevented
      || event.ctrlKey
      || event.shiftKey
      || Math.abs(event.deltaX) > Math.abs(event.deltaY)
    ) return;

    const delta = normalizeDelta(event);
    if (!delta || canNestedElementScroll(event.target, delta)) {
      cancel();
      return;
    }

    const maximumScroll = getMaximumScroll();
    const current = window.scrollY;
    if (delta < 0 && current <= 0 && destination <= 0) return;
    if (delta > 0 && current >= maximumScroll && destination >= maximumScroll) return;

    event.preventDefault();
    if (!frame) destination = current;
    destination = clamp(destination + delta, 0, maximumScroll);
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', () => {
    if (frame && Math.abs(window.scrollY - renderedPosition) > 2) {
      cancel();
      return;
    }
    if (!frame) {
      destination = window.scrollY;
      renderedPosition = window.scrollY;
    }
  }, { passive: true });
  window.addEventListener('resize', cancel, { passive: true });
  window.addEventListener('pageshow', cancel);
  window.addEventListener('pointerdown', cancel, { passive: true, capture: true });
  window.addEventListener('keydown', cancel, true);
  window.addEventListener('hashchange', cancel);
  window.addEventListener('popstate', cancel);
  window.addEventListener('pagehide', cancel);
  reducedMotion.addEventListener?.('change', cancel);
  desktopPointer.addEventListener?.('change', cancel);
  window.SpinelSmoothScroll = { cancel };
})();
