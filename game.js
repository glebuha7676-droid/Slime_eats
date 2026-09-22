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
    ORE_TYPES,
    SKINS,
    UPGRADES: UPGRADE_DATA
  } = CONFIG;
  const WORLDS = structuredClone(CONFIG.WORLDS);
  const ACTIVE_WORLDS = WORLDS.filter(world => world.active !== false);
  const ACTIVE_WORLD_IDS = Object.freeze(ACTIVE_WORLDS.map(world => world.id));
  const defaultSave = structuredClone(CONFIG.DEFAULT_SAVE);
  const {
    FOODS,
    WORLD_SPRITES,
    WORLD_BACKGROUNDS,
    CRACK_STAGE_SPRITES,
    VFX_SPRITES,
    versionedAsset,
    ensureWorldSprites,
    projectSprite,
    foodArtMarkup,
    centerFoodThumbnail,
    uiIconMarkup
  } = ASSETS;
  const { drawSlimeAvatar } = window.SlimeAvatarRenderer;
  const BASE_HEALTH = 100;
  const BASE_DAMAGE = 10;
  const BASE_SHIELD = 25;
  const BASE_SHIELD_CHARGES = 2;
  const STOMACH_CAPACITY = 3;
  const FREEZE_ZONE_CHARGE_MS = 1000;
  const FREEZE_ZONE_DURATION_MS = 3000;
  const UNLIMITED_FREE_REROLLS = true;
  const SPEED_PRESSURE_RAMP_MS = 1000;
  const SPEED_BURST_CHARGE_MS = 5000;
  const SPEED_BURST_WINDOW_MS = 1400;
  const COSMOS_ASCENT_ARM_DISTANCE = 1.15;
  const COSMOS_ENTRY_FALL_DISTANCE = .9;
  const ELEMENTAL_ABILITY_DURATION_MS = Object.freeze({
    frost: 3000,
    electric: 3000,
    fire: 5000,
    cosmos: 3000,
    gigantism: 3000,
    wind: 3000,
    gold: 3000,
    explosion: 3000,
    mass: 4000,
    mobility: 5000
  });

  const WORLD_CONTENT = window.SlimeWorldCatalog?.load?.() || { worlds: [] };
  let GAME_BALANCE = window.SlimeBalance?.load?.() || window.SlimeBalance?.defaults?.() || null;
  function contentWorld(worldId) { return WORLD_CONTENT.worlds?.find(item => +item.id === +worldId) || null; }
  function contentBlock(worldId, id) { return contentWorld(worldId)?.blocks?.find(item => item.id === id) || null; }
  function contentLevel(worldId, level) { return contentWorld(worldId)?.levels?.[clamp(Math.round(level) - 1, 0, LEVEL_COUNT - 1)] || null; }
  function gameplayZone(worldId, level, progress) { return window.SlimeBalance?.getZone?.(GAME_BALANCE, worldId, level, progress) || null; }
  WORLDS.forEach(world => {
    const edited = contentWorld(world.id);
    if (!edited) return;
    world.name = edited.name || world.name;
    world.accent = edited.accent || world.accent;
    world.sky = edited.background?.top || world.sky;
    world.earth = edited.background?.top || world.earth;
    world.deep = edited.background?.bottom || world.deep;
    world.backgroundArt = edited.background || null;
  });

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const els = {
    phoneViewport: $('#phoneViewport'),
    app: $('#app'),
    coinsLabel: $('#coinsLabel'), runCoinsGain: $('#runCoinsGain'),
    researchUnitsLabel: $('#researchUnitsLabel'), researchProgressBar: $('#researchProgressBar'),
    worldLabel: $('#worldLabel'), worldIcon: $('#worldIcon'),
    worldEyebrow: $('#worldEyebrow'), levelPassedBadge: $('#levelPassedBadge'), worldProgressPrefix: $('#worldProgressPrefix'), worldProgressText: $('#worldProgressText'),
    worldProgressBar: $('#worldProgressBar'), worldProgressMarker: $('#worldProgressMarker'), worldHint: $('#worldHint'),
    homeScreen: $('#homeScreen'), dropScreen: $('#dropScreen'), slimeStage: $('#slimeStage'), slime: $('#slime'),
    menuSlimeCanvas: $('#menuSlimeCanvas'), menuSlimeMouth: $('#menuSlimeMouth'),
    foodInside: $('#foodInside'), levelButtons: $('#levelButtons'), levelDepthLabel: $('#levelDepthLabel'),
    healthCompare: $('#healthCompare'), damageCompare: $('#damageCompare'), shieldCompare: $('#shieldCompare'),
    startDropLabel: $('#startDropLabel'), adminMenuBtn: $('#adminMenuBtn'), adminToolsOverlay: $('#adminToolsOverlay'),
    closeAdminToolsBtn: $('#closeAdminToolsBtn'), adminRestartBtn: $('#adminRestartBtn'),
    adminPrevWorldBtn: $('#adminPrevWorldBtn'), adminNextWorldBtn: $('#adminNextWorldBtn'),
    adminWorldValue: $('#adminWorldValue'), adminUnlockAllBtn: $('#adminUnlockAllBtn'), adminResetProgressBtn: $('#adminResetProgressBtn'),
    adminInfiniteFlasksBtn: $('#adminInfiniteFlasksBtn'), adminInfiniteFlasksState: $('#adminInfiniteFlasksState'),
    conveyor: $('#conveyor'), foodChoices: $('#foodChoices'), conveyorDispensers: $('#conveyorDispensers'), conveyorChoiceCount: $('#conveyorChoiceCount'), rerollBtn: $('#rerollBtn'), rerollTitle: $('#rerollTitle'), rerollText: $('#rerollText'),
    stomachQuickSlots: $('#stomachQuickSlots'),
    recipeCategorySlots: $('#recipeCategorySlots'), slimeFeedCount: $('#slimeFeedCount'),
    playSetupCard: $('#playSetupCard'), homeWorldPicker: $('#homeWorldPicker'), homeWorldMenu: $('#homeWorldMenu'),
    homeWorldSelect: $('#homeWorldSelect'), homeWorldPickerIcon: $('#homeWorldPickerIcon'),
    homeWorldPickerEyebrow: $('#homeWorldPickerEyebrow'), homeWorldPickerName: $('#homeWorldPickerName'), homeWorldBest: $('#homeWorldBest'),
    campaignModeBtn: $('#campaignModeBtn'), endlessModeBtn: $('#endlessModeBtn'),
    endlessModeHint: $('#endlessModeHint'), campaignModePanel: $('#campaignModePanel'), endlessModePanel: $('#endlessModePanel'),
    endlessBestScore: $('#endlessBestScore'), endlessBestDepth: $('#endlessBestDepth'), endlessBestLaps: $('#endlessBestLaps'),
    endlessRuns: $('#endlessRuns'), startDropBtn: $('#startDropBtn'), startEndlessBtn: $('#startEndlessBtn'),
    depthLabel: $('#depthLabel'), runHeartHud: $('.shaft-health'), runHearts: $$('.run-heart'), runHeartCount: $('#runHeartCount'),
    runResearchHud: $('#runResearchHud'), runResearchScore: $('#runResearchScore'), runResearchGain: $('#runResearchGain'),
    routeProgress: $('#routeProgress'), routeBestMarker: $('#routeBestMarker'), routeBestLabel: $('#routeBestLabel'),
    routeSlimeMarker: $('#routeSlimeMarker'), routeTargetLabel: $('#routeTargetLabel'),
    shaft: $('#shaft'), canvas: $('#physicsCanvas'), impactText: $('#impactText'),
    touchJoystick: $('#touchJoystick'),
    abilityBtn: $('#abilityBtn'), abilityPercent: $('#abilityPercent'), abilityText: $('#abilityText'), endRunBtn: $('#endRunBtn'),
    runMenuOverlay: $('#runMenuOverlay'), resumeRunBtn: $('#resumeRunBtn'), restartRunBtn: $('#restartRunBtn'),
    finishRunBtn: $('#finishRunBtn'), toggleRunSoundBtn: $('#toggleRunSoundBtn'), runSoundIcon: $('#runSoundIcon'), runSoundLabel: $('#runSoundLabel'),
    panelOverlay: $('#panelOverlay'), panelTitle: $('#panelTitle'), panelContent: $('#panelContent'), closePanelBtn: $('#closePanelBtn'),
    resultOverlay: $('#resultOverlay'), resultBadge: $('#resultBadge'), resultTitle: $('#resultTitle'), resultText: $('#resultText'),
    resultWorldIcon: $('#resultWorldIcon'), resultWorldName: $('#resultWorldName'), resultCoins: $('#resultCoins'),
    resultResearchFlask: $('#resultResearchFlask'), resultResearchUnits: $('#resultResearchUnits'),
    resultResearchData: $('#resultResearchData'), resultResearchProgress: $('#resultResearchProgress'), resultResearchStream: $('#resultResearchStream'),
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
  let lastFocusedElement = null;
  let menuEmotionTimer = null;
  let menuChewStartedAt = 0;
  let menuGazeTimer = null;
  let foodFlyerToken = 0;
  let slimeInteractionTimer = null;
  let resultCoinAnimationId = 0;
  let resultResearchAnimationId = 0;
  let runResearchPulseTimer = 0;
  let resultRevealToken = 0;
  let autoResumeRunAfterVisibility = false;
  let activeLaboratoryTab = 'mutations';
  let selectedConveyorSlot = 0;
  let selectedLaboratoryMutationId = 'fire';
  let laboratoryReplaceMode = false;
  const RESULT_MULTIPLIERS = [.5, 1, 1.5, 2, 1.5, 1, .5];
  const RESULT_SWEEP_MS = 900;
  const MUTATION_STEPS = 10;
  const STARTER_MUTATIONS = Object.freeze([
    { id: 'fire', name: 'ОГОНЬ', image: 'assets/ui/recipe-categories/emblem-v2-fire.png' },
    { id: 'electric', name: 'ЭЛЕКТРИЧЕСТВО', image: 'assets/ui/recipe-categories/emblem-v2-electric.png' },
    { id: 'frost', name: 'МОРОЗ', image: 'assets/ui/recipe-categories/emblem-v2-frost.png' }
  ]);
  const MUTATION_DISCOVERIES = Object.freeze([
    { id: 'explosion', name: 'ВЗРЫВ', image: 'assets/ui/recipe-categories/emblem-v2-explosion.png' },
    { id: 'wind', name: 'ВЕТЕР', image: 'assets/ui/recipe-categories/emblem-v2-wind.png' },
    { id: 'cosmos', name: 'КОСМОС', image: 'assets/ui/recipe-categories/emblem-v2-cosmos.png' },
    { id: 'gigantism', name: 'ГИГАНТИЗМ', image: 'assets/ui/recipe-categories/emblem-v2-gigantism.png' }
  ]);
  const MUTATION_DETAILS = Object.freeze({
    fire: { stage1: 'Поджигает повреждённые блоки и наносит им дополнительный урон.', stage2: 'Огонь распространяется сильнее и помогает быстрее прожигать путь.' },
    electric: { stage1: 'Накапливает электрический заряд во время столкновений.', stage2: 'Разряд становится мощнее и цепляет больше целей.' },
    frost: { stage1: 'Смягчает опасные столкновения и охлаждает препятствия.', stage2: 'Мороз крепнет и даёт слайму более надёжную защиту.' },
    explosion: { stage1: 'Разрушенные блоки заряжают локальный взрыв.', stage2: 'Взрыв срабатывает чаще и задевает больше соседних блоков.' },
    wind: { stage1: 'Ускоряет отскок и делает движение слайма отзывчивее.', stage2: 'Открывает воздушный рывок, пробивающий несколько блоков.' },
    cosmos: { stage1: 'Меняет направление притяжения и помогает управлять падением.', stage2: 'Заряжает кометный вход и позволяет пробивать препятствия.' },
    gigantism: { stage1: 'Увеличивает силу удара по обычным блокам.', stage2: 'Лишний урон переносится на соседнее препятствие.' }
  });
  const MUTATION_SYNTH_COLORS = Object.freeze({
    fire: { filter: 'hue-rotate(214deg) saturate(1.55) brightness(1.08)', glow: '#ff6b32' },
    electric: { filter: 'hue-rotate(292deg) saturate(1.35) brightness(1.14)', glow: '#ffe43d' },
    frost: { filter: 'hue-rotate(42deg) saturate(1.12) brightness(1.16)', glow: '#6eeaff' },
    explosion: { filter: 'hue-rotate(218deg) saturate(1.75) brightness(1.03)', glow: '#ff4d35' },
    wind: { filter: 'hue-rotate(7deg) saturate(.82) brightness(1.15)', glow: '#72efc4' },
    cosmos: { filter: 'hue-rotate(105deg) saturate(1.72) brightness(.92)', glow: '#bd62ff' },
    gigantism: { filter: 'hue-rotate(340deg) saturate(1.24) brightness(1.08)', glow: '#9ceb4c' }
  });
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
  let menuLaunchInProgress = false;
  const menuReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const menuCategoryVisual = {
    fire: 0, fireFrom: 0, fireTarget: 0, fireStartedAt: 0,
    frost: 0, frostFrom: 0, frostTarget: 0, frostStartedAt: 0,
    electric: 0, electricFrom: 0, electricTarget: 0, electricStartedAt: 0,
    cosmos: 0, cosmosFrom: 0, cosmosTarget: 0, cosmosStartedAt: 0,
    gigantism: 0, gigantismFrom: 0, gigantismTarget: 0, gigantismStartedAt: 0,
    wind: 0, windFrom: 0, windTarget: 0, windStartedAt: 0,
    explosion: 0, explosionFrom: 0, explosionTarget: 0, explosionStartedAt: 0,
    mass: 0, massFrom: 0, massTarget: 0, massStartedAt: 0
  };
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
  let mutationAnimationToken = 0;
  let mutationAnimating = false;
  let pendingMutationReveal = null;
  let mutationFeedHoldTimer = 0;
  let mutationFeedHoldStartedAt = 0;
  let mutationFeedHoldActive = false;
  let adminInfiniteResearch = false;
  let save = loadSave();
  const { sound, stopAllSounds } = window.SlimeAudio.createAudioSystem({
    isEnabled: () => save.sound
  });
  let toastTimer = null;
  let dragState = null;
  let activeShopTab = 'skins';
  let activeEncyclopediaWorld = save.world;
  const ctx = els.canvas.getContext('2d');
  const menuSlimeCtx = els.menuSlimeCanvas.getContext('2d');

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
    return worldBest * 100000 + unlocks * 10000 + Math.max(0, +value.totalRuns || 0) * 100
      + Math.min(99, Math.floor(+value.researchUnits || 0)) + Math.min(.99, Math.max(0, +value.researchProgress || 0) / 100);
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
    const sourceStomachLevel = Math.round(+value.stomachLevel || 1);
    const merged = { ...structuredClone(defaultSave), ...value };
    merged.schemaVersion = defaultSave.schemaVersion;
    for (const obsoleteKey of ['conveyorLevel', 'rerollLevel', 'discoveredFoods', 'revealedSecretFoods', 'pendingEpicBoost', 'foodPity']) {
      delete merged[obsoleteKey];
    }
    merged.coins = Math.max(0, Number.isFinite(+merged.coins) ? +merged.coins : defaultSave.coins);
    merged.researchUnits = Math.max(0, Math.floor(Number.isFinite(+merged.researchUnits) ? +merged.researchUnits : 0));
    merged.researchProgress = clamp(Math.floor(Number.isFinite(+merged.researchProgress) ? +merged.researchProgress : 0), 0, 99);
    merged.unlockedMutations = Array.isArray(value.unlockedMutations)
      ? [...new Set(value.unlockedMutations.filter(id => MUTATION_DISCOVERIES.some(mutation => mutation.id === id)))]
      : [];
    const availableMutationIds = new Set([...STARTER_MUTATIONS.map(item => item.id), ...merged.unlockedMutations]);
    const requestedMutationPool = Array.isArray(value.activeMutationPool) ? value.activeMutationPool : defaultSave.activeMutationPool;
    merged.activeMutationPool = [...new Set(requestedMutationPool.filter(id => availableMutationIds.has(id)))].slice(0, 3);
    for (const starter of STARTER_MUTATIONS) {
      if (merged.activeMutationPool.length >= 3) break;
      if (!merged.activeMutationPool.includes(starter.id)) merged.activeMutationPool.push(starter.id);
    }
    const mutationCost = MUTATION_STEPS * (merged.unlockedMutations.length + 1);
    merged.mutationProgress = clamp(Math.floor(Number.isFinite(+merged.mutationProgress) ? +merged.mutationProgress : 0), 0, mutationCost);
    const requestedWorld = Math.round(+merged.world || 1);
    merged.world = ACTIVE_WORLD_IDS.includes(requestedWorld) ? requestedWorld : requestedWorld === 2 ? 3 : ACTIVE_WORLD_IDS[0];
    merged.stomachLevel = clamp(sourceStomachLevel, 1, UPGRADE_DATA.stomachLevel.max);
    merged.bestDepth = Math.max(0, +merged.bestDepth || 0);
    merged.endlessBestScore = { ...defaultSave.endlessBestScore };
    merged.endlessBestDepth = { ...defaultSave.endlessBestDepth };
    merged.endlessRuns = { ...defaultSave.endlessRuns };
    for (const world of WORLDS) {
      merged.endlessBestScore[world.id] = Math.max(0, Math.floor(+(value.endlessBestScore?.[world.id] || 0)));
      merged.endlessBestDepth[world.id] = Math.max(0, Math.floor(+(value.endlessBestDepth?.[world.id] || 0)));
      merged.endlessRuns[world.id] = Math.max(0, Math.floor(+(value.endlessRuns?.[world.id] || 0)));
    }
    merged.homeMode = value.homeMode === 'endless' ? 'endless' : 'campaign';
    merged.totalRuns = Math.max(0, Math.round(+merged.totalRuns || 0));
    merged.worldBest = { ...defaultSave.worldBest };
    for (const world of WORLDS) merged.worldBest[world.id] = clamp(+(value.worldBest?.[world.id] || 0), 0, world.targetDepth);
    const finalWorld = ACTIVE_WORLDS[ACTIVE_WORLDS.length - 1];
    merged.gameCompleted = Boolean(value.gameCompleted || (finalWorld && merged.worldBest[finalWorld.id] >= levelTargetDepth(finalWorld, LEVEL_COUNT)));
    merged.lastRunDepth = {};
    merged.levelFailures = {};
    for (const world of WORLDS) {
      for (let level = 1; level <= LEVEL_COUNT; level += 1) {
        const key = `${world.id}:${level}`;
        const targetDepth = levelTargetDepth(world, level);
        const recordedDepth = clamp(+(value.lastRunDepth?.[key] || 0), 0, targetDepth);
        const completedDepth = merged.worldBest[world.id] >= targetDepth ? targetDepth : 0;
        merged.lastRunDepth[key] = Math.max(recordedDepth, completedDepth);
        merged.levelFailures[key] = clamp(Math.round(+(value.levelFailures?.[key] || 0)), 0, 99);
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
    merged.pendingHealthBoost = Math.max(0, Math.round(+(value.pendingHealthBoost ?? value.pendingMassBoost) || 0));
    for (const key of ['pendingExtraRerolls', 'wheelAdSpins', 'dailyStreak']) {
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
      offersSeen: session.offersSeen,
      freeRerolls: session.freeRerolls,
      adRerolls: session.adRerolls,
      healthBoost: session.healthBoost
    };
  }

  function restoreSession(raw) {
    if (!raw || raw.worldId !== save.world || !Array.isArray(raw.foods) || !Array.isArray(raw.offer)) return false;
    const foodById = id => FOODS.find(food => food.id === id && foodAvailableInWorld(food));
    const foods = raw.foods.map(foodById).filter(Boolean).slice(0, STOMACH_CAPACITY);
    const offer = raw.offer.slice(0, 3).map(id => id ? foodById(id) || null : null);
    if (stomachIsFull(foods)) offer.length = 0;
    else while (offer.length < 3) offer.push(null);
    if (!offer.some(Boolean) && !foods.length) return false;
    session = {
      foods, offer,
      offersSeen: Math.max(1, Math.round(+raw.offersSeen || 1)),
      freeRerolls: 1,
      adRerolls: 0,
      healthBoost: clamp(+(raw.healthBoost ?? raw.massBoost) || 0, 0, 100),
      stats: {}, effects: {}, combo: null,
      rerollPending: false,
      offerTransition: false
    };
    if (session.offer.filter(Boolean).length < 3 && !stomachIsFull(foods)) generateOffer();
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

  const appleMobilePerformanceMode = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let mobilePerformanceMode = matchMedia('(pointer:coarse)').matches || window.innerWidth <= 540;
  const lowPowerPerformanceMode = appleMobilePerformanceMode
    || (navigator.deviceMemory && navigator.deviceMemory <= 4)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  let viewportSyncTimer = 0;
  let homeFitFrame = 0;
  let lastViewportHeight = 0;
  let lastViewportWidth = 0;

  function isMobileDevice() { return mobilePerformanceMode; }

  function isAppleMobileDevice() { return appleMobilePerformanceMode; }

  function isLowPowerDevice() { return lowPowerPerformanceMode; }

  function effectDensity() {
    return isMobileDevice() ? .56 : isLowPowerDevice() ? .62 : 1;
  }

  function scaledEffectCount(count, minimum = 1) {
    return Math.min(count, Math.max(minimum, Math.round(count * effectDensity())));
  }

  function particleLimit(limit) {
    const density = isMobileDevice() ? .58 : isLowPowerDevice() ? .66 : 1;
    return Math.max(54, Math.round(limit * density));
  }

  function trimParticles(limit) {
    if (!run?.particles) return;
    const maximum = particleLimit(limit);
    if (run.particles.length > maximum) run.particles.splice(0, run.particles.length - maximum);
  }

  function indexRunBlocks() {
    if (!run?.blocks) return;
    run.blocksByRow = new Map();
    run.blockRowOrigin = 190;
    if (run.blocks.length) {
      run.blockRowOrigin = Infinity;
      for (const block of run.blocks) {
        run.blockRowOrigin = Math.min(run.blockRowOrigin, block.y - block.row * run.cellSize);
      }
    }
    for (const block of run.blocks) {
      if (!run.blocksByRow.has(block.row)) run.blocksByRow.set(block.row, []);
      run.blocksByRow.get(block.row).push(block);
    }
  }

  function blocksNearY(y, radius, padding = 3) {
    if (!run?.blocksByRow) return run?.blocks || [];
    const origin = run.blockRowOrigin || 190;
    const firstRow = Math.floor((y - radius - padding - origin) / run.cellSize) - 1;
    const lastRow = Math.floor((y + radius + padding - origin) / run.cellSize) + 1;
    const nearby = [];
    for (let row = firstRow; row <= lastRow; row += 1) {
      const blocks = run.blocksByRow.get(row);
      if (blocks) nearby.push(...blocks);
    }
    return nearby;
  }

  function scheduleHomeFit() {
    if (homeFitFrame) return;
    homeFitFrame = requestAnimationFrame(syncHomeFit);
  }

  function syncHomeFit() {
    homeFitFrame = 0;
    if (!els?.homeScreen) return;
    els.homeScreen.style.setProperty('--home-fit-scale', '1');
    document.body.classList.remove('home-height-fitted');
    if (document.body.dataset.screen !== 'home' || !els.homeScreen.classList.contains('active')) return;

    const appStyles = getComputedStyle(els.app);
    const topbar = document.querySelector('.topbar.world-summary');
    const reservedHeight = (topbar?.offsetHeight || 0)
      + parseFloat(appStyles.paddingTop || 0)
      + parseFloat(appStyles.paddingBottom || 0)
      + 5;
    const availableHeight = Math.max(220, (lastViewportHeight || window.innerHeight) - reservedHeight);
    const naturalHeight = Math.max(1, els.homeScreen.scrollHeight, els.homeScreen.offsetHeight);
    const scale = clamp(availableHeight / naturalHeight, .42, 1);
    els.homeScreen.style.setProperty('--home-fit-scale', scale.toFixed(4));
    document.body.classList.toggle('home-height-fitted', scale < .995);
  }

  function syncViewportMetrics({ reset = false } = {}) {
    viewportSyncTimer = 0;
    const nextWidth = Math.round(window.visualViewport?.width || window.innerWidth || 0);
    const nextHeight = Math.round(window.visualViewport?.height || window.innerHeight || 0);
    if (!nextWidth || !nextHeight) return;
    const desktopPortrait = window.matchMedia('(min-width:700px)').matches;
    const framedHeight = Math.round(els.phoneViewport?.getBoundingClientRect().height || nextHeight);
    const layoutHeight = desktopPortrait ? framedHeight : nextHeight;
    const widthChanged = !lastViewportWidth || Math.abs(nextWidth - lastViewportWidth) > 2;
    if (desktopPortrait || reset || widthChanged || !lastViewportHeight) lastViewportHeight = layoutHeight;
    else lastViewportHeight = Math.min(lastViewportHeight, layoutHeight);
    lastViewportWidth = nextWidth;
    document.documentElement.style.setProperty('--app-height', `${lastViewportHeight}px`);
    document.documentElement.classList.toggle('compact-viewport', lastViewportHeight < 780);
    document.documentElement.classList.toggle('short-viewport', lastViewportHeight < 680);
    scheduleHomeFit();

    if (widthChanged) {
      mobilePerformanceMode = matchMedia('(pointer:coarse)').matches || window.innerWidth <= 540;
      document.documentElement.classList.toggle('mobile-lite', isMobileDevice());
      if (run && !run.ended) prepareCanvas();
      else if (els.homeScreen.classList.contains('active')) prepareMenuSlimeCanvas();
    }
  }

  function scheduleViewportMetrics(reset = false) {
    if (viewportSyncTimer) clearTimeout(viewportSyncTimer);
    viewportSyncTimer = setTimeout(() => syncViewportMetrics({ reset }), 140);
  }

  function syncPerformanceMode() {
    mobilePerformanceMode = matchMedia('(pointer:coarse)').matches || window.innerWidth <= 540;
    document.documentElement.classList.toggle('mobile-lite', isMobileDevice());
    document.documentElement.classList.toggle('low-power-device', isLowPowerDevice());
    document.documentElement.classList.toggle('ios-device', isAppleMobileDevice());
    syncViewportMetrics({ reset: !lastViewportHeight });
  }

  function visibleInteractionLayer() {
    return [els.adOverlay, els.gameCompleteOverlay, els.runMenuOverlay, els.resultOverlay, els.adminToolsOverlay, els.panelOverlay]
      .find(layer => layer && !layer.classList.contains('hidden')) || null;
  }

  function syncInteractionLayers() {
    const activeLayer = visibleInteractionLayer();
    const screen = document.body.dataset.screen || 'home';
    const modalOpen = Boolean(activeLayer || adInFlight);
    const pauseScene = modalOpen;
    els.app.inert = modalOpen;
    els.homeScreen.inert = modalOpen || screen !== 'home';
    els.dropScreen.inert = modalOpen || screen !== 'drop';
    [els.panelOverlay, els.adminToolsOverlay, els.runMenuOverlay, els.resultOverlay, els.gameCompleteOverlay, els.adOverlay].forEach(layer => {
      if (layer) layer.inert = layer !== activeLayer;
    });
    document.body.classList.toggle('ui-modal-open', pauseScene);
    if (pauseScene && menuSlimeAnimationId) {
      cancelAnimationFrame(menuSlimeAnimationId);
      menuSlimeAnimationId = 0;
    } else if (!pauseScene && screen === 'home') startMenuSlimeLoop();
  }

  function initializeInteractionLayers() {
    const observer = new MutationObserver(syncInteractionLayers);
    [els.panelOverlay, els.adminToolsOverlay, els.runMenuOverlay, els.resultOverlay, els.gameCompleteOverlay, els.adOverlay].forEach(layer => {
      if (layer) observer.observe(layer, { attributes: true, attributeFilter: ['class'] });
    });
    observer.observe(document.body, { childList: true });
    syncInteractionLayers();
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function round1(value) { return Math.round(value * 10) / 10; }
  function stomachFoodCount(foods = session?.foods || []) { return foods.length; }
  function canAddToStomach(food, foods = session?.foods || []) {
    return Boolean(food) && stomachFoodCount(foods) < STOMACH_CAPACITY;
  }
  function stomachIsFull(foods = session?.foods || []) {
    return stomachFoodCount(foods) >= STOMACH_CAPACITY;
  }
  function levelConfig(world, level) {
    const entries = WORLD_LEVELS[world.id];
    const index = clamp(Math.round(level) - 1, 0, LEVEL_COUNT - 1);
    const fallback = entries?.[index] || null;
    const edited = contentLevel(world.id, level);
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
    const worldIndex = Math.max(0, ACTIVE_WORLD_IDS.indexOf(Math.round(world?.id || ACTIVE_WORLD_IDS[0])));
    const levelIndex = clamp(Math.round(level || 1) - 1, 0, LEVEL_COUNT - 1);
    return 100 + worldIndex * 50 + levelIndex * 100;
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
  function worldDisplayNumber(worldId) {
    const index = ACTIVE_WORLD_IDS.indexOf(Number(worldId));
    return index >= 0 ? index + 1 : 0;
  }
  function currentWorld() { return WORLDS.find(world => world.id === Number(save.world)) || ACTIVE_WORLDS[0]; }
  function worldIsUnlocked(worldId) {
    const index = ACTIVE_WORLD_IDS.indexOf(Number(worldId));
    if (index < 0) return false;
    if (index === 0) return true;
    const world = ACTIVE_WORLDS[index];
    if ((save.worldBest?.[world.id] || 0) > 0 || save.world === world.id) return true;
    const previous = ACTIVE_WORLDS[index - 1];
    return Boolean(previous && (save.worldBest?.[previous.id] || 0) >= levelTargetDepth(previous, LEVEL_COUNT));
  }
  function skinById(id) { return SKINS.find(s => s.id === id) || SKINS[0]; }

  function showToast(message) {
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.add('show');
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  function feedback(pattern = 8) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

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
    if (els.homeWorldPickerEyebrow) els.homeWorldPickerEyebrow.textContent = `МИР ${worldDisplayNumber(world.id)}`;
    if (els.homeWorldPickerName) els.homeWorldPickerName.textContent = world.name;
    if (els.homeWorldBest) els.homeWorldBest.textContent = `${Math.floor(save.worldBest?.[world.id] || 0).toLocaleString('ru-RU')} М`;
    if (els.homeWorldSelect) {
      const selectedValue = String(world.id);
      els.homeWorldSelect.replaceChildren(...ACTIVE_WORLDS.map(item => {
        const option = document.createElement('option');
        const unlocked = worldIsUnlocked(item.id);
        option.value = String(item.id);
        option.disabled = !unlocked;
        option.textContent = `${unlocked ? '' : '🔒 '}${worldDisplayNumber(item.id)}. ${item.name}`;
        return option;
      }));
      els.homeWorldSelect.value = selectedValue;
    }
    if (els.homeWorldMenu) {
      const options = document.createDocumentFragment();
      ACTIVE_WORLDS.forEach(item => {
        const unlocked = worldIsUnlocked(item.id);
        const selected = item.id === world.id;
        const displayNumber = worldDisplayNumber(item.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `home-world-option${selected ? ' active' : ''}${unlocked ? '' : ' locked'}`;
        button.dataset.world = String(item.id);
        button.disabled = !unlocked;
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', String(selected));
        button.setAttribute('aria-label', unlocked ? `Мир ${displayNumber}. ${item.name}` : `Мир ${displayNumber} закрыт`);

        const emblem = document.createElement('span');
        emblem.className = 'home-world-option-icon';
        const image = document.createElement('img');
        image.src = versionedAsset(`assets/ui/world-icons/world-${item.id}.webp`);
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        emblem.appendChild(image);

        const copy = document.createElement('span');
        copy.className = 'home-world-option-copy';
        const eyebrow = document.createElement('small');
        eyebrow.textContent = `МИР ${displayNumber}`;
        const name = document.createElement('b');
        name.textContent = item.name;
        copy.append(eyebrow, name);

        const state = document.createElement('i');
        state.className = 'home-world-option-state';
        state.setAttribute('aria-hidden', 'true');
        if (selected && unlocked) {
          const check = document.createElement('span');
          check.className = 'home-world-option-check';
          check.textContent = '✓';
          state.appendChild(check);
        } else if (!unlocked) {
          const lock = document.createElement('img');
          lock.className = 'home-world-option-lock';
          lock.src = versionedAsset('assets/ui/level-lock.png');
          lock.alt = '';
          state.appendChild(lock);
        }
        button.append(emblem, copy, state);
        options.appendChild(button);
      });
      els.homeWorldMenu.replaceChildren(options);
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
      els.endlessModeBtn.disabled = false;
      els.endlessModeBtn.classList.toggle('locked', !endlessUnlocked);
      els.endlessModeBtn.removeAttribute('aria-disabled');
      els.endlessModeBtn.setAttribute('aria-label', endlessUnlocked
        ? 'Бесконечный режим'
        : 'Бесконечный режим. Откроется после прохождения игры');
      els.endlessModeBtn.title = endlessUnlocked ? 'Бесконечный режим' : 'Откроется после прохождения игры';
    }
    if (els.endlessModeHint) els.endlessModeHint.textContent = endlessUnlocked ? 'БЕЗ КОНЦА' : 'ОТКРОЕТСЯ ПОСЛЕ ИГРЫ';
    els.campaignModePanel?.classList.toggle('hidden', activeMode !== 'campaign');
    els.endlessModePanel?.classList.toggle('hidden', activeMode !== 'endless');
    const endlessScore = Math.max(0, ...ACTIVE_WORLDS.map(item => +(save.endlessBestScore?.[item.id] || 0)));
    const endlessDepth = Math.max(0, ...ACTIVE_WORLDS.map(item => +(save.endlessBestDepth?.[item.id] || 0)));
    const endlessLaps = Math.max(0, ...ACTIVE_WORLDS.map(item => Math.floor(+(save.endlessBestDepth?.[item.id] || 0) / Math.max(1, levelTargetDepth(item, LEVEL_COUNT)))));
    const endlessRunCount = ACTIVE_WORLDS.reduce((sum, item) => sum + Math.max(0, +(save.endlessRuns?.[item.id] || 0)), 0);
    if (els.endlessBestScore) els.endlessBestScore.textContent = formatCompactNumber(endlessScore);
    if (els.endlessBestDepth) els.endlessBestDepth.textContent = `${Math.floor(endlessDepth).toLocaleString('ru-RU')} М`;
    if (els.endlessBestLaps) els.endlessBestLaps.textContent = formatCompactNumber(endlessLaps);
    if (els.endlessRuns) els.endlessRuns.textContent = formatCompactNumber(endlessRunCount);
  }

  function selectHomeMode(mode) {
    const nextMode = mode === 'endless' ? 'endless' : 'campaign';
    setHomeWorldMenuOpen(false);
    if (nextMode === 'endless' && !save.gameCompleted) {
      showToast('Бесконечный режим откроется после прохождения игры');
      return;
    }
    if (save.homeMode === nextMode) return;
    save.homeMode = nextMode;
    sound('tap');
    feedback(6);
    renderHomePlaySetup();
    refreshConveyorStartCard();
    persist();
  }

  function setHomeWorldMenuOpen(open) {
    if (!els.homeWorldPicker || !els.homeWorldMenu) return;
    const next = Boolean(open);
    els.homeWorldMenu.hidden = !next;
    els.homeWorldPicker.classList.toggle('is-open', next);
    els.homeWorldPicker.setAttribute('aria-expanded', String(next));
    els.playSetupCard?.classList.toggle('world-menu-open', next);
    if (next) {
      requestAnimationFrame(() => els.homeWorldMenu.querySelector('.home-world-option.active:not(:disabled),.home-world-option:not(:disabled)')?.focus());
    }
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
    sound('tap');
    feedback(8);
    newDraft();
    showToast(`Мир ${worldDisplayNumber(nextWorldId)} · ${currentWorld().name}`);
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
    refreshConveyorStartCard();
  }

  function updatePersistentUI() {
    els.coinsLabel.textContent = formatCompactNumber(save.coins);
    els.coinsLabel.title = `${Math.floor(save.coins).toLocaleString('ru-RU')} монет`;
    if (els.researchUnitsLabel) els.researchUnitsLabel.textContent = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);
    if (els.researchProgressBar) els.researchProgressBar.style.width = `${save.researchProgress}%`;
    const researchWallet = els.researchUnitsLabel?.closest('.research-wallet');
    researchWallet?.setAttribute('aria-label', adminInfiniteResearch ? 'Исследование: бесконечные колбы' : `Исследование: ${save.researchUnits} единиц, заполнение ${save.researchProgress} из 100`);
    const world = currentWorld();
    document.body.dataset.world = String(world.id);
    ensureWorldSprites(world.id);
    const level = selectedLevelForWorld(world.id);
    const targetDepth = levelTargetDepth(world, level);
    const best = Math.min(targetDepth, Math.floor(save.worldBest[world.id] || 0));
    const worldProgress = clamp(best / targetDepth * 100, 0, 100);
    const levelCompleted = best >= targetDepth;
    updateWorldHeader();
    if (els.worldProgressPrefix) els.worldProgressPrefix.textContent = levelCompleted ? 'УРОВЕНЬ ПРОЙДЕН' : 'ВЫ ПРОШЛИ';
    els.worldProgressText.textContent = `${best} м`;
    els.worldProgressBar.style.width = `${worldProgress}%`;
    if (els.worldProgressMarker) els.worldProgressMarker.style.left = `${worldProgress}%`;
    els.worldProgressBar.parentElement.setAttribute('aria-valuenow', String(Math.round(worldProgress)));
    els.worldHint.textContent = `${targetDepth} М`;
    if (els.adminWorldValue) els.adminWorldValue.textContent = worldDisplayNumber(world.id) ? `МИР ${worldDisplayNumber(world.id)}` : 'МИР 2 · ПАУЗА';
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
        ? (run?.endless ? `МИР ${worldDisplayNumber(world.id)} · БЕСКОНЕЧНЫЙ РЕЖИМ` : `МИР ${worldDisplayNumber(world.id)} · УРОВЕНЬ ${level}`)
        : `МИР ${worldDisplayNumber(world.id)}`;
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
    flyer.className = 'swallow-fruit';
    const swallowMs = 340;
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

  const MENU_SLIME_STATES = ['booped', 'petting', 'petted', 'portal-surprised'];
  function clearMenuMealReaction() {
    clearTimeout(menuEmotionTimer);
    menuChewStartedAt = 0;
    els.slime?.classList.remove('eat', 'chewing', 'savoring', 'pleased', 'tracking-food', 'expect-food');
    els.slime?.style.removeProperty('--catch-time');
    els.slime?.style.removeProperty('--chew-time');
    els.slime?.style.removeProperty('--chew-count');
    els.slime?.style.removeProperty('--happy-time');
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
    scheduleHomeFit();
  }

  function newDraft() {
    resetRoomLaunchVisuals();
    menuLaunchInProgress = false;
    const bonusHealth = save.pendingHealthBoost || 0;
    save.pendingHealthBoost = 0;
    save.pendingExtraRerolls = 0;
    session = {
      foods: [], offer: [],
      offersSeen: 0,
      freeRerolls: 1,
      adRerolls: 0,
      healthBoost: bonusHealth,
      stats: { health: BASE_HEALTH, damage: BASE_DAMAGE, shield: BASE_SHIELD, shieldCharges: BASE_SHIELD_CHARGES, coinMultiplier: 1 },
      effects: {},
      combo: null,
      rerollPending: false,
      offerTransition: false
    };
    syncMenuCategoryVisuals({ instant: true });
    generateOffer();
    showScreen('home');
    els.conveyor.classList.add('is-running');
    renderDraft({ offerMotion: 'enter' });
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(async () => {
      if (!session) return;
      els.foodChoices.querySelectorAll('.tunnel-enter').forEach(card => {
        card.classList.remove('tunnel-enter');
        card.style.removeProperty('--conveyor-delay');
        card.style.removeProperty('--conveyor-duration');
      });
      await playConveyorDispense(reducedMotion);
      els.conveyor.classList.remove('is-running');
    }, reducedMotion ? 30 : 850);
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
    sound('tap');
    newDraft();
    showToast(`Админ: открыт мир ${save.world} — ${currentWorld().name}`);
  }

  function resetProgressFromAdmin() {
    if (!window.confirm('Сбросить весь прогресс, улучшения, исследование, монеты и текущий набор еды?')) return;
    const storage = saveStorage || browserStorage();
    try {
      storage?.removeItem(SAVE_KEY);
      storage?.removeItem(SAVE_BACKUP_KEY);
      for (const legacyKey of LEGACY_SAVE_KEYS) storage?.removeItem(legacyKey);
    } catch (error) {
      console.warn('Save reset cleanup failed:', error);
    }
    save = structuredClone(defaultSave);
    adminInfiniteResearch = false;
    saveUpdatedAt = Date.now();
    saveRevision += 1;
    session = null;
    run = null;
    sound('tap');
    newDraft();
    flushCloudSave(true);
    showToast('Прогресс полностью сброшен');
  }

  function unlockEverythingFromAdmin() {
    const coinGrant = 9999999;
    save.coins = Math.max(save.coins, coinGrant);
    save.researchUnits = Math.max(save.researchUnits, 9999);
    save.researchProgress = 0;
    save.world = 1;
    save.stomachLevel = 4;
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
    persist();
    sound('coin');
    feedback([20, 35, 20]);
    newDraft();
    showToast('Всё, кроме карточек, открыто · монеты и исследование выданы');
  }

  function syncAdminInfiniteFlasksUI() {
    els.adminInfiniteFlasksBtn?.classList.toggle('active', adminInfiniteResearch);
    els.adminInfiniteFlasksBtn?.setAttribute('aria-pressed', String(adminInfiniteResearch));
    els.adminInfiniteFlasksBtn?.setAttribute('aria-label', `${adminInfiniteResearch ? 'Выключить' : 'Включить'} бесконечные колбы исследования`);
    if (els.adminInfiniteFlasksState) els.adminInfiniteFlasksState.textContent = adminInfiniteResearch ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО';
  }

  function toggleAdminInfiniteFlasks() {
    adminInfiniteResearch = !adminInfiniteResearch;
    syncAdminInfiniteFlasksUI();
    updatePersistentUI();
    sound('tap');
    feedback(adminInfiniteResearch ? [5, 9, 5] : 5);
    showToast(adminInfiniteResearch ? 'Бесконечные колбы включены' : 'Бесконечные колбы выключены');
  }

  function foodAvailableInWorld(food) {
    if (!activeMutationFamilies().includes(foodRecipeFamily(food))) return false;
    if (food?.requiresMutation && !(save.unlockedMutations || []).includes(food.requiresMutation)) return false;
    return !Array.isArray(food.worlds) || !food.worlds.length || food.worlds.includes(save.world);
  }

  function allMutations() {
    return [...STARTER_MUTATIONS, ...MUTATION_DISCOVERIES];
  }

  function mutationById(id) {
    return allMutations().find(mutation => mutation.id === id) || null;
  }

  function mutationFoodFamily(id) {
    return id === 'frost' ? 'ice' : id === 'explosion' ? 'blast' : id;
  }

  function activeMutationFamilies() {
    return (save.activeMutationPool || ['frost', 'fire', 'electric']).map(mutationFoodFamily);
  }

  function completionRecipeFamily() {
    const counts = (session?.foods || []).reduce((result, food) => {
      const family = foodRecipeFamily(food);
      result[family] = (result[family] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).find(([, count]) => count === 2)?.[0] || '';
  }

  function randomFood(exclude = [], preferredFamily = '') {
    let pool = FOODS.filter(food => foodAvailableInWorld(food)
      && (!preferredFamily || foodRecipeFamily(food) === preferredFamily)
      && !exclude.includes(food.id));
    if (!pool.length) pool = FOODS.filter(food => foodAvailableInWorld(food) && !exclude.includes(food.id));
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  function generateOffer({ resetRerolls = true } = {}) {
    const offer = [null, null, null];
    const activeFamilies = activeMutationFamilies();
    const used = (session?.foods || []).map(food => food.id);
    const completionFamily = completionRecipeFamily();

    for (let i = 0; i < 3; i += 1) {
      const family = activeFamilies[i];
      const food = randomFood(used, family === completionFamily ? completionFamily : family);
      offer[i] = food;
      if (food) used.push(food.id);
    }
    session.offer = offer;
    if (resetRerolls) {
      session.freeRerolls = 1;
      session.adRerolls = 0;
    }
    session.offersSeen += 1;
    persist();
  }

  function mutationElementFxMarkup(family, extraClass = '') {
    const sourceFamily = String(family || '').toLowerCase();
    const normalizedFamily = sourceFamily === 'damage' ? 'fire' : sourceFamily === 'frost' ? 'ice' : sourceFamily;
    if (normalizedFamily === 'fire') {
      return `<span class="mutation-element-fx mutation-fire-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'ice') {
      return `<span class="mutation-element-fx mutation-frost-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'electric') {
      return `<span class="mutation-element-fx mutation-electric-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'cosmos') {
      return `<span class="mutation-element-fx mutation-cosmos-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'blast' || normalizedFamily === 'explosion') {
      return `<span class="mutation-element-fx mutation-blast-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'wind') {
      return `<span class="mutation-element-fx mutation-wind-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    return '';
  }

  function calculateStatsForFoods() {
    const stats = {
      health: BASE_HEALTH,
      damage: BASE_DAMAGE,
      shield: BASE_SHIELD,
      shieldCharges: BASE_SHIELD_CHARGES,
      coinMultiplier: 1
    };
    stats.health *= 1 + (session.healthBoost || 0) / 100;
    stats.health = clamp(Math.round(stats.health), 1, 999);
    stats.damage = clamp(Math.round(stats.damage), 1, 999);
    stats.shield = clamp(Math.round(stats.shield), 0, 999);
    stats.shieldCharges = clamp(Math.round(stats.shieldCharges), 1, 9);
    return { stats, effects: {}, combo: null };
  }

  function recalcStats() {
    const result = calculateStatsForFoods(session.foods);
    session.stats = result.stats;
    session.effects = result.effects;
    session.combo = result.combo;
  }

  function createStomachSlot(food, index, { locked = false } = {}) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `stomach-quick-slot ${locked ? 'locked' : ''} ${food ? 'filled' : ''}`;
    if (food) {
      slot.innerHTML = `<span class="slot-art">${foodArtMarkup(food, 'food-mini-model')}</span>`;
      centerFoodThumbnail(slot.querySelector('.food-mini-model'));
      slot.setAttribute('aria-label', `${index + 1}. ячейка. ${food.name}`);
      slot.title = food.name;
    } else if (locked) {
      slot.innerHTML = '<img class="slot-lock" src="assets/ui/lock.webp" alt="" aria-hidden="true">';
      slot.setAttribute('aria-label', `${index + 1}. ячейка желудка ещё не открыта`);
      slot.disabled = true;
    } else {
      slot.innerHTML = '<span class="slot-plus" aria-hidden="true"></span>';
      slot.setAttribute('aria-label', `${index + 1}. Пустая ячейка желудка`);
      slot.setAttribute('aria-disabled', 'true');
      slot.tabIndex = -1;
    }
    return slot;
  }

  function renderStomachSlots() {
    const capacity = STOMACH_CAPACITY;
    els.stomachQuickSlots?.replaceChildren();
    if (els.stomachQuickSlots) els.stomachQuickSlots.dataset.slots = String(STOMACH_CAPACITY);
    for (let index = 0; index < STOMACH_CAPACITY; index += 1) {
      els.stomachQuickSlots?.appendChild(createStomachSlot(session.foods[index], index));
    }
    els.stomachQuickSlots?.classList.toggle('is-full', stomachIsFull());
    if (els.slimeFeedCount) els.slimeFeedCount.textContent = `СЪЕДЕНО ${stomachFoodCount()} ИЗ ${STOMACH_CAPACITY}`;
    renderRecipeWorkbench();
  }

  const RECIPE_FAMILY_META = {
    fire: { glyph: '▲', label: 'ОГОНЬ' },
    ice: { glyph: '◆', label: 'ЛЁД' }, electric: { glyph: 'ϟ', label: 'ТОК' },
    cosmos: { glyph: '✦', label: 'КОСМОС' },
    gigantism: { glyph: '●', label: 'ГИГАНТИЗМ' },
    wind: { glyph: '≈', label: 'ВЕТЕР' },
    blast: { glyph: '✦', label: 'ВЗРЫВ' },
    mixed: { glyph: '•', label: 'ЕДА' }
  };

  const RECIPE_FAMILY_ICONS = Object.freeze({
    fire: 'assets/ui/recipe-categories/emblem-v2-fire.png',
    ice: 'assets/ui/recipe-categories/emblem-v2-frost.png',
    electric: 'assets/ui/recipe-categories/emblem-v2-electric.png',
    cosmos: 'assets/ui/recipe-categories/emblem-v2-cosmos.png',
    gigantism: 'assets/ui/recipe-categories/emblem-v2-gigantism.png',
    wind: 'assets/ui/recipe-categories/emblem-v2-wind.png',
    blast: 'assets/ui/recipe-categories/emblem-v2-explosion.png'
  });

  function foodRecipeFamily(food) {
    return String(food?.recipeFamily || 'mixed').toLowerCase();
  }

  function renderRecipeWorkbench() {
    if (!els.recipeCategorySlots) return;
    const visibleSlotCount = Math.min(3, STOMACH_CAPACITY);
    const slotFoods = Array.from({ length: visibleSlotCount }, (_, index) => session.foods[index] || null);
    const filledFamilies = slotFoods.filter(Boolean).map(foodRecipeFamily);
    const ultraFamily = filledFamilies.length === 3 && filledFamilies.every(family => family === filledFamilies[0])
      ? filledFamilies[0]
      : '';
    const previousUltraFamily = els.recipeCategorySlots.dataset.ultraFamily || '';
    const ultraIsNew = Boolean(ultraFamily && ultraFamily !== previousUltraFamily);

    els.recipeCategorySlots.replaceChildren();
    els.recipeCategorySlots.className = `recipe-category-slots${ultraFamily ? ` ultra-${ultraIsNew ? 'forming' : 'ready'} family-${ultraFamily}` : ''}`;
    if (ultraFamily) els.recipeCategorySlots.dataset.ultraFamily = ultraFamily;
    else delete els.recipeCategorySlots.dataset.ultraFamily;

    const cluster = document.createElement('span');
    cluster.className = 'recipe-category-cluster';
    for (let index = 0; index < visibleSlotCount; index += 1) {
      const food = slotFoods[index];
      const family = food ? foodRecipeFamily(food) : 'empty';
      const meta = RECIPE_FAMILY_META[family] || RECIPE_FAMILY_META.mixed;
      const marker = document.createElement('span');
      marker.className = `recipe-category-slot ${food ? `filled family-${family}` : 'empty'}`;
      const icon = RECIPE_FAMILY_ICONS[family];
      if (food && icon) marker.innerHTML = `<img src="${versionedAsset(icon)}" alt="" aria-hidden="true">`;
      else marker.textContent = food ? meta.glyph : '';
      marker.title = food ? meta.label : `Пустое место ${index + 1}`;
      marker.setAttribute('aria-label', food ? `${index + 1}. ${meta.label}` : `${index + 1}. Пусто`);
      cluster.appendChild(marker);
    }
    els.recipeCategorySlots.appendChild(cluster);

    if (!ultraFamily) return;
    const meta = RECIPE_FAMILY_META[ultraFamily] || RECIPE_FAMILY_META.mixed;
    const ultraMarker = document.createElement('span');
    ultraMarker.className = 'recipe-category-ultra';
    ultraMarker.title = `Ультраформа: ${meta.label}`;
    ultraMarker.setAttribute('aria-label', `Ультраформа: ${meta.label}`);
    const icon = RECIPE_FAMILY_ICONS[ultraFamily];
    if (icon) ultraMarker.innerHTML = `<img src="${versionedAsset(icon)}" alt="" aria-hidden="true">`;
    else ultraMarker.textContent = meta.glyph;
    const flash = document.createElement('span');
    flash.className = 'recipe-category-ultra-flash';
    flash.setAttribute('aria-hidden', 'true');
    els.recipeCategorySlots.append(ultraMarker, flash);
    if (ultraIsNew) {
      ultraMarker.addEventListener('animationend', () => {
        if (els.recipeCategorySlots.dataset.ultraFamily !== ultraFamily) return;
        els.recipeCategorySlots.classList.remove('ultra-forming');
        els.recipeCategorySlots.classList.add('ultra-ready');
      }, { once: true });
    }
  }

  function renderConveyorStartCard({ entering = false } = {}) {
    const world = currentWorld();
    const endless = save.homeMode === 'endless';
    const stageLabel = endless ? 'БЕСКОНЕЧНЫЙ РЕЖИМ' : `УРОВЕНЬ ${selectedLevelForWorld(world.id)}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `conveyor-start-card${entering ? ' launch-card-enter' : ''}`;
    button.setAttribute('aria-label', `${world.name}. ${stageLabel}. Начать падение`);
    button.innerHTML = `
      <span class="launch-card-booms" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="launch-card-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="launch-card-world"><small>МИР ${worldDisplayNumber(world.id)}</small><b>${world.name}</b></span>
      <span class="launch-card-stage">${stageLabel}</span>
      <span class="launch-card-action"><i aria-hidden="true"></i><b>СТАРТ</b><i aria-hidden="true"></i></span>`;
    button.addEventListener('click', () => { void beginRoomLaunch({ endless: save.homeMode === 'endless' }); });
    els.foodChoices.appendChild(button);
  }

  function refreshConveyorStartCard() {
    if (!stomachIsFull()) return;
    els.foodChoices?.replaceChildren();
  }

  function renderConveyorDispensers() {
    if (!els.conveyorDispensers) return;
    const foods = stomachIsFull()
      ? activeMutationFamilies().slice(0, 3).map((recipeFamily, index) => ({ id: `active-${index}-${recipeFamily}`, recipeFamily }))
      : (session?.offer || []);
    const offerKey = foods.map(food => food?.id || '-').join('|');
    els.conveyorDispensers.classList.toggle('hidden', !foods.length);
    if (els.conveyorDispensers.dataset.offerKey === offerKey) return;
    els.conveyorDispensers.dataset.offerKey = offerKey;
    els.conveyorDispensers.innerHTML = foods.map((food, index) => {
      if (!food) return '<span class="conveyor-dispenser empty" aria-hidden="true"></span>';
      const family = foodRecipeFamily(food);
      const icon = RECIPE_FAMILY_ICONS[family];
      return `<span class="conveyor-dispenser family-${family}" data-dispenser-index="${index}">
        <i class="conveyor-pipe-feed"></i>
        <span class="conveyor-pipe-socket">${icon ? `<img src="${versionedAsset(icon)}" alt="">` : ''}</span>
        <i class="conveyor-pipe-nozzle"><b></b></i>
        <i class="conveyor-pipe-pulse"></i>
      </span>`;
    }).join('');
  }

  async function playConveyorDispense(reducedMotion = false) {
    const cards = [...els.foodChoices.querySelectorAll('.conveyor-food-pick.awaiting-dispense')];
    if (!cards.length) return;
    const dispensers = [...(els.conveyorDispensers?.querySelectorAll('.conveyor-dispenser') || [])];
    els.conveyor.classList.add('is-dispensing');
    cards.forEach((card, index) => {
      const delayMs = reducedMotion ? 0 : index * 65;
      card.style.setProperty('--dispense-delay', `${delayMs}ms`);
      card.classList.remove('awaiting-dispense');
      card.classList.add('food-dropping');
      setTimeout(() => {
        if (card.isConnected) card.classList.add('food-ready');
      }, reducedMotion ? 0 : delayMs + 520);
      const dispenser = dispensers[index];
      if (dispenser) {
        dispenser.style.setProperty('--dispense-delay', `${delayMs}ms`);
        dispenser.classList.add('is-dispensing');
      }
    });
    await new Promise(resolve => setTimeout(resolve, reducedMotion ? 30 : 980));
    cards.forEach(card => {
      card.classList.remove('food-dropping');
      card.style.removeProperty('--dispense-delay');
    });
    dispensers.forEach(dispenser => {
      dispenser.classList.remove('is-dispensing');
      dispenser.style.removeProperty('--dispense-delay');
    });
    els.conveyor.classList.remove('is-dispensing');
  }

  async function settleConveyorArrival(reducedMotion = false) {
    await new Promise(resolve => setTimeout(resolve, reducedMotion ? 30 : 850));
    els.foodChoices.querySelectorAll('.tunnel-enter').forEach(card => {
      card.classList.remove('tunnel-enter');
      card.style.removeProperty('--conveyor-delay');
      card.style.removeProperty('--conveyor-duration');
    });
    await playConveyorDispense(reducedMotion);
  }

  function releaseConveyorControl() {
    const full = stomachIsFull();
    const rerollBlocked = session.rerollPending || session.offerTransition || adInFlight;
    els.rerollBtn.disabled = rerollBlocked || (!UNLIMITED_FREE_REROLLS && !full && session.freeRerolls <= 0 && session.adRerolls > 0);
    scheduleHomeFit();
  }

  function renderDraft({ offerMotion = 'static', showLaunchCard = true } = {}) {
    recalcStats();
    updatePersistentUI();
    const full = stomachIsFull();
    els.slimeStage?.classList.toggle('portal-ready', full);
    if (els.conveyorChoiceCount) {
      els.conveyorChoiceCount.textContent = full
        ? 'ВЫБОР ГОТОВ'
        : `ВЫБЕРИ ЕДУ ${stomachFoodCount()}/${STOMACH_CAPACITY}`;
    }

    const mealInProgress = ['eat', 'chewing', 'savoring'].some(name => els.slime.classList.contains(name));
    if (!mealInProgress) {
    }
    if (els.startDropLabel) els.startDropLabel.textContent = 'СТАРТ';
    if (els.startDropBtn) {
      els.startDropBtn.disabled = !full;
      els.startDropBtn.classList.toggle('stomach-locked', !full);
      els.startDropBtn.setAttribute('aria-label', full ? 'Начать падение' : `Сначала заполни желудок: ${stomachFoodCount()} из ${STOMACH_CAPACITY}`);
    }
    if (els.startEndlessBtn) {
      els.startEndlessBtn.disabled = !full || !save.gameCompleted;
      els.startEndlessBtn.classList.toggle('stomach-locked', !full);
    }
    els.conveyor.classList.remove('launch-ready');
    els.rerollBtn.disabled = session.rerollPending || session.offerTransition || adInFlight;

    els.slime.style.width = '124px';
    els.slime.style.height = '124px';

    els.foodInside.replaceChildren();
    renderStomachSlots();

    els.foodChoices.innerHTML = '';
    renderConveyorDispensers();
    session.offer.forEach((food, index) => {
      if (!food) {
        const gap = document.createElement('div');
        gap.className = 'conveyor-gap';
        gap.setAttribute('aria-hidden', 'true');
        els.foodChoices.appendChild(gap);
        return;
      }
      const button = document.createElement('button');
      const recipeFamily = foodRecipeFamily(food);
      const foodMutationFx = mutationElementFxMarkup(recipeFamily, 'food-mutation-fx');
      const tunnelInDistance = 112 + index * 110;
      const tunnelOutDistance = 112 + (session.offer.length - 1 - index) * 110;
      const cardLocked = !canAddToStomach(food);
      button.className = `conveyor-food-pick mutation-family-${recipeFamily} ${offerMotion === 'enter' ? 'tunnel-enter awaiting-dispense' : 'food-ready'} ${cardLocked ? 'locked' : ''}`;
      if (offerMotion === 'enter') {
        const arrivalSequence = Math.max(0, session.offer.length - 1 - index);
        button.style.setProperty('--conveyor-delay', `${arrivalSequence * 140}ms`);
        button.style.setProperty('--conveyor-duration', '520ms');
      }
      button.style.setProperty('--tunnel-in-distance', `${tunnelInDistance}%`);
      button.style.setProperty('--tunnel-in-mouth', `${Math.round(tunnelInDistance * .94)}%`);
      button.style.setProperty('--tunnel-out-cruise', `${Math.round(tunnelOutDistance * .72)}%`);
      button.style.setProperty('--tunnel-out-mouth', `${Math.round(tunnelOutDistance * .94)}%`);
      button.style.setProperty('--tunnel-out-distance', `${tunnelOutDistance}%`);
      button.dataset.foodId = food.id;
      button.dataset.offerIndex = String(index);
      button.innerHTML = `<span class="conveyor-plate" aria-hidden="true"></span>${foodMutationFx}<span class="food-model-wrap">${foodArtMarkup(food)}</span>`;
      button.type = 'button';
      button.setAttribute('aria-label', `${food.name}. Перетащи к слайму`);
      button.addEventListener('pointerdown', event => beginFoodDrag(event, food, index, button));
      els.foodChoices.appendChild(button);
    });
    const rerollBlocked = session.rerollPending || session.offerTransition || adInFlight;
    els.rerollBtn.classList.toggle('confirm-mode', full);
    els.rerollBtn.setAttribute('aria-label', full ? 'Выбор готов. Начать падение' : 'Обновить еду на конвейере');
    if (full) {
      if (els.rerollTitle) els.rerollTitle.textContent = 'ВЫБОР ГОТОВ';
      if (els.rerollText) els.rerollText.textContent = 'ЖЕЛУДОК ЗАПОЛНЕН';
      els.rerollBtn.classList.remove('ad-mode');
    } else if (UNLIMITED_FREE_REROLLS) {
      if (els.rerollTitle) els.rerollTitle.textContent = 'РЕРОЛЛ';
      if (els.rerollText) els.rerollText.textContent = 'БЕСПЛАТНО ∞';
      els.rerollBtn.classList.remove('ad-mode');
    } else if (session.freeRerolls > 0) {
      if (els.rerollTitle) els.rerollTitle.textContent = 'РЕРОЛЛ';
      if (els.rerollText) els.rerollText.textContent = 'БЕСПЛАТНО ×1';
      els.rerollBtn.classList.remove('ad-mode');
    } else if (session.adRerolls === 0) {
      if (els.rerollTitle) els.rerollTitle.textContent = 'РЕРОЛЛ';
      if (els.rerollText) els.rerollText.textContent = '▶ ВИДЕО';
      els.rerollBtn.classList.add('ad-mode');
    } else {
      if (els.rerollTitle) els.rerollTitle.textContent = 'ВЫБОР ГОТОВ';
      if (els.rerollText) els.rerollText.textContent = 'НОВАЯ ТРОЙКА ПОСЛЕ ВЫБОРА';
      els.rerollBtn.classList.remove('ad-mode');
    }
    els.rerollBtn.disabled = rerollBlocked || (!UNLIMITED_FREE_REROLLS && !full && session.freeRerolls <= 0 && session.adRerolls > 0);

    scheduleHomeFit();
  }

  function beginFoodDrag(event, food, offerIndex, source) {
    if (!canAddToStomach(food) || event.button > 0) return;
    event.preventDefault();
    source.setPointerCapture?.(event.pointerId);
    document.body.classList.add('food-dragging');
    els.slime.classList.add('expect-food', 'tracking-food');
    const sourceRectAtStart = source.getBoundingClientRect();
    setMenuGazePoint(sourceRectAtStart.left + sourceRectAtStart.width / 2, sourceRectAtStart.top + sourceRectAtStart.height / 2);
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    let ghost = null;
    let dragFrame = 0;
    let dragX = startX;
    let dragY = startY;

    const paintDrag = () => {
      dragFrame = 0;
      setMenuGazePoint(dragX, dragY);
      if (!moved || !ghost) return;
      ghost.style.left = `${dragX}px`;
      ghost.style.top = `${dragY}px`;
      const accepted = pointInsideElement(dragX, dragY, els.slime);
      ghost.classList.toggle('accept', accepted);
      els.slime.classList.toggle('drop-ready', accepted);
    };

    const onMove = moveEvent => {
      if (moveEvent.cancelable) moveEvent.preventDefault();
      dragX = moveEvent.clientX;
      dragY = moveEvent.clientY;
      const distance = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!moved && distance > 7) {
        moved = true;
        ghost = document.createElement('div');
        ghost.className = 'food-drag-ghost';
        ghost.innerHTML = `<span class="food-drag-art">${foodArtMarkup(food, 'food-drag-model')}</span>`;
        document.body.appendChild(ghost);
        source.classList.add('drag-source');
      }
      if (!dragFrame) dragFrame = requestAnimationFrame(paintDrag);
    };

    const onUp = upEvent => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      if (dragFrame) cancelAnimationFrame(dragFrame);
      source.releasePointerCapture?.(event.pointerId);
      document.body.classList.remove('food-dragging');
      els.slime.classList.remove('drop-ready', 'expect-food', 'tracking-food');
      const cancelled = upEvent.type === 'pointercancel';
      const accepted = !cancelled && moved && pointInsideElement(upEvent.clientX, upEvent.clientY, els.slime);
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
        source.classList.add('food-picked');
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
    if (session.offerTransition) return;
    const food = session.offer[offerIndex];
    if (!food) return;
    if (!canAddToStomach(food)) return;
    clearMenuSlimeInteraction();
    animateFoodToMouth(food, source);
    const previousCombo = session.combo?.name || '';
    session.foods.push(food);
    session.offer[offerIndex] = null;
    const mealReaction = { catchMs: 300, chewMs: 680, chewTime: '.17s', chews: 4, happyMs: 560 };
    sound('eat', {
      biteDelay: Math.max(180, mealReaction.catchMs - 20),
      swallowDelay: mealReaction.catchMs + mealReaction.chewMs - 70
    });
    clearMenuMealReaction();
    els.slime.style.setProperty('--catch-time', `${mealReaction.catchMs}ms`);
    els.slime.style.setProperty('--chew-time', mealReaction.chewTime);
    els.slime.style.setProperty('--chew-count', String(mealReaction.chews));
    els.slime.style.setProperty('--happy-time', `${mealReaction.happyMs}ms`);
    void els.slime.offsetWidth;
    els.slime.classList.add('eat');
    menuEmotionTimer = setTimeout(() => {
      els.slime.classList.remove('eat', 'expect-food', 'tracking-food');
      els.slime.classList.add('chewing');
      menuChewStartedAt = performance.now();
      resetMenuGaze();
      menuEmotionTimer = setTimeout(() => {
        els.slime.classList.remove('chewing');
        const revealMeal = () => {
          els.slime.classList.remove('savoring');
          els.slime.classList.add('pleased');
          recalcStats();
          syncMenuCategoryVisuals();
          sound('happy');
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
    persist();
    feedback(8);
    if (session.combo && session.combo.name !== previousCombo) showToast(`${session.combo.icon} Комбо: ${session.combo.name} — ${session.combo.text}`);
    void advanceConveyorAfterChoice(offerIndex, source);
  }

  async function advanceConveyorAfterChoice(chosenIndex, source) {
    if (!session || session.offerTransition) return;
    session.offerTransition = true;
    els.conveyor.classList.add('is-running', 'is-selecting');
    const cards = [...els.foodChoices.querySelectorAll('.conveyor-food-pick')];
    cards.forEach(card => {
      const index = Number(card.dataset.offerIndex || 0);
      const sequence = Math.max(0, session.offer.length - 1 - index);
      card.style.setProperty('--conveyor-delay', `${sequence * 70}ms`);
      card.style.setProperty('--conveyor-duration', index === chosenIndex ? '410ms' : '470ms');
      card.classList.add('leaving');
    });
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    await new Promise(resolve => setTimeout(resolve, reducedMotion ? 30 : 620));
    if (stomachIsFull()) {
      session.offer = [];
      session.offerTransition = false;
      els.conveyor.classList.remove('is-running', 'is-selecting');
      renderDraft({ showLaunchCard: false });
      persist();
      sound('happy');
      feedback([8, 18, 8]);
      return;
    }
    generateOffer();
    renderDraft({ offerMotion: 'enter' });
    persist();
    await settleConveyorArrival(reducedMotion);
    session.offerTransition = false;
    els.conveyor.classList.remove('is-running', 'is-selecting');
    releaseConveyorControl();
  }


  async function rerollOffer() {
    if (stomachIsFull() || session.rerollPending || session.offerTransition || adInFlight) return;
    session.rerollPending = true;
    els.rerollBtn.disabled = true;
    try {
      if (UNLIMITED_FREE_REROLLS) {
      } else if (session.freeRerolls > 0) {
        session.freeRerolls -= 1;
      } else if (session.adRerolls === 0) {
        const rewarded = await showRewardedAd('Новая тройка еды.');
        if (!rewarded) return;
        session.adRerolls = 1;
      } else return;
      sound('reroll');
      feedback(6);
      els.conveyor.classList.add('is-running', 'is-rerolling');
      const visibleCards = [...els.foodChoices.querySelectorAll('.conveyor-food-pick')];
      visibleCards.forEach(card => {
        const offerIndex = Number(card.dataset.offerIndex || 0);
        const sequence = Math.max(0, session.offer.length - 1 - offerIndex);
        card.style.setProperty('--conveyor-delay', `${sequence * 110}ms`);
        card.style.setProperty('--conveyor-duration', '500ms');
        card.classList.add('leaving');
      });
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      await new Promise(resolve => setTimeout(resolve, reducedMotion ? 30 : 760));
      generateOffer({ resetRerolls: false });
      renderDraft({ offerMotion: 'enter' });
      persist();
      await settleConveyorArrival(reducedMotion);
    } finally {
      session.rerollPending = false;
      els.conveyor.classList.remove('is-running', 'is-rerolling');
      releaseConveyorControl();
    }
  }

  function activateConveyorControl() {
    if (stomachIsFull()) {
      void beginRoomLaunch({ endless: save.homeMode === 'endless' });
      return;
    }
    void rerollOffer();
  }

  function resetRoomLaunchVisuals() {
    els.slimeStage?.classList.remove('launch-charging', 'launch-opening');
    els.slime?.classList.remove('portal-surprised');
    document.body.classList.remove('room-launch-active');
  }

  async function beginRoomLaunch(options = {}) {
    if (menuLaunchInProgress) return;
    const endless = options?.endless === true;
    if (!stomachIsFull() || menuSlimeIsBusy() || (endless && !save.gameCompleted)) {
      startDrop({ endless });
      return;
    }

    menuLaunchInProgress = true;
    clearMenuSlimeInteraction();
    els.rerollBtn.disabled = true;
    document.body.classList.add('room-launch-active');
    els.slimeStage.classList.add('launch-charging');
    els.slime.classList.add('portal-surprised');
    sound('tap');
    feedback(7);

    await new Promise(resolve => setTimeout(resolve, menuReducedMotion ? 35 : 110));
    if (!menuLaunchInProgress) return;
    els.slimeStage.classList.add('launch-opening');
    sound('bounce');
    feedback([8, 18, 10]);

    await new Promise(resolve => setTimeout(resolve, menuReducedMotion ? 130 : 960));
    if (!menuLaunchInProgress) return;
    sound('epic');
    startDrop({ endless, fromPortal: true });
    menuLaunchInProgress = false;
    setTimeout(resetRoomLaunchVisuals, menuReducedMotion ? 90 : 900);
  }

  function shiftRunClock(delta) {
    if (!run || delta <= 0) return;
    const timestampKeys = [
      'geyserLaunchGraceUntil', 'hurtFlashUntil', 'healGlowUntil', 'freezeUntil',
      'lastFrozenImpactAt', 'emotionUntil', 'comboGraceUntil', 'damageInvulnerableUntil', 'bounceGraceUntil',
      'lastTrailSampleAt', 'lastUiUpdateAt', 'gravitySwitchFlashUntil',
      'hurtSlowUntil', 'lastHeartLossAt', 'jellyEnteredAt', 'lastJellyBubbleAt', 'freezeZoneEnteredAt',
      'elementalAbilityUntil', 'elementalAbilityNextTickAt', 'goldRushUntil', 'launchEntryStartedAt', 'launchEntryUntil',
      'gigantismStartedAt', 'gigantismDeflateStartedAt', 'gigantismDeflateUntil',
      'windDashUntil', 'windDashCooldownUntil', 'windBounceFlashUntil'
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
    for (const block of run.blocks || []) {
      for (const key of ['fireIgnitedAt', 'fireDamageAt', 'fireFlashUntil', 'electricFlashStartedAt', 'electricFlashUntil', 'frostFlashUntil', 'frostTransformStartedAt', 'frostReservedUntil', 'goldFlashUntil', 'snowballGhostUntil', 'blackHoleSuctionStartedAt']) {
        if (block[key] > 0) block[key] += delta;
      }
    }
  }

  function updateRunSoundControl() {
    if (!els.toggleRunSoundBtn) return;
    els.toggleRunSoundBtn.classList.toggle('is-muted', !save.sound);
    els.toggleRunSoundBtn.setAttribute('aria-pressed', String(!save.sound));
    els.runSoundIcon?.classList.toggle('is-muted', !save.sound);
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
    yandexPlatform?.gameplay.stop();
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
    yandexPlatform?.gameplay.start();
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
    if (!endless) registerCampaignFailure(run.worldId, run.level);
    cancelAnimationFrame(run.animationId);
    hideRunMenu();
    run = null;
    persist();
    startDrop({ endless });
  }

  function finishRunFromMenu() {
    if (!run || run.ended) return;
    hideRunMenu();
    finishRunEarly();
  }

  function campaignAttemptKey(worldId, level) {
    return `${worldId}:${level}`;
  }

  function registerCampaignFailure(worldId, level) {
    const key = campaignAttemptKey(worldId, level);
    save.levelFailures[key] = clamp(Math.round(+(save.levelFailures?.[key] || 0)) + 1, 0, 99);
  }

  function campaignGenerationDifficulty(world, level) {
    const targetDepth = levelTargetDepth(world, level);
    if ((save.worldBest?.[world.id] || 0) >= targetDepth) return 'mixed';
    const failures = Math.max(0, Math.round(+(save.levelFailures?.[campaignAttemptKey(world.id, level)] || 0)));
    if (failures < 2) return 'hard';
    if (failures < 4) return 'normal';
    return 'easy';
  }

  function startDrop(options = {}) {
    const endless = options?.endless === true;
    const fromPortal = options?.fromPortal === true;
    GAME_BALANCE = window.SlimeBalance?.load?.() || GAME_BALANCE;
    if (!stomachIsFull()) {
      const remaining = Math.max(0, STOMACH_CAPACITY - stomachFoodCount());
      showToast(`Сначала выбери ещё ${remaining} ${remaining === 1 ? 'продукт' : 'продукта'}`);
      feedback([10, 18, 10]);
      return;
    }
    if (menuSlimeIsBusy()) {
      showToast('Слайм ещё доедает');
      return;
    }
    if (endless && !save.gameCompleted) return showToast('Бесконечный мир откроется после прохождения игры');
    if (!fromPortal) {
      sound('tap');
      feedback([10, 25, 12]);
    }
    const baseWorld = currentWorld();
    const level = endless ? LEVEL_COUNT : selectedLevelForWorld(baseWorld.id);
    const world = {
      ...baseWorld,
      targetDepth: levelTargetDepth(baseWorld, level),
      reward: levelReward(baseWorld, level),
      endlessScale: 1
    };
    const generationDifficulty = endless ? 'mixed' : campaignGenerationDifficulty(world, level);
    const finishY = world.targetDepth * 10 + 180;
    const preferredCellSize = world.cellSize || BALANCE.gridCell;
    const columns = Math.max(2, Math.round(VIEW_W / preferredCellSize));
    // Fill the shaft exactly. Six old 72px tiles occupied only 432px of the
    // 440px canvas and left a visible four-pixel seam on both sides.
    const cellSize = VIEW_W / columns;
    const gridOffsetX = 0;
    const categoryVisuals = menuCategoryLevels();
    const elementalAbilityType = ['frost', 'electric', 'fire', 'cosmos', 'gigantism', 'wind', 'explosion'].find(key => categoryVisuals[key] >= 3) || '';
    const slimeRadius = massRadiusForLevel(categoryVisuals.mass, cellSize);
    const startLane = fromPortal
      ? Math.floor(columns / 2)
      : columns % 2
        ? Math.floor(columns / 2)
        : Math.floor(columns / 2) - (Math.random() < .5 ? 1 : 0);
    const startX = gridOffsetX + startLane * cellSize + cellSize / 2;
    const launchEntryStartedAt = performance.now();
    if (fromPortal) {
      document.body.classList.add('portal-arrival');
      setTimeout(() => document.body.classList.remove('portal-arrival'), 1200);
    }
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
      generationDifficulty,
      endlessLap: 1,
      endlessDepthOffset: 0,
      launchEntryStartedAt: fromPortal ? launchEntryStartedAt : 0,
      launchEntryUntil: fromPortal ? launchEntryStartedAt + 1200 : 0,
      portalY: finishY + cellSize * .35,
      blocks: [], honeyZones: [], jellyZones: [], freezeZones: [], particles: [], trails: [], specialEffects: [],
      meteorShowers: [],
      slime: {
        x: startX,
        y: fromPortal ? -42 : 78,
        vx: fromPortal ? rand(-18, 18) : rand(-65, 65),
        vy: fromPortal ? 720 : 40,
        radius: slimeRadius,
        wobble: 0
      },
      categoryVisuals,
      elementalAbilityType,
      elementalAbilityCharges: elementalAbilityType ? 1 : 0,
      elementalAbilityActive: '',
      elementalAbilityUntil: 0,
      elementalAbilityNextTickAt: 0,
      elementalAuraId: 0,
      goldRushUntil: 0,
      blastCounter: 0,
      categoryBlastDepth: 0,
      massPierceRowsLeft: 0,
      massPierceStrongLeft: 0,
      massPierceRows: new Set(),
      massPierceTriggered: false,
      speedPressure: 0,
      speedBurstChargeMs: 0,
      speedBurstReady: false,
      speedBurstBlocksLeft: 0,
      speedBurstUntil: 0,
      cosmosAscentDistance: 0,
      cosmosReverseReady: false,
      cosmosBoostBlocksLeft: 0,
      cosmosFallDistance: 0,
      cosmosCometCharge: 0,
      cosmosCometStartedAt: 0,
      cosmosCometIgnitedAt: 0,
      cosmosCometFadeUntil: 0,
      gigantismStartedAt: 0,
      gigantismDeflateStartedAt: 0,
      gigantismDeflateUntil: 0,
      windDashBlocksLeft: 0,
      windDashUntil: 0,
      windDashCooldownUntil: 0,
      windBounceFlashUntil: 0,
      steer: {
        keyLeft: false, keyRight: false, keyUp: false, keyDown: false,
        touchX: 0, touchY: 0, touchDown: 0, pointerId: null,
        originX: 0, originY: 0, gravityGestureLocked: false
      },
      gravityDirection: 1,
      gravitySwitchFlashUntil: 0,
      hurtSlowUntil: 0,
      geyserCapture: null,
      geyserLaunchGraceUntil: 0,
      geyserBreaksLeft: 0,
      health: 3,
      startHealth: 3,
      maxHealth: 3,
      visualHealth: 3,
      lastHeartLossAt: 0,
      lastLostHeartIndex: -1,
      healthFlash: 0,
      healthFlashTime: 0,
      hurtFlashUntil: 0,
      healGlowUntil: 0,
      inHoneyZoneId: '',
      lastHoneyBubbleAt: 0,
      inJellyZoneId: '',
      jellyEnteredAt: 0,
      lastJellyBubbleAt: 0,
      inFreezeZoneId: '',
      freezeZoneEnteredAt: 0,
      freezeZoneTriggeredId: '',
      freezeUntil: 0,
      frozenEmotion: 'surprised',
      lastFrozenImpactAt: 0,
      emotion: 'joy',
      emotionUntil: 0,
      damage: 1,
      shield: session.stats.shield,
      barrier: 0,
      barrierFlashUntil: 0,
      bounceControlLockUntil: 0,
      bounceControlRestoreUntil: 0,
      wallPushSide: 0,
      wallReleaseX: 0,
      coinMultiplier: session.stats.coinMultiplier,
      effects: { ...session.effects, gravitySwitch: session.effects.gravitySwitch || categoryVisuals.cosmos >= 1 },
      blocksBrokenForHeal: 0,
      shieldCharges: session.stats.shieldCharges,
      maxShieldCharges: session.stats.shieldCharges,
      coins: 0,
      researchData: 0,
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
      cameraY: fromPortal ? -68 : 0,
      lastTime: 0,
      lastFrameGateAt: 0,
      animationId: 0,
      shake: fromPortal ? 4.5 : 0,
      hitCooldowns: new Map(),
      damageInvulnerableUntil: fromPortal ? launchEntryStartedAt + 620 : 0,
      bounceGraceUntil: 0,
      impactGroupId: 0,
      lowMotionTime: 0,
      lastPosition: { x: startX, y: fromPortal ? -45 : 78 },
      trailPoints: [],
      nextTrailPointId: 0,
      lastTrailSampleAt: 0
    };
    run.blocks = generateBlockField(run);
    indexRunBlocks();
    run.honeyZones = generateHoneyZones(run);
    run.jellyZones = generateJellyZones(run);
    run.freezeZones = generateFreezeZones(run);
    prepareCanvas();
    showScreen('drop');
    clearRunImpactFeedback();
    updateRunUI();
    yandexPlatform?.gameplay.start();
    run.animationId = requestAnimationFrame(gameFrame);
  }

  function prepareCanvas() {
    const dpr = Math.min(isMobileDevice() ? 1 : isLowPowerDevice() ? 1.25 : 1.75, window.devicePixelRatio || 1);
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
    const rawWorldSpecialIds = window.SlimeBalance?.specialIdsForWorld?.(world.id)
      || (world.id === 2
        ? ['heal', 'cryo']
        : world.id === 3
          ? ['heal', 'jelly']
          : world.id === 4
            ? ['heal', 'geyser', 'meteor']
          : ['heal', 'bomb', 'spring']);
    const worldSpecialIds = [...new Set(rawWorldSpecialIds.map(id => world.id === 3 && (id === 'appleMint' || id === 'appleRed') ? 'jelly' : id))]
      .filter(id => !(world.id === 1 && id === 'spring') && id !== 'snowflake' && id !== 'freezeZone');
    const secondaryWeight = id => id === 'jelly'
      ? (zone?.secondary?.jelly ?? ((zone?.secondary?.appleMint || 0) + (zone?.secondary?.appleRed || 0)))
      : (zone?.secondary?.[id] || 0);
    const enabledSecondary = Object.fromEntries(worldSpecialIds
      .filter(id => levelAllows(world, level, id))
      .map(id => [id, secondaryWeight(id)]));
    if (!Object.values(enabledSecondary).some(weight => weight > 0)) return { tier:'dense', special:null, zone };
    const selected = weightedKey(enabledSecondary, world.id === 2 ? 'cryo' : world.id === 3 ? 'jelly' : world.id === 4 ? 'geyser' : 'heal');
    const special = selected === 'heal' ? 'gel' : selected;
    return { tier:'special', special, zone };
  }

  function authoredSectionCell(token, world, level, unlocks) {
    if (!token) return null;
    const weak = { tier: 'dense', special: null, hazard: false, path: true };
    if (token === '.') return { ...weak, dead: true, path: true };
    if (token === 'w') return weak;
    if (token === 'n') return { tier: 'hard', special: null, hazard: false, path: false };
    if (token === 'h') return { tier: 'reinforced', special: null, hazard: false, path: false };
    if (token === 'x') return unlocks?.hazards && levelAllows(world, level, 'hazard')
      ? { tier: 'dense', special: null, hazard: true, path: false }
      : { ...weak, path: false };
    if ('cigd'.includes(token)) {
      const oreByToken = { c: 'coal', i: 'iron', g: 'gold', d: 'diamond' };
      return { tier: 'ore', special: null, hazard: false, path: true, oreId: oreByToken[token] };
    }
    if (token === '+') return unlocks?.medkit && levelAllows(world, level, 'heal')
      ? { tier: 'special', special: 'gel', hazard: false, path: true }
      : weak;
    if (token === 'z') {
      if (world.id === 1) return { ...weak, dead: true, environment: 'jelly', path: true };
      if (world.id === 2) return { ...weak, dead: true, environment: 'freeze', path: true };
      if (world.id === 3) return { ...weak, dead: true, environment: 'honey', path: true };
    }
    if (token === 'p' || token === 'q' || token === 'z') {
      const specialByWorld = {
        1: { p: 'bomb', q: 'bomb', z: 'bomb' },
        2: { p: 'cryo', q: 'cryo', z: 'cryo' },
        3: { p: 'jelly', q: 'jelly', z: 'jelly' },
        4: { p: 'geyser', q: 'meteor', z: 'meteor' }
      };
      const special = specialByWorld[world.id]?.[token] || null;
      const lockedBomb = special === 'bomb' && !unlocks?.dynamite;
      return special && !lockedBomb && levelAllows(world, level, special)
        ? { tier: 'special', special, hazard: false, path: true }
        : weak;
    }
    return weak;
  }

  function generateBlockField(runState) {
    const { world, finishY } = runState;
    const blocks = [];
    const cell = runState.cellSize || BALANCE.gridCell;
    const columns = runState.columns || Math.floor(VIEW_W / cell);
    const gridOffsetX = runState.gridOffsetX || 0;
    const startY = 285;
    const rows = Math.max(8, Math.floor((finishY - cell - startY) / cell));
    const unlocks = levelFeatures(world, runState.level);
    const plan = createSectionPlan(world, rows, runState.level, runState.generationDifficulty);
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

      let pathWidth = clamp(Math.round(lerp(world.pathWidth, world.minPathWidth, progress)), 2, 3);
      if (meta.kind === 'start' || meta.kind === 'safe' || meta.kind === 'tutorial' || meta.kind === 'recovery' || meta.kind === 'final') pathWidth = Math.max(pathWidth, world.id === 1 ? 3 : 2);
      if (meta.kind === 'boss') pathWidth = 2;
      const pathStart = clamp(Math.round(pathCenter - (pathWidth - 1) / 2), 0, columns - pathWidth);
      let pathColumns = Array.from({ length: pathWidth }, (_, index) => pathStart + index);
      pathCenter = pathStart + (pathWidth - 1) / 2;

      if (meta.kind === 'fork') {
        const left = clamp(Math.floor(pathCenter) - 2, 0, columns - 1);
        const right = clamp(Math.ceil(pathCenter) + 2, 0, columns - 1);
        // Each branch needs enough room for a bounce and a correction.
        pathColumns = [...new Set([
          clamp(left - 1, 0, columns - 1), left,
          right, clamp(right + 1, 0, columns - 1)
        ])];
      }

      const keyRow = meta.localRow === Math.floor(meta.length / 2);
      const rowBlocks = [];
      for (let col = 0; col < columns; col += 1) {
        const inPath = pathColumns.includes(col);
        const balanced = chooseBalancedCell(world, runState.level, progress);
        let tier = balanced.tier;
        let special = balanced.special;
        const authored = authoredSectionCell(meta.cells?.[col], world, runState.level, unlocks);
        if (authored) {
          tier = authored.tier;
          special = authored.special;
        }
        // Hazards are biome-wide mechanics. They used to be accidentally
        // hard-locked to World 4 even when another world's level enabled them.
        const hazard = authored
          ? authored.hazard
          : !special
            && !inPath
            && tier !== 'ore'
            && levelAllows(world, runState.level, 'hazard')
            && Math.random() < lerp(.035, .075, progress);
        const hazardVariant = null;
        const finalTier = special ? 'special' : tier;
        const customVisuals = contentWorld(world.id)?.blocks?.filter(item => item.type === 'custom' && item.spawnType === finalTier && levelAllows(world, runState.level, item.id)) || [];
        const customVisual = customVisuals.length ? customVisuals[Math.floor(Math.random() * customVisuals.length)] : null;
        const oreType = authored?.oreId
          ? ORE_TYPES.find(ore => ore.id === authored.oreId) || chooseOreType(progress, world, balanced.zone)
          : finalTier === 'ore' ? chooseOreType(progress, world, balanced.zone) : null;
        let maxHp = blockHpForTier(finalTier, world, progress, row, col, inPath);
        if (special === 'coin') maxHp *= .66;
        if (special === 'spring') maxHp = 1;
        if (special === 'boss') maxHp = 3;
        if (oreType) {
          const oreHits = { coal: 1, iron: 2, gold: 2, diamond: 3 };
          maxHp = oreHits[oreType.id] || 2;
        }
        if (hazard) maxHp = 1;
        if (special === 'bomb' || special === 'gel' || special === 'cryo' || special === 'jelly' || special === 'geyser' || special === 'meteor') maxHp = 1;
        if (special === 'spring') maxHp = 1;
        maxHp = Math.max(1, Math.round(maxHp));

        const material = hazard ? (world.id === 2 ? 'iceHazard' : world.id === 4 ? 'lavaRock' : 'hazard') : chooseMaterial(world, progress, special, finalTier);
        rowBlocks.push({
          id: id++, row, col, x: gridOffsetX + col * cell, y, w: cell, h: cell,
          hp: maxHp, maxHp, material, special, tier: finalTier, dead: Boolean(authored?.dead),
          path: authored?.path ?? inPath, segment: meta.kind, hazard, unbreakable: hazard || special === 'jelly', hazardVariant, oreType, frozen: false, visualId: customVisual?.id || '',
          environmentRemoved: authored?.environment || '',
          researchValue: special || hazard ? 0 : researchValueForTier(finalTier, oreType),
          researchAwarded: false,
          // Grass belongs only to the surface layer of World 1.
          topGrass: world.id === 1 && row === 0 && !special && finalTier === 'soft',
          coins: oreType
            ? Math.max(0, Math.round(GAME_BALANCE?.ores?.[oreType.id]?.coins ?? (10 + maxHp * .45) * oreType.reward))
            : 0
        });
      }

      // The first row is purely decorative surface. Below it, the same weak
      // strength uses the world's normal ground texture; surface art never
      // appears underground.
      if (row === 0) {
        for (const block of rowBlocks) {
          block.dead = false;
          block.tier = world.id === 2 || world.id === 4 ? 'dense' : 'soft';
          block.special = null;
          block.hazard = false;
          block.unbreakable = false;
          block.hazardVariant = null;
          block.oreType = null;
          block.visualId = '';
          block.environmentRemoved = '';
          block.path = true;
          block.topGrass = world.id === 1;
          if (world.id === 1) block.material = 'grass';
          if (world.id === 2) block.material = 'iceLight';
          if (world.id === 4) block.material = 'ash';
          block.maxHp = block.hp = blockHpForTier(block.tier, world, progress, row, block.col, true);
          block.coins = 0;
          block.researchValue = 1;
        }
      }
      blocks.push(...rowBlocks);
    }
    return blocks;
  }

  function generateHoneyZones(runState) {
    if (runState.worldId !== 3) return [];
    const authoredZones = authoredEnvironmentZones(runState, 'honey');
    if (authoredZones.length) return authoredZones;
    const blocks = runState.blocks || [];
    const cell = runState.cellSize;
    const rowCount = blocks.reduce((maximum, block) => Math.max(maximum, block.row + 1), 0);
    const desired = clamp(1 + Math.floor((runState.level || 1) / 2), 1, 3);
    const targetRatios = desired === 1 ? [.43] : desired === 2 ? [.3, .68] : [.23, .5, .76];
    const zones = [];

    for (let index = 0; index < targetRatios.length; index += 1) {
      const targetRow = clamp(Math.round(rowCount * targetRatios[index]), 5, rowCount - 5);
      let selected = null;
      for (const offset of [0, 1, -1, 2, -2, 3, -3]) {
        const row = clamp(targetRow + offset, 4, rowCount - 4);
        const pathBlocks = blocks.filter(block => block.row === row && block.path && !block.special && !block.hazard && block.tier !== 'ore');
        if (!pathBlocks.length) continue;
        const centerBlock = pathBlocks[Math.floor(pathBlocks.length / 2)];
        const widthCells = pathBlocks.some(block => block.col === centerBlock.col + 1) ? 2 : 1;
        const startCol = widthCells === 2 ? centerBlock.col : centerBlock.col;
        const cells = blocks.filter(block => block.row >= row && block.row < row + 2 && block.col >= startCol && block.col < startCol + widthCells);
        if (cells.length !== widthCells * 2 || cells.some(block => block.special || block.hazard || block.tier === 'ore')) continue;
        selected = { row, startCol, widthCells, cells };
        break;
      }
      if (!selected) continue;
      selected.cells.forEach(block => {
        block.dead = true;
        block.environmentRemoved = 'honey';
      });
      zones.push({
        id: `honey-${index}`,
        x: Math.min(...selected.cells.map(block => block.x)),
        y: Math.min(...selected.cells.map(block => block.y)),
        w: Math.max(...selected.cells.map(block => block.x + block.w)) - Math.min(...selected.cells.map(block => block.x)),
        h: Math.max(...selected.cells.map(block => block.y + block.h)) - Math.min(...selected.cells.map(block => block.y)),
        cells: selected.cells.map(block => ({ x: block.x, y: block.y, w: block.w, h: block.h })),
        seed: index * 1.73 + selected.row * .19
      });
    }
    return zones;
  }

  function generateJellyZones(runState) {
    if (runState.worldId !== 1) return [];
    const authoredZones = authoredEnvironmentZones(runState, 'jelly');
    if (authoredZones.length) return authoredZones;
    const blocks = runState.blocks || [];
    const cell = runState.cellSize;
    const rowCount = blocks.reduce((maximum, block) => Math.max(maximum, block.row + 1), 0);
    const desired = clamp(1 + Math.floor(((runState.level || 1) - 1) / 2), 1, 3);
    const targetRatios = desired === 1 ? [.5] : desired === 2 ? [.34, .69] : [.26, .51, .75];
    const zones = [];

    for (let index = 0; index < targetRatios.length; index += 1) {
      const heightCells = runState.level >= 4 && index === targetRatios.length - 1 ? 3 : 2;
      const widthCells = 2;
      const targetRow = clamp(Math.round(rowCount * targetRatios[index]), 5, rowCount - heightCells - 4);
      let selected = null;
      for (const offset of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
        const row = clamp(targetRow + offset, 4, rowCount - heightCells - 4);
        const pathBlocks = blocks.filter(block => block.row === row && block.path && !block.dead && !block.special && !block.hazard && block.tier !== 'ore');
        for (const pathBlock of pathBlocks) {
          const startCol = clamp(pathBlock.col - (pathBlock.col >= runState.columns / 2 ? 1 : 0), 0, runState.columns - widthCells);
          const cells = blocks.filter(block => block.row >= row && block.row < row + heightCells && block.col >= startCol && block.col < startCol + widthCells);
          if (cells.length !== widthCells * heightCells) continue;
          if (cells.some(block => block.dead || block.special || block.hazard || block.tier === 'ore')) continue;
          const unsafeNeighbor = blocks.some(block => !block.dead && block.hazard
            && block.row >= row - 1 && block.row <= row + heightCells
            && block.col >= startCol - 1 && block.col <= startCol + widthCells);
          if (unsafeNeighbor) continue;
          selected = { row, startCol, widthCells, heightCells, cells };
          break;
        }
        if (selected) break;
      }
      if (!selected) continue;
      selected.cells.forEach(block => {
        block.dead = true;
        block.environmentRemoved = 'jelly';
      });
      zones.push({
        id: `jelly-${index}`,
        x: Math.min(...selected.cells.map(block => block.x)),
        y: Math.min(...selected.cells.map(block => block.y)),
        w: Math.max(...selected.cells.map(block => block.x + block.w)) - Math.min(...selected.cells.map(block => block.x)),
        h: Math.max(...selected.cells.map(block => block.y + block.h)) - Math.min(...selected.cells.map(block => block.y)),
        cells: selected.cells.map(block => ({ x: block.x, y: block.y, w: block.w, h: block.h })),
        seed: selected.row * .27 + index * 1.91
      });
    }
    return zones;
  }

  function generateFreezeZones(runState) {
    // The old snowflake tile is replaced by a readable environmental hazard:
    // the same feature slot now creates shallow icy-water pockets.
    if (runState.worldId !== 2 || !levelAllows(runState.world, runState.level, 'snowflake')) return [];
    const authoredZones = authoredEnvironmentZones(runState, 'freeze');
    if (authoredZones.length) return authoredZones;
    const blocks = runState.blocks || [];
    const cell = runState.cellSize;
    const rowCount = blocks.reduce((maximum, block) => Math.max(maximum, block.row + 1), 0);
    const desired = clamp(1 + Math.floor(((runState.level || 1) - 1) / 2), 1, 3);
    const targetRatios = desired === 1 ? [.49] : desired === 2 ? [.34, .7] : [.24, .51, .77];
    const zones = [];

    for (let index = 0; index < targetRatios.length; index += 1) {
      const widthCells = 2;
      const heightCells = 2;
      const targetRow = clamp(Math.round(rowCount * targetRatios[index]), 5, rowCount - heightCells - 4);
      let selected = null;
      for (const offset of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
        const row = clamp(targetRow + offset, 4, rowCount - heightCells - 4);
        const pathBlocks = blocks.filter(block => block.row === row && block.path && !block.dead && !block.special && !block.hazard && block.tier !== 'ore');
        for (const pathBlock of pathBlocks) {
          const startCol = clamp(pathBlock.col - (pathBlock.col >= runState.columns / 2 ? 1 : 0), 0, runState.columns - widthCells);
          const cells = blocks.filter(block => block.row >= row && block.row < row + heightCells && block.col >= startCol && block.col < startCol + widthCells);
          if (cells.length !== widthCells * heightCells) continue;
          if (cells.some(block => block.dead || block.special || block.hazard || block.tier === 'ore')) continue;
          const unsafeNeighbor = blocks.some(block => !block.dead && block.hazard
            && block.row >= row - 1 && block.row <= row + heightCells
            && block.col >= startCol - 1 && block.col <= startCol + widthCells);
          if (unsafeNeighbor) continue;
          selected = { row, startCol, widthCells, heightCells, cells };
          break;
        }
        if (selected) break;
      }
      if (!selected) continue;
      selected.cells.forEach(block => {
        block.dead = true;
        block.environmentRemoved = 'freeze';
      });
      zones.push({
        id: `freeze-water-${index}`,
        x: Math.min(...selected.cells.map(block => block.x)),
        y: Math.min(...selected.cells.map(block => block.y)),
        w: Math.max(...selected.cells.map(block => block.x + block.w)) - Math.min(...selected.cells.map(block => block.x)),
        h: Math.max(...selected.cells.map(block => block.y + block.h)) - Math.min(...selected.cells.map(block => block.y)),
        cells: selected.cells.map(block => ({ x: block.x, y: block.y, w: block.w, h: block.h })),
        seed: selected.row * .31 + index * 2.17
      });
    }
    return zones;
  }

  function authoredEnvironmentZones(runState, environment) {
    const cells = (runState.blocks || []).filter(block => block.environmentRemoved === environment);
    if (!cells.length) return [];
    const byPosition = new Map(cells.map(block => [`${block.row}:${block.col}`, block]));
    const visited = new Set();
    const zones = [];
    for (const cell of cells) {
      const firstKey = `${cell.row}:${cell.col}`;
      if (visited.has(firstKey)) continue;
      const queue = [cell];
      const component = [];
      visited.add(firstKey);
      while (queue.length) {
        const current = queue.shift();
        component.push(current);
        for (const [row, col] of [[current.row - 1, current.col], [current.row + 1, current.col], [current.row, current.col - 1], [current.row, current.col + 1]]) {
          const key = `${row}:${col}`;
          if (visited.has(key) || !byPosition.has(key)) continue;
          visited.add(key);
          queue.push(byPosition.get(key));
        }
      }
      const minRow = Math.min(...component.map(block => block.row));
      const maxRow = Math.max(...component.map(block => block.row));
      const minCol = Math.min(...component.map(block => block.col));
      const maxCol = Math.max(...component.map(block => block.col));
      const minX = Math.min(...component.map(block => block.x));
      const maxX = Math.max(...component.map(block => block.x + block.w));
      const minY = Math.min(...component.map(block => block.y));
      const maxY = Math.max(...component.map(block => block.y + block.h));
      zones.push({
        id: `${environment}-authored-${zones.length}`,
        x: minX,
        y: minY,
        w: maxX - minX,
        h: maxY - minY,
        cells: component.map(block => ({ x: block.x, y: block.y, w: block.w, h: block.h })),
        seed: minRow * .27 + minCol * .61
      });
    }
    return zones;
  }

  function createSectionPlan(world, rows, level, difficultyMode = 'mixed') {
    const catalog = window.SlimeSectionCatalog;
    if (world.id !== 1) return createLegacySectionPlan(world, rows, level);
    if (!catalog) return Array.from({ length: rows }, (_, row) => ({
      kind: row < 3 ? 'start' : row >= rows - 2 ? 'final' : 'neutral',
      sectionIndex: row < 3 ? 0 : 1,
      localRow: row,
      length: rows
    }));

    return catalog.buildPlan(world.id, level, rows, Math.random, difficultyMode);
  }

  function createLegacySectionPlan(world, rows, level) {
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
    let remaining = Math.max(0, rows - lengths.reduce((sum, length) => sum + length, 0));
    const weightSum = sequence.reduce((sum, kind) => sum + baseLength[kind], 0);
    const targets = sequence.map(kind => rows * baseLength[kind] / weightSum);
    while (remaining > 0) {
      let bestIndex = 0;
      let bestNeed = -Infinity;
      for (let index = 0; index < lengths.length; index += 1) {
        const need = targets[index] - lengths[index] + (sequence[index] === 'final' ? .18 : 0);
        if (need > bestNeed) { bestNeed = need; bestIndex = index; }
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

  function levelAllows(world, level, id) {
    const edited = contentLevel(world.id, level);
    return !edited || !Array.isArray(edited.enabled) || edited.enabled.includes(id);
  }

  function blockHpForTier(tier, world, progress, row, col, inPath = false) {
    if (tier === 'hard' || tier === 'ore') return 2;
    if (tier === 'reinforced') return 3;
    return 1;
  }

  function blockRewardForTier(tier) {
    const id = tier === 'hard' ? 'normal' : tier === 'reinforced' ? 'strong' : (tier === 'soft' || tier === 'dense') ? 'weak' : null;
    if (!id) return 0;
    const fallback = id === 'weak' ? 4 : id === 'normal' ? 10 : 22;
    return Math.max(0, Math.round(GAME_BALANCE?.rewards?.[id] ?? fallback));
  }

  function researchValueForTier(tier, oreType = null) {
    if (oreType) return ({ coal: 2, iron: 4, gold: 6, diamond: 10 })[oreType.id] || 2;
    if (tier === 'reinforced') return 3;
    if (tier === 'hard') return 2;
    if (tier === 'soft' || tier === 'dense') return 1;
    return 0;
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

  function gameFrame(timestamp) {
    if (!run || run.ended || run.paused || run.portalTransitioning) return;
    // ProMotion iPhones may request 120 frames per second. Physics is designed
    // for 60 FPS, so rendering the duplicate frames only heats the phone up.
    if (isMobileDevice()) {
      const frameInterval = 1000 / 60;
      if (run.lastFrameGateAt) {
        const frameElapsed = timestamp - run.lastFrameGateAt;
        if (frameElapsed < frameInterval - 1) {
          run.animationId = requestAnimationFrame(gameFrame);
          return;
        }
        run.lastFrameGateAt = timestamp - (frameElapsed % frameInterval);
      } else run.lastFrameGateAt = timestamp;
    }
    if (!run.lastTime) run.lastTime = timestamp;
    const dt = Math.min(.034, (timestamp - run.lastTime) / 1000);
    run.lastTime = timestamp;
    const simulationScale = timestamp < (run.hurtSlowUntil || 0) ? .58 : 1;
    const simulationDt = dt * simulationScale;

    const speed = Math.hypot(run.slime.vx, run.slime.vy);
    // Fast launches and low-FPS frames must never move the slime far enough
    // to skip a block between two collision checks.
    const safeTravel = Math.max(5, Math.min(run.slime.radius * .24, run.cellSize * .14));
    const substeps = clamp(Math.ceil(speed * simulationDt / safeTravel), 1, 12);
    for (let i = 0; i < substeps; i += 1) updatePhysics(simulationDt / substeps, timestamp);
    updateElementalEffects(timestamp);
    updateMeteorShowers(timestamp);
    updateSlimeTrail(simulationDt, timestamp);
    updateParticles(simulationDt);
    updateSpecialEffects(simulationDt);
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

  function honeyZoneForSlime(slime) {
    return run?.honeyZones?.find(zone => circleRectCollision(slime, zone)) || null;
  }

  function updateHoneyState(slime, timestamp) {
    const zone = honeyZoneForSlime(slime);
    const previousId = run.inHoneyZoneId || '';
    run.inHoneyZoneId = zone?.id || '';
    if (!zone) return;
    if (zone.id !== previousId) {
      run.emotion = 'surprised';
      run.emotionUntil = timestamp + 420;
      feedback(4);
    }
    if (timestamp - (run.lastHoneyBubbleAt || 0) < 115) return;
    run.lastHoneyBubbleAt = timestamp;
    const life = rand(.5, .82);
    run.particles.push({
      kind: 'special', shape: 'orb',
      x: slime.x + rand(-slime.radius * .48, slime.radius * .48),
      y: slime.y + rand(-slime.radius * .18, slime.radius * .52),
      vx: rand(-14, 14), vy: rand(-42, -22), gravity: -8,
      life, maxLife: life, size: rand(2.4, 5.4),
      color: Math.random() < .5 ? '#ffe991' : '#ffbc3f'
    });
  }

  function jellyZoneForSlime(slime) {
    return run?.jellyZones?.find(zone => circleRectCollision(slime, zone)) || null;
  }

  function jellyDiveInput() {
    if (!run?.steer) return 0;
    return clamp(Math.max(Number(run.steer.keyDown), run.steer.touchDown || 0), 0, 1);
  }

  function updateJellyState(slime, timestamp) {
    const zone = jellyZoneForSlime(slime);
    const previousId = run.inJellyZoneId || '';
    run.inJellyZoneId = zone?.id || '';
    if (!zone) return;
    if (zone.id !== previousId) {
      run.jellyEnteredAt = timestamp;
      slime.vx *= .72;
      slime.vy *= .48;
      run.emotion = 'surprised';
      run.emotionUntil = timestamp + 420;
      feedback(4);
    }
    if (timestamp - (run.lastJellyBubbleAt || 0) < 105) return;
    run.lastJellyBubbleAt = timestamp;
    const life = rand(.55, .95);
    run.particles.push({
      kind: 'special', shape: 'orb',
      x: slime.x + rand(-slime.radius * .58, slime.radius * .58),
      y: slime.y + rand(-slime.radius * .24, slime.radius * .56),
      vx: rand(-11, 11), vy: rand(-46, -25), gravity: -12,
      life, maxLife: life, size: rand(2.2, 5.6),
      color: Math.random() < .5 ? '#efffe8' : '#8fea72'
    });
  }

  function freezeZoneForSlime(slime) {
    return run?.freezeZones?.find(zone => circleRectCollision(slime, zone)) || null;
  }

  function updateFreezeZoneState(slime, timestamp) {
    const zone = freezeZoneForSlime(slime);
    const previousId = run.inFreezeZoneId || '';
    run.inFreezeZoneId = zone?.id || '';
    if (!zone) {
      run.freezeZoneEnteredAt = 0;
      run.freezeZoneTriggeredId = '';
      return;
    }
    if (zone.id !== previousId) {
      run.freezeZoneEnteredAt = timestamp;
      run.freezeZoneTriggeredId = '';
      // The pocket must hold the slime long enough for its one-second frost
      // charge to be readable instead of being crossed in a single fast fall.
      slime.vx *= .68;
      slime.vy *= .24;
      run.emotion = 'surprised';
      run.emotionUntil = timestamp + 460;
      feedback(3);
      return;
    }
    if (run.freezeZoneTriggeredId === zone.id || timestamp - run.freezeZoneEnteredAt < FREEZE_ZONE_CHARGE_MS) return;
    run.freezeZoneTriggeredId = zone.id;
    activateFreezeZone(timestamp);
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
    const drillActive = speedDrillActive(timestamp) || windTornadoActive(timestamp);
    const frozen = !drillActive && isSlimeFrozen(timestamp);
    updateSpeedPassive(dt, timestamp);
    updateWindDash(timestamp);
    const gravityDirection = run.effects.gravitySwitch ? Math.sign(run.gravityDirection || 1) : 1;
    const honeyAtStart = honeyZoneForSlime(s);
    const honeyDrag = Boolean(honeyAtStart);
    const jellyAtStart = jellyZoneForSlime(s);
    const jellyDrag = Boolean(jellyAtStart);
    const freezeWaterAtStart = freezeZoneForSlime(s);
    const freezeWaterDrag = Boolean(freezeWaterAtStart);
    const worldGravity = drillActive ? 0 : (BALANCE.gravityBase + run.worldId * BALANCE.gravityPerWorld) * (frozen ? 1.48 : freezeWaterDrag ? .28 : honeyDrag ? .24 : jellyDrag ? .08 : 1);
    const previousX = s.x;
    const previousY = s.y;
    const launchArrivalActive = run.launchEntryUntil && timestamp < run.launchEntryUntil;

    const baseTerminalSpeed = frozen
      ? normalFallSpeedLimit() * 1.18
      : freezeWaterDrag ? 118 : honeyDrag ? 132 : jellyDrag ? 165
        : normalFallSpeedLimit();
    const speedPressure = elementalLevel('mobility') >= 1 ? run.speedPressure || 0 : 0;
    const terminalSpeed = baseTerminalSpeed * (1 + speedPressure * .5);
    if (drillActive) applySpeedDrillSteering(s, dt);
    else {
      s.vy = clamp(s.vy + worldGravity * gravityDirection * dt, -terminalSpeed, terminalSpeed);
      applyFallSteering(s, dt, timestamp);
    }
    if (!drillActive && honeyDrag && !frozen) {
      s.vx *= Math.pow(.32, dt);
      s.vy *= Math.pow(.085, dt);
    } else if (!drillActive && freezeWaterDrag && !frozen) {
      s.vx *= Math.pow(.48, dt);
      s.vy = lerp(s.vy, 86, clamp(dt * 3.8, 0, 1));
    } else if (!drillActive && jellyDrag && !frozen) {
      const jellyAge = Math.max(0, timestamp - (run.jellyEnteredAt || timestamp));
      const dive = jellyDiveInput();
      const targetVy = dive > .08
        ? lerp(-42, 158, dive)
        : jellyAge < 170
          ? Math.min(52, Math.max(18, s.vy * .55))
          : -158;
      s.vx *= Math.pow(.56, dt);
      s.vy = lerp(s.vy, targetVy, clamp(dt * (dive > .08 ? 4.25 : 4.9), 0, 1));
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    updateCosmosCometEntry(previousY, timestamp);
    updateHoneyState(s, timestamp);
    updateJellyState(s, timestamp);
    updateFreezeZoneState(s, timestamp);
    s.wobble += dt * (4 + Math.abs(s.vy) / 180);

    if (s.x - s.radius < 0) {
      s.x = s.radius;
      if (drillActive) s.vx = Math.max(0, s.vx);
      else {
        s.vx = clamp(Math.abs(s.vx) * .18, 30, 42);
        run.wallPushSide = -1;
        run.wallReleaseX = s.x + 10;
      }
    }
    if (s.x + s.radius > VIEW_W) {
      s.x = VIEW_W - s.radius;
      if (drillActive) s.vx = Math.min(0, s.vx);
      else {
        s.vx = -clamp(Math.abs(s.vx) * .18, 30, 42);
        run.wallPushSide = 1;
        run.wallReleaseX = s.x - 10;
      }
    }
    if (!launchArrivalActive && drillActive && s.y - s.radius < 4) {
      s.y = s.radius + 4;
      s.vy = Math.max(0, s.vy);
    }
    if (!launchArrivalActive && run.effects.gravitySwitch && s.y - s.radius < 4) {
      s.y = s.radius + 4;
      s.vy = Math.max(78, Math.abs(s.vy) * .58);
      run.gravitySwitchFlashUntil = timestamp + 520;
    }

    const moved = Math.hypot(s.x - previousX, s.y - previousY);
    run.flightDistance += moved;
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.depth = (run.endlessDepthOffset || 0) + Math.max(0, Math.floor((s.y - 80) / 10));
    run.maxDepth = Math.max(run.maxDepth, run.depth);

    const collisions = blocksNearY(s.y, s.radius)
      .filter(block => !block.dead && !block.blackHoleSuctionStartedAt && timestamp >= (block.snowballGhostUntil || 0) && block.y + block.h > s.y - s.radius - 3 && block.y < s.y + s.radius + 3)
      // Hazards use a slightly forgiving hit radius: near-misses should look
      // and feel like near-misses, especially under a thumb on mobile.
      .map(block => ({ block, collision: circleRectCollision(s, block, block.hazard ? s.radius * .76 : s.radius) }))
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

    if (launchArrivalActive) {
      const entryProgress = clamp((timestamp - run.launchEntryStartedAt) / Math.max(1, run.launchEntryUntil - run.launchEntryStartedAt), 0, 1);
      const cameraProgress = clamp((entryProgress - .1) / .68, 0, 1);
      const cameraEase = 1 - Math.pow(1 - cameraProgress, 3);
      run.cameraY = lerp(-68, 0, cameraEase);
    } else {
      const targetCamera = clamp(s.y - 158, 0, run.portalY - VIEW_H + 105);
      run.cameraY = lerp(run.cameraY, targetCamera, clamp(dt * 4.25, 0, 1));
    }

    if (run.shake > 0) run.shake = Math.max(0, run.shake - dt * 20);
    run.visualHealth = run.health;
    const healthScale = 1;
    const massRadius = massRadiusForLevel(elementalLevel('mass'), run.cellSize);
    const normalRadius = massRadius * healthScale;
    const targetRadius = gigantismRadiusAt(timestamp, normalRadius);
    const changingGigantism = gigantismActive(timestamp) || timestamp < (run.gigantismDeflateUntil || 0);
    s.radius = lerp(s.radius, targetRadius, clamp(dt * (changingGigantism ? 19 : 5.5), 0, 1));
    if (run.healthFlashTime > 0) run.healthFlashTime = Math.max(0, run.healthFlashTime - dt);

    const speedNow = Math.hypot(s.vx, s.vy);
    if (s.vy * gravityDirection < 185) resetMassPierce();
    if (speedNow < 34 && s.y > 180) run.lowMotionTime += dt;
    else run.lowMotionTime = 0;
    if (run.lowMotionTime > 1.0) {
      s.vy += 145 * gravityDirection;
      s.vx += rand(-65, 65);
      run.lowMotionTime = 0;
    }

    if (run.health <= 0) endRun(false, 'У слайма закончилось здоровье');
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

  function fallSteeringVector() {
    if (!run?.steer) return { x: 0, y: 0, down: 0 };
    const keyboardX = Number(run.steer.keyRight) - Number(run.steer.keyLeft);
    const keyboardY = Number(run.steer.keyDown) - Number(run.steer.keyUp);
    const y = clamp(keyboardY + (run.steer.touchY || 0), -1, 1);
    return {
      x: clamp(keyboardX + (run.steer.touchX || 0), -1, 1),
      y,
      down: clamp(Math.max(y, Number(run.steer.keyDown), run.steer.touchDown || 0), 0, 1)
    };
  }

  function applySpeedDrillSteering(slime, dt) {
    const steering = fallSteeringVector();
    const inputLength = Math.hypot(steering.x, steering.y);
    const currentSpeed = Math.max(1, Math.hypot(slime.vx, slime.vy));
    const driveSpeed = windTornadoActive() ? 455 : 500;
    let directionX = slime.vx / currentSpeed;
    let directionY = slime.vy / currentSpeed;
    if (inputLength > .08) {
      directionX = steering.x / inputLength;
      directionY = steering.y / inputLength;
    } else if (currentSpeed < 80) {
      directionX = 0;
      directionY = 1;
    }
    const response = clamp(dt * (inputLength > .08 ? 11 : 5.5), 0, 1);
    slime.vx = lerp(slime.vx, directionX * driveSpeed, response);
    slime.vy = lerp(slime.vy, directionY * driveSpeed, response);
  }

  function updateSpeedPassive(dt, timestamp = performance.now()) {
    if (!run) return;
    const level = elementalLevel('mobility');
    const steering = fallSteeringVector();
    const downHeld = steering.down > .12;
    const pressureTarget = level >= 1 && downHeld ? steering.down : 0;
    const pressureStep = dt * 1000 / SPEED_PRESSURE_RAMP_MS;
    run.speedPressure = pressureTarget > run.speedPressure
      ? Math.min(pressureTarget, run.speedPressure + pressureStep)
      : Math.max(pressureTarget, run.speedPressure - pressureStep);

    if (run.speedBurstBlocksLeft > 0 && timestamp >= run.speedBurstUntil) {
      run.speedBurstBlocksLeft = 0;
      run.speedBurstUntil = 0;
    }
    if (level < 2) {
      run.speedBurstChargeMs = 0;
      run.speedBurstReady = false;
      run.speedBurstBlocksLeft = 0;
      run.speedBurstUntil = 0;
      return;
    }
    if (run.speedBurstReady || run.speedBurstBlocksLeft > 0 || speedDrillActive(timestamp) || isSlimeFrozen(timestamp)) return;
    if (downHeld && run.slime.vy > 35) {
      run.speedBurstChargeMs = Math.min(SPEED_BURST_CHARGE_MS, run.speedBurstChargeMs + dt * 1000 * steering.down);
      if (run.speedBurstChargeMs >= SPEED_BURST_CHARGE_MS) {
        run.speedBurstReady = true;
        impact('БУР-РЫВОК ГОТОВ');
        sound('tap');
        feedback(7);
      }
    }
  }

  function updateWindDash(timestamp = performance.now()) {
    if (!run) return;
    if (run.windDashBlocksLeft > 0 && timestamp >= run.windDashUntil) {
      run.windDashBlocksLeft = 0;
      run.windDashUntil = 0;
    }
  }

  function windDashActive(timestamp = performance.now()) {
    return Boolean(run && elementalLevel('wind') >= 2 && run.windDashBlocksLeft > 0 && timestamp < run.windDashUntil);
  }

  function windDashPiercesBlock(block, timestamp = performance.now()) {
    return Boolean(windDashActive(timestamp) && block && !block.unbreakable && !block.hazard);
  }

  function consumeWindDashBlock(timestamp = performance.now()) {
    if (!windDashActive(timestamp)) return 0;
    run.windDashBlocksLeft = Math.max(0, run.windDashBlocksLeft - 1);
    if (run.windDashBlocksLeft <= 0) {
      run.windDashUntil = 0;
      run.windDashCooldownUntil = timestamp + 520;
    }
    return run.windDashBlocksLeft;
  }

  function speedBurstPiercesBlock(block, isFalling, timestamp = performance.now()) {
    if (!run || elementalLevel('mobility') < 2 || speedDrillActive(timestamp) || block.unbreakable || !isFalling) return false;
    if (run.speedBurstBlocksLeft > 0) return timestamp < run.speedBurstUntil;
    if (!run.speedBurstReady) return false;
    run.speedBurstReady = false;
    run.speedBurstChargeMs = 0;
    run.speedBurstBlocksLeft = Math.random() < .5 ? 2 : 3;
    run.speedBurstUntil = timestamp + SPEED_BURST_WINDOW_MS;
    const gravityDirection = Math.sign(run.gravityDirection || 1);
    run.slime.vx *= .35;
    run.slime.vy = gravityDirection * Math.max(430, Math.abs(run.slime.vy));
    run.shake = Math.max(run.shake, 5);
    feedback([8, 12, 8]);
    return true;
  }

  function consumeSpeedBurstBlock(timestamp = performance.now()) {
    run.speedBurstBlocksLeft = Math.max(0, run.speedBurstBlocksLeft - 1);
    const gravityDirection = Math.sign(run.gravityDirection || 1);
    if (run.speedBurstBlocksLeft > 0) {
      run.slime.vy = gravityDirection * Math.max(430, Math.abs(run.slime.vy));
    } else {
      run.speedBurstUntil = 0;
      run.slime.vy = gravityDirection * Math.max(250, Math.abs(run.slime.vy) * .72);
    }
    return run.speedBurstBlocksLeft;
  }

  function cosmosBoostActive() {
    return Boolean(run && elementalLevel('cosmos') >= 2 && run.cosmosBoostBlocksLeft > 0);
  }

  function consumeCosmosBoostBlock(timestamp = performance.now()) {
    if (!cosmosBoostActive()) return 0;
    run.cosmosBoostBlocksLeft = Math.max(0, run.cosmosBoostBlocksLeft - 1);
    if (run.cosmosBoostBlocksLeft > 0 && run.gravityDirection > 0) {
      run.slime.vy = Math.max(440, Math.abs(run.slime.vy));
    } else if (run.cosmosBoostBlocksLeft <= 0) {
      run.cosmosCometCharge = 0;
      run.cosmosCometFadeUntil = timestamp + 420;
    }
    return run.cosmosBoostBlocksLeft;
  }

  function igniteCosmosComet(timestamp = performance.now()) {
    if (!run || run.cosmosBoostBlocksLeft > 0) return false;
    run.cosmosReverseReady = false;
    run.cosmosAscentDistance = 0;
    run.cosmosFallDistance = 0;
    run.cosmosCometCharge = 1;
    run.cosmosCometIgnitedAt = timestamp;
    run.cosmosBoostBlocksLeft = 5;
    run.slime.vx *= .62;
    run.slime.vy = Math.max(500, Math.abs(run.slime.vy) * 1.34);
    run.shake = Math.max(run.shake, 6.5);
    pushElementalEffect('cosmosBoost', run.slime.x, run.slime.y, { life: .76, maxLife: .76, ignition: true });
    impact('КОМЕТА · ПРОБОЙ 5 БЛОКОВ');
    sound('epic');
    feedback([9, 16, 10]);
    return true;
  }

  function updateCosmosCometEntry(previousY, timestamp = performance.now()) {
    if (!run || elementalLevel('cosmos') < 2) return;
    const s = run.slime;
    const gravityDirection = run.effects.gravitySwitch ? Math.sign(run.gravityDirection || 1) : 1;

    if (gravityDirection < 0) {
      if (s.y < previousY) run.cosmosAscentDistance += previousY - s.y;
      if (run.cosmosAscentDistance >= run.cellSize * COSMOS_ASCENT_ARM_DISTANCE) run.cosmosReverseReady = true;
      run.cosmosFallDistance = 0;
      run.cosmosCometCharge = 0;
      run.cosmosCometStartedAt = 0;
      return;
    }

    if (cosmosBoostActive()) {
      run.cosmosCometCharge = 1;
      return;
    }
    if (!run.cosmosReverseReady) return;
    if (s.vy <= 0) {
      if (s.vy < -30) {
        run.cosmosFallDistance = 0;
        run.cosmosCometCharge = 0;
        run.cosmosCometStartedAt = 0;
      }
      return;
    }

    if (!run.cosmosCometStartedAt) run.cosmosCometStartedAt = timestamp;
    run.cosmosFallDistance += Math.max(0, s.y - previousY);
    const distanceCharge = run.cosmosFallDistance / Math.max(1, run.cellSize * COSMOS_ENTRY_FALL_DISTANCE);
    const speedCharge = (s.vy - 55) / 285;
    run.cosmosCometCharge = clamp(Math.max(distanceCharge, speedCharge * .9), 0, 1);
    if (run.cosmosCometCharge >= 1) igniteCosmosComet(timestamp);
  }

  function setGravityDirection(direction, timestamp = performance.now()) {
    if (!run?.effects?.gravitySwitch || run.ended || run.paused || run.portalEntry) return false;
    const nextDirection = direction < 0 ? -1 : 1;
    if (run.gravityDirection === nextDirection) return true;
    run.gravityDirection = nextDirection;
    run.slime.vy *= .55;
    if (elementalLevel('cosmos') >= 2) {
      if (nextDirection < 0) {
        run.cosmosAscentDistance = 0;
        run.cosmosReverseReady = false;
        run.cosmosBoostBlocksLeft = 0;
        run.cosmosFallDistance = 0;
        run.cosmosCometCharge = 0;
        run.cosmosCometStartedAt = 0;
        run.cosmosCometFadeUntil = 0;
      } else if (run.cosmosReverseReady) {
        run.cosmosFallDistance = 0;
        run.cosmosCometCharge = 0;
        run.cosmosCometStartedAt = 0;
      }
    }
    run.gravitySwitchFlashUntil = timestamp + 620;
    run.emotion = 'surprised';
    run.emotionUntil = timestamp + 420;
    feedback(5);
    sound('tap');
    return true;
  }

  function applyFallSteering(slime, dt, timestamp = performance.now()) {
    const launchControlLocked = run?.launchEntryStartedAt && timestamp < run.launchEntryStartedAt + 420;
    if (!run?.steer || run.portalEntry || launchControlLocked || isSlimeFrozen(timestamp)) return;
    const steering = fallSteeringVector();
    const lockUntil = run.bounceControlLockUntil || 0;
    const restoreUntil = Math.max(lockUntil, run.bounceControlRestoreUntil || 0);
    const steeringAuthority = timestamp < lockUntil
      ? 0
      : restoreUntil > lockUntil
        ? clamp((timestamp - lockUntil) / (restoreUntil - lockUntil), 0, 1)
        : 1;
    const massControl = elementalLevel('mass') >= 2 ? .7 : 1;
    const activeMassControl = run.elementalAbilityActive === 'mass' && timestamp < run.elementalAbilityUntil ? .35 : 1;
    const mobilityLevel = elementalLevel('mobility');
    const mobilityControl = [1, 1.12, 1.22, 1.22][mobilityLevel] || 1;
    const effectiveAuthority = steeringAuthority * massControl * activeMassControl * mobilityControl;
    if (effectiveAuthority > 0) {
      let inputX = steering.x;
      if (run.wallPushSide < 0) {
        if (slime.x >= run.wallReleaseX) run.wallPushSide = 0;
        else if (inputX < 0) inputX = 0;
      } else if (run.wallPushSide > 0) {
        if (slime.x <= run.wallReleaseX) run.wallPushSide = 0;
        else if (inputX > 0) inputX = 0;
      }
      const controlSpeed = [200, 228, 248, 248][mobilityLevel] || 200;
      const targetVx = Math.abs(inputX) > .01 ? inputX * controlSpeed : 0;
      const reversing = Math.abs(inputX) > .01 && Math.abs(slime.vx) > 10 && Math.sign(slime.vx) !== Math.sign(inputX);
      const responseRate = reversing ? 11 : Math.abs(inputX) > .01 ? 5.4 : 7.2;
      const response = 1 - Math.exp(-responseRate * effectiveAuthority * dt);
      slime.vx = lerp(slime.vx, targetVx, response);
      if (!inputX && Math.abs(slime.vx) < 2) slime.vx = 0;
    }
    // Downward input increases weight only after the rebound has established
    // its trajectory; holding it can never flatten an impact into a block.
    if (steering.down > .01 && effectiveAuthority > 0) {
      const pressure = mobilityLevel >= 1 ? run.speedPressure || 0 : 0;
      const diveAcceleration = mobilityLevel >= 1 ? 300 + pressure * 420 : 235;
      const baseTerminalSpeed = normalFallSpeedLimit();
      const maxDiveSpeed = baseTerminalSpeed * (1 + pressure * .5);
      slime.vy = Math.min(maxDiveSpeed, slime.vy + diveAcceleration * steering.down * effectiveAuthority * dt);
    }
  }

  function normalFallSpeedLimit() {
    if (run?.worldId === 1) return BALANCE.maxFallSpeedWorld1 || 305;
    return BALANCE.maxFallSpeedBase + (run?.worldId || 1) * BALANCE.maxFallSpeedPerWorld;
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

  function circleRectCollision(circle, rect, collisionRadius = circle.radius) {
    const closestX = clamp(circle.x, rect.x, rect.x + rect.w);
    const closestY = clamp(circle.y, rect.y, rect.y + rect.h);
    let dx = circle.x - closestX;
    let dy = circle.y - closestY;
    let distanceSq = dx * dx + dy * dy;
    if (distanceSq >= collisionRadius * collisionRadius) return null;

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
    return { nx, ny, penetration: collisionRadius - distance + insideDepth };
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

  function applyBlockBounce(slime, collision, { hazard, timestamp }) {
    const nx = collision.nx;
    const ny = collision.ny;
    const incomingNormal = slime.vx * nx + slime.vy * ny;
    const inwardSpeed = Math.max(0, -incomingNormal);
    const regularRatio = clamp((inwardSpeed - 40) / 440, 0, 1);
    const hazardRatio = clamp((inwardSpeed - 45) / 375, 0, 1);
    const regularCurve = regularRatio * regularRatio * (3 - 2 * regularRatio);
    const hazardCurve = hazardRatio * hazardRatio * (3 - 2 * hazardRatio);
    const baseNormalSpeed = hazard
      ? lerp(195, 285, hazardCurve)
      : lerp(BALANCE.bounceMin, BALANCE.bounceMax, regularCurve);
    const mobilityLevel = elementalLevel('mobility');
    const pressure = mobilityLevel >= 1 ? run.speedPressure || 0 : 0;
    const downwardBounceScale = ny < -.45 ? 1 - pressure * .25 : 1;
    const normalSpeed = baseNormalSpeed * downwardBounceScale;
    const tangentKeep = hazard ? .32 : .50;
    let tangentX = (slime.vx - incomingNormal * nx) * tangentKeep;
    let tangentY = (slime.vy - incomingNormal * ny) * tangentKeep;
    const tangentSpeed = Math.hypot(tangentX, tangentY);
    const tangentLimit = hazard ? 112 : lerp(82, 150, regularCurve);
    if (tangentSpeed > tangentLimit) {
      const tangentScale = tangentLimit / tangentSpeed;
      tangentX *= tangentScale;
      tangentY *= tangentScale;
    }

    slime.vx = nx * normalSpeed + tangentX;
    slime.vy = ny * normalSpeed + tangentY;

    const steering = fallSteeringVector();
    if (Math.abs(steering.x) > .01) {
      if (Math.abs(nx) < .34) {
        const steeringAssist = (hazard ? 86 : lerp(54, 86, regularCurve)) * (1 + mobilityLevel * .2);
        slime.vx = clamp(slime.vx * .5 + steering.x * steeringAssist, -BALANCE.sideBounceMax, BALANCE.sideBounceMax);
      } else if (Math.sign(steering.x) === Math.sign(nx)) {
        slime.vx += steering.x * (hazard ? 34 : 24);
      }
    }

    const windLevel = elementalLevel('wind');
    if (windLevel >= 1 && !windTornadoActive(timestamp)) {
      const beforeWind = Math.max(1, Math.hypot(slime.vx, slime.vy));
      const windBoost = 1.13 + regularCurve * .09;
      const boostedSpeed = Math.min(425, beforeWind * windBoost + 18);
      slime.vx = slime.vx / beforeWind * boostedSpeed;
      slime.vy = slime.vy / beforeWind * boostedSpeed;
      run.windBounceFlashUntil = timestamp + 360;
      pushElementalEffect('windBounce', slime.x, slime.y, { life: .42, maxLife: .42 });

      if (windLevel >= 2
        && boostedSpeed >= 285
        && !windDashActive(timestamp)
        && timestamp >= (run.windDashCooldownUntil || 0)) {
        run.windDashBlocksLeft = 3;
        run.windDashUntil = timestamp + 1450;
        run.windDashCooldownUntil = timestamp + 2050;
        const dashScale = 390 / Math.max(1, boostedSpeed);
        if (boostedSpeed < 390) {
          slime.vx *= dashScale;
          slime.vy *= dashScale;
        }
        run.shake = Math.max(run.shake, 4.5);
        pushElementalEffect('windDash', slime.x, slime.y, { life: .62, maxLife: .62 });
        impact('ВОЗДУШНЫЙ РЫВОК · 3 БЛОКА');
        sound('epic');
        feedback([7, 11, 7]);
      }
    }

    const lockReduction = mobilityLevel >= 2 ? 10 : mobilityLevel >= 1 ? 5 : 0;
    const restoreReduction = mobilityLevel >= 2 ? 24 : mobilityLevel >= 1 ? 12 : 0;
    run.bounceGraceUntil = timestamp + BALANCE.bounceGraceMs + (hazard ? 70 : 20);
    run.bounceControlLockUntil = timestamp + Math.max(24, 36 - lockReduction);
    run.bounceControlRestoreUntil = timestamp + Math.max(88, 120 - restoreReduction);
  }

  function activateJellyBounce(block, collision, timestamp) {
    const slime = run.slime;
    const nx = collision.nx;
    const ny = collision.ny;
    const incomingNormal = slime.vx * nx + slime.vy * ny;
    const impactSpeed = Math.max(0, -incomingNormal);
    const impactRatio = clamp((impactSpeed - 35) / 360, 0, 1);
    const curve = impactRatio * impactRatio * (3 - 2 * impactRatio);
    const rebound = lerp(190, 292, curve);
    let tangentX = slime.vx - incomingNormal * nx;
    let tangentY = slime.vy - incomingNormal * ny;
    const tangentSpeed = Math.hypot(tangentX, tangentY);
    const tangentLimit = lerp(105, 172, curve);
    if (tangentSpeed > tangentLimit) {
      tangentX *= tangentLimit / tangentSpeed;
      tangentY *= tangentLimit / tangentSpeed;
    }

    slime.x += nx * (collision.penetration + 5);
    slime.y += ny * (collision.penetration + 5);
    slime.vx = nx * rebound + tangentX * .62;
    slime.vy = ny * rebound + tangentY * .62;
    const steering = fallSteeringVector();
    if (Math.abs(nx) < .34 && Math.abs(steering.x) > .01) {
      slime.vx = clamp(slime.vx * .62 + steering.x * lerp(62, 94, curve), -BALANCE.sideBounceMax, BALANCE.sideBounceMax);
    }

    block.jellyHitAt = timestamp;
    block.jellyImpact = .62 + curve * .38;
    block.jellyNormalX = nx;
    block.jellyNormalY = ny;
    run.bounceGraceUntil = timestamp + BALANCE.bounceGraceMs + 55;
    run.bounceControlLockUntil = timestamp + 38;
    run.bounceControlRestoreUntil = timestamp + 155;
    run.flightDistance = 0;
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 420;
    run.shake = Math.max(run.shake, 2.4 + curve * 2.2);
    preserveCombo(timestamp);
    spawnSpecialBurst('jelly', block.x + block.w / 2, block.y + block.h / 2, nx, ny);
    sound('bounce');
    feedback(curve > .66 ? [7, 12, 7] : 6);
    return true;
  }

  function resolveHazardHit(block, collision, timestamp) {
    const slime = run.slime;
    const centerX = block.x + block.w / 2;
    const centerY = block.y + block.h / 2;
    block.dead = true;
    block.hp = 0;
    run.blocksDestroyed += 1;
    createDebris(block, 16, true);
    spawnSpecialBurst('bomb', centerX, centerY);
    run.shake = Math.max(run.shake, 8.5);

    if (timestamp < run.damageInvulnerableUntil) {
      sound('break');
      return false;
    }

    const healthBefore = run.health;
    run.health = Math.max(0, run.health - 1);
    run.lastLostHeartIndex = Math.max(0, healthBefore - 1);
    run.lastHeartLossAt = timestamp;
    run.damageInvulnerableUntil = timestamp + 2000;
    run.hurtSlowUntil = Math.max(run.hurtSlowUntil || 0, timestamp + 380);
    run.hurtFlashUntil = timestamp + 2000;
    run.healthFlash = -1;
    run.healthFlashTime = .34;
    run.emotion = 'hurt';
    run.emotionUntil = timestamp + 620;
    run.flightDistance = 0;
    resetCombo();

    slime.x += collision.nx * (collision.penetration + 7);
    slime.y += collision.ny * (collision.penetration + 7);
    applyBlockBounce(slime, collision, { hazard: true, timestamp });
    slime.vx += collision.nx * 58;
    slime.vy += collision.ny * 58;

    impact('−1 СЕРДЦЕ');
    sound('hitHard');
    feedback([18, 28, 12]);
    updateRunUI();
    if (run.health <= 0) endRun(false, 'У слайма закончились сердца');
    return true;
  }

  function elementalLevel(type) {
    return clamp(Math.round(run?.categoryVisuals?.[type] || 0), 0, 3);
  }

  function speedDrillActive(timestamp = performance.now()) {
    return Boolean(run?.elementalAbilityActive === 'mobility' && timestamp < run.elementalAbilityUntil);
  }

  function windTornadoActive(timestamp = performance.now()) {
    return Boolean(run?.elementalAbilityActive === 'wind' && timestamp < run.elementalAbilityUntil);
  }

  function gigantismActive(timestamp = performance.now()) {
    return Boolean(run?.elementalAbilityActive === 'gigantism' && timestamp < run.elementalAbilityUntil);
  }

  function gigantismRadiusAt(timestamp, normalRadius) {
    if (!run || elementalLevel('gigantism') < 3) return normalRadius;
    const giantRadius = run.cellSize * 2;
    if (gigantismActive(timestamp)) {
      const progress = clamp((timestamp - (run.gigantismStartedAt || timestamp)) / 245, 0, 1);
      const offset = progress - 1;
      const inflated = 1 + 2.72 * offset * offset * offset + 1.72 * offset * offset;
      return lerp(normalRadius, giantRadius, inflated);
    }
    if (timestamp < (run.gigantismDeflateUntil || 0)) {
      const duration = Math.max(1, run.gigantismDeflateUntil - run.gigantismDeflateStartedAt);
      const progress = clamp((timestamp - run.gigantismDeflateStartedAt) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const wobble = Math.sin(progress * Math.PI * 5) * (1 - progress) * normalRadius * .16;
      return Math.max(normalRadius, lerp(giantRadius, normalRadius, eased) + wobble);
    }
    return normalRadius;
  }

  function massRadiusForLevel(level, cellSize = BALANCE.gridCell) {
    if (level >= 2) return cellSize * .88;
    if (level >= 1) return cellSize * .66;
    return 28;
  }

  function resetMassPierce() {
    if (!run) return;
    run.massPierceRowsLeft = 0;
    run.massPierceStrongLeft = 0;
    run.massPierceRows?.clear?.();
    run.massPierceTriggered = false;
  }

  function prepareMassPierce(impactSpeed, isFalling) {
    const level = elementalLevel('mass');
    const triggerSpeed = level >= 2 ? 150 : 180;
    if (level < 1 || !isFalling || impactSpeed < triggerSpeed || run.massPierceTriggered) return;
    run.massPierceTriggered = true;
    run.massPierceRowsLeft = level >= 2 ? Math.floor(rand(4, 7)) : Math.floor(rand(2, 5));
    run.massPierceStrongLeft = level >= 2 ? Math.floor(rand(1, 4)) : 0;
    run.massPierceRows.clear();
  }

  function massPiercesBlock(block, timestamp = performance.now()) {
    if (!elementalDamageable(block) || block.special || block.hazard || block.tier === 'ore') return false;
    const active = run.elementalAbilityActive === 'mass' && timestamp < run.elementalAbilityUntil;
    if (active) return true;
    const ordinary = block.tier === 'soft' || block.tier === 'dense';
    if (ordinary) {
      if (run.massPierceRows.has(block.row)) return true;
      if (run.massPierceRowsLeft <= 0) return false;
      run.massPierceRows.add(block.row);
      run.massPierceRowsLeft -= 1;
      return true;
    }
    if (elementalLevel('mass') >= 2 && run.massPierceStrongLeft > 0 && ['hard', 'reinforced'].includes(block.tier)) {
      run.massPierceStrongLeft -= 1;
      return true;
    }
    return false;
  }

  function blockCenter(block) {
    return { x: block.x + block.w / 2, y: block.y + block.h / 2 };
  }

  function nearbyGridBlocks(source, predicate = () => true) {
    return (run?.blocks || []).filter(block => {
      if (block === source || block.dead) return false;
      const rowDistance = Math.abs(block.row - source.row);
      const columnDistance = Math.abs(block.col - source.col);
      return rowDistance <= 1 && columnDistance <= 1 && rowDistance + columnDistance > 0 && predicate(block);
    });
  }

  function transferGigantismOverflow(source, amount, timestamp = performance.now()) {
    if (!source || amount <= 0 || elementalLevel('gigantism') < 2) return false;
    const candidates = nearbyGridBlocks(source, block => elementalDamageable(block)
      && !block.hazard
      && !block.special
      && block.tier !== 'ore')
      .sort((a, b) => {
        const score = block => (block.row > source.row ? 100 : block.row === source.row ? 35 : 0)
          - Math.abs(block.col - source.col) * 18
          + block.row;
        return score(b) - score(a);
      });
    const target = candidates[0];
    if (!target) return false;
    const from = blockCenter(source);
    const to = blockCenter(target);
    pushElementalEffect('gigantismOverflow', from.x, from.y, { toX: to.x, toY: to.y, amount });
    damageBlockByElement(target, amount, 'gigantismOverflow', timestamp);
    return true;
  }

  function elementalDamageable(block) {
    return Boolean(block && !block.dead && !block.unbreakable && !block.hazard);
  }

  function frostFreezable(block) {
    return Boolean(
      elementalDamageable(block)
      && !block.hazard
      && !block.special
      && block.tier !== 'ore'
      && !block.frozenOre
    );
  }

  function goldEligible(block) {
    return Boolean(elementalDamageable(block) && !block.hazard && !block.special);
  }

  function blockIsGolden(block, timestamp = performance.now()) {
    return Boolean(goldEligible(block) && (block.elementalGolden || timestamp < (run?.goldRushUntil || 0)));
  }

  function goldifyBlock(block, timestamp = performance.now()) {
    if (!goldEligible(block) || block.elementalGolden) return false;
    block.elementalGolden = true;
    block.goldFlashUntil = timestamp + 700;
    block.maxHp = 1;
    block.hp = 1;
    createDebris(block, 3, false);
    return true;
  }

  function throwGoldCoin(source, timestamp = performance.now()) {
    const candidates = run.blocks
      .filter(block => goldEligible(block) && !block.elementalGolden && block.row > source.row)
      .map(block => ({ block, distance: block.row - source.row }))
      .filter(item => item.distance <= 7)
      .sort((a, b) => a.distance - b.distance + rand(-3, 3));
    const target = candidates[Math.floor(Math.random() * Math.min(5, candidates.length))]?.block;
    if (!target || !goldifyBlock(target, timestamp)) return false;
    const from = blockCenter(source);
    const to = blockCenter(target);
    pushElementalEffect('coinArc', from.x, from.y, { toX: to.x, toY: to.y });
    return true;
  }

  function triggerCategoryBlast(source, damage, timestamp = performance.now()) {
    if (!source || run.categoryBlastDepth >= 2) return 0;
    const center = blockCenter(source);
    pushElementalEffect('categoryBlast', center.x, center.y, { damage });
    const targets = nearbyGridBlocks(source, elementalDamageable);
    run.categoryBlastDepth += 1;
    let hit = 0;
    try {
      for (const target of targets) {
        damageBlockByElement(target, damage, 'categoryBlast', timestamp);
        hit += 1;
      }
    } finally {
      run.categoryBlastDepth -= 1;
    }
    run.shake = Math.max(run.shake, damage >= 2 ? 5.5 : 3.5);
    return hit;
  }

  function pushElementalEffect(type, x, y, extra = {}) {
    if (!run?.specialEffects) return;
    const life = type === 'electricArc' ? .42
      : type === 'firePulse' ? .5
        : type === 'frostTouch' ? .38
          : type === 'snowShard' ? .72
            : type === 'snowballArc' ? 1.02
        : type === 'snowballKnockback' ? .62
          : type === 'coinArc' ? .72
            : type === 'categoryBlast' ? .48
              : .58;
    run.specialEffects.push({ type, x, y, life, maxLife: life, ...extra });
    if (run.specialEffects.length > 36) run.specialEffects.shift();
  }

  function markFrostTransformation(block, timestamp, kind) {
    block.frostTransformStartedAt = timestamp;
    block.frostTransformDuration = kind === 'snowflake' ? 620 : 470;
    block.frostReservedUntil = 0;
    const center = blockCenter(block);
    pushElementalEffect('frostTouch', center.x, center.y, { compact: kind !== 'snowflake' });
  }

  function turnBlockToSnow(block, timestamp = performance.now()) {
    if (!frostFreezable(block) || block.elementalSnow || block.elementalSnowflake) return false;
    ensureWorldSprites(2);
    block.elementalSnow = true;
    block.elementalFrozen = false;
    block.elementalFrostPower = 0;
    block.maxHp = 1;
    block.hp = 1;
    block.frostFlashUntil = timestamp + 520;
    markFrostTransformation(block, timestamp, 'snow');
    createDebris(block, 2, false);
    return true;
  }

  function turnBlockToSnowflake(block, timestamp = performance.now()) {
    if (!frostFreezable(block) || block.elementalSnowflake) return false;
    ensureWorldSprites(2);
    block.elementalSnow = false;
    block.elementalSnowflake = true;
    block.elementalFrozen = false;
    block.maxHp = 1;
    block.hp = 1;
    block.frostFlashUntil = timestamp + 760;
    markFrostTransformation(block, timestamp, 'snowflake');
    return true;
  }

  function frostTargetAvailable(block, timestamp = performance.now()) {
    return frostFreezable(block)
      && !block.elementalSnow
      && !block.elementalSnowflake
      && timestamp >= (block.frostReservedUntil || 0);
  }

  function gridDistance(a, b) {
    return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col));
  }

  function chooseSpacedFrostTargets(candidates, count, source = null) {
    const selected = [];
    const tryDistance = minimum => {
      for (const block of candidates) {
        if (selected.length >= count) break;
        if (selected.includes(block)) continue;
        if (source && gridDistance(block, source) < 2) continue;
        if (selected.every(other => gridDistance(block, other) >= minimum)) selected.push(block);
      }
    };
    tryDistance(3);
    if (selected.length < count) tryDistance(2);
    return selected;
  }

  function reserveFrostProjectileTarget(block, timestamp, duration, delay = 0) {
    block.frostReservedUntil = timestamp + (duration + delay + .3) * 1000;
  }

  function snowTargetScore(block, source, preferVisible = true) {
    const center = blockCenter(block);
    const downward = clamp((block.row - source.row) / 8, -1, 1);
    const visible = center.y >= run.cameraY - run.cellSize && center.y <= run.cameraY + VIEW_H + run.cellSize;
    return Math.random() * 1.8 + Math.max(0, downward) * 2.5 + (downward >= 0 ? 1.4 : 0) + (preferVisible && visible ? .8 : 0);
  }

  function scatterSnowShards(source, timestamp = performance.now()) {
    if (elementalLevel('frost') < 2 || Math.random() >= .35) return 0;
    const count = 2 + Math.floor(Math.random() * 4);
    const maxY = run.cameraY + VIEW_H + run.cellSize * 4;
    const ranked = run.blocks
      .filter(block => frostTargetAvailable(block, timestamp) && block.row >= source.row + 2 && blockCenter(block).y <= maxY)
      .map(block => ({ block, score: snowTargetScore(block, source, true) }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.block);
    const candidates = chooseSpacedFrostTargets(ranked, count, source);
    const from = blockCenter(source);
    for (const block of candidates) {
      const to = blockCenter(block);
      const delay = candidates.indexOf(block) * .055;
      reserveFrostProjectileTarget(block, timestamp, .72, delay);
      pushElementalEffect('snowShard', from.x, from.y, {
        toX: to.x, toY: to.y, targetBlockId: block.id, transformKind: 'snow', delay
      });
    }
    return candidates.length;
  }

  function detonateSnowflakeBlock(source, timestamp = performance.now()) {
    let transformed = 0;
    for (const block of nearbyGridBlocks(source, frostFreezable)) {
      if (turnBlockToSnow(block, timestamp)) transformed += 1;
    }
    const center = blockCenter(source);
    pushElementalEffect('frostPulse', center.x, center.y);
    run.shake = Math.max(run.shake, 3.8);
    return transformed;
  }

  function seedFrostSnowflakes(timestamp = performance.now()) {
    ensureWorldSprites(2);
    const source = {
      row: Math.floor((run.slime.y - 285) / run.cellSize),
      col: Math.floor((run.slime.x - run.gridLeft) / run.cellSize)
    };
    const targetCount = 7 + Math.floor(Math.random() * 4);
    const viewportBottom = run.cameraY + VIEW_H;
    const candidates = run.blocks
      .filter(block => frostTargetAvailable(block, timestamp) && block.row >= source.row + 3)
      .map(block => {
        const center = blockCenter(block);
        const visible = center.y <= viewportBottom + run.cellSize;
        const depthBonus = clamp((block.row - source.row) / 16, 0, 1) * 1.4;
        return { block, score: snowTargetScore(block, source, visible) + depthBonus + Math.random() };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.block);
    const targets = chooseSpacedFrostTargets(candidates, targetCount, source);
    const origin = { x: run.slime.x, y: run.slime.y };
    targets.forEach((block, index) => {
      const target = blockCenter(block);
      const delay = .16 + index * .115;
      reserveFrostProjectileTarget(block, timestamp, 1.02, delay);
      pushElementalEffect('snowballArc', origin.x, origin.y, {
        toX: target.x, toY: target.y, targetBlockId: block.id, transformKind: 'snowflake', delay
      });
    });
    return targets.length;
  }

  function igniteBlock(block, timestamp = performance.now(), auraId = 0) {
    if (!elementalDamageable(block)) return false;
    if (auraId && block.lastFireAuraId === auraId) return false;
    if (auraId) block.lastFireAuraId = auraId;
    if (block.fireDamageAt > timestamp) return false;
    block.fireIgnitedAt = timestamp;
    block.fireDamageAt = timestamp + 1000;
    block.fireFlashUntil = block.fireDamageAt + 360;
    return true;
  }

  function spreadFireFrom(source, timestamp) {
    if (elementalLevel('fire') < 2) return;
    const candidates = nearbyGridBlocks(source, elementalDamageable)
      .filter(block => !(block.fireDamageAt > timestamp))
      .sort(() => Math.random() - .5);
    const target = candidates[0];
    if (!target) return;
    igniteBlock(target, timestamp);
    const from = blockCenter(source);
    const to = blockCenter(target);
    pushElementalEffect('firePulse', to.x, to.y, { fromX: from.x, fromY: from.y });
  }

  function damageBlockByElement(block, amount, cause, timestamp = performance.now()) {
    if (!elementalDamageable(block)) return false;
    const damage = Math.max(0, amount);
    block.hp = Math.max(0, block.hp - damage);
    if (cause === 'electric') {
      const blue = elementalLevel('electric') >= 3 || (run.elementalAbilityActive === 'electric' && timestamp < run.elementalAbilityUntil);
      block.electricFlashStartedAt = timestamp;
      block.electricFlashUntil = timestamp + 430;
      block.electricFlashColor = blue ? 'blue' : 'yellow';
    }
    if (block.hp > 0) {
      createDebris(block, 2, false);
      return false;
    }
    block.hp = 0;
    destroyBlock(block, cause, timestamp);
    if (cause === 'fire') spreadFireFrom(block, timestamp);
    return true;
  }

  function electricChainTargets(first, count) {
    if (!first || count <= 0) return [];
    const targets = [first];
    const visited = new Set([first.id]);
    let current = first;
    while (targets.length < count) {
      const preferSideStep = targets.length % 4 === 3 && Math.random() < .72;
      const score = block => {
        const rowStep = block.row - current.row;
        const columnStep = Math.abs(block.col - current.col);
        const direction = preferSideStep
          ? (rowStep === 0 ? 95 : rowStep > 0 ? 62 : -55)
          : (rowStep > 0 ? 112 : rowStep === 0 ? 38 : -68);
        return direction - columnStep * 6 + block.row * 1.8 + rand(-13, 13);
      };
      const candidates = nearbyGridBlocks(current, elementalDamageable)
        .filter(block => !visited.has(block.id))
        .sort((a, b) => score(b) - score(a));
      if (!candidates.length) break;
      current = candidates[0];
      visited.add(current.id);
      targets.push(current);
    }
    return targets;
  }

  function strikeElectricChain(first, count, origin, timestamp = performance.now()) {
    const targets = electricChainTargets(first, count);
    if (!targets.length) return 0;
    const points = [origin, ...targets.map(blockCenter)];
    const blue = elementalLevel('electric') >= 3 || (run.elementalAbilityActive === 'electric' && timestamp < run.elementalAbilityUntil);
    targets.forEach((block, index) => {
      damageBlockByElement(block, 1, 'electric', timestamp);
      block.electricFlashStartedAt = timestamp + index * 54;
      block.electricFlashUntil = block.electricFlashStartedAt + 430;
      block.electricFlashColor = blue ? 'blue' : 'yellow';
    });
    const life = .34 + targets.length * .075;
    pushElementalEffect('electricArc', origin.x, origin.y, {
      points, colorMode: blue ? 'blue' : 'yellow', seed: Math.random() * 1000, life, maxLife: life
    });
    return targets.length;
  }

  function dischargeFromImpact(source, count, timestamp) {
    const candidates = nearbyGridBlocks(source, elementalDamageable).sort((a, b) => {
      const score = block => (block.row > source.row ? 80 : block.row === source.row ? 24 : -45) + block.row * 1.4 + rand(-18, 18);
      return score(b) - score(a);
    });
    const first = candidates[0];
    return first ? strikeElectricChain(first, count, blockCenter(source), timestamp) : 0;
  }

  function startBlackHoleSuction(block, timestamp = performance.now()) {
    if (!elementalDamageable(block) || block.blackHoleSuctionStartedAt) return false;
    block.blackHoleSuctionStartedAt = timestamp;
    block.blackHoleSuctionDuration = rand(420, 700);
    block.blackHoleSuctionSpin = rand(-2.8, 2.8);
    return true;
  }

  function updateBlackHoleSuction(timestamp = performance.now()) {
    if (!run) return;
    for (const block of run.blocks) {
      if (block.dead || !block.blackHoleSuctionStartedAt) continue;
      const progress = clamp((timestamp - block.blackHoleSuctionStartedAt) / Math.max(1, block.blackHoleSuctionDuration), 0, 1);
      if (progress < 1) continue;
      block.x = run.slime.x - block.w / 2;
      block.y = run.slime.y - block.h / 2;
      destroyBlock(block, 'cosmos', timestamp);
    }
  }

  function pullBlocksIntoBlackHole(timestamp = performance.now()) {
    const center = { x: run.slime.x, y: run.slime.y };
    const radius = run.cellSize * 3.35;
    const candidates = run.blocks
      .filter(block => elementalDamageable(block) && !block.blackHoleSuctionStartedAt)
      .map(block => ({ block, center: blockCenter(block) }))
      .map(item => ({ ...item, distance: Math.hypot(item.center.x - center.x, item.center.y - center.y) }))
      .filter(item => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance + rand(-9, 9));
    let pulled = 0;
    for (const item of candidates.slice(0, 4)) {
      if (startBlackHoleSuction(item.block, timestamp + pulled * 28)) pulled += 1;
    }
    return pulled;
  }

  function updateElementalEffects(timestamp = performance.now()) {
    if (!run || run.ended) return;

    updateBlackHoleSuction(timestamp);

    for (const block of run.blocks) {
      if (block.dead || !block.fireDamageAt || timestamp < block.fireDamageAt) continue;
      block.fireDamageAt = 0;
      damageBlockByElement(block, 1, 'fire', timestamp);
    }

    const active = run.elementalAbilityActive;
    if (!active) return;
    if (timestamp >= run.elementalAbilityUntil) {
      run.elementalAbilityActive = '';
      run.elementalAbilityNextTickAt = 0;
      if (active === 'mass') resetMassPierce();
      if (active === 'gigantism') {
        run.gigantismDeflateStartedAt = timestamp;
        run.gigantismDeflateUntil = timestamp + 620;
        run.emotion = 'surprised';
        run.emotionUntil = timestamp + 620;
        pushElementalEffect('gigantismDeflate', run.slime.x, run.slime.y, { life: .72, maxLife: .72 });
        impact('ПШ-Ш-Ш… ОБРАТНО!');
        feedback([5, 8, 4]);
      }
      return;
    }
    if (timestamp < run.elementalAbilityNextTickAt) return;

    const center = { x: run.slime.x, y: run.slime.y };
    if (active === 'frost') {
      run.elementalAbilityNextTickAt = timestamp + 240;
    } else if (active === 'electric') {
      const candidates = run.blocks
        .filter(elementalDamageable)
        .map(block => ({ block, distance: Math.hypot(blockCenter(block).x - center.x, blockCenter(block).y - center.y) }))
        .filter(item => item.distance <= run.cellSize * 2.45)
        .sort((a, b) => (b.block.row - a.block.row) * 26 + a.distance - b.distance + rand(-18, 18));
      if (candidates[0]) strikeElectricChain(candidates[0].block, 1 + Math.floor(Math.random() * 4), center, timestamp);
      run.elementalAbilityNextTickAt = timestamp + 155;
    } else if (active === 'fire') {
      for (const block of run.blocks) {
        if (!elementalDamageable(block)) continue;
        const target = blockCenter(block);
        if (Math.hypot(target.x - center.x, target.y - center.y) <= run.cellSize * 1.55) {
          igniteBlock(block, timestamp, run.elementalAuraId);
        }
      }
      run.elementalAbilityNextTickAt = timestamp + 220;
    } else if (active === 'cosmos') {
      pullBlocksIntoBlackHole(timestamp);
      run.slime.vx *= .985;
      run.slime.vy *= .985;
      run.elementalAbilityNextTickAt = timestamp + 120;
    } else if (active === 'mass') {
      run.slime.vy = Math.max(390, run.slime.vy);
      run.slime.vx *= .92;
      run.massPierceTriggered = true;
      run.elementalAbilityNextTickAt = timestamp + 50;
    } else if (active === 'mobility') {
      run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, run.elementalAbilityUntil);
      run.elementalAbilityNextTickAt = timestamp + 90;
    } else if (active === 'wind') {
      run.elementalAbilityNextTickAt = timestamp + 70;
    } else if (active === 'gigantism') {
      run.slime.vy = Math.max(170, run.slime.vy);
      run.elementalAbilityNextTickAt = timestamp + 70;
    } else {
      run.elementalAbilityNextTickAt = timestamp + 180;
    }
  }

  function resolveBlockHit(block, collision, timestamp = performance.now()) {
    const s = run.slime;
    const drillActive = speedDrillActive(timestamp) || windTornadoActive(timestamp);

    const fireLevel = elementalLevel('fire');
    const electricLevel = elementalLevel('electric');
    if (fireLevel >= 1) igniteBlock(block, timestamp);
    if (electricLevel >= 1) dischargeFromImpact(block, electricLevel >= 2 ? 1 + Math.floor(Math.random() * 4) : 1, timestamp);
    if (block.dead) return false;

    if (block.hazard) {
      return resolveHazardHit(block, collision, timestamp);
    }
    if (block.special === 'pandora') {
      return activatePandoraBox(block, timestamp);
    }
    if (block.special === 'jelly' && !drillActive) return activateJellyBounce(block, collision, timestamp);
    if (block.special === 'geyser' && !drillActive) return activateGeyser(block, timestamp);
    if (block.special === 'spring' && !drillActive) return activateSpring(block, collision, timestamp);
    const frozenSlime = isSlimeFrozen(timestamp);
    const gravityDirection = run.effects.gravitySwitch ? Math.sign(run.gravityDirection || 1) : 1;
    const isFalling = s.vy * gravityDirection > 0;
    const tierData = BLOCK_TIERS[block.tier] || BLOCK_TIERS.dense;
    const impactSpeed = Math.max(70, Math.hypot(s.vx, s.vy));
    const unbreakable = Boolean(block.unbreakable);
    const gigantismLevel = elementalLevel('gigantism');
    const gigantismPowered = gigantismActive(timestamp);
    let damage = gigantismLevel >= 1 && !block.special && block.tier !== 'ore' ? 2 : 1;
    if (gigantismPowered) damage = Math.max(damage, 3);
    prepareMassPierce(impactSpeed, isFalling);
    const frostLevel = elementalLevel('frost');
    if (frostLevel >= 1 && frostFreezable(block) && !block.elementalSnow && !block.elementalSnowflake && block.hp > 1) {
      turnBlockToSnow(block, timestamp);
      damage = 0;
    }
    const goldLevel = elementalLevel('gold');
    const goldenBeforeHit = blockIsGolden(block, timestamp);
    let goldTransformed = false;
    if (goldLevel >= 1 && goldEligible(block)) {
      if (goldenBeforeHit) damage = block.hp;
      else if (block.tier !== 'soft' && block.hp > 1) {
        goldTransformed = goldifyBlock(block, timestamp);
        if (goldTransformed) damage = 0;
      }
    }
    const cosmosBoosted = cosmosBoostActive();
    const cosmosPiercing = cosmosBoosted
      && !unbreakable
      && !block.special
      && ['soft', 'dense', 'hard', 'reinforced'].includes(block.tier);
    if (cosmosPiercing) damage = block.hp;
    else if (cosmosBoosted && damage > 0) damage += 1;
    const hpBefore = block.hp;
    const breaksOnTouch = ['bomb', 'gel', 'cryo', 'meteor'].includes(block.special);
    if (breaksOnTouch && !unbreakable) damage = hpBefore;
    const geyserPiercing = !unbreakable && run.geyserBreaksLeft > 0 && block.special !== 'geyser';
    if (geyserPiercing) damage = hpBefore;
    const massPiercing = massPiercesBlock(block, timestamp);
    if (massPiercing) damage = hpBefore;
    const speedBurstPiercing = speedBurstPiercesBlock(block, isFalling, timestamp);
    if (speedBurstPiercing) damage = hpBefore;
    const windDashPiercing = windDashPiercesBlock(block, timestamp);
    if (windDashPiercing) damage = hpBefore;
    const drillPiercing = drillActive && !unbreakable;
    if (drillPiercing) damage = hpBefore;
    const gigantismOverflow = gigantismLevel >= 2 ? Math.max(0, damage - hpBefore) : 0;
    const destroysImmediately = !unbreakable && (breaksOnTouch || geyserPiercing || massPiercing || speedBurstPiercing || windDashPiercing || drillPiercing || damage >= hpBefore);
    let healthLoss = 0;
    if (frozenSlime || breaksOnTouch) healthLoss = 0;
    if (healthLoss > 0 && timestamp < run.damageInvulnerableUntil) healthLoss = 0;
    const barrierAbsorbed = Math.min(Math.max(0, run.barrier || 0), healthLoss);
    if (barrierAbsorbed > 0) {
      run.barrier = Math.max(0, run.barrier - barrierAbsorbed);
      run.barrierFlashUntil = timestamp + 380;
      healthLoss = Math.max(0, healthLoss - barrierAbsorbed);
    }
    run.health = Math.max(0, run.health - healthLoss);
    if (healthLoss > 0) run.damageInvulnerableUntil = timestamp + 2000;
    if (!frozenSlime) {
      run.healthFlash = healthLoss > 0 ? -1 : 1;
      run.healthFlashTime = .22;
      if (healthLoss > 0) run.hurtFlashUntil = timestamp + 1000;
    }
    run.shake = Math.max(run.shake, clamp(impactSpeed / 165, 1.0, destroysImmediately ? 3.8 : 5.8));
    if (!frozenSlime) {
      run.emotion = destroysImmediately ? 'impact' : healthLoss > 0 ? 'hurt' : 'focused';
      run.emotionUntil = timestamp + (destroysImmediately ? 260 : healthLoss > 0 ? 430 : 260);
    }

    if (destroysImmediately) {
      block.hp = 0;
      const withinComboGrace = run.comboCount > 0 && timestamp <= run.comboGraceUntil;
      const hasComboMomentum = isFalling && (Math.abs(s.vy) >= 110 || withinComboGrace);
      let comboAdvanced = false;
      let comboStepReached = false;
      if (breaksOnTouch) preserveCombo(timestamp);
      else if (hasComboMomentum) {
        const comboResult = registerComboLayer(block.row, timestamp);
        comboAdvanced = comboResult.registered;
        comboStepReached = comboResult.multiplierChanged;
      }
      else resetCombo();
      destroyBlock(block, 'impact', timestamp);
      if (gigantismOverflow > 0) transferGigantismOverflow(block, gigantismOverflow, timestamp);
      if (cosmosBoosted) consumeCosmosBoostBlock(timestamp);
      if (geyserPiercing) run.geyserBreaksLeft = Math.max(0, run.geyserBreaksLeft - 1);
      const speedBurstBlocksLeft = speedBurstPiercing ? consumeSpeedBurstBlock(timestamp) : -1;
      const windDashBlocksLeft = windDashPiercing ? consumeWindDashBlock(timestamp) : -1;
      if (!drillPiercing && !speedBurstPiercing && !windDashPiercing && !cosmosBoosted) {
        const drag = block.tier === 'soft' ? BALANCE.weakBreakDrag : BALANCE.denseBreakDrag;
        const travelDirection = Math.sign(s.vy) || gravityDirection;
        s.vy = massPiercing
          ? travelDirection * Math.max(310, Math.abs(s.vy) * .94)
          : travelDirection * Math.max(110, Math.abs(s.vy) * drag * tierData.drag);
        s.vx *= .95;
      } else if (cosmosBoosted && run.cosmosBoostBlocksLeft > 0) {
        s.vy = Math.max(440, Math.abs(s.vy));
        s.vx *= .96;
      } else if (windDashPiercing && windDashBlocksLeft > 0) {
        const speed = Math.max(1, Math.hypot(s.vx, s.vy));
        const keptSpeed = Math.max(390, speed);
        s.vx = s.vx / speed * keptSpeed;
        s.vy = s.vy / speed * keptSpeed;
      }
      let keep = block.tier === 'soft' ? BALANCE.flightKeepSoft : block.tier === 'dense' || block.tier === 'special' || block.tier === 'ore' ? BALANCE.flightKeepDense : BALANCE.flightKeepHard;
      run.flightDistance *= keep;

      if (speedBurstPiercing) impact(speedBurstBlocksLeft > 0 ? `БУР-РЫВОК · ЕЩЁ ${speedBurstBlocksLeft}` : 'БУР-РЫВОК');
      else if (windDashPiercing) impact(windDashBlocksLeft > 0 ? `ВОЗДУШНЫЙ РЫВОК · ЕЩЁ ${windDashBlocksLeft}` : 'ВОЗДУШНЫЙ РЫВОК');
      else if (comboAdvanced && comboStepReached) comboImpact(run.comboMultiplier, run.comboCount);
      else if (!block.special && run.comboCount < 2) impact('ПРОБОЙ · БЕЗ УРОНА');
      sound(block.special === 'coin' || block.tier === 'ore' ? 'coin' : 'break');
      if (run.health <= 0) endRun(false, 'У слайма закончилось здоровье');
      return false;
    }

    preserveCombo(timestamp);
    if (!unbreakable) block.hp = Math.max(.05, block.hp - damage);
    if (cosmosBoosted) consumeCosmosBoostBlock(timestamp);
    if (frozenSlime) {
      slideFrozenSlime(block, collision, timestamp);
      createDebris(block, 3, false);
      return true;
    }
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    s.x += collision.nx * (collision.penetration + (unbreakable ? 6 : 4));
    s.y += collision.ny * (collision.penetration + (unbreakable ? 6 : 4));
    applyBlockBounce(s, collision, { hazard: unbreakable, timestamp });
    run.flightDistance = 0;

    const hitsLeft = Math.max(1, Math.ceil(block.hp));
    const hitsLabel = hitsLeft === 1 ? 'ЕЩЁ 1 УДАР' : `ЕЩЁ ${hitsLeft} УДАРА`;
    impact(goldTransformed
      ? 'БЛОК СТАЛ ЗОЛОТЫМ · ЕЩЁ 1 УДАР'
      : block.special === 'spring'
      ? 'ПРУЖИНА'
      : block.special === 'boss'
        ? `СТРАЖ НЕДР · ${hitsLabel}`
        : unbreakable
          ? 'БЛОК НЕ ПОДДАЁТСЯ'
          : `БЛОК ТРЕСНУЛ · ${hitsLabel}`);
    sound(block.special === 'spring' ? 'bounce' : block.hazard || block.special === 'boss' ? 'hitHard' : 'hit');
    createDebris(block, 3, false);
    if (run.health <= 0) endRun(false, 'У слайма закончилось здоровье');
    return true;
  }

  function activatePandoraBox(block, timestamp = performance.now()) {
    if (!block || block.dead || block.pandoraOpened) return false;
    block.pandoraOpened = true;
    block.dead = true;
    const choices = ['meteor', 'bomb', 'heal', 'coins', 'shield']
      .filter(type => type !== 'heal' || run.health < run.maxHealth)
      .filter(type => type !== 'shield' || run.barrier < Math.max(20, run.shield));
    const effect = choices[Math.floor(Math.random() * choices.length)] || 'coins';
    const x = block.x + block.w / 2;
    const y = block.y + block.h / 2;
    spawnSpecialBurst('pandora', x, y);
    preserveCombo(timestamp);

    if (effect === 'meteor') {
      activateMeteorShower(block);
    } else if (effect === 'bomb') {
      spawnSpecialBurst('bomb', x, y);
      explodeAt(x, y, 118, .65, 45);
    } else if (effect === 'heal') {
      spawnSpecialBurst('heal', x, y);
      healRun(25, 'ЯЩИК ПАНДОРЫ');
    } else if (effect === 'shield') {
      run.barrier = Math.max(run.barrier, Math.max(25, run.shield));
      run.barrierFlashUntil = timestamp + 900;
      spawnSpecialBurst('shieldBurst', run.slime.x, run.slime.y);
    } else {
      const jackpot = 35 + (run.level || 1) * 10;
      run.coins += jackpot;
      for (let index = 0; index < 12; index += 1) {
        run.particles.push({
          kind: 'special', shape: 'orb', x, y,
          vx: rand(-155, 155), vy: rand(-220, -85), gravity: 260,
          life: rand(.55, .92), maxLife: .92, size: rand(3, 6),
          color: index % 2 ? '#ffe36d' : '#fff8ca'
        });
      }
    }
    run.emotion = 'surprised';
    run.emotionUntil = timestamp + 520;
    run.shake = Math.max(run.shake, effect === 'bomb' || effect === 'meteor' ? 7 : 4.5);
    sound(effect === 'bomb' ? 'break' : 'epic');
    feedback(effect === 'bomb' || effect === 'meteor' ? [10, 18, 9] : [7, 12, 7]);
    return false;
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
    run.bounceControlLockUntil = timestamp + 220;
    run.bounceControlRestoreUntil = timestamp + 500;
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

  function destroyBlock(block, cause = 'impact', timestamp = performance.now()) {
    if (!block || block.dead) return;
    // Hazards are removed only by direct slime contact in resolveHazardHit.
    // No mutation, chained attack or explosion may clear them remotely.
    if (block.hazard) return false;
    if (typeof cause !== 'string') cause = 'impact';
    const wasGolden = blockIsGolden(block, timestamp);
    const wasSnow = Boolean(block.elementalSnow);
    const wasSnowflake = Boolean(block.elementalSnowflake);
    block.dead = true;
    run.blocksDestroyed += 1;
    registerBrokenBlock(block);
    const reward = block.coins * run.comboMultiplier * run.coinMultiplier * (wasGolden ? 2 : 1);
    run.coins += reward;
    createDebris(block, block.special === 'geyser' ? 0 : block.special === 'bomb' ? 8 : 9, true);

    if (block.tier === 'ore' || block.frozenOre) {
      const ore = block.oreType || ORE_TYPES[0];
      const oreReward = Math.round(reward);
      impact(`${ore.label} +${oreReward}`);
    } else if (block.special === 'coin') {
      impact('БЛОК РАЗРУШЕН');
    } else if (block.special === 'gel') {
      spawnSpecialBurst('heal', block.x + block.w / 2, block.y + block.h / 2);
      healRun(25, 'ЛЕЧЕНИЕ');
    } else if (block.special === 'meteor') {
      activateMeteorShower(block);
    } else if (block.special === 'spring') {
      impact('ПРУЖИНА СЛОМАНА!');
    } else if (block.special === 'cryo') {
      weakenCryoArea4x4(block);
    } else if (block.special === 'bomb') {
      explodeBomb(block);
    } else if (block.special === 'boss') {
      run.shake = Math.max(run.shake, 10);
      impact('СТРАЖ НЕДР ПОБЕЖДЁН!');
      sound('epic');
    }

    if (wasSnowflake) detonateSnowflakeBlock(block, timestamp);
    else if (wasSnow) scatterSnowShards(block, timestamp);

    if (wasGolden && elementalLevel('gold') >= 2 && Math.random() < .35) {
      throwGoldCoin(block, timestamp);
    }

    const explosionLevel = elementalLevel('explosion');
    const chainActive = run.elementalAbilityActive === 'explosion' && timestamp < run.elementalAbilityUntil;
    if (chainActive && run.categoryBlastDepth < 2) {
      triggerCategoryBlast(block, 2, timestamp);
    } else if (cause !== 'categoryBlast' && explosionLevel >= 1) {
      run.blastCounter += 1;
      const threshold = explosionLevel >= 2 ? 8 : 10;
      if (run.blastCounter >= threshold) {
        run.blastCounter = 0;
        triggerCategoryBlast(block, explosionLevel >= 2 ? 2 : 1, timestamp);
      }
    }
  }

  function registerBrokenBlock(block) {
    awardResearchData(block);
    if (!run?.effects?.breakHealEveryFive) return;
    run.blocksBrokenForHeal += 1;
    if (run.blocksBrokenForHeal % 5 !== 0) return;
    spawnSpecialBurst('heal', block.x + block.w / 2, block.y + block.h / 2);
    healRun(5, '5-Й СЛОМАННЫЙ БЛОК');
  }

  function awardResearchData(block) {
    if (!run || !block || block.researchAwarded) return 0;
    block.researchAwarded = true;
    const amount = Math.max(0, Math.round(block.researchValue || 0));
    if (!amount) return 0;
    run.researchData += amount;
    if (els.runResearchScore) els.runResearchScore.textContent = run.researchData.toLocaleString('ru-RU');
    if (els.runResearchHud) els.runResearchHud.setAttribute('aria-label', `Данные исследования за забег: ${run.researchData}`);
    if (els.runResearchGain) {
      els.runResearchGain.textContent = `+${amount}`;
      els.runResearchGain.classList.remove('is-visible');
      void els.runResearchGain.offsetWidth;
      els.runResearchGain.classList.add('is-visible');
      clearTimeout(runResearchPulseTimer);
      runResearchPulseTimer = setTimeout(() => els.runResearchGain?.classList.remove('is-visible'), 460);
    }
    if (els.runResearchHud) {
      els.runResearchHud.classList.remove('is-collecting');
      void els.runResearchHud.offsetWidth;
      els.runResearchHud.classList.add('is-collecting');
    }
    return amount;
  }

  function weakenCryoArea4x4(source) {
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
      block.visualId = '';
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

  function activateFreezeZone(timestamp = performance.now()) {
    run.freezeUntil = timestamp + FREEZE_ZONE_DURATION_MS;
    run.frozenEmotion = 'surprised';
    run.slime.vx *= .62;
    run.slime.vy = Math.max(155, run.slime.vy);
    run.healthFlash = 1;
    run.healthFlashTime = .65;
    run.shake = Math.max(run.shake, 5.5);
    spawnSpecialBurst('freeze', run.slime.x, run.slime.y);
    impact('ЛЕДЯНАЯ ВОДА · ЗАМОРОЗКА И НЕУЯЗВИМОСТЬ · 3с');
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
      if (block.dead || block.unbreakable || block.hazard || Math.abs(block.row - row) > 1 || Math.abs(block.col - col) > 1) continue;
      block.dead = true;
      run.blocksDestroyed += 1;
      registerBrokenBlock(block);
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
    trimParticles(240);
  }

  function healRun(amount, label = 'ЛЕЧЕНИЕ') {
    const before = run.health;
    run.health = Math.min(run.maxHealth, run.health + 1);
    const healed = Math.max(0, run.health - before);
    const timestamp = performance.now();
    run.healthFlash = 1;
    run.healthFlashTime = .58;
    run.healGlowUntil = timestamp + 980;
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 720;
    impact(healed > 0 ? `${label} · +1 СЕРДЦЕ` : `${label} · СЕРДЦА ПОЛНЫЕ`);
    sound('happy');
    feedback([7, 12, 7]);
  }

  function explodeAt(x, y, radius = 125, rewardScale = .6, damage = Infinity, collectChainBombs = false) {
    let destroyed = 0;
    const chainBombs = [];
    for (const block of run.blocks) {
      if (block.dead || block.unbreakable || block.hazard) continue;
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
        registerBrokenBlock(block);
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
      if (block.dead || block === source || block.unbreakable || block.hazard) continue;
      if (Math.abs(block.row - source.row) > radiusCells || Math.abs(block.col - source.col) > radiusCells) continue;
      block.dead = true;
      run.blocksDestroyed += 1;
      registerBrokenBlock(block);
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
    trimParticles(180);
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
    trimParticles(210);
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

  function spawnSpecialBurst(type, x, y, nx = 0, ny = -1) {
    if (!run) return;
    const config = {
      spring: { colors: ['#efffff', '#62efff', '#1ec8ff', '#ffffff'], count: 11, life: .82 },
      bomb: { colors: ['#fff7c7', '#ffd65a', '#ff8a3d', '#f34e56'], count: 20, life: .9 },
      heal: { colors: ['#effff4', '#8dffba', '#31d98b', '#ffffff'], count: 8, life: .9 },
      cryo: { colors: ['#effcff', '#a9efff', '#54cfff', '#ffffff'], count: 8, life: 1.05 },
      freeze: { colors: ['#f4feff', '#c7f6ff', '#73dcff', '#3ba9ed'], count: 11, life: 1.06 },
      jelly: { colors: ['#fff0f7', '#ff9bc1', '#ff3f88', '#ffffff'], count: 9, life: .72 },
      pandora: { colors: ['#ff4ca3', '#4bdcff', '#ffe45c', '#65ed9a', '#bb66ff'], count: 18, life: .92 },
      split: { colors: ['#f3ffd0', '#91ef70', '#53c75d', '#ffffff'], count: 12, life: .7 },
      geyser: { colors: ['#fff4d0', '#ffbd45', '#ff6a2b', '#d9d9d4'], count: 4, life: .68 },
      chargedHit: { colors: ['#fff8b0', '#ffc94d', '#ff8747', '#ffffff'], count: 13, life: .46 },
      shieldBurst: { colors: ['#ecfaff', '#99eaff', '#6d9dff', '#ffffff'], count: 16, life: .7 },
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
        : type === 'chargedHit'
          ? rand(125, 230)
          : type === 'shieldBurst'
            ? rand(155, 260)
        : type === 'spring'
          ? rand(210, 345)
          : type === 'geyser'
            ? rand(105, 185)
              : rand(55, 145);
      run.particles.push({
        kind: 'special', x, y,
        vx: bombSmoke ? rand(-52, 52) : Math.cos(angle) * speed,
        vy: bombSmoke ? rand(-88, -34) : Math.sin(angle) * speed,
        gravity: bombSmoke ? -12 : type === 'bomb' ? 145 : type === 'heal' ? -42 : type === 'jelly' ? 26 : type === 'pandora' ? 40 : type === 'freeze' ? 12 : type === 'geyser' ? -10 : type === 'shieldBurst' ? 12 : 32,
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
          : 'orb'
      });
    }
    if (run.specialEffects.length > 16) run.specialEffects.shift();
    trimParticles(240);
  }

  function updateSpecialEffects(dt) {
    if (!run?.specialEffects) return;
    const timestamp = performance.now();
    for (const effect of run.specialEffects) {
      if ((effect.delay || 0) > 0) {
        effect.delay = Math.max(0, effect.delay - dt);
        continue;
      }
      effect.life -= dt;
      if (effect.life > 0 || effect.resolved || !effect.targetBlockId) continue;
      effect.resolved = true;
      const target = run.blocks.find(block => block.id === effect.targetBlockId);
      if (!target || target.dead) continue;
      if (effect.transformKind === 'snowflake') turnBlockToSnowflake(target, timestamp);
      else if (effect.transformKind === 'snow') turnBlockToSnow(target, timestamp);
      target.frostReservedUntil = 0;
    }
    run.specialEffects = run.specialEffects.filter(effect => effect.life > 0);
  }

  function activateElementalAbility(timestamp = performance.now()) {
    const type = run?.elementalAbilityType;
    if (!type || run.elementalAbilityCharges <= 0 || run.elementalAbilityActive) return false;
    const duration = ELEMENTAL_ABILITY_DURATION_MS[type];
    if (!duration) return false;
    run.elementalAbilityCharges -= 1;
    run.elementalAbilityActive = type;
    run.elementalAbilityUntil = timestamp + duration;
    run.elementalAbilityNextTickAt = timestamp;
    run.elementalAuraId += 1;

    if (type === 'frost') {
      const seeded = seedFrostSnowflakes(timestamp);
      pushElementalEffect('frostPulse', run.slime.x, run.slime.y, { ultimate: true });
      impact(`СНЕЖНЫЙ ЗАЛП · ${seeded}`);
    } else if (type === 'electric') {
      pushElementalEffect('electricArc', run.slime.x, run.slime.y, {
        points: [{ x: run.slime.x, y: run.slime.y }], colorMode: 'blue', burst: true, seed: Math.random() * 1000
      });
      impact('ЧИСТАЯ ЭНЕРГИЯ · 3с');
    } else if (type === 'fire') {
      impact('ЖИВОЕ ПЛАМЯ · 5с');
    } else if (type === 'cosmos') {
      pullBlocksIntoBlackHole(timestamp);
      run.shake = Math.max(run.shake, 5);
      impact('ЧЁРНАЯ ДЫРА · 3с');
    } else if (type === 'gigantism') {
      run.gigantismStartedAt = timestamp;
      run.gigantismDeflateStartedAt = 0;
      run.gigantismDeflateUntil = 0;
      run.slime.vx *= .72;
      run.slime.vy = Math.max(235, run.slime.vy);
      run.shake = Math.max(run.shake, 8);
      run.emotion = 'surprised';
      run.emotionUntil = timestamp + 360;
      pushElementalEffect('gigantismPulse', run.slime.x, run.slime.y, { life: .68, maxLife: .68 });
      impact('ГИГАНТИЗМ · 3с');
    } else if (type === 'wind') {
      run.windDashBlocksLeft = 0;
      run.windDashUntil = 0;
      run.freezeUntil = Math.min(run.freezeUntil || timestamp, timestamp);
      const steering = fallSteeringVector();
      const inputLength = Math.hypot(steering.x, steering.y);
      const currentSpeed = Math.max(1, Math.hypot(run.slime.vx, run.slime.vy));
      const directionX = inputLength > .08 ? steering.x / inputLength : run.slime.vx / currentSpeed;
      const directionY = inputLength > .08 ? steering.y / inputLength : run.slime.vy / currentSpeed;
      run.slime.vx = directionX * 455;
      run.slime.vy = directionY * 455;
      run.shake = Math.max(run.shake, 6);
      pushElementalEffect('windTornadoStart', run.slime.x, run.slime.y, { life: .72, maxLife: .72 });
      impact('УПРАВЛЯЕМОЕ ТОРНАДО · 3с');
    } else if (type === 'gold') {
      run.goldRushUntil = run.elementalAbilityUntil;
      pushElementalEffect('coinArc', run.slime.x, run.slime.y, { toX: run.slime.x, toY: run.slime.y + run.cellSize * 1.8 });
      impact('ЗОЛОТАЯ ЛИХОРАДКА · 3с');
    } else if (type === 'explosion') {
      pushElementalEffect('categoryBlast', run.slime.x, run.slime.y, { damage: 2 });
      impact('ЦЕПНАЯ РЕАКЦИЯ · 3с');
    } else if (type === 'mass') {
      resetMassPierce();
      run.massPierceTriggered = true;
      run.slime.vy = Math.max(390, run.slime.vy);
      run.slime.vx *= .35;
      impact('ТЯЖЁЛЫЙ РЫВОК · 4с');
    } else if (type === 'mobility') {
      run.speedBurstBlocksLeft = 0;
      run.speedBurstUntil = 0;
      run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, run.elementalAbilityUntil);
      run.freezeUntil = Math.min(run.freezeUntil || timestamp, timestamp);
      const steering = fallSteeringVector();
      const inputLength = Math.hypot(steering.x, steering.y);
      const currentSpeed = Math.hypot(run.slime.vx, run.slime.vy);
      const directionX = inputLength > .08
        ? steering.x / inputLength
        : currentSpeed > 80 ? run.slime.vx / currentSpeed : 0;
      const directionY = inputLength > .08
        ? steering.y / inputLength
        : currentSpeed > 80 ? run.slime.vy / currentSpeed : 1;
      run.slime.vx = directionX * 430;
      run.slime.vy = directionY * 430;
      impact('СКОРОСТНОЙ БУР · 5с');
    }
    sound('epic');
    feedback([12, 20, 12]);
    updateRunUI();
    return true;
  }

  function activateAbility() {
    if (!run || run.ended || run.paused) return;
    if (run.elementalAbilityCharges > 0 || run.elementalAbilityActive) {
      activateElementalAbility();
      return;
    }
    if (run.shieldCharges <= 0 || run.barrier > 0) return;
    run.shieldCharges -= 1;
    run.barrier = Math.max(0, run.shield);
    const timestamp = performance.now();
    run.barrierFlashUntil = timestamp + 720;
    sound('epic');
    feedback([14, 22, 14]);
    impact(`ЩИТ +${Math.round(run.barrier)}`);
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
    const showPreviousBest = !run.endless && previousBest > 0 && previousBest < targetDepth;
    els.depthLabel.textContent = `${currentDepth} М`;
    if (els.runResearchScore) els.runResearchScore.textContent = Math.max(0, Math.floor(run.researchData || 0)).toLocaleString('ru-RU');
    if (els.runResearchHud) els.runResearchHud.setAttribute('aria-label', `Данные исследования за забег: ${Math.max(0, Math.floor(run.researchData || 0))}`);
    if (els.runCoinsGain) {
      const earnedCoins = Math.max(0, Math.floor(run.coins));
      els.runCoinsGain.textContent = `+${formatCompactNumber(earnedCoins)}`;
      els.runCoinsGain.title = `За забег: +${earnedCoins.toLocaleString('ru-RU')}`;
    }
    els.routeProgress.style.width = `${routePosition}%`;
    els.routeSlimeMarker.style.left = `${routePosition}%`;
    els.routeTargetLabel.textContent = run.endless ? `∞ · КРУГ ${run.endlessLap}` : `${targetDepth} М`;
    els.routeBestLabel.textContent = showPreviousBest ? `ПРОШЛЫЙ ${previousBest} М` : '';
    els.routeBestMarker.style.left = `${bestPosition}%`;
    els.routeBestMarker.classList.toggle('hidden', !showPreviousBest);
    const currentHearts = clamp(Math.round(run.health), 0, 3);
    const now = performance.now();
    els.runHearts.forEach((heart, index) => {
      heart.classList.toggle('is-empty', index >= currentHearts);
      heart.classList.toggle('is-lost', index === run.lastLostHeartIndex && now - run.lastHeartLossAt < 620);
    });
    const heartLabel = `${currentHearts} из 3 сердец`;
    if (els.runHeartCount) els.runHeartCount.textContent = String(currentHearts);
    els.runHeartHud?.setAttribute('aria-label', heartLabel);
    els.runHeartHud?.classList.toggle('is-low', currentHearts === 1);
    els.runHeartHud?.classList.toggle('is-hit', now - run.lastHeartLossAt < 420);
    els.runHeartHud?.querySelector('.run-hearts')?.setAttribute('aria-label', heartLabel);
    const elementalActive = run.elementalAbilityActive && now < run.elementalAbilityUntil;
    const showElemental = Boolean(elementalActive || run.elementalAbilityCharges > 0);
    const abilityIcon = els.abilityBtn.querySelector('img');
    if (showElemental) {
      const type = run.elementalAbilityType;
      const labels = {
        frost: 'СНЕЖНЫЙ ЗАЛП',
        electric: 'ЧИСТАЯ ЭНЕРГИЯ',
        fire: 'ЖИВОЕ ПЛАМЯ',
        cosmos: 'ЧЁРНАЯ ДЫРА',
        gigantism: 'ГИГАНТИЗМ',
        wind: 'ТОРНАДО',
        gold: 'ЗОЛОТАЯ ЛИХОРАДКА',
        explosion: 'ЦЕПНАЯ РЕАКЦИЯ',
        mass: 'ТЯЖЁЛЫЙ РЫВОК',
        mobility: 'СКОРОСТНОЙ БУР'
      };
      const icons = {
        frost: 'emblem-v2-frost.png',
        electric: 'emblem-v2-electric.png',
        fire: 'emblem-v2-fire.png',
        cosmos: 'emblem-v2-cosmos.png',
        gigantism: 'emblem-v2-gigantism.png',
        wind: 'emblem-v2-wind.png',
        gold: 'gold-aligned.png',
        explosion: 'emblem-v2-explosion.png',
        mass: 'weight-aligned.png',
        mobility: 'mobility-aligned.png'
      };
      const duration = ELEMENTAL_ABILITY_DURATION_MS[type] || 1;
      const remaining = Math.max(0, run.elementalAbilityUntil - now);
      const ready = run.elementalAbilityCharges > 0 && !elementalActive && !run.ended && !run.paused;
      if (abilityIcon) abilityIcon.src = `assets/ui/recipe-categories/${icons[type]}`;
      els.abilityPercent.textContent = elementalActive ? `${Math.max(.1, remaining / 1000).toFixed(1)}с` : `${run.elementalAbilityCharges}`;
      els.abilityBtn.style.setProperty('--ability', `${elementalActive ? remaining / duration * 100 : 100}%`);
      els.abilityBtn.disabled = !ready;
      els.abilityBtn.classList.toggle('is-ready', ready);
      els.abilityBtn.classList.toggle('is-active', Boolean(elementalActive));
      els.abilityBtn.setAttribute('aria-label', elementalActive ? `${labels[type]} действует` : `Активировать: ${labels[type]}`);
      els.abilityText.textContent = elementalActive ? `${labels[type]} · ${(remaining / 1000).toFixed(1)}с` : `${labels[type]} · 1 ЗАРЯД`;
      return;
    }

    const charges = clamp(Math.round(run.shieldCharges), 0, run.maxShieldCharges);
    if (abilityIcon) abilityIcon.src = 'assets/ui/stat-defense.webp';
    els.abilityPercent.textContent = `${charges}`;
    els.abilityBtn.style.setProperty('--ability', `${charges / Math.max(1, run.maxShieldCharges) * 100}%`);
    els.abilityBtn.disabled = charges <= 0 || run.barrier > 0 || run.ended || run.paused;
    els.abilityBtn.classList.toggle('is-ready', charges > 0 && run.barrier <= 0 && !run.ended);
    els.abilityBtn.classList.toggle('is-active', run.barrier > 0);
    els.abilityBtn.setAttribute('aria-label', 'Активировать барьер');
    els.abilityText.textContent = run.barrier > 0
      ? `ЩИТ ${Math.ceil(run.barrier)}/${Math.ceil(run.shield)} · ${charges}/${run.maxShieldCharges}`
      : `ЩИТ ${Math.ceil(run.shield)} · ${charges}/${run.maxShieldCharges}`;
  }

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

    drawBackground(world, timestamp);
    drawLaunchEntryPortal(world, timestamp);
    drawHoneyZones(timestamp, false);
    drawJellyZones(timestamp, false);
    drawFreezeZones(timestamp, false);
    drawFinishPortal(world, timestamp);

    const visibleBlocks = [];
    for (const block of run.blocks) {
      if (block.dead) continue;
      const sy = block.y - run.cameraY;
      if (sy < -60 || sy > VIEW_H + 60) continue;
      if (!block.blackHoleSuctionStartedAt) visibleBlocks.push(block);
      drawSuctionAwareBlock(block, sy, timestamp);
    }

    // A thin shared grid keeps every tile aligned without blending their art.
    drawBlockTransitions(visibleBlocks);
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
        ctx.shadowBlur = isLowPowerDevice() || p.shape === 'smoke' ? 0 : p.kind === 'portal' ? 9 : 6;
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
    drawHoneyZones(timestamp, true);
    drawJellyZones(timestamp, true);
    drawFreezeZones(timestamp, true);
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
      if ((effect.delay || 0) > 0) continue;
      const slimeOverlay = false;
      if (slimeOverlay !== overlayOnly) continue;
      const progress = 1 - clamp(effect.life / effect.maxLife, 0, 1);
      const alpha = Math.pow(1 - progress, .94);
      const y = effect.y - run.cameraY;
      ctx.save();
      if (effect.type === 'snowballKnockback') {
        const travel = effect.maxLife * progress;
        const blockX = effect.x + (effect.vx || 0) * travel;
        const blockY = y + (effect.vy || 0) * travel + 150 * travel * travel;
        ctx.translate(blockX, blockY);
        ctx.rotate(progress * 1.25 * Math.sign(effect.vx || 1));
        ctx.globalAlpha = alpha;
        ctx.fillStyle = effect.color || '#43516b';
        ctx.strokeStyle = '#ff6b3d';
        ctx.lineWidth = 3;
        ctx.fillRect(-(effect.width || 56) / 2, -(effect.height || 56) / 2, effect.width || 56, effect.height || 56);
        ctx.strokeRect(-(effect.width || 56) / 2 + 2, -(effect.height || 56) / 2 + 2, (effect.width || 56) - 4, (effect.height || 56) - 4);
      } else if (effect.type === 'frostTouch') {
        const radius = (effect.compact ? 8 : 11) + progress * (effect.compact ? 25 : 34);
        ctx.translate(effect.x, y);
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = alpha * .92;
        const flash = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        flash.addColorStop(0, 'rgba(255,255,255,.96)');
        flash.addColorStop(.28, 'rgba(177,241,255,.78)');
        flash.addColorStop(1, 'rgba(69,176,235,0)');
        ctx.fillStyle = flash;
        ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#f3feff';
        ctx.lineWidth = 2.5 - progress * 1.2;
        ctx.shadowColor = '#46c6ff';
        ctx.shadowBlur = 11;
        for (let ray = 0; ray < 8; ray += 1) {
          const angle = ray * Math.PI / 4 + effect.x * .003;
          const inner = radius * (.2 + progress * .08);
          const outer = radius * (.58 + (ray % 2) * .2);
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
        }
      } else if (effect.type === 'snowShard' || effect.type === 'snowballArc') {
        const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x;
        const toY = Number.isFinite(effect.toY) ? effect.toY : effect.y;
        const flight = 1 - Math.pow(1 - progress, 1.48);
        const arcHeight = effect.type === 'snowballArc' ? 58 : 34;
        const shardX = lerp(effect.x, toX, flight);
        const shardY = lerp(effect.y, toY, flight) - run.cameraY - Math.sin(flight * Math.PI) * arcHeight;
        const previousFlight = Math.max(0, flight - (effect.type === 'snowballArc' ? .085 : .065));
        const trailX = lerp(effect.x, toX, previousFlight);
        const trailY = lerp(effect.y, toY, previousFlight) - run.cameraY - Math.sin(previousFlight * Math.PI) * arcHeight;
        const size = effect.type === 'snowballArc' ? 10.5 : 6.5;
        ctx.globalAlpha = alpha * .68;
        ctx.strokeStyle = effect.type === 'snowballArc' ? '#94eaff' : '#6fd7ff';
        ctx.lineWidth = effect.type === 'snowballArc' ? 7 : 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#25baff';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(trailX, trailY); ctx.lineTo(shardX, shardY); ctx.stroke();
        ctx.translate(shardX, shardY);
        ctx.rotate(progress * Math.PI * (effect.type === 'snowballArc' ? 3 : 5));
        ctx.globalAlpha = alpha;
        if (effect.type === 'snowballArc') {
          const snow = ctx.createRadialGradient(-size * .3, -size * .38, 1, 0, 0, size);
          snow.addColorStop(0, '#ffffff');
          snow.addColorStop(.48, '#d9f8ff');
          snow.addColorStop(1, '#64c9ec');
          ctx.fillStyle = snow;
          ctx.strokeStyle = '#187eaf';
          ctx.lineWidth = 2.3;
          ctx.shadowColor = '#5ad6ff';
          ctx.shadowBlur = 13;
          ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = 'rgba(255,255,255,.92)';
          ctx.beginPath(); ctx.arc(-size * .3, -size * .35, size * .24, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = '#ecfcff';
          ctx.strokeStyle = '#147cae';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#4bd1ff';
          ctx.shadowBlur = 11;
          ctx.beginPath();
          ctx.moveTo(size * 1.25, 0);
          ctx.lineTo(-size * .35, size * .72);
          ctx.lineTo(-size, 0);
          ctx.lineTo(-size * .25, -size * .68);
          ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      } else if (effect.type === 'electricArc') {
        const points = Array.isArray(effect.points) ? effect.points : [];
        const blue = effect.colorMode === 'blue';
        const outerColor = blue ? '#168dff' : '#ffb300';
        const middleColor = blue ? '#5eeaff' : '#ffe13d';
        const coreColor = blue ? '#efffff' : '#fffde1';
        const arcAlpha = progress < .7 ? 1 : clamp((1 - progress) / .3, 0, 1);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (points.length > 1) {
          const chainProgress = clamp(progress * 1.48, 0, 1) * (points.length - 1);
          for (let index = 1; index < points.length; index += 1) {
            const reveal = clamp(chainProgress - (index - 1), 0, 1);
            if (reveal <= 0) continue;
            const from = points[index - 1];
            const to = points[index];
            const endX = lerp(from.x, to.x, reveal);
            const endY = lerp(from.y, to.y, reveal);
            const dx = endX - from.x;
            const dy = endY - from.y;
            const length = Math.max(1, Math.hypot(dx, dy));
            const normalX = -dy / length;
            const normalY = dx / length;
            const bolt = [];
            const joints = Math.max(3, Math.ceil(length / 17));
            for (let joint = 0; joint <= joints; joint += 1) {
              const part = joint / joints;
              const edgeFade = Math.sin(part * Math.PI);
              const noise = Math.sin((effect.seed || 0) * 2.31 + index * 7.17 + joint * 11.83) * (blue ? 8 : 6) * edgeFade;
              bolt.push({
                x: lerp(from.x, endX, part) + normalX * noise,
                y: lerp(from.y, endY, part) - run.cameraY + normalY * noise
              });
            }
            const strokeBolt = (color, width, blur, opacity) => {
              ctx.globalAlpha = arcAlpha * opacity;
              ctx.strokeStyle = color;
              ctx.lineWidth = width;
              ctx.shadowColor = outerColor;
              ctx.shadowBlur = blur;
              ctx.beginPath();
              bolt.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
              ctx.stroke();
            };
            strokeBolt(outerColor, blue ? 8 : 7, blue ? 18 : 15, .34);
            strokeBolt(middleColor, blue ? 4.1 : 3.7, blue ? 12 : 9, .96);
            strokeBolt(coreColor, 1.45, 3, 1);

            if (reveal > .72) {
              const hit = clamp((reveal - .72) / .28, 0, 1) * arcAlpha;
              ctx.globalCompositeOperation = 'screen';
              ctx.globalAlpha = hit * .8;
              ctx.fillStyle = coreColor;
              ctx.shadowColor = middleColor;
              ctx.shadowBlur = 14;
              ctx.beginPath(); ctx.arc(endX, endY - run.cameraY, 3.5 + hit * 4, 0, Math.PI * 2); ctx.fill();
              ctx.globalCompositeOperation = 'source-over';
            }
          }
        } else {
          const burst = 1 - progress;
          const glowRadius = 22 + progress * 78;
          const glow = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, glowRadius);
          glow.addColorStop(0, `rgba(237,255,255,${burst * .92})`);
          glow.addColorStop(.25, `rgba(55,218,255,${burst * .58})`);
          glow.addColorStop(1, 'rgba(20,116,255,0)');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(effect.x, y, glowRadius, 0, Math.PI * 2); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          for (let boltIndex = 0; boltIndex < 10; boltIndex += 1) {
            const angle = boltIndex * Math.PI * 2 / 10 + (effect.seed || 0);
            const reach = 28 + progress * (52 + boltIndex % 3 * 10);
            const tx = -Math.sin(angle), ty = Math.cos(angle);
            const electricPoints = [
              [effect.x + Math.cos(angle) * 13, y + Math.sin(angle) * 13],
              [effect.x + Math.cos(angle) * reach * .48 + tx * (boltIndex % 2 ? 7 : -7), y + Math.sin(angle) * reach * .48 + ty * (boltIndex % 2 ? 7 : -7)],
              [effect.x + Math.cos(angle) * reach, y + Math.sin(angle) * reach]
            ];
            ctx.globalAlpha = arcAlpha * (.68 + (boltIndex % 3) * .12);
            ctx.strokeStyle = boltIndex % 2 ? middleColor : coreColor;
            ctx.lineWidth = boltIndex % 2 ? 3.2 : 2.1;
            ctx.shadowColor = outerColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            electricPoints.forEach((point, pointIndex) => pointIndex ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1]));
            ctx.stroke();
          }
        }
      } else if (effect.type === 'frostPulse') {
        const ultimateScale = effect.ultimate ? 1.45 : 1;
        const radius = (16 + progress * 70) * ultimateScale;
        if (effect.ultimate) {
          const burstAlpha = Math.max(0, 1 - progress * 1.85);
          const glow = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, radius * 1.25);
          glow.addColorStop(0, `rgba(255,255,255,${burstAlpha * .92})`);
          glow.addColorStop(.22, `rgba(193,246,255,${burstAlpha * .68})`);
          glow.addColorStop(1, 'rgba(55,181,238,0)');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = glow;
          ctx.beginPath(); ctx.arc(effect.x, y, radius * 1.25, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = alpha * (effect.ultimate ? 1 : .9);
        ctx.strokeStyle = '#dffcff';
        ctx.lineWidth = (effect.ultimate ? 5.5 : 4) - progress * 2;
        ctx.shadowColor = '#55cfff';
        ctx.shadowBlur = effect.ultimate ? 19 : 12;
        ctx.beginPath(); ctx.arc(effect.x, y, radius, 0, Math.PI * 2); ctx.stroke();
        const rayCount = effect.ultimate ? 12 : 6;
        for (let ray = 0; ray < rayCount; ray += 1) {
          const angle = ray * Math.PI * 2 / rayCount + progress * .24;
          ctx.beginPath();
          ctx.moveTo(effect.x + Math.cos(angle) * radius * .58, y + Math.sin(angle) * radius * .58);
          ctx.lineTo(effect.x + Math.cos(angle) * radius * (1 + (ray % 3) * .12), y + Math.sin(angle) * radius * (1 + (ray % 3) * .12));
          ctx.stroke();
        }
      } else if (effect.type === 'firePulse') {
        const radius = 18 + progress * 78;
        const activationFlash = !Number.isFinite(effect.fromX) && !Number.isFinite(effect.fromY)
          ? Math.max(0, 1 - progress * 2.35)
          : 0;
        if (activationFlash > .01) {
          const flashRadius = 28 + progress * 145;
          const flash = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, flashRadius);
          flash.addColorStop(0, `rgba(255,255,221,${activationFlash * .92})`);
          flash.addColorStop(.2, `rgba(255,224,92,${activationFlash * .72})`);
          flash.addColorStop(.58, `rgba(255,105,26,${activationFlash * .3})`);
          flash.addColorStop(1, 'rgba(255,57,18,0)');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = flash;
          ctx.beginPath(); ctx.arc(effect.x, y, flashRadius, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = activationFlash * .88;
          ctx.strokeStyle = '#fff3a0';
          ctx.lineWidth = 3.4 - progress * 1.8;
          for (let ray = 0; ray < 10; ray += 1) {
            const angle = ray * Math.PI / 5 + progress * .22;
            const inner = 22 + progress * 28;
            const outer = inner + 28 + progress * 34;
            ctx.beginPath();
            ctx.moveTo(effect.x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
            ctx.lineTo(effect.x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
            ctx.stroke();
          }
          ctx.globalCompositeOperation = 'source-over';
        }
        ctx.globalAlpha = alpha * .82;
        ctx.strokeStyle = '#ffb52e';
        ctx.lineWidth = 5 - progress * 2.5;
        ctx.shadowColor = '#ff4a1f';
        ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(effect.x, y, radius, 0, Math.PI * 2); ctx.stroke();
        if (Number.isFinite(effect.fromX) && Number.isFinite(effect.fromY)) {
          ctx.beginPath();
          ctx.moveTo(effect.fromX, effect.fromY - run.cameraY);
          ctx.quadraticCurveTo((effect.fromX + effect.x) / 2, (effect.fromY + effect.y) / 2 - run.cameraY - 18, effect.x, y);
          ctx.stroke();
        }
      } else if (effect.type === 'coinArc') {
        const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x;
        const toY = Number.isFinite(effect.toY) ? effect.toY : effect.y;
        const coinX = lerp(effect.x, toX, progress);
        const coinY = lerp(effect.y, toY, progress) - run.cameraY - Math.sin(progress * Math.PI) * 58;
        ctx.translate(coinX, coinY);
        ctx.rotate(progress * Math.PI * 5);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#ffd83d';
        ctx.strokeStyle = '#fff2a0';
        ctx.lineWidth = 2.4;
        ctx.shadowColor = '#ffb41f';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.ellipse(0, 0, 10 * Math.abs(Math.cos(progress * Math.PI * 5)) + 2, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (effect.type === 'cosmosBoost') {
        const burst = Math.max(0, 1 - progress * 1.35);
        const radius = 12 + progress * run.cellSize * 2.15;
        ctx.globalCompositeOperation = 'lighter';
        const flash = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, radius * 1.18);
        flash.addColorStop(0, `rgba(255,255,255,${burst * .95})`);
        flash.addColorStop(.18, `rgba(225,181,255,${burst * .82})`);
        flash.addColorStop(.52, `rgba(123,45,255,${burst * .46})`);
        flash.addColorStop(1, 'rgba(44,15,124,0)');
        ctx.fillStyle = flash;
        ctx.beginPath(); ctx.arc(effect.x, y, radius * 1.18, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#d8b6ff';
        ctx.lineWidth = 6 - progress * 4;
        ctx.shadowColor = '#8b35ff';
        ctx.shadowBlur = 22;
        ctx.beginPath(); ctx.arc(effect.x, y, radius, 0, Math.PI * 2); ctx.stroke();
        for (let ray = 0; ray < 11; ray += 1) {
          const angle = ray * Math.PI * 2 / 11 + progress * .18;
          ctx.strokeStyle = ray % 3 ? '#b66cff' : '#f7ebff';
          ctx.lineWidth = ray % 3 ? 2.6 : 4;
          ctx.beginPath();
          ctx.moveTo(effect.x + Math.cos(angle) * radius * .38, y + Math.sin(angle) * radius * .38);
          ctx.lineTo(effect.x + Math.cos(angle) * radius * (1.05 + ray % 2 * .22), y + Math.sin(angle) * radius * (1.05 + ray % 2 * .22));
          ctx.stroke();
        }
      } else if (effect.type === 'windBounce' || effect.type === 'windDash' || effect.type === 'windTornadoStart') {
        const dash = effect.type === 'windDash';
        const tornado = effect.type === 'windTornadoStart';
        const radius = 12 + progress * run.cellSize * (tornado ? 2.5 : dash ? 1.75 : 1.05);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * (tornado ? .92 : dash ? .82 : .58);
        ctx.strokeStyle = tornado ? '#eaffff' : dash ? '#82f4ff' : '#bffcff';
        ctx.lineWidth = (tornado ? 6 : dash ? 4.5 : 3.2) - progress * 2.2;
        ctx.shadowColor = '#27cce8';
        ctx.shadowBlur = tornado ? 20 : 13;
        for (let ring = 0; ring < (tornado ? 4 : 2); ring += 1) {
          const ringRadius = radius * (1 - ring * .12);
          ctx.beginPath();
          ctx.ellipse(effect.x, y - ring * 4, ringRadius, ringRadius * (.38 + ring * .045), progress * .35 + ring * .32, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (effect.type === 'gigantismOverflow') {
        const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x;
        const toY = (Number.isFinite(effect.toY) ? effect.toY : effect.y) - run.cameraY;
        const travel = 1 - Math.pow(1 - progress, 2.2);
        const px = lerp(effect.x, toX, travel);
        const py = lerp(y, toY, travel);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha * .82;
        ctx.strokeStyle = '#baff55';
        ctx.lineWidth = 7 - progress * 4;
        ctx.shadowColor = '#45dc42';
        ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.moveTo(effect.x, y); ctx.quadraticCurveTo((effect.x + toX) / 2, (y + toY) / 2 - 12, px, py); ctx.stroke();
        ctx.fillStyle = '#f4ffbd';
        ctx.beginPath(); ctx.arc(px, py, 5 - progress * 2, 0, Math.PI * 2); ctx.fill();
      } else if (effect.type === 'gigantismPulse' || effect.type === 'gigantismDeflate') {
        const deflating = effect.type === 'gigantismDeflate';
        const radius = deflating
          ? run.cellSize * (2.2 - progress * 1.35)
          : 18 + progress * run.cellSize * 2.5;
        const burst = deflating ? Math.sin(progress * Math.PI) : Math.max(0, 1 - progress * 1.15);
        ctx.globalCompositeOperation = 'lighter';
        const glow = ctx.createRadialGradient(effect.x, y, 0, effect.x, y, radius);
        glow.addColorStop(0, `rgba(244,255,184,${burst * .72})`);
        glow.addColorStop(.42, `rgba(89,239,74,${burst * .42})`);
        glow.addColorStop(1, 'rgba(18,151,55,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(effect.x, y, radius, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha * .88;
        ctx.strokeStyle = deflating ? '#8df184' : '#d9ff62';
        ctx.lineWidth = 7 - progress * 4.5;
        ctx.shadowColor = '#32d95c';
        ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(effect.x, y, radius * (deflating ? .92 : 1), 0, Math.PI * 2); ctx.stroke();
        const drops = deflating ? 10 : 14;
        for (let drop = 0; drop < drops; drop += 1) {
          const angle = drop * Math.PI * 2 / drops + (deflating ? progress * .32 : 0);
          const distance = radius * (deflating ? .65 + progress * .55 : .68 + progress * .42);
          ctx.globalAlpha = alpha * (.48 + drop % 3 * .16);
          ctx.fillStyle = drop % 3 ? '#65ed59' : '#f0ff98';
          ctx.beginPath();
          ctx.ellipse(effect.x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 2.5 + (drop % 2) * 1.6, 4.5 + (drop % 3), angle, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (effect.type === 'categoryBlast') {
        const radius = 12 + progress * run.cellSize * 1.75;
        ctx.globalAlpha = alpha * .9;
        ctx.strokeStyle = effect.damage >= 2 ? '#fff18a' : '#ffb042';
        ctx.lineWidth = 7 - progress * 4;
        ctx.shadowColor = '#ff4b20';
        ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(effect.x, y, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeRect(effect.x - radius * .68, y - radius * .68, radius * 1.36, radius * 1.36);
      } else if (effect.type === 'bomb') {
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
      } else if (effect.type === 'pandora') {
        const radius = 22 + progress * 72;
        const colors = ['#ff4ca3', '#48dfff', '#ffe052', '#65ef9a', '#b968ff'];
        ctx.globalAlpha = alpha * .9;
        ctx.lineWidth = 5.5 - progress * 3;
        ctx.strokeStyle = colors[Math.min(colors.length - 1, Math.floor(progress * colors.length))];
        ctx.shadowColor = colors[(Math.floor(progress * colors.length) + 2) % colors.length];
        ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.arc(effect.x, y, radius, 0, Math.PI * 2); ctx.stroke();
        for (let ray = 0; ray < 7; ray += 1) {
          const angle = ray * Math.PI * 2 / 7 + progress * 1.8;
          const inner = radius * .62;
          const outer = radius + 11;
          ctx.strokeStyle = colors[ray % colors.length];
          ctx.beginPath();
          ctx.moveTo(effect.x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
          ctx.lineTo(effect.x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
          ctx.stroke();
        }
      } else if (effect.type === 'chargedHit') {
        const radius = 14 + progress * 42;
        ctx.globalAlpha = alpha * .92;
        ctx.strokeStyle = '#ffd45a';
        ctx.lineWidth = 4.2 - progress * 2;
        ctx.shadowColor = '#ff8d45';
        ctx.shadowBlur = 13;
        ctx.beginPath();
        ctx.arc(effect.x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = alpha * .85;
        ctx.fillStyle = '#fff3bd';
        for (let ray = 0; ray < 8; ray += 1) {
          const angle = ray * Math.PI / 4 + progress * .24;
          const inner = radius * .45;
          const outer = radius + 13 + progress * 12;
          ctx.beginPath();
          ctx.moveTo(effect.x + Math.cos(angle) * inner, y + Math.sin(angle) * inner);
          ctx.lineTo(effect.x + Math.cos(angle) * outer, y + Math.sin(angle) * outer);
          ctx.stroke();
        }
      } else if (effect.type === 'shieldBurst') {
        const radius = 20 + progress * 88;
        ctx.globalAlpha = alpha * .9;
        ctx.strokeStyle = '#b8f5ff';
        ctx.lineWidth = 5 - progress * 2.5;
        ctx.shadowColor = '#609dff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(effect.x, y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = alpha * .52;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(effect.x, y, radius * .67, progress * 2.4, progress * 2.4 + Math.PI * 1.55);
        ctx.stroke();
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
      } else if (effect.type === 'freeze') {
        const targetX = run.slime.x;
        const targetY = run.slime.y - run.cameraY;
        const radius = 24 + progress * 88;
        const frost = ctx.createRadialGradient(targetX, targetY, 4, targetX, targetY, radius);
        frost.addColorStop(0, `rgba(238,253,255,${alpha * .34})`);
        frost.addColorStop(.55, `rgba(125,222,250,${alpha * .18})`);
        frost.addColorStop(1, 'rgba(77,183,228,0)');
        ctx.save();
        ctx.fillStyle = frost;
        ctx.beginPath();
        ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = alpha * .82;
        ctx.fillStyle = '#edfdff';
        for (let shard = 0; shard < 6; shard += 1) {
          const angle = shard * Math.PI / 3 + progress * .7;
          const orbit = 27 + progress * 50;
          const x = targetX + Math.cos(angle) * orbit;
          const y = targetY + Math.sin(angle) * orbit;
          const size = 3.4 + (shard % 2) * 1.6;
          ctx.beginPath();
          ctx.moveTo(x, y - size); ctx.lineTo(x + size, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size, y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (effect.type === 'jelly') {
        const direction = Math.atan2(effect.ny, effect.nx);
        ctx.save();
        ctx.translate(effect.x, y);
        ctx.rotate(direction);
        ctx.globalAlpha = alpha * .8;
        ctx.strokeStyle = '#ff96bf';
        ctx.lineCap = 'round';
        ctx.lineWidth = 4 - progress * 2;
        for (let line = -1; line <= 1; line += 1) {
          ctx.beginPath();
          ctx.arc(0, line * 11, 18 + progress * 34 + Math.abs(line) * 5, -.42, .42);
          ctx.stroke();
        }
        ctx.restore();
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

  function drawLaunchEntryPortal(world, timestamp) {
    if (!run.launchEntryUntil || timestamp >= run.launchEntryUntil) return;
    const startedAt = run.launchEntryStartedAt || timestamp;
    const duration = Math.max(1, run.launchEntryUntil - startedAt);
    const progress = clamp((timestamp - startedAt) / duration, 0, 1);
    const close = clamp((progress - .64) / .28, 0, 1);
    const fade = 1 - clamp((progress - .84) / .16, 0, 1);
    const eject = 1 - clamp(progress / .34, 0, 1);
    const palettes = {
      1: { glow: '#65f0b0', core: '#dcffad', rim: '#2c7360' },
      2: { glow: '#65e7ff', core: '#e6fdff', rim: '#347e9b' },
      3: { glow: '#ff82ca', core: '#fff0b6', rim: '#9b477c' },
      4: { glow: '#ff793f', core: '#ffd36b', rim: '#89382e' }
    };
    const palette = palettes[world.id] || palettes[1];
    const centerX = run.startX;
    const centerY = 30;
    const portalScale = Math.max(.035, (1 + eject * .08) * (1 - close * .965));
    const pulse = 1 + Math.sin(timestamp * .006) * .025;
    const radius = 55 * portalScale;

    ctx.save();
    ctx.globalAlpha = fade * (.72 + eject * .2);
    const halo = ctx.createRadialGradient(centerX, centerY, radius * .35, centerX, centerY, radius + 30);
    halo.addColorStop(0, palette.glow);
    halo.addColorStop(.52, palette.rim);
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * .9, 0, Math.PI * 2);
    ctx.clip();
    const worldArtwork = WORLD_BACKGROUNDS[world.id];
    if (worldArtwork?.complete && worldArtwork.naturalWidth) {
      const sourceSize = Math.min(worldArtwork.naturalWidth, worldArtwork.naturalHeight);
      const focus = ({ 1: .1, 2: .15, 3: .18, 4: .14 })[world.id] || .12;
      const sourceY = clamp((worldArtwork.naturalHeight - sourceSize) * focus, 0, worldArtwork.naturalHeight - sourceSize);
      ctx.drawImage(worldArtwork, 0, sourceY, sourceSize, sourceSize, centerX - radius, centerY - radius, radius * 2, radius * 2);
    } else {
      ctx.fillStyle = world.deep || '#071219';
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    }
    const depth = ctx.createRadialGradient(centerX, centerY, radius * .05, centerX, centerY, radius);
    depth.addColorStop(0, `rgba(3,8,14,${.08 + Math.sin(timestamp / 190) * .025})`);
    depth.addColorStop(.52, 'rgba(3,8,14,.12)');
    depth.addColorStop(.78, 'rgba(3,8,14,.38)');
    depth.addColorStop(1, 'rgba(2,6,12,.86)');
    ctx.fillStyle = depth;
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = palette.core;
    ctx.lineWidth = Math.max(1.3, 2.5 * portalScale);
    for (let ring = 0; ring < 2; ring += 1) {
      const phase = (progress * 3.1 + ring * .5) % 1;
      const ringRadius = radius * (.78 - phase * .56);
      ctx.globalAlpha = fade * Math.sin(phase * Math.PI) * (.28 + eject * .14);
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (eject > 0) {
      const flash = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, radius * .62);
      flash.addColorStop(0, palette.core);
      flash.addColorStop(.28, palette.glow);
      flash.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = fade * eject * .34;
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * .64, 0, Math.PI * 2);
      ctx.fill();
    }

    const blast = 1 - clamp(progress / .38, 0, 1);
    if (blast > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = palette.core;
      ctx.lineCap = 'round';
      for (let streak = -2; streak <= 2; streak += 1) {
        const offset = streak * 10;
        const flutter = Math.sin(timestamp / 65 + streak * 1.7) * 3;
        ctx.globalAlpha = fade * blast * (.28 + (2 - Math.abs(streak)) * .055);
        ctx.lineWidth = streak === 0 ? 3.2 : 2.1;
        ctx.beginPath();
        ctx.moveTo(centerX + offset * .48, centerY + radius * .38);
        ctx.quadraticCurveTo(centerX + offset + flutter, centerY + radius * .92, centerX + offset * 1.2, centerY + radius + 23 + Math.abs(streak) * 4);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.globalAlpha = fade;
    ctx.shadowColor = palette.glow;
    ctx.shadowBlur = isLowPowerDevice() ? 0 : (10 + eject * 7) * (1 - close);
    ctx.strokeStyle = palette.rim;
    ctx.lineWidth = Math.max(2, 7 * portalScale);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = palette.core;
    ctx.lineWidth = Math.max(1.2, 2.5 * portalScale);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * .93, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

  }

  function drawBackground(world, timestamp) {
    const builtInArtwork = WORLD_BACKGROUNDS[world.id];
    if (builtInArtwork?.complete && builtInArtwork.naturalWidth) {
      const tileWidth = VIEW_W;
      const tileHeight = builtInArtwork.naturalHeight * tileWidth / builtInArtwork.naturalWidth;
      const parallaxY = run.cameraY * .18;
      const offset = -((parallaxY % tileHeight) + tileHeight) % tileHeight;
      ctx.save();
      ctx.globalAlpha = world.id === 2 ? .52 : world.id === 3 ? .58 : .64;
      for (let y = offset; y < VIEW_H + tileHeight; y += tileHeight) {
        ctx.drawImage(builtInArtwork, 0, y, tileWidth, tileHeight + .65);
      }
      ctx.restore();

      const veil = ctx.createLinearGradient(0, 0, 0, VIEW_H);
      if (world.id === 1) {
        veil.addColorStop(0, 'rgba(12,35,29,.18)');
        veil.addColorStop(1, 'rgba(7,17,18,.48)');
      } else if (world.id === 2) {
        veil.addColorStop(0, 'rgba(20,70,88,.16)');
        veil.addColorStop(1, 'rgba(6,25,39,.46)');
      } else if (world.id === 3) {
        veil.addColorStop(0, 'rgba(78,28,60,.20)');
        veil.addColorStop(1, 'rgba(30,12,35,.50)');
      } else {
        veil.addColorStop(0, 'rgba(71,21,17,.20)');
        veil.addColorStop(1, 'rgba(20,8,11,.48)');
      }
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    const background = world.backgroundArt;
    const artwork = background?.image ? projectSprite(background.image) : null;
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
    drawBackdropAtmosphere(world, timestamp);

    const depth = (run.endlessDepthOffset || 0) + Math.max(0, Math.floor((run.cameraY + 20) / 10));
    ctx.fillStyle = 'rgba(11,10,18,.42)';
    roundedRect(ctx, 10, 10, 72, 25, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${depth} м`, 46, 27);
  }

  function drawBackdropAtmosphere(world, timestamp) {
    const profiles = {
      1: { color: '#b7ef8f', count: 9, speed: 4, drift: 7 },
      2: { color: '#d5f7ff', count: 11, speed: 7, drift: 4 },
      3: { color: '#ffd2dc', count: 8, speed: 3, drift: 9 },
      4: { color: '#ff9b43', count: 13, speed: -13, drift: 11 }
    };
    const profile = profiles[world.id] || profiles[1];
    const cycle = VIEW_H + 100;
    const time = timestamp / 1000;

    ctx.save();
    for (let index = 0; index < profile.count; index += 1) {
      const seedA = Math.sin((index + 1) * 91.371 + world.id * 17.13) * 43758.5453;
      const seedB = Math.sin((index + 1) * 47.117 + world.id * 31.77) * 24634.6345;
      const unitA = seedA - Math.floor(seedA);
      const unitB = seedB - Math.floor(seedB);
      const x = 22 + unitA * (VIEW_W - 44) + Math.sin(time * .55 + index) * profile.drift;
      const rawY = unitB * cycle + time * profile.speed - run.cameraY * .055;
      const y = ((rawY % cycle) + cycle) % cycle - 50;
      const pulse = .62 + Math.sin(time * 1.3 + index * 1.7) * .25;
      const size = 1.4 + (index % 4) * .65;
      ctx.globalAlpha = clamp((.045 + (index % 3) * .025) * pulse, .015, .12);
      ctx.fillStyle = profile.color;
      ctx.strokeStyle = profile.color;

      if (world.id === 2 && index % 4 === 0) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - size * 2.2, y); ctx.lineTo(x + size * 2.2, y);
        ctx.moveTo(x, y - size * 2.2); ctx.lineTo(x, y + size * 2.2);
        ctx.stroke();
      } else if (world.id === 3) {
        ctx.beginPath();
        ctx.arc(x, y, size * 1.75, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,226,235,.24)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      } else if (world.id === 4) {
        ctx.shadowColor = profile.color;
        ctx.shadowBlur = isLowPowerDevice() ? 0 : 5;
        ctx.beginPath();
        ctx.ellipse(x, y, size * .55, size * 1.8, Math.sin(index) * .25, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawHoneyZones(timestamp, foreground) {
    if (!run?.honeyZones?.length) return;
    for (const zone of run.honeyZones) {
      const y = zone.y - run.cameraY;
      if (y + zone.h < -30 || y > VIEW_H + 30) continue;
      const active = run.inHoneyZoneId === zone.id;
      if (foreground && !active) continue;
      const pulse = Math.sin(timestamp / 310 + zone.seed) * .5 + .5;
      ctx.save();
      if (!foreground) {
        const honey = ctx.createLinearGradient(zone.x, y, zone.x, y + zone.h);
        honey.addColorStop(0, 'rgba(255,226,105,.88)');
        honey.addColorStop(.38, 'rgba(255,181,45,.82)');
        honey.addColorStop(1, 'rgba(215,108,14,.9)');
        ctx.fillStyle = honey;
        ctx.strokeStyle = 'rgba(255,239,151,.92)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = 'rgba(255,164,31,.38)';
        ctx.shadowBlur = 8;
        roundedRect(ctx, zone.x, y, zone.w, zone.h, Math.min(20, zone.w * .22));
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = .52;
        ctx.fillStyle = '#fff1a9';
        roundedRect(ctx, zone.x + 7, y + 8, Math.max(7, zone.w * .14), zone.h - 18, 7);
        ctx.fill();
        for (let bubble = 0; bubble < 5; bubble += 1) {
          const phase = (timestamp / (980 + bubble * 74) + zone.seed + bubble * .21) % 1;
          const bx = zone.x + 13 + (bubble * 29 + zone.seed * 17) % Math.max(18, zone.w - 26);
          const by = y + zone.h - 11 - phase * (zone.h - 22);
          const size = 2.4 + bubble % 3 * 1.2;
          ctx.globalAlpha = Math.sin(phase * Math.PI) * (.34 + pulse * .16);
          ctx.strokeStyle = '#fff5bf';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.arc(bx, by, size, 0, Math.PI * 2);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = .12 + pulse * .05;
        ctx.fillStyle = '#ffbd36';
        roundedRect(ctx, zone.x + 1, y + 1, zone.w - 2, zone.h - 2, Math.min(19, zone.w * .2));
        ctx.fill();
        ctx.globalAlpha = .48;
        ctx.strokeStyle = '#ffe982';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(run.slime.x - 7, run.slime.y - run.cameraY + 4, run.slime.radius * .72, .18, Math.PI * 1.18);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawJellyZones(timestamp, foreground) {
    if (!run?.jellyZones?.length) return;
    for (const zone of run.jellyZones) {
      const y = zone.y - run.cameraY;
      if (y + zone.h < -30 || y > VIEW_H + 30) continue;
      const active = run.inJellyZoneId === zone.id;
      if (foreground && !active) continue;
      const enteredAge = active ? Math.max(0, timestamp - (run.jellyEnteredAt || timestamp)) : 9999;
      const impact = active ? Math.exp(-enteredAge / 620) : 0;
      const impactWobble = Math.sin(enteredAge / 66) * impact * 5.2;
      const surfaceY = y + 5 + Math.max(0, impactWobble * .38);
      const wave = timestamp / 510 + zone.seed;
      const corner = clamp(Math.min(zone.w * .09, zone.h * .11), 8, 14);
      const jellyPath = () => {
        ctx.beginPath();
        const topAt = px => surfaceY + Math.sin(wave + px * .075) * (1.35 + impact * 1.7) + impactWobble;
        ctx.moveTo(zone.x + corner, topAt(corner));
        for (let px = corner + 8; px < zone.w - corner; px += 8) {
          ctx.lineTo(zone.x + px, topAt(px));
        }
        const rightTop = topAt(zone.w - corner);
        ctx.lineTo(zone.x + zone.w - corner, rightTop);
        ctx.quadraticCurveTo(zone.x + zone.w, rightTop, zone.x + zone.w, rightTop + corner);
        ctx.lineTo(zone.x + zone.w, y + zone.h - corner);
        ctx.quadraticCurveTo(zone.x + zone.w, y + zone.h, zone.x + zone.w - corner, y + zone.h);
        ctx.lineTo(zone.x + corner, y + zone.h);
        ctx.quadraticCurveTo(zone.x, y + zone.h, zone.x, y + zone.h - corner);
        ctx.lineTo(zone.x, surfaceY + corner);
        ctx.quadraticCurveTo(zone.x, topAt(corner), zone.x + corner, topAt(corner));
        ctx.closePath();
      };
      ctx.save();
      // Keep every jelly layer inside the exact grid cells it replaced. This
      // also handles L-shaped authored pockets without covering nearby blocks.
      if (zone.cells?.length) {
        ctx.beginPath();
        for (const cell of zone.cells) ctx.rect(cell.x, cell.y - run.cameraY, cell.w, cell.h);
        ctx.clip();
      }
      if (!foreground) {
        jellyPath();
        const base = ctx.createLinearGradient(zone.x, surfaceY, zone.x, y + zone.h);
        base.addColorStop(0, '#a8f47a');
        base.addColorStop(.5, '#59d45f');
        base.addColorStop(1, '#2c9e50');
        ctx.fillStyle = base;
        ctx.fill();

        const texture = VFX_SPRITES?.['jelly-zone-texture'];
        if (texture?.complete && texture.naturalWidth) {
          ctx.save();
          jellyPath();
          ctx.clip();
          ctx.globalAlpha = .42;
          ctx.drawImage(texture, zone.x, y, zone.w, zone.h);
          ctx.restore();
        }

        jellyPath();
        ctx.strokeStyle = '#17613a';
        ctx.lineWidth = 4.2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.save();
        jellyPath();
        ctx.clip();
        const bubbleCount = clamp(Math.round(zone.w / 46 + zone.h / 76), 4, 10);
        for (let bubble = 0; bubble < bubbleCount; bubble += 1) {
          const duration = 1700 + (bubble % 4) * 310;
          const phase = (timestamp / duration + zone.seed * .13 + bubble * .217) % 1;
          const lane = (bubble * 47 + zone.seed * 31) % Math.max(16, zone.w - corner * 2 - 16);
          const sway = Math.sin(timestamp / (390 + bubble * 29) + bubble * 1.73) * (2.2 + bubble % 3 * 1.15);
          const bx = zone.x + corner + 8 + lane + sway;
          const by = y + zone.h - corner + 7 - phase * Math.max(28, zone.h - corner * 2 + 14);
          const size = 3.7 + bubble % 3 * 1.4;
          const appear = clamp(Math.min(phase * 5, (1 - phase) * 7), 0, 1);
          ctx.globalAlpha = appear * .72;
          ctx.fillStyle = 'rgba(220,255,200,.28)';
          ctx.strokeStyle = '#eaffd9';
          ctx.lineWidth = 1.55;
          ctx.beginPath();
          ctx.arc(bx, by, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.globalAlpha *= .92;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx - size * .28, by - size * .3, Math.max(.7, size * .18), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else {
        jellyPath();
        ctx.globalAlpha = .15 + impact * .08;
        ctx.fillStyle = '#d4ffc3';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFreezeZones(timestamp, foreground) {
    if (!run?.freezeZones?.length) return;
    for (const zone of run.freezeZones) {
      const y = zone.y - run.cameraY;
      if (y + zone.h < -30 || y > VIEW_H + 30) continue;
      const active = run.inFreezeZoneId === zone.id;
      if (foreground && !active) continue;
      const charging = active && run.freezeZoneTriggeredId !== zone.id;
      const charge = charging
        ? clamp((timestamp - (run.freezeZoneEnteredAt || timestamp)) / FREEZE_ZONE_CHARGE_MS, 0, 1)
        : 0;
      const wave = timestamp / 860 + zone.seed;
      const corner = clamp(Math.min(zone.w * .1, zone.h * .12), 9, 15);
      const surfaceY = y + 6;
      const waterPath = () => {
        const topAt = px => surfaceY + Math.sin(wave + px * .06) * 1.15;
        ctx.beginPath();
        ctx.moveTo(zone.x + corner, topAt(corner));
        for (let px = corner + 10; px < zone.w - corner; px += 10) ctx.lineTo(zone.x + px, topAt(px));
        const rightTop = topAt(zone.w - corner);
        ctx.lineTo(zone.x + zone.w - corner, rightTop);
        ctx.quadraticCurveTo(zone.x + zone.w, rightTop, zone.x + zone.w, rightTop + corner);
        ctx.lineTo(zone.x + zone.w, y + zone.h - corner);
        ctx.quadraticCurveTo(zone.x + zone.w, y + zone.h, zone.x + zone.w - corner, y + zone.h);
        ctx.lineTo(zone.x + corner, y + zone.h);
        ctx.quadraticCurveTo(zone.x, y + zone.h, zone.x, y + zone.h - corner);
        ctx.lineTo(zone.x, surfaceY + corner);
        ctx.quadraticCurveTo(zone.x, topAt(corner), zone.x + corner, topAt(corner));
        ctx.closePath();
      };

      ctx.save();
      if (!foreground) {
        waterPath();
        const water = ctx.createLinearGradient(zone.x, surfaceY, zone.x, y + zone.h);
        water.addColorStop(0, 'rgba(207,249,255,.80)');
        water.addColorStop(.38, 'rgba(109,215,242,.66)');
        water.addColorStop(1, 'rgba(46,157,211,.72)');
        ctx.fillStyle = water;
        ctx.fill();
        ctx.strokeStyle = '#2c8ec2';
        ctx.lineWidth = 3.8;
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.save();
        waterPath();
        ctx.clip();
        const bubbleCount = clamp(Math.round(zone.w / 50 + zone.h / 92), 3, 7);
        for (let bubble = 0; bubble < bubbleCount; bubble += 1) {
          const duration = 1750 + (bubble % 3) * 290;
          const phase = (timestamp / duration + zone.seed * .17 + bubble * .243) % 1;
          const lane = (bubble * 41 + zone.seed * 23) % Math.max(18, zone.w - corner * 2 - 18);
          const bx = zone.x + corner + 9 + lane + Math.sin(timestamp / 440 + bubble) * 1.8;
          const by = y + zone.h - corner - 10 - phase * Math.max(24, zone.h - corner * 2 - 10);
          const size = 2.8 + bubble % 3 * 1.15;
          ctx.globalAlpha = clamp(Math.min(phase * 5, (1 - phase) * 6), 0, 1) * .68;
          ctx.fillStyle = 'rgba(240,254,255,.30)';
          ctx.strokeStyle = '#e6fbff';
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.arc(bx, by, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        for (let shard = 0; shard < 4; shard += 1) {
          const sx = zone.x + 18 + ((shard * 47 + zone.seed * 29) % Math.max(26, zone.w - 36));
          const sy = y + 28 + ((shard * 31 + zone.seed * 17) % Math.max(22, zone.h - 48));
          const size = 3.4 + shard % 2 * 1.8;
          ctx.globalAlpha = .26 + Math.sin(timestamp / 620 + shard) * .07;
          ctx.fillStyle = '#f5feff';
          ctx.beginPath();
          ctx.moveTo(sx, sy - size); ctx.lineTo(sx + size, sy); ctx.lineTo(sx, sy + size); ctx.lineTo(sx - size, sy);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else {
        waterPath();
        ctx.globalAlpha = charging ? .08 + charge * .17 : .12;
        ctx.fillStyle = charging ? '#effdff' : '#b9efff';
        ctx.fill();
        if (charging) {
          const screenY = run.slime.y - run.cameraY;
          const orbit = run.slime.radius + 14 + charge * 9;
          ctx.globalAlpha = .35 + charge * .45;
          ctx.fillStyle = '#effdff';
          for (let shard = 0; shard < 4; shard += 1) {
            const angle = timestamp / 450 + shard * Math.PI / 2;
            const sx = run.slime.x + Math.cos(angle) * orbit;
            const sy = screenY + Math.sin(angle) * orbit;
            const size = 2 + charge * 2.1;
            ctx.beginPath();
            ctx.moveTo(sx, sy - size); ctx.lineTo(sx + size, sy); ctx.lineTo(sx, sy + size); ctx.lineTo(sx - size, sy);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }
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

  function drawSuctionAwareBlock(block, sy, timestamp) {
    if (!block.blackHoleSuctionStartedAt) {
      drawBlock(block, sy, timestamp);
      return;
    }
    const progress = clamp((timestamp - block.blackHoleSuctionStartedAt) / Math.max(1, block.blackHoleSuctionDuration), 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const sourceX = block.x + block.w / 2;
    const sourceY = sy + block.h / 2;
    const targetX = run.slime.x;
    const targetY = run.slime.y - run.cameraY;
    const dx = sourceX - targetX;
    const dy = sourceY - targetY;
    const angle = (block.blackHoleSuctionSpin || 0) * progress;
    const shrink = 1 - eased;
    const centerX = targetX + (dx * Math.cos(angle) - dy * Math.sin(angle)) * shrink;
    const centerY = targetY + (dx * Math.sin(angle) + dy * Math.cos(angle)) * shrink;
    const scale = .08 + Math.pow(shrink, 1.15) * .92;
    ctx.save();
    ctx.globalAlpha = clamp(1.12 - progress * .62, 0, 1);
    ctx.translate(centerX, centerY);
    ctx.rotate(angle + progress * .7);
    ctx.scale(scale, scale);
    ctx.translate(-sourceX, -sourceY);
    drawBlock(block, sy, timestamp);
    ctx.restore();
  }

  function drawBlock(block, sy, timestamp) {
    const hpRatio = clamp(block.hp / block.maxHp, 0, 1);
    const color = materialColor(block.material, run.world, hpRatio);
    const special = block.special;
    const tier = block.tier || 'dense';
    ctx.save();

    if (WORLD_SPRITES[run.worldId] && drawWorldSprite(block, sy, hpRatio, timestamp)) {
      drawBlockElementalOverlay(block, sy, timestamp);
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
      if (tier === 'ore') {
        ctx.font = '900 8px system-ui';
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.fillText('РУДА', block.x + block.w / 2, sy + block.h - 7);
      }
      drawBlockElementalOverlay(block, sy, timestamp);
      ctx.restore();
      return;
    }

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
    } else if (special === 'cryo') {
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(block.x + block.w / 2, sy + block.h / 2, 17, 0, Math.PI * 2);
      ctx.stroke();
    } else if (special === 'jelly') {
      ctx.fillStyle = 'rgba(255,63,136,.72)';
      ctx.beginPath();
      ctx.ellipse(block.x + block.w / 2, sy + block.h / 2 + 3, 24, 21, 0, 0, Math.PI * 2);
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

    const symbol = { coin: '●', spring: '↥', bomb: '✹', gel: '+', cryo: '◇', jelly: '●', pandora: '?', geyser: '◉', meteor: '☄', boss: '!' }[special] || '•';
    ctx.fillStyle = '#fff';
    ctx.font = special === 'gel' ? '1000 28px system-ui' : '1000 23px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, block.x + block.w / 2, sy + block.h / 2 - 2);
    if (special === 'boss') {
      ctx.font = '1000 9px system-ui';
      ctx.fillStyle = 'rgba(255,255,255,.94)';
      ctx.fillText('БОСС', block.x + block.w / 2, sy + block.h - 7);
    }
    drawBlockElementalOverlay(block, sy, timestamp);
    ctx.restore();
  }

  function traceBurningTongue(target, centerX, baseY, width, height, lean = 0) {
    target.beginPath();
    target.moveTo(centerX - width * .5, baseY);
    target.bezierCurveTo(
      centerX - width * .48,
      baseY - height * .28,
      centerX - width * .18 + lean * .3,
      baseY - height * .62,
      centerX + lean,
      baseY - height
    );
    target.bezierCurveTo(
      centerX + width * .19 + lean * .25,
      baseY - height * .66,
      centerX + width * .5,
      baseY - height * .32,
      centerX + width * .5,
      baseY
    );
    target.closePath();
  }

  function drawBurningBlockFlames(block, sy, timestamp, intensity) {
    if (intensity < .01) return;
    const x = block.x;
    const w = block.w;
    const h = block.h;
    const flicker = .5 + Math.sin(timestamp / 68 + block.id * 1.73) * .5;
    ctx.save();

    const heat = ctx.createRadialGradient(x + w * .5, sy + h * .84, 2, x + w * .5, sy + h * .6, h * .72);
    heat.addColorStop(0, `rgba(255,235,89,${intensity * (.24 + flicker * .08)})`);
    heat.addColorStop(.42, `rgba(255,112,24,${intensity * .2})`);
    heat.addColorStop(1, 'rgba(150,20,12,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = heat;
    ctx.fillRect(x + 1, sy + 1, w - 2, h - 2);
    ctx.globalCompositeOperation = 'source-over';

    ctx.lineJoin = 'miter';
    ctx.globalAlpha = intensity * .78;
    ctx.strokeStyle = '#d93414';
    ctx.lineWidth = 6.4;
    ctx.shadowColor = '#ff4518';
    ctx.shadowBlur = 11 + flicker * 5;
    ctx.strokeRect(x + 3.5, sy + 3.5, w - 7, h - 7);
    ctx.globalAlpha = intensity * (.82 + flicker * .14);
    ctx.strokeStyle = '#ff8a18';
    ctx.lineWidth = 3.5;
    ctx.shadowBlur = 6;
    ctx.strokeRect(x + 4.5, sy + 4.5, w - 9, h - 9);
    ctx.globalAlpha = intensity * (.62 + flicker * .18);
    ctx.strokeStyle = '#ffe66d';
    ctx.lineWidth = 1.35;
    ctx.shadowBlur = 3;
    ctx.strokeRect(x + 5.4, sy + 5.4, w - 10.8, h - 10.8);

    const tongueCount = 5;
    for (let index = 0; index < tongueCount; index += 1) {
      const phase = timestamp / (128 + index * 9) + block.id * .91 + index * 1.77;
      const wave = Math.sin(phase);
      const centerX = x + w * (.12 + index * .19) + wave * 1.8;
      const baseY = sy + h - 3;
      const width = w * (.16 + (index % 2) * .035);
      const height = h * (.32 + (index % 3) * .09 + (.5 + wave * .5) * .12);
      const lean = Math.sin(phase * .73 + index) * width * .24;

      ctx.globalAlpha = intensity * (.84 + flicker * .13);
      ctx.fillStyle = '#dc3513';
      ctx.shadowColor = '#ff4518';
      ctx.shadowBlur = 9;
      traceBurningTongue(ctx, centerX, baseY, width, height, lean);
      ctx.fill();

      ctx.globalAlpha = intensity * (.9 + flicker * .08);
      ctx.fillStyle = '#ff8617';
      ctx.shadowColor = '#ff9f1c';
      ctx.shadowBlur = 5;
      traceBurningTongue(ctx, centerX, baseY - 1, width * .67, height * .76, lean * .65);
      ctx.fill();

      ctx.globalAlpha = intensity * (.72 + flicker * .2);
      ctx.fillStyle = '#ffe86a';
      ctx.shadowColor = '#ffd93d';
      ctx.shadowBlur = 3;
      traceBurningTongue(ctx, centerX, baseY - 1.5, width * .34, height * .48, lean * .32);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'screen';
    for (let ember = 0; ember < 4; ember += 1) {
      const phase = (timestamp / (480 + ember * 47) + block.id * .17 + ember * .29) % 1;
      const emberAlpha = Math.sin(phase * Math.PI) * intensity;
      const px = x + w * (.18 + ember * .21) + Math.sin(block.id + ember * 3.1) * 3;
      const py = sy + h * (.68 - phase * .58);
      ctx.globalAlpha = emberAlpha * .8;
      ctx.fillStyle = ember % 2 ? '#fff09a' : '#ff9d22';
      ctx.shadowColor = '#ff5c18';
      ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(px, py, 1.1 + (ember % 2) * .55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawBlockElementalOverlay(block, sy, timestamp) {
    const x = block.x;
    const w = block.w;
    const h = block.h;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, sy + 1, w - 2, h - 2);
    ctx.clip();

    if (blockIsGolden(block, timestamp)) {
      const flash = timestamp < (block.goldFlashUntil || 0) ? .2 : 0;
      const shimmer = .5 + Math.sin(timestamp / 125 + block.id * .7) * .5;
      ctx.fillStyle = `rgba(255,197,35,${.3 + flash + shimmer * .08})`;
      ctx.fillRect(x + 1, sy + 1, w - 2, h - 2);
      ctx.strokeStyle = '#fff0a0';
      ctx.lineWidth = 2.3;
      ctx.shadowColor = '#ffb51f';
      ctx.shadowBlur = 8;
      ctx.strokeRect(x + 3, sy + 3, w - 6, h - 6);
      for (let sparkle = 0; sparkle < 3; sparkle += 1) {
        const px = x + w * (.22 + sparkle * .27);
        const py = sy + h * (.32 + Math.sin(timestamp / 180 + sparkle * 2 + block.id) * .14);
        const size = 2.5 + shimmer * 1.8;
        ctx.beginPath();
        ctx.moveTo(px - size, py); ctx.lineTo(px + size, py);
        ctx.moveTo(px, py - size); ctx.lineTo(px, py + size);
        ctx.stroke();
      }
    }

    if (block.elementalFrozen) {
      const flash = timestamp < (block.frostFlashUntil || 0) ? .18 : 0;
      ctx.fillStyle = `rgba(151,229,255,${.24 + flash})`;
      ctx.fillRect(x + 1, sy + 1, w - 2, h - 2);
      ctx.strokeStyle = 'rgba(226,251,255,.92)';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(x + 3, sy + 3, w - 6, h - 6);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w * .22, sy + 3); ctx.lineTo(x + w * .48, sy + h * .43); ctx.lineTo(x + w * .36, sy + h - 3);
      ctx.moveTo(x + w * .77, sy + 4); ctx.lineTo(x + w * .56, sy + h * .52); ctx.lineTo(x + w * .82, sy + h - 4);
      ctx.stroke();
    }

    if (timestamp < Math.max(block.fireDamageAt || 0, block.fireFlashUntil || 0)) {
      const age = Math.max(0, timestamp - (block.fireIgnitedAt || timestamp - 180));
      const ignite = smoothFireVisual(age / 170);
      const release = smoothFireVisual(((block.fireFlashUntil || timestamp) - timestamp) / 330);
      drawBurningBlockFlames(block, sy, timestamp, ignite * release);
    }

    if (timestamp >= (block.electricFlashStartedAt || 0) && timestamp < (block.electricFlashUntil || 0)) {
      const duration = Math.max(1, block.electricFlashUntil - (block.electricFlashStartedAt || timestamp));
      const progress = clamp((timestamp - (block.electricFlashStartedAt || timestamp)) / duration, 0, 1);
      const flash = Math.sin(progress * Math.PI);
      const blue = block.electricFlashColor === 'blue';
      const edge = blue ? '#75efff' : '#fff06a';
      const core = blue ? '#e9ffff' : '#fffde0';
      const glow = blue ? '#168eff' : '#ffc313';
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = .16 + flash * .38;
      ctx.fillStyle = blue ? '#39c8ff' : '#ffd42e';
      ctx.fillRect(x + 1, sy + 1, w - 2, h - 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = .48 + flash * .52;
      ctx.strokeStyle = edge;
      ctx.lineWidth = 2.4 + flash * 1.5;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 9 + flash * 10;
      ctx.strokeRect(x + 2.5, sy + 2.5, w - 5, h - 5);
      ctx.strokeStyle = core;
      ctx.lineWidth = 1.35;
      ctx.shadowBlur = 5;
      for (let spark = 0; spark < 3; spark += 1) {
        const startX = x + w * (.18 + spark * .31);
        const startY = sy + h * (.18 + ((block.id + spark) % 3) * .18);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (spark % 2 ? -5 : 6), startY + 7);
        ctx.lineTo(startX + (spark % 2 ? 3 : -2), startY + 13);
        ctx.stroke();
      }
    }
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
    const centerOffset = ({ 1: .066, 2: .087, 3: -.047 })[stage] * block.w;
    ctx.save();
    ctx.beginPath();
    ctx.rect(block.x + gutter, sy + gutter, block.w - gutter * 2, block.h - gutter * 2);
    ctx.clip();
    ctx.globalAlpha = .94;
    ctx.drawImage(sprite, block.x + gutter + centerOffset, sy + gutter, block.w - gutter * 2, block.h - gutter * 2);
    ctx.restore();
    return true;
  }

  function drawSpecialBlockAura(block, sy) {
    const auraKey = block.hazard ? 'hazard' : block.special;
    // Only universally important signals glow: green means healing, red means
    // danger. Other utility blocks rely on their artwork and own animations.
    if (auraKey !== 'gel' && auraKey !== 'hazard') return;
    const colors = {
      gel: [50, 225, 116],
      hazard: [255, 60, 24]
    };
    const [red, green, blue] = colors[auraKey];
    // These are navigation signals, not animated power-ups. Their artwork and
    // outline stay still while the other secondary blocks softly pulse.
    const pulse = .5;
    const cx = block.x + block.w / 2;
    const cy = sy + block.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(block.x + 1, sy + 1, block.w - 2, block.h - 2);
    ctx.clip();
    const radius = block.w * (auraKey === 'hazard' ? .7 : .62);
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    // Keep the artwork readable: the colour lives mostly on the rim instead
    // of washing the whole tile with a flat glow.
    const preserveVolcanicLook = run.worldId === 4;
    const strength = preserveVolcanicLook ? .3 : .21;
    glow.addColorStop(0, `rgba(${red},${green},${blue},${strength + pulse * .12})`);
    glow.addColorStop(.58, `rgba(${red},${green},${blue},${strength * .48})`);
    glow.addColorStop(1, `rgba(${red},${green},${blue},0)`);
    ctx.globalAlpha = .9;
    ctx.fillStyle = glow;
    ctx.fillRect(block.x + 1, sy + 1, block.w - 2, block.h - 2);
    // A dark semantic under-stroke keeps the outline visible on ice, cream and
    // other pale worlds. The bright inner stroke supplies the jelly-like glow.
    {
      const darkRim = auraKey === 'hazard'
        ? 'rgba(103, 12, 24, .94)'
        : 'rgba(5, 91, 50, .92)';
      if (!preserveVolcanicLook) {
        ctx.globalAlpha = .84 + pulse * .1;
        ctx.strokeStyle = darkRim;
        ctx.shadowBlur = 0;
        ctx.lineWidth = 4.4;
        ctx.strokeRect(block.x + 2.35, sy + 2.35, block.w - 4.7, block.h - 4.7);
      }

      ctx.globalAlpha = .73 + pulse * .23;
      ctx.strokeStyle = `rgba(${red},${green},${blue},.97)`;
      ctx.shadowColor = `rgba(${red},${green},${blue},.92)`;
      ctx.shadowBlur = (preserveVolcanicLook ? 3.5 : 3) + pulse * (preserveVolcanicLook ? 4.5 : 4);
      ctx.lineWidth = preserveVolcanicLook
        ? (auraKey === 'hazard' ? 2.6 : 2.15)
        : (auraKey === 'hazard' ? 2.25 : 2);
      ctx.strokeRect(block.x + 2.35, sy + 2.35, block.w - 4.7, block.h - 4.7);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawWorldSprite(block, sy, hpRatio, timestamp = performance.now()) {
    if (block.special === 'boss') return false;
    let spriteName;
    const frostTransformed = block.elementalSnow || block.elementalSnowflake;
    const frostProgress = frostTransformed && block.frostTransformStartedAt
      ? clamp((timestamp - block.frostTransformStartedAt) / (block.frostTransformDuration || 470), 0, 1)
      : frostTransformed ? 1 : 0;
    const frostIsPrimary = frostTransformed && frostProgress >= .995;
    if (frostIsPrimary && block.elementalSnowflake) spriteName = 'snowflake';
    else if (frostIsPrimary && block.elementalSnow) spriteName = 'snow-packed';
    else if (block.hazard && run.worldId === 2) spriteName = block.hazardVariant === 'spikes' ? 'ice-spikes' : 'ice-shards';
    else if (block.hazard && run.worldId === 3) spriteName = 'candy-hazard';
    else if (block.hazard && run.worldId === 4) spriteName = 'lava-hazard';
    else if (block.hazard) spriteName = 'stone-hazard';
    else if (block.special === 'bomb') spriteName = 'dynamite';
    else if (block.special === 'spring') spriteName = 'spring';
    else if (block.special === 'jelly') spriteName = 'jelly-bounce';
    else if (block.special === 'cryo') spriteName = 'cryo';
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

    const contentId = block.frozen
      ? 'dense'
      : block.visualId || (block.special === 'gel' ? 'heal' : block.special || (block.hazard ? 'hazard' : block.tier));
    const edited = frostIsPrimary ? null : contentBlock(run.worldId, contentId);
    if (edited?.type === 'custom' && edited.sprite) spriteName = edited.sprite;
    const oreArtwork = !block.frozen && (block.tier === 'ore' || block.frozenOre) ? edited?.oreTextures?.[block.oreType?.id || 'coal'] : null;
    const artwork = oreArtwork?.image ? oreArtwork : edited;
    const customSprite = artwork?.image ? projectSprite(artwork.image) : null;
    const sprites = frostIsPrimary ? ensureWorldSprites(2) : WORLD_SPRITES[run.worldId];
    const pandoraSprite = block.special === 'pandora' ? VFX_SPRITES?.['pandora-box'] : null;
    const sprite = pandoraSprite?.complete && pandoraSprite.naturalWidth
      ? pandoraSprite
      : customSprite?.complete && customSprite.naturalWidth ? customSprite : sprites?.[spriteName];
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
    if (['bomb', 'spring', 'cryo', 'jelly', 'pandora', 'geyser', 'meteor'].includes(block.special)) {
      const time = performance.now();
      const phase = time / (block.special === 'bomb' ? 160 : block.special === 'spring' ? 260 : 300) + block.id;
      const wave = Math.sin(phase);
      const pulse = block.special === 'bomb'
        ? 1 + wave * .06
        : block.special === 'cryo'
            ? 1 + wave * .028
            : block.special === 'jelly'
              ? 1 + wave * .012
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
      } else if (block.special === 'jelly') {
        const hitAge = Math.max(0, time - (block.jellyHitAt || 0));
        const hitMotion = hitAge < 720
          ? Math.sin(hitAge / 720 * Math.PI * 3.4) * Math.exp(-hitAge / 340) * (block.jellyImpact || 0)
          : 0;
        const squash = hitMotion * .24;
        if (Math.abs(block.jellyNormalX || 0) > Math.abs(block.jellyNormalY || 0)) ctx.scale(1 - squash, 1 + squash * .72);
        else ctx.scale(1 + squash * .72, 1 - squash);
        ctx.scale(pulse, pulse);
      } else if (block.special === 'pandora') {
        const jackpotPulse = 1 + Math.sin(time / 210 + block.id) * .035;
        ctx.scale(jackpotPulse, jackpotPulse);
        ctx.filter = `hue-rotate(${Math.sin(time / 520 + block.id) * 22}deg) saturate(1.12)`;
      } else ctx.scale(pulse, pulse);
      ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
      ctx.restore();
    } else {
      ctx.drawImage(sprite, drawX, drawY, width, height);
    }
    if (frostTransformed && !frostIsPrimary) {
      const frostSpriteName = block.elementalSnowflake ? 'snowflake' : 'snow-packed';
      const frostSprite = ensureWorldSprites(2)?.[frostSpriteName];
      if (frostSprite?.complete && frostSprite.naturalWidth) {
        const reveal = frostProgress * frostProgress * (3 - 2 * frostProgress);
        ctx.save();
        ctx.globalAlpha = reveal;
        ctx.globalCompositeOperation = reveal < .72 ? 'screen' : 'source-over';
        ctx.drawImage(frostSprite, block.x + gutter, sy + gutter, block.w - gutter * 2, block.h - gutter * 2);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    drawSpecialBlockAura(block, sy);
    drawCrackStage(block, sy, hpRatio);

    return true;
  }

  function drawBlockTransitions(visibleBlocks) {
    const liveBlocks = new Map();
    for (const block of visibleBlocks) liveBlocks.set(`${block.row}:${block.col}`, block);

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
      hazard: '#403c49', cryo: '#54dff5', jelly: '#ff3f88', geyser: '#ff762b', meteor: '#ff7e27', boss: '#8a4fd2'
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
    if (els.slime.classList.contains('portal-surprised')) return 'surprised';
    if (els.slime.classList.contains('petting') || els.slime.classList.contains('petted')) return 'petting';
    if (els.slime.classList.contains('pleased')) return 'pleased';
    if (els.slime.classList.contains('chewing')) return 'chewing';
    if (els.slime.classList.contains('savoring')) return 'savoring';
    if (els.slime.classList.contains('eat') || els.slime.classList.contains('expect-food')) return 'hungry';
    if (els.slime.classList.contains('booped')) return 'surprised';
    return 'focused';
  }

  function menuCategoryLevels() {
    const levels = { fire: 0, frost: 0, electric: 0, cosmos: 0, gigantism: 0, wind: 0, explosion: 0, mass: 0 };
    const familyToCategory = {
      fire: 'fire', damage: 'fire',
      frost: 'frost', ice: 'frost',
      electric: 'electric', electricity: 'electric',
      cosmos: 'cosmos', space: 'cosmos', gravity: 'cosmos',
      gigantism: 'gigantism', giant: 'gigantism',
      wind: 'wind', tornado: 'wind',
      blast: 'explosion', explosion: 'explosion'
    };
    for (const food of session?.foods || []) {
      const family = foodRecipeFamily(food);
      const category = familyToCategory[family];
      if (category) levels[category] += 1;
    }
    for (const key of Object.keys(levels)) levels[key] = Math.min(3, levels[key]);
    return levels;
  }

  function syncMenuCategoryVisuals({ instant = false } = {}) {
    const levels = menuCategoryLevels();
    const now = performance.now();
    for (const key of ['fire', 'frost', 'electric', 'cosmos', 'gigantism', 'wind', 'explosion', 'mass']) {
      menuCategoryVisual[`${key}From`] = instant ? levels[key] : menuCategoryVisual[key];
      menuCategoryVisual[`${key}Target`] = levels[key];
      menuCategoryVisual[`${key}StartedAt`] = now;
      if (instant) menuCategoryVisual[key] = levels[key];
    }
  }

  function updateMenuCategoryVisuals(timestamp) {
    for (const key of ['fire', 'frost', 'electric', 'cosmos', 'gigantism', 'wind', 'explosion', 'mass']) {
      const from = menuCategoryVisual[`${key}From`];
      const target = menuCategoryVisual[`${key}Target`];
      if (menuReducedMotion || Math.abs(target - from) < .001) {
        menuCategoryVisual[key] = target;
        continue;
      }
      const duration = key === 'mass' || key === 'gigantism' ? 620 : key === 'frost' ? 600 : key === 'electric' ? 520 : 540;
      const progress = clamp((timestamp - menuCategoryVisual[`${key}StartedAt`]) / duration, 0, 1);
      const eased = key === 'mass' || key === 'gigantism'
        ? 1 + 1.25 * Math.pow(progress - 1, 3) + .25 * Math.pow(progress - 1, 2)
        : 1 - Math.pow(1 - progress, 3);
      menuCategoryVisual[key] = from + (target - from) * eased;
      if (progress >= 1) {
        menuCategoryVisual[key] = target;
        menuCategoryVisual[`${key}From`] = target;
      }
    }
    return menuCategoryVisual;
  }

  const smoothFireVisual = value => {
    const normalized = clamp(value, 0, 1);
    return normalized * normalized * (3 - 2 * normalized);
  };

  function drawFireEyeFlame(target, x, baseY, radius, timestamp, alpha) {
    const time = menuReducedMotion ? 0 : timestamp / 285;
    const sway = Math.sin(time) * radius * .018 + Math.sin(time * 1.8) * radius * .008;
    const pulse = menuReducedMotion ? 1 : 1 + Math.sin(time * 1.43) * .055;
    target.save();
    target.translate(x, baseY);
    target.scale(1 / pulse, pulse);
    target.globalAlpha *= alpha;
    target.shadowColor = '#ff631b';
    target.shadowBlur = radius * .055;

    target.fillStyle = '#ef4318';
    target.beginPath();
    target.moveTo(0, 0);
    target.bezierCurveTo(-radius * .082, -radius * .015, -radius * .088, -radius * .105, -radius * .041, -radius * .146);
    target.bezierCurveTo(-radius * .012, -radius * .174, sway * .55, -radius * .19, sway, -radius * .222);
    target.bezierCurveTo(radius * .079 + sway * .35, -radius * .155, radius * .083, -radius * .054, 0, 0);
    target.fill();

    target.shadowBlur = 0;
    target.fillStyle = '#ffad1e';
    target.beginPath();
    target.moveTo(0, -radius * .012);
    target.bezierCurveTo(-radius * .047, -radius * .033, -radius * .045, -radius * .098, -radius * .018, -radius * .126);
    target.bezierCurveTo(radius * .006, -radius * .151, sway * .2, -radius * .164, sway * .23, -radius * .181);
    target.bezierCurveTo(radius * .043, -radius * .126, radius * .046, -radius * .057, 0, -radius * .012);
    target.fill();
    target.fillStyle = '#fff39a';
    target.beginPath();
    target.ellipse(-radius * .008, -radius * .072, radius * .019, radius * .046, -.1, 0, Math.PI * 2);
    target.fill();
    target.restore();
  }

  function drawFireEyes(target, x, y, radius, level, timestamp, opacity = 1, cuteFace = false) {
    const visible = smoothFireVisual(level);
    if (visible < .01) return;
    const pupilY = y + radius * (cuteFace ? .025 : -.105);
    const eyeOffset = radius * (cuteFace ? .305 : .245);
    for (const side of [-1, 1]) {
      const px = x + eyeOffset * side;
      if (cuteFace) {
        target.save();
        target.globalAlpha *= visible * opacity;
        target.beginPath();
        target.ellipse(px, pupilY + radius * .025, radius * .095, radius * .145, 0, 0, Math.PI * 2);
        target.clip();
        const glow = target.createRadialGradient(px, pupilY + radius * .09, 0, px, pupilY + radius * .09, radius * .115);
        glow.addColorStop(0, '#fff2a0');
        glow.addColorStop(.48, '#ff9a20');
        glow.addColorStop(1, 'rgba(255,91,18,0)');
        target.fillStyle = glow;
        target.beginPath();
        target.ellipse(px, pupilY + radius * .075, radius * .09, radius * .105, 0, 0, Math.PI * 2);
        target.fill();
        drawFireEyeFlame(target, px, pupilY + radius * .15, radius * .53, timestamp + side * 290, visible * opacity * .95);
        target.restore();
        continue;
      }
      target.save();
      target.beginPath();
      target.ellipse(px - side * radius * (cuteFace ? .018 : 0), pupilY, radius * (cuteFace ? .092 : .145), radius * (cuteFace ? .142 : .185), 0, 0, Math.PI * 2);
      target.clip();
      drawFireEyeFlame(target, px - side * radius * (cuteFace ? .018 : 0), pupilY + radius * (cuteFace ? .085 : .105), radius * (cuteFace ? .72 : 1), timestamp + side * 290, visible * opacity * (cuteFace ? .62 : 1));
      target.restore();
    }
  }

  function drawFireHeadFlame(target, x, y, radius, timestamp, alpha) {
    const time = menuReducedMotion ? 0 : timestamp / 620;
    const sway = Math.sin(time) * radius * .035;
    const pulse = menuReducedMotion ? 1 : 1 + Math.sin(time * 1.45) * .035;
    target.save();
    target.translate(x, y);
    target.scale(1 / pulse, pulse);
    target.globalAlpha *= alpha;
    const width = radius * .19;
    const height = radius * .36;
    const trace = (pathWidth, pathHeight, tipSway) => {
      target.beginPath();
      target.moveTo(0, radius * .025);
      target.bezierCurveTo(-pathWidth * .94, 0, -pathWidth * .86, -pathHeight * .35, -pathWidth * .43, -pathHeight * .59);
      target.bezierCurveTo(-pathWidth * .08, -pathHeight * .79, tipSway * .72, -pathHeight * .91, tipSway, -pathHeight);
      target.bezierCurveTo(pathWidth * .48 + tipSway * .55, -pathHeight * .72, pathWidth * .82, -pathHeight * .38, pathWidth * .82, -pathHeight * .2);
      target.bezierCurveTo(pathWidth * .82, -pathHeight * .045, pathWidth * .5, radius * .025, 0, radius * .025);
      target.closePath();
    };
    target.shadowColor = '#ff6a18';
    target.shadowBlur = radius * .13;
    const outer = target.createLinearGradient(0, -height, 0, radius * .03);
    outer.addColorStop(0, '#e93c18');
    outer.addColorStop(.55, '#ff6b18');
    outer.addColorStop(1, '#ff9d18');
    target.fillStyle = outer;
    trace(width, height, sway);
    target.fill();
    target.shadowBlur = radius * .045;
    target.fillStyle = '#ffb51f';
    trace(width * .62, height * .72, sway * .38);
    target.fill();
    target.shadowBlur = 0;
    target.fillStyle = '#fff078';
    trace(width * .3, height * .43, sway * .13);
    target.fill();
    target.restore();
  }

  function drawFireTip(target, x, y, radius, level, timestamp, opacity = 1) {
    const dominant = smoothFireVisual(level - 1);
    if (dominant < .01) return;
    drawFireHeadFlame(target, x, y - radius * .69, radius, timestamp, dominant * opacity);
  }

  const fireContour = (() => {
    const curves = [
      [0, -1.03, .17, -1.02, .2, -.84, .35, -.75],
      [.35, -.75, .76, -.59, 1.02, -.2, 1.01, .28],
      [1.01, .28, .97, .76, .57, 1.04, 0, 1.05],
      [0, 1.05, -.57, 1.04, -.97, .76, -1.01, .28],
      [-1.01, .28, -1.02, -.2, -.76, -.59, -.35, -.75],
      [-.35, -.75, -.2, -.84, -.17, -1.02, 0, -1.03]
    ];
    return curves.flatMap(curve => Array.from({ length: 24 }, (_, index) => {
      const time = index / 24;
      const inverse = 1 - time;
      return [
        inverse ** 3 * curve[0] + 3 * inverse ** 2 * time * curve[2] + 3 * inverse * time ** 2 * curve[4] + time ** 3 * curve[6],
        inverse ** 3 * curve[1] + 3 * inverse ** 2 * time * curve[3] + 3 * inverse * time ** 2 * curve[5] + time ** 3 * curve[7]
      ];
    }));
  })();

  function traceFireContour(target, radius, timestamp, scale, inset = false, insetScale = .93, intensity = 1) {
    const time = menuReducedMotion ? 0 : timestamp / 720;
    const expansion = 1 + Math.max(0, intensity - 1) * .24;
    target.beginPath();
    fireContour.forEach(([x, y], index) => {
      const angle = Math.atan2(y, x);
      const flow = Math.sin(angle * 7 + time * 2) * .5 + Math.sin(angle * 11 - time * 2.7) * .3 + Math.sin(angle * 4 + time) * .2;
      const heat = (.09 + Math.pow((flow + 1) * .5, 2) * .23) * scale;
      const length = Math.hypot(x, y);
      const px = radius * (x * expansion + x / length * heat + Math.sin(angle * 8 + time * 2) * heat * .25);
      const lowerExtension = inset ? Math.pow(Math.max(0, y), 4) * radius * .085 : 0;
      const py = radius * (y * expansion + y / length * heat * .5 - heat * (1.05 - y * .5)) + lowerExtension;
      if (!index) target.moveTo(px, py);
      else target.lineTo(px, py);
    });
    target.closePath();
    if (!inset) return;
    for (let index = fireContour.length - 1; index >= 0; index -= 1) {
      const [x, y] = fireContour[index];
      if (index === fireContour.length - 1) target.moveTo(x * radius * insetScale, y * radius * insetScale);
      else target.lineTo(x * radius * insetScale, y * radius * insetScale);
    }
    target.closePath();
  }

  function drawFireContour(target, { radius, timestamp }, front = false, intensity = 1) {
    target.save();
    target.shadowColor = '#ff641c';
    target.shadowBlur = (front ? 5 : 13) * intensity;
    for (let index = 0; index < 3; index += 1) {
      target.fillStyle = ['#ee421b', '#ff991b', '#ffe878'][index];
      const insetScale = [.84, .89, .925][index];
      traceFireContour(target, radius, timestamp + index * 90, [1, .66, .29][index] * (1 + (intensity - 1) * .55), front, insetScale, intensity);
      target.fill('evenodd');
      target.shadowBlur = 0;
    }
    if (front && intensity > 1.04) {
      target.globalAlpha *= Math.min(.82, (intensity - 1) * .72);
      target.strokeStyle = '#fff08a';
      target.lineWidth = radius * (.024 + (intensity - 1) * .012);
      target.shadowColor = '#ff7a1b';
      target.shadowBlur = radius * .11 * intensity;
      traceFireContour(target, radius, timestamp - 35, .48 * intensity, false, .93, intensity);
      target.stroke();
    }
    target.restore();
  }

  function paintFrostBody(target, { radius, colors }, amount) {
    const base = target.createRadialGradient(-radius * .25, -radius * .35, radius * .12, 0, 0, radius * 1.1);
    base.addColorStop(0, colors[0]); base.addColorStop(.58, colors[1]); base.addColorStop(1, colors[2]);
    target.fillStyle = base;
    target.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
    const frozen = target.createLinearGradient(0, -radius * .15, 0, radius);
    frozen.addColorStop(0, 'rgba(126,214,242,0)');
    frozen.addColorStop(.24, `rgba(118,210,240,${amount * .18})`);
    frozen.addColorStop(.5, `rgba(128,218,245,${amount * .48})`);
    frozen.addColorStop(.76, `rgba(193,242,255,${amount * .78})`);
    frozen.addColorStop(1, `rgba(239,253,255,${amount * .94})`);
    target.fillStyle = frozen;
    target.fillRect(-radius * 1.05, -radius * .15, radius * 2.1, radius * 1.2);
  }

  function drawFrostRim(target, radius, amount) {
    if (amount < .01) return;
    target.save();
    target.globalAlpha *= amount;
    target.lineCap = 'round'; target.lineJoin = 'round';
    target.shadowColor = '#7fdcff'; target.shadowBlur = radius * .035;
    const frost = target.createLinearGradient(0, radius * .08, 0, radius * .96);
    frost.addColorStop(0, 'rgba(90,190,226,.18)'); frost.addColorStop(.3, 'rgba(101,205,239,.72)'); frost.addColorStop(.72, '#bdefff'); frost.addColorStop(1, '#effdff');
    target.strokeStyle = frost; target.lineWidth = Math.max(3, radius * .09);
    target.beginPath();
    target.moveTo(radius * .995, radius * .13);
    target.bezierCurveTo(radius * .97, radius * .72, radius * .57, radius * 1.02, 0, radius * 1.04);
    target.bezierCurveTo(-radius * .57, radius * 1.02, -radius * .97, radius * .72, -radius * .995, radius * .13);
    target.stroke(); target.restore();
  }

  function drawColdFace(target, radius, amount, timestamp) {
    if (amount < .01) return;
    target.save();
    target.globalAlpha *= amount * .62; target.fillStyle = '#65c9f4';
    target.beginPath();
    target.ellipse(-radius * .45, radius * .14, radius * .14, radius * .075, 0, 0, Math.PI * 2);
    target.ellipse(radius * .45, radius * .14, radius * .14, radius * .075, 0, 0, Math.PI * 2); target.fill();
    const cycleMs = 3350;
    const cycle = (timestamp % cycleMs) / cycleMs;
    const breathPhase = clamp((cycle - .62) / .27, 0, 1);
    if (breathPhase > 0 && breathPhase < 1) {
      target.shadowColor = '#8fe6ff';
      target.shadowBlur = radius * .055;
      for (let index = 0; index < 4; index += 1) {
        const phase = clamp(breathPhase * 1.38 - index * .13, 0, 1);
        if (phase <= 0 || phase >= 1) continue;
        const puff = Math.sin(phase * Math.PI);
        target.globalAlpha = amount * puff * (.64 - index * .055);
        target.fillStyle = index % 2 ? '#d7f7ff' : '#f4feff';
        target.beginPath();
        target.ellipse(
          radius * (.1 + phase * .53),
          radius * (.2 - phase * .2 + Math.sin(phase * Math.PI * 2 + index) * .025),
          radius * (.055 + phase * .07),
          radius * (.032 + phase * .048),
          -.12,
          0,
          Math.PI * 2
        );
        target.fill();
      }
    }
    target.restore();
  }

  function drawSnowCap(target, radius, amount, timestamp) {
    if (amount < .01) return;
    const wobble = menuReducedMotion ? 0 : Math.sin(timestamp / 1100) * radius * .008;
    target.save(); target.translate(0, wobble); target.globalAlpha *= amount;
    target.shadowColor = '#78ccec'; target.shadowBlur = radius * .055;
    const snow = target.createLinearGradient(0, -radius, 0, -radius * .48);
    snow.addColorStop(0, '#fff'); snow.addColorStop(.68, '#dff7ff'); snow.addColorStop(1, '#8fdaf4');
    target.fillStyle = snow; target.strokeStyle = '#5eadd1'; target.lineWidth = radius * .028;
    target.beginPath(); target.moveTo(-radius * .57, -radius * .58);
    target.bezierCurveTo(-radius * .47, -radius * .74, -radius * .25, -radius * .77, -radius * .12, -radius * .9);
    target.bezierCurveTo(-radius * .055, -radius * 1.01, radius * .02, -radius * 1.08, radius * .11, -radius * .94);
    target.bezierCurveTo(radius * .22, -radius * .8, radius * .48, -radius * .78, radius * .58, -radius * .58);
    target.bezierCurveTo(radius * .42, -radius * .5, radius * .29, -radius * .55, radius * .18, -radius * .5);
    target.bezierCurveTo(radius * .03, -radius * .43, -radius * .08, -radius * .57, -radius * .2, -radius * .49);
    target.bezierCurveTo(-radius * .34, -radius * .42, -radius * .44, -radius * .54, -radius * .57, -radius * .58);
    target.closePath(); target.fill(); target.stroke(); target.restore();
  }

  function drawSnowfall(target, x, y, radius, amount, timestamp) {
    if (amount < .01) return;
    [-.55, -.31, -.08, .18, .42, .61].forEach((offset, index) => {
      const phase = (timestamp / (1700 + index * 83) + index * .16) % 1;
      const px = x + radius * (offset + Math.sin(phase * Math.PI * 2 + index) * .055);
      const py = y - radius * .68 + phase * radius * 1.35;
      const size = radius * (.025 + (index % 3) * .006);
      target.save(); target.translate(px, py); target.rotate(phase * Math.PI + index);
      target.globalAlpha = amount * Math.sin(phase * Math.PI) * .9;
      target.strokeStyle = '#e9fbff'; target.shadowColor = '#5fc6ef'; target.shadowBlur = radius * .035; target.lineWidth = radius * .016;
      for (let arm = 0; arm < 3; arm += 1) {
        const angle = arm * Math.PI / 3; target.beginPath();
        target.moveTo(-Math.cos(angle) * size, -Math.sin(angle) * size); target.lineTo(Math.cos(angle) * size, Math.sin(angle) * size); target.stroke();
      }
      target.restore();
    });
  }

  function drawSnowmanAvatar(target, options, amount, timestamp) {
    if (amount < .001) return;
    const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
    drawSlimeAvatar(target, {
      ...options, colors: ['#ffffff', '#d8f5ff', '#58afd4'], alpha: alpha * amount,
      outlineColor: '#285b82', bodyHighlight: true,
      backLayer: (layerTarget, state) => {
        layerTarget.save(); layerTarget.strokeStyle = '#55301d'; layerTarget.lineCap = 'round';
        for (const side of [-1, 1]) {
          layerTarget.lineWidth = state.radius * .065; layerTarget.beginPath();
          layerTarget.moveTo(side * state.radius * .76, state.radius * .08); layerTarget.lineTo(side * state.radius * 1.3, -state.radius * .25); layerTarget.stroke();
          layerTarget.lineWidth = state.radius * .035; layerTarget.beginPath();
          layerTarget.moveTo(side * state.radius * 1.06, -state.radius * .1); layerTarget.lineTo(side * state.radius * 1.13, -state.radius * .43);
          layerTarget.moveTo(side * state.radius * 1.11, -state.radius * .13); layerTarget.lineTo(side * state.radius * 1.34, -state.radius * .04); layerTarget.stroke();
        }
        layerTarget.restore();
      },
      afterLayer: (layerTarget, state) => {
        const radius = state.radius;
        const carrot = layerTarget.createLinearGradient(0, 0, radius * .4, 0); carrot.addColorStop(0, '#ffc238'); carrot.addColorStop(1, '#f06410');
        layerTarget.fillStyle = carrot; layerTarget.strokeStyle = '#8b3d09'; layerTarget.lineWidth = radius * .027;
        layerTarget.beginPath(); layerTarget.moveTo(-radius * .025, -radius * .015); layerTarget.quadraticCurveTo(radius * .11, -radius * .005, radius * .29, radius * .035); layerTarget.quadraticCurveTo(radius * .12, radius * .09, radius * .015, radius * .095); layerTarget.closePath(); layerTarget.fill(); layerTarget.stroke();
        layerTarget.fillStyle = '#203149'; layerTarget.strokeStyle = '#78d3ef'; layerTarget.lineWidth = radius * .014;
        [.45, .7].forEach(buttonY => { layerTarget.beginPath(); layerTarget.arc(0, radius * buttonY, radius * .061, 0, Math.PI * 2); layerTarget.fill(); layerTarget.stroke(); });
      }, timestamp
    });
  }

  function traceElectricBolt(target, points) {
    target.beginPath(); points.forEach(([x, y], index) => index ? target.lineTo(x, y) : target.moveTo(x, y));
  }

  function strokeElectricBolt(target, points, alpha, radius, hot = false) {
    if (alpha < .015) return;
    target.save(); target.globalAlpha *= alpha; target.lineCap = 'round'; target.lineJoin = 'round';
    target.shadowColor = hot ? '#26b8ff' : '#ffc31d'; target.shadowBlur = radius * .085;
    target.strokeStyle = hot ? '#47dfff' : '#ffd92e'; target.lineWidth = radius * .052; traceElectricBolt(target, points); target.stroke();
    target.shadowBlur = radius * .03; target.strokeStyle = hot ? '#efffff' : '#fffbd6'; target.lineWidth = radius * .018; target.stroke(); target.restore();
  }

  function drawLightningMark(target, radius, amount) {
    if (amount < .01) return;
    target.save(); target.translate(0, -radius * .73); target.globalAlpha *= amount;
    target.shadowColor = '#ffd51f'; target.shadowBlur = radius * .13; target.fillStyle = '#ffe026'; target.strokeStyle = '#b87405'; target.lineWidth = radius * .025; target.lineJoin = 'round';
    target.beginPath(); target.moveTo(radius * .035, -radius * .17); target.lineTo(-radius * .105, radius * .005); target.lineTo(-radius * .01, radius * .005); target.lineTo(-radius * .075, radius * .18); target.lineTo(radius * .12, -radius * .045); target.lineTo(radius * .025, -radius * .045); target.closePath(); target.fill(); target.stroke(); target.restore();
  }

  function drawElectricAura(target, x, y, radius, amount, sphere = false) {
    if (amount < .01) return;
    target.save(); target.globalAlpha = amount;
    const reach = sphere ? 1.3 : 1.1;
    const glow = target.createRadialGradient(x, y, radius * .52, x, y, radius * reach);
    if (sphere) {
      glow.addColorStop(0, 'rgba(152,249,255,.18)'); glow.addColorStop(.58, 'rgba(44,174,255,.26)'); glow.addColorStop(1, 'rgba(32,105,255,0)');
    } else {
      glow.addColorStop(0, 'rgba(255,249,174,.12)'); glow.addColorStop(.58, 'rgba(255,207,38,.22)'); glow.addColorStop(1, 'rgba(255,169,16,0)');
    }
    target.fillStyle = glow; target.beginPath(); target.arc(x, y, radius * reach, 0, Math.PI * 2); target.fill(); target.restore();
  }

  function drawElectricSparks(target, x, y, radius, amount, timestamp, intense = false) {
    if (amount < .01) return;
    const count = intense ? 12 : 6;
    for (let index = 0; index < count; index += 1) {
      const phase = (timestamp / ((intense ? 470 : 760) + index * 31) + index * .337) % 1;
      const activePart = intense ? .72 : .5;
      const life = phase < activePart ? Math.sin(phase / activePart * Math.PI) : 0;
      if (life < .06) continue;
      const angle = index * 2.399 + Math.sin(index * 4.17) * .22;
      const travel = phase / activePart;
      const start = radius * (.93 + travel * .1), end = radius * (1.04 + travel * (intense ? .58 : .31));
      const tx = Math.cos(angle + Math.PI / 2), ty = Math.sin(angle + Math.PI / 2), jag = radius * (.055 + index % 3 * .014);
      const point = (distance, offset) => [x + Math.cos(angle) * distance + tx * offset, y + Math.sin(angle) * distance + ty * offset];
      strokeElectricBolt(target, [point(start, 0), point(start + (end - start) * .34, jag), point(start + (end - start) * .67, -jag * .72), point(end, 0)], amount * life, radius, intense);
    }
  }

  function drawEnergyTendrils(target, x, y, radius, amount, timestamp) {
    if (amount < .01) return;
    for (let index = 0; index < 8; index += 1) {
      const phase = (timestamp / (520 + index * 31) + index * .347) % 1;
      const life = Math.min(1, phase / .13) * Math.max(0, 1 - (phase - .13) / .57);
      if (life < .055) continue;
      const angle = index * 2.399 + Math.sin(index * 7.13) * .28;
      const radialX = Math.cos(angle), radialY = Math.sin(angle), tangentX = -radialY, tangentY = radialX;
      const start = radius * .9, reach = radius * (1.14 + index % 3 * .08), bend = radius * (.09 + index % 2 * .05);
      const points = [[x + radialX * start, y + radialY * start], [x + radialX * (start + (reach - start) * .34) + tangentX * bend, y + radialY * (start + (reach - start) * .34) + tangentY * bend], [x + radialX * (start + (reach - start) * .68) - tangentX * bend * .55, y + radialY * (start + (reach - start) * .68) - tangentY * bend * .55], [x + radialX * reach, y + radialY * reach]];
      strokeElectricBolt(target, points, amount * life, radius, true);
    }
  }

  const ULTRA_FORM_IRIS_TINT = Object.freeze({
    explosion: '#ff4d58',
    frost: '#48cfff',
    cosmos: '#b45cff',
    electric: '#ffd83d',
    fire: '#ff7426',
    wind: '#42d9bd'
  });

  function drawUltraFormAccents(target, x, y, radius, form, amount, timestamp) {
    if (!form || amount < .01) return;
    target.save();
    target.globalAlpha = amount;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    const phase = timestamp / 700;

    if (form === 'fire' || form === 'explosion') {
      const palette = form === 'fire' ? ['#fff09a', '#ff9b24', '#ff4a23'] : ['#fff2a1', '#ff6342', '#ff2638'];
      for (let index = 0; index < 5; index += 1) {
        const drift = (phase * (.72 + index * .05) + index * .23) % 1;
        const side = index % 2 ? 1 : -1;
        const px = x + side * radius * (.72 + (index % 3) * .16) + Math.sin(phase * 2 + index) * radius * .05;
        const py = y + radius * .45 - drift * radius * 1.35;
        const size = radius * (.018 + (1 - drift) * .018);
        target.globalAlpha = amount * Math.sin(drift * Math.PI) * .84;
        target.fillStyle = palette[index % palette.length];
        target.beginPath(); target.arc(px, py, size, 0, Math.PI * 2); target.fill();
      }
    } else if (form === 'frost') {
      drawSnowfall(target, x, y, radius, amount * .52, timestamp);
    } else if (form === 'electric') {
      drawElectricSparks(target, x, y, radius, amount * .48, timestamp, false);
    } else if (form === 'cosmos') {
      for (let index = 0; index < 5; index += 1) {
        const angle = index * Math.PI * 2 / 5 + phase * .18;
        const pulse = .5 + Math.sin(phase * 4 + index * 1.7) * .5;
        const px = x + Math.cos(angle) * radius * (1.02 + (index % 2) * .12);
        const py = y + Math.sin(angle) * radius * .83;
        const size = radius * (.018 + pulse * .018);
        target.globalAlpha = amount * (.42 + pulse * .46);
        target.strokeStyle = index % 2 ? '#d6b0ff' : '#fff4ff';
        target.lineWidth = Math.max(1.2, radius * .014);
        target.beginPath(); target.moveTo(px - size, py); target.lineTo(px + size, py); target.moveTo(px, py - size); target.lineTo(px, py + size); target.stroke();
      }
    } else if (form === 'wind') {
      target.strokeStyle = '#dffff8';
      target.lineWidth = Math.max(1.4, radius * .018);
      for (let index = 0; index < 3; index += 1) {
        const offset = ((phase * .34 + index * .36) % 1) * radius * .7;
        const py = y - radius * .38 + index * radius * .39;
        target.globalAlpha = amount * (.32 + index * .12);
        target.beginPath();
        target.moveTo(x - radius * 1.12 + offset, py);
        target.bezierCurveTo(x - radius * .72 + offset, py - radius * .1, x - radius * .48 + offset, py + radius * .1, x - radius * .15 + offset, py);
        target.stroke();
      }
    }
    target.restore();
  }

  function drawElementalSlimeAvatar(target, options, levels, timestamp) {
    const fireLevel = clamp(Number(levels?.fire) || 0, 0, 3);
    const frostLevel = clamp(Number(levels?.frost) || 0, 0, 3);
    const electricLevel = clamp(Number(levels?.electric) || 0, 0, 3);
    const formLevels = {
      fire: fireLevel,
      frost: frostLevel,
      electric: electricLevel,
      cosmos: clamp(Number(levels?.cosmos) || 0, 0, 3),
      wind: clamp(Number(levels?.wind) || 0, 0, 3),
      explosion: clamp(Number(levels?.explosion) || 0, 0, 3)
    };
    const hybridForm = Object.keys(formLevels).find(form => formLevels[form] > 1) || '';
    const hybrid = hybridForm ? smoothFireVisual(formLevels[hybridForm] - 1) : 0;
    const finalBoost = hybridForm ? smoothFireVisual(formLevels[hybridForm] - 2) : 0;
    if (fireLevel < .001 && frostLevel < .001 && electricLevel < .001 && !hybridForm) {
      drawSlimeAvatar(target, options);
      return;
    }
    const fireDominant = smoothFireVisual(fireLevel - 1);
    const frostAmount = smoothFireVisual(frostLevel);
    const frostDominant = smoothFireVisual(frostLevel - 1);
    const electricMarked = smoothFireVisual(electricLevel);
    const electricCharged = smoothFireVisual(electricLevel - 1);
    const electricActive = clamp(Number(levels?.electricActive) || 0, 0, 1);
    const electricFlash = clamp(Number(levels?.electricFlash) || 0, 0, 1);
    let dominantTint = '';
    if (fireDominant > .001) dominantTint = `rgba(255,44,24,${(.72 * fireDominant).toFixed(3)})`;
    else if (frostDominant > .001) dominantTint = `rgba(73,183,238,${(.58 * frostDominant).toFixed(3)})`;
    else if (electricCharged > .001) dominantTint = `rgba(255,209,12,${(.7 * electricCharged).toFixed(3)})`;
    const alpha = Number.isFinite(options.alpha) ? options.alpha : 1;
    const eyesVisible = !options.blink && !['hurt', 'impact', 'power', 'petting', 'pleased', 'chewing', 'anticipating', 'savoring'].includes(options.emotion);
    const x = options.x;
    const y = options.y;
    const radius = options.radius;
    const originalAfterLayer = options.afterLayer;
    const originalBodyPaint = options.bodyPaint;

    drawElectricAura(target, x, y, radius, electricCharged * (1 - hybrid) * alpha, false);

    if (hybrid < .999) {
      drawSlimeAvatar(target, {
        ...options,
        colors: options.colors,
        alpha: alpha * (1 - hybrid),
        bodyTint: dominantTint,
        bodyPaint: originalBodyPaint,
        afterLayer: (layerTarget, state) => {
          if (typeof originalAfterLayer === 'function') originalAfterLayer(layerTarget, state);
          drawFrostRim(layerTarget, state.radius, frostDominant);
          drawColdFace(layerTarget, state.radius, frostAmount, timestamp);
          drawSnowCap(layerTarget, state.radius, frostDominant, timestamp);
          drawLightningMark(layerTarget, state.radius, electricMarked);
          drawFireTip(layerTarget, 0, 0, state.radius, Math.min(fireLevel, 2), timestamp);
          if (eyesVisible) drawFireEyes(layerTarget, 0, 0, state.radius, Math.min(fireLevel, 2), timestamp, 1, state.cuteV2);
        }
      });
      drawSnowfall(target, x, y, radius, frostDominant * (1 - hybrid) * alpha, timestamp);
      drawElectricSparks(target, x, y, radius, electricCharged * (1 - hybrid) * alpha, timestamp, false);
    }

    if (hybrid > .001) {
      const activePulse = electricActive * (.9 + Math.sin(timestamp / 76) * .1);
      const energyRadius = radius * (.82 + activePulse * .42 + electricFlash * .2);
      if (hybridForm === 'electric' && (electricActive > .01 || electricFlash > .01)) {
        const activeGlow = target.createRadialGradient(x, y, radius * .18, x, y, energyRadius * 1.48);
        activeGlow.addColorStop(0, `rgba(235,255,255,${(.24 + electricFlash * .44) * hybrid * alpha})`);
        activeGlow.addColorStop(.36, `rgba(55,220,255,${(.22 + activePulse * .16) * hybrid * alpha})`);
        activeGlow.addColorStop(1, 'rgba(25,109,255,0)');
        target.save(); target.globalCompositeOperation = 'screen'; target.fillStyle = activeGlow;
        target.beginPath(); target.arc(x, y, energyRadius * 1.48, 0, Math.PI * 2); target.fill(); target.restore();
        drawElectricAura(target, x, y, energyRadius, hybrid * alpha * activePulse, true);
      }
      drawUltraFormAccents(target, x, y, radius, hybridForm, hybrid * (.48 + finalBoost * .52) * alpha, timestamp);
      drawSlimeAvatar(target, {
        ...options,
        colors: options.colors,
        alpha: alpha * hybrid,
        bodyPaint: null,
        bodyTint: '',
        bodyHighlight: false,
        bodyVariant: hybridForm,
        irisTint: ULTRA_FORM_IRIS_TINT[hybridForm] || ''
      });
      if (hybridForm === 'electric' && electricActive > .01) {
        drawEnergyTendrils(target, x, y, energyRadius, hybrid * alpha * activePulse, timestamp);
      }
    }
  }

  function prepareMenuSlimeCanvas() {
    const dpr = Math.min(isMobileDevice() ? 1 : isLowPowerDevice() ? 1.2 : 1.5, window.devicePixelRatio || 1);
    els.menuSlimeCanvas.width = Math.round(180 * dpr);
    els.menuSlimeCanvas.height = Math.round(180 * dpr);
    menuSlimeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    menuSlimeCtx.imageSmoothingEnabled = true;
  }

  function drawMenuSlime(timestamp) {
    menuSlimeCtx.clearRect(0, 0, 180, 180);
    const categoryVisual = updateMenuCategoryVisuals(timestamp);
    const emotion = menuSlimeEmotion();
    const emotionTime = emotion === 'chewing' && menuChewStartedAt
      ? Math.max(0, timestamp - menuChewStartedAt)
      : 0;
    const blinkPhase = timestamp % 4700;
    const selected = skinById(save.selectedSkin);
    const baseRadius = 70;
    const radius = baseRadius * (1 + categoryVisual.mass * .1 + categoryVisual.gigantism * .035);
    const restingBottom = 157;
    const slimeY = restingBottom - radius * .98;
    drawElementalSlimeAvatar(menuSlimeCtx, {
      x: 90, y: slimeY, radius, emotion,
      skin: selected.id,
      colors: selected.colors,
      gazeX: menuGaze.x, gazeY: menuGaze.y,
      emotionTime,
      blink: emotion === 'focused' && blinkPhase > 4420 && blinkPhase < 4530,
      petPoint: els.slime.classList.contains('petting') ? menuPetPoint : null,
      timestamp
    }, categoryVisual, timestamp);
  }

  function menuSlimeFrame(timestamp) {
    if (!els.homeScreen.classList.contains('active') || document.body.classList.contains('ui-modal-open')) {
      menuSlimeAnimationId = 0;
      return;
    }
    menuSlimeAnimationId = requestAnimationFrame(menuSlimeFrame);
    const menuFrameInterval = isMobileDevice() ? 42 : isLowPowerDevice() ? 36 : 32;
    if (document.hidden || timestamp - menuSlimeLastFrame < menuFrameInterval) return;
    menuSlimeLastFrame = timestamp;
    drawMenuSlime(timestamp);
  }

  function startMenuSlimeLoop() {
    if (menuSlimeAnimationId) return;
    prepareMenuSlimeCanvas();
    drawMenuSlime(performance.now());
    menuSlimeAnimationId = requestAnimationFrame(menuSlimeFrame);
  }

  function drawActiveElementalAbility(timestamp, x, y, radius) {
    const type = run.elementalAbilityActive;
    if (!type || timestamp >= run.elementalAbilityUntil) return;
    const remaining = clamp((run.elementalAbilityUntil - timestamp) / (ELEMENTAL_ABILITY_DURATION_MS[type] || 1), 0, 1);
    ctx.save();
    if (type === 'frost') {
      ctx.strokeStyle = 'rgba(223,252,255,.86)';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#65d5ff';
      ctx.shadowBlur = 8;
      for (let flake = 0; flake < 5; flake += 1) {
        const angle = timestamp / 520 + flake * Math.PI * 2 / 5;
        const orbit = radius * (1.18 + (flake % 2) * .18);
        const px = x + Math.cos(angle) * orbit;
        const py = y + Math.sin(angle) * orbit;
        ctx.beginPath();
        ctx.moveTo(px - 3, py); ctx.lineTo(px + 3, py);
        ctx.moveTo(px, py - 3); ctx.lineTo(px, py + 3);
        ctx.stroke();
      }
    } else if (type === 'electric') {
      const elapsed = 1 - remaining;
      const pulse = .5 + Math.sin(timestamp / 62) * .5;
      const flash = clamp(1 - elapsed / .12, 0, 1);
      const auraRadius = radius * (1.42 + pulse * .12 + flash * .18);
      const aura = ctx.createRadialGradient(x, y, radius * .38, x, y, auraRadius);
      aura.addColorStop(0, `rgba(235,255,255,${.23 + pulse * .1 + flash * .22})`);
      aura.addColorStop(.48, `rgba(40,203,255,${.2 + pulse * .12})`);
      aura.addColorStop(1, 'rgba(20,123,255,0)');
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(x, y, auraRadius, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      for (let arc = 0; arc < 8; arc += 1) {
        const phase = (timestamp / (235 + arc * 13) + arc * .217) % 1;
        const life = phase < .62 ? Math.sin(phase / .62 * Math.PI) : 0;
        if (life < .04) continue;
        const angle = arc * 2.399 + Math.sin(arc * 5.17) * .2;
        const radialX = Math.cos(angle), radialY = Math.sin(angle);
        const tangentX = -radialY, tangentY = radialX;
        const start = radius * .72;
        const reach = radius * (1.22 + phase * .98 + (arc % 3) * .12);
        const bend = radius * (.1 + arc % 2 * .06);
        const points = [
          [x + radialX * start, y + radialY * start],
          [x + radialX * lerp(start, reach, .34) + tangentX * bend, y + radialY * lerp(start, reach, .34) + tangentY * bend],
          [x + radialX * lerp(start, reach, .68) - tangentX * bend * .72, y + radialY * lerp(start, reach, .68) - tangentY * bend * .72],
          [x + radialX * reach, y + radialY * reach]
        ];
        strokeElectricBolt(ctx, points, life * (.76 + pulse * .24), radius, true);
      }
    } else if (type === 'fire') {
      const duration = ELEMENTAL_ABILITY_DURATION_MS.fire || 5000;
      const elapsed = duration * (1 - remaining);
      const release = smoothFireVisual((duration - elapsed) / 720);
      const rage = smoothFireVisual(elapsed / 780) * release;
      const burst = clamp(1 - elapsed / 620, 0, 1);
      const sparkCount = 12 + Math.round(rage * 10);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let spark = 0; spark < sparkCount; spark += 1) {
        const cycle = timestamp / (430 - rage * 105 + spark % 4 * 31) + spark * .317;
        const phase = cycle - Math.floor(cycle);
        const life = Math.sin(phase * Math.PI) * release;
        if (life < .05) continue;
        const angle = spark * 2.399 + Math.sin(spark * 4.17) * .2;
        const start = radius * (1.02 + rage * .22);
        const travel = radius * (.34 + rage * .72) * phase;
        const sx = x + Math.cos(angle) * (start + travel);
        const sy = y + Math.sin(angle) * (start + travel) - phase * radius * (.16 + rage * .18);
        const length = radius * (.07 + rage * .1) * (1 - phase * .45);
        ctx.globalAlpha = life * (.48 + rage * .48);
        ctx.strokeStyle = spark % 3 === 0 ? '#fff6a2' : spark % 2 ? '#ffc02d' : '#ff6a1d';
        ctx.lineWidth = spark % 3 === 0 ? 2.3 : 1.7;
        ctx.shadowColor = '#ff4b18';
        ctx.shadowBlur = 7 + rage * 8;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - Math.cos(angle) * length, sy - Math.sin(angle) * length);
        ctx.stroke();
      }
      if (burst > .01) {
        const progress = 1 - burst;
        for (let spark = 0; spark < 18; spark += 1) {
          const angle = spark * Math.PI * 2 / 18 + Math.sin(spark * 7.7) * .11;
          const distance = radius * (1.02 + progress * (1.1 + spark % 3 * .18));
          const length = radius * (.2 + burst * .18);
          ctx.globalAlpha = Math.sin(progress * Math.PI) * (.68 + spark % 3 * .1);
          ctx.strokeStyle = spark % 4 === 0 ? '#fffbd0' : spark % 2 ? '#ffd33e' : '#ff7520';
          ctx.lineWidth = spark % 4 === 0 ? 3 : 2;
          ctx.shadowColor = '#ff4a16';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
          ctx.lineTo(x + Math.cos(angle) * (distance + length), y + Math.sin(angle) * (distance + length));
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    } else if (type === 'wind') {
      const elapsed = 1 - remaining;
      const appear = Math.min(1, elapsed * 8);
      const fade = Math.min(1, remaining * 7);
      const visibility = appear * fade;
      const pulse = .5 + Math.sin(timestamp / 78) * .5;
      const direction = Math.atan2(run.slime.vy, run.slime.vx);
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';

      const glow = ctx.createRadialGradient(x, y, radius * .35, x, y, radius * 1.72);
      glow.addColorStop(0, `rgba(222,255,255,${.16 * visibility})`);
      glow.addColorStop(.48, `rgba(69,222,235,${(.13 + pulse * .05) * visibility})`);
      glow.addColorStop(1, 'rgba(22,174,203,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(x, y, radius * 1.72, radius * 1.58, direction, 0, Math.PI * 2);
      ctx.fill();

      for (let band = 0; band < 7; band += 1) {
        const centered = band - 3;
        const vertical = centered * radius * .24;
        const bandWidth = radius * (1.42 - Math.abs(centered) * .095 + pulse * .045);
        const spin = timestamp / (185 + band * 17) * (band % 2 ? -1 : 1) + band * .92;
        ctx.globalAlpha = visibility * (.46 + (band % 3) * .12);
        ctx.strokeStyle = band % 3 === 0 ? '#f2ffff' : band % 2 ? '#75eff5' : '#36cddd';
        ctx.lineWidth = 2.4 + (3 - Math.abs(centered)) * .32;
        ctx.shadowColor = '#27c7df';
        ctx.shadowBlur = 7 + pulse * 5;
        ctx.beginPath();
        ctx.ellipse(x, y + vertical, bandWidth, radius * (.22 + band * .008), spin * .045, spin, spin + Math.PI * 1.36);
        ctx.stroke();
      }

      for (let mote = 0; mote < 12; mote += 1) {
        const phase = (timestamp / (350 + mote * 15) + mote * .173) % 1;
        const angle = mote * 2.399 + phase * 5.4;
        const orbit = radius * (.82 + phase * .72);
        const py = y + Math.sin(angle) * orbit * .72 + (phase - .5) * radius * .9;
        ctx.globalAlpha = visibility * Math.sin(phase * Math.PI) * .78;
        ctx.fillStyle = mote % 4 === 0 ? '#ffffff' : '#8ef8ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * orbit, py, 1.35 + (mote % 3) * .55, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    } else if (type === 'gigantism') {
      const elapsed = 1 - remaining;
      const pulse = .5 + Math.sin(timestamp / 82) * .5;
      ctx.globalCompositeOperation = 'lighter';
      const aura = ctx.createRadialGradient(x, y, radius * .68, x, y, radius * (1.2 + pulse * .035));
      aura.addColorStop(0, 'rgba(210,255,126,0)');
      aura.addColorStop(.72, `rgba(92,238,75,${.12 + pulse * .08})`);
      aura.addColorStop(1, 'rgba(34,190,68,0)');
      ctx.fillStyle = aura;
      ctx.beginPath(); ctx.arc(x, y, radius * 1.22, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = .45 + pulse * .24;
      ctx.strokeStyle = '#caff6a';
      ctx.lineWidth = 3.2;
      ctx.shadowColor = '#3be35b';
      ctx.shadowBlur = 13;
      ctx.beginPath();
      ctx.arc(x, y, radius * (1.025 + pulse * .018), elapsed * .28, elapsed * .28 + Math.PI * 1.72);
      ctx.stroke();
      for (let bubble = 0; bubble < 8; bubble += 1) {
        const phase = (timestamp / (460 + bubble * 23) + bubble * .181) % 1;
        const angle = bubble * 2.399;
        const orbit = radius * (.78 + phase * .42);
        ctx.globalAlpha = Math.sin(phase * Math.PI) * .55;
        ctx.fillStyle = bubble % 2 ? '#9cff64' : '#efffa1';
        ctx.beginPath(); ctx.arc(x + Math.cos(angle) * orbit, y + Math.sin(angle) * orbit, 2 + phase * 3.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    } else if (type === 'cosmos') {
      const elapsed = 1 - remaining;
      const pulse = .5 + Math.sin(timestamp / 92) * .5;
      const coreRadius = radius * (.72 + pulse * .06);
      const fieldRadius = radius * (2.75 + pulse * .22);
      const field = ctx.createRadialGradient(x, y, coreRadius * .4, x, y, fieldRadius);
      field.addColorStop(0, 'rgba(3,2,14,.96)');
      field.addColorStop(.2, `rgba(53,22,116,${.72 + pulse * .12})`);
      field.addColorStop(.48, 'rgba(89,62,214,.25)');
      field.addColorStop(1, 'rgba(33,20,112,0)');
      ctx.fillStyle = field;
      ctx.beginPath(); ctx.arc(x, y, fieldRadius, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let ring = 0; ring < 3; ring += 1) {
        const ringRadius = radius * (1.02 + ring * .38 + pulse * .035);
        const start = timestamp / (330 + ring * 95) * (ring % 2 ? -1 : 1) + ring * 1.7;
        ctx.globalAlpha = (.42 - ring * .07) * Math.min(1, remaining * 4);
        ctx.strokeStyle = ring === 1 ? '#78dfff' : ring === 2 ? '#a06cff' : '#f0eaff';
        ctx.lineWidth = 3.5 - ring * .65;
        ctx.shadowColor = ring === 1 ? '#2a9dff' : '#793fff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(x, y, ringRadius * 1.28, ringRadius * .58, start * .08, start, start + Math.PI * (1.2 + ring * .16));
        ctx.stroke();
      }
      for (let mote = 0; mote < 9; mote += 1) {
        const phase = (timestamp / (520 + mote * 17) + mote * .137) % 1;
        const angle = mote * 2.399 + phase * 3.2;
        const orbit = lerp(fieldRadius, coreRadius * .8, phase);
        ctx.globalAlpha = Math.sin(phase * Math.PI) * .8;
        ctx.fillStyle = mote % 3 ? '#83ddff' : '#e6c8ff';
        ctx.beginPath(); ctx.arc(x + Math.cos(angle) * orbit, y + Math.sin(angle) * orbit * .72, 1.5 + phase * 1.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = .82 + elapsed * .08;
      ctx.fillStyle = '#05020f';
      ctx.shadowColor = '#8a58ff';
      ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(x, y, coreRadius, 0, Math.PI * 2); ctx.fill();
    } else if (type === 'gold') {
      const pulse = .5 + Math.sin(timestamp / 90) * .5;
      ctx.globalAlpha = .8 + remaining * .2;
      ctx.strokeStyle = '#ffe66b';
      ctx.fillStyle = 'rgba(255,194,31,.16)';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffb319';
      ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(x, y, radius * (1.28 + pulse * .08), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let spark = 0; spark < 7; spark += 1) {
        const angle = timestamp / 520 + spark * Math.PI * 2 / 7;
        const orbit = radius * (1.35 + (spark % 2) * .22);
        ctx.fillStyle = spark % 2 ? '#fff5ae' : '#ffc31f';
        ctx.fillRect(x + Math.cos(angle) * orbit - 2, y + Math.sin(angle) * orbit - 2, 4, 4);
      }
    } else if (type === 'explosion') {
      const pulse = .5 + Math.sin(timestamp / 62) * .5;
      ctx.globalAlpha = .72 + pulse * .2;
      ctx.strokeStyle = '#ffd95a';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ff4a22';
      ctx.shadowBlur = 15;
      for (let ring = 0; ring < 2; ring += 1) {
        ctx.beginPath(); ctx.arc(x, y, radius * (1.18 + ring * .3 + pulse * .08), timestamp / 180 + ring, timestamp / 180 + ring + Math.PI * 1.4); ctx.stroke();
      }
    } else if (type === 'mass') {
      const pulse = .5 + Math.sin(timestamp / 80) * .5;
      ctx.globalAlpha = .72;
      ctx.strokeStyle = '#d9ecff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#7296bd';
      ctx.shadowBlur = 11;
      ctx.beginPath(); ctx.arc(x, y, radius * (1.05 + pulse * .025), 0, Math.PI * 2); ctx.stroke();
      for (let streak = -1; streak <= 1; streak += 1) {
        const sx = x + streak * radius * .58;
        ctx.beginPath(); ctx.moveTo(sx, y - radius * 1.9); ctx.lineTo(sx, y - radius * 1.18); ctx.stroke();
      }
    } else if (type === 'mobility') {
      ctx.globalAlpha = .38;
      ctx.strokeStyle = '#a7f6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 8]);
      ctx.lineDashOffset = -timestamp / 35;
      ctx.beginPath(); ctx.arc(x, y, radius * 1.14, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWindMotionVisual(timestamp, x, y, radius, speed, front = false) {
    const level = elementalLevel('wind');
    if (level < 1 || run.portalEntry || windTornadoActive(timestamp)) return;
    const flash = timestamp < (run.windBounceFlashUntil || 0)
      ? clamp((run.windBounceFlashUntil - timestamp) / 360, 0, 1)
      : 0;
    const dash = windDashActive(timestamp);
    const strength = Math.max(flash * .72, clamp((speed - 155) / 245, 0, 1), dash ? 1 : 0);
    if (strength < .04) return;
    const velocity = Math.max(1, Math.hypot(run.slime.vx, run.slime.vy));
    const dx = run.slime.vx / velocity;
    const dy = run.slime.vy / velocity;
    const tx = -dy;
    const ty = dx;
    const tail = radius * (.55 + strength * (dash ? 2.3 : 1.25));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    if (!front) {
      for (let streak = 0; streak < (dash ? 9 : 5); streak += 1) {
        const side = streak - (dash ? 4 : 2);
        const spread = side * radius * .19;
        const wobble = Math.sin(timestamp / 75 + streak * 1.7) * radius * .08;
        const startX = x + tx * spread - dx * radius * .35;
        const startY = y + ty * spread - dy * radius * .35;
        ctx.globalAlpha = strength * (.26 + (streak % 3) * .1);
        ctx.strokeStyle = streak % 3 ? '#75eafa' : '#eaffff';
        ctx.lineWidth = dash ? 3.2 : 2;
        ctx.shadowColor = '#2bcbe6';
        ctx.shadowBlur = dash ? 11 : 6;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX - dx * tail * .5 + tx * wobble, startY - dy * tail * .5 + ty * wobble, startX - dx * tail, startY - dy * tail);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = strength * (dash ? .72 : .38);
      ctx.strokeStyle = dash ? '#eaffff' : '#8eeefa';
      ctx.lineWidth = dash ? 4.2 : 2.4;
      ctx.shadowColor = '#22cde9';
      ctx.shadowBlur = dash ? 14 : 7;
      const angle = Math.atan2(dy, dx);
      ctx.beginPath();
      ctx.arc(x, y, radius * (1.04 + strength * .08), angle - Math.PI * .62, angle + Math.PI * .62);
      ctx.stroke();
    }
    ctx.restore();
  }

  function cosmosCometVisualStrength(timestamp) {
    if (!run || elementalLevel('cosmos') < 2 || run.portalEntry) return 0;
    if (cosmosBoostActive()) return 1;
    if (timestamp < (run.cosmosCometFadeUntil || 0)) {
      return clamp((run.cosmosCometFadeUntil - timestamp) / 420, 0, 1);
    }
    return clamp(run.cosmosCometCharge || 0, 0, 1);
  }

  function drawCosmosCometVisual(timestamp, x, y, radius, front = false) {
    const strength = cosmosCometVisualStrength(timestamp);
    if (strength <= .01) return;
    const active = cosmosBoostActive();
    const ignition = run.cosmosCometIgnitedAt
      ? clamp(1 - (timestamp - run.cosmosCometIgnitedAt) / 520, 0, 1)
      : 0;
    const pulse = .5 + Math.sin(timestamp / 72) * .5;
    const wakeLength = radius * (.45 + strength * 1.72 + (active ? .78 + pulse * .2 : 0));
    const wakeWidth = radius * (.55 + strength * .32 + (active ? .12 : 0));

    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    if (!front) {
      const glowRadius = radius * (1.12 + strength * .78 + ignition * .3);
      const glow = ctx.createRadialGradient(0, radius * .24, radius * .12, 0, radius * .2, glowRadius);
      glow.addColorStop(0, `rgba(250,235,255,${.12 + strength * .18})`);
      glow.addColorStop(.42, `rgba(174,75,255,${.1 + strength * .23})`);
      glow.addColorStop(1, 'rgba(78,25,196,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0, radius * .2, glowRadius, 0, Math.PI * 2); ctx.fill();

      const flame = ctx.createLinearGradient(0, radius * .88, 0, -wakeLength);
      flame.addColorStop(0, `rgba(255,244,255,${.66 + strength * .3})`);
      flame.addColorStop(.22, `rgba(226,120,255,${.58 + strength * .34})`);
      flame.addColorStop(.6, `rgba(121,42,255,${.4 + strength * .28})`);
      flame.addColorStop(1, 'rgba(46,16,155,0)');
      ctx.fillStyle = flame;
      ctx.shadowColor = '#9d45ff';
      ctx.shadowBlur = 13 + strength * 16;
      const sway = Math.sin(timestamp / 64) * radius * .09;
      ctx.beginPath();
      ctx.moveTo(-radius * .84, radius * .34);
      ctx.bezierCurveTo(-radius * 1.02, -radius * .08, -wakeWidth * .72, -wakeLength * .62, sway, -wakeLength);
      ctx.bezierCurveTo(wakeWidth * .72, -wakeLength * .62, radius * 1.02, -radius * .08, radius * .84, radius * .34);
      ctx.quadraticCurveTo(0, radius * 1.04, -radius * .84, radius * .34);
      ctx.closePath();
      ctx.fill();

      const inner = ctx.createLinearGradient(0, radius * .72, 0, -wakeLength * .74);
      inner.addColorStop(0, `rgba(255,255,255,${.58 + strength * .38})`);
      inner.addColorStop(.28, `rgba(238,173,255,${.5 + strength * .34})`);
      inner.addColorStop(1, 'rgba(128,54,255,0)');
      ctx.fillStyle = inner;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(-radius * .48, radius * .5);
      ctx.bezierCurveTo(-radius * .56, -radius * .06, -radius * .24 + sway * .35, -wakeLength * .5, sway * .38, -wakeLength * .75);
      ctx.bezierCurveTo(radius * .28 + sway * .35, -wakeLength * .48, radius * .58, -.02 * radius, radius * .48, radius * .5);
      ctx.quadraticCurveTo(0, radius * .78, -radius * .48, radius * .5);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = .36 + strength * .38;
      ctx.strokeStyle = '#bc66ff';
      ctx.lineWidth = 2 + strength * 2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * radius * .82, radius * .28);
        ctx.bezierCurveTo(side * radius * 1.04, -radius * .25, side * wakeWidth * .82, -wakeLength * .55, sway, -wakeLength * .94);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = .42 + strength * .56;
      ctx.strokeStyle = active ? '#fff4ff' : '#dfadff';
      ctx.lineWidth = 3 + strength * 3.6;
      ctx.shadowColor = '#922fff';
      ctx.shadowBlur = 12 + strength * 18;
      ctx.beginPath();
      ctx.arc(0, 0, radius * (1.03 + strength * .055), Math.PI * .04, Math.PI * .96);
      ctx.stroke();
      ctx.globalAlpha = .22 + strength * .42;
      ctx.strokeStyle = '#9e42ff';
      ctx.lineWidth = 2 + strength * 1.5;
      ctx.beginPath();
      ctx.arc(0, radius * .04, radius * (1.18 + strength * .08), Math.PI * .12, Math.PI * .88);
      ctx.stroke();

      const sparks = active ? 12 : 7;
      for (let index = 0; index < sparks; index += 1) {
        const phase = (timestamp / (310 + index * 13) + index * .173) % 1;
        const side = index % 2 ? 1 : -1;
        const sparkY = radius * .36 - phase * (wakeLength + radius * .12);
        const sparkX = side * radius * (.42 + (index % 3) * .2) * (1 - phase * .58) + Math.sin(timestamp / 90 + index * 2.4) * 3;
        ctx.globalAlpha = (1 - phase) * (.35 + strength * .65);
        ctx.fillStyle = index % 3 ? '#c86bff' : '#fff4ff';
        ctx.beginPath(); ctx.arc(sparkX, sparkY, 1.3 + strength * 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
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
    const launchActive = run.launchEntryStartedAt > 0 && timestamp < run.launchEntryUntil;
    const launchProgress = launchActive
      ? clamp((timestamp - run.launchEntryStartedAt) / Math.max(1, run.launchEntryUntil - run.launchEntryStartedAt), 0, 1)
      : 1;
    const emergeProgress = clamp(launchProgress / .2, 0, 1);
    const emergeEase = 1 - Math.pow(1 - emergeProgress, 2.7);
    const launchScale = launchActive ? .14 + emergeEase * .86 : 1;
    const launchAlpha = launchActive ? clamp(launchProgress / .055, 0, 1) : 1;
    if (run.portalEntry && portalScale <= .01) return;
    const speed = Math.hypot(s.vx, s.vy);
    const stretch = clamp(s.vy / 900, -.22, .3);
    const bounceSquash = clamp(Math.sin(s.wobble) * .025 + Math.abs(s.vx) / 1700, 0, .12);
    const scaleX = frozen ? 1 : 1 - stretch * .42 + bounceSquash;
    const scaleY = frozen ? 1 : 1 + stretch - bounceSquash * .55;
    const gigantismInflateProgress = gigantismActive(timestamp)
      ? clamp((timestamp - (run.gigantismStartedAt || timestamp)) / 245, 0, 1)
      : 1;
    const gigantismInflateSquash = gigantismInflateProgress < 1
      ? Math.sin(gigantismInflateProgress * Math.PI) * .13
      : 0;
    const gigantismDeflateProgress = timestamp < (run.gigantismDeflateUntil || 0)
      ? clamp((timestamp - run.gigantismDeflateStartedAt) / Math.max(1, run.gigantismDeflateUntil - run.gigantismDeflateStartedAt), 0, 1)
      : 1;
    const gigantismDeflateWobble = gigantismDeflateProgress < 1
      ? Math.sin(gigantismDeflateProgress * Math.PI * 5) * (1 - gigantismDeflateProgress) * .12
      : 0;
    const radius = s.radius;
    const emotion = frozen
      ? run.frozenEmotion
      : timestamp < run.emotionUntil
      ? run.emotion
      : run.barrier > 0
        ? 'focused'
        : s.vy < -35
          ? 'surprised'
          : speed > 245
            ? 'joy'
            : 'focused';

    if (run.barrier > 0) {
      ctx.save();
      const barrierPulse = timestamp < (run.barrierFlashUntil || 0) ? .13 : .05;
      ctx.globalAlpha = .18 + Math.sin(timestamp / 115) * .035 + barrierPulse;
      const barrierGlow = ctx.createRadialGradient(s.x, screenY, radius * .72, s.x, screenY, radius + 19);
      barrierGlow.addColorStop(0, 'rgba(111,211,255,.05)');
      barrierGlow.addColorStop(.72, 'rgba(91,193,255,.22)');
      barrierGlow.addColorStop(1, 'rgba(59,142,233,0)');
      ctx.fillStyle = barrierGlow;
      ctx.beginPath();
      ctx.arc(s.x, screenY, radius + 19, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = .75;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#9ee8ff';
      ctx.beginPath();
      ctx.arc(s.x, screenY, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
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

    if (launchActive && launchProgress < .46) {
      const launchPalette = {
        1: ['101,240,176', '220,255,173'],
        2: ['101,231,255', '230,253,255'],
        3: ['255,130,202', '255,240,182'],
        4: ['255,121,63', '255,211,107']
      }[run.worldId] || ['101,240,176', '220,255,173'];
      const glowStrength = 1 - launchProgress / .46;
      const launchGlow = ctx.createRadialGradient(s.x, screenY, radius * .08, s.x, screenY, radius * 2.15);
      launchGlow.addColorStop(0, `rgba(${launchPalette[1]},${.34 * glowStrength})`);
      launchGlow.addColorStop(.42, `rgba(${launchPalette[0]},${.26 * glowStrength})`);
      launchGlow.addColorStop(1, `rgba(${launchPalette[0]},0)`);
      ctx.save();
      ctx.fillStyle = launchGlow;
      ctx.beginPath();
      ctx.arc(s.x, screenY, radius * 2.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const avatarOptions = {
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
      scaleX: scaleX * (1 + gigantismInflateSquash + gigantismDeflateWobble) * portalScale * launchScale,
      scaleY: scaleY * (1 - gigantismInflateSquash * .45 - gigantismDeflateWobble * .6) * portalScale * launchScale,
      rotation: (frozen ? clamp(s.vx / 1600, -.09, .09) : clamp(s.vx / 850, -.24, .24)) + portalProgress * 1.8 + gigantismDeflateWobble * .22,
      alpha: (run.portalEntry ? Math.pow(1 - vanishProgress, .72) : 1) * launchAlpha,
      timestamp
    };
    const fireLevel = run.categoryVisuals?.fire || 0;
    const fireRadius = radius * portalScale * launchScale;
    const fireAbilityActive = run.elementalAbilityActive === 'fire' && timestamp < run.elementalAbilityUntil;
    const fireAbilityDuration = ELEMENTAL_ABILITY_DURATION_MS.fire || 5000;
    const fireAbilityRemaining = fireAbilityActive ? Math.max(0, run.elementalAbilityUntil - timestamp) : 0;
    const fireAbilityElapsed = fireAbilityActive ? fireAbilityDuration - fireAbilityRemaining : fireAbilityDuration;
    const electricAbilityActive = run.elementalAbilityActive === 'electric' && timestamp < run.elementalAbilityUntil;
    const electricAbilityDuration = ELEMENTAL_ABILITY_DURATION_MS.electric || 3000;
    const electricAbilityRemaining = electricAbilityActive ? Math.max(0, run.elementalAbilityUntil - timestamp) : 0;
    const electricAbilityElapsed = electricAbilityActive ? electricAbilityDuration - electricAbilityRemaining : electricAbilityDuration;
    const elementalVisuals = {
      ...run.categoryVisuals,
      fireActive: fireAbilityActive
        ? smoothFireVisual(fireAbilityElapsed / 780) * smoothFireVisual(fireAbilityRemaining / 720)
        : 0,
      fireFlash: fireAbilityActive ? clamp(1 - fireAbilityElapsed / 360, 0, 1) : 0,
      electricActive: electricAbilityActive
        ? smoothFireVisual(electricAbilityElapsed / 260) * smoothFireVisual(electricAbilityRemaining / 380)
        : 0,
      electricFlash: electricAbilityActive ? clamp(1 - electricAbilityElapsed / 280, 0, 1) : 0
    };
    if (!frozen) drawWindMotionVisual(timestamp, s.x, screenY, fireRadius, speed, false);
    if (!frozen) drawCosmosCometVisual(timestamp, s.x, screenY, fireRadius, false);
    drawElementalSlimeAvatar(ctx, avatarOptions, elementalVisuals, timestamp);
    if (!frozen) drawCosmosCometVisual(timestamp, s.x, screenY, fireRadius, true);
    if (!frozen) drawWindMotionVisual(timestamp, s.x, screenY, fireRadius, speed, true);
    drawActiveElementalAbility(timestamp, s.x, screenY, fireRadius);
    if (!run.portalEntry && timestamp < (run.gravitySwitchFlashUntil || 0)) {
      const progress = clamp((run.gravitySwitchFlashUntil - timestamp) / 620, 0, 1);
      const direction = run.gravityDirection < 0 ? -1 : 1;
      ctx.save();
      ctx.globalAlpha = Math.min(1, progress * 2.6);
      ctx.translate(s.x, screenY + direction * (radius + 21));
      ctx.fillStyle = '#fff7ff';
      ctx.strokeStyle = '#8b2ad4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#e771ff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, direction * 11);
      ctx.lineTo(-7, direction * 2);
      ctx.lineTo(-3, direction * 2);
      ctx.lineTo(-3, direction * -9);
      ctx.lineTo(3, direction * -9);
      ctx.lineTo(3, direction * 2);
      ctx.lineTo(7, direction * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

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

  function impact() {}

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

  function continueEndlessWorld() {
    if (!run || run.ended) return;
    const completedLap = run.endlessLap;
    const segmentDepth = run.world.targetDepth;
    run.endlessDepthOffset += segmentDepth;
    run.endlessLap += 1;
    run.world.endlessScale = 1 + Math.min(.9, (run.endlessLap - 1) * .1);
    run.health = Math.min(run.maxHealth, run.health + Math.max(1, Math.ceil(run.maxHealth * .12)));
    run.portalEntry = null;
    run.portalTransitioning = false;
    run.blocks = generateBlockField(run);
    indexRunBlocks();
    run.honeyZones = generateHoneyZones(run);
    run.jellyZones = generateJellyZones(run);
    run.freezeZones = generateFreezeZones(run);
    run.inJellyZoneId = '';
    run.jellyEnteredAt = 0;
    run.lastJellyBubbleAt = 0;
    run.inFreezeZoneId = '';
    run.freezeZoneEnteredAt = 0;
    run.freezeZoneTriggeredId = '';
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
    run.wallPushSide = 0;
    run.wallReleaseX = 0;
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
    save.levelFailures[campaignAttemptKey(world.id, level)] = 0;
    save.worldBest[world.id] = Math.max(save.worldBest[world.id] || 0, world.targetDepth);
    if (level < LEVEL_COUNT) {
      save.unlockedLevels[world.id] = Math.max(save.unlockedLevels[world.id] || 1, level + 1);
      save.selectedLevels[world.id] = level + 1;
    } else {
      save.unlockedLevels[world.id] = LEVEL_COUNT;
      const unlockedSkin = { 1: 'cat', 3: 'dumpling' }[world.id];
      if (unlockedSkin && !save.unlockedSkins.includes(unlockedSkin)) save.unlockedSkins.push(unlockedSkin);
      const activeIndex = ACTIVE_WORLD_IDS.indexOf(world.id);
      const nextWorldId = ACTIVE_WORLD_IDS[activeIndex + 1];
      if (nextWorldId) {
        save.world = nextWorldId;
        save.selectedLevels[nextWorldId] = 1;
      }
    }
    run.isFinalCompletion = world.id === ACTIVE_WORLD_IDS[ACTIVE_WORLD_IDS.length - 1] && level === LEVEL_COUNT;
    if (run.isFinalCompletion) save.gameCompleted = true;
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

  function pulseResultResearchFlask() {
    if (!els.resultResearchFlask) return;
    els.resultResearchFlask.classList.remove('unit-earned');
    void els.resultResearchFlask.offsetWidth;
    els.resultResearchFlask.classList.add('unit-earned');
  }

  function animateResultResearch(data, startProgress, startUnits, token) {
    cancelAnimationFrame(resultResearchAnimationId);
    const totalData = Math.max(0, Math.floor(data));
    const duration = clamp(760 + totalData * 2.2, 880, 1900);
    const startedAt = performance.now();
    let lastUnits = startUnits;
    els.resultResearchStream?.classList.add('is-pouring');
    return new Promise(resolve => {
      const finish = () => {
        els.resultResearchStream?.classList.remove('is-pouring');
        resolve();
      };
      const step = timestamp => {
        if (token !== resultRevealToken || !run) return finish();
        const ratio = clamp((timestamp - startedAt) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - ratio, 3);
        const added = Math.round(totalData * eased);
        const absolute = startProgress + added;
        const units = startUnits + Math.floor(absolute / 100);
        const progress = absolute % 100;
        if (els.resultResearchData) els.resultResearchData.textContent = `+${added.toLocaleString('ru-RU')}`;
        if (els.resultResearchUnits) els.resultResearchUnits.textContent = formatCompactNumber(units);
        if (els.resultResearchProgress) els.resultResearchProgress.style.width = `${progress}%`;
        if (units !== lastUnits) {
          lastUnits = units;
          pulseResultResearchFlask();
          sound('coin');
          feedback([4, 8, 4]);
        }
        if (ratio < 1) resultResearchAnimationId = requestAnimationFrame(step);
        else finish();
      };
      resultResearchAnimationId = requestAnimationFrame(step);
    });
  }

  async function revealResultSummary(researchData, coins, token) {
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const modal = els.resultOverlay.querySelector('.result-modal');
    const researchStat = els.resultResearchData?.closest('.result-stat');
    const coinsStat = els.resultCoins.closest('.result-stat');
    if (!reducedMotion) await new Promise(resolve => setTimeout(resolve, 330));
    if (token !== resultRevealToken || !run) return;

    researchStat?.classList.add('is-counting');
    if (reducedMotion) {
      els.resultResearchData.textContent = `+${researchData.toLocaleString('ru-RU')}`;
      els.resultResearchUnits.textContent = formatCompactNumber(run.researchUnitsAfter);
      els.resultResearchProgress.style.width = `${run.researchProgressAfter}%`;
    } else {
      await animateResultResearch(researchData, run.researchProgressBefore, run.researchUnitsBefore, token);
    }
    if (token !== resultRevealToken || !run) return;
    researchStat?.classList.remove('is-counting');
    researchStat?.classList.add('is-complete');
    feedback(5);

    if (!reducedMotion) await new Promise(resolve => setTimeout(resolve, 120));
    if (token !== resultRevealToken || !run) return;
    researchStat?.classList.remove('is-complete');
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
    yandexPlatform?.gameplay.stop();
    clearFallSteering();
    cancelAnimationFrame(run.animationId);
    save.totalRuns += 1;
    save.bestDepth = Math.max(save.bestDepth, run.maxDepth);
    if (run.endless) {
      run.endlessScore = calculateEndlessScore(run);
      save.endlessBestScore[run.worldId] = Math.max(save.endlessBestScore[run.worldId] || 0, run.endlessScore);
      save.endlessBestDepth[run.worldId] = Math.max(save.endlessBestDepth[run.worldId] || 0, Math.max(0, Math.floor(run.maxDepth)));
      save.endlessRuns[run.worldId] = Math.max(0, Math.floor(save.endlessRuns[run.worldId] || 0)) + 1;
    } else {
      if (!completed) registerCampaignFailure(run.worldId, run.level);
      save.worldBest[run.worldId] = Math.max(save.worldBest[run.worldId] || 0, Math.min(run.maxDepth, run.world.targetDepth));
      save.lastRunDepth[`${run.worldId}:${run.level}`] = Math.min(run.world.targetDepth, Math.max(0, Math.floor(run.maxDepth)));
    }
    const baseCoins = Math.max(0, Math.floor(run.coins));
    const researchData = Math.max(0, Math.floor(run.researchData || 0));
    run.researchUnitsBefore = save.researchUnits;
    run.researchProgressBefore = save.researchProgress;
    const researchTotal = save.researchProgress + researchData;
    save.researchUnits += Math.floor(researchTotal / 100);
    save.researchProgress = researchTotal % 100;
    run.researchUnitsAfter = save.researchUnits;
    run.researchProgressAfter = save.researchProgress;
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
    els.resultResearchData?.closest('.result-stat')?.classList.remove('is-counting', 'is-complete');
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
    els.resultResearchData.textContent = '+0';
    els.resultResearchUnits.textContent = formatCompactNumber(run.researchUnitsBefore);
    els.resultResearchProgress.style.width = `${run.researchProgressBefore}%`;
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
      revealResultSummary(researchData, baseCoins, revealToken);
    });
    if (!completed) sound('fail');
  }

  async function claimResultMultiplier() {
    if (!run || run.rewardClaimed || run.rewardPending || adInFlight) return;
    run.rewardPending = true;
    const multiplier = stopResultMeter();
    const totalCoins = Math.max(0, Math.round(run.awardedCoins * multiplier));
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
    cancelAnimationFrame(resultResearchAnimationId);
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
    if (type === 'recipes') renderRecipesPanel();
    if (type === 'encyclopedia') renderEncyclopediaPanel(save.world);
    els.panelOverlay.classList.remove('hidden');
    syncInteractionLayers();
    requestAnimationFrame(() => els.panelOverlay.querySelector('.modal')?.focus());
  }

  function laboratoryTabsMarkup() {
    return `<div class="laboratory-tabs" role="tablist" aria-label="Разделы лаборатории">
      <button class="laboratory-tab ${activeLaboratoryTab === 'mutations' ? 'active' : ''}" data-laboratory-tab="mutations" type="button" role="tab" aria-selected="${activeLaboratoryTab === 'mutations'}">
        <span class="laboratory-tab-mutations" aria-hidden="true">
          <img src="${versionedAsset(RECIPE_FAMILY_ICONS.ice)}" alt=""><img src="${versionedAsset(RECIPE_FAMILY_ICONS.fire)}" alt=""><img src="${versionedAsset(RECIPE_FAMILY_ICONS.electric)}" alt="">
        </span><b>МУТАЦИИ</b>
      </button>
      <button class="laboratory-tab ${activeLaboratoryTab === 'conveyor' ? 'active' : ''}" data-laboratory-tab="conveyor" type="button" role="tab" aria-selected="${activeLaboratoryTab === 'conveyor'}">
        <span class="laboratory-tab-conveyor" aria-hidden="true"><i></i><i></i><i></i></span><b>КОНВЕЙЕР</b>
      </button>
    </div>`;
  }

  function bindLaboratoryTabs() {
    $$('[data-laboratory-tab]').forEach(button => button.addEventListener('click', () => {
      const tab = button.dataset.laboratoryTab;
      if (!['mutations', 'conveyor'].includes(tab) || tab === activeLaboratoryTab) return;
      activeLaboratoryTab = tab;
      sound('tap');
      renderRecipesPanel();
    }));
  }

  function renderLaboratoryConveyorPanel() {
    const unlocked = new Set([...STARTER_MUTATIONS.map(item => item.id), ...(save.unlockedMutations || [])]);
    const pool = save.activeMutationPool || ['frost', 'fire', 'electric'];
    const pipes = pool.map((id, index) => {
      const mutation = mutationById(id);
      return `<button class="lab-feed-pipe mutation-${id} ${index === selectedConveyorSlot ? 'selected' : ''}" data-conveyor-slot="${index}" type="button" aria-label="${index + 1} дозатор: ${mutation?.name || 'пусто'}">
        <span class="lab-pipe-neck" aria-hidden="true"></span>
        <span class="lab-pipe-body"><span class="lab-pipe-emblem">${mutation ? `<img src="${versionedAsset(mutation.image)}" alt="">` : '<i>+</i>'}</span></span>
        <span class="lab-pipe-mouth" aria-hidden="true"></span>
      </button>`;
    }).join('');
    const slots = [...allMutations(), { id: 'future-1', future: true }, { id: 'future-2', future: true }].map(mutation => {
      const available = !mutation.future && unlocked.has(mutation.id);
      return `<button class="lab-pool-mutation mutation-${mutation.id} ${available ? 'available' : 'locked'} ${pool.includes(mutation.id) ? 'equipped' : ''}" ${available ? `data-pool-mutation="${mutation.id}"` : 'disabled'} type="button" aria-label="${available ? mutation.name : 'Неизвестная мутация'}">
        ${available ? `<img src="${versionedAsset(mutation.image)}" alt=""><b>${mutation.name}</b>` : '<i>?</i>'}
      </button>`;
    }).join('');
    els.panelContent.innerHTML = `<div class="laboratory-panel laboratory-conveyor-panel">
      ${laboratoryTabsMarkup()}
      <section class="food-synthesizer">
        <header><small>СИСТЕМА ПОДАЧИ</small><h3>ПИЩЕВОЙ СИНТЕЗАТОР</h3><p>Выбери дозатор, затем вставь в него мутацию.</p></header>
        <div class="lab-pipe-rack">${pipes}</div>
        <div class="lab-synth-base" aria-hidden="true"><i></i><i></i><i></i></div>
      </section>
      <div class="lab-pool-head"><b>ДОСТУПНЫЕ МУТАЦИИ</b><span>3 АКТИВНЫЕ</span></div>
      <div class="lab-mutation-pool">${slots}</div>
    </div>`;
    bindLaboratoryTabs();
    $$('[data-conveyor-slot]').forEach(button => button.addEventListener('click', () => {
      selectedConveyorSlot = clamp(Number(button.dataset.conveyorSlot), 0, 2);
      renderLaboratoryConveyorPanel();
    }));
    $$('[data-pool-mutation]').forEach(button => button.addEventListener('click', () => setActiveConveyorMutation(button.dataset.poolMutation)));
  }

  function setActiveConveyorMutation(id) {
    if (!mutationById(id)) return;
    const pool = [...(save.activeMutationPool || ['frost', 'fire', 'electric'])];
    const occupiedSlot = pool.indexOf(id);
    if (occupiedSlot === selectedConveyorSlot) return;
    if (occupiedSlot >= 0) [pool[selectedConveyorSlot], pool[occupiedSlot]] = [pool[occupiedSlot], pool[selectedConveyorSlot]];
    else pool[selectedConveyorSlot] = id;
    save.activeMutationPool = pool;
    laboratoryReplaceMode = false;
    persist();
    sound('tap');
    feedback(6);
    if (session && !stomachIsFull() && !session.offerTransition) {
      generateOffer({ resetRerolls: false });
      renderDraft({ offerMotion: 'enter' });
      void settleConveyorArrival(menuReducedMotion);
    }
    renderRecipesPanel();
    requestAnimationFrame(() => $(`[data-lab-mutation="${id}"]`)?.classList.add('just-changed'));
  }

  function renderRecipesPanel() {
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    $('#mutationPrize')?.remove();
    activeLaboratoryTab = 'mutations';

    const unlocked = new Set(save.unlockedMutations || []);
    const availableIds = new Set([...STARTER_MUTATIONS.map(item => item.id), ...unlocked]);
    if (!availableIds.has(selectedLaboratoryMutationId)) selectedLaboratoryMutationId = STARTER_MUTATIONS[0].id;
    const selectedMutation = mutationById(selectedLaboratoryMutationId) || STARTER_MUTATIONS[0];
    const selectedDetails = MUTATION_DETAILS[selectedMutation.id] || { stage1: 'Открывает базовый эффект мутации.', stage2: 'Усиливает эффект после второй порции.' };
    const activePool = save.activeMutationPool || ['frost', 'fire', 'electric'];
    const selectedIsActive = activePool.includes(selectedMutation.id);
    const allUnlocked = unlocked.size >= MUTATION_DISCOVERIES.length;
    const mutationCost = MUTATION_STEPS;
    const progress = allUnlocked ? mutationCost : Math.min(mutationCost, Math.max(0, save.mutationProgress));
    const readyToReveal = progress >= mutationCost && !allUnlocked;
    const remaining = Math.max(0, mutationCost - progress);
    const fillPercent = allUnlocked ? 100 : Math.min(100, progress / mutationCost * 100);
    const liquidFillPercent = allUnlocked ? 0 : fillPercent;
    const researchBalance = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);
    const collectionCapacity = 9;
    const visibleUnlockedCount = STARTER_MUTATIONS.length + unlocked.size;
    const futureMutations = Array.from({ length: Math.max(0, collectionCapacity - allMutations().length) }, (_, index) => ({ id: `future-${index + 1}`, future: true }));

    els.panelTitle.innerHTML = `<span>Лаборатория</span><span class="mutation-panel-balance" aria-label="${adminInfiniteResearch ? 'Бесконечные колбы исследования' : `Колбы исследования: ${save.researchUnits}`}"><img src="${versionedAsset('assets/ui/research-flask.png')}" alt=""><b id="mutationPanelBalance">${researchBalance}</b></span>`;

    const collection = [...allMutations(), ...futureMutations].map(mutation => {
      if (mutation.future) return `<button class="mutation-collection-slot future locked" type="button" disabled aria-label="Неизвестная будущая мутация"><i>?</i><b>???</b></button>`;
      const available = availableIds.has(mutation.id);
      const equipped = activePool.includes(mutation.id);
      const replaceTarget = laboratoryReplaceMode && equipped && mutation.id !== selectedMutation.id;
      return `<button class="mutation-collection-slot ${available ? 'unlocked' : 'locked'} ${selectedMutation.id === mutation.id ? 'selected' : ''} ${equipped ? 'equipped' : ''} ${replaceTarget ? 'replace-target' : ''}${mutation.name.length > 9 ? ' long-name' : ''}" type="button" ${available ? `data-lab-mutation="${mutation.id}"` : 'disabled'} aria-label="${available ? mutation.name : 'Неизвестная мутация'}">
        ${available ? `<img src="${versionedAsset(mutation.image)}" alt=""><b>${mutation.name}</b>${equipped ? '<em>АКТИВНА</em>' : ''}` : '<i>?</i><b>???</b>'}
      </button>`;
    }).join('');

    const reactorArcPaths = [
      '1,16 18,16 31,5 46,23 63,9 78,18 99,11',
      '1,13 15,13 28,23 43,7 58,17 73,4 99,15',
      '1,18 17,18 29,8 43,21 57,11 72,24 99,12',
      '1,11 16,11 30,20 46,6 60,22 78,10 99,17'
    ];
    const reactorEnergyArcs = Array.from({ length: 10 }, (_, index) => {
      const points = reactorArcPaths[index % reactorArcPaths.length];
      const glowId = `reactor-v2-glow-${index}`;
      const coreId = `reactor-v2-core-${index}`;
      return `<i><svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${glowId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#38e77e" stop-opacity="0"></stop><stop offset=".28" stop-color="#21ee72" stop-opacity=".62"></stop><stop offset=".62" stop-color="#13dd63"></stop><stop offset="1" stop-color="#66ff8d"></stop></linearGradient><linearGradient id="${coreId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#efffd3" stop-opacity="0"></stop><stop offset=".34" stop-color="#efffd3" stop-opacity=".72"></stop><stop offset="1" stop-color="#f8ffe7"></stop></linearGradient></defs><polyline class="reactor-bolt-glow" pathLength="100" points="${points}" style="stroke:url(#${glowId})"></polyline><polyline class="reactor-bolt-core" pathLength="100" points="${points}" style="stroke:url(#${coreId})"></polyline></svg></i>`;
    }).join('');

    const stageOneIcons = `<img src="${versionedAsset(selectedMutation.image)}" alt="">`;
    const stageTwoIcons = `${stageOneIcons}${stageOneIcons}`;
    const machineHint = allUnlocked
      ? 'ВСЕ МУТАЦИИ ОТКРЫТЫ'
      : readyToReveal
        ? 'РЕАКТОР ГОТОВ · НАЖМИ СИНТЕЗ'
        : adminInfiniteResearch || save.researchUnits > 0
          ? 'НАЖМИ ИЛИ УДЕРЖИВАЙ, ЧТОБЫ ДОБАВИТЬ КОЛБЫ'
          : 'НУЖНА КОЛБА ИССЛЕДОВАНИЯ';

    els.panelContent.innerHTML = `<div class="laboratory-panel mutation-lab-v2">
      <div class="mutation-main-grid">
        <section class="mutation-synth-pane" aria-label="Синтезатор мутаций">
          <header class="mutation-pane-title"><h3>СИНТЕЗАТОР</h3></header>
          <button id="mutationCapsuleBtn" class="mutation-capsule mutation-capsule-v2 ${allUnlocked ? 'is-complete' : ''} ${readyToReveal ? 'is-ready-to-synthesize' : ''}" type="button" ${allUnlocked || readyToReveal ? 'disabled' : ''} aria-label="${allUnlocked ? 'Все мутации открыты' : readyToReveal ? 'Реактор заполнен' : `Добавить одну колбу. Осталось ${remaining}`}">
            <span class="mutation-machine-visual" aria-hidden="true">
              <img class="mutation-machine-art" src="${versionedAsset('assets/ui/lab-synth-machine-v1.png')}" alt="">
              <span class="mutation-glass">
                <span id="mutationLiquid" class="mutation-liquid-chamber" style="--liquid-fill:${liquidFillPercent}%"><span class="mutation-liquid-sprite"></span><span class="mutation-liquid-bubbles"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>
                <span class="mutation-reactor-energy">${reactorEnergyArcs}</span>
                <span id="mutationImpact" class="mutation-impact"></span>
              </span>
              <span id="mutationInlet" class="mutation-inlet-target"></span>
              <span class="mutation-dispenser">
                <span class="mutation-dispenser-mouth"><span class="mutation-dispenser-flap"></span><span id="mutationMystery" class="mutation-mystery"><i>?</i></span></span>
                <span class="mutation-dispenser-tray"></span>
              </span>
            </span>
            <span id="mutationCapsuleHint" class="mutation-capsule-hint">${machineHint}</span>
          </button>
          <div class="mutation-synth-progress" role="progressbar" aria-label="Прогресс синтеза" aria-valuemin="0" aria-valuemax="${mutationCost}" aria-valuenow="${progress}">
            <span class="mutation-synth-progress-fill" style="width:${fillPercent}%"></span>
          </div>
          <div class="mutation-synth-controls">
            <span class="mutation-synth-balance"><img src="${versionedAsset('assets/ui/research-flask.png')}" alt=""><span><small>ОСТАЛОСЬ</small><b id="mutationRemaining">${allUnlocked ? 0 : remaining}</b></span></span>
            <button id="mutationSynthesizeBtn" class="mutation-synthesize-btn ${readyToReveal ? 'ready' : ''}" type="button" ${readyToReveal ? '' : 'disabled'}><span>СИНТЕЗ</span></button>
          </div>
        </section>

        <section class="mutation-info-pane mutation-family-${selectedMutation.id}" aria-label="Информация о мутации ${selectedMutation.name}">
          <span class="mutation-info-emblem">${mutationElementFxMarkup(selectedMutation.id, 'mutation-info-fx')}<img src="${versionedAsset(selectedMutation.image)}" alt=""></span>
          <h3>${selectedMutation.name}</h3>
          <div class="mutation-stage-list">
            <article><span class="mutation-stage-number">1</span><span class="mutation-stage-icons">${stageOneIcons}</span><p>${selectedDetails.stage1}</p></article>
            <article><span class="mutation-stage-number">2</span><span class="mutation-stage-icons">${stageTwoIcons}</span><p>${selectedDetails.stage2}</p></article>
          </div>
          <button id="mutationChooseBtn" class="mutation-choose-btn" type="button" ${selectedIsActive ? 'disabled' : ''}>${selectedIsActive ? 'УЖЕ ВЫБРАНО' : laboratoryReplaceMode ? 'ОТМЕНИТЬ' : 'ВЫБРАТЬ'}</button>
          <p id="mutationReplaceHint" class="mutation-replace-hint ${laboratoryReplaceMode ? 'visible' : ''}">${laboratoryReplaceMode ? 'Нажми на мигающую активную мутацию снизу, чтобы заменить её.' : 'Выбранные мутации появляются в воронках конвейера.'}</p>
        </section>
      </div>
      <div class="mutation-collection-head"><b>МУТАЦИИ</b><span>${visibleUnlockedCount}/${collectionCapacity}</span></div>
      <div id="mutationCollection" class="mutation-collection mutation-collection-v2">${collection}</div>
    </div>`;

    const capsuleButton = $('#mutationCapsuleBtn');
    capsuleButton?.addEventListener('click', handleMutationCapsuleClick);
    capsuleButton?.addEventListener('pointerdown', startMutationFeedHold);
    capsuleButton?.addEventListener('pointerup', stopMutationFeedHold);
    capsuleButton?.addEventListener('pointercancel', stopMutationFeedHold);
    capsuleButton?.addEventListener('lostpointercapture', stopMutationFeedHold);
    $('#mutationSynthesizeBtn')?.addEventListener('click', () => startMutationSynthesis(capsuleButton));
    $('#mutationChooseBtn')?.addEventListener('click', () => {
      laboratoryReplaceMode = !laboratoryReplaceMode;
      sound('tap');
      renderRecipesPanel();
    });
    $$('[data-lab-mutation]').forEach(button => button.addEventListener('click', () => {
      const id = button.dataset.labMutation;
      if (laboratoryReplaceMode) {
        const slot = activePool.indexOf(id);
        if (slot >= 0 && id !== selectedLaboratoryMutationId) {
          selectedConveyorSlot = slot;
          setActiveConveyorMutation(selectedLaboratoryMutationId);
        } else {
          showToast('Выбери одну из мигающих активных мутаций');
          feedback(4);
        }
        return;
      }
      selectedLaboratoryMutationId = id;
      sound('tap');
      renderRecipesPanel();
    }));
  }

  function startMutationSynthesis(button) {
    if (!button || mutationAnimating || save.mutationProgress < currentMutationCost()) return;
    const synthButton = $('#mutationSynthesizeBtn');
    mutationAnimating = true;
    button.disabled = true;
    if (synthButton) synthButton.disabled = true;
    revealRandomMutation(mutationAnimationToken, button);
  }

  function renderRecipesPanelLegacy() {
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    $('#mutationPrize')?.remove();
    const researchBalance = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);
    els.panelTitle.innerHTML = `<span>Лаборатория</span><span class="mutation-panel-balance" aria-label="${adminInfiniteResearch ? 'Бесконечные колбы исследования' : `Колбы исследования: ${save.researchUnits}`}"><img src="${versionedAsset('assets/ui/research-flask.png')}" alt=""><b id="mutationPanelBalance">${researchBalance}</b></span>`;
    if (activeLaboratoryTab === 'conveyor') {
      renderLaboratoryConveyorPanel();
      return;
    }
    const unlocked = new Set(save.unlockedMutations || []);
    const allUnlocked = unlocked.size >= MUTATION_DISCOVERIES.length;
    const mutationCost = MUTATION_STEPS * (unlocked.size + 1);
    const readyToReveal = save.mutationProgress >= mutationCost && !allUnlocked;
    const remaining = Math.max(0, mutationCost - save.mutationProgress);
    const collectionCapacity = 9;
    const visibleUnlockedCount = STARTER_MUTATIONS.length + unlocked.size;
    const futureMutations = Array.from({ length: Math.max(0, collectionCapacity - STARTER_MUTATIONS.length - MUTATION_DISCOVERIES.length) }, (_, index) => ({ id: `future-${index + 1}`, future: true }));
    const collection = [...STARTER_MUTATIONS.map(mutation => ({ ...mutation, starter: true })), ...MUTATION_DISCOVERIES, ...futureMutations].map(mutation => {
      if (mutation.future) return `<span class="mutation-collection-slot future locked" data-mutation-slot="${mutation.id}" aria-label="Неизвестная будущая мутация"><i>?</i></span>`;
      if (mutation.starter) return `<span class="mutation-collection-slot starter unlocked${mutation.name.length > 9 ? ' long-name' : ''}" data-mutation-slot="${mutation.id}" aria-label="${mutation.name}. Начальная мутация"><img src="${versionedAsset(mutation.image)}" alt=""><b>${mutation.name}</b></span>`;
      const isUnlocked = unlocked.has(mutation.id);
      return `<span class="mutation-collection-slot ${isUnlocked ? 'unlocked' : 'locked'}${isUnlocked && mutation.name.length > 9 ? ' long-name' : ''}" data-mutation-slot="${mutation.id}" aria-label="${isUnlocked ? mutation.name : 'Неизвестная мутация'}">
        ${isUnlocked ? `<img src="${versionedAsset(mutation.image)}" alt=""><b>${mutation.name}</b>` : '<i>?</i>'}
      </span>`;
    }).join('');
    const fillPercent = allUnlocked ? 100 : Math.min(100, save.mutationProgress / mutationCost * 100);
    const reactorArcPaths = [
      '1,16 18,16 31,5 46,23 63,9 78,18 99,11',
      '1,13 15,13 28,23 43,7 58,17 73,4 99,15',
      '1,18 17,18 29,8 43,21 57,11 72,24 99,12',
      '1,11 16,11 30,20 46,6 60,22 78,10 99,17'
    ];
    const reactorEnergyArcs = Array.from({ length: 14 }, (_, index) => {
      const points = reactorArcPaths[index % reactorArcPaths.length];
      const glowId = `reactor-bolt-glow-${index}`;
      const coreId = `reactor-bolt-core-${index}`;
      return `<i><svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${glowId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#38e77e" stop-opacity="0"></stop><stop offset=".28" stop-color="#21ee72" stop-opacity=".62"></stop><stop offset=".62" stop-color="#13dd63"></stop><stop offset="1" stop-color="#66ff8d"></stop></linearGradient><linearGradient id="${coreId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#efffd3" stop-opacity="0"></stop><stop offset=".34" stop-color="#efffd3" stop-opacity=".72"></stop><stop offset="1" stop-color="#f8ffe7"></stop></linearGradient></defs><polyline class="reactor-bolt-glow" pathLength="100" points="${points}" style="stroke:url(#${glowId})"></polyline><polyline class="reactor-bolt-core" pathLength="100" points="${points}" style="stroke:url(#${coreId})"></polyline></svg></i>`;
    }).join('');
    els.panelContent.innerHTML = `<div class="laboratory-panel">${laboratoryTabsMarkup()}<div class="panel-section mutation-lab-panel">
      <button id="mutationCapsuleBtn" class="mutation-capsule ${allUnlocked ? 'is-complete' : ''}" type="button" ${allUnlocked || readyToReveal ? 'disabled' : ''} aria-label="${allUnlocked ? 'Все тестовые мутации открыты' : readyToReveal ? 'Открывается новая мутация' : `Добавить одну колбу. Осталось ${remaining}`}">
        <span class="mutation-side-feed" aria-hidden="true">
          <span id="mutationInlet" class="mutation-inlet"><i></i></span>
          <span class="mutation-feed-count"><img src="${versionedAsset('assets/ui/research-flask.png')}" alt=""><b id="mutationRemaining">${allUnlocked || readyToReveal ? '✓' : remaining}</b></span>
        </span>
        <span class="mutation-dispenser">
          <span class="mutation-dispenser-mouth">
            <span class="mutation-dispenser-flap" aria-hidden="true"></span>
            <span id="mutationMystery" class="mutation-mystery"><i>?</i></span>
          </span>
          <span class="mutation-dispenser-tray" aria-hidden="true"></span>
        </span>
        <span class="mutation-machine-top" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="mutation-glass">
          <span class="mutation-liquid-chamber" aria-hidden="true">
            <span id="mutationLiquid" class="mutation-liquid" style="height:${fillPercent}%"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          </span>
          <span class="mutation-reactor-energy" aria-hidden="true">${reactorEnergyArcs}</span>
          <span id="mutationImpact" class="mutation-impact" aria-hidden="true"></span>
        </span>
        <span id="mutationCapsuleHint" class="mutation-capsule-hint">${allUnlocked ? 'ВСЕ ДОСТУПНЫЕ МУТАЦИИ ОТКРЫТЫ' : adminInfiniteResearch || save.researchUnits > 0 ? 'НАЖМИ · ДОБАВИТЬ КОЛБУ' : 'НУЖНА КОЛБА ИССЛЕДОВАНИЯ'}</span>
      </button>
      <div class="mutation-collection-head"><b>МУТАЦИИ</b><span>${visibleUnlockedCount}/${collectionCapacity}</span></div>
      <div id="mutationCollection" class="mutation-collection">${collection}</div>
    </div></div>`;
    bindLaboratoryTabs();
    const capsuleButton = $('#mutationCapsuleBtn');
    capsuleButton?.addEventListener('click', handleMutationCapsuleClick);
    capsuleButton?.addEventListener('pointerdown', startMutationFeedHold);
    capsuleButton?.addEventListener('pointerup', stopMutationFeedHold);
    capsuleButton?.addEventListener('pointercancel', stopMutationFeedHold);
    capsuleButton?.addEventListener('lostpointercapture', stopMutationFeedHold);
    if (readyToReveal && capsuleButton) {
      const token = mutationAnimationToken;
      mutationAnimating = true;
      requestAnimationFrame(() => revealRandomMutation(token, capsuleButton));
    }
  }

  function mutationDelay(ms) {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  function currentMutationCost() {
    return MUTATION_STEPS;
  }

  function handleMutationCapsuleClick(event) {
    const button = $('#mutationCapsuleBtn');
    if (!button) return;
    if (button.dataset.revealStage === 'core') {
      if (!event?.target?.closest?.('#mutationMystery')) {
        feedback(2);
        return;
      }
      revealSynthesizedMutation(mutationAnimationToken, button);
      return;
    }
    if (!event?.detail) investMutationResearch();
  }

  function stopMutationFeedHold() {
    const wasFeeding = mutationFeedHoldActive;
    mutationFeedHoldActive = false;
    mutationFeedHoldStartedAt = 0;
    window.clearTimeout(mutationFeedHoldTimer);
    mutationFeedHoldTimer = 0;
    const button = $('#mutationCapsuleBtn');
    button?.classList.remove('is-auto-feeding');
    if (wasFeeding && button && !button.disabled && !mutationAnimating) {
      const hint = $('#mutationCapsuleHint');
      if (hint) hint.textContent = adminInfiniteResearch || save.researchUnits > 0 ? 'НАЖМИ ИЛИ УДЕРЖИВАЙ, ЧТОБЫ ДОБАВИТЬ КОЛБЫ' : 'НУЖНА КОЛБА ИССЛЕДОВАНИЯ';
    }
  }

  function mutationHoldFlightDuration() {
    const heldFor = Math.max(0, performance.now() - mutationFeedHoldStartedAt);
    return Math.max(170, 500 - heldFor * .165);
  }

  function scheduleMutationFeedHold(button, previousFlightDuration) {
    if (!mutationFeedHoldActive || !button || button.disabled || mutationAnimating) {
      stopMutationFeedHold();
      return;
    }
    const nextDelay = Math.max(165, Number(previousFlightDuration) || mutationHoldFlightDuration());
    mutationFeedHoldTimer = window.setTimeout(() => {
      if (!mutationFeedHoldActive || button !== $('#mutationCapsuleBtn')) return;
      const flightDuration = mutationHoldFlightDuration();
      const invested = investMutationResearch({ flightDuration });
      if (!invested || mutationAnimating || button.disabled) {
        stopMutationFeedHold();
        return;
      }
      scheduleMutationFeedHold(button, flightDuration);
    }, nextDelay);
  }

  function startMutationFeedHold(event) {
    const button = event.currentTarget;
    if (!button || button.disabled || mutationAnimating || button.dataset.revealStage === 'core') return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    stopMutationFeedHold();
    mutationFeedHoldActive = true;
    mutationFeedHoldStartedAt = performance.now();
    button.classList.add('is-auto-feeding');
    try { button.setPointerCapture(event.pointerId); } catch (_) {}
    const firstFlightDuration = mutationHoldFlightDuration();
    const invested = investMutationResearch({ flightDuration: firstFlightDuration });
    if (!invested || mutationAnimating || button.disabled) {
      stopMutationFeedHold();
      return;
    }
    scheduleMutationFeedHold(button, firstFlightDuration);
  }

  function investMutationResearch(options = {}) {
    const button = $('#mutationCapsuleBtn');
    if (!button || button.disabled || mutationAnimating) return false;
    if (!adminInfiniteResearch && save.researchUnits < 1) {
      button.classList.remove('needs-research');
      void button.offsetWidth;
      button.classList.add('needs-research');
      showToast('Нужна 1 колба исследования');
      feedback(7);
      return false;
    }
    const token = mutationAnimationToken;
    if (!adminInfiniteResearch) save.researchUnits -= 1;
    save.mutationProgress += 1;
    persist();
    updatePersistentUI();
    const balance = $('#mutationPanelBalance');
    if (balance) balance.textContent = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);
    sound('tap');

    const flyingFlask = document.createElement('img');
    flyingFlask.className = 'mutation-invest-flask';
    flyingFlask.src = versionedAsset('assets/ui/research-flask.png');
    flyingFlask.alt = '';
    const flightLayer = els.panelOverlay.querySelector('.panel-modal') || button;
    const sourceRect = els.panelTitle.querySelector('.mutation-panel-balance')?.getBoundingClientRect();
    const targetRect = $('#mutationInlet')?.getBoundingClientRect();
    const layerRect = flightLayer.getBoundingClientRect();
    const startX = (sourceRect?.left || layerRect.right) + (sourceRect?.width || 0) / 2 - layerRect.left;
    const startY = (sourceRect?.top || layerRect.top) + (sourceRect?.height || 0) / 2 - layerRect.top;
    const endX = (targetRect?.left || layerRect.left) + (targetRect?.width || layerRect.width) / 2 - layerRect.left;
    const endY = (targetRect?.top || layerRect.top) + (targetRect?.height || layerRect.height) / 2 - layerRect.top;
    flyingFlask.style.setProperty('--mutation-start-x', `${startX}px`);
    flyingFlask.style.setProperty('--mutation-start-y', `${startY}px`);
    flyingFlask.style.setProperty('--mutation-mid-x', `${(startX + endX) / 2 + 12}px`);
    flyingFlask.style.setProperty('--mutation-mid-y', `${Math.min(startY, endY) - 48}px`);
    flyingFlask.style.setProperty('--mutation-end-x', `${endX}px`);
    flyingFlask.style.setProperty('--mutation-end-y', `${endY}px`);
    const requestedFlightDuration = Number(options.flightDuration);
    const flightDuration = menuReducedMotion ? 70 : clamp(Number.isFinite(requestedFlightDuration) ? requestedFlightDuration : 500, 165, 560);
    flyingFlask.style.setProperty('--mutation-flight-duration', `${flightDuration}ms`);
    flightLayer.appendChild(flyingFlask);
    const mutationCost = currentMutationCost();
    const remaining = mutationCost - save.mutationProgress;
    const nextFillPercent = Math.min(100, save.mutationProgress / mutationCost * 100);
    button.setAttribute('aria-label', `Добавить одну колбу. Осталось ${Math.max(0, remaining)}`);
    const remainingLabel = $('#mutationRemaining');
    if (remainingLabel) remainingLabel.textContent = remaining > 0 ? String(remaining) : '✓';
    const progressBar = $('.mutation-synth-progress');
    progressBar?.setAttribute('aria-valuenow', String(Math.min(mutationCost, save.mutationProgress)));
    const progressFill = $('.mutation-synth-progress-fill');
    if (progressFill) progressFill.style.width = `${nextFillPercent}%`;
    window.setTimeout(() => {
      flyingFlask.remove();
      if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
      const liquid = $('#mutationLiquid');
      if (liquid) {
        liquid.style.setProperty('--liquid-fill', `${nextFillPercent}%`);
        liquid.classList.remove('is-splashing');
        void liquid.offsetWidth;
        liquid.classList.add('is-splashing');
      }
      const impact = $('#mutationImpact');
      impact?.classList.remove('is-visible');
      if (impact) void impact.offsetWidth;
      impact?.classList.add('is-visible');
      button.classList.remove('received-research');
      void button.offsetWidth;
      button.classList.add('received-research');
      sound('coin');
      feedback(4);
    }, flightDuration);
    if (save.mutationProgress >= mutationCost) {
      button.disabled = true;
      stopMutationFeedHold();
      button.classList.add('is-ready-to-synthesize');
      const synthButton = $('#mutationSynthesizeBtn');
      if (synthButton) {
        synthButton.disabled = false;
        synthButton.classList.add('ready');
      }
      const hint = $('#mutationCapsuleHint');
      if (hint) hint.textContent = 'РЕАКТОР ГОТОВ · НАЖМИ СИНТЕЗ';
      sound('happy');
      feedback([5, 9, 5]);
      return true;
    }
    const hint = $('#mutationCapsuleHint');
    if (hint) hint.textContent = mutationFeedHoldActive ? 'УДЕРЖИВАЙ, ЧТОБЫ БЫСТРЕЕ ДОБАВЛЯТЬ КОЛБЫ' : adminInfiniteResearch || save.researchUnits > 0 ? 'НАЖМИ ИЛИ УДЕРЖИВАЙ, ЧТОБЫ ДОБАВИТЬ КОЛБЫ' : 'НУЖНА КОЛБА ИССЛЕДОВАНИЯ';
    return true;
  }

  async function revealRandomMutation(token, button) {
    const locked = MUTATION_DISCOVERIES.filter(mutation => !(save.unlockedMutations || []).includes(mutation.id));
    const pendingStillLocked = pendingMutationReveal && locked.some(mutation => mutation.id === pendingMutationReveal.id);
    const mutation = pendingStillLocked ? pendingMutationReveal : locked[Math.floor(Math.random() * locked.length)];
    if (!mutation) {
      pendingMutationReveal = null;
      save.mutationProgress = 0;
      persist();
      renderRecipesPanel();
      return;
    }
    pendingMutationReveal = mutation;
    const synthColors = MUTATION_SYNTH_COLORS[mutation.id] || MUTATION_SYNTH_COLORS.gigantism;
    button.style.removeProperty('--mutation-liquid-filter');
    button.style.setProperty('--mutation-result-glow', synthColors.glow);
    button.classList.add('has-result-color');
    const mutationImageSrc = versionedAsset(mutation.image);
    const mutationImagePreload = new Image();
    mutationImagePreload.src = mutationImageSrc;
    const mutationImageReady = typeof mutationImagePreload.decode === 'function'
      ? mutationImagePreload.decode().catch(() => undefined)
      : Promise.resolve();
    const mystery = $('#mutationMystery');
    const hint = $('#mutationCapsuleHint');
    button.disabled = true;
    button.classList.add('is-processing');
    if (hint) hint.textContent = 'СИНТЕЗ · ЦВЕТА СМЕШИВАЮТСЯ…';
    sound('epic');
    feedback([8, 14, 8]);
    await mutationDelay(menuReducedMotion ? 100 : 3000);
    if (token !== mutationAnimationToken || !mystery || els.panelOverlay.classList.contains('hidden')) return;
    button.classList.remove('is-processing');
    button.classList.add('is-synthesis-ready');
    if (hint) hint.textContent = 'СИНТЕЗ ЗАВЕРШЁН';
    sound('happy');
    feedback([7, 12, 7]);
    await mutationImageReady;
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    mystery.style.setProperty('--result-glow', synthColors.glow);
    mystery.innerHTML = `<img src="${mutationImageSrc}" alt="${mutation.name}">`;
    mystery.classList.add('is-vended');
    await mutationDelay(menuReducedMotion ? 100 : 720);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    button.classList.add('is-drain-armed');
    void button.offsetWidth;
    const liquid = $('#mutationLiquid');
    liquid?.style.setProperty('--liquid-fill', '0%');
    button.classList.add('is-draining');
    if (hint) hint.textContent = 'СЛИВ РЕАГЕНТА…';
    feedback(5);
    await mutationDelay(menuReducedMotion ? 100 : 860);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    button.classList.remove('is-synthesis-ready', 'is-drain-armed', 'is-draining');
    void mystery.offsetWidth;
    button.classList.add('is-dispensing');
    if (hint) hint.textContent = 'ВЫДАЧА НОВОЙ МУТАЦИИ…';
    sound('coin');
    feedback([5, 9, 5]);
    await mutationDelay(menuReducedMotion ? 100 : 460);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    button.classList.remove('is-dispensing');
    button.classList.add('is-core-ready');
    button.dataset.revealStage = 'core';
    button.disabled = false;
    if (hint) hint.textContent = 'НАЖМИ НА ЭМБЛЕМУ';
    feedback([5, 8]);
  }

  async function revealSynthesizedMutation(token, button) {
    const mutation = pendingMutationReveal;
    const mystery = $('#mutationMystery');
    const hint = $('#mutationCapsuleHint');
    if (!mutation || !mystery || button.dataset.revealStage !== 'core') return;
    button.dataset.revealStage = 'revealing';
    button.disabled = true;
    button.classList.remove('is-core-ready');
    button.classList.add('is-output-selected');
    if (hint) hint.textContent = `ПОЛУЧЕНА МУТАЦИЯ · ${mutation.name}`;
    sound('epic');
    feedback([10, 18, 10]);
    await mutationDelay(menuReducedMotion ? 80 : 480);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    const prize = document.createElement('button');
    prize.id = 'mutationPrize';
    prize.className = `mutation-prize mutation-family-${mutation.id}`;
    prize.type = 'button';
    prize.innerHTML = `<small>НОВАЯ МУТАЦИЯ</small><span class="mutation-prize-emblem">${mutationElementFxMarkup(mutation.id, 'mutation-prize-fx')}<img src="${versionedAsset(mutation.image)}" alt=""></span><b>${mutation.name}</b><span>НАЖМИ, ЧТОБЫ ЗАБРАТЬ</span>`;
    prize.setAttribute('aria-label', `Новая мутация: ${mutation.name}. Нажми, чтобы добавить в коллекцию`);
    const modal = els.panelOverlay.querySelector('.panel-modal');
    modal?.appendChild(prize);
    requestAnimationFrame(() => prize.classList.add('is-visible'));
    prize.addEventListener('click', () => collectSynthesizedMutation(token, mutation, prize), { once: true });
  }

  async function collectSynthesizedMutation(token, mutation, prize) {
    if (!mutation || !prize || prize.classList.contains('is-collecting')) return;
    const target = $(`[data-mutation-slot="${mutation.id}"]`);
    const prizeImage = prize.querySelector('img');
    let prizeFlyer = null;
    if (target && prizeImage) {
      const sourceRect = prizeImage.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const flightX = targetRect.left + targetRect.width / 2 - (sourceRect.left + sourceRect.width / 2);
      const flightY = targetRect.top + targetRect.height / 2 - (sourceRect.top + sourceRect.height / 2);
      const flightScale = Math.min(targetRect.width, targetRect.height) * .72 / Math.max(1, sourceRect.width);
      prizeFlyer = prizeImage.cloneNode(true);
      prizeFlyer.className = 'mutation-prize-flyer';
      prizeFlyer.style.left = `${sourceRect.left}px`;
      prizeFlyer.style.top = `${sourceRect.top}px`;
      prizeFlyer.style.width = `${sourceRect.width}px`;
      prizeFlyer.style.height = `${sourceRect.height}px`;
      prizeFlyer.style.setProperty('--mutation-prize-x', `${flightX}px`);
      prizeFlyer.style.setProperty('--mutation-prize-y', `${flightY}px`);
      prizeFlyer.style.setProperty('--mutation-prize-scale', `${flightScale}`);
      document.body.appendChild(prizeFlyer);
      void prizeFlyer.offsetWidth;
      requestAnimationFrame(() => prizeFlyer?.classList.add('is-flying'));
      target.classList.add('is-receiving');
    }
    const capsule = $('#mutationCapsuleBtn');
    capsule?.classList.remove('is-output-selected');
    capsule?.classList.add('is-dispenser-closing');
    prize.classList.add('is-collecting');
    sound('coin');
    feedback([7, 12, 7]);
    await mutationDelay(menuReducedMotion ? 100 : 780);
    prizeFlyer?.remove();
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    save.unlockedMutations = [...new Set([...(save.unlockedMutations || []), mutation.id])];
    save.mutationProgress = 0;
    pendingMutationReveal = null;
    persist();
    mutationAnimating = false;
    renderRecipesPanel();
    const unlockedSlot = $(`[data-mutation-slot="${mutation.id}"]`);
    requestAnimationFrame(() => unlockedSlot?.classList.add('just-unlocked'));
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
    els.panelTitle.textContent = 'Аксессуары';
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
        <p class="panel-note">Награды: монеты, колбы исследования и бонус здоровья на следующий забег.</p>
      </div>`;
    $('#dailyClaimBtn').addEventListener('click', claimDaily);
    $('#wheelSpinBtn').addEventListener('click', spinWheel);
  }

  function encyclopediaUnlockedWorldIds() {
    return ACTIVE_WORLDS.filter(world => worldIsUnlocked(world.id)).map(world => world.id);
  }

  function renderEncyclopediaPanel(worldId = save.world) {
    const encyclopedia = window.SlimeEncyclopedia;
    if (!encyclopedia) return;
    const unlockedWorldIds = encyclopediaUnlockedWorldIds();
    activeEncyclopediaWorld = unlockedWorldIds.includes(+worldId) ? +worldId : unlockedWorldIds[0] || 1;
    els.panelTitle.textContent = 'Справочник блоков';
    els.panelContent.innerHTML = encyclopedia.render({
      activeWorld: activeEncyclopediaWorld,
      unlockedWorldIds,
      worlds: ACTIVE_WORLDS,
      balance: GAME_BALANCE,
      versionedAsset
    });
    $$('[data-encyclopedia-world]').forEach(button => button.addEventListener('click', () => {
      const nextWorld = Number(button.dataset.encyclopediaWorld);
      if (!unlockedWorldIds.includes(nextWorld) || nextWorld === activeEncyclopediaWorld) return;
      sound('tap');
      renderEncyclopediaPanel(nextWorld);
    }));
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
    { weight: 15, text: '+1 колба исследования', apply: () => { save.researchUnits += 1; } },
    { weight: 13, text: '+20% здоровья в следующем забеге', apply: () => { save.pendingHealthBoost += 20; } },
    { weight: 12, text: '+2 колбы исследования', apply: () => { save.researchUnits += 2; } }
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
    const resumeGameplayAfterAd = Boolean(run && !run.ended && !run.paused && pauseRun({ allowPortal: true }));
    adInFlight = true;
    syncInteractionLayers();
    const finish = promise => promise.finally(() => {
      adInFlight = false;
      document.body.classList.remove('ad-busy');
      syncInteractionLayers();
      if (resumeGameplayAfterAd) resumeRun();
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
    syncAdminInfiniteFlasksUI();
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
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    els.panelOverlay.classList.add('hidden');
    syncInteractionLayers();
    if (lastFocusedElement?.focus) lastFocusedElement.focus();
  }

  function updateTouchJoystick(event) {
    if (!run?.steer || run.steer.pointerId !== event.pointerId) return;
    const maxDistance = 32;
    let dx = event.clientX - run.steer.originX;
    let dy = event.clientY - run.steer.originY;
    const freeDirection = run.effects.gravitySwitch || speedDrillActive();
    if (freeDirection) {
      const distance = Math.hypot(dx, dy);
      if (distance > maxDistance) {
        dx = dx / distance * maxDistance;
        dy = dy / distance * maxDistance;
      }
    } else {
      dx = clamp(dx, -maxDistance, maxDistance);
      dy = clamp(dy, -maxDistance, maxDistance);
    }
    run.steer.touchX = clamp(dx / maxDistance, -1, 1);
    const vertical = clamp(dy / maxDistance, -1, 1);
    const mobilityDive = elementalLevel('mobility') >= 1;
    run.steer.touchDown = mobilityDive ? clamp(vertical, 0, 1) : 0;
    run.steer.touchY = speedDrillActive() ? vertical : 0;
    if (run.effects.gravitySwitch) {
      if (Math.abs(vertical) < .18) run.steer.gravityGestureLocked = false;
      else if (Math.abs(vertical) >= .42 && !run.steer.gravityGestureLocked) {
        setGravityDirection(vertical < 0 ? -1 : 1);
        run.steer.gravityGestureLocked = true;
      }
    }
    els.touchJoystick?.style.setProperty('--stick-x', `${round1(dx)}px`);
    els.touchJoystick?.style.setProperty('--stick-y', `${round1(freeDirection || mobilityDive ? dy : 0)}px`);
  }

  function beginTouchJoystick(event) {
    if (!run?.steer || run.ended || run.paused || run.portalEntry || event.pointerType === 'mouse') return false;
    if (run.steer.pointerId !== null) return false;
    const rect = els.shaft.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    run.steer.pointerId = event.pointerId;
    run.steer.originX = event.clientX;
    run.steer.originY = event.clientY;
    run.steer.touchX = 0;
    run.steer.touchY = 0;
    run.steer.touchDown = 0;
    run.steer.gravityGestureLocked = false;
    const localX = clamp(event.clientX - rect.left, 43, rect.width - 43);
    const localY = clamp(event.clientY - rect.top, 43, rect.height - 43);
    if (els.touchJoystick) {
      els.touchJoystick.style.left = `${localX}px`;
      els.touchJoystick.style.top = `${localY}px`;
      els.touchJoystick.style.setProperty('--stick-x', '0px');
      els.touchJoystick.style.setProperty('--stick-y', '0px');
      els.touchJoystick.classList.add('is-active');
      els.touchJoystick.setAttribute('aria-hidden', 'false');
    }
    try { els.shaft.setPointerCapture(event.pointerId); } catch (_) { /* capture is optional */ }
    feedback(3);
    return true;
  }

  function endTouchJoystick(event) {
    if (run?.steer && event?.pointerId !== undefined && run.steer.pointerId !== event.pointerId) return;
    const pointerId = run?.steer?.pointerId ?? null;
    if (run?.steer) {
      run.steer.pointerId = null;
      run.steer.touchX = 0;
      run.steer.touchY = 0;
      run.steer.touchDown = 0;
      run.steer.gravityGestureLocked = false;
    }
    els.touchJoystick?.classList.remove('is-active');
    els.touchJoystick?.setAttribute('aria-hidden', 'true');
    els.touchJoystick?.style.setProperty('--stick-x', '0px');
    els.touchJoystick?.style.setProperty('--stick-y', '0px');
    if (pointerId !== null) {
      try { els.shaft.releasePointerCapture(pointerId); } catch (_) { /* pointer already released */ }
    }
  }

  function setKeyboardSteering(code, pressed) {
    if (!run?.steer || run.ended || run.paused || run.portalEntry) return false;
    if (run.effects.gravitySwitch && ['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(code)) {
      if (code === 'ArrowDown' || code === 'KeyS') run.steer.keyDown = pressed;
      if (pressed) setGravityDirection(code === 'ArrowUp' || code === 'KeyW' ? -1 : 1);
      return true;
    }
    if (pressed && !speedDrillActive() && (code === 'ArrowUp' || code === 'KeyW')) return false;
    const key = {
      ArrowLeft: 'keyLeft', KeyA: 'keyLeft',
      ArrowRight: 'keyRight', KeyD: 'keyRight',
      ArrowUp: 'keyUp', KeyW: 'keyUp',
      ArrowDown: 'keyDown', KeyS: 'keyDown'
    }[code];
    if (!key) return false;
    run.steer[key] = pressed;
    return true;
  }

  function clearFallSteering() {
    if (run?.steer) {
      run.steer.keyLeft = false;
      run.steer.keyRight = false;
      run.steer.keyUp = false;
      run.steer.keyDown = false;
    }
    endTouchJoystick();
  }

  function bindEvents() {
    bindMenuSlimeInteractions();
    els.rerollBtn.addEventListener('click', activateConveyorControl);
    els.levelButtons?.addEventListener('click', event => {
      const button = event.target.closest('.level-btn');
      if (!button) return;
      selectLevel(Number(button.dataset.level));
    });
    els.homeWorldSelect?.addEventListener('change', event => selectHomeWorld(event.target.value));
    els.homeWorldPicker?.addEventListener('click', () => setHomeWorldMenuOpen(els.homeWorldMenu?.hidden));
    els.homeWorldMenu?.addEventListener('click', event => {
      const option = event.target.closest('.home-world-option');
      if (!option || option.disabled) return;
      setHomeWorldMenuOpen(false);
      selectHomeWorld(option.dataset.world);
    });
    document.addEventListener('pointerdown', event => {
      if (els.homeWorldMenu?.hidden || event.target.closest('.home-world-selector')) return;
      setHomeWorldMenuOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || els.homeWorldMenu?.hidden) return;
      setHomeWorldMenuOpen(false);
      els.homeWorldPicker?.focus();
    });
    els.campaignModeBtn?.addEventListener('click', () => selectHomeMode('campaign'));
    els.endlessModeBtn?.addEventListener('click', () => selectHomeMode('endless'));
    els.startDropBtn?.addEventListener('click', () => { void beginRoomLaunch(); });
    els.startEndlessBtn?.addEventListener('click', () => { void beginRoomLaunch({ endless: true }); });
    els.adminMenuBtn?.addEventListener('click', openAdminTools);
    els.closeAdminToolsBtn?.addEventListener('click', closeAdminTools);
    els.adminToolsOverlay?.addEventListener('click', event => { if (event.target === els.adminToolsOverlay) closeAdminTools(); });
    els.adminRestartBtn.addEventListener('click', restartDraftFromAdmin);
    els.adminPrevWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(-1));
    els.adminNextWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(1));
    els.adminUnlockAllBtn?.addEventListener('click', unlockEverythingFromAdmin);
    els.adminInfiniteFlasksBtn?.addEventListener('click', toggleAdminInfiniteFlasks);
    els.adminResetProgressBtn?.addEventListener('click', resetProgressFromAdmin);
    els.abilityBtn.addEventListener('click', activateAbility);
    els.shaft.addEventListener('pointerdown', event => {
      if (!run || run.ended || run.paused || event.target.closest?.('button')) return;
      event.preventDefault();
      if (run.geyserCapture) {
        launchGeyserTowardClientPoint(event.clientX, event.clientY, performance.now());
        return;
      }
      beginTouchJoystick(event);
    });
    els.shaft.addEventListener('pointermove', event => updateTouchJoystick(event));
    els.shaft.addEventListener('pointerup', endTouchJoystick);
    els.shaft.addEventListener('pointercancel', endTouchJoystick);
    els.shaft.addEventListener('lostpointercapture', endTouchJoystick);
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
    window.addEventListener('resize', () => scheduleViewportMetrics(false), { passive: true });
    window.addEventListener('orientationchange', () => scheduleViewportMetrics(true), { passive: true });
    window.visualViewport?.addEventListener('resize', () => scheduleViewportMetrics(false), { passive: true });
    document.addEventListener('keydown', event => {
      const steerCode = event.code || event.key;
      if (run?.geyserCapture && !run.paused && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(steerCode)) {
        event.preventDefault();
        const direction = {
          ArrowLeft: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
          ArrowUp: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 },
          KeyA: { x: -1, y: 0 },
          KeyD: { x: 1, y: 0 },
          KeyW: { x: 0, y: -1 },
          KeyS: { x: 0, y: 1 }
        }[steerCode];
        launchFromGeyser(direction, performance.now());
        return;
      }
      if (setKeyboardSteering(steerCode, true)) {
        event.preventDefault();
        return;
      }
      if (event.key !== 'Escape') return;
      if (!els.adOverlay.classList.contains('hidden')) resolveDemoAd(false);
      else if (!els.runMenuOverlay.classList.contains('hidden')) continueRunFromMenu();
      else if (!els.gameCompleteOverlay.classList.contains('hidden')) closeGameCompleteToHome();
      else if (!els.adminToolsOverlay.classList.contains('hidden')) closeAdminTools();
      else if (!els.panelOverlay.classList.contains('hidden')) closePanel();
    });
    document.addEventListener('keyup', event => {
      if (setKeyboardSteering(event.code || event.key, false)) event.preventDefault();
    });
    window.addEventListener('blur', clearFallSteering);
  }

  async function init() {
    syncPerformanceMode();
    await initializeReliableSaves();
    yandexPlatform?.subscribe({
      onPause: () => {
        stopAllSounds();
        autoResumeRunAfterVisibility = pauseRun({ allowPortal: true }) || autoResumeRunAfterVisibility;
      },
      onResume: () => {
        if (!document.hidden && autoResumeRunAfterVisibility) {
          autoResumeRunAfterVisibility = false;
          resumeRun();
        }
      }
    });
    initializeInteractionLayers();
    bindEvents();
    if ('ResizeObserver' in window) {
      const homeFitObserver = new ResizeObserver(scheduleHomeFit);
      homeFitObserver.observe(els.homeScreen);
      const homeTopbar = document.querySelector('.topbar.world-summary');
      if (homeTopbar) homeFitObserver.observe(homeTopbar);
    }
    updatePersistentUI();
    if (save.pendingWheel) finishPendingWheel(false);
    if (restoreSession(save.activeDraft)) {
      syncMenuCategoryVisuals({ instant: true });
      showScreen('home');
      renderDraft();
      persist();
    } else newDraft();
    document.documentElement.classList.remove('app-booting');
    document.documentElement.classList.add('app-ready');
    yandexPlatform?.ysdk?.features?.LoadingAPI?.ready?.();
    window.SlimeGameDebug = {
      reset: () => {
        const storage = saveStorage || browserStorage();
        storage?.removeItem(SAVE_KEY);
        storage?.removeItem(SAVE_BACKUP_KEY);
        location.reload();
      },
      addCoins: (amount = 1000) => { save.coins += amount; persist(); },
      addResearch: (amount = 100) => { save.researchUnits += Math.max(0, Math.floor(amount)); persist(); updatePersistentUI(); },
      maxStomach: () => { save.stomachLevel = 4; persist(); newDraft(); },
      setNextBonuses: ({ health = 0, rerolls = 0 } = {}) => {
        save.pendingHealthBoost = clamp(Math.round(health), 0, 100);
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
        if (!run || run.ended || !['bomb', 'heal', 'spring', 'cryo', 'freeze', 'jelly', 'geyser', 'meteor'].includes(type)) return false;
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
        } else if (type === 'freeze') {
          run.freezeUntil = performance.now() + 3000;
          run.frozenEmotion = 'surprised';
        }
        return true;
      },
      blockSummary: () => run ? run.blocks.reduce((summary, block) => {
        const key = block.special || (block.hazard ? 'hazard' : block.tier);
        summary[key] = (summary[key] || 0) + 1;
        return summary;
      }, {}) : null,
      elementalBlockSummary: () => run ? run.blocks.reduce((summary, block) => {
        if (!block.dead && block.elementalSnow) summary.snow += 1;
        if (!block.dead && block.elementalSnowflake) summary.snowflakes += 1;
        if (!block.dead && block.fireDamageAt > performance.now()) summary.burning += 1;
        if (!block.dead && block.electricFlashUntil > performance.now()) summary.electrified += 1;
        return summary;
      }, { snow: 0, snowflakes: 0, burning: 0, electrified: 0 }) : null,
      elementalLevels: (levels = {}) => {
        if (!run || run.ended) return null;
        for (const key of ['fire', 'frost', 'electric', 'cosmos', 'gigantism', 'wind', 'explosion']) {
          if (Object.hasOwn(levels, key)) run.categoryVisuals[key] = clamp(Math.round(levels[key]), 0, 3);
        }
        run.effects.gravitySwitch = elementalLevel('cosmos') >= 1 || session.effects.gravitySwitch;
        run.elementalAbilityType = ['frost', 'electric', 'fire', 'cosmos', 'gigantism', 'wind', 'explosion'].find(key => run.categoryVisuals[key] >= 3) || '';
        run.elementalAbilityCharges = run.elementalAbilityType ? 1 : 0;
        run.elementalAbilityActive = '';
        run.elementalAbilityUntil = 0;
        run.goldRushUntil = 0;
        run.speedPressure = 0;
        run.speedBurstChargeMs = 0;
        run.speedBurstReady = false;
        run.speedBurstBlocksLeft = 0;
        run.speedBurstUntil = 0;
        run.windDashBlocksLeft = 0;
        run.windDashUntil = 0;
        run.windDashCooldownUntil = 0;
        run.windBounceFlashUntil = 0;
        resetMassPierce();
        updateRunUI();
        return { ...run.categoryVisuals, ability: run.elementalAbilityType };
      },
      elementalState: () => run ? {
        levels: {
          fire: elementalLevel('fire'), frost: elementalLevel('frost'), electric: elementalLevel('electric'),
          gold: elementalLevel('gold'), explosion: elementalLevel('explosion'), mass: elementalLevel('mass'),
          mobility: elementalLevel('mobility'), cosmos: elementalLevel('cosmos'), gigantism: elementalLevel('gigantism'),
          wind: elementalLevel('wind')
        },
        ability: run.elementalAbilityType,
        charges: run.elementalAbilityCharges,
          active: run.elementalAbilityActive,
          blastCounter: run.blastCounter,
          massPierceRowsLeft: run.massPierceRowsLeft,
          speedPressure: run.speedPressure,
          speedBurstChargeMs: run.speedBurstChargeMs,
          speedBurstReady: run.speedBurstReady,
          speedBurstBlocksLeft: run.speedBurstBlocksLeft,
          cosmosAscentDistance: run.cosmosAscentDistance,
          cosmosReverseReady: run.cosmosReverseReady,
          cosmosBoostBlocksLeft: run.cosmosBoostBlocksLeft,
          affectedBlocks: run.blocks.filter(block => !block.dead && (block.elementalSnow || block.elementalSnowflake || block.elementalGolden || block.fireDamageAt || block.electricFlashUntil)).length
      } : null,
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
    document.documentElement.classList.remove('app-booting');
    document.documentElement.classList.add('app-ready');
  });
})();
