(() => {
  'use strict';
  // Stage III preserves the existing abilities; evolution scales their scope.
  const rows = (values, make) => Object.freeze(values.map((value, i) => Object.freeze({ stage: i + 1, ...make(value, i) })));
  const profiles = Object.freeze({
    fire: rows([50, 75, 100], meters => ({ meters, rows: meters * 7 / 50, durationMs: 2000, summary: `${meters} м огненной волны`, description: `Поджигает блоки на ${meters} м вниз.` })),
    frost: rows([3000, 4500, 6000], durationMs => ({ durationMs, summary: `${String(durationMs / 1000).replace('.', ',')} с снегопада`, description: `Снегопад превращает блоки в снег. Длится ${String(durationMs / 1000).replace('.', ',')} с.` })),
    electric: rows([3, 4, 5], (strikes, i) => ({ strikes, branchLength: i + 2, durationMs: 3200 + i * 700, summary: `${strikes} ${strikes === 5 ? 'ударов' : 'удара'} · цепи ${i + 2}`, description: `Молния бьёт ${strikes} ${strikes === 5 ? 'раз' : 'раза'}. Цепи достают ещё до ${i + 2} блоков в каждую сторону.` })),
    cosmos: rows([10, 15, 20], orbitRows => ({ orbitRows, durationMs: 5500, summary: `${orbitRows} рядов прорыва`, description: `Комета пробивает путь на ${orbitRows} рядов вниз.` })),
    nano: rows([5000, 7500, 10000], mechMs => ({ mechMs, durationMs: mechMs, summary: `${String(mechMs / 1000).replace('.', ',')} с меха-слайма`, description: `${String(mechMs / 1000).replace('.', ',')} с летает в мехе и разрушает блоки бластерами.` })),
    telekinesis: rows([40, 60, 80], meters => ({ pressRows: meters * 7 / 50, durationMs: 2500, summary: `${meters} м пресса`, description: `Сжимает и ломает ${meters} м шахты.` })),
    cloning: rows([4, 6, 8], sporeCount => ({ sporeCount, durationMs: 5800, summary: `Взрывные споры: ${sporeCount}`, description: `Выпускает ${sporeCount} ${sporeCount === 4 ? 'споры' : 'спор'}, которые взрывают блоки.` })),
    phantom: rows([6, 9, 12], (trainRows, i) => ({ trainRows, trainWidth: i + 2, durationMs: 2800, summary: `${i + 2} клетки × ${trainRows} рядов`, description: `Поезд сносит ${i + 2} клетки в ширину и ${trainRows} рядов вниз.` })),
    glitch: rows([6, 9, 12], (glitchRows, i) => ({ glitchRows, rewriteRows: [5, 7, 10][i], infectRadius: [3, 5, 7][i], hackRadius: i + 1, deleteRadius: Math.min(2, i + 1), deleteCap: [16, 28, 40][i], durationMs: 1800,
      summary: `${glitchRows} рядов · заражение ${[3, 5, 7][i]}`, description: `Выбери сбой: взлом и удаление на ${glitchRows} рядов, изменение на ${[5, 7, 10][i]}, заражение в радиусе ${[3, 5, 7][i]} клеток.` }))
  });
  function get(type, stage = 3) {
    const index = Math.max(0, Math.min(2, Math.floor(Number(stage) || 1) - 1));
    return profiles[type]?.[index] || Object.freeze({ stage: index + 1 });
  }
  window.SlimeUltimateStages = Object.freeze({ profiles, get });
})();
