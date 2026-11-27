const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const CORE=require('../js/gameplay/core-encounter.js'),ENERGY=require('../js/gameplay/anomaly-energy.js');
for(const reserve of [1,5,25,50,100])for(const manual of [false,true]){
 const run={mutationId:'electric',slime:{x:180,y:800,vy:260,radius:30,wobble:0},cameraY:640,coreArena:{x:220,surfaceY:1450,cameraY:887}};
 ENERGY.init(run);run.energy=reserve;CORE.begin(run,80);assert(run.coreEncounter.electric&&run.coreEncounter.cinematic&&!run.coreEncounter.fire);
 let hits=0,rescues=0,launch=0,tapped=false;
 const hooks={launch:()=>launch++,impact:n=>{hits++;assert.equal(n,CORE.damage(reserve));return 80-n;},evacuate:()=>{rescues++;assert.equal(run.coreEncounter.jet,0);}};
 for(let i=0;i<400;i++){
  if(run.coreEncounter.phase==='approach')assert(!CORE.requestStrike(run));
  if(manual&&!tapped&&run.coreEncounter.phase==='armed'){
   assert.equal(run.energy,0);assert(CORE.requestStrike(run));const frozen=run.coreEncounter.elapsed;CORE.update(run,.02,hooks);assert.equal(run.coreEncounter.elapsed,frozen);assert(!CORE.requestStrike(run));tapped=true;
  }
  CORE.update(run,.02,hooks);if(run.coreEncounter.phase==='burn')assert.equal(rescues,0);
 }
 assert.equal(hits,1);assert.equal(rescues,1);assert.equal(launch,1);assert.equal(run.coreEncounter.strikeEnergy,reserve);assert.equal(run.energy,0);
}
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const coreHook=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+coreHook+`window.__electricQA={
 start(energy=100,stage=3){__consoleQA.home('electric',stage);__coreQA.start({energy,hp:80});},
 state(){const e=run?.coreEncounter;return {...__coreQA.state(),electric:e?.electric,fire:e?.fire,aura:e?.aura,transfer:e?.transfer,jet:e?.jet,power:e?.power,neutral:run?.evacuation?.neutral,screenY:run.slime.y-run.cameraY,gap:run.coreArena.surfaceY-run.slime.y};},
 low(){run.coreEncounter.lowPower=true;},tap(){return CORE.requestStrike(run);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/electric-core-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await b.newPage({viewport}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=electric-core-1');await p.waitForFunction(()=>window.__electricQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await p.evaluate(()=>__electricQA.start());await p.waitForFunction(()=>__electricQA.state().electric);
   assert((await p.evaluate(()=>__electricQA.state())).gap>700);await p.waitForFunction(()=>__electricQA.state().transfer>.35);
   let s=await p.evaluate(()=>__electricQA.state());assert(s.energy>0&&s.energy<100&&s.aura>0&&!s.fire);await p.screenshot({path:`${dir}/gather-${viewport.width}.png`});
   await p.waitForFunction(()=>__electricQA.state().phase==='armed');await p.waitForTimeout(120);s=await p.evaluate(()=>__electricQA.state());assert.equal(s.energy,0);assert(s.screenY>340&&s.screenY<440&&s.gap>300);assert.equal(await p.locator('.anomaly-energy-label').textContent(),'УДАР ГОТОВ');assert(await p.locator('#anomalyEnergy').evaluate(e=>e.classList.contains('is-electric-transfer')));await p.screenshot({path:`${dir}/armed-${viewport.width}.png`});
   await p.locator('#endRunBtn').click();s=await p.evaluate(()=>__electricQA.state());const frozen=s.elapsed;await p.waitForTimeout(200);assert.equal((await p.evaluate(()=>__electricQA.state())).elapsed,frozen);assert(!await p.evaluate(()=>__electricQA.tap()));await p.locator('#resumeRunBtn').click();
   const shaft=await p.locator('#shaft').boundingBox();await p.mouse.click(shaft.x+shaft.width*.5,shaft.y+shaft.height*.5);await p.waitForFunction(()=>__electricQA.state().hit);
   s=await p.evaluate(()=>__electricQA.state());assert.equal(s.damage,20);assert.equal(s.campaign.cores.home,60);assert.equal(s.campaign.pending.length,1);assert(!s.evacPhase);await p.screenshot({path:`${dir}/discharge-${viewport.width}.png`});
   assert(!await p.evaluate(()=>__electricQA.tap()));await p.waitForFunction(()=>!!__electricQA.state().evacPhase);assert.equal((await p.evaluate(()=>__electricQA.state())).jet,0);await p.waitForTimeout(330);assert((await p.evaluate(()=>__electricQA.state())).neutral>.3);await p.screenshot({path:`${dir}/return-${viewport.width}.png`});
   await p.waitForFunction(()=>__electricQA.state().ended,null,{timeout:6000});
   if(viewport.width===440){
    await p.evaluate(()=>__electricQA.start(5,1));await p.waitForFunction(()=>__electricQA.state().phase==='armed');s=await p.evaluate(()=>__electricQA.state());assert(s.power<.2);await p.screenshot({path:dir+'/low-reserve.png'});await p.waitForFunction(()=>__electricQA.state().hit);assert.equal((await p.evaluate(()=>__electricQA.state())).damage,11);
    await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__electricQA.start(60,2));await p.waitForFunction(()=>__electricQA.state().phase==='armed');await p.evaluate(()=>__electricQA.low());await p.keyboard.press('Enter');await p.waitForFunction(()=>__electricQA.state().hit);assert.equal((await p.evaluate(()=>__electricQA.state())).damage,16);await p.screenshot({path:dir+'/reduced-low-power.png'});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({viewport,electric:true,transfer:true,pause:true,singleHit:true,delayedRescue:true,errors}));await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
