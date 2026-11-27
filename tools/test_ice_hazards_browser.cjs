const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.__iceQA={
 start(hp=50,id='fire'){
  __consoleQA.home(id,2);save.world=4;save.planetCampaign=PLANETS.normalize({cores:{magma:hp},selected:'magma',unlocked:PLANETS.ids});
  session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);
  run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.damageInvulnerableUntil=0;run.barrier=0;run.passiveLevels={};document.body.classList.remove('portal-arrival');this.at=performance.now();
  return {stage:run.hazardStage,types:['frostSpike','iceMortar','iceBlock'].map(kind=>run.iceHazards.filter(b=>b.ice.kind===kind).length),pickups:run.energyPickups.length,hp:run.iceHazards.map(b=>[b.ice.kind,b.hp,b.unbreakable])};
 },
 show(kind){const b=run.iceHazards.find(b=>b.ice.kind===kind);this.selected=b;run.cameraY=b.y-340;run.slime.x=Math.max(40,Math.min(400,b.x+b.w/2+(b.col>2?-1:1)*run.cellSize*1.5));run.slime.y=b.y-run.cellSize*1.4;run.slime.vx=run.slime.vy=0;renderCanvas(this.at);},
 step(dt){this.at+=dt*1000;SlimeIceHazards.update(run,dt,{hurt:(x,y)=>hurtFromIceHazard(x,y,this.at)},dt);renderCanvas(this.at);return this.state();},
 repaint(){this.at=Math.max(this.at,performance.now());renderCanvas(this.at);},
 cached(){const c=document.createElement('canvas').getContext('2d');c.canvas.width=440;c.canvas.height=840;c.createRadialGradient=c.createLinearGradient=()=>{throw Error('Gradient allocated during ice FX frame');};SlimeIceHazards.draw(c,run,false);SlimeIceHazards.draw(c,run,true);return true;},
 state(){return {energy:run.energy,stacks:run.iceStatus.stacks,slow:run.iceStatus.slow,freeze:run.iceStatus.freeze,oldFreeze:run.freezeUntil,shots:run.iceShots.length,muzzles:run.iceMuzzles.length,bursts:run.iceBursts.length,state:this.selected?.ice.state,dead:this.selected?.dead};},
 contact(){const b=this.selected;run.slime.x=b.x+b.w/2;run.slime.y=b.y-run.slime.radius;run.slime.vx=0;run.slime.vy=170;resolveBlockHit(b,{nx:0,ny:-1,penetration:1},this.at);renderCanvas(this.at);return this.state();},
 physical(){const before={x:run.slime.x,y:run.slime.y};run.slime.vx=300;run.slime.vy=300;updatePhysics(.03,this.at);return {before,after:{x:run.slime.x,y:run.slime.y},vy:run.slime.vy};},
 land(){const shot=run.iceShots[0];if(!shot)throw Error('No snowball launched');run.slime.x=shot.tx;run.slime.y=shot.ty;return this.step(1.11);},
 ability(){damageBlockByElement(this.selected,2,'qa',this.at);return this.state();},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disk-cache-size=1']}),dir='output/ice-hazards-v2';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:440,height:840},{width:320,height:568}]){
  const p=await browser.newPage({viewport}),errors=[],missing=[];p.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto((process.env.ICE_BASE_URL||'http://127.0.0.1:8766')+'/?v=ice-polish-2');await p.waitForFunction(()=>window.__iceQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000,polling:250});await p.waitForTimeout(1800);
  for(const [hp,counts]of [[100,[10,0,0]],[75,[4,6,0]],[50,[3,3,4]],[25,[4,3,3]]]){
   const s=await p.evaluate(hp=>__iceQA.start(hp),hp);assert.deepEqual(s.types,counts);assert.equal(s.pickups,3);assert(s.hp.every(([k,h,u])=>h==={frostSpike:1,iceMortar:2,iceBlock:2}[k]&&u===(k==='frostSpike')));
  }
  await p.evaluate(()=>{__iceQA.start();__iceQA.show('frostSpike');});await p.waitForTimeout(1300);
  await p.evaluate(()=>__iceQA.repaint());await p.screenshot({path:dir+'/spike-v2-'+viewport.width+'.png'});
  let s=await p.evaluate(()=>__iceQA.contact());assert.equal(s.energy,85);assert.equal(s.stacks,1);assert.equal(s.slow,3);
  s=await p.evaluate(()=>__iceQA.contact());assert.equal(s.energy,85);assert.equal(s.stacks,1,'Repeated collision in same frame does not add frost');
  await p.evaluate(()=>__iceQA.step(.81));s=await p.evaluate(()=>__iceQA.contact());assert.equal(s.energy,70);assert.equal(s.stacks,2);
  await p.evaluate(()=>__iceQA.step(.81));s=await p.evaluate(()=>__iceQA.contact());assert.equal(s.energy,55);assert.equal(s.freeze,2);assert.equal(s.oldFreeze,0,'No old ice-invulnerability mode');
  const motion=await p.evaluate(()=>__iceQA.physical());assert.deepEqual(motion.after,motion.before);assert.equal(motion.vy,0);
  await p.evaluate(()=>__iceQA.step(.16));await p.screenshot({path:dir+'/frozen-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__iceQA.step(1.85));assert.equal(s.freeze,0);assert.equal(s.stacks,3);
  s=await p.evaluate(()=>__iceQA.step(1));assert.equal(s.stacks,0);
  await p.evaluate(()=>{__iceQA.start();__iceQA.show('iceBlock');});await p.waitForTimeout(1300);await p.evaluate(()=>__iceQA.repaint());
  await p.screenshot({path:dir+'/ice-block-clean-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__iceQA.contact());assert(s.energy>99&&s.stacks===1&&!s.dead,'Ice blocks apply frost without 15% hazard damage');
  await p.screenshot({path:dir+'/ice-block-'+viewport.width+'.png'});
  await p.evaluate(()=>{__iceQA.start();__iceQA.show('iceBlock');});s=await p.evaluate(()=>__iceQA.ability());assert(s.dead);assert.equal(s.stacks,0,'Breaking ice remotely gives no debuff');
  await p.evaluate(()=>{__iceQA.start(75);__iceQA.show('iceMortar');});await p.waitForTimeout(300);await p.evaluate(()=>__iceQA.step(.3));await p.screenshot({path:dir+'/mortar-target-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__iceQA.step(.36));assert.equal(s.shots,1);assert.equal(s.muzzles,1);
  await p.evaluate(()=>__iceQA.step(.08));await p.screenshot({path:dir+'/muzzle-v2-'+viewport.width+'.png'});
  await p.evaluate(()=>__iceQA.step(.3));await p.screenshot({path:dir+'/snowball-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__iceQA.land());assert.equal(s.energy,85);assert.equal(s.stacks,1);assert.equal(s.bursts,1);
  await p.evaluate(()=>__iceQA.step(.14));await p.screenshot({path:dir+'/impact-v2-'+viewport.width+'.png'});
  assert(await p.evaluate(()=>__iceQA.cached()));
  await p.evaluate(()=>{__iceQA.start();__iceQA.show('iceMortar');__iceQA.ability();__iceQA.step(1);});assert.equal((await p.evaluate(()=>__iceQA.state())).shots,0);
  await p.evaluate(()=>{__iceQA.start(25);__iceQA.show('iceMortar');__iceQA.live();});await p.waitForTimeout(1200);
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await p.close();console.log(JSON.stringify({viewport,stages:true,pickups:3,frostChain:true,stationaryFreeze:2,mortarCross:true,errors,missing}));
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
