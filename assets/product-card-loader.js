let productCardFeatures;
const observedCards = new WeakSet();

const productCardObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries, observer) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    loadProductCardFeatures().catch(() => {});
  }, { rootMargin: '480px 0px' })
  : null;

const loadProductCardFeatures = () => {
  if (!productCardFeatures) {
    productCardFeatures = Promise.all([
      import('./product-card.js'),
      import('./cart-feedback.js'),
    ]).catch((error) => {
      productCardFeatures = null;
      throw error;
    });
  }
  return productCardFeatures;
};

const initializeForScope = (scope = document) => {
  const cards = scope.querySelectorAll?.('[data-product-card]') || [];
  if (!cards.length) return;

  if (!productCardObserver) {
    loadProductCardFeatures().catch(() => {});
    return;
  }

  cards.forEach((card) => {
    if (observedCards.has(card)) return;
    observedCards.add(card);
    productCardObserver.observe(card);
  });
};

const interactiveSelector = '[data-product-card-quick-view-open], [data-product-card-quick-add], [data-product-card-variant]';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initializeForScope(), { once: true });
} else {
  initializeForScope();
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest(interactiveSelector);
  if (!trigger || productCardFeatures) return;

  event.preventDefault();
  event.stopImmediatePropagation();
  loadProductCardFeatures().then(() => trigger.click()).catch(() => {});
}, true);

document.addEventListener('shopify:section:load', (event) => initializeForScope(event.target));
document.addEventListener('collection:products-loaded', (event) => initializeForScope(event.detail?.panel || event.target));
document.addEventListener('featured-collection:products-loaded', (event) => initializeForScope(event.detail?.panel || event.target));
document.addEventListener('product-featured-collection:products-loaded', (event) => initializeForScope(event.detail?.panel || event.target));
document.addEventListener('gift-atelier:products-loaded', (event) => initializeForScope(event.detail?.panel || event.target));
document.addEventListener('carry-edit:products-loaded', (event) => initializeForScope(event.detail?.panel || event.target));
