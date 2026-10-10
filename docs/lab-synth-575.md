# Исправления дверцы и вспышки — 575

Новая дверца создана встроенным imagegen, сохранена как `assets/ui/lab-synth-door-soft-v3.webp` (240×269, WebP95). Убрана повторная широкая рамка. Размер закрывает весь проём, включая нижнюю площадку. Удалена старая CSS-ручка `.mutation-dispenser-flap::after`.

По последнему уточнению силуэт эмблемы полностью убран. Итоговая версия 579: бело-голубое ядро быстро раскрывается на всю ширину колбы, мягкий голубой bloom немного выходит за рамку. Края дополнительно рассеяны плавными градиентами, площадь увеличена. Дверца расширена на 8% и увеличена по высоте на 4%, без смещения выдаваемой эмблемы. Два слоя света используют screen и анимацию opacity/transform, без размытия фильтром и без частиц. Разлёт около 0,1 с, полное затухание 0,5 с. Затем начинается слив. Исходные сроки остальных шагов сохранены.

Референс характера вспышки: https://zy-vfx.itch.io/burst-fx-06 (яркое ядро, раскрытие света и короткий bloom). Изображения референса в игру не добавлялись.

## Промпт двери

Edit target: image 1 is the current closed laboratory door sprite. Remove its wide outer rim/frame completely. Keep the same two soft blue-teal enamel door panels and subtle dark vertical seam in the middle, but make these panels fill the entire tightly cropped sprite up to its outside edge. Only a very thin dark contour on the outside, no second inner outline. Shape is a front-on vertical rounded rectangle, width:height 185:208, corner radius about 10% of width. Same gentle glossy cartoon material, blue and teal colors, children's slime laboratory game. Image 2 is a style and fit reference: the door must cover the entire dark right-hand outlet opening including the mint tray area at its bottom, and the surrounding outlet frame is ALREADY in image 2, so do not draw another frame in the sprite. No horizontal handle, no horizontal line, no glass, no button, no text, no symbols, no glow. Transparent only outside the softly rounded outer corners. Produce only the isolated tightly cropped closed sliding door face, not the whole machine. Preserve the original panel colors and soft highlights, do not add new decorations.
