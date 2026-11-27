"""Keep imagegen originals; export aligned world sprites and square block faces."""
from pathlib import Path
from PIL import Image
import ast,json,math,random,shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/concepts/slime-biome-v2'
APPROVED=ROOT/'output/concepts/five-worlds-scale-v2'
tree=ast.parse((ROOT/'tools/export_five_worlds_scale_v2.py').read_text(encoding='utf-8'))
node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='fit_body')
exec(compile(ast.Module(body=[node],type_ignores=[]),'sprite_circle_fit','exec'),globals())
tx,ty,tr=json.loads((APPROVED/'manifest.json').read_text(encoding='utf-8'))[0]['exportedBodyCircle']
manifest=[]
for item in json.loads((OUT/'prompts.json').read_text(encoding='utf-8'))['records']:
    key=item['key'];master=OUT/(key+'-master.png');shutil.copy2(item['source'],master)
    image=Image.open(master).convert('RGBA');block=key.startswith('block-')
    cx,cy,r,confidence=(.5,.5,.5,1) if block else fit_body(image)
    for edge,ext in [(1024,'png'),(384 if block else 512,'webp')]:
        if block:
            canvas=image.resize((edge,edge),Image.Resampling.LANCZOS)
        else:
            scale=tr*edge/(r*image.width);size=tuple(round(v*scale) for v in image.size)
            canvas=Image.new('RGBA',(edge,edge))
            canvas.alpha_composite(image.resize(size,Image.Resampling.LANCZOS),(round(tx*edge-cx*size[0]),round(ty*edge-cy*size[1])))
        if ext=='png':canvas.save(OUT/(key+'.png'))
        else:canvas.save(OUT/(key+'.webp'),quality=94,method=6)
    manifest.append({'name':key,'title':item['title'],'master':key+'-master.png','png':key+'.png','webp':key+'.webp',
                     'kind':'block' if block else 'planet','spriteSize':384 if block else 512,
                     'centerAlpha':canvas.getpixel((canvas.width//2,canvas.height//2))[3],
                     'bodyCircle':None if block else [tx,ty,tr],'fitConfidence':round(confidence,3)})
    print(key,'tile' if block else round(confidence,3))
for world in ['candy','sky','magma']:
    for ext in ['png','webp']:shutil.copy2(APPROVED/f'planet-{world}.{ext}',OUT/f'{world}-clean.{ext}')
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('8 generated assets exported, 3 approved clean comparison states preserved')
