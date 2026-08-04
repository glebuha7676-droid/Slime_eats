(() => {
  'use strict';

  const SAVE_KEY = 'slime_feed_and_fall_v8';
  const LEGACY_SAVE_KEYS = ['slime_feed_and_fall_v7', 'slime_feed_and_fall_v6', 'slime_feed_and_fall_v5', 'slime_feed_and_fall_v4', 'slime_feed_and_fall_v3'];
  const VIEW_W = 440;
  const VIEW_H = 650;

  const WORLDS = [
    {
      id: 1, name: 'Зелёные глубины', targetDepth: 120, reward: 300, hardness: .58,
      expectedDamage: 19, pathWidth: 3, minPathWidth: 3, turnRate: .08,
      hardCap: .08, reinforcedCap: .018, oreChance: .075, specialChance: .16,
      sky: '#63825b', earth: '#3b3027', deep: '#171c20', accent: '#54d7b0', icon: '🌿',
      materials: ['dirt', 'packedDirt', 'stone'], palette: 'earth', depthRamp: .22,
      cellSize: 72, hazardChance: .055, portalWallStrength: 5.4
    },
    {
      id: 2, name: 'Ледяная пещера', targetDepth: 200, reward: 700, hardness: .88,
      expectedDamage: 29, pathWidth: 3, minPathWidth: 2, turnRate: .18,
      hardCap: .15, reinforcedCap: .02, oreChance: .06, specialChance: .115,
      sky: '#4b7f97', earth: '#244452', deep: '#10232d', accent: '#67e8f9', icon: '🧊',
      materials: ['iceLight', 'snowPacked', 'glacier'], palette: 'ice', depthRamp: .30,
      cellSize: 72, hazardChance: .075, portalWallStrength: 5.1
    },
    {
      id: 3, name: 'Конфетная фабрика', targetDepth: 300, reward: 1550, hardness: 1.18,
      expectedDamage: 43, pathWidth: 2, minPathWidth: 2, turnRate: .28,
      hardCap: .27, reinforcedCap: .07, oreChance: .075, specialChance: .095,
      sky: '#8f4b82', earth: '#4a244d', deep: '#21142d', accent: '#f472b6', icon: '🍬',
      materials: ['candy', 'cookie', 'stone'], palette: 'candy', depthRamp: .38,
      cellSize: 72
    },
    {
      id: 4, name: 'Магмовое ядро', targetDepth: 420, reward: 3300, hardness: 1.56,
      expectedDamage: 62, pathWidth: 2, minPathWidth: 1, turnRate: .37,
      hardCap: .39, reinforcedCap: .15, oreChance: .09, specialChance: .082,
      sky: '#7d3426', earth: '#45221e', deep: '#1b1112', accent: '#fb7185', icon: '🌋',
      materials: ['basalt', 'lavaRock', 'metal'], palette: 'lava', depthRamp: .48,
      cellSize: 72
    }
  ];


  // Центральные параметры физики и баланса. Их можно менять независимо от остальной логики.
  const BALANCE = {
    gridCell: 55,
    gravityBase: 240,
    gravityPerWorld: 0,
    maxFallSpeedBase: 360,
    maxFallSpeedPerWorld: 0,
    weakBreakDrag: 0.992,
    denseBreakDrag: 0.955,
    flightKeepSoft: 0.80,
    flightKeepDense: 0.55,
    flightKeepHard: 0.28,
    impactClusterMs: 150,
    repeatMassScale: 0.10,
    maxBounceLossOfMaxMass: 0.052,
    maxBounceLossOfCurrentMass: 0.15,
    maxBreakLossOfMaxMass: 0.008,
    minMassLoss: 0.04,
    bounceMin: 68,
    bounceMax: 160,
    sideBounceMax: 92,
    bounceGraceMs: 145,
    segmentMinRows: 3,
    segmentMaxRows: 6,
    abilityDuration: 1.65,
    abilityCooldown: 5.0
  };

  const BLOCK_TIERS = {
    soft:       { label: 'Лёгкий', shock: 0.55, chip: 1.12, drag: 0.99, coin: 0.72, breakLoss:[.001,.004], bounceLoss:[.018,.028] },
    dense:      { label: 'Плотный', shock: 0.82, chip: 1.0, drag: 0.95, coin: 1.00, breakLoss:[.004,.008], bounceLoss:[.026,.038] },
    hard:       { label: 'Твёрдый', shock: 1.05, chip: 0.94, drag: 0.91, coin: 1.45, breakLoss:[.006,.010], bounceLoss:[.036,.050] },
    reinforced: { label: 'Усиленный', shock: 1.22, chip: 0.84, drag: 0.88, coin: 2.05, breakLoss:[.008,.012], bounceLoss:[.046,.060] },
    ore:        { label: 'Руда', shock: 0.86, chip: 0.99, drag: 0.94, coin: 3.55, breakLoss:[.004,.008], bounceLoss:[.030,.042] },
    special:    { label: 'Особый', shock: 0.72, chip: 1.05, drag: 0.96, coin: 1.30, breakLoss:[.002,.006], bounceLoss:[.020,.034] }
  };

  const RARITY_LABELS = {
    common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legendary: 'Легендарное',
    prismatic: 'Призматическое', secret: 'Секретное'
  };

  const FOOD_ASSET_ROOT = 'assets/food/';
  const UI_ASSET_ROOT = 'assets/ui/';
  const WORLD1_TILE_NAMES = [
    'dirt-grass', 'dirt-packed', 'stone', 'stone-reinforced', 'stone-hazard',
    'ore-coal', 'ore-iron', 'ore-copper', 'ore-gold', 'ore-redstone',
    'ore-lapis', 'ore-diamond', 'ore-emerald', 'dynamite', 'spring', 'heal',
    'portal', 'wall-intact', 'wall-cracked', 'rubble'
  ];
  const WORLD1_SPRITE_NAMES = [
    ...WORLD1_TILE_NAMES,
    ...WORLD1_TILE_NAMES.map(name => `${name}-cracked`),
    'portal-line'
  ];
  const WORLD2_TILE_NAMES = [
    'ice-light', 'snow-packed', 'glacier', 'ice-reinforced', 'ice-shards', 'ice-spikes',
    'ore-coal', 'ore-iron', 'ore-copper', 'ore-gold', 'ore-redstone', 'ore-lapis',
    'ore-diamond', 'ore-emerald', 'freeze', 'blizzard', 'heal', 'portal',
    'wall-intact', 'wall-cracked'
  ];
  const WORLD2_SPRITE_NAMES = [
    ...WORLD2_TILE_NAMES,
    ...WORLD2_TILE_NAMES.map(name => `${name}-cracked`),
    'portal-line'
  ];
  const WORLD3_TILE_NAMES = [
    'candy-light', 'cookie-packed', 'candy-reinforced', 'candy-hazard',
    'ore-coal', 'ore-iron', 'ore-copper', 'ore-gold', 'ore-redstone', 'ore-lapis',
    'ore-diamond', 'ore-emerald', 'dynamite', 'spring', 'heal', 'portal',
    'wall-intact', 'wall-cracked', 'rubble'
  ];
  const WORLD3_SPRITE_NAMES = [
    ...WORLD3_TILE_NAMES,
    ...WORLD3_TILE_NAMES.map(name => `${name}-cracked`),
    'portal-line'
  ];
  const WORLD_SPRITE_NAMES = { 1: WORLD1_SPRITE_NAMES, 2: WORLD2_SPRITE_NAMES, 3: WORLD3_SPRITE_NAMES };
  const WORLD_SPRITES = {};
  function ensureWorldSprites(worldId) {
    if (WORLD_SPRITES[worldId] || !WORLD_SPRITE_NAMES[worldId]) return WORLD_SPRITES[worldId] || null;
    const extension = worldId === 3 ? 'png' : 'webp';
    WORLD_SPRITES[worldId] = Object.fromEntries(WORLD_SPRITE_NAMES[worldId].map(name => {
      const image = new Image();
      image.src = `assets/world${worldId}/${name}.${extension}`;
      return [name, image];
    }));
    return WORLD_SPRITES[worldId];
  }

  const ORE_TYPES = [
    { id: 'coal', label: 'УГОЛЬ', min: 0, reward: .62 },
    { id: 'iron', label: 'ЖЕЛЕЗО', min: .08, reward: .82 },
    { id: 'copper', label: 'МЕДЬ', min: .16, reward: .76 },
    { id: 'gold', label: 'ЗОЛОТО', min: .28, reward: 1.22 },
    { id: 'redstone', label: 'КРАСНЫЙ КРИСТАЛЛ', min: .38, reward: 1.36 },
    { id: 'lapis', label: 'ЛАЗУРИТ', min: .46, reward: 1.48 },
    { id: 'diamond', label: 'АЛМАЗ', min: .64, reward: 2.05 },
    { id: 'emerald', label: 'ИЗУМРУД', min: .78, reward: 2.35 }
  ];

  function foodArtMarkup(food, className = 'food-model') {
    return `<img class="${className}" src="${FOOD_ASSET_ROOT}${food.id}.webp" alt="" draggable="false" decoding="async">`;
  }

  function uiIconMarkup(name, className = 'ui-inline-icon') {
    return `<img class="${className}" src="${UI_ASSET_ROOT}${name}.webp" alt="" aria-hidden="true" draggable="false" decoding="async">`;
  }

  const FOODS = [
    { id: 'apple', name: 'Яблоко', icon: '🍎', rarity: 'common', category: 'mass', minConveyor: 1, mass: 6 },
    { id: 'bun', name: 'Булочка', icon: '🥖', rarity: 'common', category: 'mass', minConveyor: 1, mass: 8 },
    { id: 'pepper', name: 'Перец', icon: '🌶️', rarity: 'common', category: 'power', minConveyor: 1, power: 0.42 },
    { id: 'yogurt', name: 'Йогурт', icon: '🥛', rarity: 'common', category: 'defense', minConveyor: 1, mass: 3, defense: 0.07 },
    { id: 'popcorn', name: 'Попкорн', icon: '🍿', rarity: 'common', category: 'bounce', minConveyor: 1, mass: 3, elasticity: 0.10 },
    { id: 'gummy', name: 'Желейка', icon: '🍬', rarity: 'common', category: 'magic', minConveyor: 1, mass: 2, ability: 7 },

    { id: 'burger', name: 'Бургер', icon: '🍔', rarity: 'rare', category: 'mass', minConveyor: 1, mass: 14 },
    { id: 'pudding', name: 'Пудинг', icon: '🍮', rarity: 'rare', category: 'defense', minConveyor: 1, mass: 5, defense: 0.12 },
    { id: 'soda', name: 'Газировка', icon: '🥤', rarity: 'rare', category: 'bounce', minConveyor: 2, mass: 4, elasticity: 0.20, ability: 10 },
    { id: 'steak', name: 'Стейк', icon: '🥩', rarity: 'rare', category: 'power', minConveyor: 2, mass: 7, power: 0.54 },
    { id: 'hotdog', name: 'Хот-дог', icon: '🌭', rarity: 'rare', category: 'power', minConveyor: 2, mass: 9, power: 0.28 },
    { id: 'iceCream', name: 'Мороженое', icon: '🍦', rarity: 'rare', category: 'defense', minConveyor: 2, mass: 7, defense: 0.09, elasticity: 0.07 },
    { id: 'cheese', name: 'Сырная тарелка', icon: '🧀', rarity: 'rare', category: 'mass', minConveyor: 2, mass: 11, defense: 0.04 },

    { id: 'donut', name: 'Прыгучий пончик', icon: '🍩', rarity: 'epic', category: 'bounce', minConveyor: 2, mass: 7, elasticity: 0.34 },
    { id: 'spicyBurger', name: 'Острый бургер', icon: '🍔', rarity: 'epic', category: 'power', minConveyor: 2, mass: 11, power: 0.92 },
    { id: 'jellyShield', name: 'Бронежеле', icon: '🫐', rarity: 'epic', category: 'defense', minConveyor: 3, mass: 9, defense: 0.21 },
    { id: 'magnetCandy', name: 'Магнитная конфета', icon: '🍭', rarity: 'epic', category: 'magic', minConveyor: 3, mass: 6, coinMultiplier: 0.45 },
    { id: 'powerPizza', name: 'Силовая пицца', icon: '🍕', rarity: 'epic', category: 'power', minConveyor: 3, mass: 13, power: 0.66 },
    { id: 'giantMochi', name: 'Гигантский моти', icon: '🍡', rarity: 'epic', category: 'defense', minConveyor: 3, mass: 15, defense: 0.12, elasticity: 0.13 },
    { id: 'phoenixPepper', name: 'Перец феникса', icon: '🔥', rarity: 'epic', category: 'power', minConveyor: 4, mass: 5, power: 0.95, ability: 14, effect: 'smallRevive', effectText: 'Один раз спасает с 12% массы' },

    { id: 'rainbowCake', name: 'Радужный торт', icon: '🍰', rarity: 'legendary', category: 'mass', minConveyor: 3, mass: 20, power: 0.38, defense: 0.10, effect: 'rainbow', effectText: '+10% ко всем числовым бонусам' },
    { id: 'giantPizza', name: 'Пицца-титан', icon: '🍕', rarity: 'legendary', category: 'mass', minConveyor: 4, mass: 27, effect: 'momentum', effectText: 'Пробитые блоки почти не гасят разгон' },
    { id: 'dragonRamen', name: 'Драконий рамен', icon: '🍜', rarity: 'legendary', category: 'power', minConveyor: 4, mass: 10, power: 1.38, ability: 14, effect: 'dragonBlast', effectText: 'Каждый 10-й пробитый блок взрывается' },
    { id: 'diamondJelly', name: 'Алмазное желе', icon: '💎', rarity: 'legendary', category: 'defense', minConveyor: 4, mass: 12, defense: 0.25, effect: 'freeBounces', effectText: 'Первые 3 рикошета не тратят массу' },
    { id: 'cosmicSoda', name: 'Космическая газировка', icon: '🪐', rarity: 'legendary', category: 'magic', minConveyor: 5, mass: 9, elasticity: 0.35, ability: 20, effect: 'chargeBoost', effectText: 'Импульс заряжается на 25% быстрее' },
    { id: 'goldenFeast', name: 'Золотой пир', icon: '👑', rarity: 'legendary', category: 'magic', minConveyor: 5, mass: 16, coinMultiplier: 0.75, ability: 15, effect: 'oreHeal', effectText: 'Руда и монетные блоки лечат слайма' },
    { id: 'starFruit', name: 'Звёздный фрукт', icon: '🌟', rarity: 'legendary', category: 'magic', minConveyor: 5, mass: 14, power: 0.80, elasticity: 0.24, ability: 18, effect: 'cooldownCut', effectText: 'Перезарядка импульса короче на 1,5 сек' },
    { id: 'moonMochi', name: 'Лунный моти', icon: '🌕', rarity: 'legendary', category: 'bounce', minConveyor: 4, mass: 17, defense: 0.12, elasticity: 0.34, effect: 'softLanding', effectText: 'После рикошета 1 секунда сниженного урона' },
    { id: 'kingPudding', name: 'Королевский пудинг', icon: '🏰', rarity: 'legendary', category: 'defense', minConveyor: 5, mass: 19, defense: 0.24, effect: 'healBoost', effectText: 'Лечащие блоки восстанавливают вдвое больше' },
    { id: 'blackHoleCandy', name: 'Конфета чёрной дыры', icon: '🕳️', rarity: 'legendary', category: 'magic', minConveyor: 5, mass: 11, power: 0.62, effect: 'bombPull', effectText: 'Взрывные блоки детонируют рядом' },

    { id: 'prismApple', name: 'Призматическое яблоко', icon: '🍎', rarity: 'prismatic', category: 'mass', minConveyor: 4, mass: 24, power: 0.55, defense: 0.12, effect: 'prismFlow', effectText: '+12% ко всем числовым бонусам еды' },
    { id: 'prismBerry', name: 'Призматические ягоды', icon: '🍇', rarity: 'prismatic', category: 'magic', minConveyor: 4, mass: 12, power: 0.45, ability: 22, effect: 'chargeBoost', effectText: 'Импульс заряжается на 25% быстрее' },
    { id: 'prismPear', name: 'Призматическая груша', icon: '🍐', rarity: 'prismatic', category: 'defense', minConveyor: 5, mass: 18, defense: 0.20, effect: 'freeBounces', effectText: 'Первые 3 рикошета не тратят массу' },

    { id: 'voidFruit', name: 'Фрукт Пустоты', icon: '🫐', rarity: 'secret', category: 'power', minConveyor: 5, mass: 22, power: 1.15, defense: 0.12, effect: 'voidBreaker', effectText: 'Первый непробиваемый твёрдый блок исчезает' },
    { id: 'rainbowHeart', name: 'Сердце Радуги', icon: '💖', rarity: 'secret', category: 'mass', minConveyor: 5, mass: 30, power: 0.75, defense: 0.18, effect: 'rainbowHeart', effectText: 'Один раз восстанавливает 30% массы' }
  ];

  const SKINS = [
    { id: 'classic', name: 'Классический', className: 'skin-classic', icon: '🟢', condition: 'Доступен сразу', colors: ['#e9ff9c', '#67d348', '#2fa345'] },
    { id: 'pink', name: 'Котослайм', className: 'skin-pink', icon: '🐱', world: 2, condition: 'Пройди Мир 1', colors: ['#fecdd3', '#fb7185', '#db2777'] },
    { id: 'ice', name: 'Аксолотль', className: 'skin-ice', icon: '🫧', world: 3, condition: 'Пройди Мир 2', colors: ['#cffafe', '#22d3ee', '#0284c7'] },
    { id: 'gold', name: 'Золотой', className: 'skin-gold', icon: '👑', cost: 1500, condition: 'Купить за 1500 монет', colors: ['#fef3c7', '#facc15', '#ca8a04'] },
    { id: 'dark', name: 'Космослайм', className: 'skin-dark', icon: '🌌', world: 5, condition: 'Пройди Мир 4', colors: ['#c4b5fd', '#7c3aed', '#312e81'] }
  ];

  const UPGRADE_DATA = {
    stomachLevel: {
      name: 'Желудок', icon: 'stomach', max: 5,
      description: 'Вместимость: от 1 до 5 блюд. Главный источник разнообразия билдов.',
      costs: [0, 45, 180, 650, 2100]
    },
    conveyorLevel: {
      name: 'Конвейер', icon: 'conveyor', max: 5,
      description: 'Снижает шанс обычной еды и открывает эпические, легендарные, призматические и секретные блюда.',
      costs: [0, 90, 340, 1150, 3600]
    },
    rerollLevel: {
      name: 'Бесплатные рероллы', icon: 'reroll', max: 3,
      description: '+1 бесплатный реролл на каждый забег. После них — только rewarded-реклама.',
      costs: [180, 900, 3500]
    }
  };

  const defaultSave = {
    schemaVersion: 8,
    coins: 20,
    world: 1,
    worldBest: { 1: 0, 2: 0, 3: 0, 4: 0 },
    stomachLevel: 1,
    conveyorLevel: 1,
    rerollLevel: 0,
    bestDepth: 0,
    selectedSkin: 'classic',
    unlockedSkins: ['classic'],
    lastDailyDate: '', dailyStreak: 0,
    lastWheelDate: '', wheelAdDate: '', wheelAdSpins: 0,
    pendingEpicBoost: 0, pendingMassBoost: 0, pendingExtraRerolls: 0,
    foodPity: { noEpic: 0, noLegendary: 0, noPrismatic: 0, noSecret: 0 },
    activeDraft: null,
    pendingWheel: null,
    totalRuns: 0, sound: true
  };

  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const els = {
    coinsLabel: $('#coinsLabel'), worldLabel: $('#worldLabel'), worldProgressText: $('#worldProgressText'),
    worldProgressBar: $('#worldProgressBar'), worldHint: $('#worldHint'),
    homeScreen: $('#homeScreen'), dropScreen: $('#dropScreen'), slimeStage: $('#slimeStage'), slime: $('#slime'),
    menuSlimeCanvas: $('#menuSlimeCanvas'), menuSlimeMouth: $('#menuSlimeMouth'),
    foodInside: $('#foodInside'), rarityBursts: $('#rarityBursts'), buffList: $('#buffList'), massLabel: $('#massLabel'), powerLabel: $('#powerLabel'),
    defenseLabel: $('#defenseLabel'), bounceLabel: $('#bounceLabel'), stomachSlots: $('#stomachSlots'),
    massCompare: $('#massCompare'), powerCompare: $('#powerCompare'), defenseCompare: $('#defenseCompare'), bounceCompare: $('#bounceCompare'),
    startDropLabel: $('#startDropLabel'), adminRestartBtn: $('#adminRestartBtn'),
    adminPrevWorldBtn: $('#adminPrevWorldBtn'), adminNextWorldBtn: $('#adminNextWorldBtn'),
    adminWorldValue: $('#adminWorldValue'), adminResetProgressBtn: $('#adminResetProgressBtn'),
    conveyor: $('#conveyor'), foodChoices: $('#foodChoices'), rerollBtn: $('#rerollBtn'), rerollTitle: $('#rerollTitle'), rerollText: $('#rerollText'), pickCounter: $('#pickCounter'),
    foodInfo: $('#foodInfo'), foodInfoIcon: $('#foodInfoIcon'), foodInfoName: $('#foodInfoName'), foodInfoRarity: $('#foodInfoRarity'),
    foodInfoStats: $('#foodInfoStats'), foodInfoEffect: $('#foodInfoEffect'), feedSelectedBtn: $('#feedSelectedBtn'), buffShelf: $('#buffShelf'),
    startDropBtn: $('#startDropBtn'),
    depthLabel: $('#depthLabel'), runMassLabel: $('#runMassLabel'), flightLabel: $('#flightLabel'), runCoinsLabel: $('#runCoinsLabel'),
    shaft: $('#shaft'), canvas: $('#physicsCanvas'), impactText: $('#impactText'), worldTargetBadge: $('#worldTargetBadge'),
    abilityBtn: $('#abilityBtn'), abilityPercent: $('#abilityPercent'), abilityText: $('#abilityText'), endRunBtn: $('#endRunBtn'),
    panelOverlay: $('#panelOverlay'), panelTitle: $('#panelTitle'), panelContent: $('#panelContent'), closePanelBtn: $('#closePanelBtn'),
    resultOverlay: $('#resultOverlay'), resultBadge: $('#resultBadge'), resultTitle: $('#resultTitle'), resultText: $('#resultText'),
    resultCoins: $('#resultCoins'), resultBlocks: $('#resultBlocks'), resultFlight: $('#resultFlight'),
    doubleBtn: $('#doubleBtn'), continueBtn: $('#continueBtn'),
    adOverlay: $('#adOverlay'), adReason: $('#adReason'), adRewardBtn: $('#adRewardBtn'), adCancelBtn: $('#adCancelBtn'),
    toast: $('#toast')
  };

  let save = loadSave();
  let session = null;
  let run = null;
  let pendingAdResolver = null;
  let adInFlight = false;
  let suppressFoodClickUntil = 0;
  let lastFocusedElement = null;
  let menuEmotionTimer = null;
  let menuGazeTimer = null;
  let slimeInteractionTimer = null;
  let slimePointer = null;
  let menuSlimeAnimationId = 0;
  let menuSlimeLastFrame = 0;
  const menuGaze = { x: 0, y: 0 };
  const menuPetPoint = { x: 0, y: 0 };
  let toastTimer = null;
  let audioCtx = null;
  const soundPools = new Map();
  const SOUND_ROOT = 'assets/audio/';
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
  let dragState = null;
  let selectedFoodOfferIndex = null;
  const ctx = els.canvas.getContext('2d');
  const menuSlimeCtx = els.menuSlimeCanvas.getContext('2d');

  function loadSave() {
    try {
      let parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!parsed) {
        for (const legacyKey of LEGACY_SAVE_KEYS) {
          parsed = JSON.parse(localStorage.getItem(legacyKey) || 'null');
          if (parsed) break;
        }
      }
      if (!parsed) return structuredClone(defaultSave);
      return normalizeSave({ ...structuredClone(defaultSave), ...parsed });
    } catch (error) {
      console.warn('Save reset:', error);
      return structuredClone(defaultSave);
    }
  }

  function normalizeSave(value) {
    const merged = { ...structuredClone(defaultSave), ...value };
    merged.schemaVersion = 8;
    merged.coins = Math.max(0, Number.isFinite(+merged.coins) ? +merged.coins : defaultSave.coins);
    merged.world = clamp(Math.round(+merged.world || 1), 1, WORLDS.length);
    merged.stomachLevel = clamp(Math.round(+merged.stomachLevel || 1), 1, UPGRADE_DATA.stomachLevel.max);
    merged.conveyorLevel = clamp(Math.round(+merged.conveyorLevel || 1), 1, UPGRADE_DATA.conveyorLevel.max);
    merged.rerollLevel = clamp(Math.round(+merged.rerollLevel || 0), 0, UPGRADE_DATA.rerollLevel.max);
    merged.bestDepth = Math.max(0, +merged.bestDepth || 0);
    merged.totalRuns = Math.max(0, Math.round(+merged.totalRuns || 0));
    merged.worldBest = { ...defaultSave.worldBest };
    for (const world of WORLDS) merged.worldBest[world.id] = clamp(+(value.worldBest?.[world.id] || 0), 0, world.targetDepth);
    merged.unlockedSkins = Array.isArray(value.unlockedSkins) ? [...new Set(value.unlockedSkins.filter(id => SKINS.some(skin => skin.id === id)))] : ['classic'];
    if (!merged.unlockedSkins.includes('classic')) merged.unlockedSkins.unshift('classic');
    if (!SKINS.some(skin => skin.id === merged.selectedSkin)) merged.selectedSkin = 'classic';
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
    return true;
  }

  function persist({ captureDraft = true } = {}) {
    if (captureDraft && session && !run) save.activeDraft = serializeSession();
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    updatePersistentUI();
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rand(min, max) { return min + Math.random() * (max - min); }
  function round1(value) { return Math.round(value * 10) / 10; }
  function foodGrowthScale(foodCount) { return 1 + Math.max(0, foodCount) * .05; }
  function todayKey(date = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return todayKey(d); }
  function currentWorld() { return WORLDS[clamp(save.world - 1, 0, WORLDS.length - 1)]; }
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
      prismatic: 'РАДУЖНЫЙ ВКУС!', secret: 'СЕКРЕТНЫЙ ВКУС!'
    };
    const burst = document.createElement('span');
    burst.className = `rarity-burst ${food.rarity}`;
    burst.textContent = titles[food.rarity] || 'ВКУСНО!';
    els.rarityBursts.replaceChildren(burst);
    setTimeout(() => burst.remove(), food.rarity === 'secret' ? 2400 : food.rarity === 'prismatic' ? 2200 : 1750);
  }

  function fallbackSound(kind = 'tap') {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const now = audioCtx.currentTime;
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
      oscillator.connect(gain).connect(audioCtx.destination);
      oscillator.start(now); oscillator.stop(now + duration);
    } catch (_) { /* optional audio */ }
  }

  function getSoundPool(kind) {
    const config = SOUND_ASSETS[kind];
    if (!config || typeof Audio === 'undefined') return null;
    if (soundPools.has(kind)) return soundPools.get(kind);
    const pool = Array.from({ length: config.size }, () => {
      const audio = new Audio(new URL(`${SOUND_ROOT}${config.file}`, document.baseURI).href);
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

  function sound(kind = 'tap') {
    if (!save.sound) return;
    if (kind === 'eat' || kind === 'eatSlow') {
      const biteDelay = kind === 'eatSlow' ? 720 : 220;
      const swallowDelay = kind === 'eatSlow' ? 2320 : 480;
      setTimeout(() => { if (save.sound && !document.hidden) playSoundAsset('eatBite'); }, biteDelay);
      setTimeout(() => { if (save.sound && !document.hidden) playSoundAsset('eatSwallow'); }, swallowDelay);
      return;
    }
    playSoundAsset(kind);
  }

  function stopAllSounds() {
    soundPools.forEach(pool => pool.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    }));
    if (audioCtx?.state === 'running') audioCtx.suspend().catch(() => {});
  }

  function feedback(pattern = 8) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  function updatePersistentUI() {
    els.coinsLabel.textContent = Math.floor(save.coins).toLocaleString('ru-RU');
    const world = currentWorld();
    document.body.dataset.world = String(world.id);
    ensureWorldSprites(world.id);
    const best = Math.floor(save.worldBest[world.id] || 0);
    els.worldLabel.textContent = `Мир ${world.id} · ${world.name}`;
    els.worldProgressText.textContent = `${best} / ${world.targetDepth} м`;
    els.worldProgressBar.style.width = `${clamp(best / world.targetDepth * 100, 0, 100)}%`;
    els.worldProgressBar.parentElement.setAttribute('aria-valuenow', String(Math.round(clamp(best / world.targetDepth * 100, 0, 100))));
    els.worldHint.textContent = best > 0
      ? `До портала осталось ${Math.max(0, world.targetDepth - best)} м`
      : 'Доберись до портала внизу мира';
    if (els.adminWorldValue) els.adminWorldValue.textContent = `МИР ${world.id}`;
    applySkin();
  }

  function applySkin() {
    [...els.slime.classList].filter(c => c.startsWith('skin-')).forEach(c => els.slime.classList.remove(c));
    els.slime.classList.add('skin-classic');
  }

  function animateFoodToMouth(food, source) {
    if (!source?.isConnected) return;
    const from = source.getBoundingClientRect();
    const mouth = els.menuSlimeMouth?.getBoundingClientRect();
    if (!mouth) return;
    setMenuGazePoint(from.left + from.width / 2, from.top + from.height / 2);
    els.slime.classList.add('tracking-food', 'expect-food');
    const flyer = document.createElement('span');
    flyer.className = `swallow-fruit ${food.rarity}`;
    const swallowMs = food.rarity === 'secret' ? 780 : 340;
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
      els.slime.classList.remove('tracking-food', 'expect-food');
      resetMenuGaze(180);
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

  function menuSlimeIsBusy() {
    return ['eat', 'chewing', 'expect-food', 'tracking-food'].some(name => els.slime.classList.contains(name));
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
    els.homeScreen.classList.toggle('active', name === 'home');
    els.dropScreen.classList.toggle('active', name === 'drop');
    if (name === 'home') startMenuSlimeLoop();
    else if (menuSlimeAnimationId) {
      cancelAnimationFrame(menuSlimeAnimationId);
      menuSlimeAnimationId = 0;
    }
  }

  function newDraft() {
    document.body.classList.remove('secret-feast', 'secret-reveal');
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
    localStorage.removeItem(SAVE_KEY);
    for (const legacyKey of LEGACY_SAVE_KEYS) localStorage.removeItem(legacyKey);
    save = structuredClone(defaultSave);
    session = null;
    run = null;
    selectedFoodOfferIndex = null;
    sound('tap');
    newDraft();
    showToast('Прогресс полностью сброшен');
  }

  function rarityWeights(boost = 0) {
    const tables = [
      { common: 80, rare: 19, epic: 1, legendary: 0, prismatic: 0, secret: 0 },
      { common: 70, rare: 25, epic: 5, legendary: 0, prismatic: 0, secret: 0 },
      { common: 58, rare: 30, epic: 10, legendary: 2, prismatic: 0, secret: 0 },
      { common: 46, rare: 31, epic: 16, legendary: 5, prismatic: 2, secret: 0 },
      { common: 36.7, rare: 31, epic: 20, legendary: 8, prismatic: 4, secret: 0.3 }
    ];
    const base = { ...tables[save.conveyorLevel - 1] };
    const epicAdd = clamp(boost, 0, 10);
    const moved = Math.min(base.common - 5, epicAdd);
    base.common -= moved;
    base.epic += moved;
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

  function randomFood(exclude = [], minimumRarity = null, rollBoost = 0) {
    let rarity = weightedRarity(rarityWeights(rollBoost));
    if (minimumRarity && rarityRank(rarity) < rarityRank(minimumRarity)) rarity = minimumRarity;
    let pool = FOODS.filter(food => food.rarity === rarity && food.minConveyor <= save.conveyorLevel && !exclude.includes(food.id));
    if (!pool.length) {
      const order = ['secret', 'prismatic', 'legendary', 'epic', 'rare', 'common'];
      const allowed = minimumRarity ? order.filter(r => rarityRank(r) >= rarityRank(minimumRarity)) : order;
      for (const fallback of allowed) {
        pool = FOODS.filter(food => food.rarity === fallback && food.minConveyor <= save.conveyorLevel && !exclude.includes(food.id));
        if (pool.length) break;
      }
    }
    return pool[Math.floor(Math.random() * pool.length)] || FOODS[0];
  }

  function generateOffer(rollBoost = 0) {
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
      const food = randomFood(used, i === guaranteedSlot ? guaranteed : null, rollBoost);
      offer[i] = food;
      used.push(food.id);
    }
    session.offer = offer;
    session.offersSeen += 1;
    session.commonOnlyStreak = offer.some(food => rarityRank(food.rarity) >= 1) ? 0 : session.commonOnlyStreak + 1;

    pity.noEpic = offer.some(food => rarityRank(food.rarity) >= 2) ? 0 : pity.noEpic + 1;
    pity.noLegendary = offer.some(food => rarityRank(food.rarity) >= 3) ? 0 : pity.noLegendary + 1;
    pity.noPrismatic = offer.some(food => rarityRank(food.rarity) >= 4) ? 0 : pity.noPrismatic + 1;
    pity.noSecret = offer.some(food => food.rarity === 'secret') ? 0 : pity.noSecret + 1;
    save.foodPity = pity;
    persist();
  }

  function foodPrimaryStat(food) {
    const options = [
      { key: 'mass', value: food.mass || 0, score: (food.mass || 0) / 12, icon: uiIconMarkup('stat-mass', 'food-stat-icon'), label: `+${food.mass || 0} массы` },
      { key: 'power', value: food.power || 0, score: (food.power || 0) / .7, icon: uiIconMarkup('stat-power', 'food-stat-icon'), label: `+${round1(food.power || 0)} силы` },
      { key: 'defense', value: food.defense || 0, score: (food.defense || 0) / .14, icon: uiIconMarkup('stat-defense', 'food-stat-icon'), label: `+${Math.round((food.defense || 0) * 100)}% защиты` },
      { key: 'bounce', value: food.elasticity || 0, score: (food.elasticity || 0) / .22, icon: uiIconMarkup('stat-bounce', 'food-stat-icon'), label: `+${Math.round((food.elasticity || 0) * 100)}% отскока` },
      { key: 'ability', value: food.ability || 0, score: (food.ability || 0) / 16, icon: uiIconMarkup('buff', 'food-stat-icon'), label: `+${food.ability || 0}% заряда` },
      { key: 'coins', value: food.coinMultiplier || 0, score: (food.coinMultiplier || 0) / .45, icon: uiIconMarkup('coin', 'food-stat-icon'), label: `+${Math.round((food.coinMultiplier || 0) * 100)}% монет` }
    ].filter(item => item.value > 0).sort((a, b) => b.score - a.score);
    return options[0] || { key: 'magic', icon: uiIconMarkup('special', 'food-stat-icon'), label: 'Особый эффект' };
  }

  function foodStatChips(food, omitKey = '') {
    const parts = [];
    if (food.mass && omitKey !== 'mass') parts.push(`<span class="stat-chip mass">${uiIconMarkup('stat-mass', 'chip-stat-icon')}${food.mass}</span>`);
    if (food.power && omitKey !== 'power') parts.push(`<span class="stat-chip power">${uiIconMarkup('stat-power', 'chip-stat-icon')}${round1(food.power)}</span>`);
    if (food.defense && omitKey !== 'defense') parts.push(`<span class="stat-chip defense">${uiIconMarkup('stat-defense', 'chip-stat-icon')}${Math.round(food.defense * 100)}%</span>`);
    if (food.elasticity && omitKey !== 'bounce') parts.push(`<span class="stat-chip bounce">${uiIconMarkup('stat-bounce', 'chip-stat-icon')}${Math.round(food.elasticity * 100)}%</span>`);
    if (food.ability && omitKey !== 'ability') parts.push(`<span class="stat-chip ability">${uiIconMarkup('buff', 'chip-stat-icon')}${food.ability}%</span>`);
    if (food.coinMultiplier && omitKey !== 'coins') parts.push(`<span class="stat-chip coins">${uiIconMarkup('coin', 'chip-stat-icon')}${Math.round(food.coinMultiplier * 100)}%</span>`);
    return parts.join('');
  }

  function countCategories(foods) {
    return foods.reduce((acc, food) => {
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
      stats.mass += food.mass || 0;
      stats.power += food.power || 0;
      stats.defense += food.defense || 0;
      stats.elasticity += food.elasticity || 0;
      stats.ability += food.ability || 0;
      stats.coinMultiplier += food.coinMultiplier || 0;
      if (food.effect) effects[food.effect] = food.effect === 'freeBounces' ? 3 : true;
    }

    if (effects.rainbow || effects.prismFlow) {
      const boost = effects.prismFlow ? 1.12 : 1.10;
      stats.mass *= boost;
      stats.power = 1 + (stats.power - 1) * boost;
      stats.defense *= boost;
      stats.elasticity = 1 + (stats.elasticity - 1) * boost;
      stats.ability *= boost;
      stats.coinMultiplier = 1 + (stats.coinMultiplier - 1) * boost;
    }

    let combo = null;
    if (counts.mass >= 3) { stats.mass *= 1.25; combo = { icon: '🍔', name: 'Суперразмер', text: '+25% массы' }; }
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

  function clearFoodPreview() {
    [els.massCompare, els.powerCompare, els.defenseCompare, els.bounceCompare].forEach(element => {
      if (element) element.textContent = '';
    });
    $$('.slime-stage .stat-pill').forEach(pill => pill.classList.remove('previewing'));
  }

  function showFoodPreview(food) {
    if (!food || session.foods.length >= save.stomachLevel) return clearFoodPreview();
    const next = calculateStatsForFoods([...session.foods, food]).stats;
    const comparisons = [
      [els.massCompare, next.mass, session.stats.mass, value => Math.round(value)],
      [els.powerCompare, next.power, session.stats.power, value => `×${value.toFixed(1)}`],
      [els.defenseCompare, next.defense, session.stats.defense, value => `${Math.round(value * 100)}%`],
      [els.bounceCompare, next.elasticity, session.stats.elasticity, value => `×${value.toFixed(1)}`]
    ];
    comparisons.forEach(([element, value, current, format]) => {
      if (!element) return;
      const changed = Math.abs(value - current) > .001;
      element.textContent = changed ? `→ ${format(value)}` : '';
      element.closest('.stat-pill')?.classList.toggle('previewing', changed);
    });
  }

  // ===== ГЛАВНЫЙ ЭКРАН: желудок, эффекты и выдача еды =====
  function renderStomachSlots(capacity) {
    els.stomachSlots.replaceChildren();
    for (let index = 0; index < capacity; index += 1) {
      const slot = document.createElement('div');
      const food = session.foods[index];
      slot.className = `stomach-slot ${food ? `filled ${food.rarity}` : ''}`;
      slot.innerHTML = food
        ? `<span class="slot-art">${foodArtMarkup(food, 'food-mini-model')}</span>`
        : `<span class="slot-plus">+</span>`;
      slot.setAttribute('aria-label', food ? `Слот ${index + 1}: ${food.name}` : `Слот ${index + 1}: пусто`);
      els.stomachSlots.appendChild(slot);
    }
  }

  function renderSpecialBuffs() {
    els.buffList.replaceChildren();
    if (session.combo) {
      const combo = document.createElement('div');
      combo.className = 'buff-chip combo';
      combo.innerHTML = `<span>${session.combo.icon}</span><div><b>${session.combo.name}</b><small>Комбо сборки</small></div>`;
      els.buffList.appendChild(combo);
    }
    session.foods.filter(food => food.effectText).forEach(food => {
      const buff = document.createElement('div');
      buff.className = `buff-chip special ${food.rarity}`;
      buff.innerHTML = `<span>${foodArtMarkup(food, 'food-buff-model')}</span><div><b>${food.name}</b><small>${food.effectText}</small></div>`;
      els.buffList.appendChild(buff);
    });
    els.buffShelf?.classList.toggle('hidden', !els.buffList.children.length);
  }

  function hideFoodInfo() {
    selectedFoodOfferIndex = null;
    els.foodInfo?.classList.add('hidden');
    els.foodInfo?.classList.remove('below');
    els.foodInfo?.style.removeProperty('left');
    els.foodInfo?.style.removeProperty('top');
    $$('.food-card.selected').forEach(card => card.classList.remove('selected'));
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

  function showFoodInfo(food, offerIndex, source) {
    if (!food || !els.foodInfo) return;
    selectedFoodOfferIndex = offerIndex;
    $$('.food-card.selected').forEach(card => card.classList.remove('selected'));
    source?.classList.add('selected');
    const primary = foodPrimaryStat(food);
    els.foodInfoIcon.innerHTML = foodArtMarkup(food, 'food-info-model');
    els.foodInfoName.textContent = food.name;
    els.foodInfoRarity.textContent = RARITY_LABELS[food.rarity];
    els.foodInfoStats.innerHTML = `<strong>${primary.icon} ${primary.label}</strong>${foodStatChips(food, primary.key)}`;
    els.foodInfoEffect.textContent = food.effectText ? `✦ ${food.effectText}` : '';
    els.foodInfoEffect.classList.toggle('hidden', !food.effectText);
    els.foodInfo.className = `food-info ${food.rarity}`;
    positionFoodInfoPopover(source);
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
    els.pickCounter.textContent = `${session.foods.length} / ${capacity}`;
    if (els.startDropLabel) els.startDropLabel.textContent = 'СТАРТ';
    clearFoodPreview();
    els.rerollBtn.disabled = full;

    const scale = foodGrowthScale(session.foods.length);
    els.slime.style.width = `${124 * scale}px`;
    els.slime.style.height = `${124 * scale}px`;

    renderStomachSlots(capacity);
    els.foodInside.replaceChildren();
    renderSpecialBuffs();

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
      button.className = `food-card ${food.rarity} ${offerMotion === 'enter' ? 'tunnel-enter' : ''} ${full ? 'locked' : ''}`;
      button.style.animationDelay = offerMotion === 'enter' ? `${index * 90}ms` : '0ms';
      button.dataset.foodId = food.id;
      button.dataset.offerIndex = String(index);
      const primary = foodPrimaryStat(food);
      button.innerHTML = `
        <span class="rarity"><i aria-hidden="true"></i>${RARITY_LABELS[food.rarity]}</span>
        <span class="food-model-wrap">${foodArtMarkup(food)}</span>
        <span class="food-name">${food.name}</span>
        <span class="food-primary ${primary.key}">${primary.icon} ${primary.label}</span>
        <span class="food-chips">${foodStatChips(food)}</span>
        ${food.effectText ? '<span class="food-effect">✦ Особый эффект</span>' : '<span class="food-effect empty-effect" aria-hidden="true"></span>'}`;
      button.type = 'button';
      button.setAttribute('aria-label', `${food.name}. ${primary.label}. Открыть описание`);
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
      if (els.rerollText) els.rerollText.textContent = `Бесплатно ×${session.freeRerolls}`;
      els.rerollBtn.classList.remove('ad-mode');
    } else {
      if (els.rerollTitle) els.rerollTitle.textContent = 'ОБНОВИТЬ';
      if (els.rerollText) els.rerollText.textContent = 'За рекламу · Эпик +10%';
      els.rerollBtn.classList.add('ad-mode');
      els.rerollBtn.disabled = full;
    }

    if (selectedFoodOfferIndex !== null && !session.offer[selectedFoodOfferIndex]) hideFoodInfo();
  }

  // ===== КОРМЛЕНИЕ: клик, перетаскивание и эмоции =====
  function beginFoodDrag(event, food, offerIndex, source) {
    if (session.foods.length >= save.stomachLevel || event.button > 0) return;
    event.preventDefault();
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
      if (accepted) showFoodPreview(food);
      else clearFoodPreview();
    };

    const onUp = upEvent => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
      els.slime.classList.remove('drop-ready', 'expect-food', 'tracking-food');
      clearFoodPreview();
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
    if (session.foods.length >= save.stomachLevel) return;
    const food = session.offer[offerIndex];
    if (!food) return;
    hideFoodInfo();
    clearMenuSlimeInteraction();
    animateFoodToMouth(food, source);
    const previousCombo = session.combo?.name || '';
    session.foods.push(food);
    session.offer[offerIndex] = null;
    const mealReaction = {
      common: { catchMs: 250, chewMs: 340, chewTime: '.15s', chews: 2, happyMs: 430 },
      rare: { catchMs: 290, chewMs: 460, chewTime: '.16s', chews: 3, happyMs: 560 },
      epic: { catchMs: 350, chewMs: 650, chewTime: '.18s', chews: 4, happyMs: 820 },
      legendary: { catchMs: 430, chewMs: 820, chewTime: '.19s', chews: 4, happyMs: 1100 },
      prismatic: { catchMs: 500, chewMs: 940, chewTime: '.2s', chews: 5, happyMs: 1320 },
      secret: { catchMs: 820, chewMs: 1600, chewTime: '.25s', chews: 6, happyMs: 1700 }
    }[food.rarity] || { catchMs: 250, chewMs: 340, chewTime: '.15s', chews: 2, happyMs: 430 };
    document.body.classList.remove('secret-feast', 'secret-reveal');
    if (food.rarity === 'secret') document.body.classList.add('secret-feast');
    sound(food.rarity === 'secret' ? 'eatSlow' : 'eat');
    clearTimeout(menuEmotionTimer);
    els.slime.classList.remove('eat', 'chewing', 'pleased', ...MEAL_REACTION_CLASSES);
    els.slime.classList.add(`meal-${food.rarity}`);
    els.slime.style.setProperty('--catch-time', `${mealReaction.catchMs}ms`);
    els.slime.style.setProperty('--chew-time', mealReaction.chewTime);
    els.slime.style.setProperty('--chew-count', String(mealReaction.chews));
    els.slime.style.setProperty('--happy-time', `${mealReaction.happyMs}ms`);
    void els.slime.offsetWidth;
    els.slime.classList.add('eat');
    showRarityBurst(food);
    menuEmotionTimer = setTimeout(() => {
      els.slime.classList.remove('eat', 'expect-food', 'tracking-food');
      els.slime.classList.add('chewing');
      resetMenuGaze();
      menuEmotionTimer = setTimeout(() => {
        els.slime.classList.remove('chewing');
        els.slime.classList.add('pleased');
        if (food.rarity === 'secret') document.body.classList.add('secret-reveal');
        sound(['epic', 'legendary', 'prismatic', 'secret'].includes(food.rarity) ? 'epic' : 'happy');
        menuEmotionTimer = setTimeout(() => {
          els.slime.classList.remove('pleased', ...MEAL_REACTION_CLASSES);
          document.body.classList.remove('secret-feast', 'secret-reveal');
        }, mealReaction.happyMs);
      }, mealReaction.chewMs);
    }, mealReaction.catchMs);
    renderDraft();
    persist();
    feedback(food.rarity === 'legendary' || food.rarity === 'prismatic' || food.rarity === 'secret' ? [12, 30, 18] : 8);
    if (session.combo && session.combo.name !== previousCombo) showToast(`${session.combo.icon} Комбо: ${session.combo.name} — ${session.combo.text}`);
  }


  async function rerollOffer() {
    if (session.foods.length >= save.stomachLevel || session.rerollPending || adInFlight) return;
    session.rerollPending = true;
    hideFoodInfo();
    els.rerollBtn.disabled = true;
    let rollBoost = session.baseEpicBoost || 0;
    try {
      if (session.freeRerolls > 0) {
        session.freeRerolls -= 1;
      } else {
        const rewarded = await showRewardedAd('Новая тройка еды. Для этой выдачи шанс эпической еды повышен на 10%.');
        if (!rewarded) return;
        session.adRerolls += 1;
        rollBoost += 10;
      }
      sound(rollBoost >= 10 ? 'epic' : 'reroll');
      feedback(6);
      els.conveyor.classList.add('is-running');
      $$('.food-card').forEach((card, index) => {
        card.style.animationDelay = `${index * 70}ms`;
        card.classList.add('leaving');
      });
      await new Promise(resolve => setTimeout(resolve, 660));
      generateOffer(rollBoost);
      renderDraft({ offerMotion: 'enter' });
      persist();
      await new Promise(resolve => setTimeout(resolve, 760));
    } finally {
      session.rerollPending = false;
      els.conveyor.classList.remove('is-running');
      renderDraft();
    }
  }

  // ===== ЗАБЕГ: запуск и физическая сцена =====
  function startDrop() {
    if (menuSlimeIsBusy() || document.body.classList.contains('secret-feast')) {
      showToast('Слайм ещё доедает');
      return;
    }
    sound('tap');
    feedback([10, 25, 12]);
    const world = currentWorld();
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
      world,
      finishY,
      cellSize,
      columns,
      gridOffsetX,
      portalWallY: finishY - cellSize * 1.65,
      // Keep the portal clearly below the fortress wall instead of overlapping it.
      portalY: finishY + cellSize * 1.15,
      blocks: [], particles: [], trails: [],
      slime: {
        x: startX,
        y: 78,
        vx: rand(-65, 65),
        vy: 40,
        radius: 28 * fedScale,
        wobble: 0
      },
      fedScale,
      mass: session.stats.mass,
      startMass: session.stats.mass,
      maxMass: Math.max(1, Math.round(session.stats.mass)),
      visualMass: session.stats.mass,
      massFlash: 0,
      massFlashTime: 0,
      healGlowUntil: 0,
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
      depth: 0,
      maxDepth: 0,
      flightDistance: 0,
      maxFlight: 0,
      blocksDestroyed: 0,
      ended: false,
      portalEntry: null,
      doubled: false,
      doublePending: false,
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
      lastPosition: { x: startX, y: 78 }
    };
    run.blocks = generateBlockField(run);
    prepareCanvas();
    showScreen('drop');
    els.worldTargetBadge.textContent = `${world.icon} Портал: ${world.targetDepth} м`;
    updateRunUI();
    run.animationId = requestAnimationFrame(gameFrame);
  }

  function prepareCanvas() {
    const lowPower = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    const dpr = Math.min(lowPower ? 1.25 : 1.75, window.devicePixelRatio || 1);
    els.canvas.width = VIEW_W * dpr;
    els.canvas.height = VIEW_H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
  }

  function generateBlockField(runState) {
    const { world, finishY } = runState;
    const blocks = [];
    const cell = runState.cellSize || BALANCE.gridCell;
    const columns = runState.columns || Math.floor(VIEW_W / cell);
    const gridOffsetX = runState.gridOffsetX || 0;
    const startY = 190;
    const portalWallY = runState.portalWallY || finishY - cell * 1.65;
    const rows = Math.max(8, Math.floor((portalWallY - startY) / cell));
    const plan = createSectionPlan(world, rows);
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
        let tier = inPath
          ? chooseTemplatePathTier(world, progress, meta, col, riskyCol, keyRow)
          : chooseOffPathTier(world, progress);
        let special = null;

        if (keyRow) {
          if (meta.kind === 'recovery' && col === pathColumns[0]) special = 'gel';
          if (meta.kind === 'reward' && col === pathColumns[pathColumns.length - 1]) special = Math.random() < .58 ? 'coin' : 'gel';
          if (meta.kind === 'bomb' && col === pathColumns[Math.floor(pathColumns.length / 2)]) special = world.id === 2 ? 'freeze' : 'bomb';
          if (meta.kind === 'bounce' && pathColumns.length > 1 && col === pathColumns[0]) special = world.id === 2 ? 'blizzard' : 'spring';
        }
        if (meta.kind === 'ore' && col === clamp(pathColumns[pathColumns.length - 1] + 1, 0, columns - 1)) tier = 'ore';
        if (meta.kind === 'fork' && col === riskyCol && keyRow) tier = 'ore';

        // Небольшая органическая примесь специальных блоков, но не в обучении.
        if (!special && row > 4 && meta.kind !== 'tutorial' && Math.random() < world.specialChance * (inPath ? .20 : .07)) {
          special = chooseSpecialBlock(world, row, progress, inPath);
        }
        if (!special && tier !== 'ore' && !inPath && row > 4 && Math.random() < world.oreChance * .42) tier = 'ore';

        const hazard = Boolean(world.hazardChance) && !special && tier !== 'ore' && row > 4
          && Math.random() < world.hazardChance * (inPath ? .22 : 1) * lerp(.55, 1, progress);
        const hazardVariant = hazard && world.id === 2 ? (Math.random() < .5 ? 'shards' : 'spikes') : null;
        if (hazard) tier = tier === 'reinforced' ? 'reinforced' : 'hard';
        const finalTier = special ? 'special' : tier;
        let maxHp = blockHpForTier(finalTier, world, progress, row, col, inPath);
        if (special === 'coin') maxHp *= .66;
        if (special === 'gel') maxHp *= .44;
        if (special === 'bomb') maxHp *= .68;
        if (special === 'spring') maxHp *= 1.10;
        if (special === 'freeze') maxHp *= .72;
        if (special === 'blizzard') maxHp *= 1.08;
        maxHp = Math.max(1, Math.round(maxHp));

        const material = hazard ? (world.id === 2 ? 'iceHazard' : 'hazard') : chooseMaterial(world, progress, special, finalTier);
        const oreType = finalTier === 'ore' ? chooseOreType(progress) : null;
        const tierData = BLOCK_TIERS[finalTier] || BLOCK_TIERS.dense;
        rowBlocks.push({
          id: id++, row, col, x: gridOffsetX + col * cell, y, w: cell, h: cell,
          hp: maxHp, maxHp, material, special, tier: finalTier, dead: false,
          path: inPath, segment: meta.kind, hazard, hazardVariant, oreType, frozen: false,
          topGrass: world.id === 1 && row < 3 && !special && finalTier === 'soft',
          coins: Math.max(1, Math.round(maxHp * tierData.coin * rand(.48, .82)))
        });
      }

      // Мир 1 мягко обучает: первые 4 ряда и финал пробиваются почти всегда.
      if (row < 4 || (world.id === 1 && meta.kind === 'final')) {
        for (const block of rowBlocks) {
          if (!block.special && block.tier !== 'ore') {
            block.tier = 'soft';
            block.topGrass = world.id === 1 && row < 3;
            if (world.id === 1) block.material = block.topGrass ? 'dirt' : 'packedDirt';
            block.maxHp = block.hp = Math.max(2, Math.round(world.expectedDamage * (.26 + row * .025) * rand(.82, 1.03)));
          }
        }
      }

      // В каждом ряду остаётся хотя бы одна разумная точка продолжения.
      const safe = rowBlocks.filter(block => block.path && !block.special && block.tier !== 'ore');
      if (safe.length && safe.every(block => ['hard', 'reinforced'].includes(block.tier))) {
        const block = safe[Math.floor(Math.random() * safe.length)];
        block.tier = progress < .55 ? 'soft' : 'dense';
        block.maxHp = block.hp = Math.round(blockHpForTier(block.tier, world, progress, row, block.col, true) * .84);
      }
      blocks.push(...rowBlocks);
    }

    // Каждый мир заканчивается настоящей крепостной стеной. Для прохода достаточно
    // пробить один сегмент, но вся линия физически перекрывает путь к порталу.
    const wallHp = Math.round(world.expectedDamage * (world.portalWallStrength || 4.8));
    for (let col = 0; col < columns; col += 1) {
      blocks.push({
        id: id++, row: rows + 1, col,
        x: gridOffsetX + col * cell, y: portalWallY, w: cell, h: cell,
        hp: wallHp, maxHp: wallHp, material: 'portalWall', special: null,
        tier: 'reinforced', dead: false, path: false, segment: 'portal-wall',
        hazard: false, oreType: null, isPortalWall: true, coins: 0
      });
    }
    return blocks;
  }

  function createSectionPlan(world, rows) {
    const sequences = {
      1: ['tutorial', 'flow', 'bounce', 'recovery', 'reward', 'flow', 'bomb', 'bounce', 'ore', 'final'],
      2: ['tutorial', 'flow', 'fork', 'reward', 'bounce', 'ore', 'recovery', 'bomb', 'challenge', 'final'],
      3: ['tutorial', 'flow', 'fork', 'bounce', 'ore', 'challenge', 'recovery', 'bomb', 'challenge', 'final'],
      4: ['tutorial', 'flow', 'challenge', 'fork', 'ore', 'bounce', 'challenge', 'bomb', 'recovery', 'challenge', 'final']
    };
    const baseLength = { tutorial: 4, flow: 4, fork: 4, bounce: 3, recovery: 3, reward: 3, bomb: 3, ore: 4, challenge: 4, final: 3 };
    const sequence = sequences[world.id] || sequences[4];
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

  function chooseTemplatePathTier(world, progress, meta, col, riskyCol, keyRow) {
    if (meta.kind === 'tutorial') return Math.random() < .92 ? 'soft' : 'dense';
    if (meta.kind === 'recovery' || meta.kind === 'reward' || meta.kind === 'final') return Math.random() < .84 ? 'soft' : 'dense';
    if (meta.kind === 'flow') {
      const softChance = world.id === 1 ? lerp(.82, .68, progress) : lerp(.72, .48, progress);
      return Math.random() < softChance ? 'soft' : 'dense';
    }
    if (meta.kind === 'fork') {
      if (col === riskyCol) return keyRow ? 'ore' : (Math.random() < .52 ? 'dense' : 'hard');
      return Math.random() < (world.id === 2 ? .72 : .62) ? 'soft' : 'dense';
    }
    if (meta.kind === 'bounce') {
      if (keyRow) return 'hard';
      return Math.random() < (world.id === 1 ? .76 : .58) ? 'soft' : 'dense';
    }
    if (meta.kind === 'bomb') return keyRow ? 'dense' : (Math.random() < .62 ? 'soft' : 'dense');
    if (meta.kind === 'ore') return Math.random() < .65 ? 'soft' : 'dense';
    if (meta.kind === 'challenge') {
      if (keyRow) {
        if (world.id >= 3 && Math.random() < world.reinforcedCap) return 'reinforced';
        return 'hard';
      }
      return Math.random() < (world.id === 2 ? .55 : .36) ? 'dense' : 'hard';
    }
    return 'dense';
  }

  function chooseOffPathTier(world, progress) {
    const hardChance = world.hardCap * lerp(.25, 1, progress);
    const reinforcedChance = world.reinforcedCap * lerp(.10, 1, progress);
    const roll = Math.random();
    if (roll < reinforcedChance) return 'reinforced';
    if (roll < reinforcedChance + hardChance) return 'hard';
    return Math.random() < (world.id === 1 ? .38 : lerp(.27, .12, progress)) ? 'soft' : 'dense';
  }

  function chooseSpecialBlock(world, row, progress, inPath) {
    if (row < 4) return null;
    const roll = Math.random();
    if (world.id === 2) {
      if (inPath && roll < .24) return 'gel';
      if (roll < .44) return 'coin';
      if (roll < .74) return 'freeze';
      return row > 6 ? 'blizzard' : null;
    }
    if (inPath && roll < (world.id === 1 ? .42 : .25)) return 'gel';
    if (roll < .52) return 'coin';
    if (roll < .82 && row > 5) return 'bomb';
    if (row > 6 && world.id > 1) return 'spring';
    return null;
  }

  function blockHpForTier(tier, world, progress, row, col, inPath = false) {
    const depthScale = 1 + progress * world.depthRamp;
    const wave = 1 + Math.sin(row * .47 + col * .73) * .045;
    const ranges = {
      soft: [.18, .42],
      dense: [.48, .82],
      hard: [.95, 1.38],
      reinforced: [1.55, 2.25],
      ore: [.68, 1.15],
      special: [.34, .72]
    };
    const [min, max] = ranges[tier] || ranges.dense;
    let base = world.expectedDamage * rand(min, max) * depthScale * wave;
    if (inPath) base *= tier === 'soft' ? .86 : .93;
    return Math.max(1, base);
  }

  function chooseMaterial(world, progress, special, tier = 'dense') {
    if (special) return special;
    if (tier === 'ore') return 'ore';
    if (progress < .28) return world.materials[0];
    if (progress < .68) return Math.random() < .72 ? world.materials[1] : world.materials[0];
    return Math.random() < .72 ? world.materials[2] : world.materials[1];
  }

  function chooseOreType(progress) {
    const available = ORE_TYPES.filter(ore => ore.min <= progress + .08);
    const index = Math.floor(Math.pow(Math.random(), 1.55) * available.length);
    return available[Math.min(index, available.length - 1)] || ORE_TYPES[0];
  }

  function gameFrame(timestamp) {
    if (!run || run.ended) return;
    if (!run.lastTime) run.lastTime = timestamp;
    const dt = Math.min(.034, (timestamp - run.lastTime) / 1000);
    run.lastTime = timestamp;

    const speed = Math.hypot(run.slime.vx, run.slime.vy);
    const substeps = clamp(Math.ceil(speed * dt / Math.max(10, run.slime.radius * .42)), 1, 5);
    for (let i = 0; i < substeps; i += 1) updatePhysics(dt / substeps, timestamp);
    updateParticles(dt);
    renderCanvas(timestamp);
    updateRunUI();
    if (!run.ended) run.animationId = requestAnimationFrame(gameFrame);
  }

  function updatePhysics(dt, timestamp) {
    const s = run.slime;
    if (run.portalEntry) {
      updatePortalEntry(dt, timestamp);
      return;
    }
    const worldGravity = BALANCE.gravityBase + run.worldId * BALANCE.gravityPerWorld;
    const previousX = s.x;
    const previousY = s.y;

    const terminalSpeed = BALANCE.maxFallSpeedBase + run.worldId * BALANCE.maxFallSpeedPerWorld;
    s.vy = Math.min(terminalSpeed, s.vy + worldGravity * dt);
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
    run.depth = Math.max(0, Math.floor((s.y - 80) / 10));
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
      const cooldown = run.hitCooldowns.get(block.id) || 0;
      if (timestamp - cooldown < 72) continue;
      run.hitCooldowns.set(block.id, timestamp);
      if (timestamp < run.bounceGraceUntil && collision.ny < -0.25) continue;
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
    s.radius = lerp(s.radius, 28 * run.fedScale * healthScale, clamp(dt * 5.5, 0, 1));
    if (run.massFlashTime > 0) run.massFlashTime = Math.max(0, run.massFlashTime - dt);

    const speedNow = Math.hypot(s.vx, s.vy);
    if (speedNow < 34 && s.y > 180) run.lowMotionTime += dt;
    else run.lowMotionTime = 0;
    if (run.lowMotionTime > 1.0) {
      s.vy += 145;
      s.vx += rand(-65, 65);
      run.lowMotionTime = 0;
    }

    if (run.mass <= 0 && !tryRevive()) endRun(false, 'Слайм израсходовал всю массу');
  }

  function getPortalGeometry() {
    const anchorY = run.portalY ?? run.finishY + run.cellSize * 1.15;
    if (run.worldId === 3) {
      const centerY = anchorY - 27;
      return { type: 'circle', x: VIEW_W / 2, y: centerY, radius: 67, bottom: centerY + 67 };
    }
    const top = anchorY - run.cellSize * .65;
    return {
      type: 'rect', x: run.gridOffsetX, y: top,
      w: run.columns * run.cellSize, h: run.cellSize,
      centerX: VIEW_W / 2, centerY: top + run.cellSize / 2,
      bottom: top + run.cellSize
    };
  }

  function slimeTouchesPortal(slime, portal) {
    if (portal.type === 'circle') {
      return Math.hypot(slime.x - portal.x, slime.y - portal.y) <= slime.radius + portal.radius;
    }
    return Boolean(circleRectCollision(slime, portal));
  }

  function applyPortalAttraction(dt) {
    if (run.worldId !== 3) return;
    const s = run.slime;
    const wallBottom = run.portalWallY + run.cellSize;
    const portal = getPortalGeometry();
    if (s.y + s.radius < wallBottom - 8 || s.y > portal.bottom + 60) return;
    const pull = clamp((s.y + s.radius - wallBottom + 16) / 90, .18, 1);
    s.vx += (portal.x - s.x) * 10 * pull * dt;
    s.vx *= Math.max(.72, 1 - dt * 2.4);
  }

  function beginPortalEntry(timestamp, portal = getPortalGeometry()) {
    if (run.portalEntry || run.ended) return;
    const targetX = portal.type === 'circle' ? portal.x : portal.centerX;
    const targetY = portal.type === 'circle' ? portal.y : portal.centerY;
    run.portalEntry = {
      startedAt: timestamp,
      duration: 680,
      startX: run.slime.x,
      startY: run.slime.y,
      targetX,
      targetY
    };
    run.slime.vx = 0;
    run.slime.vy = 0;
    run.emotion = 'joy';
    run.emotionUntil = timestamp + 700;
    run.shake = Math.max(run.shake, 4);
    spawnPortalBurst(targetX, targetY);
    sound('epic');
    feedback([10, 24, 10]);
  }

  function updatePortalEntry(dt, timestamp) {
    const entry = run.portalEntry;
    const progress = clamp((timestamp - entry.startedAt) / entry.duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const spiral = Math.sin(progress * Math.PI * 3) * (1 - progress) * 14;
    run.slime.x = lerp(entry.startX, entry.targetX, eased) + spiral;
    run.slime.y = lerp(entry.startY, entry.targetY, eased);
    run.slime.wobble += dt * 16;
    const targetCamera = clamp(run.slime.y - 250, 0, run.portalY - VIEW_H + 170);
    run.cameraY = lerp(run.cameraY, targetCamera, clamp(dt * 5, 0, 1));
    run.shake = Math.max(0, run.shake - dt * 8);
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
    if (distance > .001) {
      nx = dx / distance;
      ny = dy / distance;
    } else {
      const left = Math.abs(circle.x - rect.x);
      const right = Math.abs(rect.x + rect.w - circle.x);
      const top = Math.abs(circle.y - rect.y);
      const bottom = Math.abs(rect.y + rect.h - circle.y);
      const min = Math.min(left, right, top, bottom);
      if (min === top) { nx = 0; ny = -1; }
      else if (min === bottom) { nx = 0; ny = 1; }
      else if (min === left) { nx = -1; ny = 0; }
      else { nx = 1; ny = 0; }
      distance = 0;
    }
    return { nx, ny, penetration: circle.radius - distance };
  }

  function resolveBlockHit(block, collision, timestamp = performance.now()) {
    const s = run.slime;
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
    if (run.effects.voidBreaker && !run.voidBreakerUsed && ['hard', 'reinforced'].includes(block.tier) && damage < hpBefore) {
      damage = hpBefore + 1;
      run.voidBreakerUsed = true;
      impact('ПУСТОТА ПОГЛОТИЛА БЛОК!');
    }
    const destroysImmediately = damage >= hpBefore;
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
    if (block.special === 'blizzard') massLoss *= .45;
    if (block.hazard) massLoss *= 1.75;
    if (run.abilityTime > 0) massLoss *= .18;
    if (run.effects.softLanding && timestamp < run.softLandingUntil) massLoss *= .45;
    if (!destroysImmediately && run.freeBouncesLeft > 0) {
      massLoss = 0;
      run.freeBouncesLeft -= 1;
      impact(`АЛМАЗНАЯ ЗАЩИТА · осталось ${run.freeBouncesLeft}`);
    }
    if (sameImpactCluster) massLoss *= BALANCE.repeatMassScale;
    massLoss = massLoss <= 0 ? 0 : Math.max(BALANCE.minMassLoss, massLoss);

    run.mass = Math.max(0, run.mass - massLoss);
    if (!sameImpactCluster && massLoss > 0) run.lastMassDamageAt = timestamp;
    run.massFlash = massLoss > 0 ? -1 : 1;
    run.massFlashTime = .22;
    run.shake = Math.max(run.shake, clamp(impactSpeed / 165, 1.0, destroysImmediately ? 3.8 : 5.8));
    run.emotion = destroysImmediately ? 'impact' : 'hurt';
    run.emotionUntil = timestamp + (destroysImmediately ? 260 : 430);
    
    if (destroysImmediately) {
      block.hp = 0;
      destroyBlock(block, damage);
      const drag = block.tier === 'soft' ? BALANCE.weakBreakDrag : BALANCE.denseBreakDrag;
      s.vy = Math.max(110, s.vy * drag * tierData.drag);
      s.vx *= .95;
      if (block.special === 'blizzard') applyBlizzardPush(block, timestamp);

      let keep = block.tier === 'soft' ? BALANCE.flightKeepSoft : block.tier === 'dense' || block.tier === 'special' || block.tier === 'ore' ? BALANCE.flightKeepDense : BALANCE.flightKeepHard;
      if (run.effects.momentum) keep = Math.max(keep, .84);
      run.flightDistance *= keep;

      run.brokenSinceBlast += 1;
      if (run.effects.dragonBlast && run.brokenSinceBlast >= 10) {
        run.brokenSinceBlast = 0;
        explodeAt(block.x + block.w / 2, block.y + block.h / 2, 112, .45);
        impact('ДРАКОНИЙ ВЗРЫВ!');
      }

      const flightMeters = run.flightDistance / 10;
      if (!block.special && !block.isPortalWall) impact(flightMeters >= 9
        ? `ПРОБОЙ ×${flightMultiplier.toFixed(1)} · −${round1(massLoss)}`
        : `ПРОБОЙ · −${round1(massLoss)} массы`);
      sound(block.special === 'coin' || block.tier === 'ore' ? 'coin' : 'break');
      if (run.mass <= 0 && !tryRevive()) endRun(false, 'Слайм израсходовал всю массу');
      return false;
    }

    block.hp = Math.max(.05, block.hp - damage);
    const springBoost = block.special === 'spring' ? 1.35 : 1;
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
    const restitution = block.special === 'spring' ? 1.34 : 1.06;
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

    if (block.special === 'blizzard') applyBlizzardPush(block, timestamp);
    impact(block.special === 'spring'
      ? `ПРУЖИНА · −${round1(massLoss)}`
      : block.special === 'blizzard'
        ? `ВЬЮГА · БОКОВОЙ БРОСОК · −${round1(massLoss)}`
      : block.isPortalWall
        ? `КРЕПОСТНАЯ СТЕНА · −${round1(massLoss)} · ${Math.ceil(block.hp)} HP`
        : block.hazard
          ? `ОПАСНЫЙ БЛОК · −${round1(massLoss)} · ${Math.ceil(block.hp)} HP`
          : `РИКОШЕТ · −${round1(massLoss)} · ${Math.ceil(block.hp)} HP`);
    sound(block.special === 'spring' ? 'bounce' : block.hazard || block.isPortalWall ? 'hitHard' : 'hit');
    createDebris(block, 3, false);

    if (run.mass <= 0 && !tryRevive()) endRun(false, 'Слайм израсходовал всю массу');
    return true;
  }

  function applyBlizzardPush(block, timestamp = performance.now()) {
    const center = block.x + block.w / 2;
    const offset = run.slime.x - center;
    const direction = Math.abs(offset) < 6 ? (Math.random() < .5 ? -1 : 1) : Math.sign(offset);
    run.slime.vx = direction * Math.max(148, Math.abs(run.slime.vx) + 62);
    run.slime.vy = Math.min(run.slime.vy, -72);
    run.bounceGraceUntil = timestamp + BALANCE.bounceGraceMs;
    run.emotion = 'surprised';
    run.emotionUntil = timestamp + 420;
    run.shake = Math.max(run.shake, 4);
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
        if (block.special === 'gel' || block.special === 'bomb') score -= .75;
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

  function destroyBlock(block) {
    block.dead = true;
    run.blocksDestroyed += 1;
    run.coins += block.coins * run.coinMultiplier;
    addAbilityCharge({ soft: 2.2, dense: 3.1, hard: 4.2, reinforced: 5.2, ore: 4.0, special: 3.0 }[block.tier] || 2.5);
    createDebris(block, block.special === 'bomb' ? 18 : 9, true);

    if (block.isPortalWall) {
      impact('ПРОЛОМ В СТЕНЕ — ПОРТАЛ ОТКРЫТ!');
      run.shake = Math.max(run.shake, 9);
    } else if (block.tier === 'ore' || block.frozenOre) {
      const ore = block.oreType || ORE_TYPES[0];
      const oreReward = Math.round((10 + block.maxHp * .45) * ore.reward);
      run.coins += oreReward * run.coinMultiplier;
      if (run.effects.oreHeal) healRun(Math.max(2, run.maxMass * .035), ore.label);
      else impact(`${ore.label} +${oreReward}`);
    } else if (block.special === 'coin') {
      run.coins += 18 + run.worldId * 8;
      if (run.effects.oreHeal) healRun(Math.max(2, run.maxMass * .03), 'ЗОЛОТОЙ ПИР');
      else impact('МОНЕТНЫЙ БЛОК!');
    } else if (block.special === 'gel') {
      const multiplier = run.effects.healBoost ? 2 : 1;
      const heal = Math.max(5, Math.round((run.maxMass * .16 + run.worldId) * multiplier));
      healRun(heal, run.effects.healBoost ? 'КОРОЛЕВСКОЕ ЛЕЧЕНИЕ' : 'ЛЕЧЕНИЕ');
    } else if (block.special === 'spring') {
      addAbilityCharge(5);
      impact('ПРУЖИНА СЛОМАНА!');
    } else if (block.special === 'freeze') {
      freezeNearbyBlocks(block);
    } else if (block.special === 'blizzard') {
      impact('ВЬЮГА СОРВАЛА СЛАЙМА В СТОРОНУ!');
    } else if (block.special === 'bomb') {
      explodeBomb(block);
    }
  }

  function freezeNearbyBlocks(source) {
    const centerX = source.x + source.w / 2;
    const centerY = source.y + source.h / 2;
    const radius = 138;
    let weakened = 0;
    for (const block of run.blocks) {
      if (block.dead || block === source || block.isPortalWall || block.special) continue;
      const distance = Math.hypot(block.x + block.w / 2 - centerX, block.y + block.h / 2 - centerY);
      if (distance > radius) continue;
      const easyHp = Math.max(2, Math.round(run.world.expectedDamage * rand(.18, .28)));
      block.frozenOre = block.frozenOre || block.tier === 'ore';
      block.tier = 'soft';
      block.material = 'iceLight';
      block.hazard = false;
      block.hazardVariant = null;
      block.frozen = true;
      block.maxHp = Math.min(block.maxHp, easyHp);
      block.hp = Math.min(block.hp, block.maxHp);
      createDebris(block, 3, false);
      weakened += 1;
    }
    run.shake = Math.max(run.shake, 7);
    impact(`МОРОЗНАЯ ВОЛНА · ОСЛАБЛЕНО ${weakened}`);
    sound('epic');
  }

  function healRun(amount, label = 'ЛЕЧЕНИЕ') {
    const before = run.mass;
    run.mass = Math.min(run.maxMass, run.mass + amount);
    const healed = Math.max(0, run.mass - before);
    run.massFlash = 1;
    run.massFlashTime = .42;
    run.healGlowUntil = performance.now() + 520;
    impact(`${label} +${Math.ceil(healed)}`);
  }

  function explodeAt(x, y, radius = 125, rewardScale = .6) {
    let destroyed = 0;
    for (const block of run.blocks) {
      if (block.dead) continue;
      const dx = block.x + block.w / 2 - x;
      const dy = block.y + block.h / 2 - y;
      if (Math.hypot(dx, dy) < radius) {
        if (block.isPortalWall) {
          block.hp = Math.max(1, block.hp - block.maxHp * .28);
          createDebris(block, 7, true);
          continue;
        }
        block.dead = true;
        run.blocksDestroyed += 1;
        run.coins += block.coins * rewardScale * run.coinMultiplier;
        createDebris(block, 5, true);
        destroyed += 1;
      }
    }
    run.shake = Math.max(run.shake, 11);
    return destroyed;
  }

  function explodeBomb(source) {
    const destroyed = explodeAt(source.x + source.w / 2, source.y + source.h / 2, 125, .6);
    impact(`БА-БАХ ×${Math.max(1, destroyed)}`);
  }

  function createDebris(block, count, strong) {
    const color = materialColor(block.material, run.world, 0);
    for (let i = 0; i < count; i += 1) {
      run.particles.push({
        x: block.x + rand(0, block.w), y: block.y + rand(0, block.h),
        vx: rand(-120, 120) * (strong ? 1.25 : .75), vy: rand(-170, 30) * (strong ? 1.2 : .8),
        life: rand(.35, .78), maxLife: .78, size: rand(3, 8), color
      });
    }
    if (run.particles.length > 180) run.particles.splice(0, run.particles.length - 180);
  }

  function spawnPortalBurst(x, y) {
    const colors = run.worldId === 3
      ? ['#ff8fbd', '#86f1df', '#fff2a8', '#ffffff']
      : run.worldId === 2
        ? ['#8ce8ff', '#d9f8ff', '#ffffff']
        : ['#67f5dc', '#bfffee', '#ffffff'];
    for (let i = 0; i < 26; i += 1) {
      const angle = Math.PI * 2 * i / 26 + rand(-.14, .14);
      const speed = rand(70, 190);
      run.particles.push({
        kind: 'portal', x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: 0, life: rand(.42, .78), maxLife: .78,
        size: rand(3, 7), color: colors[i % colors.length]
      });
    }
  }

  function updateParticles(dt) {
    if (!run) return;
    for (const p of run.particles) {
      p.vy += (p.gravity ?? 470) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'portal') {
        p.vx *= Math.max(0, 1 - dt * 2.8);
        p.vy *= Math.max(0, 1 - dt * 2.8);
      }
      p.life -= dt;
    }
    run.particles = run.particles.filter(p => p.life > 0);
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
    els.depthLabel.textContent = `${Math.max(0, run.maxDepth)} м`;
    els.runMassLabel.textContent = `${Math.max(0, Math.ceil(run.mass))}/${Math.ceil(run.maxMass)}`;
    const mult = 1 + Math.min(run.flightDistance / 285, 1.35);
    els.flightLabel.textContent = `${Math.floor(run.flightDistance / 10)} м · ×${mult.toFixed(1)}`;
    els.runCoinsLabel.textContent = Math.floor(run.coins);
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

    // Every biome gets a soft shared edge, so the shaft reads as a continuous
    // material instead of a rigid checkerboard of independent sprites.
    drawBlockTransitions();

    for (const p of run.particles) {
      const sy = p.y - run.cameraY;
      if (sy < -30 || sy > VIEW_H + 30) continue;
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      if (p.kind === 'portal') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.arc(p.x, sy, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillRect(p.x, sy, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;

    drawSlime(timestamp);
    ctx.restore();
  }

  function drawBackground(world) {
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

    const depth = Math.max(0, Math.floor((run.cameraY + 20) / 10));
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
    const y = (run.portalY ?? run.finishY) - run.cameraY + bob;
    if (y < -170 || y > VIEW_H + 170) return;
    ctx.save();
    {
      // Candy World has a distinctive round peppermint portal; worlds 1–2
      // keep their wide threshold treatment.
      const portalLine = world.id === 3 ? null : WORLD_SPRITES[world.id]?.['portal-line'];
      if (portalLine?.complete && portalLine.naturalWidth) {
        const x = run.gridOffsetX;
        const width = run.columns * run.cellSize;
        const height = run.cellSize;
        const portalY = y - height * .65;
        ctx.beginPath();
        roundedRect(ctx, x, portalY, width, height, height / 2);
        ctx.clip();
        ctx.drawImage(portalLine, x, portalY, width, height);
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = .11 + Math.sin(timestamp / 190) * .035;
        ctx.fillStyle = world.id === 2 ? '#e9fbff' : '#d9ffff';
        ctx.fillRect(x, portalY + 4, width, height - 8);
        ctx.restore();
        return;
      }
    }
    const portalSprite = WORLD_SPRITES[world.id]?.portal || null;
    if (portalSprite?.complete && portalSprite.naturalWidth) {
      const pulse = .92 + Math.sin(timestamp / 180) * .07;
      const entryPulse = run.portalEntry
        ? 1 + Math.sin(clamp((timestamp - run.portalEntry.startedAt) / 680, 0, 1) * Math.PI) * .38
        : 1;
      const centerX = portal.x;
      const centerY = portal.y - run.cameraY + bob;
      ctx.globalAlpha = .16 + Math.sin(timestamp / 210) * .045;
      ctx.fillStyle = world.id === 3 ? '#ff9bc8' : '#58f4e2';
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 86 * pulse * entryPulse, 86 * pulse * entryPulse, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = .28;
      ctx.strokeStyle = world.id === 3 ? '#fff0a6' : '#d9fff7';
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
        ctx.fillStyle = i % 2 ? '#fff4b5' : '#ffffff';
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2.4 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(Math.sin(timestamp / 680) * .055);
      ctx.scale(pulse * entryPulse, pulse * entryPulse);
      ctx.drawImage(portalSprite, -76, -76, 152, 152);
      ctx.restore();
      ctx.fillStyle = 'rgba(16,25,31,.78)';
      roundedRect(ctx, centerX - 54, centerY + 69, 108, 23, 12);
      ctx.fill();
      ctx.fillStyle = '#d9fff7';
      ctx.font = '1000 11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('ПОРТАЛ', centerX, centerY + 84);
      ctx.restore();
      return;
    }
    ctx.fillStyle = world.accent;
    roundedRect(ctx, 44, y, VIEW_W - 88, 34, 17);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    roundedRect(ctx, 68, y + 7, VIEW_W - 136, 7, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '1000 13px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(`${world.icon} ПОРТАЛ В НОВЫЙ МИР`, VIEW_W / 2, y + 56);
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

      if (hpRatio < .78) drawCracks(block, sy, hpRatio);
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
    } else if (special === 'freeze' || special === 'blizzard') {
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(block.x + block.w / 2, sy + block.h / 2, 17, 0, Math.PI * 2);
      ctx.stroke();
    }

    const symbol = { coin: '●', spring: '↥', bomb: '✹', gel: '+', freeze: '❄', blizzard: '≋' }[special] || '•';
    ctx.fillStyle = '#fff';
    ctx.font = special === 'gel' ? '1000 28px system-ui' : '1000 23px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, block.x + block.w / 2, sy + block.h / 2 - 2);
    ctx.font = '1000 9px system-ui';
    ctx.fillStyle = 'rgba(255,255,255,.94)';
    ctx.fillText(`${Math.max(1, Math.ceil(block.hp))} HP`, block.x + block.w / 2, sy + block.h - 7);
    ctx.restore();
  }

  function drawWorldSprite(block, sy, hpRatio) {
    let spriteName;
    if (block.isPortalWall) spriteName = 'wall-intact';
    else if (block.hazard && run.worldId === 2) spriteName = block.hazardVariant === 'spikes' ? 'ice-spikes' : 'ice-shards';
    else if (block.hazard && run.worldId === 3) spriteName = 'candy-hazard';
    else if (block.hazard) spriteName = 'stone-hazard';
    else if (block.special === 'bomb') spriteName = 'dynamite';
    else if (block.special === 'spring') spriteName = 'spring';
    else if (block.special === 'freeze') spriteName = 'freeze';
    else if (block.special === 'blizzard') spriteName = 'blizzard';
    else if (block.special === 'gel') spriteName = 'heal';
    else if (block.special === 'coin') spriteName = 'ore-gold';
    else if (block.tier === 'ore' || block.frozenOre) spriteName = `ore-${block.oreType?.id || 'coal'}`;
    else if (run.worldId === 2) {
      if (block.frozen || block.tier === 'soft') spriteName = 'ice-light';
      else if (block.tier === 'dense') spriteName = block.material === 'snowPacked' ? 'snow-packed' : 'glacier';
      else spriteName = 'ice-reinforced';
    } else if (run.worldId === 3) {
      if (block.tier === 'reinforced' || block.tier === 'hard') spriteName = 'candy-reinforced';
      else if (block.tier === 'dense') spriteName = 'cookie-packed';
      else spriteName = 'candy-light';
    } else if (block.tier === 'reinforced' || block.tier === 'hard') spriteName = 'stone-reinforced';
    else if (block.tier === 'dense') spriteName = block.material === 'packedDirt' ? 'dirt-packed' : 'stone';
    else spriteName = block.topGrass ? 'dirt-grass' : 'dirt-packed';

    const sprites = WORLD_SPRITES[run.worldId];
    const damagedName = `${spriteName}-cracked`;
    const sprite = hpRatio < .58 && sprites?.[damagedName]?.complete
      ? sprites[damagedName]
      : sprites?.[spriteName];
    if (!sprite?.complete || !sprite.naturalWidth) return false;

    // A tiny sprite bleed removes hairline gaps from browser canvas scaling.
    // The transition pass below keeps the bleed from looking like a hard overlap.
    const bleed = run.worldId === 2 ? 1 : 0;
    ctx.globalAlpha = (run.worldId === 2 ? .94 : 1) * (.72 + hpRatio * .28);
    ctx.drawImage(sprite, block.x - bleed, sy - bleed, block.w + bleed * 2, block.h + bleed * 2);
    ctx.globalAlpha = 1;
    if (hpRatio < .72 && run.worldId > 2) drawCracks(block, sy, hpRatio);

    const label = Math.max(1, Math.ceil(block.hp)).toString();
    const badgeWidth = Math.max(29, 15 + label.length * 7);
    ctx.fillStyle = block.isPortalWall ? 'rgba(19,25,32,.92)' : 'rgba(22,28,38,.80)';
    roundedRect(ctx, block.x + block.w / 2 - badgeWidth / 2, sy + block.h - 18, badgeWidth, 14, 7);
    ctx.fill();
    ctx.strokeStyle = block.isPortalWall ? '#91f5df' : 'rgba(255,255,255,.48)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '1000 9px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, block.x + block.w / 2, sy + block.h - 11);
    return true;
  }

  const SEAM_STYLES = {
    1: { color: '194,158,112', opacity: .12, vein: '255,232,183', width: 4 },
    2: { color: '224,249,255', opacity: .19, vein: '255,255,255', width: 6 },
    3: { color: '255,214,239', opacity: .18, vein: '255,242,206', width: 5 }
  };

  function drawBlockTransitions() {
    const style = SEAM_STYLES[run.worldId];
    if (!style) return;

    const liveBlocks = new Map();
    for (const block of run.blocks) {
      if (!block.dead) liveBlocks.set(`${block.row}:${block.col}`, block);
    }

    ctx.save();
    for (const block of liveBlocks.values()) {
      const sy = block.y - run.cameraY;
      if (sy < -run.cellSize || sy > VIEW_H + run.cellSize) continue;

      const right = liveBlocks.get(`${block.row}:${block.col + 1}`);
      const below = liveBlocks.get(`${block.row + 1}:${block.col}`);
      if (right) drawBlockSeam(block, right, sy, 'vertical', style);
      if (below) drawBlockSeam(block, below, sy + block.h, 'horizontal', style);
    }
    ctx.restore();
  }

  function drawBlockSeam(block, neighbour, edge, orientation, style) {
    const includesFeature = block.special || neighbour.special || block.tier === 'ore' || neighbour.tier === 'ore';
    const width = includesFeature ? Math.max(2.8, style.width * .58) : style.width;
    const opacity = includesFeature ? style.opacity * .55 : style.opacity;
    const translucent = (alpha) => `rgba(${style.color},${alpha})`;

    // A broad, low-opacity gradient makes neighbouring material layers share
    // colour while preserving the hierarchy of special blocks and ores.
    let gradient;
    if (orientation === 'vertical') {
      const x = block.x + block.w;
      gradient = ctx.createLinearGradient(x - width, 0, x + width, 0);
      gradient.addColorStop(0, translucent(0));
      gradient.addColorStop(.42, translucent(opacity));
      gradient.addColorStop(.58, translucent(opacity));
      gradient.addColorStop(1, translucent(0));
      ctx.fillStyle = gradient;
      ctx.fillRect(x - width, edge, width * 2, block.h);
      drawSeamVeins(x, edge, block.h, block.id + neighbour.id, true, includesFeature, style);
    } else {
      const y = edge;
      gradient = ctx.createLinearGradient(0, y - width, 0, y + width);
      gradient.addColorStop(0, translucent(0));
      gradient.addColorStop(.42, translucent(opacity));
      gradient.addColorStop(.58, translucent(opacity));
      gradient.addColorStop(1, translucent(0));
      ctx.fillStyle = gradient;
      ctx.fillRect(block.x, y - width, block.w, width * 2);
      drawSeamVeins(block.x, y, block.w, block.id + neighbour.id, false, includesFeature, style);
    }
  }

  function drawSeamVeins(x, y, length, seed, vertical, subtle, style) {
    // Short, offset accents break a perfectly straight seam: frost in ice,
    // caramel-like highlights in candy, and dim embers in the molten world.
    const pieces = subtle ? 2 : 3;
    ctx.save();
    ctx.strokeStyle = `rgba(${style.vein},${subtle ? .08 : .15})`;
    ctx.lineWidth = subtle ? .7 : 1;
    ctx.lineCap = 'round';
    for (let index = 0; index < pieces; index += 1) {
      const progress = (index + .5) / pieces;
      const offset = Math.sin(seed * 1.71 + index * 4.3) * 3;
      const span = 7 + Math.abs(Math.sin(seed * .41 + index)) * 6;
      ctx.beginPath();
      if (vertical) {
        const py = y + length * progress;
        ctx.moveTo(x - span, py - 2);
        ctx.quadraticCurveTo(x + offset, py, x + span, py + 2);
      } else {
        const px = x + length * progress;
        ctx.moveTo(px - 2, y - span);
        ctx.quadraticCurveTo(px + offset, y, px + 2, y + span);
      }
      ctx.stroke();
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

  function materialColor(material, world, ratio = 1) {
    const colors = {
      crumb: '#d6a45d', wood: '#9b6330', dirt: '#9a6130', packedDirt: '#a86e34', stone: '#737b88',
      candy: '#ed7cc4', cookie: '#c98a49',
      snow: '#d8f8ff', ice: '#67d8ef', crystal: '#7c9dff',
      iceLight: '#bdefff', snowPacked: '#e7f8ff', glacier: '#65b9e7', iceHazard: '#168bd2',
      basalt: '#53505b', lavaRock: '#b84a2e', metal: '#677383', ore: '#9b7cff',
      coin: '#eab308', spring: '#22d3ee', bomb: '#ef4444', gel: '#34d399',
      hazard: '#403c49', portalWall: '#3e4651', freeze: '#54dff5', blizzard: '#378ed8'
    };
    const base = colors[material] || world.accent;
    if (ratio >= .99) return base;
    return shadeHex(base, -Math.round((1 - ratio) * 38));
  }

  function shadeHex(hex, amount) {
    const value = parseInt(hex.replace('#', ''), 16);
    const r = clamp((value >> 16) + amount, 0, 255);
    const g = clamp(((value >> 8) & 255) + amount, 0, 255);
    const b = clamp((value & 255) + amount, 0, 255);
    return `rgb(${r},${g},${b})`;
  }

  function drawSlimeAvatar(targetCtx, {
    x, y, radius, emotion = 'focused', colors = SKINS[0].colors,
    scaleX = 1, scaleY = 1, rotation = 0, alpha = 1,
    gazeX = 0, gazeY = 0, blink = false, aura = '', petPoint = null,
    timestamp = performance.now()
  }) {
    if (aura) {
      targetCtx.save();
      targetCtx.translate(x, y);
      if (aura === 'epic') {
        targetCtx.globalAlpha = .34 + Math.sin(timestamp / 170) * .08;
        targetCtx.strokeStyle = '#9b72ff';
        targetCtx.lineWidth = 6;
        targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 9 + Math.sin(timestamp / 190) * 3, 0, Math.PI * 2); targetCtx.stroke();
      } else if (aura === 'legendary') {
        const pulse = 1 + Math.sin(timestamp / 180) * .07;
        targetCtx.globalAlpha = .58;
        targetCtx.strokeStyle = '#ffc83d';
        targetCtx.fillStyle = '#fff4a8';
        targetCtx.lineWidth = 4;
        for (let index = 0; index < 10; index += 1) {
          const angle = index / 10 * Math.PI * 2 + timestamp / 1450;
          const inner = (radius + 7) * pulse;
          const outer = (radius + 17) * pulse;
          targetCtx.beginPath(); targetCtx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner); targetCtx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer); targetCtx.stroke();
          if (index % 2 === 0) {
            targetCtx.beginPath(); targetCtx.arc(Math.cos(angle) * (radius + 20), Math.sin(angle) * (radius + 20), 3.5, 0, Math.PI * 2); targetCtx.fill();
          }
        }
      } else if (aura === 'prismatic') {
        const rainbow = ['#ff6fae', '#ffb84d', '#ffe45c', '#59dc86', '#55c8ff', '#9a7cff'];
        targetCtx.globalAlpha = .78;
        targetCtx.lineWidth = 7;
        rainbow.forEach((color, index) => {
          const start = timestamp / 760 + index / rainbow.length * Math.PI * 2;
          targetCtx.strokeStyle = color;
          targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 11 + Math.sin(timestamp / 210 + index) * 2, start, start + Math.PI / 2.25); targetCtx.stroke();
        });
      } else if (aura === 'secret') {
        targetCtx.globalAlpha = .78;
        targetCtx.strokeStyle = '#5ce9ff';
        targetCtx.lineWidth = 4;
        targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 10 + Math.sin(timestamp / 190) * 4, 0, Math.PI * 2); targetCtx.stroke();
        targetCtx.strokeStyle = '#c46bff';
        targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 17 - Math.sin(timestamp / 190) * 2, 0, Math.PI * 2); targetCtx.stroke();
        for (let index = 0; index < 6; index += 1) {
          const angle = index / 6 * Math.PI * 2 - timestamp / 920;
          const orbit = radius + 19;
          const px = Math.cos(angle) * orbit;
          const py = Math.sin(angle) * orbit;
          targetCtx.fillStyle = index % 2 ? '#c46bff' : '#5ce9ff';
          targetCtx.save(); targetCtx.translate(px, py); targetCtx.rotate(angle + timestamp / 1100); targetCtx.fillRect(-4, -4, 8, 8); targetCtx.restore();
        }
      }
      targetCtx.restore();
    }

    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation);
    targetCtx.scale(scaleX, scaleY);

    const gradient = targetCtx.createRadialGradient(-radius * .25, -radius * .35, radius * .12, 0, 0, radius * 1.1);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(.58, colors[1]);
    gradient.addColorStop(1, colors[2]);
    targetCtx.fillStyle = gradient;
    targetCtx.strokeStyle = '#26334a';
    targetCtx.lineWidth = Math.max(2.7, radius * .09);
    targetCtx.beginPath();
    targetCtx.moveTo(0, -radius);
    targetCtx.bezierCurveTo(radius * .15, -radius * .99, radius * .16, -radius * .86, radius * .26, -radius * .79);
    targetCtx.bezierCurveTo(radius * .67, -radius * .68, radius * .93, -radius * .31, radius * .91, radius * .16);
    targetCtx.bezierCurveTo(radius * .88, radius * .68, radius * .5, radius * .92, 0, radius * .93);
    targetCtx.bezierCurveTo(-radius * .5, radius * .92, -radius * .88, radius * .68, -radius * .91, radius * .16);
    targetCtx.bezierCurveTo(-radius * .93, -radius * .31, -radius * .67, -radius * .68, -radius * .26, -radius * .79);
    targetCtx.bezierCurveTo(-radius * .16, -radius * .86, -radius * .15, -radius * .99, 0, -radius);
    targetCtx.closePath();
    targetCtx.fill();
    targetCtx.stroke();

    targetCtx.globalAlpha = alpha * .25;
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath();
    targetCtx.ellipse(-radius * .28, -radius * .32, radius * .23, radius * .13, -.5, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.globalAlpha = alpha;

    if (petPoint) {
      targetCtx.globalAlpha = alpha * .62;
      targetCtx.fillStyle = '#fff';
      targetCtx.beginPath();
      targetCtx.ellipse(petPoint.x * radius, petPoint.y * radius, radius * .13, radius * .075, -.45, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    }

    const eyeY = -radius * .12;
    const eyeX = radius * .245;
    const outline = '#26334a';
    const chewPulse = (Math.sin(timestamp / 82 - Math.PI / 2) + 1) / 2;
    const chewBlink = emotion === 'chewing' && chewPulse > .72;
    const closedHappy = emotion === 'petting' || emotion === 'pleased';
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    targetCtx.globalAlpha = alpha * (closedHappy ? .68 : .48);
    targetCtx.fillStyle = '#f78591';
    targetCtx.beginPath(); targetCtx.ellipse(-radius * .45, radius * .14, radius * .14, radius * .075, 0, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.ellipse(radius * .45, radius * .14, radius * .14, radius * .075, 0, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.globalAlpha = alpha;

    if (emotion === 'hurt') {
      targetCtx.strokeStyle = outline;
      targetCtx.lineWidth = Math.max(2.5, radius * .085);
      for (const side of [-1, 1]) {
        const eyeCenter = eyeX * side;
        targetCtx.beginPath(); targetCtx.moveTo(eyeCenter - radius * .09, eyeY - radius * .08); targetCtx.lineTo(eyeCenter + radius * .09, eyeY + radius * .08); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.moveTo(eyeCenter + radius * .09, eyeY - radius * .08); targetCtx.lineTo(eyeCenter - radius * .09, eyeY + radius * .08); targetCtx.stroke();
      }
      targetCtx.beginPath(); targetCtx.arc(0, radius * .29, radius * .17, Math.PI + .18, Math.PI * 2 - .18); targetCtx.stroke();
    } else {
      const squint = emotion === 'impact' || emotion === 'power';
      if (squint) {
        targetCtx.strokeStyle = outline;
        targetCtx.lineWidth = Math.max(2.5, radius * .08);
        targetCtx.beginPath(); targetCtx.moveTo(-eyeX - radius * .11, eyeY - radius * .03); targetCtx.lineTo(-eyeX + radius * .11, eyeY + radius * .06); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.moveTo(eyeX + radius * .11, eyeY - radius * .03); targetCtx.lineTo(eyeX - radius * .11, eyeY + radius * .06); targetCtx.stroke();
      } else if (blink || closedHappy || chewBlink) {
        targetCtx.strokeStyle = outline;
        targetCtx.lineWidth = Math.max(2.5, radius * .075);
        for (const side of [-1, 1]) {
          targetCtx.beginPath();
          targetCtx.arc(eyeX * side, eyeY + radius * .05, radius * .14, Math.PI + .12, Math.PI * 2 - .12);
          targetCtx.stroke();
        }
      } else {
        const wide = emotion === 'joy' || emotion === 'surprised' || emotion === 'hungry';
        const eyeW = radius * (wide ? .185 : .17);
        const eyeH = radius * (wide ? .225 : .205);
        targetCtx.strokeStyle = outline;
        targetCtx.lineWidth = Math.max(2.2, radius * .07);
        for (const side of [-1, 1]) {
          const eyeCenter = eyeX * side;
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.ellipse(eyeCenter, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); targetCtx.fill(); targetCtx.stroke();
          const pupilX = eyeCenter + gazeX * radius * .055;
          const pupilY = eyeY + radius * .015 + gazeY * radius * .05;
          targetCtx.fillStyle = outline;
          targetCtx.beginPath(); targetCtx.ellipse(pupilX, pupilY, radius * .065, radius * .095, 0, 0, Math.PI * 2); targetCtx.fill();
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.arc(pupilX - radius * .018, pupilY - radius * .03, Math.max(1, radius * .018), 0, Math.PI * 2); targetCtx.fill();
        }
      }

      targetCtx.strokeStyle = outline;
      targetCtx.fillStyle = outline;
      targetCtx.lineWidth = Math.max(2.3, radius * .075);
      if (emotion === 'surprised' || emotion === 'hungry') {
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .27, radius * .115, radius * (emotion === 'hungry' ? .18 : .16), 0, 0, Math.PI * 2); targetCtx.fill();
        if (emotion === 'hungry') {
          targetCtx.fillStyle = '#f78591';
          targetCtx.beginPath(); targetCtx.ellipse(0, radius * .35, radius * .07, radius * .04, 0, 0, Math.PI * 2); targetCtx.fill();
        }
      } else if (emotion === 'chewing') {
        const mouthOpen = .25 + chewPulse * .75;
        const mouthShift = Math.sin(timestamp / 164) * radius * .016;
        targetCtx.beginPath();
        targetCtx.ellipse(mouthShift, radius * (.235 + chewPulse * .014), radius * (.075 + mouthOpen * .04), radius * (.025 + mouthOpen * .075), 0, 0, Math.PI * 2);
        targetCtx.fill();
        if (chewPulse > .5) {
          targetCtx.fillStyle = '#f78591';
          targetCtx.beginPath(); targetCtx.ellipse(mouthShift, radius * .292, radius * .06, radius * .028, 0, 0, Math.PI * 2); targetCtx.fill();
        }
      } else if (emotion === 'joy' || closedHappy) {
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .25, radius * .19, radius * .145, 0, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = '#f78591';
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .32, radius * .105, radius * .05, 0, 0, Math.PI * 2); targetCtx.fill();
      } else if (squint) {
        targetCtx.beginPath(); targetCtx.arc(0, radius * .16, radius * .19, .12, Math.PI - .12); targetCtx.stroke();
      } else {
        targetCtx.beginPath(); targetCtx.arc(0, radius * .15, radius * .165, .12, Math.PI - .12); targetCtx.stroke();
      }
    }
    targetCtx.restore();
  }

  function menuSlimeEmotion() {
    if (els.slime.classList.contains('petting') || els.slime.classList.contains('petted')) return 'petting';
    if (els.slime.classList.contains('pleased')) return 'pleased';
    if (els.slime.classList.contains('chewing')) return 'chewing';
    if (els.slime.classList.contains('eat') || els.slime.classList.contains('expect-food')) return 'hungry';
    if (els.slime.classList.contains('booped')) return 'surprised';
    return 'focused';
  }

  function prepareMenuSlimeCanvas() {
    const lowPower = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    const dpr = Math.min(lowPower ? 1.15 : 1.5, window.devicePixelRatio || 1);
    els.menuSlimeCanvas.width = Math.round(180 * dpr);
    els.menuSlimeCanvas.height = Math.round(180 * dpr);
    menuSlimeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    menuSlimeCtx.imageSmoothingEnabled = true;
  }

  function drawMenuSlime(timestamp) {
    menuSlimeCtx.clearRect(0, 0, 180, 180);
    const emotion = menuSlimeEmotion();
    const rarity = MEAL_REACTION_CLASSES.find(name => els.slime.classList.contains(name))?.replace('meal-', '') || '';
    const blinkPhase = timestamp % 4700;
    const hue = Math.floor(timestamp / 12) % 360;
    const menuColors = rarity === 'prismatic'
      ? [`hsl(${(hue + 48) % 360} 94% 82%)`, `hsl(${hue} 82% 58%)`, `hsl(${(hue + 285) % 360} 72% 42%)`]
      : rarity === 'secret' && els.slime.classList.contains('pleased')
        ? ['#bafaff', '#55d7c8', '#6540a5']
        : SKINS[0].colors;
    drawSlimeAvatar(menuSlimeCtx, {
      x: 90, y: 91, radius: 66, emotion,
      colors: menuColors,
      gazeX: menuGaze.x, gazeY: menuGaze.y,
      blink: emotion === 'focused' && blinkPhase > 4420 && blinkPhase < 4530,
      aura: rarityRank(rarity) >= 2 ? rarity : '',
      petPoint: els.slime.classList.contains('petting') ? menuPetPoint : null,
      timestamp
    });
  }

  function menuSlimeFrame(timestamp) {
    if (!els.homeScreen.classList.contains('active')) {
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
    const selected = SKINS[0];
    const portalProgress = run.portalEntry
      ? clamp((timestamp - run.portalEntry.startedAt) / run.portalEntry.duration, 0, 1)
      : 0;
    const vanishProgress = clamp(portalProgress / .52, 0, 1);
    const portalScale = 1 - (1 - Math.pow(1 - vanishProgress, 3));
    if (run.portalEntry && portalScale <= .01) return;
    const speed = Math.hypot(s.vx, s.vy);
    const stretch = clamp(s.vy / 900, -.22, .3);
    const bounceSquash = clamp(Math.sin(s.wobble) * .025 + Math.abs(s.vx) / 1700, 0, .12);
    const scaleX = 1 - stretch * .42 + bounceSquash;
    const scaleY = 1 + stretch - bounceSquash * .55;
    const radius = s.radius;
    const emotion = timestamp < run.emotionUntil
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

    if (timestamp < run.healGlowUntil) {
      const healProgress = clamp((run.healGlowUntil - timestamp) / 520, 0, 1);
      ctx.save();
      ctx.globalAlpha = healProgress * .42;
      ctx.fillStyle = '#65f5a7';
      ctx.beginPath();
      ctx.arc(s.x, screenY, radius + 13 + (1 - healProgress) * 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawSlimeAvatar(ctx, {
      x: s.x,
      y: screenY,
      radius,
      emotion,
      colors: selected.colors,
      scaleX: scaleX * portalScale,
      scaleY: scaleY * portalScale,
      rotation: clamp(s.vx / 850, -.24, .24) + portalProgress * 1.15,
      alpha: run.portalEntry ? Math.pow(1 - vanishProgress, 1.35) : 1,
      timestamp
    });

    if (!run.portalEntry) drawMassBar(s.x, screenY - radius * .98 - 22, radius);

    if (!run.portalEntry && speed > 260) {
      run.trails.push({ x: s.x, y: s.y, radius, life: .22 });
      if (run.trails.length > 8) run.trails.shift();
    }
    for (const trail of run.trails) trail.life -= .016;
    run.trails = run.trails.filter(trail => trail.life > 0);
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

  function impact(text) {
    els.impactText.textContent = text;
    els.impactText.classList.remove('show');
    void els.impactText.offsetWidth;
    els.impactText.classList.add('show');
  }

  function finishWorld() {
    if (!run || run.ended) return;
    const world = run.world;
    save.worldBest[world.id] = Math.max(save.worldBest[world.id] || 0, world.targetDepth);
    if (world.id === 1 && !save.unlockedSkins.includes('pink')) save.unlockedSkins.push('pink');
    if (world.id === 2 && !save.unlockedSkins.includes('ice')) save.unlockedSkins.push('ice');
    if (world.id === 4 && !save.unlockedSkins.includes('dark')) save.unlockedSkins.push('dark');
    if (world.id < WORLDS.length) save.world = world.id + 1;
    run.coins += world.reward;
    sound('win');
    endRun(true, `Портал мира «${world.name}» достигнут!`);
  }

  function finishRunEarly() {
    if (!run || run.ended) return;
    endRun(false, 'Уровень завершён вручную. Полученная награда сохранена.');
  }

  function endRun(completed, reason) {
    if (!run || run.ended) return;
    run.maxFlight = Math.max(run.maxFlight, run.flightDistance);
    run.ended = true;
    cancelAnimationFrame(run.animationId);
    save.totalRuns += 1;
    save.bestDepth = Math.max(save.bestDepth, run.maxDepth);
    save.worldBest[run.worldId] = Math.max(save.worldBest[run.worldId] || 0, Math.min(run.maxDepth, run.world.targetDepth));
    const baseCoins = Math.max(1, Math.floor(run.coins));
    save.coins += baseCoins;
    run.awardedCoins = baseCoins;
    persist();

    els.resultBadge.textContent = completed ? 'МИР ПРОЙДЕН' : 'ЗАБЕГ ОКОНЧЕН';
    els.resultTitle.textContent = `Глубина: ${run.maxDepth} м`;
    els.resultText.textContent = reason;
    els.resultCoins.textContent = `+${baseCoins}`;
    els.resultBlocks.textContent = run.blocksDestroyed;
    els.resultFlight.textContent = `${Math.floor(run.maxFlight / 10)} м`;
    els.doubleBtn.disabled = false;
    els.doubleBtn.textContent = '▶ Удвоить монеты';
    els.resultOverlay.classList.remove('hidden');
    requestAnimationFrame(() => els.resultOverlay.querySelector('.modal')?.focus());
    if (!completed) sound('fail');
  }

  async function doubleRunCoins() {
    if (!run || run.doubled || run.doublePending || adInFlight) return;
    run.doublePending = true;
    els.doubleBtn.disabled = true;
    try {
      const rewarded = await showRewardedAd(`Удвоить награду: ещё ${run.awardedCoins} монет.`);
      if (!rewarded) return;
      run.doubled = true;
      save.coins += run.awardedCoins;
      persist();
      els.resultCoins.textContent = `+${run.awardedCoins * 2}`;
      els.doubleBtn.textContent = '✓ Удвоено';
      sound('coin');
    } finally {
      run.doublePending = false;
      els.doubleBtn.disabled = run.doubled;
    }
  }

  function continueAfterRun() {
    els.resultOverlay.classList.add('hidden');
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
    if (type === 'skins') return showToast('Облики появятся в одном из следующих обновлений');
    lastFocusedElement = document.activeElement;
    if (type === 'upgrades') renderUpgradesPanel();
    if (type === 'rewards') renderRewardsPanel();
    els.panelOverlay.classList.remove('hidden');
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
            <button class="buy-btn ${maxed ? 'owned' : ''}" data-upgrade="${key}">${maxed ? 'МАКС' : `● ${cost}`}</button>
          </div>`;
        }).join('')}
      </div>`;
    $$('[data-upgrade]').forEach(button => button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade)));
  }

  function renderSkinsPanel() {
    els.panelTitle.textContent = 'Скины слайма';
    els.panelContent.innerHTML = `<div class="panel-section">
      <p class="panel-note">Скины косметические и не влияют на физику или баланс.</p>
      ${SKINS.map(skin => {
        const unlockedByWorld = skin.world && save.world >= skin.world;
        if (unlockedByWorld && !save.unlockedSkins.includes(skin.id)) save.unlockedSkins.push(skin.id);
        const unlocked = save.unlockedSkins.includes(skin.id);
        const selected = save.selectedSkin === skin.id;
        const label = selected ? 'ВЫБРАН' : unlocked ? 'ВЫБРАТЬ' : skin.cost ? `● ${skin.cost}` : 'ЗАКРЫТ';
        return `<div class="skin-card">
          <div class="skin-preview ${skin.className}">${skin.icon}</div>
          <div><h4>${skin.name}</h4><p>${skin.condition}</p></div>
          <button class="buy-btn ${selected ? 'owned' : !unlocked && !skin.cost ? 'locked' : ''}" data-skin="${skin.id}">${label}</button>
        </div>`;
      }).join('')}
    </div>`;
    persist();
    $$('[data-skin]').forEach(button => button.addEventListener('click', () => selectOrBuySkin(button.dataset.skin)));
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
    renderSkinsPanel();
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
        <p class="panel-note">Награды: монеты, бонус массы, шанс эпической еды и дополнительная бесплатная прокрутка.</p>
      </div>`;
    $('#dailyClaimBtn').addEventListener('click', claimDaily);
    $('#wheelSpinBtn').addEventListener('click', spinWheel);
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
    { weight: 13, text: '+20% массы в следующем забеге', apply: () => { save.pendingMassBoost += 20; } },
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
    const finish = promise => promise.finally(() => {
      adInFlight = false;
      document.body.classList.remove('ad-busy');
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
    return finish(new Promise(resolve => { pendingAdResolver = resolve; }));
  }

  function resolveDemoAd(value) {
    els.adOverlay.classList.add('hidden');
    const resolver = pendingAdResolver;
    pendingAdResolver = null;
    if (resolver) resolver(value);
  }

  function closePanel() {
    els.panelOverlay.classList.add('hidden');
    if (lastFocusedElement?.focus) lastFocusedElement.focus();
  }

  function bindEvents() {
    bindMenuSlimeInteractions();
    els.rerollBtn.addEventListener('click', rerollOffer);
    els.startDropBtn.addEventListener('click', startDrop);
    els.adminRestartBtn.addEventListener('click', restartDraftFromAdmin);
    els.adminPrevWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(-1));
    els.adminNextWorldBtn?.addEventListener('click', () => switchWorldFromAdmin(1));
    els.adminResetProgressBtn?.addEventListener('click', resetProgressFromAdmin);
    els.feedSelectedBtn.addEventListener('click', () => {
      if (selectedFoodOfferIndex === null) return;
      const source = $(`.food-card[data-offer-index="${selectedFoodOfferIndex}"]`);
      chooseFood(selectedFoodOfferIndex, source);
    });
    els.abilityBtn.addEventListener('click', activateAbility);
    els.endRunBtn.addEventListener('click', finishRunEarly);
    els.doubleBtn.addEventListener('click', doubleRunCoins);
    els.continueBtn.addEventListener('click', continueAfterRun);
    els.closePanelBtn.addEventListener('click', closePanel);
    els.panelOverlay.addEventListener('click', event => { if (event.target === els.panelOverlay) closePanel(); });
    els.adRewardBtn.addEventListener('click', () => resolveDemoAd(true));
    els.adCancelBtn.addEventListener('click', () => resolveDemoAd(false));
    $$('[data-panel]').forEach(button => button.addEventListener('click', () => renderPanel(button.dataset.panel)));
    document.addEventListener('pointerdown', event => {
      if (els.foodInfo.classList.contains('hidden')) return;
      if (event.target.closest('#foodInfo') || event.target.closest('.food-card')) return;
      hideFoodInfo();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopAllSounds();
        persist();
        if (run && !run.ended) run.lastTime = 0;
      }
    });
    window.addEventListener('beforeunload', persist);
    window.addEventListener('resize', () => { if (run && !run.ended) prepareCanvas(); });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (!els.adOverlay.classList.contains('hidden')) resolveDemoAd(false);
      else if (!els.panelOverlay.classList.contains('hidden')) closePanel();
      else hideFoodInfo();
    });
  }

  function init() {
    bindEvents();
    updatePersistentUI();
    if (save.pendingWheel) finishPendingWheel(false);
    if (restoreSession(save.activeDraft)) {
      showScreen('home');
      renderDraft();
      persist();
    } else newDraft();
    window.SlimeGameDebug = {
      reset: () => { localStorage.removeItem(SAVE_KEY); location.reload(); },
      addCoins: (amount = 1000) => { save.coins += amount; persist(); },
      unlockFood: () => { save.conveyorLevel = 5; persist(); newDraft(); },
      maxStomach: () => { save.stomachLevel = 5; persist(); newDraft(); },
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
      save: () => structuredClone(save),
      foods: () => FOODS.map(food => ({ ...food })),
      worlds: () => WORLDS.map(world => ({ ...world }))
    };
  }

  init();
})();
