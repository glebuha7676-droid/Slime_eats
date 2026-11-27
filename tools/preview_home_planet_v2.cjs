const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.homePlanetPreview=hp=>{__consoleQA.home('fire',2);save.world=1;save.planetCampaign=PLANETS.normalize({selected:'home',cores:{home:hp},unlocked:PLANETS.ids});session=null;newDraft();renderDraft();renderWorldCarousel();syncInteractionLayers();};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/concepts/home-planet-v2';try{
  const sheet=await browser.newPage({viewport:{width:1320,height:480},deviceScaleFactor:1});await sheet.goto('http://127.0.0.1:8767/'+dir+'/preview.html');await sheet.evaluate(()=>document.fonts.ready);await sheet.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));await sheet.screenshot({path:dir+'/stages.png',fullPage:true});await sheet.close();
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const p=await browser.newPage({viewport}),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8767/?v=home-planet-2');await p.waitForTimeout(5000);await p.waitForFunction(()=>window.homePlanetPreview&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000});
   for(const hp of [100,75,50,25,0]){await p.evaluate(hp=>homePlanetPreview(hp),hp);await p.waitForTimeout(600);
    const img=p.locator('.planet-card.is-selected .planet-image');await img.evaluate(i=>i.decode());assert((await img.getAttribute('src')).includes('home-v2/home-'+hp+'.webp'));
    await p.screenshot({path:dir+'/game-'+hp+'-'+viewport.width+'.png'});
   }
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log(JSON.stringify({viewport,allFiveStages:true,errors,missing}));await p.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
