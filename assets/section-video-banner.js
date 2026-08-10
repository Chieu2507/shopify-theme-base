if (!customElements.get('video-banner')) {
  class VideoBanner extends HTMLElement {
    connectedCallback() {
      this.video = this.querySelector('video');
      this.playButton = this.querySelector('[data-video-banner-play]');
      if (!this.video) return;

      this.handlePlayClick = this.playVideo.bind(this);
      this.handlePlay = () => this.classList.add('is-playing');
      this.handlePause = () => this.classList.remove('is-playing');
      this.handleMotionChange = this.applyMotionPreference.bind(this);
      this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.playButton?.addEventListener('click', this.handlePlayClick);
      this.video.addEventListener('play', this.handlePlay);
      this.video.addEventListener('pause', this.handlePause);
      this.video.addEventListener('ended', this.handlePause);
      this.motionQuery.addEventListener('change', this.handleMotionChange);
      this.applyMotionPreference();
    }

    disconnectedCallback() {
      if (!this.video) return;
      this.playButton?.removeEventListener('click', this.handlePlayClick);
      this.video.removeEventListener('play', this.handlePlay);
      this.video.removeEventListener('pause', this.handlePause);
      this.video.removeEventListener('ended', this.handlePause);
      this.motionQuery?.removeEventListener('change', this.handleMotionChange);
    }

    applyMotionPreference() {
      if (this.motionQuery.matches) {
        this.video.pause();
        this.classList.remove('is-playing');
        return;
      }

      if (this.dataset.autoplay === 'true' && this.video.paused) this.playVideo();
    }

    playVideo() {
      const playRequest = this.video.play();
      if (playRequest && typeof playRequest.catch === 'function') {
        playRequest.catch(() => this.classList.remove('is-playing'));
      }
    }
  }

  customElements.define('video-banner', VideoBanner);
}
