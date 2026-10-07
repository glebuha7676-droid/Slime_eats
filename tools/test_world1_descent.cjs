const assert = require('node:assert/strict');
const descent = require('../js/generation/world1-descent.js');

const value = { 0: 0, 1: 1, 2: 3, 3: 5 };
for (let seed = 1; seed <= 250; seed += 1) {
  let state = seed;
  const random = () => ((state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296);
  const map = descent.build({ random });
  assert.equal(map.rows, 105);
  assert.equal(map.zoneRows, 35);
  assert.equal(map.cells.length, 105);
  let totalFlasks = 0;
  const zoneStats = [];

  for (let zone = 0; zone < 3; zone += 1) {
    const stats = { dense: 0, hard: 0, reinforced: 0, heal: 0, hazards: 0, flasks: 0 };
    for (let row = zone * 35; row < (zone + 1) * 35; row += 1) {
      assert.equal(map.cells[row].length, 6);
      const start = map.pathStarts[row];
      assert.ok(start >= 1 && start <= 3);
      for (const col of [start, start + 1]) assert.equal(map.cells[row][col].hazard, false);
      assert.ok(map.cells[row][start].tier !== 'reinforced' || map.cells[row][start + 1].tier !== 'reinforced');
      if (zone === 0 && row !== 0 && row !== 26) {
        assert.ok(map.cells[row][start].tier === 'dense' || map.cells[row][start + 1].tier === 'dense');
      }
      for (const cell of map.cells[row]) {
        assert.ok(!['bomb', 'jelly', 'slime'].includes(cell.special));
        if (cell.special === 'gel') stats.heal += 1;
        if (cell.hazard) stats.hazards += 1;
        else if (!cell.dead && stats[cell.tier] !== undefined) stats[cell.tier] += 1;
        stats.flasks += value[cell.flaskTier];
        if (cell.flaskTier) {
          assert.equal(cell.hazard, false);
          assert.equal(cell.dead, false);
          assert.equal(value[cell.flaskTier], { dense: 1, hard: 3, reinforced: 5 }[cell.tier]);
        }
      }
    }
    assert.equal(stats.heal, 1);
    assert.equal(stats.hazards, 5);
    const safeRewards = map.cells.slice(zone * 35, (zone + 1) * 35)
      .flat().filter(cell => cell.path && cell.flaskTier).length;
    const riskyRewards = map.cells.slice(zone * 35, (zone + 1) * 35)
      .flat().filter(cell => !cell.path && cell.flaskTier).length;
    assert.ok(safeRewards >= 5);
    assert.ok(riskyRewards >= 5);
    if (zone === 0) assert.equal(stats.reinforced, 0);
    zoneStats.push(stats);
    totalFlasks += stats.flasks;
  }
  assert.ok(zoneStats[0].dense > zoneStats[0].hard);
  assert.ok(zoneStats[1].hard > zoneStats[1].dense);
  assert.ok(zoneStats[2].reinforced > zoneStats[1].reinforced);
  assert.ok(totalFlasks >= 100 && totalFlasks <= 150, `seed ${seed}: ${totalFlasks}`);

  for (const hazard of map.hazards) {
    const cell = map.cells[hazard.row][hazard.col];
    assert.equal(cell.hazard, true);
    assert.equal(cell.dead, false);
    if (hazard.kind === 'horizontal') {
      assert.equal(cell.motion.axis, 'x');
      for (let col = cell.motion.from; col <= cell.motion.to; col += 1) {
        if (col !== hazard.col) assert.equal(map.cells[hazard.row][col].dead, true);
        assert.equal(map.cells[hazard.row][col].path, false);
      }
    }
    if (hazard.kind === 'vertical') {
      assert.equal(cell.motion.axis, 'y');
      for (let row = cell.motion.from; row <= cell.motion.to; row += 1) {
        if (row !== hazard.row) assert.equal(map.cells[row][hazard.col].dead, true);
        assert.equal(map.cells[row][hazard.col].path, false);
      }
    }
  }
}
console.log('World 1 descent: 250 layouts satisfy depth, zone balance, flask budget and safe-route invariants.');
