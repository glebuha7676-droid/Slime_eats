# Tutorial layout and patrol release — 589

- Memo titles are centred across the whole card. The narrator follows the title inside the card (52 px, 36 px for compact lessons); no reserved side column narrows the text. Only the calm and happy portraits are used. The tilted portrait is excluded from the release asset inventory.
- Food-counter copy: «1 лампочка — 1 еда. Слайм может съесть максимум 3.» A lit counter cell and a food sprite illustrate the connection.
- Body copy uses medium weight; action words, quantities and resource names use stronger weight and a darker blue. Synergy examples remain emblem recipes, with short separate introductory and closing sentences. Plasma copy focuses on breaking vein blocks and spending flasks on mutations/upgrades.
- Horizontal patrol contact at a wall launches the slime above the hazard and inward. The same escape applies during damage immunity and the 72 ms contact cooldown. Ordinary contacts keep their normal bounce. Collision displacement is clamped to the shaft before the frame ends.

## Verification

- `node tools/test_patrol_wall_release.cjs`: actual physics/contact functions, both walls, normal damage, immunity, and contact cooldown; ordinary/static/top contacts unchanged.
- `node tools/test_tutorial_descent.cjs`: authored descent, damage lesson, resources, quests and ability lesson.
- Runtime asset closure and JavaScript syntax checks.
- Browser layout checks on 360 × 640 and desktop.
