(() => {
  'use strict';

  const SOUND_ROOT = 'assets/audio/';
  // Increase this value whenever sound files are replaced under the same names.
  // The query string prevents phones and GitHub Pages from keeping stale audio.
  const SOUND_ASSET_VERSION = '20260815-1';
  const SOUND_ASSETS = {
    tap: { file: 'button.ogg', volume: .34, size: 3 },
    eatBite: { file: 'eat-bite.ogg', volume: .42, size: 2 },
    eatSwallow: { file: 'eat-swallow.ogg', volume: .38, size: 2 },
    happy: { file: 'happy.ogg', volume: .36, size: 2 },
    reroll: { file: 'reroll.ogg', volume: .32, size: 2 },
    hit: { file: 'slime-hit.ogg', volume: .42, size: 3 },
    hitHard: { file: 'slime-hit-hard.ogg', volume: .46, size: 3 },
    break: { file: 'block-break.ogg', volume: .38, size: 3 },
    bounce: { file: 'bounce.ogg', volume: .36, size: 2 },
    epic: { file: 'epic.ogg', volume: .38, size: 2 },
    coin: { file: 'coin.ogg', volume: .34, size: 3 },
    fail: { file: 'fail.ogg', volume: .35, size: 1 },
    win: { file: 'win.ogg', volume: .38, size: 1 }
  };

  function createAudioSystem({ isEnabled = () => true } = {}) {
    let audioContext = null;
    let mealTimers = [];
    const soundPools = new Map();

    function fallbackSound(kind = 'tap') {
      try {
        audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        const configs = {
          tap: [300, .035, 'sine'], eatBite: [520, .09, 'sine'], eatSwallow: [420, .08, 'sine'],
          happy: [680, .13, 'sine'], reroll: [220, .08, 'triangle'],
          hit: [105, .075, 'square'], hitHard: [82, .11, 'square'], break: [145, .09, 'sawtooth'], bounce: [260, .055, 'sine'],
          epic: [760, .18, 'sine'], coin: [900, .06, 'sine'], fail: [110, .22, 'sawtooth'], win: [620, .32, 'triangle']
        };
        const [frequency, duration, type] = configs[kind] || configs.tap;
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.type = type;
        gain.gain.setValueAtTime(.045, now);
        gain.gain.exponentialRampToValueAtTime(.001, now + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
      } catch (_) {
        // Audio is an optional enhancement; gameplay must continue without it.
      }
    }

    function getSoundPool(kind) {
      const config = SOUND_ASSETS[kind];
      if (!config || typeof Audio === 'undefined') return null;
      if (soundPools.has(kind)) return soundPools.get(kind);
      const pool = Array.from({ length: config.size }, () => {
        const audio = new Audio(new URL(`${SOUND_ROOT}${config.file}?v=${SOUND_ASSET_VERSION}`, document.baseURI).href);
        audio.preload = 'auto';
        audio.volume = config.volume;
        return audio;
      });
      pool.cursor = 0;
      soundPools.set(kind, pool);
      return pool;
    }

    function playSoundAsset(kind) {
      const pool = getSoundPool(kind);
      if (!pool) return fallbackSound(kind);
      const audio = pool[pool.cursor++ % pool.length];
      audio.pause();
      audio.currentTime = 0;
      const attempt = audio.play();
      if (attempt?.catch) attempt.catch(() => fallbackSound(kind));
    }

    function sound(kind = 'tap', timing = {}) {
      if (!isEnabled()) return;
      if (kind === 'eat' || kind === 'eatSlow') {
        mealTimers.forEach(clearTimeout);
        mealTimers = [];
        const biteDelay = timing.biteDelay ?? (kind === 'eatSlow' ? 720 : 210);
        const swallowDelay = timing.swallowDelay ?? (kind === 'eatSlow' ? 2530 : 720);
        mealTimers.push(setTimeout(() => {
          if (isEnabled() && !document.hidden) playSoundAsset('eatBite');
        }, biteDelay));
        mealTimers.push(setTimeout(() => {
          if (isEnabled() && !document.hidden) playSoundAsset('eatSwallow');
        }, swallowDelay));
        return;
      }
      playSoundAsset(kind);
    }

    function stopAllSounds() {
      mealTimers.forEach(clearTimeout);
      mealTimers = [];
      soundPools.forEach(pool => pool.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      }));
      if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    }

    return Object.freeze({ sound, stopAllSounds });
  }

  window.SlimeAudio = Object.freeze({ createAudioSystem });
})();
