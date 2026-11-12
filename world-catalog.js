(() => {
  'use strict';
  const WORLD1_ASSETS = {
    'dirt-grass': 'assets/world1/slime-blocks-v6/block-fragile-porous-v10.webp',
    'ground-weak': 'assets/world1/slime-blocks-v6/block-fragile-porous-v10.webp',
    'stone': 'assets/world1/slime-blocks-v6/block-normal.webp',
    'stone-reinforced': 'assets/world1/slime-blocks-v6/block-strong.webp',
    'ground-weak-liquid': 'assets/ui/mutation-organic-v29/infection-1.webp',
    'stone-liquid': 'assets/ui/mutation-organic-v29/infection-3.webp',
    'stone-reinforced-liquid': 'assets/ui/mutation-growth-v24/infection-5.webp',
    'stone-hazard': 'assets/hazards/thorns-red-v2/static-v3.webp',
    'dynamite': 'assets/Мир 1/Динамит.webp',
    'spring': 'assets/Мир 1/Пружина.webp',
    'heal': 'assets/ui/blocks/heart-stone-v1.webp',
    'portal': 'assets/ui/portals/world-1.webp'
  };
  const WORLD2_ASSETS = {
    // Legacy slot 2 supplies frost transformation sprites, not a playable world.
    'snow-packed': 'assets/ui/blocks/frost-snow-front-v1.webp',
    'snowflake': 'assets/Мир 2/Заморозка.webp'
  };
  const WORLD3_ASSETS = {
    'candy-light': 'assets/world3/candy-blocks-v2/cracker-fragile.webp',
    'cookie-packed': 'assets/world3/candy-blocks-v2/cracker-fragile.webp',
    'candy-normal': 'assets/world3/candy-blocks-v1/chocolate-normal.webp',
    'candy-reinforced': 'assets/world3/candy-blocks-v2/caramel-strong.webp',
    'candy-hazard': 'assets/Мир 3/опасный блок.webp',
    'heal': 'assets/ui/blocks/heart-stone-v1.webp',
    'portal': 'assets/ui/portals/world-3.webp'
  };
  const WORLD4_ASSETS = {
    'ash': 'assets/world4/rounded-blocks-v4/magma-fragile.webp',
    'volcanic-earth': 'assets/world4/rounded-blocks-v4/magma-normal.webp',
    'basalt': 'assets/world4/rounded-blocks-v4/magma-strong.webp',
    'lava-hazard': 'assets/Мир 4/Опасный блок.webp',
    'geyser': 'assets/Мир 4/Гейзер-заметный.webp',
    'meteor': 'assets/Мир 4/Метеорит.webp',
    'heal': 'assets/ui/blocks/heart-stone-v1.webp',
    'portal': 'assets/ui/portals/world-4.webp'
  };
  const assetSource = (worldId, sprite) => {
    if (+worldId === 6 && ['dirt-grass','ground-weak','stone','stone-reinforced'].includes(sprite)) return 'assets/world6/asteroid-blocks-v26/'+(sprite==='stone-reinforced'?'block-strong':sprite==='stone'?'block-normal':'block-fragile')+'.webp';
    if (+worldId === 6 && WORLD1_ASSETS[sprite]) return WORLD1_ASSETS[sprite];
    if (+worldId !== 2 && ['stone-hazard', 'ground-weak-liquid', 'stone-liquid', 'stone-reinforced-liquid'].includes(sprite)) return WORLD1_ASSETS[sprite];
    if (+worldId === 5) {
      const sky = { sand: 'sky-fragile', sandstone: 'sky-normal', 'desert-bedrock': 'sky-strong' };
      if (sky[sprite]) return `assets/world5/rounded-blocks-v4/${sky[sprite]}.webp`;
      if (WORLD1_ASSETS[sprite]) return WORLD1_ASSETS[sprite];
    }
    if (+worldId === 1 && WORLD1_ASSETS[sprite]) return WORLD1_ASSETS[sprite];
    if (+worldId === 2 && WORLD2_ASSETS[sprite]) return WORLD2_ASSETS[sprite];
    if (+worldId === 3 && WORLD3_ASSETS[sprite]) return WORLD3_ASSETS[sprite];
    if (+worldId === 4 && WORLD4_ASSETS[sprite]) return WORLD4_ASSETS[sprite];
    return `assets/world${worldId}/${sprite}.webp`;
  };
  const block = (id, label, type, sprite, extra = {}) => ({ id, label, type, sprite, hp: 1, x: 0, y: 0, scale: 1, ...extra });
  const level = (depth, enabled) => ({ depth, enabled, weights: { soft: 0, dense: 48, hard: 42, reinforced: 4, hazard: 5, bomb: 4, spring: 3, heal: 3, cryo: 3, snowflake: 3, jelly: 6, geyser: 3, meteor: 3 } });
  const blocksFor = id => {
    if (id === 5) return [
      block('dense', 'Облако · хрупкое', 'dense', 'sand'),
      block('hard', 'Небесная порода · обычная', 'hard', 'sandstone'),
      block('reinforced', 'Золото · прочный', 'reinforced', 'desert-bedrock'),
      block('hazard', 'Колючая опасность · временный образ', 'hazard', 'stone-hazard'),
      block('heal', 'Восполнение силы', 'gel', 'heal')
    ];
    const ice = id === 2, candy = id === 3, volcano = id === 4;
    if (volcano) return [
      block('dense', 'Красный камень · хрупкий', 'dense', 'ash'),
      block('hard', 'Камень · обычный', 'hard', 'volcanic-earth'),
      block('reinforced', 'Базальт · прочный', 'reinforced', 'basalt'),
      block('hazard', 'Колючий враг', 'hazard', 'stone-hazard'),
      block('heal', 'Восполнение силы', 'gel', 'heal', { hp: .44 })
    ];
    return [
      ...(!ice ? [block('soft', candy ? 'Верхний сладкий декор' : 'Мягкий слайм · верхний ряд', 'soft', candy ? 'candy-light' : 'dirt-grass')] : []),
      block('dense', ice ? 'Непрочный лёд' : candy ? 'Вафля · непрочная' : 'Мягкий слайм · хрупкий', 'dense', ice ? 'snow-packed' : candy ? 'cookie-packed' : 'ground-weak'),
      block('hard', ice ? 'Обычный лёд' : candy ? 'Шоколад · обычный' : 'Окаменелая слизь · обычная', 'hard', ice ? 'glacier' : candy ? 'candy-normal' : 'stone'),
      block('reinforced', ice ? 'Прочный лёд' : candy ? 'Ягодный леденец · прочный' : 'Слизневый кварц · прочный', 'reinforced', ice ? 'ice-reinforced' : candy ? 'candy-reinforced' : 'stone-reinforced'),
      block('hazard', ice ? 'Ледяные шипы' : 'Колючий враг', 'hazard', ice ? 'ice-spikes' : 'stone-hazard', { hp: 1.2 }),
      ...(candy ? [] : !ice && id !== 1 ? [
        block('bomb', 'Динамит', 'bomb', 'dynamite', { hp: .68, explosionRadius: 125 })
      ] : !ice ? [] : [
        block('cryo', 'Крио-блок', 'cryo', 'cryo', { hp: 1 })
      ]),
      block('heal', 'Лечебный блок', 'gel', 'heal', { hp: .44 }),
    ];
  };
  const enabledForLevel = (worldId, index) => {
    if ([1, 3, 4, 5, 6].includes(worldId)) return ['soft', 'dense', 'hard', 'reinforced', 'hazard', 'heal'];
    if (worldId === 5) return ['dense', 'hard', 'reinforced', 'hazard', 'heal'];
    if (worldId === 1) return ['soft', 'dense', 'hard', 'reinforced', 'hazard', 'heal'];
    if (worldId === 2) {
      return ['dense', 'hard', 'reinforced', 'hazard', 'cryo', 'freezeZone', 'heal'];
    }
    if (worldId === 3) {
      const enabled = ['soft','dense','hard','reinforced','hazard','heal'];
      if (index >= 1) enabled.push('hard');
      if (index >= 2) enabled.push('reinforced');
      return enabled;
    }
    if (worldId === 4) {
      const enabled = ['dense','hard','hazard','geyser','meteor','heal'];
      if (index >= 1) enabled.push('reinforced');
      return enabled;
    }
    if (index === 0) return ['soft','dense','hazard'];
    if (index === 1) return ['soft','dense','hazard','bomb'];
    if (index === 2) return ['soft','dense','hard','hazard','bomb','heal'];
    return ['soft','dense','hard','reinforced','bomb','heal','hazard'];
  };
  const world = (id, name, accent, top, bottom, depths) => ({ id, name, accent, background: { top, bottom, image: '', x: 0, y: 0, scale: 1 }, levels: depths.map((depth, index) => level(depth, enabledForLevel(id, index))), blocks: blocksFor(id) });
  const builtInDefaults = () => ({ version: 16, worlds: [world(1,'Каменные глубины','#54d7b0','#63825b','#171c20',[500,500,500,500,500]), world(3,'Конфетная фабрика','#f472b6','#8f4b82','#21142d',[500,500,500,500,500]), world(4,'Магмовое ядро','#fb7185','#7d3426','#1b1112',[500,500,500,500,500]), world(6,'Очаг аномалии','#b2ef44','#352044','#160e26',[500,500,500,500,500]), world(5,'Небесный мир','#edcf78','#686699','#24273d',[500,500,500,500,500])] });
  const defaults = () => builtInDefaults();
  const load = () => defaults();
  window.SlimeWorldCatalog = Object.freeze({ defaults, load, assetSource });
})();
