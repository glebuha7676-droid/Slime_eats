const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
for (const file of ['js/config/ultimate-stages.js', 'js/abilities/techno-ultimates.js']) {
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
}
const Techno = context.window.SlimeTechnoUltimates;
const stages = context.window.SlimeUltimateStages;
const drone = { x: 160, y: 90 };
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
    const line = Array.from({ length: 6 }, (_, col) => ({ row, col, y: row * 60, h: 60,
      hp: row === 3 && col === 3 ? 1 : 3 }));
    blocksByRow.set(row, line);
    blocks.push(...line);
  }
  const run = {
    ultimateStage: stage, slime: { x: 210, y: 140, radius: 22 },
    cellSize: 60, gridOffsetX: 0, blockRowOrigin: 0, columns: 6, blocksByRow,
    nanoNextShotAt: 1000, nanoShots: []
  };
  const at = time => Techno.update(run, time, drone, { ...services, blocksNearY: () => blocks });
  const block = (row, col = 3) => blocksByRow.get(row)[col];
  return { run, at, block };
}

{
  const { run, at, block } = field(1);
  at(999);
  assert.equal(run.nanoShots.length, 0);
  at(1000);
  assert.equal(run.nanoShots[0].fromY, drone.y);
  assert.equal(run.nanoShots[0].piercing, false);
  assert.equal(block(2).hp, 3, 'Damage waits for the projectile to travel from the drone');
  at(1180);
  assert.equal(block(2).hp, 2);
  assert.equal(block(3).hp, 1);
  assert.equal(block(2, 2).hp, 3);
  at(1999);
  assert.equal(run.nanoLastShotAt, 1000);
  at(2000);
  assert.equal(run.nanoLastShotAt, 2000);
}

{
  const { run, at, block } = field(2);
  Techno.startBurst(run, 1000);
  at(1000);
  const shot = run.nanoShots[0];
  assert.equal(shot.piercing, true);
  at(1090);
  assert.equal(block(2).hp, 2);
  assert.equal(block(3).dead, true);
  assert.equal(shot.impacts.length, 2);
  assert.equal(shot.impacts[0].through, true);
  assert.equal(shot.impacts[1].through, false);
  at(1105);
  at(1195);
  assert.equal(block(2).hp, 1);
  assert.equal(block(4).hp, 2);

  Techno.shiftClock(run, 500);
  assert.equal(run.nanoBurst.nextAt, 1710);
  assert.equal(run.nanoLastShotAt, 1605);
  for (const time of [1710, 1815, 1920, 2025]) at(time);
  assert.equal(run.nanoBurst, null);
  assert.equal(run.nanoLastShotAt, 2025);
  at(3000);
  assert.equal(run.nanoLastShotAt, 2025);
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
  const { run, block } = field(3);
  run.mechSuit = { contacts: new Map() };
  const cut = at => Techno.drill(run, at, services.damageBlockByElement);
  assert.equal(cut(1000).hits, 0);
  assert.equal(cut(1061).hits, 0);
  assert.equal(cut(1062).hits, 4);
  assert.equal(block(2, 3).hp, 1);
  assert.equal(block(3, 3).dead, true);
  assert.equal(cut(1166).hits, 0);
  assert.equal(cut(1167).broken, 3);
  for (const [row, col] of [[2, 3], [2, 4], [3, 3], [3, 4]]) assert.equal(block(row, col).dead, true);
  assert.equal(block(2, 2).hp, 3);
  assert.equal(block(4, 3).hp, 3);
  run.slime.x -= 60;
  assert.equal(cut(1180).hits, 0);
  assert.equal(cut(1242).hits, 2);
}

assert.equal(stages.get('nano', 3).mechMs, 5000);
console.log('Techno: 1 second cadence, 6-shot burst, piercing, pause, shields and 2×2 drill passed.');
