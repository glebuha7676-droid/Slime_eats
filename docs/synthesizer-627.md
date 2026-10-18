# Синтезатор, 627

Более массивный корпус, спокойная колба со скруглёнными плечами и увеличенная
ниша выдачи. Вместо цилиндрического пьедестала — плоская полка. Эмблема
целиком помещается в проёме. Новая сатиновая двустворчатая дверца перекрывает
весь проём; прозрачные поля изображения компенсированы внутри маски ниши.
Больших белых бликов на колбе и дверце нет.

Портретный корпус 1190×1322 используется в высоком окне; широкий 1327×1186 —
в коротком. Оба с новой нишей и полкой. Поле подсказки на всю ширину основания.
Рисунки сохраняют пропорции; жидкость, дверь и выдача привязаны к ним отдельно.

Создано встроенным imagegen с прозрачностью, сохранено в WebP:

- `assets/ui/lab-synth-machine-stocky-portrait-v1.webp`
- `assets/ui/lab-synth-machine-stocky-v1.webp`
- `assets/ui/lab-synth-door-satin-v1.webp`

## Промпт широкого корпуса

Use case: redesign a cartoon game appliance using the reference's soft painted style. Create a NEW wider, stockier, bulky mutation synthesizer, replacing the reference's small low output hatch. Overall WIDTH:HEIGHT about 1:1.12. Transparent alpha background, fill the canvas with small 2% margin, front view slight top-down perspective. Friendly chunky pale icy blue metal, dark teal outlines, clean cyan. Soft MATTE/SATIN finish, restrained small edge highlights. NO big white reflection streaks, NO blown-out shine.
LAYOUT: a large proper scientific glass flask on the LEFT taking about 58% of width; a substantial rounded-rectangular reservoir with softly rounded shoulders, nearly straight sides and wide round belly, short neck and a small filling funnel on top. Empty clear dark teal glass, no liquid/bubbles. Few quiet thin reflections at edges, no large white blobs. It sits securely in a thick metal cradle.
RIGHT: an enlarged OUTPUT CHAMBER, a chunky integrated cabinet with a deep OPEN SQUARE dark-teal niche, at mid height, connected to the flask by a short thick turquoise pipe. Actual usable niche approx x=.65..94, y=.42..68; make it square in pixels, at least 30% of the appliance width. The square chamber has enough height and depth to fit one big circular mutation medallion comfortably. The floor is a simple flat shallow shelf, NO raised cylinder, NO big pedestal, NO objects, no door (door animated separately), no medallion. This output chamber is significantly larger than the tiny hatch in the reference but never a tall vertical shaft. Thick soft rounded metal frame, dark teal interior, gently rounded inner corners. 
Along the BOTTOM a wide solid control console supports BOTH flask and output unit. One generous BLANK dark-teal rectangular text panel with a soft metal rim spans almost the whole console width, approx x=.12..88,y=.79..91. Big enough for 2 short readable lines. Small chunky feet at bottom. Balanced massive silhouette, construction feels mechanically plausible, upper-right may have a short pipe arch. No unnecessary knobs, screens, gauges, wires, symbols, text, buttons, decorations. Single unified new appliance, no separate pieces. Keep the soft high quality painted mobile game art of reference, not low poly and not realistic. Main changes: wider weightier body, proper quieter flask, LARGE SQUARE OUTPUT NICHE raised to mid height, completely flat shelf, wide full-width text plate below. Genuine transparent background.

## Промпт портретного варианта

Use case: precise structural edit of the supplied cartoon laboratory synthesizer. Preserve this new design, its wide chunky pale blue metal base, big right output niche with flat floor, short top connecting cyan pipe, quiet matte glass shading and small funnel. Change the overall silhouette to a MODERATELY PORTRAIT canvas: approximately 1150 pixels WIDE and 1280 pixels TALL. HEIGHT MUST BE GREATER THAN WIDTH. Whole object fills canvas with 2% transparent margin. The reference is currently too squat; increase the HEIGHT of the LEFT GLASS VESSEL BODY by about 30 percent, with a proper roomy flask reservoir with nearly straight sides and softly rounded shoulders, not an orb. This height should be useful glass area, not a long neck or empty space. Keep its overall width generous, soft short neck and funnel. Glass remains EMPTY clear dark teal with subdued edge shading, no liquid, no bubbles, no large white reflections.
The RIGHT OUTPUT NICHE must remain a LARGE SQUARE IN ACTUAL PIXELS, about 30% of total object width; do NOT stretch its opening vertically. Align the bottom of the right square niche with the bottom of the flask body. Enclose it in a solid chunky cabinet connected to the pipe above. No door, no medallion, no platform cylinder. Simple flat floor only. The output opening must comfortably hold a circular medallion. Raise the top pipe to follow the taller flask and bend it down naturally into the right cabinet. Reduce large white shine streaks everywhere; satin soft metal edges, gentle clean colors.
The FULL-WIDTH BLANK TEXT PANEL at the base should also be a LITTLE TALLER, enough for two readable lines, keeping a dark teal interior and rounded metal frame. No text. Small chunky feet. Same front view with slight top-down perspective, same soft polished hand painted cartoon game style. Preserve coherent construction and the thick weighty silhouette. The change is a taller proper flask and slightly taller text plate within a PORTRAIT appliance that is still broader and more substantial than a long thin tower. No gauges, clutter, symbols, text, knobs. Transparent background with genuine alpha. Single full sprite, full object visible.

## Промпт дверцы

Use case: precise game asset edit. Create ONLY the separate door cutout for the output niche of the SECOND reference, using the first reference double door as construction reference. Two simple equal cyan panels with a thin dark central seam, together forming ONE softly rounded rectangle, overall WIDTH:HEIGHT=1.15:1. They fully close the entire dark niche, edge to edge. No external housing frame, no handles, hinges, symbols, text or platform. Soft hand-painted cartoon style matching the second reference. SATIN finish and gentle light cyan top transitioning very subtly to medium cyan-blue below. A thin pale edge bevel provides volume. Remove the first reference's large white glints and bright reflection streaks: NO big white blobs or shiny strips, NO glow. Keep dark teal fine outline, softly rounded outer corners approximately 10% radius, central seam straight and perfectly centered. Door silhouette must occupy the whole canvas, transparent background only outside rounded corners with at most 1% safety margin. The second reference's machine is for material/niche context ONLY; DO NOT render any part of the machine. Only a single isolated complete double door asset on genuine transparent alpha background.

## Проверка

`tools/test_synth_layout.cjs`: 320×568, 390×844 и настольный контейнер,
отсутствие обрезки, читаемая подсказка, пропорции обоих корпусов, частичная
и полная заливка, выдача эмблемы. Предыдущие версии графики сохранены.
