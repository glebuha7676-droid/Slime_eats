"""Export generated infected versions of the approved cave parallax layers."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/infected-caves-v20'
DEST=ROOT/'assets/backgrounds/infected-caves-v20'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
prompts=json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))
for item in prompts['records']:
    key=item['key'];source=Path(json.loads((OUT/f'{key}.source.json').read_text(encoding='utf-8'))['source'])
    item['source']=str(source);shutil.copy2(source,OUT/f'{key}-master.png')
    with Image.open(source) as original:
        im=original.convert('RGBA' if item['layer']=='near' else 'RGB').resize((768,1152),Image.Resampling.LANCZOS)
        dest=DEST/f'{key}.webp';im.save(dest,quality=94,method=6)
        record={'key':key,'world':item['world'],'layer':item['layer'],'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'mode':im.mode,'bytes':dest.stat().st_size}
        if item['layer']=='near':
            alpha=im.getchannel('A');record['alphaRange']=alpha.getextrema();record['centerAlpha']=[alpha.getpixel((384,y)) for y in [0,576,1151]]
            assert alpha.getextrema()[0]==0
        records.append(record)
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(OUT/'final-prompts.json').write_text(json.dumps(prompts,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
