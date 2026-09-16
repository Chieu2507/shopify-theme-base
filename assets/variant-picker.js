class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.handleChange = this.handleChange.bind(this);
    this.addEventListener('change', this.handleChange);
    this.variants = this.readVariants();
    this.variantIdInput = this.querySelector('[data-variant-id]');
    this.sync();
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.handleChange);
  }

  readVariants() {
    const dataElement = this.querySelector('[data-variant-data]');

    if (!dataElement) {
      return [];
    }

    try {
      const variants = JSON.parse(dataElement.textContent);
      return Array.isArray(variants) ? variants : [];
    } catch (error) {
      return [];
    }
  }

  optionGroups() {
    return Array.from(this.querySelectorAll('.variant-picker__option[data-option-index]'));
  }

  selectedOptions() {
    return this.optionGroups().map((group) => {
      const selectedControl = group.querySelector(
        'select[data-option-control], input[data-option-control]:checked',
      );
      const fallbackControl = group.querySelector('[data-option-control]');
      return (selectedControl || fallbackControl)?.value || '';
    });
  }

  findVariant(options) {
    return this.variants.find((variant) => {
      if (!Array.isArray(variant.options) || variant.options.length !== options.length) {
        return false;
      }

      return variant.options.every(
        (option, index) => String(option) === String(options[index]),
      );
    });
  }

  valueState(optionIndex, value, selectedOptions) {
    let hasVariant = false;
    let hasAvailableVariant = false;

    this.variants.forEach((variant) => {
      if (!Array.isArray(variant.options) || String(variant.options[optionIndex]) !== String(value)) {
        return;
      }

      const matchesOtherOptions = variant.options.every(
        (option, index) => index === optionIndex || String(option) === String(selectedOptions[index]),
      );

      if (matchesOtherOptions) {
        hasVariant = true;
        hasAvailableVariant = hasAvailableVariant || Boolean(variant.available);
      }
    });

    if (!hasVariant) {
      return 'unavailable';
    }

    return hasAvailableVariant ? 'available' : 'sold-out';
  }

  updateAvailability(selectedOptions) {
    this.querySelectorAll('[data-option-control]').forEach((control) => {
      const optionIndex = Number(control.dataset.optionIndex);
      const state = this.valueState(optionIndex, control.value, selectedOptions);
      const isCurrentValue = control.value === selectedOptions[optionIndex];

      if (control.tagName === 'OPTION') {
        control.dataset.variantState = state;
        control.disabled = state === 'unavailable' && !isCurrentValue;
        control.textContent = control.dataset.label || control.value;
        if (state === 'unavailable') {
          control.textContent += ` - ${this.dataset.unavailableLabel}`;
        } else if (state === 'sold-out') {
          control.textContent += ` - ${this.dataset.soldOutLabel}`;
        }
        return;
      }

      const choice = control.closest('.variant-picker__choice');
      const button = choice?.querySelector('.variant-picker__button');
      const status = choice?.querySelector('[data-variant-status]');

      control.disabled = state === 'unavailable' && !isCurrentValue;
      choice?.classList.toggle('variant-picker__choice--unavailable', state === 'unavailable');
      choice?.classList.toggle('variant-picker__choice--sold-out', state === 'sold-out');
      choice?.dataset && (choice.dataset.variantState = state);
      button?.classList.toggle('variant-picker__button--unavailable', state === 'unavailable');
      button?.classList.toggle('variant-picker__button--sold-out', state === 'sold-out');

      if (button) {
        if (state === 'unavailable') {
          button.setAttribute('aria-disabled', 'true');
        } else {
          button.removeAttribute('aria-disabled');
        }
      }

      if (status) {
        status.textContent =
          state === 'unavailable'
            ? this.dataset.unavailableLabel
            : state === 'sold-out'
              ? this.dataset.soldOutLabel
              : '';
        status.hidden = state === 'available';
      }
    });
  }

  updateProductForm(variant) {
    const variantId = variant?.id ? String(variant.id) : '';

    if (this.variantIdInput) {
      this.variantIdInput.value = variantId;
    }

    const submitButton = this.closest('form')?.querySelector('.product-form__submit');
    if (submitButton) {
      submitButton.disabled = !variant?.available;
      submitButton.setAttribute('aria-disabled', String(!variant?.available));
    }

    this.dataset.currentVariantId = variantId;
  }

  priceContainer() {
    const sectionId = this.dataset.sectionId;

    return Array.from(document.querySelectorAll('[data-product-price-container]')).find(
      (container) => container.dataset.sectionId === sectionId,
    );
  }

  updatePrice(variant) {
    const container = this.priceContainer();
    const currentPrice = container?.querySelector('[data-price-component]');

    if (!container || !currentPrice) {
      return;
    }

    const variantId = variant?.id ? String(variant.id) : '';
    const template = Array.from(container.querySelectorAll('[data-variant-price-template]')).find(
      (priceTemplate) => priceTemplate.dataset.variantPriceTemplate === variantId,
    );
    const nextPrice = template?.content.querySelector('[data-price-component]');

    if (!nextPrice) {
      currentPrice.hidden = true;
      currentPrice.setAttribute('aria-hidden', 'true');
      return;
    }

    currentPrice.replaceWith(nextPrice.cloneNode(true));
  }

  updateMedia(variantId) {
    const galleryId = this.dataset.mediaGalleryId;
    const gallery = galleryId ? document.getElementById(galleryId) : null;
    const mediaItems = gallery ? Array.from(gallery.querySelectorAll('[data-product-media]')) : [];

    if (!mediaItems.length) {
      return;
    }

    const onlySelectedMedia = this.dataset.onlySelectedMedia === 'true';
    const selectedMediaItems = mediaItems.filter((item) => {
      const variantIds = (item.dataset.variantIds || '').split(',').filter(Boolean);
      return variantIds.includes(String(variantId));
    });
    const hasSelectedMedia = selectedMediaItems.length > 0;

    mediaItems.forEach((item) => {
      const variantIds = (item.dataset.variantIds || '').split(',').filter(Boolean);
      const isSelectedVariantMedia = variantIds.includes(String(variantId));
      const isCommonMedia = variantIds.length === 0;
      const shouldHide = onlySelectedMedia && hasSelectedMedia && !isCommonMedia && !isSelectedVariantMedia;

      item.hidden = shouldHide;
      item.setAttribute('aria-hidden', String(shouldHide));
    });

    if (onlySelectedMedia && hasSelectedMedia && !mediaItems.some((item) => !item.hidden)) {
      const firstSelectedMedia = selectedMediaItems[0];
      firstSelectedMedia.hidden = false;
      firstSelectedMedia.setAttribute('aria-hidden', 'false');
    }
  }

  sync() {
    const options = this.selectedOptions();
    const variant = this.findVariant(options);

    this.updateAvailability(options);
    this.updateProductForm(variant);
    this.updatePrice(variant);
    this.updateMedia(variant?.id || '');
    this.dispatchEvent(
      new CustomEvent('variant:change', {
        bubbles: true,
        detail: {
          variant,
          variantId: variant?.id ? String(variant.id) : '',
          options,
        },
      }),
    );
  }

  handleChange(event) {
    if (!event.target.matches('[data-option-control]')) {
      return;
    }

    this.sync();
  }
}

if (!customElements.get('variant-picker')) {
  customElements.define('variant-picker', VariantPicker);
}
