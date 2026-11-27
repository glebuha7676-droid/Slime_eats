const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const CORE=require('../js/gameplay/core-encounter.js'),ENERGY=require('../js/gameplay/anomaly-energy.js'),WAVE=require('../js/gameplay/phantom-core-wave.js');
for(const [reserve,n] of [[5,8],[24.99,8],[25,14],[49.99,14],[50,22],[74.99,22],[75,32],[100,32]])assert.equal(WAVE.count(reserve),n);
{
 const run={slime:{x:220,y:500,radius:30},coreEncounter:{power:1,strikeEnergy:100}};
 assert(WAVE.orbit(run,0,2450).radius<WAVE.orbit(run,0,500).radius*.45,'The large incoming orbit contracts into a dense sphere');
 const depths=new Set();for(let i=0;i<32;i++){const p=WAVE.orbit(run,i,2450),next=WAVE.orbit(run,i,2451);depths.add(p.front);assert(Math.hypot(p.x-next.x,p.y-next.y)<3,'Live orbital motion has no frame-to-frame jumps');}
 assert.equal(depths.size,2,'The sphere includes foreground and background spirits');
}
for(const reserve of [1,5,25,50,100])for(const manual of [false,true]){
 const run={mutationId:'phantom',slime:{x:180,y:800,vy:260,radius:30,wobble:0},cameraY:640,coreArena:{x:220,radius:418,centerY:1868,surfaceY:1450,cameraY:887}};
 ENERGY.init(run);run.energy=reserve;CORE.begin(run,80);assert(run.coreEncounter.phantom&&run.coreEncounter.cinematic);
 let hits=0,rescues=0,launch=0,tapped=false,seed=reserve*71+3,previous=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const hooks={random,launch:()=>launch++,impact:n=>{hits++;assert.equal(n,CORE.damage(reserve));return 80-n;},evacuate:()=>{rescues++;const e=run.coreEncounter;assert.equal(e.jet,0);assert.equal(e.slimeAlpha,1);assert.equal(e.phantomHitCount,WAVE.count(reserve));assert(e.souls.every(s=>s.hit));}};
 for(let i=0;i<400;i++){
  if(run.coreEncounter.phase==='approach')assert(!CORE.requestStrike(run));
  if(manual&&!tapped&&run.coreEncounter.phase==='armed'){assert.equal(run.energy,0);assert(CORE.requestStrike(run));const frozen=run.coreEncounter.elapsed;CORE.update(run,.02,hooks);assert.equal(run.coreEncounter.elapsed,frozen);assert(!CORE.requestStrike(run));tapped=true;}
  CORE.update(run,.02,hooks);const e=run.coreEncounter;if(e.phase==='burn')assert.equal(rescues,0);if(e.souls){assert(e.phantomHitCount>=previous);previous=e.phantomHitCount;}
 }
 const e=run.coreEncounter;assert.equal(hits,1,'One persisted attack, despite many soul contacts');assert.equal(rescues,1);assert.equal(launch,1);assert.equal(run.energy,0);assert.equal(e.souls.length,WAVE.count(reserve));
 for(const soul of e.souls){
  assert(soul.delay+soul.duration<CORE.PHANTOM.burn);const point={};WAVE.sample(soul,soul.delay+soul.duration,point);assert(Math.abs(point.x-soul.x)<1e-7&&Math.abs(point.y-soul.y)<1e-7);
  const at=WAVE.clock(e,e.castElapsed),pose={...run,slime:{...run.slime,x:e.castX,y:e.castY}},orb=WAVE.orbit(pose,soul.index,at);assert(Math.hypot(soul.fromX-orb.x,soul.fromY-orb.y)<.001,'Souls depart from their actual sphere positions');
  if(soul.index)assert(soul.delay>e.souls[soul.index-1].delay+0,'The fan opens over a short stagger, without a portal stream');
  assert(soul.side*(soul.c1x-soul.fromX)>8,'Initial impulses fan outward before the paths curl toward the core');
  for(let j=0;j<=80;j++){WAVE.sample(soul,soul.delay+soul.duration*j/80,point);assert(point.x>0&&point.x<440,'Soul remains in the viewport');}
 }
}
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const coreHook=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+coreHook+`window.__phantomQA={
 start(energy=100,stage=3){__consoleQA.home('phantom',stage);__coreQA.start({energy,hp:80});},
 state(){const e=run?.coreEncounter;return {...__coreQA.state(),phantom:e?.phantom,fire:e?.fire,aura:e?.aura,transfer:e?.transfer,jet:e?.jet,power:e?.power,neutral:run?.evacuation?.neutral,screenY:run.slime.y-run.cameraY,gap:run.coreArena.surfaceY-run.slime.y,soulCount:e?.soulCount,soulHits:e?.phantomHitCount,allHit:e?.souls?.every(s=>s.hit)};},
 low(){run.coreEncounter.lowPower=true;},tap(){return CORE.requestStrike(run);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/phantom-core-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await b.newPage({viewport}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=phantom-core-1');await p.waitForFunction(()=>window.__phantomQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await p.evaluate(()=>__phantomQA.start());await p.waitForFunction(()=>__phantomQA.state().phantom);
   assert((await p.evaluate(()=>__phantomQA.state())).gap>700);await p.waitForFunction(()=>__phantomQA.state().transfer>.35);
   let s=await p.evaluate(()=>__phantomQA.state());assert(s.energy>0&&s.energy<100&&s.aura>0&&!s.fire);await p.screenshot({path:`${dir}/gather-${viewport.width}.png`});
   await p.waitForFunction(()=>__phantomQA.state().phase==='armed');await p.waitForTimeout(120);s=await p.evaluate(()=>__phantomQA.state());assert.equal(s.energy,0);assert(s.screenY>340&&s.screenY<440&&s.gap>300);assert.equal(await p.locator('.anomaly-energy-label').textContent(),'УДАР ГОТОВ');assert(await p.locator('#anomalyEnergy').evaluate(e=>e.classList.contains('is-phantom-transfer')));await p.screenshot({path:`${dir}/armed-${viewport.width}.png`});
   await p.locator('#endRunBtn').click();s=await p.evaluate(()=>__phantomQA.state());const frozen=s.elapsed;await p.waitForTimeout(200);assert.equal((await p.evaluate(()=>__phantomQA.state())).elapsed,frozen);assert(!await p.evaluate(()=>__phantomQA.tap()));await p.locator('#resumeRunBtn').click();
   const shaft=await p.locator('#shaft').boundingBox();await p.mouse.click(shaft.x+shaft.width*.5,shaft.y+shaft.height*.5);await p.waitForFunction(()=>__phantomQA.state().phase==='burn'&&__phantomQA.state().phaseTime>300);await p.screenshot({path:`${dir}/soul-flight-${viewport.width}.png`});await p.waitForFunction(()=>__phantomQA.state().hit);
   s=await p.evaluate(()=>__phantomQA.state());assert.equal(s.damage,20);assert.equal(s.campaign.cores.home,60);assert.equal(s.campaign.pending.length,1);assert(!s.evacPhase);await p.screenshot({path:`${dir}/discharge-${viewport.width}.png`});
   assert(!await p.evaluate(()=>__phantomQA.tap()));await p.waitForFunction(()=>!!__phantomQA.state().evacPhase);assert.equal((await p.evaluate(()=>__phantomQA.state())).jet,0);assert((await p.evaluate(()=>__phantomQA.state())).allHit);assert.equal((await p.evaluate(()=>__phantomQA.state())).soulHits,32);await p.waitForTimeout(330);assert((await p.evaluate(()=>__phantomQA.state())).neutral>.3);await p.screenshot({path:`${dir}/return-${viewport.width}.png`});
   await p.waitForFunction(()=>__phantomQA.state().ended,null,{timeout:6000});
   if(viewport.width===440){
    await p.evaluate(()=>__phantomQA.start(5,1));await p.waitForFunction(()=>__phantomQA.state().phase==='armed');s=await p.evaluate(()=>__phantomQA.state());assert.equal(s.power,.25);await p.screenshot({path:dir+'/low-reserve.png'});await p.waitForFunction(()=>__phantomQA.state().hit);assert.equal((await p.evaluate(()=>__phantomQA.state())).damage,11);
    await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__phantomQA.start(60,2));await p.waitForFunction(()=>__phantomQA.state().phase==='armed');await p.evaluate(()=>__phantomQA.low());await p.keyboard.press('Enter');await p.waitForFunction(()=>__phantomQA.state().hit);assert.equal((await p.evaluate(()=>__phantomQA.state())).damage,16);await p.screenshot({path:dir+'/reduced-low-power.png'});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({viewport,phantom:true,transfer:true,pause:true,singleHit:true,delayedRescue:true,errors}));await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
