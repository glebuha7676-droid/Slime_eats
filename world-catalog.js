(() => {
  'use strict';
  const STORAGE_KEY = 'slime_world_catalog_v1';
  const ORE_IDS = ['coal','iron','gold','diamond'];
  const WORLD1_ASSETS = {
    'dirt-grass': 'assets/Мир 1/Трава (непрочный блок).webp',
    'ground-weak': 'assets/Мир 1/непрочный блок.webp',
    'stone': 'assets/Мир 1/Обычный блок.webp',
    'stone-reinforced': 'assets/Мир 1/Прочный блок.webp',
    'stone-hazard': 'assets/Мир 1/Опасный блок.webp',
    'ore-coal': 'assets/Мир 1/Уголь.webp',
    'ore-iron': 'assets/Мир 1/Железо.webp',
    'ore-gold': 'assets/Мир 1/Золото.webp',
    'ore-diamond': 'assets/Мир 1/Алмазы.webp',
    'dynamite': 'assets/Мир 1/Динамит.webp',
    'spring': 'assets/Мир 1/Пружина.webp',
    'heal': 'assets/Мир 1/Аптечка.webp',
    'portal': 'assets/ui/portals/world-1.png'
  };
  const WORLD2_ASSETS = {
    'ice-light': 'assets/Мир 2/Непрочный блок.webp',
    'snow-packed': 'assets/Мир 2/Непрочный блок.webp',
    'glacier': 'assets/Мир 2/Обычный блок.webp',
    'ice-reinforced': 'assets/Мир 2/Прочный блок.webp',
    'ice-shards': 'assets/Мир 2/Опасный блок.webp',
    'ice-spikes': 'assets/Мир 2/Опасный блок.webp',
    'ore-coal': 'assets/Мир 2/Уголь.webp',
    'ore-iron': 'assets/Мир 2/Железо.webp',
    'ore-gold': 'assets/Мир 2/Золото.webp',
    'ore-diamond': 'assets/Мир 2/Алмазы.webp',
    'cryo': 'assets/Мир 2/Крио блок.webp',
    'snowflake': 'assets/Мир 2/Заморозка.webp',
    'heal': 'assets/Мир 2/Аптечка.webp',
    'portal': 'assets/ui/portals/world-2.png'
  };
  const WORLD3_ASSETS = {
    'candy-light': 'assets/Мир 3/Непрочный блок.webp',
    'cookie-packed': 'assets/Мир 3/Непрочный блок.webp',
    'candy-normal': 'assets/Мир 3/обычный блок.webp',
    'candy-reinforced': 'assets/Мир 3/Прочный блок.webp',
    'candy-hazard': 'assets/Мир 3/опасный блок.webp',
    'ore-coal': 'assets/Мир 3/Уголь.webp',
    'ore-iron': 'assets/Мир 3/Карамель.webp',
    'ore-gold': 'assets/Мир 3/Золото.webp',
    'ore-diamond': 'assets/Мир 3/Алмазы.webp',
    'apple-mint': 'assets/Мир 3/Уменьшающее яблоко.webp',
    'apple-red': 'assets/Мир 3/Увеличивающее яблоко.webp',
    'heal': 'assets/Мир 3/Хилка.webp',
    'portal': 'assets/ui/portals/world-3.png'
  };
  const WORLD4_ASSETS = {
    'ash': 'assets/Мир 4/Непрочный блок.webp',
    'volcanic-earth': 'assets/Мир 4/Обычный блок.webp',
    'basalt': 'assets/Мир 4/Прочный блок.webp',
    'lava-hazard': 'assets/Мир 4/Опасный блок.webp',
    'ore-coal': 'assets/Мир 4/Уголь.webp',
    'ore-iron': 'assets/Мир 4/Железо.webp',
    'ore-gold': 'assets/Мир 4/Золото.webp',
    'ore-diamond': 'assets/Мир 4/Алмазы.webp',
    'geyser': 'assets/Мир 4/Гейзер-заметный.webp',
    'meteor': 'assets/Мир 4/Метеорит.webp',
    'heal': 'assets/Мир 4/Аптечка.webp',
    'portal': 'assets/ui/portals/world-4.png'
  };
  const assetSource = (worldId, sprite) => {
    if (+worldId === 1 && WORLD1_ASSETS[sprite]) return WORLD1_ASSETS[sprite];
    if (+worldId === 2 && WORLD2_ASSETS[sprite]) return WORLD2_ASSETS[sprite];
    if (+worldId === 3 && WORLD3_ASSETS[sprite]) return WORLD3_ASSETS[sprite];
    if (+worldId === 4 && WORLD4_ASSETS[sprite]) return WORLD4_ASSETS[sprite];
    return `assets/world${worldId}/${sprite}.webp`;
  };
  const clamp = (v, a, b, d) => Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d;
  const block = (id, label, type, sprite, extra = {}) => ({ id, label, type, sprite, hp: 1, x: 0, y: 0, scale: 1, ...extra });
  const level = (depth, enabled) => ({ depth, enabled, weights: { soft: 0, dense: 48, hard: 42, reinforced: 4, ore: 8, hazard: 5, bomb: 4, spring: 3, heal: 3, cryo: 3, snowflake: 3, appleMint: 3, appleRed: 3, geyser: 3, meteor: 3 } });
  const blocksFor = id => {
    const ice = id === 2, candy = id === 3, volcano = id === 4;
    if (volcano) return [
      block('dense', 'Вулканический пепел · непрочный', 'dense', 'ash'),
      block('hard', 'Вулканическая земля · обычная', 'hard', 'volcanic-earth'),
      block('reinforced', 'Базальт · прочный', 'reinforced', 'basalt'),
      block('ore', 'Руда в базальте', 'ore', 'ore-diamond', { oreVariant: 'random', oreEnabled: [...ORE_IDS], oreTextures: Object.fromEntries(ORE_IDS.map(oreId => [oreId, { image:'', x:0, y:0, scale:1 }])) }),
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
      block('ore', 'Рудный блок', 'ore', 'ore-diamond', { oreVariant: 'random', oreEnabled: [...ORE_IDS], oreTextures: Object.fromEntries(ORE_IDS.map(id => [id, { image:'', x:0, y:0, scale:1 }])) }),
      block('hazard', ice ? 'Ледяные шипы' : candy ? 'Кислая карамель' : 'Опасный камень', 'hazard', ice ? 'ice-spikes' : candy ? 'candy-hazard' : 'stone-hazard', { hp: 1.2 }),
      ...(candy ? [
        block('appleMint', 'Мятное яблоко', 'appleMint', 'apple-mint', { hp: 1 }),
        block('appleRed', 'Красное яблоко', 'appleRed', 'apple-red', { hp: 1 })
      ] : !ice ? [
        block('bomb', 'Динамит', 'bomb', 'dynamite', { hp: .68, explosionRadius: 125 }),
        block('spring', 'Прыжинка', 'spring', 'spring', { hp: 1.1, push: 1.35 })
      ] : [
        block('cryo', 'Крио-блок', 'cryo', 'cryo', { hp: 1 }),
        block('snowflake', 'Блок снежинки', 'snowflake', 'snowflake', { hp: 1 })
      ]),
      block('heal', 'Лечебный блок', 'gel', 'heal', { hp: .44 }),
    ];
  };
  const enabledForLevel = (worldId, index) => {
    if (worldId === 2) {
      const enabled = ['dense', 'ore', 'hazard', 'cryo', 'snowflake', 'heal'];
      if (index >= 1) enabled.push('hard');
      if (index >= 2) enabled.push('reinforced');
      return enabled;
    }
    if (worldId === 3) {
      const enabled = ['soft','dense','ore','hazard','appleMint','appleRed','heal'];
      if (index >= 1) enabled.push('hard');
      if (index >= 2) enabled.push('reinforced');
      return enabled;
    }
    if (worldId === 4) {
      const enabled = ['dense','hard','ore','hazard','geyser','meteor','heal'];
      if (index >= 1) enabled.push('reinforced');
      return enabled;
    }
    if (index === 0) return ['soft','dense','ore','hazard'];
    if (index === 1) return ['soft','dense','ore','hazard','bomb'];
    if (index === 2) return ['soft','dense','hard','ore','hazard','bomb','heal'];
    return ['soft','dense','hard','reinforced','ore','bomb','heal','hazard','spring'];
  };
  const world = (id, name, accent, top, bottom, depths) => ({ id, name, accent, background: { top, bottom, image: '', x: 0, y: 0, scale: 1 }, levels: depths.map((depth, index) => level(depth, enabledForLevel(id, index))), blocks: blocksFor(id) });
  const builtInDefaults = () => ({ version: 10, worlds: [world(1,'Зелёные глубины','#54d7b0','#63825b','#171c20',[100,200,300,400,500]), world(2,'Ледяная пещера','#67e8f9','#4b7f97','#10232d',[150,250,350,450,550]), world(3,'Конфетная фабрика','#f472b6','#8f4b82','#21142d',[200,300,400,500,600]), world(4,'Магмовое ядро','#fb7185','#7d3426','#1b1112',[250,350,450,550,650])] });
  const WORLD2_LEGACY_IDS = { freeze:'cryo', blizzard:'snowflake', bomb:'cryo', spring:'snowflake' };
  const WORLD3_LEGACY_IDS = { bomb:'appleRed', spring:'appleMint' };
  const WORLD4_LEGACY_IDS = { bomb:'geyser', spring:'meteor', seismic:'meteor' };
  const normalizeEnabled = (worldId, values, validIds, legacyWorld2 = false, legacyWorld3 = false, legacyWorld4 = false) => {
    const mapped = (Array.isArray(values) ? values : []).map(id => +worldId === 2
      ? (WORLD2_LEGACY_IDS[id] || id)
      : +worldId === 3
        ? (WORLD3_LEGACY_IDS[id] || id)
        : +worldId === 4
          ? (WORLD4_LEGACY_IDS[id] || id)
        : id);
    if (+worldId === 2) {
      const disallowed = new Set(['soft','bomb','spring','freeze','blizzard']);
      for (let index = mapped.length - 1; index >= 0; index -= 1) if (disallowed.has(mapped[index])) mapped.splice(index, 1);
      if (legacyWorld2) mapped.push('cryo', 'snowflake');
    }
    if (+worldId === 3) {
      const disallowed = new Set(['bomb','spring']);
      for (let index = mapped.length - 1; index >= 0; index -= 1) if (disallowed.has(mapped[index])) mapped.splice(index, 1);
      if (legacyWorld3) mapped.push('appleMint', 'appleRed');
    }
    if (+worldId === 4) {
      const disallowed = new Set(['soft','bomb','spring','cryo','snowflake','appleMint','appleRed']);
      for (let index = mapped.length - 1; index >= 0; index -= 1) if (disallowed.has(mapped[index])) mapped.splice(index, 1);
      if (legacyWorld4) mapped.push('geyser', 'meteor', 'hazard');
    }
    return [...new Set(mapped.filter(id => validIds.has(id)))];
  };
  const normal = value => {
    const base = builtInDefaults(); if (!value || !Array.isArray(value.worlds)) return base;
    const legacyWorld2 = +value.version < 2;
    const legacyWorld3 = +value.version < 3;
    const legacyWorld3Assets = +value.version < 4;
    const legacyWorld4 = +value.version < 5;
    const legacyWorld4NaturalAssets = +value.version < 6;
    const legacyWorld4Meteor = +value.version < 7;
    const legacyGlobalHazards = +value.version < 8;
    const legacyCoreSignalArt = +value.version < 9;
    base.worlds.forEach(fallback => {
      const src = value.worlds.find(x => +x.id === fallback.id);
      if (!src) return;
      const validIds = new Set(fallback.blocks.map(block => block.id));
      fallback.name = String(src.name || fallback.name).slice(0,32);
      fallback.accent = String(src.accent || fallback.accent);
      const bg = src.background || {};
      fallback.background = { top:String(bg.top || fallback.background.top), bottom:String(bg.bottom || fallback.background.bottom), image:String(bg.image || '').slice(0,1500000), x:clamp(bg.x,-45,45,0), y:clamp(bg.y,-45,45,0), scale:clamp(bg.scale,.5,1.8,1) };
      fallback.levels.forEach((level, index) => {
        const saved = src.levels?.[index] || {};
        level.depth = Math.round(clamp(saved.depth,20,2000,level.depth));
        level.enabled = Array.isArray(saved.enabled) ? normalizeEnabled(fallback.id,saved.enabled,validIds,legacyWorld2,legacyWorld3,legacyWorld4) : level.enabled;
        if (legacyGlobalHazards && !level.enabled.includes('hazard')) level.enabled.push('hazard');
        level.weights = {...level.weights,...(saved.weights||{}),soft:0};
      });
      fallback.blocks.forEach(block => {
        const legacyIds = fallback.id === 2 && block.id === 'cryo' ? ['freeze','bomb']
          : fallback.id === 2 && block.id === 'snowflake' ? ['blizzard','spring']
            : fallback.id === 3 && block.id === 'appleRed' ? ['bomb']
              : fallback.id === 3 && block.id === 'appleMint' ? ['spring']
                : fallback.id === 4 && block.id === 'geyser' ? ['bomb']
                : fallback.id === 4 && block.id === 'meteor' ? ['seismic','spring']
                : [];
        const saved = src.blocks?.find(item=>item.id===block.id) || src.blocks?.find(item=>legacyIds.includes(item.id));
        if (!saved) return;
        const migratedSpecial = (fallback.id === 3 && legacyWorld3 || fallback.id === 4 && (legacyWorld4 || legacyWorld4Meteor)) && legacyIds.includes(saved.id);
        block.label = migratedSpecial || (fallback.id === 4 && (legacyWorld4NaturalAssets || block.id === 'meteor' && legacyWorld4Meteor)) ? block.label : String(saved.label||block.label).slice(0,32);
        const forceBuiltInCryo = fallback.id === 2 && block.id === 'cryo';
        // Version 9 refreshes the universal green/red signal blocks. Older
        // editor saves could keep an embedded texture here and silently cover
        // the new project asset (most visibly the World 1 medkit).
        const refreshCoreSignalArt = legacyCoreSignalArt && fallback.id <= 3 && (block.id === 'heal' || block.id === 'hazard');
        block.image = refreshCoreSignalArt || forceBuiltInCryo || (fallback.id === 2 && legacyWorld2) || (fallback.id === 3 && legacyWorld3Assets) || (fallback.id === 4 && (legacyWorld4NaturalAssets || block.id === 'meteor' && legacyWorld4Meteor)) || migratedSpecial ? '' : String(saved.image||'').slice(0,1500000);
        block.x=clamp(saved.x,-45,45,0); block.y=clamp(saved.y,-45,45,0); block.scale=clamp(saved.scale,.55,1.55,1); block.hp=clamp(saved.hp,.1,5,block.hp);
        if(block.type==='ore'){const allowed=['coal','iron','gold','diamond'];block.oreVariant=['random',...allowed].includes(saved.oreVariant)?saved.oreVariant:'random';const selected=Array.isArray(saved.oreEnabled)?saved.oreEnabled.filter(id=>allowed.includes(id)):allowed;block.oreEnabled=selected.length?selected:allowed;}
        if(block.type==='bomb')block.explosionRadius=clamp(saved.explosionRadius,40,260,block.explosionRadius);
        if(block.type==='spring')block.push=clamp(saved.push,.4,2.5,block.push);
      });
    });
    return base;
  };
  const normalize = value => {
    const result = normal(value);
    const sourceWorlds = Array.isArray(value?.worlds) ? value.worlds : [];
    const legacy = +(value?.version || 0) < 2;
    const legacyWorld3Assets = +(value?.version || 0) < 4;
    const legacyWorld4Assets = +(value?.version || 0) < 6;
    result.worlds.forEach(world => {
      const sourceOre = sourceWorlds.find(item => +item.id === +world.id)?.blocks?.find(block => block.id === 'ore');
      const ore = world.blocks.find(block => block.id === 'ore');
      ore.oreTextures = Object.fromEntries(ORE_IDS.map(id => {
        const saved = sourceOre?.oreTextures?.[id] || {};
        return [id, {
          image: (world.id === 2 && legacy) || (world.id === 3 && legacyWorld3Assets) || (world.id === 4 && legacyWorld4Assets) ? '' : String(saved.image || '').slice(0, 1500000),
          x: clamp(saved.x, -45, 45, 0),
          y: clamp(saved.y, -45, 45, 0),
          scale: clamp(saved.scale, .55, 1.55, 1)
        }];
      }));
      if (world.id === 4 && +(value?.version || 0) < 7) {
        const meteor = world.blocks.find(block => block.id === 'meteor');
        if (meteor) {
          meteor.image = '';
          meteor.x = 0;
          meteor.y = 0;
          meteor.scale = 1;
        }
        world.levels.forEach(level => {
          level.enabled = [...new Set(level.enabled.map(id => id === 'seismic' || id === 'spring' ? 'meteor' : id))];
          level.weights.meteor = level.weights.meteor || level.weights.seismic || level.weights.spring || 3;
          delete level.weights.seismic;
        });
      }
    });
    return result;
  };
  const CUSTOM_KEY = `${STORAGE_KEY}_custom`;
  const validCustom = block => block && /^custom_[a-z0-9_]{3,48}$/i.test(block.id) && ['soft','dense','hard','reinforced','ore','special'].includes(block.spawnType);
  const mergeCustom = (base, raw) => { (raw?.worlds || []).forEach(entry => { const world = base.worlds.find(item => item.id === +entry.id); if (!world) return; (entry.hidden || []).forEach(id => { const block = world.blocks.find(item => item.id === id); if (block) block.previewEnabled = false; }); (entry.blocks || []).filter(validCustom).forEach(block => world.blocks.push({ id:block.id, label:String(block.label || 'Новый блок').slice(0,32), type:'custom', spawnType:block.spawnType, sprite:String(block.sprite || 'stone'), image:String(block.image || '').slice(0,1500000), x:clamp(block.x,-45,45,0), y:clamp(block.y,-45,45,0), scale:clamp(block.scale,.55,1.55,1), hp:clamp(block.hp,.1,5,1), previewEnabled:block.previewEnabled !== false })); }); return base; };
  const restoreLevelSelection = (base, raw) => { const legacyWorld2 = +(raw?.version || 0) < 2, legacyWorld3 = +(raw?.version || 0) < 3, legacyWorld4 = +(raw?.version || 0) < 5, legacyGlobalHazards = +(raw?.version || 0) < 8; (raw?.worlds || []).forEach(entry => { const target = base.worlds.find(item => item.id === +entry.id); if (!target) return; const validIds = new Set([...target.blocks.map(block => block.id), ...(entry.blocks || []).filter(validCustom).map(block => block.id)]); target.levels.forEach((level, index) => { const source = entry.levels?.[index]; if (!source) return; if (Array.isArray(source.enabled)) level.enabled = normalizeEnabled(target.id, source.enabled, validIds, legacyWorld2,legacyWorld3,legacyWorld4); if (legacyGlobalHazards && validIds.has('hazard') && !level.enabled.includes('hazard')) level.enabled.push('hazard'); level.weights = { ...level.weights, ...(source.weights || {}), soft: 0 }; }); }); return base; };
  const fromExport = value => restoreLevelSelection(mergeCustom(normalize(value), value), value);
  const defaults = () => window.SLIME_PUBLISHED_WORLD_CATALOG ? fromExport(window.SLIME_PUBLISHED_WORLD_CATALOG) : builtInDefaults();
  const load = () => { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return stored ? restoreLevelSelection(mergeCustom(normalize(stored), JSON.parse(localStorage.getItem(CUSTOM_KEY))), stored) : defaults(); } catch { return defaults(); } };
  const save = value => { const customs = { worlds:(value.worlds || []).map(world => ({ id:world.id, blocks:(world.blocks || []).filter(block => block.type === 'custom'), hidden:(world.blocks || []).filter(block => block.previewEnabled === false).map(block => block.id) })) }; localStorage.setItem(STORAGE_KEY, JSON.stringify(restoreLevelSelection(normalize(value), value))); localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs)); };
  window.SlimeWorldCatalog = { STORAGE_KEY, defaults, load, save, normalize, fromExport, assetSource };
})();
