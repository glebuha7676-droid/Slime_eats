# Mass destruction optimization — checkpoint 591

## Changes

- Flask rewards update the save in memory immediately. Presentation and persistence are batched once per animation frame; pause and run completion flush pending rewards. The counter shows the combined gain.
- Decorative particles have a budget before allocation, with reserved capacity for resource feedback. Isolated impacts retain their original particle count; dense bursts reduce surplus shards. Expired particles/effects are compacted in place.
- Shard silhouettes, colors and highlights are rendered into a bounded cache of small bitmaps. Fixed impact effects outside the camera are skipped. Nearby block queries use the existing row index.
- Decorative effect limits preserve projectiles that carry delayed frost transformations. No terrain destruction, resource value or ultimate distance is reduced.
- Adaptive decorative density now responds to simulation plus rendering cost, falls faster under load and recovers slowly.

## Verification

An isolated browser test destroyed the same 100 blocks using the actual destruction functions, with mixed +1/+3/+5 veins. Both versions awarded 298 flasks. On the local desktop browser (1280 × 720, DPR 1):

| Metric | Before | After |
| --- | ---: | ---: |
| Synchronous destruction task | 96.6 ms | 1.8 ms |
| Persistence calls for the burst | 100 | 1 |
| Particles allocated before trimming | 1657 | 136 |

These are single local measurements of the destruction task, not a guarantee of device frame rate. The test fixture and private save keys remain in ignored `tmp/` files and are excluded from the game release.

Automated checks cover complete reward accounting, one save/UI job per burst, explicit lifecycle flush, particle allocation limits, protected frost projectiles, indexed neighbours, block impact appearance, ultimate hazard destruction/charge, glitch ultimates, techno, phantom, psionics, frost veins, tutorial descent, and the 20-row cosmos ultimate distance at 60/30/10 FPS. Runtime asset closure and the release JavaScript syntax also pass.

GitHub Pages runs the mass-effects and block-impact regression checks before deployment.
