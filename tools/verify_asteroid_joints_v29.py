"""Opaque terrain must render identically over two different cave colors."""
from pathlib import Path
from PIL import Image,ImageChops
import json
out=Path(__file__).resolve().parents[1]/'output/scene-readability-v29'
records=[]
for width in [440,320]:
    a=Image.open(out/f'asteroid-joints-{width}-red.png').convert('RGB')
    b=Image.open(out/f'asteroid-joints-{width}-green.png').convert('RGB')
    bounds=ImageChops.difference(a,b).getbbox()
    records.append({'width':width,'size':a.size,'differenceBounds':bounds,'opaqueIncludingJoints':bounds is None})
    assert bounds is None,records[-1]
(out/'joint-verification.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
print(json.dumps(records))
