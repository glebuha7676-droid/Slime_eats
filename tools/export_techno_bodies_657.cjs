const fs = require('node:fs'), path = require('node:path'), sharp = require('sharp');
const root = 'C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs = [
 ['techno-implants', 'exec-49d6ee31-82a9-4b25-91c6-6940b9fde66f.png'],
 ['techno-upgraded', 'exec-8e15e694-c4ee-47fc-bf0d-8d3d216756f9.png']
];
(async()=>{for(const [name,file] of jobs){
 const base = `assets/ui/slime/forms/slime-body-${name}-v1`;
 fs.copyFileSync(path.join(root,file), `${base}-master.png`);
 const {data,info} = await sharp(`${base}-master.png`).trim({threshold:10}).resize(434,435,{fit:'inside'}).toBuffer({resolveWithObject:true});
 await sharp({create:{width:512,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:data,left:Math.round((512-info.width)/2),top:474-info.height}]).webp({lossless:true}).toFile(`${base}.webp`);
 console.log(`${base}.webp: ${info.width} x ${info.height} visible body`);
}})().catch(error=>{console.error(error);process.exitCode=1;});
