(() => {
  'use strict';
  const plans = window.SlimeMinePlans;
  const sections = window.SlimeSectionCatalog;
  const $ = selector => document.querySelector(selector);
  const editor = $('#mineEditor');
  const bandsEl = $('#mineBands');
  const paletteEl = $('#minePalette');
  const selectEl = $('#mineSelect');
  const modeEl = $('#mineMode');
  const worldEl = $('#generationWorld');
  const nameEl = $('#mineName');
  const state = { selectedId: '', draft: null, picked: '' };
  const label = id => plans.CATEGORIES.find(item => item.id === id)?.label || 'Пусто';
  const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const pool = () => sections.all();
  const available = (category, rows) => pool().filter(item => item.worldId === state.draft.worldId && item.mode === state.draft.mode && item.category === category && item.rows === rows).length;
  const status = message => { $('#toast').textContent = message; $('#toast').classList.add('show'); setTimeout(() => $('#toast').classList.remove('show'), 2200); };
  function setDraft(value) {
    state.draft = plans.normalize(value);
    state.selectedId = state.draft.id;
    worldEl.value = String(state.draft.worldId);
    modeEl.value = state.draft.mode;
    nameEl.value = state.draft.name;
    render();
  }
  function list() {
    const options = plans.all(state.draft.worldId, state.draft.mode);
    selectEl.innerHTML = options.map(item => `<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
    if (state.selectedId) selectEl.value = state.selectedId;
    if (selectEl.selectedIndex < 0) selectEl.insertAdjacentHTML('afterbegin', '<option value="" selected>Новый шаблон</option>');
    $('#mineSave').disabled = !state.selectedId;
    $('#mineDelete').disabled = !state.selectedId;
  }
  function renderPalette() {
    paletteEl.innerHTML = plans.CATEGORIES.map(category => {
      const counts = [3, 4, 7].map(rows => `${rows}: ${available(category.id, rows) || '!'}`).join(' · ');
      const missing = [3, 4, 7].some(rows => !available(category.id, rows));
      return `<button class="mine-palette-item ${state.picked === category.id ? 'picked' : ''}" type="button" draggable="true" data-category="${category.id}"><b>${esc(category.label)}</b><small class="${missing ? 'warning' : ''}">${counts}</small></button>`;
    }).join('');
  }
  function renderBands() {
    const availableSections = pool();
    const inspection = plans.inspect(state.draft, availableSections);
    $('#mineRouteSummary').textContent = `${state.draft.bands.length * 50} М · ${state.draft.bands.length} ОТРЕЗКОВ · ${inspection.rows} РЯДОВ`;
    $('#mineFlasks').textContent = inspection.minimum === inspection.maximum
      ? `Колбы за шахту: ${inspection.minimum}`
      : `Колбы за шахту: ${inspection.minimum}–${inspection.maximum} · ожидаемо ${inspection.expected}`;
    $('#mineValidation').textContent = `${inspection.rows} рядов · ${inspection.issues.length ? `⚠ ${inspection.issues.length} проблем` : 'Готово к запуску'}`;
    bandsEl.innerHTML = state.draft.bands.map((band, index) => {
      const slots = band.slots.map((slot, slotIndex) => {
        const issue = inspection.issues.find(item => item.band === index && item.slot === slotIndex);
        const options = slot.category ? plans.matching(availableSections, state.draft, slot) : [];
        const values = options.map(plans.flasks);
        const flasks = values.length ? `${Math.min(...values)}${Math.min(...values) === Math.max(...values) ? '' : `–${Math.max(...values)}`}` : '';
        return `<button type="button" draggable="${Boolean(slot.category)}" class="mine-slot ${slot.category ? 'filled' : ''} ${issue ? 'invalid' : ''}" data-band="${index}" data-slot="${slotIndex}" title="${esc(issue?.reason || 'Нажми, чтобы убрать модуль')}"><span>${slot.rows} ряда</span><b>${esc(label(slot.category))}</b>${flasks ? `<small>◈ ${flasks}</small>` : ''}${issue ? '<strong>!</strong>' : ''}</button>`;
      }).join('');
      return `<article class="mine-band"><div class="mine-meter"><b>${index * 50}–${(index + 1) * 50} м</b><small>${index + 1}/${state.draft.bands.length}</small></div><div class="mine-band-body"><div class="mine-shapes">${[['full', '7'], ['left', '3+4'], ['right', '4+3']].map(([shape, text]) => `<button type="button" data-shape="${shape}" data-band="${index}" class="${band.shape === shape ? 'active' : ''}">${text}</button>`).join('')}</div><div class="mine-slots">${slots}</div></div></article>`;
    }).join('');
  }
  function render() { list(); renderPalette(); renderBands(); }
  function changed() {
    state.draft.name = nameEl.value.trim() || 'Новый шаблон';
    if (state.selectedId) {
      plans.update(state.draft);
      status('Маршрут сохранён и будет использоваться в следующем забеге');
    }
    render();
  }
  function place(band, slot, category) {
    const cell = state.draft.bands[band]?.slots[slot];
    if (!cell || !category) return;
    cell.category = category;
    changed();
  }
  document.querySelector('.generator-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-editor-tab]');
    if (!button) return;
    document.querySelectorAll('[data-editor-tab]').forEach(item => item.classList.toggle('active', item === button));
    const mine = button.dataset.editorTab === 'mine';
    editor.hidden = !mine;
    $('#sectionEditor').hidden = mine;
    if (mine) render();
  });
  modeEl.addEventListener('change', () => {
    const first = plans.all(Number(worldEl.value), modeEl.value)[0];
    if (first) setDraft(first);
    else setDraft({ worldId: Number(worldEl.value), mode: modeEl.value, name: 'Новый шаблон', bands: plans.starter(modeEl.value, Number(worldEl.value)).bands });
  });
  worldEl.addEventListener('change', () => {
    const worldId = Number(worldEl.value);
    setDraft(plans.all(worldId, modeEl.value)[0] || plans.starter(modeEl.value, worldId));
  });
  selectEl.addEventListener('change', () => {
    const item = plans.all(state.draft.worldId, state.draft.mode).find(plan => plan.id === selectEl.value);
    if (item) setDraft(item);
  });
  nameEl.addEventListener('change', changed);
  $('#mineNew').addEventListener('click', () => setDraft({ worldId: state.draft.worldId, mode: state.draft.mode, name: 'Новый шаблон', bands: plans.starter(state.draft.mode, state.draft.worldId).bands }));
  $('#mineSave').addEventListener('click', () => { if (state.selectedId) changed(); });
  $('#mineSaveAs').addEventListener('click', () => { setDraft(plans.create({ ...state.draft, name: nameEl.value.trim() || 'Новый шаблон' })); status('Шаблон добавлен'); });
  $('#mineDelete').addEventListener('click', () => {
    if (!state.selectedId) return;
    plans.remove(state.selectedId);
    setDraft(plans.all(state.draft.worldId, state.draft.mode)[0] || { worldId: state.draft.worldId, mode: state.draft.mode, name: 'Новый шаблон', bands: plans.starter(state.draft.mode, state.draft.worldId).bands });
    status('Шаблон удалён');
  });
  paletteEl.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.picked = button.dataset.category;
    renderPalette();
  });
  paletteEl.addEventListener('dragstart', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    state.picked = button.dataset.category;
    event.dataTransfer.setData('text/plain', state.picked);
    event.dataTransfer.effectAllowed = 'copy';
  });
  bandsEl.addEventListener('dragover', event => { if (event.target.closest('.mine-slot')) event.preventDefault(); });
  bandsEl.addEventListener('dragstart', event => {
    const target = event.target.closest('.mine-slot.filled');
    if (!target) return;
    event.dataTransfer.setData('application/x-mine-slot', JSON.stringify([Number(target.dataset.band), Number(target.dataset.slot)]));
    event.dataTransfer.effectAllowed = 'move';
  });
  bandsEl.addEventListener('drop', event => {
    const target = event.target.closest('.mine-slot');
    if (!target) return;
    event.preventDefault();
    const sourceText = event.dataTransfer.getData('application/x-mine-slot');
    if (sourceText) {
      const [sourceBand, sourceSlot] = JSON.parse(sourceText);
      const from = state.draft.bands[sourceBand]?.slots[sourceSlot];
      const to = state.draft.bands[Number(target.dataset.band)]?.slots[Number(target.dataset.slot)];
      if (from && to) { [from.category, to.category] = [to.category, from.category]; changed(); }
      return;
    }
    place(Number(target.dataset.band), Number(target.dataset.slot), event.dataTransfer.getData('text/plain') || state.picked);
  });
  bandsEl.addEventListener('click', event => {
    const shapeButton = event.target.closest('[data-shape]');
    if (shapeButton) {
      const index = Number(shapeButton.dataset.band);
      const previous = state.draft.bands[index];
      if (previous.shape === shapeButton.dataset.shape) return;
      state.draft.bands[index] = plans.makeBand(shapeButton.dataset.shape, previous.slots.map(slot => slot.category));
      changed(); return;
    }
    const target = event.target.closest('.mine-slot');
    if (!target) return;
    const band = Number(target.dataset.band), slot = Number(target.dataset.slot);
    const cell = state.draft.bands[band].slots[slot];
    if (cell.category) { cell.category = ''; changed(); }
    else if (state.picked) place(band, slot, state.picked);
  });
  window.addEventListener('slime-generation-updated', () => { if (!editor.hidden) render(); });
  setDraft(plans.all(Number(worldEl.value), 'normal')[0] || plans.starter('normal', Number(worldEl.value)));
})();
