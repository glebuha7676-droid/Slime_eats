(() => {
  'use strict';

  const fallbackStorage = (() => {
    try {
      return window.localStorage;
    } catch (_) {
      return null;
    }
  })();

  window.SlimeYandexReady = (async () => {
    const platform = {
      available: false,
      ysdk: null,
      player: null,
      storage: fallbackStorage
    };

    const localHost = /^(localhost|127(?:\.\d+){3}|\[::1\])$/.test(window.location.hostname);
    if (localHost && !window.YaGames?.init) return platform;

    if (!window.YaGames?.init) return platform;

    try {
      const ysdk = window.ysdk || await window.YaGames.init();
      window.ysdk = ysdk;
      platform.available = true;
      platform.ysdk = ysdk;

      const [storageResult, playerResult] = await Promise.allSettled([
        typeof ysdk.getStorage === 'function' ? ysdk.getStorage() : Promise.resolve(fallbackStorage),
        typeof ysdk.getPlayer === 'function' ? ysdk.getPlayer() : Promise.resolve(null)
      ]);
      if (storageResult.status === 'fulfilled' && storageResult.value) platform.storage = storageResult.value;
      if (playerResult.status === 'fulfilled') platform.player = playerResult.value;
    } catch (error) {
      console.warn('Yandex Games SDK initialization failed; local saves remain active.', error);
    }

    return platform;
  })();
})();
