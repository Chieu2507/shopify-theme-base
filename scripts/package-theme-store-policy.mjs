const singularResourceKeys = new Set([
  'article',
  'blog',
  'collection',
  'fallback_collection',
  'page',
  'product',
  'result_collection',
  'size_chart_page',
  'video',
]);

const listResourceKeys = new Set([
  'collections',
  'complementary_products',
  'fallback_products',
  'products',
  'result_products',
]);

const allowedMenuHandles = new Set([
  'customer-account-main-menu',
  'footer',
  'main-menu',
]);

const portableResourceLinks = new Set([
  '/collections',
  '/collections/all',
  'shopify://collections',
  'shopify://collections/all',
]);

const storeSpecificResourceLinkPattern = /^(?:shopify:\/\/|\/)(?:articles|blogs|collections|pages|products)\/.+$/;
const menuSettingKeyPattern = /(?:^|_)menu$/;

function normalizedResourceLink(value) {
  const path = value.split(/[?#]/, 1)[0];
  if (path === '/') return path;
  return path.replace(/\/+$/, '');
}

export function isStoreSpecificResourceLink(value) {
  if (typeof value !== 'string') return false;
  const path = normalizedResourceLink(value);
  return !portableResourceLinks.has(path) && storeSpecificResourceLinkPattern.test(path);
}

export function isMenuSettingKey(key) {
  return typeof key === 'string' && menuSettingKeyPattern.test(key);
}

export function extractLiquidSchemas(source, location = 'liquid') {
  if (typeof source !== 'string') return [];

  return [...source.matchAll(/{%\s*schema\s*%}([\s\S]*?){%\s*endschema\s*%}/g)].map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(`Invalid schema JSON in ${location}#schema[${index + 1}]: ${error.message}`);
    }
  });
}

export function sanitizeThemeValue(value, key = '', recordReplacement = () => {}) {
  if (typeof value === 'string') {
    if (value.startsWith('shopify://shop_images/')) {
      recordReplacement('shopImages');
      return '';
    }
    if (singularResourceKeys.has(key) && value !== '') {
      recordReplacement('singularResources');
      return '';
    }
    if (isMenuSettingKey(key) && value !== '' && !allowedMenuHandles.has(value)) {
      recordReplacement('demoMenus');
      return '';
    }
    if (isStoreSpecificResourceLink(value)) {
      recordReplacement('resourceLinks');
      return '';
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (listResourceKeys.has(key) && value.length > 0) {
      recordReplacement('resourceLists');
      return [];
    }
    return value.map((item, index) => sanitizeThemeValue(item, String(index), recordReplacement));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeThemeValue(childValue, childKey, recordReplacement),
      ]),
    );
  }

  return value;
}

export function collectForbiddenThemeResources(value, key = '', location = 'root', findings = []) {
  if (typeof value === 'string') {
    if (value.startsWith('shopify://shop_images/')) findings.push(`${location}: ${value}`);
    if (singularResourceKeys.has(key) && value !== '') findings.push(`${location}: ${key}=${value}`);
    if (isMenuSettingKey(key) && value !== '' && !allowedMenuHandles.has(value)) findings.push(`${location}: ${key}=${value}`);
    if (isStoreSpecificResourceLink(value)) findings.push(`${location}: ${key || 'value'}=${value}`);
    return findings;
  }

  if (Array.isArray(value)) {
    if (listResourceKeys.has(key) && value.length > 0) findings.push(`${location}: ${key} has ${value.length} entries`);
    value.forEach((item, index) => {
      collectForbiddenThemeResources(item, String(index), `${location}[${index}]`, findings);
    });
    return findings;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => {
      collectForbiddenThemeResources(childValue, childKey, `${location}.${childKey}`, findings);
    });
  }

  return findings;
}
