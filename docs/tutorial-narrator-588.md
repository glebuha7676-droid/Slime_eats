# Tutorial narrator and lessons — 588

- Fire II demo runs for 3.6 seconds: burning rock, impact, four pieces separating, travelling flame, neighbour igniting. It uses existing raster artwork, opacity and transform animations; no particle loop or live blur.
- Synergy memo title: СИНЕРГИИ. Copy: «Мутации могут улучшать друг друга. Экспериментируй, ищи интересные сочетания!» Examples show Frost + Fire and Fire + Frost + Electric emblems.
- Optional quests have a yellow edge/label, darker blue surface and larger copy. Their placement logic remains under Forms.
- Three transparent narrator portraits occupy 76 px at the top card edge, half inside and half outside. Title space is reserved. Portraits: explain, think (synergies), happy (Fire/form). Content can scroll on short screens independently of the portrait.

## Generated assets

Built-in imagegen, then alpha margin trim and downsampling to 256 × 256 lossless WebP (about 178 KB total):

- `assets/ui/tutorial/narrator-explain-v1.webp`
- `assets/ui/tutorial/narrator-think-v1.webp`
- `assets/ui/tutorial/narrator-happy-v1.webp`

## Prompts

Shared prompt: Use case identity-preserve. Transparent raster tutorial narrator sprite for the child-friendly slime game. The reference screenshot provides the actual default face and colours; the clean body asset provides silhouette and materials. Preserve the recognizable lime-green to teal glossy slime, dark green thick outline, rounded pear-drop body and soft top bump, white highlights, large green pupils and white eye rims, peach cheeks. Add round dark navy/teal smart glasses with clear lenses, fitted to the face. Front view, looking directly at the player. Soft polished 2D game sprite, no realism or vector look. Isolated full character on transparent background. No portal, laboratory, floor, shadow, card, text, hat, books, clothing, human hands or extra characters. Readable at 70 px, identical glasses and palette across poses.

1. Explain: upright friendly explaining pose, calm warm closed smile, engaged open eyes, body leaning slightly toward viewer. No arms or extra appendages.
2. Think: thoughtful and happy, body subtly tilted six degrees, curious raised eyebrow, small knowing smile, open eyes toward player. No arms or extra appendages.
3. Happy: excited discovery, body softly stretched upward, happy open mouth, large open eyes with bright highlights toward player. No arms or extra appendages.
