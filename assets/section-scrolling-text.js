if (!customElements.get('scrolling-text-marquee')) {
  class ScrollingTextMarquee extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('.scrolling-text__track');
      this.groups = Array.from(this.querySelectorAll('.scrolling-text__group'));
      if (!this.track || this.groups.length < 2) return;

      this.originalChildren = this.groups.map((group) => Array.from(group.children));
      this.handleResize = this.fillGroups.bind(this);
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this);
      this.fillGroups();
      document.fonts?.ready.then(this.handleResize);

      if ('IntersectionObserver' in window) {
        this.visibilityObserver = new IntersectionObserver((entries) => {
          this.classList.toggle('is-active', entries.some((entry) => entry.isIntersecting));
        });
        this.visibilityObserver.observe(this);
      } else {
        this.classList.add('is-active');
      }
    }

    disconnectedCallback() {
      this.resizeObserver?.disconnect();
      this.visibilityObserver?.disconnect();
    }

    fillGroups() {
      if (!this.isConnected || this.clientWidth === 0) return;

      this.groups.forEach((group, groupIndex) => {
        group.querySelectorAll('[data-scrolling-text-clone]').forEach((clone) => clone.remove());
        const originals = this.originalChildren[groupIndex].filter((child) => child.isConnected);
        if (!originals.length) return;

        let clonePasses = 0;
        while (group.scrollWidth < this.clientWidth && clonePasses < 20) {
          const fragment = document.createDocumentFragment();
          originals.forEach((original) => {
            const clone = original.cloneNode(true);
            clone.setAttribute('data-scrolling-text-clone', '');
            clone.setAttribute('aria-hidden', 'true');
            clone.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach((control) => {
              control.tabIndex = -1;
            });
            fragment.appendChild(clone);
          });
          group.appendChild(fragment);
          clonePasses += 1;
        }
      });
    }
  }

  customElements.define('scrolling-text-marquee', ScrollingTextMarquee);
}
