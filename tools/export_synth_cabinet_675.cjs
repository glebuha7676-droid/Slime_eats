const fs=require('node:fs'),sharp=require('sharp');
const source='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12/exec-6a08967c-a422-4a41-aa27-b8fd51c3ca35.png';
const base='assets/ui/laboratory-refined/synth-cabinet-v1';
(async()=>{
 fs.mkdirSync('assets/ui/laboratory-refined',{recursive:true});fs.copyFileSync(source,base+'-master.png');
 // Trim the transparent margins and the detached speck above the actual cabinet.
 await sharp(source).extract({left:0,top:42,width:1254,height:1180}).resize({width:1024}).webp({quality:96,alphaQuality:100,effort:6}).toFile(base+'.webp');
 const tall='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12/exec-6e31106c-1ec4-40a3-9aa8-81d76e9aaf44.png';
 fs.copyFileSync(tall,base+'-portrait-master.png');
 await sharp(tall).resize({width:1024}).webp({quality:96,alphaQuality:100,effort:6}).toFile(base+'-portrait.webp');
 console.log(await sharp(base+'.webp').metadata());
})().catch(error=>{console.error(error);process.exitCode=1;});
