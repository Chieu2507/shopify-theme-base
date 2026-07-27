#!/usr/bin/env node

import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [command, preset, ...files] = process.argv.slice(2);

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error(`Usage:
  node scripts/preset-state.mjs hydrate <preset>
  node scripts/preset-state.mjs capture <preset> <templates/*.json|sections/*.json> [...files]
  node scripts/preset-state.mjs capture-settings <preset>
  node scripts/preset-state.mjs diff <preset> <templates/*.json|sections/*.json> [...files]`);
  process.exitCode = 1;
}

function validatePreset(value) {
  if (!value || !/^[a-z0-9-]+$/.test(value)) {
    usage('Preset must use lowercase letters, numbers, and hyphens only.');
    return false;
  }
  return true;
}

function validateThemeJsonPath(relativePath) {
  const normalized = path.posix.normalize(relativePath.replaceAll('\\', '/'));
  if (!normalized.endsWith('.json') || !(normalized.startsWith('templates/') || normalized.startsWith('sections/'))) {
    usage(`Unsupported path: ${relativePath}`);
    return null;
  }
  return normalized;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

async function readJsonc(filePath) {
  const source = await readFile(filePath, 'utf8');
  const header = source.match(/^\/\*[\s\S]*?\*\/\s*/)?.[0] ?? '';
  return { header, data: JSON.parse(source.slice(header.length)) };
}

function matchingPresetKey(data, presetName) {
  const key = Object.keys(data.presets ?? {}).find((name) => name.toLowerCase() === presetName.toLowerCase());
  if (!key) throw new Error(`No named preset matching "${presetName}" exists in config/settings_data.json.`);
  return key;
}

async function setCurrentPreset(presetName) {
  const settingsPath = path.join(repositoryRoot, 'config', 'settings_data.json');
  const { header, data } = await readJsonc(settingsPath);
  const matchingPreset = matchingPresetKey(data, presetName);
  data.current = structuredClone(data.presets[matchingPreset]);
  await writeFile(settingsPath, `${header}${JSON.stringify(data, null, 2)}\n`);
  return matchingPreset;
}

async function hydrate(presetName) {
  const listingRoot = path.join(repositoryRoot, 'listings', presetName);
  if (!existsSync(listingRoot)) throw new Error(`Listing directory not found: listings/${presetName}`);

  let copied = 0;
  for (const directory of ['templates', 'sections']) {
    const sourceDirectory = path.join(listingRoot, directory);
    if (!existsSync(sourceDirectory)) continue;
    for (const sourceFile of await walk(sourceDirectory)) {
      if (!sourceFile.endsWith('.json')) continue;
      const relativePath = path.relative(listingRoot, sourceFile);
      const destination = path.join(repositoryRoot, relativePath);
      await mkdir(path.dirname(destination), { recursive: true });
      await cp(sourceFile, destination);
      copied += 1;
    }
  }

  const settingsPreset = await setCurrentPreset(presetName);
  console.log(`Hydrated ${presetName}: ${copied} JSON file(s); current settings now use ${settingsPreset}.`);
}

async function capture(presetName, paths) {
  if (!paths.length) return usage('Specify at least one template or section JSON file to capture.');
  let copied = 0;
  for (const file of paths) {
    const relativePath = validateThemeJsonPath(file);
    if (!relativePath) return;
    const source = path.join(repositoryRoot, relativePath);
    if (!existsSync(source)) throw new Error(`Source file not found: ${relativePath}`);
    const destination = path.join(repositoryRoot, 'listings', presetName, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination);
    copied += 1;
  }
  console.log(`Captured ${copied} JSON file(s) into listings/${presetName}.`);
}

async function captureSettings(presetName) {
  const settingsPath = path.join(repositoryRoot, 'config', 'settings_data.json');
  const { header, data } = await readJsonc(settingsPath);
  const settingsPreset = matchingPresetKey(data, presetName);
  data.presets[settingsPreset] = structuredClone(data.current);
  await writeFile(settingsPath, `${header}${JSON.stringify(data, null, 2)}\n`);
  console.log(`Captured current settings into presets.${settingsPreset}.`);
}

async function diff(presetName, paths) {
  if (!paths.length) return usage('Specify at least one template or section JSON file to compare.');
  let differs = false;
  for (const file of paths) {
    const relativePath = validateThemeJsonPath(file);
    if (!relativePath) return;
    const rootPath = path.join(repositoryRoot, relativePath);
    const listingPath = path.join(repositoryRoot, 'listings', presetName, relativePath);
    if (!existsSync(rootPath) || !existsSync(listingPath)) {
      console.log(`${relativePath}: missing`);
      differs = true;
      continue;
    }
    const [root, listing] = await Promise.all([readFile(rootPath), readFile(listingPath)]);
    const state = root.equals(listing) ? 'same' : 'different';
    console.log(`${relativePath}: ${state}`);
    differs ||= state === 'different';
  }
  if (differs) process.exitCode = 1;
}

try {
  if (!validatePreset(preset)) process.exit();
  if (command === 'hydrate') await hydrate(preset);
  else if (command === 'capture') await capture(preset, files);
  else if (command === 'capture-settings') await captureSettings(preset);
  else if (command === 'diff') await diff(preset, files);
  else usage('Choose hydrate, capture, capture-settings, or diff.');
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
