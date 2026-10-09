# Phantom portal — release 563

Generated with the built-in image_gen tool. Native transparent alpha preserved.
Runtime asset: `assets/vfx/phantom-portal-v1-lossless.webp` (384 × 576, lossless WebP, 221292 bytes).
Saved project path: `C:/Users/User/Desktop/Копай глубже/assets/vfx/phantom-portal-v1-lossless.webp`.
Original: `C:/Users/User/.codex/generated_images/01a0d472-6c77-7802-9042-ac07db6305e8/exec-34d2f6cb-b691-4198-956b-01258885edd7.png`.

## Final generation prompt

Generate one production-ready transparent raster sprite for a bright child-friendly 2D slime laboratory mobile game. An upright magical ghost portal, frontal view, tall softly rounded teardrop-oval opening. NOT a UI icon, no metal frame, no text, no character. Style: glossy soft jelly slime, thick smooth dark teal contour only close to the material edges, smooth mint green, cyan and pale icy blue highlights, very readable silhouette at 60 pixels. The irregular soft gel rim bends like a ghost slime flame; slight asymmetry at the top, four little wispy curls in the sides, elegant rather than spiky. Inside: deep teal translucent spiritual vortex, a gentle curved luminous milky mint spiral moving toward a dark central doorway, no solid white fill. A generous soft wide mint/cyan glow hugging the portal outline and fading outward, sparsely a few small sparkles integrated. Raster painted game sprite, polished rounded toy-like 2D game art with rich smooth gradients, matches cute glossy mint ghost slime with round face. Whole portal visible, centred with 15 percent transparent padding on all sides. Transparent background with genuine alpha. No floor, no shadows on a floor, no mockup, no lettering, no rectangular backdrop, no grid, no vector diagram, no thin plain circular rings.

## Runtime

- Upright passage and flattened train portal share the same bitmap, with near lip drawn over the train.
- Shared spectral glow: actual alpha-based internal and external light textures, built once per image. Strong internal light uses screen blending. Base aura remains fixed; only soft raster flame tips sway around eight anchors sampled once from the actual contour.
- Slime, spirits, train and rail tiles use the same glow. Internal slime light is drawn after its body and before its face; external light shares the body's transform.
- Train wake: three bounded fading silhouette draws.
- Two spirits retain generated artwork, with cached mint/blue tints and different proportions.
- Spirit realm: one 256 × 256 light texture; wash expands from the entry point over 620 ms.
- Materialization splash: 850 ms, cached soft light sprites; no vector rings or rays.
- Cosmos: opposite orbit periods about 5.5 / 8.7 seconds; static ring and planet glow textures cached.
- Cosmos ultimate: clamped to 20 cell heights, then normal physics resumes during 420 ms cosmetic fade.

## Aura tip asset

`assets/vfx/spectral-aura-wisp-v1-lossless.webp` — 192 × 288, lossless WebP, 30322 bytes; built-in image_gen, genuine alpha preserved.
Saved project path: `C:/Users/User/Desktop/Копай глубже/assets/vfx/spectral-aura-wisp-v1-lossless.webp`.

Final prompt: A single tiny translucent spectral flame wisp sprite for a cute glossy 2D slime game. No characters, no eyes, no face, no text. A soft curved tongue of ghostly mint green and icy cyan light, wispy upward taper ending in a gently curved small tip, its broad root is at the bottom centre. The root blends into nothing without a hard base. Very soft blurred luminous external edges, brighter milk-mint internal glow, airy transparent layers. It should look like a tongue at the fuzzy outer edge of a ghost aura, NOT a solid cartoon flame with an outline, NOT fire sparks. Small polished game VFX raster brush. Pale mint core, cooler turquoise shadows, extremely soft halo fading smoothly into true transparent background. One isolated vertical wisp centred with generous transparent margins. No circle, no ring, no metal, no scene, no solid black background. Genuine alpha transparency.
