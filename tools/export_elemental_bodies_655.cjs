const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const root = 'C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs = [
 ['frost-chilled', 'exec-fcbe4782-10a7-489d-9b1f-98fe13f2a721.png'],
 ['frost-snowman', 'exec-94bbbe59-5d2f-4e3c-bd07-71d26628f7bc.png'],
 ['fire-warm', 'exec-bc4daae1-bc68-4469-8d48-6214ba8a31ca.png']
];
(async()=>{for(const [name,file] of jobs){
 const base = `assets/ui/slime/forms/slime-body-${name}-v1`;
 fs.copyFileSync(path.join(root,file), `${base}-master.png`);
 const {data,info} = await sharp(`${base}-master.png`).trim({threshold:10}).resize(434,435,{fit:'inside'}).toBuffer({resolveWithObject:true});
 await sharp({create:{width:512,height:512,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:data,left:Math.round((512-info.width)/2),top:474-info.height}]).webp({lossless:true}).toFile(`${base}.webp`);
 console.log(`${base}.webp: ${info.width} x ${info.height} visible body`);
}})().catch(error=>{console.error(error);process.exitCode=1;});
