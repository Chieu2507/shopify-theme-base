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
  let id = 0;
  let now = 0;
  const document = { activeElement: null };
  class Element extends EventTarget {
    constructor() {
      super();
      this.dataset = {};
      this.attributes = {};
      this.style = { removeProperty(name) { delete this[name]; } };
      const classes = new Set();
      this.classList = { add: (name) => classes.add(name), remove: (name) => classes.delete(name) };
      this.offsetHeight = 500;
      this.isConnected = true;
      this.tabIndex = 0;
    }
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); }
    setAttribute(name, value) { this.attributes[name] = value; }
    focus() { this.focusCount = (this.focusCount || 0) + 1; document.activeElement = this; }
    getClientRects() { return [{}]; }
    closest() { return null; }
    setPointerCapture(id) { this.capture = id; }
    hasPointerCapture(id) { return this.capture === id; }
    releasePointerCapture() { this.capture = null; }
  }
  const header = new Element();
  const closeButton = new Element();
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
  document.body = {
    append(element) {
      element.parentNode = this;
      element.parentElement = this;
    },
  };
  Object.assign(dialog, {
    open: false,
    dataset: { mobileLayout: 'bottom_sheet', state: 'closed' },
    querySelector: (selector) => selector === '.component-overlay__header' ? header : closeButton,
    querySelectorAll: () => [closeButton, lastInput],
    showModal() { this.open = true; },
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
    window, document, AbortController,
    performance: { now: () => now },
    getComputedStyle: () => ({ transitionDuration: reduced ? '0s' : '0.2s', transitionDelay: '0s' }),
    setTimeout: (fn) => { timers.set(++id, fn); return id; },
    clearTimeout: (key) => timers.delete(key),
    requestAnimationFrame: (fn) => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: (key) => frames.delete(key),
  });
  const flush = (queue) => { const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach((fn) => fn()); };
  return {
    api: window.ThemeOverlay, dialog, header, opener, closeButton, lastInput, document, media, timers, frames,
    overlay: window.ThemeOverlay.get(dialog),
    tick: (ms) => { now += ms; },
    flushTimers: () => flush(timers), flushFrames: () => flush(frames),
    flushNative: () => nativeEvents.splice(0).forEach((fn) => fn()),
    pointer: (y, target = header) => ({ target, pointerId: 1, clientY: y, isPrimary: true, button: 0, preventDefault() {} }),
  };
}

test('one controller per dialog; open, animated close and focus restoration', () => {
  const f = fixture();
  assert.equal(f.api.get(f.dialog), f.overlay);
  f.overlay.open({ opener: f.opener });
  assert.equal(f.dialog.dataset.state, 'open');
  assert.equal(f.opener.attributes['aria-expanded'], 'true');
  assert.equal(f.closeButton.focusCount, 1);
  f.overlay.close();
  assert.equal(f.dialog.open, true);
  assert.equal(f.dialog.dataset.state, 'closing');
  f.flushTimers();
  f.flushNative();
  assert.equal(f.dialog.open, false);
  assert.equal(f.opener.focusCount, 1);
  assert.equal(f.opener.attributes['aria-expanded'], 'false');
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
  const event = new Event('cancel', { cancelable: true });
  f.dialog.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(f.dialog.dataset.state, 'closing');
});

test('Tab and Shift+Tab wrap inside the overlay', () => {
  const f = fixture();
  f.overlay.open();
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

test('dialog padding is not backdrop; outside bounds closes', () => {
  const f = fixture();
  f.overlay.open();
  const click = (x, y) => {
    const event = new Event('click');
    Object.assign(event, { clientX: x, clientY: y });
    f.dialog.dispatchEvent(event);
  };
  click(20, 120);
  assert.equal(f.dialog.dataset.state, 'open');
  click(450, 120);
  assert.equal(f.dialog.dataset.state, 'closing');
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
