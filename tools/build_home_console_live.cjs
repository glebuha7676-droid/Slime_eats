// Preserve all corners/circular devices; only the plain middle band may extend.
const fs=require('node:fs'),sharp=require('sharp');
(async()=>{
 const dir='assets/ui/home-modular/live';fs.mkdirSync(dir,{recursive:true});
 const source=await sharp('assets/ui/home-modular/generated-v6/console-base-master.png').resize(938,976).png().toBuffer();
 for(const [name,top,height] of [['top',0,490],['middle',490,200],['bottom',690,286]]){
  await sharp(source).extract({left:0,top,width:938,height}).webp({quality:95,effort:6}).toFile(`${dir}/console-${name}.webp`);
 }
 console.log('Console bands exported at 2x the 469x488 layout.');
})().catch(error=>{console.error(error);process.exitCode=1;});
