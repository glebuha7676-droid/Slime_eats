const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js/config/experience.js'), 'utf8'), context);
const xp = context.window.SlimeExperience;
assert.equal(xp.MAX_LEVEL, 30);
assert.equal(xp.nextLevelCost(1), 100);
assert.equal(xp.nextLevelCost(2), 150);
assert.equal(xp.nextLevelCost(29), 1500);
assert.equal(xp.experienceForLevel(2), 100);
assert.equal(xp.experienceForLevel(10), 2700);
assert.equal(xp.experienceForLevel(20), 10450);
assert.equal(xp.experienceForLevel(30), 23200);
assert.equal(xp.levelForExperience(0), 1);
assert.equal(xp.levelForExperience(99), 1);
assert.equal(xp.levelForExperience(100), 2);
assert.equal(xp.levelForExperience(2699), 9);
assert.equal(xp.levelForExperience(2700), 10);
assert.equal(xp.levelForExperience(10450), 20);
assert.equal(xp.levelForExperience(23200), 30);
assert.equal(xp.levelForExperience(999999), 30);
assert.equal(xp.experienceForBlock({ tier: 'dense' }), 1);
assert.equal(xp.experienceForBlock({ tier: 'hard' }), 3);
assert.equal(xp.experienceForBlock({ tier: 'reinforced' }), 5);
assert.deepEqual([0, 1, 2].map(xp.requiredLevelForWorldIndex), [1, 10, 20]);

const gameSource = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const awardSource = gameSource.slice(gameSource.indexOf('  function awardRunExperience('), gameSource.indexOf('  function awardFlaskData('));
assert.ok(awardSource.includes('function awardRunExperience'));
let now = 10000;
const hud = { dataset: {}, classList: { add() {}, remove() {} }, setAttribute() {} };
const run = { ended: false, experienceEarned: 0, experienceCombo: 0, experienceComboAt: 0, experiencePendingGain: 0, experienceHudFrame: 0 };
const awardContext = {
  run, EXPERIENCE: xp, performance: { now: () => now },
  els: { runExperienceHud: hud, runExperienceScore: {}, runExperienceGain: {} },
  requestAnimationFrame(callback) { callback(); }, clearTimeout() {}, setTimeout() { return 1; },
};
vm.createContext(awardContext);
vm.runInContext(`${awardSource}\nthis.awardRunExperience = awardRunExperience;`, awardContext);
const weak = { tier: 'dense' };
awardContext.awardRunExperience(weak);
awardContext.awardRunExperience(weak);
assert.equal(run.experienceEarned, 1, 'one block pays only once');
assert.equal(awardContext.els.runExperienceScore.textContent, '1');
now += 200;
awardContext.awardRunExperience({ tier: 'hard' });
now += 200;
awardContext.awardRunExperience({ tier: 'reinforced' });
assert.equal(run.experienceEarned, 9, 'weak + normal + reinforced pay 1 + 3 + 5');
assert.equal(awardContext.els.runExperienceGain.textContent, '+5');
assert.equal(hud.dataset.stage, '1');
for (let index = 0; index < 11; index += 1) {
  now += 100;
  awardContext.awardRunExperience({ tier: 'dense' });
  if (index === 0) assert.equal(hud.dataset.stage, '2');
  if (index === 4) assert.equal(hud.dataset.stage, '3');
}
assert.equal(hud.dataset.stage, '4', 'long destruction streak reaches the most energetic color');
awardContext.awardRunExperience({ tier: 'hard', hazard: true });
assert.equal(run.experienceEarned, 20, 'hazards do not pay experience');
console.log('Experience balance: 30 levels, thresholds, block rewards and world gates passed.');
