"""Normalize each generated damage family with one shared framing transform."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/hostile-cores-v27'
DEST=ROOT/'assets/vfx/hostile-cores-v27';DEST.mkdir(parents=True,exist_ok=True)
records=[]
for family in ['shell','heart']:
    images=[]
    for hp in [100,75,50,25]:
        key=f'{family}-{hp}';source=Path(json.loads((OUT/f'{key}.source.json').read_text(encoding='utf-8'))['source'])
        shutil.copy2(source,OUT/f'{key}-master.png')
        im=Image.open(source).convert('RGBA')
        if images and im.size!=images[0][2].size:im=im.resize(images[0][2].size,Image.Resampling.LANCZOS)
        bounds=im.getchannel('A').point(lambda p:255 if p>=32 else 0).getbbox()
        images.append((key,hp,im,bounds))
    w,h=images[0][2].size
    bounds=(max(0,min(i[3][0] for i in images)-4),max(0,min(i[3][1] for i in images)-4),min(w,max(i[3][2] for i in images)+4),min(h,max(i[3][3] for i in images)+4))
    scale=752/max(bounds[2]-bounds[0],bounds[3]-bounds[1])
    size=(round((bounds[2]-bounds[0])*scale),round((bounds[3]-bounds[1])*scale))
    offset=((768-size[0])//2,(768-size[1])//2)
    for key,hp,im,_ in images:
        sprite=Image.new('RGBA',(768,768));sprite.alpha_composite(im.crop(bounds).resize(size,Image.Resampling.LANCZOS),offset)
        dest=DEST/f'{key}.webp';sprite.save(dest,quality=95,method=6)
        assert sprite.getchannel('A').getextrema()[0]==0
        records.append({'key':key,'family':family,'hp':hp,'path':dest.relative_to(ROOT).as_posix(),'size':sprite.size,'sharedCrop':bounds,'sharedOffset':offset,'sharedSize':size,'bytes':dest.stat().st_size})
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'final-prompts.json').write_text(json.dumps(json.loads((OUT/'base-prompts.json').read_text(encoding='utf-8'))+json.loads((OUT/'damage-prompts.json').read_text(encoding='utf-8')),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
