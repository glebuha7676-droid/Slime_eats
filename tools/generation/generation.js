(() => {
  'use strict';

  const catalog = window.SlimeSectionCatalog;
  const worldCatalog = window.SlimeWorldCatalog;
  if (!catalog || !worldCatalog) throw new Error('Generation catalogs are not loaded');

  const $ = selector => document.querySelector(selector);
  const state = { worldId: 1, category: 'start', variant: 1, brush: 'w', painting: false, erase: false, template: null };
  const els = {
    worldTabs: $('#worldTabs'), categoryTabs: $('#categoryTabs'), variantTabs: $('#variantTabs'), grid: $('#sectionGrid'),
    brushes: $('#brushPalette'), worldTitle: $('#worldTitle'), categoryHint: $('#categoryHint'), name: $('#sectionName'), purpose: $('#templatePurpose'),
    stars: $('#difficultyButtons'), save: $('#saveBtn'), reset: $('#resetBtn'), mirror: $('#mirrorBtn'), toast: $('#toast'),
    previewLevel: $('#previewLevel'), previewDifficulty: $('#previewDifficulty'), preview: $('#runPreview'), previewSummary: $('#previewSummary'), regenerate: $('#regenerateBtn')
  };

  function rootAsset(source) {
    return source ? `../../${source}` : '';
  }

  function blockSprite(token, worldId = state.worldId) {
    const world = worldCatalog.load().worlds.find(item => item.id === Number(worldId));
    const find = id => world?.blocks?.find(block => block.id === id);
    const primary = { 1: 'bomb', 2: 'cryo', 3: 'jelly', 4: 'geyser' }[worldId];
    const secondary = { 1: 'bomb', 2: 'snowflake', 3: 'jelly', 4: 'meteor' }[worldId];
    const block = token === 'w' ? find('dense')
      : token === 'n' ? find('hard')
        : token === 'h' ? find('reinforced')
          : token === 'x' ? find('hazard')
            : token === '+' ? find('heal')
              : token === 'p' ? find(primary)
                : token === 'q' ? find(secondary)
                  : null;
    if ('cigd'.includes(token)) {
      const ore = { c: 'coal', i: 'iron', g: 'gold', d: 'diamond' }[token];
      return rootAsset(worldCatalog.assetSource(worldId, `ore-${ore}`));
    }
    if (token === 'z') {
      if (worldId === 1) return rootAsset('assets/Мир 1/Желе текстура v4.webp');
      if (worldId === 3) return '';
      return rootAsset(worldCatalog.assetSource(worldId, secondary === 'meteor' ? 'meteor' : 'snowflake'));
    }
    return block?.sprite ? rootAsset(worldCatalog.assetSource(worldId, block.sprite)) : '';
  }

  function tokenMarkup(token, className = '') {
    const source = blockSprite(token);
    const brush = catalog.BRUSHES.find(item => item.id === token);
    if (source) return `<img src="${source}" alt=""><b>${brush?.label || ''}</b>`;
    if (token === 'z' && state.worldId === 3) return `<span>🍯</span><b>${brush?.label || ''}</b>`;
    return `<span>${token === '.' ? '⌫' : '·'}</span><b>${brush?.label || ''}</b>`;
  }

  function loadCurrent() {
    state.template = catalog.templatesFor(state.worldId, state.category).find(item => item.variant === state.variant);
    render();
  }

  function renderWorlds() {
    els.worldTabs.innerHTML = Object.entries(catalog.WORLD_NAMES).map(([id, name]) => `<button class="${+id === state.worldId ? 'active' : ''}" data-world="${id}" type="button">Мир ${id} · ${name}</button>`).join('');
  }

  function renderCategories() {
    els.categoryTabs.innerHTML = catalog.CATEGORIES.map(category => `<button class="${category.id === state.category ? 'active' : ''}" data-category="${category.id}" type="button">${category.label}</button>`).join('');
    const category = catalog.CATEGORIES.find(item => item.id === state.category);
    els.categoryHint.textContent = category?.hint || '';
  }

  function renderVariants() {
    const templates = catalog.templatesFor(state.worldId, state.category);
    els.variantTabs.innerHTML = templates.map(template => `<button class="${template.variant === state.variant ? 'active' : ''}" data-variant="${template.variant}" type="button">${template.variant}</button>`).join('');
  }

  function renderStars() {
    els.stars.innerHTML = [1, 2, 3].map(value => `<button class="${state.template?.difficulty === value ? 'active' : ''}" data-star="${value}" type="button" aria-label="${value} звезды">${'★'.repeat(value)}</button>`).join('');
  }

  function renderGrid() {
    const cells = state.template.cells.flatMap((row, rowIndex) => [...row].map((token, colIndex) => ({ token, rowIndex, colIndex })));
    els.grid.innerHTML = cells.map(cell => {
      const source = blockSprite(cell.token);
      const classes = ['tile', cell.token === '.' ? 'empty' : '', cell.token === 'z' ? 'zone' : ''].filter(Boolean).join(' ');
      return `<button class="${classes}" data-row="${cell.rowIndex}" data-col="${cell.colIndex}" data-token="${cell.token}" type="button" aria-label="Клетка ${cell.rowIndex + 1}, ${cell.colIndex + 1}">${source ? `<img src="${source}" alt="">` : cell.token === 'z' && state.worldId === 3 ? '<span>🍯</span>' : ''}</button>`;
    }).join('');
  }

  function renderBrushes() {
    els.brushes.innerHTML = catalog.BRUSHES.map(brush => `<button class="brush ${brush.id === state.brush ? 'active' : ''} ${brush.id === '.' ? 'empty' : ''}" data-brush="${brush.id}" type="button">${tokenMarkup(brush.id)}</button>`).join('');
  }

  function render() {
    if (!state.template) return;
    els.worldTitle.textContent = `${catalog.WORLD_NAMES[state.worldId]} · ${catalog.CATEGORIES.find(item => item.id === state.category)?.label}`;
    els.name.value = state.template.name;
    els.purpose.textContent = `${state.template.purpose} · С уровня ${state.template.minLevel}`;
    renderWorlds(); renderCategories(); renderVariants(); renderStars(); renderGrid(); renderBrushes(); renderPreview();
  }

  function paint(row, col, token = state.erase ? '.' : state.brush) {
    const cells = [...state.template.cells];
    const line = [...cells[row]];
    line[col] = token;
    cells[row] = line.join('');
    state.template = { ...state.template, cells };
    renderGrid();
  }

  function save() {
    state.template = { ...state.template, name: els.name.value.trim() || state.template.name };
    catalog.saveTemplate(state.template);
    showToast('Секция сохранена и подключена к игре');
    renderPreview();
  }

  function renderMiniGrid(template) {
    return `<div class="mini-grid">${template.cells.flatMap(row => [...row]).map(token => {
      const source = blockSprite(token, template.worldId);
      return `<span class="mini-cell">${source ? `<img src="${source}" alt="">` : token === 'z' && template.worldId === 3 ? '🍯' : ''}</span>`;
    }).join('')}</div>`;
  }

  function renderPreview() {
    const level = Number(els.previewLevel.value || 1);
    const difficultyMode = els.previewDifficulty.value || 'hard';
    const depth = 100 + (state.worldId - 1) * 50 + (level - 1) * 100;
    const rows = Math.max(8, Math.floor((depth * 10 + 180 - 72 - 190) / 72));
    const plan = catalog.buildPlan(state.worldId, level, rows, Math.random, difficultyMode);
    const sections = [];
    for (const row of plan) {
      if (!sections.some(item => item.index === row.sectionIndex)) sections.push({ index: row.sectionIndex, row });
    }
    els.preview.innerHTML = sections.map(({ row }) => {
      const template = catalog.byId(row.templateId);
      if (!template) return '';
      const label = catalog.CATEGORIES.find(item => item.id === row.kind)?.label || row.kind;
      return `<article class="preview-card ${row.kind}" title="${template.purpose || ''}"><b>${label}</b><em>${template.name}</em>${renderMiniGrid(template)}<small>${'★'.repeat(row.difficulty)} · ${row.length} ряда</small></article>`;
    }).join('');
    const counts = [1, 2, 3].map(star => `${star}★: ${sections.filter(item => item.row.difficulty === star).length}`).join(' · ');
    els.previewSummary.textContent = `${plan[0]?.routeName || 'Маршрут'} · ${depth} м · ${rows} рядов · ${sections.length} секций · ${counts}`;
  }

  let toastTimer = 0;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  els.worldTabs.addEventListener('click', event => {
    const button = event.target.closest('[data-world]'); if (!button) return;
    state.worldId = Number(button.dataset.world); state.variant = 1; loadCurrent();
  });
  els.categoryTabs.addEventListener('click', event => {
    const button = event.target.closest('[data-category]'); if (!button) return;
    state.category = button.dataset.category; state.variant = 1; loadCurrent();
  });
  els.variantTabs.addEventListener('click', event => {
    const button = event.target.closest('[data-variant]'); if (!button) return;
    state.variant = Number(button.dataset.variant); loadCurrent();
  });
  els.stars.addEventListener('click', event => {
    const button = event.target.closest('[data-star]'); if (!button) return;
    state.template = { ...state.template, difficulty: Number(button.dataset.star) }; renderStars(); renderPreview();
  });
  els.brushes.addEventListener('click', event => {
    const button = event.target.closest('[data-brush]'); if (!button) return;
    state.brush = button.dataset.brush; renderBrushes();
  });
  els.grid.addEventListener('pointerdown', event => {
    const tile = event.target.closest('.tile'); if (!tile) return;
    event.preventDefault(); state.painting = true; state.erase = event.button === 2; paint(Number(tile.dataset.row), Number(tile.dataset.col));
  });
  els.grid.addEventListener('pointerover', event => {
    if (!state.painting) return; const tile = event.target.closest('.tile'); if (!tile) return;
    paint(Number(tile.dataset.row), Number(tile.dataset.col));
  });
  window.addEventListener('pointerup', () => { state.painting = false; state.erase = false; });
  els.grid.addEventListener('contextmenu', event => event.preventDefault());
  els.name.addEventListener('input', () => { state.template = { ...state.template, name: els.name.value }; });
  els.save.addEventListener('click', save);
  els.reset.addEventListener('click', () => { catalog.resetTemplate(state.template.id); loadCurrent(); showToast('Вариант возвращён'); });
  els.mirror.addEventListener('click', () => { state.template = { ...state.template, cells: state.template.cells.map(row => [...row].reverse().join('')) }; renderGrid(); });
  els.previewLevel.addEventListener('change', renderPreview);
  els.previewDifficulty.addEventListener('change', renderPreview);
  els.regenerate.addEventListener('click', renderPreview);

  loadCurrent();
})();
