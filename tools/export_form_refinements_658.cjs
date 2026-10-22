const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs=[
 ['assets/ui/slime/forms/slime-body-psionics-budding-v1','exec-c7ab2e9e-d9b2-453b-ae7c-305f19245c37.png','psionics'],
 ['assets/ui/slime/forms/slime-body-psionics-crowned-v1','exec-3d1f3a3a-d640-4c1e-bd15-c8c8cf4e6ce0.png','psionics'],
 ['assets/ui/slime/forms/slime-body-fire-volcano-v2','exec-115d6863-b381-4630-a50b-caa4144807a8.png','body'],
 ['assets/ui/slime/forms/slime-body-techno-upgraded-v2','exec-c1fc99b1-2415-43e2-982d-f6f8512f8b46.png','body'],
 ['effects-lab/assets/nano-eye-base-v12','exec-d185b4cf-c488-4d7e-99e3-360556d237ef.png','eye'],
 ['effects-lab/assets/nano-eye-pupil-v12','exec-881e7e48-9fa1-4f65-8a3e-d8d799dac443.png','pupil']
];
(async()=>{for(const [base,file,type] of jobs){
 fs.copyFileSync(path.join(root,file),`${base}-master.png`);
 let source=sharp(`${base}-master.png`).trim({threshold:10});
 if(type==='eye'||type==='pupil'){
  const size=type==='eye'?384:256;
  await source.resize(size,size,{fit:'inside'}).webp({lossless:true}).toFile(`${base}.webp`);
 }else{
  const tall=type==='psionics';
  source=tall?source.resize({width:434}):source.resize(434,435,{fit:'inside'});
  const {data,info}=await source.toBuffer({resolveWithObject:true});
  const height=tall?640:512,bottom=tall?602:474;
  if(info.height>bottom)throw Error(`Sprite exceeds canvas: ${base}`);
  await sharp({create:{width:512,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:data,left:Math.round((512-info.width)/2),top:bottom-info.height}]).webp({lossless:true}).toFile(`${base}.webp`);
 }
 console.log(`${base}.webp`);
}
for(const file of ['fire-forms-653.html','frost-forms-655.html','electric-forms-656.html','techno-forms-657.html']){
 const dest=path.join('editors',file);
 fs.writeFileSync(dest,fs.readFileSync(dest,'utf8').replace(/slime-avatar\.js\?v=\d+/g,'slime-avatar.js?v=658').replace(/workbench-effects\.js\?v=\d+/g,'workbench-effects.js?v=658'));
}
})().catch(error=>{console.error(error);process.exitCode=1;});
