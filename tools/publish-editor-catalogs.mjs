import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , foodInput, worldsInput] = process.argv;
if (!foodInput || !worldsInput) {
  console.error('Usage: node tools/publish-editor-catalogs.mjs <food.json> <worlds.json>');
  process.exit(1);
}

const readJson = file => JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const food = readJson(foodInput);
const worlds = readJson(worldsInput);
if (!Array.isArray(food) || !food.length) throw new Error('Food export must be a non-empty array.');
if (!Array.isArray(worlds?.worlds) || !worlds.worlds.length) throw new Error('World export must contain worlds.');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.writeFileSync(path.join(root, 'published', 'food.js'), `window.SLIME_PUBLISHED_FOOD_CATALOG = ${JSON.stringify(food, null, 2)};\n`);
fs.writeFileSync(path.join(root, 'published', 'worlds.js'), `window.SLIME_PUBLISHED_WORLD_CATALOG = ${JSON.stringify(worlds, null, 2)};\n`);
console.log('Published catalogs updated. Bump their query versions in HTML before deployment.');
