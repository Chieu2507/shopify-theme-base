import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const themeRoot = resolve(scriptDirectory, '..');
const themeDirectories = ['assets', 'blocks', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
const singularResourceKeys = new Set([
  'article',
  'blog',
  'collection',
  'fallback_collection',
  'page',
  'product',
  'result_collection',
  'video',
]);
const listResourceKeys = new Set([
  'collections',
  'fallback_products',
  'products',
  'result_products',
]);
const allowedMenuHandles = new Set(['main-menu']);
const demoResourceLinkPattern = /^shopify:\/\/(articles|blogs|collections|pages|products)(?:\/.*)?$/;
const args = process.argv.slice(2);

function readArgument(name, fallback) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return value;
}

const outputPath = resolve(themeRoot, readArgument('--output', 'release/spinel-theme-store.zip'));
const reportPath = outputPath.replace(/\.zip$/i, '') + '.report.json';
const skipThemeCheck = args.includes('--skip-theme-check');

if (extname(outputPath).toLowerCase() !== '.zip') {
  throw new Error('The package output must use a .zip extension.');
}

const report = {
  generatedAt: new Date().toISOString(),
  source: relative(themeRoot, themeRoot) || '.',
  output: relative(themeRoot, outputPath),
  copiedDirectories: themeDirectories,
  replacements: {
    shopImages: 0,
    singularResources: 0,
    resourceLists: 0,
    demoMenus: 0,
    resourceLinks: 0,
    faviconFallback: 0,
    demoAssets: 0,
  },
  files: {},
  checks: {
    themeCheck: skipThemeCheck ? 'skipped' : 'pending',
    forbiddenResources: 'pending',
    zipStructure: 'pending',
  },
};

function recordReplacement(file, type) {
  report.replacements[type] += 1;
  report.files[file] ??= {};
  report.files[file][type] = (report.files[file][type] || 0) + 1;
}

function sanitizeValue(value, key, file, pathParts = []) {
  if (typeof value === 'string') {
    if (value.startsWith('shopify://shop_images/')) {
      recordReplacement(file, 'shopImages');
      return '';
    }
    if (singularResourceKeys.has(key) && value !== '') {
      recordReplacement(file, 'singularResources');
      return '';
    }
    if (key === 'menu' && value !== '' && !allowedMenuHandles.has(value)) {
      recordReplacement(file, 'demoMenus');
      return '';
    }
    if (key === 'link' && demoResourceLinkPattern.test(value)) {
      recordReplacement(file, 'resourceLinks');
      return '';
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (listResourceKeys.has(key) && value.length > 0) {
      recordReplacement(file, 'resourceLists');
      return [];
    }
    return value.map((item, index) => sanitizeValue(item, String(index), file, [...pathParts, String(index)]));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeValue(childValue, childKey, file, [...pathParts, childKey]),
      ]),
    );
  }

  return value;
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(fullPath));
    else files.push(fullPath);
  }
  return files;
}

async function sanitizeJsonFile(filePath, stagingRoot) {
  const file = relative(stagingRoot, filePath);
  const raw = await readFile(filePath, 'utf8');
  const json = JSON.parse(raw.replace(/^\s*\/\*[\s\S]*?\*\//, ''));
  const sanitized = sanitizeValue(json, '', file);
  await writeFile(filePath, JSON.stringify(sanitized, null, 2) + '\n');
}

async function sanitizeJsonResources(stagingRoot) {
  for (const file of await resourceJsonFiles(stagingRoot)) {
    await sanitizeJsonFile(file, stagingRoot);
  }
}

async function resourceJsonFiles(stagingRoot) {
  const templateFiles = (await listFiles(join(stagingRoot, 'templates'))).filter((file) => extname(file) === '.json');
  const sectionGroupFiles = (await listFiles(join(stagingRoot, 'sections'))).filter((file) => file.endsWith('-group.json'));
  return [...templateFiles, ...sectionGroupFiles, join(stagingRoot, 'config', 'settings_data.json')];
}

async function sanitizeDemoFavicon(stagingRoot) {
  const layoutPath = join(stagingRoot, 'layout', 'theme.liquid');
  const file = relative(stagingRoot, layoutPath);
  const source = await readFile(layoutPath, 'utf8');
  const fallback = `    {% if settings.favicon != blank %}
      <link rel="icon" type="image/png" href="{{ settings.favicon | image_url: width: 32, height: 32 }}">
    {% else %}
      <link rel="icon" type="image/png" href="{{ 'spinel-favicon.png' | asset_url }}">
    {% endif %}`;
  const replacement = `    {% if settings.favicon != blank %}
      <link rel="icon" type="image/png" href="{{ settings.favicon | image_url: width: 32, height: 32 }}">
    {% endif %}`;
  if (source.includes(fallback)) {
    await writeFile(layoutPath, source.replace(fallback, replacement));
    recordReplacement(file, 'faviconFallback');
  }

  const assetPath = join(stagingRoot, 'assets', 'spinel-favicon.png');
  if (existsSync(assetPath)) {
    await rm(assetPath);
    recordReplacement(relative(stagingRoot, assetPath), 'demoAssets');
  }
}

function collectForbiddenResources(value, key, location, findings) {
  if (typeof value === 'string') {
    if (value.startsWith('shopify://shop_images/')) findings.push(`${location}: ${value}`);
    if (singularResourceKeys.has(key) && value !== '') findings.push(`${location}: ${key}=${value}`);
    if (key === 'menu' && value !== '' && !allowedMenuHandles.has(value)) findings.push(`${location}: menu=${value}`);
    if (key === 'link' && demoResourceLinkPattern.test(value)) findings.push(`${location}: link=${value}`);
    return;
  }
  if (Array.isArray(value)) {
    if (listResourceKeys.has(key) && value.length > 0) findings.push(`${location}: ${key} has ${value.length} entries`);
    value.forEach((item, index) => collectForbiddenResources(item, String(index), `${location}[${index}]`, findings));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => {
      collectForbiddenResources(childValue, childKey, `${location}.${childKey}`, findings);
    });
  }
}

async function verifyStaging(stagingRoot) {
  const findings = [];
  const allFiles = await listFiles(stagingRoot);
  for (const filePath of await resourceJsonFiles(stagingRoot)) {
    const file = relative(stagingRoot, filePath);
    const json = JSON.parse((await readFile(filePath, 'utf8')).replace(/^\s*\/\*[\s\S]*?\*\//, ''));
    collectForbiddenResources(json, '', file, findings);
  }
  for (const filePath of allFiles) {
    const file = relative(stagingRoot, filePath);
    const content = await readFile(filePath);
    if (content.includes(Buffer.from('shopify://shop_images/'))) findings.push(`${file}: contains shopify://shop_images`);
    if (content.includes(Buffer.from('spinel-favicon.png'))) findings.push(`${file}: contains spinel-favicon.png`);
  }
  if (findings.length) throw new Error(`Forbidden demo resources remain:\n${findings.join('\n')}`);
  report.checks.forbiddenResources = 'passed';
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', ...options });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} exited with status ${result.status}`);
}

async function createPackage(stagingRoot) {
  if (!skipThemeCheck) {
    run('shopify', ['theme', 'check', '--path', stagingRoot], { stdio: 'inherit' });
    report.checks.themeCheck = 'passed';
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await rm(outputPath, { force: true });
  run('zip', ['-qr', outputPath, ...themeDirectories], { cwd: stagingRoot });

  const zipList = spawnSync('unzip', ['-Z1', outputPath], { encoding: 'utf8' });
  if (zipList.status !== 0) throw new Error('Unable to inspect generated ZIP structure.');
  const entries = zipList.stdout.trim().split('\n').filter(Boolean);
  const unexpected = entries.filter((entry) => !themeDirectories.some((directory) => entry === `${directory}/` || entry.startsWith(`${directory}/`)));
  if (unexpected.length) throw new Error(`Unexpected ZIP entries:\n${unexpected.join('\n')}`);
  report.checks.zipStructure = 'passed';

  const zipBuffer = await readFile(outputPath);
  report.bytes = (await stat(outputPath)).size;
  report.sha256 = createHash('sha256').update(zipBuffer).digest('hex');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
}

const stagingParent = await mkdtemp(join(tmpdir(), 'spinel-theme-store-'));
const stagingRoot = join(stagingParent, 'theme');

try {
  await mkdir(stagingRoot);
  for (const directory of themeDirectories) {
    await cp(join(themeRoot, directory), join(stagingRoot, directory), { recursive: true });
  }
  await sanitizeJsonResources(stagingRoot);
  await sanitizeDemoFavicon(stagingRoot);
  await verifyStaging(stagingRoot);
  await createPackage(stagingRoot);
  process.stdout.write(`Theme Store package: ${outputPath}\n`);
  process.stdout.write(`Package report: ${reportPath}\n`);
  process.stdout.write(`SHA-256: ${report.sha256}\n`);
} finally {
  await rm(stagingParent, { recursive: true, force: true });
}
