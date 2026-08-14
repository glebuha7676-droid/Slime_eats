(() => {
  'use strict';

  const CONFIG = window.SlimeGameConfig;
  const ASSETS = window.SlimeGameAssets;
  if (!CONFIG || !ASSETS || !window.SlimeAudio || !window.SlimeAvatarRenderer) {
    throw new Error('Game modules must be loaded before game.js');
  }

  const {
    SAVE_KEY,
    CLOUD_SAVE_KEY,
    LEGACY_SAVE_KEYS,
    VIEW_W,
    VIEW_H,
    LEVEL_COUNT,
    LEVEL_DEPTH_RATIOS,
    WORLD_LEVELS,
    PHYSICS: BALANCE,
    BLOCK_TIERS,
    RARITY_LABELS,
    ORE_TYPES,
    SKINS,
    UPGRADES: UPGRADE_DATA
  } = CONFIG;
  const WORLDS = structuredClone(CONFIG.WORLDS);
  const defaultSave = structuredClone(CONFIG.DEFAULT_SAVE);
  const {
    FOODS,
    WORLD_SPRITES,
    CRACK_STAGE_SPRITES,
    VFX_SPRITES,
    versionedAsset,
    ensureWorldSprites,
    editorSprite,
    foodArtMarkup,
    centerFoodThumbnail,
    uiIconMarkup
  } = ASSETS;
  const { drawSlimeAvatar } = window.SlimeAvatarRenderer;

  // Данные из встроенного редактора миров. Значения остаются безопасными:
  // если редактор ещё не использовался, игра работает на исходных настройках.
  const EDITOR_WORLDS = window.SlimeWorldCatalog?.load?.() || { worlds: [] };
  let GAME_BALANCE = window.SlimeBalance?.load?.() || window.SlimeBalance?.defaults?.() || null;
  function editorWorld(worldId) { return EDITOR_WORLDS.worlds?.find(item => +item.id === +worldId) || null; }
  function editorBlock(worldId, id) { return editorWorld(worldId)?.blocks?.find(item => item.id === id) || null; }
  function editorLevel(worldId, level) { return editorWorld(worldId)?.levels?.[clamp(Math.round(level) - 1, 0, LEVEL_COUNT - 1)] || null; }
  function gameplayZone(worldId, level, progress) { return window.SlimeBalance?.getZone?.(GAME_BALANCE, worldId, level, progress) || null; }
  WORLDS.forEach(world => {
    const edited = editorWorld(world.id);
    if (!edited) return;
    world.name = edited.name || world.name;
    world.accent = edited.accent || world.accent;
    world.sky = edited.background?.top || world.sky;
    world.earth = edited.background?.top || world.earth;
    world.deep = edited.background?.bottom || world.deep;
    world.editorBackground = edited.background || null;
  });

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const els = {
    app: $('#app'),
    coinsLabel: $('#coinsLabel'), runCoinsGain: $('#runCoinsGain'), worldLabel: $('#worldLabel'), worldIcon: $('#worldIcon'),
    worldEyebrow: $('#worldEyebrow'), levelPassedBadge: $('#levelPassedBadge'), worldProgressText: $('#worldProgressText'),
    worldProgressBar: $('#worldProgressBar'), worldProgressMarker: $('#worldProgressMarker'), worldHint: $('#worldHint'),
    homeScreen: $('#homeScreen'), dropScreen: $('#dropScreen'), slimeStage: $('#slimeStage'), slime: $('#slime'),
    menuSlimeCanvas: $('#menuSlimeCanvas'), menuSlimeMouth: $('#menuSlimeMouth'),
    foodInside: $('#foodInside'), rarityBursts: $('#rarityBursts'), massLabel: $('#massLabel'), powerLabel: $('#powerLabel'),
    defenseLabel: $('#defenseLabel'), bounceLabel: $('#bounceLabel'), levelButtons: $('#levelButtons'), levelDepthLabel: $('#levelDepthLabel'),
    massCompare: $('#massCompare'), powerCompare: $('#powerCompare'), defenseCompare: $('#defenseCompare'), bounceCompare: $('#bounceCompare'),
    startDropLabel: $('#startDropLabel'), adminMenuBtn: $('#adminMenuBtn'), adminToolsOverlay: $('#adminToolsOverlay'),
    closeAdminToolsBtn: $('#closeAdminToolsBtn'), adminRestartBtn: $('#adminRestartBtn'),
    adminPrevWorldBtn: $('#adminPrevWorldBtn'), adminNextWorldBtn: $('#adminNextWorldBtn'),
    adminWorldValue: $('#adminWorldValue'), adminUnlockAllBtn: $('#adminUnlockAllBtn'), adminResetProgressBtn: $('#adminResetProgressBtn'),
    conveyor: $('#conveyor'), foodChoices: $('#foodChoices'), rerollBtn: $('#rerollBtn'), rerollTitle: $('#rerollTitle'), rerollText: $('#rerollText'),
    foodInfo: $('#foodInfo'), foodInfoStats: $('#foodInfoStats'), foodInfoEffect: $('#foodInfoEffect'),
    stomachQuickSlots: $('#stomachQuickSlots'),
    playSetupCard: $('#playSetupCard'), homeWorldSelect: $('#homeWorldSelect'), homeWorldPickerIcon: $('#homeWorldPickerIcon'),
    homeWorldPickerEyebrow: $('#homeWorldPickerEyebrow'), homeWorldPickerName: $('#homeWorldPickerName'), homeWorldBest: $('#homeWorldBest'),
    campaignModeBtn: $('#campaignModeBtn'), endlessModeBtn: $('#endlessModeBtn'),
    campaignModePanel: $('#campaignModePanel'), endlessModePanel: $('#endlessModePanel'), endlessBestScore: $('#endlessBestScore'),
    endlessBestDepth: $('#endlessBestDepth'), startDropBtn: $('#startDropBtn'), startEndlessBtn: $('#startEndlessBtn'),
    depthLabel: $('#depthLabel'), runMassLabel: $('#runMassLabel'), runHealthBar: $('#runHealthBar'),
    routeProgress: $('#routeProgress'), routeBestMarker: $('#routeBestMarker'), routeBestLabel: $('#routeBestLabel'),
    routeSlimeMarker: $('#routeSlimeMarker'), routeTargetLabel: $('#routeTargetLabel'),
    shaft: $('#shaft'), canvas: $('#physicsCanvas'), impactText: $('#impactText'),
    steerLeftBtn: $('#steerLeftBtn'), steerRightBtn: $('#steerRightBtn'),
    abilityBtn: $('#abilityBtn'), abilityPercent: $('#abilityPercent'), abilityText: $('#abilityText'), endRunBtn: $('#endRunBtn'),
    runMenuOverlay: $('#runMenuOverlay'), resumeRunBtn: $('#resumeRunBtn'), restartRunBtn: $('#restartRunBtn'),
    finishRunBtn: $('#finishRunBtn'), toggleRunSoundBtn: $('#toggleRunSoundBtn'), runSoundIcon: $('#runSoundIcon'), runSoundLabel: $('#runSoundLabel'),
    panelOverlay: $('#panelOverlay'), panelTitle: $('#panelTitle'), panelContent: $('#panelContent'), closePanelBtn: $('#closePanelBtn'),
    secretDiscoveryOverlay: $('#secretDiscoveryOverlay'), secretDiscoveryEye: $('#secretDiscoveryEye'), secretDiscoveryCard: $('#secretDiscoveryCard'),
    resultOverlay: $('#resultOverlay'), resultBadge: $('#resultBadge'), resultTitle: $('#resultTitle'), resultText: $('#resultText'),
    resultWorldIcon: $('#resultWorldIcon'), resultWorldName: $('#resultWorldName'), resultDepth: $('#resultDepth'), resultCoins: $('#resultCoins'),
    resultMultiplierLabel: $('#resultMultiplierLabel'), resultMultiplierTrack: $('#resultMultiplierTrack'),
    resultMultiplierNeedle: $('#resultMultiplierNeedle'), resultMultiplierHint: $('#resultMultiplierHint'),
    resultMultiplierBtn: $('#resultMultiplierBtn'), continueBtn: $('#continueBtn'),
    gameCompleteOverlay: $('#gameCompleteOverlay'), gameCompleteHomeBtn: $('#gameCompleteHomeBtn'), playEndlessBtn: $('#playEndlessBtn'),
    adOverlay: $('#adOverlay'), adReason: $('#adReason'), adRewardBtn: $('#adRewardBtn'), adCancelBtn: $('#adCancelBtn'),
    toast: $('#toast')
  };

  let session = null;
  let run = null;
  let pendingAdResolver = null;
  let adInFlight = false;
  let suppressFoodClickUntil = 0;
  let lastFocusedElement = null;
  let menuEmotionTimer = null;
  let menuGazeTimer = null;
  let secretSequenceToken = 0;
  let secretSequenceActive = false;
  let secretRevealCanClose = false;
  let secretRevealResolver = null;
  let foodFlyerToken = 0;
  let slimeInteractionTimer = null;
  let resultCoinAnimationId = 0;
  let resultRevealToken = 0;
  let autoResumeRunAfterVisibility = false;
  const RESULT_MULTIPLIERS = [.5, 1, 1.5, 2, 1.5, 1, .5];
  const RESULT_SWEEP_MS = 900;
  const TRAILS = Object.freeze([
    { id: 'none', name: 'Без следа', cost: 0 },
    { id: 'redJelly', name: 'Красное желе', cost: 250, asset: 'assets/ui/trails/trail-red.png', colors: ['rgba(255,54,69,0)', 'rgba(255,76,88,.48)', 'rgba(239,42,57,.94)'], glow: '#ff5964' },
    { id: 'pinkJelly', name: 'Розовое желе', cost: 300, asset: 'assets/ui/trails/trail-pink.png', colors: ['rgba(255,78,178,0)', 'rgba(255,108,194,.5)', 'rgba(247,54,159,.95)'], glow: '#ff78c6' },
    { id: 'blueJelly', name: 'Синее желе', cost: 300, asset: 'assets/ui/trails/trail-blue.png', colors: ['rgba(42,145,255,0)', 'rgba(61,177,255,.5)', 'rgba(22,135,240,.95)'], glow: '#51c7ff' },
    { id: 'yellowJelly', name: 'Жёлтое желе', cost: 300, asset: 'assets/ui/trails/trail-yellow.png', colors: ['rgba(255,211,34,0)', 'rgba(255,225,60,.52)', 'rgba(255,193,18,.96)'], glow: '#ffe45c' },
    { id: 'greenJelly', name: 'Зелёное желе', cost: 300, asset: 'assets/ui/trails/trail-green.png', colors: ['rgba(48,225,93,0)', 'rgba(64,238,116,.5)', 'rgba(24,192,76,.95)'], glow: '#58ef8d' },
    { id: 'orangeJelly', name: 'Оранжевое желе', cost: 300, asset: 'assets/ui/trails/trail-orange.png', colors: ['rgba(255,126,34,0)', 'rgba(255,150,47,.5)', 'rgba(244,91,18,.96)'], glow: '#ff9a45' },
    { id: 'purpleJelly', name: 'Фиолетовое желе', cost: 300, asset: 'assets/ui/trails/trail-purple.png', colors: ['rgba(142,67,255,0)', 'rgba(166,90,255,.5)', 'rgba(119,43,230,.95)'], glow: '#b47cff' },
    { id: 'starJelly', name: 'Звёздное желе', cost: 750, asset: 'assets/ui/trails/trail-star.png', effect: 'stars', colors: ['rgba(21,13,74,0)', 'rgba(58,31,141,.66)', 'rgba(17,25,88,.98)'], glow: '#6652d8', life: 1.12 },
    { id: 'goldJelly', name: 'Золотой блеск', cost: 900, asset: 'assets/ui/trails/trail-gold.png', effect: 'gold', colors: ['rgba(255,171,8,0)', 'rgba(255,218,49,.54)', 'rgba(255,164,6,.96)'], glow: '#ffe56b', life: 1.15 },
    { id: 'rainbowJelly', name: 'Радужное желе', cost: 1100, asset: 'assets/ui/trails/trail-rainbow.png', effect: 'rainbow', life: 1.14 },
    { id: 'bubbleJelly', name: 'Мыльные пузыри', cost: 850, asset: 'assets/ui/trails/trail-bubbles.png', effect: 'bubbles', glow: '#b9efff', life: 1.2 }
  ]);
  let slimePointer = null;
  let menuSlimeAnimationId = 0;
  let menuSlimeLastFrame = 0;
  const menuGaze = { x: 0, y: 0 };
  const menuPetPoint = { x: 0, y: 0 };
  const SAVE_BACKUP_KEY = `${SAVE_KEY}_backup`;
  const SAVE_SYNC_DELAY = 5000;
  let saveStorage = null;
  let yandexPlatform = null;
  let cloudSaveTimer = 0;
  let cloudSaveInFlight = null;
  let saveUpdatedAt = 0;
  let saveRevision = 0;
  let save = loadSave();
  const { sound, stopAllSounds } = window.SlimeAudio.createAudioSystem({
    isEnabled: () => save.sound
  });
  let toastTimer = null;
  let dragState = null;
  let selectedFoodOfferIndex = null;
  let selectedFoodInfoKey = null;
  let activeShopTab = 'skins';
  let activeEncyclopediaTab = 'foods';
  let activeEncyclopediaWorld = save.world;
  let activeEncyclopediaRarity = 'common';
  const ctx = els.canvas.getContext('2d');
  const menuSlimeCtx = els.menuSlimeCanvas.getContext('2d');

  // ===== СОХРАНЕНИЕ И ВОССТАНОВЛЕНИЕ СЕССИИ =====
  function browserStorage() {
    try {
      return window.localStorage;
    } catch (_) {
      return null;
    }
  }

  function parseSave(raw, source = 'save') {
    if (!raw) return null;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      const payload = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
      const normalized = normalizeSave(payload);
      return {
        save: normalized,
        updatedAt: Math.max(0, Math.round(+(parsed.updatedAt ?? payload.updatedAt) || 0)),
        revision: Math.max(0, Math.round(+(parsed.revision ?? payload.revision) || 0)),
        source
      };
    } catch (error) {
      console.warn(`Invalid ${source} ignored:`, error);
      return null;
    }
  }

  function readSaveCandidates(storage) {
    if (!storage) return [];
    const candidates = [];
    for (const [key, source] of [[SAVE_KEY, 'local'], [SAVE_BACKUP_KEY, 'backup'], ...LEGACY_SAVE_KEYS.map(key => [key, `legacy:${key}`])]) {
      try {
        const candidate = parseSave(storage.getItem(key), source);
        if (candidate) candidates.push(candidate);
      } catch (error) {
        console.warn(`Save storage read failed for ${key}:`, error);
      }
    }
    return candidates;
  }

  function saveProgressScore(value) {
    const worldBest = Object.values(value.worldBest || {}).reduce((sum, depth) => sum + Math.max(0, +depth || 0), 0);
    const unlocks = Object.values(value.unlockedLevels || {}).reduce((sum, level) => sum + Math.max(0, +level || 0), 0);
    return worldBest * 100000 + unlocks * 10000 + Math.max(0, +value.totalRuns || 0) * 100 + Math.min(99, Math.floor(+value.coins || 0));
  }

  function chooseNewestSave(candidates) {
    return candidates.filter(Boolean).sort((left, right) =>
      right.updatedAt - left.updatedAt || right.revision - left.revision || saveProgressScore(right.save) - saveProgressScore(left.save)
    )[0] || null;
  }

  function loadSave(storage = browserStorage()) {
    const selected = chooseNewestSave(readSaveCandidates(storage));
    if (!selected) return structuredClone(defaultSave);
    saveUpdatedAt = selected.updatedAt;
    saveRevision = selected.revision;
    return selected.save;
  }

  function normalizeSave(value) {
    const sourceSchema = Math.max(0, Math.round(+value.schemaVersion || 0));
    const sourceStomachLevel = Math.round(+value.stomachLevel || (sourceSchema >= 10 ? 2 : 1));
    const merged = { ...structuredClone(defaultSave), ...value };
    merged.schemaVersion = 13;
    merged.coins = Math.max(0, Number.isFinite(+merged.coins) ? +merged.coins : defaultSave.coins);
    merged.world = clamp(Math.round(+merged.world || 1), 1, WORLDS.length);
    merged.stomachLevel = clamp(sourceSchema < 10 ? sourceStomachLevel + 1 : sourceStomachLevel, 2, UPGRADE_DATA.stomachLevel.max);
    merged.conveyorLevel = clamp(Math.round(+merged.conveyorLevel || 1), 1, UPGRADE_DATA.conveyorLevel.max);
    merged.rerollLevel = clamp(Math.round(+merged.rerollLevel || 0), 0, UPGRADE_DATA.rerollLevel.max);
    merged.bestDepth = Math.max(0, +merged.bestDepth || 0);
    merged.endlessBestScore = { ...defaultSave.endlessBestScore };
    merged.endlessBestDepth = { ...defaultSave.endlessBestDepth };
    for (const world of WORLDS) {
      merged.endlessBestScore[world.id] = Math.max(0, Math.floor(+(value.endlessBestScore?.[world.id] || 0)));
      merged.endlessBestDepth[world.id] = Math.max(0, Math.floor(+(value.endlessBestDepth?.[world.id] || 0)));
    }
    merged.homeMode = value.homeMode === 'endless' ? 'endless' : 'campaign';
    merged.totalRuns = Math.max(0, Math.round(+merged.totalRuns || 0));
    merged.worldBest = { ...defaultSave.worldBest };
    for (const world of WORLDS) merged.worldBest[world.id] = clamp(+(value.worldBest?.[world.id] || 0), 0, world.targetDepth);
    const finalWorld = WORLDS[WORLDS.length - 1];
    merged.gameCompleted = Boolean(value.gameCompleted || (finalWorld && merged.worldBest[finalWorld.id] >= finalWorld.targetDepth));
    merged.lastRunDepth = {};
    for (const world of WORLDS) {
      for (let level = 1; level <= LEVEL_COUNT; level += 1) {
        const key = `${world.id}:${level}`;
        const targetDepth = levelTargetDepth(world, level);
        const recordedDepth = clamp(+(value.lastRunDepth?.[key] || 0), 0, targetDepth);
        const completedDepth = merged.worldBest[world.id] >= targetDepth ? targetDepth : 0;
        merged.lastRunDepth[key] = Math.max(recordedDepth, completedDepth);
      }
    }
    merged.selectedLevels = { ...defaultSave.selectedLevels };
    merged.unlockedLevels = { ...defaultSave.unlockedLevels };
    for (const world of WORLDS) {
      let inferredUnlocked = 1;
      for (let level = 1; level < LEVEL_COUNT; level += 1) {
        if (merged.worldBest[world.id] >= levelTargetDepth(world, level)) inferredUnlocked = level + 1;
      }
      const unlocked = clamp(Math.max(inferredUnlocked, Math.round(+(value.unlockedLevels?.[world.id] || 1))), 1, LEVEL_COUNT);
      const requested = value.selectedLevels?.[world.id] ?? inferredUnlocked;
      merged.unlockedLevels[world.id] = unlocked;
      merged.selectedLevels[world.id] = clamp(Math.round(+requested || 1), 1, unlocked);
    }
    merged.unlockedSkins = Array.isArray(value.unlockedSkins) ? [...new Set(value.unlockedSkins.filter(id => SKINS.some(skin => skin.id === id)))] : ['classic'];
    if (!merged.unlockedSkins.includes('classic')) merged.unlockedSkins.unshift('classic');
    if (!SKINS.some(skin => skin.id === merged.selectedSkin)) merged.selectedSkin = 'classic';
    merged.unlockedTrails = Array.isArray(value.unlockedTrails)
      ? [...new Set(value.unlockedTrails.filter(id => TRAILS.some(trail => trail.id === id)))]
      : ['none'];
    if (!merged.unlockedTrails.includes('none')) merged.unlockedTrails.unshift('none');
    if (!TRAILS.some(trail => trail.id === merged.selectedTrail) || !merged.unlockedTrails.includes(merged.selectedTrail)) merged.selectedTrail = 'none';
    merged.discoveredFoods = Array.isArray(value.discoveredFoods)
      ? [...new Set(value.discoveredFoods.filter(id => FOODS.some(food => food.id === id)))]
      : [];
    merged.revealedSecretFoods = Array.isArray(value.revealedSecretFoods)
      ? [...new Set(value.revealedSecretFoods.filter(id => FOODS.some(food => food.id === id && food.rarity === 'secret')))]
      : [];
    merged.foodPity = { ...defaultSave.foodPity };
    for (const key of Object.keys(merged.foodPity)) merged.foodPity[key] = clamp(Math.round(+(value.foodPity?.[key] || 0)), 0, 10000);
    for (const key of ['pendingEpicBoost', 'pendingMassBoost', 'pendingExtraRerolls', 'wheelAdSpins', 'dailyStreak']) {
      merged[key] = Math.max(0, Math.round(+merged[key] || 0));
    }
    merged.dailyStreak = clamp(merged.dailyStreak, 0, 7);
    merged.wheelAdSpins = clamp(merged.wheelAdSpins, 0, 2);
    merged.activeDraft = value.activeDraft && typeof value.activeDraft === 'object' ? value.activeDraft : null;
    merged.pendingWheel = value.pendingWheel && Number.isInteger(value.pendingWheel.rewardIndex) ? value.pendingWheel : null;
    return merged;
  }

  function serializeSession() {
    if (!session) return null;
    return {
      worldId: save.world,
      foods: session.foods.map(food => food.id),
      offer: session.offer.map(food => food?.id || null),
      commonOnlyStreak: session.commonOnlyStreak,
      offersSeen: session.offersSeen,
      freeRerolls: session.freeRerolls,
      adRerolls: session.adRerolls,
      baseEpicBoost: session.baseEpicBoost,
      massBoost: session.massBoost
    };
  }

  function restoreSession(raw) {
    if (!raw || raw.worldId !== save.world || !Array.isArray(raw.foods) || !Array.isArray(raw.offer)) return false;
    const foodById = id => FOODS.find(food => food.id === id);
    const foods = raw.foods.map(foodById).filter(Boolean).slice(0, save.stomachLevel);
    const offer = raw.offer.slice(0, 3).map(id => id ? foodById(id) || null : null);
    while (offer.length < 3) offer.push(null);
    if (!offer.some(Boolean) && !foods.length) return false;
    session = {
      foods, offer,
      commonOnlyStreak: Math.max(0, Math.round(+raw.commonOnlyStreak || 0)),
      noEpicStreak: 0, noLegendaryStreak: 0,
      offersSeen: Math.max(1, Math.round(+raw.offersSeen || 1)),
      freeRerolls: Math.max(0, Math.round(+raw.freeRerolls || 0)),
      adRerolls: Math.max(0, Math.round(+raw.adRerolls || 0)),
      baseEpicBoost: clamp(+raw.baseEpicBoost || 0, 0, 10),
      massBoost: clamp(+raw.massBoost || 0, 0, 100),
      stats: {}, effects: {}, combo: null,
      rerollPending: false
    };
    const consumedSecrets = foods.filter(food => food.rarity === 'secret').map(food => food.id);
    if (consumedSecrets.length) save.revealedSecretFoods = [...new Set([...(save.revealedSecretFoods || []), ...consumedSecrets])];
    discoverFoods([...foods, ...offer.filter(food => food && food.rarity !== 'secret')]);
    return true;
  }

  function createSaveEnvelope() {
    return {
      format: 1,
      schemaVersion: save.schemaVersion,
      updatedAt: saveUpdatedAt,
      revision: saveRevision,
      data: structuredClone(save)
    };
  }

  function writeLocalSave(envelope, storage = saveStorage || browserStorage()) {
    const serialized = JSON.stringify(envelope);
    const targets = [storage, browserStorage()].filter((target, index, list) => target && list.indexOf(target) === index);
    for (const target of targets) {
      try {
        const previous = target.getItem(SAVE_KEY);
        if (previous && parseSave(previous, 'previous')) target.setItem(SAVE_BACKUP_KEY, previous);
        target.setItem(SAVE_KEY, serialized);
        return true;
      } catch (error) {
        console.warn('Local save write failed, trying fallback storage:', error);
      }
    }
    return false;
  }

  function scheduleCloudSave({ immediate = false } = {}) {
    if (!yandexPlatform?.player?.setData) return;
    window.clearTimeout(cloudSaveTimer);
    cloudSaveTimer = window.setTimeout(() => flushCloudSave(immediate), immediate ? 0 : SAVE_SYNC_DELAY);
  }

  async function flushCloudSave(flush = false) {
    if (!yandexPlatform?.player?.setData) return false;
    if (cloudSaveInFlight) {
      await cloudSaveInFlight.catch(() => {});
      if (!flush) return true;
    }
    const envelope = createSaveEnvelope();
    cloudSaveInFlight = yandexPlatform.player.setData({ [CLOUD_SAVE_KEY]: envelope }, Boolean(flush))
      .then(() => true)
      .catch(error => {
        console.warn('Cloud save failed; local copy is safe:', error);
        return false;
      })
      .finally(() => { cloudSaveInFlight = null; });
    return cloudSaveInFlight;
  }

  function persist({ captureDraft = true, cloud = true } = {}) {
    if (captureDraft && session && !run) save.activeDraft = serializeSession();
    saveUpdatedAt = Date.now();
    saveRevision += 1;
    writeLocalSave(createSaveEnvelope());
    if (cloud) scheduleCloudSave();
    updatePersistentUI();
  }

  async function initializeReliableSaves() {
    let platform = null;
    try {
      platform = await Promise.race([
        window.SlimeYandexReady || Promise.resolve(null),
        new Promise(resolve => window.setTimeout(() => resolve(null), 4500))
      ]);
    } catch (error) {
      console.warn('Platform save initialization failed:', error);
    }
    yandexPlatform = platform;
    saveStorage = platform?.storage || browserStorage();

    const localCandidate = chooseNewestSave([
      ...readSaveCandidates(saveStorage),
      ...readSaveCandidates(browserStorage())
    ]);
    let cloudCandidate = null;
    if (platform?.player?.getData) {
      try {
        const cloudData = await platform.player.getData([CLOUD_SAVE_KEY]);
        cloudCandidate = parseSave(cloudData?.[CLOUD_SAVE_KEY], 'cloud');
      } catch (error) {
        console.warn('Cloud save load failed; using local progress:', error);
      }
    }

    const selected = chooseNewestSave([localCandidate, cloudCandidate]);
    if (selected) {
      save = selected.save;
      saveUpdatedAt = selected.updatedAt || Date.now();
      saveRevision = selected.revision;
    } else {
      saveUpdatedAt = Date.now();
      saveRevision = 0;
    }

    writeLocalSave(createSaveEnvelope(), saveStorage);
    if (platform?.player?.setData && selected?.source !== 'cloud') scheduleCloudSave({ immediate: true });
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function formatCompactNumber(value) {
    const number = Number.isFinite(+value) ? +value : 0;
    const absolute = Math.abs(number);
    const unit = absolute >= 1e9 ? [1e9, 'B'] : absolute >= 1e6 ? [1e6, 'M'] : absolute >= 1e3 ? [1e3, 'K'] : null;
    if (!unit) return Math.floor(number).toLocaleString('ru-RU');
    const scaled = number / unit[0];
    const digits = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2;
    const compact = scaled.toFixed(digits).replace(/\.0+$|(?<=\.[0-9])0$/u, '').replace('.', ',');
    return `${compact}${unit[1]}`;
  }

  let mobilePerformanceMode = matchMedia('(pointer:coarse)').matches || window.innerWidth <= 540;
  const lowPowerPerformanceMode = (navigator.deviceMemory && navigator.deviceMemory <= 4)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  function isMobileDevice() { return mobilePerformanceMode; }

  function isLowPowerDevice() { return lowPowerPerformanceMode; }

  function effectDensity() {
    return isLowPowerDevice() ? .58 : isMobileDevice() ? .74 : 1;
  }

  function scaledEffectCount(count, minimum = 1) {
    return Math.min(count, Math.max(minimum, Math.round(count * effectDensity())));
  }

  function syncPerformanceMode() {
    mobilePerformanceMode = matchMedia('(pointer:coarse)').matches || window.innerWidth <= 540;
    document.documentElement.classList.toggle('mobile-lite', isMobileDevice());
    document.documentElement.classList.toggle('low-power-device', isLowPowerDevice());
  }

  function visibleInteractionLayer() {
    const viewer = document.querySelector('.encyclopedia-card-viewer');
    if (viewer) return viewer;
    return [els.secretDiscoveryOverlay, els.adOverlay, els.gameCompleteOverlay, els.runMenuOverlay, els.resultOverlay, els.adminToolsOverlay, els.panelOverlay]
      .find(layer => layer && !layer.classList.contains('hidden')) || null;
  }

  function syncInteractionLayers() {
    const activeLayer = visibleInteractionLayer();
    const screen = document.body.dataset.screen || 'home';
    const modalOpen = Boolean(activeLayer || adInFlight);
    els.app.inert = modalOpen;
    els.homeScreen.inert = modalOpen || screen !== 'home';
    els.dropScreen.inert = modalOpen || screen !== 'drop';
    [els.panelOverlay, els.adminToolsOverlay, els.secretDiscoveryOverlay, els.runMenuOverlay, els.resultOverlay, els.gameCompleteOverlay, els.adOverlay].forEach(layer => {
      if (layer) layer.inert = layer !== activeLayer;
    });
    document.querySelectorAll('.encyclopedia-card-viewer').forEach(layer => { layer.inert = layer !== activeLayer; });
    document.body.classList.toggle('ui-modal-open', modalOpen);
    if (modalOpen && menuSlimeAnimationId) {
      cancelAnimationFrame(menuSlimeAnimationId);
      menuSlimeAnimationId = 0;
    } else if (!modalOpen && screen === 'home') startMenuSlimeLoop();
  }

  function initializeInteractionLayers() {
    const observer = new MutationObserver(syncInteractionLayers);
    [els.panelOverlay, els.adminToolsOverlay, els.secretDiscoveryOverlay, els.runMenuOverlay, els.resultOverlay, els.gameCompleteOverlay, els.adOverlay].forEach(layer => {
      if (layer) observer.observe(layer, { attributes: true, attributeFilter: ['class'] });
    });
    observer.observe(document.body, { childList: true });
    syncInteractionLayers();
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function round1(value) { return Math.round(value * 10) / 10; }
  function foodGrowthScale(foodCount) { return 1 + Math.max(0, foodCount) * .05; }
  function levelConfig(world, level) {
    const entries = WORLD_LEVELS[world.id];
    const index = clamp(Math.round(level) - 1, 0, LEVEL_COUNT - 1);
    const fallback = entries?.[index] || null;
    const edited = editorLevel(world.id, level);
    if (!edited) return fallback;
    const enabled = Array.isArray(edited.enabled) ? edited.enabled : [];
    return {
      ...(fallback || {}), depth: edited.depth || fallback?.depth,
      features: {
        ...(fallback?.features || { boss: false }),
        dynamite: enabled.includes('bomb'), medkit: enabled.includes('heal'), hazards: enabled.includes('hazard')
      }
    };
  }

  function levelFeatures(world, level) {
    const configured = levelConfig(world, level)?.features;
    return configured || { dynamite: true, medkit: true, hazards: true, boss: false };
  }

  function levelTargetDepth(world, level) {
    const configured = levelConfig(world, level);
    if (configured?.depth) return configured.depth;
    const ratio = LEVEL_DEPTH_RATIOS[clamp(Math.round(level) - 1, 0, LEVEL_COUNT - 1)];
    return Math.max(20, Math.round(world.targetDepth * ratio / 5) * 5);
  }
  function selectedLevelForWorld(worldId = save.world) {
    const unlocked = clamp(Math.round(save.unlockedLevels?.[worldId] || 1), 1, LEVEL_COUNT);
    return clamp(Math.round(save.selectedLevels?.[worldId] || 1), 1, unlocked);
  }
  function levelReward(world, level) {
    return Math.max(10, Math.round(world.reward * (.15 + level * .17)));
  }
  function todayKey(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return todayKey(d); }
  function currentWorld() { return WORLDS[clamp(save.world - 1, 0, WORLDS.length - 1)]; }
  function worldIsUnlocked(worldId) {
    const world = WORLDS.find(item => item.id === Number(worldId));
    if (!world) return false;
    if (world.id === 1 || world.id <= save.world) return true;
    const previous = WORLDS.find(item => item.id === world.id - 1);
    return Boolean(previous && (save.worldBest?.[previous.id] || 0) >= previous.targetDepth);
  }
  function skinById(id) { return SKINS.find(s => s.id === id) || SKINS[0]; }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  function showRarityBurst(food) {
    if (!els.rarityBursts) return;
    const titles = {
      common: 'НЯМ!', rare: 'ОГО, РЕДКОЕ!', epic: 'ЭПИЧНО!', legendary: 'ЛЕГЕНДАРНО!',
      prismatic: 'РАДУЖНЫЙ ВКУС!', secret: 'СЕКРЕТ РАСКРЫТ!'
    };
    const burst = document.createElement('span');
    burst.className = `rarity-burst ${food.rarity}`;
    burst.textContent = titles[food.rarity] || 'ВКУСНО!';
    els.rarityBursts.replaceChildren(burst);
    setTimeout(() => burst.remove(), food.rarity === 'secret' ? 2350 : food.rarity === 'prismatic' ? 1900 : 1500);
  }

  const waitForSecretPhase = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  function escapeMarkup(value) {
    return String(value ?? '').replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character]));
  }

  function secretCardMarkup(food) {
    const cardType = foodCardType(food);
    const cardBody = cardType === 'ability'
      ? `<span class="food-ability-copy"><b><span class="effect-title-star" aria-hidden="true">★</span><span class="effect-title-label">ЭФФЕКТ</span></b><em>${escapeMarkup(food.effectText)}</em></span>`
      : `<span class="food-stat-block"><b class="card-section-title">ХАРАКТЕРИСТИКИ</b><span class="food-stat-grid count-${Math.min(foodStatItems(food).length, 4)}">${foodStatGridMarkup(food)}</span></span>`;
    return `<article class="food-card secret secret-revealed food-type-${cardType}"><span class="rarity"><span class="rarity-name"><i aria-hidden="true"></i><span>СЕКРЕТНОЕ</span></span></span><span class="food-model-wrap">${foodArtMarkup(food)}</span><span class="food-name">${escapeMarkup(food.name)}</span>${cardBody}</article>`;
  }

  function waitForSecretCardDismiss(food, token) {
    revealSecretFood(food);
    persist({ captureDraft: false });
    els.secretDiscoveryCard.innerHTML = secretCardMarkup(food);
    els.secretDiscoveryOverlay.classList.add('show-card');
    els.secretDiscoveryCard.focus({ preventScroll: true });
    secretRevealCanClose = false;
    setTimeout(() => {
      if (token === secretSequenceToken) secretRevealCanClose = true;
    }, 480);
    return new Promise(resolve => { secretRevealResolver = resolve; });
  }

  function dismissSecretDiscovery() {
    if (!secretSequenceActive || !secretRevealCanClose || !secretRevealResolver) return false;
    secretRevealCanClose = false;
    const resolve = secretRevealResolver;
    secretRevealResolver = null;
    els.secretDiscoveryOverlay.classList.add('card-closing');
    sound('tap');
    feedback(10);
    setTimeout(resolve, 360);
    return true;
  }

  function cancelSecretDiscovery() {
    secretSequenceToken += 1;
    secretSequenceActive = false;
    secretRevealCanClose = false;
    const resolve = secretRevealResolver;
    secretRevealResolver = null;
    resolve?.();
    document.body.classList.remove('secret-discovery-active');
    els.secretDiscoveryOverlay?.classList.add('hidden');
    if (els.secretDiscoveryOverlay) els.secretDiscoveryOverlay.className = 'secret-discovery-overlay hidden';
    if (els.secretDiscoveryCard) els.secretDiscoveryCard.replaceChildren();
    clearMenuMealReaction();
    syncInteractionLayers();
  }

  async function playSecretDiscovery(food, offerIndex) {
    if (secretSequenceActive) return;
    secretSequenceActive = true;
    const token = ++secretSequenceToken;
    clearMenuMealReaction();
    hideFoodInfo();
    clearMenuSlimeInteraction();
    document.body.classList.add('secret-discovery-active');
    els.secretDiscoveryOverlay.className = 'secret-discovery-overlay phase-birth';
    syncInteractionLayers();
    sound('tap');
    feedback(9);
    await waitForSecretPhase(1050);
    if (token !== secretSequenceToken) return;
    els.secretDiscoveryOverlay.className = 'secret-discovery-overlay phase-open';
    sound('epic');
    feedback([15, 35, 24]);
    await waitForSecretPhase(700);
    if (token !== secretSequenceToken) return;
    els.secretDiscoveryOverlay.className = 'secret-discovery-overlay phase-watch';
    await waitForSecretPhase(1650);
    if (token !== secretSequenceToken) return;
    els.secretDiscoveryOverlay.className = 'secret-discovery-overlay phase-collapse';
    feedback([10, 18, 12, 28]);
    await waitForSecretPhase(1050);
    if (token !== secretSequenceToken) return;
    els.secretDiscoveryOverlay.className = 'secret-discovery-overlay phase-card';
    await waitForSecretCardDismiss(food, token);
    if (token !== secretSequenceToken) return;
    els.secretDiscoveryOverlay.className = 'secret-discovery-overlay hidden';
    els.secretDiscoveryCard.replaceChildren();
    document.body.classList.remove('secret-discovery-active');
    clearMenuMealReaction();
    renderDraft();
    persist();
    secretSequenceActive = false;
    syncInteractionLayers();
  }

  function forceSecretDiscoveryForDebug(foodId = '', { play = false } = {}) {
    const food = FOODS.find(item => item.rarity === 'secret' && (!foodId || item.id === foodId));
    if (!food || secretSequenceActive || session.foods.length >= save.stomachLevel) return false;
    const slot = session.offer.findIndex(Boolean);
    if (slot < 0) return false;
    session.offer[slot] = food;
    save.revealedSecretFoods = (save.revealedSecretFoods || []).filter(id => id !== food.id);
    save.discoveredFoods = (save.discoveredFoods || []).filter(id => id !== food.id);
    renderDraft();
    persist();
    if (play) playSecretDiscovery(food, slot);
    return true;
  }

  function feedback(pattern = 8) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ===== ГЛАВНЫЙ ЭКРАН И ВЫБОР УРОВНЯ =====
  function renderLevelPicker() {
    if (!els.levelButtons) return;
    const world = currentWorld();
    const selected = selectedLevelForWorld(world.id);
    const unlocked = clamp(Math.round(save.unlockedLevels?.[world.id] || 1), 1, LEVEL_COUNT);
    const best = save.worldBest[world.id] || 0;
    if (els.levelDepthLabel) els.levelDepthLabel.textContent = `${levelTargetDepth(world, selected)} М`;
    els.levelButtons.replaceChildren();
    for (let level = 1; level <= LEVEL_COUNT; level += 1) {
      const button = document.createElement('button');
      const locked = level > unlocked;
      const completed = best >= levelTargetDepth(world, level);
      button.type = 'button';
      button.className = `level-btn${level === selected ? ' active' : ''}${locked ? ' locked' : ''}${completed ? ' completed' : ''}`;
      button.dataset.level = String(level);
      button.setAttribute('aria-label', locked
        ? `Уровень ${level} закрыт. Пройдите предыдущий уровень`
        : `Выбрать уровень ${level}`);
      button.setAttribute('aria-pressed', String(level === selected));
      button.innerHTML = `<span>${level}</span>${completed && !locked ? '<i aria-hidden="true">✓</i>' : ''}${locked ? `<img src="${versionedAsset('assets/ui/level-lock.png')}" alt="" aria-hidden="true">` : ''}`;
      els.levelButtons.appendChild(button);
    }
  }

  function renderHomePlaySetup() {
    if (!els.playSetupCard) return;
    const world = currentWorld();
    if (els.homeWorldPickerIcon) els.homeWorldPickerIcon.src = versionedAsset(`assets/ui/world-icons/world-${world.id}.webp`);
    if (els.homeWorldPickerEyebrow) els.homeWorldPickerEyebrow.textContent = `МИР ${world.id}`;
    if (els.homeWorldPickerName) els.homeWorldPickerName.textContent = world.name;
    if (els.homeWorldBest) els.homeWorldBest.textContent = `${Math.floor(save.worldBest?.[world.id] || 0).toLocaleString('ru-RU')} М`;
    if (els.homeWorldSelect) {
      const selectedValue = String(world.id);
      els.homeWorldSelect.replaceChildren(...WORLDS.map(item => {
        const option = document.createElement('option');
        const unlocked = worldIsUnlocked(item.id);
        option.value = String(item.id);
        option.disabled = !unlocked;
        option.textContent = `${unlocked ? '' : '🔒 '}${item.id}. ${item.name}`;
        return option;
      }));
      els.homeWorldSelect.value = selectedValue;
    }

    const endlessUnlocked = Boolean(save.gameCompleted);
    const activeMode = save.homeMode === 'endless' && endlessUnlocked ? 'endless' : 'campaign';
    if (!endlessUnlocked && save.homeMode === 'endless') save.homeMode = 'campaign';
    els.playSetupCard.dataset.mode = activeMode;
    els.campaignModeBtn?.classList.toggle('active', activeMode === 'campaign');
    els.endlessModeBtn?.classList.toggle('active', activeMode === 'endless');
    els.campaignModeBtn?.setAttribute('aria-selected', String(activeMode === 'campaign'));
    els.endlessModeBtn?.setAttribute('aria-selected', String(activeMode === 'endless'));
    if (els.endlessModeBtn) {
      els.endlessModeBtn.disabled = !endlessUnlocked;
      els.endlessModeBtn.title = endlessUnlocked ? 'Бесконечный режим' : 'Откроется после прохождения игры';
    }
    els.campaignModePanel?.classList.toggle('hidden', activeMode !== 'campaign');
    els.endlessModePanel?.classList.toggle('hidden', activeMode !== 'endless');
    if (els.endlessBestScore) els.endlessBestScore.textContent = formatCompactNumber(save.endlessBestScore?.[world.id] || 0);
    if (els.endlessBestDepth) els.endlessBestDepth.textContent = `${Math.floor(save.endlessBestDepth?.[world.id] || 0).toLocaleString('ru-RU')} М`;
  }

  function selectHomeMode(mode) {
    const nextMode = mode === 'endless' ? 'endless' : 'campaign';
    if (nextMode === 'endless' && !save.gameCompleted) {
      showToast('Бесконечный режим откроется после прохождения игры');
      return;
    }
    if (save.homeMode === nextMode) return;
    save.homeMode = nextMode;
    sound('tap');
    feedback(6);
    renderHomePlaySetup();
    persist();
  }

  function selectHomeWorld(worldId) {
    const nextWorldId = Number(worldId);
    if (!worldIsUnlocked(nextWorldId)) {
      renderHomePlaySetup();
      showToast('Сначала пройди предыдущий мир');
      return;
    }
    if (nextWorldId === save.world) return;
    if (session?.rerollPending || adInFlight) {
      renderHomePlaySetup();
      showToast('Дождись окончания обновления');
      return;
    }
    save.world = nextWorldId;
    save.activeDraft = null;
    session = null;
    selectedFoodOfferIndex = null;
    hideFoodInfo();
    sound('tap');
    feedback(8);
    newDraft();
    showToast(`Мир ${nextWorldId} · ${currentWorld().name}`);
  }

  function selectLevel(level) {
    const world = currentWorld();
    const unlocked = clamp(Math.round(save.unlockedLevels?.[world.id] || 1), 1, LEVEL_COUNT);
    if (level > unlocked) {
      sound('tap');
      feedback(8);
      showToast('Пройдите предыдущий уровень');
      return;
    }
    save.selectedLevels[world.id] = level;
    sound('tap');
    feedback(5);
    persist();
    updatePersistentUI();
  }

  function updatePersistentUI() {
    els.coinsLabel.textContent = formatCompactNumber(save.coins);
    els.coinsLabel.title = `${Math.floor(save.coins).toLocaleString('ru-RU')} монет`;
    const world = currentWorld();
    document.body.dataset.world = String(world.id);
    ensureWorldSprites(world.id);
    const level = selectedLevelForWorld(world.id);
    const targetDepth = levelTargetDepth(world, level);
    const best = Math.min(targetDepth, Math.floor(save.worldBest[world.id] || 0));
    const worldProgress = clamp(best / targetDepth * 100, 0, 100);
    const remaining = Math.max(0, targetDepth - best);
    updateWorldHeader();
    els.worldProgressText.textContent = `${best} м`;
    els.worldProgressBar.style.width = `${worldProgress}%`;
    if (els.worldProgressMarker) els.worldProgressMarker.style.left = `${worldProgress}%`;
    els.worldProgressBar.parentElement.setAttribute('aria-valuenow', String(Math.round(worldProgress)));
    els.worldHint.textContent = remaining > 0 ? `ЕЩЁ ${remaining} М` : (level >= LEVEL_COUNT ? 'МИР ПРОЙДЕН' : 'УРОВЕНЬ ПРОЙДЕН');
    if (els.adminWorldValue) els.adminWorldValue.textContent = `МИР ${world.id}`;
    renderHomePlaySetup();
    renderLevelPicker();
    applySkin();
  }

  function updateWorldHeader(screen = document.body.dataset.screen || 'home') {
    const isDrop = screen === 'drop' && Boolean(run?.world);
    const world = isDrop ? run.world : currentWorld();
    const level = isDrop ? run.level : selectedLevelForWorld(world.id);
    const targetDepth = isDrop ? run.world.targetDepth : levelTargetDepth(world, level);
    const savedRunDepth = Math.max(0, +(save.lastRunDepth?.[`${world.id}:${level}`] || 0));
    const completedBefore = savedRunDepth >= targetDepth || +(save.worldBest?.[world.id] || 0) >= targetDepth;
    els.worldLabel.textContent = world.name;
    if (els.worldEyebrow) {
      els.worldEyebrow.textContent = isDrop
        ? (run?.endless ? `МИР ${world.id} · БЕСКОНЕЧНЫЙ РЕЖИМ` : `МИР ${world.id} · УРОВЕНЬ ${level}`)
        : `МИР ${world.id}`;
    }
    if (els.worldIcon) els.worldIcon.src = versionedAsset(`assets/ui/world-icons/world-${world.id}.webp`);
    if (els.levelPassedBadge) els.levelPassedBadge.hidden = !(isDrop && !run?.endless && completedBefore);
  }

  function applySkin() {
    [...els.slime.classList].filter(c => c.startsWith('skin-')).forEach(c => els.slime.classList.remove(c));
    els.slime.classList.add(skinById(save.selectedSkin).className);
  }

  function animateFoodToMouth(food, source) {
    if (!source?.isConnected) return;
    const from = source.getBoundingClientRect();
    const mouth = els.menuSlimeMouth?.getBoundingClientRect();
    if (!mouth) return;
    const flyerToken = ++foodFlyerToken;
    setMenuGazePoint(from.left + from.width / 2, from.top + from.height / 2);
    els.slime.classList.add('tracking-food', 'expect-food');
    const flyer = document.createElement('span');
    flyer.className = `swallow-fruit ${food.rarity}`;
    const swallowMs = food.rarity === 'secret' ? 300 : 340;
    flyer.style.setProperty('--swallow-time', `${swallowMs}ms`);
    flyer.innerHTML = foodArtMarkup(food, 'swallow-model');
    flyer.style.left = `${from.left + from.width / 2}px`;
    flyer.style.top = `${from.top + from.height / 2}px`;
    document.body.appendChild(flyer);
    requestAnimationFrame(() => {
      setMenuGazePoint(mouth.left + mouth.width / 2, mouth.top + mouth.height / 2);
      flyer.style.left = `${mouth.left + mouth.width / 2}px`;
      flyer.style.top = `${mouth.top + mouth.height / 2}px`;
      flyer.classList.add('swallowed');
    });
    setTimeout(() => {
      flyer.remove();
      if (flyerToken === foodFlyerToken) {
        els.slime.classList.remove('tracking-food', 'expect-food');
        resetMenuGaze(180);
      }
    }, swallowMs + 60);
  }

  function setMenuGazePoint(clientX, clientY) {
    const rect = els.slime.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height * .43);
    const distance = Math.max(1, Math.hypot(dx, dy));
    const strength = Math.min(1, distance / 70);
    menuGaze.x = dx / distance * strength;
    menuGaze.y = dy / distance * strength;
  }

  function resetMenuGaze(delay = 0) {
    clearTimeout(menuGazeTimer);
    menuGazeTimer = setTimeout(() => {
      menuGaze.x = 0;
      menuGaze.y = 0;
    }, delay);
  }

  const MENU_SLIME_STATES = ['booped', 'petting', 'petted'];
  const MEAL_REACTION_CLASSES = ['meal-common', 'meal-rare', 'meal-epic', 'meal-legendary', 'meal-prismatic', 'meal-secret'];

  function clearMenuMealReaction() {
    clearTimeout(menuEmotionTimer);
    els.slime?.classList.remove(
      'eat', 'chewing', 'savoring', 'pleased', 'tracking-food', 'expect-food',
      ...MEAL_REACTION_CLASSES
    );
    els.slime?.style.removeProperty('--catch-time');
    els.slime?.style.removeProperty('--chew-time');
    els.slime?.style.removeProperty('--chew-count');
    els.slime?.style.removeProperty('--happy-time');
    els.rarityBursts?.replaceChildren();
    resetMenuGaze();
  }

  function menuSlimeIsBusy() {
    return ['eat', 'chewing', 'savoring', 'expect-food', 'tracking-food'].some(name => els.slime.classList.contains(name));
  }

  function clearMenuSlimeInteraction() {
    clearTimeout(slimeInteractionTimer);
    els.slime.classList.remove(...MENU_SLIME_STATES);
    slimePointer = null;
    resetMenuGaze();
  }

  function finishMenuSlimeReaction(kind) {
    els.slime.classList.remove(...MENU_SLIME_STATES);
    void els.slime.offsetWidth;
    els.slime.classList.add(kind);
    if (kind === 'booped') {
      sound('bounce');
      feedback(9);
    } else {
      sound('happy');
      feedback([6, 22, 7]);
    }
    slimeInteractionTimer = setTimeout(() => els.slime.classList.remove(kind), kind === 'booped' ? 580 : 740);
    resetMenuGaze(220);
  }

  function bindMenuSlimeInteractions() {
    els.slime.addEventListener('pointerdown', event => {
      if (menuSlimeIsBusy() || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      clearMenuSlimeInteraction();
      els.slime.setPointerCapture?.(event.pointerId);
      slimePointer = {
        id: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        distance: 0,
        petting: false
      };
      setMenuGazePoint(event.clientX, event.clientY);
    });

    els.slime.addEventListener('pointermove', event => {
      if (!slimePointer || slimePointer.id !== event.pointerId || menuSlimeIsBusy()) return;
      event.preventDefault();
      slimePointer.distance += Math.hypot(event.clientX - slimePointer.lastX, event.clientY - slimePointer.lastY);
      slimePointer.lastX = event.clientX;
      slimePointer.lastY = event.clientY;
      if (!slimePointer.petting && slimePointer.distance >= 9) {
        slimePointer.petting = true;
        els.slime.classList.remove('booped', 'petted');
        els.slime.classList.add('petting');
        feedback(5);
      }
      if (slimePointer.petting) {
        const rect = els.slime.getBoundingClientRect();
        menuPetPoint.x = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -.64, .64);
        menuPetPoint.y = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -.72, .18);
      } else setMenuGazePoint(event.clientX, event.clientY);
    });

    const endPointer = event => {
      if (!slimePointer || slimePointer.id !== event.pointerId) return;
      const wasPetting = slimePointer.petting;
      try { els.slime.releasePointerCapture?.(event.pointerId); } catch (_) { /* pointer already released */ }
      slimePointer = null;
      finishMenuSlimeReaction(wasPetting ? 'petted' : 'booped');
    };
    els.slime.addEventListener('pointerup', endPointer);
    els.slime.addEventListener('pointercancel', () => clearMenuSlimeInteraction());
    els.slime.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key) || menuSlimeIsBusy()) return;
      event.preventDefault();
      finishMenuSlimeReaction('booped');
    });
  }

  function showScreen(name) {
    if (name !== 'home' && secretSequenceActive) cancelSecretDiscovery();
    document.body.dataset.screen = name;
    els.homeScreen.classList.toggle('active', name === 'home');
    els.dropScreen.classList.toggle('active', name === 'drop');
    updateWorldHeader(name);
    if (name !== 'drop') clearFallSteering();
    window.scrollTo(0, 0);
    if (name === 'home') startMenuSlimeLoop();
    else if (menuSlimeAnimationId) {
      cancelAnimationFrame(menuSlimeAnimationId);
      menuSlimeAnimationId = 0;
    }
    syncInteractionLayers();
  }

  function newDraft() {
    cancelSecretDiscovery();
    const bonusEpic = save.pendingEpicBoost || 0;
    const bonusMass = save.pendingMassBoost || 0;
    const bonusRerolls = save.pendingExtraRerolls || 0;
    save.pendingEpicBoost = 0;
    save.pendingMassBoost = 0;
    save.pendingExtraRerolls = 0;
    session = {
      foods: [], offer: [],
      commonOnlyStreak: 0, noEpicStreak: 0, noLegendaryStreak: 0, offersSeen: 0,
      freeRerolls: 1 + save.rerollLevel + bonusRerolls,
      adRerolls: 0,
      baseEpicBoost: bonusEpic,
      massBoost: bonusMass,
      stats: { mass: 8, power: 1, defense: 0, elasticity: 1, ability: 0, coinMultiplier: 1 },
      effects: {},
      combo: null,
      rerollPending: false
    };
    generateOffer(session.baseEpicBoost);
    showScreen('home');
    renderDraft();
    persist();
  }

  function restartDraftFromAdmin() {
    if (session?.rerollPending || adInFlight) return showToast('Дождись окончания обновления');
    sound('tap');
    feedback(8);
    newDraft();
    showToast('Новый забег: еду можно выбрать заново');
  }

  function switchWorldFromAdmin(direction) {
    if (session?.rerollPending || adInFlight) return showToast('Дождись окончания обновления');
    const nextIndex = (save.world - 1 + direction + WORLDS.length) % WORLDS.length;
    save.world = WORLDS[nextIndex].id;
    save.activeDraft = null;
    session = null;
    selectedFoodOfferIndex = null;
    hideFoodInfo();
    sound('tap');
    newDraft();
    showToast(`Админ: открыт мир ${save.world} — ${currentWorld().name}`);
  }

  function resetProgressFromAdmin() {
    if (!window.confirm('Сбросить весь прогресс, улучшения, монеты и текущий набор еды?')) return;
    const storage = saveStorage || browserStorage();
    try {
      storage?.removeItem(SAVE_KEY);
      storage?.removeItem(SAVE_BACKUP_KEY);
      for (const legacyKey of LEGACY_SAVE_KEYS) storage?.removeItem(legacyKey);
    } catch (error) {
      console.warn('Save reset cleanup failed:', error);
    }
    save = structuredClone(defaultSave);
    saveUpdatedAt = Date.now();
    saveRevision += 1;
    session = null;
    run = null;
    selectedFoodOfferIndex = null;
    sound('tap');
    newDraft();
    flushCloudSave(true);
    showToast('Прогресс полностью сброшен');
  }

  function unlockEverythingFromAdmin() {
    const coinGrant = 9999999;
    save.coins = Math.max(save.coins, coinGrant);
    save.world = 1;
    save.stomachLevel = 6;
    save.conveyorLevel = 5;
    save.rerollLevel = 3;
    save.unlockedSkins = SKINS.map(skin => skin.id);
    save.unlockedTrails = TRAILS.map(trail => trail.id);
    save.gameCompleted = true;
    for (const world of WORLDS) {
      save.unlockedLevels[world.id] = LEVEL_COUNT;
      save.selectedLevels[world.id] = 1;
      save.worldBest[world.id] = world.targetDepth;
      for (let level = 1; level <= LEVEL_COUNT; level += 1) {
        save.lastRunDepth[`${world.id}:${level}`] = levelTargetDepth(world, level);
      }
    }
    save.activeDraft = null;
    session = null;
    selectedFoodOfferIndex = null;
    persist();
    sound('coin');
    feedback([20, 35, 20]);
    newDraft();
    showToast('Всё, кроме карточек, открыто · 9 999 999 монет');
  }

  function rarityWeights(boost = 0, rareBoost = 0) {
    const tables = [
      { common: 80, rare: 19, epic: 1, legendary: 0, prismatic: 0, secret: 0 },
      { common: 70, rare: 25, epic: 5, legendary: 0, prismatic: 0, secret: 0 },
      { common: 58, rare: 30, epic: 10, legendary: 2, prismatic: 0, secret: 0 },
      { common: 46, rare: 31, epic: 16, legendary: 5, prismatic: 2, secret: 0 },
      { common: 18.35, rare: 15.5, epic: 10, legendary: 4, prismatic: 2, secret: 50 }
    ];
    const base = { ...tables[save.conveyorLevel - 1] };
    const epicAdd = clamp(boost, 0, 10);
    const movedToEpic = Math.min(base.common - 5, epicAdd);
    base.common -= movedToEpic;
    base.epic += movedToEpic;
    const rareAdd = clamp(rareBoost, 0, 10);
    const movedToRare = Math.min(base.common - 5, rareAdd);
    base.common -= movedToRare;
    base.rare += movedToRare;
    return base;
  }

  function weightedRarity(weights) {
    const entries = Object.entries(weights).filter(([, value]) => value > 0);
    let roll = Math.random() * entries.reduce((sum, [, value]) => sum + value, 0);
    for (const [rarity, value] of entries) {
      roll -= value;
      if (roll <= 0) return rarity;
    }
    return 'common';
  }

  function rarityRank(rarity) {
    return { common: 0, rare: 1, epic: 2, legendary: 3, prismatic: 4, secret: 5 }[rarity] ?? 0;
  }

  function foodAvailableInWorld(food) {
    return !Array.isArray(food.worlds) || !food.worlds.length || food.worlds.includes(save.world);
  }

  function discoverFoods(foods) {
    if (!Array.isArray(foods) || !foods.length) return false;
    const discovered = new Set(save.discoveredFoods || []);
    const before = discovered.size;
    for (const food of foods) if (food?.id && FOODS.some(item => item.id === food.id)) discovered.add(food.id);
    if (discovered.size === before) return false;
    save.discoveredFoods = [...discovered];
    return true;
  }

  function secretFoodIsRevealed(food) {
    return food?.rarity !== 'secret' || (save.revealedSecretFoods || []).includes(food.id);
  }

  function revealSecretFood(food) {
    if (!food?.id || food.rarity !== 'secret') return false;
    const revealed = new Set(save.revealedSecretFoods || []);
    const changed = !revealed.has(food.id);
    revealed.add(food.id);
    save.revealedSecretFoods = [...revealed];
    discoverFoods([food]);
    return changed;
  }

  function randomFood(exclude = [], minimumRarity = null, rollBoost = 0, rareBoost = 0) {
    let rarity = weightedRarity(rarityWeights(rollBoost, rareBoost));
    if (minimumRarity && rarityRank(rarity) < rarityRank(minimumRarity)) rarity = minimumRarity;
    let pool = FOODS.filter(food => foodAvailableInWorld(food) && food.rarity === rarity && food.minConveyor <= save.conveyorLevel && !exclude.includes(food.id));
    if (!pool.length) {
      const order = ['secret', 'prismatic', 'legendary', 'epic', 'rare', 'common'];
      const allowed = minimumRarity ? order.filter(r => rarityRank(r) >= rarityRank(minimumRarity)) : order;
      for (const fallback of allowed) {
        pool = FOODS.filter(food => foodAvailableInWorld(food) && food.rarity === fallback && food.minConveyor <= save.conveyorLevel && !exclude.includes(food.id));
        if (pool.length) break;
      }
    }
    return pool[Math.floor(Math.random() * pool.length)] || FOODS[0];
  }

  function generateOffer(rollBoost = 0, rareBoost = 0) {
    const offer = [null, null, null];
    const used = [];
    const pity = save.foodPity || structuredClone(defaultSave.foodPity);

    let guaranteed = null;
    if (save.conveyorLevel >= 5 && pity.noSecret >= 45) guaranteed = 'secret';
    else if (save.conveyorLevel >= 4 && pity.noPrismatic >= 18) guaranteed = 'prismatic';
    else if (save.conveyorLevel >= 3 && pity.noLegendary >= 10) guaranteed = 'legendary';
    else if (save.conveyorLevel >= 2 && pity.noEpic >= 5) guaranteed = 'epic';
    else if (session.commonOnlyStreak >= 2) guaranteed = 'rare';
    const guaranteedSlot = Math.floor(Math.random() * 3);

    for (let i = 0; i < 3; i += 1) {
      const food = randomFood(used, i === guaranteedSlot ? guaranteed : null, rollBoost, rareBoost);
      offer[i] = food;
      used.push(food.id);
    }
    session.offer = offer;
    discoverFoods(offer.filter(food => food.rarity !== 'secret'));
    session.offersSeen += 1;
    session.commonOnlyStreak = offer.some(food => rarityRank(food.rarity) >= 1) ? 0 : session.commonOnlyStreak + 1;

    pity.noEpic = offer.some(food => rarityRank(food.rarity) >= 2) ? 0 : pity.noEpic + 1;
    pity.noLegendary = offer.some(food => rarityRank(food.rarity) >= 3) ? 0 : pity.noLegendary + 1;
    pity.noPrismatic = offer.some(food => rarityRank(food.rarity) >= 4) ? 0 : pity.noPrismatic + 1;
    pity.noSecret = offer.some(food => food.rarity === 'secret') ? 0 : pity.noSecret + 1;
    save.foodPity = pity;
    persist();
  }

  function foodCardType(food) {
    return food.effect && food.effectText ? 'ability' : 'stats';
  }

  function foodStatItems(food) {
    return [
      { key: 'mass', value: food.mass || 0, score: (food.mass || 0) / 12, iconName: 'stat-health', display: `+${food.mass || 0}`, label: `+${food.mass || 0} здоровья` },
      { key: 'power', value: food.power || 0, score: (food.power || 0) / .7, iconName: 'stat-power', display: `+${round1(food.power || 0)}`, label: `+${round1(food.power || 0)} силы` },
      { key: 'defense', value: food.defense || 0, score: (food.defense || 0) / .14, iconName: 'stat-defense', display: `+${Math.round((food.defense || 0) * 100)}%`, label: `+${Math.round((food.defense || 0) * 100)}% защиты` },
      { key: 'bounce', value: food.elasticity || 0, score: (food.elasticity || 0) / .22, iconName: 'stat-bounce', display: `+${Math.round((food.elasticity || 0) * 100)}%`, label: `+${Math.round((food.elasticity || 0) * 100)}% отскока` },
      { key: 'ability', value: food.ability || 0, score: (food.ability || 0) / 16, iconName: 'buff', display: `+${food.ability || 0}%`, label: `+${food.ability || 0}% заряда` },
      { key: 'coins', value: food.coinMultiplier || 0, score: (food.coinMultiplier || 0) / .45, iconName: 'coin', display: `+${Math.round((food.coinMultiplier || 0) * 100)}%`, label: `+${Math.round((food.coinMultiplier || 0) * 100)}% монет` }
    ].filter(item => item.value > 0).sort((a, b) => b.score - a.score);
  }

  function foodStatGridMarkup(food) {
    const items = foodStatItems(food).slice(0, 4);
    return Array.from({ length: 4 }, (_, index) => {
      const item = items[index];
      return item
        ? `<span class="food-stat-cell ${item.key}" aria-label="${item.label}">${uiIconMarkup(item.iconName, 'card-stat-icon')}<b>${item.display}</b></span>`
        : '<span class="food-stat-cell empty" aria-hidden="true"></span>';
    }).join('');
  }

  function foodInfoStatMarkup(food) {
    const items = foodStatItems(food).slice(0, 4);
    const cells = items.map(item => `
      <span class="food-info-stat ${item.key}" aria-label="${item.label}">
        ${uiIconMarkup(item.iconName, 'food-info-stat-icon')}<b>${item.display}</b>
      </span>`).join('');
    return `<strong class="food-info-kind">${uiIconMarkup('stat-health', 'food-info-kind-icon')}ХАРАКТЕРИСТИКИ</strong><span class="food-info-stat-grid count-${items.length}">${cells}</span>`;
  }

  function countCategories(foods) {
    return foods.reduce((acc, food) => {
      if (foodCardType(food) !== 'stats') return acc;
      acc[food.category] = (acc[food.category] || 0) + 1;
      return acc;
    }, { mass: 0, power: 0, defense: 0, bounce: 0, magic: 0 });
  }

  function calculateStatsForFoods(foods) {
    const stats = {
      mass: 8,
      power: 1,
      defense: 0,
      elasticity: 1,
      ability: 0,
      coinMultiplier: 1
    };
    const effects = {
      momentum: false, dragonBlast: false, freeBounces: 0,
      oreHeal: false, smallRevive: false, softLanding: false,
      healBoost: false, bombPull: false, rainbow: false, prismFlow: false, chargeBoost: false,
      cooldownCut: false, voidBreaker: false, rainbowHeart: false
    };
    const counts = countCategories(foods);

    for (const food of foods) {
      if (foodCardType(food) === 'stats') {
        stats.mass += food.mass || 0;
        stats.power += food.power || 0;
        stats.defense += food.defense || 0;
        stats.elasticity += food.elasticity || 0;
        stats.ability += food.ability || 0;
        stats.coinMultiplier += food.coinMultiplier || 0;
      }
      if (food.effect) effects[food.effect] = food.effect === 'freeBounces' ? 3 : true;
    }

    if (effects.rainbow || effects.prismFlow) {
      const boost = effects.prismFlow ? 1.12 : 1.10;
      stats.mass = 8 + (stats.mass - 8) * boost;
      stats.power = 1 + (stats.power - 1) * boost;
      stats.defense *= boost;
      stats.elasticity = 1 + (stats.elasticity - 1) * boost;
      stats.ability *= boost;
      stats.coinMultiplier = 1 + (stats.coinMultiplier - 1) * boost;
    }

    let combo = null;
    if (counts.mass >= 3) { stats.mass *= 1.25; combo = { icon: '🍔', name: 'Запас здоровья', text: '+25% здоровья' }; }
    if (counts.power >= 3) { stats.power += 1; combo = { icon: '🔥', name: 'Ярость', text: '+1 силы' }; }
    if (counts.defense >= 3) { stats.defense += .15; combo = { icon: '🛡️', name: 'Бронеслайм', text: '+15% защиты' }; }
    if (counts.bounce >= 3) { stats.elasticity += .28; combo = { icon: '🟣', name: 'Суперпрыжок', text: '+28% отскока' }; }
    if (counts.magic >= 3) { stats.ability += 45; combo = { icon: '✨', name: 'Хаос', text: '+45% импульса' }; }

    stats.mass *= 1 + session.massBoost / 100;
    stats.mass = Math.round(stats.mass);
    stats.power = round1(stats.power);
    stats.defense = clamp(stats.defense, 0, .58);
    stats.elasticity = clamp(stats.elasticity, .85, 1.85);
    stats.ability = clamp(stats.ability, 0, 45);
    return { stats, effects, combo };
  }

  function recalcStats() {
    const result = calculateStatsForFoods(session.foods);
    session.stats = result.stats;
    session.effects = result.effects;
    session.combo = result.combo;
  }

  function clearFoodPreview(force = false) {
    if (force !== true && document.body.classList.contains('food-dragging')) return;
    [els.massCompare, els.powerCompare, els.defenseCompare, els.bounceCompare].forEach(element => {
      if (element) element.textContent = '';
    });
    $$('.slime-stage .stat-pill').forEach(pill => pill.classList.remove('previewing'));
  }

  function showFoodPreview(food) {
    if (!food || session.foods.length >= save.stomachLevel) return clearFoodPreview();
    if (!secretFoodIsRevealed(food)) return clearFoodPreview();
    const next = calculateStatsForFoods([...session.foods, food]).stats;
    const comparisons = [
      [els.massCompare, next.mass, session.stats.mass, delta => `+${Math.round(delta)}`],
      [els.powerCompare, next.power, session.stats.power, delta => `+${round1(delta)}`],
      [els.defenseCompare, next.defense, session.stats.defense, delta => `+${Math.round(delta * 100)}%`],
      [els.bounceCompare, next.elasticity, session.stats.elasticity, delta => `+${Math.round(delta * 100)}%`]
    ];
    comparisons.forEach(([element, value, current, format]) => {
      if (!element) return;
      const delta = value - current;
      const changed = delta > .001;
      element.textContent = changed ? format(delta) : '';
      element.closest('.stat-pill')?.classList.toggle('previewing', changed);
    });
  }

  // ===== ГЛАВНЫЙ ЭКРАН: эффекты и выдача еды =====
  function createStomachSlot(food, index) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `stomach-quick-slot ${food ? `filled ${food.rarity}` : ''}`;
    if (food) {
      const effectStar = food.effectText
        ? '<span class="slot-effect-star" aria-hidden="true">★</span>'
        : '';
      slot.innerHTML = `${effectStar}<span class="slot-art">${foodArtMarkup(food, 'food-mini-model')}</span>`;
      centerFoodThumbnail(slot.querySelector('.food-mini-model'));
      slot.setAttribute('aria-label', `${index + 1}. ${food.name}. ${RARITY_LABELS[food.rarity]}${food.effectText ? '. Есть особый эффект' : ''}. Показать свойства`);
      slot.title = `${food.name}${food.effectText ? ' · ★ эффект' : ''}`;
      slot.addEventListener('click', () => showStomachFoodInfo(food, index, slot));
    } else {
      slot.innerHTML = '<span class="slot-plus" aria-hidden="true"></span>';
      slot.setAttribute('aria-label', `${index + 1}. Пустая ячейка желудка`);
      slot.setAttribute('aria-disabled', 'true');
      slot.tabIndex = -1;
    }
    return slot;
  }

  function renderStomachSlots() {
    const capacity = save.stomachLevel;
    els.stomachQuickSlots?.replaceChildren();
    if (els.stomachQuickSlots) els.stomachQuickSlots.dataset.slots = String(capacity);
    for (let index = 0; index < capacity; index += 1) {
      const food = session.foods[index];
      els.stomachQuickSlots?.appendChild(createStomachSlot(food, index));
    }
    els.stomachQuickSlots?.classList.toggle('is-full', session.foods.length >= capacity);
  }

  function hideFoodInfo() {
    selectedFoodOfferIndex = null;
    selectedFoodInfoKey = null;
    els.foodInfo?.classList.add('hidden');
    els.foodInfo?.classList.remove('below');
    els.foodInfo?.style.removeProperty('left');
    els.foodInfo?.style.removeProperty('top');
    $$('.food-info-source.selected').forEach(source => source.classList.remove('selected', 'food-info-source'));
    clearFoodPreview();
  }

  function positionFoodInfoPopover(source) {
    if (!source || !els.foodInfo) return;
    requestAnimationFrame(() => {
      if (els.foodInfo.classList.contains('hidden') || !source.isConnected) return;
      const card = source.getBoundingClientRect();
      const panel = els.foodInfo.getBoundingClientRect();
      const safe = 8;
      const gap = 10;
      const left = clamp(card.left + card.width / 2 - panel.width / 2, safe, window.innerWidth - panel.width - safe);
      const below = card.top - panel.height - gap < safe;
      const top = below
        ? clamp(card.bottom + gap, safe, window.innerHeight - panel.height - safe)
        : Math.max(safe, card.top - panel.height - gap);
      els.foodInfo.style.left = `${left}px`;
      els.foodInfo.style.top = `${top}px`;
      els.foodInfo.style.setProperty('--caret-x', `${clamp(card.left + card.width / 2 - left, 22, panel.width - 22)}px`);
      els.foodInfo.classList.toggle('below', below);
    });
  }

  function presentFoodInfo(food, key, source, { offerIndex = null, preview = false } = {}) {
    if (!food || !els.foodInfo) return;
    if (selectedFoodInfoKey === key && !els.foodInfo.classList.contains('hidden')) {
      hideFoodInfo();
      return;
    }
    selectedFoodInfoKey = key;
    selectedFoodOfferIndex = offerIndex;
    $$('.food-info-source.selected').forEach(item => item.classList.remove('selected', 'food-info-source'));
    source?.classList.add('selected', 'food-info-source');
    if (preview) showFoodPreview(food);
    else clearFoodPreview();
    const cardType = foodCardType(food);
    els.foodInfoStats.innerHTML = cardType === 'ability'
      ? `<strong class="food-info-kind">${uiIconMarkup('special', 'food-info-kind-icon')}ЭФФЕКТ</strong>`
      : foodInfoStatMarkup(food);
    els.foodInfoEffect.textContent = food.effectText || '';
    els.foodInfoEffect.classList.toggle('hidden', !food.effectText);
    els.foodInfo.className = `food-info ${food.rarity} food-type-${cardType}`;
    positionFoodInfoPopover(source);
  }

  function showFoodInfo(food, offerIndex, source) {
    if (!secretFoodIsRevealed(food)) {
      hideFoodInfo();
      playSecretDiscovery(food, offerIndex);
      return;
    }
    presentFoodInfo(food, `offer:${offerIndex}`, source, { offerIndex, preview: true });
  }

  function showStomachFoodInfo(food, stomachIndex, source) {
    presentFoodInfo(food, `stomach:${stomachIndex}`, source);
  }

  function renderDraft({ offerMotion = 'static' } = {}) {
    recalcStats();
    updatePersistentUI();
    const capacity = save.stomachLevel;
    const full = session.foods.length >= capacity;

    els.massLabel.textContent = Math.round(session.stats.mass);
    els.powerLabel.textContent = `×${session.stats.power.toFixed(1)}`;
    els.defenseLabel.textContent = `${Math.round(session.stats.defense * 100)}%`;
    els.bounceLabel.textContent = `×${session.stats.elasticity.toFixed(1)}`;
    if (els.startDropLabel) els.startDropLabel.textContent = 'СТАРТ';
    clearFoodPreview();
    els.rerollBtn.disabled = full;

    const scale = foodGrowthScale(session.foods.length);
    els.slime.style.width = `${124 * scale}px`;
    els.slime.style.height = `${124 * scale}px`;

    els.foodInside.replaceChildren();
    renderStomachSlots();

    els.foodChoices.innerHTML = '';
    session.offer.forEach((food, index) => {
      if (!food) {
        const gap = document.createElement('div');
        gap.className = 'conveyor-gap';
        gap.setAttribute('aria-hidden', 'true');
        els.foodChoices.appendChild(gap);
        return;
      }
      const button = document.createElement('button');
      const unknownSecret = !secretFoodIsRevealed(food);
      const cardType = foodCardType(food);
      const tunnelInDistance = 112 + index * 110;
      const tunnelOutDistance = 112 + (session.offer.length - 1 - index) * 110;
      button.className = `food-card ${food.rarity} food-type-${cardType} ${unknownSecret ? 'secret-unknown' : ''} ${offerMotion === 'enter' ? 'tunnel-enter' : ''} ${full ? 'locked' : ''}`;
      button.style.animationDelay = offerMotion === 'enter' ? `${index * 70}ms` : '0ms';
      button.style.setProperty('--tunnel-in-distance', `${tunnelInDistance}%`);
      button.style.setProperty('--tunnel-in-mouth', `${Math.round(tunnelInDistance * .94)}%`);
      button.style.setProperty('--tunnel-out-cruise', `${Math.round(tunnelOutDistance * .72)}%`);
      button.style.setProperty('--tunnel-out-mouth', `${Math.round(tunnelOutDistance * .94)}%`);
      button.style.setProperty('--tunnel-out-distance', `${tunnelOutDistance}%`);
      button.dataset.foodId = food.id;
      button.dataset.offerIndex = String(index);
      const cardBody = cardType === 'ability'
        ? `<span class="food-ability-copy"><b><span class="effect-title-star" aria-hidden="true">★</span><span class="effect-title-label">ЭФФЕКТ</span></b><em>${escapeMarkup(food.effectText)}</em></span>`
        : `<span class="food-stat-block"><b class="card-section-title">ХАРАКТЕРИСТИКИ</b><span class="food-stat-grid count-${Math.min(foodStatItems(food).length, 4)}">${foodStatGridMarkup(food)}</span></span>`;
      button.innerHTML = unknownSecret
        ? `<span class="rarity"><span class="rarity-name"><i aria-hidden="true"></i><span>СЕКРЕТНОЕ</span></span></span><span class="secret-unknown-center" aria-hidden="true">???</span><span class="secret-unknown-copy">НАЖМИ</span>`
        : `<span class="rarity"><span class="rarity-name"><i aria-hidden="true"></i><span>${RARITY_LABELS[food.rarity]}</span></span></span><span class="food-model-wrap">${foodArtMarkup(food)}</span><span class="food-name">${escapeMarkup(food.name)}</span>${cardBody}`;
      button.type = 'button';
      const cardSummary = cardType === 'ability' ? `Эффект: ${food.effectText}` : foodStatItems(food).slice(0, 4).map(item => item.label).join(', ');
      button.setAttribute('aria-label', unknownSecret ? 'Неизвестная секретная карта. Нажми, чтобы раскрыть' : `${food.name}. ${cardSummary}. Открыть описание`);
      button.addEventListener('pointerdown', event => beginFoodDrag(event, food, index, button));
      button.addEventListener('pointerenter', () => showFoodPreview(food));
      button.addEventListener('pointerleave', clearFoodPreview);
      button.addEventListener('focus', () => showFoodPreview(food));
      button.addEventListener('blur', clearFoodPreview);
      button.addEventListener('click', () => {
        if (performance.now() >= suppressFoodClickUntil) showFoodInfo(food, index, button);
      });
      els.foodChoices.appendChild(button);
    });

    if (session.freeRerolls > 0) {
      if (els.rerollTitle) els.rerollTitle.textContent = 'ОБНОВИТЬ';
      if (els.rerollText) els.rerollText.textContent = `БЕСПЛАТНО ×${session.freeRerolls}`;
      els.rerollBtn.classList.remove('ad-mode');
    } else {
      if (els.rerollTitle) els.rerollTitle.textContent = 'ОБНОВИТЬ';
      if (els.rerollText) els.rerollText.textContent = 'РЕДКИЕ +10%';
      els.rerollBtn.classList.add('ad-mode');
      els.rerollBtn.disabled = full;
    }

    if (selectedFoodOfferIndex !== null && !session.offer[selectedFoodOfferIndex]) hideFoodInfo();
  }

  // ===== КОРМЛЕНИЕ: клик, перетаскивание и эмоции =====
  function beginFoodDrag(event, food, offerIndex, source) {
    if (secretSequenceActive || session.foods.length >= save.stomachLevel || event.button > 0) return;
    if (!secretFoodIsRevealed(food)) return;
    event.preventDefault();
    document.body.classList.add('food-dragging');
    showFoodPreview(food);
    els.slime.classList.add('expect-food', 'tracking-food');
    const sourceRectAtStart = source.getBoundingClientRect();
    setMenuGazePoint(sourceRectAtStart.left + sourceRectAtStart.width / 2, sourceRectAtStart.top + sourceRectAtStart.height / 2);
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    let ghost = null;

    const onMove = moveEvent => {
      setMenuGazePoint(moveEvent.clientX, moveEvent.clientY);
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!moved && distance > 7) {
        moved = true;
        hideFoodInfo();
        ghost = source.cloneNode(true);
        ghost.classList.add('drag-ghost');
        ghost.classList.remove('tunnel-enter', 'leaving');
        ghost.style.animationDelay = '0ms';
        document.body.appendChild(ghost);
        source.classList.add('drag-source');
      }
      if (!moved || !ghost) return;
      ghost.style.left = `${moveEvent.clientX}px`;
      ghost.style.top = `${moveEvent.clientY}px`;
      const accepted = pointInsideElement(moveEvent.clientX, moveEvent.clientY, els.slime);
      ghost.classList.toggle('accept', accepted);
      els.slime.classList.toggle('drop-ready', accepted);
      showFoodPreview(food);
    };

    const onUp = upEvent => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      document.body.classList.remove('food-dragging');
      els.slime.classList.remove('drop-ready', 'expect-food', 'tracking-food');
      clearFoodPreview(true);
      const cancelled = upEvent.type === 'pointercancel';
      const accepted = !cancelled && moved && pointInsideElement(upEvent.clientX, upEvent.clientY, els.slime);
      if (moved) suppressFoodClickUntil = performance.now() + 400;
      if (ghost) {
        if (accepted) {
          const rect = els.menuSlimeMouth?.getBoundingClientRect() || els.slime.getBoundingClientRect();
          ghost.style.transition = 'left .18s ease,top .18s ease,transform .18s ease,opacity .18s ease';
          ghost.style.left = `${rect.left + rect.width / 2}px`;
          ghost.style.top = `${rect.top + rect.height / 2}px`;
          ghost.style.transform = 'translate(-50%,-50%) scale(.25)';
          ghost.style.opacity = '0';
          setTimeout(() => {
            ghost.remove();
            source.classList.remove('drag-source');
          }, 190);
        } else {
          const sourceRect = source.getBoundingClientRect();
          ghost.classList.add('returning');
          ghost.style.left = `${sourceRect.left + sourceRect.width / 2}px`;
          ghost.style.top = `${sourceRect.top + sourceRect.height / 2}px`;
          ghost.style.transform = 'translate(-50%,-50%) scale(.96)';
          setTimeout(() => {
            ghost.remove();
            source.classList.remove('drag-source');
          }, 230);
        }
      } else {
        source.classList.remove('drag-source');
      }
      if (accepted) {
        const mouthRect = els.menuSlimeMouth?.getBoundingClientRect();
        if (mouthRect) setMenuGazePoint(mouthRect.left + mouthRect.width / 2, mouthRect.top + mouthRect.height / 2);
        resetMenuGaze(300);
        chooseFood(offerIndex);
      } else resetMenuGaze();
    };

    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp, { once: false });
    document.addEventListener('pointercancel', onUp, { once: false });
  }

  function pointInsideElement(x, y, element) {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function chooseFood(offerIndex, source = null) {
    if (secretSequenceActive) {
      showToast('Секретный вкус нельзя торопить');
      return;
    }
    if (session.foods.length >= save.stomachLevel) return;
    const food = session.offer[offerIndex];
    if (!food) return;
    if (food.rarity === 'secret' && !secretFoodIsRevealed(food)) {
      showToast('Сначала нажми на карту и раскрой секрет');
      return;
    }
    discoverFoods([food]);
    hideFoodInfo();
    clearMenuSlimeInteraction();
    animateFoodToMouth(food, source);
    const previousCombo = session.combo?.name || '';
    session.foods.push(food);
    session.offer[offerIndex] = null;
    const mealReaction = {
      common: { catchMs: 200, chewMs: 600, chewTime: '.3s', chews: 2, happyMs: 350 },
      rare: { catchMs: 210, chewMs: 900, chewTime: '.3s', chews: 3, happyMs: 420 },
      epic: { catchMs: 230, chewMs: 900, chewTime: '.3s', chews: 3, happyMs: 620 },
      legendary: { catchMs: 250, chewMs: 1200, chewTime: '.3s', chews: 4, happyMs: 680 },
      prismatic: { catchMs: 270, chewMs: 1500, chewTime: '.3s', chews: 5, happyMs: 820 },
      secret: { catchMs: 270, chewMs: 1500, chewTime: '.3s', chews: 5, revealDelayMs: 0, happyMs: 820 }
    }[food.rarity] || { catchMs: 200, chewMs: 600, chewTime: '.3s', chews: 2, revealDelayMs: 0, happyMs: 350 };
    sound('eat', {
      biteDelay: Math.max(180, mealReaction.catchMs - 20),
      swallowDelay: mealReaction.catchMs + mealReaction.chewMs - 70
    });
    clearMenuMealReaction();
    els.slime.classList.add(`meal-${food.rarity}`);
    els.slime.style.setProperty('--catch-time', `${mealReaction.catchMs}ms`);
    els.slime.style.setProperty('--chew-time', mealReaction.chewTime);
    els.slime.style.setProperty('--chew-count', String(mealReaction.chews));
    els.slime.style.setProperty('--happy-time', `${mealReaction.happyMs}ms`);
    void els.slime.offsetWidth;
    els.slime.classList.add('eat');
    if (food.rarity !== 'secret') showRarityBurst(food);
    menuEmotionTimer = setTimeout(() => {
      els.slime.classList.remove('eat', 'expect-food', 'tracking-food');
      els.slime.classList.add('chewing');
      resetMenuGaze();
      menuEmotionTimer = setTimeout(() => {
        els.slime.classList.remove('chewing');
        const revealMeal = () => {
          els.slime.classList.remove('savoring');
          els.slime.classList.add('pleased');
          if (food.rarity === 'secret') feedback([14, 24, 12]);
          sound(['epic', 'legendary', 'prismatic', 'secret'].includes(food.rarity) ? 'epic' : 'happy');
          menuEmotionTimer = setTimeout(() => {
            clearMenuMealReaction();
          }, mealReaction.happyMs);
        };
        if (mealReaction.revealDelayMs) {
          els.slime.classList.add('savoring');
          menuEmotionTimer = setTimeout(revealMeal, mealReaction.revealDelayMs);
        } else revealMeal();
      }, mealReaction.chewMs);
    }, mealReaction.catchMs);
    renderDraft();
    persist();
    feedback(food.rarity === 'legendary' || food.rarity === 'prismatic' || food.rarity === 'secret' ? [12, 30, 18] : 8);
    if (session.combo && session.combo.name !== previousCombo) showToast(`${session.combo.icon} Комбо: ${session.combo.name} — ${session.combo.text}`);
  }


  async function rerollOffer() {
    if (secretSequenceActive) {
      showToast('Секретный вкус нельзя торопить');
      return;
    }
    if (session.foods.length >= save.stomachLevel || session.rerollPending || adInFlight) return;
    session.rerollPending = true;
    hideFoodInfo();
    els.rerollBtn.disabled = true;
    let rollBoost = session.baseEpicBoost || 0;
    let rareBoost = 0;
    try {
      if (session.freeRerolls > 0) {
        session.freeRerolls -= 1;
      } else {
        const rewarded = await showRewardedAd('Новая тройка еды. Для этой выдачи шанс редкой еды повышен на 10%.');
        if (!rewarded) return;
        session.adRerolls += 1;
        rareBoost = 10;
      }
      sound(rollBoost >= 10 || rareBoost >= 10 ? 'epic' : 'reroll');
      feedback(6);
      els.conveyor.classList.add('is-running');
      $$('.food-card').forEach(card => {
        const offerIndex = Number(card.dataset.offerIndex || 0);
        card.style.animationDelay = `${Math.max(0, session.offer.length - 1 - offerIndex) * 70}ms`;
        card.classList.add('leaving');
      });
      await new Promise(resolve => setTimeout(resolve, 840));
      generateOffer(rollBoost, rareBoost);
      renderDraft({ offerMotion: 'enter' });
      persist();
      await new Promise(resolve => setTimeout(resolve, 900));
    } finally {
      session.rerollPending = false;
      els.conveyor.classList.remove('is-running');
      renderDraft();
    }
  }

  // ===== ЗАБЕГ: запуск, пауза и физическая сцена =====
  function shiftRunClock(delta) {
    if (!run || delta <= 0) return;
    const timestampKeys = [
      'geyserLaunchGraceUntil', 'hurtFlashUntil', 'healGlowUntil', 'appleGlowUntil', 'freezeUntil',
      'lastFrozenImpactAt', 'emotionUntil', 'comboGraceUntil', 'lastMassDamageAt', 'bounceGraceUntil',
      'softLandingUntil', 'lastBombPullAt', 'lastTrailSampleAt', 'lastUiUpdateAt'
    ];
    for (const key of timestampKeys) if (run[key] > 0) run[key] += delta;
    if (run.geyserCapture) {
      for (const key of ['startedAt', 'readyAt', 'autoLaunchAt']) if (run.geyserCapture[key] > 0) run.geyserCapture[key] += delta;
    }
    if (run.portalEntry?.startedAt > 0) run.portalEntry.startedAt += delta;
    run.hitCooldowns = new Map([...run.hitCooldowns.entries()].map(([key, value]) => [key, value > 0 ? value + delta : value]));
    for (const shower of run.meteorShowers || []) {
      for (const strike of shower.strikes || []) {
        for (const key of ['warnedAt', 'fallAt', 'impactAt', 'impactedAt']) if (strike[key] > 0) strike[key] += delta;
      }
    }
  }

  function updateRunSoundControl() {
    if (!els.toggleRunSoundBtn) return;
    els.toggleRunSoundBtn.classList.toggle('is-muted', !save.sound);
    els.toggleRunSoundBtn.setAttribute('aria-pressed', String(!save.sound));
    els.runSoundIcon.textContent = save.sound ? '♪' : '×';
    els.runSoundLabel.textContent = save.sound ? 'ЗВУК ВКЛЮЧЁН' : 'ЗВУК ВЫКЛЮЧЕН';
  }

  function pauseRun({ allowPortal = false } = {}) {
    if (!run || run.ended || run.paused || (!allowPortal && run.portalEntry) || run.portalTransitioning) return false;
    run.paused = true;
    run.pausedAt = performance.now();
    cancelAnimationFrame(run.animationId);
    run.animationId = 0;
    run.lastTime = 0;
    clearFallSteering();
    return true;
  }

  function resumeRun() {
    if (!run || run.ended || !run.paused || run.portalTransitioning) return false;
    const pausedFor = Math.max(0, performance.now() - (run.pausedAt || performance.now()));
    shiftRunClock(pausedFor);
    run.paused = false;
    run.pausedAt = 0;
    run.lastTime = 0;
    run.animationId = requestAnimationFrame(gameFrame);
    return true;
  }

  function hideRunMenu() {
    els.runMenuOverlay?.classList.add('hidden');
    els.endRunBtn?.setAttribute('aria-expanded', 'false');
    syncInteractionLayers();
  }

  function openRunMenu() {
    if (!pauseRun()) return;
    stopAllSounds();
    updateRunSoundControl();
    els.runMenuOverlay.classList.remove('hidden');
    els.endRunBtn.setAttribute('aria-expanded', 'true');
    syncInteractionLayers();
    requestAnimationFrame(() => els.runMenuOverlay.querySelector('.run-menu-modal')?.focus());
  }

  function continueRunFromMenu() {
    hideRunMenu();
    sound('tap');
    resumeRun();
  }

  function toggleRunSound() {
    save.sound = !save.sound;
    if (!save.sound) stopAllSounds();
    persist();
    updateRunSoundControl();
    if (save.sound) sound('tap');
    feedback(5);
  }

  function restartCurrentRun() {
    if (!run || run.ended) return;
    const endless = run.endless;
    cancelAnimationFrame(run.animationId);
    hideRunMenu();
    run = null;
    startDrop({ endless });
  }

  function finishRunFromMenu() {
    if (!run || run.ended) return;
    hideRunMenu();
    finishRunEarly();
  }

  function startDrop(options = {}) {
    const endless = options?.endless === true;
    GAME_BALANCE = window.SlimeBalance?.load?.() || GAME_BALANCE;
    if (secretSequenceActive || menuSlimeIsBusy()) {
      showToast('Слайм ещё доедает');
      return;
    }
    if (endless && !save.gameCompleted) return showToast('Бесконечный мир откроется после прохождения игры');
    sound('tap');
    feedback([10, 25, 12]);
    const baseWorld = currentWorld();
    const level = endless ? LEVEL_COUNT : selectedLevelForWorld(baseWorld.id);
    const world = {
      ...baseWorld,
      targetDepth: levelTargetDepth(baseWorld, level),
      reward: levelReward(baseWorld, level),
      endlessScale: 1
    };
    const finishY = world.targetDepth * 10 + 180;
    const cellSize = world.cellSize || BALANCE.gridCell;
    const columns = Math.floor(VIEW_W / cellSize);
    const gridOffsetX = (VIEW_W - columns * cellSize) / 2;
    const startLane = columns % 2
      ? Math.floor(columns / 2)
      : Math.floor(columns / 2) - (Math.random() < .5 ? 1 : 0);
    const startX = gridOffsetX + startLane * cellSize + cellSize / 2;
    const fedScale = foodGrowthScale(session.foods.length);
    run = {
      worldId: world.id,
      level,
      world,
      previousBest: endless ? 0 : Math.min(world.targetDepth, Math.max(0, Math.floor(save.lastRunDepth?.[`${world.id}:${level}`] || 0))),
      finishY,
      cellSize,
      columns,
      gridOffsetX,
      startX,
      endless,
      endlessLap: 1,
      endlessDepthOffset: 0,
      // Портал — самостоятельный финал. Крепостной стены перед ним больше нет.
      portalY: finishY + cellSize * .35,
      blocks: [], particles: [], trails: [], specialEffects: [],
      meteorShowers: [],
      slime: {
        x: startX,
        y: 78,
        vx: rand(-65, 65),
        vy: 40,
        radius: 28 * fedScale,
        wobble: 0
      },
      steer: { left: false, right: false },
      geyserCapture: null,
      geyserLaunchGraceUntil: 0,
      geyserBreaksLeft: 0,
      fedScale,
      sizeMultiplier: 1,
      mass: session.stats.mass,
      startMass: session.stats.mass,
      maxMass: Math.max(1, Math.round(session.stats.mass)),
      visualMass: session.stats.mass,
      massFlash: 0,
      massFlashTime: 0,
      hurtFlashUntil: 0,
      healGlowUntil: 0,
      appleGlowUntil: 0,
      appleGlowType: '',
      freezeUntil: 0,
      frozenEmotion: 'surprised',
      lastFrozenImpactAt: 0,
      emotion: 'joy',
      emotionUntil: 0,
      power: session.stats.power,
      defense: session.stats.defense,
      elasticity: session.stats.elasticity,
      coinMultiplier: session.stats.coinMultiplier,
      effects: { ...session.effects },
      freeBouncesLeft: session.effects.freeBounces || 0,
      revived: false,
      rainbowHeartUsed: false,
      voidBreakerUsed: false,
      brokenSinceBlast: 0,
      abilityCharge: Math.min(45, session.stats.ability),
      abilityTime: 0,
      abilityCooldown: 0,
      abilityCooldownMax: session.effects.cooldownCut ? 3.5 : BALANCE.abilityCooldown,
      abilityChargeMultiplier: session.effects.chargeBoost ? 1.25 : 1,
      coins: 0,
      comboCount: 0,
      comboMultiplier: 1,
      comboRows: new Set(),
      comboGraceUntil: 0,
      depth: 0,
      maxDepth: 0,
      flightDistance: 0,
      maxFlight: 0,
      blocksDestroyed: 0,
      ended: false,
      paused: false,
      pausedAt: 0,
      portalTransitioning: false,
      portalEntry: null,
      rewardClaimed: false,
      rewardPending: false,
      rewardMultiplier: 1,
      rewardMeter: null,
      cameraY: 0,
      lastTime: 0,
      animationId: 0,
      shake: 0,
      hitCooldowns: new Map(),
      lastMassDamageAt: -9999,
      bounceGraceUntil: 0,
            softLandingUntil: 0,
      lastBombPullAt: 0,
      impactGroupId: 0,
      lowMotionTime: 0,
      lastPosition: { x: startX, y: 78 },
      trailPoints: [],
      nextTrailPointId: 0,
      lastTrailSampleAt: 0
    };
    run.blocks = generateBlockField(run);
    prepareCanvas();
    showScreen('drop');
    clearRunImpactFeedback();
    updateRunUI();
    run.animationId = requestAnimationFrame(gameFrame);
  }

  function prepareCanvas() {
    const dpr = Math.min(isLowPowerDevice() ? 1 : isMobileDevice() ? 1.25 : 1.75, window.devicePixelRatio || 1);
    els.canvas.width = VIEW_W * dpr;
    els.canvas.height = VIEW_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function weightedKey(distribution, fallback) {
    const entries = Object.entries(distribution || {}).filter(([, weight]) => +weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + +weight, 0);
    if (!total) return fallback;
    let roll = Math.random() * total;
    return entries.find(([, weight]) => (roll -= +weight) <= 0)?.[0] || fallback;
  }

  function chooseBalancedCell(world, level, progress) {
    const zone = gameplayZone(world.id, level, progress);
    const category = weightedKey(zone?.blocks, 'weak');
    if (category === 'weak') return { tier:'dense', special:null, zone };
    if (category === 'normal') return { tier:'hard', special:null, zone };
    if (category === 'strong') return { tier:'reinforced', special:null, zone };
    if (category === 'ore') return { tier:'ore', special:null, zone };
    const worldSpecialIds = window.SlimeBalance?.specialIdsForWorld?.(world.id)
      || (world.id === 2
        ? ['heal', 'cryo', 'snowflake']
        : world.id === 3
          ? ['heal', 'appleMint', 'appleRed']
          : world.id === 4
            ? ['heal', 'geyser', 'meteor']
          : ['heal', 'bomb', 'spring']);
    const enabledSecondary = Object.fromEntries(worldSpecialIds
      .filter(id => editorAllows(world, level, id))
      .map(id => [id, zone?.secondary?.[id] || 0]));
    if (!Object.values(enabledSecondary).some(weight => weight > 0)) return { tier:'dense', special:null, zone };
    const selected = weightedKey(enabledSecondary, world.id === 2 ? 'cryo' : world.id === 3 ? 'appleMint' : world.id === 4 ? 'geyser' : 'heal');
    const special = selected === 'heal' ? 'gel' : selected;
    return { tier:'special', special, zone };
  }

  function generateBlockField(runState) {
    const { world, finishY } = runState;
    const blocks = [];
    const cell = runState.cellSize || BALANCE.gridCell;
    const columns = runState.columns || Math.floor(VIEW_W / cell);
    const gridOffsetX = runState.gridOffsetX || 0;
    const startY = 190;
    // Оставляем перед порталом чистый вход: последний ряд блоков не заменяется стеной.
    const rows = Math.max(8, Math.floor((finishY - cell - startY) / cell));
    const unlocks = levelFeatures(world, runState.level);
    const plan = createSectionPlan(world, rows, runState.level);
    let id = 0;
    let pathCenter = Math.floor(columns / 2);
    let previousSection = '';

    for (let row = 0; row < rows; row += 1) {
      const y = startY + row * cell;
      const progress = clamp(row / Math.max(1, rows - 1), 0, 1);
      const meta = plan[row];
      if (meta.kind !== previousSection && row > 3 && meta.kind !== 'final') {
        const turnChance = world.turnRate * (meta.kind === 'fork' ? 1.25 : .72);
        if (Math.random() < turnChance) pathCenter += Math.random() < .5 ? -1 : 1;
      }
      previousSection = meta.kind;
      pathCenter = clamp(pathCenter, 1, columns - 2);

      let pathWidth = clamp(Math.round(lerp(world.pathWidth, world.minPathWidth, progress)), 1, 3);
      if (meta.kind === 'tutorial' || meta.kind === 'recovery' || meta.kind === 'final') pathWidth = Math.max(pathWidth, world.id === 1 ? 3 : 2);
      if (meta.kind === 'boss') pathWidth = 1;
      const pathStart = clamp(Math.round(pathCenter - (pathWidth - 1) / 2), 0, columns - pathWidth);
      let pathColumns = Array.from({ length: pathWidth }, (_, index) => pathStart + index);
      pathCenter = pathStart + (pathWidth - 1) / 2;

      // Развилка: два читаемых маршрута — безопасный и наградный.
      let riskyCol = -1;
      if (meta.kind === 'fork') {
        const left = clamp(Math.floor(pathCenter) - 2, 0, columns - 1);
        const right = clamp(Math.ceil(pathCenter) + 2, 0, columns - 1);
        pathColumns = [...new Set([left, right])];
        riskyCol = meta.sectionIndex % 2 ? left : right;
      }

      const keyRow = meta.localRow === Math.floor(meta.length / 2);
      const rowBlocks = [];
      for (let col = 0; col < columns; col += 1) {
        const inPath = pathColumns.includes(col);
        const balanced = chooseBalancedCell(world, runState.level, progress);
        let tier = balanced.tier;
        let special = balanced.special;
        // Hazards are biome-wide mechanics. They used to be accidentally
        // hard-locked to World 4 even when another world's level enabled them.
        const hazard = !special
          && tier !== 'ore'
          && editorAllows(world, runState.level, 'hazard')
          && Math.random() < lerp(.035, .075, progress);
        const hazardVariant = null;
        const finalTier = special ? 'special' : tier;
        const customVisuals = editorWorld(world.id)?.blocks?.filter(item => item.type === 'custom' && item.spawnType === finalTier && editorAllows(world, runState.level, item.id)) || [];
        const customVisual = customVisuals.length ? customVisuals[Math.floor(Math.random() * customVisuals.length)] : null;
        const oreType = finalTier === 'ore' ? chooseOreType(progress, world, balanced.zone) : null;
        let maxHp = blockHpForTier(finalTier, world, progress, row, col, inPath);
        if (special === 'coin') maxHp *= .66;
        if (special === 'spring') maxHp = 1;
        if (special === 'boss') maxHp *= 4.4;
        const editedBlock = customVisual || editorBlock(world.id, special === 'gel' ? 'heal' : special || (hazard ? 'hazard' : finalTier));
        if (customVisual) maxHp *= editedBlock?.hp || 1;
        const coreRange = durabilityRange(finalTier);
        if (coreRange && !special && !hazard) maxHp = clamp(maxHp, coreRange[0], coreRange[1]);
        if (oreType) {
          const oreBalance = GAME_BALANCE?.ores?.[oreType.id];
          maxHp = rand(oreBalance?.min ?? oreType.hp[0], oreBalance?.max ?? oreType.hp[1]);
        }
        // Fixed values for gameplay-critical blocks. Editor multipliers never
        // make a medkit, dynamite or hazard unexpectedly tougher.
        if (hazard) maxHp = 30;
        if (special === 'bomb' || special === 'gel' || special === 'cryo' || special === 'snowflake' || special === 'appleMint' || special === 'appleRed' || special === 'geyser' || special === 'meteor') maxHp = 5;
        if (special === 'spring') maxHp = 1;
        maxHp = Math.max(1, Math.round(maxHp));

        const material = hazard ? (world.id === 2 ? 'iceHazard' : world.id === 4 ? 'lavaRock' : 'hazard') : chooseMaterial(world, progress, special, finalTier);
        rowBlocks.push({
          id: id++, row, col, x: gridOffsetX + col * cell, y, w: cell, h: cell,
          hp: maxHp, maxHp, material, special, tier: finalTier, dead: false,
          path: inPath, segment: meta.kind, hazard, hazardVariant, oreType, frozen: false, editorVisualId: customVisual?.id || '',
          // Grass belongs only to the surface layer of World 1.
          topGrass: world.id === 1 && row === 0 && !special && finalTier === 'soft',
          coins: special
            ? 0
            : oreType
              ? Math.max(0, Math.round(GAME_BALANCE?.ores?.[oreType.id]?.coins ?? (10 + maxHp * .45) * oreType.reward))
              : blockRewardForTier(finalTier)
        });
      }

      // The first row is purely decorative surface. Below it, the same weak
      // strength uses the world's normal ground texture; surface art never
      // appears underground.
      if (row === 0) {
        for (const block of rowBlocks) {
          block.tier = world.id === 2 || world.id === 4 ? 'dense' : 'soft';
          block.special = null;
          block.hazard = false;
          block.hazardVariant = null;
          block.oreType = null;
          block.editorVisualId = '';
          block.topGrass = world.id === 1;
          if (world.id === 1) block.material = 'grass';
          if (world.id === 2) block.material = 'iceLight';
          if (world.id === 4) block.material = 'ash';
          block.maxHp = block.hp = blockHpForTier(block.tier, world, progress, row, block.col, true);
          block.coins = blockRewardForTier('soft');
        }
      }
      blocks.push(...rowBlocks);
    }
    return blocks;
  }

  function createSectionPlan(world, rows, level) {
    const sequences = {
      1: ['tutorial', 'flow', 'bounce', 'recovery', 'reward', 'flow', 'bomb', 'bounce', 'ore', 'final'],
      2: ['tutorial', 'flow', 'fork', 'reward', 'bounce', 'ore', 'recovery', 'bomb', 'challenge', 'final'],
      3: ['tutorial', 'flow', 'fork', 'bounce', 'ore', 'challenge', 'recovery', 'bomb', 'challenge', 'final'],
      4: ['tutorial', 'flow', 'challenge', 'fork', 'ore', 'bounce', 'challenge', 'bomb', 'recovery', 'challenge', 'final']
    };
    const baseLength = { tutorial: 4, flow: 4, fork: 4, bounce: 3, recovery: 3, reward: 3, bomb: 3, ore: 4, challenge: 4, boss: 5, final: 3 };
    const sequence = levelConfig(world, level)?.sections || sequences[world.id] || sequences[4];
    const minimums = sequence.map((kind, index) => index === 0 ? 2 : 1);
    const lengths = [...minimums];
    let remaining = Math.max(0, rows - lengths.reduce((a, b) => a + b, 0));
    const weightSum = sequence.reduce((sum, kind) => sum + baseLength[kind], 0);
    const targets = sequence.map(kind => rows * baseLength[kind] / weightSum);
    while (remaining > 0) {
      let bestIndex = 0;
      let bestNeed = -Infinity;
      for (let i = 0; i < lengths.length; i += 1) {
        const need = targets[i] - lengths[i] + (sequence[i] === 'final' ? .18 : 0);
        if (need > bestNeed) { bestNeed = need; bestIndex = i; }
      }
      lengths[bestIndex] += 1;
      remaining -= 1;
    }
    const plan = [];
    sequence.forEach((kind, sectionIndex) => {
      const length = lengths[sectionIndex];
      for (let localRow = 0; localRow < length; localRow += 1) plan.push({ kind, sectionIndex, localRow, length });
    });
    while (plan.length < rows) plan.splice(Math.max(1, plan.length - 1), 0, { kind: 'flow', sectionIndex: 1, localRow: 0, length: 1 });
    return plan.slice(0, rows);
  }

  function editorAllows(world, level, id) {
    const edited = editorLevel(world.id, level);
    return !edited || !Array.isArray(edited.enabled) || edited.enabled.includes(id);
  }

  function blockHpForTier(tier, world, progress, row, col, inPath = false) {
    const [min, max] = durabilityRange(tier) || [5, 15];
    return Math.round(rand(min, max) * Math.max(1, world.endlessScale || 1));
  }

  function durabilityRange(tier) {
    const id = tier === 'hard' ? 'normal' : tier === 'reinforced' ? 'strong' : (tier === 'soft' || tier === 'dense') ? 'weak' : null;
    if (!id) return tier === 'ore' ? [10, 40] : tier === 'special' ? [5, 5] : null;
    const range = GAME_BALANCE?.durability?.[id];
    return [range?.min ?? (id === 'weak' ? 5 : id === 'normal' ? 15 : 35), range?.max ?? (id === 'weak' ? 15 : id === 'normal' ? 35 : 55)];
  }

  function blockRewardForTier(tier) {
    const id = tier === 'hard' ? 'normal' : tier === 'reinforced' ? 'strong' : (tier === 'soft' || tier === 'dense') ? 'weak' : null;
    if (!id) return 0;
    const fallback = id === 'weak' ? 4 : id === 'normal' ? 10 : 22;
    return Math.max(0, Math.round(GAME_BALANCE?.rewards?.[id] ?? fallback));
  }

  function chooseMaterial(world, progress, special, tier = 'dense') {
    if (special) return special;
    if (tier === 'ore') return 'ore';
    if (world.id === 4) {
      if (tier === 'reinforced') return 'basalt';
      if (tier === 'hard') return 'volcanicEarth';
      return 'ash';
    }
    if (progress < .28) return world.materials[0];
    if (progress < .68) return Math.random() < .72 ? world.materials[1] : world.materials[0];
    return Math.random() < .72 ? world.materials[2] : world.materials[1];
  }

  function chooseOreType(progress, world, zone) {
    const id = weightedKey(zone?.ores, 'coal');
    return ORE_TYPES.find(ore => ore.id === id) || ORE_TYPES[0];
  }

  // ===== ФИЗИКА И СТОЛКНОВЕНИЯ =====
  function gameFrame(timestamp) {
    if (!run || run.ended || run.paused || run.portalTransitioning) return;
    if (!run.lastTime) run.lastTime = timestamp;
    const dt = Math.min(.034, (timestamp - run.lastTime) / 1000);
    run.lastTime = timestamp;

    const speed = Math.hypot(run.slime.vx, run.slime.vy);
    // Fast launches and low-FPS frames must never move the slime far enough
    // to skip a block between two collision checks.
    const safeTravel = Math.max(5, Math.min(run.slime.radius * .24, run.cellSize * .14));
    const substeps = clamp(Math.ceil(speed * dt / safeTravel), 1, 12);
    for (let i = 0; i < substeps; i += 1) updatePhysics(dt / substeps, timestamp);
    updateMeteorShowers(timestamp);
    updateSlimeTrail(dt, timestamp);
    updateParticles(dt);
    updateSpecialEffects(dt);
    renderCanvas(timestamp);
    if (!run.lastUiUpdateAt || timestamp - run.lastUiUpdateAt >= (isMobileDevice() ? 90 : 70)) {
      run.lastUiUpdateAt = timestamp;
      updateRunUI();
    }
    if (!run.ended && !run.paused && !run.portalTransitioning) run.animationId = requestAnimationFrame(gameFrame);
  }

  function isSlimeFrozen(timestamp = performance.now()) {
    return Boolean(run && !run.portalEntry && timestamp < run.freezeUntil);
  }

  function updateSlimeTrail(dt, timestamp) {
    if (!run?.trailPoints) return;
    for (const point of run.trailPoints) {
      point.life -= dt;
      if (point.kind === 'bubble') {
        point.x += point.driftX * dt;
        point.y += point.driftY * dt;
        point.driftX *= Math.pow(.34, dt);
        point.driftY -= 2.4 * dt;
      }
    }
    run.trailPoints = run.trailPoints.filter(point => point.life > 0);
    const trail = TRAILS.find(item => item.id === save.selectedTrail) || TRAILS[0];
    const bubbleTrail = trail.effect === 'bubbles';
    const density = effectDensity();
    const sampleInterval = (bubbleTrail ? 58 : 34) / density;
    if (save.selectedTrail === 'none' || run.portalEntry || timestamp - run.lastTrailSampleAt < sampleInterval) return;
    const speed = Math.hypot(run.slime.vx, run.slime.vy);
    if (speed < 80) return;
    run.lastTrailSampleAt = timestamp;
    const trailLife = trail.life || 1.02;
    const speedX = run.slime.vx / Math.max(1, speed);
    const speedY = run.slime.vy / Math.max(1, speed);
    const normalX = -speedY;
    const normalY = speedX;
    const spawnCount = bubbleTrail ? (Math.random() < .38 ? 2 : 1) : 1;
    for (let index = 0; index < spawnCount; index += 1) {
      const side = bubbleTrail ? rand(-run.slime.radius * .5, run.slime.radius * .5) : 0;
      const bubbleScale = bubbleTrail ? (Math.random() < .2 ? rand(.72, .98) : rand(.36, .7)) : 1;
      const trailPointId = run.nextTrailPointId++;
      run.trailPoints.push({
        id: trailPointId,
        x: run.slime.x - speedX * run.slime.radius * .7 + normalX * side,
        y: run.slime.y - speedY * run.slime.radius * .7 + normalY * side,
        life: trailLife,
        maxLife: trailLife,
        size: Math.max(6, run.slime.radius * .48 * bubbleScale),
        phase: Math.random() * Math.PI * 2,
        kind: bubbleTrail ? 'bubble' : 'ribbon',
        driftX: bubbleTrail ? normalX * rand(-8, 8) - speedX * rand(4, 11) : 0,
        driftY: bubbleTrail ? normalY * rand(-8, 8) - speedY * rand(4, 11) - rand(2, 7) : 0,
        sparkle: trail.effect === 'gold' && Math.random() < .16,
        sparkleSide: Math.random() < .5 ? -1 : 1
      });
    }
    const maxPoints = Math.max(14, Math.round((bubbleTrail ? 24 : 30) * density));
    if (run.trailPoints.length > maxPoints) run.trailPoints.splice(0, run.trailPoints.length - maxPoints);
  }

  function updatePhysics(dt, timestamp) {
    const s = run.slime;
    if (run.portalEntry) {
      updatePortalEntry(dt, timestamp);
      return;
    }
    if (run.geyserCapture) {
      updateGeyserCapture(dt, timestamp);
      return;
    }
    const frozen = isSlimeFrozen(timestamp);
    const worldGravity = (BALANCE.gravityBase + run.worldId * BALANCE.gravityPerWorld) * (frozen ? 1.48 : 1);
    const previousX = s.x;
    const previousY = s.y;

    const terminalSpeed = (BALANCE.maxFallSpeedBase + run.worldId * BALANCE.maxFallSpeedPerWorld) * (frozen ? 1.18 : 1);
    s.vy = Math.min(terminalSpeed, s.vy + worldGravity * dt);
    applyFallSteering(s, dt);
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.wobble += dt * (4 + Math.abs(s.vy) / 180);

    if (s.x - s.radius < 4) {
      s.x = s.radius + 4;
      s.vx = Math.abs(s.vx) * .82 + 28;
      run.shake = Math.max(run.shake, 3);
    }
    if (s.x + s.radius > VIEW_W - 4) {
      s.x = VIEW_W - s.radius - 4;
      s.vx = -Math.abs(s.vx) * .82 - 28;
      run.shake = Math.max(run.shake, 3);
    }

    const moved = Math.hypot(s.x - previousX, s.y - previousY);
    run.flightDistance += moved;
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.depth = (run.endlessDepthOffset || 0) + Math.max(0, Math.floor((s.y - 80) / 10));
    run.maxDepth = Math.max(run.maxDepth, run.depth);

    if (run.effects.bombPull && timestamp - run.lastBombPullAt > 220) {
      const nearbyBomb = run.blocks.find(block => !block.dead && block.special === 'bomb' && Math.hypot(block.x + block.w / 2 - s.x, block.y + block.h / 2 - s.y) < 92);
      if (nearbyBomb) {
        nearbyBomb.dead = true;
        run.lastBombPullAt = timestamp;
        explodeBomb(nearbyBomb);
        impact('ЧЁРНАЯ ДЫРА: ВЗРЫВ!');
      }
    }

    const collisions = run.blocks
      .filter(block => !block.dead && block.y + block.h > s.y - s.radius - 3 && block.y < s.y + s.radius + 3)
      .map(block => ({ block, collision: circleRectCollision(s, block) }))
      .filter(item => item.collision)
      .sort((a, b) => b.collision.penetration - a.collision.penetration);

    for (const item of collisions) {
      const { block, collision } = item;
      const normalSpeed = s.vx * collision.nx + s.vy * collision.ny;
      const movingOutOfBlock = normalSpeed >= -1;
      const cooldown = run.hitCooldowns.get(block.id) || 0;
      if (timestamp - cooldown < 72 || (timestamp < run.bounceGraceUntil && movingOutOfBlock) || (timestamp < run.geyserLaunchGraceUntil && movingOutOfBlock)) {
        stabilizeSlimeContact(s, collision);
        continue;
      }
      run.hitCooldowns.set(block.id, timestamp);
      const bounced = resolveBlockHit(block, collision, timestamp);
      if (run.ended) return;
      if (bounced) break;
    }

    applyPortalAttraction(dt);
    const portal = getPortalGeometry();
    if (slimeTouchesPortal(s, portal) || s.y - s.radius > portal.bottom + 70) {
      beginPortalEntry(timestamp, portal);
      return;
    }

    const targetCamera = clamp(s.y - 158, 0, run.portalY - VIEW_H + 105);
    run.cameraY = lerp(run.cameraY, targetCamera, clamp(dt * 4.25, 0, 1));

    if (run.abilityTime > 0) {
      run.abilityTime = Math.max(0, run.abilityTime - dt);
    } else if (run.abilityCooldown > 0) {
      run.abilityCooldown = Math.max(0, run.abilityCooldown - dt);
    }
    if (run.shake > 0) run.shake = Math.max(0, run.shake - dt * 20);
    run.visualMass = lerp(run.visualMass, Math.max(0, run.mass), clamp(dt * 11, 0, 1));
    const healthScale = .82 + .18 * Math.sqrt(clamp(run.mass / Math.max(1, run.startMass), 0, 1));
    s.radius = lerp(s.radius, 28 * run.fedScale * healthScale * (run.sizeMultiplier || 1), clamp(dt * 5.5, 0, 1));
    if (run.massFlashTime > 0) run.massFlashTime = Math.max(0, run.massFlashTime - dt);

    const speedNow = Math.hypot(s.vx, s.vy);
    if (speedNow < 34 && s.y > 180) run.lowMotionTime += dt;
    else run.lowMotionTime = 0;
    if (run.lowMotionTime > 1.0) {
      s.vy += 145;
      s.vx += rand(-65, 65);
      run.lowMotionTime = 0;
    }

    if (run.mass <= 0 && !tryRevive()) endRun(false, 'У слайма закончилось здоровье');
  }

  function updateGeyserCapture(dt, timestamp) {
    const capture = run.geyserCapture;
    const block = capture?.block;
    if (!capture || !block || block.dead) {
      run.geyserCapture = null;
      return;
    }
    const pullProgress = clamp((timestamp - capture.startedAt) / capture.pullDuration, 0, 1);
    const eased = 1 - Math.pow(1 - pullProgress, 3);
    const settle = Math.sin(pullProgress * Math.PI) * (1 - pullProgress) * 2.5;
    run.slime.x = lerp(capture.startX, capture.targetX, eased) + capture.entryNormalX * settle;
    run.slime.y = lerp(capture.startY, capture.targetY, eased) + (pullProgress >= 1 ? Math.sin(timestamp / 210) * 1.2 : 0);
    run.slime.vx = 0;
    run.slime.vy = 0;
    run.slime.wobble += dt * 2.6;
    run.emotion = 'surprised';
    run.emotionUntil = timestamp + 180;
    const targetCamera = clamp(run.slime.y - 210, 0, run.portalY - VIEW_H + 105);
    run.cameraY = lerp(run.cameraY, targetCamera, clamp(dt * 5.5, 0, 1));
    run.shake = Math.max(0, run.shake - dt * 14);
    if (capture.pendingDirection && timestamp >= capture.readyAt) {
      launchFromGeyser(capture.pendingDirection, timestamp);
      return;
    }
    if (timestamp >= capture.autoLaunchAt) {
      const randomAngle = rand(0, Math.PI * 2);
      const fallbackDirection = { x: Math.cos(randomAngle), y: Math.sin(randomAngle) };
      launchFromGeyser(fallbackDirection, timestamp, true);
    }
  }

  function activateGeyser(block, timestamp) {
    if (run.geyserCapture) return true;
    const s = run.slime;
    const waitSeconds = 3;
    const entrySpeed = Math.max(1, Math.hypot(s.vx, s.vy));
    const pullDuration = 260;
    run.geyserCapture = {
      block,
      startedAt: timestamp,
      autoLaunchAt: timestamp + waitSeconds * 1000,
      readyAt: timestamp + 760,
      pullDuration,
      startX: s.x,
      startY: s.y,
      targetX: block.x + block.w / 2,
      targetY: block.y + block.h * .43,
      entryVx: s.vx,
      entryNormalX: -s.vy / entrySpeed,
      pendingDirection: null
    };
    s.vx = 0;
    s.vy = 0;
    preserveCombo(timestamp);
    clearFallSteering();
    run.shake = Math.max(run.shake, 2.5);
    run.emotion = 'surprised';
    run.emotionUntil = timestamp + waitSeconds * 1000;
    sound('epic');
    feedback([6, 10, 6]);
    return true;
  }

  function launchFromGeyser(direction, timestamp = performance.now(), automatic = false) {
    const capture = run?.geyserCapture;
    if (!capture) return false;
    let directionX = typeof direction === 'number' ? Math.sign(direction) : Number(direction?.x) || 0;
    let directionY = typeof direction === 'number' ? -.72 : Number(direction?.y) || 0;
    const directionLength = Math.hypot(directionX, directionY);
    if (directionLength < .08) {
      directionX = 0;
      directionY = -1;
    } else {
      directionX /= directionLength;
      directionY /= directionLength;
    }
    if (!automatic && timestamp < capture.readyAt) {
      capture.pendingDirection = { x: directionX, y: directionY };
      feedback(4);
      return true;
    }
    const block = capture.block;
    const launchScale = clamp(GAME_BALANCE?.special?.geyser?.launch ?? 1, .6, 2);
    run.geyserCapture = null;
    block.hp = 0;
    destroyBlock(block);
    run.slime.x = capture.targetX + directionX * 5;
    run.slime.y = capture.targetY + directionY * 5;
    const launchSpeed = 585 * launchScale;
    run.slime.vx = directionX * launchSpeed;
    run.slime.vy = directionY * launchSpeed;
    run.flightDistance = 0;
    run.bounceGraceUntil = timestamp + 380;
    run.geyserLaunchGraceUntil = timestamp + 230;
    run.geyserBreaksLeft = 5;
    preserveCombo(timestamp);
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 650;
    run.shake = Math.max(run.shake, 4.2);
    spawnSpecialBurst('geyser', capture.targetX, capture.targetY, directionX, directionY);
    sound('epic');
    feedback([9, 16, 9]);
    return true;
  }

  function launchGeyserTowardClientPoint(clientX, clientY, timestamp = performance.now()) {
    const capture = run?.geyserCapture;
    const rect = els.canvas?.getBoundingClientRect();
    if (!capture || !rect?.width || !rect.height) return false;
    const targetX = clamp((clientX - rect.left) / rect.width * VIEW_W, 0, VIEW_W);
    const targetY = clamp((clientY - rect.top) / rect.height * VIEW_H, 0, VIEW_H) + run.cameraY;
    return launchFromGeyser({ x: targetX - capture.targetX, y: targetY - capture.targetY }, timestamp);
  }

  function applyFallSteering(slime, dt) {
    if (!run?.steer || run.portalEntry || isSlimeFrozen()) return;
    const direction = Number(run.steer.right) - Number(run.steer.left);
    if (!direction) return;
    const controlSpeed = 235;
    const acceleration = 180;
    if (Math.sign(slime.vx) === direction && Math.abs(slime.vx) >= controlSpeed) return;
    const nextVx = slime.vx + direction * acceleration * dt;
    slime.vx = Math.sign(nextVx) === direction
      ? direction * Math.min(Math.abs(nextVx), controlSpeed)
      : nextVx;
  }

  function getPortalGeometry() {
    const anchorY = run.portalY ?? run.finishY + run.cellSize * .35;
    const centerY = anchorY - 27;
    return { type: 'circle', x: VIEW_W / 2, y: centerY, radius: 67, bottom: centerY + 67 };
  }

  function slimeTouchesPortal(slime, portal) {
    if (portal.type === 'circle') {
      return Math.hypot(slime.x - portal.x, slime.y - portal.y) <= slime.radius + portal.radius;
    }
    return Boolean(circleRectCollision(slime, portal));
  }

  function applyPortalAttraction(dt) {
    const s = run.slime;
    const portal = getPortalGeometry();
    const approachY = portal.y - run.cellSize;
    if (s.y + s.radius < approachY - 8 || s.y > portal.bottom + 60) return;
    const pull = clamp((s.y + s.radius - approachY + 16) / 90, .18, 1);
    s.vx += (portal.x - s.x) * 10 * pull * dt;
    s.vx *= Math.max(.72, 1 - dt * 2.4);
  }

  function beginPortalEntry(timestamp, portal = getPortalGeometry()) {
    if (run.portalEntry || run.ended) return;
    const targetX = portal.type === 'circle' ? portal.x : portal.centerX;
    const targetY = portal.type === 'circle' ? portal.y : portal.centerY;
    run.portalEntry = {
      startedAt: timestamp,
      duration: 760,
      startX: run.slime.x,
      startY: run.slime.y,
      targetX,
      targetY,
      startDistance: Math.max(14, Math.hypot(run.slime.x - targetX, run.slime.y - targetY)),
      startAngle: Math.atan2(run.slime.y - targetY, run.slime.x - targetX)
    };
    run.slime.vx = 0;
    run.slime.vy = 0;
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 700;
    run.shake = Math.max(run.shake, 5.5);
    spawnPortalBurst(targetX, targetY);
    sound('epic');
    feedback([10, 24, 10]);
  }

  function updatePortalEntry(dt, timestamp) {
    const entry = run.portalEntry;
    const progress = clamp((timestamp - entry.startedAt) / entry.duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 2.45);
    const orbitRadius = entry.startDistance * (1 - eased) + Math.sin(progress * Math.PI) * 7;
    const orbitAngle = entry.startAngle + progress * Math.PI * 2.15;
    run.slime.x = entry.targetX + Math.cos(orbitAngle) * orbitRadius;
    run.slime.y = entry.targetY + Math.sin(orbitAngle) * orbitRadius * .72;
    run.slime.wobble += dt * (15 + progress * 19);
    const targetCamera = clamp(run.slime.y - 250, 0, run.portalY - VIEW_H + 170);
    run.cameraY = lerp(run.cameraY, targetCamera, clamp(dt * 5, 0, 1));
    run.shake = Math.max(0, run.shake - dt * 7);
    if (progress >= 1) finishWorld();
  }

  function circleRectCollision(circle, rect) {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
    let dx = circle.x - closestX;
    let dy = circle.y - closestY;
    let distanceSq = dx * dx + dy * dy;
    if (distanceSq >= circle.radius * circle.radius) return null;

    let distance = Math.sqrt(distanceSq);
    let nx;
    let ny;
    let insideDepth = 0;
    if (distance > .001) {
      nx = dx / distance;
      ny = dy / distance;
    } else {
      const left = Math.abs(circle.x - rect.x);
      const right = Math.abs(rect.x + rect.w - circle.x);
      const top = Math.abs(circle.y - rect.y);
      const bottom = Math.abs(rect.y + rect.h - circle.y);
      const min = Math.min(left, right, top, bottom);
      insideDepth = min;
      if (min === top) { nx = 0; ny = -1; }
      else if (min === bottom) { nx = 0; ny = 1; }
      else if (min === left) { nx = -1; ny = 0; }
      else { nx = 1; ny = 0; }
      distance = 0;
    }
    return { nx, ny, penetration: circle.radius - distance + insideDepth };
  }

  function stabilizeSlimeContact(slime, collision, padding = 1.25) {
    const correction = Math.max(0, collision.penetration) + padding;
    slime.x += collision.nx * correction;
    slime.y += collision.ny * correction;
    const inwardSpeed = slime.vx * collision.nx + slime.vy * collision.ny;
    if (inwardSpeed < 0) {
      slime.vx -= inwardSpeed * collision.nx;
      slime.vy -= inwardSpeed * collision.ny;
    }
  }

  function resolveBlockHit(block, collision, timestamp = performance.now()) {
    const s = run.slime;
    if (block.special === 'geyser') return activateGeyser(block, timestamp);
    if (block.special === 'spring') return activateSpring(block, collision, timestamp);
    const frozenSlime = isSlimeFrozen(timestamp);
    const isFalling = s.vy > 0;
    const tierData = BLOCK_TIERS[block.tier] || BLOCK_TIERS.dense;
    const impactSpeed = Math.max(70, Math.hypot(s.vx, s.vy));
    const flightMultiplier = 1 + Math.min(run.flightDistance / 285, 1.35);
    const speedMultiplier = clamp(impactSpeed / 360, .74, 1.55);
    const abilityMultiplier = run.abilityTime > 0 ? 2.5 : 1;

    // Сила удара опирается на максимальную массу. Потеря здоровья больше не запускает спираль смерти.
    const healthFactor = .85 + .15 * clamp(run.mass / Math.max(1, run.maxMass), 0, 1);
    const baseImpact = 7 + Math.sqrt(Math.max(1, run.maxMass)) * 2.12;
    const rawDamage = baseImpact * run.power * flightMultiplier * speedMultiplier * healthFactor * abilityMultiplier;
    let damage = Math.max(1, rawDamage * tierData.chip);
    const hpBefore = block.hp;
    // Utility blocks are collected on the very first contact, regardless of
    // current speed or an old editor durability multiplier.
    const breaksOnTouch = ['bomb', 'gel', 'cryo', 'snowflake', 'appleMint', 'appleRed', 'meteor'].includes(block.special);
    if (breaksOnTouch) damage = hpBefore;
    if (run.effects.voidBreaker && !run.voidBreakerUsed && ['hard', 'reinforced'].includes(block.tier) && damage < hpBefore) {
      damage = hpBefore + 1;
      run.voidBreakerUsed = true;
      impact('ПУСТОТА ПОГЛОТИЛА БЛОК!');
    }
    const geyserPiercing = run.geyserBreaksLeft > 0 && block.special !== 'geyser';
    if (geyserPiercing) damage = hpBefore;
    const destroysImmediately = breaksOnTouch || geyserPiercing || damage >= hpBefore;
    const sameImpactCluster = timestamp - run.lastMassDamageAt < BALANCE.impactClusterMs;

    let massLoss;
    if (destroysImmediately) {
      const work = clamp(hpBefore / Math.max(1, damage), 0, 1);
      massLoss = run.maxMass * lerp(tierData.breakLoss[0], tierData.breakLoss[1], work);
      massLoss = Math.min(massLoss, run.maxMass * BALANCE.maxBreakLossOfMaxMass);
    } else {
      const resistance = clamp(hpBefore / Math.max(1, damage), 1, 5);
      massLoss = run.maxMass * lerp(tierData.bounceLoss[0], tierData.bounceLoss[1], (resistance - 1) / 4);
      massLoss = Math.min(massLoss, run.maxMass * BALANCE.maxBounceLossOfMaxMass, Math.max(1, run.mass * BALANCE.maxBounceLossOfCurrentMass));
    }

    massLoss *= (1 - run.defense);
    if (block.special === 'spring') massLoss *= .35;
    if (block.hazard) massLoss *= 1.75;
    if (run.abilityTime > 0) massLoss *= .18;
    if (run.effects.softLanding && timestamp < run.softLandingUntil) massLoss *= .45;
    if (frozenSlime || block.special === 'snowflake' || block.special === 'appleMint' || block.special === 'appleRed' || block.special === 'meteor') massLoss = 0;
    if (!destroysImmediately && run.freeBouncesLeft > 0) {
      massLoss = 0;
      run.freeBouncesLeft -= 1;
      impact(`АЛМАЗНАЯ ЗАЩИТА · осталось ${run.freeBouncesLeft}`);
    }
    if (sameImpactCluster) massLoss *= BALANCE.repeatMassScale;
    massLoss = massLoss <= 0 ? 0 : Math.max(BALANCE.minMassLoss, massLoss);

    run.mass = Math.max(0, run.mass - massLoss);
    if (!sameImpactCluster && massLoss > 0) run.lastMassDamageAt = timestamp;
    if (!frozenSlime) {
      run.massFlash = massLoss > 0 ? -1 : 1;
      run.massFlashTime = .22;
      if (block.hazard && massLoss > 0) run.hurtFlashUntil = timestamp + 430;
    }
    run.shake = Math.max(run.shake, clamp(impactSpeed / 165, 1.0, destroysImmediately ? 3.8 : 5.8));
    if (!frozenSlime) {
      run.emotion = destroysImmediately ? 'impact' : 'hurt';
      run.emotionUntil = timestamp + (destroysImmediately ? 260 : 430);
    }
    
    if (destroysImmediately) {
      block.hp = 0;
      const withinComboGrace = run.comboCount > 0 && timestamp <= run.comboGraceUntil;
      const hasComboMomentum = isFalling && (s.vy >= 110 || withinComboGrace);
      let comboAdvanced = false;
      let comboStepReached = false;
      if (breaksOnTouch) preserveCombo(timestamp);
      else if (hasComboMomentum) {
        const comboResult = registerComboLayer(block.row, timestamp);
        comboAdvanced = comboResult.registered;
        comboStepReached = comboResult.multiplierChanged;
      }
      else resetCombo();
      destroyBlock(block, damage);
      if (geyserPiercing) run.geyserBreaksLeft = Math.max(0, run.geyserBreaksLeft - 1);
      const drag = block.tier === 'soft' ? BALANCE.weakBreakDrag : BALANCE.denseBreakDrag;
      s.vy = Math.max(110, s.vy * drag * tierData.drag);
      s.vx *= .95;
      let keep = block.tier === 'soft' ? BALANCE.flightKeepSoft : block.tier === 'dense' || block.tier === 'special' || block.tier === 'ore' ? BALANCE.flightKeepDense : BALANCE.flightKeepHard;
      if (run.effects.momentum) keep = Math.max(keep, .84);
      run.flightDistance *= keep;

      run.brokenSinceBlast += 1;
      if (run.effects.dragonBlast && run.brokenSinceBlast >= 10) {
        run.brokenSinceBlast = 0;
        explodeAt(block.x + block.w / 2, block.y + block.h / 2, 112, .45);
        impact('ДРАКОНИЙ ВЗРЫВ!');
      }

      if (comboAdvanced && comboStepReached) comboImpact(run.comboMultiplier, run.comboCount);
      else if (!block.special && run.comboCount < 2) impact(`УДАР · −${round1(massLoss)} здоровья`);
      sound(block.special === 'coin' || block.tier === 'ore' ? 'coin' : 'break');
      if (run.mass <= 0 && !tryRevive()) endRun(false, 'У слайма закончилось здоровье');
      return false;
    }

    preserveCombo(timestamp);
    block.hp = Math.max(.05, block.hp - damage);
    if (frozenSlime) {
      slideFrozenSlime(block, collision, timestamp);
      addAbilityCharge(2);
      createDebris(block, 3, false);
      return true;
    }
    const springBoost = block.special === 'spring' ? (GAME_BALANCE?.special?.spring?.push || 1.35) : 1;
    const resistance = clamp(hpBefore / Math.max(1, damage), 1, 5);
    const bounceBase = 74 + impactSpeed * .10 + run.flightDistance * .11 + resistance * 7;
    const bounce = clamp(bounceBase * run.elasticity * springBoost, BALANCE.bounceMin, BALANCE.bounceMax);
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.flightDistance = 0;
    run.bounceGraceUntil = timestamp + BALANCE.bounceGraceMs;
    if (run.effects.softLanding) run.softLandingUntil = timestamp + 1000;

    s.x += collision.nx * (collision.penetration + 2.4);
    s.y += collision.ny * (collision.penetration + 2.4);
    const dot = s.vx * collision.nx + s.vy * collision.ny;
    const restitution = block.special === 'spring' ? 1 + (GAME_BALANCE?.special?.spring?.push || 1.35) * .25 : 1.06;
    s.vx -= restitution * dot * collision.nx;
    s.vy -= restitution * dot * collision.ny;

    if (collision.ny < -.35) {
      s.vy = -bounce;
      const direction = chooseBounceDirection(block);
      const sideStrength = rand(38, 62);
      s.vx = clamp(s.vx * .28 + direction * sideStrength, -BALANCE.sideBounceMax, BALANCE.sideBounceMax);
    } else if (Math.abs(collision.nx) > .45) {
      const chosen = chooseBounceDirection(block);
      s.vx = clamp(Math.abs(s.vx) * chosen + chosen * bounce * .20, -BALANCE.sideBounceMax, BALANCE.sideBounceMax);
      s.vy *= .88;
    } else if (collision.ny > .35) {
      s.vy = Math.abs(s.vy) * .28;
    }

    addAbilityCharge({ soft: 1.4, dense: 2.0, hard: 2.8, reinforced: 3.6, ore: 2.4, special: 2.0 }[block.tier] || 2);

    impact(block.special === 'spring'
      ? `ПРУЖИНА · −${round1(massLoss)}`
      : block.special === 'boss'
        ? `СТРАЖ НЕДР · −${round1(massLoss)} · ${Math.ceil(block.hp)} HP`
        : block.hazard
          ? `ОПАСНЫЙ БЛОК · −${round1(massLoss)} · ${Math.ceil(block.hp)} HP`
          : `РИКОШЕТ · −${round1(massLoss)} · ${Math.ceil(block.hp)} HP`);
    sound(block.special === 'spring' ? 'bounce' : block.hazard || block.special === 'boss' ? 'hitHard' : 'hit');
    createDebris(block, 3, false);

    if (run.mass <= 0 && !tryRevive()) endRun(false, 'У слайма закончилось здоровье');
    return true;
  }

  function slideFrozenSlime(block, collision, timestamp) {
    const s = run.slime;
    s.x += collision.nx * (collision.penetration + 3.5);
    s.y += collision.ny * (collision.penetration + 3.5);
    if (collision.ny < -.35) {
      const centerOffset = s.x - (block.x + block.w / 2);
      const direction = Math.abs(centerOffset) > 4 ? Math.sign(centerOffset) : (Math.sign(s.vx) || (Math.random() < .5 ? -1 : 1));
      s.vx = direction * clamp(Math.max(150, Math.abs(s.vx) * .72), 150, 235);
      s.vy = Math.max(135, Math.abs(s.vy) * .7);
      s.x += direction * 4;
    } else if (Math.abs(collision.nx) > .45) {
      s.vx = collision.nx * clamp(Math.max(58, Math.abs(s.vx) * .3), 58, 130);
      s.vy = Math.max(145, s.vy * .94);
    } else {
      s.vy = Math.max(150, Math.abs(s.vy) * .82);
      s.vx *= .72;
    }
    run.flightDistance *= .9;
    run.shake = Math.max(run.shake, 2.6);
    if (timestamp - run.lastFrozenImpactAt > 360) {
      run.lastFrozenImpactAt = timestamp;
      impact(`ЗАМОРОЗКА · НЕУЯЗВИМОСТЬ · ${Math.max(.1, (run.freezeUntil - timestamp) / 1000).toFixed(1)}с`);
      sound('hitHard');
    }
  }

  function activateSpring(block, collision, timestamp) {
    const s = run.slime;
    const impactSpeed = Math.max(180, Math.hypot(s.vx, s.vy));
    const configuredPush = GAME_BALANCE?.special?.spring?.push || 1.35;
    const push = clamp((385 + impactSpeed * .68) * configuredPush / 1.35, 210, 960);
    const nx = Math.abs(collision.nx) + Math.abs(collision.ny) > .1 ? collision.nx : 0;
    const ny = Math.abs(collision.nx) + Math.abs(collision.ny) > .1 ? collision.ny : -1;

    // Push directly away from the side the slime touched, then remove the
    // spring immediately so it can never trigger twice.
    s.x += nx * (collision.penetration + 7);
    s.y += ny * (collision.penetration + 7);
    s.vx = clamp(s.vx * .16 + nx * push, -560, 560);
    s.vy = clamp(s.vy * .16 + ny * push, -600, 600);
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.flightDistance = 0;
    preserveCombo(timestamp);
    run.bounceGraceUntil = timestamp + BALANCE.bounceGraceMs + 110;
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 480;
    run.shake = Math.max(run.shake, 6.5);
    block.hp = 0;
    destroyBlock(block);
    spawnSpecialBurst('spring', block.x + block.w / 2, block.y + block.h / 2, nx, ny);
    impact('ПРУЖИНА · СУПЕР-ТОЛЧОК!');
    sound('bounce');
    feedback([10, 24, 10]);
    return true;
  }

  function chooseBounceDirection(block) {
    const leftScore = scoreLandingSide(block.row, block.col - 1);
    const rightScore = scoreLandingSide(block.row, block.col + 1);
    if (Math.random() < .14) return Math.random() < .5 ? -1 : 1;
    if (Math.abs(leftScore - rightScore) < .12) return run.slime.x < block.x + block.w / 2 ? -1 : 1;
    return leftScore < rightScore ? -1 : 1;
  }

  function tryRevive() {
    if (run.effects.rainbowHeart && !run.rainbowHeartUsed) {
      run.rainbowHeartUsed = true;
      run.mass = Math.max(1, run.maxMass * .30);
      run.massFlash = 1;
      run.massFlashTime = .75;
      run.slime.vy = 150;
      explodeAt(run.slime.x, run.slime.y, 125, .35);
      impact('СЕРДЦЕ РАДУГИ: ВОЗРОЖДЕНИЕ!');
      return true;
    }
    if (!run.effects.smallRevive || run.revived) return false;
    run.revived = true;
    run.mass = Math.max(1, run.maxMass * .12);
    run.massFlash = 1;
    run.massFlashTime = .75;
    run.slime.vy = 150;
    explodeAt(run.slime.x, run.slime.y, 105, .30);
    impact('ФЕНИКС: ВОЗРОЖДЕНИЕ!');
    return true;
  }

  function scoreLandingSide(row, col) {
    let score = 0;
    let count = 0;
    for (let r = row + 1; r <= row + 3; r += 1) {
      for (let c = col - 1; c <= col + 1; c += 1) {
        const block = run.blocks.find(item => !item.dead && item.row === r && item.col === c);
        if (!block) continue;
        score += block.hp / Math.max(1, run.world.expectedDamage);
        if (['gel', 'bomb', 'appleMint', 'appleRed'].includes(block.special)) score -= .75;
        if (block.tier === 'reinforced') score += .7;
        count += 1;
      }
    }
    return count ? score / count : 10;
  }

  function addAbilityCharge(amount) {
    if (!run || run.ended || run.abilityTime > 0 || run.abilityCooldown > 0) return;
    run.abilityCharge = clamp(run.abilityCharge + amount * run.abilityChargeMultiplier, 0, 100);
  }

  function registerComboLayer(row, timestamp = performance.now()) {
    if (!run || run.ended) return { registered: false, multiplierChanged: false };
    if (run.comboCount > 0 && timestamp > run.comboGraceUntil) resetCombo();
    run.comboGraceUntil = timestamp + 1000;
    if (run.comboRows.has(row)) return { registered: false, multiplierChanged: false };
    run.comboRows.add(row);
    run.comboCount += 1;
    const previousMultiplier = run.comboMultiplier;
    run.comboMultiplier = Math.min(15, Math.max(1, Math.floor(run.comboCount / 2)));
    return {
      registered: true,
      multiplierChanged: run.comboCount === 2 || run.comboMultiplier > previousMultiplier
    };
  }

  function preserveCombo(timestamp = performance.now()) {
    if (!run || run.ended || run.comboCount <= 0) return;
    run.comboGraceUntil = timestamp + 1000;
  }

  function resetCombo() {
    if (!run) return;
    run.comboCount = 0;
    run.comboMultiplier = 1;
    run.comboRows.clear();
    run.comboGraceUntil = 0;
  }

  function destroyBlock(block) {
    block.dead = true;
    run.blocksDestroyed += 1;
    const reward = block.coins * run.comboMultiplier * run.coinMultiplier;
    run.coins += reward;
    addAbilityCharge({ soft: 2.2, dense: 3.1, hard: 4.2, reinforced: 5.2, ore: 4.0, special: 3.0 }[block.tier] || 2.5);
    createDebris(block, block.special === 'geyser' ? 0 : block.special === 'bomb' ? 8 : block.special === 'appleRed' ? 10 : 9, true);

    if (block.tier === 'ore' || block.frozenOre) {
      const ore = block.oreType || ORE_TYPES[0];
      const oreReward = Math.round(reward);
      if (run.effects.oreHeal) healRun(Math.max(2, run.maxMass * .035), ore.label);
      else impact(`${ore.label} +${oreReward}`);
    } else if (block.special === 'coin') {
      if (run.effects.oreHeal) healRun(Math.max(2, run.maxMass * .03), 'ЗОЛОТОЙ ПИР');
      else impact('БЛОК РАЗРУШЕН');
    } else if (block.special === 'gel') {
      spawnSpecialBurst('heal', block.x + block.w / 2, block.y + block.h / 2);
      const multiplier = run.effects.healBoost ? 2 : 1;
      const configuredHeal = GAME_BALANCE?.special?.heal?.amount;
      const heal = Math.max(1, Math.round((configuredHeal ?? (run.maxMass * .16 + run.worldId)) * multiplier));
      healRun(heal, run.effects.healBoost ? 'КОРОЛЕВСКОЕ ЛЕЧЕНИЕ' : 'ЛЕЧЕНИЕ');
    } else if (block.special === 'appleMint') {
      activateMintApple(block);
    } else if (block.special === 'appleRed') {
      activateRedApple(block);
    } else if (block.special === 'meteor') {
      activateMeteorShower(block);
    } else if (block.special === 'spring') {
      addAbilityCharge(5);
      impact('ПРУЖИНА СЛОМАНА!');
    } else if (block.special === 'cryo') {
      weakenCryoArea4x4(block);
    } else if (block.special === 'snowflake') {
      activateSnowflakeFreeze(block);
    } else if (block.special === 'bomb') {
      explodeBomb(block);
    } else if (block.special === 'boss') {
      run.shake = Math.max(run.shake, 10);
      impact('СТРАЖ НЕДР ПОБЕЖДЁН!');
      sound('epic');
    }
  }

  function activateMintApple(source) {
    const settings = GAME_BALANCE?.special?.appleMint || {};
    const sizeChange = clamp((settings.size ?? -20) / 100, -.5, 0);
    const defenseBoost = clamp((settings.defense ?? 20) / 100, 0, 1);
    const bounceBoost = clamp((settings.bounce ?? 20) / 100, 0, 1);
    run.sizeMultiplier = clamp((run.sizeMultiplier || 1) * (1 + sizeChange), .62, 2.25);
    run.defense = clamp(run.defense + defenseBoost, 0, .85);
    run.elasticity = clamp(run.elasticity + bounceBoost, .85, 2.6);
    const timestamp = performance.now();
    run.appleGlowUntil = timestamp + 1450;
    run.appleGlowType = 'mint';
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 1050;
    run.shake = Math.max(run.shake, 4.5);
    spawnSpecialBurst('appleMint', source.x + source.w / 2, source.y + source.h / 2);
    impact(`МЯТНОЕ ЯБЛОКО · ${Math.round(sizeChange * 100)}% РАЗМЕР · +${Math.round(bounceBoost * 100)}% ОТСКОК`);
    sound('happy');
    feedback([6, 10, 6, 14]);
  }

  function activateRedApple(source) {
    const settings = GAME_BALANCE?.special?.appleRed || {};
    const sizeBoost = clamp((settings.size ?? 50) / 100, 0, 1);
    const powerBoost = clamp((settings.power ?? 20) / 100, 0, 1);
    const defenseBoost = clamp((settings.defense ?? 20) / 100, 0, 1);
    run.sizeMultiplier = clamp((run.sizeMultiplier || 1) * (1 + sizeBoost), .62, 2.25);
    run.power = Math.min(12, run.power * (1 + powerBoost));
    run.defense = clamp(run.defense + defenseBoost, 0, .85);
    const timestamp = performance.now();
    run.appleGlowUntil = timestamp + 1650;
    run.appleGlowType = 'red';
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 1150;
    run.shake = Math.max(run.shake, 6);
    spawnSpecialBurst('appleRed', source.x + source.w / 2, source.y + source.h / 2);
    impact(`КРАСНОЕ ЯБЛОКО · +${Math.round(sizeBoost * 100)}% РОСТ · +${Math.round(powerBoost * 100)}% УРОН`);
    sound('epic');
    feedback([9, 14, 9, 18]);
  }

  function weakenCryoArea4x4(source) {
    // Чётная область не имеет одной центральной клетки, поэтому крио-блок
    // занимает верхнюю левую из четырёх центральных позиций. Две строки зоны
    // остаются впереди по ходу падения — эффект всегда помогает продолжить путь.
    const rowStart = source.row - 1;
    const colStart = source.col - 1;
    let weakened = 0;
    for (const block of run.blocks) {
      if (block.dead || block === source || block.special) continue;
      if (block.row < rowStart || block.row >= rowStart + 4 || block.col < colStart || block.col >= colStart + 4) continue;
      const easyHp = blockHpForTier('dense', run.world, 0, block.row, block.col, true);
      block.frozenOre = block.frozenOre || block.tier === 'ore';
      block.tier = 'dense';
      block.material = 'iceLight';
      block.hazard = false;
      block.hazardVariant = null;
      block.frozen = true;
      block.editorVisualId = '';
      block.maxHp = Math.min(block.maxHp, easyHp);
      block.hp = Math.min(block.hp, block.maxHp);
      createDebris(block, 3, false);
      weakened += 1;
    }
    spawnSpecialBurst('cryo', source.x + source.w / 2, source.y + source.h / 2);
    run.shake = Math.max(run.shake, 7);
    impact(`КРИО-ВОЛНА 4×4 · ОСЛАБЛЕНО ${weakened}`);
    sound('epic');
    feedback([12, 20, 10]);
  }

  function activateSnowflakeFreeze(source) {
    const timestamp = performance.now();
    const durationSeconds = GAME_BALANCE?.special?.snowflake?.duration || 3;
    const durationMs = durationSeconds * 1000;
    run.freezeUntil = timestamp + durationMs;
    run.frozenEmotion = 'surprised';
    run.slime.vx *= .62;
    run.slime.vy = Math.max(155, run.slime.vy);
    run.massFlash = 1;
    run.massFlashTime = .65;
    run.shake = Math.max(run.shake, 5.5);
    spawnSpecialBurst('snowflake', source.x + source.w / 2, source.y + source.h / 2);
    impact(`СНЕЖИНКА · ЗАМОРОЗКА И НЕУЯЗВИМОСТЬ · ${durationSeconds}с`);
    sound('epic');
    feedback([8, 14, 8, 18]);
  }

  function activateMeteorShower(source) {
    const settings = GAME_BALANCE?.special?.meteor || {};
    const minCount = clamp(Math.round(settings.minCount ?? 3), 3, 4);
    const maxCount = clamp(Math.round(settings.maxCount ?? 4), minCount, 4);
    const count = Math.floor(rand(minCount, maxCount + .999));
    const delayMs = clamp(settings.delay ?? .42, .28, .7) * 1000;
    const startRow = Math.max(source.row + 3, Math.floor((run.slime.y - 190) / run.cellSize) + 3);
    const maxRow = Math.max(startRow, Math.max(...run.blocks.map(block => block.row)) - 1);
    const firstRow = Math.min(startRow, maxRow);
    const safeMinCol = run.columns > 2 ? 1 : 0;
    const safeMaxCol = run.columns > 2 ? run.columns - 2 : run.columns - 1;
    const used = new Set();
    let previousCol = clamp(source.col, safeMinCol, safeMaxCol);
    let targetRow = firstRow;
    const now = performance.now();
    const strikes = Array.from({ length: count }, (_, index) => {
      if (index) targetRow = Math.min(maxRow, targetRow + 2 + Math.floor(Math.random() * 2));
      const row = clamp(targetRow, 1, maxRow);
      const candidates = Array.from({ length: Math.max(1, safeMaxCol - safeMinCol + 1) }, (_, offset) => safeMinCol + offset)
        .filter(col => !used.has(`${row}:${col}`));
      const varied = candidates.filter(col => Math.abs(col - previousCol) >= 2);
      const pool = varied.length ? varied : candidates.length ? candidates : [previousCol];
      const col = pool[Math.floor(Math.random() * pool.length)];
      previousCol = col;
      used.add(`${row}:${col}`);
      const impactAt = now + 520 + index * delayMs;
      return {
        row, col,
        x: run.gridOffsetX + col * run.cellSize + run.cellSize / 2,
        y: 190 + row * run.cellSize + run.cellSize / 2,
        warnedAt: impactAt - 420,
        fallAt: impactAt - 250,
        impactAt,
        phase: 'waiting',
        impactedAt: 0,
        destroyed: 0,
        angle: rand(-.08, .08)
      };
    });
    run.meteorShowers.push({ strikes, createdAt: now });
    preserveCombo(now);
    run.shake = Math.max(run.shake, 4.8);
    impact(`МЕТЕОРИТНЫЙ ДОЖДЬ · ${count} УДАРА`);
    sound('epic');
    feedback([12, 18, 10]);
  }

  function destroyMeteorGrid(row, col) {
    let destroyed = 0;
    for (const block of run.blocks) {
      if (block.dead || Math.abs(block.row - row) > 1 || Math.abs(block.col - col) > 1) continue;
      block.dead = true;
      run.blocksDestroyed += 1;
      run.coins += block.coins * .6 * run.coinMultiplier;
      createDebris(block, 6, true);
      destroyed += 1;
    }
    run.shake = Math.max(run.shake, 13.5);
    return destroyed;
  }

  function updateMeteorShowers(timestamp) {
    if (!run?.meteorShowers?.length) return;
    for (const shower of run.meteorShowers) {
      for (const strike of shower.strikes) {
        if (!strike.impactedAt && timestamp >= strike.impactAt) {
          strike.phase = 'impact';
          strike.impactedAt = timestamp;
          strike.destroyed = destroyMeteorGrid(strike.row, strike.col);
          spawnMeteorImpactParticles(strike.x, strike.y);
          preserveCombo(timestamp);
          sound('epic');
          feedback([14, 24, 9]);
        } else if (!strike.impactedAt && timestamp >= strike.fallAt) strike.phase = 'falling';
        else if (!strike.impactedAt && timestamp >= strike.warnedAt) strike.phase = 'warning';
      }
    }
    run.meteorShowers = run.meteorShowers.filter(shower => shower.strikes.some(strike => !strike.impactedAt || timestamp - strike.impactedAt < 760));
  }

  function spawnMeteorImpactParticles(x, y) {
    const colors = ['#fff2a3', '#ffd23d', '#ff832d', '#db3d26', '#4b3030'];
    const particleCount = scaledEffectCount(16, 9);
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.PI * 2 * index / particleCount + rand(-.16, .16);
      const speed = rand(105, 255);
      run.particles.push({
        kind: 'special', x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 45,
        gravity: 260,
        life: rand(.38, .72), maxLife: .72,
        size: rand(2.5, 6.5), color: colors[index % colors.length],
        shape: index % 4 === 0 ? 'streak' : 'orb'
      });
    }
    if (run.particles.length > 240) run.particles.splice(0, run.particles.length - 240);
  }

  function healRun(amount, label = 'ЛЕЧЕНИЕ') {
    const before = run.mass;
    run.mass = Math.min(run.maxMass, run.mass + amount);
    const healed = Math.max(0, run.mass - before);
    const timestamp = performance.now();
    run.massFlash = 1;
    run.massFlashTime = .58;
    run.healGlowUntil = timestamp + 980;
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 720;
    impact(healed > 0 ? `${label} · +${Math.ceil(healed)} ЗДОРОВЬЯ` : `${label} · ЗДОРОВЬЕ ПОЛНОЕ`);
    sound('happy');
    feedback([7, 12, 7]);
  }

  function explodeAt(x, y, radius = 125, rewardScale = .6, damage = Infinity, collectChainBombs = false) {
    let destroyed = 0;
    const chainBombs = [];
    for (const block of run.blocks) {
      if (block.dead) continue;
      const dx = block.x + block.w / 2 - x;
      const dy = block.y + block.h / 2 - y;
      const distance = Math.hypot(dx, dy);
      if (distance < radius) {
        const appliedDamage = damage === Infinity ? Infinity : damage * (1 - distance / radius * .45);
        if (block.hp > appliedDamage) {
          block.hp = Math.max(.05, block.hp - appliedDamage);
          createDebris(block, 3, false);
          continue;
        }
        block.dead = true;
        run.blocksDestroyed += 1;
        run.coins += block.coins * rewardScale * run.coinMultiplier;
        createDebris(block, 5, true);
        if (collectChainBombs && block.special === 'bomb') chainBombs.push(block);
        destroyed += 1;
      }
    }
    run.shake = Math.max(run.shake, 8.5);
    return { destroyed, chainBombs };
  }

  function explodeGridArea(source, radiusCells = 1, rewardScale = .6, collectChainBombs = false) {
    let destroyed = 0;
    const chainBombs = [];
    for (const block of run.blocks) {
      if (block.dead || block === source) continue;
      if (Math.abs(block.row - source.row) > radiusCells || Math.abs(block.col - source.col) > radiusCells) continue;
      block.dead = true;
      run.blocksDestroyed += 1;
      run.coins += block.coins * rewardScale * run.coinMultiplier;
      createDebris(block, 5, true);
      if (collectChainBombs && block.special === 'bomb') chainBombs.push(block);
      destroyed += 1;
    }
    run.shake = Math.max(run.shake, 11);
    return { destroyed, chainBombs };
  }

  function explodeBomb(source, chainDepth = 0, announce = true) {
    const radius = GAME_BALANCE?.special?.bomb?.radius || 125;
    const damage = GAME_BALANCE?.special?.bomb?.damage || 45;
    const scale = chainDepth ? .9 : 1;
    const x = source.x + source.w / 2;
    const y = source.y + source.h / 2;
    spawnSpecialBurst('bomb', x, y);
    // В первом мире динамит всегда покрывает ровный квадрат 3×3:
    // сам блок и по одной соседней клетке с каждой стороны.
    const result = run.worldId === 1
      ? explodeGridArea(source, 1, .6, chainDepth < 3)
      : explodeAt(x, y, radius * scale, .6, damage * scale, chainDepth < 3);
    let destroyed = result.destroyed;
    let blasts = 1;
    for (const chainedBomb of result.chainBombs) {
      const chainResult = explodeBomb(chainedBomb, chainDepth + 1, false);
      destroyed += chainResult.destroyed;
      blasts += chainResult.blasts;
    }
    if (announce) {
      impact(blasts > 1
        ? `ЦЕПНАЯ РЕАКЦИЯ · ${blasts} ВЗРЫВА · ×${Math.max(1, destroyed)}`
        : `БА-БАХ · ×${Math.max(1, destroyed)}`);
      sound('epic');
      feedback(blasts > 1 ? [18, 30, 14, 24] : [16, 26, 12]);
    }
    return { destroyed, blasts };
  }

  function createDebris(block, count, strong) {
    const color = materialColor(block.material, run.world, 0);
    const particleCount = scaledEffectCount(count, 2);
    for (let i = 0; i < particleCount; i += 1) {
      run.particles.push({
        x: block.x + rand(0, block.w), y: block.y + rand(0, block.h),
        vx: rand(-120, 120) * (strong ? 1.25 : .75), vy: rand(-170, 30) * (strong ? 1.2 : .8),
        life: rand(.35, .78), maxLife: .78, size: rand(3, 8), color
      });
    }
    if (run.particles.length > 180) run.particles.splice(0, run.particles.length - 180);
  }

  function spawnPortalBurst(x, y) {
    const palettes = {
      1: ['#67f5dc', '#bfffee', '#fff2a8', '#ffffff'],
      2: ['#54dfff', '#bdefff', '#eefcff', '#ffffff'],
      3: ['#ff75ba', '#8af0df', '#fff0a0', '#ffffff'],
      4: ['#ff6b35', '#ffbd55', '#ffe68c', '#ffffff']
    };
    const colors = palettes[run.worldId] || palettes[1];
    const particleCount = scaledEffectCount(30, 16);
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.PI * 2 * i / particleCount + rand(-.14, .14);
      const radius = rand(62, 132);
      run.particles.push({
        kind: 'portal', suction: true, centerX: x, centerY: y, angle, radius,
        x: x + Math.cos(angle) * radius, y: y + Math.sin(angle) * radius,
        vx: -Math.sin(angle) * 80, vy: Math.cos(angle) * 80,
        angularSpeed: rand(5.2, 8.6) * (i % 2 ? 1 : -1), pullSpeed: rand(92, 158),
        gravity: 0, life: rand(.62, .88), maxLife: .88,
        size: rand(2.5, 6.5), color: colors[i % colors.length], shape: i % 4 === 0 ? 'streak' : 'orb'
      });
    }
    if (run.particles.length > 210) run.particles.splice(0, run.particles.length - 210);
  }

  function updateParticles(dt) {
    if (!run) return;
    for (const p of run.particles) {
      if (p.kind === 'portal' && p.suction) {
        const previousX = p.x;
        const previousY = p.y;
        p.angle += p.angularSpeed * dt;
        p.radius = Math.max(0, p.radius - p.pullSpeed * dt * (1.12 + (1 - p.life / p.maxLife) * .8));
        p.x = p.centerX + Math.cos(p.angle) * p.radius;
        p.y = p.centerY + Math.sin(p.angle) * p.radius * .76;
        p.vx = (p.x - previousX) / Math.max(.001, dt);
        p.vy = (p.y - previousY) / Math.max(.001, dt);
        p.size = Math.max(.8, p.size * Math.pow(.32, dt));
      } else {
        p.vy += (p.gravity ?? 470) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      if (p.kind === 'portal' && !p.suction) {
        p.vx *= Math.max(0, 1 - dt * 2.8);
        p.vy *= Math.max(0, 1 - dt * 2.8);
      }
      p.life -= dt;
    }
    run.particles = run.particles.filter(p => p.life > 0);
  }

  // ===== ЭФФЕКТЫ СПЕЦИАЛЬНЫХ БЛОКОВ =====
  function spawnSpecialBurst(type, x, y, nx = 0, ny = -1) {
    if (!run) return;
    const config = {
      spring: { colors: ['#efffff', '#62efff', '#1ec8ff', '#ffffff'], count: 11, life: .82 },
      bomb: { colors: ['#fff7c7', '#ffd65a', '#ff8a3d', '#f34e56'], count: 20, life: .9 },
      heal: { colors: ['#effff4', '#8dffba', '#31d98b', '#ffffff'], count: 8, life: .9 },
      cryo: { colors: ['#effcff', '#a9efff', '#54cfff', '#ffffff'], count: 8, life: 1.05 },
      snowflake: { colors: ['#ffffff', '#c7f6ff', '#73dcff', '#3ba9ed'], count: 8, life: 1.1 },
      appleMint: { colors: ['#f1fff9', '#a9ffe8', '#45e3b5', '#ffffff'], count: 10, life: 1.28 },
      appleRed: { colors: ['#fff4bb', '#ffc54f', '#ff526d', '#ffffff'], count: 12, life: 1.45 },
      geyser: { colors: ['#fff4d0', '#ffbd45', '#ff6a2b', '#d9d9d4'], count: 4, life: .68 },
    }[type];
    if (!config) return;
    run.specialEffects.push({
      type, x, y, nx, ny, life: config.life, maxLife: config.life
    });
    const particleCount = scaledEffectCount(config.count, 4);
    for (let i = 0; i < particleCount; i += 1) {
      const bombSmoke = type === 'bomb' && i >= Math.ceil(particleCount * .7);
      const angle = type === 'spring' || type === 'geyser'
        ? Math.atan2(ny, nx) + rand(-.58, .58)
        : Math.PI * 2 * i / particleCount + rand(-.16, .16);
      const speed = type === 'bomb'
        ? (bombSmoke ? rand(32, 72) : rand(155, 265))
        : type === 'spring'
          ? rand(210, 345)
          : type === 'geyser'
            ? rand(105, 185)
              : rand(55, 145);
      run.particles.push({
        kind: 'special', x, y,
        vx: bombSmoke ? rand(-52, 52) : Math.cos(angle) * speed,
        vy: bombSmoke ? rand(-88, -34) : Math.sin(angle) * speed,
        gravity: bombSmoke ? -12 : type === 'bomb' ? 145 : type === 'heal' ? -42 : type === 'appleMint' ? -18 : type === 'appleRed' ? 52 : type === 'snowflake' ? 18 : type === 'geyser' ? -10 : 32,
        life: bombSmoke ? rand(.48, .7) : rand(config.life * .66, config.life), maxLife: config.life,
        size: bombSmoke ? rand(7, 11) : rand(2.5, type === 'bomb' ? 6.2 : 6),
        color: bombSmoke ? ['#4f3b46', '#76505a', '#a8675b'][i % 3] : config.colors[i % config.colors.length],
        shape: bombSmoke
          ? 'smoke'
          : type === 'bomb' && i % 3 === 0
            ? 'streak'
          : type === 'heal' && i % 3 === 0
          ? 'plus'
          : type === 'geyser' && i % 4 === 0
            ? 'smoke'
          : type === 'geyser' && i % 3 === 0
            ? 'streak'
          : type === 'snowflake' && i % 4 === 0
                ? 'flake'
                : type === 'appleMint' && i % 3 === 0
                  ? 'leaf'
                  : 'orb'
      });
    }
    if (run.specialEffects.length > 16) run.specialEffects.shift();
    if (run.particles.length > 240) run.particles.splice(0, run.particles.length - 240);
  }

  function updateSpecialEffects(dt) {
    if (!run?.specialEffects) return;
    for (const effect of run.specialEffects) effect.life -= dt;
    run.specialEffects = run.specialEffects.filter(effect => effect.life > 0);
  }

  function activateAbility() {
    if (!run || run.ended || run.abilityCharge < 100 || run.abilityTime > 0 || run.abilityCooldown > 0) return;
    run.abilityCharge = 0;
    run.abilityTime = BALANCE.abilityDuration;
    run.abilityCooldown = run.abilityCooldownMax;
    run.slime.vy += 125;
    sound('epic');
    feedback([14, 22, 14]);
    impact('ЖЕЛЕ-ИМПУЛЬС!');
    updateRunUI();
  }

  function updateRunUI() {
    if (!run) return;
    const currentDepth = Math.max(0, Math.floor(run.maxDepth));
    const targetDepth = Math.max(1, run.world.targetDepth);
    const segmentDepth = run.endless ? Math.max(0, currentDepth - (run.endlessDepthOffset || 0)) : currentDepth;
    const routeRatio = clamp(segmentDepth / targetDepth, 0, 1);
    const routePosition = 3 + routeRatio * 94;
    const previousBest = Math.min(targetDepth, Math.max(0, run.previousBest || 0));
    const bestRatio = clamp(previousBest / targetDepth, 0, 1);
    const bestPosition = clamp(3 + bestRatio * 94, 3, 90);
    els.depthLabel.textContent = `${currentDepth} М`;
    if (els.runCoinsGain) {
      const earnedCoins = Math.max(0, Math.floor(run.coins));
      els.runCoinsGain.textContent = `+${formatCompactNumber(earnedCoins)}`;
      els.runCoinsGain.title = `За забег: +${earnedCoins.toLocaleString('ru-RU')}`;
    }
    els.routeProgress.style.width = `${routePosition}%`;
    els.routeSlimeMarker.style.left = `${routePosition}%`;
    els.routeTargetLabel.textContent = run.endless ? `∞ · КРУГ ${run.endlessLap}` : `${targetDepth} М`;
    els.routeBestLabel.textContent = previousBest > 0 ? `ПРОШЛЫЙ ${previousBest} М` : 'ПЕРВЫЙ ЗАБЕГ';
    els.routeBestMarker.style.left = `${bestPosition}%`;
    els.routeBestMarker.classList.toggle('hidden', run.endless || previousBest <= 0);
    els.runMassLabel.textContent = `${Math.max(0, Math.ceil(run.mass))}/${Math.ceil(run.maxMass)}`;
    els.runHealthBar.style.width = `${clamp(run.mass / Math.max(1, run.maxMass) * 100, 0, 100)}%`;
    els.runHealthBar.closest('.shaft-health')?.classList.toggle('is-low', run.mass / Math.max(1, run.maxMass) <= .3);
    const charge = clamp(Math.round(run.abilityCharge), 0, 100);
    if (run.abilityTime > 0) {
      els.abilityPercent.textContent = `${run.abilityTime.toFixed(1)}с`;
      els.abilityBtn.style.setProperty('--ability', '100%');
      els.abilityBtn.disabled = true;
      els.abilityText.textContent = 'Усиление активно · заряд временно не копится';
    } else if (run.abilityCooldown > 0) {
      const ready = clamp((1 - run.abilityCooldown / run.abilityCooldownMax) * 100, 0, 100);
      els.abilityPercent.textContent = `${run.abilityCooldown.toFixed(1)}с`;
      els.abilityBtn.style.setProperty('--ability', `${ready}%`);
      els.abilityBtn.disabled = true;
      els.abilityText.textContent = 'Перезарядка · заряд не накапливается';
    } else {
      els.abilityPercent.textContent = `${charge}%`;
      els.abilityBtn.style.setProperty('--ability', `${charge}%`);
      els.abilityBtn.disabled = charge < 100 || run.ended;
      els.abilityText.textContent = 'Заряжается от разрушений и настоящих рикошетов';
    }
  }

  // ===== CANVAS-РЕНДЕР МИРА =====
  function renderCanvas(timestamp) {
    const world = run.world;
    const shakeX = run.shake ? rand(-run.shake, run.shake) : 0;
    const shakeY = run.shake ? rand(-run.shake * .5, run.shake * .5) : 0;
    ctx.save();
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.translate(shakeX, shakeY);

    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, world.earth);
    gradient.addColorStop(1, world.deep);
    ctx.fillStyle = gradient;
    ctx.fillRect(-15, -15, VIEW_W + 30, VIEW_H + 30);

    drawBackground(world);
    drawFinishPortal(world, timestamp);

    for (const block of run.blocks) {
      if (block.dead) continue;
      const sy = block.y - run.cameraY;
      if (sy < -60 || sy > VIEW_H + 60) continue;
      drawBlock(block, sy, timestamp);
    }

    // A thin shared grid keeps every tile aligned without blending their art.
    drawBlockTransitions();
    drawGeyserCapture(timestamp);
    drawMeteorShowers(timestamp);
    drawSpecialEffects(false);

    for (const p of run.particles) {
      const sy = p.y - run.cameraY;
      if (sy < -30 || sy > VIEW_H + 30) continue;
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      if (p.kind === 'portal' || p.kind === 'special') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.shape === 'smoke' ? 0 : p.kind === 'portal' ? 9 : 6;
        if (p.shape === 'smoke') {
          ctx.globalAlpha *= .38;
          ctx.beginPath();
          ctx.ellipse(p.x, sy, p.size * 1.12, p.size * .78, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'plus') {
          ctx.globalAlpha *= .94;
          ctx.fillRect(p.x - p.size * .28, sy - p.size, p.size * .56, p.size * 2);
          ctx.fillRect(p.x - p.size, sy - p.size * .28, p.size * 2, p.size * .56);
        } else if (p.shape === 'streak') {
          const speed = Math.max(1, Math.hypot(p.vx, p.vy));
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.5, p.size * .55);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, sy);
          ctx.lineTo(p.x - p.vx / speed * p.size * 2.8, sy - p.vy / speed * p.size * 2.8);
          ctx.stroke();
        } else if (p.shape === 'leaf') {
          ctx.save();
          ctx.translate(p.x, sy);
          ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * .62, p.size * 1.18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha *= .72;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(.8, p.size * .14);
          ctx.beginPath(); ctx.moveTo(0, -p.size * .75); ctx.lineTo(0, p.size * .75); ctx.stroke();
          ctx.restore();
        } else if (p.shape === 'flake') {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1, p.size * .28);
          for (let arm = 0; arm < 3; arm += 1) {
            const angle = arm * Math.PI / 3;
            ctx.beginPath();
            ctx.moveTo(p.x - Math.cos(angle) * p.size, sy - Math.sin(angle) * p.size);
            ctx.lineTo(p.x + Math.cos(angle) * p.size, sy + Math.sin(angle) * p.size);
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.arc(p.x, sy, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      } else {
        ctx.fillRect(p.x, sy, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    drawSelectedTrail(timestamp);
    drawSlime(timestamp);
    // Size-change arrows must stay above the slime. A large red-apple slime
    // previously covered most of the effect when it was rendered with blocks.
    drawSpecialEffects(true);
    ctx.restore();
  }

  function drawSelectedTrail(timestamp) {
    if (save.selectedTrail === 'none' || !run?.trailPoints?.length) return;
    const points = run.trailPoints;
    const trail = TRAILS.find(item => item.id === save.selectedTrail) || TRAILS[0];
    const effect = trail.effect || 'jelly';
    const ordered = [...points].sort((a, b) => a.life - b.life);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (effect === 'bubbles') {
      points.forEach((point, index) => {
        const age = 1 - clamp(point.life / point.maxLife, 0, 1);
        const fadeIn = clamp((1 - age) * 5, 0, 1);
        const fadeOut = clamp(age / .28, 0, 1);
        const alpha = fadeIn * fadeOut;
        if (alpha <= .02) return;
        const size = point.size * (.78 + age * .38);
        const x = point.x + Math.sin(point.phase + timestamp / 560) * (2 + age * 3);
        const y = point.y - run.cameraY - age * (3 + index % 3);
        const bubble = ctx.createRadialGradient(x - size * .32, y - size * .38, size * .05, x, y, size);
        bubble.addColorStop(0, `rgba(255,255,255,${alpha * .98})`);
        bubble.addColorStop(.22, `rgba(145,238,255,${alpha * .12})`);
        bubble.addColorStop(.63, `rgba(239,166,255,${alpha * .1})`);
        bubble.addColorStop(.86, `rgba(97,207,255,${alpha * .08})`);
        bubble.addColorStop(1, `rgba(83,109,225,${alpha * .48})`);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = bubble;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(115,127,225,${alpha * .72})`;
        ctx.lineWidth = Math.max(.8, size * .09);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${alpha * .9})`;
        ctx.beginPath();
        ctx.arc(x - size * .34, y - size * .37, Math.max(.8, size * .14), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      return;
    }
    const tail = ordered[0];
    const head = ordered[ordered.length - 1];
    if (points.length > 2 && effect !== 'rainbow') {
      const ribbon = ctx.createLinearGradient(tail.x, tail.y - run.cameraY, head.x, head.y - run.cameraY);
      const colors = trail.colors || ['rgba(255,64,75,0)', 'rgba(255,69,80,.38)', 'rgba(238,55,65,.9)'];
      ribbon.addColorStop(0, colors[0]);
      ribbon.addColorStop(.28, colors[1]);
      ribbon.addColorStop(1, colors[2]);
      ctx.strokeStyle = ribbon;
      ctx.globalAlpha = 1;
      ctx.shadowColor = trail.glow || '#ff5964';
      ctx.shadowBlur = effect === 'stars' ? 10 : effect === 'gold' ? 7 : effect === 'rainbow' ? 0 : 6;
      ordered.forEach((point, index) => {
        const y = point.y - run.cameraY;
        const progress = index / Math.max(1, ordered.length - 1);
        if (index === 0) return;
        ctx.lineWidth = Math.max(1.2, run.slime.radius * (.035 + progress * .625));
        ctx.beginPath();
        const previous = ordered[index - 1];
        ctx.moveTo(previous.x, previous.y - run.cameraY);
        ctx.lineTo(point.x, y);
        ctx.stroke();
      });
      if (effect === 'gold') {
        ctx.save();
        ctx.globalAlpha = .58;
        ctx.strokeStyle = '#fff8bd';
        ctx.shadowColor = '#fff2a1';
        ctx.shadowBlur = 7;
        ctx.lineWidth = Math.max(1.1, run.slime.radius * .12);
        ctx.setLineDash([Math.max(6, run.slime.radius * .85), Math.max(12, run.slime.radius * 2.5)]);
        ctx.lineDashOffset = -timestamp / 18;
        ctx.beginPath();
        ordered.forEach((point, index) => {
          if (!index) ctx.moveTo(point.x, point.y - run.cameraY - run.slime.radius * .12);
          else ctx.lineTo(point.x, point.y - run.cameraY - run.slime.radius * .12);
        });
        ctx.stroke();
        ctx.restore();
      }
    }
    if (effect === 'stars' && points.length > 2) {
      ctx.save();
      const spaceGradient = ctx.createLinearGradient(tail.x, tail.y - run.cameraY, head.x, head.y - run.cameraY);
      spaceGradient.addColorStop(0, 'rgba(20,13,72,0)');
      spaceGradient.addColorStop(.28, 'rgba(48,25,126,.62)');
      spaceGradient.addColorStop(.68, 'rgba(28,49,139,.86)');
      spaceGradient.addColorStop(1, 'rgba(15,19,75,.96)');
      ctx.strokeStyle = spaceGradient;
      ctx.shadowColor = '#674ee8';
      ctx.shadowBlur = 5;
      ordered.forEach((point, index) => {
        if (!index) return;
        const previous = ordered[index - 1];
        const progress = index / Math.max(1, ordered.length - 1);
        ctx.globalAlpha = .84;
        ctx.lineWidth = Math.max(2, run.slime.radius * (.12 + progress * .54));
        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y - run.cameraY);
        ctx.lineTo(point.x, point.y - run.cameraY);
        ctx.stroke();
      });
      ctx.restore();
    }
    if (effect === 'rainbow') {
      const stripeColors = ['#ef3340', '#ff8c1a', '#ffe027', '#38c95b', '#288cf4', '#7747d9'];
      const normalX = run.slime.vy === 0 ? 0 : -run.slime.vy / Math.max(1, Math.hypot(run.slime.vx, run.slime.vy));
      const normalY = run.slime.vx / Math.max(1, Math.hypot(run.slime.vx, run.slime.vy));
      stripeColors.forEach((color, stripe) => {
        ctx.strokeStyle = color;
        ctx.globalAlpha = .98;
        ctx.shadowBlur = 0;
        ctx.lineWidth = Math.max(1.35, run.slime.radius * .105);
        ctx.beginPath();
        ordered.forEach((point, index) => {
          const fade = index / Math.max(1, ordered.length - 1);
          const offset = (stripe - 2.5) * run.slime.radius * .09 * fade;
          const x = point.x + normalX * offset;
          const y = point.y - run.cameraY + normalY * offset;
          if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
    }
    if (effect === 'stars') points.forEach((point, index) => {
      const progress = clamp(point.life / point.maxLife, 0, 1);
      const cadence = 2;
      // The array index changes whenever an old trail point expires. A stable id
      // keeps every star's visibility, position and colour fixed for its lifetime.
      const particleId = Number.isFinite(point.id) ? point.id : index;
      if (particleId % cadence || progress < .16) return;
      const starOutside = effect === 'stars' && particleId % 4 === 0;
      const x = point.x + Math.sin(point.phase + timestamp / 230) * (starOutside ? point.size * 1.15 : 4);
      const y = point.y - run.cameraY + (starOutside ? Math.cos(point.phase) * point.size * 1.05 : 0);
      const pulse = effect === 'stars' ? .94 + Math.sin(timestamp / 620 + point.phase) * .06 : 1;
      const size = point.size * (.27 + progress * .39) * pulse;
      ctx.globalAlpha = progress * (.78 + Math.sin(timestamp / 760 + point.phase) * .08);
      ctx.fillStyle = particleId % 3 === 0 ? '#ffd928' : particleId % 3 === 1 ? '#fff078' : '#ffb91f';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(point.phase + timestamp / 720);
      ctx.beginPath();
      for (let tip = 0; tip < 8; tip += 1) {
        const radius = tip % 2 ? size * .38 : size;
        const angle = -Math.PI / 2 + tip * Math.PI / 4;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (tip === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    if (effect === 'gold') points.forEach((point, index) => {
      if (!point.sparkle) return;
      const progress = clamp(point.life / point.maxLife, 0, 1);
      const pulse = Math.max(0, Math.sin((1 - progress) * Math.PI * 2.2 + point.phase));
      if (pulse < .16) return;
      const previous = points[Math.max(0, index - 1)] || point;
      const dx = point.x - previous.x;
      const dy = point.y - previous.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const normalX = -dy / length;
      const normalY = dx / length;
      const offset = point.sparkleSide * (point.size * 1.25 + 5);
      const x = point.x + normalX * offset;
      const y = point.y - run.cameraY + normalY * offset;
      const size = point.size * (.2 + pulse * .34);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(point.phase * .25);
      ctx.globalAlpha = progress * pulse * .92;
      ctx.fillStyle = index % 2 ? '#fff4a6' : '#fffbdc';
      ctx.shadowColor = '#ffd42e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      for (let tip = 0; tip < 8; tip += 1) {
        const radius = tip % 2 ? size * .18 : size;
        const angle = -Math.PI / 2 + tip * Math.PI / 4;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (!tip) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawVfxSprite(name, x, y, width, height = width, alpha = 1, rotation = 0, scale = 1, flipX = false) {
    const sprite = VFX_SPRITES?.[name];
    if (!sprite?.complete || !sprite.naturalWidth) return false;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale * (flipX ? -1 : 1), scale);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  }

  function drawVfxContained(name, x, y, maxWidth, maxHeight, alpha = 1, rotation = 0, scale = 1, flipX = false) {
    const sprite = VFX_SPRITES?.[name];
    if (!sprite?.complete || !sprite.naturalWidth) return false;
    const ratio = sprite.naturalWidth / sprite.naturalHeight;
    let width = maxWidth;
    let height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
    return drawVfxSprite(name, x, y, width, height, alpha, rotation, scale, flipX);
  }

  function drawVfxAnchored(name, x, y, maxWidth, maxHeight, anchorX = .5, anchorY = .5, alpha = 1, rotation = 0, scale = 1) {
    const sprite = VFX_SPRITES?.[name];
    if (!sprite?.complete || !sprite.naturalWidth) return false;
    const ratio = sprite.naturalWidth / sprite.naturalHeight;
    let width = maxWidth;
    let height = width / ratio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * ratio;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, -width * anchorX, -height * anchorY, width, height);
    ctx.restore();
    return true;
  }

  function drawGeyserCapture(timestamp) {
    const capture = run.geyserCapture;
    if (!capture) return;
    const elapsed = timestamp - capture.startedAt;
    const pullProgress = clamp(elapsed / capture.pullDuration, 0, 1);
    const chargeProgress = clamp((timestamp - (capture.startedAt + capture.pullDuration)) / (capture.readyAt - capture.startedAt - capture.pullDuration), 0, 1);
    const ready = timestamp >= capture.readyAt;
    const frame = ready
      ? 1 + (Math.floor((timestamp - capture.readyAt) / 260) % 2)
      : chargeProgress < .48 ? 1 : 2;
    const x = capture.targetX;
    const y = capture.targetY - run.cameraY + 5;
    const pulse = 1 + Math.sin(timestamp / 190) * (.018 + chargeProgress * .018);
    ctx.save();
    if (!drawVfxContained(`geyser-compact-${frame}`, x, y, 90 + chargeProgress * 14, 94 + chargeProgress * 16, .64 + pullProgress * .22, 0, pulse)) {
      const glow = ctx.createRadialGradient(x, y, 3, x, y, 34);
      glow.addColorStop(0, 'rgba(255,181,65,.76)');
      glow.addColorStop(1, 'rgba(255,80,22,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
    }
    if (ready) {
      ctx.globalAlpha = .72 + Math.sin(timestamp / 240) * .1;
      ctx.fillStyle = 'rgba(33,28,34,.84)';
      roundedRect(ctx, x - 75, y - 88, 150, 25, 13);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,196,94,.88)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff5d6';
      ctx.font = '1000 9px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('НАЖМИ — СЛАЙМ ПОЛЕТИТ ТУДА', x, y - 75);
    }
    ctx.restore();
  }

  function drawMeteorShowers(timestamp) {
    if (!run.meteorShowers?.length) return;
    ctx.save();
    for (const shower of run.meteorShowers) {
      for (const strike of shower.strikes) {
        const targetY = strike.y - run.cameraY;
        if (targetY < -180 || targetY > VIEW_H + 190) continue;
        if (!strike.impactedAt) {
          const warningProgress = clamp((timestamp - strike.warnedAt) / Math.max(1, strike.impactAt - strike.warnedAt), 0, 1);
          const pulse = .68 + Math.sin(timestamp / 55) * .22;
          ctx.save();
          ctx.translate(strike.x, targetY);
          ctx.globalAlpha = .32 + warningProgress * .52;
          ctx.strokeStyle = warningProgress > .68 ? '#fff09a' : '#ff7638';
          ctx.lineWidth = 3;
          ctx.setLineDash([7, 5]);
          ctx.lineDashOffset = -timestamp / 28;
          ctx.beginPath();
          ctx.ellipse(0, 0, 24 + pulse * 4, 11 + pulse * 2, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = .12 + warningProgress * .18;
          ctx.fillStyle = '#ff5b28';
          ctx.beginPath(); ctx.ellipse(0, 0, 30, 14, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();

          if (timestamp >= strike.fallAt) {
            const fallProgress = clamp((timestamp - strike.fallAt) / Math.max(1, strike.impactAt - strike.fallAt), 0, 1);
            const eased = fallProgress * fallProgress;
            const meteorY = lerp(targetY - 250, targetY - 18, eased);
            const meteorX = strike.x - (1 - eased) * 94;
            const angle = .72 + strike.angle;
            if (!drawVfxContained('meteor-flight', meteorX, meteorY, 124, 88, .96, angle, .86 + fallProgress * .16)) {
              ctx.fillStyle = '#ff7b25';
              ctx.beginPath(); ctx.arc(meteorX, meteorY, 17, 0, Math.PI * 2); ctx.fill();
            }
          }
          continue;
        }

        const impactProgress = clamp((timestamp - strike.impactedAt) / 760, 0, 1);
        const frame = impactProgress < .4 ? 1 : 2;
        const alpha = frame === 1 ? 1 - impactProgress * .55 : Math.pow(1 - impactProgress, .72);
        const size = frame === 1 ? 238 : 265 + impactProgress * 36;
        if (!drawVfxSprite(`meteor-impact-${frame}`, strike.x, targetY, size, size, alpha, 0, .84 + Math.sin(impactProgress * Math.PI) * .17)) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#ff8a27';
          ctx.beginPath(); ctx.arc(strike.x, targetY, 34 + impactProgress * 46, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function drawSpecialEffects(overlayOnly = false) {
    if (!run.specialEffects?.length) return;
    ctx.save();
    for (const effect of run.specialEffects) {
      const slimeOverlay = effect.type === 'appleMint' || effect.type === 'appleRed';
      if (slimeOverlay !== overlayOnly) continue;
      const progress = 1 - clamp(effect.life / effect.maxLife, 0, 1);
      const alpha = Math.pow(1 - progress, .94);
      const y = effect.y - run.cameraY;
      ctx.save();
      if (effect.type === 'bomb') {
        const frame = progress < .13 ? 1 : progress < .33 ? 2 : progress < .7 ? 3 : 4;
        const frameAlpha = frame === 4 ? alpha * .9 : Math.min(1, alpha * 1.16);
        const frameSize = frame === 1 ? 176 : frame === 2 ? 194 : frame === 3 ? 220 : 204;
        if (!drawVfxSprite(`bomb-${frame}`, effect.x, y, frameSize, frameSize, frameAlpha, -.035 + progress * .07)) {
          ctx.globalAlpha = alpha * .8;
          ctx.fillStyle = frame < 3 ? '#ff5647' : '#ffad3d';
          ctx.beginPath(); ctx.arc(effect.x, y, 25 + progress * 55, 0, Math.PI * 2); ctx.fill();
        }
      } else if (effect.type === 'heal') {
        const targetX = run.slime.x;
        const targetY = run.slime.y - run.cameraY;
        const crossScale = .78 + Math.sin(Math.min(1, progress) * Math.PI) * .3 + progress * .12;
        if (!drawVfxSprite('heal-cross', targetX, targetY, 176, 176, alpha * .88, 0, crossScale)) {
          ctx.globalAlpha = alpha * .72;
          ctx.fillStyle = '#79efaa';
          roundedRect(ctx, targetX - 8, targetY - 34, 16, 68, 8); ctx.fill();
          roundedRect(ctx, targetX - 34, targetY - 8, 68, 16, 8); ctx.fill();
        }
      } else if (effect.type === 'cryo') {
        const frame = progress < .14 ? 1 : progress < .34 ? 2 : progress < .72 ? 3 : 4;
        const frameSize = frame === 1 ? 138 : frame === 2 ? 188 : frame === 3 ? 244 : 256;
        const frameAlpha = frame === 4 ? alpha * .84 : Math.min(1, alpha * 1.12);
        const cryoScale = .88 + Math.sin(progress * Math.PI) * .12;
        if (!drawVfxSprite(`cryo-${frame}`, effect.x, y, frameSize, frameSize, frameAlpha, -.025 + progress * .05, cryoScale)) {
          const spread = frameSize / 2;
          const mist = ctx.createRadialGradient(effect.x, y, 2, effect.x, y, spread);
          mist.addColorStop(0, 'rgba(225,252,255,.72)');
          mist.addColorStop(1, 'rgba(72,185,226,0)');
          ctx.globalAlpha = alpha * .84;
          ctx.fillStyle = mist;
          ctx.beginPath(); ctx.arc(effect.x, y, spread, 0, Math.PI * 2); ctx.fill();
        }
      } else if (effect.type === 'snowflake') {
        const targetX = run.slime.x;
        const targetY = run.slime.y - run.cameraY;
        const fall = 1 - Math.pow(1 - clamp(progress * 1.8, 0, 1), 3);
        const snowY = targetY - 118 + fall * 105;
        const snowSize = 92 + Math.sin(progress * Math.PI) * 24;
        if (!drawVfxSprite('snowflake-hit', targetX, snowY, snowSize, snowSize, alpha * .96, -.09 + progress * .18)) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#effdff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `900 ${snowSize * .62}px "Segoe UI Symbol", system-ui`;
          ctx.fillText('❄', targetX, snowY);
        }
      } else if (effect.type === 'appleMint' || effect.type === 'appleRed') {
        const mint = effect.type === 'appleMint';
        const targetX = run.slime.x;
        const targetY = run.slime.y - run.cameraY;
        const radius = run.slime.radius;
        const enter = clamp(progress / .12, 0, 1);
        const leave = clamp((1 - progress) / .2, 0, 1);
        const arrowAlpha = enter * leave;
        const arrowSize = clamp(radius * 3.35, 154, 224);
        const arrowsY = mint
          ? targetY + radius + arrowSize * .33 + progress * 16
          : targetY - radius - arrowSize * .33 - progress * 16;
        const ringRadius = mint
          ? radius + 48 - progress * 36
          : radius + 10 + progress * 42;
        const rgb = mint ? '54,231,174' : '255,72,75';
        ctx.globalAlpha = arrowAlpha * .8;
        ctx.strokeStyle = `rgba(${rgb},.96)`;
        ctx.lineWidth = 4.2;
        ctx.shadowColor = `rgb(${rgb})`;
        ctx.shadowBlur = 13;
        ctx.beginPath();
        ctx.arc(targetX, targetY, Math.max(radius + 8, ringRadius), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = arrowAlpha * .32;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(targetX, targetY, Math.max(radius + 15, ringRadius + 12), 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        const spriteName = mint ? 'apple-shrink' : 'apple-grow';
        if (!drawVfxSprite(spriteName, targetX, arrowsY, arrowSize, arrowSize, arrowAlpha, 0, .96 + Math.sin(progress * Math.PI) * .12)) {
          ctx.globalAlpha = arrowAlpha;
          ctx.fillStyle = mint ? '#42dbad' : '#ff5b5e';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `1000 ${Math.round(arrowSize * .35)}px system-ui`;
          ctx.fillText(mint ? '↓' : '↑', targetX, arrowsY);
        }
      } else if (effect.type === 'geyser') {
        const frame = progress < .26 ? 3 : 4;
        const direction = Math.atan2(effect.ny, effect.nx);
        const travel = frame === 4 ? 6 + progress * 13 : 0;
        const blastX = effect.x + effect.nx * travel;
        const blastY = y + effect.ny * travel;
        const frameAlpha = frame === 4 ? alpha * .78 : Math.min(1, alpha * 1.02);
        const scale = .86 + Math.sin(progress * Math.PI) * .1;
        const drawn = frame === 3
          ? drawVfxContained('geyser-compact-3', blastX, blastY, 116, 116, frameAlpha, 0, scale)
          : drawVfxAnchored('geyser-compact-4', blastX, blastY, 148, 128, .12, .5, frameAlpha, direction, scale);
        if (!drawn) {
          ctx.globalAlpha = alpha * .72;
          ctx.fillStyle = '#ff8b2c';
          ctx.beginPath(); ctx.arc(blastX, blastY, 16 + progress * 18, 0, Math.PI * 2); ctx.fill();
        }
      } else if (effect.type === 'spring') {
        const direction = Math.atan2(effect.ny, effect.nx);
        const gustWidth = 168 + progress * 94;
        const gustHeight = gustWidth * .52;
        const travel = 16 + progress * 34;
        const gustX = effect.x + effect.nx * travel;
        const gustY = y + effect.ny * travel;
        const gustScale = .82 + Math.sin(progress * Math.PI) * .25 + progress * .12;
        if (!drawVfxSprite('spring-gust', gustX, gustY, gustWidth, gustHeight, alpha * .94, direction, gustScale, true)) {
          ctx.globalAlpha = alpha * .55;
          ctx.fillStyle = '#dffcff';
          ctx.beginPath(); ctx.arc(gustX, gustY, 18 + progress * 20, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawBackground(world) {
    const background = world.editorBackground;
    const artwork = background?.image ? editorSprite(background.image) : null;
    if (artwork?.complete && artwork.naturalWidth) {
      const scale = background.scale || 1;
      const width = VIEW_W * scale;
      const height = VIEW_H * scale;
      const x = (VIEW_W - width) / 2 + VIEW_W * (background.x || 0) / 100;
      const y = (VIEW_H - height) / 2 + VIEW_H * (background.y || 0) / 100;
      ctx.save();
      ctx.globalAlpha = .55;
      ctx.drawImage(artwork, x, y, width, height);
      ctx.restore();
    }
    const stripe = 80;
    const offset = -(run.cameraY % stripe);
    for (let y = offset; y < VIEW_H + stripe; y += stripe) {
      ctx.fillStyle = 'rgba(255,255,255,.018)';
      ctx.fillRect(0, y, VIEW_W, 2);
      const worldY = run.cameraY + y;
      const seed = Math.sin(worldY * .017) * 999;
      ctx.fillStyle = 'rgba(255,255,255,.035)';
      ctx.beginPath();
      ctx.arc(42 + (Math.abs(seed * 13) % 340), y + 28, 7 + Math.abs(seed % 9), 0, Math.PI * 2);
      ctx.fill();
    }

    if (world.id === 2) {
      ctx.save();
      ctx.strokeStyle = 'rgba(190,239,255,.13)';
      ctx.lineWidth = 2;
      const iceOffset = -(run.cameraY % 118);
      for (let y = iceOffset; y < VIEW_H + 118; y += 118) {
        const x = 28 + Math.abs(Math.sin((run.cameraY + y) * .013)) * 350;
        ctx.beginPath();
        ctx.moveTo(x - 13, y + 17); ctx.lineTo(x + 13, y + 17);
        ctx.moveTo(x, y + 4); ctx.lineTo(x, y + 30);
        ctx.moveTo(x - 9, y + 8); ctx.lineTo(x + 9, y + 26);
        ctx.moveTo(x + 9, y + 8); ctx.lineTo(x - 9, y + 26);
        ctx.stroke();
      }
      ctx.restore();
    }

    const depth = (run.endlessDepthOffset || 0) + Math.max(0, Math.floor((run.cameraY + 20) / 10));
    ctx.fillStyle = 'rgba(11,10,18,.42)';
    roundedRect(ctx, 10, 10, 72, 25, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${depth} м`, 46, 27);
  }

  function drawFinishPortal(world, timestamp) {
    const portal = getPortalGeometry();
    const bob = Math.sin(timestamp / 430) * 3.5;
    const centerX = portal.x;
    const centerY = portal.y - run.cameraY + bob;
    if (centerY < -170 || centerY > VIEW_H + 170) return;
    const palettes = {
      1: { glow: '#52efb0', ring: '#dcffe7', spark: '#fff2a6' },
      2: { glow: '#54dbff', ring: '#e8faff', spark: '#d9f5ff' },
      3: { glow: '#ff7fba', ring: '#fff0a6', spark: '#fff7d5' },
      4: { glow: '#ff6b28', ring: '#ffd66d', spark: '#fff0a5' }
    };
    const palette = palettes[world.id] || palettes[1];
    ctx.save();
    const portalSprite = WORLD_SPRITES[world.id]?.portal || null;
    if (portalSprite?.complete && portalSprite.naturalWidth) {
      const pulse = .92 + Math.sin(timestamp / 180) * .07;
      const entryProgress = run.portalEntry
        ? clamp((timestamp - run.portalEntry.startedAt) / run.portalEntry.duration, 0, 1)
        : 0;
      const entryPulse = run.portalEntry ? 1 + Math.sin(entryProgress * Math.PI) * .42 : 1;
      ctx.globalAlpha = .16 + Math.sin(timestamp / 210) * .045 + entryProgress * .14;
      ctx.fillStyle = palette.glow;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 86 * pulse * entryPulse, 86 * pulse * entryPulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = .28;
      ctx.strokeStyle = palette.ring;
      ctx.lineWidth = 3;
      for (let ring = 0; ring < 2; ring += 1) {
        const ringPhase = (timestamp / 900 + ring * .5) % 1;
        ctx.globalAlpha = (1 - ringPhase) * .24;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60 + ringPhase * 38, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let i = 0; i < 7; i += 1) {
        const angle = timestamp / 760 + i * Math.PI * 2 / 7;
        const orbit = 76 + Math.sin(timestamp / 260 + i) * 5;
        const sparkleX = centerX + Math.cos(angle) * orbit;
        const sparkleY = centerY + Math.sin(angle) * orbit;
        ctx.globalAlpha = .45 + Math.sin(timestamp / 130 + i) * .2;
        ctx.fillStyle = i % 2 ? palette.spark : '#ffffff';
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2.4 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      if (run.portalEntry) {
        const suctionStrength = Math.sin(entryProgress * Math.PI);
        for (let ring = 0; ring < 3; ring += 1) {
          const contraction = (1 - entryProgress + ring / 3) % 1;
          const ringRadius = 43 + contraction * 68;
          ctx.globalAlpha = (.12 + suctionStrength * .34) * (1 - contraction * .55);
          ctx.strokeStyle = ring % 2 ? palette.spark : palette.ring;
          ctx.lineWidth = 2.5 + suctionStrength * 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, timestamp / 360 + ring, timestamp / 360 + ring + Math.PI * 1.35);
          ctx.stroke();
        }
        const coreGlow = ctx.createRadialGradient(centerX, centerY, 2, centerX, centerY, 51);
        coreGlow.addColorStop(0, `rgba(255,255,255,${.42 + entryProgress * .42})`);
        coreGlow.addColorStop(.32, palette.glow);
        coreGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = .22 + suctionStrength * .28;
        ctx.fillStyle = coreGlow;
        ctx.beginPath(); ctx.arc(centerX, centerY, 52 + suctionStrength * 8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(Math.sin(timestamp / 680) * .055);
      ctx.scale(pulse * entryPulse, pulse * entryPulse);
      ctx.drawImage(portalSprite, -76, -76, 152, 152);
      ctx.restore();
      ctx.restore();
      return;
    }
    const fallbackPulse = .94 + Math.sin(timestamp / 180) * .06;
    ctx.globalAlpha = .22;
    ctx.fillStyle = palette.glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 82 * fallbackPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 13;
    ctx.strokeStyle = palette.ring;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 59, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = world.accent;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 51, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '1000 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('ПОРТАЛ', centerX, centerY + 5);
    ctx.restore();
  }

  function drawBlock(block, sy, timestamp) {
    const hpRatio = clamp(block.hp / block.maxHp, 0, 1);
    const color = materialColor(block.material, run.world, hpRatio);
    const special = block.special;
    const tier = block.tier || 'dense';
    ctx.save();

    if (WORLD_SPRITES[run.worldId] && drawWorldSprite(block, sy, hpRatio)) {
      ctx.restore();
      return;
    }

    ctx.fillStyle = color;
    ctx.fillRect(block.x + .5, sy + .5, block.w - 1, block.h - 1);

    const tierStroke = {
      soft: 'rgba(255,255,255,.12)',
      dense: 'rgba(255,255,255,.25)',
      hard: 'rgba(30,25,35,.72)',
      reinforced: 'rgba(245,245,255,.82)',
      ore: 'rgba(237,233,254,.96)',
      special: 'rgba(255,255,255,.92)'
    }[special ? 'special' : tier];
    ctx.strokeStyle = tierStroke;
    ctx.lineWidth = special ? 2.7 : tier === 'reinforced' ? 3 : tier === 'hard' || tier === 'ore' ? 2 : 1;
    ctx.strokeRect(block.x + 1, sy + 1, block.w - 2, block.h - 2);
    ctx.beginPath();
    ctx.rect(block.x + 1, sy + 1, block.w - 2, block.h - 2);
    ctx.clip();

    if (!special) {
      drawWorldTexture(block, sy, run.world);
      if (tier === 'soft') {
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.fillRect(block.x + 4, sy + 4, block.w - 8, 4);
      } else if (tier === 'dense') {
        ctx.fillStyle = 'rgba(255,255,255,.13)';
        ctx.fillRect(block.x + 4, sy + 4, block.w - 8, 6);
        ctx.fillStyle = 'rgba(0,0,0,.08)';
        ctx.fillRect(block.x + 4, sy + block.h - 8, block.w - 8, 4);
      } else if (tier === 'hard') {
        ctx.fillStyle = 'rgba(10,8,16,.22)';
        ctx.fillRect(block.x + 5, sy + 5, block.w - 10, block.h - 10);
        ctx.strokeStyle = 'rgba(255,255,255,.28)';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x + 7, sy + 7, block.w - 14, block.h - 14);
      } else if (tier === 'reinforced') {
        ctx.fillStyle = 'rgba(10,8,16,.27)';
        ctx.fillRect(block.x + 5, sy + 5, block.w - 10, block.h - 10);
        ctx.fillStyle = 'rgba(255,255,255,.72)';
        for (const [ox, oy] of [[9, 9], [block.w - 9, 9], [9, block.h - 9], [block.w - 9, block.h - 9]]) {
          ctx.beginPath();
          ctx.arc(block.x + ox, sy + oy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,255,255,.38)';
        ctx.lineWidth = 2;
        ctx.strokeRect(block.x + 7, sy + 7, block.w - 14, block.h - 14);
      } else if (tier === 'ore') {
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        ctx.beginPath();
        ctx.moveTo(block.x + block.w / 2, sy + 8);
        ctx.lineTo(block.x + block.w - 10, sy + block.h / 2);
        ctx.lineTo(block.x + block.w / 2, sy + block.h - 8);
        ctx.lineTo(block.x + 10, sy + block.h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.65)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (!drawCrackStage(block, sy, hpRatio) && crackStageFor(hpRatio)) drawCracks(block, sy, hpRatio);
      ctx.fillStyle = '#fff';
      ctx.font = tier === 'reinforced' ? '1000 13px system-ui' : '1000 12px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.max(1, Math.ceil(block.hp)), block.x + block.w / 2, sy + block.h / 2 + 1);
      if (tier === 'ore') {
        ctx.font = '900 8px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.fillText('РУДА', block.x + block.w / 2, sy + block.h - 7);
      }
      ctx.restore();
      return;
    }

    // Спецблоки читаются мгновенно даже на маленьком экране.
    if (special === 'bomb') {
      ctx.fillStyle = 'rgba(255,240,80,.28)';
      for (let x = block.x - block.h; x < block.x + block.w; x += 13) {
        ctx.save();
        ctx.translate(x, sy);
        ctx.rotate(-.55);
        ctx.fillRect(0, 0, 6, block.h * 1.7);
        ctx.restore();
      }
    } else if (special === 'gel') {
      ctx.fillStyle = 'rgba(255,255,255,.26)';
      ctx.fillRect(block.x + block.w * .42, sy + 9, block.w * .16, block.h - 18);
      ctx.fillRect(block.x + 9, sy + block.h * .42, block.w - 18, block.h * .16);
    } else if (special === 'spring') {
      ctx.strokeStyle = '#e0fbff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const cx = block.x + block.w / 2;
      ctx.moveTo(cx - 14, sy + block.h - 10);
      ctx.lineTo(cx + 14, sy + block.h - 10);
      ctx.moveTo(cx, sy + block.h - 12);
      ctx.lineTo(cx, sy + 13);
      ctx.moveTo(cx, sy + 13);
      ctx.lineTo(cx - 9, sy + 22);
      ctx.moveTo(cx, sy + 13);
      ctx.lineTo(cx + 9, sy + 22);
      ctx.stroke();
    } else if (special === 'coin') {
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.beginPath();
      ctx.arc(block.x + block.w / 2, sy + block.h / 2, 17, 0, Math.PI * 2);
      ctx.fill();
    } else if (special === 'cryo' || special === 'snowflake') {
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(block.x + block.w / 2, sy + block.h / 2, 17, 0, Math.PI * 2);
      ctx.stroke();
    } else if (special === 'appleMint' || special === 'appleRed') {
      ctx.fillStyle = special === 'appleMint' ? 'rgba(88,235,188,.42)' : 'rgba(255,77,99,.42)';
      ctx.beginPath();
      ctx.arc(block.x + block.w / 2, sy + block.h / 2, 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (special === 'boss') {
      const cx = block.x + block.w / 2;
      const cy = sy + block.h / 2;
      ctx.fillStyle = 'rgba(40,20,72,.58)';
      ctx.beginPath();
      ctx.arc(cx, cy, 23, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe56b';
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 4, 4, 0, Math.PI * 2);
      ctx.arc(cx + 8, cy - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff5b5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 12, cy + 11); ctx.lineTo(cx, cy + 15); ctx.lineTo(cx + 12, cy + 11);
      ctx.stroke();
    }

    const symbol = { coin: '●', spring: '↥', bomb: '✹', gel: '+', cryo: '◇', snowflake: '❄', appleMint: '🍏', appleRed: '🍎', geyser: '◉', meteor: '☄', boss: '!' }[special] || '•';
    ctx.fillStyle = '#fff';
    ctx.font = special === 'gel' ? '1000 28px system-ui' : '1000 23px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, block.x + block.w / 2, sy + block.h / 2 - 2);
    ctx.font = '1000 9px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.fillText(special === 'boss' ? `БОСС · ${Math.max(1, Math.ceil(block.hp))}` : `${Math.max(1, Math.ceil(block.hp))} HP`, block.x + block.w / 2, sy + block.h - 7);
    ctx.restore();
  }

  function crackStageFor(hpRatio) {
    const damageRatio = 1 - clamp(hpRatio, 0, 1);
    if (damageRatio >= .75) return 3;
    if (damageRatio >= .5) return 2;
    if (damageRatio >= .25) return 1;
    return 0;
  }

  function drawCrackStage(block, sy, hpRatio) {
    const stage = crackStageFor(hpRatio);
    const sprite = CRACK_STAGE_SPRITES?.[stage];
    if (!stage || !sprite?.complete || !sprite.naturalWidth) return false;
    const gutter = .5;
    ctx.save();
    ctx.globalAlpha = .94;
    ctx.drawImage(sprite, block.x + gutter, sy + gutter, block.w - gutter * 2, block.h - gutter * 2);
    ctx.restore();
    return true;
  }

  function drawSpecialBlockAura(block, sy, timestamp) {
    const auraKey = block.hazard ? 'hazard' : block.special;
    // Only universally important signals glow: green means healing, red means
    // danger. Other utility blocks rely on their artwork and own animations.
    if (auraKey !== 'gel' && auraKey !== 'hazard') return;
    const colors = {
      gel: [50, 225, 116],
      hazard: [255, 60, 24]
    };
    const [red, green, blue] = colors[auraKey];
    const phase = timestamp / (auraKey === 'hazard' ? 240 : 280) + block.id * .71;
    const pulse = .5 + Math.sin(phase) * .5;
    const cx = block.x + block.w / 2;
    const cy = sy + block.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(block.x + 1, sy + 1, block.w - 2, block.h - 2);
    ctx.clip();
    const radius = block.w * (auraKey === 'hazard' ? .7 : .62);
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    const strength = .3;
    glow.addColorStop(0, `rgba(${red},${green},${blue},${strength + pulse * .12})`);
    glow.addColorStop(.58, `rgba(${red},${green},${blue},${strength * .48})`);
    glow.addColorStop(1, `rgba(${red},${green},${blue},0)`);
    ctx.globalAlpha = .9;
    ctx.fillStyle = glow;
    ctx.fillRect(block.x + 1, sy + 1, block.w - 2, block.h - 2);
    // Semantic lighting is deliberately reserved for these two block types.
    {
      ctx.globalAlpha = (auraKey === 'hazard' || auraKey === 'gel' ? .68 : .56) + pulse * .25;
      ctx.strokeStyle = `rgba(${red},${green},${blue},.9)`;
      ctx.shadowColor = `rgba(${red},${green},${blue},.92)`;
      ctx.shadowBlur = 3.5 + pulse * 4.5;
      ctx.lineWidth = auraKey === 'hazard' ? 2.6 : 2.15;
      roundedRect(ctx, block.x + 2.1, sy + 2.1, block.w - 4.2, block.h - 4.2, 7);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawWorldSprite(block, sy, hpRatio) {
    // Босс рисуется кодом, а не обычной плиткой: у него свои глаза и лицо.
    if (block.special === 'boss') return false;
    let spriteName;
    if (block.hazard && run.worldId === 2) spriteName = block.hazardVariant === 'spikes' ? 'ice-spikes' : 'ice-shards';
    else if (block.hazard && run.worldId === 3) spriteName = 'candy-hazard';
    else if (block.hazard && run.worldId === 4) spriteName = 'lava-hazard';
    else if (block.hazard) spriteName = 'stone-hazard';
    else if (block.special === 'bomb') spriteName = 'dynamite';
    else if (block.special === 'spring') spriteName = 'spring';
    else if (block.special === 'appleMint') spriteName = 'apple-mint';
    else if (block.special === 'appleRed') spriteName = 'apple-red';
    else if (block.special === 'cryo') spriteName = 'cryo';
    else if (block.special === 'snowflake') spriteName = 'snowflake';
    else if (block.special === 'geyser') spriteName = 'geyser';
    else if (block.special === 'meteor') spriteName = 'meteor';
    else if (block.special === 'gel') spriteName = 'heal';
    else if (block.special === 'coin') spriteName = 'ore-gold';
    else if (block.frozen && run.worldId === 2) spriteName = 'snow-packed';
    else if (block.tier === 'ore' || block.frozenOre) spriteName = `ore-${block.oreType?.id || 'coal'}`;
    else if (run.worldId === 2) {
      if (block.frozen || block.tier === 'soft') spriteName = 'ice-light';
      else if (block.tier === 'dense') spriteName = 'snow-packed';
      else if (block.tier === 'hard') spriteName = 'glacier';
      else spriteName = 'ice-reinforced';
    } else if (run.worldId === 3) {
      if (block.tier === 'reinforced') spriteName = 'candy-reinforced';
      else if (block.tier === 'hard') spriteName = 'candy-normal';
      else if (block.tier === 'dense') spriteName = 'cookie-packed';
      else spriteName = 'candy-light';
    } else if (run.worldId === 4) {
      if (block.tier === 'reinforced') spriteName = 'basalt';
      else if (block.tier === 'hard') spriteName = 'volcanic-earth';
      else spriteName = 'ash';
    } else if (run.worldId === 1) {
      if (block.tier === 'soft') spriteName = 'dirt-grass';
      else if (block.tier === 'dense') spriteName = 'ground-weak';
      else if (block.tier === 'hard') spriteName = 'stone';
      else spriteName = 'stone-reinforced';
    } else if (block.tier === 'reinforced') spriteName = 'stone-reinforced';
    else if (block.tier === 'hard') spriteName = 'stone';
    else if (block.tier === 'soft') spriteName = 'dirt-grass';
    else spriteName = 'stone';

    const editorId = block.frozen
      ? 'dense'
      : block.editorVisualId || (block.special === 'gel' ? 'heal' : block.special || (block.hazard ? 'hazard' : block.tier));
    const edited = editorBlock(run.worldId, editorId);
    if (edited?.type === 'custom' && edited.sprite) spriteName = edited.sprite;
    const oreArtwork = !block.frozen && (block.tier === 'ore' || block.frozenOre) ? edited?.oreTextures?.[block.oreType?.id || 'coal'] : null;
    const artwork = oreArtwork?.image ? oreArtwork : edited;
    const customSprite = artwork?.image ? editorSprite(artwork.image) : null;
    const sprites = WORLD_SPRITES[run.worldId];
    const sprite = customSprite?.complete && customSprite.naturalWidth ? customSprite : sprites?.[spriteName];
    if (!sprite?.complete || !sprite.naturalWidth) return false;

    // Leave a single-pixel gutter for the grid instead of letting tiles overlap.
    const gutter = .5;
    // Damage is communicated only by the crack overlay. The underlying artwork
    // remains fully opaque and keeps its original colour at every health value.
    ctx.globalAlpha = 1;
    const scale = customSprite ? (artwork.scale || 1) : 1;
    const width = Math.max(1, block.w * scale - gutter * 2);
    const height = Math.max(1, block.h * scale - gutter * 2);
    const offsetX = customSprite ? block.w * (artwork.x || 0) / 100 : 0;
    const offsetY = customSprite ? block.h * (artwork.y || 0) / 100 : 0;
    const drawX = block.x + (block.w - width) / 2 + offsetX;
    const drawY = sy + (block.h - height) / 2 + offsetY;
    if (['bomb', 'gel', 'spring', 'cryo', 'snowflake', 'appleMint', 'appleRed', 'geyser', 'meteor'].includes(block.special)) {
      const time = performance.now();
      const phase = time / (block.special === 'bomb' ? 160 : block.special === 'gel' ? 330 : block.special === 'spring' ? 260 : 300) + block.id;
      const wave = Math.sin(phase);
      const pulse = block.special === 'bomb'
        ? 1 + wave * .06
        : block.special === 'gel'
          ? 1 + wave * .055
          : block.special === 'cryo' || block.special === 'snowflake'
            ? 1 + wave * .028
            : block.special === 'appleMint' || block.special === 'appleRed'
              ? 1 + wave * .038
            : block.special === 'geyser'
              ? 1 + wave * .025
              : block.special === 'meteor'
                ? 1 + wave * .045
                : 1;
      ctx.save();
      ctx.translate(block.x + block.w / 2 + offsetX, sy + block.h / 2 + offsetY);
      if (block.special === 'bomb') ctx.rotate(Math.sin(phase * .5) * .024);
      if (block.special === 'spring') {
        const bounce = Math.max(0, wave);
        ctx.translate(0, -bounce * 2.5);
        ctx.scale(1 + bounce * .07, 1 - bounce * .11);
      } else ctx.scale(pulse, pulse);
      ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, drawX, drawY, width, height);
    }
    ctx.globalAlpha = 1;
    drawSpecialBlockAura(block, sy, performance.now());
    drawCrackStage(block, sy, hpRatio);

    const label = Math.max(1, Math.ceil(block.hp)).toString();
    const badgeWidth = Math.max(29, 15 + label.length * 7);
    ctx.fillStyle = 'rgba(22,28,38,.80)';
    roundedRect(ctx, block.x + block.w / 2 - badgeWidth / 2, sy + block.h - 18, badgeWidth, 14, 7);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.48)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '1000 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, block.x + block.w / 2, sy + block.h - 11);
    return true;
  }

  function drawBlockTransitions() {
    const liveBlocks = new Map();
    for (const block of run.blocks) {
      if (!block.dead) liveBlocks.set(`${block.row}:${block.col}`, block);
    }

    ctx.save();
    // A single neutral grid line separates tiles. Unlike the old colour blends,
    // it never spills onto the artwork or makes the shaft look connected by bands.
    ctx.fillStyle = 'rgba(20, 26, 35, .72)';
    for (const block of liveBlocks.values()) {
      const sy = block.y - run.cameraY;
      if (sy < -run.cellSize || sy > VIEW_H + run.cellSize) continue;

      const right = liveBlocks.get(`${block.row}:${block.col + 1}`);
      const below = liveBlocks.get(`${block.row + 1}:${block.col}`);
      if (right) ctx.fillRect(block.x + block.w - .5, sy, 1, block.h);
      if (below) ctx.fillRect(block.x, sy + block.h - .5, block.w, 1);
    }
    ctx.restore();
  }

  function drawWorldTexture(block, sy, world) {
    ctx.save();
    ctx.globalAlpha = .18;
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#fff';
    ctx.lineWidth = 1.2;
    const x = block.x;
    const w = block.w;
    const h = block.h;
    if (world.id === 1) {
      ctx.beginPath();
      ctx.moveTo(x + 7, sy + h * .30); ctx.lineTo(x + w - 7, sy + h * .30);
      ctx.moveTo(x + 12, sy + h * .68); ctx.lineTo(x + w - 12, sy + h * .68);
      ctx.stroke();
    } else if (world.id === 2) {
      for (let i = 0; i < 4; i += 1) {
        ctx.beginPath();
        ctx.arc(x + 10 + i * 13, sy + 13 + ((block.id + i) % 2) * 24, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (world.id === 3) {
      ctx.beginPath();
      ctx.moveTo(x + 8, sy + h - 8); ctx.lineTo(x + w * .45, sy + 8); ctx.lineTo(x + w - 8, sy + h - 12);
      ctx.stroke();
    } else {
      for (let i = -1; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(x + i * 18, sy + h); ctx.lineTo(x + i * 18 + 24, sy);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCracks(block, sy, ratio) {
    const cx = block.x + block.w * .52;
    const cy = sy + block.h * .5;
    const count = ratio < .35 ? 5 : 3;
    ctx.strokeStyle = 'rgba(25,18,22,.55)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < count; i += 1) {
      const angle = i / count * Math.PI * 2 + block.id;
      const lengthX = 9 + ((block.id * 17 + i * 11) % 11);
      const lengthY = 6 + ((block.id * 13 + i * 7) % 8);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * lengthX, cy + Math.sin(angle) * lengthY);
      ctx.stroke();
    }
  }

  function materialColor(material, world) {
    const colors = {
      crumb: '#d6a45d', wood: '#9b6330', dirt: '#9a6130', packedDirt: '#a86e34', stone: '#737b88',
      candy: '#ed7cc4', cookie: '#c98a49',
      snow: '#d8f8ff', ice: '#67d8ef', crystal: '#7c9dff',
      iceLight: '#bdefff', snowPacked: '#e7f8ff', glacier: '#65b9e7', iceHazard: '#168bd2',
      ash: '#55515b', volcanicEarth: '#8f3f2b', basalt: '#35343d', lavaRock: '#ef592b', metal: '#677383', ore: '#9b7cff',
      coin: '#eab308', spring: '#22d3ee', bomb: '#ef4444', gel: '#34d399',
      hazard: '#403c49', cryo: '#54dff5', snowflake: '#378ed8', appleMint: '#50e8bd', appleRed: '#ff596d', geyser: '#ff762b', meteor: '#ff7e27', boss: '#8a4fd2'
    };
    return colors[material] || world.accent;
  }

  function shadeHex(hex, amount) {
    const value = parseInt(hex.replace('#', ''), 16);
    const r = clamp((value >> 16) + amount, 0, 255);
    const g = clamp(((value >> 8) & 255) + amount, 0, 255);
    const b = clamp((value & 255) + amount, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  function menuSlimeEmotion() {
    if (els.slime.classList.contains('petting') || els.slime.classList.contains('petted')) return 'petting';
    if (els.slime.classList.contains('pleased')) return 'pleased';
    if (els.slime.classList.contains('chewing')) return 'chewing';
    if (els.slime.classList.contains('savoring')) return 'savoring';
    if (els.slime.classList.contains('meal-secret') && (els.slime.classList.contains('eat') || els.slime.classList.contains('expect-food'))) return 'anticipating';
    if (els.slime.classList.contains('eat') || els.slime.classList.contains('expect-food')) return 'hungry';
    if (els.slime.classList.contains('booped')) return 'surprised';
    return 'focused';
  }

  function prepareMenuSlimeCanvas() {
    const dpr = Math.min(isLowPowerDevice() ? 1 : isMobileDevice() ? 1.2 : 1.5, window.devicePixelRatio || 1);
    els.menuSlimeCanvas.width = Math.round(180 * dpr);
    els.menuSlimeCanvas.height = Math.round(180 * dpr);
    menuSlimeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    menuSlimeCtx.imageSmoothingEnabled = true;
  }

  function drawMenuSlime(timestamp) {
    menuSlimeCtx.clearRect(0, 0, 180, 180);
    const emotion = menuSlimeEmotion();
    const rarity = MEAL_REACTION_CLASSES.find(name => els.slime.classList.contains(name))?.replace('meal-', '') || '';
    const isEating = ['eat', 'chewing', 'savoring', 'pleased'].some(name => els.slime.classList.contains(name));
    const isPleased = els.slime.classList.contains('pleased');
    const blinkPhase = timestamp % 4700;
    const prismaticActive = rarity === 'prismatic' && isEating;
    const secretActive = rarity === 'secret' && isEating;
    const selected = skinById(save.selectedSkin);
    let aura = '';
    if (rarity === 'epic' && isPleased) aura = 'epic';
    else if (rarity === 'legendary' && isPleased) aura = 'legendary';
    else if (prismaticActive) aura = 'prismatic';
    else if (secretActive) aura = 'secret';
    drawSlimeAvatar(menuSlimeCtx, {
      x: 90, y: 91, radius: 66, emotion,
      skin: selected.id,
      colors: selected.colors,
      gazeX: menuGaze.x, gazeY: menuGaze.y,
      blink: emotion === 'focused' && blinkPhase > 4420 && blinkPhase < 4530,
      aura,
      tipSway: prismaticActive ? Math.sin(timestamp / 210) * .16 : 0,
      petPoint: els.slime.classList.contains('petting') ? menuPetPoint : null,
      timestamp
    });
  }

  function menuSlimeFrame(timestamp) {
    if (!els.homeScreen.classList.contains('active') || document.body.classList.contains('ui-modal-open')) {
      menuSlimeAnimationId = 0;
      return;
    }
    menuSlimeAnimationId = requestAnimationFrame(menuSlimeFrame);
    if (document.hidden || timestamp - menuSlimeLastFrame < 32) return;
    menuSlimeLastFrame = timestamp;
    drawMenuSlime(timestamp);
  }

  function startMenuSlimeLoop() {
    if (menuSlimeAnimationId) return;
    prepareMenuSlimeCanvas();
    drawMenuSlime(performance.now());
    menuSlimeAnimationId = requestAnimationFrame(menuSlimeFrame);
  }

  function drawSlime(timestamp) {
    const s = run.slime;
    const screenY = s.y - run.cameraY;
    if (els.impactText.classList.contains('combo-impact')) positionComboImpact();
    const selected = skinById(save.selectedSkin);
    const frozen = isSlimeFrozen(timestamp);
    const hurtActive = !frozen && timestamp < (run.hurtFlashUntil || 0);
    const hurtPulse = hurtActive ? .5 + Math.sin(timestamp / 42) * .5 : 0;
    const portalProgress = run.portalEntry
      ? clamp((timestamp - run.portalEntry.startedAt) / run.portalEntry.duration, 0, 1)
      : 0;
    const vanishProgress = clamp((portalProgress - .08) / .92, 0, 1);
    const portalScale = Math.pow(1 - vanishProgress, 1.12);
    if (run.portalEntry && portalScale <= .01) return;
    const speed = Math.hypot(s.vx, s.vy);
    const stretch = clamp(s.vy / 900, -.22, .3);
    const bounceSquash = clamp(Math.sin(s.wobble) * .025 + Math.abs(s.vx) / 1700, 0, .12);
    const scaleX = frozen ? 1 : 1 - stretch * .42 + bounceSquash;
    const scaleY = frozen ? 1 : 1 + stretch - bounceSquash * .55;
    const radius = s.radius;
    const emotion = frozen
      ? run.frozenEmotion
      : timestamp < run.emotionUntil
      ? run.emotion
      : run.abilityTime > 0
        ? 'power'
        : s.vy < -35
          ? 'surprised'
          : speed > 245
            ? 'joy'
            : 'focused';

    if (run.abilityTime > 0) {
      ctx.save();
      ctx.globalAlpha = .25 + Math.sin(timestamp / 80) * .08;
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(s.x, screenY, radius + 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (hurtActive) {
      const hurtGlow = ctx.createRadialGradient(s.x, screenY, radius * .25, s.x, screenY, radius + 25);
      hurtGlow.addColorStop(0, `rgba(255,78,86,${.18 + hurtPulse * .22})`);
      hurtGlow.addColorStop(1, 'rgba(255,43,57,0)');
      ctx.save();
      ctx.fillStyle = hurtGlow;
      ctx.beginPath(); ctx.arc(s.x, screenY, radius + 25, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (timestamp < run.healGlowUntil) {
      const healProgress = clamp((run.healGlowUntil - timestamp) / 980, 0, 1);
      const healGlow = ctx.createRadialGradient(s.x, screenY, radius * .18, s.x, screenY, radius + 24);
      healGlow.addColorStop(0, `rgba(116,255,166,${healProgress * .42})`);
      healGlow.addColorStop(.64, `rgba(53,220,121,${healProgress * .18})`);
      healGlow.addColorStop(1, 'rgba(53,220,121,0)');
      ctx.save();
      ctx.fillStyle = healGlow;
      ctx.beginPath(); ctx.arc(s.x, screenY, radius + 24, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (timestamp < run.appleGlowUntil) {
      const mint = run.appleGlowType === 'mint';
      const duration = mint ? 1450 : 1650;
      const appleProgress = clamp((run.appleGlowUntil - timestamp) / duration, 0, 1);
      const pulse = .82 + Math.sin(timestamp / 72) * .18;
      const appleGlow = ctx.createRadialGradient(s.x, screenY, radius * .18, s.x, screenY, radius + 46);
      const rgb = mint ? '58,220,168' : '255,77,83';
      appleGlow.addColorStop(0, `rgba(${rgb},${appleProgress * .38 * pulse})`);
      appleGlow.addColorStop(.58, `rgba(${rgb},${appleProgress * .22 * pulse})`);
      appleGlow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.save();
      ctx.fillStyle = appleGlow;
      ctx.beginPath(); ctx.arc(s.x, screenY, radius + 46, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    if (run.portalEntry) {
      const portalPalette = {
        1: ['82,239,176', '221,255,231'],
        2: ['84,219,255', '232,250,255'],
        3: ['255,127,186', '255,240,166'],
        4: ['255,107,40', '255,214,109']
      }[run.worldId] || ['82,239,176', '221,255,231'];
      const suctionGlow = ctx.createRadialGradient(s.x, screenY, radius * .12, s.x, screenY, radius * (1.7 + portalProgress * .45));
      suctionGlow.addColorStop(0, `rgba(${portalPalette[1]},${.22 + portalProgress * .34})`);
      suctionGlow.addColorStop(.48, `rgba(${portalPalette[0]},${.18 + portalProgress * .18})`);
      suctionGlow.addColorStop(1, `rgba(${portalPalette[0]},0)`);
      ctx.save();
      ctx.fillStyle = suctionGlow;
      ctx.beginPath(); ctx.arc(s.x, screenY, radius * (1.72 + portalProgress * .45), 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = (1 - vanishProgress) * .72;
      ctx.strokeStyle = `rgba(${portalPalette[1]},.92)`;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(s.x, screenY, radius * (1.15 - portalProgress * .35), timestamp / 180, timestamp / 180 + Math.PI * 1.35); ctx.stroke();
      ctx.restore();
    }

    drawSlimeAvatar(ctx, {
      x: s.x,
      y: screenY,
      radius,
      emotion,
      skin: selected.id,
      colors: frozen
        ? ['#ecfdff', '#69cef2', '#287caf']
        : hurtActive && hurtPulse > .32
          ? ['#fff1f0', '#ff7377', '#cf3347']
          : selected.colors,
      scaleX: scaleX * portalScale,
      scaleY: scaleY * portalScale,
      rotation: (frozen ? clamp(s.vx / 1600, -.09, .09) : clamp(s.vx / 850, -.24, .24)) + portalProgress * 1.8,
      alpha: run.portalEntry ? Math.pow(1 - vanishProgress, .72) : 1,
      timestamp
    });

    if (hurtActive && !run.portalEntry) {
      drawVfxSprite(
        'damage-splash',
        s.x,
        screenY,
        radius * 3.65,
        radius * 3.65,
        .18 + hurtPulse * .2,
        (hurtPulse - .5) * .08,
        .9 + hurtPulse * .12
      );
    }

    if (frozen && !run.portalEntry) drawFrozenSlimeOverlay(s.x, screenY, radius, timestamp);

    if (!run.portalEntry) drawMassBar(s.x, screenY - radius * .98 - 22, radius);

    if (!run.portalEntry && speed > 260) {
      run.trails.push({ x: s.x, y: s.y, radius, life: .22 });
      if (run.trails.length > 8) run.trails.shift();
    }
    for (const trail of run.trails) trail.life -= .016;
    run.trails = run.trails.filter(trail => trail.life > 0);
  }

  function drawFrozenSlimeOverlay(x, y, radius, timestamp) {
    ctx.save();
    ctx.translate(x, y);
    const shimmer = .5 + Math.sin(timestamp / 180) * .5;
    const iceGlow = ctx.createRadialGradient(-radius * .22, -radius * .34, 1, 0, 0, radius * 1.05);
    iceGlow.addColorStop(0, 'rgba(235,253,255,.38)');
    iceGlow.addColorStop(.7, 'rgba(91,203,239,.2)');
    iceGlow.addColorStop(1, 'rgba(35,119,180,.08)');
    ctx.globalAlpha = .72;
    ctx.fillStyle = iceGlow;
    ctx.beginPath();
    ctx.arc(0, 0, radius * .9, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = '#b9f3ff';
    ctx.shadowBlur = 8;
    const frostBlobs = [[-.5,-.53,.26],[-.22,-.61,.3],[.1,-.58,.28],[.39,-.48,.24]];
    for (const [bx, by, br] of frostBlobs) {
      ctx.globalAlpha = .72;
      ctx.fillStyle = '#dcfaff';
      ctx.beginPath();
      ctx.arc(bx * radius, by * radius, br * radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    for (const [ix, iy, length] of [[-.43,-.4,.32],[.04,-.38,.25],[.38,-.34,.29]]) {
      ctx.globalAlpha = .7;
      ctx.fillStyle = '#a4eaff';
      ctx.beginPath();
      ctx.moveTo((ix - .08) * radius, iy * radius);
      ctx.quadraticCurveTo(ix * radius, (iy + length * 1.1) * radius, (ix + .07) * radius, iy * radius);
      ctx.fill();
    }
    for (const [fx, fy, fr] of [[-.55,.12,.055],[.5,.04,.045],[-.28,.48,.04],[.35,.42,.06]]) {
      ctx.globalAlpha = .48 + shimmer * .3;
      ctx.fillStyle = '#f4feff';
      ctx.beginPath(); ctx.arc(fx * radius, fy * radius, fr * radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawMassBar(x, y, radius) {
    const width = clamp(radius * 2.25, 74, 108);
    const height = 12;
    const left = clamp(x - width / 2, 6, VIEW_W - width - 6);
    const top = clamp(y, 8, VIEW_H - 24);
    const ratio = clamp(run.visualMass / Math.max(1, run.maxMass), 0, 1);
    const fillWidth = Math.max(0, (width - 4) * ratio);
    let fill = ratio > .55 ? '#4ade80' : ratio > .25 ? '#facc15' : '#fb7185';
    if (run.massFlashTime > 0 && run.massFlash > 0) fill = '#67e8f9';
    if (run.massFlashTime > 0 && run.massFlash < 0) fill = '#fff';

    ctx.save();
    ctx.fillStyle = 'rgba(10,9,17,.78)';
    roundedRect(ctx, left, top, width, height, 6);
    ctx.fill();
    ctx.fillStyle = fill;
    roundedRect(ctx, left + 2, top + 2, fillWidth, height - 4, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.68)';
    ctx.lineWidth = 1;
    roundedRect(ctx, left, top, width, height, 6);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '900 8px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.max(0, Math.ceil(run.mass))} / ${Math.ceil(run.maxMass)}`, left + width / 2, top + height / 2 + .5);
    ctx.restore();
  }

  function roundedRect(context, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.arcTo(x + w, y, x + w, y + h, radius);
    context.arcTo(x + w, y + h, x, y + h, radius);
    context.arcTo(x, y + h, x, y, radius);
    context.arcTo(x, y, x + w, y, radius);
    context.closePath();
  }

  function clearRunImpactFeedback() {
    els.impactText.className = 'impact-text';
    els.impactText.removeAttribute('style');
    els.impactText.replaceChildren();
    els.shaft.classList.remove('combo-burst');
    els.shaft.style.removeProperty('--combo-x');
    els.shaft.style.removeProperty('--combo-y');
  }

  function impact(text) {
    els.impactText.className = 'impact-text';
    els.impactText.removeAttribute('style');
    els.impactText.textContent = text;
    void els.impactText.offsetWidth;
    els.impactText.classList.add('show');
  }

  function comboImpact(multiplier, count) {
    const phase = multiplier >= 10 ? 5 : multiplier >= 6 ? 4 : multiplier >= 4 ? 3 : multiplier >= 2 ? 2 : 1;
    const ratings = ['КОМБО!', 'ХОРОШО!', 'СУПЕР!', 'НЕВЕРОЯТНО!', 'НЕВОЗМОЖНО!'];
    const milestone = [2, 4, 6, 10].includes(multiplier);
    run.comboDisplaySide = run.slime.x > VIEW_W * .5 ? -1 : 1;
    els.impactText.className = `impact-text combo-impact combo-stage-${phase}${milestone ? ' combo-milestone' : ''}`;
    els.impactText.style.setProperty('--combo-power', String(Math.min(1.14, .95 + multiplier / 15 * .19)));
    const badgeSprite = VFX_SPRITES?.[`combo-stage-${phase}`];
    if (badgeSprite?.src) els.impactText.style.setProperty('--combo-badge', `url("${badgeSprite.src}")`);
    positionComboImpact();
    els.impactText.innerHTML = `<span class="combo-rating">${ratings[phase - 1]}</span><span class="combo-line"><small>КОМБО</small><b><i>×</i><strong>${Math.round(multiplier)}</strong></b></span>`;
    void els.impactText.offsetWidth;
    els.impactText.classList.add('combo-show');
    if (milestone) {
      els.shaft.classList.remove('combo-burst');
      void els.shaft.offsetWidth;
      els.shaft.classList.add('combo-burst');
    }
    run.shake = Math.max(run.shake, Math.min(5.8, .6 + phase * .9));
    feedback(phase >= 5 ? [9, 15, 11, 15, 13] : phase >= 4 ? [7, 13, 9] : phase >= 3 ? [6, 10, 7] : phase >= 2 ? 5 : 3);
  }

  function positionComboImpact() {
    if (!run?.slime) return;
    const side = run.comboDisplaySide || (run.slime.x > VIEW_W * .5 ? -1 : 1);
    const radius = run.slime.radius || 28;
    const x = clamp(run.slime.x + side * (radius + 66), 70, VIEW_W - 70);
    const y = clamp(run.slime.y - run.cameraY - radius * .28, 54, VIEW_H - 54);
    els.impactText.style.left = `${x / VIEW_W * 100}%`;
    els.impactText.style.top = `${y / VIEW_H * 100}%`;
    els.shaft.style.setProperty('--combo-x', `${x / VIEW_W * 100}%`);
    els.shaft.style.setProperty('--combo-y', `${y / VIEW_H * 100}%`);
  }

  // ===== РЕЗУЛЬТАТ ЗАБЕГА И МЕТА-ПРОГРЕССИЯ =====
  function continueEndlessWorld() {
    if (!run || run.ended) return;
    const completedLap = run.endlessLap;
    const segmentDepth = run.world.targetDepth;
    const lapReward = Math.round(run.world.reward * (1 + Math.min(1.4, (completedLap - 1) * .14)));
    run.coins += lapReward;
    run.endlessDepthOffset += segmentDepth;
    run.endlessLap += 1;
    run.world.endlessScale = 1 + Math.min(.9, (run.endlessLap - 1) * .1);
    run.mass = Math.min(run.maxMass, run.mass + Math.max(1, Math.ceil(run.maxMass * .12)));
    run.portalEntry = null;
    run.portalTransitioning = false;
    run.blocks = generateBlockField(run);
    run.particles = [];
    run.specialEffects = [];
    run.meteorShowers = [];
    run.hitCooldowns.clear();
    run.geyserCapture = null;
    run.slime.x = run.startX;
    run.slime.y = 78;
    run.slime.vx = rand(-65, 65);
    run.slime.vy = 55;
    run.slime.wobble = 0;
    run.cameraY = 0;
    run.depth = run.endlessDepthOffset;
    run.maxDepth = run.endlessDepthOffset;
    run.flightDistance = 0;
    run.lastPosition = { x: run.startX, y: 78 };
    run.trailPoints = [];
    run.lastTime = 0;
    resetCombo();
    updateRunUI();
    sound('coin');
    showToast(`КРУГ ${completedLap} · +${formatCompactNumber(lapReward)} МОНЕТ`);
    run.animationId = requestAnimationFrame(gameFrame);
  }

  function finalizeWorldCompletion() {
    if (!run || run.ended) return;
    const world = run.world;
    const level = clamp(Math.round(run.level || 1), 1, LEVEL_COUNT);
    save.worldBest[world.id] = Math.max(save.worldBest[world.id] || 0, world.targetDepth);
    if (level < LEVEL_COUNT) {
      save.unlockedLevels[world.id] = Math.max(save.unlockedLevels[world.id] || 1, level + 1);
      save.selectedLevels[world.id] = level + 1;
    } else {
      save.unlockedLevels[world.id] = LEVEL_COUNT;
      const unlockedSkin = { 1: 'cat', 2: 'water', 3: 'dumpling' }[world.id];
      if (unlockedSkin && !save.unlockedSkins.includes(unlockedSkin)) save.unlockedSkins.push(unlockedSkin);
      if (world.id < WORLDS.length) {
        save.world = world.id + 1;
        save.selectedLevels[save.world] = 1;
      }
    }
    run.isFinalCompletion = world.id === WORLDS[WORLDS.length - 1].id && level === LEVEL_COUNT;
    if (run.isFinalCompletion) save.gameCompleted = true;
    run.coins += world.reward;
    sound('win');
    endRun(true, level < LEVEL_COUNT
      ? `Уровень ${level} пройден! Открыт уровень ${level + 1}.`
      : `Все уровни мира «${world.name}» пройдены!`);
  }

  function finishWorld() {
    if (!run || run.ended || run.portalTransitioning) return;
    run.portalTransitioning = true;
    clearFallSteering();
    cancelAnimationFrame(run.animationId);
    if (run.endless) continueEndlessWorld();
    else finalizeWorldCompletion();
  }

  function finishRunEarly() {
    if (!run || run.ended) return;
    endRun(false, 'Уровень завершён вручную. Полученная награда сохранена.');
  }

  function formatResultMultiplier(value) {
    return `×${Number.isInteger(value) ? value : value.toFixed(1)}`;
  }

  function resultMeterPhaseAt(meter, timestamp) {
    const elapsed = Math.max(0, timestamp - meter.startedAt);
    return (meter.phase + elapsed / RESULT_SWEEP_MS) % 2;
  }

  function renderResultMeter(phase) {
    if (!run?.rewardMeter) return;
    const normalizedPhase = ((phase % 2) + 2) % 2;
    const position = normalizedPhase <= 1 ? normalizedPhase : 2 - normalizedPhase;
    const slotIndex = clamp(Math.round(position * (RESULT_MULTIPLIERS.length - 1)), 0, RESULT_MULTIPLIERS.length - 1);
    const multiplier = RESULT_MULTIPLIERS[slotIndex];
    const angle = -74 + position * 148;

    run.rewardMeter.currentPhase = normalizedPhase;
    run.rewardMeter.position = position;
    run.rewardMeter.slotIndex = slotIndex;
    run.rewardMeter.multiplier = multiplier;
    els.resultMultiplierNeedle.style.transform = `rotate(${angle}deg)`;
    els.resultMultiplierLabel.textContent = formatResultMultiplier(multiplier);
    els.resultMultiplierLabel.dataset.slot = String(slotIndex);
    els.resultMultiplierTrack.dataset.activeSlot = String(slotIndex);
    els.resultMultiplierTrack.querySelectorAll('.result-meter-cell').forEach((cell, index) => {
      cell.classList.toggle('is-active', index === slotIndex);
    });
  }

  function updateResultMeter(timestamp) {
    const meter = run?.rewardMeter;
    if (!meter?.running) return;
    renderResultMeter(resultMeterPhaseAt(meter, timestamp));
    meter.animationId = requestAnimationFrame(updateResultMeter);
  }

  function startResultMeter(reset = false) {
    if (!run) return;
    const now = performance.now();
    if (reset || !run.rewardMeter) {
      run.rewardMeter = {
        phase: 0,
        currentPhase: 0,
        position: 0,
        slotIndex: 0,
        multiplier: RESULT_MULTIPLIERS[0],
        startedAt: now,
        running: true,
        animationId: 0
      };
    } else {
      run.rewardMeter.phase = run.rewardMeter.currentPhase ?? run.rewardMeter.phase;
      run.rewardMeter.startedAt = now;
      run.rewardMeter.running = true;
    }
    cancelAnimationFrame(run.rewardMeter.animationId);
    renderResultMeter(run.rewardMeter.phase);
    run.rewardMeter.animationId = requestAnimationFrame(updateResultMeter);
  }

  function stopResultMeter() {
    const meter = run?.rewardMeter;
    if (!meter) return 1;
    const phase = meter.running ? resultMeterPhaseAt(meter, performance.now()) : meter.currentPhase;
    meter.phase = phase;
    meter.currentPhase = phase;
    meter.running = false;
    cancelAnimationFrame(meter.animationId);
    renderResultMeter(phase);
    return meter.multiplier;
  }

  function animateResultNumber(element, from, to, duration, formatter) {
    cancelAnimationFrame(resultCoinAnimationId);
    const startedAt = performance.now();
    return new Promise(resolve => {
      const step = timestamp => {
        const progress = clamp((timestamp - startedAt) / Math.max(1, duration), 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(from + (to - from) * eased);
        element.textContent = formatter(value);
        if (progress < 1) resultCoinAnimationId = requestAnimationFrame(step);
        else resolve(value);
      };
      resultCoinAnimationId = requestAnimationFrame(step);
    });
  }

  function animateResultCoins(from, to) {
    const stat = els.resultCoins.closest('.result-stat');
    stat?.classList.add('is-counting');
    animateResultNumber(els.resultCoins, from, to, 520, value => `+${formatCompactNumber(value)}`).then(() => {
      stat?.classList.remove('is-counting');
      stat?.classList.add('is-complete');
      setTimeout(() => stat?.classList.remove('is-complete'), 420);
    });
  }

  async function revealResultSummary(depth, coins, token) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const modal = els.resultOverlay.querySelector('.result-modal');
    const depthStat = els.resultDepth.closest('.result-stat');
    const coinsStat = els.resultCoins.closest('.result-stat');
    if (!reducedMotion) await new Promise(resolve => setTimeout(resolve, 330));
    if (token !== resultRevealToken || !run) return;

    depthStat?.classList.add('is-counting');
    if (reducedMotion) els.resultDepth.textContent = `${depth.toLocaleString('ru-RU')} м`;
    else await animateResultNumber(els.resultDepth, 0, depth, 580, value => `${value.toLocaleString('ru-RU')} м`);
    if (token !== resultRevealToken || !run) return;
    depthStat?.classList.remove('is-counting');
    depthStat?.classList.add('is-complete');
    feedback(5);

    if (!reducedMotion) await new Promise(resolve => setTimeout(resolve, 120));
    if (token !== resultRevealToken || !run) return;
    depthStat?.classList.remove('is-complete');
    coinsStat?.classList.add('is-counting');
    sound('coin');
    if (reducedMotion) els.resultCoins.textContent = `+${formatCompactNumber(coins)}`;
    else await animateResultNumber(els.resultCoins, 0, coins, 620, value => `+${formatCompactNumber(value)}`);
    if (token !== resultRevealToken || !run) return;
    coinsStat?.classList.remove('is-counting');
    coinsStat?.classList.add('is-complete');
    feedback([5, 10, 5]);
    setTimeout(() => coinsStat?.classList.remove('is-complete'), 430);

    modal?.classList.remove('result-reveal-pending');
    modal?.classList.add('result-reveal-ready');
    els.resultMultiplierBtn.disabled = false;
    els.continueBtn.disabled = false;
    startResultMeter(true);
  }

  function calculateEndlessScore(currentRun) {
    if (!currentRun?.endless) return 0;
    const depthPoints = Math.max(0, Math.floor(currentRun.maxDepth || 0)) * 10;
    const blockPoints = Math.max(0, Math.floor(currentRun.blocksDestroyed || 0)) * 75;
    const coinPoints = Math.max(0, Math.floor(currentRun.coins || 0)) * 4;
    return depthPoints + blockPoints + coinPoints;
  }

  function endRun(completed, reason) {
    if (!run || run.ended) return;
    hideRunMenu();
    clearRunImpactFeedback();
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.ended = true;
    clearFallSteering();
    cancelAnimationFrame(run.animationId);
    save.totalRuns += 1;
    save.bestDepth = Math.max(save.bestDepth, run.maxDepth);
    if (run.endless) {
      run.endlessScore = calculateEndlessScore(run);
      save.endlessBestScore[run.worldId] = Math.max(save.endlessBestScore[run.worldId] || 0, run.endlessScore);
      save.endlessBestDepth[run.worldId] = Math.max(save.endlessBestDepth[run.worldId] || 0, Math.max(0, Math.floor(run.maxDepth)));
    } else {
      save.worldBest[run.worldId] = Math.max(save.worldBest[run.worldId] || 0, Math.min(run.maxDepth, run.world.targetDepth));
      save.lastRunDepth[`${run.worldId}:${run.level}`] = Math.min(run.world.targetDepth, Math.max(0, Math.floor(run.maxDepth)));
    }
    const baseCoins = Math.max(1, Math.floor(run.coins));
    save.coins += baseCoins;
    run.awardedCoins = baseCoins;
    run.finalCoins = baseCoins;
    run.rewardClaimed = false;
    run.rewardPending = false;
    run.rewardMultiplier = 1;
    persist();

    els.resultOverlay.dataset.world = String(run.worldId);
    const resultModal = els.resultOverlay.querySelector('.result-modal');
    resultModal?.classList.remove('reward-locked', 'reward-claimed', 'result-reveal-ready');
    resultModal?.classList.add('result-reveal-pending');
    els.resultDepth.closest('.result-stat')?.classList.remove('is-counting', 'is-complete');
    els.resultCoins.closest('.result-stat')?.classList.remove('is-counting', 'is-complete');
    els.resultWorldIcon.src = versionedAsset(`assets/ui/world-icons/world-${run.worldId}.webp`);
    els.resultWorldName.textContent = run.world.name;
    els.resultBadge.textContent = run.endless
      ? '∞ БЕСКОНЕЧНЫЙ ЗАБЕГ'
      : completed
      ? (run.level >= LEVEL_COUNT ? 'МИР ПРОЙДЕН' : `УРОВЕНЬ ${run.level} ПРОЙДЕН`)
      : 'ЗАБЕГ ОКОНЧЕН';
    els.resultTitle.textContent = run.endless ? 'Бесконечный забег' : 'Результат забега';
    els.resultText.textContent = reason;
    els.resultDepth.textContent = '0 м';
    els.resultCoins.textContent = '+0';
    els.resultMultiplierLabel.textContent = formatResultMultiplier(RESULT_MULTIPLIERS[0]);
    els.resultMultiplierHint.textContent = 'Нажми, чтобы остановить стрелку';
    els.resultMultiplierBtn.disabled = true;
    els.resultMultiplierBtn.innerHTML = '<span class="result-ad-play" aria-hidden="true">▶</span><span>УМНОЖИТЬ НАГРАДУ</span>';
    els.continueBtn.disabled = true;
    els.continueBtn.textContent = 'Продолжить без множителя';
    els.resultOverlay.classList.remove('hidden', 'is-arriving');
    syncInteractionLayers();
    const revealToken = ++resultRevealToken;
    requestAnimationFrame(() => {
      els.resultOverlay.classList.add('is-arriving');
      els.resultOverlay.querySelector('.modal')?.focus();
      revealResultSummary(Math.max(0, Math.floor(run.maxDepth)), baseCoins, revealToken);
    });
    if (!completed) sound('fail');
  }

  async function claimResultMultiplier() {
    if (!run || run.rewardClaimed || run.rewardPending || adInFlight) return;
    run.rewardPending = true;
    const multiplier = stopResultMeter();
    const totalCoins = Math.max(1, Math.round(run.awardedCoins * multiplier));
    run.rewardMultiplier = multiplier;
    els.resultOverlay.querySelector('.result-modal')?.classList.add('reward-locked');
    els.resultMultiplierHint.textContent = `Поймано ${formatResultMultiplier(multiplier)} · подтверди награду`;
    els.resultMultiplierBtn.disabled = true;
    els.resultMultiplierBtn.innerHTML = `<span class="result-ad-play" aria-hidden="true">▶</span><span>ПОЙМАНО ${formatResultMultiplier(multiplier)}</span>`;
    els.continueBtn.disabled = true;
    try {
      const rewarded = await showRewardedAd(`Множитель ${formatResultMultiplier(multiplier)} · итог ${formatCompactNumber(totalCoins)} мон.`);
      if (!rewarded) {
        els.resultOverlay.querySelector('.result-modal')?.classList.remove('reward-locked');
        els.resultMultiplierHint.textContent = 'Нажми, чтобы остановить стрелку';
        els.resultMultiplierBtn.innerHTML = '<span class="result-ad-play" aria-hidden="true">▶</span><span>УМНОЖИТЬ НАГРАДУ</span>';
        startResultMeter(false);
        return;
      }
      run.rewardClaimed = true;
      run.finalCoins = totalCoins;
      save.coins = Math.max(0, save.coins + totalCoins - run.awardedCoins);
      persist();
      animateResultCoins(run.awardedCoins, totalCoins);
      els.resultOverlay.querySelector('.result-modal')?.classList.add('reward-claimed');
      els.resultMultiplierHint.textContent = `Итоговая награда: ${formatResultMultiplier(multiplier)}`;
      els.resultMultiplierBtn.innerHTML = `<span class="result-ad-play" aria-hidden="true">✓</span><span>НАГРАДА ${formatResultMultiplier(multiplier)}</span>`;
      els.continueBtn.textContent = 'Продолжить';
      sound('coin');
    } catch (error) {
      console.warn('Rewarded ad failed:', error);
      els.resultOverlay.querySelector('.result-modal')?.classList.remove('reward-locked');
      els.resultMultiplierHint.textContent = 'Реклама недоступна · попробуй ещё раз';
      els.resultMultiplierBtn.innerHTML = '<span class="result-ad-play" aria-hidden="true">▶</span><span>УМНОЖИТЬ НАГРАДУ</span>';
      startResultMeter(false);
    } finally {
      if (run) run.rewardPending = false;
      els.resultMultiplierBtn.disabled = Boolean(run?.rewardClaimed);
      els.continueBtn.disabled = false;
    }
  }

  function showGameComplete() {
    els.gameCompleteOverlay.classList.remove('hidden');
    updatePersistentUI();
    syncInteractionLayers();
    sound('epic');
    feedback([12, 22, 12, 30, 16]);
    requestAnimationFrame(() => els.gameCompleteOverlay.querySelector('.game-complete-modal')?.focus());
  }

  function closeGameCompleteToHome() {
    els.gameCompleteOverlay.classList.add('hidden');
    syncInteractionLayers();
    run = null;
    newDraft();
  }

  function startEndlessFromCompletion() {
    els.gameCompleteOverlay.classList.add('hidden');
    syncInteractionLayers();
    run = null;
    startDrop({ endless: true });
  }

  function continueAfterRun() {
    if (run?.rewardPending) return;
    const showFinale = Boolean(run?.isFinalCompletion && !run?.endless);
    resultRevealToken += 1;
    stopResultMeter();
    cancelAnimationFrame(resultCoinAnimationId);
    els.resultOverlay.classList.add('hidden');
    els.resultOverlay.classList.remove('is-arriving');
    syncInteractionLayers();
    if (showFinale) {
      showGameComplete();
      return;
    }
    run = null;
    newDraft();
  }

  function upgradeCost(key) {
    const data = UPGRADE_DATA[key];
    const level = save[key];
    return data.costs[level] ?? Infinity;
  }

  function buyUpgrade(key) {
    const data = UPGRADE_DATA[key];
    const level = save[key];
    if (session?.foods?.length) return showToast('Прокачивайся до начала кормления');
    if (level >= data.max) return;
    const cost = upgradeCost(key);
    if (save.coins < cost) return showToast('Не хватает монет');
    save.coins -= cost;
    save[key] += 1;
    if (key === 'rerollLevel') session.freeRerolls += 1;
    if (key === 'conveyorLevel') generateOffer(session.baseEpicBoost);
    sound('coin');
    renderDraft();
    persist();
    renderPanel('upgrades');
  }

  function renderPanel(type) {
    lastFocusedElement = document.activeElement;
    els.panelOverlay.querySelector('.panel-modal')?.classList.toggle('encyclopedia-modal', type === 'encyclopedia');
    if (type === 'upgrades') renderUpgradesPanel();
    if (type === 'shop' || type === 'skins') renderShopPanel(activeShopTab);
    if (type === 'rewards') renderRewardsPanel();
    if (type === 'encyclopedia') renderEncyclopediaPanel(activeEncyclopediaTab, save.world);
    els.panelOverlay.classList.remove('hidden');
    syncInteractionLayers();
    requestAnimationFrame(() => els.panelOverlay.querySelector('.modal')?.focus());
  }

  function renderUpgradesPanel() {
    els.panelTitle.textContent = 'Прокачка';
    els.panelContent.innerHTML = `
      <div class="panel-section">
        <p class="panel-note">Постоянные улучшения помогают, но основной билд формируется выбранной едой.</p>
        ${Object.entries(UPGRADE_DATA).map(([key, data]) => {
          const level = save[key];
          const maxed = level >= data.max;
          const cost = maxed ? 0 : upgradeCost(key);
          return `<div class="upgrade-card">
            <div class="upgrade-icon">${uiIconMarkup(data.icon, 'panel-ui-icon')}</div>
            <div><h4>${data.name} · ур. ${level}/${data.max}</h4><p>${data.description}</p></div>
            <button class="buy-btn ${maxed ? 'owned' : ''}" data-upgrade="${key}">${maxed ? 'МАКС' : `● ${formatCompactNumber(cost)}`}</button>
          </div>`;
        }).join('')}
      </div>`;
    $$('[data-upgrade]').forEach(button => button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade)));
  }

  function shopTabsMarkup() {
    return `<div class="shop-tabs" role="tablist" aria-label="Разделы магазина">
      <span class="shop-tab-slider ${activeShopTab === 'trails' ? 'to-trails' : ''}" aria-hidden="true"></span>
      <button class="shop-tab ${activeShopTab === 'skins' ? 'active' : ''}" data-shop-tab="skins" role="tab" aria-selected="${activeShopTab === 'skins'}"><img src="${versionedAsset('assets/ui/slime.webp')}" alt="" aria-hidden="true"> ОБЛИКИ</button>
      <button class="shop-tab ${activeShopTab === 'trails' ? 'active' : ''}" data-shop-tab="trails" role="tab" aria-selected="${activeShopTab === 'trails'}"><img src="${versionedAsset('assets/ui/trail-tab.png')}" alt="" aria-hidden="true"> СЛЕДЫ</button>
    </div>`;
  }

  function renderShopPanel(tab = 'skins') {
    activeShopTab = tab === 'trails' ? 'trails' : 'skins';
    els.panelTitle.textContent = 'Магазин';
    if (activeShopTab === 'trails') renderTrailsPanel();
    else renderSkinsPanel();
    $$('[data-shop-tab]').forEach(button => button.addEventListener('click', () => switchShopTab(button.dataset.shopTab)));
    requestAnimationFrame(() => els.panelContent.querySelector('.shop-section')?.classList.add('shop-section-enter'));
  }

  function switchShopTab(tab) {
    const nextTab = tab === 'trails' ? 'trails' : 'skins';
    if (nextTab === activeShopTab) return;
    const slider = els.panelContent.querySelector('.shop-tab-slider');
    slider?.classList.toggle('to-trails', nextTab === 'trails');
    $$('[data-shop-tab]').forEach(button => {
      const active = button.dataset.shopTab === nextTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    const section = els.panelContent.querySelector('.shop-section');
    section?.classList.add('shop-section-exit');
    window.setTimeout(() => renderShopPanel(nextTab), 145);
  }

  function renderSkinsPanel() {
    els.panelContent.innerHTML = `${shopTabsMarkup()}<div class="panel-section shop-section">
      ${SKINS.map(skin => {
        const unlockedByWorld = skin.world && save.world >= skin.world;
        if (unlockedByWorld && !save.unlockedSkins.includes(skin.id)) save.unlockedSkins.push(skin.id);
        const unlocked = save.unlockedSkins.includes(skin.id);
        const selected = save.selectedSkin === skin.id;
        const price = !unlocked && skin.cost ? `<span class="shop-price"><img src="${versionedAsset('assets/ui/coin.webp')}" alt="" aria-hidden="true"><b>${formatCompactNumber(skin.cost)}</b></span>` : '';
        const reward = skin.world ? `<span class="shop-reward ${unlocked ? 'collected' : ''}"><b>${unlocked ? 'ПОЛУЧЕН' : 'НАГРАДА'}</b><i>МИР ${Math.max(1, skin.world - 1)}</i></span>` : '';
        const label = selected ? 'ВЫБРАН' : unlocked ? 'ВЫБРАТЬ' : skin.cost ? 'КУПИТЬ' : 'ЗАКРЫТ';
        return `<div class="skin-card ${selected ? 'selected' : ''}">
          <div class="skin-preview ${skin.className}"><canvas data-skin-preview="${skin.id}" width="96" height="96" aria-hidden="true"></canvas></div>
          <div class="shop-item-copy"><h4>${skin.name}</h4>${price}${reward}</div>
          <button class="buy-btn ${selected ? 'owned' : !unlocked && !skin.cost ? 'locked' : ''}" data-skin="${skin.id}">${label}</button>
        </div>`;
      }).join('')}
    </div>`;
    persist();
    $$('[data-skin-preview]').forEach(canvas => {
      const skin = skinById(canvas.dataset.skinPreview);
      const source = document.createElement('canvas');
      source.width = 128;
      source.height = 128;
      const sourceContext = source.getContext('2d');
      drawSlimeAvatar(sourceContext, {
        x: 64, y: 64, radius: 38,
        skin: skin.id,
        colors: skin.colors,
        emotion: 'joy',
        timestamp: performance.now()
      });
      drawCanvasContentCentered(source, canvas, 70);
    });
    $$('[data-skin]').forEach(button => button.addEventListener('click', () => selectOrBuySkin(button.dataset.skin)));
  }

  function canvasContentBounds(canvas) {
    const context = canvas.getContext('2d');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width;
    let top = canvas.height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(y * canvas.width + x) * 4 + 3] < 8) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    return right < left ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
  }

  function drawCanvasContentCentered(source, target, maxSize = 84) {
    const targetContext = target.getContext('2d');
    targetContext.clearRect(0, 0, target.width, target.height);
    const bounds = canvasContentBounds(source);
    if (!bounds) return;
    const scale = Math.min(maxSize / bounds.width, maxSize / bounds.height, 1.2);
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    targetContext.drawImage(
      source, bounds.x, bounds.y, bounds.width, bounds.height,
      (target.width - width) / 2, (target.height - height) / 2, width, height
    );
  }

  function renderTrailsPanel() {
    els.panelContent.innerHTML = `${shopTabsMarkup()}<div class="panel-section shop-section">
      ${TRAILS.map(trail => {
        const unlocked = save.unlockedTrails.includes(trail.id);
        const selected = save.selectedTrail === trail.id;
        const price = !unlocked && trail.cost ? `<span class="shop-price"><img src="${versionedAsset('assets/ui/coin.webp')}" alt="" aria-hidden="true"><b>${formatCompactNumber(trail.cost)}</b></span>` : '';
        const previewAsset = trail.id === 'none' ? 'assets/ui/trail-none.png' : trail.asset;
        return `<div class="trail-card ${selected ? 'selected' : ''}">
          <div class="trail-preview"><img src="${versionedAsset(previewAsset)}" alt="" aria-hidden="true" loading="eager" decoding="async"></div>
          <div class="shop-item-copy"><h4>${trail.name}</h4>${price}</div>
          <button class="buy-btn ${selected ? 'owned' : ''}" data-trail="${trail.id}">${selected ? 'ВЫБРАН' : unlocked ? 'ВЫБРАТЬ' : 'КУПИТЬ'}</button>
        </div>`;
      }).join('')}
    </div>`;
    $$('[data-trail]').forEach(button => button.addEventListener('click', () => selectOrBuyTrail(button.dataset.trail)));
  }

  function selectOrBuyTrail(id) {
    const trail = TRAILS.find(item => item.id === id) || TRAILS[0];
    const unlocked = save.unlockedTrails.includes(trail.id);
    if (!unlocked && trail.cost) {
      if (save.coins < trail.cost) return showToast('Не хватает монет');
      save.coins -= trail.cost;
      save.unlockedTrails.push(trail.id);
      sound('coin');
    } else sound('tap');
    save.selectedTrail = trail.id;
    persist();
    updatePersistentUI();
    renderShopPanel('trails');
  }

  function selectOrBuySkin(id) {
    const skin = skinById(id);
    const unlocked = save.unlockedSkins.includes(id);
    if (!unlocked && skin.cost) {
      if (save.coins < skin.cost) return showToast('Не хватает монет');
      save.coins -= skin.cost;
      save.unlockedSkins.push(id);
    } else if (!unlocked) return showToast(skin.condition);
    save.selectedSkin = id;
    persist();
    sound('tap');
    updatePersistentUI();
    drawMenuSlime(performance.now());
    renderShopPanel('skins');
  }

  function renderRewardsPanel() {
    els.panelTitle.textContent = 'Ежедневные бонусы';
    const today = todayKey();
    const dailyAvailable = save.lastDailyDate !== today;
    const freeWheel = save.lastWheelDate !== today;
    if (save.wheelAdDate !== today) {
      save.wheelAdDate = today;
      save.wheelAdSpins = 0;
      persist();
    }
    const wheelButton = freeWheel ? 'Крутить бесплатно' : save.wheelAdSpins < 2 ? `▶ Крутить за рекламу (${2 - save.wheelAdSpins})` : 'Приходи завтра';
    els.panelContent.innerHTML = `
      <div class="panel-section">
        <h3>Награда дня</h3>
        <div class="reward-card">
          <div class="reward-icon">${uiIconMarkup('gift', 'panel-ui-icon')}</div>
          <div><h4>День ${Math.min(save.dailyStreak + 1, 7)}</h4><p>${dailyAvailable ? 'Забери монеты за вход' : 'Награда уже получена'}</p></div>
          <button id="dailyClaimBtn" class="buy-btn ${dailyAvailable ? '' : 'owned'}" ${dailyAvailable ? '' : 'disabled'}>${dailyAvailable ? 'ЗАБРАТЬ' : '✓'}</button>
        </div>
      </div>
      <div class="panel-section">
        <h3>Колесо фортуны</h3>
        <div id="wheel" class="wheel" aria-label="Колесо наград"></div>
        <div class="reward-buttons"><button id="wheelSpinBtn" class="${freeWheel ? 'primary' : 'ad-btn'}" ${save.pendingWheel || (!freeWheel && save.wheelAdSpins >= 2) ? 'disabled' : ''}>${save.pendingWheel ? 'Выбираем награду…' : wheelButton}</button></div>
        <p class="panel-note">Награды: монеты, бонус здоровья, шанс эпической еды и дополнительная бесплатная прокрутка.</p>
      </div>`;
    $('#dailyClaimBtn').addEventListener('click', claimDaily);
    $('#wheelSpinBtn').addEventListener('click', spinWheel);
  }

  function encyclopediaUnlockedWorldIds() {
    return WORLDS.filter(world => worldIsUnlocked(world.id)).map(world => world.id);
  }

  function renderEncyclopediaPanel(tab = 'foods', worldId = save.world) {
    const encyclopedia = window.SlimeEncyclopedia;
    if (!encyclopedia) return;
    const unlockedWorldIds = encyclopediaUnlockedWorldIds();
    activeEncyclopediaTab = tab === 'blocks' ? 'blocks' : 'foods';
    activeEncyclopediaWorld = unlockedWorldIds.includes(+worldId) ? +worldId : unlockedWorldIds[0] || 1;
    els.panelTitle.textContent = 'Энциклопедия';
    els.panelContent.innerHTML = encyclopedia.render({
      activeTab: activeEncyclopediaTab,
      activeWorld: activeEncyclopediaWorld,
      activeRarity: activeEncyclopediaRarity,
      unlockedWorldIds,
      worlds: WORLDS,
      foods: FOODS,
      discoveredFoods: save.discoveredFoods || [],
      revealedSecretFoods: save.revealedSecretFoods || [],
      rarityLabels: RARITY_LABELS,
      balance: GAME_BALANCE,
      versionedAsset,
      foodArtMarkup,
      foodStatItems,
      foodStatGridMarkup
    });
    $$('[data-encyclopedia-tab]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.encyclopediaTab === activeEncyclopediaTab) return;
      sound('tap');
      renderEncyclopediaPanel(button.dataset.encyclopediaTab, activeEncyclopediaWorld);
    }));
    $$('[data-encyclopedia-world]').forEach(button => button.addEventListener('click', () => {
      const nextWorld = Number(button.dataset.encyclopediaWorld);
      if (!unlockedWorldIds.includes(nextWorld) || nextWorld === activeEncyclopediaWorld) return;
      sound('tap');
      renderEncyclopediaPanel(activeEncyclopediaTab, nextWorld);
    }));
    $$('[data-encyclopedia-rarity]').forEach(button => button.addEventListener('click', () => {
      const nextRarity = button.dataset.encyclopediaRarity;
      if (nextRarity === activeEncyclopediaRarity) return;
      activeEncyclopediaRarity = nextRarity;
      sound('tap');
      renderEncyclopediaPanel(activeEncyclopediaTab, activeEncyclopediaWorld);
    }));
    $$('.encyclopedia-food-viewport').forEach(viewport => viewport.addEventListener('wheel', event => {
      if (!event.deltaY || viewport.scrollWidth <= viewport.clientWidth) return;
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    }, { passive: false }));
    $$('[data-encyclopedia-food]').forEach(card => {
      const open = () => openEncyclopediaFood(card.dataset.encyclopediaFood, card);
      card.addEventListener('click', open);
      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        open();
      });
    });
  }

  function openEncyclopediaFood(foodId, sourceCard) {
    const food = FOODS.find(item => item.id === foodId);
    const encyclopedia = window.SlimeEncyclopedia;
    if (!food || !encyclopedia) return;
    document.querySelector('.encyclopedia-card-viewer')?.remove();
    const viewer = document.createElement('div');
    viewer.className = 'encyclopedia-card-viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', `Карточка: ${food.name}`);
    viewer.innerHTML = `<div class="encyclopedia-card-viewer-stage"><button class="encyclopedia-card-viewer-close" type="button" aria-label="Закрыть крупную карточку">×</button><div class="encyclopedia-card-viewer-card">${encyclopedia.foodCardMarkup(food, { rarityLabels: RARITY_LABELS, foodArtMarkup, foodStatItems, foodStatGridMarkup })}</div><small>Нажми ещё раз, чтобы закрыть</small></div>`;
    document.body.appendChild(viewer);
    syncInteractionLayers();
    const close = () => {
      viewer.classList.add('closing');
      window.setTimeout(() => {
        viewer.remove();
        syncInteractionLayers();
      }, 180);
      sourceCard?.focus({ preventScroll: true });
    };
    viewer.addEventListener('click', close);
    viewer.querySelector('.encyclopedia-card-viewer-close')?.focus();
  }

  function claimDaily() {
    const today = todayKey();
    if (save.lastDailyDate === today) return;
    save.dailyStreak = save.lastDailyDate === yesterdayKey() ? Math.min(7, save.dailyStreak + 1) : 1;
    const rewards = [55, 80, 110, 145, 190, 250, 400];
    const reward = rewards[save.dailyStreak - 1] || 55;
    save.coins += reward;
    save.lastDailyDate = today;
    persist();
    sound('coin');
    showToast(`Ежедневная награда: +${reward} монет`);
    renderRewardsPanel();
  }

  const WHEEL_REWARDS = [
    { weight: 30, text: '+80 монет', apply: () => { save.coins += 80; } },
    { weight: 22, text: '+150 монет', apply: () => { save.coins += 150; } },
    { weight: 8, text: '+350 монет', apply: () => { save.coins += 350; } },
    { weight: 15, text: '+10% эпика в следующем забеге', apply: () => { save.pendingEpicBoost += 10; } },
    { weight: 13, text: '+20% здоровья в следующем забеге', apply: () => { save.pendingMassBoost += 20; } },
    { weight: 12, text: '+1 бесплатная прокрутка', apply: () => { save.pendingExtraRerolls += 1; } }
  ];

  function chooseWheelReward() {
    let roll = Math.random() * WHEEL_REWARDS.reduce((sum, reward) => sum + reward.weight, 0);
    for (let index = 0; index < WHEEL_REWARDS.length; index += 1) {
      roll -= WHEEL_REWARDS[index].weight;
      if (roll <= 0) return index;
    }
    return 0;
  }

  function finishPendingWheel(announce = true) {
    if (!save.pendingWheel) return;
    const reward = WHEEL_REWARDS[save.pendingWheel.rewardIndex];
    save.pendingWheel = null;
    if (!reward) return persist();
    reward.apply();
    persist();
    sound('epic');
    if (announce) showToast(reward.text);
  }

  async function spinWheel() {
    if (save.pendingWheel || adInFlight) return;
    const today = todayKey();
    const free = save.lastWheelDate !== today;
    if (!free) {
      if (save.wheelAdSpins >= 2) return;
      const rewarded = await showRewardedAd('Дополнительное вращение колеса фортуны.');
      if (!rewarded) return;
      save.wheelAdSpins += 1;
    } else save.lastWheelDate = today;
    const rewardIndex = chooseWheelReward();
    save.pendingWheel = { rewardIndex, startedAt: Date.now() };
    persist();
    const wheel = $('#wheel');
    const turns = 5 + Math.floor(Math.random() * 3);
    const totalWeight = WHEEL_REWARDS.reduce((sum, reward) => sum + reward.weight, 0);
    const before = WHEEL_REWARDS.slice(0, rewardIndex).reduce((sum, reward) => sum + reward.weight, 0);
    const reward = WHEEL_REWARDS[rewardIndex];
    const chosenAngle = ((before + reward.weight * rand(.16, .84)) / totalWeight) * 360;
    wheel.style.transform = `rotate(${turns * 360 + 360 - chosenAngle}deg)`;
    $('#wheelSpinBtn').disabled = true;
    setTimeout(() => { finishPendingWheel(true); renderRewardsPanel(); }, 2250);
  }

  function showRewardedAd(reason) {
    if (adInFlight) return Promise.resolve(false);
    adInFlight = true;
    syncInteractionLayers();
    const finish = promise => promise.finally(() => {
      adInFlight = false;
      document.body.classList.remove('ad-busy');
      syncInteractionLayers();
    });
    document.body.classList.add('ad-busy');
    if (window.ysdk?.adv?.showRewardedVideo) {
      return finish(new Promise(resolve => {
        let rewarded = false;
        window.ysdk.adv.showRewardedVideo({
          callbacks: {
            onRewarded: () => { rewarded = true; },
            onClose: () => resolve(rewarded),
            onError: () => resolve(false)
          }
        });
      }));
    }
    els.adReason.textContent = reason;
    els.adOverlay.classList.remove('hidden');
    syncInteractionLayers();
    return finish(new Promise(resolve => { pendingAdResolver = resolve; }));
  }

  function resolveDemoAd(value) {
    els.adOverlay.classList.add('hidden');
    syncInteractionLayers();
    const resolver = pendingAdResolver;
    pendingAdResolver = null;
    if (resolver) resolver(value);
  }

  function openAdminTools() {
    if (!els.adminToolsOverlay || !els.adminToolsOverlay.classList.contains('hidden')) return;
    hideFoodInfo();
    lastFocusedElement = document.activeElement;
    els.adminToolsOverlay.classList.remove('hidden');
    els.adminMenuBtn?.setAttribute('aria-expanded', 'true');
    syncInteractionLayers();
    requestAnimationFrame(() => els.adminToolsOverlay.querySelector('.admin-tools-modal')?.focus({ preventScroll: true }));
    sound('tap');
    feedback(5);
  }

  function closeAdminTools() {
    if (!els.adminToolsOverlay || els.adminToolsOverlay.classList.contains('hidden')) return;
    els.adminToolsOverlay.classList.add('hidden');
    els.adminMenuBtn?.setAttribute('aria-expanded', 'false');
    syncInteractionLayers();
    if (lastFocusedElement?.focus) lastFocusedElement.focus({ preventScroll: true });
  }

  function closePanel() {
    els.panelOverlay.classList.add('hidden');
    syncInteractionLayers();
    if (lastFocusedElement?.focus) lastFocusedElement.focus();
  }

  function bindFallStick(button, side) {
    if (!button) return;
    const setPressed = (pressed, pointerId = null) => {
      if (run?.steer) run.steer[side] = pressed;
      button.classList.toggle('is-pressed', pressed);
      button.setAttribute('aria-pressed', String(pressed));
      if (pressed && pointerId !== null) {
        try { button.setPointerCapture(pointerId); } catch (_) { /* capture is optional */ }
      }
    };
    button.addEventListener('pointerdown', event => {
      if (!run || run.ended) return;
      event.preventDefault();
      if (run.geyserCapture && launchFromGeyser({ x: side === 'left' ? -1 : 1, y: 0 }, performance.now())) return;
      setPressed(true, event.pointerId);
      feedback(4);
    });
    const release = event => {
      setPressed(false);
      if (event?.pointerId !== undefined) {
        try { button.releasePointerCapture(event.pointerId); } catch (_) { /* pointer already released */ }
      }
    };
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', () => setPressed(false));
  }

  function clearFallSteering() {
    if (run?.steer) {
      run.steer.left = false;
      run.steer.right = false;
    }
    [els.steerLeftBtn, els.steerRightBtn].forEach(button => {
      if (!button) return;
      button.classList.remove('is-pressed');
      button.setAttribute('aria-pressed', 'false');
    });
  }

  // ===== СОБЫТИЯ И ЗАПУСК ПРИЛОЖЕНИЯ =====
  function bindEvents() {
    bindMenuSlimeInteractions();
    els.rerollBtn.addEventListener('click', rerollOffer);
    els.levelButtons?.addEventListener('click', event => {
      const button = event.target.closest('.level-btn');
      if (!button) return;
      selectLevel(Number(button.dataset.level));
    });
    els.homeWorldSelect?.addEventListener('change', event => selectHomeWorld(event.target.value));
    els.campaignModeBtn?.addEventListener('click', () => selectHomeMode('campaign'));
    els.endlessModeBtn?.addEventListener('click', () => selectHomeMode('endless'));
    els.startDropBtn.addEventListener('click', startDrop);
    els.startEndlessBtn?.addEventListener('click', () => startDrop({ endless: true }));
    els.adminMenuBtn?.addEventListener('click', openAdminTools);
    els.closeAdminToolsBtn?.addEventListener('click', closeAdminTools);
    els.adminToolsOverlay?.addEventListener('click', event => { if (event.target === els.adminToolsOverlay) closeAdminTools(); });
    els.adminRestartBtn.addEventListener('click', restartDraftFromAdmin);
    els.adminPrevWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(-1));
    els.adminNextWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(1));
    els.adminUnlockAllBtn?.addEventListener('click', unlockEverythingFromAdmin);
    els.adminResetProgressBtn?.addEventListener('click', resetProgressFromAdmin);
    els.abilityBtn.addEventListener('click', activateAbility);
    els.shaft.addEventListener('pointerdown', event => {
      if (!run?.geyserCapture || run.ended || run.paused) return;
      if (event.target.closest?.('button')) return;
      event.preventDefault();
      launchGeyserTowardClientPoint(event.clientX, event.clientY, performance.now());
    });
    bindFallStick(els.steerLeftBtn, 'left');
    bindFallStick(els.steerRightBtn, 'right');
    els.endRunBtn.addEventListener('click', openRunMenu);
    els.resumeRunBtn?.addEventListener('click', continueRunFromMenu);
    els.toggleRunSoundBtn?.addEventListener('click', toggleRunSound);
    els.restartRunBtn?.addEventListener('click', restartCurrentRun);
    els.finishRunBtn?.addEventListener('click', finishRunFromMenu);
    els.runMenuOverlay?.addEventListener('click', event => { if (event.target === els.runMenuOverlay) continueRunFromMenu(); });
    els.resultMultiplierBtn.addEventListener('click', claimResultMultiplier);
    els.continueBtn.addEventListener('click', continueAfterRun);
    els.gameCompleteHomeBtn?.addEventListener('click', closeGameCompleteToHome);
    els.playEndlessBtn?.addEventListener('click', startEndlessFromCompletion);
    els.closePanelBtn.addEventListener('click', closePanel);
    els.panelOverlay.addEventListener('click', event => { if (event.target === els.panelOverlay) closePanel(); });
    els.secretDiscoveryOverlay?.addEventListener('click', dismissSecretDiscovery);
    els.adRewardBtn.addEventListener('click', () => resolveDemoAd(true));
    els.adCancelBtn.addEventListener('click', () => resolveDemoAd(false));
    $$('[data-panel]').forEach(button => button.addEventListener('click', () => renderPanel(button.dataset.panel)));
    document.addEventListener('selectstart', event => {
      if (!event.target.closest?.('input,textarea,[contenteditable="true"]')) event.preventDefault();
    });
    document.addEventListener('copy', event => {
      if (event.target.closest?.('#app,.overlay') && !event.target.closest?.('input,textarea,[contenteditable="true"]')) event.preventDefault();
    });
    document.addEventListener('dragstart', event => {
      if (event.target.closest?.('#app,.overlay')) event.preventDefault();
    });
    document.addEventListener('contextmenu', event => {
      if (event.target.closest?.('#app,.overlay')) event.preventDefault();
    });
    document.addEventListener('pointerdown', event => {
      if (els.foodInfo.classList.contains('hidden')) return;
      if (event.target.closest('#foodInfo')) {
        hideFoodInfo();
        return;
      }
      if (event.target.closest('.food-card,.stomach-quick-slot')) return;
      hideFoodInfo();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAllSounds();
        persist();
        flushCloudSave(true);
        autoResumeRunAfterVisibility = pauseRun({ allowPortal: true });
      } else if (autoResumeRunAfterVisibility) {
        autoResumeRunAfterVisibility = false;
        resumeRun();
      }
    });
    window.addEventListener('pagehide', () => {
      persist();
      flushCloudSave(true);
    });
    window.addEventListener('resize', () => {
      syncPerformanceMode();
      if (run && !run.ended) prepareCanvas();
      else if (els.homeScreen.classList.contains('active')) prepareMenuSlimeCanvas();
    });
    document.addEventListener('keydown', event => {
      if (run?.geyserCapture && !run.paused && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const direction = {
          ArrowLeft: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
          ArrowUp: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 }
        }[event.key];
        launchFromGeyser(direction, performance.now());
        return;
      }
      if (event.key !== 'Escape') return;
      if (secretSequenceActive && secretRevealCanClose) dismissSecretDiscovery();
      else if (!els.adOverlay.classList.contains('hidden')) resolveDemoAd(false);
      else if (!els.runMenuOverlay.classList.contains('hidden')) continueRunFromMenu();
      else if (!els.gameCompleteOverlay.classList.contains('hidden')) closeGameCompleteToHome();
      else if (!els.adminToolsOverlay.classList.contains('hidden')) closeAdminTools();
      else if (!els.panelOverlay.classList.contains('hidden')) closePanel();
      else hideFoodInfo();
    });
  }

  async function init() {
    await initializeReliableSaves();
    syncPerformanceMode();
    initializeInteractionLayers();
    bindEvents();
    updatePersistentUI();
    if (save.pendingWheel) finishPendingWheel(false);
    if (restoreSession(save.activeDraft)) {
      showScreen('home');
      renderDraft();
      persist();
    } else newDraft();
    yandexPlatform?.ysdk?.features?.LoadingAPI?.ready?.();
    window.SlimeGameDebug = {
      reset: () => {
        const storage = saveStorage || browserStorage();
        storage?.removeItem(SAVE_KEY);
        storage?.removeItem(SAVE_BACKUP_KEY);
        location.reload();
      },
      addCoins: (amount = 1000) => { save.coins += amount; persist(); },
      unlockFood: () => { save.conveyorLevel = 5; persist(); newDraft(); },
      secretDiscovery: (foodId = '', play = false) => forceSecretDiscoveryForDebug(foodId, { play }),
      maxStomach: () => { save.stomachLevel = 6; persist(); newDraft(); },
      maxRerolls: () => { save.rerollLevel = 3; persist(); newDraft(); },
      setNextBonuses: ({ epic = 0, mass = 0, rerolls = 0 } = {}) => {
        save.pendingEpicBoost = clamp(Math.round(epic), 0, 10);
        save.pendingMassBoost = clamp(Math.round(mass), 0, 100);
        save.pendingExtraRerolls = clamp(Math.round(rerolls), 0, 20);
        save.activeDraft = null;
        session = null;
        persist({ captureDraft: false });
      },
      setPendingWheel: (rewardIndex = 0) => {
        save.pendingWheel = { rewardIndex: clamp(Math.round(rewardIndex), 0, WHEEL_REWARDS.length - 1), startedAt: Date.now() };
        persist();
      },
      specialFx: (type = 'bomb') => {
        if (!run || run.ended || !['bomb', 'heal', 'spring', 'cryo', 'snowflake', 'appleMint', 'appleRed', 'geyser', 'meteor'].includes(type)) return false;
        const x = clamp(run.slime.x + (type === 'heal' ? 72 : 0), 50, VIEW_W - 50);
        const y = run.slime.y + 58;
        if (type === 'meteor') {
          const row = clamp(Math.floor((run.slime.y - 190) / run.cellSize) + 1, 0, Math.max(...run.blocks.map(block => block.row)));
          activateMeteorShower({ row, col: clamp(Math.floor((x - run.gridOffsetX) / run.cellSize), 0, run.columns - 1) });
          return true;
        }
        spawnSpecialBurst(type, x, y, 0, -1);
        if (type === 'heal') {
          const timestamp = performance.now();
          run.healGlowUntil = timestamp + 980;
        } else if (type === 'snowflake') {
          run.freezeUntil = performance.now() + 3000;
          run.frozenEmotion = 'surprised';
        } else if (type === 'appleMint' || type === 'appleRed') {
          run.appleGlowUntil = performance.now() + (type === 'appleMint' ? 1450 : 1650);
          run.appleGlowType = type === 'appleMint' ? 'mint' : 'red';
        }
        return true;
      },
      blockSummary: () => run ? run.blocks.reduce((summary, block) => {
        const key = block.special || (block.hazard ? 'hazard' : block.tier);
        summary[key] = (summary[key] || 0) + 1;
        return summary;
      }, {}) : null,
      save: () => structuredClone(save),
      saveStatus: () => ({
        storage: saveStorage === browserStorage() ? 'local' : yandexPlatform?.available ? 'yandex-safe' : 'fallback',
        cloud: Boolean(yandexPlatform?.player?.setData),
        updatedAt: saveUpdatedAt,
        revision: saveRevision
      }),
      flushSave: () => flushCloudSave(true),
      foods: () => FOODS.map(food => ({ ...food })),
      worlds: () => WORLDS.map(world => ({ ...world }))
    };
  }

  init().catch(error => {
    console.error('Game initialization failed:', error);
    saveStorage = browserStorage();
    bindEvents();
    updatePersistentUI();
    newDraft();
  });
})();
