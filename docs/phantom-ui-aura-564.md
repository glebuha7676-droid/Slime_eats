# Phantom UI aura — 564

The three Phantom conveyor foods and the large laboratory/reward emblem now use
the same `SlimeSpectralGlow` renderer as the slime, companions and express.
The former CSS radial halo has been removed.

`spectral-dom-aura.js` anchors a transparent canvas to each source image, including
its native transparent margins. Resize/load observers update geometry; the food
and its aura share their synthesis animation parent. Inner light follows the
source alpha and generated soft wisp tips sway around fixed contour anchors.

The UI shares image handles and cached light textures, caps canvas DPR at 2,
renders visible auras at 25 fps and stops when hidden or off screen. Reduced
motion draws a stationary aura; removed elements release observers.

Verified at desktop and 360 × 780: all three foods, laboratory emblem, resize,
food replacement and modal reopening. No browser errors. Existing Phantom aura,
rendering, boot, optimization and runtime closure tests pass.

Local release: `dist/slime-yandex-564.zip`.
Screenshots: `tmp/phantom-food-aura-564.png`, `tmp/phantom-emblem-aura-564.png`.
