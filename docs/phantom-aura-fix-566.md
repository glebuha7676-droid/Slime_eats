# Phantom aura regression — 566

The shared aura used `getImageData` to find sprite-contour anchors. Pixel access
may throw `SecurityError` when an image is not origin-clean (including local
file/browser restrictions). That exception escaped the render loop, interrupting
menu/body rendering. The previous renderer reproduces the exception when pixel
reads are denied; the corrected renderer does not need those reads.

`tools/prepare_spectral_contours.py` now prepares the same eight contour anchors
from the alpha of 23 original sprites. `js/config/spectral-contours.js` is loaded
before the aura renderer; asset aliases and URL encoding are resolved for lookup.
Tinted ghost canvases reuse their original bitmap's contour metadata.

Outer/inner glow still uses the actual alpha through canvas compositing. All
bitmap assets are unchanged. No runtime pixel readback, no additional per-frame
allocation and no reduced outline quality.

Regression test: all aura contexts throw if `getImageData` is called. The body,
inner glow and animated contour-tip tests pass. A private browser fixture also
denies all canvas pixel reads and uses the reported Techno/Phantom/Cosmos menu.

Release: `dist/slime-yandex-566.zip`.
