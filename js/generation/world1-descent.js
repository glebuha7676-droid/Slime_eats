(() => {
  'use strict';

  // One continuous 750 m descent. The layout is made before blocks are built so
  // rewards, hazards and the guaranteed hazard-free route share the same map.
  const ZONE_ROWS = 35;
  const ROWS = ZONE_ROWS * 3;
  const REWARD_VALUES = { dense: 1, hard: 3, reinforced: 5 };
  const ROCK_WEIGHTS = [
    { dense: 68, hard: 32, reinforced: 0 },
    { dense: 24, hard: 60, reinforced: 16 },
    { dense: 17, hard: 48, reinforced: 35 }
  ];
  const PATH_WEIGHTS = [
    { dense: 78, hard: 22, reinforced: 0 },
    { dense: 30, hard: 62, reinforced: 8 },
    { dense: 25, hard: 52, reinforced: 23 }
  ];

  function weightedTier(weights, random) {
    const roll = random() * 100;
    return roll < weights.dense ? 'dense'
      : roll < weights.dense + weights.hard ? 'hard' : 'reinforced';
  }

  function build({ columns = 6, random = Math.random } = {}) {
    if (columns < 6) throw new Error('World 1 descent needs at least six columns');
    const cells = Array.from({ length: ROWS }, () => Array(columns));
    const pathStarts = [];
    let pathStart = Math.floor((columns - 2) / 2);
    for (let row = 0; row < ROWS; row += 1) {
      const zone = Math.floor(row / ZONE_ROWS);
      if (row > 3 && row % 4 === 0 && random() < .68) {
        pathStart = Math.max(1, Math.min(columns - 3, pathStart + (random() < .5 ? -1 : 1)));
      }
      pathStarts.push(pathStart);
      for (let col = 0; col < columns; col += 1) {
        const path = col === pathStart || col === pathStart + 1;
        const neighbor = row > 1 && random() < .2
          ? cells[row - 1][col]
          : col > 0 && random() < .2 ? cells[row][col - 1] : null;
        const tier = neighbor && (zone > 0 || neighbor.tier !== 'reinforced')
          ? neighbor.tier : weightedTier(path ? PATH_WEIGHTS[zone] : ROCK_WEIGHTS[zone], random);
        const empty = row > 0 && random() < (path ? .25 : .075);
        cells[row][col] = { tier, dead: empty, path, hazard: false, special: null, flaskTier: 0, motion: null };
      }
      const leftPath = cells[row][pathStart];
      const rightPath = cells[row][pathStart + 1];
      if (zone === 0 && leftPath.tier === 'hard' && rightPath.tier === 'hard') leftPath.tier = 'dense';
      if (leftPath.tier === 'reinforced' && rightPath.tier === 'reinforced') rightPath.tier = 'hard';
    }

    // The first row is surface earth, not a dangerous or rewarding row.
    for (const cell of cells[0]) Object.assign(cell, { tier: 'soft', dead: false, path: true });

    const hazards = [];
    for (let zone = 0; zone < 3; zone += 1) {
      for (const local of [7, 12, 18, 24, 30]) {
        const row = zone * ZONE_ROWS + local + Math.floor(random() * 3) - 1;
        const start = pathStarts[row];
        const side = start >= 2 ? 0 : columns - 1;
        const neighbor = side === 0 ? 1 : columns - 2;
        const kind = local === 18 ? 'horizontal' : local === 30 ? 'vertical' : 'static';
        let hazardCol = side;
        let motion = null;
        if (kind === 'horizontal') {
          const from = side === 0 ? 0 : Math.max(start + 2, columns - 3);
          const to = side === 0 ? Math.min(start - 1, 2) : columns - 1;
          hazardCol = Math.round((from + to) / 2);
          for (let col = from; col <= to; col += 1) cells[row][col].dead = true;
          motion = { axis: 'x', from, to, phase: random() * Math.PI * 2, period: 5400 + random() * 1000 };
        } else if (kind === 'vertical') {
          for (let current = row - 1; current <= row + 1; current += 1) cells[current][side].dead = true;
          motion = { axis: 'y', from: row - 1, to: row + 1, phase: random() * Math.PI * 2, period: 6200 + random() * 1000 };
        }
        const spike = cells[row][hazardCol];
        Object.assign(spike, { dead: false, tier: 'dense', hazard: true, path: false, motion, flaskTier: 0 });
        hazards.push({ row, col: hazardCol, side, kind });

        // The nearby flask is optional. The two-column central route has no spikes.
        const rewardRow = kind === 'static' ? row : row + 2;
        const rewardCol = kind === 'horizontal' && Math.abs(neighbor - hazardCol) < 2
          ? (side === 0 ? 0 : columns - 1) : neighbor;
        const reward = cells[rewardRow][rewardCol];
        if (!reward.hazard && !reward.special) {
          reward.dead = false;
          reward.flaskTier = reward.tier === 'reinforced' ? 3 : reward.tier === 'hard' ? 2 : 1;
        }
      }

      // A few rewards lie on the easy descent. The rest invite a deliberate
      // detour toward the side pockets and their spikes.
      for (const local of [3, 9, 15, 21, 27, 33]) {
        const row = zone * ZONE_ROWS + local;
        const col = pathStarts[row] + (random() < .5 ? 0 : 1);
        const reward = cells[row][col];
        if (reward.hazard || reward.special) continue;
        reward.dead = false;
        reward.flaskTier = reward.tier === 'reinforced' ? 3 : reward.tier === 'hard' ? 2 : 1;
      }

      // At most one medkit per 250 m, placed on the safe route.
      const healRow = zone * ZONE_ROWS + 26;
      const heal = cells[healRow][pathStarts[healRow]];
      Object.assign(heal, { dead: false, tier: 'special', special: 'gel', hazard: false, flaskTier: 0 });
    }

    // Fixed value budgets keep each run comparable despite random rock placement.
    const targets = [33, 42, 48];
    for (let zone = 0; zone < 3; zone += 1) {
      const first = zone * ZONE_ROWS;
      let value = 0;
      for (let row = first; row < first + ZONE_ROWS; row += 1) {
        for (const cell of cells[row]) if (cell.flaskTier) value += REWARD_VALUES[cell.tier];
      }
      const candidates = [];
      for (let row = first + 2; row < first + ZONE_ROWS - 2; row += 1) {
        for (let col = 0; col < columns; col += 1) {
          const cell = cells[row][col];
          if (!cell.dead && !cell.hazard && !cell.special && !cell.flaskTier) candidates.push({ row, col, cell });
        }
      }
      // Spread rewards across depth, with some on the easy route and some off it.
      candidates.sort((a, b) => ((a.row * 13 + a.col * 7) % 31) - ((b.row * 13 + b.col * 7) % 31));
      let lastRewardRow = first - 3;
      while (value < targets[zone] && candidates.length) {
        let index = candidates.findIndex(({ row }) => row >= lastRewardRow + 2);
        if (index < 0) index = 0;
        const { row, cell } = candidates.splice(index, 1)[0];
        cell.flaskTier = cell.tier === 'reinforced' ? 3 : cell.tier === 'hard' ? 2 : 1;
        value += REWARD_VALUES[cell.tier];
        lastRewardRow = row;
      }
    }

    return { rows: ROWS, zoneRows: ZONE_ROWS, cells, pathStarts, hazards };
  }

  const api = Object.freeze({ ROWS, ZONE_ROWS, build });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SlimeWorld1Descent = api;
})();
