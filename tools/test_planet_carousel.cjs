const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const model=require('../js/config/planet-campaign.js');
let campaign=model.normalize(null);
assert.deepEqual(campaign.unlocked,['home']);
assert.deepEqual([100,76,75,51,50,26,25,1,0].map(model.tone),['green','green','yellow','yellow','orange','orange','red','red','clear']);
assert.deepEqual([100,76,75,51,50,26,25,1,0].map(model.stage),[100,100,75,75,50,50,25,25,0]);
assert.doesNotThrow(()=>model.normalize({unlocked:'bad',pending:{},cores:{home:-1}}));
assert.equal(model.applyDamage(campaign,'candy',10).event,null);
campaign=model.applyDamage(campaign,'home',100).campaign;
assert.equal(campaign.cores.home,0);assert(campaign.unlocked.includes('candy'));
assert.equal(model.applyDamage(campaign,'home',10).event,null);
assert.equal(model.acknowledge(campaign,campaign.pending[0].id).pending.length,0);
assert.deepEqual(model.normalize({cores:{home:73}}).cores.home,73);
const source=fs.readFileSync('game.js','utf8');
const baseHook=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=baseHook+`window.__planetQA={
 seed(value){closePanel();els.resultOverlay.classList.add('hidden');save.planetCampaign=PLANETS.normalize(value);const p=PLANETS.get(save.planetCampaign.selected);if(p.worldId)save.world=p.worldId;carouselWorldId=save.world;showScreen('home');syncWorldStartButton(stomachCanLaunch());SlimeHomeConsole.layout();syncInteractionLayers();},
 state(){return structuredClone(save.planetCampaign);},
 damage(amount){save.planetCampaign=PLANETS.applyDamage(save.planetCampaign,save.planetCampaign.selected,amount).campaign;persist({refreshUI:false});syncWorldStartButton(stomachCanLaunch());},
 async complete(success){session.foods=[session.offer.find(Boolean)];recalcStats();startDrop({fromPortal:true});if(run){cancelAnimationFrame(run.animationId);run.blocksDestroyed=100;if(success){applyPlanetCoreStrike(10);finalizeWorldCompletion();}else endRun(false,'Проверка');}return !!run;},
 back(){continueAfterRun();},menu(){renderPanel('settings');},close(){closePanel();},
 reset(){save=structuredClone(defaultSave);session=null;run=null;newDraft();syncInteractionLayers();}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 fs.mkdirSync('output/planet-carousel-v1',{recursive:true});
 try{
 for(const viewport of [{width:440,height:840},{width:320,height:568},{width:390,height:844},{width:1280,height:900}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});const errors=[],failures=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/planets/'))failures.push(r.url());});
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/?v=planets-impact-3');
  await page.waitForFunction(()=>window.__planetQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  await page.evaluate(()=>{__consoleQA.home('fire',1);__planetQA.seed(null);});
  await page.waitForTimeout(750);await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:`output/planet-carousel-v1/home-${viewport.width}.png`});
  const metrics=await page.evaluate(()=>{
   const box=s=>document.querySelector(s).getBoundingClientRect().toJSON();
   return {app:box('#app'),panel:box('#homePlanetsPanel'),play:box('#worldStartBtn'),hero:box('[data-planet="home"]'),stage:box('.planet-stage'),caption:box('.planet-caption'),core:box('.planet-core'),titleOverflow:document.querySelector('.planet-title').scrollWidth>document.querySelector('.planet-title').clientWidth+1,slots:[...document.querySelectorAll('.planet-card')].map(e=>[e.dataset.planet,+e.dataset.slot])};
  });
  console.log(JSON.stringify({viewport,metrics}));
  assert(metrics.panel.top>0&&metrics.panel.bottom<=metrics.play.top+4,'Planet screen fits above Play');
  assert(metrics.hero.width>metrics.panel.width*.3,'Selected planet remains prominent');
  assert(metrics.hero.bottom>metrics.caption.top+6&&metrics.caption.bottom<metrics.core.top,'Name overlaps the planet while staying above core HP');
  assert(!metrics.titleOverflow);assert.deepEqual(metrics.slots,[['home',0],['candy',1],['magma',2],['desert',-2],['source',-1]]);
  assert.equal(await page.locator('#worldPrevBtn').isVisible(),false);
  await page.locator('[data-planet="candy"]').click();
  await page.waitForTimeout(750);
  assert.equal((await page.evaluate(()=>__planetQA.state())).selected,'candy');
  assert(await page.locator('#worldStartBtn').isDisabled());
  assert.equal(await page.locator('[data-planet="home"]').getAttribute('data-slot'),'-1');
  const lock=await page.locator('[data-planet="candy"] .planet-lock').boundingBox(),sphere=await page.locator('[data-planet="candy"]').boundingBox();
  assert(Math.abs(lock.x+lock.width/2-sphere.x-sphere.width/2)<.5&&Math.abs(lock.y+lock.height/2-sphere.y-sphere.height/2)<.5);
  await page.screenshot({path:`output/planet-carousel-v1/locked-${viewport.width}.png`});
  if(viewport.width===440&&!process.env.PLANET_LAYOUT_ONLY){
   await page.evaluate(()=>__planetQA.seed({cores:{home:80}}));await page.waitForTimeout(750);
   await page.evaluate(()=>__planetQA.damage(10));
   await page.waitForTimeout(70);assert.equal(await page.locator('.planet-core-value>b').textContent(),'80%');
   await page.waitForTimeout(650);assert(await page.locator('.planet-damage-notice').evaluate(e=>Number(getComputedStyle(e).opacity)>.5),'Damage is visible immediately on return');await page.screenshot({path:'output/planet-carousel-v1/damage.png'});
   const mid=+(await page.locator('.planet-core-value>b').textContent()).replace('%','');assert(mid>70&&mid<80);
   assert((await page.locator('[data-planet="home"] .planet-image').getAttribute('src')).includes('home-100.webp'),'Old stage stays until the health settles');
   await page.waitForFunction(()=>document.querySelector('[data-planet="home"]').classList.contains('is-restoring'));
   await page.waitForTimeout(250);
   const fade=await page.locator('[data-planet="home"]').evaluate(e=>+e.style.getPropertyValue('--planet-restore'));
   assert(fade>0&&fade<1,'Stages crossfade instead of abruptly swapping');
   await page.screenshot({path:'output/planet-carousel-v1/transforming.png'});
   await page.waitForFunction(()=>!SlimePlanetCarousel.isBusy(),null,{timeout:7000});
   assert.equal(await page.locator('.planet-core-value>b').textContent(),'70%');
   assert((await page.locator('[data-planet="home"] .planet-image').getAttribute('src')).includes('home-75.webp'));
   assert.equal((await page.evaluate(()=>__planetQA.state())).pending.length,0);
   await page.screenshot({path:'output/planet-carousel-v1/restored-75.png'});
   await page.evaluate(()=>{__planetQA.seed({cores:{home:10}});__planetQA.damage(10);});
   await page.waitForTimeout(850);await page.evaluate(()=>__planetQA.menu());
   const paused=await page.locator('.planet-core-value>b').textContent();await page.waitForTimeout(700);assert.equal(await page.locator('.planet-core-value>b').textContent(),paused,'Hidden presentation pauses');
   await page.evaluate(()=>__planetQA.close());await page.waitForFunction(()=>!SlimePlanetCarousel.isBusy(),null,{timeout:7000});
   assert.equal(await page.locator('#homePlanetsPanel').evaluate(e=>e.scrollLeft),0,'Restored focus cannot scroll the carousel caption sideways');
   assert.equal(await page.locator('.planet-core-value>b').textContent(),'0%');
   assert((await page.evaluate(()=>__planetQA.state())).unlocked.includes('candy'));
   await page.screenshot({path:'output/planet-carousel-v1/cleared.png'});
   await page.evaluate(()=>{__planetQA.seed({cores:{home:80}});__planetQA.complete(true);});
   assert.equal((await page.evaluate(()=>__planetQA.state())).cores.home,70,'Successful completion applies core damage');
   await page.waitForTimeout(300);assert.equal(await page.locator('.planet-core-value>b').textContent(),'80%','Damage waits for return home');
   await page.evaluate(()=>__planetQA.back());await page.waitForFunction(()=>!SlimePlanetCarousel.isBusy(),null,{timeout:7000});
   assert.equal((await page.evaluate(()=>__planetQA.state())).pending.length,0);
   await page.evaluate(()=>{__planetQA.seed({cores:{home:80}});__planetQA.complete(false);});
   assert.equal((await page.evaluate(()=>__planetQA.state())).cores.home,80,'Failed run does not damage core');
   await page.evaluate(()=>{__planetQA.back();__planetQA.seed({cores:{home:80}});__planetQA.damage(10);__planetQA.reset();});
   await page.waitForTimeout(200);assert(!await page.evaluate(()=>SlimePlanetCarousel.isBusy()));
   assert.equal((await page.evaluate(()=>__planetQA.state())).cores.home,100,'Reset clears presentation safely');
   await page.evaluate(()=>{__planetQA.seed({cores:{home:55}});__planetQA.damage(10);});
   await page.reload();await page.waitForFunction(()=>window.__planetQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await page.waitForFunction(()=>!SlimePlanetCarousel.isBusy(),null,{timeout:7000});
   assert.equal((await page.evaluate(()=>__planetQA.state())).cores.home,45,'Reload replays presentation without applying damage twice');
   assert.equal((await page.evaluate(()=>__planetQA.state())).pending.length,0);
   assert.equal(await page.locator('#homePlanetsPanel').getAttribute('data-tone'),'orange');
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(()=>{__planetQA.seed({cores:{home:30}});__planetQA.damage(10);});
   await page.waitForFunction(()=>!SlimePlanetCarousel.isBusy(),null,{timeout:2500});
   assert.equal(await page.locator('#homePlanetsPanel').getAttribute('data-tone'),'red');
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.evaluate(()=>__planetQA.seed({unlocked:['home','candy','magma','desert']}));
   for(const id of ['candy','magma','desert','source']){
    await page.locator(`[data-planet="${id}"]`).click();await page.waitForTimeout(700);
    assert.equal((await page.evaluate(()=>__planetQA.state())).selected,id);
    await page.screenshot({path:`output/planet-carousel-v1/${id}.png`});
   }
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);await page.close();
 }
 }finally{await browser.close();}
 console.log('Planet model, carousel and return-home presentation: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
