const fs=require('fs'),vm=require('vm'),sharp=require('sharp');
const original=fs.readFileSync('tools/export_accessories_689.cjs','utf8');
const components=new Function(original.slice(original.indexOf('function components'),original.indexOf('(async()=>'))+';return components;')();
(async()=>{
 const box={window:{}};vm.runInNewContext(fs.readFileSync('js/config/accessory-fit.js','utf8'),box);const fits={...box.window.SlimeAccessoryFit};const analysis={};
 for(const id of ['pixel','pirate','beard','lashes']){
  const version=id==='pirate'?'v3':id==='lashes'?'v2':'v1';
  const source=`assets/ui/wardrobe/accessories/${id}-${version}-master.png`;
  const raw=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true}),{width:w,height:h}=raw.info;
  const shapes=components(raw.data,w,h,a=>a>40),big=shapes.filter(c=>c.count>=shapes[0].count*.002);
  const left=Math.max(0,Math.min(...big.map(c=>c.minX))-3),top=Math.max(0,Math.min(...big.map(c=>c.minY))-3),right=Math.min(w,Math.max(...big.map(c=>c.maxX))+4),bottom=Math.min(h,Math.max(...big.map(c=>c.maxY))+4),width=right-left,height=bottom-top,ratio=768/width;
  const image=`assets/ui/wardrobe/accessories/${id}-${version}.webp`,info=await sharp(source).extract({left,top,width,height}).resize({width:768}).webp({quality:92,alphaQuality:100}).toFile(image);
  const fit={image,pixelWidth:info.width,pixelHeight:info.height,anchorX:info.width*.5,anchorY:info.height*.5,targetY:.0231437};
  if(id==='pixel'){fit.width=1.70;fit.coversEyes=true;}
  if(id==='pirate'){fit.width=1.80;fit.targetX=-.3248214;fit.hiddenEyeSide=-1;fit.anchorX=(w*.365-left)*ratio;fit.anchorY=(h*.70-top)*ratio;}
  if(id==='beard'){fit.width=1.24;fit.anchorY=0;fit.targetY=.22;}
  if(id==='lashes'){fit.kind='lashes';fit.width=.24;fit.anchorX=info.width*.02;fit.anchorY=info.height*.98;}
  fits[id]=fit;analysis[id]={source,sourceSize:[w,h],crop:{left,top,width,height},fit,largestClearAreas:components(raw.data,w,h,a=>a<48).filter(c=>!c.edge).slice(0,3)};
 }
 fs.writeFileSync('js/config/accessory-fit.js','// Face-relative raster accessories. Exports: tools/export_accessories_690.cjs and tools/export_accessories_691.cjs.\nwindow.SlimeAccessoryFit=Object.freeze('+JSON.stringify(fits,null,2)+');\n');
 fs.writeFileSync('outputs/accessories-691/fitting.json',JSON.stringify(analysis,null,2));console.log(JSON.stringify(analysis,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
