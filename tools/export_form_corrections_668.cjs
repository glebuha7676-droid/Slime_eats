const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs=[
 {name:'cosmos-petrifying',file:'exec-813ec224-4b32-40b8-817f-a022dbae7c86.png',reference:'assets/ui/slime/forms/slime-body-cosmos-petrifying-v1.webp'},
 {name:'glitch-arcade',file:'exec-150deef4-5880-4c70-89fe-99d24a5d6ebf.png',reference:'assets/ui/slime/slime-body-reference-v1.webp'}
];
async function bounds(source){
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,right=0,top=info.height,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 return {left,top,width:right-left+1,height:bottom-top+1,bottom};
}
(async()=>{for(const job of jobs){
 const base=`assets/ui/slime/forms/slime-body-${job.name}-v2`,source=path.join(root,job.file);
 fs.copyFileSync(source,`${base}-master.png`);
 const target=await bounds(job.reference),actual=await bounds(source);
 const crop=await sharp(source).extract({left:actual.left,top:actual.top,width:actual.width,height:actual.height}).resize({width:target.width}).png().toBuffer();
 const meta=await sharp(crop).metadata(),left=target.left,top=target.bottom+1-meta.height;
 await sharp({create:{width:512,height:512,channels:4,background:'#00000000'}}).composite([{input:crop,left,top}]).webp({quality:96,alphaQuality:100,effort:6}).toFile(`${base}.webp`);
 console.log(JSON.stringify({file:`${base}.webp`,reference:target,output:await bounds(`${base}.webp`)}));
}})().catch(e=>{console.error(e);process.exitCode=1;});
