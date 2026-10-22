const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root='C:/Users/User/.codex/generated_images/01a153fa-9b98-79f3-aef8-99195441cb12';
const jobs=[
 ['slime-body-phantom-awakening-v1','exec-650044ff-6765-42e6-acf4-1f510e1872d5.png','normal'],
 ['slime-body-phantom-shifting-v2','exec-b9852a7d-3104-4a56-8718-4977cd597b27.png','normal'],
 ['slime-body-psionics-crowned-v2','exec-c47c29c8-76bd-49a8-9a60-6af5ad196721.png','psionics'],
 ['slime-body-psionics-ultra-v2','exec-f5928b01-db2d-4b7d-8803-74c9750dae53.png','psionics'],
 ['slime-body-spores-growing-v2','exec-5bbbc313-04b7-4ece-9a64-1eebb4b6a29b.png','spores']
];
(async()=>{for(const [name,file,type] of jobs){
 const base=`assets/ui/slime/forms/${name}`;fs.copyFileSync(path.join(root,file),`${base}-master.png`);
 let source=sharp(`${base}-master.png`).trim({threshold:10});
 const {data,info}=await (type==='normal'?source.resize(434,435,{fit:'inside'}):source.resize({width:type==='spores'?476:434})).toBuffer({resolveWithObject:true});
 const height=type==='psionics'?640:type==='spores'?576:512,bottom=height-38;
 if(info.height>bottom)throw Error(`Sprite exceeds canvas: ${base}`);
 const left=Math.round((512-info.width)/2),top=bottom-info.height;
 await sharp({create:{width:512,height,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:data,left,top}]).webp({lossless:true}).toFile(`${base}.webp`);
 console.log(JSON.stringify({name,left,top,height,info}));
}
for(const file of ['fire-forms-653.html','frost-forms-655.html','electric-forms-656.html','techno-forms-657.html','psionics-forms-658.html','spores-forms-659.html']){
 const target=path.join('editors',file);
 fs.writeFileSync(target,fs.readFileSync(target,'utf8').replace(/slime-avatar\.js\?v=\d+/g,'slime-avatar.js?v=661').replace(/workbench-effects\.js\?v=\d+/g,'workbench-effects.js?v=661'));
}
})().catch(error=>{console.error(error);process.exitCode=1;});
