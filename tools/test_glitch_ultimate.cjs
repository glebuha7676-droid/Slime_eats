const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const choiceStart = source.indexOf('  function hideGlitchChoice(');
const start = source.indexOf('  function rewriteGlitchSection(');
const end = source.indexOf('  function executeGlitchBug(', start);
assert.ok(choiceStart >= 0 && start > choiceStart && end > start);

const blocks = [];
for (let row = 0; row < 14; row += 1) {
  for (let col = 0; col < 7; col += 1) {
    blocks.push({ id: row * 7 + col, row, col, x: col * 32, y: row * 32,
      w: 32, h: 32, hp: 4, maxHp: 4, tier: 'hard', special: col === 0 ? null : 'cryo',
      hazard: col === 0, unbreakable: col === 0 });
  }
}
const outside = { y: 16, value: 5 };
const inside = { y: 80, value: 5 };
const run = {
  glitchChange: { startRow: 2, at: 1000 }, blocks, flasks: [outside, inside],
  glitchInfectedBlocks: new Set(), blockRowOrigin: 0, cellSize: 32,
  columns: 7, worldId: 1, world: {}, shake: 0
};
const classes = new Set(['hidden']);
const overlay = {
  classList: {
    add: (...names) => names.forEach(name => classes.add(name)),
    remove: (...names) => names.forEach(name => classes.delete(name)),
    contains: name => classes.has(name)
  },
  querySelector: () => ({ focus() {} })
};
const announcement = {
  children: [], dataset: {},
  replaceChildren() { this.children = []; },
  appendChild(child) { this.children.push(child); },
  setAttribute(name, value) { this[name] = value; }
};
const context = {
  run,
  performance: { now: () => 1000 },
  GLITCH_BUGS: [
    { id: 'copy', name: 'КОПИРОВАНИЕ' }, { id: 'delete', name: 'УДАЛЕНИЕ' },
    { id: 'infect', name: 'ЗАРАЖЕНИЕ' }, { id: 'change', name: 'ИЗМЕНЕНИЕ' }
  ],
  els: { glitchUltimateOverlay: overlay, glitchChoiceAnnouncement: announcement },
  document: { createElement: () => ({ style: { setProperty() {} }, setAttribute() {} }) },
  renderCanvas: () => {}, sound: () => {}, feedback: () => {}, gameFrame: () => {}, requestAnimationFrame: () => 7,
  chooseMaterial: () => 'fragile-earth',
  impact: () => {},
  Math: Object.assign(Object.create(Math), { random: () => 1 })
};
vm.createContext(context);
vm.runInContext(`${source.slice(choiceStart, end)}\nthis.startGlitchChoice = startGlitchChoice; this.selectGlitchBug = selectGlitchBug; this.rewriteGlitchSection = rewriteGlitchSection;`, context);
context.startGlitchChoice(900);
assert.equal(run.glitchChoice.phase, 'choosing');
assert.equal(classes.has('hidden'), false);
assert.equal(context.selectGlitchBug('change'), true);
assert.equal(context.selectGlitchBug('delete'), false, 'a second selection cannot override the first');
assert.equal(run.glitchChoice.kind, 'change');
assert.equal(run.animationId, 7, 'selection resumes the announcement frames');
assert.equal(announcement.children.length, 'ИЗМЕНЕНИЕ'.length);
assert.equal(classes.has('is-announcing'), true);
context.rewriteGlitchSection(1000);

assert.equal(run.glitchChange, null);
assert.ok(run.flasks.includes(outside), 'flasks outside the ten-row sheet remain');
assert.ok(!run.flasks.includes(inside), 'old flasks inside the sheet are replaced');
const sheet = blocks.filter(block => block.row >= 2 && block.row < 12);
assert.equal(sheet.length, 70);
assert.ok(sheet.filter(block => block.col === 0).every(block => block.hazard && block.unbreakable && !block.dead));
assert.ok(sheet.filter(block => block.col !== 0).every(block => !block.hazard && !block.unbreakable && !block.special));
assert.ok(sheet.filter(block => block.col !== 0 && !block.dead).every(block => block.tier === 'dense' && block.hp === 1));
assert.ok(blocks.filter(block => block.row < 2 || block.row >= 12).every(block => block.tier === 'hard'));
assert.equal(run.flasks.length, 1, 'World 1 does not spawn floating flasks');
assert.equal(sheet.filter(block => block.flaskValue === 2 && block.flaskTier === 1).length, 4,
  'four +2 flasks are embedded in fragile blocks');
assert.equal((html.match(/data-glitch-bug="(copy|delete|infect|change)"/g) || []).length, 4);
assert.match(source, /startGlitchChoice\(timestamp\);[\s\S]*?run\.elementalAbilityNextTickAt = run\.elementalAbilityUntil/);
assert.match(source, /if \(run\.glitchChoice\)[\s\S]*?shiftRunClock\(timestamp - choice\.startedAt\);[\s\S]*?executeGlitchBug\(choice\.kind, timestamp\)/);

console.log('Glitch ultimate: four choices, frozen selection, protected spikes and embedded +2 flasks passed.');
