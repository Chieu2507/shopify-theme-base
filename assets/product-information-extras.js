const PDP_DRAWER_CLOSE_DELAY = 350;
const PDP_DRAWER_SHEET_BREAKPOINT = 767;
const PDP_DRAWER_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const syncPdpDrawerScrollLock = () => {
  const isOpen = Boolean(document.querySelector('[data-pdp-drawer].is-open'));
  document.documentElement.classList.toggle('pdp-drawer-open', isOpen);
  document.body.classList.toggle('pdp-drawer-open', isOpen);
};

class PdpDrawerElement extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.drawer = this.querySelector('[data-pdp-drawer]');
    this.panel = this.drawer?.querySelector('[data-pdp-drawer-panel]');
    this.sheetHeader = this.panel?.querySelector('[data-pdp-drawer-sheet-header]');
    this.trigger = this.querySelector('[data-pdp-drawer-open]');
    this.closeButton = this.panel?.querySelector('[data-pdp-drawer-close]');
    this.closeTimer = null;
    this.sheetDragTimer = 0;
    this.sheetDrag = null;
    this.previousFocus = null;

    this.handleSheetPointerDown = this.handleSheetPointerDown.bind(this);
    this.handleSheetPointerMove = this.handleSheetPointerMove.bind(this);
    this.handleSheetPointerUp = this.handleSheetPointerUp.bind(this);
    this.handleSheetPointerCancel = this.handleSheetPointerCancel.bind(this);

    this.trigger?.addEventListener('click', () => this.open(), { signal: this.abortController.signal });
    this.drawer?.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-pdp-drawer-close]')) {
        event.preventDefault();
        this.close();
      }
    }, { signal: this.abortController.signal });
    this.drawer?.addEventListener('keydown', (event) => this.handleKeydown(event), { signal: this.abortController.signal });
    document.addEventListener('pointerdown', this.handleSheetPointerDown, { signal: this.abortController.signal });
    document.addEventListener('pointermove', this.handleSheetPointerMove, { signal: this.abortController.signal });
    document.addEventListener('pointerup', this.handleSheetPointerUp, { signal: this.abortController.signal });
    document.addEventListener('pointercancel', this.handleSheetPointerCancel, { signal: this.abortController.signal });
    document.addEventListener('shopify:block:select', (event) => {
      if (event.target === this || this.contains(event.target)) this.open({ focus: false });
    }, { signal: this.abortController.signal });
    document.addEventListener('shopify:block:deselect', (event) => {
      if (event.target === this) this.close({ force: true });
    }, { signal: this.abortController.signal });
    document.addEventListener('shopify:section:unload', (event) => {
      if (event.target === this || event.target?.contains?.(this)) this.close({ force: true, restoreFocus: false });
    }, { signal: this.abortController.signal });

    this.portalDrawer();
  }

  disconnectedCallback() {
    const drawer = this.drawer;
    this.close({ force: true, restoreFocus: false });
    window.clearTimeout(this.closeTimer);
    this.closeTimer = null;
    if (drawer?.dataset.pdpDrawerPortal === 'true' && drawer.parentElement === document.body) {
      this.append(drawer);
      delete drawer.dataset.pdpDrawerPortal;
    }
    if (this.portalColorScopeClasses?.length) {
      drawer?.classList.remove(...this.portalColorScopeClasses);
      this.portalColorScopeClasses = [];
    }
    this.abortController?.abort();
    this.abortController = null;
  }

  portalDrawer() {
    if (!this.drawer || !document.body || this.drawer.parentElement === document.body) return;

    const colorScope = this.closest('.section-color-scope');
    this.portalColorScopeClasses = Array.from(colorScope?.classList || [])
      .filter((className) => className === 'section-color-scope' || className === 'color-scheme' || className.startsWith('scheme-'))
      .filter((className) => !this.drawer.classList.contains(className));
    this.drawer.classList.add(...this.portalColorScopeClasses);
    this.drawer.dataset.pdpDrawerPortal = 'true';
    document.body.append(this.drawer);
  }

  getFocusable() {
    return Array.from(this.panel?.querySelectorAll(PDP_DRAWER_FOCUSABLE_SELECTOR) || [])
      .filter((element) => !element.hidden && element.getClientRects().length > 0);
  }

  getDrawerTransitionTotalMs(element) {
    if (!element) return 0;
    const styles = window.getComputedStyle(element);
    const toMilliseconds = (value) => {
      const duration = Number.parseFloat(value) || 0;
      return value.trim().endsWith('ms') ? duration : duration * 1000;
    };
    const durations = styles.transitionDuration.split(',').map(toMilliseconds);
    const delays = styles.transitionDelay.split(',').map(toMilliseconds);
    return durations.reduce((maximum, duration, index) => (
      Math.max(maximum, duration + (delays[index] ?? delays[delays.length - 1] ?? 0))
    ), 0);
  }

  isBottomSheet() {
    return Boolean(
      this.drawer?.classList.contains('is-open')
      && this.drawer.dataset.mobileLayout === 'bottom_sheet'
      && window.innerWidth <= PDP_DRAWER_SHEET_BREAKPOINT,
    );
  }

  resetSheetDrag() {
    if (this.sheetDragTimer) {
      window.clearTimeout(this.sheetDragTimer);
      this.sheetDragTimer = 0;
    }

    const drag = this.sheetDrag;
    drag?.header.releasePointerCapture?.(drag.pointerId);
    this.sheetDrag = null;
    this.panel?.classList.remove('is-sheet-dragging');
    this.panel?.style.removeProperty('transition');
    this.panel?.style.removeProperty('transform');
  }

  handleSheetPointerDown(event) {
    if (!this.isBottomSheet() || !event.isPrimary || event.button !== 0) return;

    const sheetHeader = event.target instanceof Element
      ? event.target.closest('[data-pdp-drawer-sheet-header]')
      : null;
    if (event.target instanceof Element && event.target.closest('[data-pdp-drawer-close]')) return;
    if (!sheetHeader || sheetHeader !== this.sheetHeader || !this.panel) return;

    this.resetSheetDrag();
    this.sheetDrag = {
      pointerId: event.pointerId,
      header: sheetHeader,
      panel: this.panel,
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: performance.now(),
      distance: 0,
      velocity: 0,
    };
    this.panel.classList.add('is-sheet-dragging');
    this.panel.style.transition = 'none';
    this.panel.style.transform = 'translate3d(0, 0, 0)';
    sheetHeader.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  handleSheetPointerMove(event) {
    const drag = this.sheetDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    const now = performance.now();
    const elapsed = Math.max(now - drag.lastTime, 1);
    drag.velocity = (event.clientY - drag.lastY) / elapsed;
    drag.lastY = event.clientY;
    drag.lastTime = now;
    drag.distance = Math.max(0, event.clientY - drag.startY);
    drag.panel.style.transform = `translate3d(0, ${drag.distance}px, 0)`;
    event.preventDefault();
  }

  handleSheetPointerUp(event) {
    this.finishSheetDrag(event);
  }

  handleSheetPointerCancel(event) {
    this.finishSheetDrag(event, true);
  }

  finishSheetDrag(event, cancelled = false) {
    const drag = this.sheetDrag;
    if (!drag || event.pointerId !== drag.pointerId) return;

    drag.header.releasePointerCapture?.(event.pointerId);
    const closeDistance = Math.min(140, drag.panel.getBoundingClientRect().height * 0.2);
    const shouldClose = !cancelled && (
      drag.distance >= closeDistance || (drag.distance >= 32 && drag.velocity > 0.55)
    );
    this.sheetDrag = null;
    drag.panel.classList.remove('is-sheet-dragging');
    drag.panel.style.transition = 'transform var(--motion-duration-standard) var(--motion-ease-standard)';

    if (shouldClose) {
      window.requestAnimationFrame(() => {
        drag.panel.style.transform = `translate3d(0, ${Math.max(window.innerHeight, drag.panel.offsetHeight + 60)}px, 0)`;
      });
      const transitionMs = this.getDrawerTransitionTotalMs(drag.panel);
      this.sheetDragTimer = window.setTimeout(() => {
        this.sheetDragTimer = 0;
        this.close({ force: true, skipSheetDragReset: true });
      }, transitionMs + 50);
      return;
    }

    window.requestAnimationFrame(() => {
      if (this.drawer?.classList.contains('is-open')) drag.panel.style.transform = 'translate3d(0, 0, 0)';
    });
    const transitionMs = this.getDrawerTransitionTotalMs(drag.panel);
    this.sheetDragTimer = window.setTimeout(() => {
      this.sheetDragTimer = 0;
      if (!this.drawer?.classList.contains('is-open')) return;
      this.resetSheetDrag();
    }, transitionMs + 50);
  }

  handleKeydown(event) {
    if (!this.drawer?.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close({ force: true });
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = this.getFocusable();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  open({ focus = true } = {}) {
    if (!this.drawer || this.drawer.classList.contains('is-open')) return;
    // Keep the re-open path identical to Cart drawer so a quick close/open
    // still replays the panel transition instead of jumping to the end state.
    const shouldAnimate = !this.drawer.classList.contains('is-open');
    window.clearTimeout(this.closeTimer);
    this.closeTimer = null;
    this.resetSheetDrag();
    if (shouldAnimate) this.previousFocus = document.activeElement;
    this.drawer.hidden = false;
    this.drawer.setAttribute('aria-hidden', 'false');
    this.drawer.classList.remove('is-closing');
    if (shouldAnimate) {
      this.drawer.classList.remove('is-open');
      this.panel?.getBoundingClientRect();
    }
    this.drawer.classList.add('is-open');
    this.trigger?.setAttribute('aria-expanded', 'true');
    syncPdpDrawerScrollLock();

    if (focus) {
      window.requestAnimationFrame(() => {
        if (!this.drawer?.classList.contains('is-open')) return;
        (this.closeButton || this.panel)?.focus({ preventScroll: true });
      });
    }
  }

  close({ force = false, restoreFocus = true, skipSheetDragReset = false } = {}) {
    if (!this.drawer || this.drawer.hidden || (!this.drawer.classList.contains('is-open') && !this.drawer.classList.contains('is-closing'))) return;
    if (!force && this.editorSelected) return;
    if (!skipSheetDragReset) this.resetSheetDrag();
    this.drawer.classList.remove('is-open');
    this.drawer.classList.add('is-closing');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.trigger?.setAttribute('aria-expanded', 'false');
    syncPdpDrawerScrollLock();
    window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => {
      if (!this.drawer?.classList.contains('is-open')) {
        this.drawer?.classList.remove('is-closing');
        if (this.drawer) this.drawer.hidden = true;
        this.resetSheetDrag();
      }
    }, PDP_DRAWER_CLOSE_DELAY);

    const restoreTarget = this.previousFocus;
    this.previousFocus = null;
    if (restoreFocus && restoreTarget?.isConnected && !restoreTarget.hidden) restoreTarget.focus();
  }
}

class ProductPickupAvailability extends PdpDrawerElement {
  connectedCallback() {
    super.connectedCallback();
    if (!this.abortController) return;
    this.message = this.querySelector('[data-pickup-availability-message]');
    this.stores = this.drawer?.querySelector('[data-pickup-availability-stores]');
    const root = this.closest('[data-product-information]');
    root?.addEventListener('variant:change', (event) => this.update(event.detail?.variantId), { signal: this.abortController.signal });
  }

  update(variantId) {
    const template = this.querySelector(`[data-pickup-availability-template="${CSS.escape(String(variantId || ''))}"]`);
    const hasPickup = template?.dataset.hasPickup === 'true';
    if (!hasPickup) {
      this.close({ force: true, restoreFocus: false });
      this.hidden = true;
      return;
    }
    this.hidden = false;
    const content = template.content;
    const message = content.querySelector('[data-pickup-availability-message-template]');
    const stores = content.querySelector('[data-pickup-availability-stores-template]');
    if (message && this.message) this.message.innerHTML = message.innerHTML;
    if (stores && this.stores) this.stores.innerHTML = stores.innerHTML;
  }

}

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    const track = this.querySelector('[data-product-recommendations-track]');
    if (!track) return;
    this.querySelector('[data-product-recommendations-previous]')?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: 'smooth' }));
    this.querySelector('[data-product-recommendations-next]')?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: 'smooth' }));
  }
}

class ProductStickyAddToCart extends HTMLElement {
  connectedCallback() {
    if (this.abortController) return;
    this.abortController = new AbortController();
    this.button = this.querySelector('[data-sticky-add-to-cart-button]');
    this.price = this.querySelector('[data-sticky-add-to-cart-price]');
    this.root = this.closest('[data-product-information]');
    this.sourceButton = this.root?.querySelector('[data-add-to-cart-button]');
    this.root?.addEventListener('variant:change', (event) => this.update(event.detail?.variantId, event.detail?.available), { signal: this.abortController.signal });
    this.button?.addEventListener('click', () => this.submit(), { signal: this.abortController.signal });
    if (this.sourceButton) {
      new IntersectionObserver(([entry]) => this.classList.toggle('is-visible', !entry.isIntersecting), { threshold: 0.15 }).observe(this.sourceButton);
    } else {
      this.classList.add('is-visible');
    }
  }

  disconnectedCallback() { this.abortController?.abort(); this.abortController = null; }

  update(variantId, available) {
    const template = this.querySelector(`[data-sticky-add-to-cart-template="${CSS.escape(String(variantId || ''))}"]`);
    if (template) this.price.textContent = template.content.textContent.trim();
    const enabled = Boolean(variantId && available);
    this.button.disabled = !enabled;
    this.button.setAttribute('aria-disabled', String(!enabled));
  }

  submit() {
    if (this.button?.disabled) return;
    const form = this.root?.querySelector('[data-product-form]');
    form?.requestSubmit?.();
  }
}

class PopupBlock extends PdpDrawerElement {}

if (!customElements.get('product-pickup-availability')) customElements.define('product-pickup-availability', ProductPickupAvailability);
if (!customElements.get('product-recommendations')) customElements.define('product-recommendations', ProductRecommendations);
if (!customElements.get('product-sticky-add-to-cart')) customElements.define('product-sticky-add-to-cart', ProductStickyAddToCart);
if (!customElements.get('popup-block')) customElements.define('popup-block', PopupBlock);
