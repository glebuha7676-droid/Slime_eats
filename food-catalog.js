(() => {
  'use strict';

  const ROOT = 'assets/ЕДА';
  const MIN_CONVEYOR = { common: 1, rare: 2, epic: 3, special: 1, secret: 1 };
  const iconFor = category => ({ health: '🍔', damage: '⚡', shield: '🛡️' })[category] || '🍽️';

  // Активный прототип: семь категорий, ровно по три предмета в каждой.
  // Космос добавляется в общий конвейер только после открытия его эмблемы.
  // Остальные заготовки и их изображения остаются в проекте, но не попадают
  // на конвейер и не участвуют в текущем игровом цикле.
  const CARDS = [
    ['common', 'watermelon', 'Арбуз', 'Общий пул/Арбуз.webp', {
      category: 'damage', recipeFamily: 'electric', damage: 10, minConveyor: 1,
      description: 'Касание блока наносит 1 урон соседнему блоку.'
    }],
    ['rare', 'bigBurger', 'Большой бургер', 'Общий пул/Большой бургер.webp', {
      category: 'damage', recipeFamily: 'electric', damage: 20, minConveyor: 1,
      description: 'Разряд цепочкой поражает от 1 до 4 блоков и стремится глубже.'
    }],
    ['epic', 'mochi', 'Моти', 'Общий пул/Моти.webp', {
      category: 'damage', recipeFamily: 'electric', damage: 50, healthPenalty: 40, minConveyor: 1,
      description: 'Открывает ультраформу «Чистая энергия».'
    }],

    ['rare', 'hotDog', 'Хот-дог', 'Общий пул/хот Дог.webp', {
      category: 'damage', recipeFamily: 'fire', damage: 15, health: 10, minConveyor: 1,
      description: 'Подожжённый блок через секунду получает 1 урон.'
    }],
    ['rare', 'flamingPopcorn', 'Пламенный попкорн', 'Огненная/Пламенный попкорн.webp', {
      category: 'health', recipeFamily: 'fire', health: 20, shield: 5, minConveyor: 1,
      description: 'Если блок сгорел, огонь переходит на соседний блок.'
    }],
    ['special', 'lavaDessert', 'Лавовый десерт', 'Огненная/Лавовый десерт.webp', {
      category: 'shield', recipeFamily: 'fire', shield: 10, minConveyor: 1,
      description: 'Открывает ультраформу «Живое пламя».'
    }],

    ['rare', 'absoluteZero', 'Абсолютный ноль', 'Морозная/Абсолютный ноль.webp', {
      category: 'shield', recipeFamily: 'ice', shield: 15, health: 10, minConveyor: 1,
      description: 'Прочный блок при касании превращается в снег с 1 прочностью.'
    }],
    ['special', 'doublePopsicle', 'Двойное эскимо', 'Морозная/Двойное эскимо.webp', {
      category: 'health', recipeFamily: 'ice', health: 20, minConveyor: 1,
      description: 'Сломанный снег с шансом 35% разбрасывает 2–5 снежных осколков.'
    }],
    ['epic', 'lollipops', 'Леденцы', 'Общий пул/Леденцы.webp', {
      category: 'shield', recipeFamily: 'ice', shield: 10, shieldCharges: 1, minConveyor: 1,
      description: 'Открывает ультраформу со снежками и блоками-снежинками.'
    }],

    ['rare', 'antiGravityBun', 'Булочка невесомости', 'Общий пул/Очень воздушная булочка.webp', {
      category: 'shield', recipeFamily: 'cosmos', shield: 10, minConveyor: 1, requiresMutation: 'cosmos',
      description: 'Позволяет менять направление гравитации вверх и вниз.'
    }],
    ['epic', 'cometCola', 'Кометная кола', 'Общий пул/Злая кола.webp', {
      category: 'damage', recipeFamily: 'cosmos', damage: 20, minConveyor: 1, requiresMutation: 'cosmos',
      description: 'После подъёма разгон вниз превращает слайма в комету и пробивает 5 блоков любой прочности.'
    }],
    ['special', 'pocketGalaxy', 'Карманная галактика', 'assets/ui/recipe-categories/mutation-cosmos.png', {
      category: 'health', recipeFamily: 'cosmos', health: 20, minConveyor: 1, requiresMutation: 'cosmos',
      description: 'Открывает ультраформу «Чёрная дыра».'
    }],

    ['common', 'giantLoaf', 'Буханка великана', 'Общий пул/Буханка.webp', {
      category: 'damage', recipeFamily: 'gigantism', damage: 10, minConveyor: 1, requiresMutation: 'gigantism',
      description: 'Слайм наносит породе 2 урона и пробивает обычные блоки.'
    }],
    ['rare', 'bottomlessBreakfast', 'Бездонный завтрак', 'Общий пул/Королевский завтрак.webp', {
      category: 'damage', recipeFamily: 'gigantism', damage: 20, minConveyor: 1, requiresMutation: 'gigantism',
      description: 'Избыточный урон переходит в блок ниже или в соседний блок.'
    }],
    ['special', 'titanApple', 'Яблоко титана', 'Общий пул/Зачарованное яблоко.webp', {
      category: 'health', recipeFamily: 'gigantism', health: 20, minConveyor: 1, requiresMutation: 'gigantism',
      description: 'Открывает ультраформу «Гигантизм»: огромный слайм с уроном 3 на 3 секунды.'
    }],

    ['common', 'fuseCoals', 'Фитильные угольки', 'Огненная/Съедобные угольки.webp', {
      category: 'damage', recipeFamily: 'blast', damage: 10, minConveyor: 1, requiresMutation: 'explosion',
      description: 'Каждый 10-й разрушенный блок вызывает взрыв с 1 уроном.'
    }],
    ['rare', 'volcanicShake', 'Вулканический коктейль', 'Огненная/Вулканический напиток.webp', {
      category: 'damage', recipeFamily: 'blast', damage: 20, minConveyor: 1, requiresMutation: 'explosion',
      description: 'Взрыв срабатывает на каждом 8-м блоке и наносит 2 урона.'
    }],
    ['special', 'chocolateBoom', 'Шоколадный бум', 'Сладости/Шоколадный бум.webp', {
      category: 'health', recipeFamily: 'blast', health: 20, minConveyor: 1, requiresMutation: 'explosion',
      description: 'Открывает ультраформу «Цепная реакция» на 3 секунды.'
    }],

    ['common', 'cloudCandy', 'Облачная вата', 'Общий пул/Сладкая вата.webp', {
      category: 'shield', recipeFamily: 'wind', shield: 10, minConveyor: 1, requiresMutation: 'wind',
      description: 'Каждый отскок ускоряет слайма.'
    }],
    ['rare', 'whirlwindFries', 'Вихревой картофель', 'Общий пул/Картофель фри.webp', {
      category: 'damage', recipeFamily: 'wind', damage: 20, minConveyor: 1, requiresMutation: 'wind',
      description: 'Сильный разгон превращается в воздушный рывок, пробивающий 3 блока.'
    }],
    ['special', 'stormCappuccino', 'Штормовой капучино', 'Общий пул/Чашечка Капучино.webp', {
      category: 'damage', recipeFamily: 'wind', damage: 20, minConveyor: 1, requiresMutation: 'wind',
      description: 'Открывает ультраформу — управляемое торнадо на 3 секунды.'
    }]
  ];

  window.SLIME_FOOD_CATALOG = CARDS.map(([rarity, id, name, relativePath, stats]) => ({
    id,
    name,
    icon: iconFor(stats.category),
    rarity,
    minConveyor: MIN_CONVEYOR[rarity],
    image: relativePath.startsWith('assets/') ? relativePath : `${ROOT}/${relativePath}`,
    statVersion: 4,
    ...stats
  }));

  window.SLIME_FOOD_EFFECTS = [
    { id: '', label: 'Без особого эффекта' },
    { id: 'medkitBoost', label: 'Аптечки сильнее' },
    { id: 'breakHealEveryFive', label: 'Лечение за каждый 5-й блок' },
    { id: 'shieldActivationHeal', label: 'Лечение при активации щита' },
    { id: 'lowHealthDamage', label: 'Урон при низком здоровье' },
    { id: 'bouncePower', label: 'Усиление следующего удара после отскока' },
    { id: 'shieldDamageBoost', label: 'Урон во время щита' },
    { id: 'shieldDamageToHealth', label: 'Урон превращается в здоровье во время щита' },
    { id: 'shieldEndExplosion', label: 'Взрыв после окончания щита' },
    { id: 'gravitySwitch', label: 'Переключение гравитации вверх и вниз' },
    { id: 'edgePortals', label: 'Сквозные порталы на боковых границах' },
    { id: 'blockGrowth', label: 'Рост за разрушенные блоки' },
    { id: 'pandoraChaos', label: 'Ящики Пандоры со случайными эффектами' },
    { id: 'slimeSplinters', label: 'Три маленьких слайма после опасного урона' }
  ];
})();
