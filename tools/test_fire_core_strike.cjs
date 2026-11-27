const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const CORE=require('../js/gameplay/core-encounter.js'),ENERGY=require('../js/gameplay/anomaly-energy.js');
assert(CORE.visualStrength(100)>CORE.visualStrength(5)*5,'Visual strength has a wide continuous range');
for(const reserve of [1,5,25,50,100])for(const manual of [false,true]){
 const run={mutationId:'fire',slime:{x:180,y:800,vy:260,radius:30,wobble:0},cameraY:640,coreArena:{x:220,surfaceY:1450,cameraY:887}};
 ENERGY.init(run);run.energy=reserve;CORE.begin(run,80);let hits=0,rescues=0,tapped=false,lastY=run.slime.y;
 const hooks={impact:n=>{hits++;assert.equal(n,CORE.damage(reserve));return 80-n;},evacuate:()=>{rescues++;assert.equal(run.coreEncounter.jet,0);}};
 for(let i=0;i<400;i++){
  if(run.coreEncounter.phase==='approach'){assert(!CORE.requestStrike(run));assert(run.slime.y>=lastY-.01);lastY=run.slime.y;}
  if(manual&&!tapped&&run.coreEncounter.phase==='armed'&&run.coreEncounter.phaseTime>100){assert.equal(run.energy,0);assert.equal(hits,0);assert(CORE.requestStrike(run));const frozenAt=run.coreEncounter.elapsed;CORE.update(run,.02,hooks);assert.equal(run.coreEncounter.elapsed,frozenAt,'Release holds the action briefly before the blast');assert(!CORE.requestStrike(run));tapped=true;}
  CORE.update(run,.02,hooks);
  if(run.coreEncounter.phase==='burn')assert.equal(rescues,0,'Mutation persists through the complete fire stream');
 }
 assert.equal(hits,1);assert.equal(rescues,1);assert.equal(run.energy,0);assert.equal(run.coreEncounter.strikeEnergy,reserve);assert.equal(run.coreEncounter.actualDamage,CORE.damage(reserve));
}
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const coreHook=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+coreHook+`window.__fireQA={
 start(energy=100,stage=1){__consoleQA.home('fire',stage);__coreQA.start({energy,hp:80});},
 state(){const e=run?.coreEncounter;return {...__coreQA.state(),fire:e?.fire,aura:e?.aura,transfer:e?.transfer,jet:e?.jet,released:e?.released,neutral:run?.evacuation?.neutral,power:e?.power,zoom:e?.zoom,hitStop:e?.hitStop,screenY:run.slime.y-run.cameraY,gap:run.coreArena.surfaceY-run.slime.y};},
 tap(){return CORE.requestStrike(run);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/fire-style-v3';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await b.newPage({viewport}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=fire-core-2');await p.waitForFunction(()=>window.__fireQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await p.evaluate(()=>__fireQA.start());await p.waitForFunction(()=>__fireQA.state().fire);
   const entry=await p.evaluate(()=>__fireQA.state());assert(entry.gap>700,'Gather begins just after the terrain, before the core enters the screen');assert(entry.energy>85);
   await p.waitForFunction(()=>__fireQA.state().transfer>.35);
   const mid=await p.evaluate(()=>__fireQA.state());assert(mid.energy<100&&mid.energy>0);assert(mid.aura>0);assert(!mid.hit);assert(!mid.evacPhase);
   await p.screenshot({path:`${dir}/gather-${viewport.width}.png`});
   await p.waitForFunction(()=>__fireQA.state().phase==='armed');await p.waitForTimeout(140);let s=await p.evaluate(()=>__fireQA.state());assert.equal(s.energy,0);assert(!s.ended);assert(!s.evacPhase);assert(s.screenY>340&&s.screenY<440,'Ready pose stays near screen centre');assert(s.gap>300,'Keep room for the strike');assert(s.zoom>1&&s.zoom<1.09,'Small controlled camera push-in');assert.equal(await p.locator('.anomaly-energy-label').textContent(),'УДАР ГОТОВ');
   await p.screenshot({path:`${dir}/armed-${viewport.width}.png`});
   await p.locator('#endRunBtn').click();const paused=await p.evaluate(()=>__fireQA.state());await p.waitForTimeout(220);assert.equal((await p.evaluate(()=>__fireQA.state())).elapsed,paused.elapsed);assert(!await p.evaluate(()=>__fireQA.tap()));await p.locator('#resumeRunBtn').click();
   const shaft=await p.locator('#shaft').boundingBox();await p.mouse.click(shaft.x+shaft.width*.5,shaft.y+shaft.height*.5);
   s=await p.evaluate(()=>__fireQA.state());assert(['release','burn'].includes(s.phase));assert(!s.evacPhase);await p.waitForFunction(()=>__fireQA.state().hit);
   s=await p.evaluate(()=>__fireQA.state());assert.equal(s.damage,20);assert.equal(s.campaign.cores.home,60);assert.equal(s.campaign.pending.length,1);assert(!s.evacPhase,'Damage does not start evacuation before flame ends');
   await p.screenshot({path:`${dir}/fire-wave-${viewport.width}.png`});
   for(let i=0;i<4;i++)await p.mouse.click(shaft.x+shaft.width*.6,shaft.y+shaft.height*.5);assert.equal((await p.evaluate(()=>__fireQA.state())).campaign.cores.home,60);
   await p.waitForFunction(()=>!!__fireQA.state().evacPhase,null,{timeout:5000});s=await p.evaluate(()=>__fireQA.state());assert.equal(s.jet,0);
   await p.waitForTimeout(330);await p.screenshot({path:`${dir}/neutral-${viewport.width}.png`});assert((await p.evaluate(()=>__fireQA.state())).neutral>.3);
   await p.waitForFunction(()=>__fireQA.state().ended,null,{timeout:6000});assert.equal((await p.evaluate(()=>__fireQA.state())).campaign.cores.home,60);
   if(viewport.width===440){
    await p.evaluate(()=>__fireQA.start(5,1));await p.waitForFunction(()=>__fireQA.state().phase==='armed');const low=await p.evaluate(()=>__fireQA.state());assert(low.aura<.2&&low.power<mid.power*.2);await p.screenshot({path:dir+'/low-reserve.png'});
    await p.waitForFunction(()=>__fireQA.state().hit,null,{timeout:6000});assert.equal((await p.evaluate(()=>__fireQA.state())).damage,11,'No tap falls back to a single strike with reserve damage');
    await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__fireQA.start(60));await p.waitForFunction(()=>__fireQA.state().phase==='armed');await p.waitForTimeout(100);await p.keyboard.press('Space');await p.waitForFunction(()=>__fireQA.state().hit);assert.equal((await p.evaluate(()=>__fireQA.state())).damage,16);
   }
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({viewport,continuousGather:true,reserveTransferred:true,manualStrike:true,oneHit:true,delayedEvacuation:true,pause:true,errors}));await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
