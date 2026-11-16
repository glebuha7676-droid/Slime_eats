(() => {
  'use strict';

  const SOUND_ROOT = 'assets/audio/';
  // Increase this value whenever sound files are replaced under the same names.
  // The query string prevents phones and GitHub Pages from keeping stale audio.
  const SOUND_ASSET_VERSION = window.SlimeGameConfig.ASSET_REVISION;
  const ULTIMATE_ASSET_VERSION = 'ultimate-audio-1';
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
  const ULTIMATE_ASSETS = {
    infinityCharge: 'infinity-charge',
    infinityFusion: 'infinity-fusion',
    infinityLaunch: 'infinity-launch',
    infinityTail: 'infinity-tail',
    phoenixSummon: 'phoenix-summon',
    phoenixFlight: 'phoenix-flight'
  };
  const PHOENIX_CUES = new Set(['phoenixSummon', 'phoenixFlight']);

  function createAudioSystem({ isEnabled = () => true } = {}) {
    let audioContext = null;
    let mealTimers = [];
    const phoenixTracks = new Map();
    const soundPools = new Map();

    function getAudioContext() {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      audioContext ||= new Context();
      return audioContext;
    }

    function preloadUltimateAudio() {
      if (!isEnabled() || document.hidden || typeof Audio === 'undefined') return false;
      for (const name of Object.keys(ULTIMATE_ASSETS)) getSoundPool(name);
      if (location.protocol !== 'file:') {
        for (const name of PHOENIX_CUES) preloadPhoenixTrack(name);
      }
      return true;
    }

    function preloadPhoenixTrack(name) {
      if (phoenixTracks.has(name)) return;
      const [audio] = getSoundPool(name);
      // A local Blob can seek after a pause even if the preview server ignores byte ranges.
      const track = { url: '' };
      phoenixTracks.set(name, track);
      fetch(audio.src).then(response => {
        if (!response.ok) throw new Error('Phoenix audio unavailable');
        return response.blob();
      }).then(blob => {
        track.url = URL.createObjectURL(blob);
        if (audio.paused && audio.currentTime === 0) {
          audio.preload = 'auto';
          audio.src = track.url;
        }
      }).catch(() => { phoenixTracks.delete(name); });
    }

    function playUltimateCue(name, latenessMs = 0, { resume = false } = {}) {
      if (!ULTIMATE_ASSETS[name] || !isEnabled() || document.hidden) return;
      const audio = getSoundPool(name)?.[0];
      if (!audio) return;
      const offset = Math.max(0, latenessMs) / 1000;
      if (Number.isFinite(audio.duration) && offset >= audio.duration) return;
      audio.pause();
      const localUrl = phoenixTracks.get(name)?.url;
      if (localUrl && audio.src !== localUrl) {
        audio.src = localUrl;
      }
      const continuing = resume && Math.abs(audio.currentTime - offset) < .06;
      if (!continuing) audio.currentTime = offset;
      audio.play()?.catch(() => {});
    }

    function fallbackSound(kind = 'tap') {
      if (!isEnabled() || document.hidden) return;
      try {
        if (!getAudioContext()) return;
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        const configs = {
          tap: [300, .035, 'sine'], eatBite: [520, .09, 'sine'], eatSwallow: [420, .08, 'sine'],
          happy: [680, .13, 'sine'], reroll: [220, .08, 'triangle'],
          hit: [105, .075, 'square'], hitHard: [82, .11, 'square'], break: [145, .09, 'sawtooth'], bounce: [260, .055, 'sine'],
          epic: [760, .18, 'sine'], coin: [900, .06, 'sine'], fail: [110, .22, 'sawtooth'], win: [620, .32, 'triangle'],
          shieldPop: [620, .095, 'sine'], mineBeep:[430,.055,'sine'], mineAlertBeep:[570,.045,'sine']
        };
        const [frequency, duration, type] = configs[kind] || configs.tap;
        oscillator.frequency.setValueAtTime(frequency, now);
        if (kind === 'shieldPop') oscillator.frequency.exponentialRampToValueAtTime(75, now + duration);
        oscillator.type = type;
        if(kind==='mineBeep'||kind==='mineAlertBeep'){
          gain.gain.setValueAtTime(.001,now);
          gain.gain.exponentialRampToValueAtTime(kind==='mineBeep'?.014:.022,now+.006);
        }else gain.gain.setValueAtTime(.045, now);
        gain.gain.exponentialRampToValueAtTime(.001, now + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
      } catch (_) {
        // Audio is an optional enhancement; gameplay must continue without it.
      }
    }

    function getSoundPool(kind) {
      if (soundPools.has(kind)) return soundPools.get(kind);
      const ultimate = ULTIMATE_ASSETS[kind];
      const config = ultimate ? { file: `ultimates/${ultimate}.wav`, volume: 1, size: 1 } : SOUND_ASSETS[kind];
      if (!config || typeof Audio === 'undefined') return null;
      const version = ultimate ? ULTIMATE_ASSET_VERSION : SOUND_ASSET_VERSION;
      const pool = Array.from({ length: config.size }, () => {
        const audio = new Audio(new URL(`${SOUND_ROOT}${config.file}?v=${version}`, document.baseURI).href);
        audio.preload = PHOENIX_CUES.has(kind) && location.protocol !== 'file:' ? 'none' : 'auto';
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
      if (!isEnabled() || document.hidden) return;
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

    function stopUltimateAudio() {
      for (const name of Object.keys(ULTIMATE_ASSETS)) {
        const audio = soundPools.get(name)?.[0];
        audio?.pause();
      }
    }

    function stopAllSounds() {
      mealTimers.forEach(clearTimeout);
      mealTimers = [];
      soundPools.forEach((pool, kind) => pool.forEach(audio => {
        audio.pause();
        if (!ULTIMATE_ASSETS[kind]) audio.currentTime = 0;
      }));
      if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    }

    return Object.freeze({ sound, stopAllSounds, preloadUltimateAudio, playUltimateCue, stopUltimateAudio });
  }

  window.SlimeAudio = Object.freeze({ createAudioSystem });
})();
