# Phantom redesign — local release 561

## Runtime

- Stage I: one mint spirit, a flight every 5 seconds when there is a cluster of at least two ordinary/strong rocks. Marks 2–4 rocks; spectral cracks make a regular hit deal 2 damage. Marks last until destruction.
- Stage II: adds a blue spirit. Opens an optional portal ahead every 10 seconds; portal lasts 7 seconds. Contact starts 3 seconds of intangibility with free steering. Exit breaks the occupied rock and marks rocks in the next two rows. Safe materialization avoids spikes and special obstacles.
- Ultimate: 360 ms button introduction, then 2.8 seconds for spirits, portal, railway, train and fade. Clears four columns through twelve rows as the train advances. Spikes can be destroyed; vein rewards use the normal once-only reward path. Slime falls slowly during opening, then follows the train.
- Release 561 adds the user's new mint body and generated raster companions; see the refinement section below.
- Rendering: two generated raster spirits with cached 96 px glows, cached body alpha aura, bounded row queries, at most two live portals, simple crack strokes and tiled WebP rails. Train and rails add approximately 509 KB of lossless WebP assets. No large animated image sheets or per-frame full-terrain scans.

## Generated assets

Built-in imagegen, transparent output, original alpha preserved. Prepared with Pillow: alpha-bounds crop, Lanczos downsize, lossless WebP.

- `assets/vfx/phantom-express-train-v1-lossless.webp` — 291 × 1200, locomotive and two carriages, forward direction down.
- `assets/vfx/phantom-express-rails-v1-lossless.webp` — 224 × 640, vertical track segment.

### Train prompt

Use case: stylized-concept. Production sprite for a bright children's mobile game with glossy, rounded cartoon laboratory buttons and soft slime characters. Generate ONE ghost train consisting of a cute chunky steam locomotive and TWO short attached carriages, strictly orthographic TOP DOWN VIEW, train pointing straight DOWN (toward bottom of image), centered vertically. Locomotive at bottom, two wagons above, connected in a straight line. Entire train visible with generous transparent margin. Friendly toy-like proportions, clear readable silhouette, rounded dark teal metal forms, silver pale mint edges, translucent turquoise/mint spectral surfaces, aqua luminous windows and little ghostly pale green accents. Stylized high-quality painted mobile game asset, bold clean contour, soft highlights, no realism, no perspective/isometric angle, no scary faces, no skulls, no text, no rails, no ground, no backdrop, no large glowing aura baked around silhouette. The train remains tangible and visually legible; spectral glow and animation will be added in code. Transparent alpha background. Shape suitable for a vertical sprite spanning four block widths; locomotive wider than carriages. Save result as an asset and return local image path.

### Railway prompt

Use case: stylized-concept. Production game sprite for the same bright polished children's cartoon laboratory-and-slime game. ONE short straight vertical segment of normal railway track, strictly ORTHOGRAPHIC TOP DOWN, no angle or perspective. Two parallel silver steel rails running from exact top edge to exact bottom edge, on five evenly spaced chunky rounded dark desaturated wooden sleepers. Clean bold dark teal contour, soft mobile-game painted highlights, readable at small sizes, silver rail heads, little rounded steel fasteners. Segment tiles seamlessly along its vertical direction: uniform rails, no tapered ends, equal margins and repeating sleeper spacing. Object fills central 75% of width and full height. No environment, no gravel, no soil, no train, no smoke, no particles, no glow (spectral cyan overlay will be coded), no text, no icons, no scene. TRUE transparent alpha outside railway. The rail segment is an ordinary physical railway that will be made ghostly in code. Single isolated sprite.

## Checks

`node tools/test_phantom_cycle.cjs` verifies target selection, cadence, damage, portal contact, phase duration, safe exit, progressive train damage, spikes, vein rewards and cleanup. Existing Cosmos, Techno, Glitch, ultimate hazards/charge, optimization and runtime asset-closure suites remain applicable. `tools/prepare_phantom_review.cjs` produces a private browser fixture with its own save key; it does not touch the player save.


## Refinement — release 561

- Stage I: one mint raster spirit; original slime body/eyes; no slime aura.
- Stage II: second blue spirit and exact body contour aura; original body colour/eyes remain. Spirits make separate smooth flights (1.8–3 seconds), never perform missions together. Portals appear on arrival at the outbound endpoint, before the return. Flat upright mint/blue portals distinguish them from the train portal.
- Each spirit leaves a tapered trail along its recent path, bounded by 240 ms, seven segments and 1.45 sprite widths. The blue spirit is slightly more transparent.
- Ultimate: new uploaded mint body, with its silhouette preserved. Uniform scaling/padding accommodates the existing animated face. The train nose emerges at the portal centre; front/back rim compositing keeps the hole behind the train. Corridor: four cells wide, twelve rows long.
- Aura uses the actual current body alpha and exactly the same body rectangle/rotation/squash transform. Glow masks are cached per image; no blur or canvas allocation per frame. Procedural bodies use the real current body path.

### New final runtime assets

- `assets/vfx/phantom-spirit-mint-v2-lossless.webp` — 384 × 366, 99,128 bytes.
- `assets/vfx/phantom-spirit-blue-v2-lossless.webp` — 384 × 355, 97,380 bytes.
- `effects-lab/assets/phantom-ultra-body-v7-lossless.webp` — 768 × 768, 210,494 bytes. Body artwork 664 × 588, uniformly scaled, no baked face/aura. Native alpha, lossless WebP.

### Mini spirit prompt set (built-in imagegen)

References: existing Phantom v6 body and actual menu screenshot `tmp/phantom-menu-560.png`.

Use case: stylized-concept. Create ONE tiny companion GHOST SLIME sprite for the exact game shown in the references. Image 1 is the EXISTING PHANTOM SLIME BODY: take its compact rounded teardrop silhouette, curled single upper tip, scalloped wavy lower edge, cool milky translucence, broad subtle inner smoky spiral shapes and dark teal outline as the design foundation. Image 2 is the actual game screenshot: use ONLY the main slime's simple happy face, readable round eyes and glossy painted mobile-game rendering as style guidance; do not reproduce its UI or scene. The requested companion is a SMALL MINIATURE PHANTOM SLIME, slightly wider and squat, facing perfectly straight at the viewer. Add two simple shiny dark pupils in small white eye sockets and a tiny warm smile in the same visual language as the game's slime. Restrained cute face, no anime eyes, no eyebrows, no exaggerated pink cheeks. Soft dimensional shading and clear contour identical in spirit to the reference phantom body. NO ARMS, NO HANDS, NO LEGS, no octopus tentacles, no generic bedsheet ghost body. Keep lower edge softly wavy like the reference, not a long narrow tail. No accessories, no text, no props, no shadows, no floor, no scene, no aura outside the body; external aura and short trail will be added in code. ONE isolated whole character, centered, native transparent alpha background, clean usable silhouette.

Mint suffix: Variant A: pearly white body with restrained pale MINT spectral shading and softly mint-tinted internal curls. Save as game sprite and return local path.

Blue suffix: Variant B: pearly white body with restrained ICE BLUE spectral shading and softly blue-tinted internal curls, slightly different small upper curl but same body style/proportions. Save as game sprite and return local path.

### New body extraction prompt (built-in imagegen)

Edit target: user upload `C:/Users/User/Downloads/Глянцевый мятный слайм-призрак.png`.

Use case: background-extraction. Edit target: the attached glossy mint phantom slime body. Remove ONLY the white background to native transparent alpha. Preserve the EXACT body silhouette, curled upper tip, wavy lower edge, dark teal outline, mint/green/yellow colors, every highlight and internal shading. Do not redraw, restyle, reshape or deform the body. Leave the center empty: NO face, eyes, mouth or added features; the game overlays its animated face. No aura, no shadow, no floor, no extra objects. Keep whole body with clear transparent padding, clean antialiased edges. Return saved transparent PNG path.

### Additional checks

`test_phantom_rendering.cjs`: bounded trails, smooth tangent at waypoints, generated sprites, correct train reveal centre/front/back order. `test_phantom_aura.cjs`: actual alpha masks, shared body geometry for variants/sizes, caching, unchanged stage II face/colour, no stage I aura. `test_phantom_spirits.cjs`: staggered missions, portal opens on arrival, safe phasing, twelve-row express/rewards.


## Final additions in 561

- Phantom ultra body is drawn 12% larger uniformly. Aura uses the same enlarged rectangle. Animated face proportions stay readable.
- New emblem: `assets/ui/recipe-categories/emblem-v6-phantom-lossless.webp`, 640 × 640, 313,028 bytes, lossless alpha. Actual medal bounds (alpha > 12): [4, 7, 636, 632]; conveyor fit uses these bounds. Home badges, mutation cards, recipes and ability HUD use the new asset. Phantom card/synth accents match the mint palette.
- Techno mech blasters: 90 ms beam flight/red scan, immediate destruction on arrival, same 460 ms red disintegration as drone. Strong rocks and spikes work; vein credit and feedback occur once. Paused target tint timestamps shift once even when shots share a target.

### Emblem prompt (built-in imagegen)

Use case: precise-object-edit. Asset type: Phantom mutation emblem for a glossy children's slime laboratory game. Image 1 is the existing emblem: retain its round composition, polished golden rim with brown outer edge, bold clean contour, dark glossy teal inset, and exactly the same readable overall badge proportions. Image 2 is the new mint Phantom slime body: replace ONLY the central white ghost with a miniature of THIS mint/sea-green spectral slime. Match its curled top tip, broad rounded body, softly wavy scalloped bottom, dark teal outline, yellow-mint upper glow and turquoise lower shading. Add the emblem's two simple small black oval eyes with white highlights, friendly and looking directly forward. The central figure must be large, crisp and legible at 48 pixels, with a restrained pale mint contour glow against a deep navy-teal inset. Keep the glossy soft cartoon rendering, not realistic, not flat vector. NO extra spirits, no arms, no hands, no skull, no text, no numbers, no aura outside the badge. One entire circular emblem centered, native transparent alpha outside the outer rim. Keep generous clear edge padding. Return saved path.

### Browser checks

Desktop and 360 × 780: new ultra face/body/aura, two companions, portal arrival/return, train emergence and progressive destruction. Private Techno fixture: red scan before impact, two destroyed reinforced blocks with red breakup. No console warnings/errors observed. Release ZIP includes all new assets, excludes QA fixtures and original source art.
