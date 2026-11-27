const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=\x60([\s\S]*?)\x60;/)[1];
const hook=base+`window.__techQA={
 start(hp=100){
  __consoleQA.home('fire',2);save.world=3;save.planetCampaign=PLANETS.normalize({cores:{candy:hp},selected:'candy',unlocked:PLANETS.ids});
  session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);
  run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.damageInvulnerableUntil=0;run.barrier=0;document.body.classList.remove('portal-arrival');
  return {stage:run.hazardStage,types:['mine','turret','slowCore'].map(kind=>run.techHazards.filter(b=>b.tech.kind===kind).length),
   hp:run.techHazards.map(b=>[b.tech.kind,b.hp]),pickups:run.energyPickups.length};
 },
 show(kind,double){
  const b=run.techHazards.find(b=>b.tech.kind===kind&&(double==null||b.tech.double===double));
  run.cameraY=b.y-340;run.slime.x=b.x+b.w/2+(b.col>2?-1:1)*run.cellSize*1.5;run.slime.y=b.y+run.cellSize*1.6;
  run.slime.vx=run.slime.vy=0;run.passiveLevels={};this.selected=b;return {x:b.x,y:b.y};
 },
 step(n=1){
  for(let i=0;i<n;i++)SlimeTechHazards.update(run,1/60,{hurt:(x,y)=>hurtFromTechHazard(x,y,performance.now()+i*17),
   detonate:b=>{destroyBlock(b,'techMine');explodeBomb(b,0,false);}});
  renderCanvas(performance.now());
  return {selected:this.selected?.tech.state,age:this.selected?.tech.age,shots:run.techShots.length,dead:this.selected?.dead,energy:run.energy,broken:run.blocksDestroyed};
 },
 slowTarget(){const b=this.selected;run.slime.x=b.x+b.w/2+run.cellSize;run.slime.y=b.y+b.h/2;return SlimeTechHazards.slowFactor(run);},
 motion(){const b=this.selected;for(const rock of run.blocks)if(rock!==b)rock.dead=true;this.slowTarget();run.slime.vx=0;run.slime.vy=305;const at=performance.now();updatePhysics(.034,at);return {vy:run.slime.vy,factor:SlimeTechHazards.slowFactor(run),energy:run.energy};},
 contact(){const b=this.selected;run.slime.x=b.x+b.w/2;run.slime.y=b.y-20;run.slime.vx=0;run.slime.vy=120;resolveBlockHit(b,{nx:0,ny:-1,penetration:1},performance.now());return {hp:b.hp,dead:b.dead};},
 shot(){const b=this.selected;damageBlockByElement(b,1,'qa',performance.now());return {hp:b.hp,dead:b.dead};},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/candy-hazards-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[],missing=[];
  p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=candy-hazards-1');await p.waitForFunction(()=>window.__techQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000,polling:250});
  const report=[];
  for(const [hp,counts]of [[100,[10,0,0]],[75,[4,6,0]],[50,[3,3,4]],[25,[4,3,3]]]){
   const s=await p.evaluate(hp=>__techQA.start(hp),hp);assert.deepEqual(s.types,counts);assert.equal(s.pickups,3);
   assert(s.hp.every(([kind,hp])=>hp==={mine:1,turret:2,slowCore:1}[kind]));report.push(s);
  }
  await p.evaluate(()=>__techQA.show('turret'));await p.waitForTimeout(500);
  let s=await p.evaluate(()=>__techQA.step(32));assert.equal(s.selected,'aim');await p.screenshot({path:dir+'/turret-aim.png'});
  for(let i=0;i<60;i++){s=await p.evaluate(()=>__techQA.step());if(s.shots)break;}assert(s.shots>0);
  await p.screenshot({path:dir+'/turret-shot.png'});
  assert.deepEqual(await p.evaluate(()=>__techQA.shot()),{hp:1,dead:false});
  assert((await p.evaluate(()=>__techQA.shot())).dead);
  await p.evaluate(()=>__techQA.start(75));await p.evaluate(()=>__techQA.show('mine'));assert((await p.evaluate(()=>__techQA.contact())).dead);
  await p.evaluate(()=>__techQA.start(75));await p.evaluate(()=>__techQA.show('mine'));await p.waitForTimeout(500);
  s=await p.evaluate(()=>__techQA.step(55));assert.equal(s.selected,'armed');assert(!s.dead);
  await p.screenshot({path:dir+'/mine-warning.png'});
  s=await p.evaluate(()=>__techQA.step(42));assert(s.dead&&s.broken>1);
  await p.screenshot({path:dir+'/mine-blast.png'});
  await p.evaluate(()=>__techQA.start(50));await p.evaluate(()=>__techQA.show('slowCore'));await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>__techQA.slowTarget()),.38);
  s=await p.evaluate(()=>__techQA.step(40));assert.equal(s.energy,100,'The field does not damage the player');await p.screenshot({path:dir+'/slow-field.png'});
  const motion=await p.evaluate(()=>__techQA.motion());assert(motion.vy<305&&motion.factor<1);
  assert((await p.evaluate(()=>__techQA.shot())).dead);
  assert.equal(await p.evaluate(()=>__techQA.slowTarget()),1);
  await p.evaluate(()=>__techQA.step());await p.screenshot({path:dir+'/slow-field-destroyed.png'});
  await p.evaluate(()=>__techQA.start(50));await p.evaluate(()=>__techQA.show('slowCore'));await p.evaluate(()=>__techQA.slowTarget());
  await p.setViewportSize({width:320,height:568});await p.evaluate(()=>__techQA.step());await p.screenshot({path:dir+'/slow-field-narrow.png'});
  await p.evaluate(()=>__techQA.start(25));await p.evaluate(()=>__techQA.live());await p.waitForTimeout(2500);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  fs.writeFileSync(dir+'/report.json',JSON.stringify({report,errors,missing},null,2));console.log('Candy integration: stages, HP, aiming/projectiles, mines, non-damaging field, actual physics slow-down, source destruction and live frames passed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
