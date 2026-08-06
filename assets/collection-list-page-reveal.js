class CollectionListPageReveal extends HTMLElement {
  connectedCallback() {
    this.cleanup();

    const revealEnabled = this.dataset.revealOnScroll === 'true';
    const motionEnabled = this.dataset.motionEnabled === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = [...this.querySelectorAll('.collections-page__item')];
    const canAnimate = revealEnabled && motionEnabled && !reducedMotion;

    if (!canAnimate || !('IntersectionObserver' in window) || items.length === 0) {
      this.revealAll();
      return;
    }

    this.dataset.revealReady = 'true';
    this.abortController = new AbortController();
    this.tiltFrames = new Map();
    this.tiltResetTimers = new Set();
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        const visibleItems = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target)
          .sort((firstItem, secondItem) => items.indexOf(firstItem) - items.indexOf(secondItem));

        visibleItems.forEach((item, index) => {
          observer.unobserve(item);
          item.style.setProperty('--collection-list-reveal-delay', `${Math.min(index, 4) * 70}ms`);
          let revealFrame;
          revealFrame = window.requestAnimationFrame(() => {
            item.classList.add('is-revealed');
            this.revealFrames.delete(revealFrame);
          });
          this.revealFrames ??= new Set();
          this.revealFrames.add(revealFrame);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    items.forEach((item) => this.observer.observe(item));

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.enableTilt();
    }
  }

  disconnectedCallback() {
    this.cleanup();
  }

  revealAll() {
    this.removeAttribute('data-reveal-ready');
    this.querySelectorAll('.collections-page__item').forEach((item) => {
      item.classList.remove('is-revealed');
      item.style.removeProperty('--collection-list-reveal-delay');
    });
  }

  enableTilt() {
    this.querySelectorAll('.collections-page__card').forEach((card) => {
      card.addEventListener('pointerenter', () => {
        card.dataset.collectionListTiltActive = 'true';
      }, { signal: this.abortController.signal });

      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        if (this.tiltFrames.has(card)) return;

        const tiltFrame = window.requestAnimationFrame(() => {
          card.style.setProperty('--collection-list-tilt-x', `${Math.max(-8, Math.min(8, y * -16)).toFixed(2)}deg`);
          card.style.setProperty('--collection-list-tilt-y', `${Math.max(-8, Math.min(8, x * 16)).toFixed(2)}deg`);
          this.tiltFrames.delete(card);
        });

        this.tiltFrames.set(card, tiltFrame);
      }, { signal: this.abortController.signal, passive: true });

      card.addEventListener('pointerleave', () => this.resetTilt(card), { signal: this.abortController.signal });
      card.addEventListener('pointercancel', () => this.resetTilt(card), { signal: this.abortController.signal });
    });
  }

  resetTilt(card) {
    card.style.setProperty('--collection-list-tilt-x', '0deg');
    card.style.setProperty('--collection-list-tilt-y', '0deg');
    const resetTimer = window.setTimeout(() => {
      card.removeAttribute('data-collection-list-tilt-active');
      this.tiltResetTimers.delete(resetTimer);
    }, 240);
    this.tiltResetTimers.add(resetTimer);
  }

  cleanup() {
    this.observer?.disconnect();
    this.observer = null;
    this.abortController?.abort();
    this.abortController = null;
    this.revealFrames?.forEach((frame) => window.cancelAnimationFrame(frame));
    this.revealFrames?.clear();
    this.tiltFrames?.forEach((frame) => window.cancelAnimationFrame(frame));
    this.tiltFrames?.clear();
    this.tiltResetTimers?.forEach((timer) => window.clearTimeout(timer));
    this.tiltResetTimers?.clear();
  }
}

if (!customElements.get('collection-list-page-reveal')) {
  customElements.define('collection-list-page-reveal', CollectionListPageReveal);
}
