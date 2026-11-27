"""Export current flower stages and the compact v18 jar, preserving alpha."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/mutagen-flowers-v19'
DEST=ROOT/'assets/ui/mutation-flowers-v19'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
for key in ['infection-1','infection-3','infection-5','jar']:
    source_dir=ROOT/'output/concepts/mutagen-spread-v18' if key=='jar' else OUT
    source=Path(json.loads((source_dir/f'{key}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'{key}-master.png')
    size=256 if key=='jar' else 384
    with Image.open(source) as original:
        im=original.convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
        dest=DEST/f'{key}.webp';im.save(dest,quality=95,method=6)
        a=im.getchannel('A');coverage=sum(a.histogram()[128:])/(size*size)
        assert a.getextrema()[0]==0
        records.append({'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'alpha':a.getextrema(),'coverage':coverage,'bytes':dest.stat().st_size})
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
