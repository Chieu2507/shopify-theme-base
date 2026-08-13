import { A11y, Navigation, Swiper } from './swiper-loader.js';
import { initializeWhenVisible } from './initialize-when-visible.js';

class ShoppableVideoSection extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.slides = Array.from(this.querySelectorAll('[data-shoppable-video-slide]'));
    this.returnFocus = null;
    this.onClick = this.handleClick.bind(this);
    this.onDialogClose = this.handleDialogClose.bind(this);
    this.onDialogCancel = this.handleDialogCancel.bind(this);
    this.onBlockSelect = this.handleBlockSelect.bind(this);
    this.addEventListener('click', this.onClick);
    this.querySelectorAll('[data-shoppable-video-dialog]').forEach((dialog) => {
      dialog.addEventListener('close', this.onDialogClose);
      dialog.addEventListener('cancel', this.onDialogCancel);
    });
    document.addEventListener('shopify:block:select', this.onBlockSelect);
    this.cancelDeferredInitialization = initializeWhenVisible(this, () => this.initializeCarousel());
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
    this.querySelectorAll('[data-shoppable-video-dialog]').forEach((dialog) => {
      dialog.removeEventListener('close', this.onDialogClose);
      dialog.removeEventListener('cancel', this.onDialogCancel);
    });
    document.removeEventListener('shopify:block:select', this.onBlockSelect);
    this.cancelDeferredInitialization?.();
    window.clearTimeout(this.closeTimer);
    this.querySelectorAll('[data-shoppable-video-dialog][open]').forEach((dialog) => dialog.close());
    this.pauseOtherVideos();
    this.swiper?.destroy(true, true);
    this.swiper = null;
    this.initialized = false;
  }

  initializeCarousel() {
    if (this.swiper || !this.slides.length) return;
    const carousel = this.querySelector('[data-shoppable-video-carousel]');
    if (!carousel) return;

    const desktopColumns = Number.parseInt(this.dataset.desktopColumns, 10) || 3;
    const mobileColumns = Number.parseFloat(this.dataset.mobileColumns) || 1;
    const tabletColumns = Math.min(desktopColumns, 2);
    const productCount = this.slides.length;
    const slidesWithPreview = (columns, preview = true) => columns + (preview && productCount > columns ? 0.15 : 0);

    this.swiper = new Swiper(carousel, {
      modules: [A11y, Navigation],
      slidesPerView: slidesWithPreview(mobileColumns),
      spaceBetween: this.cssNumber('--shoppable-video-mobile-gap'),
      speed: this.reduceMotion ? 0 : 420,
      watchOverflow: true,
      navigation: {
        prevEl: this.querySelector('[data-shoppable-video-previous]'),
        nextEl: this.querySelector('[data-shoppable-video-next]'),
      },
      a11y: { enabled: true, slideRole: 'listitem' },
      breakpoints: {
        768: {
          slidesPerView: slidesWithPreview(tabletColumns),
          spaceBetween: this.cssNumber('--shoppable-video-gap'),
        },
        990: {
          slidesPerView: desktopColumns,
          spaceBetween: this.cssNumber('--shoppable-video-gap'),
        },
      },
      on: {
        init: (swiper) => this.updateProgress(swiper),
        slideChange: (swiper) => {
          this.pauseOtherVideos();
          this.updateProgress(swiper);
        },
        resize: (swiper) => this.updateProgress(swiper),
        breakpoint: (swiper) => this.updateProgress(swiper),
      },
    });
  }

  cssNumber(name) {
    return Number.parseFloat(getComputedStyle(this).getPropertyValue(name)) || 0;
  }

  updateProgress(swiper) {
    const total = this.slides.length;
    if (!total) return;
    const visible = Math.min(Math.max(swiper.slidesPerViewDynamic(), Number(swiper.params.slidesPerView) || 1), total);
    const endIndex = Math.min(total, swiper.activeIndex + Math.ceil(visible));
    const count = this.querySelector('[data-shoppable-video-showing]');
    const progress = this.querySelector('[data-shoppable-video-progress]');
    const pageLabel = this.querySelector('[data-shoppable-video-page-label]');
    if (count) count.textContent = `Showing ${endIndex} of ${total}`;
    if (progress) {
      const thumbSize = Math.min(1, visible / total);
      const value = total <= Math.ceil(visible) ? 1 : thumbSize + (swiper.progress * (1 - thumbSize));
      progress.style.setProperty('--shoppable-video-progress', value);
    }
    if (pageLabel) {
      const prefix = pageLabel.textContent.split('/')[0].trim();
      const page = String(swiper.activeIndex + 1).padStart(2, '0');
      pageLabel.textContent = `${prefix} / Page ${page}`;
    }
  }

  handleClick(event) {
    const playButton = event.target.closest('[data-shoppable-video-play]');
    if (playButton && this.contains(playButton)) {
      this.toggleVideo(playButton);
      return;
    }

    const openButton = event.target.closest('[data-shoppable-video-open]');
    if (openButton && this.contains(openButton)) {
      const dialogId = openButton.getAttribute('aria-controls');
      const dialog = dialogId ? this.querySelector(`#${CSS.escape(dialogId)}`) : null;
      if (dialog) this.openDialog(dialog, openButton);
      return;
    }

    const closeButton = event.target.closest('[data-shoppable-video-close]');
    if (closeButton) {
      this.closeDialog(closeButton.closest('[data-shoppable-video-dialog]'));
      return;
    }

    const dialog = event.target.closest('[data-shoppable-video-dialog]');
    if (dialog && event.target === dialog) this.closeDialog(dialog);
  }

  toggleVideo(button) {
    const video = button.closest('[data-shoppable-video-slide]')?.querySelector('video');
    if (!video) return;
    if (video.paused) {
      this.pauseOtherVideos(video);
      video.play().catch(() => {});
      button.classList.add('is-playing');
      button.setAttribute('aria-label', button.dataset.pauseLabel || 'Pause video');
    } else {
      video.pause();
      button.classList.remove('is-playing');
      button.setAttribute('aria-label', button.dataset.playLabel || 'Play video');
    }
  }

  pauseOtherVideos(activeVideo = null) {
    this.querySelectorAll('video').forEach((video) => {
      if (video === activeVideo) return;
      video.pause();
      const button = video.closest('[data-shoppable-video-slide]')?.querySelector('[data-shoppable-video-play]');
      button?.classList.remove('is-playing');
      if (button) button.setAttribute('aria-label', button.dataset.playLabel || 'Play video');
    });
  }

  openDialog(dialog, trigger) {
    if (dialog.open) return;
    this.pauseOtherVideos();
    this.returnFocus = trigger;
    dialog.classList.remove('is-closing');
    dialog.showModal();
    dialog.querySelector('[data-shoppable-video-close]')?.focus({ preventScroll: true });
  }

  closeDialog(dialog) {
    if (!dialog?.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    if (this.reduceMotion) {
      dialog.close();
      return;
    }
    window.clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => dialog.open && dialog.close(), 260);
  }

  handleDialogCancel(event) {
    event.preventDefault();
    this.closeDialog(event.currentTarget);
  }

  handleDialogClose(event) {
    event.currentTarget.classList.remove('is-closing');
    this.returnFocus?.focus({ preventScroll: true });
    this.returnFocus = null;
  }

  handleBlockSelect(event) {
    const index = this.slides.findIndex((slide) => slide.dataset.blockId === event.detail?.blockId);
    if (index < 0) return;
    this.initializeCarousel();
    this.swiper?.slideTo(index, this.reduceMotion ? 0 : 320);
  }
}

if (!customElements.get('shoppable-video-section')) {
  customElements.define('shoppable-video-section', ShoppableVideoSection);
}
