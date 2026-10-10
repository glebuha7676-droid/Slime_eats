# Phantom aura — 585

- Removed independent rotating wisps. The near glow and inner light remain fixed to the sprite alpha.
- Only the diffuse outer fringe moves: four cached 192 px frames, smoothly blended over a 3.4 second cycle. Blur is prepared once per sprite, without per-frame allocations or pixel reads.
- DOM aura geometry now uses its actual effect container as the origin. This compensates for inset and scaled layouts, keeping food and mutation emblems aligned.
- Verified the Phantom mutation card at 390 × 844 and 1280 × 900, and the slime after eating two Phantom foods.
- Passed Phantom aura, Phantom rendering, DOM geometry, runtime asset closure and release syntax checks. Built the Yandex release 585.
