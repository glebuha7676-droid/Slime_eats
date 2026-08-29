(() => {
  'use strict';

  const STORAGE_KEY = 'slime_generation_sections_v3';
  const COLS = 6;
  const ROWS = 3;
  const MAX_ROWS = 6;
  const CATEGORIES = Object.freeze([
    { id: 'start', label: 'Начальная', hint: 'Первые безопасные 25 метров' },
    { id: 'safe', label: 'Безопасная', hint: 'Передышка и редкое лечение' },
    { id: 'neutral', label: 'Нейтральная', hint: 'Механика мира без обязательного урона' },
    { id: 'danger', label: 'Опасная', hint: 'Понятный риск и путь для коррекции' },
    { id: 'fork', label: 'Развилка', hint: 'Безопасный путь или риск ради награды' },
    { id: 'reward', label: 'Наградная', hint: 'Руда, окружённая осмысленным риском' },
    { id: 'final', label: 'Финальная', hint: 'Читаемый подход к порталу' }
  ]);

  const BRUSHES = Object.freeze([
    { id: '.', label: 'Пусто', kind: 'empty' },
    { id: 'w', label: 'Слабый', kind: 'weak' },
    { id: 'n', label: 'Обычный', kind: 'normal' },
    { id: 'h', label: 'Крепкий', kind: 'strong' },
    { id: 'x', label: 'Опасный', kind: 'hazard' },
    { id: 'c', label: 'Уголь', kind: 'coal' },
    { id: 'i', label: 'Железо', kind: 'iron' },
    { id: 'g', label: 'Золото', kind: 'gold' },
    { id: 'd', label: 'Алмаз', kind: 'diamond' },
    { id: '+', label: 'Аптечка', kind: 'heal' },
    { id: 'p', label: 'Динамит', kind: 'primary' },
    { id: 'z', label: 'Зелёное желе', kind: 'zone' }
  ]);

  const WORLD_NAMES = Object.freeze({ 1: 'Зелёные глубины' });

  const section = (name, purpose, difficulty, minLevel, cells, selectionWeight = 1) => Object.freeze({
    name, purpose, difficulty, minLevel, selectionWeight, cells: Object.freeze(cells)
  });

  // These are gameplay situations, not shuffled pictures. Each layout has a
  // reason to exist and is unlocked only when the run can support it.
  const BLUEPRINTS = Object.freeze({
    start: Object.freeze([
      section('Центральная пробка', 'Крепкие плечи, широкий центральный вход.', 1, 1, ['nhwwhn', 'nhwwhn', 'nnwwnn']),
      section('Вход слева', 'Слабый левый спуск рядом с крепкой стеной.', 1, 1, ['wwhhnn', 'wwhhnn', 'nwwhnn']),
      section('Вход справа', 'Зеркальный боковой старт с крепкой стеной.', 1, 1, ['nnhhww', 'nnhhww', 'nnhwwn']),
      section('Два боковых входа', 'Центр закрыт, игрок сразу выбирает сторону.', 1, 1, ['whhhhw', 'wwnnww', 'nwwwwn']),
      section('Обычный пласт', 'Первый выбор читается только по прочности блоков.', 2, 1, ['nnnnnn', 'nhwwhn', 'nwwwwn']),
      section('Угольный указатель', 'Уголь отмечает слабую часть крепкого пласта.', 2, 1, ['hnhhnh', 'hwcwwh', 'nwwwwn']),
      section('Воздушная щель', 'Небольшая пустота полезна только для коррекции.', 2, 2, ['hnwwnh', 'hw..wh', 'nwwwwn']),
      section('Боковая полка', 'Узкий путь слева раскрывается к центру.', 3, 3, ['wwwhhn', 'nwwhhn', 'nnwwwn']),
      section('Крепкий центр', 'Прямой путь возможен, но требует больше урона.', 2, 1, ['nwhhwn', 'nwhhwn', 'nwwwwn']),
      section('Ложный центр', 'Лёгкий верх приводит к крепкой пробке и углю по краям.', 2, 2, ['nwwwwn', 'nwhhwn', 'ncwwcn']),
      section('Крепкая диагональ', 'Слабый маршрут резко меняет сторону между крепкими блоками.', 3, 1, ['hhwwhh', 'hwwhhn', 'wwhhhn']),
      section('Крепкий угольный вход', 'Уголь по краям отвлекает от короткого, но прочного центра.', 3, 1, ['nwhhwn', 'cwhhwc', 'nwwwwn']),
      section('Мягкие края', 'Два широких боковых входа для облегчённой попытки.', 1, 1, ['wnnnnw', 'wwnnww', 'nwwwwn'], 2)
    ]),
    safe: Object.freeze([
      section('Аптечка в рамке', 'Крепкие края направляют к лечению.', 1, 1, ['hnwwnh', 'nw+wwn', 'nwwwwn']),
      section('Аптечка слева', 'Лечение продолжает левую траекторию.', 1, 1, ['wwhhnn', 'w+whnn', 'nwwwwn']),
      section('Аптечка справа', 'Лечение продолжает правую траекторию.', 1, 1, ['nnhhww', 'nhw+ww', 'nwwwwn']),
      section('Лечение и уголь', 'Уголь стоит рядом, но не перекрывает аптечку.', 2, 2, ['nhwwhn', 'nwc+wn', 'nwwwwn']),
      section('Лечение за пробкой', 'До аптечки нужно пробить один обычный блок.', 2, 2, ['nwhhwn', 'nwn+wn', 'nwwwwn']),
      section('Боковая медзона', 'Аптечка спрятана в боковой нише крепкого пласта.', 2, 2, ['whhhnn', 'w+whnn', 'nwwwwn']),
      section('Выбор лечения', 'Короткий путь к аптечке против угольного обхода.', 2, 3, ['nwnnwn', 'n+hhcn', 'nwwwwn']),
      section('Глубокая передышка', 'Лечение находится после крепкой ступени.', 3, 4, ['nhwwhn', 'nhh+hn', 'nwwwwn']),
      section('Желевая аптечка', 'Желе удерживает рядом с лечением.', 2, 3, ['nwzzwn', 'nwz+wn', 'nwwwwn']),
      section('Последний шанс', 'Узкая лечебная линия после тяжёлой секции.', 3, 5, ['hxwwxh', 'hw+wwh', 'nwwwwn']),
      section('Лёгкая передышка', 'Широкий слабый путь гарантированно приводит к аптечке.', 1, 1, ['nwwwwn', 'nw+wwn', 'wwwwww'], 2),
      section('Лечение за крепким крестом', 'До аптечки ведут два узких маршрута вокруг прочного центра.', 3, 1, ['hwhhwh', 'hw+wwh', 'nwhhwn']),
      section('Аптечка под желе', 'Каменные края частично скрывают желе, удерживающее у лечения.', 2, 2, ['hhzzhh', 'hwz+wh', 'nwwwwn'])
    ]),
    neutral: Object.freeze([
      section('Желейный тормоз', 'Желе гасит скорость перед крепкой развилкой.', 1, 1, ['nhzzhn', 'nwzzwn', 'wwhhww']),
      section('Желе с углём', 'Слева желе и уголь, справа быстрый плотный путь.', 1, 1, ['nzzhwn', 'nzzcwn', 'nwwhwn']),
      section('Угольная тропа', 'Уголь ведёт по диагонали через разные прочности.', 1, 1, ['hwwwnh', 'hwcwnh', 'hhwwnn']),
      section('Крепкая перемычка', 'Центр прочный, слабый маршрут смещён к краю.', 1, 1, ['nwhhwn', 'wwhhwn', 'nwwwnn']),
      section('Динамитная дверь', 'Динамит спрятан за обычной пробкой и открывает центр.', 2, 2, ['nwhhwn', 'nwnpwn', 'nhwwhn']),
      section('Желейный выбор', 'Желе слева помогает тормозить, справа путь быстрее и прочнее.', 2, 2, ['nzzhwn', 'nzzhwn', 'nwwhwn']),
      section('Уголь над крепким полом', 'Награда показывает более слабый край пласта.', 2, 2, ['nhcwhn', 'nhhhwn', 'nwwwwn']),
      section('Опасные края', 'Края наказывают неточную коррекцию, центр остаётся прочным.', 2, 1, ['xwhhwx', 'nwhhwn', 'nxwwxn']),
      section('Смещённая шахта', 'Лёгкий проход переходит с правой стороны на левую.', 2, 2, ['hhhwwn', 'hnwwnn', 'nwwhhh']),
      section('Рассыпанный уголь', 'Несколько углей встроены в обычный пласт, без отдельной комнаты.', 2, 2, ['ncnhcn', 'hncwnh', 'nwwwwn']),
      section('Длинная желейная шахта', 'Желе сначала тормозит, затем выталкивает к угольному выходу.', 2, 2, ['hhzzhh', 'hwzzwh', 'nwzzwn', 'nzzwwn', 'nzcwwn', 'nwwhwn']),
      section('Скрытый фитиль', 'Крепкая центральная пробка скрывает динамит и быстрый выход.', 3, 3, ['nwhhwn', 'nxhhxn', 'nwhhwn', 'nwpxwn', 'nwgwwn', 'nwwwwn']),
      section('Желе под породой', 'Желейный карман виден частично и открывается после разрушения камня.', 2, 1, ['hhhhhh', 'hzzhhh', 'hwzhhh', 'hwzzhh', 'nwwhwn', 'nwwwwn']),
      section('Малые желейные карманы', 'Два маленьких кармана меняют скорость на разных сторонах.', 1, 1, ['nzwwzn', 'nzwwzn', 'nwwwwn'], 2),
      section('Крепкая шахматка', 'Безопасный маршрут среди прочных блоков нужно прочитать заранее.', 3, 1, ['hwhwhw', 'whwhwh', 'hwwhwh']),
      section('Железная вкраплённость', 'Пара железных блоков естественно встроена в обычный путь.', 2, 2, ['nhwwhn', 'hiwwih', 'nwhhwn'])
    ]),
    danger: Object.freeze([
      section('Колючие ворота', 'Центр прочный, безопасные входы находятся ближе к краям.', 1, 1, ['xwhhwx', 'nwhhwn', 'nxwwxn']),
      section('Ложный центр', 'Лёгкий верх ведёт к колючкам: слева остаётся крепкий обход, справа — обычный.', 1, 1, ['nwwwwn', 'nwxxwn', 'hhwwnn']),
      section('Опасная ступень', 'Колючки стоят в центре, маршрут меняет сторону.', 1, 1, ['nwxwwn', 'nwhhwn', 'xwwwwx']),
      section('Урок динамита', 'Заряд за обычной пробкой ломает крепкий узел, а колючки лишь отмечают границы выхода.', 1, 2, ['hwhhwh', 'nwnpwn', 'xwwwwx']),
      section('Взрыв ради руды', 'Динамит раскрывает крепкую золотую нишу; колючки по краям не притворяются разрушаемыми.', 2, 2, ['hhwwhh', 'hwnpwh', 'xwgwxx']),
      section('Желе над колючками', 'Желе даёт время выбрать один из двух боковых выходов.', 2, 2, ['nwzzwn', 'nwzzwn', 'wxhhxw']),
      section('Зигзаг опасности', 'Безопасный путь дважды меняет сторону.', 2, 2, ['xwwhhn', 'nhhwwx', 'nwwhhn']),
      section('Двойной подрыв', 'Два заряда сносят крепкую середину, а нижний ряд оставляет широкий честный выход.', 2, 3, ['hwhhwh', 'hnppnh', 'xwwwwx']),
      section('Угольная приманка', 'Уголь отмечает короткий, но опасный путь; сбоку прочный обход.', 2, 2, ['nwcwxn', 'hxgwwh', 'hhwwwn']),
      section('Крепкий заслон', 'Несколько прочных блоков заставляют заранее выбрать слабую диагональ.', 3, 3, ['hwhhwh', 'hhwwhh', 'xwhhwx']),
      section('Шахта с фитилём', 'Два заряда выбивают крепкий узел и выпускают к железу; колючки стоят только по краям пути.', 2, 2, ['hwhhwh', 'hwnnwh', 'xwppwx', 'hwiigh', 'xwwwwx', 'nwwwwn']),
      section('Желейная ловушка', 'Желе даёт прочитать четыре колючки: слева после них крепкий путь, справа — обычный.', 2, 3, ['hhzzhh', 'hwzzwh', 'nwzzwn', 'nxxxxn', 'hhwwnn', 'nwwwwn']),
      section('Рудный туннель', 'Прочный вход скрывает железо и заряд, который очищает выход.', 3, 4, ['hwhhwh', 'hwiiwh', 'hxhhxh', 'hwpwgh', 'hxxwwh', 'nwwwwn']),
      section('Глубинная обманка', 'Видимое золото ведёт к колючкам, безопасный путь начинается с крепкой стены.', 3, 5, ['nwgwwn', 'nwxxwn', 'hhwwhh', 'hxggxh', 'hpwwph', 'nwwwwn']),
      section('Тесные ворота', 'Два безопасных края сужаются вокруг колючего крепкого центра.', 3, 1, ['xwhhwx', 'hwxxwh', 'nwhhwn']),
      section('Колючая обманка', 'Слабый центр заманивает к четырём колючкам; после них видны обычный и крепкий боковые пути.', 3, 1, ['nwwwwn', 'nxxxxn', 'nnwwhh']),
      section('Широкая опасность', 'Колючки стоят только по краям широкого слабого прохода.', 1, 1, ['xwwwwx', 'nwwwwn', 'nxwwxn'], 2),
      section('Сжатая диагональ', 'Обычная опасность заставляет один раз сменить сторону.', 2, 1, ['nwxhwn', 'nwhxwn', 'xwwwwx']),
      section('Желе в каменной клетке', 'Часть желе скрыта блоками и выпускает прямо перед опасным выбором.', 2, 2, ['hhhhhh', 'hzzhhh', 'hwzhxh', 'hwzzwh', 'nxxxwn', 'nwwwwn']),
      section('Золотая ловушка', 'Золото находится на короткой опасной линии, длинный край безопаснее.', 3, 3, ['nwgwwn', 'nwxxwn', 'hwhhwh'])
    ]),
    fork: Object.freeze([
      section('Два крепких пути', 'Слева уголь, справа более слабый выход.', 1, 1, ['wwhhww', 'wchhww', 'nwhhwn']),
      section('Уголь справа', 'Левый путь короче, правый награждает за крепкую пробку.', 1, 1, ['nwhhwn', 'nwhhcn', 'nwwhwn']),
      section('Ложный проход', 'Безопасный на вид центр заканчивается колючками.', 1, 1, ['nwwwwn', 'nwxxwn', 'wwhhww']),
      section('Руда или скорость', 'Слева железо за обычным блоком, справа быстрый слабый путь.', 2, 2, ['wwhhww', 'wihhww', 'nnhwwn']),
      section('Взрыв или золото', 'Слева динамитный путь, справа золото рядом с опасностью.', 2, 2, ['nwhhwn', 'npnxgn', 'nwwhwn']),
      section('Желе или уголь', 'Медленный левый путь против прочного угольного правого.', 2, 2, ['nzzhwn', 'nzzhcn', 'nwwhwn']),
      section('Безопасность или железо', 'Крепкий безопасный край противопоставлен рискованной руде.', 2, 3, ['hwnnwh', 'hwxxih', 'nwwwwn']),
      section('Две риск-награды', 'Железо и золото лежат на разных опасных траекториях.', 3, 4, ['xwhhwx', 'iwhhgw', 'nwwwwn']),
      section('Тройная дверь', 'Крайние проходы слабее, центральный крепкий скрывает уголь.', 2, 2, ['wnhhnw', 'wchhcw', 'nwhhwn']),
      section('Перевёрнутая подсказка', 'Уголь отмечает не выход, а начало более трудного наградного пути.', 3, 3, ['ncwwhn', 'nhxxwn', 'nwhhwn']),
      section('Длинная развилка', 'Левый путь безопаснее, правый ведёт через железо к золоту.', 2, 3, ['wwhhww', 'wwhhgw', 'nnhhxn', 'nwhhgn', 'nwxxwn', 'nwwwwn']),
      section('Золотой обход', 'Длинный путь к золоту против короткой опасной середины.', 3, 4, ['wwhhww', 'wghhww', 'nxhhxn', 'nwhhwn', 'npxxwn', 'nwwwwn']),
      section('Алмазный выбор', 'Редкий алмаз виден заранее, но требует пройти крепкий опасный карман.', 3, 5, ['wwhhww', 'wihhdw', 'nxxhxn', 'nwhhwn', 'npwwgn', 'nwwwwn'], .06),
      section('Лёгкий боковой выбор', 'Два широких прохода отличаются только небольшой угольной наградой.', 1, 1, ['wwnnww', 'wcnhww', 'nwwwwn'], 2),
      section('Крепкий крест', 'Центр закрыт прочным крестом, безопасный путь проходит по диагонали.', 3, 1, ['whhhhw', 'hhwwhh', 'xwhhwx']),
      section('Обычная развилка', 'Два маршрута различаются прочностью и одной угольной наградой.', 2, 1, ['nwhhwn', 'cwhhww', 'nwwwwn']),
      section('Желе под стеной', 'Разрушение боковой стены открывает медленный желейный маршрут.', 2, 2, ['hhhhww', 'hzzhww', 'hzzhwn']),
      section('Железо или уголь', 'Обычный угольный путь противопоставлен короткому железному риску.', 2, 2, ['cwhhwi', 'nwhhxn', 'nwwwwn']),
      section('Твёрдый или обычный край', 'Четыре колючки закрывают центр: слева короткая крепкая пробка, справа два обычных блока.', 2, 2, ['nxxxxn', 'hhwwnn', 'nwwwwn']),
      section('Фитиль или обход', 'Слева динамит быстро открывает крепкую рудную нишу, справа остаётся длинный обычный путь.', 3, 3, ['hwhhwn', 'hpwwwn', 'xgwwnx'])
    ]),
    reward: Object.freeze([
      section('Уголь в породе', 'Один уголь естественно встроен в крепкий пласт.', 1, 1, ['nhwwhn', 'nhcwhn', 'nwwwwn']),
      section('Два угля', 'Два небольших угольных кармана по разным сторонам.', 1, 1, ['nwhhwn', 'cwhhcw', 'nwwwwn']),
      section('Угольная диагональ', 'Уголь продолжает смещённый слабый маршрут.', 1, 1, ['hcwwnh', 'hhcwnh', 'nwwwnn']),
      section('Железная тропа', 'Железо лежит в прочном, но безопасном кармане.', 2, 2, ['hwhhwh', 'hwiiwh', 'nwwwwn']),
      section('Железо на развилке', 'Можно взять один простой блок или пробить путь к двум.', 2, 2, ['nwhhwn', 'nwiihn', 'nwwwwn']),
      section('Рудный подрыв', 'Динамит раскрывает смешанную комнату с железом и золотом.', 2, 2, ['hwhhwh', 'hipigh', 'nwwwwn']),
      section('Золото под охраной', 'Золото стоит сбоку от опасного центра.', 2, 3, ['nwxwwn', 'hwgxwh', 'nwhhwn']),
      section('Два золотых края', 'Две награды требуют выбрать одну боковую траекторию.', 2, 3, ['hwhhwh', 'gwxxwg', 'nwwwwn']),
      section('Запас под желе', 'Желе удерживает над широкой угольно-золотой линией.', 2, 3, ['hwzzwh', 'nwzzwn', 'ncggcn']),
      section('Железный сейф', 'Крепкая короткая комната с железом и безопасным краем.', 3, 4, ['hxiixh', 'hwppwh', 'nwwwwn']),
      section('Золотая корона', 'Золото окружено прочной породой, но имеет боковой вход.', 3, 4, ['hxggxh', 'hwhhwh', 'nwwwwn']),
      section('Алмазная щель', 'Один редкий алмаз спрятан за крепкой центральной пробкой.', 3, 4, ['hwhhwh', 'hwhdwh', 'nwwwwn'], .06),
      section('Алмазное хранилище', 'Два алмаза доступны только через опасную середину.', 3, 5, ['hxggxh', 'hcddch', 'nwwwwn'], .06),
      section('Длинная угольная жила', 'Уголь идёт по диагонали и заставляет менять направление.', 2, 2, ['hcwwnh', 'hhcwnh', 'hwwcnh', 'hwhhch', 'nwwwwn', 'nhwwhn']),
      section('Золотая взрывная', 'Крепкая комната открывается динамитом и выпускает к золоту.', 3, 4, ['hwhhwh', 'hwppwh', 'hxhxxh', 'hwggwh', 'hiwwih', 'nwwwwn']),
      section('Редкая алмазная шахта', 'Самая редкая постановка: алмаз за железом, золотом и опасной пробкой.', 3, 5, ['hhhhhh', 'hwiigh', 'hwggwh', 'hxddxh', 'hpwwph', 'nwwwwn'], .04),
      section('Лёгкая угольная полка', 'Широкий путь с одним углём для облегчённой попытки.', 1, 1, ['nwwwwn', 'nwcwwn', 'wwwwww'], 2),
      section('Угольный риск', 'Три угля окружают крепкую опасную середину.', 3, 1, ['cwhhwc', 'hwxxwh', 'nwcwwn']),
      section('Уголь за обычным блоком', 'Нормальная награда требует пробить одну плотную перемычку.', 2, 1, ['nhwwhn', 'nwcwhn', 'nwwwwn']),
      section('Железная прожилка', 'Железо встроено в диагональный маршрут среди обычных блоков.', 2, 2, ['hiwwnh', 'hwiwnh', 'nwwwnn']),
      section('Золото за желе', 'Частично скрытое желе удерживает рядом с золотой нишей.', 2, 3, ['hhzzhh', 'hgzzgh', 'nwwwwn'])
    ]),
    final: Object.freeze([
      section('Центральный финиш', 'Крепкая рамка собирает движение к порталу.', 1, 1, ['hhwwhh', 'nwwwwn', 'wwwwww']),
      section('Финиш слева', 'Последний крепкий поворот выводит слева.', 1, 1, ['wwhhhn', 'wwwhhn', 'wwwwww']),
      section('Финиш справа', 'Зеркальный крепкий выход справа.', 1, 1, ['nhhhww', 'nhhwww', 'wwwwww']),
      section('Два выхода', 'Центр закрыт, обе боковые траектории ведут к порталу.', 1, 1, ['whhhhw', 'wwhhww', 'wwwwww']),
      section('Прощальный уголь', 'Последний уголь отмечает более прочный боковой путь.', 2, 2, ['nhchhn', 'nwwhwn', 'wwwwww']),
      section('Железный финиш', 'Один железный блок завершает наградную траекторию.', 2, 2, ['hhwihh', 'nwwwwn', 'wwwwww']),
      section('Обычная рамка', 'Обычные и крепкие блоки дают последний выбор.', 2, 3, ['nhnnhn', 'nwwwwn', 'wwwwww']),
      section('Крепкая рамка', 'Финал сложного забега требует пробить центральную пробку.', 3, 4, ['hhhhhh', 'hhwwhh', 'wwwwww']),
      section('Финиш через желе', 'Желе мягко выталкивает к последнему проходу.', 2, 3, ['hhzzhh', 'nwzzwn', 'wwwwww']),
      section('Рудный занавес', 'Последние уголь и железо встроены в широкую финишную стену.', 3, 5, ['hcwwih', 'hhwwhh', 'wwwwww']),
      section('Лёгкий широкий финиш', 'Почти весь нижний ряд открыт для облегчённой попытки.', 1, 1, ['nwwwwn', 'wwwwww', 'wwwwww'], 2),
      section('Крепкий первый финиш', 'Два узких прохода обходят прочный центр перед порталом.', 3, 1, ['whhhhw', 'wwhhww', 'wwwwww']),
      section('Обычный узкий финиш', 'Плотные края оставляют понятный проход к порталу.', 2, 1, ['nhwwhn', 'nwwwwn', 'wwwwww']),
      section('Желейная арка', 'Каменная арка частично скрывает желе перед выходом.', 2, 2, ['hhzzhh', 'hwzzwh', 'wwwwww']),
      section('Боковые колючки', 'Даже лёгкий финиш требует удержать центр и не задеть опасные края.', 1, 1, ['xwwwwx', 'nwwwwn', 'wwwwww']),
      section('Последняя развилка', 'Четыре колючки закрывают прямой путь: слева крепкий край, справа обычный.', 2, 2, ['nxxxxn', 'hhwwnn', 'wwwwww']),
      section('Фитиль перед порталом', 'Динамит ломает последнюю крепкую пробку; колючие края не дают проскочить без контроля.', 2, 3, ['hwhhwh', 'hwnpwh', 'xwwwwx']),
      section('Колючий финиш', 'Последняя траектория резко сужается и требует выбрать один из двух краёв.', 3, 1, ['xwhhwx', 'hwxxwn', 'wwwwww']),
      section('Желейный риск', 'Желе выталкивает в широкий центр, но неточная коррекция заканчивается на колючих краях.', 3, 3, ['hhzzhh', 'nwzzwn', 'xwwwwx'])
    ])
  });

  function sanitizeRow(row) {
    const allowed = new Set(BRUSHES.map(brush => brush.id));
    return String(row || '').padEnd(COLS, 'w').slice(0, COLS).split('').map(token => allowed.has(token) ? token : 'w').join('');
  }

  function buildDefaults() {
    const templates = [];
    for (const worldId of [1]) {
      for (const category of CATEGORIES) {
        BLUEPRINTS[category.id].forEach((blueprint, index) => {
          templates.push({
            id: `w${worldId}-${category.id}-${index + 1}`,
            worldId,
            category: category.id,
            variant: index + 1,
            name: blueprint.name,
            purpose: blueprint.purpose,
            difficulty: blueprint.difficulty,
            minLevel: blueprint.minLevel,
            selectionWeight: blueprint.selectionWeight,
            cols: COLS,
            rows: blueprint.cells.length,
            cells: blueprint.cells.map(sanitizeRow)
          });
        });
      }
    }
    return templates;
  }

  const defaults = buildDefaults();

  function readOverrides() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function normalizeTemplate(value, fallback) {
    if (!value || !fallback) return fallback;
    const hasMatchingShape = Array.isArray(value.cells) && value.cells.length === fallback.rows;
    const cells = hasMatchingShape ? value.cells.slice(0, MAX_ROWS).map(sanitizeRow) : fallback.cells;
    return {
      ...fallback,
      name: String(value.name || fallback.name).slice(0, 42),
      difficulty: Math.max(1, Math.min(3, Math.round(Number(value.difficulty) || fallback.difficulty))),
      rows: cells.length,
      cells
    };
  }

  function all() {
    const overrides = new Map(readOverrides().map(item => [item?.id, item]));
    return defaults.map(base => normalizeTemplate(overrides.get(base.id), base));
  }

  function saveTemplate(template) {
    const base = defaults.find(item => item.id === template?.id);
    if (!base) return false;
    const normalized = normalizeTemplate(template, base);
    const overrides = readOverrides().filter(item => item?.id !== base.id);
    overrides.push({ id: base.id, name: normalized.name, difficulty: normalized.difficulty, cells: normalized.cells });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent('slime-generation-updated', { detail: { id: base.id } }));
    return true;
  }

  function resetTemplate(id) {
    const overrides = readOverrides().filter(item => item?.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }

  function clearOverrides() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  const route = (name, sections) => Object.freeze({ name, sections: Object.freeze(sections) });
  const LEVEL_ROUTES = Object.freeze({
    // Levels 1–2 deliberately contain no mandatory damage. The second run
    // teaches dynamite, but hazards are still replaced with weak blocks.
    1: Object.freeze([
      route('Первое испытание', ['start', 'neutral', 'danger', 'final']),
      route('Первая развилка', ['start', 'fork', 'danger', 'final']),
      route('Риск ради угля', ['start', 'danger', 'reward', 'final'])
    ]),
    2: Object.freeze([
      route('Урок динамита', ['start', 'neutral', 'danger', 'safe', 'reward', 'fork', 'neutral', 'reward', 'final']),
      route('Первая развилка', ['start', 'fork', 'danger', 'safe', 'reward', 'neutral', 'reward', 'neutral', 'final']),
      route('Награда и выбор', ['start', 'reward', 'danger', 'safe', 'neutral', 'fork', 'reward', 'neutral', 'final'])
    ]),
    3: Object.freeze([
      route('Риск и передышка', ['start', 'neutral', 'danger', 'safe', 'reward', 'neutral', 'fork', 'reward', 'danger', 'safe', 'neutral', 'reward', 'danger', 'final']),
      route('Длинный обход', ['start', 'neutral', 'reward', 'fork', 'danger', 'safe', 'neutral', 'reward', 'danger', 'safe', 'neutral', 'danger', 'safe', 'final']),
      route('Три испытания', ['start', 'neutral', 'danger', 'safe', 'neutral', 'reward', 'fork', 'danger', 'safe', 'reward', 'neutral', 'danger', 'safe', 'final'])
    ]),
    4: Object.freeze([
      route('Глубинный маршрут', ['start', 'neutral', 'danger', 'safe', 'fork', 'reward', 'danger', 'safe', 'neutral', 'danger', 'reward', 'fork', 'danger', 'safe', 'reward', 'danger', 'neutral', 'final']),
      route('Две рудные петли', ['start', 'neutral', 'reward', 'fork', 'danger', 'safe', 'neutral', 'danger', 'safe', 'reward', 'fork', 'danger', 'safe', 'neutral', 'reward', 'danger', 'safe', 'final']),
      route('Напор и выбор', ['start', 'neutral', 'danger', 'safe', 'reward', 'neutral', 'fork', 'danger', 'safe', 'reward', 'danger', 'safe', 'neutral', 'fork', 'reward', 'danger', 'safe', 'final'])
    ]),
    5: Object.freeze([
      route('Финальное погружение', ['start', 'neutral', 'danger', 'safe', 'fork', 'reward', 'danger', 'safe', 'neutral', 'danger', 'reward', 'fork', 'danger', 'safe', 'reward', 'danger', 'neutral', 'danger', 'safe', 'fork', 'reward', 'danger', 'final']),
      route('Охота за рудой', ['start', 'neutral', 'reward', 'fork', 'danger', 'safe', 'neutral', 'danger', 'safe', 'reward', 'fork', 'danger', 'safe', 'neutral', 'danger', 'safe', 'reward', 'danger', 'safe', 'fork', 'reward', 'danger', 'final']),
      route('Испытание глубины', ['start', 'neutral', 'danger', 'safe', 'fork', 'reward', 'neutral', 'danger', 'safe', 'reward', 'danger', 'safe', 'fork', 'reward', 'neutral', 'danger', 'safe', 'reward', 'fork', 'danger', 'safe', 'danger', 'final'])
    ])
  });

  function fitSequence(source, count, level) {
    if (source.length === count) return source.slice();
    if (count <= 2) return ['start', 'final'].slice(0, count);
    if (source.length > count) {
      const result = ['start'];
      const middle = source.slice(1, -1);
      for (let index = 0; index < count - 2; index += 1) {
        const sourceIndex = Math.round(index * (middle.length - 1) / Math.max(1, count - 3));
        result.push(middle[sourceIndex]);
      }
      result.push('final');
      return result;
    }

    const result = source.slice(0, -1);
    const expansion = level <= 2
      ? ['neutral', 'reward']
      : ['neutral', 'danger', 'safe', 'reward', 'fork'];
    let cursor = 0;
    while (result.length < count - 1) {
      let next = expansion[cursor % expansion.length];
      if (result[result.length - 1] === 'danger') next = 'safe';
      result.push(next);
      cursor += 1;
    }
    result.push('final');
    return result;
  }

  function buildPlan(worldId, level, rowCount, random = Math.random, difficultyMode = 'mixed') {
    const rows = Math.max(3, Math.round(Number(rowCount) || 3));
    const selectedLevel = clamp(Math.round(Number(level) || 1), 1, 5);
    const routes = LEVEL_ROUTES[selectedLevel];
    const selectedRoute = routes[Math.floor(random() * routes.length)] || routes[0];
    const desiredCount = Math.max(3, Math.ceil(rows / ROWS));
    const sequence = fitSequence(selectedRoute.sections, desiredCount, selectedLevel);

    const progressionWeights = {
      1: { 1: .86, 2: .14, 3: 0 },
      2: { 1: .72, 2: .28, 3: 0 },
      3: { 1: .50, 2: .42, 3: .08 },
      4: { 1: .22, 2: .50, 3: .28 },
      5: { 1: .08, 2: .32, 3: .60 }
    }[selectedLevel];
    const starWeights = {
      hard: { 1: .02, 2: .18, 3: .80 },
      normal: { 1: .10, 2: .82, 3: .08 },
      easy: { 1: .92, 2: .075, 3: .005 },
      mixed: progressionWeights
    }[difficultyMode] || progressionWeights;
    const used = new Set();
    const chooseTemplate = (kind, maxRows = MAX_ROWS, allowLong = true) => {
      const candidates = all().filter(template => (
        template.worldId === Number(worldId)
        && template.category === kind
        && template.minLevel <= selectedLevel
        && template.rows <= maxRows
      ));
      const availableStars = [1, 2, 3].filter(star => candidates.some(template => template.difficulty === star));
      const availableWeight = availableStars.reduce((sum, star) => sum + (starWeights[star] || 0), 0);
      let starRoll = random() * availableWeight;
      const selectedStar = availableStars.find(star => (starRoll -= starWeights[star] || 0) <= 0)
        || availableStars.reduce((best, star) => Math.abs(star - selectedLevel) < Math.abs(best - selectedLevel) ? star : best, availableStars[0]);
      const sameDifficulty = candidates.filter(template => template.difficulty === selectedStar);
      const longAdjustment = difficultyMode === 'hard' ? .10 : difficultyMode === 'easy' ? -.12 : 0;
      const longChance = clamp({ 1: .08, 2: .22, 3: .30, 4: .38, 5: .44 }[selectedLevel] + longAdjustment, 0, .62);
      const longPool = allowLong && random() < longChance ? sameDifficulty.filter(template => template.rows > ROWS) : [];
      const shapedPool = longPool.length ? longPool : sameDifficulty.filter(template => template.rows === ROWS);
      const pool = shapedPool.length ? shapedPool : sameDifficulty;
      const effectiveWeight = template => (template.selectionWeight || 1) * (used.has(template.id) ? .24 : 1);
      let selectionRoll = random() * pool.reduce((sum, template) => sum + effectiveWeight(template), 0);
      const selected = pool.find(template => (selectionRoll -= effectiveWeight(template)) <= 0) || pool[pool.length - 1] || candidates[0];
      if (selected) used.add(selected.id);
      return selected || null;
    };

    const plan = [];
    let routeCursor = 0;
    let sectionIndex = 0;
    while (plan.length < rows) {
      const remaining = rows - plan.length;
      const finalSection = remaining < ROWS * 2 || routeCursor >= sequence.length - 1;
      let kind = finalSection ? 'final' : sequence[routeCursor];
      // From level 3 onward a late danger is replaced with recovery when there
      // is not enough depth left for both recovery and the finish.
      if (!finalSection && selectedLevel >= 3 && kind === 'danger' && remaining < ROWS * 3) kind = 'safe';
      const maxTemplateRows = finalSection ? MAX_ROWS : Math.max(ROWS, remaining - ROWS);
      const allowLong = !finalSection && (kind !== 'danger' || selectedLevel < 3 || remaining >= ROWS * 4);
      const template = chooseTemplate(kind, maxTemplateRows, allowLong);
      const length = finalSection ? remaining : Math.min(template?.rows || ROWS, remaining - ROWS);
      for (let localRow = 0; localRow < length; localRow += 1) {
        const templateRow = template && localRow < template.rows ? localRow : -1;
        plan.push({
          kind,
          routeName: selectedRoute.name,
          difficultyMode,
          sectionIndex,
          localRow,
          length,
          templateId: template?.id || '',
          templateName: template?.name || '',
          purpose: template?.purpose || '',
          difficulty: template?.difficulty || 1,
          cells: templateRow >= 0 ? template?.cells?.[templateRow] || '' : kind === 'final' ? 'wwwwww' : 'nwwwwn'
        });
      }
      if (finalSection) break;
      // A long set-piece consumes more depth, not the next gameplay beat. In
      // particular, a recovery section must still follow a long danger.
      routeCursor += 1;
      sectionIndex += 1;
    }
    return plan.slice(0, rows);
  }

  window.SlimeSectionCatalog = Object.freeze({
    STORAGE_KEY,
    COLS,
    ROWS,
    MAX_ROWS,
    CATEGORIES,
    BRUSHES,
    WORLD_NAMES,
    all,
    worldTemplates: worldId => all().filter(item => item.worldId === Number(worldId)),
    templatesFor: (worldId, category) => all().filter(item => item.worldId === Number(worldId) && item.category === category),
    byId: id => all().find(item => item.id === id) || null,
    saveTemplate,
    resetTemplate,
    clearOverrides,
    buildPlan
  });
})();
