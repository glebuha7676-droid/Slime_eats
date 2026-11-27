const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const dir='output/concepts/anomaly-source-v3',source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1].replace("['home','candy','magma']","['home','candy','magma','desert','source']");
const hook=base+energy+`window.__sourceQA={
 async scene(hp=100){
  __energyQA.start('fire',1,123,6);cancelAnimationFrame(run.animationId);
  save.planetCampaign.cores.source=hp;run.coreArena.hp=hp;
  run.backgroundStage=PLANETS.stage(hp);run.atmosphere=SlimeWorldBackground.prepareAtmosphere(6,hp);
  const images=[...Object.values(ensureWorldSprites(6)),...ensureWorldBackgroundLayers(6,run.backgroundStage).map(l=>l.image)];
  await Promise.all(images.map(i=>i.decode()));
  run.cameraY=285+52*run.cellSize;run.slime.x=220;run.slime.y=run.cameraY+230;run.slime.vx=run.slime.vy=0;
  updateRunUI();renderCanvas(performance.now());
  return {world:run.worldId,rows:run.rowCount,shared:run.sharedDescent,depth:run.world.targetDepth,stage:run.backgroundStage,images:images.map(i=>({src:i.src,width:i.naturalWidth}))};
 },
 async core(){cancelAnimationFrame(run.animationId);run.cameraY=run.coreArena.surfaceY-420;run.slime.x=220;run.slime.y=run.coreArena.surfaceY-180;run.coreEncounter=null;SlimeCoreEncounter.preload();await SlimeCoreEncounter.shellArt(6)?.decode?.();renderCanvas(performance.now());},
 home(hp){if(run)cancelAnimationFrame(run.animationId);run=null;save.planetCampaign.cores.source=hp;save.planetCampaign.selected='source';save.world=6;carouselWorldId=6;newDraft();showScreen('home');renderDraft();syncInteractionLayers();}
};`;
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:440,height:840}}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&/source-v3|blocks-v3|backgrounds\/anomaly/.test(r.url()))missing.push(r.url());});
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8770/?v=source-unstable-3');await page.waitForTimeout(3000);
 await page.waitForFunction(()=>window.__sourceQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000});
 const reports=[];
 for(const hp of [100,75,50,25]){
  const report=await page.evaluate(hp=>__sourceQA.scene(hp),hp);assert.equal(report.world,6);assert.equal(report.rows,105);assert.equal(report.depth,500);assert(report.shared);assert(report.images.every(i=>i.width>0));reports.push(report);
  await page.waitForTimeout(300);await page.evaluate(()=>__energyQA.repaint());await page.screenshot({path:dir+'/mine-'+hp+'.png'});
 }
 await page.evaluate(()=>__sourceQA.core());await page.waitForTimeout(400);await page.evaluate(()=>__energyQA.repaint());await page.screenshot({path:dir+'/core-in-game.png'});
 for(const hp of [100,25,0]){
  await page.evaluate(hp=>__sourceQA.home(hp),hp);await page.waitForTimeout(600);
  const planet=page.locator('[data-planet="source"] .planet-image');assert((await planet.getAttribute('src')).includes('source-v3/planet-'+(hp||0)+'.webp'));
  assert.equal(await page.locator('#homePlanetsPanel').getAttribute('data-source-alive'),String(hp>0));
  await page.screenshot({path:dir+'/home-'+hp+'.png'});
 }
 const layers=await page.evaluate(async()=>{const layers=SlimeGameAssets.ensureWorldBackgroundLayers(6,100);await Promise.all(layers.map(l=>l.image.decode()));const c=document.createElement('canvas');c.width=768;c.height=1152;const x=c.getContext('2d');x.drawImage(layers[1].image,0,0);return {centerAlpha:x.getImageData(384,576,1,1).data[3],cached:layers===SlimeGameAssets.ensureWorldBackgroundLayers(6,100)};});
 assert(layers.centerAlpha<10,'Near layer center is transparent');assert(layers.cached);
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 await page.goto('http://127.0.0.1:8770/'+dir+'/preview.html');await page.setViewportSize({width:1400,height:1500});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await page.screenshot({path:dir+'/overview.png',fullPage:true});
 fs.writeFileSync(dir+'/checks.json',JSON.stringify({reports,layers,errors,missing},null,2));console.log(JSON.stringify({stages:reports.map(r=>r.stage),layers,errors,missing}));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
