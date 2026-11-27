const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],core=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+core+`window.__finisherQA={
 async start(id,energy=5,hp=5,world=1,low=false){
  __consoleQA.home(id,3);__coreQA.start({world,hp,energy});cancelAnimationFrame(run.animationId);beginCoreEncounter();cancelAnimationFrame(run.animationId);
  run.paused=false;run.coreEncounter.lowPower=low;run.coreEncounter.reduced=low;
  await preloadMenuAppearance(run.categoryVisuals);await SlimeAvatarRenderer.whenReady();
  while(!CORE.ready()||!PURIFICATION.ready()&&run.coreEncounter.finisher)await new Promise(r=>setTimeout(r,15));
  this.hits=0;this.evacs=0;this.bursts=0;this.earlyEvac=false;
 },
 step(n=1){for(let i=0;i<n;i++){
  CORE.update(run,1/60,{impact:d=>{this.hits++;const event=applyPlanetCoreStrike(d);ENERGY.discharge(run,performance.now());return event.to;},evacuate:()=>{this.evacs++;this.earlyEvac ||= !PURIFICATION.evacuationReady(run)&&run.coreEncounter.finisher;beginAnomalyEvacuation(true);}});
  if(run.evacuation)EVAC.update(run,1/60);
  PURIFICATION.update(run,1/60,{burst:()=>this.bursts++});
 }window.SlimeAnomalyEnergyHud.render(run);renderCanvas(performance.now());return this.state();},
 state(){const e=run.coreEncounter,f=e.purification;return {...__coreQA.state(),finisher:e.finisher,power:e.power,visual:CORE.visualReserve(e),jet:e.jet,pressure:e.attackAge,soulCount:e.soulCount,sporeGrowth:e.spores?SlimeSporesCoreStrike.planting(run).growth:null,zoom:e.zoom,extraRock:e.extraRock?{...e.extraRock}:null,rockSide:e.rock?.side,gun:e.techno?SlimeTechnoCoreStrike.geometry(run):null,drones:e.techno?CORE.droneCount(CORE.visualReserve(e)):0,rift:e.glitch?SlimeGlitchCoreStrike.crashAmount(run):0,finale:f?{age:f.age,burstAt:f.burstAt,finished:f.finished}:null,evacuated:!!run.evacuation?.finished,hits:this.hits,evacs:this.evacs,bursts:this.bursts,earlyEvac:this.earlyEvac};},
 tap(){CORE.requestStrike(run);},live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/core-finisher-v5';fs.mkdirSync(dir,{recursive:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=core-finisher-2');await p.waitForFunction(()=>window.__finisherQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  for(const id of ['fire','electric','frost','cosmos','nano','phantom','telekinesis','glitch','cloning']){
   await p.evaluate(id=>__finisherQA.start(id),id);
   let s;for(let i=0;i<250;i++){s=await p.evaluate(()=>__finisherQA.step());if(s.phase==='overdrive'&&s.phaseTime>480)break;}
   assert.equal(s.phase,'overdrive');await p.screenshot({path:dir+'/'+id+'-overdrive.png'});
   for(let i=0;i<100;i++){s=await p.evaluate(()=>__finisherQA.step());if(s.phase==='armed')break;}
   assert.equal(s.power,1.5);assert.equal(s.visual,150);assert(s.zoom>=1.22);if(id==='telekinesis'){assert(s.extraRock?.torn);assert.notEqual(s.extraRock.side,s.rockSide);assert(s.extraRock.alpha>.9);}if(id==='nano'){assert.equal(s.gun.x,220);assert.equal(s.drones,15);}if(id==='glitch')assert(s.rift>.25);assert.equal(s.strikeEnergy,5);await p.screenshot({path:dir+'/'+id+'-armed.png'});await p.evaluate(()=>__finisherQA.tap());
   for(let i=0;i<180;i++){s=await p.evaluate(()=>__finisherQA.step());if(s.hit)break;}
   assert(s.hit,id+' hits');await p.screenshot({path:dir+'/'+id+'-impact.png'});if(id==='phantom')assert.equal(s.soulCount,50);s=await p.evaluate(()=>__finisherQA.step(45));
   if(id!=='cosmos')assert.equal(s.phase,'burn');assert.equal(s.evacs,0);await p.screenshot({path:dir+'/'+id+'-pressure.png'});
   s=await p.evaluate(()=>__finisherQA.step(75));assert(s.finale&&s.finale.burstAt==null);await p.screenshot({path:dir+'/'+id+'-cracks.png'});
   s=await p.evaluate(()=>__finisherQA.step(50));assert(s.finale.burstAt!=null);assert.equal(s.evacs,0);await p.screenshot({path:dir+'/'+id+'-burst.png'});
   s=await p.evaluate(()=>__finisherQA.step(240));assert(s.evacuated&&s.finale.finished);assert.equal(s.hits,1);assert.equal(s.evacs,1);assert.equal(s.bursts,1);assert(!s.earlyEvac);assert.equal(s.damage,5);assert.equal(s.campaign.pending.length,1);
   console.log(JSON.stringify({id,finish:true,overdrive150AtFiveEnergy:true,damage:s.damage,singleCommit:true,evacAfterBurst:true}));
  }
  await p.evaluate(()=>__finisherQA.start('cloning',100,80));
  const early=await p.evaluate(()=>__finisherQA.step(30));await p.screenshot({path:dir+'/spores-normal-early.png'});
  const middle=await p.evaluate(()=>__finisherQA.step(40));await p.screenshot({path:dir+'/spores-normal-feeding.png'});
  const full=await p.evaluate(()=>__finisherQA.step(65));assert(early.sporeGrowth<middle.sporeGrowth&&middle.sporeGrowth<full.sporeGrowth);assert.equal(full.sporeGrowth,1);assert(!full.finisher);
  await p.screenshot({path:dir+'/spores-normal-grown.png'});
  // Real frame loop, narrow screen and reduced motion: pause, event hooks, results and rescue.
  await p.setViewportSize({width:320,height:568});await p.emulateMedia({reducedMotion:'reduce'});
  await p.evaluate(()=>__finisherQA.start('electric',100,15,3,true));await p.evaluate(()=>__finisherQA.live());
  await p.waitForFunction(()=>__finisherQA.state().phase==='overdrive');await p.evaluate(()=>__coreQA.pause());
  const age=(await p.evaluate(()=>__finisherQA.state())).elapsed;await p.waitForTimeout(180);assert.equal((await p.evaluate(()=>__finisherQA.state())).elapsed,age);
  await p.evaluate(()=>__coreQA.resume());await p.waitForFunction(()=>__finisherQA.state().phase==='armed');await p.evaluate(()=>__finisherQA.tap());
  await p.waitForFunction(()=>__finisherQA.state().hit);await p.waitForTimeout(1300);await p.screenshot({path:dir+'/electric-320.png'});
  await p.waitForFunction(()=>__finisherQA.state().ended,null,{timeout:12000});
  let s=await p.evaluate(()=>__finisherQA.state());assert.equal(s.damage,15);assert(s.finisher&&s.finale.finished&&s.evacuated);assert.equal(s.campaign.cores.candy,0);
  await p.evaluate(()=>__finisherQA.start('fire',25,15));s=await p.evaluate(()=>__finisherQA.step(120));assert(!s.finisher);await p.evaluate(()=>__finisherQA.tap());s=await p.evaluate(()=>__finisherQA.step(180));assert.equal(s.damage,13);assert.equal(s.evacs,1);assert.equal(s.campaign.cores.home,2);
  assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/verification.json',JSON.stringify({allNine:true,errors,normalDamageUnchanged:true},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
