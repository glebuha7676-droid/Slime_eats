(() => {
  'use strict';

  const STORAGE_KEY = 'slime_balance_v1';
  const ZONE_IDS = ['start', 'middle', 'end'];
  const BLOCK_IDS = ['weak', 'normal', 'strong', 'ore', 'secondary'];
  const ORE_IDS = ['coal', 'iron', 'gold', 'diamond'];
  const SPECIAL_IDS = ['heal', 'bomb', 'spring'];
  const clamp = (value, min, max, fallback) => Number.isFinite(+value) ? Math.max(min, Math.min(max, +value)) : fallback;
  const copy = value => JSON.parse(JSON.stringify(value));

  const zoneDefaults = {
    start: {
      blocks: { weak:45, normal:30, strong:10, ore:10, secondary:5 },
      ores: { coal:70, iron:30, gold:0, diamond:0 },
      secondary: { heal:34, bomb:33, spring:33 }
    },
    middle: {
      blocks: { weak:30, normal:40, strong:15, ore:10, secondary:5 },
      ores: { coal:10, iron:50, gold:40, diamond:0 },
      secondary: { heal:34, bomb:33, spring:33 }
    },
    end: {
      blocks: { weak:20, normal:35, strong:25, ore:15, secondary:5 },
      ores: { coal:0, iron:20, gold:50, diamond:30 },
      secondary: { heal:34, bomb:33, spring:33 }
    }
  };

  const defaults = () => ({
    version: 1,
    durability: {
      weak: { min:5, max:15 },
      normal: { min:15, max:35 },
      strong: { min:35, max:55 }
    },
    rewards: {
      weak: 4,
      normal: 10,
      strong: 22
    },
    ores: {
      coal: { min:10, max:16, coins:12 },
      iron: { min:17, max:24, coins:18 },
      gold: { min:25, max:32, coins:28 },
      diamond: { min:33, max:40, coins:42 }
    },
    special: {
      bomb: { radius:125, damage:45 },
      heal: { amount:16 },
      spring: { push:1.35 }
    },
    worlds: Array.from({ length:4 }, (_, worldIndex) => ({
      id: worldIndex + 1,
      levels: Array.from({ length:5 }, (_, levelIndex) => ({
        level: levelIndex + 1,
        zones: copy(zoneDefaults)
      }))
    }))
  });

  const normalizeDistribution = (source, ids, fallback) => Object.fromEntries(ids.map(id => [id, clamp(source?.[id], 0, 100, fallback[id])]));
  const normalizeRange = (source, fallback, maxValue = 500) => {
    const min = clamp(source?.min, 1, maxValue, fallback.min);
    const max = clamp(source?.max, min, maxValue, fallback.max);
    return { min, max };
  };

  function normalize(value) {
    const base = defaults();
    if (!value || typeof value !== 'object') return base;
    Object.keys(base.durability).forEach(id => base.durability[id] = normalizeRange(value.durability?.[id], base.durability[id]));
    Object.keys(base.rewards).forEach(id => {
      base.rewards[id] = Math.round(clamp(value.rewards?.[id], 0, 10000, base.rewards[id]));
    });
    ORE_IDS.forEach(id => {
      const range = normalizeRange(value.ores?.[id], base.ores[id]);
      base.ores[id] = { ...range, coins: Math.round(clamp(value.ores?.[id]?.coins, 0, 10000, base.ores[id].coins)) };
    });
    base.special.bomb.radius = Math.round(clamp(value.special?.bomb?.radius, 30, 400, base.special.bomb.radius));
    base.special.bomb.damage = Math.round(clamp(value.special?.bomb?.damage, 1, 500, base.special.bomb.damage));
    base.special.heal.amount = Math.round(clamp(value.special?.heal?.amount, 1, 500, base.special.heal.amount));
    base.special.spring.push = clamp(value.special?.spring?.push, .4, 4, base.special.spring.push);

    base.worlds.forEach(world => {
      const savedWorld = value.worlds?.find(item => +item.id === world.id);
      world.levels.forEach(level => {
        const savedLevel = savedWorld?.levels?.find(item => +item.level === level.level) || savedWorld?.levels?.[level.level - 1];
        ZONE_IDS.forEach(zoneId => {
          const saved = savedLevel?.zones?.[zoneId];
          level.zones[zoneId] = {
            blocks: normalizeDistribution(saved?.blocks, BLOCK_IDS, zoneDefaults[zoneId].blocks),
            ores: normalizeDistribution(saved?.ores, ORE_IDS, zoneDefaults[zoneId].ores),
            secondary: normalizeDistribution(saved?.secondary, SPECIAL_IDS, zoneDefaults[zoneId].secondary)
          };
        });
      });
    });
    return base;
  }

  const load = () => {
    try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
    catch { return defaults(); }
  };
  const save = value => {
    const normalized = normalize(value);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  };
  const sum = distribution => Object.values(distribution || {}).reduce((total, value) => total + (+value || 0), 0);
  const isValid = value => value.worlds.every(world => world.levels.every(level => ZONE_IDS.every(zoneId => {
    const zone = level.zones[zoneId];
    return Math.abs(sum(zone.blocks) - 100) < .001 && Math.abs(sum(zone.ores) - 100) < .001 && Math.abs(sum(zone.secondary) - 100) < .001;
  })));
  const zoneIdForProgress = progress => progress < 1 / 3 ? 'start' : progress < 2 / 3 ? 'middle' : 'end';
  const getLevel = (value, worldId, level) => value.worlds.find(world => +world.id === +worldId)?.levels?.[Math.max(0, Math.min(4, Math.round(level) - 1))];
  const getZone = (value, worldId, level, progress) => getLevel(value, worldId, level)?.zones?.[zoneIdForProgress(progress)] || zoneDefaults.start;

  window.SlimeBalance = { STORAGE_KEY, ZONE_IDS, BLOCK_IDS, ORE_IDS, SPECIAL_IDS, defaults, normalize, load, save, sum, isValid, zoneIdForProgress, getLevel, getZone };
})();
