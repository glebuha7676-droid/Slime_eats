# Огонь, мороз, электро — ультимейты 601

| Мутация | I | II | III |
|---|---|---|---|
| Огонь | Вспышка | Вулкан | Феникс |
| Мороз | Морозная вспышка | Снежный ком | Вьюга |
| Электро | Разряд | Шаровая молния | Громовержец |

В интерфейсе этих трёх мутаций — только названия ультимейтов, без описаний.
Переключение превью стадий меняет название. III сохраняет прежние механики,
длительность и большую анимацию кнопки. I/II включаются сразу.

## Реализация

`js/abilities/elemental-ultimates.js`: состояния шести новых способностей,
изолированные от феникса, снегопада и грозы III стадии.

- Вспышки воздействуют на породу вокруг точки активации, радиус 1,85 клетки.
- Вулкан: четыре камня с интервалом 110 мс; подъём, отдельные дуги,
  падение и поджог круговой области радиусом 1,25 клетки.
- Снежный ком: семь рядов = 50 м, ровно три колонки; пересечение рядов
  проверяется между кадрами. Поверхностные детали проходят по передней
  полусфере, сжимаются у края и скрываются за шаром; освещение остаётся сверху.
- Разряд: четыре направления, без диагонального урона, по одному урону.
- Шаровая молния: семь рядов = 50 м, два ближайших блока за импульс,
  промежуток 350 мс; один блок нельзя ударить чаще чем раз в 650 мс.
- Используются существующие функции поджога, заморозки и разрушения:
  жилы +1/+3/+5, колбы и личный опыт сохраняются.
- Пауза сдвигает часы полёта, ударов и следов.
- Поиск через индекс рядов. Следы ограничены 6–8 точками; растровые свечения,
  ядро молнии и детали снежного шара кэшируются. Нет размытия canvas на каждом кадре.

## Графика

Создано встроенным **ImageGen**, прозрачный фон, стилевой референс:
`assets/food/03-ramen.webp`. Промпты выбранных ассетов:

**Камень:** “One isolated chunky volcanic rock sprite in the same polished
casual mobile game illustration style as the supplied food reference.
Rounded irregular basalt rock, simple broad charcoal-brown facets, thick smooth
dark outline, three bright orange molten fissures, a small yellow-orange flame
behind its top. Readable at small size, soft volume, top-left light. No face,
ground, shadow, UI, text, or surrounding scene. Transparent background.”

**Снежный шар:** “One isolated round packed snow sphere sprite in the same
polished casual mobile game illustration style as the supplied food reference.
Four to five softly rounded packed snow clumps form one coherent spherical ball.
White top-left highlights, pale cyan and blue lower shadows, smooth dark-blue
outline, three small blue dimples. Clearly volumetric, simple and readable
at small size. No face, decorations, ground, shadow, glow, UI, or text.
Transparent background.”

Сохранены с альфа-каналом, сжатие WebP:

- `assets/vfx/fire-volcano-rock-v1.webp` — 192×192.
- `assets/vfx/frost-snowball-v1.webp` — 256×256.

Исходные PNG остаются в каталоге `C:/Users/User/.codex/generated_images/01a0d472-6c77-7802-9042-ac07db6305e8/`:
`exec-41c7ad64-5080-4a24-9a5a-b167baba0dc8.png` и
`exec-b45933ac-7d45-4b79-8875-c9d614636265.png`.

## Проверки

`tools/test_elemental_ultimates.cjs`, `tools/test_elemental_ultimates_browser.cjs`:
геометрия вспышек, четыре подъёма и приземления, непрерывный проход снежного
кома при низкой частоте кадров, ширина/дальность и границы шахты, частота
молний, пауза, сохранение жил, отсутствие запуска III на ранних стадиях,
названия девяти стадий без описаний. Браузерные фикстуры используют отдельный
контекст и не меняют сохранение игрока.
