if (!customElements.get('noryvelle-pebble-comparison')) {
  class NoryvellePebbleComparison extends HTMLElement {
    connectedCallback() {
      this.range = this.querySelector('[data-comparison-range]');
      if (!this.range) return;
      this.update = () => {
        this.style.setProperty('--pebble-comparison-position', `${this.range.value}%`);
      };
      this.range.addEventListener('input', this.update);
      this.handlePointerDown = (event) => {
        if (event.target.closest('a')) return;
        this.dragging = true;
        this.setPointerCapture(event.pointerId);
        this.setFromPointer(event);
      };
      this.handlePointerMove = (event) => {
        if (!this.dragging) return;
        this.setFromPointer(event);
      };
      this.handlePointerUp = (event) => {
        this.dragging = false;
        if (this.hasPointerCapture(event.pointerId)) this.releasePointerCapture(event.pointerId);
      };
      this.addEventListener('pointerdown', this.handlePointerDown);
      this.addEventListener('pointermove', this.handlePointerMove);
      this.addEventListener('pointerup', this.handlePointerUp);
      this.addEventListener('pointercancel', this.handlePointerUp);
      this.update();
    }

    disconnectedCallback() {
      this.range?.removeEventListener('input', this.update);
      this.removeEventListener('pointerdown', this.handlePointerDown);
      this.removeEventListener('pointermove', this.handlePointerMove);
      this.removeEventListener('pointerup', this.handlePointerUp);
      this.removeEventListener('pointercancel', this.handlePointerUp);
    }

    setFromPointer(event) {
      const bounds = this.getBoundingClientRect();
      const value = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
      this.range.value = String(Math.round(value));
      this.update();
    }
  }

  customElements.define('noryvelle-pebble-comparison', NoryvellePebbleComparison);
}
