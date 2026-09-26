(() => {
  'use strict';
  const catalog = window.SlimeSectionCatalog;
  const worldCatalog = window.SlimeWorldCatalog;
  if (!catalog || !worldCatalog) throw new Error('Generation catalogs are not loaded');
  const $ = selector => document.querySelector(selector);
  const state = {
    mode: 'normal', category: 'start', difficulty: 1, rows: 3,
    brush: 'w', painting: false, dragging: false, erase: false, selectedId: '', draft: null
  };
  const els = {
    mode: $('#modeTabs'), categories: $('#categoryTabs'), stars: $('#difficultyButtons'), widths: $('#widthButtons'),
    grid: $('#sectionGrid'), brushes: $('#brushPalette'), pool: $('#savedSections'), count: $('#poolCount'),
    status: $('#editStatus'), toast: $('#toast'),
    add: $('#addBtn'), fresh: $('#newBtn'), saveNew: $('#saveNewBtn'), update: $('#updateBtn'),
    remove: $('#deleteBtn'), clear: $('#clearBtn'), mirror: $('#mirrorBtn')
  };
  const rootAsset = source => source ? `../../${source}` : '';
  const world = worldCatalog.load().worlds.find(item => item.id === 1);
  const findBlock = id => world?.blocks?.find(block => block.id === id);

  function spriteFor(token) {
    if ('123'.includes(token)) return rootAsset(`assets/collectibles/flasks/world-1-${{ 1: 'small', 2: 'medium', 3: 'large' }[token]}.webp`);
    if (token === 'z') return rootAsset('assets/Мир 1/Желе текстура v4.webp');
    const blockId = { w: 'dense', n: 'hard', h: 'reinforced', x: 'hazard', '+': 'heal', p: 'bomb', q: 'bomb' }[token];
    const block = findBlock(blockId);
    return block?.sprite ? rootAsset(worldCatalog.assetSource(1, block.sprite)) : '';
  }

  function blankDraft() {
    return catalog.normalize({ worldId: 1, category: state.category, mode: state.mode,
      difficulty: state.difficulty, rowCount: state.rows, cells: Array(state.rows).fill('.'.repeat(6)) });
  }

  function startBlank() {
    state.selectedId = '';
    state.painting = false;
    state.dragging = false;
    state.draft = blankDraft();
    render();
  }

  function tileMarkup(token) {
    const source = spriteFor(token);
    return source ? `<img src="${source}" alt="">` : '';
  }

  function renderGrid() {
    els.grid.style.setProperty('--cols', String(state.draft.cols));
    els.grid.innerHTML = state.draft.cells.flatMap((row, rowIndex) => [...row].map((token, colIndex) =>
      `<button class="tile ${token === '.' ? 'empty' : ''} ${'123'.includes(token) ? 'flask-cell' : ''} ${token === 'z' ? 'zone' : ''}" data-row="${rowIndex}" data-col="${colIndex}" data-token="${token}" type="button" aria-label="Ряд ${rowIndex + 1}, клетка ${colIndex + 1}">${tileMarkup(token)}</button>`
    )).join('');
  }

  function renderBrushes() {
    els.brushes.innerHTML = catalog.BRUSHES.map(brush => {
      const image = spriteFor(brush.id);
      return `<button class="brush ${brush.id === state.brush ? 'active' : ''}" data-brush="${brush.id}" type="button">${image ? `<img src="${image}" alt="">` : '<span>⌫</span>'}<b>${brush.label}</b></button>`;
    }).join('');
  }

  function renderControls() {
    els.mode.innerHTML = [['normal', 'Обычная'], ['easy', 'Облегчённая']].map(([id, label]) =>
      `<button type="button" data-mode="${id}" class="${id === state.mode ? 'active' : ''}">${label}</button>`).join('');
    els.categories.innerHTML = catalog.CATEGORIES.map(item =>
      `<button type="button" data-category="${item.id}" class="${item.id === state.category ? 'active' : ''}">${item.label}</button>`).join('');
    els.stars.innerHTML = [1, 2, 3].map(value =>
      `<button type="button" data-star="${value}" class="${value === state.draft.difficulty ? 'active' : ''}" aria-label="${value} звезды">${'★'.repeat(value)}</button>`).join('');
    els.widths.innerHTML = [3, 4, 5].map(value =>
      `<button type="button" data-rows="${value}" class="${value === state.draft.rows ? 'active' : ''}">${value}</button>`).join('');
    els.update.disabled = !state.selectedId;
    els.remove.disabled = !state.selectedId;
    els.status.textContent = state.selectedId ? 'Редактирование выбранной' : 'Новая секция';
  }

  function renderPool() {
    const templates = catalog.templatesFor(1, state.category, state.mode);
    els.count.textContent = String(templates.length);
    els.pool.innerHTML = templates.length ? templates.map((template, index) =>
      `<article class="pool-card ${template.id === state.selectedId ? 'active' : ''}">
        <button type="button" data-template="${template.id}" class="pool-select" aria-label="Открыть секцию ${index + 1}">
          <span class="pool-card-title"><strong>Секция ${index + 1}</strong><small>${'★'.repeat(template.difficulty)} · ${template.rows} ряда</small></span>
          ${miniGrid(template)}
          <span class="pool-edit-hint">Выбрать и редактировать</span>
        </button>
        <button type="button" data-delete="${template.id}" class="pool-delete" aria-label="Удалить секцию ${index + 1}" title="Удалить">×</button>
      </article>`
    ).join('') : '<p class="empty-pool">В этой категории пока нет секций. Нарисуй первую и добавь её в пул.</p>';
  }

  function miniGrid(template) {
    return `<div class="mini-grid" style="--cols:${template.cols}">${template.cells.flatMap(row => [...row]).map(token => {
      const image = spriteFor(token);
      return `<span class="mini-cell ${token === '.' ? 'empty' : ''}">${image ? `<img src="${image}" alt="">` : ''}</span>`;
    }).join('')}</div>`;
  }

  function render() {
    renderControls(); renderGrid(); renderBrushes(); renderPool();
  }

  function paint(tile, initial = false) {
    const row = Number(tile?.dataset.row);
    const col = Number(tile?.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col) || !state.draft.cells[row]) return;
    const token = state.erase ? '.' : state.brush;
    if (!initial && token !== '.' && state.draft.cells[row][col] !== '.') return;
    if (state.draft.cells[row][col] === token) return;
    const cells = state.draft.cells.slice();
    cells[row] = `${cells[row].slice(0, col)}${token}${cells[row].slice(col + 1)}`;
    state.draft = { ...state.draft, cells };
    tile.dataset.token = token;
    tile.className = `tile ${token === '.' ? 'empty' : ''} ${'123'.includes(token) ? 'flask-cell' : ''} ${token === 'z' ? 'zone' : ''}`;
    tile.innerHTML = tileMarkup(token);
    // Keep the painted grid in place during a drag; replacing it would end pointer tracking.
  }

  function resize(rows) {
    state.rows = rows;
    state.draft = catalog.normalize({ ...state.draft, rowCount: rows,
      cells: Array.from({ length: rows }, (_, index) => state.draft.cells[index] || 'w'.repeat(6)) });
    render();
  }

  let toastTimer = 0;
  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  function saveNew() {
    const saved = catalog.createTemplate(state.draft);
    if (!saved) return toast('Не удалось добавить секцию');
    toast('Секция добавлена в пул. Можно рисовать следующую.');
    startBlank();
  }

  function selectTemplate(id) {
    const template = catalog.byId(id);
    if (!template) return;
    state.selectedId = id;
    state.draft = { ...template, cells: template.cells.slice() };
    state.rows = template.rows;
    state.difficulty = template.difficulty;
    render();
  }

  els.mode.addEventListener('click', event => {
    const button = event.target.closest('[data-mode]');
    if (!button) return;
    state.mode = button.dataset.mode;
    startBlank();
  });
  els.categories.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.category = button.dataset.category;
    startBlank();
  });
  els.stars.addEventListener('click', event => {
    const button = event.target.closest('[data-star]');
    if (!button) return;
    state.difficulty = Number(button.dataset.star);
    state.draft = { ...state.draft, difficulty: state.difficulty };
    renderControls();
  });
  els.widths.addEventListener('click', event => {
    const button = event.target.closest('[data-rows]');
    if (button) resize(Number(button.dataset.rows));
  });
  els.brushes.addEventListener('click', event => {
    const button = event.target.closest('[data-brush]');
    if (!button) return;
    state.painting = false;
    state.brush = button.dataset.brush;
    renderBrushes();
  });
  els.pool.addEventListener('click', event => {
    const remove = event.target.closest('[data-delete]');
    if (remove) {
      catalog.deleteTemplate(remove.dataset.delete);
      if (state.selectedId === remove.dataset.delete) startBlank();
      else renderPool();
      toast('Секция удалена из пула');
      return;
    }
    const button = event.target.closest('[data-template]');
    if (button) selectTemplate(button.dataset.template);
  });
  els.grid.addEventListener('pointerdown', event => {
    const tile = event.target.closest('.tile');
    if (!tile) return;
    event.preventDefault();
    state.painting = true;
    state.dragging = true;
    state.erase = event.button === 2;
    paint(tile, true);
  });
  window.addEventListener('pointermove', event => {
    if (!state.painting) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    if (!els.grid.contains(target)) { state.painting = false; state.erase = false; return; }
    paint(target.closest('.tile'), state.dragging);
  });
  els.grid.addEventListener('pointerleave', () => { state.painting = false; state.dragging = false; state.erase = false; });
  window.addEventListener('pointerup', event => {
    state.dragging = false;
    if (event.pointerType !== 'mouse' || !els.grid.contains(event.target)) {
      state.painting = false; state.erase = false;
    }
  });
  els.grid.addEventListener('contextmenu', event => event.preventDefault());
  els.add.addEventListener('click', saveNew);
  els.saveNew.addEventListener('click', saveNew);
  els.fresh.addEventListener('click', startBlank);
  els.update.addEventListener('click', () => {
    if (!state.selectedId) return;
    catalog.updateTemplate(state.draft);
    toast('Изменения сохранены');
    render();
  });
  els.remove.addEventListener('click', () => {
    if (!state.selectedId) return;
    catalog.deleteTemplate(state.selectedId);
    toast('Секция удалена из пула');
    startBlank();
  });
  els.clear.addEventListener('click', () => {
    state.draft = { ...state.draft, cells: state.draft.cells.map(() => '.'.repeat(6)) };
    renderGrid();
  });
  els.mirror.addEventListener('click', () => {
    state.draft = { ...state.draft, cells: state.draft.cells.map(row => [...row].reverse().join('')) };
    renderGrid();
  });

  startBlank();
})();
