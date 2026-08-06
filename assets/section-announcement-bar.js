import A11y from './swiper-12.2.0-a11y.min.mjs';
import Swiper from './swiper-12.2.0.min.mjs';

if (!customElements.get('announcement-bar')) {
  class AnnouncementBar extends HTMLElement {
    connectedCallback() {
      this.slider = this.querySelector('[data-announcement-slider]');
      this.items = Array.from(this.querySelectorAll('[data-announcement-item]'));
      this.navigator = this.querySelector('[data-announcement-navigator]');
      this.previousButton = this.querySelector('[data-announcement-step="-1"]');
      this.nextButton = this.querySelector('[data-announcement-step="1"]');
      this.currentIndicator = this.querySelector('[data-announcement-current]');
      this.totalIndicator = this.querySelector('[data-announcement-total]');
      this.index = 0;
      this.interval = Number(this.dataset.interval) || 5000;
      this.motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.reduceMotion = this.motionPreference.matches;
      this.isPointerInside = false;
      this.hasFocusWithin = false;
      this.onBlockSelect = this.handleBlockSelect.bind(this);
      this.onMouseEnter = this.handleMouseEnter.bind(this);
      this.onMouseLeave = this.handleMouseLeave.bind(this);
      this.onFocusIn = this.handleFocusIn.bind(this);
      this.onFocusOut = this.handleFocusOut.bind(this);
      this.onNavigatorClick = this.handleNavigatorClick.bind(this);
      this.onMotionPreferenceChange = this.handleMotionPreferenceChange.bind(this);
      this.onVisibilityChange = this.handleVisibilityChange.bind(this);

      this.addEventListener('mouseenter', this.onMouseEnter);
      this.addEventListener('mouseleave', this.onMouseLeave);
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('focusout', this.onFocusOut);
      this.navigator?.addEventListener('click', this.onNavigatorClick);
      this.motionPreference.addEventListener('change', this.onMotionPreferenceChange);
      document.addEventListener('shopify:block:select', this.onBlockSelect);
      document.addEventListener('visibilitychange', this.onVisibilityChange);

      this.initializeSwiper();
      this.startRotation();
    }

    disconnectedCallback() {
      this.stopRotation();
      this.removeEventListener('mouseenter', this.onMouseEnter);
      this.removeEventListener('mouseleave', this.onMouseLeave);
      this.removeEventListener('focusin', this.onFocusIn);
      this.removeEventListener('focusout', this.onFocusOut);
      this.navigator?.removeEventListener('click', this.onNavigatorClick);
      this.motionPreference?.removeEventListener('change', this.onMotionPreferenceChange);
      document.removeEventListener('shopify:block:select', this.onBlockSelect);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.swiper?.destroy(true, true);
      this.swiper = null;
    }

    initializeSwiper() {
      if (!this.slider || !this.items.length) {
        this.updateCounter();
        return;
      }

      const slideCount = this.items.length;
      const transitionSpeed = this.reduceMotion ? 0 : 420;
      const slideHeight = this.slider.clientHeight || 37;
      const shortTravel = Math.max(4, Math.round(slideHeight * 0.7));
      this.slider.style.setProperty('--announcement-bar-transition-duration', `${transitionSpeed}ms`);

      this.swiper = new Swiper(this.slider, {
        modules: [A11y],
        direction: 'vertical',
        slidesPerView: 1,
        spaceBetween: -shortTravel,
        loop: slideCount > 1,
        speed: transitionSpeed,
        watchOverflow: true,
        grabCursor: slideCount > 1 && !this.reduceMotion,
        allowTouchMove: slideCount > 1,
        a11y: {
          enabled: true,
          prevSlideMessage: this.previousButton?.getAttribute('aria-label') || '',
          nextSlideMessage: this.nextButton?.getAttribute('aria-label') || '',
          slideRole: 'group',
        },
      });

      this.swiper.on('slideChange', () => {
        this.index = this.swiper.realIndex;
        this.updateCounter();
      });
      this.updateCounter();
    }

    startRotation() {
      this.stopRotation();
      if (
        this.dataset.behavior !== 'rotate' ||
        this.items.length < 2 ||
        this.reduceMotion ||
        this.isPointerInside ||
        this.hasFocusWithin ||
        document.hidden ||
        !this.swiper
      ) return;

      this.rotationTimer = window.setInterval(() => this.showItem(this.index + 1, 'next'), this.interval);
    }

    stopRotation() {
      window.clearInterval(this.rotationTimer);
      this.rotationTimer = null;
    }

    handleVisibilityChange() {
      if (document.hidden) {
        this.stopRotation();
        return;
      }
      this.startRotation();
    }

    showItem(index, direction = null) {
      if (!this.swiper || this.items.length < 2) return;

      const nextIndex = (index + this.items.length) % this.items.length;
      const currentIndex = this.swiper.realIndex ?? this.index;
      if (nextIndex === currentIndex) return;

      this.index = nextIndex;
      const speed = this.reduceMotion ? 0 : this.swiper.params.speed;
      if (direction === 'next') {
        this.swiper.slideNext(speed);
      } else if (direction === 'prev') {
        this.swiper.slidePrev(speed);
      } else {
        this.swiper.slideToLoop(nextIndex, speed);
      }
    }

    updateCounter() {
      const current = this.swiper?.realIndex ?? this.index;
      if (this.currentIndicator) this.currentIndicator.textContent = this.formatCounter(current + 1);
      if (this.totalIndicator) this.totalIndicator.textContent = this.formatCounter(this.items.length);
    }

    formatCounter(value) {
      return String(value).padStart(2, '0');
    }

    handleBlockSelect(event) {
      if (event.detail?.sectionId !== this.dataset.sectionId) return;

      const selectedSlide = this.items.find((item) => item.dataset.blockId === event.detail.blockId);
      if (!selectedSlide) return;

      this.stopRotation();
      this.showItem(this.items.indexOf(selectedSlide));
    }

    handleMouseEnter() {
      this.isPointerInside = true;
      this.stopRotation();
    }

    handleMouseLeave() {
      this.isPointerInside = false;
      this.startRotation();
    }

    handleFocusIn() {
      this.hasFocusWithin = true;
      this.stopRotation();
    }

    handleFocusOut(event) {
      if (this.contains(event.relatedTarget)) return;
      this.hasFocusWithin = false;
      this.startRotation();
    }

    handleNavigatorClick(event) {
      const control = event.target.closest('[data-announcement-step]');
      if (!control || !this.navigator?.contains(control)) return;

      event.preventDefault();
      this.stopRotation();
      const step = Number(control.dataset.announcementStep);
      this.showItem(this.index + step, step > 0 ? 'next' : 'prev');
      this.startRotation();
    }

    handleMotionPreferenceChange(event) {
      this.reduceMotion = event.matches;
      if (this.swiper) {
        const transitionSpeed = this.reduceMotion ? 0 : 420;
        this.swiper.params.speed = transitionSpeed;
        this.slider?.style.setProperty('--announcement-bar-transition-duration', `${transitionSpeed}ms`);
        this.swiper.allowTouchMove = this.items.length > 1;
      }
      if (this.reduceMotion) this.stopRotation();
      else this.startRotation();
    }
  }

  customElements.define('announcement-bar', AnnouncementBar);
}
