const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const gameSource = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const logic = gameSource.slice(gameSource.indexOf('  function renderWalletBalances()'), gameSource.indexOf('  function updatePersistentUI()'));
assert.ok(logic.includes('function playHomeRewardFlight'));
const experienceContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'js/config/experience.js'), 'utf8'), experienceContext);

function wallet() {
  return { dataset: {}, classList: { toggle() {} }, setAttribute() {} };
}
const researchWallet = wallet();
const levelWallet = wallet();
const context = {
  save: { researchUnits: 125, playerExperience: 270 },
  EXPERIENCE: experienceContext.window.SlimeExperience,
  adminInfiniteResearch: false,
  homeRewardFlight: null,
  clearTimeout() {},
  document: { getElementById: () => ({ replaceChildren() {} }) },
  formatCompactNumber: value => String(value),
  els: {
    coinsLabel: { closest: () => levelWallet },
    playerLevelProgress: { style: {} },
    playerLevelExperience: {},
    researchUnitsLabel: { closest: () => researchWallet },
  },
};
vm.createContext(context);
vm.runInContext(`${logic}\nthis.prepareHomeRewardFlight = prepareHomeRewardFlight; this.renderWalletBalances = renderWalletBalances; this.settleHomeRewardFlight = settleHomeRewardFlight;`, context);

context.prepareHomeRewardFlight({ researchUnitsBefore: 100, researchUnitsAfter: 125, experienceEarned: 30 });
context.renderWalletBalances();
assert.equal(context.els.researchUnitsLabel.textContent, '100', 'home counter waits for arriving flasks');
assert.equal(context.els.coinsLabel.textContent, '2', 'level waits for arriving experience');
assert.equal(context.els.playerLevelExperience.textContent, '140/150 XP');
assert.equal(context.save.playerExperience, 270, 'experience is already saved during animation');

context.homeRewardFlight.flaskShown = 15;
context.homeRewardFlight.experienceShown = 15;
context.renderWalletBalances();
assert.equal(context.els.researchUnitsLabel.textContent, '115');
assert.equal(context.els.coinsLabel.textContent, '3', 'level increments when experience arrives');
assert.equal(context.els.playerLevelExperience.textContent, '5/200 XP');

context.settleHomeRewardFlight();
assert.equal(context.els.researchUnitsLabel.textContent, '125');
assert.equal(context.els.playerLevelExperience.textContent, '20/200 XP');
assert.equal(context.homeRewardFlight, null);
console.log('Home reward flight: staged flasks, experience and level-up passed.');
