(() => {
  'use strict';

  const STORAGE_KEY = 'slime_balance_v1';
  const ZONE_IDS = ['start', 'middle', 'end'];
  const BLOCK_IDS = ['weak', 'normal', 'strong', 'ore', 'secondary'];
  const ORE_IDS = ['coal', 'iron', 'gold', 'diamond'];
  const SPECIAL_IDS = ['heal', 'bomb', 'spring', 'cryo', 'snowflake', 'appleMint', 'appleRed', 'geyser', 'meteor'];
  const clamp = (value, min, max, fallback) => Number.isFinite(+value) ? Math.max(min, Math.min(max, +value)) : fallback;
  const copy = value => JSON.parse(JSON.stringify(value));

  const zoneDefaults = {
    start: {
      blocks: { weak:45, normal:30, strong:10, ore:10, secondary:5 },
      ores: { coal:70, iron:30, gold:0, diamond:0 },
    },
    middle: {
      blocks: { weak:30, normal:40, strong:15, ore:10, secondary:5 },
      ores: { coal:10, iron:50, gold:40, diamond:0 },
    },
    end: {
      blocks: { weak:20, normal:35, strong:25, ore:15, secondary:5 },
      ores: { coal:0, iron:20, gold:50, diamond:30 },
    }
  };
  const specialIdsForWorld = worldId => +worldId === 2
    ? ['heal', 'cryo', 'snowflake']
    : +worldId === 3
      ? ['heal', 'appleMint', 'appleRed']
      : +worldId === 4
        ? ['heal', 'geyser', 'meteor']
      : ['heal', 'bomb', 'spring'];
  const secondaryDefaults = worldId => Object.fromEntries(SPECIAL_IDS.map(id => [id,
    specialIdsForWorld(worldId).includes(id) ? (id === 'heal' ? 34 : 33) : 0
  ]));
  const zoneDefaultsFor = (worldId, zoneId) => ({
    ...copy(zoneDefaults[zoneId]),
    secondary: secondaryDefaults(worldId)
  });

  const defaults = () => ({
    version: 5,
    durability: {
      weak: { hp:15 },
      normal: { hp:25 },
      strong: { hp:40 }
    },
    rewards: {
      weak: 4,
      normal: 10,
      strong: 22
    },
    ores: {
      coal: { hp:15, coins:12 },
      iron: { hp:20, coins:18 },
      gold: { hp:30, coins:28 },
      diamond: { hp:40, coins:42 }
    },
    special: {
      bomb: { radius:125, damage:45 },
      heal: { amount:25 },
      spring: { push:1.35 },
      cryo: { area:4 },
      snowflake: { duration:3 },
      appleMint: { size:-20, shield:20, shieldCharges:1 },
      appleRed: { size:50, damage:20, shield:20 },
      geyser: { launch:1, wait:3 },
      meteor: { minCount:3, maxCount:4, delay:.42 }
    },
    worlds: Array.from({ length:4 }, (_, worldIndex) => ({
      id: worldIndex + 1,
      levels: Array.from({ length:5 }, (_, levelIndex) => ({
        level: levelIndex + 1,
        zones: Object.fromEntries(ZONE_IDS.map(zoneId => [zoneId, zoneDefaultsFor(worldIndex + 1, zoneId)]))
      }))
    }))
  });

  const normalizeDistribution = (source, ids, fallback) => Object.fromEntries(ids.map(id => [id, clamp(source?.[id], 0, 100, fallback[id])]));
  function normalize(value) {
    const base = defaults();
    if (!value || typeof value !== 'object') return base;
    Object.keys(base.durability).forEach(id => {
      base.durability[id].hp = Math.round(clamp(value.durability?.[id]?.hp, 1, 500, base.durability[id].hp));
    });
    Object.keys(base.rewards).forEach(id => {
      base.rewards[id] = Math.round(clamp(value.rewards?.[id], 0, 10000, base.rewards[id]));
    });
    ORE_IDS.forEach(id => {
      base.ores[id] = {
        hp: Math.round(clamp(value.ores?.[id]?.hp, 1, 500, base.ores[id].hp)),
        coins: Math.round(clamp(value.ores?.[id]?.coins, 0, 10000, base.ores[id].coins))
      };
    });
    base.special.bomb.radius = Math.round(clamp(value.special?.bomb?.radius, 30, 400, base.special.bomb.radius));
    base.special.bomb.damage = Math.round(clamp(value.special?.bomb?.damage, 1, 500, base.special.bomb.damage));
    base.special.heal.amount = Math.round(clamp(value.special?.heal?.amount, 1, 500, base.special.heal.amount));
    base.special.spring.push = clamp(value.special?.spring?.push, .4, 4, base.special.spring.push);
    base.special.cryo.area = 4;
    base.special.snowflake.duration = 3;
    base.special.appleMint.size = Math.round(clamp(value.special?.appleMint?.size, -50, 0, base.special.appleMint.size));
    base.special.appleMint.shield = Math.round(clamp(value.special?.appleMint?.shield, 0, 999, base.special.appleMint.shield));
    base.special.appleMint.shieldCharges = Math.round(clamp(value.special?.appleMint?.shieldCharges, 0, 3, base.special.appleMint.shieldCharges));
    base.special.appleRed.size = Math.round(clamp(value.special?.appleRed?.size, 0, 100, base.special.appleRed.size));
    base.special.appleRed.damage = Math.round(clamp(value.special?.appleRed?.damage, 0, 999, base.special.appleRed.damage));
    base.special.appleRed.shield = Math.round(clamp(value.special?.appleRed?.shield, 0, 999, base.special.appleRed.shield));
    base.special.geyser.launch = clamp(value.special?.geyser?.launch, .6, 2, base.special.geyser.launch);
    base.special.geyser.wait = 3;
    base.special.meteor.minCount = Math.round(clamp(value.special?.meteor?.minCount, 3, 4, base.special.meteor.minCount));
    base.special.meteor.maxCount = Math.round(clamp(value.special?.meteor?.maxCount, base.special.meteor.minCount, 4, base.special.meteor.maxCount));
    base.special.meteor.delay = clamp(value.special?.meteor?.delay, .28, .7, base.special.meteor.delay);

    base.worlds.forEach(world => {
      const savedWorld = value.worlds?.find(item => +item.id === world.id);
      world.levels.forEach(level => {
        const savedLevel = savedWorld?.levels?.find(item => +item.level === level.level) || savedWorld?.levels?.[level.level - 1];
        ZONE_IDS.forEach(zoneId => {
          const saved = savedLevel?.zones?.[zoneId];
          const fallback = zoneDefaultsFor(world.id, zoneId);
          const savedSecondary = { ...(saved?.secondary || {}) };
          if (world.id === 2) {
            savedSecondary.cryo ??= savedSecondary.bomb;
            savedSecondary.snowflake ??= savedSecondary.spring;
            savedSecondary.bomb = 0;
            savedSecondary.spring = 0;
            savedSecondary.appleMint = 0;
            savedSecondary.appleRed = 0;
            savedSecondary.geyser = 0;
            savedSecondary.meteor = 0;
          } else if (world.id === 3) {
            savedSecondary.appleRed ??= savedSecondary.bomb;
            savedSecondary.appleMint ??= savedSecondary.spring;
            savedSecondary.bomb = 0;
            savedSecondary.spring = 0;
            savedSecondary.cryo = 0;
            savedSecondary.snowflake = 0;
            savedSecondary.geyser = 0;
            savedSecondary.meteor = 0;
          } else if (world.id === 4) {
            savedSecondary.geyser ??= savedSecondary.bomb;
            savedSecondary.meteor ??= savedSecondary.seismic ?? savedSecondary.spring;
            savedSecondary.bomb = 0;
            savedSecondary.spring = 0;
            savedSecondary.cryo = 0;
            savedSecondary.snowflake = 0;
            savedSecondary.appleMint = 0;
            savedSecondary.appleRed = 0;
          } else {
            savedSecondary.cryo = 0;
            savedSecondary.snowflake = 0;
            savedSecondary.appleMint = 0;
            savedSecondary.appleRed = 0;
            savedSecondary.geyser = 0;
            savedSecondary.meteor = 0;
          }
          level.zones[zoneId] = {
            blocks: normalizeDistribution(saved?.blocks, BLOCK_IDS, fallback.blocks),
            ores: normalizeDistribution(saved?.ores, ORE_IDS, fallback.ores),
            secondary: normalizeDistribution(savedSecondary, SPECIAL_IDS, fallback.secondary)
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
  const getZone = (value, worldId, level, progress) => getLevel(value, worldId, level)?.zones?.[zoneIdForProgress(progress)] || zoneDefaultsFor(worldId, 'start');

  window.SlimeBalance = { STORAGE_KEY, ZONE_IDS, BLOCK_IDS, ORE_IDS, SPECIAL_IDS, specialIdsForWorld, defaults, normalize, load, save, sum, isValid, zoneIdForProgress, getLevel, getZone };
})();
