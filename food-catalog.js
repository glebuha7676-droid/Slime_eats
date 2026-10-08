(() => {
  'use strict';

  const ROOT = 'assets/ЕДА';
  const foods = [
    ['watermelon', 'Энергетик', 'Новая/Электро/01-energy-can-lossless.webp', 'electric', null, 1],
    ['bigBurger', 'Электроконфеты', 'Новая/Электро/02-candy-lossless.webp', 'electric', null, 2],
    ['mochi', 'Электролапша', 'Новая/Электро/03-noodles-lossless.webp', 'electric', null, 3],
    ['hotDog', 'Огненные ягоды', 'Новая/Огненная/01-berries-lossless.webp', 'fire', null, 1],
    ['flamingPopcorn', 'Пламенный перец', 'Новая/Огненная/02-pepper-lossless.webp', 'fire', null, 2],
    ['lavaDessert', 'Огненный рамен', 'Новая/Огненная/03-ramen-lossless.webp', 'fire', null, 3],
    ['absoluteZero', 'Ледяное эскимо', 'Новая/Морозная/01-popsicle-lossless.webp', 'ice', null, 1],
    ['doublePopsicle', 'Ледяная крошка', 'Новая/Морозная/02-shaved-ice-lossless.webp', 'ice', null, 2],
    ['lollipops', 'Замёрзшие ягоды', 'Новая/Морозная/03-berries-lossless.webp', 'ice', null, 3],
    ['antiGravityBun', 'Планетные конфеты', 'Новая/Космос/01-planet-candy-lossless.webp', 'cosmos', 'cosmos', 1],
    ['cometCola', 'Звёздные конфеты', 'Новая/Космос/02-star-candy-lossless.webp', 'cosmos', 'cosmos', 2],
    ['pocketGalaxy', 'Галактическое желе', 'Новая/Космос/03-galaxy-jelly-lossless.webp', 'cosmos', 'cosmos', 3],
    ['nanoChip', 'Механическая закуска', 'Новая/Техно/01-mechanical-snack-lossless.webp', 'nano', 'nano', 1],
    ['nanoCore', 'Техносуп', 'Новая/Техно/02-circuit-soup-lossless.webp', 'nano', 'nano', 2],
    ['nanoModule', 'Технодесерт', 'Новая/Техно/03-tech-dessert-lossless.webp', 'nano', 'nano', 3],
    ['telekinesisStone', 'Псионические кристаллы', 'Новая/Псионика/01-crystal-sweets-lossless.webp', 'telekinesis', 'telekinesis', 1],
    ['telekinesisShard', 'Пси-пончик', 'Новая/Псионика/02-psionic-donut-lossless.webp', 'telekinesis', 'telekinesis', 2],
    ['telekinesisCore', 'Псионический эликсир', 'Новая/Псионика/03-psionic-potion-lossless.webp', 'telekinesis', 'telekinesis', 3],
    ['cloneDrop', 'Грибная закуска', 'Новая/Споры/01-mushrooms-lossless.webp', 'cloning', 'cloning', 1],
    ['cloneJelly', 'Грибной торт', 'Новая/Споры/02-mushroom-cake-lossless.webp', 'cloning', 'cloning', 2],
    ['cloneSeed', 'Грибной напиток', 'Новая/Споры/03-spore-drink-lossless.webp', 'cloning', 'cloning', 3],
    ['phantomMist', 'Призрачная эссенция', 'Новая/Фантом/01-ghost-essence-lossless.webp', 'phantom', 'phantom', 1],
    ['phantomDrop', 'Суп с духами', 'Новая/Фантом/02-ghost-soup-lossless.webp', 'phantom', 'phantom', 2],
    ['phantomEssence', 'Фантомный плод', 'Новая/Фантом/03-ghost-fruit-lossless.webp', 'phantom', 'phantom', 3],
    ['glitchPixel', 'Глитч-бургер', 'Новая/Глитч/01-glitch-burger-lossless.webp', 'glitch', 'glitch', 1],
    ['glitchByte', 'Глитч-суши', 'Новая/Глитч/02-glitch-sushi-lossless.webp', 'glitch', 'glitch', 2],
    ['glitchCore', 'Глитч-морковка', 'Новая/Глитч/03-glitch-carrot-lossless.webp', 'glitch', 'glitch', 3],
    ['fuseCoals', 'Фитильные угольки', 'Огненная/Съедобные угольки.webp', 'blast', 'explosion', 1],
    ['volcanicShake', 'Вулканический коктейль', 'Огненная/Вулканический напиток.webp', 'blast', 'explosion', 2],
    ['chocolateBoom', 'Шоколадный бум', 'Сладости/Шоколадный бум.webp', 'blast', 'explosion', 3]
  ];

  window.SLIME_FOOD_CATALOG = foods.map(([id, name, relativePath, recipeFamily, requiresMutation, stage]) => ({
    id,
    name,
    recipeFamily,
    image: relativePath.startsWith('assets/') ? relativePath : `${ROOT}/${relativePath}`,
    ...(requiresMutation ? { requiresMutation } : {}),
    ...(stage ? { stage } : {})
  }));
})();
