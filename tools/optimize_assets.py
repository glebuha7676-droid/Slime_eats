"""Convert production PNGs to pixel-preserving WebP; keep originals outside the app."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json
import shutil
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
BACKUP = (ROOT / 'archive' / 'assets-before-lossless-webp').resolve()
assert BACKUP.is_relative_to(ROOT) and BACKUP != ROOT

def convert(source):
    source = source.resolve()
    assert source.is_relative_to(ROOT)
    relative = source.relative_to(ROOT)
    output = source.with_name(source.stem + '-lossless.webp')
    assert output.is_relative_to(ROOT) and not output.exists(), output
    image = Image.open(source).convert('RGBA')
    image.save(output, 'WEBP', lossless=True, exact=True, method=6)
    decoded = Image.open(output).convert('RGBA')
    a, b = np.asarray(image), np.asarray(decoded)
    visible = a[:, :, 3] > 0
    assert image.size == decoded.size and np.array_equal(a[:, :, 3], b[:, :, 3])
    assert np.array_equal(a[:, :, :3][visible], b[:, :, :3][visible]), source
    return {'source': relative.as_posix(), 'output': output.relative_to(ROOT).as_posix(),
            'before': source.stat().st_size, 'after': output.stat().st_size,
            'size': image.size, 'verified': 'exact visible RGBA'}

sources = sorted(p for folder in ['assets', 'effects-lab/assets'] for p in (ROOT / folder).rglob('*.png'))
if not sources:
    print('No production PNGs left. Existing mapping and report preserved.')
    raise SystemExit(0)
with ThreadPoolExecutor(max_workers=3) as pool:
    entries = list(pool.map(convert, sources))
mapping = {e['source']: e['output'] for e in entries}
# Match complete paths and partial asset names used by catalog prefixes/template strings.
replacements = dict(mapping)
for old, new in mapping.items():
    replacements[Path(old).name] = Path(new).name
modified = []
for path in ROOT.rglob('*'):
    rel = path.relative_to(ROOT)
    if not path.is_file() or any(p in {'.git','archive','tmp','node_modules','.codex','.agents'} for p in rel.parts):
        continue
    if path.suffix.lower() not in {'.js','.css','.html','.json','.md','.svg'}:
        continue
    original = path.read_text(encoding='utf-8')
    result = original
    for old, new in sorted(replacements.items(), key=lambda x: -len(x[0])):
        result = result.replace(old, new)
    if result != original:
        path.write_text(result, encoding='utf-8')
        modified.append(rel.as_posix())

manifest = ROOT / 'js/config/image-paths.js'
manifest.write_text("(() => {\n  'use strict';\n  const paths = " + json.dumps(mapping, ensure_ascii=False, indent=2) + ";\n"
    "  window.SlimeAssetPaths = Object.freeze({ resolve(source) {\n"
    "    const match = String(source).match(/^([^?#]+)(.*)$/);\n"
    "    return match ? (paths[match[1]] || match[1]) + match[2] : source;\n"
    "  } });\n})();\n", encoding='utf-8')

for e in entries:
    source = (ROOT / e['source']).resolve()
    target = (BACKUP / e['source']).resolve()
    assert source.is_relative_to(ROOT) and target.is_relative_to(BACKUP) and not target.exists()
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(source), str(target))

report = {'count': len(entries), 'beforeBytes': sum(e['before'] for e in entries),
          'afterBytes': sum(e['after'] for e in entries), 'modifiedFiles': modified,
          'originals': BACKUP.relative_to(ROOT).as_posix(), 'images': entries}
(ROOT / 'tools/asset-optimization-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k not in {'images','modifiedFiles'}}, ensure_ascii=False))
