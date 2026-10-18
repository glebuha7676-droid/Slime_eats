# Синтезатор, 626

Новая конструкция заменяет портретный корпус 625: округлая широкая колба,
нижняя консоль с большим текстовым полем слева и компактным люком справа.
Длинной выходной шахты нет. Подсказка переносится на две строки, размер
шрифта зависит от ширины самого рисунка. Жидкость повторяет округлый контур,
поверхность и пузырьки движутся отдельно. Выдача использует прежнюю квадратную
двустворчатую дверцу, привязанную к новой нише. На телефонах используется
новый корпус; широкий старый вариант остаётся только для совсем низкой области.

Встроенный imagegen, прозрачный фон. Ассет:
`assets/ui/lab-synth-machine-round-v1.webp` — 1122×1402.
Референс материала и рисовки: `assets/ui/lab-synth-machine-tall-v1.webp`.

## Промпт

Use case: game-asset redesign, using the reference ONLY for its painted style and cyan/pale metal materials. Invent a NEW silhouette and layout for a friendly cartoon mutation synthesizer. Do not preserve the reference's tall narrow output tower. A polished soft mobile game sprite, front view with slight top-down perspective, transparent alpha background, overall canvas width:height 4:5, appliance fills canvas with small 2% margin.
NEW STRUCTURE: upper two thirds is ONE large wide rounded glass laboratory vessel, with gently domed shoulders, a short neck and small funnel at top left. Vessel sits in a chunky rounded metal cradle. Wide vessel should feel like a round-bellied flask, not a long rectangular aquarium. The clear glass is EMPTY dark teal with restrained soft edge reflections and a subtle elliptical floor, no liquid or bubbles because those are animated separately.
The LOWER THIRD is a sturdy integrated console. LEFT lower console: a LARGE BLANK dark teal rectangular information plaque with soft metal rim, ample empty writing space for 2-3 lines, occupying approximately x=.10..61, y=.73..91. RIGHT lower console: a COMPACT SQUARE output hatch with rounded corners, approximately x=.67..91, y=.73..92. Inside hatch an OPEN dark teal niche with a small cyan pedestal at its bottom. NO DOOR, no emblem, no objects inside. Hatch must be square in actual pixels, NOT tall, NOT a vertical tube. Its height is roughly one quarter of the main glass window height. A short curved turquoise pipe subtly connects the vessel to this compact lower output module along its right side, without dominating the composition.
Main glass usable window approximately x=.11..88,y=.19..64. Blank label and square hatch are SIDE BY SIDE at same lower-console height. Feet small at bottom corners. Design a cohesive pleasing appliance with a compact rounded base and generous glass. Same soft hand painted cartoon as reference, clean cyan, icy blue metal, deep teal outlines, beveled rounded edges, friendly simple shapes. Avoid gritty textures, realistic materials, neon glow, clutter, unnecessary knobs/screens/gauges, cables. NO TEXT, no buttons, no icons, no decorative objects. Single complete new appliance sprite. Clear intentional large text space and compact square output. Genuine transparent background.

Проверено: `tools/test_synth_layout.cjs`, телефоны 320×568 и 390×844,
настольный контейнер; полная и частичная заливка, анимация выдачи.
