import { Pagination } from './swiper-loader.js';
import { createSwiperCarousel, destroySwiperCarousel } from './swiper-carousel.js';

const instances = new WeakMap();
const promoListStates = new WeakMap();
const editorSelections = new WeakMap();
const carouselSelector = '[data-product-carousel][data-layout="carousel"]';
const collectionTabSelector = '[data-collection-tab]';
const productListSelector = '[data-product-list]';
const promoOwnerSelector = `${collectionTabSelector}, ${productListSelector}`;
const collectionTabsRootSelector = '[data-collection-tabs]';
const promoSelector = '[data-collection-tab-promo], [data-product-list-promo]';
const promoMobileSlotSelector = '[data-collection-tab-promo-mobile], [data-product-list-promo-mobile]';
const promoItemSelector = '.promo-card-block, .collection-tab-promo-block';
const desktopBreakpoint = 768;
const promoListRefreshDelay = 120;

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

const isVisible = (element) => Boolean(element?.getClientRects?.().length);

const hasLayoutBox = (element) => {
  if (!isVisible(element)) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0;
};

const getCollectionTab = (element) => element?.closest?.(collectionTabSelector) || null;
const getProductList = (element) => element?.closest?.(productListSelector) || null;
const getPromoOwner = (element) => getCollectionTab(element) || getProductList(element);

const getEditorBlockElement = (element) => {
  if (element?.matches?.('[data-shopify-editor-block]')) return element;

  return element?.closest?.('[data-shopify-editor-block]') ||
    element?.querySelector?.('[data-shopify-editor-block]') ||
    null;
};

const getEditorBlockId = (element) => {
  const blockElement = getEditorBlockElement(element);
  const rawValue = blockElement?.getAttribute('data-shopify-editor-block');
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue).id || null;
  } catch {
    return rawValue;
  }
};

const getPromoPanel = (state) =>
  state?.promoOwner?.querySelector('[data-collection-tab-panel]') || null;

const getPromoItemsRoot = (promoOwner) =>
  promoOwner?.querySelector('[data-collection-tab-products], [data-product-list-items]') || null;

const getCollectionTabItemsContainer = (itemsRoot) => {
  if (!itemsRoot) return null;

  return Array.from(itemsRoot.children).find((child) =>
    child.classList.contains('swiper-wrapper'),
  ) || itemsRoot;
};

const getPromoMobileSlot = (promoOwner) =>
  promoOwner?.querySelector(promoMobileSlotSelector) || null;

const getPromoElement = (item) => {
  if (!item) return null;
  if (item.matches?.(promoSelector)) return item;
  return item.querySelector?.(promoSelector) || null;
};

const getPromoItem = (element) => {
  if (!element) return null;

  const promoElement = element.matches?.(promoSelector)
    ? element
    : element.querySelector?.(promoSelector);
  if (!promoElement) return null;

  const promoItem = promoElement.closest(promoItemSelector);
  if (!promoItem) return promoElement.parentElement;

  const editorWrapper = promoItem.parentElement;
  return editorWrapper?.classList.contains('shopify-block') ? editorWrapper : promoItem;
};

const getPromoItems = (promoOwner) => {
  const promoItems = [];
  promoOwner?.querySelectorAll(promoSelector).forEach((promoElement) => {
    const promoItem = getPromoItem(promoElement);
    if (!promoItem || promoItems.includes(promoItem)) return;
    promoItems.push(promoItem);
  });
  return promoItems;
};

const getEditorSelectionFromEvent = (event) => {
  const target = event.target;
  const blockElement = getEditorBlockElement(target);
  if (!blockElement) return null;

  const promoItem = getPromoItem(target);

  return {
    element: promoItem || blockElement,
    blockId: event.detail?.blockId || getEditorBlockId(blockElement),
  };
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
  promoItem.classList.add('promo-card-block', 'collection-tab-promo-block', 'promo-card-slide', 'product-collection-grid__item');

  // Shopify wraps dynamic theme blocks in .shopify-block in the editor. The
  // wrapper is the real Swiper item; leave only it as a slide so the nested
  // block cannot be counted or styled as a second slide.
  const nestedPromoItem = promoItem.querySelector?.(promoItemSelector);
  if (nestedPromoItem && nestedPromoItem !== promoItem) {
    nestedPromoItem.classList.remove('swiper-slide');
  }
};

const isPromoOwnerVisible = (state) => {
  const panel = getPromoPanel(state);
  const promoOwner = state?.promoOwner;
  const collectionTab = getCollectionTab(promoOwner);
  const itemsRoot = getPromoItemsRoot(promoOwner);
  const tabsRoot = collectionTab?.closest('[data-collection-tabs]');
  const tabLayout = tabsRoot?.querySelector('[data-tab-layout]');
  const isTabLayoutReady = !tabLayout || tabsRoot?.dataset.collectionTabsReady === 'true';
  const isActiveTab = !tabLayout || collectionTab?.dataset.tabActive === 'true';

  return (
    isTabLayoutReady &&
    isActiveTab &&
    (!panel || !panel.hidden) &&
    (!itemsRoot || hasLayoutBox(itemsRoot))
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

const findSelectedPromoItem = (state) => {
  const selection = state?.editorSelection;
  if (!selection || !state.promoOwner) return null;

  let selectedBlock = selection.element;
  if (
    !selectedBlock?.isConnected ||
    getPromoOwner(selectedBlock) !== state.promoOwner
  ) {
    selectedBlock = null;
  }

  if (!selectedBlock && selection.blockId) {
    selectedBlock = Array.from(
      state.promoOwner.querySelectorAll('[data-shopify-editor-block]'),
    ).find((element) => String(getEditorBlockId(element)) === String(selection.blockId)) || null;
  }

  return getPromoItem(selectedBlock);
};

const revealSelectedPromoItem = (state) => {
  const promoItem = findSelectedPromoItem(state);
  if (!promoItem) return;

  const promoMobileSlot = getPromoMobileSlot(state.promoOwner);
  if (promoMobileSlot?.contains(promoItem)) return;

  const swiper = state.swiper;
  if (!swiper || swiper.destroyed) return;

  const slideIndex = Array.from(swiper.slides || []).indexOf(promoItem);
  if (slideIndex < 0) return;

  const dynamicSlidesPerView = typeof swiper.slidesPerViewDynamic === 'function'
    ? swiper.slidesPerViewDynamic()
    : Number(swiper.params.slidesPerView);
  const visibleSlides = Number.isFinite(dynamicSlidesPerView)
    ? Math.max(1, Math.ceil(dynamicSlidesPerView))
    : 1;
  const activeIndex = Number.isFinite(swiper.activeIndex) ? swiper.activeIndex : 0;
  const lastVisibleIndex = activeIndex + visibleSlides - 1;

  if (slideIndex < activeIndex || slideIndex > lastVisibleIndex) {
    swiper.slideTo(slideIndex, 0, false, true);
  }
};

const schedulePromoSwiperUpdate = (state) => {
  if (!state) return;
  if (state.updateFrame !== null) window.cancelAnimationFrame(state.updateFrame);

  state.updateFrame = window.requestAnimationFrame(() => {
    state.updateFrame = window.requestAnimationFrame(() => {
      state.updateFrame = null;
      if (!state.swiper || state.swiper.destroyed || !isPromoOwnerVisible(state)) return;
      state.swiper.update();
      revealSelectedPromoItem(state);
    });
  });
};

const syncPromoList = (state) => {
  const itemsRoot = getPromoItemsRoot(state.promoOwner);
  const itemsContainer = getCollectionTabItemsContainer(itemsRoot);
  const promoMobileSlot = getPromoMobileSlot(state.promoOwner);
  if (!itemsRoot || !itemsContainer || !promoMobileSlot) return false;

  const promoItems = getPromoItems(state.promoOwner);
  const isCarousel = itemsRoot.matches(carouselSelector);
  const nextCarousel = isCarousel ? itemsRoot : null;
  const carouselChanged = state.carousel !== nextCarousel;
  if (carouselChanged) {
    const previousCarousel = state.carousel;
    if (previousCarousel) {
      destroyPromoSwiper(state);
      instances.delete(previousCarousel);
    }

    state.carousel = nextCarousel;
    state.scope = nextCarousel ? getCarouselScope(nextCarousel) : state.promoOwner;
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
    destroyPromoSwiper(state);
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
    isPromoOwnerVisible(state) &&
    (!state.swiper || state.swiper.destroyed)
  ) {
    createPromoSwiper(state);
  } else if (state.swiper && !state.swiper.destroyed && isPromoOwnerVisible(state)) {
    state.swiper.update();
  } else if (state.swiper && (!isCarousel || desiredListItems.length === 0)) {
    destroyPromoSwiper(state);
  }

  // Theme Editor selects a newly added block immediately. If that block is
  // inserted before the current slide or after the last visible slide, keep
  // the editor selection visible after the DOM transaction has settled.
  revealSelectedPromoItem(state);
  schedulePromoSwiperUpdate(state);
  return structureChanged;
};

const refreshPromoList = (state) => {
  if (!state?.promoOwner) return false;
  return syncPromoList(state);
};

const schedulePromoListRefresh = (state) => {
  if (!state) return;

  // Reset the settle window when Shopify continues mutating the nested block.
  // Theme Editor can insert the block, apply editor attributes, and update its
  // settings in separate DOM transactions. Do not let Swiper measure any of
  // those intermediate states.
  if (state.settleTimer !== null) window.clearTimeout(state.settleTimer);
  if (state.syncFrame !== null) window.cancelAnimationFrame(state.syncFrame);
  if (state.layoutFrame !== null) window.cancelAnimationFrame(state.layoutFrame);

  state.settleTimer = window.setTimeout(() => {
    state.settleTimer = null;
    state.syncFrame = window.requestAnimationFrame(() => {
      state.syncFrame = null;
      // Allow the browser to commit the final DOM and layout before Swiper
      // reads the wrapper dimensions and slide list.
      state.layoutFrame = window.requestAnimationFrame(() => {
        state.layoutFrame = null;
        refreshPromoList(state);
      });
    });
  }, promoListRefreshDelay);
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
    breakpoints: {
      [desktopBreakpoint]: {
        slidesPerView: getSlidesPerView(carousel.dataset.swiperColumnsDesktop),
        spaceBetween: toNumber(carousel.dataset.swiperGapDesktop, 0),
      },
    },
    controls: getControls(carousel, scope),
  };

  // Promo-enabled lists own their DOM reconciliation. Letting Swiper
  // observe the same wrapper causes an update before the promo transaction
  // can disable transitions and preserve the active slide.
  if (!getPromoOwner(carousel)) {
    options.observer = true;
    options.observeParents = true;
  }

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

const destroyPromoSwiper = (state) => {
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

const createPromoSwiper = (state) => {
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
  const panel = getPromoPanel(state) || state.carousel?.closest('[data-collection-tab-panel]');
  if (typeof MutationObserver === 'undefined') return;
  const collectionTab = getCollectionTab(state.promoOwner);
  const tabsRoot = collectionTab?.closest('[data-collection-tabs]');

  const refreshVisibleState = () => {
    if (panel?.hidden || !isPromoOwnerVisible(state)) return;
    if (state.promoOwner) schedulePromoListRefresh(state);
    else if (state.swiper && !state.swiper.destroyed) state.swiper.update();
  };

  state.visibilityObserver = new MutationObserver(() => {
    window.requestAnimationFrame(refreshVisibleState);
  });
  if (panel) state.visibilityObserver.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
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

  const observedElements = [
    state.carousel,
    getPromoItemsRoot(state.promoOwner),
    getPromoPanel(state),
  ].filter((element, index, elements) => element && elements.indexOf(element) === index);
  if (!observedElements.length) return;

  state.resizeObserver = new ResizeObserver(() => {
    if (state.promoOwner) {
      if (!isPromoOwnerVisible(state)) return;
      schedulePromoListRefresh(state);
    } else if (state.swiper && !state.swiper.destroyed && observedElements.some(isVisible)) {
      state.swiper.update();
    }
  });
  observedElements.forEach((element) => state.resizeObserver.observe(element));
};

const observePromoList = (state) => {
  if (!state.promoOwner || typeof MutationObserver === 'undefined') return;

  state.promoObserver = new MutationObserver((mutations) => {
    const itemsContainer = getCollectionTabItemsContainer(getPromoItemsRoot(state.promoOwner));
    const promoMobileSlot = getPromoMobileSlot(state.promoOwner);
    const containsPromo = (node) =>
      node?.nodeType === 1 && (node.matches?.(promoSelector) || node.querySelector?.(promoSelector));
    const hasRelevantMutation = mutations.some((mutation) => {
      if (mutation.type === 'attributes') return true;
      if (mutation.target === itemsContainer || mutation.target === promoMobileSlot) return true;
      if (mutation.target.closest?.(promoSelector)) return true;
      return [...mutation.addedNodes, ...mutation.removedNodes].some(containsPromo);
    });
    if (hasRelevantMutation) schedulePromoListRefresh(state);
  });

  state.promoObserver.observe(state.promoOwner, {
    attributes: true,
    attributeFilter: ['data-promo-card-position', 'data-promo-card-show-on-top-mobile'],
    childList: true,
    subtree: true,
  });
};

const observePromoViewport = (state) => {
  if (!state.promoOwner || typeof window.matchMedia !== 'function') return;

  const mediaQuery = window.matchMedia(`(max-width: ${desktopBreakpoint - 0.02}px)`);
  const handleViewportChange = () => schedulePromoListRefresh(state);
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

const createPromoListState = (promoOwner, carousel = null, scope = promoOwner) => {
  const state = {
    carousel,
    promoOwner,
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
    settleTimer: null,
    syncFrame: null,
    layoutFrame: null,
    updateFrame: null,
    slideItems: null,
    editorSelection: editorSelections.get(promoOwner) || null,
  };
  promoListStates.set(promoOwner, state);
  return state;
};

const initialize = (carousel) => {
  if (!carousel) return;

  const existingState = instances.get(carousel);
  if (existingState) {
    if (existingState.promoOwner) {
      schedulePromoListRefresh(existingState);
    } else if (existingState.swiper && !existingState.swiper.destroyed) {
      existingState.swiper.update();
    }
    return;
  }

  const promoOwner = getPromoOwner(carousel);
  if (promoOwner && promoListStates.has(promoOwner)) return;

  const scope = getCarouselScope(carousel);
  const state = promoOwner
    ? createPromoListState(promoOwner, carousel, scope)
    : {
      carousel,
      promoOwner: null,
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
      settleTimer: null,
      syncFrame: null,
      layoutFrame: null,
      updateFrame: null,
      slideItems: null,
      editorSelection: null,
    };

  instances.set(carousel, state);

  if (promoOwner) {
    // Defer the first reconciliation until the owner and its nested blocks
    // have finished inserting the complete slide tree.
    schedulePromoListRefresh(state);
  } else {
    state.swiper = createSwiperCarousel(carousel, buildOptions(carousel, scope));
  }

  if (!state.swiper && !promoOwner) {
    instances.delete(carousel);
    return;
  }

  startAutoplay(state);
  observeSize(state);
  observeVisibility(state);
  observePromoList(state);
  observePromoViewport(state);
};

const initializePromoOwner = (promoOwner) => {
  if (!promoOwner || promoListStates.has(promoOwner)) return;

  const carousel = promoOwner.querySelector(carouselSelector);
  if (carousel) {
    initialize(carousel);
    return;
  }

  if (!getPromoItemsRoot(promoOwner)) return;

  const state = createPromoListState(promoOwner);
  schedulePromoListRefresh(state);
  observeSize(state);
  observePromoList(state);
  observePromoViewport(state);
};

const initializeRoot = (root = document) => {
  if (root.matches?.(carouselSelector)) initialize(root);
  root.querySelectorAll?.(carouselSelector).forEach(initialize);

  if (root.matches?.(promoOwnerSelector)) initializePromoOwner(root);
  root.querySelectorAll?.(promoOwnerSelector).forEach(initializePromoOwner);
};

const getPromoOwners = (root = document) => {
  const owners = [];
  if (root.matches?.(promoOwnerSelector)) owners.push(root);
  root.querySelectorAll?.(promoOwnerSelector).forEach((element) => owners.push(element));
  return owners;
};

const refreshPromoOwners = (root = document) => {
  initializeRoot(root);

  getPromoOwners(root).forEach((promoOwner) => {
    const state = promoListStates.get(promoOwner);
    if (state) schedulePromoListRefresh(state);
  });
};

const scheduleInitializeRoot = (root = document) => {
  if (!root) return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => initializeRoot(root));
  });
};

const schedulePromoOwnersRefresh = (root = document) => {
  if (!root) return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => refreshPromoOwners(root));
  });
};

const destroy = (carousel) => {
  const state = instances.get(carousel);
  if (!state) return;

  stopAutoplay(state);
  if (state.settleTimer !== null) window.clearTimeout(state.settleTimer);
  if (state.syncFrame !== null) window.cancelAnimationFrame(state.syncFrame);
  if (state.layoutFrame !== null) window.cancelAnimationFrame(state.layoutFrame);
  if (state.updateFrame !== null) window.cancelAnimationFrame(state.updateFrame);
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
  if (state.promoOwner) {
    restoreCarouselStyle(state);
  }
  instances.delete(carousel);
  if (state.promoOwner) promoListStates.delete(state.promoOwner);
};

const destroyPromoOwner = (promoOwner) => {
  const state = promoListStates.get(promoOwner);
  if (!state) return;

  if (state.carousel) {
    destroy(state.carousel);
    return;
  }

  if (state.syncFrame !== null) window.cancelAnimationFrame(state.syncFrame);
  if (state.settleTimer !== null) window.clearTimeout(state.settleTimer);
  if (state.layoutFrame !== null) window.cancelAnimationFrame(state.layoutFrame);
  if (state.updateFrame !== null) window.cancelAnimationFrame(state.updateFrame);
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
  promoListStates.delete(promoOwner);
};

const destroyRoot = (root) => {
  const carousels = [];
  if (root.matches?.(carouselSelector)) carousels.push(root);
  root.querySelectorAll?.(carouselSelector).forEach((carousel) => carousels.push(carousel));
  carousels.forEach(destroy);

  getPromoOwners(root).forEach(destroyPromoOwner);
};

const isPromoOwnerMutation = (node) => {
  if (node?.nodeType !== 1) return false;

  const relevantSelector = `${collectionTabsRootSelector}, ${promoOwnerSelector}, ${carouselSelector}, ${promoSelector}`;
  return node.matches?.(relevantSelector) || Boolean(node.querySelector?.(relevantSelector));
};

const observePromoOwnerDom = () => {
  if (typeof MutationObserver === 'undefined' || !document.documentElement) return;

  const observer = new MutationObserver((mutations) => {
    const roots = new Set();

    mutations.forEach((mutation) => {
      [...mutation.addedNodes].forEach((node) => {
        if (!isPromoOwnerMutation(node)) return;

        const root = node.matches?.(collectionTabsRootSelector)
          ? node
          : node.closest?.(collectionTabsRootSelector) ||
            node.closest?.(promoOwnerSelector) ||
            node.querySelector?.(collectionTabsRootSelector) ||
            node.querySelector?.(promoOwnerSelector);
        if (root) roots.add(root);
      });
    });

    roots.forEach((root) => refreshPromoOwners(root));
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
};

const refreshPromoOwnerFromEditorEvent = (event) => {
  const promoOwner = getPromoOwner(event.target);
  if (!promoOwner) return;

  const selection = event.type === 'shopify:block:select'
    ? getEditorSelectionFromEvent(event)
    : null;
  editorSelections.set(promoOwner, selection);

  if (!promoListStates.has(promoOwner)) {
    scheduleInitializeRoot(promoOwner);
    return;
  }
  const state = promoListStates.get(promoOwner);
  if (state) {
    state.editorSelection = selection;
    schedulePromoListRefresh(state);
  }
};

document.addEventListener('shopify:section:load', (event) => {
  destroyRoot(event.target);
  scheduleInitializeRoot(event.target);
});
document.addEventListener('shopify:section:select', (event) => scheduleInitializeRoot(event.target));
document.addEventListener('shopify:section:unload', (event) => destroyRoot(event.target));
document.addEventListener('shopify:block:select', refreshPromoOwnerFromEditorEvent);
document.addEventListener('shopify:block:deselect', refreshPromoOwnerFromEditorEvent);

observePromoOwnerDom();

const scheduleFinalPromoOwnersRefresh = () => schedulePromoOwnersRefresh();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleFinalPromoOwnersRefresh, { once: true });
} else {
  scheduleFinalPromoOwnersRefresh();
}

if (document.readyState === 'complete') {
  scheduleFinalPromoOwnersRefresh();
} else {
  window.addEventListener('load', scheduleFinalPromoOwnersRefresh, { once: true });
}

if (document.fonts?.ready) {
  document.fonts.ready.then(scheduleFinalPromoOwnersRefresh).catch(() => {});
}
