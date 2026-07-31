(() => {
  const transition = document.querySelector('[data-page-transition]');
  const root = document.documentElement;

  if (
    !transition ||
    window.Shopify?.designMode ||
    !root.classList.contains('page-transitions-fallback')
  ) {
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const transitionDuration = 180;
  let isNavigating = false;

  const show = () => {
    transition.classList.remove('is-ready');
    transition.classList.add('is-leaving');
  };

  const reveal = () => {
    isNavigating = false;
    transition.classList.remove('is-leaving');
    transition.classList.add('is-ready');
  };

  const revealAfterInitialPaint = () => {
    requestAnimationFrame(() => requestAnimationFrame(reveal));
  };

  const waitForFadeOut = () =>
    new Promise((resolve) => {
      if (reducedMotion.matches) {
        resolve();
        return;
      }

      const finish = () => {
        window.clearTimeout(timeout);
        transition.removeEventListener('transitionend', handleTransitionEnd);
        resolve();
      };
      const handleTransitionEnd = (event) => {
        if (event.propertyName === 'opacity') finish();
      };
      const timeout = window.setTimeout(finish, transitionDuration + 80);

      transition.addEventListener('transitionend', handleTransitionEnd);
    });

  const isSamePageHashLink = (url) =>
    url.pathname === window.location.pathname &&
    url.search === window.location.search &&
    Boolean(url.hash);

  const shouldTransition = (link, event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute('download') ||
      link.matches('[data-cart-drawer-open], [data-no-page-transition]') ||
      (link.target && link.target !== '_self')
    ) {
      return false;
    }

    const rawHref = link.getAttribute('href');
    if (!rawHref || rawHref === '#' || rawHref.startsWith('javascript:')) return false;

    const url = new URL(link.href, window.location.href);

    return (
      ['http:', 'https:'].includes(url.protocol) &&
      url.origin === window.location.origin &&
      !isSamePageHashLink(url)
    );
  };

  document.addEventListener('click', (event) => {
    if (isNavigating) return;

    const link = event.target.closest?.('a[href]');
    if (!link || !shouldTransition(link, event)) return;

    event.preventDefault();
    isNavigating = true;
    show();

    waitForFadeOut().then(() => window.location.assign(link.href));
  });

  window.addEventListener('pagehide', show);
  window.addEventListener('pageshow', revealAfterInitialPaint);

  revealAfterInitialPaint();
})();
