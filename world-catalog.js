(() => {
  'use strict';
  const STORAGE_KEY = 'slime_world_catalog_v1';
  const ORE_IDS = ['coal','iron','gold','diamond'];
  const clamp = (v, a, b, d) => Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d;
  const block = (id, label, type, sprite, extra = {}) => ({ id, label, type, sprite, hp: 1, x: 0, y: 0, scale: 1, ...extra });
  const level = (depth, enabled) => ({ depth, enabled, weights: { soft: 0, dense: 48, hard: 42, reinforced: 4, ore: 8, hazard: 5, bomb: 4, spring: 3, heal: 3, freeze: 3, blizzard: 2 } });
  const blocksFor = id => {
    const earth = id === 1, ice = id === 2, candy = id === 3;
    return [
      block('soft', ice ? 'Верхний снежный декор' : candy ? 'Верхний сладкий декор' : 'Трава · только верхний ряд', 'soft', ice ? 'ice-light' : candy ? 'candy-light' : 'dirt-grass'),
      block('dense', ice ? 'Непрочный лёд' : candy ? 'Непрочная карамель' : 'Земля · непрочная', 'dense', ice ? 'snow-packed' : candy ? 'cookie-packed' : 'stone'),
      block('hard', ice ? 'Обычный лёд' : candy ? 'Обычная карамель' : 'Камень · обычный', 'hard', ice ? 'glacier' : candy ? 'candy-reinforced' : 'stone'),
      block('reinforced', ice ? 'Прочный лёд' : candy ? 'Прочная карамель' : 'Обсидиан · прочный', 'reinforced', ice ? 'ice-reinforced' : candy ? 'candy-reinforced' : 'stone-reinforced'),
      block('ore', 'Рудный блок', 'ore', 'ore-diamond', { oreVariant: 'random', oreEnabled: [...ORE_IDS], oreTextures: Object.fromEntries(ORE_IDS.map(id => [id, { image:'', x:0, y:0, scale:1 }])) }),
      block('hazard', ice ? 'Ледяные шипы' : candy ? 'Кислая карамель' : 'Опасный камень', 'hazard', ice ? 'ice-spikes' : candy ? 'candy-hazard' : 'stone-hazard', { hp: 1.2 }),
      block('bomb', 'Динамит', 'bomb', 'dynamite', { hp: .68, explosionRadius: 125 }),
      block('spring', 'Прыжинка', 'spring', 'spring', { hp: 1.1, push: 1.35 }),
      block('heal', 'Лечебный блок', 'gel', 'heal', { hp: .44, healAmount: 16 }),
      ...(ice ? [block('freeze', 'Ледяная заморозка', 'freeze', 'freeze', { hp: .72 }), block('blizzard', 'Блок вьюги', 'blizzard', 'blizzard', { hp: 1.08, push: 1 })] : [])
    ];
  };
  const world = (id, name, accent, top, bottom, depths) => ({ id, name, accent, background: { top, bottom, image: '', x: 0, y: 0, scale: 1 }, levels: depths.map((depth, i) => level(depth, i === 0 ? ['soft','dense','ore'] : i === 1 ? ['soft','dense','ore','bomb'] : i === 2 ? ['soft','dense','hard','ore','bomb','heal'] : ['soft','dense','hard','reinforced','ore','bomb','heal','hazard','spring'])), blocks: blocksFor(id) });
  const builtInDefaults = () => ({ version: 1, worlds: [world(1,'Зелёные глубины','#54d7b0','#63825b','#171c20',[85,150,250,350,500]), world(2,'Ледяная пещера','#67e8f9','#4b7f97','#10232d',[120,210,320,440,580]), world(3,'Конфетная фабрика','#f472b6','#8f4b82','#21142d',[140,240,360,490,640]), world(4,'Магмовое ядро','#fb7185','#7d3426','#1b1112',[160,280,410,560,720])] });
  const normal = value => {
    const base = builtInDefaults(); if (!value || !Array.isArray(value.worlds)) return base;
    base.worlds.forEach(fallback => { const src = value.worlds.find(x => +x.id === fallback.id); if (!src) return; fallback.name = String(src.name || fallback.name).slice(0,32); fallback.accent = String(src.accent || fallback.accent); const bg = src.background || {}; fallback.background = { top:String(bg.top || fallback.background.top), bottom:String(bg.bottom || fallback.background.bottom), image:String(bg.image || '').slice(0,1500000), x:clamp(bg.x,-45,45,0), y:clamp(bg.y,-45,45,0), scale:clamp(bg.scale,.5,1.8,1) }; fallback.levels.forEach((l,i) => { const s=src.levels?.[i]||{}; l.depth=Math.round(clamp(s.depth,20,2000,l.depth)); l.enabled=Array.isArray(s.enabled)?s.enabled.filter(id=>fallback.blocks.some(b=>b.id===id)):l.enabled; l.weights={...l.weights,...(s.weights||{}),soft:0}; }); fallback.blocks.forEach(b => { const s=src.blocks?.find(x=>x.id===b.id); if(!s)return; b.label=String(s.label||b.label).slice(0,32); b.image=String(s.image||'').slice(0,1500000); b.x=clamp(s.x,-45,45,0); b.y=clamp(s.y,-45,45,0); b.scale=clamp(s.scale,.55,1.55,1); b.hp=clamp(s.hp,.1,5,b.hp); if(b.type==='ore'){const allowed=['coal','iron','gold','diamond'];b.oreVariant=['random',...allowed].includes(s.oreVariant)?s.oreVariant:'random';const saved=Array.isArray(s.oreEnabled)?s.oreEnabled.filter(id=>allowed.includes(id)):allowed;b.oreEnabled=saved.length?saved:allowed;} if(b.type==='bomb')b.explosionRadius=clamp(s.explosionRadius,40,260,b.explosionRadius); if(b.type==='gel')b.healAmount=clamp(s.healAmount,1,100,b.healAmount); if(b.type==='spring'||b.type==='blizzard')b.push=clamp(s.push,.4,2.5,b.push); }); }); return base;
  };
  const normalize = value => {
    const result = normal(value);
    const sourceWorlds = Array.isArray(value?.worlds) ? value.worlds : [];
    result.worlds.forEach(world => {
      const sourceOre = sourceWorlds.find(item => +item.id === +world.id)?.blocks?.find(block => block.id === 'ore');
      const ore = world.blocks.find(block => block.id === 'ore');
      ore.oreTextures = Object.fromEntries(ORE_IDS.map(id => {
        const saved = sourceOre?.oreTextures?.[id] || {};
        return [id, {
          image: String(saved.image || '').slice(0, 1500000),
          x: clamp(saved.x, -45, 45, 0),
          y: clamp(saved.y, -45, 45, 0),
          scale: clamp(saved.scale, .55, 1.55, 1)
        }];
      }));
    });
    return result;
  };
  const CUSTOM_KEY = `${STORAGE_KEY}_custom`;
  const validCustom = block => block && /^custom_[a-z0-9_]{3,48}$/i.test(block.id) && ['soft','dense','hard','reinforced','ore','special'].includes(block.spawnType);
  const mergeCustom = (base, raw) => { (raw?.worlds || []).forEach(entry => { const world = base.worlds.find(item => item.id === +entry.id); if (!world) return; (entry.hidden || []).forEach(id => { const block = world.blocks.find(item => item.id === id); if (block) block.previewEnabled = false; }); (entry.blocks || []).filter(validCustom).forEach(block => world.blocks.push({ id:block.id, label:String(block.label || 'Новый блок').slice(0,32), type:'custom', spawnType:block.spawnType, sprite:String(block.sprite || 'stone'), image:String(block.image || '').slice(0,1500000), x:clamp(block.x,-45,45,0), y:clamp(block.y,-45,45,0), scale:clamp(block.scale,.55,1.55,1), hp:clamp(block.hp,.1,5,1), previewEnabled:block.previewEnabled !== false })); }); return base; };
  const restoreLevelSelection = (base, raw) => { (raw?.worlds || []).forEach(entry => { const target = base.worlds.find(item => item.id === +entry.id); if (!target) return; const validIds = new Set([...target.blocks.map(block => block.id), ...(entry.blocks || []).filter(validCustom).map(block => block.id)]); target.levels.forEach((level, index) => { const source = entry.levels?.[index]; if (!source) return; if (Array.isArray(source.enabled)) level.enabled = source.enabled.filter(id => validIds.has(id)); level.weights = { ...level.weights, ...(source.weights || {}), soft: 0 }; }); }); return base; };
  const fromExport = value => restoreLevelSelection(mergeCustom(normalize(value), value), value);
  const defaults = () => window.SLIME_PUBLISHED_WORLD_CATALOG ? fromExport(window.SLIME_PUBLISHED_WORLD_CATALOG) : builtInDefaults();
  const load = () => { try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return stored ? restoreLevelSelection(mergeCustom(normalize(stored), JSON.parse(localStorage.getItem(CUSTOM_KEY))), stored) : defaults(); } catch { return defaults(); } };
  const save = value => { const customs = { worlds:(value.worlds || []).map(world => ({ id:world.id, blocks:(world.blocks || []).filter(block => block.type === 'custom'), hidden:(world.blocks || []).filter(block => block.previewEnabled === false).map(block => block.id) })) }; localStorage.setItem(STORAGE_KEY, JSON.stringify(restoreLevelSelection(normalize(value), value))); localStorage.setItem(CUSTOM_KEY, JSON.stringify(customs)); };
  window.SlimeWorldCatalog = { STORAGE_KEY, defaults, load, save, normalize, fromExport };
})();
