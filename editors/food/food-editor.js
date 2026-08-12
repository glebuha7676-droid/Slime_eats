(() => {
  'use strict';

  const STORAGE_KEY = 'slime_food_catalog_v2';
  const RARITIES = [
    ['common', 'Обычное'], ['rare', 'Редкое'], ['epic', 'Эпическое'],
    ['legendary', 'Легендарное'], ['prismatic', 'Призматическое'], ['secret', 'Секретное']
  ];
  const CATEGORIES = [['mass', 'Здоровье'], ['power', 'Сила'], ['defense', 'Защита'], ['bounce', 'Отскок'], ['magic', 'Заряд']];
  const STAT_META = [
    ['mass', 'ЗДОРОВЬЕ', value => `+${formatNumber(value)}`],
    ['power', 'СИЛА', value => `+${formatNumber(value)}`],
    ['defense', 'ЗАЩИТА', value => `+${formatPercent(value)}`],
    ['elasticity', 'ОТСКОК', value => `+${formatPercent(value)}`],
    ['ability', 'ЗАРЯД', value => `+${formatNumber(value)}%`],
    ['coinMultiplier', 'МОНЕТЫ', value => `+${formatPercent(value)}`]
  ];
  const els = {
    form: document.querySelector('#foodForm'), list: document.querySelector('#foodList'), search: document.querySelector('#searchInput'),
    filters: document.querySelector('#rarityFilters'), count: document.querySelector('#catalogCount'), title: document.querySelector('#editorTitle'),
    state: document.querySelector('#editorState'), saveState: document.querySelector('#saveState'), add: document.querySelector('#addFoodBtn'),
    remove: document.querySelector('#deleteFoodBtn'), reset: document.querySelector('#resetCatalogBtn'), export: document.querySelector('#exportBtn'),
    importer: document.querySelector('#importInput'), imageUpload: document.querySelector('#imageUpload'), preview: document.querySelector('#cardPreview'),
    previewImage: document.querySelector('#previewImage'), previewEmoji: document.querySelector('#previewEmoji'), previewName: document.querySelector('#previewName'),
    previewRarity: document.querySelector('.preview-rarity'), previewStats: document.querySelector('#previewStats'), previewEffect: document.querySelector('#previewEffect'),
    validation: document.querySelector('#validationText'), toast: document.querySelector('#editorToast'), raritySelect: document.querySelector('#raritySelect'),
    categorySelect: document.querySelector('#categorySelect'), conveyorSelect: document.querySelector('#conveyorSelect'), effectSelect: document.querySelector('#effectSelect')
  };
  const baseCatalog = Array.isArray(window.SLIME_FOOD_CATALOG) ? deepClone(window.SLIME_FOOD_CATALOG) : [];
  const effectOptions = Array.isArray(window.SLIME_FOOD_EFFECTS) ? window.SLIME_FOOD_EFFECTS : [{ id: '', label: 'Без особого эффекта' }];
  let catalog = loadCatalog();
  let activeId = catalog[0]?.id || null;
  let activeFilter = 'all';
  let dirty = false;
  let toastTimer = 0;
  let deleteArmId = '';
  let deleteArmTimer = 0;
  let resetArmed = false;
  let resetArmTimer = 0;

  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
  function formatNumber(value) { return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 2 }); }
  function formatPercent(value) { return `${Math.round(Number(value) * 100)}%`; }
  function escapeHtml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function imageSource(food) {
    const image = String(food.image || '').trim();
    const source = image || `assets/ЕДА/Общий пул/${food.id}.webp`;
    return /^(?:data:|https?:|blob:)/i.test(source) ? source : `../../${source.replace(/^\.\//, '')}`;
  }
  function normalizeFood(source) {
    if (!source || typeof source !== 'object') return null;
    const id = String(source.id || '').trim();
    const name = String(source.name || '').trim();
    if (!/^[a-z][A-Za-z0-9_-]{0,47}$/.test(id) || !name) return null;
    const number = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
    const rarity = RARITIES.some(([key]) => key === source.rarity) ? source.rarity : 'common';
    const category = CATEGORIES.some(([key]) => key === source.category) ? source.category : 'mass';
    const result = {
      id, name, icon: String(source.icon || '🍓').slice(0, 8), rarity, category,
      minConveyor: Math.round(number(source.minConveyor || 1, 1, 5)),
      mass: number(source.mass, 0, 999), power: number(source.power, 0, 99),
      defense: number(source.defense, 0, 9.99), elasticity: number(source.elasticity, 0, 9.99),
      ability: number(source.ability, 0, 999), coinMultiplier: number(source.coinMultiplier, 0, 99),
      artX: number(source.artX, -30, 30), artY: number(source.artY, -30, 30), artScale: number(source.artScale || 1, .55, 1.6),
      effect: String(source.effect || '').trim(), effectText: String(source.effectText || '').trim()
    };
    const image = String(source.image || '').trim();
    if (image) result.image = image;
    if (Array.isArray(source.worlds)) result.worlds = source.worlds.map(Number).filter(worldId => worldId >= 1 && worldId <= 4);
    return result;
  }
  function normalizeCatalog(value) {
    if (!Array.isArray(value)) return [];
    const ids = new Set();
    return value.map(normalizeFood).filter(food => food && !ids.has(food.id) && ids.add(food.id));
  }
  function loadCatalog() {
    try {
      const stored = normalizeCatalog(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
      return stored.length ? stored : normalizeCatalog(baseCatalog);
    } catch (_) {
      return normalizeCatalog(baseCatalog);
    }
  }
  function persistCatalog(message = 'Каталог сохранён — игра возьмёт его после перезагрузки') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
      dirty = false;
      renderSaveState();
      showToast(message);
      return true;
    } catch (_) {
      showToast('Не удалось сохранить: картинка слишком большая для браузера');
      return false;
    }
  }
  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }
  function optionMarkup(items) { return items.map(([value, label]) => `<option value="${value}">${label}</option>`).join(''); }
  function setupSelects() {
    els.raritySelect.innerHTML = optionMarkup(RARITIES);
    els.categorySelect.innerHTML = optionMarkup(CATEGORIES);
    els.conveyorSelect.innerHTML = [1, 2, 3, 4, 5].map(value => `<option value="${value}">Ур. ${value}</option>`).join('');
    els.effectSelect.innerHTML = effectOptions.map(effect => `<option value="${escapeHtml(effect.id)}">${escapeHtml(effect.label)}</option>`).join('');
    els.filters.innerHTML = `<button class="rarity-filter active" data-rarity="all" type="button">ВСЕ</button>${RARITIES.map(([id, label]) => `<button class="rarity-filter" data-rarity="${id}" type="button">${label.toUpperCase()}</button>`).join('')}`;
  }
  function rarityLabel(rarity) { return RARITIES.find(([id]) => id === rarity)?.[1] || 'Обычное'; }
  function rarityColor(rarity) { return ({ common: '#73b86f', rare: '#3ba9d2', epic: '#9d69db', legendary: '#dfa520', prismatic: '#7f73e8', secret: '#ff62ad' })[rarity] || '#97a1af'; }
  function categoryLabel(category) { return CATEGORIES.find(([id]) => id === category)?.[1] || 'Здоровье'; }
  function visibleFoods() {
    const query = els.search.value.trim().toLocaleLowerCase('ru');
    return catalog.filter(food => (!query || `${food.name} ${food.id}`.toLocaleLowerCase('ru').includes(query)) && (activeFilter === 'all' || food.rarity === activeFilter));
  }
  function renderList() {
    const foods = visibleFoods();
    // While creating a new card `activeId` stays null. Do not silently select
    // the first row here, otherwise saving a new card would overwrite it.
    if (activeId !== null && !foods.some(food => food.id === activeId) && foods.length) activeId = foods[0].id;
    els.list.innerHTML = foods.length ? foods.map(food => `
      <button class="food-row ${food.id === activeId ? 'active' : ''}" data-id="${escapeHtml(food.id)}" type="button">
        <img src="${escapeHtml(imageSource(food))}" alt="" onerror="this.style.visibility='hidden'">
        <span><b>${escapeHtml(food.name)}</b><small>${rarityLabel(food.rarity).toUpperCase()} · ${categoryLabel(food.category).toUpperCase()}</small></span>
        <i style="--rarity:${rarityColor(food.rarity)}"></i>
      </button>`).join('') : '<p class="field-hint">Ничего не найдено.</p>';
    els.count.textContent = `${catalog.length} КАРТОЧЕК`;
  }
  function activeFood() { return catalog.find(food => food.id === activeId) || null; }
  function setForm(food, isNew = false) {
    const data = food || newFood();
    for (const [name, value] of Object.entries(data)) {
      const input = els.form.elements.namedItem(name);
      if (input) input.value = value ?? '';
    }
    for (const name of ['mass', 'power', 'defense', 'elasticity', 'ability', 'coinMultiplier']) {
      if (!Object.hasOwn(data, name)) els.form.elements.namedItem(name).value = 0;
    }
    els.title.textContent = data.name || 'Новая еда';
    els.state.textContent = isNew ? 'НОВАЯ КАРТОЧКА' : `РЕДАКТИРОВАНИЕ · ${rarityLabel(data.rarity).toUpperCase()}`;
    els.remove.disabled = isNew;
    dirty = false;
    syncArtOutputs();
    renderSaveState();
    renderPreview();
  }
  function newFood() {
    let index = 1;
    let id = 'newFood';
    while (catalog.some(food => food.id === id)) { index += 1; id = `newFood${index}`; }
    return { id, name: 'Новая еда', icon: '🍓', rarity: 'common', category: 'mass', minConveyor: 1, mass: 6, power: 0, defense: 0, elasticity: 0, ability: 0, coinMultiplier: 0, artX: 0, artY: 0, artScale: 1, effect: '', effectText: '', image: '' };
  }
  function formFood() {
    const data = Object.fromEntries(new FormData(els.form).entries());
    const normalized = normalizeFood(data);
    const sourceWorlds = activeFood()?.worlds;
    if (normalized && Array.isArray(sourceWorlds)) normalized.worlds = [...sourceWorlds];
    return normalized;
  }
  function validateDraft(food) {
    if (!food) return 'ID: латиница, цифры, _ или -, начиная с буквы.';
    if (food.effect && !food.effectText) return 'Для особого эффекта добавь короткое понятное описание.';
    if (catalog.some(item => item.id === food.id && item.id !== activeId)) return 'Такой ID уже есть в каталоге.';
    return `Готово: ${food.effect ? 'карточка способности' : 'карточка характеристик'} · ${rarityLabel(food.rarity).toLowerCase()}.`;
  }
  function renderPreview() {
    const food = formFood() || { ...newFood(), name: els.form.elements.name.value || 'Новая еда' };
    const validation = validateDraft(food);
    const valid = !validation.startsWith('ID:') && !validation.startsWith('Для') && !validation.startsWith('Такой');
    els.validation.textContent = validation;
    els.validation.parentElement.style.borderColor = valid ? '#71c89b' : '#d89194';
    els.preview.className = `preview-card ${food.rarity || 'common'}`;
    els.previewRarity.textContent = rarityLabel(food.rarity || 'common').toUpperCase();
    els.previewName.textContent = food.name || 'Новая еда';
    els.previewEmoji.textContent = food.icon || '🍓';
    const source = imageSource(food);
    els.previewImage.onload = () => { els.previewImage.style.display = 'block'; els.previewEmoji.style.display = 'none'; };
    els.previewImage.onerror = () => { els.previewImage.removeAttribute('src'); els.previewEmoji.style.display = 'block'; };
    els.previewImage.src = source;
    els.previewImage.style.transform = `translate(${food.artX}%, ${food.artY}%) scale(${food.artScale})`;
    const stats = STAT_META.filter(([key]) => Number(food[key]) > 0).slice(0, 4);
    els.previewStats.innerHTML = stats.map(([key, label, formatter]) => `<span class="preview-stat">${label}<br><b>${formatter(food[key])}</b></span>`).join('') || '<span class="preview-stat">БЕЗ СТАТОВ</span>';
    els.previewEffect.textContent = food.effectText || '';
    els.previewEffect.classList.toggle('hidden', !food.effect);
    els.previewStats.classList.toggle('hidden', Boolean(food.effect));
    els.title.textContent = food.name || 'Новая еда';
  }
  function syncArtOutputs() {
    ['artX', 'artY', 'artScale'].forEach(name => {
      const input = els.form.elements.namedItem(name);
      const output = document.querySelector(`[data-art-output="${name}"]`);
      if (!input || !output) return;
      const value = Number(input.value) || 0;
      output.textContent = name === 'artScale' ? `${Math.round(value * 100)}%` : `${value}%`;
    });
  }
  function renderSaveState() {
    els.saveState.textContent = dirty ? 'НЕ СОХРАНЕНО' : 'СОХРАНЕНО';
    els.saveState.classList.toggle('saved', !dirty);
  }
  function selectFood(id) {
    activeId = id;
    setForm(activeFood());
    renderList();
  }
  function saveCurrent(event) {
    event.preventDefault();
    const food = formFood();
    const validation = validateDraft(food);
    if (!food || !validation.startsWith('Готово:')) {
      showToast(validation);
      return;
    }
    const currentIndex = catalog.findIndex(item => item.id === activeId);
    if (currentIndex >= 0) catalog[currentIndex] = food;
    else catalog.push(food);
    activeId = food.id;
    if (persistCatalog()) {
      setForm(food);
      renderList();
    }
  }
  function addFood() {
    activeId = null;
    setForm(newFood(), true);
    renderList();
    els.form.elements.name.focus();
  }
  function deleteFood() {
    const food = activeFood();
    if (!food) return;
    if (deleteArmId !== food.id) {
      deleteArmId = food.id;
      els.remove.textContent = 'НАЖМИ ЕЩЁ РАЗ';
      clearTimeout(deleteArmTimer);
      deleteArmTimer = setTimeout(() => { deleteArmId = ''; els.remove.textContent = 'УДАЛИТЬ'; }, 15000);
      showToast(`Повтори нажатие, чтобы удалить «${food.name}»`);
      return;
    }
    clearTimeout(deleteArmTimer);
    deleteArmId = '';
    els.remove.textContent = 'УДАЛИТЬ';
    catalog = catalog.filter(item => item.id !== food.id);
    activeId = catalog[0]?.id || null;
    persistCatalog('Карточка удалена из пула игры');
    setForm(activeFood() || newFood(), !activeId);
    renderList();
  }
  function resetCatalog() {
    if (!resetArmed) {
      resetArmed = true;
      els.reset.textContent = 'Нажми ещё раз для сброса';
      clearTimeout(resetArmTimer);
      resetArmTimer = setTimeout(() => { resetArmed = false; els.reset.textContent = 'Вернуть базовый каталог'; }, 15000);
      showToast('Повтори нажатие — редактор вернёт базовый каталог');
      return;
    }
    clearTimeout(resetArmTimer);
    resetArmed = false;
    els.reset.textContent = 'Вернуть базовый каталог';
    localStorage.removeItem(STORAGE_KEY);
    catalog = normalizeCatalog(baseCatalog);
    activeId = catalog[0]?.id || null;
    setForm(activeFood());
    renderList();
    showToast('Возвращён базовый каталог игры');
  }
  function exportCatalog() {
    const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'slime-food-publish.json'; link.click();
    URL.revokeObjectURL(url);
    showToast('Файл еды скачан — отправь его для публикации в GitHub');
  }
  function importCatalog(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_800_000) { showToast('JSON слишком большой — используй файл до 1,8 МБ'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = normalizeCatalog(JSON.parse(String(reader.result)));
        if (!imported.length) throw new Error('empty');
        catalog = imported;
        activeId = catalog[0].id;
        persistCatalog('Каталог импортирован и добавлен в пул игры');
        setForm(activeFood());
        renderList();
      } catch (_) { showToast('Не удалось прочитать каталог: проверь JSON-файл'); }
    };
    reader.readAsText(file);
  }
  function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_500_000) { showToast('Картинка больше 1,5 МБ. Сожми её или положи WebP в assets/ЕДА/.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      els.form.elements.image.value = String(reader.result);
      dirty = true;
      renderSaveState();
      renderPreview();
      showToast('Картинка загружена — нажми «Сохранить в пул игры»');
    };
    reader.readAsDataURL(file);
  }
  function markDirty() { dirty = true; syncArtOutputs(); renderSaveState(); renderPreview(); }

  setupSelects();
  renderList();
  setForm(activeFood() || newFood(), !activeId);
  els.form.addEventListener('submit', saveCurrent);
  els.form.addEventListener('input', markDirty);
  els.form.addEventListener('change', markDirty);
  els.list.addEventListener('click', event => { const button = event.target.closest('.food-row'); if (button) selectFood(button.dataset.id); });
  els.filters.addEventListener('click', event => {
    const button = event.target.closest('[data-rarity]');
    if (!button) return;
    activeFilter = button.dataset.rarity;
    els.filters.querySelectorAll('.rarity-filter').forEach(filter => filter.classList.toggle('active', filter.dataset.rarity === activeFilter));
    renderList();
  });
  els.search.addEventListener('input', renderList);
  els.add.addEventListener('click', addFood);
  els.remove.addEventListener('click', deleteFood);
  els.reset.addEventListener('click', resetCatalog);
  els.export.addEventListener('click', exportCatalog);
  els.importer.addEventListener('change', importCatalog);
  els.imageUpload.addEventListener('change', uploadImage);
})();
