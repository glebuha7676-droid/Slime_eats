(() => {
  'use strict';
  const WORLD1_ASSETS = {
    'dirt-grass': 'assets/Мир 1/Трава (непрочный блок).webp',
    'ground-weak': 'assets/Мир 1/непрочный блок.webp',
    'stone': 'assets/Мир 1/Обычный блок.webp',
    'stone-reinforced': 'assets/Мир 1/Прочный блок.webp',
    'stone-hazard': 'assets/Мир 1/Опасный блок.webp',
    'dynamite': 'assets/Мир 1/Динамит.webp',
    'spring': 'assets/Мир 1/Пружина.webp',
    'heal': 'assets/Мир 1/Аптечка.webp',
    'portal': 'assets/ui/portals/world-1.webp'
  };
  const WORLD2_ASSETS = {
    'ice-light': 'assets/Мир 2/Непрочный блок.webp',
    'snow-packed': 'assets/Мир 2/Непрочный блок.webp',
    'glacier': 'assets/Мир 2/Обычный блок.webp',
    'ice-reinforced': 'assets/Мир 2/Прочный блок.webp',
    'ice-shards': 'assets/Мир 2/Опасный блок.webp',
    'ice-spikes': 'assets/Мир 2/Опасный блок.webp',
    'cryo': 'assets/Мир 2/Крио блок.webp',
    'snowflake': 'assets/Мир 2/Заморозка.webp',
    'heal': 'assets/Мир 2/Аптечка.webp',
    'portal': 'assets/ui/portals/world-2.webp'
  };
  const WORLD3_ASSETS = {
    'candy-light': 'assets/Мир 3/Непрочный блок.webp',
    'cookie-packed': 'assets/Мир 3/Непрочный блок.webp',
    'candy-normal': 'assets/Мир 3/обычный блок.webp',
    'candy-reinforced': 'assets/Мир 3/Прочный блок.webp',
    'candy-hazard': 'assets/Мир 3/опасный блок.webp',
    'jelly-bounce': 'assets/Мир 3/Желейка.webp',
    'heal': 'assets/Мир 3/Хилка.webp',
    'portal': 'assets/ui/portals/world-3.webp'
  };
  const WORLD4_ASSETS = {
    'ash': 'assets/Мир 4/Непрочный блок.webp',
    'volcanic-earth': 'assets/Мир 4/Обычный блок.webp',
    'basalt': 'assets/Мир 4/Прочный блок.webp',
    'lava-hazard': 'assets/Мир 4/Опасный блок.webp',
    'geyser': 'assets/Мир 4/Гейзер-заметный.webp',
    'meteor': 'assets/Мир 4/Метеорит.webp',
    'heal': 'assets/Мир 4/Аптечка.webp',
    'portal': 'assets/ui/portals/world-4.webp'
  };
  const assetSource = (worldId, sprite) => {
    if (+worldId === 1 && WORLD1_ASSETS[sprite]) return WORLD1_ASSETS[sprite];
    if (+worldId === 2 && WORLD2_ASSETS[sprite]) return WORLD2_ASSETS[sprite];
    if (+worldId === 3 && WORLD3_ASSETS[sprite]) return WORLD3_ASSETS[sprite];
    if (+worldId === 4 && WORLD4_ASSETS[sprite]) return WORLD4_ASSETS[sprite];
    return `assets/world${worldId}/${sprite}.webp`;
  };
  const block = (id, label, type, sprite, extra = {}) => ({ id, label, type, sprite, hp: 1, x: 0, y: 0, scale: 1, ...extra });
  const level = (depth, enabled) => ({ depth, enabled, weights: { soft: 0, dense: 48, hard: 42, reinforced: 4, hazard: 5, bomb: 4, spring: 3, heal: 3, cryo: 3, snowflake: 3, jelly: 6, geyser: 3, meteor: 3 } });
  const blocksFor = id => {
    const ice = id === 2, candy = id === 3, volcano = id === 4;
    if (volcano) return [
      block('dense', 'Вулканический пепел · непрочный', 'dense', 'ash'),
      block('hard', 'Вулканическая земля · обычная', 'hard', 'volcanic-earth'),
      block('reinforced', 'Базальт · прочный', 'reinforced', 'basalt'),
      block('hazard', 'Лава · опасный блок', 'hazard', 'lava-hazard', { hp: 1.2 }),
      block('geyser', 'Вулканический гейзер', 'geyser', 'geyser', { hp: 1 }),
      block('meteor', 'Метеоритный блок', 'meteor', 'meteor', { hp: 1 }),
      block('heal', 'Вулканическая аптечка', 'gel', 'heal', { hp: .44 })
    ];
    return [
      ...(!ice ? [block('soft', candy ? 'Верхний сладкий декор' : 'Трава · только верхний ряд', 'soft', candy ? 'candy-light' : 'dirt-grass')] : []),
      block('dense', ice ? 'Непрочный лёд' : candy ? 'Непрочная карамель' : 'Земля · непрочная', 'dense', ice ? 'snow-packed' : candy ? 'cookie-packed' : 'ground-weak'),
      block('hard', ice ? 'Обычный лёд' : candy ? 'Обычная карамель' : 'Камень · обычный', 'hard', ice ? 'glacier' : candy ? 'candy-normal' : 'stone'),
      block('reinforced', ice ? 'Прочный лёд' : candy ? 'Прочная карамель' : 'Обсидиан · прочный', 'reinforced', ice ? 'ice-reinforced' : candy ? 'candy-reinforced' : 'stone-reinforced'),
      block('hazard', ice ? 'Ледяные шипы' : candy ? 'Кислая карамель' : 'Опасный камень', 'hazard', ice ? 'ice-spikes' : candy ? 'candy-hazard' : 'stone-hazard', { hp: 1.2 }),
      ...(candy ? [
        block('jelly', 'Пружинящая желейка', 'jelly', 'jelly-bounce', { hp: 1 })
      ] : !ice ? [
        block('bomb', 'Динамит', 'bomb', 'dynamite', { hp: .68, explosionRadius: 125 })
      ] : [
        block('cryo', 'Крио-блок', 'cryo', 'cryo', { hp: 1 }),
        block('snowflake', 'Блок снежинки', 'snowflake', 'snowflake', { hp: 1 })
      ]),
      block('heal', 'Лечебный блок', 'gel', 'heal', { hp: .44 }),
    ];
  };
  const enabledForLevel = (worldId, index) => {
    if (worldId === 2) {
      const enabled = ['dense', 'hazard', 'cryo', 'snowflake', 'heal'];
      if (index >= 1) enabled.push('hard');
      if (index >= 2) enabled.push('reinforced');
      return enabled;
    }
    if (worldId === 3) {
      const enabled = ['soft','dense','hazard','jelly','heal'];
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
  const builtInDefaults = () => ({ version: 12, worlds: [world(1,'Зелёные глубины','#54d7b0','#63825b','#171c20',[100,200,300,400,500]), world(2,'Ледяная пещера','#67e8f9','#4b7f97','#10232d',[150,250,350,450,550]), world(3,'Конфетная фабрика','#f472b6','#8f4b82','#21142d',[200,300,400,500,600]), world(4,'Магмовое ядро','#fb7185','#7d3426','#1b1112',[250,350,450,550,650])] });
  const defaults = () => builtInDefaults();
  const load = () => defaults();
  window.SlimeWorldCatalog = Object.freeze({ defaults, load, assetSource });
})();
