(() => {
  if (customElements.get('cart-drawer')) return;

  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.backdrop = this.querySelector('[data-cart-drawer-close]');
      this.backdropPointer = this.querySelector('.cart-drawer__backdrop-pointer');
      this.panel = this.querySelector('.cart-drawer__panel');
      this.items = this.querySelector('[data-cart-drawer-items]');
      this.footer = this.querySelector('[data-cart-drawer-footer]');
      this.status = this.querySelector('[data-cart-drawer-status]');
      this.loading = this.querySelector('[data-cart-drawer-loading]');
      this.message = this.querySelector('[data-cart-drawer-message]');
      this.discounts = this.querySelector('[data-cart-drawer-discounts]');
      this.total = this.querySelector('[data-cart-drawer-total]');
      this.checkoutTotal = this.querySelector('[data-cart-drawer-checkout-total]');
      this.taxNote = this.querySelector('[data-cart-drawer-tax-note]');
      this.recommendations = this.querySelector('[data-cart-drawer-recommendations]');
      this.recommendationList = this.querySelector('[data-cart-drawer-recommendation-list]');
      this.recommendationDots = this.querySelector('[data-cart-drawer-recommendation-dots]');
      this.currency = this.dataset.currency || 'USD';
      this.isOpen = false;
      this.busy = false;
      this.lastFocusedElement = null;
      this.bind();
      this.renderEmpty();
      this.handleProductAdd = (event) => {
        if (!event.detail?.item) return;
        this.open(event.detail.button || null);
      };
      document.addEventListener('product:add:success', this.handleProductAdd, { signal: this.abortController?.signal });
      document.addEventListener('cart:add:success', this.handleProductAdd, { signal: this.abortController?.signal });
    }

    disconnectedCallback() {
      this.abortController?.abort();
      document.documentElement.classList.remove('cart-drawer-open');
      document.documentElement.classList.remove('cart-drawer-backdrop-cursor');
    }

    bind() {
      this.abortController = new AbortController();
      const { signal } = this.abortController;
      document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-cart-drawer-open]');
        if (!trigger) return;
        event.preventDefault();
        this.open(trigger);
      }, { signal });
      document.addEventListener('mousemove', (event) => {
        if (!this.isOpen) return;
        const rect = this.panel?.getBoundingClientRect();
        const isOverPanel = rect
          && event.clientX >= rect.left
          && event.clientX <= rect.right
          && event.clientY >= rect.top
          && event.clientY <= rect.bottom;
        const isOverBackdrop = !isOverPanel;
        document.documentElement.classList.toggle('cart-drawer-backdrop-cursor', isOverBackdrop);
        if (!this.backdropPointer) return;
        this.backdropPointer.style.setProperty('--cart-drawer-pointer-x', `${event.clientX}px`);
        this.backdropPointer.style.setProperty('--cart-drawer-pointer-y', `${event.clientY}px`);
        this.backdropPointer.classList.toggle('is-visible', isOverBackdrop);
      }, { passive: true, signal });
      this.addEventListener('click', (event) => {
        if (event.target.closest('[data-cart-drawer-close]')) {
          event.preventDefault();
          this.close();
          return;
        }
        const change = event.target.closest('[data-cart-drawer-change]');
        if (change) this.changeLine(change.dataset.line, Number(change.dataset.quantity));
        const relatedAdd = event.target.closest('[data-cart-drawer-related-add]');
        if (relatedAdd) this.addRelatedProduct(relatedAdd);
        const recommendationDot = event.target.closest('[data-cart-drawer-recommendation-dot]');
        if (recommendationDot) this.goToRecommendation(Number(recommendationDot.dataset.index));
      }, { signal });
      this.querySelector('[data-cart-drawer-discount]')?.addEventListener('submit', (event) => this.applyDiscount(event), { signal });
      this.querySelector('[data-cart-drawer-save-note]')?.addEventListener('click', () => this.saveNote(), { signal });
      this.recommendationList?.addEventListener('scroll', () => this.updateRecommendationDot(), { passive: true, signal });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && this.isOpen) this.close();
        if (event.key === 'Tab' && this.isOpen) this.trapFocus(event);
      }, { signal });
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

    async open(trigger = null) {
      this.lastFocusedElement = trigger || document.activeElement;
      window.clearTimeout(this.closeTimer);
      this.hidden = false;
      this.isOpen = true;
      this.classList.remove('is-closing');
      this.classList.add('is-open');
      document.documentElement.classList.add('cart-drawer-open');
      document.querySelectorAll('[data-cart-drawer-open]').forEach((button) => button.setAttribute('aria-expanded', 'true'));
      this.panel?.focus({ preventScroll: true });
      await this.refresh();
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.classList.remove('is-open');
      this.classList.add('is-closing');
      document.documentElement.classList.remove('cart-drawer-open');
      document.documentElement.classList.remove('cart-drawer-backdrop-cursor');
      this.backdropPointer?.classList.remove('is-visible');
      document.querySelectorAll('[data-cart-drawer-open]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
      this.lastFocusedElement?.focus?.({ preventScroll: true });
      this.closeTimer = window.setTimeout(() => {
        this.hidden = true;
        this.classList.remove('is-closing');
      }, 350);
    }

    async refresh() {
      if (this.busy) return;
      this.busy = true;
      this.setStatus(this.dataset.updatingLabel);
      try {
        const response = await fetch('/cart.js', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
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
      }
    }

    renderCart(cart) {
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
      const note = this.querySelector('[data-cart-drawer-note]');
      if (note && document.activeElement !== note) note.value = cart.note || '';
    }

    renderEmpty() {
      this.items.innerHTML = `<p class="cart-drawer__empty">${this.escape(this.dataset.emptyLabel || 'Your cart is empty')}</p>`;
      this.footer.hidden = true;
      this.recommendations.hidden = true;
      if (this.discounts) {
        this.discounts.hidden = true;
        this.discounts.replaceChildren();
      }
    }

    updateHeaderCount(cart) {
      document.querySelectorAll('.header__cart').forEach((cartLink) => {
        const count = cartLink.querySelector('.header__cart-count');
        if (cart.item_count > 0) {
          const nextCount = count || document.createElement('span');
          nextCount.className = 'header__cart-count';
          const countLabel = cartLink.dataset.cartCountLabel?.replace('__count__', String(cart.item_count));
          if (countLabel) nextCount.setAttribute('aria-label', countLabel);
          nextCount.textContent = cart.item_count;
          if (!count) cartLink.append(nextCount);
        } else {
          count?.remove();
        }
      });
    }

    itemTemplate(item) {
      const image = item.image
        ? `<img src="${this.escape(item.image)}" alt="${this.escape(item.product_title)}" loading="lazy">`
        : '<span class="cart-drawer__image-placeholder" aria-hidden="true"></span>';
      const options = item.product_has_only_default_variant ? '' : (item.options_with_values || []).map((option) => `<div><dt>${this.escape(option.name)}:</dt><dd>${this.escape(option.value)}</dd></div>`).join('');
      const variant = options ? `<dl class="cart-drawer__item-options">${options}</dl>` : '';
      const sellingPlan = item.selling_plan_allocation?.selling_plan?.name ? `<p class="cart-drawer__item-selling-plan">${this.escape(item.selling_plan_allocation.selling_plan.name)}</p>` : '';
      const originalLinePrice = Number(item.original_line_price ?? item.line_price ?? 0);
      const finalLinePrice = Number(item.final_line_price ?? item.line_price ?? 0);
      const isSale = originalLinePrice > finalLinePrice;
      const price = isSale
        ? `<s class="cart-drawer__item-price-compare">${this.formatMoney(originalLinePrice)}</s><span class="cart-drawer__item-price-current">${this.formatMoney(finalLinePrice)}</span>`
        : `<span class="cart-drawer__item-price-current">${this.formatMoney(finalLinePrice)}</span>`;
      const finalUnitPrice = `<small class="cart-drawer__item-final-price">${this.escape(this.dataset.unitPriceLabel)}: ${this.formatMoney(item.final_price)}</small>`;
      const unitPrice = item.unit_price_measurement ? `<small class="cart-drawer__item-unit-price">${this.formatMoney(item.unit_price)} / ${this.escape(item.unit_price_measurement.reference_value)}${this.escape(item.unit_price_measurement.reference_unit)}</small>` : '';
      const discounts = (item.line_level_discount_allocations || []).map((discount) => `<li><span>${this.escape(discount.discount_application?.title || discount.title || '')}</span><span>−${this.formatMoney(discount.amount)}</span></li>`).join('');
      return `<article class="cart-drawer__item" data-cart-line="${this.escape(item.key)}">
        <a class="cart-drawer__item-media" href="${this.escape(item.url)}">${image}</a>
        <div class="cart-drawer__item-info">
          <h3 class="cart-drawer__item-title"><a href="${this.escape(item.url)}">${this.escape(item.product_title)}</a></h3>
          ${variant}
          ${sellingPlan}
          <p class="cart-drawer__item-price${isSale ? ' is-sale' : ''}">${finalUnitPrice}${price}${unitPrice}</p>
          ${discounts ? `<ul class="cart-drawer__item-discounts" role="list">${discounts}</ul>` : ''}
          <div class="cart-drawer__quantity">
            <button type="button" aria-label="${this.escape(this.dataset.decreaseQuantityLabel || '')}" data-cart-drawer-change data-line="${this.escape(item.key)}" data-quantity="${Math.max(0, item.quantity - 1)}">−</button>
            <span aria-live="polite">${item.quantity}</span>
            <button type="button" aria-label="${this.escape(this.dataset.increaseQuantityLabel || '')}" data-cart-drawer-change data-line="${this.escape(item.key)}" data-quantity="${item.quantity + 1}">+</button>
          </div>
          <button class="cart-drawer__remove" type="button" data-cart-drawer-change data-line="${this.escape(item.key)}" data-quantity="0">${this.escape(this.dataset.removeLabel)}</button>
        </div>
      </article>`;
    }

    async changeLine(line, quantity) {
      if (!line || !Number.isFinite(quantity)) return;
      try {
        this.setStatus(this.dataset.updatingLabel);
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ id: line, quantity })
        });
        if (!response.ok) throw new Error(this.dataset.cartUpdateErrorLabel);
        await this.refresh();
      } catch (error) {
        console.error('[Spinel] Cart drawer line update failed', error);
        this.setMessage(error.message, true);
      } finally {
        this.setStatus('');
      }
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
        const response = await fetch('/cart/add.js', { method: 'POST', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: formData });
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

    async loadRecommendations(cart) {
      if (this.dataset.recommendationsEnabled !== 'true' || !cart.items.length) {
        this.recommendations.hidden = true;
        return;
      }
      const productId = cart.items[0].product_id;
      const limit = Number(this.dataset.recommendationsLimit || 4);
      try {
        const url = `/recommendations/products.json?product_id=${encodeURIComponent(productId)}&limit=${Math.min(8, Math.max(2, limit))}&intent=related`;
        const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (!response.ok) throw new Error('Recommendations unavailable');
        const data = await response.json();
        const products = (data.products || []).filter((product) => !cart.items.some((item) => item.product_id === product.id));
        if (!products.length) {
          this.recommendations.hidden = true;
          return;
        }
        this.recommendationList.innerHTML = products.slice(0, limit).map((product) => this.recommendationTemplate(product)).join('');
        this.recommendationDots.innerHTML = products.slice(0, limit).map((_, index) => {
          const label = (this.dataset.relatedProductLabel || '').replace('__index__', String(index + 1));
          return `<button type="button" class="cart-drawer__recommendation-dot" data-cart-drawer-recommendation-dot data-index="${index}" aria-label="${this.escape(label)}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`;
        }).join('');
        this.recommendations.hidden = false;
      } catch (error) {
        this.recommendations.hidden = true;
      }
    }

    goToRecommendation(index) {
      const slides = [...(this.recommendationList?.children || [])];
      const slide = slides[index];
      if (!slide) return;
      this.recommendationList.scrollTo({ left: slide.offsetLeft, behavior: 'smooth' });
      this.updateRecommendationDot(index);
    }

    updateRecommendationDot(forcedIndex = null) {
      const slides = [...(this.recommendationList?.children || [])];
      if (!slides.length || !this.recommendationDots) return;
      const index = forcedIndex ?? slides.reduce((closest, slide, slideIndex) => {
        const currentDistance = Math.abs(slide.offsetLeft - this.recommendationList.scrollLeft);
        const closestDistance = Math.abs(slides[closest].offsetLeft - this.recommendationList.scrollLeft);
        return currentDistance < closestDistance ? slideIndex : closest;
      }, 0);
      this.recommendationDots.querySelectorAll('[data-cart-drawer-recommendation-dot]').forEach((dot, dotIndex) => {
        dot.setAttribute('aria-current', String(dotIndex === index));
      });
    }

    recommendationTemplate(product) {
      const variant = product.variants?.[0];
      const image = product.featured_image || product.images?.[0];
      return `<article class="cart-drawer__recommendation">
        <a class="cart-drawer__recommendation-media" href="${this.escape(product.url)}">${image ? `<img src="${this.escape(image)}" alt="${this.escape(product.title)}" loading="lazy">` : ''}</a>
        <div><h4><a href="${this.escape(product.url)}">${this.escape(product.title)}</a></h4><p>${this.formatMoney(product.price)}</p><button type="button" class="cart-drawer__text-button" data-cart-drawer-related-add data-variant-id="${this.escape(variant?.id || '')}">${this.escape(this.dataset.addToCartLabel)}</button></div>
      </article>`;
    }

    async applyDiscount(event) {
      event.preventDefault();
      const input = event.currentTarget.querySelector('input[name="discount"]');
      const code = input?.value.trim();
      if (!code) return;
      try {
        this.setStatus(this.dataset.applyingDiscountLabel);
        const response = await fetch(`/discount/${encodeURIComponent(code)}?redirect=/cart`, { credentials: 'same-origin', redirect: 'follow' });
        if (!response.ok) throw new Error(this.dataset.discountErrorLabel);
        this.setMessage(this.dataset.discountAppliedLabel);
        await this.refresh();
      } catch (error) {
        console.error('[Spinel] Discount code failed', error);
        this.setMessage(error.message, true);
      } finally {
        this.setStatus('');
      }
    }

    async saveNote() {
      const note = this.querySelector('[data-cart-drawer-note]')?.value || '';
      try {
        this.setStatus(this.dataset.savingNoteLabel);
        const response = await fetch('/cart/update.js', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify({ note }) });
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
        this.status.hidden = true;
      }
      if (this.loading) this.loading.hidden = !message;
    }

    renderDiscounts(cart) {
      if (!this.discounts) return;
      const discounts = cart.cart_level_discount_applications || [];
      this.discounts.innerHTML = discounts.map((discount) => `<li><span>${this.escape(discount.title)}</span><span>−${this.formatMoney(discount.total_allocated_amount)}</span></li>`).join('');
      this.discounts.hidden = discounts.length === 0;
    }

    setMessage(message, isError = false) {
      if (!this.message) return;
      this.message.textContent = message;
      this.message.dataset.error = isError ? 'true' : 'false';
      this.message.hidden = !message;
    }

    formatMoney(cents) {
      const value = Number(cents || 0) / 100;
      try {
        return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: this.currency }).format(value);
      } catch {
        return `${value.toFixed(2)} ${this.currency}`;
      }
    }

    escape(value) {
      const element = document.createElement('div');
      element.textContent = value == null ? '' : String(value);
      return element.innerHTML.replaceAll('"', '&quot;');
    }
  }

  customElements.define('cart-drawer', CartDrawer);
})();
