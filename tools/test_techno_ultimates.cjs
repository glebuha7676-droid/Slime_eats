const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
for (const file of ['js/config/ultimate-stages.js', 'js/abilities/techno-ultimates.js']) {
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
}
const Techno = context.window.SlimeTechnoUltimates;
const stages = context.window.SlimeUltimateStages;
const drone = { x: 210, y: 90 };
const services = {
  elementalDamageable: block => !block.dead && !block.unbreakable,
  damageBlockByElement(block, amount) {
    block.hp = Math.max(0, block.hp - amount);
    return (block.dead = block.hp === 0);
  },
  sound() {}
};

function field(stage) {
  const blocks = [];
  const blocksByRow = new Map();
  for (let row = 0; row < 12; row += 1) {
    const line = Array.from({ length: 6 }, (_, col) => ({ row, col, x: col * 60, y: row * 60, w: 60, h: 60,
      hp: row === 3 && col === 3 ? 1 : 3 }));
    blocksByRow.set(row, line);
    blocks.push(...line);
  }
  const run = {
    ultimateStage: stage, slime: { x: 210, y: 140, radius: 22 },
    cellSize: 60, gridOffsetX: 0, blockRowOrigin: 0, columns: 6, blocksByRow,
    nanoNextShotAt: 1000, nanoShots: []
  };
  const sounds = [];
  const at = time => Techno.update(run, time, drone, { ...services, blocksNearY: () => blocks,
    sound: name => sounds.push({ name, time }) });
  const block = (row, col = 3) => blocksByRow.get(row)[col];
  return { run, at, block, sounds };
}

{
  const { run, at, block, sounds } = field(1);
  at(999);
  assert.equal(run.nanoShots.length, 0);
  at(1000);
  assert.equal(run.nanoShots[0].fromY, drone.y);
  assert.equal(run.nanoShots[0].piercing, false);
  assert.equal(block(2).hp, 3, 'Damage waits for the projectile to travel from the drone');
  at(1060);
  assert.equal(block(2).hp, 3);
  at(1110);
  assert.equal(block(2).hp, 2);
  assert.equal(block(3).hp, 1);
  assert.equal(block(2, 2).hp, 3);
  at(1999);
  assert.equal(run.nanoLastShotAt, 1000);
  at(2000);
  assert.equal(run.nanoLastShotAt, 2000);
  assert.deepEqual(sounds.map(sound => sound.name), ['technoShot', 'technoShot']);
}

{
  const { run, at, block, sounds } = field(2);
  Techno.startBurst(run, 1000);
  const first = 1000 + Techno.BURST_CHARGE_MS;
  at(first - 1);
  assert.equal(run.nanoShots.length, 0, 'The muzzle has time to charge');
  at(first);
  const shot = run.nanoShots[0];
  assert.equal(shot.piercing, true);
  at(first + 115);
  assert.equal(block(2).hp, 2);
  assert.equal(block(3).hp, 1, 'Piercing reaches the second block after the first');
  at(first + 165);
  assert.equal(block(3).dead, true);
  assert.equal(shot.impacts.length, 2);
  assert.equal(shot.impacts[0].through, true);
  assert.equal(shot.impacts[1].through, false);
  const second = run.nanoBurst.nextAt;
  assert(second - first >= 250);
  at(second);
  at(second + 272);
  assert.equal(block(2).hp, 1);
  assert.equal(block(4).hp, 2);

  const next = run.nanoBurst.nextAt;
  const last = run.nanoLastShotAt;
  Techno.shiftClock(run, 500);
  assert.equal(run.nanoBurst.nextAt, next + 500);
  assert.equal(run.nanoLastShotAt, last + 500);
  for (let i = 0; i < 3; i += 1) at(run.nanoBurst.nextAt);
  assert.equal(run.nanoBurst, null);
  const end = run.nanoLastShotAt;
  at(end + 999);
  assert.equal(run.nanoLastShotAt, end);
  assert.equal(sounds.length, 6);
  assert(sounds.every(sound => sound.name === 'technoPierceShot'));
}

{
  const { run, at, block } = field(2);
  block(2).unbreakable = true;
  at(1000);
  at(1180);
  assert.equal(block(2).hp, 3);
  assert.equal(block(3).hp, 1);
}

{
  const { run, at, block } = field(2);
  for (let row = 0; row < 9; row += 1) block(row).dead = true;
  at(1000);
  const shot = run.nanoShots[0];
  run.nanoNextShotAt = Infinity;
  assert.equal(shot.toY - shot.fromY, 8 * run.cellSize);
  at(shot.rangeEndAt);
  assert.equal(block(9).hp, 2, 'The last reachable tile receives the shot');
  assert.equal(block(10).hp, 3, 'An out-of-range tile cannot be hit');
  assert.equal(Techno.shotY(shot, shot.rangeEndAt + 50), shot.toY);
  assert.equal(run.nanoShots.length, 1, 'The bolt stays alive during its dissolve');
  at(shot.rangeEndAt + Techno.SHOT_FADE_MS + 100);
  assert.equal(run.nanoShots.length, 0);
}

{
  const { run, block } = field(3);
  run.mechSuit = { contacts: new Map() };
  for (const line of [0, 1, 2]) for (const tile of run.blocksByRow.get(line)) tile.dead = true;
  run.slime.x = 240;
  run.slime.y = 98;
  const cut = (at, from = run.slime.y) => Techno.drill(run, at, services.damageBlockByElement, from);
  assert.equal(cut(980).sparks.length, 0, 'A gap above the rock stays clear');
  run.slime.y = 100;
  const first = cut(1000, 98);
  assert.equal(first.hits, 0);
  assert(first.loaded && first.sparks.length === 2);
  run.slime.y = 108;
  assert(cut(1010, 100).stopY < run.slime.y, 'The tips resist downward movement while in contact');
  run.slime.y = 103;
  assert.equal(cut(1061).hits, 0);
  assert.equal(cut(1062).hits, 2);
  assert.equal(block(3, 4).hp, 1);
  assert.equal(block(3, 3).dead, true);
  assert.equal(cut(1167).broken, 1);
  assert.equal(block(3, 2).hp, 3);
  assert.equal(block(4, 4).hp, 3, 'Rows the tips have not reached take no damage');
  block(4, 3).unbreakable = true;
  run.slime.y = 161;
  assert(cut(1200, 158).loaded);
  assert.equal(cut(1262).hits, 1);
  assert.equal(block(4, 3).hp, 3);
  assert.equal(block(4, 4).hp, 1);
}

assert.equal(stages.get('nano', 3).mechMs, 6000);
console.log('Techno: one cue per shot, spaced six-shot burst, eight-cell range, piercing, pause, shields and drill contact passed.');
