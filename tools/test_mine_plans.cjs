const assert = require('node:assert/strict');
const path = require('node:path');
const store = new Map();
global.window = global;
global.location = { pathname: '/tools/generation/index.html' };
global.localStorage = {
  getItem: key => store.get(key) || null,
  setItem: (key, value) => store.set(key, value),
  removeItem: key => store.delete(key)
};
global.CustomEvent = class { constructor(name) { this.type = name; } };
global.dispatchEvent = () => {};
const root = path.resolve(__dirname, '..');
require(path.join(root, 'js/generation/section-catalog.js'));
require(path.join(root, 'js/generation/section-catalog-v4.js'));
require(path.join(root, 'js/generation/mine-plans.js'));
const sections = window.SlimeSectionCatalog;
const plans = window.SlimeMinePlans;
assert.equal(plans.flasks({ cells: ['12...3'] }), 9);
assert.deepEqual([0, 1, 2, 3].map(plans.modeForFailures), ['normal', 'normal', 'easy', 'easy']);
assert.equal(plans.nextFailureStreak(plans.nextFailureStreak(0, false), false), 2);
assert.equal(plans.nextFailureStreak(2, true), 0);
for (const worldId of [1, 2, 3, 4]) for (const mode of ['normal', 'easy']) {
  const plan = plans.all(worldId, mode)[0];
  const check = plans.inspect(plan, sections.all());
  const expectedRows = worldId === 1 ? 70 : 140;
  assert.equal(plan.bands.length, plans.bandCountForWorld(worldId));
  assert.equal(check.rows, expectedRows);
  assert.deepEqual(check.issues, []);
  const rows = sections.buildPlan(worldId, 5, expectedRows, () => .2, mode);
  assert.equal(rows.length, expectedRows);
  assert.equal(rows[0].category, 'start');
  assert.equal(rows.at(-1).category, 'end');
  assert.ok(rows.every(row => row.cells.length === 6));
  assert.ok(check.minimum >= 0 && check.maximum >= check.minimum);
}
const original = plans.all(1, 'normal')[0];
const legacyBands = Array.from({ length: 20 }, (_, index) => plans.makeBand('full', [index === 0 ? 'start' : index === 19 ? 'end' : 'neutral']));
const migrated = plans.normalize({ worldId: 1, bands: legacyBands });
assert.equal(migrated.bands.length, 10, 'older world 1 route is shortened');
assert.equal(migrated.bands.at(-1).slots[0].category, 'end', 'older route keeps its final portal');
const custom = plans.create({ ...original, name: 'Тестовый маршрут' });
assert.equal(plans.all(1, 'normal').length, 2);
custom.bands[2].slots[0].category = 'special';
plans.update(custom);
assert.equal(plans.all(1, 'normal').find(item => item.id === custom.id).bands[2].slots[0].category, 'special');
plans.remove(custom.id);
assert.equal(plans.all(1, 'normal').length, 1);
console.log('Legacy mine-plan editor checks passed (runtime World 1 now uses the separate 105-row descent generator).');
