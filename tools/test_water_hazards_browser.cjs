const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=\x60([\s\S]*?)\x60;/)[1];
const hook=base+`window.__waterQA={
 async start(hp=50){
  __consoleQA.home('fire',2);save.world=5;save.planetCampaign=PLANETS.normalize({cores:{desert:hp},selected:'desert',unlocked:PLANETS.ids});
  session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);
  run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.damageInvulnerableUntil=0;run.barrier=0;run.passiveLevels={};document.body.classList.remove('portal-arrival');
  await Promise.all(Object.values(ensureWorldSprites(5)).map(im=>im.decode()));await Promise.all(ensureWorldBackgroundLayers(5).map(l=>l.image.decode()));
  return {types:['vortex','tentacle','seaMine'].map(k=>run.waterHazards.filter(b=>b.water.kind===k).length),pickups:run.energyPickups.length};
 },
 show(kind){
  const b=run.waterHazards.find(b=>b.water.kind===kind);this.selected=b;
  run.cameraY=b.y-320;run.slime.x=b.x+b.w/2+(b.water.side>0?1:-1)*run.cellSize*1.3;run.slime.y=b.y-run.cellSize*1.8;
  run.slime.vx=0;run.slime.vy=280;return {x:b.x,y:b.y};
 },
 step(n=1,input={}){
  for(let i=0;i<n;i++)SlimeWaterHazards.update(run,1/60,input,{hurt:(x,y)=>hurtFromWaterHazard(x,y,performance.now()+i*17),immune:false,mine:b=>detonateWaterMine(b,performance.now())});
  renderCanvas(performance.now());return {phase:this.selected?.water.state,grab:!!run.waterGrab,energy:run.energy,dead:this.selected?.dead,broken:run.blocksDestroyed,x:run.slime.x,y:run.slime.y};
 },
 hitTarget(){const h=this.selected.water;run.slime.x=h.targetX;run.slime.y=h.targetY;},
 mineContact(){const b=this.selected;run.slime.x=b.x+b.w/2;run.slime.y=b.y+b.h/2;resolveBlockHit(b,{nx:0,ny:-1,penetration:1},performance.now());return {dead:b.dead,energy:run.energy,broken:run.blocksDestroyed};},
 paint(){renderCanvas(performance.now());},
 breakSource(){const b=this.selected;damageBlockByElement(b,b.hp,'qa',performance.now());},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/water-hazards-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=water-hazards-1');await p.waitForFunction(()=>window.__waterQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000});
  for(const [hp,counts]of [[100,[10,0,0]],[75,[4,6,0]],[50,[3,3,4]],[25,[4,3,3]]]){const s=await p.evaluate(hp=>__waterQA.start(hp),hp);assert.deepEqual(s.types,counts);assert.equal(s.pickups,3);}
  await p.evaluate(()=>__waterQA.show('vortex'));await p.waitForTimeout(550);await p.evaluate(()=>__waterQA.step());await p.screenshot({path:dir+'/vortex.png'});
  await p.evaluate(()=>__waterQA.show('tentacle'));await p.evaluate(()=>__waterQA.step(25));await p.screenshot({path:dir+'/tentacle-warning.png'});
  let s=await p.evaluate(()=>__waterQA.step(20));assert.equal(s.phase,'strike');await p.evaluate(()=>__waterQA.hitTarget());
  s=await p.evaluate(()=>__waterQA.step(12));assert(s.grab);assert.equal(s.energy,85);await p.screenshot({path:dir+'/tentacle-grab.png'});
  await p.evaluate(()=>__waterQA.breakSource());s=await p.evaluate(()=>__waterQA.step());assert(!s.grab);
  await p.evaluate(()=>__waterQA.start());await p.evaluate(()=>__waterQA.show('seaMine'));await p.waitForTimeout(500);await p.evaluate(()=>__waterQA.paint());await p.screenshot({path:dir+'/sea-mine.png'});
  s=await p.evaluate(()=>__waterQA.mineContact());assert(s.dead);assert.equal(s.energy,85);assert(s.broken>1);await p.evaluate(()=>__waterQA.paint());await p.screenshot({path:dir+'/mine-blast.png'});
  await p.setViewportSize({width:320,height:568});await p.evaluate(()=>__waterQA.start(100));await p.evaluate(()=>__waterQA.show('vortex'));await p.waitForTimeout(500);await p.evaluate(()=>__waterQA.paint());await p.screenshot({path:dir+'/vortex-narrow.png'});
  await p.evaluate(()=>__waterQA.start(25));await p.evaluate(()=>__waterQA.live());await p.waitForTimeout(3000);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync(dir+'/report.json',JSON.stringify({stages:4,pickups:3,grabAndRelease:true,contactMine:true,errors,missing},null,2));console.log('Water integration: four stages, three pickups, grab/source destruction, 15 energy contact mine, terrain explosion, assets, narrow view and live frames passed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
