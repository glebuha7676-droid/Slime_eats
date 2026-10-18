# Техно: ультимейты 603

| Стадия | Название |
|---|---|
| I | Минный залп |
| II | Турель |
| III | Титан |

В интерфейсе — только названия. III сохраняет меха-слайма: посадку,
десять секунд действия, два бластера, управление и завершение.

## Механика I–II

- Пять мин выбирают разные блоки ниже слайма; разнесены по колонкам и глубине.
  Вылетают из глаза по дугам с интервалом 130 мс. Основная цель получает
  два урона, ближайшие блоки крестом — один. Если цель исчезла до старта,
  мина выбирает другую незарезервированную цель. При пустой шахте не создаются блоки.
- Турель приземляется примерно на три клетки впереди слайма, за 700 мс.
  Блок под ней краснеет и дезинтегрируется. После посадки она работает пять секунд.
- Основание неподвижно. Голова поворачивается плавно со скоростью не более
  восьми радиан в секунду; стреляет после наведения. Интервал выстрелов 200 мс.
  Ищет целые блоки преимущественно ниже себя, не стреляет в колючки и
  не отправляет два снаряда в одну ожидающую попадания цель.
- Снаряд появляется в точке дула повёрнутой головы; летит 110–300 мс.
  Цель краснеет, попадание уничтожает её целиком с красной дезинтеграцией.
  Опыт и исходные колбы +1/+3/+5 выдаются существующей системой разрушения.
- Посадка, полёт мин, поворот, снаряды, покраснение и таймер учитывают паузу.
- Поиск целей использует индекс рядов. Одновременно обычно 1–2 снаряда;
  дезинтеграции ограничены 12 эффектами. Свечение использует общий растровый
  кэш без blur/shadowBlur на каждом кадре. У дезинтеграции нет второго облака
  обычных обломков. Разрушения ульты не заряжают её заново.

Код: `js/abilities/techno-ultimates.js`; подключение и награды — `game.js`;
профили и имена — `js/config/ultimate-stages.js`.

## Сгенерированные ассеты

Встроенный **ImageGen**, прозрачный фон. Стилевой референс:
`effects-lab/assets/techno-drone-red-v1.webp`.

- `assets/vfx/techno-turret-base-v1.webp` — основание, 256×256.
- `assets/vfx/techno-turret-head-v1.webp` — отдельная голова, 256×256.

При экспорте сохранены прозрачные поля и геометрия исходного квадрата.
Точка поворота и дуло измерены на изображении, обе используют одно преобразование.
Исходные PNG сохранены в каталоге Codex
`C:/Users/User/.codex/generated_images/01a0d472-6c77-7802-9042-ac07db6305e8/`:
`exec-c7a2c487-ce2c-4805-804c-d86305576af3.png` и
`exec-c5ed7c41-87f5-41a5-8adb-0fb64c6c071c.png`.

### Промпт основания

Create ONE isolated turret BASE sprite for a cute polished 2D mobile slime mining game. The supplied image is a STYLE AND MATERIAL reference only: match its smooth chunky white-silver metal panels, charcoal/navy outlines, black mechanical joints and bright red accents. Render an empty compact deployable three-legged turret foundation, NO gun, NO turret head. Overhead/top-down orthographic view appropriate for a rotatable 2D game unit on a square tile grid; enough soft bevel shading to read volume, no isometric skew. A low circular hub with a clearly visible round central dark mounting socket, three evenly spaced short chunky stabilizer feet, small red inset lamps at the feet. Broad simple forms, friendly soft contours, readable at 90 pixels. Lighting from upper-left. Socket centred exactly at the centre of the square canvas. Object fills 85% of square canvas, transparent around it, no floor, no cast shadow beyond object, no text or particles. Genuinely transparent background.

### Промпт головы

Create ONE isolated rotatable turret HEAD sprite for a cute polished 2D mobile slime mining game. The supplied image is a STYLE AND MATERIAL reference only: smooth chunky white-silver armour, charcoal/navy outlines, black mechanical joints, bright red lights and lens. Overhead/top-down ORTHOGRAPHIC view, barrel points STRAIGHT DOWN toward the bottom of the image (6 o'clock), never left or diagonal. A compact round armoured rotating gun housing with one red inset sensor, one clearly visible single chunky short cannon barrel extending down, and a distinct red-hot circular muzzle opening at the very bottom of that barrel. No legs, no platform, no foundation. The rotation pivot of the circular housing is EXACTLY the centre of the SQUARE canvas (50%,50%). Circular housing occupies roughly x=27..73%, y=27..73%; gun extends to y=92% on the central x=50% axis; a small rear counterweight extends to y=17%. Keep the muzzle centred on x=50%, y=92%. This is separate modular game artwork to rotate above a matching foundation. Soft bevel volume, simple clean shapes readable at 80px, lighting upper-left, friendly cartoon rendering. No scene, text, firing effects, ground or cast shadow. Genuinely transparent background.

## Проверка

`tools/test_techno_ultimates.cjs`: количество и разнообразие мин, смена
исчезнувшей цели, пустая шахта, посадка и разрушение под собой, пятисекундная
стрельба, плавный поворот, совпадение дула и старта снарядов, задержка попадания,
ограничение частоты/числа снарядов, жилы, пауза и неизменный III уровень.

`tools/test_techno_ultimates_browser.cjs`: активация всех трёх стадий,
отрисовка отдельных слоёв, настоящее уничтожение, XP и колбы, пауза,
названия без описаний и работа в обычном кадровом цикле.
Фикстуры используют отдельное сохранение браузера.

