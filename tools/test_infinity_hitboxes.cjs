const assert = require('node:assert/strict');
const infinity = require('../js/abilities/infinity.js');

function mine(x, y = 180, rows = 20) {
  const blocksByRow = new Map();
  for (let row = 0; row < rows; row += 1) {
    blocksByRow.set(row, Array.from({ length: 6 }, (_, col) => ({ row, col, x: col * 100, y: row * 100, w: 100, h: 100 })));
  }
  return { infinity: infinity.create(3, 0), cellSize: 100, gridOffsetX: 0, columns: 6, blockRowOrigin: 0, slime: { x, y, radius: 20 }, blocksByRow };
}

function cast(kind, run, times) {
  const destroyed = [];
  const canBreak = () => true;
  if (kind === 'red') assert(infinity.swap(run.infinity));
  assert(infinity.start(run, kind, 0, canBreak));
  run.slime.x = 520;
  for (const time of times) infinity.update(run, time, { canBreak, impact() {}, destroy(block) { destroyed.push(block); } });
  assert.equal(new Set(destroyed).size, destroyed.length, 'A block intersecting multiple frames takes one hit');
  return destroyed;
}

const cols = hits => [...new Set(hits.map(block => block.col))].sort((a, b) => a - b);
const rows = hits => [...new Set(hits.map(block => block.row))].sort((a, b) => a - b);
const red = cast('red', mine(300), [280, 300, 450, 610, 850, 1100]);
assert.deepEqual(cols(red), [2, 3]);
assert.deepEqual(rows(red), [2, 3, 4, 5, 6, 7]);
const redOffCenter = mine(248);
assert.deepEqual(cols(cast('red', redOffCenter, [840])), [1, 2]);
assert.equal(redOffCenter.infinity.cast.x, 200, 'Red flies on the seam between both columns');
assert.deepEqual(cols(cast('red', mine(590), [840])), [4, 5]);

const blue = cast('blue', mine(220, 215), [590, 810]);
assert.deepEqual(cols(blue), [1, 2, 3]);
assert.deepEqual(rows(blue), [3, 4, 5]);
assert.equal(blue.length, 9);
assert.deepEqual(cols(cast('blue', mine(30), [590])), [0, 1, 2]);

const purple = cast('purple', mine(250), [2400]);
assert.deepEqual(cols(purple), [1, 2, 3]);
assert.equal(rows(purple).length, 13);
assert.deepEqual(cols(cast('purple', mine(300), [2400])), [2, 3, 4]);
assert.deepEqual(cols(cast('purple', mine(30), [2400])), [0, 1, 2]);
assert.equal(cast('purple', mine(590, 215), [2400]).length, 39);

const withMovingHazard = mine(250);
const moved = withMovingHazard.blocksByRow.get(16)[2];
moved.y = 260;
withMovingHazard.movingHazards = [moved];
assert(cast('red', withMovingHazard, [340]).includes(moved));

const charging = mine(250);
assert(infinity.start(charging, 'purple', 0, () => true));
assert(infinity.zoom(charging.infinity, 925) > 1);
assert(infinity.cameraShake(charging.infinity, 1530).y < -10);
assert(infinity.cameraLead(charging.infinity, 1970) > 100);
assert(infinity.protectsDuringUltimate(charging.infinity, 0));
assert(infinity.protectsDuringUltimate(charging.infinity, 2000));
assert.equal(infinity.absorb(charging.infinity, 2000, 0, -1), false);
assert.equal(charging.infinity.shield, true);
assert.equal(infinity.protectsDuringUltimate(charging.infinity, 2390), false);

const blueRun = mine(250);
const activeAttack = blueRun.infinity;
assert(infinity.start(blueRun, 'blue', 0, () => true));
assert(infinity.absorb(activeAttack, 220, 0, -1));
assert.equal(activeAttack.shieldStopUntil, 325);
assert.equal(activeAttack.shieldHitAngle, Math.PI / 2);
assert.equal(infinity.holdShieldFrame(activeAttack, 270, 220), true);
assert.equal(infinity.holdShieldFrame(activeAttack, 342, 270), false);
assert.equal(activeAttack.cast.at, 105, 'The sphere remains in place throughout the hit stop');
assert.equal(activeAttack.shieldStopUntil, 0);
console.log('Infinity locks 3×3, 2×6 and 3×13 areas at the cast position, with correct wall alignment and no duplicate hits.');
