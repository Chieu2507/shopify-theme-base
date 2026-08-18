import { A11y, Navigation, Swiper } from './swiper-loader.js';
import { initializeWhenVisible } from './initialize-when-visible.js';

class BlogPostsCarousel extends HTMLElement {
  connectedCallback() {
    if (this.initialized) return;
    this.initialized = true;
    this.carousel = this.querySelector('[data-blog-posts-carousel]');
    this.scroller = this.querySelector('[data-blog-posts-scroller]');
    this.previous = this.querySelector('[data-blog-posts-previous]');
    this.next = this.querySelector('[data-blog-posts-next]');
    this.showMore = this.querySelector('[data-blog-posts-show-more]');
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.desktopQuery = window.matchMedia('(min-width: 990px)');
    this.mobileQuery = window.matchMedia('(max-width: 767.98px)');
    this.onViewportChange = this.refresh.bind(this);
    this.onShowMore = this.revealMore.bind(this);
    this.desktopQuery.addEventListener('change', this.onViewportChange);
    this.mobileQuery.addEventListener('change', this.onViewportChange);
    this.showMore?.addEventListener('click', this.onShowMore);
    this.cancelDeferredInitialization = initializeWhenVisible(this, () => this.refresh());
  }

  disconnectedCallback() {
    this.desktopQuery?.removeEventListener('change', this.onViewportChange);
    this.mobileQuery?.removeEventListener('change', this.onViewportChange);
    this.showMore?.removeEventListener('click', this.onShowMore);
    this.cancelDeferredInitialization?.();
    this.swiper?.destroy(true, true);
    this.swiper = null;
    this.initialized = false;
  }

  get visibleItems() {
    return Array.from(this.scroller?.querySelectorAll('[data-blog-posts-item]') || []).filter((item) => !item.hidden);
  }

  shouldUseCarousel() {
    return this.desktopQuery.matches
      ? this.dataset.enableCarouselDesktop === 'true'
      : this.dataset.enableSwipeMobile === 'true';
  }

  slidesPerView() {
    const desktopColumns = Number.parseFloat(this.dataset.desktopColumns) || 3;
    const mobileColumns = Number.parseFloat(this.dataset.mobileColumns) || 1;
    if (this.desktopQuery.matches) return desktopColumns;
    if (this.mobileQuery.matches) return mobileColumns + (this.visibleItems.length > mobileColumns ? 0.2 : 0);
    return Math.min(desktopColumns, 2);
  }

  refresh() {
    if (!this.carousel || !this.scroller) return;
    const slides = this.visibleItems;
    const perView = this.slidesPerView();
    this.updateMediaCenter();
    const canScroll = this.shouldUseCarousel() && slides.length > Math.ceil(perView);
    this.classList.toggle('is-carousel-scrollable', canScroll);

    if (!canScroll) {
      this.swiper?.destroy(true, true);
      this.swiper = null;
      this.updateNavigation(null);
      return;
    }

    const styles = getComputedStyle(this);
    const desktopGap = Number.parseFloat(styles.getPropertyValue('--blog-posts-column-gap')) || 0;
    const mobileGap = Number.parseFloat(styles.getPropertyValue('--blog-posts-mobile-column-gap')) || 0;
    if (this.swiper) {
      this.swiper.params.slidesPerView = perView;
      this.swiper.params.spaceBetween = this.mobileQuery.matches ? mobileGap : desktopGap;
      this.swiper.update();
      this.updateNavigation(this.swiper);
      return;
    }

    this.swiper = new Swiper(this.carousel, {
      modules: [A11y, Navigation],
      slidesPerView: perView,
      spaceBetween: this.mobileQuery.matches ? mobileGap : desktopGap,
      speed: this.reduceMotion ? 0 : 360,
      watchOverflow: true,
      navigation: { prevEl: this.previous, nextEl: this.next },
      a11y: { enabled: true, slideRole: 'listitem' },
    });
    this.swiper.on('update resize breakpoint slideChange transitionEnd', () => this.updateNavigation(this.swiper));
    this.updateNavigation(this.swiper);
  }

  updateMediaCenter() {
    const media = this.querySelector('.blog-posts__media');
    const panel = this.querySelector('[data-blog-posts-panel]');
    if (!media || !panel) return;
    const panelRect = panel.getBoundingClientRect();
    const mediaRect = media.getBoundingClientRect();
    const center = mediaRect.top - panelRect.top + (mediaRect.height / 2);
    this.style.setProperty('--blog-posts-media-center', `${center}px`);
  }

  updateNavigation(swiper) {
    const total = this.visibleItems.length;
    const visible = swiper
      ? Math.min(Math.max(swiper.slidesPerViewDynamic(), Number(swiper.params.slidesPerView) || 1), total)
      : Math.min(this.slidesPerView(), total);
    const hasOverflow = Boolean(swiper) && total > Math.ceil(visible);
    this.classList.toggle('is-carousel-scrollable', hasOverflow);
    this.classList.add('is-carousel-navigation-ready');
    this.classList.toggle('is-carousel-static', !hasOverflow);
    this.previous && (this.previous.disabled = !hasOverflow);
    this.next && (this.next.disabled = !hasOverflow);

    const footer = this.querySelector('.blog-posts__footer');
    const viewAll = this.querySelector('[data-blog-posts-view-all]');
    if (viewAll) viewAll.hidden = !hasOverflow;
    if (footer) footer.hidden = !hasOverflow && !this.showMore;

    const showing = this.querySelector('[data-blog-posts-showing]');
    if (showing) {
      const configuredTotal = Number.parseInt(showing.dataset.total, 10);
      const totalForCopy = Number.isNaN(configuredTotal) ? total : configuredTotal;
      const current = swiper ? Math.min(totalForCopy, swiper.activeIndex + Math.ceil(visible)) : Math.min(totalForCopy, Math.ceil(visible));
      showing.textContent = `${showing.dataset.showingPrefix || 'Showing'} ${current} ${showing.dataset.showingSeparator || 'of'} ${totalForCopy}`;
    }

    const progress = this.querySelector('[data-blog-posts-progress]');
    const track = progress?.parentElement;
    if (!progress) return;
    track.hidden = !hasOverflow;
    if (!hasOverflow) {
      progress.style.setProperty('--blog-posts-progress', 1);
      return;
    }
    const thumb = Math.min(1, visible / total);
    progress.style.setProperty('--blog-posts-progress', thumb + (swiper.progress * (1 - thumb)));
  }

  revealMore() {
    this.scroller.querySelectorAll('[data-blog-posts-item][hidden]').forEach((item) => item.removeAttribute('hidden'));
    this.showMore?.remove();
    this.showMore = null;
    this.refresh();
    window.ThemeAnimations?.refresh(this);
  }
}

if (!customElements.get('blog-posts-carousel')) customElements.define('blog-posts-carousel', BlogPostsCarousel);
