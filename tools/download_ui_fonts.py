"""Download three original, unmodified OFL font families for the UI style lab."""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from hashlib import sha256
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen
import json

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets/fonts/ui-kit'
FAMILIES = [('nunito', 'Nunito'), ('rubik', 'Rubik'), ('comfortaa', 'Comfortaa')]


def download(entry):
    folder, family = entry
    base = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{folder}/'
    target = DEST / folder
    target.mkdir(parents=True, exist_ok=True)
    records = []
    for upstream, local in [(f'{family}[wght].ttf', f'{family}-variable.ttf'), ('OFL.txt', 'OFL.txt')]:
        url = base + quote(upstream)
        data = urlopen(url, timeout=30).read()
        if local.endswith('.ttf') and data[:4] not in (b'\x00\x01\x00\x00', b'OTTO'):
            raise ValueError(f'Unexpected font format: {url}')
        if local == 'OFL.txt' and b'SIL OPEN FONT LICENSE' not in data:
            raise ValueError(f'Missing OFL license: {url}')
        (target / local).write_bytes(data)
        records.append({'file': f'{folder}/{local}', 'source': url, 'bytes': len(data), 'sha256': sha256(data).hexdigest()})
    return {'family': family, 'license': 'SIL Open Font License 1.1', 'files': records}


if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=3) as pool:
        records = list(pool.map(download, FAMILIES))
    manifest = {'downloaded': str(date.today()), 'unmodifiedUpstreamFonts': True, 'families': records}
    (DEST / 'sources.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(json.dumps({'families': [r['family'] for r in records], 'bytes': sum(f['bytes'] for r in records for f in r['files'])}))
