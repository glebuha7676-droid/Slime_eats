# Лаборатория и проверки стадий — 602

- Иерархия: крупная эмблема с эффектом, название и стадия, опыт,
  базовый эффект, развитие с едой, ультимейт и выбор.
- Растягивавшийся пустой блок ульты стал компактным. Место распределено
  между эмблемой, едой и промежутками. Закрытые стадии, просмотр,
  открытие за колбы и подтверждение покупки сохраняются.
- Однотонные поверхности, тёмные информационные блоки, белый основной
  текст, голубые подписи разделов и прогресс, тёплое название ульты.
- Нарисованная рамка сохранена; изменены срезы и масштаб девяти областей,
  чтобы металлические рейки стали заметнее. Малые экраны имеют отдельный масштаб.
- Восстановлен эффект выбранной большой эмблемы. Его геометрия берётся от
  текущего размера, а не старого фиксированного превью; фантомная аура
  остаётся привязанной к изображению. В коллекции нет девяти одновременно
  активных эффектов: главный акцент находится у выбранной мутации.
- Админка: три кнопки I / II / III задают соответствующую стадию всем девяти
  мутациям. Накопленный XP сохраняется, при необходимости добавляется минимум
  для выданной стадии. Уже съеденная еда и внешность в меню обновляются.
  Повторное нажатие не создаёт дубликатов мутаций.
- Снежный ком: прежние 50 м и три клетки, время полёта 1250 мс вместо 2250.
  Вращается само изображение. Убраны аура и дополнительные движущиеся детали;
  остаётся ограниченный снежный след без аддитивного свечения.

## Новый снежный шар

Создан встроенным ImageGen, прозрачный фон. Итоговый игровой файл:
`assets/vfx/frost-snowball-v2.webp`, 256×256 с альфа-каналом.
При экспорте размеры нормализованы до круглого силуэта.

Исходник:
`C:/Users/User/.codex/generated_images/01a0d472-6c77-7802-9042-ac07db6305e8/exec-2c7a3b27-90ae-4966-acec-fc3bf2b8196e.png`.

Промпт:

Create ONE isolated game sprite: an ordinary rolling snowball made of packed white powdery snow. Cute polished hand-painted casual mobile game style, softly rounded and clean, matching a friendly slime game. One coherent roughly spherical snowball, NOT a cluster of icy bubbles or separate boulders. White matte fluffy packed snow, subtle fine granular snow texture, a few shallow uneven grooves and dents to make rotation visible. Gently irregular round outline, a small amount of soft pale blue shading for volume, modest thin blue-grey cartoon contour. Keep highlights subdued and snowy, NOT glossy, glassy or icy. Three-quarter lit spherical volume but front view, no perspective ground. No face, eyes, symbols, aura, glow, particles, trail, platform, ground shadow, text or background. Snowball fills most of the image with transparent margins. Genuinely transparent background.

## Проверка

`tools/test_laboratory_layout.cjs`: девять мутаций на 320×568, 390×844 и
1280×1000, отсутствие обрезанных секций и текста, эффект эмблемы,
переключение админских стадий I→II→III→I, сохранение XP и обновление
косметики уже накормленного слайма. Только изолированные браузерные сохранения.
`tools/test_elemental_ultimates.cjs` и браузерная проверка подтверждают
дальность, ширину, сохранение жил, остальные ульты и паузу после ускорения.
