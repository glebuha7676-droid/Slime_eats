const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const source='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs={
 'stone-far':'exec-52813f50-061f-4892-bf53-34c5ae25af53.png',
 'stone-near':'exec-30e9713d-7451-4d3e-932d-3e8bd63c9fa4.png',
 'candy-far':'exec-068986bd-76f0-4f4c-9308-3b31d8c50805.png',
 'candy-near':'exec-5ef55fad-b82f-45bf-91eb-f238aa59b98a.png',
 'magma-far':'exec-95d613ee-66bd-4578-a94f-a14a70ac7dba.png',
 'magma-near':'exec-6eca7942-b9ff-4915-93b6-132cd8a4dcc7.png'
};
(async()=>{
 for(const [name,file] of Object.entries(jobs)){
  const base=`assets/backgrounds/parallax-v3/${name}`;
  if(fs.existsSync(`${base}.webp`))continue;
  fs.copyFileSync(path.join(source,file),`${base}-master.png`);
  await sharp(`${base}-master.png`).resize({width:768}).webp({quality:name.endsWith('near')?94:90,alphaQuality:100,effort:6}).toFile(`${base}.webp`);
  const meta=await sharp(`${base}.webp`).metadata();
  if(name.endsWith('near')){
   if(!meta.hasAlpha)throw Error(`${name}: missing alpha`);
   const center=await sharp(`${base}.webp`).extract({left:Math.floor(meta.width*.46),top:0,width:Math.floor(meta.width*.08),height:meta.height}).raw().toBuffer({resolveWithObject:true});
   let sum=0;for(let i=3;i<center.data.length;i+=center.info.channels)sum+=center.data[i];
   const mean=sum/(center.info.width*center.info.height);if(mean>8)throw Error(`${name}: center is not clear (${mean})`);
   console.log(`${name}: transparent center alpha ${mean.toFixed(2)}`);
  }
  console.log(`${base}.webp ${meta.width}x${meta.height}, ${fs.statSync(`${base}.webp`).size} bytes`);
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
