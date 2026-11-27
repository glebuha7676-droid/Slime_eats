"""Export generated three-tier resource overlays and currency jar with alpha."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/mutagen-blooms-v16'
DEST=ROOT/'assets/ui/mutation-blooms-v16'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
for key in ['infection-1','infection-3','infection-5','mutagen-jar']:
    source_key='infection-5-stronger' if key=='infection-5' else key
    source=Path(json.loads((OUT/f'{source_key}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'{key}-master.png')
    size=256 if key=='mutagen-jar' else 384
    with Image.open(source) as original:
        im=original.convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
        dest=DEST/('jar.webp' if key=='mutagen-jar' else f'{key}.webp')
        im.save(dest,quality=95,method=6)
        alpha=im.getchannel('A');hist=alpha.histogram();coverage=sum(hist[128:])/(size*size)
        record={'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'alpha':alpha.getextrema(),'coverage':coverage,'bytes':dest.stat().st_size}
        assert alpha.getextrema()[0]==0
        records.append(record)
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
