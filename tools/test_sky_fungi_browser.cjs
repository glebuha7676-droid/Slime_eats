const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.__fungiQA={
 start(hp=50){
  __consoleQA.home('fire',2);save.world=5;save.unlockedWorlds=[1,3,4,5];save.planetCampaign=PLANETS.normalize({cores:{desert:hp},selected:'desert',unlocked:PLANETS.ids});
  session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);
  run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.damageInvulnerableUntil=0;run.barrier=0;run.passiveLevels={};document.body.classList.remove('portal-arrival');this.at=performance.now();
  return {world:run.world.name,stage:run.hazardStage,types:['spore','fungusTurret','toadstool'].map(k=>run.fungiHazards.filter(b=>b.fungi.kind===k).length),water:run.waterHazards.length,pickups:run.energyPickups.length,hp:run.fungiHazards.map(b=>[b.fungi.kind,b.hp,b.unbreakable]),background:ASSETS.ensureWorldBackgroundLayers(5).map(l=>l.image.src)};
 },
 show(kind){const b=run.fungiHazards.find(b=>b.fungi.kind===kind);this.selected=b;run.cameraY=b.y-420;run.slime.x=110;run.slime.y=b.y-130;run.slime.vx=run.slime.vy=0;SlimeFungiHazards.refreshConfusion(run);this.repaint();return {source:b.x+b.w/2,shaft:run.gridOffsetX+run.columns*run.cellSize/2,height:SlimeFungiHazards.CONFIG.cloudRows*run.cellSize,cell:run.cellSize};},
 step(dt){this.at+=dt*1000;SlimeFungiHazards.update(run,dt,{poison:(x,y)=>applyFungiPoison(x,y,this.at),drain:n=>drainFungiPoison(n,this.at)},dt);renderCanvas(this.at);return this.state();},
 repaint(){this.at=Math.max(this.at,performance.now());renderCanvas(this.at);},
 state(){return {energy:run.energy,poison:run.fungiStatus.poison,confused:run.fungiStatus.confused,visual:run.fungiStatus.visual,fog:this.selected?.fungi.cloudAlpha,shots:run.fungiShots.length,dead:this.selected?.dead,evac:!!run.evacuation};},
 input(touch=false,outside=false){const b=this.selected;run.slime.x=110;run.slime.y=b.y+(outside?-run.cellSize*4:0);run.steer={keyLeft:!touch,keyRight:false,keyUp:!touch,keyDown:false,touchX:touch?-.7:0,touchY:touch?-.8:0,touchRawY:touch?-.8:0,touchDown:0};return {value:fallSteeringVector(),raw:run.steer};},
 contact(){const b=this.selected;run.slime.x=b.x+b.w/2;run.slime.y=b.y-run.slime.radius;run.slime.vx=0;run.slime.vy=170;resolveBlockHit(b,{nx:0,ny:-1,penetration:1},this.at);renderCanvas(this.at);return this.state();},
 ability(){damageBlockByElement(this.selected,2,'qa',this.at);return {state:this.state(),input:fallSteeringVector()};},
 shotHit(){const p=run.fungiShots[0];run.slime.x=p.x;run.slime.y=p.y;return this.step(.01);},
 shield(){run.barrier=1;},
 low(){run.energy=1;return applyFungiPoison(run.slime.x,run.slime.y,this.at);},
 cached(){const c=document.createElement('canvas').getContext('2d');c.canvas.width=440;c.canvas.height=840;c.createRadialGradient=c.createLinearGradient=()=>{throw Error('Per-frame fungi gradient');};SlimeFungiHazards.drawFields(c,run,false);SlimeFungiHazards.drawFields(c,run,true);SlimeFungiHazards.draw(c,run,false);return true;},
 home(){cancelAnimationFrame(run.animationId);run=null;session=null;newDraft();showScreen('home');renderDraft();syncInteractionLayers();return {name:PLANETS.get('desert').name,hp:save.planetCampaign.cores.desert,selected:save.planetCampaign.selected};},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/sky-fungi-v1';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:440,height:840},{width:320,height:568}]){
  const p=await browser.newPage({viewport}),errors=[],missing=[];p.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8767/?v=sky-fungi-1');await p.waitForFunction(()=>window.__fungiQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});await p.waitForTimeout(1800);
  for(const [hp,counts]of [[100,[10,0,0]],[75,[4,6,0]],[50,[3,3,4]],[25,[4,3,3]]]){
   const s=await p.evaluate(hp=>__fungiQA.start(hp),hp);assert.equal(s.world,'Небесный мир');assert.deepEqual(s.types,counts);assert.equal(s.water,0);assert.equal(s.pickups,3);assert(s.background.every(src=>src.includes('/sky-')));assert(s.hp.every(([k,h,u])=>h==={spore:1,fungusTurret:2,toadstool:1}[k]&&!u));
  }
  await p.evaluate(()=>{__fungiQA.start();__fungiQA.show('toadstool');});await p.waitForTimeout(1300);await p.evaluate(()=>__fungiQA.repaint());
  const geo=await p.evaluate(()=>__fungiQA.show('toadstool'));assert(Math.abs(geo.source-geo.shaft)<.001);assert.equal(geo.height,geo.cell*7);
  let input=await p.evaluate(()=>__fungiQA.input());assert.deepEqual(input.value,{x:1,y:1,up:0,down:1});assert.equal(input.raw.keyLeft,true);
  input=await p.evaluate(()=>__fungiQA.input(true));assert.deepEqual(input.value,{x:.7,y:.8,up:0,down:.8});
  input=await p.evaluate(()=>__fungiQA.input(false,true));assert.deepEqual(input.value,{x:-1,y:-1,up:1,down:0});
  await p.evaluate(()=>{__fungiQA.input();__fungiQA.step(.23);});await p.screenshot({path:dir+'/toad-fog-'+viewport.width+'.png'});
  assert(await p.evaluate(()=>__fungiQA.cached()));
  let result=await p.evaluate(()=>__fungiQA.ability());assert(result.state.dead);assert.deepEqual(result.input,{x:-1,y:-1,up:1,down:0});
  let s=await p.evaluate(()=>__fungiQA.step(.1));assert(!s.confused&&s.fog>0&&s.fog<1);s=await p.evaluate(()=>__fungiQA.step(1));assert(s.fog<.01);
  await p.evaluate(()=>{__fungiQA.start();__fungiQA.show('spore');});await p.waitForTimeout(1300);await p.evaluate(()=>__fungiQA.repaint());await p.screenshot({path:dir+'/contact-spore-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__fungiQA.contact());assert.equal(s.poison,2);assert.equal(s.energy,100);assert(s.dead);
  for(let i=0;i<8;i++)s=await p.evaluate(()=>__fungiQA.step(.25));assert.equal(s.energy,88);assert.equal(s.poison,0);
  await p.evaluate(()=>{__fungiQA.start();__fungiQA.show('spore');__fungiQA.shield();});s=await p.evaluate(()=>__fungiQA.contact());assert.equal(s.energy,100);assert.equal(s.poison,0);
  await p.evaluate(()=>{__fungiQA.start();__fungiQA.show('fungusTurret');});await p.waitForTimeout(1300);await p.evaluate(()=>__fungiQA.step(.3));await p.screenshot({path:dir+'/turret-aim-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__fungiQA.step(.66));assert.equal(s.shots,3);await p.screenshot({path:dir+'/triple-spores-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__fungiQA.shotHit());assert.equal(s.poison,2);await p.screenshot({path:dir+'/poison-'+viewport.width+'.png'});
  await p.evaluate(()=>{__fungiQA.start();__fungiQA.show('spore');__fungiQA.low();});s=await p.evaluate(()=>__fungiQA.step(.25));assert(s.evac,'Zero strength starts evacuation');
  await p.evaluate(()=>{__fungiQA.start(37);__fungiQA.show('toadstool');__fungiQA.live();});await p.waitForTimeout(1600);
  const home=await p.evaluate(()=>__fungiQA.home());assert.equal(home.hp,37);assert.equal(home.selected,'desert');assert.equal(home.name,'НЕБЕСНЫЙ МИР');await p.waitForTimeout(900);await p.screenshot({path:dir+'/sky-home-'+viewport.width+'.png'});
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log(JSON.stringify({viewport,stages:true,centeredSevenRows:true,keyboard:true,touch:true,poison:12,shield:true,evacuation:true,errors,missing}));await p.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
