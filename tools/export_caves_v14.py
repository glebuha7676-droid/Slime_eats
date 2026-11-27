"""Export clean cave masters, preserving foreground alpha; no mirrored art."""
from pathlib import Path
from PIL import Image
import json, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/cave-parallax-v14'
DEST=ROOT/'assets/backgrounds/caves-v14'
DEST.mkdir(parents=True,exist_ok=True)
records=[]
for world in ['slime','candy','magma','sky']:
    source_dir=ROOT/'output/concepts/cave-parallax-v13' if world=='slime' else OUT
    for layer in ['far','near']:
        key=f'{world}-{layer}'
        source=Path(json.loads((source_dir/f'{key}.source.json').read_text(encoding='utf-8'))['source'])
        shutil.copy2(source,OUT/f'{key}-master.png')
        with Image.open(source) as original:
            im=original.convert('RGBA' if layer=='near' else 'RGB').resize((768,1152),Image.Resampling.LANCZOS)
            dest=DEST/f'{key}.webp';im.save(dest,quality=94,method=6)
            record={'key':key,'path':dest.relative_to(ROOT).as_posix(),'size':im.size,'mode':im.mode,'bytes':dest.stat().st_size,'loopMode':'upright-premultiplied-crossfade','loopBlend':.16,'displayScale':1.65 if layer=='far' else 1.25}
            if layer=='near':
                a=im.getchannel('A');record['alphaRange']=a.getextrema();record['centerAlpha']=[a.getpixel((384,y)) for y in [0,576,1151]]
                assert a.getextrema()[0]==0
            records.append(record)
(OUT/'runtime-manifest.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False))
