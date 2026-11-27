const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const CORE=require('../js/gameplay/core-encounter.js'),ENERGY=require('../js/gameplay/anomaly-energy.js');
assert(CORE.rockSize(100)>CORE.rockSize(5)*2.5);
const sides=new Set();
for(const reserve of [1,5,25,50,100])for(const manual of [false,true]){
 const run={mutationId:'telekinesis',slime:{x:180,y:800,vy:260,radius:30,wobble:0},cameraY:640,coreArena:{x:220,surfaceY:1450,cameraY:887}};
 ENERGY.init(run);run.energy=reserve;CORE.begin(run,80);assert(run.coreEncounter.psionic&&run.coreEncounter.cinematic);sides.add(run.coreEncounter.rock.side);
 let hits=0,rescues=0,launch=0,tapped=false,armedAngle=null;
 const hooks={launch:()=>launch++,impact:n=>{hits++;assert.equal(n,CORE.damage(reserve));const r=run.coreEncounter.rock;assert.equal(r.x,r.targetX);assert.equal(r.y,r.targetY);assert(r.broken);return 80-n;},evacuate:()=>{rescues++;assert.equal(run.coreEncounter.jet,0);assert.equal(run.coreEncounter.rock.alpha,0);}};
 for(let i=0;i<400;i++){
  const e=run.coreEncounter;if(e.phase==='approach')assert(!CORE.requestStrike(run));
  if(e.phase==='armed'&&armedAngle===null)armedAngle=e.rock.angle;
  if(e.phase==='armed'&&e.phaseTime>180){assert(Math.abs(e.rock.angle-armedAngle)>3,'The stone visibly spins before release');assert.equal(e.rock.x,e.rock.holdX);assert.equal(e.rock.holdX,220+e.rock.side*112);assert(e.rock.torn&&e.rock.ripAt>=620&&e.rock.ripAt<670);assert.equal(e.rock.pullProgress,1);}
  if(manual&&!tapped&&e.phase==='armed'&&e.phaseTime>200){assert.equal(run.energy,0);assert(CORE.requestStrike(run));const frozen=e.elapsed,angle=e.rock.angle;CORE.update(run,.02,hooks);assert.equal(e.elapsed,frozen);assert.equal(e.rock.angle,angle);assert(!CORE.requestStrike(run));tapped=true;}
  CORE.update(run,.02,hooks);if(e.phase==='burn')assert.equal(rescues,0);
 }
 assert.equal(hits,1);assert.equal(rescues,1);assert.equal(launch,1);assert.equal(run.energy,0);assert.equal(run.coreEncounter.rock.size,CORE.rockSize(reserve));
}
assert.deepEqual([...sides].sort(),[-1,1],'Both walls are used across successive casts');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const coreHook=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+coreHook+`window.__psionicQA={
 start(energy=100,stage=3){__consoleQA.home('telekinesis',stage);__coreQA.start({energy,hp:80});},
 state(){const e=run?.coreEncounter;return {...__coreQA.state(),psionic:e?.psionic,fire:e?.fire,aura:e?.aura,transfer:e?.transfer,jet:e?.jet,power:e?.power,neutral:run?.evacuation?.neutral,screenY:run.slime.y-run.cameraY,gap:run.coreArena.surfaceY-run.slime.y,rock:e?.rock?{...e.rock}:null};},
 low(){run.coreEncounter.lowPower=true;},tap(){return CORE.requestStrike(run);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/psionic-core-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await b.newPage({viewport}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=psionic-core-1');await p.waitForFunction(()=>window.__psionicQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await p.evaluate(()=>__psionicQA.start());await p.waitForFunction(()=>__psionicQA.state().psionic);
   assert((await p.evaluate(()=>__psionicQA.state())).gap>700);await p.waitForFunction(()=>__psionicQA.state().transfer>.35);
   let s=await p.evaluate(()=>__psionicQA.state());assert(s.energy>0&&s.energy<100&&s.aura>0&&!s.fire);await p.screenshot({path:`${dir}/gather-${viewport.width}.png`});
   await p.waitForFunction(()=>__psionicQA.state().phase==='armed');await p.waitForTimeout(120);s=await p.evaluate(()=>__psionicQA.state());assert.equal(s.energy,0);assert(s.screenY>280&&s.screenY<370&&s.gap>360);assert.equal(await p.locator('.anomaly-energy-label').textContent(),'УДАР ГОТОВ');assert(await p.locator('#anomalyEnergy').evaluate(e=>e.classList.contains('is-psionic-transfer')));await p.screenshot({path:`${dir}/armed-${viewport.width}.png`});
   await p.locator('#endRunBtn').click();s=await p.evaluate(()=>__psionicQA.state());const frozen=s.elapsed,angle=s.rock.angle;await p.waitForTimeout(200);assert.equal((await p.evaluate(()=>__psionicQA.state())).elapsed,frozen);assert.equal((await p.evaluate(()=>__psionicQA.state())).rock.angle,angle);assert(!await p.evaluate(()=>__psionicQA.tap()));await p.locator('#resumeRunBtn').click();
   const shaft=await p.locator('#shaft').boundingBox();await p.mouse.click(shaft.x+shaft.width*.5,shaft.y+shaft.height*.5);await p.waitForFunction(()=>__psionicQA.state().phase==='burn'&&__psionicQA.state().phaseTime>110);await p.screenshot({path:`${dir}/throw-${viewport.width}.png`});await p.waitForFunction(()=>__psionicQA.state().hit);
   s=await p.evaluate(()=>__psionicQA.state());assert.equal(s.damage,20);assert.equal(s.campaign.cores.home,60);assert.equal(s.campaign.pending.length,1);assert(!s.evacPhase);await p.screenshot({path:`${dir}/discharge-${viewport.width}.png`});
   assert(!await p.evaluate(()=>__psionicQA.tap()));await p.waitForFunction(()=>!!__psionicQA.state().evacPhase);assert.equal((await p.evaluate(()=>__psionicQA.state())).jet,0);await p.waitForTimeout(330);assert((await p.evaluate(()=>__psionicQA.state())).neutral>.3);await p.screenshot({path:`${dir}/return-${viewport.width}.png`});
   await p.waitForFunction(()=>__psionicQA.state().ended,null,{timeout:6000});
   if(viewport.width===440){
    await p.evaluate(()=>__psionicQA.start(5,1));await p.waitForFunction(()=>__psionicQA.state().phase==='armed');s=await p.evaluate(()=>__psionicQA.state());assert(s.power<.2);await p.screenshot({path:dir+'/low-reserve.png'});await p.waitForFunction(()=>__psionicQA.state().hit);assert.equal((await p.evaluate(()=>__psionicQA.state())).damage,11);
    await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__psionicQA.start(60,2));await p.waitForFunction(()=>__psionicQA.state().phase==='armed');await p.evaluate(()=>__psionicQA.low());await p.keyboard.press('Enter');await p.waitForFunction(()=>__psionicQA.state().hit);assert.equal((await p.evaluate(()=>__psionicQA.state())).damage,16);await p.screenshot({path:dir+'/reduced-low-power.png'});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({viewport,psionic:true,transfer:true,pause:true,singleHit:true,delayedRescue:true,errors}));await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
