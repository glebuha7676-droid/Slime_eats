const fs = require('node:fs');
const sharp = require('sharp');
const source = 'C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12/exec-5067e2e7-5f0f-4289-8fab-9e4764869150.png';
const base = 'assets/ui/slime/forms/slime-body-electric-charged-v2';

async function bounds(file) {
  const {data,info} = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width, right=-1, top=info.height, bottom=-1;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) {
    if(data[(y*info.width+x)*4+3] <= 32) continue;
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return {left,top,width:right-left+1,height:bottom-top+1,bottom};
}

(async()=>{
  fs.copyFileSync(source,base+'-master.png');
  const target=await bounds('assets/ui/slime/slime-body-reference-v1.webp');
  const actual=await bounds(source);
  const crop=await sharp(source).extract({left:actual.left,top:actual.top,width:actual.width,height:actual.height})
    .resize({width:target.width}).png().toBuffer();
  const size=await sharp(crop).metadata();
  const top=target.bottom+1-size.height;
  if(top<0) throw new Error('Body does not fit inside the canonical body canvas');
  await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}})
    .composite([{input:crop,left:target.left,top}])
    .webp({quality:96,alphaQuality:100,effort:6}).toFile(base+'.webp');
  console.log(JSON.stringify({file:base+'.webp',source:actual,output:await bounds(base+'.webp')}));
})().catch(error=>{console.error(error);process.exitCode=1;});
