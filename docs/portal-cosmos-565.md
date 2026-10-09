# Phantom portal and Cosmos orbits — 565

Built-in **imagegen** tool, genuine alpha, then proportionate 512 px lossless
WebP export with Pillow. Original generated images were preserved.

## Saved assets

- `assets/vfx/phantom-portal-round-v2-lossless.webp`
- `assets/vfx/cosmos-orbit-nebula-v1-lossless.webp`

Original outputs under `C:/Users/User/.codex/generated_images/01a0d472-6c77-7802-9042-ac07db6305e8/`:

- `exec-a2b13bf8-1650-479d-82dc-e793ff535812.png`
- `exec-657ae89d-e132-41af-b905-7c97b94d68c5.png`

## Portal prompt

Use case: precise-object-edit. Edit target: the supplied mint/cyan ghost portal game sprite. Make a NEW ROUND portal version for the same cute colorful glossy slime laboratory game. Square canvas, front facing perfectly circular opening, centred. Keep the same soft glossy ghost gel/flame rim, mint green and icy cyan colours, deep teal swirling magical interior, cute child-friendly polished game sprite aesthetic. The outer wispy rim follows a circle (equally wide and tall), small organic soft tips only, NOT a tall pointed flame or oval. Readable dark circular inner whirlpool with luminous turquoise swirling currents, a few tiny sparks. No stone or metallic frame, no text, no character. Keep the entire circular sprite and soft glow inside frame with generous transparent margin on every side, genuine alpha transparent background. This is a single still sprite; the game will animate it gently. Match the existing reference's illustrated glossy material exactly, not photorealistic.

Reference/edit target: `assets/vfx/phantom-portal-v1-lossless.webp`.

## Orbit prompt

Use case: stylized-concept. Asset type: 2D VFX texture for two planetary orbits in a cute glossy slime laboratory game for children. One circular galactic dust belt, front view, centred square composition on genuine alpha transparent background, empty fully transparent large centre (about 68% of total diameter). A slender luminous ring made of SOFT NEBULA CLOUDS and textured stardust, bright violet/magenta blending into electric blue and icy cyan, uneven richer cloud patches, small delicate twinkling tiny white dots, a few small four-point star glints. Soft feathered edges. It must feel magical and cosmic, illustrated and playful, compatible with colorful polished glossy slime sprites, NOT photographic space, NOT a clean vector stroke or geometric outline. The cosmic haze lies ONLY along the ring, never in the transparent centre. No planets, no characters, no words, no background or black disc, no objects outside the ring. Entire outer soft glow fits inside canvas with transparent margin. The ring should remain delicate rather than a thick donut: bright thin core with softly diffused cloud wisps.

## Runtime

Portal: square sprite with gentle breathing, small rim sway and slow rotation of
a cached, softly masked inner vortex. The spirit chooses a safe target 5–8 rows
ahead, preferring approximately 6.5 rows. Portal still opens on arrival.

Orbits: generated nebula bitmap instead of stroked circles, slowly rotating
with the orbit. Seven small twinkles per orbit fade out before relocating to a
new point on its exact collision radius. Removed former stars around the body.
Tinted nebula and star sprites are cached; no per-frame texture allocation or blur.
Planet rotation speeds, damage cooldowns and twenty-row ultimate remain intact.

Verified: Phantom cycle/rendering, Cosmos contacts/ultimate distance and cached
orbit visuals. Local release `dist/slime-yandex-565.zip`.
