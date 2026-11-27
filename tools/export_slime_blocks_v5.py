from pathlib import Path
from PIL import Image
import json,shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/slime-blocks-v5'
DEST=ROOT/'assets/world1/slime-blocks-v5'
DEST.mkdir(parents=True,exist_ok=True)
for item in json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))['records']:
    source=Path(item['source']);key=item['tier']
    shutil.copy2(source,OUT/f'block-{key}-master.png')
    image=Image.open(source).convert('RGB')
    image.resize((1024,1024),Image.Resampling.LANCZOS).save(OUT/f'block-{key}.png')
    image.resize((384,384),Image.Resampling.LANCZOS).save(DEST/f'block-{key}.webp',quality=94,method=6)
    print(key,'opaque RGB')
