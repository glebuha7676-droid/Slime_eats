const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const tracked = new Set(execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8').split('\0').filter(Boolean));
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const refs = [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)]
  .map(match => match[1].split('?')[0])
  .filter(ref => ref && !ref.startsWith('data:') && !ref.startsWith('/'));
const missing = refs.filter(ref => !tracked.has(ref));
assert.deepEqual(missing, [], `Page references files missing from Git: ${missing.join(', ')}`);
const sourceFiles = ['index.html', ...refs.filter(ref => /\.(?:js|css)$/.test(ref))];
const literalAssets = new Set();
for (const source of sourceFiles) {
  const body = fs.readFileSync(path.join(root, source), 'utf8');
  for (const match of body.matchAll(/(?:assets|effects-lab\/assets)\/[^'"`\s)]+?\.(?:png|webp|svg|jpe?g|gif)/g)) {
    if (!match[0].includes('$') && !match[0].includes('{')) literalAssets.add(match[0]);
  }
}
const missingAssets = [...literalAssets].filter(ref => !tracked.has(ref));
assert.deepEqual(missingAssets, [], `Game references assets missing from Git: ${missingAssets.join(', ')}`);
console.log(`Published page assets: ${refs.length} page files and ${literalAssets.size} images are tracked.`);
