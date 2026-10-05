const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const logic = source.slice(source.indexOf('  function totalTrophies()'), source.indexOf('  function updatePersistentUI()'));
assert.ok(logic.includes('function playHomeRewardFlight'));

function wallet() {
  return { dataset: {}, classList: { toggle() {} }, setAttribute() {} };
}
const researchWallet = wallet();
const trophyWallet = wallet();
const context = {
  save: { researchUnits: 125, worldTrophies: { 1: 2 } },
  adminInfiniteResearch: false,
  homeRewardFlight: null,
  clearTimeout() {},
  document: { getElementById: () => ({ replaceChildren() {} }) },
  formatCompactNumber: value => String(value),
  els: {
    coinsLabel: { closest: () => trophyWallet },
    researchUnitsLabel: { closest: () => researchWallet },
  },
};
vm.createContext(context);
vm.runInContext(`${logic}\nthis.prepareHomeRewardFlight = prepareHomeRewardFlight; this.renderWalletBalances = renderWalletBalances; this.settleHomeRewardFlight = settleHomeRewardFlight;`, context);

context.prepareHomeRewardFlight({ researchUnitsBefore: 100, researchUnitsAfter: 125, completed: true, endless: false });
context.renderWalletBalances();
assert.equal(context.els.researchUnitsLabel.textContent, '100', 'home counter waits for arriving flasks');
assert.equal(context.els.coinsLabel.textContent, '1', 'home counter waits for arriving trophy');
assert.equal(context.save.researchUnits, 125, 'reward remains saved during animation');
assert.equal(context.save.worldTrophies[1], 2, 'trophy remains saved during animation');

context.homeRewardFlight.flaskShown = 15;
context.homeRewardFlight.trophyShown = 1;
context.renderWalletBalances();
assert.equal(context.els.researchUnitsLabel.textContent, '115', 'arrivals advance the visible balance');
assert.equal(context.els.coinsLabel.textContent, '2', 'trophy arrival advances its balance');

context.settleHomeRewardFlight();
assert.equal(context.els.researchUnitsLabel.textContent, '125', 'settling restores the saved final balance');
assert.equal(context.homeRewardFlight, null);

console.log('Home reward flight: saved rewards, staged counters, and final settlement passed.');
