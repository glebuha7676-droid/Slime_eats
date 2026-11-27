from pathlib import Path
from PIL import Image
import json,shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/terrain-weave-v4'
for item in json.loads((OUT/'home-prompts.json').read_text(encoding='utf-8'))['records']:
    key=item['key'];source=Path(item['source'])
    shutil.copy2(source,OUT/(key+'-master.png'))
    image=Image.open(source)
    # Terrain faces are opaque. Unlike the overlay, no alpha is exported.
    if image.mode=='RGBA':
        assert image.getchannel('A').getextrema()==(255,255), 'Generated terrain must be opaque'
    image=image.convert('RGB')
    image.resize((1024,1024),Image.Resampling.LANCZOS).save(OUT/(key+'.png'))
    image.resize((384,384),Image.Resampling.LANCZOS).save(ROOT/f'assets/world1/slime-blocks-v4/block-{item["tier"]}.webp',quality=94,method=6)
    print(key,'RGB opaque')
