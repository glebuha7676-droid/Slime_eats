(() => {
  'use strict';

  const legacy = window.SlimeSectionCatalog;
  if (!legacy) throw new Error('Section seed catalog is missing');
  const STORAGE_KEY = 'slime_generation_sections_v4';
  const WORLD_NAMES = Object.freeze({ 1: 'Зелёные глубины' });
  const CATEGORIES = Object.freeze([
    { id: 'start', label: 'Старт' },
    { id: 'safe', label: 'Передышка' },
    { id: 'neutral', label: 'Обычная' },
    { id: 'danger', label: 'Опасная' },
    { id: 'fork', label: 'Развилка' },
    { id: 'reward', label: 'Колбы' },
    { id: 'final', label: 'Финиш' }
  ]);
  const BRUSHES = Object.freeze([
    { id: '.', label: 'Пусто' },
    { id: 'w', label: 'Слабый' },
    { id: 'n', label: 'Обычный' },
    { id: 'h', label: 'Крепкий' },
    { id: 'x', label: 'Опасный' },
    { id: '1', label: 'Колба +1' },
    { id: '2', label: 'Колба +3' },
    { id: '3', label: 'Колба +5' },
    { id: '+', label: 'Аптечка' },
    { id: 'p', label: 'Особый' },
    { id: 'q', label: 'Второй особый' },
    { id: 'z', label: 'Желе' }
  ]);
  const validTokens = new Set(BRUSHES.map(brush => brush.id));
  const clamp = (number, min, max) => Math.max(min, Math.min(max, number));
  const oldOreToken = { c: '1', i: '2', g: '3', d: '3' };

  function normalizeRow(value, oldWidth = 6) {
    const input = [...String(value || '')].map(token => oldOreToken[token] || token);
    const cells = Array(6).fill('n');
    const width = clamp(oldWidth, 3, 6);
    const offset = Math.floor((6 - width) / 2);
    input.slice(0, width).forEach((token, index) => { cells[offset + index] = validTokens.has(token) ? token : 'w'; });
    return cells.join('');
  }

  function normalize(value) {
    const oldWidth = clamp(Math.round(Number(value?.cols) || 6), 3, 6);
    const source = Array.isArray(value?.cells) ? value.cells : [];
    const requestedRows = clamp(Math.round(Number(value?.rowCount) || source.length || 3), 3, 5);
    const cells = source.slice(0, requestedRows).map(row => normalizeRow(row, oldWidth));
    while (cells.length < requestedRows) cells.push('w'.repeat(6));
    return {
      id: String(value?.id || ''), worldId: 1,
      category: CATEGORIES.some(item => item.id === value?.category) ? value.category : 'neutral',
      mode: value?.mode === 'easy' ? 'easy' : 'normal',
      difficulty: clamp(Math.round(Number(value?.difficulty) || 1), 1, 3),
      cols: 6, rows: cells.length, cells
    };
  }

  // Keep the existing section layouts as editable seeds. The old ore cells
  // become empty collectible cells; authored v3 changes are carried forward.
  const defaults = legacy.all().map(template => normalize({ ...template, cols: 6 }));

  function readStore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return {
        changed: Array.isArray(raw.changed) ? raw.changed : [],
        created: Array.isArray(raw.created) ? raw.created : [],
        deleted: Array.isArray(raw.deleted) ? raw.deleted : []
      };
    } catch (_) { return { changed: [], created: [], deleted: [] }; }
  }

  function writeStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('slime-generation-updated'));
  }

  function all() {
    const store = readStore();
    const changed = new Map(store.changed.map(item => [item.id, item]));
    const deleted = new Set(store.deleted);
    return defaults.filter(item => !deleted.has(item.id))
      .map(item => normalize(changed.get(item.id) || item))
      .concat(store.created.filter(item => !deleted.has(item.id)).map(normalize));
  }

  function createTemplate(value) {
    const store = readStore();
    const template = normalize({ ...value, id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    store.created.push(template);
    writeStore(store);
    return template;
  }

  function updateTemplate(value) {
    if (!value?.id || !all().some(item => item.id === value.id)) return null;
    const store = readStore();
    const template = normalize(value);
    if (defaults.some(item => item.id === template.id)) {
      store.changed = store.changed.filter(item => item.id !== template.id);
      store.changed.push(template);
    } else {
      store.created = store.created.map(item => item.id === template.id ? template : item);
    }
    writeStore(store);
    return template;
  }

  function deleteTemplate(id) {
    const store = readStore();
    if (defaults.some(item => item.id === id)) {
      if (!store.deleted.includes(id)) store.deleted.push(id);
      store.changed = store.changed.filter(item => item.id !== id);
    } else store.created = store.created.filter(item => item.id !== id);
    writeStore(store);
  }

  function buildPlan(worldId, _level, rowCount, random = Math.random, difficultyMode = 'normal') {
    if (Number(worldId) !== 1) return legacy.buildPlan(worldId, 5, rowCount, random, 'normal');
    const rows = Math.max(3, Math.round(Number(rowCount) || 3));
    const mode = difficultyMode === 'easy' ? 'easy' : 'normal';
    const pool = all();
    const middle = ['neutral', 'danger', 'safe', 'fork', 'reward', 'neutral', 'danger', 'safe', 'reward', 'fork'];
    const plan = [];
    let sectionIndex = 0;
    let previousId = '';
    while (plan.length < rows) {
      const remaining = rows - plan.length;
      const kind = remaining <= 5 ? 'final' : sectionIndex === 0 ? 'start' : middle[(sectionIndex - 1) % middle.length];
      const candidates = pool.filter(item => item.category === kind && item.mode === mode && item.rows <= remaining);
      const fallback = pool.filter(item => item.category === kind && item.mode === 'normal' && item.rows <= remaining);
      const options = candidates.length ? candidates : fallback;
      const weights = mode === 'easy' ? { 1: 5, 2: 2, 3: 1 } : { 1: 2, 2: 4, 3: 3 };
      const score = item => (weights[item.difficulty] || 1) * (item.id === previousId ? .25 : 1);
      let roll = random() * options.reduce((sum, item) => sum + score(item), 0);
      const template = options.find(item => (roll -= score(item)) <= 0) || options[0] || null;
      const length = kind === 'final' ? remaining : Math.min(template?.rows || 3, remaining - 3);
      for (let localRow = 0; localRow < length; localRow += 1) {
        const cells = template?.cells[Math.min(localRow, template.rows - 1)] || 'nwwwwn';
        plan.push({ kind, difficultyMode: mode, sectionIndex, localRow, length,
          templateId: template?.id || '', difficulty: template?.difficulty || 1, cells });
      }
      previousId = template?.id || '';
      sectionIndex += 1;
    }
    return plan.slice(0, rows);
  }

  window.SlimeSectionCatalog = Object.freeze({
    STORAGE_KEY, COLS: 6, ROWS: 3, CATEGORIES, BRUSHES, WORLD_NAMES,
    all, byId: id => all().find(item => item.id === id) || null,
    templatesFor: (worldId, category, mode) => all().filter(item =>
      item.worldId === Number(worldId) && item.category === category && (!mode || item.mode === mode)),
    createTemplate, updateTemplate, deleteTemplate, buildPlan,
    normalize
  });
})();
