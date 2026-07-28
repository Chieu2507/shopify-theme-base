if (!customElements.get('video-banner')) {
  class VideoBanner extends HTMLElement {
    connectedCallback() {
      this.video = this.querySelector('video');
      this.playButton = this.querySelector('[data-video-banner-play]');
      if (!this.video || !this.playButton) return;

      this.handlePlayClick = this.playVideo.bind(this);
      this.handlePlay = () => this.classList.add('is-playing');
      this.handlePause = () => this.classList.remove('is-playing');
      this.playButton.addEventListener('click', this.handlePlayClick);
      this.video.addEventListener('play', this.handlePlay);
      this.video.addEventListener('pause', this.handlePause);
      this.video.addEventListener('ended', this.handlePause);
    }

    disconnectedCallback() {
      if (!this.video || !this.playButton) return;
      this.playButton.removeEventListener('click', this.handlePlayClick);
      this.video.removeEventListener('play', this.handlePlay);
      this.video.removeEventListener('pause', this.handlePause);
      this.video.removeEventListener('ended', this.handlePause);
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
