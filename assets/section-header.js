if (!window.SpinelHeaderMenus) {
  window.SpinelHeaderMenus = true;
  const megaMenuAnimations = new WeakMap();
  const megaMenuHoverTimers = new WeakMap();
  const cartFeedbackHeaderStates = new WeakMap();
  let transparentHeaderFrame = 0;

  const syncHeaderMenuScrollLock = () => {
    const isMobile = window.matchMedia('(max-width: 899px)').matches;
    const shouldLock = isMobile
      ? Boolean(document.querySelector('.header__menu-disclosure[open]'))
      : Boolean(document.querySelector('.header__submenu-disclosure[open]'));
    const root = document.documentElement;
    const isLocked = root.classList.contains('header-menu-scroll-locked');

    if (shouldLock && !isLocked) {
      const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth);
      root.style.setProperty('--header-menu-scrollbar-width', `${scrollbarWidth}px`);
      root.classList.add('header-menu-scroll-locked');
      window.SpinelSmoothScroll?.cancel();
      return;
    }

    if (!shouldLock && isLocked) {
      root.classList.remove('header-menu-scroll-locked');
      root.style.removeProperty('--header-menu-scrollbar-width');
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
    const isDesktopMegaMenu = isMegaMenu && window.matchMedia('(min-width: 900px)').matches;
    const isNestedMenu = details.matches('.header__submenu-nested-disclosure');
    const panel = isDesktopMegaMenu
      ? details.querySelector('.header__mega-surface')
      : isMegaMenu
        ? details.querySelector('.header__mega-panel')
        : isNestedMenu
          ? details.querySelector(':scope > .header__submenu-nested')
          : details.querySelector(':scope > .header__submenu');
    const type = isNestedMenu
      ? 'slide_right'
      : isDesktopMegaMenu
        ? 'reveal_down'
        : isTopLevelMenu
          ? 'reveal_clip'
          : 'slide_down';
    const configuredDuration = Number.parseInt(header?.dataset.megaMenuAnimationDuration || '250', 10);
    const duration = isTopLevelMenu ? Math.max(configuredDuration, 480) : configuredDuration;
    const delay = isTopLevelMenu ? 90 : 0;
    return { panel, type, duration, delay };
  };

  const getMegaMenuFrames = (type, opening) => {
    let frames;

    if (type === 'reveal_down') {
      frames = [{ translate: '0 -100%' }, { translate: '0 0' }];
    } else if (type === 'reveal_clip') {
      frames = [
        { opacity: 1, clipPath: 'inset(0 0 100% 0)', translate: '0 -8px' },
        { opacity: 1, clipPath: 'inset(0 0 0 0)', translate: '0 0' }
      ];
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

  const animateMegaMenuOpen = (details) => {
    const { panel, type, duration, delay } = getMegaMenuAnimation(details);
    if (!panel || type === 'none' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    megaMenuAnimations.get(details)?.cancel();
    const animation = panel.animate(getMegaMenuFrames(type, true), {
      duration,
      delay,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
    megaMenuAnimations.set(details, animation);
    animation.finished
      .then(() => {
        if (megaMenuAnimations.get(details) !== animation) return;
        megaMenuAnimations.delete(details);
        animation.cancel();
      })
      .catch(() => {});
  };

  const closeMegaMenu = (details, immediate = false) => {
    if (!details.open || details.dataset.closing === 'true') return;

    const { panel, type, duration } = getMegaMenuAnimation(details);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    megaMenuAnimations.get(details)?.cancel();

    if (details.matches('.header__submenu-disclosure')) {
      details.querySelectorAll('.header__submenu-nested-disclosure[open]').forEach((nestedDetails) => {
        closeMegaMenu(nestedDetails, true);
      });
    }

    if (immediate || !panel || type === 'none' || reduceMotion) {
      megaMenuAnimations.delete(details);
      details.open = false;
      return;
    }

    details.dataset.closing = 'true';
    const animation = panel.animate(getMegaMenuFrames(type, false), {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both'
    });
    megaMenuAnimations.set(details, animation);
    animation.finished
      .then(() => {
        if (megaMenuAnimations.get(details) !== animation) return;
        megaMenuAnimations.delete(details);
        delete details.dataset.closing;
        details.open = false;
        animation.cancel();
      })
      .catch(() => {});
  };

  const supportsMegaMenuHover = () => window.matchMedia('(min-width: 900px) and (hover: hover) and (pointer: fine)').matches;
  const shouldAnimateHeaderSubmenu = (details) => details.matches(
    '.header__submenu-disclosure, .header__submenu-nested-disclosure'
  );

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

  const closeOtherHeaderSubmenus = (details) => {
    const header = details.closest('[data-header]');
    const openMenus = details.matches('.header__submenu-nested-disclosure')
      ? details.closest('.header__submenu-disclosure')?.querySelectorAll('.header__submenu-nested-disclosure[open]')
      : header?.querySelectorAll('.header__submenu-disclosure[open]');

    openMenus?.forEach((menu) => {
      if (menu === details) return;
      if (shouldAnimateHeaderSubmenu(menu)) closeMegaMenu(menu, true);
      else menu.open = false;
    });
  };

  const openHeaderSubmenu = (details) => {
    clearMegaMenuHoverTimer(details);

    if (details.open) {
      if (details.dataset.closing !== 'true') return;
      delete details.dataset.closing;
      animateMegaMenuOpen(details);
      return;
    }

    closeOtherHeaderSubmenus(details);
    positionHeaderSubmenu(details);
    details.dataset.opening = 'true';
    details.open = true;
    syncHeaderMenuScrollLock();
    if (details.closest('[data-transparent-header="true"], [data-floating-header="true"]')) {
      scheduleResponsiveHeaderSync();
    }
    animateMegaMenuOpen(details);
  };

  window.addEventListener('resize', () => {
    document.querySelectorAll('.header__submenu-disclosure[open]').forEach(positionHeaderSubmenu);
  });

  document.addEventListener('pointerover', (event) => {
    if (!supportsMegaMenuHover()) return;
    const details = event.target.closest?.('.header__submenu-disclosure--mega.header__submenu-disclosure--hover');
    if (!details || details.contains(event.relatedTarget)) return;

    openHeaderSubmenu(details);
  });

  document.addEventListener('pointerout', (event) => {
    if (!supportsMegaMenuHover()) return;
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
        if (toggle) toggle.setAttribute('aria-label', details.open ? details.dataset.closeLabel : details.dataset.openLabel);
      }

      if (details.matches?.('.header__menu-disclosure, .header__submenu-disclosure, .header__submenu-nested-disclosure')) {
        syncHeaderMenuScrollLock();
      }

      if (details.closest?.('[data-transparent-header="true"], [data-floating-header="true"]')) scheduleResponsiveHeaderSync();

      if (!details.matches?.('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]')) return;

      positionHeaderSubmenu(details);
      closeOtherHeaderSubmenus(details);

      if (details.dataset.opening === 'true') {
        delete details.dataset.opening;
        return;
      }
      if (shouldAnimateHeaderSubmenu(details)) animateMegaMenuOpen(details);
    },
    true
  );

  document.addEventListener('click', (event) => {
    const overlay = event.target.closest?.('[data-header-menu-overlay]');
    if (overlay) {
      const header = document.getElementById(overlay.dataset.headerMenuOverlay);
      header?.querySelectorAll('.header__submenu-disclosure[open], .header__submenu-nested-disclosure[open]').forEach((details) => {
        closeMegaMenu(details);
      });
      const mobileDrawer = header?.querySelector('.header__menu-disclosure[open]');
      if (mobileDrawer) mobileDrawer.open = false;
      return;
    }

    const summary = event.target.closest?.('summary');
    const submenu = summary?.parentElement;
    if (submenu?.matches('.header__submenu-disclosure--mega.header__submenu-disclosure--hover') && supportsMegaMenuHover()) {
      event.preventDefault();
      if (!submenu.open) openHeaderSubmenu(submenu);
      return;
    }

    if (submenu?.matches('.header__submenu-disclosure, .header__submenu-nested-disclosure') && shouldAnimateHeaderSubmenu(submenu)) {
      event.preventDefault();
      if (submenu.open) closeMegaMenu(submenu);
      else openHeaderSubmenu(submenu);
      return;
    }

    document.querySelectorAll('[data-header]').forEach((header) => {
      if (header.contains(event.target)) return;
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
    if (event.key !== 'Escape') return;
    document.querySelectorAll('[data-header] details[open]').forEach((details) => {
      if (details.matches('.header__submenu-disclosure, .header__submenu-nested-disclosure') && shouldAnimateHeaderSubmenu(details)) {
        closeMegaMenu(details);
      } else {
        details.open = false;
      }
    });
  });

  document.addEventListener('click', (event) => {
    const option = event.target.closest?.('[data-header-country-option]');
    if (!option) return;

    const picker = option.closest('[data-header-country-picker]');
    const input = picker?.querySelector('[data-header-country-input]');
    if (!input) return;

    input.value = option.dataset.countryCode;
    option.closest('form')?.submit();
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
