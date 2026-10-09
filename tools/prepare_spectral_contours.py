"""Bake alpha-contour anchors so runtime never needs canvas pixel readback."""
from pathlib import Path
import json
import math
import re
from PIL import Image

root = Path(__file__).resolve().parent.parent
avatar = (root / 'js/rendering/slime-avatar.js').read_text(encoding='utf-8')
paths = set(re.findall(r"'(effects-lab/assets/[^']*body[^']*\.webp|assets/ui/slime/[^']*body[^']*\.webp)(?:\?[^']*)?'", avatar))
paths.add('assets/ui/slime/slime-body-reference-v1.webp')
paths.update(p.relative_to(root).as_posix() for p in (root / 'assets/food').glob('*ghost*.webp'))
paths.update([
    'assets/ui/recipe-categories/emblem-v6-phantom-lossless.webp',
    'assets/vfx/phantom-spirit-mint-v2-lossless.webp',
    'assets/vfx/phantom-spirit-blue-v2-lossless.webp',
    'assets/vfx/phantom-express-train-v1-lossless.webp',
    'assets/vfx/phantom-express-rails-v1-lossless.webp',
])
contours = {}
for path in sorted(paths):
    alpha = Image.open(root / path).convert('RGBA').getchannel('A').resize((384,384),Image.Resampling.LANCZOS)
    anchors = []
    for n in range(8):
        angle = n * math.pi / 4 - math.pi / 2
        for distance in range(268, 0, -2):
            x = round(192 + math.cos(angle) * distance)
            y = round(192 + math.sin(angle) * distance)
            if 0 <= x < 384 and 0 <= y < 384 and alpha.getpixel((x,y)) > 100:
                anchors.append({'x':round(x/384,6),'y':round(y/384,6),'angle':round(angle,6)})
                break
    contours[path] = anchors
output = root / 'js/config/spectral-contours.js'
output.write_text('// Generated from sprite alpha; no runtime pixel reads.\nwindow.SlimeSpectralContours=Object.freeze('+json.dumps(contours,separators=(',',':'))+');\n',encoding='utf-8')
print(f'Spectral contours: {len(contours)} sprites')
