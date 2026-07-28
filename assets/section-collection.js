if (!customElements.get('collection-sort-select')) {
  class CollectionSortSelect extends HTMLElement {
    connectedCallback() {
      this.select = this.querySelector('[data-collection-sort-native]');
      this.trigger = this.querySelector('[data-collection-sort-trigger]');
      this.value = this.querySelector('[data-collection-sort-value]');
      this.listbox = this.querySelector('[data-collection-sort-listbox]');
      this.options = Array.from(this.querySelectorAll('[data-collection-sort-option]'));
      if (!this.select || !this.trigger || !this.value || !this.listbox || !this.options.length) return;

      this.onTriggerClick = () => this.toggle();
      this.onTriggerKeydown = (event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        this.open();
        const selectedIndex = this.options.findIndex((option) => option.getAttribute('aria-selected') === 'true');
        const targetIndex = event.key === 'ArrowUp' || event.key === 'End'
          ? this.options.length - 1
          : event.key === 'Home'
            ? 0
            : Math.max(selectedIndex, 0);
        this.options[targetIndex]?.focus();
      };
      this.onListboxClick = (event) => {
        const option = event.target.closest('[data-collection-sort-option]');
        if (option) this.choose(option);
      };
      this.onListboxKeydown = (event) => {
        const currentIndex = this.options.indexOf(document.activeElement);
        if (event.key === 'Escape') {
          event.preventDefault();
          this.close(true);
          return;
        }
        if (event.key === 'Tab') {
          this.close();
          return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        let nextIndex = currentIndex;
        if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % this.options.length;
        if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + this.options.length) % this.options.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = this.options.length - 1;
        this.options[nextIndex]?.focus();
      };
      this.onDocumentClick = (event) => {
        if (!this.contains(event.target)) this.close();
      };
      this.onSelectChange = () => this.sync();

      this.trigger.addEventListener('click', this.onTriggerClick);
      this.trigger.addEventListener('keydown', this.onTriggerKeydown);
      this.listbox.addEventListener('click', this.onListboxClick);
      this.listbox.addEventListener('keydown', this.onListboxKeydown);
      this.select.addEventListener('change', this.onSelectChange);
      document.addEventListener('click', this.onDocumentClick);
      this.sync();
    }

    disconnectedCallback() {
      this.trigger?.removeEventListener('click', this.onTriggerClick);
      this.trigger?.removeEventListener('keydown', this.onTriggerKeydown);
      this.listbox?.removeEventListener('click', this.onListboxClick);
      this.listbox?.removeEventListener('keydown', this.onListboxKeydown);
      this.select?.removeEventListener('change', this.onSelectChange);
      document.removeEventListener('click', this.onDocumentClick);
    }

    toggle() {
      if (this.listbox.hidden) {
        this.open();
      } else {
        this.close();
      }
    }

    open() {
      this.listbox.hidden = false;
      this.trigger.setAttribute('aria-expanded', 'true');
    }

    close(returnFocus = false) {
      this.listbox.hidden = true;
      this.trigger.setAttribute('aria-expanded', 'false');
      if (returnFocus) this.trigger.focus();
    }

    choose(option) {
      this.select.value = option.dataset.value;
      this.sync();
      this.close(true);
      this.select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    sync() {
      const selectedOption = this.options.find((option) => option.dataset.value === this.select.value);
      if (!selectedOption) return;
      this.value.textContent = selectedOption.querySelector('span')?.textContent.trim() || '';
      this.trigger.title = this.value.textContent;
      this.options.forEach((option) => {
        option.setAttribute('aria-selected', String(option === selectedOption));
      });
    }
  }

  customElements.define('collection-sort-select', CollectionSortSelect);
}

if (!customElements.get('collection-price-range')) {
  class CollectionPriceRange extends HTMLElement {
    connectedCallback() {
      this.slider = this.querySelector('[data-price-range-slider]');
      this.minRange = this.querySelector('[data-price-range-min]');
      this.maxRange = this.querySelector('[data-price-range-max]');
      this.minNumber = this.querySelector('[data-price-number-min]');
      this.maxNumber = this.querySelector('[data-price-number-max]');
      if (!this.slider || !this.minRange || !this.maxRange || !this.minNumber || !this.maxNumber) return;

      this.onInput = (event) => {
        if (event.target === this.minRange || event.target === this.maxRange) {
          this.syncNumbersFromRanges(event.target);
          return;
        }

        if (event.target === this.minNumber || event.target === this.maxNumber) {
          this.syncRangesFromNumbers(event.target);
        }
      };

      this.addEventListener('input', this.onInput);
      this.syncRangesFromNumbers();
    }

    disconnectedCallback() {
      this.removeEventListener('input', this.onInput);
    }

    limits() {
      return {
        lower: Number(this.minRange.min) || 0,
        upper: Number(this.maxRange.max) || 0
      };
    }

    syncNumbersFromRanges(changedRange) {
      const { lower, upper } = this.limits();
      let minValue = Number(this.minRange.value);
      let maxValue = Number(this.maxRange.value);

      if (minValue > maxValue) {
        if (changedRange === this.minRange) {
          minValue = maxValue;
          this.minRange.value = String(minValue);
        } else {
          maxValue = minValue;
          this.maxRange.value = String(maxValue);
        }
      }

      this.minNumber.value = minValue <= lower ? '' : String(minValue);
      this.maxNumber.value = maxValue >= upper ? '' : String(maxValue);
      this.updateTrack(minValue, maxValue);
    }

    syncRangesFromNumbers(changedNumber) {
      const { lower, upper } = this.limits();
      let minValue = this.minNumber.value === '' ? lower : Number(this.minNumber.value);
      let maxValue = this.maxNumber.value === '' ? upper : Number(this.maxNumber.value);

      minValue = Math.min(Math.max(minValue, lower), upper);
      maxValue = Math.min(Math.max(maxValue, lower), upper);

      if (minValue > maxValue) {
        if (changedNumber === this.minNumber) {
          minValue = maxValue;
          this.minNumber.value = String(minValue);
        } else {
          maxValue = minValue;
          this.maxNumber.value = String(maxValue);
        }
      }

      this.minRange.value = String(minValue);
      this.maxRange.value = String(maxValue);
      this.updateTrack(minValue, maxValue);
    }

    updateTrack(minValue, maxValue) {
      const { lower, upper } = this.limits();
      const range = upper - lower || 1;
      const minPosition = ((minValue - lower) / range) * 100;
      const maxPosition = ((maxValue - lower) / range) * 100;
      this.slider.style.setProperty('--main-collection-price-min', `${minPosition}%`);
      this.slider.style.setProperty('--main-collection-price-max', `${maxPosition}%`);
    }
  }

  customElements.define('collection-price-range', CollectionPriceRange);
}

if (!customElements.get('collection-description')) {
  class CollectionDescription extends HTMLElement {
    connectedCallback() {
      this.content = this.querySelector('[data-collection-description]');
      this.toggle = this.querySelector('[data-collection-description-toggle]');
      if (!this.content || !this.toggle) return;

      this.classList.add('is-enhanced');
      this.syncOverflow = () => {
        this.content.classList.add('main-collection__description--collapsed');
        const isOverflowing = this.content.scrollHeight > this.content.clientHeight + 1;
        this.toggle.hidden = !isOverflowing;
        if (!isOverflowing) this.content.classList.remove('main-collection__description--collapsed');
      };

      this.onToggle = () => {
        const isExpanded = this.toggle.getAttribute('aria-expanded') === 'true';
        this.toggle.setAttribute('aria-expanded', String(!isExpanded));
        this.content.classList.toggle('main-collection__description--collapsed', isExpanded);
        this.toggle.textContent = isExpanded ? this.toggle.dataset.moreLabel : this.toggle.dataset.lessLabel;
      };
      this.onResize = () => {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = window.setTimeout(this.syncOverflow, 100);
      };
      this.toggle.addEventListener('click', this.onToggle);
      window.addEventListener('resize', this.onResize);
      this.syncOverflow();
    }

    disconnectedCallback() {
      if (this.toggle && this.onToggle) this.toggle.removeEventListener('click', this.onToggle);
      if (this.onResize) window.removeEventListener('resize', this.onResize);
      window.clearTimeout(this.resizeTimer);
    }
  }

  customElements.define('collection-description', CollectionDescription);
}

if (!customElements.get('collection-facets')) {
  class CollectionFacets extends HTMLElement {
    connectedCallback() {
      this.classList.add('is-enhanced');
      this.sectionId = this.dataset.sectionId;
      this.dialog = this.querySelector('[data-collection-filter-dialog]');
      this.backdropPointer = this.dialog?.querySelector('.main-collection__filter-backdrop-pointer');

      this.onBackdropPointerMove = (event) => {
        if (!this.dialog?.open || this.dialog.classList.contains('is-closing')) {
          this.hideBackdropPointer();
          return;
        }

        const rect = this.dialog.getBoundingClientRect();
        const insidePanel = event.clientX >= rect.left
          && event.clientX <= rect.right
          && event.clientY >= rect.top
          && event.clientY <= rect.bottom;
        const showPointer = !insidePanel;

        document.documentElement.classList.toggle('collection-filter-backdrop-cursor', showPointer);
        if (!this.backdropPointer) return;

        this.backdropPointer.style.setProperty('--main-collection-filter-pointer-x', `${event.clientX - rect.left}px`);
        this.backdropPointer.style.setProperty('--main-collection-filter-pointer-y', `${event.clientY - rect.top}px`);
        this.backdropPointer.classList.toggle('is-visible', showPointer);
      };
      this.onDialogCancel = (event) => {
        event.preventDefault();
        this.closeDialog();
      };
      this.onDialogClose = () => this.hideBackdropPointer();

      this.onClick = (event) => {
        if (event.target.closest('[data-collection-filter-open]')) {
          if (this.dialog && !this.dialog.open) this.dialog.showModal();
          return;
        }

        if (event.target.closest('[data-collection-filter-close]')) {
          this.closeDialog();
          return;
        }

        if (event.target === this.dialog) {
          this.closeDialog();
          return;
        }

        const link = event.target.closest(
          '.main-collection__active-filters a, .main-collection__filter-footer a, .main-collection__pagination a, .main-collection__empty a'
        );
        if (!link) return;

        event.preventDefault();
        this.render(link.href, {
          reopenDialog: Boolean(link.closest('[data-collection-filter-dialog]'))
        });
      };

      this.onChange = (event) => {
        const control = event.target;
        if (control.matches('[data-collection-sort]')) {
          this.renderFromForm(control.form);
          return;
        }

        if (!control.closest('[data-collection-filter-dialog]')) return;
        if (control.matches('input[type="number"]')) {
          window.clearTimeout(this.priceTimer);
        }
        this.renderFromForm(control.form, { reopenDialog: true, focusControl: control });
      };

      this.onInput = (event) => {
        const control = event.target;
        if (!control.matches('.main-collection__price-filter input')) return;

        window.clearTimeout(this.priceTimer);
        this.priceTimer = window.setTimeout(() => {
          this.renderFromForm(control.form, { reopenDialog: true, focusControl: control });
        }, 450);
      };

      this.onSubmit = (event) => {
        if (!event.target.matches('.main-collection__filter-form, [data-collection-sort-form]')) return;
        event.preventDefault();
        this.renderFromForm(event.target, {
          closeDialog: event.target.matches('.main-collection__filter-form')
        });
      };

      this.onPopState = () => this.render(window.location.href, { updateHistory: false });
      this.onSectionUnload = (event) => {
        if (event.target.contains(this)) this.finishCloseDialog();
      };

      this.addEventListener('click', this.onClick);
      this.addEventListener('change', this.onChange);
      this.addEventListener('input', this.onInput);
      this.addEventListener('submit', this.onSubmit);
      this.dialog?.addEventListener('cancel', this.onDialogCancel);
      this.dialog?.addEventListener('close', this.onDialogClose);
      document.addEventListener('mousemove', this.onBackdropPointerMove, { passive: true });
      window.addEventListener('popstate', this.onPopState);
      document.addEventListener('shopify:section:unload', this.onSectionUnload);
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onClick);
      this.removeEventListener('change', this.onChange);
      this.removeEventListener('input', this.onInput);
      this.removeEventListener('submit', this.onSubmit);
      this.dialog?.removeEventListener('cancel', this.onDialogCancel);
      this.dialog?.removeEventListener('close', this.onDialogClose);
      document.removeEventListener('mousemove', this.onBackdropPointerMove);
      window.removeEventListener('popstate', this.onPopState);
      document.removeEventListener('shopify:section:unload', this.onSectionUnload);
      window.clearTimeout(this.priceTimer);
      this.hideBackdropPointer();
      this.finishCloseDialog();
      this.requestController?.abort();
    }

    hideBackdropPointer() {
      document.documentElement.classList.remove('collection-filter-backdrop-cursor');
      this.backdropPointer?.classList.remove('is-visible');
    }

    closeDialog() {
      if (!this.dialog?.open) return Promise.resolve();
      if (this.closePromise) return this.closePromise;
      this.hideBackdropPointer();

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.dialog.close();
        return Promise.resolve();
      }

      this.dialog.classList.add('is-closing');
      this.closePromise = new Promise((resolve) => {
        this.resolveClose = resolve;
        this.closeTimer = window.setTimeout(() => this.finishCloseDialog(), 240);
      });
      return this.closePromise;
    }

    finishCloseDialog() {
      window.clearTimeout(this.closeTimer);
      this.closeTimer = null;
      if (this.dialog?.open) this.dialog.close();
      this.dialog?.classList.remove('is-closing');
      this.hideBackdropPointer();
      const resolve = this.resolveClose;
      this.resolveClose = null;
      this.closePromise = null;
      resolve?.();
    }

    renderFromForm(form, options = {}) {
      if (!form) return;

      const url = new URL(form.action, window.location.origin);
      const formData = new FormData(form);
      for (const [name, value] of formData.entries()) {
        if (String(value).trim() !== '') url.searchParams.append(name, value);
      }
      url.searchParams.delete('page');

      const focusControl = options.focusControl;
      this.render(url, {
        ...options,
        focusName: focusControl?.name,
        focusValue: focusControl?.value
      });
    }

    async render(urlValue, options = {}) {
      const navigationUrl = new URL(urlValue, window.location.origin);
      navigationUrl.searchParams.delete('section_id');
      const requestUrl = new URL(navigationUrl);
      requestUrl.searchParams.set('section_id', this.sectionId);

      const body = this.querySelector('.main-collection__filter-body');
      const dialogScrollTop = body?.scrollTop || 0;
      const keepDialogOpen = options.reopenDialog && this.dialog?.open;
      const closePromise = options.closeDialog ? this.closeDialog() : Promise.resolve();

      this.requestController?.abort();
      this.requestController = new AbortController();
      this.setAttribute('aria-busy', 'true');

      try {
        const response = await fetch(requestUrl, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          signal: this.requestController.signal
        });
        if (!response.ok) throw new Error(`Collection request failed: ${response.status}`);

        const documentHtml = new DOMParser().parseFromString(await response.text(), 'text/html');
        const nextFacets = documentHtml.querySelector(`collection-facets[data-section-id="${this.sectionId}"]`);
        if (!nextFacets) throw new Error('Collection response did not contain facets');

        if (options.updateHistory !== false && navigationUrl.href !== window.location.href) {
          window.history.pushState({}, '', navigationUrl);
        }

        await closePromise;

        if (keepDialogOpen) {
          const nextDialog = nextFacets.querySelector('[data-collection-filter-dialog]');
          const currentToolbar = this.querySelector('.main-collection__toolbar');
          const nextToolbar = nextFacets.querySelector('.main-collection__toolbar');
          const currentProducts = this.querySelector('.main-collection__products');
          const nextProducts = nextFacets.querySelector('.main-collection__products');
          if (!nextDialog || !currentToolbar || !nextToolbar || !currentProducts || !nextProducts) {
            throw new Error('Collection response was missing dynamic content');
          }

          currentToolbar.replaceWith(nextToolbar);
          currentProducts.replaceWith(nextProducts);
          this.dialog.replaceChildren(...Array.from(nextDialog.childNodes));
          this.backdropPointer = this.dialog.querySelector('.main-collection__filter-backdrop-pointer');
          nextProducts.dispatchEvent(new CustomEvent('collection:products-loaded', { bubbles: true }));

          window.requestAnimationFrame(() => {
            const nextBody = this.dialog.querySelector('.main-collection__filter-body');
            if (nextBody) nextBody.scrollTop = dialogScrollTop;

            if (options.focusName) {
              const matchingControl = Array.from(this.dialog.querySelectorAll('[name]')).find(
                (control) => control.name === options.focusName && control.value === options.focusValue
              );
              matchingControl?.focus({ preventScroll: true });
            }
          });
        } else {
          const nextProducts = nextFacets.querySelector('.main-collection__products');
          this.replaceWith(nextFacets);
          nextProducts?.dispatchEvent(new CustomEvent('collection:products-loaded', { bubbles: true }));
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        window.location.assign(navigationUrl);
      } finally {
        this.removeAttribute('aria-busy');
      }
    }
  }

  customElements.define('collection-facets', CollectionFacets);
}
