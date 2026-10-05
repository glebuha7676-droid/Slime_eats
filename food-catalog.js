(() => {
  'use strict';

  const ROOT = 'assets/ЕДА';
  const foods = [
    ['watermelon', 'Энергетик', 'Новая/Электро/01-energy-can.png', 'electric', null, 1],
    ['bigBurger', 'Электроконфеты', 'Новая/Электро/02-candy.png', 'electric', null, 2],
    ['mochi', 'Электролапша', 'Новая/Электро/03-noodles.png', 'electric', null, 3],
    ['hotDog', 'Огненные ягоды', 'Новая/Огненная/01-berries.png', 'fire', null, 1],
    ['flamingPopcorn', 'Пламенный перец', 'Новая/Огненная/02-pepper.png', 'fire', null, 2],
    ['lavaDessert', 'Огненный рамен', 'Новая/Огненная/03-ramen.png', 'fire', null, 3],
    ['absoluteZero', 'Ледяное эскимо', 'Новая/Морозная/01-popsicle.png', 'ice', null, 1],
    ['doublePopsicle', 'Ледяная крошка', 'Новая/Морозная/02-shaved-ice.png', 'ice', null, 2],
    ['lollipops', 'Замёрзшие ягоды', 'Новая/Морозная/03-berries.png', 'ice', null, 3],
    ['antiGravityBun', 'Планетные конфеты', 'Новая/Космос/01-planet-candy.png', 'cosmos', 'cosmos', 1],
    ['cometCola', 'Звёздные конфеты', 'Новая/Космос/02-star-candy.png', 'cosmos', 'cosmos', 2],
    ['pocketGalaxy', 'Галактическое желе', 'Новая/Космос/03-galaxy-jelly.png', 'cosmos', 'cosmos', 3],
    ['nanoChip', 'Механическая закуска', 'Новая/Техно/01-mechanical-snack.png', 'nano', 'nano', 1],
    ['nanoCore', 'Техносуп', 'Новая/Техно/02-circuit-soup.png', 'nano', 'nano', 2],
    ['nanoModule', 'Технодесерт', 'Новая/Техно/03-tech-dessert.png', 'nano', 'nano', 3],
    ['telekinesisStone', 'Псионические кристаллы', 'Новая/Псионика/01-crystal-sweets.png', 'telekinesis', 'telekinesis', 1],
    ['telekinesisShard', 'Пси-пончик', 'Новая/Псионика/02-psionic-donut.png', 'telekinesis', 'telekinesis', 2],
    ['telekinesisCore', 'Псионический эликсир', 'Новая/Псионика/03-psionic-potion.png', 'telekinesis', 'telekinesis', 3],
    ['cloneDrop', 'Грибная закуска', 'Новая/Споры/01-mushrooms.png', 'cloning', 'cloning', 1],
    ['cloneJelly', 'Грибной торт', 'Новая/Споры/02-mushroom-cake.png', 'cloning', 'cloning', 2],
    ['cloneSeed', 'Грибной напиток', 'Новая/Споры/03-spore-drink.png', 'cloning', 'cloning', 3],
    ['phantomMist', 'Призрачная эссенция', 'Новая/Фантом/01-ghost-essence.png', 'phantom', 'phantom', 1],
    ['phantomDrop', 'Суп с духами', 'Новая/Фантом/02-ghost-soup.png', 'phantom', 'phantom', 2],
    ['phantomEssence', 'Фантомный плод', 'Новая/Фантом/03-ghost-fruit.png', 'phantom', 'phantom', 3],
    ['glitchPixel', 'Глитч-бургер', 'Новая/Глитч/01-glitch-burger.png', 'glitch', 'glitch', 1],
    ['glitchByte', 'Глитч-суши', 'Новая/Глитч/02-glitch-sushi.png', 'glitch', 'glitch', 2],
    ['glitchCore', 'Глитч-морковка', 'Новая/Глитч/03-glitch-carrot.png', 'glitch', 'glitch', 3],
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
