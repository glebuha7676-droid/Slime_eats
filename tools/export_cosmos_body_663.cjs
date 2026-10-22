const fs=require('node:fs'),sharp=require('sharp');
(async()=>{
 const base='assets/ui/slime/forms/slime-body-cosmos-petrifying-v1';
 fs.copyFileSync('C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12/exec-adac9f1e-db0a-4a8d-a786-4717e5dbce35.png',`${base}-master.png`);
 const {data,info}=await sharp(`${base}-master.png`).trim({threshold:10}).resize(434,435,{fit:'inside'}).toBuffer({resolveWithObject:true});
 await sharp({create:{width:512,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:data,left:Math.round((512-info.width)/2),top:474-info.height}]).webp({lossless:true}).toFile(`${base}.webp`);
 console.log(`${base}.webp: ${info.width} x ${info.height} visible sprite`);
})().catch(error=>{console.error(error);process.exitCode=1;});
