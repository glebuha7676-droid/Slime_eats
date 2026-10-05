(() => {
  'use strict';
  const KEY = 'slime_mine_plans_v1';
  const CATEGORIES = Object.freeze([
    ['start', 'Старт'], ['end', 'Конец'], ['danger1', 'Опасный участок I'],
    ['danger2', 'Опасный участок II'], ['special', 'Особый участок'],
    ['reward', 'Наградной участок'], ['heal', 'Участок хила'],
    ['neutral', 'Нейтральный участок']
  ].map(([id, label]) => ({ id, label })));
  const validCategories = new Set(CATEGORIES.map(item => item.id));
  const lengths = { full: [7], left: [3, 4], right: [4, 3] };
  const flaskValue = { 1: 1, 2: 3, 3: 5 };
  const bandCountForWorld = worldId => Number(worldId) === 1 ? 10 : 20;
  const modeForFailures = failures => Number(failures) >= 2 ? 'easy' : 'normal';
  const nextFailureStreak = (failures, completed) => completed ? 0 : Math.min(99, Math.max(0, Number(failures) || 0) + 1);
  const clone = value => JSON.parse(JSON.stringify(value));
  const makeBand = (shape = 'left', categories = []) => ({
    shape, slots: lengths[shape].map((rows, index) => ({ rows, category: categories[index] || '' }))
  });
  function starter(mode = 'normal', worldId = 1) {
    const sequence = Number(worldId) === 1
      ? mode === 'easy'
        ? ['start', 'neutral', 'reward', 'heal', 'neutral', 'reward', 'danger1', 'heal', 'reward', 'end']
        : ['start', 'neutral', 'danger1', 'reward', 'special', 'danger2', 'heal', 'reward', 'danger2', 'end']
      : mode === 'easy'
        ? ['start', 'neutral', 'reward', 'neutral', 'heal', 'neutral', 'reward', 'danger1', 'neutral', 'heal', 'reward', 'neutral', 'special', 'neutral', 'reward', 'danger1', 'heal', 'neutral', 'reward', 'end']
        : ['start', 'neutral', 'reward', 'danger1', 'heal', 'neutral', 'special', 'reward', 'danger2', 'neutral', 'heal', 'danger1', 'reward', 'special', 'danger2', 'neutral', 'heal', 'reward', 'danger2', 'end'];
    const bands = sequence.map((category, index) => {
      if (index === 0 || index === sequence.length - 1) return makeBand('full', [category]);
      return makeBand(index % 2 ? 'left' : 'right', [category, index % 3 === 0 ? 'reward' : 'neutral']);
    });
    return { id: worldId === 1 ? `starter-${mode}` : `starter-${mode}-${worldId}`, worldId, mode, name: mode === 'easy' ? 'Облегчённая шахта' : 'Основная шахта', bands };
  }
  function normalize(value) {
    const mode = value?.mode === 'easy' ? 'easy' : 'normal';
    const bandCount = bandCountForWorld(value?.worldId);
    const bands = Array.from({ length: bandCount }, (_, index) => {
      const sourceIndex = index === bandCount - 1 && value?.bands?.length > bandCount ? value.bands.length - 1 : index;
      const input = value?.bands?.[sourceIndex] || {};
      const shape = Object.hasOwn(lengths, input.shape) ? input.shape : 'left';
      return makeBand(shape, lengths[shape].map((_, slot) => {
        const category = input.slots?.[slot]?.category;
        return validCategories.has(category) ? category : '';
      }));
    });
    return { id: String(value?.id || ''), worldId: Number(value?.worldId) || 1,
      mode, name: String(value?.name || 'Новый шаблон').trim().slice(0, 64), bands };
  }
  function read() {
    try {
      const fromEditor = location.pathname.replace(/\\/g, '/').includes('/tools/generation/');
      const local = localStorage.getItem(KEY);
      const generated = window.SlimeGeneratedData?.plans;
      const hasGeneratedEdits = generated && ['changed', 'created', 'deleted'].some(key => generated[key]?.length);
      const value = fromEditor && local ? JSON.parse(local) : hasGeneratedEdits ? generated : JSON.parse(local || '{}');
      return { changed: Array.isArray(value.changed) ? value.changed : [],
        created: Array.isArray(value.created) ? value.created : [],
        deleted: Array.isArray(value.deleted) ? value.deleted : [] };
    } catch (_) { return { changed: [], created: [], deleted: [] }; }
  }
  function write(value) {
    localStorage.setItem(KEY, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('slime-generation-updated'));
  }
  function all(worldId = 1, mode) {
    const data = read();
    const changed = new Map(data.changed.map(item => [item.id, item]));
    const deleted = new Set(data.deleted);
    return [starter('normal', worldId), starter('easy', worldId)].filter(item => !deleted.has(item.id))
      .map(item => normalize(changed.get(item.id) || item))
      .concat(data.created.filter(item => !deleted.has(item.id)).map(normalize))
      .filter(item => item.worldId === Number(worldId) && (!mode || item.mode === mode));
  }
  function create(value) {
    const data = read();
    const result = normalize({ ...value, id: `mine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    data.created.push(result); write(data); return result;
  }
  function update(value) {
    if (!value?.id || !all(value.worldId).some(item => item.id === value.id)) return null;
    const data = read();
    const result = normalize(value);
    if (result.id.startsWith('starter-')) {
      data.changed = data.changed.filter(item => item.id !== result.id);
      data.changed.push(result);
    } else data.created = data.created.map(item => item.id === result.id ? result : item);
    write(data); return result;
  }
  function remove(id) {
    const data = read();
    if (id.startsWith('starter-')) {
      if (!data.deleted.includes(id)) data.deleted.push(id);
      data.changed = data.changed.filter(item => item.id !== id);
    } else data.created = data.created.filter(item => item.id !== id);
    write(data);
  }
  function matching(pool, plan, slot) {
    return pool.filter(section => section.worldId === plan.worldId && section.mode === plan.mode
      && section.category === slot.category && section.rows === slot.rows);
  }
  function flasks(section) {
    return section.cells.join('').split('').reduce((sum, token) => sum + (flaskValue[token] || 0), 0);
  }
  function inspect(plan, pool) {
    const issues = [];
    let minimum = 0, maximum = 0, expected = 0;
    plan.bands.forEach((band, bandIndex) => band.slots.forEach((slot, slotIndex) => {
      if (!slot.category) { issues.push({ band: bandIndex, slot: slotIndex, reason: 'Пустой модуль' }); return; }
      if (slot.category === 'start' && bandIndex !== 0 || slot.category === 'end' && bandIndex !== plan.bands.length - 1)
        issues.push({ band: bandIndex, slot: slotIndex, reason: 'Старт и конец стоят не на краю шахты' });
      if ((bandIndex === 0 && slotIndex === 0 && slot.category !== 'start') ||
          (bandIndex === plan.bands.length - 1 && slotIndex === band.slots.length - 1 && slot.category !== 'end'))
        issues.push({ band: bandIndex, slot: slotIndex, reason: 'Нужен старт или конец' });
      const options = matching(pool, plan, slot);
      if (!options.length) { issues.push({ band: bandIndex, slot: slotIndex, reason: 'Нет подходящих секций' }); return; }
      const values = options.map(flasks);
      minimum += Math.min(...values); maximum += Math.max(...values);
      expected += values.reduce((a, b) => a + b, 0) / values.length;
    }));
    return { issues, minimum, maximum, expected: Math.round(expected), rows: plan.bands.reduce((sum, band) => sum + band.slots.reduce((inner, slot) => inner + slot.rows, 0), 0) };
  }
  function buildRows(worldId, mode, pool, random = Math.random) {
    const candidates = all(worldId, mode).filter(plan => inspect(plan, pool).issues.length === 0);
    const chosen = candidates[Math.floor(random() * candidates.length)] || starter(mode, worldId);
    const rows = [];
    let sectionIndex = 0;
    for (const band of chosen.bands) for (const slot of band.slots) {
      const options = matching(pool, chosen, slot);
      const selected = options[Math.floor(random() * options.length)] || null;
      for (let localRow = 0; localRow < slot.rows; localRow++) rows.push({
        kind: slot.category === 'end' ? 'final' : slot.category === 'heal' ? 'safe' :
          slot.category === 'danger1' || slot.category === 'danger2' ? 'danger' : slot.category,
        category: slot.category, difficultyMode: mode, sectionIndex, localRow,
        length: slot.rows, templateId: selected?.id || '', difficulty: slot.category === 'danger2' ? 2 : 1,
        cells: selected?.cells[localRow] || 'n....n'
      });
      sectionIndex++;
    }
    return rows;
  }
  window.SlimeMinePlans = Object.freeze({ KEY, CATEGORIES, bandCountForWorld, makeBand, starter, normalize, all, create,
    update, remove, matching, flasks, inspect, buildRows, modeForFailures, nextFailureStreak });
})();
