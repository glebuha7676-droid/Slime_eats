(() => {
  'use strict';
  const MAX_LEVEL = 30;
  const RUN_VISUAL_THRESHOLDS = Object.freeze([100, 250, 500, 750, 1000, 1500]);
  const stageForRunExperience = experience => {
    const total = Math.max(0, Number(experience) || 0);
    let stage = 0;
    for (const threshold of RUN_VISUAL_THRESHOLDS) {
      if (total < threshold) break;
      stage += 1;
    }
    return stage;
  };
  const nextLevelCost = level => 100 + (Math.max(1, level) - 1) * 50;
  const experienceForLevel = level => {
    const steps = Math.max(0, Math.min(MAX_LEVEL, Math.floor(level)) - 1);
    return steps * 100 + (steps * (steps - 1) / 2) * 50;
  };
  const levelForExperience = experience => {
    const total = Math.max(0, Math.floor(Number(experience) || 0));
    let level = 1;
    while (level < MAX_LEVEL && total >= experienceForLevel(level + 1)) level += 1;
    return level;
  };
  const experienceForBlock = block => block?.tier === 'reinforced' ? 5
    : block?.tier === 'hard' || block?.tier === 'ore' ? 3 : 1;
  const requiredLevelForWorldIndex = index => Math.min(MAX_LEVEL, 1 + Math.max(0, index) * 10 - (index > 0 ? 1 : 0));
  window.SlimeExperience = Object.freeze({
    MAX_LEVEL, nextLevelCost, experienceForLevel, levelForExperience,
    experienceForBlock, requiredLevelForWorldIndex, RUN_VISUAL_THRESHOLDS, stageForRunExperience
  });
})();
