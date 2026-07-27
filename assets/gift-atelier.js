class GiftAtelier extends HTMLElement {
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
    this.questions = this.querySelector('[data-gift-atelier-questions]');
    this.result = this.querySelector('[data-gift-atelier-result]');
    this.status = this.querySelector('[data-gift-atelier-status]');
    this.question = this.querySelector('[data-gift-atelier-question]');
    this.choices = this.querySelector('[data-gift-atelier-choices]');
    this.stepCount = this.querySelector('[data-gift-atelier-step-count]');
    this.selectionSummary = this.querySelector('[data-gift-atelier-selection-summary]');
    this.backButton = this.querySelector('[data-gift-atelier-back]');
    this.progress = Array.from(this.querySelectorAll('[data-gift-atelier-progress]'));
    this.paths = Array.from(this.querySelectorAll('template[data-gift-atelier-path]'));
    this.fallbackPath = this.querySelector('template[data-gift-atelier-fallback]');
    this.steps = this.readSteps();

    if (!this.questions || !this.result || !this.question || !this.choices || !this.steps.length) return;

    window.clearTimeout(this.transitionTimer);
    this.answers = {};
    this.currentStep = 0;
    this.classList.remove('is-engaged');
    this.questions.hidden = false;
    this.result.hidden = true;
    this.result.replaceChildren();
    if (this.status) this.status.textContent = '';
    this.renderStep();
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
    const link = event.target.closest?.('[data-gift-omniselle-link]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const destination = new URL(link.href, window.location.href);
    if (
      destination.origin !== window.location.origin
      || destination.pathname !== window.location.pathname
      || destination.hash !== '#gift-omniselle'
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

    window.history.pushState(null, '', '#gift-omniselle');
    this.classList.remove('is-anchor-target');
    void this.offsetWidth;
    this.classList.add('is-anchor-target');
    window.scrollTo({ top: destinationTop, behavior: reduceMotion ? 'auto' : 'smooth' });

    window.clearTimeout(this.anchorTimer);
    this.anchorTimer = window.setTimeout(() => this.classList.remove('is-anchor-target'), reduceMotion ? 0 : duration);
  }

  readSteps() {
    try {
      return JSON.parse(this.querySelector('[data-gift-atelier-steps]')?.textContent || '[]');
    } catch (error) {
      return [];
    }
  }

  renderStep(moveFocus = false) {
    const step = this.steps[this.currentStep];
    if (!step || !this.question || !this.choices) return this.showResult();

    const prefix = this.dataset.stepPrefix || 'Step';
    const separator = this.dataset.stepSeparator || 'of';
    this.stepCount.textContent = `${prefix} ${this.currentStep + 1} ${separator} ${this.steps.length}`;
    this.question.textContent = step.question;
    this.choices.replaceChildren(...step.answers.map((answer) => this.createChoice(answer)));
    this.renderSelectionSummary();
    if (this.backButton) this.backButton.hidden = this.currentStep === 0;
    this.progress.forEach((item, index) => item.classList.toggle('is-active', index <= this.currentStep));
    if (moveFocus) this.question.focus();
  }

  createChoice(answer) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'gift-atelier__choice';
    button.dataset.giftAtelierChoice = answer.value;
    button.textContent = answer.label;
    button.setAttribute('aria-pressed', 'false');
    return button;
  }

  handleClick(event) {
    const choice = event.target.closest('[data-gift-atelier-choice]');
    if (choice && this.contains(choice)) {
      this.selectChoice(choice);
      return;
    }
    const restart = event.target.closest('[data-gift-atelier-restart]');
    if (restart && this.contains(restart)) this.restart();
    const back = event.target.closest('[data-gift-atelier-back]');
    if (back && this.contains(back)) this.goBack();
  }

  renderSelectionSummary() {
    if (!this.selectionSummary) return;
    const selectedAnswers = this.steps
      .slice(0, this.currentStep)
      .map((step) => this.answers[step.key])
      .filter(Boolean);
    this.selectionSummary.replaceChildren(...selectedAnswers.map((answer) => {
      const item = document.createElement('span');
      item.textContent = answer.label;
      return item;
    }));
    this.selectionSummary.hidden = selectedAnswers.length === 0;
  }

  goBack() {
    if (this.currentStep === 0) return;
    window.clearTimeout(this.transitionTimer);
    const previousStep = this.currentStep - 1;
    this.steps.slice(previousStep).forEach((step) => delete this.answers[step.key]);
    this.currentStep = previousStep;
    this.renderStep(true);
  }

  handleBlockSelect(event) {
    const path = this.paths.find((item) => item.dataset.blockId === event.detail?.blockId);
    if (!path) return;
    this.answers = {
      recipient: this.answerFor(path.dataset.recipient, 'recipient'),
      occasion: this.answerFor(path.dataset.occasion, 'occasion'),
      personal_touch: this.answerFor(path.dataset.personalTouch, 'personal_touch'),
    };
    this.showResult(path);
  }

  answerFor(value, stepKey) {
    if (value === 'any') return undefined;
    const step = this.steps.find((item) => item.key === stepKey);
    const answer = step?.answers.find((item) => item.value === value);
    return answer || { value, label: value };
  }

  selectChoice(choice) {
    const step = this.steps[this.currentStep];
    if (!step || choice.disabled) return;
    this.answers[step.key] = {
      value: choice.dataset.giftAtelierChoice,
      label: choice.textContent,
    };
    this.classList.add('is-engaged');
    this.choices.querySelectorAll('button').forEach((button) => {
      const selected = button === choice;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
      button.disabled = true;
    });
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 170;
    this.transitionTimer = window.setTimeout(() => {
      this.currentStep += 1;
      if (this.currentStep < this.steps.length) this.renderStep(true);
      else this.showResult();
    }, delay);
  }

  findMatchingPath() {
    const matches = this.paths.filter((path) => (
      path.dataset.recipient === this.answers.recipient?.value
      && (path.dataset.occasion === 'any' || path.dataset.occasion === this.answers.occasion?.value)
      && (path.dataset.personalTouch === 'any' || path.dataset.personalTouch === this.answers.personal_touch?.value)
    ));

    return matches.sort((first, second) => this.pathSpecificity(second) - this.pathSpecificity(first))[0] || this.fallbackPath;
  }

  pathSpecificity(path) {
    return ['recipient', 'occasion', 'personalTouch'].reduce((score, key) => (
      score + (path.dataset[key] === 'any' ? 0 : 1)
    ), 0);
  }

  replaceTokens(root) {
    const values = {
      '{recipient}': this.answers.recipient?.label || '',
      '{occasion}': this.answers.occasion?.label || '',
      '{personal_touch}': this.answers.personal_touch?.label || '',
    };
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      node.nodeValue = Object.entries(values).reduce(
        (text, [token, value]) => text.replaceAll(token, value),
        node.nodeValue,
      );
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
    const chips = content.querySelector('[data-gift-atelier-chips]');
    if (chips) {
      Object.values(this.answers).forEach((answer) => {
        const chip = document.createElement('span');
        chip.className = 'gift-atelier__chip';
        chip.textContent = answer.label;
        chips.append(chip);
      });
    }
    this.questions.hidden = true;
    this.result.replaceChildren(content);
    this.result.hidden = false;
    if (this.status) this.status.textContent = this.result.querySelector('[data-gift-atelier-result-heading]')?.textContent?.trim() || '';
    this.result.dispatchEvent(
      new CustomEvent('gift-atelier:products-loaded', {
        bubbles: true,
        detail: { panel: this.result },
      }),
    );
    this.result.querySelector('[data-gift-atelier-result-heading]')?.focus();
  }

  restart() {
    window.clearTimeout(this.transitionTimer);
    this.answers = {};
    this.currentStep = 0;
    this.classList.remove('is-engaged');
    this.result.hidden = true;
    this.result.replaceChildren();
    if (this.status) this.status.textContent = '';
    this.questions.hidden = false;
    this.renderStep(true);
  }
}

if (!customElements.get('gift-atelier')) customElements.define('gift-atelier', GiftAtelier);
