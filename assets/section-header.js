if (!window.SpinelHeaderMenus) {
  window.SpinelHeaderMenus = true;
  const megaMenuAnimations = new WeakMap();
  const mobileMegaMenuMotions = new WeakMap();
  const mobileDrawerMotions = new WeakMap();
  const megaMenuHoverTimers = new WeakMap();
  const cartFeedbackHeaderStates = new WeakMap();
  const mobileMenuReturnFocus = new WeakMap();
  const headerMenuEasing = 'cubic-bezier(0.3, 1, 0.3, 1)';
  let transparentHeaderFrame = 0;
  let headerScrollLockFallbackStyles = null;

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

    const hasOpenMenu = Boolean(header.querySelector('details[open]'));
    const showSurface = isScrolled || hasOpenMenu;
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
    scheduleResponsiveHeaderSync();
    syncHeaderMenuScrollLock();
    if (!isMobileHeaderViewport()) {
      document.querySelectorAll('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]').forEach((details) => closeMegaMenu(details, true));
    }
    document.querySelectorAll('[data-header] > .header__inner > .header__menu-disclosure').forEach((disclosure) => {
      if (!isMobileHeaderViewport()) mobileDrawerMotions.get(disclosure)?.finish();
      syncMobileDrawer(disclosure);
    });
  });
  document.addEventListener('shopify:section:load', (event) => initializeResponsiveHeaders(event.target));

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

    if (immediate || !panel || type === 'none' || reduceMotion) {
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
        details.open = false;
        syncHeaderDisclosureAria(details);
        syncHeaderMenuScrollLock();
        animation.cancel();
        if (focusAfterMotion) focusWithoutScroll(details.querySelector(':scope > summary'));
      })
      .catch(() => {});
  };

  const supportsMegaMenuHover = () => window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;
  const shouldAnimateHeaderSubmenu = (details) => details.matches(
    '.header__submenu-disclosure, .header__submenu-nested-disclosure'
  );

  const syncHeaderDisclosureAria = (details) => {
    const summary = details.querySelector(':scope > summary[aria-controls]');
    if (!summary) return;
    const isOpen = details.open;
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

  const closeOtherHeaderSubmenus = (details) => {
    const header = details.closest('[data-header]');
    const openMenus = details.matches('.header__submenu-nested-disclosure')
      ? details.closest('.header__submenu-disclosure')?.querySelectorAll('.header__submenu-nested-disclosure[open]')
      : header?.querySelectorAll('.header__submenu-disclosure[open]');

    openMenus?.forEach((menu) => {
      if (menu === details) return;
      if (shouldAnimateHeaderSubmenu(menu)) closeMegaMenu(menu, isMobileHeaderViewport());
      else menu.open = false;
    });
  };

  const openHeaderSubmenu = (details) => {
    clearMegaMenuHoverTimer(details);

    if (details.open) {
      if (details.dataset.closing !== 'true') return;
      animateMegaMenuOpen(details, isMobileHeaderViewport());
      return;
    }

    closeOtherHeaderSubmenus(details);
    positionHeaderSubmenu(details);
    const responsiveHeader = details.closest('[data-transparent-header="true"], [data-floating-header="true"]');
    if (responsiveHeader?.dataset.transparentHeader === 'true') {
      responsiveHeader.classList.add('header--surface-visible');
      setTransparentHeaderColorScheme(responsiveHeader, true);
    }
    details.dataset.opening = 'true';
    details.open = true;
    syncHeaderDisclosureAria(details);
    positionNestedHeaderSubmenu(details);
    syncHeaderMenuScrollLock();
    if (responsiveHeader) {
      scheduleResponsiveHeaderSync();
    }
    animateMegaMenuOpen(details, isMobileHeaderViewport());
  };

  window.addEventListener('resize', () => {
    document.querySelectorAll('.header__submenu-disclosure[open]').forEach(positionHeaderSubmenu);
    document.querySelectorAll('.header__submenu-nested-disclosure[open]').forEach(positionNestedHeaderSubmenu);
  });

  document.addEventListener('pointerover', (event) => {
    if (!supportsMegaMenuHover()) return;
    const nestedDetails = event.target.closest?.('.header__submenu-disclosure:not(.header__submenu-disclosure--mega) .header__submenu-nested-disclosure');
    if (nestedDetails && !nestedDetails.contains(event.relatedTarget)) {
      clearMegaMenuHoverTimer(nestedDetails);
      megaMenuHoverTimers.set(nestedDetails, window.setTimeout(() => openHeaderSubmenu(nestedDetails), 120));
      return;
    }

    const details = event.target.closest?.('.header__submenu-disclosure--mega.header__submenu-disclosure--hover');
    if (!details || details.contains(event.relatedTarget)) return;

    openHeaderSubmenu(details);
  });

  document.addEventListener('pointerout', (event) => {
    if (!supportsMegaMenuHover()) return;
    const nestedDetails = event.target.closest?.('.header__submenu-disclosure:not(.header__submenu-disclosure--mega) .header__submenu-nested-disclosure');
    if (nestedDetails && !nestedDetails.contains(event.relatedTarget)) {
      clearMegaMenuHoverTimer(nestedDetails);
      megaMenuHoverTimers.set(nestedDetails, window.setTimeout(() => closeMegaMenu(nestedDetails), 180));
      return;
    }

    const details = event.target.closest?.('.header__submenu-disclosure--mega.header__submenu-disclosure--hover');
    if (!details || details.contains(event.relatedTarget)) return;

    clearMegaMenuHoverTimer(details);
    megaMenuHoverTimers.set(details, window.setTimeout(() => closeMegaMenu(details), 160));
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
    if (submenu?.matches('.header__submenu-disclosure--mega.header__submenu-disclosure--hover') && supportsMegaMenuHover()) {
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

    if (event.key === 'ArrowRight' && disclosure?.matches('.header__submenu-nested-disclosure') && supportsMegaMenuHover()) {
      event.preventDefault();
      openHeaderSubmenu(disclosure);
      window.requestAnimationFrame(() => disclosure.querySelector(':scope > .header__submenu-nested a')?.focus());
      return;
    }

    if (event.key === 'ArrowLeft' && event.target.closest?.('.header__submenu-nested-disclosure[open]') && supportsMegaMenuHover()) {
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

      const openMenu = event.target.closest?.('[data-header-mobile-drawer][data-open="true"]')?.closest('[data-header]')?.querySelector('.header__menu-disclosure[open]')
        || document.querySelector('[data-header] .header__menu-disclosure[open]');
      if (openMenu) {
        event.preventDefault();
        closeMobileMenu(openMenu);
        return;
      }
    }

    const focusTargets = [];
    document.querySelectorAll('[data-header] details[open]').forEach((details) => {
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
  document.querySelectorAll('[data-header] > .header__inner > .header__menu-disclosure').forEach((disclosure) => syncMobileDrawer(disclosure));
  syncHeaderMenuScrollLock();
  document.addEventListener('shopify:section:load', (event) => {
    initializeHeaderDisclosures(event.target);
    event.target.querySelectorAll?.('[data-header] > .header__inner > .header__menu-disclosure').forEach((disclosure) => syncMobileDrawer(disclosure));
    syncHeaderMenuScrollLock();
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
    dialog.querySelectorAll('[data-header-search-tab]').forEach((tab) => {
      const isActive = tab.dataset.headerSearchTab === tabName;
      tab.setAttribute('aria-selected', String(!tab.hidden && isActive));
    });
    dialog.querySelectorAll('[data-header-search-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.headerSearchPanel !== tabName;
    });
  };

  const clearHeaderPredictiveSearch = (dialog) => {
    headerSearchRequests.get(dialog)?.abort();
    window.clearTimeout(headerSearchTimers.get(dialog));
    dialog.querySelector('[data-header-search-predictive]')?.setAttribute('hidden', '');
    dialog.querySelector('[data-header-search-navigation]')?.removeAttribute('hidden');
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
