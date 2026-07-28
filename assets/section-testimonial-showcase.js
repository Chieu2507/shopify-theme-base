if (!customElements.get('noryvelle-pebble-testimonial')) {
  class NoryvellePebbleTestimonial extends HTMLElement {
    connectedCallback() {
      this.slides = [...this.querySelectorAll('[data-testimonial-slide]')];
      this.previousButton = this.querySelector('[data-testimonial-previous]');
      this.nextButton = this.querySelector('[data-testimonial-next]');
      this.index = Math.max(0, this.slides.findIndex((slide) => !slide.hidden));
      this.onPrevious = () => this.show(this.index - 1);
      this.onNext = () => this.show(this.index + 1);
      this.onBlockSelect = (event) => {
        const slideIndex = this.slides.findIndex((slide) => slide.dataset.blockId === event.detail.blockId);
        if (slideIndex >= 0) this.show(slideIndex);
      };
      this.previousButton?.addEventListener('click', this.onPrevious);
      this.nextButton?.addEventListener('click', this.onNext);
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      this.show(this.index);
    }

    disconnectedCallback() {
      this.previousButton?.removeEventListener('click', this.onPrevious);
      this.nextButton?.removeEventListener('click', this.onNext);
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
    }

    show(nextIndex) {
      if (!this.slides.length) return;
      this.index = Math.min(Math.max(nextIndex, 0), this.slides.length - 1);
      this.slides.forEach((slide, index) => {
        const isCurrent = index === this.index;
        slide.hidden = !isCurrent;
        slide.setAttribute('aria-hidden', String(!isCurrent));
      });
      if (this.previousButton) this.previousButton.disabled = this.index === 0;
      if (this.nextButton) this.nextButton.disabled = this.index === this.slides.length - 1;
    }
  }

  customElements.define('noryvelle-pebble-testimonial', NoryvellePebbleTestimonial);
}
