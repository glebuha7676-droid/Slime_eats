# Дверь и завершение синтеза — 573

Дверь создана встроенным imagegen по референсу нового корпуса. Ассет: `assets/ui/lab-synth-door-soft-v2.webp`, 240×252, прозрачные углы, WebP quality 95. При открытии обрезается только дверь, эмблема свободно пульсирует за границами отсека. Лишние CSS-кольца и свечение за эмблемой отключены. Вспышка синяя, по центру камеры; круглый силуэт виден только во вспышке перед сливом. Вспышка использует короткий переход opacity без фильтров; дверь и пульсация эмблемы используют transform.

Стрелки `assets/ui/world-terminal/arrow-soft-v8.svg` увеличены, имеют контрастную мягкую бирюзовую заливку без подложки.

## Промпт двери

Use case: stylized-concept. Asset type: transparent raster sliding door sprite for a children's slime laboratory game. Reference image 1 is the current machine, use it ONLY to match its soft blue enamel style and colors. Generate ONE isolated closed vertical rectangular outlet door, viewed exactly front-on, width to height ratio 600:630. It must fit the dark right-hand outlet of the reference. Rounded corners radius approximately 12% of width, gently bevelled soft blue-teal enamel face, simple subtle central vertical seam, calm slate blue and teal palette with dark blue perimeter edge. Nearly fills the whole canvas, transparent outside rounded corners, no surrounding frame. No machine, no glass, no pipes, no additional objects. No circles, green glow, symbols, text, LEDs, hazard stripes or bright white stripes. Children's glossy cartoon game sprite, soft highlights, crisp clean contour, restrained detail. Door face remains opaque. Full width and full height tightly cropped sprite.
