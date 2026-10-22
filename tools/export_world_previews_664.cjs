const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs=[
 ['stone','exec-dfe736f6-67ab-4771-a0ae-a41bdcf6c3d1.png'],
 ['candy','exec-97cb7e14-5994-41bc-8e04-f45751c88c3c.png'],
 ['magma','exec-404145b9-4c49-4001-971e-7db2af20dce7.png']
];
(async()=>{for(const [name,file] of jobs){
 const base=`assets/ui/world-terminal/preview-${name}-v4`;
 fs.copyFileSync(path.join(root,file),`${base}-master.png`);
 await sharp(`${base}-master.png`).resize(1200,600,{fit:'cover',position:'centre'}).webp({quality:93,effort:6}).toFile(`${base}.webp`);
 console.log(`${base}.webp: 1200 x 600, ${fs.statSync(`${base}.webp`).size} bytes`);
}})().catch(error=>{console.error(error);process.exitCode=1;});
