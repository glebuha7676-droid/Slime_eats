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
    ['pocketGalaxy', 'Карманная галактика', 'assets/ui/recipe-categories/emblem-v2-cosmos.webp', 'cosmos', 'cosmos'],
    ['nanoChip', 'Нано-чип', 'assets/ui/recipe-categories/emblem-v2-nano.webp', 'nano', 'nano'],
    ['nanoCore', 'Нано-ядро', 'assets/ui/recipe-categories/emblem-v2-nano.webp', 'nano', 'nano'],
    ['nanoModule', 'Нано-модуль', 'assets/ui/recipe-categories/emblem-v2-nano.webp', 'nano', 'nano'],
    ['telekinesisStone', 'Парящий камень', 'assets/ui/recipe-categories/emblem-v2-telekinesis.webp', 'telekinesis', 'telekinesis'],
    ['telekinesisShard', 'Осколок мысли', 'assets/ui/recipe-categories/emblem-v2-telekinesis.webp', 'telekinesis', 'telekinesis'],
    ['telekinesisCore', 'Ядро телекинеза', 'assets/ui/recipe-categories/emblem-v2-telekinesis.webp', 'telekinesis', 'telekinesis'],
    ['cloneDrop', 'Капля-копия', 'assets/ui/recipe-categories/emblem-v2-cloning.webp', 'cloning', 'cloning'],
    ['cloneJelly', 'Желе-двойник', 'assets/ui/recipe-categories/emblem-v2-cloning.webp', 'cloning', 'cloning'],
    ['cloneSeed', 'Семя клона', 'assets/ui/recipe-categories/emblem-v2-cloning.webp', 'cloning', 'cloning'],
    ['fuseCoals', 'Фитильные угольки', 'Огненная/Съедобные угольки.webp', 'blast', 'explosion'],
    ['volcanicShake', 'Вулканический коктейль', 'Огненная/Вулканический напиток.webp', 'blast', 'explosion'],
    ['chocolateBoom', 'Шоколадный бум', 'Сладости/Шоколадный бум.webp', 'blast', 'explosion']
  ];

  window.SLIME_FOOD_CATALOG = foods.map(([id, name, relativePath, recipeFamily, requiresMutation]) => ({
    id,
    name,
    recipeFamily,
    image: relativePath.startsWith('assets/') ? relativePath : `${ROOT}/${relativePath}`,
    ...(requiresMutation ? { requiresMutation } : {})
  }));
})();
