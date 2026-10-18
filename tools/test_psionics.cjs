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
  gridOffsetX:0,columns:9,blockRowOrigin: 0, portalY: 1000, damageInvulnerableUntil: 0,
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
  blocksNearY:(y,radius)=>blocks.filter(b=>Math.abs(b.y+b.h/2-y)<=radius+32),
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

for(level=2;level<=3;level++){
 context.startTelekinesisCycle(3000,level);assert.equal(run.telekinesisCycle.mode,'single');assert.equal(run.telekinesisCycle.projectiles.length,1,'Every stage has one base projectile');
}
// Impact now includes all eight neighbours around the centre.
for(const block of blocks){block.dead=false;block.hp=4;}
context.impactTelekinesisProjectile({target:{row:6,col:4,x:144,y:208}},5000);
for(let row=5;row<=7;row++)for(let col=3;col<=5;col++)assert.equal(at(row,col).hp,3,'3×3 area receives one hit');
assert.equal(at(4,4).hp,4);assert.equal(at(6,2).hp,4);
level=2;run.ultimateProfile={blockCount:8,orbitMs:1450,staggerMs:185};run.elementalAbilityUntil=10000;
context.startTelekinesisCycle(6000,2,true);let storm=run.telekinesisCycle;
assert.equal(storm.mode,'ultimate');assert.equal(storm.projectiles.length,8);assert(storm.projectiles.every(p=>p.delay===0),'All eight blocks are pulled together');
context.updateTelekinesis(6179);assert(storm.projectiles.every(p=>!p.detached));
context.updateTelekinesis(6180);assert(storm.projectiles.every(p=>p.detached&&p.block.dead));
assert(context.telekinesisOrbitPosition(storm.projectiles[0],1000).y<run.slime.y);
context.updateTelekinesis(7450);assert.equal(storm.projectiles.filter(p=>p.launched).length,1);
context.updateTelekinesis(7635);assert.equal(storm.projectiles.filter(p=>p.launched).length,2);
for(let t=7700;t<=9800;t+=25)context.updateTelekinesis(t);assert.equal(run.telekinesisCycle,null,'Eight throws finish in order');
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

console.log('Psionics: one base block on all stages, 3×3 impact, eight simultaneous pulls and staggered storm throws, indexed targets and original 80m press passed');
