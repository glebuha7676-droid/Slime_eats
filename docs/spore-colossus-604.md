# Грибной великан — ультимейт спор III, версия 604

Большая спора вырастает из маленькой, раскрывается в тяжёлого грибного помощника,
который приседает и делает четыре прыжка с ударом и облаком спор.
Стадии I–II в этой правке не перерабатывались.

## Механика

- Полёт маленькой споры: 320 мс; рост: 700 мс; появление гриба: 300 мс.
- Четыре прыжка, каждый с подготовкой 170 мс, полётом 620 мс и восстановлением.
  Суммарная длительность способности — 6200 мс.
- Перед прыжком сжимается, в воздухе слегка вытягивается, на ударе расплющивается.
- Удар ломает участок три клетки в ширину и две в глубину; соседняя область
  получает один урон. Колбы, жилы и личный опыт проходят через обычную систему
  разрушений; каждое приземление срабатывает ровно один раз.
- Помощник выбирает свежую породу и остаётся в читаемой области над кнопкой ульты.
  Его рисунок не закрывает слайма: игрок рисуется поверх помощника.
- Тряска короткая, с затуханием; при снижении движения её сила уменьшается.
- Пауза учитывается для роста, прыжков, облаков, частиц и удара.

## Оптимизация

- Один растровый рисунок гриба, облако спор и два подготовленных рисунка роста.
- 24 переиспользуемые декоративные частицы; 8 вместо 16 на ударе при низкой
  мощности/сниженном движении. Они не создают записи в общей системе частиц.
- Не больше трёх облаков; очистка на месте. Текстуры общие, процедурная тень
  создаётся один раз. Нет живого blur, фильтров и градиентов каждый кадр эффекта.
- Поиск породы через индекс рядов и только перед прыжком/при ударе.
- При разрушении от великана создаются три обычных обломка вместо девяти.
  Сохраняется общий лимит частиц и объединение наград/записей сохранения.
- Удар великана не заряжает следующую ульту, включая отложенные разрушения.

В изолированном браузерном измерении 240 вызовов подачи растровых команд
эффекта заняли около 10–13 мс. Это не замер полного игрового кадра или
выполнения GPU и не обещание частоты кадров на других устройствах.

## Графика — встроенный ImageGen

Стилевой референс персонажа: `assets/vfx/spores-mini-mushroom-v1-lossless.webp`.
Сохранённые игровые файлы с альфа-каналом:

- `assets/vfx/spores-giant-mushroom-v1.webp` — 384×353.
- `assets/vfx/spores-impact-cloud-v1.webp` — 384×135.

Подготовленные из существующих рисунков спор для роста (обрезаны прозрачные поля):
`assets/vfx/spores-giant-seed-v1.webp`, `assets/vfx/spores-giant-pod-v1.webp`.

Исходные PNG сохранены в `C:/Users/User/.codex/generated_images/01a0d472-6c77-7802-9042-ac07db6305e8/`:
`exec-62586307-9136-47d7-bd0c-1a3cec62d62d.png`,
`exec-61d1835d-a836-4182-b5fa-ed55bd8dd3ea.png`.

### Промпт персонажа

Create ONE isolated BIG HEAVY MUSHROOM COMPANION game sprite for a cute polished 2D mobile slime mining game. Supplied mushroom-slime is a STYLE reference, NOT a request to simply enlarge that exact small character. Create its strong hefty elder: huge broad low red-orange mushroom cap with a few big creamy spots, a visible cream-coloured gill underside, very thick squat lime-green/cream living mushroom stem-body, wide solid stance with two short chunky root-like feet. Strong weight and mass, a broad silhouette, low centre of gravity, capable of heavy stomping jumps. Friendly focused face looking straight at the player with big dark glossy eyes, tiny confident smile, a little rosy cheek colour. No angry villain face, no arms, armour, clothing or weapons. Keep the thick smooth dark-teal contour and soft glossy rounded casual-game shading of the reference. Front-facing game camera with a slight view of the upper cap, symmetric readable pose; not isometric, not photorealistic. One complete character with feet visible, no ground or shadow, no effects, spores, text, other characters or scene. Object fills most of the square canvas, transparent margin. Genuinely transparent background.

### Промпт облака

Create ONE isolated spore-impact CLOUD sprite, a supporting visual effect for a cute polished 2D mobile slime game. A soft low spreading puff of lime-green and pale yellow mushroom spore dust with a warm softly lit centre and rounded powdery billows. Wide horizontal silhouette, approximately 2:1 width/height, denser in the centre, clearly fading to transparent at every outer edge, no hard contour. A small number of soft tiny glowing green-yellow round spore specks mixed into the cloud. Looks like a heavy mushroom landed and puffed spores sideways. Painterly soft cartoon game VFX, bright clean colours but translucent outer dust, readable over rock tiles. No circular ring, straight rays, spikes, outlined vector shapes, mushrooms, character, ground, text, props or background. One single effect, not a sprite sheet. Genuinely transparent background.

## Проверки

`tools/test_spore_colossus.cjs`: последовательность фаз, четыре удара,
геометрия, награды один раз, пауза, одинаковые результаты при 60 и 10 FPS,
лимит частиц и растровых вызовов, сниженное движение.

`tools/test_spore_colossus_browser.cjs`: настоящее разрушение и награды,
отрисовка всех фаз, тряска, интерфейс превью III стадии без описания,
пауза и обычный игровой кадровый цикл. Браузерные фикстуры изолированы
от сохранения игрока.

