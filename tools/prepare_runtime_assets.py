"""Create display-sized, losslessly encoded food sprites; preserve source artwork."""
from pathlib import Path
from PIL import Image
import json
import re

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'assets/food'
OUTPUT.mkdir(exist_ok=True)
mapping_file = ROOT / 'js/config/image-paths.js'
text = mapping_file.read_text(encoding='utf-8')
start, end = text.index('{', text.index('const paths')), text.index('\n};') + 2
mapping = json.loads(text[start:end])
entries = []
for family in sorted((ROOT / 'assets/ЕДА/Новая').iterdir()):
    for source in sorted(family.glob('*.webp')):
        # The source contains 1254px art, displayed at <= 125 CSS px. 512px
        # preserves detail even at 3x DPR without decoding a 6MB bitmap per food.
        name = source.name.removesuffix('-lossless.webp')
        target = OUTPUT / f'{name}.webp'
        image = Image.open(source).convert('RGBA')
        image.thumbnail((512, 512), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', lossless=True, exact=True, method=6)
        old, new = source.relative_to(ROOT).as_posix(), target.relative_to(ROOT).as_posix()
        for key, value in list(mapping.items()):
            if value == old:
                mapping[key] = new
        mapping[old] = new
        entries.append({'source': old, 'runtime': new, 'beforeBytes': source.stat().st_size,
                        'afterBytes': target.stat().st_size, 'beforePixels': Image.open(source).size,
                        'afterPixels': image.size})
text = text[:start] + json.dumps(mapping, ensure_ascii=False, indent=2) + text[end:]
mapping_file.write_text(text, encoding='utf-8')
(ROOT / 'tools/runtime-food-report.json').write_text(json.dumps(entries, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps({'foods': len(entries), 'beforeBytes': sum(e['beforeBytes'] for e in entries),
                  'afterBytes': sum(e['afterBytes'] for e in entries),
                  'decodedBeforeBytes': sum(e['beforePixels'][0]*e['beforePixels'][1]*4 for e in entries),
                  'decodedAfterBytes': sum(e['afterPixels'][0]*e['afterPixels'][1]*4 for e in entries)}))
