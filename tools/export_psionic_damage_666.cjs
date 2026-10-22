const fs=require('node:fs'),sharp=require('sharp'),path=require('node:path');
const source='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
(async()=>{
 const atlas=path.join(source,'exec-0dd1a9f0-8850-45a5-b60d-5448f1c00935.png');
 fs.copyFileSync(atlas,'assets/vfx/psionic-vfx-666-master.png');
 const meta=await sharp(atlas).metadata(),cell=Math.floor(meta.width/2);
 for(const [index,name] of ['pressure','collapse','mote','trail'].entries()){
  const crop=await sharp(atlas).extract({left:index%2*cell,top:Math.floor(index/2)*cell,width:cell,height:cell}).png().toBuffer();
  const trimmed=await sharp(crop).trim({background:'#00000000',threshold:8}).png().toBuffer();
  await sharp(trimmed).resize(512,512,{fit:'contain',background:'#00000000'}).webp({quality:94,alphaQuality:100,effort:6}).toFile(`assets/vfx/psionic-${name}-666.webp`);
 }
 const hurt=path.join(source,'exec-894ab37f-bc28-4d50-bcd7-35723039c8d8.png');
 fs.copyFileSync(hurt,'assets/vfx/damage-impact-666-master.png');
 const trimmed=await sharp(hurt).trim({background:'#00000000',threshold:8}).png().toBuffer();
 await sharp(trimmed).resize(512,512,{fit:'contain',background:'#00000000'}).webp({quality:94,alphaQuality:100,effort:6}).toFile('assets/vfx/damage-impact-666.webp');
 console.log('Five transparent raster VFX exported; both masters retained.');
})().catch(e=>{console.error(e);process.exitCode=1;});
