# Ультимейты спор — 605

## Изменения

- I «Споровой хлопок»: короткое сжатие 240 мс, один удар вокруг игрока и шесть грибочков веером вниз. Каждый отскакивает два раза; урон и происхождение от ульты сохраняются. Следующая ульта от их разрушений не заряжается.
- II «Грибная дорожка»: четыре споры в разных столбцах и на разной глубине. Последовательный запуск через 180 мс; после роста — взрывы и маленькие помощники по прежним правилам.
- III «Грибной великан»: цельный сердитый слайм-гриб без ног, с низкой тяжёлой шляпкой. Пять самостоятельных прыжков с чередованием сторон. Каждый прыжок продвигается на три ряда вниз независимо от игрока и камеры.
- При приземлении уничтожает ядро 3×3 вокруг точки удара, внешняя область получает один урон. Обычные награды за жилы и опыт сохраняются.
- Усилено сжатие перед прыжком, плавное пружинящее вытягивание при отрыве и затухающая упругость после удара. Рисунок закреплён за нижней точкой тела.
- В лаборатории только имена новых ульт, без описаний.

## Графика

Встроенный ImageGen, прозрачный фон. Новый игровой файл:
`assets/vfx/spores-giant-mushroom-v2.webp`, 384×245, около 30 КБ.
Исходник: `C:/Users/User/.codex/generated_images/01a0d472-6c77-7802-9042-ac07db6305e8/exec-0519409e-d533-4933-be95-f1bd740ae6e6.png`.
Референсы: предыдущий великан и существующий маленький слайм-гриб.

### Финальный промпт

Use case: stylized-concept. Create ONE transparent-background production game sprite: a heavy angry giant SLIME-MUSHROOM for the same cute glossy cartoon game as the references. Image 1 is the old giant to REPLACE; image 2 is the small slime-mushroom style reference. The new giant must have a single uninterrupted very wide squat gelatinous lime-green/teal SLIME body with a smooth rounded flat-ish bottom. ABSOLUTELY NO feet, paws, legs, arms, roots, toes, stalk, neck, accessories, ground or shadows. An enormous heavy broad red-orange mushroom cap with cream spots sits LOW and presses down on the slime, sagging over its forehead, cap brim nearly touching the eyebrows. The cap/body together form a squat heavy silhouette wider than tall, like a dense living slime boulder. Stern squinting dark glossy green eyes looking directly at viewer, angled brows, determined small frown, somewhat angry but child-friendly. Not happy, no smile. Keep saturated lime/teal body, warm red-orange/cream cap, strong dark teal outline, soft glossy painted gradients and restrained highlights exactly consistent with the reference art. Front-facing game camera, subtly see top of cap, symmetrical clear readable silhouette, whole character centered with small transparent margin. Separate clean alpha, no text, no particles, no scenery. Emphasize low pressing cap and great weight. No limbs whatsoever.

## Оптимизация

Кешированные растровые облака и споры. Пул 24 частиц на всплеск/великана, не больше трёх облаков, отсечение невидимых рисунков. Споры в полёте теперь тоже растровые. Убраны живые размытия спор, их колб и маленьких помощников; заряд II стадии использует облако вместо построения градиента каждый кадр. Удары великана проверяют только соседние индексированные ряды, срабатывают один раз, создают три обломка на блок. Глобальные лимиты массовых эффектов сохранены.

## Проверки

- `tools/test_spore_colossus.cjs`: пять прыжков при неподвижном игроке, независимость от камеры и частоты кадров, урон/награды один раз, пауза, лимиты, шесть помощников I стадии.
- `tools/test_spore_colossus_browser.cjs`: все фазы, настоящие награды, I–III способности и превью, движение маленьких помощников, отсутствие ошибок JavaScript.
- `tools/test_ultimate_stages.cjs`, `tools/test_ultimate_charge.cjs`, `tools/test_mass_effects.cjs`: активации стадий, отсутствие заряда от отложенного урона ульт, ограничения эффектов и сохранение наград.

Изолированная подача 240 наборов команд отрисовки великана занимала около 10–11 мс на этой машине. Это не время полного игрового кадра и не замер GPU.

