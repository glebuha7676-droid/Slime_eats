(() => {
  'use strict';
  // Initial targets for UI/playtesting. Count successful actions, never old XP.
  const definitions = Object.freeze({
    fire: { label: 'Подожги блоки', unit: 'поджогов', goals: [250, 750] },
    frost: { label: 'Заморозь блоки', unit: 'заморозок', goals: [50, 200] },
    electric: { label: 'Порази блоки током', unit: 'поражений', goals: [50, 200] },
    cosmos: { label: 'Разрушь блоки', unit: 'разрушений', goals: [100, 400] },
    cloning: { label: 'Лопни споры', unit: 'лопнувших спор', goals: [10, 40] },
    nano: { label: 'Дезинтегрируй блоки', unit: 'дезинтеграций', goals: [30, 120] },
    phantom: { label: 'Взорви блоки', unit: 'взрывов', goals: [30, 120] },
    glitch: { label: 'Обезвредь колючки', unit: 'обезвреживаний', goals: [3, 12] },
    telekinesis: { label: 'Вырви блоки', unit: 'вырванных блоков', goals: [20, 80] }
  });
  const count = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
  function state(id, ownedStage, value, viewedStage = Math.min(3, ownedStage + 1)) {
    const definition = definitions[id] || definitions.cosmos;
    const stage = Math.max(1, Math.min(3, count(ownedStage)));
    const targetStage = Math.max(1, Math.min(3, count(viewedStage)));
    const target = definition.goals[Math.max(0, targetStage - 2)];
    const current = count(value), owned = targetStage <= stage;
    return { ...definition, stage, targetStage, current, target, owned,
      max: stage === 3, ready: !owned && targetStage === stage + 1 && current >= target,
      percent: owned ? 100 : Math.min(100, current / target * 100),
      remaining: Math.max(0, target - current), cost: targetStage === 3 ? 100 : 50 };
  }
  function migrate(source, ids) {
    // Owned stages live in mutationLevels; XP is not evidence of task completion.
    return Object.fromEntries(ids.map(id => [id, count(source?.[id])]));
  }
  window.SlimeMutationMastery = Object.freeze({ definitions, state, migrate });
})();
