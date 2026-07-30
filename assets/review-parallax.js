if (!customElements.get('review-parallax')) {
  class ReviewParallax extends HTMLElement {
    connectedCallback() {
      this.scene = this.querySelector('[data-review-scene]');
      this.viewport = this.querySelector('[data-review-viewport]');
      this.header = this.querySelector('.review-parallax__header');
      this.cards = Array.from(this.querySelectorAll('[data-review-card]'));
      this.scrollDistance = Number.parseFloat(this.dataset.scrollDistance) || 240;
      this.mobileQuery = window.matchMedia('(max-width: 989px)');
      this.reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.handleScroll = this.handleScroll.bind(this);
      this.handleResize = this.measure.bind(this);
      this.handleModeChange = this.setup.bind(this);
      this.handleBlockSelect = this.selectBlock.bind(this);

      if (!this.scene || !this.viewport || this.cards.length < 2) return;

      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(this.viewport);
      this.mobileQuery.addEventListener('change', this.handleModeChange);
      this.reduceMotionQuery.addEventListener('change', this.handleModeChange);
      window.visualViewport?.addEventListener('resize', this.handleResize);
      document.addEventListener('shopify:block:select', this.handleBlockSelect);
      document.fonts?.ready.then(this.handleResize);
      this.setup();
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.handleScroll);
      this.mobileQuery?.removeEventListener('change', this.handleModeChange);
      this.reduceMotionQuery?.removeEventListener('change', this.handleModeChange);
      window.visualViewport?.removeEventListener('resize', this.handleResize);
      document.removeEventListener('shopify:block:select', this.handleBlockSelect);
      this.resizeObserver?.disconnect();
      if (this.raf) window.cancelAnimationFrame(this.raf);
    }

    setup() {
      window.removeEventListener('scroll', this.handleScroll);
      this.classList.remove('is-scroll-linked');
      this.scene.style.removeProperty('--review-scene-height');
      this.style.removeProperty('--review-heading-offset');
      this.style.removeProperty('--review-scroll-offset');

      const canLinkScroll = this.dataset.enableScroll === 'true'
        && !this.reduceMotionQuery.matches
        && !this.mobileQuery.matches
        && CSS.supports('position', 'sticky');
      if (!canLinkScroll) return;

      this.classList.add('is-scroll-linked');
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      this.measure();
    }

    measure() {
      if (!this.classList.contains('is-scroll-linked')) return;

      const configuredHeight = Number.parseFloat(getComputedStyle(this).getPropertyValue(
        '--review-stage-height',
      ));
      this.activeHeight = Math.min(window.innerHeight, configuredHeight || this.viewport.offsetHeight);
      this.style.setProperty('--review-active-height', `${this.activeHeight}px`);

      const headerTop = Number.parseFloat(getComputedStyle(this.header).top) || 0;
      const mirroredHeaderTop = Math.max(headerTop, this.activeHeight - headerTop - this.header.offsetHeight);
      this.headingTravel = mirroredHeaderTop - headerTop;

      this.cardStep = Math.min(868, Math.max(720, this.clientWidth * 0.61));
      this.steps = Math.max(...this.cards.map((card) => Number.parseInt(card.dataset.reviewLaneIndex, 10) || 0));
      this.style.setProperty('--review-card-step', `${this.cardStep}px`);

      this.travel = this.cardStep * this.steps;
      this.scrollRange = Math.max(180, this.scrollDistance * this.steps);
      this.pinOffset = Math.max(0, Number.parseFloat(getComputedStyle(this.viewport).top) || 0);
      this.scene.style.setProperty('--review-scene-height', `${this.activeHeight + this.scrollRange}px`);
      this.update();
    }

    handleScroll() {
      if (this.raf) return;
      this.raf = window.requestAnimationFrame(() => {
        this.raf = null;
        this.update();
      });
    }

    update() {
      if (!this.classList.contains('is-scroll-linked')) return;

      const progress = Math.min(1, Math.max(0, (this.pinOffset - this.scene.getBoundingClientRect().top) / this.scrollRange));
      const easedProgress = progress * progress * (3 - 2 * progress);
      this.style.setProperty('--review-heading-offset', `${(this.headingTravel * easedProgress).toFixed(2)}px`);
      this.style.setProperty('--review-scroll-offset', `${(this.travel * progress).toFixed(2)}px`);
    }

    selectBlock(event) {
      if (event.detail?.sectionId !== this.dataset.sectionId || !this.classList.contains('is-scroll-linked')) return;
      const card = this.querySelector(`[data-review-card][data-block-id="${CSS.escape(event.detail.blockId)}"]`)
        || this.querySelector(`[data-review-card][data-review-index="${CSS.escape(event.detail.blockId)}"]`);
      if (!card) return;

      const index = Number.parseInt(card.dataset.reviewLaneIndex, 10);
      const progress = this.steps ? index / this.steps : 0;
      const sceneTop = this.scene.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: sceneTop - this.pinOffset + progress * this.scrollRange, behavior: 'smooth' });
    }
  }

  customElements.define('review-parallax', ReviewParallax);
}
