if (!customElements.get('noryvelle-pebble-countdown')) {
  class NoryvellePebbleCountdown extends HTMLElement {
    connectedCallback() {
      this.stop();
      if (this.hasAttribute('data-preview') || !this.dataset.endAt) return;
      this.units = this.querySelector('[data-countdown-units]');
      this.completeMessage = this.querySelector('[data-countdown-complete]');
      this.outputs = {
        days: this.querySelector('[data-countdown-days]'),
        hours: this.querySelector('[data-countdown-hours]'),
        minutes: this.querySelector('[data-countdown-minutes]'),
        seconds: this.querySelector('[data-countdown-seconds]'),
      };
      this.endTime = new Date(this.dataset.endAt).getTime();
      if (Number.isNaN(this.endTime)) {
        this.hidden = true;
        return;
      }
      this.update();
      this.interval = window.setInterval(() => this.update(), 1000);
    }

    disconnectedCallback() {
      this.stop();
    }

    stop() {
      window.clearInterval(this.interval);
      this.interval = null;
    }

    update() {
      const remaining = Math.max(0, this.endTime - Date.now());
      const values = {
        days: Math.floor(remaining / 86400000),
        hours: Math.floor((remaining % 86400000) / 3600000),
        minutes: Math.floor((remaining % 3600000) / 60000),
        seconds: Math.floor((remaining % 60000) / 1000),
      };

      Object.entries(values).forEach(([key, value]) => {
        if (this.outputs[key]) this.outputs[key].textContent = String(value).padStart(2, '0');
      });

      if (remaining === 0) this.complete();
    }

    complete() {
      this.stop();
      if (this.dataset.completionBehavior === 'hide') {
        this.hidden = true;
        return;
      }
      if (this.units) this.units.hidden = true;
      if (this.completeMessage) this.completeMessage.hidden = false;
    }
  }

  customElements.define('noryvelle-pebble-countdown', NoryvellePebbleCountdown);
}
