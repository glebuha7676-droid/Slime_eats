"""Export generated terrain and shared essence without altering the drawings."""
from pathlib import Path
from PIL import Image
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/concepts/terrain-refresh-v3'
records = json.loads((OUT / 'prompts.json').read_text(encoding='utf-8'))['records']
manifest = []
for item in records:
    key = item['key']
    shutil.copy2(item['source'], OUT / (key + '-master.png'))
    image = Image.open(item['source']).convert('RGBA')
    image.resize((1024, 1024), Image.Resampling.LANCZOS).save(OUT / (key + '.png'))
    runtime = ROOT / ('assets/ui/mutation-essence-v1' if item.get('reward') else f"assets/world{4 if item['world'] == 'magma' else 5}/planet-blocks-v3") / (key + '.webp')
    runtime.parent.mkdir(parents=True, exist_ok=True)
    sprite = image.resize((384, 384), Image.Resampling.LANCZOS)
    sprite.save(runtime, quality=94, method=6)
    shutil.copy2(runtime, OUT / (key + '.webp'))
    manifest.append({'key': key, 'title': item['title'], 'runtime': runtime.relative_to(ROOT).as_posix(), 'size': 384})

for tier in ['fragile', 'normal', 'strong']:
    folder = ROOT / 'assets/world1/slime-blocks-v2'
    folder.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / f'output/concepts/slime-biome-v2/block-{tier}.webp', folder / f'block-{tier}.webp')

planets = ROOT / 'assets/ui/planets/mutation-flora-v1'
planets.mkdir(parents=True, exist_ok=True)
for world in ['home', 'candy', 'magma', 'sky']:
    for stage in [0, 100]:
        key = ('home-slime-clean' if stage == 0 else 'home-slime-infected-100') if world == 'home' else f'{world}-'+('clean' if stage == 0 else 'infected-100')
        shutil.copy2(ROOT / f'output/concepts/slime-biome-v2/{key}.webp', planets / f'{world}-{stage}.webp')
shutil.copy2(ROOT / 'output/concepts/five-worlds-scale-v2/planet-source.webp', planets / 'source-100.webp')
# An exploded asteroid has no surviving planet sprite.
Image.new('RGBA', (512, 512)).save(planets / 'source-0.webp', lossless=True)
(OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print('Exported 9 new generated sprites, 3 slime blocks, 4 planet pairs and source asteroid.')
