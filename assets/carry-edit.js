class CarryEdit extends HTMLElement {
  connectedCallback() {
    if (!this.isBound) {
      this.isBound = true;
      this.onClick = this.handleClick.bind(this);
      this.onBlockSelect = this.handleBlockSelect.bind(this);
      this.onSectionLoad = this.handleSectionLoad.bind(this);
      this.addEventListener('click', this.onClick);
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
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    document.removeEventListener('shopify:section:load', this.onSectionLoad);
    this.editorObserver?.disconnect();
    window.clearTimeout(this.transitionTimer);
    window.cancelAnimationFrame(this.initializeFrame);
    this.isBound = false;
  }

  initialize() {
    this.questions = this.querySelector('[data-carry-edit-questions]');
    this.result = this.querySelector('[data-carry-edit-result]');
    this.sources = this.querySelector('[data-carry-edit-sources]');
    this.status = this.querySelector('[data-carry-edit-status]');
    this.question = this.querySelector('[data-carry-edit-question]');
    this.choices = this.querySelector('[data-carry-edit-choices]');
    this.stepCount = this.querySelector('[data-carry-edit-step-count]');
    this.selectionSummary = this.querySelector('[data-carry-edit-selection-summary]');
    this.backButton = this.querySelector('[data-carry-edit-back]');
    this.progress = Array.from(this.querySelectorAll('[data-carry-edit-progress]'));
    this.paths = Array.from(this.querySelectorAll('[data-carry-edit-path]'));
    this.fallbackPath = this.querySelector('[data-carry-edit-fallback]');
    this.steps = this.readSteps();
    this.dimensions = ['occasion', 'silhouette', 'capacity', 'finish'];
    this.matchWeights = this.readMatchWeights();

    if (!this.questions || !this.result || !this.sources || !this.question || !this.choices || !this.steps.length) return;

    window.clearTimeout(this.transitionTimer);
    this.releaseResultPanels();
    this.answers = {};
    this.currentStep = 0;
    this.questions.hidden = false;
    this.result.hidden = true;
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

  readSteps() {
    try {
      return JSON.parse(this.querySelector('[data-carry-edit-steps]')?.textContent || '[]');
    } catch (error) {
      return [];
    }
  }

  readMatchWeights() {
    return this.dimensions.reduce((weights, key) => {
      const rawValue = this.getAttribute(`data-match-weight-${key}`);
      const value = Number.parseFloat(rawValue);
      weights[key] = Number.isFinite(value) && value > 0 ? value : 1;
      return weights;
    }, {});
  }

  renderStep(moveFocus = false) {
    const step = this.steps[this.currentStep];
    if (!step || !this.question || !this.choices) {
      this.showResult();
      return;
    }

    const prefix = this.dataset.stepPrefix || 'Step';
    const separator = this.dataset.stepSeparator || 'of';
    if (this.stepCount) this.stepCount.textContent = `${prefix} ${this.currentStep + 1} ${separator} ${this.steps.length}`;
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
    button.className = 'carry-edit__choice';
    button.dataset.carryEditChoice = answer.value;
    button.textContent = answer.label;
    button.setAttribute('aria-pressed', 'false');
    return button;
  }

  handleClick(event) {
    const choice = event.target.closest('[data-carry-edit-choice]');
    if (choice && this.contains(choice)) {
      this.selectChoice(choice);
      return;
    }

    const restart = event.target.closest('[data-carry-edit-restart]');
    if (restart && this.contains(restart)) {
      this.restart();
      return;
    }

    const back = event.target.closest('[data-carry-edit-back]');
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
      occasion: this.answerFor(path.dataset.occasion, 'occasion'),
      silhouette: this.answerFor(path.dataset.silhouette, 'silhouette'),
      capacity: this.answerFor(path.dataset.capacity, 'capacity'),
      finish: this.answerFor(path.dataset.finish, 'finish'),
    };
    this.showResult(path);
  }

  answerFor(value, stepKey) {
    if (value === 'any') {
      const wildcardLabels = {
        occasion: 'your occasion',
        silhouette: 'your preferred silhouette',
        capacity: 'what you carry',
        finish: 'your preferred finish',
      };
      return { value, label: wildcardLabels[stepKey] || 'Any' };
    }
    const step = this.steps.find((item) => item.key === stepKey);
    const answer = step?.answers.find((item) => item.value === value);
    return answer || { value, label: value };
  }

  selectChoice(choice) {
    const step = this.steps[this.currentStep];
    if (!step || choice.disabled) return;

    this.answers[step.key] = {
      value: choice.dataset.carryEditChoice,
      label: choice.textContent,
    };
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
    const candidates = this.paths.map((path, index) => this.evaluatePath(path, index));
    if (!candidates.length) return { path: this.fallbackPath, state: 'fallback' };

    const compatibleCandidates = candidates.filter((candidate) => candidate.compatible);
    const pool = compatibleCandidates.length ? compatibleCandidates : candidates;
    const best = pool.reduce((currentBest, candidate) => (
      this.isBetterCandidate(candidate, currentBest, compatibleCandidates.length > 0)
        ? candidate
        : currentBest
    ), null);

    if (!best) return { path: this.fallbackPath, state: 'fallback' };

    let state = 'nearest';
    if (best.compatible) state = best.wildcardCount > 0 ? 'curated' : 'exact';
    return { path: best.path, state };
  }

  evaluatePath(path, index) {
    const candidate = {
      path,
      index,
      priority: Number.parseInt(path.dataset.routePriority, 10) || 0,
      exactCount: 0,
      wildcardCount: 0,
      mismatchCount: 0,
      matchedWeight: 0,
      mismatchedWeight: 0,
    };

    this.dimensions.forEach((key) => {
      const expectedValue = path.dataset[key] || 'any';
      const selectedValue = this.answers[key]?.value;
      const weight = this.matchWeights[key];

      if (expectedValue === 'any') {
        candidate.wildcardCount += 1;
      } else if (expectedValue === selectedValue) {
        candidate.exactCount += 1;
        candidate.matchedWeight += weight;
      } else {
        candidate.mismatchCount += 1;
        candidate.mismatchedWeight += weight;
      }
    });

    candidate.compatible = candidate.mismatchCount === 0;
    candidate.specificity = this.dimensions.length - candidate.wildcardCount;
    candidate.proximityScore = candidate.matchedWeight - candidate.mismatchedWeight;
    return candidate;
  }

  isBetterCandidate(candidate, currentBest, compatibleOnly) {
    if (!currentBest) return true;

    const comparisons = compatibleOnly
      ? [
        candidate.matchedWeight - currentBest.matchedWeight,
        candidate.specificity - currentBest.specificity,
        candidate.exactCount - currentBest.exactCount,
      ]
      : [
        candidate.proximityScore - currentBest.proximityScore,
        candidate.matchedWeight - currentBest.matchedWeight,
        currentBest.mismatchedWeight - candidate.mismatchedWeight,
        candidate.exactCount - currentBest.exactCount,
      ];

    comparisons.push(
      candidate.priority - currentBest.priority,
      currentBest.index - candidate.index,
    );

    return comparisons.find((difference) => difference !== 0) > 0;
  }

  releaseResultPanels() {
    if (!this.sources) return;
    [...this.paths, this.fallbackPath].filter(Boolean).forEach((path) => {
      path.querySelector('[data-carry-edit-rendered]')?.remove();
      if (path.parentElement !== this.sources) this.sources.append(path);
    });
  }

  replaceTokens(root) {
    const values = {
      '{occasion}': this.answers.occasion?.label || '',
      '{silhouette}': this.answers.silhouette?.label || '',
      '{capacity}': this.answers.capacity?.label || '',
      '{finish}': this.answers.finish?.label || '',
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
    const match = preferredPath
      ? { path: preferredPath, state: 'editor-preview' }
      : this.findMatchingPath();
    const path = match?.path;
    if (!path || !this.result) {
      this.questions.hidden = false;
      this.result.hidden = true;
      if (this.status) this.status.textContent = '';
      return;
    }

    const template = path.querySelector('template[data-carry-edit-path-template]');
    if (!template) {
      this.questions.hidden = false;
      this.result.hidden = true;
      if (this.status) this.status.textContent = '';
      return;
    }

    this.releaseResultPanels();
    const content = template.content.cloneNode(true);
    this.replaceTokens(content);
    const kicker = content.querySelector('[data-carry-edit-result-kicker]');
    if (match.state === 'curated' && kicker) {
      kicker.textContent = this.dataset.curatedEditLabel || kicker.textContent;
    } else if (match.state === 'nearest' && kicker) {
      kicker.textContent = this.dataset.closestEditLabel || kicker.textContent;
    }
    const chips = content.querySelector('[data-carry-edit-chips]');
    if (chips) {
      Object.values(this.answers).filter(Boolean).forEach((answer) => {
        const chip = document.createElement('span');
        chip.className = 'carry-edit__chip';
        chip.textContent = answer.label;
        chips.append(chip);
      });
    }

    this.questions.hidden = true;
    path.append(content);
    this.result.append(path);
    this.result.hidden = false;
    const rendered = path.querySelector('[data-carry-edit-rendered]');
    if (rendered) rendered.dataset.carryEditMatchState = match.state;
    const renderedKicker = rendered?.querySelector('.carry-edit__result-kicker')?.textContent?.trim();
    const renderedHeading = rendered?.querySelector('[data-carry-edit-result-heading]')?.textContent?.trim();
    if (this.status) this.status.textContent = [renderedKicker, renderedHeading].filter(Boolean).join(': ');
    rendered?.dispatchEvent(
      new CustomEvent('carry-edit:products-loaded', {
        bubbles: true,
        detail: {
          panel: rendered,
          matchState: match.state,
          routeId: path.dataset.blockId || null,
        },
      }),
    );
    rendered?.querySelector('[data-carry-edit-result-heading]')?.focus();
  }

  restart() {
    window.clearTimeout(this.transitionTimer);
    this.answers = {};
    this.currentStep = 0;
    this.releaseResultPanels();
    this.result.hidden = true;
    if (this.status) this.status.textContent = '';
    this.questions.hidden = false;
    this.renderStep(true);
  }
}

if (!customElements.get('carry-edit')) customElements.define('carry-edit', CarryEdit);
