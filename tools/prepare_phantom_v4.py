"""Normalize generated transparent sprites; preserve the source masters."""
from pathlib import Path
from PIL import Image
import shutil

root = Path(__file__).resolve().parents[1] / 'assets/vfx/phantom-v4'
root.mkdir(parents=True, exist_ok=True)
sources = {
    'soul': ('exec-a65d9b79-809b-45d7-9a42-fac6c4a2bf22.png', 192),
    'portal': ('exec-7b527b4b-db70-4698-9d09-ecbdc09c188c.png', 384),
}
generated = Path.home() / '.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12'
for name, (source, size) in sources.items():
    master = root / (name + '-master.png')
    if not master.exists():
        shutil.copy2(generated / source, master)
    im = Image.open(master).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    im = im.crop(box)
    im.thumbnail((int(size*.90), int(size*.90)), Image.Resampling.LANCZOS)
    out = Image.new('RGBA', (size, size))
    out.paste(im, ((size-im.width)//2, (size-im.height)//2))
    out.save(root / (name + '.webp'), quality=93, method=6)
    print(name, size, (root / (name + '.webp')).stat().st_size)
