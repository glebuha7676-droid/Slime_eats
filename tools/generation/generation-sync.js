(() => {
  'use strict';
  const note = document.createElement('div');
  note.className = 'generation-sync-status';
  document.querySelector('.topbar').append(note);
  let timer = 0;
  const sectionsKey = window.SlimeSectionCatalog.STORAGE_KEY;
  const plansKey = window.SlimeMinePlans.KEY;
  const legacyKey = 'slime_generation_sections_v3';
  const stored = (key, fallback) => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  async function sync() {
    const sections = stored(sectionsKey, window.SlimeGeneratedData?.sections || { changed: [], created: [], deleted: [] });
    const plans = stored(plansKey, window.SlimeGeneratedData?.plans || { changed: [], created: [], deleted: [] });
    try {
      const response = await fetch('/__save-generation', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, plans }) });
      if (!response.ok) throw Error(`HTTP ${response.status}`);
      window.SlimeGeneratedData = { sections, plans };
      note.textContent = '✓ Сохранено в проект';
      note.classList.remove('error');
      return true;
    } catch (_) {
      note.textContent = '⚠ Открой редактор через локальный сервер: node tools/generation/dev-server.cjs';
      note.classList.add('error');
      return false;
    }
  }
  window.addEventListener('slime-generation-updated', () => {
    note.textContent = 'Сохраняю…';
    clearTimeout(timer);
    timer = setTimeout(sync, 180);
  });
  document.querySelector('#generationExport').addEventListener('click', () => {
    const data = { sections: stored(sectionsKey, window.SlimeGeneratedData?.sections || { changed: [], created: [], deleted: [] }),
      plans: stored(plansKey, window.SlimeGeneratedData?.plans || { changed: [], created: [], deleted: [] }),
      legacy: stored(legacyKey, []) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'mine-generation-backup.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const fileInput = document.querySelector('#generationImportFile');
  document.querySelector('#generationImport').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.sections || !data.plans || !Array.isArray(data.sections.changed) || !Array.isArray(data.plans.changed)) throw Error('Invalid backup');
      localStorage.setItem(sectionsKey, JSON.stringify(data.sections));
      localStorage.setItem(plansKey, JSON.stringify(data.plans));
      if (Array.isArray(data.legacy)) localStorage.setItem(legacyKey, JSON.stringify(data.legacy));
      if (await sync()) location.reload();
    } catch (_) { note.textContent = '⚠ Неверный файл шаблонов'; note.classList.add('error'); }
  });
  if (location.protocol !== 'http:' || location.hostname !== '127.0.0.1') {
    note.textContent = '⚠ Для записи в проект открой редактор через локальный сервер';
    note.classList.add('error');
  } else note.textContent = 'Изменения автоматически сохраняются в проект';
})();
