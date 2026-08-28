class GiftSpinel extends HTMLElement {
  connectedCallback() {
    if (this.isBound) {
      this.initialize();
      return;
    }

    this.isBound = true;
    this.onClick = this.handleClick.bind(this);
    this.onKeydown = this.handleKeydown.bind(this);
    this.onBlockSelect = this.handleBlockSelect.bind(this);
    this.onSectionLoad = this.handleSectionLoad.bind(this);
    this.addEventListener('click', this.onClick);
    this.addEventListener('keydown', this.onKeydown);

    if (this.dataset.editorMode === 'true') {
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('shopify:section:load', this.onSectionLoad);
    }

    this.initialize();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.removeEventListener('keydown', this.onKeydown);
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    document.removeEventListener('shopify:section:load', this.onSectionLoad);
    this.isBound = false;
  }

  initialize() {
    this.choices = Array.from(this.querySelectorAll('[data-gift-spinel-choice]'));
    this.panels = Array.from(this.querySelectorAll('[data-gift-spinel-panel]'));
    this.status = this.querySelector('[data-gift-spinel-status]');

    if (!this.choices.length || !this.panels.length) return;

    const selectedIndex = this.choices.findIndex((choice) => choice.getAttribute('aria-selected') === 'true');
    const activeIndex = selectedIndex >= 0 ? selectedIndex : Math.max(0, this.panels.findIndex((panel) => !panel.hidden));
    this.activate(activeIndex, false, false);
  }

  handleClick(event) {
    const choice = event.target.closest('[data-gift-spinel-choice]');
    if (!choice || !this.contains(choice)) return;

    const index = this.choices.indexOf(choice);
    if (index >= 0) this.activate(index, false, true);
  }

  handleKeydown(event) {
    const choice = event.target.closest('[data-gift-spinel-choice]');
    if (!choice || !this.contains(choice)) return;

    let nextIndex = -1;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = this.nextIndex(this.choices.indexOf(choice), 1);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = this.nextIndex(this.choices.indexOf(choice), -1);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = this.choices.length - 1;

    if (nextIndex < 0) return;
    event.preventDefault();
    this.activate(nextIndex, true, true);
  }

  nextIndex(currentIndex, direction) {
    if (!this.choices.length) return -1;
    return (currentIndex + direction + this.choices.length) % this.choices.length;
  }

  handleBlockSelect(event) {
    const blockId = event.detail?.blockId;
    if (!blockId) return;

    const choiceIndex = this.choices.findIndex((choice) => choice.dataset.giftSpinelChoice === blockId);
    if (choiceIndex >= 0) this.activate(choiceIndex, false, true);
  }

  handleSectionLoad(event) {
    const section = this.closest('[id^="shopify-section-"]');
    if (event.target === section || event.target?.contains(this)) this.initialize();
  }

  activate(index, shouldFocus = false, announce = true) {
    const choice = this.choices[index];
    if (!choice) return;

    const targetId = choice.dataset.giftSpinelTarget || choice.getAttribute('aria-controls');
    const panel = this.panels.find((item) => item.id === targetId) || this.panels[index];
    if (!panel) return;

    this.querySelectorAll('.gift-spinel__product-card').forEach((item) => item.classList.remove('is-entering'));

    this.choices.forEach((item, itemIndex) => {
      const selected = itemIndex === index;
      item.classList.toggle('is-selected', selected);
      item.setAttribute('aria-selected', String(selected));
      item.setAttribute('tabindex', selected ? '0' : '-1');
    });

    this.panels.forEach((item) => {
      const selected = item === panel;
      item.classList.toggle('is-active', selected);
      item.hidden = !selected;
    });

    if (announce) {
      void panel.offsetWidth;
      panel.querySelectorAll('.gift-spinel__product-card').forEach((card, cardIndex) => {
        card.style.setProperty('--gift-spinel-card-index', cardIndex);
        card.classList.add('is-entering');
      });
    }

    if (shouldFocus) choice.focus({ preventScroll: true });
    if (announce && this.status) {
      const label = choice.querySelector('.gift-spinel__choice-label')?.textContent?.trim() || '';
      this.status.textContent = label;
    }
  }
}

if (!customElements.get('gift-spinel')) customElements.define('gift-spinel', GiftSpinel);
