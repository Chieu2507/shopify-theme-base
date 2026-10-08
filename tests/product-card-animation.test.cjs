const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function fixture({ hidden = false, columns = 4, reduced = false, promoIndex = -1 } = {}) {
  let changed;
  const events = {};
  const cards = [];
  const selectCards = selector => cards.filter(card => !card.promo || selector.includes(".promo-card") || (selector.includes("[data-component-reveal]") && "componentReveal" in card.dataset));
  const panel = {
    hidden,
    isConnected: true,
    getClientRects: () => panel.hidden ? [] : [{}],
    closest: selector => selector.includes('[hidden]') && panel.hidden ? panel : null,
    matches: selector => selector.includes('[role="tabpanel"]'),
    contains: element => cards.includes(element),
    querySelectorAll: selector => selector.startsWith('.collection-list-view-all') ? [] : selectCards(selector),
  };
  const list = { querySelectorAll: selectCards };
  for (let index = 0; index < 4; index++) {
    const top = () => panel.hidden ? 0 : 100 + Math.floor(index / columns) * 300;
    const item = { getBoundingClientRect: () => ({ top: top() }) };
    const played = [];
    const card = {
      dataset: {}, played, isConnected: true, promo: index === promoIndex,
      parentElement: { closest: () => null },
      classList: { add() {}, remove() {} },
      matches: selector => selector.includes(index === promoIndex ? '.promo-card' : '.product-card'),
      closest(selector) {
        if (selector === '.product-collection-grid__item') return item;
        if (selector.includes('.product-collection-grid')) return list;
        if (selector.includes('[hidden]') && panel.hidden) return panel;
        return null;
      },
      querySelectorAll: () => [],
      getClientRects: () => panel.hidden ? [] : [{}],
      // Simulate cards at different points in an existing translateY animation.
      getBoundingClientRect: () => ({ top: top() + index * 10, bottom: top() + 200, left: 0, right: 200 }),
      animate(frames, options) {
        played.push({ frames, options });
        return { finished: new Promise(() => {}), cancel() {} };
      },
    };
    cards.push(card);
  }
  vm.runInNewContext(fs.readFileSync('assets/block-animations.js', 'utf8'), {
    window: {}, innerWidth: 1920, innerHeight: 1000,
    document: { body: { dataset: {} }, querySelectorAll: selector => selector.startsWith('.collection-list-view-all') ? [] : selectCards(selector),
      addEventListener: (name, fn) => { events[name] = fn; } },
    matchMedia: () => ({ matches: reduced, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    IntersectionObserver: class { observe() {} unobserve() {} },
    MutationObserver: class { constructor(fn) { changed = fn; } observe() {} },
  });
  return { cards, panel, events, activate() { panel.hidden = false; changed([{ type: 'attributes', attributeName: 'hidden', target: panel }]); } };
}

test('product grids stagger cards using stable layout positions', () => {
  const h = fixture();
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [180, 320, 460, 600]);
  assert.ok(h.cards.every(card => card.played[0].frames[0].transform === 'translateY(24px)'));
});

test('opening a hidden mobile tab recalculates stagger per two-column row', () => {
  const h = fixture({ hidden: true, columns: 2 });
  assert.ok(h.cards.every(card => card.played.length === 0));
  h.activate();
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [180, 320, 180, 320]);
  h.events['shopify:section:load']({ target: h.panel });
  assert.ok(h.cards.every(card => card.played.length === 1));
});

test('product grid stagger respects reduced motion', () => {
  const h = fixture({ reduced: true });
  assert.ok(h.cards.every(card => card.played.length === 0));
});

test('promo cards share product entrance and row stagger', () => {
  const h = fixture({ promoIndex: 1 });
  assert.deepEqual(h.cards.map(card => card.played[0].options.delay), [180,320,460,600]);
  assert.equal(h.cards[1].dataset.blockAnimation, 'slide-bottom');
  assert.deepEqual(h.cards[1].played[0].frames, h.cards[0].played[0].frames);
  assert.equal(h.cards[1].played[0].options.duration, h.cards[0].played[0].options.duration);
});
test('promo animation follows hidden tab activation and reduced motion', () => {
  const h = fixture({ hidden:true, columns:2, promoIndex:1 });
  assert.equal(h.cards[1].played.length,0);h.activate();
  assert.equal(h.cards[1].played[0].options.delay,320);
  const reduced = fixture({ reduced:true, promoIndex:1 });
  assert.equal(reduced.cards[1].played.length,0);
});
