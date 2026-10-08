(() => {
  'use strict';

  const CONFIG = window.SlimeGameConfig;
  const ASSETS = window.SlimeGameAssets;
  const EXPERIENCE = window.SlimeExperience;
  if (!CONFIG || !ASSETS || !EXPERIENCE || !window.SlimeAudio || !window.SlimeAvatarRenderer) {
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
  const defaultSave = structuredClone(CONFIG.DEFAULT_SAVE);
  const {
    FOODS,
    WORLD_SPRITES,
    VFX_SPRITES,
    versionedAsset,
    ensureWorldSprites,
    ensureWorldBackground,
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
  const PHANTOM_COOLDOWN_MS = 10000;
  const PHANTOM_WARNING_MS = 1300;
  const PHANTOM_ENTER_MS = 380;
  const PHANTOM_DURATION_MS = 4000;
  const PHANTOM_BURST_MS = 650;
  const GLITCH_INFECTION_INTERVAL_MS = 11500;
  const GLITCH_NEUTRALIZE_INTERVAL_MS = 17500;
  const GLITCH_TITLE_MS = 1500;
  const GLITCH_CLONE_MS = 6000;
  const UNLIMITED_FREE_REROLLS = true;
  const SPEED_PRESSURE_RAMP_MS = 1000;
  const SPEED_BURST_CHARGE_MS = 5000;
  const SPEED_BURST_WINDOW_MS = 1400;
  const COSMOS_ASCENT_ARM_DISTANCE = 1.15;
  const COSMOS_ENTRY_FALL_DISTANCE = .9;
  const ELEMENTAL_ABILITY_DURATION_MS = Object.freeze({
    frost: 6000,
    electric: 4600,
    fire: 2000,
    cosmos: 5500,
    nano: 10000,
    telekinesis: 2500,
    phantom: 3000,
    gold: 3000,
    cloning: 5800,
    glitch: 1800,
    mass: 4000,
    mobility: 5000
  });
  const ULTIMATE_INTRO_MS = 820;
  const PHOENIX_FIRE_ROWS = 14; // Seven mine rows are 50 m.
  const COSMOS_ULTIMATE_CHARGE_MS = 920;
  const COSMOS_ULTIMATE_RAMP_MS = 270;
  const COSMOS_ULTIMATE_FADE_START_MS = 4000;
  const ELECTRIC_STORM_STRIKES = 5;
  const ELECTRIC_STORM_BRANCH_LENGTH = 4;
  const ELECTRIC_STORM_EXIT_MS = 720;
  const phoenixUltimateSprite = new Image();
  phoenixUltimateSprite.src = versionedAsset('assets/vfx/fire-phoenix-ultimate-v1-lossless.webp');
  const electricStormCloudSprite = new Image();
  electricStormCloudSprite.src = versionedAsset('assets/vfx/electric-storm-cloud-v2-lossless.webp');
  const technoMechSprite = new Image();
  technoMechSprite.src = versionedAsset('assets/vfx/techno-mech-suit-v2.webp');
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
    tutorialControls: $('#tutorialControls'), tutorialControlsText: $('#tutorialControlsText'), tutorialControlsCloseBtn: $('#tutorialControlsCloseBtn'),
    tutorialUpgradeSummary: $('#tutorialUpgradeSummary'), tutorialUpgradeSummaryCloseBtn: $('#tutorialUpgradeSummaryCloseBtn'),
    tutorialAdminBtn: $('#tutorialAdminBtn'), tutorialPauseBtn: $('#tutorialPauseBtn'), tutorialSkipBtn: $('#tutorialSkipBtn'), tutorialRunSkipBtn: $('#tutorialRunSkipBtn'),
    menuSlimeCanvas: $('#menuSlimeCanvas'), menuSlimeMouth: $('#menuSlimeMouth'),
    foodInside: $('#foodInside'), levelButtons: $('#levelButtons'), levelDepthLabel: $('#levelDepthLabel'),
    healthCompare: $('#healthCompare'), damageCompare: $('#damageCompare'), shieldCompare: $('#shieldCompare'),
    startDropLabel: $('#startDropLabel'), adminMenuBtn: $('#adminMenuBtn'), adminToolsOverlay: $('#adminToolsOverlay'),
    closeAdminToolsBtn: $('#closeAdminToolsBtn'), adminRestartBtn: $('#adminRestartBtn'),
    adminPrevWorldBtn: $('#adminPrevWorldBtn'), adminNextWorldBtn: $('#adminNextWorldBtn'),
    adminWorldValue: $('#adminWorldValue'), adminUnlockAllBtn: $('#adminUnlockAllBtn'), adminUnlockMutationsBtn: $('#adminUnlockMutationsBtn'),
    adminUnlockMutationsIcon: $('#adminUnlockMutationsIcon'), adminResetProgressBtn: $('#adminResetProgressBtn'),
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
    depthLabel: $('#depthLabel'), runHeartHud: $('.shaft-health'), runHearts: $$('.run-heart'), runHeartCount: $('#runHeartCount'),
    runResearchHud: $('#runResearchHud'), runResearchScore: $('#runResearchScore'), runResearchGain: $('#runResearchGain'),
    runExperienceHud: $('#runExperienceHud'), runExperienceScore: $('#runExperienceScore'), runExperienceGain: $('#runExperienceGain'),
    routeProgress: $('#routeProgress'), routeBestMarker: $('#routeBestMarker'), routeBestLabel: $('#routeBestLabel'),
    routeSlimeMarker: $('#routeSlimeMarker'), routeTargetLabel: $('#routeTargetLabel'), routePortalIcon: $('#routePortalIcon'),
    shaft: $('#shaft'), canvas: $('#physicsCanvas'), impactText: $('#impactText'),
    glitchUltimateOverlay: $('#glitchUltimateOverlay'), glitchChoiceAnnouncement: $('#glitchChoiceAnnouncement'),
    touchJoystick: $('#touchJoystick'),
    abilityBtn: $('#abilityBtn'), abilityPercent: $('#abilityPercent'), abilityText: $('#abilityText'), endRunBtn: $('#endRunBtn'),
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
  let homeRewardFlight = null;
  let autoResumeRunAfterVisibility = false;
  let activeLaboratoryTab = 'mutations';
  let laboratoryView = 'synthesis';
  let laboratoryTabAnimation = null;
  let selectedConveyorSlot = 0;
  let quickMutationPickerTimer = null;
  let selectedLaboratoryMutationId = 'fire';
  let laboratoryReplaceMode = false;
  const RESULT_MULTIPLIERS = [.5, 1, 1.5, 2, 1.5, 1, .5];
  const RESULT_SWEEP_MS = 900;
  const MUTATION_STEPS = 100;
  const MUTATION_UPGRADE_COSTS = Object.freeze({ 1: 50, 2: 100 });
  const TUTORIAL_STEPS = new Set([
    'home-mutations', 'gift-delay', 'gift', 'gift-credit', 'reactor', 'synthesize',
    'wait-synthesis', 'core', 'prize', 'fire-slot', 'choose', 'close-lab',
    'feed', 'feed-count', 'play', 'run-wait', 'controls', 'post-run',
    'second-gift', 'second-gift-credit', 'upgrade-home-mutations', 'upgrade-fire',
    'upgrade-close-lab', 'upgrade-summary', 'done'
  ]);
  const ULTIMATE_BLOCKS_REQUIRED = 65;
  const ULTIMATE_POST_USE_CHARGE = Math.round(ULTIMATE_BLOCKS_REQUIRED * .15);
  const ULTIMATE_BREAK_CAUSES = new Set([
    'cosmos', 'cosmosUltimate', 'electricStorm', 'fireUltimate', 'sporeUltimate',
    'telekinesisPress', 'mech', 'glitchClone', 'glitchDelete'
  ]);
  const STARTER_MUTATIONS = Object.freeze([
    { id: 'fire', name: 'ОГОНЬ', image: 'assets/ui/recipe-categories/emblem-v2-fire.webp' },
    { id: 'electric', name: 'ЭЛЕКТРИЧЕСТВО', image: 'assets/ui/recipe-categories/emblem-v2-electric.webp' },
    { id: 'frost', name: 'МОРОЗ', image: 'assets/ui/recipe-categories/emblem-v2-frost.webp' }
  ]);
  const MUTATION_DISCOVERIES = Object.freeze([
    { id: 'cosmos', name: 'КОСМОС', image: 'assets/ui/recipe-categories/emblem-v4-cosmos.webp' },
    { id: 'nano', name: 'ТЕХНО', image: 'assets/ui/recipe-categories/emblem-v4-techno.webp' },
    { id: 'telekinesis', name: 'ПСИОНИКА', image: 'assets/ui/recipe-categories/emblem-v4-psionics.webp' },
    { id: 'cloning', name: 'СПОРЫ', image: 'assets/ui/recipe-categories/emblem-v3-spores.webp' },
    { id: 'phantom', name: 'ФАНТОМ', image: 'assets/ui/recipe-categories/emblem-v5-phantom-lossless.webp' },
    { id: 'glitch', name: 'ГЛИТЧ', image: 'assets/ui/recipe-categories/emblem-v4-glitch.webp' }
  ]);
  const MUTATION_DETAILS = Object.freeze({
    fire: { stage1: 'Поджигает блоки.', stage2: 'Огонь прыгает на соседние блоки.' },
    electric: { stage1: 'Копит заряд от ударов.', stage2: 'Разряд бьёт больше блоков.' },
    frost: { stage1: 'Охлаждает блоки и смягчает удары.', stage2: 'Ледяной щит становится крепче.' },
    cosmos: { stage1: 'Меняет направление падения.', stage2: 'Комета пробивает блоки.' },
    nano: { stage1: 'Дрон стреляет по блокам.', stage2: 'Мини-мины взрывают блоки.' },
    telekinesis: { stage1: 'Бросает блок вниз.', stage2: 'Бросает сразу два блока.' },
    cloning: { stage1: 'Спора взрывает блок.', stage2: 'Из взрыва летят грибочки.' },
    phantom: { stage1: 'Становится призраком.', stage2: 'Помечает блоки для удара.' },
    glitch: { stage1: 'Заражает блоки.', stage2: 'Опасный блок даёт награду.' }
  });
  const MUTATION_REVEAL_DESCRIPTIONS = Object.freeze({
    fire: 'Поджигает блоки и распространяет огонь.',
    electric: 'Копит заряд и поражает блоки разрядом.',
    frost: 'Охлаждает блоки и смягчает удары.',
    cosmos: 'Управляет притяжением и пробивает блоки рывком.',
    nano: 'Дрон обстреливает блоки, а глаз направляет мини-мину.',
    telekinesis: 'Двигает и разбивает блоки силой мысли.',
    cloning: 'Выращивает взрывные споры на блоках; из них вылетают грибочки.',
    phantom: 'Проходит сквозь блоки и поражает их при появлении.',
    glitch: 'Заражает блоки и передаёт урон между ними.'
  });
  const FORM_INDEX = Object.freeze([
    { id: 'fire', name: 'Феникс', mutation: 'ОГОНЬ', ultra: ['Полёт феникса', 'Поджигает блоки на 100 м вниз.'], art: 'effects-lab/assets/fire-ultra-phoenix-body-v4-lossless.webp', color: '#ff8741' },
    { id: 'frost', name: 'Ледяная форма', mutation: 'МОРОЗ', ultra: ['Снегопад', '6 секунд превращает блоки в снег.'], art: 'effects-lab/assets/frost-ultra-body-v1.webp', color: '#83eaff' },
    { id: 'electric', name: 'Грозовая форма', mutation: 'ЭЛЕКТРО', ultra: ['Грозовой шквал', '5 молний разбивают блоки цепями.'], art: 'effects-lab/assets/electric-ultra-body-v7-lossless.webp', color: '#ffe46a' },
    { id: 'cosmos', name: 'Космическая форма', mutation: 'КОСМОС', ultra: ['Кометный прорыв', 'Летит и пробивает блоки на пути.'], art: 'effects-lab/assets/cosmos-ultra-body-v2-lossless.webp', color: '#b998ff' },
    { id: 'nano', name: 'Киборг', mutation: 'ТЕХНО', ultra: ['Меха-слайм', '10 секунд летает и стреляет по блокам.'], art: 'effects-lab/assets/techno-ultra-body-v2-lossless.webp', color: '#ff8088' },
    { id: 'telekinesis', name: 'Псионическая форма', mutation: 'ПСИОНИКА', ultra: ['Псионический пресс', 'Сжимает и ломает 80 м шахты.'], art: 'effects-lab/assets/psionics-ultra-body-v1-lossless.webp', color: '#dbadff' },
    { id: 'cloning', name: 'Грибница', mutation: 'СПОРЫ', ultra: ['Споровый посев', '8 спор взрывают блоки по очереди.'], art: 'effects-lab/assets/spores-ultra-body-v5-lossless.webp', color: '#b8f879' },
    { id: 'phantom', name: 'Призрачная форма', mutation: 'ФАНТОМ', ultra: ['Призрачный прорыв', '3 секунды защиты. Ломает блоки рядом.'], art: 'effects-lab/assets/phantom-ultra-body-v6-lossless.webp', color: '#dbeaff' },
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
    phantom: { filter: 'grayscale(1) brightness(1.2)', glow: '#e2e7f4' },
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
  let displayedPlayerLevel = null;
  let playerLevelCelebration = null;
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
  let mutationUpgrading = false;
  let pendingMutationReveal = null;
  let mutationFeedHoldTimer = 0;
  let mutationFeedHoldStartedAt = 0;
  let mutationFeedHoldActive = false;
  let adminInfiniteResearch = false;
  let adminInfiniteUltimate = false;
  let tutorialGiftTimer = 0;
  let tutorialCountTimer = 0;
  let tutorialRunTimer = 0;
  let tutorialPointerFlight = null;
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
    merged.tutorialStep = legacySave ? 'done' : (TUTORIAL_STEPS.has(value.tutorialStep) ? value.tutorialStep : 'home-mutations');
    merged.tutorialGiftClaimed = legacySave || value.tutorialGiftClaimed === true;
    merged.tutorialSecondGiftClaimed = legacySave || value.tutorialSecondGiftClaimed === true;
    const validFormIds = new Set(FORM_INDEX.map(form => form.id));
    merged.discoveredForms = Array.isArray(value.discoveredForms)
      ? [...new Set(value.discoveredForms.filter(id => validFormIds.has(id)))]
      : [];
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
    merged.mutationProgress = clamp(Math.floor(Number.isFinite(+merged.mutationProgress) ? +merged.mutationProgress : 0), 0, MUTATION_STEPS * MUTATION_DISCOVERIES.length);
    merged.mutationInvestTapCount = merged.mutationProgress > 0
      ? clamp(Math.floor(Number(value.mutationInvestTapCount) || 0), 0, 1000)
      : 0;
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
    merged.worldLastRun = { ...defaultSave.worldLastRun };
    for (const world of WORLDS) {
      merged.worldLastRun[world.id] = clamp(+(value.worldLastRun?.[world.id] || 0), 0, world.targetDepth);
    }
    const legacyWorldIndex = value.worldTrophies ? 0 : Math.max(0, ACTIVE_WORLD_IDS.indexOf(merged.world));
    const legacyUnlockedWorlds = ACTIVE_WORLDS.filter((world, index) => index <= legacyWorldIndex ||
      (index > 0 && +(value.worldBest?.[ACTIVE_WORLDS[index - 1].id] || 0) >= ACTIVE_WORLDS[index - 1].targetDepth)).map(world => world.id);
    merged.unlockedWorlds = [...new Set([ACTIVE_WORLD_IDS[0], ...(Array.isArray(value.unlockedWorlds) ? value.unlockedWorlds : legacyUnlockedWorlds)])]
      .filter(id => ACTIVE_WORLD_IDS.includes(Number(id))).map(Number);
    const oldWorldIndex = Math.max(0, ACTIVE_WORLD_IDS.indexOf(merged.world),
      ...merged.unlockedWorlds.map(id => ACTIVE_WORLD_IDS.indexOf(id)),
      ...ACTIVE_WORLDS.slice(1).map((world, index) =>
        +(value.worldTrophies?.[ACTIVE_WORLDS[index].id] || 0) >= 10 ? index + 1 : 0));
    const legacyTrophyExperience = ACTIVE_WORLDS.reduce((best, world, index) => {
      const trophies = clamp(Math.floor(+(value.worldTrophies?.[world.id] || 0)), 0, 10);
      if (!trophies) return best;
      const start = EXPERIENCE.experienceForLevel(EXPERIENCE.requiredLevelForWorldIndex(index));
      const end = EXPERIENCE.experienceForLevel(EXPERIENCE.requiredLevelForWorldIndex(index + 1));
      return Math.max(best, Math.round(start + (end - start) * trophies / 10));
    }, 0);
    merged.playerExperience = Number.isFinite(+value.playerExperience)
      ? Math.max(0, Math.floor(+value.playerExperience))
      : Math.max(EXPERIENCE.experienceForLevel(EXPERIENCE.requiredLevelForWorldIndex(oldWorldIndex)), legacyTrophyExperience);
    delete merged.worldTrophies;
    merged.unseenWorlds=(Array.isArray(value.unseenWorlds)?value.unseenWorlds:[])
      .map(Number).filter(id=>ACTIVE_WORLD_IDS.includes(id)&&id!==ACTIVE_WORLD_IDS[0]
        && EXPERIENCE.levelForExperience(merged.playerExperience)>=EXPERIENCE.requiredLevelForWorldIndex(ACTIVE_WORLD_IDS.indexOf(id)));
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
    const foodById = id => FOODS.find(food => food.id === id);
    const foods = [];
    for (const id of raw.foods) {
      const food = foodById(id);
      if (canAddToStomach(food, foods)) foods.push(food);
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
      const stage = foods.filter(food => foodRecipeFamily(food) === family).length + 1;
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

  function persist({ captureDraft = true, cloud = true, refreshUI = true } = {}) {
    if (captureDraft && session && !run) save.activeDraft = serializeSession();
    saveUpdatedAt = Date.now();
    saveRevision += 1;
    writeLocalSave(createSaveEnvelope());
    if (cloud) scheduleCloudSave();
    if (refreshUI) updatePersistentUI();
  }

  function tutorialActive() {
    return save.tutorialStep !== 'done';
  }

  function tutorialTarget() {
    switch (save.tutorialStep) {
      case 'home-mutations': return ['.mutation-lab-button', 'Нажми на мутации'];
      case 'reactor': return ['#mutationCapsuleBtn', 'Добавь 10 колб в синтезатор'];
      case 'synthesize': return ['#mutationSynthesizeBtn', 'Начни синтез'];
      case 'core': return ['#mutationMystery', 'Нажми на готовую эмблему'];
      case 'prize': return ['#mutationPrize .mutation-prize-cta', 'Забери Огонь'];
      case 'fire-slot': return ['[data-lab-mutation="fire"]', 'Выбери Огонь'];
      case 'choose': return ['#mutationChooseBtn', 'Поставь Огонь в синтезатор'];
      case 'close-lab': return ['#closePanelBtn', 'Вернись к слайму'];
      case 'feed': return ['.conveyor-food-pick:not(.locked)', 'Перетащи одну еду к слайму'];
      case 'feed-count': return ['#conveyorChoiceCount', 'Первая еда съедена!'];
      case 'play': return ['#worldStartBtn', 'Нажми «Играть»'];
      case 'upgrade-home-mutations': return ['.mutation-lab-button', 'Открой мутации'];
      case 'upgrade-fire': return ['#mutationUpgradeBtn', 'Улучши Огонь до II'];
      case 'upgrade-close-lab': return ['#closePanelBtn', 'Вернись к слайму'];
      default: return null;
    }
  }

  let tutorialOutlineSource = null;

  function renderTutorialOutline(target) {
    // Measure the painted sprite, rather than its larger invisible hit area.
    const artwork = target.id === 'mutationCapsuleBtn' ? target.querySelector('.mutation-machine-art')
      : target.id === 'mutationMystery' ? target.querySelector('img')
      : target.matches('.conveyor-food-pick') ? target.querySelector('.food-model-wrap img') : null;
    const source = artwork || target;
    if (tutorialOutlineSource !== target) {
      tutorialOutlineSource?.classList.remove('tutorial-outline-source');
      tutorialOutlineSource = target;
      target.classList.add('tutorial-outline-source');
    }
    const bounds = source.getBoundingClientRect();
    const focus = els.tutorialFocus;
    const image = focus.querySelector('image');
    const edges = focus.querySelectorAll('path');
    const padding = 5;
    focus.style.cssText = `left:${bounds.left - padding}px;top:${bounds.top - padding}px;width:${bounds.width + padding * 2}px;height:${bounds.height + padding * 2}px`;
    focus.setAttribute('viewBox', `0 0 ${bounds.width + padding * 2} ${bounds.height + padding * 2}`);
    image.style.display = artwork ? '' : 'none';
    edges.forEach(edge => { edge.style.display = artwork ? 'none' : ''; });
    if (artwork) {
      image.setAttribute('href', artwork.currentSrc || artwork.src);
      image.setAttribute('x', padding);
      image.setAttribute('y', padding);
      image.setAttribute('width', bounds.width);
      image.setAttribute('height', bounds.height);
      image.setAttribute('preserveAspectRatio', getComputedStyle(artwork).objectFit === 'fill' ? 'none' : 'xMidYMid meet');
    } else {
      const style = getComputedStyle(source);
      const w = bounds.width + padding * 2, h = bounds.height + padding * 2;
      const radius = value => {
        const parts = value.split(' ');
        return [parts[0], parts[1] || parts[0]].map((part, axis) => Math.min((axis ? h : w) / 2, padding + (
          part.endsWith('%') ? parseFloat(part) * (axis ? bounds.height : bounds.width) / 100
            : parseFloat(part) * (axis ? bounds.height / (source.offsetHeight || bounds.height) : bounds.width / (source.offsetWidth || bounds.width)) || 0)));
      };
      const [a, b, c, d] = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius].map(radius);
      if (source.id === 'worldStartBtn') [a, b, c, d].forEach(r => { r[0] = r[1] = h / 2; });
      if (source.id === 'conveyorChoiceCount') [a, b, c, d].forEach(r => { r[0] = r[1] = 10; });
      const corner = (r, x, y) => r[0] && r[1] ? `A${r[0]},${r[1]} 0 0 1 ${x},${y}` : `L${x},${y}`;
      let path = `M${a[0]},0 H${w - b[0]} ${corner(b,w,b[1])} V${h - c[1]} ${corner(c,w-c[0],h)} H${d[0]} ${corner(d,0,h-d[1])} V${a[1]} ${corner(a,a[0],0)} Z`;
      // CSS polygon outlines need the same vertices, not a rectangular border.
      if (style.clipPath.startsWith('polygon(')) {
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
    }
    return bounds;
  }

  function renderTutorial() {
    if (!els.tutorialLayer) return;
    const active = tutorialActive();
    const adminOpen = !els.adminToolsOverlay?.classList.contains('hidden');
    const runMenuOpen = !els.runMenuOverlay?.classList.contains('hidden');
    const suspended = adminOpen || runMenuOpen;
    if (els.tutorialSkipBtn) els.tutorialSkipBtn.hidden = !active;
    if (els.tutorialRunSkipBtn) els.tutorialRunSkipBtn.hidden = !active;
    const needsAdminAccess = els.app.inert || ['gift', 'second-gift', 'upgrade-summary'].includes(save.tutorialStep);
    if (els.tutorialAdminBtn) els.tutorialAdminBtn.hidden = !active || suspended || !needsAdminAccess || document.body.dataset.screen === 'drop';
    if (els.tutorialAdminBtn && !els.tutorialAdminBtn.hidden && els.adminMenuBtn) {
      const gear = els.adminMenuBtn.getBoundingClientRect();
      els.tutorialAdminBtn.style.cssText = `left:${gear.left}px;top:${gear.top}px;right:auto;width:${gear.width}px;height:${gear.height}px`;
    }
    if (els.tutorialPauseBtn) els.tutorialPauseBtn.hidden = !active || suspended || save.tutorialStep !== 'controls';
    if (els.tutorialPauseBtn && !els.tutorialPauseBtn.hidden && els.endRunBtn) {
      const pause = els.endRunBtn.getBoundingClientRect();
      els.tutorialPauseBtn.style.cssText = `left:${pause.left}px;top:${pause.top}px;width:${pause.width}px;height:${pause.height}px`;
    }
    if (els.tutorialGift) {
      els.tutorialGift.hidden = !active || suspended || !['gift', 'second-gift'].includes(save.tutorialStep);
      if (!els.tutorialGift.hidden) {
        const amount = save.tutorialStep === 'second-gift' ? 50 : 10;
        els.tutorialGift.setAttribute('aria-label', `Подарок: ${amount} колб`);
        const label = els.tutorialGift.querySelector('.tutorial-gift-amount');
        if (label) label.textContent = `${amount} КОЛБ`;
      }
    }
    if (els.tutorialControls) els.tutorialControls.hidden = !active || suspended || save.tutorialStep !== 'controls';
    if (els.tutorialUpgradeSummary) els.tutorialUpgradeSummary.hidden = !active || suspended || save.tutorialStep !== 'upgrade-summary';
    const instruction = active && !suspended ? tutorialTarget() : null;
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
    els.tutorialCaption.textContent = instruction[1];
    const captionAbove = bottom > innerHeight - 90;
    els.tutorialCaption.style.left = `${Math.max(8, Math.min(innerWidth - 268, bounds.left + bounds.width / 2 - 120))}px`;
    els.tutorialCaption.style.top = `${captionAbove ? Math.max(8, top - 43) : Math.min(innerHeight - 37, bottom + 10)}px`;
    tutorialPointerFlight?.cancel();
    tutorialPointerFlight = null;
    els.tutorialLayer.classList.toggle('is-dragging', save.tutorialStep === 'feed');
    const pointerTipX = 6;
    const pointerTipY = 11;
    const pointerX = bounds.left + bounds.width / 2 - pointerTipX;
    const pointerY = bounds.top + bounds.height / 2 - pointerTipY;
    els.tutorialPointer.style.left = `${pointerX}px`;
    els.tutorialPointer.style.top = `${pointerY}px`;
    if (save.tutorialStep === 'feed' && els.slime?.getClientRects().length && !menuReducedMotion) {
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
    if (tutorialActive()) requestAnimationFrame(renderTutorial);
  }

  function setTutorialStep(step) {
    if (!TUTORIAL_STEPS.has(step) || save.tutorialStep === step) return;
    save.tutorialStep = step;
    persist({ refreshUI: false });
    queueTutorialRender();
  }

  function tutorialInputAllowed(target) {
    if (!tutorialActive()) return true;
    if (!(target instanceof Element)) return false;
    if (target.closest('#tutorialAdminBtn,#tutorialPauseBtn,#adminMenuBtn,#endRunBtn')) return true;
    if (!els.adminToolsOverlay?.classList.contains('hidden')) return Boolean(target.closest('#tutorialSkipBtn,#closeAdminToolsBtn'));
    if (!els.runMenuOverlay?.classList.contains('hidden')) return Boolean(target.closest('#tutorialRunSkipBtn,#resumeRunBtn'));
    if (run?.ended && target.closest('#resultOverlay,#gameCompleteOverlay')) return true;
    const step = save.tutorialStep;
    if (step === 'gift' || step === 'second-gift') return Boolean(target.closest('#tutorialGiftClaimBtn'));
    if (step === 'controls') return Boolean(target.closest('#tutorialControlsCloseBtn:not([hidden])'));
    if (step === 'upgrade-summary') return Boolean(target.closest('#tutorialUpgradeSummaryCloseBtn'));
    if (step === 'run-wait') return Boolean(target.closest('#shaft') && !target.closest('#abilityBtn'));
    if (step === 'post-run') return document.body.dataset.screen === 'drop';
    const instruction = tutorialTarget();
    const allowedSelector = step === 'core' ? '#mutationMystery'
      : step === 'prize' ? '#mutationPrize'
      : step === 'feed' ? '.conveyor-food-pick:not(.locked),#slime'
      : instruction?.[0];
    return Boolean(allowedSelector && target.closest(allowedSelector));
  }

  function blockTutorialInput(event) {
    if (!tutorialActive() || tutorialInputAllowed(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function blockTutorialKey(event) {
    if (!tutorialActive()) return;
    if (save.tutorialStep === 'post-run' && document.body.dataset.screen === 'drop') return;
    if (save.tutorialStep === 'run-wait' && ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'KeyA', 'KeyD', 'KeyS'].includes(event.code)) return;
    if (event.key === 'Tab') return;
    if (event.key === 'Escape') {
      if (!els.adminToolsOverlay?.classList.contains('hidden') || !els.runMenuOverlay?.classList.contains('hidden')) return;
    } else if (['Enter', ' ', 'Spacebar'].includes(event.key) && tutorialInputAllowed(document.activeElement)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function claimTutorialGift() {
    const secondGift = save.tutorialStep === 'second-gift';
    if (!secondGift && save.tutorialStep !== 'gift') return;
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
      flask.src = versionedAsset('assets/ui/research-flask-blue-v1.webp');
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
    if (!tutorialActive()) return;
    clearTimeout(tutorialGiftTimer);
    clearTimeout(tutorialCountTimer);
    clearTimeout(tutorialRunTimer);
    tutorialPointerFlight?.cancel();
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    pendingMutationReveal = null;
    save.unlockedMutations = [...new Set([...(save.unlockedMutations || []), 'fire'])];
    save.mutationLevels = { ...(save.mutationLevels || {}), fire: 2 };
    save.activeMutationPool = ['fire'];
    save.mutationProgress = 0;
    save.mutationInvestTapCount = 0;
    save.tutorialGiftClaimed = true;
    save.tutorialSecondGiftClaimed = true;
    save.tutorialStep = 'done';
    if (save.researchUnits <= 10) save.researchUnits = 0;
    persist();
    renderTutorial();
    if (!els.adminToolsOverlay.classList.contains('hidden')) closeAdminTools();
    if (!els.panelOverlay.classList.contains('hidden')) closePanel();
    if (run && !run.ended && document.body.dataset.screen === 'drop') {
      if (!els.runMenuOverlay.classList.contains('hidden')) hideRunMenu();
      if (run.paused) resumeRun();
    } else newDraft();
    showToast('Обучение пропущено · Огонь II открыт');
  }

  function showTutorialControls() {
    if (save.tutorialStep !== 'run-wait' || !run || run.ended) return;
    if (run.paused) {
      tutorialRunTimer = setTimeout(showTutorialControls, 400);
      return;
    }
    run.tutorialSlowUntil = performance.now() + 480;
    tutorialRunTimer = setTimeout(() => {
      if (save.tutorialStep !== 'run-wait' || !run || run.ended) return;
      if (!pauseRun({ allowPortal: true })) {
        tutorialRunTimer = setTimeout(showTutorialControls, 400);
        return;
      }
      els.tutorialControlsText.innerHTML = isMobileDevice()
        ? '<span class="tutorial-control-keys"><kbd>←</kbd><kbd>●</kbd><kbd>→</kbd><kbd>↓</kbd></span><span>Веди стик влево и вправо. Потяни вниз, чтобы падать быстрее.</span>'
        : '<span class="tutorial-control-keys"><kbd>A</kbd><kbd>D</kbd><kbd>←</kbd><kbd>→</kbd></span><span>Двигайся влево и вправо. <kbd>S</kbd> или <kbd>↓</kbd> — быстрее вниз.</span>';
      els.tutorialControlsCloseBtn.hidden = true;
      setTutorialStep('controls');
      tutorialRunTimer = setTimeout(() => { els.tutorialControlsCloseBtn.hidden = false; }, 2000);
    }, 480);
  }

  function finishTutorial() {
    if (save.tutorialStep !== 'controls' || els.tutorialControlsCloseBtn.hidden) return;
    setTutorialStep('post-run');
    renderTutorial();
    resumeRun();
  }

  function finishUpgradeTutorial() {
    if (save.tutorialStep !== 'upgrade-summary') return;
    setTutorialStep('done');
    renderTutorial();
  }

  function restoreTutorial() {
    if (!tutorialActive()) return;
    const step = save.tutorialStep;
    if (step === 'post-run' && !run) setTutorialStep('second-gift');
    if (step === 'run-wait' || step === 'controls' || step === 'feed-count' || (step === 'feed' && stomachCanLaunch())) {
      setTutorialStep(stomachCanLaunch() ? 'play' : 'feed');
      return;
    }
    if (step === 'second-gift-credit') {
      setTutorialStep('upgrade-home-mutations');
    } else if (step === 'gift-credit') {
      setTutorialStep('reactor');
    } else if (['wait-synthesis', 'core', 'prize'].includes(step)) {
      setTutorialStep('synthesize');
    } else if (step === 'second-gift' && save.tutorialSecondGiftClaimed) {
      setTutorialStep('upgrade-home-mutations');
    } else if (step === 'gift' && save.tutorialGiftClaimed) {
      setTutorialStep('reactor');
    }
    if (['home-mutations', 'feed', 'play', 'post-run', 'upgrade-home-mutations', 'second-gift', 'upgrade-summary'].includes(save.tutorialStep)) {
      queueTutorialRender();
      return;
    }
    renderPanel('recipes');
    if (save.tutorialStep === 'gift-delay') {
      clearTimeout(tutorialGiftTimer);
      tutorialGiftTimer = setTimeout(() => {
        if (save.tutorialStep === 'gift-delay') setTutorialStep('gift');
      }, 550);
    }
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
    graphicsCost = graphicsCost * .95 + milliseconds * .05;
    // Adapt decorative density, preserving physics and the face resolution.
    const desired = graphicsCost > 15 ? .55 : graphicsCost > 10 ? .75 : 1;
    graphicsBudget += (desired - graphicsBudget) * .025;
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
    syncTerminalInsets();
    window.SlimeFoodGrounding.schedule();
  }

  function syncTerminalInsets() {
    const art = els.homeScreen.querySelector('.synth-terminal-art');
    const shell = els.homeScreen.querySelector('.world-terminal-shell');
    if (!art || !shell || !shell.offsetWidth || !shell.offsetHeight) return;
    const base = art.getBoundingClientRect(), host = shell.getBoundingClientRect();
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
  function stomachCanLaunch(foods = session?.foods || []) { return stomachFoodCount(foods) > 0; }
  function canAddToStomach(food, foods = session?.foods || []) {
    if (!food || stomachFoodCount(foods) >= STOMACH_CAPACITY) return false;
    const family = foodRecipeFamily(food);
    const mutationId = (save.activeMutationPool || []).find(id => mutationFoodFamily(id) === family);
    if (!mutationId) return false;
    const eatenOfFamily = foods.filter(item => foodRecipeFamily(item) === family).length;
    return eatenOfFamily < mutationLevel(mutationId) && (!food.stage || food.stage === eatenOfFamily + 1);
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
    const suffix = Number(worldId) === 3 || Number(worldId) === 4 ? '-v2' : '';
    return versionedAsset(`assets/ui/world-icons/world-${worldId}${suffix}.webp`);
  }
  function currentWorld() { return WORLDS.find(world => world.id === Number(save.world)) || ACTIVE_WORLDS[0]; }
  function worldIsUnlocked(worldId) {
    const index = ACTIVE_WORLD_IDS.indexOf(Number(worldId));
    if (index < 0) return false;
    return EXPERIENCE.levelForExperience(save.playerExperience) >= EXPERIENCE.requiredLevelForWorldIndex(index);
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

  function renderWorldCarousel() {
    if (!els.worldCarousel) return;
    const world = carouselWorld();
    const index = ACTIVE_WORLD_IDS.indexOf(world.id);
    const locked = !worldIsUnlocked(world.id);
    const requiredLevel = EXPERIENCE.requiredLevelForWorldIndex(index);
    const previews = {
      1: 'assets/ui/world-terminal/mine-blue-essence-v1.webp',
      3: 'assets/ui/world-terminal/mine-candy.webp',
      4: 'assets/ui/world-terminal/mine-magma.webp'
    };
    const preview = previews[world.id] || previews[1];
    if (els.worldTerminalPreview && els.worldTerminalPreview.getAttribute('src') !== preview) els.worldTerminalPreview.src = preview;
    if (els.worldTerminalNumber) els.worldTerminalNumber.textContent = locked?'':`${levelTargetDepth(world, selectedLevelForWorld(world.id)).toLocaleString('ru-RU')} М`;
    if (els.worldTerminalName) els.worldTerminalName.textContent = locked?'':world.name.toLocaleUpperCase('ru-RU');
    const newlyUnlocked=!locked && save.unseenWorlds?.includes(world.id);
    const newWorldBadge=document.querySelector('#worldTerminalNew');
    if(newWorldBadge)newWorldBadge.hidden=!newlyUnlocked;
    els.worldNextBtn?.classList.toggle('has-new-world',(save.unseenWorlds||[]).some(id=>ACTIVE_WORLD_IDS.indexOf(id)>index));
    if (els.worldTerminalTrophies) els.worldTerminalTrophies.textContent = String(requiredLevel);
    if (els.worldTerminalLock) els.worldTerminalLock.hidden = !locked;
    els.worldCarousel.classList.toggle('locked', locked);
    els.worldCarousel.setAttribute('aria-label', locked
      ? `Шахта закрыта до уровня ${requiredLevel}`
      : `Шахта ${worldDisplayNumber(world.id)}, ${world.name}, ${world.targetDepth} метров`);
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
      dot.setAttribute('aria-label', `Шахта ${worldDisplayNumber(ACTIVE_WORLDS[dotIndex].id)}${worldIsUnlocked(ACTIVE_WORLDS[dotIndex].id) ? '' : ', закрыта'}`);
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
        button.setAttribute('aria-label', unlocked ? `Шахта ${displayNumber}. ${item.name}` : `Шахта ${displayNumber} закрыта`);

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
    sound('tap');
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
    if (!worldIsUnlocked(nextWorldId)) {
      carouselWorldId = nextWorldId;
      renderWorldCarousel();
      syncWorldStartButton(stomachCanLaunch());
      sound('tap');
      return;
    }
    if (nextWorldId === save.world) {
      carouselWorldId = nextWorldId;
      renderWorldCarousel();
      syncWorldStartButton(stomachCanLaunch());
      return;
    }
    if (session?.rerollPending || adInFlight) {
      showToast('Дождись окончания обновления');
      return;
    }
    save.world = nextWorldId;
    carouselWorldId = nextWorldId;
    sound('tap');
    feedback(8);
    renderWorldCarousel();
    updateSelectedWorldSummary();
    syncWorldStartButton(stomachCanLaunch());
    persist({ refreshUI: false });
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

  function updateSelectedWorldSummary() {
    const world = currentWorld();
    document.body.dataset.world = String(world.id);
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
    if (els.adminWorldValue) els.adminWorldValue.textContent = worldDisplayNumber(world.id) ? `ШАХТА ${worldDisplayNumber(world.id)}` : 'ШАХТА 2 · ПАУЗА';
    renderLevelPicker();
  }

  function clearPlayerLevelCelebration() {
    const celebration = playerLevelCelebration;
    playerLevelCelebration = null;
    if (!celebration) return;
    clearTimeout(celebration.swapTimer);
    clearTimeout(celebration.endTimer);
    celebration.animations.forEach(animation => animation.cancel());
    celebration.nodes.forEach(node => node.remove());
    celebration.badge.classList.remove('level-up-flash');
    displayedPlayerLevel = celebration.target;
    els.coinsLabel.textContent = String(displayedPlayerLevel);
  }

  function renderPlayerLevelValue(level) {
    if (displayedPlayerLevel === null || level < displayedPlayerLevel || menuReducedMotion
      || document.body.dataset.screen !== 'home' || !Element.prototype.animate) {
      clearPlayerLevelCelebration();
      displayedPlayerLevel = level;
      els.coinsLabel.textContent = String(level);
      return;
    }
    if (playerLevelCelebration) {
      playerLevelCelebration.target = Math.max(level, playerLevelCelebration.target);
      return;
    }
    if (level === displayedPlayerLevel) return;
    const badge = els.coinsLabel.closest('.player-level-badge');
    const celebration = { badge, target: level, animations: [], nodes: [], swapTimer: 0, endTimer: 0 };
    playerLevelCelebration = celebration;
    celebration.animations.push(badge.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.32) rotate(-5deg)', offset: .32 },
      { transform: 'scale(1)', offset: .65 },
      { transform: 'scale(1.035)', offset: .8 },
      { transform: 'scale(1)' }
    ], { duration: 540, easing: 'ease-in-out' }));
    celebration.swapTimer = setTimeout(() => {
      if (playerLevelCelebration !== celebration) return;
      displayedPlayerLevel = celebration.target;
      els.coinsLabel.textContent = String(displayedPlayerLevel);
      badge.classList.add('level-up-flash');
      sound('coin'); feedback([5, 16, 7]);
      const colors = ['#ffe770', '#83edff', '#ffa8ce', '#b2f59b'];
      for (let index = 0; index < 10; index += 1) {
        const piece = document.createElement('i');
        piece.className = 'level-up-confetti';
        piece.style.background = colors[index % colors.length];
        badge.appendChild(piece);
        celebration.nodes.push(piece);
        const angle = index * Math.PI * 2 / 10;
        const reach = rand(32, 44);
        const x = Math.cos(angle) * reach;
        const y = Math.sin(angle) * reach - 8;
        const at = (dx, dy, rotation) => `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${rotation}deg)`;
        const animation = piece.animate([
          { transform: at(0, 0, 0), opacity: 1 },
          { transform: at(x, y, index * 43), opacity: 1, offset: .65 },
          { transform: at(x * 1.16, y + 16, index * 71), opacity: 0 }
        ], { duration: 520, easing: 'cubic-bezier(.16,.65,.3,1)', fill: 'forwards' });
        celebration.animations.push(animation);
        animation.finished.catch(() => {}).finally(() => piece.remove());
      }
    }, 210);
    celebration.endTimer = setTimeout(() => {
      if (playerLevelCelebration !== celebration) return;
      playerLevelCelebration = null;
      badge.classList.remove('level-up-flash');
      celebration.nodes.forEach(node => node.remove());
      renderPlayerLevelValue(celebration.target);
    }, 740);
  }

  function paintPlayerExperience(experience, heldLevel = null) {
    const level = heldLevel ?? EXPERIENCE.levelForExperience(experience);
    const progress = Math.max(0, experience - EXPERIENCE.experienceForLevel(level));
    const cost = level < EXPERIENCE.MAX_LEVEL ? EXPERIENCE.nextLevelCost(level) : 0;
    if (heldLevel === null) renderPlayerLevelValue(level);
    if (els.playerLevelProgress) els.playerLevelProgress.style.width = `${cost ? Math.min(100, progress / cost * 100) : 100}%`;
    if (els.playerLevelExperience) {
      if (cost) {
        if (!els.playerLevelExperience.querySelector('b')) els.playerLevelExperience.innerHTML = '<b></b><span></span>';
        els.playerLevelExperience.querySelector('b').textContent = String(Math.min(progress, cost));
        els.playerLevelExperience.querySelector('span').textContent = ` / ${cost} XP`;
      } else els.playerLevelExperience.textContent = 'МАКСИМУМ';
    }
    els.coinsLabel.closest('.player-level-wallet')?.setAttribute('aria-label', cost
      ? `Уровень ${level}, опыт ${Math.min(progress, cost)} из ${cost}` : `Максимальный уровень ${level}`);
  }

  function renderPlayerExperience(experience) {
    const track = els.playerLevelProgress?.parentElement;
    const state = playerExperiencePresentation;
    if (!state || experience < state.shown || menuReducedMotion || document.body.dataset.screen !== 'home') {
      if (state) cancelAnimationFrame(state.frame);
      playerExperiencePresentation = { shown: experience, target: experience, frame: 0, heldUntil: 0 };
      track?.classList.remove('is-xp-counting');
      paintPlayerExperience(experience);
      return;
    }
    state.target = experience;
    if (state.frame || state.shown === experience) return;
    state.from = state.shown;
    state.started = performance.now();
    track?.classList.add('is-xp-counting');
    const step = now => {
      if (playerExperiencePresentation !== state) return;
      if (state.heldUntil) {
        if (now < state.heldUntil) { state.frame = requestAnimationFrame(step); return; }
        state.heldUntil = 0;
        state.from = state.shown;
        state.started = now;
        paintPlayerExperience(state.shown);
      }
      const duration = clamp(280 + (state.target - state.from) * .5, 280, 650);
      const ratio = clamp((now - state.started) / duration, 0, 1);
      const next = Math.round(state.from + (state.target - state.from) * (1 - Math.pow(1 - ratio, 2)));
      const previousLevel = EXPERIENCE.levelForExperience(state.shown);
      const boundary = EXPERIENCE.experienceForLevel(previousLevel + 1);
      if (previousLevel < EXPERIENCE.MAX_LEVEL && state.shown < boundary && next >= boundary) {
        state.shown = boundary;
        paintPlayerExperience(boundary, previousLevel);
        renderPlayerLevelValue(previousLevel + 1);
        state.heldUntil = now + 330;
      } else {
        state.shown = next;
        paintPlayerExperience(next);
      }
      if (state.shown < state.target || state.heldUntil) state.frame = requestAnimationFrame(step);
      else { state.frame = 0; track?.classList.remove('is-xp-counting'); }
    };
    state.frame = requestAnimationFrame(step);
  }

  function renderWalletBalances() {
    const experience = homeRewardFlight
      ? homeRewardFlight.experienceStart + homeRewardFlight.experienceShown
      : save.playerExperience;
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
    researchWallet?.setAttribute('aria-label', adminInfiniteResearch ? 'Исследование: бесконечные колбы' : `Колбы исследования: ${researchUnits}`);
  }

  function settleHomeRewardFlight() {
    const flight = homeRewardFlight;
    if (!flight) return;
    clearTimeout(flight.timeout);
    flight.animations.forEach(animation => animation.cancel());
    document.getElementById('homeRewardFlightLayer')?.replaceChildren();
    homeRewardFlight = null;
    renderWalletBalances();
  }

  function prepareHomeRewardFlight(completedRun) {
    settleHomeRewardFlight();
    if (!completedRun) return;
    const flaskGain = adminInfiniteResearch ? 0 : Math.max(0,
      (completedRun.researchUnitsAfter || 0) - (completedRun.researchUnitsBefore || 0));
    const experienceGain = Math.max(0, Math.floor(completedRun.experienceEarned || 0));
    if (!flaskGain && !experienceGain) return;
    homeRewardFlight = {
      flaskStart: Math.max(0, save.researchUnits - flaskGain),
      flaskGain, flaskShown: 0,
      experienceStart: Math.max(0, save.playerExperience - experienceGain),
      experienceGain, experienceShown: 0,
      animations: [], timeout: 0, started: false
    };
  }

  function playHomeRewardFlight() {
    const flight = homeRewardFlight;
    if (!flight || flight.started) return;
    flight.started = true;
    const layer = document.getElementById('homeRewardFlightLayer');
    const viewport = document.getElementById('phoneViewport');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!layer || !viewport || reduceMotion || document.hidden || !Element.prototype.animate || document.body.dataset.screen !== 'home') {
      settleHomeRewardFlight();
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const originX = viewportRect.width * .5;
    const originY = viewportRect.height * .7;
    const particles = [];
    const addFlight = (kind, amount, targetIcon, targetWallet) => {
      if (!amount || !targetIcon || !targetWallet) return;
      const count = kind === 'experience' ? Math.min(6, amount) : Math.min(9, amount);
      const targetRect = targetIcon.getBoundingClientRect();
      const targetX = targetRect.left + targetRect.width / 2 - viewportRect.left;
      const targetY = targetRect.top + targetRect.height / 2 - viewportRect.top;
      for (let index = 0; index < count; index += 1) {
        const piece = Math.floor(amount / count) + (index < amount % count ? 1 : 0);
        const startX = originX + rand(-42, 42);
        const startY = originY + rand(-14, 16);
        const scatterX = startX + rand(-88, 88);
        const scatterY = startY - rand(42, 96);
        const image = document.createElement('img');
        image.className = `home-reward-particle home-reward-${kind}`;
        image.src = kind === 'experience' ? 'assets/ui/player-level-star-v2.webp' : 'assets/ui/research-flask-blue-v1.webp?v=1';
        image.alt = '';
        image.style.left = `${startX}px`;
        image.style.top = `${startY}px`;
        layer.appendChild(image);
        const at = (x, y, scale) => `translate3d(-50%,-50%,0) translate3d(${x - startX}px,${y - startY}px,0) scale(${scale})`;
        const middleX = scatterX + (targetX - scatterX) * .46;
        const middleY = scatterY + (targetY - scatterY) * .38 - 38;
        const animation = image.animate([
          { offset: 0, opacity: 0, transform: at(startX, startY, .45) },
          { offset: .12, opacity: 1, transform: at(startX, startY - 15, 1) },
          { offset: .28, opacity: 1, transform: at(scatterX, scatterY, 1.08) },
          { offset: .63, opacity: 1, transform: at(middleX, middleY, .84) },
          { offset: 1, opacity: 0, transform: at(targetX, targetY, .42) }
        ], { duration: kind === 'experience' ? 1120 : 880, delay: kind === 'experience' ? 180 + index * 95 : index * 78,
          easing: 'cubic-bezier(.22,.62,.25,1)', fill: 'forwards' });
        flight.animations.push(animation);
        particles.push(animation.finished.then(() => {
          if (homeRewardFlight !== flight) return;
          image.remove();
          if (kind === 'experience') flight.experienceShown += piece;
          else flight.flaskShown += piece;
          renderWalletBalances();
          const receiver = kind === 'experience' ? targetWallet.querySelector('.player-level-track') : targetWallet;
          receiver?.animate([
            { scale: '1', filter: 'brightness(1)' },
            { scale: kind === 'experience' ? '1.035' : '1.16', filter: 'brightness(1.2)', offset: .42 },
            { scale: '1', filter: 'brightness(1)' }
          ], { duration: 290, easing: 'ease-out' });
          if (kind === 'experience' || index % 3 === 0 || index === count - 1) sound('coin');
          if (kind === 'experience' || index === count - 1) feedback(5);
        }).catch(() => {}));
      }
    };

    addFlight('flask', flight.flaskGain,
      document.querySelector('.research-wallet-flask>img'),
      document.querySelector('.research-wallet'));
    addFlight('experience', flight.experienceGain,
      document.querySelector('.player-level-wallet .currency-icon'),
      document.querySelector('.player-level-wallet'));
    if (!particles.length) return settleHomeRewardFlight();
    flight.timeout = setTimeout(() => { if (homeRewardFlight === flight) settleHomeRewardFlight(); }, 2400);
    Promise.all(particles).then(() => {
      if (homeRewardFlight !== flight) return;
      clearTimeout(flight.timeout);
      flight.timeout = setTimeout(() => { if (homeRewardFlight === flight) settleHomeRewardFlight(); }, 360);
    });
  }

  function updatePersistentUI() {
    renderWalletBalances();
    const hasFirstForm = Boolean(save.discoveredForms?.length);
    for (const button of [els.formIndexBtn, els.wardrobeBtn]) {
      if (!button) continue;
      const locked = button === els.wardrobeBtn || !hasFirstForm;
      button.disabled = locked;
      button.classList.toggle('form-locked', locked);
      button.title = button === els.wardrobeBtn ? 'Гардероб пока недоступен' : locked ? 'Откроется после первой формы' : '';
    }
    els.wardrobeBtn?.setAttribute('aria-label', 'Гардероб пока недоступен');
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
    const swallowMs = 220;
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
    return Boolean(menuMutationReveal || formDiscoverySequence) || ['eat', 'chewing', 'savoring', 'expect-food', 'tracking-food'].some(name => els.slime.classList.contains(name));
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
    if (name !== 'home') {
      clearMenuMutationPresentation();
      clearPlayerLevelCelebration();
    }
    if (name !== 'home') settleHomeRewardFlight();
    document.body.dataset.screen = name;
    if (name !== 'home') renderPlayerExperience(save.playerExperience);
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

  function newDraft() {
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

  function restartDraftFromAdmin() {
    if (session?.rerollPending || adInFlight) return showToast('Дождись окончания обновления');
    sound('tap');
    feedback(8);
    newDraft();
    showToast('Новый забег: еду можно выбрать заново');
  }

  function switchWorldFromAdmin(direction) {
    if (session?.rerollPending || adInFlight) return showToast('Дождись окончания обновления');
    const currentIndex = Math.max(0, ACTIVE_WORLD_IDS.indexOf(save.world));
    const nextIndex = (currentIndex + direction + ACTIVE_WORLDS.length) % ACTIVE_WORLDS.length;
    save.world = ACTIVE_WORLDS[nextIndex].id;
    carouselWorldId = save.world;
    save.activeDraft = null;
    session = null;
    sound('tap');
    newDraft();
    showToast(`Админ: открыт мир ${save.world} — ${currentWorld().name}`);
  }

  function resetProgressFromAdmin() {
    if (!window.confirm('Сбросить весь прогресс, улучшения, исследование, уровень и текущий набор еды?')) return;
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
    adminInfiniteUltimate = false;
    syncAdminInfiniteFlasksUI();
    syncAdminInfiniteUltimateUI();
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
    save.researchUnits = Math.max(save.researchUnits, 9999);
    save.researchProgress = 0;
    save.world = 1;
    carouselWorldId = save.world;
    save.stomachLevel = 4;
    save.unlockedSkins = SKINS.map(skin => skin.id);
    save.unlockedTrails = TRAILS.map(trail => trail.id);
    save.gameCompleted = true;
    save.unlockedWorlds = [...ACTIVE_WORLD_IDS];
    for (const world of WORLDS) {
      save.unlockedLevels[world.id] = LEVEL_COUNT;
      save.selectedLevels[world.id] = 1;
      save.worldBest[world.id] = world.targetDepth;
      save.worldLastRun[world.id] = world.targetDepth;
      for (let level = 1; level <= LEVEL_COUNT; level += 1) {
        save.lastRunDepth[`${world.id}:${level}`] = levelTargetDepth(world, level);
      }
    }
    save.playerExperience = EXPERIENCE.experienceForLevel(EXPERIENCE.MAX_LEVEL);
    save.activeDraft = null;
    session = null;
    persist();
    sound('coin');
    feedback([20, 35, 20]);
    newDraft();
    updatePersistentUI();
    showToast('Все миры открыты · уровень 30 и исследование выданы');
  }

  function unlockMutationsFromAdmin() {
    save.unlockedMutations = allMutations().map(mutation => mutation.id);
    save.mutationLevels = Object.fromEntries(save.unlockedMutations.map(id => [id, 3]));
    save.mutationProgress = 0;
    save.mutationInvestTapCount = 0;
    pendingMutationReveal = null;
    persist();
    updatePersistentUI();
    closeAdminTools();
    sound('coin');
    feedback([8, 14, 8]);
    showToast('Все мутации открыты');
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

  function syncAdminInfiniteUltimateUI() {
    els.adminInfiniteUltimateBtn?.classList.toggle('active', adminInfiniteUltimate);
    els.adminInfiniteUltimateBtn?.setAttribute('aria-pressed', String(adminInfiniteUltimate));
    els.adminInfiniteUltimateBtn?.setAttribute('aria-label', `${adminInfiniteUltimate ? 'Выключить' : 'Включить'} бесконечную суперспособность`);
    if (els.adminInfiniteUltimateState) els.adminInfiniteUltimateState.textContent = adminInfiniteUltimate ? 'ВКЛЮЧЕНО' : 'ВЫКЛЮЧЕНО';
  }

  function toggleAdminInfiniteUltimate() {
    adminInfiniteUltimate = !adminInfiniteUltimate;
    syncAdminInfiniteUltimateUI();
    if (run) updateRunUI();
    sound('tap');
    feedback(adminInfiniteUltimate ? [5, 9, 5] : 5);
    showToast(adminInfiniteUltimate ? 'Бесконечная ульта включена' : 'Бесконечная ульта выключена');
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
    return allMutations().find(mutation => mutation.id === id) || null;
  }

  function mutationLevel(id) {
    if (!save.unlockedMutations?.includes(id)) return 0;
    return clamp(Math.floor(Number(save.mutationLevels?.[id]) || 1), 1, 3);
  }

  function mutationLevelForFamily(family) {
    const id = (save.activeMutationPool || []).find(mutationId => mutationFoodFamily(mutationId) === family);
    return id ? mutationLevel(id) : 0;
  }

  function mutationFoodFamily(id) {
    return id === 'frost' ? 'ice' : id;
  }

  function activeMutationFamilies() {
    return (save.activeMutationPool || []).map(mutationFoodFamily);
  }

  function randomFood(exclude = [], preferredFamily = '', stage = 0) {
    if (stage > 3 || (preferredFamily && stage > mutationLevelForFamily(preferredFamily))) return null;
    const pool = FOODS.filter(food => foodAvailableInWorld(food)
      && (!preferredFamily || foodRecipeFamily(food) === preferredFamily)
      && (!stage || food.stage === stage)
      && !exclude.includes(food.id));
    return pool[Math.floor(Math.random() * pool.length)] || null;
  }

  function generateOffer({ resetRerolls = true } = {}) {
    const offer = [null, null, null];
    const activeFamilies = activeMutationFamilies();
    const used = (session?.foods || []).map(food => food.id);
    for (let i = 0; i < 3; i += 1) {
      const family = activeFamilies[i];
      if (!family) continue;
      const stage = (session?.foods || []).filter(food => foodRecipeFamily(food) === family).length + 1;
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
    persist();
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

  function conveyorMutationFxMarkup(family) {
    return mutationElementFxMarkup(family, 'food-mutation-fx');
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
    nano: { glyph: '◉', label: 'ТЕХНО' },
    telekinesis: { glyph: '◇', label: 'ПСИОНИКА' },
    cloning: { glyph: '◉', label: 'СПОРЫ' },
    phantom: { glyph: '◌', label: 'ФАНТОМ' },
    glitch: { glyph: '▣', label: 'ГЛИТЧ' },
    mixed: { glyph: '•', label: 'ЕДА' }
  };

  const RECIPE_FAMILY_ICONS = Object.freeze({
    fire: 'assets/ui/recipe-categories/emblem-v2-fire.webp',
    ice: 'assets/ui/recipe-categories/emblem-v2-frost.webp',
    electric: 'assets/ui/recipe-categories/emblem-v2-electric.webp',
    cosmos: 'assets/ui/recipe-categories/emblem-v4-cosmos.webp',
    nano: 'assets/ui/recipe-categories/emblem-v4-techno.webp',
    telekinesis: 'assets/ui/recipe-categories/emblem-v4-psionics.webp',
    cloning: 'assets/ui/recipe-categories/emblem-v3-spores.webp',
    phantom: 'assets/ui/recipe-categories/emblem-v5-phantom-lossless.webp',
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
    const [size,x,y,right,bottom] = ({fire:[640,31,28,607,595],ice:[640,31,27,608,595],
      electric:[640,31,27,607,595],cosmos:[640,1,2,639,636],nano:[640,1,5,640,635],
      telekinesis:[640,0,4,639,635],cloning:[640,4,6,633,625],
      phantom:[1254,0,7,1254,1244],glitch:[640,1,2,639,638]})[family] || [640,0,0,640,640];
    return `--medal-width:${100*size/(right-x)}%;--medal-height:${100*size/(bottom-y)}%;--medal-left:${-100*x/(right-x)}%;--medal-top:${-100*y/(bottom-y)}%`;
  }

  function renderConveyorDispensers() {
    if (!els.conveyorDispensers) return;
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
    sound('tap');
    feedback(3);
    els.quickMutationPicker.innerHTML = `<div class="quick-mutation-head">ЗАМЕНИТЬ НА:</div>
      <div class="quick-mutation-list">${choices.map(mutation => `<button class="quick-mutation-option" data-quick-mutation="${mutation.id}" type="button" aria-label="Заменить на ${mutation.name}" title="${mutation.name}"><img src="${versionedAsset(mutation.image)}" alt=""></button>`).join('')}</div>`;
    els.quickMutationPicker.style.removeProperty('top');
    const summary = els.recipeCategorySlots?.closest('.slime-mutation-summary');
    if (summary?.getClientRects().length && els.slimeFeedCount?.getClientRects().length && els.slimeStage) {
      const stageBounds = els.slimeStage.getBoundingClientRect();
      const scaleY = stageBounds.height / els.slimeStage.offsetHeight || 1;
      const summaryTop = summary.getBoundingClientRect().top;
      const countBottom = els.slimeFeedCount.getBoundingClientRect().bottom;
      els.quickMutationPicker.style.top = `${Math.round(((summaryTop + countBottom) / 2 - stageBounds.top) / scaleY)}px`;
    }
    els.quickMutationPicker.hidden = false;
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
    save.activeMutationPool = pool;
    sound('tap');
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
      const stage = session.foods.filter(food => foodRecipeFamily(food) === family).length + 1;
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
    const rerollBlocked = session.rerollPending || session.offerTransition || adInFlight || menuSlimeIsBusy();
    els.rerollBtn.disabled = rerollBlocked || (!UNLIMITED_FREE_REROLLS && !readyToStart && session.freeRerolls <= 0 && session.adRerolls > 0);
    syncWorldStartButton(stomachCanLaunch());
    scheduleHomeFit();
  }

  function syncWorldStartButton(canLaunch) {
    if (!els.worldStartBtn) return;
    const locked = !worldIsUnlocked(carouselWorld().id);
    const ready = canLaunch && !locked && !menuSlimeIsBusy();
    els.worldStartBtn.disabled = !ready;
    els.worldStartBtn.classList.toggle('hungry', !ready);
    els.worldStartBtn.classList.toggle('ready', ready);
    const requiredLevel = EXPERIENCE.requiredLevelForWorldIndex(ACTIVE_WORLD_IDS.indexOf(carouselWorld().id));
    els.worldStartBtn.setAttribute('aria-label', locked ? `Шахта закрыта до уровня ${requiredLevel}` : ready ? 'Отправиться в шахту' : 'Сначала покормите слайма');
    if (els.worldStartText) els.worldStartText.textContent = 'ИГРАТЬ';
  }

  function renderDraft({ offerMotion = 'static', showLaunchCard = true } = {}) {
    recalcStats();
    updatePersistentUI();
    const full = stomachIsFull();
    const canLaunch = stomachCanLaunch();
    els.slimeStage?.classList.toggle('portal-ready', canLaunch);
    if (els.conveyorChoiceCount) {
      const eatenCount = stomachFoodCount();
      els.conveyorFoodSlots.forEach((slot,index)=>{
        const family=foodRecipeFamily(session.foods[index]);
        const color=FORM_INDEX.find(form=>form.id===(family==='ice'?'frost':family))?.color || '#79f2b5';
        slot.style.setProperty('--food-slot-color',color);
        const filled=index<eatenCount;
        if(filled && !slot.classList.contains('is-filled') && !menuReducedMotion)slot.animate?.([
          {transform:'scale(.75)'},{transform:'scale(1.16)',offset:.6},{transform:'scale(1)'}
        ],{duration:260,easing:'ease-out'});
        slot.classList.toggle('is-filled',filled);
      });
      els.conveyorChoiceCount.setAttribute('aria-label', `Съедено ${eatenCount} из ${STOMACH_CAPACITY}`);
      els.conveyorChoiceCount.classList.toggle('is-full', full);
    }

    const mealInProgress = ['eat', 'chewing', 'savoring'].some(name => els.slime.classList.contains(name));
    if (!mealInProgress) {
    }
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
    syncWorldStartButton(canLaunch);
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
      const foodMutationFx = conveyorMutationFxMarkup(recipeFamily);
      const cardLocked = !canAddToStomach(food);
      button.className = `conveyor-food-pick mutation-family-${recipeFamily} ${offerMotion === 'enter' ? 'awaiting-dispense' : 'food-ready'} ${cardLocked ? 'locked' : ''}`;
      button.dataset.foodId = food.id;
      button.dataset.offerIndex = String(index);
      button.innerHTML = `<span class="conveyor-plate" aria-hidden="true"></span><span class="synthesis-floor-light" aria-hidden="true"></span><span class="synthesis-birth-blob" aria-hidden="true"></span><span class="synthesis-food-visual"><span class="food-ground-shadow" aria-hidden="true"></span>${foodMutationFx}<span class="food-model-wrap">${foodArtMarkup(food)}</span></span>`;
      button.type = 'button';
      button.setAttribute('aria-label', `${food.name}. Нажми или перетащи к слайму`);
      button.addEventListener('pointerdown', event => beginFoodDrag(event, food, index, button));
      els.foodChoices.appendChild(button);
    });
    window.SlimeFoodGrounding.schedule();
    const rerollBlocked = session.rerollPending || session.offerTransition || adInFlight;
    const readyToStart = conveyorCanStart();
    els.rerollBtn.classList.toggle('confirm-mode', readyToStart);
    els.rerollBtn.setAttribute('aria-label', readyToStart ? 'Выбор готов. Начать падение' : 'Обновить еду на конвейере');
    if (readyToStart) {
      if (els.rerollTitle) els.rerollTitle.textContent = 'ВЫБОР ГОТОВ';
      if (els.rerollText) els.rerollText.textContent = `${stomachFoodCount()} ИЗ ${STOMACH_CAPACITY} СЪЕДЕНО`;
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

  function chooseFood(offerIndex, source = null) {
    if (session.offerTransition || menuMutationReveal || formDiscoverySequence) return;
    const food = session.offer[offerIndex];
    if (!food) return;
    if (!canAddToStomach(food)) return;
    closeQuickMutationPicker();
    clearMenuSlimeInteraction();
    animateFoodToMouth(food, source);
    session.foods.push(food);
    session.offer[offerIndex] = null;
    const mealReaction = { catchMs: 220, chewMs: 420, chewTime: '.14s', chews: 3, happyMs: 380 };
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
          const revealDuration = revealMenuMutation();
          discoverCurrentForm({ delayMs: revealDuration });
          sound('happy');
          if (save.tutorialStep === 'feed') {
            setTutorialStep('feed-count');
            clearTimeout(tutorialCountTimer);
            tutorialCountTimer = setTimeout(() => {
              if (save.tutorialStep === 'feed-count') setTutorialStep(stomachCanLaunch() ? 'play' : 'feed');
            }, 1100);
          } else queueTutorialRender();
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
    void advanceConveyorAfterChoice(offerIndex, source);
  }

  async function advanceConveyorAfterChoice(chosenIndex, source) {
    if (!session || session.offerTransition) return;
    session.offerTransition = true;
    els.conveyor.classList.add('is-selecting');
    const chosenDispenser = els.conveyorDispensers?.querySelector(`[data-dispenser-index="${chosenIndex}"]`);
    chosenDispenser?.classList.add('is-recharging');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    await new Promise(resolve => setTimeout(resolve, reducedMotion ? 30 : 400));
    const family = activeMutationFamilies()[chosenIndex];
    const stage = session.foods.filter(food => foodRecipeFamily(food) === family).length + 1;
    const used = [...session.foods, ...session.offer.filter(Boolean)].map(food => food.id);
    session.offer[chosenIndex] = randomFood(used, family, stage);
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
  }

  async function beginRoomLaunch(options = {}) {
    if (menuLaunchInProgress) return;
    const endless = options?.endless === true;
    if (!stomachCanLaunch() || menuSlimeIsBusy() || (endless && !save.gameCompleted)) {
      startDrop({ endless });
      return;
    }

    menuLaunchInProgress = true;
    ensureWorldSprites(currentWorld().id);
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
      'lastFrozenImpactAt', 'emotionUntil', 'damageInvulnerableUntil', 'bounceGraceUntil',
      'breakImpactAt', 'breakImpactUntil',
      'lastTrailSampleAt', 'lastUiUpdateAt', 'gravitySwitchFlashUntil',
      'hurtSlowUntil', 'lastHeartLossAt', 'jellyEnteredAt', 'lastJellyBubbleAt', 'freezeZoneEnteredAt',
      'mechExitZoneGraceUntil',
      'tutorialSlowUntil',
      'elementalAbilityUntil', 'elementalAbilityNextTickAt', 'goldRushUntil', 'launchEntryStartedAt', 'launchEntryUntil',
      'cosmosCometStartedAt', 'cosmosCometIgnitedAt', 'cosmosCometFadeUntil'
    ];
    for (const key of timestampKeys) if (run[key] > 0) run[key] += delta;
    if (run.ultimateIntro) run.ultimateIntro.startedAt += delta;
    if (run.phoenixUltimate) run.phoenixUltimate.startedAt += delta;
    if (run.cosmosUltimate) {
      for (const key of ['startedAt', 'chargeUntil', 'fadeStartedAt', 'launchUntil', 'fadeUntil', 'lastSampleAt', 'ignitedAt']) {
        if (run.cosmosUltimate[key] > 0) run.cosmosUltimate[key] += delta;
      }
      for (const sample of run.cosmosUltimate.trail) sample.at += delta;
    }
    for (const wave of run.phoenixWaves || []) wave.startedAt += delta;
    if (run.electricStorm) {
      run.electricStorm.startedAt += delta;
      run.electricStorm.nextStrikeAt += delta;
      if (run.electricStorm.flashUntil > 0) run.electricStorm.flashUntil += delta;
      if (run.electricStorm.endedAt > 0) run.electricStorm.endedAt += delta;
    }
    for (const bolt of run.electricStormBolts || []) { bolt.startedAt += delta; bolt.until += delta; }
    for (const hit of run.electricStormHits || []) hit.at += delta;
    for (const key of ['phantomNextAt', 'phantomEnteredAt', 'phantomEnterUntil', 'phantomUntil', 'glitchNextInfectionAt', 'glitchNextNeutralizeAt']) if (run[key] > 0) run[key] += delta;
    if (run.glitchClone) for (const key of ['startedAt', 'until', 'lastHitAt', 'lastUpdateAt']) if (run.glitchClone[key] > 0) run.glitchClone[key] += delta;
    if (run.glitchShock) run.glitchShock.startedAt += delta;
    if (run.glitchDeleteQueue) for (const item of run.glitchDeleteQueue) item.at += delta;
    if (run.glitchSpreadQueue) for (const item of run.glitchSpreadQueue) item.at += delta;
    if (run.glitchChange) run.glitchChange.at += delta;
    for (const block of run.blocks || []) for (const key of ['glitchDeleteAt', 'glitchRewriteUntil', 'glitchTransformUntil', 'glitchFlashUntil', 'glitchDisperseUntil']) {
      if (block[key] > 0) block[key] += delta;
    }
    for (const flask of run.flasks || []) if (flask.collectAfter > 0) flask.collectAfter += delta;
    if (run.nanoNextShotAt) run.nanoNextShotAt = run.nanoNextShotAt.map(value => value > 0 ? value + delta : value);
    if (run.nanoShots) for (const shot of run.nanoShots) shot.startedAt += delta;
    if (run.nanoNextMineAt > 0) run.nanoNextMineAt += delta;
    if (run.nanoEyeOpenedAt > 0) run.nanoEyeOpenedAt += delta;
    if (run.nanoMine) { run.nanoMine.markedAt += delta; run.nanoMine.launchedAt += delta; }
    for (const mine of run.shieldMines || []) { mine.markedAt += delta; mine.launchedAt += delta; }
    if (run.shieldPop) run.shieldPop.at += delta;
    if (run.barrierStartedAt > 0) run.barrierStartedAt += delta;
    if (run.mechSuit) for (const key of ['startedAt', 'landAt', 'expireAt', 'nextShotAt', 'lastShotAt']) if (run.mechSuit[key] > 0) run.mechSuit[key] += delta;
    if (run.mechExplosion) run.mechExplosion.startedAt += delta;
    if (run.telekinesisNextAt > 0) run.telekinesisNextAt += delta;
    if (run.telekinesisCycle) run.telekinesisCycle.startedAt += delta;
    if (run.telekinesisPress) run.telekinesisPress.startedAt += delta;
    if (run.telekinesisMarks) for (const mark of run.telekinesisMarks) mark.startedAt += delta;
    if (run.telekinesisBursts) for (const burst of run.telekinesisBursts) burst.startedAt += delta;
    if (run.phantomBursts) for (const burst of run.phantomBursts) burst.startedAt += delta;
    if (run.cloneUltimate) run.cloneUltimate.startedAt += delta;
    if (run.nextSporeAt > 0) run.nextSporeAt += delta;
    for (const projectile of run.sporeProjectiles || []) { projectile.launchedAt += delta; projectile.landsAt += delta; }
    for (const pod of run.sporePods || []) {
      pod.plantedAt += delta;
      pod.expiresAt += delta;
      if (pod.autoDetonateAt > 0) pod.autoDetonateAt += delta;
    }
    if (run.frostStorm) {
      run.frostStorm.startedAt += delta;
      run.frostStorm.endAt += delta;
      run.frostStorm.nextFlakeAt += delta;
      for (const flake of run.frostStorm.flakes) flake.startedAt += delta;
    }
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
      for (const key of ['fireIgnitedAt', 'fireDamageAt', 'fireFlashUntil', 'electricFlashStartedAt', 'electricFlashUntil', 'frostFlashUntil', 'frostTransformStartedAt', 'frostReservedUntil', 'goldFlashUntil', 'snowballGhostUntil']) {
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
    queueTutorialRender();
  }

  function openRunMenu() {
    if (save.tutorialStep !== 'controls' || !run?.paused) {
      if (!pauseRun()) return;
    }
    stopAllSounds();
    updateRunSoundControl();
    els.runMenuOverlay.classList.remove('hidden');
    els.endRunBtn.setAttribute('aria-expanded', 'true');
    syncInteractionLayers();
    queueTutorialRender();
    requestAnimationFrame(() => els.runMenuOverlay.querySelector('.run-menu-modal')?.focus());
  }

  function continueRunFromMenu() {
    hideRunMenu();
    sound('tap');
    if (save.tutorialStep !== 'controls') resumeRun();
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
    persist();
    startDrop({ endless });
  }

  function finishRunFromMenu() {
    if (!run || run.ended) return;
    hideRunMenu();
    finishRunEarly();
  }

  function startDrop(options = {}) {
    const endless = options?.endless === true;
    const fromPortal = options?.fromPortal === true;
    GAME_BALANCE = window.SlimeBalance?.load?.() || GAME_BALANCE;
    if (!stomachCanLaunch()) {
      showToast('Сначала дай слайму одну еду');
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
    if(save.unseenWorlds?.includes(baseWorld.id)){
      save.unseenWorlds=save.unseenWorlds.filter(id=>id!==baseWorld.id);
      persist({captureDraft:false,refreshUI:false});
    }
    ensureWorldSprites(baseWorld.id);
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
    const rowCount = world.id === 1 ? window.SlimeWorld1Descent.ROWS : 140;
    const finishY = 285 + rowCount * cellSize + cellSize * 1.5;
    const gridOffsetX = 0;
    const categoryVisuals = menuCategoryLevels();
    const elementalAbilityType = FORM_INDEX.map(form => form.id).find(key => categoryVisuals[key] >= 3) || '';
    const slimeRadius = massRadiusForLevel(categoryVisuals.mass, cellSize);
    const startLane = fromPortal
      ? Math.floor(columns / 2)
      : columns % 2
        ? Math.floor(columns / 2)
        : Math.floor(columns / 2) - (Math.random() < .5 ? 1 : 0);
    const startX = gridOffsetX + startLane * cellSize + cellSize / 2;
    const launchEntryStartedAt = performance.now();
    hideGlitchChoice();
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
      rowCount,
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
      blocks: [], flasks: [], honeyZones: [], jellyZones: [], freezeZones: [], particles: [], trails: [], specialEffects: [],
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
      nanoNextShotAt: [launchEntryStartedAt + 2000],
      nanoShots: [],
      nanoNextMineAt: launchEntryStartedAt + 5000,
      nanoEyeOpenedAt: 0,
      nanoMine: null,
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
      phantomNextAt: launchEntryStartedAt + PHANTOM_COOLDOWN_MS,
      phantomWarned: false,
      phantomEnteredAt: 0,
      phantomEnterUntil: 0,
      phantomUntil: 0,
      phantomMarkedBlocks: new Set(),
      phantomBursts: [],
      glitchNextInfectionAt: launchEntryStartedAt + 4500,
      glitchNextNeutralizeAt: launchEntryStartedAt + 8500,
      glitchInfectedBlocks: new Set(),
      glitchShock: null,
      glitchChoice: null,
      glitchClone: null,
      glitchDeleteQueue: [],
      glitchSpreadQueue: [],
      glitchChange: null,
      miniSlimes: [],
      sporeProjectiles: [],
      sporePods: [],
      sporeBursts: [],
      nextSporeAt: 0,
      cloneUltimate: null,
      elementalAbilityType,
      elementalAbilityCharges: 0,
      ultimateCharge: 0,
      ultimateRechargePending: '',
      elementalAbilityActive: '',
      elementalAbilityUntil: 0,
      elementalAbilityNextTickAt: 0,
      elementalAuraId: 0,
      ultimateIntro: null,
      phoenixUltimate: null,
      phoenixWaves: [],
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
      cosmosAscentDistance: 0,
      cosmosReverseReady: false,
      cosmosBoostBlocksLeft: 0,
      cosmosFallDistance: 0,
      cosmosCometCharge: 0,
      cosmosCometStartedAt: 0,
      cosmosCometIgnitedAt: 0,
      cosmosCometFadeUntil: 0,
      cosmosUltimate: null,
      steer: {
        keyLeft: false, keyRight: false, keyUp: false, keyDown: false,
        touchX: 0, touchY: 0, touchRawY: 0, touchDown: 0, pointerId: null,
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
      effects: { ...session.effects, gravitySwitch: session.effects.gravitySwitch || categoryVisuals.cosmos >= 1 },
      blocksBrokenForHeal: 0,
      shieldCharges: 0,
      maxShieldCharges: 1,
      coins: 0,
      researchData: 0,
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
    run.flasks = generateFlasks(run);
    run.honeyZones = generateHoneyZones(run);
    run.jellyZones = generateJellyZones(run);
    run.freezeZones = generateFreezeZones(run);
    prepareCanvas();
    showScreen('drop');
    els.runExperienceHud?.classList.remove('is-hit', 'is-tier-up');
    if (els.runExperienceHud) els.runExperienceHud.dataset.stage = '0';
    clearRunImpactFeedback();
    updateRunUI();
    yandexPlatform?.gameplay.start();
    run.animationId = requestAnimationFrame(gameFrame);
    if (save.tutorialStep === 'play') {
      setTutorialStep('run-wait');
      clearTimeout(tutorialRunTimer);
      tutorialRunTimer = setTimeout(showTutorialControls, 3000);
    }
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
    if ('123cigd'.includes(token)) return { ...weak, dead: true, flaskTier: Number(({ c: 1, i: 2, g: 3, d: 3 })[token] || token) };
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

  function generateFirstWorldDescent(runState) {
    const layout = window.SlimeWorld1Descent.build({ columns: runState.columns });
    const blocks = [];
    const movingHazards = [];
    const cell = runState.cellSize;
    const originY = 285;
    for (let row = 0; row < layout.rows; row += 1) {
      for (let col = 0; col < runState.columns; col += 1) {
        const planned = layout.cells[row][col];
        const x = runState.gridOffsetX + col * cell;
        const y = originY + row * cell;
        const maxHp = planned.hazard || planned.special ? 1
          : blockHpForTier(planned.tier, runState.world, row / layout.rows, row, col, planned.path);
        const block = {
          id: blocks.length, row, col, x, y, w: cell, h: cell,
          hp: maxHp, maxHp, tier: planned.tier, special: planned.special,
          material: planned.hazard ? 'hazard'
            : row === 0 ? 'grass'
              : chooseMaterial(runState.world, row / layout.rows, planned.special, planned.tier),
          dead: planned.dead, path: planned.path, segment: 'descent',
          hazard: planned.hazard, unbreakable: planned.hazard,
          hazardVariant: null, frozen: false, visualId: '', environmentRemoved: '',
          flaskTier: planned.flaskTier, topGrass: row === 0, coins: 0
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
            period: planned.motion.period
          };
          movingHazards.push(block);
        }
        blocks.push(block);
      }
    }
    runState.movingHazards = movingHazards;
    return blocks;
  }

  function updateMovingHazards(timestamp) {
    for (const block of run?.movingHazards || []) {
      if (block.dead) continue;
      const motion = block.motion;
      const position = motion.min + (motion.max - motion.min)
        * (.5 - .5 * Math.cos(timestamp * Math.PI * 2 / motion.period + motion.phase));
      if (motion.axis === 'x') block.x = position;
      else block.y = position;
    }
  }

  function generateBlockField(runState) {
    if (runState.worldId === 1) return generateFirstWorldDescent(runState);
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
    if (runState.worldId === 1) return [];
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
      image.src = versionedAsset(`assets/collectibles/flasks/world-${key}.webp`);
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
      impact(`${flask.glitch ? 'ГЛИТЧ-КОЛБА' : 'КОЛБА'} +${flask.value}`);
      sound('coin');
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

  function generateJellyZones() {
    // Jelly pockets were exclusive to the former first-world section plans.
    return [];
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
    updateMovingHazards(timestamp);
    if (run.ultimateIntro) {
      const intro = run.ultimateIntro;
      if (timestamp - intro.startedAt < ULTIMATE_INTRO_MS) {
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
    if (!run.lastTime) run.lastTime = timestamp;
    const dt = Math.min(.034, (timestamp - run.lastTime) / 1000);
    run.lastTime = timestamp;
    const pressSlow = run.telekinesisPress && timestamp - run.telekinesisPress.startedAt < TELEKINESIS_PRESS_COLLIDE_MS ? .24 : 1;
    const simulationScale = (timestamp < (run.hurtSlowUntil || 0) ? .58 : 1)
      * (timestamp < (run.tutorialSlowUntil || 0) ? .2 : 1) * cloningTimeScale(timestamp) * pressSlow;
    const simulationDt = dt * simulationScale;

    const speed = Math.hypot(run.slime.vx, run.slime.vy);
    // Fast launches and low-FPS frames must never move the slime far enough
    // to skip a block between two collision checks.
    const safeTravel = Math.max(5, Math.min(run.slime.radius * .24, run.cellSize * .14));
    const substeps = clamp(Math.ceil(speed * simulationDt / safeTravel), 1, 12);
    if (simulationDt > 0) for (let i = 0; i < substeps; i += 1) updatePhysics(simulationDt / substeps, timestamp);
    updateElementalEffects(timestamp);
    updateGlitchEffects(timestamp);
    updateMiniSlimes(simulationDt, timestamp);
    updateMeteorShowers(timestamp);
    updateSlimeTrail(simulationDt, timestamp);
    updateParticles(simulationDt);
    updateSpecialEffects(simulationDt);
    const paintStartedAt = performance.now();
    renderCanvas(timestamp);
    trackGraphicsCost(performance.now() - paintStartedAt);
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
    return elementalLevel('phantom') >= 1 && run.phantomEnterUntil <= timestamp && run.phantomUntil > timestamp;
  }

  function phantomCanMark(block) {
    return Boolean(block && !block.dead && !block.special && !block.hazard && !block.unbreakable);
  }

  function markPhantomBlocks(timestamp) {
    if (elementalLevel('phantom') < 2) return;
    const slime = run.slime;
    for (const block of blocksNearY(slime.y, slime.radius)) {
      if (!phantomCanMark(block) || block.phantomMarked) continue;
      if (!circleRectCollision(slime, block, slime.radius * .88)) continue;
      block.phantomMarked = true;
      block.phantomMarkedAt = timestamp;
      run.phantomMarkedBlocks.add(block);
    }
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
        slime.x = x;
        slime.y = y;
        slime.vx *= .35;
        slime.vy = Math.min(slime.vy, 75);
        run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, timestamp + 450);
        return;
      }
    }
    run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, timestamp + 700);
  }

  function materializePhantom(timestamp) {
    run.phantomUntil = 0;
    run.phantomEnterUntil = 0;
    if (!speedDrillActive(timestamp) && !jellyZoneForSlime(run.slime)) run.steer.touchY = 0;
    const slime = run.slime;
    const row = Math.floor((slime.y - run.blockRowOrigin) / run.cellSize);
    const col = Math.floor((slime.x - run.gridOffsetX) / run.cellSize);
    for (const block of run.phantomMarkedBlocks) {
      block.phantomMarked = false;
      if (phantomCanMark(block)) damageBlockByElement(block, 1, 'phantom', timestamp);
    }
    run.phantomMarkedBlocks.clear();
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      const nearby = run.blocksByRow?.get(row + rowOffset);
      if (!nearby) continue;
      for (const block of nearby) {
        if (!phantomCanMark(block) || Math.abs(block.col - col) > 1) continue;
        if (rowOffset === 0 && block.col === col) destroyBlock(block, 'phantom', timestamp);
        else damageBlockByElement(block, 1, 'phantom', timestamp);
      }
    }
    movePhantomOutOfDanger(timestamp);
    run.phantomBursts.push({ x: slime.x, y: slime.y, startedAt: timestamp });
    run.shake = Math.max(run.shake, 4);
    run.emotion = 'power';
    run.emotionUntil = timestamp + 360;
    sound('epic');
    feedback([8, 12, 8]);
  }

  function updatePhantomCycle(timestamp) {
    if (elementalLevel('phantom') < 1) return false;
    if (run.phantomUntil > 0) {
      if (timestamp < run.phantomUntil) return timestamp >= run.phantomEnterUntil;
      materializePhantom(timestamp);
      return false;
    }
    if (timestamp < run.phantomNextAt) {
      if (!run.phantomWarned && run.phantomNextAt - timestamp <= PHANTOM_WARNING_MS) {
        run.phantomWarned = true;
        sound('tap');
        feedback(3);
      }
      return false;
    }
    run.phantomWarned = false;
    run.phantomEnteredAt = timestamp;
    run.phantomEnterUntil = timestamp + PHANTOM_ENTER_MS;
    run.phantomUntil = run.phantomEnterUntil + PHANTOM_DURATION_MS;
    run.phantomNextAt = timestamp + PHANTOM_COOLDOWN_MS;
    run.steer.touchY = run.steer.touchRawY || 0;
    run.wallPushSide = 0;
    run.bounceControlLockUntil = 0;
    run.bounceControlRestoreUntil = 0;
    run.slime.vy = clamp(run.slime.vy, -120, 135);
    run.emotion = 'surprised';
    run.emotionUntil = timestamp + 420;
    sound('tap');
    return false;
  }

  const GLITCH_BUGS = Object.freeze([
    { id: 'copy', name: 'КОПИРОВАНИЕ' },
    { id: 'delete', name: 'УДАЛЕНИЕ' },
    { id: 'infect', name: 'ЗАРАЖЕНИЕ' },
    { id: 'change', name: 'ИЗМЕНЕНИЕ' }
  ]);

  function glitchEligibleBlock(block) {
    return Boolean(block && !block.dead && !block.special && !block.hazard && !block.unbreakable);
  }

  function glitchFutureBlocks(predicate, rows = 8) {
    const firstUnseenRow = Math.ceil((run.cameraY + VIEW_H - run.blockRowOrigin) / run.cellSize) + 1;
    return run.blocks.filter(block => block.row >= firstUnseenRow && block.row < firstUnseenRow + rows && predicate(block));
  }

  function infectGlitchGroup(blocks, timestamp) {
    const chosen = blocks.filter(block => glitchEligibleBlock(block) && !block.glitchInfected);
    if (!chosen.length) return 0;
    for (const block of chosen) {
      block.glitchInfected = true;
      block.glitchInfectedAt = timestamp;
      block.glitchFlashUntil = timestamp + 620;
      run.glitchInfectedBlocks.add(block);
    }
    return chosen.length;
  }

  function infectGlitchAhead(timestamp, count = 3 + Math.floor(Math.random() * 3)) {
    const choices = glitchFutureBlocks(block => glitchEligibleBlock(block) && !block.glitchInfected, 7)
      .sort(() => Math.random() - .5);
    return infectGlitchGroup(choices.slice(0, count), timestamp);
  }

  function shareGlitchHit(block, amount, timestamp, effect = '') {
    if (!block?.glitchInfected || (amount <= 0 && !effect)) return;
    const infectedBlocks = [...run.glitchInfectedBlocks];
    const linkedBlocks = infectedBlocks.filter(glitchEligibleBlock);
    // Clear the whole network before applying an echo; chained abilities cannot retrigger it.
    run.glitchInfectedBlocks.clear();
    for (const linked of infectedBlocks) {
      linked.glitchInfected = false;
      linked.glitchDisperseUntil = timestamp + 420;
      linked.glitchFlashUntil = timestamp + 450;
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

  function neutralizeGlitchHazard(timestamp) {
    const choices = glitchFutureBlocks(block => !block.dead && block.hazard && !block.glitchNeutralized, 10)
      .sort((a, b) => a.row - b.row);
    const target = choices[Math.floor(Math.random() * Math.min(5, choices.length))];
    if (!target) return false;
    target.glitchNeutralized = true;
    target.glitchInfectedAt = timestamp;
    return true;
  }

  function transformGlitchHazard(block, collision, timestamp) {
    const s = run.slime;
    s.x += collision.nx * (collision.penetration + 7);
    s.y += collision.ny * (collision.penetration + 7);
    applyBlockBounce(s, collision, { hazard: false, timestamp });
    block.glitchNeutralized = false;
    if (run.worldId === 1) {
      // A glitch can let the slime pass one spike safely, but cannot erase it.
      block.glitchTransformUntil = timestamp + 900;
      return true;
    }
    block.hazard = false;
    block.unbreakable = false;
    block.hazardVariant = null;
    block.visualId = '';
    block.glitchTransformUntil = timestamp + 900;
    if (Math.random() < .2) {
      block.dead = true;
      run.flasks.push({
        id: `glitch-flask-${block.id}-${timestamp}`,
        worldId: run.worldId, tier: 3, value: 15, glitch: true,
        x: block.x + block.w / 2, y: block.y + block.h / 2,
        phase: block.id * .37, collected: false, collectAfter: timestamp + 450
      });
      impact('ГЛИТЧ-КОЛБА · +15');
    } else {
      const rewards = ['gel', 'spring', 'cryo', 'meteor', 'geyser'];
      block.special = rewards[Math.floor(Math.random() * rewards.length)];
      block.tier = 'special';
      block.material = block.special;
      block.maxHp = block.hp = 1;
      impact('ОПАСНОСТЬ ИСПРАВЛЕНА');
    }
    run.shake = Math.max(run.shake, 4);
    sound('epic');
    feedback([7, 11, 7]);
    return true;
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

  function rewriteGlitchSection(timestamp) {
    const rewrite = run.glitchChange;
    if (!rewrite) return;
    run.glitchChange = null;
    const { startRow } = rewrite;
    const endRow = startRow + 10;
    const cells = run.blocks.filter(block => block.row >= startRow && block.row < endRow);
    if (!cells.length) return;
    const topY = run.blockRowOrigin + startRow * run.cellSize;
    const bottomY = run.blockRowOrigin + endRow * run.cellSize;
    run.flasks = run.flasks.filter(flask => flask.y < topY || flask.y >= bottomY);
    const changedCells = new Set(cells);
    run.sporePods = (run.sporePods || []).filter(pod => !changedCells.has(pod.block));
    const middleCol = Math.floor(run.columns / 2);
    const bonusFlaskCells = new Set([
      `${startRow + 2}:${Math.max(1, middleCol - 1)}`,
      `${startRow + 4}:${middleCol}`,
      `${startRow + 6}:${Math.min(run.columns - 2, middleCol + 1)}`,
      `${startRow + 8}:${middleCol}`
    ]);
    for (const block of cells) {
      if (run.worldId === 1 && block.hazard) continue;
      run.glitchInfectedBlocks.delete(block);
      block.glitchInfected = false;
      block.glitchNeutralized = false;
      block.hazard = false;
      block.unbreakable = false;
      block.hazardVariant = null;
      block.special = null;
      block.visualId = '';
      block.flaskTier = 0;
      block.flaskValue = 0;
      block.flaskGranted = false;
      block.topGrass = false;
      block.frozen = false;
      block.frozenOre = false;
      block.elementalSnow = false;
      block.elementalSnowflake = false;
      block.elementalGolden = false;
      block.fireDamageAt = 0;
      block.fireUltimateAuraId = 0;
      block.sporePod = null;
      block.glitchRewriteUntil = timestamp + 950;
      const bonusFlask = bonusFlaskCells.has(`${block.row}:${block.col}`);
      const smallFlask = !bonusFlask && block.col > 0 && block.col < run.columns - 1
        && Math.random() < .08;
      if (bonusFlask || smallFlask) {
        const value = bonusFlask ? 2 : 1;
        if (run.worldId === 1) {
          block.dead = false;
          block.tier = 'dense';
          block.material = chooseMaterial(run.world, .15, null, block.tier);
          block.maxHp = block.hp = 1;
          block.path = true;
          block.flaskTier = 1;
          block.flaskValue = value;
        } else {
          block.dead = true;
          run.flasks.push({ id: `rewrite-flask-${block.id}-${timestamp}`, worldId: run.worldId,
            tier: 1, value, x: block.x + block.w / 2, y: block.y + block.h / 2,
            phase: (block.row * run.columns + block.col) * .41, collected: false, glitch: true });
        }
      } else {
        block.dead = false;
        block.tier = run.worldId === 1 ? 'dense' : 'soft';
        block.material = chooseMaterial(run.world, .15, null, block.tier);
        block.maxHp = block.hp = 1;
        block.path = true;
      }
    }
    impact('ПЛАСТ ПЕРЕПИСАН');
    run.shake = Math.max(run.shake, 5);
  }

  function executeGlitchBug(kind, timestamp) {
    if (kind === 'copy') {
      const side = run.slime.x < VIEW_W / 2 ? 1 : -1;
      run.glitchClone = { x: clamp(run.slime.x + side * (run.slime.radius * 2 + 5), run.slime.radius, VIEW_W - run.slime.radius),
        y: run.slime.y, vx: run.slime.vx, vy: run.slime.vy, radius: run.slime.radius,
        wobble: run.slime.wobble, side, startedAt: timestamp, until: timestamp + GLITCH_CLONE_MS,
        lastHitAt: 0, lastUpdateAt: timestamp, hitCooldowns: new Map() };
    } else if (kind === 'delete') {
      const centerRow = Math.floor((run.slime.y - run.blockRowOrigin) / run.cellSize);
      const targets = run.blocks.filter(block => glitchEligibleBlock(block)
        && block.row >= centerRow + 1 && block.row <= centerRow + 7)
        .sort(() => Math.random() - .5).slice(0, 18);
      targets.forEach((block, index) => {
        block.glitchDeleteAt = timestamp + 180 + index * 72;
        run.glitchDeleteQueue.push({ block, at: block.glitchDeleteAt });
      });
    } else if (kind === 'infect') {
      const centerRow = Math.floor((run.slime.y - run.blockRowOrigin) / run.cellSize);
      const targets = run.blocks.filter(block => glitchEligibleBlock(block) && !block.glitchInfected
        && block.row >= centerRow && block.row <= centerRow + 8)
        .sort(() => Math.random() - .5).slice(0, 16);
      for (let index = 0; index < targets.length; index += 4) {
        run.glitchSpreadQueue.push({ blocks: targets.slice(index, index + 4), at: timestamp + index * 48 });
      }
    } else if (kind === 'change') {
      const lastRow = Math.max(0, run.blocks.at(-1)?.row || 0);
      const startRow = Math.max(2, Math.min(lastRow - 9,
        Math.floor((run.slime.y - run.blockRowOrigin) / run.cellSize) + 4));
      if (startRow > 1 && lastRow - startRow >= 9) {
        run.glitchChange = { startRow, at: timestamp + 350 };
        for (const block of run.blocksByRow?.get(startRow) || []) block.glitchRewriteUntil = timestamp + 1250;
      }
    }
  }

  function updateGlitchClone(timestamp) {
    const clone = run.glitchClone;
    if (!clone) return;
    if (timestamp >= clone.until) { run.glitchClone = null; return; }
    const dt = clamp((timestamp - clone.lastUpdateAt) / 1000, 0, .045);
    clone.lastUpdateAt = timestamp;
    if (!dt) return;
    const steering = fallSteeringVector();
    const gravity = (BALANCE.gravityBase + run.worldId * BALANCE.gravityPerWorld) * (run.effects.gravitySwitch ? Math.sign(run.gravityDirection || 1) : 1);
    const mobilityLevel = elementalLevel('mobility');
    const targetVx = steering.x * ([200, 228, 248, 248][mobilityLevel] || 200);
    const reversing = Math.abs(steering.x) > .01 && Math.abs(clone.vx) > 10 && Math.sign(clone.vx) !== Math.sign(steering.x);
    clone.vx = lerp(clone.vx, targetVx, 1 - Math.exp(-(reversing ? 11 : steering.x ? 5.4 : 7.2) * dt));
    clone.vy = clamp(clone.vy + gravity * dt + steering.down * (mobilityLevel ? 300 : 235) * dt,
      -normalFallSpeedLimit(), normalFallSpeedLimit());
    clone.x = clamp(clone.x + clone.vx * dt, clone.radius, VIEW_W - clone.radius);
    clone.y += clone.vy * dt;
    clone.wobble += dt * (4 + Math.abs(clone.vy) / 180);
    if (clone.x <= clone.radius || clone.x >= VIEW_W - clone.radius) clone.vx *= -.25;
    for (const block of blocksNearY(clone.y, clone.radius)) {
      if (block.dead || !circleRectCollision(clone, block, clone.radius)) continue;
      const collision = circleRectCollision(clone, block, clone.radius);
      if (!collision || timestamp - (clone.hitCooldowns.get(block.id) || 0) < 115) continue;
      clone.hitCooldowns.set(block.id, timestamp);
      clone.x += collision.nx * (collision.penetration + 1);
      clone.y += collision.ny * (collision.penetration + 1);
      applyBlockBounce(clone, collision, { hazard: block.hazard || block.unbreakable, timestamp, isolated: true });
      if (!glitchEligibleBlock(block)) continue;
      if (!block.glitchInfected) {
        const neighbors = blocksNearY(block.y, run.cellSize)
          .filter(item => glitchEligibleBlock(item) && !item.glitchInfected
            && Math.abs(item.row - block.row) <= 1 && Math.abs(item.col - block.col) <= 1);
        infectGlitchGroup([block, ...neighbors.slice(0, 2)], timestamp);
      }
      damageBlockByElement(block, 1, 'glitchClone', timestamp);
      break;
    }
  }

  function updateGlitchEffects(timestamp) {
    if (!run || run.ended || run.portalEntry) return;
    const level = elementalLevel('glitch');
    if (level >= 1 && timestamp >= run.glitchNextInfectionAt) {
      const infected = infectGlitchAhead(timestamp);
      run.glitchNextInfectionAt = timestamp + (infected ? GLITCH_INFECTION_INTERVAL_MS : 1800);
    }
    if (level >= 2 && timestamp >= run.glitchNextNeutralizeAt) {
      const neutralized = neutralizeGlitchHazard(timestamp);
      run.glitchNextNeutralizeAt = timestamp + (neutralized ? GLITCH_NEUTRALIZE_INTERVAL_MS : 1800);
    }
    for (const item of run.glitchSpreadQueue) {
      if (timestamp >= item.at) infectGlitchGroup(item.blocks, timestamp);
    }
    run.glitchSpreadQueue = run.glitchSpreadQueue.filter(item => timestamp < item.at);
    for (const item of run.glitchDeleteQueue) {
      if (timestamp >= item.at && glitchEligibleBlock(item.block)) destroyBlock(item.block, 'glitchDelete', timestamp);
    }
    run.glitchDeleteQueue = run.glitchDeleteQueue.filter(item => timestamp < item.at);
    if (run.glitchChange && timestamp >= run.glitchChange.at) rewriteGlitchSection(timestamp);
    updateGlitchClone(timestamp);
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
    if (run.mechSuit?.phase === 'descending') {
      s.vx = 0;
      s.vy = 0;
      if (timestamp < run.mechSuit.landAt) return;
      run.mechSuit.phase = 'active';
      s.radius = run.cellSize * MECH_HIT_RADIUS_CELLS;
      const mechWallRadius = run.cellSize * MECH_VISUAL_CELLS * .49;
      s.x = clamp(s.x, mechWallRadius, VIEW_W - mechWallRadius);
      s.y = Math.max(s.y, run.cellSize * MECH_VISUAL_CELLS * .49 + 4);
      run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, timestamp + 400);
      run.shake = Math.max(run.shake, 5);
      sound('epic');
      feedback([12, 18, 10]);
    }
    if (updateCosmosUltimateMotion(dt, timestamp)) return;
    const ghost = updatePhantomCycle(timestamp);
    const drillActive = !ghost && !mechSuitActive() && speedDrillActive(timestamp);
    const frozen = !ghost && !drillActive && !mechSuitActive() && isSlimeFrozen(timestamp);
    updateSpeedPassive(dt, timestamp);
    const gravityDirection = run.effects.gravitySwitch ? Math.sign(run.gravityDirection || 1) : 1;
    const honeyAtStart = mechSlowZoneImmune(timestamp) ? null : honeyZoneForSlime(s);
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
          : normalFallSpeedLimit();
    const speedPressure = elementalLevel('mobility') >= 1 ? run.speedPressure || 0 : 0;
      const terminalSpeed = baseTerminalSpeed * (1 + speedPressure * .5) * (mechSuitActive() ? .9 : 1);
    if (ghost) {
      const steering = fallSteeringVector();
      s.vx = lerp(s.vx, steering.x * 145, 1 - Math.exp(-5.2 * dt));
      s.vy = clamp(s.vy + (worldGravity * .16 + steering.y * 360) * dt, -155, 205);
      if (Math.abs(steering.y) < .08) s.vy = lerp(s.vy, 42, 1 - Math.exp(-.35 * dt));
    } else if (drillActive) applySpeedDrillSteering(s, dt);
    else if (mechSuitActive()) {
      s.vy = clamp(s.vy + worldGravity * dt, -80, terminalSpeed);
      applyMechSteering(s, dt, timestamp, terminalSpeed);
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
      s.vy = clamp(s.vy + worldGravity * gravityDirection * dt, -terminalSpeed, terminalSpeed);
      applyFallSteering(s, dt, timestamp);
    }
    if (!mechSuitActive() && !ghost && !drillActive && honeyDrag && !frozen) {
      s.vx *= Math.pow(.32, dt);
      s.vy *= Math.pow(.085, dt);
    } else if (!mechSuitActive() && !ghost && !drillActive && freezeWaterDrag && !frozen) {
      s.vx *= Math.pow(.48, dt);
      s.vy = lerp(s.vy, 86, clamp(dt * 3.8, 0, 1));
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (!ghost) {
      updateCosmosCometEntry(previousY, timestamp);
      updateHoneyState(s, timestamp);
      updateJellyState(s, timestamp, previousX, previousY);
      updateFreezeZoneState(s, timestamp);
    }
    s.wobble += dt * (4 + Math.abs(s.vy) / 180);

    const wallRadius = mechSuitActive() ? run.cellSize * MECH_VISUAL_CELLS * .49 : s.radius;
    if (s.x - wallRadius < 0) {
      s.x = wallRadius;
      if (mechSuitActive()) s.vx = 0;
      else if (drillActive) s.vx = Math.max(0, s.vx);
      else {
        s.vx = clamp(Math.abs(s.vx) * .18, 30, 42);
        run.wallPushSide = -1;
        run.wallReleaseX = s.x + 10;
      }
    }
    if (s.x + wallRadius > VIEW_W) {
      s.x = VIEW_W - wallRadius;
      if (mechSuitActive()) s.vx = 0;
      else if (drillActive) s.vx = Math.min(0, s.vx);
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

    if (ghost) {
      markPhantomBlocks(timestamp);
    } else {
      const mechHull = mechSuitActive() ? mechCollisionHull(s) : null;
      const collisionReach = mechHull ? run.cellSize * MECH_VISUAL_CELLS * .5 : s.radius;
      const collisions = blocksNearY(s.y, collisionReach)
        .filter(block => !block.dead && timestamp >= (block.snowballGhostUntil || 0)
          && block.y + block.h > s.y - collisionReach - 3 && block.y < s.y + collisionReach + 3
          && block.x + block.w > s.x - collisionReach - 3 && block.x < s.x + collisionReach + 3)
        // Hazards use a slightly forgiving hit radius: near-misses should look
        // and feel like near-misses, especially under a thumb on mobile.
        .map(block => {
          const firstWorldHazard = block.hazard && run.worldId === 1;
          const inset = firstWorldHazard ? block.w * .08 : 0;
          const hitbox = firstWorldHazard
            ? { x: block.x + inset, y: block.y + inset, w: block.w - inset * 2, h: block.h - inset * 2 }
            : block;
          return { block, collision: mechHull
            ? mechRectCollision(mechHull, hitbox)
            : circleRectCollision(s, hitbox, block.hazard ? s.radius * .76 : s.radius) };
        })
        .filter(item => item.collision)
        .sort((a, b) => b.collision.penetration - a.collision.penetration);

      for (const item of collisions) {
        const { block, collision } = item;
        if (block.dead) continue;
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
    }

    updateFlasks(timestamp);

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
    const normalRadius = mechSuitActive() ? run.cellSize * MECH_HIT_RADIUS_CELLS : massRadius * healthScale;
    s.radius = lerp(s.radius, normalRadius, clamp(dt * 5.5, 0, 1));
    if (run.healthFlashTime > 0) run.healthFlashTime = Math.max(0, run.healthFlashTime - dt);

    const speedNow = Math.hypot(s.vx, s.vy);
    if (s.vy * gravityDirection < 185) resetMassPierce();
    if (!run.inJellyZoneId && speedNow < 34 && s.y > 180) run.lowMotionTime += dt;
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

  function cosmosBoostActive() {
    return Boolean(run && elementalLevel('cosmos') >= 2 && run.cosmosBoostBlocksLeft > 0);
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
    if (!ultimate || timestamp >= ultimate.fadeUntil) return false;
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
      slime.y += slime.vy * dt;
      breakCosmosUltimatePath(previousX, previousY, timestamp);
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
    run.visualHealth = run.health;
    return true;
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
    if (!run || run.cosmosUltimate || elementalLevel('cosmos') < 2) return;
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
    if (run.cosmosUltimate && timestamp < run.cosmosUltimate.launchUntil) return false;
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
      const breakResistance = timestamp < (run.breakImpactUntil || 0) ? run.breakImpactAccelerationScale : 1;
      const diveAcceleration = (mobilityLevel >= 1 ? 300 + pressure * 420 : 235) * breakResistance;
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

  // Outline sampled from the opaque edge of techno-mech-suit-v2.webp (512 × 476).
  // A small convex polygon follows the wide guns and tapered lower thrusters.
  const MECH_HULL_PROFILE = [
    [.5, .015], [.62, .07], [.76, .19], [.90, .31], [.975, .42],
    [.985, .70], [.97, .735], [.72, .855], [.5, .875],
    [.28, .855], [.03, .735], [.015, .70], [.025, .42],
    [.10, .31], [.24, .19], [.38, .07]
  ];

  function mechCollisionHull(slime) {
    const size = run.cellSize * MECH_VISUAL_CELLS;
    return MECH_HULL_PROFILE.map(([u, v]) => ({
      x: slime.x + (u - .5) * size,
      y: slime.y + (v - .5) * size
    }));
  }

  function mechRectCollision(hull, rect) {
    const centerX = rect.x + rect.w * .5;
    const centerY = rect.y + rect.h * .5;
    let best = Infinity;
    let bestX = 0;
    let bestY = 0;
    for (let index = -2; index < hull.length; index += 1) {
      let axisX = index === -2 ? 1 : index === -1 ? 0 : hull[(index + 1) % hull.length].y - hull[index].y;
      let axisY = index === -2 ? 0 : index === -1 ? 1 : hull[index].x - hull[(index + 1) % hull.length].x;
      const length = Math.hypot(axisX, axisY);
      if (length < .0001) continue;
      axisX /= length;
      axisY /= length;
      let min = Infinity;
      let max = -Infinity;
      for (const point of hull) {
        const value = point.x * axisX + point.y * axisY;
        min = Math.min(min, value);
        max = Math.max(max, value);
      }
      const rectProjection = centerX * axisX + centerY * axisY;
      const rectRadius = Math.abs(axisX) * rect.w * .5 + Math.abs(axisY) * rect.h * .5;
      const pushPositive = rectProjection + rectRadius - min;
      const pushNegative = max - (rectProjection - rectRadius);
      if (pushPositive <= 0 || pushNegative <= 0) return null;
      const penetration = Math.min(pushPositive, pushNegative);
      if (penetration < best) {
        best = penetration;
        const direction = pushPositive < pushNegative ? 1 : -1;
        bestX = axisX * direction;
        bestY = axisY * direction;
      }
    }
    return Number.isFinite(best) ? { nx: bestX, ny: bestY, penetration: best } : null;
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

  function applyBlockBounce(slime, collision, { hazard, timestamp, isolated = false, steeringEnabled = true }) {
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
      run.bounceControlLockUntil = timestamp + Math.max(24, 36 - lockReduction);
      run.bounceControlRestoreUntil = timestamp + Math.max(88, 120 - restoreReduction);
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
    const slime = run.slime;
    const mech = mechSuitActive() ? run.mechSuit : null;
    if (mech || (run.cosmosUltimate && timestamp < run.cosmosUltimate.fadeUntil)) {
      block.hp = 0;
      destroyBlock(block, mech ? 'mech' : 'cosmosUltimate', timestamp);
      sound('break');
      feedback(5);
      return false;
    }
    const centerX = block.x + block.w / 2;
    const centerY = block.y + block.h / 2;
    const persistentSpike = run.worldId === 1;
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
      if (run.ultimateRechargePending === 'shield') finishUltimateRecharge();
      impact('ЩИТ РАЗБИТ');
      sound('shieldPop');
      feedback([12, 20, 9]);
      updateRunUI();
      return true;
    }

    const healthBefore = run.health;
    run.health = Math.max(0, run.health - 1);
    run.lastLostHeartIndex = Math.max(0, healthBefore - 1);
    run.lastHeartLossAt = timestamp;
    run.hazardImpact={x:clamp(slime.x,block.x,block.x+block.w),y:clamp(slime.y,block.y,block.y+block.h)};
    run.shake = Math.max(run.shake, 7.5);
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

  function shieldDominant() {
    return window.DominantShield.dominant(run?.categoryVisuals);
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

  function applyDominantShieldReaction(source, timestamp) {
    const type = shieldDominant();
    const origin = blockCenter(source);
    const neighbors = nearbyGridBlocks(source, block => elementalDamageable(block) && !block.special);
    if (type === 'fire') {
      for (const block of neighbors) igniteBlock(block, timestamp);
    } else if (type === 'frost') {
      for (const block of neighbors) turnBlockToSnow(block, timestamp);
    } else if (type === 'glitch') {
      infectGlitchGroup(neighbors, timestamp);
    } else if (type === 'electric') {
      for (const side of [-1, 1]) {
        const targets = neighbors.filter(block => side * (blockCenter(block).x - origin.x) > 0)
          .sort((a, b) => Math.abs(a.row - source.row) - Math.abs(b.row - source.row)
            || Math.abs(a.col - source.col) - Math.abs(b.col - source.col));
        const target = targets[0];
        if (target) {
          const branch = targets.slice(0, 2);
          const points = [origin, ...branch.map(blockCenter)];
          for (const block of branch) damageBlockByElement(block, 1, 'electric', timestamp);
          pushElementalEffect('electricArc', origin.x, origin.y, { points, seed: Math.random() * 1000 });
        }
        else pushElementalEffect('electricArc', origin.x, origin.y, {
          points: [origin, { x: clamp(origin.x + side * run.cellSize * 1.5, 0, VIEW_W), y: origin.y }],
          seed: Math.random() * 1000 });
      }
    } else if (type === 'nano' || type === 'cloning') {
      const candidates = [];
      for (let row = source.row + 1; row <= source.row + 4; row++) {
        for (const block of run.blocksByRow?.get(row) || []) {
          if (elementalDamageable(block) && !block.special) candidates.push(block);
        }
      }
      const selected = [];
      for (const side of [-1, 1]) {
        const target = candidates.filter(block => !selected.includes(block))
          .sort((a, b) => {
            const score = block => (block.row - source.row) * 2
              + Math.abs(blockCenter(block).x - origin.x - side * run.cellSize) / run.cellSize;
            return score(a) - score(b);
          })[0];
        if (target) selected.push(target);
      }
      if (type === 'nano') {
        run.nanoEyeOpenedAt = timestamp;
        for (const target of selected) {
          const to = blockCenter(target);
          run.shieldMines.push({ target, fromX: run.slime.x, fromY: run.slime.y,
            toX: to.x, toY: to.y, markedAt: timestamp, launchedAt: timestamp + 260 });
        }
      } else {
        ensureSporeSprites();
        selected.forEach((target, order) => launchSpore(target, timestamp, {
          x: run.slime.x, y: run.slime.y, automatic: true, order }));
      }
    }
    return true;
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
    return (run?.blocks || []).filter(block => {
      if (block === source || block.dead) return false;
      const rowDistance = Math.abs(block.row - source.row);
      const columnDistance = Math.abs(block.col - source.col);
      return rowDistance <= 1 && columnDistance <= 1 && rowDistance + columnDistance > 0 && predicate(block);
    });
  }

  function elementalDamageable(block) {
    return Boolean(block && !block.dead && !block.unbreakable && !block.hazard);
  }

  const NANO_SHOT_INTERVAL_MS = 2000;
  const NANO_MINE_INTERVAL_MS = 5000;
  const MECH_LAND_MS = 1100;
  const MECH_ACTIVE_MS = 10000;
  const MECH_SHOT_INTERVAL_MS = 650;
  const MECH_SHOT_TRAVEL_MS = 90;
  const MECH_EXPLOSION_MS = 650;
  const MECH_VISUAL_CELLS = 2.65;
  const MECH_HIT_RADIUS_CELLS = 1.06;
  // Seven rows are 50 m in the authored mine; the drone reaches about 40 m.
  const NANO_RANGE_ROWS = 7 * 40 / 50;

  function mechSuitActive() {
    return Boolean(run?.mechSuit?.phase === 'active');
  }

  function mechSlowZoneImmune(timestamp = performance.now()) {
    return mechSuitActive() || Boolean(run && timestamp < (run.mechExitZoneGraceUntil || 0));
  }

  function mechMuzzlePosition(side) {
    const size = run.cellSize * MECH_VISUAL_CELLS;
    return {
      x: run.slime.x + side * size * .43,
      y: run.slime.y + size * .22
    };
  }

  function applyMechSteering(slime, dt, timestamp, terminalSpeed) {
    if (!run?.steer || run.portalEntry) return;
    const steering = fallSteeringVector();
    const locked = timestamp < (run.bounceControlLockUntil || 0);
    const inputX = locked ? 0 : steering.x;
    const targetVx = inputX * 165;
    const reversing = Math.abs(inputX) > .05 && Math.sign(slime.vx) !== Math.sign(inputX);
    const acceleration = Math.abs(inputX) < .05 ? 260 : reversing ? 330 : 310;
    slime.vx += clamp(targetVx - slime.vx, -acceleration * dt, acceleration * dt);
    if (steering.y < -.1) {
      // Full thrust first arrests the fall, then slowly lifts the chassis.
      slime.vy = Math.max(-170, slime.vy + steering.y * 700 * dt);
    } else if (steering.y > .1) {
      slime.vy = Math.min(terminalSpeed, slime.vy + steering.y * 220 * dt);
    } else if (Math.abs(inputX) > .1) {
      // Side thrusters offset a little gravity without holding the mech aloft.
      slime.vy -= Math.abs(inputX) * 80 * dt;
    }
  }

  function absorbMechImpact(slime, collision, timestamp) {
    slime.x += collision.nx * (collision.penetration + 2);
    slime.y += collision.ny * (collision.penetration + 2);
    const inwardSpeed = slime.vx * collision.nx + slime.vy * collision.ny;
    if (inwardSpeed < 0) {
      // Almost all impact energy is absorbed by the heavy chassis.
      slime.vx -= inwardSpeed * collision.nx * 1.06;
      slime.vy -= inwardSpeed * collision.ny * 1.06;
    }
    slime.vx *= .68;
    slime.vy *= .86;
    run.bounceControlLockUntil = Math.max(run.bounceControlLockUntil || 0, timestamp + 85);
  }

  function finishMechSuit(timestamp) {
    if (!run?.mechSuit) return;
    const cell=run.cellSize;
    run.mechExplosion = null;
    run.mechSuit = null;
    run.elementalAbilityActive = '';
    run.elementalAbilityUntil = 0;
    run.elementalAbilityNextTickAt = 0;
    finishUltimateRecharge();
    run.nanoShots = [];
    run.nanoMine = null;
    run.nanoNextShotAt = [timestamp + NANO_SHOT_INTERVAL_MS];
    run.nanoNextMineAt = timestamp + NANO_MINE_INTERVAL_MS;
    run.slime.radius = massRadiusForLevel(elementalLevel('mass'), run.cellSize);
    run.slime.vx *= .65;
    run.slime.vy = clamp(Math.max(120, run.slime.vy), 120, 200);
    run.bounceControlLockUntil = 0;
    run.hurtSlowUntil = 0;
    run.freezeUntil = 0;
    run.mechExitZoneGraceUntil = timestamp + 900;
    run.damageInvulnerableUntil = timestamp + 700;
    run.shake = Math.max(run.shake, 4);
    run.emotion = 'surprised';
    run.emotionUntil = timestamp + 450;
    explodeBomb({x:run.slime.x-cell/2,y:run.slime.y-cell/2,w:cell,h:cell,
      row:Math.floor((run.slime.y-run.blockRowOrigin)/cell),
      col:clamp(Math.floor((run.slime.x-run.gridOffsetX)/cell),0,run.columns-1)},0,false);
    sound('epic');
    feedback([16,26,12]);
    updateRunUI();
  }

  function nanoRunEyeOpenness(timestamp) {
    const age = timestamp - (run?.nanoEyeOpenedAt || 0);
    if (age < 0 || age >= 720) return 0;
    const opening = clamp(age / 155, 0, 1);
    const closing = clamp((720 - age) / 190, 0, 1);
    const value = Math.min(opening, closing);
    return value * value * (3 - 2 * value);
  }

  function nanoDronePosition(index, timestamp) {
    const slime = run.slime;
    const side = -1;
    const desiredX = slime.x + side * (slime.radius + 19);
    const x = clamp(desiredX, 17, VIEW_W - 17);
    const edgeLift = Math.abs(desiredX - x) > 4 ? slime.radius * .52 : 0;
    return {
      x,
      y: slime.y - slime.radius * .72 - edgeLift + Math.sin(timestamp / 410 + index * 2.2) * 3
    };
  }

  function updateNanoDrones(timestamp) {
    if (!run || run.ended) return;
    updateShieldMines(timestamp);
    const level = elementalLevel('nano');
    if (!level) return;
    for (const shot of run.nanoShots || []) {
      const travelMs = shot.mech ? MECH_SHOT_TRAVEL_MS : 135;
      if (!shot.hit && timestamp - shot.startedAt >= travelMs) {
        shot.hit = true;
        damageBlockByElement(shot.target, shot.mech ? 2 : 1, shot.mech ? 'mech' : 'nano', timestamp);
      }
    }
    run.nanoShots = (run.nanoShots || []).filter(shot => timestamp - shot.startedAt < (shot.mech ? 245 : 270));
    if (run.mechSuit) {
      const mech = run.mechSuit;
      if (mech.phase !== 'active' || timestamp < mech.nextShotAt) return;
      mech.nextShotAt = timestamp + MECH_SHOT_INTERVAL_MS;
      const slime = run.slime;
      const cell = run.cellSize;
      const candidates = blocksNearY(slime.y + cell * NANO_RANGE_ROWS * .5, cell * NANO_RANGE_ROWS * .55)
        .filter(block => (elementalDamageable(block) || (!block.dead && block.hazard)) && !block.special
          && blockCenter(block).y > slime.y + cell * .6
          && blockCenter(block).y - slime.y <= cell * NANO_RANGE_ROWS
          && Math.abs(blockCenter(block).x - slime.x) <= cell * 2.6);
      const selected = new Set();
      for (const side of [-1, 1]) {
        const muzzle = mechMuzzlePosition(side);
        const pool = candidates.filter(block => !selected.has(block)
          && blockCenter(block).y > muzzle.y + cell * .22);
        const sidePool = pool.filter(block => side * (blockCenter(block).x - slime.x) > -cell * .4);
        const choices = sidePool.length ? sidePool : pool;
        const durable = choices.filter(block => block.hp >= 2 || block.tier === 'hard' || block.tier === 'reinforced');
        const prioritized = durable.length && Math.random() < .82 ? durable : choices;
        const target = prioritized[Math.floor(Math.random() * prioritized.length)] || null;
        if (!target) continue;
        selected.add(target);
        const center = blockCenter(target);
        run.nanoShots.push({ fromX: muzzle.x, fromY: muzzle.y, toX: center.x, toY: center.y,
          target, startedAt: timestamp, hit: false, mech: true });
      }
      if (selected.size) mech.lastShotAt = timestamp;
      return;
    }
    const origin = nanoDronePosition(0, timestamp);
    const inRange = block => elementalDamageable(block) && !block.special
      && blockCenter(block).y > run.slime.y + 8
      && blockCenter(block).y - run.slime.y <= run.cellSize * NANO_RANGE_ROWS
      && Math.abs(blockCenter(block).x - run.slime.x) <= run.cellSize * 2.2;
    if (timestamp >= run.nanoNextShotAt[0]) {
      run.nanoNextShotAt[0] = timestamp + NANO_SHOT_INTERVAL_MS;
      const target = run.blocks.filter(inRange).sort((a, b) => {
        const score = block => blockCenter(block).y - origin.y + Math.abs(blockCenter(block).x - origin.x) * .65;
        return score(a) - score(b);
      })[0];
      if (target) {
        const center = blockCenter(target);
        run.nanoShots.push({ fromX: origin.x, fromY: origin.y + 11, toX: center.x, toY: center.y,
          target, startedAt: timestamp, hit: false });
      }
    }
    if (level < 2) return;
    if (run.nanoMine && timestamp >= run.nanoMine.launchedAt + 320) {
      const mine = run.nanoMine;
      const center = { x: mine.toX, y: mine.toY };
      const hitBlocks = [mine.target, ...nearbyGridBlocks(mine.target, elementalDamageable)
        .filter(block => block.row === mine.target.row || block.col === mine.target.col)];
      for (const block of hitBlocks) damageBlockByElement(block, 1, 'nanoMine', timestamp);
      spawnSpecialBurst('bomb', center.x, center.y, 0, -1, .48);
      run.nanoMine = null;
    }
    if (!run.nanoMine && timestamp >= run.nanoNextMineAt) {
      const candidates = run.blocks.filter(inRange).sort((a, b) => blockCenter(b).y - blockCenter(a).y);
      const target = candidates[Math.min(candidates.length - 1, Math.floor(Math.random() * Math.min(3, candidates.length)))];
      if (!target) { run.nanoNextMineAt = timestamp + 800; return; }
      const center = blockCenter(target);
      run.nanoEyeOpenedAt = timestamp;
      run.nanoNextMineAt = timestamp + NANO_MINE_INTERVAL_MS;
      run.nanoMine = { target, fromX: run.slime.x + run.slime.radius * .30,
        fromY: run.slime.y, toX: center.x, toY: center.y,
        markedAt: timestamp, launchedAt: timestamp + 420 };
    }
  }

  const TELEKINESIS_INTERVAL_MS = 1500;
  const TELEKINESIS_THROW_INTERVAL_MS = 2700;
  const TELEKINESIS_PULL_START_MS = 180;
  const TELEKINESIS_RECOIL_START_MS = 720;
  const TELEKINESIS_THROW_START_MS = 930;
  const TELEKINESIS_IMPACT_MS = 1450;
  const TELEKINESIS_THROW_OFFSETS = [0, -.82, .88, -.42, .5];
  const TELEKINESIS_ULTIMATE_COUNT = 10;
  const TELEKINESIS_ULTIMATE_ORBIT_MS = 1450;
  const TELEKINESIS_ULTIMATE_STAGGER_MS = 185;
  const TELEKINESIS_PRESS_DISTANCE_CELLS = 7 * 80 / 50; // Seven mine rows are 50 m.
  const TELEKINESIS_PRESS_WINDUP_MS = 320;
  const TELEKINESIS_PRESS_COLLIDE_MS = 1280;
  const TELEKINESIS_PRESS_FADE_MS = 1050;

  function telekinesisPressProgress(press, timestamp) {
    const t = clamp((timestamp - press.startedAt - TELEKINESIS_PRESS_WINDUP_MS)
      / (TELEKINESIS_PRESS_COLLIDE_MS - TELEKINESIS_PRESS_WINDUP_MS), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function startTelekinesisPress(timestamp, originY) {
    const firstRow = Math.max(0, Math.floor((originY + run.slime.radius - run.blockRowOrigin) / run.cellSize) + 1);
    const topY = run.blockRowOrigin + firstRow * run.cellSize;
    const bottomY = Math.min(topY + TELEKINESIS_PRESS_DISTANCE_CELLS * run.cellSize, run.portalY - run.cellSize * .5);
    const lastRow = Math.floor((bottomY - run.blockRowOrigin) / run.cellSize - .5);
    const targets = [];
    for (let row = firstRow; row <= lastRow; row += 1) {
      for (const block of run.blocksByRow?.get(row) || []) {
        if (!block.dead && !block.unbreakable) targets.push(block);
      }
    }
    run.telekinesisPress = {
      startedAt: timestamp, firstRow, lastRow, targets, targetSet: new Set(targets), collided: false,
      topY, bottomY,
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
      // The slime strains and hovers while moving an entire mine segment.
      run.slime.vx *= .88;
      run.slime.vy *= .82;
      run.slime.y += (press.originY - run.slime.y) * .08;
      run.shake = Math.max(run.shake, 3.5 + telekinesisPressProgress(press, timestamp) * 2.3);
      return;
    }
    if (!press.collided) {
      press.collided = true;
      for (const block of press.targets) {
        if (!block.dead) destroyBlock(block, 'telekinesisPress', timestamp);
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
    return run.blocks.filter(block => {
      if (!elementalDamageable(block) || block.special) return false;
      const centerY = block.y + block.h / 2;
      return centerY > minY && centerY < maxY && block.x + block.w > 0 && block.x < VIEW_W;
    });
  }

  function telekinesisOrbitPosition(projectile, elapsed) {
    const angle = elapsed * .0023 + projectile.index * Math.PI * 2 / TELEKINESIS_ULTIMATE_COUNT;
    const radius = run.slime.radius * 1.5 + run.cellSize * .5;
    return {
      x: clamp(run.slime.x + Math.cos(angle) * radius, 18, VIEW_W - 18),
      y: run.slime.y - run.slime.radius * 1.8 - 20 + Math.sin(angle) * radius * .32
    };
  }

  function startTelekinesisCycle(timestamp, level, ultimate = false) {
    const candidates = telekinesisCandidates();
    const selected = [];
    const count = ultimate ? TELEKINESIS_ULTIMATE_COUNT : level >= 2 ? 2 : 1;
    if (level >= 2 && !ultimate) {
      const left = candidates.filter(block => blockCenter(block).x < run.slime.x);
      const right = candidates.filter(block => blockCenter(block).x >= run.slime.x);
      if (left.length && right.length) {
        selected.push(left[Math.floor(Math.random() * left.length)], right[Math.floor(Math.random() * right.length)]);
      }
    }
    while (selected.length < count && candidates.length) {
      const index = Math.floor(Math.random() * candidates.length);
      const block = candidates.splice(index, 1)[0];
      if (!selected.includes(block)) selected.push(block);
    }
    run.telekinesisNextAt = timestamp + (ultimate ? 6000 : level >= 2 ? TELEKINESIS_THROW_INTERVAL_MS : TELEKINESIS_INTERVAL_MS);
    if (!selected.length) return false;
    run.telekinesisMarks = selected.map(block => ({
      x: block.x, y: block.y, w: block.w, h: block.h, startedAt: timestamp,
      duration: ultimate ? 580 : 420
    }));
    run.telekinesisCycle = {
      startedAt: timestamp,
      mode: ultimate ? 'ultimate' : level >= 2 ? 'cross' : 'single',
      projectiles: selected.map((block, index) => ({
        block,
        visual: { ...block },
        source: blockCenter(block),
        side: blockCenter(block).x < run.slime.x ? -1 : 1,
        index,
        delay: ultimate ? index * 42 : index * 90,
        throwAt: ultimate ? TELEKINESIS_ULTIMATE_ORBIT_MS + index * TELEKINESIS_ULTIMATE_STAGGER_MS : TELEKINESIS_THROW_START_MS + index * 90,
        impactAt: ultimate ? TELEKINESIS_ULTIMATE_ORBIT_MS + index * TELEKINESIS_ULTIMATE_STAGGER_MS + 470 : TELEKINESIS_IMPACT_MS + index * 90,
        detached: false,
        launched: false,
        impacted: false,
        target: null,
        launchFrom: null
      }))
    };
    if (ultimate) run.elementalAbilityUntil = Math.max(run.elementalAbilityUntil, timestamp + 4550);
    return true;
  }

  function launchTelekinesisProjectile(projectile, cycle, timestamp) {
    const slime = run.slime;
    const offset = TELEKINESIS_THROW_OFFSETS[run.telekinesisThrowIndex % TELEKINESIS_THROW_OFFSETS.length];
    run.telekinesisThrowIndex += 1;
    const desiredX = cycle.mode === 'cross'
      ? projectile.side < 0 ? VIEW_W * .78 : VIEW_W * .22
      : cycle.mode === 'ultimate' ? run.cellSize * (.5 + (projectile.index * 3) % Math.max(1, Math.floor(VIEW_W / run.cellSize)))
        : slime.x + offset * run.cellSize;
    const aimedX = clamp(desiredX, run.cellSize / 2, VIEW_W - run.cellSize / 2);
    let impactBlock = null;
    let bestScore = Infinity;
    for (const block of run.blocks) {
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

  function impactTelekinesisProjectile(projectile, timestamp) {
    const target = projectile.target;
    if (!target) return;
    run.telekinesisBursts.push({ x: target.x, y: target.y, startedAt: timestamp });
    if (target.row != null && target.col != null) {
      for (let row = target.row - 1; row <= target.row + 1; row += 1) {
        for (const block of run.blocksByRow?.get(row) || run.blocks) {
          if (elementalDamageable(block) && !block.special
            && Math.abs(block.row - target.row) + Math.abs(block.col - target.col) <= 1) {
            damageBlockByElement(block, 1, 'telekinesisBlast', timestamp);
          }
        }
      }
    }
    run.shake = Math.max(run.shake, 2.3);
  }

  function updateTelekinesis(timestamp) {
    if (!run || run.ended) return;
    run.telekinesisMarks = run.telekinesisMarks.filter(mark => timestamp - mark.startedAt < mark.duration);
    run.telekinesisBursts = run.telekinesisBursts.filter(burst => timestamp - burst.startedAt < 330);
    const level = elementalLevel('telekinesis');
    if (!level || run.portalEntry) return;
    const cycle = run.telekinesisCycle;
    if (cycle) {
      for (const projectile of cycle.projectiles) {
        const elapsed = timestamp - cycle.startedAt;
        if (elapsed >= TELEKINESIS_PULL_START_MS + projectile.delay && !projectile.detached) {
          if (!projectile.block.dead) {
            destroyBlock(projectile.block, 'telekinesisLift', timestamp);
          }
          projectile.detached = true;
        }
        if (elapsed >= projectile.throwAt && !projectile.launched) launchTelekinesisProjectile(projectile, cycle, timestamp);
        if (elapsed >= projectile.impactAt && !projectile.impacted) {
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
    if (run.sporeBursts.length) run.sporeBursts = run.sporeBursts.filter(burst => timestamp - burst.startedAt < 520);
  }

  function updateCloningUltimate(timestamp) {
    const ultimate = run.cloneUltimate;
    if (!ultimate) return;
    const age = timestamp - ultimate.startedAt;
    if (!ultimate.fired && age >= CLONE_ULTIMATE_BURST_MS) {
      ultimate.fired = true;
      const slimeRow = Math.floor((ultimate.y - run.blockRowOrigin) / run.cellSize);
      for (let index = 0; index < 8; index += 1) {
        const target = findSporeTarget(slimeRow + 3 + index * 2,
          (index * 3 + Math.floor(index / 2)) % run.columns);
        if (target) launchSpore(target, timestamp, { x: ultimate.x, y: ultimate.y,
          delay: index * 145, automatic: true, order: index });
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
    run.specialEffects.push({ type, x, y, life, maxLife: life, ...extra });
    if (run.specialEffects.length > 36) run.specialEffects.shift();
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
    block.elementalSnow = true;
    block.elementalFrozen = false;
    block.elementalFrostPower = 0;
    block.maxHp = 1;
    block.hp = 1;
    block.frostFlashUntil = timestamp + 520;
    markFrostTransformation(block, timestamp, 'snow', quiet);
    createDebris(block, 2, false);
    return true;
  }

  function turnBlockToSnowflake(block, timestamp = performance.now()) {
    if (!frostFreezable(block) || block.elementalSnowflake) return false;
    shareGlitchHit(block, 0, timestamp, 'snowflake');
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

  function startFrostStorm(timestamp) {
    ensureWorldSprites(2);
    run.frostStorm = {
      startedAt: timestamp,
      endAt: timestamp + ELEMENTAL_ABILITY_DURATION_MS.frost,
      nextFlakeAt: timestamp + 130,
      lastTargetX: -VIEW_W,
      flakes: []
    };
  }

  function launchFrostStormFlake(storm, timestamp) {
    if (storm.flakes.length >= 12) return false;
    const minY = Math.max(run.cameraY + 85, run.slime.y + run.cellSize * .45);
    const maxY = run.cameraY + VIEW_H - 18;
    if (minY >= maxY) return false;
    const candidates = blocksNearY((minY + maxY) / 2, (maxY - minY) / 2)
      .filter(block => frostTargetAvailable(block, timestamp)
        && blockCenter(block).y >= minY && blockCenter(block).y <= maxY);
    if (!candidates.length) return false;
    let target = null;
    let best = -Infinity;
    for (const block of candidates) {
      const center = blockCenter(block);
      const spread = clamp(Math.abs(center.x - storm.lastTargetX) / (run.cellSize * 3), 0, 1);
      const depth = clamp((center.y - run.slime.y) / (run.cellSize * 7), 0, 1);
      const score = Math.random() * 2 + spread * 1.8 + depth * .7;
      if (score > best) { best = score; target = block; }
    }
    const center = blockCenter(target);
    const fromY = run.cameraY - rand(18, 42);
    const duration = clamp((center.y - fromY) * 1.55, 620, 1160);
    target.frostReservedUntil = timestamp + duration + 250;
    storm.lastTargetX = center.x;
    storm.flakes.push({
      target, startedAt: timestamp, duration,
      fromX: clamp(center.x + rand(-48, 48), 9, VIEW_W - 9), fromY,
      toX: center.x, toY: center.y,
      sway: rand(7, 21) * (Math.random() < .5 ? -1 : 1),
      phase: rand(0, Math.PI * 2), size: rand(7, 10.5)
    });
    return true;
  }

  function updateFrostStorm(timestamp) {
    const storm = run?.frostStorm;
    if (!storm) return;
    if (timestamp < storm.endAt - 650 && timestamp >= storm.nextFlakeAt) {
      launchFrostStormFlake(storm, timestamp);
      const progress = clamp((timestamp - storm.startedAt) / (storm.endAt - storm.startedAt), 0, 1);
      const cadence = progress < .12 || progress > .82 ? rand(180, 250) : rand(120, 185);
      storm.nextFlakeAt = timestamp + cadence;
    }
    storm.flakes = storm.flakes.filter(flake => {
      if (timestamp - flake.startedAt < flake.duration) return true;
      flake.target.frostReservedUntil = 0;
      if (!flake.target.dead) turnBlockToSnow(flake.target, timestamp, true);
      return false;
    });
    if (timestamp >= storm.endAt && !storm.flakes.length) run.frostStorm = null;
  }

  function igniteBlock(block, timestamp = performance.now(), auraId = 0) {
    if (!elementalDamageable(block)) return false;
    if (auraId && block.lastFireAuraId === auraId) return false;
    if (auraId) block.lastFireAuraId = auraId;
    if (block.fireDamageAt > timestamp) return false;
    shareGlitchHit(block, 0, timestamp, 'fire');
    block.fireIgnitedAt = timestamp;
    block.fireDamageAt = timestamp + 1000;
    block.fireFlashUntil = block.fireDamageAt + 360;
    block.fireUltimateAuraId = auraId || 0;
    return true;
  }

  function updatePhoenixUltimate(timestamp) {
    const phoenix = run.phoenixUltimate;
    if (!phoenix) return;
    const progress = clamp((timestamp - phoenix.startedAt) / phoenix.duration, 0, 1);
    const headY = phoenix.originY - run.cellSize * 1.15
      + progress * run.cellSize * (PHOENIX_FIRE_ROWS + 1.15);
    const lastReachedRow = Math.min(phoenix.endRow,
      Math.floor((headY - run.blockRowOrigin - run.cellSize * .5) / run.cellSize));
    for (let row = phoenix.lastRow + 1; row <= lastReachedRow; row += 1) {
      for (const block of run.blocksByRow?.get(row) || []) igniteBlock(block, timestamp, phoenix.auraId);
      run.phoenixWaves.push({ y: run.blockRowOrigin + (row + .5) * run.cellSize, startedAt: timestamp });
      phoenix.lastRow = row;
    }
    if (lastReachedRow >= phoenix.startRow) run.shake = Math.max(run.shake, 2.8);
    if (progress >= 1) run.phoenixUltimate = null;
  }

  function spreadFireFrom(source, timestamp) {
    if (elementalLevel('fire') < 2) return;
    const candidates = nearbyGridBlocks(source, elementalDamageable)
      .filter(block => !(block.fireDamageAt > timestamp))
      .sort(() => Math.random() - .5);
    const target = candidates[0];
    if (!target) return;
    igniteBlock(target, timestamp, source.fireUltimateAuraId || 0);
    const from = blockCenter(source);
    const to = blockCenter(target);
    pushElementalEffect('firePulse', to.x, to.y, { fromX: from.x, fromY: from.y });
  }

  function spreadFireFromBrokenBlock(block, timestamp, cause = '') {
    if (cause !== 'fire' && cause !== 'fireUltimate'
      && !(block.fireDamageAt > timestamp || block.fireFlashUntil > timestamp)) return;
    spreadFireFrom(block, timestamp);
  }

  function damageBlockByElement(block, amount, cause, timestamp = performance.now()) {
    if (block?.hazard && !block.dead && (cause === 'mech' || cause === 'cosmosUltimate')) {
      block.hp = 0;
      return destroyBlock(block, cause, timestamp);
    }
    if (!elementalDamageable(block)) return false;
    if (block.sporePod && cause !== 'sporeExplosion') detonateSporePod(block.sporePod, timestamp);
    if (block.dead) return false;
    const damage = Math.max(0, amount);
    if (cause !== 'glitchEcho') shareGlitchHit(block, damage, timestamp);
    block.hp = Math.max(0, block.hp - damage);
    if (cause === 'electric' || cause === 'electricStorm') {
      block.electricFlashStartedAt = timestamp;
      block.electricFlashUntil = timestamp + 620;
    }
    if (block.hp > 0) {
      createDebris(block, 2, false);
      return false;
    }
    block.hp = 0;
    destroyBlock(block, cause, timestamp);
    return Boolean(block.dead);
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
    targets.forEach((block, index) => {
      damageBlockByElement(block, 1, 'electric', timestamp);
      block.electricFlashStartedAt = timestamp + index * 155;
      block.electricFlashUntil = block.electricFlashStartedAt + 620;
    });
    const life = .68 + targets.length * .155;
    pushElementalEffect('electricArc', origin.x, origin.y, {
      points, seed: Math.random() * 1000, life, maxLife: life
    });
    return targets.length;
  }

  function chooseElectricStormTarget(storm) {
    const low = run.slime.y + run.cellSize * .85;
    const high = Math.min(run.slime.y + run.cellSize * 6.2, run.cameraY + VIEW_H - 34);
    const desiredY = run.slime.y + run.cellSize * (2.4 + storm.strikes % 3 * .65);
    const desiredX = VIEW_W * [ .34, .68, .48, .72, .3 ][storm.strikes];
    const available = run.blocks.filter(block => {
      if (!elementalDamageable(block) || storm.usedTargets.has(block.id)) return false;
      const y = block.y + block.h / 2;
      return y >= low && y <= high;
    });
    const fallback = available.length ? available : run.blocks.filter(block =>
      elementalDamageable(block) && !storm.usedTargets.has(block.id)
      && block.y + block.h / 2 > low && block.y + block.h / 2 < low + run.cellSize * 10);
    return fallback.map(block => {
      const center = blockCenter(block);
      const openSides = [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dy]) =>
        run.blocksByRow?.get(block.row + dy)?.some(neighbor =>
          neighbor.col === block.col + dx && elementalDamageable(neighbor))).length;
      return { block, score: Math.abs(center.y - desiredY) * .8
        + Math.abs(center.x - desiredX) * .55
        + Math.abs(block.col - 2.5) * run.cellSize * .28
        + (4 - openSides) * run.cellSize * 1.15 + rand(-16, 16) };
    }).sort((a, b) => a.score - b.score)[0]?.block || null;
  }

  function spawnElectricIncineration(block) {
    const center = blockCenter(block);
    const particleCount = scaledEffectCount(20, 10);
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

  function launchElectricStormStrike(storm, timestamp) {
    const target = chooseElectricStormTarget(storm);
    const targetPoint = target ? blockCenter(target) : {
      x: VIEW_W * [ .34, .68, .48, .72, .3 ][storm.strikes],
      y: Math.min(run.cameraY + VIEW_H - 35, run.slime.y + run.cellSize * 3)
    };
    if (target) storm.usedTargets.add(target.id);
    const cloudX = clamp(targetPoint.x * .68 + VIEW_W * .16, VIEW_W * .17, VIEW_W * .83);
    run.electricStormBolts.push({
      from: { x: cloudX, y: 68 }, to: targetPoint, fromScreen: true,
      startedAt: timestamp, until: timestamp + 520, seed: Math.random() * 10000,
      trunk: true
    });
    storm.flashUntil = timestamp + 220;
    run.shake = Math.max(run.shake, 8);
    sound('hitHard');
    feedback([13, 27, 13]);
    if (!target) return;

    // The struck block is incinerated as the four chains spread from its position.
    target.electricFlashStartedAt = timestamp + 135;
    target.electricFlashUntil = timestamp + 680;
    run.electricStormHits.push({ block: target, at: timestamp + 155, incinerate: true });
    const visited = new Set([target.id]);
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of directions) {
      let current = target;
      for (let step = 0; step < ELECTRIC_STORM_BRANCH_LENGTH; step += 1) {
        const candidates = nearbyGridBlocks(current, elementalDamageable)
          .filter(block => !visited.has(block.id));
        const forward = candidates.filter(block =>
          (block.col - current.col) * dx + (block.row - current.row) * dy > 0);
        const pool = forward.length ? forward : step ? candidates : [];
        const next = pool.map(block => {
          const column = block.col - current.col;
          const row = block.row - current.row;
          return { block, score: (column * dx + row * dy) * 22
            - Math.abs(column * dy - row * dx) * 8 + rand(-10, 10) };
        }).sort((a, b) => b.score - a.score)[0]?.block;
        if (!next) break;
        visited.add(next.id);
        const startedAt = timestamp + 145 + step * 92;
        run.electricStormBolts.push({
          from: blockCenter(current), to: blockCenter(next),
          startedAt, until: startedAt + 420, seed: Math.random() * 10000,
          trunk: false
        });
        run.electricStormHits.push({ block: next, at: startedAt + 95 });
        current = next;
      }
    }
  }

  function updateElectricStorm(timestamp) {
    const storm = run.electricStorm;
    if (!storm || storm.endedAt || storm.strikes >= ELECTRIC_STORM_STRIKES || timestamp < storm.nextStrikeAt) return;
    launchElectricStormStrike(storm, timestamp);
    storm.strikes += 1;
    storm.nextStrikeAt = timestamp + 700;
    run.elementalAbilityUntil = Math.max(run.elementalAbilityUntil, timestamp + 850);
  }

  function dischargeFromImpact(source, count, timestamp) {
    const candidates = nearbyGridBlocks(source, elementalDamageable).sort((a, b) => {
      const score = block => (block.row > source.row ? 80 : block.row === source.row ? 24 : -45) + block.row * 1.4 + rand(-18, 18);
      return score(b) - score(a);
    });
    const first = candidates[0];
    return first ? strikeElectricChain(first, count, blockCenter(source), timestamp) : 0;
  }

  function updateElementalEffects(timestamp = performance.now()) {
    if (!run || run.ended) return;

    if (run.mechSuit?.phase === 'active' && timestamp >= run.mechSuit.expireAt) finishMechSuit(timestamp);
    updateShieldLifetime(timestamp);
    if (run.ultimateRechargePending === 'shield' && run.barrier <= 0 && !run.ultimateIntro) finishUltimateRecharge();

    run.phoenixWaves = (run.phoenixWaves || []).filter(wave => timestamp - wave.startedAt < 490);
    if (run.electricStorm?.endedAt && timestamp - run.electricStorm.endedAt >= ELECTRIC_STORM_EXIT_MS) {
      run.electricStorm = null;
    }
    run.electricStormBolts = (run.electricStormBolts || []).filter(bolt => timestamp < bolt.until);
    run.electricStormHits = (run.electricStormHits || []).filter(hit => {
      if (timestamp < hit.at) return true;
      if (hit.incinerate) {
        if (elementalDamageable(hit.block)) {
          spawnElectricIncineration(hit.block);
          damageBlockByElement(hit.block, Math.max(1, hit.block.hp), 'electricStorm', timestamp);
        }
      } else damageBlockByElement(hit.block, 1, 'electricStorm', timestamp);
      return false;
    });

    updateFrostStorm(timestamp);
    updateNanoDrones(timestamp);
    updateTelekinesisPress(timestamp);
    updateTelekinesis(timestamp);
    updateCloningUltimate(timestamp);
    updateSpores(timestamp);

    for (const block of run.blocks) {
      if (block.dead || !block.fireDamageAt || timestamp < block.fireDamageAt) continue;
      block.fireDamageAt = 0;
      damageBlockByElement(block, 1, block.fireUltimateAuraId ? 'fireUltimate' : 'fire', timestamp);
    }

    const active = run.elementalAbilityActive;
    if (!active) return;
    if (active === 'fire') updatePhoenixUltimate(timestamp);
    if (active === 'electric') updateElectricStorm(timestamp);
    if (timestamp >= run.elementalAbilityUntil) {
      run.elementalAbilityActive = '';
      run.elementalAbilityNextTickAt = 0;
      finishUltimateRecharge();
      if (active === 'cosmos') run.cosmosUltimate = null;
      if (active === 'electric' && run.electricStorm && !run.electricStorm.endedAt) {
        run.electricStorm.endedAt = timestamp;
      }
      if (active === 'mass') resetMassPierce();
      return;
    }
    if (active === 'nano') return; // The mech's two guns run through updateNanoDrones.
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
    } else if (active === 'nano' || active === 'phantom') {
      const targets = run.blocks.filter(elementalDamageable)
        .map(block => ({ block, distance: Math.hypot(blockCenter(block).x - center.x, blockCenter(block).y - center.y) }))
        .filter(item => item.distance < run.cellSize * (active === 'phantom' ? 1.45 : 2.25))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, active === 'nano' ? 2 : 1);
      targets.forEach(({ block }) => damageBlockByElement(block, 1, active, timestamp));
      if (active === 'phantom') run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, timestamp + 260);
      run.elementalAbilityNextTickAt = timestamp + (active === 'nano' ? 260 : 350);
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
    const snowflake = Boolean(block.elementalSnowflake);
    const snow = Boolean(block.elementalSnow);
    const fragile = block.tier === 'dense' || block.tier === 'soft';
    const factor = snowflake ? BALANCE.snowflakeBreakDrag : snow ? BALANCE.snowBreakDrag
      : fragile ? (block.tier === 'soft' ? BALANCE.weakBreakDrag : BALANCE.fragileBreakDrag)
        : BALANCE.denseBreakDrag * (BLOCK_TIERS[block.tier]?.drag || .95);
    const duration = snowflake ? 65 : snow ? 100 : fragile ? 170 : 120;
    const accelerationScale = snowflake ? .75 : snow ? .65 : fragile ? .4 : .55;
    // Touching two neighboring blocks is one impact, not two full speed losses.
    const sameImpact = timestamp - (run.breakImpactAt ?? -Infinity) < 70;
    const previous = sameImpact ? run.breakImpactFactor : 1;
    if (factor < previous) {
      run.slime.vy *= factor / previous;
      run.slime.vx *= sameImpact ? 1 : .96;
      run.breakImpactFactor = factor;
    } else if (!sameImpact) run.breakImpactFactor = factor;
    if (!sameImpact) run.breakImpactAt = timestamp;
    if (!sameImpact || factor <= previous) {
      run.breakImpactUntil = timestamp + duration;
      run.breakImpactAccelerationScale = accelerationScale;
    }
  }

  function resolveBlockHit(block, collision, timestamp = performance.now()) {
    const s = run.slime;
    const drillActive = speedDrillActive(timestamp);
    if (block.glitchNeutralized && block.hazard) return transformGlitchHazard(block, collision, timestamp);
    if (block.sporePod) detonateSporePod(block.sporePod, timestamp);
    if (block.dead) return false;

    const fireLevel = elementalLevel('fire');
    const electricLevel = elementalLevel('electric');
    if (fireLevel >= 1) igniteBlock(block, timestamp);
    if (electricLevel >= 1) dischargeFromImpact(block, electricLevel >= 2 ? 1 + Math.floor(Math.random() * 4) : 1, timestamp);
    if (block.dead) {
      if (!drillActive && !cosmosBoostActive()) applyBreakResistance(block, timestamp);
      return false;
    }

    if (block.hazard) {
      return resolveHazardHit(block, collision, timestamp);
    }
    if (mechSuitActive() && !block.special && !block.unbreakable) {
      const middleCol = Math.floor((s.x - run.gridOffsetX) / run.cellSize);
      const laneCenter = Math.abs(block.col - middleCol) <= 1 ? middleCol : block.col;
      const targets = (run.blocksByRow?.get(block.row) || [])
        .filter(target => elementalDamageable(target) && !target.special
          && Math.abs(target.col - laneCenter) <= 1 && timestamp >= (target.mechHitUntil || 0));
      for (const target of targets) {
        target.mechHitUntil = timestamp + 160;
        damageBlockByElement(target, 2, 'mech', timestamp);
      }
      run.shake = Math.max(run.shake, 2.4);
      if (block.dead) {
        const travelDirection = s.vy < 0 ? -1 : 1;
        s.vy = travelDirection * Math.max(85, Math.abs(s.vy) * .82);
        s.vx *= .83;
        sound('break');
        return false;
      }
      absorbMechImpact(s, collision, timestamp);
      run.flightDistance = 0;
      sound('hit');
      return true;
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
    const impactSpeed = Math.max(70, Math.hypot(s.vx, s.vy));
    const unbreakable = Boolean(block.unbreakable);
    let damage = 1;
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
    const drillPiercing = drillActive && !unbreakable;
    if (drillPiercing) damage = hpBefore;
    shareGlitchHit(block, damage, timestamp);
    const destroysImmediately = !unbreakable && (breaksOnTouch || geyserPiercing || massPiercing || speedBurstPiercing || drillPiercing || damage >= hpBefore);
    let healthLoss = 0;
    if (frozenSlime || breaksOnTouch) healthLoss = 0;
    if (healthLoss > 0 && timestamp < run.damageInvulnerableUntil) healthLoss = 0;
    const barrierAbsorbed = Math.min(Math.max(0, run.barrier || 0), healthLoss);
    if (barrierAbsorbed > 0) {
      burstDominantShield(block, timestamp);
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
      destroyBlock(block, 'impact', timestamp);
      if (cosmosBoosted) consumeCosmosBoostBlock(timestamp);
      if (geyserPiercing) run.geyserBreaksLeft = Math.max(0, run.geyserBreaksLeft - 1);
      const speedBurstBlocksLeft = speedBurstPiercing ? consumeSpeedBurstBlock(timestamp) : -1;
      if (!drillPiercing && !speedBurstPiercing && !cosmosBoosted) {
        if (massPiercing) {
          s.vy = s.vy > 0 ? Math.max(310, s.vy * .94) : s.vy * .94;
          s.vx *= .95;
        } else applyBreakResistance(block, timestamp);
      } else if (cosmosBoosted && run.cosmosBoostBlocksLeft > 0) {
        s.vy = Math.max(440, Math.abs(s.vy));
        s.vx *= .96;
      }
      let keep = block.tier === 'soft' ? BALANCE.flightKeepSoft : block.tier === 'dense' || block.tier === 'special' || block.tier === 'ore' ? BALANCE.flightKeepDense : BALANCE.flightKeepHard;
      run.flightDistance *= keep;

      if (speedBurstPiercing) impact(speedBurstBlocksLeft > 0 ? `БУР-РЫВОК · ЕЩЁ ${speedBurstBlocksLeft}` : 'БУР-РЫВОК');
      else if (!block.special) impact('ПРОБОЙ');
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
    spreadFireFromBrokenBlock(block, timestamp);
    const choices = ['meteor', 'bomb', 'heal', 'shield']
      .filter(type => type !== 'heal' || run.health < run.maxHealth)
      .filter(type => type !== 'shield' || run.barrier < Math.max(20, run.shield));
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

  function ultimateChargeBlocked(cause) {
    return Boolean(run.ultimateIntro || run.elementalAbilityActive
      || run.ultimateRechargePending === 'shield' || ULTIMATE_BREAK_CAUSES.has(cause));
  }

  function finishUltimateRecharge() {
    if (!run?.ultimateRechargePending) return false;
    run.ultimateRechargePending = '';
    if (!run.elementalAbilityCharges && !run.shieldCharges) {
      run.ultimateCharge = ULTIMATE_POST_USE_CHARGE;
    }
    return true;
  }

  function destroyBlock(block, cause = 'impact', timestamp = performance.now()) {
    if (!block || block.dead) return;
    if (typeof cause !== 'string') cause = 'impact';
    // Ordinary attacks leave spikes intact; these two ultimates crush them.
    if (block.hazard && cause !== 'cosmosUltimate' && cause !== 'mech'
      && (run?.worldId === 1 || cause !== 'telekinesisPress')) return false;
    if (block.sporePod) {
      if (cause === 'sporeExplosion') {
        block.sporePod.detonated = true;
        block.sporePod = null;
      } else detonateSporePod(block.sporePod, timestamp);
    }
    if (block.dead) return false;
    if (block.glitchInfected && cause !== 'glitchEcho' && cause !== 'telekinesisPress') {
      shareGlitchHit(block, Math.max(1, block.hp || block.maxHp || 1), timestamp);
      if (block.dead) return false;
    }
    const wasGolden = blockIsGolden(block, timestamp);
    const wasSnow = Boolean(block.elementalSnow);
    const wasSnowflake = Boolean(block.elementalSnowflake);
    block.dead = true;
    if (cause !== 'telekinesisPress') spreadFireFromBrokenBlock(block, timestamp, cause);
    run.glitchInfectedBlocks?.delete(block);
    block.glitchInfected = false;
    run.blocksDestroyed += 1;
    awardRunExperience(block);
    if (!ultimateChargeBlocked(cause) && run.elementalAbilityCharges < 1 && run.shieldCharges < 1) {
      run.ultimateCharge = Math.min(ULTIMATE_BLOCKS_REQUIRED, (run.ultimateCharge || 0) + 1);
      if (run.ultimateCharge >= ULTIMATE_BLOCKS_REQUIRED) {
        if (run.elementalAbilityType) run.elementalAbilityCharges = 1;
        else run.shieldCharges = 1;
        impact('УЛЬТА ГОТОВА');
      }
    }
    registerBrokenBlock(block);
    if (cause === 'telekinesisPress') {
      if (block.special === 'boss') impact('СТРАЖ НЕДР ПОБЕЖДЁН!');
      return true;
    }
    if (cause !== 'telekinesisLift' && cause !== 'electricStorm') createDebris(block, block.special === 'geyser' ? 0 : cause === 'mech' ? 5 : block.special === 'bomb' ? 8 : 9, true);

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
    else if (wasSnow) scatterSnowShards(block, timestamp);

    if (wasGolden && elementalLevel('gold') >= 2 && Math.random() < .35) {
      throwGoldCoin(block, timestamp);
    }
    return true;
  }

  function registerBrokenBlock(block) {
    awardRunExperience(block);
    if (run?.worldId === 1 && block?.flaskTier && !block.flaskGranted) {
      block.flaskGranted = true;
      const value = block.flaskValue || FLASK_VALUES[block.flaskTier] || 0;
      awardFlaskData(value);
      sound('coin');
      const essence=window.SlimeBlockBreakFeedback.emitEssence(block,value,effectDensity());
      run.particles.push(...essence.particles);
      const flashes=run.specialEffects.filter(effect=>effect.type==='essenceCollect');
      if(flashes.length>=(isMobileDevice()?6:10)){
        run.specialEffects.splice(run.specialEffects.indexOf(flashes[0]),1);
      }
      run.specialEffects.push(essence.impact);
      trimParticles(240);
    }
    if (!run?.effects?.breakHealEveryFive) return;
    run.blocksBrokenForHeal += 1;
    if (run.blocksBrokenForHeal % 5 !== 0) return;
    spawnSpecialBurst('heal', block.x + block.w / 2, block.y + block.h / 2);
    healRun(5, '5-Й СЛОМАННЫЙ БЛОК');
  }

  function awardRunExperience(block) {
    if (!run || run.ended || !block || block.experienceGranted || block.hazard || block.unbreakable) return;
    block.experienceGranted = true;
    const amount = EXPERIENCE.experienceForBlock(block);
    run.experienceEarned += amount;
    run.experiencePendingGain += amount;
    if (run.experienceHudFrame) return;
    const currentRun = run;
    run.experienceHudFrame = requestAnimationFrame(() => {
      currentRun.experienceHudFrame = 0;
      if (run !== currentRun || run.ended || !els.runExperienceHud) return;
      const gain = currentRun.experiencePendingGain;
      currentRun.experiencePendingGain = 0;
      const stage = EXPERIENCE.stageForRunExperience(currentRun.experienceEarned);
      const tierUp = stage > Number(els.runExperienceHud.dataset.stage || 0);
      if (els.runExperienceScore) els.runExperienceScore.textContent = currentRun.experienceEarned.toLocaleString('ru-RU');
      if (els.runExperienceGain) els.runExperienceGain.textContent = `+${gain}`;
      els.runExperienceHud.dataset.stage = String(stage);
      els.runExperienceHud.setAttribute('aria-label', `Опыт за забег: ${currentRun.experienceEarned}`);
      els.runExperienceHud.classList.remove('is-hit');
      const score = els.runExperienceScore;
      const tierAnimating=!tierUp && els.runExperienceHud.classList.contains?.('is-tier-up')
        && currentRun.experienceHitAnimation?.playState==='running';
      if (!tierAnimating) currentRun.experienceHitAnimation?.cancel();
      if (!menuReducedMotion && !tierAnimating && score?.animate) currentRun.experienceHitAnimation = score.animate([
        {transform:'scale(.94) translateY(1px)'},
        {transform:`scale(${tierUp ? 1.38 : 1.14}) translateY(-3px)`,offset:.38},
        {transform:'scale(1.04)',offset:.76},{transform:'scale(1)'}
      ], {duration:tierUp?580:240,easing:'cubic-bezier(.18,.75,.22,1)'});
      if (!menuReducedMotion && els.runExperienceGain?.animate) {
        currentRun.experienceGainAnimation?.cancel();
        currentRun.experienceGainAnimation=els.runExperienceGain.animate([
          {opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(-3px)',offset:.25},
          {opacity:0,transform:'translateY(-20px)'}
        ],{duration:460,easing:'ease-out'});
      }
      els.runExperienceHud.classList.add('is-hit');
      if (tierUp) {
        els.runExperienceHud.classList.remove('is-tier-up');
        void els.runExperienceHud.offsetWidth;
        els.runExperienceHud.classList.add('is-tier-up');
        clearTimeout(currentRun.experienceTierTimer);
        currentRun.experienceTierTimer=setTimeout(()=>{
          if(run===currentRun)els.runExperienceHud?.classList.remove('is-tier-up');
        },720);
      }
      clearTimeout(currentRun.experiencePulseTimer);
      currentRun.experiencePulseTimer = setTimeout(() => {
        if (run === currentRun) els.runExperienceHud?.classList.remove('is-hit');
      }, 620);
    });
  }

  function awardFlaskData(value) {
    if (!run) return 0;
    const amount = Math.max(0, Math.round(value || 0));
    if (!amount) return 0;
    run.researchData += amount;
    save.researchUnits += amount;
    persist();
    updatePersistentUI();
    if (els.runResearchScore) els.runResearchScore.textContent = run.researchData.toLocaleString('ru-RU');
    if (els.runResearchHud) els.runResearchHud.setAttribute('aria-label', `Колбы за забег: ${run.researchData}`);
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
      spreadFireFromBrokenBlock(block, timestamp);
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
        spreadFireFromBrokenBlock(block, timestamp);
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
      spreadFireFromBrokenBlock(block, timestamp);
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
    if (!count || block.y + block.h < run.cameraY - 90 || block.y > run.cameraY + VIEW_H + 90) return;
    const color = block.elementalSnow||block.elementalSnowflake ? '#bdefff'
      : run.worldId===1 && !block.special && !block.hazard
        ? block.tier==='reinforced'?'#505561':block.tier==='hard'?'#96a4ad':block.topGrass?'#78a844':'#df811f'
        : materialColor(block.material, run.world, 0);
    const feedback = window.SlimeBlockBreakFeedback.emit(block, {color,count,strong,density:effectDensity()});
    run.particles.push(...feedback.particles);
    if (feedback.impact) {
      // Keep burst flashes bounded separately from gameplay effects.
      const flashes=run.specialEffects.filter(effect=>effect.type==='blockBreak');
      if(flashes.length >= (isMobileDevice()?8:12)) {
        run.specialEffects.splice(run.specialEffects.indexOf(flashes[0]),1);
      }
      run.specialEffects.push(feedback.impact);
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
    run.particles = run.particles.filter(p => p.life > 0);
  }

  function spawnSpecialBurst(type, x, y, nx = 0, ny = -1, scale = 1) {
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
      type, x, y, nx, ny, scale, life: config.life, maxLife: config.life
    });
    const particleCount = scaledEffectCount(Math.max(4, Math.round(config.count * scale)), 4);
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

  function startUltimateIntro(type, timestamp) {
    const canvasRect = els.canvas.getBoundingClientRect();
    const buttonRect = els.abilityBtn.getBoundingClientRect();
    const icon = new Image();
    icon.src = els.abilityBtn.querySelector('.ability-icon-color')?.src || versionedAsset('assets/ui/ability-shield-v1-lossless.webp');
    run.ultimateIntro = {
      type, startedAt: timestamp, icon,
      originX: run.slime.x, originY: run.slime.y,
      fromX: canvasRect.width ? clamp((buttonRect.left + buttonRect.width / 2 - canvasRect.left) * VIEW_W / canvasRect.width, 24, VIEW_W - 24) : VIEW_W * .78,
      fromY: canvasRect.height ? clamp((buttonRect.top + buttonRect.height / 2 - canvasRect.top) * VIEW_H / canvasRect.height, 24, VIEW_H - 24) : VIEW_H * .78,
      color: FORM_INDEX.find(form => form.id === type)?.color || '#82eaff'
    };
    sound('epic');
    feedback([12, 20, 12]);
    updateRunUI();
  }

  function activateElementalAbility(timestamp = performance.now()) {
    const type = run?.elementalAbilityType;
    if (!type || run.ultimateIntro || !ELEMENTAL_ABILITY_DURATION_MS[type]) return false;
    if (type === 'nano' && run.mechSuit) return false;
    if (!adminInfiniteUltimate && (run.elementalAbilityCharges <= 0 || run.elementalAbilityActive)) return false;
    if (!adminInfiniteUltimate) {
      run.elementalAbilityCharges -= 1;
      run.ultimateCharge = 0;
    }
    run.ultimateRechargePending = 'elemental';
    startUltimateIntro(type, timestamp);
    return true;
  }

  function commitElementalAbility(type, timestamp, originX, originY) {
    const duration = ELEMENTAL_ABILITY_DURATION_MS[type];
    run.elementalAbilityActive = type;
    run.elementalAbilityUntil = timestamp + duration;
    run.elementalAbilityNextTickAt = timestamp;
    run.elementalAuraId += 1;

    if (type === 'frost') {
      startFrostStorm(timestamp);
      impact('СНЕГОПАД · 6 СЕКУНД');
    } else if (type === 'electric') {
      run.electricStorm = {
        startedAt: timestamp, nextStrikeAt: timestamp + 580,
        strikes: 0, usedTargets: new Set(), flashUntil: 0, endedAt: 0
      };
      impact('ГРОЗОВОЙ ШКВАЛ · 5 УДАРОВ');
    } else if (type === 'fire') {
      const startRow = Math.max(0, Math.floor((originY - run.blockRowOrigin - run.cellSize * .5) / run.cellSize) + 1);
      const endRow = Math.floor((originY + PHOENIX_FIRE_ROWS * run.cellSize - run.blockRowOrigin - run.cellSize * .5) / run.cellSize);
      run.phoenixUltimate = {
        startedAt: timestamp, duration, startRow, endRow, lastRow: startRow - 1,
        originY, x: originX, auraId: run.elementalAuraId
      };
      impact('ФЕНИКС · 100 М');
    } else if (type === 'cosmos') {
      const chargeUntil = timestamp + COSMOS_ULTIMATE_CHARGE_MS;
      run.cosmosUltimate = {
        startedAt: timestamp, chargeUntil,
        fadeStartedAt: timestamp + COSMOS_ULTIMATE_FADE_START_MS,
        launchUntil: run.elementalAbilityUntil, fadeUntil: run.elementalAbilityUntil,
        lastSampleAt: timestamp, ignitedAt: 0, trail: []
      };
      run.gravityDirection = 1;
      run.freezeUntil = 0;
      run.cosmosBoostBlocksLeft = 0;
      run.cosmosReverseReady = false;
      run.cosmosCometCharge = 0;
      run.cosmosCometFadeUntil = 0;
      run.shake = Math.max(run.shake, 4);
      impact('КОМЕТНЫЙ ПРОРЫВ');
    } else if (type === 'gold') {
      run.goldRushUntil = run.elementalAbilityUntil;
      pushElementalEffect('coinArc', run.slime.x, run.slime.y, { toX: run.slime.x, toY: run.slime.y + run.cellSize * 1.8 });
      impact('ЗОЛОТАЯ ЛИХОРАДКА · 3с');
    } else if (type === 'cloning') {
      run.cloneUltimate = { startedAt: timestamp, fired: false, x: originX, y: originY };
      run.emotion = 'power';
      run.emotionUntil = timestamp + CLONE_ULTIMATE_BURST_MS;
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
      impact('СПОРЫ · ПОСЕВ');
    } else if (type === 'glitch') {
      run.emotion = 'surprised';
      run.emotionUntil = timestamp + GLITCH_TITLE_MS;
      startGlitchChoice(timestamp);
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
    } else if (type === 'nano') {
      const landAt = timestamp + MECH_LAND_MS;
      const expireAt = landAt + MECH_ACTIVE_MS;
      run.elementalAbilityUntil = expireAt;
      run.mechSuit = {
        phase: 'descending', startedAt: timestamp, landAt, expireAt,
        nextShotAt: landAt + 280
      };
      run.mechExplosion = null;
      run.nanoShots = [];
      run.nanoMine = null;
      run.freezeUntil = 0;
      run.slime.vx = 0;
      run.slime.vy = 0;
      impact('МЕХА-СЛАЙМ · 10 СЕКУНД');
    } else if (type === 'telekinesis') {
      run.telekinesisUltimatePending = false;
      run.telekinesisCycle = null;
      run.telekinesisMarks = [];
      run.telekinesisBursts = [];
      startTelekinesisPress(timestamp, originY);
      run.elementalAbilityNextTickAt = run.elementalAbilityUntil;
      impact('ПСИОНИЧЕСКИЙ ПРЕСС');
    } else if (type === 'phantom') {
      run.phantomNextAt = timestamp;
      run.damageInvulnerableUntil = Math.max(run.damageInvulnerableUntil, run.elementalAbilityUntil);
      impact('ФАНТОМ · НЕУЯЗВИМОСТЬ');
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
    if (!run || run.ended || run.paused || run.ultimateIntro) return;
    if (run.elementalAbilityType) {
      activateElementalAbility();
      return;
    }
    if (!adminInfiniteUltimate && (run.shieldCharges <= 0 || run.barrier > 0)) return;
    if (!adminInfiniteUltimate) {
      run.shieldCharges -= 1;
      run.ultimateCharge = 0;
    }
    run.ultimateRechargePending = 'shield';
    startUltimateIntro('shield', performance.now());
  }

  function completeUltimateIntro(intro, timestamp) {
    if (intro.type === 'shield') {
      activateDominantShield(timestamp);
      impact('ЩИТ · 1 УДАР');
    } else {
      commitElementalAbility(intro.type, timestamp, intro.originX, intro.originY);
    }
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
    if (els.runResearchHud) els.runResearchHud.setAttribute('aria-label', `Колбы за забег: ${Math.max(0, Math.floor(run.researchData || 0))}`);
    const experienceText = Math.max(0, run.experienceEarned).toLocaleString('ru-RU');
    if (els.runExperienceScore && els.runExperienceScore.textContent !== experienceText) els.runExperienceScore.textContent = experienceText;
    els.routeProgress.style.width = `${routePosition}%`;
    els.routeSlimeMarker.style.left = `${routePosition}%`;
    els.routeTargetLabel.textContent = run.endless ? `∞ · КРУГ ${run.endlessLap}` : `${targetDepth} М`;
    if (els.routePortalIcon && els.routePortalIcon.dataset.world !== String(run.worldId)) {
      els.routePortalIcon.dataset.world = String(run.worldId);
      els.routePortalIcon.src = versionedAsset(`assets/ui/portals/world-${run.worldId}.webp`);
    }
    els.routeTargetLabel.closest('.run-route')?.setAttribute('aria-label', `Пройдено ${currentDepth} метров, портал на ${targetDepth} метрах`);
    els.routeBestLabel.textContent = showPreviousBest ? `ПРОШЛЫЙ ${previousBest} М` : '';
    els.routeBestMarker.style.left = `${bestPosition}%`;
    els.routeBestMarker.classList.toggle('hidden', !showPreviousBest);
    const mechActive = Boolean(run.mechSuit);
    const currentHearts = clamp(Math.round(run.health), 0, 3);
    const now = performance.now();
    els.runHeartHud?.classList.toggle('is-mech', mechActive);
    const heartTitle = els.runHeartHud?.querySelector('.shaft-health-title');
    if (heartTitle) heartTitle.textContent = 'ЖИЗНИ';
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
    const showElemental = Boolean(run.elementalAbilityType);
    const abilityIcons = els.abilityBtn.querySelectorAll('img');
    if (showElemental) {
      const type = run.elementalAbilityType;
      els.abilityBtn.style.setProperty('--ultimate-accent', FORM_INDEX.find(form => form.id === type)?.color || '#52d9f2');
      const labels = {
        frost: 'СНЕГОПАД',
        electric: 'ГРОЗОВОЙ ШКВАЛ',
        fire: 'ПОЛЁТ ФЕНИКСА',
        cosmos: 'КОМЕТНЫЙ ПРОРЫВ',
        nano: 'МЕХА-СЛАЙМ',
        telekinesis: 'ПСИОНИЧЕСКИЙ ПРЕСС',
        phantom: 'ПРИЗРАЧНЫЙ ПРОРЫВ',
        cloning: 'СПОРОВЫЙ ПОСЕВ',
        gold: 'ЗОЛОТАЯ ЛИХОРАДКА',
        mass: 'ТЯЖЁЛЫЙ РЫВОК',
        mobility: 'СКОРОСТНОЙ БУР',
        glitch: 'ГЛИТЧ'
      };
      const icons = {
        frost: 'assets/ui/recipe-categories/emblem-v2-frost.webp',
        electric: 'assets/ui/recipe-categories/emblem-v2-electric.webp',
        fire: 'assets/ui/recipe-categories/emblem-v2-fire.webp',
        cosmos: 'assets/ui/recipe-categories/emblem-v4-cosmos.webp',
        nano: 'assets/ui/recipe-categories/emblem-v4-techno.webp',
        telekinesis: 'assets/ui/recipe-categories/emblem-v4-psionics.webp',
        phantom: 'assets/ui/recipe-categories/emblem-v5-phantom-lossless.webp',
        cloning: 'assets/ui/recipe-categories/emblem-v3-spores.webp',
        gold: 'assets/ui/recipe-categories/gold-aligned.webp',
        mass: 'assets/ui/recipe-categories/weight-aligned.webp',
        mobility: 'assets/ui/recipe-categories/mobility-aligned.webp',
        glitch: 'assets/ui/recipe-categories/emblem-v4-glitch.webp'
      };
      const remaining = Math.max(0, run.elementalAbilityUntil - now);
      const ready = (adminInfiniteUltimate || (run.elementalAbilityCharges > 0 && !elementalActive))
        && !run.mechSuit && !run.ultimateIntro && !run.ended && !run.paused;
      const chargePercent = adminInfiniteUltimate || run.elementalAbilityCharges > 0 ? 100 : Math.floor((run.ultimateCharge || 0) / ULTIMATE_BLOCKS_REQUIRED * 100);
      abilityIcons.forEach(icon => { icon.src = versionedAsset(icons[type] || 'assets/ui/ability-shield-v1-lossless.webp'); });
      els.abilityPercent.textContent = `${chargePercent}%`;
      els.abilityBtn.style.setProperty('--ability', `${chargePercent}%`);
      els.abilityBtn.disabled = !ready;
      els.abilityBtn.classList.toggle('is-charged', chargePercent >= 100);
      els.abilityBtn.classList.toggle('is-ready', ready);
      els.abilityBtn.classList.toggle('is-active', Boolean(elementalActive) && !adminInfiniteUltimate);
      els.abilityBtn.setAttribute('aria-label', ready ? `Активировать: ${labels[type]}` : elementalActive ? `${labels[type]} действует` : `${labels[type]} заряжается: ${Math.floor(run.ultimateCharge || 0)} из ${ULTIMATE_BLOCKS_REQUIRED} блоков`);
      els.abilityText.textContent = run.mechSuit ? run.mechSuit.phase === 'descending' ? 'МЕХ · СТЫКОВКА'
        : `МЕХ · ${(Math.max(0, run.mechSuit.expireAt - now) / 1000).toFixed(1)}с`
        : adminInfiniteUltimate ? `${labels[type]} · ∞ ГОТОВО`
          : elementalActive ? `${labels[type]} · ${(remaining / 1000).toFixed(1)}с`
            : ready ? `${labels[type]} · ГОТОВО` : `${labels[type]} · ${Math.floor(run.ultimateCharge || 0)}/${ULTIMATE_BLOCKS_REQUIRED}`;
      return;
    }

    const charges = clamp(Math.round(run.shieldCharges), 0, run.maxShieldCharges);
    const chargePercent = adminInfiniteUltimate || charges || run.barrier > 0 ? 100 : Math.floor((run.ultimateCharge || 0) / ULTIMATE_BLOCKS_REQUIRED * 100);
    const shieldType = shieldDominant();
    els.abilityBtn.style.setProperty('--ultimate-accent', window.DominantShield.palette(shieldType)[0]);
    const shieldIcon = window.DominantShield.icon(shieldType);
    abilityIcons.forEach(icon => { if (icon.getAttribute('src') !== shieldIcon) icon.src = shieldIcon; });
    els.abilityPercent.textContent = `${chargePercent}%`;
    els.abilityBtn.style.setProperty('--ability', `${chargePercent}%`);
    els.abilityBtn.disabled = (!adminInfiniteUltimate && (charges <= 0 || run.barrier > 0)) || run.ultimateIntro || run.ended || run.paused;
    els.abilityBtn.classList.toggle('is-charged', chargePercent >= 100);
    els.abilityBtn.classList.toggle('is-ready', !els.abilityBtn.disabled);
    els.abilityBtn.classList.toggle('is-active', run.barrier > 0 && !adminInfiniteUltimate);
    els.abilityBtn.setAttribute('aria-label', adminInfiniteUltimate || charges ? 'Активировать щит' : `Щит заряжается: ${Math.floor(run.ultimateCharge || 0)} из ${ULTIMATE_BLOCKS_REQUIRED} блоков`);
    els.abilityText.textContent = adminInfiniteUltimate ? 'ЩИТ · ∞ ГОТОВО' : run.barrier > 0
      ? `ЩИТ · ${Math.max(0,(4000-now+run.barrierStartedAt)/1000).toFixed(1)}с`
      : charges ? 'ЩИТ ГОТОВ' : `ЩИТ · ${Math.floor(run.ultimateCharge || 0)}/${ULTIMATE_BLOCKS_REQUIRED}`;
  }

  function drawFrostStormScene(timestamp) {
    const storm = run.frostStorm;
    if (!storm || !frostStormFlakeSprite.complete || !frostStormFlakeSprite.naturalWidth) return;
    const age = timestamp - storm.startedAt;
    const intensity = clamp(age / 450, 0, 1) * clamp((storm.endAt - timestamp) / 650, 0, 1);
    if (intensity > 0) {
      ctx.save();
      ctx.globalAlpha = intensity * .16;
      ctx.fillStyle = '#8acaff';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      // A handful of sideways gusts gives the storm a direction without a full-screen particle field.
      ctx.lineWidth = 1.3;
      for (let index = 0; index < 9; index += 1) {
        const cycle = age / (760 + index * 43) + index * .17;
        const progress = cycle - Math.floor(cycle);
        const x = progress * (VIEW_W + 110) - 80;
        const y = 35 + index * (VIEW_H - 70) / 9 + Math.sin(age / 440 + index * 2) * 11;
        ctx.globalAlpha = intensity * (.17 + index % 3 * .07);
        ctx.strokeStyle = index % 3 ? '#c9f3ff' : '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x - 24, y + 5);
        ctx.lineTo(x + 28, y - 6);
        ctx.stroke();
      }
      for (let index = 0; index < 6; index += 1) {
        const cycle = age / (2350 + index * 175) + index * .23;
        const progress = cycle - Math.floor(cycle);
        const x = (index * 91 + progress * 105 + age * .065) % (VIEW_W + 36) - 18;
        const y = progress * (VIEW_H + 48) - 24;
        const size = 9 + index % 3 * 2;
        ctx.globalAlpha = intensity * (.24 + index % 3 * .07);
        ctx.drawImage(frostStormFlakeSprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.restore();
    }
    for (const flake of storm.flakes) {
      const progress = clamp((timestamp - flake.startedAt) / flake.duration, 0, 1);
      const fall = Math.pow(progress, 1.28);
      const x = lerp(flake.fromX, flake.toX, progress)
        + Math.sin(progress * 9 + flake.phase) * flake.sway * Math.sin(progress * Math.PI);
      const y = lerp(flake.fromY, flake.toY, fall) - run.cameraY;
      if (y < -35 || y > VIEW_H + 30) continue;
      const size = flake.size * 2.7;
      ctx.drawImage(frostStormFlakeSprite, x - size / 2, y - size / 2, size, size);
    }
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
    drawTelekinesisPressBackdrop(timestamp);

    const visibleBlocks = [];
    const rowOrigin = run.blockRowOrigin || 285;
    const firstVisibleRow = Math.max(0, Math.floor((run.cameraY - 60 - rowOrigin) / run.cellSize));
    const lastVisibleRow = Math.ceil((run.cameraY + VIEW_H + 60 - rowOrigin) / run.cellSize);
    for (let row = firstVisibleRow; row <= lastVisibleRow; row += 1) {
      for (const block of run.blocksByRow?.get(row) || []) {
        if (block.dead) continue;
        const sy = block.y - run.cameraY;
        if (sy < -60 || sy > VIEW_H + 60) continue;
        const press = run.telekinesisPress;
        const movingWithPress = Boolean(press && !press.collided && press.targetSet.has(block));
        if (movingWithPress) {
          const squeeze = telekinesisPressProgress(press, timestamp);
          const centerX = block.x + block.w / 2;
          ctx.save();
          ctx.translate((VIEW_W / 2 - centerX) * squeeze, 0);
          ctx.globalAlpha = 1 - squeeze * .3;
        } else if (!block.motion) visibleBlocks.push(block);
        drawBlock(block, sy, timestamp);
        if (block.phantomMarked) drawPhantomMarkedBlock(block, sy, timestamp);
        if (block.glitchInfected || block.glitchDisperseUntil > timestamp || block.glitchNeutralized || block.glitchDeleteAt > timestamp
          || block.glitchRewriteUntil > timestamp || block.glitchTransformUntil > timestamp) {
          drawGlitchBlockOverlay(block, sy, timestamp);
        }
        if (movingWithPress) ctx.restore();
      }
    }

    // A thin shared grid keeps every tile aligned without blending their art.
    drawBlockTransitions(visibleBlocks);
    drawTelekinesisPressScene(timestamp);
    drawSporeEffects(timestamp);
    drawGlitchShock(timestamp);
    drawFlasks(timestamp);
    drawGeyserCapture(timestamp);
    drawMeteorShowers(timestamp);
    drawSpecialEffects(false);
    drawFrostStormScene(timestamp);
    drawPhantomBursts(timestamp);
    drawTelekinesis(timestamp);

    for (const p of run.particles) {
      const sy = p.y - run.cameraY;
      if (sy < -30 || sy > VIEW_H + 30) continue;
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      if (p.kind === 'debris') {
        window.SlimeBlockBreakFeedback.drawParticle(ctx,p,sy);
      } else if (p.kind === 'portal' || p.kind === 'special') {
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
        } else if (p.shape === 'spore') {
          ctx.save();
          ctx.globalAlpha *= .78;
          ctx.translate(p.x, sy);
          ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
          drawSporeShape(p.size, p.color);
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

    drawSelectedTrail(timestamp);
    drawCosmosUltimateTrail(timestamp);
    drawCloningCharge(timestamp);
    drawGlitchClone(timestamp);
    drawSlime(timestamp);
    drawMechExplosion(timestamp);
    drawMiniSlimes(timestamp);
    drawNanoDrones(timestamp);
    drawHoneyZones(timestamp, true);
    drawJellyZones(timestamp, true);
    drawFreezeZones(timestamp, true);
    drawSpecialEffects(true);
    drawPhoenixUltimate(timestamp);
    drawElectricStormScene(timestamp);
    ctx.restore();
  }

  function drawElectricStormBolt(bolt, timestamp) {
    const elapsed = timestamp - bolt.startedAt;
    if (elapsed < 0 || timestamp >= bolt.until) return;
    const fromY = bolt.fromScreen ? bolt.from.y : bolt.from.y - run.cameraY;
    const toY = bolt.to.y - run.cameraY;
    const reveal = clamp(elapsed / (bolt.trunk ? 155 : 110), 0, 1);
    const endX = lerp(bolt.from.x, bolt.to.x, reveal);
    const endY = lerp(fromY, toY, reveal);
    const dx = endX - bolt.from.x;
    const dy = endY - fromY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const segments = Math.max(3, Math.ceil(distance / (bolt.trunk ? 24 : 18)));
    const wobble = bolt.trunk ? 12 : 5.5;
    const flicker = Math.floor(timestamp / 54);
    const points = [];
    for (let index = 0; index <= segments; index += 1) {
      const fraction = index / segments;
      const noise = Math.sin((bolt.seed + index * 47 + flicker * 19) * 12.9898) * 43758.5453;
      const jitter = (noise - Math.floor(noise) - .5) * 2 * wobble * Math.sin(fraction * Math.PI);
      points.push({
        x: bolt.from.x + dx * fraction - dy / distance * jitter,
        y: fromY + dy * fraction + dx / distance * jitter
      });
    }
    const alpha = clamp(elapsed / 40, 0, 1) * clamp((bolt.until - timestamp) / 190, 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [width, color, shadow] of [
      [bolt.trunk ? 18 : 10, '#168dff', 24],
      [bolt.trunk ? 8 : 4.5, '#3edbff', 13],
      [bolt.trunk ? 3.2 : 2.1, '#fffdda', 6]
    ]) {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowColor = color;
      ctx.shadowBlur = isLowPowerDevice() ? shadow * .45 : shadow;
      ctx.beginPath();
      points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.stroke();
    }
    if (bolt.trunk && elapsed > 90) {
      const bloom = ctx.createRadialGradient(bolt.to.x, toY, 1, bolt.to.x, toY, 41);
      bloom.addColorStop(0, 'rgba(255,255,235,.9)');
      bloom.addColorStop(.24, 'rgba(98,232,255,.62)');
      bloom.addColorStop(1, 'rgba(20,117,255,0)');
      ctx.globalAlpha = alpha * .9;
      ctx.fillStyle = bloom;
      ctx.beginPath(); ctx.arc(bolt.to.x, toY, 41, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawElectricStormScene(timestamp) {
    const storm = run.electricStorm;
    if (storm) {
      const gathering = clamp((timestamp - storm.startedAt) / 580, 0, 1);
      const assemble = 1 - Math.pow(1 - gathering, 3);
      const exit = storm.endedAt ? clamp((timestamp - storm.endedAt) / ELECTRIC_STORM_EXIT_MS, 0, 1) : 0;
      const disperse = 1 - Math.pow(1 - exit, 2);
      const cloudBlend = assemble * (1 - disperse);
      ctx.save();
      ctx.fillStyle = `rgba(3,8,34,${(.12 + assemble * .15) * (1 - exit)})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const charging = !storm.endedAt && storm.strikes < ELECTRIC_STORM_STRIKES
        ? clamp(1 - (storm.nextStrikeAt - timestamp) / 260, 0, 1) : 0;
      const strikeFlash = clamp((storm.flashUntil - timestamp) / 220, 0, 1);
      const cloudGlow = Math.max(charging * .86, strikeFlash);
      if (cloudGlow > 0) {
        const glowX = [...run.electricStormBolts].reverse().find(bolt => bolt.trunk && timestamp >= bolt.startedAt && timestamp < bolt.until)?.from.x || VIEW_W / 2;
        const glowY = 62;
        const glowRadius = Math.max(VIEW_W * .73, 260);
        const chargeLight = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, glowRadius);
        chargeLight.addColorStop(0, `rgba(218,251,255,${cloudGlow * .3})`);
        chargeLight.addColorStop(.23, `rgba(101,206,255,${cloudGlow * .19})`);
        chargeLight.addColorStop(.58, `rgba(38,130,244,${cloudGlow * .07})`);
        chargeLight.addColorStop(1, 'rgba(23,94,210,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = chargeLight;
        ctx.beginPath(); ctx.arc(glowX, glowY, glowRadius, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
      if (timestamp < storm.flashUntil) {
        ctx.fillStyle = `rgba(167,227,255,${clamp((storm.flashUntil - timestamp) / 220, 0, 1) * .25})`;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
      if (electricStormCloudSprite.complete && electricStormCloudSprite.naturalWidth) {
        const width = VIEW_W * .75;
        const height = width * electricStormCloudSprite.naturalHeight / electricStormCloudSprite.naturalWidth;
        const y = -height * .42 + assemble * 8 - disperse * 10 + Math.sin(timestamp / 380) * 3;
        const leftX = lerp(-width * .53, VIEW_W * .29, cloudBlend) + Math.sin(timestamp / 510) * 3;
        const rightX = lerp(VIEW_W + width * .53, VIEW_W * .71, cloudBlend) - Math.sin(timestamp / 470) * 3;
        ctx.globalAlpha = .96 * (1 - exit);
        ctx.shadowColor = cloudGlow ? '#8ddaff' : '#242a35';
        ctx.shadowBlur = isLowPowerDevice() ? 0 : 4 + cloudGlow * 12;
        ctx.drawImage(electricStormCloudSprite, leftX - width / 2, y, width, height);
        ctx.translate(rightX, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(electricStormCloudSprite, -width / 2, y + 4, width, height);
      }
      ctx.restore();
    }
    for (const bolt of run.electricStormBolts || []) drawElectricStormBolt(bolt, timestamp);
  }

  function drawPhoenixUltimate(timestamp) {
    for (const wave of run.phoenixWaves || []) {
      const age = clamp((timestamp - wave.startedAt) / 490, 0, 1);
      const y = wave.y - run.cameraY;
      if (y < -45 || y > VIEW_H + 45) continue;
      ctx.save();
      ctx.globalAlpha = (1 - age) * .78;
      ctx.globalCompositeOperation = 'screen';
      const heat = ctx.createLinearGradient(0, y - 25, 0, y + 25);
      heat.addColorStop(0, 'rgba(255,64,12,0)');
      heat.addColorStop(.45, 'rgba(255,114,19,.32)');
      heat.addColorStop(.5, 'rgba(255,245,147,.92)');
      heat.addColorStop(.55, 'rgba(255,114,19,.32)');
      heat.addColorStop(1, 'rgba(255,64,12,0)');
      ctx.fillStyle = heat;
      ctx.fillRect(0, y - 25, VIEW_W, 50);
      ctx.restore();
    }
    const phoenix = run.phoenixUltimate;
    if (!phoenix || !phoenixUltimateSprite.complete || !phoenixUltimateSprite.naturalWidth) return;
    const progress = clamp((timestamp - phoenix.startedAt) / phoenix.duration, 0, 1);
    const width = Math.min(VIEW_W * .98, Math.max(310, run.cellSize * 4.5));
    const height = width * phoenixUltimateSprite.naturalHeight / phoenixUltimateSprite.naturalWidth;
    const headY = phoenix.originY - run.cellSize * 1.15 + progress * run.cellSize * (PHOENIX_FIRE_ROWS + 1.15) - run.cameraY;
    const x = VIEW_W / 2 + (phoenix.x - VIEW_W / 2) * .25;
    if (headY < -height * .15 || headY > VIEW_H + height) return;
    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 9, (1 - progress) * 9);
    ctx.shadowColor = '#ff781a';
    ctx.shadowBlur = isLowPowerDevice() ? 8 : 18;
    ctx.drawImage(phoenixUltimateSprite, x - width / 2, headY - height * .93, width, height);
    ctx.restore();
  }

  function drawUltimateIntro(timestamp) {
    const intro = run.ultimateIntro;
    if (!intro) return;
    const progress = clamp((timestamp - intro.startedAt) / ULTIMATE_INTRO_MS, 0, 1);
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
      const slimeOverlay = effect.type === 'essenceCollect';
      if (slimeOverlay !== overlayOnly) continue;
      const progress = 1 - clamp(effect.life / effect.maxLife, 0, 1);
      const alpha = Math.pow(1 - progress, .94);
      const y = effect.y - run.cameraY;
      ctx.save();
      if (effect.type === 'blockBreak' || effect.type==='essenceCollect') {
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
      } else if (effect.type === 'snowShard') {
        const toX = Number.isFinite(effect.toX) ? effect.toX : effect.x;
        const toY = Number.isFinite(effect.toY) ? effect.toY : effect.y;
        const flight = 1 - Math.pow(1 - progress, 1.48);
        const shardX = lerp(effect.x, toX, flight);
        const shardY = lerp(effect.y, toY, flight) - run.cameraY - Math.sin(flight * Math.PI) * 34;
        const previousFlight = Math.max(0, flight - .065);
        const trailX = lerp(effect.x, toX, previousFlight);
        const trailY = lerp(effect.y, toY, previousFlight) - run.cameraY - Math.sin(previousFlight * Math.PI) * 34;
        const size = 6.5;
        ctx.globalAlpha = alpha * .68;
        ctx.strokeStyle = '#6fd7ff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#25baff';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.moveTo(trailX, trailY); ctx.lineTo(shardX, shardY); ctx.stroke();
        ctx.translate(shardX, shardY);
        ctx.rotate(progress * Math.PI * 5);
        ctx.globalAlpha = alpha;
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
      } else if (effect.type === 'electricArc') {
        const points = Array.isArray(effect.points) ? effect.points : [];
        const elapsed = (effect.maxLife - effect.life) * 1000;
        for (let index = 1; index < points.length; index += 1) {
          const from = points[index - 1];
          const to = points[index];
          window.BlockEffectDraft.drawElectricLink(ctx, from.x, from.y - run.cameraY,
            to.x, to.y - run.cameraY, elapsed - index * 155 + 125,
            Math.floor(effect.seed || 0) + index);
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
    const worldArtwork = ensureWorldBackground(world.id);
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
    const builtInArtwork = ensureWorldBackground(world.id);
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

  function drawPhantomMarkedBlock(block, sy, timestamp) {
    if (window.BlockEffectDraft?.drawPhantomBlock) {
      prepareElementalBlockCanvas(block.w);
      const dpr = ctx.canvas.width / VIEW_W;
      elementalBlockSpriteCtx.drawImage(ctx.canvas,
        block.x * dpr, sy * dpr, block.w * dpr, block.h * dpr,
        0, 0, elementalBlockSprite.width, elementalBlockSprite.height);
      window.BlockEffectDraft.drawPhantomBlock(ctx, elementalBlockSprite,
        block.x, sy, block.w, timestamp, block.id);
      return;
    }
    const pulse = .66 + Math.sin(timestamp / 260 + block.row * .8 + block.col) * .16;
    const inset = 2.5;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#e9efff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#c8d5f4';
    ctx.shadowBlur = isLowPowerDevice() ? 0 : 8;
    ctx.strokeRect(block.x + inset, sy + inset, block.w - inset * 2, block.h - inset * 2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(218,228,245,.14)';
    ctx.fillRect(block.x + inset + 1, sy + inset + 1, block.w - inset * 2 - 2, block.h - inset * 2 - 2);
    ctx.fillStyle = '#f6f9ff';
    const shimmerX = block.x + block.w * (.23 + .5 * ((timestamp / 1600 + block.col * .31) % 1));
    ctx.beginPath();
    ctx.arc(shimmerX, sy + 5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGlitchBlockOverlay(block, sy, timestamp) {
    const x = block.x;
    const w = block.w;
    const h = block.h;
    const deleting = block.glitchDeleteAt > timestamp;
    const neutralized = block.glitchNeutralized;
    const flashing = block.glitchFlashUntil > timestamp;
    const dispersing = !block.glitchInfected && block.glitchDisperseUntil > timestamp;
    prepareElementalBlockCanvas(w);
    const dpr = ctx.canvas.width / VIEW_W;
    elementalBlockSpriteCtx.drawImage(ctx.canvas,
      x * dpr, sy * dpr, w * dpr, h * dpr,
      0, 0, elementalBlockSprite.width, elementalBlockSprite.height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, sy + 1, w - 2, h - 2);
    ctx.clip();
    ctx.globalAlpha = dispersing ? clamp((block.glitchDisperseUntil - timestamp) / 420, 0, 1) : 1;
    window.BlockEffectDraft.drawGlitchBlock(ctx, elementalBlockSprite, x, sy, w, timestamp, block.id);
    ctx.globalAlpha = 1;
    if (flashing) {
      ctx.fillStyle = 'rgba(224,255,255,.17)';
      ctx.fillRect(x + 2, sy + 2, w - 4, h - 4);
    }
    if (deleting || neutralized) {
      ctx.strokeStyle = deleting ? '#ff657c' : '#70ffe5';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, sy + 2, w - 4, h - 4);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (deleting) {
        ctx.font = `1000 ${Math.max(10, w * .18)}px system-ui`;
        ctx.fillText('ERROR', x + w / 2, sy + h / 2);
      } else {
        ctx.font = `1000 ${Math.max(17, w * .34)}px system-ui`;
        ctx.fillText('✓', x + w / 2, sy + h / 2);
      }
    }
    ctx.restore();
  }

  function drawGlitchShock(timestamp) {
    const shock = run.glitchShock;
    if (!shock) return;
    const progress = (timestamp - shock.startedAt) / 390;
    if (progress >= 1) { run.glitchShock = null; return; }
    const source = shock.source;
    const fromX = source.x + source.w / 2;
    const fromY = source.y + source.h / 2 - run.cameraY;
    if (fromY < -40 || fromY > VIEW_H + 40) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress);
    ctx.lineWidth = 2.5 + (1 - progress) * 2;
    ctx.shadowColor = '#65fff6';
    ctx.shadowBlur = isLowPowerDevice() ? 0 : 8;
    for (const target of shock.targets) {
      if (target === source) continue;
      const toX = target.x + target.w / 2;
      const toY = target.y + target.h / 2 - run.cameraY;
      if (toY < -40 || toY > VIEW_H + 40) continue;
      ctx.strokeStyle = (target.id || 0) % 2 ? '#5ffff2' : '#ff68ef';
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      for (let step = 1; step < 5; step += 1) {
        const t = step / 5;
        const jitter = ((Math.floor(timestamp / 45) * 13 + (target.id || 0) * 17 + step * 23) % 17 - 8) * 1.2;
        ctx.lineTo(lerp(fromX, toX, t) + jitter, lerp(fromY, toY, t) - jitter);
      }
      ctx.lineTo(toX, toY);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGlitchClone(timestamp) {
    const clone = run.glitchClone;
    if (!clone || timestamp >= clone.until) return;
    const y = clone.y - run.cameraY;
    if (y < -100 || y > VIEW_H + 100) return;
    const selected = skinById(save.selectedSkin);
    const fade = clamp((clone.until - timestamp) / 420, 0, 1);
    const stretch = clamp(clone.vy / 900, -.22, .3);
    drawElementalSlimeAvatar(ctx, {
      x: clone.x, y, radius: clone.radius, skin: selected.id, colors: selected.colors,
      emotion: 'focused', hideFace: true, scaleX: 1 - stretch * .42,
      scaleY: 1 + stretch, rotation: clamp(clone.vx / 850, -.24, .24),
      alpha: fade * .9, timestamp
    }, run.categoryVisuals, timestamp);
  }

  let phantomSoulBurstSprite = null;
  function ensurePhantomSoulBurstSprite() {
    if (phantomSoulBurstSprite) return;
    phantomSoulBurstSprite = new Image();
    phantomSoulBurstSprite.src = versionedAsset('assets/vfx/phantom-soul-burst-v2.webp');
  }

  function drawPhantomBursts(timestamp) {
    if (!run.phantomBursts?.length) return;
    run.phantomBursts = run.phantomBursts.filter(burst => timestamp - burst.startedAt < PHANTOM_BURST_MS);
    for (const burst of run.phantomBursts) {
      const age = Math.max(0, timestamp - burst.startedAt);
      const progress = clamp(age / PHANTOM_BURST_MS, 0, .999);
      const radius = run.cellSize * (1 + progress * 1.65);
      const screenY = burst.y - run.cameraY;
      if (screenY < -radius || screenY > VIEW_H + radius) continue;
      ctx.save();
      ctx.translate(burst.x, screenY);
      if (phantomSoulBurstSprite?.complete && phantomSoulBurstSprite.naturalWidth) {
        const spread = 1 - Math.pow(1 - progress, 3);
        const size = run.cellSize * (.9 + spread * 2.55);
        ctx.globalAlpha = (1 - progress) * (1 - progress) * .92;
        ctx.rotate(progress * .11);
        ctx.drawImage(phantomSoulBurstSprite, -size / 2, -size / 2, size, size);
        ctx.rotate(-progress * .11);
      }
      ctx.globalAlpha = (1 - progress) * (1 - progress) * .78;
      for (let i = 0; i < 9; i += 1) {
        const angle = i * Math.PI * 2 / 9 + (i % 2 ? .12 : -.1);
        const distance = run.cellSize * (.28 + progress * (1.1 + (i % 3) * .2));
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        ctx.strokeStyle = i % 3 ? '#b9fff5' : '#f5ffff';
        ctx.lineWidth = Math.max(.7, 2.6 * (1 - progress));
        ctx.beginPath();
        ctx.moveTo(dx * (distance - run.cellSize * .25), dy * (distance - run.cellSize * .25));
        ctx.lineTo(dx * distance, dy * distance);
        ctx.stroke();
      }
      ctx.restore();
    }
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
      prepareElementalBlockCanvas(w);
      window.BlockEffectDraft.drawBurningBlock(elementalBlockCtx, 0, 0, w, timestamp, block.id);
      ctx.globalAlpha = ignite * release;
      ctx.drawImage(elementalBlockCanvas, 0, 0, w, w, x, sy, w, h);
      ctx.globalAlpha = 1;
    }

    if (timestamp >= (block.electricFlashStartedAt || 0) && timestamp < (block.electricFlashUntil || 0)) {
      prepareElementalBlockCanvas(w);
      const dpr = ctx.canvas.width / VIEW_W;
      elementalBlockSpriteCtx.drawImage(ctx.canvas, x * dpr, sy * dpr, w * dpr, h * dpr, 0, 0, w, w);
      window.BlockEffectDraft.drawElectricShockBlock(ctx, elementalBlockSprite,
        x, sy, w, timestamp - block.electricFlashStartedAt, block.id);
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
      block.visualCrackChangedAt = previous === undefined || previous > stage ? timestamp - 280 : timestamp;
    }
    if (!stage || !window.BlockEffectDraft?.drawCrackedBlock) return false;
    window.BlockEffectDraft.drawCrackedBlock(ctx, block.x, sy, block.w, stage,
      timestamp, block.visualCrackChangedAt, block.id);
    return true;
  }

  function drawSpecialBlockAura(block, sy) {
    const auraKey = block.hazard ? 'hazard' : block.special;
    if (block.hazard && run.worldId === 1) return;
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
    const firstWorldSpikeEnemy = block.hazard && run.worldId === 1 && !frostTransformed;
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

    // Keep the original stone pixels; only the resource veins are layered on top.
    const liquidVeinName = run.worldId === 1 && block.flaskTier && !frostIsPrimary && !block.special && !block.hazard
      ? block.tier === 'reinforced' ? 'stone-reinforced-liquid'
        : block.tier === 'hard' ? 'stone-liquid' : 'ground-weak-liquid'
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
    if (!sprite?.complete || !sprite.naturalWidth) return false;

    // Leave a single-pixel gutter for the grid instead of letting tiles overlap.
    const gutter = .5;
    // Damage is communicated only by the crack overlay. The underlying artwork
    // remains fully opaque and keeps its original colour at every health value.
    ctx.globalAlpha = 1;
    const scale = firstWorldSpikeEnemy ? .92 : customSprite ? (artwork.scale || 1) : 1;
    const width = Math.max(1, block.w * scale - gutter * 2);
    const height = Math.max(1, block.h * scale - gutter * 2);
    const offsetX = customSprite ? block.w * (artwork.x || 0) / 100 : 0;
    const offsetY = customSprite ? block.h * (artwork.y || 0) / 100 : 0;
    const drawX = block.x + (block.w - width) / 2 + offsetX;
    const drawY = sy + (block.h - height) / 2 + offsetY;
    if (firstWorldSpikeEnemy) {
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
      const liquidVeins = liquidVeinName && WORLD_SPRITES[1]?.[liquidVeinName];
      if (liquidVeins?.complete && liquidVeins.naturalWidth) {
        ctx.drawImage(liquidVeins, drawX, drawY, width, height);
      }
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
    drawCrackStage(block, sy, hpRatio, timestamp);

    return true;
  }

  function drawBlockTransitions(visibleBlocks) {
    const liveBlocks = new Map();
    for (const block of visibleBlocks) {
      // Floating round enemies are not stone tiles and must not acquire square seams.
      if (block.hazard && run.worldId === 1) continue;
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
    const levels = { fire: 0, frost: 0, electric: 0, cosmos: 0, nano: 0, telekinesis: 0, cloning: 0, phantom: 0, glitch: 0, mass: 0 };
    const familyToCategory = {
      fire: 'fire', damage: 'fire',
      frost: 'frost', ice: 'frost',
      electric: 'electric', electricity: 'electric',
      cosmos: 'cosmos', space: 'cosmos', gravity: 'cosmos',
      nano: 'nano',
      telekinesis: 'telekinesis',
      cloning: 'cloning',
      phantom: 'phantom',
      glitch: 'glitch',
    };
    for (const food of session?.foods || []) {
      const family = foodRecipeFamily(food);
      const category = familyToCategory[family];
      if (category) levels[category] += 1;
    }
    for (const key of Object.keys(levels)) levels[key] = Math.min(3, levels[key]);
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

  function revealMenuMutation() {
    const levels = menuCategoryLevels();
    const changed = Object.keys(levels).find(key => levels[key] !== menuCategoryVisual[`${key}Target`]);
    if (!changed) return 0;
    const ultra = levels[changed] === 3 && menuCategoryVisual[`${changed}Target`] < 3;
    const now = performance.now();
    const silhouetteSource = drawMenuSlime(now, ultra);
    menuMutationReveal = window.MenuMutationReveal.create(els.menuSlimeCanvas,
      { now, ultra, reducedMotion: menuReducedMotion, silhouetteSource });
    const reveal = menuMutationReveal;
    reveal.assetsReady = false;
    preloadMenuAppearance(levels).then(() => { reveal.assetsReady = true; }, () => { reveal.assetsReady = true; });
    syncMenuCategoryVisuals({ instant: true });
    els.slime.classList.add(ultra ? 'form-discovering' : 'mutation-evolving');
    syncWorldStartButton(stomachCanLaunch());
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
    };
    reveal.timer = setTimeout(finishReveal, reveal.duration);
    return reveal.duration;
  }

  function syncMenuCategoryVisuals({ instant = false } = {}) {
    const levels = menuCategoryLevels();
    const now = performance.now();
    for (const key of ['fire', 'frost', 'electric', 'cosmos', 'nano', 'telekinesis', 'cloning', 'phantom', 'glitch', 'mass']) {
      menuCategoryVisual[`${key}From`] = instant ? levels[key] : menuCategoryVisual[key];
      menuCategoryVisual[`${key}Target`] = levels[key];
      menuCategoryVisual[`${key}StartedAt`] = now;
      if (instant) menuCategoryVisual[key] = levels[key];
    }
  }

  function updateMenuCategoryVisuals(timestamp) {
    for (const key of ['fire', 'frost', 'electric', 'cosmos', 'nano', 'telekinesis', 'cloning', 'phantom', 'glitch', 'mass']) {
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

  function preloadMenuAppearance(levels) {
    const bodyVariant = levels.frost >= 3 ? 'frostUltra' : levels.cosmos >= 3 ? 'cosmosUltra'
      : levels.nano >= 3 ? 'technoUltra' : levels.electric >= 3 ? 'electricUltra'
      : levels.fire >= 3 ? 'fireUltra' : levels.telekinesis >= 3 ? 'psionicsUltra'
      : levels.phantom >= 3 ? 'phantomUltra' : levels.cloning >= 3 ? 'sporesUltra'
      : levels.glitch >= 3 ? 'glitchUltra' : levels.cloning ? 'sporesStage1' : '';
    return Promise.all([
      window.SlimeAvatarRenderer.preloadAppearance({ bodyVariant,
        fireEyes: bodyVariant === 'fireUltra', electricEyes: bodyVariant === 'electricUltra',
        frostEyes: bodyVariant === 'frostUltra', cosmosEyes: bodyVariant === 'cosmosUltra',
        sporesEyes: bodyVariant === 'sporesUltra', psionicsEyes: levels.telekinesis >= 2,
        phantomEyes: levels.phantom >= 2, glitchFaceLevel: levels.glitch,
        nanoEyeOpenness: levels.nano >= 2 ? 0 : null }),
      window.MutationEffectDraft.preload(levels)
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
      const bodyVariant = frostLevel >= 3 ? 'frostUltra' : cosmosLevel >= 3 ? 'cosmosUltra'
        : nanoLevel >= 3 ? 'technoUltra' : electricLevel >= 3 ? 'electricUltra'
        : fireLevel >= 3 ? 'fireUltra' : psionicsLevel >= 3 ? 'psionicsUltra'
        : phantomLevel >= 3 ? 'phantomUltra' : sporesLevel >= 3 ? 'sporesUltra'
        : glitchLevel >= 3 ? 'glitchUltra'
        : sporesLevel ? 'sporesStage1' : '';
      const motion = psionicsLevel >= 2
        ? window.MutationEffectDraft.psionicsMotion(timestamp, options.radius)
        : { offset: 0, energy: 0 };
      const draftState = {
        x: options.x, y: options.y + motion.offset, baseY: options.y,
        radius: options.radius, timestamp, psionicsEnergy: motion.energy,
        effectDetail: effectDensity(),
        phantomActive: Boolean(options.phantomActive),
        bodyTransform: {rotation:options.rotation||0,scaleX:options.scaleX??1,scaleY:options.scaleY??1},
        // Gameplay draws the real drones separately so their position also drives shots.
        levels: { fire: fireLevel, frost: frostLevel, electric: electricLevel, cosmos: cosmosLevel,
          telekinesis: psionicsLevel, cloning: sporesLevel, phantom: phantomLevel, glitch: glitchLevel, nano: 0 }
      };
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
        psionicsEyes: psionicsLevel >= 2,
        phantomEyes: phantomLevel >= 2,
        sporesEyes: bodyVariant === 'sporesUltra',
        nanoEyeOpenness: nanoLevel >= 2
          ? (options.nanoEyeOpenness ?? (run && target === ctx
            ? nanoRunEyeOpenness(timestamp) : window.MutationEffectDraft.nanoEyeOpenness(timestamp))) : null,
        irisTint: bodyVariant === 'frostUltra' ? '#3a9fff' : bodyVariant === 'cosmosUltra' ? '#a576ff'
          : bodyVariant === 'technoUltra' ? '#f04a55' : bodyVariant === 'electricUltra' ? '#ffd84e'
          : bodyVariant === 'fireUltra' ? '#ff9a22' : bodyVariant === 'psionicsUltra' ? '#8d5cff'
          : bodyVariant === 'sporesUltra' ? '#ce782f' : bodyVariant === 'glitchUltra' ? '#d8ff50' : '',
        cheekFilter: frostLevel ? 'hue-rotate(195deg) saturate(.85) brightness(1.08) contrast(1.06)' : '',
        mouthStyle: frostLevel && window.MutationEffectDraft.isFrostBreathing(timestamp) ? 'pursed' : '',
        bodyFilter: !options.preservePhantomBody && phantomLevel >= 2 && phantomLevel < 3
          ? 'grayscale(1) brightness(1.8) contrast(.85)' : '',
        outlineColor: phantomLevel && !options.preservePhantomBody ? '#d8f7ff' : options.outlineColor,
        frontLayer: frostLevel >= 2 && frostLevel < 3
          ? (layerTarget, layerState) => {
            if (typeof options.frontLayer === 'function') options.frontLayer(layerTarget, layerState);
            window.MutationEffectDraft.drawInside(layerTarget, {
              ...draftState, levels: { ...draftState.levels, frost: 2 }
            });
          }
          : options.frontLayer
      });
      window.MutationEffectDraft.drawFront(target, draftState);
      window.MutationEffectDraft.drawComposite(target, draftState);
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
    els.menuSlimeCanvas.width = Math.round(260 * dpr);
    els.menuSlimeCanvas.height = Math.round(260 * dpr);
    menuSlimeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    menuSlimeCtx.imageSmoothingEnabled = true;
    menuSlimeCtx.imageSmoothingQuality = 'high';
    menuEdgeFade = menuSlimeCtx.createRadialGradient(130, 130, 102, 130, 130, 128);
    menuEdgeFade.addColorStop(0, '#000');
    menuEdgeFade.addColorStop(1, 'transparent');
  }

  function drawMenuSlime(timestamp, captureSilhouette = false) {
    const paintStartedAt = performance.now();
    menuSlimeCtx.clearRect(0, 0, 260, 260);
    const categoryVisual = updateMenuCategoryVisuals(timestamp);
    const emotion = menuSlimeEmotion();
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
      skin: selected.id,
      colors: selected.colors,
      gazeX: menuGaze.x, gazeY: menuGaze.y,
      emotionTime,
      blink: emotion === 'focused' && blinkPhase > 4420 && blinkPhase < 4530,
      petPoint: els.slime.classList.contains('petting') ? menuPetPoint : null,
      nanoEyeOpenness: categoryVisual.nano >= 2 ? 0 : null,
      timestamp
    };
    menuSlimeCtx.save();
    menuSlimeCtx.translate(130, restingBottom + 7); menuSlimeCtx.scale(1, .15);
    const contactShadow = menuSlimeCtx.createRadialGradient(0, 0, 6, 0, 0, radius * .95);
    contactShadow.addColorStop(0, 'rgba(10,36,46,.23)');
    contactShadow.addColorStop(.52, 'rgba(10,36,46,.11)');
    contactShadow.addColorStop(1, 'rgba(10,36,46,0)');
    menuSlimeCtx.fillStyle = contactShadow;
    menuSlimeCtx.beginPath(); menuSlimeCtx.arc(0, 0, radius * .95, 0, Math.PI * 2); menuSlimeCtx.fill();
    menuSlimeCtx.restore();
    const showAvatar = !menuMutationReveal || window.MenuMutationReveal.needsCurrent(menuMutationReveal, timestamp);
    if (showAvatar) drawElementalSlimeAvatar(menuSlimeCtx, menuAvatarOptions, categoryVisual, timestamp);
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
    trackGraphicsCost(performance.now() - paintStartedAt);
    if (captureSilhouette) {
      const mask = document.createElement('canvas');
      mask.width = els.menuSlimeCanvas.width;
      mask.height = els.menuSlimeCanvas.height;
      const target = mask.getContext('2d');
      target.scale(mask.width / 260, mask.height / 260);
      const bodyVariants = { frost: 'frostUltra', cosmos: 'cosmosUltra', nano: 'technoUltra',
        electric: 'electricUltra', fire: 'fireUltra', telekinesis: 'psionicsUltra',
        phantom: 'phantomUltra', cloning: 'sporesUltra', glitch: 'glitchUltra' };
      const family = Object.keys(bodyVariants).find(id => categoryVisual[id] >= 3);
      const motion = categoryVisual.telekinesis >= 2
        ? window.MutationEffectDraft.psionicsMotion(timestamp, radius).offset : 0;
      drawSlimeAvatar(target, { ...menuAvatarOptions, y: slimeY + motion, hideFace: true,
        bodyVariant: family ? bodyVariants[family] : categoryVisual.cloning ? 'sporesStage1' : '' });
      return mask;
    }
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
    if (type === 'frost' || type === 'fire' || type === 'electric' || type === 'nano') return; // Their effects are drawn over the shaft.
    const remaining = clamp((run.elementalAbilityUntil - timestamp) / (ELEMENTAL_ABILITY_DURATION_MS[type] || 1), 0, 1);
    ctx.save();
    if (type === 'telekinesis') {
      const press = run.telekinesisPress;
      if (press) {
        const age = timestamp - press.startedAt;
        const rise = clamp(age / 260, 0, 1);
        const fade = press.collided ? 1 - clamp((age - TELEKINESIS_PRESS_COLLIDE_MS) / 850, 0, 1) : 1;
        const energy = rise * fade;
        const crownY = y - radius * 1.8;
        const pulse = 1 + Math.sin(timestamp / 55) * .12;
        const glow = ctx.createRadialGradient(x, crownY, 2, x, crownY, radius * 2.2);
        glow.addColorStop(0, `rgba(243,255,255,${energy * .9})`);
        glow.addColorStop(.24, `rgba(105,211,255,${energy * .55})`);
        glow.addColorStop(1, 'rgba(75,96,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, crownY, radius * 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = energy;
        ctx.shadowColor = '#7dbfff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#e6ffff';
        ctx.strokeStyle = '#699aff';
        ctx.lineWidth = 3;
        const height = radius * .65 * pulse;
        ctx.beginPath();
        ctx.moveTo(x, crownY - height);
        ctx.lineTo(x + radius * .35, crownY);
        ctx.lineTo(x, crownY + height);
        ctx.lineTo(x - radius * .35, crownY);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#b5daff';
        ctx.lineWidth = 2;
        for (let arc = 0; arc < 3; arc += 1) {
          const orbit = radius * (1 + arc * .28 + Math.sin(timestamp / 120 + arc) * .045);
          ctx.beginPath();
          ctx.ellipse(x, crownY, orbit, orbit * .34, Math.sin(timestamp / 260 + arc) * .25,
            timestamp / (310 + arc * 70), timestamp / (310 + arc * 70) + Math.PI * 1.2);
          ctx.stroke();
        }
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
    if (elementalLevel('cosmos') < 2) return 0;
    if (cosmosBoostActive()) return 1;
    if (timestamp < (run.cosmosCometFadeUntil || 0)) {
      return clamp((run.cosmosCometFadeUntil - timestamp) / 420, 0, 1);
    }
    return clamp(run.cosmosCometCharge || 0, 0, 1);
  }

  function drawCosmosCometVisual(timestamp, x, y, radius, front = false) {
    const strength = cosmosCometVisualStrength(timestamp);
    if (strength <= .01) return;
    const ultimate = run.cosmosUltimate;
    const ultra = ultimate && timestamp >= ultimate.chargeUntil && timestamp < ultimate.fadeUntil
      ? cosmosUltimatePower(ultimate, timestamp) : 0;
    const active = cosmosBoostActive() || ultra > 0;
    const ignition = run.cosmosCometIgnitedAt
      ? clamp(1 - (timestamp - run.cosmosCometIgnitedAt) / 520, 0, 1)
      : 0;
    const pulse = .5 + Math.sin(timestamp / 72) * .5;
    const wakeLength = radius * (.45 + strength * 1.72 + (active ? .78 + pulse * .2 : 0)) * (1 + ultra * 1.35);
    const wakeWidth = radius * (.55 + strength * .32 + (active ? .12 : 0)) * (1 + ultra * .85);

    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    if (!front) {
      const flame = ctx.createLinearGradient(0, radius * .88, 0, -wakeLength);
      flame.addColorStop(0, `rgba(255,244,255,${strength * (.66 + strength * .3)})`);
      flame.addColorStop(.22, `rgba(226,120,255,${strength * (.58 + strength * .34)})`);
      flame.addColorStop(.6, `rgba(121,42,255,${strength * (.4 + strength * .28)})`);
      flame.addColorStop(1, 'rgba(46,16,155,0)');
      ctx.fillStyle = flame;
      ctx.shadowColor = '#9d45ff';
      ctx.shadowBlur = 13 + strength * 16 + ultra * 28;
      const sway = Math.sin(timestamp / 64) * radius * .09;
      ctx.beginPath();
      ctx.moveTo(-radius * .84, radius * .34);
      ctx.bezierCurveTo(-radius * 1.02, -radius * .08, -wakeWidth * .72, -wakeLength * .62, sway, -wakeLength);
      ctx.bezierCurveTo(wakeWidth * .72, -wakeLength * .62, radius * 1.02, -radius * .08, radius * .84, radius * .34);
      ctx.quadraticCurveTo(0, radius * 1.04, -radius * .84, radius * .34);
      ctx.closePath();
      ctx.fill();

      const inner = ctx.createLinearGradient(0, radius * .72, 0, -wakeLength * .74);
      inner.addColorStop(0, `rgba(255,255,255,${strength * (.58 + strength * .38)})`);
      inner.addColorStop(.28, `rgba(238,173,255,${strength * (.5 + strength * .34)})`);
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

      ctx.globalAlpha = strength * (.36 + strength * .38);
      ctx.strokeStyle = '#bc66ff';
      ctx.lineWidth = 2 + strength * 2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * radius * .82, radius * .28);
        ctx.bezierCurveTo(side * radius * 1.04, -radius * .25, side * wakeWidth * .82, -wakeLength * .55, sway, -wakeLength * .94);
        ctx.stroke();
      }
    } else {
      ctx.globalAlpha = strength * (.42 + strength * .56);
      ctx.strokeStyle = active ? '#fff4ff' : '#dfadff';
      ctx.lineWidth = 3 + strength * 3.6;
      ctx.shadowColor = '#922fff';
      ctx.shadowBlur = 12 + strength * 18;
      ctx.beginPath();
      ctx.arc(0, 0, radius * (1.03 + strength * .055), Math.PI * .04, Math.PI * .96);
      ctx.stroke();
      ctx.globalAlpha = strength * (.22 + strength * .42);
      ctx.strokeStyle = '#9e42ff';
      ctx.lineWidth = 2 + strength * 1.5;
      ctx.beginPath();
      ctx.arc(0, radius * .04, radius * (1.18 + strength * .08), Math.PI * .12, Math.PI * .88);
      ctx.stroke();

      const sparks = ultra > 0 ? 22 : active ? 12 : 7;
      for (let index = 0; index < sparks; index += 1) {
        const phase = (timestamp / (310 + index * 13) + index * .173) % 1;
        const side = index % 2 ? 1 : -1;
        const sparkY = radius * .36 - phase * (wakeLength + radius * .12);
        const sparkX = side * radius * (.42 + (index % 3) * .2) * (1 - phase * .58) + Math.sin(timestamp / 90 + index * 2.4) * 3;
        ctx.globalAlpha = strength * (1 - phase) * (.35 + strength * .65);
        ctx.fillStyle = index % 3 ? '#c86bff' : '#fff4ff';
        ctx.beginPath(); ctx.arc(sparkX, sparkY, 1.3 + strength * 1.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  function telekinesisPressScreenBounds(press) {
    return {
      top: Math.max(0, press.topY - run.cameraY),
      bottom: Math.min(VIEW_H, press.bottomY - run.cameraY)
    };
  }

  function drawTelekinesisPressBackdrop(timestamp) {
    const press = run.telekinesisPress;
    if (!press || press.collided) return;
    const { top, bottom } = telekinesisPressScreenBounds(press);
    if (bottom <= top) return;
    const progress = telekinesisPressProgress(press, timestamp);
    const front = progress * VIEW_W * .5;
    ctx.save();
    ctx.globalAlpha = .18 + progress * .2;
    ctx.fillStyle = '#3675c9';
    ctx.fillRect(0, top, front, bottom - top);
    ctx.fillRect(VIEW_W - front, top, front, bottom - top);
    ctx.restore();
  }

  function drawTelekinesisPressScene(timestamp) {
    const press = run.telekinesisPress;
    if (!press) return;
    const { top, bottom } = telekinesisPressScreenBounds(press);
    if (bottom <= top) return;
    const elapsed = timestamp - press.startedAt;
    const progress = telekinesisPressProgress(press, timestamp);
    const middle = VIEW_W / 2;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, top, VIEW_W, bottom - top); ctx.clip();
    if (!press.collided) {
      const front = Math.max(2, progress * (middle - 4));
      const breathe = .78 + Math.sin(timestamp / 47) * .22;
      const strokeWall = x => {
        ctx.beginPath();
        for (let sy = top - 9, index = 0; sy <= bottom + 12; sy += 16, index += 1) {
          const wobble = Math.sin(sy * .09 + timestamp * .024) * 4
            + Math.sin(sy * .21 - timestamp * .033) * 2;
          if (!index) ctx.moveTo(x + wobble, sy);
          else ctx.lineTo(x + wobble, sy);
        }
        ctx.stroke();
      };
      ctx.globalAlpha = (.48 + progress * .45) * breathe;
      ctx.shadowColor = '#5fcaff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#71bfff';
      ctx.lineWidth = 7 + progress * 5;
      for (const x of [front, VIEW_W - front]) strokeWall(x);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#e6faff';
      ctx.lineWidth = 2;
      for (const x of [front, VIEW_W - front]) strokeWall(x);
      ctx.globalAlpha = progress * .55;
      ctx.strokeStyle = '#91b5ff';
      ctx.lineWidth = 1.6;
      for (let y = press.topY; y < press.bottomY; y += run.cellSize * 2) {
        const sy = y - run.cameraY;
        if (sy < top - 12 || sy > bottom + 12) continue;
        ctx.beginPath();
        ctx.moveTo(front, sy - 9);
        ctx.lineTo(front + 13, sy);
        ctx.lineTo(front, sy + 9);
        ctx.moveTo(VIEW_W - front, sy - 9);
        ctx.lineTo(VIEW_W - front - 13, sy);
        ctx.lineTo(VIEW_W - front, sy + 9);
        ctx.stroke();
      }
    } else {
      const release = clamp((elapsed - TELEKINESIS_PRESS_COLLIDE_MS) / TELEKINESIS_PRESS_FADE_MS, 0, 1);
      const strength = 1 - release;
      const blast = ctx.createLinearGradient(middle - 80, 0, middle + 80, 0);
      blast.addColorStop(0, 'rgba(99,114,255,0)');
      blast.addColorStop(.5, `rgba(204,244,255,${strength * .85})`);
      blast.addColorStop(1, 'rgba(99,114,255,0)');
      ctx.globalAlpha = strength;
      ctx.fillStyle = blast;
      ctx.fillRect(0, top, VIEW_W, bottom - top);
      ctx.globalAlpha = strength * .78;
      ctx.strokeStyle = '#ddfaff';
      ctx.shadowColor = '#6b8dff';
      ctx.shadowBlur = 16;
      ctx.lineWidth = Math.max(1, 5 - release * 4);
      for (let y = press.topY + run.cellSize; y < press.bottomY; y += run.cellSize * 2) {
        const sy = y - run.cameraY;
        if (sy < top - 20 || sy > bottom + 20) continue;
        ctx.beginPath();
        ctx.ellipse(middle, sy, 12 + release * VIEW_W * .6, 7 + release * run.cellSize * .65, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawTelekinesis(timestamp) {
    if (!run.telekinesisMarks.length && !run.telekinesisCycle && !run.telekinesisBursts.length) return;
    ctx.save();
    for (const mark of run.telekinesisMarks) {
      const progress = clamp((timestamp - mark.startedAt) / mark.duration, 0, 1);
      const sy = mark.y - run.cameraY;
      ctx.globalAlpha = (1 - progress) * .88;
      ctx.shadowColor = '#65bfff';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#b5dcff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(mark.x + 4, sy + 4, mark.w - 8, mark.h - 8);
      ctx.fillStyle = 'rgba(65,160,255,.22)';
      ctx.fillRect(mark.x + 4, sy + 4, mark.w - 8, mark.h - 8);
    }
    ctx.shadowBlur = 0;
    const cycle = run.telekinesisCycle;
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
      if (elapsed < orbitAt) {
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
      ctx.save();
      ctx.globalAlpha = .9;
      ctx.fillStyle = 'rgba(65,173,255,.25)';
      ctx.fillRect(x - projectile.visual.w * scale * .62, screenY - projectile.visual.h * scale * .62,
        projectile.visual.w * scale * 1.24, projectile.visual.h * scale * 1.24);
      ctx.translate(x, screenY);
      ctx.rotate(Math.sin(elapsed / 165 + projectile.index) * .09);
      ctx.scale(scale, scale);
      ctx.translate(-source.x, -(source.y - run.cameraY));
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#63bfff';
      ctx.shadowBlur = 13;
      drawBlock(projectile.visual, projectile.visual.y - run.cameraY, timestamp);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#9ed9ff';
      ctx.lineWidth = 2.4;
      ctx.strokeRect(projectile.visual.x + 1, projectile.visual.y - run.cameraY + 1,
        projectile.visual.w - 2, projectile.visual.h - 2);
      ctx.restore();
    }
    for (const burst of run.telekinesisBursts) {
      const t = clamp((timestamp - burst.startedAt) / 330, 0, 1);
      const sy = burst.y - run.cameraY;
      const radius = run.cellSize * (0.38 + t * 1.1);
      ctx.globalAlpha = (1 - t) * .8;
      ctx.strokeStyle = '#99d4ff';
      ctx.lineWidth = 4 - t * 2.5;
      ctx.shadowColor = '#58aaff';
      ctx.shadowBlur = 11;
      ctx.beginPath(); ctx.arc(burst.x, sy, radius, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = (1 - t) * .13;
      ctx.fillStyle = '#62b4ff';
      const cell = run.cellSize;
      for (const [col, row] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) {
        ctx.fillRect(burst.x + (col - .5) * cell, sy + (row - .5) * cell, cell, cell);
      }
    }
    ctx.restore();
  }

  function drawNanoDroneSprite(target, x, y, size, alpha = 1) {
    const sprite = projectSprite(NANO_DRONE_SPRITE);
    target.save();
    target.globalAlpha = alpha;
    if (sprite?.complete && sprite.naturalWidth) {
      target.drawImage(sprite, x - size / 2, y - size / 2, size, size);
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

  function drawMechSuit(timestamp, avatarOptions) {
    const mech = run.mechSuit;
    if (!mech) return;
    const size = run.cellSize * MECH_VISUAL_CELLS;
    const x = run.slime.x;
    const restingY = run.slime.y - run.cameraY;
    const descent = mech.phase === 'descending'
      ? clamp((timestamp - mech.startedAt) / MECH_LAND_MS, 0, 1) : 1;
    const eased = 1 - Math.pow(1 - descent, 3);
    const y = restingY - (1 - eased) * (VIEW_H * .47 + size);
    const steering = fallSteeringVector();
    const jetPower = mech.phase === 'descending' ? 1
      : steering.y < -.12 ? 1 : Math.abs(steering.x) > .12 ? .55 : 0;
    ctx.save();
    ctx.translate(x, y);
    if (mech.phase === 'descending') ctx.globalAlpha = clamp(descent * 4, 0, 1);
    if (jetPower > 0) for (const side of [-1, 1]) {
      // The two painted lower nozzles sit at x≈160/352 and y≈390 in the sprite.
      const flameX = side * size * .19;
      const flameY = size * .32;
      const pulse = .92 + Math.sin(timestamp / 145 + side * .7) * .08;
      const flameLength = size * (mech.phase === 'descending' ? .3 : .39 * jetPower) * pulse;
      const width = size * .075;
      const outer = ctx.createLinearGradient(flameX, flameY, flameX, flameY + flameLength);
      outer.addColorStop(0, 'rgba(255,246,202,.95)');
      outer.addColorStop(.32, 'rgba(255,157,54,.9)');
      outer.addColorStop(.72, 'rgba(255,65,44,.63)');
      outer.addColorStop(1, 'rgba(255,44,47,0)');
      ctx.save();
      ctx.shadowColor = '#ff5132'; ctx.shadowBlur = size * .09;
      ctx.fillStyle = outer;
      ctx.beginPath();
      ctx.moveTo(flameX - width, flameY);
      ctx.bezierCurveTo(flameX - width * 1.12, flameY + flameLength * .36,
        flameX - width * .48, flameY + flameLength * .75, flameX, flameY + flameLength);
      ctx.bezierCurveTo(flameX + width * .48, flameY + flameLength * .75,
        flameX + width * 1.12, flameY + flameLength * .36, flameX + width, flameY);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff2bd';
      ctx.globalAlpha *= .7;
      ctx.beginPath();
      ctx.moveTo(flameX - width * .38, flameY + size * .018);
      ctx.quadraticCurveTo(flameX - width * .24, flameY + flameLength * .55,
        flameX, flameY + flameLength * .73);
      ctx.quadraticCurveTo(flameX + width * .24, flameY + flameLength * .55,
        flameX + width * .38, flameY + size * .018);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    if (technoMechSprite.complete && technoMechSprite.naturalWidth) {
      ctx.drawImage(technoMechSprite, -size / 2, -size / 2, size, size);
    } else {
      ctx.fillStyle = '#30414b';
      ctx.strokeStyle = '#f64b55';
      ctx.lineWidth = Math.max(3, size * .035);
      ctx.beginPath(); ctx.arc(0, 0, size * .4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    if (jetPower > 0) {
      ctx.save();
      ctx.fillStyle = '#fff7d8'; ctx.shadowColor = '#ff7539'; ctx.shadowBlur = size * .055;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.ellipse(side * size * .19, size * .32, size * .04, size * .016, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    if (mech.phase === 'active') {
      // The pilot uses the actual techno ultra body; the sprite itself has an empty cockpit.
      const cockpitY = -size * .145;
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(0, cockpitY, size * .205, size * .17, 0, 0, Math.PI * 2);
      ctx.clip();
      drawSlimeAvatar(ctx, {
        ...avatarOptions,
        x: 0, y: cockpitY + size * .075, radius: run.cellSize * .49,
        skin: 'classic', colors: SKINS[0].colors,
        scaleX: 1, scaleY: 1, rotation: 0, alpha: 1,
        bodyVariant: 'technoUltra', irisTint: '#f04a55', nanoEyeOpenness: 0
      });
      const glass = ctx.createLinearGradient(0, cockpitY - size * .17, 0, cockpitY + size * .17);
      glass.addColorStop(0, 'rgba(168,248,255,.25)');
      glass.addColorStop(.55, 'rgba(38,179,198,.05)');
      glass.addColorStop(1, 'rgba(15,97,111,.28)');
      ctx.fillStyle = glass;
      ctx.fillRect(-size * .23, cockpitY - size * .18, size * .46, size * .36);
      ctx.restore();
      const shotAge = timestamp - (mech.lastShotAt || 0);
      if (shotAge >= 0 && shotAge < 130) {
        ctx.save();
        ctx.globalAlpha = 1 - shotAge / 130;
        ctx.fillStyle = '#fff0df'; ctx.shadowColor = '#ff344c'; ctx.shadowBlur = 12;
        for (const side of [-1, 1]) {
          ctx.beginPath(); ctx.arc(side * size * .43, size * .22, size * .037, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      const hitAge = timestamp - run.lastHeartLossAt;
      if (hitAge >= 0 && hitAge < 190) {
        ctx.save();
        ctx.globalAlpha = 1 - hitAge / 190;
        ctx.strokeStyle = '#ffe1a2'; ctx.lineWidth = 2.3;
        ctx.shadowColor = '#ff6654'; ctx.shadowBlur = 7;
        for (let index = 0; index < 4; index += 1) {
          const angle = index * Math.PI / 2 + hitAge / 160;
          const inner = size * .3;
          const outer = inner + size * .055;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
          ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.restore();
    if (mech.phase === 'active') {
      const remaining = clamp((mech.expireAt - timestamp) / MECH_ACTIVE_MS, 0, 1);
      const timerWidth = 78;
      const timerHeight = 31;
      const timerY = Math.max(62, y - size * .52 - timerHeight - 5);
      const timerX = clamp(x - timerWidth / 2, 5, VIEW_W - timerWidth - 5);
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

  function drawMechExplosion(timestamp) {
    const burst = run.mechExplosion;
    if (!burst) return;
    const progress = (timestamp - burst.startedAt) / MECH_EXPLOSION_MS;
    if (progress >= 1) { run.mechExplosion = null; return; }
    const x = burst.x;
    const y = burst.y - run.cameraY;
    const radius = run.cellSize * (burst.expired ? .5 + progress * .85 : .65 + progress * 1.7);
    ctx.save();
    ctx.globalAlpha = Math.max(0, (1 - progress) * (burst.expired ? .7 : 1));
    ctx.strokeStyle = burst.expired ? '#9df5fb' : '#ff6a49';
    ctx.lineWidth = Math.max(2, run.cellSize * (burst.expired ? .07 - progress * .04 : .10 - progress * .06));
    ctx.shadowColor = burst.expired ? '#54ddea' : '#ff3e42'; ctx.shadowBlur = burst.expired ? 11 : 20;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < (burst.expired ? 6 : 8); i += 1) {
      const angle = i * Math.PI / 4 + .12;
      const distance = radius * (.65 + (i % 3) * .1);
      ctx.fillStyle = i % 2 ? '#ffb766' : '#d4faff';
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance,
        run.cellSize * .06 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNanoDrones(timestamp) {
    if (!elementalLevel('nano') && !run.shieldMines?.length) return;
    ctx.save();
    for (const shot of run.nanoShots || []) {
      const age = timestamp - shot.startedAt;
      const travelMs = shot.mech ? MECH_SHOT_TRAVEL_MS : 135;
      const fadeEnd = shot.mech ? 245 : 270;
      const reach = clamp(age / travelMs, 0, 1);
      const fade = clamp((fadeEnd - age) / (fadeEnd - travelMs), 0, 1);
      const endX = shot.fromX + (shot.toX - shot.fromX) * reach;
      const endY = shot.fromY + (shot.toY - shot.fromY) * reach - run.cameraY;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ff283c';
      ctx.shadowBlur = 22;
      ctx.strokeStyle = '#680810'; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(shot.fromX, shot.fromY - run.cameraY); ctx.lineTo(endX, endY); ctx.stroke();
      ctx.strokeStyle = '#ff2940'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(shot.fromX, shot.fromY - run.cameraY); ctx.lineTo(endX, endY); ctx.stroke();
      ctx.shadowBlur = 9;
      ctx.strokeStyle = '#fff1df'; ctx.lineWidth = 2.8;
      ctx.beginPath(); ctx.moveTo(shot.fromX, shot.fromY - run.cameraY); ctx.lineTo(endX, endY); ctx.stroke();
      ctx.restore();
      if (age >= travelMs) {
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.strokeStyle = '#ff5360'; ctx.lineWidth = 3;
        ctx.shadowColor = '#ff253b'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.arc(shot.toX, shot.toY - run.cameraY, 6 + (age - travelMs) * .13, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    for (const mine of [run.nanoMine, ...(run.shieldMines || [])].filter(Boolean)) {
      if (window.BlockEffectDraft && !mine.target.dead) {
        window.BlockEffectDraft.drawNanoTarget(ctx, mine.target.x, mine.target.y - run.cameraY,
          Math.min(mine.target.w, mine.target.h), timestamp);
      }
      if (timestamp >= mine.launchedAt) {
        const progress = clamp((timestamp - mine.launchedAt) / 320, 0, 1);
        const eased = progress * progress * (3 - 2 * progress);
        const x = mine.fromX + (mine.toX - mine.fromX) * eased;
        const y = mine.fromY + (mine.toY - mine.fromY) * eased - run.cameraY - Math.sin(progress * Math.PI) * 15;
        const size = run.cellSize * .43;
        const sprite = projectSprite(NANO_MINI_DRONE_SPRITE);
        ctx.save();
        ctx.shadowColor = '#ff334e'; ctx.shadowBlur = 15;
        if (sprite?.complete && sprite.naturalWidth) ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
        else { ctx.fillStyle = '#ad1e30'; ctx.beginPath(); ctx.arc(x, y, size * .3, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
    ctx.restore();
    if (run.mechSuit) return;
    const position = nanoDronePosition(0, timestamp);
    drawNanoDroneSprite(ctx, position.x, position.y - run.cameraY, run.slime.radius * .70,
      run.portalEntry ? clamp(1 - (timestamp - run.portalEntry.startedAt) / run.portalEntry.duration, 0, 1) : 1);
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
    sporeSeedSprite.src = versionedAsset('assets/vfx/spores-seed-v1.webp');
    sporePodSprite.src = versionedAsset('assets/vfx/spores-pod-v5.webp');
    sporeBurstSprite.src = versionedAsset('assets/vfx/spores-burst-v1.webp');
  }

  function drawSporeShape(size, color) {
    ctx.fillStyle = 'rgba(185,255,109,.24)';
    ctx.beginPath(); ctx.ellipse(0, 0, size * 1.35, size * 1.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#397e2f';
    ctx.beginPath(); ctx.ellipse(0, 0, size * .7, size * 1.02, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(0, 0, size * .52, size * .84, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,239,.85)';
    ctx.beginPath(); ctx.ellipse(-size * .17, -size * .3, size * .14, size * .23, -.3, 0, Math.PI * 2); ctx.fill();
  }

  function drawSporeEffects(timestamp) {
    if (!run.sporeProjectiles.length && !run.sporePods.length && !run.sporeBursts.length) return;
    const lowPower = isLowPowerDevice();
    const cell = run.cellSize;
    const seedReady = sporeSeedSprite.complete && sporeSeedSprite.naturalWidth > 0;
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
      if (!lowPower) { ctx.shadowColor = '#b5ff79'; ctx.shadowBlur = 6; }
      drawSporeShape(size, '#bbff6b');
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
      if (!lowPower) { ctx.shadowColor = '#afff60'; ctx.shadowBlur = 6; }
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
      const y = burst.y - run.cameraY;
      if (y < -cell * 2 || y > VIEW_H + cell * 2) continue;
      const t = clamp((timestamp - burst.startedAt) / 520, 0, 1);
      const size = cell * (1.1 + t * 2.1);
      ctx.save();
      ctx.globalAlpha = (1 - t) * (1 - t);
      if (burstReady) ctx.drawImage(sporeBurstSprite, burst.x - size / 2, y - size / 2, size, size);
      else { ctx.fillStyle = '#c9ff6e'; ctx.beginPath(); ctx.arc(burst.x, y, size * .35, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  }

  function drawCloningCharge(timestamp) {
    const ultimate = run.cloneUltimate;
    if (!ultimate) return;
    const age = timestamp - ultimate.startedAt;
    const slime = run.slime;
    const sy = slime.y - run.cameraY;
    ctx.save();
    if (age < CLONE_ULTIMATE_BURST_MS) {
      const t = clamp(age / CLONE_ULTIMATE_BURST_MS, 0, 1);
      const radius = slime.radius * (1.25 + t * .55);
      const glow = ctx.createRadialGradient(slime.x, sy, slime.radius * .4, slime.x, sy, radius);
      glow.addColorStop(0, `rgba(202,255,162,${.08 + t * .15})`);
      glow.addColorStop(.65, `rgba(87,236,112,${.13 + t * .2})`);
      glow.addColorStop(1, 'rgba(69,216,102,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(slime.x, sy, radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(173,255,182,${.25 + t * .4})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(slime.x, sy, slime.radius * (1.12 + t * .28), 0, Math.PI * 2); ctx.stroke();
    } else {
      const t = clamp((age - CLONE_ULTIMATE_BURST_MS) / 390, 0, 1);
      ctx.globalAlpha = (1 - t) * .72;
      ctx.strokeStyle = '#adffac';
      ctx.lineWidth = 4 - t * 2;
      ctx.beginPath(); ctx.arc(slime.x, sy, slime.radius * (.8 + t * 2.2), 0, Math.PI * 2); ctx.stroke();
    }
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
      ctx.shadowColor = '#75f795';
      ctx.shadowBlur = 5;
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

  function drawSlime(timestamp) {
    const s = run.slime;
    const screenY = s.y - run.cameraY;
    const ghost = phantomActive(timestamp) && !run.portalEntry;
    const selected = skinById(save.selectedSkin);
    const frozen = isSlimeFrozen(timestamp);
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
    if (run.portalEntry && portalScale <= .01) return;
    const speed = Math.hypot(s.vx, s.vy);
    const stretch = clamp(s.vy / 900, -.22, .3);
    const bounceSquash = clamp(Math.sin(s.wobble) * .025 + Math.abs(s.vx) / 1700, 0, .12);
    const scaleX = frozen ? 1 : 1 - stretch * .42 + bounceSquash;
    const scaleY = frozen ? 1 : 1 + stretch - bounceSquash * .55;
    const cloneChargeAge = run.cloneUltimate ? timestamp - run.cloneUltimate.startedAt : 0;
    const cloneCharge = run.cloneUltimate && !run.cloneUltimate.fired
      ? clamp(cloneChargeAge / CLONE_ULTIMATE_BURST_MS, 0, 1) : 0;
    const cloneRelease = run.cloneUltimate?.fired
      ? 1 - clamp((cloneChargeAge - CLONE_ULTIMATE_BURST_MS) / 240, 0, 1) : 0;
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
      phantomActive: ghost,
      preservePhantomBody: true,
      scaleX: scaleX * (1 + hitSquash * .16) * (1 - cloneCharge * .16 + cloneRelease * .19) * portalScale * launchScale,
      scaleY: scaleY * (1 - hitSquash * .19) * (1 + cloneCharge * .13 - cloneRelease * .12) * portalScale * launchScale,
      rotation: (frozen ? clamp(s.vx / 1600, -.09, .09) : clamp(s.vx / 850, -.24, .24)) + portalProgress * 1.8,
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
    const phantomWarningRemaining = run.phantomNextAt - timestamp;
    const phantomWarning = !run.portalEntry && elementalLevel('phantom') >= 1 && run.phantomUntil <= 0
      && phantomWarningRemaining > 0 && phantomWarningRemaining <= PHANTOM_WARNING_MS;
    const phantomEntering = !run.portalEntry && run.phantomEnterUntil > timestamp && run.phantomEnteredAt > 0;
    const phantomReturning = ghost && run.phantomUntil - timestamp < 440;
    if (phantomWarning || phantomEntering) ensurePhantomSoulBurstSprite();
    if (phantomWarning || phantomEntering) {
      const collapse = phantomEntering
        ? clamp((timestamp - run.phantomEnteredAt) / PHANTOM_ENTER_MS, 0, 1) : 0;
      const ringRadius = radius * 2.05 * (1 - collapse);
      ctx.save();
      const haze = ctx.createRadialGradient(s.x, screenY, 0, s.x, screenY, Math.max(1, ringRadius));
      const strength = phantomWarning ? .36 : .46 * (1 - collapse);
      haze.addColorStop(0, 'rgba(214,222,228,0)');
      haze.addColorStop(.51, 'rgba(214,222,228,0)');
      haze.addColorStop(.68, `rgba(202,211,217,${strength * .45})`);
      haze.addColorStop(.77, `rgba(181,191,200,${strength})`);
      haze.addColorStop(1, 'rgba(213,222,228,0)');
      ctx.fillStyle = haze;
      ctx.beginPath(); ctx.arc(s.x, screenY, ringRadius, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    if (ghost) avatarOptions.alpha *= phantomReturning
      ? .54 + (1 - clamp((run.phantomUntil - timestamp) / 440, 0, 1)) * .16 : .54;
    else if (phantomEntering) avatarOptions.alpha *= Math.sin(timestamp / 46) > .14 ? .94 : .42;
    else if (phantomWarning) avatarOptions.alpha *= Math.sin(timestamp / 85) > .28 ? 1 : .7;
    avatarOptions.phantomActive = ghost || phantomWarning || phantomEntering;
    if (!frozen || run.cosmosUltimate) drawCosmosCometVisual(timestamp, s.x, screenY, fireRadius, false);
    if (run.mechSuit?.phase === 'active') drawMechSuit(timestamp, avatarOptions);
    else {
      drawElementalSlimeAvatar(ctx, avatarOptions, elementalVisuals, timestamp);
      if (run.mechSuit) drawMechSuit(timestamp, avatarOptions);
    }
    if (!frozen || run.cosmosUltimate) drawCosmosCometVisual(timestamp, s.x, screenY, fireRadius, true);
    drawActiveElementalAbility(timestamp, s.x, screenY, fireRadius);
    if (hurtActive && hitAge < 440) drawSlimeDamageImpact(timestamp, s.x, screenY, radius);
    if (!run.portalEntry && run.barrier > 0) {
      window.DominantShield.bubble(ctx, s.x, screenY, radius, shieldDominant(),
        timestamp, timestamp - (run.barrierStartedAt || 0));
    }
    if (run.shieldPop) {
      if (timestamp - run.shieldPop.at < 520) window.DominantShield.pop(ctx, run.shieldPop, timestamp, run.cameraY);
      else run.shieldPop = null;
    }
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
  }

  function impact() {}

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
    run.nanoShots = [];
    run.nanoMine = null;
    run.mechSuit = null;
    run.mechExplosion = null;
    run.mechExitZoneGraceUntil = 0;
    run.frostStorm = null;
    run.telekinesisPress = null;
    run.telekinesisUltimatePending = false;
    if (run.ultimateRechargePending === 'elemental') finishUltimateRecharge();
    run.elementalAbilityActive = '';
    run.elementalAbilityUntil = 0;
    run.nanoEyeOpenedAt = 0;
    run.nanoNextShotAt = [performance.now() + 1400];
    run.nanoNextMineAt = performance.now() + NANO_MINE_INTERVAL_MS;
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
    run.phoenixWaves = [];
    run.electricStorm = null;
    run.electricStormBolts = [];
    run.electricStormHits = [];
    run.meteorShowers = [];
    run.phantomUntil = 0;
    run.phantomWarned = false;
    run.phantomEnteredAt = 0;
    run.phantomEnterUntil = 0;
    run.phantomNextAt = performance.now() + PHANTOM_COOLDOWN_MS;
    run.phantomMarkedBlocks?.clear();
    run.phantomBursts = [];
    run.glitchNextInfectionAt = performance.now() + 4500;
    run.glitchNextNeutralizeAt = performance.now() + 8500;
    run.glitchInfectedBlocks.clear();
    run.glitchShock = null;
    run.glitchChoice = null;
    run.glitchClone = null;
    run.glitchDeleteQueue = [];
    run.glitchSpreadQueue = [];
    run.glitchChange = null;
    hideGlitchChoice();
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
    showToast(`КРУГ ${completedLap}`);
    run.animationId = requestAnimationFrame(gameFrame);
  }

  function finalizeWorldCompletion() {
    if (!run || run.ended) return;
    const world = run.world;
    save.worldBest[world.id] = Math.max(save.worldBest[world.id] || 0, world.targetDepth);
    save.unlockedLevels[world.id] = LEVEL_COUNT;
    const activeIndex = ACTIVE_WORLD_IDS.indexOf(world.id);
    const nextWorldId = ACTIVE_WORLD_IDS[activeIndex + 1];
    const nextLevel = EXPERIENCE.levelForExperience(save.playerExperience + run.experienceEarned + 150);
    const unlockedNextWorld = Boolean(nextWorldId && nextLevel >= EXPERIENCE.requiredLevelForWorldIndex(activeIndex + 1)
      && !worldIsUnlocked(nextWorldId));
    const unlockedSkin = { 1: 'cat', 3: 'dumpling' }[world.id];
    if (unlockedSkin && !save.unlockedSkins.includes(unlockedSkin)) save.unlockedSkins.push(unlockedSkin);
    run.isFinalCompletion = world.id === ACTIVE_WORLD_IDS[ACTIVE_WORLD_IDS.length - 1];
    if (run.isFinalCompletion) save.gameCompleted = true;
    sound('win');
    endRun(true, unlockedNextWorld
      ? `Шахта «${world.name}» пройдена! +150 опыта. Следующая шахта открыта!`
      : `Шахта «${world.name}» пройдена! +150 опыта.`);
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
    endRun(false, 'Забег завершён вручную. Полученная награда сохранена.');
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
    animateResultNumber(els.resultCoins, from, to, 520, value => `+${formatCompactNumber(value)} XP`).then(() => {
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
    if (reducedMotion) els.resultCoins.textContent = `+${formatCompactNumber(coins)} XP`;
    else await animateResultNumber(els.resultCoins, 0, coins, 620, value => `+${formatCompactNumber(value)} XP`);
    if (token !== resultRevealToken || !run) return;
    coinsStat?.classList.remove('is-counting');
    coinsStat?.classList.add('is-complete');
    feedback([5, 10, 5]);
    setTimeout(() => coinsStat?.classList.remove('is-complete'), 430);

    const bonus = run.completed && !run.endless;
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
        els.resultCoins.textContent = `+${formatCompactNumber(coins + 150)} XP`;
      } else {
        await Promise.all([
          animateResultResearch(25, run.researchUnitsBefore + researchData, token, researchData),
          animateResultNumber(els.resultCoins, coins, coins + 150, 650, value => `+${formatCompactNumber(value)} XP`)
        ]);
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

  function endRun(completed, reason) {
    if (!run || run.ended) return;
    if (save.tutorialStep === 'run-wait') {
      clearTimeout(tutorialRunTimer);
      setTutorialStep('post-run');
    }
    run.completed = Boolean(completed);
    hideGlitchChoice();
    run.glitchChoice = null;
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
      const failureKey = `${run.worldId}:${run.level}`;
      save.levelFailures[failureKey] = window.SlimeMinePlans?.nextFailureStreak(save.levelFailures[failureKey], completed)
        ?? (completed ? 0 : Math.min(99, (save.levelFailures[failureKey] || 0) + 1));
      save.worldBest[run.worldId] = Math.max(save.worldBest[run.worldId] || 0, Math.min(run.maxDepth, run.world.targetDepth));
      save.lastRunDepth[`${run.worldId}:${run.level}`] = Math.min(run.world.targetDepth, Math.max(0, Math.floor(run.maxDepth)));
      save.worldLastRun[run.worldId] = Math.min(run.world.targetDepth, Math.max(0, Math.floor(run.maxDepth)));
    }
    const baseCoins = Math.max(0, Math.floor(run.coins));
    const completionBonus = completed && !run.endless ? 25 : 0;
    const researchData = Math.max(0, Math.floor(run.researchData || 0)) + completionBonus;
    run.experienceEarned = Math.max(0, Math.floor(run.experienceEarned || 0)) + (completed && !run.endless ? 150 : 0);
    run.experienceBefore = save.playerExperience;
    const previouslyUnlocked=new Set(ACTIVE_WORLD_IDS.filter(id=>worldIsUnlocked(id)));
    save.playerExperience += run.experienceEarned;
    save.unlockedWorlds = ACTIVE_WORLD_IDS.filter((id, index) =>
      EXPERIENCE.levelForExperience(save.playerExperience) >= EXPERIENCE.requiredLevelForWorldIndex(index));
    save.unseenWorlds=[...new Set([...(save.unseenWorlds||[]),...save.unlockedWorlds.filter(id=>!previouslyUnlocked.has(id))])];
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
    els.resultText.textContent = '';
    const completionPanel = document.getElementById('resultCompletionBonus');
    if (completionPanel) completionPanel.hidden = true;
    els.resultResearchData.textContent = '+0';
    const bonusLabel = document.getElementById('resultResearchBonus');
    if (bonusLabel) bonusLabel.textContent = completionBonus ? `+${completionBonus}` : '';
    els.resultResearchUnits.textContent = formatCompactNumber(run.researchUnitsBefore);
    els.resultCoins.textContent = '+0 XP';
    const experienceBonusLabel = document.getElementById('resultExperienceBonus');
    if (experienceBonusLabel) experienceBonusLabel.textContent = completionBonus ? '+150 XP' : '';
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
    requestAnimationFrame(() => {
      els.resultOverlay.querySelector('.modal')?.focus();
      revealResultSummary(researchData - completionBonus, run.experienceEarned - (completionBonus ? 150 : 0), revealToken);
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
    requestAnimationFrame(() => els.gameCompleteOverlay.querySelector('.game-complete-modal')?.focus());
  }

  function closeGameCompleteToHome() {
    els.gameCompleteOverlay.classList.add('hidden');
    syncInteractionLayers();
    run = null;
    newDraft();
    requestAnimationFrame(playHomeRewardFlight);
    queueSecondTutorialGift();
  }

  function startEndlessFromCompletion() {
    els.gameCompleteOverlay.classList.add('hidden');
    syncInteractionLayers();
    run = null;
    startDrop({ endless: true });
  }

  function queueSecondTutorialGift() {
    if (save.tutorialStep !== 'post-run') return;
    const waitForRewards = () => {
      if (save.tutorialStep !== 'post-run' || document.body.dataset.screen !== 'home') return;
      if (homeRewardFlight || playerExperiencePresentation?.frame) return setTimeout(waitForRewards, 150);
      setTutorialStep('second-gift');
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
    requestAnimationFrame(playHomeRewardFlight);
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
    if (save.researchUnits < cost) return showToast('Не хватает колб исследования');
    save.researchUnits -= cost;
    save[key] += 1;
    sound('coin');
    renderDraft();
    persist();
    renderPanel('upgrades');
  }

  function renderPanel(type) {
    if (type === 'form-index' && formDiscoverySequence) return;
    if (type === 'shop' || type === 'skins' || (type === 'form-index' && !save.discoveredForms?.length)) return;
    lastFocusedElement = document.activeElement;
    els.panelOverlay.querySelector('.panel-modal')?.classList.toggle('encyclopedia-modal', type === 'encyclopedia');
    if (type === 'upgrades') renderUpgradesPanel();
    if (type === 'shop' || type === 'skins') renderShopPanel(activeShopTab);
    if (type === 'rewards') renderRewardsPanel();
    if (type === 'recipes') {
      laboratoryView = ['upgrade-home-mutations','upgrade-fire','upgrade-close-lab','choose','close-lab'].includes(save.tutorialStep) ? 'mutations' : 'synthesis';
      renderRecipesPanel();
    }
    if (type === 'recipes' && save.tutorialStep === 'upgrade-home-mutations') {
      selectedLaboratoryMutationId = 'fire';
      renderRecipesPanel();
      setTutorialStep('upgrade-fire');
    }
    if (type === 'recipes' && save.tutorialStep === 'home-mutations') {
      setTutorialStep('gift-delay');
      clearTimeout(tutorialGiftTimer);
      tutorialGiftTimer = setTimeout(() => {
        if (save.tutorialStep === 'gift-delay') setTutorialStep('gift');
      }, 550);
    }
    if (type === 'encyclopedia') renderEncyclopediaPanel(save.world);
    if (type === 'form-index') {
      renderFormIndexPanel();
      const hadUnseenForms = save.unseenForms.length > 0;
      save.unseenForms = [];
      updateFormIndexBadge();
      if (hadUnseenForms) persist();
    }
    els.panelOverlay.classList.remove('hidden');
    syncInteractionLayers();
    queueTutorialRender();
    requestAnimationFrame(() => els.panelOverlay.querySelector('.modal')?.focus());
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
        return `<article class="form-index-card ${open ? 'is-open' : 'is-locked'} ${open && unseen.has(form.id) ? 'is-unseen' : ''}" style="--form-accent:${form.color}" aria-label="${open ? form.name : `Форма ${index + 1}: неизвестна`}">
          <div class="form-index-recipe" aria-label="${open ? `Три мутации ${form.mutation}` : 'Рецепт пока скрыт'}">${open ? Array.from({ length: 3 }, () => mutationEmblemMarkup(recipeMutation, { effects: false })).join('') : '<img class="form-recipe-lock" src="assets/ui/lock.webp" alt="">'}</div>
          <div class="form-index-art">${open && form.id === 'nano' ? '<canvas class="form-cyborg-preview" width="256" height="256" aria-label="Киборг-слайм"></canvas>' : `<img src="${versionedAsset(form.art)}" alt="" loading="lazy">`}<i aria-hidden="true">?</i></div>
          <div class="form-index-card-copy">
            <h3>${open ? form.name : 'НЕИЗВЕСТНО'}</h3>
            <div class="form-index-ultra">${open && form.ultra
              ? `<p>${form.ultra[1]}</p>`
              : '<p class="form-index-empty-ultra">?</p>'}</div>
          </div>
        </article>`;
      }).join('')}</div>
    </div>`;
    const cyborgCanvas = els.panelContent.querySelector('.form-cyborg-preview');
    if (cyborgCanvas) {
      window.SlimeAvatarRenderer.preloadAppearance({ bodyVariant: 'technoUltra', nanoEyeOpenness: 1 }).then(() => {
        if (!cyborgCanvas.isConnected) return;
        drawSlimeAvatar(cyborgCanvas.getContext('2d'), {
          x: 128, y: 142, radius: 80, skin: 'classic', emotion: 'joy', timestamp: 1000,
          bodyVariant: 'technoUltra', nanoEyeOpenness: 1, irisTint: '#f04a55'
        });
      });
    }
  }

  function discoverCurrentForm({ animate = true, notify = true, delayMs = 0 } = {}) {
    const entry = FORM_INDEX.find(form => menuCategoryLevels()[form.id] === 3);
    if (!entry || save.discoveredForms.includes(entry.id)) return;
    save.discoveredForms.push(entry.id);
    if (notify) save.unseenForms.push(entry.id);
    persist();
    if (!animate || document.body.dataset.screen !== 'home' || !els.formIndexBtn) {
      updateFormIndexBadge();
      return;
    }
    const sequence = { timers: [], nodes: [], animation: null };
    formDiscoverySequence = sequence;
    const later = (callback, delay) => sequence.timers.push(setTimeout(() => {
      if (formDiscoverySequence === sequence) callback();
    }, delay));
    const finish = (arrived = false) => {
      if (formDiscoverySequence !== sequence) return;
      clearMenuMutationPresentation();
      updatePersistentUI();
      releaseConveyorControl();
      if (!arrived) return;
      sound('coin'); feedback([6, 15, 8]);
      els.formIndexBtn.classList.remove('form-index-arrived');
      void els.formIndexBtn.offsetWidth;
      els.formIndexBtn.classList.add('form-index-arrived');
    };
    const announce = () => {
      if (document.body.dataset.screen !== 'home' || document.body.classList.contains('ui-modal-open')) return finish();
      if (menuMutationReveal) { later(announce, 80); return; }
      const from = els.slime.getBoundingClientRect();
      const announcement = document.createElement('div');
      announcement.className = 'form-unlock-announcement';
      announcement.setAttribute('role', 'status');
      announcement.style.cssText = `left:${from.left + from.width / 2}px;top:${from.top + from.height * .89}px;--form-accent:${entry.color}`;
      announcement.innerHTML = `<span>НОВАЯ ФОРМА!</span><b>${entry.name}</b>`;
      document.body.appendChild(announcement);
      sequence.nodes.push(announcement);
      later(() => {
        if (document.body.dataset.screen !== 'home' || document.body.classList.contains('ui-modal-open')) return finish();
        const source = els.slime.getBoundingClientRect();
        const to = els.formIndexBtn.getBoundingClientRect();
        const size = Math.min(96, source.width * .65);
        const sprite = document.createElement('img');
        sprite.className = 'form-index-flight';
        sprite.src = versionedAsset(entry.art);
        sprite.alt = '';
        sprite.style.cssText = `left:${source.left + (source.width - size) / 2}px;top:${source.top + (source.height - size) / 2}px;width:${size}px;height:${size}px;--form-accent:${entry.color}`;
        document.body.appendChild(sprite);
        sequence.nodes.push(sprite);
        const dx = to.left + to.width / 2 - (source.left + source.width / 2);
        const dy = to.top + to.height / 2 - (source.top + source.height / 2);
        sequence.animation = sprite.animate(menuReducedMotion ? [{ opacity: 0 }, { opacity: 1 }] : [
          { transform: 'translate(0,0) scale(1)', opacity: 0 },
          { transform: 'translate(0,-15px) scale(1.18)', opacity: 1, offset: .2 },
          { transform: `translate(${dx * .5}px,${dy * .5 - 45}px) scale(.82) rotate(-8deg)`, opacity: 1, offset: .55 },
          { transform: `translate(${dx}px,${dy}px) scale(.32)`, opacity: 1, offset: .92 },
          { transform: `translate(${dx}px,${dy}px) scale(.08)`, opacity: 0 }
        ], { duration: menuReducedMotion ? 160 : 900, easing: 'cubic-bezier(.22,.76,.35,1)', fill: 'forwards' });
        sequence.animation.finished.then(() => finish(true), () => finish());
      }, menuReducedMotion ? 550 : 800);
    };
    later(announce, delayMs);
    // Keep the discovery flight after the reveal even on a slow connection.
    const settle = () => {
      if (menuMutationReveal) { later(settle, 500); return; }
      later(() => finish(), 2600);
    };
    later(settle, delayMs);
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
    if (!mutationById(id) || stomachIsFull() || session?.offerTransition) return;
    const pool = [...(save.activeMutationPool || [])];
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

  function setLaboratoryView(view, { animate = true } = {}) {
    if (!['synthesis','mutations'].includes(view) || mutationAnimating) return;
    laboratoryView = view;
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
    }
    queueTutorialRender();
  }

  function renderRecipesPanel() {
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    $('#mutationPrize')?.remove();
    activeLaboratoryTab = 'mutations';

    const unlocked = new Set(save.unlockedMutations || []);
    const availableIds = new Set(unlocked);
    if (!availableIds.has(selectedLaboratoryMutationId)) selectedLaboratoryMutationId = STARTER_MUTATIONS[0].id;
    const selectedMutation = mutationById(selectedLaboratoryMutationId) || STARTER_MUTATIONS[0];
    const selectedAvailable = availableIds.has(selectedMutation.id);
    const selectedDetails = selectedAvailable
      ? MUTATION_DETAILS[selectedMutation.id] || { stage1: 'Открывает базовый эффект мутации.', stage2: 'Усиливает эффект после второй порции.' }
      : { stage1: 'Синтезируй мутацию, чтобы узнать её эффект.', stage2: 'Сначала открой эмблему в реакторе.' };
    const selectedLevel = selectedAvailable ? mutationLevel(selectedMutation.id) : 0;
    const levelName = ['', 'I', 'II', 'III'][selectedLevel];
    const nextLevelName = ['', 'II', 'III'][selectedLevel] || '';
    const upgradeCost = MUTATION_UPGRADE_COSTS[selectedLevel] || 0;
    const activePool = save.activeMutationPool || [];
    const selectedIsActive = activePool.includes(selectedMutation.id);
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

    els.panelTitle.innerHTML = `<span>Лаборатория</span><span class="mutation-panel-balance" aria-label="${adminInfiniteResearch ? 'Бесконечные колбы исследования' : `Колбы исследования: ${save.researchUnits}`}"><img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt=""><b id="mutationPanelBalance">${researchBalance}</b></span>`;

    const collection = allMutations().map(mutation => {
      const available = availableIds.has(mutation.id);
      const equipped = activePool.includes(mutation.id);
      const replaceTarget = laboratoryReplaceMode && equipped;
      const canSelect = available && (!laboratoryReplaceMode || replaceTarget);
      return `<button class="mutation-collection-slot ${available ? 'unlocked' : 'locked'} ${selectedMutation.id === mutation.id ? 'selected' : ''} ${equipped ? 'equipped' : ''} ${replaceTarget ? 'replace-target' : ''}${mutation.name.length > 9 ? ' long-name' : ''}" type="button" data-mutation-slot="${mutation.id}" ${canSelect ? `data-lab-mutation="${mutation.id}"` : 'disabled'} aria-label="${available ? `${mutation.name}${equipped ? '. Активная мутация' : ''}` : 'Неизвестная мутация'}">
        ${available ? `${mutationEmblemMarkup(mutation, { effects: false })}${equipped ? '<span class="mutation-equipped-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : ''}` : '<i aria-hidden="true">?</i>'}
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
      return `<i><svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${glowId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#08bce9" stop-opacity="0"></stop><stop offset=".28" stop-color="#15cdf4" stop-opacity=".62"></stop><stop offset=".62" stop-color="#08b5e8"></stop><stop offset="1" stop-color="#88eaff"></stop></linearGradient><linearGradient id="${coreId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dafaff" stop-opacity="0"></stop><stop offset=".34" stop-color="#dafaff" stop-opacity=".72"></stop><stop offset="1" stop-color="#f0fdff"></stop></linearGradient></defs><polyline class="reactor-bolt-glow" pathLength="100" points="${points}" style="stroke:url(#${glowId})"></polyline><polyline class="reactor-bolt-core" pathLength="100" points="${points}" style="stroke:url(#${coreId})"></polyline></svg></i>`;
    }).join('');

    const stageTrack = [1, 2, 3].map((stage, index) => `<span class="${stage <= selectedLevel ? 'is-open' : 'is-closed'} ${stage === selectedLevel ? 'is-current' : ''}" ${stage === selectedLevel ? 'aria-current="step"' : ''} aria-label="Стадия ${stage}: ${stage} ${stage === 1 ? 'еда' : 'еды'}; ${stage <= selectedLevel ? 'открыта' : 'закрыта'}"><b>${['I', 'II', 'III'][index]}</b>${stage <= selectedLevel ? `<small>${stage === selectedLevel ? 'СЕЙЧАС' : 'ОТКРЫТО'}</small>` : '<img src="assets/ui/lock.webp" alt="" aria-hidden="true">'}</span>`).join('');
    const machineHint = allUnlocked
      ? 'ВСЕ МУТАЦИИ ОТКРЫТЫ'
      : readyToReveal
        ? 'РЕАКТОР ГОТОВ · НАЖМИ СИНТЕЗ'
        : mutationInvestmentHint();

    if (['reactor','synthesize','wait-synthesis','core','prize','gift','gift-delay'].includes(save.tutorialStep)) laboratoryView = 'synthesis';
    els.panelContent.innerHTML = `<div class="laboratory-panel mutation-lab-v2" data-view="${laboratoryView}">
      <nav class="lab-view-tabs" role="tablist" aria-label="Разделы лаборатории">
        <button id="labSynthesisTab" data-lab-view="synthesis" type="button" role="tab" aria-controls="labSynthesisPane">СИНТЕЗ</button>
        <button id="labMutationsTab" data-lab-view="mutations" type="button" role="tab" aria-controls="labMutationsPane">МУТАЦИИ</button>
      </nav>
      <div class="mutation-main-grid">
        <section id="labSynthesisPane" class="mutation-synth-pane" data-lab-pane="synthesis" role="tabpanel" aria-labelledby="labSynthesisTab">
          <button id="mutationCapsuleBtn" class="mutation-capsule mutation-capsule-v2 ${allUnlocked ? 'is-complete' : ''} ${readyToReveal ? 'is-ready-to-synthesize' : ''}" type="button" ${allUnlocked || readyToReveal ? 'disabled' : ''} aria-label="${allUnlocked ? 'Все мутации открыты' : readyToReveal ? 'Реактор заполнен' : `Добавить ${nextMutationInvestmentAmount()} колб. Осталось ${remaining}`}">
            <span class="mutation-machine-visual" aria-hidden="true">
              <img class="mutation-machine-art" src="${versionedAsset('assets/ui/lab-synth-machine-v1.webp')}" alt="">
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
            <span class="mutation-synth-balance"><img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt=""><span><small>ОСТАЛОСЬ</small><b id="mutationRemaining">${allUnlocked ? 0 : remaining}</b></span></span>
            <button id="mutationSynthesizeBtn" class="mutation-synthesize-btn ${readyToReveal ? 'ready' : ''}" type="button" ${readyToReveal ? '' : 'disabled'}><span>СИНТЕЗ</span></button>
          </div>
        </section>

        <section id="labMutationsPane" class="mutation-info-pane mutation-family-${selectedMutation.id} ${selectedAvailable ? '' : 'is-locked'}" data-lab-pane="mutations" role="tabpanel" aria-labelledby="labMutationsTab" aria-label="${selectedAvailable ? `Информация о мутации ${selectedMutation.name}` : 'Неизвестная мутация'}">
          ${selectedAvailable ? mutationEmblemMarkup(selectedMutation) : '<span class="mutation-info-emblem"><i class="mutation-locked-symbol">?</i></span>'}
          <h3>${selectedAvailable ? selectedMutation.name : 'НЕИЗВЕСТНО'}${selectedAvailable ? ` <em class="mutation-level-badge">${levelName}</em>` : ''}</h3>
          <div class="mutation-level-track" aria-label="Открытые стадии мутации">${stageTrack}</div>
          <div class="mutation-stage-list mutation-level-list">
            <article class="${selectedLevel >= 1 ? 'is-open' : 'is-hidden'} ${selectedLevel === 1 ? 'is-current' : ''}" aria-label="Стадия I"><b>I</b><p>${selectedLevel >= 1 ? selectedDetails.stage1 : 'Сначала открой мутацию.'}</p></article>
            <article class="${selectedLevel >= 2 ? 'is-open' : 'is-hidden'} ${selectedLevel === 2 ? 'is-current' : ''}" aria-label="Стадия II"><b>II</b><p>${selectedLevel >= 2 ? selectedDetails.stage2 : 'Открой стадию II.'}</p></article>
            <article class="${selectedLevel >= 3 ? 'is-open' : 'is-hidden'} ${selectedLevel === 3 ? 'is-current' : ''}" aria-label="Стадия III"><b>III</b><p>${selectedLevel >= 3 ? 'Особая форма' : 'Открой стадию III.'}</p></article>
          </div>
          <div class="mutation-level-action">
            ${selectedLevel > 0 && selectedLevel < 3
              ? `<button id="mutationUpgradeBtn" class="mutation-upgrade-btn ${save.researchUnits < upgradeCost && !adminInfiniteResearch ? 'needs-flasks' : ''}" type="button" ${mutationUpgrading ? 'disabled' : ''} aria-label="Открыть стадию ${nextLevelName} за ${upgradeCost} колб"><span>ОТКРЫТЬ ${nextLevelName}</span><span class="mutation-upgrade-price"><img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt="">${upgradeCost}</span></button>`
              : `<span class="mutation-level-note">${selectedLevel === 3 ? 'МАКСИМУМ' : 'ОТКРОЙ МУТАЦИЮ'}</span>`}
          </div>
          <button id="mutationChooseBtn" class="mutation-choose-btn ${laboratoryReplaceMode ? 'is-cancel' : ''}" type="button" aria-pressed="${laboratoryReplaceMode}" ${!selectedAvailable || selectedIsActive ? 'disabled' : ''}><span>${!selectedAvailable ? 'ЗАКРЫТО' : selectedIsActive ? 'УЖЕ ВЫБРАНО' : laboratoryReplaceMode ? 'ОТМЕНИТЬ' : 'ВЫБРАТЬ'}</span></button>
        </section>
      </div>
      <div class="mutation-collection-head"><b>МУТАЦИИ</b><span aria-label="Открыто ${visibleUnlockedCount} из ${collectionCapacity} мутаций"><strong>${visibleUnlockedCount}</strong><small>/ ${collectionCapacity}</small></span></div>
      <div id="mutationCollection" class="mutation-collection mutation-collection-v2 ${laboratoryReplaceMode ? 'is-replacing' : ''}">${collection}</div>
    </div>`;

    setLaboratoryView(laboratoryView, { animate: false });
    $$('[data-lab-view]').forEach(button => {
      button.addEventListener('click', () => { if (laboratoryView !== button.dataset.labView) { sound('tap'); setLaboratoryView(button.dataset.labView); } });
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key) || tutorialActive() || mutationAnimating) return;
        event.preventDefault();
        const next = ['ArrowLeft','Home'].includes(event.key) ? 'synthesis' : 'mutations';
        setLaboratoryView(next); $(`[data-lab-view="${next}"]`)?.focus();
      });
    });
    const capsuleButton = $('#mutationCapsuleBtn');
    capsuleButton?.addEventListener('click', handleMutationCapsuleClick);
    capsuleButton?.addEventListener('pointerdown', startMutationFeedHold);
    capsuleButton?.addEventListener('pointerup', stopMutationFeedHold);
    capsuleButton?.addEventListener('pointercancel', stopMutationFeedHold);
    capsuleButton?.addEventListener('lostpointercapture', stopMutationFeedHold);
    $('#mutationSynthesizeBtn')?.addEventListener('click', () => startMutationSynthesis(capsuleButton));
    $('#mutationUpgradeBtn')?.addEventListener('click', event => { void upgradeMutation(selectedMutation.id, event.currentTarget); });
    $('#mutationChooseBtn')?.addEventListener('click', () => {
      if (!selectedIsActive && activePool.length < 3) {
        selectedConveyorSlot = activePool.length;
        setActiveConveyorMutation(selectedLaboratoryMutationId);
        if (save.tutorialStep === 'choose') setTutorialStep('close-lab');
        return;
      }
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
      laboratoryView = 'mutations';
      sound('tap');
      renderRecipesPanel();
      setLaboratoryView('mutations');
      if (save.tutorialStep === 'fire-slot' && id === 'fire') setTutorialStep('choose');
    }));
    queueTutorialRender();
  }

  async function upgradeMutation(id, button) {
    const level = mutationLevel(id);
    const cost = MUTATION_UPGRADE_COSTS[level];
    if (!cost || mutationUpgrading || mutationAnimating || !button) return;
    if (!adminInfiniteResearch && save.researchUnits < cost) {
      showToast(`Нужно ещё ${cost - save.researchUnits} колб`);
      feedback(7);
      return;
    }
    mutationUpgrading = true;
    button.disabled = true;
    button.classList.add('is-upgrading');
    const source = els.panelTitle.querySelector('.mutation-panel-balance img')?.getBoundingClientRect();
    const destination = button.getBoundingClientRect();
    const initialBalance = save.researchUnits;
    if (!adminInfiniteResearch) save.researchUnits -= cost;
    save.mutationLevels = { ...(save.mutationLevels || {}), [id]: level + 1 };
    persist({ refreshUI: false });
    const flights = Array.from({ length: 5 }, (_, index) => {
      const flask = document.createElement('img');
      flask.className = 'mutation-upgrade-flight';
      flask.src = versionedAsset('assets/ui/research-flask-blue-v1.webp');
      flask.alt = '';
      const startX = (source?.left || destination.left) + (source?.width || 0) / 2 - 15;
      const startY = (source?.top || destination.top) + (source?.height || 0) / 2 - 15;
      const endX = destination.left + destination.width / 2 - 15;
      const endY = destination.top + destination.height / 2 - 15;
      flask.style.left = `${startX}px`;
      flask.style.top = `${startY}px`;
      document.body.appendChild(flask);
      const flight = flask.animate([
        { transform: 'translate(0,0) scale(.7)', opacity: 0 },
        { transform: 'translate(0,-14px) scale(1)', opacity: 1, offset: .25 },
        { transform: `translate(${endX - startX}px,${endY - startY}px) scale(.42)`, opacity: 1 }
      ], { duration: menuReducedMotion ? 80 : 420, delay: index * (menuReducedMotion ? 15 : 90), easing: 'ease-in', fill: 'forwards' });
      return flight.finished.catch(() => {}).finally(() => {
        flask.remove();
        if (adminInfiniteResearch) return;
        const shown = initialBalance - Math.round(cost * (index + 1) / 5);
        if (els.researchUnitsLabel) els.researchUnitsLabel.textContent = String(shown);
        const panelBalance = $('#mutationPanelBalance');
        if (panelBalance) panelBalance.textContent = String(shown);
      });
    });
    await Promise.all(flights);
    mutationUpgrading = false;
    sound('coin');
    feedback([7, 12, 7]);
    if (session && (save.activeMutationPool || []).includes(id) && !session.offerTransition && !stomachIsFull()) {
      generateOffer({ resetRerolls: false });
      renderDraft({ offerMotion: 'enter' });
      void settleConveyorArrival(menuReducedMotion);
    } else updatePersistentUI();
    if (!els.panelOverlay.classList.contains('hidden') && activeLaboratoryTab === 'mutations') renderRecipesPanel();
    if (!menuReducedMotion && !els.panelOverlay.classList.contains('hidden')) {
      const pane = document.getElementById('labMutationsPane');
      pane?.querySelector('.mutation-level-track .is-current')?.animate([
        { transform: 'scale(.9)' }, { transform: 'scale(1.12)', offset: .5 }, { transform: 'scale(1)' }
      ], { duration: 430, easing: 'ease-out' });
      pane?.querySelector('.mutation-level-list .is-current>b')?.animate([
        { transform: 'scale(.9)' }, { transform: 'scale(1.18)', offset: .45 }, { transform: 'scale(1)' }
      ], { duration: 480, easing: 'ease-out' });
    }
    if (save.tutorialStep === 'upgrade-fire' && id === 'fire' && level === 1) setTutorialStep('upgrade-close-lab');
  }

  function startMutationSynthesis(button) {
    if (!button || mutationAnimating || save.mutationProgress < currentMutationCost()) return;
    if (save.tutorialStep === 'synthesize') setTutorialStep('wait-synthesis');
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
    els.panelTitle.innerHTML = `<span>Лаборатория</span><span class="mutation-panel-balance" aria-label="${adminInfiniteResearch ? 'Бесконечные колбы исследования' : `Колбы исследования: ${save.researchUnits}`}"><img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt=""><b id="mutationPanelBalance">${researchBalance}</b></span>`;
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
      return `<i><svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${glowId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#08bce9" stop-opacity="0"></stop><stop offset=".28" stop-color="#15cdf4" stop-opacity=".62"></stop><stop offset=".62" stop-color="#08b5e8"></stop><stop offset="1" stop-color="#88eaff"></stop></linearGradient><linearGradient id="${coreId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dafaff" stop-opacity="0"></stop><stop offset=".34" stop-color="#dafaff" stop-opacity=".72"></stop><stop offset="1" stop-color="#f0fdff"></stop></linearGradient></defs><polyline class="reactor-bolt-glow" pathLength="100" points="${points}" style="stroke:url(#${glowId})"></polyline><polyline class="reactor-bolt-core" pathLength="100" points="${points}" style="stroke:url(#${coreId})"></polyline></svg></i>`;
    }).join('');
    els.panelContent.innerHTML = `<div class="laboratory-panel">${laboratoryTabsMarkup()}<div class="panel-section mutation-lab-panel">
      <button id="mutationCapsuleBtn" class="mutation-capsule ${allUnlocked ? 'is-complete' : ''}" type="button" ${allUnlocked || readyToReveal ? 'disabled' : ''} aria-label="${allUnlocked ? 'Все тестовые мутации открыты' : readyToReveal ? 'Открывается новая мутация' : `Добавить ${nextMutationInvestmentAmount()} колб. Осталось ${remaining}`}">
        <span class="mutation-side-feed" aria-hidden="true">
          <span id="mutationInlet" class="mutation-inlet"><i></i></span>
          <span class="mutation-feed-count"><img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt=""><b id="mutationRemaining">${allUnlocked || readyToReveal ? '✓' : remaining}</b></span>
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
    if (!save.legacyStarterAccess && !save.unlockedMutations?.includes('frost')) return 75;
    const discovered = availableSyntheses().filter(mutation => save.unlockedMutations?.includes(mutation.id)).length;
    return MUTATION_STEPS * (discovered + 1);
  }

  function nextMutationInvestmentAmount() {
    const remaining = Math.max(0, currentMutationCost() - save.mutationProgress);
    const nextTap = Math.max(1, (save.mutationInvestTapCount || 0) + 1);
    return Math.min(nextTap, remaining, adminInfiniteResearch ? remaining : save.researchUnits);
  }

  function mutationInvestmentHint() {
    const amount = nextMutationInvestmentAmount();
    return amount > 0 ? `СЛЕДУЮЩИЙ ТАП: +${amount} КОЛБ` : 'НУЖНА КОЛБА ИССЛЕДОВАНИЯ';
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
      if (hint) hint.textContent = mutationInvestmentHint();
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
      showToast('Нужна 1 колба исследования');
      feedback(7);
      return false;
    }
    const token = mutationAnimationToken;
    if (!adminInfiniteResearch) save.researchUnits -= investedAmount;
    save.mutationProgress += investedAmount;
    save.mutationInvestTapCount = (save.mutationInvestTapCount || 0) + 1;
    persist();
    updatePersistentUI();
    const balance = $('#mutationPanelBalance');
    if (balance) balance.textContent = adminInfiniteResearch ? '∞' : formatCompactNumber(save.researchUnits);
    sound('tap');

    const flyingFlask = document.createElement('span');
    flyingFlask.className = 'mutation-invest-flask';
    flyingFlask.setAttribute('aria-hidden', 'true');
    flyingFlask.innerHTML = `<img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt=""><b>+${investedAmount}</b>`;
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
    button.setAttribute('aria-label', `Добавить ${nextMutationInvestmentAmount()} колб. Осталось ${Math.max(0, remaining)}`);
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
      if (save.tutorialStep === 'reactor') setTutorialStep('synthesize');
      return true;
    }
    const hint = $('#mutationCapsuleHint');
    if (hint) hint.textContent = mutationInvestmentHint();
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
    if (save.tutorialStep === 'wait-synthesis') setTutorialStep('core');
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
    prize.style.setProperty('--prize-art', `url("${versionedAsset(MUTATION_REVEAL_BACKGROUNDS[mutation.id])}")`);
    const description = MUTATION_REVEAL_DESCRIPTIONS[mutation.id] || MUTATION_DETAILS[mutation.id]?.stage1 || '';
    prize.innerHTML = `${mutationRevealBackgroundMarkup(mutation)}<small class="mutation-prize-kicker">НОВАЯ МУТАЦИЯ</small><span class="mutation-prize-emblem"><span class="mutation-emblem-halo" aria-hidden="true"></span>${mutationRevealFxMarkup(mutation)}<img src="${versionedAsset(mutation.image)}" alt=""></span><span class="mutation-prize-caption"><strong class="mutation-prize-name">${mutation.name}</strong><span class="mutation-prize-ability">${description}</span></span><span class="mutation-prize-cta"><span>ЗАБРАТЬ МУТАЦИЮ</span></span>`;
    prize.setAttribute('aria-label', `Новая мутация: ${mutation.name}. Нажми, чтобы добавить в коллекцию`);
    const modal = els.panelOverlay.querySelector('.panel-modal');
    modal?.appendChild(prize);
    requestAnimationFrame(() => prize.classList.add('is-visible'));
    prize.addEventListener('click', () => collectSynthesizedMutation(token, mutation, prize), { once: true });
    if (save.tutorialStep === 'core') setTutorialStep('prize');
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
    save.mutationProgress = 0;
    save.mutationInvestTapCount = 0;
    pendingMutationReveal = null;
    persist();
    updatePersistentUI();
    mutationAnimating = false;
    renderRecipesPanel();
    const unlockedSlot = $(`[data-mutation-slot="${mutation.id}"]`);
    requestAnimationFrame(() => unlockedSlot?.classList.add('just-unlocked'));
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
        const price = !unlocked && skin.cost ? `<span class="shop-price"><img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt="" aria-hidden="true"><b>${formatCompactNumber(skin.cost)}</b></span>` : '';
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
        const price = !unlocked && trail.cost ? `<span class="shop-price"><img src="${versionedAsset('assets/ui/research-flask-blue-v1.webp')}" alt="" aria-hidden="true"><b>${formatCompactNumber(trail.cost)}</b></span>` : '';
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
      if (save.researchUnits < trail.cost) return showToast('Не хватает колб исследования');
      save.researchUnits -= trail.cost;
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
      if (save.researchUnits < skin.cost) return showToast('Не хватает колб исследования');
      save.researchUnits -= skin.cost;
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
          <div><h4>День ${Math.min(save.dailyStreak + 1, 7)}</h4><p>${dailyAvailable ? 'Забери колбы за вход' : 'Награда уже получена'}</p></div>
          <button id="dailyClaimBtn" class="buy-btn ${dailyAvailable ? '' : 'owned'}" ${dailyAvailable ? '' : 'disabled'}>${dailyAvailable ? 'ЗАБРАТЬ' : '✓'}</button>
        </div>
      </div>
      <div class="panel-section">
        <h3>Колесо фортуны</h3>
        <div id="wheel" class="wheel" aria-label="Колесо наград"></div>
        <div class="reward-buttons"><button id="wheelSpinBtn" class="${freeWheel ? 'primary' : 'ad-btn'}" ${save.pendingWheel || (!freeWheel && save.wheelAdSpins >= 2) ? 'disabled' : ''}>${save.pendingWheel ? 'Выбираем награду…' : wheelButton}</button></div>
        <p class="panel-note">Награды: колбы исследования и бонус здоровья на следующий забег.</p>
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
    const rewards = [1, 1, 2, 2, 3, 4, 5];
    const reward = rewards[save.dailyStreak - 1] || 1;
    save.researchUnits += reward;
    save.lastDailyDate = today;
    persist();
    if (refreshUI) updatePersistentUI();
    sound('coin');
    showToast(`Ежедневная награда: +${reward} колб`);
    renderRewardsPanel();
  }

  const WHEEL_REWARDS = [
    { weight: 30, text: '+1 колба исследования', apply: () => { save.researchUnits += 1; } },
    { weight: 22, text: '+2 колбы исследования', apply: () => { save.researchUnits += 2; } },
    { weight: 8, text: '+4 колбы исследования', apply: () => { save.researchUnits += 4; } },
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
    updatePersistentUI();
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
    syncAdminInfiniteUltimateUI();
    if (els.adminUnlockMutationsIcon) {
      const mutation = MUTATION_DISCOVERIES[Math.floor(Math.random() * MUTATION_DISCOVERIES.length)];
      els.adminUnlockMutationsIcon.src = versionedAsset(mutation.image);
    }
    lastFocusedElement = document.activeElement;
    els.adminToolsOverlay.classList.remove('hidden');
    els.adminMenuBtn?.setAttribute('aria-expanded', 'true');
    syncInteractionLayers();
    requestAnimationFrame(() => els.adminToolsOverlay.querySelector('.admin-tools-modal')?.focus({ preventScroll: true }));
    sound('tap');
    feedback(5);
    queueTutorialRender();
  }

  function closeAdminTools() {
    if (!els.adminToolsOverlay || els.adminToolsOverlay.classList.contains('hidden')) return;
    els.adminToolsOverlay.classList.add('hidden');
    els.adminMenuBtn?.setAttribute('aria-expanded', 'false');
    syncInteractionLayers();
    if (lastFocusedElement?.focus) lastFocusedElement.focus({ preventScroll: true });
    queueTutorialRender();
  }

  function closePanel() {
    stopMutationFeedHold();
    mutationAnimationToken += 1;
    mutationAnimating = false;
    laboratoryReplaceMode = false;
    els.panelOverlay.classList.add('hidden');
    syncInteractionLayers();
    if (lastFocusedElement?.focus) lastFocusedElement.focus();
    if (save.tutorialStep === 'close-lab') setTutorialStep('feed');
    else if (save.tutorialStep === 'upgrade-close-lab') setTutorialStep('upgrade-summary');
    else queueTutorialRender();
  }

  function updateTouchJoystick(event) {
    if (!run?.steer || run.steer.pointerId !== event.pointerId) return;
    const maxDistance = 32;
    let dx = event.clientX - run.steer.originX;
    let dy = event.clientY - run.steer.originY;
    const freeDirection = Boolean(run.mechSuit) || run.effects.gravitySwitch || speedDrillActive() || phantomActive() || Boolean(jellyZoneForSlime(run.slime));
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
    run.steer.touchRawY = vertical;
    run.steer.touchDown = elementalLevel('mobility') >= 1 ? clamp(vertical, 0, 1) : 0;
    run.steer.touchY = run.mechSuit || speedDrillActive() || jellyZoneForSlime(run.slime) || phantomActive() ? vertical : 0;
    if (run.effects.gravitySwitch && !phantomActive() && !run.mechSuit) {
      if (Math.abs(vertical) < .18) run.steer.gravityGestureLocked = false;
      else if (Math.abs(vertical) >= .42 && !run.steer.gravityGestureLocked) {
        setGravityDirection(vertical < 0 ? -1 : 1);
        run.steer.gravityGestureLocked = true;
      }
    }
    els.touchJoystick?.style.setProperty('--stick-x', `${round1(dx)}px`);
    els.touchJoystick?.style.setProperty('--stick-y', `${round1(dy)}px`);
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
    run.steer.touchRawY = 0;
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
      run.steer.touchRawY = 0;
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
    if (run.effects.gravitySwitch && !phantomActive() && !run.mechSuit && ['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(code)) {
      if (code === 'ArrowDown' || code === 'KeyS') run.steer.keyDown = pressed;
      if (pressed) setGravityDirection(code === 'ArrowUp' || code === 'KeyW' ? -1 : 1);
      return true;
    }
    if (pressed && !run.mechSuit && !speedDrillActive() && !jellyZoneForSlime(run.slime) && !phantomActive() && (code === 'ArrowUp' || code === 'KeyW')) return false;
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
    els.tutorialAdminBtn?.addEventListener('click', openAdminTools);
    els.tutorialPauseBtn?.addEventListener('click', openRunMenu);
    els.tutorialSkipBtn?.addEventListener('click', skipTutorial);
    els.tutorialRunSkipBtn?.addEventListener('click', skipTutorial);
    els.tutorialGiftClaimBtn?.addEventListener('click', claimTutorialGift);
    els.tutorialControlsCloseBtn?.addEventListener('click', finishTutorial);
    els.tutorialUpgradeSummaryCloseBtn?.addEventListener('click', finishUpgradeTutorial);
    window.addEventListener('resize', queueTutorialRender, { passive: true });
    document.addEventListener('scroll', queueTutorialRender, { capture: true, passive: true });
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
    els.closeAdminToolsBtn?.addEventListener('click', closeAdminTools);
    els.adminToolsOverlay?.addEventListener('click', event => { if (event.target === els.adminToolsOverlay) closeAdminTools(); });
    els.adminRestartBtn.addEventListener('click', restartDraftFromAdmin);
    els.adminPrevWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(-1));
    els.adminNextWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(1));
    els.adminUnlockAllBtn?.addEventListener('click', unlockEverythingFromAdmin);
    els.adminUnlockMutationsBtn?.addEventListener('click', unlockMutationsFromAdmin);
    els.adminInfiniteFlasksBtn?.addEventListener('click', toggleAdminInfiniteFlasks);
    els.adminInfiniteUltimateBtn?.addEventListener('click', toggleAdminInfiniteUltimate);
    els.adminResetProgressBtn?.addEventListener('click', resetProgressFromAdmin);
    els.abilityBtn.addEventListener('click', activateAbility);
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
    updateFormIndexBadge();
    if (save.pendingWheel) finishPendingWheel(false);
    if (restoreSession(save.activeDraft)) {
      syncMenuCategoryVisuals({ instant: true });
      discoverCurrentForm({ animate: false, notify: false });
      showScreen('home');
      renderDraft();
      persist();
    } else newDraft();
    document.documentElement.classList.remove('app-booting');
    document.documentElement.classList.add('app-ready');
    restoreTutorial();
    yandexPlatform?.ysdk?.features?.LoadingAPI?.ready?.();
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
        for (const key of ['fire', 'frost', 'electric', 'cosmos', 'nano', 'telekinesis', 'cloning', 'phantom', 'glitch']) {
          if (Object.hasOwn(levels, key)) run.categoryVisuals[key] = clamp(Math.round(levels[key]), 0, 3);
        }
        run.effects.gravitySwitch = elementalLevel('cosmos') >= 1 || session.effects.gravitySwitch;
        run.elementalAbilityType = ['frost', 'electric', 'fire', 'cosmos', 'cloning', 'glitch'].find(key => run.categoryVisuals[key] >= 3) || '';
        run.elementalAbilityCharges = 0;
        run.ultimateCharge = 0;
        run.ultimateRechargePending = '';
        run.elementalAbilityActive = '';
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
        ability: run.elementalAbilityType,
        charges: run.elementalAbilityCharges,
          active: run.elementalAbilityActive,
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
