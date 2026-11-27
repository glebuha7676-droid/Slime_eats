"""Export selected imagegen masters; keep original canvases and alpha intact."""
from pathlib import Path
from PIL import Image
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/concepts/anomaly-source-v3'
OUT.mkdir(parents=True, exist_ok=True)
records = json.loads((OUT / 'sources.json').read_text(encoding='utf-8'))
manifest = []
backgrounds = {}
for item in records:
    name = item['name']
    src = Path(item['source'])
    shutil.copy2(src, OUT / (name + '-master.png'))
    image = Image.open(src).convert('RGBA')
    if name.startswith('block-'):
        target = ROOT / 'assets/world6/anomaly-blocks-v3' / (name + '.webp')
        image = image.resize((384, 384), Image.Resampling.LANCZOS)
    elif name.startswith('planet-'):
        target = ROOT / 'assets/ui/planets/source-v3' / (name + '.webp')
        image.thumbnail((472, 472), Image.Resampling.LANCZOS)
        padded = Image.new('RGBA', (512, 512))
        padded.alpha_composite(image, ((512-image.width)//2, (512-image.height)//2))
        image = padded
    elif name == 'living-core':
        target = ROOT / 'assets/vfx/anomaly-source-v3/living-core.webp'
        image.thumbnail((704, 704), Image.Resampling.LANCZOS)
        padded = Image.new('RGBA', (768, 768))
        padded.alpha_composite(image, ((768-image.width)//2, (768-image.height)//2))
        image = padded
    else:
        backgrounds[name] = image.resize((768, 1152), Image.Resampling.LANCZOS)
        continue
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, quality=92, method=6)
    manifest.append({'name':name, 'path':target.relative_to(ROOT).as_posix(), 'size':image.size})

# The two authored matching states crossfade in pre-exported textures: no extra
# full-screen draws or filters at runtime, no change to the painted silhouettes.
for stage, blend in [(100,0), (75,1/3), (50,2/3), (25,1)]:
    for layer in ['far','near']:
        normal = backgrounds['background-normal-' + layer]
        cracked = backgrounds['background-cracked-' + layer]
        image = Image.blend(normal, cracked, blend)
        target = ROOT / f'assets/backgrounds/anomaly-source-v1/source-{stage}-{layer}.webp'
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, quality=90, method=6)
        manifest.append({'name':f'background-{stage}-{layer}', 'path':target.relative_to(ROOT).as_posix(), 'size':image.size})
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Exported {len(manifest)} game assets')
