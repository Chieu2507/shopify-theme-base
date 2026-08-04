if (!customElements.get('footer-localization')) {
  class FooterLocalization extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      this.handleChange = () => this.form?.requestSubmit();
      this.addEventListener('change', this.handleChange);
    }

    disconnectedCallback() {
      this.removeEventListener('change', this.handleChange);
    }
  }

  customElements.define('footer-localization', FooterLocalization);
}

if (!customElements.get('footer-house')) {
  class FooterHouse extends HTMLElement {
    connectedCallback() {
      this.mobileQuery = window.matchMedia('(max-width: 749px)');
      this.menus = [...this.querySelectorAll('[data-footer-menu]')];
      this.handleViewportChange = () => this.syncMenuState();
      this.handleBlockSelect = (event) => {
        const selectedMenu = event.target.closest?.('[data-footer-menu]');
        if (selectedMenu && this.contains(selectedMenu)) selectedMenu.open = true;
      };
      this.handleMenuToggle = (event) => {
        if (!this.mobileQuery.matches || event.currentTarget.dataset.footerMobileAccordion !== 'true' || !event.currentTarget.open) return;
        this.menus.forEach((menu) => {
          if (menu !== event.currentTarget && menu.dataset.footerMobileAccordion === 'true') menu.open = false;
        });
      };

      this.menus.forEach((menu) => menu.addEventListener('toggle', this.handleMenuToggle));
      this.addEventListener('shopify:block:select', this.handleBlockSelect);

      if (this.mobileQuery.addEventListener) {
        this.mobileQuery.addEventListener('change', this.handleViewportChange);
      } else {
        this.mobileQuery.addListener(this.handleViewportChange);
      }

      this.syncMenuState();
    }

    disconnectedCallback() {
      this.menus?.forEach((menu) => menu.removeEventListener('toggle', this.handleMenuToggle));
      this.removeEventListener('shopify:block:select', this.handleBlockSelect);

      if (this.mobileQuery?.removeEventListener) {
        this.mobileQuery.removeEventListener('change', this.handleViewportChange);
      } else {
        this.mobileQuery?.removeListener(this.handleViewportChange);
      }
    }

    syncMenuState() {
      this.menus.forEach((menu) => {
        const usesMobileAccordion = menu.dataset.footerMobileAccordion === 'true';
        const opensByDefault = menu.dataset.footerDefaultOpen === 'true';
        menu.open = !this.mobileQuery.matches || !usesMobileAccordion || opensByDefault;
      });
    }
  }

  customElements.define('footer-house', FooterHouse);
}

if (!customElements.get('footer-wordmark')) {
  class FooterWordmark extends HTMLElement {
    connectedCallback() {
      this.handleResize = () => this.scheduleFit();
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this);
      document.fonts?.ready.then(() => this.scheduleFit());
      this.scheduleFit();
    }

    disconnectedCallback() {
      this.resizeObserver?.disconnect();
      if (this.frame) cancelAnimationFrame(this.frame);
    }

    scheduleFit() {
      if (this.frame) cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => this.fit());
    }

    fit() {
      this.frame = null;
      const typography = this.querySelector('.typography-block');
      const content = this.querySelector('.typography-block__content');
      if (!typography || !content || this.clientWidth <= 0) return;

      this.style.removeProperty('--footer-wordmark-fitted-size');
      const naturalSize = Number.parseFloat(getComputedStyle(typography).fontSize);
      const naturalWidth = content.scrollWidth;

      if (naturalWidth > this.clientWidth) {
        const fittedSize = Math.max(42, naturalSize * (this.clientWidth / naturalWidth) * 0.985);
        this.style.setProperty('--footer-wordmark-fitted-size', `${fittedSize}px`);
      }
    }
  }

  customElements.define('footer-wordmark', FooterWordmark);
}
