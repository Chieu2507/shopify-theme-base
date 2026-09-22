const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

// Controller contract tests, not a substitute for native-dialog browser QA.
function fixture({ mobile = true, reduced = false, portal = false } = {}) {
  const timers = new Map();
  const frames = new Map();
  const nativeEvents = [];
  const timerDelays = [];
  let id = 0;
  let now = 0;
  const rootClasses = new Set();
  const document = {
    activeElement: null,
    documentElement: {
      classList: {
        contains: (name) => rootClasses.has(name),
        toggle: (name, force) => {
          if (force === undefined) force = !rootClasses.has(name);
          if (force) rootClasses.add(name);
          else rootClasses.delete(name);
          return force;
        },
      },
    },
  };
  class Element extends EventTarget {
    constructor() {
      super();
      this.dataset = {};
      this.attributes = {};
      this.style = { setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; } };
      const classes = new Set();
      this.classList = {
        add: (...names) => names.forEach((name) => classes.add(name)),
        remove: (...names) => names.forEach((name) => classes.delete(name)),
        contains: (name) => classes.has(name),
        [Symbol.iterator]: () => classes[Symbol.iterator](),
      };
      this.offsetHeight = 500;
      this.isConnected = true;
      this.tabIndex = 0;
    }
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; }
    focus() { this.focusCount = (this.focusCount || 0) + 1; document.activeElement = this; }
    blur() { this.blurCount = (this.blurCount || 0) + 1; if (document.activeElement === this) document.activeElement = null; }
    getClientRects() { return [{}]; }
    closest() { return null; }
    setPointerCapture(id) { this.capture = id; }
    hasPointerCapture(id) { return this.capture === id; }
    releasePointerCapture() { this.capture = null; }
  }
  const header = new Element();
  const closeButton = new Element();
  const backdrop = new Element();
  const backdropCursor = new Element();
  const opener = new Element();
  const lastInput = new Element();
  document.activeElement = opener;
  const dialog = new Element();
  const originalParent = {
    insertBefore(element) {
      element.parentNode = this;
      element.parentElement = this;
    },
  };
  document.querySelector = (selector) => selector === 'custom-cursor[data-component-overlay-cursor]' ? backdropCursor : null;
  document.body = {
    append(element) {
      element.parentNode = this;
      element.parentElement = this;
    },
  };
  Object.assign(dialog, {
    open: false,
    dataset: { mobileLayout: 'bottom_sheet', state: 'closed' },
    querySelector: (selector) => {
      if (selector === '.component-overlay__header') return header;
      if (selector === '.component-overlay__panel') return dialog;
      if (selector === '[data-component-overlay-backdrop]') return backdrop;
      return closeButton;
    },
    querySelectorAll: () => [closeButton, lastInput],
    showModal() { this.open = true; document.activeElement = closeButton; },
    close() { this.open = false; nativeEvents.push(() => this.dispatchEvent(new Event('close'))); },
    remove() { this.parentNode = null; this.parentElement = null; },
    getBoundingClientRect: () => ({ left: 0, top: 100, right: 400, bottom: 600 }),
    parentNode: originalParent,
    parentElement: originalParent,
    nextSibling: null,
  });
  if (portal) dialog.attributes['data-append-to-body'] = '';
  const media = new EventTarget();
  media.matches = mobile;
  const reducedMedia = new EventTarget();
  reducedMedia.matches = reduced;
  const window = { matchMedia: (query) => query.includes('reduced') ? reducedMedia : media };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/component-overlay.js'), 'utf8'), {
    window, document, AbortController, Event,
    performance: { now: () => now },
    getComputedStyle: (element) => element === backdrop
      ? { transitionDuration: '0s', transitionDelay: '0s', animationDuration: '0.7s', animationDelay: '0s' }
      : { transitionDuration: reduced ? '0s' : '0.5s', transitionDelay: '0s', animationDuration: '0s', animationDelay: '0s' },
    setTimeout: (fn, delay = 0) => { timerDelays.push(delay); timers.set(++id, fn); return id; },
    clearTimeout: (key) => timers.delete(key),
    requestAnimationFrame: (fn) => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: (key) => frames.delete(key),
  });
  const flush = (queue) => { const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach((fn) => fn()); };
  return {
    api: window.ThemeOverlay, dialog, header, opener, closeButton, backdrop, backdropCursor, lastInput, document, media, timers, frames, timerDelays,
    overlay: window.ThemeOverlay.get(dialog),
    tick: (ms) => { now += ms; },
    flushTimers: () => flush(timers), flushFrames: () => flush(frames),
    flushNative: () => nativeEvents.splice(0).forEach((fn) => fn()),
    pointer: (y, target = header) => ({ target, pointerId: 1, clientY: y, isPrimary: true, button: 0, preventDefault() {} }),
  };
}

test('one controller per dialog; open without close autofocus and restore focus on close', () => {
  const f = fixture();
  assert.equal(f.api.get(f.dialog), f.overlay);
  f.overlay.open({ opener: f.opener });
  assert.equal(f.dialog.dataset.state, 'open');
  assert.equal(f.opener.attributes['aria-expanded'], 'true');
  assert.equal(f.closeButton.focusCount, undefined);
  assert.equal(f.closeButton.blurCount, 1);
  f.overlay.close();
  assert.equal(f.dialog.open, true);
  assert.equal(f.dialog.dataset.state, 'closing');
  f.flushTimers();
  f.flushNative();
  assert.equal(f.dialog.open, false);
  assert.equal(f.opener.focusCount, 1);
  assert.equal(f.opener.attributes['aria-expanded'], 'false');
});

test('close waits for the slower panel or backdrop timeline', () => {
  const f = fixture();
  f.overlay.open();
  f.overlay.close();
  assert.equal(f.timerDelays.at(-1), 716);
});

test('pointer-triggered close clears native focus without restoring it to the opener', () => {
  const f = fixture();
  f.overlay.open({ opener: f.opener, restoreFocus: false });
  f.overlay.close({ restoreFocus: false });
  f.document.activeElement = f.opener;
  f.flushTimers();
  f.flushNative();
  assert.equal(f.opener.focusCount, undefined);
  assert.equal(f.opener.blurCount, 1);
  assert.equal(f.document.activeElement, null);
  assert.equal(f.opener.attributes['aria-expanded'], 'false');
});

test('pointer click on the close action does not restore opener focus', () => {
  const f = fixture();
  f.closeButton.closest = (selector) => selector === '[data-overlay-close]' ? f.closeButton : null;
  f.overlay.open({ opener: f.opener });
  const event = new Event('click');
  Object.defineProperty(event, 'target', { value: f.closeButton });
  Object.defineProperty(event, 'detail', { value: 1 });
  f.dialog.dispatchEvent(event);
  f.flushTimers();
  f.flushNative();
  assert.equal(f.opener.focusCount, undefined);
  assert.equal(f.opener.attributes['aria-expanded'], 'false');
});

test('keyboard click on the close action restores opener focus', () => {
  const f = fixture();
  f.closeButton.closest = (selector) => selector === '[data-overlay-close]' ? f.closeButton : null;
  f.overlay.open({ opener: f.opener });
  const event = new Event('click');
  Object.defineProperty(event, 'target', { value: f.closeButton });
  Object.defineProperty(event, 'detail', { value: 0 });
  f.dialog.dispatchEvent(event);
  f.flushTimers();
  f.flushNative();
  assert.equal(f.opener.focusCount, 1);
  assert.equal(f.opener.attributes['aria-expanded'], 'false');
});

test('deferred opening lets the backdrop lead the panel by one frame', () => {
  const f = fixture();
  f.overlay.open({ defer: true });
  assert.equal(f.dialog.open, true);
  assert.equal(f.dialog.dataset.state, 'opening');
  assert.equal(f.closeButton.focusCount, undefined);
  f.flushFrames();
  assert.equal(f.dialog.dataset.state, 'open');
  assert.equal(f.closeButton.focusCount, undefined);
  assert.equal(f.closeButton.blurCount, 1);
});

test('reopening cancels pending close and ignores old queued native close event', () => {
  const f = fixture();
  f.overlay.open();
  f.overlay.close();
  f.overlay.open();
  f.flushTimers();
  assert.equal(f.dialog.open, true);
  f.overlay.close({ immediate: true });
  f.overlay.open();
  f.flushNative();
  assert.equal(f.dialog.dataset.state, 'open');
  assert.equal(f.opener.attributes['aria-expanded'], 'true');
});

test('Escape uses the animated lifecycle', () => {
  const f = fixture();
  f.overlay.open();
  const event = new Event('keydown', { cancelable: true });
  Object.assign(event, { key: 'Escape' });
  f.dialog.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(f.dialog.dataset.state, 'closing');
});

test('Tab and Shift+Tab wrap inside the overlay', () => {
  const f = fixture();
  f.overlay.open();
  f.document.activeElement = f.closeButton;
  const back = new Event('keydown', { cancelable: true });
  Object.assign(back, { key: 'Tab', shiftKey: true });
  f.dialog.dispatchEvent(back);
  assert.equal(back.defaultPrevented, true);
  assert.equal(f.document.activeElement, f.lastInput);
  const forward = new Event('keydown', { cancelable: true });
  Object.assign(forward, { key: 'Tab', shiftKey: false });
  f.dialog.dispatchEvent(forward);
  assert.equal(forward.defaultPrevented, true);
  assert.equal(f.document.activeElement, f.closeButton);
});

test('HTML backdrop is the only pointer close target', () => {
  const f = fixture();
  f.overlay.open();
  f.dialog.dispatchEvent(new Event('click'));
  assert.equal(f.dialog.dataset.state, 'open');
  f.backdrop.dispatchEvent(new Event('click'));
  assert.equal(f.dialog.dataset.state, 'closing');
});

test('backdrop custom cursor follows the pointer and hides inside the panel', () => {
  const f = fixture();
  f.overlay.open();
  const move = new Event('mousemove');
  Object.assign(move, { clientX: 450, clientY: 120 });
  f.backdrop.dispatchEvent(move);
  assert.equal(f.backdropCursor.classList.contains('active'), true);
  assert.equal(f.dialog.classList.contains('cursor-none'), true);
  assert.equal(f.backdropCursor.style['--cursor-x'], '450px');
  assert.equal(f.backdropCursor.style['--cursor-y'], '120px');
  f.backdrop.dispatchEvent(new Event('mouseleave'));
  assert.equal(f.backdropCursor.classList.contains('active'), false);
  assert.equal(f.dialog.classList.contains('cursor-none'), false);
});

test('short drag snaps back; downward threshold dismisses', () => {
  const f = fixture();
  f.overlay.open();
  f.overlay.gesture.start(f.pointer(0));
  f.tick(100);
  f.overlay.gesture.move(f.pointer(20));
  f.overlay.gesture.end(f.pointer(20));
  f.flushFrames();
  f.flushTimers();
  assert.equal(f.dialog.dataset.state, 'open');
  assert.equal(f.dialog.style.transform, undefined);
  f.overlay.gesture.start(f.pointer(0));
  f.tick(200);
  f.overlay.gesture.move(f.pointer(120));
  f.overlay.gesture.end(f.pointer(120));
  assert.equal(f.dialog.dataset.state, 'closing');
  f.flushFrames();
  f.flushTimers();
  assert.equal(f.dialog.open, false);
});

test('cancelled gesture and viewport change release capture without closing', () => {
  const f = fixture();
  f.overlay.open();
  f.overlay.gesture.start(f.pointer(0));
  f.overlay.gesture.move(f.pointer(180));
  f.overlay.gesture.end(f.pointer(180), true);
  f.flushFrames();
  f.flushTimers();
  assert.equal(f.dialog.open, true);
  f.overlay.gesture.start(f.pointer(0));
  f.media.matches = false;
  f.media.dispatchEvent(new Event('change'));
  assert.equal(f.header.capture, null);
  assert.equal(f.dialog.style.transform, undefined);
});

test('desktop, drawer mode and interactive targets do not start sheet drag', () => {
  for (const variant of ['desktop', 'drawer', 'button']) {
    const f = fixture({ mobile: variant !== 'desktop' });
    f.overlay.open();
    if (variant === 'drawer') f.dialog.dataset.mobileLayout = 'drawer';
    const target = variant === 'button' ? { closest: () => ({}) } : f.header;
    f.overlay.gesture.start(f.pointer(0, target));
    assert.equal(f.overlay.gesture.drag, null);
  }
});

test('reduced motion closes synchronously without leaving drag styles or frames', () => {
  const f = fixture({ reduced: true });
  f.overlay.open();
  f.overlay.gesture.start(f.pointer(0));
  f.overlay.gesture.move(f.pointer(120));
  f.overlay.gesture.end(f.pointer(120));
  assert.equal(f.dialog.open, false);
  assert.equal(f.frames.size, 0);
  assert.equal(f.dialog.style.transform, undefined);
});

test('destroy clears timers, listeners and cache without restoring stale focus', () => {
  const f = fixture();
  f.overlay.open();
  f.overlay.close();
  f.overlay.destroy();
  f.flushNative();
  f.flushTimers();
  assert.equal(f.dialog.open, false);
  assert.equal(f.opener.focusCount, undefined);
  assert.equal(f.opener.attributes['aria-expanded'], 'false');
  assert.notEqual(f.api.get(f.dialog), f.overlay);
});

test('append-to-body portals the dialog and restores its original parent on destroy', () => {
  const f = fixture({ portal: true });
  assert.equal(f.dialog.parentElement, f.document.body);
  f.overlay.destroy();
  assert.notEqual(f.dialog.parentElement, f.document.body);
});
