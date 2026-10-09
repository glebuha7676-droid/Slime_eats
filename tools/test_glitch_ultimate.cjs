const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const take = name => {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 20);
  assert.ok(start >= 0 && end > start, name);
  return source.slice(start, end);
};
let seed = 17;
const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const run = {};
let plasma = 0;
const classes = new Set(['hidden']);
const announcement = { children: [], dataset: {}, replaceChildren() { this.children = []; },
  appendChild(child) { this.children.push(child); }, setAttribute(name, value) { this[name] = value; } };
const context = {
  run, Math: Object.assign(Object.create(Math), { random }), performance: { now: () => 1000 },
  VIEW_W: 240, VIEW_H: 480, GLITCH_INFECTION_INTERVAL_MS: 11500, GLITCH_NEUTRALIZE_INTERVAL_MS: 17500,
  ULTIMATE_BLOCKS_REQUIRED: 65, FLASK_VALUES: { 1: 1, 2: 3, 3: 5 },
  EXPERIENCE: { experienceForBlock: b => ({ dense: 1, hard: 3, reinforced: 5 }[b.tier] || 1) },
  clamp: (n, min, max) => Math.min(max, Math.max(min, n)), chooseMaterial: () => 'fragile-earth',
  elementalLevel: () => 0, blockIsGolden: () => false, ultimateChargeBlocked: c => ['glitchDelete', 'glitchHack'].includes(c),
  spreadFireFromBrokenBlock() {}, createDebris() {}, sound() {}, feedback() {}, impact() {}, trimParticles() {},
  effectDensity: () => 1, isMobileDevice: () => false, isLowPowerDevice: () => false,
  awardFlaskData: n => { plasma += n; },
  window: { SlimeBlockBreakFeedback: { emitEssence: () => ({ particles: [], impact: { type: 'essenceCollect' } }) } },
  els: { glitchChoiceAnnouncement: announcement, glitchUltimateOverlay: {
    classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) },
    querySelector: () => ({ focus() {} }) } },
  document: { createElement: () => ({ style: { setProperty() {} }, setAttribute() {} }) },
  renderCanvas() {}, gameFrame() {}, requestAnimationFrame: () => 7,
};
vm.createContext(context);
const start = source.indexOf('  const GLITCH_BUGS =');
const end = source.indexOf('  function updatePhysics(', start);
vm.runInContext(source.slice(start, end) + ['destroyBlock', 'registerBrokenBlock', 'awardRunExperience', 'updateMovingHazards'].map(take).join('\n'), context);
context.damageBlockByElement = (b, amount, cause, time) => {
  if (!b || b.dead || b.hazard) return false;
  b.hp -= amount;
  if (b.hp <= 0) context.destroyBlock(b, cause, time);
  return true;
};
function reset() {
  plasma = 0; seed = 17;
  for (const key of Object.keys(run)) delete run[key];
  Object.assign(run, { worldId: 1, world: {}, cellSize: 40, columns: 6, blockRowOrigin: 0, gridOffsetX: 0,
    slime: { x: 100, y: 420, radius: 16, vx: 0, vy: 180 }, cameraY: 200, health: 3, shake: 0,
    blocksDestroyed: 0, experienceEarned: 0, experiencePendingGain: 0, experienceHudFrame: 0,
    ultimateCharge: 0, elementalAbilityCharges: 0, elementalAbilityType: 'glitch',
    particles: [], specialEffects: [], effects: {}, flasks: [{ y: 600, value: 3 }], sporePods: [],
    glitchInfectedBlocks: new Set(), glitchDeleteQueue: [], glitchHackQueue: [], glitchSpreadQueue: [],
    glitchNextInfectionAt: Infinity, glitchNextNeutralizeAt: Infinity, movingHazards: [],
    blocks: Array.from({ length: 30 * 6 }, (_, id) => {
      const row = Math.floor(id / 6), col = id % 6;
      return { id, row, col, x: col * 40, y: row * 40, w: 40, h: 40,
        tier: 'hard', hp: 3, maxHp: 3, dead: false, flaskTier: 2, flaskValue: 3 };
    }) });
}
const cell = (row, col) => run.blocks.find(b => b.row === row && b.col === col);
const spike = b => Object.assign(b, { hazard: true, unbreakable: true, hp: Infinity, maxHp: Infinity, flaskTier: 0, flaskValue: 0 });

reset();
const marked = spike(cell(12, 2));
marked.motion = { min: 0, max: 200, period: 2000, phase: 0, axis: 'x' };
const patrol = spike(cell(14, 0));
patrol.motion = { ...marked.motion };
run.movingHazards = [marked, patrol];
assert.equal(context.markGlitchHazard(marked, 1000), true);
assert.equal(context.markGlitchHazard(marked, 1000), false);
context.updateMovingHazards(1000);
assert.equal(marked.x, 80, 'disarmed patrol stops moving');
assert.equal(patrol.x, 200, 'ordinary patrol still moves');
assert.equal(context.transformGlitchHazard(marked, null, 1000), false, 'contact passes through without bounce');
assert.equal(marked.dead, true); assert.equal(marked.hp, 0);
assert.equal(run.health, 3); assert.equal(run.slime.vy, 180);
assert.equal(run.experienceEarned, 0); assert.equal(plasma, 0);
context.transformGlitchHazard(marked, null, 1100);
assert.equal(run.blocksDestroyed, 1, 'disarmed contact is idempotent');
assert.equal(context.destroyBlock(patrol, 'impact', 1000), false, 'ordinary spikes remain protected');

reset();
const originalOre = Object.assign(cell(12, 3), { tier: 'reinforced', hp: 5, maxHp: 5, flaskTier: 3, flaskValue: undefined });
const rewrittenSpike = spike(cell(13, 4));
rewrittenSpike.motion = { min: 0, max: 200, period: 2000, phase: 0, axis: 'x' };
run.movingHazards = [rewrittenSpike];
const hole = cell(14, 1); hole.dead = true;
context.executeGlitchBug('change', 1000);
context.updateGlitchEffects(1400);
assert.equal(originalOre.hp, 1); assert.equal(originalOre.tier, 'dense');
assert.equal(originalOre.flaskTier, 3); assert.equal(originalOre.flaskValue, 5);
assert.equal(rewrittenSpike.hazard, false); assert.equal(rewrittenSpike.unbreakable, false);
assert.equal(rewrittenSpike.motion, null); context.updateMovingHazards(1400);
assert.equal(hole.dead, true, 'rewrite never fills existing air');
assert.equal(cell(10, 0).hp, 3); assert.equal(cell(20, 0).hp, 1);
assert.equal(cell(21, 0).hp, 3, 'exactly ten rows below');
assert.equal(run.flasks.length, 1); assert.equal(plasma, 0, 'no fabricated rewards');
context.destroyBlock(originalOre, 'impact', 1500);
context.destroyBlock(originalOre, 'impact', 1600);
assert.equal(plasma, 5, '+5 original vein collected exactly once');
assert.equal(run.experienceEarned, 1, 'rewritten fragile tile awards fragile XP');

reset();
for (const b of run.blocks) if (b.row > 10 && b.row <= 22 && b.col % 2) spike(b);
const outside = cell(26, 2);
const inside = cell(12, 2);
context.infectGlitchGroup([outside, inside], 900);
context.executeGlitchBug('delete', 1000);
const deleted = run.glitchDeleteQueue.map(item => item.block);
assert.ok(deleted.length > 0 && deleted.length < 72);
assert.ok(deleted.every(b => (b.row > 10 && b.row <= 22) || (Math.abs(b.row - 10) <= 2 && Math.abs(b.col - 2) <= 2)));
assert.ok(deleted.some(b => b.hazard), 'deletion can target spikes');
const expectedPlasma = deleted.reduce((n, b) => n + (b.flaskValue || 0), 0);
context.updateGlitchEffects(3500);
assert.ok(deleted.every(b => b.dead)); assert.equal(run.glitchDeleteQueue.length, 0);
assert.equal(run.blocksDestroyed, deleted.length); assert.equal(plasma, expectedPlasma);
assert.equal(outside.dead, false); assert.equal(outside.hp, 3, 'deletion cannot echo beyond its range');
assert.equal(run.ultimateCharge, 0, 'ultimate destruction cannot recharge itself');
context.updateGlitchEffects(4000); assert.equal(plasma, expectedPlasma);

reset();
context.executeGlitchBug('infect', 1000);
assert.ok(run.glitchSpreadQueue.length > 0); assert.equal(run.glitchInfectedBlocks.size, 0);
context.updateGlitchEffects(1450);
const halfway = run.glitchInfectedBlocks.size;
assert.ok(halfway > 0 && run.glitchSpreadQueue.length > 0, 'infection visibly spreads over time');
context.updateGlitchEffects(3000);
assert.equal(run.glitchSpreadQueue.length, 0);
assert.ok(run.glitchInfectedBlocks.size > halfway);
assert.ok([...run.glitchInfectedBlocks].some(b => b.row < 10));
assert.ok([...run.glitchInfectedBlocks].some(b => b.row > 10));
assert.ok([...run.glitchInfectedBlocks].every(b => Math.max(Math.abs(b.row - 10), Math.abs(b.col - 2)) <= 7));
const linked = [...run.glitchInfectedBlocks];
context.shareGlitchHit(linked[0], 1, 3100);
assert.equal(run.glitchInfectedBlocks.size, 0, 'network clears before its echo');
assert.ok(linked.slice(1).every(b => b.hp === 2));

reset();
const belowSpikes = Array.from({ length: 12 }, (_, i) => spike(cell(i + 11, i % 6)));
const near = spike(cell(9, 3)), far = spike(cell(6, 5)), deeper = spike(cell(23, 2));
context.executeGlitchBug('hack', 1000);
assert.ok(belowSpikes.every(b => !b.glitchNeutralized && b.glitchHackingUntil > 1000), 'hack starts with visible decoding, not instant checkmarks');
context.updateGlitchEffects(1400);
assert.ok(belowSpikes.some(b => b.glitchNeutralized) && belowSpikes.some(b => !b.glitchNeutralized), 'hack spreads progressively');
context.updateGlitchEffects(3000);
assert.ok(belowSpikes.every(b => b.glitchNeutralized && b.glitchHackedByUltimate));
assert.equal(near.glitchNeutralized, true); assert.equal(Boolean(far.glitchNeutralized), false);
assert.equal(Boolean(deeper.glitchNeutralized), false);
context.transformGlitchHazard(belowSpikes[0], null, 1100);
assert.equal(belowSpikes[0].dead, true); assert.equal(run.health, 3); assert.equal(run.ultimateCharge, 0);
assert.equal(run.glitchScreen.kind, 'hack');

context.startGlitchChoice(2000);
assert.equal(run.glitchChoice.phase, 'choosing'); assert.equal(classes.has('hidden'), false);
assert.equal(context.selectGlitchBug('copy'), false);
assert.equal(context.selectGlitchBug('hack'), true);
assert.equal(context.selectGlitchBug('delete'), false, 'choice cannot be replaced during announcement');
assert.equal(run.glitchChoice.kind, 'hack'); assert.equal(run.animationId, 7);
assert.equal(announcement.children.length, 'ВЗЛОМ'.length);
assert.equal((html.match(/data-glitch-bug="(hack|delete|infect|change)"/g) || []).length, 4);
assert.match(source, /block\.flaskTier >= 3 \? 'stone-reinforced-liquid'/, 'rich vein artwork survives in fragile rock');
assert.doesNotMatch(source, /glitchClone|GLITCH_CLONE_MS/);
assert.match(source, /if \(run\.glitchChoice\)[\s\S]*?shiftRunClock\(timestamp - choice\.startedAt\);[\s\S]*?executeGlitchBug\(choice\.kind, timestamp\)/);
// Pixelation must keep the old renderer while reusing artwork and 90ms frames.
let captures = 0, pixelFrames = 0;
context.glitchTileCache = new Map(); context.glitchTileCacheRun = null;
context.menuReducedMotion = false;
context.ctx = { canvas: { width: 240 } };
context.document.createElement = () => ({ width: 0, height: 0, getContext: () => ({ clearRect() {}, drawImage() { captures++; } }) });
context.window.BlockEffectDraft = { drawGlitchBlock() { pixelFrames++; } };
vm.runInContext(take('glitchPixelTile'), context);
const cachedBlock = cell(14, 2);
context.glitchPixelTile(cachedBlock, 150, 1000);
context.glitchPixelTile(cachedBlock, 160, 1040);
assert.equal(captures, 1); assert.equal(pixelFrames, 1, 'camera motion reuses the pixelated frame');
context.glitchPixelTile(cachedBlock, 160, 1100);
assert.equal(captures, 1); assert.equal(pixelFrames, 2, 'only the 90ms effect frame is regenerated');
cachedBlock.hp--;
context.glitchPixelTile(cachedBlock, 160, 1101);
assert.equal(captures, 2, 'damage refreshes the underlying block artwork');
console.log('Glitch: safe stage II; larger partial deletion/rewards; radius-seven infection; ten-row +5-preserving rewrite; progressive twelve-row hack; original cached pixelation and four frozen choices passed.');
