if (!window.SpinelHeaderMenus) {
  window.SpinelHeaderMenus = true;
  const megaMenuAnimations = new WeakMap();
  const desktopMegaMenuMotions = new WeakMap();
  const desktopMegaMenuRevealEnds = new WeakMap();
  const desktopMegaMenuResizeObservers = new WeakMap();
  const desktopMegaMenuHeightTimers = new WeakMap();
  const mobileMegaMenuMotions = new WeakMap();
  const mobileDrawerMotions = new WeakMap();
  const megaMenuHoverTimers = new WeakMap();
  const cartFeedbackHeaderStates = new WeakMap();
  const mobileMenuReturnFocus = new WeakMap();
  const headerMenuEasing = 'cubic-bezier(0.3, 1, 0.3, 1)';
  const headerHoverCloseDelay = 500;
  const desktopMegaMenuHoverCloseDelay = 120;
  const desktopMegaMenuTransitionDuration = 300;
  // Desktop top-level menus use the CSS motion below; keep the legacy Web Animations fallback disabled.
  const disableLegacyMegaMenuWebAnimations = true;
  let transparentHeaderFrame = 0;
  let headerScrollLockFallbackStyles = null;
  let headerBreakpointFocusContext = null;
  let wasMobileHeaderViewport = window.matchMedia('(max-width: 899px)').matches;

  const isMobileHeaderViewport = () => window.matchMedia('(max-width: 899px)').matches;

  const focusWithoutScroll = (target, scroller, savedScroll) => {
    if (!target) return;
    const pageX = window.scrollX;
    const pageY = window.scrollY;
    const scrollLeft = savedScroll?.left ?? scroller?.scrollLeft;
    const scrollTop = savedScroll?.top ?? scroller?.scrollTop;
    target.focus({ preventScroll: true });
    if (scroller) {
      scroller.scrollLeft = scrollLeft || 0;
      scroller.scrollTop = scrollTop || 0;
    }
    if (window.scrollX !== pageX || window.scrollY !== pageY) window.scrollTo(pageX, pageY);
  };

  const getTransitionTotalMs = (element, propertyName) => {
    if (!element) return 0;
    const style = getComputedStyle(element);
    const properties = style.transitionProperty.split(',').map((value) => value.trim());
    const durations = style.transitionDuration.split(',').map((value) => value.trim());
    const delays = style.transitionDelay.split(',').map((value) => value.trim());
    const toMilliseconds = (value) => value.endsWith('ms')
      ? Number.parseFloat(value)
      : Number.parseFloat(value) * 1000;
    return properties.reduce((maximum, property, index) => {
      if (property !== propertyName && property !== 'all') return maximum;
      const duration = toMilliseconds(durations[index % durations.length] || '0s');
      const delay = toMilliseconds(delays[index % delays.length] || '0s');
      return Math.max(maximum, duration + delay);
    }, 0);
  };

  const getMobileDrawer = (disclosure) => {
    const drawer = disclosure?.nextElementSibling;
    return drawer?.matches?.('[data-header-mobile-drawer]') ? drawer : null;
  };

  const syncMobileDrawer = (disclosure, focusDrawer = false) => {
    const drawer = getMobileDrawer(disclosure);
    if (!drawer) return;

    const isOpen = isMobileHeaderViewport() && disclosure.open;
    drawer.dataset.open = String(isOpen);
    if (drawer.dataset.motionState !== 'closing') drawer.dataset.motionState = isOpen ? 'open' : 'closed';
    if (isMobileHeaderViewport()) {
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
      const title = drawer.querySelector('.header__mobile-drawer-header .visually-hidden');
      if (title?.id) drawer.setAttribute('aria-labelledby', title.id);
      drawer.setAttribute('aria-hidden', String(!isOpen));
    } else {
      drawer.removeAttribute('role');
      drawer.removeAttribute('aria-modal');
      drawer.removeAttribute('aria-labelledby');
      drawer.removeAttribute('aria-hidden');
    }
    drawer.inert = isMobileHeaderViewport() ? !isOpen : false;

    if (isOpen && focusDrawer) {
      mobileMenuReturnFocus.set(drawer, disclosure.querySelector(':scope > summary'));
      window.requestAnimationFrame(() => focusWithoutScroll(drawer.querySelector('[data-header-mobile-close]'), drawer));
    }
  };

  const getActiveMobileDrawerPanel = (drawer) => {
    const panels = Array.from(drawer.querySelectorAll(
      '.header__submenu-disclosure[open] > :is(.header__submenu, .header__mega-panel), .header__submenu-nested-disclosure[open] > .header__submenu-nested'
    ));
    return panels.at(-1) || drawer;
  };

  const getMobileDrawerFocusables = (drawer) => {
    const activePanel = getActiveMobileDrawerPanel(drawer);
    const elements = Array.from(activePanel.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    const closeButton = drawer.querySelector('[data-header-mobile-close]');
    if (activePanel !== drawer && closeButton) {
      const backIndex = elements.findIndex((element) => element.matches('[data-header-mobile-back]'));
      elements.splice(backIndex + 1, 0, closeButton);
    }
    return elements.filter((element) => element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement);
  };

  const clearMobileDrawerMotion = (disclosure) => {
    const state = mobileDrawerMotions.get(disclosure);
    if (!state) return;
    window.clearTimeout(state.timer);
    state.surface?.removeEventListener('transitionend', state.onTransitionEnd);
    mobileDrawerMotions.delete(disclosure);
  };

  const closeMobileMenu = (disclosure, restoreFocus = true) => {
    if (!disclosure || !disclosure.open) return;
    const header = disclosure.closest('[data-header]');
    const drawer = getMobileDrawer(disclosure);
    const returnFocus = mobileMenuReturnFocus.get(drawer) || disclosure.querySelector(':scope > summary');
    const finalize = () => {
      header?.querySelectorAll('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]').forEach((details) => {
        closeMegaMenu(details, true);
      });
      disclosure.open = false;
      if (drawer) drawer.dataset.motionState = 'closed';
      syncMobileDrawer(disclosure);
      syncHeaderMenuScrollLock();
      if (header) scheduleResponsiveHeaderSync();
      if (restoreFocus) window.requestAnimationFrame(() => focusWithoutScroll(returnFocus));
    };

    if (!drawer || !isMobileHeaderViewport()) {
      finalize();
      return;
    }

    if (drawer.dataset.motionState === 'closing') return;
    clearMobileDrawerMotion(disclosure);
    drawer.dataset.motionState = 'closing';
    syncHeaderMenuScrollLock();

    const surface = drawer.querySelector('.header__mobile-drawer-surface');
    const finish = () => {
      const state = mobileDrawerMotions.get(disclosure);
      if (!state || state.finish !== finish) return;
      clearMobileDrawerMotion(disclosure);
      finalize();
    };
    const onTransitionEnd = (event) => {
      if (event.target === surface && event.propertyName === 'transform') finish();
    };
    const state = { surface, finish, onTransitionEnd, timer: 0 };
    mobileDrawerMotions.set(disclosure, state);
    const duration = getTransitionTotalMs(surface, 'transform');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || duration === 0) {
      window.queueMicrotask(finish);
      return;
    }
    surface?.addEventListener('transitionend', onTransitionEnd);
    state.timer = window.setTimeout(finish, duration + 80);
  };

  const syncHeaderMenuScrollLock = () => {
    const isMobile = window.matchMedia('(max-width: 899px)').matches;
    const openMobileDrawer = document.querySelector('[data-header-mobile-drawer][data-open="true"]:not([data-motion-state="closing"])');
    const closingMobileDrawer = document.querySelector('[data-header-mobile-drawer][data-motion-state="closing"]');
    const shouldLock = isMobile
      ? Boolean(openMobileDrawer || closingMobileDrawer)
      : Boolean(document.querySelector('.header__submenu-disclosure[open]'));
    const shouldShowOverlay = isMobile
      ? Boolean(openMobileDrawer)
      : Boolean(document.querySelector('.header__submenu-disclosure[open]:not([data-closing="true"])'));
    const root = document.documentElement;
    const isLocked = root.classList.contains('header-menu-scroll-locked');

    const body = document.body;
    root.classList.toggle('header-menu-overlay-visible', shouldShowOverlay);
    root.classList.toggle('header-menu-overlay-closing', isMobile && Boolean(closingMobileDrawer));
    document.querySelectorAll('[data-header-menu-overlay]').forEach((overlay) => {
      const header = document.getElementById(overlay.dataset.headerMenuOverlay);
      const drawer = overlay.closest('[data-header-mobile-drawer]')
        || getMobileDrawer(header?.querySelector(':scope > .header__inner > .header__menu-disclosure'));
      const isOwnedMobileOverlay = overlay.matches('.header__menu-overlay--mobile');
      const isOwnedDesktopOverlay = overlay.matches('.header__menu-overlay--desktop');
      const isDrawerClosing = drawer?.dataset.motionState === 'closing';
      const overlayVisible = isMobile
        ? isOwnedMobileOverlay && drawer?.dataset.open === 'true' && !isDrawerClosing
        : isOwnedDesktopOverlay && Boolean(header?.querySelector('.header__submenu-disclosure[open]:not([data-closing="true"])'));
      overlay.toggleAttribute('data-visible', Boolean(overlayVisible));
      overlay.toggleAttribute('data-closing', Boolean(isMobile && isOwnedMobileOverlay && isDrawerClosing));
    });

    if (shouldLock && !isLocked) window.SpinelSmoothScroll?.cancel();

    const scrollLock = window.themeScrollLock;
    if (scrollLock?.acquire && headerScrollLockFallbackStyles) {
      root.classList.remove('header-menu-scroll-locked');
      body?.classList.remove('header-menu-scroll-locked');
      body?.style.setProperty('overflow', headerScrollLockFallbackStyles.overflow);
      body?.style.setProperty('padding-right', headerScrollLockFallbackStyles.paddingRight);
      headerScrollLockFallbackStyles = null;
    }

    if (shouldLock) {
      if (scrollLock?.acquire) {
        const owner = isMobile ? 'mobile-menu' : 'mega-menu';
        const inactiveOwner = isMobile ? 'mega-menu' : 'mobile-menu';
        scrollLock.acquire(owner, { mode: 'overflow' });
        scrollLock.release(inactiveOwner);
      } else {
        const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
        root.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
        root.style.setProperty('--header-menu-scrollbar-width', `${scrollbarWidth}px`);
        headerScrollLockFallbackStyles ||= {
          overflow: body?.style.getPropertyValue('overflow') || '',
          paddingRight: body?.style.getPropertyValue('padding-right') || ''
        };
        body?.style.setProperty('overflow', 'hidden');
        body?.style.setProperty('padding-right', 'var(--scrollbar-width)');
      }

      root.classList.add('header-menu-scroll-locked');
      body?.classList.add('header-menu-scroll-locked');
      return;
    }

    root.classList.remove('header-menu-scroll-locked');
    body?.classList.remove('header-menu-scroll-locked');

    if (scrollLock?.release) {
      scrollLock.release('mega-menu');
      scrollLock.release('mobile-menu');
    } else if (headerScrollLockFallbackStyles) {
      body?.style.setProperty('overflow', headerScrollLockFallbackStyles.overflow);
      body?.style.setProperty('padding-right', headerScrollLockFallbackStyles.paddingRight);
      headerScrollLockFallbackStyles = null;
      const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
      root.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
      root.style.setProperty('--header-menu-scrollbar-width', `${scrollbarWidth}px`);
    }
  };

  const setTransparentHeaderColorScheme = (header, showSurface) => {
    const defaultColorClass = header.dataset.defaultColorClass;
    const transparentColorClass = header.dataset.transparentColorClass;
    if (defaultColorClass) header.classList.remove(defaultColorClass);
    if (transparentColorClass) header.classList.remove(transparentColorClass);
    const activeColorClass = showSurface ? defaultColorClass : transparentColorClass;
    if (activeColorClass) header.classList.add(activeColorClass);
  };

  const syncResponsiveHeader = (header) => {
    const isFloatingHeader = header.dataset.floatingHeader === 'true';
    const isTransparentHeader = header.dataset.transparentHeader === 'true';
    if (!isFloatingHeader && !isTransparentHeader) return;

    const sectionWrapper = header.parentElement;
    const origin = sectionWrapper
      ? sectionWrapper.getBoundingClientRect().top + window.scrollY
      : header.getBoundingClientRect().top + window.scrollY;
    const isScrolled = window.scrollY > origin + 1;
    header.classList.toggle('header--scrolled', isScrolled);

    if (!isTransparentHeader) return;

    const hasOpenDesktopMenu = !isMobileHeaderViewport()
      && Boolean(header.querySelector('.header__submenu-disclosure[open]'));
    const showSurface = isScrolled || hasOpenDesktopMenu;
    header.classList.toggle('header--surface-visible', showSurface);
    setTransparentHeaderColorScheme(header, showSurface);
  };

  const syncResponsiveHeaders = () => {
    transparentHeaderFrame = 0;
    document.querySelectorAll('[data-transparent-header="true"], [data-floating-header="true"]').forEach(syncResponsiveHeader);
  };

  const scheduleResponsiveHeaderSync = () => {
    if (transparentHeaderFrame) return;
    transparentHeaderFrame = window.requestAnimationFrame(syncResponsiveHeaders);
  };

  const initializeResponsiveHeaders = (scope = document) => {
    scope.querySelectorAll?.('[data-transparent-header="true"], [data-floating-header="true"]').forEach((header) => {
      syncResponsiveHeader(header);
    });
  };

  initializeResponsiveHeaders();
  window.addEventListener('scroll', scheduleResponsiveHeaderSync, { passive: true });
  window.addEventListener('resize', () => {
    const isMobile = isMobileHeaderViewport();
    const crossedHeaderBreakpoint = isMobile !== wasMobileHeaderViewport;
    wasMobileHeaderViewport = isMobile;
    scheduleResponsiveHeaderSync();
    if (crossedHeaderBreakpoint) {
      const breakpointFocusTargets = [];
      document.querySelectorAll('[data-header]').forEach((header) => {
        const activeElement = document.activeElement;
        const activeDisclosure = activeElement?.closest?.(
          '.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open], [data-header-mobile-drawer][data-open="true"]'
        );
        const rememberedOwner = headerBreakpointFocusContext?.header === header
          ? headerBreakpointFocusContext.owner
          : null;
        const rememberedOwnerIsOpen = rememberedOwner?.matches?.('details')
          ? rememberedOwner.open
          : rememberedOwner?.dataset.open === 'true';
        if ((!activeDisclosure || !header.contains(activeElement)) && !rememberedOwnerIsOpen) return;
        const focusTarget = isMobile
          ? header.querySelector(':scope > .header__inner > .header__menu-disclosure > summary')
          : header.querySelector('.header__submenu-disclosure > summary')
            || Array.from(header.querySelectorAll('.header__navigation a[href], .header__navigation button:not([disabled])'))
              .find((element) => element.getClientRects().length > 0);
        if (focusTarget) breakpointFocusTargets.push(focusTarget);
      });
      document.querySelectorAll('.header__submenu-disclosure, .header__submenu-nested-disclosure').forEach(clearMegaMenuHoverTimer);
      document.querySelectorAll('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]').forEach((details) => closeMegaMenu(details, true));
      document.querySelectorAll('.header__submenu-disclosure').forEach(resetDesktopMegaMenuPresentation);
      document.querySelectorAll('[data-header]').forEach(resetDesktopMegaMenuBackground);
      if (breakpointFocusTargets.length) {
        window.requestAnimationFrame(() => {
          if (breakpointFocusTargets[0].isConnected) focusWithoutScroll(breakpointFocusTargets[0]);
        });
      }
    } else if (!isMobile) {
      document.querySelectorAll('.header__submenu-disclosure[open]:not([data-closing="true"])').forEach(syncDesktopMegaMenuPanelHeight);
    }
    document.querySelectorAll('[data-header] > .header__inner > .header__menu-disclosure').forEach((disclosure) => {
      if (crossedHeaderBreakpoint) {
        clearMobileDrawerMotion(disclosure);
        disclosure.open = false;
        const drawer = getMobileDrawer(disclosure);
        if (drawer) drawer.dataset.motionState = 'closed';
      } else if (!isMobile) {
        mobileDrawerMotions.get(disclosure)?.finish();
      }
      syncMobileDrawer(disclosure);
    });
    syncHeaderMenuScrollLock();
  });
  document.addEventListener('shopify:section:load', (event) => initializeResponsiveHeaders(event.target));

  document.addEventListener('focusin', (event) => {
    const header = event.target.closest?.('[data-header]');
    if (!header) {
      headerBreakpointFocusContext = null;
      return;
    }
    const owner = event.target.closest?.(
      '.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open], [data-header-mobile-drawer][data-open="true"]'
    );
    headerBreakpointFocusContext = owner ? { header, owner } : null;
  });

  const revealHeaderForCartFeedback = (duration = 2200) => {
    document.querySelectorAll('[data-header]').forEach((header) => {
      const existingState = cartFeedbackHeaderStates.get(header);
      window.clearTimeout(existingState?.timer);

      const sectionWrapper = header.parentElement;
      const previousMinHeight = existingState?.previousMinHeight ?? sectionWrapper?.style.minHeight ?? '';
      if (sectionWrapper) {
        sectionWrapper.style.minHeight = `${Math.ceil(header.getBoundingClientRect().height)}px`;
      }

      header.classList.add('header--cart-feedback-visible');
      if (header.dataset.transparentHeader === 'true') {
        header.classList.add('header--surface-visible');
        setTransparentHeaderColorScheme(header, true);
      }

      const timer = window.setTimeout(() => {
        header.classList.remove('header--cart-feedback-visible');
        if (sectionWrapper) sectionWrapper.style.minHeight = previousMinHeight;
        if (header.dataset.transparentHeader === 'true' || header.dataset.floatingHeader === 'true') syncResponsiveHeader(header);
        cartFeedbackHeaderStates.delete(header);
      }, duration);
      cartFeedbackHeaderStates.set(header, { timer, previousMinHeight });
    });
  };

  document.addEventListener('header:reveal-for-cart-feedback', (event) => {
    revealHeaderForCartFeedback(Math.max(0, Number.parseInt(event.detail?.duration, 10) || 2200));
  });

  document.addEventListener('cart:add:success', (event) => {
    if (!event.detail?.button?.closest('[data-product-card]')) return;
    revealHeaderForCartFeedback();
  });

  document.addEventListener('product:add:success', (event) => {
    if (!event.detail?.button?.matches('[data-sticky-cart-add]')) return;
    revealHeaderForCartFeedback();
  });

  const getMegaMenuAnimation = (details) => {
    const header = details.closest('[data-header]');
    const isMegaMenu = details.matches('.header__submenu-disclosure--mega');
    const isTopLevelMenu = details.matches('.header__submenu-disclosure');
    const isNestedMenu = details.matches('.header__submenu-nested-disclosure');
    const isMobileDrawerMenu = isMobileHeaderViewport() && (isTopLevelMenu || isNestedMenu);
    const panel = isMegaMenu
      ? details.querySelector('.header__mega-panel')
      : isNestedMenu
        ? details.querySelector(':scope > .header__submenu-nested')
        : details.querySelector(':scope > .header__submenu');
    const type = isMobileDrawerMenu
      ? 'mobile_slide'
      : isNestedMenu
      ? 'cascading_flyout'
      : isTopLevelMenu
        ? 'cascading_root'
        : 'slide_down';
    const configuredDuration = Number.parseInt(header?.dataset.megaMenuAnimationDuration || '250', 10);
    const isDesktopCascadingMenu = !isMobileDrawerMenu && (isTopLevelMenu || isNestedMenu);
    const duration = isMobileDrawerMenu
      ? 300
      : isDesktopCascadingMenu
        ? 650
        : configuredDuration;
    const delay = 0;
    const easing = isMobileDrawerMenu
      ? 'ease-in-out'
      : isDesktopCascadingMenu
        ? headerMenuEasing
        : 'cubic-bezier(0.22, 1, 0.36, 1)';
    return { panel, type, duration, delay, easing };
  };

  const getMegaMenuFrames = (type, opening, panel, currentHeightOverride) => {
    let frames;

    if (type === 'mobile_accordion') {
      const expandedHeight = Math.max(panel?.scrollHeight || 0, panel?.getBoundingClientRect().height || 0);
      const currentHeight = Math.max(0, currentHeightOverride ?? panel?.getBoundingClientRect().height ?? expandedHeight);
      const collapsedHeight = Math.max(0, currentHeightOverride ?? 0);
      frames = opening
        ? [
            { height: `${collapsedHeight}px`, opacity: 1, overflow: 'hidden' },
            { height: `${expandedHeight}px`, opacity: 1, overflow: 'hidden' }
          ]
        : [
            { height: `${currentHeight}px`, opacity: 1, overflow: 'hidden' },
            { height: '0px', opacity: 1, overflow: 'hidden' }
          ];
      return frames;
    } else if (type === 'mobile_slide') {
      const slideOffset = getComputedStyle(panel).direction === 'rtl'
        ? 'translateX(-100%)'
        : 'translateX(100%)';
      frames = [{ opacity: 1, transform: slideOffset }, { opacity: 1, transform: 'translateX(0)' }];
    } else if (type === 'cascading_root') {
      frames = [{ opacity: 0, translate: '0 -30px' }, { opacity: 1, translate: '0 0' }];
    } else if (type === 'cascading_flyout') {
      frames = [{ opacity: 0, translate: '0 20px' }, { opacity: 1, translate: '0 0' }];
    } else if (type === 'fade') {
      frames = [{ opacity: 0 }, { opacity: 1 }];
    } else if (type === 'scale') {
      frames = [{ opacity: 0, scale: '0.98' }, { opacity: 1, scale: '1' }];
    } else if (type === 'slide_right') {
      frames = [{ opacity: 0, translate: '-8px 0' }, { opacity: 1, translate: '0 0' }];
    } else {
      frames = [{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }];
    }

    return opening ? frames : frames.slice().reverse();
  };

  const usesDesktopMegaMenuCssMotion = (details) => (
    !isMobileHeaderViewport()
    && details.matches('.header__submenu-disclosure')
    && Boolean(details.querySelector(':scope > .header__mega-panel, :scope > .header__submenu'))
  );

  const getDesktopMegaMenuPanel = (details) => details.querySelector(
    ':scope > .header__mega-panel, :scope > .header__submenu'
  );

  const resetDesktopMegaMenuBackground = (header) => {
    if (!header) return;
    header.classList.remove('is-menu-open');
    header.style.removeProperty('--header-mega-background-height');
  };

  const measureDesktopMegaMenuPanelHeight = (details) => {
    const panel = getDesktopMegaMenuPanel(details);
    if (!panel) return 0;
    const availableHeight = Math.max(0, document.documentElement.clientHeight - panel.getBoundingClientRect().top);
    return Math.ceil(Math.min(Math.max(0, panel.scrollHeight), availableHeight));
  };

  const syncDesktopMegaMenuBackground = (header, preferredDetails, preferredHeight) => {
    if (!header || isMobileHeaderViewport()) {
      resetDesktopMegaMenuBackground(header);
      return 0;
    }

    const preferredIsActive = preferredDetails?.open && preferredDetails.dataset.closing !== 'true';
    const activeDetails = preferredIsActive
      ? preferredDetails
      : header.querySelector('.header__submenu-disclosure[open]:not([data-closing="true"])');
    if (!activeDetails) {
      const closingDetails = header.querySelector('.header__submenu-disclosure[open][data-closing="true"]');
      if (closingDetails) {
        header.style.setProperty('--header-mega-background-height', '0px');
        header.classList.add('is-menu-open');
      } else {
        resetDesktopMegaMenuBackground(header);
      }
      return 0;
    }

    const panelHeight = activeDetails === preferredDetails && Number.isFinite(preferredHeight)
      ? preferredHeight
      : measureDesktopMegaMenuPanelHeight(activeDetails);
    header.style.setProperty('--header-mega-background-height', `${panelHeight}px`);
    header.classList.add('is-menu-open');
    return panelHeight;
  };

  const clearDesktopMegaMenuMotion = (details, result = false) => {
    const state = desktopMegaMenuMotions.get(details);
    if (!state) return;
    if (state.frame) window.cancelAnimationFrame(state.frame);
    window.clearTimeout(state.timer);
    state.panel.removeEventListener('transitionend', state.onTransitionEnd);
    desktopMegaMenuMotions.delete(details);
    state.resolve(result);
  };

  const getDesktopMegaMenuRevealTargets = (details) => {
    const panel = getDesktopMegaMenuPanel(details);
    if (!panel) return [];
    if (details.matches('.header__submenu-disclosure--mega')) {
      return Array.from(panel.querySelectorAll(
        '.header__mega-heading, .header__mega-list, .header__mega-promo'
      ));
    }
    return Array.from(panel.children).filter((element) => (
      !element.matches('.header__mobile-submenu-back-item')
    ));
  };

  const clearDesktopMegaMenuRevealDelays = (details) => {
    getDesktopMegaMenuRevealTargets(details).forEach((element) => {
      element.style.removeProperty('--header-mega-reveal-delay');
    });
  };

  const clearDesktopMegaMenuHeightGuard = (details) => {
    const timer = desktopMegaMenuHeightTimers.get(details);
    if (!timer) return;
    window.clearTimeout(timer);
    desktopMegaMenuHeightTimers.delete(details);
    delete details.dataset.opening;
  };

  const resetDesktopMegaMenuPresentation = (details) => {
    clearDesktopMegaMenuMotion(details);
    clearDesktopMegaMenuHeightGuard(details);
    desktopMegaMenuRevealEnds.delete(details);
    delete details.dataset.opening;
    delete details.dataset.closing;
    delete details.dataset.megaPanelVisible;
    const panel = getDesktopMegaMenuPanel(details);
    panel?.style.removeProperty('height');
    panel?.style.removeProperty('--header-mega-panel-height');
    if (panel) panel.inert = false;
    clearDesktopMegaMenuRevealDelays(details);
  };

  const updateDesktopMegaMenuRevealDelays = (details) => {
    const panel = getDesktopMegaMenuPanel(details);
    if (!panel) return;
    if (!details.matches('.header__submenu-disclosure--mega')) {
      const items = getDesktopMegaMenuRevealTargets(details);
      items.forEach((item, index) => {
        item.style.setProperty('--header-mega-reveal-delay', `${200 + (index * 50)}ms`);
      });
      return items.length ? 200 + ((items.length - 1) * 50) + 400 : 0;
    }
    const heading = panel.querySelector('.header__mega-heading');
    const columns = Array.from(panel.querySelectorAll('.header__mega-list'));
    const promotions = Array.from(panel.querySelectorAll('.header__mega-promo'));
    heading?.style.setProperty('--header-mega-reveal-delay', '200ms');
    columns.forEach((column, index) => {
      column.style.setProperty('--header-mega-reveal-delay', `${200 + (index * 50)}ms`);
    });
    const promotionDelay = Math.max(350, Math.min(400, 200 + (columns.length * 50)));
    promotions.forEach((promotion, index) => {
      promotion.style.setProperty('--header-mega-reveal-delay', `${Math.min(400, promotionDelay + (index * 50))}ms`);
    });
    const revealDelays = [
      heading ? 200 : 0,
      ...columns.map((_, index) => 200 + (index * 50)),
      ...promotions.map((_, index) => Math.min(400, promotionDelay + (index * 50)))
    ];
    return Math.max(0, ...revealDelays) + 400;
  };

  const scheduleDesktopMegaMenuMotionFinish = (state) => {
    window.clearTimeout(state.timer);
    const transitionEndsAt = Math.max(state.heightTransitionEndsAt, state.revealEndsAt);
    state.timer = window.setTimeout(
      state.finish,
      Math.max(0, transitionEndsAt - performance.now()) + 80
    );
  };

  const syncDesktopMegaMenuPanelHeight = (details) => {
    const panel = getDesktopMegaMenuPanel(details);
    if (!panel) return 0;
    const panelHeight = measureDesktopMegaMenuPanelHeight(details);
    const heightValue = `${panelHeight}px`;
    const heightChanged = panel.style.getPropertyValue('--header-mega-panel-height') !== heightValue;
    const state = desktopMegaMenuMotions.get(details);
    const guardStableResize = heightChanged
      && !state
      && details.open
      && details.dataset.closing !== 'true'
      && details.dataset.megaPanelVisible === 'true'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (guardStableResize) details.dataset.opening = 'true';
    panel.style.setProperty('--header-mega-panel-height', heightValue);
    if (details.open && details.dataset.closing !== 'true') {
      syncDesktopMegaMenuBackground(details.closest('[data-header]'), details, panelHeight);
    }
    if (heightChanged && state?.opening) {
      state.heightTransitionEndsAt = performance.now() + desktopMegaMenuTransitionDuration;
      scheduleDesktopMegaMenuMotionFinish(state);
    } else if (guardStableResize) {
      window.clearTimeout(desktopMegaMenuHeightTimers.get(details));
      desktopMegaMenuHeightTimers.set(details, window.setTimeout(() => {
        desktopMegaMenuHeightTimers.delete(details);
        if (desktopMegaMenuMotions.has(details) || !details.open || details.dataset.closing === 'true') return;
        delete details.dataset.opening;
      }, desktopMegaMenuTransitionDuration + 80));
    }
    return panelHeight;
  };

  const runDesktopMegaMenuCssMotion = (details, opening, focusAfterMotion = false) => {
    const panel = getDesktopMegaMenuPanel(details);
    if (!panel) return Promise.resolve(false);

    const currentHeight = Math.max(0, panel.getBoundingClientRect().height);
    const wasVisible = details.dataset.megaPanelVisible === 'true';
    clearDesktopMegaMenuMotion(details);
    clearDesktopMegaMenuHeightGuard(details);
    panel.style.height = `${currentHeight}px`;
    const header = details.closest('[data-header]');
    const responsiveHeader = details.closest('[data-transparent-header="true"], [data-floating-header="true"]');
    const now = performance.now();
    let revealEndsAt = desktopMegaMenuRevealEnds.get(details) || now;

    if (opening) {
      panel.inert = false;
      details.dataset.opening = 'true';
      delete details.dataset.closing;
      const revealDuration = updateDesktopMegaMenuRevealDelays(details);
      if (!wasVisible) {
        revealEndsAt = now + revealDuration;
        desktopMegaMenuRevealEnds.set(details, revealEndsAt);
      }
      const panelHeight = measureDesktopMegaMenuPanelHeight(details);
      panel.style.setProperty('--header-mega-panel-height', `${panelHeight}px`);
      syncDesktopMegaMenuBackground(header, details, panelHeight);
    } else {
      if (panel.contains(document.activeElement)) {
        focusWithoutScroll(details.querySelector(':scope > summary'));
      }
      panel.inert = true;
      details.dataset.closing = 'true';
      delete details.dataset.opening;
      syncDesktopMegaMenuBackground(header);
    }

    panel.getBoundingClientRect();
    syncHeaderDisclosureAria(details);
    syncHeaderMenuScrollLock();
    if (responsiveHeader) syncResponsiveHeader(responsiveHeader);

    let resolveMotion;
    const motionPromise = new Promise((resolve) => { resolveMotion = resolve; });
    const finish = () => {
      const state = desktopMegaMenuMotions.get(details);
      if (!state || state.finish !== finish) return;
      clearDesktopMegaMenuMotion(details, true);
      panel.style.removeProperty('height');
      if (opening) {
        delete details.dataset.opening;
        desktopMegaMenuRevealEnds.delete(details);
        syncDesktopMegaMenuPanelHeight(details);
      } else {
        details.open = false;
        delete details.dataset.closing;
        delete details.dataset.megaPanelVisible;
        desktopMegaMenuRevealEnds.delete(details);
        panel.style.removeProperty('--header-mega-panel-height');
        clearDesktopMegaMenuRevealDelays(details);
        syncDesktopMegaMenuBackground(header);
      }
      syncHeaderDisclosureAria(details);
      syncHeaderMenuScrollLock();
      if (responsiveHeader) scheduleResponsiveHeaderSync();
      if (focusAfterMotion) focusWithoutScroll(details.querySelector(':scope > summary'));
    };
    const onTransitionEnd = (event) => {
      if (!opening && event.target === panel && event.propertyName === 'height') finish();
    };
    const state = {
      panel,
      opening,
      frame: 0,
      timer: 0,
      heightTransitionEndsAt: now + desktopMegaMenuTransitionDuration,
      revealEndsAt: opening ? revealEndsAt : now + desktopMegaMenuTransitionDuration,
      finish,
      onTransitionEnd,
      resolve: resolveMotion
    };
    desktopMegaMenuMotions.set(details, state);
    panel.addEventListener('transitionend', onTransitionEnd);

    state.frame = window.requestAnimationFrame(() => {
      state.frame = 0;
      if (desktopMegaMenuMotions.get(details) !== state) return;
      if (opening) details.dataset.megaPanelVisible = 'true';
      panel.style.removeProperty('height');
      state.heightTransitionEndsAt = performance.now() + desktopMegaMenuTransitionDuration;
      scheduleDesktopMegaMenuMotionFinish(state);
    });

    return motionPromise;
  };

  const observeDesktopMegaMenu = (details) => {
    if (!window.ResizeObserver || desktopMegaMenuResizeObservers.has(details)) return;
    const panel = getDesktopMegaMenuPanel(details);
    if (!panel) return;
    const surface = panel.querySelector(':scope > .header__mega-surface');
    const observedElements = [surface || panel];
    if (!surface) observedElements.push(...Array.from(panel.children));
    const observer = new ResizeObserver(() => {
      if (usesDesktopMegaMenuCssMotion(details) && details.open && details.dataset.closing !== 'true') {
        syncDesktopMegaMenuPanelHeight(details);
      }
    });
    observedElements.forEach((element) => observer.observe(element));
    desktopMegaMenuResizeObservers.set(details, observer);
  };

  const initializeDesktopMegaMenuObservers = (scope = document) => {
    scope.querySelectorAll?.('.header__submenu-disclosure').forEach(observeDesktopMegaMenu);
  };

  const disconnectDesktopMegaMenuObserver = (details) => {
    desktopMegaMenuResizeObservers.get(details)?.disconnect();
    desktopMegaMenuResizeObservers.delete(details);
  };

  const runMobileMegaMenuMotion = (details, opening, focusAfterMotion = false) => {
    const { panel, type, duration, delay, easing } = getMegaMenuAnimation(details);
    const summary = details.querySelector(':scope > summary');
    const scroller = details.parentElement?.closest('.header__submenu, .header__mega-panel, .header__submenu-nested, .header__navigation-content')
      || details.closest('.header__navigation-content');
    const savedScroll = {
      left: scroller?.scrollLeft || 0,
      top: scroller?.scrollTop || 0
    };
    const finalizeWithoutMotion = () => {
      delete details.dataset.opening;
      delete details.dataset.closing;
      if (!opening) details.open = false;
      syncHeaderDisclosureAria(details);
      syncHeaderMenuScrollLock();
      const target = opening ? panel?.querySelector('[data-header-mobile-back]') : summary;
      if ((opening || focusAfterMotion) && !details.closest('[data-header-mobile-drawer][data-motion-state="closing"]')) {
        window.queueMicrotask(() => focusWithoutScroll(target, scroller, savedScroll));
      }
    };

    if (!panel || type !== 'mobile_slide' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finalizeWithoutMotion();
      return Promise.resolve(true);
    }

    let state = mobileMegaMenuMotions.get(details);
    if (!state || state.panel !== panel || state.animation.playState === 'idle') {
      state?.animation.cancel();
      const animation = panel.animate(getMegaMenuFrames(type, true, panel), {
        duration,
        delay,
        easing,
        fill: 'both'
      });
      animation.pause();
      state = {
        animation,
        panel,
        revision: 0,
        desiredOpen: opening,
        scroller,
        savedScroll
      };
      mobileMegaMenuMotions.set(details, state);
      animation.currentTime = opening ? 0 : duration;
    }

    state.revision += 1;
    state.desiredOpen = opening;
    state.scroller = scroller;
    state.savedScroll = savedScroll;
    const revision = state.revision;
    if (opening) {
      details.dataset.opening = 'true';
      delete details.dataset.closing;
    } else {
      details.dataset.closing = 'true';
      delete details.dataset.opening;
    }
    syncHeaderDisclosureAria(details);
    syncHeaderMenuScrollLock();
    state.animation.playbackRate = opening ? 1 : -1;
    state.animation.play();

    return state.animation.finished
      .then(() => {
        const currentState = mobileMegaMenuMotions.get(details);
        if (currentState !== state || state.revision !== revision || state.desiredOpen !== opening) return false;
        delete details.dataset.opening;
        delete details.dataset.closing;
        if (opening) {
          syncHeaderDisclosureAria(details);
          syncHeaderMenuScrollLock();
          if (focusAfterMotion && !details.closest('[data-header-mobile-drawer][data-motion-state="closing"]')) {
            focusWithoutScroll(panel.querySelector('[data-header-mobile-back]'), state.scroller, state.savedScroll);
          }
          return true;
        }

        details.open = false;
        syncHeaderDisclosureAria(details);
        syncHeaderMenuScrollLock();
        state.animation.cancel();
        mobileMegaMenuMotions.delete(details);
        if (focusAfterMotion && !details.closest('[data-header-mobile-drawer][data-motion-state="closing"]')) {
          focusWithoutScroll(summary, state.scroller, state.savedScroll);
        }
        return true;
      })
      .catch(() => false);
  };

  const animateMegaMenuOpen = (details, focusAfterMotion = false) => {
    if (usesDesktopMegaMenuCssMotion(details)) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        clearDesktopMegaMenuMotion(details);
        clearDesktopMegaMenuHeightGuard(details);
        const panel = getDesktopMegaMenuPanel(details);
        if (panel) {
          panel.inert = false;
          panel.style.removeProperty('height');
        }
        updateDesktopMegaMenuRevealDelays(details);
        const panelHeight = syncDesktopMegaMenuPanelHeight(details);
        details.dataset.megaPanelVisible = 'true';
        delete details.dataset.opening;
        delete details.dataset.closing;
        syncDesktopMegaMenuBackground(details.closest('[data-header]'), details, panelHeight);
        syncHeaderDisclosureAria(details);
        syncHeaderMenuScrollLock();
        return Promise.resolve(true);
      }
      return runDesktopMegaMenuCssMotion(details, true, focusAfterMotion);
    }

    if (disableLegacyMegaMenuWebAnimations) {
      megaMenuAnimations.get(details)?.cancel();
      megaMenuAnimations.delete(details);
      mobileMegaMenuMotions.get(details)?.animation.cancel();
      mobileMegaMenuMotions.delete(details);
      delete details.dataset.opening;
      delete details.dataset.closing;
      syncHeaderDisclosureAria(details);
      syncHeaderMenuScrollLock();
      return Promise.resolve(false);
    }

    const { panel, type, duration, delay, easing } = getMegaMenuAnimation(details);
    if (type === 'mobile_slide') return runMobileMegaMenuMotion(details, true, focusAfterMotion);
    if (!panel || type === 'none' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return Promise.resolve(false);

    const existingAnimation = megaMenuAnimations.get(details);
    const currentHeight = existingAnimation && type === 'mobile_accordion'
      ? panel.getBoundingClientRect().height
      : undefined;
    existingAnimation?.cancel();
    const animation = panel.animate(getMegaMenuFrames(type, true, panel, currentHeight), {
      duration,
      delay,
      easing,
      fill: 'both'
    });
    megaMenuAnimations.set(details, animation);
    return animation.finished
      .then(() => {
        if (megaMenuAnimations.get(details) !== animation) return false;
        megaMenuAnimations.delete(details);
        delete details.dataset.opening;
        animation.cancel();
        return true;
      })
      .catch(() => false);
  };

  const closeMegaMenu = (details, immediate = false, focusAfterMotion = false) => {
    if (!details.open || (!immediate && details.dataset.closing === 'true')) return;

    const { panel, type, duration, easing } = getMegaMenuAnimation(details);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const currentHeight = type === 'mobile_accordion' ? panel?.getBoundingClientRect().height : undefined;

    if (details.matches('.header__submenu-disclosure')) {
      details.querySelectorAll('.header__submenu-nested-disclosure[open]').forEach((nestedDetails) => {
        closeMegaMenu(nestedDetails, true);
      });
    }

    if (usesDesktopMegaMenuCssMotion(details)) {
      if (immediate || reduceMotion) {
        const header = details.closest('[data-header]');
        const desktopPanel = getDesktopMegaMenuPanel(details);
        if (desktopPanel?.contains(document.activeElement)) {
          focusWithoutScroll(details.querySelector(':scope > summary'));
        }
        resetDesktopMegaMenuPresentation(details);
        details.open = false;
        syncDesktopMegaMenuBackground(header);
        syncHeaderDisclosureAria(details);
        syncHeaderMenuScrollLock();
        if (details.closest('[data-transparent-header="true"], [data-floating-header="true"]')) scheduleResponsiveHeaderSync();
        if (focusAfterMotion) focusWithoutScroll(details.querySelector(':scope > summary'));
        return;
      }
      return runDesktopMegaMenuCssMotion(details, false, focusAfterMotion);
    }

    if (immediate || disableLegacyMegaMenuWebAnimations || !panel || type === 'none' || reduceMotion) {
      resetDesktopMegaMenuPresentation(details);
      megaMenuAnimations.get(details)?.cancel();
      megaMenuAnimations.delete(details);
      mobileMegaMenuMotions.get(details)?.animation.cancel();
      mobileMegaMenuMotions.delete(details);
      delete details.dataset.opening;
      delete details.dataset.closing;
      details.open = false;
      syncHeaderDisclosureAria(details);
      syncHeaderMenuScrollLock();
      if (focusAfterMotion) focusWithoutScroll(details.querySelector(':scope > summary'));
      return;
    }

    if (type === 'mobile_slide') return runMobileMegaMenuMotion(details, false, focusAfterMotion);

    megaMenuAnimations.get(details)?.cancel();
    details.dataset.closing = 'true';
    syncHeaderDisclosureAria(details);
    syncHeaderMenuScrollLock();
    if (!isMobileHeaderViewport()) {
      const responsiveHeader = details.closest('[data-transparent-header="true"]');
      if (responsiveHeader) syncResponsiveHeader(responsiveHeader);
    }
    const animation = panel.animate(getMegaMenuFrames(type, false, panel, currentHeight), {
      duration,
      easing,
      fill: 'both'
    });
    megaMenuAnimations.set(details, animation);
    animation.finished
      .then(() => {
        if (megaMenuAnimations.get(details) !== animation) return;
        megaMenuAnimations.delete(details);
        delete details.dataset.closing;
        delete details.dataset.opening;
        details.open = false;
        syncHeaderDisclosureAria(details);
        syncHeaderMenuScrollLock();
        animation.cancel();
        if (focusAfterMotion) focusWithoutScroll(details.querySelector(':scope > summary'));
      })
      .catch(() => {});
  };

  const supportsDesktopHeaderHover = () => window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;
  const shouldAnimateHeaderSubmenu = (details) => details.matches(
    '.header__submenu-disclosure, .header__submenu-nested-disclosure'
  );

  const syncHeaderDisclosureAria = (details) => {
    const summary = details.querySelector(':scope > summary[aria-controls]');
    if (!summary) return;
    const isOpen = details.open && !(usesDesktopMegaMenuCssMotion(details) && details.dataset.closing === 'true');
    summary.setAttribute('aria-expanded', String(isOpen));
    const stateLabel = isOpen ? summary.dataset.closeLabel : summary.dataset.openLabel;
    if (stateLabel) summary.setAttribute('aria-label', stateLabel);
  };

  const initializeHeaderDisclosures = (scope = document) => {
    scope.querySelectorAll?.('.header__submenu-disclosure, .header__submenu-nested-disclosure').forEach(syncHeaderDisclosureAria);
  };

  const clearMegaMenuHoverTimer = (details) => {
    const timer = megaMenuHoverTimers.get(details);
    if (timer) window.clearTimeout(timer);
    megaMenuHoverTimers.delete(details);
  };

  const getOpenHoverMenus = (header) => header?.querySelectorAll(
    '.header__submenu-disclosure--hover[open]'
  ) || [];

  const scheduleMegaMenuClose = (details, delay) => {
    const closeDelay = delay ?? (details.matches('.header__submenu-disclosure')
      ? desktopMegaMenuHoverCloseDelay
      : headerHoverCloseDelay);
    clearMegaMenuHoverTimer(details);
    megaMenuHoverTimers.set(details, window.setTimeout(() => {
      megaMenuHoverTimers.delete(details);
      if (details.matches(':hover') || details.querySelector(':focus-visible')) return;
      closeMegaMenu(details);
    }, closeDelay));
  };

  const positionHeaderSubmenu = (details) => {
    if (
      !details.matches('.header__submenu-disclosure:not(.header__submenu-disclosure--mega)') ||
      window.matchMedia('(max-width: 899px)').matches
    ) {
      details.style.removeProperty('--header-submenu-top');
      return;
    }

    const header = details.closest('[data-header]');
    if (!header) return;
    const headerRect = header.getBoundingClientRect();
    const detailsRect = details.getBoundingClientRect();
    details.style.setProperty('--header-submenu-top', `${Math.max(0, headerRect.bottom - detailsRect.top)}px`);
  };

  const positionNestedHeaderSubmenu = (details) => {
    if (!details.matches('.header__submenu-nested-disclosure') || window.matchMedia('(max-width: 899px)').matches) {
      delete details.dataset.flyoutReverse;
      return;
    }

    delete details.dataset.flyoutReverse;
    const panel = details.querySelector(':scope > .header__submenu-nested');
    if (!panel) return;
    const panelRect = panel.getBoundingClientRect();
    const isRtl = getComputedStyle(details).direction === 'rtl';
    const overflowsInlineEnd = isRtl ? panelRect.left < 20 : panelRect.right > window.innerWidth - 20;
    if (overflowsInlineEnd) details.dataset.flyoutReverse = 'true';
  };

  const closeOtherHeaderSubmenus = (details, closeImmediately = false) => {
    const header = details.closest('[data-header]');
    const openMenus = details.matches('.header__submenu-nested-disclosure')
      ? details.closest('.header__submenu-disclosure')?.querySelectorAll('.header__submenu-nested-disclosure[open]')
      : header?.querySelectorAll('.header__submenu-disclosure[open]');

    openMenus?.forEach((menu) => {
      if (menu === details) return;
      if (shouldAnimateHeaderSubmenu(menu)) closeMegaMenu(menu, closeImmediately || isMobileHeaderViewport());
      else menu.open = false;
    });
  };

  const closeDesktopMenusInOtherHeaders = (details) => {
    const activeHeader = details.closest('[data-header]');
    document.querySelectorAll('[data-header]').forEach((header) => {
      if (header === activeHeader) return;
      header.querySelectorAll('.header__submenu-disclosure[open]').forEach((menu) => closeMegaMenu(menu));
    });
  };

  const openHeaderSubmenu = (details) => {
    clearMegaMenuHoverTimer(details);
    const isDesktopAnimatedMenu = usesDesktopMegaMenuCssMotion(details);
    const isDesktopTopLevelMenu = !isMobileHeaderViewport() && details.matches('.header__submenu-disclosure');

    if (details.open) {
      if (details.dataset.closing !== 'true') return;
      if (!isMobileHeaderViewport()) {
        const responsiveHeader = details.closest('[data-transparent-header="true"]');
        if (responsiveHeader) {
          responsiveHeader.classList.add('header--surface-visible');
          setTransparentHeaderColorScheme(responsiveHeader, true);
        }
      }
      animateMegaMenuOpen(details, isMobileHeaderViewport());
      if (isDesktopAnimatedMenu) {
        closeOtherHeaderSubmenus(details);
      }
      if (isDesktopTopLevelMenu) closeDesktopMenusInOtherHeaders(details);
      return;
    }

    if (!isDesktopAnimatedMenu) {
      closeOtherHeaderSubmenus(
        details,
        supportsDesktopHeaderHover() && details.matches('.header__submenu-disclosure--hover')
      );
    }
    positionHeaderSubmenu(details);
    const responsiveHeader = details.closest('[data-transparent-header="true"], [data-floating-header="true"]');
    if (responsiveHeader?.dataset.transparentHeader === 'true' && !isMobileHeaderViewport()) {
      responsiveHeader.classList.add('header--surface-visible');
      setTransparentHeaderColorScheme(responsiveHeader, true);
    }
    details.dataset.opening = 'true';
    details.open = true;
    if (details.contains(document.activeElement)) {
      headerBreakpointFocusContext = { header: details.closest('[data-header]'), owner: details };
    }
    syncHeaderDisclosureAria(details);
    positionNestedHeaderSubmenu(details);
    syncHeaderMenuScrollLock();
    if (responsiveHeader) {
      scheduleResponsiveHeaderSync();
    }
    animateMegaMenuOpen(details, isMobileHeaderViewport());
    if (isDesktopAnimatedMenu) {
      closeOtherHeaderSubmenus(details);
    }
    if (isDesktopTopLevelMenu) closeDesktopMenusInOtherHeaders(details);
  };

  window.addEventListener('resize', () => {
    document.querySelectorAll('.header__submenu-disclosure[open]').forEach(positionHeaderSubmenu);
    document.querySelectorAll('.header__submenu-nested-disclosure[open]').forEach(positionNestedHeaderSubmenu);
  });

  document.addEventListener('pointerover', (event) => {
    if (!supportsDesktopHeaderHover()) return;

    const overlay = event.target.closest?.('.header__menu-overlay--desktop[data-header-menu-overlay]');
    if (overlay) {
      const header = document.getElementById(overlay.dataset.headerMenuOverlay);
      getOpenHoverMenus(header).forEach((openDetails) => scheduleMegaMenuClose(openDetails));
      return;
    }

    const nestedDetails = event.target.closest?.('.header__submenu-disclosure:not(.header__submenu-disclosure--mega) .header__submenu-nested-disclosure');
    if (nestedDetails && !nestedDetails.contains(event.relatedTarget)) {
      clearMegaMenuHoverTimer(nestedDetails);
      megaMenuHoverTimers.set(nestedDetails, window.setTimeout(() => openHeaderSubmenu(nestedDetails), 120));
      return;
    }

    const details = event.target.closest?.('.header__submenu-disclosure--hover');
    if (!details || details.contains(event.relatedTarget)) return;

    openHeaderSubmenu(details);
  });

  document.addEventListener('pointerout', (event) => {
    if (!supportsDesktopHeaderHover()) return;
    const nestedDetails = event.target.closest?.('.header__submenu-disclosure:not(.header__submenu-disclosure--mega) .header__submenu-nested-disclosure');
    if (nestedDetails && !nestedDetails.contains(event.relatedTarget)) {
      clearMegaMenuHoverTimer(nestedDetails);
      megaMenuHoverTimers.set(nestedDetails, window.setTimeout(() => closeMegaMenu(nestedDetails), headerHoverCloseDelay));
      const parentDetails = nestedDetails.closest('.header__submenu-disclosure--hover');
      if (parentDetails && !parentDetails.contains(event.relatedTarget)) scheduleMegaMenuClose(parentDetails);
      return;
    }

    const details = event.target.closest?.('.header__submenu-disclosure--hover');
    if (details) {
      if (details.contains(event.relatedTarget)) return;
      if (details.matches('.header__submenu-disclosure') && details.closest('[data-header]')?.contains(event.relatedTarget)) return;

      scheduleMegaMenuClose(details);
      return;
    }

    const header = event.target.closest?.('[data-header]');
    if (!header || header.contains(event.relatedTarget)) return;

    getOpenHoverMenus(header).forEach((openDetails) => scheduleMegaMenuClose(openDetails));
  });

  document.addEventListener('focusout', (event) => {
    if (!supportsDesktopHeaderHover()) return;
    const details = event.target.closest?.('.header__submenu-disclosure--hover[open]');
    if (!details || details.contains(event.relatedTarget) || details.matches(':hover')) return;
    scheduleMegaMenuClose(details);
  });

  document.addEventListener(
    'toggle',
    (event) => {
      const details = event.target;
      if (details.matches?.('.header__menu-disclosure')) {
        const toggle = details.querySelector(':scope > .header__menu-toggle');
        if (toggle) {
          toggle.setAttribute('aria-label', details.open ? details.dataset.closeLabel : details.dataset.openLabel);
          toggle.setAttribute('aria-expanded', String(details.open));
        }
        syncMobileDrawer(details, details.open && isMobileHeaderViewport());
      }

      if (details.matches?.('.header__menu-disclosure, .header__submenu-disclosure, .header__submenu-nested-disclosure')) {
        syncHeaderMenuScrollLock();
      }

      if (details.open && details.matches?.('.header__localization-selector')) {
        const mobileUtilities = details.closest?.('.header__mobile-utilities');
        if (mobileUtilities) {
          mobileUtilities.querySelectorAll('.header__localization-selector[open]').forEach((otherDetails) => {
            if (otherDetails !== details) otherDetails.open = false;
          });
        }
      }

      if (!details.open && details.matches?.('.header__localization-selector')) {
        const searchInput = details.querySelector('[data-header-localization-search]');
        if (searchInput) {
          searchInput.value = '';
          details.querySelectorAll('[data-header-country-option]').forEach((option) => { option.hidden = false; });
        }
      }

      if (details.matches?.('.header__submenu-disclosure, .header__submenu-nested-disclosure')) {
        syncHeaderDisclosureAria(details);
      }

      if (details.closest?.('[data-transparent-header="true"], [data-floating-header="true"]')) scheduleResponsiveHeaderSync();

      if (!details.matches?.('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]')) return;

      positionHeaderSubmenu(details);
      positionNestedHeaderSubmenu(details);
      closeOtherHeaderSubmenus(details);

      if (details.dataset.opening === 'true' || details.dataset.closing === 'true' || mobileMegaMenuMotions.has(details)) return;
      if (shouldAnimateHeaderSubmenu(details)) animateMegaMenuOpen(details);
    },
    true
  );

  document.addEventListener('click', (event) => {
    const mobileCloseButton = event.target.closest?.('[data-header-mobile-close]');
    if (mobileCloseButton) {
      closeMobileMenu(mobileCloseButton.closest('[data-header]')?.querySelector('.header__menu-disclosure[open]'));
      return;
    }

    const localizationCloseButton = event.target.closest?.('[data-header-localization-close]');
    if (localizationCloseButton && isMobileHeaderViewport()) {
      const details = localizationCloseButton.closest('.header__localization-selector');
      if (details) {
        details.open = false;
        details.querySelector(':scope > summary')?.focus();
      }
      return;
    }

    const mobileBackButton = event.target.closest?.('[data-header-mobile-back]');
    if (mobileBackButton && isMobileHeaderViewport()) {
      const details = mobileBackButton.closest('.header__submenu-nested-disclosure, .header__submenu-disclosure');
      if (details) {
        closeMegaMenu(details, false, true);
      }
      return;
    }

    const overlay = event.target.closest?.('[data-header-menu-overlay]');
    if (overlay) {
      const header = document.getElementById(overlay.dataset.headerMenuOverlay);
      const mobileDrawer = header?.querySelector('.header__menu-disclosure[open]');
      if (mobileDrawer && isMobileHeaderViewport()) {
        closeMobileMenu(mobileDrawer);
        return;
      }
      header?.querySelectorAll('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]').forEach((details) => {
        closeMegaMenu(details);
      });
      return;
    }

    const summary = event.target.closest?.('summary');
    const submenu = summary?.parentElement;
    if (submenu?.matches('.header__submenu-disclosure--hover') && supportsDesktopHeaderHover()) {
      event.preventDefault();
      if (submenu.open) closeMegaMenu(submenu);
      else openHeaderSubmenu(submenu);
      return;
    }

    if (submenu?.matches('.header__submenu-disclosure, .header__submenu-nested-disclosure') && shouldAnimateHeaderSubmenu(submenu)) {
      event.preventDefault();
      if (submenu.open) closeMegaMenu(submenu);
      else openHeaderSubmenu(submenu);
      return;
    }

    if (isMobileHeaderViewport() && event.target.closest?.('[data-header-mobile-drawer]')) return;

    document.querySelectorAll('[data-header]').forEach((header) => {
      const activeDisclosure = event.target.closest?.('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]');
      if (activeDisclosure?.closest('[data-header]') === header) return;
      header.querySelectorAll('details[open]').forEach((details) => {
        if (details.matches('.header__submenu-disclosure, .header__submenu-nested-disclosure') && shouldAnimateHeaderSubmenu(details)) {
          closeMegaMenu(details);
        } else {
          details.open = false;
        }
      });
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && isMobileHeaderViewport()) {
      const drawer = event.target.closest?.('[data-header-mobile-drawer][data-open="true"]');
      if (drawer) {
        const focusableElements = getMobileDrawerFocusables(drawer);
        if (!focusableElements.length) {
          event.preventDefault();
          drawer.querySelector('[data-header-mobile-close]')?.focus();
          return;
        }
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    const summary = event.target.closest?.('summary[aria-controls]');
    const disclosure = summary?.parentElement;

    if (event.key === 'ArrowRight' && disclosure?.matches('.header__submenu-nested-disclosure') && supportsDesktopHeaderHover()) {
      event.preventDefault();
      openHeaderSubmenu(disclosure);
      window.requestAnimationFrame(() => disclosure.querySelector(':scope > .header__submenu-nested a')?.focus());
      return;
    }

    if (event.key === 'ArrowLeft' && event.target.closest?.('.header__submenu-nested-disclosure[open]') && supportsDesktopHeaderHover()) {
      event.preventDefault();
      const nestedDisclosure = event.target.closest('.header__submenu-nested-disclosure');
      closeMegaMenu(nestedDisclosure);
      nestedDisclosure.querySelector(':scope > summary')?.focus();
      return;
    }

    if (event.key !== 'Escape') return;

    if (isMobileHeaderViewport()) {
      const openLocalization = event.target.closest?.('.header__localization-selector[open]');
      if (openLocalization) {
        event.preventDefault();
        openLocalization.open = false;
        openLocalization.querySelector(':scope > summary')?.focus();
        return;
      }

      const activeHeader = event.target.closest?.('[data-header]');
      const openMenu = event.target.closest?.('[data-header-mobile-drawer][data-open="true"]')?.closest('[data-header]')?.querySelector('.header__menu-disclosure[open]')
        || activeHeader?.querySelector('.header__menu-disclosure[open]')
        || (!activeHeader && document.querySelector('[data-header] .header__menu-disclosure[open]'));
      if (openMenu) {
        event.preventDefault();
        closeMobileMenu(openMenu);
        return;
      }
    }

    const activeHeader = event.target.closest?.('[data-header]');
    const focusTargets = [];
    const openDetails = activeHeader?.querySelectorAll('details[open]')
      || document.querySelectorAll('[data-header] details[open]');
    openDetails.forEach((details) => {
      if (details.matches('.header__submenu-disclosure')) focusTargets.push(details.querySelector(':scope > summary'));
      if (details.matches('.header__menu-disclosure')) focusTargets.push(details.querySelector(':scope > summary'));
      if (details.matches('.header__submenu-disclosure, .header__submenu-nested-disclosure') && shouldAnimateHeaderSubmenu(details)) {
        closeMegaMenu(details);
      } else {
        details.open = false;
      }
    });
    focusTargets.find(Boolean)?.focus();
  });

  initializeHeaderDisclosures();
  initializeDesktopMegaMenuObservers();
  document.querySelectorAll('[data-header] > .header__inner > .header__menu-disclosure').forEach((disclosure) => syncMobileDrawer(disclosure));
  syncHeaderMenuScrollLock();
  document.addEventListener('shopify:section:load', (event) => {
    initializeHeaderDisclosures(event.target);
    initializeDesktopMegaMenuObservers(event.target);
    event.target.querySelectorAll?.('[data-header] > .header__inner > .header__menu-disclosure').forEach((disclosure) => syncMobileDrawer(disclosure));
    syncHeaderMenuScrollLock();
  });
  document.addEventListener('shopify:section:unload', (event) => {
    if (event.target.contains?.(headerBreakpointFocusContext?.header)) headerBreakpointFocusContext = null;
    event.target.querySelectorAll?.('[data-header]').forEach(resetDesktopMegaMenuBackground);
    event.target.querySelectorAll?.('.header__submenu-disclosure, .header__submenu-nested-disclosure').forEach((details) => {
      clearMegaMenuHoverTimer(details);
      resetDesktopMegaMenuPresentation(details);
      disconnectDesktopMegaMenuObserver(details);
      megaMenuAnimations.get(details)?.cancel();
      megaMenuAnimations.delete(details);
      mobileMegaMenuMotions.get(details)?.animation.cancel();
      mobileMegaMenuMotions.delete(details);
      details.open = false;
      syncHeaderDisclosureAria(details);
    });
    event.target.querySelectorAll?.('[data-header] > .header__inner > .header__menu-disclosure').forEach((disclosure) => {
      clearMobileDrawerMotion(disclosure);
      disclosure.open = false;
      syncMobileDrawer(disclosure);
    });
    syncHeaderMenuScrollLock();
    scheduleResponsiveHeaderSync();
  });

  document.addEventListener('click', (event) => {
    const option = event.target.closest?.('[data-header-country-option]');
    if (option) {
      const picker = option.closest('[data-header-country-picker]');
      const input = picker?.querySelector('[data-header-country-input]');
      if (!input) return;

      input.value = option.dataset.countryCode;
      option.closest('form')?.submit();
      return;
    }

    const languageOption = event.target.closest?.('[data-header-language-option]');
    if (!languageOption) return;

    const picker = languageOption.closest('[data-header-language-picker]');
    const input = picker?.querySelector('[data-header-language-input]');
    if (!input) return;

    input.value = languageOption.dataset.languageCode;
    languageOption.closest('form')?.submit();
  });

  document.addEventListener('input', (event) => {
    const searchInput = event.target.closest?.('[data-header-localization-search]');
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim().toLocaleLowerCase();
    const popover = searchInput.closest('[data-header-localization-popover]');
    popover?.querySelectorAll('[data-header-country-option]').forEach((option) => {
      option.hidden = searchTerm.length > 0 && !option.textContent.toLocaleLowerCase().includes(searchTerm);
    });
  });

  document.addEventListener('shopify:block:select', (event) => {
    const details = event.target.closest?.('.header__submenu-disclosure');
    if (!details) return;

    const header = details.closest('[data-header]');
    const mobileDrawer = header?.querySelector('.header__menu-disclosure');
    if (mobileDrawer && window.matchMedia('(max-width: 899px)').matches) mobileDrawer.open = true;
    openHeaderSubmenu(details);
  });

  const headerSearchReturnFocus = new WeakMap();
  const headerSearchRequests = new WeakMap();
  const headerSearchTimers = new WeakMap();

  const syncHeaderSearchClearButton = (input) => {
    const clearButton = input.closest('[data-header-search-form]')?.querySelector('[data-header-search-clear]');
    if (clearButton) clearButton.hidden = input.value.length === 0;
  };

  const createHeaderSearchLink = (label, url, className) => {
    const link = document.createElement('a');
    link.className = className;
    link.href = url;
    link.setAttribute('role', 'option');
    if (label) link.textContent = label;
    return link;
  };

  const formatHeaderSearchPrice = (price, currencyCode) => {
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice)) return price || '';
    return new Intl.NumberFormat(document.documentElement.lang || undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
    }).format(numericPrice);
  };

  const renderHeaderSearchProducts = (panel, products) => {
    panel.replaceChildren();
    if (!products.length) {
      const empty = document.createElement('p');
      empty.className = 'header-search-modal__empty';
      empty.textContent = 'No products found.';
      panel.append(empty);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'header-search-modal__product-grid';
    grid.setAttribute('role', 'listbox');
    products.slice(0, 6).forEach((product) => {
      const card = createHeaderSearchLink('', product.url, 'header-search-modal__product');
      if (product.image) {
        const image = document.createElement('img');
        image.className = 'header-search-modal__product-image';
        image.src = product.image;
        image.alt = product.image_alt || product.title;
        image.loading = 'lazy';
        card.append(image);
      }
      const title = document.createElement('span');
      title.className = 'header-search-modal__product-title';
      title.textContent = product.title;
      card.append(title);
      if (product.price !== undefined && product.price !== null) {
        const price = document.createElement('span');
        price.className = 'header-search-modal__product-price';
        price.textContent = formatHeaderSearchPrice(product.price, panel.closest('[data-header-search-modal]')?.dataset.currencyCode);
        card.append(price);
      }
      grid.append(card);
    });
    panel.append(grid);
  };

  const renderHeaderSearchCollections = (panel, collections) => {
    panel.replaceChildren();
    if (!collections.length) return;

    const grid = document.createElement('div');
    grid.className = 'header-search-modal__collection-grid';
    grid.setAttribute('role', 'listbox');
    collections.slice(0, 6).forEach((collection) => {
      const card = createHeaderSearchLink('', collection.url, 'header-search-modal__collection');
      if (collection.image) {
        const image = document.createElement('img');
        image.className = 'header-search-modal__collection-image';
        image.src = collection.image;
        image.alt = collection.image_alt || collection.title;
        image.loading = 'lazy';
        card.append(image);
      }
      const title = document.createElement('span');
      title.className = 'header-search-modal__collection-title';
      title.textContent = collection.title;
      card.append(title);
      const productCount = collection.product_count || collection.products_count;
      if (productCount !== undefined) {
        const count = document.createElement('span');
        count.className = 'header-search-modal__collection-count';
        count.textContent = `${productCount} ${Number(productCount) === 1 ? 'Product' : 'Products'}`;
        card.append(count);
      }
      grid.append(card);
    });
    panel.append(grid);
  };

  const setHeaderSearchTab = (dialog, tabName) => {
    const input = dialog.querySelector('[data-header-search-input]');
    dialog.querySelectorAll('[data-header-search-tab]').forEach((tab) => {
      const isActive = tab.dataset.headerSearchTab === tabName;
      tab.setAttribute('aria-selected', String(!tab.hidden && isActive));
      tab.tabIndex = !tab.hidden && isActive ? 0 : -1;
    });
    dialog.querySelectorAll('[data-header-search-panel]').forEach((panel) => {
      const isActive = panel.dataset.headerSearchPanel === tabName;
      panel.hidden = !isActive;
      if (isActive && input) input.setAttribute('aria-controls', panel.id);
    });
  };

  const clearHeaderPredictiveSearch = (dialog) => {
    headerSearchRequests.get(dialog)?.abort();
    window.clearTimeout(headerSearchTimers.get(dialog));
    dialog.querySelector('[data-header-search-predictive]')?.setAttribute('hidden', '');
    dialog.querySelector('[data-header-search-navigation]')?.removeAttribute('hidden');
    dialog.querySelector('[data-header-search-input]')?.setAttribute('aria-expanded', 'false');
  };

  const requestHeaderPredictiveSearch = (input) => {
    const dialog = input.closest('[data-header-search-modal]');
    const term = input.value.trim();
    if (!dialog) return;

    if (term.length < 2) {
      clearHeaderPredictiveSearch(dialog);
      return;
    }

    window.clearTimeout(headerSearchTimers.get(dialog));
    headerSearchTimers.set(dialog, window.setTimeout(async () => {
      headerSearchRequests.get(dialog)?.abort();
      const controller = new AbortController();
      headerSearchRequests.set(dialog, controller);

      try {
        const endpoint = new URL(dialog.dataset.predictiveSearchUrl, window.location.origin);
        endpoint.searchParams.set('q', term);
        endpoint.searchParams.set('resources[type]', 'product,collection');
        endpoint.searchParams.set('resources[limit]', '6');
        endpoint.searchParams.set('resources[limit_scope]', 'each');
        endpoint.searchParams.set('resources[options][unavailable_products]', 'hide');
        const collectionEndpoint = new URL(endpoint);
        collectionEndpoint.searchParams.set('resources[type]', 'collection');
        collectionEndpoint.searchParams.set('resources[limit]', '6');
        collectionEndpoint.searchParams.delete('resources[limit_scope]');
        const [response, collectionResponse] = await Promise.all([
          fetch(endpoint, { signal: controller.signal, headers: { Accept: 'application/json' } }),
          fetch(collectionEndpoint, { signal: controller.signal, headers: { Accept: 'application/json' } }),
        ]);
        if (!response.ok || !collectionResponse.ok) throw new Error('Predictive search request failed');
        const [payload, collectionPayload] = await Promise.all([response.json(), collectionResponse.json()]);
        if (input.value.trim() !== term) return;

        const resources = payload.resources?.results || {};
        const products = resources.products || [];
        const collections = collectionPayload.resources?.results?.collections || resources.collections || [];
        renderHeaderSearchProducts(dialog.querySelector('[data-header-search-panel="products"]'), products);
        renderHeaderSearchCollections(dialog.querySelector('[data-header-search-panel="collections"]'), collections);

        const productsTab = dialog.querySelector('[data-header-search-tab="products"]');
        const collectionsTab = dialog.querySelector('[data-header-search-tab="collections"]');
        const tabs = dialog.querySelector('.header-search-modal__tabs');
        const empty = dialog.querySelector('[data-header-search-empty]');
        productsTab.hidden = products.length === 0;
        collectionsTab.hidden = collections.length === 0;
        tabs.hidden = products.length === 0 && collections.length === 0;
        empty.hidden = products.length > 0 || collections.length > 0;
        if (products.length > 0) setHeaderSearchTab(dialog, 'products');
        else if (collections.length > 0) setHeaderSearchTab(dialog, 'collections');
        else {
          empty.textContent = `No results found for “${term}”. Check the spelling or use a different word or phrase.`;
          dialog.querySelectorAll('[data-header-search-panel]').forEach((panel) => { panel.hidden = true; });
        }

        const viewAll = dialog.querySelector('[data-header-search-view-all]');
        if (viewAll) {
          const allResultsUrl = new URL(input.closest('form').action, window.location.origin);
          allResultsUrl.searchParams.set('q', term);
          viewAll.href = allResultsUrl.toString();
        }
        dialog.querySelector('[data-header-search-navigation]')?.setAttribute('hidden', '');
        dialog.querySelector('[data-header-search-predictive]')?.removeAttribute('hidden');
        input.setAttribute('aria-expanded', 'true');
      } catch (error) {
        if (error.name !== 'AbortError') clearHeaderPredictiveSearch(dialog);
      }
    }, 180));
  };

  document.addEventListener('click', (event) => {
    const openButton = event.target.closest?.('[data-header-search-open]');
    if (openButton) {
      const dialogId = openButton.getAttribute('aria-controls');
      const dialog = dialogId ? document.getElementById(dialogId) : null;
      if (!dialog || dialog.open) return;

      event.preventDefault();
      headerSearchReturnFocus.set(dialog, openButton);
      dialog.showModal();
      window.requestAnimationFrame(() => {
        const input = dialog.querySelector('[data-header-search-input]');
        input?.focus();
        if (input) syncHeaderSearchClearButton(input);
      });
      return;
    }

    const closeButton = event.target.closest?.('[data-header-search-close]');
    if (closeButton) closeButton.closest('[data-header-search-modal]')?.close();

    const clearButton = event.target.closest?.('[data-header-search-clear]');
    if (clearButton) {
      const input = clearButton.closest('[data-header-search-form]')?.querySelector('[data-header-search-input]');
      if (input) {
        input.value = '';
        syncHeaderSearchClearButton(input);
        clearHeaderPredictiveSearch(clearButton.closest('[data-header-search-modal]'));
        input.focus();
      }
    }
  });

  document.addEventListener('input', (event) => {
    const input = event.target.closest?.('[data-header-search-input]');
    if (input) {
      syncHeaderSearchClearButton(input);
      requestHeaderPredictiveSearch(input);
    }
  });

  document.addEventListener('click', (event) => {
    const tab = event.target.closest?.('[data-header-search-tab]');
    if (tab) setHeaderSearchTab(tab.closest('[data-header-search-modal]'), tab.dataset.headerSearchTab);
  });

  document.addEventListener('keydown', (event) => {
    const tab = event.target.closest?.('[data-header-search-tab]');
    if (!tab) return;

    const dialog = tab.closest('[data-header-search-modal]');
    const visibleTabs = [...dialog.querySelectorAll('[data-header-search-tab]:not([hidden])')];
    const currentIndex = visibleTabs.indexOf(tab);
    if (currentIndex < 0) return;

    let nextIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % visibleTabs.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + visibleTabs.length) % visibleTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = visibleTabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = visibleTabs[nextIndex];
    setHeaderSearchTab(dialog, nextTab.dataset.headerSearchTab);
    nextTab.focus();
  });

  document.addEventListener('click', (event) => {
    const dialog = event.target.closest?.('[data-header-search-modal]');
    if (dialog && event.target === dialog) dialog.close();
  });

  document.addEventListener('close', (event) => {
    const dialog = event.target;
    if (!dialog.matches?.('[data-header-search-modal]')) return;
    clearHeaderPredictiveSearch(dialog);
    headerSearchReturnFocus.get(dialog)?.focus();
    headerSearchReturnFocus.delete(dialog);
  }, true);
}
