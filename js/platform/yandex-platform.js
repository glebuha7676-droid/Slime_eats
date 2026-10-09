(() => {
  'use strict';

  const fallbackStorage = (() => {
    try {
      return window.localStorage;
    } catch (_) {
      return null;
    }
  })();

  function withTimeout(promise, milliseconds) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Platform response timeout')), milliseconds);
      Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value); },
        error => { clearTimeout(timer); reject(error); });
    });
  }

  window.SlimeYandexReady = (async () => {
    const platform = {
      available: false,
      ysdk: null,
      player: null,
      storage: fallbackStorage,
      ready() {},
      gameplay: {
        start() {},
        stop() {}
      },
      subscribe() {}
    };

    const localHost = /^(localhost|127(?:\.\d+){3}|\[::1\])$/.test(window.location.hostname);
    if (localHost && !window.YaGames?.init) return platform;

    await window.SlimeSdkScriptReady;
    if (!window.YaGames?.init) return platform;

    try {
      const ysdk = window.ysdk || await withTimeout(window.YaGames.init(), 15000);
      window.ysdk = ysdk;
      platform.available = true;
      document.documentElement.dataset.yandexGames = 'true';
      platform.ysdk = ysdk;
      let ready = false, playing = false;
      platform.ready = () => { if (!ready) { ready = true; ysdk.features?.LoadingAPI?.ready?.(); } };
      platform.gameplay.start = () => { if (!playing) { playing = true; ysdk.features?.GameplayAPI?.start?.(); } };
      platform.gameplay.stop = () => { if (playing) { playing = false; ysdk.features?.GameplayAPI?.stop?.(); } };
      document.documentElement.dataset.platformLanguage = ysdk.environment?.i18n?.lang || 'ru';
      platform.subscribe = ({ onPause, onResume } = {}) => {
        if (typeof onPause === 'function') ysdk.on?.('game_api_pause', onPause);
        if (typeof onResume === 'function') ysdk.on?.('game_api_resume', onResume);
      };

      const [storageResult, playerResult] = await Promise.allSettled([
        typeof ysdk.getStorage === 'function' ? withTimeout(ysdk.getStorage(), 8000) : Promise.resolve(fallbackStorage),
        typeof ysdk.getPlayer === 'function' ? withTimeout(ysdk.getPlayer({ scopes: false }), 8000) : Promise.resolve(null)
      ]);
      if (storageResult.status === 'fulfilled' && storageResult.value) platform.storage = storageResult.value;
      if (playerResult.status === 'fulfilled') platform.player = playerResult.value;
    } catch (error) {
      // On the platform, never silently announce a locally playable but
      // uninitialized game. The loading screen offers a safe retry instead.
      throw error;
    }

    return platform;
  })();
})();
