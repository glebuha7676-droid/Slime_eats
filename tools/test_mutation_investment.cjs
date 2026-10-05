const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const logic = source.slice(source.indexOf('  function currentMutationCost()'), source.indexOf('  function handleMutationCapsuleClick('));
const context = {
  save: { legacyStarterAccess: false, unlockedMutations: [], mutationProgress: 0, mutationInvestTapCount: 0, researchUnits: 10 },
  MUTATION_STEPS: 10,
  availableSyntheses: () => [],
  adminInfiniteResearch: false,
};
vm.createContext(context);
vm.runInContext(`${logic}\nthis.nextAmount = nextMutationInvestmentAmount;`, context);

for (const amount of [1, 2, 3, 4]) {
  assert.equal(context.nextAmount(), amount);
  context.save.researchUnits -= amount;
  context.save.mutationProgress += amount;
  context.save.mutationInvestTapCount++;
}
assert.equal(context.save.mutationProgress, 10);
assert.equal(context.nextAmount(), 0, 'a filled reactor accepts no more flasks');

context.save = { legacyStarterAccess: true, unlockedMutations: ['fire'], mutationProgress: 0, mutationInvestTapCount: 9, researchUnits: 8 };
context.availableSyntheses = () => Array.from({ length: 9 }, () => ({ id: 'fire' }));
assert.equal(context.nextAmount(), 8, 'a tenth tap spends only the eight flasks in the wallet');
context.save.mutationProgress = 97;
assert.equal(context.nextAmount(), 3, 'a tap cannot exceed the remaining reactor cost');
context.adminInfiniteResearch = true;
context.save.researchUnits = 0;
assert.equal(context.nextAmount(), 3, 'admin infinite flasks still respect reactor capacity');

console.log('Mutation investment: increasing taps and wallet/reactor limits passed.');
