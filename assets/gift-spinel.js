class GiftSpinel extends HTMLElement {
  connectedCallback() {
    if (!this.isBound) {
      this.isBound = true;
      this.onClick = this.handleClick.bind(this);
      this.onGiftAnchorClick = this.handleGiftAnchorClick.bind(this);
      this.onBlockSelect = this.handleBlockSelect.bind(this);
      this.onSectionLoad = this.handleSectionLoad.bind(this);
      this.addEventListener('click', this.onClick);
      document.addEventListener('click', this.onGiftAnchorClick);
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('shopify:section:load', this.onSectionLoad);
      this.editorObserver = new MutationObserver((records) => {
        if (records.some((record) => record.target === this)) this.scheduleInitialize();
      });
      this.editorObserver.observe(this, { childList: true });
    }

    this.initialize();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    document.removeEventListener('click', this.onGiftAnchorClick);
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    document.removeEventListener('shopify:section:load', this.onSectionLoad);
    this.editorObserver?.disconnect();
    window.clearTimeout(this.transitionTimer);
    window.clearTimeout(this.anchorTimer);
    window.cancelAnimationFrame(this.initializeFrame);
    this.isBound = false;
  }

  initialize() {
    this.questions = this.querySelector('[data-gift-spinel-questions]');
    this.result = this.querySelector('[data-gift-spinel-result]');
    this.status = this.querySelector('[data-gift-spinel-status]');
    this.question = this.querySelector('[data-gift-spinel-question]');
    this.choices = this.querySelector('[data-gift-spinel-choices]');
    this.paths = Array.from(this.querySelectorAll('template[data-gift-spinel-path]'));
    this.placeholderPath = this.querySelector('template[data-gift-spinel-placeholder]');
    this.options = this.readOptions();

    if (!this.questions || !this.result || !this.question || !this.choices || !this.options.length) return;

    window.clearTimeout(this.transitionTimer);
    this.recipient = undefined;
    this.questions.hidden = false;
    this.result.hidden = true;
    this.result.replaceChildren();
    if (this.status) this.status.textContent = '';
    this.resetChoices();
  }

  scheduleInitialize() {
    window.cancelAnimationFrame(this.initializeFrame);
    this.initializeFrame = window.requestAnimationFrame(() => this.initialize());
  }

  handleSectionLoad(event) {
    const section = this.closest('[id^="shopify-section-"]');
    if (event.target === section || event.target?.contains(this)) this.scheduleInitialize();
  }

  handleGiftAnchorClick(event) {
    const link = event.target.closest?.('[data-gift-spinel-link]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const destination = new URL(link.href, window.location.href);
    if (
      destination.origin !== window.location.origin
      || destination.pathname !== window.location.pathname
      || destination.hash !== '#gift-spinel'
    ) return;

    event.preventDefault();

    document.querySelectorAll('[data-header] details[open]').forEach((details) => {
      details.open = false;
    });

    const header = document.querySelector('[data-header]');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const gap = 24;
    const destinationTop = Math.max(0, window.scrollY + this.getBoundingClientRect().top - headerHeight - gap);
    const distance = Math.abs(destinationTop - window.scrollY);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = Math.min(1050, Math.max(480, Math.round(distance * 0.45)));

    window.history.pushState(null, '', '#gift-spinel');
    this.classList.remove('is-anchor-target');
    void this.offsetWidth;
    this.classList.add('is-anchor-target');
    window.scrollTo({ top: destinationTop, behavior: reduceMotion ? 'auto' : 'smooth' });

    window.clearTimeout(this.anchorTimer);
    this.anchorTimer = window.setTimeout(() => this.classList.remove('is-anchor-target'), reduceMotion ? 0 : duration);
  }

  readOptions() {
    try {
      return JSON.parse(this.querySelector('[data-gift-spinel-options]')?.textContent || '[]');
    } catch (error) {
      return [];
    }
  }

  resetChoices() {
    this.choices.querySelectorAll('[data-gift-spinel-choice]').forEach((button) => {
      button.classList.remove('is-selected');
      button.setAttribute('aria-pressed', 'false');
      button.disabled = false;
    });
  }

  handleClick(event) {
    const choice = event.target.closest('[data-gift-spinel-choice]');
    if (choice && this.contains(choice)) {
      this.selectRecipient(choice);
      return;
    }

    const change = event.target.closest('[data-gift-spinel-change]');
    if (change && this.contains(change)) this.changeRecipient();
  }

  handleBlockSelect(event) {
    const path = this.paths.find((item) => item.dataset.blockId === event.detail?.blockId);
    if (!path) return;
    this.recipient = this.optionFor(path.dataset.recipient);
    this.showResult(path);
  }

  optionFor(value) {
    return this.options.find((option) => option.value === value) || { value, label: value };
  }

  selectRecipient(choice) {
    if (choice.disabled) return;
    this.recipient = this.optionFor(choice.dataset.giftSpinelChoice);
    this.choices.querySelectorAll('[data-gift-spinel-choice]').forEach((button) => {
      const selected = button === choice;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = true;
    });

    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 120;
    this.transitionTimer = window.setTimeout(() => this.showResult(), delay);
  }

  findMatchingPath() {
    return this.paths.find((path) => path.dataset.recipient === this.recipient?.value) || this.placeholderPath;
  }

  replaceTokens(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      node.nodeValue = node.nodeValue.replaceAll('{recipient}', this.recipient?.label || '');
    });
  }

  showResult(preferredPath) {
    const path = preferredPath || this.findMatchingPath();
    if (!path || !this.result) {
      this.questions.hidden = false;
      this.result.hidden = true;
      if (this.status) this.status.textContent = '';
      return;
    }

    const content = path.content.cloneNode(true);
    this.replaceTokens(content);
    const chips = content.querySelector('[data-gift-spinel-chips]');
    if (chips && this.recipient) {
      const chip = document.createElement('span');
      chip.className = 'gift-spinel__chip';
      chip.textContent = this.recipient.label;
      chips.append(chip);
    }

    this.questions.hidden = true;
    this.result.replaceChildren(content);
    this.result.hidden = false;
    if (this.status) this.status.textContent = this.result.querySelector('[data-gift-spinel-result-heading]')?.textContent?.trim() || '';
    this.result.dispatchEvent(
      new CustomEvent('gift-spinel:products-loaded', {
        bubbles: true,
        detail: { panel: this.result },
      }),
    );
    this.result.querySelector('[data-gift-spinel-result-heading]')?.focus();
  }

  changeRecipient() {
    window.clearTimeout(this.transitionTimer);
    this.recipient = undefined;
    this.result.hidden = true;
    this.result.replaceChildren();
    if (this.status) this.status.textContent = '';
    this.questions.hidden = false;
    this.resetChoices();
    this.question.focus();
  }
}

if (!customElements.get('gift-spinel')) customElements.define('gift-spinel', GiftSpinel);
