const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const CORE=require('../js/gameplay/core-encounter.js'),ENERGY=require('../js/gameplay/anomaly-energy.js'),EVAC=require('../js/gameplay/anomaly-evacuation.js');
const contacts=new Set();
for(const [values,tier]of [[[0,1,5,24,24.99],1],[[25,35,49,49.99],2],[[50,60,74,74.99],3],[[75,85,99,100],4]])for(const value of values)assert.equal(CORE.cosmosTier(value),tier);
for(const reserve of [1,5,25,50,100])for(const manual of [false,true])for(const step of [1/30,1/60]){
 const run={mutationId:'cosmos',slime:{x:180,y:800,vy:260,radius:30,wobble:0},cameraY:640,coreArena:{x:220,radius:418,centerY:1868,surfaceY:1450,cameraY:887},blocks:[]};
 ENERGY.init(run);run.energy=reserve;CORE.begin(run,80);assert(run.coreEncounter.cosmos&&run.coreEncounter.cinematic);assert.equal(run.coreEncounter.power,CORE.cosmosTier(reserve)/4);
 let hits=0,rescues=0,launch=0,tapped=false,seed=reserve*37+(manual?12:3)+(step<.02?1:4),top=Infinity,impactAngle;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const hooks={random,launch:()=>launch++,impact:n=>{hits++;assert.equal(n,CORE.damage(reserve));return 80-n;},evacuate:()=>{rescues++;const e=run.coreEncounter;assert.equal(e.jet,0);assert(e.bounceStartY-top>220);assert(run.slime.vy>0&&run.slime.vy<150);EVAC.begin(run,{completed:true});assert.equal(run.evacuation.vy,run.slime.vy,'Rescue preserves the rebound velocity instead of kicking upward again');}};
 for(let i=0;i<600;i++){
  if(run.coreEncounter.phase==='approach')assert(!CORE.requestStrike(run));
  if(manual&&!tapped&&run.coreEncounter.phase==='armed'){assert.equal(run.energy,0);assert(CORE.requestStrike(run));const frozen=run.coreEncounter.elapsed;CORE.update(run,.02,hooks);assert.equal(run.coreEncounter.elapsed,frozen);assert(!CORE.requestStrike(run));tapped=true;}
  CORE.update(run,step,hooks);
  if(run.coreEncounter.hit){impactAngle??=run.coreEncounter.flightAngle;assert.equal(run.coreEncounter.flightAngle,impactAngle,'Tail does not flip when velocity reflects');}
  if(run.coreEncounter.phase==='rebound'){top=Math.min(top,run.slime.y);assert.equal(rescues,0);assert(run.slime.x>=run.slime.radius&&run.slime.x<=440-run.slime.radius);}
 }
 const e=run.coreEncounter;assert.equal(hits,1);assert.equal(rescues,1);assert.equal(launch,1);assert.equal(e.strikeEnergy,reserve);assert.equal(run.energy,0);assert(e.bounceVy<-790);contacts.add(e.contactX.toFixed(2));
}
assert(contacts.size>12,'Contact and physical rebound vary between casts');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const coreHook=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+coreHook+`window.__cosmosQA={
 start(energy=100,stage=3){__consoleQA.home('cosmos',stage);__coreQA.start({energy,hp:80});},
 state(){const e=run?.coreEncounter;return {...__coreQA.state(),cosmos:e?.cosmos,fire:e?.fire,aura:e?.aura,transfer:e?.transfer,jet:e?.jet,power:e?.power,neutral:run?.evacuation?.neutral,screenY:run.slime.y-run.cameraY,gap:run.coreArena.surfaceY-run.slime.y,vx:run.slime.vx,vy:run.slime.vy,contactX:e?.contactX,bounceVx:e?.bounceVx,bounceVy:e?.bounceVy};},
 auraMatch(){
  const saved=run.cosmosUltimate,entry=run.portalEntry,ignition=run.cosmosCometIgnitedAt;run.portalEntry=null;run.cosmosCometIgnitedAt=0;run.cosmosUltimate={chargeUntil:100,fadeStartedAt:4000,fadeUntil:5000};
  let softer=true;for(const front of [false,true]){const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=160;a.height=b.height=320;drawCosmosCometVisual(2000,80,260,30,front,{strength:1,ultra:1},a.getContext('2d'));drawCosmosCometVisual(2000,80,260,30,front,{strength:1,ultra:1,softRim:true},b.getContext('2d'));const x=a.getContext('2d').getImageData(0,0,160,320).data,y=b.getContext('2d').getImageData(0,0,160,320).data;softer&&=x.some((n,i)=>n!==y[i]);}
  run.cosmosUltimate=saved;run.portalEntry=entry;run.cosmosCometIgnitedAt=ignition;return softer;
 },
 renderBudget(){
  const c=document.createElement('canvas');c.width=440;c.height=840;const x=c.getContext('2d');let gradients=0,images=0;const image=x.drawImage.bind(x),linear=x.createLinearGradient.bind(x),radial=x.createRadialGradient.bind(x);x.drawImage=(...a)=>{images++;return image(...a);};x.createLinearGradient=(...a)=>{gradients++;return linear(...a);};x.createRadialGradient=(...a)=>{gradients++;return radial(...a);};
  const fake={...run,evacuation:null,slime:{...run.slime},coreEncounter:{...run.coreEncounter,phase:'rebound',aura:.5,power:1,hit:true,hitAt:2500,elapsed:2700,contactX:220,contactY:run.coreArena.surfaceY,contactSlimeY:run.coreArena.surfaceY-25,castX:220,castY:run.coreArena.surfaceY-330}};
  const at=performance.now();for(let i=0;i<200;i++){fake.coreEncounter.elapsed=2600+i;SlimeCosmosCoreStrike.draw(x,fake);SlimeCosmosCoreStrike.draw(x,fake,true);}return {gradients,imagesPerFrame:images/200,msPerFrame:(performance.now()-at)/200};
 },
 low(){run.coreEncounter.lowPower=true;},tap(){return CORE.requestStrike(run);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/cosmos-core-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await b.newPage({viewport}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=cosmos-core-1');await p.waitForFunction(()=>window.__cosmosQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await p.evaluate(()=>__cosmosQA.start());await p.waitForFunction(()=>__cosmosQA.state().cosmos);
   assert((await p.evaluate(()=>__cosmosQA.state())).gap>700);assert(await p.evaluate(()=>__cosmosQA.auraMatch()),'The stage-III painter softens both rim layers for the finisher');await p.waitForFunction(()=>__cosmosQA.state().transfer>.35);
   let s=await p.evaluate(()=>__cosmosQA.state());assert(s.energy>0&&s.energy<100&&s.aura>0&&!s.fire);await p.screenshot({path:`${dir}/gather-${viewport.width}.png`});
   await p.waitForFunction(()=>__cosmosQA.state().phase==='armed');await p.waitForTimeout(120);s=await p.evaluate(()=>__cosmosQA.state());assert.equal(s.energy,0);assert(s.screenY>340&&s.screenY<440&&s.gap>300);assert.equal(await p.locator('.anomaly-energy-label').textContent(),'УДАР ГОТОВ');assert(await p.locator('#anomalyEnergy').evaluate(e=>e.classList.contains('is-cosmos-transfer')));await p.screenshot({path:`${dir}/armed-${viewport.width}.png`});
   await p.locator('#endRunBtn').click();s=await p.evaluate(()=>__cosmosQA.state());const frozen=s.elapsed;await p.waitForTimeout(200);assert.equal((await p.evaluate(()=>__cosmosQA.state())).elapsed,frozen);assert(!await p.evaluate(()=>__cosmosQA.tap()));const budget=await p.evaluate(()=>__cosmosQA.renderBudget());assert.equal(budget.gradients,0);assert(budget.imagesPerFrame<45);console.log(JSON.stringify({budget}));await p.locator('#resumeRunBtn').click();
   const shaft=await p.locator('#shaft').boundingBox();await p.mouse.click(shaft.x+shaft.width*.5,shaft.y+shaft.height*.5);await p.waitForFunction(()=>__cosmosQA.state().hit);
   s=await p.evaluate(()=>__cosmosQA.state());assert.equal(s.damage,20);assert.equal(s.campaign.cores.home,60);assert.equal(s.campaign.pending.length,1);assert(!s.evacPhase);await p.waitForTimeout(180);await p.screenshot({path:`${dir}/impact-${viewport.width}.png`});await p.waitForFunction(()=>__cosmosQA.state().phase==='rebound'&&__cosmosQA.state().gap>240);const bounce=await p.evaluate(()=>__cosmosQA.state());assert(bounce.vy<0);await p.screenshot({path:`${dir}/rebound-${viewport.width}.png`});
   assert(!await p.evaluate(()=>__cosmosQA.tap()));await p.waitForFunction(()=>!!__cosmosQA.state().evacPhase);assert.equal((await p.evaluate(()=>__cosmosQA.state())).jet,0);await p.waitForTimeout(330);assert((await p.evaluate(()=>__cosmosQA.state())).neutral>.3);await p.screenshot({path:`${dir}/return-${viewport.width}.png`});
   await p.waitForFunction(()=>__cosmosQA.state().ended,null,{timeout:6000});
   if(viewport.width===440){
    await p.evaluate(()=>__cosmosQA.start(5,1));await p.waitForFunction(()=>__cosmosQA.state().phase==='armed');s=await p.evaluate(()=>__cosmosQA.state());assert.equal(s.power,.25);await p.screenshot({path:dir+'/low-reserve.png'});await p.waitForFunction(()=>__cosmosQA.state().hit);assert.equal((await p.evaluate(()=>__cosmosQA.state())).damage,11);
    await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__cosmosQA.start(60,2));await p.waitForFunction(()=>__cosmosQA.state().phase==='armed');await p.evaluate(()=>__cosmosQA.low());await p.keyboard.press('Enter');await p.waitForFunction(()=>__cosmosQA.state().hit);assert.equal((await p.evaluate(()=>__cosmosQA.state())).damage,16);await p.screenshot({path:dir+'/reduced-low-power.png'});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({viewport,cosmos:true,transfer:true,pause:true,singleHit:true,delayedRescue:true,errors}));await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
