const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'game.js'), 'utf8');
const start = source.indexOf('  const MAX_MINI_SLIMES = ');
const end = source.indexOf('  function frostFreezable(', start);
assert(start >= 0 && end > start, 'spore implementation is present');

const blocksByRow = new Map();
for (let row = 0; row < 25; row += 1) {
  blocksByRow.set(row, Array.from({ length: 5 }, (_, col) => ({
    id: `${row}:${col}`, row, col, x: col * 55, y: row * 55, w: 55, h: 55, hp: 3,
    dead: false, unbreakable: false, hazard: false
  })));
}
const run = {
  cellSize: 55, columns: 5, blockRowOrigin: 0, blocksByRow,
  slime: { x: 137, y: 0, vx: 0, vy: 0, radius: 24 },
  sporeProjectiles: [], sporePods: [], sporeBursts: [], miniSlimes: [], particles: [],
  nextSporeAt: 0, elementalAbilityActive: '', portalEntry: false, ended: false, shake: 0
};
let stage = 1;
const explosionHits = [];
const dependencies = {
  run,
  elementalLevel: () => stage,
  elementalDamageable: block => Boolean(block && !block.dead && !block.unbreakable && !block.hazard),
  blockCenter: block => ({ x: block.x + block.w / 2, y: block.y + block.h / 2 }),
  damageBlockByElement: (block, damage) => { explosionHits.push({ block, damage }); },
  rand: (min, max) => (min + max) / 2,
  clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  lerp: (startValue, endValue, ratio) => startValue + (endValue - startValue) * ratio,
  effectDensity: () => 1,
  trimParticles: () => {},
  ensureSporeSprites: () => {},
  isLowPowerDevice: () => false,
  feedback: () => {}
};
const functions = new Function('deps', `
  const { run, elementalLevel, elementalDamageable, blockCenter, damageBlockByElement,
    rand, clamp, lerp, effectDensity, trimParticles, ensureSporeSprites, isLowPowerDevice, feedback } = deps;
  ${source.slice(start, end)}
  return { updateSpores, updateCloningUltimate, detonateSporePod, sporeFlightPoint, SPORE_GROW_MS };
`)(dependencies);

assert.equal(functions.SPORE_GROW_MS, 1000, 'seed takes one second to mature');

functions.updateSpores(1000);
functions.updateSpores(3000);
assert.equal(run.sporeProjectiles.length, 1, 'stage one launches one spore');
assert.equal(run.sporeProjectiles[0].block.row, 7, 'spore aims about 50 metres below the slime');
const projectile = run.sporeProjectiles[0];
assert(projectile.landsAt - projectile.launchedAt >= 940, 'spore flight is gradual');
const halfway = functions.sporeFlightPoint(projectile, (projectile.launchedAt + projectile.landsAt) / 2);
assert(halfway.y < (projectile.y + projectile.block.y + projectile.block.h / 2) / 2,
  'spore follows an upward arc before falling');
functions.updateSpores(4500);
assert.equal(run.sporePods.length, 1, 'spore seed plants on its target block');
const firstPod = run.sporePods[0];
functions.detonateSporePod(firstPod, 4600);
assert(explosionHits.some(hit => hit.block === firstPod.block && hit.damage >= firstPod.block.hp),
  'spore explosion destroys its host block');
assert(explosionHits.some(hit => hit.block !== firstPod.block && hit.damage === 1),
  'spore explosion deals one damage to neighbours');
assert.equal(run.miniSlimes.length, 0, 'stage one creates no mushrooms');

stage = 2;
run.nextSporeAt = 4601;
functions.updateSpores(4700);
functions.updateSpores(5900);
assert.equal(run.sporePods.length, 1, 'stage two plants a new spore');
functions.detonateSporePod(run.sporePods[0], 6000);
assert.equal(run.miniSlimes.length, 3, 'stage two creates three mushrooms after explosion');
assert(run.miniSlimes.every(mushroom => mushroom.bouncesLeft === 2), 'each mushroom can hit three times');

stage = 3;
run.elementalAbilityActive = 'cloning';
run.cloneUltimate = { startedAt: 7000, fired: false, x: run.slime.x, y: run.slime.y };
functions.updateCloningUltimate(7600);
assert.equal(run.sporeProjectiles.length, 8, 'ultimate launches eight spores');
assert.equal(new Set(run.sporeProjectiles.map(projectile => projectile.block.id)).size, 8,
  'ultimate spores target distinct blocks');
assert(run.sporeProjectiles.every((projectile, index) => projectile.launchedAt === 7600 + index * 145),
  'ultimate spores launch in sequence');
console.log('Spore stages and ultimate: OK');
