# Синтезатор, 625

Высокий корпус заполняет свободную область портретной лаборатории. На коротких
экранах остаётся прежний широкий корпус. Выбор зависит от реальной пропорции
свободного места, а не от размера всего экрана. Изображения не растягиваются.
Жидкость, воронка, вспышка, дверь, подпись и выдача эмблемы привязаны к окнам
каждого рисунка отдельно. В обучении обводка измеряет видимый вариант корпуса.

Графика создана встроенным imagegen с прозрачностью, затем сохранена в WebP:

- `assets/ui/lab-synth-machine-tall-v1.webp` — 1122×1402.
- `assets/ui/lab-synth-door-tall-v1.webp` — 743×2117.

## Промпт корпуса

Use case: precise-object-edit. Create a new taller portrait version of the supplied cartoon laboratory mutation synthesizer game sprite. The supplied image is the design/style reference and the edit target. Preserve its soft friendly hand-painted mobile game look, rounded chunky pale icy blue metal, clean teal outlines, cyan glass and turquoise pipes, simple uncluttered construction. This asset must fill the tall empty space in a portrait game panel: redesign the appliance to an overall WIDTH:HEIGHT ratio of 4:5, filling almost the entire canvas with only a 2% transparent safety margin. This is a functional appliance sprite, NOT a full interface or background. Enlarge the main left glass reservoir dramatically vertically so it occupies the center and lower center, with a large rounded rectangular front window. Main tank should be tall, nearly square rather than a short wide fish tank. The main glass interior should be clear dark teal, with subtle glossy reflections ONLY near the edges and a small cyan elliptical floor at its bottom, empty, no liquid level, no floating objects, no bubbles. Keep the small funnel at the upper-left connected to the top of this tank. A turquoise pipe runs horizontally from the top of the main tank to the upper-right, bends down into a smaller right dispenser compartment. Keep an OPEN dark teal output niche on the right with a cyan pedestal at its bottom; NO DOOR, no emblem, no character inside. The niche is tall and rounded rectangular. Keep the right dispenser an integral part of the cabinet so the machine is one cohesive structure. Keep a blank dark teal horizontal inset nameplate across the lower front under both windows, for later programmatic text, and short chunky feet with small mint lights. Preserve restrained trim and bevels. Keep the same front view and slight top-down 2.5D perspective as the original; the reservoir, dispenser, nameplate and feet must sit on one consistent perspective. Do not add decorative gauges, switches, buttons, symbols, text, extra rooms, screens or clutter. Transparent background with genuine alpha. The whole appliance must be taller by redesigned structural geometry, never by stretching the old image. Important intended layout guide in fractions of the canvas: main glass roughly x=0.10..0.65, y=0.24..0.78; right output niche roughly x=0.71..0.93, y=0.46..0.79; blank bottom nameplate roughly x=0.18..0.83,y=0.84..0.92. It should look like the same beloved machine, a larger tall model filling the panel. Single asset only, polished crisp cartoon game art.

Референс: `assets/ui/lab-synth-machine-soft-v2.webp`.

## Промпт дверцы

Use case: precise-object-edit. Edit the supplied square cartoon cyan double door into a TALL NARROW version for the right output niche of the second reference laboratory machine. Output only the DOOR cutout, no machine, no outer metal frame. Preserve the first reference's soft rounded glossy cartoon cyan glass panels, teal edge, subtle edge highlights, central straight dark seam. Two equal vertical panels together form ONE tall rounded rectangle. Overall width:height ratio 1:2.85, filling the entire canvas with only a tiny transparent margin. Same front-facing slight top view as reference machine. Top and bottom corners softly rounded, no protruding handles, no buttons, no hinges, no text, no icons. This should close the full niche on the machine, with gentle clean aqua color, darker blue lower section, reflections restrained at edges. Redraw its geometry naturally for a tall door rather than stretching the source highlights. Transparent background with genuine alpha. Single asset.

Референсы: `assets/ui/lab-synth-door-soft-v5.webp`, новый высокий корпус.

Проверка: `tools/test_synth_layout.cjs` — 320×568, 390×844 и настольный
контейнер; заполнение, пропорции, отсутствие обрезки и выдача мутации.
