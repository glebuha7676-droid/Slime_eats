# World background prompt set

Mode: built-in ImageGen, with each matching launch-card cave image used only as a style and palette reference.

Every generated source was converted into a 512 × 1536 lossless WebP tile by `tools/build-world-backgrounds.py`. The second half is a vertical reflection of the first, so the first and final pixel rows match exactly. The runtime additionally overlaps adjacent tiles by 0.65 px to prevent subpixel seams during parallax movement.

## World 1 — Green Depths

```text
Use case: stylized-concept
Asset type: vertically tileable game background texture for a portrait 2D mobile arcade game
Input image: use Image 1 only as the style, rendering-quality, material, and palette reference; create a completely new background asset, not a variation of the framed scene.
Primary request: a distant wall deep inside the Green Depths, made of compact dark earth and softened gray-green stone, with sparse thin roots, tiny moss patches, occasional muted mineral specks, and very subtle humid cave haze.
Style/medium: polished hand-painted casual game art, soft rounded forms, tactile painterly materials, matching the reference image's clean high-quality rendering.
Composition/framing: portrait 2:3, straight-on orthographic wall texture with no perspective, no horizon, no doorway, no central focal object; details distributed naturally and evenly; slightly darker side edges and calm readable center.
Lighting/mood: cool emerald ambient cave light, low contrast, subdued highlights; clearly background depth behind a bright foreground grid.
Seam requirement: designed for infinite vertical repetition; the complete top edge must continue perfectly into the complete bottom edge with matching color, shapes, roots, and lighting; no visible horizontal seam or border when repeated.
Constraints: no foreground blocks or tile grid, no characters, no slime, no UI, no text, no icons, no frame, no portal, no logo, no watermark; avoid large bright spots and avoid a single recognizable landmark.
```

## World 2 — Ice Cave

```text
Use case: stylized-concept
Asset type: vertically tileable game background texture for a portrait 2D mobile arcade game
Input image: use Image 1 only as the style, rendering-quality, material, and palette reference; create a completely new background asset, not a variation of the framed scene.
Primary request: a distant wall in the Ice Cave, layers of deep blue frozen rock under translucent ice, soft cloudy inclusions, faint branching cracks, a few small embedded crystal glints and drifting frost trapped in the surface.
Style/medium: polished hand-painted casual game art, soft rounded forms, tactile icy materials, matching the reference image's clean high-quality rendering.
Composition/framing: portrait 2:3, straight-on orthographic wall texture with no perspective, no horizon, no opening and no central focal object; details distributed naturally; deeper navy side edges and a calm cyan-blue center.
Lighting/mood: cold diffused cyan glow from within the ice, low contrast, no white glare; clearly a distant background behind bright foreground blocks.
Seam requirement: designed for infinite vertical repetition; the complete top edge must continue perfectly into the complete bottom edge with matching cracks, ice layers, color and illumination; no visible horizontal seam or border when repeated.
Constraints: no foreground blocks or tile grid, no icicle frame, no characters, no slime, no UI, no text, no icons, no portal, no logo, no watermark; avoid large crystals and avoid a single recognizable landmark.
```

## World 3 — Candy Factory

```text
Use case: stylized-concept
Asset type: vertically tileable game background texture for a portrait 2D mobile arcade game
Input image: use Image 1 only as the style, rendering-quality, material, and palette reference; create a completely new background asset, not a variation of the framed scene.
Primary request: the distant inner wall of a whimsical Candy Factory: muted chocolate-brown machinery panels, soft strawberry-pink frosting insulation, a few vertical caramel pipes, wafer braces, tiny sugar indicator lights and gentle candy steam, all simplified and recessed into the distance.
Style/medium: polished hand-painted casual game art, soft rounded confectionery materials, playful but coherent factory design, matching the reference image's clean high-quality rendering.
Composition/framing: portrait 2:3, mostly straight-on wall texture, no horizon, no doorway, no central focal machine; broad low-detail areas behind gameplay, repeating vertical industrial rhythm without looking like a foreground block grid.
Lighting/mood: warm pink and raspberry ambient glow with chocolate shadows, restrained saturation and low contrast; clearly background depth behind brighter candy blocks.
Seam requirement: designed for infinite vertical repetition; every pipe, panel tone, frosting drip and light at the complete top edge must continue perfectly into the complete bottom edge; no visible horizontal seam or border when repeated.
Constraints: no foreground blocks or square tile grid, no loose candy focal objects, no characters, no slime, no UI, no text, no icons, no portal, no logo, no watermark; avoid large bright areas and avoid a single recognizable landmark.
```

## World 4 — Magma Core

```text
Use case: stylized-concept
Asset type: vertically tileable game background texture for a portrait 2D mobile arcade game
Input image: use Image 1 only as the style, rendering-quality, material, and palette reference; create a completely new background asset, not a variation of the framed scene.
Primary request: a distant wall in the Magma Core, made of charcoal basalt plates fused together, porous volcanic rock, sparse thin molten seams, faint ember pockets, heat-darkened mineral strata and subtle rising heat haze painted into the surface.
Style/medium: polished hand-painted casual game art, soft rounded rock forms, tactile volcanic materials, matching the reference image's clean high-quality rendering.
Composition/framing: portrait 2:3, straight-on orthographic wall texture with no perspective, no horizon, no cave opening and no central focal object; details naturally distributed; darkest at the side edges with a subdued warm central depth.
Lighting/mood: deep oxblood and charcoal with controlled orange-red underglow, low contrast, no large flames or bright lava field; clearly a distant background behind foreground blocks.
Seam requirement: designed for infinite vertical repetition; the complete top edge must continue perfectly into the complete bottom edge with matching basalt forms, lava seams and illumination; no visible horizontal seam or border when repeated.
Constraints: no foreground blocks or tile grid, no stalactite frame, no characters, no slime, no UI, no text, no icons, no portal, no logo, no watermark; avoid large bright spots and avoid a single recognizable landmark.
```
