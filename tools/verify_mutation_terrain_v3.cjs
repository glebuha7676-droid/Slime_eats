// Exercise real menus/runs in an isolated browser; never changes the user's save.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.__terrainQA={
 home(world,hp=100){
  __consoleQA.home('fire',1);const planet=PLANETS.forWorld(world);
  save.planetCampaign=PLANETS.normalize({cores:{[planet.id]:hp},selected:planet.id,unlocked:PLANETS.ids});
  save.world=world;carouselWorldId=world;syncWorldStartButton(stomachCanLaunch());SlimeHomeConsole.layout();syncInteractionLayers();
 },
 async run(world){
  this.home(world);session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);
  run.launchEntryStartedAt=0;run.launchEntryUntil=0;document.body.classList.remove('portal-arrival');
  const sprites=ensureWorldSprites(world);await Promise.all(Object.values(sprites).map(im=>im.decode()));
  await Promise.all(ensureWorldBackgroundLayers(world).map(l=>l.image.decode()));
  const b=run.blocks.find(b=>b.flaskTier===3&&!b.dead)||run.blocks.find(b=>b.flaskTier&&!b.dead);
  run.cameraY=b.y-330;run.slime.y=b.y-80;run.slime.x=run.cellSize*3;run.slime.vx=run.slime.vy=0;
  updateRunUI();renderCanvas(performance.now());
  const names=world===1?['ground-weak','stone','stone-reinforced']:world===3?['cookie-packed','candy-normal','candy-reinforced']:world===4?['ash','volcanic-earth','basalt']:['sand','sandstone','desert-bedrock'];
  return {world:run.worldId,materials:names.map(n=>({name:n,src:sprites[n].src,width:sprites[n].naturalWidth})),veins:['ground-weak-liquid','stone-liquid','stone-reinforced-liquid'].map(n=>sprites[n].src),tiers:[...new Set(run.blocks.filter(b=>b.flaskTier).map(b=>b.flaskValue||FLASK_VALUES[b.flaskTier]))]};
 },paint(){renderCanvas(performance.now());}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const out='output/concepts/terrain-refresh-v3';fs.mkdirSync(out,{recursive:true});const errors=[],missing=[],report=[];
 try{
  const p=await b.newPage({viewport:{width:440,height:840}});p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))missing.push(r.url());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=mutation-terrain-3');
  await p.waitForFunction(()=>window.__terrainQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  for(const world of [1,3,4,5,6]){
   for(const hp of [100,50,0]){
    await p.evaluate(([w,h])=>__terrainQA.home(w,h),[world,hp]);await p.waitForTimeout(300);
    const path=await p.locator('.planet-card.is-selected .planet-image').getAttribute('src');
    assert(path.includes('mutation-flora-v1/'));assert(path.includes('-'+(hp===0?0:100)+'.webp'));
    await p.locator('.planet-card.is-selected .planet-image').evaluate(i=>i.decode());
    if(hp!==50)await p.screenshot({path:out+'/home-'+world+'-'+hp+'.png'});
   }
  }
  for(const world of [1,3,4,5]){
   const state=await p.evaluate(w=>__terrainQA.run(w),world);assert.equal(state.world,world);
   assert(state.veins.every((s,i)=>s.includes('/mutation-essence-v1/essence-'+[1,3,5][i]+'.webp')));
   assert(state.materials.every(m=>m.width===384));
   if(world!==3)assert(state.materials.every(m=>m.src.includes(world===1?'slime-blocks-v2':'planet-blocks-v3')));
   await p.waitForTimeout(200);await p.evaluate(()=>__terrainQA.paint());await p.screenshot({path:out+'/run-'+world+'.png'});report.push(state);
  }
  const aliases=await p.evaluate(()=>['assets/Мир 1/Обычный блок.webp','assets/Мир 4/Прочный блок.webp','assets/world5/desert-blocks-v1/sand-fragile.webp','assets/ui/planets/runtime-v1/candy-50.webp'].map(s=>SlimeAssetPaths.resolve(s)));
  assert(aliases[0].includes('slime-blocks-v2'));assert(aliases[1].includes('planet-blocks-v3'));assert(aliases[2].includes('planet-blocks-v3'));assert(aliases[3].includes('mutation-flora-v1/candy-100'));
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({report,aliases,errors,missing},null,2));console.log('5 planet selectors at 100/50/0; 4 real runs, shared essence, material sprites and legacy aliases passed.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
