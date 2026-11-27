"""Assemble captured browser frames at their original timing for visual review."""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

kind = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('electric', 'frost', 'cosmos', 'techno', 'phantom', 'psionic', 'glitch', 'spores') else 'fire'
root = Path(f'output/{kind}-core-v1' if kind != 'fire' else 'output/fire-style-v3')
for reserve in (100, 5):
    folder = root / f'preview-{reserve}'
    meta = json.loads((folder / 'frames.json').read_text())
    frames = [Image.open(folder / item['file']).convert('RGB') for item in meta]
    times = [item['time'] - meta[0]['time'] for item in meta]
    durations = [max(20, round((times[i+1]-times[i])*100)*10)
                 if i+1 < len(times) else 60 for i in range(len(times))]
    frames[0].save(root / f'{kind}-{reserve}.gif', save_all=True,
                   append_images=frames[1:], duration=durations, loop=0, optimize=False)
    sheet = Image.new('RGB', (540, 1092), (17, 35, 45))
    draw = ImageDraw.Draw(sheet)
    samples = (0, .7, 1.2, 1.8, 2.4, 3.1, 3.4, 3.7, 4.3, 4.9, 5.5, 6.2) if kind == 'techno' else (0, .5, 1, 1.5, 1.95, 2.25, 2.55, 2.85, 3.25, 3.65, 4.15, 4.7)
    for n, target in enumerate(samples):
        idx = min(range(len(times)), key=lambda j: abs(times[j]-target))
        thumb = frames[idx].copy()
        thumb.thumbnail((180, 250))
        x, y = n % 3 * 180, n // 3 * 273
        sheet.paste(thumb, (x, y+20))
        draw.text((x+4, y+3), f'{times[idx]:.2f}s', fill='white')
    sheet.save(root / f'timing-{reserve}.png')
    print(reserve, len(frames), round(sum(durations)/1000, 2))
