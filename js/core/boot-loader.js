(() => {
  'use strict';
  const screen = document.getElementById('bootScreen');
  const fill = document.getElementById('bootFill');
  const percent = document.getElementById('bootPercent');
  const status = document.getElementById('bootStatus');
  const retry = document.getElementById('bootRetry');
  let done = false, failed = false, loaded = 0, previous = -1;
  const manifest = window.SlimeBootManifest || {assets:[]};
  const total = manifest.assets.reduce((sum, asset) => sum + asset.bytes, 0);
  const startedAt = performance.now();
  function paint(value, message) {
    if (failed) return;
    const rounded = Math.max(previous, Math.min(100, Math.floor(value)));
    if (rounded !== previous) {
      previous = rounded;
      fill.style.width = `${rounded}%`;
      percent.textContent = `${rounded}%`;
      screen.setAttribute('aria-valuenow', String(rounded));
    }
    if (message && status.textContent !== message) status.textContent = message;
  }
  function fail(error) {
    if (done || failed) return;
    failed = true;
    screen.dataset.state = 'error';
    status.textContent = 'Не удалось загрузить игру. Проверьте соединение.';
    retry.hidden = false;
    console.error('Loading failed:', error);
  }
  retry.addEventListener('click', () => location.reload());
  window.addEventListener('error', event => {
    if (!done && (event.error || event.target?.tagName === 'SCRIPT')) fail(event.error || new Error('Script unavailable'));
  }, true);
  async function download(asset) {
    // Match the URL requested by the runtime, including immutable version tags.
    const source = asset.url.startsWith('assets/') ? `${asset.url}?v=${manifest.revision}` : asset.url;
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      let consumed = 0;
      try {
        const response = await fetch(source, {signal:controller.signal, cache:'default'});
        if (!response.ok) throw new Error(`${response.status}: ${asset.url}`);
        if (response.body?.getReader) {
          const reader = response.body.getReader();
          for (;;) {
            const chunk = await reader.read();
            if (chunk.done) break;
            const increment = Math.min(chunk.value.byteLength, Math.max(0, asset.bytes - consumed));
            consumed += increment; loaded += increment;
            paint(loaded / total * 98, 'Загружаем миры и мутации…');
          }
        } else await response.arrayBuffer();
        loaded += Math.max(0, asset.bytes - consumed);
        paint(loaded / total * 98);
        return;
      } catch (error) {
        loaded -= consumed;
        if (attempt === 1) throw error;
      } finally { clearTimeout(timeout); }
    }
  }
  async function prepare() {
    if (!total) throw new Error('Resource manifest unavailable');
    // Local file previews need no network warm-up. They still decode the first
    // screen below; avoiding mass Image creation prevents retaining every bitmap.
    if (location.protocol === 'file:') { paint(98, 'Готовим лабораторию…'); return; }
    let cursor = 0;
    const workers = Array.from({length:4}, async () => {
      while (cursor < manifest.assets.length && !failed) await download(manifest.assets[cursor++]);
    });
    await Promise.all(workers);
    if (failed) throw new Error('Startup failed');
    paint(98, 'Готовим лабораторию…');
  }
  async function decodeImage(image) {
    if (!image || !image.getAttribute('src')) return;
    if (!image.complete) await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => finish(new Error('Image load timeout')), 20000);
      const finish = error => {
        clearTimeout(timeout);
        image.removeEventListener('load', onLoad); image.removeEventListener('error', onError);
        error ? reject(error) : resolve();
      };
      const onLoad = () => finish(), onError = () => finish(new Error(`Image unavailable: ${image.src}`));
      image.addEventListener('load', onLoad, {once:true}); image.addEventListener('error', onError, {once:true});
    });
    if (!image.naturalWidth) throw new Error(`Image unavailable: ${image.src}`);
    if (image.decode) await image.decode();
  }
  const ready = prepare();
  ready.catch(fail);
  async function finish(platform, sprites = []) {
    if (done) return;
    await ready;
    await Promise.all([...document.images, ...sprites].filter(image => image?.getAttribute('src') && image.loading !== 'lazy').map(decodeImage));
    await window.SlimeAvatarRenderer?.whenReady?.();
    await window.MenuPetpet?.whenReady?.();
    if (failed) throw new Error('Startup failed');
    paint(100, 'Всё готово!');
    // Two frames let the browser commit decoded artwork before Game Ready.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    document.documentElement.classList.remove('app-booting');
    document.documentElement.classList.add('app-ready');
    screen.hidden = true;
    done = true;
    document.documentElement.dataset.bootMs = String(Math.round(performance.now() - startedAt));
    platform?.ready?.();
  }
  window.SlimeBootLoader = Object.freeze({ready, finish, fail});
})();
