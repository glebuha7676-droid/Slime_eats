const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1].replace("['home','candy','magma']","['home','candy','magma','desert']");
const hook=base+energy+`window.__terrainQA={
 inspect(world,seed){
  __energyQA.start('fire',1,seed,world);cancelAnimationFrame(run.animationId);
  const rocks=run.blocks.filter(b=>!b.dead&&!b.special&&!b.hazard);
  const plan=run.terrainPlan;
  const badGuide=plan?plan.guideCols.flatMap((col,row)=>{const b=run.blocks[row*run.columns+col];return !b.dead&&!b.special&&!b.hazard&&b.tier!=='dense'?[row]:[]}):[];
  const disconnected=plan?plan.pathStarts.some((c,i,a)=>i&&Math.abs(c-a[i-1])>1):false;
  return {world:run.worldId,rows:run.rowCount,honey:run.honeyZones.length,jelly:run.blocks.filter(b=>b.special==='jelly'||b.environmentRemoved==='honey').length,
   tiers:['dense','hard','reinforced'].map(t=>rocks.filter(b=>b.tier===t).length),invalid:rocks.filter(b=>!['dense','hard','reinforced','soft'].includes(b.tier)||b.hp<1).length,badGuide,disconnected,
   sections:plan?.sections||[],hazards:run.blocks.filter(b=>b.hazard).length,flasks:run.flasks.length,embedded:!!run.embeddedVeins,pickups:run.energyPickups?.length};
 },
 async show(world){this.inspect(world,123);const sprites=ensureWorldSprites(world);await Promise.all(Object.values(sprites).map(im=>im.decode()));
  await Promise.all(ASSETS.ensureWorldBackgroundLayers(world).map(l=>l.image.decode()));
  run.cameraY=285+Math.floor(run.rowCount*.69)*run.cellSize;run.slime.y=run.cameraY+220;run.slime.x=run.cellSize*2.5;run.slime.vx=run.slime.vy=0;
  updateRunUI();return Object.entries(sprites).map(([name,im])=>({name,src:im.src,width:im.naturalWidth}));
 },paint(){renderCanvas(performance.now());},
 reward(){const b=run.blocks.find(b=>b.flaskTier&&!b.dead&&!b.special&&!b.hazard),before=run.researchUnits||0;destroyBlock(b,'fire');return {before,granted:b.flaskGranted};},
 coreState(){return {hp:save.planetCampaign.cores.desert,phase:run.coreEncounter?.phase,event:save.planetCampaign.pending.find(e=>e.planetId==='desert'),evacuation:!!run.evacuation,ended:run.ended};}
};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/biome-terrain-v1';fs.mkdirSync(dir,{recursive:true});
try{const page=await browser.newPage({viewport:{width:440,height:840}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))missing.push(r.url());});
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/?v=biome-terrain-1');await page.waitForFunction(()=>window.__terrainQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
 const reports=[];for(const world of [3,4,5]){
  for(let seed=1;seed<=30;seed++){
   const state=await page.evaluate(([w,s])=>__terrainQA.inspect(w,s),[world,seed]);
   assert.equal(state.world,world);assert.equal(state.honey,0);assert.equal(state.jelly,0);assert.equal(state.invalid,0);assert.equal(state.disconnected,false);assert.deepEqual(state.badGuide,[]);assert(state.tiers.every(n=>n>0));
   for(const [zone,section] of state.sections.entries()) {const weights=[{dense:55,hard:45,reinforced:0},{dense:30,hard:52,reinforced:18},{dense:30,hard:28,reinforced:42}][zone];for(const t of ['dense','reinforced'])assert.equal(section.counts[t],Math.round(section.count*weights[t]/100));}
   if(seed===1)reports.push(state);
  }
  for(const width of [440,320]){
   await page.setViewportSize({width,height:width===440?840:568});const sprites=await page.evaluate(w=>__terrainQA.show(w),world);assert(sprites.every(s=>s.width>0));
   await page.waitForTimeout(750);await page.evaluate(()=>__terrainQA.paint());await page.screenshot({path:dir+'/world-'+world+'-'+width+'.png'});
  }
 }
 await page.evaluate(()=>__terrainQA.inspect(5,44));const reward=await page.evaluate(()=>__terrainQA.reward());assert(reward.granted,'Desert veins grant currency');
 await page.evaluate(()=>__energyQA.core(60));await page.waitForFunction(()=>__terrainQA.coreState().hp<100,null,{timeout:14000});
 const core=await page.evaluate(()=>__terrainQA.coreState());assert.equal(core.hp,84);assert.equal(core.event.damage,16);
 await page.waitForFunction(()=>__terrainQA.coreState().evacuation,null,{timeout:10000});
 await page.waitForFunction(()=>__terrainQA.coreState().ended,null,{timeout:10000});
 core.returned=await page.evaluate(()=>__terrainQA.coreState().ended);assert(core.returned);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync(dir+'/report.json',JSON.stringify({reports,reward,core,errors,missing},null,2));console.log(JSON.stringify({reports,reward,core,errors,missing}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
