const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=\x60([\s\S]*?)\x60;/)[1];
const hook=base+`window.__polishQA={
 async start(world,hp=50){
  __consoleQA.home('fire',2);const planet=PLANETS.forWorld(world);save.world=world;
  save.planetCampaign=PLANETS.normalize({cores:{[planet.id]:hp},selected:planet.id,unlocked:PLANETS.ids});
  session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);
  run.launchEntryStartedAt=0;run.launchEntryUntil=0;run.damageInvulnerableUntil=0;document.body.classList.remove('portal-arrival');
  const sprites=ensureWorldSprites(world);await Promise.all(Object.values(sprites).map(im=>im.decode()));
  await Promise.all(ensureWorldBackgroundLayers(world).map(l=>l.image.decode()));
  return ['ground-weak-liquid','stone-liquid','stone-reinforced-liquid'].map(k=>sprites[k].src);
 },
 show(kind){
  const b=kind==='veins'?run.blocks.find(b=>b.flaskTier===3):run.blocks.find(b=>b.hazardKind===kind);
  run.cameraY=b.y-340;run.slime.x=b.x+(b.col>2?-1:2)*run.cellSize;run.slime.y=b.y+run.cellSize*2;
  run.slime.vx=run.slime.vy=0;this.block=b;return {x:b.x,y:b.y};
 },
 step(n=1){for(let i=0;i<n;i++)updateMovingHazards(performance.now(),1/60);renderCanvas(performance.now());},
 overlap(){const b=this.block;b.x=Math.min(run.gridOffsetX+run.cellSize*4,b.x+run.cellSize*.8);b.y+=run.cellSize*.65;renderCanvas(performance.now());},
 lasers(){
  const b=run.techHazards.find(b=>b.tech.kind==='laser');let count=0;
  const c={globalAlpha:1,save(){},restore(){},drawImage(image){if(image?.width===8&&image?.height===64)count++;},beginPath(){},arc(){},fill(){},stroke(){}};
  run.cameraY=b.y-1000;SlimeTechHazards.draw(c,run);const outside=count;
  run.cameraY=b.y-340;SlimeTechHazards.draw(c,run);return {outside,inside:count,state:b.tech.state};
 }
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/veins-hazards-v2';fs.mkdirSync(dir,{recursive:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=veins-hazards-2');await p.waitForFunction(()=>window.__polishQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000});
  for(const world of [1,3,4,5]){
   const paths=await p.evaluate(w=>__polishQA.start(w),world);
   assert(paths.every((s,i)=>s.includes('anomaly-veins-v3/vein-'+[1,3,5][i]+'.webp')));
   await p.evaluate(()=>__polishQA.show('veins'));await p.waitForTimeout(500);await p.evaluate(()=>__polishQA.step());
   await p.screenshot({path:dir+'/veins-world-'+world+'.png'});
  }
  await p.evaluate(()=>__polishQA.start(1));await p.evaluate(()=>__polishQA.show('patrol'));await p.waitForTimeout(500);
  for(const n of [0,20,40]){await p.evaluate(n=>__polishQA.step(n),n);await p.screenshot({path:dir+'/sentry-'+n+'.png'});}
  await p.evaluate(()=>__polishQA.show('chaser'));await p.evaluate(()=>__polishQA.overlap());await p.screenshot({path:dir+'/chaser-over-rock.png'});
  await p.evaluate(()=>__polishQA.start(3));const laser=await p.evaluate(()=>__polishQA.lasers());
  assert.equal(laser.outside,0);assert(laser.inside>0);assert.equal(laser.state,'active');assert.deepEqual(errors,[]);
  fs.writeFileSync(dir+'/report.json',JSON.stringify({worlds:4,laser,errors},null,2));console.log('Transparent veins on four worlds, sentry pivot snapshots, seeker over terrain and visible-only immediate lasers passed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
