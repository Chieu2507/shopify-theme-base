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
