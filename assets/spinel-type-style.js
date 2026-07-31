class SpinelTypeStyle extends HTMLElement {
  connectedCallback() {
    if (this.classList.contains('is-visible')) return;

    this.observer?.disconnect();
    this.dataset.spinelReady = 'true';
    const animation = this.dataset.spinelAnimation || 'none';
    const emphasis = this.dataset.spinelEmphasis || 'none';
    const motionEnabled = this.dataset.motionEnabled === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = animation !== 'none' || emphasis !== 'none';

    if (!motionEnabled || reducedMotion || window.Shopify?.designMode || !shouldAnimate || !('IntersectionObserver' in window)) {
      this.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        this.classList.add('is-visible');
        observer.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }
}

if (!customElements.get('spinel-type-style')) {
  customElements.define('spinel-type-style', SpinelTypeStyle);
}
