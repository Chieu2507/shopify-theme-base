if (!customElements.get('offer-flyout')) {
  class OfferFlyout extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector('[data-offer-flyout-dialog]');
      this.tabs = this.querySelectorAll('.offer-flyout__tab');
      this.openButtons = this.querySelectorAll('[data-offer-flyout-open]');
      this.dismissButtons = this.querySelectorAll('[data-offer-flyout-dismiss]');
      this.closeButton = this.querySelector('[data-offer-flyout-close]');
      this.storageKey = `offer-flyout:${this.dataset.sectionId}`;
      this.returnFocus = null;
      this.closeTimer = null;
      this.tabDismissed = false;

      if (!this.dialog) return;

      this.onOpenClick = (event) => this.open(event.currentTarget, true);
      this.onTabDismiss = () => {
        this.tabDismissed = true;
        this.setTabsVisible(false);
      };
      this.onCloseClick = () => this.close();
      this.onDialogClick = (event) => { if (event.target === this.dialog) this.close(); };
      this.onScroll = () => {
        if (this.scrollFrame) return;
        this.scrollFrame = window.requestAnimationFrame(() => {
          this.scrollFrame = null;
          this.maybeOpenFromScroll();
        });
      };
      this.onKeydown = (event) => { if (event.key === 'Escape') this.close(); };
      this.onSectionSelect = (event) => {
        if (event.detail?.sectionId === this.dataset.sectionId) this.open(null, false);
      };
      this.onBlockSelect = (event) => {
        if (event.target?.closest('offer-flyout') === this) this.open(null, false);
      };
      this.onCopyClick = (event) => this.copyCode(event.currentTarget);

      this.openButtons.forEach((button) => button.addEventListener('click', this.onOpenClick));
      this.dismissButtons.forEach((button) => button.addEventListener('click', this.onTabDismiss));
      this.closeButton?.addEventListener('click', this.onCloseClick);
      this.dialog.addEventListener('click', this.onDialogClick);
      this.querySelectorAll('[data-offer-flyout-copy]').forEach((button) => button.addEventListener('click', this.onCopyClick));
      document.addEventListener('shopify:section:select', this.onSectionSelect);
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('keydown', this.onKeydown);

      if (this.dataset.designMode !== 'true' && this.isEligible()) {
        window.addEventListener('scroll', this.onScroll, { passive: true });
        this.maybeOpenFromScroll();
      }
    }

    disconnectedCallback() {
      this.openButtons?.forEach((button) => button.removeEventListener('click', this.onOpenClick));
      this.dismissButtons?.forEach((button) => button.removeEventListener('click', this.onTabDismiss));
      this.closeButton?.removeEventListener('click', this.onCloseClick);
      this.dialog?.removeEventListener('click', this.onDialogClick);
      this.querySelectorAll('[data-offer-flyout-copy]').forEach((button) => button.removeEventListener('click', this.onCopyClick));
      document.removeEventListener('shopify:section:select', this.onSectionSelect);
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
      document.removeEventListener('keydown', this.onKeydown);
      window.removeEventListener('scroll', this.onScroll);
      if (this.scrollFrame) window.cancelAnimationFrame(this.scrollFrame);
      window.clearTimeout(this.closeTimer);
    }

    isEligible() {
      if (this.dataset.frequency === 'always') return true;

      try {
        const storedAt = Number(window.localStorage.getItem(this.storageKey));
        if (!storedAt) return true;
        if (this.dataset.frequency === 'once') return false;

        const durations = {
          '6_hours': 6 * 60 * 60 * 1000,
          '1_day': 24 * 60 * 60 * 1000,
          '3_days': 3 * 24 * 60 * 60 * 1000,
          '1_week': 7 * 24 * 60 * 60 * 1000
        };
        return Date.now() - storedAt >= (durations[this.dataset.frequency] || 0);
      } catch (error) {
        return true;
      }
    }

    maybeOpenFromScroll() {
      if (this.isOpen() || !this.isEligible()) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = (window.scrollY / scrollable) * 100;
      if (progress >= Number(this.dataset.scrollTrigger)) {
        window.removeEventListener('scroll', this.onScroll);
        if (this.scrollFrame) window.cancelAnimationFrame(this.scrollFrame);
        this.scrollFrame = null;
        this.open(null, false);
      }
    }

    open(trigger, manual) {
      if (!this.dialog || this.isOpen()) return;
      this.returnFocus = trigger || document.activeElement;
      this.dialog.classList.remove('is-closing');
      this.setTabsVisible(false);
      this.dialog.hidden = false;
      if (!manual) this.rememberDisplay();
    }

    close() {
      if (!this.isOpen() || this.dialog.classList.contains('is-closing')) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.finishClose();
        return;
      }
      this.dialog.classList.add('is-closing');
      this.closeTimer = window.setTimeout(() => this.finishClose(), 280);
    }

    isOpen() {
      return this.dialog && !this.dialog.hidden;
    }

    finishClose() {
      if (!this.dialog) return;
      this.dialog.hidden = true;
      this.dialog.classList.remove('is-closing');
      this.setTabsVisible(true);
      this.returnFocus?.focus({ preventScroll: true });
      this.returnFocus = null;
    }

    rememberDisplay() {
      if (this.dataset.frequency === 'always') return;
      try {
        window.localStorage.setItem(this.storageKey, String(Date.now()));
      } catch (error) {
        return;
      }
    }

    setTabsVisible(visible) {
      const shouldShow = visible && !this.tabDismissed;
      this.tabs.forEach((tab) => {
        tab.hidden = !shouldShow;
      });
    }

    async copyCode(button) {
      const promo = button.closest('.offer-flyout__promo');
      const code = promo?.querySelector('[data-offer-flyout-code]')?.textContent.trim();
      const status = promo?.querySelector('[data-offer-flyout-copy-status]');
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code);
        button.textContent = button.dataset.copiedLabel;
        if (status) status.textContent = button.dataset.copiedLabel;
        window.setTimeout(() => { button.textContent = button.dataset.defaultLabel; }, 1800);
      } catch (error) {
        if (status) status.textContent = code;
      }
    }
  }

  customElements.define('offer-flyout', OfferFlyout);
}
