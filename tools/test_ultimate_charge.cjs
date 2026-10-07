const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const constants = source.slice(source.indexOf('  const ULTIMATE_BLOCKS_REQUIRED ='), source.indexOf('  const STARTER_MUTATIONS ='));
const logic = source.slice(source.indexOf('  function ultimateChargeBlocked('), source.indexOf('  function registerBrokenBlock('));
assert.ok(constants.includes('ULTIMATE_POST_USE_CHARGE'));
assert.ok(logic.includes('function destroyBlock'));

const context = {
  performance: { now: () => 1000 },
  blockIsGolden: () => false,
  spreadFireFromBrokenBlock: () => {},
  awardRunExperience: () => {},
  registerBrokenBlock: () => {},
  createDebris: () => {},
  elementalLevel: () => 0,
  impact: () => {},
};
vm.createContext(context);
vm.runInContext(`${constants}\n${logic}\nthis.destroyBlock = destroyBlock; this.finishUltimateRecharge = finishUltimateRecharge;`, context);

function freshRun(overrides = {}) {
  context.run = {
    ultimateIntro: null,
    elementalAbilityActive: '',
    ultimateRechargePending: '',
    ultimateCharge: 0,
    elementalAbilityCharges: 0,
    shieldCharges: 0,
    elementalAbilityType: 'fire',
    blocksDestroyed: 0,
    blastCounter: 0,
    categoryBlastDepth: 0,
    ...overrides,
  };
  return context.run;
}

function breakBlock(cause = 'impact') {
  const block = { x: 0, y: 0, w: 32, h: 32, hp: 1 };
  context.destroyBlock(block, cause, 1000);
  assert.equal(block.dead, true);
}

let run = freshRun();
breakBlock();
assert.equal(run.ultimateCharge, 1, 'ordinary block break charges the ultimate');
for (let index = 1; index < 64; index += 1) breakBlock();
assert.equal(run.elementalAbilityCharges, 0, 'ultimate is not ready after 64 blocks');
breakBlock();
assert.equal(run.elementalAbilityCharges, 1, 'ultimate is ready after 65 blocks');

run = freshRun({ ultimateRechargePending: 'elemental', elementalAbilityActive: 'fire' });
breakBlock('impact');
breakBlock('fireUltimate');
assert.equal(run.ultimateCharge, 0, 'no charge during an active ultimate');
run.ultimateIntro = { type: 'fire' };
run.elementalAbilityActive = '';
breakBlock();
assert.equal(run.ultimateCharge, 0, 'no charge during the ultimate intro');
run.ultimateIntro = null;
assert.equal(context.finishUltimateRecharge(), true);
assert.equal(run.ultimateCharge, 10, 'completion grants 15% of 65 points');
assert.equal(context.finishUltimateRecharge(), false, 'completion cannot grant twice');
breakBlock('fireUltimate');
breakBlock('electricStorm');
breakBlock('sporeUltimate');
breakBlock('glitchClone');
assert.equal(run.ultimateCharge, 10, 'delayed ultimate damage cannot recharge it');
breakBlock();
assert.equal(run.ultimateCharge, 11, 'ordinary damage resumes charging afterward');

run = freshRun({ ultimateRechargePending: 'shield', barrier: 50 });
breakBlock();
assert.equal(run.ultimateCharge, 0, 'shielded block breaks do not charge');
run.barrier = 0;
assert.equal(context.finishUltimateRecharge(), true);
assert.equal(run.ultimateCharge, 10, 'shield depletion grants the same 15%');

assert.match(source, /ultimateRechargePending === 'shield' && run\.barrier <= 0[^\n]*finishUltimateRecharge\(\)/);
assert.match(source, /run\.elementalAbilityActive = '';\s*run\.elementalAbilityNextTickAt = 0;\s*finishUltimateRecharge\(\)/);
assert.match(source, /function finishMechSuit\([\s\S]*?finishUltimateRecharge\(\)/);

// A hazard must consume the default shield once, preserve the heart, and
// release ultimate charging as soon as the shield breaks.
const hazardLogic = source.slice(source.indexOf('  function resolveHazardHit('), source.indexOf('  function elementalLevel('));
context.mechSuitActive = () => false;
context.spawnSpecialBurst = () => {};
context.applyBlockBounce = () => {};
context.sound = () => {};
context.feedback = () => {};
context.updateRunUI = () => {};
vm.runInContext(`${hazardLogic}\nthis.resolveHazardHit = resolveHazardHit;`, context);
run = freshRun({
  health: 3, barrier: 25, shieldCharges: 0, ultimateRechargePending: 'shield',
  slime: { x: 40, y: 40, vx: 0, vy: 180 }, damageInvulnerableUntil: 0,
  flightDistance: 20,
});
const hazard = { x: 20, y: 65, w: 40, h: 40, hp: 1, hazard: true };
context.resolveHazardHit(hazard, { nx: 0, ny: -1, penetration: 2 }, 1000);
assert.equal(hazard.dead, true, 'hazard is removed after the shielded hit');
assert.equal(run.health, 3, 'shielded hazard hit does not remove a heart');
assert.equal(run.barrier, 0, 'the first hazard consumes the entire shield');
assert.equal(run.ultimateCharge, 10, 'shield break starts the next charge');
assert.equal(run.ultimateRechargePending, '', 'shield recharge is released immediately');

console.log('Ultimate charge: normal breaks, active suppression, delayed damage, one-time 15% refund, and shield passed.');
