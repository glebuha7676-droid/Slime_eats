const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const start = source.indexOf('  const TELEKINESIS_INTERVAL_MS');
const end = source.indexOf('  const MAX_MINI_SLIMES', start);
assert.ok(start >= 0 && end > start, 'Psionics logic must exist');

const cellSize = 32;
const blocks = Array.from({ length: 9 }, (_, row) => Array.from({ length: 9 }, (_, col) => ({
  id: `${row}:${col}`, row: row + 3, col, x: col * cellSize, y: (row + 3) * cellSize,
  w: cellSize, h: cellSize, hp: 4, maxHp: 4, dead: false
}))).flat();
const blocksByRow = new Map(Array.from({ length: 9 }, (_, row) => [row + 3, blocks.filter(block => block.row === row + 3)]));
const at = (row, col) => blocksByRow.get(row).find(block => block.col === col);
const run = {
  slime: { x: 144, y: 60, vx: 0, vy: 0, radius: 16 }, cameraY: 0, cellSize, blocks, blocksByRow,
  blockRowOrigin: 0, portalY: 1000, damageInvulnerableUntil: 0,
  telekinesisNextAt: 0, telekinesisMarks: [], telekinesisBursts: [], telekinesisCycle: null,
  telekinesisThrowIndex: 0, telekinesisUltimatePending: false, elementalAbilityUntil: 0,
  elementalAbilityActive: '', shake: 0
};
let level = 1;
const context = {
  run, VIEW_W: 288, VIEW_H: 400, ELEMENTAL_ABILITY_DURATION_MS: { telekinesis: 2500 },
  performance: { now: () => 0 }, sound: () => {}, feedback: () => {}, impact: () => {},
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  blockCenter: block => ({ x: block.x + block.w / 2, y: block.y + block.h / 2 }),
  elementalLevel: () => level,
  elementalDamageable: block => Boolean(block && !block.dead && !block.unbreakable && !block.hazard),
  awardRunExperience: () => {},
  destroyBlock: block => { block.dead = true; block.hp = 0; },
  damageBlockByElement: (block, amount) => { block.hp -= amount; if (block.hp <= 0) block.dead = true; }
};
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);

context.startTelekinesisCycle(1000, 1);
assert.equal(run.telekinesisCycle.mode, 'single');
assert.equal(run.telekinesisCycle.projectiles.length, 1, 'first stage lifts one actual block');
context.updateTelekinesis(1180);
assert.equal(run.telekinesisCycle.projectiles[0].block.dead, true, 'lifted block leaves the grid');
context.updateTelekinesis(1930);
assert.ok(run.telekinesisCycle.projectiles[0].target.y > run.slime.y, 'throw aims below the slime');
context.updateTelekinesis(2450);
assert.equal(run.telekinesisBursts.length, 1);

level = 2;
context.startTelekinesisCycle(3000, 2);
assert.equal(run.telekinesisCycle.mode, 'cross');
assert.equal(run.telekinesisCycle.projectiles.length, 2, 'second stage lifts two blocks');
const [left, right] = run.telekinesisCycle.projectiles;
assert.equal(left.side, -1);
assert.equal(right.side, 1);
context.updateTelekinesis(4020);
assert.ok(left.target.x > right.target.x, 'left and right throws cross like scissors');
context.updateTelekinesis(4540);

// The impact damages only the centre and its four orthogonal neighbours, once each.
for (const block of blocks) { block.dead = false; block.hp = 4; }
context.impactTelekinesisProjectile({ target: { row: 6, col: 4, x: 144, y: 208 } }, 5000);
for (const [row, col] of [[6, 4], [5, 4], [7, 4], [6, 3], [6, 5]]) {
  assert.equal(at(row, col).hp, 3, `${row}:${col} takes one cross damage`);
}
assert.equal(at(5, 3).hp, 4, 'diagonal block is untouched');

level = 3;
run.telekinesisUltimatePending = true;
run.elementalAbilityActive = 'telekinesis';
run.elementalAbilityUntil = 11200;
context.updateTelekinesis(6000);
assert.equal(run.telekinesisUltimatePending, false);
assert.equal(run.telekinesisCycle.mode, 'ultimate');
assert.equal(run.telekinesisCycle.projectiles.length, 10, 'ultimate gathers ten blocks');
assert.ok(run.telekinesisCycle.projectiles[9].throwAt > run.telekinesisCycle.projectiles[0].throwAt);
assert.ok(context.telekinesisOrbitPosition(run.telekinesisCycle.projectiles[0], 1000).y < run.slime.y);
for (let time = 6200; time <= 9700; time += 100) context.updateTelekinesis(time);
assert.equal(run.telekinesisCycle, null, 'all ten blocks fly and impact in sequence');
assert.ok(run.elementalAbilityUntil >= 10550, 'ultimate stays active until the volley finishes');

// The new press replaces the volley in play, while the old volley logic stays available for tuning.
for (const block of blocks) { block.dead = false; block.hp = 4; }
at(3, 0).hazard = true;
context.startTelekinesisPress(12000, run.slime.y);
assert.equal(run.telekinesisPress.lastRow - run.telekinesisPress.firstRow + 1, 11, '80 m uses eleven seven-per-50-metre rows');
assert.ok(Math.abs((run.telekinesisPress.bottomY - run.telekinesisPress.topY) / cellSize - 11.2) < .001,
  'the visual press covers exactly 80 m at seven mine rows per 50 m');
assert.equal(run.telekinesisPress.targets.length, 81);
context.updateTelekinesisPress(13279);
assert.equal(run.telekinesisPress.collided, false);
assert.equal(blocks.filter(block => block.dead).length, 0, 'walls do not destroy blocks before meeting');
context.updateTelekinesisPress(13280);
assert.equal(run.telekinesisPress.collided, true);
assert.equal(blocks.filter(block => block.dead).length, 81, 'the squeeze clears its entire captured area');
assert.equal(at(3, 0).dead, true, 'the press clears a captured hazard');
context.updateTelekinesisPress(14331);
assert.equal(run.telekinesisPress, null, 'press visuals retire after the blast');

for (const block of blocks) block.dead = false;
run.portalY = 210;
context.startTelekinesisPress(15000, run.slime.y);
assert.ok(run.telekinesisPress.bottomY <= run.portalY - cellSize * .5, 'the field stops before the finish portal');
assert.ok(run.telekinesisPress.targets.every(block => block.row <= run.telekinesisPress.lastRow));

const renderStart = source.indexOf('  function telekinesisPressScreenBounds(');
const renderEnd = source.indexOf('  function drawTelekinesis(timestamp)', renderStart);
assert.ok(renderStart >= 0 && renderEnd > renderStart);
let strokes = 0;
context.ctx = {
  save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {},
  moveTo() {}, lineTo() {}, ellipse() {}, stroke() { strokes += 1; },
  createLinearGradient: () => ({ addColorStop() {} })
};
vm.runInContext(source.slice(renderStart, renderEnd), context);
context.drawTelekinesisPressBackdrop(15600);
context.drawTelekinesisPressScene(15600);
assert.ok(strokes > 0, 'both incoming energy walls are rendered');
context.updateTelekinesisPress(16280);
context.drawTelekinesisPressScene(16400);
assert.ok(strokes > 4, 'the meeting walls produce a visible shockwave');

const destroyStart = source.indexOf('  function destroyBlock(');
const chargeStart = source.indexOf('  function ultimateChargeBlocked(');
const destroyEnd = source.indexOf('  function registerBrokenBlock(', destroyStart);
assert.ok(chargeStart >= 0 && destroyStart > chargeStart && destroyEnd > destroyStart);
Object.assign(context, {
  blockIsGolden: () => false, spreadFireFromBrokenBlock: () => {}, registerBrokenBlock: () => {},
  ULTIMATE_BLOCKS_REQUIRED: 150, ULTIMATE_POST_USE_CHARGE: 23,
  ULTIMATE_BREAK_CAUSES: new Set(['telekinesisPress'])
});
run.elementalAbilityCharges = 1;
run.shieldCharges = 0;
run.blocksDestroyed = 0;
vm.runInContext(source.slice(chargeStart, destroyEnd), context);
const hazard = at(3, 0);
hazard.dead = false;
assert.equal(context.destroyBlock(hazard, 'telekinesisBlast', 17000), false, 'ordinary attacks cannot clear hazards');
assert.equal(context.destroyBlock(hazard, 'telekinesisPress', 17000), true, 'the press can clear hazards');
assert.equal(hazard.dead, true);

console.log('Psionics: one block, crossing pair, old volley, 80 m press and one-damage cross OK');
