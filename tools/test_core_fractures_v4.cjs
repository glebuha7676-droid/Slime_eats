const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const dir='output/core-fractures-v4';fs.mkdirSync(dir,{recursive:true});
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
let core=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
core=core.replace('cores:{home:hp,candy:hp,magma:hp}','cores:{home:hp,candy:hp,magma:hp,desert:hp,source:hp}').replace("['home','candy','magma']","['home','candy','magma','desert','source']");
const finisher=fs.readFileSync('tools/test_core_finisher_browser.cjs','utf8').match(/const hook=base\+core\+`([\s\S]*?)`;/)[1];
const hook=base+core+finisher+`window.__fractureQA={
 async idle(world){__consoleQA.home('fire',3);__coreQA.start({world,hp:25});cancelAnimationFrame(run.animationId);await new Promise(resolve=>{const tick=()=>CORE.ready()?resolve():setTimeout(tick,10);tick()});run.coreEncounter=null;run.coreArena.hp=25;run.cameraY=run.coreArena.surfaceY-420;run.slime.y=run.coreArena.surfaceY-190;await Promise.all(ensureWorldBackgroundLayers(world,25).map(l=>l.image.decode()));renderCanvas(performance.now());},
 geometry(){const rows=[];for(const world of [1,6]){const image=CORE.shellArt(world),c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.drawImage(image,0,0,128,128);const p=x.getImageData(0,0,128,128).data;let top=128,bottom=0;for(let y=0;y<128;y++)for(let col=0;col<128;col++)if(p[(y*128+col)*4+3]>160){top=Math.min(top,y);bottom=Math.max(bottom,y)}rows.push({world,top,bottom,diameter:bottom-top+1})}return rows;},
 effects(id){
  const F=SlimeCoreFractures,frames=[.15,.45,.85].map(p=>F.frame(id,p)),report=[];
  for(let i=0;i<frames.length;i++){const c=frames[i],x=c.getContext('2d'),data=x.getImageData(0,0,512,512).data;let lit=0,r=0,g=0,b=0;for(let j=0;j<data.length;j+=4)if(data[j+3]>35){lit++;r+=data[j];g+=data[j+1];b+=data[j+2]}report.push({lit,color:[r/Math.max(1,lit),g/Math.max(1,lit),b/Math.max(1,lit)]});}
  const a=run.coreArena,f=run.coreEncounter.purification;
  f.age=2450;f.departureAt=1900;f.burstAt=null;run.cameraY=a.surfaceY-540;
  const original=SlimeCoreVfx.stamp,stamps=[];window.SlimeCoreVfx={...SlimeCoreVfx,stamp(c,image,x,y,w,h,alpha,angle){stamps.push({w,h,angle:angle||0});return original(c,image,x,y,w,h,alpha,angle)}};
  const target=document.createElement('canvas');target.width=440;target.height=840;PURIFICATION.draw(target.getContext('2d'),run);window.SlimeCoreVfx={...SlimeCoreVfx,stamp:original};renderCanvas(performance.now());
  let allocations=0,gradients=0;const create=document.createElement.bind(document),proto=CanvasRenderingContext2D.prototype,linear=proto.createLinearGradient,radial=proto.createRadialGradient;
  document.createElement=(tag,...args)=>{if(tag==='canvas')allocations++;return create(tag,...args)};
  proto.createLinearGradient=function(...args){gradients++;return linear.apply(this,args)};proto.createRadialGradient=function(...args){gradients++;return radial.apply(this,args)};
  try{for(let j=0;j<10;j++)PURIFICATION.draw(target.getContext('2d'),run);}finally{document.createElement=create;proto.createLinearGradient=linear;proto.createRadialGradient=radial;}
  return {growth:report,rays:stamps.filter(s=>s.h>200&&s.w<160).length,allocations,gradients};
 },
 paint(){renderCanvas(performance.now());}
};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const p=await browser.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8770/?v=core-fractures-4');await p.waitForTimeout(3000);await p.waitForFunction(()=>window.__fractureQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000});
 const reports=[];
 for(const [world,id]of [[1,'home'],[3,'candy'],[4,'magma'],[5,'desert'],[6,'source']]){
  await p.evaluate(w=>__fractureQA.idle(w),world);await p.screenshot({path:dir+'/'+id+'-damage.png'});
  await p.evaluate(w=>__finisherQA.start('fire',100,5,w),world);let state;
  for(let i=0;i<400;i++){state=await p.evaluate(()=>__finisherQA.step());if(state.phase==='armed')break;}assert.equal(state.phase,'armed');await p.evaluate(()=>__finisherQA.tap());
  for(let i=0;i<240;i++){state=await p.evaluate(()=>__finisherQA.step());if(state.hit)break;}assert(state.hit);
  state=await p.evaluate(()=>__finisherQA.step(110));assert(state.finale&&state.finale.burstAt==null);await p.screenshot({path:dir+'/'+id+'-pressure.png'});
  const effects=await p.evaluate(id=>__fractureQA.effects(id),id);assert(effects.growth[0].lit<effects.growth[1].lit&&effects.growth[1].lit<effects.growth[2].lit);assert.equal(effects.allocations,0);assert.equal(effects.gradients,0);if(id==='source')assert.equal(effects.rays,0);else assert(effects.rays>0);
  await p.screenshot({path:dir+'/'+id+'-tension.png'});
  state=await p.evaluate(()=>__finisherQA.step(22));assert(state.finale.burstAt!=null);await p.screenshot({path:dir+'/'+id+'-burst.png'});
  state=await p.evaluate(()=>__finisherQA.step(180));assert.equal(state.hits,1);assert.equal(state.bursts,1);assert.equal(state.evacs,1);assert(!state.earlyEvac);assert(state.evacuated&&state.finale.finished);assert.equal(state.damage,5);
  await p.screenshot({path:dir+'/'+id+'-after.png'});reports.push({world,id,...effects,damage:state.damage,once:true,evacuationAfterBurst:true});
 }
 const geometry=await p.evaluate(()=>__fractureQA.geometry());assert(Math.abs(geometry[0].diameter-geometry[1].diameter)<=3);
 assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/checks.json',JSON.stringify({reports,geometry,errors},null,2));console.log(JSON.stringify({worlds:reports.map(r=>({id:r.id,rays:r.rays})),geometry,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
