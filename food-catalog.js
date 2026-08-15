(() => {
  'use strict';

  const ROOT = 'assets/ЕДА';

  // 30 блюд общего пула дают по пять вариантов каждой редкости.
  // В каждом тематическом мире есть ещё ровно одно блюдо каждой редкости.
  const ASSETS = {
    common: [
      ['watermelon', 'Арбуз', 'Общий пул/Арбуз.webp'],
      ['grandmaPastry', 'Бабушкина стрепня', 'Общий пул/Бабушкина стрепня.webp'],
      ['pancakes', 'Блинчики', 'Общий пул/Блинчики.webp'],
      ['frenchFries', 'Картофель фри', 'Общий пул/Картофель фри.webp'],
      ['loafCat', 'Буханка', 'Общий пул/Буханка.webp'],
      ['suspiciousMushroom', 'Подозрительный гриб', 'Природная/Подозрительный гриб.webp', 1],
      ['snowPiece', 'Кусочек снега', 'Морозная/Кусочек снега.webp', 2],
      ['gummyWorms', 'Мармеладные червячки', 'Сладости/Мармеладные червячки.webp', 3],
      ['edibleCoals', 'Съедобные угольки', 'Огненная/Съедобные угольки.webp', 4]
    ],
    rare: [
      ['bigBurger', 'Большой бургер', 'Общий пул/Большой бургер.webp'],
      ['happyCupcake', 'Весёлый кекс', 'Общий пул/Весёлый кекс.webp'],
      ['tastySushi', 'Вкусные суши', 'Общий пул/Вкусные суши.webp'],
      ['perfectPizza', 'Идеальная пицца', 'Общий пул/Идеальная пицца.webp'],
      ['hotDog', 'хот Дог', 'Общий пул/хот Дог.webp'],
      ['pedigreeYeast', 'Породистое дрожже', 'Природная/Породистое дрожже.webp', 1],
      ['absoluteZero', 'Абсолютный ноль', 'Морозная/Абсолютный ноль.webp', 2],
      ['gingerbreadMan', 'Пряничный человечек', 'Сладости/Пряничный человечек.webp', 3],
      ['flamingPopcorn', 'Пламенный попкорн', 'Огненная/Пламенный попкорн.webp', 4]
    ],
    epic: [
      ['butter', 'Масло', 'Общий пул/Масло.webp'],
      ['mochi', 'Моти', 'Общий пул/Моти.webp'],
      ['spaghetti', 'Спагетти', 'Общий пул/Спагетти.webp'],
      ['fruitPlate', 'Фруктовая тарелка', 'Общий пул/Фруктовая тарелка.webp'],
      ['churros', 'Чуррос', 'Общий пул/Чуррос.webp'],
      ['sweetRoots', 'Сладкие корни', 'Природная/Сладкие корни.webp', 1],
      ['doublePopsicle', 'Двойное эскимо', 'Морозная/Двойное эскимо.webp', 2],
      ['royalPudding', 'Королевский пудинг', 'Сладости/Королевский пудинг.webp', 3],
      ['lavaDessert', 'Лавовый десерт', 'Огненная/Лавовый десерт.webp', 4]
    ],
    legendary: [
      ['royalBreakfast', 'Королевский завтрак', 'Общий пул/Королевский завтрак.webp'],
      ['catCake', 'Кото пирожное', 'Общий пул/Кото пирожное.webp'],
      ['lollipops', 'Леденцы', 'Общий пул/Леденцы.webp'],
      ['napoleon', 'Напалеон', 'Общий пул/Напалеон.webp'],
      ['cappuccino', 'Чашечка Капучино', 'Общий пул/Чашечка Капучино.webp'],
      ['thornBread', 'Терновый хлеб', 'Природная/Терновый хлеб.webp', 1],
      ['iceCube', 'Кубик льда', 'Морозная/Кубик льда.webp', 2],
      ['chocolateBoom', 'Шоколадный бум', 'Сладости/Шоколадный бум.webp', 3],
      ['dragonRamen', 'Драконий рамен', 'Огненная/Драконий рамен.webp', 4]
    ],
    prismatic: [
      ['enchantedApple', 'Зачарованное яблоко', 'Общий пул/Зачарованное яблоко.webp'],
      ['honeyButtons', 'Медовые кнопочки', 'Общий пул/Медовые кнопочки.webp'],
      ['airyBun', 'Очень воздушная булочка', 'Общий пул/Очень воздушная булочка.webp'],
      ['pixelCake', 'Пиксельный торт', 'Общий пул/Пиксельный торт.webp'],
      ['cottonCandy', 'Сладкая вата', 'Общий пул/Сладкая вата.webp'],
      ['petalCake', 'Торт из лепестков', 'Природная/Торт из лепестков.webp', 1],
      ['crystalPie', 'Хрустальный пирог', 'Морозная/Хрустальный пирог.webp', 2],
      ['sugarPyramid', 'Сахарная пирамидка', 'Сладости/Сахарная пирамидка.webp', 3],
      ['volcanicDrink', 'Вулканический напиток', 'Огненная/Вулканический напиток.webp', 4]
    ],
    secret: [
      ['classified', 'Засекречено', 'Общий пул/Засекречено.webp'],
      ['evilCola', 'Злая кола', 'Общий пул/Злая кола.webp'],
      ['pickledCucumber', 'Маринованный огурчик', 'Общий пул/Маринованный огурчик.webp'],
      ['nicheDessert', 'Нишевый десерт', 'Общий пул/Нишевый десерт.webp'],
      ['cuteBanana', 'Умилительный банан', 'Общий пул/Умилительный банан.webp'],
      ['lifeFruit', 'Фрукт жизни', 'Природная/Фрукт жизни.webp', 1],
      ['northernDelicacy', 'Северный деликатес', 'Морозная/Северный деликатес.webp', 2],
      ['sweetestCake', 'Самый сладкий торт', 'Сладости/Самый сладкий торт.webp', 3],
      ['heartOfFlame', 'Сердце пламени', 'Огненная/Сердце пламени.webp', 4]
    ]
  };

  // Балансовые шаблоны сохраняют прежние диапазоны характеристик и эффектов.
  // Они распределяются внутри редкости, поэтому новые картинки не меняют силу конвейера скачком.
  const STATS = {
    common: [
      { category:'mass', mass:6 }, { category:'mass', mass:8 }, { category:'power', power:.42 },
      { category:'defense', mass:3, defense:.07 }, { category:'bounce', mass:3, elasticity:.10 },
      { category:'magic', mass:2, ability:7 }, { category:'mass', mass:9 },
      { category:'power', mass:3, power:.34 }, { category:'defense', mass:4, defense:.06 }
    ],
    rare: [
      { category:'mass', mass:14 }, { category:'defense', mass:5, defense:.12 },
      { category:'bounce', mass:4, elasticity:.20, ability:10 }, { category:'power', mass:7, power:.54 },
      { category:'power', mass:9, power:.28 }, { category:'defense', mass:7, defense:.09, elasticity:.07 },
      { category:'mass', mass:11, defense:.04 }, { category:'magic', mass:5, coinMultiplier:.18 },
      { category:'bounce', mass:8, elasticity:.14 }
    ],
    epic: [
      { category:'bounce', mass:7, elasticity:.34 }, { category:'power', mass:11, power:.92 },
      { category:'defense', mass:9, defense:.21 }, { category:'magic', mass:6, coinMultiplier:.45 },
      { category:'power', mass:13, power:.66 }, { category:'defense', mass:15, defense:.12, elasticity:.13 },
      { category:'power', mass:5, power:.95, ability:14, effect:'smallRevive', effectText:'Один раз спасает с 12% здоровья' },
      { category:'mass', mass:17, defense:.10 }, { category:'power', mass:10, power:.78 }
    ],
    legendary: [
      { category:'mass', mass:20, power:.38, defense:.10, effect:'rainbow', effectText:'+10% ко всем числовым бонусам' },
      { category:'mass', mass:27, effect:'momentum', effectText:'Пробитые блоки почти не гасят разгон' },
      { category:'power', mass:10, power:1.38, ability:14, effect:'dragonBlast', effectText:'Каждый 10-й пробитый блок взрывается' },
      { category:'defense', mass:12, defense:.25, effect:'freeBounces', effectText:'Первые 3 рикошета не тратят здоровье' },
      { category:'magic', mass:9, elasticity:.35, ability:20, effect:'chargeBoost', effectText:'Барьер заряжается на 25% быстрее' },
      { category:'magic', mass:16, coinMultiplier:.75, ability:15, effect:'oreHeal', effectText:'Руда и монетные блоки лечат слайма' },
      { category:'magic', mass:14, power:.80, elasticity:.24, ability:18, effect:'cooldownCut', effectText:'Барьер заряжается ещё на 15% быстрее' },
      { category:'bounce', mass:17, defense:.12, elasticity:.34, effect:'softLanding', effectText:'После рикошета 1 секунда сниженного урона' },
      { category:'defense', mass:19, defense:.24, effect:'healBoost', effectText:'Лечащие блоки восстанавливают вдвое больше' }
    ],
    prismatic: [
      { category:'mass', mass:24, power:.55, defense:.12, effect:'prismFlow', effectText:'+12% ко всем числовым бонусам еды' },
      { category:'magic', mass:12, power:.45, ability:22, effect:'chargeBoost', effectText:'Барьер заряжается на 25% быстрее' },
      { category:'defense', mass:18, defense:.20, effect:'freeBounces', effectText:'Первые 3 рикошета не тратят здоровье' }
    ],
    secret: [
      { category:'power', mass:22, power:1.15, defense:.12, effect:'voidBreaker', effectText:'Первый непробиваемый твёрдый блок исчезает' },
      { category:'mass', mass:30, power:.75, defense:.18, effect:'rainbowHeart', effectText:'Один раз восстанавливает 30% здоровья' }
    ]
  };

  const MIN_CONVEYOR = { common:1, rare:2, epic:3, legendary:4, prismatic:5, secret:5 };
  const iconFor = category => ({ mass:'🍔', power:'⚡', defense:'🛡️', bounce:'🟣', magic:'✨' })[category] || '🍽️';
  const catalog = Object.entries(ASSETS).flatMap(([rarity, assets]) => assets.map((asset, index) => {
    const [id, name, relativePath, worldId] = asset;
    const stats = STATS[rarity][index % STATS[rarity].length];
    const numericStats = {
      ...stats,
      statVersion: 2,
      power: Math.round((stats.power || 0) * 10),
      defense: Math.round((stats.defense || 0) * 100)
    };
    return {
      id,
      name,
      icon: iconFor(numericStats.category),
      rarity,
      minConveyor: MIN_CONVEYOR[rarity],
      image: `${ROOT}/${relativePath}`,
      ...(worldId ? { worlds:[worldId] } : {}),
      ...numericStats
    };
  }));

  window.SLIME_FOOD_CATALOG = catalog;

  window.SLIME_FOOD_EFFECTS = [
    { id: '', label: 'Без особого эффекта' },
    { id: 'smallRevive', label: 'Малое возрождение' },
    { id: 'rainbow', label: 'Радужный бонус' },
    { id: 'momentum', label: 'Сохранение разгона' },
    { id: 'dragonBlast', label: 'Драконий взрыв' },
    { id: 'freeBounces', label: 'Бесплатные рикошеты' },
    { id: 'chargeBoost', label: 'Ускоренная зарядка' },
    { id: 'oreHeal', label: 'Лечение от руды' },
    { id: 'cooldownCut', label: 'Дополнительная зарядка барьера' },
    { id: 'softLanding', label: 'Мягкое приземление' },
    { id: 'healBoost', label: 'Усиление лечения' },
    { id: 'bombPull', label: 'Притяжение взрывов' },
    { id: 'prismFlow', label: 'Призматический бонус' },
    { id: 'voidBreaker', label: 'Пробой Пустоты' },
    { id: 'rainbowHeart', label: 'Сердце Радуги' }
  ];

  if (Array.isArray(window.SLIME_PUBLISHED_FOOD_CATALOG) && window.SLIME_PUBLISHED_FOOD_CATALOG.length) {
    window.SLIME_FOOD_CATALOG = window.SLIME_PUBLISHED_FOOD_CATALOG;
  }
})();
