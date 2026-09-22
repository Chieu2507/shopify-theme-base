const states = new WeakMap();
const selector = '[data-announcement-bar]';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const setFocusableState = (element) => {
  element.setAttribute('aria-hidden', 'true');
  element.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach((focusable) => {
    focusable.setAttribute('tabindex', '-1');
  });
};

const copyToClipboard = async (value) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch (error) {
      // Fall back to the legacy API when clipboard permissions are unavailable.
    }
  }
  if (typeof document.execCommand !== 'function') throw new Error('Clipboard is unavailable');
  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.append(input);
  input.select();
  input.setSelectionRange(0, input.value.length);
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard copy failed');
};

const initCopyInteraction = (root) => {
  let copyTimer = 0;
  const setCopyIcon = (button, copied) => {
    const copyIcon = button.querySelector('[data-copy-icon-copy]');
    const checkIcon = button.querySelector('[data-copy-icon-check]');
    if (copyIcon) copyIcon.hidden = copied;
    if (checkIcon) checkIcon.hidden = !copied;
    button.dataset.copied = String(copied);
  };
  const onClick = async (event) => {
    const button = event.target.closest?.('[data-discount-code-copy]');
    if (!button || !root.contains(button)) return;
    const value = button.dataset.discountCode;
    if (!value) return;
    try {
      await copyToClipboard(value);
      const status = root.querySelector('[data-discount-code-status]');
      if (status) status.textContent = 'Discount code copied';
      setCopyIcon(button, true);
      window.clearTimeout(copyTimer);
      copyTimer = window.setTimeout(() => {
        setCopyIcon(button, false);
        if (status) status.textContent = '';
      }, 2000);
    } catch (error) {
      // Clipboard access can be denied in preview contexts; keep the button usable.
    }
  };
  root.addEventListener('click', onClick);
  return { onClick, clearCopyTimer: () => window.clearTimeout(copyTimer) };
};

const sanitizeEditorAttributes = (element) => {
  [element, ...element.querySelectorAll('*')].forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (attribute.name.startsWith('data-shopify-editor') || attribute.name.startsWith('data-shopify-block')) node.removeAttribute(attribute.name);
    });
    if (node.id?.startsWith('shopify-block-')) node.removeAttribute('id');
  });
  return element;
};

const initSlider = (root, slides, track) => {
  if (slides.length < 2) root.classList.add('announcement-bar--single');
  let activeIndex = 0;
  const firstClone = slides.length > 1 ? sanitizeEditorAttributes(slides[0].cloneNode(true)) : null;
  firstClone?.setAttribute('aria-hidden', 'true');
  firstClone?.setAttribute('data-announcement-slider-clone', 'true');
  firstClone?.setAttribute('inert', '');
  if (firstClone) track.append(firstClone);
  const syncSize = () => {
    const activeSlide = slides[activeIndex];
    if (!activeSlide) return;
    const offset = slides.slice(0, activeIndex).reduce((total, slide) => total + slide.offsetHeight, 0);
    root.style.setProperty('--announcement-slider-height', `${activeSlide.offsetHeight}px`);
    root.style.setProperty('--announcement-slider-offset', `${offset}px`);
  };
  const setActive = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === activeIndex;
      slide.dataset.announcementActive = String(active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    syncSize();
  };
  const totalHeight = () => slides.reduce((total, slide) => total + slide.offsetHeight, 0);
  const transitionDuration = () => {
    const duration = parseFloat(getComputedStyle(track).transitionDuration || '0');
    return Number.isFinite(duration) ? duration * 1000 : 400;
  };
  const move = (direction) => {
    if (direction > 0 && activeIndex === slides.length - 1 && firstClone) {
      const firstSlide = slides[0];
      activeIndex = 0;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.dataset.announcementActive = String(active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      root.style.setProperty('--announcement-slider-height', `${firstSlide.offsetHeight}px`);
      window.requestAnimationFrame(() => {
        root.style.setProperty('--announcement-slider-offset', `${totalHeight()}px`);
        window.setTimeout(() => {
          root.classList.add('announcement-bar--slider-reset');
          root.style.setProperty('--announcement-slider-offset', '0px');
          window.requestAnimationFrame(() => root.classList.remove('announcement-bar--slider-reset'));
        }, transitionDuration());
      });
      return;
    }
    setActive(activeIndex + direction);
  };
  const previous = root.querySelector('[data-announcement-previous]');
  const next = root.querySelector('[data-announcement-next]');
  const onPrevious = () => { move(-1); restart(); };
  const onNext = () => { move(1); restart(); };
  const autoplayDelay = Number(root.dataset.announcementAutoplay) || 0;
  const pauseOnHover = root.dataset.announcementPauseOnHover !== 'false';
  let timer = 0;
  const stop = () => {
    if (timer) window.clearTimeout(timer);
    timer = 0;
  };
  const restart = () => {
    stop();
    if (slides.length < 2 || autoplayDelay <= 0 || reducedMotion()) return;
    timer = window.setTimeout(() => {
      move(1);
      restart();
    }, autoplayDelay);
  };
  const pause = () => { if (pauseOnHover) stop(); };
  const resume = () => { if (pauseOnHover) restart(); };
  const resizeObserver = new ResizeObserver(syncSize);
  slides.forEach((slide) => resizeObserver.observe(slide));
  previous?.addEventListener('click', onPrevious);
  next?.addEventListener('click', onNext);
  if (pauseOnHover) {
    root.addEventListener('mouseenter', pause);
    root.addEventListener('mouseleave', resume);
    root.addEventListener('focusin', pause);
    root.addEventListener('focusout', resume);
  }
  setActive(0);
  restart();
  return { previous, next, onPrevious, onNext, stop, pause, resume, pauseOnHover, resizeObserver, firstClone };
};

const initScrolling = (root, track) => {
  if (Number(root.dataset.announcementSpeed) === 0 || reducedMotion()) return { clones: [], resizeObserver: null, mutationObserver: null };
  const viewport = root.querySelector('[data-announcement-viewport]');
  let clones = [];
  let isSyncing = false;
  let mutationObserver;

  const syncClones = () => {
    if (isSyncing) return;
    isSyncing = true;
    mutationObserver?.disconnect();
    clones.forEach((clone) => clone.remove());
    const originalSlides = [...track.children].filter((slide) => !slide.hasAttribute('data-announcement-clone'));
    clones.length = 0;
    if (originalSlides.length === 0) {
      isSyncing = false;
      return;
    }

    const appendCloneSet = () => {
      originalSlides.forEach((slide) => {
        const clone = slide.cloneNode(true);
        setFocusableState(clone);
        clone.dataset.announcementClone = 'true';
        track.append(clone);
        clones.push(clone);
      });
    };

    appendCloneSet();
    const firstClone = clones[0];
    const loopDistance = firstClone.getBoundingClientRect().left - track.getBoundingClientRect().left;
    let cloneSetCount = 1;
    while (track.scrollWidth < (viewport?.clientWidth || 0) + loopDistance && cloneSetCount < 100) {
      appendCloneSet();
      cloneSetCount += 1;
    }
    track.style.setProperty('--announcement-bar-loop-distance', `${loopDistance}px`);
    root.classList.add('announcement-bar--ready');
    mutationObserver?.observe(track, { attributes: true, childList: true, subtree: true });
    isSyncing = false;
  };

  mutationObserver = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => {
      if (mutation.type === 'attributes' && (mutation.attributeName === 'class' || mutation.attributeName === 'style')) return false;
      if (mutation.type === 'attributes' && mutation.attributeName.startsWith('data-shopify-editor')) return false;
      return !mutation.target.closest?.('[data-announcement-clone]');
    })) syncClones();
  });

  const resizeObserver = new ResizeObserver(() => syncClones());
  resizeObserver.observe(viewport || track);
  syncClones();
  return { clones, resizeObserver, mutationObserver };
};

const init = (root) => {
  if (!(root instanceof HTMLElement) || states.has(root)) return;
  const track = root.querySelector('[data-announcement-track]');
  if (!track) return;
  const slides = Array.from(track.children);
  const sliderState = root.dataset.announcementType === 'slider' ? initSlider(root, slides, track) : { previous: null, next: null, onPrevious: null, onNext: null };
  const scrollingState = root.dataset.announcementType === 'scrolling' ? initScrolling(root, track) : { clones: [], resizeObserver: null, mutationObserver: null };
  const copyState = initCopyInteraction(root);
  states.set(root, { track, ...sliderState, ...scrollingState, ...copyState });
};

const destroy = (root) => {
  const state = states.get(root);
  if (!state) return;
  state.previous?.removeEventListener('click', state.onPrevious);
  state.next?.removeEventListener('click', state.onNext);
  state.onClick && root.removeEventListener('click', state.onClick);
  state.clearCopyTimer?.();
  state.stop?.();
  state.resizeObserver?.disconnect();
  state.firstClone?.remove();
  if (state.pauseOnHover) {
    root.removeEventListener('mouseenter', state.pause);
    root.removeEventListener('mouseleave', state.resume);
    root.removeEventListener('focusin', state.pause);
    root.removeEventListener('focusout', state.resume);
  }
  state.resizeObserver?.disconnect();
  state.mutationObserver?.disconnect();
  state.clones?.forEach((clone) => clone.remove());
  root.classList.remove('announcement-bar--ready', 'announcement-bar--single');
  states.delete(root);
};

const initWithin = (root = document) => {
  if (root.matches?.(selector)) init(root);
  root.querySelectorAll?.(selector).forEach(init);
};
const destroyWithin = (root) => {
  if (root.matches?.(selector)) destroy(root);
  root.querySelectorAll?.(selector).forEach(destroy);
};

document.addEventListener('shopify:section:load', (event) => initWithin(event.target));
document.addEventListener('shopify:section:unload', (event) => destroyWithin(event.target));
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initWithin(), { once: true });
else initWithin();
