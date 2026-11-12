// The first world's terrain language, applied around each biome's own encounters.
(() => {
  'use strict';
  const source = typeof module !== 'undefined' && module.exports ? require('./world1-descent.js') : window.SlimeWorld1Descent;
  const tiers = ['dense', 'hard', 'reinforced'];
  const rock = b => b && !b.dead && !b.hazard && !b.special;
  function apply(blocks, { columns = 6, rows, random = Math.random } = {}) {
    rows ||= Math.max(...blocks.map(b => b.row)) + 1;
    const cells = Array.from({ length: rows }, () => Array(columns));
    for (const b of blocks) cells[b.row][b.col] = b;
    // Follow existing openings, with a continuous two-column lane and gradual turns.
    // Threat clearance is considered above/below the hero, not just in its row.
    const desired=[];
    let drift=Math.floor((columns-2)/2);
    for(let row=0;row<rows;row++){
      if(row>3&&row%6===0&&random()<.7)drift=Math.max(0,Math.min(columns-2,drift+(random()<.5?-1:1)));
      desired[row]=drift;
    }
    const costs = [], previous = [];
    for (let row = 0; row < rows; row++) {
      costs[row] = Array(columns - 1).fill(Infinity); previous[row] = Array(columns - 1).fill(-1);
      for (let col = 0; col < columns - 1; col++) {
        let local = random() * .45 + Math.abs(col-desired[row])*.9;
        for (let y = Math.max(0, row - 1); y <= Math.min(rows - 1, row + 1); y++) for (const x of [col, col + 1]) {
          const b = cells[y][x];
          local += !b ? 10000 : b.hazard ? 10000 : b.special ? 150 : b.path || b.dead ? 0 : .3;
        }
        if (!row) costs[row][col] = local + Math.abs(col - (columns - 2) / 2);
        else for (let before = Math.max(0, col - 1); before <= Math.min(columns - 2, col + 1); before++) {
          const cost = costs[row - 1][before] + local + Math.abs(before - col) * 1.1;
          if (cost < costs[row][col]) { costs[row][col] = cost; previous[row][col] = before; }
        }
      }
    }
    const pathStarts = Array(rows), guideCols = Array(rows);
    let lane = costs.at(-1).indexOf(Math.min(...costs.at(-1)));
    for (let row = rows - 1; row >= 0; row--) { pathStarts[row] = lane; lane = previous[row][lane]; }
    let guide = pathStarts[0];
    for (let row = 0; row < rows; row++) {
      const start = pathStarts[row]; guide = Math.max(start, Math.min(start + 1, guide)); guideCols[row] = guide;
      for (const b of cells[row]) if (rock(b)) { b.path = b.col >= start && b.col <= start + 1; b.tier = null; }
    }
    // Surface stays fragile. Depth bands are 20/50/30, independent of encounters.
    for (const b of cells[0]) if (rock(b)) b.tier = 'dense';
    const hardBand = { from: Math.floor(rows * .90), to: Math.floor(rows * .93) };
    const sections = [];
    for (let zone = 0; zone < 3; zone++) {
      const from = zone ? Math.floor(rows * source.SECTION_ENDS[zone-1]) : 0, to = Math.floor(rows * source.SECTION_ENDS[zone]);
      const available = cells.slice(from, to).flat().filter(b => rock(b) && !b.tier), count = available.length;
      const weights = source.ROCK_WEIGHTS[zone];
      const left = { dense: Math.round(count * weights.dense / 100), reinforced: Math.round(count * weights.reinforced / 100) };
      left.hard = count - left.dense - left.reinforced;
      const pick = () => { let n = random() * (left.dense + left.hard + left.reinforced); return tiers.find(t => (n -= left[t]) < 0) || tiers.find(t => left[t] > 0); };
      const put = (b, tier) => { if (!rock(b) || b.tier) return; if (!left[tier]) tier = pick(); b.tier = tier; left[tier]--; };
      // Allocate the weak seam before veins, strata and the final hard band.
      for (let row = from; row < to; row++) put(cells[row][guideCols[row]], 'dense');
      for (let row = from; row < to; row++) if (row % 8 < 4 && left.dense > 8) {
        const g = guideCols[row], adjacent = g === pathStarts[row] ? g + 1 : g - 1;
        put(cells[row][adjacent], 'dense');
        if (zone !== 1 && row % 8 === 1 && left.dense > 8) put(cells[row][Math.max(0, Math.min(columns - 1, adjacent + (adjacent > g ? 1 : -1)))], 'dense');
      }
      if (zone === 2) for (let row = hardBand.from; row <= hardBand.to; row++) for (const b of cells[row]) put(b, random() < .7 ? 'reinforced' : 'hard');
      for (let row = from; row < to; row++) {
        const reversed = random() < .5;
        for (let i = 0; i < columns; i++) {
          const col = reversed ? columns - 1 - i : i, b = cells[row][col];
          if (!rock(b) || b.tier) continue;
          const neighbor = random() < .5 ? cells[row - 1]?.[col] : cells[row][col + (reversed ? 1 : -1)];
          put(b, neighbor && left[neighbor.tier] > 0 && random() < .55 ? neighbor.tier : pick());
        }
      }
      sections.push({ from, to, count, counts: Object.fromEntries(tiers.map(t => [t, available.filter(b => b.tier === t).length])) });
    }
    return { pathStarts, guideCols, hardBand, sections };
  }
  const api = Object.freeze({ apply });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SlimeBiomeTerrain = api;
})();
