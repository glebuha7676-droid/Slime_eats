"""Export generated clean slime parallax, retaining the near layer's alpha."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/cave-parallax-v13'
DEST=ROOT/'assets/backgrounds/slime-cave-v13'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
for layer in ['far','near']:
    source=Path(json.loads((OUT/f'slime-{layer}.source.json').read_text(encoding='utf-8'))['source'])
    shutil.copy2(source,OUT/f'slime-{layer}-master.png')
    with Image.open(source) as original:
        image=original.convert('RGBA' if layer=='near' else 'RGB').resize((768,1152),Image.Resampling.LANCZOS)
        dest=DEST/f'slime-{layer}.webp'
        image.save(dest,quality=94,method=6)
        record={'layer':layer,'path':dest.relative_to(ROOT).as_posix(),'size':image.size,'mode':image.mode,'bytes':dest.stat().st_size}
        if layer=='near':
            alpha=image.getchannel('A')
            record['alphaRange']=alpha.getextrema()
            record['centerAlpha']=[alpha.getpixel((384,y)) for y in [0,576,1151]]
            assert max(record['centerAlpha'])==0
        records.append(record)
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
