import { Pagination } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const instances = new WeakMap();
const collectionTabStates = new WeakMap();
const carouselSelector = '[data-product-carousel][data-layout="carousel"]';
const collectionTabSelector = '[data-collection-tab]';
const promoSelector = '[data-collection-tab-promo]';
const promoMobileSlotSelector = '[data-collection-tab-promo-mobile]';
const desktopBreakpoint = 768;

const toNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isMobileViewport = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(`(max-width: ${desktopBreakpoint - 0.02}px)`).matches;

const isVisible = (element) => element.getClientRects().length > 0;

const getCollectionTab = (element) => element?.closest?.(collectionTabSelector) || null;

const getCollectionTabPanel = (state) =>
  state?.collectionTab?.querySelector('[data-collection-tab-panel]') || null;

const getCollectionTabItemsRoot = (collectionTab) =>
  collectionTab?.querySelector('[data-collection-tab-products]') || null;

const getCollectionTabItemsContainer = (itemsRoot) => {
  const firstChild = itemsRoot?.firstElementChild;
  return firstChild?.classList.contains('swiper-wrapper') ? firstChild : itemsRoot;
};

const getCollectionTabPromoMobileSlot = (collectionTab) =>
  collectionTab?.querySelector(promoMobileSlotSelector) || null;

const getPromoElement = (item) => {
  if (!item) return null;
  if (item.matches?.(promoSelector)) return item;
  return item.querySelector?.(promoSelector) || null;
};

const getCollectionTabPromoItems = (collectionTab) => {
  const promoItems = [];
  collectionTab?.querySelectorAll(promoSelector).forEach((promoElement) => {
    const promoItem = promoElement.closest('.collection-tab-promo-block') || promoElement.parentElement;
    if (!promoItem || promoItems.includes(promoItem)) return;
    promoItems.push(promoItem);
  });
  return promoItems;
};

const getCollectionTabItems = (itemsContainer) =>
  Array.from(itemsContainer?.children || []).filter((child) =>
    child.matches('.product-collection-grid__item') || getPromoElement(child),
  );

const arraysMatch = (currentItems, nextItems) =>
  currentItems.length === nextItems.length && currentItems.every((item, index) => item === nextItems[index]);

const getDesiredCollectionTabItemOrder = (productItems, promoItems) => {
  const promoBuckets = Array.from({ length: productItems.length + 1 }, () => []);

  promoItems.forEach((promo) => {
    const promoElement = getPromoElement(promo);
    const requestedPosition = toNumber(promoElement.dataset.promoCardPosition, 1);
    const bucketIndex = Math.min(Math.max(requestedPosition - 1, 0), productItems.length);
    promoBuckets[bucketIndex].push(promo);
  });

  const desiredOrder = [];
  productItems.forEach((product, index) => {
    desiredOrder.push(...promoBuckets[index], product);
  });
  desiredOrder.push(...promoBuckets[productItems.length]);
  return desiredOrder;
};

const normalizePromoItem = (promoItem) => {
  promoItem.classList.add('collection-tab-promo-block', 'promo-card-slide', 'product-collection-grid__item');
};

const isCollectionTabPanelVisible = (state) => {
  const panel = getCollectionTabPanel(state);
  const collectionTab = state?.collectionTab;
  const itemsRoot = getCollectionTabItemsRoot(state?.collectionTab);
  const tabsRoot = collectionTab?.closest('[data-collection-tabs]');
  const tabLayout = tabsRoot?.querySelector('[data-tab-layout]');
  const isTabLayoutReady = !tabLayout || tabsRoot?.dataset.collectionTabsReady === 'true';
  const isActiveTab = !tabLayout || collectionTab?.dataset.tabActive === 'true';

  return (
    isTabLayoutReady &&
    isActiveTab &&
    (!panel || !panel.hidden) &&
    (!itemsRoot || isVisible(itemsRoot))
  );
};

const getCarouselLayoutStyle = (carousel) => {
  const styleAttribute = carousel?.getAttribute('style');
  if (styleAttribute === null || styleAttribute === undefined) return null;

  const customProperties = Array.from(carousel.style || [])
    .filter((property) => property.startsWith('--'))
    .map((property) => `${property}: ${carousel.style.getPropertyValue(property)};`)
    .join(' ');

  return customProperties || styleAttribute;
};

const scheduleCollectionTabSwiperUpdate = (state) => {
  if (!state) return;
  if (state.layoutFrame !== null) window.cancelAnimationFrame(state.layoutFrame);

  state.layoutFrame = window.requestAnimationFrame(() => {
    state.layoutFrame = null;
    if (!state.swiper || state.swiper.destroyed || !isCollectionTabPanelVisible(state)) return;
    state.swiper.update();
  });
};

const syncCollectionTabPromo = (state) => {
  const itemsRoot = getCollectionTabItemsRoot(state.collectionTab);
  const itemsContainer = getCollectionTabItemsContainer(itemsRoot);
  const promoMobileSlot = getCollectionTabPromoMobileSlot(state.collectionTab);
  if (!itemsRoot || !itemsContainer || !promoMobileSlot) return false;

  const promoItems = getCollectionTabPromoItems(state.collectionTab);
  const isCarousel = itemsRoot.matches(carouselSelector);
  const nextCarousel = isCarousel ? itemsRoot : null;
  const carouselChanged = state.carousel !== nextCarousel;
  if (carouselChanged) {
    const previousCarousel = state.carousel;
    if (previousCarousel) {
      destroyCollectionTabSwiper(state);
      instances.delete(previousCarousel);
    }

    state.carousel = nextCarousel;
    state.scope = nextCarousel ? getCarouselScope(nextCarousel) : state.collectionTab;
    state.carouselStyle = getCarouselLayoutStyle(nextCarousel);
    if (nextCarousel) instances.set(nextCarousel, state);

    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
      state.resizeObserver = null;
      observeSize(state);
    }
  }

  const usePromoMobileSlot = isMobileViewport();
  const promoItemsOnTop = promoItems.filter((promoItem) =>
    usePromoMobileSlot && getPromoElement(promoItem)?.dataset.promoCardShowOnTopMobile === 'true',
  );
  const promoItemsInList = promoItems.filter((promoItem) => !promoItemsOnTop.includes(promoItem));
  const productItems = getCollectionTabItems(itemsContainer).filter((item) => !getPromoElement(item));
  const desiredListItems = getDesiredCollectionTabItemOrder(productItems, promoItemsInList);
  const currentListItems = getCollectionTabItems(itemsContainer);
  const currentTopItems = getCollectionTabItems(promoMobileSlot);
  const listOrderChanged = !arraysMatch(currentListItems, desiredListItems);
  const topOrderChanged = !arraysMatch(currentTopItems, promoItemsOnTop);
  const slideClassChanged = promoItems.some((promoItem) =>
    promoItem.classList.contains('swiper-slide') !== (isCarousel && promoItemsInList.includes(promoItem)),
  );
  const slideSetChanged = state.slideItems !== null && !arraysMatch(state.slideItems, desiredListItems);
  const structureChanged = carouselChanged || listOrderChanged || topOrderChanged || slideClassChanged || slideSetChanged;

  const existingSwiper = state.swiper || itemsRoot.swiper;
  if (isCarousel && structureChanged && existingSwiper && !existingSwiper.destroyed) {
    state.swiper = existingSwiper;
    destroyCollectionTabSwiper(state);
  }

  promoItems.forEach(normalizePromoItem);
  if (topOrderChanged) promoItemsOnTop.forEach((promoItem) => promoMobileSlot.appendChild(promoItem));
  if (listOrderChanged) desiredListItems.forEach((item) => itemsContainer.appendChild(item));

  promoItems.forEach((promoItem) => {
    promoItem.classList.toggle('swiper-slide', isCarousel && promoItemsInList.includes(promoItem));
  });
  promoMobileSlot.hidden = promoItemsOnTop.length === 0;
  state.slideItems = desiredListItems;

  if (
    isCarousel &&
    desiredListItems.length > 0 &&
    isCollectionTabPanelVisible(state) &&
    (!state.swiper || state.swiper.destroyed)
  ) {
    createCollectionTabSwiper(state);
  } else if (state.swiper && !state.swiper.destroyed) {
    state.swiper.update();
  }

  if (state.swiper && !state.swiper.destroyed) scheduleCollectionTabSwiperUpdate(state);
  return structureChanged;
};

const refreshCollectionTabPromo = (state) => {
  if (!state?.collectionTab) return false;
  return syncCollectionTabPromo(state);
};

const scheduleCollectionTabPromoRefresh = (state) => {
  if (!state || state.syncFrame !== null) return;

  state.syncFrame = window.requestAnimationFrame(() => {
    state.syncFrame = null;
    refreshCollectionTabPromo(state);
  });
};

const getCarouselScope = (carousel) =>
  carousel.closest('[data-product-list], [data-blog-list], [data-collection-tab-carousel], [data-collection-card-list]') ||
  carousel.parentElement ||
  carousel;

const getSlidesPerView = (value) => {
  const slidesPerView = Math.min(6, toNumber(value, 1));
  return Math.max(1, Math.floor(slidesPerView));
};

const getMobileSlidesPerView = (carousel) => {
  const columns = getSlidesPerView(carousel.dataset.swiperColumnsMobile);

  // The preview is intended for a one-column mobile layout. Keep an explicit
  // two-column choice intact instead of silently replacing it with 1.2.
  if (columns === 1 && carousel.dataset.swiperNextSlidePreviewMobile === 'true') {
    return 1.2;
  }

  return columns;
};

const getPaginationType = (value) => (value === 'progress_bar' ? 'progressbar' : 'bullets');

const getControls = (carousel, scope) => {
  const previousSelector = carousel.dataset.swiperPreviousSelector;
  const nextSelector = carousel.dataset.swiperNextSelector;
  if (!previousSelector && !nextSelector) return null;

  return {
    scope,
    previous: previousSelector,
    next: nextSelector,
  };
};

const getFirstDataValue = (elements, key) => {
  for (const element of elements) {
    const value = element?.dataset?.[key];
    if (value !== undefined && value !== '') return value;
  }

  return null;
};

const buildOptions = (carousel, scope) => {
  const pagination =
    carousel.querySelector('[data-product-collection-pagination]') ||
    carousel.querySelector('[data-swiper-pagination]');
  const paginationType = getPaginationType(pagination?.dataset.paginationType || carousel.dataset.swiperPaginationType);
  const options = {
    slidesPerView: getMobileSlidesPerView(carousel),
    spaceBetween: toNumber(carousel.dataset.swiperGapMobile, 0),
    observer: true,
    observeParents: true,
    breakpoints: {
      [desktopBreakpoint]: {
        slidesPerView: getSlidesPerView(carousel.dataset.swiperColumnsDesktop),
        spaceBetween: toNumber(carousel.dataset.swiperGapDesktop, 0),
      },
    },
    controls: getControls(carousel, scope),
  };

  if (pagination) {
    options.modules = [Pagination];
    options.pagination = {
      el: pagination,
      type: paginationType,
      clickable: paginationType === 'bullets',
    };
  }

  return options;
};

const stopAutoplay = (state) => {
  if (state?.interval) window.clearInterval(state.interval);
  if (state) state.interval = null;
};

const restoreCarouselStyle = (state) => {
  if (!state?.carousel) return;

  if (state.carouselStyle === null) {
    state.carousel.removeAttribute('style');
  } else {
    state.carousel.setAttribute('style', state.carouselStyle);
  }
};

const destroyCollectionTabSwiper = (state) => {
  const swiper = state?.swiper || state?.carousel?.swiper;
  if (!swiper || swiper.destroyed) {
    if (state) {
      state.swiper = null;
      restoreCarouselStyle(state);
    }
    return;
  }

  stopAutoplay(state);
  destroySwiperCarousel(swiper);
  state.swiper = null;
  restoreCarouselStyle(state);
};

const createCollectionTabSwiper = (state) => {
  if (!state?.carousel || !state.carousel.matches(carouselSelector)) return null;
  if (state.swiper && !state.swiper.destroyed) return state.swiper;

  state.swiper = createSwiperCarousel(state.carousel, buildOptions(state.carousel, state.scope));
  if (state.swiper) startAutoplay(state);
  return state.swiper;
};

const getAutoplaySettings = (carousel, scope) => {
  const section = scope.closest('[data-collection-tabs]');
  const settingsSources = [carousel, scope, section];
  const autoplay = getFirstDataValue(settingsSources, 'swiperAutoplay');
  const pauseOnHover = getFirstDataValue(settingsSources, 'swiperAutoplayPauseOnHover');
  const delay = getFirstDataValue(settingsSources, 'swiperAutoplayDelay');
  const legacyAutoplay =
    scope.matches('[data-collection-tab-carousel]') &&
    scope.dataset.autoplay === 'true' &&
    section?.dataset.autoplay === 'true';

  return {
    enabled: (autoplay === null ? legacyAutoplay : autoplay === 'true') && !prefersReducedMotion(),
    pauseOnHover: pauseOnHover !== 'false',
    delay: Math.min(60000, Math.max(1000, toNumber(delay, 4000))),
  };
};

const isWrapperHovered = (swiper) => swiper.wrapperEl?.matches(':hover') || false;

const startAutoplay = (state) => {
  if (!state?.swiper || state.interval) return;

  const autoplay = getAutoplaySettings(state.carousel, state.scope);
  if (!autoplay.enabled) return;

  state.interval = window.setInterval(() => {
    const swiper = state.swiper;
    if (
      document.hidden ||
      !swiper ||
      swiper.destroyed ||
      !isVisible(state.carousel) ||
      (autoplay.pauseOnHover && isWrapperHovered(swiper)) ||
      state.scope.contains(document.activeElement) ||
      swiper.isLocked
    ) {
      return;
    }

    if (swiper.isEnd) {
      swiper.slideTo(0);
    } else {
      swiper.slideNext();
    }
  }, autoplay.delay);
};

const observeVisibility = (state) => {
  const panel = getCollectionTabPanel(state) || state.carousel?.closest('[data-collection-tab-panel]');
  if (!panel || typeof MutationObserver === 'undefined') return;
  const collectionTab = state.collectionTab;
  const tabsRoot = collectionTab?.closest('[data-collection-tabs]');

  const refreshVisibleState = () => {
    if (panel.hidden || !isCollectionTabPanelVisible(state)) return;
    refreshCollectionTabPromo(state);
    if (state.swiper && !state.swiper.destroyed) state.swiper.update();
  };

  state.visibilityObserver = new MutationObserver(() => {
    window.requestAnimationFrame(refreshVisibleState);
  });
  state.visibilityObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  if (collectionTab) {
    state.visibilityObserver.observe(collectionTab, {
      attributes: true,
      attributeFilter: ['data-tab-active'],
    });
  }
  if (tabsRoot) {
    state.visibilityObserver.observe(tabsRoot, {
      attributes: true,
      attributeFilter: ['data-collection-tabs-ready'],
    });
  }
  window.requestAnimationFrame(refreshVisibleState);
};

const observeSize = (state) => {
  if (typeof ResizeObserver === 'undefined') return;

  const observedElement = state.carousel || getCollectionTabItemsRoot(state.collectionTab);
  if (!observedElement) return;

  state.resizeObserver = new ResizeObserver(() => {
    if (!isVisible(observedElement)) return;
    if (state.collectionTab) refreshCollectionTabPromo(state);
    if (state.swiper && !state.swiper.destroyed) state.swiper.update();
  });
  state.resizeObserver.observe(observedElement);
};

const observeCollectionTabPromo = (state) => {
  if (!state.collectionTab || typeof MutationObserver === 'undefined') return;

  state.promoObserver = new MutationObserver((mutations) => {
    const itemsContainer = getCollectionTabItemsContainer(getCollectionTabItemsRoot(state.collectionTab));
    const promoMobileSlot = getCollectionTabPromoMobileSlot(state.collectionTab);
    const containsPromo = (node) =>
      node?.nodeType === 1 && (node.matches?.(promoSelector) || node.querySelector?.(promoSelector));
    const hasRelevantMutation = mutations.some((mutation) => {
      if (mutation.type === 'attributes') return true;
      if (mutation.target === itemsContainer || mutation.target === promoMobileSlot) return true;
      if (mutation.target.closest?.(promoSelector)) return true;
      return [...mutation.addedNodes, ...mutation.removedNodes].some(containsPromo);
    });
    if (hasRelevantMutation) scheduleCollectionTabPromoRefresh(state);
  });

  state.promoObserver.observe(state.collectionTab, {
    attributes: true,
    attributeFilter: ['data-promo-card-position', 'data-promo-card-show-on-top-mobile'],
    childList: true,
    subtree: true,
  });
};

const observeCollectionTabViewport = (state) => {
  if (!state.collectionTab || typeof window.matchMedia !== 'function') return;

  const mediaQuery = window.matchMedia(`(max-width: ${desktopBreakpoint - 0.02}px)`);
  const handleViewportChange = () => scheduleCollectionTabPromoRefresh(state);
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleViewportChange);
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleViewportChange);
  }
  state.mediaQuery = mediaQuery;
  state.mediaQueryListener = handleViewportChange;
  window.addEventListener('resize', handleViewportChange, { passive: true });
  state.viewportResizeListener = handleViewportChange;
};

const createCollectionTabState = (collectionTab, carousel = null, scope = collectionTab) => {
  const state = {
    carousel,
    collectionTab,
    scope,
    carouselStyle: getCarouselLayoutStyle(carousel),
    swiper: null,
    interval: null,
    resizeObserver: null,
    visibilityObserver: null,
    promoObserver: null,
    mediaQuery: null,
    mediaQueryListener: null,
    viewportResizeListener: null,
    syncFrame: null,
    layoutFrame: null,
    slideItems: null,
  };
  collectionTabStates.set(collectionTab, state);
  return state;
};

const initialize = (carousel) => {
  if (!carousel) return;

  const existingState = instances.get(carousel);
  if (existingState) {
    if (existingState.collectionTab) refreshCollectionTabPromo(existingState);
    if (existingState.swiper && !existingState.swiper.destroyed) existingState.swiper.update();
    return;
  }

  const collectionTab = getCollectionTab(carousel);
  if (collectionTab && collectionTabStates.has(collectionTab)) return;

  const scope = getCarouselScope(carousel);
  const state = collectionTab
    ? createCollectionTabState(collectionTab, carousel, scope)
    : {
      carousel,
      collectionTab: null,
      scope,
      carouselStyle: null,
      swiper: null,
      interval: null,
      resizeObserver: null,
      visibilityObserver: null,
      promoObserver: null,
      mediaQuery: null,
      mediaQueryListener: null,
      viewportResizeListener: null,
      syncFrame: null,
      layoutFrame: null,
      slideItems: null,
    };

  instances.set(carousel, state);

  if (collectionTab) {
    refreshCollectionTabPromo(state);
  } else {
    state.swiper = createSwiperCarousel(carousel, buildOptions(carousel, scope));
  }

  if (!state.swiper && !collectionTab) {
    instances.delete(carousel);
    return;
  }

  startAutoplay(state);
  observeSize(state);
  observeVisibility(state);
  observeCollectionTabPromo(state);
  observeCollectionTabViewport(state);
};

const initializeCollectionTab = (collectionTab) => {
  if (!collectionTab || collectionTabStates.has(collectionTab)) return;

  const carousel = collectionTab.querySelector(carouselSelector);
  if (carousel) {
    initialize(carousel);
    return;
  }

  if (!getCollectionTabItemsRoot(collectionTab)) return;

  const state = createCollectionTabState(collectionTab);
  refreshCollectionTabPromo(state);
  observeSize(state);
  observeCollectionTabPromo(state);
  observeCollectionTabViewport(state);
};

const initializeRoot = (root = document) => {
  if (root.matches?.(carouselSelector)) initialize(root);
  root.querySelectorAll?.(carouselSelector).forEach(initialize);

  if (root.matches?.(collectionTabSelector)) initializeCollectionTab(root);
  root.querySelectorAll?.(collectionTabSelector).forEach(initializeCollectionTab);
};

const scheduleInitializeRoot = (root = document) => {
  if (!root) return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => initializeRoot(root));
  });
};

const destroy = (carousel) => {
  const state = instances.get(carousel);
  if (!state) return;

  stopAutoplay(state);
  if (state.syncFrame !== null) window.cancelAnimationFrame(state.syncFrame);
  if (state.layoutFrame !== null) window.cancelAnimationFrame(state.layoutFrame);
  state.resizeObserver?.disconnect();
  state.visibilityObserver?.disconnect();
  state.promoObserver?.disconnect();
  if (state.mediaQuery && state.mediaQueryListener) {
    if (typeof state.mediaQuery.removeEventListener === 'function') {
      state.mediaQuery.removeEventListener('change', state.mediaQueryListener);
    } else if (typeof state.mediaQuery.removeListener === 'function') {
      state.mediaQuery.removeListener(state.mediaQueryListener);
    }
  }
  if (state.viewportResizeListener) window.removeEventListener('resize', state.viewportResizeListener);
  destroySwiperCarousel(state.swiper || state.carousel?.swiper);
  if (state.collectionTab) {
    restoreCarouselStyle(state);
  }
  instances.delete(carousel);
  if (state.collectionTab) collectionTabStates.delete(state.collectionTab);
};

const destroyCollectionTab = (collectionTab) => {
  const state = collectionTabStates.get(collectionTab);
  if (!state) return;

  if (state.carousel) {
    destroy(state.carousel);
    return;
  }

  if (state.syncFrame !== null) window.cancelAnimationFrame(state.syncFrame);
  if (state.layoutFrame !== null) window.cancelAnimationFrame(state.layoutFrame);
  state.resizeObserver?.disconnect();
  state.promoObserver?.disconnect();
  if (state.mediaQuery && state.mediaQueryListener) {
    if (typeof state.mediaQuery.removeEventListener === 'function') {
      state.mediaQuery.removeEventListener('change', state.mediaQueryListener);
    } else if (typeof state.mediaQuery.removeListener === 'function') {
      state.mediaQuery.removeListener(state.mediaQueryListener);
    }
  }
  if (state.viewportResizeListener) window.removeEventListener('resize', state.viewportResizeListener);
  collectionTabStates.delete(collectionTab);
};

const destroyRoot = (root) => {
  const carousels = [];
  if (root.matches?.(carouselSelector)) carousels.push(root);
  root.querySelectorAll?.(carouselSelector).forEach((carousel) => carousels.push(carousel));
  carousels.forEach(destroy);

  const collectionTabs = [];
  if (root.matches?.(collectionTabSelector)) collectionTabs.push(root);
  root.querySelectorAll?.(collectionTabSelector).forEach((collectionTab) => collectionTabs.push(collectionTab));
  collectionTabs.forEach(destroyCollectionTab);
};

const refreshCollectionTabFromEditorEvent = (event) => {
  const collectionTab = getCollectionTab(event.target);
  if (!collectionTab) return;

  if (!collectionTabStates.has(collectionTab)) {
    scheduleInitializeRoot(collectionTab);
    return;
  }
  const state = collectionTabStates.get(collectionTab);
  if (state) scheduleCollectionTabPromoRefresh(state);
};

document.addEventListener('shopify:section:load', (event) => {
  destroyRoot(event.target);
  scheduleInitializeRoot(event.target);
});
document.addEventListener('shopify:section:select', (event) => scheduleInitializeRoot(event.target));
document.addEventListener('shopify:section:unload', (event) => destroyRoot(event.target));
document.addEventListener('shopify:block:select', refreshCollectionTabFromEditorEvent);
document.addEventListener('shopify:block:deselect', refreshCollectionTabFromEditorEvent);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => scheduleInitializeRoot(), { once: true });
} else {
  scheduleInitializeRoot();
}
