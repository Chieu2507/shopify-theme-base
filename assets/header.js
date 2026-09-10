(() => {
  const HEADER_SELECTOR = '[data-header-sticky]';
  const headerStates = new Map();
  const menuToggleButtons = new WeakSet();
  let lastScrollY = window.scrollY;
  let frameId = null;

  const getStickyTarget = (header, stickyType) => {
    if (stickyType === 'top_header_only') {
      return header.querySelector('[data-header-region="top"]') || header;
    }

    if (stickyType === 'bottom_header_only') {
      return (
        header.querySelector('[data-header-region="bottom"]') ||
        header.querySelector('[data-header-region="top"]') ||
        header
      );
    }

    return header;
  };

  const updateHeaderState = (forceShow = false) => {
    const scrollY = Math.max(window.scrollY, 0);
    const scrollDelta = scrollY - lastScrollY;

    headerStates.forEach(({ header, stickyType }) => {
      const isSticky = stickyType !== 'none';
      header.classList.toggle('header--is-scrolled', isSticky && scrollY > 8);

      if (stickyType !== 'scroll_up') {
        header.classList.remove('header--is-hidden');
        return;
      }

      const revealThreshold = Math.max(header.offsetHeight, 64);
      const shouldReveal =
        forceShow ||
        scrollY <= 8 ||
        scrollDelta < -2 ||
        header.contains(document.activeElement);

      if (shouldReveal) {
        header.classList.remove('header--is-hidden');
      } else if (scrollDelta > 2 && scrollY > revealThreshold) {
        header.classList.add('header--is-hidden');
      }
    });

    lastScrollY = scrollY;
    frameId = null;
  };

  const scheduleUpdate = () => {
    if (frameId === null) {
      frameId = window.requestAnimationFrame(() => updateHeaderState());
    }
  };

  const initializeHeader = (header) => {
    if (headerStates.has(header)) return;

    const stickyType = header.dataset.stickyType || 'none';
    const target = getStickyTarget(header, stickyType);

    if (target !== header) {
      target.dataset.headerStickyTarget = stickyType;
    }

    headerStates.set(header, { header, stickyType });
    initializeMenuToggles(header);
    updateHeaderState(true);
  };

  const initializeMenuToggles = (header) => {
    header.querySelectorAll('[data-header-menu-toggle]').forEach((toggle) => {
      if (menuToggleButtons.has(toggle)) return;

      menuToggleButtons.add(toggle);
      const container = toggle.closest('.header-top') || header;
      const menu = container.querySelector('.header-menu');

      const setMenuState = (isOpen) => {
        container.classList.toggle('header-top--menu-open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
      };

      toggle.addEventListener('click', () => {
        setMenuState(!container.classList.contains('header-top--menu-open'));
      });

      menu?.addEventListener('click', (event) => {
        if (event.target.closest('a')) {
          setMenuState(false);
        }
      });

      menu?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          setMenuState(false);
          toggle.focus();
        }
      });
    });
  };

  const initializeHeaders = (root = document) => {
    if (root.matches?.(HEADER_SELECTOR)) {
      initializeHeader(root);
    }

    root.querySelectorAll?.(HEADER_SELECTOR).forEach(initializeHeader);
  };

  const removeHeaders = (root) => {
    const headers = [];

    if (root.matches?.(HEADER_SELECTOR)) {
      headers.push(root);
    }

    root.querySelectorAll?.(HEADER_SELECTOR).forEach((header) => headers.push(header));
    headers.forEach((header) => headerStates.delete(header));
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate);

  document.addEventListener('focusin', (event) => {
    const header = event.target.closest?.(HEADER_SELECTOR);
    header?.classList.remove('header--is-hidden');
  });

  document.addEventListener('shopify:section:load', (event) => {
    initializeHeaders(event.target);
  });

  document.addEventListener('shopify:section:unload', (event) => {
    removeHeaders(event.target);
  });

  initializeHeaders();
})();
