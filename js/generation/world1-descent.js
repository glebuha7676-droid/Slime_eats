(() => {
  'use strict';

  const ZONE_ROWS = 35;
  const ROWS = ZONE_ROWS * 3;
  const REWARD_VALUES = { dense: 1, hard: 3, reinforced: 5 };
  const ROCK_WEIGHTS = [
    { dense: 68, hard: 32, reinforced: 0 },
    { dense: 28, hard: 60, reinforced: 12 },
    { dense: 35, hard: 35, reinforced: 30 }
  ];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const isRock = cell => !!cell && !cell.dead && !cell.hazard && !cell.special && cell.tier !== 'soft';

  function weightedTier(weights, random) {
    const roll = random() * (weights.dense + weights.hard + weights.reinforced);
    return roll < weights.dense ? 'dense'
      : roll < weights.dense + weights.hard ? 'hard' : 'reinforced';
  }

  function planEncounters(columns, random) {
    const shuffled = items => {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i -= 1) {
        const other = Math.floor(random() * (i + 1));
        [result[i], result[other]] = [result[other], result[i]];
      }
      return result;
    };
    const encounters = [];
    const startOnLeft = random() < .5;
    const centerPatrolZone = 0;
    let sideIndex = 0;
    for (let zone = 0; zone < 3; zone += 1) {
      // Four pressure events plus a quiet ore pocket in a recovery interval.
      const types = zone === 1
        ? [...shuffled(['side-three', 'horizontal', 'center-four']), 'vertical']
        : shuffled(['side-three', 'side-three', 'horizontal', 'center-four']);
      if (zone === 1 && types[0] === 'horizontal') [types[0], types[1]] = [types[1], types[0]];
      if (zone === 0 && types[0] === 'center-four') [types[0], types[3]] = [types[3], types[0]];
      // Leave rock below the patrol for its guarded currency vein.
      if (zone === 2 && types[3] === 'horizontal') [types[0], types[3]] = [types[3], types[0]];
      const locals = zone === 2 ? [3, 11, 19, 32] : [5, 13, 21, 29];
      const local = [];
      for (let index = 0; index < types.length; index += 1) {
        const kind = types[index];
        const row = zone * ZONE_ROWS + locals[index] + Math.floor(random() * 2);
        const centerPatrol = kind === 'horizontal' && zone === centerPatrolZone;
        const fullWidth = kind === 'horizontal' && zone === 1;
        const side = kind === 'center-four' || centerPatrol || fullWidth ? -1 : (sideIndex++ % 2 === (startOnLeft ? 0 : 1) ? 0 : columns - 1);
        const nextFirst = index < 3 ? zone * ZONE_ROWS + locals[index + 1] - (zone === 1 && index === 2 ? 1 : 0) : (zone + 1) * ZONE_ROWS + 4;
        const maxHeight = Math.min(3, nextFirst - row - 4, (zone + 1) * ZONE_ROWS - row,
          zone === 2 && index === 2 ? zone * ZONE_ROWS + 23 - row : 3);
        const choices = kind === 'side-three'
          ? [{ variant: 'bar', height: 1 }, { variant: 'corner', height: 2 }, { variant: 'up-chevron', height: 2 }, { variant: 'descending-stair', height: 3 }, { variant: 'terrace', height: 3 }]
          : kind === 'center-four'
            ? [{ variant: 'square', height: 2 }, { variant: 'double-gate', height: 3 }, { variant: 'staggered', height: 3 }, { variant: 'side-gates', height: 3 }]
            : kind === 'horizontal'
              ? fullWidth ? [{ variant: 'full-width', height: 1 }]
                : centerPatrol ? [{ variant: 'center-patrol', height: 1 }]
                  : [{ variant: 'side-patrol', height: 1 }, { variant: 'wide-patrol', height: 1 }]
              : [{ variant: 'vertical', height: 1 }];
        const valid = choices.filter(choice => choice.height <= maxHeight);
        const { variant, height } = valid[Math.floor(random() * valid.length)];
        const center = Math.floor(columns / 2) - 1;
        const bypasses = variant === 'side-gates' ? [center]
          : kind === 'center-four' || centerPatrol ? [0, columns - 2]
            : variant === 'wide-patrol' ? [side === 0 ? columns - 2 : 0]
              : side === 0 ? [3, columns - 2] : [0, columns - 5];
        local.push({ zone, row, side, kind, variant, center,
          firstRow: kind === 'vertical' ? row - 1 : row,
          lastRow: kind === 'vertical' ? row + 1 : row + height - 1,
          timed: fullWidth, preferred: bypasses[Math.floor(random() * bypasses.length)] });
      }
      const before = local[Math.floor(random() * 3)];
      const variant = random() < .5 ? 'seam' : 'pocket';
      const preferred = before.side === 0 ? columns - 3 : before.side === -1 && variant === 'pocket' ? columns - 2 : 1;
      local.push({ zone, row: before.lastRow + 3, side: -1, kind: 'quiet-deposit', variant,
        center: Math.floor(columns / 2) - 1, firstRow: before.lastRow + 3, lastRow: before.lastRow + 4, preferred });
      local.sort((a,b) => a.firstRow - b.firstRow);
      local.forEach((item,index) => encounters.push({ ...item, index, id: encounters.length }));
    }
    return encounters;
  }

  function placeEncounters(cells, encounters, columns, random) {
    const hazards = [];
    const spike = (encounter, row, col, motion = null) => {
      Object.assign(cells[row][col], { tier: 'dense', dead: false, hazard: true, motion, encounterId: encounter.id });
      hazards.push({ row, col, side: encounter.side, kind: motion ? (motion.axis === 'x' ? 'horizontal' : 'vertical') : 'static', encounterId: encounter.id });
    };
    const air = (row, col, id) => Object.assign(cells[row][col], { tier: 'dense', dead: true, corridorId: id });
    for (const encounter of encounters) {
      const { row, kind, side, center, variant } = encounter;
      if (kind === 'quiet-deposit') continue;
      if (kind === 'center-four') {
        const pattern = variant === 'square' ? [[0,center],[0,center+1],[1,center],[1,center+1]]
          : variant === 'double-gate' ? [[0,center],[0,center+1],[2,center],[2,center+1]]
            : variant === 'staggered' ? [[0,center],[1,center],[1,center+1],[2,center+1]]
              : [[0,center-1],[0,center+2],[2,center-1],[2,center+2]];
        for (const [y, col] of pattern) spike(encounter, row + y, col);
      } else if (kind === 'side-three') {
        const col = side === 0 ? 0 : columns - 1;
        const inward = side === 0 ? 1 : -1;
        const pattern = variant === 'bar' ? [[0,0],[0,1],[0,2]]
          : variant === 'corner' ? [[0,0],[0,1],[1,1]]
            : variant === 'up-chevron' ? [[0,1],[1,0],[1,2]]
              : variant === 'terrace' ? [[0,1],[0,2],[2,0]] : [[0,2],[1,1],[2,0]];
        for (const [y, x] of pattern) spike(encounter, row + y, col + inward * x);
      } else if (kind === 'horizontal') {
        const centered = variant === 'center-patrol';
        const fullWidth = variant === 'full-width';
        const period = fullWidth ? 7200 + random() * 1000 : 5400 + random() * 1200;
        {
          const width = fullWidth ? columns : variant === 'wide-patrol' ? 4 : centered ? 2 : 3;
          const from = fullWidth ? 0 : centered ? center : side === 0 ? 0 : columns - width;
          const to = from + width - 1;
          for (let col = from; col <= to; col += 1) { air(row, col, encounter.id); cells[row][col].timed = fullWidth; }
          spike(encounter, row, from, { axis: 'x', from, to, phase: random() * Math.PI * 2, period });
        }
      } else {
        for (let current = row - 1; current <= row + 1; current += 1) air(current, side, encounter.id);
        spike(encounter, row, side, { axis: 'y', from: row - 1, to: row + 1,
          phase: random() * Math.PI * 2, period: 6600 + random() * 1000 });
      }
    }
    return hazards;
  }

  function planRoute(cells, encounters, columns, random) {
    // Find a continuous two-column bypass while leaving the other fork open.
    // Look ahead before choosing lanes, so two valid traps cannot form a dead end.
    const desired = [];
    let drift = Math.floor((columns - 2) / 2);
    for (let row = 0; row < ROWS; row += 1) {
      if (row > 3 && row % 5 === 0 && random() < .55) drift = clamp(drift + (random() < .5 ? -1 : 1), 0, columns - 2);
      desired[row] = drift;
    }
    for (const encounter of encounters) {
      for (let row = encounter.firstRow - 2; row <= Math.min(ROWS - 1, encounter.lastRow + 2); row += 1) desired[row] = encounter.preferred;
    }
    const costs = [], previous = [];
    for (let row = 0; row < ROWS; row += 1) {
      costs[row] = Array(columns - 1).fill(Infinity);
      previous[row] = Array(columns - 1).fill(-1);
      for (let start = 0; start <= columns - 2; start += 1) {
        // Include body clearance above and below a threat, not only its tile.
        let blocked = false;
        for (let neighborRow = Math.max(0, row - 1); neighborRow <= Math.min(ROWS - 1, row + 1); neighborRow += 1) {
          if ([cells[neighborRow][start], cells[neighborRow][start + 1]].some(cell => !cell.timed && (cell.dead || cell.hazard))) { blocked = true; break; }
        }
        if (blocked) continue;
        const preference = Math.abs(start - desired[row]) * .3;
        if (row === 0) costs[row][start] = Math.abs(start - Math.floor((columns - 2) / 2)) + preference;
        else for (let before = Math.max(0, start - 1); before <= Math.min(columns - 2, start + 1); before += 1) {
          const cost = costs[row - 1][before] + preference + Math.abs(start - before) * .6;
          if (cost < costs[row][start]) { costs[row][start] = cost; previous[row][start] = before; }
        }
      }
    }
    let start = costs[ROWS - 1].indexOf(Math.min(...costs[ROWS - 1]));
    if (!Number.isFinite(costs[ROWS - 1][start])) throw new Error('World 1 encounter plan has no continuous bypass');
    const pathStarts = Array(ROWS);
    for (let row = ROWS - 1; row >= 0; row -= 1) {
      pathStarts[row] = start;
      start = previous[row][start];
    }
    const guideCols = [];
    let guide = pathStarts[0];
    for (let row = 0; row < ROWS; row += 1) {
      const start = pathStarts[row];
      const previousGuide = guide;
      guide = clamp(guide, start, start + 1);
      if (row % 6 === 0 && random() < .4) guide = clamp(guide + (random() < .5 ? -1 : 1), Math.max(start, previousGuide - 1), Math.min(start + 1, previousGuide + 1));
      guideCols[row] = guide;
      cells[row][start].path = cells[row][start + 1].path = true;
      cells[row][guide].guide = true;
    }
    return { pathStarts, guideCols };
  }

  function planDeposits(encounters, cells, columns, random) {
    const deposits = [];
    const selected = [];
    for (let zone = 0; zone < 3; zone += 1) {
      const local = encounters.filter(item => item.zone === zone);
      const guarded = local.filter(item => item.kind !== 'quiet-deposit' && item.kind !== 'vertical'
        && item.lastRow + 5 < (zone + 1) * ZONE_ROWS).map(item => ({ item,
          rank: random() - (item.variant === 'center-patrol' || item.variant === 'full-width' ? 1 : 0) })).sort((a, b) => a.rank - b.rank);
      selected.push(...guarded.slice(0, 2).map(({ item }, index) => ({ encounter: item, rich: index === 1 })),
        { encounter: local.find(item => item.kind === 'quiet-deposit'), rich: false });
    }
    for (const { encounter, rich } of selected) {
      const guarded = encounter.kind !== 'quiet-deposit';
      const firstRow = guarded ? encounter.lastRow + 3 : encounter.row;
      const lastSide = encounter.side;
      const col = !guarded ? encounter.preferred : lastSide === -1 ? encounter.center : lastSide === 0 ? 0 : columns - 2;
      const core = [], growth = [];
      const pocket = [[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]];
      const seam = [[0,-1],[0,0],[1,0],[1,1],[1,2],[2,1]];
      const occupied = new Set(deposits.flatMap(item => [...item.core,...item.growth].map(spot => `${spot.row}:${spot.col}`)));
      const shapes = !guarded && encounter.variant === 'seam' ? [seam,pocket] : [pocket];
      const positions = Array.from({length:columns},(_,column)=>column).sort((a,b)=>Math.abs(a-col)-Math.abs(b-col));
      let coordinates, base;
      for (const shape of shapes) {
        base = positions.find(column => shape.slice(0,4).every(([y,x]) => {
          const row = firstRow+y, c = column+x;
          return row < (encounter.zone+1)*ZONE_ROWS && isRock(cells[row]?.[c]) && !occupied.has(`${row}:${c}`);
        }));
        if (base !== undefined) { coordinates = shape; break; }
      }
      if (!coordinates) throw new Error('World 1 ore pockets overlap');
      for (const [index,[y,x]] of coordinates.entries()) {
        const row = firstRow+y, column = base+x;
        if (row >= (encounter.zone+1)*ZONE_ROWS || !isRock(cells[row]?.[column]) || occupied.has(`${row}:${column}`)) continue;
        (index < 4 ? core : growth).push({row,col:column});
      }
      deposits.push({ id: deposits.length, zone: encounter.zone, guardId: guarded ? encounter.id : null,
        encounterId: encounter.id, guarded, rich, minRow: firstRow, maxRow: Math.min(firstRow + 4, (encounter.zone + 1) * ZONE_ROWS - 1), core, growth, cells: [], value: 0 });
    }
    return deposits;
  }

  function fillRockSection(cells, pathStarts, guideCols, encounters, deposits, hardBand, zone, columns, random) {
    const first = zone * ZONE_ROWS;
    let count = 0;
    for (let row = first; row < first + ZONE_ROWS; row += 1) for (const cell of cells[row]) if (isRock(cell)) count += 1;
    const weights = ROCK_WEIGHTS[zone];
    const remaining = { dense: Math.round(count * weights.dense / 100), reinforced: Math.round(count * weights.reinforced / 100) };
    remaining.hard = count - remaining.dense - remaining.reinforced;
    const assign = (cell, tier) => {
      if (!isRock(cell) || cell.tier) return;
      if (remaining[tier] <= 0) tier = weightedTier(remaining, random);
      cell.tier = tier;
      remaining[tier] -= 1;
    };
    // The fragile seam is allocated before ore or dense strata. It stays
    // connected through every rock row, including the reinforced band.
    for (let row = first; row < first + ZONE_ROWS; row += 1) assign(cells[row][guideCols[row]], 'dense');
    const localDeposits = deposits.filter(item => item.zone === zone);
    for (const deposit of localDeposits) {
      const richOnly = zone === 2 && deposit.rich && random() < .18;
      const sequence = richOnly ? ['reinforced'] : zone === 0 ? ['dense','hard','hard','dense']
        : ['dense','hard','reinforced','hard'];
      deposit.core.forEach(({row,col},index) => assign(cells[row][col], sequence[index % sequence.length]));
    }
    const localEncounters = encounters.filter(item => item.zone === zone);
    for (const encounter of localEncounters.filter(item => item.kind === 'center-four' && item.variant !== 'side-gates')) {
      const alternative = pathStarts[encounter.row] === 0 ? columns - 2 : 1;
      for (let row = encounter.row - 1; row <= Math.min(first + ZONE_ROWS - 1, encounter.lastRow + 1); row += 1) {
        const cell = cells[row][alternative];
        if (!isRock(cell)) continue;
        cell.branch = true;
        assign(cell, 'dense');
      }
    }
    // Widen some connected stretches to two or three tiles rather than
    // scattering all fragile rock into isolated random specks.
    for (let row = first; row < first + ZONE_ROWS; row += 1) {
      if (row % 8 >= 4 || remaining.dense <= 8) continue;
      const guide = guideCols[row];
      const adjacent = guide === pathStarts[row] ? guide + 1 : guide - 1;
      assign(cells[row][adjacent], 'dense');
      if (zone !== 1 && row % 8 === 1 && remaining.dense > 8) {
        const outer = clamp(adjacent + (adjacent > guide ? 1 : -1), 0, columns - 1);
        assign(cells[row][outer], 'dense');
      }
    }
    if (zone === 2) for (let row = hardBand.from; row <= hardBand.to; row += 1) {
      for (const cell of cells[row]) assign(cell, random() < .7 ? 'reinforced' : 'hard');
    }
    // Correlated patches form strata; fixed quotas keep difficulty comparable.
    for (let row = first; row < first + ZONE_ROWS; row += 1) {
      const reversed = random() < .5;
      for (let offset = 0; offset < columns; offset += 1) {
        const col = reversed ? columns - offset - 1 : offset;
        const cell = cells[row][col];
        if (!isRock(cell) || cell.tier) continue;
        const above = row > first ? cells[row - 1][col] : null;
        const beside = cells[row][col + (reversed ? 1 : -1)];
        const neighbor = random() < .5 ? above : beside;
        const tier = neighbor && remaining[neighbor.tier] > 0 && random() < .55
          ? neighbor.tier : weightedTier(remaining, random);
        assign(cell, tier);
      }
    }
  }

  function placeRewards(cells, pathStarts, encounters, deposits, zone, random) {
    const first = zone * ZONE_ROWS;
    const target = [45, 65, 80][zone] + Math.floor(random() * [16, 11, 21][zone]);
    let value = 0;
    const mark = (row, col, deposit = null) => {
      const cell = cells[row]?.[col];
      if (!cell || !isRock(cell)) return false;
      if (deposit && (row < deposit.minRow || row > deposit.maxRow)) return false;
      if (encounters.some(item => item.zone === zone && ['side-three','center-four','horizontal'].includes(item.kind)
        && row > item.lastRow && row < item.lastRow + 3)) return false;
      if (deposit && cell.depositId >= 0 && cell.depositId !== deposit.id) return false;
      const added = cell.flaskTier ? 0 : REWARD_VALUES[cell.tier];
      if (value + added > target) return false;
      cell.flaskTier = cell.tier === 'reinforced' ? 3 : cell.tier === 'hard' ? 2 : 1;
      value += added;
      if (deposit && cell.depositId !== deposit.id) {
        cell.depositId = deposit.id;
        deposit.cells.push({ row, col });
        deposit.value += REWARD_VALUES[cell.tier];
      }
      return true;
    };
    // Reserve the guarded deposit cores before distributing the easier rewards.
    const localDeposits = deposits.filter(item => item.zone === zone);
    for (const deposit of localDeposits) for (const spot of deposit.core) mark(spot.row, spot.col, deposit);
    // A modest baseline sits in connected pairs on the guiding lane.
    for (const local of [3, 15, 33]) {
      const row = first + local;
      const col = Math.max(pathStarts[row], pathStarts[row + 1]);
      mark(row, col); mark(row + 1, col);
    }
    for (const deposit of localDeposits) for (const spot of deposit.growth) mark(spot.row, spot.col, deposit);
    // Smaller guarded seams add variety; they never close the bypass.
    for (const encounter of encounters.filter(item => item.zone === zone && item.kind !== 'quiet-deposit'
      && !localDeposits.some(deposit => deposit.encounterId === item.id))) {
      const col = encounter.side === -1 ? encounter.center : encounter.side === 0 ? 1 : cells[0].length - 2;
      for (let offset = 3; offset <= 4; offset += 1) {
        const row = encounter.lastRow + offset;
        if (row < first + ZONE_ROWS) mark(row, col);
      }
    }
    // Grow existing deposits first, then connected small veins until the budget
    // is filled. Filling never creates floating flasks or unrelated empty cells.
    const candidates = [];
    for (let row = first + 2; row < first + ZONE_ROWS - 1; row += 1) {
      for (let col = 0; col < cells[row].length; col += 1) {
        const cell = cells[row][col];
        if (isRock(cell) && !cell.flaskTier) candidates.push({ row, col, rank: random() });
      }
    }
    candidates.sort((a, b) => a.rank - b.rank);
    while (value < target) {
      let index = candidates.findIndex(({ row, col }) => REWARD_VALUES[cells[row][col].tier] <= target - value
        && [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
          .some(([y, x]) => cells[y]?.[x]?.flaskTier));
      if (index < 0) index = candidates.findIndex(({ row, col }) => REWARD_VALUES[cells[row][col].tier] <= target - value);
      if (index < 0) break;
      const { row, col } = candidates.splice(index, 1)[0];
      const neighbor = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]]
        .map(([y, x]) => cells[y]?.[x]).find(cell => cell?.depositId >= 0);
      const owner = neighbor ? deposits[neighbor.depositId] : null;
      // Stop guarded pockets from growing back up against their hazard.
      if (owner && row >= owner.minRow && row <= owner.maxRow) mark(row, col, owner);
      else mark(row, col);
    }
    return value;
  }

  function build({ columns = 6, random = Math.random } = {}) {
    if (!Number.isInteger(columns) || columns < 6) throw new Error('World 1 descent needs at least six columns');
    const cells = Array.from({ length: ROWS }, () => Array.from({ length: columns }, () => ({
      tier: null, dead: false, path: false, guide: false, branch: false,
      hazard: false, special: null, flaskTier: 0, motion: null, depositId: -1
    })));
    for (const cell of cells[0]) cell.tier = 'soft';
    const encounters = planEncounters(columns, random);
    const hazards = placeEncounters(cells, encounters, columns, random);
    const { pathStarts, guideCols } = planRoute(cells, encounters, columns, random);
    const hardBand = { from: ZONE_ROWS * 2 + 24, to: ZONE_ROWS * 2 + 26 + Math.floor(random() * 2) };
    const deposits = planDeposits(encounters, cells, columns, random);
    const reservedOre = new Set(deposits.flatMap(deposit => [...deposit.core, ...deposit.growth].map(spot => `${spot.row}:${spot.col}`)));
    for (let zone = 0; zone < 3; zone += 1) {
      const quiet = encounters.find(item => item.zone === zone && item.kind === 'quiet-deposit');
      const options = [];
      for (let row = zone * ZONE_ROWS + 1; row < (zone + 1) * ZONE_ROWS; row += 1) {
        if (row >= hardBand.from && row <= hardBand.to) continue;
        const dangerous = encounters.some(item => item.zone === zone && item.kind !== 'quiet-deposit' && row >= item.firstRow && row <= item.lastRow);
        for (const col of [guideCols[row], guideCols[row] === pathStarts[row] ? pathStarts[row] + 1 : pathStarts[row]]) {
          if (!reservedOre.has(`${row}:${col}`)) options.push({ row, col, score: Math.abs(row - quiet.row) + (dangerous ? 20 : 0) });
        }
      }
      options.sort((a, b) => a.score - b.score);
      const heal = options[0];
      Object.assign(cells[heal.row][heal.col], { tier: 'special', special: 'gel' });
    }
    for (let zone = 0; zone < 3; zone += 1) fillRockSection(cells, pathStarts, guideCols, encounters, deposits, hardBand, zone, columns, random);
    const rewardBudgets = [0, 1, 2].map(zone => placeRewards(cells, pathStarts, encounters, deposits, zone, random));
    return { rows: ROWS, zoneRows: ZONE_ROWS, cells, pathStarts, guideCols, hazards, encounters, deposits, hardBand, rewardBudgets };
  }

  const api = Object.freeze({ ROWS, ZONE_ROWS, build });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SlimeWorld1Descent = api;
})();
