"""Export generated art using the already-approved shared body circle."""
from pathlib import Path
from PIL import Image
import ast, json, math, random, shutil

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/biome-mutations-v1'
APPROVED=ROOT/'output/concepts/five-worlds-scale-v2'
# Reuse only the pure circle-fitting function, without running the prior exporter.
tree=ast.parse((ROOT/'tools/export_five_worlds_scale_v2.py').read_text(encoding='utf-8'))
definition=next(node for node in tree.body if isinstance(node,ast.FunctionDef) and node.name=='fit_body')
exec(compile(ast.Module(body=[definition],type_ignores=[]),'sprite_circle_fit','exec'),globals())
cx_target,cy_target,r_target=json.loads((APPROVED/'manifest.json').read_text(encoding='utf-8'))[0]['exportedBodyCircle']
manifest=[]
for item in json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))['records']:
    key=item['key'];master=OUT/(key+'-master.png');shutil.copy2(item['source'],master)
    image=Image.open(master).convert('RGBA');cx,cy,r,confidence=fit_body(image)
    for edge,ext in [(1024,'png'),(512,'webp')]:
        scale=r_target*edge/(r*image.width)
        size=tuple(round(value*scale) for value in image.size)
        art=image.resize(size,Image.Resampling.LANCZOS)
        offset=(round(cx_target*edge-cx*size[0]),round(cy_target*edge-cy*size[1]))
        canvas=Image.new('RGBA',(edge,edge));canvas.alpha_composite(art,offset)
        if ext=='png':canvas.save(OUT/(key+'.png'))
        else:canvas.save(OUT/(key+'.webp'),quality=94,method=6)
    manifest.append({'name':key,'title':item['title'],'master':key+'-master.png','png':key+'.png','webp':key+'.webp',
                     'originalBodyCircle':[round(cx,4),round(cy,4),round(r,4)],'fitConfidence':round(confidence,3),
                     'exportedBodyCircle':[cx_target,cy_target,r_target]})
    print(key,round(confidence,3))
for world in ['candy','sky','magma']:
    for ext in ['png','webp']:shutil.copy2(APPROVED/f'planet-{world}.{ext}',OUT/f'{world}-clean.{ext}')
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Four generated states exported; three approved clean states preserved')
