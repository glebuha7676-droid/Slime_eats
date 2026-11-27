const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const CORE=require('../js/gameplay/core-encounter.js'),ENERGY=require('../js/gameplay/anomaly-energy.js');
for(const [reserve,tier] of [[1,1],[24.99,1],[25,2],[49.99,2],[50,3],[74.99,3],[75,4],[100,4]]) {
 const run={mutationId:'glitch',energy:reserve,slime:{x:180,y:800,vy:260,radius:30,wobble:0},cameraY:640,coreArena:{x:220,radius:418,centerY:1868,surfaceY:1450,cameraY:887}};
 ENERGY.init(run);run.energy=reserve;CORE.begin(run,80);assert.equal(run.coreEncounter.powerTier,tier);
 let hits=0,rescues=0,launches=0;const hooks={launch:()=>launches++,impact:n=>{hits++;assert.equal(n,CORE.damage(reserve));return 80-n;},evacuate:()=>{rescues++;assert.equal(run.coreEncounter.jet,0);}};
 let tapped=false;
 for(let i=0;i<400;i++){
  const e=run.coreEncounter;if(e.phase==='armed'&&!tapped){assert.equal(run.energy,0);assert(CORE.requestStrike(run));tapped=true;assert(!CORE.requestStrike(run));}
  CORE.update(run,.02,hooks);if(e.phase==='burn'&&e.phaseTime<CORE.GLITCH.hit)assert(!e.hit);
 }
 assert.equal(hits,1);assert.equal(rescues,1);assert.equal(launches,1);assert.equal(run.energy,0);assert.equal(run.coreEncounter.actualDamage,CORE.damage(reserve));
}
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=\x60([\s\S]*?)\x60;/)[1];
const coreHook=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+\x60([\s\S]*?)\x60;/)[1];
const hook=base+coreHook+`window.__glitchQA={
 start(energy=100,stage=3){__consoleQA.home('glitch',stage);__coreQA.start({energy,hp:80});},
 state(){const e=run?.coreEncounter;return {...__coreQA.state(),glitch:e?.glitch,aura:e?.aura,transfer:e?.transfer,jet:e?.jet,power:e?.power,powerTier:e?.powerTier,neutral:run?.evacuation?.neutral,screenY:run.slime.y-run.cameraY,gap:run.coreArena.surfaceY-run.slime.y,rupture:SlimeGlitchCoreStrike.rupture(run),crash:SlimeGlitchCoreStrike.crashAmount(run)};},
 low(){run.coreEncounter.lowPower=true;},tap(){return CORE.requestStrike(run);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),out='output/glitch-core-v1';fs.mkdirSync(out,{recursive:true});
 try {
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await b.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=glitch-core-1');await p.waitForFunction(()=>window.__glitchQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await p.evaluate(()=>__glitchQA.start());await p.waitForFunction(()=>__glitchQA.state().transfer>.35);
   let s=await p.evaluate(()=>__glitchQA.state());assert(s.energy>0&&s.energy<100&&s.aura>0&&s.glitch);
   await p.screenshot({path:out+'/gather-'+viewport.width+'.png'});
   await p.waitForFunction(()=>__glitchQA.state().phase==='armed');await p.waitForTimeout(100);
   s=await p.evaluate(()=>__glitchQA.state());assert.equal(s.powerTier,4);assert.equal(s.energy,0);assert(s.screenY>340&&s.screenY<440);
   assert(await p.locator('#anomalyEnergy').evaluate(e=>e.classList.contains('is-glitch-transfer')));
   await p.screenshot({path:out+'/armed-'+viewport.width+'.png'});
   await p.locator('#endRunBtn').click();const frozen=(await p.evaluate(()=>__glitchQA.state())).elapsed;
   await p.waitForTimeout(220);assert.equal((await p.evaluate(()=>__glitchQA.state())).elapsed,frozen);assert(!await p.evaluate(()=>__glitchQA.tap()));await p.locator('#resumeRunBtn').click();
   await p.evaluate(()=>__glitchQA.tap());await p.waitForFunction(()=>__glitchQA.state().rupture>.30);assert((await p.evaluate(()=>__glitchQA.state())).crash>.85);await p.screenshot({path:out+'/rupture-'+viewport.width+'.png'});
   await p.waitForFunction(()=>__glitchQA.state().hit);s=await p.evaluate(()=>__glitchQA.state());assert.equal(s.damage,20);assert.equal(s.campaign.cores.home,60);assert.equal(s.campaign.pending.length,1);assert(!s.evacPhase);
   await p.screenshot({path:out+'/impact-'+viewport.width+'.png'});assert(!await p.evaluate(()=>__glitchQA.tap()));
   await p.waitForFunction(()=>!!__glitchQA.state().evacPhase);assert.equal((await p.evaluate(()=>__glitchQA.state())).jet,0);await p.waitForTimeout(350);assert((await p.evaluate(()=>__glitchQA.state())).neutral>.3);
   await p.screenshot({path:out+'/return-'+viewport.width+'.png'});await p.waitForFunction(()=>__glitchQA.state().ended,null,{timeout:6000});
   if(viewport.width===440){
    await p.evaluate(()=>__glitchQA.start(5,1));await p.waitForFunction(()=>__glitchQA.state().phase==='armed');assert.equal((await p.evaluate(()=>__glitchQA.state())).power,.25);await p.screenshot({path:out+'/low-reserve.png'});
    await p.waitForFunction(()=>__glitchQA.state().hit);assert.equal((await p.evaluate(()=>__glitchQA.state())).damage,11);
    await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__glitchQA.start(60,2));await p.waitForFunction(()=>__glitchQA.state().phase==='armed');await p.evaluate(()=>{__glitchQA.low();__glitchQA.tap();});await p.waitForFunction(()=>__glitchQA.state().hit);assert.equal((await p.evaluate(()=>__glitchQA.state())).damage,16);
   }
   assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,glitch:true,pause:true,singleHit:true,evacuation:true,errors}));await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
