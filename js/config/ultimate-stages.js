(() => {
  'use strict';
  // Fire, frost, electric and techno have distinct I/II abilities; III keeps its original mechanics.
  const rows = (values, make) => Object.freeze(values.map((value, i) => Object.freeze({ stage: i + 1, ...make(value, i) })));
  const profiles = Object.freeze({
    fire: rows(['Вспышка', 'Вулкан', 'Феникс'], (name, i) => ({ name, kind: ['fireFlash', 'volcano', 'phoenix'][i], durationMs: [800, 2350, 2000][i], ...(i === 2 ? { meters: 100, rows: 14 } : {}) })),
    frost: rows(['Морозная вспышка', 'Снежный ком', 'Вьюга'], (name, i) => ({ name, kind: ['frostFlash', 'snowball', 'blizzard'][i], durationMs: [850, 1600, 6000][i], ...(i === 1 ? { meters: 50, rows: 7, width: 3, travelMs: 1250 } : {}) })),
    electric: rows(['Разряд', 'Шаровая молния', 'Громовержец'], (name, i) => ({ name, kind: ['discharge', 'ballLightning', 'thunderstorm'][i], durationMs: [700, 2800, 4600][i], ...(i === 0 ? { reachCells: 4, growMs: 260 } : {}), ...(i === 1 ? { meters: 50, rows: 7, travelMs: 2450, strikeIntervalMs: 220, damage:2, targetCooldownMs:440 } : {}), ...(i === 2 ? { strikes: 5, branchLength: 4 } : {}) })),
    cosmos: rows(['Большая планета','Звездопад','Кометный прорыв'], (name,i) => ({name,kind:['planetBoost','starfall','comet'][i],durationMs:[5000,5000,5500][i],...(i===0?{planetScale:1.85,damage:2}:i===1?{starCount:16,starIntervalMs:220,damage:2}:{orbitRows:20})})),
    nano: rows(['Минный залп', 'Турель', 'Титан'], (name,i) => ({name,kind:['mineSalvo','turret','titan'][i],durationMs:[2000,6200,10000][i],...(i===0?{mineCount:5}:i===1?{landMs:700,activeMs:5000,shotIntervalMs:200}:{mechMs:10000})})),
    telekinesis: rows(['Псионический барьер','Псионический шторм','Псионический пресс'],(name,i)=>({name,kind:['psionicBarrier','psionicStorm','psionicPress'][i],durationMs:[3000,4000,2500][i],...(i===1?{blockCount:8,orbitMs:1450,staggerMs:185}:i===2?{pressRows:80*7/50}:{})})),
    cloning: rows(['Споровой хлопок','Грибная дорожка','Грибной великан'], (name,i) => ({name,...(i===0
      ? {kind:'sporePop',miniCount:6,chargeMs:240,durationMs:1200}
      : i===1 ? {kind:'sporeTrail',sporeCount:4,durationMs:5800}
      : {kind:'giantMushroom',durationMs:7300,launchMs:320,growMs:700,hatchMs:300,jumpCount:5,windupMs:210,jumpMs:600,cycleMs:1050})})),
    phantom: rows(['Призрачный залп', 'Мир духов', 'Призрачный экспресс'], (name, i) => ({ name,
      kind: ['phantomSalvo', 'phantomRealm', 'phantomExpress'][i], durationMs: [2700, 5000, 2800][i],
      ...(i === 0 ? { spiritCount: 8 } : i === 2 ? { trainRows: 12, trainWidth: 4 } : {}) })),
    glitch: rows([6, 9, 12], (glitchRows, i) => i === 0
      ? { name: 'Обезоруживание', kind: 'glitchDisarm', durationMs: 1600 }
      : { name: 'Выбор сбоя', kind: 'glitchChoice', provisional: i === 1,
        glitchRows, rewriteRows: [5, 7, 10][i], infectRadius: [3, 5, 7][i], hackRadius: i + 1,
        deleteRadius: Math.min(2, i + 1), deleteCap: [16, 28, 40][i], durationMs: 1800 })
  });
  const summaries = Object.freeze({
    fire: ['Поджигает блоки вокруг слайма.', 'Выбрасывает 4 огненных камня. Они падают и поджигают блоки.', 'Превращается в феникса и поджигает путь.'],
    frost: ['Замораживает блоки вокруг слайма.', 'Катит снежный ком, замораживая блоки на пути.', 'Вызывает вьюгу и замораживает блоки впереди.'],
    electric: ['Бьёт молниями в четыре стороны.', 'Выпускает шар. Частые разряды наносят по 2 урона.', 'Вызывает мощные удары молний по шахте.'],
    cosmos: ['На время увеличивает планету и её урон.', 'Вызывает 16 звёзд. Каждая наносит 2 урона.', 'Пролетает сквозь блоки космической кометой.'],
    nano: ['Раскидывает 5 мин по блокам внизу.', 'Ставит турель: она быстро разбивает блоки внизу.', 'Садится в робота с двумя мощными бластерами.'],
    telekinesis: ['Защищает слайма и взрывает колючки при касании.', 'Поднимает 8 блоков и бросает их вниз.', 'Сжимает и разрушает большой участок шахты.'],
    cloning: ['Споровой взрыв выпускает 6 грибочков.', 'Бросает 4 споры, из которых вырастают грибочки.', 'Выращивает тяжёлого гриба. Его прыжки ломают блоки.'],
    phantom: ['Выпускает 8 духов. Их метки взрывают блоки.', 'Проходит сквозь блоки и оставляет взрывные метки.', 'Призывает призрачный поезд, пробивающий шахту.'],
    glitch: ['Превращает колючку в полезный блок.', 'Даёт выбрать сбой и изменить блоки впереди.', 'Даёт выбрать усиленный сбой для большого участка.']
  });
  const previewImages = Object.freeze({
    fire: [null, 'assets/vfx/fire-volcano-rock-v1.webp', 'assets/ui/laboratory-refined/phoenix-feather.webp'],
    frost: [null, 'assets/vfx/frost-snowball-v2.webp', 'assets/vfx/frost-storm-flake-v1-lossless.webp'],
    cosmos: [null, 'assets/vfx/cosmos-falling-star-v1.webp', null],
    nano: [null, 'assets/vfx/techno-turret-head-v1.webp', null],
    cloning: ['assets/vfx/spores-mini-mushroom-v1-lossless.webp', 'assets/vfx/spores-pod-v5.webp', 'assets/vfx/spores-giant-mushroom-v2.webp'],
    phantom: ['assets/vfx/phantom-spirit-mint-v3-lossless.webp', 'assets/vfx/phantom-spirit-blue-v3-lossless.webp', 'assets/vfx/phantom-express-train-v1-lossless.webp']
  });
  function presentation(type, stage) {
    const index = Math.max(0, Math.min(2, Math.floor(Number(stage) || 1) - 1));
    return { description: summaries[type]?.[index] || '', image: previewImages[type]?.[index] || null };
  }
  function get(type, stage = 3) {
    const index = Math.max(0, Math.min(2, Math.floor(Number(stage) || 1) - 1));
    return profiles[type]?.[index] || Object.freeze({ stage: index + 1 });
  }
  window.SlimeUltimateStages = Object.freeze({ profiles, get, presentation });
})();
