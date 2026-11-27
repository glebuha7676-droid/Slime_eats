const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const P=require('../js/rendering/core-purification.js');
assert.equal(new Set(['home','candy','magma','desert'].map(id=>P.palette(id)[1])).size,4);
for(const hp of [80,0,5]){
 const run={worldId:1,cameraY:1000,coreArena:{surfaceY:1745},coreEncounter:{hit:true,beforeHp:hp,afterHp:hp===5?0:hp,actualDamage:hp===5?5:0},evacuation:{finished:false}};
 let bursts=0;for(let i=0;i<Math.floor(P.TIMES.pressure*.06);i++)P.update(run,1/60,{burst:()=>bursts++});
 if(hp!==5){assert(!P.active(run));continue;}
 assert(P.active(run)&&!P.revealed(run));assert.equal(bursts,0,'Shell is still under pressure');
 run.paused=true;const age=run.coreEncounter.purification.age;P.update(run,.05);assert.equal(run.coreEncounter.purification.age,age);run.paused=false;
 P.update(run,0);for(let i=0;i<90;i++)P.update(run,1/60,{burst:()=>bursts++});
 assert.equal(bursts,1);assert(P.revealed(run));assert(!P.finished(run),'The clean core has its own hold');
 run.evacuation.finished=true;for(let i=0;i<220;i++)P.update(run,1/60,{burst:()=>bursts++});assert(P.finished(run));assert.equal(bursts,1);assert.equal(run.cameraY,1000);
}
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],core=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+core+`window.__purifyQA={
 start(world=1,hp=5,id='fire'){__consoleQA.home(id,3);__coreQA.start({world,hp,energy:100});},
 state(){return {...__coreQA.state(),finale:run?.coreEncounter?.purification?{...run.coreEncounter.purification}:null,evacuated:!!run?.evacuation?.finished,results:!els.resultOverlay.classList.contains('hidden')};},
 tap(){CORE.requestStrike(run);},pause(){__coreQA.pause();},resume(){__coreQA.resume();},
 async colors(){
  cancelAnimationFrame(run.animationId);const target=document.createElement('canvas');target.width=440;target.height=840;const c=target.getContext('2d'),rows=[];
  for(const id of ['home','candy','magma','desert']){
   PURIFICATION.prepare(id);while(!PURIFICATION.ready())await new Promise(r=>setTimeout(r,10));
   const scene={planetId:id,cameraY:1000,shake:0,coreArena:{x:220,radius:418,surfaceY:1745,centerY:2163},coreEncounter:{hit:true,beforeHp:5,afterHp:0,actualDamage:5,lowPower:false,reduced:false},evacuation:{finished:true}};
   PURIFICATION.update(scene,0);let allocations=0,gradients=0,active=true;
   const create=document.createElement.bind(document),proto=CanvasRenderingContext2D.prototype,linear=proto.createLinearGradient,radial=proto.createRadialGradient;
   document.createElement=(...a)=>{if(active&&a[0]==='canvas')allocations++;return create(...a);};
   proto.createLinearGradient=function(...a){if(active)gradients++;return linear.apply(this,a);};proto.createRadialGradient=function(...a){if(active)gradients++;return radial.apply(this,a);};
   try{for(let i=0;i<280;i++){PURIFICATION.update(scene,1/60);c.clearRect(0,0,440,840);c.fillStyle='#0b3146';c.fillRect(0,0,440,840);PURIFICATION.draw(c,scene);PURIFICATION.drawFlash(c,scene);}}finally{active=false;document.createElement=create;proto.createLinearGradient=linear;proto.createRadialGradient=radial;}
   rows.push({id,allocations,gradients,image:target.toDataURL('image/webp',.9).split(',')[1]});
  }return rows;
 }
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/core-purification-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await browser.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=core-purification-1');await p.waitForFunction(()=>window.__purifyQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   if(viewport.width===320)await p.emulateMedia({reducedMotion:'reduce'});
   await p.evaluate(()=>__purifyQA.start(1));await p.waitForFunction(()=>__purifyQA.state().phase==='armed');await p.evaluate(()=>__purifyQA.tap());
   await p.waitForFunction(()=>__purifyQA.state().finale);await p.waitForTimeout(180);let s=await p.evaluate(()=>__purifyQA.state());
   assert.equal(s.damage,5);assert.equal(s.campaign.cores.home,0);assert(s.campaign.unlocked.includes('candy'));assert(!s.results);await p.screenshot({path:`${dir}/critical-${viewport.width}.png`});
   await p.waitForFunction(()=>__purifyQA.state().finale.age>3300);await p.screenshot({path:`${dir}/fractures-${viewport.width}.png`});
   assert(!(await p.evaluate(()=>__purifyQA.state())).results);
   await p.evaluate(()=>__purifyQA.pause());s=await p.evaluate(()=>__purifyQA.state());await p.waitForTimeout(200);assert.equal((await p.evaluate(()=>__purifyQA.state())).finale.age,s.finale.age);await p.evaluate(()=>__purifyQA.resume());
   await p.waitForFunction(()=>{const f=__purifyQA.state().finale;return f.age-f.departureAt>850;});await p.screenshot({path:`${dir}/tension-${viewport.width}.png`});
   await p.waitForFunction(()=>__purifyQA.state().finale.burstAt!=null);await p.waitForTimeout(160);await p.screenshot({path:`${dir}/burst-${viewport.width}.png`});
   await p.waitForFunction(()=>{const f=__purifyQA.state().finale;return f.age-f.burstAt>1050;});s=await p.evaluate(()=>__purifyQA.state());assert(!s.results&&!s.ended);await p.screenshot({path:`${dir}/clean-${viewport.width}.png`});
   await p.waitForFunction(()=>__purifyQA.state().ended,null,{timeout:6000});s=await p.evaluate(()=>__purifyQA.state());assert(s.finale.finished&&s.results);assert.equal(s.campaign.pending.length,1);assert.equal(s.damage,5);
   if(viewport.width===440){const colors=await p.evaluate(()=>__purifyQA.colors());for(const color of colors){assert.equal(color.allocations,0);assert.equal(color.gradients,0);fs.writeFileSync(dir+'/clean-'+color.id+'.webp',Buffer.from(color.image,'base64'));}}
   assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,critical:true,evacuationAfterBurst:true,pause:true,cleanHold:true,once:true,errors}));await p.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
