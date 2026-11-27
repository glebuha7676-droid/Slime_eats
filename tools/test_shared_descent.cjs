const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1].replace("['home','candy','magma']","['home','candy','magma','desert']");
const hook=base+energy+`window.__sharedQA={
 build(world,seed){
  __energyQA.start('fire',1,seed,world);cancelAnimationFrame(run.animationId);
  let state=seed>>>0;Math.random=()=>((state=(Math.imul(state,1664525)+1013904223)>>>0)/4294967296);
  run.blocks=generateBlockField(run);indexRunBlocks();run.flasks=generateFlasks(run);run.energyPickups=SlimeEnergyPickups.build(run);
  return {world:run.worldId,depth:run.world.targetDepth,rows:run.rowCount,speed:normalFallSpeedLimit(),shared:run.sharedDescent,embedded:run.embeddedVeins,
   special:run.blocks.filter(b=>!b.dead&&b.special).map(b=>b.special),flasks:run.flasks.length,zones:run.honeyZones.length+run.jellyZones.length+run.freezeZones.length,
   pickups:run.energyPickups.map(p=>[p.row,p.col]),
   layout:run.blocks.map(b=>[b.row,b.col,b.tier,b.maxHp,b.dead,b.hazard,b.path,b.flaskTier,b.motion||null]),
   hazard:ensureWorldSprites(world)['stone-hazard'].src};
 },
 mechanics(){
  const h=run.blocks.find(b=>b.hazard&&!b.motion);const hit=__energyQA.hazard();
  const vein=run.blocks.find(b=>b.flaskTier&&!b.dead&&!b.hazard&&!b.special);destroyBlock(vein,'fire');
  return {hit,persistent:!h.dead,vein:!!vein.flaskGranted};
 },
 async show(world){this.build(world,123);await Promise.all(Object.values(ensureWorldSprites(world)).map(i=>i.decode()));await Promise.all(ensureWorldBackgroundLayers(world).map(l=>l.image.decode()));
  run.cameraY=285+72*run.cellSize;run.slime.y=run.cameraY+230;run.slime.x=run.cellSize*2.5;updateRunUI();},
 paint(){renderCanvas(performance.now());}
};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/shared-descent-v1';fs.mkdirSync(dir,{recursive:true});
try{const page=await browser.newPage({viewport:{width:440,height:840}}),errors=[],missing=[];page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))missing.push(r.url());});
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/?v=shared-descent-1');await page.waitForFunction(()=>window.__sharedQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
 const reports=[];for(let seed=1;seed<=50;seed++){
  let baseline;for(const world of [1,3,4,5]){
   const s=await page.evaluate(([w,n])=>__sharedQA.build(w,n),[world,seed]);
   assert.equal(s.depth,500);assert.equal(s.rows,105);assert.equal(s.speed,305);assert(s.shared&&s.embedded);assert.deepEqual(s.special,[]);assert.equal(s.flasks,0);assert.equal(s.zones,0);assert.equal(s.pickups.length,3);assert(s.hazard.includes('Колючий')||decodeURI(s.hazard).includes('Колючий'));
   if(!baseline)baseline=s;else{assert.deepEqual(s.layout,baseline.layout,'Same seed means identical terrain, hazards, patrols and veins');assert.deepEqual(s.pickups,baseline.pickups,'Recovery placement follows the same rules');}
   if(seed===1){const mechanics=await page.evaluate(()=>__sharedQA.mechanics());assert.deepEqual(mechanics.hit,{first:85,second:85});assert(mechanics.persistent&&mechanics.vein);const {layout,...summary}=s;reports.push({...summary,mechanics});}
  }
 }
 for(const world of [1,3,4,5])for(const width of [440,320]){
  await page.setViewportSize({width,height:width===440?840:568});await page.evaluate(w=>__sharedQA.show(w),world);await page.waitForTimeout(750);await page.evaluate(()=>__sharedQA.paint());await page.screenshot({path:dir+'/world-'+world+'-'+width+'.png'});
 }
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync(dir+'/report.json',JSON.stringify({seeds:50,worlds:4,reports,errors,missing},null,2));console.log(JSON.stringify({layouts:200,matching:true,reports,errors,missing}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
