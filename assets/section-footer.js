if (!customElements.get('footer-localization')) {
  class FooterLocalization extends HTMLElement {
    connectedCallback() {
      this.onChange = this.handleChange.bind(this);
      this.addEventListener('change', this.onChange);
    }

    disconnectedCallback() {
      this.removeEventListener('change', this.onChange);
    }

    handleChange(event) {
      if (!event.target.matches('[data-footer-localization-select]')) return;
      event.target.form.submit();
    }
  }

  customElements.define('footer-localization', FooterLocalization);
}

(() => {
  const observers = new WeakMap();

  const fitWordmark = (wordmark) => {
    const text = wordmark.dataset.wordmark?.trim();
    if (!text || !wordmark.clientWidth) return;

    wordmark.style.removeProperty('--footer-wordmark-fitted-size');
    const styles = getComputedStyle(wordmark);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    context.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
    const renderedText = styles.textTransform === 'uppercase' ? text.toUpperCase() : text;
    const letterSpacing = Number.parseFloat(styles.letterSpacing) || 0;
    const textWidth = context.measureText(renderedText).width + Math.max(0, renderedText.length - 1) * letterSpacing;
    const availableWidth = wordmark.clientWidth;
    if (!textWidth || textWidth <= availableWidth) return;

    const fontSize = Number.parseFloat(styles.fontSize);
    wordmark.style.setProperty('--footer-wordmark-fitted-size', `${Math.floor(fontSize * ((availableWidth - 1) / textWidth))}px`);
  };

  const observeWordmarks = (root = document) => {
    const wordmarks = [];
    if (root instanceof Element && root.matches('.footer__wordmark')) wordmarks.push(root);
    root.querySelectorAll?.('.footer__wordmark').forEach((wordmark) => wordmarks.push(wordmark));
    wordmarks.forEach((wordmark) => {
      if (!observers.has(wordmark)) {
        const observer = new ResizeObserver(() => fitWordmark(wordmark));
        observer.observe(wordmark);
        observers.set(wordmark, observer);
      }
      fitWordmark(wordmark);
    });
  };

  const initialize = () => {
    observeWordmarks();
    document.fonts?.ready.then(() => observeWordmarks());
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
  window.addEventListener('resize', () => observeWordmarks(), { passive: true });
  document.addEventListener('shopify:section:load', (event) => observeWordmarks(event.target));
})();
