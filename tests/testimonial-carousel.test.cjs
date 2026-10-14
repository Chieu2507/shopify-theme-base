const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { migrateTestimonialCarousel } = require('../scripts/migrate-testimonial-carousel.cjs');
const read = (file) => fs.readFileSync(file, 'utf8');
const schema = (file) => JSON.parse(read(file).match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);

test('testimonial migration preserves content and ordering and leaves other carousels intact', () => {
  const carousel = { type: 'carousel', settings: { loop: true }, blocks: {
    slideA: { type: 'slide', settings: { gap_desktop: 36 }, blocks: { text: { type: 'text', settings: { text: 'Review' } } } },
    itemB: { type: 'testimonial-item', settings: { direction: 'horizontal' } },
  }, block_order: ['itemB', 'slideA'], disabled: true };
  const original = structuredClone(carousel);
  const document = { sections: {
    reviews: { type: 'testimonial-carousel', blocks: { carousel } },
    gallery: { type: 'gallery-carousel', blocks: { normal: structuredClone(carousel) } },
    background: { type: 'testimonials-background-custom', blocks: { normal: structuredClone(carousel) } },
    horizontal: { type: 'testimonials-horizontal-custom', blocks: { normal: structuredClone(carousel) } },
  } };
  assert.equal(migrateTestimonialCarousel(document), true);
  const expected = structuredClone(original);
  expected.type = '_testimonial-carousel';
  expected.blocks.slideA.type = '_testimonial-slide';
  assert.deepEqual(carousel, expected);
  for (const name of ['gallery', 'background', 'horizontal']) assert.deepEqual(document.sections[name].blocks.normal, original);
  assert.equal(migrateTestimonialCarousel(document), false);
});

test('private testimonial blocks are explicitly allowed by section and carousel schemas', () => {
  const generic = schema('blocks/carousel.liquid');
  assert.ok(!generic.blocks.some((b) => b.type === 'testimonial-item' || b.type.startsWith('_testimonial')));
  const privateCarousel = schema('blocks/_testimonial-carousel.liquid');
  assert.deepEqual(privateCarousel.blocks.map((b) => b.type), ['testimonial-item', '_testimonial-slide']);
  for (const name of ['testimonial-carousel']) {
    const section = schema(`sections/${name}.liquid`);
    assert.ok(section.blocks.some((b) => b.type === '_testimonial-carousel'));
    for (const preset of section.presets) {
      const carousels = preset.blocks.filter((b) => b.type === '_testimonial-carousel');
      assert.ok(carousels.length);
      for (const carousel of carousels) for (const child of carousel.blocks || []) {
        assert.ok(privateCarousel.blocks.some((b) => b.type === child.type), `${name}: ${child.type}`);
      }
    }
  }
});

test('Background and Horizontal recover mistakenly assigned private carousel types', () => {
  const text = { type: 'text', settings: { text: 'Keep this review' } };
  const privateBlock = { type: '_testimonial-carousel', settings: { columns_desktop: '1' }, blocks: {
    slideA: { type: '_testimonial-slide', settings: { alignment: 'center' }, blocks: { text } },
  }, block_order: ['slideA'] };
  for (const type of ['testimonials-background-custom', 'testimonials-horizontal-custom']) {
    const document = { sections: { review: { type, blocks: { carouselA: structuredClone(privateBlock) }, block_order: ['carouselA'] } } };
    assert.equal(migrateTestimonialCarousel(document), true);
    const carousel = document.sections.review.blocks.carouselA;
    assert.equal(carousel.type, 'carousel');
    assert.equal(carousel.blocks.slideA.type, 'slide');
    assert.deepEqual(carousel.settings, privateBlock.settings);
    assert.deepEqual(carousel.blocks.slideA.blocks.text, text);
    assert.deepEqual(carousel.block_order, ['slideA']);
    assert.deepEqual(document.sections.review.block_order, ['carouselA']);
    assert.equal(migrateTestimonialCarousel(document), false);
  }
});

test('reported testimonial presets resolve every referenced block from repository files', () => {
  const visit = (block, parent, file) => {
    assert.ok(fs.existsSync(`blocks/${block.type}.liquid`), `${file}: undefined block type ${block.type}`);
    const allowed = parent.blocks || [];
    assert.ok(allowed.some((entry) => entry.type === block.type)
      || (!block.type.startsWith('_') && allowed.some((entry) => entry.type === '@theme')), `${file}: disallowed ${block.type}`);
    const definition = schema(`blocks/${block.type}.liquid`);
    for (const child of Object.values(block.blocks || {})) visit(child, definition, file);
  };
  for (const name of ['testimonial-carousel', 'testimonials-background-custom', 'testimonials-horizontal-custom']) {
    const file = `sections/${name}.liquid`;
    const definition = schema(file);
    if (name !== 'testimonial-carousel') assert.ok(!read(file).includes('_testimonial-'), file);
    for (const preset of definition.presets) for (const block of Object.values(preset.blocks || {})) visit(block, definition, file);
  }
});

test('generic and testimonial modules initialize and unload independently without duplicate listeners', () => {
  const events = new Map();
  const resize = new Set();
  const creations = [];
  const makeRoot = (selector) => {
    const wrapper = { children: [{ classList: { contains: () => true } }] };
    const viewport = { dataset: {}, querySelector: (s) => s === '.swiper-wrapper' ? wrapper : null };
    return {
      selector, dataset: {}, classList: { toggle() {} }, style: { setProperty(key, value) { this[key] = value; } },
      matches: (s) => s === selector, hasAttribute: () => false, querySelectorAll: () => [],
      querySelector: (s) => s === '[data-swiper-carousel]' ? viewport : s === '.testimonial-item' && selector === '[data-testimonial-carousel]' ? {} : null,
    };
  };
  const normal = makeRoot('[data-carousel-block]');
  const testimonial = makeRoot('[data-testimonial-carousel]');
  const document = {
    readyState: 'loading', querySelectorAll: (selector) => [normal, testimonial].filter((root) => root.matches(selector)),
    addEventListener(name, fn) { if (!events.has(name)) events.set(name, []); events.get(name).push(fn); },
  };
  const context = vm.createContext({ document, window: {
    addEventListener: (name, fn) => resize.add(fn), removeEventListener: (name, fn) => resize.delete(fn),
    getComputedStyle: () => ({ getPropertyValue: () => '36' }),
  }, EffectFade: {}, Pagination: {},
  createSwiperCarousel(viewport) {
    const swiper = { destroyed: false, isLocked: false, params: {}, on() {}, off() {}, update() { this.updates = (this.updates || 0) + 1; } };
    creations.push(swiper); return swiper;
  }, destroySwiperCarousel(swiper) { swiper.destroyed = true; },
  });
  let runtime = read('assets/carousel-runtime.js').replace(/^import .*;\n/gm, '').replace('export const createCarouselRuntime', 'globalThis.createCarouselRuntime');
  vm.runInContext(runtime, context);
  for (const [file, binding] of [['carousel-block', 'normalInit'], ['testimonial-carousel', 'testimonialInit']]) {
    const source = read(`assets/${file}.js`).replace(/^import .*;\n/gm, '').replace('export const initializeThemeModule', `globalThis.${binding}`);
    vm.runInContext(source, context);
  }
  context.normalInit(document);
  assert.equal(creations.length, 1);
  assert.equal(resize.size, 0);
  context.testimonialInit(document);
  assert.equal(creations.length, 2);
  assert.equal(resize.size, 1);
  assert.equal(testimonial.style['--testimonial-controls-gap-half'], '18px');
  context.normalInit(document); context.testimonialInit(document);
  assert.equal(creations.length, 2);
  const fire = (name, target) => events.get(name).forEach((fn) => fn({ target }));
  fire('shopify:section:select', testimonial);
  assert.equal(creations[1].updates, 1);
  assert.equal(creations[0].updates, undefined);
  fire('shopify:section:unload', testimonial);
  assert.equal(creations[1].destroyed, true);
  assert.equal(creations[0].destroyed, false);
  assert.equal(resize.size, 0);
  fire('shopify:section:load', testimonial);
  assert.equal(creations.length, 3);
  assert.equal(resize.size, 1);
});
