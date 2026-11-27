"""Preserve built-in generation masters and export game-size textures."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/slime-magma-blocks-v9'
for record in json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))['records']:
    key=record['key']
    master=OUT/f'{key}-master.png'
    shutil.copy2(record['source'],master)
    dest=ROOT/('assets/world1/slime-blocks-v6/block-fragile-bubbles-v9.webp' if key.startswith('slime') else f'assets/world4/rounded-blocks-v4/{key}.webp')
    dest.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(master) as im:
        im.convert('RGB').resize((384,384),Image.Resampling.LANCZOS).save(dest,quality=94,method=6)
    print(dest.relative_to(ROOT))
