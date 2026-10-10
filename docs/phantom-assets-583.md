# Phantom artwork and world arrows — 583

The supplied screenshots were prepared with the built-in imagegen editor as three independent transparent assets. Screenshot controls and backgrounds were removed; the supplied character designs and colours were retained. The generated alpha was trimmed, sized and saved as lossless WebP.

## Runtime assets

- `assets/ui/recipe-categories/emblem-v7-phantom-lossless.webp`: 384 × 384, new circular emblem.
- `assets/vfx/phantom-spirit-mint-v3-lossless.webp`: 256 × 256, mint companion with open smile.
- `assets/vfx/phantom-spirit-blue-v3-lossless.webp`: 256 × 256, blue companion with curved mouth.
- `assets/ui/world-terminal/arrow-soft-v10.svg`: existing code-native arrow redrawn narrower, smaller, with a round tip and softened corners. The transparent button hit area stays unchanged.

All Phantom emblem consumers use v7. Both companions use v3 with existing cached aura and bounded trails. Contour anchors were regenerated from the final alpha so the aura follows the new sprites without pixel reads in the game.

## Built-in editing prompts

Emblem: Extract ONLY the circular phantom emblem from the provided screenshot as a clean transparent game asset. Preserve exactly its mint/teal ghost illustration, surprised oval mouth, golden rim, dark brown outer outline, composition, glossy cartoon shading and colors. No redesign. Remove the entire pale rectangular background and all screenshot buttons/icons. Perfect circular outer silhouette, whole emblem centered, tight balanced transparent margin. No shadow outside the circle.

Mint: Extract ONLY the LEFT mint-green ghost-slime character from the provided screenshot as one standalone transparent game sprite. Preserve its exact silhouette, hooked top curl, dark teal outline, glossy pale green/yellow/mint gradient, big sparkling eyes, smiling open mouth. Do not redesign. Remove the right blue ghost, white background and screenshot buttons. Whole character centered with small even transparent margin. No external aura, no ground shadow, no extra objects.

Blue: Extract ONLY the RIGHT cyan-blue ghost-slime character from the provided screenshot as one standalone transparent game sprite. Preserve its exact silhouette, hooked top curl, dark teal outline, glossy cyan/blue with yellow mint center gradient, big sparkling blue eyes, tiny cat-like curved mouth. Do not redesign. Remove the left green ghost, white background and screenshot buttons. Whole character centered with small even transparent margin. No external aura, no ground shadow, no extra objects.
