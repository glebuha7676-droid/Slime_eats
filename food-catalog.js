(() => {
  'use strict';

  const ROOT = 'assets/ЕДА';

  // Три обычные редкости отвечают за характеристики. Особые карточки дают
  // эффекты, а секретные меняют правила забега.
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
    special: [
      ['royalBreakfast', 'Королевский завтрак', 'Общий пул/Королевский завтрак.webp'],
      ['catCake', 'Кото пирожное', 'Общий пул/Кото пирожное.webp'],
      ['lollipops', 'Леденцы', 'Общий пул/Леденцы.webp'],
      ['napoleon', 'Напалеон', 'Общий пул/Напалеон.webp'],
      ['cappuccino', 'Чашечка Капучино', 'Общий пул/Чашечка Капучино.webp'],
      ['thornBread', 'Терновый хлеб', 'Природная/Терновый хлеб.webp', 1],
      ['iceCube', 'Кубик льда', 'Морозная/Кубик льда.webp', 2],
      ['chocolateBoom', 'Шоколадный бум', 'Сладости/Шоколадный бум.webp', 3],
      ['dragonRamen', 'Драконий рамен', 'Огненная/Драконий рамен.webp', 4],
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

  // Базовые карты работают только с тремя понятными характеристиками:
  // здоровьем, уроном и щитом. Заряды щита встречаются исключительно как
  // редкий бонус, поэтому каждый дополнительный заряд остаётся ценным.
  const STATS = {
    common: [
      { category:'health', health:12 }, { category:'health', health:15 }, { category:'damage', damage:3 },
      { category:'shield', shield:6 }, { category:'health', health:10 },
      { category:'damage', damage:2 }, { category:'shield', shield:7 }, { category:'health', health:14 },
      { category:'damage', damage:3 }
    ],
    rare: [
      { category:'health', health:12, damage:2 }, { category:'shield', health:10, shield:6 },
      { category:'damage', damage:3, shield:4 }, { category:'damage', health:8, damage:3 },
      { category:'shield', health:9, shield:5 }, { category:'damage', damage:2, shield:6 },
      { category:'health', health:16, shield:3 }, { category:'health', health:10, coinMultiplier:.15 },
      { category:'shield', health:8, shield:7 }
    ],
    epic: [
      { category:'health', health:24 }, { category:'damage', health:10, damage:5 },
      { category:'shield', health:10, shield:12 }, { category:'damage', damage:4, coinMultiplier:.25 },
      { category:'damage', health:13, damage:4 }, { category:'shield', health:15, shield:8 },
      { category:'damage', damage:6, shield:4 }, { category:'health', health:22, shield:6 },
      { category:'shield', shield:14, shieldCharges:1 }
    ],
    special: [
      { category:'health', health:20, damage:3, shield:5, effect:'rainbow', effectText:'+10% ко всем числовым бонусам' },
      { category:'health', health:27, effect:'momentum', effectText:'Пробитые блоки почти не гасят разгон' },
      { category:'damage', health:10, damage:8, effect:'dragonBlast', effectText:'Каждый 10-й пробитый блок взрывается' },
      { category:'shield', health:12, shield:14, effect:'freeBounces', effectText:'Первые 3 рикошета не тратят здоровье' },
      { category:'shield', shield:8, shieldCharges:1, effect:'shieldReady', effectText:'+1 заряд щита' },
      { category:'health', health:16, coinMultiplier:.75, effect:'oreHeal', effectText:'Руда и монетные блоки лечат слайма' },
      { category:'damage', health:14, damage:5, shieldCharges:1, effect:'shieldReady', effectText:'+1 заряд щита' },
      { category:'shield', health:17, shield:8, effect:'softLanding', effectText:'После рикошета 1 секунда сниженного урона' },
      { category:'shield', health:19, shield:14, effect:'healBoost', effectText:'Лечащие блоки восстанавливают вдвое больше' },
      { category:'health', health:24, damage:4, shield:6, effect:'prismFlow', effectText:'+12% ко всем числовым бонусам еды' },
      { category:'shield', health:12, damage:3, shieldCharges:1, effect:'shieldReady', effectText:'+1 заряд щита' },
      { category:'shield', health:18, shield:12, effect:'freeBounces', effectText:'Первые 3 рикошета не тратят здоровье' }
    ],
    secret: [
      { category:'damage', health:22, damage:8, shield:8, effect:'voidBreaker', effectText:'Первый непробиваемый твёрдый блок исчезает' },
      { category:'health', health:30, damage:5, shield:10, effect:'rainbowHeart', effectText:'Один раз восстанавливает 30% здоровья' }
    ]
  };

  const MIN_CONVEYOR = { common:1, rare:2, epic:3, special:4, secret:5 };
  const iconFor = category => ({ health:'🍔', damage:'⚡', shield:'🛡️' })[category] || '🍽️';
  const catalog = Object.entries(ASSETS).flatMap(([rarity, assets]) => assets.map((asset, index) => {
    const [id, name, relativePath, worldId] = asset;
    const stats = STATS[rarity][index % STATS[rarity].length];
    const numericStats = { ...stats, statVersion: 3 };
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
    { id: 'oreHeal', label: 'Лечение от руды' },
    { id: 'shieldReady', label: 'Дополнительный заряд щита' },
    { id: 'softLanding', label: 'Мягкое приземление' },
    { id: 'healBoost', label: 'Усиление лечения' },
    { id: 'bombPull', label: 'Притяжение взрывов' },
    { id: 'prismFlow', label: 'Сияющий бонус' },
    { id: 'voidBreaker', label: 'Пробой Пустоты' },
    { id: 'rainbowHeart', label: 'Сердце Радуги' }
  ];

  if (Array.isArray(window.SLIME_PUBLISHED_FOOD_CATALOG) && window.SLIME_PUBLISHED_FOOD_CATALOG.length) {
    window.SLIME_FOOD_CATALOG = window.SLIME_PUBLISHED_FOOD_CATALOG;
  }
})();
