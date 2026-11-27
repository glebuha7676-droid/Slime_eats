"""Export three growth overlays and measure their visible yellow-lime sap area."""
from pathlib import Path
from PIL import Image
import json, shutil, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/mutagen-growth-v24'
DEST=ROOT/'assets/ui/mutation-growth-v24'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
for key in ['infection-1','infection-3','infection-5']:
    selected='infection-1-readable' if key=='infection-1' else key
    source=Path(json.loads((OUT/f'{selected}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'{key}-master.png')
    im=Image.open(source).convert('RGBA').resize((384,384),Image.Resampling.LANCZOS)
    dest=DEST/f'{key}.webp';im.save(dest,quality=95,method=6)
    a=im.getchannel('A');assert a.getextrema()==(0,255)
    # Read-only color measurement, excluding purple tissue and pale petal rims.
    sap=sum(1 for (h,s,v),alpha in zip(im.convert('RGB').convert('HSV').getdata(),a.getdata()) if alpha>=128 and 31<=h<=65 and s>=80 and v>=80)/(384*384)
    records.append({'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'alpha':a.getextrema(),'coverage':sum(a.histogram()[128:])/(384*384),'sapCoverage':sap,'bytes':dest.stat().st_size})
old=ROOT/'output/concepts/mutagen-readable-v22'
jar=next(m for m in json.loads((old/'runtime-manifest.json').read_text(encoding='utf-8')) if m['key']=='jar')
records.append({**jar,'reusedUnchanged':True,'sha256':hashlib.sha256((ROOT/jar['path']).read_bytes()).hexdigest()})
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
