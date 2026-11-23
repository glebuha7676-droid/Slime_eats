const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('js/rendering/techno-feedback.js', 'utf8'), context);

const { minePoint } = context.window.SlimeTechnoFeedback;
const mine = { fromX: 20, fromY: 40, toX: 200, toY: 260, bend: 70, side: 1 };
assert.equal(minePoint(mine, 0).x, 20);
assert.equal(minePoint(mine, 0).y, 40);
assert.equal(minePoint(mine, 1).x, 200);
assert.equal(minePoint(mine, 1).y, 260);
assert.ok(minePoint(mine, .15).y < 40, 'A shield mine first exits upward in a visible arc');

// Drone targeting stays within indexed nearby rows.
const abilities = fs.readFileSync('js/abilities/techno-ultimates.js', 'utf8');
assert.match(abilities, /services\.blocksNearY\(/);
assert.doesNotMatch(abilities, /run\.blocks\.filter/);
console.log('Techno: indexed drone targeting and the shield mine arc passed.');
