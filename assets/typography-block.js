class TypographyBlock extends HTMLElement {
  connectedCallback() {
    if (this.classList.contains('is-visible')) return;

    this.observer?.disconnect();
    if (this.revealFallback) window.clearTimeout(this.revealFallback);
    this.dataset.typographyReady = 'true';
    const animation = this.dataset.typographyAnimation || 'none';
    const motionEnabled = this.dataset.motionEnabled === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = animation !== 'none';
    const reveal = () => {
      if (!this.isConnected) return;

      this.classList.add('is-visible');
      this.observer?.disconnect();
      this.observer = null;
      if (this.revealFallback) window.clearTimeout(this.revealFallback);
      this.revealFallback = null;
    };

    if (!motionEnabled || reducedMotion || window.Shopify?.designMode || !shouldAnimate || !('IntersectionObserver' in window)) {
      reveal();
      return;
    }

    this.dataset.typographyAnimate = 'true';
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        reveal();
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    this.observer.observe(this);
    this.revealFallback = window.setTimeout(reveal, 1200);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    if (this.revealFallback) window.clearTimeout(this.revealFallback);
    this.revealFallback = null;
  }
}

if (!customElements.get('typography-block')) {
  customElements.define('typography-block', TypographyBlock);
}
