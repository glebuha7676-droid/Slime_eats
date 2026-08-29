(() => {
  'use strict';

  const WORLD_LEVELS = {
    1: [
      { depth: 100, features: { dynamite: false, medkit: false, hazards: true, boss: false }, utilityCadence: 0,
        sections: ['tutorial', 'flow', 'ore', 'flow', 'ore', 'flow', 'final'] },
      { depth: 200, features: { dynamite: true, medkit: true, hazards: true, boss: false }, utilityCadence: 8,
        sections: ['tutorial', 'flow', 'bomb', 'ore', 'flow', 'bomb', 'flow', 'final'] },
      { depth: 300, features: { dynamite: true, medkit: true, hazards: true, boss: false }, utilityCadence: 7,
        sections: ['tutorial', 'flow', 'bomb', 'recovery', 'ore', 'flow', 'bomb', 'recovery', 'final'] },
      { depth: 400, features: { dynamite: true, medkit: true, hazards: true, boss: false }, utilityCadence: 7,
        sections: ['tutorial', 'flow', 'bomb', 'recovery', 'challenge', 'ore', 'bomb', 'challenge', 'final'] },
      { depth: 500, features: { dynamite: true, medkit: true, hazards: true, boss: true }, utilityCadence: 6,
        sections: ['tutorial', 'flow', 'bomb', 'recovery', 'challenge', 'ore', 'bomb', 'recovery', 'boss', 'final'] }
    ]
  };

  const WORLDS = [
    {
      id: 1, name: 'Зелёные глубины', targetDepth: 500, reward: 300,
      pathWidth: 3, minPathWidth: 3, turnRate: .08,
      hardCap: .08, reinforcedCap: .018, oreChance: .075, specialChance: .16,
      sky: '#63825b', earth: '#3b3027', deep: '#171c20', accent: '#54d7b0', icon: '🌿',
      materials: ['packedDirt', 'stone', 'obsidian'], palette: 'earth',
      cellSize: 72, hazardChance: .055
    },
    {
      id: 2, name: 'Ледяная пещера', targetDepth: 550, reward: 700,
      pathWidth: 3, minPathWidth: 2, turnRate: .18,
      hardCap: .15, reinforcedCap: .02, oreChance: .06, specialChance: .115,
      sky: '#4b7f97', earth: '#244452', deep: '#10232d', accent: '#67e8f9', icon: '🧊',
      materials: ['iceLight', 'snowPacked', 'glacier'], palette: 'ice',
      cellSize: 72, hazardChance: .075
    },
    {
      id: 3, name: 'Конфетная фабрика', targetDepth: 600, reward: 1550,
      pathWidth: 2, minPathWidth: 2, turnRate: .28,
      hardCap: .27, reinforcedCap: .07, oreChance: .075, specialChance: .095,
      sky: '#8f4b82', earth: '#4a244d', deep: '#21142d', accent: '#f472b6', icon: '🍬',
      materials: ['candy', 'cookie', 'stone'], palette: 'candy',
      cellSize: 72
    },
    {
      id: 4, name: 'Магмовое ядро', targetDepth: 650, reward: 3300,
      pathWidth: 2, minPathWidth: 1, turnRate: .37,
      hardCap: .39, reinforcedCap: .15, oreChance: .09, specialChance: .082,
      sky: '#7d3426', earth: '#45221e', deep: '#1b1112', accent: '#fb7185', icon: '🌋',
      materials: ['basalt', 'lavaRock', 'metal'], palette: 'lava',
      cellSize: 72
    }
  ];

  const PHYSICS = {
    gridCell: 55,
    gravityBase: 240,
    gravityPerWorld: 0,
    maxFallSpeedBase: 360,
    maxFallSpeedPerWorld: 0,
    weakBreakDrag: .992,
    denseBreakDrag: .955,
    flightKeepSoft: .80,
    flightKeepDense: .55,
    flightKeepHard: .28,
    impactClusterMs: 150,
    bounceMin: 70,
    bounceMax: 215,
    sideBounceMax: 195,
    bounceGraceMs: 165,
    segmentMinRows: 3,
    segmentMaxRows: 6
  };

  const BLOCK_TIERS = {
    soft: { label: 'Лёгкий', shock: .55, drag: .99, coin: .72 },
    dense: { label: 'Плотный', shock: .82, drag: .95, coin: 1 },
    hard: { label: 'Твёрдый', shock: 1.05, drag: .91, coin: 1.45 },
    reinforced: { label: 'Усиленный', shock: 1.22, drag: .88, coin: 2.05 },
    ore: { label: 'Руда', shock: .86, drag: .94, coin: 3.55 },
    special: { label: 'Особый', shock: .72, drag: .96, coin: 1.30 }
  };

  const RARITY_LABELS = {
    common: 'Обычная', rare: 'Редкая', epic: 'Эпическая', special: 'Особая', secret: 'Секретная'
  };

  const WORLD_SPRITE_NAMES = {
    1: ['dirt-grass', 'ground-weak', 'stone', 'stone-reinforced', 'stone-hazard', 'ore-coal', 'ore-iron', 'ore-gold', 'ore-diamond', 'dynamite', 'heal', 'portal'],
    2: ['ice-light', 'snow-packed', 'glacier', 'ice-reinforced', 'ice-shards', 'ice-spikes', 'ore-coal', 'ore-iron', 'ore-gold', 'ore-diamond', 'cryo', 'snowflake', 'heal', 'portal'],
    3: ['candy-light', 'cookie-packed', 'candy-normal', 'candy-reinforced', 'candy-hazard', 'ore-coal', 'ore-iron', 'ore-gold', 'ore-diamond', 'jelly-bounce', 'heal', 'portal'],
    4: ['ash', 'volcanic-earth', 'basalt', 'lava-hazard', 'ore-coal', 'ore-iron', 'ore-gold', 'ore-diamond', 'geyser', 'meteor', 'heal', 'portal']
  };

  const ORE_TYPES = [
    { id: 'coal', label: 'УГОЛЬ', min: 0, reward: .72, hp: [10, 10] },
    { id: 'iron', label: 'ЖЕЛЕЗО', min: .12, reward: 1.02, hp: [30, 30] },
    { id: 'gold', label: 'ЗОЛОТО', min: .32, reward: 1.48, hp: [60, 60] },
    { id: 'diamond', label: 'АЛМАЗ', min: .58, reward: 2.10, hp: [100, 100] }
  ];

  const FOOD_ART_OFFSETS = {
    apple: [3.4, -5], blackHoleCandy: [5, -3.8], bun: [-5.6, -7.8], burger: [2.2, -.9], cheese: [0, -1.9],
    diamondJelly: [3.1, 1.9], donut: [-1.9, -3.1], dragonRamen: [3.1, 2.8], giantMochi: [7.5, -1.6],
    giantPizza: [-.9, 3.4], goldenFeast: [1.9, 6.2], gummy: [-5, 2.5], hotdog: [.9, -2.5], iceCream: [1.6, .9],
    jellyShield: [0, -2.8], kingPudding: [5.9, -.9], magnetCandy: [-1.2, -3.1], moonMochi: [-1.9, -3.4],
    pepper: [-2.5, -7.8], phoenixPepper: [-2.8, 0], popcorn: [-1.2, -4.1], powerPizza: [-.9, 1.2], prismApple: [5.9, 0],
    prismBerry: [6.2, 8.1], prismPear: [10.9, 7.5], pudding: [-4.7, -2.5], rainbowCake: [1.6, 6.6],
    rainbowHeart: [-1.2, 7.5], soda: [-3.4, .6], spicyBurger: [-2.8, .9], starFruit: [1.6, -1.9], steak: [1.2, -1.6],
    voidFruit: [5.9, 7.5], yogurt: [-2.5, -6.6]
  };

  const SKINS = [
    { id: 'classic', name: 'Классический', className: 'skin-classic', icon: '🟢', condition: 'Доступен сразу', colors: ['#e9ff9c', '#67d348', '#2fa345'] },
    { id: 'cat', name: 'Котик', className: 'skin-cat', icon: '🐱', world: 2, condition: 'Пройди Мир 1', colors: ['#ffe0e8', '#ff92ad', '#dc557b'] },
    { id: 'water', name: 'Капля воды', className: 'skin-water', icon: '💧', world: 3, condition: 'Пройди Мир 2', colors: ['#e3fbff', '#50c9f2', '#1688c6'] },
    { id: 'honey', name: 'Медовый', className: 'skin-honey', icon: '🍯', cost: 1500, condition: 'Купить за 1500 монет', colors: ['#fff0a6', '#f4a629', '#c96b15'] },
    { id: 'dumpling', name: 'Дамплинг', className: 'skin-dumpling', icon: '🥟', world: 4, condition: 'Пройди Мир 3', colors: ['#fff9e8', '#ead9b7', '#ba8d62'] },
    { id: 'ball', name: 'Футбольный мяч', className: 'skin-ball', icon: '⚽', cost: 1200, condition: 'Купить за 1200 монет', colors: ['#ffffff', '#edf2f5', '#b9c7d1'] }
  ];

  const UPGRADES = {
    stomachLevel: {
      name: 'Желудок', icon: 'stomach', max: 4,
      description: 'Вместимость: от 1 до 4 блюд. Каждая карта — заметный выбор.',
      costs: [0, 45, 180, 650]
    },
    conveyorLevel: {
      name: 'Конвейер', icon: 'conveyor', max: 5,
      description: 'Снижает шанс обычной еды и открывает эпические, особые и секретные карточки.',
      costs: [0, 90, 340, 1150, 3600]
    },
    rerollLevel: {
      name: 'Удача конвейера', icon: 'reroll', max: 3,
      description: '+5% к редким картам после рекламного обновления.',
      costs: [180, 900, 3500]
    }
  };

  const DEFAULT_SAVE = {
    schemaVersion: 18,
    coins: 20,
    world: 1,
    worldBest: { 1: 0, 2: 0, 3: 0, 4: 0 },
    lastRunDepth: {},
    levelFailures: {},
    selectedLevels: { 1: 1, 2: 1, 3: 1, 4: 1 },
    unlockedLevels: { 1: 1, 2: 1, 3: 1, 4: 1 },
    stomachLevel: 1,
    conveyorLevel: 1,
    rerollLevel: 0,
    bestDepth: 0,
    endlessBestScore: { 1: 0, 2: 0, 3: 0, 4: 0 },
    endlessBestDepth: { 1: 0, 2: 0, 3: 0, 4: 0 },
    endlessRuns: { 1: 0, 2: 0, 3: 0, 4: 0 },
    homeMode: 'campaign',
    selectedSkin: 'classic',
    unlockedSkins: ['classic'],
    selectedTrail: 'none',
    unlockedTrails: ['none'],
    discoveredFoods: [],
    revealedSecretFoods: [],
    lastDailyDate: '', dailyStreak: 0,
    lastWheelDate: '', wheelAdDate: '', wheelAdSpins: 0,
    pendingEpicBoost: 0, pendingHealthBoost: 0, pendingExtraRerolls: 0,
    foodPity: { noEpic: 0, noSpecial: 0, noSecret: 0 },
    activeDraft: null,
    pendingWheel: null,
    totalRuns: 0,
    gameCompleted: false,
    sound: true
  };

  window.SlimeGameConfig = Object.freeze({
    SAVE_KEY: 'slime_feed_and_fall_save',
    CLOUD_SAVE_KEY: 'slimeSave',
    LEGACY_SAVE_KEYS: ['slime_feed_and_fall_v10', 'slime_feed_and_fall_v9', 'slime_feed_and_fall_v8', 'slime_feed_and_fall_v7', 'slime_feed_and_fall_v6', 'slime_feed_and_fall_v5', 'slime_feed_and_fall_v4', 'slime_feed_and_fall_v3'],
    VIEW_W: 440,
    VIEW_H: 650,
    LEVEL_COUNT: 5,
    LEVEL_DEPTH_RATIOS: [.36, .52, .68, .84, 1],
    ASSET_REVISION: '20260829-3',
    FOOD_ASSET_ROOT: 'assets/ЕДА/Общий пул/',
    UI_ASSET_ROOT: 'assets/ui/',
    FOOD_EDITOR_STORAGE_KEY: 'slime_food_catalog_v3',
    FOOD_RARITIES: ['common', 'rare', 'epic', 'special', 'secret'],
    FOOD_CATEGORIES: ['health', 'damage', 'shield', 'secret'],
    WORLD_LEVELS,
    WORLDS,
    PHYSICS,
    BLOCK_TIERS,
    RARITY_LABELS,
    WORLD_SPRITE_NAMES,
    ORE_TYPES,
    FOOD_ART_OFFSETS,
    SKINS,
    UPGRADES,
    DEFAULT_SAVE
  });
})();
