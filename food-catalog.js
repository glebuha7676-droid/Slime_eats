(() => {
  'use strict';

  const ROOT = 'assets/ЕДА';
  const MIN_CONVEYOR = { common: 1, rare: 2, epic: 3, special: 1, secret: 1 };
  const iconFor = category => ({ health: '🍔', damage: '⚡', shield: '🛡️' })[category] || '🍽️';

  // Единственный актуальный набор: 3 обычных, 9 редких, 6 эпических,
  // 6 особых и первые 5 из будущих 8 секретных карт.
  // Положительные характеристики выводятся внизу карточки; цена сильных
  // карт остаётся только в описании и применяется при старте забега.
  const CARDS = [
    ['common', 'watermelon', 'Арбуз', 'Общий пул/Арбуз.webp', { category: 'damage', damage: 10 }],
    ['common', 'grandmaPastry', 'Бабушкина стрепня', 'Общий пул/Бабушкина стрепня.webp', { category: 'shield', shield: 10 }],
    ['common', 'pancakes', 'Блинчики', 'Общий пул/Блинчики.webp', { category: 'health', health: 20 }],

    ['rare', 'bigBurger', 'Большой бургер', 'Общий пул/Большой бургер.webp', { category: 'damage', damage: 20 }],
    ['rare', 'happyCupcake', 'Весёлый кекс', 'Общий пул/Весёлый кекс.webp', { category: 'shield', shield: 20 }],
    ['rare', 'tastySushi', 'Вкусные суши', 'Общий пул/Вкусные суши.webp', { category: 'health', health: 40 }],
    ['rare', 'perfectPizza', 'Идеальная пицца', 'Общий пул/Идеальная пицца.webp', { category: 'damage', damage: 15, shield: 5 }],
    ['rare', 'hotDog', 'Хот-дог', 'Общий пул/хот Дог.webp', { category: 'damage', damage: 15, health: 10 }],
    ['rare', 'pedigreeYeast', 'Породистое дрожже', 'Природная/Породистое дрожже.webp', { category: 'shield', shield: 15, damage: 5 }],
    ['rare', 'absoluteZero', 'Абсолютный ноль', 'Морозная/Абсолютный ноль.webp', { category: 'shield', shield: 15, health: 10 }],
    ['rare', 'gingerbreadMan', 'Пряничный человечек', 'Сладости/Пряничный человечек.webp', { category: 'health', health: 20, damage: 5 }],
    ['rare', 'flamingPopcorn', 'Пламенный попкорн', 'Огненная/Пламенный попкорн.webp', { category: 'health', health: 20, shield: 5 }],

    ['epic', 'butter', 'Масло', 'Общий пул/Масло.webp', { category: 'health', health: 100, shieldPenalty: 20, description: 'Но −20 щита.' }],
    ['epic', 'mochi', 'Моти', 'Общий пул/Моти.webp', { category: 'damage', damage: 50, healthPenalty: 40, description: 'Но −40 здоровья.' }],
    ['epic', 'spaghetti', 'Спагетти', 'Общий пул/Спагетти.webp', { category: 'shield', shield: 50, damagePenalty: 20, description: 'Но −20 урона.' }],
    ['special', 'fruitPlate', 'Фруктовая тарелка', 'Общий пул/Фруктовая тарелка.webp', { category: 'health', health: 20, effect: 'medkitBoost', description: 'Аптечки лечат на 10 больше.' }],
    ['special', 'churros', 'Чуррос', 'Общий пул/Чуррос.webp', { category: 'damage', damage: 10, effect: 'breakHealEveryFive', description: 'Каждый 5-й сломанный блок лечит на 5 здоровья.' }],
    ['special', 'sweetRoots', 'Сладкие корни', 'Природная/Сладкие корни.webp', { category: 'health', health: 10, effect: 'shieldActivationHeal', description: 'При активации щита лечит на 20 здоровья.' }],
    ['special', 'doublePopsicle', 'Двойное эскимо', 'Морозная/Двойное эскимо.webp', { category: 'health', health: 20, effect: 'lowHealthDamage', description: 'При здоровье ниже 50%: +15 урона.' }],
    ['special', 'royalPudding', 'Королевский пудинг', 'Сладости/Королевский пудинг.webp', { category: 'damage', damage: 10, effect: 'bouncePower', description: 'После отскока следующий удар: +30 урона.' }],
    ['special', 'lavaDessert', 'Лавовый десерт', 'Огненная/Лавовый десерт.webp', { category: 'shield', shield: 10, effect: 'shieldDamageBoost', description: 'Во время активного щита: +25 урона.' }],
    ['epic', 'royalBreakfast', 'Королевский завтрак', 'Общий пул/Королевский завтрак.webp', { category: 'health', health: 5, effect: 'shieldDamageToHealth', description: 'Во время щита полученный урон превращается в здоровье.' }],
    ['epic', 'catCake', 'Кото пирожное', 'Общий пул/Кото пирожное.webp', { category: 'damage', damage: 10, effect: 'shieldEndExplosion', description: 'Когда щит заканчивается, взрыв наносит 40% урона.' }],
    ['epic', 'lollipops', 'Леденцы', 'Общий пул/Леденцы.webp', { category: 'shield', shield: 10, shieldCharges: 1 }],

    ['secret', 'antiGravityBun', 'Булочка невесомости', 'Общий пул/Очень воздушная булочка.webp', {
      category: 'secret', effect: 'gravitySwitch',
      description: 'Вверх и вниз переключают направление гравитации.'
    }],
    ['secret', 'portalCake', 'Портальный торт', 'Общий пул/Пиксельный торт.webp', {
      category: 'secret', effect: 'edgePortals',
      description: 'Левая и правая границы становятся сквозными порталами.'
    }],
    ['secret', 'giantApple', 'Яблоко великана', 'Общий пул/Зачарованное яблоко.webp', {
      category: 'secret', effect: 'blockGrowth',
      description: 'Каждый сломанный блок увеличивает слайма. Полученный урон сбрасывает размер. Обычные блоки безопасны.'
    }],
    ['secret', 'pandoraBox', 'Ящик Пандоры', 'Общий пул/Ящик Пандоры.webp', {
      category: 'secret', effect: 'pandoraChaos',
      description: 'В мире появляются радужные ящики со случайными эффектами.'
    }],
    ['secret', 'gummyFlock', 'Мармеладная стая', 'Сладости/Мармеладные червячки.webp', {
      category: 'secret', effect: 'slimeSplinters',
      description: 'Урон от опасного блока замедляет время и создаёт 3 маленьких слайма с 10 здоровья и неуязвимостью на 2 секунды.'
    }]
  ];

  window.SLIME_FOOD_CATALOG = CARDS.map(([rarity, id, name, relativePath, stats]) => ({
    id,
    name,
    icon: iconFor(stats.category),
    rarity,
    minConveyor: MIN_CONVEYOR[rarity],
    image: `${ROOT}/${relativePath}`,
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
