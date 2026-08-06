class CollectionListPageReveal extends HTMLElement {
  connectedCallback() {
    this.observer?.disconnect();

    const revealEnabled = this.dataset.revealOnScroll === 'true';
    const motionEnabled = this.dataset.motionEnabled === 'true';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = [...this.querySelectorAll('.collections-page__item')];

    if (!revealEnabled || !motionEnabled || reducedMotion || !('IntersectionObserver' in window) || items.length === 0) {
      this.revealAll();
      return;
    }

    this.dataset.revealReady = 'true';
    this.observer = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          observer.unobserve(entry.target);
          window.requestAnimationFrame(() => entry.target.classList.add('is-revealed'));
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );

    items.forEach((item) => this.observer.observe(item));
  }

  disconnectedCallback() {
    this.observer?.disconnect();
    this.observer = null;
  }

  revealAll() {
    this.removeAttribute('data-reveal-ready');
    this.querySelectorAll('.collections-page__item').forEach((item) => item.classList.remove('is-revealed'));
  }
}

if (!customElements.get('collection-list-page-reveal')) {
  customElements.define('collection-list-page-reveal', CollectionListPageReveal);
}
