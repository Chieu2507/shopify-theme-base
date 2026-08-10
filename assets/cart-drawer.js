import { A11y, Swiper } from './swiper-loader.js';

(() => {
  if (customElements.get('cart-drawer')) return;

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.backdropPointer = this.querySelector('.cart-drawer__backdrop-pointer');
      this.panel = this.querySelector('.cart-drawer__panel');
      this.handle = this.querySelector('[data-cart-drawer-order-options-handle]');
      this.items = this.querySelector('[data-cart-drawer-items]');
      this.footer = this.querySelector('[data-cart-drawer-footer]');
      this.orderOptionsPanel = this.querySelector('[data-cart-drawer-order-options]');
      this.orderOptionsBackdrop = this.querySelector('.cart-drawer__order-options-backdrop');
      this.orderOptionsToggle = this.querySelector('[data-cart-drawer-order-options-toggle]');
      this.orderOptionsClose = this.querySelector('[data-cart-drawer-order-options-close]');
      this.status = this.querySelector('[data-cart-drawer-status]');
      this.loading = this.querySelector('[data-cart-drawer-loading]');
      this.message = this.querySelector('[data-cart-drawer-message]');
      this.discounts = this.querySelector('[data-cart-drawer-discounts]');
      this.total = this.querySelector('[data-cart-drawer-total]');
      this.checkoutTotal = this.querySelector('[data-cart-drawer-checkout-total]');
      this.taxNote = this.querySelector('[data-cart-drawer-tax-note]');
      this.recommendations = this.querySelector('[data-cart-drawer-recommendations]');
      this.recommendationList = this.querySelector('[data-cart-drawer-recommendation-list]');
      this.recommendationTrack = this.querySelector('[data-cart-drawer-recommendation-track]');
      this.recommendationDots = this.querySelector('[data-cart-drawer-recommendation-dots]');
      this.shippingProgress = this.querySelector('[data-cart-drawer-shipping-progress]');
      this.shippingMessage = this.querySelector('[data-cart-drawer-shipping-message]');
      this.shippingProgressValue = this.querySelector('[data-cart-drawer-shipping-progress-value]');
      this.shippingCopy = this.querySelector('[data-cart-drawer-shipping-copy]');
      this.addons = this.querySelector('[data-cart-drawer-addons]');
      this.shippingEstimator = this.querySelector('[data-cart-drawer-shipping-estimator]');
      this.shippingRates = this.querySelector('[data-cart-drawer-shipping-rates]');
      this.shippingCountry = this.querySelector('[data-cart-drawer-shipping-country]');
      this.shippingProvinceField = this.querySelector('[data-cart-drawer-shipping-province-field]');
      this.shippingProvince = this.querySelector('[data-cart-drawer-shipping-province]');
      this.complementaryProducts = this.readComplementaryProducts();
      this.recommendationTimer = null;
      this.recommendationSwiper = null;
      this.recommendationPaused = false;
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.currency = this.dataset.currency || 'USD';
      this.isOpen = false;
      this.busy = false;
      this.lineMutationInFlight = false;
      this.refreshPending = false;
      this.pendingLineMutations = new Map();
      this.lineDesiredQuantities = new Map();
      this.lastFocusedElement = null;
      this.handleDrag = null;
      this.handleDragTimer = null;
      this.mobileDrawer = window.matchMedia('(max-width: 989px)');
      this.bind();
      this.setOrderOptionsOpen(false);
      this.renderEmpty();
      this.handleProductAdd = (event) => {
        if (!event.detail?.item) return;
        if (this.dataset.autoOpen === 'false') {
          if (event.detail.cart) this.syncCart(event.detail.cart);
          return;
        }
        const sourceButton = event.detail.button || null;
        const quickViewModal = sourceButton?.closest?.('[data-quick-view]')
          ? document.querySelector('[data-quick-view-modal]')
          : null;

        if (!quickViewModal?.open) {
          this.open(sourceButton);
          return;
        }

        const openAfterQuickViewClose = () => this.open(sourceButton);
        quickViewModal.addEventListener('close', openAfterQuickViewClose, { once: true });
        if (!quickViewModal.classList.contains('is-closing')) window.SpinelQuickView?.close();
      };
      document.addEventListener('product:add:success', this.handleProductAdd, { signal: this.abortController?.signal });
      document.addEventListener('cart:add:success', this.handleProductAdd, { signal: this.abortController?.signal });
    }

    disconnectedCallback() {
      this.abortController?.abort();
      this.backdropInteraction?.destroy();
      window.clearTimeout(this.closeTimer);
      window.clearInterval(this.recommendationTimer);
      this.destroyRecommendationSwiper();
      this.resetHandleDrag();
      this.unlockPageScroll();
      this.isOpen = false;
      this.pendingLineMutations?.clear();
      this.lineDesiredQuantities?.clear();
    }

    bind() {
      this.abortController = new AbortController();
      const { signal } = this.abortController;
      this.backdropInteraction = new window.SpinelModalBackdropPointer({
        root: this,
        panel: this.panel,
        pointer: this.backdropPointer,
        isOpen: () => this.isOpen,
      });
      document.addEventListener('click', (event) => {
        const trigger = event.target.closest?.('[data-cart-drawer-open]');
        if (trigger) {
          event.preventDefault();
          this.open(trigger);
          return;
        }

      }, { signal });
      document.addEventListener('shopify:section:select', (event) => {
        if (this.isSectionEvent(event)) this.open();
      }, { signal });
      this.addEventListener('click', (event) => {
        const orderOptionsToggle = event.target.closest('[data-cart-drawer-order-options-toggle]');
        if (orderOptionsToggle) {
          event.preventDefault();
          this.toggleOrderOptions();
          return;
        }
        if (event.target.closest('[data-cart-drawer-order-options-close]')) {
          event.preventDefault();
          this.setOrderOptionsOpen(false, true);
          return;
        }
        if (event.target.closest('[data-cart-drawer-close], [data-cart-drawer-overlay]')) {
          event.preventDefault();
          this.close();
          return;
        }
        const change = event.target.closest('[data-cart-drawer-change]');
        if (change) {
          this.queueLineChange(
            change.dataset.line,
            Number(change.dataset.quantity),
            Number(change.dataset.quantityDelta),
          );
        }
        const relatedAdd = event.target.closest('[data-cart-drawer-related-add]');
        if (relatedAdd) this.addRelatedProduct(relatedAdd);
        const recommendationDot = event.target.closest('[data-cart-drawer-recommendation-dot]');
        if (recommendationDot) this.goToRecommendation(Number(recommendationDot.dataset.index));
      }, { signal });
      const discountForm = this.querySelector('[data-cart-drawer-discount]');
      const discountInput = discountForm?.querySelector('input[name="discount"]');
      discountForm?.addEventListener('submit', (event) => this.applyDiscount(event), { signal });
      discountInput?.addEventListener('input', () => {
        discountInput.removeAttribute('aria-invalid');
        if (this.message?.dataset.error === 'true') this.setMessage('');
      }, { signal });
      this.querySelector('[data-cart-drawer-save-note]')?.addEventListener('click', () => this.saveNote(), { signal });
      this.recommendationList?.addEventListener('pointerenter', () => { this.recommendationPaused = true; }, { signal });
      this.recommendationList?.addEventListener('pointerleave', () => { this.recommendationPaused = false; }, { signal });
      this.recommendationList?.addEventListener('focusin', () => { this.recommendationPaused = true; }, { signal });
      this.recommendationList?.addEventListener('focusout', () => { this.recommendationPaused = false; }, { signal });
      this.querySelectorAll('[data-cart-drawer-addon]').forEach((input) => {
        input.addEventListener('change', () => this.toggleAddon(input), { signal });
      });
      this.shippingEstimator?.addEventListener('submit', (event) => this.estimateShipping(event), { signal });
      this.shippingCountry?.addEventListener('change', () => this.updateShippingProvinces(), { signal });
      this.shippingEstimator?.addEventListener('input', () => this.clearShippingFieldErrors(), { signal });
      this.mobileDrawer.addEventListener('change', () => this.setOrderOptionsOpen(false), { signal });
      this.updateShippingProvinces();
      if ('PointerEvent' in window) {
        this.handle?.addEventListener('pointerdown', (event) => this.startHandleDrag(event), { signal });
        this.handle?.addEventListener('pointermove', (event) => this.moveHandleDrag(event), { signal });
        this.handle?.addEventListener('pointerup', (event) => this.endHandleDrag(event), { signal });
        this.handle?.addEventListener('pointercancel', (event) => this.endHandleDrag(event, true), { signal });
      } else {
        this.handle?.addEventListener('touchstart', (event) => this.startTouchHandleDrag(event), { passive: false, signal });
        this.handle?.addEventListener('touchmove', (event) => this.moveTouchHandleDrag(event), { passive: false, signal });
        this.handle?.addEventListener('touchend', (event) => this.endTouchHandleDrag(event), { signal });
        this.handle?.addEventListener('touchcancel', (event) => this.endTouchHandleDrag(event, true), { signal });
      }
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isOpen) {
          if (this.mobileDrawer.matches && this.orderOptionsPanel?.getAttribute('aria-hidden') === 'false') {
            this.setOrderOptionsOpen(false, true);
          } else {
            this.close();
          }
        }
        if (event.key === 'Tab' && this.isOpen) this.trapFocus(event);
      }, { signal });
    }

    isSectionEvent(event) {
      const sectionId = this.dataset.sectionId;
      if (!sectionId) return false;
      return event.detail?.sectionId === sectionId
        || event.target?.id === `shopify-section-${sectionId}`;
    }

    trapFocus(event) {
      if (!this.panel) return;
      const focusable = [...this.panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
        .filter((element) => element.getClientRects().length);
      if (!focusable.length) {
        event.preventDefault();
        this.panel.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (event.target === first || !this.panel.contains(event.target))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (event.target === last || !this.panel.contains(event.target))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    startTouchHandleDrag(event) {
      const touch = event.changedTouches[0];
      if (!touch) return;
      this.startHandleDrag({
        isPrimary: true,
        button: 0,
        pointerId: touch.identifier,
        clientY: touch.clientY,
        preventDefault: () => event.preventDefault()
      });
    }

    moveTouchHandleDrag(event) {
      const drag = this.handleDrag;
      if (!drag) return;
      const touch = Array.from(event.changedTouches).find((candidate) => candidate.identifier === drag.pointerId);
      if (!touch) return;
      this.moveHandleDrag({
        pointerId: touch.identifier,
        clientY: touch.clientY,
        preventDefault: () => event.preventDefault()
      });
    }

    endTouchHandleDrag(event, cancelled = false) {
      const drag = this.handleDrag;
      if (!drag) return;
      const touch = Array.from(event.changedTouches).find((candidate) => candidate.identifier === drag.pointerId);
      if (!touch) return;
      this.endHandleDrag({ pointerId: touch.identifier }, cancelled);
    }

    startHandleDrag(event) {
      if (!this.orderOptionsPanel || !this.handle || !this.isOpen || !this.mobileDrawer.matches || this.orderOptionsPanel.getAttribute('aria-hidden') !== 'false' || !event.isPrimary || event.button > 0 || this.classList.contains('is-closing')) return;

      window.clearTimeout(this.handleDragTimer);
      this.handleDrag = {
        pointerId: event.pointerId,
        startY: event.clientY,
        lastY: event.clientY,
        lastTime: performance.now(),
        velocity: 0,
        distance: 0
      };
      this.orderOptionsPanel.classList.remove('is-handle-settling', 'is-handle-closing');
      this.orderOptionsPanel.style.transform = 'translate3d(0, 0, 0)';
      this.orderOptionsPanel.style.opacity = '1';
      this.orderOptionsPanel.classList.add('is-handle-dragging');
      if (this.orderOptionsBackdrop) {
        this.orderOptionsBackdrop.style.transition = 'none';
        this.orderOptionsBackdrop.style.opacity = '1';
      }
      try { this.handle.setPointerCapture(event.pointerId); } catch (_) {}
      event.preventDefault();
    }

    moveHandleDrag(event) {
      const drag = this.handleDrag;
      if (!drag || event.pointerId !== drag.pointerId) return;

      const now = performance.now();
      const elapsed = Math.max(now - drag.lastTime, 1);
      const movement = event.clientY - drag.lastY;
      drag.velocity = movement / elapsed;
      drag.lastY = event.clientY;
      drag.lastTime = now;
      drag.distance = Math.max(0, event.clientY - drag.startY);
      this.orderOptionsPanel.style.transform = `translate3d(0, ${drag.distance}px, 0)`;
      if (this.orderOptionsBackdrop) {
        const fadeDistance = Math.max(this.orderOptionsPanel.getBoundingClientRect().height * 0.7, 1);
        this.orderOptionsBackdrop.style.opacity = String(Math.max(0, 1 - (drag.distance / fadeDistance)));
      }
      event.preventDefault();
    }

    endHandleDrag(event, cancelled = false) {
      const drag = this.handleDrag;
      if (!drag || event.pointerId !== drag.pointerId) return;

      try { this.handle?.releasePointerCapture(event.pointerId); } catch (_) {}
      const closeDistance = Math.min(140, this.orderOptionsPanel.getBoundingClientRect().height * 0.2);
      const shouldClose = !cancelled && (drag.distance >= closeDistance || (drag.distance >= 32 && drag.velocity > 0.55));
      this.handleDrag = null;
      this.orderOptionsPanel.classList.remove('is-handle-dragging');

      if (shouldClose) {
        this.closeFromHandle();
        return;
      }

      this.orderOptionsPanel.classList.add('is-handle-settling');
      if (this.orderOptionsBackdrop) this.orderOptionsBackdrop.style.transition = 'opacity 240ms cubic-bezier(.22, 1, .36, 1)';
      requestAnimationFrame(() => {
        this.orderOptionsPanel.style.transform = 'translate3d(0, 0, 0)';
        this.orderOptionsPanel.style.opacity = '1';
        if (this.orderOptionsBackdrop) this.orderOptionsBackdrop.style.opacity = '1';
      });
      this.handleDragTimer = window.setTimeout(() => this.resetHandleDrag(), this.reduceMotion.matches ? 0 : 240);
    }

    closeFromHandle() {
      if (!this.isOpen || !this.orderOptionsPanel || this.orderOptionsPanel.getAttribute('aria-hidden') === 'true') return;
      this.orderOptionsPanel.classList.add('is-handle-closing');
      if (this.orderOptionsBackdrop) this.orderOptionsBackdrop.style.transition = 'opacity 220ms ease';
      requestAnimationFrame(() => {
        this.orderOptionsPanel.style.transform = 'translate3d(0, 100%, 0)';
        this.orderOptionsPanel.style.opacity = '0';
        if (this.orderOptionsBackdrop) this.orderOptionsBackdrop.style.opacity = '0';
      });
      window.clearTimeout(this.handleDragTimer);
      this.handleDragTimer = window.setTimeout(() => {
        this.setOrderOptionsOpen(false, true);
        this.resetHandleDrag();
      }, this.reduceMotion.matches ? 0 : 240);
    }

    lockPageScroll() {
      if (this.pageScrollLocked) return;
      const root = document.documentElement;
      const gutterProperty = '--cart-drawer-scrollbar-gutter';
      this.previousScrollbarGutter = root.style.getPropertyValue(gutterProperty);
      this.hadScrollbarGutter = this.previousScrollbarGutter !== '';
      root.style.setProperty(gutterProperty, `${Math.max(0, window.innerWidth - root.clientWidth)}px`);
      document.body.classList.add('cart-drawer-open');
      this.pageScrollLocked = true;
    }

    setOrderOptionsOpen(open, restoreFocus = false) {
      if (!this.orderOptionsPanel || !this.footer) return;
      const isMobile = this.mobileDrawer.matches;
      const isOpen = isMobile && open;
      this.classList.toggle('is-order-options-open', isOpen);
      this.footer.classList.toggle('is-order-options-open', isOpen);
      this.orderOptionsPanel.setAttribute('aria-hidden', String(isMobile && !isOpen));
      this.orderOptionsPanel.inert = isMobile && !isOpen;
      this.orderOptionsToggle?.setAttribute('aria-expanded', String(isOpen));
      if (restoreFocus && isMobile) {
        (open ? this.orderOptionsClose : this.orderOptionsToggle)?.focus({ preventScroll: true });
      }
    }

    toggleOrderOptions() {
      if (!this.orderOptionsPanel) return;
      this.setOrderOptionsOpen(this.orderOptionsPanel.getAttribute('aria-hidden') === 'true', true);
    }

    unlockPageScroll() {
      if (!this.pageScrollLocked) return;
      document.body.classList.remove('cart-drawer-open');
      const root = document.documentElement;
      const gutterProperty = '--cart-drawer-scrollbar-gutter';
      if (this.hadScrollbarGutter) root.style.setProperty(gutterProperty, this.previousScrollbarGutter);
      else root.style.removeProperty(gutterProperty);
      this.previousScrollbarGutter = null;
      this.hadScrollbarGutter = false;
      this.pageScrollLocked = false;
    }

    finishClose() {
      this.hidden = true;
      this.classList.remove('is-closing');
      this.unlockPageScroll();
    }

    resetHandleDrag() {
      window.clearTimeout(this.handleDragTimer);
      this.handleDragTimer = null;
      if (this.handleDrag) {
        try { this.handle?.releasePointerCapture(this.handleDrag.pointerId); } catch (_) {}
      }
      this.handleDrag = null;
      this.orderOptionsPanel?.classList.remove('is-handle-dragging', 'is-handle-settling', 'is-handle-closing');
      this.orderOptionsPanel?.style.removeProperty('transform');
      this.orderOptionsPanel?.style.removeProperty('opacity');
      this.orderOptionsPanel?.style.removeProperty('transition');
      this.orderOptionsBackdrop?.style.removeProperty('opacity');
      this.orderOptionsBackdrop?.style.removeProperty('transition');
    }

    getMotionDuration() {
      const value = getComputedStyle(this).getPropertyValue('--cart-drawer-motion-duration').trim();
      const match = value.match(/^([\d.]+)(ms|s)$/);
      if (!match) return 350;
      return Number(match[1]) * (match[2] === 's' ? 1000 : 1);
    }

    async open(trigger = null) {
      this.lastFocusedElement = trigger || document.activeElement;
      window.clearTimeout(this.closeTimer);
      this.resetHandleDrag();
      this.setOrderOptionsOpen(false);
      this.lockPageScroll();
      const shouldAnimateOpen = !(this.isOpen && this.classList.contains('is-open'));
      this.hidden = false;
      this.isOpen = true;
      if (this.classList.contains('is-closing')) this.classList.remove('is-closing');
      if (shouldAnimateOpen) {
        if (this.classList.contains('is-open')) this.classList.remove('is-open');
        // The drawer starts hidden. Force one layout pass in its off-canvas
        // state so the first open can transition instead of jumping to 0.
        this.panel?.getBoundingClientRect();
      }
      if (!this.classList.contains('is-open')) this.classList.add('is-open');
      document.querySelectorAll('[data-cart-drawer-open]').forEach((button) => button.setAttribute('aria-expanded', 'true'));
      this.panel?.focus({ preventScroll: true });
      await this.refresh();
    }

    close() {
      if (!this.isOpen) return;
      this.resetHandleDrag();
      this.setOrderOptionsOpen(false);
      this.isOpen = false;
      this.classList.remove('is-open');
      this.classList.add('is-closing');
      this.backdropInteraction?.hide();
      document.querySelectorAll('[data-cart-drawer-open]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
      this.lastFocusedElement?.focus?.({ preventScroll: true });
      const closeDuration = this.getMotionDuration();
      this.closeTimer = window.setTimeout(() => {
        this.finishClose();
      }, closeDuration);
    }

    async refresh() {
      if (this.busy || this.lineMutationInFlight) {
        this.refreshPending = true;
        return;
      }
      this.busy = true;
      this.setStatus(this.dataset.updatingLabel);
      try {
        const response = await fetch(this.localeUrl('cart.js'), { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (!response.ok) throw new Error(this.dataset.cartUnavailableLabel);
        const cart = await response.json();
        this.currency = cart.currency || this.currency;
        this.renderCart(cart);
        this.updateHeaderCount(cart);
        await this.loadRecommendations(cart);
        document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true, detail: { cart } }));
      } catch (error) {
        console.error('[Spinel] Cart drawer refresh failed', error);
        this.setMessage(error.message, true);
      } finally {
        this.busy = false;
        this.setStatus('');
        if (this.pendingLineMutations.size) this.processLineMutations();
        else if (this.refreshPending) {
          this.refreshPending = false;
          this.refresh();
        }
      }
    }

    renderCart(cart) {
      this.cart = cart;
      if (!cart.item_count) {
        this.renderEmpty();
        return;
      }
      this.footer.hidden = false;
      this.items.innerHTML = cart.items.map((item) => this.itemTemplate(item)).join('');
      const total = this.formatMoney(cart.total_price);
      if (this.total) this.total.textContent = total;
      if (this.checkoutTotal) this.checkoutTotal.textContent = total;
      if (this.taxNote) this.taxNote.textContent = cart.taxes_included ? this.dataset.taxesIncludedLabel : this.dataset.taxesNoteLabel;
      this.renderDiscounts(cart);
      this.renderShippingProgress(cart);
      this.syncAddons(cart);
      const note = this.querySelector('[data-cart-drawer-note]');
      if (note && document.activeElement !== note) note.value = cart.note || '';
    }

    renderEmpty() {
      const emptyLink = this.dataset.emptyLink
        ? `<a class="cart-drawer__empty-link button button--primary" href="${this.escape(this.dataset.emptyLink)}">${this.escape(this.dataset.emptyLinkLabel || 'Continue shopping')}</a>`
        : '';
      const emptyImage = this.dataset.emptyImage
        ? `<img class="cart-drawer__empty-image cart-drawer__empty-image--${this.escape(this.dataset.emptyImageRatio || 'adapt')}" src="${this.escape(this.dataset.emptyImage)}" alt="" loading="lazy">`
        : '';
      this.items.innerHTML = `<div class="cart-drawer__empty">${emptyImage}<p>${this.escape(this.dataset.emptyLabel || 'Your cart is empty')}</p>${emptyLink}</div>`;
      this.footer.hidden = true;
      if (this.recommendations) this.recommendations.hidden = true;
      this.addons && (this.addons.hidden = true);
      this.shippingProgress && (this.shippingProgress.hidden = true);
      window.clearInterval(this.recommendationTimer);
      if (this.discounts) {
        this.discounts.hidden = true;
        this.discounts.replaceChildren();
      }
    }

    updateHeaderCount(cart) {
      document.querySelectorAll('.header__cart').forEach((cartLink) => {
        const previousCount = Number(cartLink.dataset.cartCurrentCount);
        const count = cartLink.querySelector('.header__cart-count');
        if (cart.item_count > 0) {
          const nextCount = count || document.createElement('span');
          nextCount.className = 'header__cart-count';
          const countTemplate = cart.item_count === 1 ? cartLink.dataset.cartCountOneLabel : cartLink.dataset.cartCountLabel;
          const countLabel = countTemplate?.replace('__count__', String(cart.item_count));
          if (countLabel) cartLink.setAttribute('aria-label', countLabel);
          nextCount.setAttribute('aria-hidden', 'true');
          nextCount.textContent = cart.item_count > 99 ? '99+' : cart.item_count;
          if (!count) cartLink.append(nextCount);
        } else {
          count?.remove();
          cartLink.setAttribute('aria-label', cartLink.dataset.cartEmptyLabel || 'Cart');
        }
        const status = cartLink.closest('[data-header]')?.querySelector('[data-cart-count-status]');
        if (status && previousCount !== cart.item_count) status.textContent = cartLink.getAttribute('aria-label') || '';
        cartLink.dataset.cartCurrentCount = String(cart.item_count);
      });
    }

    itemTemplate(item) {
      const image = item.image
        ? `<img src="${this.escape(item.image)}" alt="${this.escape(item.product_title)}" loading="lazy">`
        : '<span class="cart-drawer__image-placeholder" aria-hidden="true"></span>';
      const options = item.product_has_only_default_variant ? '' : (item.options_with_values || []).map((option) => `<div><dt>${this.escape(option.name)}:</dt><dd>${this.escape(option.value)}</dd></div>`).join('');
      const variant = options ? `<dl class="cart-drawer__item-options">${options}</dl>` : '';
      const publicProperties = Object.entries(item.properties || {})
        .filter(([key, value]) => key && !key.startsWith('_') && value != null && String(value).trim() !== '')
        .map(([key, value]) => `<div><dt>${this.escape(key)}:</dt><dd>${this.escape(value)}</dd></div>`)
        .join('');
      const properties = publicProperties ? `<dl class="cart-drawer__item-properties">${publicProperties}</dl>` : '';
      const sellingPlan = item.selling_plan_allocation?.selling_plan?.name ? `<p class="cart-drawer__item-selling-plan">${this.escape(item.selling_plan_allocation.selling_plan.name)}</p>` : '';
      const originalLinePrice = Number(item.original_line_price ?? item.line_price ?? 0);
      const finalLinePrice = Number(item.final_line_price ?? item.line_price ?? 0);
      const isSale = originalLinePrice > finalLinePrice;
      const price = isSale
        ? `<s class="cart-drawer__item-price-compare">${this.formatMoney(originalLinePrice)}</s><span class="cart-drawer__item-price-current">${this.formatMoney(finalLinePrice)}</span>`
        : `<span class="cart-drawer__item-price-current">${this.formatMoney(finalLinePrice)}</span>`;
      const unitPrice = item.unit_price_measurement && item.unit_price != null
        ? `<small class="cart-drawer__item-unit-price">${this.formatMoney(item.unit_price)} / ${this.escape(item.unit_price_measurement.reference_value)}${this.escape(item.unit_price_measurement.reference_unit)}</small>`
        : '';
      const discounts = (item.line_level_discount_allocations || []).map((discount) => `<li><span>${this.escape(discount.discount_application?.title || discount.title || '')}</span><span>−${this.formatMoney(discount.amount)}</span></li>`).join('');
      return `<article class="cart-drawer__item" data-cart-line="${this.escape(item.key)}">
        <a class="cart-drawer__item-media" href="${this.escape(item.url)}">${image}</a>
        <div class="cart-drawer__item-info">
          <h3 class="cart-drawer__item-title"><a href="${this.escape(item.url)}">${this.escape(item.product_title)}</a></h3>
          ${variant}
          ${properties}
          ${sellingPlan}
          <p class="cart-drawer__item-price${isSale ? ' is-sale' : ''}">${price}${unitPrice}</p>
          ${discounts ? `<ul class="cart-drawer__item-discounts" role="list">${discounts}</ul>` : ''}
          <div class="cart-drawer__quantity">
            <button type="button" aria-label="${this.escape(this.dataset.decreaseQuantityLabel || '')}" data-cart-drawer-change data-line="${this.escape(item.key)}" data-quantity-delta="-1">−</button>
            <span aria-live="polite" data-cart-drawer-quantity-value>${item.quantity}</span>
            <button type="button" aria-label="${this.escape(this.dataset.increaseQuantityLabel || '')}" data-cart-drawer-change data-line="${this.escape(item.key)}" data-quantity-delta="1">+</button>
          </div>
          <button class="cart-drawer__remove" type="button" data-cart-drawer-change data-line="${this.escape(item.key)}" data-quantity="0">${this.escape(this.dataset.removeLabel)}</button>
        </div>
      </article>`;
    }

    queueLineChange(line, quantity, delta) {
      if (!line) return;
      const item = (this.cart?.items || []).find((candidate) => candidate.key === line);
      const currentQuantity = this.lineDesiredQuantities.has(line)
        ? this.lineDesiredQuantities.get(line)
        : Number(item?.quantity || 0);
      const desiredQuantity = Number.isFinite(delta)
        ? Math.max(0, currentQuantity + delta)
        : Math.max(0, quantity);
      if (!Number.isFinite(desiredQuantity)) return;

      this.lineDesiredQuantities.set(line, desiredQuantity);
      this.pendingLineMutations.set(line, desiredQuantity);
      this.updateOptimisticLineQuantities();
      this.processLineMutations();
    }

    async processLineMutations() {
      if (this.lineMutationInFlight || this.busy || !this.pendingLineMutations.size) return;
      this.lineMutationInFlight = true;
      this.items?.setAttribute('aria-busy', 'true');
      try {
        while (this.pendingLineMutations.size) {
          const [line, quantity] = this.pendingLineMutations.entries().next().value;
          this.pendingLineMutations.delete(line);
          this.setStatus(this.dataset.updatingLabel);
          const response = await fetch(this.localeUrl('cart/change.js'), {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ id: line, quantity }),
            signal: this.abortController?.signal,
          });
          const cart = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(cart.description || cart.message || this.dataset.cartUpdateErrorLabel);
          if (!this.pendingLineMutations.has(line) && this.lineDesiredQuantities.get(line) === quantity) {
            this.lineDesiredQuantities.delete(line);
          }
          this.syncCart(cart);
          this.updateOptimisticLineQuantities();
        }
        await this.loadRecommendations(this.cart);
      } catch (error) {
        if (error.name === 'AbortError') return;
        console.error('[Spinel] Cart drawer line update failed', error);
        this.pendingLineMutations.clear();
        this.lineDesiredQuantities.clear();
        try {
          const cart = await this.fetchCart();
          this.syncCart(cart);
          await this.loadRecommendations(cart);
        } catch (_) {
          // Preserve the original mutation error when cart recovery also fails.
        }
        this.setMessage(error.message, true);
      } finally {
        this.lineMutationInFlight = false;
        this.items?.removeAttribute('aria-busy');
        this.setStatus('');
        if (this.pendingLineMutations.size) this.processLineMutations();
        else if (this.refreshPending) {
          this.refreshPending = false;
          this.refresh();
        }
      }
    }

    updateOptimisticLineQuantities() {
      this.lineDesiredQuantities.forEach((quantity, line) => {
        this.querySelectorAll('[data-cart-line]').forEach((item) => {
          if (item.dataset.cartLine !== line) return;
          const value = item.querySelector('[data-cart-drawer-quantity-value]');
          if (value) value.textContent = quantity;
        });
      });
    }

    async addRelatedProduct(button) {
      const variantId = button?.dataset.variantId;
      if (!variantId || button.disabled) return;
      button.disabled = true;
      button.textContent = this.dataset.addingLabel;
      try {
        const formData = new FormData();
        formData.set('id', variantId);
        formData.set('quantity', '1');
        const response = await fetch(this.localeUrl('cart/add.js'), { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: formData });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.description || payload.message || this.dataset.relatedProductErrorLabel);
        }
        await this.refresh();
      } catch (error) {
        console.error('[Spinel] Related product add failed', error);
        this.setMessage(error.message, true);
        button.disabled = false;
        button.textContent = this.dataset.addToCartLabel;
      }
    }

    readComplementaryProducts() {
      const source = this.querySelector('[data-cart-drawer-complementary-products]');
      if (!source?.textContent) return [];
      try {
        const products = JSON.parse(source.textContent);
        return Array.isArray(products) ? products : [];
      } catch (error) {
        console.warn('[Spinel] Complementary products could not be read.', error);
        return [];
      }
    }

    renderShippingProgress(cart) {
      if (!this.shippingProgress) return;
      const threshold = Number(this.dataset.shippingThreshold || 0);
      if (!threshold) {
        this.shippingProgress.hidden = true;
        return;
      }
      const total = Number(cart.items_subtotal_price ?? cart.total_price ?? 0);
      const remaining = Math.max(0, threshold - total);
      const unlocked = remaining === 0;
      const template = unlocked ? this.shippingCopy?.dataset.success : this.shippingCopy?.dataset.pending;
      if (this.shippingMessage) this.shippingMessage.textContent = String(template || '').replace(/\{\{ ?amount ?\}\}|\{amount\}/g, this.formatMoney(remaining));
      if (this.shippingProgressValue) this.shippingProgressValue.style.width = `${Math.min(100, Math.round((total / threshold) * 100))}%`;
      this.shippingProgress.hidden = false;
      this.shippingProgress.dataset.unlocked = String(unlocked);
    }

    syncAddons(cart) {
      if (!this.addons) return;
      const items = cart.items || [];
      let hasAddon = false;
      this.addons.querySelectorAll('[data-cart-drawer-addon]').forEach((input) => {
        const variantId = Number(input.dataset.variantId || 0);
        const item = items.find((candidate) => Number(candidate.variant_id) === variantId);
        input.checked = Boolean(item);
        input.closest('[data-cart-drawer-addon-wrapper]')?.classList.toggle('is-selected', Boolean(item));
        hasAddon = hasAddon || Boolean(input.dataset.variantId);
      });
      this.addons.hidden = !hasAddon;
    }

    async toggleAddon(input) {
      const variantId = input?.dataset.variantId;
      if (!variantId || input.disabled) return;
      input.disabled = true;
      try {
        const existingItem = (this.cart?.items || []).find((item) => String(item.variant_id) === String(variantId));
        let response;
        if (input.checked) {
          response = await fetch(this.localeUrl('cart/add.js'), {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ items: [{ id: Number(variantId), quantity: 1 }] })
          });
        } else if (existingItem) {
          response = await fetch(this.localeUrl('cart/change.js'), {
            method: 'POST',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            body: JSON.stringify({ id: existingItem.key, quantity: 0 })
          });
        }
        if (!response?.ok) throw new Error(this.dataset.cartUpdateErrorLabel);
        await this.refresh();
      } catch (error) {
        console.error('[Spinel] Cart add-on update failed', error);
        input.checked = !input.checked;
        this.setMessage(error.message, true);
      } finally {
        input.disabled = false;
      }
    }

    async estimateShipping(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const country = String(data.get('country') || '').trim();
      const province = String(data.get('province') || '').trim();
      const zip = String(data.get('zip') || '').trim();
      if (!country || !zip) return;
      this.clearShippingFieldErrors();
      const query = new URLSearchParams({ 'shipping_address[country]': country, 'shipping_address[zip]': zip });
      if (province) query.set('shipping_address[province]', province);
      this.shippingRates.textContent = this.dataset.shippingCalculatingLabel || 'Calculating shipping rates';
      try {
        const prepare = await fetch(this.localeUrl(`cart/prepare_shipping_rates.json?${query}`), {
          method: 'POST',
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin'
        });
        if (!prepare.ok && prepare.status !== 202) throw await this.shippingErrorFromResponse(prepare);
        const rates = await this.pollShippingRates(query);
        this.shippingRates.innerHTML = rates.length
          ? `<span>${rates.map((rate) => `${this.escape(rate.presentment_name || rate.name)}: ${this.escape(this.formatMoney(Math.round(Number(rate.price || 0) * 100)))}`).join('</span><span>')}</span>`
          : this.escape(this.dataset.shippingErrorLabel);
      } catch (error) {
        this.shippingRates.textContent = error.message || this.dataset.shippingErrorLabel;
      }
    }

    updateShippingProvinces() {
      if (!this.shippingCountry || !this.shippingProvince || !this.shippingProvinceField) return;
      const defaultCountry = this.shippingCountry.dataset.defaultCountry;
      if (defaultCountry && !this.shippingCountry.value) this.shippingCountry.value = defaultCountry;
      const country = this.shippingCountry.options[this.shippingCountry.selectedIndex];
      let provinces = [];
      try {
        provinces = JSON.parse(country?.dataset.provinces || '[]');
      } catch (_) {
        provinces = [];
      }
      const hasProvinces = Array.isArray(provinces) && provinces.length > 0;
      this.shippingProvince.replaceChildren();
      if (hasProvinces) {
        const placeholder = new Option(this.dataset.shippingProvincePlaceholder || '', '', true, true);
        placeholder.disabled = true;
        this.shippingProvince.add(placeholder);
        provinces.forEach((province) => {
          const [label, value] = Array.isArray(province)
            ? province
            : [province.name, province.code || province.name];
          this.shippingProvince.add(new Option(label, value));
        });
      }
      this.shippingProvince.required = hasProvinces;
      this.shippingProvince.disabled = !hasProvinces;
      this.shippingProvinceField.hidden = !hasProvinces;
      this.clearShippingFieldErrors();
    }

    clearShippingFieldErrors() {
      this.shippingEstimator?.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
    }

    async shippingErrorFromResponse(response) {
      const fallback = this.dataset.shippingErrorLabel || 'Shipping rates could not be calculated.';
      const result = await response.json().catch(() => null);
      if (!result || typeof result !== 'object') return new Error(fallback);
      const [field, messages] = Object.entries(result)[0] || [];
      const message = Array.isArray(messages) ? messages[0] : messages;
      const input = field && this.shippingEstimator?.elements.namedItem(field);
      input?.setAttribute('aria-invalid', 'true');
      return new Error(message || fallback);
    }

    async pollShippingRates(query) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const response = await fetch(this.localeUrl(`cart/async_shipping_rates.json?${query}`), { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (response.ok) {
          const result = await response.json();
          if (Array.isArray(result.shipping_rates)) return result.shipping_rates;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
      throw new Error(this.dataset.shippingErrorLabel);
    }

    async loadRecommendations(cart) {
      if (!this.recommendations || !this.recommendationList || !this.recommendationTrack || !this.recommendationDots || this.dataset.recommendationsEnabled !== 'true' || !cart.items.length) {
        this.destroyRecommendationSwiper();
        if (this.recommendations) this.recommendations.hidden = true;
        return;
      }
      const limit = Number(this.dataset.recommendationsLimit || 4);
      try {
        let products;
        if (this.dataset.recommendationsSource === 'manual') {
          products = this.complementaryProducts.filter((product) => !cart.items.some((item) => Number(item.product_id) === Number(product.id)));
        } else {
          const url = new URL(this.localeUrl('recommendations/products.json'), window.location.origin);
          url.searchParams.set('product_id', cart.items[0].product_id);
          url.searchParams.set('limit', Math.min(8, Math.max(2, limit)));
          url.searchParams.set('intent', 'related');
          const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
          if (!response.ok) throw new Error('Recommendations unavailable');
          const data = await response.json();
          products = (data.products || []).filter((product) => !cart.items.some((item) => item.product_id === product.id));
        }
        if (!products.length) {
          this.destroyRecommendationSwiper();
          this.recommendations.hidden = true;
          return;
        }
        const visibleProducts = products.slice(0, limit);
        this.destroyRecommendationSwiper();
        this.recommendationTrack.innerHTML = visibleProducts.map((product) => this.recommendationTemplate(product)).join('');
        this.recommendationDots.innerHTML = visibleProducts.map((_, index) => {
          const label = (this.dataset.relatedProductLabel || '').replace('__index__', String(index + 1));
          return `<button type="button" class="cart-drawer__recommendation-dot" data-cart-drawer-recommendation-dot data-index="${index}" aria-label="${this.escape(label)}" aria-controls="${this.escape(this.recommendationList?.id || '')}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`;
        }).join('');
        this.recommendations.hidden = false;
        this.initializeRecommendationSwiper(visibleProducts.length);
        this.startRecommendationRotation(visibleProducts.length);
      } catch (error) {
        this.destroyRecommendationSwiper();
        this.recommendations.hidden = true;
      }
    }

    goToRecommendation(index) {
      if (!this.recommendationSwiper) return;
      if (this.recommendationSwiper.params.loop) this.recommendationSwiper.slideToLoop(index);
      else this.recommendationSwiper.slideTo(index);
    }

    updateRecommendationDot(forcedIndex = null) {
      if (!this.recommendationDots) return;
      const index = forcedIndex ?? this.recommendationSwiper?.realIndex ?? 0;
      this.recommendationDots.querySelectorAll('[data-cart-drawer-recommendation-dot]').forEach((dot, dotIndex) => {
        dot.setAttribute('aria-current', String(dotIndex === index));
      });
    }

    initializeRecommendationSwiper(count) {
      if (!this.recommendationList || !this.recommendationTrack || count < 1) return;
      this.recommendationSwiper = new Swiper(this.recommendationList, {
        modules: [A11y],
        slidesPerView: 1,
        spaceBetween: 0,
        speed: this.reduceMotion.matches ? 0 : 360,
        loop: count > 1,
        watchOverflow: true,
        grabCursor: count > 1,
        allowTouchMove: count > 1,
        a11y: {
          enabled: true,
          slideRole: 'group',
        },
      });
      this.recommendationSwiper.on('slideChange', () => this.updateRecommendationDot());
      this.recommendationSwiper.on('sliderFirstMove', () => this.startRecommendationRotation(count));
      this.updateRecommendationDot(0);
    }

    destroyRecommendationSwiper() {
      this.recommendationSwiper?.destroy(true, true);
      this.recommendationSwiper = null;
      window.clearInterval(this.recommendationTimer);
      this.recommendationTimer = null;
    }

    recommendationTemplate(product) {
      const variant = product.variants?.find((candidate) => candidate.available) || product.variants?.[0] || (product.variant_id ? { id: product.variant_id, available: product.available, price: product.price } : null);
      const image = product.featured_image || product.images?.[0];
      const requiredAllocation = (product.requires_selling_plan || variant?.requires_selling_plan)
        ? variant?.selling_plan_allocations?.[0]
        : null;
      const requiresSellingPlanSelection = Boolean(
        product.requires_selling_plan
        || product.selling_plan_groups?.length
        || variant?.requires_selling_plan
        || variant?.selling_plan_allocations?.length
      );
      const action = !variant?.available || requiresSellingPlanSelection
        ? `<a class="cart-drawer__text-button" href="${this.escape(product.url)}">${this.escape(this.dataset.chooseOptionsLabel)}</a>`
        : `<button type="button" class="cart-drawer__text-button" data-cart-drawer-related-add data-variant-id="${this.escape(variant?.id || '')}">${this.escape(this.dataset.addToCartLabel)}</button>`;
      const displayPrice = requiredAllocation?.price ?? variant?.price ?? product.price;
      return `<article class="cart-drawer__recommendation swiper-slide">
        <a class="cart-drawer__recommendation-media" href="${this.escape(product.url)}">${image ? `<img src="${this.escape(image)}" alt="${this.escape(product.title)}" loading="lazy">` : ''}</a>
        <div><h4><a href="${this.escape(product.url)}">${this.escape(product.title)}</a></h4><p>${this.formatMoney(displayPrice)}</p>${action}</div>
      </article>`;
    }

    startRecommendationRotation(count) {
      window.clearInterval(this.recommendationTimer);
      if (this.dataset.recommendationsAutoRotate !== 'true' || count < 2) return;
      const interval = Math.max(3, Number(this.dataset.recommendationsInterval || 8)) * 1000;
      this.recommendationTimer = window.setInterval(() => {
        if (this.dataset.recommendationsPauseOnHover === 'true' && this.recommendationPaused) return;
        if (!this.recommendationSwiper) return;
        this.recommendationSwiper.slideNext();
      }, interval);
    }

    async applyDiscount(event) {
      event.preventDefault();
      const input = event.currentTarget.querySelector('input[name="discount"]');
      const button = event.currentTarget.querySelector('button[type="submit"]');
      const code = input?.value.trim();
      if (button?.disabled) return;
      input?.removeAttribute('aria-invalid');
      this.setMessage('');
      if (!code) {
        input?.setAttribute('aria-invalid', 'true');
        this.setMessage(this.dataset.discountErrorLabel, true);
        return;
      }
      if (button) button.disabled = true;
      try {
        this.setStatus(this.dataset.applyingDiscountLabel);
        const previousCodes = this.storedDiscountCodes(this.cart);
        const requestedCodes = this.mergeDiscountCodes(previousCodes, [code]);
        const cart = await this.updateDiscountCodes(requestedCodes);

        if (!this.isDiscountApplied(cart, code)) {
          let restoredCart = cart;
          try {
            restoredCart = await this.updateDiscountCodes(previousCodes);
          } catch (rollbackError) {
            console.error('[Jovie] Discount rollback failed', rollbackError);
            try {
              restoredCart = await this.fetchCart();
            } catch (reconcileError) {
              console.error('[Jovie] Cart reconciliation failed', reconcileError);
            }
          }
          this.syncCart(restoredCart);
          throw new Error(this.dataset.discountErrorLabel);
        }

        this.syncCart(cart);
        input.value = '';
        this.setMessage(this.dataset.discountAppliedLabel);
      } catch (error) {
        console.error('[Jovie] Discount code failed', error);
        input?.setAttribute('aria-invalid', 'true');
        this.setMessage(error.message, true);
      } finally {
        if (button) button.disabled = false;
        this.setStatus('');
      }
    }

    async saveNote() {
      const note = this.querySelector('[data-cart-drawer-note]')?.value || '';
      try {
        this.setStatus(this.dataset.savingNoteLabel);
        const response = await fetch(this.dataset.cartUpdateUrl || this.localeUrl('cart/update.js'), { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify({ note }) });
        if (!response.ok) throw new Error(this.dataset.noteErrorLabel);
        this.setMessage(this.dataset.noteSavedLabel);
      } catch (error) {
        console.error('[Spinel] Order note failed', error);
        this.setMessage(error.message, true);
      } finally {
        this.setStatus('');
      }
    }

    setStatus(message) {
      if (this.status) {
        this.status.textContent = message;
        this.status.hidden = !message;
      }
      if (this.loading) this.loading.hidden = !message;
    }

    renderDiscounts(cart) {
      if (!this.discounts) return;
      const discounts = cart.cart_level_discount_applications || [];
      this.discounts.innerHTML = discounts.map((discount) => `<li><span>${this.escape(discount.title)}</span><span>−${this.formatMoney(discount.total_allocated_amount)}</span></li>`).join('');
      this.discounts.hidden = discounts.length === 0;
    }

    isDiscountApplied(cart, code) {
      const normalizeCode = (value) => String(value || '').trim().toLowerCase();
      const normalizedCode = normalizeCode(code);
      const discountCodes = cart.discount_codes || cart.discountCodes || [];
      const matchingCode = discountCodes.find((discount) => normalizeCode(discount.code) === normalizedCode);

      if (matchingCode) return matchingCode.applicable !== false;

      const applications = [
        ...(cart.discount_applications || []),
        ...(cart.cart_level_discount_applications || []),
        ...(cart.items || []).flatMap((item) => (
          item.line_level_discount_allocations || []
        ).map((allocation) => allocation.discount_application || allocation))
      ];

      return applications.some((application) => {
        const type = String(application.type || '').toLowerCase();
        return normalizeCode(application.title) === normalizedCode
          && (!type || type === 'discount_code' || type === 'code');
      });
    }

    storedDiscountCodes(cart) {
      const discountCodes = cart?.discount_codes || cart?.discountCodes || [];
      const codes = discountCodes
        .map((discount) => discount.code);
      if (codes.length) return this.mergeDiscountCodes(codes);
      const applications = [
        ...(cart?.discount_applications || []),
        ...(cart?.cart_level_discount_applications || []),
        ...(cart?.items || []).flatMap((item) => (
          item.line_level_discount_allocations || []
        ).map((allocation) => allocation.discount_application || allocation))
      ];
      applications.forEach((application) => {
        const type = String(application.type || '').toLowerCase();
        if (type === 'discount_code' || type === 'code') codes.push(application.title);
      });
      return this.mergeDiscountCodes(codes);
    }

    mergeDiscountCodes(...groups) {
      const seen = new Set();
      return groups.flat().map((code) => String(code || '').trim()).filter((code) => {
        const normalizedCode = code.toLowerCase();
        if (!normalizedCode || seen.has(normalizedCode)) return false;
        seen.add(normalizedCode);
        return true;
      });
    }

    async updateDiscountCodes(codes) {
      const response = await fetch(this.dataset.cartUpdateUrl || this.localeUrl('cart/update.js'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        credentials: 'same-origin',
        body: JSON.stringify({ discount: codes.join(',') })
      });
      const cart = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(cart.description || cart.message || this.dataset.discountErrorLabel);
      return cart;
    }

    async fetchCart() {
      const response = await fetch(this.localeUrl('cart.js'), {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      });
      if (!response.ok) throw new Error(this.dataset.cartUnavailableLabel);
      return response.json();
    }

    syncCart(cart) {
      this.currency = cart.currency || this.currency;
      this.renderCart(cart);
      this.updateHeaderCount(cart);
      document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true, detail: { cart } }));
    }

    localeUrl(path) {
      const root = window.Shopify?.routes?.root || '/';
      return `${root.endsWith('/') ? root : `${root}/`}${String(path || '').replace(/^\/+/, '')}`;
    }

    setMessage(message, isError = false) {
      if (!this.message) return;
      this.message.textContent = message;
      this.message.dataset.error = isError ? 'true' : 'false';
      this.message.hidden = !message;
    }

    formatMoney(cents) {
      return window.SpinelMoney?.format(cents, {
        currency: this.currency,
        showCurrencyCode: this.dataset.showCurrencyCode === 'true',
      }) || String(cents || 0);
    }

    escape(value) {
      const element = document.createElement('div');
      element.textContent = value == null ? '' : String(value);
      return element.innerHTML.replaceAll('"', '&quot;');
    }
  }

  customElements.define('cart-drawer', CartDrawer);
})();
