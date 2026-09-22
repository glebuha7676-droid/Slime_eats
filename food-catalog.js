(() => {
  'use strict';

  const ROOT = 'assets/ЕДА';
  const foods = [
    ['watermelon', 'Арбуз', 'Общий пул/Арбуз.webp', 'electric'],
    ['bigBurger', 'Большой бургер', 'Общий пул/Большой бургер.webp', 'electric'],
    ['mochi', 'Моти', 'Общий пул/Моти.webp', 'electric'],
    ['hotDog', 'Хот-дог', 'Общий пул/хот Дог.webp', 'fire'],
    ['flamingPopcorn', 'Пламенный попкорн', 'Огненная/Пламенный попкорн.webp', 'fire'],
    ['lavaDessert', 'Лавовый десерт', 'Огненная/Лавовый десерт.webp', 'fire'],
    ['absoluteZero', 'Абсолютный ноль', 'Морозная/Абсолютный ноль.webp', 'ice'],
    ['doublePopsicle', 'Двойное эскимо', 'Морозная/Двойное эскимо.webp', 'ice'],
    ['lollipops', 'Леденцы', 'Общий пул/Леденцы.webp', 'ice'],
    ['antiGravityBun', 'Булочка невесомости', 'Общий пул/Очень воздушная булочка.webp', 'cosmos', 'cosmos'],
    ['cometCola', 'Кометная кола', 'Общий пул/Злая кола.webp', 'cosmos', 'cosmos'],
    ['pocketGalaxy', 'Карманная галактика', 'assets/ui/recipe-categories/emblem-v2-cosmos.png', 'cosmos', 'cosmos'],
    ['giantLoaf', 'Буханка великана', 'Общий пул/Буханка.webp', 'gigantism', 'gigantism'],
    ['bottomlessBreakfast', 'Бездонный завтрак', 'Общий пул/Королевский завтрак.webp', 'gigantism', 'gigantism'],
    ['titanApple', 'Яблоко титана', 'Общий пул/Зачарованное яблоко.webp', 'gigantism', 'gigantism'],
    ['fuseCoals', 'Фитильные угольки', 'Огненная/Съедобные угольки.webp', 'blast', 'explosion'],
    ['volcanicShake', 'Вулканический коктейль', 'Огненная/Вулканический напиток.webp', 'blast', 'explosion'],
    ['chocolateBoom', 'Шоколадный бум', 'Сладости/Шоколадный бум.webp', 'blast', 'explosion'],
    ['cloudCandy', 'Облачная вата', 'Общий пул/Сладкая вата.webp', 'wind', 'wind'],
    ['whirlwindFries', 'Вихревой картофель', 'Общий пул/Картофель фри.webp', 'wind', 'wind'],
    ['stormCappuccino', 'Штормовой капучино', 'Общий пул/Чашечка Капучино.webp', 'wind', 'wind']
  ];

  window.SLIME_FOOD_CATALOG = foods.map(([id, name, relativePath, recipeFamily, requiresMutation]) => ({
    id,
    name,
    recipeFamily,
    image: relativePath.startsWith('assets/') ? relativePath : `${ROOT}/${relativePath}`,
    ...(requiresMutation ? { requiresMutation } : {})
  }));
})();
