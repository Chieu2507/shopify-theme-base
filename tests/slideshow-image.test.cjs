const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadLiquid, stripShopifyMetadata } = require('./helpers/liquid-engine.cjs');

const Liquid = loadLiquid();
const engine = new Liquid();
engine.registerFilter('image_url', (image, ...options) =>
  `/${image.name}?${options.map(([key, value]) => `${key}=${value}`).join('&')}`);
engine.registerFilter('image_tag', (url) => `<img src="${url}">`);
const source = stripShopifyMetadata(fs.readFileSync('snippets/slideshow-image.liquid', 'utf8'));
const image = { name: 'desktop.jpg', aspect_ratio: 1.79, presentation: { focal_point: '50.0% 50.0%' } };
const render = (options) => engine.parseAndRender(source, { image, ...options });

test('fixed-height phone and wide-mobile hints match the picture sources', async () => {
  const picture = await render({ mobile_height: 670 });
  const hints = await render({ mobile_height: 670, preload: true });
  const sources = [...picture.matchAll(/<source[^>]*srcset="([^"]+)"/g)].map(match => match[1]);
  assert.equal(sources.length, 2);
  for (const srcset of sources) assert.ok(hints.includes(`imagesrcset="${srcset}"`));
  assert.ok(sources[0].includes('width=960&amp;height=1340&amp;crop=center 2x'));
  assert.ok(sources[1].includes('width=1536&amp;height=1340&amp;crop=center 2x'));
  assert.ok(hints.includes('media="(min-width: 768px)"'));
});

test('merchant focal points and adapt-height artwork are never center-cropped', async () => {
  for (const options of [
    { mobile_height: 670, mobile_image: { ...image, name: 'focal.jpg', presentation: { focal_point: '75% 25%' } } },
    { mobile_height: 0 },
    { mobile_height: 670, mobile_image: { ...image, aspect_ratio: 0.5 } },
  ]) {
    const html = await render(options);
    assert.ok(!html.includes('crop=center'));
  }
});

test('mobile source falls back to desktop without losing the fixed frame height', async () => {
  const html = await render({ mobile_height: 800 });
  assert.ok(html.includes('/desktop.jpg?width=960&amp;height=1600&amp;crop=center'));
  const distinct = await render({ mobile_height: 670, mobile_image: { ...image, name: 'mobile.jpg' } });
  assert.ok(distinct.includes('/mobile.jpg?width=960&amp;height=1340&amp;crop=center'));
  assert.ok(distinct.includes('<img src="/desktop.jpg?width=2400">'));
  const adapt = await render({ mobile_height: 0 });
  assert.ok(adapt.includes('srcset="/desktop.jpg?width=1200"'));
});
