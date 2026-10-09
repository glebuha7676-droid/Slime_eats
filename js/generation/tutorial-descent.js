/* Keep the ordinary mine, authoring only the two lesson locations. */
(() => {
  'use strict';
  const ROWS = Object.freeze({ 1: 35, 2: 42 });
  const cell = tier => ({ tier, dead: false, path: false, hazard: false, special: null, flaskTier: 0, motion: null, depositId: -1 });
  function build({ phase, normal, columns = 6 }) {
    if (columns !== 6 || !normal?.cells) throw new Error('Tutorial needs the ordinary six-column mine');
    const rows = ROWS[phase];
    const cells = normal.cells.slice(0, rows).map(row => row.map(source => ({ ...source, motion: source.motion ? { ...source.motion } : null })));
    const rock = (row, col, tier = cells[row][col].tier) => {
      cells[row][col] = cell(['dense','hard','reinforced','soft'].includes(tier) ? tier : 'dense');
    };
    for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
      const block = cells[row][col];
      if (block.motion?.axis === 'y' && block.motion.to >= rows) rock(row, col);
      if (phase === 1 || row < 18) cells[row][col].flaskTier = 0;
    }
    if (phase === 1) {
      // Only the opening lane is fragile. The surrounding normal rock remains.
      for (let row = 1; row <= 8; row++) for (let col = 0; col < columns; col++) {
        if (cells[row][col].hazard || cells[row][col].dead || cells[row][col].special) rock(row, col);
      }
      for (let row = 0; row <= 4; row++) rock(row, 3, row ? 'dense' : 'soft');
      cells[5][3] = { ...cell('dense'), hazard: true };
      // Recovery is well below the impact, after time to try steering.
      for (let row = 12; row <= 15; row++) for (let col = 2; col <= 3; col++) {
        if (cells[row][col].hazard || cells[row][col].dead || cells[row][col].special) rock(row, col);
      }
      for (const row of cells) for (const block of row) if (block.special === 'gel') Object.assign(block, cell('dense'));
      cells[14][3] = { ...cell('special'), special: 'gel' };
    } else {
      // A calm view of the deposit after the first 100 metres.
      for (let row = 15; row <= 21; row++) for (let col = 0; col < columns; col++) {
        if (cells[row][col].hazard || cells[row][col].dead || cells[row][col].special) rock(row, col);
        cells[row][col].flaskTier = 0;
      }
      for (let col = 1; col <= 4; col++) {
        const tier = col === 1 ? 'dense' : col === 2 ? 'hard' : 'reinforced';
        cells[18][col] = { ...cell(tier), flaskTier: col === 1 ? 1 : col === 2 ? 2 : 3 };
      }
      for (const col of [2,3]) cells[19][col] = { ...cell('reinforced'), flaskTier: 3 };
    }
    return { rows, cells, firstHazard: phase === 1 ? { row: 5, col: 3 } : null, firstVeinRow: phase === 2 ? 18 : null };
  }
  const api = Object.freeze({ ROWS, build });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SlimeTutorialDescent = api;
})();
