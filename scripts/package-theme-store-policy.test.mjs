import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  collectForbiddenThemeResources,
  extractLiquidSchemas,
  isMenuSettingKey,
  isStoreSpecificResourceLink,
  sanitizeThemeValue,
} from './package-theme-store-policy.mjs';

const storeSpecificLinks = [
  'shopify://collections/under-201',
  'shopify://collections/best-sellers',
  'shopify://products/demo-product',
  '/pages/faq',
  '/collections/new-arrivals',
];

const portableLinks = [
  '',
  '#details',
  'https://example.com/collections/example',
  '/collections',
  '/collections/',
  '/collections/all',
  '/collections/all/?sort_by=best-selling#products',
  'shopify://collections',
  'shopify://collections/',
  'shopify://collections/all',
  'shopify://collections/all?sort_by=best-selling',
];

test('classifies source-store resource destinations independently of their setting ID', () => {
  storeSpecificLinks.forEach((value) => assert.equal(isStoreSpecificResourceLink(value), true, value));
  portableLinks.forEach((value) => assert.equal(isStoreSpecificResourceLink(value), false, value));
});

test('sanitizes nested resources while retaining portable routes and standard menus', () => {
  const replacements = [];
  const source = {
    arbitrary_link_name: storeSpecificLinks[0],
    deeply: {
      promotion_2_link: storeSpecificLinks[1],
      safe_catalog: portableLinks[5],
    },
    menu: 'main-menu',
    footer: { menu: 'footer' },
    account: { menu: 'customer-account-main-menu' },
    customer_account_menu: 'customer-account-main-menu',
    legal_menu: 'footer',
    demo_menu: 'footer-shop',
    menu_item: 'footer-shop',
    size_chart_page: 'size-chart',
    complementary_products: ['gid://shopify/Product/123'],
  };

  const rawFindings = collectForbiddenThemeResources(source);
  assert.equal(rawFindings.some((finding) => finding.includes('size_chart_page=size-chart')), true);
  assert.equal(rawFindings.some((finding) => finding.includes('complementary_products has 1 entries')), true);

  const sanitized = sanitizeThemeValue(source, '', (type) => replacements.push(type));

  assert.equal(sanitized.arbitrary_link_name, '');
  assert.equal(sanitized.deeply.promotion_2_link, '');
  assert.equal(sanitized.deeply.safe_catalog, '/collections/all');
  assert.equal(sanitized.menu, 'main-menu');
  assert.equal(sanitized.footer.menu, 'footer');
  assert.equal(sanitized.account.menu, 'customer-account-main-menu');
  assert.equal(sanitized.customer_account_menu, 'customer-account-main-menu');
  assert.equal(sanitized.legal_menu, 'footer');
  assert.equal(sanitized.demo_menu, '');
  assert.equal(sanitized.menu_item, 'footer-shop');
  assert.equal(sanitized.size_chart_page, '');
  assert.deepEqual(sanitized.complementary_products, []);
  assert.deepEqual(replacements.sort(), ['demoMenus', 'resourceLinks', 'resourceLinks', 'resourceLists', 'singularResources']);
  assert.deepEqual(collectForbiddenThemeResources(sanitized), []);
});

test('detects menu setting keys without treating menu item content as a menu selector', () => {
  ['menu', 'customer_account_menu', 'legal_menu'].forEach((key) => assert.equal(isMenuSettingKey(key), true, key));
  ['menu_item', 'submenu_label', 'main_menu_heading'].forEach((key) => assert.equal(isMenuSettingKey(key), false, key));
});

test('sanitizes every supported source-store URL form', () => {
  const source = Object.fromEntries(storeSpecificLinks.map((value, index) => [`custom_${index}`, value]));
  const sanitized = sanitizeThemeValue(source);
  Object.values(sanitized).forEach((value) => assert.equal(value, ''));
  assert.deepEqual(collectForbiddenThemeResources(sanitized), []);
});

test('actual header group loses demo resources without changing announcement state', async () => {
  const raw = await readFile(new URL('../sections/header-group.json', import.meta.url), 'utf8');
  const source = JSON.parse(raw.replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  const sanitized = sanitizeThemeValue(source);
  const announcement = sanitized.sections.announcement_bar;
  const megaMenu = sanitized.sections.header.blocks.collection_mega_menu.settings;

  assert.ok(announcement);
  assert.equal(Object.hasOwn(announcement, 'disabled'), false);
  assert.equal(announcement.settings.enable_rotation, source.sections.announcement_bar.settings.enable_rotation);
  assert.equal(sanitized.sections.header.settings.menu, 'main-menu');
  assert.equal(sanitized.sections.header.settings.customer_account_menu, 'customer-account-main-menu');
  assert.equal(megaMenu.promotion_1_link, '');
  assert.equal(megaMenu.promotion_2_link, '');
  assert.deepEqual(collectForbiddenThemeResources(sanitized), []);
});

test('actual section schemas contain no source-store resource defaults after sanitization', async () => {
  const headerSource = await readFile(new URL('../sections/header.liquid', import.meta.url), 'utf8');
  const headerSchemas = extractLiquidSchemas(headerSource, 'sections/header.liquid');
  assert.equal(headerSchemas.length, 1);
  assert.deepEqual(collectForbiddenThemeResources(sanitizeThemeValue(headerSchemas[0])), []);
});

test('actual portable collection routes survive while product demo page routes are removed', async () => {
  const [overlayRaw, productRaw] = await Promise.all([
    readFile(new URL('../sections/overlay-group.json', import.meta.url), 'utf8'),
    readFile(new URL('../templates/product.json', import.meta.url), 'utf8'),
  ]);
  const overlay = JSON.parse(overlayRaw.replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  const product = JSON.parse(productRaw.replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  const sanitizedOverlay = sanitizeThemeValue(overlay);
  const sanitizedProduct = sanitizeThemeValue(product);

  assert.equal(JSON.stringify(sanitizedOverlay).includes('shopify://collections/all'), true);
  assert.equal(JSON.stringify(sanitizedProduct).includes('/pages/faq'), false);
  assert.equal(product.sections.main.blocks.details.blocks.options.settings.size_chart_page, 'size-chart');
  assert.equal(sanitizedProduct.sections.main.blocks.details.blocks.options.settings.size_chart_page, '');
  assert.equal(collectForbiddenThemeResources(product).some((finding) => finding.includes('size_chart_page=size-chart')), true);
  assert.deepEqual(collectForbiddenThemeResources(sanitizedOverlay), []);
  assert.deepEqual(collectForbiddenThemeResources(sanitizedProduct), []);
});
