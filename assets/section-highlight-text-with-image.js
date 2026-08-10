if (!customElements.get('highlight-text-with-image')) {
  class HighlightTextWithImage extends HTMLElement {
    connectedCallback() {
      this.section = this.querySelector('.highlight-text-with-image');
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.animationFrame = null;
      this.handleViewportChange = this.handleViewportChange.bind(this);
      this.handleMotionChange = this.handleMotionChange.bind(this);

      if (!this.section) return;

      this.classList.add('is-scroll-highlight-ready');
      this.reducedMotion.addEventListener?.('change', this.handleMotionChange);
      this.handleMotionChange();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.handleViewportChange);
      window.removeEventListener('resize', this.handleViewportChange);
      this.reducedMotion?.removeEventListener?.('change', this.handleMotionChange);
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    }

    handleMotionChange() {
      window.removeEventListener('scroll', this.handleViewportChange);
      window.removeEventListener('resize', this.handleViewportChange);

      if (this.reducedMotion.matches) {
        this.section.style.setProperty('--highlight-fill-stop', '100%');
        return;
      }

      window.addEventListener('scroll', this.handleViewportChange, { passive: true });
      window.addEventListener('resize', this.handleViewportChange, { passive: true });
      this.handleViewportChange();
    }

    handleViewportChange() {
      if (this.animationFrame) return;

      this.animationFrame = requestAnimationFrame(() => {
        this.animationFrame = null;
        this.updateFillStop();
      });
    }

    updateFillStop() {
      if (!this.isConnected || !this.section) return;

      const bounds = this.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const start = viewportHeight * 0.9;
      const finishRatio = {
        slow: 0.12,
        medium: 0.26,
        fast: 0.4,
      }[this.dataset.animationSpeed] || 0.26;
      const finish = viewportHeight * finishRatio;
      const travel = Math.max(start - finish, 1);
      const progress = Math.min(Math.max((start - bounds.top) / travel, 0), 1);

      this.section.style.setProperty('--highlight-fill-stop', `${(progress * 100).toFixed(2)}%`);
    }
  }

  customElements.define('highlight-text-with-image', HighlightTextWithImage);
}
