"""Export center-grown currency; preserve the approved final stage and jar files."""
from pathlib import Path
from PIL import Image
import json, shutil, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/mutagen-organic-v29'
DEST=ROOT/'assets/ui/mutation-organic-v29';DEST.mkdir(parents=True,exist_ok=True)
records=[]
for key in ['infection-1','infection-3']:
    selected='infection-3-sap' if key=='infection-3' else key
    source=Path(json.loads((OUT/f'{selected}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'{key}-master.png')
    im=Image.open(source).convert('RGBA').resize((384,384),Image.Resampling.LANCZOS)
    dest=DEST/f'{key}.webp';im.save(dest,quality=95,method=6)
    a=im.getchannel('A');assert a.getextrema()[0]==0
    sap=sum(1 for (h,s,v),alpha in zip(im.convert('RGB').convert('HSV').get_flattened_data(),a.get_flattened_data()) if alpha>=128 and 31<=h<=65 and s>=80 and v>=80)/(384*384)
    records.append({'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'alpha':a.getextrema(),'coverage':sum(a.histogram()[128:])/(384*384),'sapCoverage':sap,'bytes':dest.stat().st_size})
old=ROOT/'output/concepts/mutagen-growth-v24'
for record in json.loads((old/'runtime-manifest.json').read_text(encoding='utf-8')):
    if record['key'] in ['infection-5','jar']:
        records.append({**record,'reusedUnchanged':True,'sha256':hashlib.sha256((ROOT/record['path']).read_bytes()).hexdigest()})
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
