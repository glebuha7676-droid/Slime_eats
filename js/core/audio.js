(() => {
  'use strict';

  const SOUND_ROOT = 'assets/audio/';
  // Increase this value whenever sound files are replaced under the same names.
  // The query string prevents phones and GitHub Pages from keeping stale audio.
  const SOUND_ASSET_VERSION = window.SlimeGameConfig.ASSET_REVISION;
  const ULTIMATE_ASSET_VERSION = 'elemental-cartoon-4';
  const WORLD_ONE_MINE = 'mine-world1-v2';
  const FIRE_MINE = 'mine-fire-v1';
  const MINE_ASSETS = {
    breakFragile: { file: 'fragile', volume: .60, group: 'breakage', spacing: 48 },
    dryStone: { file: 'dry-chip', volume: .70, group: 'breakage', spacing: 48, directory: 'stone-ui-trial' },
    breakStone: { file: 'stone', volume: .62, group: 'breakage', spacing: 48 },
    breakBedrock: { file: 'bedrock', volume: .64, group: 'breakage', spacing: 48 },
    hitSoft: { file: 'impact-soft', volume: .48, group: 'impact', spacing: 54, directory: WORLD_ONE_MINE },
    hit: { file: 'impact', volume: .57, group: 'impact', spacing: 54 },
    hitHard: { file: 'impact-heavy', volume: .62, group: 'impact', spacing: 54 },
    fireIgnite: { file: 'ignite', volume: .54, group: 'ignite', spacing: 125, directory: FIRE_MINE },
    fireAsh: { file: 'ash', volume: .57, group: 'ash', spacing: 95, directory: FIRE_MINE },
    crystal: { file: 'ore-1', volume: .60, group: 'pickup', spacing: 100 }
  };
  const materialRows = [
    ['slime', 'stone', 'heavy'],
    ['snow', 'glacier', 'ice'],
    ['cracker', 'chocolate', 'caramel'],
    ['ash', 'volcanic', 'heavy'],
    ['cloud', 'stone', 'gold'],
    ['porous', 'veined', 'core-rock']
  ];
  const fieldMaterials = new Set(['slime', 'stone', 'heavy', 'snow', 'cracker', 'chocolate', 'caramel', 'ash', 'volcanic', 'gold', 'cloud']);
  for (const row of materialRows) {
    for (const file of row) {
      if (fieldMaterials.has(file)) {
        MINE_ASSETS['hit-' + file] = {file:'hit-' + file, directory:'materials', takes:3, volume:.65, group:'impact', spacing:54};
      }
      MINE_ASSETS[file] = {file: file === 'ash' ? 'ash-soft' : file, directory:'materials', takes:fieldMaterials.has(file) ? 3 : 2, volume:.67, group:'breakage', spacing:48};
    }
  }
  const MINE_RATES = [.99, 1.035, .965];
  const SOUND_ASSETS = {
    tap: { file: 'arcade-foley/tap.wav', volume: .64, size: 3 },
    uiPress: { file: 'lab-controls/pad-press.wav', volume: 0.45, size: 3 },
    uiWorld: { file: 'lab-controls/screen-swipe.wav', volume: 0.45, size: 2 },
    uiFood: { file: 'lab-controls/food.wav', volume: .53, size: 2 },
    uiOpen: { file: 'lab-controls/panel-lift.wav', volume: 0.34, size: 2 },
    uiClose: { file: 'lab-controls/panel-seat.wav', volume: 0.36, size: 2 },
    uiTab: { file: 'arcade-foley/tap.wav', volume: 0.29, size: 2 },
    uiSelect: { file: 'arcade-foley/tap.wav', volume: 0.29, size: 2 },
    mealSwitch: { file: 'lab-controls/lab-select.wav', volume: .54, size: 2 },
    mealBeam: { file: 'lab-controls/meal-beam.wav', volume: .53, size: 1 },
    mealFlash: { file: 'lab-controls/light-burst.wav', volume: 0.5, size: 1 },
    evolutionCharge: { file: 'lab-controls/evolution-charge.wav', volume: .50, size: 1 },
    portalOpen: { file: 'lab-controls/portal-unfold.wav', volume: .48, size: 1 },
    portalPass: { file: 'lab-controls/portal-pass.wav', volume: .46, size: 1 },
    uiConfirm: { file: 'arcade-foley/uiConfirm.wav', volume: 0.48, size: 2 },
    uiError: { file: 'lab-controls/locked.wav', volume: 0.4, size: 1 },
    machineFill: { file: 'lab-controls/reactor-start.wav', volume: 0.5, size: 1 },
    machineProcess: { file: 'lab-controls/reactor-field.wav', volume: 0.33, size: 1 },
    machineReady: { file: 'lab-controls/synthesis-success.wav', volume: .67, size: 1 },
    evolutionReady: { file: 'lab-controls/evolution-reward.wav', volume: .59, size: 1 },
    homeRewardBurst: { file: 'lab-controls/home-reward-burst.wav', volume: .46, size: 1 },
    homeRewardCollect: { file: 'lab-controls/home-reward-collect.wav', volume: .36, size: 2 },
    eatSwallow: { file: 'eat-swallow.ogg', volume: .38, size: 2 },
    fireWindup: { file: 'abilities/fire-gather.wav', volume: .63, size: 1 },
    fireRelease: { file: 'abilities/fire-bloom.wav', volume: .66, size: 1 },
    frostThrow: { file: 'abilities/snowflake-breath.wav', volume: .63, size: 1 },
    frostBurst: { file: 'abilities/snowflake-split.wav', volume: .64, size: 1 },
    electricDash: { file: 'abilities/arc-dash.wav', volume: .65, size: 1 },
    electricDischarge: { file: 'abilities/arc-break.wav', volume: .64, size: 1 },
    happy: { file: 'happy.ogg', volume: .36, size: 2 },
    reroll: { file: 'reroll.ogg', volume: .32, size: 2 },
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
    phoenixSummon: 'casual-phoenix-summon',
    phoenixFlight: 'casual-phoenix-flight-emberwing-v2',
    blizzardGather: 'blizzard-gather',
    blizzardSurge: 'blizzard-surge',
    thunderCharge: 'thunder-charge',
    thunderWarning: 'thunder-warning',
    thunderStrike: 'thunder-strike',
    thunderFinale: 'thunder-finale'
  };
  const ELEMENTAL_CUE_LEVELS = {
    phoenixSummon: .82, phoenixFlight: .86, blizzardGather: .78, blizzardSurge: .85,
    thunderCharge: .82, thunderWarning: .61, thunderStrike: .79, thunderFinale: .82
  };
  const SEEKABLE_ULTIMATE_CUES = new Set(Object.keys(ELEMENTAL_CUE_LEVELS));
  const INTERFACE_CUES = ['uiPress', 'uiTab', 'uiSelect', 'uiOpen', 'uiClose', 'mealSwitch', 'mealBeam', 'mealFlash', 'uiWorld', 'machineFill', 'machineProcess', 'machineReady', 'evolutionReady', 'homeRewardBurst', 'homeRewardCollect', 'eatSwallow', 'evolutionCharge', 'portalOpen', 'portalPass'];
  const ACTIVE_ABILITY_CUES = ['fireWindup', 'fireRelease', 'frostThrow', 'frostBurst', 'electricDash', 'electricDischarge'];
  const MUSIC = {
    menu: { file: 'cozy-stage-menu', volume: .12 },
    anomaly: { file: 'tense-future', volume: .14 }
  };

  function createAudioSystem({ isEnabled = () => true, mineSound = 'default', mineWorld = () => null } = {}) {
    let audioContext = null;
    let mealTimers = [];
    let pendingCrystal = null;
    const ultimateTracks = new Map();
    const soundPools = new Map();
    const takeIndex = new Map();
    const lastMineCue = new Map();
    let musicName = null;
    let musicPlayback = null;
    let musicStart = null;
    const fadingMedia = new Set();
    let musicRequest = 0;
    const musicOffsets = {};
    const musicBuffers = {};

    // Keep the foreground cue at its authored level; ease just the background.
    const playingBackground = new Map();
    let duckLevel = 1;
    let duckUntil = 0;
    let duckFrame = 0;
    function updateDuck(now) {
      const remaining = duckUntil - now;
      const target = remaining > 0 ? .70 : 1;
      const step = remaining > 0 ? .37 : .095;
      duckLevel += (target - duckLevel) * step;
      if (Math.abs(1 - duckLevel) < .004 && remaining <= 0) duckLevel = 1;
      for (const [audio, volume] of playingBackground) {
        if (audio.paused || audio.ended) playingBackground.delete(audio);
        else audio.volume = volume * duckLevel;
      }
      const music = musicPlayback;
      if (music?.duckGain) music.duckGain.gain.setTargetAtTime(duckLevel, audioContext.currentTime, .018);
      if (music?.audio) music.audio.volume = music.audio.fadeVolume * duckLevel;
      duckFrame = duckLevel < 1 || remaining > 0 ? requestAnimationFrame(updateDuck) : 0;
    }

    function duckForAbility(seconds) {
      if (!isEnabled() || document.hidden) return;
      duckUntil = Math.max(duckUntil, performance.now() + seconds * 1000);
      if (!duckFrame) updateDuck(performance.now());
    }

    function getAudioContext() {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return null;
      audioContext ||= new Context();
      return audioContext;
    }

    function fadeMedia(audio, target, seconds, done) {
      const from = audio.fadeVolume ?? audio.volume;
      const started = performance.now();
      function step(now) {
        const t = Math.min(1, (now - started) / (seconds * 1000));
        audio.fadeVolume = from + (target - from) * t;
        audio.volume = audio.fadeVolume * duckLevel;
        if (t < 1) audio.fadeFrame = requestAnimationFrame(step);
        else done?.();
      }
      cancelAnimationFrame(audio.fadeFrame);
      audio.fadeFrame = requestAnimationFrame(step);
    }

    function pauseMusic(immediate = false) {
      musicRequest++;
      musicStart = null;
      if (!musicPlayback) return;
      const { name, source, gain, startedAt, offset, audio } = musicPlayback;
      musicPlayback = null;
      if (audio) {
        musicOffsets[name] = audio.currentTime;
        cancelAnimationFrame(audio.fadeFrame);
        if (immediate) audio.pause();
        else {
          fadingMedia.add(audio);
          fadeMedia(audio, 0, .65, () => { audio.pause(); fadingMedia.delete(audio); });
        }
        return;
      }
      musicOffsets[name] = (offset + audioContext.currentTime - startedAt) % source.buffer.duration;
      const now = audioContext.currentTime;
      gain.gain.cancelAndHoldAtTime ? gain.gain.cancelAndHoldAtTime(now) : gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(0, now, immediate ? .006 : .16);
      source.stop(now + (immediate ? .025 : .78));
    }

    async function startMusic(name, request) {
      const track = MUSIC[name];
      const base = `assets/audio/music/${track.file}`;
      const isCurrent = () => request === musicRequest && name === musicName && isEnabled();
      if (location.protocol !== 'file:' && audioContext) {
        try {
          musicBuffers[name] ||= fetch(`${base}.ogg`).then(response => {
            if (!response.ok) throw new Error('Music download failed');
            return response.arrayBuffer();
          }).then(bytes => audioContext.decodeAudioData(bytes));
          const buffer = await musicBuffers[name];
          if (!isCurrent()) return;
          const source = audioContext.createBufferSource();
          const gain = audioContext.createGain();
          const now = audioContext.currentTime;
          const offset = (musicOffsets[name] || 0) % buffer.duration;
          source.buffer = buffer;
          source.loop = true;
          const duckGain = audioContext.createGain();
          duckGain.gain.value = duckLevel;
          source.connect(gain).connect(duckGain).connect(audioContext.destination);
          source.onended = () => { source.disconnect(); gain.disconnect(); duckGain.disconnect(); };
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(track.volume, now+.95);
          source.start(now, offset);
          musicPlayback = {name, source, gain, duckGain, offset, startedAt:now};
          return;
        } catch {
          delete musicBuffers[name];
        }
      }
      if (!isCurrent()) return;
      const audio = new Audio();
      const format = audio.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
      audio.src = `${base}.${format}`;
      audio.loop = true;
      audio.fadeVolume = audio.volume = 0;
      audio.currentTime = musicOffsets[name] || 0;
      musicPlayback = {name,audio};
      try { await audio.play(); if (isCurrent()) fadeMedia(audio, track.volume, .95); }
      catch { if (isCurrent()) musicPlayback = null; }
    }

    function setMusic(name, { gesture = false, restart = false } = {}) {
      if (musicName !== name || restart || !isEnabled()) pauseMusic();
      if (restart && name) musicOffsets[name] = 0;
      musicName = name;
      if (!name || !isEnabled()) return;
      if (location.protocol !== 'file:') {
        const context = getAudioContext();
        if (context?.state === 'suspended' && (gesture || !musicPlayback)) context.resume().catch(() => {});
      }
      if (musicPlayback || musicStart) return;
      const request = ++musicRequest;
      musicStart = startMusic(name, request).finally(() => {
        if (request === musicRequest) musicStart = null;
      });
    }

    function mineDirectory() {
      if (mineWorld() === 1) return WORLD_ONE_MINE;
      return mineSound === 'toy' ? 'mine-toy-v1' : 'mine-v1';
    }

    function preloadMineAudio({ fire = false } = {}) {
      if (!isEnabled() || document.hidden || typeof Audio === 'undefined') return false;
      const directory = mineDirectory();
      for (const [name, config] of Object.entries(MINE_ASSETS)) {
        if (!config.directory || config.directory === directory || (fire && config.directory === FIRE_MINE)) {
          getSoundPool(name, name === 'crystal' ? 'ore-field' : config.directory || directory);
        }
      }
      getSoundPool('crystal', 'ore-field', 'ore-3');
      getSoundPool('crystal', 'ore-field', 'ore-5');
      return true;
    }

    function preloadInterfaceAudio() {
      if (!isEnabled() || document.hidden || typeof Audio === 'undefined') return;
      for (const name of INTERFACE_CUES) getSoundPool(name);
    }

    function preloadGameAudio() {
      if (!isEnabled() || document.hidden || typeof Audio === 'undefined') return false;
      preloadInterfaceAudio();
      preloadMineAudio();
      for (const name of ACTIVE_ABILITY_CUES) getSoundPool(name);
      for (const name of Object.keys(ULTIMATE_ASSETS)) getSoundPool(name);
      if (location.protocol !== 'file:') {
        for (const name of SEEKABLE_ULTIMATE_CUES) preloadUltimateTrack(name);
      }
      return true;
    }

    function preloadUltimateTrack(name) {
      if (ultimateTracks.has(name)) return;
      const [audio] = getSoundPool(name);
      // A local Blob can seek after a pause even if the preview server ignores byte ranges.
      const track = { url: '' };
      ultimateTracks.set(name, track);
      fetch(audio.src).then(response => {
        if (!response.ok) throw new Error('Ultimate audio unavailable');
        return response.blob();
      }).then(blob => {
        track.url = URL.createObjectURL(blob);
        if (audio.paused && audio.currentTime === 0) {
          audio.preload = 'auto';
          audio.src = track.url;
        }
      }).catch(() => { ultimateTracks.delete(name); });
    }

    function playUltimateCue(name, latenessMs = 0, { resume = false } = {}) {
      if (!ULTIMATE_ASSETS[name] || !isEnabled() || document.hidden) return;
      const audio = getSoundPool(name)?.[0];
      if (!audio) return;
      const offset = Math.max(0, latenessMs) / 1000;
      if (Number.isFinite(audio.duration) && offset >= audio.duration) return;
      audio.pause();
      const localUrl = ultimateTracks.get(name)?.url;
      if (localUrl && audio.src !== localUrl) {
        audio.src = localUrl;
      }
      const continuing = resume && Math.abs(audio.currentTime - offset) < .06;
      if (!continuing) audio.currentTime = offset;
      duckForAbility(Number.isFinite(audio.duration) ? audio.duration - offset : .55);
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
          tap: [300, .035, 'sine'], eatSwallow: [420, .08, 'sine'],
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

    function getSoundPool(kind, directory, variant) {
      const ultimate = ULTIMATE_ASSETS[kind];
      const mine = MINE_ASSETS[kind];
      const mineFile = mine ? `${directory}/${variant || mine.file}.wav` : null;
      const key = mineFile || kind;
      if (soundPools.has(key)) return soundPools.get(key);
      const config = ultimate ? { file: `ultimates/${ultimate}.wav`, volume: ELEMENTAL_CUE_LEVELS[kind] ?? 1, size: 1 }
        : mine ? { file: mineFile, volume: mine.volume, size: MINE_RATES.length } : SOUND_ASSETS[kind];
      if (!config || typeof Audio === 'undefined') return null;
      const version = ultimate ? ULTIMATE_ASSET_VERSION : ACTIVE_ABILITY_CUES.includes(kind) ? 'elemental-cartoon-4' : directory === 'materials' ? 'material-field-8' : SOUND_ASSET_VERSION;
      const pool = Array.from({ length: config.size }, () => {
        const audio = new Audio(new URL(`${SOUND_ROOT}${config.file}?v=${version}`, document.baseURI).href);
        audio.preload = SEEKABLE_ULTIMATE_CUES.has(kind) && location.protocol !== 'file:' ? 'none' : 'auto';
        audio.volume = config.volume;
        audio.loop = kind === 'machineProcess';
        return audio;
      });
      pool.cursor = 0;
      soundPools.set(key, pool);
      return pool;
    }

    function playSoundAsset(kind, crystalValue = 0) {
      if (kind === 'break') kind = 'breakStone';
      const mine = MINE_ASSETS[kind];
      if (mine) {
        const now = performance.now();
        if (now - (lastMineCue.get(mine.group) ?? -Infinity) < mine.spacing) return;
        lastMineCue.set(mine.group, now);
      }
      const directory = kind === 'crystal' ? 'ore-field' : mine ? mine.directory || mineDirectory() : null;
      const worldOneCrystal = kind === 'crystal';
      let materialFile;
      if (directory === 'materials') {
        const take = takeIndex.get(kind) || 0;
        materialFile = mine.file + '-' + take;
        takeIndex.set(kind, (take + 1) % mine.takes);
      }
      const variant = worldOneCrystal && crystalValue >= 3 ? (crystalValue >= 5 ? 'ore-5' : 'ore-3') : materialFile;
      const pool = getSoundPool(kind, directory, variant);
      if (!pool) {
        if (!mine) fallbackSound(kind);
        return;
      }
      const slot = pool.cursor++ % pool.length;
      const audio = pool[slot];
      audio.pause();
      audio.currentTime = 0;
      if (mine) {
        audio.preservesPitch = false;
        audio.playbackRate = worldOneCrystal || mine.takes === 3 ? 1 : MINE_RATES[slot];
      }
      if (ACTIVE_ABILITY_CUES.includes(kind)) {
        duckForAbility(Number.isFinite(audio.duration) ? audio.duration : .48);
      } else {
        const volume = mine?.volume ?? SOUND_ASSETS[kind].volume;
        playingBackground.set(audio, volume);
        audio.volume = volume * duckLevel;
        audio.onended = () => playingBackground.delete(audio);
      }
      const attempt = audio.play();
      if (attempt?.catch) attempt.catch(error => {
        if (!mine && error?.name !== 'AbortError') fallbackSound(kind);
      });
    }

    function sound(kind = 'tap', timing = {}) {
      if (!isEnabled() || document.hidden) return;
      if (kind === 'crystal') {
        if (pendingCrystal) {
          pendingCrystal.value = Math.max(pendingCrystal.value, timing.value || 0);
          return;
        }
        const cue = { value: timing.value || 0 };
        pendingCrystal = cue;
        // When one strike breaks several veins, use the richest reward's chime.
        queueMicrotask(() => {
          if (pendingCrystal !== cue) return;
          pendingCrystal = null;
          if (isEnabled() && !document.hidden) playSoundAsset(kind, cue.value);
        });
        return;
      }
      if (kind === 'eat' || kind === 'eatSlow') {
        mealTimers.forEach(clearTimeout);
        mealTimers = [];
        const swallowDelay = timing.swallowDelay ?? (kind === 'eatSlow' ? 2530 : 720);
        mealTimers.push(setTimeout(() => {
          if (isEnabled() && !document.hidden) playSoundAsset('eatSwallow');
        }, swallowDelay));
        return;
      }
      playSoundAsset(kind);
    }

    function stopSynthMotor() {
      const motor = soundPools.get('machineProcess')?.[0];
      if (motor) motor.pause();
    }

    function stopUltimateAudio() {
      duckUntil = 0;
      for (const name of Object.keys(ULTIMATE_ASSETS)) {
        const audio = soundPools.get(name)?.[0];
        audio?.pause();
      }
    }

    function stopAllSounds() {
      cancelAnimationFrame(duckFrame);
      duckFrame = duckUntil = 0;
      duckLevel = 1;
      playingBackground.clear();
      pauseMusic(true);
      for (const audio of fadingMedia) {
        cancelAnimationFrame(audio.fadeFrame);
        audio.pause();
      }
      fadingMedia.clear();
      lastMineCue.clear();
      pendingCrystal = null;
      mealTimers.forEach(clearTimeout);
      mealTimers = [];
      soundPools.forEach((pool, kind) => pool.forEach(audio => {
        audio.pause();
        if (!ULTIMATE_ASSETS[kind]) audio.currentTime = 0;
      }));
      if (audioContext?.state === 'running') audioContext.suspend().catch(() => {});
    }

    return Object.freeze({ sound, stopSynthMotor, materialRows, stopAllSounds, preloadInterfaceAudio, preloadGameAudio, preloadMineAudio, playUltimateCue, stopUltimateAudio, setMusic });
  }

  window.SlimeAudio = Object.freeze({ createAudioSystem });
})();
