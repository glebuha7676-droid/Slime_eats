const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const E=require('../js/gameplay/anomaly-energy.js'),C=require('../js/gameplay/core-encounter.js');
const unit={};E.init(unit);
E.hazard(unit,2000);assert.equal(unit.energy,85);assert.equal(E.hazard(unit,2200),0);E.recover(unit,12,3000);E.recover(unit,12,4000);assert.equal(unit.energy,100);
assert.deepEqual([0,25,50,75,100].map(E.coreDamage),[10,13,15,18,20]);assert.deepEqual([0,25,50,75,100].map(C.damage),[10,13,15,18,20]);
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.__energyQA={
 start(id='fire',stage=1,seed=123,world=1){__consoleQA.home(id,stage);let r=seed>>>0;window.__oldRandom=Math.random;Math.random=()=>((r=(1664525*r+1013904223)>>>0)/4294967296);save.planetCampaign=PLANETS.normalize({unlocked:['home','candy','magma'],selected:PLANETS.forWorld(world).id});save.world=world;carouselWorldId=world;session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.lastTime=performance.now();run.nextFrameAt=0;return this.state();},
 state(){return {energy:run.energy,stats:structuredClone(run.energyStats),ended:run.ended,evacuation:run.evacuation?.phase,paused:run.paused,depth:run.depth,blocks:run.blocksDestroyed,phase:run.coreEncounter?.phase,damage:run.coreEncounter?.actualDamage,coreHp:save.planetCampaign.cores.home,corePending:save.planetCampaign.pending.length,slime:{x:run.slime.x,y:run.slime.y},pickups:run.energyPickups.map(p=>({...p})),gels:run.blocks.filter(b=>!b.dead&&b.special==='gel').length};},
 cost(){run.energy=60;ENERGY.hazard(run,performance.now());updateRunUI();return this.state();},
 pickup(){const p=run.energyPickups.find(p=>!p.collected);run.slime.x=p.x;run.slime.y=p.y;window.SlimeEnergyPickups.update(run,performance.now(),(n,t)=>restoreAnomalyEnergy(n,t));updateRunUI();return this.state();},
 pickupView(){const p=run.energyPickups.find(p=>!p.collected);run.cameraY=p.y-330;run.slime.x=p.x+90;run.slime.y=p.y-150;renderCanvas(performance.now());},
 core(energy=60){cancelAnimationFrame(run.animationId);run.energy=energy;run.slime.y=run.coreArena.triggerY;run.cameraY=run.slime.y-158;beginCoreEncounter(performance.now());run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},
 play(){cancelAnimationFrame(run.animationId);run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},
 stop(){cancelAnimationFrame(run.animationId);},
 repaint(){renderCanvas(performance.now());},
 hazard(){const b=run.blocks.find(b=>b.hazard&&!b.motion&&!b.dead);run.damageInvulnerableUntil=0;run.slime.x=b.x+b.w/2;run.slime.y=b.y-run.slime.radius;resolveHazardHit(b,{nx:0,ny:-1,penetration:3},performance.now());const first=run.energy;resolveHazardHit(b,{nx:0,ny:-1,penetration:3},performance.now());return {first,second:run.energy};},
 generation(){this.start('fire',1,1);const results=[];for(let seed=1;seed<=100;seed++){let r=seed;Math.random=()=>((r=(1664525*r+1013904223)>>>0)/4294967296);run.blocks=generateBlockField(run);run.energyPickups=window.SlimeEnergyPickups.build(run);results.push({seed,count:run.energyPickups.length,rows:run.energyPickups.map(p=>p.row),gels:run.blocks.filter(b=>!b.dead&&b.special==='gel').length});}Math.random=window.__oldRandom;return results;},
 fail(){run.energy=.1;this.hazard();return this.state();},
 simulate({seconds=180,ultra=false,policy='route'}={}){
  cancelAnimationFrame(run.animationId);window.__energyFast=true;
  let time=performance.now();const oldNow=performance.now.bind(performance);Object.defineProperty(performance,'now',{configurable:true,value:()=>time});run.lastTime=time;run.nextFrameAt=0;
  const max=seconds*60;let i=0;
  try{for(;i<max&&!run.ended&&!run.coreEncounter&&!run.evacuation;i++){
   const s=run.slime,cell=run.cellSize;let target=s.x;
   if(policy!=='idle'){
    let best=Infinity;
    const pickup=run.energyPickups.find(p=>!p.collected&&p.y>s.y-cell*.2&&p.y<s.y+cell*3);
    for(let col=0;col<run.columns;col++){
     const x=run.gridOffsetX+(col+.5)*cell;
     let score=Math.abs(x-s.x)/cell*.25;
     for(const b of run.blocks){if(b.dead||b.y+b.h<s.y-s.radius||b.y>s.y+cell*2.3)continue;
      if(Math.abs(b.x+b.w/2-x)>cell*.6)continue;
      score+=b.hazard?50:Math.max(.1,b.hp)*.7;
     }
     if(pickup)score+=Math.abs(x-pickup.x)/cell*1.8;
     if(score<best){best=score;target=x;}
    }
   }
   run.steer.touchX=policy==='idle'?0:clamp((target-s.x)*.026-s.vx*.0025,-1,1);
   if(ultra&&canActivateElementalAbility(time)&&i%30===0)activateAbility();
   time+=1000/60;gameFrame(time);cancelAnimationFrame(run.animationId);
  }}finally{Object.defineProperty(performance,'now',{configurable:true,value:oldNow});window.__energyFast=false;Math.random=window.__oldRandom;}
  updateRunUI();renderCanvas(performance.now());return {...this.state(),seconds:i/60,mutation:run.mutationId,stage:run.ultimateStage};
 }
};`;
const body=source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {').replace('  function renderCanvas(timestamp) {','  function renderCanvas(timestamp) { if(window.__energyFast)return;').replace('  function updateRunUI() {','  function updateRunUI() { if(window.__energyFast)return;');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/anomaly-energy-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:440,height:840},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.stack));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body}));
  await page.goto('http://127.0.0.1:8766/?v=energy-1');
  await page.waitForFunction(()=>window.__energyQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  let s=await page.evaluate(()=>__energyQA.start());assert.equal(s.energy,100);assert.equal(s.gels,0);assert.equal(s.pickups.length,3,'Three safely spaced floating pickups');
  assert.equal(await page.locator('.run-heart').count(),0);
  await page.evaluate(()=>__energyQA.cost());await page.waitForTimeout(300);
  assert.equal((await page.evaluate(()=>__energyQA.state())).energy,45);
  await page.evaluate(()=>__energyQA.pickupView());await page.screenshot({path:dir+'/pickup-and-hud.png'});
  const before=await page.evaluate(()=>__energyQA.state());s=await page.evaluate(()=>__energyQA.pickup());
  assert.equal(s.energy,57);assert.equal(s.stats.pickups,1);assert.equal(s.blocks,before.blocks,'Touch collects the orb without breaking a block');
  await page.waitForTimeout(180);await page.screenshot({path:dir+'/recovery.png'});
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1280,height:1000}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(120);await page.evaluate(()=>{__energyQA.start();__energyQA.cost();__energyQA.pickupView();__energyQA.play();});await page.waitForTimeout(350);await page.evaluate(()=>__energyQA.stop());
   const box=await page.locator('#anomalyEnergy').boundingBox(),shaft=await page.locator('#shaft').boundingBox();
   assert(box.x>=shaft.x&&box.x+box.width<=shaft.x+shaft.width+1,'HUD stays within shaft');
   await page.screenshot({path:dir+'/hud-'+viewport.width+'.png'});
  }
  await page.setViewportSize({width:440,height:840});
  const generated=await page.evaluate(()=>__energyQA.generation());assert(generated.every(r=>r.count===3&&r.gels===0),'100 seeds have three floating pickups and zero healing stones');fs.writeFileSync(dir+'/generation.json',JSON.stringify(generated,null,2));
  await page.evaluate(()=>__energyQA.start());const hazard=await page.evaluate(()=>__energyQA.hazard());assert.deepEqual(hazard,{first:85,second:85},'Real hazard handler charges once during invulnerability');
  for(const world of [3,4]){const w=await page.evaluate(id=>__energyQA.start('fire',1,123,id),world);assert.equal(w.pickups.length,6,'Later 1000m worlds keep the same recovery density');assert.equal(w.gels,0);}
  const balance=[];
  for(const config of [{id:'fire',stage:1},{id:'fire',stage:3,ultra:true},{id:'frost',stage:1},{id:'electric',stage:1},{id:'nano',stage:1},{id:'cosmos',stage:1},{id:'telekinesis',stage:1},{id:'cloning',stage:1},{id:'phantom',stage:1},{id:'glitch',stage:1},{id:'fire',stage:1,policy:'idle'}]){
   for(const seed of [123,947]){
    await page.evaluate(o=>__energyQA.start(o.id,o.stage,o.seed),{...config,seed});
    const result=await page.evaluate(o=>__energyQA.simulate(o),config);balance.push({...result,pickups:result.pickups.map(p=>({row:p.row,col:p.col,collected:p.collected})),config,seed});
    console.log(JSON.stringify({id:config.id,stage:config.stage,seed,energy:result.energy,depth:result.depth,ended:result.ended,seconds:result.seconds,...result.stats}));
   }
  }
  fs.writeFileSync(dir+'/balance.json',JSON.stringify(balance,null,2));
  await page.evaluate(()=>{__energyQA.start('electric',1);__energyQA.core(60);});
  await page.waitForFunction(()=>__energyQA.state().phase==='approach');
  await page.locator('#endRunBtn').click();const paused=await page.evaluate(()=>__energyQA.state());assert(paused.paused);
  await page.waitForTimeout(250);assert.equal((await page.evaluate(()=>__energyQA.state())).energy,paused.energy);
  await page.locator('#resumeRunBtn').click();await page.screenshot({path:dir+'/core-energy.png'});
  await page.waitForFunction(()=>__energyQA.state().phase==='impact',null,{timeout:10000});
  s=await page.evaluate(()=>__energyQA.state());assert.equal(s.energy,0);assert.equal(s.damage,16);assert(!s.ended,'Core discharge is successful, not a loss');assert.equal(s.corePending,1);
  await page.waitForTimeout(160);await page.screenshot({path:dir+'/core-impact.png'});
  await page.waitForFunction(()=>__energyQA.state().ended,null,{timeout:8000});
  assert.equal((await page.evaluate(()=>__energyQA.state())).corePending,1,'Damage is committed once');
  await page.evaluate(()=>__energyQA.start());s=await page.evaluate(()=>__energyQA.fail());assert.equal(s.energy,0);assert(!s.ended&&s.evacuation==='release','A lethal hazard starts rescue before results');await page.evaluate(()=>__energyQA.play());await page.waitForFunction(()=>__energyQA.state().ended,null,{timeout:7000});
  assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/checks.json',JSON.stringify({unit:true,layout:true,pickupWithoutBreaking:true,pause:true,core16:true,coreDischarge:true,exhaustion:true,errors},null,2));
  console.log('ENERGY CHECKS PASSED');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
