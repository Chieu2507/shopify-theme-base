const headerInstances = new WeakMap();
const headerLockOwners = new Set();

const syncDocumentLock = () => {
  for (const owner of headerLockOwners) {
    if (!owner.isConnected) headerLockOwners.delete(owner);
  }
  document.documentElement.classList.toggle('header-lock', headerLockOwners.size > 0);
};

const setDocumentLock = (root, locked) => {
  if (locked) headerLockOwners.add(root);
  else headerLockOwners.delete(root);
  syncDocumentLock();
};

const initHeader = (root) => {
  if (!root || headerInstances.has(root)) return;

  const controller = new AbortController();
  const { signal } = controller;
  const select = (selector, scope = root) => scope?.querySelector(selector);
  const selectAll = (selector, scope = root) => Array.from(scope?.querySelectorAll(selector) || []);
  const desktopQuery = window.matchMedia('(min-width: 991px)');
  const dropdowns = selectAll('[data-header-dropdown]');
  const mobileMenu = select('[data-header-mobile-menu]');
  const mobileMenuPanel = select('.header__mobile-menu-panel');
  const searchDrawer = select('[data-header-search-drawer]');
  const searchPanel = select('.header__drawer--search .header__drawer-panel');
  const mobileSections = selectAll('[data-header-mobile-section]');
  const mobileDetails = selectAll('.header__mobile-nav details');
  let closeDropdownTimer = 0;
  let lastScrollY = window.scrollY;
  let returnFocus = null;

  const isLayerOpen = () => root.classList.contains('is-mobile-menu-open') || root.classList.contains('is-search-open');

  const updateLock = () => {
    const menuOpen = desktopQuery.matches && dropdowns.some((dropdown) => dropdown.open);
    setDocumentLock(root, menuOpen || isLayerOpen());
  };

  const syncColorScheme = () => {
    if (!root.classList.contains('header--transparent')) return;
    const defaultClass = root.dataset.defaultColorClass;
    const transparentClass = root.dataset.transparentColorClass;
    const useDefault = root.classList.contains('is-menu-open') || isLayerOpen();
    if (defaultClass === transparentClass) return;
    if (defaultClass) root.classList.toggle(defaultClass, useDefault);
    if (transparentClass) root.classList.toggle(transparentClass, !useDefault);
  };

  const syncMobileSubmenuState = () => {
    mobileMenuPanel?.classList.toggle('is-mobile-submenu-open', mobileSections.some((section) => section.open));
  };

  const getMobileSubmenu = (details) => details?.querySelector(':scope > .header__mobile-submenu');

  const closeMobileSubmenu = (details) => {
    if (!details?.open) return;
    const panel = getMobileSubmenu(details);
    if (!panel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      details.open = false;
      syncMobileSubmenuState();
      return;
    }

    panel.classList.add('is-mobile-submenu-closing');
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      panel.classList.remove('is-mobile-submenu-closing');
      details.open = false;
      syncMobileSubmenuState();
    };
    panel.addEventListener('animationend', finish, { once: true, signal });
    window.setTimeout(finish, 360);
  };

  const syncMegaPanelHeight = (dropdown) => {
    const panel = select('[data-header-mega-panel]', dropdown);
    if (!panel || !dropdown.open) {
      panel?.style.setProperty('--header-mega-height', '0px');
      return 0;
    }

    const headerHeight = Number.parseFloat(getComputedStyle(root).getPropertyValue('--header-height')) || 80;
    const maximum = Math.min(620, Math.max(0, window.innerHeight - headerHeight));
    const height = Math.min(Math.max(0, panel.scrollHeight), maximum);
    panel.style.setProperty('--header-mega-height', `${height}px`);
    return height;
  };

  const syncDropdownState = () => {
    const openDropdowns = dropdowns.filter((dropdown) => dropdown.open);
    root.classList.toggle('is-menu-open', openDropdowns.length > 0);
    let menuHeight = 0;
    dropdowns.forEach((dropdown) => {
      const height = syncMegaPanelHeight(dropdown);
      if (dropdown.open) menuHeight = Math.max(menuHeight, height);
    });
    root.style.setProperty('--header-menu-height', `${menuHeight}px`);
    syncColorScheme();
    updateLock();
  };

  const closeDropdowns = () => {
    window.clearTimeout(closeDropdownTimer);
    dropdowns.forEach((dropdown) => {
      dropdown.open = false;
    });
    syncDropdownState();
  };

  const closeLayers = ({ restoreFocus = false } = {}) => {
    const wasOpen = isLayerOpen();
    root.classList.remove('is-mobile-menu-open', 'is-search-open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
    searchDrawer?.setAttribute('aria-hidden', 'true');
    if (mobileMenu) mobileMenu.inert = true;
    if (searchDrawer) searchDrawer.inert = true;
    select('[data-header-mobile-open]')?.setAttribute('aria-expanded', 'false');
    mobileDetails.forEach((details) => {
      details.open = false;
      getMobileSubmenu(details)?.classList.remove('is-mobile-submenu-closing');
    });
    syncMobileSubmenuState();
    syncColorScheme();
    updateLock();
    if (restoreFocus && wasOpen && returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  };

  const openLayer = (name, trigger) => {
    closeDropdowns();
    closeLayers();
    const target = name === 'mobile' ? mobileMenu : searchDrawer;
    const panel = name === 'mobile' ? mobileMenuPanel : searchPanel;
    if (!target || !panel) return;
    returnFocus = trigger;
    root.classList.add(name === 'mobile' ? 'is-mobile-menu-open' : 'is-search-open');
    target.setAttribute('aria-hidden', 'false');
    target.inert = false;
    syncColorScheme();
    if (name === 'mobile') trigger?.setAttribute('aria-expanded', 'true');
    updateLock();
    window.requestAnimationFrame(() => {
      panel.focus({ preventScroll: true });
      if (name === 'search') select('input[type="search"]', searchDrawer)?.focus({ preventScroll: true });
    });
  };

  const submitLocalization = (option, valueSelector, formSelector) => {
    const container = option.closest(formSelector) || select(formSelector);
    const form = container?.matches('form') ? container : select('form', container);
    const input = select(valueSelector, form);
    if (!form || !input || !option.value) return;
    input.value = option.value;
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.submit();
  };

  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener('toggle', syncDropdownState, { signal });
    if (root.dataset.dropdownTrigger !== 'hover') return;

    dropdown.addEventListener('pointerenter', () => {
      if (!desktopQuery.matches) return;
      window.clearTimeout(closeDropdownTimer);
      dropdowns.forEach((item) => {
        if (item !== dropdown) item.open = false;
      });
      dropdown.open = true;
      syncDropdownState();
    }, { signal });

    dropdown.addEventListener('pointerleave', () => {
      if (!desktopQuery.matches) return;
      closeDropdownTimer = window.setTimeout(() => {
        if (!dropdown.matches(':hover')) {
          dropdown.open = false;
          syncDropdownState();
        }
      }, 160);
    }, { signal });
  });

  mobileSections.forEach((section) => {
    section.addEventListener('toggle', () => {
      if (section.open) {
        mobileSections.forEach((other) => {
          if (other !== section) other.open = false;
        });
      }
      window.setTimeout(syncMobileSubmenuState, 0);
    }, { signal });
  });

  root.addEventListener('click', (event) => {
    const mobileTrigger = event.target.closest('[data-header-mobile-open]');
    const searchTrigger = event.target.closest('[data-header-search-open]');
    const mobileBack = event.target.closest('[data-header-mobile-back]');
    const closeTrigger = event.target.closest('[data-header-close-layer], [data-header-close-mobile]');
    const countryOption = event.target.closest('[data-header-country-option]');
    const languageOption = event.target.closest('[data-header-language-option]');
    const cartTrigger = event.target.closest('[data-cart-drawer-open]');

    if (mobileTrigger) {
      event.preventDefault();
      openLayer('mobile', mobileTrigger);
    } else if (searchTrigger) {
      event.preventDefault();
      openLayer('search', searchTrigger);
    } else if (mobileBack) {
      event.preventDefault();
      closeMobileSubmenu(mobileBack.closest('details'));
    } else if (closeTrigger) {
      event.preventDefault();
      closeLayers({ restoreFocus: true });
    } else if (countryOption) {
      submitLocalization(countryOption, '[data-header-country-value]', '[data-header-country-form]');
    } else if (languageOption) {
      submitLocalization(languageOption, '[data-header-language-value]', '[data-header-language-form]');
    } else if (cartTrigger) {
      closeDropdowns();
      closeLayers();
    }
  }, { signal });

  root.addEventListener('shopify:block:select', (event) => {
    const dropdown = event.target.closest?.('[data-header-dropdown]');
    if (!dropdown) return;
    dropdowns.forEach((item) => {
      item.open = item === dropdown;
    });
    syncDropdownState();
  }, { signal });

  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) {
      closeDropdowns();
      closeLayers();
    }
  }, { signal });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    closeDropdowns();
    closeLayers({ restoreFocus: true });
  }, { signal });

  const updateScrollState = () => {
    if (!root.classList.contains('header--sticky')) return;
    const currentScrollY = window.scrollY;
    root.classList.toggle('is-scrolled', currentScrollY > 8);
    if (!desktopQuery.matches) {
      if (currentScrollY > lastScrollY + 3 && currentScrollY > 80 && !isLayerOpen()) root.classList.add('is-scroll-hidden');
      if (currentScrollY < lastScrollY - 3 || currentScrollY <= 8 || isLayerOpen()) root.classList.remove('is-scroll-hidden');
    } else {
      root.classList.remove('is-scroll-hidden');
    }
    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', updateScrollState, { passive: true, signal });
  window.addEventListener('resize', syncDropdownState, { signal });
  desktopQuery.addEventListener?.('change', () => {
    closeDropdowns();
    closeLayers();
    root.classList.remove('is-scroll-hidden');
  }, { signal });

  const destroy = () => {
    window.clearTimeout(closeDropdownTimer);
    closeDropdowns();
    closeLayers();
    controller.abort();
    setDocumentLock(root, false);
    root.removeAttribute('data-header-ready');
    headerInstances.delete(root);
  };

  root.dataset.headerReady = 'true';
  headerInstances.set(root, destroy);
  if (mobileMenu) mobileMenu.inert = true;
  if (searchDrawer) searchDrawer.inert = true;
  syncDropdownState();
  updateScrollState();
};

const initHeaders = (scope = document) => {
  if (scope.matches?.('[data-header-root]')) initHeader(scope);
  scope.querySelectorAll?.('[data-header-root]').forEach(initHeader);
};

initHeaders();

document.addEventListener('shopify:section:load', (event) => initHeaders(event.target));
document.addEventListener('shopify:section:unload', (event) => {
  const root = event.target.matches?.('[data-header-root]')
    ? event.target
    : event.target.querySelector?.('[data-header-root]');
  headerInstances.get(root)?.();
});
