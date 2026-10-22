// Export generated artwork without changing its painted content.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const dir = path.resolve('assets/ui/home-modular/generated-v3');
const generated = 'C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12/';
const images = [
  ['world-arrow-right', 'exec-c7f2c78d-dfce-43cd-ab84-3fa4b553ae95.png', 256, true],
  ['play-active', 'exec-c24dac83-ee3c-48fb-b407-f59e565e581b.png', 960, true],
  ['play-inactive', 'exec-d709310c-6e4e-4f76-9812-e27794c5a81e.png', 960, true],
  ['console-wired', 'exec-15129fa1-62ab-4561-b0ca-8baa0c3ae3cd.png', 1024, false],
  ['room', 'exec-0265a61d-0937-4f52-ab4d-20692ede170c.png', 1280, false],
];
async function exportSprite(name, source, width, trim) {
  const input = generated + source;
  let pipeline = sharp(input);
  if (trim) {
    const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let x0=info.width,y0=info.height,x1=0,y1=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>=128){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
    const left=Math.max(0,x0-3),top=Math.max(0,y0-3);
    pipeline=pipeline.extract({left,top,width:Math.min(info.width-left,x1-left+4),height:Math.min(info.height-top,y1-top+4)});
  }
  const target=path.join(dir,name+'.webp');
  await pipeline.resize({width}).webp({quality:94,alphaQuality:100,effort:6}).toFile(target);
  const metadata=await sharp(target).metadata();
  return {name,file:path.basename(target),source,width:metadata.width,height:metadata.height,alpha:metadata.hasAlpha};
}
(async()=>{
  fs.mkdirSync(dir,{recursive:true});
  const manifest=[];
  for(const spec of images)manifest.push(await exportSprite(...spec));
  // The isolated portal is already part of the approved matching set.
  await sharp('assets/ui/home-modular/generated-v2/masters/pedestal-portal.png').resize({width:1280}).webp({quality:94,alphaQuality:100,effort:6}).toFile(path.join(dir,'pedestal-portal.webp'));
  manifest.push({name:'pedestal-portal',source:'generated-v2/masters/pedestal-portal.png',...(await sharp(path.join(dir,'pedestal-portal.webp')).metadata())});
  fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
  console.log(manifest.map(x=>({file:x.file||'pedestal-portal.webp',width:x.width,height:x.height,alpha:x.alpha??x.hasAlpha})));
})().catch(error=>{console.error(error);process.exitCode=1;});
