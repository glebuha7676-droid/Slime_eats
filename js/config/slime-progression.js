(() => {
  'use strict';
  const THRESHOLDS = Object.freeze({ 1: 0, 2: 500, 3: 2000 });
  const COSTS = Object.freeze({ 1: 50, 2: 100 });
  const number = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  function progress(stage, experience) {
    stage = Math.max(1, Math.min(3, number(stage)));
    const xp = number(experience), start = THRESHOLDS[stage], target = THRESHOLDS[stage + 1] || start;
    return { stage, xp, start, target, remaining: Math.max(0, target - xp),
      percent: stage === 3 ? 100 : Math.max(0, Math.min(100, (xp - start) / (target - start) * 100)),
      ready: stage < 3 && xp >= target, max: stage === 3, cost: COSTS[stage] || 0 };
  }
  function migrateExperience(source, ids, stages) {
    const result = {};
    for (const id of ids) {
      const floor = THRESHOLDS[Math.max(1, Math.min(3, number(stages[id])))] || 0;
      // Owned evolutions survive migration; global XP is never copied to every character.
      result[id] = Math.max(floor, number(source?.[id]));
    }
    return result;
  }
  function canEvolve(stage, xp, plasma, infinite = false) {
    const state = progress(stage, xp);
    return state.ready && (infinite || number(plasma) >= state.cost);
  }
  function credit(save, id, gain) {
    if (!save.unlockedMutations.includes(id)) return null;
    const before = number(save.mutationExperience[id]);
    const after = before + number(gain);
    save.mutationExperience[id] = after;
    return { before, after };
  }
  window.SlimeProgression = Object.freeze({ THRESHOLDS, COSTS, progress, migrateExperience, canEvolve, credit });
})();
