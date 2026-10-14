const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function harness(delay) {
  let hovered = false;
  let focused = false;
  let motion = false;
  let nextFrame = 0;
  let advances = 0;
  const frames = new Map();
  const events = new Map();
  const properties = new Map();
  const pagination = { dataset: {},
    style: { setProperty: (key, value) => properties.set(key, value), getPropertyValue: (key) => properties.get(key) || '', removeProperty: (key) => properties.delete(key) },
    getAttribute: () => null, removeAttribute: () => delete pagination.dataset.autoplayClock,
  };
  const documentEvents = new Map();
  const document = { hidden: false, activeElement: {}, addEventListener: (event, callback) => documentEvents.set(event, callback), removeEventListener: (event) => documentEvents.delete(event) };
  const swiper = { el: { querySelector: () => pagination }, wrapperEl: { matches: () => hovered },
    on: (event, callback) => events.set(event, callback), off: (event) => events.delete(event),
    slideNext() { advances++; this.animating = true; events.get('slideChange')(); },
    slideTo() { this.slideNext(); },
  };
  const context = vm.createContext({ document, window: {
    matchMedia: () => ({ get matches() { return motion; } }),
    requestAnimationFrame: (callback) => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: (id) => frames.delete(id),
  } });
  vm.runInContext(fs.readFileSync('assets/swiper-carousel.js', 'utf8').replace(/^import .*;\n/gm, '').replace(/^export const (\w+) =/gm, 'globalThis.$1 ='), context);
  const cleanup = context.bindSwiperAutoplay(swiper, { delay, scope: { contains: () => focused } });
  return {
    swiper, pagination, document, events, documentEvents, frames, cleanup,
    frame(time) { const [id, callback] = frames.entries().next().value; frames.delete(id); callback(time); },
    get progress() { return Number(properties.get('--carousel-autoplay-progress')); },
    get remaining() { return properties.get('--carousel-autoplay-remaining'); },
    get advances() { return advances; },
    hover(value) { hovered = value; }, focus(value) { focused = value; }, reduce(value) { motion = value; },
  };
}

for (const delay of [1000, 3000, 4000, 7000, 10000]) test(`pagination completes the full ${delay}ms before autoplay navigates`, () => {
  const h = harness(delay);
  h.frame(0); h.frame(delay / 2);
  assert.equal(h.progress, 0.5); assert.equal(h.advances, 0);
  assert.equal(h.remaining, '50%');
  h.frame(delay);
  assert.equal(h.progress, 1); assert.equal(h.advances, 0);
  assert.equal(h.remaining, '0%');
  h.frame(delay + 16);
  assert.equal(h.advances, 1); assert.equal(h.progress, 0);
  assert.equal(h.remaining, '100%');
  h.frame(delay + 616);
  assert.equal(h.progress, 0);
  h.swiper.animating = false; h.events.get('slideChangeTransitionEnd')();
  h.frame(delay + 632); h.frame(delay + 632 + delay / 2);
  assert.equal(h.progress, 0.5);
  h.cleanup();
  assert.equal(h.frames.size, 0); assert.equal(h.events.size, 0); assert.equal(h.documentEvents.size, 0);
});

test('hover, keyboard focus, reduced motion and hidden tabs pause the same clock', () => {
  const h = harness(4000);
  h.frame(0); h.frame(1000); assert.equal(h.progress, 0.25);
  h.hover(true); h.frame(2000); assert.equal(h.progress, 0.25);
  h.hover(false); h.focus(true); h.frame(3000); assert.equal(h.progress, 0.25);
  h.focus(false); h.reduce(true); h.frame(4000); assert.equal(h.progress, 0.25);
  h.reduce(false); h.document.hidden = true; h.documentEvents.get('visibilitychange')(); h.frame(5000);
  h.document.hidden = false; h.documentEvents.get('visibilitychange')(); h.frame(100000);
  assert.equal(h.progress, 0.25); assert.equal(h.advances, 0);
  h.frame(101000); assert.equal(h.progress, 0.5);
  h.cleanup();
});

test('manual slide changes restart the full delay instead of keeping an old timer deadline', () => {
  const h = harness(4000);
  h.frame(0); h.frame(3500); assert.equal(h.progress, 0.875);
  h.swiper.animating = true; h.events.get('slideChange')();
  assert.equal(h.progress, 0);
  h.frame(4000); assert.equal(h.advances, 0);
  h.swiper.animating = false; h.events.get('slideChangeTransitionEnd')();
  h.frame(4100); h.frame(8099); assert.equal(h.advances, 0); assert.ok(h.progress < 1);
  h.frame(8100); assert.equal(h.progress, 1); assert.equal(h.advances, 0);
  h.frame(8116); assert.equal(h.advances, 1);
  h.cleanup();
});

test('pagination CSS consumes the autoplay clock without a separate four-second animation', () => {
  const css=fs.readFileSync('assets/swiper-carousel.css','utf8');
  assert.doesNotMatch(css, /@keyframes swiper-pagination-bullet-progress|animation: swiper-pagination-bullet-progress/);
  assert.match(css, /\.swiper-pagination-bullet-active::after\s*\{[^}]*var\(--carousel-autoplay-remaining, 100%\)/);
  assert.match(css, /\.swiper-pagination-progressbar-fill\s*\{[^}]*var\(--carousel-autoplay-remaining, 100%\)/);
});
