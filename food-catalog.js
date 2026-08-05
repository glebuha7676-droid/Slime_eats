(() => {
  'use strict';

  // Базовый каталог еды. Редактор карточек использует этот же массив как стартовую базу.
  window.SLIME_FOOD_CATALOG = [
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

  window.SLIME_FOOD_EFFECTS = [
    { id: '', label: 'Без особого эффекта' },
    { id: 'smallRevive', label: 'Малое возрождение' },
    { id: 'rainbow', label: 'Радужный бонус' },
    { id: 'momentum', label: 'Сохранение разгона' },
    { id: 'dragonBlast', label: 'Драконий взрыв' },
    { id: 'freeBounces', label: 'Бесплатные рикошеты' },
    { id: 'chargeBoost', label: 'Ускоренная зарядка' },
    { id: 'oreHeal', label: 'Лечение от руды' },
    { id: 'cooldownCut', label: 'Короткая перезарядка' },
    { id: 'softLanding', label: 'Мягкое приземление' },
    { id: 'healBoost', label: 'Усиление лечения' },
    { id: 'bombPull', label: 'Притяжение взрывов' },
    { id: 'prismFlow', label: 'Призматический бонус' },
    { id: 'voidBreaker', label: 'Пробой Пустоты' },
    { id: 'rainbowHeart', label: 'Сердце Радуги' }
  ];
})();
