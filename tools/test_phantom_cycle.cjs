const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const start = source.indexOf('  function phantomActive(');
const end = source.indexOf('  const GLITCH_BUGS', start);
assert.ok(start >= 0 && end > start, 'Phantom cycle must exist');
const constants = [...source.matchAll(/const (PHANTOM_(?:COOLDOWN|WARNING|ENTER|DURATION|BURST)_MS) = (\d+);/g)]
  .map(([, name, value]) => `const ${name} = ${value};`).join('\n');

const cellSize = 32;
const blocks = Array.from({ length: 5 }, (_, row) => Array.from({ length: 5 }, (_, col) => ({
  row, col, x: col * cellSize, y: row * cellSize, w: cellSize, h: cellSize,
  hp: 3, maxHp: 3, dead: false
}))).flat();
const blocksByRow = new Map(Array.from({ length: 5 }, (_, row) => [row, blocks.filter(block => block.row === row)]));
const at = (row, col) => blocksByRow.get(row).find(block => block.col === col);
const run = {
  slime: { x: 80, y: 80, radius: 12, vx: 0, vy: 0 },
  phantomNextAt: 10000, phantomWarned: false, phantomEnteredAt: 0, phantomEnterUntil: 0, phantomUntil: 0,
  phantomMarkedBlocks: new Set(), phantomBursts: [],
  blocksByRow, cellSize, columns: 5, gridOffsetX: 0, blockRowOrigin: 0, portalY: 999,
  steer: { touchY: 0, touchRawY: 0 }, shake: 0, emotionUntil: 0
};
let stage = 2;
const context = {
  run,
  elementalLevel: () => stage,
  performance: { now: () => 10000 },
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  blocksNearY: (y, radius) => blocks.filter(block => block.y < y + radius && block.y + block.h > y - radius),
  circleRectCollision: (circle, block, radius) => {
    const x = Math.max(block.x, Math.min(circle.x, block.x + block.w));
    const y = Math.max(block.y, Math.min(circle.y, block.y + block.h));
    return Math.hypot(circle.x - x, circle.y - y) < radius;
  },
  damageBlockByElement: (block, amount) => {
    block.hp = Math.max(0, block.hp - amount);
    if (!block.hp) block.dead = true;
  },
  destroyBlock: block => { block.dead = true; block.hp = 0; },
  speedDrillActive: () => false,
  jellyZoneForSlime: () => null,
  sound: () => {}, feedback: () => {}
};
vm.createContext(context);
vm.runInContext(`${constants}\n${source.slice(start, end)}`, context);

assert.equal(context.updatePhantomCycle(8699), false);
assert.equal(run.phantomWarned, false, 'warning does not start too early');
assert.equal(context.updatePhantomCycle(8700), false);
assert.equal(run.phantomWarned, true, 'warning starts before the transition');
assert.equal(context.updatePhantomCycle(10000), false, 'entry cue precedes intangibility');
assert.equal(run.phantomWarned, false, 'warning resets for the next cycle');
assert.equal(context.phantomActive(10379), false);
assert.equal(context.phantomActive(10380), true);
assert.equal(run.phantomUntil - run.phantomEnterUntil, 4000);
assert.equal(run.phantomNextAt, 20000, 'cycle repeats every 10 seconds');

context.markPhantomBlocks(10380);
assert.equal(at(2, 2).phantomMarked, true);
run.slime.x = 144;
run.slime.y = 144;
context.markPhantomBlocks(10400);
assert.equal(at(4, 4).phantomMarked, true);
run.slime.x = 80;
run.slime.y = 80;
assert.equal(context.updatePhantomCycle(14379), true);
assert.equal(context.updatePhantomCycle(14380), false);
assert.equal(at(2, 2).dead, true, 'occupied block is destroyed');
assert.equal(at(2, 3).hp, 2, 'nearby block receives 1 damage');
assert.equal(at(4, 4).hp, 2, 'remote touched block receives 1 delayed damage');
assert.equal(run.phantomMarkedBlocks.size, 0);
assert.equal(run.phantomBursts.length, 1, 'return creates a visible burst');

console.log('Phantom cycle: 10-second cadence, entry cue, 4-second flight, marked and nearby damage OK');
