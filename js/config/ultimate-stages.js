(() => {
  'use strict';
  // Fire unlocks its ultimate at stage III.
  const rows = (values, make) => Object.freeze(values.map((value, i) => Object.freeze({ stage: i + 1, ...make(value, i) })));
  const profiles = Object.freeze({
    fire: rows(['Огненная вспышка', 'Усиленный поджог', 'Полёт феникса'], (name, i) => i < 2
      ? { name }
      : { name, kind: 'phoenix', rows: 8, durationMs: 2510, arrivalMs: 880, travelMs: 870 }),
    frost: rows(['Снежинка', 'Снежный проход', 'Метель'], (name, i) => i < 2
      ? { name }
      : { name, kind: 'blizzard', rows: 8, chargeMs: 890, durationMs: 2850 }),
    electric: rows(['Электрорывок', 'Цепной разряд', 'Громовержец'], (name, i) => i < 2
      ? { name }
      : { name, kind: 'thunderstorm', strikes: 6, chargeMs: 960, durationMs: 4765 }),
    cosmos: rows(['Большая планета','Звездопад','Кометный прорыв'], (name,i) => ({name,kind:['planetBoost','starfall','comet'][i],durationMs:[5000,5000,5500][i],...(i===0?{planetScale:1.85,damage:2}:i===1?{starCount:16,starIntervalMs:220,damage:2}:{meters:60})})),
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
    fire: ['После короткой подготовки вспышка поджигает квадрат 3×3 через один ряд под слаймом.', 'Обычные блоки сгорают полностью. Прочный блок получает 1 урон за поджог.', 'Феникс поджигает 8 рядов на всю ширину шахты.'],
    frost: ['Снежинка прокладывает проход на 5 рядов вперёд и замораживает до двух блоков в каждом ряду.', 'Снежные блоки пролетаются без потери разгона.', 'Метель замораживает 8 рядов на всю ширину шахты.'],
    electric: ['Рывок на 3 клетки сквозь породу. Удерживай стрелку, чтобы рвануть по диагонали. В точке остановки все блоки под слаймом разрушаются. Пять разрядов наносят по 1 урону вокруг.', 'Пассивный разряд может перескочить на ещё один соседний блок.', 'Шесть молний бьют по участкам 3×3. Центральный блок разрушается, остальные получают 2 урона.'],
    cosmos: ['На время увеличивает планету и её урон.', 'Вызывает 16 звёзд. Каждая наносит 2 урона.', 'Пролетает сквозь блоки космической кометой.'],
    nano: ['Раскидывает 5 мин по блокам внизу.', 'Ставит турель: она быстро разбивает блоки внизу.', 'Садится в робота с двумя мощными бластерами.'],
    telekinesis: ['Защищает слайма и взрывает колючки при касании.', 'Поднимает 8 блоков и бросает их вниз.', 'Сжимает и разрушает большой участок шахты.'],
    cloning: ['Споровой взрыв выпускает 6 грибочков.', 'Бросает 4 споры, из которых вырастают грибочки.', 'Выращивает тяжёлого гриба. Его прыжки ломают блоки.'],
    phantom: ['Выпускает 8 духов. Их метки взрывают блоки.', 'Проходит сквозь блоки и оставляет взрывные метки.', 'Призывает призрачный поезд, пробивающий шахту.'],
    glitch: ['Превращает колючку в полезный блок.', 'Даёт выбрать сбой и изменить блоки впереди.', 'Даёт выбрать усиленный сбой для большого участка.']
  });
  const previewImages = Object.freeze({
    fire: [null, null, 'assets/ui/laboratory-refined/phoenix-feather.webp'],
    frost: ['assets/vfx/frost-storm-flake-v1-lossless.webp', null, 'assets/vfx/frost-storm-flake-v1-lossless.webp'],
    cosmos: [null, 'assets/vfx/cosmos-falling-star-v1.webp', null],
    nano: [null, 'assets/vfx/techno-turret-head-v1.webp', null],
    cloning: ['assets/vfx/spores-mini-mushroom-v1-lossless.webp', 'assets/vfx/spores-pod-v5.webp', 'assets/vfx/spores-giant-mushroom-v2.webp'],
    phantom: ['assets/vfx/phantom-v4/soul.webp', 'assets/vfx/phantom-v4/soul.webp', 'assets/vfx/phantom-express-train-v1-lossless.webp']
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
