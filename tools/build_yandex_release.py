"""Build a clean, self-contained Yandex Games ZIP from the runtime closure.

Source assets and development pages stay outside the release. International
asset paths are mapped to ASCII names without changing their pixels or save IDs.
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist/yandex'
OUT.mkdir(parents=True, exist_ok=True)
inventory = json.loads(subprocess.check_output(['node', 'tools/runtime_inventory.cjs', '--write'], cwd=ROOT, text=True, encoding='utf-8'))
asset_files = {entry['url'] for entry in inventory['assets']}
renames = {old: 'assets/runtime/' + hashlib.sha256(old.encode()).hexdigest()[:16] + Path(old).suffix
           for old in asset_files if not re.fullmatch(r'[A-Za-z0-9_./-]+', old)}
def transform(text):
    for old, new in sorted(renames.items(), key=lambda item: -len(item[0])):
        text = text.replace(old, new)
    return text

html = (ROOT / 'index.html').read_text(encoding='utf-8')
VERSION = re.search(r'<script src="game\.js\?v=(\d+)"', html).group(1)
css_files = re.findall(r'<link rel="stylesheet" href="([^"?]+)[^"]*"\s*/>', html)
css = '\n'.join((ROOT / file).read_text(encoding='utf-8') for file in css_files)
css = re.sub(r'/\*.*?\*/', '', transform(css), flags=re.S)
css = re.sub(r'\s+', ' ', css)
html = re.sub(r'<link rel="stylesheet" href="[^"?]+[^"]*"\s*/>', '', html)
html = html.replace('</head>', f'<link rel="stylesheet" href="game.css?v={VERSION}" />\n</head>')

# Asset migration keys must retain their old spelling for saved legacy paths.
source = (ROOT / 'js/config/image-paths.js').read_text(encoding='utf-8')
start, end = source.index('{', source.index('const paths')), source.index('\n};') + 2
aliases = json.loads(source[start:end])
aliases = {old: renames.get(new, new) for old, new in aliases.items() if new in asset_files}
aliases.update(renames)
resolver = "(() => { const paths=" + json.dumps(aliases, ensure_ascii=False) + ";window.SlimeAssetPaths=Object.freeze({resolve(source){const match=String(source).match(/^([^?#]+)(.*)$/);return match?(paths[match[1]]||match[1])+match[2]:source;}});})();"

scripts = re.findall(r'<script src="([^"?]+)[^"]*"></script>', html)
bootstrap = {'js/core/boot-manifest.js', 'js/core/boot-loader.js'}
runtime_scripts = [file for file in scripts if file not in bootstrap]
bundle = ';\n'.join(resolver if file == 'js/config/image-paths.js' else transform((ROOT / file).read_text(encoding='utf-8')) for file in runtime_scripts)
first = True
for file in runtime_scripts:
    tag = re.compile(r'<script src="' + re.escape(file) + r'[^"\s]*"></script>')
    html = tag.sub(f'<script src="game-runtime.js?v={VERSION}" defer></script>' if first else '', html)
    first = False
html = transform(html)
outputs = {'index.html':html.encode(), 'game.css':css.encode(), 'game-runtime.js':bundle.encode()}
for file in bootstrap:
    outputs[file] = transform((ROOT / file).read_text(encoding='utf-8')).encode()
for file in asset_files:
    outputs[renames.get(file, file)] = (ROOT / file).read_bytes()
total_bytes = sum(map(len, outputs.values()))
assert total_bytes < 100_000_000, f'Yandex uncompressed size limit exceeded: {total_bytes}'
assert all(re.fullmatch(r'[A-Za-z0-9_./-]+', name) for name in outputs), 'Unsafe archive filename'
assert 'index.html' in outputs
# Prune only this tool's generated output, after the complete release has been
# validated. Never traverse a symlink into source files or another directory.
assert OUT.resolve() == ROOT.resolve() / 'dist/yandex'
for existing in OUT.rglob('*'):
    assert existing.resolve().is_relative_to(OUT.resolve()), 'Output escaped release directory'
    if existing.is_file() and existing.relative_to(OUT).as_posix() not in outputs:
        existing.unlink()
for directory in sorted((p for p in OUT.rglob('*') if p.is_dir()), key=lambda p: len(p.parts), reverse=True):
    if not any(directory.iterdir()):
        directory.rmdir()
for file, data in outputs.items():
    target = OUT / file
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
archive = ROOT / f'dist/slime-yandex-{VERSION}.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as package:
    for file, data in sorted(outputs.items()):
        package.writestr(file, data)
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    assert sum(info.file_size for info in package.infolist()) == total_bytes
report = {'files':len(outputs), 'uncompressedBytes':total_bytes, 'zipBytes':archive.stat().st_size,
          'runtimeAssets':len(asset_files), 'asciiAssetRenames':len(renames),
          'cssRequestsBefore':len(css_files), 'cssRequestsAfter':1,
          'scriptRequestsBefore':len(scripts), 'scriptRequestsAfter':3,
          'sourceArtExcluded':True, 'devToolsExcluded':True, 'sdkPath':'/sdk.js',
          'archive':archive.relative_to(ROOT).as_posix()}
(ROOT / 'dist/release-report.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps(report))
