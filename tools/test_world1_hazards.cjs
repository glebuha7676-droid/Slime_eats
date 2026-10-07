const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const start = source.indexOf('  function resolveHazardHit(');
const end = source.indexOf('  function elementalLevel(', start);
assert.ok(start >= 0 && end > start);

let bounces = 0;
const run = {
  worldId: 1, slime: { x: 80, y: 90, vx: 0, vy: 100 }, mechSuit: null,
  blocksDestroyed: 0, particles: [], shake: 0, health: 3, maxHealth: 3,
  barrier: 0, damageInvulnerableUntil: 0, flightDistance: 0,
  ultimateRechargePending: '', hurtSlowUntil: 0
};
const context = {
  run, mechSuitActive: () => false, rand: () => 0,
  applyBlockBounce: () => { bounces += 1; },
  createDebris: () => {}, spawnSpecialBurst: () => {}, trimParticles: () => {},
  resetCombo: () => {}, impact: () => {}, sound: () => {}, feedback: () => {},
  updateRunUI: () => {}, endRun: () => {}, finishUltimateRecharge: () => {},
  Math
};
vm.createContext(context);
vm.runInContext(`${source.slice(start, end)}\nthis.resolveHazardHit = resolveHazardHit;`, context);

const spike = { x: 40, y: 50, w: 32, h: 32, hp: 1, hazard: true, unbreakable: true, dead: false };
const collision = { nx: 0, ny: -1, penetration: 3 };
assert.equal(context.resolveHazardHit(spike, collision, 1000), true);
assert.equal(spike.dead, false);
assert.equal(spike.hp, 1);
assert.equal(run.blocksDestroyed, 0);
assert.equal(run.health, 2);
assert.equal(bounces, 1);

assert.equal(context.resolveHazardHit(spike, collision, 1500), true);
assert.equal(run.health, 2, 'invulnerable contact does not cost another heart');
assert.equal(spike.dead, false);
assert.equal(bounces, 2);

run.barrier = 1;
assert.equal(context.resolveHazardHit(spike, collision, 4000), true);
assert.equal(run.barrier, 0);
assert.equal(run.health, 2);
assert.equal(spike.dead, false);

run.worldId = 2;
run.damageInvulnerableUntil = 0;
const otherWorldHazard = { ...spike, dead: false };
context.resolveHazardHit(otherWorldHazard, collision, 5000);
assert.equal(otherWorldHazard.dead, true, 'other worlds keep their existing hazard behavior');
console.log('World 1 spikes persist through hits, invulnerability and shield; other worlds are unchanged.');
