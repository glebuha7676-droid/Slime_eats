from pathlib import Path
import subprocess

root = Path(__file__).resolve().parent.parent
deleted = set()
for extra in ([], ['--cached']):
    deleted.update(subprocess.check_output(
        ['git', '-c', 'core.quotepath=false', 'diff', *extra, '--name-only', '--diff-filter=D', '-z'],
        cwd=root,
    ).decode('cp1251').split('\0'))
sources = []
for path in root.rglob('*'):
    if path.suffix.lower() not in {'.js', '.css', '.html', '.json'}:
        continue
    if any(part in {'.git', 'mockups', 'node_modules'} for part in path.relative_to(root).parts):
        continue
    try:
        sources.append((path.relative_to(root), path.read_text(encoding='utf-8')))
    except (UnicodeError, OSError):
        pass

for asset in filter(None, deleted):
    refs = [str(source) for source, content in sources if asset in content]
    if refs:
        print(f'{asset}: {", ".join(refs)}')
