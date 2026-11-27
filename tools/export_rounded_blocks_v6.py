"""Copy built-in imagegen masters and export game-sized WebP assets."""
from pathlib import Path
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/concepts/rounded-blocks-v6'
for item in json.loads((OUT / 'prompts.json').read_text(encoding='utf-8'))['records']:
    key = item['key']
    master = OUT / f'{key}-master.png'
    shutil.copy2(item['source'], master)
    if key.startswith('slime-'):
        dest = ROOT / 'assets/world1/slime-blocks-v6' / f"block-{key.removeprefix('slime-')}.webp"
    else:
        dest = ROOT / 'assets/world3/candy-blocks-v2' / ('caramel-strong.webp' if key == 'candy-caramel' else 'cracker-fragile.webp')
    dest.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(master) as image:
        image.convert('RGB').resize((384, 384), Image.Resampling.LANCZOS).save(dest, quality=94, method=6)
    print(dest.relative_to(ROOT))
