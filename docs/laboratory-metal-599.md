# Лаборатория: металлическая рамка и развитие

Версия 599, 16 октября 2026.

- Окно лаборатории заполняет игровой контейнер и не имеет внутренней прокрутки.
- Общая тёмно-синяя поверхность и мягкая металлическая рамка по референсу пользователя.
- Крупная эмблема, название, выделенная текущая стадия и голубая полоса личного опыта.
- В развитии открытые стадии показывают еду; закрытые — замок и отдельный прогресс опыта.
- Опыт открывает возможность покупки только следующей стадии. Кнопка «Открыть»
  показывает подтверждение с фактической ценой: II — 50 колб, III — 100.
- Просмотр стадий и отмена подтверждения ничего не покупают. При нехватке колб
  подтверждение показывает недостающую сумму и блокирует оплату.
- Локальный Nunito используется только для лаборатории, включая подтверждение.
  Его файл лицензии автоматически добавляется в релиз рядом со шрифтом.
- Старые стили превью слаймов и нижнего блока эволюции удалены из `slime-progression.css`.

## Рамка

Сгенерирована встроенным инструментом ImageGen по предоставленному пользователем
референсу. Исходник остался в каталоге сгенерированных изображений Codex.
Для игры экспортирована WebP 512×512 с сохранением альфа-канала:
`assets/ui/lab-panel-metal-v1.webp`.

Растягивается по девяти областям: углы сохраняют форму, прямые рейки меняют длину.
Логическая ширина рамки и размер нарисованных уголков задаются отдельно, чтобы
рисунок металла не отнимал лишнюю площадь интерфейса.

### Финальный промпт ImageGen

Create ONE production UI panel frame asset for a cute polished mobile slime laboratory game, matching the supplied reference's OUTER METAL FRAME and DARK BLUE INTERIOR. This is a style/composition reference, not a screenshot to reproduce with its contents. Remove ALL text, food, icons, buttons, progress bars, platform, characters and background scene. Output only a large EMPTY square framed panel, front-facing orthographic, straight parallel sides. The exterior beyond the rounded corners is genuinely transparent alpha; the entire inside is an opaque calm deep desaturated navy-teal blue approximately #20526a with a very subtle central lift, without texture or patterns. Soft thick pale silver mint/cyan metal rails, bright white-cyan thin upper-left bevel highlight, darker teal inner rim, four rounded chunky L-shaped corner caps with one small circular recessed screw each, just like reference. Rails run straight and uniform for 80% of each edge. All corner detail stays within the outermost 13% of the image on both axes so this is usable as a CSS nine-slice border. Total frame thickness about 5% of image width, corner cap footprint about 10%. Frame tightly occupies almost all the square canvas, only 1% transparent padding outside its shape. No drop shadow outside, no text, no extra divider lines inside, no ornaments, no glass glare, no white background, no checkerboard. Rendered soft illustrated casual-game metal, clear clean colors and smooth readable rounded edges, not realistic brushed metal. One panel, not a sprite sheet.
