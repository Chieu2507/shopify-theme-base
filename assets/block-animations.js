/* Shared block entrance lifecycle. Component-owned transforms remain untouched. */
(() => {
  const key = Symbol.for('theme.blockAnimations');
  if (window[key]) return;
  window[key] = true;
  const nodes = new Map();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const enabled = () => document.body.dataset.blockAnimations !== 'false' && !reduced.matches;
  const selector = '[data-block-animation], [data-component-reveal]';
  const cardSelector = '.product-card, .promo-card';
  const listSelector = '[data-product-list-mobile-promos], [data-product-carousel], .product-collection-grid, [data-product-list]';
  const scopeSelector = '[role="tabpanel"], .slideshow__swiper .swiper-slide';
  const active = element => {
    if (!element.isConnected || !element.getClientRects().length) return false;
    if (element.closest('[hidden], [aria-hidden="true"], [inert]')) return false;
    const slide = element.closest('.slideshow__swiper .swiper-slide');
    return !slide || slide.classList.contains('swiper-slide-active');
  };
  const inView = element => {
    // A visible slideshow reveals its active slide as one story beat. Individual
    // content blocks can sit below a short editor viewport and still must play.
    const r = (element.closest('.slideshow') || element).getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const stop = state => {state.animations.forEach(a => a.cancel()); state.animations = [];};
  const show = element => {
    const state = nodes.get(element);
    if (!state || state.played || !active(element)) return;
    state.played = true;
    element.classList.remove('reveal-pending');
    if (!enabled()) return;
    const delay = Math.min(1500, Math.max(150, Number(element.dataset.animationDelay) || 0));
    const tokens = getComputedStyle(element);
    const duration = Math.max(650, parseFloat(tokens.getPropertyValue('--motion-duration-slow')) || 600);
    const options = {duration, delay, easing:tokens.getPropertyValue('--motion-ease-standard').trim() || 'cubic-bezier(.22,1,.36,1)', fill:'backwards'};
    const type = element.dataset.blockAnimation || 'slide-bottom';
    const from = {opacity:0};
    if (type === 'scale') from.transform = 'scale(.94)';
    if (type === 'slide-left') from.transform = 'translateX(-24px)';
    if (type === 'slide-right') from.transform = 'translateX(24px)';
    if (type === 'slide-bottom') from.transform = 'translateY(24px)';
    if (type === 'rotate-words') {
      element.querySelectorAll('.reveal-word').forEach((word, index) => {
        state.animations.push(word.animate([{opacity:0,transform:'translateY(.7em) rotateX(45deg)'},{opacity:1,transform:'none'}], {...options,delay:delay + index * 35}));
      });
    } else state.animations.push(element.animate([from,{opacity:1,transform:'none'}],options));
    // No forwards fill: release the opacity/transform layer, especially for backdrop blur.
    state.animations.forEach(animation => animation.finished.then(() => animation.cancel()).catch(() => {}));
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {if (entry.isIntersecting) show(entry.target);});
  }, {threshold:0.05, rootMargin:'0px 0px -40px 0px'});
  const splitWords = element => {
    if (element.querySelector('.reveal-word')) return;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim() && !walker.currentNode.parentElement.closest('svg,script,style')) texts.push(walker.currentNode);
    texts.forEach(text => {
      const fragment = document.createDocumentFragment();
      text.textContent.split(/(\s+)/).filter(Boolean).forEach(part => {
        if (/^\s+$/.test(part)) fragment.append(document.createTextNode(part));
        else {const span = document.createElement('span');span.className='reveal-word';span.textContent=part;fragment.append(span);}
      });
      text.replaceWith(fragment);
    });
  };
  const initialize = element => {
    // The stack controller owns media motion. Inert back cards are still visible.
    if (element.closest('[data-multi-image]')) {
      const state = nodes.get(element);
      if (state) {stop(state);observer.unobserve(element);nodes.delete(element);}
      element.classList.remove('reveal-pending');
      return;
    }
    const previous = nodes.get(element);
    const configuration = `${element.dataset.blockAnimation}:${element.dataset.animationDelay}`;
    // Explicitly animated parents own the entrance; avoid nested double transforms.
    const parent = element.parentElement?.closest('[data-block-animation]:not([data-block-animation="none"]),[data-component-reveal]');
    if (element.dataset.blockAnimation === 'none' || (parent && parent.dataset.blockAnimation !== 'none')) {
      if (previous) {stop(previous);observer.unobserve(element);nodes.delete(element);}
      element.classList.remove('reveal-pending');
      return;
    }
    if (previous?.configuration === configuration) return;
    if (previous) {stop(previous);observer.unobserve(element);nodes.delete(element);}
    if (element.dataset.blockAnimation === 'rotate-words') splitWords(element);
    nodes.set(element,{played:false,animations:[],configuration});
    if (enabled()) element.classList.add('reveal-pending');
    observer.observe(element);
    if (!enabled() || (active(element) && inView(element))) show(element);
  };
  const scan = (root = document) => {
    const cards = root.querySelectorAll?.(cardSelector) || [];
    cards.forEach(card => {
      if (card.closest('.slideshow, .announcement-bar, dialog')) return;
      card.dataset.componentReveal = '';
      if (!card.dataset.blockAnimation) card.dataset.blockAnimation = card.matches('article.testimonial-item') ? 'fade' : 'slide-bottom';
      const list = card.closest(listSelector);
      if (list) {
        const siblings = [...list.querySelectorAll(cardSelector)].filter(e => e.closest(listSelector) === list);
        // Stagger within the visible row; later rows must not inherit a long list-wide wait.
        // Measure the layout item so an in-flight card transform cannot change its row.
        const rowTop = element => (element.closest('.product-collection-grid__item') || element).getBoundingClientRect().top;
        const top = rowTop(card);
        const row = siblings.filter(sibling => Math.abs(rowTop(sibling) - top) < 8);
        card.dataset.animationDelay = String(Math.min(600, 180 + Math.max(0, row.indexOf(card)) * 140));
      }
    });
    if (root.matches?.(selector)) initialize(root);
    root.querySelectorAll?.(selector).forEach(initialize);
  };
  const resetScope = root => {
    nodes.forEach((state, element) => {
      if (!root.contains(element)) return;
      stop(state);state.played = false;
      if (enabled()) element.classList.add('reveal-pending');
      if (active(element) && inView(element)) show(element);
    });
  };
  const mutations = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'childList') record.addedNodes.forEach(node => {if (node instanceof Element) scan(node);});
      else if (record.attributeName === 'data-block-animation' || record.attributeName === 'data-animation-delay') {
        initialize(record.target);
        record.target.querySelectorAll(selector).forEach(initialize);
      }
      else if (record.target.matches?.(scopeSelector)) {
        // Deactivation arms this scope. Subsequent activation replays its own contents.
        if (!active(record.target)) resetScope(record.target);
        else {
          // Hidden tab panels have no row geometry until activation.
          if (record.target.matches('[role="tabpanel"]')) scan(record.target);
          nodes.forEach((state, element) => {if (record.target.contains(element) && !state.played && inView(element)) show(element);});
        }
      }
    });
    nodes.forEach((state, element) => {if (!element.isConnected) {stop(state);observer.unobserve(element);nodes.delete(element);}});
  });
  scan();
  mutations.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','aria-hidden','inert','class','data-block-animation','data-animation-delay']});
  document.addEventListener('shopify:section:load',event => scan(event.target));
  // Reconcile after all Item accessibility and visibility changes are complete.
  document.addEventListener('multiple-images-text:change',event => {
    scan(event.target);
    nodes.forEach((state, element) => {
      const item = element.closest('[data-multi-item]');
      if (!item || !event.target.contains(item)) return;
      if (event.detail.previous !== event.detail.index || !active(element)) {
        stop(state);state.played = false;
        element.classList.toggle('reveal-pending', enabled());
      }
      if (active(element) && inView(element)) show(element);
    });
  });
  document.addEventListener('shopify:block:select',event => {
    requestAnimationFrame(() => nodes.forEach((state, element) => {
      if (event.target.contains(element) || element.contains(event.target)) {
        stop(state);state.played = true;element.classList.remove('reveal-pending');
      }
    }));
  });
  document.addEventListener('focusin',event => {
    const element = event.target.closest('.reveal-pending');
    if (element) show(element);
  });
  reduced.addEventListener('change',() => nodes.forEach((state,element) => {
    stop(state);state.played = true;element.classList.remove('reveal-pending');
  }));
})();
