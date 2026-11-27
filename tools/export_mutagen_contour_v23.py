"""Export two contour growth stages; preserve the approved flower and jar byte-for-byte."""
from pathlib import Path
from PIL import Image
import json, shutil, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/mutagen-contour-v23'
DEST=ROOT/'assets/ui/mutation-contour-v23'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
for key in ['infection-1','infection-3']:
    selected='infection-1-clean' if key=='infection-1' else key
    source=Path(json.loads((OUT/f'{selected}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'{key}-master.png')
    im=Image.open(source).convert('RGBA').resize((384,384),Image.Resampling.LANCZOS)
    dest=DEST/f'{key}.webp';im.save(dest,quality=95,method=6)
    a=im.getchannel('A');assert a.getextrema()==(0,255)
    records.append({'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'alpha':a.getextrema(),'coverage':sum(a.histogram()[128:])/(384*384),'bytes':dest.stat().st_size})
old=ROOT/'output/concepts/mutagen-readable-v22'
for record in json.loads((old/'runtime-manifest.json').read_text(encoding='utf-8')):
    if record['key'] in ['infection-5','jar']:
        records.append({**record,'reusedUnchanged':True,'sha256':hashlib.sha256((ROOT/record['path']).read_bytes()).hexdigest()})
        shutil.copy2(old/f"{record['key']}-master.png",OUT/f"{record['key']}-master.png")
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
