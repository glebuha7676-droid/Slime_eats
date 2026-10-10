# Единая конструкция лаборатории — 569

Создана встроенным imagegen в режиме редактирования по двум референсам.
Цель: спокойный корпус в гамме новой лаборатории, с мягкими краями и меньшим количеством декоративных швов.

## Ассет

`assets/ui/synth-terminal-soft-v2.webp` — 925 × 1110, WebP quality 95, сохранена прозрачность.
Исходный `synth-terminal-base-v1.webp` сохранён для возврата.
Положение гнёзд, экран, заголовок, ниша кнопки, CSS сетка и координаты `syncTerminalInsets` не менялись.
Базовые размеры совпадают с прежним ассетом; при экспорте применено только масштабирование всего изображения.

## Референсы

- Edit target: `assets/ui/synth-terminal-base-v1.webp`
- Palette/style: `assets/ui/home-laboratory-soft-v6.webp`

## Prompt

Use case: precise-object-edit / style-transfer.
Asset: transparent raster chassis for a children's slime laboratory game. EDIT IMAGE 1. IMAGE 2 is only a palette and illustration style reference, not a composition reference.
Repaint and simplify the entire unified three-food synthesizer + world selection console in IMAGE 1 to match the calmer laboratory in IMAGE 2. Friendly softly shaded painted cartoon plastic/enamel, muted blue-teal/slate structure, pale blue-gray rim, softly rounded edges, reduced harsh metallic shine. Strongest contrast should remain available for the separate bright gameplay buttons and icons that will be overlaid by code. Keep the blank bays a calm mid-deep teal rather than black. Remove tiny decorative seams and bolt clutter. Soft readable form and modest highlights. It must still look like one sturdy laboratory machine.

CRITICAL INVARIANTS: preserve the exact canvas aspect ratio 925:1110, the exact silhouette and registration of every functional opening. Do NOT recenter, recompose, expand margins, change perspective or move any element. The original object's layout is an immutable stencil. Original coordinates in a 925 by 1110 canvas:
three round top socket centers (190,65), (462,65), (736,65); inner holes about98x100;
three food pedestal centers x190,462,736, same exact oval contact surfaces and height as original, upper oval around y328-379 and base down to410;
central blank heading recess x314 y425 width297 height54;
world display interior x148 y501 width631 height358;
bottom blank PLAY button recess x171 y905 width583 height173.
All these boundaries must stay pixel-aligned proportionally with IMAGE 1 so existing UI sprites will fit perfectly. Keep all three round sockets, the two vertical separators and the three oval pedestals exactly positioned and the same size. Redesign material and simplify decorative surface lines only. World display remains empty, heading empty, bottom play recess empty. Do not draw any actual text, buttons, arrows, icons, creatures, food, liquid, bubbles, landscapes or added interface. Preserve transparent outside silhouette, no background scene. No glow effects, noise, photorealism or shiny chrome. Full object reaches the same canvas edges as original.

## Проверка

Вёрстка проверяется в реальной игре на 390 × 844, 360 × 740 и 1280 × 720.
Загрузка использует актуальный манифест; релиз Яндекса собирается из той же замкнутой группы runtime-ассетов.

## Дополнительная правка

Обновлены мягкие стрелки v5. Удалён общий прямоугольный inset box-shadow при нажатии: все кнопки главного экрана, гнёзда синтезаторов, кнопки лаборатории и их псевдоэлементы теперь без CSS box-shadow. Объём остаётся нарисованным в ассетах и градиентах. Портал и основание сдвинуты вместе на 7 px вниз. Полоса XP и верхние кнопки выровнены по центрам; усилен контраст текста XP. Кнопка «Играть» получила более мягкие углы и светлую неактивную поверхность.
