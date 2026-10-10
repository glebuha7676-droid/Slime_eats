# Мягкая лаборатория — версия 568

Опорный стиль: `experience.css` (результаты забега) и `tutorial.css` (обучение). Прежняя версия сохранена в `checkpoint-567-published`.

## Изменения

- Новый спокойный фон лаборатории с продолжающимся полом. Контакт слайма с подиумом привязан к существующей тени и учитывает масштаб главного экрана.
- Новое спокойное превью первого мира. Угол камеры, игровая глубина и условия открытия мира не менялись.
- Светло-голубые поверхности кнопок и бирюзовые стрелки используют палитру и объём результатов забега. Счётчик использует мятную поверхность из обучения.
- Корпус синтезаторов и эффекты мутаций не затемнялись. Подписи, шрифты, размеры и раскладка существующих кнопок сохранены.

## Проверка

- Встроенный браузер: ПК 1280 × 720, телефон 390 × 844, компактный телефон 360 × 740.
- После первого блюда счётчик обновляется и доступна золотистая кнопка «Играть».
- У закрытого мира скрыты название и метры; сохранены серый замок, требование 10 уровня и неактивный запуск.
- На обеих ширинах основание портала находится на задней части поверхности подиума, контакт слайма — ближе к передней части.
- `synth-terminal-art` сохраняет `filter: none`. Скрытые подписи боковых кнопок остаются скрытыми.
- Проверки `test_room_launch`, `test_full_stomach`, `test_boot_loader`, `test_runtime_asset_closure` прошли. JS исходника и собранного runtime проходит `node --check`.
- Сборка `dist/slime-yandex-568.zip`: 325 файлов, 320 ресурсов, 53 860 779 байт без сжатия. GitHub в этой итерации не обновлялся.

## Ресурсы

Встроенный imagegen, style-transfer. Экспорт WebP quality 92/method 6; PNG остаются исходниками в каталоге сгенерированных изображений.

| Файл | Размер |
|---|---|
| `assets/ui/home-laboratory-soft-v6.webp` | 960 × 1440 |
| `assets/ui/world-terminal/mine-blue-essence-calm-v2.webp` | 960 × 540 |
| `assets/ui/world-terminal/arrow-soft-v4.svg` | Кодовое обновление существующей системы стрелок |

### Лаборатория: промпт

Use case: style-transfer. Asset type: opaque portrait 2:3 background illustration for a friendly children's slime laboratory game. Image 1 is the existing room and composition/style reference, not a UI to reproduce.
Generate a new cleaner softly rounded cartoon laboratory, matched to pale ice-blue UI cards, mint-cyan jelly buttons, navy-blue outlines and a vivid lime-green slime which is rendered separately. Harmonious restrained dusty blue-teal wall (#548693 / #6597a3), muted silver-blue structures, a soft pale mint-blue platform; not an intense cyan or green room. The style is polished painted mobile cartoon game art with smooth shading and soft broad highlights, not realistic metal or photorealism.
IMPORTANT exact portrait composition: frontal symmetrical room in the upper 60% of the canvas; broad quiet center wall behind the character. One simple ceiling lamp at the top, at most one chunky simple pipe at each far outer edge. Very few broad panel seams, no little decorative items. The round platform is centered horizontally: its ellipse top surface extends from approximately y=44% to y=57%, with the center of the ellipse at (50%,51%); its softly rounded front thickness ends at y=61%. The platform spans about 80% of the canvas width. Use a gently elevated frontal perspective so the separately rendered slime can stand at the center-front of the top surface and a circular portal can stand behind it on the rear part of the SAME top surface.
The floor extends seamlessly from the sides and front of this platform all the way down to the BOTTOM of the portrait canvas, the lower 39% is quiet unobstructed continuous blue-teal floor, subtly shaded but no objects, no tiles, no patterns, no tiny seams. Floor should fade softly to one calm blue-teal color at the bottom with no hard edge, so equipment UI can cover it without visual joins. Do not crop the platform. Avoid glowing tanks, glass bottles, plants, bright green light hotspots, busy textures, rivets, multiple lights, harsh metallic bevels, dark dramatic lighting, scattered debris. Keep the center quiet but friendly and bright enough.
Only background room, platform and floor. No slime, character, portal, food, train, icons, text, buttons, interface, frames, borders or labels. Portrait 2:3 composition, full bleed.

### Превью мира: промпт

Use case: style-transfer. Asset type: rectangular first-world preview for a children's slime game, opaque wide 16:9 landscape illustration. Image 1 is the current preview and game block material reference. Regenerate a calmer cleaner version of this blue-essence underground world. Keep stylized large chunky cubic rock blocks and sky-blue liquid veins INSIDE some blocks, not bottles. The scene is an inviting underground descending rock passage with a simple clear sense of depth, framed by a small number of large rounded cube blocks on left and right, with quiet dark teal negative space in the central half where world title will be overlaid. Friendly soft painted cartoon game art, clean silhouettes, gently rounded corners, smooth restrained shading. Use mostly muted slate blue, subdued warm ochre and teal, with only two modest cyan essence deposits, one each side; veins are visibly blue but not glaring neon. Far fewer blocks and no tiny block details: no pebble debris, small cracks, bolt shapes, noisy textures, moss, plants, particles or sparks. No dramatic glowing effects, no glossy photorealistic rocks, no realism. Crisp broad readable shapes suitable for a small horizontal rectangle on mobile; clearly communicates a cube-rock world with blue essence without drawing more attention than the character. No slime, characters, food, text, buttons, symbols, frame or UI. Full bleed landscape.
