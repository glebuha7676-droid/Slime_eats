"""Export generated wrapping vines and compact green jar without painting artwork."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/mutagen-wrap-v21'
DEST=ROOT/'assets/ui/mutation-wrap-v21'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
for key in ['infection-1','infection-3','infection-5','jar','thorns-block']:
    source=Path(json.loads((OUT/f'{key}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'{key}-master.png')
    size=256 if key=='jar' else 384
    im=Image.open(source).convert('RGBA')
    if key=='jar':
        # Keep the visible silhouette within the previous icon's exact pixel footprint.
        old=Image.open(ROOT/'assets/ui/mutation-flowers-v19/jar.webp').convert('RGBA')
        target=old.getchannel('A').point(lambda p:255 if p>=128 else 0).getbbox()
        bounds=im.getchannel('A').point(lambda p:255 if p>=128 else 0).getbbox()
        crop=im.crop(bounds)
        crop.thumbnail((target[2]-target[0],target[3]-target[1]),Image.Resampling.LANCZOS)
        im=Image.new('RGBA',(size,size))
        im.alpha_composite(crop,((target[0]+target[2]-crop.width)//2,(target[1]+target[3]-crop.height)//2))
    else:
        im=im.resize((size,size),Image.Resampling.LANCZOS)
    dest=DEST/f'{key}.webp';im.save(dest,quality=95,method=6)
    a=im.getchannel('A');coverage=sum(a.histogram()[128:])/(size*size)
    assert a.getextrema()[0]==0
    records.append({'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'alpha':a.getextrema(),'coverage':coverage,'visibleBounds':a.point(lambda p:255 if p>=128 else 0).getbbox(),'previousBounds':target if key=='jar' else None,'bytes':dest.stat().st_size})
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
