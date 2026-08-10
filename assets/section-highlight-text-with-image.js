if (!customElements.get('highlight-text-with-image')) {
  class HighlightTextWithImage extends HTMLElement {
    connectedCallback() {
      this.section = this.querySelector('.highlight-text-with-image');
      this.heading = this.querySelector('.highlight-text-with-image__heading');
      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.animationFrame = null;
      this.structureFrame = null;
      this.highlightTokens = [];
      this.tokenMetrics = [];
      this.totalHighlightWidth = 0;
      this.lastHeadingWidth = 0;
      this.originalHeadingHTML ||= this.heading?.innerHTML;
      this.handleViewportChange = this.handleViewportChange.bind(this);
      this.handleMotionChange = this.handleMotionChange.bind(this);
      this.handleResize = this.handleResize.bind(this);

      if (!this.section || !this.heading) return;

      this.buildTextHighlight();
      this.classList.add('is-scroll-highlight-ready');
      this.reducedMotion.addEventListener?.('change', this.handleMotionChange);
      window.addEventListener('resize', this.handleResize, { passive: true });
      this.handleMotionChange();

      document.fonts?.ready.then(() => {
        if (this.isConnected) this.scheduleStructureUpdate();
      });
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.handleViewportChange);
      window.removeEventListener('resize', this.handleResize);
      this.reducedMotion?.removeEventListener?.('change', this.handleMotionChange);
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      if (this.structureFrame) cancelAnimationFrame(this.structureFrame);
    }

    handleMotionChange() {
      window.removeEventListener('scroll', this.handleViewportChange);

      if (this.reducedMotion.matches) {
        this.setHighlightProgress(1);
        return;
      }

      window.addEventListener('scroll', this.handleViewportChange, { passive: true });
      this.handleViewportChange();
    }

    handleResize() {
      this.scheduleStructureUpdate();
    }

    scheduleStructureUpdate() {
      if (this.structureFrame) return;

      this.structureFrame = requestAnimationFrame(() => {
        this.structureFrame = null;
        if (!this.isConnected || !this.heading) return;

        const currentWidth = Math.round(this.heading.getBoundingClientRect().width);
        if (currentWidth === this.lastHeadingWidth) {
          this.cacheTokenMetrics();
          this.updateFillStop();
          return;
        }

        this.buildTextHighlight();
        this.updateFillStop();
      });
    }

    buildTextHighlight() {
      this.heading.innerHTML = this.originalHeadingHTML;

      const tokens = [];
      Array.from(this.heading.childNodes).forEach((node) => this.collectTokens(node, [], tokens));

      while (tokens[0]?.classList.contains('text-highlight__token--space')) tokens.shift();
      while (tokens.at(-1)?.classList.contains('text-highlight__token--space')) tokens.pop();

      const measurementFragment = document.createDocumentFragment();
      tokens.forEach((token) => measurementFragment.append(token));
      this.heading.replaceChildren(measurementFragment);
      this.heading.classList.add('is-measuring-highlight-lines');

      const lines = [];
      let activeLine = [];
      let activeTop = null;

      tokens.forEach((token) => {
        const rect = token.getClientRects()[0] || token.getBoundingClientRect();
        const tokenTop = Math.round(rect.top);

        if (activeTop !== null && Math.abs(tokenTop - activeTop) > 2) {
          lines.push(activeLine);
          activeLine = [];
        }

        if (activeLine.length === 0) activeTop = tokenTop;
        activeLine.push(token);
      });

      if (activeLine.length) lines.push(activeLine);

      const lineFragment = document.createDocumentFragment();
      lines.forEach((lineTokens) => {
        const line = document.createElement('div');
        line.className = 'text-highlight';
        lineTokens.forEach((token) => line.append(token));
        lineFragment.append(line);
      });

      this.heading.replaceChildren(lineFragment);
      this.heading.classList.remove('is-measuring-highlight-lines');
      this.lastHeadingWidth = Math.round(this.heading.getBoundingClientRect().width);
      this.highlightTokens = Array.from(this.heading.querySelectorAll('.text-highlight__token'));
      this.cacheTokenMetrics();
    }

    collectTokens(node, inheritedClasses, tokens) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent.split(/(\s+)/).filter(Boolean).forEach((content) => {
          const token = document.createElement('span');
          const isSpace = /^\s+$/.test(content);
          token.className = ['text-highlight__token', isSpace ? 'text-highlight__token--space' : '', ...inheritedClasses]
            .filter(Boolean)
            .join(' ');
          token.textContent = content;
          tokens.push(token);
        });
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      if (node.classList.contains('highlight-text-with-image__media')) {
        node.classList.add('text-highlight__token', 'text-highlight__token--media');
        tokens.push(node);
        return;
      }

      if (node.classList.contains('highlight-text-with-image__marker')) {
        const markerClasses = Array.from(node.classList);
        Array.from(node.childNodes).forEach((child) => this.collectTokens(child, markerClasses, tokens));
        return;
      }

      Array.from(node.childNodes).forEach((child) => this.collectTokens(child, inheritedClasses, tokens));
    }

    cacheTokenMetrics() {
      let offset = 0;

      this.tokenMetrics = this.highlightTokens.map((token) => {
        const width = Math.max(token.getBoundingClientRect().width, 0);
        const metric = { token, start: offset, width };
        offset += width;
        return metric;
      });

      this.totalHighlightWidth = Math.max(offset, 1);
    }

    handleViewportChange() {
      if (this.animationFrame) return;

      this.animationFrame = requestAnimationFrame(() => {
        this.animationFrame = null;
        this.updateFillStop();
      });
    }

    updateFillStop() {
      if (!this.isConnected || !this.section) return;

      if (this.reducedMotion.matches) {
        this.setHighlightProgress(1);
        return;
      }

      const bounds = this.getBoundingClientRect();
      const viewportHeight = Math.max(window.innerHeight, 1);
      const start = viewportHeight * 0.9;
      const finishRatio = {
        slow: 0.12,
        medium: 0.26,
        fast: 0.4,
      }[this.dataset.animationSpeed] || 0.26;
      const finish = viewportHeight * finishRatio;
      const travel = Math.max(start - finish, 1);
      const progress = Math.min(Math.max((start - bounds.top) / travel, 0), 1);

      this.setHighlightProgress(progress);
    }

    setHighlightProgress(progress) {
      const normalizedProgress = Math.min(Math.max(progress, 0), 1);
      const filledWidth = this.totalHighlightWidth * normalizedProgress;

      this.section.style.setProperty('--highlight-fill-stop', `${(normalizedProgress * 100).toFixed(2)}%`);

      this.tokenMetrics.forEach(({ token, start, width }) => {
        if (token.classList.contains('text-highlight__token--media')) return;

        const localFill = Math.min(Math.max(filledWidth - start, 0), width);
        const transitionWidth = Math.min(Math.max(width * 0.08, 2), 8);
        const localUnfill = Math.min(localFill + transitionWidth, width);

        token.style.setProperty('--highlight-fill-stop', `${localFill.toFixed(2)}px`);
        token.style.setProperty('--highlight-unfill-stop', `${localUnfill.toFixed(2)}px`);
      });
    }
  }

  customElements.define('highlight-text-with-image', HighlightTextWithImage);
}
