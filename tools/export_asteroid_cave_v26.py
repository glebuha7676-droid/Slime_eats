"""Export generated asteroid blocks and four cave layers, preserving generated alpha."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/asteroid-cave-v26'
records=[]
keys=['block-fragile','block-normal','block-strong','source-clean-far','source-clean-near','source-infected-far','source-infected-near']
selected={'source-clean-far':'source-clean-far-contrast','source-clean-near':'source-clean-near-clean','source-infected-far':'source-infected-far-dense','source-infected-near':'source-infected-near-dense'}
for key in keys:
    sourceKey=selected.get(key,key)
    source=Path(json.loads((OUT/f'{sourceKey}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'{key}-master.png')
    block=key.startswith('block-');near=key.endswith('-near')
    dest=ROOT/('assets/world6/asteroid-blocks-v26' if block else 'assets/backgrounds/asteroid-cave-v26')/f'{key}.webp'
    dest.parent.mkdir(parents=True,exist_ok=True)
    size=(384,384) if block else (768,1152)
    im=Image.open(source).convert('RGBA' if block or near else 'RGB').resize(size,Image.Resampling.LANCZOS)
    im.save(dest,quality=95 if block else 94,method=6)
    record={'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'mode':im.mode,'bytes':dest.stat().st_size}
    if near:
        a=im.getchannel('A');record['alphaRange']=a.getextrema();record['centerAlpha']=[a.getpixel((384,y)) for y in [0,288,576,864,1151]]
        assert a.getextrema()[0]==0 and a.getextrema()[1]>=240
        assert max(record['centerAlpha'])==0,'Near layer must preserve the open playfield'
    records.append(record)
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
prompts={'selectedSources':selected,'history':json.loads((OUT/'initial-prompts.json').read_text(encoding='utf-8'))+json.loads((OUT/'infected-prompts.json').read_text(encoding='utf-8'))+json.loads((OUT/'source-revision-prompts.json').read_text(encoding='utf-8'))}
(OUT/'final-prompts.json').write_text(json.dumps(prompts,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
