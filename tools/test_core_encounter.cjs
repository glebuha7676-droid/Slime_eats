const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const core=require('../js/gameplay/core-encounter.js'),evac=require('../js/gameplay/anomaly-evacuation.js');
assert.deepEqual([0,25,50,75,100].map(core.damage),[10,13,15,18,20]);
assert.deepEqual([100,75,50,25,0].map(core.fracture),[0,1,2,3,4]);
assert.equal(core.tap,undefined);assert.equal(core.MIN_CHARGE_MS,undefined);
for(const reserve of [1,25,50,60,75,100]){
 const fake={slime:{x:200,y:800,wobble:0,radius:25},cameraY:600,energy:reserve,shake:0,coreArena:{x:220,surfaceY:1500,cameraY:937}};
 core.begin(fake,80);let hits=0,done=0;const phases=new Set();
 const hooks={impact:n=>{hits++;assert.equal(n,core.damage(reserve));evac.begin(fake,{completed:true});return 80-n;},complete:()=>done++};
 for(let i=0;i<1000;i++){phases.add(fake.coreEncounter.phase);core.update(fake,.02,hooks);if(fake.evacuation)evac.update(fake,.02,{complete:()=>done++});}
 assert.equal(hits,1);assert.equal(done,1);assert(!phases.has('charge'));
 assert.equal(fake.coreEncounter.strikeEnergy,reserve);assert.equal(fake.coreEncounter.afterHp,80-core.damage(reserve));
 assert.equal(fake.coreEncounter.total,undefined);assert.equal(fake.coreEncounter.power,undefined);
}
const empty={energy:0,slime:{},coreArena:{}};assert.equal(core.begin(empty,100),null);assert.equal(empty.coreEncounter,undefined);
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`const neutralCoreBeginQA=beginCoreEncounter;beginCoreEncounter=(...args)=>{const result=neutralCoreBeginQA(...args);if(run?.neutralCoreQA&&run.coreEncounter)Object.assign(run.coreEncounter,{kind:'',cinematic:false,fire:false,electric:false,frost:false,cosmos:false,techno:false,phantom:false,psionic:false,glitch:false,spores:false,power:undefined});return result;};window.__coreQA={
 start({blocks=999,hp=80,world=1,energy=100,neutral=false}={}){if(run)cancelAnimationFrame(run.animationId);run=null;closePanel();els.resultOverlay.classList.add('hidden');save.planetCampaign=PLANETS.normalize({cores:{home:hp,candy:hp,magma:hp},unlocked:['home','candy','magma'],selected:PLANETS.forWorld(world).id});save.world=world;carouselWorldId=world;session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);run.neutralCoreQA=neutral;run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.blocksDestroyed=blocks;run.energy=energy;run.slime.y=run.coreArena.triggerY-45;run.slime.x=200;run.slime.vy=260;run.slime.vx=0;run.cameraY=run.slime.y-158;run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},
 state(){return {ended:run?.ended,paused:run?.paused,energy:run?.energy,evacPhase:run?.evacuation?.phase,portalX:run?.evacuation?.portalX,strikeEnergy:run?.coreEncounter?.strikeEnergy,plannedDamage:run?.coreEncounter?.plannedDamage,phase:run?.coreEncounter?.phase,elapsed:run?.coreEncounter?.elapsed,phaseTime:run?.coreEncounter?.phaseTime,damage:run?.coreEncounter?.actualDamage,hit:run?.coreEncounter?.hit,slime:run?{x:run.slime.x,y:run.slime.y}:null,camera:run?.cameraY,arena:run?.coreArena,blocksBelowCeiling:run?.blocks.filter(b=>!b.dead&&b.y+b.h>run.coreArena.surfaceY-840).length,campaign:structuredClone(save.planetCampaign)};},
 back(){continueAfterRun();},pause(){openRunMenu();},resume(){continueRunFromMenu();},restart(){updatePersistentUI();restartCurrentRun();},ability(){activateAbility();}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 fs.mkdirSync('output/core-strike-v2',{recursive:true});
 try{
 const page=await browser.newPage({viewport:{width:440,height:840},deviceScaleFactor:1});const errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/?v=core-strike-2');
 await page.waitForFunction(()=>window.__coreQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
 await page.evaluate(()=>{__consoleQA.home('cloning',3);__coreQA.start({neutral:true});});
 const state=()=>page.evaluate(()=>__coreQA.state());
 await page.waitForFunction(()=>__coreQA.state().phase==='approach');
 await page.waitForTimeout(550);await page.screenshot({path:'output/core-strike-v2/approach.png'});
 let s=await state();assert.equal(s.blocksBelowCeiling,0,'The core chamber contains no blocks');
 assert.equal(s.strikeEnergy,100);assert.equal(s.plannedDamage,20);assert.equal(s.energy,100);
 assert.equal(s.campaign.cores.home,80,'Approach has no damage');
 await page.locator('#endRunBtn').click();const paused=await state();assert(paused.paused);
 await page.waitForTimeout(350);assert.equal((await state()).elapsed,paused.elapsed,'Pause freezes approach');
 await page.locator('#resumeRunBtn').click();
 await page.keyboard.press('Space');for(let i=0;i<6;i++)await page.mouse.click(330,430);
 s=await state();assert.equal(s.energy,100);assert.equal(s.strikeEnergy,100);assert.equal(s.plannedDamage,20,'Input does not boost the strike');
 await page.evaluate(()=>__coreQA.ability());
 await page.waitForFunction(()=>__coreQA.state().phase==='launch');
 const lockedCamera=(await state()).camera;await page.waitForTimeout(180);await page.screenshot({path:'output/core-strike-v2/launch.png'});
 await page.waitForFunction(()=>__coreQA.state().phase==='impact');await page.waitForTimeout(250);
 s=await state();assert.equal(s.damage,20);assert.equal(s.campaign.cores.home,60);assert.equal(s.campaign.pending.length,1);assert.equal(s.energy,0);
 assert.equal(s.camera,lockedCamera,'Impact does not push the camera past the core');
 await page.screenshot({path:'output/core-strike-v2/impact.png'});
 for(let i=0;i<5;i++)await page.mouse.click(330,430);assert.equal((await state()).campaign.cores.home,60,'Post-impact clicks cannot apply damage again');
 await page.waitForFunction(()=>__coreQA.state().evacPhase==='pull',null,{timeout:6000}).catch(async e=>{console.error(JSON.stringify({state:await state(),errors}));throw e;});await page.waitForTimeout(180);
 s=await state();assert(s.slime.y<s.arena.surfaceY-50&&Math.abs(s.portalX-s.arena.x)>50,'The neutral slime is rescued by a side portal');
 await page.screenshot({path:'output/core-strike-v2/return-portal.png'});
 await page.waitForFunction(()=>__coreQA.state().ended,null,{timeout:8000});
 assert.equal((await state()).campaign.cores.home,60,'Completion does not repeat the strike');
 await page.evaluate(()=>__coreQA.back());await page.waitForFunction(()=>!SlimePlanetCarousel.isBusy(),null,{timeout:8000});
 assert.equal((await state()).campaign.pending.length,0);assert.equal((await state()).campaign.cores.home,60);
 await page.screenshot({path:'output/core-strike-v2/home-after-hit.png'});
 // Near-empty reserve reaches a weak core: damage is clamped, and next world opens.
 await page.evaluate(()=>{__consoleQA.home('cloning',2);__coreQA.start({neutral:true,blocks:0,hp:4,world:3,energy:1});});
 await page.waitForFunction(()=>__coreQA.state().hit,null,{timeout:12000});s=await state();assert.equal(s.damage,4);assert.equal(s.campaign.cores.candy,0);assert(s.campaign.unlocked.includes('magma'));
 await page.evaluate(()=>{__coreQA.pause();__coreQA.restart();});
 assert.equal((await state()).ended,false,'Restart after the committed strike does not wait for hidden planet feedback');
 assert.equal((await state()).phase,undefined);assert.equal((await state()).campaign.cores.candy,0);
 await page.setViewportSize({width:320,height:568});
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{__consoleQA.home('cloning',3);__coreQA.start({neutral:true,blocks:80,hp:55,world:4});});
 await page.waitForFunction(()=>__coreQA.state().phase==='launch');
 await page.screenshot({path:'output/core-strike-v2/narrow-techno.png'});
 const strikeEnergy=(await state()).strikeEnergy;
 await page.locator('#physicsCanvas').dispatchEvent('pointerdown',{pointerType:'touch',clientX:180,clientY:300,bubbles:true});
 assert.equal((await state()).strikeEnergy,strikeEnergy,'Touch cannot modify the strike');
 const a=(await state()).arena;assert.equal((await state()).camera,a.cameraY);
 await page.evaluate(()=>{__consoleQA.home('fire',1);__coreQA.start({hp:80,energy:0});});
 await page.waitForFunction(()=>__coreQA.state().ended);
 s=await state();assert.equal(s.campaign.cores.home,80);assert.equal(s.campaign.pending.length,0);assert.equal(s.hit,undefined,'Exhausted slime cannot enter the strike');
 assert.deepEqual(errors,[]);
 const checks={minDamage:10,maxDamage:20,automaticStrike:true,noCharge:true,once:true,zeroReserveBlocked:true,cameraLocked:true,emptyChamber:true,returnPortal:true,homePresentation:true,errors};
 fs.writeFileSync('output/core-strike-v2/checks.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));
 await page.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
