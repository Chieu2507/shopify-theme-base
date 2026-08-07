(() => {
  if (window.themeScrollLock?.acquire) return;

  const root = document.documentElement;
  const body = document.body;
  const bodyStyleProperties = ['position', 'top', 'right', 'left', 'width', 'overflow', 'padding-right'];
  const imperativeOwners = new Map();
  let locked = false;
  let scrollY = 0;
  let scrollbarWidth = 0;
  let savedBodyStyles = {};
  let appliedMode = '';
  let hadRootLockClass = false;
  let hadBodyLockClass = false;
  let hadRootLockAttribute = false;
  let updateQueued = false;

  const userAgent = navigator.userAgent;
  const isIOS = /iP(?:ad|hone|od)/i.test(userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobileSafari = isIOS
    && /AppleWebKit/i.test(userAgent)
    && /Safari/i.test(userAgent)
    && !/(?:CriOS|FxiOS|EdgiOS|OPiOS)/i.test(userAgent);

  const ownerMode = (owner) => {
    if (owner === 'mega-menu' || owner === 'mobile-menu') return 'overflow';
    if (owner === 'cart-drawer' && isMobileSafari) return 'overflow';
    return 'fixed';
  };

  const getDeclarativeOwner = (element) => {
    if (element.dataset.scrollLockOwner) return element.dataset.scrollLockOwner;
    if (element.matches('[data-cart-drawer]')) return 'cart-drawer';
    if (element.matches('[data-header-search-modal], [data-search-filter-dialog]')) return 'search';
    return 'modal';
  };

  const isImperativeOwnerActive = (owner) => {
    if (owner === 'mega-menu') return Boolean(document.querySelector('.header__submenu-disclosure[open]'));
    if (owner === 'mobile-menu') {
      return Boolean(document.querySelector(
        '[data-header-mobile-drawer][data-open="true"], [data-header-mobile-drawer][data-motion-state="closing"]',
      ));
    }
    return true;
  };

  const setScrollbarVariables = (width) => {
    const value = `${Math.max(0, width)}px`;
    root.style.setProperty('--scrollbar-width', value);
    // Keep the legacy header variable available for sections that still use it.
    root.style.setProperty('--header-menu-scrollbar-width', value);
  };

  const measureScrollbarWidth = () => {
    // Once the lock is applied, clientWidth no longer includes the scrollbar.
    // Keep the measurement captured immediately before locking until unlock.
    if (!locked) {
      scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
      setScrollbarVariables(scrollbarWidth);
    }
    return scrollbarWidth;
  };

  const getActiveModes = () => {
    const modes = new Set();
    imperativeOwners.forEach((mode, owner) => {
      if (!isImperativeOwnerActive(owner)) {
        imperativeOwners.delete(owner);
        return;
      }
      modes.add(mode);
    });
    document.querySelectorAll('[scroll-lock][open], [scroll-lock].is-open, [scroll-lock].is-closing').forEach((element) => {
      modes.add(ownerMode(getDeclarativeOwner(element)));
    });
    return modes;
  };

  const restoreBodyStyles = () => {
    bodyStyleProperties.forEach((property) => {
      body.style.setProperty(property, savedBodyStyles[property] || '');
    });
  };

  const applyLockStyles = (mode) => {
    const width = measureScrollbarWidth();
    root.setAttribute('scroll-lock', '');
    root.classList.add('scroll-locked');
    body.classList.add('scroll-locked');

    // Restore the pre-lock baseline before switching between fixed and
    // overflow modes while another owner is still holding the lock.
    restoreBodyStyles();

    if (mode === 'fixed') {
      Object.assign(body.style, {
        position: 'fixed',
        top: `-${scrollY}px`,
        right: `${width}px`,
        left: '0',
        width: `calc(100% - ${width}px)`,
        overflow: 'hidden'
      });
    } else {
      body.style.overflow = 'hidden';
      body.style.paddingRight = 'var(--scrollbar-width)';
    }
    appliedMode = mode;
  };

  const lock = (mode) => {
    if (!locked) {
      // Capture the width before changing overflow or positioning the body.
      measureScrollbarWidth();
      scrollY = window.scrollY;
      savedBodyStyles = Object.fromEntries(bodyStyleProperties.map((property) => [property, body.style.getPropertyValue(property)]));
      hadRootLockClass = root.classList.contains('scroll-locked');
      hadBodyLockClass = body.classList.contains('scroll-locked');
      hadRootLockAttribute = root.hasAttribute('scroll-lock');
      locked = true;
    }

    if (appliedMode !== mode) applyLockStyles(mode);
  };

  const unlock = () => {
    if (!locked) return;
    restoreBodyStyles();
    if (!hadRootLockClass) root.classList.remove('scroll-locked');
    if (!hadBodyLockClass) body.classList.remove('scroll-locked');
    if (!hadRootLockAttribute) root.removeAttribute('scroll-lock');
    locked = false;
    appliedMode = '';
    // The viewport may have resized while the page was locked. Re-measure
    // only after the scrollbar has been restored so the next lock uses the
    // current width (especially across the desktop/mobile breakpoint).
    measureScrollbarWidth();
    window.scrollTo(0, scrollY);
  };

  const update = () => {
    updateQueued = false;
    const activeModes = getActiveModes();
    if (!activeModes.has('overflow')) {
      // Avoid no-op class writes while the root scroll-lock attribute is set.
      // Some browsers still emit a class mutation for remove() when the token
      // is absent, which would continuously retrigger the observer below.
      if (root.classList.contains('header-menu-scroll-locked')) {
        root.classList.remove('header-menu-scroll-locked');
      }
      if (body.classList.contains('header-menu-scroll-locked')) {
        body.classList.remove('header-menu-scroll-locked');
      }
    }
    if (!activeModes.size) {
      unlock();
      return;
    }

    // Keep the existing fixed-body behavior for dialogs/drawers. The header
    // and mobile menu use the Helix-style overflow lock with body padding.
    // Once one owner has locked the page, keep that mode until every owner is
    // released so switching quickly between overlays cannot cause a reflow.
    const preferredMode = activeModes.has('overflow') ? 'overflow' : 'fixed';
    lock(locked ? appliedMode || preferredMode : preferredMode);
  };

  const scheduleUpdate = () => {
    if (updateQueued) return;
    updateQueued = true;
    window.queueMicrotask(update);
  };

  const observer = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => {
      if (mutation.type === 'childList') return true;
      if (mutation.attributeName === 'open' || mutation.attributeName === 'scroll-lock') return true;
      return mutation.target instanceof Element
        && mutation.target !== root
        && mutation.target.hasAttribute('scroll-lock');
    })) scheduleUpdate();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'open', 'scroll-lock'],
    childList: true,
    subtree: true
  });

  document.addEventListener('click', measureScrollbarWidth, true);
  window.addEventListener('resize', measureScrollbarWidth);
  window.addEventListener('pageshow', scheduleUpdate);
  document.addEventListener('shopify:section:unload', () => window.setTimeout(update, 0), true);

  window.themeScrollLock = {
    acquire(owner, options = {}) {
      if (!owner) return;
      imperativeOwners.set(owner, options.mode || ownerMode(owner));
      update();
    },
    release(owner) {
      if (!owner) return;
      imperativeOwners.delete(owner);
      update();
    },
    has(owner) {
      return imperativeOwners.has(owner);
    },
    update,
    measure: measureScrollbarWidth
  };

  measureScrollbarWidth();
  update();
})();
