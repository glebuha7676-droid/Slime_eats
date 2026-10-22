const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='outputs/visual-refinements-667';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],requests=[];
 try{
  const page=await browser.newPage({viewport:{width:1100,height:650}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});
  const result=await page.evaluate(async()=>{
   const variants=['','fireUltra','frostSnowman','electricUltra','technoUltra','psionicsUltra','sporesUltra','phantomUltra','glitchArcade','glitchUltra','cosmosUltra'];
   const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d',{willReadFrequently:true});
   await Promise.all(variants.map(bodyVariant=>SlimeAvatarRenderer.preloadAppearance({bodyVariant})));
   await SlimePsionicFeedback.preload();
   const old=SlimeGameAssets.projectSprite('assets/ui/slime/forms/slime-body-glitch-arcade-v1.webp');await old.decode();
   function measure(bodyVariant,tint,original=false){
    c.clearRect(0,0,512,512);
    if(original)c.drawImage(old,138,162,236,236);
    else SlimeAvatarRenderer.drawSlimeAvatar(c,{x:256,y:280,radius:100,appearance:'cute-v2',bodyVariant,hideFace:true,hitTint:tint});
    const data=c.getImageData(0,0,512,512).data;let r=0,g=0,b=0,count=0,minX=512,maxX=0,minY=512,maxY=0;
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;if(data[i+3]<170)continue;r+=data[i];g+=data[i+1];b+=data[i+2];count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    return {r:r/count,g:g/count,b:b/count,width:maxX-minX+1,height:maxY-minY+1};
   }
   const red=variants.map(variant=>({variant,normal:measure(variant,''),strong:measure(variant,'damage-red-strong'),medium:measure(variant,'damage-red-medium')}));
   const timeline=[20,120,300,600,800,1100].map(age=>SlimeDamageFeedback.reaction(10000+age,10000,12000));
   const oldGlitch=measure('glitchArcade','',true);
   const compare=document.createElement('canvas');compare.width=720;compare.height=450;const x=compare.getContext('2d');
   x.fillStyle='#19465b';x.fillRect(0,0,720,450);x.fillStyle='#f4fdff';x.font='900 23px Nunito';x.textAlign='center';x.fillText('Было',180,48);x.fillText('Стало',540,48);
   x.drawImage(old,180-165.2,255-165.2,330.4,330.4);
   SlimeAvatarRenderer.drawSlimeAvatar(x,{x:540,y:255,radius:140,appearance:'cute-v2',bodyVariant:'glitchArcade',hideFace:true});
   const damage=document.createElement('canvas');damage.width=780;damage.height=330;const d=damage.getContext('2d');d.fillStyle='#19465b';d.fillRect(0,0,780,330);
   for(const [i,tint] of ['',timeline[1].tint,timeline[2].tint].entries()){
    SlimeAvatarRenderer.drawSlimeAvatar(d,{x:130+i*260,y:205,radius:100,appearance:'cute-v2',bodyVariant:'psionicsUltra',psionicsEyes:true,emotion:i?'hurt':'focused',hitTint:tint});
   }
   return {red,timeline,oldGlitch,compare:compare.toDataURL().split(',')[1],damage:damage.toDataURL().split(',')[1]};
  });
  fs.writeFileSync(`${out}/glitch-before-after.png`,Buffer.from(result.compare,'base64'));fs.writeFileSync(`${out}/damage-red-body.png`,Buffer.from(result.damage,'base64'));delete result.compare;delete result.damage;
  for(const r of result.red){assert(r.strong.r>r.strong.g*2&&r.strong.r>r.strong.b*1.7,`${r.variant}: strong hit must be red`);assert(r.medium.r>r.medium.g*1.7&&r.medium.r>r.medium.b*1.5,`${r.variant}: sustained hit must be red`);assert(Math.abs(r.strong.height-r.normal.height)<=2,`${r.variant}: hit must keep shape`);}
  const glitch=result.red.find(r=>r.variant==='glitchArcade').normal;
  const standard=result.red.find(r=>r.variant==='').normal;
  assert(Math.abs(glitch.height/glitch.width-standard.height/standard.width)<.06,'Glitch II must follow the ordinary slime proportions (new body in 668)');
  assert(result.timeline.slice(0,4).every(s=>s.tint.startsWith('damage-red-')&&s.alpha===1),'Red hit must remain clearly visible for 650ms');
  assert.equal(requests.filter(url=>/psionic-(pressure|collapse|mote|trail)-666/.test(url)).length,0,'Generated psionic VFX must not load');
  await page.goto('http://127.0.0.1:8766/editors/glitch-forms-662.html');await page.waitForFunction(()=>window.previewReady);await page.evaluate(()=>{window.previewPaused=true;glitchFormsPreview.draw(1000);});await page.screenshot({path:`${out}/glitch-three-stages.png`});
  fs.writeFileSync(`${out}/checks.json`,JSON.stringify({errors,...result},null,2));assert.deepEqual(errors,[]);
  console.log('Glitch II upright silhouette, red hit on 11 bodies, sustained red timing, preserved shapes, and zero generated psionic requests passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
