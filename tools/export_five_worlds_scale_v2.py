"""Technical uniform scale/placement only; retain generated art and silhouettes."""
from pathlib import Path
from PIL import Image
import json, math, random, shutil

OUT = Path(__file__).resolve().parents[1] / 'output/concepts/five-worlds-scale-v2'
records = json.loads((OUT / 'prompts.json').read_text(encoding='utf-8'))['records']

def fit_body(image):
    mask = image.getchannel('A').resize((256, 256)).point(lambda a: 255 if a > 170 else 0)
    points = []
    for y in range(116, 246, 2):
        box = mask.crop((0, y, 256, y+1)).getbbox()
        if box and box[0] < 128 < box[2]:
            points.extend([(box[0], y), (box[2]-1, y)])
    rng = random.Random(441)
    best = None
    for _ in range(2800):
        (ax,ay),(bx,by),(cx,cy) = rng.sample(points,3)
        d = 2*(ax*(by-cy)+bx*(cy-ay)+cx*(ay-by))
        if abs(d) < 1: continue
        aa,bb,cc = ax*ax+ay*ay,bx*bx+by*by,cx*cx+cy*cy
        x = (aa*(by-cy)+bb*(cy-ay)+cc*(ay-by))/d
        y = (aa*(cx-bx)+bb*(ax-cx)+cc*(bx-ax))/d
        r = math.hypot(ax-x,ay-y)
        if not (110<x<146 and 100<y<167 and 75<r<126): continue
        errors = [abs(math.hypot(px-x,py-y)-r) for px,py in points]
        score = sum(e<2.6 for e in errors), -sum(min(e,8) for e in errors)
        if best is None or score>best[0]: best = score,(x,y,r)
    if not best: raise ValueError('No reliable body circle')
    x,y,r = best[1]
    return x/256,y/256,r/256,best[0][0]/len(points)

prepared=[]
for item in records:
    name=item['key']; master=OUT/(name+'-master.png');shutil.copy2(item['source'],master)
    image=Image.open(master).convert('RGBA')
    cx,cy,r,confidence=fit_body(image)
    bbox=image.getchannel('A').point(lambda a:255 if a>10 else 0).getbbox()
    prepared.append((item,image,cx,cy,r,confidence,bbox))

# Same body circle for all five. Fit complete protrusions into the shared square.
target_r=.36
for item,image,cx,cy,r,confidence,bbox in prepared:
    left,top,right,bottom=bbox;w,h=image.size
    for available,distance in [(.44,cx-left/w),(.44,right/w-cx),(.48,cy-top/h),(.40,bottom/h-cy)]:
        if distance>0: target_r=min(target_r,available*r/distance)

manifest=[]
for item,image,cx,cy,r,confidence,bbox in prepared:
    edge=512;factor=target_r*edge/(r*image.width)
    size=(round(image.width*factor),round(image.height*factor))
    art=image.resize(size,Image.Resampling.LANCZOS)
    xy=(round(edge*.5-cx*size[0]),round(edge*.54-cy*size[1]))
    output=Image.new('RGBA',(edge,edge));output.alpha_composite(art,xy)
    output.save(OUT/(item['key']+'.webp'),quality=94,method=6)
    large_size=(round(image.width*factor*2),round(image.height*factor*2))
    large=Image.new('RGBA',(1024,1024))
    large.alpha_composite(image.resize(large_size,Image.Resampling.LANCZOS),(round(512-cx*large_size[0]),round(1024*.54-cy*large_size[1])))
    large.save(OUT/(item['key']+'.png'))
    entry={'name':item['key'],'title':item['title'],'master':item['key']+'-master.png','png':item['key']+'.png','sprite':item['key']+'.webp',
           'originalBodyCircle':[round(cx,4),round(cy,4),round(r,4)],'fitConfidence':round(confidence,3),
           'exportedBodyCircle':[.5,.54,round(target_r,4)],'uniformScale':round(factor,5),'offset':xy}
    manifest.append(entry)
    print(item['key'],entry['originalBodyCircle'],'fit',entry['fitConfidence'])

(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
page=OUT/'preview.html';html=page.read_text(encoding='utf-8')
html=html.replace('left:14%;top:18%;width:72%;height:72%;',f'left:{(0.5-target_r)*100:.3f}%;top:{(0.54-target_r)*100:.3f}%;width:{target_r*200:.3f}%;height:{target_r*200:.3f}%;')
html=html.replace('Опорный круг показывает заданную при генерации основу.','Опорный круг показывает общую основу, по которой выровнен масштаб при экспорте.')
page.write_text(html,encoding='utf-8')
print('Shared circle:',.5,.54,round(target_r,4))
