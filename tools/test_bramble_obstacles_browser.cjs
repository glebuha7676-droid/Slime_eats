const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.__rootsQA={
 start(hp=50,id='fire'){
  __consoleQA.home(id,2);save.world=1;save.planetCampaign=PLANETS.normalize({cores:{home:hp},selected:'home',unlocked:PLANETS.ids});
  session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);
  run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.damageInvulnerableUntil=0;run.barrier=0;run.passiveLevels={};document.body.classList.remove('portal-arrival');
  return {stage:run.hazardStage,groups:run.brambleGroups.size,pickups:run.energyPickups.length,types:run.terrainPlan.hazards.map(h=>h.kind)};
 },
 show(){const group=[...run.brambleGroups.values()][0];this.group=group;this.core=group.core;
  run.cameraY=group.blocks[0].y-310;run.slime.x=this.core.x+this.core.w/2;run.slime.y=group.blocks[0].y-70;
  run.slime.vx=run.slime.vy=0;renderCanvas(performance.now());
  return group.blocks.map(b=>({id:b.id,hp:b.hp,maxHp:b.maxHp,core:b.bramble.core,base:b.bramble.baseMaxHp,dead:b.dead,row:b.row,col:b.col}));
 },
 breakRock(){const b=this.group.blocks[0];for(let i=0;i<4;i++){run.slime.vy=140;run.slime.vx=0;resolveBlockHit(b,{nx:0,ny:-1,penetration:1},performance.now()+200*i);if(i<3&&b.dead)throw Error('Root armour broke early');}renderCanvas(performance.now());return {dead:b.dead,released:this.group.released};},
 knot(method='element'){
  const alive=this.group.blocks.filter(b=>!b.dead),before=run.blocksDestroyed,flasks=run.flasks,charge=run.ultimateCharge;
  if(method==='legacy'){this.core.dead=true;this.core.hp=0;registerBrokenBlock(this.core);}else damageBlockByElement(this.core,1,'qa',performance.now());
  renderCanvas(performance.now()+500);
  return {released:this.group.released,dead:this.group.blocks.filter(b=>b.dead).length,remaining:alive.filter(b=>b!==this.core).map(b=>({dead:b.dead,hp:b.hp,maxHp:b.maxHp,armour:!!b.bramble})),broken:run.blocksDestroyed-before,flasks:run.flasks-flasks,charge:run.ultimateCharge-charge};
 },
 fire(){run.passiveLevels={fire:3};igniteBlock(this.core,1000);updateBurningBlocks(2200);return this.group.released;},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disk-cache-size=1']}),dir='output/bramble-obstacles-v1';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:440,height:840},{width:320,height:568}]){
  const p=await browser.newPage({viewport}),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=roots-2');await p.waitForFunction(()=>window.__rootsQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});await p.waitForTimeout(1800);
  for(const [hp,groups]of [[100,0],[75,0],[50,4],[25,3]]){const s=await p.evaluate(hp=>__rootsQA.start(hp),hp);assert.equal(s.groups,groups);assert.equal(s.pickups,3);assert(!s.types.includes('patrol'));}
  await p.evaluate(()=>__rootsQA.start());let blocks=await p.evaluate(()=>__rootsQA.show());assert.equal(blocks.length,18);assert(blocks.every(b=>b.hp===(b.core?1:4)));
  await p.waitForTimeout(700);await p.evaluate(()=>__rootsQA.show());await p.screenshot({path:dir+'/roots-'+viewport.width+'.png'});
  assert.deepEqual(await p.evaluate(()=>__rootsQA.breakRock()),{dead:true,released:false});
  const collapse=await p.evaluate(()=>__rootsQA.knot());assert(collapse.released);assert.equal(collapse.dead,2);assert.equal(collapse.broken,1);
  assert(collapse.remaining.every(b=>!b.dead&&!b.armour&&b.hp<=b.maxHp&&b.maxHp<=3));assert.equal(collapse.flasks,0);assert.equal(collapse.charge,0);
  await p.screenshot({path:dir+'/released-'+viewport.width+'.png'});
  await p.evaluate(()=>{__rootsQA.start();__rootsQA.show();});assert((await p.evaluate(()=>__rootsQA.knot('legacy'))).released);
  await p.evaluate(()=>{__rootsQA.start();__rootsQA.show();});assert(await p.evaluate(()=>__rootsQA.fire()));
  await p.evaluate(()=>{__rootsQA.start();__rootsQA.show();__rootsQA.live();});await p.waitForTimeout(1500);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await p.close();console.log(JSON.stringify({viewport,armour:4,solidWidth:6,groups:4,preservesTerrain:true,errors,missing}));
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
