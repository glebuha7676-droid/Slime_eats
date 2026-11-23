(() => {
  'use strict';

  const CONFIG = window.SlimeGameConfig;
  const ASSETS = window.SlimeGameAssets;
  const EXPERIENCE = window.SlimeExperience;
  const PROGRESSION = window.SlimeProgression;
  const ULTIMATE_STAGES = window.SlimeUltimateStages;
  const ELEMENTAL_ULTIMATES = window.SlimeElementalUltimates;
  const INFINITY = window.SlimeInfinity;
  const INFINITY_MUTATION = { id: 'infinity', name: 'Бесконечность' };
  const TECHNO_ULTIMATES = window.SlimeTechnoUltimates;
  const SPORE_COLOSSUS = window.SlimeSporeColossus;
  const COSMOS_ULTIMATES = window.SlimeCosmosUltimates;
  if (!CONFIG || !ASSETS || !EXPERIENCE || !PROGRESSION || !window.SlimeMutationMastery || !ULTIMATE_STAGES || !ELEMENTAL_ULTIMATES || !INFINITY || !TECHNO_ULTIMATES || !SPORE_COLOSSUS || !COSMOS_ULTIMATES || !window.SlimeAudio || !window.SlimeAvatarRenderer) {
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
    SKINS,
    UPGRADES: UPGRADE_DATA
  } = CONFIG;
  const WORLDS = structuredClone(CONFIG.WORLDS);
  const ACTIVE_WORLDS = WORLDS.filter(world => world.active !== false);
  const ACTIVE_WORLD_IDS = Object.freeze(ACTIVE_WORLDS.map(world => world.id));
  const FLASK_VALUES = Object.freeze({ 1: 1, 2: 3, 3: 5 });
  const flaskSprites = new Map();
  const tutorialEnabled = !window.SlimeHomeConsole?.tutorialSuspended;
  const defaultSave = structuredClone(CONFIG.DEFAULT_SAVE);
  const PLANETS = window.SlimePlanetCampaign;
  const CORE = window.SlimeCoreEncounter;
  const PURIFICATION = window.SlimeCorePurification;
  const ENERGY = window.SlimeAnomalyEnergy;
  const ULTIMATE_COOLDOWN = window.SlimeUltimateCooldown;
  const EVAC = window.SlimeEvacuation;
  defaultSave.planetCampaign = PLANETS.normalize(null);
  // The illustrated home has no lesson yet: fresh and reset saves must be playable.
  if (!tutorialEnabled) {
    defaultSave.tutorialStep = 'done';
    defaultSave.onboarding = normalizeOnboarding(null, 'done');
    defaultSave.tutorialGiftClaimed = true;
    defaultSave.tutorialSecondGiftClaimed = true;
  }
  const {
    FOODS,
    WORLD_SPRITES,
    VFX_SPRITES,
    versionedAsset,
    ensureWorldSprites,
    ensureWorldBackground,
    ensureWorldBackgroundLayers: loadWorldBackgroundLayers,
    projectSprite,
    foodImageSource,
    foodArtMarkup,
    centerFoodThumbnail,
    uiIconMarkup
  } = ASSETS;
  const { drawSlimeAvatar } = window.SlimeAvatarRenderer;
  const stagedUltimateServices = Object.freeze({
    igniteBlock,
    onFireFlash() {
      run.shake = Math.max(run.shake, 4);
      sound('fireRelease');
      feedback([12, 19, 8]);
    }
  });
  const technoUltimateServices = Object.freeze({
    blocksNearY, elementalDamageable, damageBlockByElement, sound: name => sound(name)
  });
  const sporeColossusServices = Object.freeze({blocksNearY,elementalDamageable,damageBlockByElement,spawnMiniSlime,
    sound:name=>sound(name),feedback:value=>feedback(value),lowPower:()=>isLowPowerDevice(),reducedMotion:()=>menuReducedMotion});
  const cosmosUltimateServices = Object.freeze({blocksNearY,elementalDamageable,damageBlockByElement,sound:name=>sound(name)});
  const BASE_HEALTH = 100;
  const BASE_DAMAGE = 10;
  const BASE_SHIELD = 25;
  const BASE_SHIELD_CHARGES = 2;
  const STOMACH_CAPACITY = 1;
  const FREEZE_ZONE_CHARGE_MS = 1000;
  const FREEZE_ZONE_DURATION_MS = 3000;
  const PHANTOM_MARK_INTERVAL_MS = 3500;
  const FIRE_BURN_INTERVAL_MS = Object.freeze([410, 245]);
  const FIRE_FRAGILE_BURN_MS = 245;
  const FIRE_FINAL_BURN_MS = 640;
  const ACTIVE_ATTACK_COOLDOWN_MS = 6000;
  const FROST_FLAKE_TRAVEL_MS = 520;
  const FROST_FLAKE_BURST_MS = 460;
  const FROST_FLAKE_CELLS = 5;
  const FROST_FLAKE_WIDTH = 1.5;
  const FROST_STORM_ROW_MS = 165;
  const FROST_STORM_CELL_MS = 12;
  const FALL_MOMENTUM = Object.freeze({
    min: .60, max: 1.6, step: .2, gainPerSecond: .48,
    brakeSeconds: .055, fullSpeedAt: .34, airBeforeBoost: .67
  });
  const ELECTRIC_IMPACT_WINDOW_MS = 72;
  const PHANTOM_PORTAL_INTERVAL_MS = 10000;
  const PHANTOM_DURATION_MS = 3000;
  const PHANTOM_BURST_MS = 850;
  const GLITCH_INFECTION_INTERVAL_MS = 4200;
  const GLITCH_PASSIVE_LIMIT = 16;
  const GLITCH_SPAWN_GAP_CELLS = 2.5;
  const GLITCH_TITLE_MS = 1500;
  const glitchTileCache = new Map();
  let glitchTileCacheRun = null;
  const UNLIMITED_FREE_REROLLS = true;
  const SPEED_PRESSURE_RAMP_MS = 1000;
  const SPEED_BURST_CHARGE_MS = 5000;
  const SPEED_BURST_WINDOW_MS = 1400;
  const ELEMENTAL_ABILITY_DURATION_MS = Object.freeze({
    frost: 6000,
    electric: 4600,
    fire: 2000,
    cosmos: 5500,
    nano: 5000,
    telekinesis: 2500,
    phantom: 2800,
    gold: 3000,
    cloning: 5800,
    glitch: 1800,
    mass: 4000,
    mobility: 5000,
    infinity: 2840
  });
  const ULTIMATE_INTRO_MS = 820;
  const PHOENIX_FIRE_ROWS = 8;
  const COSMOS_ULTIMATE_CHARGE_MS = 920;
  const COSMOS_ULTIMATE_RAMP_MS = 270;
  const COSMOS_ULTIMATE_FADE_START_MS = 4000;
  const COSMOS_ULTIMATE_ROWS = 20;
  const ELECTRIC_STORM_CADENCE_MS = 655;
  const ELECTRIC_STORM_WARNING_MS = 370;
  const ELECTRIC_STORM_BOLT_MS = 59;
  const ELECTRIC_STORM_EXIT_MS = 720;
  const phoenixUltimateSprite = new Image();
  phoenixUltimateSprite.src = versionedAsset('assets/vfx/fire-phoenix-ultimate-v1-lossless.webp');
  const technoMechSprite = new Image();
  technoMechSprite.src = versionedAsset('assets/vfx/techno-drill-mech-v1.webp');
  const frostStormFlakeSprite = new Image();
  frostStormFlakeSprite.src = versionedAsset('assets/vfx/frost-storm-flake-v1-lossless.webp');

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
    coinsLabel: $('#coinsLabel'), playerLevelProgress: $('#playerLevelProgress'), playerLevelExperience: $('#playerLevelExperience'),
    researchUnitsLabel: $('#researchUnitsLabel'),
    worldLabel: $('#worldLabel'), worldIcon: $('#worldIcon'),
    worldEyebrow: $('#worldEyebrow'), levelPassedBadge: $('#levelPassedBadge'), worldProgressPrefix: $('#worldProgressPrefix'), worldProgressText: $('#worldProgressText'),
    worldProgressBar: $('#worldProgressBar'), worldProgressMarker: $('#worldProgressMarker'), worldHint: $('#worldHint'),
    homeScreen: $('#homeScreen'), dropScreen: $('#dropScreen'), slimeStage: $('#slimeStage'), slime: $('#slime'),
    quickMutationPicker: $('#quickMutationPicker'),
    formIndexBtn: $('#formIndexBtn'), formIndexBadge: $('#formIndexBadge'), wardrobeBtn: $('#wardrobeBtn'), mutationLabBadge: $('#mutationLabBadge'),
    tutorialLayer: $('#tutorialLayer'), tutorialFocus: $('#tutorialFocus'), tutorialPointer: $('#tutorialPointer'), tutorialCaption: $('#tutorialCaption'),
    tutorialGift: $('#tutorialGift'), tutorialGiftClaimBtn: $('#tutorialGiftClaimBtn'),
    tutorialMemo: $('#tutorialMemo'), tutorialDodge: $('#tutorialDodge'),
    tutorialControls: $('#tutorialControls'), tutorialControlsText: $('#tutorialControlsText'), tutorialControlsCloseBtn: $('#tutorialControlsCloseBtn'),
    tutorialUpgradeSummary: $('#tutorialUpgradeSummary'), tutorialUpgradeSummaryCloseBtn: $('#tutorialUpgradeSummaryCloseBtn'),
    tutorialAdminBtn: $('#tutorialAdminBtn'), tutorialPauseBtn: $('#tutorialPauseBtn'), tutorialSkipBtn: $('#tutorialSkipBtn'), tutorialRunSkipBtn: $('#tutorialRunSkipBtn'),
    menuSlimeCanvas: $('#menuSlimeCanvas'), menuSlimeMouth: $('#menuSlimeMouth'),
    foodInside: $('#foodInside'), levelButtons: $('#levelButtons'), levelDepthLabel: $('#levelDepthLabel'),
    healthCompare: $('#healthCompare'), damageCompare: $('#damageCompare'), shieldCompare: $('#shieldCompare'),
    startDropLabel: $('#startDropLabel'), adminMenuBtn: $('#adminMenuBtn'), adminToolsOverlay: $('#adminToolsOverlay'),
    closeAdminToolsBtn: $('#closeAdminToolsBtn'), adminUnlockAllBtn: $('#adminUnlockAllBtn'),
    adminPlanetName: $('#adminPlanetName'), adminPlanetInfection: $('#adminPlanetInfection'),
    adminUnlockInfectedBtn: $('#adminUnlockInfectedBtn'), adminLowerInfectionBtn: $('#adminLowerInfectionBtn'),
    adminResetProgressBtn: $('#adminResetProgressBtn'),
    adminInfiniteFlasksBtn: $('#adminInfiniteFlasksBtn'), adminInfiniteFlasksState: $('#adminInfiniteFlasksState'),
    adminInfiniteUltimateBtn: $('#adminInfiniteUltimateBtn'), adminInfiniteUltimateState: $('#adminInfiniteUltimateState'),
    conveyor: $('#conveyor'), foodChoices: $('#foodChoices'), conveyorDispensers: $('#conveyorDispensers'), conveyorChoiceCount: $('#conveyorChoiceCount'), conveyorFoodSlots: [...document.querySelectorAll('#conveyorChoiceCount .food-count-slot')], rerollBtn: $('#rerollBtn'), rerollTitle: $('#rerollTitle'), rerollText: $('#rerollText'),
    stomachQuickSlots: $('#stomachQuickSlots'),
    recipeCategorySlots: $('#recipeCategorySlots'), slimeFeedCount: $('#slimeFeedCount'),
    playSetupCard: $('#playSetupCard'), homeWorldPicker: $('#homeWorldPicker'), homeWorldMenu: $('#homeWorldMenu'),
    homeWorldSelect: $('#homeWorldSelect'), homeWorldPickerIcon: $('#homeWorldPickerIcon'),
    homeWorldPickerEyebrow: $('#homeWorldPickerEyebrow'), homeWorldPickerName: $('#homeWorldPickerName'), homeWorldBest: $('#homeWorldBest'),
    campaignModeBtn: $('#campaignModeBtn'), endlessModeBtn: $('#endlessModeBtn'),
    endlessModeHint: $('#endlessModeHint'), campaignModePanel: $('#campaignModePanel'), endlessModePanel: $('#endlessModePanel'),
    endlessBestScore: $('#endlessBestScore'), endlessBestDepth: $('#endlessBestDepth'), endlessBestLaps: $('#endlessBestLaps'),
    endlessRuns: $('#endlessRuns'), startDropBtn: $('#startDropBtn'), startEndlessBtn: $('#startEndlessBtn'),
    worldCarousel: $('#worldCarousel'), worldCarouselDots: $('#worldCarouselDots'), worldStartBtn: $('#worldStartBtn'),
    worldTerminalPreview: $('#worldTerminalPreview'), worldTerminalNumber: $('#worldTerminalNumber'), worldTerminalName: $('#worldTerminalName'),
    worldTerminalLock: $('#worldTerminalLock'), worldTerminalTrophies: $('#worldTerminalTrophies'), worldTerminalStats: $('#worldTerminalStats'),
    worldPrevBtn: $('#worldPrevBtn'), worldNextBtn: $('#worldNextBtn'),
    terminalBestScore: $('#terminalBestScore'), terminalBestDepth: $('#terminalBestDepth'), terminalBestLaps: $('#terminalBestLaps'), terminalRuns: $('#terminalRuns'),
    worldStartText: $('#worldStartText'), abyssModeV2: $('#abyssModeV2'), terminalEndlessLabel: $('#terminalEndlessLabel'),
    runResearchHud: $('#runResearchHud'), runResearchScore: $('#runResearchScore'), runResearchGain: $('#runResearchGain'),
    runExperienceHud: $('#runExperienceHud'), runExperienceScore: $('#runExperienceScore'), runExperienceGain: $('#runExperienceGain'),
    shaft: $('#shaft'), canvas: $('#physicsCanvas'), impactText: $('#impactText'),
    glitchUltimateOverlay: $('#glitchUltimateOverlay'), glitchChoiceAnnouncement: $('#glitchChoiceAnnouncement'),
    fallControls: $('#fallControls'), fallLeftBtn: $('#fallLeftBtn'), fallRightBtn: $('#fallRightBtn'),
    fallAttackBtn: $('#fallAttackBtn'), infinitySwapBtn: $('#infinitySwapBtn'), fireballCooldown: $('#fireballCooldown'),
    abilityBtn: $('#abilityBtn'), abilityPercent: $('#abilityPercent'), endRunBtn: $('#endRunBtn'),
    runMenuOverlay: $('#runMenuOverlay'), resumeRunBtn: $('#resumeRunBtn'), restartRunBtn: $('#restartRunBtn'),
    finishRunBtn: $('#finishRunBtn'), toggleRunSoundBtn: $('#toggleRunSoundBtn'), runSoundIcon: $('#runSoundIcon'), runSoundLabel: $('#runSoundLabel'),
    panelOverlay: $('#panelOverlay'), panelTitle: $('#panelTitle'), panelContent: $('#panelContent'), closePanelBtn: $('#closePanelBtn'),
    resultOverlay: $('#resultOverlay'), resultBadge: $('#resultBadge'), resultTitle: $('#resultTitle'), resultText: $('#resultText'),
    resultWorldIcon: $('#resultWorldIcon'), resultWorldName: $('#resultWorldName'), resultCoins: $('#resultCoins'),
    resultResearchFlask: $('#resultResearchFlask'), resultResearchUnits: $('#resultResearchUnits'),
    resultResearchData: $('#resultResearchData'), resultResearchStream: $('#resultResearchStream'),
    resultMultiplierLabel: $('#resultMultiplierLabel'), resultMultiplierTrack: $('#resultMultiplierTrack'),
    resultMultiplierNeedle: $('#resultMultiplierNeedle'), resultMultiplierHint: $('#resultMultiplierHint'),
    resultMultiplierBtn: $('#resultMultiplierBtn'), continueBtn: $('#continueBtn'),
    gameCompleteOverlay: $('#gameCompleteOverlay'), gameCompleteHomeBtn: $('#gameCompleteHomeBtn'), playEndlessBtn: $('#playEndlessBtn'),
    adOverlay: $('#adOverlay'), adReason: $('#adReason'), adRewardBtn: $('#adRewardBtn'), adCancelBtn: $('#adCancelBtn'),
    toast: $('#toast')
  };

  let session = null;
  let planetPresentationBusy = false;
  let run = null;
  let pendingAdResolver = null;
  let adInFlight = false;
  let lastFocusedElement = null;
  let menuEmotionTimer = null;
  let menuChewStartedAt = 0;
  let menuGazeTimer = null;
  let foodFlyerToken = 0;
  let menuPetSoundAt = -Infinity;
  let resultCoinAnimationId = 0;
  let resultResearchAnimationId = 0;
  let runResearchPulseTimer = 0;
  let resultRevealToken = 0;
  let homeRewardFlight = null;
  let autoResumeRunAfterVisibility = false;
  let platformSuspended = false;
  let windowSuspended = false;
  let activeLaboratoryTab = 'mutations';
  let laboratoryView = 'synthesis';
  let laboratoryTabAnimation = null;
  let selectedConveyorSlot = 0;
  let quickMutationPickerTimer = null;
  let selectedLaboratoryMutationId = 'fire';
  let laboratorySynthesisId = null;
  let laboratorySynthesisResult = null;
  let laboratoryReplaceMode = false;
  const RESULT_MULTIPLIERS = [.5, 1, 1.5, 2, 1.5, 1, .5];
  const RESULT_SWEEP_MS = 900;
  const MUTATION_STEPS = 100;
  const MUTATION_UPGRADE_COSTS = Object.freeze({ 1: 50, 2: 100 });
  const TUTORIAL_STEPS = new Set([
    'feed','play','post-run','second-gift','second-gift-credit',
    'upgrade-home-mutations','upgrade-fire','upgrade-close-lab',
    'second-feed','second-play','second-run','frost-home','frost-reactor',
    'frost-synthesize','frost-wait','frost-core','frost-prize','done'
  ]);

  const STARTER_MUTATIONS = Object.freeze([
    { id: 'fire', name: 'ОГОНЬ', image: 'assets/ui/recipe-categories/emblem-v2-fire.webp' },
    { id: 'frost', name: 'МОРОЗ', image: 'assets/ui/recipe-categories/emblem-v2-frost.webp' },
    { id: 'electric', name: 'ЭЛЕКТРО', image: 'assets/ui/recipe-categories/emblem-v2-electric.webp' }
  ]);
  const MUTATION_DISCOVERIES = Object.freeze([
    { id: 'cosmos', name: 'КОСМОС', image: 'assets/ui/recipe-categories/emblem-v4-cosmos.webp' },
    { id: 'nano', name: 'ТЕХНО', image: 'assets/ui/recipe-categories/emblem-v4-techno.webp' },
    { id: 'telekinesis', name: 'ПСИОНИКА', image: 'assets/ui/recipe-categories/emblem-v4-psionics.webp' },
    { id: 'cloning', name: 'СПОРЫ', image: 'assets/ui/recipe-categories/emblem-v3-spores.webp' },
    { id: 'phantom', name: 'ФАНТОМ', image: 'assets/ui/recipe-categories/emblem-v7-phantom-lossless.webp' },
    { id: 'glitch', name: 'ГЛИТЧ', image: 'assets/ui/recipe-categories/emblem-v4-glitch.webp' }
  ]);
  const MUTATION_DETAILS = Object.freeze({
    fire: { stage1: 'I · Хрупкие блоки сгорают почти сразу.', stage2: 'II · Целый обычный блок сгорает за два тика.', stage3: 'III · Феникс поджигает 8 рядов на всю ширину шахты.' },
    electric: { stage1: 'При ударе молния бьёт один соседний блок сбоку или впереди.', stage2: 'Добавляет одну ветку к каждому разряду.' },
    frost: { stage1: 'При касании превращает обычную и прочную породу в снег. Снег сохраняет разгон.', stage2: 'Снежинка прокладывает снежный проход на 5 клеток вперёд.' },
    cosmos: { stage1: 'Планета кружится рядом.', stage2: 'При касании бьёт блоки.' },
    nano: { stage1: 'Дрон стреляет вниз каждую секунду.', stage2: 'Каждый выстрел пробивает два блока.' },
    telekinesis: { stage1: 'Вырывает блок и бросает вниз.', stage2: 'Лишний урон разлетается осколками.' },
    cloning: { stage1: 'Споры взрываются на блоках.', stage2: 'Из взрыва вылетают грибочки.' },
    phantom: { stage1: 'Духи помечают блоки.', stage2: 'Метки взрываются и задевают соседние блоки.' },
    glitch: { stage1: 'Заражает блоки впереди.', stage2: 'Удар по одному передаётся остальным.' }
  });
  const MUTATION_REVEAL_DESCRIPTIONS = Object.freeze({
    fire: 'Быстро выжигает мягкую породу и ослабляет прочную.',
    electric: 'Копит заряд и поражает блоки разрядом.',
    frost: 'Охлаждает блоки и смягчает удары.',
    cosmos: 'Планеты кружатся вокруг слайма и бьют блоки.',
    nano: 'Дрон стреляет по породе под слаймом.',
    telekinesis: 'Двигает и разбивает блоки силой мысли.',
    cloning: 'Выращивает взрывные споры на блоках; из них вылетают грибочки.',
    phantom: 'Духи превращают камни в хрупкие и разрушают их с задержкой.',
    glitch: 'Заражает блоки и передаёт урон между ними.'
  });
  const FORM_INDEX = Object.freeze([
    { id: 'fire', name: 'Феникс', mutation: 'ОГОНЬ', ultra: ['Феникс', ''], art: 'effects-lab/assets/fire-ultra-phoenix-body-v4-lossless.webp', color: '#ff8741' },
    { id: 'frost', name: 'Ледяная форма', mutation: 'МОРОЗ', ultra: ['Вьюга', ''], art: 'effects-lab/assets/frost-ultra-body-v1.webp', color: '#83eaff' },
    { id: 'electric', name: 'Повелитель бури', mutation: 'ЭЛЕКТРО', ultra: ['Громовержец', ''], art: 'assets/ui/slime/forms/slime-body-electric-storm-v1.webp', color: '#ffe46a' },
    { id: 'cosmos', name: 'Космическая форма', mutation: 'КОСМОС', ultra: ['Кометный прорыв', 'Летит и пробивает блоки на пути.'], art: 'effects-lab/assets/cosmos-ultra-body-v2-lossless.webp', color: '#b998ff' },
    { id: 'nano', name: 'Мех-бурильщик', mutation: 'ТЕХНО', ultra: ['Мех-бурильщик', 'Пять секунд бурит породу вниз.'], art: 'effects-lab/assets/techno-ultra-body-v2-lossless.webp', color: '#ff8088' },
    { id: 'telekinesis', name: 'Псионическая форма', mutation: 'ПСИОНИКА', ultra: ['Псионический пресс', 'Сжимает и ломает 80 м шахты.'], art: 'effects-lab/assets/psionics-ultra-body-v1-lossless.webp', color: '#dbadff' },
    { id: 'cloning', name: 'Грибница', mutation: 'СПОРЫ', ultra: ['Споровый посев', '8 спор взрывают блоки по очереди.'], art: 'effects-lab/assets/spores-ultra-body-v5-lossless.webp', color: '#b8f879' },
    { id: 'phantom', name: 'Призрачная форма', mutation: 'ФАНТОМ', ultra: ['Призрачный экспресс', 'Поезд сносит 4 клетки в ширину и 12 рядов вперёд.'], art: 'effects-lab/assets/phantom-ultra-body-v7-lossless.webp', color: '#8dffe0' },
    { id: 'glitch', name: 'Аркадная форма', mutation: 'ГЛИТЧ', ultra: ['Выбор сбоя', 'Выбери один из четырёх сбоев.'], art: 'effects-lab/assets/glitch-ultra-body-v3-lossless.webp', color: '#ff80e8' }
  ]);
  const MUTATION_SYNTH_COLORS = Object.freeze({
    fire: { filter: 'hue-rotate(214deg) saturate(1.55) brightness(1.08)', glow: '#ff6b32' },
    electric: { filter: 'hue-rotate(292deg) saturate(1.35) brightness(1.14)', glow: '#ffe43d' },
    frost: { filter: 'hue-rotate(42deg) saturate(1.12) brightness(1.16)', glow: '#6eeaff' },
    cosmos: { filter: 'hue-rotate(105deg) saturate(1.72) brightness(.92)', glow: '#bd62ff' },
    nano: { filter: 'hue-rotate(22deg) saturate(1.08) brightness(1.12)', glow: '#5be9e3' },
    telekinesis: { filter: 'hue-rotate(28deg) saturate(1.15) brightness(1.12)', glow: '#6cf2d8' },
    cloning: { filter: 'hue-rotate(0deg) saturate(1.25) brightness(1.1)', glow: '#81ec75' },
    phantom: { filter: 'hue-rotate(8deg) saturate(.85) brightness(1.22)', glow: '#8dffe0' },
    glitch: { filter: 'hue-rotate(105deg) saturate(1.7)', glow: '#51f7ed' }
  });
  const TRAILS = Object.freeze([
    { id: 'none', name: 'Без следа', cost: 0 },
    { id: 'redJelly', name: 'Красное желе', cost: 3, asset: 'assets/ui/trails/trail-red.webp', colors: ['rgba(255,54,69,0)', 'rgba(255,76,88,.48)', 'rgba(239,42,57,.94)'], glow: '#ff5964' },
    { id: 'pinkJelly', name: 'Розовое желе', cost: 3, asset: 'assets/ui/trails/trail-pink.webp', colors: ['rgba(255,78,178,0)', 'rgba(255,108,194,.5)', 'rgba(247,54,159,.95)'], glow: '#ff78c6' },
    { id: 'blueJelly', name: 'Синее желе', cost: 3, asset: 'assets/ui/trails/trail-blue.webp', colors: ['rgba(42,145,255,0)', 'rgba(61,177,255,.5)', 'rgba(22,135,240,.95)'], glow: '#51c7ff' },
    { id: 'yellowJelly', name: 'Жёлтое желе', cost: 3, asset: 'assets/ui/trails/trail-yellow.webp', colors: ['rgba(255,211,34,0)', 'rgba(255,225,60,.52)', 'rgba(255,193,18,.96)'], glow: '#ffe45c' },
    { id: 'greenJelly', name: 'Зелёное желе', cost: 3, asset: 'assets/ui/trails/trail-green.webp', colors: ['rgba(48,225,93,0)', 'rgba(64,238,116,.5)', 'rgba(24,192,76,.95)'], glow: '#58ef8d' },
    { id: 'orangeJelly', name: 'Оранжевое желе', cost: 3, asset: 'assets/ui/trails/trail-orange.webp', colors: ['rgba(255,126,34,0)', 'rgba(255,150,47,.5)', 'rgba(244,91,18,.96)'], glow: '#ff9a45' },
    { id: 'purpleJelly', name: 'Фиолетовое желе', cost: 3, asset: 'assets/ui/trails/trail-purple.webp', colors: ['rgba(142,67,255,0)', 'rgba(166,90,255,.5)', 'rgba(119,43,230,.95)'], glow: '#b47cff' },
    { id: 'starJelly', name: 'Звёздное желе', cost: 8, asset: 'assets/ui/trails/trail-star.webp', effect: 'stars', colors: ['rgba(21,13,74,0)', 'rgba(58,31,141,.66)', 'rgba(17,25,88,.98)'], glow: '#6652d8', life: 1.12 },
    { id: 'goldJelly', name: 'Золотой блеск', cost: 9, asset: 'assets/ui/trails/trail-gold.webp', effect: 'gold', colors: ['rgba(255,171,8,0)', 'rgba(255,218,49,.54)', 'rgba(255,164,6,.96)'], glow: '#ffe56b', life: 1.15 },
    { id: 'rainbowJelly', name: 'Радужное желе', cost: 11, asset: 'assets/ui/trails/trail-rainbow.webp', effect: 'rainbow', life: 1.14 },
    { id: 'bubbleJelly', name: 'Мыльные пузыри', cost: 9, asset: 'assets/ui/trails/trail-bubbles.webp', effect: 'bubbles', glow: '#b9efff', life: 1.2 }
  ]);
  let slimePointer = null;
  let menuSlimeAnimationId = 0;
  let menuSlimeLastFrame = 0;
  let menuLaunchInProgress = false;
  const menuReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let menuMutationReveal = null;
  let formDiscoverySequence = null;
  let playerExperiencePresentation = null;
  const menuCategoryVisual = {
    fire: 0, fireFrom: 0, fireTarget: 0, fireStartedAt: 0,
    frost: 0, frostFrom: 0, frostTarget: 0, frostStartedAt: 0,
    electric: 0, electricFrom: 0, electricTarget: 0, electricStartedAt: 0,
    cosmos: 0, cosmosFrom: 0, cosmosTarget: 0, cosmosStartedAt: 0,
    nano: 0, nanoFrom: 0, nanoTarget: 0, nanoStartedAt: 0,
    telekinesis: 0, telekinesisFrom: 0, telekinesisTarget: 0, telekinesisStartedAt: 0,
    cloning: 0, cloningFrom: 0, cloningTarget: 0, cloningStartedAt: 0,
    phantom: 0, phantomFrom: 0, phantomTarget: 0, phantomStartedAt: 0,
    glitch: 0, glitchFrom: 0, glitchTarget: 0, glitchStartedAt: 0,
    infinity: 0, infinityFrom: 0, infinityTarget: 0, infinityStartedAt: 0,
    mass: 0, massFrom: 0, massTarget: 0, massStartedAt: 0
  };
  const menuGaze = { x: 0, y: 0 };
  const menuTapEmotion=window.SlimeTapEmotions.create();
  const menuPetpet = window.MenuPetpet.create({ reducedMotion: matchMedia('(prefers-reduced-motion:reduce)').matches });
  const SAVE_BACKUP_KEY = `${SAVE_KEY}_backup`;
  const ADMIN_INFINITE_ABILITIES_KEY = `${SAVE_KEY}_admin_infinite_abilities`;
  const SAVE_SYNC_DELAY = 5000;
  let saveStorage = null;
  let yandexPlatform = null;
  let cloudSaveTimer = 0;
  let cloudSaveInFlight = null;
  let saveUpdatedAt = 0;
  let saveRevision = 0;
  let mutationAnimationToken = 0;
  let mutationAnimating = false;
  let mutationUpgrading = false;
  let pendingMutationReveal = null;
  let mutationFeedHoldTimer = 0;
  let mutationFeedHoldStartedAt = 0;
  let mutationFeedHoldActive = false;
  let adminInfiniteResearch = false;
  let adminInfiniteUltimate = false;
  let corePreviewMode = false;
  let tutorialGiftTimer = 0;
  let tutorialCountTimer = 0;
  let tutorialRunTimer = 0;
  let tutorialPointerFlight = null;
  const ONBOARDING_QUESTS = new Set(['','unlock-frost','try-frost','play-frost','evolve-slime']);
  let save = loadSave();
  save.rewards=window.SlimeDailyRewards.normalize(save.rewards,save);
  const { sound, stopSynthMotor, materialRows, stopAllSounds, preloadInterfaceAudio, preloadGameAudio, preloadMineAudio, playUltimateCue, stopUltimateAudio, setMusic } = window.SlimeAudio.createAudioSystem({
    isEnabled: () => save.sound && !platformSuspended && !windowSuspended && !adInFlight,
    mineSound: new URLSearchParams(location.search).get('mine-sound'),
    mineWorld: () => run?.worldId ?? save.world
  });
  let toastTimer = null;
  let dragState = null;
  let activeShopTab = 'skins';
  let wardrobePanel = null;
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
      + Math.min(99, Math.floor(+value.researchUnits || 0) + Math.max(0, Math.floor(+value.researchProgress || 0)));
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
    merged.planetCampaign = PLANETS.normalize(value.planetCampaign, value);
    merged.schemaVersion = defaultSave.schemaVersion;
    for (const obsoleteKey of ['conveyorLevel', 'rerollLevel', 'discoveredFoods', 'revealedSecretFoods', 'pendingEpicBoost', 'foodPity']) {
      delete merged[obsoleteKey];
    }
    delete merged.coins;
    merged.researchUnits = Math.max(0, Math.floor(Number.isFinite(+merged.researchUnits) ? +merged.researchUnits : 0));
    // Preserve the partially filled legacy flask when moving to direct counts.
    merged.researchUnits += clamp(Math.floor(Number.isFinite(+merged.researchProgress) ? +merged.researchProgress : 0), 0, 99);
    merged.researchProgress = 0;
    const legacySave = (+value.schemaVersion || 0) < 24;
    const knownMutationIds = new Set(allMutations().map(mutation => mutation.id));
    merged.unlockedMutations = Array.isArray(value.unlockedMutations)
      ? [...new Set(value.unlockedMutations.filter(id => knownMutationIds.has(id)))]
      : [];
    merged.legacyStarterAccess = legacySave || value.legacyStarterAccess === true;
    if (merged.legacyStarterAccess) {
      merged.unlockedMutations = [...new Set([...STARTER_MUTATIONS.map(mutation => mutation.id), ...merged.unlockedMutations])];
    }
    merged.mutationLevels = {};
    for (const id of merged.unlockedMutations) {
      const previousLevel = Number(value.mutationLevels?.[id]);
      merged.mutationLevels[id] = Number.isFinite(previousLevel)
        ? clamp(Math.floor(previousLevel), 1, 3)
        : 1;
    }
    merged.mutationExperience = PROGRESSION.migrateExperience(value.mutationExperience, merged.unlockedMutations, merged.mutationLevels);
    // Missing choices follow the newest unlocked stage; an explicit older choice stays equipped.
    merged.mutationUltimateStages = {};
    for (const id of merged.unlockedMutations) {
      const choice = Number(value.mutationUltimateStages?.[id]);
      if (Number.isFinite(choice) && choice >= 1) merged.mutationUltimateStages[id] = clamp(Math.floor(choice), 1, merged.mutationLevels[id]);
    }
    merged.mutationMastery = window.SlimeMutationMastery.migrate(value.mutationMastery, merged.unlockedMutations);
    merged.selectedMutation = merged.unlockedMutations.includes(value.selectedMutation) ? value.selectedMutation : merged.unlockedMutations[0] || 'fire';
    const completedLesson = !tutorialEnabled || legacySave || value.tutorialStep === 'done' || merged.unlockedMutations.includes('frost');
    merged.tutorialStep = completedLesson ? 'done' : TUTORIAL_STEPS.has(value.tutorialStep) ? value.tutorialStep : 'feed';
    merged.onboarding = normalizeOnboarding(value.onboarding,merged.tutorialStep);
    merged.onboarding.enabled = !completedLesson;
    merged.tutorialGiftClaimed = true;
    merged.tutorialSecondGiftClaimed = value.tutorialSecondGiftClaimed === true;
    if (!tutorialEnabled) {
      merged.onboarding.quest = '';
      merged.onboarding.pendingMemo = '';
      merged.tutorialSecondGiftClaimed = true;
    }
    if (!completedLesson) {
      if (!merged.unlockedMutations.includes('fire')) merged.unlockedMutations.push('fire');
      merged.mutationLevels.fire = Math.max(1,merged.mutationLevels.fire || 0);
      merged.selectedMutation = 'fire';
      if ((Number(value.onboarding?.version) || 0) < 7) {
        merged.onboarding.controlsLearned = false; merged.onboarding.fireLearned = false; merged.onboarding.hazardLearned = false; merged.onboarding.healLearned=false; merged.onboarding.veinsLearned=false;
        if (merged.mutationLevels.fire >= 2) merged.tutorialStep = merged.researchUnits + merged.mutationProgress >= 50 ? 'frost-home' : 'second-feed';
        else if ((merged.mutationMastery.fire || 0) >= 250) merged.tutorialStep = merged.tutorialSecondGiftClaimed && merged.researchUnits >= 50 ? 'upgrade-home-mutations' : 'second-gift';
        else merged.tutorialStep = 'feed';
        if (merged.mutationLevels.fire < 2 && merged.researchUnits < 50) merged.tutorialSecondGiftClaimed = false;
      }
    }

    const validFormIds = new Set(FORM_INDEX.map(form => form.id));
    merged.discoveredForms = Array.isArray(value.discoveredForms)
      ? [...new Set(value.discoveredForms.filter(id => validFormIds.has(id)))]
      : [];
    for (const id of merged.unlockedMutations) if (merged.mutationLevels[id] === 3 && !merged.discoveredForms.includes(id)) merged.discoveredForms.push(id);
    merged.unseenForms = Array.isArray(value.unseenForms)
      ? [...new Set(value.unseenForms.filter(id => merged.discoveredForms.includes(id)))]
      : [];
    const availableMutationIds = new Set(merged.unlockedMutations);
    const requestedMutationPool = Array.isArray(value.activeMutationPool) ? value.activeMutationPool : defaultSave.activeMutationPool;
    merged.activeMutationPool = [...new Set(requestedMutationPool.filter(id => availableMutationIds.has(id)))].slice(0, 3);
    if (merged.legacyStarterAccess) for (const starter of STARTER_MUTATIONS) {
      if (merged.activeMutationPool.length >= 3) break;
      if (!merged.activeMutationPool.includes(starter.id)) merged.activeMutationPool.push(starter.id);
    }
    if (window.SlimeHomeConsole && merged.activeMutationPool.length) {
      const selected = merged.activeMutationPool.includes(merged.selectedMutation) ? merged.selectedMutation : merged.activeMutationPool[0];
      merged.activeMutationPool = [selected];
      merged.selectedMutation = selected;
    }
    merged.mutationProgress = clamp(Math.floor(Number.isFinite(+merged.mutationProgress) ? +merged.mutationProgress : 0), 0, MUTATION_STEPS * MUTATION_DISCOVERIES.length);
    merged.mutationInvestTapCount = merged.mutationProgress > 0
      ? clamp(Math.floor(Number(value.mutationInvestTapCount) || 0), 0, 1000)
      : 0;
    const requestedWorld = Math.round(+merged.world || 1);
    merged.world = ACTIVE_WORLD_IDS.includes(requestedWorld) ? requestedWorld : requestedWorld === 2 ? 3 : ACTIVE_WORLD_IDS[0];
    if(WORLDS.find(world=>world.id===merged.world)?.comingSoon)merged.world=ACTIVE_WORLD_IDS[0];
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
    merged.worldLastRun = { ...defaultSave.worldLastRun };
    for (const world of WORLDS) {
      merged.worldLastRun[world.id] = clamp(+(value.worldLastRun?.[world.id] || 0), 0, world.targetDepth);
    }
    const legacyWorldIndex = value.worldTrophies ? 0 : Math.max(0, ACTIVE_WORLD_IDS.indexOf(merged.world));
    const legacyUnlockedWorlds = ACTIVE_WORLDS.filter((world, index) => index <= legacyWorldIndex ||
      (index > 0 && +(value.worldBest?.[ACTIVE_WORLDS[index - 1].id] || 0) >= ACTIVE_WORLDS[index - 1].targetDepth)).map(world => world.id);
    merged.unlockedWorlds = [...new Set([ACTIVE_WORLD_IDS[0], ...(Array.isArray(value.unlockedWorlds) ? value.unlockedWorlds : legacyUnlockedWorlds)])]
      .filter(id => ACTIVE_WORLD_IDS.includes(Number(id))).map(Number);
    // Archive old global XP as history, without assigning it to an unrelated slime.
    merged.legacyPlayerExperience = Math.max(0, Math.floor(+(value.legacyPlayerExperience ?? value.playerExperience) || 0));
    if ((+value.schemaVersion || 0) < 29 && Number.isFinite(+value.playerExperience)) {
      for (const [index, world] of ACTIVE_WORLDS.entries()) {
        if (EXPERIENCE.levelForExperience(+value.playerExperience) >= EXPERIENCE.requiredLevelForWorldIndex(index)
            && !merged.unlockedWorlds.includes(world.id)) merged.unlockedWorlds.push(world.id);
      }
    }
    delete merged.playerExperience;
    delete merged.worldTrophies;
    for (let index = 1; index < ACTIVE_WORLDS.length; index += 1) {
      const previous = ACTIVE_WORLDS[index - 1];
      if (merged.worldBest[previous.id] >= previous.targetDepth && !merged.unlockedWorlds.includes(ACTIVE_WORLDS[index].id)) merged.unlockedWorlds.push(ACTIVE_WORLDS[index].id);
    }
    merged.unseenWorlds = [...new Set((Array.isArray(value.unseenWorlds) ? value.unseenWorlds : []).map(Number))]
      .filter(id => id !== ACTIVE_WORLD_IDS[0] && merged.unlockedWorlds.includes(id));
    const finalWorld = ACTIVE_WORLDS[ACTIVE_WORLDS.length - 1];
    merged.gameCompleted = Boolean(value.gameCompleted || (finalWorld && merged.worldBest[finalWorld.id] >= (finalWorld.targetDepth || 500)));
    merged.lastRunDepth = {};
    merged.levelFailures = {};
    for (const world of WORLDS) {
      for (let level = 1; level <= LEVEL_COUNT; level += 1) {
        const key = `${world.id}:${level}`;
        const targetDepth = world.targetDepth || 500;
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
        if (merged.worldBest[world.id] >= (world.targetDepth || 500)) inferredUnlocked = level + 1;
      }
      const unlocked = clamp(Math.max(inferredUnlocked, Math.round(+(value.unlockedLevels?.[world.id] || 1))), 1, LEVEL_COUNT);
      const requested = value.selectedLevels?.[world.id] ?? inferredUnlocked;
      merged.unlockedLevels[world.id] = unlocked;
      merged.selectedLevels[world.id] = clamp(Math.round(+requested || 1), 1, unlocked);
    }
    merged.unlockedSkins = Array.isArray(value.unlockedSkins) ? [...new Set(value.unlockedSkins.filter(id => SKINS.some(skin => skin.id === id)))] : ['classic'];
    if (!merged.unlockedSkins.includes('classic')) merged.unlockedSkins.unshift('classic');
    if (!SKINS.some(skin => skin.id === merged.selectedSkin)) merged.selectedSkin = 'classic';
    merged.wardrobe = window.SlimeWardrobe.normalize(value.wardrobe);
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
    if(merged.activeDraft&&WORLDS.find(world=>world.id===merged.activeDraft.worldId)?.comingSoon)merged.activeDraft={...merged.activeDraft,worldId:merged.world};
    merged.rewards=window.SlimeDailyRewards.normalize(value.rewards,value);
    if (merged.rewards.infinityUnlocked) {
      const legacyStage = merged.rewards.infinityEquipped ? merged.mutationLevels[merged.selectedMutation] : 1;
      merged.mutationLevels.infinity = clamp(Math.floor(Number(value.mutationLevels?.infinity) || legacyStage || 1), 1, 3);
      merged.mutationMastery.infinity = window.SlimeMutationMastery.migrate(value.mutationMastery, ['infinity']).infinity;
    }
    merged.pendingWheel=window.SlimeDailyRewards.normalizePending(value.pendingWheel);
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
    const foodById = id => FOODS.find(food => food.id === id);
    const foods = [];
    for (const id of raw.foods) {
      const food = foodById(id);
      const family = save.rewards.infinityEquipped ? 'infinity' : foodRecipeFamily(food);
      const stagedFood = food && foodForMutation(mutationIdForFamily(family));
      if (canAddToStomach(stagedFood, foods)) foods.push(stagedFood);
    }
    const offer = raw.offer.slice(0, 3).map(id => id ? foodById(id) || null : null);
    while (offer.length < 3) offer.push(null);
    if (!offer.some(Boolean) && !foods.length) return false;
    session = {
      foods, offer,
      offersSeen: Math.max(1, Math.round(+raw.offersSeen || 1)),
      freeRerolls: 1,
      adRerolls: 0,
      healthBoost: clamp(+(raw.healthBoost ?? raw.massBoost) || 0, 0, 100),
      stats: {}, effects: {},
      rerollPending: false,
      offerTransition: false
    };
    const used = foods.map(food => food.id);
    const activeFamilies = activeMutationFamilies();
    session.offer = Array.from({ length: 3 }, (_, index) => {
      const family = activeFamilies[index];
      if (!family) return null;
      const stage = mutationLevelForFamily(family);
      if (stage > 3) return null;
      const current = offer[index];
      const valid = current && foodRecipeFamily(current) === family && current.stage === stage
        && foodAvailableInWorld(current) && !used.includes(current.id);
      const food = valid ? current : randomFood(used, family, stage);
      if (food) used.push(food.id);
      return food;
    });
    if (!foods.length && !session.offer.some(Boolean)) {
      session = null;
      return false;
    }
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
    if (corePreviewMode) return false;
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
    if (corePreviewMode) return false;
    if (!yandexPlatform?.player?.setData) return false;
    if (cloudSaveInFlight) {
      await cloudSaveInFlight.catch(() => {});
      if (corePreviewMode) return false;
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

  function persist({ captureDraft = true, cloud = true, refreshUI = true } = {}) {
    if (corePreviewMode) return;
    if (captureDraft && session && !run) save.activeDraft = serializeSession();
    saveUpdatedAt = Date.now();
    saveRevision += 1;
    writeLocalSave(createSaveEnvelope());
    if (cloud) scheduleCloudSave();
    if (refreshUI) updatePersistentUI();
  }

  function tutorialActive() {
    return tutorialEnabled && save.tutorialStep !== 'done';
  }

  function tutorialTarget() {
    switch (save.tutorialStep) {
      case 'feed': return ['.conveyor-food-pick:not(.locked)','Еда готова! Перетащи её к слайму'];
      case 'play': return menuMutationReveal?null:['#worldStartBtn','Он изменился! Испытаем его в шахте'];
      case 'second-feed': return ['.conveyor-food-pick:not(.locked)','Новая еда — новая форма. Накорми слайма'];
      case 'second-play': return menuMutationReveal?null:['#worldStartBtn','Испытай усиленный Огонь!'];
      case 'upgrade-home-mutations': return ['#homeMutationInfo','Огонь готов к развитию!'];
      case 'upgrade-fire': return [els.panelOverlay.querySelector('.slime-evolution-dialog') ? '#mutationEvolutionConfirmBtn' : '#mutationUpgradeBtn','Открой II стадию: новую форму и суперсилу'];
      case 'upgrade-close-lab': return ['#closePanelBtn','Вернись к слайму'];
      case 'frost-home': return ['.mutation-lab-button','Осколки собраны! Открой лабораторию'];
      case 'frost-reactor': return ['#mutationCapsuleBtn','Добавляй осколки. Зажми, чтобы быстрее'];
      case 'frost-synthesize': return ['#mutationSynthesizeBtn','Создай новую мутацию!'];
      case 'frost-core': return ['#mutationMystery','Посмотри, что получилось'];
      case 'frost-prize': return ['#mutationPrize .mutation-prize-cta','Забери Мороз!'];
      default: return null;
    }
  }

  let tutorialOutlineSource = null;

  function renderTutorialOutline(target) {
    // Measure the painted sprite, rather than its larger invisible hit area.
    const artwork = target.id === 'mutationCapsuleBtn' ? [...target.querySelectorAll('.mutation-machine-art')].find(img => getComputedStyle(img).display !== 'none')
      : target.id === 'mutationMystery' ? target.querySelector('img')
      : target.matches('.conveyor-food-pick') ? target.querySelector('.food-model-wrap img') : null;
    const source = artwork || (target.id==='slime'?target.querySelector('.console-slime-hit'):null) || target;
    if (tutorialOutlineSource !== target) {
      tutorialOutlineSource?.classList.remove('tutorial-outline-source');
      tutorialOutlineSource = target;
      target.classList.add('tutorial-outline-source');
      if(!menuReducedMotion)els.tutorialFocus.animate([{opacity:0},{opacity:1}],{duration:240,easing:'ease-out'});
    }
    const bounds = source.getBoundingClientRect();
    const focus = els.tutorialFocus;
    const image = focus.querySelector('image');
    const edges = focus.querySelectorAll('path');
    const padding = target.id==='worldStartBtn' ? Math.min(4,innerHeight-bounds.bottom-5) : Math.max(6,Math.min(9,bounds.height*.09));
    focus.style.cssText = `left:${bounds.left - padding}px;top:${bounds.top - padding}px;width:${bounds.width + padding * 2}px;height:${bounds.height + padding * 2}px`;
    focus.setAttribute('viewBox', `0 0 ${bounds.width + padding * 2} ${bounds.height + padding * 2}`);
    image.style.display = 'none';
    edges.forEach(edge => { edge.style.display = ''; });
    const style = getComputedStyle(source);
    const w = bounds.width + padding * 2, h = bounds.height + padding * 2;
    const radius = value => {
      const parts = value.split(' ');
      return [parts[0], parts[1] || parts[0]].map((part, axis) => (padding + (
        part.endsWith('%') ? parseFloat(part) * (axis ? bounds.height : bounds.width) / 100
          : parseFloat(part) * (axis ? bounds.height / (source.offsetHeight || bounds.height) : bounds.width / (source.offsetWidth || bounds.width)) || 0)));
    };
    const [a,b,c,d] = [style.borderTopLeftRadius,style.borderTopRightRadius,style.borderBottomRightRadius,style.borderBottomLeftRadius].map(radius);
    const fit=Math.min(1,w/Math.max(1,a[0]+b[0]),w/Math.max(1,c[0]+d[0]),h/Math.max(1,a[1]+d[1]),h/Math.max(1,b[1]+c[1]));
    for(const r of [a,b,c,d]) { r[0]*=fit; r[1]*=fit; }
    if (artwork) [a, b, c, d].forEach(r => { r[0] = r[1] = 14; });
    if (target.id==='slime') [a,b,c,d].forEach(r=>{r[0]=r[1]=16;});
    if (target.id==='homeMutationSelector') [a,b,c,d].forEach(r=>{r[0]=w/2;r[1]=h/2;});
    if (source.id === 'conveyorChoiceCount') [a, b, c, d].forEach(r => { r[0] = r[1] = 10; });
    const corner = (r, x, y) => r[0] && r[1] ? `A${r[0]},${r[1]} 0 0 1 ${x},${y}` : `L${x},${y}`;
    let path = `M${a[0]},0 H${w - b[0]} ${corner(b,w,b[1])} V${h - c[1]} ${corner(c,w-c[0],h)} H${d[0]} ${corner(d,0,h-d[1])} V${a[1]} ${corner(a,a[0],0)} Z`;
    // CSS polygon outlines need the same vertices, not a rectangular border.
    if (!artwork && style.clipPath.startsWith('polygon(')) {
      const points = style.clipPath.slice(8,-1).split(',').map(point => point.trim().split(/\s+/).map((v,i) => parseFloat(v) * (v.endsWith('%') ? (i ? h : w) / 100 : 1)));
      if (points.every(point => point.length === 2 && point.every(Number.isFinite))) {
        const corners = points.map((point, index) => {
          const previous = points[(index + points.length - 1) % points.length], next = points[(index + 1) % points.length];
          const approach = other => { const length = Math.hypot(other[0] - point[0], other[1] - point[1]); const t = Math.min(.5, 6 / Math.max(1, length)); return point.map((v, i) => v + (other[i] - v) * t); };
          return { point, before: approach(previous), after: approach(next) };
        });
        path = `M${corners[0].before.join(',')} ${corners.map(corner => `Q${corner.point.join(',')} ${corner.after.join(',')} L${corners[(corners.indexOf(corner) + 1) % corners.length].before.join(',')}`).join(' ')} Z`;
      }
    }
    edges.forEach(edge => edge.setAttribute('d', path));
    return bounds;
  }

  function renderTutorial() {
    if (!els.tutorialLayer) return;
    // Keep the old scripted introduction paused while the new planet flow is
    // being assembled. This must not advance or reset the saved lesson.
    if (window.SlimeHomeConsole?.tutorialSuspended && document.body.dataset.screen === 'home') {
      for (const id of ['tutorialLayer','tutorialGift','tutorialMemo','tutorialControls','tutorialUpgradeSummary','tutorialDodge','tutorialSkipBtn','tutorialAdminBtn']) {
        if (els[id]) els[id].hidden = true;
      }
      return;
    }
    maybeStartTutorialIntroduction();
    const active = tutorialActive();
    renderOnboardingQuest();
    const adminOpen = !els.adminToolsOverlay?.classList.contains('hidden');
    const runMenuOpen = !els.runMenuOverlay?.classList.contains('hidden');
    const suspended = adminOpen || runMenuOpen;
    if (els.tutorialSkipBtn) els.tutorialSkipBtn.hidden = !active;
    if (els.tutorialRunSkipBtn) els.tutorialRunSkipBtn.hidden = !active;
    const needsAdminAccess = els.app.inert || ['gift', 'second-gift', 'upgrade-summary'].includes(save.tutorialStep) || Boolean(tutorialMemoState);
    if (els.tutorialAdminBtn) els.tutorialAdminBtn.hidden = (!active && !tutorialMemoState) || suspended || !needsAdminAccess || document.body.dataset.screen === 'drop';
    if (els.tutorialAdminBtn && !els.tutorialAdminBtn.hidden && els.adminMenuBtn) {
      const gear = els.adminMenuBtn.getBoundingClientRect();
      els.tutorialAdminBtn.style.cssText = `left:${gear.left}px;top:${gear.top}px;right:auto;width:${gear.width}px;height:${gear.height}px`;
    }
    if (els.tutorialPauseBtn) els.tutorialPauseBtn.hidden = (!active && !tutorialMemoState) || suspended || document.body.dataset.screen !== 'drop' || (!['controls','dodge'].includes(save.tutorialStep) && !tutorialMemoState);
    if (els.tutorialPauseBtn && !els.tutorialPauseBtn.hidden && els.endRunBtn) {
      const pause = els.endRunBtn.getBoundingClientRect();
      els.tutorialPauseBtn.style.cssText = `left:${pause.left}px;top:${pause.top}px;width:${pause.width}px;height:${pause.height}px`;
    }
    if (els.tutorialGift) {
      els.tutorialGift.hidden = !active || suspended || save.tutorialStep !== 'second-gift';
      if (!els.tutorialGift.hidden) {
        const amount = 50;
        els.tutorialGift.setAttribute('aria-label', `Подарок: ${amount} осколков`);
        const label = els.tutorialGift.querySelector('.tutorial-gift-amount');
        if (label) label.textContent = `${amount} ОСКОЛКОВ`;
        els.tutorialGift.querySelector('strong').textContent = 'НА РАЗВИТИЕ!';
      }
    }
    if (els.tutorialControls) els.tutorialControls.hidden = !active || suspended || save.tutorialStep !== 'controls';
    if (els.tutorialUpgradeSummary) els.tutorialUpgradeSummary.hidden = !active || suspended || save.tutorialStep !== 'upgrade-summary';
    if (els.tutorialMemo) els.tutorialMemo.hidden = !tutorialMemoState || suspended;
    if (els.tutorialDodge) els.tutorialDodge.hidden = save.tutorialStep !== 'dodge' || suspended;
    const hint = !suspended && run && !run.ended && !run.paused ? run.tutorialHint : null;
    const worldTarget = tutorialMemoState?.focus && positionTutorialWorldTarget(tutorialMemoState.focus);
    const intro=window.SlimeTutorialIntro;
    const abilityTarget = run?.elementalAbilityType === 'fire' ? '#fallAttackBtn' : '#abilityBtn';
    const instruction = intro?.active ? intro.instruction : hint?.kind === 'ability' ? [abilityTarget,''] : !suspended && worldTarget ? ['#tutorialWorldTarget', ''] : !suspended && tutorialMemoState?.kind === 'development' ? ['#homeMutationInfo', ''] : tutorialMemoState?.kind === 'ability' && !suspended ? [abilityTarget, ''] : active && !suspended && !tutorialMemoState && !hint ? tutorialTarget() : null;
    els.tutorialPointer.hidden = Boolean(worldTarget) || (Boolean(tutorialMemoState) && tutorialMemoState.kind !== 'ability');
    if(intro?.active)els.tutorialPointer.hidden=!intro.pointerVisible;
    els.tutorialCaption.hidden = Boolean(tutorialMemoState || hint || intro?.active);
    positionOnboardingMemo();
    const target = instruction ? document.querySelector(instruction[0]) : null;
    if (!target || !target.getClientRects().length) {
      els.tutorialLayer.hidden = true;
      tutorialOutlineSource?.classList.remove('tutorial-outline-source');
      tutorialOutlineSource = null;
      tutorialPointerFlight?.cancel();
      tutorialPointerFlight = null;
      return;
    }
    const bounds = renderTutorialOutline(target);
    if (bounds.height < innerHeight - 24 && (bounds.top < 0 || bounds.bottom > innerHeight)) {
      target.scrollIntoView({ block: 'center' });
      requestAnimationFrame(renderTutorial);
      return;
    }
    els.tutorialLayer.hidden = false;
    const top = bounds.top;
    const bottom = bounds.bottom;
    if(els.tutorialCaption.dataset.copy!==instruction[1]){
    els.tutorialCaption.dataset.copy=instruction[1];els.tutorialCaption.replaceChildren();
    instruction[1].split(/(Огонь|Огня|Играть|10 осколков|2 стадию|два огненных блюда|еду|мутации|эмблему|синтез)/g).forEach((part, index) => {
      if (!part) return;
      const word = document.createElement(index % 2 ? 'b' : 'span');
      word.textContent = part;
      els.tutorialCaption.append(word);
    });
    }
    const captionWidth = els.tutorialCaption.offsetWidth;
    const captionHeight = els.tutorialCaption.offsetHeight;
    const captionAbove = bottom + captionHeight + 24 > innerHeight;
    els.tutorialCaption.style.left = `${Math.max(8, Math.min(innerWidth - captionWidth - 8, bounds.left + bounds.width / 2 - captionWidth / 2))}px`;
    els.tutorialCaption.style.top = `${captionAbove ? Math.max(8, top - captionHeight - 16) : Math.min(innerHeight - captionHeight - 8, bottom + 16)}px`;
    tutorialPointerFlight?.cancel();
    tutorialPointerFlight = null;
    els.tutorialLayer.classList.toggle('is-dragging', !intro?.active&&['feed','second-feed'].includes(save.tutorialStep));
    const pointerTipX = 6;
    const pointerTipY = 11;
    const pointerX = bounds.left + bounds.width * (intro?.active&&target.id==='slime' ? .70 : .5) - pointerTipX;
    const pointerY = bounds.top + bounds.height * (intro?.active&&target.id==='slime' ? .68 : .5) - pointerTipY;
    els.tutorialPointer.style.left = `${pointerX}px`;
    els.tutorialPointer.style.top = `${pointerY}px`;
    if (!intro?.active && ['feed','second-feed'].includes(save.tutorialStep) && els.slime?.getClientRects().length && !menuReducedMotion) {
      const slimeRect = els.slime.getBoundingClientRect();
      const dx = slimeRect.left + slimeRect.width / 2 - (pointerX + pointerTipX);
      const dy = slimeRect.top + slimeRect.height / 2 - (pointerY + pointerTipY);
      tutorialPointerFlight = els.tutorialPointer.animate([
        { transform: 'translate(0,0) scale(.88)' },
        { transform: 'translate(0,0) scale(1)', offset: .22 },
        { transform: `translate(${dx}px,${dy}px) scale(.88)`, offset: .7 },
        { transform: 'translate(0,0) scale(.88)' }
      ], { duration: 1900, iterations: Infinity, easing: 'ease-in-out' });
    }
  }

  function queueTutorialRender() {
    if (tutorialActive() || tutorialMemoState) requestAnimationFrame(renderTutorial);
  }

  function setTutorialStep(step) {
    if (!TUTORIAL_STEPS.has(step) || save.tutorialStep === step) return;
    save.tutorialStep = step;
    persist({ refreshUI: false });
    queueTutorialRender();
  }

  function tutorialInputAllowed(target) {
    if (!tutorialActive() && !tutorialMemoState) return true;
    if (!(target instanceof Element)) return false;
    if (target.closest('#tutorialAdminBtn,#tutorialPauseBtn,#adminMenuBtn,#endRunBtn')) return true;
    if (!els.adminToolsOverlay?.classList.contains('hidden')) return !tutorialActive() || Boolean(target.closest('#tutorialSkipBtn,#closeAdminToolsBtn'));
    if (!els.runMenuOverlay?.classList.contains('hidden')) return Boolean(target.closest('#runMenuOverlay'));
    if(window.SlimeTutorialIntro?.active)return Boolean(target.closest(window.SlimeTutorialIntro.instruction?.[0]||'.tutorial-no-target'));
    if (run?.ended && target.closest('#resultOverlay,#gameCompleteOverlay')) return true;
    if (run?.tutorialPhase && !run.ended && !tutorialMemoState && document.body.dataset.screen === 'drop') return true;
    if (tutorialMemoState) return Boolean(target.closest(tutorialMemoState.kind === 'ability' ? '#abilityBtn' : '#tutorialMemoNext'));
    const step = save.tutorialStep;
    if (step === 'upgrade-fire' && els.panelOverlay.querySelector('.slime-evolution-dialog')) return Boolean(target.closest('.slime-evolution-dialog'));
    if (step === 'gift' || step === 'second-gift') return Boolean(target.closest('#tutorialGiftClaimBtn'));
    if (step === 'second-run') return document.body.dataset.screen === 'drop';
    if (step === 'post-run') return document.body.dataset.screen === 'drop';
    const instruction = tutorialTarget();
    const allowedSelector = ['core','frost-core'].includes(step) ? '#mutationMystery'
      : ['prize','frost-prize'].includes(step) ? '#mutationPrize'
      : ['feed','second-feed'].includes(step) ? '.conveyor-food-pick:not(.locked),#slime'
      : instruction?.[0];
    return Boolean(allowedSelector && target.closest(allowedSelector));
  }

  function blockTutorialInput(event) {
    if(window.SlimeTutorialIntro?.active&&els.adminToolsOverlay.classList.contains('hidden')&&!event.target.closest?.('#tutorialAdminBtn,#adminMenuBtn')){
      if(event.type==='pointerdown'||(event.type==='click'&&event.detail===0))window.SlimeTutorialIntro.accept(event.target);
      event.preventDefault();event.stopImmediatePropagation();return;
    }
    if(tutorialMemoState?.kind==='controls'&&event.target.closest?.('#fallLeftBtn,#fallRightBtn'))return;
    if (tutorialMemoState?.kind === 'ability' && event.target.closest?.('#abilityBtn')) return;
    if (tutorialMemoState && els.adminToolsOverlay.classList.contains('hidden') && els.runMenuOverlay.classList.contains('hidden')
        && !event.target.closest?.('#tutorialAdminBtn,#tutorialPauseBtn,#adminMenuBtn,#endRunBtn')) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.type === 'click' && event.target.closest?.('#tutorialMemoNext')) closeOnboardingMemo();
      return;
    }
    if ((!tutorialActive() && !tutorialMemoState) || tutorialInputAllowed(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function blockTutorialKey(event) {
    if(window.SlimeTutorialIntro?.active&&els.adminToolsOverlay.classList.contains('hidden')&&!document.activeElement?.closest?.('#tutorialAdminBtn,#adminMenuBtn')){
      if(event.key==='Tab')return;
      if(['Enter',' ','Spacebar'].includes(event.key)&&!event.repeat)window.SlimeTutorialIntro.accept(document.activeElement);
      event.preventDefault();event.stopImmediatePropagation();return;
    }
    if (!tutorialActive() && !tutorialMemoState) return;
    if(tutorialMemoState?.kind==='controls'&&fallDirectionForKey(event.code||event.key))return;
    if (!tutorialMemoState && save.tutorialStep === 'upgrade-fire' && els.panelOverlay.querySelector('.slime-evolution-dialog')) return;
    if (tutorialMemoState && ['Enter',' '].includes(event.key)) {
      if (tutorialMemoState.kind === 'ability' && document.activeElement === els.abilityBtn) return;
      event.preventDefault(); if (!['ability','controls'].includes(tutorialMemoState.kind)) closeOnboardingMemo(); return;
    }
    if (!tutorialMemoState && run?.tutorialPhase && document.body.dataset.screen === 'drop') return;
    if (event.key === 'Tab') return;
    if (event.key === 'Escape') {
      if (!els.adminToolsOverlay?.classList.contains('hidden') || !els.runMenuOverlay?.classList.contains('hidden')) return;
    } else if (['Enter', ' ', 'Spacebar'].includes(event.key) && tutorialInputAllowed(document.activeElement)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function claimTutorialGift() {
    const secondGift = true;
    if (save.tutorialStep !== 'second-gift') return;
    const source = els.tutorialGift?.querySelector('img')?.getBoundingClientRect();
    const target = $('#mutationPanelBalance')?.getBoundingClientRect() || els.researchUnitsLabel?.getBoundingClientRect();
    const before = save.researchUnits;
    const amount = secondGift ? 50 : 10;
    const creditStep = secondGift ? 'second-gift-credit' : 'gift-credit';
    save.researchUnits += amount;
    if (secondGift) save.tutorialSecondGiftClaimed = true;
    else save.tutorialGiftClaimed = true;
    setTutorialStep(creditStep);
    for (let index = 0; index < 5; index += 1) {
      const flask = document.createElement('img');
      flask.className = 'tutorial-flask-flight';
      flask.src = versionedAsset('assets/ui/anomaly-core-v56/currency.webp');
      flask.alt = '';
      flask.style.left = `${source?.left || innerWidth / 2}px`;
      flask.style.top = `${source?.top || innerHeight / 2}px`;
      document.body.appendChild(flask);
      const dx = (target?.left || innerWidth / 2) - (source?.left || innerWidth / 2);
      const dy = (target?.top || 20) - (source?.top || innerHeight / 2);
      const duration = menuReducedMotion ? 70 : 480;
      const flight = flask.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 0 },
        { transform: 'translate(0,0) scale(1.1)', opacity: 1, offset: .2 },
        { transform: `translate(${dx}px,${dy}px) scale(.35)`, opacity: 1 }
      ], { duration, delay: index * (menuReducedMotion ? 15 : 110), easing: 'ease-in', fill: 'forwards' });
      flight.finished.catch(() => {}).finally(() => {
        flask.remove();
        if (save.tutorialStep !== creditStep) return;
        const shown = before + (index + 1) * (amount / 5);
        if (els.researchUnitsLabel) els.researchUnitsLabel.textContent = String(shown);
        const panelBalance = $('#mutationPanelBalance');
        if (panelBalance) panelBalance.textContent = String(shown);
        for (const counter of [els.researchUnitsLabel, panelBalance]) {
          if (!counter) continue;
          counter.classList.remove('tutorial-credit-pop');
          void counter.offsetWidth;
          counter.classList.add('tutorial-credit-pop');
        }
        if (index === 4 && save.tutorialStep === creditStep) {
          if (!secondGift) renderRecipesPanel();
          updatePersistentUI();
          setTutorialStep(secondGift ? 'upgrade-home-mutations' : 'reactor');
        }
      });
    }
  }

  function skipTutorial() {
    window.SlimeTutorialIntro?.cancel();
    if (!tutorialActive()) return;
    clearTimeout(tutorialGiftTimer);
    clearTimeout(tutorialCountTimer);
    clearTimeout(tutorialRunTimer);
    tutorialPointerFlight?.cancel();
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    pendingMutationReveal = null;
    save.unlockedMutations = [...new Set([...(save.unlockedMutations || []), 'fire', 'frost'])];
    save.mutationLevels = { ...(save.mutationLevels || {}), fire: Math.max(1, save.mutationLevels?.fire || 0), frost: Math.max(1, save.mutationLevels?.frost || 0) };
    save.mutationExperience = PROGRESSION.migrateExperience(save.mutationExperience, save.unlockedMutations, save.mutationLevels);
    save.activeMutationPool = ['fire', 'frost'];
    save.mutationProgress = 0;
    save.mutationInvestTapCount = 0;
    save.tutorialGiftClaimed = true;
    save.tutorialSecondGiftClaimed = true;
    save.tutorialStep = 'done';
    save.onboarding = { ...normalizeOnboarding(null, 'done'), enabled: false };
    tutorialMemoState = null;
    if (run) {
      run.tutorialPhase = 0; run.tutorialHint = null;
      $('#tutorialRunHint').hidden = true; $('#tutorialRunGoal').hidden = true; $('#tutorialSteeringDemo').hidden=true;
      if (run.damageInvulnerableUntil === Infinity) run.damageInvulnerableUntil = performance.now() + 400;
    }
    // Skipping never removes earned flasks.
    persist();
    renderTutorial();
    if (!els.adminToolsOverlay.classList.contains('hidden')) closeAdminTools();
    if (!els.panelOverlay.classList.contains('hidden')) closePanel();
    if (run && !run.ended && document.body.dataset.screen === 'drop') {
      if (!els.runMenuOverlay.classList.contains('hidden')) hideRunMenu();
      if (run.paused) resumeRun();
    } else newDraft();
    showToast('Обучение пропущено · Огонь и Мороз открыты');
  }

  let tutorialMemoState = null;
  let onboardingMemoTimer = 0;

  function normalizeOnboarding(value, step) {
    const result = {version:7,enabled:step !== 'done',quest:'',pendingMemo:''};
    for (const key of ['introSeen','firstRunFinished','secondRunFinished','controlsLearned','fireLearned','hazardLearned','healLearned','veinsLearned','developmentSeen','stageSeen','abilityLearned']) result[key] = value?.[key] === true;
    return result;
  }

  function tutorialIntroductionNeeded(){
    return save.tutorialStep==='feed'&&!save.onboarding.introSeen&&!save.onboarding.controlsLearned&&!save.onboarding.firstRunFinished&&!save.totalRuns&&slimeTaskCount('fire')===0&&mutationLevel('fire')===1;
  }

  function maybeStartTutorialIntroduction(){
    if (window.SlimeHomeConsole?.tutorialSuspended) return;
    if(!window.SlimeTutorialIntro||window.SlimeTutorialIntro.active||!document.documentElement.classList.contains('app-ready'))return;
    if(!tutorialIntroductionNeeded()||!session||session.foods.length||run){delete document.body.dataset.tutorialIntro;return;}
    window.SlimeTutorialIntro.start({
      valid:()=>tutorialIntroductionNeeded()&&!session?.foods.length&&!run,
      suspended:()=>document.hidden||document.body.dataset.screen!=='home'||!els.adminToolsOverlay.classList.contains('hidden')||!els.panelOverlay.classList.contains('hidden'),
      synthesize:()=>window.SlimeHomeConsole.flashFood(),
      pose:kind=>{
        els.slime.classList.toggle('intro-friendly',kind==='hello');
        els.slime.classList.toggle('intro-greeting',kind==='greeting');
        els.slime.classList.toggle('portal-surprised',['surprised','curious'].includes(kind));
        els.slime.classList.toggle('pleased',kind==='greeting');
        if(kind==='surprised'||kind==='curious'){
          const r=$(kind==='curious'?'#foodChoices':'#homeMutationSelector').getBoundingClientRect();setMenuGazePoint(r.left+r.width/2,r.top+r.height/2);
        }else resetMenuGaze();
      },
      changed:()=>queueTutorialRender(),sound,complete:()=>{
        save.onboarding.introSeen=true;persist({refreshUI:false});
        renderHomeConsole();releaseConveyorControl();renderTutorial();
      }
    });
  }

  function showOnboardingMemo(title, markup, next, { dim = false, kind = '', focus = null, waitMs = 650, action = 'ДАЛЕЕ' } = {}) {
    if (tutorialMemoState) return false;
    tutorialMemoState = { next, kind, focus, readyAt: performance.now() + waitMs, timer: 0 };
    const memo = tutorialMemoState;
    $('#tutorialMemoTitle').textContent = title;
    $('#tutorialMemoContent').innerHTML = markup;
    els.tutorialMemo.dataset.kind = kind;
    els.tutorialMemo.setAttribute('aria-modal',String(kind!=='controls'));
    const card = els.tutorialMemo.querySelector('.tutorial-memo-card');
    const narrator = card.querySelector('.tutorial-narrator');
    if (narrator) {
      const pose = kind === 'fire' || kind === 'crossing' || title.includes('форма') ? 'happy' : 'explain';
      const portraits = { explain:'assets/ui/tutorial/narrator-explain-v1.webp', happy:'assets/ui/tutorial/narrator-happy-v1.webp' };
      narrator.src = versionedAsset(portraits[pose]);
    }
    card.style.removeProperty('left'); card.style.removeProperty('top');
    els.tutorialMemo.classList.toggle('is-dimmed', dim);
    $('#tutorialMemoNext').textContent = action;
    $('#tutorialMemoNext').disabled = true;
    $('#tutorialMemoNext').hidden = true;
    tutorialMemoState.timer = setTimeout(() => {
      if (tutorialMemoState !== memo) return;
      $('#tutorialMemoNext').disabled = false;
      $('#tutorialMemoNext').hidden = ['ability','controls'].includes(memo.kind);
      renderTutorial();
    }, waitMs);
    renderTutorial();
    sound('uiOpen'); feedback(4);
    return true;
  }

  function positionOnboardingMemo() {
    if (!tutorialMemoState) return;
    const anchor = tutorialMemoState.focus ? positionTutorialWorldTarget(tutorialMemoState.focus)
      : tutorialMemoState.kind === 'ability' ? els.abilityBtn
      : tutorialMemoState.kind === 'development' ? $('#homeMutationInfo') : null;
    if (!anchor) return;
    const bounds = anchor.getBoundingClientRect();
    const card = els.tutorialMemo.querySelector('.tutorial-memo-card');
    const rect = { width: card.offsetWidth, height: card.offsetHeight };
    card.style.left = `${Math.max(12, Math.min(innerWidth - rect.width - 12, bounds.left + bounds.width / 2 - rect.width / 2))}px`;
    const above = bounds.top - rect.height - 20;
    const below = bounds.bottom + 20;
    card.style.top = `${Math.max(12, Math.min(innerHeight - rect.height - 12, above >= 12 ? above : below))}px`;
  }

  function positionTutorialWorldTarget(block) {
    if (!run || !block) return null;
    let target = $('#tutorialWorldTarget');
    if (!target) { target = document.createElement('span'); target.id = 'tutorialWorldTarget'; target.setAttribute('aria-hidden','true'); document.body.append(target); }
    const canvas = els.canvas.getBoundingClientRect();
    target.style.cssText = `position:fixed;pointer-events:none;border-radius:8px;left:${canvas.left + block.x * canvas.width / VIEW_W}px;top:${canvas.top + (block.y - run.cameraY) * canvas.height / VIEW_H}px;width:${block.w * canvas.width / VIEW_W}px;height:${block.h * canvas.height / VIEW_H}px`;
    return target;
  }

  function tutorialWorldBounds(block){
    const canvas=els.canvas.getBoundingClientRect(),sx=canvas.width/VIEW_W,sy=canvas.height/VIEW_H;
    const left=canvas.left+block.x*sx,top=canvas.top+(block.y-run.cameraY)*sy,width=block.w*sx,height=block.h*sy;
    return {left,top,width,height,right:left+width,bottom:top+height};
  }

  function dismissTutorialControlsFromMovement(timestamp=performance.now()){
    if(tutorialMemoState?.kind!=='controls'||timestamp<tutorialMemoState.readyAt)return false;
    closeOnboardingMemo();return true;
  }

  function closeOnboardingMemo(force = false) {
    const memo = tutorialMemoState;
    if (!memo || (force !== true && performance.now() < memo.readyAt)) return;
    clearTimeout(memo.timer);
    tutorialMemoState = null;
    els.tutorialMemo.hidden = true;
    const card = els.tutorialMemo.querySelector('.tutorial-memo-card');
    card.style.removeProperty('left'); card.style.removeProperty('top');
    sound('uiClose'); feedback(3);
    memo.next?.();
    renderTutorial();
    queueOnboardingMemo();
  }

  function showTutorialStage() {
    if (save.onboarding.stageSeen) return;
    showOnboardingMemo('Огонь стал сильнее!', '<p><b>Огонь горит быстрее.</b> Обычные блоки сгорают дотла.</p><p class="tutorial-memo-small">На III форме откроется феникс.</p>', () => {
      save.onboarding.stageSeen = true; persist({refreshUI:false});
    }, {kind:'evolution'});
  }

  function finishTutorial() { closeOnboardingMemo(); }
  function finishUpgradeTutorial() { closeOnboardingMemo(); }

  function tutorialObjectVisible(block, margin = 0) {
    if (!run || !block || block.dead) return false;
    const canvas = els.canvas.getBoundingClientRect();
    const hud = document.querySelector('.shaft-hud')?.getBoundingClientRect();
    const goal = $('#tutorialRunGoal');
    const top = Math.max(canvas.top + 100 * canvas.height / VIEW_H,hud?.bottom || 0);
    const y = canvas.top + (block.y - run.cameraY) * canvas.height / VIEW_H;
    const bottom = canvas.top + (block.y + block.h - run.cameraY) * canvas.height / VIEW_H;
    return y >= top + margin && bottom <= canvas.bottom - 25;
  }

  function setTutorialRunHint(kind, title, text, {focus = null, duration = 6500} = {}) {
    if (!run || run.ended || run.tutorialHint) return false;
    run.tutorialHint = {kind,title,text,focus,until:(run.tutorialLessonTime || 0) + duration};
    run.tutorialHintFadeUntil=0;
    const card = $('#tutorialRunHint');
    card.classList.remove('is-leaving');
    card.dataset.kind = kind;
    card.querySelector('strong').textContent = title;
    card.querySelector('p').textContent = text;
    card.querySelector('img').src = versionedAsset(kind === 'success' ? 'assets/ui/tutorial/narrator-happy-v1.webp' : 'assets/ui/tutorial/narrator-explain-v1.webp');
    card.hidden = false;
    card.classList.remove('is-entering'); void card.offsetWidth; card.classList.add('is-entering');
    queueTutorialRender();
    return true;
  }

  function clearTutorialRunHint() {
    const previous=run?.tutorialHint;
    if (run) {
      run.tutorialHint=null;
      run.tutorialHintFadeUntil=(run.tutorialLessonTime||0)+320;
      run.tutorialHintGapUntil=(run.tutorialLessonTime||0)+3500;
      if(previous?.kind==='plasma'&&!run.tutorialGoalAvailable)run.tutorialGoalRevealAt=(run.tutorialLessonTime||0)+1100;
    }
    $('#tutorialRunHint').classList.add('is-leaving');
    queueTutorialRender();
  }

  function revealTutorialRunGoal() {
    if(!run)return;
    run.tutorialGoalAvailable=true;
    run.tutorialGoalExpandedUntil=(run.tutorialLessonTime||0)+3800;
    run.tutorialGoalPosition=null;
    updateRunUI();
    if(!menuReducedMotion)$('#tutorialRunGoal').animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'});
  }

  function positionTutorialRunGoal() {
    const goal=$('#tutorialRunGoal');
    if(!run||goal.hidden||document.body.dataset.screen!=='drop')return;
    const canvas=els.canvas.getBoundingClientRect(),hud=document.querySelector('.run-top-hud').getBoundingClientRect();
    const scale=canvas.height/VIEW_H;
    const x=canvas.left+run.slime.x*canvas.width/VIEW_W,y=canvas.top+(run.slime.y-run.cameraY)*scale;
    const rx=run.slime.radius*scale*1.8+16,ry=run.slime.radius*scale*2.1+16;
    const hero={left:x-rx,right:x+rx,top:y-ry,bottom:y+ry};
    const expanded=(run.tutorialLessonTime||0)<(run.tutorialGoalExpandedUntil||0);
    const mode=expanded?'expanded':'mini',previous=run.tutorialGoalPosition;
    const before=previous&&previous.mode!==mode?goal.getBoundingClientRect():null;
    goal.classList.toggle('is-expanded',expanded);goal.classList.toggle('is-mini',!expanded);
    if(expanded){
      const width=Math.min(330,canvas.width-24);
      goal.style.width=`${width}px`;goal.style.left=`${canvas.left+(canvas.width-width)/2}px`;
      const height=goal.offsetHeight,safeTop=hud.bottom+12;
      const ability=(els.abilityBtn.parentElement.hidden ? els.fallAttackBtn : els.abilityBtn).getBoundingClientRect();
      const bottom=Math.min(canvas.bottom-15,ability.height ? ability.top-12 : canvas.bottom-20);
      const candidates=[previous?.mode===mode?previous.top:null,safeTop,hero.bottom+18,hero.top-height-18,bottom-height].filter(Number.isFinite);
      const clear=candidates.find(top=>top>=safeTop&&top+height<=bottom&&(top+height<=hero.top||top>=hero.bottom));
      goal.style.top=`${Math.max(safeTop,Math.min(bottom-height,clear??hero.bottom+18))}px`;
    }else{
      goal.style.width='90px';
      if(!run.tutorialGoalDockSide)run.tutorialGoalDockSide=x<canvas.left+canvas.width/2?'right':'left';
      goal.style.left=`${run.tutorialGoalDockSide==='right'?canvas.right-102:canvas.left+12}px`;
      const lastTop=previous?.mode===mode?previous.top:hud.bottom+6;
      const left=parseFloat(goal.style.left),height=goal.offsetHeight;
      const low=hud.bottom+6,high=canvas.bottom-height-120;
      const horizontal=left<hero.right&&left+90>hero.left;
      const candidates=[clamp(lastTop,low,high),low,hero.bottom+12,hero.top-height-12];
      const top=candidates.find(top=>top>=low&&top<=high&&(!horizontal||top+height<=hero.top||top>=hero.bottom));
      goal.style.top=`${top??low}px`;
    }
    const top=parseFloat(goal.style.top),left=parseFloat(goal.style.left);
    run.tutorialGoalPosition={mode,top,left};
    if(before&&!menuReducedMotion){
      run.tutorialGoalMotion?.cancel();
      run.tutorialGoalMotion=goal.animate([{transform:`translate(${before.left-left}px,${before.top-top}px)`,opacity:.65},{transform:'none',opacity:1}],{duration:420,easing:'cubic-bezier(.22,.7,.3,1)'});
    }
  }

  function positionTutorialRunHint() {
    const card = $('#tutorialRunHint'), hint = run?.tutorialHint;
    if (!run || run.ended || document.body.dataset.screen !== 'drop') { card.hidden = true; return; }
    if(!hint){card.hidden=run.paused||(run.tutorialLessonTime||0)>=(run.tutorialHintFadeUntil||0);return;}
    card.hidden = run.paused || !els.runMenuOverlay.classList.contains('hidden');
    if (card.hidden) return;
    const shaft = els.canvas.getBoundingClientRect(), goal = $('#tutorialRunGoal').getBoundingClientRect();
    const safeTop = Math.max(shaft.top+90*shaft.height/VIEW_H,!$('#tutorialRunGoal').hidden&&!$('#tutorialRunGoal').classList.contains('is-mini') ? goal.bottom+12 : 0);
    const width = Math.min(330,shaft.width-24,innerWidth-24);
    card.style.width = `${width}px`;
    card.style.left = `${Math.max(12,shaft.left+(shaft.width-width)/2)}px`;
    const height = card.offsetHeight;
    const ability = (els.abilityBtn.parentElement.hidden ? els.fallAttackBtn : els.abilityBtn).getBoundingClientRect();
    const safeBottom = Math.min(innerHeight-12,ability.height ? ability.top-14 : shaft.bottom-20);
    const target = hint.focus && !hint.focus.dead ? tutorialWorldBounds(hint.focus) : null;
    const scale=shaft.height/VIEW_H, slimeY=shaft.top+(run.slime.y-run.cameraY)*scale;
    const radius=run.slime.radius*scale+15;
    const occupied=[{top:slimeY-radius,bottom:slimeY+radius},...(target?[{top:target.top-12,bottom:target.bottom+12}]:[])];
    // Retain a readable position while it is safe instead of chasing the target.
    const candidates=[hint.top,safeBottom-height,safeTop,slimeY+radius+18,slimeY-radius-height-18].filter(Number.isFinite);
    const valid=candidates.filter(top=>top>=safeTop&&top+height<=safeBottom);
    const clear=valid.find(top=>occupied.every(r=>top+height<=r.top||top>=r.bottom));
    const score=top=>occupied.reduce((sum,r)=>sum+Math.max(0,Math.min(top+height,r.bottom)-Math.max(top,r.top)),0);
    const top=clear ?? valid.sort((a,b)=>score(a)-score(b))[0] ?? safeTop;
    const nextTop=Math.max(12,Math.min(innerHeight-height-12,top));
    if(Number.isFinite(hint.top)&&Math.abs(nextTop-hint.top)>12&&!menuReducedMotion){
      card.animate([{transform:`translateY(${hint.top-nextTop}px)`},{transform:'none'}],{duration:320,easing:'ease-out'});
    }
    hint.top=nextTop;card.style.top=`${nextTop}px`;
  }

  function updateTutorialRun(timestamp) {
    if (!run?.tutorialPhase || run.ended || !save.onboarding.enabled) return false;
    const flags = save.onboarding, elapsed = run.tutorialElapsed;
    if(tutorialMemoState?.kind==='controls'&&(fallDirectionHeld('left')||fallDirectionHeld('right')))dismissTutorialControlsFromMovement(timestamp);
    run.tutorialLessonTime = (run.tutorialLessonTime || 0) + (tutorialMemoState?.kind==='controls'?0:Math.min(50,Math.max(0,timestamp-(run.tutorialLessonAt || timestamp))));
    run.tutorialLessonAt = timestamp;
    const lessonTime = run.tutorialLessonTime;
    const learned=key=>{flags[key]=true;persist({refreshUI:false,captureDraft:false});};
    if(run.tutorialHint&&(lessonTime>=run.tutorialHint.until||(run.tutorialHint.kind==='ability'&&flags.abilityLearned)))clearTutorialRunHint();
    if(run.tutorialHint?.focus?.dead)run.tutorialHint.focus=null;
    const busy=Boolean(run.tutorialHint)||lessonTime<(run.tutorialHintGapUntil||0);
    if(run.tutorialPhase===1){
      if(!flags.controlsLearned&&!run.tutorialControlsPresented&&elapsed>450&&timestamp>=(run.launchEntryUntil||0)){
        run.tutorialControlsPresented=true;
        const help=`<div class="tutorial-control-keys"><kbd>←</kbd><kbd>→</kbd></div><p>${isMobileDevice()?'Удерживай стрелку внизу, чтобы лететь <b>влево или вправо</b>.':'Направляй слайма <b>стрелками или A и D</b>.'}</p>`;
        clearFallSteering();
        showOnboardingMemo('Направляй слайма',help,()=>{
          learned('controlsLearned');run.tutorialControlsAcceptedAt=run.tutorialLessonTime;
        },{kind:'controls',waitMs:1300});
      }
      const controlReady=flags.controlsLearned&&!tutorialMemoState;
      if(controlReady&&!run.tutorialGoalAvailable&&lessonTime>=(run.tutorialControlsAcceptedAt||0)+6000&&(run.masteryGain||0)>0){
        learned('fireLearned');learned('developmentSeen');run.tutorialFireExplainedAt=lessonTime;revealTutorialRunGoal();
      }
      if(controlReady&&!flags.abilityLearned&&flags.fireLearned&&!busy&&lessonTime>=25000&&lessonTime>(run.tutorialGoalExpandedUntil||0)+6000){
        const fire = run.elementalAbilityType === 'fire';
        if ((fire ? canCastActiveAttack(timestamp) : canActivateElementalAbility(timestamp)) && !run.tutorialAbilityPrompted) {
          run.tutorialAbilityPrompted = true;
          setTutorialRunHint('ability', fire ? 'Огненная вспышка' : 'Суперсила готова',
            fire ? 'Нажми кнопку с огнём, чтобы поджечь блоки под собой.' : 'Нажми кнопку внизу. Приём тратит 20% Силы и снова доступен через 10 секунд.', {duration:5000});
        }
      }
    }else if(!busy){
      const ahead=b=>b.y>run.slime.y+run.slime.radius&&tutorialObjectVisible(b);
      if(!flags.hazardLearned){
        const spike=run.blocks.find(b=>b.hazard&&!b.dead&&ahead(b));
        if(spike){learned('hazardLearned');run.tutorialHazardShownAt=lessonTime;
          setTutorialRunHint('hazard','Колючка — минус сердце','Обойди сбоку.',{focus:spike,duration:3800});}
      }else if(!flags.healLearned){
        const heart=run.blocks.find(b=>b.special==='gel'&&ahead(b));
        if(heart){learned('healLearned');run.tutorialHealShownAt=lessonTime;
          setTutorialRunHint('heal','Сердце в камне лечит',run.energy<3?'Разбей — верни сердце.':'Поможет, если ранишься.',{focus:heart,duration:3800});}
      }else if(!flags.veinsLearned){
        const vein=run.blocks.find(b=>b.flaskTier&&!b.dead&&ahead(b));
        if(vein){learned('veinsLearned');setTutorialRunHint('plasma','Жилы дают осколки','Разбивай блоки с цветной рудой.',{focus:vein,duration:3800});}
      }
    }
    if(flags.veinsLearned&&run.tutorialPhase===2&&!run.tutorialGoalAvailable&&!run.tutorialHint&&lessonTime>=(run.tutorialGoalRevealAt??0))revealTutorialRunGoal();
    if (timestamp >= (run.tutorialOutlineAt || 0)) {
      run.tutorialOutlineAt=timestamp+80; positionTutorialRunGoal(); positionTutorialRunHint(); renderTutorial();
    }
    return false;
  }


  function finishOnboardingRun(completed) {
    if (!save.onboarding.enabled) return;
    tutorialMemoState = null;
    if (run.tutorialPhase === 1) {
      save.onboarding.firstRunFinished = true;
      setTutorialStep('post-run');
    } else if (run.tutorialPhase === 2) {
      // A premature finish retries the resource lesson, without losing rewards.

      save.onboarding.secondRunFinished = true;
      setTutorialStep('post-run');
    }
    renderTutorial();
  }

  function renderOnboardingQuest() {
    const button = $('#tutorialQuest');
    if (!button) return;
    button.hidden = true;
  }

  function positionOnboardingQuest() {
    const quest = $('#tutorialQuest');
    if (!quest || quest.hidden || !els.homeScreen.offsetHeight) return;
    const home = els.homeScreen.getBoundingClientRect();
    const form = els.wardrobeBtn.getBoundingClientRect();
    const counter = els.conveyor.getBoundingClientRect();
    const scale = home.height / els.homeScreen.offsetHeight;
    const height = quest.offsetHeight * scale;
    const top = Math.max(form.bottom + 9 * scale, Math.min(form.bottom + 15 * scale, counter.top - height - 22 * scale));
    quest.style.top = `${(top - home.top) / scale}px`;
    const center = form.left + form.width / 2;
    const left = Math.max(8 * scale, Math.min(home.width - quest.offsetWidth * scale - 8 * scale, center - quest.offsetWidth * scale / 2));
    quest.style.left = `${left / scale}px`;
  }

  function openOnboardingQuest() {
    const quest = save.onboarding.quest;
    renderPanel('recipes');
    if (quest !== 'unlock-frost') {
      selectedLaboratoryMutationId = ['try-frost','play-frost'].includes(quest) ? 'frost' : selectedSlimeMutationId();
      laboratoryView = 'mutations'; renderRecipesPanel();
    }
  }

  function checkOnboardingProgress({ event = '' } = {}) {
    const state = save.onboarding;
    if (!state?.enabled || !save.unlockedMutations.includes('frost')) return;
    state.enabled = false; state.quest = ''; state.pendingMemo = '';
    clearTimeout(onboardingMemoTimer); onboardingMemoTimer = 0;
    setTutorialStep('done');
    persist({refreshUI:false});renderTutorial();
    save.activeMutationPool = ['frost','fire']; save.selectedMutation = 'frost';
    persist({refreshUI:false});
    if (document.body.dataset.screen === 'home' && !run) {
      if (!els.panelOverlay.classList.contains('hidden')) closePanel();
      newDraft();
    }
    showToast('Мороз открыт! Накорми слайма и испытай новую силу');
  }

  function queueOnboardingMemo() {
    // The old post-Frost quest chain is intentionally finished at the unlock.
    if (save.onboarding) save.onboarding.pendingMemo = '';
  }

  function tutorialRecipeIcon(id) {
    return `<img src="${versionedAsset(mutationById(id).image)}" alt="${mutationById(id).name}">`;
  }

  function restoreTutorial() {
    if (!tutorialActive()) { checkOnboardingProgress(); return; }
    if (!save.unlockedMutations.includes('fire')) save.unlockedMutations.push('fire');
    save.mutationLevels.fire = Math.max(1,save.mutationLevels.fire || 0);
    save.selectedMutation = 'fire'; save.activeMutationPool = ['fire'];
    const step = save.tutorialStep;
    if (['post-run','second-run'].includes(step) && !run) {
      if (step === 'second-run') setTutorialStep('post-run');
      queueSecondTutorialGift(); return;
    }
    if (['upgrade-home-mutations','upgrade-fire'].includes(step) && mutationLevel('fire') >= 2) setTutorialStep('second-feed');
    else if (['upgrade-home-mutations','upgrade-fire'].includes(step) && !slimeDevelopment('fire',2).ready) setTutorialStep('feed');
    if (step === 'second-gift-credit') setTutorialStep('upgrade-home-mutations');
    if (['frost-wait','frost-core','frost-prize'].includes(step)) setTutorialStep('frost-synthesize');
    if(save.tutorialStep.startsWith('frost-')&&!save.unlockedMutations.includes('frost')){
      if(save.researchUnits+save.mutationProgress<currentMutationCost())setTutorialStep('second-feed');
      else if(save.tutorialStep==='frost-synthesize'&&save.mutationProgress<currentMutationCost())setTutorialStep('frost-reactor');
    }
    if (save.tutorialStep === 'second-gift' && save.tutorialSecondGiftClaimed) setTutorialStep('upgrade-home-mutations');
    if (save.tutorialStep === 'feed' && stomachCanLaunch()) setTutorialStep('play');
    if (save.tutorialStep === 'second-feed' && stomachCanLaunch()) setTutorialStep('second-play');
    if (save.tutorialStep.startsWith('frost-') && save.tutorialStep !== 'frost-home') { renderPanel('recipes'); return; }
    queueTutorialRender();
  }

  async function initializeReliableSaves() {
    let platform = null;
    try {
      platform = await (window.SlimeYandexReady || Promise.resolve(null));
    } catch (error) {
      throw error;
    }
    yandexPlatform = platform;
    saveStorage = platform?.storage || browserStorage();
    try {
      adminInfiniteUltimate = (browserStorage() || saveStorage)?.getItem(ADMIN_INFINITE_ABILITIES_KEY) === '1';
    } catch (error) {
      console.warn('Admin ability preference load failed:', error);
    }

    const localCandidate = chooseNewestSave([
      ...readSaveCandidates(saveStorage),
      ...readSaveCandidates(browserStorage())
    ]);
    let cloudCandidate = null;
    if (platform?.player?.getData) {
      try {
        const cloudData = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Cloud save response timeout')), 10000);
          platform.player.getData([CLOUD_SAVE_KEY]).then(data => { clearTimeout(timeout); resolve(data); },
            error => { clearTimeout(timeout); reject(error); });
        });
        cloudCandidate = parseSave(cloudData?.[CLOUD_SAVE_KEY], 'cloud');
      } catch (error) {
        console.warn('Cloud save load failed; using local progress:', error);
        platform.player = null; // Never overwrite cloud progress we could not read.
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
  const lowPowerPerformanceMode = (navigator.deviceMemory && navigator.deviceMemory <= 4)
    || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  let viewportSyncTimer = 0;
  let homeFitFrame = 0;
  let lastViewportHeight = 0;
  let lastViewportWidth = 0;

  function isMobileDevice() { return mobilePerformanceMode; }

  function isAppleMobileDevice() { return appleMobilePerformanceMode; }

  function isLowPowerDevice() { return lowPowerPerformanceMode; }

  let graphicsBudget = 1;
  let graphicsCost = 0;
  function trackGraphicsCost(milliseconds) {
    graphicsCost = graphicsCost * .85 + milliseconds * .15;
    // Adapt decorative density, preserving physics and the face resolution.
    const desired = graphicsCost > 22 ? .55 : graphicsCost > 15 ? .75 : 1;
    graphicsBudget += (desired - graphicsBudget) * (desired < graphicsBudget ? .12 : .015);
  }
  function effectDensity() {
    return (isMobileDevice() ? .56 : isLowPowerDevice() ? .62 : 1) * graphicsBudget;
  }

  function scaledEffectCount(count, minimum = 1) {
    return Math.min(count, Math.max(minimum, Math.round(count * effectDensity())));
  }

  function particleLimit(limit) {
    const density = (isMobileDevice() ? .58 : isLowPowerDevice() ? .66 : 1) * graphicsBudget;
    return Math.max(54, Math.round(limit * density));
  }

  function trimParticles(limit) {
    if (!run?.particles) return;
    const maximum = particleLimit(limit);
    if (run.particles.length > maximum) run.particles.splice(0, run.particles.length - maximum);
  }

  function takeDecorativeParticles(requested, priority = false) {
    if (!run) return 0;
    const now = performance.now();
    if (!Number.isFinite(run.decorativeBurstAt) || now - run.decorativeBurstAt >= 50) {
      run.decorativeBurstAt = now;
      run.decorativeBurstUsed = 0;
    }
    const density = effectDensity();
    const burstLimit = Math.max(32, Math.round(120 * density));
    const reserve = priority ? 0 : Math.max(12, Math.round(24 * density));
    const available = Math.max(0, Math.min(particleLimit(240) - run.particles.length - reserve,
      burstLimit - run.decorativeBurstUsed + (priority ? 16 : 0)));
    const count = Math.max(0, Math.min(Math.round(requested), available));
    run.decorativeBurstUsed += count;
    return count;
  }

  function appendTransientEffect(effect, limit = 36, sameTypeLimit = 0) {
    const effects = run.specialEffects;
    if (sameTypeLimit) {
      let first = -1, count = 0;
      for (let i = 0; i < effects.length; i++) if (effects[i].type === effect.type) {
        if (first < 0) first = i;
        count++;
      }
      if (count >= sameTypeLimit) effects.splice(first, 1);
    }
    if (!effect.targetBlockId && effects.length >= limit) {
      // Frost projectiles resolve gameplay on expiry and must never be evicted.
      const expendable = effects.findIndex(item => !item.targetBlockId);
      if (expendable < 0) return false;
      effects.splice(expendable, 1);
    }
    effects.push(effect);
    return true;
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
    if (window.SlimeHomeConsole) {
      window.SlimeHomeConsole.layout();
      positionOnboardingQuest();
      return;
    }

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
    syncTerminalInsets();
    window.SlimeFoodGrounding.schedule();
  }

  function syncTerminalInsets() {
    const art = els.homeScreen.querySelector('.synth-terminal-art');
    const shell = els.homeScreen.querySelector('.world-terminal-shell');
    if (!art || !shell || !shell.offsetWidth || !shell.offsetHeight) return;
    const base = art.getBoundingClientRect(), host = shell.getBoundingClientRect();
    // The generated platform's resting contact line is at 51% of the scene.
    // Follow the resting feet when the home screen scales on phones or desktop.
    const ground = els.slimeStage?.querySelector('.slime-ground-shadow')?.getBoundingClientRect();
    if (ground?.height) {
      const contactY = ground.top + ground.height / 2 - els.app.getBoundingClientRect().top;
      els.app.style.setProperty('--lab-scene-height', `${(contactY / .51).toFixed(2)}px`);
    }
    const sx = host.width / shell.offsetWidth, sy = host.height / shell.offsetHeight;
    // Coordinates measured in the 925 × 1110 terminal artwork, shared at every viewport.
    const slots = { play: [171, 905, 583, 173], screen: [148, 501, 631, 358], heading: [314, 425, 297, 54], previous: [88, 626, 124, 118], next: [717, 626, 124, 118] };
    for (const [name, [x,y,w,h]] of Object.entries(slots)) {
      const values = [(base.left + base.width * x / 925 - host.left) / sx, (base.top + base.height * y / 1110 - host.top) / sy, base.width * w / 925 / sx, base.height * h / 1110 / sy];
      ['left','top','width','height'].forEach((property,index) => shell.style.setProperty(`--terminal-${name}-${property}`, `${values[index].toFixed(3)}px`));
    }
    // Align to the painted sockets, including nonuniform scaling on short phones.
    els.conveyorDispensers?.querySelectorAll('.conveyor-pipe-socket').forEach((button,index)=>{
      const parent=button.offsetParent;if(!parent?.offsetWidth||!parent.offsetHeight)return;
      const rect=parent.getBoundingClientRect(), px=rect.width/parent.offsetWidth, py=rect.height/parent.offsetHeight;
      const centerX=base.left+base.width*[190,462,736][index]/925;
      const centerY=base.top+base.height*65/1110;
      const x=(centerX-rect.left)/px,y=(centerY-rect.top)/py;
      for(const [key,value] of Object.entries({left:x,top:y,width:base.width*98/925/px,height:base.height*100/1110/py}))
        button.style.setProperty(`--socket-${key}`,`${value.toFixed(3)}px`);
      parent.style.setProperty('--emitter-x',`${x.toFixed(3)}px`);
    });
    const counter=els.conveyorChoiceCount, counterHost=counter?.offsetParent;
    if(counterHost?.offsetWidth && counterHost.offsetHeight) {
      const rect=counterHost.getBoundingClientRect(), cx=rect.width/counterHost.offsetWidth, cy=rect.height/counterHost.offsetHeight;
      const width=base.width*440/925, height=base.width*78/925;
      const left=base.left+base.width/2-width/2, top=base.top-height-base.width*10/925;
      for(const [key,value] of Object.entries({left:(left-rect.left)/cx,top:(top-rect.top)/cy,width:width/cx,height:height/cy})) {
        counter.style.setProperty(`--food-count-${key}`,`${value.toFixed(3)}px`);
      }
    }
    positionOnboardingQuest();
  }

  function syncViewportMetrics() {
    viewportSyncTimer = 0;
    const viewport = window.visualViewport;
    // A pinch changes the visual viewport without changing the layout.
    if (viewport && Math.abs(viewport.scale - 1) > .02) return;
    const nextHeight = Math.round(viewport?.height || window.innerHeight);
    if (!window.innerWidth || !nextHeight) return;
    const root = document.documentElement;
    root.style.setProperty('--visible-game-height', `${nextHeight}px`);
    const nextWidth = els.phoneViewport?.clientWidth || window.innerWidth;
    const layoutHeight = els.phoneViewport?.clientHeight || nextHeight;
    const widthChanged = !lastViewportWidth || Math.abs(nextWidth - lastViewportWidth) > 2;
    lastViewportHeight = layoutHeight;
    lastViewportWidth = nextWidth;
    root.style.setProperty('--app-height', `${layoutHeight}px`);
    root.classList.toggle('compact-viewport', layoutHeight < 780);
    root.classList.toggle('short-viewport', layoutHeight < 680);
    scheduleHomeFit();

    if (widthChanged) {
      mobilePerformanceMode = matchMedia('(pointer:coarse)').matches || window.innerWidth <= 540;
      document.documentElement.classList.toggle('mobile-lite', isMobileDevice());
      if (run && !run.ended) prepareCanvas();
      else if (els.homeScreen.classList.contains('active')) prepareMenuSlimeCanvas();
    }
  }

  function scheduleViewportMetrics() {
    if (viewportSyncTimer) clearTimeout(viewportSyncTimer);
    viewportSyncTimer = setTimeout(syncViewportMetrics, 72);
  }

  function syncPerformanceMode() {
    mobilePerformanceMode = matchMedia('(pointer:coarse)').matches || window.innerWidth <= 540;
    document.documentElement.classList.toggle('mobile-lite', isMobileDevice());
    document.documentElement.classList.toggle('low-power-device', isLowPowerDevice());
    document.documentElement.classList.toggle('ios-device', isAppleMobileDevice());
    syncViewportMetrics();
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
    window.SlimeUIActivity.sync(activeLayer,screen,adInFlight);
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
  function stomachCanLaunch(foods = session?.foods || []) { return stomachFoodCount(foods) > 0; }
  function canAddToStomach(food, foods = session?.foods || []) {
    if (!food || stomachFoodCount(foods) >= STOMACH_CAPACITY) return false;
    const family = foodRecipeFamily(food);
    if (family === 'infinity' || save.rewards?.infinityEquipped) {
      return family === 'infinity' && save.rewards?.infinityEquipped && food.stage === mutationLevel('infinity');
    }
    const mutationId = (save.activeMutationPool || []).find(id => mutationFoodFamily(id) === family);
    if (!mutationId) return false;
    return mutationLevel(mutationId) > 0 && (!food.stage || food.stage === mutationLevel(mutationId));
  }
  function stomachIsFull(foods = session?.foods || []) {
    return stomachFoodCount(foods) >= STOMACH_CAPACITY;
  }
  function conveyorCanStart() {
    return stomachCanLaunch() && (stomachIsFull() || !session?.offer?.some(food => canAddToStomach(food)));
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
    if (world?.id === 1 && tutorialActive()) {
      if (['second-feed','second-play','second-run','upgrade-close-lab'].includes(save.tutorialStep)) return 350;
      return 350;
    }
    return world?.targetDepth || 500;
  }
  function selectedLevelForWorld(worldId = save.world) {
    return LEVEL_COUNT;
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
  function worldIconSource(worldId) {
    if (Number(worldId) === 6) return versionedAsset('assets/ui/planets/source-v3/planet-100.webp');
    if (Number(worldId) === 5) return versionedAsset('assets/ui/planets/sky-v4/sky-0.webp');
    const suffix = Number(worldId) === 3 || Number(worldId) === 4 ? '-v2' : '';
    return versionedAsset(`assets/ui/world-icons/world-${worldId}${suffix}.webp`);
  }
  function currentWorld() { return WORLDS.find(world => world.id === Number(save.world)) || ACTIVE_WORLDS[0]; }

  function worldInfectionHp(worldId) {
    const planet = PLANETS.forWorld(worldId);
    return save.planetCampaign.cores[planet?.id] ?? 0;
  }

  function worldInfectionStage(worldId) {
    return PLANETS.stage(worldInfectionHp(worldId));
  }

  function ensureWorldBackgroundLayers(worldId, stage = worldInfectionStage(worldId)) {
    return loadWorldBackgroundLayers(worldId, stage);
  }
  function worldIsUnlocked(worldId) {
    const planet = PLANETS.forWorld(worldId);
    if (planet && save.planetCampaign) return PLANETS.isUnlocked(save.planetCampaign, planet.id);
    if(WORLDS.find(world=>world.id===Number(worldId))?.comingSoon)return false;
    const index = ACTIVE_WORLD_IDS.indexOf(Number(worldId));
    if (index < 0) return false;
    if (index === 0 || save.unlockedWorlds.includes(Number(worldId))) return true;
    const previous = ACTIVE_WORLDS[index - 1];
    return (save.worldBest[previous.id] || 0) >= previous.targetDepth;
  }
  let carouselWorldId = null;

  function carouselWorld() {
    return ACTIVE_WORLDS.find(world => world.id === carouselWorldId) || currentWorld();
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
      button.innerHTML = `<span>${level}</span>${completed && !locked ? '<i aria-hidden="true">✓</i>' : ''}${locked ? `<img src="${versionedAsset('assets/ui/level-lock.webp')}" alt="" aria-hidden="true">` : ''}`;
      els.levelButtons.appendChild(button);
    }
  }

  let worldUnlockAnimation = null;
  let worldUnlockId = 0;
  function revealUnlockedWorld(worldId) {
    const lock = els.worldTerminalLock;
    if (!lock || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !lock.animate) return;
    worldUnlockAnimation?.cancel();
    worldUnlockId = worldId;
    lock.classList.add('is-unlocking');
    lock.hidden = false;
    const base = getComputedStyle(lock).transform;
    const transform = base === 'none' ? '' : base;
    const animation = lock.animate([
      { transform, opacity:1 },
      { transform:`${transform} translateY(-6px) rotate(-8deg)`, opacity:1, offset:.22 },
      { transform:`${transform} translateY(75px) rotate(24deg)`, opacity:0 }
    ], { duration:620, easing:'cubic-bezier(.32,0,.8,.7)' });
    worldUnlockAnimation = animation;
    animation.finished.then(() => {
      if (worldUnlockAnimation !== animation) return;
      worldUnlockAnimation = null;
      worldUnlockId = 0;
      lock.classList.remove('is-unlocking');
      lock.hidden = !els.worldCarousel.classList.contains('locked');
    }).catch(() => {});
  }

  function renderWorldCarousel() {
    if (!els.worldCarousel) return;
    const world = carouselWorld();
    const index = ACTIVE_WORLD_IDS.indexOf(world.id);
    const locked = !worldIsUnlocked(world.id);
    const requiredLevel = index;
    const previews = {
      1: 'assets/ui/world-terminal/preview-stone-v4.webp',
      3: 'assets/ui/world-terminal/preview-candy-v4.webp',
      4: 'assets/ui/world-terminal/preview-magma-v4.webp'
    };
    const preview = previews[world.id] || previews[1];
    if (els.worldTerminalPreview && els.worldTerminalPreview.getAttribute('src') !== preview) els.worldTerminalPreview.src = preview;
    if (els.worldTerminalNumber) els.worldTerminalNumber.textContent = locked?'':`${levelTargetDepth(world, selectedLevelForWorld(world.id)).toLocaleString('ru-RU')} М`;
    if (els.worldTerminalName) els.worldTerminalName.textContent = locked?'':world.name.toLocaleUpperCase('ru-RU');
    const newWorldBadge=document.querySelector('#worldTerminalNew');
    if(newWorldBadge)newWorldBadge.hidden=true;
    if (worldUnlockAnimation && (worldUnlockId !== world.id || locked)) {
      worldUnlockAnimation.cancel();
      worldUnlockAnimation = null;
      worldUnlockId = 0;
      els.worldTerminalLock?.classList.remove('is-unlocking');
    }
    els.worldPrevBtn?.classList.toggle('has-new-world',(save.unseenWorlds||[]).some(id=>ACTIVE_WORLD_IDS.indexOf(id)<index));
    els.worldNextBtn?.classList.toggle('has-new-world',(save.unseenWorlds||[]).some(id=>ACTIVE_WORLD_IDS.indexOf(id)>index));
    if (els.worldTerminalTrophies) els.worldTerminalTrophies.textContent = world.comingSoon?'СКОРО':`ПРОЙДИ ШАХТУ ${requiredLevel}`;
    if (els.worldTerminalLock) els.worldTerminalLock.hidden = !locked && worldUnlockId !== world.id;
    els.worldCarousel.classList.toggle('locked', locked);
    els.worldCarousel.setAttribute('aria-label', locked
      ? world.comingSoon?'Этот мир скоро появится':`Пройди шахту ${requiredLevel}, чтобы открыть этот мир`
      : `Шахта ${worldDisplayNumber(world.id)}, ${world.name}, ${levelTargetDepth(world, selectedLevelForWorld(world.id))} метров`);
    if (els.worldPrevBtn) els.worldPrevBtn.disabled = index <= 0;
    if (els.worldNextBtn) els.worldNextBtn.disabled = index >= ACTIVE_WORLDS.length - 1;
    if (els.worldCarouselDots.children.length !== ACTIVE_WORLDS.length) {
      els.worldCarouselDots.replaceChildren(...ACTIVE_WORLDS.map(() => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'world-carousel-dot';
        return dot;
      }));
    }
    [...els.worldCarouselDots.children].forEach((dot, dotIndex) => {
      dot.className = `world-carousel-dot${dotIndex === index ? ' active' : ''}${worldIsUnlocked(ACTIVE_WORLDS[dotIndex].id) ? '' : ' locked'}`;
      dot.classList.toggle('new-world',save.unseenWorlds?.includes(ACTIVE_WORLD_IDS[dotIndex])||false);
      dot.dataset.world = String(ACTIVE_WORLDS[dotIndex].id);
      dot.setAttribute('aria-label', `Шахта ${worldDisplayNumber(ACTIVE_WORLDS[dotIndex].id)}${ACTIVE_WORLDS[dotIndex].comingSoon?', скоро':worldIsUnlocked(ACTIVE_WORLDS[dotIndex].id) ? '' : ', закрыта'}`);
      dot.setAttribute('aria-current', dotIndex === index ? 'page' : 'false');
    });
  }

  let carouselTransitionTimer = 0;
  let carouselPendingWorldId = 0;
  function animateCarouselSelection(worldId) {
    const carousel = els.worldCarousel;
    if (!carousel || Number(worldId) === (carouselPendingWorldId || carouselWorld().id) || !ACTIVE_WORLD_IDS.includes(Number(worldId))) return;
    if (worldIsUnlocked(worldId) && (session?.rerollPending || adInFlight)) {
      showToast('Дождись окончания обновления');
      return;
    }
    carouselPendingWorldId = Number(worldId);
    if (carousel.classList.contains('is-channel-out')) return;
    carousel.classList.add('is-channel-out');
    clearTimeout(carouselTransitionTimer);
    carouselTransitionTimer = setTimeout(() => {
      const nextWorldId = carouselPendingWorldId;
      carouselPendingWorldId = 0;
      selectHomeWorld(nextWorldId);
      carousel.classList.remove('is-channel-out');
    }, 140);
  }

  function renderHomePlaySetup() {
    if (!els.playSetupCard) return;
    const world = currentWorld();
    renderWorldCarousel();
    if (els.homeWorldPickerIcon) els.homeWorldPickerIcon.src = worldIconSource(world.id);
    if (els.homeWorldPickerEyebrow) els.homeWorldPickerEyebrow.textContent = `ШАХТА ${worldDisplayNumber(world.id)}`;
    if (els.homeWorldPickerName) els.homeWorldPickerName.textContent = world.name;
    if (els.homeWorldBest) els.homeWorldBest.textContent = `${Math.floor(save.worldBest?.[world.id] || 0).toLocaleString('ru-RU')} М`;
    if (els.homeWorldSelect) {
      const selectedValue = String(world.id);
      els.homeWorldSelect.replaceChildren(...ACTIVE_WORLDS.map(item => {
        const option = document.createElement('option');
        const unlocked = worldIsUnlocked(item.id);
        option.value = String(item.id);
        option.disabled = !unlocked;
        option.textContent = `${unlocked ? '' : '🔒 '}${worldDisplayNumber(item.id)}. ${item.name}${item.comingSoon?' — Скоро':''}`;
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
        button.setAttribute('aria-label', item.comingSoon?`Шахта ${displayNumber}. ${item.name}. Скоро`:unlocked ? `Шахта ${displayNumber}. ${item.name}` : `Шахта ${displayNumber} закрыта`);

        const emblem = document.createElement('span');
        emblem.className = 'home-world-option-icon';
        const image = document.createElement('img');
        image.src = worldIconSource(item.id);
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        emblem.appendChild(image);

        const copy = document.createElement('span');
        copy.className = 'home-world-option-copy';
        const eyebrow = document.createElement('small');
        eyebrow.textContent = `ШАХТА ${displayNumber}`;
        const name = document.createElement('b');
        name.textContent = item.name+(item.comingSoon?' — Скоро':'');
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
          lock.src = versionedAsset('assets/ui/level-lock.webp');
          lock.alt = '';
          state.appendChild(lock);
        }
        button.append(emblem, copy, state);
        options.appendChild(button);
      });
      els.homeWorldMenu.replaceChildren(options);
    }

    const endlessUnlocked = Boolean(save.gameCompleted);
    const activeMode = endlessUnlocked && save.homeMode === 'endless' ? 'endless' : 'campaign';
    if (!endlessUnlocked) save.homeMode = 'campaign';
    els.playSetupCard.dataset.mode = activeMode;
    els.playSetupCard.querySelector('.world-terminal-shell')?.classList.toggle('endless-active', activeMode === 'endless');
    if (els.abyssModeV2) {
      els.abyssModeV2.classList.toggle('selected', activeMode === 'endless');
      els.abyssModeV2.classList.toggle('locked', !endlessUnlocked);
      els.abyssModeV2.setAttribute('aria-pressed', String(activeMode === 'endless'));
      els.abyssModeV2.setAttribute('aria-label', endlessUnlocked ? 'Бесконечный режим' : 'Бесконечный режим откроется после прохождения игры');
      els.abyssModeV2.title = endlessUnlocked ? 'Бесконечный режим' : 'Откроется после прохождения игры';
    }
    if (els.terminalEndlessLabel) els.terminalEndlessLabel.textContent = endlessUnlocked ? 'БЕСКОНЕЧНО' : 'ПОСЛЕ ФИНАЛА';
    if (els.worldTerminalStats) els.worldTerminalStats.hidden = activeMode !== 'endless';
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
    if (els.terminalBestScore) els.terminalBestScore.textContent = formatCompactNumber(endlessScore);
    if (els.terminalBestDepth) els.terminalBestDepth.textContent = `${Math.floor(endlessDepth).toLocaleString('ru-RU')} М`;
    if (els.terminalBestLaps) els.terminalBestLaps.textContent = formatCompactNumber(endlessLaps);
    if (els.terminalRuns) els.terminalRuns.textContent = formatCompactNumber(endlessRunCount);
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
    sound('uiTab');
    feedback(6);
    renderHomePlaySetup();
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
    const planet = PLANETS.forWorld(nextWorldId);
    if (planet) save.planetCampaign.selected = planet.id;
    if (!worldIsUnlocked(nextWorldId)) {
      carouselWorldId = nextWorldId;
      renderWorldCarousel();
      syncWorldStartButton();
      sound('uiWorld');
      return;
    }
    if (session?.rerollPending || adInFlight) {
      showToast('Дождись окончания обновления');
      return;
    }
    const newlyUnlocked = save.unseenWorlds?.includes(nextWorldId);
    const changed = nextWorldId !== save.world;
    if (newlyUnlocked) save.unseenWorlds = save.unseenWorlds.filter(id => id !== nextWorldId);
    save.world = nextWorldId;
    ensureWorldBackgroundLayers(nextWorldId);
    carouselWorldId = nextWorldId;
    if (changed) { sound('uiWorld'); feedback(8); }
    renderWorldCarousel();
    if (newlyUnlocked) revealUnlockedWorld(nextWorldId);
    updateSelectedWorldSummary();
    syncWorldStartButton();
    if (changed || newlyUnlocked) persist({ refreshUI: false });
  }

  function selectLevel(level) {
    const world = currentWorld();
    const unlocked = clamp(Math.round(save.unlockedLevels?.[world.id] || 1), 1, LEVEL_COUNT);
    if (level > unlocked) {
      sound('uiError');
      feedback(8);
      showToast('Пройдите предыдущий уровень');
      return;
    }
    save.selectedLevels[world.id] = level;
    sound('uiSelect');
    feedback(5);
    persist();
    updatePersistentUI();
  }

  function updateSelectedWorldSummary() {
    const world = currentWorld();
    const level = selectedLevelForWorld(world.id);
    const targetDepth = levelTargetDepth(world, level);
    const best = Math.min(targetDepth, Math.floor(save.worldBest[world.id] || 0));
    const worldProgress = clamp(best / targetDepth * 100, 0, 100);
    const levelCompleted = best >= targetDepth;
    updateWorldHeader();
    if (els.worldProgressPrefix) els.worldProgressPrefix.textContent = levelCompleted ? 'ШАХТА ПРОЙДЕНА' : 'ВЫ ПРОШЛИ';
    els.worldProgressText.textContent = `${best} м`;
    els.worldProgressBar.style.width = `${worldProgress}%`;
    if (els.worldProgressMarker) els.worldProgressMarker.style.left = `${worldProgress}%`;
    els.worldProgressBar.parentElement.setAttribute('aria-valuenow', String(Math.round(worldProgress)));
    els.worldHint.textContent = `${targetDepth} М`;
    syncAdminPlanetUI();
    renderLevelPicker();
  }

  function paintPlayerExperience(experience) {
    const id = homeRewardFlight?.mutationId || selectedSlimeMutationId();
    const mutation = mutationById(id);
    const state = slimeDevelopment(id, undefined, experience);
    const emblem = document.getElementById('slimeProgressEmblem');
    if (emblem && mutation && emblem.getAttribute('src') !== versionedAsset(mutation.image)) emblem.src = versionedAsset(mutation.image);
    document.getElementById('slimeProgressName').textContent = mutation?.name || 'Выбери слайма';
    els.coinsLabel.textContent = ['I','II','III'][state.stage - 1];
    if (els.playerLevelProgress) els.playerLevelProgress.style.width = `${state.percent}%`;
    if (els.playerLevelExperience) els.playerLevelExperience.textContent = !mutationLevel(id) ? 'Накорми слайма' : state.max ? 'ВСЕ СТАДИИ ОТКРЫТЫ' : state.ready ? 'ГОТОВ К РАЗВИТИЮ' : `${state.label}: ${Math.min(state.current, state.target)}/${state.target}`;
    els.coinsLabel.closest('.player-level-wallet')?.setAttribute('aria-label', `${mutation?.name || 'Слайм'}, стадия ${state.stage}, ${state.label}: ${state.current} из ${state.target}${state.ready ? ', готов к эволюции' : ''}`);
    els.coinsLabel.closest('.player-level-wallet')?.classList.toggle('evolution-ready', state.ready);
  }

  function renderPlayerExperience(experience) {
    const id = homeRewardFlight?.mutationId || selectedSlimeMutationId();
    let state = playerExperiencePresentation;
    if (!state || state.id !== id || experience < state.shown || menuReducedMotion || document.body.dataset.screen !== 'home' || els.coinsLabel.closest('.player-level-wallet')?.hidden) {
      if (state) cancelAnimationFrame(state.frame);
      state = playerExperiencePresentation = { id, shown: experience, target: experience, frame: 0 };
      paintPlayerExperience(experience);
      return;
    }
    state.target = experience;
    if (state.frame || state.shown === experience) { paintPlayerExperience(state.shown); return; }
    state.from = state.shown; state.started = performance.now();
    const step = now => {
      if (playerExperiencePresentation !== state) return;
      const ratio = clamp((now - state.started) / 550, 0, 1);
      state.shown = Math.round(state.from + (state.target - state.from) * (1 - Math.pow(1 - ratio, 3)));
      paintPlayerExperience(state.shown);
      if (ratio < 1) state.frame = requestAnimationFrame(step);
      else state.frame = 0;
    };
    state.frame = requestAnimationFrame(step);
  }

  function renderWalletBalances() {
    const experience = homeRewardFlight
      ? homeRewardFlight.experienceStart + homeRewardFlight.experienceShown
      : slimeTaskCount();
    const researchUnits = homeRewardFlight
      ? homeRewardFlight.flaskStart + homeRewardFlight.flaskShown
      : save.researchUnits;
    renderPlayerExperience(experience);
    const exactResearchCount = Boolean(homeRewardFlight) && researchUnits < 10000 && !adminInfiniteResearch;
    if (els.researchUnitsLabel) els.researchUnitsLabel.textContent = adminInfiniteResearch ? '∞'
      : exactResearchCount ? String(researchUnits) : formatCompactNumber(researchUnits);
    const researchWallet = els.researchUnitsLabel?.closest('.research-wallet');
    if (researchWallet) researchWallet.dataset.balanceLength = String(els.researchUnitsLabel.textContent.length);
    researchWallet?.classList.toggle('is-receiving', exactResearchCount);
    if (researchWallet) researchWallet.dataset.rewardDigits = exactResearchCount ? String(researchUnits).length : '';
    researchWallet?.setAttribute('aria-label', adminInfiniteResearch ? 'Исследование: бесконечные осколки' : `Осколки Аномалии: ${researchUnits}`);
  }

  function settleHomeRewardFlight() {
    const flight = homeRewardFlight;
    if (!flight) return;
    clearTimeout(flight.timeout);
    clearTimeout(flight.cueTimer);
    flight.animations.forEach(animation => animation.cancel());
    document.getElementById('homeRewardFlightLayer')?.replaceChildren();
    homeRewardFlight = null;
    renderWalletBalances();
    if (document.body.dataset.screen === 'home') renderHomeConsole({ updatePlanet: false });
  }

  function prepareHomeRewardFlight(completedRun) {
    settleHomeRewardFlight();
    if (!completedRun) return;
    const flaskGain = adminInfiniteResearch ? 0 : Math.max(0,
      (completedRun.researchUnitsAfter || 0) - (completedRun.researchUnitsBefore || 0));
    const experienceGain = Math.max(0, Math.floor(completedRun.masteryGain || 0));
    if (!flaskGain && !experienceGain) return;
    homeRewardFlight = {
      flaskStart: Math.max(0, save.researchUnits - flaskGain),
      flaskGain, flaskShown: 0,
      mutationId: completedRun.mutationId,
      planetEventId: completedRun.coreStrikeEvent?.id,
      experienceStart: completedRun.experienceBefore || 0,
      experienceGain, experienceShown: 0,
      animations: [], timeout: 0, started: false
    };
  }

  function playHomeRewardFlight(planetOrigin) {
    const flight = homeRewardFlight;
    if (!flight || flight.started) return;
    const campaign = save.planetCampaign;
    const event = campaign?.pending?.find(item => item.id === flight.planetEventId);
    if (!planetOrigin && event && event.planetId === campaign.selected) return;
    flight.started = true;
    const layer = document.getElementById('homeRewardFlightLayer');
    const viewport = document.getElementById('phoneViewport');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = 1540;
    const receivers = new Map();
    const arrive = () => {
      if (homeRewardFlight !== flight) return;
      settleHomeRewardFlight();
      for (const [kind, wallet] of receivers) {
        const receiver = kind === 'experience'
          ? wallet.querySelector('.console-xp:not([hidden]) .lab-progress-track')
            || wallet.querySelector('.console-mutation-action:not([hidden])')
            || wallet
          : wallet;
        receiver.animate([
          { scale: '1', filter: 'brightness(1)' },
          { scale: kind === 'experience' ? '1.055' : '1.15', filter: 'brightness(1.28)', offset: .34 },
          { scale: '1', filter: 'brightness(1)' }
        ], { duration: 350, easing: 'ease-out' });
      }
      sound('homeRewardCollect');
      feedback(6);
    };
    if (!layer || !viewport || reduceMotion || document.hidden || !Element.prototype.animate || document.body.dataset.screen !== 'home') {
      // On an impact, even the reduced-motion counters follow the damage clock.
      if (planetOrigin) {
        flight.seek = progress => { if (progress === 1) arrive(); };
        sound('homeRewardBurst');
      } else settleHomeRewardFlight();
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    const viewportX = viewportRect.left - layerRect.left;
    const viewportY = viewportRect.top - layerRect.top;
    const planet = planetOrigin || document.querySelector('.planet-card.is-selected .planet-sphere');
    const bounds = planet?.getBoundingClientRect();
    const fromPlanet = bounds?.width > 0 && bounds.height > 0;
    const originX = fromPlanet ? bounds.left - layerRect.left + bounds.width * .50 : viewportX + viewportRect.width * .50;
    const originY = fromPlanet ? bounds.top - layerRect.top + bounds.height * .48 : viewportY + viewportRect.height * .27;
    const focusDelay = planetOrigin ? 0 : 230;
    const particles = [];
    if (focusDelay && planet) {
      flight.animations.push(planet.animate([
        { scale: 1 }, { scale: 1.055, offset: .48 }, { scale: 1 }
      ], { duration: focusDelay, easing: 'ease-in-out' }));
    }

    const addFlight = (kind, amount, targetIcon, targetWallet) => {
      if (!amount || !targetIcon || !targetWallet) return;
      const count = Math.min(kind === 'experience' ? 5 : 7, amount);
      const targetRect = targetIcon.getBoundingClientRect();
      if (!targetRect.width || !targetRect.height) return;
      receivers.set(kind, kind === 'experience' ? document.getElementById('homeMutationInfo') : targetWallet);
      const targetX = targetRect.left + targetRect.width / 2 - layerRect.left;
      const targetY = targetRect.top + targetRect.height / 2 - layerRect.top;
      const side = kind === 'experience' ? -1 : 1;
      for (let index = 0; index < count; index += 1) {
        const startX = originX + side * rand(7, 16);
        const startY = originY + rand(-7, 7);
        const landX = clamp(originX + side * (30 + index * 9 + rand(0, 12)),
          viewportX + 22, viewportX + viewportRect.width - 22);
        const landY = startY + rand(32, 75);
        const tilt = side * rand(18, 47);
        const delay = index * .008;
        const liftAt = .45 + index * .022;
        const image = document.createElement('img');
        image.className = `home-reward-particle home-reward-${kind}`;
        image.src = kind === 'experience' ? 'assets/ui/player-level-star-v2.webp' : versionedAsset('assets/ui/anomaly-core-v56/currency.webp');
        image.alt = '';
        image.style.left = `${startX}px`;
        image.style.top = `${startY}px`;
        layer.appendChild(image);
        const transform = (x, y, scale, rotation, stretch = 1) =>
          `translate3d(calc(-50% + ${x - startX}px),calc(-50% + ${y - startY}px),0) rotate(${rotation}deg) scale(${scale},${scale * stretch})`;
        const animation = image.animate([
          { offset: delay, opacity: 0, transform: transform(startX,startY,.24,-tilt,1.25), easing: 'ease-out' },
          { offset: .17 + delay, opacity: 1, transform: transform(lerp(startX,landX,.64),startY-rand(37,59),1.21,tilt), easing: 'ease-in' },
          { offset: .28 + delay, opacity: 1, transform: transform(landX,landY,1,tilt*.42,.77), easing: 'ease-out' },
          { offset: .33 + delay, opacity: 1, transform: transform(landX+side*4,landY-12,1.03,tilt*.20), easing: 'ease-in' },
          { offset: .38 + delay, opacity: 1, transform: transform(landX+side*7,landY,.99,tilt*.12) },
          { offset: liftAt, opacity: 1, transform: transform(landX+side*7,landY,1,tilt*.12), easing: 'cubic-bezier(.3,.04,.42,1)' },
          { offset: .74, opacity: 1, transform: transform(lerp(landX,targetX,.37)+side*19,lerp(landY,targetY,.51)-37,.95,-tilt*.5), easing: 'cubic-bezier(.32,.26,.66,1)' },
          { offset: .92, opacity: 1, transform: transform(lerp(landX,targetX,.88),lerp(landY,targetY,.90)-15,.70,tilt*.25), easing: 'ease-in' },
          { offset: 1, opacity: 0, transform: transform(targetX,targetY,.44,0) }
        ], { duration, delay: focusDelay, fill: 'both' });
        if (planetOrigin) {
          animation.pause();
          animation.currentTime = 0;
        }
        flight.animations.push(animation);
        particles.push(animation);
      }
    };

    addFlight('flask', flight.flaskGain,
      document.querySelector('.research-wallet-flask>img'),
      document.querySelector('.research-wallet'));
    if (flight.mutationId === selectedSlimeMutationId()) {
      const progress = document.querySelector('#homeMutationInfo .console-xp:not([hidden])');
      const info = document.getElementById('homeMutationInfo');
      addFlight('experience', flight.experienceGain, progress?.querySelector('.lab-progress-icon img') || info, progress || info);
    }
    if (planetOrigin) {
      sound('homeRewardBurst');
      flight.seek = progress => {
        for (const animation of particles) animation.currentTime = progress * duration;
        if (progress === 1) arrive();
      };
    } else if (!particles.length) {
      settleHomeRewardFlight();
    } else {
      flight.cueTimer = setTimeout(() => { if (homeRewardFlight === flight) sound('homeRewardBurst'); }, focusDelay);
      flight.timeout = setTimeout(arrive, duration + focusDelay + 200);
      Promise.all(particles.map(animation => animation.finished)).then(arrive, () => {});
    }
  }

  function updatePersistentUI() {
    renderOnboardingQuest();
    renderWalletBalances();
    updateRewardsBadge();
    const hasFirstForm = Boolean(save.discoveredForms?.length);
    for (const button of [els.formIndexBtn, els.wardrobeBtn]) {
      if (!button) continue;
      const locked = button === els.wardrobeBtn ? tutorialActive() : !hasFirstForm;
      button.disabled = locked;
      button.classList.toggle('form-locked', locked);
      button.title = button === els.wardrobeBtn ? locked ? 'Гардероб откроется после обучения' : 'Открыть гардероб' : locked ? 'Откроется после первой формы' : '';
    }
    els.wardrobeBtn?.setAttribute('aria-label', tutorialActive() ? 'Гардероб откроется после обучения' : 'Открыть гардероб');
    if (els.mutationLabBadge) {
      const hasUndiscoveredMutation = !save.unlockedMutations?.includes('fire') || !allSynthesesUnlocked();
      const canSynthesize = hasUndiscoveredMutation && (adminInfiniteResearch || save.researchUnits + save.mutationProgress >= currentMutationCost());
      els.mutationLabBadge.hidden = !canSynthesize;
      els.mutationLabBadge.closest('button')?.setAttribute('aria-label', canSynthesize ? 'Открыть мутации. Доступен синтез' : 'Открыть мутации');
    }
    updateSelectedWorldSummary();
    renderHomePlaySetup();
    applySkin();
  }

  function updateWorldHeader(screen = document.body.dataset.screen || 'home') {
    const isDrop = screen === 'drop' && Boolean(run?.world);
    const world = isDrop ? run.world : currentWorld();
    document.body.dataset.world = String(isDrop ? world.id : ACTIVE_WORLDS[0].id);
    const level = isDrop ? run.level : selectedLevelForWorld(world.id);
    const targetDepth = isDrop ? run.world.targetDepth : levelTargetDepth(world, level);
    const savedRunDepth = Math.max(0, +(save.lastRunDepth?.[`${world.id}:${level}`] || 0));
    const completedBefore = savedRunDepth >= targetDepth || +(save.worldBest?.[world.id] || 0) >= targetDepth;
    els.worldLabel.textContent = world.name;
    if (els.worldEyebrow) {
      els.worldEyebrow.textContent = isDrop
        ? (run?.endless ? `ШАХТА ${worldDisplayNumber(world.id)} · БЕСКОНЕЧНЫЙ РЕЖИМ` : `ШАХТА ${worldDisplayNumber(world.id)}`)
        : `ШАХТА ${worldDisplayNumber(world.id)}`;
    }
    if (els.worldIcon) els.worldIcon.src = worldIconSource(world.id);
    if (els.levelPassedBadge) els.levelPassedBadge.hidden = !(isDrop && !run?.endless && completedBefore);
  }

  function applySkin() {
    [...els.slime.classList].filter(c => c.startsWith('skin-')).forEach(c => els.slime.classList.remove(c));
    els.slime.classList.add(skinById(save.selectedSkin).className);
  }

  function animateFoodToMouth(food, source, catchMs) {
    if (!source?.isConnected) return;
    const from = source.getBoundingClientRect();
    const mouth = els.menuSlimeMouth?.getBoundingClientRect();
    if (!mouth) return;
    const flyerToken = ++foodFlyerToken;
    setMenuGazePoint(from.left + from.width / 2, from.top + from.height / 2);
    els.slime.classList.add('tracking-food', 'expect-food');
    const flyer = document.createElement('span');
    flyer.className = 'swallow-fruit';
    const swallowMs = catchMs - 22;
    flyer.style.setProperty('--swallow-time', `${swallowMs}ms`);
    flyer.innerHTML = foodArtMarkup(food, 'swallow-model');
    flyer.style.left = `${from.left + from.width / 2}px`;
    flyer.style.top = `${from.top + from.height / 2}px`;
    document.body.appendChild(flyer);
    void flyer.offsetWidth;
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

  function menuSlimeIsBusy({ ignoreModal = false } = {}) {
    return Boolean(menuMutationReveal || formDiscoverySequence) || (!ignoreModal && document.body.classList.contains('ui-modal-open'))
      || ['eat', 'chewing', 'savoring', 'expect-food', 'tracking-food', 'portal-surprised'].some(name => els.slime.classList.contains(name));
  }

  function clearMenuSlimeInteraction() {
    window.MenuPetpet.cancel(menuPetpet);
    window.SlimeTapEmotions.clear(menuTapEmotion);
    els.slime.classList.remove(...MENU_SLIME_STATES);
    if (slimePointer) {
      const pointerId = slimePointer.id;
      slimePointer = null;
      try { els.slime.releasePointerCapture?.(pointerId); } catch (_) { /* capture already released */ }
    }
    slimePointer = null;
    resetMenuGaze();
  }

  function beginMenuPetpet() {
    const now = performance.now();
    window.MenuPetpet.cancel(menuPetpet);
    window.SlimeTapEmotions.trigger(menuTapEmotion,save.wardrobe?.emotion,now);
    els.slime.classList.remove('booped','petted','petting');
    menuGaze.x = menuGaze.y = 0;
    if (now - menuPetSoundAt > 230) {
      menuPetSoundAt = now;
      sound('happy');
      feedback(5);
    }
    startMenuSlimeLoop();
  }

  function bindMenuSlimeInteractions() {
    els.slime.addEventListener('pointerdown', event => {
      if (slimePointer || menuSlimeIsBusy() || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault();
      els.slime.setPointerCapture?.(event.pointerId);
      slimePointer = { id: event.pointerId };
      beginMenuPetpet();
    });

    els.slime.addEventListener('pointermove', event => {
      if (!slimePointer || slimePointer.id !== event.pointerId || menuSlimeIsBusy()) return;
      event.preventDefault();
    });

    const endPointer = event => {
      if (!slimePointer || slimePointer.id !== event.pointerId) return;
      slimePointer = null;
      try { els.slime.releasePointerCapture?.(event.pointerId); } catch (_) { /* pointer already released */ }
      window.MenuPetpet.release(menuPetpet, performance.now());
    };
    els.slime.addEventListener('pointerup', endPointer);
    els.slime.addEventListener('pointercancel', () => clearMenuSlimeInteraction());
    els.slime.addEventListener('lostpointercapture', endPointer);
    els.slime.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key) || menuSlimeIsBusy()) return;
      event.preventDefault();
      if (!event.repeat) beginMenuPetpet();
    });
    els.slime.addEventListener('keyup', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      window.MenuPetpet.release(menuPetpet, performance.now());
    });
    els.slime.addEventListener('blur', () => { if (!slimePointer) window.MenuPetpet.release(menuPetpet, performance.now()); });
    window.addEventListener('blur', clearMenuSlimeInteraction);
  }

  function showScreen(name) {
    if (name !== 'home') {
      clearMenuSlimeInteraction();
      clearMenuMutationPresentation();
    }
    if (name !== 'home') settleHomeRewardFlight();
    document.body.dataset.screen = name;
    syncBackgroundMusic({restart:name === 'drop'});
    if (name !== 'drop') { $('#tutorialRunHint').hidden = true; $('#tutorialRunGoal').hidden = true; $('#tutorialSteeringDemo').hidden=true; }
    if (name !== 'home') renderPlayerExperience(slimeTaskCount());
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
    queueTutorialRender();
  }

  function syncBackgroundMusic(options) {
    const screen = document.body.dataset.screen;
    const playableAnomaly = screen === 'drop' && run && !run.ended && !run.paused && !run.corePreview
      && PLANETS.forWorld(run.worldId)?.id === 'source';
    const track = screen === 'home' && !document.body.classList.contains('room-launch-active') ? 'menu' : playableAnomaly ? 'anomaly' : null;
    setMusic(document.hidden || !save.sound || windowSuspended || platformSuspended || adInFlight ? null : track,options);
  }

  function newDraft() {
    els.shaft.classList.remove('core-encounter-active','is-evacuating');
    window.SlimeTutorialIntro?.cancel();
    save.rewards=window.SlimeDailyRewards.normalize(save.rewards,save);
    save.wardrobe=window.SlimeWardrobe.normalize(save.wardrobe);
    if(tutorialIntroductionNeeded())document.body.dataset.tutorialIntro='hello';
    else delete document.body.dataset.tutorialIntro;
    clearMenuMutationPresentation();
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
      rerollPending: false,
      offerTransition: false
    };
    syncMenuCategoryVisuals({ instant: true });
    generateOffer();
    showScreen('home');
    renderDraft({ offerMotion: 'enter' });
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    void settleConveyorArrival(reducedMotion);
    persist();
  }

  function syncAdminPlanetUI() {
    const { selected, cores, unlocked } = save.planetCampaign;
    const planet = PLANETS.get(selected);
    els.adminPlanetName.textContent = planet.name;
    els.adminPlanetInfection.textContent = planet.worldId ? `${cores[selected]}% заражения` : '—';
    els.adminLowerInfectionBtn.disabled = !planet.worldId || !unlocked.includes(selected) || cores[selected] === 0;
  }

  function unlockInfectedWorldsFromAdmin() {
    if (session?.rerollPending || adInFlight || menuLaunchInProgress) return showToast('Дождись окончания обновления');
    const campaign = save.planetCampaign;
    const playable = PLANETS.planets.filter(planet => planet.worldId);
    const selected = PLANETS.get(campaign.selected).worldId ? campaign.selected : PLANETS.forWorld(save.world)?.id || 'home';
    save.planetCampaign = PLANETS.normalize({
      ...campaign,
      selected,
      unlocked: [...campaign.unlocked, ...playable.map(planet => planet.id)],
      cores: { ...campaign.cores, ...Object.fromEntries(playable.map(planet => [planet.id, 100])) },
      pending: []
    });
    save.world = PLANETS.get(selected).worldId;
    carouselWorldId = save.world;
    save.unlockedWorlds = [...new Set([...save.unlockedWorlds, ...playable.map(planet => planet.worldId)])];
    persist();
    sound('uiPress');
    showToast('Все миры открыты с заражением 100%');
  }

  function lowerInfectionFromAdmin() {
    if (session?.rerollPending || adInFlight || menuLaunchInProgress) return showToast('Дождись окончания обновления');
    const campaign = save.planetCampaign;
    const planet = PLANETS.get(campaign.selected);
    const before = campaign.cores[planet.id];
    const next = PLANETS.milestones.find(milestone => milestone < before);
    if (!planet.worldId || !campaign.unlocked.includes(planet.id) || next === undefined) return;
    const { campaign: updated } = PLANETS.applyDamage(campaign, planet.id, before - next);
    updated.pending = updated.pending.filter(event => event.planetId !== planet.id);
    save.planetCampaign = updated;
    const unlockedWorldIds = updated.unlocked.map(id => PLANETS.get(id).worldId).filter(Boolean);
    save.unlockedWorlds = [...new Set([...save.unlockedWorlds, ...unlockedWorldIds])];
    persist();
    sound('uiPress');
  }

  function resetProgressFromAdmin() {
    if (!window.confirm('Сбросить весь прогресс, улучшения, исследование, уровень и текущий набор еды?')) return;
    closePanel();
    closeOnboardingMemo(true);
    const storage = saveStorage || browserStorage();
    try {
      storage?.removeItem(SAVE_KEY);
      storage?.removeItem(SAVE_BACKUP_KEY);
      for (const legacyKey of LEGACY_SAVE_KEYS) storage?.removeItem(legacyKey);
    } catch (error) {
      console.warn('Save reset cleanup failed:', error);
    }
    save = structuredClone(defaultSave);
    carouselWorldId = null;
    adminInfiniteResearch = false;
    syncAdminInfiniteFlasksUI();
    syncAdminInfiniteUltimateUI();
    saveUpdatedAt = Date.now();
    saveRevision += 1;
    session = null;
    run = null;
    sound('uiPress');
    newDraft();
    flushCloudSave(true);
    closeAdminTools();
    restoreTutorial();
    showToast('Прогресс полностью сброшен');
  }

  function unlockEverythingFromAdmin() {
    save.researchUnits = Math.max(save.researchUnits, 9999);
    save.rewards = window.SlimeDailyRewards.unlockInfinity(save.rewards);
    save.researchProgress = 0;
    save.world = 1;
    carouselWorldId = save.world;
    save.stomachLevel = 4;
    save.unlockedSkins = SKINS.map(skin => skin.id);
    save.unlockedTrails = TRAILS.map(trail => trail.id);
    save.gameCompleted = true;
    save.unlockedWorlds = [...ACTIVE_WORLD_IDS];
    save.planetCampaign = PLANETS.normalize({unlocked:[...PLANETS.ids],selected:'home',cores:{home:0,candy:0,magma:0,desert:0}});
    for (const world of WORLDS) {
      save.unlockedLevels[world.id] = LEVEL_COUNT;
      save.selectedLevels[world.id] = 1;
      save.worldBest[world.id] = world.targetDepth;
      save.worldLastRun[world.id] = world.targetDepth;
      for (let level = 1; level <= LEVEL_COUNT; level += 1) {
        save.lastRunDepth[`${world.id}:${level}`] = levelTargetDepth(world, level);
      }
    }
    save.mutationExperience = Object.fromEntries(allMutations().map(mutation => [mutation.id, 2000]));
    save.activeDraft = null;
    session = null;
    persist();
    sound('coin');
    feedback([20, 35, 20]);
    newDraft();
    updatePersistentUI();
    showToast('Все миры открыты · осколки выданы');
  }

  function unlockMutationsFromAdmin(requestedStage = 3) {
    const stage = clamp(Math.floor(Number(requestedStage) || 1), 1, 3);
    save.rewards = window.SlimeDailyRewards.unlockInfinity(save.rewards);
    save.unlockedMutations = allMutations().map(mutation => mutation.id);
    save.mutationLevels = Object.fromEntries(save.unlockedMutations.map(id => [id, stage]));
    save.mutationLevels.infinity = stage;
    save.mutationExperience = PROGRESSION.migrateExperience(save.mutationExperience, save.unlockedMutations, save.mutationLevels);
    save.discoveredForms = [...save.unlockedMutations];
    save.mutationProgress = 0;
    save.mutationInvestTapCount = 0;
    pendingMutationReveal = null;
    if (session) {
      session.foods = session.foods.map(food => foodForMutation(foodRecipeFamily(food)) || food);
      session.offer = session.offer.map(food => food ? foodForMutation(foodRecipeFamily(food)) || food : null);
      recalcStats();
      syncMenuCategoryVisuals({ instant: true });
      renderDraft();
    }
    persist();
    updatePersistentUI();
    closeAdminTools();
    sound('coin');
    feedback([8, 14, 8]);
    showToast(`Все мутации · стадия ${['I', 'II', 'III'][stage - 1]}`);
  }

  function syncAdminInfiniteFlasksUI() {
    els.adminInfiniteFlasksBtn?.classList.toggle('active', adminInfiniteResearch);
    els.adminInfiniteFlasksBtn?.setAttribute('aria-pressed', String(adminInfiniteResearch));
    els.adminInfiniteFlasksBtn?.setAttribute('aria-label', `${adminInfiniteResearch ? 'Выключить' : 'Включить'} бесконечные осколки Аномалии`);
    if (els.adminInfiniteFlasksState) els.adminInfiniteFlasksState.textContent = adminInfiniteResearch ? 'Вкл.' : 'Выкл.';
  }

  function toggleAdminInfiniteFlasks() {
    adminInfiniteResearch = !adminInfiniteResearch;
    syncAdminInfiniteFlasksUI();
    updatePersistentUI();
    sound('uiPress');
    feedback(adminInfiniteResearch ? [5, 9, 5] : 5);
    showToast(adminInfiniteResearch ? 'Бесконечные осколки включены' : 'Бесконечные осколки выключены');
  }

  function syncAdminInfiniteUltimateUI() {
    els.adminInfiniteUltimateBtn?.classList.toggle('active', adminInfiniteUltimate);
    els.adminInfiniteUltimateBtn?.setAttribute('aria-pressed', String(adminInfiniteUltimate));
    els.adminInfiniteUltimateBtn?.setAttribute('aria-label', `${adminInfiniteUltimate ? 'Выключить' : 'Включить'} бесконечные способности и ульты`);
    if (els.adminInfiniteUltimateState) els.adminInfiniteUltimateState.textContent = adminInfiniteUltimate ? 'Вкл.' : 'Выкл.';
  }

  function toggleAdminInfiniteUltimate() {
    adminInfiniteUltimate = !adminInfiniteUltimate;
    try {
      (browserStorage() || saveStorage)?.setItem(ADMIN_INFINITE_ABILITIES_KEY, adminInfiniteUltimate ? '1' : '0');
    } catch (error) {
      console.warn('Admin ability preference save failed:', error);
    }
    syncAdminInfiniteUltimateUI();
    if (run) updateRunUI();
    sound('uiPress');
    feedback(adminInfiniteUltimate ? [5, 9, 5] : 5);
    showToast(adminInfiniteUltimate ? 'Бесконечные способности включены' : 'Бесконечные способности выключены');
  }

  function foodAvailableInWorld(food) {
    if (!activeMutationFamilies().includes(foodRecipeFamily(food))) return false;
    if (food?.requiresMutation && !(save.unlockedMutations || []).includes(food.requiresMutation)) return false;
    return !Array.isArray(food.worlds) || !food.worlds.length || food.worlds.includes(save.world);
  }

  function allMutations() {
    return [...STARTER_MUTATIONS, ...MUTATION_DISCOVERIES];
  }

  function availableSyntheses() {
    return save.legacyStarterAccess
      ? MUTATION_DISCOVERIES
      : [...STARTER_MUTATIONS.filter(mutation => mutation.id !== 'fire'), ...MUTATION_DISCOVERIES];
  }

  function allSynthesesUnlocked() {
    return availableSyntheses().every(mutation => save.unlockedMutations?.includes(mutation.id));
  }

  function mutationById(id) {
    if (id === 'infinity') return { ...INFINITY_MUTATION, image: INFINITY.EMBLEM };
    return allMutations().find(mutation => mutation.id === id) || null;
  }

  function mutationLevel(id) {
    if (id === 'infinity' ? !save.rewards?.infinityUnlocked : !save.unlockedMutations?.includes(id)) return 0;
    return clamp(Math.floor(Number(save.mutationLevels?.[id]) || 1), 1, 3);
  }

  function selectedUltimateStage(id) {
    const unlocked = mutationLevel(id);
    if (id === 'fire' || id === 'frost' || id === 'electric' || id === 'infinity') return unlocked || 1;
    return unlocked ? clamp(Math.floor(Number(save.mutationUltimateStages?.[id]) || unlocked), 1, unlocked) : 1;
  }

  function mutationIdForFamily(family) {
    if (family === 'infinity') return family;
    return allMutations().find(mutation => mutationFoodFamily(mutation.id) === family)?.id || '';
  }

  function selectedSlimeMutationId() {
    if (save.rewards?.infinityEquipped) return 'infinity';
    const fed = session?.foods?.[0];
    return fed ? mutationIdForFamily(foodRecipeFamily(fed)) : save.activeMutationPool?.[0] || save.selectedMutation || 'fire';
  }

  function slimeTaskCount(id = selectedSlimeMutationId()) {
    return Math.max(0, Math.floor(Number(save.mutationMastery?.[id]) || 0));
  }

  function slimeDevelopment(id, viewedStage, value = slimeTaskCount(id)) {
    return window.SlimeMutationMastery.state(id, mutationLevel(id), value, viewedStage);
  }

  function recordMutationAction(id, entity) {
    if (!run || run.ended || run.mutationId !== id || !entity || entity.masteryCredited) return;
    entity.masteryCredited = true;
    run.masteryGain = (run.masteryGain || 0) + 1;
  }


  function foodForMutation(id, stage = mutationLevel(id)) {
    return FOODS.find(food => foodRecipeFamily(food) === mutationFoodFamily(id) && food.stage === stage) || null;
  }

  function mutationLevelForFamily(family) {
    if (family === 'infinity') return mutationLevel(family);
    const id = (save.activeMutationPool || []).find(mutationId => mutationFoodFamily(mutationId) === family);
    return id ? mutationLevel(id) : 0;
  }

  function mutationFoodFamily(id) {
    return id === 'frost' ? 'ice' : id;
  }

  function activeMutationFamilies() {
    return save.rewards?.infinityEquipped ? ['infinity'] : (save.activeMutationPool || []).map(mutationFoodFamily);
  }

  function randomFood(exclude = [], preferredFamily = '', stage = 0) {
    if (stage > 3 || (preferredFamily && stage > mutationLevelForFamily(preferredFamily))) return null;
    const pool = FOODS.filter(food => foodAvailableInWorld(food)
      && (!preferredFamily || foodRecipeFamily(food) === preferredFamily)
      && (!stage || food.stage === stage)
      && !exclude.includes(food.id));
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  function generateOffer({ resetRerolls = true, saveOffer = true } = {}) {
    const offer = [null, null, null];
    if (window.SlimeHomeConsole && save.activeMutationPool.length > 1) {
      const selected = save.activeMutationPool.includes(save.selectedMutation) ? save.selectedMutation : save.activeMutationPool[0];
      save.activeMutationPool = [selected];
      save.selectedMutation = selected;
    }
    const activeFamilies = activeMutationFamilies();
    const used = (session?.foods || []).map(food => food.id);
    for (let i = 0; i < 3; i += 1) {
      const family = activeFamilies[i];
      if (!family) continue;
      const stage = mutationLevelForFamily(family);
      const food = randomFood(used, family, stage);
      offer[i] = food;
      if (food) used.push(food.id);
    }
    session.offer = offer;
    if (resetRerolls) {
      session.freeRerolls = 1;
      session.adRerolls = 0;
    }
    session.offersSeen += 1;
    if (saveOffer) persist();
  }

  const NANO_DRONE_SPRITE = 'effects-lab/assets/techno-drone-red-v1.webp';
  const NANO_MINI_DRONE_SPRITE = 'effects-lab/assets/techno-mini-drone-red-v2-lossless.webp';
  const MUTATION_REVEAL_BACKGROUNDS = Object.freeze({
    fire: 'assets/ui/mutation-reveal/fire-scene-v2-lossless.webp',
    electric: 'assets/ui/mutation-reveal/electric-scene-v2-lossless.webp',
    frost: 'assets/ui/mutation-reveal/frost-scene-v2-lossless.webp',
    cosmos: 'assets/ui/mutation-reveal/cosmos-scene-v2-lossless.webp',
    nano: 'assets/ui/mutation-reveal/nano-scene-v4-lossless.webp',
    telekinesis: 'assets/ui/mutation-reveal/telekinesis-scene-v2-lossless.webp',
    cloning: 'assets/ui/mutation-reveal/cloning-scene-v2-lossless.webp',
    phantom: 'assets/ui/mutation-reveal/phantom-scene-v2-lossless.webp',
    glitch: 'assets/ui/mutation-reveal/glitch-scene-v2-lossless.webp'
  });

  function technoMiniDronesMarkup(extraClass) {
    const sprite = versionedAsset(NANO_MINI_DRONE_SPRITE);
    return `<span class="mutation-element-fx mutation-techno-mini-fx ${extraClass}" aria-hidden="true"><img src="${sprite}" alt=""><img src="${sprite}" alt=""></span>`;
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
      return `<span class="mutation-element-fx mutation-cosmos-stage-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'nano') {
      return technoMiniDronesMarkup(extraClass);
    }
    if (normalizedFamily === 'telekinesis') {
      return `<span class="mutation-element-fx mutation-psionics-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'cloning') {
      return `<span class="mutation-element-fx mutation-spores-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    if (normalizedFamily === 'phantom') {
      return `<span class="mutation-element-fx mutation-phantom-fx ${extraClass}" aria-hidden="true"></span>`;
    }
    if (normalizedFamily === 'glitch') {
      return `<span class="mutation-element-fx mutation-glitch-fx ${extraClass}" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>`;
    }
    return '';
  }

  function infinityFoodFxMarkup(stage, extraClass) {
    return `<span class="infinity-food-fx ${extraClass}" data-infinity-stage="${stage}" aria-hidden="true">
      <i class="infinity-food-wisp is-pull"></i><i class="infinity-food-wisp is-return"></i>
      <i class="infinity-food-glint is-rising"></i><i class="infinity-food-glint is-crossing"></i><i class="infinity-food-glint is-falling"></i>
    </span>`;
  }

  function foodElementFxMarkup(food, extraClass) {
    const family = foodRecipeFamily(food);
    return family === 'infinity'
      ? infinityFoodFxMarkup(food.stage, extraClass)
      : mutationElementFxMarkup(family, extraClass);
  }

  function mutationRevealFxMarkup(mutation) {
    return mutationElementFxMarkup(mutation.id, 'mutation-prize-fx');
  }

  function mutationEmblemMarkup(mutation, { effects = true } = {}) {
    return `<span class="mutation-info-emblem mutation-family-${mutation.id}" aria-hidden="true"><span class="mutation-emblem-halo"></span>${effects ? mutationElementFxMarkup(mutation.id, 'mutation-info-fx') : ''}<img src="${versionedAsset(mutation.image)}" alt=""></span>`;
  }

  function mutationRevealBackgroundMarkup(mutation) {
    if (mutation.id !== 'nano') return '';
    const sprite = versionedAsset(NANO_MINI_DRONE_SPRITE);
    return `<span class="mutation-prize-background-drones" aria-hidden="true"><img src="${sprite}" alt=""><img src="${sprite}" alt=""></span>`;
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
    return { stats, effects: {} };
  }

  function recalcStats() {
    const result = calculateStatsForFoods(session.foods);
    session.stats = result.stats;
    session.effects = result.effects;
  }

  function createStomachSlot(food, index, { locked = false } = {}) {
    const slot = document.createElement('button');
    slot.type = 'button';
    slot.className = `stomach-quick-slot ${locked ? 'locked' : ''} ${food ? 'filled' : ''}`;
    if (food) {
      const effect = foodRecipeFamily(food) === 'infinity' ? infinityFoodFxMarkup(food.stage, 'food-slot-fx') : '';
      slot.innerHTML = `<span class="slot-art">${foodArtMarkup(food, 'food-mini-model')}${effect}</span>`;
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
    if (els.slimeFeedCount) els.slimeFeedCount.hidden = true;
    renderRecipeWorkbench();
  }

  const RECIPE_FAMILY_META = {
    fire: { glyph: '▲', label: 'ОГОНЬ' },
    infinity: { glyph: '∞', label: 'БЕСКОНЕЧНОСТЬ' },
    ice: { glyph: '◆', label: 'ЛЁД' }, electric: { glyph: 'ϟ', label: 'ТОК' },
    cosmos: { glyph: '✦', label: 'КОСМОС' },
    nano: { glyph: '◉', label: 'ТЕХНО' },
    telekinesis: { glyph: '◇', label: 'ПСИОНИКА' },
    cloning: { glyph: '◉', label: 'СПОРЫ' },
    phantom: { glyph: '◌', label: 'ФАНТОМ' },
    glitch: { glyph: '▣', label: 'ГЛИТЧ' },
    mixed: { glyph: '•', label: 'ЕДА' }
  };

  const RECIPE_FAMILY_ICONS = Object.freeze({
    infinity: INFINITY.EMBLEM,
    fire: 'assets/ui/recipe-categories/emblem-v2-fire.webp',
    ice: 'assets/ui/recipe-categories/emblem-v2-frost.webp',
    electric: 'assets/ui/recipe-categories/emblem-v2-electric.webp',
    cosmos: 'assets/ui/recipe-categories/emblem-v4-cosmos.webp',
    nano: 'assets/ui/recipe-categories/emblem-v4-techno.webp',
    telekinesis: 'assets/ui/recipe-categories/emblem-v4-psionics.webp',
    cloning: 'assets/ui/recipe-categories/emblem-v3-spores.webp',
    phantom: 'assets/ui/recipe-categories/emblem-v7-phantom-lossless.webp',
    glitch: 'assets/ui/recipe-categories/emblem-v4-glitch.webp',
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
    const stageLabel = endless ? 'БЕСКОНЕЧНЫЙ РЕЖИМ' : `ШАХТА ${worldDisplayNumber(world.id)}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `conveyor-start-card${entering ? ' launch-card-enter' : ''}`;
    button.setAttribute('aria-label', `${world.name}. ${stageLabel}. Начать падение`);
    button.innerHTML = `
      <span class="launch-card-booms" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="launch-card-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="launch-card-world"><small>ШАХТА ${worldDisplayNumber(world.id)}</small><b>${world.name}</b></span>
      <span class="launch-card-stage">${stageLabel}</span>
      <span class="launch-card-action"><i aria-hidden="true"></i><b>СТАРТ</b><i aria-hidden="true"></i></span>`;
    button.addEventListener('click', () => { void beginRoomLaunch({ endless: save.homeMode === 'endless' }); });
    els.foodChoices.appendChild(button);
  }

  function quickMutationChoices(pool = save.activeMutationPool || []) {
    const unlocked = new Set(save.unlockedMutations || []);
    return allMutations().filter(mutation => unlocked.has(mutation.id) && !pool.includes(mutation.id));
  }

  function conveyorEmblemStyle(family) {
    // Opaque medal bounds, excluding different transparent margins in the source art.
    const [size,x,y,right,bottom] = ({fire:[640,30,27,608,596],ice:[640,30,26,609,596],
      electric:[640,30,26,609,596],cosmos:[640,0,1,640,638],nano:[640,0,4,640,636],
      telekinesis:[640,0,3,640,636],cloning:[640,3,5,634,626],
      phantom:[384,6,4,375,374],glitch:[640,0,1,640,639],infinity:[640,26,25,610,599]})[family] || [640,0,0,640,640];
    return `--medal-width:${100*size/(right-x)}%;--medal-height:${100*size/(bottom-y)}%;--medal-left:${-100*x/(right-x)}%;--medal-top:${-100*y/(bottom-y)}%`;
  }

  function renderConveyorDispensers() {
    if (!els.conveyorDispensers) return;
    if (window.SlimeHomeConsole) { renderHomeConsole(); return; }
    const pool = save.activeMutationPool || [];
    const full = stomachIsFull();
    const hasReserve = quickMutationChoices(pool).length > 0;
    const canSwap = !full && hasReserve;
    const offerKey = `${pool.join('|')}|${full}|${hasReserve}`;
    els.conveyorDispensers.classList.toggle('hidden', !pool.length);
    if (els.conveyorDispensers.dataset.offerKey === offerKey) return;
    els.conveyorDispensers.dataset.offerKey = offerKey;
    els.conveyorDispensers.innerHTML = pool.map((id, index) => {
      const mutation = mutationById(id);
      const family = mutationFoodFamily(id);
      const icon = RECIPE_FAMILY_ICONS[family];
      return `<span class="conveyor-dispenser family-${family}" data-dispenser-index="${index}" style="${conveyorEmblemStyle(family)}">
        <button class="conveyor-pipe-socket" data-quick-mutation-slot="${index}" type="button" ${canSwap ? '' : 'disabled'} aria-label="${full ? 'Смена мутаций недоступна: слайм сыт' : !hasReserve ? 'Нет мутаций в запасе' : `Сменить мутацию синтезатора ${index + 1}: ${mutation?.name || 'пусто'}`}" aria-controls="quickMutationPicker" aria-expanded="false">${icon ? `<img src="${versionedAsset(icon)}" alt="">` : ''}</button>
        <span class="synthesis-emitter-glow"></span>
        <span class="synthesis-beam"></span>
      </span>`;
    }).join('');
    els.conveyorDispensers.querySelectorAll('[data-quick-mutation-slot]').forEach(button => {
      button.addEventListener('click', () => openQuickMutationPicker(Number(button.dataset.quickMutationSlot)));
    });
    scheduleHomeFit();
  }

  function closeQuickMutationPicker() {
    clearTimeout(quickMutationPickerTimer);
    quickMutationPickerTimer = null;
    document.removeEventListener('click', onQuickMutationPickerOutsideClick, true);
    document.removeEventListener('keydown', onQuickMutationPickerKeydown);
    if (els.quickMutationPicker) els.quickMutationPicker.hidden = true;
    els.conveyorDispensers?.querySelectorAll('[data-quick-mutation-slot]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  }

  function onQuickMutationPickerOutsideClick(event) {
    if (!els.quickMutationPicker?.contains(event.target) || !event.target.closest('[data-quick-mutation]')) {
      closeQuickMutationPicker();
      event.stopPropagation();
    }
  }

  function onQuickMutationPickerKeydown(event) {
    if (event.key === 'Escape') closeQuickMutationPicker();
  }

  function scheduleQuickMutationPickerClose() {
    clearTimeout(quickMutationPickerTimer);
    quickMutationPickerTimer = setTimeout(closeQuickMutationPicker, 4000);
  }

  function openQuickMutationPicker(slot) {
    if (!els.quickMutationPicker || document.body.dataset.screen !== 'home' || stomachIsFull() || session?.offerTransition) return;
    const choices = quickMutationChoices();
    if (!choices.length) return;
    closeQuickMutationPicker();
    selectedConveyorSlot = clamp(slot, 0, 2);
    sound('uiOpen');
    feedback(3);
    els.quickMutationPicker.innerHTML = `<div class="quick-mutation-head">ЗАМЕНИТЬ НА:</div>
      <div class="quick-mutation-list">${choices.map(mutation => `<button class="quick-mutation-option" data-quick-mutation="${mutation.id}" type="button" aria-label="Заменить на ${mutation.name}" title="${mutation.name}"><img src="${versionedAsset(mutation.image)}" alt=""></button>`).join('')}</div>`;
    els.quickMutationPicker.style.removeProperty('top');
    const homeBounds = els.homeScreen.getBoundingClientRect();
    const countBounds = els.conveyor.getBoundingClientRect();
    const homeScale = homeBounds.height / els.homeScreen.offsetHeight || 1;
    els.quickMutationPicker.hidden = false;
    const slotBounds = els.conveyorDispensers?.querySelector('[data-quick-mutation-slot]')?.getBoundingClientRect() || countBounds;
    const pickerHalfHeight = els.quickMutationPicker.offsetHeight / 2;
    const pickerCenter = (slotBounds.top - homeBounds.top - 12) / homeScale - pickerHalfHeight;
    els.quickMutationPicker.style.top = `${Math.max(pickerHalfHeight + 8, pickerCenter)}px`;
    els.conveyorDispensers?.querySelectorAll('[data-quick-mutation-slot]').forEach(button => button.setAttribute('aria-expanded', String(Number(button.dataset.quickMutationSlot) === selectedConveyorSlot)));
    els.quickMutationPicker.querySelectorAll('[data-quick-mutation]').forEach(button => {
      button.addEventListener('click', () => { void selectQuickMutation(selectedConveyorSlot, button.dataset.quickMutation); });
    });
    document.addEventListener('click', onQuickMutationPickerOutsideClick, true);
    document.addEventListener('keydown', onQuickMutationPickerKeydown);
    scheduleQuickMutationPickerClose();
  }

  async function selectQuickMutation(slot, id) {
    const unlocked = new Set(save.unlockedMutations || []);
    if (!unlocked.has(id) || stomachIsFull() || session?.offerTransition) return;
    const pool = [...(save.activeMutationPool || [])];
    if (pool.includes(id)) return;
    closeQuickMutationPicker();
    const changedSlots = [slot];
    pool[slot] = id;
    settleHomeRewardFlight();
    save.selectedMutation = id;
    save.activeMutationPool = pool;
    sound('uiSelect');
    feedback(6);
    if (!session) {
      renderConveyorDispensers();
      persist();
      return;
    }
    session.offerTransition = true;
    const used = [...session.foods, ...session.offer.filter((food, index) => food && !changedSlots.includes(index))].map(food => food.id);
    changedSlots.forEach(index => {
      const family = mutationFoodFamily(pool[index]);
      const stage = mutationLevelForFamily(family);
      session.offer[index] = randomFood(used, family, stage);
      if (session.offer[index]) used.push(session.offer[index].id);
    });
    session.offersSeen += 1;
    renderDraft();
    changedSlots.forEach(index => {
      const emblem = els.conveyorDispensers?.querySelector(`[data-dispenser-index="${index}"] .conveyor-pipe-socket`);
      emblem?.classList.add('quick-swapped');
      emblem?.addEventListener('animationend', () => emblem.classList.remove('quick-swapped'), { once: true });
      els.foodChoices.querySelector(`[data-offer-index="${index}"]`)?.classList.add('awaiting-dispense');
    });
    persist();
    await playConveyorDispense(menuReducedMotion);
    session.offerTransition = false;
    releaseConveyorControl();
  }

  async function playConveyorDispense(reducedMotion = false) {
    const cards = [...els.foodChoices.querySelectorAll('.conveyor-food-pick.awaiting-dispense')];
    if (!cards.length) return;
    window.SlimeFoodGrounding.fit();
    const dispensers = [...(els.conveyorDispensers?.querySelectorAll('.conveyor-dispenser') || [])];
    els.conveyor.classList.add('is-dispensing');
    cards.forEach((card, index) => {
      const delayMs = reducedMotion ? 0 : index * 70;
      card.style.setProperty('--dispense-delay', `${delayMs}ms`);
      card.classList.remove('awaiting-dispense');
      card.classList.add('food-synthesizing');
      setTimeout(() => {
        if (card.isConnected) card.classList.add('food-ready');
      }, reducedMotion ? 0 : delayMs + 1060);
      const dispenser = dispensers[Number(card.dataset.offerIndex || 0)];
      if (dispenser) {
        dispenser.style.setProperty('--dispense-delay', `${delayMs}ms`);
        dispenser.classList.add('is-dispensing');
      }
    });
    await new Promise(resolve => setTimeout(resolve, reducedMotion ? 30 : 1100 + Math.max(0, cards.length - 1) * 70));
    cards.forEach(card => {
      card.classList.remove('food-synthesizing');
      card.style.removeProperty('--dispense-delay');
    });
    dispensers.forEach(dispenser => {
      dispenser.classList.remove('is-dispensing');
      dispenser.style.removeProperty('--dispense-delay');
    });
    els.conveyor.classList.remove('is-dispensing');
  }

  async function settleConveyorArrival(reducedMotion = false) {
    await new Promise(resolve => setTimeout(resolve, reducedMotion ? 20 : 90));
    await playConveyorDispense(reducedMotion);
  }

  function releaseConveyorControl() {
    const readyToStart = conveyorCanStart();
    const rerollBlocked = session.rerollPending || session.offerTransition || adInFlight || menuLaunchInProgress || menuSlimeIsBusy();
    els.rerollBtn.disabled = rerollBlocked || (!UNLIMITED_FREE_REROLLS && !readyToStart && session.freeRerolls <= 0 && session.adRerolls > 0);
    syncWorldStartButton();
    scheduleHomeFit();
  }

  function syncWorldStartButton({ updatePlanet = true } = {}) {
    if (!els.worldStartBtn) return;
    const planet = PLANETS.get(save.planetCampaign.selected);
    const locked = !planet.worldId || !PLANETS.isUnlocked(save.planetCampaign, planet.id);
    const ready = !locked;
    els.worldStartBtn.disabled = !ready;
    els.worldStartBtn.classList.toggle('hungry', !ready);
    els.worldStartBtn.classList.toggle('ready', ready);
    els.worldStartBtn.setAttribute('aria-label', locked ? !planet.worldId ? 'Этот мир готовится' : 'Очисти предыдущую планету, чтобы открыть эту' : 'Отправиться в шахту');
    els.worldStartBtn.setAttribute('aria-busy', String(menuLaunchInProgress));
    if (els.worldStartText) els.worldStartText.textContent = 'ИГРАТЬ';
    renderHomeConsole({ updatePlanet });
  }

  function renderHomeConsole({ updatePlanet = true } = {}) {
    if (!window.SlimeHomeConsole) return;
    const selected = selectedSlimeMutationId();
    const stage = selected === 'infinity' || save.activeMutationPool?.includes(selected) ? mutationLevel(selected) : 0;
    const mutations = allMutations().map(mutation => ({id: mutation.id, name: mutation.name, image: versionedAsset(mutation.image), emblemStyle: conveyorEmblemStyle(mutationFoodFamily(mutation.id)), available: save.unlockedMutations.includes(mutation.id)}));
    if (save.rewards.infinityUnlocked) mutations.push({ ...INFINITY_MUTATION, image: versionedAsset(INFINITY.EMBLEM),
      emblemStyle: conveyorEmblemStyle('infinity'), available: true, reward: true });
    const flight = homeRewardFlight?.mutationId === selected ? homeRewardFlight : null;
    window.SlimeHomeConsole.render({
      selected, stage, stageBadge: stage ? versionedAsset(LAB_STAGE_BADGES[stage]) : '', fed: !!session?.foods?.length,
      busy: !!(session?.offerTransition || session?.rerollPending || adInFlight || menuLaunchInProgress || menuSlimeIsBusy()),
      mutations,
      task: stage ? slimeDevelopment(selected, Math.min(3, stage + 1), flight ? flight.experienceStart + flight.experienceShown : undefined) : null,
      onPickerToggle: open => sound(open ? 'uiOpen' : 'uiClose'),
      onSelect: selectFromHomePicker, onDetails: openHomeMutationDetails, onFeed: chooseFood
    });
    if (!updatePlanet) return;
    const worldId = currentWorld().id;
    window.SlimePortalWindow.syncHome(worldId, worldInfectionStage(worldId));
    window.SlimePlanetCarousel?.render({
      campaign: save.planetCampaign,
      busy: !!(session?.rerollPending || adInFlight),
      onSelect: selectHomePlanet,
      onBusy: busy => {
        if (planetPresentationBusy === busy) return;
        planetPresentationBusy = busy;
        syncWorldStartButton();
      },
      onAcknowledge: id => {
        save.planetCampaign = PLANETS.acknowledge(save.planetCampaign, id);
        persist({ refreshUI: false });
      },
      onRewardImpact: (event, planet) => {
        if (homeRewardFlight?.planetEventId === event.id) playHomeRewardFlight(planet);
      },
      onRewardProgress: (event, progress) => {
        const flight = homeRewardFlight;
        if (flight?.planetEventId !== event.id) return;
        if (flight.seek) flight.seek(progress);
        else if (progress === 1) settleHomeRewardFlight();
      }
    });
  }

  function selectFromHomePicker(id) {
    return selectHomeMutation(id);
  }

  function selectHomePlanet(id) {
    if (!PLANETS.ids.includes(id) || planetPresentationBusy || menuLaunchInProgress || session?.rerollPending || adInFlight) return;
    save.planetCampaign.selected = id;
    const planet = PLANETS.get(id);
    if (planet.worldId && PLANETS.isUnlocked(save.planetCampaign, id)) {
      save.world = planet.worldId;
      carouselWorldId = planet.worldId;
      save.unseenWorlds = (save.unseenWorlds || []).filter(worldId => worldId !== planet.worldId);
      ensureWorldBackgroundLayers(planet.worldId);
      updateSelectedWorldSummary();
    }
    sound('uiWorld'); feedback(6);
    persist({ refreshUI: false });
    syncWorldStartButton();
  }

  function selectedPlanetCanLaunch() {
    const planet = PLANETS.get(save.planetCampaign.selected);
    // A restart from the run menu must not wait for a hidden home presentation.
    const presentationAllowsLaunch = !planetPresentationBusy || document.body.dataset.screen === 'drop';
    return presentationAllowsLaunch && !!planet.worldId && PLANETS.isUnlocked(save.planetCampaign, planet.id);
  }

  function openHomeMutationDetails(id) {

    renderPanel('recipes');
    selectedLaboratoryMutationId = id;
    laboratoryView = id === 'infinity' || mutationLevel(id) ? 'mutations' : 'synthesis';
    renderRecipesPanel();
    const development = slimeDevelopment(id);
    if (laboratoryView === 'mutations' && development.ready) {
      const nextStage = $('#mutationUpgradeBtn') || $(`#mutationStage${development.targetStage}`);
      nextStage?.focus({ preventScroll: true });
    }
  }

  async function selectHomeMutation(id, { fromLaboratory = false } = {}) {
    if (!mutationLevel(id) || !mutationById(id) || menuLaunchInProgress || menuSlimeIsBusy({ignoreModal:fromLaboratory}) || session?.offerTransition || session?.rerollPending || adInFlight) return false;
    const infinityEquipped = save.rewards.infinityEquipped;
    if (id === 'infinity' ? infinityEquipped : !infinityEquipped && save.activeMutationPool.length === 1 && save.activeMutationPool[0] === id) return false;
    sound(fromLaboratory ? 'uiSelect' : 'mealSwitch');
    closeQuickMutationPicker();
    settleHomeRewardFlight();
    clearMenuMutationPresentation();
    feedback(6);
    const draft = session;
    if (draft) { draft.offerTransition = true; draft.foods = []; }
    if (save.rewards.infinityUnlocked) save.rewards.infinityEquipped = id === 'infinity';
    if (id !== 'infinity') {
      save.selectedMutation = id;
      save.activeMutationPool = [id];
    }
    syncWorldStartButton({ updatePlanet: false });
    try {
      laboratoryReplaceMode = false;
      selectedConveyorSlot = 0;
      if (draft) {
        generateOffer({ resetRerolls: false, saveOffer: false });
        const replaceMeal = () => {
          if (session !== draft) return;
          syncMenuCategoryVisuals({ instant: true });
          if (fromLaboratory) renderDraft();
          else {
            els.slimeStage.classList.remove('portal-ready');
            recalcStats();
            renderFoodChoices();
          }
        };
        if (fromLaboratory) replaceMeal();
        else {
          const food = draft.offer.find(Boolean);
          if (food) {
            const sprite = new Image();
            sprite.src = foodImageSource(food);
            await Promise.race([sprite.decode().catch(() => {}), mutationDelay(170)]);
          }
          if (session !== draft) return false;
          await window.SlimeHomeConsole.flashFood(() => {
            if (session !== draft) return;
            if (document.body.dataset.screen === 'home') sound('mealFlash');
            replaceMeal();
          }, () => {
            if (session === draft) sound('mealBeam');
          });
        }
      } else newDraft();
      if (draft && session !== draft) return false;
      if (id === 'frost') checkOnboardingProgress({event: 'frost-selected'});
      return true;
    } finally {
      if (session === draft && draft) draft.offerTransition = false;
      syncWorldStartButton({ updatePlanet: false });
      persist({ refreshUI: false });
    }
  }

  function renderFoodChoices(showDispense = false) {
    const cards = document.createDocumentFragment();
    session.offer.forEach((food, index) => {
      if (!food) {
        const gap = document.createElement('div');
        gap.className = 'conveyor-gap';
        gap.setAttribute('aria-hidden', 'true');
        cards.appendChild(gap);
        return;
      }
      const button = document.createElement('button');
      const recipeFamily = foodRecipeFamily(food);
      const foodMutationFx = foodElementFxMarkup(food, 'food-mutation-fx');
      const cardLocked = !canAddToStomach(food);
      button.className = `conveyor-food-pick mutation-family-${recipeFamily} ${showDispense ? 'awaiting-dispense' : 'food-ready'} ${cardLocked ? 'locked' : ''}`;
      button.dataset.foodId = food.id;
      button.dataset.offerIndex = String(index);
      const content = `<span class="conveyor-plate" aria-hidden="true"></span><span class="synthesis-floor-light" aria-hidden="true"></span><span class="synthesis-birth-blob" aria-hidden="true"></span><span class="synthesis-food-visual"><span class="food-ground-shadow" aria-hidden="true"></span>${foodMutationFx}<span class="food-model-wrap">${foodArtMarkup(food)}</span></span>`;
      button.innerHTML = window.SlimeHomeConsole ? `<span class="console-food-content">${content}</span>` : content;
      button.type = 'button';
      button.setAttribute('aria-label', `${food.name}. Нажми или перетащи к слайму`);
      button.addEventListener('pointerdown', event => beginFoodDrag(event, food, index, button));
      cards.appendChild(button);
    });
    els.foodChoices.replaceChildren(cards);
    if (window.SlimeHomeConsole) window.SlimeHomeConsole.fitFood();
    else window.SlimeFoodGrounding.schedule();
  }

  function renderDraft({ offerMotion = 'static', showLaunchCard = true } = {}) {
    recalcStats();
    updatePersistentUI();
    const showDispense = offerMotion === 'enter' && !window.SlimeHomeConsole;
    const full = stomachIsFull();
    const canLaunch = stomachCanLaunch();
    if (full) session.offer = [null, null, null];
    els.slimeStage?.classList.toggle('portal-ready', canLaunch);
    if (els.startDropLabel) els.startDropLabel.textContent = 'СТАРТ';
    if (els.startDropBtn) {
      els.startDropBtn.disabled = !canLaunch;
      els.startDropBtn.classList.toggle('stomach-locked', !canLaunch);
      els.startDropBtn.setAttribute('aria-label', canLaunch ? 'Начать падение' : 'Сначала дай слайму одну еду');
    }
    if (els.startEndlessBtn) {
      els.startEndlessBtn.disabled = !canLaunch || !save.gameCompleted;
      els.startEndlessBtn.classList.toggle('stomach-locked', !canLaunch);
    }
    syncWorldStartButton();
    els.conveyor.classList.remove('launch-ready');
    els.rerollBtn.disabled = session.rerollPending || session.offerTransition || adInFlight || menuLaunchInProgress;

    if (!window.SlimeHomeConsole) {
      els.slime.style.width = '124px';
      els.slime.style.height = '124px';
    }

    els.foodInside.replaceChildren();
    renderStomachSlots();

    renderConveyorDispensers();
    renderFoodChoices(showDispense);
    const rerollBlocked = session.rerollPending || session.offerTransition || adInFlight;
    const readyToStart = conveyorCanStart();
    els.rerollBtn.classList.toggle('confirm-mode', readyToStart);
    els.rerollBtn.setAttribute('aria-label', readyToStart ? 'Выбор готов. Начать падение' : 'Обновить еду на конвейере');
    if (readyToStart) {
      if (els.rerollTitle) els.rerollTitle.textContent = 'ВЫБОР ГОТОВ';
      if (els.rerollText) els.rerollText.textContent = 'СЛАЙМ ГОТОВ';
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
    els.rerollBtn.disabled = rerollBlocked || (!UNLIMITED_FREE_REROLLS && !readyToStart && session.freeRerolls <= 0 && session.adRerolls > 0);

    scheduleHomeFit();
    queueTutorialRender();
  }

  function beginFoodDrag(event, food, offerIndex, source) {
    if (!canAddToStomach(food) || event.button > 0 || session?.offerTransition || menuSlimeIsBusy()) return;
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
        ghost.innerHTML = `${foodElementFxMarkup(food, 'food-drag-mutation-fx')}<span class="food-drag-art">${foodArtMarkup(food, 'food-drag-model')}</span>`;
        document.body.appendChild(ghost);
        window.SlimeHomeConsole?.prepareFoodDrag(ghost, source);
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
      const accepted = !cancelled && (!moved || pointInsideElement(upEvent.clientX, upEvent.clientY, els.slime));
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
        chooseFood(offerIndex, moved ? null : source);
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

  function chooseFood(offerIndex, source = null, { forLaunch = false } = {}) {
    if (!session || session.offerTransition || menuMutationReveal || formDiscoverySequence) return 0;
    const food = session.offer[offerIndex];
    if (!canAddToStomach(food)) return 0;
    closeQuickMutationPicker();
    clearMenuSlimeInteraction();
    clearMenuMealReaction();
    const mealReaction = forLaunch
      ? { catchMs: 235, chewMs: 150, chewTime: '.15s', chews: 1, happyMs: 170 }
      : { catchMs: 250, chewMs: 630, chewTime: '.21s', chews: 3, happyMs: 380 };
    animateFoodToMouth(food, source, mealReaction.catchMs);
    source?.classList.add('food-picked');
    session.foods.push(food);
    settleHomeRewardFlight();
    if (foodRecipeFamily(food) !== 'infinity') save.selectedMutation = mutationIdForFamily(foodRecipeFamily(food));
    session.offer[offerIndex] = null;
    const appearance = preloadMenuAppearance(menuCategoryLevels()).catch(() => {});
    sound('eat', {
      swallowDelay: mealReaction.catchMs + mealReaction.chewMs
    });
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
        if (!forLaunch) els.slime.classList.add('pleased');
        recalcStats();
        revealMenuMutation({ quick: forLaunch, appearance });
        discoverCurrentForm({ animate: false });
        if (!forLaunch) sound('happy');
        if (save.tutorialStep === 'feed') {
          setTutorialStep('play');
        } else if (save.tutorialStep === 'second-feed' && stomachFoodCount() >= 1) {
          setTutorialStep('second-play');
        } else queueTutorialRender();
        checkOnboardingProgress();
        menuEmotionTimer = setTimeout(clearMenuMealReaction, mealReaction.happyMs);
      }, mealReaction.chewMs);
    }, mealReaction.catchMs);
    persist({ refreshUI: !forLaunch });
    feedback(8);
    if (!forLaunch) void advanceConveyorAfterChoice(offerIndex, source);
    return mealReaction.catchMs + mealReaction.chewMs;
  }

  function dissolveUneatenFood(chosenIndex, reducedMotion) {
    const fragments = [
      ['0% 0%,50% 0%,50% 50%', -16, -24],
      ['50% 0%,100% 0%,50% 50%', 14, -25],
      ['100% 0%,100% 100%,50% 50%', 28, -4],
      ['100% 100%,50% 100%,50% 50%', 15, 17],
      ['50% 100%,0% 100%,50% 50%', -13, 18],
      ['0% 100%,0% 0%,50% 50%', -26, -3]
    ];
    const flights = [];
    els.foodChoices.querySelectorAll('[data-offer-index]').forEach(button => {
      if (Number(button.dataset.offerIndex) === chosenIndex) return;
      const model = button.querySelector('.food-model-wrap img');
      if (!model) return;
      const bounds = model.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const visual = button.querySelector('.synthesis-food-visual');
      if (visual) visual.style.visibility = 'hidden';
      for (const [index, fragment] of (reducedMotion ? [[0, ['0% 0%,100% 0%,100% 100%,0% 100%', 0, 0]]] : fragments.entries())) {
        const image = document.createElement('img');
        image.className = 'food-dissolve-fragment';
        image.src = model.currentSrc || model.src;
        image.alt = '';
        image.style.cssText = `left:${bounds.left}px;top:${bounds.top}px;width:${bounds.width}px;height:${bounds.height}px;clip-path:polygon(${fragment[0]})`;
        document.body.appendChild(image);
        const animation = image.animate([
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${fragment[1] * .55}px,${fragment[2] * .55}px) scale(.98)`, opacity: .85, offset: .35 },
          { transform: `translate(${fragment[1]}px,${fragment[2]}px) scale(.7)`, opacity: 0 }
        ], { duration: reducedMotion ? 120 : 430, delay: reducedMotion ? 0 : index * 14, easing: 'ease-out', fill: 'forwards' });
        const cleanup = () => { animation.cancel(); image.remove(); };
        // Cleanup is independent of animation.finished, including background tabs.
        flights.push(new Promise(resolve => setTimeout(() => { cleanup(); resolve(); }, reducedMotion ? 140 : 520)));
      }
    });
    return Promise.all(flights);
  }

  async function advanceConveyorAfterChoice(chosenIndex, source) {
    if (!session || session.offerTransition) return;
    const draft = session;
    session.offerTransition = true;
    els.conveyor.classList.add('is-selecting');
    const chosenDispenser = els.conveyorDispensers?.querySelector(`[data-dispenser-index="${chosenIndex}"]`);
    chosenDispenser?.classList.add('is-recharging');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const full = stomachIsFull();
    await Promise.all([
      new Promise(resolve => setTimeout(resolve, reducedMotion ? 30 : 400)),
      full ? dissolveUneatenFood(chosenIndex, reducedMotion) : Promise.resolve()
    ]);
    if (session !== draft) return;
    const family = activeMutationFamilies()[chosenIndex];
    const stage = session.foods.filter(food => foodRecipeFamily(food) === family).length + 1;
    const used = [...session.foods, ...session.offer.filter(Boolean)].map(food => food.id);
    if (full) session.offer = [null, null, null];
    else session.offer[chosenIndex] = randomFood(used, family, stage);
    session.freeRerolls = 1;
    session.adRerolls = 0;
    if (session.offer[chosenIndex]) session.offersSeen += 1;
    renderDraft();
    if (session.offer[chosenIndex]) {
      els.foodChoices.querySelector(`[data-offer-index="${chosenIndex}"]`)?.classList.add('awaiting-dispense');
    }
    persist();
    if (session.offer[chosenIndex]) await playConveyorDispense(reducedMotion);
    session.offerTransition = false;
    els.conveyor.classList.remove('is-selecting');
    chosenDispenser?.classList.remove('is-recharging');
    releaseConveyorControl();
    if (conveyorCanStart()) {
      sound('happy');
      feedback([8, 18, 8]);
    }
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
      sound('uiFood');
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
    if (conveyorCanStart()) {
      void beginRoomLaunch({ endless: save.homeMode === 'endless' });
      return;
    }
    void rerollOffer();
  }

  function resetRoomLaunchVisuals() {
    els.slimeStage?.classList.remove('launch-charging', 'launch-opening');
    els.slime?.classList.remove('portal-surprised');
    document.body.classList.remove('room-launch-active');
    window.SlimePortalWindow.resetDeparture();
  }

  async function beginRoomLaunch(options = {}) {
    const planet = PLANETS.get(save.planetCampaign.selected);
    if (!session || menuLaunchInProgress || !planet.worldId || !PLANETS.isUnlocked(save.planetCampaign, planet.id)) return;
    if (carouselWorld().comingSoon || currentWorld().comingSoon) return;
    const endless = options.endless === true;
    if (endless && !save.gameCompleted) {
      showToast('Бесконечный мир откроется после прохождения игры');
      return;
    }

    const draft = session;
    const canContinue = () => menuLaunchInProgress && session === draft
      && document.body.dataset.screen === 'home' && !els.homeScreen.inert;
    let launched = false;
    let fedForLaunch = false;
    menuLaunchInProgress = true;
    syncWorldStartButton({ updatePlanet: false });
    try {
      while (canContinue() && (planetPresentationBusy || draft.offerTransition || draft.rerollPending || menuSlimeIsBusy())) {
        await mutationDelay(32);
      }
      if (!canContinue() || !selectedPlanetCanLaunch()) return;
      window.SlimePortalWindow.warmHomeDeparture();
      window.SlimePortalWindow.preload('lab');
      ensureWorldSprites(currentWorld().id);
      ensureWorldBackgroundLayers(currentWorld().id);
      sound('uiPress');
      feedback(7);
      if (!stomachCanLaunch()) {
        let index = draft.offer.findIndex(food => canAddToStomach(food));
        if (index < 0) {
          generateOffer({ resetRerolls: false });
          renderDraft();
          index = draft.offer.findIndex(food => canAddToStomach(food));
        }
        if (index < 0) {
          showToast('Сначала выбери мутацию в лаборатории');
          return;
        }
        const card = els.foodChoices.querySelector(`[data-offer-index="${index}"]`);
        const mealTime = chooseFood(index, card, { forLaunch: true });
        if (!mealTime) return;
        fedForLaunch = true;
        await mutationDelay(mealTime + 20);
        if (!canContinue()) return;
      }

      els.rerollBtn.disabled = true;
      els.slimeStage.classList.add('launch-charging');
      if (!fedForLaunch) await mutationDelay(menuReducedMotion ? 25 : 75);
      while (canContinue() && menuSlimeIsBusy()) await mutationDelay(16);
      if (!canContinue()) return;
      clearMenuMealReaction();
      clearMenuSlimeInteraction();
      document.body.classList.add('room-launch-active');
      els.slime.classList.add('portal-surprised');
      els.slimeStage.classList.add('launch-opening');
      syncBackgroundMusic();
      sound('portalOpen');
      feedback([8, 18, 10]);

      await mutationDelay(window.SlimePortalWindow.departureMs(menuReducedMotion));
      // Allow the hidden sprite's final frame to paint before switching scenes.
      const portalDeadline = performance.now() + 200;
      while (canContinue() && !window.SlimePortalWindow.departureFinished() && performance.now() < portalDeadline) {
        await mutationDelay(16);
      }
      if (!canContinue()) return;
      sound('portalPass');
      startDrop({ endless, fromPortal: true });
      launched = document.body.dataset.screen === 'drop';
    } finally {
      if (session === draft) {
        menuLaunchInProgress = false;
        if (launched) setTimeout(resetRoomLaunchVisuals, menuReducedMotion ? 90 : 900);
        else {
          resetRoomLaunchVisuals();
          syncBackgroundMusic();
          if (fedForLaunch) renderDraft();
          else releaseConveyorControl();
        }
      }
    }
  }

  function shiftRunClock(delta) {
    if (!run || delta <= 0) return;
    ELEMENTAL_ULTIMATES.shiftClock(run, delta);
    INFINITY.shiftClock(run.infinity, delta);
    COSMOS_ULTIMATES.shiftClock(run, delta);
    const timestampKeys = [
      'geyserLaunchGraceUntil', 'hurtFlashUntil', 'healGlowUntil', 'freezeUntil',
      'lastFrozenImpactAt', 'emotionUntil', 'damageInvulnerableUntil', 'bounceGraceUntil',
      'breakImpactAt', 'rockContactAt', 'rockFeedbackAt', 'electricImpactAt',
      'lastTrailSampleAt', 'lastUiUpdateAt',
      'hurtSlowUntil', 'lastHeartLossAt', 'jellyEnteredAt', 'lastJellyBubbleAt', 'freezeZoneEnteredAt',
      'mechExitZoneGraceUntil',
      'elementalAbilityUntil', 'elementalAbilityNextTickAt', 'fireFlashReadyAt', 'frostFlakeReadyAt', 'electricDashReadyAt', 'nanoBurstReadyAt', 'goldRushUntil', 'launchEntryStartedAt', 'launchEntryUntil',
      'cosmosCometIgnitedAt', 'cosmosOrbitSoundAt'
    ];
    for (const key of timestampKeys) if (run[key] > 0) run[key] += delta;
    if (run.tutorialDodge) { run.tutorialDodge.startedAt += delta; if (run.tutorialDodge.acceptedAt) run.tutorialDodge.acceptedAt += delta; }
    if (run.ultimateIntro) run.ultimateIntro.startedAt += delta;
    if (run.phoenixUltimate) run.phoenixUltimate.startedAt += delta;
    if (run.ultimateAudioCue) run.ultimateAudioCue.startedAt += delta;
    window.SlimeBrambleObstacles.shiftClock(run,delta);
    if (run.cosmosUltimate) {
      for (const key of ['startedAt', 'chargeUntil', 'fadeStartedAt', 'launchUntil', 'fadeUntil', 'lastSampleAt', 'ignitedAt', 'finishedAt', 'invulnerableBefore']) {
        if (run.cosmosUltimate[key] > 0) run.cosmosUltimate[key] += delta;
      }
      for (const sample of run.cosmosUltimate.trail) sample.at += delta;
    }
    if (run.cosmosOrbitHitUntil) run.cosmosOrbitHitUntil = run.cosmosOrbitHitUntil.map(at => at > 0 ? at + delta : 0);
    if (run.electricStorm) {
      run.electricStorm.startedAt += delta;
      run.electricStorm.nextStrikeAt += delta;
      if (run.electricStorm.impactAt != null) run.electricStorm.impactAt += delta;
      if (run.electricStorm.endedAt > 0) run.electricStorm.endedAt += delta;
    }
    for (const bolt of run.electricStormBolts || []) { bolt.startedAt += delta; bolt.until += delta; }
    for (const hit of run.electricStormHits || []) hit.at += delta;
    for (const key of ['phantomMarkNextAt', 'phantomPortalNextAt', 'phantomEnteredAt', 'phantomUntil', 'glitchNextInfectionAt']) if (run[key] > 0) run[key] += delta;
    for(const f of run.phantomFlights || []) if(f)f.startedAt += delta;
    for(const f of run.phantomSalvoFlights || []) f.startedAt += delta;
    for (const key of ['phantomVolleyNextAt', 'glitchPassiveInfectAt']) if (run[key] > 0) run[key] += delta;
    if (run.phantomPhase) run.phantomPhase.startedAt += delta;
    for (const sample of run.phantomPhase?.trail || []) sample.at += delta;
    for (const block of run.phantomMarkedBlocks || []) {
      if (block.phantomDetonateAt > 0) block.phantomDetonateAt += delta;
      if (block.phantomMarkedAt > 0) block.phantomMarkedAt += delta;
    }
    for(const p of run.phantomPortals || []){p.createdAt+=delta;p.expiresAt+=delta;}
    if(run.phantomExpress)run.phantomExpress.startedAt+=delta;
    if(Number.isFinite(run.energyHazardAt))run.energyHazardAt+=delta;
    if (run.glitchScreen) for (const key of ['startedAt', 'until']) run.glitchScreen[key] += delta;
    if (run.glitchShock) run.glitchShock.startedAt += delta;
    for (const burst of run.glitchBreakBursts || []) burst.startedAt += delta;
    if (run.glitchDisarm) { run.glitchDisarm.startedAt += delta; run.glitchDisarm.finishAt += delta; if (run.glitchDisarm.completedAt) run.glitchDisarm.completedAt += delta; }
    if (run.glitchDeleteQueue) for (const item of run.glitchDeleteQueue) item.at += delta;
    if (run.glitchHackQueue) for (const item of run.glitchHackQueue) item.at += delta;
    if (run.glitchSpreadQueue) for (const item of run.glitchSpreadQueue) item.at += delta;
    if (run.glitchChange) run.glitchChange.at += delta;
    for (const block of run.blocks || []) for (const key of ['glitchDeleteAt', 'glitchHackingUntil', 'glitchRewriteUntil', 'glitchTransformUntil', 'glitchFlashUntil', 'glitchDisperseUntil', 'glitchHitUntil']) {
      if (block[key] > 0) block[key] += delta;
    }
    for (const flask of run.flasks || []) if (flask.collectAfter > 0) flask.collectAfter += delta;
    TECHNO_ULTIMATES.shiftClock(run, delta);
    for (const mine of run.shieldMines || []) { mine.markedAt += delta; mine.launchedAt += delta; }
    if (run.shieldPop) run.shieldPop.at += delta;
    if (run.barrierStartedAt > 0) run.barrierStartedAt += delta;
    if (run.mechSuit) for (const key of ['startedAt', 'landAt', 'expireAt', 'lastCutAt', 'lastGrindSoundAt']) if (run.mechSuit[key] > 0) run.mechSuit[key] += delta;
    if (run.mechExplosion) run.mechExplosion.startedAt += delta;
    if (run.psionicReadyAt) run.psionicReadyAt += delta;
    if (run.psionicShot) {
      run.psionicShot.startedAt += delta;
      run.psionicShot.lastAt += delta;
      if (run.psionicShot.launchedAt) run.psionicShot.launchedAt += delta;
      shiftPsionicAssist(run.psionicShot,delta);
    }
    if (run.telekinesisNextAt > 0) run.telekinesisNextAt += delta;
    if (run.telekinesisCycle) {
      run.telekinesisCycle.startedAt += delta;
      for (const projectile of run.telekinesisCycle.projectiles) shiftPsionicAssist(projectile,delta);
    }
    if (run.psionicBarrier) { run.psionicBarrier.startedAt += delta; run.psionicBarrier.until += delta; if(Number.isFinite(run.psionicBarrier.lastPulseAt))run.psionicBarrier.lastPulseAt += delta; }
    for(const burst of run.psionicBarrierBursts || [])burst.startedAt += delta;
    if (run.telekinesisPress) run.telekinesisPress.startedAt += delta;
    if (run.telekinesisMarks) for (const mark of run.telekinesisMarks) mark.startedAt += delta;
    if (run.telekinesisBursts) for (const burst of run.telekinesisBursts) burst.startedAt += delta;
    if (run.phantomBursts) for (const burst of run.phantomBursts) burst.startedAt += delta;
    if (run.cloneUltimate) run.cloneUltimate.startedAt += delta;
    SPORE_COLOSSUS.shiftClock(run, delta);
    if (run.nextSporeAt > 0) run.nextSporeAt += delta;
    for (const projectile of run.sporeProjectiles || []) { projectile.launchedAt += delta; projectile.landsAt += delta; }
    for (const pod of run.sporePods || []) {
      pod.plantedAt += delta;
      pod.expiresAt += delta;
      if (pod.autoDetonateAt > 0) pod.autoDetonateAt += delta;
    }
    if (run.frostStorm) run.frostStorm.startedAt += delta;
    if (run.frostFlake) run.frostFlake.startedAt += delta;
    for (const burst of run.sporeBursts || []) burst.startedAt += delta;
    if (run.miniSlimes) for (const mini of run.miniSlimes) {
      for (const key of ['bornAt', 'lastSporeAt', 'ignoreSourceUntil', 'ignoreBlockUntil']) {
        if (mini[key] > 0) mini[key] += delta;
      }
    }
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
      if (block.rockBreakPose) block.rockBreakPose.at += delta;
      for (const key of ['visualCrackAt', 'visualCrackChangedAt', 'fireIgnitedAt', 'fireDamageAt', 'fireFlashUntil', 'electricFlashStartedAt', 'electricFlashUntil', 'frostFlashUntil', 'frostTransformStartedAt', 'frostReservedUntil', 'goldFlashUntil', 'snowballGhostUntil']) {
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
    syncBackgroundMusic();
    $('#tutorialSteeringDemo').hidden=true;
    if (run.tutorialPhase) { positionTutorialRunHint(); queueTutorialRender(); }
    flushRunResearchAwards(run);
    run.pausedAt = performance.now();
    stopUltimateAudio();
    cancelAnimationFrame(run.animationId);
    run.animationId = 0;
    run.lastTime = 0;
    clearFallSteering();
    updateRunUI();
    yandexPlatform?.gameplay.stop();
    return true;
  }

  function resumeRun() {
    if (!run || run.ended || !run.paused || run.portalTransitioning || document.hidden || platformSuspended || windowSuspended) return false;
    const now = performance.now();
    const pausedFor = Math.max(0, now - (run.pausedAt || now));
    shiftRunClock(pausedFor);
    if (run.ultimateReadyAt > 0) run.ultimateReadyAt += pausedFor;
    run.paused = false;
    run.pausedAt = 0;
    syncBackgroundMusic();
    run.tutorialLessonAt = performance.now();
    run.lastTime = 0;
    if (run.ultimateAudioCue) {
      const { name, startedAt } = run.ultimateAudioCue;
      playUltimateCue(name, now - startedAt, {resume:true});
    }
    updateRunUI();
    run.animationId = requestAnimationFrame(gameFrame);
    yandexPlatform?.gameplay.start();
    return true;
  }

  function hideRunMenu() {
    els.runMenuOverlay?.classList.add('hidden');
    els.endRunBtn?.setAttribute('aria-expanded', 'false');
    syncInteractionLayers();
    queueTutorialRender();
  }

  function openRunMenu() {
    if (corePreviewMode) { if (run?.paused) resumeRun(); else pauseRun({allowPortal:true}); return; }
    if (!run?.paused && !pauseRun()) return;
    stopAllSounds();
    updateRunSoundControl();
    els.runMenuOverlay.classList.remove('hidden');
    sound('uiOpen');
    els.endRunBtn.setAttribute('aria-expanded', 'true');
    syncInteractionLayers();
    queueTutorialRender();
    requestAnimationFrame(() => els.runMenuOverlay.querySelector('.run-menu-modal')?.focus({ preventScroll: true }));
  }

  function continueRunFromMenu() {
    hideRunMenu();
    sound('uiClose');
    if (!tutorialMemoState) resumeRun();
  }

  function toggleRunSound() {
    save.sound = !save.sound;
    if (!save.sound) stopAllSounds();
    persist();
    updateRunSoundControl();
    if (save.sound) {
      preloadGameAudio();
      sound('uiPress');
    }
    syncBackgroundMusic({gesture:true});
    feedback(5);
  }

  function restartCurrentRun() {
    if (!run || run.ended) return;
    const endless = run.endless;
    const lessonPhase=run.tutorialPhase;
    cancelAnimationFrame(run.animationId);
    hideRunMenu();
    run = null;
    if(lessonPhase)setTutorialStep(lessonPhase===1?'play':'second-play');
    persist();
    startDrop({ endless });
  }

  function finishRunFromMenu() {
    if (!run || run.ended) return;
    hideRunMenu();
    finishRunEarly();
  }

  function startDrop(options = {}) {
    if (!corePreviewMode && !selectedPlanetCanLaunch()) return;
    if(carouselWorld().comingSoon||currentWorld().comingSoon)return;
    const endless = options?.endless === true;
    const fromPortal = options?.fromPortal === true;
    GAME_BALANCE = window.SlimeBalance?.load?.() || GAME_BALANCE;
    if (!stomachCanLaunch()) {
      showToast('Сначала дай слайму одну еду');
      feedback([10, 18, 10]);
      return;
    }
    if (!fromPortal && menuSlimeIsBusy()) {
      showToast('Слайм ещё доедает');
      return;
    }
    if (endless && !save.gameCompleted) return showToast('Бесконечный мир откроется после прохождения игры');
    if (!fromPortal) {
      sound('uiPress');
      feedback([10, 25, 12]);
    }
    const baseWorld = currentWorld();
    if(save.unseenWorlds?.includes(baseWorld.id)){
      save.unseenWorlds=save.unseenWorlds.filter(id=>id!==baseWorld.id);
      persist({captureDraft:false,refreshUI:false});
    }
    ensureWorldSprites(baseWorld.id);
    ensureWorldBackgroundLayers(baseWorld.id);
    const level = endless ? LEVEL_COUNT : selectedLevelForWorld(baseWorld.id);
    const world = {
      ...baseWorld,
      targetDepth: levelTargetDepth(baseWorld, level),
      reward: levelReward(baseWorld, level),
      endlessScale: 1
    };
    const failureKey = `${world.id}:${level}`;
    const generationDifficulty = !endless && window.SlimeMinePlans?.modeForFailures(save.levelFailures?.[failureKey] || 0) === 'easy' ? 'easy' : 'normal';
    const preferredCellSize = world.cellSize || BALANCE.gridCell;
    const columns = Math.max(2, Math.round(VIEW_W / preferredCellSize));
    // Fill the shaft exactly. Six old 72px tiles occupied only 432px of the
    // 440px canvas and left a visible four-pixel seam on both sides.
    const cellSize = VIEW_W / columns;
    const tutorialPhase = !endless && world.id === 1 ? (save.tutorialStep === 'play' ? 1 : save.tutorialStep === 'second-play' ? 2 : 0) : 0;
    if (tutorialPhase) world.targetDepth = 350;
    const rowCount = tutorialPhase ? window.SlimeTutorialDescent.ROWS[tutorialPhase] : world.sharedDescent ? window.SlimeWorld1Descent.ROWS : 140;
    const finishY = 285 + rowCount * cellSize + cellSize * 1.5;
    const gridOffsetX = 0;
    const categoryVisuals = menuCategoryLevels();
    const infinityStage = tutorialPhase ? 0 : categoryVisuals.infinity;
    const mutationId = infinityStage ? 'infinity' : mutationIdForFamily(foodRecipeFamily(session.foods[0]));
    const elementalAbilityType = infinityStage ? 'infinity' : mutationId;
    if (infinityStage) window.SlimeAvatarRenderer.preloadAppearance({bodyVariant:'infinity'});
    const slimeRadius = massRadiusForLevel(categoryVisuals.mass, cellSize);
    const startLane = tutorialPhase ? 3 : fromPortal
      ? Math.floor(columns / 2)
      : columns % 2
        ? Math.floor(columns / 2)
        : Math.floor(columns / 2) - (Math.random() < .5 ? 1 : 0);
    const startX = gridOffsetX + startLane * cellSize + cellSize / 2;
    const launchEntryStartedAt = performance.now();
    hideGlitchChoice();
    glitchTileCache.clear();
    glitchTileCacheRun = null;
    if (fromPortal) {
      document.body.classList.add('portal-arrival');
      setTimeout(() => document.body.classList.remove('portal-arrival'), 1200);
    }
    const infection = worldInfectionHp(world.id);
    run = {
      worldId: world.id,
      backgroundStage: PLANETS.stage(infection),
      tutorialPhase, tutorialElapsed: 0, tutorialVeinRow: null, tutorialHint:null,
      level,
      world,
      previousBest: endless ? 0 : Math.min(world.targetDepth, Math.max(0, Math.floor(save.lastRunDepth?.[`${world.id}:${level}`] || 0))),
      finishY,
      rowCount,
      cellSize,
      baseSlimeRadius: slimeRadius,
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
      blocks: [], flasks: [], honeyZones: [], jellyZones: [], freezeZones: [], particles: [], trails: [], specialEffects: [],
      meteorShowers: [],
      slime: {
        x: startX,
        y: fromPortal ? -42 : 78,
        vx: tutorialPhase ? 0 : fromPortal ? rand(-18, 18) : rand(-65, 65),
        vy: fromPortal ? 720 : 40,
        radius: slimeRadius,
        wobble: 0
      },
      categoryVisuals, mutationId, passiveLevels: infinityStage ? {} : {
        [mutationId]: mutationId === 'fire' || mutationId === 'electric' ? mutationLevel(mutationId) : 2
      },
      infinity: infinityStage ? INFINITY.create(infinityStage, launchEntryStartedAt) : null,
      ultimateStage: infinityStage || selectedUltimateStage(mutationId), ultimateProfile: infinityStage ? null : ULTIMATE_STAGES.get(mutationId, selectedUltimateStage(mutationId)),
      nanoNextShotAt: launchEntryStartedAt + TECHNO_ULTIMATES.PASSIVE_INTERVAL_MS,
      nanoLastShotAt: 0,
      nanoBurst: null,
      nanoBurstReadyAt: 0,
      nanoShots: [],
      mechSuit: null,
      mechExplosion: null,
      mechExitZoneGraceUntil: 0,
      telekinesisNextAt: launchEntryStartedAt + 1500,
      telekinesisMarks: [],
      telekinesisCycle: null,
      telekinesisBursts: [],
      telekinesisThrowIndex: 0,
      telekinesisUltimatePending: false,
      telekinesisPress: null,
      psionicBarrier: null,
      psionicBarrierBursts: [],
      phantomMarkNextAt: launchEntryStartedAt + PHANTOM_MARK_INTERVAL_MS,
      phantomPortalNextAt: launchEntryStartedAt + PHANTOM_PORTAL_INTERVAL_MS,
      phantomFlights: [null,null],
      phantomSalvoFlights: [],
      phantomVolleyRemaining: 0, phantomVolleyNextAt: 0, phantomSpiritSequence: 0, phantomPhase: null,
      phantomPortals: [],
      phantomExpress: null,
      phantomEnteredAt: 0,
      phantomUntil: 0,
      phantomMarkedBlocks: new Set(),
      phantomBursts: [],
      glitchNextInfectionAt: launchEntryStartedAt + 1500,
      glitchPassiveInfectAt: 0,
      glitchInfectedBlocks: new Set(),
      glitchShock: null,
      glitchBreakBursts: [],
      glitchDisarm: null,
      glitchChoice: null,
      glitchScreen: null,
      glitchDeleteQueue: [],
      glitchHackQueue: [],
      glitchSpreadQueue: [],
      glitchChange: null,
      miniSlimes: [],
      sporeProjectiles: [],
      sporePods: [],
      sporeBursts: [],
      nextSporeAt: 0,
      cloneUltimate: null,
      sporePop: null,
      giantMushroom: null,
      viewHeight: VIEW_H,
      viewWidth: VIEW_W,
      elementalAbilityType,
      ultimateReadyAt: 0,
      fireFlashReadyAt: 0,
      frostFlakeReadyAt: 0,
      frostFlake: null,
      electricDashReadyAt: 0,
      electricDash: null,
      phoenixChargedFromDepth: 0,
      elementalAbilityActive: '',
      stagedUltimate: null,
      elementalAbilityUntil: 0,
      elementalAbilityNextTickAt: 0,
      elementalAuraId: 0,
      ultimateIntro: null,
      phoenixUltimate: null,
      electricStorm: null,
      electricStormBolts: [],
      electricStormHits: [],
      frostStorm: null,
      goldRushUntil: 0,
      massPierceRowsLeft: 0,
      massPierceStrongLeft: 0,
      massPierceRows: new Set(),
      massPierceTriggered: false,
      speedPressure: 0,
      speedBurstChargeMs: 0,
      speedBurstReady: false,
      speedBurstBlocksLeft: 0,
      speedBurstUntil: 0,
      cosmosCometIgnitedAt: 0,
      cosmosUltimate: null,
      cosmosStagedUltimate: null,
      cosmosOrbitClock: 0,
      cosmosOrbitAlpha: 0,
      cosmosOrbitPrevious: null,
      cosmosOrbitContacts: [new Set(), new Set()],
      cosmosOrbitCooldowns: new WeakMap(),
      cosmosOrbitHitUntil: [0, 0],
      cosmosOrbitSoundAt: 0,
      steer: {
        keys: new Set(),
        pointers: new Map(),
        lastDirection: ''
      },
      gravityDirection: 1,
      hurtSlowUntil: 0,
      geyserCapture: null,
      geyserLaunchGraceUntil: 0,
      geyserBreaksLeft: 0,
      energy: 100,
      maxEnergy: 100,
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
      jellySubmergedZoneId: '',
      jellyExitTriggeredId: '',
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
      barrierStartedAt: 0,
      shieldPop: null,
      shieldMines: [],
      bounceControlLockUntil: 0,
      bounceControlRestoreUntil: 0,
      wallPushSide: 0,
      wallReleaseX: 0,
      coinMultiplier: session.stats.coinMultiplier,
      effects: { ...session.effects },
      blocksBrokenForHeal: 0,
      shieldCharges: 0,
      maxShieldCharges: 1,
      coins: 0,
      researchData: 0,
      masteryGain: 0,
      experienceEarned: 0,
      experiencePendingGain: 0,
      experienceHudFrame: 0,
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
      electricImpactAt: -Infinity,
      damageInvulnerableUntil: fromPortal ? launchEntryStartedAt + 620 : 0,
      bounceGraceUntil: 0,
      impactGroupId: 0,
      lowMotionTime: 0,
      lastPosition: { x: startX, y: fromPortal ? -45 : 78 },
      trailPoints: [],
      nextTrailPointId: 0,
      lastTrailSampleAt: 0
    };
    preloadMineAudio({ fire: mutationId === 'fire' });
    ENERGY.init(run);
    run.strengthEmblem=run.infinity ? INFINITY.EMBLEM : allMutations().find(m=>m.id===run.mutationId)?.image || '';
    EVAC.preload();
    run.blocks = generateBlockField(run);
    run.energyPickups = window.SlimeEnergyPickups.build(run);
    els.shaft.classList.remove('core-encounter-active','is-evacuating');
    if (!run.endless) {
      run.coreArena = CORE.arena(run, VIEW_W, VIEW_H);
      run.coreArena.hp = save.planetCampaign.cores[PLANETS.forWorld(run.worldId)?.id] ?? 100;
      run.portalY = run.coreArena.surfaceY + 170;
      CORE.preload();
      const strike = CORE.strikeKind(run);
      if(strike==='fire')window.SlimeFireCoreStrike.prewarm();
      if(strike==='electric')window.SlimeElectricCoreStrike.prewarm();
      if(strike==='frost')window.SlimeFrostCoreStrike.prewarm();
      if(strike==='cosmos')prepareCosmosCoreStrike(true);
      if(strike==='techno')window.SlimeTechnoCoreStrike.prewarm();
      if(strike==='phantom')window.SlimePhantomCoreStrike.prepare();
      if(strike==='psionic')window.SlimePsionicCoreStrike.prewarm(run.worldId);
      if(strike==='glitch')window.SlimeGlitchCoreStrike.prepare();
      if(strike==='spores')window.SlimeSporesCoreStrike.prepare();
      if(strike==='infinity')window.SlimeInfinityCoreStrike.prepare();
    }
    indexRunBlocks();
    run.flasks = generateFlasks(run);
    run.honeyZones = generateHoneyZones(run);
    run.jellyZones = generateJellyZones(run);
    run.freezeZones = generateFreezeZones(run);
    prepareCanvas();
    showScreen('drop');
    run.arrivalPortalScreenY=Math.max(150,runHudBottomLogical()+68);
    els.runExperienceHud?.classList.remove('is-hit', 'is-tier-up');
    if (els.runExperienceHud) els.runExperienceHud.dataset.stage = '0';
    clearRunImpactFeedback();
    updateRunUI();
    if (document.hidden || platformSuspended || windowSuspended) {
      autoResumeRunAfterVisibility = pauseRun({ allowPortal: true }) || autoResumeRunAfterVisibility;
    } else {
      yandexPlatform?.gameplay.start();
      run.animationId = requestAnimationFrame(gameFrame);
    }
    if (tutorialPhase === 1) setTutorialStep('post-run');
    else if (tutorialPhase === 2) setTutorialStep('second-run');
    checkOnboardingProgress({ event: 'run-start' });
  }

  function prepareCanvas() {
    const dpr = Math.min(isLowPowerDevice() ? 1.25 : isMobileDevice() ? 1.5 : 1.75, window.devicePixelRatio || 1);
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
    if (category === 'ore') return { tier:'dense', special:null, zone };
    const rawWorldSpecialIds = window.SlimeBalance?.specialIdsForWorld?.(world.id)
      || (world.id === 2
        ? ['heal', 'cryo']
        : world.id === 3
          ? ['heal', 'jelly']
          : world.id === 4
            ? ['heal', 'geyser', 'meteor']
          : ['heal', 'bomb', 'spring']);
    const worldSpecialIds = [...new Set(rawWorldSpecialIds.map(id => world.id === 3 && (id === 'appleMint' || id === 'appleRed') ? 'jelly' : id))]
      .filter(id => !(world.id === 1 && id === 'spring') && !(world.id === 3 && id === 'jelly') && id !== 'snowflake' && id !== 'freezeZone');
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
    if ('123cigd'.includes(token)) return { ...weak, dead: true, flaskTier: Number(({ c: 1, i: 2, g: 3, d: 3 })[token] || token) };
    if (token === '+') return unlocks?.medkit && levelAllows(world, level, 'heal')
      ? { tier: 'special', special: 'gel', hazard: false, path: true }
      : weak;
    if (token === 'z') {
      if (world.id === 1) return { ...weak, dead: true, environment: 'jelly', path: true };
      if (world.id === 2) return { ...weak, dead: true, environment: 'freeze', path: true };
      if (world.id === 3) return weak;
    }
    if (token === 'p' || token === 'q' || token === 'z') {
      const specialByWorld = {
        1: { p: 'bomb', q: 'bomb', z: 'bomb' },
        2: { p: 'cryo', q: 'cryo', z: 'cryo' },
        3: {},
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

  function generatePlannedDescent(runState) {
    runState.sharedDescent = true;
    runState.embeddedVeins = true;
    const planet=PLANETS.forWorld(runState.worldId);
    const coreHp=save.planetCampaign.cores[planet?.id]??100;
    runState.hazardStage=coreHp>75?1:coreHp>50?2:coreHp>25?3:4;
    const normal = window.SlimeWorld1Descent.build({ columns: runState.columns, stage:[1,3,4,5,6].includes(runState.worldId)?runState.hazardStage:1, worldId:runState.worldId });
    runState.terrainPlan=normal;
    if(runState.worldId===1)window.SlimeThornHazards.preload();
    const layout = runState.tutorialPhase ? window.SlimeTutorialDescent.build({ phase: runState.tutorialPhase, normal, columns: runState.columns }) : normal;
    runState.tutorialVeinRow = layout.firstVeinRow ?? null;
    runState.tutorialRoute = layout.guideCols || null;
    runState.tutorialHazard = layout.firstHazard || null;
    runState.tutorialHeal = layout.heal || null;
    runState.tutorialVein = layout.firstVein || null;
    const blocks = [];
    const movingHazards = [];
    const cell = runState.cellSize;
    const originY = 285;
    for (let row = 0; row < layout.rows; row += 1) {
      for (let col = 0; col < runState.columns; col += 1) {
        const planned = layout.cells[row][col];
        const centerOffset = planned.fungi?.kind === 'toadstool' || (planned.tech?.kind === 'slowCore' && runState.columns % 2 === 0) ? .5 : 0;
        const x = runState.gridOffsetX + (col + centerOffset) * cell;
        const y = originY + row * cell;
        const breakableHazard=Boolean(planned.fungi||planned.tech||(planned.ice&&planned.ice.kind!=='frostSpike')||(planned.water&&planned.water.kind!=='vortex'));
        const baseMaxHp=blockHpForTier(planned.tier,runState.world,row/layout.rows,row,col,planned.path);
        const maxHp = planned.fungi ? {spore:1,fungusTurret:2,toadstool:1}[planned.fungi.kind] : planned.ice ? {frostSpike:1,iceMortar:2,iceBlock:2}[planned.ice.kind] : planned.bramble ? (planned.bramble.core?1:4) : planned.water ? {vortex:1,tentacle:2,seaMine:1}[planned.water.kind] : planned.tech ? {mine:1,turret:2,laser:3,slowCore:1}[planned.tech.kind] : planned.hazard || planned.special ? 1 : baseMaxHp;
        const block = {
          id: blocks.length, row, col, x, y, w: cell, h: cell,
          hp: maxHp, maxHp, tier: planned.tier, special: planned.special,
          material: planned.hazard ? 'hazard'
            : row === 0 && runState.worldId === 1 ? 'grass'
              : chooseMaterial(runState.world, row / layout.rows, planned.special, planned.tier),
          dead: planned.dead, path: planned.path, segment: 'descent',
          hazard: planned.hazard, unbreakable: planned.hazard&&!breakableHazard, breakableHazard,
          tech:planned.tech?{...planned.tech}:null,water:planned.water?{...planned.water}:null,
          bramble:planned.bramble?{...planned.bramble,baseMaxHp}:null,
          ice:planned.ice?{...planned.ice}:null,
          fungi:planned.fungi?{...planned.fungi}:null,
          hazardKind:planned.hazardKind||'static', hazardVariant: null, frozen: false, visualId: '', environmentRemoved: planned.environment || '',
          flaskTier: planned.flaskTier, topGrass: runState.worldId === 1 && row === 0, coins: 0
        };
        if (planned.motion) {
          block.motion = {
            axis: planned.motion.axis,
            min: planned.motion.axis === 'x'
              ? runState.gridOffsetX + planned.motion.from * cell
              : originY + planned.motion.from * cell,
            max: planned.motion.axis === 'x'
              ? runState.gridOffsetX + planned.motion.to * cell
              : originY + planned.motion.to * cell,
            phase: planned.motion.phase,
            period: planned.motion.period * .85
          };
          movingHazards.push(block);
        }
        if(planned.chase&&!runState.tutorialPhase){
          block.chase={x,y,state:'idle',age:0};
          movingHazards.push(block);
        }
        blocks.push(block);
      }
    }
    runState.movingHazards = movingHazards;
    window.SlimeBrambleObstacles.init(runState,blocks);
    window.SlimeTechHazards.init(runState,blocks);
    window.SlimeWaterHazards.init(runState,blocks);
    window.SlimeIceHazards.init(runState,blocks);
    window.SlimeFungiHazards.init(runState,blocks);
    return blocks;
  }

  function waterHazardImmune(timestamp){
    return mechSuitActive()||psionicBarrierActive(timestamp)||phantomActive(timestamp)||speedDrillActive(timestamp)
      ||Boolean(run.cosmosUltimate&&!run.cosmosUltimate.finishedAt&&timestamp<run.cosmosUltimate.fadeUntil);
  }
  function hurtFromWaterHazard(x,y,timestamp){
    if(!waterHazardImmune(timestamp))return hurtFromTechHazard(x,y,timestamp);
    return false;
  }
  function detonateWaterMine(block,timestamp){
    return window.SlimeWaterHazards.detonate(run,block,{
      hurt:(x,y)=>hurtFromWaterHazard(x,y,timestamp),
      detonate:source=>{
        if(!source.dead)destroyBlock(source,'waterMine',timestamp);
        explodeBomb(source,0,false);
        if(source.y>run.cameraY-150&&source.y<run.cameraY+VIEW_H+150){
          spawnSpecialBurst('cryo',source.x+source.w/2,source.y+source.h/2,0,-1,1.3);
          sound('hitHard');feedback([12,18]);run.shake=Math.max(run.shake,7);
        }
      }
    });
  }

  function hurtFromTechHazard(x,y,timestamp){
    if(!run||run.evacuation||run.ended||timestamp<run.damageInvulnerableUntil)return false;
    const proxy=run.techAttackProxy||(run.techAttackProxy={id:-1,w:8,h:8,hp:1,maxHp:1,hazard:true,unbreakable:true,techAttack:true});
    proxy.x=x-4;proxy.y=y-4;
    const dx=run.slime.x-x,dy=run.slime.y-y,length=Math.hypot(dx,dy)||1;
    return resolveHazardHit(proxy,{nx:dx/length,ny:dy/length,penetration:0},timestamp);
  }

  function hurtFromIceHazard(x,y,timestamp){
    if(waterHazardImmune(timestamp)||window.SlimeIceHazards.locked(run))return false;
    const before=run.energy;hurtFromTechHazard(x,y,timestamp);
    if(run.energy<before&&!run.evacuation){window.SlimeIceHazards.addFrost(run);return true;}
    return false;
  }

  function applyFungiPoison(x,y,timestamp){
    if(!run||run.ended||run.evacuation||run.coreEncounter||waterHazardImmune(timestamp)||timestamp<run.damageInvulnerableUntil)return false;
    if (INFINITY.protectsDuringUltimate(run.infinity, timestamp)) return false;
    if(run.barrier>0||run.infinity?.shield){hurtFromTechHazard(x,y,timestamp);return false;}
    if(!window.SlimeFungiHazards.poison(run))return false;
    run.damageInvulnerableUntil=timestamp+800;
    run.emotion='hurt';run.emotionUntil=timestamp+450;
    sound('hitHard');feedback([9,12]);return true;
  }

  function drainFungiPoison(amount,timestamp){
    if(!run||run.ended||run.evacuation)return;
    if (INFINITY.protectsDuringUltimate(run.infinity, timestamp)) return;
    if (triggerInfinityShield({nx:0,ny:-1,penetration:0}, timestamp)) {
      run.fungiStatus.poison = 0;
      return;
    }
    const spent=-ENERGY.change(run,-amount,'hazard',timestamp);
    run.energyStats.poisonSpent=(run.energyStats.poisonSpent||0)+spent;
    updateRunUI();
    if(run.energy<=0)endRun(false,'Сила закончилась');
  }

  function updateMovingHazards(timestamp,dt=0) {
    window.SlimeThornHazards.update(run,dt);
  }

  function triggerInfinityShield(collision, timestamp) {
    const nx = collision.nx;
    const ny = collision.ny || (nx ? 0 : -1);
    if (!INFINITY.absorb(run.infinity, timestamp, nx, ny)) return false;
    const slime = run.slime;
    run.infinity.shieldBurst = { x: slime.x, y: slime.y };
    const separation = collision.penetration + 4;
    slime.x = clamp(slime.x + nx * separation, slime.radius, VIEW_W - slime.radius);
    slime.y += ny * separation;
    applyBlockBounce(slime, { nx, ny }, { hazard: true, timestamp, steeringEnabled: false });
    slime.vx += nx * 76;
    slime.vy += ny * 76;
    resetFallMomentum(run);
    run.flightDistance = 0;
    run.damageInvulnerableUntil = timestamp + 700;
    run.shake = Math.max(run.shake, menuReducedMotion ? 1.5 : 5);
    sound('shieldPop');
    feedback([9, 16, 19]);
    updateRunUI();
    return true;
  }

  function deflectNearbyInfinityThreat(timestamp) {
    if (!run.infinity?.shield || run.barrier > 0 || run.portalEntry || timestamp < run.damageInvulnerableUntil) return false;
    if (INFINITY.protectsDuringUltimate(run.infinity, timestamp)) return false;
    const slime = run.slime;
    const cell = run.cellSize;
    const margin = cell * .12;
    const awake = block => !block.dead && !block.glitchNeutralized && !block.frozen && !block.elementalSnow && !block.elementalSnowflake;
    let near = null;
    const consider = hit => {
      if (hit && hit.penetration > (near?.penetration ?? 0)
        && (hit.penetration > margin || slime.vx * hit.nx + slime.vy * hit.ny < 0)) near = hit;
    };
    for (const block of blocksNearY(slime.y, slime.radius + margin)) {
      if (awake(block) && (block.hazard || block.ice || block.tech || block.water || block.fungi)) {
        consider(circleRectCollision(slime, block, slime.radius + margin));
      }
    }
    const fieldEdge = (block, halfRows) => {
      const dy = slime.y - block.y - block.h / 2;
      const gap = Math.abs(dy) - halfRows * cell;
      if (gap >= -margin && gap < slime.radius + margin) {
        consider({nx:0, ny:Math.sign(dy), penetration:slime.radius + margin - gap});
      }
    };
    const technology = window.SlimeTechHazards;
    for (const block of run.techHazards || []) {
      if (!awake(block)) continue;
      if (block.tech.kind === 'slowCore') fieldEdge(block, technology.FIELD_ROWS);
      if (block.tech.kind === 'laser' && block.tech.state === 'active') {
        const y = block.y + block.h / 2 - cell * .12;
        if (Math.abs(slime.y - y) > slime.radius + cell * .24 + margin) continue;
        for (const [left, right] of technology.beamRanges(run, block)) {
          consider(circleRectCollision(slime, { x:left, y, w:right-left, h:cell*.24 }, slime.radius + margin));
        }
      }
    }
    for (const block of run.fungiHazards || []) {
      if (block.fungi.kind === 'toadstool' && awake(block)) fieldEdge(block, window.SlimeFungiHazards.CONFIG.cloudRows / 2);
    }
    let projectile = null;
    let source = null;
    for (const shots of [run.techShots, run.fungiShots]) {
      for (const shot of shots || []) {
        const dx = slime.x - shot.x;
        const dy = slime.y - shot.y;
        const distance = Math.hypot(dx, dy);
        const penetration = slime.radius + shot.r + margin - distance;
        const closing = dx * (slime.vx - shot.vx) + dy * (slime.vy - shot.vy) < 0;
        if (penetration <= (near?.penetration ?? 0) || (!closing && penetration <= margin)) continue;
        near = { nx: dx / (distance || 1), ny: dy / (distance || 1), penetration };
        projectile = shot;
        source = shots;
      }
    }
    if (!near || !triggerInfinityShield(near, timestamp)) return false;
    if (projectile) source.splice(source.indexOf(projectile), 1);
    return true;
  }

  function generateBlockField(runState) {
    if (runState.world.sharedDescent) return generatePlannedDescent(runState);
    const { world, finishY } = runState;
    const blocks = [];
    const cell = runState.cellSize || BALANCE.gridCell;
    const columns = runState.columns || Math.floor(VIEW_W / cell);
    const gridOffsetX = runState.gridOffsetX || 0;
    const startY = 285;
    const rows = runState.rowCount || 140;
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
            && levelAllows(world, runState.level, 'hazard')
            && Math.random() < lerp(.035, .075, progress);
        const hazardVariant = null;
        const finalTier = special ? 'special' : tier;
        const customVisuals = contentWorld(world.id)?.blocks?.filter(item => item.type === 'custom' && item.spawnType === finalTier && levelAllows(world, runState.level, item.id)) || [];
        const customVisual = customVisuals.length ? customVisuals[Math.floor(Math.random() * customVisuals.length)] : null;
        let maxHp = blockHpForTier(finalTier, world, progress, row, col, inPath);
        if (special === 'coin') maxHp *= .66;
        if (special === 'spring') maxHp = 1;
        if (special === 'boss') maxHp = 3;
        if (hazard) maxHp = 1;
        if (special === 'bomb' || special === 'gel' || special === 'cryo' || special === 'jelly' || special === 'geyser' || special === 'meteor') maxHp = 1;
        if (special === 'spring') maxHp = 1;
        maxHp = Math.max(1, Math.round(maxHp));

        const material = hazard ? (world.id === 2 ? 'iceHazard' : world.id === 4 ? 'lavaRock' : 'hazard') : chooseMaterial(world, progress, special, finalTier);
        rowBlocks.push({
          id: id++, row, col, x: gridOffsetX + col * cell, y, w: cell, h: cell,
          hp: maxHp, maxHp, material, special, tier: finalTier, dead: Boolean(authored?.dead),
          path: authored?.path ?? inPath, segment: meta.kind, hazard, unbreakable: hazard || special === 'jelly', hazardVariant, frozen: false, visualId: customVisual?.id || '',
          environmentRemoved: authored?.environment || '',
          flaskTier: authored?.flaskTier || 0,
          // Grass belongs only to the surface layer of World 1.
          topGrass: world.id === 1 && row === 0 && !special && finalTier === 'soft',
          coins: 0
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
          block.flaskTier = 0;
          block.visualId = '';
          block.environmentRemoved = '';
          block.path = true;
          block.topGrass = world.id === 1;
          if (world.id === 1) block.material = 'grass';
          if (world.id === 2) block.material = 'iceLight';
          if (world.id === 4) block.material = 'ash';
          block.maxHp = block.hp = blockHpForTier(block.tier, world, progress, row, block.col, true);
          block.coins = 0;
        }
      }
      blocks.push(...rowBlocks);
    }
    return blocks;
  }

  function generateFlasks(runState) {
    if (runState.embeddedVeins || runState.worldId === 2) return [];
    const blocks = runState.blocks || [];
    if (!blocks.some(block => block.flaskTier) && runState.worldId !== 1) {
      // Later worlds use sparse temporary placements until their own sections are authored.
      for (let row = 5, index = 0; row < Math.max(5, blocks.at(-1)?.row - 3); row += 8, index += 1) {
        const choices = blocks.filter(block => block.row === row && block.path && !block.dead && !block.special && !block.hazard);
        const block = choices[Math.floor(Math.random() * choices.length)];
        if (!block) continue;
        block.dead = true;
        block.flaskTier = index % 5 === 4 ? 3 : index % 2 === 1 ? 2 : 1;
      }
    }
    return blocks.filter(block => block.flaskTier).map(block => ({
      id: `flask-${block.row}-${block.col}`,
      worldId: runState.worldId,
      tier: block.flaskTier,
      value: FLASK_VALUES[block.flaskTier],
      x: block.x + block.w / 2,
      y: block.y + block.h / 2,
      collected: false,
      phase: block.row * .73 + block.col * 1.17
    }));
  }

  function flaskSprite(worldId, tier) {
    const artWorld = worldId === 2 && tier === 3 ? 2 : worldId === 3 || worldId === 4 ? worldId : 1;
    const size = { 1: 'small', 2: 'medium', 3: 'large' }[tier] || 'small';
    const key = `${artWorld}-${size}`;
    if (!flaskSprites.has(key)) {
      const image = new Image();
      image.src = versionedAsset('assets/ui/anomaly-core-v56/currency.webp');
      flaskSprites.set(key, image);
    }
    return flaskSprites.get(key);
  }

  function flaskFloatY(flask, timestamp) {
    return flask.y + Math.sin(timestamp / 490 + flask.phase) * 3.2;
  }

  function updateFlasks(timestamp) {
    if (!run?.flasks?.length) return;
    for (const flask of run.flasks) {
      if (flask.collected) continue;
      if (flask.collectAfter && timestamp < flask.collectAfter) continue;
      const y = flaskFloatY(flask, timestamp);
      if (Math.hypot(run.slime.x - flask.x, run.slime.y - y) > run.slime.radius + 14) continue;
      flask.collected = true;
      awardFlaskData(flask.value);
      impact(`${flask.glitch ? 'ГЛИТЧ-ОСКОЛОК' : 'ОСКОЛОК'} +${flask.value}`);
      sound('crystal', { value: flask.value });
      feedback(4);
      const color = flask.worldId === 3 ? '#ff8dd0' : flask.worldId === 4 ? '#ffb04d' : '#7df4f0';
      for (let index = 0; index < 8; index += 1) {
        const life = rand(.35, .65);
        run.particles.push({ kind: 'special', shape: 'orb', x: flask.x, y,
          vx: rand(-85, 85), vy: rand(-125, -35), gravity: 100,
          life, maxLife: life, size: rand(2.5, 5.5), color });
      }
    }
  }

  function drawFlasks(timestamp) {
    if (!run?.flasks?.length) return;
    for (const flask of run.flasks) {
      if (flask.collected) continue;
      const y = flaskFloatY(flask, timestamp) - run.cameraY;
      if (y < -50 || y > VIEW_H + 50) continue;
      const sprite = flaskSprite(flask.worldId, flask.tier);
      if (!sprite.complete || !sprite.naturalWidth) continue;
      const size = Math.min(run.cellSize * (.68 + flask.tier * .045), 63);
      ctx.save();
      ctx.shadowColor = flask.worldId === 3 ? '#ff66b9' : flask.worldId === 4 ? '#ff873c' : '#58eaf2';
      ctx.shadowBlur = 11;
      ctx.drawImage(sprite, flask.x - size / 2, y - size / 2, size, size);
      if (flask.glitch) {
        const shift = Math.floor(timestamp / 105 + flask.phase) % 3 - 1;
        ctx.globalAlpha = .36;
        ctx.filter = 'hue-rotate(115deg) saturate(2)';
        ctx.drawImage(sprite, flask.x - size / 2 + shift * 3, y - size / 2, size, size);
        ctx.filter = 'none';
        ctx.globalAlpha = .86;
        ctx.fillStyle = '#ff54df';
        ctx.fillRect(flask.x - size * .31 - shift, y + size * .12, size * .2, 3);
        ctx.fillStyle = '#9bff55';
        ctx.fillRect(flask.x + size * .16 + shift, y - size * .1, size * .16, 3);
        ctx.fillStyle = '#5af9ff';
        ctx.fillRect(flask.x - size * .2 + shift, y - size * .27, 4, 4);
      }
      ctx.restore();
    }
  }

  function generateHoneyZones() {
    // Sticky pockets are removed from candy, including old authored sections.
    return [];
  }

  function generateJellyZones() {
    // Jelly pockets were exclusive to the former first-world section plans.
    return [];
  }

  function generateFreezeZones(runState) {
    // The old snowflake tile is replaced by a readable environmental hazard:
    // the same feature slot now creates shallow icy-water pockets.
    if (runState.worldId !== 2 || (!levelAllows(runState.world, runState.level, 'snowflake') && !levelAllows(runState.world, runState.level, 'freezeZone'))) return [];
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

  function terrainSoundStrength(block) {
    return block.maxHp ?? blockHpForTier(block.tier);
  }

  function terrainBreakSound(block) {
    if (block.elementalSnow || block.elementalSnowflake) return 'snow';
    const hp = blockHpForTier(block.tier);
    const tier = hp >= 3 ? 2 : hp > 1 ? 1 : 0;
    return materialRows[run.worldId - 1]?.[tier] || ['breakFragile', 'breakStone', 'breakBedrock'][tier];
  }

  function terrainContactSound(block) {
    const material = terrainBreakSound(block);
    if (block.elementalSnow || block.elementalSnowflake || [1,3,4,5].includes(run.worldId)) return 'hit-' + material;
    const hp = terrainSoundStrength(block);
    return hp >= 3 ? 'hitHard' : hp > 1 || run.worldId !== 1 ? 'hit' : 'hitSoft';
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
    if (world.id === 5) return tier === 'reinforced' ? 'desertBedrock' : tier === 'hard' ? 'sandstone' : 'sand';
    if (world.id === 4) {
      if (tier === 'reinforced') return 'basalt';
      if (tier === 'hard') return 'volcanicEarth';
      return 'ash';
    }
    if (progress < .28) return world.materials[0];
    if (progress < .68) return Math.random() < .72 ? world.materials[1] : world.materials[0];
    return Math.random() < .72 ? world.materials[2] : world.materials[1];
  }

  function gameFrame(timestamp) {
    if (!run || run.ended || run.paused || run.portalTransitioning) return;
    if (document.hidden || platformSuspended || windowSuspended) {
      autoResumeRunAfterVisibility = pauseRun({ allowPortal: true }) || autoResumeRunAfterVisibility;
      return;
    }
    // A 120/240Hz screen must not multiply physics and decorative work. This
    // leaves CPU/GPU time for input, compositing and the platform's interface.
    {
      const frameInterval = 1000 / 60;
      if (run.nextFrameAt && timestamp + .25 < run.nextFrameAt) {
        run.animationId = requestAnimationFrame(gameFrame);
        return;
      }
      run.nextFrameAt = run.nextFrameAt && timestamp - run.nextFrameAt < frameInterval
        ? run.nextFrameAt + frameInterval : timestamp + frameInterval;
    }
    const workStartedAt=performance.now();
    if (run.evacuation) {
      const dt=run.lastTime?Math.min(.034,Math.max(0,(timestamp-run.lastTime)/1000)):0;
      run.lastTime=timestamp;
      if(run.coreEncounter)CORE.update(run,dt);
      EVAC.update(run,dt,{
        portal:()=>sound('epic'),pull:()=>feedback(7),
        complete:e=>{if(e.completed){if(!PURIFICATION.active(run))finishWorld();}else endRun(false,e.reason,{skipEvacuation:true});}
      });
      PURIFICATION.update(run,dt,{burst:()=>{sound('hitHard');sound('epic');feedback([45,35,70]);coreEncounterStatus('Заражённая оболочка разрушена. Ядро очищено!');}});
      if(run.evacuation.finished&&PURIFICATION.finished(run))finishWorld();
      if(run.ended)return;
      updateMovingHazards(run.evacuation.worldTime);
      renderCanvas(run.evacuation.worldTime);
      trackGraphicsCost(performance.now()-workStartedAt);
      if(!run.paused&&!run.portalTransitioning)run.animationId=requestAnimationFrame(gameFrame);
      return;
    }
    if (run.coreEncounter) {
      // Latch decorative simplification for this cast if real frame work becomes expensive.
      const frameGap=run.lastTime?timestamp-run.lastTime:0,effect=run.coreEncounter;
      effect.slowFrames=Math.max(0,(effect.slowFrames||0)+(frameGap>26&&frameGap<180?1:-1));
      effect.lowPower ||= isLowPowerDevice() || graphicsBudget < .8 || effect.slowFrames>=8;
      const dt = run.lastTime ? Math.min(.034, Math.max(0, (timestamp - run.lastTime) / 1000)) : 0;
      run.lastTime = timestamp;
      CORE.update(run, dt, {
        reduced: run.coreEncounter.reduced,
        armed: () => coreEncounterStatus('Сила собрана. Нажми на экран — ударь!'),
        fusion: () => startRunUltimateCue('infinityFusion', timestamp),
        launch: () => {
          if(effect.infinity)startRunUltimateCue('infinityLaunch', timestamp);
          else sound('epic');
          feedback([12, 22, 14]); coreEncounterStatus('Удар!');
        },
        impact: damage => {
          const event = applyPlanetCoreStrike(damage);
          ENERGY.discharge(run, timestamp);
          if(!run.coreEncounter.cinematic&&!run.coreEncounter.finisher)beginAnomalyEvacuation(true,'Сила израсходована. Возвращаемся на базу.');
          window.SlimeAnomalyEnergyHud.render(run);
          if(effect.infinity)startRunUltimateCue('infinityTail', timestamp);
          sound('hitHard'); feedback([28, 28, 45]);
          const damageText=`Ядру нанесено ${event?.damage||0} процентов урона.`;
          const sphere=effect.infinity&&{blue:'Синяя',red:'Красная',purple:'Фиолетовая'}[effect.infinity.shot];
          coreEncounterStatus(sphere?`${sphere} сфера достигла цели. ${damageText}`:effect.cinematic?`${effect.spores?'Споровый':effect.glitch?'Цифровой':effect.psionic?'Телекинетический':effect.phantom?'Призрачный':effect.techno?'Плазменный':effect.cosmos?'Кометный':effect.frost?'Ледяной':effect.electric?'Электрический':'Огненный'} удар попал. ${damageText}`:`${damageText} Возвращаемся на базу.`);
          return event?.to ?? run.coreEncounter.beforeHp;
        },
        evacuate:()=>beginAnomalyEvacuation(true,'Сила израсходована. Возвращаемся на базу.'),
      });
      PURIFICATION.update(run,dt,{burst:()=>{sound('hitHard');sound('epic');feedback([45,35,70]);coreEncounterStatus('Заражённая оболочка разрушена. Ядро очищено!');}});
      if (run?.ended) return;
      window.SlimeAnomalyEnergyHud.render(run);
      const e=run.coreEncounter,old=run.corePaint,held=e.phase==='release'||e.hitStop>0;
      if(!held||!old||old.encounter!==e||old.elapsed!==e.elapsed||old.phase!==e.phase||old.width!==els.canvas.width||old.height!==els.canvas.height){
        renderCanvas(timestamp);
        const state=old||{};state.encounter=e;state.elapsed=e.elapsed;state.phase=e.phase;state.width=els.canvas.width;state.height=els.canvas.height;run.corePaint=state;
      }
      trackGraphicsCost(performance.now()-workStartedAt);
      if (run && !run.ended && !run.paused && !run.portalTransitioning) run.animationId = requestAnimationFrame(gameFrame);
      return;
    }
    if (updateTutorialRun(timestamp)) {
      renderCanvas(timestamp);
      if (!run.paused && !run.ended) run.animationId = requestAnimationFrame(gameFrame);
      return;
    }
    if (run.ultimateIntro) {
      const intro = run.ultimateIntro;
      if (timestamp - intro.startedAt < (intro.duration || ULTIMATE_INTRO_MS)) {
        renderCanvas(intro.startedAt);
        drawUltimateIntro(timestamp);
        run.animationId = requestAnimationFrame(gameFrame);
        return;
      }
      run.ultimateIntro = null;
      shiftRunClock(timestamp - intro.startedAt);
      run.lastTime = timestamp;
      completeUltimateIntro(intro, timestamp);
    }
    if (run.glitchChoice) {
      const choice = run.glitchChoice;
      if (choice.phase === 'choosing') {
        run.animationId = 0;
        return;
      }
      if (timestamp - choice.selectedAt < GLITCH_TITLE_MS) {
        run.animationId = requestAnimationFrame(gameFrame);
        return;
      }
      run.glitchChoice = null;
      hideGlitchChoice();
      shiftRunClock(timestamp - choice.startedAt);
      run.lastTime = timestamp;
      executeGlitchBug(choice.kind, timestamp);
    }
    if (renderInfinityHitStop(timestamp)) return;
    if (!run.lastTime) run.lastTime = timestamp;
    const elapsed = Math.max(0, (timestamp - run.lastTime) / 1000);
    const hazardDt = Math.min(.1, elapsed);
    const dt = Math.min(.034, (timestamp - run.lastTime) / 1000);
    run.lastTime = timestamp;
    window.SlimeFungiHazards.refreshConfusion(run);
    const pressSlow = run.telekinesisPress && timestamp - run.telekinesisPress.startedAt < TELEKINESIS_PRESS_COLLIDE_MS ? .24 : 1;
    const controlTarget = tutorialMemoState?.kind === 'controls' ? .08 : 1;
    run.tutorialControlPace=(run.tutorialControlPace??1)+(controlTarget-(run.tutorialControlPace??1))*(1-Math.exp(-dt*9));
    const simulationScale = (timestamp < (run.hurtSlowUntil || 0) ? .58 : 1)
      * run.tutorialControlPace * cloningTimeScale(timestamp) * pressSlow;
    const simulationDt = dt * simulationScale;
    INFINITY.update(run, timestamp, infinityAttackServices);
    if (run.ended) return;
    if (run.evacuation) {
      renderCanvas(timestamp);
      run.animationId = requestAnimationFrame(gameFrame);
      return;
    }
    updateMovingHazards(timestamp,simulationDt);
    window.SlimeTechHazards.update(run,simulationDt,{
      hurt:(x,y)=>hurtFromTechHazard(x,y,timestamp),
      beep:fast=>sound(fast?'mineAlertBeep':'mineBeep'),
      detonate:block=>{
        destroyBlock(block,'techMine',timestamp);
        explodeBomb(block,0,false);
        run.shake=Math.max(run.shake,7);
        if(block.y>run.cameraY-150&&block.y<run.cameraY+VIEW_H+150){sound('hitHard');feedback([12,18]);}
      }
    },hazardDt);
    window.SlimeWaterHazards.update(run,simulationDt,fallSteeringVector(),{
      hurt:(x,y)=>hurtFromWaterHazard(x,y,timestamp),immune:waterHazardImmune(timestamp),
      deflected:()=>Boolean(run.infinity?.shieldStopUntil),
      mine:block=>detonateWaterMine(block,timestamp)
    });
    window.SlimeIceHazards.update(run,simulationDt,{hurt:(x,y)=>hurtFromIceHazard(x,y,timestamp)},hazardDt);
    window.SlimeFungiHazards.update(run,simulationDt,{
      poison:(x,y)=>applyFungiPoison(x,y,timestamp),drain:amount=>drainFungiPoison(amount,timestamp)
    },hazardDt);
    if (renderInfinityHitStop(timestamp)) return;
    run.tutorialElapsed = (run.tutorialElapsed || 0) + simulationDt * 1000;

    const verticalSpeed = run.slime.vy * (run.slime.vy > 0 ? Math.max(1, run.fallSpeedScale || 1) : 1);
    const speed = Math.max(Math.hypot(run.slime.vx, verticalSpeed),
      run.electricDash?.endedAt === null ? run.cellSize * 18 : 0);
    // Fast launches and low-FPS frames must never move the slime far enough
    // to skip a block between two collision checks.
    const safeTravel = Math.max(5, Math.min(run.slime.radius * .24, run.cellSize * .14));
    const substeps = clamp(Math.ceil(speed * simulationDt / safeTravel), 1, 12);
    if (simulationDt > 0) for (let i = 0; i < substeps && !run.ended && !run.evacuation && !run.infinity?.shieldStopUntil; i += 1) updatePhysics(simulationDt / substeps, timestamp);
    if (renderInfinityHitStop(timestamp)) return;
    if (run.ended) return;
    if (run.coreEncounter || run.evacuation) {
      renderCanvas(timestamp);
      run.animationId = requestAnimationFrame(gameFrame);
      return;
    }
    window.SlimeEnergyPickups.update(run, timestamp, (amount, at) => restoreAnomalyEnergy(amount, at));
    if(tutorialMemoState?.kind!=='controls')updateElementalEffects(timestamp);
    updateCosmosOrbits(simulationDt, timestamp);
    updateGlitchEffects(timestamp);
    updateMiniSlimes(simulationDt, timestamp);
    updateMeteorShowers(timestamp);
    updateSlimeTrail(simulationDt, timestamp);
    updateParticles(simulationDt);
    updateSpecialEffects(simulationDt, timestamp);
    renderCanvas(timestamp);
    trackGraphicsCost(performance.now() - workStartedAt);
    if (!run.lastUiUpdateAt || timestamp - run.lastUiUpdateAt >= (isMobileDevice() ? 90 : 70)) {
      run.lastUiUpdateAt = timestamp;
      updateRunUI();
    }
    if (!run.ended && !run.paused && !run.portalTransitioning) run.animationId = requestAnimationFrame(gameFrame);
  }

  function renderInfinityHitStop(timestamp) {
    const end = run.infinity?.shieldStopUntil;
    if (!end || run.ended || run.evacuation) return false;
    const previous = run.lastTime || timestamp;
    const holding = INFINITY.holdShieldFrame(run.infinity, timestamp, previous);
    run.lastTime = Math.max(previous, Math.min(timestamp, end));
    if (!holding) return false;
    renderCanvas(timestamp);
    run.animationId = requestAnimationFrame(gameFrame);
    return true;
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
    if (mechSlowZoneImmune(timestamp)) { run.inHoneyZoneId = ''; return; }
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
    return run?.jellyZones?.find(zone => (zone.cells?.length ? zone.cells : [zone])
      .some(cell => circleRectCollision(slime, cell))) || null;
  }

  function jellyContainsCenter(slime, zone) {
    return (zone.cells?.length ? zone.cells : [zone]).some(cell =>
      slime.x >= cell.x && slime.x <= cell.x + cell.w
      && slime.y >= cell.y && slime.y <= cell.y + cell.h);
  }

  function updateJellyState(slime, timestamp, previousX, previousY) {
    if (mechSlowZoneImmune(timestamp)) {
      run.inJellyZoneId = '';
      run.jellySubmergedZoneId = '';
      return;
    }
    const zone = jellyZoneForSlime(slime);
    const previousId = run.inJellyZoneId || '';
    run.inJellyZoneId = zone?.id || '';
    if (!zone) {
      run.jellySubmergedZoneId = '';
      run.jellyExitTriggeredId = '';
      return;
    }
    if (zone.id !== previousId) {
      run.jellyEnteredAt = timestamp;
      run.jellySubmergedZoneId = '';
      run.jellyExitTriggeredId = '';
      slime.vx *= .45;
      slime.vy = clamp(slime.vy * .24, -55, 78);
      run.emotion = 'surprised';
      run.emotionUntil = timestamp + 420;
      feedback(4);
    }
    const centerInside = jellyContainsCenter(slime, zone);
    const wasInside = jellyContainsCenter({ x: previousX, y: previousY }, zone);
    if (centerInside) run.jellySubmergedZoneId = zone.id;
    else if (wasInside && run.jellySubmergedZoneId === zone.id && run.jellyExitTriggeredId !== zone.id) {
      // The center crossing the edge means half the slime has left the jelly.
      const dx = slime.x - previousX;
      const dy = slime.y - previousY;
      const distance = Math.hypot(dx, dy) || 1;
      const nx = dx / distance;
      const ny = dy / distance;
      slime.vx += nx * 80;
      slime.vy += ny * (ny > .6 ? 58 : 90);
      run.jellyExitTriggeredId = zone.id;
      run.jellySubmergedZoneId = '';
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
    if (mechSlowZoneImmune(timestamp)) {
      run.inFreezeZoneId = '';
      run.freezeZoneEnteredAt = 0;
      run.freezeZoneTriggeredId = '';
      return;
    }
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

  function phantomActive(timestamp = performance.now()) {
    return Boolean(run && elementalLevel('phantom') >= 1 && run.phantomUntil > timestamp);
  }

  function phantomCanMark(block) {
    return Boolean(block && !block.dead && !block.special && !block.hazard && !block.unbreakable);
  }

  function markPhantomBlock(block, timestamp, fragile = false, cause = 'phantomSpirit') {
    if (!phantomCanMark(block) || block.phantomMarked) return false;
    block.phantomMarked = true;
    block.phantomMarkedAt = timestamp;
    block.phantomDetonateAt = timestamp + 1450;
    block.phantomMarkCause = cause;
    if (fragile) {
      block.tier = run.sharedDescent ? 'dense' : 'soft';
      block.material = chooseMaterial(run.world, .15, null, block.tier);
      block.hp = block.maxHp = 1;block.visualId = '';block.topGrass = false;
      if (block.flaskTier) block.flaskValue = block.flaskValue || FLASK_VALUES[block.flaskTier];
    }
    run.phantomMarkedBlocks.add(block);
    return true;
  }

  function phantomSpiritTarget(sequence) {
    const s = run.slime, cell = run.cellSize;
    const directions = [[-1,.55],[1,.55],[.3,1],[-.3,-1]], direction = directions[sequence % 4];
    const candidates = blocksNearY(s.y, cell * 4)
      .filter(b => phantomCanMark(b) && !b.phantomMarked && b.hp > 1
        && b.y >= run.cameraY + 80 && b.y + b.h < run.cameraY + VIEW_H - 55
        && Math.hypot(b.x + b.w / 2 - s.x, b.y + b.h / 2 - s.y) <= cell * 4.2);
    const score = b => {
      const dx = b.x + b.w / 2 - s.x, dy = b.y + b.h / 2 - s.y, distance = Math.hypot(dx,dy) || 1;
      return (dx * direction[0] + dy * direction[1]) / distance * 4 - Math.abs(distance / cell - 2.5);
    };
    return candidates.sort((a,b) => score(b) - score(a))[0] || null;
  }

  function phantomSpiritFlight(index, targets, timestamp, duration = 0) {
    const s = run.slime, from = {x:s.x,y:s.y - s.radius * .15};
    return {startedAt:timestamp,duration:duration || clamp(Math.hypot(targets[0].x-s.x,targets[0].y-s.y) / run.cellSize * 190,650,950),
      from,targets,points:targets.map(blockCenter),marked:0,emission:true,index};
  }

  function updatePhantomDetonations(timestamp) {
    let bursts = 0;
    for (const block of run.phantomMarkedBlocks) {
      if (block.dead) { run.phantomMarkedBlocks.delete(block); continue; }
      if (!block.phantomDetonateAt || timestamp < block.phantomDetonateAt) continue;
      block.phantomDetonateAt = 0;
      if (!phantomCanMark(block)) { block.phantomMarked = false; run.phantomMarkedBlocks.delete(block); continue; }
      const cause = block.phantomMarkCause || 'phantomSpirit';
      if (destroyBlock(block,cause,timestamp)) {
        const blastCause = cause === 'phantomSpirit' ? 'phantomBurst' : 'phantomUltimateBurst';
        for (const neighbor of nearbyGridBlocks(block, elementalDamageable)) {
          if (Math.abs(neighbor.row-block.row)+Math.abs(neighbor.col-block.col)!==1) continue;
          damageBlockByElement(neighbor,1,blastCause,timestamp);
        }
        if (bursts++ < 8 && block.y + block.h >= run.cameraY && block.y <= run.cameraY + VIEW_H) {
          run.phantomBursts.push({x:block.x+block.w/2,y:block.y+block.h/2,startedAt:timestamp,scale:.8,cross:true});
        }
      }
    }
    if (run.phantomBursts.length > 12) run.phantomBursts.splice(0,run.phantomBursts.length-12);
    if (bursts) run.shake = Math.max(run.shake, Math.min(3, 1 + bursts * .25));
  }

  function updatePhantomCompanions(timestamp) {
    if (!run || elementalLevel('phantom') < 1 || run.portalEntry || run.ended) return;
    updatePhantomDetonations(timestamp);
    updatePhantomExpress(timestamp);
    updatePhantomSalvo(timestamp);
    if (run.phantomSalvoFlights?.length) return;
    if (run.phantomExpress || phantomActive(timestamp)) return;
    for (let index=0;index<2;index++) {
      const flight=run.phantomFlights[index];if(!flight)continue;
      if(timestamp-flight.startedAt>=flight.duration){
        markPhantomBlock(flight.targets[0],timestamp,true);
        run.phantomFlights[index]=null;run.phantomVolleyNextAt=timestamp+180;
      }
      return;
    }
    if (!(run.phantomVolleyRemaining > 0) && timestamp >= run.phantomMarkNextAt) {
      run.phantomVolleyRemaining=2;run.phantomVolleyNextAt=timestamp;
      run.phantomMarkNextAt=timestamp+PHANTOM_MARK_INTERVAL_MS;
    }
    if(run.phantomVolleyRemaining>0 && timestamp>=run.phantomVolleyNextAt){
      const sequence=run.phantomSpiritSequence || 0,target=phantomSpiritTarget(sequence);
      run.phantomSpiritSequence=sequence+1;run.phantomVolleyRemaining--;
      if(target)run.phantomFlights[sequence%2]=phantomSpiritFlight(sequence%2,[target],timestamp);
      else run.phantomVolleyNextAt=timestamp+500;
    }
  }

  function startPhantomSalvo(timestamp) {
    const s=run.slime,cell=run.cellSize,chosen=new Set();
    const candidates=blocksNearY(s.y,cell*6).filter(b=>phantomCanMark(b)&&!b.phantomMarked
      && b.y>=run.cameraY+80&&b.y+b.h<=run.cameraY+VIEW_H-55
      && Math.hypot(b.x+b.w/2-s.x,b.y+b.h/2-s.y)<=cell*6);
    run.phantomFlights=[null,null];run.phantomVolleyRemaining=0;run.phantomSalvoFlights=[];
    const count=run.ultimateProfile?.spiritCount || 8;
    for(let i=0;i<count;i++){
      const angle=-Math.PI/2+i*Math.PI*2/count,dx=Math.cos(angle),dy=Math.sin(angle);
      const score=b=>{const x=b.x+b.w/2-s.x,y=b.y+b.h/2-s.y,d=Math.hypot(x,y)||1;
        return (x*dx+y*dy)/d*4-Math.abs(d/cell-3)*.35;};
      const target=candidates.filter(b=>!chosen.has(b)).sort((a,b)=>score(b)-score(a))[0];
      if(target)chosen.add(target);
      const point=target?blockCenter(target):{x:clamp(s.x+dx*cell*2.6,20,VIEW_W-20),
        y:clamp(s.y+dy*cell*2.6,run.cameraY+95,run.cameraY+VIEW_H-70)};
      run.phantomSalvoFlights.push({startedAt:timestamp,from:{x:s.x,y:s.y-s.radius*.15},
        points:[point],targets:target?[target]:[],duration:clamp(Math.hypot(point.x-s.x,point.y-s.y)/cell*170,650,1100),
        emission:true,index:i%2});
    }
    run.phantomMarkNextAt=timestamp+PHANTOM_MARK_INTERVAL_MS;
    run.phantomBursts.push({x:s.x,y:s.y,startedAt:timestamp,scale:.65});
  }

  function updatePhantomSalvo(timestamp) {
    if(!run.phantomSalvoFlights?.length)return;
    run.phantomSalvoFlights=run.phantomSalvoFlights.filter(flight=>{
      if(timestamp-flight.startedAt<flight.duration)return true;
      if(flight.targets[0])markPhantomBlock(flight.targets[0],timestamp,false,'phantomSalvo');
      return false;
    });
  }

  function markPhantomPath(fromX, fromY, toX, toY, timestamp) {
    if(!run.phantomPhase)return;
    const radius=run.slime.radius*.85,dx=toX-fromX,dy=toY-fromY;
    const crosses=block=>{
      let low=0,high=1;
      for(const [start,delta,min,max] of [[fromX,dx,block.x-radius,block.x+block.w+radius],
        [fromY,dy,block.y-radius,block.y+block.h+radius]]){
        if(Math.abs(delta)<.0001){if(start<min||start>max)return false;continue;}
        const a=(min-start)/delta,b=(max-start)/delta;
        low=Math.max(low,Math.min(a,b));high=Math.min(high,Math.max(a,b));if(low>high)return false;
      }
      return true;
    };
    for(const block of blocksNearY((fromY+toY)/2,Math.abs(dy)/2+radius)){
      if(phantomCanMark(block)&&crosses(block))markPhantomBlock(block,timestamp,false,run.phantomPhase.kind);
    }
  }

  function startPhantomPhase(timestamp) {
    const profile=run.ultimateProfile || {},s=run.slime;
    run.phantomFlights=[null,null];run.phantomVolleyRemaining=0;
    run.phantomPhase={kind:'phantomRealm',startedAt:timestamp,trail:[]};
    run.phantomEnteredAt=timestamp;
    run.phantomUntil=timestamp+(profile.durationMs || 5000);
    run.phantomEntryPoint={x:s.x,y:s.y};
    run.freezeUntil=0;run.wallPushSide=0;run.bounceControlLockUntil=run.bounceControlRestoreUntil=0;
    s.vy=clamp(s.vy,-100,160);
    markPhantomPath(s.x,s.y,s.x,s.y,timestamp);
    run.phantomBursts.push({x:s.x,y:s.y,startedAt:timestamp,scale:.65});
  }

  function movePhantomOutOfDanger(timestamp) {
    const slime = run.slime;
    const forbidden = (x, y) => blocksNearY(y, slime.radius + run.cellSize)
      .some(block => !block.dead && (block.special || block.hazard || block.unbreakable)
        && circleRectCollision({ x, y, radius: slime.radius * .82 }, block, slime.radius * .82));
    if (!forbidden(slime.x, slime.y)) return;
    const cell = run.cellSize;
    const baseCol = Math.floor((slime.x - run.gridOffsetX) / cell);
    const baseRow = Math.floor((slime.y - run.blockRowOrigin) / cell);
    for (const rowOffset of [0, 1, -1, 2, -2, 3, -3]) {
      for (const colOffset of [0, -1, 1, -2, 2]) {
        const col = baseCol + colOffset;
        if (col < 0 || col >= run.columns) continue;
        const x = run.gridOffsetX + (col + .5) * cell;
        const y = run.blockRowOrigin + (baseRow + rowOffset + .5) * cell;
        if (y < slime.radius || y > run.portalY - cell || forbidden(x, y)) continue;
        slime.x = x;slime.y = y;slime.vx *= .35;slime.vy = Math.min(slime.vy, 75);
        run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, timestamp + 450);
        return;
      }
    }
    run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, timestamp + 700);
  }

  function materializePhantom(timestamp) {
    run.phantomUntil = 0;
    movePhantomOutOfDanger(timestamp);
    const slime=run.slime,cell=run.cellSize;
    for(const block of blocksNearY(slime.y,slime.radius)){
      if(phantomCanMark(block)&&circleRectCollision(slime,block,slime.radius))destroyBlock(block,'phantom',timestamp);
    }
    run.phantomPhase = null;
    slime.vx=clamp(slime.vx,-145,145);slime.vy=clamp(slime.vy,-120,180);
    run.damageInvulnerableUntil=Math.max(run.damageInvulnerableUntil,timestamp+450);
    run.phantomBursts.push({x:slime.x,y:slime.y,startedAt:timestamp});
    run.shake=Math.max(run.shake,4);run.emotion='power';run.emotionUntil=timestamp+360;
    sound('epic');feedback([8,12,8]);
  }

  function updatePhantomCycle(timestamp) {
    if(elementalLevel('phantom')<1)return false;
    if(run.phantomUntil>0){
      if(timestamp<run.phantomUntil)return true;
      materializePhantom(timestamp);
    }
    return false;
  }

  let phantomExpressTrain=null,phantomExpressRails=null;
  function ensurePhantomExpressSprites() {
    if(phantomExpressTrain)return;
    phantomExpressTrain=new Image();phantomExpressTrain.src=versionedAsset('assets/vfx/phantom-express-train-v1-lossless.webp');
    phantomExpressRails=new Image();phantomExpressRails.src=versionedAsset('assets/vfx/phantom-express-rails-v1-lossless.webp');
  }

  function startPhantomExpress(timestamp) {
    if(run.phantomUntil>0)materializePhantom(timestamp);
    const s=run.slime,cell=run.cellSize;
    const width=run.ultimateProfile?.trainWidth || 4, rows=run.ultimateProfile?.trainRows || 12;
    const startCol=clamp(Math.floor((s.x-run.gridOffsetX)/cell)-Math.floor(width/2),0,run.columns-width);
    const startRow=Math.max(0,Math.floor((s.y-run.blockRowOrigin)/cell));
    run.phantomFlights=[null,null];
    run.phantomExpress={startedAt:timestamp,width,startCol,startRow,lastRow:startRow-1,
      endRow:Math.min(run.rowCount-1,startRow+rows-1),centerX:run.gridOffsetX+(startCol+width/2)*cell,
      portalY:s.y-cell*1.2,endY:run.blockRowOrigin+Math.min(run.rowCount,startRow+rows)*cell};
    run.phantomMarkNextAt=timestamp+PHANTOM_MARK_INTERVAL_MS;
    run.phantomPortalNextAt=timestamp+PHANTOM_PORTAL_INTERVAL_MS;
    ensurePhantomExpressSprites();
  }

  function updatePhantomExpress(timestamp) {
    const e=run.phantomExpress;if(!e)return;
    const g=window.SlimePhantomEffects.expressGeometry(e,timestamp,run.cellSize);
    if(g.age>=640){
      const reached=Math.min(e.endRow,Math.floor((g.frontY-run.blockRowOrigin)/run.cellSize));
      while(e.lastRow<reached){
        const row=++e.lastRow;
        for(const block of run.blocksByRow.get(row)||[]){
          if(!block.dead&&block.col>=e.startCol&&block.col<e.startCol+(e.width || 4))destroyBlock(block,'phantomExpress',timestamp);
        }
        run.shake=Math.max(run.shake,3);
      }
    }
    if(g.age>=2800)run.phantomExpress=null;
  }

  function drawPhantomScene(timestamp) {
    if(phantomActive(timestamp)){
      const strength=Math.min(1,(timestamp-run.phantomEnteredAt)/200,(run.phantomUntil-timestamp)/300);
      const point=run.phantomEntryPoint||run.slime;
      window.SlimePhantomEffects.realm(ctx,VIEW_W,VIEW_H,timestamp,Math.max(0,strength),{
        at:run.phantomEnteredAt,x:point.x,y:point.y-run.cameraY
      });
    }
    for(const p of run.phantomPortals){
      if(p.used)continue;
      const alpha=Math.min(1,(timestamp-p.createdAt)/220,(p.expiresAt-timestamp)/500);
      window.SlimePhantomEffects.gate(ctx,p.x,p.y-run.cameraY,p.radius*2,timestamp,Math.max(0,alpha));
    }
    window.SlimePhantomEffects.phaseTrail(ctx,run,timestamp);
    if(run.phantomExpress)window.SlimePhantomEffects.express(ctx,run.phantomExpress,run.cameraY,run.cellSize,timestamp,phantomExpressTrain,phantomExpressRails);
  }

  function drawPhantomCompanions(timestamp,front=true) {
    const level=elementalLevel('phantom');if(!level||run.portalEntry)return;
    const drawProjection=level>=3?window.SlimePhantomEffects.spirit:window.SlimePhantomEffects.mote;
    const s=run.slime,e=run.phantomExpress;
    if(front)for(const flight of run.phantomSalvoFlights || []){
      const p=window.SlimePhantomEffects.flightPoint(flight,timestamp,flight.from);
      const alpha=clamp((timestamp-flight.startedAt)/80,0,1)*clamp((1-p.p)/.13,0,1);
      drawProjection(ctx,{x:p.x,y:p.y-run.cameraY},s.radius*.98,flight.index,timestamp,alpha,true,flight);
    }
    for(let i=0;i<2;i++){
      if(!e&&!run.phantomFlights[i])continue;
      let p=window.SlimePhantomEffects.idle(s.x,s.y,s.radius,i,timestamp),inFront=p.front;
      if(e){
        const t=clamp((timestamp-e.startedAt)/380,0,1),spread=run.cellSize*.9*clamp((timestamp-e.startedAt-250)/220,0,1);
        p={x:lerp(p.x,e.centerX+(i?-spread:spread),t),y:lerp(p.y,e.portalY,t)};inFront=true;
      }else if(run.phantomFlights[i]){p=window.SlimePhantomEffects.flightPoint(run.phantomFlights[i],timestamp,p);inFront=true;}
      if(inFront!==front)continue;
      drawProjection(ctx,{x:p.x,y:p.y-run.cameraY},s.radius*.98,i,timestamp,e?clamp((800-(timestamp-e.startedAt))/250,0,1):1,!e);
    }
  }


  const GLITCH_BUGS = Object.freeze([
    { id: 'hack', name: 'ВЗЛОМ' },
    { id: 'delete', name: 'УДАЛЕНИЕ' },
    { id: 'infect', name: 'ЗАРАЖЕНИЕ' },
    { id: 'change', name: 'ИЗМЕНЕНИЕ' }
  ]);

  function glitchEligibleBlock(block) {
    return Boolean(block && !block.dead && !block.special && !block.hazard && !block.unbreakable);
  }

  function glitchBlockVisible(block) {
    return Boolean(block && block.x >= 0 && block.x + block.w <= VIEW_W + 1
      && block.y >= run.cameraY + 90 && block.y + block.h <= run.cameraY + VIEW_H - 40);
  }

  function glitchSpawnCandidate(block) {
    return glitchBlockVisible(block) && glitchEligibleBlock(block) && !block.glitchInfected
      && block.y >= run.slime.y + run.cellSize * GLITCH_SPAWN_GAP_CELLS;
  }

  function prunePassiveGlitch() {
    for (const block of run.glitchInfectedBlocks) {
      if (block.dead || (block.glitchPassiveInfection && !glitchBlockVisible(block))) {
        run.glitchInfectedBlocks.delete(block);
        block.glitchInfected = block.glitchPassiveInfection = false;
      }
    }
  }

  function infectGlitchGroup(blocks, timestamp, passive = false) {
    const chosen = blocks.filter(block => glitchEligibleBlock(block) && !block.glitchInfected);
    if (!chosen.length) return 0;
    for (const block of chosen) {
      block.glitchInfected = true;
      block.glitchPassiveInfection = passive;
      block.glitchInfectedAt = timestamp;
      block.glitchFlashUntil = timestamp + 620;
      run.glitchInfectedBlocks.add(block);
    }
    return chosen.length;
  }

  function infectGlitchAhead(timestamp, count = 6 + Math.floor(Math.random() * 3)) {
    prunePassiveGlitch();
    const marked = [...run.glitchInfectedBlocks].filter(block => block.glitchPassiveInfection).length;
    const choices = blocksNearY(run.cameraY + VIEW_H / 2, VIEW_H / 2)
      .filter(glitchSpawnCandidate);
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return infectGlitchGroup(choices.slice(0, Math.max(0, Math.min(count, GLITCH_PASSIVE_LIMIT - marked))), timestamp, true);
  }

  function shareGlitchHit(block, amount, timestamp, effect = '') {
    prunePassiveGlitch();
    if (!block?.glitchInfected || (amount <= 0 && !effect)) return;
    const infectedBlocks = [...run.glitchInfectedBlocks];
    const linkedBlocks = infectedBlocks.filter(glitchEligibleBlock);
    // Clear the whole network before applying an echo; chained abilities cannot retrigger it.
    run.glitchInfectedBlocks.clear();
    for (const linked of infectedBlocks) {
      linked.glitchInfected = false;
      linked.glitchPassiveInfection = false;
      linked.glitchDisperseUntil = timestamp + 420;
      linked.glitchFlashUntil = timestamp + 450;
      linked.glitchHitUntil = timestamp + 520;
    }
    run.glitchShock = { source: block, targets: linkedBlocks, startedAt: timestamp };
    for (const linked of linkedBlocks) {
      if (linked === block) continue;
      if (effect === 'gold') goldifyBlock(linked, timestamp);
      else if (effect === 'snow') turnBlockToSnow(linked, timestamp);
      else if (effect === 'snowflake') turnBlockToSnowflake(linked, timestamp);
      else if (effect === 'fire') igniteBlock(linked, timestamp);
      else damageBlockByElement(linked, amount, 'glitchEcho', timestamp);
    }
  }

  function markGlitchHazard(block, timestamp, ultimate = false) {
    if (!block || block.dead || !block.hazard || block.glitchNeutralized) return false;
    recordMutationAction('glitch', block);
    block.glitchNeutralized = true;
    block.glitchHackedByUltimate = ultimate;
    block.glitchInfectedAt = timestamp;
    block.glitchFlashUntil = timestamp + 620;
    return true;
  }

  function findGlitchDisarmTarget() {
    return blocksNearY(run.cameraY + VIEW_H / 2, VIEW_H / 2)
      .filter(block => !block.dead && block.hazard && !block.glitchNeutralized && glitchBlockVisible(block)
        && block.y + block.h <= run.cameraY + VIEW_H - 130
        && block.y + block.h / 2 >= run.slime.y + run.cellSize * 2.5)
      .sort((a, b) => b.y - a.y || Math.abs(a.x + a.w / 2 - run.slime.x) - Math.abs(b.x + b.w / 2 - run.slime.x))[0] || null;
  }

  function startGlitchDisarm(timestamp) {
    const block = findGlitchDisarmTarget();
    if (!block) return false;
    // Immediately safe; the reward only appears after the visible decoding.
    block.glitchNeutralized = block.glitchDisarming = true;
    block.glitchHackingUntil = timestamp + 850;
    const roll = Math.random();
    const reward = roll < .2 ? 'heal' : roll < .45 ? 1 : roll < .8 ? 2 : 3;
    run.glitchDisarm = { block, reward, startedAt: timestamp, finishAt: timestamp + 850,
      fromX: block.x, fromY: block.y, fromSlimeX: run.slime.x, fromSlimeY: run.slime.y };
    ensureWorldSprites(1);
    impact('ОБЕЗОРУЖИВАНИЕ');
    return true;
  }

  function completeGlitchDisarm(timestamp) {
    const effect = run.glitchDisarm, block = effect?.block;
    if (!block || !block.glitchDisarming) return;
    block.glitchDisarming = block.glitchNeutralized = block.glitchHackedByUltimate = false;
    if (block.dead) { run.glitchDisarm = null; return; }
    recordMutationAction('glitch', block);
    Object.assign(block, { hazard: false, unbreakable: false, hazardVariant: null, motion: null,
      x: (run.gridOffsetX || 0) + block.col * run.cellSize, y: run.blockRowOrigin + block.row * run.cellSize,
      tier: effect.reward === 'heal' ? 'special' : run.sharedDescent ? 'dense' : 'soft',
      special: effect.reward === 'heal' ? 'gel' : null, visualId: '', maxHp: 1, hp: 1, path: true,
      flaskTier: effect.reward === 'heal' ? 0 : effect.reward,
      flaskValue: effect.reward === 'heal' ? 0 : FLASK_VALUES[effect.reward], flaskGranted: false,
      topGrass: false, frozen: false, frozenOre: false, elementalSnow: false, elementalSnowflake: false,
      elementalGolden: false, fireDamageAt: 0, sporePod: null, glitchHackingUntil: 0,
      glitchReward: true, glitchTransformUntil: 0 });
    block.material = chooseMaterial(run.world, .15, null, block.tier);
    run.movingHazards = (run.movingHazards || []).filter(item => item !== block);
    effect.completedAt = timestamp;
    effect.finishAt = timestamp + 750;
    sound('epic'); feedback(9);
    impact(effect.reward === 'heal' ? 'ЛЕЧЕБНЫЙ БЛОК' : `ЖИЛА +${block.flaskValue}`);
  }

  function transformGlitchHazard(block, collision, timestamp) {
    if (block?.glitchDisarming) { completeGlitchDisarm(timestamp); return false; }
    if (!block || block.dead || !block.hazard || !block.glitchNeutralized) return false;
    if (destroyBlock(block, block.glitchHackedByUltimate ? 'glitchHack' : 'glitchNeutralize', timestamp)) {
      block.hp = 0;
      run.shake = Math.max(run.shake, 2);
      sound('break');
      feedback(7);
    }
    // Disarmed spikes dissolve on contact, without bouncing or hurting the slime.
    return false;
  }

  function hideGlitchChoice() {
    els.glitchUltimateOverlay?.classList.add('hidden');
    els.glitchUltimateOverlay?.classList.remove('is-announcing');
    if (els.glitchChoiceAnnouncement) els.glitchChoiceAnnouncement.replaceChildren();
  }

  function startGlitchChoice(timestamp) {
    run.glitchChoice = { phase: 'choosing', startedAt: timestamp, kind: '', selectedAt: 0 };
    els.glitchUltimateOverlay.classList.remove('is-announcing', 'hidden');
    els.glitchChoiceAnnouncement.replaceChildren();
    renderCanvas(timestamp);
    els.glitchUltimateOverlay.querySelector('.glitch-choice-option')?.focus({ preventScroll: true });
  }

  function selectGlitchBug(kind) {
    const choice = run?.glitchChoice;
    const bug = GLITCH_BUGS.find(item => item.id === kind);
    if (!choice || choice.phase !== 'choosing' || !bug) return false;
    choice.phase = 'announcing';
    choice.kind = bug.id;
    choice.selectedAt = performance.now();
    const title = els.glitchChoiceAnnouncement;
    title.replaceChildren();
    title.setAttribute('aria-label', bug.name);
    title.dataset.bug = bug.id;
    [...bug.name].forEach((letter, index) => {
      const piece = document.createElement('span');
      piece.textContent = letter === ' ' ? '\u00a0' : letter;
      piece.setAttribute('aria-hidden', 'true');
      piece.style.setProperty('--letter-index', index);
      title.appendChild(piece);
    });
    els.glitchUltimateOverlay.classList.add('is-announcing');
    sound('epic');
    feedback([9, 18, 9]);
    run.animationId = requestAnimationFrame(gameFrame);
    return true;
  }

  function glitchDeletableBlock(block) {
    return Boolean(block && !block.dead && !block.special && (block.hazard || !block.unbreakable));
  }

  function glitchSlimeCell() {
    return { row: Math.floor((run.slime.y - run.blockRowOrigin) / run.cellSize),
      col: Math.floor((run.slime.x - (run.gridOffsetX || 0)) / run.cellSize) };
  }

  function rewriteGlitchSection(timestamp) {
    const rewrite = run.glitchChange;
    if (!rewrite) return;
    run.glitchChange = null;
    const cells = run.blocks.filter(block => !block.dead && block.row >= rewrite.startRow && block.row < rewrite.startRow + (rewrite.rows || 10));
    const changedCells = new Set(cells);
    run.sporePods = (run.sporePods || []).filter(pod => !changedCells.has(pod.block));
    for (const block of cells) {
      run.glitchInfectedBlocks.delete(block);
      block.glitchInfected = false;
      block.glitchNeutralized = false;
      block.glitchHackedByUltimate = false;
      if (block.hazard) recordMutationAction('glitch', block);
      block.hazard = false;
      block.unbreakable = false;
      block.hazardVariant = null;
      block.special = null;
      block.visualId = '';
      // Preserve vein tier, value and collection flag: even a +5 vein becomes fragile.
      if (block.flaskTier) block.flaskValue = block.flaskValue || FLASK_VALUES[block.flaskTier] || 0;
      block.topGrass = false;
      block.frozen = block.frozenOre = block.elementalSnow = block.elementalSnowflake = block.elementalGolden = false;
      block.fireDamageAt = block.fireFlashUntil = 0;
      block.sporePod = null;
      block.motion = null;
      block.x = (run.gridOffsetX || 0) + block.col * run.cellSize;
      block.y = run.blockRowOrigin + block.row * run.cellSize;
      block.glitchRewriteUntil = timestamp + 950;
      block.glitchDeleteAt = 0;
      block.tier = run.sharedDescent ? 'dense' : 'soft';
      block.material = chooseMaterial(run.world, .15, null, block.tier);
      block.maxHp = block.hp = 1;
      block.path = true;
    }
    impact('ПОРОДА СТАЛА ХРУПКОЙ');
    run.shake = Math.max(run.shake, 4);
  }

  function executeGlitchBug(kind, timestamp) {
    const center = glitchSlimeCell();
    const profile = run.ultimateProfile || {};
    const below = (block, rows = profile.glitchRows || 12) => block.row > center.row && block.row <= center.row + rows;
    if (kind === 'hack') {
      const targets = run.blocks.filter(block => !block.dead && block.hazard && !block.glitchNeutralized
        && (below(block) || (Math.abs(block.row - center.row) <= (profile.hackRadius || 3) && Math.abs(block.col - center.col) <= (profile.hackRadius || 3))));
      targets.sort((a, b) => Math.abs(a.row - center.row) - Math.abs(b.row - center.row));
      let duration = 1900;
      for (const [index, block] of targets.entries()) {
        const delay = 180 + Math.abs(block.row - center.row) * 85 + index * 18;
        block.glitchHackingUntil = timestamp + delay;
        run.glitchHackQueue.push({ block, at: timestamp + delay });
        duration = Math.max(duration, delay + 450);
      }
      run.glitchScreen = { kind, startedAt: timestamp, until: timestamp + duration };
    } else if (kind === 'delete') {
      const targets = run.blocks.filter(block => glitchDeletableBlock(block) && (below(block)
        || (Math.abs(block.row - center.row) <= (profile.deleteRadius || 2) && Math.abs(block.col - center.col) <= (profile.deleteRadius || 2))));
      for (let i = targets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [targets[i], targets[j]] = [targets[j], targets[i]];
      }
      const count = Math.min(profile.deleteCap || 40, Math.ceil(targets.length * .48));
      targets.slice(0, count).forEach((block, index) => {
        block.glitchDeleteAt = timestamp + 180 + index * 55;
        run.glitchDeleteQueue.push({ block, at: block.glitchDeleteAt });
      });
      run.glitchScreen = { kind, startedAt: timestamp, until: timestamp + 2450 };
    } else if (kind === 'infect') {
      const targets = run.blocks.filter(block => glitchEligibleBlock(block) && !block.glitchInfected
        && Math.max(Math.abs(block.row - center.row), Math.abs(block.col - center.col)) <= (profile.infectRadius || 7));
      const distance = block => Math.max(Math.abs(block.row - center.row), Math.abs(block.col - center.col));
      targets.sort((a, b) => distance(a) - distance(b));
      for (let index = 0; index < targets.length; index += 4) {
        const blocks = targets.slice(index, index + 4);
        run.glitchSpreadQueue.push({ blocks, at: timestamp + 100 + distance(blocks[0]) * 175 + index * 3 });
      }
      run.glitchScreen = { kind, startedAt: timestamp, until: timestamp + 1850 };
    } else if (kind === 'change') {
      run.glitchChange = { startRow: center.row + 1, rows: profile.rewriteRows || 10, at: timestamp + 350 };
      for (const block of run.blocks) if (!block.dead && below(block, profile.rewriteRows || 10)) block.glitchRewriteUntil = timestamp + 1250;
      run.glitchScreen = { kind, startedAt: timestamp, until: timestamp + 1100 };
    }
  }

  function createGlitchDebris(block, timestamp, safe = false) {
    if (block.y + block.h < run.cameraY || block.y > run.cameraY + VIEW_H) return;
    const bursts = run.glitchBreakBursts || (run.glitchBreakBursts = []);
    bursts.push({ x:block.x, y:block.y, w:block.w, h:block.h, startedAt:timestamp, safe });
    if (bursts.length > 12) bursts.splice(0, bursts.length - 12);
    const colors = safe ? ['#69ff99', '#baffd0', '#35edc8'] : ['#68faff', '#ff59df', '#e0ffff'];
    const count = takeDecorativeParticles(scaledEffectCount(14, 4));
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count;
      const speed = 75 + Math.random() * 100;
      run.particles.push({ x: block.x + block.w / 2, y: block.y + block.h / 2,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 35,
        size: 3 + Math.random() * 4, color: colors[i % colors.length],
        gravity: 80, life: .38 + Math.random() * .2, maxLife: .58 });
    }
    trimParticles(240);
  }

  function updateGlitchEffects(timestamp) {
    if (!run || run.ended || run.portalEntry) return;
    const level = elementalLevel('glitch');
    if (level >= 1) prunePassiveGlitch();
    if (level >= 1 && timestamp >= run.glitchNextInfectionAt) {
      const hasRoom = [...run.glitchInfectedBlocks].filter(block => block.glitchPassiveInfection).length < GLITCH_PASSIVE_LIMIT;
      const hasTarget = hasRoom && blocksNearY(run.cameraY + VIEW_H / 2, VIEW_H / 2)
        .some(glitchSpawnCandidate);
      if (!hasTarget) run.glitchNextInfectionAt = timestamp + 1000;
      else if (!run.glitchScreen || run.glitchScreen.kind === 'passive' || timestamp >= run.glitchScreen.until) {
        run.glitchScreen = {kind:'passive',startedAt:timestamp,until:timestamp+360};
        run.glitchPassiveInfectAt = timestamp + 160;
        run.glitchNextInfectionAt = timestamp + GLITCH_INFECTION_INTERVAL_MS;
      } else run.glitchNextInfectionAt = timestamp + 600;
    }
    if (run.glitchPassiveInfectAt > 0 && timestamp >= run.glitchPassiveInfectAt) {
      infectGlitchAhead(timestamp);run.glitchPassiveInfectAt=0;
    }
    const disarm = run.glitchDisarm;
    if (disarm) {
      if (disarm.completedAt) {
        if (timestamp >= disarm.finishAt) run.glitchDisarm = null;
      } else if (timestamp >= disarm.finishAt || disarm.block.dead) completeGlitchDisarm(timestamp);
      else {
        const t = clamp((timestamp - disarm.startedAt) / 850, 0, 1), smooth = t * t * (3 - 2 * t);
        disarm.block.x = disarm.fromX + ((run.gridOffsetX || 0) + disarm.block.col * run.cellSize - disarm.fromX) * smooth;
        disarm.block.y = disarm.fromY + (run.blockRowOrigin + disarm.block.row * run.cellSize - disarm.fromY) * smooth;
      }
    }
    for (const item of run.glitchSpreadQueue) {
      if (timestamp >= item.at) infectGlitchGroup(item.blocks, timestamp);
    }
    run.glitchSpreadQueue = run.glitchSpreadQueue.filter(item => timestamp < item.at);
    for (const item of run.glitchDeleteQueue) {
      if (timestamp >= item.at && glitchDeletableBlock(item.block)) destroyBlock(item.block, 'glitchDelete', timestamp);
    }
    run.glitchDeleteQueue = run.glitchDeleteQueue.filter(item => timestamp < item.at);
    for (const item of run.glitchHackQueue) {
      if (timestamp >= item.at) markGlitchHazard(item.block, timestamp, true);
    }
    run.glitchHackQueue = run.glitchHackQueue.filter(item => timestamp < item.at);
    if (run.glitchChange && timestamp >= run.glitchChange.at) rewriteGlitchSection(timestamp);
  }

  function resetFallMomentum(currentRun) {
    currentRun.fallFreeSeconds = 0;
    currentRun.fallImpactSpeed = 1;
    currentRun.fallImpactTarget = 1;
    currentRun.fallSpeedScale = 1;
  }

  function availableFallMomentum(currentRun) {
    const speed = currentRun.fallSpeedScale ?? 1;
    const stillBraking = (currentRun.fallFreeSeconds ?? Infinity) < FALL_MOMENTUM.brakeSeconds;
    return stillBraking ? Math.min(speed, currentRun.fallImpactTarget ?? 1) : speed;
  }

  function spendFallMomentum(currentRun, hits, instant = false) {
    const remaining = availableFallMomentum(currentRun) - hits * FALL_MOMENTUM.step;
    currentRun.fallImpactSpeed = currentRun.fallSpeedScale ?? 1;
    currentRun.fallImpactTarget = Math.max(FALL_MOMENTUM.min, remaining);
    if (instant) currentRun.fallSpeedScale = currentRun.fallImpactSpeed = currentRun.fallImpactTarget;
    currentRun.fallFreeSeconds = 0;
  }

  function advanceFallMomentum(currentRun, dt) {
    const { brakeSeconds, fullSpeedAt, gainPerSecond, max, airBeforeBoost } = FALL_MOMENTUM;
    const target = currentRun.fallImpactTarget ?? 1;
    const seconds = Math.min(airBeforeBoost + (max - 1) / gainPerSecond, (currentRun.fallFreeSeconds ?? 0) + dt);
    currentRun.fallFreeSeconds = seconds;
    let speed = target;
    if (seconds < brakeSeconds) {
      const t = seconds / brakeSeconds;
      speed = lerp(currentRun.fallImpactSpeed ?? 1, target, t * t * (3 - 2 * t));
    } else if (target > 1) {
      speed = Math.min(max, target + Math.max(0, seconds - airBeforeBoost) * gainPerSecond);
    } else if (seconds >= fullSpeedAt) {
      speed = Math.min(max, 1 + Math.max(0, seconds - airBeforeBoost) * gainPerSecond);
    } else if (target < 1) {
      const t = (seconds - brakeSeconds) / (fullSpeedAt - brakeSeconds);
      speed = lerp(target, 1, t * t * (3 - 2 * t));
    }
    currentRun.fallSpeedScale = speed;
    return speed;
  }

  function updatePhysics(dt, timestamp) {
    const s = run.slime;
    if (run.evacuation) return;
    if (run.coreEncounter) return;
    if(window.SlimeIceHazards.hold(run,dt)){finishElectricDash(timestamp,true);resetFallMomentum(run);return;}
    if (run.coreArena && s.y >= run.coreArena.triggerY
        && (CORE.strikeKind(run)
          || run.coreArena.surfaceY - run.cameraY <= VIEW_H - 24 || s.y >= run.coreArena.surfaceY - 350)) {
      beginCoreEncounter();
      return;
    }
    if (run.portalEntry) {
      updatePortalEntry(dt, timestamp);
      return;
    }
    if(run.waterGrab){finishElectricDash(timestamp,true);resetFallMomentum(run);return;}
    if (run.geyserCapture) {
      finishElectricDash(timestamp, true);
      resetFallMomentum(run);
      updateGeyserCapture(dt, timestamp);
      return;
    }
    if (run.mechSuit?.phase === 'descending') {
      resetFallMomentum(run);
      s.vx = 0;
      s.vy = 0;
      if (timestamp < run.mechSuit.landAt) return;
      run.mechSuit.phase = 'active';
      const mechWallRadius = run.cellSize * MECH_VISUAL_CELLS * .49;
      s.x = clamp(s.x, mechWallRadius, VIEW_W - mechWallRadius);
      s.y = Math.max(s.y, run.cellSize * MECH_VISUAL_CELLS * .49 + 4);
      run.mechSuit.expireAt = timestamp + run.mechSuit.activeMs;
      run.elementalAbilityUntil = run.mechSuit.expireAt;
      run.shake = Math.max(run.shake, 5);
      sound('epic');
      feedback([12, 18, 10]);
    }
    if (updateCosmosUltimateMotion(dt, timestamp)) { resetFallMomentum(run); return; }
    const ghost = updatePhantomCycle(timestamp);
    const drillActive = !ghost && !mechSuitActive() && speedDrillActive(timestamp);
    const frozen = !ghost && !drillActive && !mechSuitActive() && isSlimeFrozen(timestamp);
    const electricFlight = run.electricDash?.endedAt === null;
    updateSpeedPassive(dt, timestamp);
    const gravityDirection = 1;
    const honeyAtStart = mechSlowZoneImmune(timestamp) ? null : honeyZoneForSlime(s);
    const techSlow=ghost||drillActive||mechSuitActive()?1:Math.min(window.SlimeTechHazards.slowFactor(run),window.SlimeIceHazards.slowFactor(run));
    const honeyDrag = Boolean(honeyAtStart);
    const jellyAtStart = mechSlowZoneImmune(timestamp) ? null : jellyZoneForSlime(s);
    const jellyDrag = Boolean(jellyAtStart);
    const freezeWaterAtStart = mechSlowZoneImmune(timestamp) ? null : freezeZoneForSlime(s);
    const freezeWaterDrag = Boolean(freezeWaterAtStart);
    const worldGravity = drillActive ? 0 : (BALANCE.gravityBase + run.worldId * BALANCE.gravityPerWorld) * (mechSuitActive() ? 1 : frozen ? 1.48 : freezeWaterDrag ? .28 : honeyDrag ? .24 : jellyDrag ? .08 : 1);
    const previousX = s.x;
    const previousY = s.y;
    const launchArrivalActive = run.launchEntryUntil && timestamp < run.launchEntryUntil;

    const baseTerminalSpeed = mechSuitActive() ? normalFallSpeedLimit()
      : frozen ? normalFallSpeedLimit() * 1.18
        : freezeWaterDrag ? 118 : honeyDrag ? 132 : jellyDrag ? 165
          : normalFallSpeedLimit()*techSlow;
    const terminalSpeed = baseTerminalSpeed * (mechSuitActive() ? .9 : 1);
    let dashComplete = false;
    if (electricFlight) {
      dashComplete = ELEMENTAL_ULTIMATES.driveElectricDash(run, dt);
    } else if (ghost) {
      const steering = fallSteeringVector();
      s.vx = lerp(s.vx, steering.x * 145, 1 - Math.exp(-5.2 * dt));
      s.vy = clamp(s.vy + (worldGravity * .16 + steering.y * 360) * dt, -155, 205);
      if (Math.abs(steering.y) < .08) s.vy = lerp(s.vy, 42, 1 - Math.exp(-.35 * dt));
    } else if (drillActive) applySpeedDrillSteering(s, dt);
    else if (mechSuitActive()) {
      applyMechSteering(s, dt, timestamp);
    }
    else if (jellyDrag && !frozen) {
      const steering = fallSteeringVector();
      const jellyAge = Math.max(0, timestamp - (run.jellyEnteredAt || timestamp));
      const targetVx = steering.x * 125;
      const targetVy = steering.y < -.12 ? steering.y * 125
        : steering.y > .12 ? steering.y * 135
          : jellyAge < 220 ? 34 : 62;
      s.vx = lerp(s.vx, targetVx, 1 - Math.exp(-6 * dt));
      s.vy = lerp(s.vy, targetVy, 1 - Math.exp(-5.5 * dt));
    } else {
      s.vy = clamp(s.vy + worldGravity * gravityDirection * dt, -terminalSpeed, Math.max(terminalSpeed, s.vy));
      applyFallSteering(s, dt, timestamp, techSlow);
      if (s.vy > terminalSpeed) s.vy = lerp(s.vy, terminalSpeed, 1 - Math.exp(-6 * dt));
    }
    if (!electricFlight && !mechSuitActive() && !ghost && !drillActive && honeyDrag && !frozen) {
      s.vx *= Math.pow(.32, dt);
      s.vy *= Math.pow(.085, dt);
    } else if (!electricFlight && !mechSuitActive() && !ghost && !drillActive && freezeWaterDrag && !frozen) {
      s.vx *= Math.pow(.48, dt);
      s.vy = lerp(s.vy, 86, clamp(dt * 3.8, 0, 1));
    }
    if(!electricFlight&&!ghost&&!drillActive&&!mechSuitActive())window.SlimeWaterHazards.applyForces(run,dt,fallSteeringVector());
    if(run.phantomExpress){
      const expressAge=timestamp-run.phantomExpress.startedAt;
      s.vy=clamp(s.vy,-40,expressAge<640?24:125);
      s.vx*=Math.exp(-2*dt);
    }
    const phoenix = run.phoenixUltimate;
    const storm = run.frostStorm;
    const thunder = run.electricStorm;
    const charge = phoenix || storm || thunder;
    const chargeMs = phoenix ? phoenix.arrivalMs : charge?.chargeMs;
    const summonAge = charge ? timestamp - charge.startedAt : 0;
    const charging = charge && !charge.endedAt && summonAge >= 0 && summonAge < chargeMs;
    if (charging) {
      const release = thunder ? 0 : smoothFireVisual((summonAge / chargeMs - .78) / .22);
      const brake = 1 - Math.exp(-dt * 24 * (1 - release));
      s.vy = lerp(s.vy, 16, brake);
      s.vx *= Math.exp(-dt * 9 * (1 - release));
    }
    const thunderHold = thunder && !thunder.endedAt && summonAge >= chargeMs;
    if (thunderHold) {
      const fallTarget = thunder.strikes >= thunder.strikeLimit ? 105 : 54;
      s.vy = lerp(s.vy, Math.min(s.vy, fallTarget), 1 - Math.exp(-dt * 18));
    }
    const infinityCharge = INFINITY.chargeStrength(run.infinity, timestamp);
    if (infinityCharge) {
      const brake = 1 - Math.exp(-dt * 32 * infinityCharge);
      s.vy = lerp(s.vy, 12, brake);
      s.vx = lerp(s.vx, 0, brake);
    }
    s.x += s.vx * dt;
    const freeDescent = s.vy > 0 && !launchArrivalActive && !ghost && !drillActive && !mechSuitActive()
      && !frozen && !honeyDrag && !jellyDrag && !freezeWaterDrag && techSlow >= 1 && !run.phantomExpress
      && !charging && !thunderHold && !infinityCharge && !electricFlight && timestamp >= (run.hurtSlowUntil || 0);
    if (!freeDescent) resetFallMomentum(run);
    const fallSpeed = freeDescent ? s.vy * advanceFallMomentum(run, dt) : s.vy;
    s.y += fallSpeed * dt;
    if (deflectNearbyInfinityThreat(timestamp)) return;
    if (ghost && run.phantomPhase) {
      markPhantomPath(previousX, previousY, s.x, s.y, timestamp);
      const trail = run.phantomPhase.trail;
      if (!trail.length || timestamp - trail[trail.length - 1].at >= 40) trail.push({x:s.x,y:s.y,at:timestamp});
      while (trail.length > 6 || (trail.length && timestamp - trail[0].at > 240)) trail.shift();
    }
    if (!ghost) {
      updateHoneyState(s, timestamp);
      updateJellyState(s, timestamp, previousX, previousY);
      updateFreezeZoneState(s, timestamp);
    }
    s.wobble += dt * (4 + Math.abs(fallSpeed) / 180);

    const wallRadius = mechSuitActive() ? run.cellSize * MECH_VISUAL_CELLS * .49 : s.radius;
    if (s.x - wallRadius < 0) {
      s.x = wallRadius;
      if (mechSuitActive()) s.vx = 0;
      else if (drillActive || electricFlight) s.vx = Math.max(0, s.vx);
      else {
        s.vx = clamp(Math.abs(s.vx) * .18, 30, 42);
        run.wallPushSide = -1;
        run.wallReleaseX = s.x + 10;
      }
    }
    if (s.x + wallRadius > VIEW_W) {
      s.x = VIEW_W - wallRadius;
      if (mechSuitActive()) s.vx = 0;
      else if (drillActive || electricFlight) s.vx = Math.min(0, s.vx);
      else {
        s.vx = -clamp(Math.abs(s.vx) * .18, 30, 42);
        run.wallPushSide = 1;
        run.wallReleaseX = s.x - 10;
      }
    }
    if (!launchArrivalActive && (drillActive || electricFlight) && s.y - s.radius < 4) {
      s.y = s.radius + 4;
      s.vy = Math.max(0, s.vy);
    }
    if (ghost && s.y - s.radius < 4) {
      s.y = s.radius + 4;
      s.vy = Math.max(0, s.vy);
    }
    if (mechSuitActive() && s.y - wallRadius < 4) {
      s.y = wallRadius + 4;
      s.vy = Math.max(0, s.vy);
    }

    const moved = Math.hypot(s.x - previousX, s.y - previousY);
    run.flightDistance += moved;
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.depth = (run.endlessDepthOffset || 0) + Math.max(0, Math.min(run.world.targetDepth,
      Math.floor((s.y - 285) / (run.rowCount * run.cellSize) * run.world.targetDepth)));
    run.maxDepth = Math.max(run.maxDepth, run.depth);

    if(run.psionicBarrier || run.psionicBarrierBursts?.length)updatePsionicBarrier(timestamp);
    if (mechSuitActive()) {
      const { hits, broken } = TECHNO_ULTIMATES.drill(run, timestamp, damageBlockByElement);
      if (hits) {
        const mech = run.mechSuit;
        if (timestamp - (mech.lastGrindSoundAt ?? -Infinity) >= 110) {
          sound(broken ? 'break' : 'hitHard');
          mech.lastGrindSoundAt = timestamp;
        }
        mech.lastCutAt = timestamp;
        if (!menuReducedMotion) run.shake = Math.max(run.shake, broken ? 2.8 : 1.7);
      }
    }
    if (!ghost) {
      const collisionReach = s.radius;
      const collisions = blocksNearY(s.y, collisionReach)
        .filter(block => !block.dead && timestamp >= (block.snowballGhostUntil || 0)
          && !(electricFlight && electricDashPhasesThrough(block))
          && block.y + block.h > s.y - collisionReach - 3 && block.y < s.y + collisionReach + 3
          && block.x + block.w > s.x - collisionReach - 3 && block.x < s.x + collisionReach + 3)
        // Hazards use a slightly forgiving hit radius: near-misses should look
        // and feel like near-misses, especially under a thumb on mobile.
        .map(block => {
          const firstWorldHazard = block.hazard && run.sharedDescent;
          const inset = firstWorldHazard ? block.w * .08 : 0;
          const hitbox = firstWorldHazard
            ? { x: block.x + inset, y: block.y + inset, w: block.w - inset * 2, h: block.h - inset * 2 }
            : block;
          return { block, collision: circleRectCollision(s, hitbox, block.hazard ? s.radius * .76 : s.radius) };
        })
        .filter(item => item.collision)
        .sort((a, b) => b.collision.penetration - a.collision.penetration);

      for (const item of collisions) {
        const { block, collision } = item;
        if (block.dead) continue;
        if (run.mechSuit?.contacts?.has(block)) {
          // Keep the bit pressed against live rock until the next damage pulse.
          // Let steering continue so the player can also shave a new column.
          s.y = previousY;
          s.vy = 0;
          break;
        }
        const normalSpeed = s.vx * collision.nx + s.vy * collision.ny;
        const movingOutOfBlock = normalSpeed >= -1;
        if (block.elementalSnow) {
          if (!movingOutOfBlock) resolveBlockHit(block, collision, timestamp);
          continue;
        }
        const cooldown = run.hitCooldowns.get(block.id) || 0;
        if (timestamp - cooldown < 72
          || (timestamp < run.bounceGraceUntil && movingOutOfBlock) || (timestamp < run.geyserLaunchGraceUntil && movingOutOfBlock)) {
          stabilizeSlimeContact(s, collision);
          if (releaseSlimeFromPatrol(block, collision, timestamp)) break;
          continue;
        }
        run.hitCooldowns.set(block.id, timestamp);
        const bounced = resolveBlockHit(block, collision, timestamp);
        if (run.ended) return;
        const released = releaseSlimeFromPatrol(block, collision, timestamp);
        if (released || bounced) {
          if (electricFlight) finishElectricDash(timestamp, true);
          break;
        }
      }
      s.x = clamp(s.x, wallRadius, VIEW_W - wallRadius);
    }
    if (electricFlight) {
      ELEMENTAL_ULTIMATES.sampleElectricDash(run, timestamp);
      if (dashComplete) finishElectricDash(timestamp);
    }

    updateFlasks(timestamp);

    if (!electricFlight) applyPortalAttraction(dt);
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
      const summonFraming = charging && phoenix
        ? smoothFireVisual(summonAge / 270) * (1 - .28 * smoothFireVisual((summonAge / phoenix.arrivalMs - .80) / .20))
        : 0;
      const normalCameraY = s.y - 158;
      const frostCamera = storm ? frostStormCamera(storm, timestamp, normalCameraY) : null;
      const thunderCamera = thunder && !menuReducedMotion ? electricStormCamera(thunder, timestamp) : null;
      const thunderY = thunderCamera ? lerp(normalCameraY - VIEW_H * .065,
        Math.max(normalCameraY - VIEW_H * .065, thunderCamera.point.y - VIEW_H * .59), thunderCamera.focus) : normalCameraY;
      const targetCamera = clamp((frostCamera?.y ?? lerp(normalCameraY, thunderY, thunderCamera?.charge ?? 0))
        - VIEW_H * .20 * summonFraming + (menuReducedMotion ? 0 : INFINITY.cameraLead(run.infinity, timestamp)), 0, run.portalY - VIEW_H + 105);
      const dashFollow = electricFlight && !menuReducedMotion ? 16 : 4.25;
      run.cameraY = lerp(run.cameraY, targetCamera, clamp(dt * (dashFollow + summonFraming * 3
        + (frostCamera?.weight ?? 0) * 2.4 + (thunderCamera?.focus ?? 0) * 3.7), 0, 1));
    }

    if (run.shake > 0) run.shake = Math.max(0, run.shake - dt * 20);

    const healthScale = 1;
    const massRadius = massRadiusForLevel(elementalLevel('mass'), run.cellSize);
    const normalRadius = massRadius * healthScale;
    s.radius = lerp(s.radius, normalRadius, clamp(dt * 5.5, 0, 1));
    if (run.healthFlashTime > 0) run.healthFlashTime = Math.max(0, run.healthFlashTime - dt);

    const speedNow = Math.hypot(s.vx, s.vy);
    if (s.vy * gravityDirection < 185) resetMassPierce();
    if (!charging && !thunderHold && !electricFlight && !run.inJellyZoneId && speedNow < 34 && s.y > 180) run.lowMotionTime += dt;
    else run.lowMotionTime = 0;
    if (run.lowMotionTime > 1.0) {
      s.vy += 145 * gravityDirection;
      s.vx += rand(-65, 65);
      run.lowMotionTime = 0;
    }

    if (run.energy <= 0) endRun(false, 'Сила закончилась');
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
    const left = fallDirectionHeld('left');
    const right = fallDirectionHeld('right');
    const x = left && right ? (run.steer.lastDirection === 'left' ? -1 : 1) : Number(right) - Number(left);
    const input = { x, y: 0, up: 0, down: 0 };
    return run?.steer ? window.SlimeFungiHazards.invert(run, input) : input;
  }

  function applySpeedDrillSteering(slime, dt) {
    const steering = fallSteeringVector();
    const inputLength = Math.hypot(steering.x, steering.y);
    const currentSpeed = Math.max(1, Math.hypot(slime.vx, slime.vy));
    const driveSpeed = 500;
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


  function cosmosOrbitsEnabled(timestamp = performance.now()) {
    return Boolean(run && !run.ended && !run.portalEntry && elementalLevel('cosmos') >= 1
      && run.ultimateIntro?.type !== 'cosmos' && !(run.elementalAbilityActive === 'cosmos' && (run.ultimateStage || 3) >= 3)
      && !(run.cosmosUltimate && timestamp < run.cosmosUltimate.fadeUntil));
  }

  function updateCosmosOrbits(dt, timestamp) {
    if (!run || run.paused) return;
    if (!cosmosOrbitsEnabled(timestamp)) {
      run.cosmosOrbitAlpha = 0;
      run.cosmosOrbitPrevious = null;
      for (const contacts of run.cosmosOrbitContacts) contacts.clear();
      return;
    }
    if (!(dt > 0)) return;
    run.cosmosOrbitClock += dt * 1000;
    run.cosmosOrbitAlpha = Math.min(1, run.cosmosOrbitAlpha + dt * 5);
    const boost = COSMOS_ULTIMATES.orbitBoost(run, timestamp);
    const planets = window.SlimeCosmosOrbits.samples({ ...run.slime, cellSize: run.cellSize, level: elementalLevel('cosmos'), clock: run.cosmosOrbitClock, planetScale: boost.scale });
    for (const planet of planets) {
      const previous = run.cosmosOrbitPrevious?.[planet.index] || planet;
      const travel = Math.hypot(planet.x - previous.x, planet.y - previous.y);
      const sweepStart = travel > run.cellSize * 3 ? planet : previous;
      const steps = Math.max(1, Math.min(12, Math.ceil(Math.hypot(planet.x - sweepStart.x, planet.y - sweepStart.y) / Math.max(3, planet.radius * .55))));
      const candidates = blocksNearY((planet.y + sweepStart.y) / 2, Math.abs(planet.y - sweepStart.y) / 2 + planet.radius, 0);
      const contacts = new Set();
      const oldContacts = run.cosmosOrbitContacts[planet.index];
      for (const block of candidates) {
        if (!elementalDamageable(block) || block.special) continue;
        const touching = window.SlimeCosmosOrbits.touches(planet, block);
        if (touching) contacts.add(block);
        if (oldContacts.has(block) || run.cosmosOrbitClock < (run.cosmosOrbitCooldowns.get(block) || 0)) continue;
        let hit = touching;
        for (let step = 0; !hit && step < steps; step++) {
          const fraction = step / steps;
          hit = window.SlimeCosmosOrbits.touches({ radius: planet.radius,
            x: lerp(sweepStart.x, planet.x, fraction), y: lerp(sweepStart.y, planet.y, fraction) }, block);
        }
        if (!hit) continue;
        run.cosmosOrbitCooldowns.set(block, run.cosmosOrbitClock + 2000);
        damageBlockByElement(block, boost.damage, boost.active ? 'cosmosPlanetUltimate' : 'cosmosOrbit', timestamp);
        run.cosmosOrbitHitUntil[planet.index] = timestamp + 150;
        if (timestamp - run.cosmosOrbitSoundAt >= 90) {
          run.cosmosOrbitSoundAt = timestamp;
          sound(block.dead ? 'break' : 'hit');
        }
      }
      run.cosmosOrbitContacts[planet.index] = contacts;
    }
    run.cosmosOrbitPrevious = planets;
  }

  function drawRunCosmosOrbits(timestamp, front = false) {
    if (!cosmosOrbitsEnabled(timestamp)) return;
    const boost = COSMOS_ULTIMATES.orbitBoost(run, timestamp);
    window.SlimeCosmosOrbits.draw(ctx, {
      x: run.slime.x, y: run.slime.y - run.cameraY, radius: run.slime.radius,
      cellSize: run.cellSize,
      level: elementalLevel('cosmos'), clock: run.cosmosOrbitClock,
      alpha: run.cosmosOrbitAlpha, timestamp, hitUntil: run.cosmosOrbitHitUntil, planetScale: boost.scale, boostStrength: boost.strength
    }, front);
  }

  function cosmosUltimatePower(ultimate, timestamp) {
    if (!ultimate || timestamp >= ultimate.fadeUntil) return 0;
    if (timestamp <= ultimate.fadeStartedAt) return 1;
    const fade = clamp((timestamp - ultimate.fadeStartedAt) / (ultimate.fadeUntil - ultimate.fadeStartedAt), 0, 1);
    return 1 - fade * fade * (3 - 2 * fade);
  }

  function breakCosmosUltimatePath(fromX, fromY, timestamp) {
    const slime = run.slime;
    const cell = run.cellSize;
    const firstRow = Math.max(0, Math.floor((Math.min(fromY, slime.y) - slime.radius - run.blockRowOrigin) / cell));
    const lastRow = Math.floor((Math.max(fromY, slime.y) + slime.radius - run.blockRowOrigin) / cell);
    const firstCol = Math.max(0, Math.min(Math.floor(fromX / cell), Math.floor(slime.x / cell)) - 1);
    const lastCol = Math.min(run.columns - 1, Math.max(Math.floor(fromX / cell), Math.floor(slime.x / cell)) + 1);
    for (let row = firstRow; row <= lastRow; row += 1) {
      let shattered = 0;
      for (const block of run.blocksByRow?.get(row) || []) {
        if (block.dead || block.col < firstCol || block.col > lastCol) continue;
        if (block.y > Math.max(fromY, slime.y) + slime.radius || block.y + block.h < Math.min(fromY, slime.y) - slime.radius) continue;
        if (block.hazard) { block.hp = 0; destroyBlock(block, 'cosmosUltimate', timestamp); }
        else if (block.unbreakable) { block.hp = 0; destroyBlock(block, 'cosmos', timestamp); }
        else damageBlockByElement(block, Math.max(1, block.hp), 'cosmos', timestamp);
        shattered += 1;
        if (run.ended) return;
      }
      if (shattered) run.shake = Math.max(run.shake, 4.5);
    }
  }

  function updateCosmosUltimateMotion(dt, timestamp) {
    const ultimate = run?.cosmosUltimate;
    if (!ultimate || ultimate.finishedAt || timestamp >= ultimate.fadeUntil) return false;
    const slime = run.slime;
    const previousX = slime.x;
    const previousY = slime.y;
    const steering = fallSteeringVector();
    const power = cosmosUltimatePower(ultimate, timestamp);
    run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, ultimate.fadeUntil);
    run.shake = Math.max(0, run.shake - dt * 20);
    slime.vx = lerp(slime.vx, steering.x * 255, 1 - Math.exp(-10 * dt));
    slime.x = clamp(slime.x + slime.vx * dt, slime.radius, VIEW_W - slime.radius);
    if (slime.x === slime.radius || slime.x === VIEW_W - slime.radius) slime.vx = 0;
    if (timestamp < ultimate.chargeUntil) {
      slime.vy = 0;
      if (Math.abs(slime.x - previousX) > .5) breakCosmosUltimatePath(previousX, previousY, timestamp);
      run.shake = Math.max(run.shake, 1.8 + Math.sin(timestamp / 32) * .35);
    } else {
      if (!ultimate.ignitedAt) {
        ultimate.ignitedAt = timestamp;
        run.cosmosCometIgnitedAt = timestamp;
        pushElementalEffect('cosmosBoost', slime.x, slime.y, { life: .9, maxLife: .9, ignition: true });
        impact('КОМЕТА · ПРОРЫВ');
        sound('epic');
        feedback([12, 20, 12]);
      }
      const ignition = clamp((timestamp - ultimate.chargeUntil) / COSMOS_ULTIMATE_RAMP_MS, 0, 1);
      const easedIgnition = ignition * ignition * (3 - 2 * ignition);
      const cruiseSpeed = Math.max(normalFallSpeedLimit() * 1.85, run.cellSize * 9);
      slime.vy = lerp(normalFallSpeedLimit() * .9, cruiseSpeed, easedIgnition * power);
      slime.y = Math.min(ultimate.endY, slime.y + slime.vy * dt);
      breakCosmosUltimatePath(previousX, previousY, timestamp);
      if(slime.y>=ultimate.endY){
        ultimate.finishedAt=timestamp;ultimate.fadeStartedAt=timestamp;ultimate.fadeUntil=timestamp+420;
        run.elementalAbilityUntil=ultimate.fadeUntil;
        run.damageInvulnerableUntil=Math.max(ultimate.invulnerableBefore||0,timestamp+180);
        slime.vy=Math.min(slime.vy,normalFallSpeedLimit());
      }
      run.shake = Math.max(run.shake, 1.8 + power * .8);
      if (timestamp - ultimate.lastSampleAt >= 34) {
        ultimate.trail.push({ x: slime.x, y: slime.y, at: timestamp });
        ultimate.lastSampleAt = timestamp;
      }
      ultimate.trail = ultimate.trail.filter(sample => timestamp - sample.at < 650).slice(-20);
    }
    slime.wobble += dt * (8 + Math.abs(slime.vy) / 100);
    run.flightDistance += Math.hypot(slime.x - previousX, slime.y - previousY);
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.depth = (run.endlessDepthOffset || 0) + Math.max(0, Math.min(run.world.targetDepth,
      Math.floor((slime.y - 285) / (run.rowCount * run.cellSize) * run.world.targetDepth)));
    run.maxDepth = Math.max(run.maxDepth, run.depth);
    updateFlasks(timestamp);
    const portal = getPortalGeometry();
    if (slimeTouchesPortal(slime, portal) || slime.y - slime.radius > portal.bottom + 70) {
      beginPortalEntry(timestamp, portal);
      return true;
    }
    const targetCamera = clamp(slime.y - 158, 0, run.portalY - VIEW_H + 105);
    run.cameraY = lerp(run.cameraY, targetCamera, clamp(dt * 10, 0, 1));

    return true;
  }





  function applyFallSteering(slime, dt, timestamp = performance.now(), speedFactor = 1) {
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
      const targetVx = Math.abs(inputX) > .01 ? inputX * controlSpeed * speedFactor : 0;
      const reversing = Math.abs(inputX) > .01 && Math.abs(slime.vx) > 10 && Math.sign(slime.vx) !== Math.sign(inputX);
      const responseRate = reversing ? 11 : Math.abs(inputX) > .01 ? 5.4 : 7.2;
      const response = 1 - Math.exp(-responseRate * effectiveAuthority * dt);
      slime.vx = lerp(slime.vx, targetVx, response);
      if (!inputX && Math.abs(slime.vx) < 2) slime.vx = 0;
    }
  }

  function normalFallSpeedLimit() {
    if (run?.sharedDescent) return BALANCE.maxFallSpeedWorld1 || 305;
    return BALANCE.maxFallSpeedBase + (run?.worldId || 1) * BALANCE.maxFallSpeedPerWorld;
  }

  function descentSpeedRatio(currentRun, normalSpeed) {
    const scale = currentRun.fallSpeedScale ?? 1;
    return Math.min(scale, currentRun.slime.vy * scale / normalSpeed);
  }

  function ramDamageForRock(block, currentRun, normalSpeed) {
    if (block.hazard || block.special || block.unbreakable) return 0;
    const available = Math.min(availableFallMomentum(currentRun), descentSpeedRatio(currentRun, normalSpeed));
    const hits = Math.floor((available - 1 + 1e-8) / FALL_MOMENTUM.step);
    return Math.max(0, Math.min(3, hits, Math.ceil(block.hp)));
  }

  function coreEncounterStatus(message) {
    let status = document.getElementById('coreEncounterStatus');
    if (!status) {
      status = document.createElement('div'); status.id = 'coreEncounterStatus';
      status.className = 'core-encounter-accessible'; status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite'); els.shaft.append(status);
    }
    status.textContent = message;
  }

  function runHudBottomLogical() {
    const canvasBox=els.canvas.getBoundingClientRect(),hudBox=$('.run-top-hud').getBoundingClientRect();
    const distanceBox=$('#runDistanceReadout')?.getBoundingClientRect();
    const bottom=Math.max(hudBox.bottom,distanceBox?.bottom||0);
    return Math.max(72,(bottom-canvasBox.top)*VIEW_H/Math.max(1,canvasBox.height));
  }

  function prepareCosmosCoreStrike(background = false) {
    const cache = window.SlimeCosmosCoreStrike;
    cache[background ? 'prewarm' : 'prepare']((target,t,x,y,r,front)=>drawCosmosCometVisual(t,x,y,r,front,{strength:1,ultra:1,softRim:true},target));
  }

  function beginCoreEncounter() {
    if (!run?.coreArena || run.coreEncounter || run.ended) return;
    if (run.energy <= 0) { endRun(false, 'Сила закончилась'); return; }
    finishRunUltimateAudio();
    clearFallSteering(); hideGlitchChoice();
    run.glitchChoice = null; run.ultimateIntro = null;
    for (const key of ['psionicShot','mechSuit','frostStorm','frostFlake','electricDash','electricStorm','stagedUltimate','fireFlash','phoenixUltimate','nanoBurst','telekinesisPress','sporePop','cloneUltimate','cosmosUltimate','cosmosStagedUltimate','geyserCapture','psionicBarrier']) run[key] = null;
    run.electricStormBolts.length = 0;
    run.electricStormHits.length = 0;
    run.elementalAbilityActive = ''; run.elementalAbilityUntil = 0;
    if (run.infinity) run.infinity.cast = null;
    run.slime.radius = run.baseSlimeRadius || run.slime.radius;
    run.freezeUntil = 0; run.hurtFlashUntil = 0; run.shieldPop = null; run.barrier = 0;
    run.emotion = 'focused'; run.emotionUntil = performance.now() + 60000;
    run.depth = run.world.targetDepth; run.maxDepth = Math.max(run.maxDepth, run.depth);
    if(run.corePreview&&Number.isFinite(run.corePreviewReserve))run.energy=run.corePreviewReserve;
    CORE.begin(run, save.planetCampaign.cores[PLANETS.forWorld(run.worldId)?.id] ?? 100,{hudBottom:runHudBottomLogical()});
    if(run.coreEncounter.beforeHp>0&&run.coreEncounter.beforeHp<=run.coreEncounter.plannedDamage)PURIFICATION.prepare(PLANETS.forWorld(run.worldId)?.id || 'home');
    run.coreEncounter.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    run.coreEncounter.lowPower = isLowPowerDevice();
    els.shaft.classList.add('core-encounter-active');
    if(run.coreEncounter.fire)window.SlimeFireCoreStrike.prepare();
    if(run.coreEncounter.electric)window.SlimeElectricCoreStrike.prepare();
    if(run.coreEncounter.frost)window.SlimeFrostCoreStrike.prepare();
    if(run.coreEncounter.cosmos)prepareCosmosCoreStrike();
    if(run.coreEncounter.techno)window.SlimeTechnoCoreStrike.prepare();
    if(run.coreEncounter.phantom)window.SlimePhantomCoreStrike.prepare();
    if(run.coreEncounter.psionic)window.SlimePsionicCoreStrike.prepare(run.worldId);
    if(run.coreEncounter.spores)window.SlimeSporesCoreStrike.prepare();
    if(run.coreEncounter.infinity){
      window.SlimeInfinityCoreStrike.prepare();
      startRunUltimateCue('infinityCharge',performance.now());
    }
    if(run.coreEncounter.glitch)window.SlimeGlitchCoreStrike.capture(target=>drawElementalSlimeAvatar(target,{x:64,y:64,radius:36,skin:'classic',appearance:'cute-v2',emotion:'focused',timestamp:performance.now()},run.categoryVisuals,performance.now()),run.coreEncounter.lowPower);
    if(run.coreEncounter.infinity)coreEncounterStatus('Слайм собирает силу Бесконечности. Приготовься ударить.');
    else coreEncounterStatus(run.coreEncounter.cinematic?`Сила перетекает в ${run.coreEncounter.spores?'споровую':run.coreEncounter.glitch?'цифровую':run.coreEncounter.psionic?'голубую телекинетическую':run.coreEncounter.phantom?'призрачную':run.coreEncounter.techno?'красную плазменную':run.coreEncounter.cosmos?'кометную':run.coreEncounter.frost?'ледяную':run.coreEncounter.electric?'электрическую':'огненную'} ауру. Приготовься ударить.`:`Впереди ядро. Автоматический удар: до ${run.coreEncounter.plannedDamage} процентов урона за сохранённую силу.`);
    updateRunUI();
  }

  function beginAnomalyEvacuation(completed=false,reason='Аномальная сила закончилась. Слайм эвакуирован.') {
    if(!run||run.ended||run.evacuation)return false;
    finishRunUltimateAudio();
    clearFallSteering();hideGlitchChoice();clearRunImpactFeedback();
    run.glitchChoice=null;run.ultimateIntro=null;
    for(const key of ['psionicShot','mechSuit','frostStorm','frostFlake','electricDash','electricStorm','stagedUltimate','fireFlash','phoenixUltimate','nanoBurst','telekinesisPress','sporePop','cloneUltimate','cosmosUltimate','cosmosStagedUltimate','geyserCapture','psionicBarrier'])run[key]=null;
    run.electricStormBolts.length = 0;
    run.electricStormHits.length = 0;
    run.elementalAbilityActive='';run.elementalAbilityUntil=0;run.barrier=0;
    if (run.infinity) run.infinity.cast = null;
    run.freezeUntil=0;run.hurtFlashUntil=0;run.healGlowUntil=0;
    run.launchEntryUntil=0;run.portalEntry=null;
    run.emotion='surprised';run.emotionUntil=performance.now()+10000;
    EVAC.begin(run,{completed,reason,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,width:VIEW_W,height:VIEW_H,hudBottom:runHudBottomLogical(),timestamp:performance.now()});
    updateRunUI();
    els.shaft.classList.add('is-evacuating');
    coreEncounterStatus(completed?'Сила израсходована. Слайм возвращается на базу.':'Сила закончилась. Слайма заберёт спасательный портал.');
    window.SlimeAnomalyEnergyHud.render(run);
    sound('shieldPop');feedback([10,18,8]);
    return true;
  }

  function applyPlanetCoreStrike(damage) {
    if (!run || run.planetCoreApplied || run.endless || run.tutorialPhase) return run?.coreStrikeEvent || null;
    if (run.corePreview) {
      const from = run.coreEncounter.beforeHp, to = Math.max(0, from - damage);
      run.planetCoreApplied = true;
      return run.coreStrikeEvent = {from, to, damage: from - to};
    }
    const planet = PLANETS.forWorld(run.worldId); if (!planet) return null;
    const before = [...save.planetCampaign.unlocked];
    const result = PLANETS.applyDamage(save.planetCampaign, planet.id, damage);
    save.planetCampaign = result.campaign;
    run.planetCoreApplied = true; run.coreStrikeEvent = result.event;
    run.coreNewlyOpened = save.planetCampaign.unlocked.filter(id => !before.includes(id));
    for (const id of run.coreNewlyOpened) {
      const worldId = PLANETS.get(id).worldId; if (!worldId) continue;
      if (!save.unlockedWorlds.includes(worldId)) save.unlockedWorlds.push(worldId);
      save.unseenWorlds = [...new Set([...(save.unseenWorlds || []), worldId])];
    }
    // The strike is committed once at contact, even if the return animation is interrupted.
    persist({captureDraft:false,refreshUI:false});
    return result.event;
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
    finishElectricDash(timestamp, true);
    hideGlitchChoice();
    run.glitchChoice = null;
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

  function releaseSlimeFromPatrol(block, collision, timestamp) {
    if (!block.hazard || block.dead || block.glitchNeutralized || block.motion?.axis !== 'x') return false;
    const slime = run.slime;
    const leftTrap = collision.nx < -.35 && block.x < slime.radius * 2 + 8;
    const rightTrap = collision.nx > .35 && VIEW_W - block.x - block.w < slime.radius * 2 + 8;
    if (!leftTrap && !rightTrap) return false;
    // A wall leaves no room for sideways separation. Release above the patrol
    // even during the contact cooldown, instead of pushing out of the shaft.
    slime.x = clamp(slime.x, slime.radius + 4, VIEW_W - slime.radius - 4);
    slime.y = Math.max(slime.radius + 4, Math.min(slime.y, block.y - slime.radius - 9));
    slime.vx = leftTrap ? 65 : -65;
    slime.vy = -Math.max(320, Math.abs(slime.vy));
    run.bounceGraceUntil = Math.max(run.bounceGraceUntil || 0, timestamp + 260);
    run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil || 0, timestamp + 650);
    run.flightDistance = 0;
    return true;
  }

  function applyBlockBounce(slime, collision, { hazard, timestamp, isolated = false, steeringEnabled = true, rock = false }) {
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
    const pressure = steeringEnabled && mobilityLevel >= 1 ? run.speedPressure || 0 : 0;
    const downwardBounceScale = ny < -.45 ? (1 - pressure * .25) * (rock ? .73 : 1) : 1;
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

    const steering = steeringEnabled ? fallSteeringVector() : { x: 0 };
    if (Math.abs(steering.x) > .01) {
      if (Math.abs(nx) < .34) {
        const steeringAssist = (hazard ? 86 : lerp(54, 86, regularCurve)) * (1 + mobilityLevel * .2);
        slime.vx = clamp(slime.vx * .5 + steering.x * steeringAssist, -BALANCE.sideBounceMax, BALANCE.sideBounceMax);
      } else if (Math.sign(steering.x) === Math.sign(nx)) {
        slime.vx += steering.x * (hazard ? 34 : 24);
      }
    }

    const lockReduction = mobilityLevel >= 2 ? 10 : mobilityLevel >= 1 ? 5 : 0;
    const restoreReduction = mobilityLevel >= 2 ? 24 : mobilityLevel >= 1 ? 12 : 0;
    if (!isolated) {
      run.bounceGraceUntil = timestamp + BALANCE.bounceGraceMs + (hazard ? 70 : 20);
      run.bounceControlLockUntil = timestamp + (rock ? 22 : Math.max(24, 36 - lockReduction));
      run.bounceControlRestoreUntil = timestamp + (rock ? 88 : Math.max(88, 120 - restoreReduction));
    }
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
    if(run.evacuation)return false;
    if(block.techAttack&&(mechSuitActive()||psionicBarrierActive(timestamp)||(run.cosmosUltimate&&!run.cosmosUltimate.finishedAt&&timestamp<run.cosmosUltimate.fadeUntil)))return false;
    const slime = run.slime;
    if (INFINITY.protectsDuringUltimate(run.infinity, timestamp)) {
      if (block.techAttack) return false;
      slime.x += collision.nx * (collision.penetration + 4);
      slime.y += collision.ny * (collision.penetration + 4);
      applyBlockBounce(slime, collision, { hazard: true, timestamp, steeringEnabled: false });
      return true;
    }
    if (run.psionicBarrier && psionicBarrierActive(timestamp)) { explodePsionicHazard(block, timestamp); return false; }
    const mech = mechSuitActive() ? run.mechSuit : null;
    if (mech || (run.cosmosUltimate && !run.cosmosUltimate.finishedAt && timestamp < run.cosmosUltimate.fadeUntil)) {
      block.hp = 0;
      destroyBlock(block, mech ? 'mech' : 'cosmosUltimate', timestamp);
      sound('break');
      feedback(5);
      return false;
    }
    const centerX = block.x + block.w / 2;
    const centerY = block.y + block.h / 2;
    const persistentSpike = run.sharedDescent;
    if (!persistentSpike) {
      block.dead = true;
      block.hp = 0;
      run.blocksDestroyed += 1;
    }
    if (!persistentSpike) {
      createDebris(block, 16, true);
      spawnSpecialBurst('bomb', centerX, centerY);
      run.shake = Math.max(run.shake, 8.5);
    }

    if (timestamp < run.damageInvulnerableUntil) {
      if (persistentSpike) {
        slime.x += collision.nx * (collision.penetration + 7);
        slime.y += collision.ny * (collision.penetration + 7);
        applyBlockBounce(slime, collision, { hazard: true, timestamp });
        return true;
      }
      sound('break');
      return false;
    }

    if (run.barrier > 0) {
      burstDominantShield(block, timestamp);
      run.barrierFlashUntil = timestamp + 380;
      run.damageInvulnerableUntil = timestamp + 700;
      run.flightDistance = 0;
      slime.x += collision.nx * (collision.penetration + 7);
      slime.y += collision.ny * (collision.penetration + 7);
      applyBlockBounce(slime, collision, { hazard: true, timestamp });
      impact('ЩИТ РАЗБИТ');
      sound('shieldPop');
      feedback([12, 20, 9]);
      updateRunUI();
      return true;
    }
    if (triggerInfinityShield(collision, timestamp)) return true;

    const iceEnergyBefore=run.energy;
    ENERGY.hazard(run, timestamp);
    run.lastHeartLossAt = timestamp;
    run.hazardImpact={x:clamp(slime.x,block.x,block.x+block.w),y:clamp(slime.y,block.y,block.y+block.h),nx:collision.nx,ny:collision.ny};
    run.shake = Math.max(run.shake, 7.5);
    run.damageInvulnerableUntil = timestamp + ENERGY.CONFIG.hazardGraceMs;
    run.hurtSlowUntil = Math.max(run.hurtSlowUntil || 0, timestamp + 380);
    run.hurtFlashUntil = timestamp + ENERGY.CONFIG.hazardGraceMs;
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

    impact(`−${ENERGY.CONFIG.hazard}% СИЛЫ`);
    sound('hitHard');
    feedback([18, 28, 12]);
    updateRunUI();
    if(block.ice?.kind==='frostSpike'&&run.energy<iceEnergyBefore&&!run.evacuation)window.SlimeIceHazards.addFrost(run);
    if (run.energy <= 0) endRun(false, 'Сила закончилась');
    return true;
  }

  function elementalLevel(type) {
    return clamp(Math.round((run?.passiveLevels || run?.categoryVisuals)?.[type] || 0), 0, 3);
  }

  function shieldDominant() {
    return 'base';
  }

  function burstDominantShield(source, timestamp) {
    if (!run || run.barrier <= 0) return false;
    // Consume protection before secondary damage can trigger other callbacks.
    run.barrier = 0;
    const type = shieldDominant();
    run.shieldPop = { x: run.slime.x, y: run.slime.y,
      radius: run.slime.radius, type, at: timestamp };
    run.shake = Math.max(run.shake, 4.2);
    return true;
  }

  function shieldReactionSource() {
    const s = run.slime, cell = run.cellSize;
    const row = Math.floor((s.y + s.radius - run.blockRowOrigin) / cell);
    let nearest = null, best = Infinity;
    for (let r = row; r <= row + 2; r++) for (const block of run.blocksByRow?.get(r) || []) {
      if (block.dead || block.special || (block.unbreakable && !block.hazard)) continue;
      const center = blockCenter(block);
      if (center.y < s.y) continue;
      const distance = Math.hypot(center.x - s.x, center.y - s.y - s.radius);
      if (distance < best) { nearest = block; best = distance; }
    }
    const col = clamp(Math.floor(s.x / cell), 0, run.columns - 1);
    return nearest || { row, col, x:col*cell, y:run.blockRowOrigin+row*cell, w:cell, h:cell };
  }

  function activateDominantShield(timestamp) {
    run.barrier = Math.max(1, run.shield);
    run.barrierStartedAt = timestamp;
    run.barrierFlashUntil = timestamp + 720;
    applyDominantShieldReaction(shieldReactionSource(), timestamp);
  }

  function updateShieldLifetime(timestamp) {
    if (run.barrier > 0 && timestamp - run.barrierStartedAt >= 4000) {
      burstDominantShield(null, timestamp);
    }
  }

  function applyDominantShieldReaction() {
    // The base shield only absorbs damage; mutation strength never changes it.
  }

  function updateShieldMines(timestamp) {
    if (!run.shieldMines?.length) return;
    run.shieldMines = run.shieldMines.filter(mine => {
      if (timestamp < mine.launchedAt + 320) return true;
      if (!mine.target.dead) {
        const targets = [mine.target, ...nearbyGridBlocks(mine.target, elementalDamageable)
          .filter(block => !block.special && (block.row === mine.target.row || block.col === mine.target.col))];
        for (const block of targets) damageBlockByElement(block, 1, 'nanoMine', timestamp);
        spawnSpecialBurst('bomb', mine.toX, mine.toY, 0, -1, .48);
      }
      return false;
    });
  }

  function speedDrillActive(timestamp = performance.now()) {
    return Boolean(run?.elementalAbilityActive === 'mobility' && timestamp < run.elementalAbilityUntil);
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
    const candidates = run?.blocksByRow
      ? [run.blocksByRow.get(source.row - 1) || [], run.blocksByRow.get(source.row) || [], run.blocksByRow.get(source.row + 1) || []].flat()
      : run?.blocks || [];
    return candidates.filter(block => {
      if (block === source || block.dead) return false;
      const rowDistance = Math.abs(block.row - source.row);
      const columnDistance = Math.abs(block.col - source.col);
      return rowDistance <= 1 && columnDistance <= 1 && rowDistance + columnDistance > 0 && predicate(block);
    });
  }

  function elementalDamageable(block) {
    if (run?.tutorialPhase && block?.special === 'gel' && !save.onboarding.healLearned) return false;
    if (run?.tutorialPhase===2 && block?.flaskTier && !save.onboarding.veinsLearned) return false;
    return Boolean(block && !block.dead && !block.unbreakable && (!block.hazard||block.tech||block.breakableHazard));
  }

  const MECH_LAND_MS = TECHNO_ULTIMATES.MECH_ASSEMBLY_MS;
  const MECH_ACTIVE_MS = TECHNO_ULTIMATES.MECH_ACTIVE_MS;
  const MECH_EXPLOSION_MS = 650;
  const MECH_VISUAL_CELLS = 2.24;

  function mechSuitActive() {
    return Boolean(run?.mechSuit?.phase === 'active');
  }

  function mechSlowZoneImmune(timestamp = performance.now()) {
    return mechSuitActive() || Boolean(run && timestamp < (run.mechExitZoneGraceUntil || 0));
  }

  function applyMechSteering(slime, dt, timestamp) {
    const input = fallSteeringVector().x;
    const response = 1 - Math.exp(-10 * dt);
    slime.vx = lerp(slime.vx, input * run.cellSize * 3.5, response);
    const load = clamp(1 - (timestamp - (run.mechSuit.lastCutAt ?? -Infinity)) / 115, 0, 1);
    slime.vy = run.cellSize * (3 - .65 * load);
  }

  function finishMechSuit(timestamp) {
    if (!run?.mechSuit) return;
    run.mechExplosion = { x: run.slime.x, y: run.slime.y + run.cellSize * 1.13, startedAt: timestamp };
    run.mechSuit = null;
    run.elementalAbilityActive = '';
    run.elementalAbilityUntil = 0;
    run.elementalAbilityNextTickAt = 0;
    run.nanoShots = [];
    run.nanoNextShotAt = timestamp + TECHNO_ULTIMATES.PASSIVE_INTERVAL_MS;
    run.slime.radius = massRadiusForLevel(elementalLevel('mass'), run.cellSize);
    run.slime.vy = Math.max(0, run.slime.vy);
    run.bounceControlLockUntil = 0;
    run.hurtSlowUntil = 0;
    run.freezeUntil = 0;
    run.mechExitZoneGraceUntil = timestamp + 900;
    run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, timestamp + 700);
    run.shake = Math.max(run.shake, 4);
    sound('hitHard');
    feedback([16,26,12]);
    updateRunUI();
  }

  function nanoDronePosition(timestamp) {
    const slime = run.slime;
    const age = timestamp - (run.nanoLastShotAt || -Infinity);
    const recoil = age >= 0 && age < 180 && !menuReducedMotion
      ? Math.sin(age / 180 * Math.PI * 1.5) * Math.exp(-age / 78) : 0;
    const size = slime.radius * (run.nanoBurst ? 1.05 : .86);
    const y = slime.y - slime.radius - size * .48 - 9 + Math.sin(timestamp / 385) * 2.8 - recoil * 12;
    return { x: slime.x, y, size, muzzleY: y + size * .33 };
  }

  function updateNanoDrones(timestamp) {
    if (!run || run.ended) return;
    updateShieldMines(timestamp);
    if (elementalLevel('nano')) {
      TECHNO_ULTIMATES.update(run, timestamp, nanoDronePosition(timestamp), technoUltimateServices);
    }
  }

  const TELEKINESIS_INTERVAL_MS = 2000;
  const TELEKINESIS_PULL_START_MS = 180;
  const TELEKINESIS_RECOIL_START_MS = 720;
  const TELEKINESIS_THROW_START_MS = 930;
  const TELEKINESIS_THROW_OFFSETS = [0, -.82, .88, -.42, .5];
  const TELEKINESIS_ULTIMATE_COUNT = 8;
  const TELEKINESIS_ULTIMATE_ORBIT_MS = 1450;
  const TELEKINESIS_ULTIMATE_STAGGER_MS = 185;
  const TELEKINESIS_PRESS_DISTANCE_CELLS = 7 * 80 / 50; // Seven mine rows are 50 m.
  const TELEKINESIS_PRESS_WINDUP_MS = 320;
  const TELEKINESIS_PRESS_COLLIDE_MS = 1280;
  const TELEKINESIS_PRESS_FADE_MS = 1050;

  function psionicBarrierActive(timestamp) {
    return Boolean(run?.psionicBarrier && timestamp >= run.psionicBarrier.startedAt && timestamp < run.psionicBarrier.until);
  }

  function psionicBarrierRadius() {
    return run.slime.radius + run.cellSize * .55;
  }

  function startPsionicBarrier(timestamp) {
    run.psionicBarrier = { startedAt:timestamp, until:timestamp+(run.ultimateProfile?.durationMs||3000), lastPulseAt:-Infinity };
    run.psionicBarrierBursts ||= [];
    updatePsionicBarrier(timestamp);
  }

  function explodePsionicHazard(block, timestamp) {
    if (!block?.hazard || block.dead || !psionicBarrierActive(timestamp)) return false;
    const center=blockCenter(block),cell=run.cellSize;
    if (!destroyBlock(block,'psionicBarrier',timestamp)) return false;
    block.hp=0;
    for(const target of blocksNearY(center.y,cell*1.7)) {
      if(!elementalDamageable(target)||target.special)continue;
      const dx=center.x-clamp(center.x,target.x,target.x+target.w),dy=center.y-clamp(center.y,target.y,target.y+target.h);
      if(dx*dx+dy*dy<=(cell*1.15)**2)damageBlockByElement(target,1,'psionicBarrier',timestamp);
    }
    run.psionicBarrier.lastPulseAt=timestamp;
    run.psionicBarrierBursts.push({...center,startedAt:timestamp});
    if(run.psionicBarrierBursts.length>8)run.psionicBarrierBursts.shift();
    run.shake=Math.max(run.shake,3);sound('break');feedback(7);
    return true;
  }

  function updatePsionicBarrier(timestamp) {
    if(run.psionicBarrierBursts?.length)run.psionicBarrierBursts=run.psionicBarrierBursts.filter(b=>timestamp-b.startedAt<420);
    if(!run.psionicBarrier)return;
    if(timestamp>=run.psionicBarrier.until){run.psionicBarrier=null;return;}
    if(!psionicBarrierActive(timestamp)||run.portalEntry||run.ended)return;
    const s=run.slime,radius=psionicBarrierRadius();
    for(const block of blocksNearY(s.y,radius+run.cellSize)) {
      if(block.dead||!block.hazard)continue;
      if(circleRectCollision({x:s.x,y:s.y,radius},block,radius))explodePsionicHazard(block,timestamp);
    }
  }

  function telekinesisPressProgress(press, timestamp) {
    const t = clamp((timestamp - press.startedAt - TELEKINESIS_PRESS_WINDUP_MS)
      / (TELEKINESIS_PRESS_COLLIDE_MS - TELEKINESIS_PRESS_WINDUP_MS), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function startTelekinesisPress(timestamp, originY) {
    void window.SlimePsionicFeedback.preload();
    const firstRow = Math.max(0, Math.floor((originY + run.slime.radius - run.blockRowOrigin) / run.cellSize) + 1);
    const topY = run.blockRowOrigin + firstRow * run.cellSize;
    const bottomY = Math.min(topY + (run.ultimateProfile?.pressRows || TELEKINESIS_PRESS_DISTANCE_CELLS) * run.cellSize, run.portalY - run.cellSize * .5);
    const lastRow = Math.floor((bottomY - run.blockRowOrigin) / run.cellSize - .5);
    const targets = [];
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (const block of run.blocksByRow?.get(row) || []) {
        if (!block.dead && (!block.unbreakable || block.hazard)) targets.push(block);
      }
    }
    run.telekinesisPress = {
      startedAt: timestamp, firstRow, lastRow, targets, targetSet: new Set(targets), collided: false,
      topY, bottomY, collapseY: topY + Math.min((bottomY-topY)*.5,run.cellSize*4.5),
      originX: run.slime.x, originY
    };
    run.telekinesisNextAt = timestamp + ELEMENTAL_ABILITY_DURATION_MS.telekinesis + 400;
    run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil || 0, timestamp + TELEKINESIS_PRESS_COLLIDE_MS + 200);
    run.emotion = 'power';
    run.emotionUntil = timestamp + TELEKINESIS_PRESS_COLLIDE_MS;
    run.shake = Math.max(run.shake, 4);
  }

  function updateTelekinesisPress(timestamp) {
    const press = run?.telekinesisPress;
    if (!press) return;
    const elapsed = timestamp - press.startedAt;
    if (elapsed < TELEKINESIS_PRESS_COLLIDE_MS) {
      // Hold the casting position while the mine segment is compressed.
      run.slime.vx *= .88;
      run.slime.vy *= .82;
      run.slime.y += (press.originY - run.slime.y) * .08;
      run.shake = Math.max(run.shake, 3.5 + telekinesisPressProgress(press, timestamp) * 2.3);
      return;
    }
    if (!press.collided) {
      press.collided = true;
      press.rewardBatch = { value: 0, visible: false };
      for (const block of press.targets) {
        if (!block.dead) destroyBlock(block, 'telekinesisPress', timestamp);
      }
      const batch = press.rewardBatch;
      press.rewardBatch = null;
      if (batch.value > 0) {
        awardFlaskData(batch.value);
        if (batch.visible) sound('crystal', { value: batch.largestVisibleVein });
        if (batch.visible) {
          const cell=run.cellSize;
          const block={x:VIEW_W/2-cell/2,y:clamp(press.topY+cell*3,run.cameraY+110,run.cameraY+VIEW_H-80)-cell/2,w:cell,h:cell,flaskTier:3};
          const density=effectDensity(),count=takeDecorativeParticles(isMobileDevice()?12:18,true);
          const essence=window.SlimeBlockBreakFeedback.emitEssence(block,batch.value,density,count);
          run.particles.push(...essence.particles);
          appendTransientEffect(essence.impact,36,isMobileDevice()?6:10);
        }
      }
      run.shake = Math.max(run.shake, 12.5);
      sound('epic');
      feedback([24, 34, 22]);
      impact('ПСИОНИЧЕСКИЙ ПРЕСС · 80 М');
    }
    if (elapsed > TELEKINESIS_PRESS_COLLIDE_MS + TELEKINESIS_PRESS_FADE_MS) run.telekinesisPress = null;
  }

  function telekinesisCandidates() {
    const minY = run.slime.y + run.slime.radius * .75;
    const maxY = run.cameraY + VIEW_H - 18;
    return blocksNearY((minY+maxY)/2,Math.max(0,(maxY-minY)/2)+run.cellSize).filter(block => {
      if (!elementalDamageable(block) || block.special) return false;
      const centerY = block.y + block.h / 2;
      return centerY > minY && centerY < maxY && block.x + block.w > 0 && block.x < VIEW_W;
    });
  }

  function psionicSources() {
    const cell = run.cellSize, slime = run.slime;
    return blocksNearY(slime.y, cell * 3).filter(block => {
      const center = blockCenter(block);
      return elementalDamageable(block) && !block.special && !block.hazard && !block.flaskTier
        && !run.telekinesisCycle?.projectiles.some(p => p.block === block && !p.detached)
        && Math.abs(center.y - slime.y) <= cell * 3;
    }).map(block => {
      const center = blockCenter(block);
      const dx = Math.abs(center.x - slime.x) / cell;
      const dy = Math.abs(center.y - slime.y) / cell;
      return {block, score: Math.abs(dx - 1) + dy + (dx < .5 ? 3 : 0) + Math.random() * 1.4};
    }).sort((a,b) => a.score - b.score).map(entry => entry.block);
  }

  function psionicCluster() {
    const candidates = psionicSources();
    const grid = new Map(candidates.map(block => [block.row * run.columns + block.col, block]));
    let best = null, bestScore = Infinity;
    for (const block of candidates) {
      if (block.col >= run.columns - 1) continue;
      const key = block.row * run.columns + block.col;
      const group = [block, grid.get(key + 1), grid.get(key + run.columns), grid.get(key + run.columns + 1)];
      if (group.some(piece => !piece)) continue;
      const x = block.x + block.w, y = block.y + block.h;
      const score = Math.hypot(Math.abs(x - run.slime.x) - run.cellSize, y - run.slime.y);
      if (score < bestScore) { best = group; bestScore = score; }
    }
    if (best) return best;
    // An uneven pocket can supply the cast if four pieces still share edges.
    for (const seed of candidates) {
      const group = [seed];
      for (let i = 0; i < group.length; i++) {
        const {row,col} = group[i];
        for (const [r,c] of [[row-1,col],[row+1,col],[row,col-1],[row,col+1]]) {
          if (c < 0 || c >= run.columns || Math.abs(r-seed.row)>1 || Math.abs(c-seed.col)>1) continue;
          const next = grid.get(r*run.columns+c);
          if (!next || group.includes(next)) continue;
          group.push(next);
          if (group.length === 4) return group;
        }
      }
    }
    return null;
  }

  function psionicAssistTarget(timestamp, projectile) {
    const s = run.slime, cell = run.cellSize;
    const steering = fallSteeringVector().x;
    const speedLimit = normalFallSpeedLimit();
    const gravity = BALANCE.gravityBase + run.worldId * BALANCE.gravityPerWorld;
    const ghost = {x:s.x,y:s.y,vx:s.vx,vy:s.vy,radius:s.radius};
    const momentum = {
      slime:ghost, fallSpeedScale:run.fallSpeedScale, fallFreeSeconds:run.fallFreeSeconds,
      fallImpactTarget:run.fallImpactTarget, fallImpactSpeed:run.fallImpactSpeed
    };
    const candidates = blocksNearY(s.y+cell*2.5,cell*4.5).filter(block =>
      !block.dead && block.y < run.portalY && block.y + block.h >= projectile.position.y - cell*.65);
    const passed = new Set();
    let firstBreak = null;
    const step = .025;
    for (let i = 1; i <= 22; i++) {
      const at = timestamp + i * step * 1000;
      if (at >= (run.bounceControlLockUntil || 0)) {
        const targetVx = steering * 200;
        const rate = steering && Math.sign(ghost.vx) !== steering ? 11 : steering ? 5.4 : 7.2;
        ghost.vx = lerp(ghost.vx, targetVx, 1 - Math.exp(-rate * step));
      }
      ghost.vy = Math.min(speedLimit,ghost.vy+gravity*step);
      const scale = ghost.vy > 0 ? advanceFallMomentum(momentum,step) : 1;
      ghost.x = clamp(ghost.x+ghost.vx*step,s.radius,VIEW_W-s.radius);
      ghost.y += ghost.vy*scale*step;
      const contacts = [];
      for (const block of candidates) {
        if (block.x > ghost.x+s.radius || block.x+block.w < ghost.x-s.radius
          || block.y > ghost.y+s.radius || block.y+block.h < ghost.y-s.radius) continue;
        if (passed.has(block) || (run.hitCooldowns?.has(block.id) && at-run.hitCooldowns.get(block.id)<72)
          || at < (block.snowballGhostUntil || 0)) continue;
        const collision = circleRectCollision(ghost,block,block.hazard ? s.radius*.76 : s.radius);
        if (collision && ghost.vx*collision.nx+ghost.vy*collision.ny < -1) contacts.push({block,collision});
      }
      contacts.sort((a,b)=>b.collision.penetration-a.collision.penetration);
      for (const {block,collision} of contacts) {
        const ram = ramDamageForRock(block,momentum,speedLimit);
        const disposable = block.elementalSnow || block.hp <= Math.max(block.phantomMarked ? 2 : 1,ram);
        if (!disposable || block.hazard || block.special || block.unbreakable) {
          if (elementalDamageable(block)) return {block,side:Math.sign(ghost.vx)};
          // A solid hazard ends the predicted path even if the throw cannot break it.
          i = 22;
          break;
        }
        firstBreak ||= blockCenter(block);
        passed.add(block);
        if (ram) spendFallMomentum(momentum,ram,true);
        else if (!block.elementalSnow) {
          if (collision.ny < -.35) ghost.vy = Math.min(ghost.vy,Math.max(ghost.vy*.7,speedLimit*.85));
          spendFallMomentum(momentum,1);
        }
      }
    }
    // The near path clears on contact. Look farther along that path for useful work.
    const forwardX = ghost.x - s.x, forwardY = Math.max(cell,ghost.y-s.y);
    const side = Math.abs(forwardX) > cell*.25 ? Math.sign(forwardX) : 0;
    let best = null, bestScore = Infinity;
    for (const block of candidates) {
      if (passed.has(block) || !elementalDamageable(block) || block.hp <= 0 || block.elementalSnow) continue;
      const {x,y} = blockCenter(block);
      const ahead = y - s.y;
      if (ahead < -s.radius || (firstBreak && y < firstBreak.y-cell*.3)) continue;
      const lane = clamp(s.x+forwardX*clamp(ahead/forwardY,.35,1.55),s.radius,VIEW_W-s.radius);
      const lateral = Math.abs(x-lane);
      if (lateral > cell*1.55 || (ahead < cell*.45 && lateral > cell*.7)) continue;
      const score = Math.max(0,ahead)*.73+lateral*2.15+(block.hp <= 1 ? cell*.65 : 0)
        + (block !== projectile.targetBlock ? cell*.23 : 0);
      if (score < bestScore) { best = block; bestScore = score; }
    }
    return {block:best,side,skipCurrent:passed.has(projectile.targetBlock) || !candidates.includes(projectile.targetBlock)};
  }

  function psionicImpact(point, budget, wide, timestamp, struck, color, side = 0) {
    const cell = run.cellSize;
    // Choose the four cells around the nearest grid intersection.
    const col = struck && wide ? clamp(struck.col-Number(side<0),0,run.columns-2)
      : struck?.col ?? (wide ? clamp(Math.round((point.x-run.gridOffsetX)/cell)-1,0,run.columns-2)
      : Math.floor((point.x-run.gridOffsetX)/cell));
    const row = struck?.row ?? Math.max(0, (wide ? Math.round((point.y-run.blockRowOrigin)/cell)-1
      : Math.floor((point.y-run.blockRowOrigin)/cell)));
    const size = wide ? 2 : 1, primary = [], adjacent = [];
    for (let r=row-1; r<=row+size; r++) {
      for (const block of run.blocksByRow.get(r) || []) {
        if (block.col < col-1 || block.col > col+size || !elementalDamageable(block) || !(block.hp > 0)) continue;
        const hit = struck && !wide ? block === struck : r>=row && r<row+size && block.col>=col && block.col<col+size;
        (hit ? primary : adjacent).push(block);
      }
    }
    const distance = b => Math.hypot(b.x+b.w/2-point.x,b.y+b.h/2-point.y);
    primary.sort((a,b)=>distance(a)-distance(b));
    const hits = primary.map(()=>0);
    let remaining = budget;
    while (remaining > 0) {
      const before = remaining;
      primary.forEach((b,i)=>{
        if (remaining && hits[i] < b.hp) { hits[i]++; remaining--; }
      });
      if (remaining === before) break;
    }
    primary.forEach((b,i)=>{ if (hits[i]) damageBlockByElement(b,hits[i],'telekinesisBlast',timestamp); });
    const power = (.73 + budget * .045) * (wide ? 1.28 : 1);
    const wave = {...point, startedAt:timestamp, power, lifetime:490, shards:[]};
    run.telekinesisBursts.push(wave);
    if (run.ultimateStage >= 2 && primary.length && remaining) {
      adjacent.sort((a,b)=>a.hp-b.hp || distance(a)-distance(b));
      for (const block of adjacent) {
        if (!remaining) break;
        if (block.dead) continue;
        const amount = Math.min(block.hp,remaining);
        remaining -= amount;
        damageBlockByElement(block,amount,'telekinesisBlast',timestamp);
        wave.shards.push({...blockCenter(block), amount, color});
      }
    }
    run.shake = Math.max(run.shake,power * (wide ? 4 : 2));
  }

  function psionicHand(age) {
    const {x, y, radius, vx} = run.slime;
    const cell = run.cellSize;
    const motion = menuReducedMotion ? .28 : 1;
    const bounce = Math.sin(age / 106) * Math.exp(-Math.max(0, age - 330) / 480) * .12;
    return {
      x: clamp(x + (Math.sin(age / 170) * cell * .055 - clamp(vx * .05,-cell*.34,cell*.34)) * motion,
        cell*.48,VIEW_W-cell*.48),
      y: y - radius - cell * (.46 + (Math.sin(age / 188) * .085 + bounce) * motion)
    };
  }

  function psionicFlightPoint(from, to, t, bend) {
    const eased = t * (.52 + .48 * t);
    return {
      x: lerp(from.x, to.x, eased),
      y: lerp(from.y, to.y, eased) - Math.sin(Math.PI * eased) * bend
    };
  }

  function shiftPsionicAssist(projectile, delta) {
    if (projectile.flightAt != null) projectile.flightAt += delta;
    if (projectile.flightUpdatedAt != null) projectile.flightUpdatedAt += delta;
    if (projectile.deadline != null) projectile.deadline += delta;
    if (projectile.nextAimAt != null) projectile.nextAimAt += delta;
    for (const point of projectile.trail || []) point.at += delta;
  }

  function advancePsionicAssist(projectile, timestamp) {
    const current = projectile.targetBlock;
    const live = elementalDamageable(current) && current.hp > 0;
    const elapsed = Math.min(40, timestamp - (projectile.flightUpdatedAt ?? timestamp));
    projectile.flightUpdatedAt = timestamp;
    if (!(timestamp < projectile.nextAimAt) || (current && (!live || current.hp !== projectile.targetHp))) {
      const aim = psionicAssistTarget(timestamp,projectile);
      projectile.nextAimAt = timestamp + 79;
      if (!aim.block && (!live || aim.skipCurrent)) {
        projectile.targetBlock = null;
      } else if (aim.block && aim.block !== current) {
        projectile.targetBlock = aim.block;
        projectile.flightFrom = projectile.position;
        projectile.flightAt = timestamp;
        const target = blockCenter(aim.block);
        const distance = Math.hypot(target.x-projectile.position.x,target.y-projectile.position.y);
        projectile.flightMs = clamp(distance*.66,76,490);
        projectile.bend = Math.min(16,distance*.13);
      }
      projectile.targetHp = projectile.targetBlock?.hp;
      if (aim.block) projectile.sideAtTarget = aim.side;
    }
    if (projectile.targetBlock) {
      projectile.target = blockCenter(projectile.targetBlock);
      const progress = clamp((timestamp-projectile.flightAt)/projectile.flightMs,0,1);
      projectile.position = psionicFlightPoint(projectile.flightFrom,projectile.target,progress,projectile.bend);
      if (progress >= 1) return 'hit';
    } else {
      const {x,y} = projectile.position;
      projectile.position = {x:clamp(x+run.slime.vx*elapsed*.0006,0,VIEW_W),y:y+elapsed*run.cellSize*.007};
    }
    const trail = projectile.trail;
    if (!trail.length || timestamp-trail.at(-1).at >= 16) trail.push({...projectile.position, at:timestamp});
    while (trail.length > 9 || (trail.length > 1 && timestamp-trail[0].at > 138)) trail.shift();
    return timestamp >= projectile.deadline ? 'spent' : 'flying';
  }

  function startPsionicShot(timestamp) {
    const blocks = psionicCluster();
    if (!blocks) return false;
    void window.SlimePsionicFeedback.preload();
    const pieces = blocks.map(block => ({visual:{...block}, source:blockCenter(block)}));
    const origin = pieces.reduce((point,piece) => ({
      x:point.x+piece.source.x/4, y:point.y+piece.source.y/4
    }), {x:0,y:0});
    const hand = psionicHand(0);
    run.psionicShot = {startedAt:timestamp, lastAt:timestamp, pieces, origin, hand,
      color:materialColor(blocks[0].material, run.world, .6), budget:blocks.reduce((sum,b)=>sum+b.hp,0)};
    for (const block of blocks) destroyBlock(block,'telekinesisLift',timestamp);
    run.psionicReadyAt = timestamp + ACTIVE_ATTACK_COOLDOWN_MS;
    impact('КОСНИСЬ ЦЕЛИ');
    return true;
  }

  function updatePsionicShot(timestamp) {
    const shot = run.psionicShot;
    if (!shot) return;
    const age = timestamp-shot.startedAt;
    if (!shot.from) {
      const desired = psionicHand(age);
      const follow = 1 - Math.exp(-Math.max(0, timestamp - shot.lastAt) / 61);
      const leash = run.cellSize * .38;
      shot.hand.x = clamp(lerp(shot.hand.x, desired.x, follow), desired.x-leash,desired.x+leash);
      shot.hand.y = clamp(lerp(shot.hand.y, desired.y, follow), desired.y-leash,desired.y+leash);
    }
    shot.lastAt = timestamp;
    if (!shot.from && age >= 420 && (shot.aim || age >= 3000)) {
      shot.from = shot.hand;
      shot.launchedAt = timestamp;
      if (shot.aim) {
        shot.to = shot.aim;
        const distance = Math.hypot(shot.to.x-shot.from.x,shot.to.y-shot.from.y);
        shot.flight = clamp(distance * .82,170,570);
        shot.bend = Math.min(28,distance*.16);
      } else {
        shot.position = shot.from;
        shot.trail = [];
        shot.deadline = timestamp + 1080;
      }
      feedback(9);
    }
    if (!shot.from) return;
    if (!shot.aim) {
      const state = advancePsionicAssist(shot,timestamp);
      if (state === 'hit') psionicImpact(shot.target,shot.budget,true,timestamp,shot.targetBlock,shot.color,shot.sideAtTarget);
      if (state !== 'flying') run.psionicShot = null;
    } else if (timestamp >= shot.launchedAt+shot.flight) {
      psionicImpact(shot.to,shot.budget,true,timestamp,null,shot.color);
      run.psionicShot = null;
    }
  }

  function drawPsionicShot(timestamp) {
    const shot = run.psionicShot;
    const age = Math.max(0,timestamp-shot.startedAt), t = clamp(age/420,0,1);
    const flight = shot.from ? clamp((timestamp-shot.launchedAt)/(shot.flight || 480),0,1) : 0;
    const {x,y} = shot.position || (shot.from ? psionicFlightPoint(shot.from,shot.to,flight,shot.bend) : shot.hand);
    const cell = run.cellSize, sy = y-run.cameraY;
    const effects = window.SlimePsionicFeedback;
    const reduced = menuReducedMotion || isLowPowerDevice();
    const radius = cell * (.52 + Math.sin(age/129)*.025 - flight*.15);
    const strength = clamp(t*1.6,0,1);
    if (shot.from) {
      const count = reduced ? 5 : 9;
      const points = shot.aim ? Array.from({length:count},(_,i) =>
        psionicFlightPoint(shot.from,shot.to,Math.max(0,flight-(count-1-i)*17/shot.flight),shot.bend))
        : [...shot.trail,shot.position];
      effects.castTrail(ctx,points,run.cameraY,cell*.67,1);
      for (const side of [-1,1]) {
        const filament = points.map((p,i) => {
          const t = i/(points.length-1);
          const wave = Math.sin(t*Math.PI) * cell * .16 * side;
          return {x:p.x+wave,y:p.y+wave*.42};
        });
        effects.castTrail(ctx,filament,run.cameraY,cell*.11,.8);
      }
      effects.castImpact(ctx,{...shot.from,power:.7},run.cameraY,cell,timestamp-shot.launchedAt,reduced);
    } else if (t < 1) {
      const sourceY = shot.origin.y - run.cameraY;
      effects.castImpact(ctx,{...shot.origin,power:1.23},run.cameraY,cell,age,reduced);
      effects.ribbon(ctx,shot.origin.x,sourceY,x,sy,cell*.85,Math.sin(t*Math.PI)*.8);
    }
    effects.field(ctx,x,sy,radius,age,strength,false,reduced);
    shot.pieces.forEach(({visual,source},i)=>{
      const angle = i*Math.PI/2 + age*(reduced ? .0009 : .004);
      const pull = 1 - (1-clamp((age-i*19)/(420-i*19),0,1))**2.4;
      const spread = cell * (.19-flight*.055);
      const px = lerp(source.x,x+Math.cos(angle)*spread,pull);
      const py = lerp(source.y,y+Math.sin(angle)*spread*.82,pull)-Math.sin(pull*Math.PI)*cell*.15;
      ctx.save(); ctx.translate(px,py-run.cameraY); ctx.rotate(pull*(Math.sin(angle)*.42+flight));
      const scale = lerp(1,.34-flight*.04,pull); ctx.scale(scale,scale);
      ctx.translate(-source.x,-(source.y-run.cameraY)); drawBlock(visual,visual.y-run.cameraY,timestamp); ctx.restore();
    });
    effects.field(ctx,x,sy,radius,age,strength,true,reduced);
  }

  function telekinesisOrbitPosition(projectile, elapsed) {
    const count=run.telekinesisCycle?.projectiles.length || TELEKINESIS_ULTIMATE_COUNT;
    const angle = elapsed * .0028 + projectile.index * Math.PI * 2 / count;
    const radius = run.slime.radius * 1.5 + run.cellSize * .5;
    const centerX=clamp(run.slime.x,radius+18,VIEW_W-radius-18);
    let centerY=run.slime.y-run.slime.radius*1.8-20,vertical=radius*.42;
    const ceiling=run.cameraY+105+run.cellSize*.22,floor=run.slime.y-run.slime.radius*.9-run.cellSize*.22;
    if(floor>ceiling){vertical=Math.min(vertical,(floor-ceiling)/2);centerY=clamp(centerY,ceiling+vertical,floor-vertical);}
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * vertical
    };
  }

  function startTelekinesisCycle(timestamp, level, ultimate = false) {
    void window.SlimePsionicFeedback.preload();
    const candidates = ultimate ? telekinesisCandidates() : psionicSources().slice(0,1);
    const selected = [];
    const count = ultimate ? run.ultimateProfile?.blockCount || TELEKINESIS_ULTIMATE_COUNT : 1;
    while (selected.length < count && candidates.length) {
      const index = Math.floor(Math.random() * candidates.length);
      const block = candidates.splice(index, 1)[0];
      if (!selected.includes(block)) selected.push(block);
    }
    run.telekinesisNextAt = timestamp + (ultimate ? 4400 : TELEKINESIS_INTERVAL_MS);
    if (!selected.length) return false;
    run.telekinesisMarks = selected.map(block => ({
      x: block.x, y: block.y, w: block.w, h: block.h, startedAt: timestamp,
      duration: ultimate ? 580 : 420
    }));
    run.telekinesisCycle = {
      startedAt: timestamp,
      mode: ultimate ? 'ultimate' : 'single', uncaptured:selected.length,
      projectiles: selected.map((block, index) => ({
        block,
        visual: { ...block },
        source: blockCenter(block),
        side: blockCenter(block).x < run.slime.x ? -1 : 1,
        index,
        delay: 0,
        throwAt: ultimate ? (run.ultimateProfile?.orbitMs||TELEKINESIS_ULTIMATE_ORBIT_MS) + index * (run.ultimateProfile?.staggerMs||TELEKINESIS_ULTIMATE_STAGGER_MS) : TELEKINESIS_THROW_START_MS,
        impactAt: ultimate ? (run.ultimateProfile?.orbitMs||TELEKINESIS_ULTIMATE_ORBIT_MS) + index * (run.ultimateProfile?.staggerMs||TELEKINESIS_ULTIMATE_STAGGER_MS) + 470 : null,
        ultimate,
        detached: false,
        launched: false,
        impacted: false,
        target: null,
        launchFrom: null
      }))
    };
    if (ultimate) run.elementalAbilityUntil = Math.max(run.elementalAbilityUntil, timestamp + run.telekinesisCycle.projectiles.at(-1).impactAt + 450);
    return true;
  }

  function launchTelekinesisProjectile(projectile, cycle, timestamp) {
    const slime = run.slime;
    if (cycle.mode === 'single') {
      projectile.launchFrom = {x:slime.x+projectile.side*(slime.radius+12), y:slime.y-slime.radius*.2};
      projectile.position = projectile.launchFrom;
      projectile.trail = [];
      projectile.deadline = timestamp + 1100;
      projectile.launched = true;
      return;
    }
    const offset = TELEKINESIS_THROW_OFFSETS[run.telekinesisThrowIndex % TELEKINESIS_THROW_OFFSETS.length];
    run.telekinesisThrowIndex += 1;
    const desiredX = cycle.mode === 'cross'
      ? projectile.side < 0 ? VIEW_W * .78 : VIEW_W * .22
      : cycle.mode === 'ultimate' ? run.gridOffsetX + run.cellSize * (.5 + (projectile.index * 3 + Math.floor(projectile.index/2)) % run.columns)
        : slime.x + offset * run.cellSize;
    const aimedX = clamp(desiredX, run.cellSize / 2, VIEW_W - run.cellSize / 2);
    let impactBlock = null;
    let bestScore = Infinity;
    const lowY=slime.y+slime.radius,highY=run.cameraY+VIEW_H-10;
    for (const block of blocksNearY((lowY+highY)/2,Math.max(0,(highY-lowY)/2)+run.cellSize)) {
      if (!elementalDamageable(block) || block.special) continue;
      const center = blockCenter(block);
      if (center.y <= slime.y + slime.radius || center.y >= run.cameraY + VIEW_H - 10) continue;
      const score = Math.abs(center.x - aimedX) * 1.3
        + Math.abs(center.y - (slime.y + run.cellSize * 2.5)) * .5;
      if (score < bestScore) { bestScore = score; impactBlock = block; }
    }
    projectile.target = impactBlock
      ? { ...blockCenter(impactBlock), row: impactBlock.row, col: impactBlock.col }
      : { x: aimedX, y: Math.min(run.cameraY + VIEW_H - 20, slime.y + run.cellSize * 2.6), row: null, col: null };
    projectile.launchFrom = cycle.mode === 'ultimate'
      ? telekinesisOrbitPosition(projectile, timestamp - cycle.startedAt)
      : { x: slime.x + projectile.side * (slime.radius + 12), y: slime.y - slime.radius * .2 };
    projectile.launched = true;
  }

  function updatePsionicThrow(projectile, timestamp) {
    const state = advancePsionicAssist(projectile,timestamp);
    if (state === 'hit') {
      const color = materialColor(projectile.visual.material,run.world,.6);
      psionicImpact(projectile.target,projectile.visual.hp,false,timestamp,projectile.targetBlock,color);
    }
    projectile.impacted = state !== 'flying';
  }

  function impactTelekinesisProjectile(projectile, timestamp) {
    const target = projectile.target;
    if (!target) return;
    run.telekinesisBursts.push({ x: target.x, y: target.y, startedAt: timestamp });
    if (target.row != null && target.col != null) {
      for (let row = target.row - 1; row <= target.row + 1; row += 1) {
        for (const block of run.blocksByRow?.get(row) || run.blocks) {
          if (elementalDamageable(block) && !block.special
            && Math.abs(block.row - target.row) <= 1 && Math.abs(block.col - target.col) <= 1) {
            damageBlockByElement(block, 1, projectile.ultimate ? 'telekinesisStorm' : 'telekinesisBlast', timestamp);
          }
        }
      }
    }
    run.shake = Math.max(run.shake, 2.3);
  }

  function updateTelekinesis(timestamp) {
    if (!run || run.ended) return;
    run.telekinesisMarks = run.telekinesisMarks.filter(mark => timestamp - mark.startedAt < mark.duration);
    run.telekinesisBursts = run.telekinesisBursts.filter(burst => timestamp - burst.startedAt < (burst.lifetime || 330));
    const level = elementalLevel('telekinesis');
    if (!level || run.portalEntry) return;
    updatePsionicShot(timestamp);
    const cycle = run.telekinesisCycle;
    if (cycle) {
      for (const projectile of cycle.projectiles) {
        const elapsed = timestamp - cycle.startedAt;
        if (elapsed >= TELEKINESIS_PULL_START_MS + projectile.delay && !projectile.detached) {
          if (projectile.block.dead && !projectile.ultimate) {
            projectile.impacted = true;
            projectile.detached = true;
            continue;
          }
          projectile.visual.hp = projectile.block.hp;
          if (!projectile.block.dead) {
            destroyBlock(projectile.block, projectile.ultimate ? 'telekinesisStorm' : 'telekinesisLift', timestamp);
          }
          projectile.detached = true;
        }
        if (elapsed >= projectile.throwAt && !projectile.launched) launchTelekinesisProjectile(projectile, cycle, timestamp);
        if (!projectile.ultimate && projectile.launched && !projectile.impacted) {
          updatePsionicThrow(projectile, timestamp);
        } else if (projectile.ultimate && elapsed >= projectile.impactAt && !projectile.impacted) {
          impactTelekinesisProjectile(projectile, timestamp);
          projectile.impacted = true;
        }
      }
      if (cycle.projectiles.every(projectile => projectile.impacted)) run.telekinesisCycle = null;
      return;
    }
    if (run.telekinesisPress) return;
    if (run.telekinesisUltimatePending) {
      if (run.elementalAbilityActive !== 'telekinesis' || timestamp >= run.elementalAbilityUntil) {
        run.telekinesisUltimatePending = false;
        return;
      }
      if (startTelekinesisCycle(timestamp, level, true)) run.telekinesisUltimatePending = false;
      return;
    }
    if (run.elementalAbilityActive === 'telekinesis' && timestamp < run.elementalAbilityUntil) return;
    if (timestamp >= run.telekinesisNextAt) startTelekinesisCycle(timestamp, level);
  }

  const MAX_MINI_SLIMES = 12;
  const MAX_SPORE_PODS = 10;
  const MAX_SPORE_PROJECTILES = 10;
  const SPORE_GROW_MS = 1000;
  const CLONE_ULTIMATE_BURST_MS = 540;

  function cloningTimeScale(timestamp) {
    if (!run?.cloneUltimate) return 1;
    const age = timestamp - run.cloneUltimate.startedAt;
    if (age < 420) return lerp(1, .24, clamp(age / 420, 0, 1));
    if (age < CLONE_ULTIMATE_BURST_MS) return .24;
    return lerp(.24, 1, clamp((age - CLONE_ULTIMATE_BURST_MS) / 280, 0, 1));
  }

  function sporeBurst(x, y, count = 7, force = 1) {
    const amount = Math.max(1, Math.round(count * .78 * effectDensity()));
    for (let index = 0; index < amount; index += 1) {
      const angle = count >= 30
        ? index * Math.PI * 2 / amount + rand(-.08, .08)
        : Math.random() * Math.PI * 2;
      const speed = rand(55, 145) * force;
      const life = rand(.58, .94);
      run.particles.push({
        kind: 'special', shape: 'spore', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: -12, life, maxLife: life, size: rand(2.6, 4.6),
        wanderPhase: rand(0, Math.PI * 2), wanderRate: rand(5, 8),
        wanderAmplitude: rand(25, 45),
        color: index % 3 === 0 ? '#f6ffd0' : index % 2 ? '#b6ff64' : '#65e885'
      });
    }
    trimParticles(250);
  }

  function spawnMiniSlime(angle, speed, bounces, sourceBlockId, timestamp, origin = run.slime, ultimateSource = false) {
    if (run.miniSlimes.length >= MAX_MINI_SLIMES) run.miniSlimes.shift();
    const radius = Math.max(10, run.cellSize * .185);
    run.miniSlimes.push({
      x: origin.x + Math.cos(angle) * radius * .6,
      y: origin.y + Math.sin(angle) * radius * .6,
      vx: Math.cos(angle) * speed + (origin.vx || 0) * .08,
      vy: Math.sin(angle) * speed + (origin.vy || 0) * .06,
      radius, bouncesLeft: bounces, sourceBlockId, ultimateSource,
      ignoreSourceUntil: timestamp + 700, ignoreBlockId: '', ignoreBlockUntil: 0,
      bornAt: timestamp, lastSporeAt: timestamp, life: bounces > 0 ? 4.6 : 2.7, dead: false
    });
  }

  function findSporeTarget(row, preferredCol = Math.floor(Math.random() * run.columns)) {
    const options = [];
    for (const rowOffset of [0, 1, -1]) {
      for (const block of run.blocksByRow?.get(row + rowOffset) || []) {
        if (!elementalDamageable(block) || block.sporePod
          || run.sporeProjectiles.some(projectile => projectile.block === block)) continue;
        options.push({ block, score: Math.abs(block.col - preferredCol) * 2 + Math.abs(rowOffset) * 3 + Math.random() });
      }
    }
    options.sort((a, b) => a.score - b.score);
    return options[0]?.block || null;
  }

  function launchSpore(block, timestamp, { x = run.slime.x, y = run.slime.y, delay = 0, automatic = false, order = 0 } = {}) {
    if (!block || run.sporeProjectiles.length >= MAX_SPORE_PROJECTILES) return false;
    const launchedAt = timestamp + delay;
    run.sporeProjectiles.push({ block, x, y, launchedAt,
      landsAt: launchedAt + clamp(Math.hypot(block.x + block.w / 2 - x, block.y - y) * 1.5 + 420, 940, 1520),
      arcSide: order % 2 ? -1 : 1,
      automatic, order });
    return true;
  }

  function sporeFlightPoint(projectile, timestamp) {
    const progress = clamp((timestamp - projectile.launchedAt) / (projectile.landsAt - projectile.launchedAt), 0, 1);
    const t = progress * progress * (3 - 2 * progress);
    const inverse = 1 - t;
    const target = blockCenter(projectile.block);
    const controlX = (projectile.x + target.x) * .5 + projectile.arcSide * run.cellSize * .88;
    const controlY = projectile.y - run.cellSize * 1.35;
    return {
      x: inverse * inverse * projectile.x + 2 * inverse * t * controlX + t * t * target.x,
      y: inverse * inverse * projectile.y + 2 * inverse * t * controlY + t * t * target.y,
      progress
    };
  }

  function detonateSporePod(pod, timestamp) {
    if (!pod || pod.detonated) return;
    pod.detonated = true;
    recordMutationAction('cloning', pod);
    if (pod.block.sporePod === pod) pod.block.sporePod = null;
    const center = blockCenter(pod.block);
    const cause = pod.automatic ? 'sporeUltimate' : 'sporeExplosion';
    run.sporeBursts.push({ x: center.x, y: center.y, startedAt: timestamp });
    sporeBurst(center.x, center.y, isLowPowerDevice() ? 8 : 13, 1.1);
    run.shake = Math.max(run.shake, 2.5);
    for (let row = pod.block.row - 1; row <= pod.block.row + 1; row += 1) {
      for (const neighbor of run.blocksByRow?.get(row) || []) {
        if (neighbor === pod.block || Math.abs(neighbor.col - pod.block.col) > 1 || !elementalDamageable(neighbor)) continue;
        damageBlockByElement(neighbor, 1, cause, timestamp);
      }
    }
    if (elementalDamageable(pod.block)) {
      damageBlockByElement(pod.block, Math.max(1, pod.block.hp), cause, timestamp);
    }
    if (pod.spawnMinis) {
      for (const angle of [Math.PI * .25, Math.PI * .5, Math.PI * .75]) {
        spawnMiniSlime(angle + rand(-.12, .12), rand(170, 210), 2, pod.block.id, timestamp, center, pod.automatic);
      }
    }
  }

  function updateSpores(timestamp) {
    const level = elementalLevel('cloning');
    if (level) ensureSporeSprites();
    if (level && !run.portalEntry && !run.ended && run.elementalAbilityActive !== 'cloning') {
      if (!run.nextSporeAt) run.nextSporeAt = timestamp + 1900;
      if (timestamp >= run.nextSporeAt) {
        run.nextSporeAt = timestamp + rand(3500, 4600);
        if (run.sporePods.length < MAX_SPORE_PODS && run.sporeProjectiles.length < MAX_SPORE_PROJECTILES - 8) {
          const slimeRow = Math.floor((run.slime.y - run.blockRowOrigin) / run.cellSize);
          const target = findSporeTarget(slimeRow + 7);
          if (target) launchSpore(target, timestamp);
        }
      }
    }
    if (run.sporeProjectiles.length) run.sporeProjectiles = run.sporeProjectiles.filter(projectile => {
      if (projectile.block.dead || timestamp > projectile.landsAt + 1000) return false;
      if (timestamp < projectile.landsAt) return true;
      if (projectile.block.sporePod) return false;
      const pod = { block: projectile.block, plantedAt: timestamp, detonated: false,
        spawnMinis: level >= 2, automatic: projectile.automatic,
        autoDetonateAt: projectile.automatic ? timestamp + SPORE_GROW_MS + 350 + projectile.order * 75 : 0,
        expiresAt: timestamp + 14000 };
      projectile.block.sporePod = pod;
      if (run.sporePods.length >= MAX_SPORE_PODS) {
        const oldest = run.sporePods.shift();
        if (oldest.block.sporePod === oldest) oldest.block.sporePod = null;
      }
      run.sporePods.push(pod);
      return false;
    });
    for (const pod of run.sporePods) {
      if (pod.detonated || pod.block.dead) continue;
      if (pod.autoDetonateAt && timestamp >= pod.autoDetonateAt) detonateSporePod(pod, timestamp);
      else if (timestamp >= pod.expiresAt) {
        pod.detonated = true;
        if (pod.block.sporePod === pod) pod.block.sporePod = null;
      }
    }
    if (run.sporePods.length) run.sporePods = run.sporePods.filter(pod => !pod.detonated && !pod.block.dead);
    if (run.sporeBursts.length) run.sporeBursts = run.sporeBursts.filter(burst => timestamp - burst.startedAt < 700);
  }

  function updateCloningUltimate(timestamp) {
    const ultimate = run.cloneUltimate;
    if (!ultimate) return;
    const age = timestamp - ultimate.startedAt;
    if (!ultimate.fired && age >= CLONE_ULTIMATE_BURST_MS) {
      ultimate.fired = true;
      const slimeRow = Math.floor((ultimate.y - run.blockRowOrigin) / run.cellSize);
      for (let index = 0; index < (ultimate.count || 8); index += 1) {
        const target = findSporeTarget(slimeRow + 3 + index * 2,
          [1, run.columns - 2, 2, run.columns - 3][index % 4]);
        if (target) launchSpore(target, timestamp, { x: ultimate.x, y: ultimate.y,
          delay: index * 180, automatic: true, order: index });
      }
      sporeBurst(ultimate.x, ultimate.y, 18, 1.4);
      run.shake = Math.max(run.shake, 5);
      feedback([8, 17, 8]);
    }
    if (age > 1250) run.cloneUltimate = null;
  }

  function miniCloneCollision(mini, timestamp) {
    const origin = run.blockRowOrigin || 190;
    const firstRow = Math.floor((mini.y - mini.radius - 3 - origin) / run.cellSize) - 1;
    const lastRow = Math.floor((mini.y + mini.radius + 3 - origin) / run.cellSize) + 1;
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (const block of run.blocksByRow.get(row) || []) {
        if (block.dead || block.x >= mini.x + mini.radius || block.x + block.w <= mini.x - mini.radius) continue;
        if (block.id === mini.sourceBlockId && timestamp < mini.ignoreSourceUntil) continue;
        if (block.id === mini.ignoreBlockId && timestamp < mini.ignoreBlockUntil) continue;
        const collision = circleRectCollision(mini, block);
        if (collision) return { block, collision };
      }
    }
    return null;
  }

  function updateMiniSlimes(dt, timestamp) {
    if (!run?.miniSlimes?.length) return;
    for (const mini of run.miniSlimes) {
      if (mini.dead) continue;
      mini.life -= dt;
      if (mini.life <= 0) { mini.dead = true; continue; }
      mini.vy += 165 * dt;
      const steps = Math.min(4, Math.max(1, Math.ceil(Math.hypot(mini.vx, mini.vy) * dt / (mini.radius * .8))));
      const stepDt = dt / steps;
      for (let step = 0; step < steps && !mini.dead; step += 1) {
        mini.x += mini.vx * stepDt;
        mini.y += mini.vy * stepDt;
        if (mini.x < mini.radius) { mini.x = mini.radius; mini.vx = Math.max(95, Math.abs(mini.vx) * .8); }
        if (mini.x > VIEW_W - mini.radius) { mini.x = VIEW_W - mini.radius; mini.vx = -Math.max(95, Math.abs(mini.vx) * .8); }
        if (mini.y < run.cameraY - 50 || mini.y > run.cameraY + VIEW_H + 70) {
          mini.dead = true;
          break;
        }
        const hit = miniCloneCollision(mini, timestamp);
        if (!hit) continue;
        const { block, collision } = hit;
        sporeBurst(mini.x, mini.y, 5, .6);
        if (block.hazard || block.unbreakable) { mini.dead = true; break; }
        damageBlockByElement(block, 1, mini.ultimateSource ? 'sporeUltimate' : 'cloning', timestamp);
        if (mini.bouncesLeft <= 0) { mini.dead = true; break; }
        mini.bouncesLeft -= 1;
        mini.x += collision.nx * (collision.penetration + 4);
        mini.y += collision.ny * (collision.penetration + 4);
        applyBlockBounce(mini, collision, { hazard: false, timestamp, isolated: true, steeringEnabled: false });
        mini.ignoreBlockId = block.id;
        mini.ignoreBlockUntil = timestamp + 145;
        break;
      }
      if (!mini.dead && timestamp - mini.lastSporeAt >= 155) {
        mini.lastSporeAt = timestamp;
        const life = rand(.38, .62);
        run.particles.push({
          kind: 'special', shape: 'spore',
          x: mini.x - mini.vx * .035, y: mini.y - mini.vy * .035,
          vx: rand(-30, 30) - mini.vx * .13, vy: rand(-38, 12) - mini.vy * .13,
          gravity: -10, life, maxLife: life, size: rand(2.1, 3.5),
          wanderPhase: rand(0, Math.PI * 2), wanderRate: rand(5, 8),
          wanderAmplitude: rand(18, 30),
          color: Math.random() < .5 ? '#c6ff77' : '#efffc8'
        });
      }
    }
    run.miniSlimes = run.miniSlimes.filter(mini => !mini.dead);
  }

  function frostFreezable(block) {
    return Boolean(
      elementalDamageable(block)
      && !block.hazard
      && !block.special
      && !block.bramble
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
    shareGlitchHit(block, 0, timestamp, 'gold');
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

  function pushElementalEffect(type, x, y, extra = {}) {
    if (!run?.specialEffects) return;
    const life = type === 'electricArc' ? .42
      : type === 'firePulse' ? .5
        : type === 'frostTouch' ? .38
          : type === 'snowShard' ? .72
            : type === 'snowballKnockback' ? .62
          : type === 'coinArc' ? .72
            : .58;
    appendTransientEffect({ type, x, y, life, maxLife: life, ...extra }, 36);
  }

  function markFrostTransformation(block, timestamp, kind, quiet = false) {
    block.frostTransformStartedAt = timestamp;
    block.frostTransformDuration = kind === 'snowflake' ? 620 : 470;
    block.frostReservedUntil = 0;
    if (!quiet) {
      const center = blockCenter(block);
      pushElementalEffect('frostTouch', center.x, center.y, { compact: kind !== 'snowflake' });
    }
  }

  function turnBlockToSnow(block, timestamp = performance.now(), quiet = false) {
    if (!frostFreezable(block) || block.elementalSnow || block.elementalSnowflake) return false;
    shareGlitchHit(block, 0, timestamp, 'snow');
    ensureWorldSprites(2);
    recordMutationAction('frost', block);
    block.elementalSnow = true;
    if (block.flaskTier) block.flaskValue = block.flaskValue || FLASK_VALUES[block.flaskTier] || 0;
    block.elementalFrozen = false;
    block.elementalFrostPower = 0;
    block.maxHp = 1;
    block.hp = 1;
    block.frostFlashUntil = timestamp + 520;
    markFrostTransformation(block, timestamp, 'snow', quiet);
    if (!quiet) createDebris(block, 2, false);
    return true;
  }

  function turnBlockToSnowflake(block, timestamp = performance.now()) {
    if (!frostFreezable(block) || block.elementalSnowflake) return false;
    shareGlitchHit(block, 0, timestamp, 'snowflake');
    ensureWorldSprites(2);
    block.elementalSnow = false;
    recordMutationAction('frost', block);
    block.elementalSnowflake = true;
    if (block.flaskTier) block.flaskValue = block.flaskValue || FLASK_VALUES[block.flaskTier] || 0;
    block.elementalFrozen = false;
    block.maxHp = 1;
    block.hp = 1;
    block.frostFlashUntil = timestamp + 760;
    markFrostTransformation(block, timestamp, 'snowflake');
    return true;
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

  function startFrostStorm(timestamp) {
    ensureWorldSprites(2);
    const { chargeMs, rows } = run.ultimateProfile;
    run.frostStorm = {
      startedAt: timestamp, chargeMs, rows, duration: run.elementalAbilityDurationMs,
      originX: run.slime.x, originY: run.slime.y, nextCell: 0
    };
    startRunUltimateCue('blizzardGather', timestamp);
    run.emotion = 'focused';
    run.emotionUntil = timestamp + chargeMs;
  }

  function firstFrostRow(y) {
    return Math.max(0, Math.floor((y - run.blockRowOrigin - run.cellSize * .5) / run.cellSize) + 1);
  }

  function frostStormFrontY(storm, sweep) {
    const cell = run.cellSize;
    const rowTime = Math.max(FROST_STORM_ROW_MS, run.columns * FROST_STORM_CELL_MS);
    const firstY = run.blockRowOrigin + (storm.firstRow + .5) * cell;
    const row = clamp(sweep / rowTime, 0, storm.rows - 1);
    return firstY + row * cell;
  }

  function frostStormCamera(storm, timestamp, normalY = run.slime.y - 158) {
    if (!storm || menuReducedMotion || run.coreEncounter || run.evacuation || run.portalEntry) {
      return { y: normalY, weight: 0, zoom: 1 };
    }
    const age = timestamp - storm.startedAt;
    const sweep = Math.max(0, age - storm.chargeMs);
    const enter = smoothFireVisual(age / 365);
    const leave = smoothFireVisual((age - storm.duration + 730) / 730);
    const weight = enter * (1 - leave);
    const follow = storm.firstRow === undefined ? 0 : smoothFireVisual(sweep / 470);
    const castY = normalY - VIEW_H * .105;
    const trackY = follow > 0 ? clamp(frostStormFrontY(storm, sweep) - VIEW_H * .53, castY, normalY + 48) : castY;
    return {
      y: lerp(normalY, lerp(castY, trackY, follow), weight),
      weight,
      zoom: 1 + weight * lerp(.095, .025, smoothFireVisual(sweep / 520))
    };
  }

  function startFrostFlake(x, y, timestamp) {
    const cell = run.cellSize;
    const xInCells = (x - run.gridOffsetX) / cell;
    // Keep the 1.5-cell hitbox inside reach of a second tile even against a wall.
    const inset = 1 - FROST_FLAKE_WIDTH / 2 + .001;
    const hitX = clamp(xInCells, inset, run.columns - inset);
    const col = Math.floor(hitX);
    const centreOffset = hitX - col - .5;
    const goLeft = Math.abs(centreOffset) < 1e-6 ? run.slime.vx < 0 : centreOffset < 0;
    const neighbour = goLeft ? col - 1 : col + 1;
    const leftCol = clamp(Math.min(col, neighbour), 0, run.columns - 2);
    const firstRow = firstFrostRow(y);
    run.frostFlake = { x: run.gridOffsetX + hitX * cell, y, toY: y + FROST_FLAKE_CELLS * cell, startedAt: timestamp,
      firstRow, nextRow: firstRow, leftCol, burst: false };
  }

  function updateFrostFlake(timestamp) {
    const flake = run.frostFlake;
    if (!flake) return;
    const age = timestamp - flake.startedAt;
    const burstAge = age - FROST_FLAKE_TRAVEL_MS;
    const cell = run.cellSize;
    const frontY = lerp(flake.y, flake.toY, clamp(age / FROST_FLAKE_TRAVEL_MS, 0, 1));
    const reachedRow = Math.min(flake.firstRow + FROST_FLAKE_CELLS - 1, Math.floor((frontY - run.blockRowOrigin) / cell - .5));
    for (; flake.nextRow <= reachedRow; flake.nextRow += 1) {
      const enteredY = run.blockRowOrigin + (flake.nextRow + .5) * cell;
      const enteredAt = flake.startedAt + (enteredY - flake.y) / (flake.toY - flake.y) * FROST_FLAKE_TRAVEL_MS;
      for (const block of run.blocksByRow.get(flake.nextRow) || []) {
        if (block.col === flake.leftCol || block.col === flake.leftCol + 1) turnBlockToSnow(block, enteredAt, true);
      }
    }
    if (burstAge >= 0 && !flake.burst) {
      flake.burst = true;
      sound('frostBurst');
      feedback([6, 13, 6]);
    }
    if (burstAge >= FROST_FLAKE_BURST_MS) run.frostFlake = null;
  }

  function updateFrostStorm(timestamp) {
    const storm = run.frostStorm;
    if (!storm) return;
    const elapsed = timestamp - storm.startedAt;
    if (elapsed < storm.chargeMs) return;
    if (storm.firstRow === undefined) {
      storm.originX = run.slime.x;
      storm.originY = run.slime.y;
      storm.firstRow = firstFrostRow(storm.originY);
      startRunUltimateCue('blizzardSurge', timestamp, elapsed - storm.chargeMs);
      feedback([8, 18, 8]);
    }
    const age = elapsed - storm.chargeMs;
    const rowTime = Math.max(FROST_STORM_ROW_MS, run.columns * FROST_STORM_CELL_MS);
    while (storm.nextCell < storm.rows * run.columns) {
      const row = Math.floor(storm.nextCell / run.columns);
      const offset = storm.nextCell % run.columns;
      const freezeAt = row * rowTime + offset * FROST_STORM_CELL_MS;
      if (age < freezeAt) break;
      const col = row % 2 ? run.columns - 1 - offset : offset;
      const block = run.blocksByRow.get(storm.firstRow + row)?.find(block => block.col === col);
      if (block && turnBlockToSnow(block, timestamp, true)) {
        block.frostTransformStartedAt = storm.startedAt + storm.chargeMs + freezeAt;
        block.frostTransformDuration = 660;
      }
      storm.nextCell += 1;
    }
    if (elapsed >= storm.duration) run.frostStorm = null;
  }

  function igniteBlock(block, timestamp = performance.now(), fromPhoenix = false) {
    if (!elementalDamageable(block) || block.fireDamageAt > 0) return false;
    recordMutationAction('fire', block);
    block.fireIgnitedAt = timestamp;
    const upgradedFire = elementalLevel('fire') >= 2;
    const normalRock = (block.tier === 'hard' || block.tier === 'ore')
      && !block.hazard && !block.special && !block.ice && !block.bramble;
    block.fireBurnsThrough = upgradedFire && normalRock;
    block.fireIntervalMs = FIRE_BURN_INTERVAL_MS[upgradedFire ? 1 : 0];
    const fragile = !block.hazard && !block.special && (block.tier === 'dense' || block.tier === 'soft') && block.hp <= 1;
    block.fireDamageAt = timestamp + (fragile ? FIRE_FRAGILE_BURN_MS : block.fireIntervalMs);
    const ticks = block.fireBurnsThrough ? Math.ceil(block.hp) : 1;
    const remainingBurn = ticks > 1 ? (ticks - 2) * block.fireIntervalMs + FIRE_FINAL_BURN_MS : 0;
    block.fireFlashUntil = block.fireDamageAt + remainingBurn + 190;
    (run.burningBlocks ||= new Set()).add(block);
    block.fireFromPhoenix = fromPhoenix;
    if (block.y + block.h >= run.cameraY - 80 && block.y <= run.cameraY + VIEW_H + 80) sound('fireIgnite');
    return true;
  }

  function phoenixFlight(phoenix, timestamp) {
    const age = Math.max(0, timestamp - phoenix.startedAt);
    const summon = clamp(age / phoenix.arrivalMs, 0, 1);
    const passAge = age - phoenix.arrivalMs;
    const travel = clamp(passAge / phoenix.travelMs, 0, 1);
    const exit = clamp((passAge - phoenix.travelMs) / (phoenix.duration - phoenix.arrivalMs - phoenix.travelMs), 0, 1);
    const launchY = phoenix.launchY ?? run.slime.y;
    const reveal = smoothFireVisual((summon - .43) / .51);
    const gatherY = launchY - run.cellSize * 1.1;
    let y = lerp(gatherY + run.cellSize * .39, launchY, smoothFireVisual((summon - .56) / .44));
    if (phoenix.launchY !== undefined) {
      const exitY = Math.max(phoenix.endY + run.cellSize * 3, run.cameraY + VIEW_H + VIEW_W * 1.45);
      y = lerp(launchY, phoenix.endY, travel * (.85 + .15 * travel))
        + (exitY - phoenix.endY) * exit * (.48 + .52 * exit);
    }
    return {
      age, summon, passAge, y, gatherY, x: run.gridOffsetX + run.columns * run.cellSize * .5,
      scale: lerp(.29, .94, smoothFireVisual((summon - .52) / .48)), reveal
    };
  }

  function updatePhoenixUltimate(timestamp) {
    const phoenix = run.phoenixUltimate;
    if (!phoenix) return;
    const age = timestamp - phoenix.startedAt;
    if (age < phoenix.arrivalMs) return;
    if (phoenix.launchY === undefined) {
      phoenix.launchY = run.slime.y;
      const startRow = Math.max(0, Math.ceil((phoenix.launchY - run.blockRowOrigin) / run.cellSize));
      phoenix.endRow = startRow + phoenix.rows - 1;
      phoenix.endY = run.blockRowOrigin + (phoenix.endRow + .55) * run.cellSize;
      phoenix.nextRow = startRow;
      startRunUltimateCue('phoenixFlight', timestamp, age - phoenix.arrivalMs);
      feedback(8);
    }
    const headY = phoenixFlight(phoenix, timestamp).y;
    const lastReachedRow = Math.min(phoenix.endRow,
      Math.floor((headY - run.blockRowOrigin - run.cellSize * .5) / run.cellSize));
    for (let row = phoenix.nextRow; row <= lastReachedRow; row += 1) {
      for (const block of run.blocksByRow?.get(row) || []) {
        if (block.y >= phoenix.launchY) igniteBlock(block, timestamp, true);
      }
      phoenix.nextRow = row + 1;
    }
    if (age >= phoenix.duration) run.phoenixUltimate = null;
  }

  function updateBurningBlocks(timestamp) {
    for (const block of run.burningBlocks || []) {
      if (block.dead || !block.fireDamageAt) { run.burningBlocks.delete(block); continue; }
      while (!block.dead && block.fireDamageAt > 0 && timestamp >= block.fireDamageAt) {
        const tickAt = block.fireDamageAt;
        block.fireDamageAt = 0;
        damageBlockByElement(block, 1, block.fireFromPhoenix ? 'fireUltimate' : 'fire', timestamp);
        if (block.fireBurnsThrough && elementalDamageable(block)) {
          block.fireDamageAt = tickAt + (block.hp <= 1 ? FIRE_FINAL_BURN_MS : block.fireIntervalMs);
          block.fireFlashUntil = Math.max(block.fireFlashUntil, block.fireDamageAt + 190);
        }
      }
      if (block.dead || !block.fireDamageAt) run.burningBlocks.delete(block);
    }
  }

  function damageBlockByElement(block, amount, cause, timestamp = performance.now()) {
    if (block?.hazard && !block.dead && ((cause === 'mech' && !elementalDamageable(block)) || cause === 'cosmosUltimate' || cause === 'phantomExpress')) {
      block.hp = 0;
      return destroyBlock(block, cause, timestamp);
    }
    if (!elementalDamageable(block)) return false;
    if (block.sporePod && cause !== 'sporeExplosion') detonateSporePod(block.sporePod, timestamp);
    if (block.dead) return false;
    const phantomBlast = cause === 'phantomBurst' || cause === 'phantomUltimateBurst';
    const fireTick = cause === 'fire' || cause === 'fireUltimate';
    const damage = Math.max(0, block.phantomMarked && amount > 0 && !phantomBlast && !fireTick ? Math.max(2,amount) : amount);
    if (cause !== 'glitchEcho') shareGlitchHit(block, damage, timestamp);
    block.hp = Math.max(0, block.hp - damage);
    if (cause === 'electric' || cause === 'electricStorm') {
      recordMutationAction('electric', block);
      block.electricFlashStartedAt = timestamp;
      block.electricFlashUntil = timestamp + 400;
      block.electricShockPower = cause === 'electricStorm' ? 1.45 : 1;
      if (block.hp === 0) {
        const { x, y } = blockCenter(block);
        pushElementalEffect('electricShock', x, y, { width: block.w, height: block.h,
          seed: block.col * 1.7 + block.row * .4, power: block.electricShockPower, life: .40, maxLife: .40 });
      }
    }
    if (block.hp > 0) {
      if (!fireTick) createDebris(block, 2, false);
      return false;
    }
    block.hp = 0;
    destroyBlock(block, cause, timestamp);
    return Boolean(block.dead);
  }

  function pickElectricNeighbour(source, excluded = null, minRow = -Infinity) {
    const candidates = nearbyGridBlocks(source, block =>
      block !== excluded && block.row >= minRow && elementalDamageable(block));
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function electricArc(from, to, timestamp, { grow = 38, life = 205, power = 1 } = {}) {
    run.electricStormBolts.push({ from, to, startedAt: timestamp, until: timestamp + life,
      grow, power, seed: Math.random() * 10000, trunk: false });
  }

  function electricDashPhasesThrough(block) {
    return !block.hazard && !block.special && !block.sporePod && elementalDamageable(block);
  }

  function strikeElectricBlock(origin, primary, timestamp, excluded = null, minRow = -Infinity) {
    const branch = elementalLevel('electric') >= 2 ? pickElectricNeighbour(primary, excluded, minRow) : null;
    const point = blockCenter(primary);
    electricArc(origin, point, timestamp);
    run.electricStormHits.push({ block: primary, at: timestamp + 35, damage: 1 });
    if (!branch) return 1;
    electricArc(point, blockCenter(branch), timestamp + 33);
    run.electricStormHits.push({ block: branch, at: timestamp + 71, damage: 1 });
    return 2;
  }

  function finishElectricDash(timestamp, interrupted = false) {
    const dash = run.electricDash;
    if (!dash || dash.endedAt != null) return;
    dash.endedAt = timestamp;
    const { x, y, radius } = run.slime;
    const origin = { x, y };
    if (!interrupted) {
      run.slime.vx *= .24;
      run.slime.vy = Math.min(run.slime.vy, normalFallSpeedLimit() * .55);
    }
    const reach = run.cellSize * 1.18;
    const rayCount = 5;
    const turn = Math.PI * 2;
    const angleStep = turn / rayCount;
    const rotation = Math.random() * turn;
    const targets = Array(rayCount).fill(null);
    const nearby = blocksNearY(y, Math.max(reach, radius));
    for (const block of nearby) {
      if (elementalDamageable(block) && circleRectCollision(origin, block, radius)) {
        damageBlockByElement(block, block.hp, 'electric', timestamp);
      }
    }
    for (const block of nearby) {
      if (!elementalDamageable(block)) continue;
      const point = blockCenter(block);
      const distance = Math.hypot(point.x - origin.x, point.y - origin.y);
      if (distance > reach) continue;
      const angle = (Math.atan2(point.y - y, point.x - x) - rotation + turn * 2) % turn;
      const ray = Math.round(angle / angleStep) % rayCount;
      if (!targets[ray] || distance < targets[ray].distance) targets[ray] = { block, point, distance };
    }
    for (const [i, target] of targets.entries()) {
      const angle = rotation + i * angleStep + rand(-.19, .19);
      const length = target?.distance ?? reach * rand(.66, 1.05);
      const point = target?.point ?? { x: x + Math.cos(angle) * length, y: y + Math.sin(angle) * length };
      const grow = 38 + length / reach * 54;
      electricArc(origin, point, timestamp, { grow, life: grow + 170, power: target ? 1.65 : 1.21 });
      if (target) run.electricStormHits.push({ block: target.block, at: timestamp + grow, damage: 1 });
    }
    pushElementalEffect('electricDashBurst', x, y, { life: .31, maxLife: .31 });
    run.shake = Math.max(run.shake, 5.4);
    sound('electricDischarge');
    feedback([12, 15, 8]);
  }

  function electricStormZone(storm, index) {
    const { cellSize, columns, gridOffsetX, blockRowOrigin } = run;
    const left = (index % 2 === 0) === storm.leftFirst;
    const col = left ? 1 : columns - 2;
    // Two offset zones per band keep all six impacts inside ten rows.
    const row = storm.firstRow + 1 + Math.floor(index / 2) * 3 + index % 2;
    const blocks = [];
    for (let r = row - 1; r <= row + 1; r += 1) {
      for (const block of run.blocksByRow.get(r) || []) {
        if (Math.abs(block.col - col) <= 1 && elementalDamageable(block)) blocks.push(block);
      }
    }
    const point = { x: gridOffsetX + (col + .5) * cellSize, y: blockRowOrigin + (row + .5) * cellSize };
    const center = blocks.find(block => block.col === col && block.row === row);
    return { point, blocks, center, row, col };
  }

  function spawnElectricIncineration(block) {
    if (block.y + block.h < run.cameraY - 100 || block.y > run.cameraY + VIEW_H + 100) return;
    const center = blockCenter(block);
    const particleCount = takeDecorativeParticles(scaledEffectCount(20, 6));
    for (let index = 0; index < particleCount; index += 1) {
      const angle = index * Math.PI * 2 / particleCount + rand(-.18, .18);
      const smoke = index % 3 === 0;
      const life = smoke ? rand(.58, .9) : rand(.32, .57);
      run.particles.push({
        kind: 'special', shape: smoke ? 'smoke' : 'streak',
        x: center.x + rand(-7, 7), y: center.y + rand(-7, 7),
        vx: Math.cos(angle) * rand(45, 155),
        vy: Math.sin(angle) * rand(45, 155) - (smoke ? 55 : 0),
        life, maxLife: life, size: smoke ? rand(8, 15) : rand(3, 6),
        color: smoke ? '#353c47' : index % 2 ? '#eaffff' : '#58dcff'
      });
    }
    trimParticles(180);
  }

  function launchElectricStormStrike(storm, zone, timestamp) {
    const { point, blocks, center } = zone;
    const impactAt = timestamp + ELECTRIC_STORM_BOLT_MS;
    storm.impactAt = impactAt;
    storm.impactPoint = point;
    storm.impactPending = true;
    run.electricStormBolts.push({
      from: { x: point.x, y: -32 }, to: point, fromScreen: true,
      startedAt: timestamp, until: timestamp + 326, grow: ELECTRIC_STORM_BOLT_MS,
      seed: Math.random() * 10000, trunk: true, power: 3.8
    });
    if (center) run.electricStormHits.push({ block: center, at: impactAt, storm: true, center: true });
    for (const block of blocks) {
      if (block === center) continue;
      const to = blockCenter(block);
      const distance = Math.hypot(to.x - point.x, to.y - point.y) / run.cellSize;
      const travel = 36 + distance * 28;
      electricArc(point, to, impactAt + 10, { grow: travel, life: 200 + travel, power: 1.37 });
      run.electricStormHits.push({ block, at: impactAt + 10 + travel, storm: true, damage: 2 });
    }
  }

  function updateElectricStorm(timestamp) {
    const storm = run.electricStorm;
    if (!storm || storm.endedAt) return;
    if (storm.impactPending && timestamp >= storm.impactAt) {
      storm.impactPending = false;
      const cue = storm.strikes === storm.strikeLimit ? 'thunderFinale' : 'thunderStrike';
      startRunUltimateCue(cue, timestamp, timestamp - storm.impactAt);
      feedback([17, 21, 13]);
    }
    if (storm.strikes >= storm.strikeLimit) return;
    if (!storm.warning && timestamp >= storm.nextStrikeAt - ELECTRIC_STORM_WARNING_MS) {
      storm.warning = electricStormZone(storm, storm.strikes);
      playUltimateCue('thunderWarning', timestamp - storm.nextStrikeAt + ELECTRIC_STORM_WARNING_MS);
    }
    if (timestamp < storm.nextStrikeAt) return;
    launchElectricStormStrike(storm, storm.warning, timestamp);
    storm.strikes += 1;
    storm.warning = null;
    storm.nextStrikeAt = timestamp + ELECTRIC_STORM_CADENCE_MS;
    const remaining = storm.strikeLimit - storm.strikes;
    run.elementalAbilityUntil = Math.max(run.elementalAbilityUntil, timestamp + remaining * ELECTRIC_STORM_CADENCE_MS + 530);
  }

  function electricStormCharge(storm, timestamp) {
    const rise = smoothFireVisual((timestamp - storm.startedAt) / (storm.chargeMs * .83));
    return storm.endedAt ? rise * (1 - smoothFireVisual((timestamp - storm.endedAt) / 540)) : rise;
  }

  function electricStormCamera(storm, timestamp) {
    const charge = electricStormCharge(storm, timestamp);
    const age = timestamp - (storm.impactAt ?? -Infinity);
    const warning = storm.warning ? electricStormWarning(storm, timestamp) : 0;
    const followImpact = storm.impactPoint && age < ELECTRIC_STORM_CADENCE_MS
      ? 1 - smoothFireVisual((age - 110) / 505) : 0;
    const warningPoint = storm.warning?.point;
    const point = warningPoint && storm.impactPoint && followImpact > 0
      ? {
        x: lerp(storm.impactPoint.x, warningPoint.x, warning / (warning + followImpact)),
        y: lerp(storm.impactPoint.y, warningPoint.y, warning / (warning + followImpact))
      }
      : warningPoint || (followImpact > 0 ? storm.impactPoint : run.slime);
    return { point, focus: Math.max(warning, followImpact), charge };
  }

  function electricStormWarning(storm, timestamp) {
    return smoothFireVisual(1 + (timestamp - storm.nextStrikeAt) / ELECTRIC_STORM_WARNING_MS);
  }

  function dischargeFromImpact(source, timestamp) {
    if (!elementalDamageable(source) || timestamp - (run.electricImpactAt ?? -Infinity) < ELECTRIC_IMPACT_WINDOW_MS) return 0;
    const primary = pickElectricNeighbour(source, null, source.row);
    if (!primary) return 0;
    run.electricImpactAt = timestamp;
    return strikeElectricBlock(blockCenter(source), primary, timestamp, source, source.row);
  }

  function updateElementalEffects(timestamp = performance.now()) {
    if (!run || run.ended) return;

    if (run.mechSuit?.phase === 'active' && timestamp >= run.mechSuit.expireAt) finishMechSuit(timestamp);
    updateShieldLifetime(timestamp);

    if (run.electricStorm?.endedAt && timestamp - run.electricStorm.endedAt >= ELECTRIC_STORM_EXIT_MS) {
      run.electricStorm = null;
    }
    run.electricStormBolts = (run.electricStormBolts || []).filter(bolt => timestamp < bolt.until);
    run.electricStormHits = (run.electricStormHits || []).filter(hit => {
      if (timestamp < hit.at) return true;
      if (!elementalDamageable(hit.block)) return false;
      const damage = hit.center ? hit.block.hp : hit.damage;
      if (hit.center) spawnElectricIncineration(hit.block);
      damageBlockByElement(hit.block, damage, hit.storm ? 'electricStorm' : 'electric', timestamp);
      return false;
    });

    ELEMENTAL_ULTIMATES.update(run, timestamp, stagedUltimateServices);
    SPORE_COLOSSUS.update(run, timestamp, sporeColossusServices);
    COSMOS_ULTIMATES.update(run, timestamp, cosmosUltimateServices);
    updatePsionicBarrier(timestamp);
    updateFrostStorm(timestamp);
    updateNanoDrones(timestamp);
    updatePhantomCompanions(timestamp);
    updateTelekinesisPress(timestamp);
    updateTelekinesis(timestamp);
    updateCloningUltimate(timestamp);
    updateSpores(timestamp);

    updateBurningBlocks(timestamp);
    updateFrostFlake(timestamp);

    const active = run.elementalAbilityActive;
    if (!active) return;
    if (active === 'fire' && run.ultimateStage >= 3) updatePhoenixUltimate(timestamp);
    if (active === 'electric' && run.ultimateStage >= 3) updateElectricStorm(timestamp);
    if (timestamp >= run.elementalAbilityUntil) {
      run.elementalAbilityActive = '';
      run.elementalAbilityNextTickAt = 0;
      run.stagedUltimate = null;
      run.giantMushroom = null;
      run.sporePop = null;
      run.cosmosStagedUltimate = null;
      if(active === 'telekinesis')run.psionicBarrier=null;
      if (active === 'cosmos') run.cosmosUltimate = null;
      if (active === 'electric' && run.electricStorm && !run.electricStorm.endedAt) {
        run.electricStorm.endedAt = timestamp;
      }
      if (active === 'mass') resetMassPierce();
      return;
    }
    if (active === 'nano') return;
    if (timestamp < run.elementalAbilityNextTickAt) return;

    const center = { x: run.slime.x, y: run.slime.y };
    if (active === 'frost') {
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
    } else if (active === 'electric') {
      run.elementalAbilityNextTickAt = timestamp + 90;
    } else if (active === 'fire') {
      run.elementalAbilityNextTickAt = timestamp + 75;
    } else if (active === 'cosmos') {
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
    } else if (active === 'telekinesis') {
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
    } else if (active === 'phantom') {
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
    } else if (active === 'mass') {
      run.slime.vy = Math.max(390, run.slime.vy);
      run.slime.vx *= .92;
      run.massPierceTriggered = true;
      run.elementalAbilityNextTickAt = timestamp + 50;
    } else if (active === 'mobility') {
      run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, run.elementalAbilityUntil);
      run.elementalAbilityNextTickAt = timestamp + 90;
    } else {
      run.elementalAbilityNextTickAt = timestamp + 180;
    }
  }

  function applyBreakResistance(block, timestamp) {
    if (block.elementalSnow) return;
    const snowflake = Boolean(block.elementalSnowflake);
    const fragile = block.tier === 'dense' || block.tier === 'soft';
    const factor = snowflake ? BALANCE.snowflakeBreakDrag
      : fragile ? (block.tier === 'soft' ? BALANCE.weakBreakDrag : BALANCE.fragileBreakDrag)
        : BALANCE.denseBreakDrag * (BLOCK_TIERS[block.tier]?.drag || .95);
    // Touching two neighboring blocks is one impact, not two full speed losses.
    const sameImpact = timestamp - (run.breakImpactAt ?? -Infinity) < 70;
    const previous = sameImpact ? run.breakImpactFactor : 1;
    if (factor < previous) {
      run.slime.vy *= factor / previous;
      run.slime.vx *= sameImpact ? 1 : .96;
      run.breakImpactFactor = factor;
    } else if (!sameImpact) run.breakImpactFactor = factor;
    if (!sameImpact) run.breakImpactAt = timestamp;
  }

  function pressThroughRock(block, collision, timestamp, hpBefore, falling) {
    const fragile = block.tier === 'soft' || block.tier === 'dense';
    block.rockBreakPose = {
      at: timestamp, duration: fragile ? 60 : 83,
      nx: collision.nx, ny: collision.ny, hpRatio: hpBefore / block.maxHp
    };
    if (!falling) return;
    // Cap the actual downward velocity immediately. Dense pockets take longer
    // to push through, but a second tile cannot multiply the velocity loss.
    const speedLimit = Math.max(.7 * run.slime.vy, normalFallSpeedLimit() * (fragile ? .85 : .69));
    run.slime.vy = Math.min(run.slime.vy, speedLimit);
    spendFallMomentum(run, 1);
  }

  function resolveBlockHit(block,collision,timestamp=performance.now()){
    const chill=block.ice?.kind==='iceBlock'&&!block.dead&&!block.frozen&&!block.elementalSnow&&!block.elementalSnowflake
      &&!waterHazardImmune(timestamp)&&!(run.barrier>0);
    const bounced=resolveBlockHitBody(block,collision,timestamp);
    if(chill)window.SlimeIceHazards.addFrost(run);
    return bounced;
  }

  function resolveBlockHitBody(block, collision, timestamp = performance.now()) {
    if(run.evacuation)return false;
    if(block.fungi?.kind==='spore'&&window.SlimeFungiHazards.detonate(run,block,{
      destroy:b=>destroyBlock(b,'fungiContact',timestamp),poison:(x,y)=>applyFungiPoison(x,y,timestamp)
    }))return false;
    if(block.water?.kind==='vortex')return false;
    if(block.water?.kind==='seaMine'){detonateWaterMine(block,timestamp);return false;}
    const s = run.slime;
    const drillActive = speedDrillActive(timestamp);
    if (block.glitchNeutralized && block.hazard) return transformGlitchHazard(block, collision, timestamp);
    if (block.sporePod) detonateSporePod(block.sporePod, timestamp);
    if (block.dead) return false;

    const fireLevel = elementalLevel('fire');
    const electricLevel = elementalLevel('electric');
    if (fireLevel >= 1) igniteBlock(block, timestamp);
    if (electricLevel >= 1 && run.electricDash?.endedAt !== null) dischargeFromImpact(block, timestamp);
    if (block.dead) {
      if (!drillActive) applyBreakResistance(block, timestamp);
      return false;
    }

    if (block.hazard&&!block.tech&&!block.breakableHazard) {
      return resolveHazardHit(block, collision, timestamp);
    }
    if (mechSuitActive()) {
      stabilizeSlimeContact(s, collision);
      s.vy = Math.max(0, s.vy);
      return true;
    }
    if (block.special === 'pandora') {
      return activatePandoraBox(block, timestamp);
    }
    if (block.special === 'jelly' && !drillActive) return activateJellyBounce(block, collision, timestamp);
    if (block.special === 'geyser' && !drillActive) return activateGeyser(block, timestamp);
    if (block.special === 'spring' && !drillActive) return activateSpring(block, collision, timestamp);
    const frozenSlime = isSlimeFrozen(timestamp);
    const gravityDirection = 1;
    const isFalling = s.vy * gravityDirection > 0;
    const impactSpeed = Math.max(70, Math.hypot(s.vx, s.vy * (isFalling ? run.fallSpeedScale ?? 1 : 1)));
    const unbreakable = Boolean(block.unbreakable);
    let damage = block.phantomMarked ? 2 : 1;
    if (block.elementalSnow) {
      if (destroyBlock(block, 'snowPass', timestamp)) sound('snow');
      return false;
    }
    prepareMassPierce(impactSpeed, isFalling);
    const frostContact = elementalLevel('frost') >= 1 && ['hard', 'ore', 'reinforced'].includes(block.tier)
      && !block.elementalSnowflake && frostFreezable(block);
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
    const hpBefore = block.hp;
    const breaksOnTouch = ['bomb', 'gel', 'cryo', 'meteor'].includes(block.special);
    if (breaksOnTouch && !unbreakable) damage = hpBefore;
    const geyserPiercing = !unbreakable && run.geyserBreaksLeft > 0 && block.special !== 'geyser';
    if (geyserPiercing) damage = hpBefore;
    const massPiercing = massPiercesBlock(block, timestamp);
    if (massPiercing) damage = hpBefore;
    const speedBurstPiercing = speedBurstPiercesBlock(block, isFalling, timestamp);
    if (speedBurstPiercing) damage = hpBefore;
    const drillPiercing = drillActive && !unbreakable;
    if (drillPiercing) damage = hpBefore;
    const piercing = geyserPiercing || massPiercing || speedBurstPiercing || drillPiercing;
    const rockContact = !block.hazard && !block.special && !piercing && !frozenSlime;
    const ramDamage = rockContact ? ramDamageForRock(block, run, normalFallSpeedLimit()) : 0;
    if (rockContact) {
      run.rockContactAt = timestamp;
      const breaking = !frostContact && damage >= hpBefore && !unbreakable;
      const weight = clamp((impactSpeed - 95) / 265, 0, 1);
      run.rockContactPower = ramDamage >= 3 ? 1 : ramDamage ? .77 : (breaking ? .46 : .50) + weight * .30;
      run.rockContactBroken = breaking || (!frostContact && ramDamage >= hpBefore);
      run.rockContactSide = Math.abs(collision.nx) > Math.abs(collision.ny);
    }
    if (ramDamage) {
      damage = Math.max(damage, ramDamage);
      createRockContactEffect(block, collision, ramDamage);
      spendFallMomentum(run, ramDamage, !frostContact && damage >= hpBefore);
    }
    shareGlitchHit(block, damage, timestamp);
    const destroysImmediately = !frostContact && !unbreakable && (breaksOnTouch || piercing || damage >= hpBefore);
    if (!frozenSlime) {run.healthFlash=1;run.healthFlashTime=.22;}
    run.shake = Math.max(run.shake, clamp(impactSpeed / 165, 1.0, destroysImmediately ? 3.8 : 5.8));
    if (!frozenSlime) {
      run.emotion = destroysImmediately ? 'impact' : 'focused';
      run.emotionUntil = timestamp + 260;
    }

    if (destroysImmediately) {
      const pressBreak = rockContact && !ramDamage && !block.elementalSnow && !block.elementalSnowflake;
      const slowThroughBreak = hpBefore <= 1 && isFalling && !piercing && !block.special && !block.hazard
        && !block.elementalSnow && !block.elementalSnowflake;
      if (pressBreak) pressThroughRock(block, collision, timestamp, hpBefore, isFalling);
      block.hp = 0;
      const destroyed = destroyBlock(block, 'impact', timestamp);
      if (geyserPiercing) run.geyserBreaksLeft = Math.max(0, run.geyserBreaksLeft - 1);
      const speedBurstBlocksLeft = speedBurstPiercing ? consumeSpeedBurstBlock(timestamp) : -1;
      if (slowThroughBreak && !pressBreak && !ramDamage) {
        spendFallMomentum(run, 1);
      } else if (!pressBreak && !ramDamage && !drillPiercing && !speedBurstPiercing) {
        if (massPiercing) {
          s.vy = s.vy > 0 ? Math.max(310, s.vy * .94) : s.vy * .94;
          s.vx *= .95;
        } else applyBreakResistance(block, timestamp);
      }
      let keep = block.tier === 'soft' ? BALANCE.flightKeepSoft : block.tier === 'dense' || block.tier === 'special' || block.tier === 'ore' ? BALANCE.flightKeepDense : BALANCE.flightKeepHard;
      run.flightDistance *= keep;

      if (speedBurstPiercing) impact(speedBurstBlocksLeft > 0 ? `БУР-РЫВОК · ЕЩЁ ${speedBurstBlocksLeft}` : 'БУР-РЫВОК');
      else if (!block.special) impact(ramDamage ? 'ТАРАН' : 'ПРОБОЙ');
      if (destroyed) {
        sound(block.special === 'coin' ? 'coin' : block.special || block.hazard ? 'break' : terrainBreakSound(block));
      }
      if (ramDamage) {
        run.shake = Math.max(run.shake, menuReducedMotion ? 2 : 3.8 + ramDamage * 1.3);
        if (ramDamage === 3) feedback([9, 14, 8]);
      } else if (pressBreak && hpBefore && timestamp - (run.rockFeedbackAt ?? -Infinity) >= 115) {
        run.rockFeedbackAt = timestamp;
        feedback(block.maxHp <= 1 ? 4 : 8);
      }
      if (run.energy <= 0) endRun(false, 'Сила закончилась');
      return false;
    }

    preserveCombo(timestamp);
    if (!unbreakable) block.hp = Math.max(.05, block.hp - damage);
    const sustainedHit = damage > 0;
    if (sustainedHit) {
      block.visualCrackAt = timestamp;
      block.rockImpactNormalX = collision.nx;
      block.rockImpactNormalY = collision.ny;
      block.rockImpactPower = clamp((impactSpeed - 80) / 425, .42, 1);
      if (!ramDamage) createRockContactEffect(block, collision);
      if (timestamp - (run.rockFeedbackAt ?? -Infinity) >= 115) {
        run.rockFeedbackAt = timestamp;
        feedback(block.maxHp >= 3 ? 11 : 7);
      }
    }
    if (frozenSlime) {
      slideFrozenSlime(block, collision, timestamp);
      createDebris(block, 3, false);
      if (frostContact) turnBlockToSnow(block, timestamp);
      return true;
    }
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    s.x += collision.nx * (collision.penetration + (unbreakable ? 6 : 4));
    s.y += collision.ny * (collision.penetration + (unbreakable ? 6 : 4));
    applyBlockBounce(s, collision, { hazard: unbreakable, timestamp, rock: rockContact && !unbreakable });
    run.flightDistance = 0;

    const frozeOnContact = frostContact && turnBlockToSnow(block, timestamp);
    const hitsLeft = Math.max(1, Math.ceil(block.hp));
    const hitsLabel = hitsLeft === 1 ? 'ЕЩЁ 1 УДАР' : `ЕЩЁ ${hitsLeft} УДАРА`;
    impact(frozeOnContact
      ? 'БЛОК ЗАМОРОЖЕН'
      : goldTransformed
      ? 'БЛОК СТАЛ ЗОЛОТЫМ · ЕЩЁ 1 УДАР'
      : block.special === 'spring'
      ? 'ПРУЖИНА'
      : block.special === 'boss'
        ? `СТРАЖ НЕДР · ${hitsLabel}`
        : unbreakable
          ? 'БЛОК НЕ ПОДДАЁТСЯ'
          : `БЛОК ТРЕСНУЛ · ${hitsLabel}`);
    sound(block.special === 'spring' ? 'bounce' : block.hazard || block.special === 'boss' ? 'hitHard' : terrainContactSound(block));
    if (!sustainedHit) createDebris(block, 3, false);
    if (run.energy <= 0) endRun(false, 'Сила закончилась');
    return true;
  }

  function activatePandoraBox(block, timestamp = performance.now()) {
    if (!block || block.dead || block.pandoraOpened) return false;
    block.pandoraOpened = true;
    block.dead = true;
    const choices = ['meteor', 'bomb', 'heal']
      .filter(type => type !== 'heal' || run.energy < run.maxEnergy);
    const effect = choices[Math.floor(Math.random() * choices.length)] || 'meteor';
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
      run.barrierStartedAt = timestamp;
      applyDominantShieldReaction(shieldReactionSource(), timestamp);
      run.barrierFlashUntil = timestamp + 900;
      spawnSpecialBurst('shieldBurst', run.slime.x, run.slime.y);
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

  function preserveCombo(timestamp = performance.now()) {
    // Combo progression was removed from the first-world rules.
  }

  function resetCombo() {
    // Kept as a harmless hook for collision and endless-lap resets.
  }

  function destroyBlock(block, cause = 'impact', timestamp = performance.now()) {
    if (!block || block.dead) return;
    if (typeof cause !== 'string') cause = 'impact';
    const glitchRemoval = cause === 'glitchDelete' || (block.glitchNeutralized && (cause === 'glitchNeutralize' || cause === 'glitchHack'));
    // Only explicit ultimate removal or disarmed contact can bypass spike protection.
    if (block.hazard && !block.tech && !block.breakableHazard && !glitchRemoval && cause !== 'cosmosUltimate' && cause !== 'mech' && cause !== 'phantomExpress' && cause !== 'psionicBarrier'
      && cause !== 'telekinesisPress' && cause !== 'infinityPurple') return false;
    if (block.sporePod) {
      if (cause === 'sporeExplosion') {
        recordMutationAction('cloning', block.sporePod);
        block.sporePod.detonated = true;
        block.sporePod = null;
      } else detonateSporePod(block.sporePod, timestamp);
    }
    if (block.dead) return false;
    if (block.glitchInfected && cause !== 'glitchEcho' && cause !== 'telekinesisPress' && cause !== 'glitchDelete') {
      shareGlitchHit(block, Math.max(1, block.hp || block.maxHp || 1), timestamp);
      if (block.dead) return false;
    }
    if (glitchRemoval && block.hazard) recordMutationAction('glitch', block);
    const wasGolden = blockIsGolden(block, timestamp);
    const wasSnowflake = Boolean(block.elementalSnowflake);
    const glitchBreak = block.glitchInfected || block.glitchHitUntil > timestamp || cause === 'glitchEcho';
    block.dead = true;
    run.phantomMarkedBlocks?.delete(block);
    run.blocksDestroyed+=window.SlimeBrambleObstacles.collapse(run,block,timestamp);
    run.glitchInfectedBlocks?.delete(block);
    block.glitchInfected = false;
    run.blocksDestroyed += 1;
    if (!block.hazard) recordMutationAction('cosmos', block);
    if (['nano', 'nanoDisintegrate', 'mech'].includes(cause)) recordMutationAction('nano', block);
    if (['telekinesisLift', 'telekinesisStorm'].includes(cause)) recordMutationAction('telekinesis', block);
    if (cause === 'infinityBlue' || cause === 'infinityRed' || cause === 'infinityPurple') recordMutationAction('infinity', block);
    if (['phantomSpirit', 'phantomSalvo', 'phantomRealm', 'phantomBurst', 'phantomUltimateBurst'].includes(cause)) recordMutationAction('phantom', block);
    awardRunExperience(block);
    registerBrokenBlock(block, cause === 'telekinesisPress' ? run.telekinesisPress?.rewardBatch : null);
    if(block.water?.kind==='seaMine'&&cause!=='waterMine')detonateWaterMine(block,timestamp);
    if (cause === 'telekinesisPress') {
      if (block.special === 'boss') impact('СТРАЖ НЕДР ПОБЕЖДЁН!');
      return true;
    }
    if (cause === 'infinityRed') {
      const center = run.infinity.cast?.x ?? run.slime.x;
      createDebris(block, 5, true, block.x + block.w / 2 < center ? -190 : 190);
    } else if (cause === 'infinityBlue' || cause === 'infinityPurple') {
      createDebris(block, 3, false);
    } else if (cause === 'fire' || cause === 'fireUltimate') {
      createBurnedBlockAsh(block, timestamp);
    } else if (glitchBreak || cause === 'glitchDelete' || cause === 'glitchNeutralize' || cause === 'glitchHack') createGlitchDebris(block, timestamp, !glitchBreak && cause !== 'glitchDelete');
    else if (cause === 'snowPass') createDebris(block, 5, false);
    else if (cause !== 'telekinesisLift' && cause !== 'electricStorm' && cause !== 'nanoDisintegrate') createDebris(block, block.special === 'geyser' ? 0 : ['sporeGiant','telekinesisStorm','psionicBarrier'].includes(cause) ? 3 : cause === 'mech' ? 5 : block.special === 'bomb' ? 8 : 9, true);

    if (block.special === 'coin') {
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

    if (wasGolden && elementalLevel('gold') >= 2 && Math.random() < .35) {
      throwGoldCoin(block, timestamp);
    }
    return true;
  }

  function registerBrokenBlock(block, rewardBatch = null) {
    if(run&&block?.dead)run.blocksDestroyed+=window.SlimeBrambleObstacles.collapse(run,block,performance.now());
    if (block?.dead && !block.hazard) recordMutationAction('cosmos', block);
    awardRunExperience(block);
    if ((run?.embeddedVeins || run?.worldId === 2 || block?.glitchReward) && block?.flaskTier && !block.flaskGranted) {
      block.flaskGranted = true;
      const value = block.flaskValue || FLASK_VALUES[block.flaskTier] || 0;
      const visible=block.y + block.h >= run.cameraY - 100 && block.y <= run.cameraY + VIEW_H + 100;
      if(rewardBatch){
        rewardBatch.value += value;
        if (visible) rewardBatch.largestVisibleVein = Math.max(rewardBatch.largestVisibleVein || 0, value);
        rewardBatch.visible ||= visible;
      }else{
        awardFlaskData(value);
        if (visible) sound('crystal', { value });
      }
      if (!rewardBatch && visible) {
        const density = effectDensity();
        const count = takeDecorativeParticles(Math.max(5, Math.round((10 + (block.flaskTier || 1) * 2) * density)), true);
        const essence=window.SlimeBlockBreakFeedback.emitEssence(block,value,density,count);
        run.particles.push(...essence.particles);
        appendTransientEffect(essence.impact, 36, isMobileDevice() ? 6 : 10);
      }
    }
    // No automatic refill for breaking ordinary rocks: only discrete energy pickups.
  }

  function awardRunExperience(block) {
    // Legacy call sites remain harmless; development counts mutation actions.
  }

  function awardFlaskData(value) {
    if (!run) return 0;
    const amount = Math.max(0, Math.round(value || 0));
    if (!amount) return 0;
    run.researchData += amount;
    save.researchUnits += amount;
    run.researchPendingGain = (run.researchPendingGain || 0) + amount;
    if (!run.researchHudFrame) {
      const currentRun = run;
      run.researchHudFrame = requestAnimationFrame(() => flushRunResearchAwards(currentRun));
    }
    return amount;
  }

  function flushRunResearchAwards(currentRun = run) {
    if (!currentRun) return;
    if (currentRun.researchHudFrame) cancelAnimationFrame(currentRun.researchHudFrame);
    currentRun.researchHudFrame = 0;
    const amount = currentRun.researchPendingGain || 0;
    if (!amount) return;
    currentRun.researchPendingGain = 0;
    persist({ refreshUI: false });
    if (run !== currentRun || currentRun.ended) return;
    if (els.runResearchScore) els.runResearchScore.textContent = currentRun.researchData.toLocaleString('ru-RU');
    if (els.runResearchHud) els.runResearchHud.setAttribute('aria-label', `Осколки за забег: ${currentRun.researchData}`);
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
    const timestamp = performance.now();
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

  function restoreAnomalyEnergy(amount, timestamp = performance.now()) {
    if (!run || run.ended || run.evacuation) return 0;
    const gained = ENERGY.recover(run, amount, timestamp);
    run.healGlowUntil=timestamp+850;run.emotion='joy';run.emotionUntil=timestamp+650;
    if(gained>0)spawnSpecialBurst('heal',run.slime.x,run.slime.y);
    impact(Math.round(gained)>0?`+${Math.round(gained)}% СИЛЫ`:'СИЛА ПОЛНАЯ');
    sound('happy');feedback([7,12,7]);updateRunUI();return gained;
  }

  function healRun(amount) { return restoreAnomalyEnergy(amount); }

  function explodeAt(x, y, radius = 125, rewardScale = .6, damage = Infinity, collectChainBombs = false) {
    let destroyed = 0;
    const chainBombs = [];
    const timestamp = performance.now();
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
    const timestamp = performance.now();
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
    const result = run.sharedDescent
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

  function createBurnedBlockAsh(block, timestamp) {
    if (block.y + block.h < run.cameraY - 90 || block.y > run.cameraY + VIEW_H + 90) return;
    sound('fireAsh');
    const lowDetail = isLowPowerDevice() || menuReducedMotion || graphicsBudget < .75;
    const count = takeDecorativeParticles(lowDetail ? 8 : 14);
    const ash = window.SlimeBlockBreakFeedback.emitAsh(block, count, burnedBlockFace(block, block.y, timestamp));
    run.particles.push(...ash.particles);
    appendTransientEffect(ash.impact, 36, lowDetail ? 7 : 12);
  }

  function createRockContactEffect(block, collision, ramDamage = 0) {
    const { nx, ny } = collision;
    const x = Math.abs(nx) > Math.abs(ny) ? block.x + (nx > 0 ? block.w : 0) : clamp(run.slime.x, block.x, block.x + block.w);
    const y = Math.abs(ny) >= Math.abs(nx) ? block.y + (ny > 0 ? block.h : 0) : clamp(run.slime.y, block.y, block.y + block.h);
    const strong = block.tier === 'reinforced' || block.maxHp >= 3;
    const count = takeDecorativeParticles(ramDamage ? scaledEffectCount(11 + 3 * ramDamage, 8) : scaledEffectCount(strong ? 10 : 8, 5));
    const metal = Boolean(block.tech);
    const color = materialColor(block.material, run.world);
    const contact = window.SlimeBlockBreakFeedback.emitRockContact(block, x, y, collision, count, ramDamage, {
      strong, metal, color, power: block.rockImpactPower
    });
    run.particles.push(...contact.particles);
    appendTransientEffect(contact.impact, 36, ramDamage ? 5 : 7);
  }

  function createDebris(block, count, strong, pushX = 0) {
    if (!count || block.y + block.h < run.cameraY - 90 || block.y > run.cameraY + VIEW_H + 90) return;
    const color = block.elementalSnow||block.elementalSnowflake ? '#bdefff'
      : run.worldId===1 && !block.special && !block.hazard
        ? block.tier==='reinforced'?'#764b9a':block.tier==='hard'||block.tier==='ore'?'#b39bd7':'#8bc74f'
        : materialColor(block.material, run.world, 0);
    const density = effectDensity();
    const desired = Math.min(24, Math.max(strong ? 6 : 2, Math.round(count * (strong ? 2.1 : 1.25) * density)));
    const maxParticles = takeDecorativeParticles(desired);
    const feedback = window.SlimeBlockBreakFeedback.emit(block, {color,count,strong,density,maxParticles});
    if (pushX) for (const particle of feedback.particles) particle.vx += pushX;
    if (strong && block.rockBreakPose) {
      const delay = block.rockBreakPose.duration / 1000;
      for (const particle of feedback.particles) particle.delay = delay;
      if (feedback.impact) feedback.impact.delay = delay;
    }
    run.particles.push(...feedback.particles);
    if (feedback.impact) {
      // Keep burst flashes bounded separately from gameplay effects.
      appendTransientEffect(feedback.impact, 36, isMobileDevice() ? 8 : 12);
      run.shake=Math.max(run.shake,isMobileDevice()?2.3:2.9);
    }
    trimParticles(240);
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
      if (p.delay > 0) { p.delay = Math.max(0, p.delay - dt); continue; }
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
      } else if (p.shape === 'spore') {
        p.wanderPhase += p.wanderRate * dt;
        const drag = Math.exp(-dt * 1.25);
        p.vx *= drag;
        p.vy = (p.vy + p.gravity * dt) * drag;
        p.x += (p.vx + Math.sin(p.wanderPhase) * p.wanderAmplitude) * dt;
        p.y += (p.vy + Math.cos(p.wanderPhase * .83) * p.wanderAmplitude * .36) * dt;
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
    let alive = 0;
    for (const p of run.particles) if (p.life > 0) run.particles[alive++] = p;
    run.particles.length = alive;
  }

  function spawnSpecialBurst(type, x, y, nx = 0, ny = -1, scale = 1) {
    if (!run) return;
    const config = {
      spring: { colors: ['#efffff', '#62efff', '#1ec8ff', '#ffffff'], count: 11, life: .82 },
      bomb: { colors: ['#fff7c7', '#ffd65a', '#ff8a3d', '#f34e56'], count: 20, life: .9 },
      heal: { colors: ['#fff4ed','#ffb0bc','#ff607a','#ffffff'], count: 5, life: 1.05 },
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
    appendTransientEffect({
      type, x, y, nx, ny, scale, life: config.life, maxLife: config.life
    });
    const particleCount = takeDecorativeParticles(scaledEffectCount(Math.max(4, Math.round(config.count * scale)), 4));
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
        vx: (bombSmoke ? rand(-52, 52) : Math.cos(angle) * speed) * scale,
        vy: (bombSmoke ? rand(-88, -34) : Math.sin(angle) * speed) * scale,
        gravity: bombSmoke ? -12 : type === 'bomb' ? 145 : type === 'heal' ? -42 : type === 'jelly' ? 26 : type === 'pandora' ? 40 : type === 'freeze' ? 12 : type === 'geyser' ? -10 : type === 'shieldBurst' ? 12 : 32,
        life: bombSmoke ? rand(.48, .7) : rand(config.life * .66, config.life), maxLife: config.life,
        size: (bombSmoke ? rand(7, 11) : rand(2.5, type === 'bomb' ? 6.2 : 6)) * scale,
        color: bombSmoke ? ['#4f3b46', '#76505a', '#a8675b'][i % 3] : config.colors[i % config.colors.length],
        shape: bombSmoke
          ? 'smoke'
          : type === 'bomb' && i % 3 === 0
            ? 'streak'
          : type === 'heal' && i % 3 === 0
          ? 'orb'
          : type === 'geyser' && i % 4 === 0
            ? 'smoke'
          : type === 'geyser' && i % 3 === 0
            ? 'streak'
          : 'orb'
      });
    }
    trimParticles(240);
  }

  function updateSpecialEffects(dt, timestamp = performance.now()) {
    if (!run?.specialEffects) return;
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
    let alive = 0;
    for (const effect of run.specialEffects) if (effect.life > 0) run.specialEffects[alive++] = effect;
    run.specialEffects.length = alive;
  }

  function playAbilityActivation(stage, button = els.abilityBtn) {
    if (!button?.animate || menuReducedMotion) return;
    const medium = stage === 2;
    button.animate([
      { transform: 'translateY(0) scale(1)', filter: 'brightness(1)' },
      { transform: `translateY(${medium ? 2 : 1}px) scale(${medium ? .92 : .96})`, filter: `brightness(${medium ? 1.8 : 1.3})`, offset: .25 },
      { transform: 'translateY(0) scale(1)', filter: `brightness(${medium ? 1.35 : 1.1})`, offset: .65 },
      { transform: 'translateY(0) scale(1)', filter: 'brightness(1)' }
    ], { duration: medium ? 360 : 190, easing: 'ease-out' });
    const attackIcon = run.elementalAbilityType === 'telekinesis' ? '.fall-attack-psionic' : run.elementalAbilityType === 'frost' ? '.fall-attack-frost'
      : run.elementalAbilityType === 'electric' ? '.fall-attack-electric' : '.fall-attack-fire';
    const icon = button.querySelector(attackIcon) || button.querySelector('img');
    icon?.animate([
      { opacity: 1, clipPath: 'inset(0)', filter: 'brightness(1)' },
      { opacity: 1, clipPath: 'inset(0)', filter: `brightness(${medium ? 2 : 1.35}) drop-shadow(0 0 ${medium ? 12 : 4}px #b9ffff)`, offset: .25 },
      { opacity: 1, clipPath: 'inset(0)', filter: 'brightness(1)' }
    ], { duration: medium ? 430 : 210, easing: 'ease-out' });
  }

  const LEGACY_ABILITY_EMBLEMS = Object.freeze({
    gold: 'assets/ui/recipe-categories/gold-aligned.webp',
    mass: 'assets/ui/recipe-categories/weight-aligned.webp',
    mobility: 'assets/ui/recipe-categories/mobility-aligned.webp'
  });

  function runAbilityEmblem(type) {
    if (type === 'infinity') return versionedAsset(INFINITY.EMBLEM);
    return versionedAsset(RECIPE_FAMILY_ICONS[type === 'frost' ? 'ice' : type] || LEGACY_ABILITY_EMBLEMS[type] || RECIPE_FAMILY_ICONS.fire);
  }

  function startUltimateIntro(type, timestamp) {
    const canvasRect = els.canvas.getBoundingClientRect();
    const buttonRect = els.abilityBtn.getBoundingClientRect();
    const icon = new Image();
    icon.src = runAbilityEmblem(type);
    run.ultimateIntro = {
      type, startedAt: timestamp, duration: type === 'phantom' ? 360 : ULTIMATE_INTRO_MS, icon,
      originX: run.slime.x, originY: run.slime.y,
      fromX: canvasRect.width ? clamp((buttonRect.left + buttonRect.width / 2 - canvasRect.left) * VIEW_W / canvasRect.width, 24, VIEW_W - 24) : VIEW_W * .78,
      fromY: canvasRect.height ? clamp((buttonRect.top + buttonRect.height / 2 - canvasRect.top) * VIEW_H / canvasRect.height, 24, VIEW_H - 24) : VIEW_H * .78,
      color: FORM_INDEX.find(form => form.id === type)?.color || '#82eaff'
    };
    sound('epic');
    feedback([12, 20, 12]);
    updateRunUI();
  }

  function canActivateElementalAbility(timestamp) {
    const type = run?.elementalAbilityType;
    if (!type || !ELEMENTAL_ABILITY_DURATION_MS[type] || run.ended || run.paused || run.coreEncounter
      || run.evacuation || run.portalEntry || run.portalTransitioning || run.ultimateIntro
      || run.glitchChoice || run.mechSuit || window.SlimeIceHazards.locked(run)) return false;
    if (type === 'telekinesis' && (run.ultimateStage < 3 || run.psionicShot)) return false;
    if (type === 'nano' && (run.ultimateStage < 3 || run.nanoBurst)) return false;
    if (type === 'fire') return run.ultimateStage === 3 && !run.elementalAbilityActive
      && !run.fireFlash && (adminInfiniteUltimate || phoenixCharge(run) >= 1);
    if (type === 'frost' && (run.ultimateStage < 3 || run.frostFlake || run.frostStorm)) return false;
    if (type === 'electric' && (run.ultimateStage < 3 || run.electricDash?.endedAt === null || run.electricStorm)) return false;
    if (type === 'infinity' && (run.infinity.stage < 3 || run.infinity.cast || run.infinity.shieldStopUntil > timestamp)) return false;
    return adminInfiniteUltimate || (!run.elementalAbilityActive
      && ULTIMATE_COOLDOWN.remaining(run, timestamp) === 0 && run.energy >= ULTIMATE_COOLDOWN.CONFIG.strengthCost);
  }

  function phoenixCharge(currentRun) {
    const depth = currentRun.maxDepth - (currentRun.phoenixChargedFromDepth || 0);
    return clamp(depth / (currentRun.world.targetDepth / 3), 0, 1);
  }

  function activeAttackReadyAt(currentRun) {
    if (adminInfiniteUltimate) return 0;
    switch (currentRun?.elementalAbilityType) {
      case 'telekinesis': return currentRun.psionicReadyAt || 0;
      case 'nano': return currentRun.nanoBurstReadyAt || 0;
      case 'fire': return currentRun.fireFlashReadyAt || 0;
      case 'electric': return currentRun.electricDashReadyAt || 0;
      case 'frost': return currentRun.frostFlakeReadyAt || 0;
      case 'infinity': return currentRun.infinity.readyAt;
      default: return 0;
    }
  }

  function canCastActiveAttack(timestamp) {
    const type = run?.elementalAbilityType;
    if (!fallControlsAvailable() || run.ultimateIntro || timestamp < activeAttackReadyAt(run) || window.SlimeIceHazards.locked(run)) return false;
    if (type === 'telekinesis') return !run.psionicShot && !run.elementalAbilityActive;
    if (type === 'nano') return !run.nanoBurst && !run.mechSuit;
    if (type === 'fire') return !run.fireFlash && !run.phoenixUltimate;
    if (type === 'electric') return !run.electricDash && !run.electricStorm && !run.geyserCapture && !run.waterGrab;
    if (type === 'infinity') return !run.infinity.cast && timestamp >= run.infinity.shieldStopUntil;
    return type === 'frost' && !run.frostFlake && !run.frostStorm;
  }

  function activateActiveAttack(timestamp = performance.now()) {
    if (!canCastActiveAttack(timestamp)) return false;
    const { x, y, radius } = run.slime;
    if (run.elementalAbilityType === 'telekinesis') {
      if (!startPsionicShot(timestamp)) { impact('НУЖНЫ 4 БЛОКА РЯДОМ'); return false; }
    } else if (run.elementalAbilityType === 'nano') {
      TECHNO_ULTIMATES.startBurst(run, timestamp);
      run.nanoBurstReadyAt = timestamp + ACTIVE_ATTACK_COOLDOWN_MS;
      feedback(7);
    } else if (run.elementalAbilityType === 'infinity') {
      if (!INFINITY.start(run, run.infinity.mode, timestamp, infinityAttackServices.canBreak, {ignoreCooldown:adminInfiniteUltimate})) return false;
      run.infinity.readyAt = timestamp + ACTIVE_ATTACK_COOLDOWN_MS;
    } else if (run.elementalAbilityType === 'fire') {
      ELEMENTAL_ULTIMATES.startFireFlash(run, timestamp, isLowPowerDevice());
      sound('fireWindup');
      run.fireFlashReadyAt = timestamp + ACTIVE_ATTACK_COOLDOWN_MS;
      run.emotion = 'focused';
      run.emotionUntil = timestamp + 360;
    } else if (run.elementalAbilityType === 'electric') {
      ELEMENTAL_ULTIMATES.startElectricDash(run, timestamp, fallSteeringVector().x, VIEW_W, isLowPowerDevice());
      sound('electricDash');
      resetFallMomentum(run);
      run.electricDashReadyAt = timestamp + ACTIVE_ATTACK_COOLDOWN_MS;
      run.emotion = 'focused';
      run.emotionUntil = timestamp + 310;
      run.shake = Math.max(run.shake, 3.3);
      feedback(10);
    } else {
      ensureWorldSprites(2);
      startFrostFlake(x, y + radius * .7, timestamp);
      sound('frostThrow');
      run.frostFlakeReadyAt = timestamp + ACTIVE_ATTACK_COOLDOWN_MS;
      run.emotion = 'focused';
      run.emotionUntil = timestamp + 240;
    }
    playAbilityActivation(1, els.fallAttackBtn);
    if (['telekinesis', 'infinity'].includes(run.elementalAbilityType)) sound('tap');
    if (run.elementalAbilityType === 'fire') feedback(6);
    learnRunAbility();
    updateRunUI();
    return true;
  }

  const infinityAttackServices = {
    canBreak: (block, kind) => !block.dead && (kind === 'purple' || elementalDamageable(block)),
    destroy(block, cause, at) {
      block.hp = 0;
      destroyBlock(block, cause, at);
    },
    cue: startRunUltimateCue,
    impact(kind, final, timestamp, latenessMs) {
      const big = kind === 'purple';
      run.shake = Math.max(run.shake, menuReducedMotion ? 1.5 : big ? (final ? 6 : 3) : 5);
      if (big) startRunUltimateCue(final ? 'infinityTail' : 'infinityLaunch', timestamp, latenessMs);
      else sound('hitHard');
      if (!final) feedback(big ? [15, 22, 28] : [7, 15]);
    }
  };

  function startRunUltimateCue(name, timestamp, latenessMs = 0) {
    run.ultimateAudioCue = { name, startedAt: timestamp - latenessMs };
    playUltimateCue(name, latenessMs);
  }

  function finishRunUltimateAudio() {
    if (!run.ultimateAudioCue) return;
    run.ultimateAudioCue = null;
    stopUltimateAudio();
  }

  function swapInfinityAttack() {
    if (!fallControlsAvailable() || !INFINITY.swap(run.infinity)) return false;
    sound('tap');
    syncFallControls();
    return true;
  }

  function activateElementalAbility(timestamp = performance.now()) {
    if (!canActivateElementalAbility(timestamp)) return false;
    const type = run.elementalAbilityType;
    if (type === 'fire') {
      run.phoenixChargedFromDepth = run.maxDepth;
      commitElementalAbility(type, timestamp, run.slime.x, run.slime.y);
      return true;
    }
    if (type === 'glitch' && run.ultimateProfile?.kind === 'glitchDisarm' && !findGlitchDisarmTarget()) {
      impact('НЕТ КОЛЮЧЕК ВПЕРЕДИ');
      return false;
    }
    if (!adminInfiniteUltimate) {
      ENERGY.change(run, -ULTIMATE_COOLDOWN.CONFIG.strengthCost, 'ability', timestamp);
      ULTIMATE_COOLDOWN.start(run, timestamp);
      if (run.energy <= 0) {
        endRun(false, 'Сила закончилась');
        return true;
      }
    }
    if (type === 'infinity') {
      INFINITY.start(run, 'purple', timestamp, infinityAttackServices.canBreak);
      playAbilityActivation(3);
      startRunUltimateCue('infinityCharge', timestamp);
      updateRunUI();
      return true;
    }
    if (type === 'frost' || type === 'electric') {
      commitElementalAbility(type, timestamp, run.slime.x, run.slime.y);
      return true;
    }
    const stage = run.ultimateStage || run.ultimateProfile?.stage || 3;
    if (stage >= 3) startUltimateIntro(type, timestamp);
    else {
      playAbilityActivation(stage);
      commitElementalAbility(type, timestamp, run.slime.x, run.slime.y);
      sound('tap'); feedback(stage === 1 ? 6 : [7, 12, 7]);
    }
    return true;
  }

  function commitElementalAbility(type, timestamp, originX, originY) {
    const profile = run.ultimateProfile || {};
    const duration = profile.durationMs || ELEMENTAL_ABILITY_DURATION_MS[type];
    run.elementalAbilityDurationMs = duration;
    run.elementalAbilityActive = type;
    run.elementalAbilityUntil = timestamp + duration;
    run.elementalAbilityNextTickAt = timestamp;
    run.elementalAuraId += 1;

    if (type === 'cosmos' && COSMOS_ULTIMATES.start(run, timestamp)) {
      run.cosmosUltimate = null;
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
      impact(profile.name.toUpperCase());
      updateRunUI();
      return true;
    }
    if (type === 'frost') {
      startFrostStorm(timestamp);
      impact('ВЬЮГА');
    } else if (type === 'electric') {
      run.electricStorm = {
        startedAt: timestamp, chargeMs: profile.chargeMs, nextStrikeAt: timestamp + profile.chargeMs,
        strikeLimit: profile.strikes, strikes: 0, warning: null, endedAt: 0,
        firstRow: Math.max(0, Math.floor((originY + run.slime.radius - run.blockRowOrigin) / run.cellSize) + 1),
        leftFirst: originX < run.gridOffsetX + run.columns * run.cellSize / 2
      };
      run.emotion = 'focused';
      run.emotionUntil = timestamp + profile.chargeMs;
      startRunUltimateCue('thunderCharge', timestamp);
      impact('ГРОМОВЕРЖЕЦ');
    } else if (type === 'fire') {
      run.phoenixUltimate = {
        startedAt: timestamp, duration, rows: profile.rows || PHOENIX_FIRE_ROWS,
        arrivalMs: profile.arrivalMs, travelMs: profile.travelMs
      };
      startRunUltimateCue('phoenixSummon', timestamp);
      run.emotion = 'focused';
      run.emotionUntil = timestamp + profile.arrivalMs;
      impact('ФЕНИКС');
    } else if (type === 'cosmos') {
      const chargeUntil = timestamp + COSMOS_ULTIMATE_CHARGE_MS;
      run.cosmosUltimate = {
        startedAt: timestamp, chargeUntil,
        endY:run.slime.y+run.cellSize*(profile.meters ? profile.meters/run.world.targetDepth*run.rowCount : (profile.orbitRows || COSMOS_ULTIMATE_ROWS)),
        invulnerableBefore:run.damageInvulnerableUntil||0,finishedAt:0,
        fadeStartedAt: timestamp + COSMOS_ULTIMATE_FADE_START_MS,
        launchUntil: run.elementalAbilityUntil, fadeUntil: run.elementalAbilityUntil,
        lastSampleAt: timestamp, ignitedAt: 0, trail: []
      };
      run.gravityDirection = 1;
      run.freezeUntil = 0;
      run.shake = Math.max(run.shake, 4);
      impact('КОМЕТНЫЙ ПРОРЫВ');
    } else if (type === 'gold') {
      run.goldRushUntil = run.elementalAbilityUntil;
      pushElementalEffect('coinArc', run.slime.x, run.slime.y, { toX: run.slime.x, toY: run.slime.y + run.cellSize * 1.8 });
      impact('ЗОЛОТАЯ ЛИХОРАДКА · 3с');
    } else if (type === 'cloning') {
      if (profile.kind === 'sporePop') {
        run.cloneUltimate = null;
        ensureSporeSprites();
        SPORE_COLOSSUS.startPop(run, timestamp);
        run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
        impact('СПОРОВОЙ ХЛОПОК');
        updateRunUI();
        return true;
      }
      if (profile.kind === 'giantMushroom') {
        run.cloneUltimate = null;
        SPORE_COLOSSUS.start(run, timestamp, originX, originY);
        run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
        impact('ГРИБНОЙ ВЕЛИКАН');
        updateRunUI();
        return true;
      }
      run.cloneUltimate = { startedAt: timestamp, fired: false, count: profile.sporeCount || 8, x: originX, y: originY };
      run.emotion = 'power';
      run.emotionUntil = timestamp + CLONE_ULTIMATE_BURST_MS;
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
      impact('ГРИБНАЯ ДОРОЖКА');
    } else if (type === 'glitch') {
      run.emotion = 'surprised';
      run.emotionUntil = timestamp + GLITCH_TITLE_MS;
      if (profile.kind === 'glitchDisarm') startGlitchDisarm(timestamp);
      else startGlitchChoice(timestamp);
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
    } else if (type === 'nano') {
      const landAt = timestamp + MECH_LAND_MS;
      const activeMs = profile.mechMs || MECH_ACTIVE_MS;
      const expireAt = landAt + activeMs;
      run.elementalAbilityUntil = expireAt;
      run.mechSuit = {
        phase: 'descending', startedAt: timestamp, landAt, expireAt, activeMs, contacts: new Map()
      };
      run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, landAt + 100);
      run.mechExplosion = null;
      run.nanoShots = [];
      run.nanoBurst = null;
      run.freezeUntil = 0;
      run.slime.vx = 0;
      run.slime.vy = 0;
      sound('machineFill');
      impact('МЕХ-БУРИЛЬЩИК');
    } else if (type === 'telekinesis') {
      run.telekinesisUltimatePending = false;
      run.telekinesisCycle = null;
      run.telekinesisMarks = [];
      run.telekinesisBursts = [];
      if(profile.kind === 'psionicBarrier')startPsionicBarrier(timestamp);
      else if(profile.kind === 'psionicStorm')startTelekinesisCycle(timestamp, elementalLevel('telekinesis'), true);
      else startTelekinesisPress(timestamp, originY);
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
      impact(profile.name || 'ПСИОНИЧЕСКИЙ ПРЕСС');
    } else if (type === 'phantom') {
      if (profile.kind === 'phantomSalvo') startPhantomSalvo(timestamp);
      else if (profile.kind === 'phantomRealm') startPhantomPhase(timestamp);
      else startPhantomExpress(timestamp);
      if (profile.kind !== 'phantomSalvo') run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, run.elementalAbilityUntil);
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
      impact(profile.name?.toUpperCase() || 'ПРИЗРАЧНЫЙ ЭКСПРЕСС');
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
    updateRunUI();
    return true;
  }

  function activateAbility() {
    if (!activateElementalAbility()) return;
    learnRunAbility();
  }

  function learnRunAbility() {
    if (run.tutorialPhase && !save.onboarding.abilityLearned) {
      save.onboarding.abilityLearned = true;
      persist({refreshUI:false,captureDraft:false});
      if (run.tutorialHint?.kind === 'ability') clearTutorialRunHint();
    }
    if (tutorialMemoState?.kind === 'ability') closeOnboardingMemo(true);
  }

  function completeUltimateIntro(intro, timestamp) {
    commitElementalAbility(intro.type, timestamp, intro.originX, intro.originY);
    updateRunUI();
  }

  function updateRunUI() {
    if (!run) return;
    syncFallControls();
    if (els.runResearchScore) els.runResearchScore.textContent = Math.max(0, Math.floor(run.researchData || 0)).toLocaleString('ru-RU');
    if (els.runResearchHud) els.runResearchHud.setAttribute('aria-label', `Осколки за забег: ${Math.max(0, Math.floor(run.researchData || 0))}`);
    const experienceText = Math.max(0, run.experienceEarned).toLocaleString('ru-RU');
    if (els.runExperienceScore && els.runExperienceScore.textContent !== experienceText) els.runExperienceScore.textContent = experienceText;
    const mechActive = Boolean(run.mechSuit);
    const goal = $('#tutorialRunGoal');
    if (goal) {
      goal.hidden = !(run.tutorialPhase&&run.tutorialGoalAvailable&&!run.ended);
      const count = run.tutorialPhase === 1 ? Math.min(250,slimeTaskCount('fire') + (run.masteryGain || 0)) : Math.min(50,save.researchUnits + save.mutationProgress);
      const target = run.tutorialPhase === 1 ? 250 : 50, kind = run.tutorialPhase === 1 ? 'fire' : 'frost';
      if (goal.dataset.kind !== kind) {
        goal.dataset.kind = kind;
        goal.innerHTML = `<img src="${versionedAsset(mutationById(kind).image)}" alt=""><span class="tutorial-goal-copy"><strong></strong><small></small><span class="tutorial-goal-track"><i></i></span></span><b class="tutorial-goal-count"></b>`;
      }
      goal.classList.toggle('is-complete',count>=target);
      if(!goal.hidden&&count>=target&&!run.tutorialGoalCompleted){
        run.tutorialGoalCompleted=true;run.tutorialGoalExpandedUntil=(run.tutorialLessonTime||0)+3000;
        feedback([5,18,8]);sound('happy');
      }
      goal.querySelector('strong').textContent = count>=target ? 'Задание выполнено!' : kind==='fire' ? 'Подожги 250 блоков' : 'Собери 50 осколков';
      goal.querySelector('small').textContent = count>=target ? (kind==='fire' ? 'Огонь можно развить' : 'Хватит на новую мутацию') : kind==='fire' ? 'Поджигай блоки, чтобы развивать огонь' : 'Для синтеза новой мутации';
      const counter = goal.querySelector('.tutorial-goal-count'), next = `${count} / ${target}`;
      if (counter.textContent !== next) counter.textContent=next;
      goal.querySelector('i').style.width = `${Math.min(100,count/target*100)}%`;
      goal.setAttribute('aria-label',`${goal.querySelector('strong').textContent}: ${next}`);
      positionTutorialRunGoal();
    }

    const now = run.pausedAt || performance.now();
    window.SlimeAnomalyEnergyHud.render(run);
    const elementalActive = run.infinity?.cast?.kind === 'purple' || (run.elementalAbilityActive && now < run.elementalAbilityUntil);
    els.abilityBtn.dataset.ultimateStage = String(run.ultimateStage || run.ultimateProfile?.stage || 3);
    const isFire = run.elementalAbilityType === 'fire';
    const showElemental = Boolean(run.elementalAbilityType)
      && (!['fire', 'frost', 'electric', 'infinity', 'telekinesis', 'nano'].includes(run.elementalAbilityType) || run.ultimateStage === 3);
    els.abilityBtn.toggleAttribute('data-infinity', !!run.infinity);
    els.abilityBtn.parentElement.hidden = !showElemental;
    if (showElemental) {
      const type = run.elementalAbilityType;
      const labels = {
        frost: ULTIMATE_STAGES.get('frost', run.ultimateStage).name.toUpperCase(),
        electric: ULTIMATE_STAGES.get('electric', run.ultimateStage).name.toUpperCase(),
        fire: ULTIMATE_STAGES.get('fire', run.ultimateStage).name.toUpperCase(),
        infinity: 'ФИОЛЕТОВАЯ СФЕРА',
        cosmos: 'КОМЕТНЫЙ ПРОРЫВ',
        nano: ULTIMATE_STAGES.get('nano', run.ultimateStage).name.toUpperCase(),
        telekinesis: 'ПСИОНИЧЕСКИЙ ПРЕСС',
        phantom: run.ultimateProfile?.name?.toUpperCase() || 'ПРИЗРАЧНЫЙ ЭКСПРЕСС',
        cloning: run.ultimateProfile?.name?.toUpperCase() || 'СПОРОВЫЙ ПОСЕВ',
        gold: 'ЗОЛОТАЯ ЛИХОРАДКА',
        mass: 'ТЯЖЁЛЫЙ РЫВОК',
        mobility: 'СКОРОСТНОЙ БУР',
        glitch: 'ГЛИТЧ'
      };
      const ready = canActivateElementalAbility(now);
      const cooldownMs = isFire || adminInfiniteUltimate ? 0 : ULTIMATE_COOLDOWN.remaining(run, now);
      const enoughStrength = isFire || adminInfiniteUltimate || run.energy >= ULTIMATE_COOLDOWN.CONFIG.strengthCost;
      const percent = isFire ? (adminInfiniteUltimate ? 100 : Math.floor(100 * phoenixCharge(run)))
        : 100 * (1 - cooldownMs / ULTIMATE_COOLDOWN.CONFIG.durationMs);
      const cooldownLabel = cooldownMs > 0 ? `${Math.ceil(cooldownMs / 1000)} с`
        : isFire && percent < 100 && !elementalActive && !run.ultimateIntro ? `${percent}%` : '';
      if (els.abilityPercent.textContent !== cooldownLabel) els.abilityPercent.textContent = cooldownLabel;
      els.abilityPercent.hidden = !cooldownLabel;
      els.abilityBtn.style.setProperty('--ability', `${enoughStrength || cooldownMs ? percent : 0}%`);
      els.abilityBtn.disabled = !ready;
      els.abilityBtn.classList.toggle('is-charged', ready);
      els.abilityBtn.classList.toggle('is-ready', ready);
      const active = Boolean(elementalActive || run.ultimateIntro) && !adminInfiniteUltimate;
      els.abilityBtn.classList.toggle('is-active', active);
      window.SlimeRunAbilityHud.render(run, { ready, active, cooldownMs, enoughStrength, depthCharge: isFire, freeCast:adminInfiniteUltimate, source: runAbilityEmblem(type) });
      const status = isFire ? ready ? 'готово' : active ? 'действует' : `заряд ${percent}%`
        : ready ? adminInfiniteUltimate ? 'готово' : '20% Силы'
        : cooldownLabel ? `перезарядка ${cooldownLabel}`
          : active ? 'действует' : enoughStrength ? 'ожидание' : 'нужно 20% Силы';
      els.abilityBtn.setAttribute('aria-label', `${labels[type]} · ${status}`);
      return;
    }

    els.abilityBtn.disabled = true;
    els.abilityBtn.classList.remove('is-charged', 'is-ready', 'is-active');
    window.SlimeRunAbilityHud.render(run,{visible:false});
  }

  function drawFrostFront(x, y, width, age, alpha) {
    if (alpha <= 0 || y < -130 || y > VIEW_H + 130) return;
    const effects = window.SlimeMutationImpacts;
    const low = menuReducedMotion || isLowPowerDevice();
    const cell = run.cellSize;
    const depth = cell * 1.48;
    for (let i = -3; i <= 3; i += 1) {
      const spread = i / 3;
      const px = x + width * spread * .41;
      const py = y - depth * (.23 + spread * spread * .24);
      effects.halo(ctx, 'frost', px, py, width * .36, alpha * .57, .78);
    }
    ctx.save();
    const mist = ctx.createLinearGradient(0, y - depth, 0, y + depth * .22);
    mist.addColorStop(0, '#74cffa00');
    mist.addColorStop(.48, '#8cdcff56');
    mist.addColorStop(.78, '#d5f7ffa4');
    mist.addColorStop(1, '#f0ffff00');
    ctx.fillStyle = mist;
    ctx.globalAlpha = alpha * .88;
    ctx.beginPath();
    ctx.moveTo(x - width * .52, y - depth * .38);
    ctx.bezierCurveTo(x - width * .37, y - depth * .72, x - width * .18, y - depth * .88, x, y - depth);
    ctx.bezierCurveTo(x + width * .18, y - depth * .88, x + width * .37, y - depth * .72, x + width * .52, y - depth * .38);
    ctx.bezierCurveTo(x + width * .28, y + depth * .23, x - width * .28, y + depth * .23, x - width * .52, y - depth * .38);
    ctx.fill();
    ctx.lineCap = 'round';
    for (let i = 0; i < (low ? 14 : 36); i += 1) {
      const t = (age * (menuReducedMotion ? .001 : .003) + i * .618) % 1;
      const span = (i * .414 % 1) * 2 - 1;
      const px = x + span * width * (.23 + t * .30);
      const py = y - depth * (1.04 - .99 * t + span * span * .20);
      const size = 2.7 + i % 4 * 1.25;
      ctx.globalAlpha = Math.sin(t * Math.PI) * alpha * .82;
      ctx.strokeStyle = i % 3 ? '#d8f8ff' : '#ffffff';
      ctx.lineWidth = 1 + i % 3 * .6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + size * span * .7, py + size * 2.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFrostFlake(timestamp) {
    const flake = run.frostFlake;
    if (!flake) return;
    const age = Math.max(0, timestamp - flake.startedAt);
    const cell = run.cellSize;
    const sprite = frostStormFlakeSprite;
    const hasSprite = sprite.complete && sprite.naturalWidth;
    const low = menuReducedMotion || isLowPowerDevice();
    const light = window.SlimeMutationImpacts;
    const { x } = flake;

    if (age < FROST_FLAKE_TRAVEL_MS) {
      const travel = age / FROST_FLAKE_TRAVEL_MS;
      const y = lerp(flake.y, flake.toY, travel) - run.cameraY;
      const size = cell * lerp(.60, FROST_FLAKE_WIDTH * .80, smoothFireVisual(travel * 6));
      for (let i = 0; i < (low ? 8 : 17); i += 1) {
        const t = (age * .004 + i * .618) % 1;
        const trail = Math.min(travel * FROST_FLAKE_CELLS, t * 1.48);
        const px = x + ((i * .414 % 1) * 2 - 1) * cell * .44 * t;
        const py = y - trail * cell;
        light.halo(ctx, 'frost', px, py, 8 + (i % 4) * 5, (1 - t) * .78, 1.42);
      }
      light.halo(ctx, 'frost', x, y, size * 1.76, .91);
      if (!hasSprite) return;
      ctx.save();
      ctx.translate(x, y);
      if (!menuReducedMotion) ctx.rotate(age * .0017);
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }

    const t = clamp((age - FROST_FLAKE_TRAVEL_MS) / FROST_FLAKE_BURST_MS, 0, 1);
    const progress = 1 - (1 - t) ** 3;
    const fade = (1 - t) ** 1.6;
    const y = flake.toY - run.cameraY;
    light.halo(ctx, 'frost', x, y, cell * (.85 + progress * .85), fade * .94);
    ctx.save();
    ctx.beginPath();
    ctx.rect(run.gridOffsetX, -100, run.columns * cell, VIEW_H + 200);
    ctx.clip();
    for (let i = 0; i < (low ? 10 : 20); i += 1) {
      const angle = i * 2.39996;
      const distance = cell * progress * (.21 + (i * .618 % 1) * .71);
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      const size = cell * (.047 + i % 4 * .018) * (1 - t * .43);
      ctx.globalAlpha = fade * (.65 + i % 3 * .14);
      ctx.fillStyle = i % 3 ? '#b9edff' : '#f1feff';
      ctx.beginPath();
      ctx.moveTo(px, py - size * 1.6); ctx.lineTo(px + size, py);
      ctx.lineTo(px, py + size * 1.3); ctx.lineTo(px - size * .68, py); ctx.fill();
      if (hasSprite && i % 7 === 0) ctx.drawImage(sprite, px - size * 1.7, py - size * 1.7, size * 3.4, size * 3.4);
    }
    ctx.restore();
  }

  function drawFrostStormScene(timestamp) {
    const storm = run.frostStorm;
    if (!storm) return;
    const age = timestamp - storm.startedAt;
    const charge = clamp(age / storm.chargeMs, 0, 1);
    const sweep = Math.max(0, age - storm.chargeMs);
    const fade = 1 - smoothFireVisual((age - storm.duration + 490) / 490);
    const intensity = smoothFireVisual(age / 440) * fade;
    const cell = run.cellSize;
    const low = menuReducedMotion || isLowPowerDevice();
    const effects = window.SlimeMutationImpacts;
    const x = charge < 1 ? run.slime.x : storm.originX;
    const y = (charge < 1 ? run.slime.y : storm.originY) - run.cameraY;
    const aura = smoothFireVisual(charge) * (1 - smoothFireVisual(sweep / 410));
    ctx.save();
    ctx.fillStyle = '#65baff';
    ctx.globalAlpha = intensity * (menuReducedMotion ? .06 : .13);
    ctx.fillRect(-12, -12, VIEW_W + 24, VIEW_H + 24);
    ctx.restore();
    effects.halo(ctx, 'frost', x, y, cell * lerp(1.55, 4.65, charge), aura * .73, .79);
    effects.halo(ctx, 'frost', x, y + cell * .24, cell * lerp(.68, 2.04, charge), aura * .95, .72);
    if (aura > .01) {
      ctx.save();
      for (let i = 0; i < (low ? 17 : 34); i += 1) {
        const start = (i * .618 % 1) * .54;
        const t = clamp((charge - start) / .49, 0, 1);
        if (t <= 0 || t >= 1) continue;
        const horizontal = ((i * .382 % 1) * 2 - 1) * cell * 3.6;
        const vertical = ((i * .713 % 1) * 2 - 1) * cell * 2.25;
        const pull = 1 - t * t;
        const px = x + horizontal * pull;
        const py = y + cell * .22 + vertical * pull;
        const opacity = aura * Math.sin(t * Math.PI) * .97;
        const size = 2.2 + i % 4 * 1.5;
        effects.halo(ctx, 'frost', px, py, size * 5, opacity * .70);
        ctx.globalAlpha = opacity;
        if (i % 3 === 0 && frostStormFlakeSprite.complete && frostStormFlakeSprite.naturalWidth) {
          ctx.drawImage(frostStormFlakeSprite, px - size, py - size, size * 2, size * 2);
        } else {
          ctx.fillStyle = '#eafaff';
          ctx.fillRect(px - size * .24, py - size * .24, size * .48, size * .48);
        }
      }
      ctx.restore();
    }
    if (storm.firstRow === undefined) return;
    const rowTime = Math.max(FROST_STORM_ROW_MS, run.columns * FROST_STORM_CELL_MS);
    const burst = smoothFireVisual(sweep / 130);
    const waveSpread = smoothFireVisual(sweep / 360);
    const width = run.columns * cell * lerp(.46, 1.14, waveSpread);
    const windAlpha = burst * fade * (1 - smoothFireVisual((sweep - (storm.rows - 1) * rowTime) / 490));
    const frontY = frostStormFrontY(storm, sweep) - run.cameraY;
    const waveX = lerp(x, VIEW_W / 2, waveSpread);
    effects.halo(ctx, 'frost', waveX, frontY - cell * .9, width * 1.42, windAlpha * .49, .60);
    drawFrostFront(waveX, frontY, width, age, windAlpha);
    for (let i = 0; i < (low ? 5 : 10); i += 1) {
      const t = (sweep * .00175 + i * .618) % 1;
      const span = (i * .382 % 1) * 2 - 1;
      const px = waveX + span * width * (.43 + t * .08);
      const py = frontY - (1 - t) * cell * (2.3 + i % 3 * .46);
      effects.halo(ctx, 'frost', px, py, cell * (1.8 + i % 3 * .49), windAlpha * Math.sin(t * Math.PI) * .30, .63);
    }
  }

  function renderCanvas(timestamp) {
    if(run.coreEncounter?.cinematic&&!run.evacuation){const e=run.coreEncounter;e.animationBase??=timestamp-e.elapsed;timestamp=e.animationBase+e.elapsed;}
    const world = run.world;
    const cosmosShake=((run.coreEncounter?.cosmos||run.coreEncounter?.hit)&&!run.evacuation)||PURIFICATION.active(run);
    const shakeClock=run.coreEncounter?.elapsed||0;
    let shakeX = run.shake ? cosmosShake ? Math.sin(shakeClock*.061)*run.shake : rand(-run.shake, run.shake) : 0;
    let shakeY = run.shake ? cosmosShake ? Math.sin(shakeClock*.083+.7)*run.shake*.45 : rand(-run.shake * .5, run.shake * .5) : 0;
    if (run.phoenixUltimate && !menuReducedMotion) {
      const phoenix = run.phoenixUltimate;
      const pass = (timestamp - phoenix.startedAt - phoenix.arrivalMs + 65) / 490;
      if (pass > 0 && pass < 1) {
        const gust = Math.sin(pass * Math.PI) ** 2 * (1 - pass * .45);
        shakeX += Math.sin(pass * Math.PI * 6) * gust * 5.4;
        shakeY += Math.sin(pass * Math.PI * 4 + .6) * gust * 3.8;
      }
    }
    if (run.frostStorm && !menuReducedMotion) {
      const storm = run.frostStorm;
      const t = (timestamp - storm.startedAt - storm.chargeMs) / 365;
      if (t > 0 && t < 1) {
        const gust = Math.sin(t * Math.PI) * (1 - t);
        shakeX += Math.sin(t * 20) * gust * 4.4;
        shakeY += Math.sin(t * 14) * gust * 2.3;
      }
    }
    const thunder = run.electricStorm;
    const stormImpactAge = thunder?.impactAt == null ? -1 : timestamp - thunder.impactAt;
    const thunderCamera = thunder && !menuReducedMotion ? electricStormCamera(thunder, timestamp) : null;
    const thunderCharge = thunderCamera?.charge ?? 0;
    if (thunderCharge && thunder.strikes === 0) {
      const t = (timestamp - thunder.startedAt) / 1000;
      shakeX += Math.sin(t * 67) * thunderCharge ** 2 * 2.3;
      shakeY += Math.sin(t * 52) * thunderCharge ** 2 * 1.6;
    }
    if (!menuReducedMotion && stormImpactAge >= 0 && stormImpactAge < 305) {
      const t = stormImpactAge / 305;
      const damping = (1 - t) ** 2;
      shakeX += Math.sin(t * 22) * damping * 12;
      shakeY += Math.sin(t * 27 + .7) * damping * 14;
    }
    const infinityShake = !menuReducedMotion && INFINITY.cameraShake(run.infinity, timestamp);
    if (infinityShake) {
      shakeX += infinityShake.x;
      shakeY += infinityShake.y;
    }
    ctx.save();
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.translate(shakeX, shakeY);
    const infinityZoom = menuReducedMotion ? 1 : INFINITY.zoom(run.infinity, timestamp);
    if (infinityZoom > 1) {
      const focusX = run.slime.x;
      const focusY = Math.max(90, run.slime.y - run.cameraY - 22);
      ctx.translate(focusX * (1 - infinityZoom), focusY * (1 - infinityZoom));
      ctx.scale(infinityZoom, infinityZoom);
    }
    if (run.frostStorm) {
      const { zoom } = frostStormCamera(run.frostStorm, timestamp);
      if (zoom > 1) {
        const focusX = clamp(run.slime.x, VIEW_W * .13, VIEW_W * .87);
        const focusY = clamp(run.slime.y - run.cameraY, 100, VIEW_H * .45);
        ctx.translate(focusX * (1 - zoom), focusY * (1 - zoom));
        ctx.scale(zoom, zoom);
      }
    }
    if (thunderCharge) {
      const { point, focus } = thunderCamera;
      const impactZoom = stormImpactAge < 0 ? 0 : Math.exp(-stormImpactAge / 108) * .024;
      const zoom = 1 + thunderCharge * (.031 + focus * .038) + impactZoom;
      const focusX = clamp(lerp(run.slime.x, point.x, focus), VIEW_W * .16, VIEW_W * .84);
      const focusY = clamp(lerp(run.slime.y, point.y, focus) - run.cameraY, 100, VIEW_H * .8);
      ctx.translate(focusX * (1 - zoom), focusY * (1 - zoom));
      ctx.scale(zoom, zoom);
    }
    window.SlimeFungiHazards.applyCamera(ctx,run,VIEW_W,VIEW_H,menuReducedMotion);
    CORE.applyCinematic(ctx,run);
    PURIFICATION.applyCamera(ctx,run);

    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, world.earth);
    gradient.addColorStop(1, world.deep);
    ctx.fillStyle = gradient;
    ctx.fillRect(-32, -32, VIEW_W + 64, VIEW_H + 64);

    drawBackground(world, timestamp);
    if (run.coreEncounter) {
      // Keep the real ceiling visible while the first charge begins just past it.
      if(run.coreEncounter.cinematic&&run.coreEncounter.phase==='approach'){
        const origin=run.blockRowOrigin||285,first=Math.max(0,Math.floor((run.cameraY-run.cellSize-origin)/run.cellSize)),last=Math.min(run.rowCount-1,first+5);
        for(let row=first;row<=last;row++)for(const block of run.blocksByRow?.get(row)||[]){const sy=block.y-run.cameraY;if(!block.dead&&sy+block.h>0&&sy<200)drawBlock(block,sy,timestamp);}
      }
      CORE.drawCore(ctx, run, timestamp);
      PURIFICATION.draw(ctx,run);
      const strikeFx=run.coreEncounter.infinity?window.SlimeInfinityCoreStrike:run.coreEncounter.spores?window.SlimeSporesCoreStrike:run.coreEncounter.glitch?window.SlimeGlitchCoreStrike:run.coreEncounter.psionic?window.SlimePsionicCoreStrike:run.coreEncounter.phantom?window.SlimePhantomCoreStrike:run.coreEncounter.techno?window.SlimeTechnoCoreStrike:run.coreEncounter.cosmos?window.SlimeCosmosCoreStrike:run.coreEncounter.frost?window.SlimeFrostCoreStrike:run.coreEncounter.electric?window.SlimeElectricCoreStrike:window.SlimeFireCoreStrike;
      strikeFx.backdrop(ctx,run);
      strikeFx.draw(ctx,run);
      CORE.drawOverdrive(ctx,run);
      EVAC.drawPortal(ctx,run);
      drawSlime(timestamp);
      strikeFx.draw(ctx,run,true);
      EVAC.drawPortalFront(ctx,run);
      EVAC.drawFlash(ctx,run);
      ctx.restore();
      PURIFICATION.drawFlash(ctx,run);
      CORE.drawHud(ctx, run);
      PURIFICATION.drawHud(ctx,run);
      
      return;
    }
    drawLaunchEntryPortal(world, timestamp);
    window.SlimeWaterHazards.drawVortices(ctx,run,menuReducedMotion);
    drawHoneyZones(timestamp, false);
    drawJellyZones(timestamp, false);
    drawFreezeZones(timestamp, false);
    drawFinishPortal(world, timestamp);
    drawTelekinesisPressBackdrop(timestamp);

    const visibleBlocks = [];
    const rowOrigin = run.blockRowOrigin || 285;
    const firstVisibleRow = Math.max(0, Math.floor((run.cameraY - 60 - rowOrigin) / run.cellSize));
    const lastVisibleRow = Math.ceil((run.cameraY + VIEW_H + 60 - rowOrigin) / run.cellSize);
    const activePress=run.telekinesisPress;
    const pressMoving=Boolean(activePress&&!activePress.collided);
    const pressSqueeze=pressMoving?telekinesisPressProgress(activePress,timestamp):0;
    const pressScale=Math.max(.035,1-pressSqueeze*.965);
    for (let row = firstVisibleRow; row <= lastVisibleRow; row += 1) {
      for (const block of run.blocksByRow?.get(row) || []) {
        const sy = block.y - run.cameraY;
        if (sy < -60 || sy > VIEW_H + 60) continue;
        if (block.dead) {
          if (block.rockBreakPose) drawRockUnderPressure(block, sy, timestamp);
          continue;
        }
        if (block.chase&&!block.frozen&&!block.elementalSnow&&!block.elementalSnowflake) continue;
        const infinityPull = !menuReducedMotion && INFINITY.pullPose(run.infinity, block, timestamp);
        if (infinityPull) continue;
        const movingWithPress = pressMoving && activePress.targetSet.has(block);
        if (movingWithPress) {
          const centerX = block.x + block.w / 2;
          ctx.save();
          ctx.transform(pressScale,0,0,1,(VIEW_W/2-centerX)*pressSqueeze+centerX*(1-pressScale),0);
          ctx.globalAlpha = 1 - pressSqueeze * .12;
        } else if (!block.motion) visibleBlocks.push(block);
        const spectralShake = block.phantomDetonateAt > timestamp && block.phantomDetonateAt - timestamp < 650;
        if (spectralShake) {
          const force = 1 + (1 - (block.phantomDetonateAt - timestamp) / 650) * 1.4;
          ctx.save();ctx.translate(Math.sin(timestamp / 23 + block.row * 7 + block.col) * force,
            Math.cos(timestamp / 29 + block.col * 3) * force * .55);
        }
        const hitAge = timestamp - (block.visualCrackAt ?? -Infinity);
        const absorbsHit = !menuReducedMotion && hitAge >= 0 && hitAge < 210;
        if (absorbsHit) {
          const nx = block.rockImpactNormalX;
          const ny = block.rockImpactNormalY;
          const force = (.65 + block.rockImpactPower * .35) * (block.maxHp >= 3 ? 1.22 : 1);
          const compression = Math.exp(-hitAge / 55) * Math.cos(hitAge / 19) * force;
          const x = block.x + block.w / 2;
          const y = sy + block.h / 2;
          ctx.save();
          ctx.translate(x - nx * compression * 3.8, y - ny * compression * 3.8);
          ctx.scale(1 + compression * (Math.abs(ny) * .018 - Math.abs(nx) * .045),
            1 + compression * (Math.abs(nx) * .018 - Math.abs(ny) * .045));
          ctx.translate(-x, -y);
        }
        drawBlock(block, sy, timestamp);
        if (absorbsHit) ctx.restore();
        if(run.tutorialHint?.focus===block&&!block.dead&&!run.paused){
          ctx.save();ctx.globalAlpha=1;ctx.shadowBlur=0;
          roundedRect(ctx,block.x+1.5,sy+1.5,block.w-3,block.h-3,7);
          ctx.strokeStyle='#18566e';ctx.lineWidth=6;ctx.stroke();
          ctx.strokeStyle='#ffdc67';ctx.lineWidth=3;ctx.stroke();ctx.restore();
        }
        if(run.telekinesisCycle?.uncaptured>0)captureTelekinesisBlockArt(block,sy);
        window.SlimeTechnoFeedback.laserTint(ctx,block,sy,timestamp);
        if (block.phantomMarked) drawPhantomMarkedBlock(block, sy, timestamp);
        if (block.glitchInfected || block.glitchDisperseUntil > timestamp || block.glitchNeutralized || block.glitchDeleteAt > timestamp || block.glitchHackingUntil > timestamp
          || block.glitchRewriteUntil > timestamp || block.glitchTransformUntil > timestamp) {
          drawGlitchBlockOverlay(block, sy, timestamp);
        }
        if (spectralShake) ctx.restore();
        if (movingWithPress) ctx.restore();
      }
    }

    // A thin shared grid keeps every tile aligned without blending their art.
    drawBlockTransitions(visibleBlocks);
    window.SlimeBrambleObstacles.draw(ctx,run,timestamp);
    if (!menuReducedMotion && run.infinity?.cast?.kind === 'blue') {
      for (const block of run.infinity.cast.pull) {
        if (block.dead) continue;
        const pose = INFINITY.pullPose(run.infinity, block, timestamp);
        if (!pose) continue;
        const sy = block.y - run.cameraY;
        const x = block.x + block.w / 2;
        const y = sy + block.h / 2;
        ctx.save();
        ctx.translate(x + pose.x, y + pose.y);
        ctx.rotate(pose.spin);
        ctx.scale(pose.scale, pose.scale);
        ctx.translate(-x, -y);
        drawBlock(block, sy, timestamp);
        ctx.restore();
      }
    }
    for(const block of run.movingHazards||[]){
      if(!block.chase||block.dead||block.frozen||block.elementalSnow||block.elementalSnowflake)continue;
      const sy=block.y-run.cameraY;if(sy<-80||sy>VIEW_H+80)continue;
      drawBlock(block,sy,timestamp);
      if(block.glitchNeutralized||block.glitchInfected)drawGlitchBlockOverlay(block,sy,timestamp);
    }
    if(run.evacuation){
      drawFlasks(timestamp);
      EVAC.drawPortal(ctx,run);drawSlime(timestamp);EVAC.drawPortalFront(ctx,run);EVAC.drawFlash(ctx,run);
      ctx.restore();return;
    }
    drawTelekinesisPressScene(timestamp);
    drawSporeEffects(timestamp);
    SPORE_COLOSSUS.draw(ctx, run, timestamp);
    drawGlitchShock(timestamp);
    window.SlimeGlitchFeedback.breaks(ctx, run, timestamp, menuReducedMotion || isLowPowerDevice());
    window.SlimeGlitchFeedback.disarm(ctx, run, timestamp);
    drawFlasks(timestamp);
    window.SlimeEnergyPickups.draw(ctx,run,timestamp);
    drawGeyserCapture(timestamp);
    drawMeteorShowers(timestamp);
    drawSpecialEffects(false);
    window.SlimeTechHazards.draw(ctx,run,menuReducedMotion);
    window.SlimeWaterHazards.draw(ctx,run,false,menuReducedMotion);
    window.SlimeIceHazards.draw(ctx,run,menuReducedMotion||graphicsBudget<.8||isLowPowerDevice());
    window.SlimeFungiHazards.drawFields(ctx,run,menuReducedMotion||graphicsBudget<.8||isLowPowerDevice());
    window.SlimeFungiHazards.draw(ctx,run,menuReducedMotion||graphicsBudget<.8||isLowPowerDevice());
    drawFrostStormScene(timestamp);
    drawPhantomScene(timestamp);
    drawPhantomBursts(timestamp);
    drawTelekinesis(timestamp);
    for(const burst of run.psionicBarrierBursts || [])window.SlimePsionicEffects.blast(ctx,burst,run.cameraY,run.cellSize,timestamp);

    const sporeParticleSprite = ASSETS.projectSprite('assets/vfx/spores-giant-seed-v1.webp');
    for (const p of run.particles) {
      if (p.delay > 0) continue;
      const sy = p.y - run.cameraY;
      if (sy < -30 || sy > VIEW_H + 30) continue;
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      if (p.kind === 'debris') {
        window.SlimeBlockBreakFeedback.drawParticle(ctx,p,sy);
      } else if (p.kind === 'portal' || p.kind === 'special') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = isLowPowerDevice() || p.shape === 'smoke' || p.shape === 'spore' ? 0 : p.kind === 'portal' ? 9 : 6;
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
        } else if (p.shape === 'spore') {
          ctx.save();
          ctx.globalAlpha *= .78;
          ctx.translate(p.x, sy);
          ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
          if (sporeParticleSprite.complete && sporeParticleSprite.naturalWidth) {
            ctx.drawImage(sporeParticleSprite, -p.size, -p.size * .86, p.size * 2, p.size * 1.72);
          }
          ctx.restore();
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

    drawPhoenixUltimate(timestamp, shakeX, shakeY);
    drawFrostFlake(timestamp);
    drawFallSpeedLines(timestamp);
    drawSelectedTrail(timestamp);
    drawCosmosUltimateTrail(timestamp);
    drawCloningCharge(timestamp);
    drawPhantomCompanions(timestamp,false);
    drawElectricStormBackdrop(timestamp);
    ELEMENTAL_ULTIMATES.draw(ctx, run, timestamp, menuReducedMotion);
    INFINITY.draw(ctx, run, timestamp, menuReducedMotion || isLowPowerDevice(), true);
    drawLaunchEntryPortal(world,timestamp,'front');
    drawMechExplosion(timestamp);
    drawNanoBolts(timestamp);
    drawSlime(timestamp);
    INFINITY.draw(ctx, run, timestamp, menuReducedMotion || isLowPowerDevice(), false);
    window.SlimeWaterHazards.draw(ctx,run,true,menuReducedMotion);
    window.SlimeIceHazards.drawStatus(ctx,run,menuReducedMotion);
    drawMiniSlimes(timestamp);
    drawNanoDrones(timestamp);
    drawPhantomCompanions(timestamp);
    drawHoneyZones(timestamp, true);
    drawJellyZones(timestamp, true);
    drawFreezeZones(timestamp, true);
    drawSpecialEffects(true);
    for (const bolt of run.electricStormBolts) drawElectricStormBolt(bolt, timestamp);
    COSMOS_ULTIMATES.draw(ctx, run, timestamp, isLowPowerDevice());
    drawGlitchScreenEffect(timestamp);
    ctx.restore();
    window.SlimeFungiHazards.drawStatus(ctx,run,VIEW_W,VIEW_H);

  }

  function drawElectricStormBolt(bolt, timestamp) {
    const elapsed = timestamp - bolt.startedAt;
    if (elapsed < 0 || timestamp >= bolt.until) return;
    const fromY = bolt.fromScreen ? bolt.from.y : bolt.from.y - run.cameraY;
    const toY = bolt.to.y - run.cameraY;
    const reveal = clamp(elapsed / bolt.grow, 0, 1);
    const dx = (bolt.to.x - bolt.from.x) * reveal;
    const dy = (toY - fromY) * reveal;
    const power = bolt.power || 1;
    const flicker = bolt.seed + (menuReducedMotion ? 0 : Math.floor(elapsed / 79) * .76);
    const alpha = Math.min(1, reveal * 3) * clamp((bolt.until - timestamp) / (bolt.trunk ? 235 : 144), 0, 1) ** 1.4;
    const effects = window.SlimeMutationImpacts;
    const low = menuReducedMotion || isLowPowerDevice();
    const x = bolt.from.x;
    const stretch = bolt.trunk ? 21 : clamp(Math.hypot(dx, dy) * .13, 5, 15);
    if (bolt.trunk) {
      const nodes = low ? 3 : 5;
      for (let i = 1; i < nodes; i += 1) {
        const p = i / nodes;
        effects.halo(ctx, 'electric', x + dx * p, fromY + dy * p, 73 + p * 34, alpha * .32, 2);
      }
    }
    effects.electricDischarge(ctx, x, fromY, x + dx, fromY + dy, 1.14 * power, stretch, flicker, alpha);
    if (!low && bolt.trunk) {
      effects.electricDischarge(ctx, x, fromY, x + dx, fromY + dy, 1.65, stretch * 1.85, flicker + 19, alpha * .68);
    }
    if (bolt.trunk && reveal === 1) {
      const impact = clamp((elapsed - bolt.grow) / 282, 0, 1);
      effects.burst(ctx, 'electric', bolt.to.x, toY, run.cellSize * 2.35, impact, low);
      effects.halo(ctx, 'electric', bolt.to.x, toY, run.cellSize * 3.35, (1 - impact) ** 2 * .69, .64);
    } else if (!bolt.trunk && reveal === 1) {
      effects.halo(ctx, 'electric', bolt.to.x, toY, 20 * power, alpha * .62);
    }
  }

  function drawElectricWarning(zone, timestamp, power) {
    if (power <= 0) return;
    const { x, y: depth } = zone.point;
    const y = depth - run.cameraY;
    const size = run.cellSize;
    if (y < -size || y > VIEW_H + size) return;
    const effects = window.SlimeMutationImpacts;
    const time = menuReducedMotion ? 0 : timestamp;
    const flash = smoothFireVisual((power - .78) / .22);
    const pulse = .94 + .06 * Math.sin(time / 53);
    effects.halo(ctx, 'electric', x, y, size * (1.02 + flash * 1.04), (.24 * power + .61 * flash) * pulse);
    ctx.save();
    ctx.translate(x, y);
    const glyphSize = size * (1.17 + flash * .09);
    ctx.scale(glyphSize, glyphSize);
    ctx.beginPath();
    ctx.moveTo(.10, -.34);
    ctx.lineTo(-.21, .044);
    ctx.lineTo(-.025, .044);
    ctx.lineTo(-.105, .34);
    ctx.lineTo(.22, -.077);
    ctx.lineTo(.03, -.077);
    ctx.closePath();
    ctx.globalAlpha = power * (.47 + flash * .26);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#123762';
    ctx.lineWidth = .044;
    ctx.stroke();
    const fill = ctx.createLinearGradient(0, -.34, 0, .34);
    fill.addColorStop(0, '#ffffff');
    fill.addColorStop(.42, '#b8f4ff');
    fill.addColorStop(1, '#64bbff');
    ctx.fillStyle = fill;
    ctx.globalAlpha = (.32 * power + .68 * flash) * pulse;
    ctx.fill();
    ctx.restore();
    const leak = smoothFireVisual((power - .47) / .53);
    for (let i = 0; i < 3; i += 1) {
      const angle = i * 2.39996 + time / 410;
      effects.electricDischarge(ctx, x, y, x + Math.cos(angle) * size * .57, y + Math.sin(angle) * size * .57,
        .91, 5.5, i * 9.7 + Math.floor(time / 90), leak * pulse * .66);
    }
  }

  function drawElectricStormBackdrop(timestamp) {
    const storm = run.electricStorm;
    if (!storm) return;
    const age = timestamp - storm.startedAt;
    const fade = storm.endedAt ? 1 - smoothFireVisual((timestamp - storm.endedAt) / ELECTRIC_STORM_EXIT_MS) : 1;
    const darkness = smoothFireVisual(age / 790) * fade;
    const sinceImpact = storm.impactAt == null ? -1 : timestamp - storm.impactAt;
    const flash = sinceImpact < 0 ? 0 : (1 - clamp(sinceImpact / 175, 0, 1)) ** 2;
    ctx.save();
    const shade = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    shade.addColorStop(0, '#03071eef');
    shade.addColorStop(.46, '#070c28bf');
    shade.addColorStop(1, '#111a3caa');
    ctx.globalAlpha = darkness * .83;
    ctx.fillStyle = shade;
    ctx.fillRect(-35, -35, VIEW_W + 70, VIEW_H + 70);
    ctx.globalAlpha = flash * (menuReducedMotion ? .05 : .31);
    ctx.fillStyle = '#b2deff';
    ctx.fillRect(-35, -35, VIEW_W + 70, VIEW_H + 70);
    ctx.restore();

    if (storm.warning) {
      const elapsed = timestamp - storm.nextStrikeAt + ELECTRIC_STORM_WARNING_MS;
      const appearing = smoothFireVisual(elapsed / (ELECTRIC_STORM_WARNING_MS - 100));
      drawElectricWarning(storm.warning, timestamp, appearing * .78 + .12 * electricStormWarning(storm, timestamp));
    } else if (storm.impactPoint && sinceImpact >= -ELECTRIC_STORM_BOLT_MS && sinceImpact < 0) {
      drawElectricWarning({ point: storm.impactPoint }, timestamp,
        .90 + .10 * smoothFireVisual(1 + sinceImpact / ELECTRIC_STORM_BOLT_MS));
    }
  }

  function drawElectricStormEyes(target, state, power, timestamp) {
    const radius = state.radius;
    const effects = window.SlimeMutationImpacts;
    const x = radius * .326;
    const y = radius * .0205;
    target.save();
    for (const side of [-1, 1]) {
      const px = x * side;
      effects.halo(target, 'electric', px, y, radius * 1.19, power * .81, .73);
      effects.halo(target, 'electric', px, y, radius * .72, power * .92);
      target.fillStyle = '#f7ffff';
      target.globalAlpha = power;
      target.beginPath();
      target.ellipse(px, y, radius * .177, radius * .224, side * .13, 0, Math.PI * 2);
      target.fill();
      const tick = menuReducedMotion ? 0 : Math.floor(timestamp / 78);
      effects.electricDischarge(target, px + side * radius * .14, y,
        px + side * radius * .79, y - radius * (.21 + Math.sin(tick + side) * .12),
        radius * .048, radius * .18, tick + side * 7, power * .92);
    }
    target.restore();
  }

  function drawElectricStormAura(x, y, radius, power, timestamp) {
    const effects = window.SlimeMutationImpacts;
    const low = menuReducedMotion || isLowPowerDevice();
    const time = menuReducedMotion ? 0 : timestamp / 1000;
    const pulse = .88 + .12 * Math.sin(time * 14);
    const reach = radius * (.84 + .37 * power);
    effects.halo(ctx, 'electric', x, y, reach * 5.5, power * .7, 1.08);
    effects.halo(ctx, 'electric', x, y, reach * 3.12, power * pulse * .84);
    for (let i = 0; i < (low ? 5 : 9); i += 1) {
      const flow = (time * (1.08 + (i % 3) * .23) + i * .618) % 1;
      const angle = i * 2.39996 + Math.sin(time * 3.1 + i) * .41;
      const dx = Math.cos(angle) * reach;
      const dy = Math.sin(angle) * reach * .91;
      const distance = 1.18 + flow * .97;
      const px = x + dx * distance, py = y + dy * distance;
      const shine = power * Math.sin(flow * Math.PI);
      effects.electricDischarge(ctx, x + dx * .4, y + dy * .4, px, py,
        radius * (.034 + (i % 4) * .012), radius * .25, i * 9.3 + Math.floor(time * 13), shine);
      effects.halo(ctx, 'electric', px, py, 8 + (i % 3) * 2, shine * .86);
    }
  }

  function drawPhoenixSummon(flight, lowEffects) {
    const { x, summon } = flight;
    const y = flight.gatherY - run.cameraY;
    const cell = run.cellSize;
    const light = window.SlimeMutationImpacts;
    const gather = smoothFireVisual(summon / .18);
    const flare = Math.sin(Math.PI * smoothFireVisual(summon));
    const fade = 1 - smoothFireVisual((summon - .69) / .31);
    const count = lowEffects ? 27 : 48;
    const drift = menuReducedMotion ? .48 : 1;
    ctx.save();
    for (let i = 0; i < count; i += 1) {
      const start = (i * .618033 % 1) * .43;
      const t = clamp((summon - start) / .54, 0, 1);
      if (t <= 0 || t >= 1) continue;
      const angle = i * 2.39996 + t * drift * 2.5;
      const radius = VIEW_W * (.17 + (i * .368 % 1) * .26) * (1 - t * .84);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius * .54 + cell * (.76 - t);
      const opacity = Math.sin(t * Math.PI) * gather * fade;
      const size = (1.6 + i % 5 * .52) * (1 - t * .42);
      ctx.globalAlpha = opacity * .88;
      ctx.fillStyle = i % 3 ? '#342536' : '#796875';
      ctx.beginPath();
      ctx.moveTo(px - size * 1.3, py + size * .48);
      ctx.lineTo(px - size * .5, py - size);
      ctx.lineTo(px + size, py - size * .46);
      ctx.lineTo(px + size * .52, py + size * .72);
      ctx.fill();
      if (i % 4 === 0) light.halo(ctx, 'fire', px, py, size * 6.5, opacity * .84);
    }
    for (let i = 0; i < (lowEffects ? 5 : 9); i += 1) {
      const t = (summon * 1.55 + i * .618) % 1;
      const px = lerp(run.slime.x, x, t) + Math.sin(i * 4.3 + t * 5) * cell * .48 * Math.sin(t * Math.PI);
      const py = lerp(run.slime.y - run.cameraY - cell * .16, y, t);
      light.halo(ctx, 'fire', px, py, 12 + i % 4 * 5, Math.sin(t * Math.PI) * gather * fade * .90, 1.25);
    }
    const bright = flare * (menuReducedMotion ? .57 : 1);
    light.halo(ctx, 'fire', x, y - cell * .16, cell * (3 + flare * 1.8), bright * .63, .84);
    light.halo(ctx, 'fire', x, y - cell * .14, cell * (.8 + flare * 1.1), bright * .72, .95);
    ctx.restore();
  }

  function drawPhoenixGust(flight, lowEffects) {
    const t = flight.passAge / 610;
    if (t <= 0 || t >= 1) return;
    const pulse = Math.sin(Math.PI * t) * (1 - t * .62);
    const light = window.SlimeMutationImpacts;
    const y = lerp(flight.gatherY - run.cameraY, flight.y - run.cameraY + VIEW_H * .3, t);
    light.halo(ctx, 'fire', flight.x, y, VIEW_W * 2.35, pulse * (menuReducedMotion ? .23 : .53), .57);
    if (menuReducedMotion) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const edgeGlow = ctx.createLinearGradient(0, 0, VIEW_W, 0);
    edgeGlow.addColorStop(0, '#fc782baa');
    edgeGlow.addColorStop(.27, '#ff90470b');
    edgeGlow.addColorStop(.73, '#ff90470b');
    edgeGlow.addColorStop(1, '#fc782baa');
    ctx.globalAlpha = pulse * .85;
    ctx.fillStyle = edgeGlow;
    ctx.fillRect(-12, -12, VIEW_W + 24, VIEW_H + 24);
    ctx.lineCap = 'round';
    for (let i = 0; i < (lowEffects ? 8 : 14); i += 1) {
      const side = i % 2 ? 1 : -1;
      const inset = 12 + i * .618 % 1 * 70;
      const px = side < 0 ? inset : VIEW_W - inset;
      const py = (i * .414 % 1) * VIEW_H - 96 + t * VIEW_H * .38;
      const length = 27 + i % 5 * 13;
      ctx.strokeStyle = i % 3 ? '#ff9e52' : '#fff0be';
      ctx.lineWidth = i % 3 ? 1.8 : 2.6;
      ctx.globalAlpha = pulse * (.28 + i % 3 * .1);
      ctx.beginPath();
      ctx.moveTo(px - side * 10, py - length);
      ctx.quadraticCurveTo(px, py - length * .55, px + side * 17, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPhoenixUltimate(timestamp, cameraShakeX, cameraShakeY) {
    const phoenix = run.phoenixUltimate;
    const sprite = phoenixUltimateSprite;
    if (!phoenix) return;
    const flight = phoenixFlight(phoenix, timestamp);
    const lowEffects = isLowPowerDevice() || menuReducedMotion;
    if (flight.summon < 1) drawPhoenixSummon(flight, lowEffects);
    else drawPhoenixGust(flight, lowEffects);
    if (!sprite.complete || !sprite.naturalWidth) return;
    const shaftWidth = run.cellSize * run.columns;
    const aspect = sprite.naturalHeight / sprite.naturalWidth;
    const { x, reveal } = flight;
    const headY = flight.y - run.cameraY;
    const width = shaftWidth * flight.scale;
    const height = width * aspect;
    if (reveal <= 0 || headY < -run.cellSize || headY - height * 1.12 > VIEW_H) return;
    const drawX = -width / 2;
    const drawY = -height * .975;
    ctx.save();
    // Keep the bird steady while its passing gust shakes the mine.
    ctx.translate(x - cameraShakeX, headY - cameraShakeY);
    const effects = window.SlimeMutationImpacts;
    effects.halo(ctx, 'fire', 0, -height * .45, width * 1.15, reveal * .56, .88);
    effects.halo(ctx, 'fire', 0, -height * .16, width * .48, reveal * .33, 1.35);
    const emberCount = lowEffects ? 12 : 24;
    for (let i = 0; i < emberCount; i += 1) {
      const t = ((flight.age + i * 53) % 490) / 490;
      const side = i % 2 ? 1 : -1;
      const wing = .12 + (i * .618 % 1) * .36;
      const emberX = width * side * wing * (1 + t * .34) + Math.sin(i + t * 6) * t * 11;
      const emberY = -height * (.18 + t * .72 + wing * .38);
      const spark = (8 + i % 4 * 3) * (1 - .60 * t) * (.7 + flight.scale * .3);
      effects.halo(ctx, 'fire', emberX, emberY, spark, reveal * Math.sin(t * Math.PI) * .95, 1.55);
    }
    ctx.globalAlpha = reveal;
    ctx.drawImage(sprite, drawX, drawY, width, height);
    ctx.restore();
  }

  function drawUltimateIntro(timestamp) {
    const intro = run.ultimateIntro;
    if (!intro) return;
    const progress = clamp((timestamp - intro.startedAt) / (intro.duration || ULTIMATE_INTRO_MS), 0, 1);
    const arrival = 1 - Math.pow(1 - clamp(progress / .67, 0, 1), 3);
    const exit = clamp((1 - progress) / .18, 0, 1);
    const x = lerp(intro.fromX, VIEW_W / 2, arrival);
    const y = lerp(intro.fromY, VIEW_H * .42, arrival);
    const size = lerp(52, 124, arrival) * (progress > .82 ? .72 + exit * .28 : 1);
    ctx.save();
    ctx.fillStyle = `rgba(6,10,22,${.08 + Math.sin(progress * Math.PI) * .38})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.translate(x, y);
    ctx.rotate(progress * Math.PI * 2.15);
    ctx.globalAlpha = Math.min(1, progress * 8, exit);
    ctx.shadowColor = intro.color;
    ctx.shadowBlur = 22;
    ctx.strokeStyle = intro.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, size * .56, 0, Math.PI * 2);
    ctx.stroke();
    if (intro.icon.complete && intro.icon.naturalWidth) {
      ctx.drawImage(intro.icon, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = intro.color;
      ctx.beginPath(); ctx.arc(0, 0, size * .42, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFallSpeedLines(timestamp) {
    const slime = run.slime;
    const speed = descentSpeedRatio(run, normalFallSpeedLimit());
    if (speed <= 1.0001 || menuReducedMotion || run.portalEntry || run.coreEncounter || run.evacuation) return;
    const intensity = .27 + .73 * clamp((speed - 1) / (FALL_MOMENTUM.max - 1), 0, 1) ** .68;
    const count = isLowPowerDevice() ? 10 : 14;
    const y = slime.y - run.cameraY;
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i += 1) {
      const phase = (timestamp * .0044 + i * .618) % 1;
      const length = 16 + intensity * (29 + (i % 3) * 12);
      const side = i % 2 === 0 ? -1 : 1;
      const spread = (Math.floor(i / 2) % 7) / 6;
      const x = slime.x + side * (slime.radius * (.76 + spread * .63) + 4) - slime.vx * phase * .082;
      const head = y + slime.radius * 1.4 - phase * (108 + intensity * 52);
      const alpha = Math.sin(phase * Math.PI) * intensity * (.46 + (i % 3) * .19);
      const width = 1.4 + (i % 3) * .65;
      ctx.beginPath();
      ctx.moveTo(x, head);
      ctx.lineTo(x - slime.vx * length / 720, head - length);
      ctx.strokeStyle = '#6ad9ff';
      ctx.globalAlpha = alpha * .36;
      ctx.lineWidth = width + 3;
      ctx.stroke();
      ctx.strokeStyle = '#effcff';
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.stroke();
    }
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
      const slimeOverlay = effect.type === 'essenceCollect'||effect.type==='heal';
      if (slimeOverlay !== overlayOnly) continue;
      const progress = 1 - clamp(effect.life / effect.maxLife, 0, 1);
      const alpha = Math.pow(1 - progress, .94);
      const y = effect.y - run.cameraY;
      if (['blockBreak','blockAsh','rockSpeedImpact','rockContact','essenceCollect','frostTouch','frostPulse','firePulse','freeze','cryo','heal','bomb','electricShock','electricDashBurst'].includes(effect.type)
          && (y < -200 || y > VIEW_H + 200)) continue;
      ctx.save();
      if (['blockBreak','blockAsh','rockSpeedImpact','rockContact','essenceCollect'].includes(effect.type)) {
        window.SlimeBlockBreakFeedback.drawImpact(ctx,effect,run.cameraY);
      } else if (effect.type === 'snowballKnockback') {
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
        window.SlimeMutationImpacts.frostTouch(ctx,effect,run.cameraY,run.cellSize,isLowPowerDevice());
      } else if (effect.type === 'snowShard') {
        window.SlimeMutationImpacts.frostShard(ctx,effect,run.cameraY,run.cellSize);
      } else if (effect.type === 'electricShock') {
        window.SlimeMutationImpacts.electricShock(ctx, effect.x, y, effect.width, effect.height,
          (effect.maxLife - effect.life) * 1000, effect.power, effect.seed, menuReducedMotion);
      } else if (effect.type === 'electricDashBurst') {
        window.SlimeMutationImpacts.burst(ctx, 'electric', effect.x, y, run.cellSize * 2.25,
          progress, menuReducedMotion || isLowPowerDevice());
      } else if (effect.type === 'electricArc') {
        window.SlimeMutationImpacts.electricChain(ctx,effect,run.cameraY,run.cellSize);
      } else if (effect.type === 'frostPulse') {
        window.SlimeMutationImpacts.frostTouch(ctx,effect,run.cameraY,run.cellSize,isLowPowerDevice());
      } else if (effect.type === 'firePulse') {
        window.SlimeMutationImpacts.burst(ctx,'fire',effect.x,y,run.cellSize*2.4,progress,isLowPowerDevice());
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
        window.SlimeMutationImpacts.burst(ctx,'cosmos',effect.x,y,run.cellSize*3,progress,isLowPowerDevice());
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
      } else if (effect.type === 'bomb') {
        const frame = progress < .13 ? 1 : progress < .33 ? 2 : progress < .7 ? 3 : 4;
        const frameAlpha = frame === 4 ? alpha * .9 : Math.min(1, alpha * 1.16);
        const frameSize = (frame === 1 ? 176 : frame === 2 ? 194 : frame === 3 ? 220 : 204) * (effect.scale || 1);
        if (!drawVfxSprite(`bomb-${frame}`, effect.x, y, frameSize, frameSize, frameAlpha, -.035 + progress * .07)) {
          ctx.globalAlpha = alpha * .8;
          ctx.fillStyle = frame < 3 ? '#ff5647' : '#ffad3d';
          ctx.beginPath(); ctx.arc(effect.x, y, (25 + progress * 55) * (effect.scale || 1), 0, Math.PI * 2); ctx.fill();
        }
      } else if (effect.type === 'heal') {
        const heart=projectSprite(window.SlimeEnergyPickups.ASSET);
        const pop=1-Math.pow(1-clamp(progress/.22,0,1),3);
        const size=run.cellSize*(.55+pop*.95)*(1-progress*.12);
        const targetX=run.slime.x,targetY=run.slime.y-run.cameraY-run.slime.radius-20-progress*48;
        ctx.globalAlpha=clamp(progress/.06,0,1)*Math.pow(1-progress,1.25);
        if(heart.complete&&heart.naturalWidth)ctx.drawImage(heart,targetX-size/2,targetY-size/2,size,size);
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
        window.SlimeMutationImpacts.burst(ctx,'electric',effect.x,y,run.cellSize*1.2,progress,isLowPowerDevice());
      } else if (effect.type === 'shieldBurst') {
        window.SlimeMutationImpacts.burst(ctx,'electric',effect.x,y,run.cellSize*2.8,progress,isLowPowerDevice());
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
        window.SlimeMutationImpacts.frostTouch(ctx,{...effect,x:run.slime.x,y:run.slime.y},run.cameraY,run.cellSize,isLowPowerDevice());
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

  function drawLaunchEntryPortal(world, timestamp, layer='back') {
    if(!run.launchEntryUntil||timestamp>=run.launchEntryUntil)return;
    const age=timestamp-run.launchEntryStartedAt;
    const duration=Math.max(1,run.launchEntryUntil-run.launchEntryStartedAt);
    const closing=clamp((age/duration-.66)/.34,0,1);
    const open=1-closing*closing*(3-2*closing);
    window.SlimePortalWindow.draw(ctx,{x:run.startX,y:run.arrivalPortalScreenY||160,
      width:116,height:116,timestamp:age,scene:'lab',open,alpha:1,
      reduced:menuReducedMotion,power:1-clamp(age/500,0,1),layer});
    if(layer==='front'&&!menuReducedMotion&&age<760){
      const y=run.arrivalPortalScreenY||160;
      window.SlimePortalWindow.launchParticles(ctx,{x:run.startX,y,radius:52,
        progress:age/760,trailY:clamp(run.slime.y-run.cameraY-y,0,104),arrival:true});
    }
  }

  function drawBackground(world, timestamp) {
    const stagedLayers = ensureWorldBackgroundLayers(world.id, run.backgroundStage);
    const layers = stagedLayers.every(({ image }) => image.complete && image.naturalWidth)
      ? stagedLayers : ensureWorldBackgroundLayers(world.id, 0);
    window.SlimeWorldBackground.draw(ctx, {
      layers, width: VIEW_W,
      height: VIEW_H, cameraY: run.cameraY,padding:run.coreEncounter?40:0
    });

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

    const depth = (run.endlessDepthOffset || 0) + Math.max(0, Math.min(run.world.targetDepth,
      Math.floor((run.cameraY + 20 - 285) / (run.rowCount * run.cellSize) * run.world.targetDepth)));
    ctx.fillStyle = 'rgba(11,10,18,.42)';
    roundedRect(ctx, 10, 10, 72, 25, 12);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '900 11px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${depth} м`, 46, 27);
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
    if(run.coreArena){CORE.drawCore(ctx,run,timestamp);return;}
    const portal=getPortalGeometry(),y=portal.y-run.cameraY;
    if(y< -150||y>VIEW_H+150)return;
    window.SlimePortalWindow.draw(ctx,{x:portal.x,y,width:152,height:152,timestamp,
      scene:'lab',reduced:menuReducedMotion,power:run.portalEntry ? .6 : 0});
  }

  function drawPhantomMarkedBlock(block, sy, timestamp) {
    window.SlimePhantomEffects.cracks(ctx,block,sy,timestamp);
  }

  function glitchPixelTile(block, sy, timestamp) {
    if (glitchTileCacheRun !== run) { glitchTileCache.clear(); glitchTileCacheRun = run; }
    let tile = glitchTileCache.get(block);
    const size = Math.ceil(block.w);
    if (!tile) {
      if (glitchTileCache.size >= 96) glitchTileCache.delete(glitchTileCache.keys().next().value);
      const base = document.createElement('canvas'), pixels = document.createElement('canvas');
      base.width = base.height = pixels.width = pixels.height = size;
      tile = { base, pixels, baseCtx: base.getContext('2d'), pixelCtx: pixels.getContext('2d'), key: '', step: -1, captured: false };
      glitchTileCache.set(block, tile);
    }
    const key = [block.tier, block.material, block.hp, block.flaskTier, block.hazard, block.special,
      block.frozen, block.elementalSnow, block.elementalSnowflake, block.elementalGolden, block.visualId].join(':');
    const fullyVisible = sy >= 0 && sy + block.h <= VIEW_H;
    if (tile.key !== key || (!tile.captured && fullyVisible)) {
      tile.baseCtx.clearRect(0, 0, size, size);
      if (fullyVisible) {
        const dpr = ctx.canvas.width / VIEW_W;
        // Snapshot only when artwork changes, not for every block on every frame.
        tile.baseCtx.drawImage(ctx.canvas, block.x * dpr, sy * dpr, block.w * dpr, block.h * dpr, 0, 0, size, size);
      } else {
        const name = block.hazard ? 'stone-hazard' : block.tier === 'reinforced' ? 'stone-reinforced' : block.tier === 'hard' ? 'stone' : 'ground-weak';
        const sprite = WORLD_SPRITES[run.worldId]?.[name];
        if (sprite?.complete && sprite.naturalWidth) tile.baseCtx.drawImage(sprite, 0, 0, size, size);
        const veinName = block.flaskTier >= 3 ? 'stone-reinforced-liquid' : block.flaskTier === 2 ? 'stone-liquid' : 'ground-weak-liquid';
        const vein = block.flaskTier && WORLD_SPRITES[1]?.[veinName];
        if (vein?.complete && vein.naturalWidth) tile.baseCtx.drawImage(vein, 0, 0, size, size);
      }
      tile.key = key; tile.captured = fullyVisible; tile.step = -1;
    }
    const step = menuReducedMotion ? 0 : Math.floor(timestamp / 90);
    if (tile.step !== step) {
      tile.pixelCtx.clearRect(0, 0, size, size);
      window.BlockEffectDraft.drawGlitchBlock(tile.pixelCtx, tile.base, 0, 0, size, timestamp, block.id);
      tile.step = step;
    }
    return tile.pixels;
  }

  function drawGlitchBlockOverlay(block, sy, timestamp) {
    const { x, w, h } = block;
    const deleting = block.glitchDeleteAt > timestamp;
    const neutralized = block.glitchNeutralized && !block.glitchDisarming;
    const dispersing = !block.glitchInfected && block.glitchDisperseUntil > timestamp;
    ctx.save();
    ctx.globalAlpha = dispersing ? clamp((block.glitchDisperseUntil - timestamp) / 420, 0, 1) : 1;
    if (!neutralized) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(glitchPixelTile(block, sy, timestamp), x, sy, w, h);
      if (block.glitchInfected) window.SlimeGlitchFeedback.infected(ctx, block, sy, timestamp, menuReducedMotion || isLowPowerDevice());
      if (block.glitchHackingUntil > timestamp) {
        ctx.fillStyle = 'rgba(79,255,142,.22)';
        ctx.fillRect(x + 4, sy + 4, w - 8, h - 8);
        ctx.fillStyle = '#81ffab';
        ctx.font = `800 ${Math.max(9, w * .15)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('01 10 01', x + w / 2, sy + h * .58);
      }
    }
    if (neutralized) {
      const size = Math.max(22, w * .43);
      const bx = x + (w - size) / 2, by = sy + (h - size) / 2;
      ctx.fillStyle = '#123d2a';
      ctx.fillRect(bx, by, size, size);
      ctx.strokeStyle = '#64ff91';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(bx, by, size, size);
      ctx.lineWidth = Math.max(3, size * .13);
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(bx + size * .22, by + size * .51);
      ctx.lineTo(bx + size * .43, by + size * .72);
      ctx.lineTo(bx + size * .79, by + size * .29);
      ctx.stroke();
    } else if (deleting) {
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `1000 ${Math.max(10, w * .18)}px system-ui`;
      ctx.fillText('ERROR', x + w / 2, sy + h / 2);
    }
    ctx.restore();
  }

  function drawGlitchShock(timestamp) {
    if (!run.glitchShock) return;
    if (timestamp - run.glitchShock.startedAt >= 440) { run.glitchShock = null; return; }
    window.SlimeGlitchFeedback.shock(ctx, run, timestamp, menuReducedMotion || isLowPowerDevice());
  }

  function drawGlitchScreenEffect(timestamp) {
    const effect = run.glitchScreen;
    if (!effect) return;
    if (timestamp >= effect.until) { run.glitchScreen = null; return; }
    if (effect.kind === 'passive') {
      window.SlimeGlitchFeedback.screen(ctx, VIEW_W, VIEW_H, timestamp, effect, menuReducedMotion || isLowPowerDevice());
      return;
    }
    const age = timestamp - effect.startedAt;
    const fade = Math.min(1, age / 120) * clamp((effect.until - timestamp) / 450, 0, 1);
    const hack = effect.kind === 'hack';
    const reduced = menuReducedMotion;
    const bands = reduced ? 2 : isLowPowerDevice() ? 6 : 10;
    const frame = reduced ? 0 : Math.floor(age / 100);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = hack ? 'rgba(3,29,17,.15)' : 'rgba(23,5,39,.15)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    for (let i = 0; i < bands; i++) {
      const seed = (i * 137 + frame * 61) >>> 0;
      const y = seed % VIEW_H;
      ctx.fillStyle = hack ? 'rgba(81,255,142,.26)' : i % 2 ? 'rgba(255,65,219,.28)' : 'rgba(41,239,255,.3)';
      ctx.fillRect(seed % 63, y, VIEW_W - seed % 93, 2 + seed % 9);
      if (hack) {
        ctx.fillStyle = '#78ffa6';
        ctx.font = '800 12px monospace';
        ctx.fillText(i % 2 ? '0101 1100 0110' : '1010 0011 1001', 12 + seed % 100, y + 15);
      }
    }
    const scanY = (age / (effect.until - effect.startedAt)) * VIEW_H;
    ctx.fillStyle = hack ? 'rgba(107,255,161,.42)' : 'rgba(122,248,255,.38)';
    ctx.fillRect(0, scanY, VIEW_W, reduced ? 2 : 5);
    ctx.strokeStyle = hack ? '#58ff95' : '#61f4ff';
    ctx.lineWidth = 3; ctx.strokeRect(2, 2, VIEW_W - 4, VIEW_H - 4);
    ctx.restore();
  }

  function drawPhantomBursts(timestamp) {
    run.phantomBursts=run.phantomBursts.filter(b=>timestamp-b.startedAt<PHANTOM_BURST_MS);
    for(const burst of run.phantomBursts)window.SlimePhantomEffects.burst(ctx,burst,run.cameraY,run.cellSize,timestamp);
  }

  function drawRockUnderPressure(block, sy, timestamp) {
    const pose = block.rockBreakPose;
    const age = timestamp - pose.at;
    if (age < 0 || age >= pose.duration) return;
    const t = menuReducedMotion ? 0 : 1 - (1 - age / pose.duration) ** 2;
    const x = block.x + block.w * .5, y = sy + block.h * .5;
    const sideways = Math.abs(pose.nx) > Math.abs(pose.ny);
    ctx.save();
    ctx.translate(x - pose.nx * block.w * .10 * t, y - pose.ny * block.h * .10 * t);
    ctx.scale(1 - t * (sideways ? .21 : .04), 1 - t * (sideways ? .04 : .24));
    ctx.translate(-x, -y);
    drawBlock(block, sy, timestamp, pose.hpRatio);
    ctx.restore();
  }

  function drawBlock(block, sy, timestamp, hpRatio = clamp(block.hp / block.maxHp, 0, 1)) {
    const color = materialColor(block.material, run.world, hpRatio);
    const special = block.special;
    const tier = block.tier || 'dense';
    ctx.save();
    const shockAge = timestamp - (block.electricFlashStartedAt ?? -Infinity);
    if (!menuReducedMotion && shockAge >= 0 && shockAge < 255) {
      const force = Math.exp(-shockAge / 86) * (block.electricShockPower || 1);
      ctx.translate(Math.sin(shockAge / 6.5) * force * 4.35, Math.sin(shockAge / 9.2) * force * 2.45);
    }

    if(block.fungi&&window.SlimeFungiHazards.drawBlock(ctx,run,block,sy,menuReducedMotion||graphicsBudget<.8||isLowPowerDevice())){drawBlockElementalOverlay(block,sy,timestamp);ctx.restore();return;}
    if(block.ice&&window.SlimeIceHazards.drawBlock(ctx,run,block,sy)){drawBlockElementalOverlay(block,sy,timestamp);ctx.restore();return;}
    if(block.water&&window.SlimeWaterHazards.drawBlock(ctx,run,block,sy)){drawBlockElementalOverlay(block,sy,timestamp);ctx.restore();return;}
    if(block.tech&&window.SlimeTechHazards.drawBlock(ctx,run,block,sy,menuReducedMotion)){
      drawBlockElementalOverlay(block,sy,timestamp);ctx.restore();return;
    }
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

      if (!drawCrackStage(block, sy, hpRatio, timestamp) && crackStageFor(hpRatio)) drawCracks(block, sy, hpRatio);
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

  const elementalBlockCanvas = document.createElement('canvas');
  const elementalBlockCtx = elementalBlockCanvas.getContext('2d');
  const elementalBlockSprite = document.createElement('canvas');
  const elementalBlockSpriteCtx = elementalBlockSprite.getContext('2d');
  function prepareElementalBlockCanvas(size) {
    const pixels = Math.ceil(size);
    if (elementalBlockCanvas.width !== pixels) elementalBlockCanvas.width = elementalBlockCanvas.height = pixels;
    else elementalBlockCtx.clearRect(0, 0, pixels, pixels);
    if (elementalBlockSprite.width !== pixels) elementalBlockSprite.width = elementalBlockSprite.height = pixels;
    else elementalBlockSpriteCtx.clearRect(0, 0, pixels, pixels);
  }

  function burnedBlockFace(block, sy, timestamp, visual = worldBlockArtwork(block, timestamp)) {
    if (!visual?.sprite?.complete || !visual.sprite.naturalWidth) return null;
    const {x, y, width, height} = worldBlockSpriteRect(block, sy, visual);
    return {sprite: visual.sprite, x, y, width, height};
  }

  function fireCharringProgress(block, timestamp) {
    const remaining = block.fireDamageAt - timestamp;
    if (block.hp > 1 || !(remaining > 0)) return 0;
    const span = Math.min(FIRE_FINAL_BURN_MS, Math.max(1, block.fireDamageAt - block.fireIgnitedAt));
    return 1 - clamp(remaining / span, 0, 1);
  }

  function drawBlockElementalOverlay(block, sy, timestamp) {
    window.SlimeBrambleObstacles.drawBlock(ctx,run,block,sy,timestamp,menuReducedMotion);
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
      const ignite = smoothFireVisual(age / 51);
      const release = smoothFireVisual(((block.fireFlashUntil || timestamp) - timestamp) / 190);
      const char = fireCharringProgress(block, timestamp);
      prepareElementalBlockCanvas(w);
      window.BlockEffectDraft.drawBurningBlock(elementalBlockCtx, 0, 0, w, timestamp, block.id);
      ctx.globalAlpha = ignite * release * (1 - char * .68);
      ctx.drawImage(elementalBlockCanvas, 0, 0, w, w, x, sy, w, h);
      ctx.globalAlpha = 1;
    }

    if (timestamp >= (block.electricFlashStartedAt || 0) && timestamp < (block.electricFlashUntil || 0)) {
      window.SlimeMutationImpacts.electricHit(ctx,block,sy,timestamp,menuReducedMotion);
    }
    ctx.restore();
  }

  function crackStageFor(hpRatio) {
    const damageRatio = 1 - clamp(hpRatio, 0, 1);
    if (damageRatio >= .75) return 3;
    if (damageRatio >= .5) return 2;
    if (damageRatio > .001) return 1;
    return 0;
  }

  function drawCrackStage(block, sy, hpRatio, timestamp) {
    const stage = crackStageFor(hpRatio);
    if (block.visualCrackStage !== stage) {
      const previous = block.visualCrackStage;
      block.visualCrackStage = stage;
      block.visualCrackChangedAt = block.visualCrackAt ?? (previous === undefined || previous > stage ? timestamp - 280 : timestamp);
    }
    if (!stage || !window.BlockEffectDraft?.drawCrackedBlock) return false;
    window.BlockEffectDraft.drawCrackedBlock(ctx, block.x, sy, block.w, stage,
      timestamp, block.visualCrackChangedAt, block.id);
    return true;
  }

  function drawSpecialBlockAura(block, sy) {
    const auraKey = block.hazard ? 'hazard' : block.special;
    if (block.hazard && run.sharedDescent) return;
    // The red heart is its own healing signal. Keep its stone colours clean.
    if (auraKey !== 'hazard') return;
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

  function worldBlockArtwork(block, timestamp) {
    if (block.special === 'boss') return null;
    let spriteName;
    const frostTransformed = block.elementalSnow || block.elementalSnowflake;
    const frostProgress = frostTransformed && block.frostTransformStartedAt
      ? clamp((timestamp - block.frostTransformStartedAt) / (block.frostTransformDuration || 470), 0, 1)
      : frostTransformed ? 1 : 0;
    const frostIsPrimary = frostTransformed && frostProgress >= .995;
    const firstWorldSpikeEnemy = block.hazard && run.sharedDescent && !frostTransformed;
    if (frostIsPrimary && block.elementalSnowflake) spriteName = 'snowflake';
    else if (frostIsPrimary && block.elementalSnow) spriteName = 'snow-packed';
    else if (firstWorldSpikeEnemy) spriteName = 'stone-hazard';
    else if (block.hazard && run.worldId === 2) spriteName = 'ice-spikes';
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
    } else if (run.worldId === 5) {
      spriteName = block.tier === 'reinforced' ? 'desert-bedrock' : block.tier === 'hard' ? 'sandstone' : 'sand';
    } else if (run.worldId === 6) {
      spriteName = block.tier === 'reinforced' ? 'stone-reinforced' : block.tier === 'hard' ? 'stone' : 'ground-weak';
    } else if (run.worldId === 1) {
      if (block.tier === 'soft') spriteName = 'dirt-grass';
      else if (block.tier === 'dense') spriteName = 'ground-weak';
      else if (block.tier === 'hard') spriteName = 'stone';
      else spriteName = 'stone-reinforced';
    } else if (block.tier === 'reinforced') spriteName = 'stone-reinforced';
    else if (block.tier === 'hard') spriteName = 'stone';
    else if (block.tier === 'soft') spriteName = 'dirt-grass';
    else spriteName = 'stone';

    // Each resource tier has its own infected face; rewards stay 1 / 3 / 5.
    const liquidVeinName = (run.embeddedVeins || run.worldId === 2 || block.glitchReward) && block.flaskTier && !block.special && !block.hazard
      ? block.flaskTier >= 3 ? 'stone-reinforced-liquid'
        : block.flaskTier === 2 ? 'stone-liquid' : 'ground-weak-liquid'
      : null;

    const contentId = block.frozen
      ? 'dense'
      : block.visualId || (block.special === 'gel' ? 'heal' : block.special || (block.hazard ? 'hazard' : block.tier));
    const edited = frostIsPrimary ? null : contentBlock(run.worldId, contentId);
    if (!firstWorldSpikeEnemy && edited?.type === 'custom' && edited.sprite) spriteName = edited.sprite;
    const oreArtwork = !block.frozen && (block.tier === 'ore' || block.frozenOre) ? edited?.oreTextures?.[block.oreType?.id || 'coal'] : null;
    const artwork = oreArtwork?.image ? oreArtwork : edited;
    const customSprite = firstWorldSpikeEnemy ? null : artwork?.image ? projectSprite(artwork.image) : null;
    const sprites = frostIsPrimary ? ensureWorldSprites(2) : WORLD_SPRITES[run.worldId];
    const pandoraSprite = block.special === 'pandora' ? VFX_SPRITES?.['pandora-box'] : null;
    const sprite = pandoraSprite?.complete && pandoraSprite.naturalWidth
      ? pandoraSprite
      : customSprite?.complete && customSprite.naturalWidth ? customSprite : sprites?.[spriteName];
    return {sprite, spriteName, artwork, customSprite, frostIsPrimary, frostTransformed, frostProgress,
      firstWorldSpikeEnemy, liquidVeinName};
  }

  function worldBlockSpriteRect(block, sy, visual) {
    const {firstWorldSpikeEnemy, artwork, customSprite} = visual;
    const gutter = [1, 6].includes(run.worldId) && !firstWorldSpikeEnemy ? 0 : .5;
    const scale = firstWorldSpikeEnemy ? .92 : customSprite ? (artwork.scale || 1) : 1;
    const width = Math.max(1, block.w * scale - gutter * 2);
    const height = Math.max(1, block.h * scale - gutter * 2);
    const offsetX = customSprite ? block.w * (artwork.x || 0) / 100 : 0;
    const offsetY = customSprite ? block.h * (artwork.y || 0) / 100 : 0;
    return {gutter, width, height, offsetX, offsetY, x: block.x + (block.w - width) / 2 + offsetX,
      y: sy + (block.h - height) / 2 + offsetY};
  }

  function drawWorldSprite(block, sy, hpRatio, timestamp = performance.now()) {
    const visual = worldBlockArtwork(block, timestamp);
    if (!visual?.sprite?.complete || !visual.sprite.naturalWidth) return false;
    const {sprite, spriteName, customSprite, frostIsPrimary, frostTransformed, frostProgress,
      firstWorldSpikeEnemy, liquidVeinName} = visual;
    const {gutter, width, height, offsetX, offsetY, x: drawX, y: drawY} = worldBlockSpriteRect(block, sy, visual);
    ctx.globalAlpha = 1;
    if (firstWorldSpikeEnemy) {
      if(run.worldId===1&&(block.motion||block.chase)&&window.SlimeThornHazards.draw(ctx,block,sy,width,timestamp,menuReducedMotion))return true;
      const hover = Math.sin(timestamp / 430 + block.id * .7) * 1.35;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';
      ctx.filter = 'none';
      ctx.drawImage(sprite, drawX, drawY - hover - 1.5, width, height);
      ctx.restore();
      return true;
    }
    let char = fireCharringProgress(block, timestamp);
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
      if (char > 0) window.SlimeBlockBreakFeedback.drawChar(ctx, {sprite, x: -width / 2, y: -height / 2, width, height}, char);
      ctx.restore();
      char = 0;
    } else {
      if(run.worldId===6&&!block.hazard&&!block.special&&!customSprite&&!frostIsPrimary){
        // Asteroid sprites have rounded transparent corners. Back their entire
        // cell with matching opaque rock so the cave never peeks through joints.
        ctx.fillStyle=spriteName==='stone-reinforced'?'#35264d':spriteName==='stone'?'#634181':'#9c7abe';
        const transform=ctx.getTransform(),sx=Math.abs(transform.a)||1,dy=Math.abs(transform.d)||1;
        const left=(Math.floor(drawX*sx+transform.e)-transform.e)/sx,top=(Math.floor(drawY*dy+transform.f)-transform.f)/dy;
        const right=(Math.ceil((drawX+width)*sx+transform.e)-transform.e)/sx,bottom=(Math.ceil((drawY+height)*dy+transform.f)-transform.f)/dy;
        ctx.fillRect(left,top,right-left,bottom-top);
      }
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
    if(frostTransformed)window.SlimeMutationImpacts.freezeBlock(ctx,block,sy,timestamp);
    // Keep resource identity readable after transformations; reward is unchanged.
    ctx.globalAlpha = 1;
    const liquidVeins = liquidVeinName && (WORLD_SPRITES[run.worldId]?.[liquidVeinName] || WORLD_SPRITES[1]?.[liquidVeinName]);
    if (liquidVeins?.complete && liquidVeins.naturalWidth) {
      const face = liquidVeins;
      ctx.drawImage(face, drawX, drawY, width, height);
    }
    drawSpecialBlockAura(block, sy);
    drawCrackStage(block, sy, hpRatio, timestamp);
    if (char > 0) window.SlimeBlockBreakFeedback.drawChar(ctx, {sprite, x: drawX, y: drawY, width, height}, char);

    return true;
  }

  function drawBlockTransitions(visibleBlocks) {
    const liveBlocks = new Map();
    for (const block of visibleBlocks) {
      // Floating round enemies are not stone tiles and must not acquire square seams.
      if ((block.hazard && run.sharedDescent)||block.bramble) continue;
      liveBlocks.set(`${block.row}:${block.col}`, block);
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
      if ([1,6].includes(run.worldId)) {
        // Keep cells readable without boxing each material into a dark frame.
        if (right) {
          ctx.fillStyle = block.tier === right.tier ? 'rgba(20,26,35,.10)' : 'rgba(20,26,35,.28)';
          ctx.fillRect(block.x + block.w - .25, sy, .5, block.h);
        }
        if (below) {
          ctx.fillStyle = block.tier === below.tier ? 'rgba(20,26,35,.10)' : 'rgba(20,26,35,.28)';
          ctx.fillRect(block.x, sy + block.h - .25, block.w, .5);
        }
      } else {
        if (right) ctx.fillRect(block.x + block.w - .5, sy, 1, block.h);
        if (below) ctx.fillRect(block.x, sy + block.h - .5, block.w, 1);
      }
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
    ctx.strokeStyle = '#fff2bd';
    ctx.lineWidth = Math.max(2.8, block.w * .045);
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i += 1) {
      const angle = i / count * Math.PI * 2 + block.id;
      const lengthX = block.w * (.28 + ((block.id * 17 + i * 11) % 11) / 65);
      const lengthY = block.h * (.20 + ((block.id * 13 + i * 7) % 8) / 60);
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
    if(els.slime.classList.contains('intro-friendly'))return 'joy';
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
    const levels = { fire: 0, frost: 0, electric: 0, cosmos: 0, nano: 0, telekinesis: 0, cloning: 0, phantom: 0, glitch: 0, infinity: 0, mass: 0 };
    const food = session?.foods?.[0];
    if (food) {
      const id = mutationIdForFamily(foodRecipeFamily(food));
      if (Object.hasOwn(levels, id)) levels[id] = mutationLevel(id);
    }
    return levels;
  }

  function clearMenuMutationPresentation() {
    if (menuMutationReveal) clearTimeout(menuMutationReveal.timer);
    menuMutationReveal = null;
    els.slime?.classList.remove('mutation-evolving', 'form-discovering');
    const sequence = formDiscoverySequence;
    formDiscoverySequence = null;
    if (sequence) {
      sequence.timers.forEach(clearTimeout);
      sequence.animation?.cancel();
      sequence.nodes.forEach(node => node.remove());
      updateFormIndexBadge();
    }
  }

  function revealMenuMutation({ quick = false, appearance } = {}) {
    const levels = menuCategoryLevels();
    const changed = Object.keys(levels).find(key => levels[key] !== menuCategoryVisual[`${key}Target`]);
    if (!changed) return 0;
    const ultra = !quick && levels[changed] === 3 && menuCategoryVisual[`${changed}Target`] < 3;
    const accent = FORM_INDEX.find(form => form.id === changed)?.color || '#a9eaff';
    const now = performance.now();
    const silhouetteSource = drawMenuSlime(now, ultra);
    menuMutationReveal = window.MenuMutationReveal.create(els.menuSlimeCanvas,
      { now, ultra, quick, accent, reducedMotion: menuReducedMotion, silhouetteSource });
    const reveal = menuMutationReveal;
    reveal.assetsReady = false;
    (appearance || preloadMenuAppearance(levels)).then(() => { reveal.assetsReady = true; }, () => { reveal.assetsReady = true; });
    syncMenuCategoryVisuals({ instant: true });
    els.slime.classList.add(ultra ? 'form-discovering' : 'mutation-evolving');
    syncWorldStartButton();
    if (ultra) { sound('epic'); feedback([7, 25, 12]); }
    const finishReveal = () => {
      if (menuMutationReveal !== reveal) return;
      // Background tabs do not run requestAnimationFrame; complete on resuming.
      drawMenuSlime(performance.now());
      if (!reveal.finished) { reveal.timer = setTimeout(finishReveal, 80); return; }
      menuMutationReveal = null;
      els.slime.classList.remove('mutation-evolving', 'form-discovering');
      if (document.body.dataset.screen === 'home') drawMenuSlime(performance.now());
      releaseConveyorControl();
      queueTutorialRender();
    };
    reveal.timer = setTimeout(finishReveal, reveal.duration);
    return reveal.duration;
  }

  function syncMenuCategoryVisuals({ instant = false } = {}) {
    const levels = menuCategoryLevels();
    const now = performance.now();
    for (const key of Object.keys(levels)) {
      menuCategoryVisual[`${key}From`] = instant ? levels[key] : menuCategoryVisual[key];
      menuCategoryVisual[`${key}Target`] = levels[key];
      menuCategoryVisual[`${key}StartedAt`] = now;
      if (instant) menuCategoryVisual[key] = levels[key];
    }
  }

  function updateMenuCategoryVisuals(timestamp) {
    for (const key of ['fire', 'frost', 'electric', 'cosmos', 'nano', 'telekinesis', 'cloning', 'phantom', 'glitch', 'infinity', 'mass']) {
      const from = menuCategoryVisual[`${key}From`];
      const target = menuCategoryVisual[`${key}Target`];
      if (menuReducedMotion || Math.abs(target - from) < .001) {
        menuCategoryVisual[key] = target;
        continue;
      }
      const duration = key === 'mass' ? 620 : key === 'frost' ? 600 : key === 'electric' ? 520 : 540;
      const progress = clamp((timestamp - menuCategoryVisual[`${key}StartedAt`]) / duration, 0, 1);
      const eased = key === 'mass'
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
    frost: '#48cfff',
    cosmos: '#b45cff',
    electric: '#ffd83d',
    fire: '#ff7426'
  });

  function drawUltraFormAccents(target, x, y, radius, form, amount, timestamp) {
    if (!form || amount < .01) return;
    target.save();
    target.globalAlpha = amount;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    const phase = timestamp / 700;

    if (form === 'fire') {
      const palette = ['#fff09a', '#ff9b24', '#ff4a23'];
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
    }
    target.restore();
  }

  function elementalBodyVariant(levels = {}) {
    return levels.frost >= 3 ? 'frostUltra' : levels.cosmos >= 3 ? 'cosmosUltra'
      : levels.nano >= 3 ? 'technoUltra' : levels.electric >= 3 ? 'electricUltra'
      : levels.fire >= 3 ? 'fireUltra' : levels.telekinesis >= 3 ? 'psionicsUltra'
      : levels.phantom >= 3 ? 'phantomUltra' : levels.cloning >= 3 ? 'sporesUltra'
      : levels.glitch >= 3 ? 'glitchUltra' : levels.cosmos >= 2 ? 'cosmosPetrifying'
      : levels.glitch >= 2 ? 'glitchArcade'
      : levels.phantom >= 2 ? 'phantomShifting'
      : levels.telekinesis >= 2 ? 'psionicsCrowned'
      : levels.nano >= 2 ? 'technoUpgraded'
      : levels.electric >= 2 ? 'electricCharged'
      : levels.frost >= 2 ? 'frostFreezing'
      : levels.fire >= 2 ? 'fireVolcano' : levels.cloning >= 2 ? 'sporesStage2'
      : levels.cloning ? 'sporesStage1'
      : levels.glitch >= 1 ? 'glitchFragments' : levels.phantom >= 1 ? 'phantomAwakening'
      : levels.telekinesis >= 1 ? 'psionicsBudding'
      : levels.nano >= 1 ? 'technoImplants'
      : levels.electric >= 1 ? 'electricSparks'
      : levels.frost >= 1 ? 'frostChilled'
      : levels.fire >= 1 ? 'fireWarm' : '';
  }

  function preloadMenuAppearance(levels) {
    const bodyVariant = levels.infinity ? 'infinity' : elementalBodyVariant(levels);
    return Promise.all([
      window.SlimeAvatarRenderer.preloadAppearance({ bodyVariant,
        fireEyes: bodyVariant === 'fireUltra', electricEyes: bodyVariant === 'electricUltra',
        frostEyes: bodyVariant === 'frostUltra', cosmosEyes: bodyVariant === 'cosmosUltra',
        sporesEyes: bodyVariant === 'sporesUltra', psionicsEyes: levels.telekinesis >= 3,
        phantomEyes: levels.phantom >= 3, glitchFaceLevel: levels.glitch,
        nanoEyeOpenness: levels.nano >= 2 ? 0 : null }),
      window.MutationEffectDraft.preload(levels),
      levels.telekinesis ? window.SlimePsionicFeedback.preload() : Promise.resolve()
    ]);
  }

  function drawElementalSlimeAvatar(target, options, levels, timestamp) {
    const fireLevel = clamp(Number(levels?.fire) || 0, 0, 3);
    const frostLevel = clamp(Number(levels?.frost) || 0, 0, 3);
    const electricLevel = clamp(Number(levels?.electric) || 0, 0, 3);
    const cosmosLevel = clamp(Number(levels?.cosmos) || 0, 0, 3);
    const nanoLevel = clamp(Number(levels?.nano) || 0, 0, 3);
    const psionicsLevel = clamp(Number(levels?.telekinesis) || 0, 0, 3);
    const sporesLevel = clamp(Number(levels?.cloning) || 0, 0, 3);
    const phantomLevel = clamp(Number(levels?.phantom) || 0, 0, 3);
    const glitchLevel = clamp(Number(levels?.glitch) || 0, 0, 3);
    if ((fireLevel || frostLevel || electricLevel || cosmosLevel || nanoLevel || psionicsLevel
      || sporesLevel || phantomLevel || glitchLevel)
      && window.MutationEffectDraft) {
      const bodyVariant = elementalBodyVariant(levels);
      const motion = psionicsLevel >= 3
        ? window.MutationEffectDraft.psionicsMotion(timestamp, options.radius)
        : { offset: 0, energy: 0 };
      const draftState = {
        x: options.x, y: options.y + motion.offset, baseY: options.y,
        radius: options.radius, timestamp, psionicsEnergy: motion.energy,
        effectDetail: effectDensity(),
        suppressElectricAccents:Boolean(options.suppressElectricAccents),
        volcanoPreview: target !== ctx,
        phantomActive: Boolean(options.phantomActive),
        bodyTransform: {rotation:options.rotation||0,scaleX:options.scaleX??1,scaleY:options.scaleY??1},
        // Gameplay draws the real drones separately so their position also drives shots.
        levels: { fire: fireLevel, frost: frostLevel, electric: electricLevel, cosmos: cosmosLevel,
          telekinesis: psionicsLevel, cloning: sporesLevel, phantom: phantomLevel, glitch: glitchLevel, nano: 0 }
      };
      const previewOrbits = target !== ctx && target !== menuSlimeCtx && cosmosLevel && !options.silhouetteOnly
        ? {x:options.x,y:draftState.y,radius:options.radius,level:cosmosLevel,clock:timestamp,compact:true,alpha:options.alpha??1} : null;
      if (previewOrbits) window.SlimeCosmosOrbits.draw(target, previewOrbits, false);
      window.MutationEffectDraft.drawBehind(target, draftState);
      drawSlimeAvatar(target, {
        ...options,
        y: draftState.y,
        bodyVariant,
        fireEyes: bodyVariant === 'fireUltra',
        electricEyes: bodyVariant === 'electricUltra',
        frostEyes: bodyVariant === 'frostUltra',
        cosmosEyes: bodyVariant === 'cosmosUltra',
        glitchEyes: bodyVariant === 'glitchUltra',
        glitchFaceLevel: glitchLevel,
        psionicsEyes: psionicsLevel >= 3,
        phantomEyes: phantomLevel >= 3,
        ghostAura: !options.silhouetteOnly && phantomLevel >= 1
          ? (options.phantomActive ? 1 : phantomLevel >= 3 ? .85 : phantomLevel >= 2 ? .67 : .48) : 0,
        sporesEyes: bodyVariant === 'sporesUltra',
        nanoEyeOpenness: nanoLevel >= 2 ? 0 : null,
        irisTint: bodyVariant === 'frostUltra' ? '#3a9fff' : bodyVariant === 'cosmosUltra' ? '#a576ff'
          : bodyVariant === 'technoUltra' ? '#f04a55' : bodyVariant === 'electricUltra' ? '#ffd84e'
          : bodyVariant === 'fireUltra' ? '#ff9a22' : bodyVariant === 'psionicsUltra' ? '#8d5cff'
          : bodyVariant === 'sporesUltra' ? '#ce782f' : bodyVariant === 'glitchUltra' ? '#d8ff50' : '',
        cheekFilter: frostLevel ? 'hue-rotate(195deg) saturate(.85) brightness(1.08) contrast(1.06)' : '',
        mouthStyle: options.mouthStyle || (frostLevel && window.MutationEffectDraft.isFrostBreathing(timestamp) ? 'pursed' : ''),
        bodyFilter: options.bodyFilter || (options.ghostTint ? 'sepia(.45) hue-rotate(105deg) saturate(1.6) brightness(1.3)' : ''),
        outlineColor: options.ghostTint ? '#bdffe8' : options.outlineColor,
        frontLayer: options.frontLayer
      });
      window.MutationEffectDraft.drawFront(target, draftState);
      window.MutationEffectDraft.drawComposite(target, draftState);
      if (previewOrbits) window.SlimeCosmosOrbits.draw(target, previewOrbits, true);
      return;
    }
    const formLevels = {
      fire: fireLevel,
      frost: frostLevel,
      electric: electricLevel,
      cosmos: cosmosLevel,
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
    const eyesVisible = !options.hideFace && !options.blink && !['hurt', 'impact', 'power', 'petting', 'pleased', 'chewing', 'anticipating', 'savoring'].includes(options.emotion);
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
          if (!options.hideFace) drawColdFace(layerTarget, state.radius, frostAmount, timestamp);
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

  let menuEdgeFade;
  function prepareMenuSlimeCanvas() {
    const dpr = Math.min(isLowPowerDevice() ? 1.5 : 2, window.devicePixelRatio || 1);
    const canvas = els.menuSlimeCanvas;
    // Keep the 260-unit drawing space, but rasterize at the displayed size.
    // Reading layout dimensions avoids reallocating for the breathing transform.
    const width = Math.min(1024, Math.max(1, Math.round((canvas.clientWidth || 260) * dpr)));
    const height = Math.min(1024, Math.max(1, Math.round((canvas.clientHeight || 260) * dpr)));
    if (canvas.width === width && canvas.height === height && menuEdgeFade) return false;
    canvas.width = width;
    canvas.height = height;
    menuSlimeCtx.setTransform(width / 260, 0, 0, height / 260, 0, 0);
    menuSlimeCtx.imageSmoothingEnabled = true;
    menuSlimeCtx.imageSmoothingQuality = 'high';
    menuEdgeFade = menuSlimeCtx.createRadialGradient(130, 130, 102, 130, 130, 128);
    menuEdgeFade.addColorStop(0, '#000');
    menuEdgeFade.addColorStop(1, 'transparent');
    return true;
  }

  function drawMenuSlime(timestamp, captureSilhouette = false) {
    const paintStartedAt = performance.now();
    const petPose = window.MenuPetpet.sample(menuPetpet, timestamp);
    if (!petPose.active) els.slime.classList.remove('petting');
    menuSlimeCtx.clearRect(0, 0, 260, 260);
    const menuVisual = updateMenuCategoryVisuals(timestamp);
    const infinity = menuVisual.infinity > 0 && !tutorialActive();
    const categoryVisual = infinity ? {mass:menuVisual.mass} : menuVisual;
    const tapPose=window.SlimeTapEmotions.sample(menuTapEmotion,timestamp);
    const emotion = tapPose.active&&!menuSlimeIsBusy({ignoreModal:true})?tapPose.emotion:menuSlimeEmotion();
    const emotionTime = emotion === 'chewing' && menuChewStartedAt
      ? Math.max(0, timestamp - menuChewStartedAt)
      : 0;
    const blinkPhase = timestamp % 4700;
    const selected = skinById(save.selectedSkin);
    const baseRadius = 70;
    const radius = baseRadius * (1 + categoryVisual.mass * .1);
    const restingBottom = 197;
    const slimeY = restingBottom - radius * .98;
    const menuAvatarOptions = {
      x: 130, y: slimeY, radius, emotion,
      accessory:save.wardrobe?.accessory || 'none',
      skin: selected.id,
      colors: selected.colors,
      gazeX: menuGaze.x, gazeY: menuGaze.y,
      emotionTime,
      blink: emotion === 'focused' && blinkPhase > 4420 && blinkPhase < 4530,
      nanoEyeOpenness: categoryVisual.nano >= 2 ? 0 : null,
      timestamp
    };
    const showAvatar = !menuMutationReveal || window.MenuMutationReveal.needsCurrent(menuMutationReveal, timestamp);
    const petAnchor = { x:130, top:slimeY-radius*.98, bottom:restingBottom, radius };
    if (showAvatar) {
      menuSlimeCtx.save();
      menuSlimeCtx.translate(130 + petPose.shakeX, restingBottom + petPose.shakeY);
      menuSlimeCtx.rotate(petPose.tilt);
      menuSlimeCtx.scale(petPose.scaleX*tapPose.scaleX, petPose.scaleY*tapPose.scaleY);
      menuSlimeCtx.translate(-130, -restingBottom);
      if(!captureSilhouette && categoryVisual.phantom>=2.5){
        for(let i=0;i<2;i++){
          const p=window.SlimePhantomEffects.idle(130,slimeY,radius,i,timestamp);
          if(!p.front)window.SlimePhantomEffects.spirit(menuSlimeCtx,p,radius*.5,i,timestamp,Math.min(1,categoryVisual.phantom));
        }
      }
      if (infinity) drawInfinityAvatar(menuSlimeCtx, menuAvatarOptions);
      else drawElementalSlimeAvatar(menuSlimeCtx, menuAvatarOptions, categoryVisual, timestamp);
      menuSlimeCtx.restore();
    }
    const nanoCount = showAvatar ? Math.min(1, Math.round(categoryVisual.nano)) : 0;
    for (let index = 0; index < nanoCount; index += 1) {
      const side = nanoCount === 1 ? -1 : index === 0 ? -1 : 1;
      drawNanoDroneSprite(menuSlimeCtx, 130 + side * 64,
        slimeY - radius * .72 + Math.sin(timestamp / 410 + index * 2.2) * 3, radius * .70);
    }
    if (menuMutationReveal) window.MenuMutationReveal.draw(menuSlimeCtx, menuMutationReveal, timestamp);
    // Fade particles at the expanded canvas edge so no effect ends on a hard square.
    menuSlimeCtx.save();
    menuSlimeCtx.globalCompositeOperation = 'destination-in';
    menuSlimeCtx.fillStyle = menuEdgeFade;
    menuSlimeCtx.fillRect(0, 0, 260, 260);
    menuSlimeCtx.restore();
    // The particle edge mask must not erase the planets or their nearby stars.
    if (showAvatar && categoryVisual.cosmos >= .5) {
      menuSlimeCtx.save();
      menuSlimeCtx.translate(130 + petPose.shakeX, restingBottom + petPose.shakeY);
      menuSlimeCtx.rotate(petPose.tilt);
      menuSlimeCtx.scale(petPose.scaleX*tapPose.scaleX, petPose.scaleY*tapPose.scaleY);
      menuSlimeCtx.translate(-130, -restingBottom);
      const orbitState = {x:130,y:slimeY,radius,level:2,
        clock:timestamp,compact:true,alpha:Math.min(1,categoryVisual.cosmos)};
      window.SlimeCosmosOrbits.draw(menuSlimeCtx, orbitState, false);
      window.SlimeCosmosOrbits.draw(menuSlimeCtx, orbitState, true);
      menuSlimeCtx.restore();
    }
    if(showAvatar && !captureSilhouette && categoryVisual.phantom >= 2.5){
      ensurePhantomExpressSprites();
      for(let i=0;i<2;i++){
        const p=window.SlimePhantomEffects.idle(130+petPose.shakeX,slimeY+petPose.shakeY,radius,i,timestamp);
        if(p.front)window.SlimePhantomEffects.spirit(menuSlimeCtx,p,radius*.5,i,timestamp,Math.min(1,categoryVisual.phantom));
      }
    }
    if (showAvatar && !captureSilhouette) {
      if(!menuSlimeIsBusy({ignoreModal:true}))window.SlimeTapEmotions.draw(menuSlimeCtx,menuTapEmotion,{x:130,y:slimeY,radius,now:timestamp,reducedMotion:menuReducedMotion});
    }
    trackGraphicsCost(performance.now() - paintStartedAt);
    if (captureSilhouette) {
      const mask = document.createElement('canvas');
      mask.width = els.menuSlimeCanvas.width;
      mask.height = els.menuSlimeCanvas.height;
      const target = mask.getContext('2d');
      target.scale(mask.width / 260, mask.height / 260);
      const motion = categoryVisual.telekinesis >= 3
        ? window.MutationEffectDraft.psionicsMotion(timestamp, radius).offset : 0;
      const silhouette = {...menuAvatarOptions, y:slimeY+motion, hideFace:true};
      if (infinity) drawInfinityAvatar(target, silhouette);
      else drawSlimeAvatar(target, {...silhouette, bodyVariant:elementalBodyVariant(categoryVisual)});
      return mask;
    }
  }

  function menuSlimeFrame(timestamp) {
    if (!els.homeScreen.classList.contains('active') || document.body.classList.contains('ui-modal-open')) {
      clearMenuSlimeInteraction();
      menuSlimeAnimationId = 0;
      return;
    }
    menuSlimeAnimationId = requestAnimationFrame(menuSlimeFrame);
    const menuFrameInterval = menuPetpet.active || menuTapEmotion.clicks.length || menuTapEmotion.pet.active ? 15 : isMobileDevice() ? 42 : isLowPowerDevice() ? 36 : 32;
    if (document.hidden || platformSuspended || windowSuspended || timestamp - menuSlimeLastFrame < menuFrameInterval) return;
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
    if (type === 'frost' || type === 'fire' || type === 'electric' || type === 'nano' || type === 'phantom') return; // Their effects are drawn over the shaft.
    const remaining = clamp((run.elementalAbilityUntil - timestamp) / (run.elementalAbilityDurationMs || ELEMENTAL_ABILITY_DURATION_MS[type] || 1), 0, 1);
    ctx.save();
    if (type === 'telekinesis') {
      const press=run.telekinesisPress;
      if(press){
        const age=timestamp-press.startedAt;
        const fade=press.collided?1-clamp((age-TELEKINESIS_PRESS_COLLIDE_MS)/600,0,1):1;
        window.SlimePsionicFeedback.caster(ctx,x,y,radius,clamp(age/240,0,1)*fade,timestamp);
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
      const ultimate = run.cosmosUltimate;
      if (ultimate) {
        const charging = timestamp < ultimate.chargeUntil;
        const power = charging ? clamp((timestamp - ultimate.startedAt) / COSMOS_ULTIMATE_CHARGE_MS, 0, 1)
          : cosmosUltimatePower(ultimate, timestamp);
        const pulse = .5 + Math.sin(timestamp / (charging ? 62 : 105)) * .5;
        ctx.globalCompositeOperation = 'lighter';
        ctx.lineCap = 'round';
        for (let ring = 0; ring < 3; ring += 1) {
          const orbit = radius * (charging ? 2.15 - power * .75 + ring * .16 : 1.15 + ring * .23 + pulse * .05);
          ctx.globalAlpha = (.34 + power * .42) * (1 - ring * .2) * (charging ? 1 : power);
          ctx.strokeStyle = ring === 1 ? '#74ecff' : ring === 2 ? '#a970ff' : '#fff5ff';
          ctx.shadowColor = ring === 1 ? '#3ac7ff' : '#a743ff';
          ctx.shadowBlur = 14 + power * 12;
          ctx.lineWidth = (charging ? 2.5 : 4.5) + power * 1.7 - ring * .35;
          ctx.beginPath();
          ctx.ellipse(x, y, orbit * 1.12, orbit * .49, Math.sin(timestamp / 300 + ring) * .18,
            timestamp / (420 + ring * 75), timestamp / (420 + ring * 75) + Math.PI * 1.45);
          ctx.stroke();
        }
        if (charging) for (let mote = 0; mote < 12; mote += 1) {
          const phase = (timestamp / (440 + mote * 17) + mote * .139) % 1;
          const angle = mote * 2.399 + timestamp / 950;
          const orbit = radius * lerp(2.6, .76, phase);
          ctx.globalAlpha = phase * (.3 + power * .7);
          ctx.fillStyle = mote % 3 ? '#dba8ff' : '#aaf7ff';
          ctx.beginPath(); ctx.arc(x + Math.cos(angle) * orbit, y + Math.sin(angle) * orbit, 1.6 + power * 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
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

  function drawCosmosUltimateTrail(timestamp) {
    const ultimate = run?.cosmosUltimate;
    if (!ultimate || timestamp < ultimate.chargeUntil || !ultimate.trail.length) return;
    const fade = cosmosUltimatePower(ultimate, timestamp);
    if (fade <= 0) return;
    const points = ultimate.trail;
    const headY = run.slime.y - run.cameraY;
    const tailY = Math.max(-90, points[0].y - run.cameraY);
    if (headY <= tailY + 2) return;
    const x = run.slime.x;
    const radius = run.slime.radius;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const layers = [
      { width: radius * 2.85, color: 'rgba(102,43,242,.22)', blur: 32 },
      { width: radius * 1.42, color: 'rgba(210,90,255,.35)', blur: 18 },
      { width: radius * .38, color: 'rgba(255,242,255,.68)', blur: 11 }
    ];
    for (const layer of layers) {
      const gradient = ctx.createLinearGradient(x, tailY, x, headY);
      gradient.addColorStop(0, 'rgba(96,56,240,0)');
      gradient.addColorStop(.35, layer.color);
      gradient.addColorStop(1, layer.color);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = layer.width;
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = layer.blur;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y - run.cameraY);
      for (const point of points) ctx.lineTo(point.x, point.y - run.cameraY);
      ctx.lineTo(x, headY - radius * .2);
      ctx.stroke();
    }
    ctx.shadowBlur = 13;
    ctx.shadowColor = '#a675ff';
    for (let mote = 0; mote < 13; mote += 1) {
      const phase = (timestamp / (310 + mote * 17) + mote * .173) % 1;
      const y = headY - phase * Math.min(360, headY - tailY);
      const side = mote % 2 ? 1 : -1;
      const mx = x + side * radius * (.75 + phase * (1.5 + mote % 3 * .24));
      ctx.globalAlpha = fade * (1 - phase) * .82;
      ctx.fillStyle = mote % 3 ? '#de9bff' : '#9df7ff';
      ctx.beginPath(); ctx.arc(mx, y, 1.4 + (mote % 3) * .7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function cosmosCometVisualStrength(timestamp) {
    if (!run || run.portalEntry) return 0;
    const ultimate = run.cosmosUltimate;
    if (ultimate && timestamp < ultimate.fadeUntil) {
      if (timestamp < ultimate.chargeUntil) return .38 + .62 * clamp((timestamp - ultimate.startedAt) / COSMOS_ULTIMATE_CHARGE_MS, 0, 1);
      return cosmosUltimatePower(ultimate, timestamp);
    }
    return 0;
  }

  function drawCosmosCometVisual(timestamp, x, y, radius, front = false, override = null, target = ctx) {
    const strength = override ? override.strength : cosmosCometVisualStrength(timestamp);
    if (strength <= .01) return;
    const ultimate = run.cosmosUltimate;
    const ultra = override ? override.ultra : ultimate && timestamp >= ultimate.chargeUntil && timestamp < ultimate.fadeUntil
      ? cosmosUltimatePower(ultimate, timestamp) : 0;
    const active = ultra > 0;
    const ignition = override ? 0 : run.cosmosCometIgnitedAt
      ? clamp(1 - (timestamp - run.cosmosCometIgnitedAt) / 520, 0, 1)
      : 0;
    const pulse = .5 + Math.sin(timestamp / 72) * .5;
    const wakeLength = radius * (.45 + strength * 1.72 + (active ? .78 + pulse * .2 : 0)) * (1 + ultra * 1.35);
    const wakeWidth = radius * (.55 + strength * .32 + (active ? .12 : 0)) * (1 + ultra * .85);

    target.save();
    target.translate(x, y);
    target.globalCompositeOperation = 'lighter';
    if (!front) {
      const flame = target.createLinearGradient(0, radius * .88, 0, -wakeLength);
      flame.addColorStop(0, `rgba(255,244,255,${strength * (.66 + strength * .3)})`);
      flame.addColorStop(.22, `rgba(226,120,255,${strength * (.58 + strength * .34)})`);
      flame.addColorStop(.6, `rgba(121,42,255,${strength * (.4 + strength * .28)})`);
      flame.addColorStop(1, 'rgba(46,16,155,0)');
      target.fillStyle = flame;
      target.shadowColor = '#9d45ff';
      target.shadowBlur = 13 + strength * 16 + ultra * 28;
      const sway = Math.sin(timestamp / 64) * radius * .09;
      target.beginPath();
      target.moveTo(-radius * .84, radius * .34);
      target.bezierCurveTo(-radius * 1.02, -radius * .08, -wakeWidth * .72, -wakeLength * .62, sway, -wakeLength);
      target.bezierCurveTo(wakeWidth * .72, -wakeLength * .62, radius * 1.02, -radius * .08, radius * .84, radius * .34);
      target.quadraticCurveTo(0, radius * 1.04, -radius * .84, radius * .34);
      target.closePath();
      target.fill();

      const inner = target.createLinearGradient(0, radius * .72, 0, -wakeLength * .74);
      inner.addColorStop(0, `rgba(255,255,255,${strength * (.58 + strength * .38)})`);
      inner.addColorStop(.28, `rgba(238,173,255,${strength * (.5 + strength * .34)})`);
      inner.addColorStop(1, 'rgba(128,54,255,0)');
      target.fillStyle = inner;
      target.shadowBlur = 12;
      target.beginPath();
      target.moveTo(-radius * .48, radius * .5);
      target.bezierCurveTo(-radius * .56, -radius * .06, -radius * .24 + sway * .35, -wakeLength * .5, sway * .38, -wakeLength * .75);
      target.bezierCurveTo(radius * .28 + sway * .35, -wakeLength * .48, radius * .58, -.02 * radius, radius * .48, radius * .5);
      target.quadraticCurveTo(0, radius * .78, -radius * .48, radius * .5);
      target.closePath();
      target.fill();

      target.globalAlpha = strength * (.36 + strength * .38);
      target.strokeStyle = '#bc66ff';
      target.lineWidth = 2 + strength * 2;
      if(override?.softRim){target.filter='blur(3px)';target.globalAlpha*=.55;target.lineWidth=7;}
      for (const side of [-1, 1]) {
        target.beginPath();
        target.moveTo(side * radius * .82, radius * .28);
        target.bezierCurveTo(side * radius * 1.04, -radius * .25, side * wakeWidth * .82, -wakeLength * .55, sway, -wakeLength * .94);
        target.stroke();
      }
      target.filter='none';
    } else {
      target.globalAlpha = strength * (.42 + strength * .56);
      target.strokeStyle = active ? '#fff4ff' : '#dfadff';
      target.lineWidth = 3 + strength * 3.6;
      target.shadowColor = '#922fff';
      target.shadowBlur = 12 + strength * 18;
      if(override?.softRim){target.filter='blur(4px)';target.globalAlpha*=.40;target.lineWidth=10;}
      target.beginPath();
      target.arc(0, 0, radius * (1.03 + strength * .055), Math.PI * .04, Math.PI * .96);
      target.stroke();
      target.globalAlpha = strength * (.22 + strength * .42);
      target.strokeStyle = '#9e42ff';
      target.lineWidth = 2 + strength * 1.5;
      if(override?.softRim){target.globalAlpha*=.35;target.lineWidth=9;}
      target.beginPath();
      target.arc(0, radius * .04, radius * (1.18 + strength * .08), Math.PI * .12, Math.PI * .88);
      target.stroke();
      target.filter='none';

      const sparks = ultra > 0 ? 22 : active ? 12 : 7;
      for (let index = 0; index < sparks; index += 1) {
        const phase = (timestamp / (310 + index * 13) + index * .173) % 1;
        const side = index % 2 ? 1 : -1;
        const sparkY = radius * .36 - phase * (wakeLength + radius * .12);
        const sparkX = side * radius * (.42 + (index % 3) * .2) * (1 - phase * .58) + Math.sin(timestamp / 90 + index * 2.4) * 3;
        target.globalAlpha = strength * (1 - phase) * (.35 + strength * .65);
        target.fillStyle = index % 3 ? '#c86bff' : '#fff4ff';
        target.beginPath(); target.arc(sparkX, sparkY, 1.3 + strength * 1.5, 0, Math.PI * 2); target.fill();
      }
    }
    target.restore();
  }

  function telekinesisPressScreenBounds(press) {
    return {
      top: Math.max(0, press.topY - run.cameraY),
      bottom: Math.min(VIEW_H, press.bottomY - run.cameraY)
    };
  }

  function drawTelekinesisPressBackdrop(timestamp) {
    const press=run.telekinesisPress;
    if(!press||press.collided)return;
    const bounds=telekinesisPressScreenBounds(press);
    ctx.save();ctx.beginPath();ctx.rect(0,bounds.top,VIEW_W,Math.max(0,bounds.bottom-bounds.top));ctx.clip();
    window.SlimePsionicFeedback.press(ctx,{...bounds,originY:press.topY-run.cameraY,
      width:VIEW_W,cell:run.cellSize,progress:telekinesisPressProgress(press,timestamp),
      age:timestamp-press.startedAt,collided:false,back:true,reduced:menuReducedMotion||isLowPowerDevice()});
    ctx.restore();
  }

  function drawTelekinesisPressScene(timestamp) {
    const press=run.telekinesisPress;if(!press)return;
    const bounds=telekinesisPressScreenBounds(press);
    ctx.save();ctx.beginPath();ctx.rect(0,bounds.top,VIEW_W,Math.max(0,bounds.bottom-bounds.top));ctx.clip();
    window.SlimePsionicFeedback.press(ctx,{...bounds,originY:press.topY-run.cameraY,
      width:VIEW_W,cell:run.cellSize,progress:telekinesisPressProgress(press,timestamp),
      age:timestamp-press.startedAt,collided:press.collided,
      release:clamp((timestamp-press.startedAt-TELEKINESIS_PRESS_COLLIDE_MS)/TELEKINESIS_PRESS_FADE_MS,0,1),
      reduced:menuReducedMotion||isLowPowerDevice()});
    ctx.restore();
  }

  function captureTelekinesisBlockArt(block,sy) {
    const cycle=run.telekinesisCycle;
    const projectile=cycle?.projectiles.find(p=>p.block===block&&!p.art);
    if(!projectile||sy<0||sy+block.h>VIEW_H)return;
    const image=document.createElement('canvas');image.width=Math.ceil(block.w);image.height=Math.ceil(block.h);
    const transform=ctx.getTransform();
    image.getContext('2d').drawImage(ctx.canvas,block.x*transform.a+transform.e,sy*transform.d+transform.f,
      block.w*transform.a,block.h*transform.d,0,0,image.width,image.height);
    projectile.art=image;cycle.uncaptured--;
  }

  function drawTelekinesis(timestamp) {
    if (run.psionicShot) drawPsionicShot(timestamp);
    if (!run.telekinesisMarks.length && !run.telekinesisCycle && !run.telekinesisBursts.length) return;
    ctx.save();
    const effects = window.SlimePsionicFeedback;
    const reduced = menuReducedMotion || isLowPowerDevice();
    for (const mark of run.telekinesisMarks) {
      const progress = clamp((timestamp - mark.startedAt) / mark.duration, 0, 1);
      const sy = mark.y - run.cameraY;
      ctx.globalAlpha = (1 - progress) * .88;
      window.SlimePsionicEffects.halo(ctx,mark.x+mark.w/2,sy+mark.h/2,mark.w*1.6,(1-progress)*.25);
      effects.grip(ctx,mark.x+mark.w/2,sy+mark.h/2,mark.w,1-progress);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    const cycle = run.telekinesisCycle;
    if (cycle?.mode === 'single' && !run.psionicShot) {
      const age = timestamp - cycle.startedAt;
      const strength = .57 * Math.sin(clamp(age/1600,0,1)*Math.PI);
      effects.field(ctx,run.slime.x,run.slime.y-run.cameraY+4,run.slime.radius*1.2,age,strength,false,reduced);
    }
    if (cycle) for (const projectile of cycle.projectiles) {
      const elapsed = timestamp - cycle.startedAt;
      const pullAt = TELEKINESIS_PULL_START_MS + projectile.delay;
      const orbitAt = TELEKINESIS_RECOIL_START_MS + projectile.delay;
      if (elapsed < pullAt || projectile.impacted) continue;
      const source = projectile.source;
      let x = source.x;
      let y = source.y;
      let scale = 1;
      const orbiting = cycle.mode === 'ultimate';
      const hold = orbiting ? telekinesisOrbitPosition(projectile, elapsed)
        : { x: run.slime.x + projectile.side * (run.slime.radius + 12), y: run.slime.y - run.slime.radius * .2 };
      if (!orbiting && projectile.launched) {
        ({x,y} = projectile.position);
        const distance = Math.hypot(x-projectile.launchFrom.x,y-projectile.launchFrom.y);
        scale = lerp(.48,.66,clamp(distance/run.cellSize,0,1));
      } else if (elapsed < orbitAt) {
        const t = clamp((elapsed - pullAt) / (orbitAt - pullAt), 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        x = lerp(source.x, hold.x, eased);
        y = lerp(source.y, hold.y, eased) - Math.sin(t * Math.PI) * 9;
        scale = lerp(1, orbiting ? .45 : .48, eased);
      } else if (elapsed < projectile.throwAt || !projectile.target || !projectile.launchFrom) {
        x = hold.x;
        y = hold.y;
        scale = orbiting ? .45 : .48;
      } else {
        const t = clamp((elapsed - projectile.throwAt) / (projectile.impactAt - projectile.throwAt), 0, 1);
        const eased = t * t;
        x = lerp(projectile.launchFrom.x, projectile.target.x, eased);
        y = lerp(projectile.launchFrom.y, projectile.target.y, eased) - Math.sin(t * Math.PI) * 12;
        scale = lerp(orbiting ? .45 : .48, .94, t);
      }
      const screenY = y - run.cameraY;
      if (!orbiting) {
        if (projectile.launched) {
          effects.castTrail(ctx,[...projectile.trail,projectile.position],run.cameraY,run.cellSize*.32,.91);
        } else {
          effects.ribbon(ctx,source.x,source.y-run.cameraY,x,screenY,run.cellSize*.31,
            .72*clamp((projectile.throwAt-elapsed)/160,0,1));
        }
        effects.field(ctx,x,screenY,run.cellSize*scale*.74,elapsed,.66,false,reduced);
      } else if(elapsed>=orbitAt&&elapsed<projectile.throwAt){
        for(let step=isLowPowerDevice()?1:3;step>=1;step--){
          const point=telekinesisOrbitPosition(projectile,elapsed-step*48);
          window.SlimePsionicFeedback.sprite(ctx,'mote',point.x,point.y-run.cameraY,
            run.cellSize*.12,run.cellSize*.12,(4-step)*.13);
        }
      }else if(projectile.launched&&projectile.launchFrom){
        window.SlimePsionicFeedback.ribbon(ctx,projectile.launchFrom.x,projectile.launchFrom.y-run.cameraY,
          x,screenY,projectile.visual.w*.32,orbiting?.8:.78);
      }
      ctx.save();
      ctx.globalAlpha = .9;
      window.SlimePsionicEffects.halo(ctx,x,screenY,projectile.visual.w*scale*1.8,.38);
      ctx.translate(x, screenY);
      ctx.rotate(Math.sin(elapsed / 165 + projectile.index) * .09);
      ctx.scale(scale, scale);
      ctx.globalAlpha = 1;
      if(projectile.art)ctx.drawImage(projectile.art,-projectile.visual.w/2,-projectile.visual.h/2,projectile.visual.w,projectile.visual.h);
      else {
        ctx.save();ctx.translate(-source.x,-(source.y-run.cameraY));
        drawBlock(projectile.visual,projectile.visual.y-run.cameraY,timestamp);ctx.restore();
      }
      if (orbiting) effects.grip(ctx,0,0,projectile.visual.w,.6);
      ctx.restore();
      if (!orbiting) effects.field(ctx,x,screenY,run.cellSize*scale*.74,elapsed,.76,true,reduced);
    }
    for (const burst of run.telekinesisBursts) {
      if (burst.shards) drawPsionicImpact(burst,timestamp,reduced);
      else effects.burst(ctx,burst,run.cameraY,run.cellSize,timestamp,330);
    }
    ctx.restore();
  }

  function drawPsionicImpact(wave,timestamp,reduced) {
    const age = timestamp-wave.startedAt, cell = run.cellSize, camera = run.cameraY;
    const effects = window.SlimePsionicFeedback;
    effects.castImpact(ctx,wave,camera,cell,age,reduced);
    for (const shard of wave.shards) {
      const dx = shard.x-wave.x, dy = shard.y-wave.y;
      const distance = Math.max(1,Math.hypot(dx,dy));
      const travel = clamp(98+distance*.86,138,232);
      const count = reduced ? 1 : Math.min(3,shard.amount+1);
      for (let i = 0; i < count; i++) {
        const t = (age-i*21)/travel;
        if (t < 0 || t > 1) continue;
        const fan = [ .13,-.35,.41 ][i]*cell;
        const points = Array.from({length:4},(_,j) => {
          const phase = Math.max(0,t-(3-j)*.12);
          const flight = 1-(1-phase)**1.32;
          const offset = Math.sin(phase*Math.PI)*fan;
          return {x:wave.x+dx*flight-dy/distance*offset, y:wave.y+dy*flight+dx/distance*offset};
        });
        const tip = points.at(-1);
        effects.castTrail(ctx,points,camera,cell*(i ? .14 : .2),.95);
        effects.shard(ctx,tip.x,tip.y-camera,cell*(.22+shard.amount*.015-i*.047),
          Math.atan2(dy,dx)+t*(4.8-i*3)+i,shard.color || '#675386',1-t**6*.33);
      }
      effects.castImpact(ctx,{...shard,power:.38+shard.amount*.09},camera,cell,age-travel,reduced);
    }
  }

  function drawNanoDroneSprite(target, x, y, size, alpha = 1) {
    const sprite = projectSprite(NANO_DRONE_SPRITE);
    target.save();
    target.globalAlpha = alpha;
    if (sprite?.complete && sprite.naturalWidth) {
      target.drawImage(sprite,sprite.naturalWidth*102/640,sprite.naturalHeight*152/640,
        sprite.naturalWidth*435/640,sprite.naturalHeight*335/640,
        x-size/2,y-size*335/435/2,size,size*335/435);
    } else {
      target.fillStyle = '#c8faff';
      target.strokeStyle = '#154953';
      target.lineWidth = 2;
      target.beginPath(); target.arc(x, y, size * .31, 0, Math.PI * 2); target.fill(); target.stroke();
      target.fillStyle = '#34dae8';
      target.beginPath(); target.arc(x, y, size * .12, 0, Math.PI * 2); target.fill();
    }
    target.restore();
  }

  function drawMechDrill(size, collarY, extension, timestamp, lastCutAt) {
    if (extension <= 0) return;
    const width = size * .219;
    const length = size * .37 * extension;
    const cutAge = timestamp - (lastCutAt ?? -Infinity);
    const load = clamp(1 - cutAge / 145, 0, 1);
    ctx.save();
    ctx.translate(0, collarY + (menuReducedMotion ? 0 : Math.sin(timestamp * .12) * 1.8 * load));
    const alloy = ctx.createLinearGradient(-width, 0, width, 0);
    alloy.addColorStop(0, '#392847');
    alloy.addColorStop(.24, '#687c9c');
    alloy.addColorStop(.45, '#eae3f1');
    alloy.addColorStop(.66, '#90a8c5');
    alloy.addColorStop(1, '#483246');
    ctx.beginPath();
    ctx.moveTo(-width, 0);
    ctx.quadraticCurveTo(-width * .92, length * .57, -size * .023, length * .98);
    ctx.quadraticCurveTo(0, length * 1.05, size * .023, length * .98);
    ctx.quadraticCurveTo(width * .92, length * .57, width, 0);
    ctx.closePath();
    ctx.strokeStyle = '#302038';
    ctx.lineWidth = size * .031;
    ctx.stroke();
    ctx.fillStyle = alloy;
    ctx.fill();
    ctx.save();
    ctx.clip();

    const pitch = size * .092;
    const travel = menuReducedMotion ? 0 : timestamp * pitch / 63;
    const rotation = travel % pitch;
    for (let y = rotation - pitch; y <= length + pitch; y += pitch) {
      ctx.beginPath();
      ctx.moveTo(-width, y - pitch * .24);
      ctx.bezierCurveTo(-width * .48, y + pitch * .27, width * .39, y + pitch * .45, width, y + pitch * .22);
      ctx.lineWidth = size * .056;
      ctx.strokeStyle = '#503041';
      ctx.stroke();
      ctx.lineWidth = size * .035;
      ctx.strokeStyle = '#c47e38';
      ctx.stroke();
      ctx.lineWidth = size * .012;
      ctx.strokeStyle = '#ffe0a1';
      ctx.stroke();
    }
    ctx.restore();
    if (load > 0) {
      drawTechnoSparks(0, length * .84, 1 - load, size * .28, 7, false);
    }
    ctx.restore();
  }

  function drawMechSuit(timestamp, avatarOptions) {
    const mech = run.mechSuit;
    const size = run.cellSize * MECH_VISUAL_CELLS;
    const height = size * 1180 / 1333;
    const assembling = mech.phase === 'descending';
    const progress = assembling ? clamp((timestamp - mech.startedAt) / MECH_LAND_MS, 0, 1) : 1;
    const seat = smoothFireVisual((progress - .20) / .72);
    const latch = smoothFireVisual((progress - .64) / .31);
    const x = run.slime.x;
    const y = run.slime.y - run.cameraY;
    if (assembling) {
      ctx.save();
      const energy = Math.sin(progress * Math.PI);
      window.SlimeMutationImpacts.halo(ctx, 'fire', x, y, size * .74, energy * .57, .85);
      ctx.strokeStyle = '#ff9872';
      ctx.lineWidth = 2;
      ctx.globalAlpha *= energy * .65;
      const gap = size * (.57 - .16 * progress);
      for (const side of [-1, 1]) {
        const railX = x + gap * side;
        ctx.beginPath();
        ctx.moveTo(railX, y - size * .52);
        ctx.lineTo(railX, y + size * .41);
        ctx.stroke();
      }
      if (!menuReducedMotion) {
        drawTechnoSparks(x, y + size * .30, progress, size * .61, 9, false);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    if (seat > 0) {
      ctx.save();
      ctx.globalAlpha *= seat;
      ctx.translate(0, -height * .50 * (1 - seat));
      const shellScale = .88 + seat * .12;
      ctx.scale(shellScale, shellScale);
      drawMechDrill(size, height * .49, latch, timestamp, mech.lastCutAt);
      if (technoMechSprite.complete && technoMechSprite.naturalWidth) {
        ctx.drawImage(technoMechSprite, -size / 2, -height * .44, size, height);
      }
      ctx.restore();
    }
    // The pilot shares the world position and radius used outside the mech.
    drawSlimeAvatar(ctx, { ...avatarOptions, x: 0, y: 0, scaleX: 1, scaleY: 1,
      rotation: 0, bodyVariant: 'technoUltra', irisTint: '#f04a55', nanoEyeOpenness: 0 });
    if (progress > .72 && assembling) {
      const sealFlash = Math.sin(clamp((progress - .72) / .28, 0, 1) * Math.PI);
      window.SlimeMutationImpacts.halo(ctx, 'fire', 0, height * .34, size * .44, sealFlash * .64, 1);
    }
    ctx.restore();
    if (mech.phase === 'active') {
      const remaining = clamp((mech.expireAt - timestamp) / (mech.activeMs || MECH_ACTIVE_MS), 0, 1);
      const timerWidth = 78;
      const timerHeight = 31;
      const timerY = Math.max(116, y - height * .10 - timerHeight / 2);
      const timerX = clamp(x < VIEW_W / 2 ? x + size * .50 + 6 : x - size * .50 - timerWidth - 6,
        5, VIEW_W - timerWidth - 5);
      ctx.save();
      ctx.fillStyle = 'rgba(15,29,38,.94)';
      ctx.strokeStyle = remaining < .22 ? '#ff684d' : '#69e5ed';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = remaining < .22 ? '#ff5549' : '#34e6ef';
      ctx.shadowBlur = 9;
      ctx.beginPath();
      const corner = 10;
      ctx.moveTo(timerX + corner, timerY);
      ctx.lineTo(timerX + timerWidth - corner, timerY);
      ctx.quadraticCurveTo(timerX + timerWidth, timerY, timerX + timerWidth, timerY + corner);
      ctx.lineTo(timerX + timerWidth, timerY + timerHeight - corner);
      ctx.quadraticCurveTo(timerX + timerWidth, timerY + timerHeight, timerX + timerWidth - corner, timerY + timerHeight);
      ctx.lineTo(timerX + corner, timerY + timerHeight);
      ctx.quadraticCurveTo(timerX, timerY + timerHeight, timerX, timerY + timerHeight - corner);
      ctx.lineTo(timerX, timerY + corner);
      ctx.quadraticCurveTo(timerX, timerY, timerX + corner, timerY);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = remaining < .22 ? '#ffb497' : '#a8faff';
      ctx.fillRect(timerX + 7, timerY + timerHeight - 5, (timerWidth - 14) * remaining, 2);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(`${Math.max(0, (mech.expireAt - timestamp) / 1000).toFixed(1)}с`, timerX + timerWidth / 2, timerY + 13);
      ctx.restore();
    }
  }

  function drawTechnoSparks(x, y, progress, reach, count, through) {
    if (progress < 0 || progress >= 1) return;
    const t = 1 - Math.pow(1 - progress, 2);
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i += 1) {
      const angle = i * 2.39996 + (through ? .52 : 0);
      const dx = Math.cos(angle) * reach * (.52 + .14 * (i % 4));
      const dy = (through ? .3 + .72 * Math.sin(angle) : Math.sin(angle)) * reach;
      const tail = Math.max(0, t - .34 * (1 - progress));
      ctx.globalAlpha = (1 - progress) ** 1.4;
      ctx.strokeStyle = i % 3 === 0 ? '#fff0ac' : through ? '#ff5380' : '#ff512d';
      ctx.lineWidth = i % 3 === 0 ? 2.3 : 1.65;
      ctx.beginPath();
      ctx.moveTo(dx * tail, dy * tail + reach * tail ** 2 * .18);
      ctx.lineTo(dx * t, dy * t + reach * t ** 2 * .18);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMechExplosion(timestamp) {
    const burst = run.mechExplosion;
    if (!burst) return;
    const progress = (timestamp - burst.startedAt) / MECH_EXPLOSION_MS;
    if (progress >= 1) { run.mechExplosion = null; return; }
    const radius = run.cellSize;
    const x = burst.x;
    const y = burst.y - run.cameraY;
    window.SlimeMutationImpacts.burst(ctx, 'fire', x, y, radius * 1.48, progress, isLowPowerDevice());
    if (menuReducedMotion) return;
    const fade = (1 - progress) ** 1.5;
    for (let i = 0; i < 6; i += 1) {
      const side = i % 2 ? 1 : -1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x + side * radius * (.09 + progress * (.60 + .15 * i)),
        y + radius * (-.42 * progress + progress ** 2 * (i + 1) * .12));
      ctx.rotate(side * (i + 1) * progress);
      ctx.fillStyle = i % 3 === 0 ? '#dc9559' : '#52647f';
      ctx.fillRect(-radius * .084, -radius * .048, radius * .168, radius * .096);
      ctx.fillStyle = '#ff9b62';
      ctx.fillRect(-radius * .065, -radius * .028, radius * .13, 2);
      ctx.restore();
    }
    drawTechnoSparks(x, y, progress, radius * 1.95, 14, false);
  }

  function drawNanoBolts(timestamp) {
    for (const shot of run.nanoShots || []) {
      const age = timestamp - shot.startedAt;
      const end = TECHNO_ULTIMATES.shotY(shot, timestamp);
      const tail = Math.max(shot.fromY, end - run.cellSize * (shot.piercing ? .74 : .43));
      const fade = shot.stoppedAt === null
        ? clamp((TECHNO_ULTIMATES.SHOT_LIFE_MS - age - 86) / 62, 0, 1)
        : clamp(1 - (timestamp - shot.stoppedAt) / 32, 0, 1);
      if (fade > 0 && end > tail) {
        const aimX = y => lerp(shot.fromX, shot.x, clamp((y - shot.fromY) / Math.max(1, shot.rockY - shot.fromY), 0, 1));
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(aimX(tail), tail - run.cameraY);
        ctx.lineTo(aimX(end), end - run.cameraY);
        if (shot.piercing) {
          ctx.strokeStyle = '#bd173f';
          ctx.lineWidth = shot.bursting ? 11 : 8;
          if (!isLowPowerDevice()) { ctx.shadowColor = '#ff2b6d'; ctx.shadowBlur = 11; }
          ctx.stroke();
        }
        ctx.strokeStyle = shot.piercing ? '#ff526c' : '#f44353';
        ctx.lineWidth = shot.piercing ? (shot.bursting ? 6 : 5) : 3.5;
        ctx.stroke();
        if (shot.piercing) {
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#ffe6e9';
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }
        ctx.restore();
      }
      for (const impact of shot.impacts) {
        const progress = (timestamp - impact.at) / 145;
        if (progress >= 1) continue;
        const y = impact.y - run.cameraY;
        if (impact.through) {
          ctx.save();
          ctx.globalAlpha = (1 - progress) ** 1.7;
          ctx.fillStyle = '#ff518a';
          ctx.beginPath();
          ctx.ellipse(shot.x, y + 8, Math.max(1, 8 * (1 - progress)), 13 + progress * 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        drawTechnoSparks(shot.x, y, progress, run.cellSize * (impact.through ? .41 : .31),
          isLowPowerDevice() ? 4 : impact.through ? 7 : 5, impact.through);
      }
    }
  }

  function drawNanoDrones(timestamp) {
    if (!elementalLevel('nano') && !run.shieldMines?.length) return;
    ctx.save();
    for (const mine of run.shieldMines || []) {
      if (window.BlockEffectDraft && !mine.target.dead) {
        window.BlockEffectDraft.drawNanoTarget(ctx, mine.target.x, mine.target.y - run.cameraY,
          Math.min(mine.target.w, mine.target.h), timestamp);
      }
      if (timestamp >= mine.launchedAt && mine.launched !== false) {
        const progress = clamp((timestamp - mine.launchedAt) / (mine.launched ? (mine.travelMs || 600) : 320), 0, 1);
        const point=window.SlimeTechnoFeedback.minePoint(mine,progress);
        const size = run.cellSize * .34 * Math.min(1,.35+progress*6);
        const sprite = projectSprite(NANO_MINI_DRONE_SPRITE);
        window.SlimeTechnoFeedback.mineWake(ctx,mine,progress,run.cameraY,size);
        ctx.save();
        ctx.translate(point.x,point.y-run.cameraY);ctx.rotate(point.angle-Math.PI/2);
        if (sprite?.complete && sprite.naturalWidth) ctx.drawImage(sprite,
          sprite.naturalWidth*277/1254,sprite.naturalHeight*268/1254,
          sprite.naturalWidth*695/1254,sprite.naturalHeight*688/1254,-size/2,-size/2,size,size);
        else { ctx.fillStyle = '#ff334e'; ctx.beginPath(); ctx.arc(0, 0, size * .3, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
    ctx.restore();
    if (run.mechSuit || !elementalLevel('nano')) return;
    const { x, y, size, muzzleY } = nanoDronePosition(timestamp);
    const alpha = run.portalEntry ? clamp(1 - (timestamp - run.portalEntry.startedAt) / run.portalEntry.duration, 0, 1) : 1;
    drawNanoDroneSprite(ctx, x, y - run.cameraY, size, alpha);
    const age = timestamp - (run.nanoLastShotAt || -Infinity);
    if (age >= 0 && age < 68) {
      ctx.save();
      ctx.globalAlpha = alpha * (1 - age / 68);
      ctx.fillStyle = run.ultimateStage >= 2 ? '#fff0de' : '#ff6756';
      ctx.beginPath();
      ctx.ellipse(x, muzzleY - run.cameraY, size * .14, size * .20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const miniMushroomSprite = new Image();
  miniMushroomSprite.src = versionedAsset('assets/vfx/spores-mini-mushroom-v1-lossless.webp');
  const sporeSeedSprite = new Image();
  const sporePodSprite = new Image();
  const sporeBurstSprite = new Image();
  let sporeSpritesRequested = false;
  function ensureSporeSprites() {
    if (sporeSpritesRequested) return;
    sporeSpritesRequested = true;
    ASSETS.projectSprite('assets/vfx/spores-impact-cloud-v1.webp');
    sporeSeedSprite.src = versionedAsset('assets/vfx/spores-seed-v1.webp');
    sporePodSprite.src = versionedAsset('assets/vfx/spores-pod-v5.webp');
    sporeBurstSprite.src = versionedAsset('assets/vfx/spores-burst-v1.webp');
  }

  function drawSporeEffects(timestamp) {
    if (!run.sporeProjectiles.length && !run.sporePods.length && !run.sporeBursts.length) return;
    const cell = run.cellSize;
    const seedReady = sporeSeedSprite.complete && sporeSeedSprite.naturalWidth > 0;
    const flightSprite = ASSETS.projectSprite('assets/vfx/spores-giant-seed-v1.webp');
    const podReady = sporePodSprite.complete && sporePodSprite.naturalWidth > 0;
    const burstReady = sporeBurstSprite.complete && sporeBurstSprite.naturalWidth > 0;
    for (const projectile of run.sporeProjectiles) {
      if (timestamp < projectile.launchedAt) continue;
      const flight = sporeFlightPoint(projectile, timestamp);
      const x = flight.x;
      const y = flight.y - run.cameraY;
      if (y < -50 || y > VIEW_H + 50) continue;
      const size = 7.8 + flight.progress * 2.1;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(flight.progress * Math.PI * 2) * .25);
      if (flightSprite.complete && flightSprite.naturalWidth) {
        const width = size * 2.3;
        ctx.drawImage(flightSprite, -width / 2, -width * .43, width, width * .86);
      }
      ctx.restore();
    }
    for (const pod of run.sporePods) {
      if (pod.detonated || pod.block.dead) continue;
      const center = blockCenter(pod.block);
      const y = center.y - run.cameraY;
      if (y < -cell || y > VIEW_H + cell) continue;
      const growth = clamp((timestamp - pod.plantedAt) / SPORE_GROW_MS, 0, 1);
      const transition = clamp((growth - .28) / .53, 0, 1);
      const matureBlend = transition * transition * (3 - 2 * transition);
      const pulse = 1 + Math.sin(timestamp * .006 + pod.block.col) * .025 * matureBlend;
      const seedSize = cell * 1.05 * (.88 + growth * .12);
      const matureSize = cell * 1.05 * (.48 + .52 * (1 - Math.pow(1 - growth, 2))) * pulse;
      ctx.save();
      ctx.translate(center.x, y);
      if (seedReady && matureBlend < 1) {
        ctx.globalAlpha = 1 - matureBlend;
        ctx.drawImage(sporeSeedSprite, -seedSize / 2, -seedSize / 2, seedSize, seedSize);
      }
      if (podReady && (matureBlend > 0 || !seedReady)) {
        ctx.globalAlpha = seedReady ? matureBlend : 1;
        ctx.drawImage(sporePodSprite, -matureSize / 2, -matureSize / 2, matureSize, matureSize);
      }
      if (!seedReady && !podReady) {
        ctx.fillStyle = '#9ceb4e'; ctx.beginPath(); ctx.arc(0, 0, cell * (.15 + growth * .32), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    for (const burst of run.sporeBursts) {
      const y=burst.y-run.cameraY;
      if(y < -cell*2 || y > VIEW_H+cell*2)continue;
      window.SlimeMutationImpacts.spores(ctx,burst,run.cameraY,cell,timestamp,isLowPowerDevice());
    }
  }

  function drawCloningCharge(timestamp) {
    const ultimate = run.cloneUltimate;
    if (!ultimate) return;
    const cloud = ASSETS.projectSprite('assets/vfx/spores-impact-cloud-v1.webp');
    if (!cloud.complete || !cloud.naturalWidth) return;
    const age = timestamp - ultimate.startedAt;
    const charging = age < CLONE_ULTIMATE_BURST_MS;
    const t = clamp(charging ? age / CLONE_ULTIMATE_BURST_MS : (age - CLONE_ULTIMATE_BURST_MS) / 390, 0, 1);
    const width = run.cellSize * (charging ? 1.2 + t * .9 : 2.1 + t * 1.7);
    const height = width * cloud.naturalHeight / cloud.naturalWidth;
    ctx.save();
    ctx.globalAlpha = charging ? .12 + t * .22 : (1 - t) * .65;
    ctx.drawImage(cloud, run.slime.x - width / 2, run.slime.y - run.cameraY + run.slime.radius * .6 - height / 2, width, height);
    ctx.restore();
  }

  function drawMiniSlimes(timestamp) {
    if (!run.miniSlimes?.length) return;
    const spriteReady = miniMushroomSprite.complete && miniMushroomSprite.naturalWidth > 0;
    for (const mini of run.miniSlimes) {
      const sy = mini.y - run.cameraY;
      if (sy < -40 || sy > VIEW_H + 40) continue;
      const pop = clamp((timestamp - mini.bornAt) / 140, 0, 1);
      const size = mini.radius * 3.2 * (.35 + .65 * (1 - Math.pow(1 - pop, 3)));
      ctx.save();
      ctx.translate(mini.x, sy);
      ctx.rotate(clamp(mini.vx / 1300, -.3, .3));
      if (spriteReady) ctx.drawImage(miniMushroomSprite, -size / 2, -size / 2, size, size);
      else {
        ctx.fillStyle = '#72ec75';
        ctx.beginPath(); ctx.arc(0, 0, mini.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e85236';
        ctx.beginPath(); ctx.ellipse(0, -mini.radius * .65, mini.radius * 1.1, mini.radius * .5, 0, Math.PI, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawSlimeDamageImpact(timestamp, x, y, radius) {
    const t = clamp((timestamp - run.lastHeartLossAt) / 440, 0, 1);
    const fade = Math.pow(1 - t, 1.5);
    if(run.hazardImpact){
      ctx.save();ctx.translate(run.hazardImpact.x,run.hazardImpact.y-run.cameraY);
      if(t<.4){
        const flash=12+t*65;ctx.globalAlpha=(1-t/.4)*.95;ctx.fillStyle='#ffe9dd';ctx.beginPath();
        for(let i=0;i<16;i++){const a=i*Math.PI/8,r=flash*(i%2?.34:1);i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(r,0);}
        ctx.closePath();ctx.fill();
      }
      ctx.globalAlpha=fade;ctx.strokeStyle='#ff3658';ctx.lineWidth=3.5;
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,inner=18+t*35,outer=inner+14*(1-t);
        ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();ctx.translate(x, y);ctx.lineCap='round';
    const ring = radius + 7 + t * 36;
    ctx.globalAlpha = fade;ctx.strokeStyle='#ff7179';ctx.lineWidth=4*(1-t)+1;
    for (let side=0;side<2;side++) {
      ctx.beginPath();ctx.arc(0,0,ring,side*Math.PI+.25,side*Math.PI+1.7);ctx.stroke();
    }
    ctx.strokeStyle='#fff1e5';ctx.lineWidth=3;
    for(let i=0;i<6;i++) {
      const angle=i*Math.PI/3+.2;
      ctx.beginPath();ctx.moveTo(Math.cos(angle)*ring,Math.sin(angle)*ring);
      ctx.lineTo(Math.cos(angle)*(ring+9*(1-t)),Math.sin(angle)*(ring+9*(1-t)));ctx.stroke();
    }
    ctx.restore();
    if(t<.5) {
      ctx.save();ctx.globalAlpha=(1-t*2)*.3;ctx.strokeStyle='#ef5564';ctx.lineWidth=15;
      ctx.strokeRect(0,0,VIEW_W,VIEW_H);ctx.restore();
    }
  }

  function drawInfinityAvatar(target, pose) {
    drawSlimeAvatar(target, {...pose, skin:'classic', appearance:'cute-v2', bodyVariant:'infinity',
      colors:SKINS[0].colors, faceColor:'#092d53', faceOffsetY:-pose.radius*.075, aura:''});
  }

  function drawSlime(timestamp) {
    if(run.evacuation){
      const e=run.evacuation,s=run.slime;
      if(e.alpha<=.001||e.scale<=.001)return;
      const options={x:s.x,y:s.y-run.cameraY,radius:lerp(e.startRadius,e.radius,e.neutral),emotion:'surprised',
        suppressElectricAccents:!!run.coreEncounter?.electric,
        accessory:save.wardrobe?.accessory||'none',skin:'classic',appearance:'cute-v2',bodyVariant:'',colors:SKINS[0].colors,
        gazeX:e.side?e.side*.65:0,gazeY:0,
        scaleX:e.scale*e.scaleX,scaleY:e.scale*e.scaleY,rotation:e.rotation,alpha:e.alpha,timestamp};
      if (run.infinity) { drawInfinityAvatar(ctx, options); return; }
      if(e.neutral<.999)drawElementalSlimeAvatar(ctx,{...options,alpha:e.alpha*(1-e.neutral)},run.categoryVisuals,timestamp);
      if(e.neutral>.001)drawSlimeAvatar(ctx,{...options,alpha:e.alpha*e.neutral});
      return;
    }
    if (run.coreEncounter?.slimeScale < .01) return;
    const s = run.slime;
    if (run.electricDash) ELEMENTAL_ULTIMATES.drawElectricDash(ctx, run, timestamp, menuReducedMotion);
    const dashPose = run.electricDash?.endedAt === null && !menuReducedMotion ? run.electricDash : null;
    let screenY = s.y - run.cameraY;
    const ghost = !run.coreEncounter && phantomActive(timestamp) && !run.portalEntry;
    const selected = skinById(save.selectedSkin);
    const legacyFrozen = isSlimeFrozen(timestamp);
    const iceLocked = window.SlimeIceHazards.locked(run) && !run.coreEncounter;
    const frozen = legacyFrozen || iceLocked;
    const poisoned = (run.fungiStatus?.poison || 0) > 0 && !run.ended && !run.coreEncounter;
    const hurtActive = !run.mechSuit && !frozen && timestamp < (run.hurtFlashUntil || 0);
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
    // The entry pose emerges from the visible aperture, rather than above the HUD.
    // Physics and the first rock row retain their existing timing.
    if(launchActive)screenY=Math.max(screenY,(run.arrivalPortalScreenY||160)+s.radius*.1);
    if (run.portalEntry && portalScale <= .01) return;
    const speed = Math.hypot(s.vx, s.vy);
    const corePose=CORE.preparationPose(run);
    const cosmosPose=run.coreEncounter?.cosmos?run.coreEncounter:null;
    const fallingScale = s.vy > 0 ? run.fallSpeedScale ?? 1 : 1;
    const stretch = dashPose || corePose.preparing ? 0 : cosmosPose?.bodyStretch ?? clamp(s.vy * fallingScale / 1000, -.20, .33);
    const bounceSquash = dashPose || corePose.preparing ? 0 : clamp(Math.sin(s.wobble) * .025 + Math.abs(s.vx) / 1700, 0, .12);
    const contactAge = timestamp - (run.rockContactAt ?? -Infinity);
    const contact = !corePose.preparing && !run.coreEncounter && !run.portalEntry && contactAge >= 0
      ? (1 - clamp(contactAge / 145, 0, 1)) ** 2 * (run.rockContactPower || 0) : 0;
    const release = contactAge > 24 && contactAge < 140 && run.rockContactBroken && !run.coreEncounter && !run.portalEntry
      ? Math.sin(Math.PI * (contactAge - 24) / 116) * (run.rockContactPower || 0) * .15 : 0;
    const contactSquashX = contact * (run.rockContactSide ? -.18 : .16) - release * .56;
    const contactSquashY = contact * (run.rockContactSide ? .13 : -.29) + release;
    const scaleX = frozen ? 1 : 1 - stretch * .42 + bounceSquash + contactSquashX;
    const scaleY = frozen ? 1 : 1 + stretch - bounceSquash * .55 + contactSquashY;
    const cloneCast = run.sporePop || run.cloneUltimate;
    const cloneChargeMs = run.sporePop ? run.ultimateProfile.chargeMs : CLONE_ULTIMATE_BURST_MS;
    const cloneChargeAge = cloneCast ? timestamp - cloneCast.startedAt : 0;
    const cloneCharge = cloneCast && !cloneCast.fired
      ? clamp(cloneChargeAge / cloneChargeMs, 0, 1) : 0;
    const cloneRelease = cloneCast?.fired
      ? 1 - clamp((cloneChargeAge - cloneChargeMs) / 240, 0, 1) : 0;
    const hitAge = timestamp - (run.lastHeartLossAt || 0);
    const hitSquash = hurtActive ? Math.sin(Math.PI * clamp(hitAge / 240, 0, 1)) : 0;
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
      healGlow.addColorStop(0, `rgba(202,255,156,${healProgress * .3})`);
      healGlow.addColorStop(.64, `rgba(143,237,109,${healProgress * .12})`);
      healGlow.addColorStop(1, 'rgba(143,237,109,0)');
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

    const storm = run.electricStorm;
    const stormCharge = storm ? electricStormCharge(storm, timestamp) : 0;
    if (stormCharge > .01) drawElectricStormAura(s.x, screenY, radius, stormCharge, timestamp);
    const castLight = ELEMENTAL_ULTIMATES.fireCastLight(run, timestamp);
    if (castLight) {
      const effects = window.SlimeMutationImpacts;
      effects.halo(ctx, 'fire', s.x, screenY, radius * (4.9 + castLight.flare * 1.25), castLight.glow);
      effects.halo(ctx, 'fire', s.x, screenY + radius * .12, radius * 3.5, castLight.glow * .77);
      if (!menuReducedMotion && castLight.flare > 0) {
        for (let i = 0; i < 5; i += 1) {
          const angle = i * Math.PI * 2 / 5 + .34;
          const distance = radius * (1.15 + castLight.spread * 1.95);
          effects.halo(ctx, 'fire', s.x + Math.cos(angle) * distance, screenY + Math.sin(angle) * distance,
            radius * (.55 + i % 2 * .16), castLight.flare * (.66 + i % 2 * .16));
        }
      }
    }
    const fireRecoil = menuReducedMotion ? 0 : (castLight?.flare ?? 0);
    const avatarOptions = {
      x: s.x,
      y: screenY,
      radius,
      emotion,
      eyeClosure:corePose.eyeClosure,
      mouthStyle:corePose.mouthStyle,
      accessory:save.wardrobe?.accessory || 'none',
      skin: selected.id,
      poisoned,
      afterLayer: stormCharge > .01 ? (target, state) => drawElectricStormEyes(target, state, stormCharge, timestamp) : undefined,
      suppressElectricAccents: stormCharge > .01,
      bodyFilter: iceLocked ? 'grayscale(.85) sepia(.52) hue-rotate(156deg) saturate(1.95) brightness(1.23)' : '',
      colors: poisoned || iceLocked ? selected.colors : legacyFrozen
        ? ['#ecfdff', '#69cef2', '#287caf']
        : hurtActive && hurtPulse > .32
          ? ['#fff1f0', '#ff7377', '#cf3347']
          : selected.colors,
      phantomActive: ghost,
      preservePhantomBody: true,
      scaleX: scaleX * (1 + hitSquash * .16 + (run.coreEncounter?.impactSquash || 0)) * (1 - cloneCharge * .16 + cloneRelease * .19) * portalScale * launchScale * (run.coreEncounter?.slimeScale ?? 1) * (dashPose ? .92 : 1) * (1 + fireRecoil * .09),
      scaleY: scaleY * (1 - hitSquash * .19 - (run.coreEncounter?.impactSquash || 0) * .75) * (1 + cloneCharge * .13 - cloneRelease * .12) * portalScale * launchScale * (run.coreEncounter?.slimeScale ?? 1) * (dashPose ? 1.19 : 1) * (1 - fireRecoil * .10),
      rotation: (dashPose ? -dashPose.dx * .59 : cosmosPose?.bodyTilt ?? (frozen ? clamp(s.vx / 1600, -.09, .09) : clamp(s.vx / 850, -.24, .24))) + portalProgress * 1.8,
      alpha: (run.portalEntry ? Math.pow(1 - vanishProgress, .72) : 1) * launchAlpha * (run.coreEncounter?.slimeAlpha ?? 1),
      timestamp
    };
    const fireLevel = run.categoryVisuals?.fire || 0;
    const fireRadius = radius * portalScale * launchScale;
    const fireAbilityActive = run.elementalAbilityActive === 'fire' && run.ultimateStage >= 3 && timestamp < run.elementalAbilityUntil;
    const fireAbilityDuration = run.ultimateProfile?.durationMs || ELEMENTAL_ABILITY_DURATION_MS.fire || 5000;
    const fireAbilityRemaining = fireAbilityActive ? Math.max(0, run.elementalAbilityUntil - timestamp) : 0;
    const fireAbilityElapsed = fireAbilityActive ? fireAbilityDuration - fireAbilityRemaining : fireAbilityDuration;
    const electricAbilityActive = run.elementalAbilityActive === 'electric' && run.ultimateStage >= 3 && timestamp < run.elementalAbilityUntil;
    const electricAbilityDuration = run.ultimateProfile?.durationMs || ELEMENTAL_ABILITY_DURATION_MS.electric || 3000;
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
    if(ghost)avatarOptions.alpha*=.52+.05*Math.sin(timestamp/180);
    avatarOptions.phantomActive=ghost;
    avatarOptions.ghostTint=ghost;
    if (run.coreEncounter) {
      if (run.infinity) { drawInfinityAvatar(ctx, avatarOptions); return; }
      if(run.coreEncounter.hit&&!run.coreEncounter.cinematic)drawSlimeAvatar(ctx,{...avatarOptions,skin:'classic',appearance:'cute-v2',bodyVariant:'',colors:SKINS[0].colors});
      else drawElementalSlimeAvatar(ctx, {...avatarOptions,suppressElectricAccents:!!run.coreEncounter.electric}, elementalVisuals, timestamp);
      return;
    }
    drawRunCosmosOrbits(timestamp, false);
    if (!frozen || run.cosmosUltimate) drawCosmosCometVisual(timestamp, s.x, screenY, fireRadius, false);
    if (!run.portalEntry && !launchActive) INFINITY.drawShield(ctx, run.infinity, s.x, screenY, radius, timestamp, menuReducedMotion, true);
    if (iceLocked) window.SlimeIceHazards.drawSlimeIce(ctx,run,s.x,screenY,radius,{reduced:menuReducedMotion});
    if (run.mechSuit) drawMechSuit(timestamp, avatarOptions);
    else {
      if (run.infinity) drawInfinityAvatar(ctx, avatarOptions);
      else drawElementalSlimeAvatar(ctx, avatarOptions, elementalVisuals, timestamp);
    }
    if (castLight) {
      window.SlimeMutationImpacts.halo(ctx, 'fire', s.x, screenY + radius * .38, radius * (2.04 + castLight.flare * .35),
        castLight.glow * (.37 + castLight.flare * .23), .67);
    }
    drawRunCosmosOrbits(timestamp, true);
    if (!frozen || run.cosmosUltimate) drawCosmosCometVisual(timestamp, s.x, screenY, fireRadius, true);
    drawActiveElementalAbility(timestamp, s.x, screenY, fireRadius);
    if (hurtActive && hitAge < 440) drawSlimeDamageImpact(timestamp, s.x, screenY, radius);
    if (!run.portalEntry && run.barrier > 0) {
      window.DominantShield.bubble(ctx, s.x, screenY, radius, shieldDominant(),
        timestamp, timestamp - (run.barrierStartedAt || 0));
    }
    if (!run.portalEntry && !launchActive) INFINITY.drawShield(ctx, run.infinity, s.x, screenY, radius, timestamp, menuReducedMotion, false, run.cameraY);
    if (!run.portalEntry && run.psionicBarrier && psionicBarrierActive(timestamp))window.SlimePsionicEffects.bubble(ctx,run,timestamp,psionicBarrierRadius());
    if (run.shieldPop) {
      if (timestamp - run.shieldPop.at < 520) window.DominantShield.pop(ctx, run.shieldPop, timestamp, run.cameraY);
      else run.shieldPop = null;
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

    if (!run.portalEntry) {
      if (legacyFrozen) drawFrozenSlimeOverlay(s.x, screenY, radius, timestamp);
      window.SlimeIceHazards.drawSlimeIce(ctx,run,s.x,screenY,radius,{front:true,reduced:menuReducedMotion});
      if (!ghost && !speedDrillActive(timestamp) && !mechSuitActive()) {
        window.SlimeTechHazards.drawAffected(ctx,run,s.x,screenY,radius,menuReducedMotion);
      }
    }

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
  }

  function impact() {}

  function continueEndlessWorld() {
    if (!run || run.ended) return;
    const completedLap = run.endlessLap;
    const segmentDepth = run.world.targetDepth;
    run.endlessDepthOffset += segmentDepth;
    run.endlessLap += 1;
    run.world.endlessScale = 1 + Math.min(.9, (run.endlessLap - 1) * .1);
    ENERGY.recover(run,12,performance.now());
    run.portalEntry = null;
    run.portalTransitioning = false;
    run.blocks = generateBlockField(run);
    run.energyPickups = window.SlimeEnergyPickups.build(run);
    run.nanoShots = [];
    run.nanoBurst = null;
    run.mechSuit = null;
    run.mechExplosion = null;
    run.mechExitZoneGraceUntil = 0;
    run.frostStorm = null;
    run.frostFlake = null;
    run.stagedUltimate = null;
    run.fireFlash = null;
    run.burningBlocks?.clear();
    run.giantMushroom = null;
    run.sporePop = null;
    run.cosmosStagedUltimate = null;
    run.psionicBarrier = null;run.psionicBarrierBursts=[];
    run.telekinesisPress = null;
    run.telekinesisUltimatePending = false;
    run.elementalAbilityActive = '';
    run.elementalAbilityUntil = 0;
    run.nanoNextShotAt = performance.now() + TECHNO_ULTIMATES.PASSIVE_INTERVAL_MS;
    indexRunBlocks();
    run.flasks = generateFlasks(run);
    run.honeyZones = generateHoneyZones(run);
    run.jellyZones = generateJellyZones(run);
    run.freezeZones = generateFreezeZones(run);
    run.inJellyZoneId = '';
    run.jellyEnteredAt = 0;
    run.lastJellyBubbleAt = 0;
    run.jellySubmergedZoneId = '';
    run.jellyExitTriggeredId = '';
    run.inFreezeZoneId = '';
    run.freezeZoneEnteredAt = 0;
    run.freezeZoneTriggeredId = '';
    run.particles = [];
    run.specialEffects = [];
    run.ultimateIntro = null;
    run.phoenixUltimate = null;
    run.electricDash = null;
    run.electricStorm = null;
    run.electricStormBolts = [];
    run.electricStormHits = [];
    run.meteorShowers = [];
    run.phantomUntil = 0;
    run.phantomEnteredAt = 0;
    run.phantomMarkNextAt=performance.now()+PHANTOM_MARK_INTERVAL_MS;
    run.phantomPortalNextAt=performance.now()+PHANTOM_PORTAL_INTERVAL_MS;
    run.phantomFlights=[null,null];run.phantomPortals=[];run.phantomExpress=null;
    run.phantomSalvoFlights=[];
    run.phantomPhase=null;run.phantomVolleyRemaining=0;run.phantomVolleyNextAt=0;run.phantomSpiritSequence=0;
    run.phantomMarkedBlocks?.clear();
    run.phantomBursts = [];
    run.glitchNextInfectionAt = performance.now() + 1500;
    run.glitchPassiveInfectAt = 0;
    run.glitchInfectedBlocks.clear();
    run.glitchShock = null;
    run.glitchBreakBursts = [];
    run.glitchDisarm = null;
    run.glitchChoice = null;
    run.glitchScreen = null;
    glitchTileCache.clear();
    glitchTileCacheRun = null;
    run.cosmosOrbitPrevious = null;
    run.cosmosOrbitAlpha = 0;
    for (const contacts of run.cosmosOrbitContacts) contacts.clear();
    run.cosmosOrbitHitUntil.fill(0);
    run.cosmosOrbitCooldowns = new WeakMap();
    run.glitchDeleteQueue = [];
    run.glitchHackQueue = [];
    run.glitchSpreadQueue = [];
    run.glitchChange = null;
    hideGlitchChoice();
    run.hitCooldowns.clear();
    resetFallMomentum(run);
    run.electricImpactAt = -Infinity;
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
    showToast(`КРУГ ${completedLap}`);
    run.animationId = requestAnimationFrame(gameFrame);
  }

  function finalizeWorldCompletion() {
    if (!run || run.ended) return;
    const world = run.world;
    if (!run.tutorialPhase) save.worldBest[world.id] = Math.max(save.worldBest[world.id] || 0, world.targetDepth);
    save.unlockedLevels[world.id] = LEVEL_COUNT;
    const coreEvent = run.coreStrikeEvent || null;
    const newlyOpened = run.coreNewlyOpened || [];
    const unlockedSkin = { 1: 'cat', 3: 'dumpling' }[world.id];
    if (unlockedSkin && !save.unlockedSkins.includes(unlockedSkin)) save.unlockedSkins.push(unlockedSkin);
    // Magma is no longer the campaign finale: two more planets follow it.
    run.isFinalCompletion = false;
    if (run.isFinalCompletion) save.gameCompleted = true;
    sound('win');
    endRun(true, coreEvent
      ? `${coreEvent.from>0&&coreEvent.to===0?'Ядро очищено!':`Ядру нанесено ${coreEvent.damage}% урона.`}${newlyOpened.length ? ' Новая планета открыта!' : ''}`
      : `Шахта «${world.name}» пройдена! +150 опыта.`);
  }

  function finishWorld() {
    if (!run || run.ended || run.portalTransitioning) return;
    if (run.corePreview) { endRun(true, 'Просмотр завершён'); return; }
    run.portalTransitioning = true;
    clearFallSteering();
    cancelAnimationFrame(run.animationId);
    if (run.endless) continueEndlessWorld();
    else finalizeWorldCompletion();
  }

  function finishRunEarly() {
    if (!run || run.ended) return;
    endRun(false, 'Забег завершён вручную. Полученная награда сохранена.',{skipEvacuation:true});
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

  function animateResultResearch(data, startUnits, token, dataOffset = 0) {
    cancelAnimationFrame(resultResearchAnimationId);
    const totalData = Math.max(0, Math.floor(data));
    const duration = clamp(760 + totalData * 2.2, 880, 1900);
    const startedAt = performance.now();
    let lastUnits = startUnits;
    let lastPulseAt = -Infinity;
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
        const units = startUnits + added;
        if (els.resultResearchData) els.resultResearchData.textContent = `+${(dataOffset + added).toLocaleString('ru-RU')}`;
        if (els.resultResearchUnits) els.resultResearchUnits.textContent = formatCompactNumber(units);
        if (units !== lastUnits) {
          lastUnits = units;
          if (timestamp - lastPulseAt >= 190 || ratio >= 1) {
            lastPulseAt = timestamp;
            pulseResultResearchFlask();
            sound('coin');
            feedback([4, 8, 4]);
          }
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
      els.resultResearchUnits.textContent = formatCompactNumber(run.researchUnitsBefore + researchData);
    } else {
      await animateResultResearch(researchData, run.researchUnitsBefore, token);
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

    const rewards = runCompletionRewards(run, run.completed);
    const bonus = rewards.research > 0;
    if (bonus) {
      if (!reducedMotion) await new Promise(resolve => setTimeout(resolve, 200));
      if (token !== resultRevealToken || !run) return;
      const completionPanel = document.getElementById('resultCompletionBonus');
      if (completionPanel) completionPanel.hidden = false;
      sound('coin');
      feedback([8, 20, 8]);
      if (reducedMotion) {
        els.resultResearchData.textContent = `+${(researchData + 25).toLocaleString('ru-RU')}`;
        els.resultResearchUnits.textContent = formatCompactNumber(run.researchUnitsAfter);
        els.resultCoins.textContent = `+${formatCompactNumber(coins)}`;
      } else {
        await animateResultResearch(25, run.researchUnitsBefore + researchData, token, researchData);
      }
      if (token !== resultRevealToken || !run) return;
    }

    modal?.classList.remove('result-reveal-pending');
    modal?.classList.add('result-reveal-ready');
    els.resultMultiplierBtn.disabled = true;
    els.continueBtn.disabled = false;
  }

  function calculateEndlessScore(currentRun) {
    if (!currentRun?.endless) return 0;
    const depthPoints = Math.max(0, Math.floor(currentRun.maxDepth || 0)) * 10;
    const blockPoints = Math.max(0, Math.floor(currentRun.blocksDestroyed || 0)) * 75;
    const coinPoints = Math.max(0, Math.floor(currentRun.coins || 0)) * 4;
    return depthPoints + blockPoints + coinPoints;
  }

  function runCompletionRewards(currentRun, completed) {
    const earned = completed && !currentRun.endless && !currentRun.tutorialPhase;
    return { research: earned ? 25 : 0, experience: earned ? 150 : 0 };
  }

  function endRun(completed, reason, {skipEvacuation=false}={}) {
    if (!run || run.ended) return;
    finishRunUltimateAudio();
    if (run.corePreview) {
      run.ended = true;
      syncBackgroundMusic();
      run.portalTransitioning = false;
      cancelAnimationFrame(run.animationId);
      yandexPlatform?.gameplay.stop();
      renderCanvas(performance.now());
      window.SlimeCorePreview.refresh();
      return;
    }
    if(!completed&&run.energy<=0&&!skipEvacuation&&!run.evacuation?.finished){
      beginAnomalyEvacuation(false,'Сила закончилась. Слайм эвакуирован на базу.');return;
    }
    els.shaft.classList.remove('core-encounter-active','is-evacuating');
    clearTutorialRunHint();
    flushRunResearchAwards(run);
    finishOnboardingRun(completed);
    run.completed = Boolean(completed);
    hideGlitchChoice();
    run.glitchChoice = null;
    hideRunMenu();
    clearRunImpactFeedback();
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.ended = true;
    syncBackgroundMusic();
    window.SlimeAnomalyEnergyHud.render(run);
    run.tutorialHintFadeUntil=0;
    $('#tutorialRunHint').hidden=true;
    $('#tutorialRunGoal').hidden=true;
    $('#tutorialSteeringDemo').hidden=true;
    renderTutorial();
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
      const failureKey = `${run.worldId}:${run.level}`;
      save.levelFailures[failureKey] = window.SlimeMinePlans?.nextFailureStreak(save.levelFailures[failureKey], completed)
        ?? (completed ? 0 : Math.min(99, (save.levelFailures[failureKey] || 0) + 1));
      save.worldBest[run.worldId] = Math.max(save.worldBest[run.worldId] || 0, Math.min(run.maxDepth, run.world.targetDepth));
      save.lastRunDepth[`${run.worldId}:${run.level}`] = Math.min(run.world.targetDepth, Math.max(0, Math.floor(run.maxDepth)));
      save.worldLastRun[run.worldId] = Math.min(run.world.targetDepth, Math.max(0, Math.floor(run.maxDepth)));
    }
    const baseCoins = Math.max(0, Math.floor(run.coins));
    const completionRewards = runCompletionRewards(run, completed);
    const completionBonus = completionRewards.research;
    const researchData = Math.max(0, Math.floor(run.researchData || 0)) + completionBonus;
    run.experienceEarned = Math.max(0, Math.floor(run.experienceEarned || 0)) + completionRewards.experience;
    run.masteryBefore = slimeTaskCount(run.mutationId);
    run.masteryAfter = run.masteryBefore + (run.masteryGain || 0);
    save.mutationMastery ||= {};
    save.mutationMastery[run.mutationId] = run.masteryAfter;
    run.experienceBefore = run.masteryBefore;
    run.experienceAfter = run.masteryAfter;
    if (run.mutationId !== 'infinity') save.selectedMutation = run.mutationId;
    run.researchUnitsBefore = Math.max(0, save.researchUnits - Math.max(0, Math.floor(run.researchData || 0)));
    save.researchUnits += completionBonus;
    run.researchUnitsAfter = save.researchUnits;
    run.awardedCoins = 0;
    run.finalCoins = 0;
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
    els.resultWorldIcon.src = worldIconSource(run.worldId);
    els.resultWorldName.textContent = run.world.name;
    els.resultBadge.textContent = run.endless
      ? '∞ БЕСКОНЕЧНЫЙ ЗАБЕГ'
      : completed
      ? 'ШАХТА ПРОЙДЕНА'
      : 'ЗАБЕГ ОКОНЧЕН';
    els.resultTitle.textContent = completed && !run.endless ? 'Шахта пройдена!' : 'Итоги забега';
    els.resultText.textContent = run.tutorialPhase === 1 ? (slimeDevelopment('fire',2).ready ? 'Огонь готов к развитию! Открой новую форму и усиль суперсилу.' : 'Поджоги сохраняются. Ты всё ближе к новой форме!') : run.tutorialPhase === 2 ? (save.researchUnits + save.mutationProgress >= 50 ? 'Хватит на Мороз! Создай новую мутацию в лаборатории.' : 'Осколки сохранены. Собери ещё немного для Мороза.') : '';
    const completionPanel = document.getElementById('resultCompletionBonus');
    if (completionPanel) completionPanel.hidden = true;
    els.resultResearchData.textContent = '+0';
    const bonusLabel = document.getElementById('resultResearchBonus');
    if (bonusLabel) bonusLabel.textContent = completionBonus ? `+${completionBonus}` : '';
    els.resultResearchUnits.textContent = formatCompactNumber(run.researchUnitsBefore);
    els.resultCoins.textContent = '+0';
    renderResultSlimeProgress(run.experienceBefore);
    const experienceBonusLabel = document.getElementById('resultExperienceBonus');
    if (experienceBonusLabel) experienceBonusLabel.textContent = '';
    els.resultMultiplierLabel.textContent = formatResultMultiplier(RESULT_MULTIPLIERS[0]);
    els.resultMultiplierHint.textContent = 'Нажми, чтобы остановить стрелку';
    els.resultMultiplierBtn.disabled = true;
    els.resultMultiplierBtn.innerHTML = '<span class="result-ad-play" aria-hidden="true">▶</span><span>УМНОЖИТЬ НАГРАДУ</span>';
    els.continueBtn.disabled = true;
    els.continueBtn.textContent = 'Продолжить';
    // Start the entrance animation on the first visible frame. Revealing the
    // overlay one frame before adding this class makes the result flash in.
    els.resultOverlay.classList.add('is-arriving');
    els.resultOverlay.classList.remove('hidden');
    syncInteractionLayers();
    const revealToken = ++resultRevealToken;
    const completedRun = run;
    requestAnimationFrame(() => {
      if (run !== completedRun || revealToken !== resultRevealToken) return;
      els.resultOverlay.querySelector('.modal')?.focus({ preventScroll: true });
      void revealResultSummary(researchData - completionBonus, run.masteryGain || 0, revealToken);
      animateResultSlimeProgress(revealToken);
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
    requestAnimationFrame(() => els.gameCompleteOverlay.querySelector('.game-complete-modal')?.focus({ preventScroll: true }));
  }

  function closeGameCompleteToHome() {
    els.gameCompleteOverlay.classList.add('hidden');
    syncInteractionLayers();
    run = null;
    newDraft();
    requestAnimationFrame(() => playHomeRewardFlight());
    queueSecondTutorialGift();
  }

  function startEndlessFromCompletion() {
    els.gameCompleteOverlay.classList.add('hidden');
    syncInteractionLayers();
    run = null;
    startDrop({ endless: true });
  }

  function queueSecondTutorialGift() {
    if (save.tutorialStep === 'done') { checkOnboardingProgress(); queueOnboardingMemo(); return; }
    if (save.tutorialStep === 'second-run') {
      setTutorialStep('second-feed');
      return;
    }
    if (save.tutorialStep !== 'post-run') return;
    const waitForRewards = () => {
      if (save.tutorialStep !== 'post-run' || document.body.dataset.screen !== 'home') return;
      if (homeRewardFlight || playerExperiencePresentation?.frame) return setTimeout(waitForRewards, 150);
      if (mutationLevel('fire') < 2) {
        if (!slimeDevelopment('fire',2).ready) {
          setTutorialStep(stomachCanLaunch() ? 'play' : 'feed');
        } else setTutorialStep(save.tutorialSecondGiftClaimed ? 'upgrade-home-mutations' : 'second-gift');
      } else if (save.researchUnits + save.mutationProgress >= currentMutationCost()) {
        setTutorialStep('frost-home');
      } else setTutorialStep(stomachCanLaunch() ? 'second-play' : 'second-feed');
    };
    setTimeout(waitForRewards, 100);
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
      prepareHomeRewardFlight(run);
      showGameComplete();
      return;
    }
    prepareHomeRewardFlight(run);
    run = null;
    newDraft();
    requestAnimationFrame(() => playHomeRewardFlight());
    queueSecondTutorialGift();
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
    if (save.researchUnits < cost) return showToast('Не хватает осколков Аномалии');
    save.researchUnits -= cost;
    save[key] += 1;
    sound('coin');
    renderDraft();
    persist();
    renderPanel('upgrades');
  }

  function renderPanel(type) {
    if (type === 'form-index' && formDiscoverySequence) return;
    if ((type === 'shop' || type === 'skins') && tutorialActive()) return;
    if (type === 'form-index' && !save.discoveredForms?.length) return;
    wardrobePanel?.destroy();
    wardrobePanel = null;
    lastFocusedElement = document.activeElement;
    els.panelOverlay.querySelector('.panel-modal')?.classList.toggle('rewards-modal',type==='rewards');
    els.panelOverlay.querySelector('.panel-modal')?.classList.toggle('wardrobe-modal',type==='shop'||type==='skins');
    els.panelOverlay.querySelector('.panel-modal')?.classList.toggle('encyclopedia-modal', type === 'encyclopedia');
    if (type === 'upgrades') renderUpgradesPanel();
    if (type === 'shop' || type === 'skins') renderWardrobePanel();
    if (type === 'rewards') {
      if(els.panelOverlay.classList.contains('hidden')){
        const state=window.SlimeDailyRewards.status(save.rewards);
        rewardsTab=state.dailyAvailable?'daily':state.freeAvailable?'wheel':rewardsTab;
      }
      renderRewardsPanel();
    }
    if (type === 'recipes') {
      laboratoryView = tutorialActive() && save.tutorialStep.startsWith('frost-') ? 'synthesis' : 'mutations';
      if (els.panelOverlay.classList.contains('hidden')) selectedLaboratoryMutationId = selectedSlimeMutationId();
      renderRecipesPanel();
    }
    if (type === 'recipes' && save.tutorialStep === 'upgrade-home-mutations') {
      selectedLaboratoryMutationId = 'fire';
      renderRecipesPanel();
      setTutorialStep('upgrade-fire');
    }
    if (type === 'recipes' && save.tutorialStep === 'frost-home') {
      laboratoryView = 'synthesis'; renderRecipesPanel();
      setTutorialStep(save.mutationProgress >= currentMutationCost() ? 'frost-synthesize' : 'frost-reactor');
    }
    if (type === 'encyclopedia') renderEncyclopediaPanel(save.world);
    if (type === 'form-index') {
      if (save.onboarding?.quest === 'open-forms') { save.onboarding.quest = ''; persist({ refreshUI: false }); renderOnboardingQuest(); }
      renderFormIndexPanel();
      const hadUnseenForms = save.unseenForms.length > 0;
      save.unseenForms = [];
      updateFormIndexBadge();
      if (hadUnseenForms) persist();
    }
    if (els.panelOverlay.classList.contains('hidden')) sound('uiOpen');
    els.panelOverlay.classList.remove('hidden');
    if(type==='rewards')refreshRewardsPanel();
    syncInteractionLayers();
    queueTutorialRender();
    requestAnimationFrame(() => els.panelOverlay.querySelector('.modal')?.focus({ preventScroll: true }));
  }

  function updateFormIndexBadge() {
    if (!els.formIndexBadge) return;
    const hasNew = Boolean(save.unseenForms?.length);
    els.formIndexBadge.hidden = !hasNew;
    els.formIndexBtn?.classList.toggle('has-new-form', hasNew);
    els.formIndexBtn?.setAttribute('aria-label', !save.discoveredForms?.length ? 'Формы откроются после первой формы' : hasNew ? 'Открыть индекс форм, есть новые формы' : 'Открыть индекс форм');
  }

  function renderFormIndexPanel() {
    const discovered = new Set(save.discoveredForms);
    const unseen = new Set(save.unseenForms);
    els.panelTitle.textContent = 'Индекс';
    els.panelContent.innerHTML = `<div class="form-index-panel">
      <div class="form-index-progress"><div class="form-index-count" aria-label="Открыто ${discovered.size} из ${FORM_INDEX.length} форм"><span>ОТКРЫТО ФОРМ</span><b>${discovered.size}<small> / ${FORM_INDEX.length}</small></b></div><div class="form-index-progress-track" role="progressbar" aria-label="Коллекция форм" aria-valuemin="0" aria-valuemax="${FORM_INDEX.length}" aria-valuenow="${discovered.size}"><i style="width:${discovered.size / FORM_INDEX.length * 100}%"></i></div></div>
      <div class="form-index-grid">${FORM_INDEX.map((form, index) => {
        const open = discovered.has(form.id);
        const recipeMutation = mutationById(form.id);
        return `<article class="form-index-card ${open ? 'is-open' : 'is-locked'} ${open && unseen.has(form.id) ? 'is-unseen' : ''}" data-form="${form.id}" style="--form-accent:${form.color}" aria-label="${open ? form.name : `Форма ${index + 1}: неизвестна`}">
          <div class="form-index-recipe" aria-label="${open ? `Стадия III: ${form.mutation}` : 'Рецепт пока скрыт'}">${open ? mutationEmblemMarkup(recipeMutation, { effects: false }) + '<b>III</b>' : '<img class="form-recipe-lock" src="assets/ui/lock.webp" alt="">'}</div>
          <div class="form-index-art"><img src="${versionedAsset(form.art)}" alt="" loading="lazy"><i aria-hidden="true">?</i></div>
          <div class="form-index-card-copy">
            <h3>${open ? form.name : 'НЕИЗВЕСТНО'}</h3>
            <div class="form-index-ultra">${open && form.ultra
              ? `<p>${form.ultra[1]}</p>`
              : '<p class="form-index-empty-ultra">?</p>'}</div>
          </div>
        </article>`;
      }).join('')}</div>
    </div>`;
  }

  function discoverCurrentForm() {
    const entry = FORM_INDEX.find(form => menuCategoryLevels()[form.id] === 3);
    if (!entry || save.discoveredForms.includes(entry.id)) return;
    save.discoveredForms.push(entry.id);
    persist();
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
      sound('uiTab');
      renderRecipesPanel();
    }));
  }

  function renderLaboratoryConveyorPanel() {
    const unlocked = new Set(save.unlockedMutations || []);
    const pool = save.activeMutationPool || [];
    const full = stomachIsFull();
    const pipes = pool.map((id, index) => {
      const mutation = mutationById(id);
      return `<button class="lab-feed-pipe mutation-${id} ${index === selectedConveyorSlot ? 'selected' : ''}" data-conveyor-slot="${index}" type="button" ${full ? 'disabled' : ''} aria-label="${index + 1} дозатор: ${mutation?.name || 'пусто'}">
        <span class="lab-pipe-neck" aria-hidden="true"></span>
        <span class="lab-pipe-body"><span class="lab-pipe-emblem">${mutation ? `<img src="${versionedAsset(mutation.image)}" alt="">` : '<i>+</i>'}</span></span>
        <span class="lab-pipe-mouth" aria-hidden="true"></span>
      </button>`;
    }).join('');
    const slots = [...allMutations(), { id: 'future-1', future: true }, { id: 'future-2', future: true }].map(mutation => {
      const available = !mutation.future && unlocked.has(mutation.id);
      return `<button class="lab-pool-mutation mutation-${mutation.id} ${available ? 'available' : 'locked'} ${pool.includes(mutation.id) ? 'equipped' : ''}" ${available && !full ? `data-pool-mutation="${mutation.id}"` : 'disabled'} type="button" aria-label="${available ? mutation.name : 'Неизвестная мутация'}">
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
    if (window.SlimeHomeConsole) {
      const button = $('#mutationChooseBtn');
      if (button) button.disabled = true;
      void selectHomeMutation(id, {fromLaboratory:true}).then(() => renderRecipesPanel());
      return;
    }
    if (!mutationById(id) || stomachIsFull() || session?.offerTransition) return;
    const pool = [...(save.activeMutationPool || [])];
    const occupiedSlot = pool.indexOf(id);
    if (occupiedSlot === selectedConveyorSlot) return;
    if (occupiedSlot >= 0) [pool[selectedConveyorSlot], pool[occupiedSlot]] = [pool[occupiedSlot], pool[selectedConveyorSlot]];
    else pool[selectedConveyorSlot] = id;
    settleHomeRewardFlight();
    save.selectedMutation = id;
    save.activeMutationPool = pool;
    if (id === 'frost') checkOnboardingProgress({ event: 'frost-selected' });
    laboratoryReplaceMode = false;
    persist();
    sound('uiSelect');
    feedback(6);
    if (session && !stomachIsFull() && !session.offerTransition) {
      generateOffer({ resetRerolls: false });
      renderDraft({ offerMotion: 'enter' });
      void settleConveyorArrival(menuReducedMotion);
    }
    renderRecipesPanel();
    requestAnimationFrame(() => $(`[data-lab-mutation="${id}"]`)?.classList.add('just-changed'));
  }

  function setLaboratoryView(view, { animate = true } = {}) {
    if (!['synthesis','mutations'].includes(view) || mutationAnimating) return;
    const clearSynthesisResult = view === 'mutations' && laboratoryView === 'synthesis' && laboratorySynthesisResult;
    laboratoryView = view;
    if (clearSynthesisResult) {
      laboratorySynthesisResult = null;
      renderRecipesPanel();
      $('#labMutationsTab')?.focus({ preventScroll:true });
      return;
    }
    const root = els.panelContent.querySelector('.mutation-lab-v2');
    if (!root) return;
    root.dataset.view = view;
    root.querySelectorAll('[data-lab-view]').forEach(button => {
      const selected = button.dataset.labView === view;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    root.querySelectorAll('[data-lab-pane]').forEach(pane => { pane.hidden = pane.dataset.labPane !== view; });
    laboratoryTabAnimation?.cancel();
    laboratoryTabAnimation = null;
    const pane = root.querySelector(`[data-lab-pane="${view}"]`);
    if (animate && !menuReducedMotion && pane) {
      laboratoryTabAnimation = pane.animate([{ opacity:0,transform:'translateY(7px)' },{ opacity:1,transform:'none' }],{ duration:220,easing:'ease-out' });
      // The first measurement includes the entrance translation. Re-measure
      // the target at its final position when this tab has finished moving.
      laboratoryTabAnimation.finished.then(queueTutorialRender, () => {});
    }
    queueTutorialRender();
  }

  const LAB_STAGE_BADGES = [null, 'assets/ui/lab-refit/stage-i.webp', 'assets/ui/lab-refit/stage-ii.webp', 'assets/ui/lab-refit/stage-iii.webp'];
  const LAB_ABILITY_COPY = {
    fire: ['Поджигает блоки', 'Поджигает блоки впереди', 'Средние блоки лучше горят', 'Призывает феникса'],
    frost: ['Превращает породу в снег', 'Снежинка замораживает путь вперёд', 'Новая ледяная форма', 'Замораживает целые ряды'],
    electric: ['Бьёт соседний блок током', 'Рывок сквозь породу и разряды', 'Молния бьёт ещё один блок', 'Обрушивает шесть молний'],
    cosmos: ['Планета бьёт блоки', 'Увеличивает планету и её урон', 'Обрушивает звездопад', 'Пролетает сквозь породу кометой'],
    nano: ['Дрон стреляет вниз раз в секунду', 'Дрон выпускает шесть быстрых выстрелов', 'Выстрел задевает ещё один блок', 'Управляй мехом-бурильщиком 5 секунд'],
    telekinesis: ['Бросает породу под себя', 'Сжимает 4 блока. Коснись цели для броска', 'Осколки передают лишний урон соседям', 'Сжимает породу псионическим прессом'],
    cloning: ['Выращивает взрывные споры', 'Споры выпускают грибочки', 'Оставляет дорожку из спор', 'Призывает гриба-великана'],
    phantom: ['Духи ставят взрывные метки', 'Выпускает восемь духов', 'Летит сквозь породу с метками', 'Призывает призрачный поезд'],
    glitch: ['Связывает блоки общим уроном', 'Превращает колючку в полезный блок', 'Даёт выбрать сбой', 'Усиленный сбой меняет большую область'],
    infinity: ['Щит каждые 8 секунд', 'Синяя сфера стягивает блоки', 'Открывает красную сферу', 'Фиолетовая сфера пробивает породу']
  };

  function laboratoryFoodMarkup(id, stage, { incoming = false, particlesOnly = false } = {}) {
    const food = foodForMutation(id, stage);
    if (!food) return '';
    const bounds = window.SlimeFoodGroundBounds?.[food.id];
    const fit = bounds ? ` style="--food-width:min(calc(94cqw * ${bounds[0] / (bounds[4] - bounds[2])}),calc(94cqh * ${bounds[0] / (bounds[5] - bounds[3])}));--food-center-x:${-50 * (bounds[2] + bounds[4]) / bounds[0]}%;--food-center-y:${-100 * bounds[5] / bounds[1]}%"` : '';
    const effects = particlesOnly && id === 'phantom'
      ? '<span class="mutation-element-fx mutation-psionics-fx lab-food-effects lab-phantom-motes" aria-hidden="true"><i></i><i></i><i></i><i></i></span>'
      : foodElementFxMarkup(food, 'lab-food-effects');
    return `<span class="lab-tray-food${incoming ? ' lab-tray-incoming' : ''}" data-food-id="${food.id}"${fit}><span class="lab-food-hover">${effects}${foodArtMarkup(food, 'lab-tray-food-art')}</span></span>`;
  }

  function laboratoryApparatus(id, stage) {
    const food = id === 'infinity' ? foodForMutation(id, stage || 1) : null;
    return `<div class="lab-tray${stage ? '' : ' is-locked'}" ${food ? '' : 'aria-hidden="true"'} data-food-stage="${stage}">
      ${food ? `<span class="lab-infinity-food-name">${food.name}</span>` : ''}
      <img class="lab-tray-machine" src="${versionedAsset('assets/ui/lab-refit/machine.webp')}" alt="">
      <div class="lab-evolution-lights">
        <i class="lab-evolution-lens"></i><i class="lab-evolution-lens is-right"></i>
        <i class="lab-evolution-indicator"></i><i class="lab-evolution-indicator is-right"></i>
      </div>
      <canvas class="lab-evolution-visual"></canvas>
      ${laboratoryFoodMarkup(id, stage || 1, { particlesOnly: true })}
    </div>`;
  }

  function laboratoryBadge(stage) {
    return `<img class="lab-stage-badge" src="${versionedAsset(LAB_STAGE_BADGES[stage])}" alt="${['','I','II','III'][stage]}">`;
  }

  function laboratoryBackdrop(id) {
    if (id === 'infinity') return versionedAsset('assets/ui/lab-v3/backgrounds/infinity-gojo-spheres.webp');
    return versionedAsset(`assets/ui/lab-v3/backgrounds/${id}.webp`);
  }

  function laboratoryEmblem(id) {
    if (id === 'infinity') return versionedAsset(INFINITY.EMBLEM);
    return versionedAsset(`assets/ui/lab-v3/emblems/${id}.webp`);
  }

  function laboratoryCurrency(amount) {
    return `<span class="lab-price"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt="">${amount}</span>`;
  }

  function laboratoryChooser(label) {
    return `<button class="lab-swap" type="button" data-lab-chooser aria-haspopup="dialog" aria-label="${label}" title="Поменять"></button>`;
  }

  function renderLaboratoryDevelopment(mutation) {
    const id = mutation.id;
    const level = mutationLevel(id);
    const task = slimeDevelopment(id);
    const [passive, active, improvement, ultimate] = LAB_ABILITY_COPY[id];
    const isInfinity = id === 'infinity';
    const selected = selectedSlimeMutationId() === id;
    const activeStage = level ? selectedUltimateStage(id) : 0;
    const fixedMoves = isInfinity || ['fire','frost','electric'].includes(id);
    const lock = `<img class="lab-stage-locked-icon" src="${versionedAsset('assets/ui/lock.webp')}" alt="Закрыто">`;
    const stages = [1, 2, 3].map(stage => {
      const rule = slimeDevelopment(id, stage);
      const owned = level >= stage;
      const ready = level > 0 && rule.ready;
      const canBuy = ready && (adminInfiniteResearch || save.researchUnits >= rule.cost);
      const title = ['Базовая форма','Усиленная','Абсолютная'][stage - 1];
      const isMove = owned && level > 1 && !fixedMoves;
      const current = owned && stage === activeStage;
      const status = current ? '<span class="lab-row-current">Текущая</span>' : '<span class="lab-row-complete"><i aria-hidden="true">✓</i>Развито</span>';
      return `<article class="lab-development-row ${owned || canBuy ? '' : 'is-unavailable'} ${current ? 'is-current' : owned ? 'is-developed' : ''}" data-development-stage="${stage}" ${current ? 'aria-current="step"' : ''}>
        ${laboratoryBadge(stage)}<div class="lab-development-copy"><h4 id="mutationStage${stage}" tabindex="-1">${title}</h4><p>${[active, improvement, ultimate][stage - 1]}</p></div>
        ${ready ? `<button id="mutationUpgradeBtn" class="lab-action lab-action-green lab-upgrade" data-open-stage="${stage}" type="button" ${canBuy ? '' : 'disabled'} aria-label="Развить до стадии ${stage} за ${rule.cost} осколков"><b>Развить</b>${laboratoryCurrency(rule.cost)}</button>` : !owned ? lock : isMove ? `<button class="lab-move ${current ? 'is-current' : ''}" type="button" data-lab-move="${stage}" aria-pressed="${current}" aria-label="${current ? 'Текущий приём' : 'Выбрать приём'} ${ULTIMATE_STAGES.get(id,stage).name}">${status}</button>` : status}
      </article>`;
    }).join('');
    return `<section id="labMutationsPane" class="lab-development-pane ${level ? '' : 'is-locked'}" data-mutation-id="${id}" data-mutation-level="${level}" data-lab-pane="mutations" role="tabpanel" aria-labelledby="labMutationsTab" style="--lab-scene:url('${laboratoryBackdrop(id)}')">
      <div class="lab-skill-hero">
        <div class="lab-large-emblem"><img src="${laboratoryEmblem(id)}" alt="">${level ? '' : lock}${laboratoryChooser('Поменять мутацию')}</div>
        <div class="lab-skill-name ${mutation.name.length > 7 ? 'is-long' : ''}">
          <h3>${mutation.name}</h3><p>${isInfinity && !level ? 'Награда за 7-й день' : passive}</p>
          <div class="lab-progress ${task.max && level ? 'is-max' : ''}" role="progressbar" aria-label="${!level ? 'Мутация закрыта' : task.max ? 'Все стадии открыты' : task.label}" aria-valuemin="0" aria-valuemax="${task.target}" aria-valuenow="${level ? Math.min(task.target,task.current) : 0}" title="${task.max && level ? 'Все стадии открыты' : task.label}"><span class="lab-progress-track"><i style="width:${level ? task.max ? 100 : task.percent : 0}%"></i></span><span class="lab-progress-icon" aria-hidden="true"><img src="${versionedAsset('assets/ui/lab-v3/xp.webp')}" alt=""></span><b>${!level ? 'Закрыто' : task.max ? 'Максимум' : `${Math.min(task.target,task.current)} / ${task.target}`}</b></div>
          ${level ? `<button id="mutationChooseBtn" class="lab-action lab-choose ${selected ? 'is-selected' : ''}" type="button" aria-pressed="${selected}" ${selected ? 'disabled' : ''}>${selected ? '<span aria-hidden="true">✓</span> Выбрано' : 'Выбрать'}</button>` : isInfinity ? '<button class="lab-action lab-choose" id="labGoRewards" type="button">К наградам</button>' : '<button class="lab-action lab-choose" id="labGoSynthesis" type="button">К синтезу</button>'}
        </div>
      </div>
      <section class="lab-development-list" aria-label="Стадии развития">${stages}</section>
      ${laboratoryApparatus(id,level)}
    </section>`;
  }

  function renderLaboratorySynthesis(mutation, candidates) {
    const exhausted = !mutation;
    const id = mutation?.id;
    const result = !exhausted && id === laboratorySynthesisResult;
    const canBrowse = candidates.length > (result ? 0 : 1);
    const cost = currentMutationCost();
    const available = save.researchUnits + save.mutationProgress;
    const canBuy = adminInfiniteResearch || available >= cost;
    const description = LAB_ABILITY_COPY[id]?.[1] || '';
    const options = candidates.map(candidate => {
      const body = FORM_INDEX.find(option => option.id === candidate.id)?.art;
      const description = LAB_ABILITY_COPY[candidate.id]?.[1] || MUTATION_REVEAL_DESCRIPTIONS[candidate.id] || '';
      return `<button class="lab-synth-option" data-synthesis-candidate="${candidate.id}" type="button" aria-pressed="${candidate.id === id}">
        <span class="lab-synth-silhouette"><img src="${body ? versionedAsset(body) : laboratoryEmblem(candidate.id)}" alt=""></span>
        <span><b>${candidate.name}</b><small>${description}</small></span>
      </button>`;
    }).join('');
    return `<section id="labSynthesisPane" class="lab-synthesis-simple lab-synthesis-station" data-lab-pane="synthesis" data-synthesis-phase="${exhausted ? 'exhausted' : result ? 'ready' : 'idle'}" role="tabpanel" aria-labelledby="labSynthesisTab">
      ${exhausted ? '<div class="lab-synth-summary lab-synth-complete"><h3>Все мутации открыты</h3></div>' : `<div class="lab-synth-selection">
        <button class="lab-synth-arrow is-prev" data-synthesis-step="-1" type="button" aria-label="Предыдущая сила" ${canBrowse ? '' : 'disabled'}></button>
        <div class="lab-synth-summary"><h3>${mutation.name}</h3><p>${description}</p></div>
        <button class="lab-synth-arrow" data-synthesis-step="1" type="button" aria-label="Следующая сила" ${canBrowse ? '' : 'disabled'}></button>
      </div>`}
      <div class="lab-synthesis-devices">
        <div class="lab-synthesis-machine">
          <div class="lab-synthesis-housing" aria-hidden="true"></div>
          <span class="lab-core-reactor" aria-hidden="true"><i></i><img src="${versionedAsset('assets/ui/lab-refit/synthesis-core-v1.webp')}" alt=""></span>
          ${exhausted ? '' : `<button class="lab-synth-socket" data-synthesis-chooser type="button" aria-label="Выбрать силу. Сейчас ${mutation.name}${result ? '' : ', закрыта'}" aria-haspopup="dialog" ${candidates.length ? '' : 'disabled'}><img class="lab-dock-emblem" src="${laboratoryEmblem(id)}" alt=""><img class="lab-synth-lock" src="${versionedAsset('assets/ui/lock.webp')}" alt=""></button>`}
          ${candidates.length ? '<button class="lab-synth-change" data-synthesis-chooser type="button" aria-label="Выбрать другую силу" aria-haspopup="dialog"></button>' : ''}
          <i class="lab-dock-lamp" aria-hidden="true"></i><i class="lab-dock-lamp is-lower" aria-hidden="true"></i>
          ${exhausted ? '' : `<div class="lab-tray" data-food-stage="1" aria-hidden="true">
            <canvas class="lab-synthesis-visual"></canvas>
            <i class="lab-chamber-node is-left"></i><i class="lab-chamber-node is-right"></i>
            <i class="lab-synthesis-nozzle"></i>
            ${laboratoryFoodMarkup(id,1)}
          </div>`}
          <p class="lab-synthesis-status" role="status" aria-live="polite">${exhausted ? 'Сила исчерпана' : result ? 'Сила синтезирована!' : 'Сила ещё закрыта'}</p>
        </div>
      </div>
      ${exhausted ? '<div class="lab-synth-shutdown">Аппарат закрыт</div>' : `<div class="lab-synth-action">${result
        ? `<button class="lab-action lab-synth-button" id="labEquipSynthesized" type="button" data-synthesized="${id}"><b>Выбрать мутацию</b></button>`
        : `<button class="lab-action lab-synth-button" id="labUnlockMutation" type="button" data-unlock-mutation="${id}" ${canBuy ? '' : 'disabled'}><b>Синтезировать</b>${laboratoryCurrency(cost)}</button>`}
        <p class="lab-synth-hint">${result ? 'Блюдо будет ждать на главном экране' : canBuy ? 'Блюдо откроет эту силу' : `Не хватает ${cost - available} осколков`}</p>
      </div>`}
      ${options ? `<dialog id="labSynthesisPicker" class="lab-picker lab-synthesis-picker" aria-labelledby="labSynthesisPickerTitle"><header><h3 id="labSynthesisPickerTitle">Выбери силу</h3><button data-synthesis-picker-close type="button" aria-label="Закрыть выбор силы">✕</button></header><div class="lab-synth-options">${options}</div></dialog>` : ''}
    </section>`;
  }

  async function synthesizeLaboratoryMutation(id, synthButton) {
    if (mutationAnimating || tutorialActive() || mutationLevel(id) || !availableSyntheses().some(option => option.id === id)) return;
    const cost = currentMutationCost();
    const available = save.researchUnits + save.mutationProgress;
    const pane = $('#labSynthesisPane');
    if (!pane || pane.hidden || (!adminInfiniteResearch && available < cost)) return;

    mutationAnimating = true;
    const token = ++mutationAnimationToken;
    const status = pane.querySelector('.lab-synthesis-status');
    pane.setAttribute('aria-busy', 'true');
    pane.querySelectorAll('button').forEach(button => { button.disabled = true; });
    synthButton.innerHTML = '<b>Синтез идёт…</b><span class="lab-synth-button-track" role="progressbar" aria-label="Синтез мутации" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i class="lab-synth-button-progress"></i></span>';
    $$('[data-lab-view]').forEach(button => { button.disabled = true; });

    // Commit the purchase with its reward so closing or reloading during the reveal is safe.
    save.researchUnits = available - (adminInfiniteResearch ? 0 : cost);
    save.mutationProgress = 0;
    save.mutationInvestTapCount = 0;
    save.unlockedMutations.push(id);
    save.mutationLevels[id] = 1;
    save.mutationExperience[id] = 0;
    save.mutationMastery[id] = 0;
    laboratorySynthesisResult = id;
    laboratorySynthesisId = null;
    persist();
    $('#mutationPanelBalance').textContent = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);

    const buttonLabel = synthButton.querySelector('b');
    const progress = synthButton.querySelector('[role="progressbar"]');
    const isActive = () => token === mutationAnimationToken && pane.isConnected;
    const reveal = () => {
      if (pane.dataset.synthesisRevealed) return;
      pane.dataset.synthesisRevealed = 'true';
      buttonLabel.textContent = 'Сила открыта!';
      status.textContent = 'Сила синтезирована!';
      pane.querySelector('.lab-synth-hint').textContent = 'Блюдо будет ждать на главном экране';
      stopSynthMotor();
      sound('machineReady');
      feedback([10, 18, 12]);
    };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const dish = pane.querySelector('.lab-tray-food-art');
      await dish?.decode().catch(() => {});
      if (!isActive()) return;
      pane.dataset.synthesisPhase = 'working';
      status.textContent = 'Реактор запущен';
      sound('machineFill');
      const bar = progress.firstElementChild;
      let forming = false;
      await window.SlimeLabSynthesisAnimation?.play(pane.querySelector('.lab-tray'), {
        isActive,
        onProgress(fraction) {
          bar.style.transform = `scaleX(${fraction})`;
          const percent = String(Math.floor(fraction * 100));
          if (progress.getAttribute('aria-valuenow') !== percent) progress.setAttribute('aria-valuenow', percent);
          if (!forming && fraction >= .30) {
            forming = true;
            sound('machineProcess');
            status.textContent = 'Формируем блюдо';
          }
        },
        onReveal: reveal
      });
      if (!isActive()) return;
    }

    reveal();
    const hasCandidates = availableSyntheses().some(option => !mutationLevel(option.id));
    pane.querySelector(`[data-synthesis-candidate="${id}"]`)?.remove();
    pane.querySelectorAll('[data-synthesis-step], [data-synthesis-chooser]').forEach(button => { button.disabled = !hasCandidates; });
    const socket = pane.querySelector('.lab-synth-socket');
    socket.setAttribute('aria-label', `Выбрать силу. Сейчас ${mutationById(id).name}`);
    pane.dataset.synthesisPhase = 'ready';
    pane.removeAttribute('aria-busy');
    progress.remove();
    synthButton.id = 'labEquipSynthesized';
    delete synthButton.dataset.unlockMutation;
    synthButton.dataset.synthesized = id;
    buttonLabel.textContent = 'Выбрать мутацию';
    synthButton.disabled = false;
    mutationAnimating = false;
    $$('[data-lab-view]').forEach(button => { button.disabled = false; });
    synthButton.focus({ preventScroll:true });
    queueTutorialRender();
  }

  function renderRecipesPanel() {
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    $('#mutationPrize')?.remove();
    activeLaboratoryTab = 'mutations';

    const unlocked = new Set(save.unlockedMutations || []);
    const selectedMutation = mutationById(selectedLaboratoryMutationId) || mutationById('fire');
    const candidates = availableSyntheses().filter(mutation => !unlocked.has(mutation.id));
    if (laboratorySynthesisResult && !unlocked.has(laboratorySynthesisResult)) laboratorySynthesisResult = null;
    const synthesisMutation = laboratorySynthesisResult ? mutationById(laboratorySynthesisResult)
      : candidates.find(mutation => mutation.id === laboratorySynthesisId) || candidates[0];
    const allUnlocked = allSynthesesUnlocked();
    const mutationCost = currentMutationCost();
    const progress = allUnlocked ? mutationCost : Math.min(mutationCost, Math.max(0, save.mutationProgress));
    const readyToReveal = progress >= mutationCost && !allUnlocked;
    const remaining = Math.max(0, mutationCost - progress);
    const fillPercent = allUnlocked ? 100 : Math.min(100, progress / mutationCost * 100);
    const liquidFillPercent = allUnlocked ? 0 : fillPercent;
    const researchBalance = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);
    const collectionCapacity = allMutations().length;
    const visibleUnlockedCount = allMutations().filter(mutation => unlocked.has(mutation.id)).length;

    els.panelTitle.innerHTML = `<span class="lab-title-plaque">Лаборатория</span><span class="mutation-panel-balance" aria-label="${adminInfiniteResearch ? 'Бесконечные осколки Аномалии' : `Осколки Аномалии: ${save.researchUnits}`}"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt=""><b id="mutationPanelBalance">${researchBalance}</b></span>`;

    const collection = [...allMutations(), INFINITY_MUTATION].map(mutation => {
      const owned = Boolean(mutationLevel(mutation.id));
      return `<button type="button" class="lab-picker-item ${owned ? '' : 'is-locked'}" data-lab-mutation="${mutation.id}" data-owned="${owned}" aria-label="${mutation.name}${owned ? '' : ', закрыта'}"><img src="${laboratoryEmblem(mutation.id)}" alt=""><b>${mutation.name}</b></button>`;
    }).join('');
    const machineHint = allUnlocked
      ? 'ВСЕ МУТАЦИИ ОТКРЫТЫ'
      : readyToReveal
        ? 'РЕАКТОР ЗАПОЛНЕН\nНАЖМИ «СИНТЕЗ»'
        : mutationInvestmentHint();

    if (['reactor','synthesize','wait-synthesis','core','prize','gift','gift-delay','frost-reactor','frost-synthesize','frost-wait','frost-core','frost-prize'].includes(save.tutorialStep)) laboratoryView = 'synthesis';
    const tutorialSynthesis = tutorialActive();
    els.panelContent.innerHTML = `<div class="laboratory-panel mutation-lab-v2 lab-redesign lab-refit" data-view="${laboratoryView}">
      <nav class="lab-view-tabs" role="tablist" aria-label="Разделы лаборатории">
        <button id="labSynthesisTab" data-lab-view="synthesis" type="button" role="tab" aria-controls="labSynthesisPane">Синтез</button>
        <button id="labMutationsTab" data-lab-view="mutations" type="button" role="tab" aria-controls="labMutationsPane">Развитие</button>
      </nav>
      <div class="mutation-main-grid">
        ${tutorialSynthesis ? `<section id="labSynthesisPane" class="mutation-synth-pane" data-lab-pane="synthesis" role="tabpanel" aria-labelledby="labSynthesisTab">
          <button id="mutationCapsuleBtn" class="mutation-capsule mutation-capsule-v2 ${allUnlocked ? 'is-complete' : ''} ${readyToReveal ? 'is-ready-to-synthesize' : ''}" type="button" ${allUnlocked || readyToReveal ? 'disabled' : ''} aria-label="${allUnlocked ? 'Все мутации открыты' : readyToReveal ? 'Реактор заполнен' : `Добавить осколки: ${nextMutationInvestmentAmount()}. Осталось ${remaining}`}">
            <span class="mutation-machine-visual" aria-hidden="true">
              <img class="mutation-machine-art machine-tall" src="${versionedAsset('assets/ui/laboratory-refined/synth-cabinet-v1-portrait.webp')}" alt="">
              <img class="mutation-machine-art machine-wide" src="${versionedAsset('assets/ui/laboratory-refined/synth-cabinet-v1.webp')}" alt="">
              <span class="mutation-glass">
                <span id="mutationLiquid" class="mutation-liquid-chamber" style="--liquid-fill:${liquidFillPercent}%"><span class="mutation-liquid-sprite"></span><span class="mutation-liquid-bubbles"><i></i><i></i><i></i><i></i><i></i><i></i></span></span>
                
                
              </span>
              
              <span id="mutationImpact" class="mutation-impact"></span>
              <span id="mutationInlet" class="mutation-inlet-target"></span>
              <span class="mutation-dispenser">
                <span class="mutation-dispenser-mouth"><span class="mutation-door-clip"><span class="mutation-dispenser-flap"></span></span><span id="mutationMystery" class="mutation-mystery"><i>?</i></span></span>
                <span class="mutation-dispenser-tray"></span>
                <span class="mutation-output-steam"><i></i><i></i><i></i><i></i><i></i><i></i></span>
                <span class="mutation-output-aura"></span>
              </span>
              <span id="mutationCapsuleHint" class="mutation-capsule-hint">${machineHint}</span>
            </span>
          </button>
          <div class="mutation-synth-progress ${readyToReveal ? 'is-filled' : ''}" role="progressbar" aria-label="${allUnlocked ? 'Все мутации открыты' : 'Заполнение синтезатора, осколки'}" aria-valuemin="0" aria-valuemax="${mutationCost}" aria-valuenow="${progress}" aria-valuetext="${allUnlocked ? `Открыто ${visibleUnlockedCount} из ${collectionCapacity} мутаций` : `${progress} из ${mutationCost} осколков`}">
            <span class="mutation-synth-progress-fill" style="width:${fillPercent}%"></span>
            <b id="mutationSynthProgressValue" class="mutation-synth-progress-value">${allUnlocked ? `${visibleUnlockedCount} / ${collectionCapacity}` : `${progress} / ${mutationCost}`}</b>
            <span id="mutationSynthProgressGain" class="mutation-synth-progress-gain" aria-hidden="true"></span>
          </div>
          <div class="mutation-synth-controls">
            <span class="mutation-synth-balance"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt=""><span><small>ОСТАЛОСЬ</small><b id="mutationRemaining">${allUnlocked ? 0 : remaining}</b></span></span>
            <button id="mutationSynthesizeBtn" class="mutation-synthesize-btn ${readyToReveal ? 'ready' : ''}" type="button" ${readyToReveal ? '' : 'disabled'}><span>СИНТЕЗ</span></button>
          </div>
        </section>` : renderLaboratorySynthesis(synthesisMutation, candidates)}
        ${renderLaboratoryDevelopment(selectedMutation)}
      </div>
      <dialog id="labMutationPicker" class="lab-picker" aria-labelledby="labPickerTitle">
        <header><h3 id="labPickerTitle">Мутации</h3><button type="button" data-lab-picker-close aria-label="Закрыть выбор мутации">✕</button></header>
        <div id="mutationCollection" class="lab-picker-grid">${collection}</div>
      </dialog>
    </div>`;

    setLaboratoryView(laboratoryView, { animate: false });

    const selectSynthesis = (id, focusSelector) => {
      if (mutationAnimating) return;
      $('#labSynthesisPicker[open]')?.close();
      if (!laboratorySynthesisResult && id === synthesisMutation?.id) {
        $('#labSynthesisPane .lab-synth-socket')?.focus({ preventScroll:true });
        return;
      }
      laboratorySynthesisResult = null;
      laboratorySynthesisId = id;
      sound('uiSelect');
      renderRecipesPanel();
      const socket = $('#labSynthesisPane .lab-dock-emblem');
      if (socket && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        socket.animate([
          { opacity:0,transform:'translateY(-12px) scale(.72) rotate(-12deg)' },
          { opacity:1,transform:'translateY(0) scale(1.04) rotate(0)' },
          { opacity:1,transform:'none' }
        ], { duration:340,easing:'ease-out' });
        $('#labSynthesisPane .lab-core-reactor').classList.add('just-switched');
      }
      $(focusSelector)?.focus({ preventScroll:true });
    };
    const synthesisPicker = $('#labSynthesisPicker');
    $$('[data-synthesis-chooser]').forEach(button => button.addEventListener('click', () => {
      if (mutationAnimating) return;
      sound('uiOpen');
      synthesisPicker?.showModal();
      (synthesisPicker?.querySelector('[aria-pressed="true"]') || synthesisPicker?.querySelector('[data-synthesis-candidate]'))?.focus({ preventScroll:true });
    }));
    $('[data-synthesis-picker-close]')?.addEventListener('click', () => synthesisPicker.close());
    synthesisPicker?.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.stopPropagation(); synthesisPicker.close(); }
    });
    synthesisPicker?.addEventListener('close', () => $('#labSynthesisPane .lab-synth-socket')?.focus({ preventScroll:true }));
    $$('[data-synthesis-candidate]').forEach(button => button.addEventListener('click', () => {
      selectSynthesis(button.dataset.synthesisCandidate, '#labSynthesisPane .lab-synth-socket');
    }));
    $$('[data-synthesis-step]').forEach(button => button.addEventListener('click', () => {
      const step = Number(button.dataset.synthesisStep);
      const remaining = candidates.filter(option => !mutationLevel(option.id));
      const index = remaining.findIndex(option => option.id === synthesisMutation?.id);
      const nextIndex = index < 0 ? (step > 0 ? 0 : remaining.length - 1) : (index + step + remaining.length) % remaining.length;
      const next = remaining[nextIndex];
      if (next) selectSynthesis(next.id, `[data-synthesis-step="${step}"]`);
    }));
    const picker = $('#labMutationPicker');
    $$('[data-lab-chooser]').forEach(button => button.addEventListener('click', () => {
      picker.querySelectorAll('[data-lab-mutation]').forEach(item => {
        item.setAttribute('aria-pressed', String(item.dataset.labMutation === selectedMutation.id));
      });
      sound('uiOpen');
      picker.showModal();
    }));
    picker.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.stopPropagation(); picker.close(); }
    });
    $('[data-lab-picker-close]').addEventListener('click', () => picker.close());
    picker.querySelectorAll('[data-lab-mutation]').forEach(button => button.addEventListener('click', () => {
      selectedLaboratoryMutationId = button.dataset.labMutation;
      picker.close();
      sound('uiSelect');
      renderRecipesPanel();
      $('[data-lab-pane]:not([hidden]) [data-lab-chooser]')?.focus({ preventScroll:true });
    }));
    $$('[data-lab-view]').forEach(button => {
      button.addEventListener('click', () => {
        if (laboratoryView === button.dataset.labView) return;
        sound('uiTab'); setLaboratoryView(button.dataset.labView);
      });
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key) || tutorialActive() || mutationAnimating) return;
        event.preventDefault();
        const next = ['ArrowLeft','Home'].includes(event.key) ? 'synthesis' : 'mutations';
        if (laboratoryView !== next) sound('uiTab');
        setLaboratoryView(next); $(`[data-lab-view="${next}"]`)?.focus();
      });
    });
    const capsuleButton = $('#mutationCapsuleBtn');
    setMutationMachineHint(machineHint);
    capsuleButton?.addEventListener('click', handleMutationCapsuleClick);
    capsuleButton?.addEventListener('pointerdown', startMutationFeedHold);
    capsuleButton?.addEventListener('pointerup', stopMutationFeedHold);
    capsuleButton?.addEventListener('pointercancel', stopMutationFeedHold);
    capsuleButton?.addEventListener('lostpointercapture', stopMutationFeedHold);
    if (capsuleButton) window.SlimeSynthReactor?.mount(capsuleButton);
    $('#mutationSynthesizeBtn')?.addEventListener('click', () => startMutationSynthesis(capsuleButton));
    $('#mutationUpgradeBtn')?.addEventListener('click', event => requestMutationEvolution(selectedMutation.id, Number(event.currentTarget.dataset.openStage), event.currentTarget));
    $('#mutationChooseBtn')?.addEventListener('click', () => setActiveConveyorMutation(selectedMutation.id));
    $$('[data-lab-move]').forEach(button => button.addEventListener('click', () => {
      const stage = Number(button.dataset.labMove);
      if (stage > mutationLevel(selectedMutation.id)) return;
      save.mutationUltimateStages[selectedMutation.id] = stage;
      persist({ refreshUI:false });
      sound('uiPress');
      renderRecipesPanel();
      $(`[data-lab-move="${stage}"]`)?.focus({ preventScroll:true });
    }));
    $('#labGoSynthesis')?.addEventListener('click', () => {
      laboratorySynthesisResult = null;
      laboratorySynthesisId = selectedMutation.id;
      laboratoryView = 'synthesis';
      renderRecipesPanel();
      $('#labSynthesisTab')?.focus({ preventScroll:true });
    });
    $('#labGoRewards')?.addEventListener('click', () => {
      rewardsTab = 'daily';
      renderPanel('rewards');
    });
    $('#labUnlockMutation, #labEquipSynthesized')?.addEventListener('click', async event => {
      const button = event.currentTarget;
      if (button.dataset.unlockMutation) {
        await synthesizeLaboratoryMutation(button.dataset.unlockMutation, button);
        return;
      }
      const id = button.dataset.synthesized;
      button.disabled = true;
      const selected = await selectHomeMutation(id, { fromLaboratory:true });
      if (!selected && selectedSlimeMutationId() !== id) {
        button.disabled = false;
        showToast('Дождись, пока слайм освободится');
        return;
      }
      selectedLaboratoryMutationId = id;
      laboratoryView = 'mutations';
      laboratorySynthesisResult = null;
      closePanel();
    });
    queueTutorialRender();
  }

  function renderResultSlimeProgress(experience) {
    const host = document.getElementById('resultSlimeProgress');
    if (!host || !run) return;
    const mutation = mutationById(run.mutationId);
    const progress = slimeDevelopment(run.mutationId, undefined, experience);
    const finalProgress=slimeDevelopment(run.mutationId,undefined,run.experienceAfter??experience);
    if (host.dataset.runId !== String(resultRevealToken) || !host.querySelector('.slime-personal-progress')) {
      host.dataset.runId = String(resultRevealToken);
      host.innerHTML = `<img src="${versionedAsset(mutation.image)}" alt=""><div><h3>${mutation.name}<span></span></h3><div class="slime-personal-progress" role="progressbar" aria-label="Прогресс задания ${mutation.name}"><i></i><b></b></div><p></p></div>`;
      const resultIcon = els.resultCoins.closest('.result-stat')?.querySelector('img');
      if (resultIcon) resultIcon.src = versionedAsset(mutation.image);
    }
    host.classList.toggle('is-evolution-ready',finalProgress.ready);
    host.querySelector('h3 span').textContent=finalProgress.ready?'':`СТАДИЯ ${['I','II','III'][progress.stage-1]}`;
    const bar = host.querySelector('.slime-personal-progress');
    bar.querySelector('i').style.width = `${progress.percent}%`;
    bar.querySelector('b').textContent = progress.max ? 'ВСЕ СТАДИИ ОТКРЫТЫ' : `${Math.min(experience, progress.target)} / ${progress.target}`;
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', String(progress.target));
    bar.setAttribute('aria-valuenow', String(Math.min(experience, progress.target)));
    host.querySelector('p').textContent = finalProgress.ready ? 'Можно развить' : progress.max ? 'Все стадии открыты!' : progress.label;
  }

  function animateResultSlimeProgress(token) {
    if (!run) return;
    const currentRun = run, started = performance.now();
    const reduced = menuReducedMotion;
    const step = now => {
      if (run !== currentRun || token !== resultRevealToken) return;
      const ratio = reduced ? 1 : clamp((now - started - 600) / 1400, 0, 1);
      const experience = Math.round(currentRun.experienceBefore + (currentRun.experienceAfter - currentRun.experienceBefore) * (1 - Math.pow(1 - ratio, 2)));
      renderResultSlimeProgress(experience);
      if (ratio < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function dismissMutationEvolution({ restoreFocus = true } = {}) {
    const prompt = els.panelOverlay.querySelector('.slime-evolution-dialog');
    if (!prompt) return;
    prompt.remove();
    els.panelOverlay.querySelector('.panel-modal').inert = false;
    if (restoreFocus) $('#mutationUpgradeBtn')?.focus({ preventScroll: true });
    queueTutorialRender();
  }

  function requestMutationEvolution(id, stage, sourceButton) {
    const level = mutationLevel(id);
    if (stage !== level + 1 || mutationUpgrading || !slimeDevelopment(id, stage).ready) return;
    dismissMutationEvolution({ restoreFocus: false });
    const cost = MUTATION_UPGRADE_COSTS[level];
    const canPay = (slimeDevelopment(id, stage).ready && (adminInfiniteResearch || save.researchUnits >= cost));
    const prompt = document.createElement('div');
    prompt.className = 'slime-evolution-dialog';
    prompt.innerHTML = `<section class="slime-evolution-prompt" role="alertdialog" aria-modal="true" aria-labelledby="evolutionPromptTitle" aria-describedby="evolutionPromptPrice">
      <h3 id="evolutionPromptTitle">Открыть стадию ${['I','II','III'][stage - 1]}?</h3>
      <p class="evolution-prompt-name">${mutationById(id).name}</p>
      <div id="evolutionPromptPrice" class="evolution-prompt-price"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt="осколков"><b>${cost}</b></div>
      ${!canPay ? `<p class="evolution-prompt-missing">Нужно ещё ${Math.max(0, cost - save.researchUnits)} осколков</p>` : ''}
      <div class="evolution-prompt-actions"><button type="button" data-evolution-cancel>ПОЗЖЕ</button><button id="mutationEvolutionConfirmBtn" type="button" ${canPay ? '' : 'disabled'}>ОТКРЫТЬ</button></div>
    </section>`;
    els.panelOverlay.appendChild(prompt);
    els.panelOverlay.querySelector('.panel-modal').inert = true;
    const cancel = prompt.querySelector('[data-evolution-cancel]');
    const confirm = prompt.querySelector('#mutationEvolutionConfirmBtn');
    cancel.addEventListener('click', () => dismissMutationEvolution());
    prompt.addEventListener('click', event => { if (event.target === prompt) dismissMutationEvolution(); });
    confirm.addEventListener('click', () => {
      if (mutationLevel(id) !== level || !(slimeDevelopment(id, stage).ready && (adminInfiniteResearch || save.researchUnits >= cost))) return;
      dismissMutationEvolution({ restoreFocus: false });
      void upgradeMutation(id, sourceButton);
    });
    prompt.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); dismissMutationEvolution();
      } else if (event.key === 'Tab') {
        const buttons = canPay ? [cancel, confirm] : [cancel];
        const next = (buttons.indexOf(document.activeElement) + (event.shiftKey ? buttons.length - 1 : 1)) % buttons.length;
        event.preventDefault(); buttons[next].focus();
      }
    });
    (canPay ? confirm : cancel).focus({ preventScroll: true });
    sound('uiPress');
    queueTutorialRender();
  }

  async function upgradeMutation(id, button) {
    const level = mutationLevel(id);
    const cost = MUTATION_UPGRADE_COSTS[level];
    if (!cost || mutationUpgrading || mutationAnimating || !button) return;
    if (!adminInfiniteResearch && save.researchUnits < cost) {
      showToast(`Нужно ещё ${cost - save.researchUnits} осколков`);
      feedback(7);
      return;
    }
    const evolution = slimeDevelopment(id);
    if (!evolution.ready) { showToast(`${evolution.label}: ${Math.min(evolution.current, evolution.target)}/${evolution.target}`); return; }
    mutationUpgrading = true;
    button.disabled = true;
    button.classList.add('is-upgrading');
    if (!adminInfiniteResearch) save.researchUnits -= cost;
    save.mutationLevels = { ...(save.mutationLevels || {}), [id]: level + 1 };
    if (id !== 'infinity' && level + 1 === 3 && !save.discoveredForms.includes(id)) {
      save.discoveredForms.push(id); save.unseenForms.push(id);
    }
    if (session?.foods?.some(food => foodRecipeFamily(food) === mutationFoodFamily(id))) {
      session.foods = [foodForMutation(id)];
      void preloadMenuAppearance(menuCategoryLevels());
      revealMenuMutation();
    }
    persist({ refreshUI: false });
    let playedReveal = false;
    const tray = $('#labMutationsPane .lab-tray');
    if (tray && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const controls = $$('.lab-refit .lab-view-tabs, #labMutationsPane .lab-skill-hero, #labMutationsPane .lab-development-list');
      controls.forEach(control => { control.inert = true; });
      tray.insertAdjacentHTML('beforeend', laboratoryFoodMarkup(id, level + 1, { incoming: true, particlesOnly: true }));
      const outgoing = tray.querySelector('.lab-tray-food:not(.lab-tray-incoming) .lab-tray-food-art');
      const incoming = tray.querySelector('.lab-tray-incoming .lab-tray-food-art');
      await Promise.allSettled([outgoing?.decode(), incoming?.decode()]);
      if (outgoing?.naturalWidth && incoming?.naturalWidth && tray.isConnected && !els.panelOverlay.classList.contains('hidden')) {
        sound('evolutionCharge');
        await window.SlimeLabFoodMorph?.play(tray, outgoing, incoming, {
          isActive: () => tray.isConnected && tray.classList.contains('is-evolving') && !els.panelOverlay.classList.contains('hidden'),
          onReveal: () => { playedReveal = true; sound('evolutionReady'); feedback([9, 16, 10]); }
        });
      }
      controls.forEach(control => { control.inert = false; });
    }
    mutationUpgrading = false;
    if (!playedReveal && tray?.isConnected && !els.panelOverlay.classList.contains('hidden')) sound('evolutionReady');
    feedback([7, 12, 7]);
    if (session && selectedSlimeMutationId() === id && !session.offerTransition && !stomachIsFull()) {
      generateOffer({ resetRerolls: false });
      renderDraft({ offerMotion: 'enter' });
      void settleConveyorArrival(menuReducedMotion);
    } else updatePersistentUI();
    if (!els.panelOverlay.classList.contains('hidden') && $('#labMutationsPane')) {
      renderRecipesPanel();
      if (playedReveal) {
        $('#labMutationsPane .lab-development-row.is-current')?.animate([
          { boxShadow: 'inset 0 0 20px #fff4b6a8, 0 0 12px #ffdf8077' },
          { boxShadow: 'inset 0 0 0 #fff4b600, 0 0 0 #ffdf8000' }
        ], { duration: 670, easing: 'ease-out' });
      }
      if (selectedLaboratoryMutationId === id) $(`#mutationStage${level + 1}`)?.focus({ preventScroll: true });
    }
    if (save.tutorialStep === 'upgrade-fire' && id === 'fire' && level === 1) setTutorialStep('upgrade-close-lab');
    checkOnboardingProgress();
  }

  function startMutationSynthesis(button) {
    if (!button || mutationAnimating || save.mutationProgress < currentMutationCost()) return;
    if (save.tutorialStep === 'synthesize') setTutorialStep('wait-synthesis');
    else if (save.tutorialStep === 'frost-synthesize') setTutorialStep('frost-wait');
    const synthButton = $('#mutationSynthesizeBtn');
    mutationAnimating = true;
    $$('[data-lab-view]').forEach(tab => { tab.disabled = true; });
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
    els.panelTitle.innerHTML = `<span>Лаборатория</span><span class="mutation-panel-balance" aria-label="${adminInfiniteResearch ? 'Бесконечные осколки Аномалии' : `Осколки Аномалии: ${save.researchUnits}`}"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt=""><b id="mutationPanelBalance">${researchBalance}</b></span>`;
    if (activeLaboratoryTab === 'conveyor') {
      renderLaboratoryConveyorPanel();
      return;
    }
    const unlocked = new Set(save.unlockedMutations || []);
    const allUnlocked = allSynthesesUnlocked();
    const mutationCost = currentMutationCost();
    const readyToReveal = save.mutationProgress >= mutationCost && !allUnlocked;
    const remaining = Math.max(0, mutationCost - save.mutationProgress);
    const collectionCapacity = allMutations().length;
    const visibleUnlockedCount = allMutations().filter(mutation => unlocked.has(mutation.id)).length;
    const collection = allMutations().map(mutation => {
      const isUnlocked = unlocked.has(mutation.id);
      return `<span class="mutation-collection-slot ${isUnlocked ? 'unlocked' : 'locked'}${isUnlocked && mutation.name.length > 9 ? ' long-name' : ''}" data-mutation-slot="${mutation.id}" aria-label="${isUnlocked ? mutation.name : 'Неизвестная мутация'}">
        ${isUnlocked ? mutationEmblemMarkup(mutation, { effects: false }) : '<i aria-hidden="true">?</i>'}
      </span>`;
    }).join('');
    const fillPercent = allUnlocked ? 100 : Math.min(100, save.mutationProgress / mutationCost * 100);

    els.panelContent.innerHTML = `<div class="laboratory-panel">${laboratoryTabsMarkup()}<div class="panel-section mutation-lab-panel">
      <button id="mutationCapsuleBtn" class="mutation-capsule ${allUnlocked ? 'is-complete' : ''}" type="button" ${allUnlocked || readyToReveal ? 'disabled' : ''} aria-label="${allUnlocked ? 'Все тестовые мутации открыты' : readyToReveal ? 'Открывается новая мутация' : `Добавить осколки: ${nextMutationInvestmentAmount()}. Осталось ${remaining}`}">
        <span class="mutation-side-feed" aria-hidden="true">
          <span id="mutationInlet" class="mutation-inlet"><i></i></span>
          <span class="mutation-feed-count"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt=""><b id="mutationRemaining">${allUnlocked || readyToReveal ? '✓' : remaining}</b></span>
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
          
          <span id="mutationImpact" class="mutation-impact" aria-hidden="true"></span>
        </span>
        <span id="mutationCapsuleHint" class="mutation-capsule-hint">${allUnlocked ? 'ВСЕ ДОСТУПНЫЕ МУТАЦИИ ОТКРЫТЫ' : adminInfiniteResearch || save.researchUnits > 0 ? 'НАЖМИ · ДОБАВИТЬ ОСКОЛОК' : 'НУЖЕН ОСКОЛОК АНОМАЛИИ'}</span>
      </button>
      <div class="mutation-collection-head"><b>МУТАЦИИ</b><span aria-label="Открыто ${visibleUnlockedCount} из ${collectionCapacity} мутаций"><strong>${visibleUnlockedCount}</strong><small>/ ${collectionCapacity}</small></span></div>
      <div id="mutationCollection" class="mutation-collection mutation-collection-v2">${collection}</div>
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
    if (!save.legacyStarterAccess && !save.unlockedMutations?.includes('fire')) return 10;
    if (!save.legacyStarterAccess && !save.unlockedMutations?.includes('frost')) return 50;
    const discovered = availableSyntheses().filter(mutation => save.unlockedMutations?.includes(mutation.id)).length;
    return MUTATION_STEPS * (discovered + 1);
  }

  function nextMutationInvestmentAmount() {
    const remaining = Math.max(0, currentMutationCost() - save.mutationProgress);
    return Math.min(10, remaining, adminInfiniteResearch ? remaining : save.researchUnits);
  }

  function mutationInvestmentHint() {
    const amount = nextMutationInvestmentAmount();
    const unit = amount % 10 === 1 && amount % 100 !== 11 ? 'ОСКОЛОК'
      : amount % 10 >= 2 && amount % 10 <= 4 && (amount % 100 < 12 || amount % 100 > 14) ? 'ОСКОЛКА' : 'ОСКОЛКОВ';
    const remaining = Math.max(0,currentMutationCost() - save.mutationProgress);
    return amount > 0 ? `ДОБАВИТЬ ${amount} ${unit}\n${amount < 10 ? remaining <= 10 ? 'ДО ЗАПОЛНЕНИЯ' : 'ДОСТУПНО СЕЙЧАС' : 'ЗАЖМИ — БЫСТРЕЕ'}`
      : 'НУЖНЫ ОСКОЛКИ\nДОБЫВАЙ ИХ В ШАХТЕ';
  }

  function setMutationMachineHint(text) {
    const hint = $('#mutationCapsuleHint');
    if (!hint) return;
    hint.replaceChildren();
    String(text).split('\n').forEach((line,index) => {
      if(index) hint.append(document.createTextNode('\n'));
      const element=document.createElement(index ? 'span' : 'strong');
      element.textContent=line;hint.append(element);
    });
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
      if (hint) setMutationMachineHint(mutationInvestmentHint());
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
    const investedAmount = nextMutationInvestmentAmount();
    if (investedAmount < 1) {
      button.classList.remove('needs-research');
      void button.offsetWidth;
      button.classList.add('needs-research');
      showToast('Нужен 1 осколок Аномалии');
      feedback(7);
      return false;
    }
    const token = mutationAnimationToken;
    if (!adminInfiniteResearch) save.researchUnits -= investedAmount;
    save.mutationProgress += investedAmount;
    // Each input adds the same ten flasks; holding accelerates the cadence.
    persist();
    updatePersistentUI();
    const balance = $('#mutationPanelBalance');
    if (balance) balance.textContent = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);
    sound('uiPress');
    button.classList.remove('is-invest-pressed');
    void button.offsetWidth;
    button.classList.add('is-invest-pressed');

    const flyingFlask = document.createElement('span');
    flyingFlask.className = 'mutation-invest-flask';
    flyingFlask.setAttribute('aria-hidden', 'true');
    flyingFlask.innerHTML = `<img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt=""><b>+${investedAmount}</b>`;
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
    button.setAttribute('aria-label', `Добавить осколки: ${nextMutationInvestmentAmount()}. Осталось ${Math.max(0, remaining)}`);
    const remainingLabel = $('#mutationRemaining');
    if (remainingLabel) remainingLabel.textContent = remaining > 0 ? String(remaining) : '✓';
    const progressBar = $('.mutation-synth-progress');
    progressBar?.setAttribute('aria-valuenow', String(Math.min(mutationCost, save.mutationProgress)));
    progressBar?.setAttribute('aria-valuetext',`${Math.min(mutationCost,save.mutationProgress)} из ${mutationCost} осколков`);
    progressBar?.classList.toggle('is-filled',remaining<=0);
    const progressValue=$('#mutationSynthProgressValue');
    if(progressValue) progressValue.textContent=`${Math.min(mutationCost,save.mutationProgress)} / ${mutationCost}`;
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
      const progressGain=$('#mutationSynthProgressGain');
      if(progressGain)progressGain.textContent=`+${investedAmount}`;
      progressBar?.classList.remove('is-receiving');
      if(progressBar)void progressBar.offsetWidth;
      progressBar?.classList.add('is-receiving');
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
      if (hint) setMutationMachineHint('РЕАКТОР ЗАПОЛНЕН\nНАЖМИ «СИНТЕЗ»');
      sound('happy');
      feedback([5, 9, 5]);
      if (save.tutorialStep === 'reactor') setTutorialStep('synthesize');
      else if (save.tutorialStep === 'frost-reactor') setTutorialStep('frost-synthesize');
      return true;
    }
    const hint = $('#mutationCapsuleHint');
    if (hint) setMutationMachineHint(mutationInvestmentHint());
    return true;
  }

  async function revealRandomMutation(token, button) {
    const locked = !save.legacyStarterAccess && !save.unlockedMutations?.includes('fire')
      ? [STARTER_MUTATIONS[0]]
      : !save.legacyStarterAccess && !save.unlockedMutations?.includes('frost')
      ? [STARTER_MUTATIONS.find(item => item.id === 'frost')]
      : availableSyntheses().filter(mutation => !(save.unlockedMutations || []).includes(mutation.id));
    const pendingStillLocked = pendingMutationReveal && locked.some(mutation => mutation.id === pendingMutationReveal.id);
    const mutation = pendingStillLocked ? pendingMutationReveal : locked[Math.floor(Math.random() * locked.length)];
    if (!mutation) {
      pendingMutationReveal = null;
      save.mutationProgress = 0;
      save.mutationInvestTapCount = 0;
      persist();
      renderRecipesPanel();
      return;
    }
    pendingMutationReveal = mutation;
    const synthColors = MUTATION_SYNTH_COLORS[mutation.id] || MUTATION_SYNTH_COLORS.nano;
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
    const synthTiming = window.SlimeSynthReactor.timings;
    button.disabled = true;
    button.classList.add('is-processing');
    if (hint) setMutationMachineHint('СИНТЕЗ МУТАЦИИ…');
    sound('epic');
    feedback([8, 14, 8]);
    await mutationDelay(menuReducedMotion ? 100 : synthTiming.mix);
    if (token !== mutationAnimationToken || !mystery || els.panelOverlay.classList.contains('hidden')) return;
    await mutationImageReady;
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    mystery.style.setProperty('--result-glow', synthColors.glow);
    mystery.innerHTML = `<img src="${mutationImageSrc}" alt="${mutation.name}">`;
    mystery.classList.add('is-vended');
    button.classList.remove('is-processing');
    button.classList.add('is-synthesis-ready', 'is-drain-armed');
    const liquid = $('#mutationLiquid');
    liquid?.style.setProperty('--liquid-fill', '0%');
    button.classList.add('is-draining');
    await mutationDelay(menuReducedMotion ? 100 : synthTiming.drain);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    button.classList.remove('is-synthesis-ready', 'is-drain-armed', 'is-draining');
    void mystery.offsetWidth;
    button.classList.add('is-dispensing');
    await mutationDelay(menuReducedMotion ? 20 : synthTiming.prizeDelay);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    sound('coin');
    feedback([5, 9, 5]);
    await mutationDelay(menuReducedMotion ? 80 : synthTiming.door - synthTiming.prizeDelay);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    button.classList.remove('is-dispensing');
    button.classList.add('is-core-ready');
    button.dataset.revealStage = 'core';
    button.disabled = false;
    if (hint) setMutationMachineHint('МУТАЦИЯ ГОТОВА\nНАЖМИ НА ЭМБЛЕМУ');
    feedback([5, 8]);
    if (save.tutorialStep === 'wait-synthesis') setTutorialStep('core');
    else if (save.tutorialStep === 'frost-wait') setTutorialStep('frost-core');
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
    if (hint) setMutationMachineHint(`НОВАЯ МУТАЦИЯ\n${mutation.name}`);
    sound('epic');
    feedback([10, 18, 10]);
    await mutationDelay(menuReducedMotion ? 80 : 480);
    if (token !== mutationAnimationToken || els.panelOverlay.classList.contains('hidden')) return;
    const prize = document.createElement('button');
    prize.id = 'mutationPrize';
    prize.className = `mutation-prize mutation-family-${mutation.id}`;
    prize.type = 'button';
    prize.style.setProperty('--prize-art', `url("${versionedAsset(MUTATION_REVEAL_BACKGROUNDS[mutation.id])}")`);
    const description = MUTATION_REVEAL_DESCRIPTIONS[mutation.id] || MUTATION_DETAILS[mutation.id]?.stage1 || '';
    prize.innerHTML = `${mutationRevealBackgroundMarkup(mutation)}<small class="mutation-prize-kicker">НОВАЯ МУТАЦИЯ</small><span class="mutation-prize-emblem"><span class="mutation-emblem-halo" aria-hidden="true"></span>${mutationRevealFxMarkup(mutation)}<img src="${versionedAsset(mutation.image)}" alt=""></span><span class="mutation-prize-caption"><strong class="mutation-prize-name">${mutation.name}</strong><span class="mutation-prize-ability">${description}</span></span><span class="mutation-prize-cta"><span>ЗАБРАТЬ МУТАЦИЮ</span></span>`;
    prize.setAttribute('aria-label', `Новая мутация: ${mutation.name}. Нажми, чтобы добавить в коллекцию`);
    const modal = els.panelOverlay.querySelector('.panel-modal');
    modal?.appendChild(prize);
    requestAnimationFrame(() => prize.classList.add('is-visible'));
    prize.addEventListener('click', () => collectSynthesizedMutation(token, mutation, prize), { once: true });
    if (save.tutorialStep === 'core') setTutorialStep('prize');
    else if (save.tutorialStep === 'frost-core') setTutorialStep('frost-prize');
  }

  async function collectSynthesizedMutation(token, mutation, prize) {
    if (!mutation || !prize || prize.classList.contains('is-collecting')) return;
    const target = $(`[data-mutation-slot="${mutation.id}"]`);
    const prizeImage = prize.querySelector('.mutation-prize-emblem > img');
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
    save.mutationLevels = { ...(save.mutationLevels || {}), [mutation.id]: 1 };
    save.mutationExperience[mutation.id] = 0;
    save.selectedMutation = mutation.id;
    save.mutationProgress = 0;
    save.mutationInvestTapCount = 0;
    pendingMutationReveal = null;
    persist();
    updatePersistentUI();
    mutationAnimating = false;
    renderRecipesPanel();
    const unlockedSlot = $(`[data-mutation-slot="${mutation.id}"]`);
    requestAnimationFrame(() => unlockedSlot?.classList.add('just-unlocked'));
    checkOnboardingProgress();
    if (save.tutorialStep === 'prize' && mutation.id === 'fire') setTutorialStep('fire-slot');
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
            <button class="buy-btn ${maxed ? 'owned' : ''}" data-upgrade="${key}">${maxed ? 'МАКС' : `⚗ ${formatCompactNumber(cost)}`}</button>
          </div>`;
        }).join('')}
      </div>`;
    $$('[data-upgrade]').forEach(button => button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade)));
  }

  function renderWardrobePanel() {
    save.wardrobe = window.SlimeWardrobe.normalize(save.wardrobe);
    wardrobePanel = window.SlimeWardrobePanel.mount({
      root:els.panelContent,title:els.panelTitle,getSave:()=>save,
      commit:()=>persist({refreshUI:false}),onChange:()=>updatePersistentUI(),sound,formatBalance:formatCompactNumber,
      drawAvatar:(target,options,timestamp)=>{
        if (menuCategoryLevels().infinity) {
          drawInfinityAvatar(target,{...options,accessory:options.accessory ?? save.wardrobe?.accessory,timestamp});
          return;
        }
        const selected=skinById(save.selectedSkin);
        drawElementalSlimeAvatar(target,{...options,accessory:options.accessory ?? save.wardrobe?.accessory,skin:selected.id,colors:selected.colors},menuCategoryLevels(),timestamp);
      }
    });
  }

  function shopTabsMarkup() {
    return `<div class="shop-tabs" role="tablist" aria-label="Разделы магазина">
      <span class="shop-tab-slider ${activeShopTab === 'trails' ? 'to-trails' : ''}" aria-hidden="true"></span>
      <button class="shop-tab ${activeShopTab === 'skins' ? 'active' : ''}" data-shop-tab="skins" role="tab" aria-selected="${activeShopTab === 'skins'}"><img src="${versionedAsset('assets/ui/slime.webp')}" alt="" aria-hidden="true"> ОБЛИКИ</button>
      <button class="shop-tab ${activeShopTab === 'trails' ? 'active' : ''}" data-shop-tab="trails" role="tab" aria-selected="${activeShopTab === 'trails'}"><img src="${versionedAsset('assets/ui/trail-tab.webp')}" alt="" aria-hidden="true"> СЛЕДЫ</button>
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
    sound('uiTab');
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
        const price = !unlocked && skin.cost ? `<span class="shop-price"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt="" aria-hidden="true"><b>${formatCompactNumber(skin.cost)}</b></span>` : '';
        const reward = skin.world ? `<span class="shop-reward ${unlocked ? 'collected' : ''}"><b>${unlocked ? 'ПОЛУЧЕН' : 'НАГРАДА'}</b><i>ШАХТА ${Math.max(1, skin.world - 1)}</i></span>` : '';
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
        const price = !unlocked && trail.cost ? `<span class="shop-price"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt="" aria-hidden="true"><b>${formatCompactNumber(trail.cost)}</b></span>` : '';
        const previewAsset = trail.id === 'none' ? 'assets/ui/trail-none.webp' : trail.asset;
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
      if (save.researchUnits < trail.cost) return showToast('Не хватает осколков Аномалии');
      save.researchUnits -= trail.cost;
      save.unlockedTrails.push(trail.id);
      sound('coin');
    } else sound('uiSelect');
    save.selectedTrail = trail.id;
    persist();
    updatePersistentUI();
    renderShopPanel('trails');
  }

  function selectOrBuySkin(id) {
    const skin = skinById(id);
    const unlocked = save.unlockedSkins.includes(id);
    if (!unlocked && skin.cost) {
      if (save.researchUnits < skin.cost) return showToast('Не хватает осколков Аномалии');
      save.researchUnits -= skin.cost;
      save.unlockedSkins.push(id);
    } else if (!unlocked) return showToast(skin.condition);
    save.selectedSkin = id;
    persist();
    sound('uiSelect');
    updatePersistentUI();
    drawMenuSlime(performance.now());
    renderShopPanel('skins');
  }

  let rewardsTab='daily',rewardWheelBusy=false,rewardWheelFrame=0,rewardWheelTimeout=0;

  function updateRewardsBadge(){
    const button=document.querySelector('.header-rewards-btn');if(!button||!save.rewards)return;
    let dot=button.querySelector('.rewards-notification');
    if(!dot){dot=document.createElement('i');dot.className='rewards-notification';dot.setAttribute('aria-hidden','true');button.append(dot)}
    const state=window.SlimeDailyRewards.status(save.rewards);
    const available=!tutorialActive()&&(state.dailyAvailable||state.freeAvailable);
    dot.hidden=!available;button.setAttribute('aria-label',available?'Подарки: доступна бесплатная награда':'Открыть подарки');
    const balance=$('#panelTitle .rewards-balance b');if(balance)balance.textContent=formatCompactNumber(save.researchUnits);
  }

  function refreshRewardsPanel(){
    const root=els.panelContent.querySelector('.rewards-hub');
    if(!root||els.panelOverlay.classList.contains('hidden')||!window.SlimeUIActivity.isActive(root))return;
    const state=window.SlimeDailyRewards.status(save.rewards),stamp=`${state.day}/${state.dailyAvailable}/${save.rewards.dailyClaimed}`;
    if(root.dataset.dailyState&&root.dataset.dailyState!==stamp){renderRewardsPanel();return}
    root.dataset.dailyState=stamp;
    window.SlimeRewardsPanel.update(root,{model:save.rewards,pending:save.pendingWheel,busy:rewardWheelBusy,tab:rewardsTab});
    updateRewardsBadge();
    if(save.pendingWheel&&rewardsTab==='wheel'&&!rewardWheelFrame)animateRewardWheel();
  }

  function renderRewardsPanel() {
    els.panelTitle.innerHTML=`<span>Подарки</span><span class="rewards-balance"><img src="${versionedAsset('assets/ui/anomaly-core-v56/currency.webp')}" alt="Осколки"><b>${formatCompactNumber(save.researchUnits)}</b></span>`;
    els.panelContent.innerHTML=window.SlimeRewardsPanel.markup({model:save.rewards,tab:rewardsTab,asset:versionedAsset});
    const root=els.panelContent.querySelector('.rewards-hub');
    const infinityPortrait = root.querySelector('#rewardInfinityAvatar');
    if (infinityPortrait) window.SlimeAvatarRenderer.preloadAppearance({bodyVariant:'infinity'}).then(() => {
      if (!infinityPortrait.isConnected) return;
      drawInfinityAvatar(infinityPortrait.getContext('2d'),{x:96,y:111,radius:72,emotion:'joy'});
    });
    const switchTab=tab=>{
      if (rewardsTab === tab) return;
      rewardsTab=tab;
      root.querySelectorAll('[data-rewards-tab]').forEach(b=>{const selected=b.dataset.rewardsTab===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1});
      $('#rewardDailyPane').hidden=tab!=='daily';$('#rewardWheelPane').hidden=tab!=='wheel';
      refreshRewardsPanel();sound('uiTab');
    };
    root.querySelectorAll('[data-rewards-tab]').forEach(b=>{
      b.addEventListener('click',()=>switchTab(b.dataset.rewardsTab));
      b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();switchTab(e.key==='Home'?'daily':e.key==='End'?'wheel':rewardsTab==='daily'?'wheel':'daily');root.querySelector(`[data-rewards-tab="${rewardsTab}"]`).focus()});
    });
    $('#dailyClaimBtn').addEventListener('click',()=>{
      const state=window.SlimeDailyRewards.status(save.rewards);
      if(!state.dailyAvailable&&state.freeAvailable){switchTab('wheel');return}
      claimDaily();
    });
    const infinityButton = $('#rewardInfinityBtn');
    infinityButton?.addEventListener('click', async () => {
      if (!save.rewards.infinityUnlocked) return;
      infinityButton.disabled = true;
      const next = save.rewards.infinityEquipped ? save.activeMutationPool[0] || 'fire' : 'infinity';
      await selectHomeMutation(next, { fromLaboratory: true });
      const equipped = save.rewards.infinityEquipped;
      infinityButton.setAttribute('aria-pressed', String(equipped));
      infinityButton.querySelector('span').textContent = equipped ? 'Бесконечность выбрана' : 'Выбрать Бесконечность';
      infinityButton.disabled = false;
    });
    $('#wheelSpinBtn').addEventListener('click',spinWheel);
    window.SlimeRewardsPanel.drawWheel($('#rewardWheelDisc'),versionedAsset);
    if(save.pendingWheel?.version===2)$('#rewardWheelDisc').style.transform=`rotate(${window.SlimeDailyRewards.spinAngle(save.pendingWheel,Date.now())}deg)`;
    root.dataset.dailyState='';
    refreshRewardsPanel();
    if(save.pendingWheel)animateRewardWheel();
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
      sound('uiWorld');
      renderEncyclopediaPanel(nextWorld);
    }));
  }

  function claimDaily() {
    const claim=window.SlimeDailyRewards.claim(save.rewards);if(!claim)return;
    save.rewards={...claim.model,lastPrize:{id:`daily-${Date.now()}`,amount:claim.amount,kind:'daily',at:Date.now()}};
    save.researchUnits+=claim.amount;save.dailyStreak=claim.day;save.lastDailyDate=todayKey();
    persist();
    renderRewardsPanel();
    sound('coin');feedback([6,20,6]);
    window.SlimeRewardsPanel.celebrate(els.panelContent.querySelector('.rewards-hub'),$('.daily-feature'),versionedAsset,menuReducedMotion);
    requestAnimationFrame(()=>{const next=$('#dailyClaimBtn');(next&&!next.disabled?next:$('#rewardDailyTab'))?.focus({preventScroll:true})});
  }

  const WHEEL_REWARDS=window.SlimeDailyRewards.WHEEL.map(amount=>({weight:1,text:`+${amount} осколков`,amount}));

  function chooseWheelReward() {
    return Math.min(WHEEL_REWARDS.length-1,Math.floor(Math.random()*WHEEL_REWARDS.length));
  }

  function finishPendingWheel(announce = true) {
    if (!save.pendingWheel) return;
    const pending=save.pendingWheel,rules=window.SlimeDailyRewards;
    save.pendingWheel = null;
    cancelAnimationFrame(rewardWheelFrame);clearTimeout(rewardWheelTimeout);rewardWheelBusy=false;
    const legacy=pending.version!==2;
    const amount=legacy?[1,2,4,1,0,2][pending.rewardIndex]:rules.WHEEL[pending.rewardIndex];
    if(!Number.isFinite(amount))return persist();
    if(legacy&&pending.rewardIndex===4)save.pendingHealthBoost+=20;
    save.researchUnits+=amount;
    save.rewards={...save.rewards,wheelAngle:legacy?0:rules.mod(pending.toAngle),lastPrize:amount?{id:pending.id||`legacy-${pending.startedAt}`,amount,kind:'wheel',at:Date.now()}:null};
    persist();
    refreshRewardsPanel();
    if(announce){
      sound('epic');feedback([7,25,9]);
      const root=els.panelContent.querySelector('.rewards-hub');
      if(root&&!els.panelOverlay.classList.contains('hidden')&&rewardsTab==='wheel')window.SlimeRewardsPanel.celebrate(root,$('#wheelPrize'),versionedAsset,menuReducedMotion);
      else showToast(amount?`Колесо подарков: +${amount} осколков`:'Бонус здоровья получен');
    }
  }

  function animateRewardWheel(){
    cancelAnimationFrame(rewardWheelFrame);
    const pending=save.pendingWheel;if(!pending)return;
    if(pending.version!==2){finishPendingWheel(false);return}
    const rules=window.SlimeDailyRewards;
    let lastSector=-1,lastTick=0;
    const frame=()=>{
      rewardWheelFrame=0;
      if(save.pendingWheel!==pending)return;
      const now=Date.now(),canvas=$('#rewardWheelDisc');
      if(now>=pending.endsAt){finishPendingWheel(true);return}
      if(!canvas||rewardsTab!=='wheel'||!window.SlimeUIActivity.isActive(canvas))return;
      if(canvas&&!els.panelOverlay.classList.contains('hidden')&&rewardsTab==='wheel'){
        const angle=rules.spinAngle(pending,now),sector=rules.indexAtAngle(angle);
        canvas.style.transform=`rotate(${angle}deg)`;
        if(sector!==lastSector&&now-lastTick>95&&!document.hidden){
          lastSector=sector;lastTick=now;
          const pointer=$('.gift-wheel-pointer');
          if(!menuReducedMotion)pointer?.animate([{transform:'translateX(-50%) rotate(-9deg)'},{transform:'translateX(-50%) rotate(0)'}],{duration:110,easing:'ease-out'});
          sound('uiPress');
        }
      }
      rewardWheelFrame=requestAnimationFrame(frame);
    };
    rewardWheelFrame=requestAnimationFrame(frame);
  }

  async function spinWheel() {
    if(save.pendingWheel||rewardWheelBusy||adInFlight)return;
    const rules=window.SlimeDailyRewards,state=rules.status(save.rewards),source=state.freeAvailable?'free':'ad';
    if(source==='ad'&&!state.adAvailable)return;
    rewardWheelBusy=true;refreshRewardsPanel();
    try{
      if(source==='ad'&&!await showRewardedAd('Ещё один запуск колеса подарков.'))return;
      const now=Date.now(),model=rules.reserve(save.rewards,source,now);if(!model)return;
      save.rewards=model;
      save.pendingWheel=rules.createSpin(chooseWheelReward(),{now,from:model.wheelAngle});
      if(source==='free')save.lastWheelDate=todayKey();
      else{save.wheelAdDate=model.adDay;save.wheelAdSpins=model.adSpins}
      persist();
      refreshRewardsPanel();
      if(menuReducedMotion){finishPendingWheel(true);return}
      animateRewardWheel();
      const id=save.pendingWheel.id;
      rewardWheelTimeout=setTimeout(()=>{if(save.pendingWheel?.id===id)finishPendingWheel(true)},rules.SPIN_MS+40);
    }catch(error){console.warn('Reward wheel:',error);showToast('Не удалось открыть видео. Попробуй позже')}
    finally{if(!save.pendingWheel)rewardWheelBusy=false;refreshRewardsPanel()}
  }

  function updateRewardsClock(){
    if(document.hidden)return;
    if(save.pendingWheel?.version===2&&Date.now()>=save.pendingWheel.endsAt)finishPendingWheel(true);
    updateRewardsBadge();refreshRewardsPanel();
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
      if (resumeGameplayAfterAd) {
        if (!document.hidden && !platformSuspended && !windowSuspended) resumeRun();
        else autoResumeRunAfterVisibility = true;
      }
      syncBackgroundMusic();
    });
    document.body.classList.add('ad-busy');
    stopAllSounds();
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
    if (yandexPlatform?.available) return finish(Promise.resolve(false));
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

  function openCorePreview() {
    if (corePreviewMode) return;
    corePreviewMode = true;
    clearTimeout(cloudSaveTimer);
    save = structuredClone(save);
    window.SlimeTutorialIntro?.cancel();
    closeOnboardingMemo(true);
    tutorialMemoState = null;
    save.tutorialStep = 'done';
    save.onboarding = {...save.onboarding, enabled:false};
    clearTutorialRunHint();
    closePanel();
    closeAdminTools();
    clearMenuMutationPresentation();
    document.body.classList.add('core-preview-mode');
    window.SlimeCorePreview.mount({
      mutations:[...allMutations(),INFINITY_MUTATION].map(m=>({id:m.id,name:m.name,custom:!!CORE.strikeKind({mutationId:m.id})})),
      worlds:PLANETS.planets.filter(p=>p.worldId).map(p=>({id:p.worldId,name:p.name})),
      initial:selectedSlimeMutationId() || 'fire',
      start:startCorePreview,
      pause:()=>{if(run?.paused)resumeRun();else pauseRun({allowPortal:true});},
      strike:()=>CORE.requestStrike(run),
      state:()=>({phase:run?.ended?'done':run?.evacuation?.finished&&PURIFICATION.active(run)?'purification':run?.evacuation?'evacuation':run?.coreEncounter?.phase||'fall',
        paused:!!run?.paused,ended:!!run?.ended,kind:run?.coreEncounter?.kind||'',
        mutation:run?.mutationId,stage:run?.ultimateStage,energy:run?.energy,
        reserve:run?.coreEncounter?.strikeEnergy,elapsed:run?.coreEncounter?.elapsed,
        damage:run?.coreStrikeEvent?.damage||0,coreHp:run?.coreEncounter?.afterHp,
        preview:!!run?.corePreview})
    });
  }

  function startCorePreview({mutation='fire',stage=3,energy=100,hp=100,world=1}={}) {
    if (!corePreviewMode) return;
    if (run) { cancelAnimationFrame(run.animationId);run.ended=true; }
    run = null;
    hideRunMenu();hideGlitchChoice();stopAllSounds();
    els.resultOverlay.classList.add('hidden');
    const id=mutation==='infinity'||allMutations().some(m=>m.id===mutation)?mutation:'fire';
    stage=clamp(Math.round(Number(stage)||1),1,3);
    const planet=PLANETS.forWorld(Number(world))||PLANETS.forWorld(1);
    save.world=planet.worldId;carouselWorldId=planet.worldId;
    const infinity=id==='infinity';
    if(infinity)save.rewards.infinityUnlocked=true;
    else {save.selectedMutation=id;save.activeMutationPool=[id];}
    save.rewards.infinityEquipped=infinity;
    save.unlockedMutations=allMutations().map(m=>m.id);
    save.mutationLevels[id]=stage;save.mutationUltimateStages[id]=stage;
    save.planetCampaign=PLANETS.normalize({selected:planet.id,unlocked:PLANETS.ids,cores:{[planet.id]:clamp(Number(hp)||1,1,100)}});
    session={foods:[foodForMutation(id,stage)],offer:[],healthBoost:0,stats:{},effects:{}};
    recalcStats();
    startDrop({fromPortal:true});
    if (!run) return;
    cancelAnimationFrame(run.animationId);
    run.corePreview=true;
    run.launchEntryStartedAt=0;run.launchEntryUntil=0;
    document.body.classList.remove('portal-arrival');
    run.energy=clamp(Number(energy)||0,0,100);
    run.corePreviewReserve=run.energy;
    run.slime.y=run.coreArena.triggerY-100;
    run.slime.x=200;run.slime.vy=300;run.slime.vx=0;
    run.cameraY=run.slime.y-158;
    run.lastPosition={x:run.slime.x,y:run.slime.y};
    run.lastTime=0;run.nextFrameAt=0;
    updateRunUI();
    if (!run.paused) run.animationId=requestAnimationFrame(gameFrame);
  }

  function openAdminTools() {
    if (corePreviewMode) return;
    if (!els.adminToolsOverlay || !els.adminToolsOverlay.classList.contains('hidden')) return;
    syncAdminInfiniteFlasksUI();
    syncAdminInfiniteUltimateUI();
    syncAdminPlanetUI();
    lastFocusedElement = document.activeElement;
    els.adminToolsOverlay.classList.remove('hidden');
    els.adminMenuBtn?.setAttribute('aria-expanded', 'true');
    syncInteractionLayers();
    requestAnimationFrame(() => els.adminToolsOverlay.querySelector('.admin-settings')?.focus({ preventScroll: true }));
    sound('uiOpen');
    feedback(5);
    queueTutorialRender();
  }

  function closeAdminTools() {
    if (!els.adminToolsOverlay || els.adminToolsOverlay.classList.contains('hidden')) return;
    els.adminToolsOverlay.classList.add('hidden');
    sound('uiClose');
    els.adminMenuBtn?.setAttribute('aria-expanded', 'false');
    syncInteractionLayers();
    if (document.body.dataset.screen === 'home') renderHomeConsole();
    if (lastFocusedElement?.focus) lastFocusedElement.focus({ preventScroll: true });
    queueTutorialRender();
  }

  function closePanel() {
    stopSynthMotor();
    if (!els.panelOverlay.classList.contains('hidden')) sound('uiClose');
    wardrobePanel?.destroy();
    wardrobePanel = null;
    cancelAnimationFrame(rewardWheelFrame);
    window.SlimeSynthReactor?.stop();
    dismissMutationEvolution({ restoreFocus: false });
    $('#labMutationPicker[open]')?.close();
    $('#labSynthesisPicker[open]')?.close();
    $('#labMutationsPane .lab-tray.is-evolving')?.classList.remove('is-evolving');
    stopMutationFeedHold();
    laboratorySynthesisResult = null;
    mutationAnimationToken += 1;
    mutationAnimating = false;
    laboratoryReplaceMode = false;
    els.panelOverlay.classList.add('hidden');
    syncInteractionLayers();
    // A meal rendered while the lab was open inherited the modal busy state.
    // Refresh the whole console as soon as that modal closes.
    if (document.body.dataset.screen === 'home') renderHomeConsole();
    if (lastFocusedElement?.focus) lastFocusedElement.focus({ preventScroll: true });
    if (save.tutorialStep === 'close-lab') setTutorialStep('feed');
    else if (save.tutorialStep === 'upgrade-close-lab') { setTutorialStep('second-feed'); showTutorialStage(); }
    else queueTutorialRender();
    queueOnboardingMemo();
  }

  const fallKeyGroups = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD']
  };

  function fallDirectionForKey(code) {
    if (fallKeyGroups.left.includes(code)) return 'left';
    if (fallKeyGroups.right.includes(code)) return 'right';
    return '';
  }

  function fallDirectionHeld(direction) {
    const steer = run?.steer;
    const button = direction === 'left' ? els.fallLeftBtn : els.fallRightBtn;
    return Boolean(steer && (steer.pointers.has(button) || fallKeyGroups[direction].some(code => steer.keys.has(code))));
  }

  function fallControlsAvailable() {
    return Boolean(run?.steer && !run.paused && !run.ended && !run.corePreview && !run.coreEncounter
      && !run.evacuation && !run.portalEntry && !run.portalTransitioning && !run.glitchChoice);
  }

  function syncFallControls() {
    const available = fallControlsAvailable();
    els.fallControls.hidden = !available;
    els.fallLeftBtn.toggleAttribute('data-pressed', available && fallDirectionHeld('left'));
    els.fallRightBtn.toggleAttribute('data-pressed', available && fallDirectionHeld('right'));
    const fire = run?.elementalAbilityType === 'fire';
    const frost = run?.elementalAbilityType === 'frost';
    const electric = run?.elementalAbilityType === 'electric';
    const infinity = run?.elementalAbilityType === 'infinity' ? run.infinity : null;
    const psionic = run?.elementalAbilityType === 'telekinesis';
    const nano = run?.elementalAbilityType === 'nano';
    const hasAttack = psionic || fire || frost || electric || nano || !!infinity;
    els.fallControls.toggleAttribute('data-psionic', psionic);
    els.fallControls.toggleAttribute('data-fire', fire);
    els.fallControls.toggleAttribute('data-frost', frost);
    els.fallControls.toggleAttribute('data-electric', electric);
    els.fallControls.toggleAttribute('data-nano', nano);
    if (infinity) els.fallControls.dataset.infinity = infinity.mode;
    else delete els.fallControls.dataset.infinity;
    els.infinitySwapBtn.hidden = !infinity || infinity.stage < 2;
    if (infinity) {
      els.infinitySwapBtn.disabled = !!infinity.cast;
      els.infinitySwapBtn.setAttribute('aria-label', infinity.mode === 'blue' ? 'Выбрать красную сферу' : 'Выбрать синюю сферу');
    }
    const now = run?.pausedAt || performance.now();
    const remaining = Math.max(0, Math.ceil((activeAttackReadyAt(run) - now) / 1000));
    els.fallAttackBtn.toggleAttribute('data-recharging', remaining > 0);
    els.fireballCooldown.hidden = !remaining;
    if (remaining && els.fireballCooldown.textContent !== String(remaining)) els.fireballCooldown.textContent = remaining;
    const attackLabel = nano ? 'Залп дрона' : psionic ? 'Усиленный бросок' : fire ? 'Огненная вспышка' : frost ? 'Снежинка' : electric ? 'Электрорывок'
      : infinity ? infinity.mode === 'blue' ? 'Синяя сфера' : 'Красная сфера' : 'Атака';
    const label = remaining ? `${attackLabel} · перезарядка ${remaining} с` : attackLabel;
    if (els.fallAttackBtn.getAttribute('aria-label') !== label) els.fallAttackBtn.setAttribute('aria-label', label);
    const disabled = hasAttack && !canCastActiveAttack(now);
    if (els.fallAttackBtn.disabled !== disabled) els.fallAttackBtn.disabled = disabled;
    if (hasAttack !== els.fallAttackBtn.hasAttribute('aria-keyshortcuts')) {
      if (hasAttack) els.fallAttackBtn.setAttribute('aria-keyshortcuts', 'F');
      else els.fallAttackBtn.removeAttribute('aria-keyshortcuts');
    }
  }

  function bindFallButton(button, direction = '') {
    button.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !fallControlsAvailable() || run.steer.pointers.has(button)) return;
      if (button === els.fallAttackBtn && event.pointerType !== 'mouse' && run.elementalAbilityType === 'electric') {
        // A second finger can trigger the dash while the first holds a direction.
        event.preventDefault();
        activateActiveAttack();
        return;
      }
      button.setPointerCapture(event.pointerId);
      run.steer.pointers.set(button, event.pointerId);
      button.setAttribute('data-pressed', '');
      if (direction) {
        event.preventDefault();
        run.steer.lastDirection = direction;
        dismissTutorialControlsFromMovement();
        if (run.geyserCapture) launchFromGeyser(direction === 'left' ? -1 : 1);
      }
      syncFallControls();
    });
    const release = event => {
      const pointers = run?.steer?.pointers;
      if (pointers?.get(button) !== event.pointerId) return;
      pointers.delete(button);
      button.removeAttribute('data-pressed');
      syncFallControls();
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, release);
  }

  function setKeyboardSteering(code, pressed) {
    const direction = fallDirectionForKey(code);
    if (!direction || !run?.steer || (pressed && !fallControlsAvailable())) return false;
    const keys = run.steer.keys;
    if (pressed) {
      if (!keys.has(code)) run.steer.lastDirection = direction;
      keys.add(code);
      dismissTutorialControlsFromMovement();
      if (run.geyserCapture) launchFromGeyser(direction === 'left' ? -1 : 1);
    } else keys.delete(code);
    syncFallControls();
    return true;
  }

  function clearFallSteering() {
    if (run?.steer) {
      run.steer.keys.clear();
      run.steer.lastDirection = '';
      for (const [button, pointer] of run.steer.pointers) {
        button.removeAttribute('data-pressed');
        if (button.hasPointerCapture(pointer)) button.releasePointerCapture(pointer);
      }
      run.steer.pointers.clear();
    }
    syncFallControls();
  }

  function bindEvents() {
    const unlockMusic = () => syncBackgroundMusic({gesture:true});
    document.addEventListener('pointerdown', unlockMusic, {capture:true,passive:true});
    document.addEventListener('pointerup', unlockMusic, {capture:true,passive:true});
    document.addEventListener('keydown', unlockMusic, {capture:true,passive:true});
    const prepareGameAudio = () => {
      if (!preloadGameAudio()) return;
      document.removeEventListener('pointerup', prepareGameAudio, true);
      document.removeEventListener('keydown', prepareGameAudio, true);
    };
    document.addEventListener('pointerup', prepareGameAudio, true);
    document.addEventListener('keydown', prepareGameAudio, true);
    const clearKeyboardFocus = () => { delete document.documentElement.dataset.keyboardNavigation; };
    document.addEventListener('keydown', event => {
      if (event.key === 'Tab') document.documentElement.dataset.keyboardNavigation = 'true';
      else if (event.key === 'Meta' || event.key === 'OS' || event.key === 'Alt') clearKeyboardFocus();
    }, true);
    document.addEventListener('pointerdown', clearKeyboardFocus, true);
    window.addEventListener('blur', clearKeyboardFocus);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearKeyboardFocus(); });
    document.addEventListener('pointerdown', blockTutorialInput, true);
    document.addEventListener('click', blockTutorialInput, true);
    document.addEventListener('keydown', blockTutorialKey, true);
    document.addEventListener('slime:ui-visibility',refreshRewardsPanel);
    els.tutorialAdminBtn?.addEventListener('click', openAdminTools);
    els.tutorialPauseBtn?.addEventListener('click', openRunMenu);
    els.tutorialSkipBtn?.addEventListener('click', skipTutorial);
    els.tutorialRunSkipBtn?.addEventListener('click', skipTutorial);
    els.tutorialGiftClaimBtn?.addEventListener('click', claimTutorialGift);
    els.tutorialControlsCloseBtn?.addEventListener('click', finishTutorial);
    $('#tutorialMemoNext')?.addEventListener('click', closeOnboardingMemo);
    $('#tutorialQuest')?.addEventListener('click', openOnboardingQuest);
    $('#tutorialRunGoal').addEventListener('pointerdown',event=>event.stopPropagation());
    $('#tutorialRunGoal').addEventListener('click',event=>{event.stopPropagation();if(run?.tutorialGoalAvailable){run.tutorialGoalExpandedUntil=(run.tutorialLessonTime||0)+3800;positionTutorialRunGoal();}});
    $('#tutorialRunGoal').addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.currentTarget.click();}});
    els.tutorialUpgradeSummaryCloseBtn?.addEventListener('click', finishUpgradeTutorial);
    window.addEventListener('resize', queueTutorialRender, { passive: true });
    document.addEventListener('scroll', queueTutorialRender, { capture: true, passive: true });
    document.addEventListener('animationend', event => {
      if (tutorialOutlineSource && event.target.contains(tutorialOutlineSource)) queueTutorialRender();
    }, true);
    bindMenuSlimeInteractions();
    els.rerollBtn.addEventListener('click', activateConveyorControl);
    els.worldPrevBtn?.addEventListener('click', () => {
      const index = ACTIVE_WORLD_IDS.indexOf(carouselPendingWorldId || carouselWorld().id);
      if (index > 0) animateCarouselSelection(ACTIVE_WORLD_IDS[index - 1]);
    });
    els.worldNextBtn?.addEventListener('click', () => {
      const index = ACTIVE_WORLD_IDS.indexOf(carouselPendingWorldId || carouselWorld().id);
      if (index < ACTIVE_WORLD_IDS.length - 1) animateCarouselSelection(ACTIVE_WORLD_IDS[index + 1]);
    });
    els.worldCarouselDots?.addEventListener('click', event => {
      const dot = event.target.closest('.world-carousel-dot[data-world]');
      if (dot) animateCarouselSelection(dot.dataset.world);
    });
    els.abyssModeV2?.addEventListener('click', () => selectHomeMode(save.homeMode === 'endless' ? 'campaign' : 'endless'));
    els.worldStartBtn?.addEventListener('click', () => { void beginRoomLaunch({ endless: save.homeMode === 'endless' }); });
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
    $('#adminCorePreviewBtn')?.addEventListener('click', openCorePreview);
    els.closeAdminToolsBtn?.addEventListener('click', closeAdminTools);
    els.adminToolsOverlay?.addEventListener('click', event => { if (event.target === els.adminToolsOverlay) closeAdminTools(); });
    els.adminUnlockInfectedBtn.addEventListener('click', unlockInfectedWorldsFromAdmin);
    els.adminLowerInfectionBtn.addEventListener('click', lowerInfectionFromAdmin);
    els.adminUnlockAllBtn?.addEventListener('click', unlockEverythingFromAdmin);
    $$('[data-admin-mutation-stage]').forEach(button => button.addEventListener('click', () => unlockMutationsFromAdmin(Number(button.dataset.adminMutationStage))));
    els.adminInfiniteFlasksBtn?.addEventListener('click', toggleAdminInfiniteFlasks);
    els.adminInfiniteUltimateBtn?.addEventListener('click', toggleAdminInfiniteUltimate);
    els.adminResetProgressBtn?.addEventListener('click', resetProgressFromAdmin);
    els.abilityBtn.addEventListener('click', activateAbility);
    bindFallButton(els.fallLeftBtn, 'left');
    bindFallButton(els.fallRightBtn, 'right');
    bindFallButton(els.fallAttackBtn);
    bindFallButton($('#fallControls .fall-button-defense'));
    bindFallButton(els.infinitySwapBtn);
    els.infinitySwapBtn.addEventListener('click', swapInfinityAttack);
    els.fallAttackBtn.addEventListener('click', () => activateActiveAttack());
    els.glitchUltimateOverlay?.addEventListener('click', event => {
      const option = event.target.closest?.('[data-glitch-bug]');
      if (option) selectGlitchBug(option.dataset.glitchBug);
    });
    document.addEventListener('keydown', event => {
      if (!run?.glitchChoice || run.glitchChoice.phase !== 'choosing') return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (event.key === 'Tab') {
        const options = [...els.glitchUltimateOverlay.querySelectorAll('.glitch-choice-option')];
        const focused = options.indexOf(document.activeElement);
        if ((event.shiftKey && focused === 0) || (!event.shiftKey && focused === options.length - 1)) {
          event.preventDefault();
          options[event.shiftKey ? options.length - 1 : 0].focus();
        }
        return;
      }
      const bug = GLITCH_BUGS[Number(event.key) - 1];
      if (!bug) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      selectGlitchBug(bug.id);
    }, true);
    els.shaft.addEventListener('pointerdown', event => {
      if (!run || run.ended || run.paused || run.glitchChoice || event.target.closest?.('button')) return;
      event.preventDefault();
      if(run.coreEncounter){CORE.requestStrike(run);return;}
      if(run.evacuation)return;
      if (run.psionicShot && !run.psionicShot.from && !run.psionicShot.aim
        && performance.now()-run.psionicShot.startedAt < 3000) {
        const rect = els.canvas.getBoundingClientRect();
        run.psionicShot.aim = {x:clamp((event.clientX-rect.left)*VIEW_W/rect.width,0,VIEW_W-.01),
          y:run.cameraY+(event.clientY-rect.top)*VIEW_H/rect.height};
        return;
      }
      if (run.geyserCapture) {
        launchGeyserTowardClientPoint(event.clientX, event.clientY, performance.now());
        return;
      }
    });
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
      if(!document.hidden)updateRewardsClock();
      if (document.hidden) {
        clearMenuSlimeInteraction();
        stopAllSounds();
        persist();
        flushCloudSave(true);
        autoResumeRunAfterVisibility = pauseRun({ allowPortal: true }) || autoResumeRunAfterVisibility;
      } else if (autoResumeRunAfterVisibility && !platformSuspended && !windowSuspended) {
        autoResumeRunAfterVisibility = false;
        resumeRun();
      }
      if (!document.hidden) syncBackgroundMusic();
    });
    window.addEventListener('pagehide', () => {
      persist();
      flushCloudSave(true);
    });
    window.addEventListener('resize', scheduleViewportMetrics, { passive: true });
    window.addEventListener('orientationchange', scheduleViewportMetrics, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleViewportMetrics, { passive: true });
    document.addEventListener('keydown', event => {
      const steerCode = event.code || event.key;
      if(run?.coreEncounter?.cinematic&&!run.paused&&['Space','Enter'].includes(steerCode)){event.preventDefault();if(!event.repeat)CORE.requestStrike(run);return;}
      if (setKeyboardSteering(steerCode, true)) {
        event.preventDefault();
        return;
      }
      if (steerCode === 'KeyF' && !event.repeat && activateActiveAttack()) {
        event.preventDefault();
        return;
      }
      if (steerCode === 'KeyQ' && !event.repeat && swapInfinityAttack()) {
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
    window.addEventListener('blur', () => {
      windowSuspended = true;
      stopAllSounds();
      autoResumeRunAfterVisibility = pauseRun({ allowPortal: true }) || autoResumeRunAfterVisibility;
    });
    window.addEventListener('focus', () => {
      windowSuspended = false;
      if (!document.hidden && !platformSuspended && autoResumeRunAfterVisibility) {
        autoResumeRunAfterVisibility = false;
        resumeRun();
      }
      syncBackgroundMusic();
    });
  }

  async function init() {
    await initializeReliableSaves();
    syncPerformanceMode();
    yandexPlatform?.subscribe({
      onPause: () => {
        clearMenuSlimeInteraction();
        platformSuspended = true;
        stopAllSounds();
        autoResumeRunAfterVisibility = pauseRun({ allowPortal: true }) || autoResumeRunAfterVisibility;
      },
      onResume: () => {
        platformSuspended = false;
        if (!document.hidden && !windowSuspended && autoResumeRunAfterVisibility) {
          autoResumeRunAfterVisibility = false;
          resumeRun();
        }
        syncBackgroundMusic();
      }
    });
    initializeInteractionLayers();
    bindEvents();
    if ('ResizeObserver' in window) {
      const homeFitObserver = new ResizeObserver(scheduleHomeFit);
      homeFitObserver.observe(els.homeScreen);
      const homeTopbar = document.querySelector('.topbar.world-summary');
      if (homeTopbar) homeFitObserver.observe(homeTopbar);
      const menuSlimeSizeObserver = new ResizeObserver(() => {
        if (els.homeScreen.classList.contains('active') && prepareMenuSlimeCanvas()) drawMenuSlime(performance.now());
      });
      menuSlimeSizeObserver.observe(els.menuSlimeCanvas);
    }
    updatePersistentUI();
    updateFormIndexBadge();
    if (save.pendingWheel) finishPendingWheel(false);
    setInterval(updateRewardsClock,1000);
    if (restoreSession(save.activeDraft)) {
      syncMenuCategoryVisuals({ instant: true });
      discoverCurrentForm({ animate: false, notify: false });
      showScreen('home');
      renderDraft();
      persist();
    } else newDraft();
    const startupSprites = Object.values(window.SlimeGameAssets.ensureWorldSprites(session?.worldId || save.world || 1) || {});
    startupSprites.push(...ensureWorldBackgroundLayers(session?.worldId || save.world || 1).map(layer => layer.image));
    preloadInterfaceAudio();
    await window.SlimeBootLoader?.finish(yandexPlatform, startupSprites);
    drawMenuSlime(performance.now());
    restoreTutorial();
    checkOnboardingProgress();
    window.SlimeGameDebug = {
      reset: () => {
        const storage = saveStorage || browserStorage();
        storage?.removeItem(SAVE_KEY);
        storage?.removeItem(SAVE_BACKUP_KEY);
        location.reload();
      },
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
        save.pendingWheel=window.SlimeDailyRewards.createSpin(clamp(Math.round(rewardIndex),0,WHEEL_REWARDS.length-1),{from:save.rewards.wheelAngle});
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
        for (const key of ['fire', 'frost', 'electric', 'cosmos', 'nano', 'telekinesis', 'cloning', 'phantom', 'glitch']) {
          if (Object.hasOwn(levels, key)) { run.categoryVisuals[key] = clamp(Math.round(levels[key]), 0, 3); run.passiveLevels[key] = run.categoryVisuals[key]; }
        }
        run.elementalAbilityType = FORM_INDEX.map(form => form.id)
          .filter(key => run.categoryVisuals[key] > 0)
          .sort((a, b) => run.categoryVisuals[b] - run.categoryVisuals[a])[0] || '';
        run.ultimateStage = run.elementalAbilityType ? run.categoryVisuals[run.elementalAbilityType] : 1;
        run.ultimateProfile = ULTIMATE_STAGES.get(run.elementalAbilityType, run.ultimateStage);
        run.ultimateReadyAt = 0;
        run.fireFlash = null;
        run.fireFlashReadyAt = 0;
        run.frostFlake = null;
        run.frostFlakeReadyAt = 0;
        run.frostStorm = null;
        run.electricDash = null;
        run.electricDashReadyAt = 0;
        run.electricStorm = null;
        run.electricStormBolts = [];
        run.electricStormHits = [];
        run.phoenixUltimate = null;
        run.phoenixChargedFromDepth = 0;
        run.electricImpactAt = -Infinity;
        run.elementalAbilityActive = '';
        run.stagedUltimate = null;
          run.giantMushroom = null;
        run.sporePop = null;
        run.cosmosStagedUltimate = null;
        run.psionicBarrier = null;run.psionicBarrierBursts=[];
        run.elementalAbilityUntil = 0;
        run.goldRushUntil = 0;
        run.speedPressure = 0;
        run.speedBurstChargeMs = 0;
        run.speedBurstReady = false;
        run.speedBurstBlocksLeft = 0;
        run.speedBurstUntil = 0;
        resetMassPierce();
        updateRunUI();
        return { ...run.categoryVisuals, ability: run.elementalAbilityType };
      },
      elementalState: () => run ? {
        levels: {
          fire: elementalLevel('fire'), frost: elementalLevel('frost'), electric: elementalLevel('electric'),
          mobility: elementalLevel('mobility'), cosmos: elementalLevel('cosmos'), nano: elementalLevel('nano'),
          telekinesis: elementalLevel('telekinesis'), cloning: elementalLevel('cloning'), phantom: elementalLevel('phantom'), glitch: elementalLevel('glitch')
        },
        ability: run.elementalAbilityType, stage: run.ultimateStage, profile: run.ultimateProfile,
        stagedUltimate: run.stagedUltimate ? { kind: run.stagedUltimate.kind, rocks: run.stagedUltimate.rocks.length, y: run.stagedUltimate.y, endY: run.stagedUltimate.endY } : null,
        technoUltimate: run.mechSuit ? { kind: 'mechDrill', phase: run.mechSuit.phase } : null,
        cosmosStagedUltimate: run.cosmosStagedUltimate ? {kind:run.cosmosStagedUltimate.kind,launched:run.cosmosStagedUltimate.launched,impacts:run.cosmosStagedUltimate.impacts} : null,
        psionicBarrier: run.psionicBarrier ? {until:run.psionicBarrier.until,radius:psionicBarrierRadius()} : null,
        giantMushroom: run.giantMushroom ? {impacts:run.giantMushroom.impacts,phase:SPORE_COLOSSUS.pose(run,performance.now())?.phase,clouds:run.giantMushroom.clouds.length,motePool:run.giantMushroom.motes.length} : null,
        cooldownMs: ULTIMATE_COOLDOWN.remaining(run, performance.now()),
          active: run.elementalAbilityActive,
          massPierceRowsLeft: run.massPierceRowsLeft,
          speedPressure: run.speedPressure,
          speedBurstChargeMs: run.speedBurstChargeMs,
          speedBurstReady: run.speedBurstReady,
          speedBurstBlocksLeft: run.speedBurstBlocksLeft,
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
    window.SlimeBootLoader?.fail(error);
  });
})();
