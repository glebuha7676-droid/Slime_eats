const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+energy+`window.__polishQA={
 balance(n){save.researchUnits=n;renderDraft();},
 hp(n){save.planetCampaign=PLANETS.normalize({cores:{home:n}});syncWorldStartButton(stomachCanLaunch());},
 menu(type){renderPanel(type);},close(){closePanel();},
 damage(){save.planetCampaign=PLANETS.normalize({cores:{home:80}});syncWorldStartButton(stomachCanLaunch());save.planetCampaign=PLANETS.applyDamage(save.planetCampaign,'home',10).campaign;syncWorldStartButton(stomachCanLaunch());}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/planet-polish-v3';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:440,height:840},{width:320,height:568}]){
   const page=await browser.newPage({viewport}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await page.goto('http://127.0.0.1:8766/?v=planets-impact-5');
   await page.waitForFunction(()=>window.__polishQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await page.evaluate(()=>__consoleQA.home('fire',1));await page.waitForTimeout(350);
   assert.equal(await page.locator('.planet-hp-phases>i').count(),4);assert.equal(await page.locator('.planet-milestones').count(),0,'No numerical labels below the phases');
   assert(await page.locator('.planet-core-value').evaluate(n=>getComputedStyle(n.querySelector('small')).color===getComputedStyle(n.querySelector('b')).color),'Core label and percentage share their stage color');
   if(viewport.width===440){
    const colors=new Set();
    for(const hp of [100,73,48,23]){
     await page.evaluate(n=>__polishQA.hp(n),hp);
     const color=await page.locator('.planet-core-value').evaluate(n=>{const a=getComputedStyle(n.querySelector('small')).color,b=getComputedStyle(n.querySelector('b')).color;return {a,b};});
     assert.equal(color.a,color.b);colors.add(color.b);
     await page.locator('.planet-core').screenshot({path:`${dir}/core-${hp}.png`});
    }
    assert.equal(colors.size,4,'Each HP phase has a distinct shared label/bar color');await page.evaluate(()=>__polishQA.hp(100));
   }
   for(const balance of [10900,9999999]){
    await page.evaluate(n=>__polishQA.balance(n),balance);
    const metrics=await page.locator('.research-wallet-flask').evaluate(n=>{const i=n.querySelector('img').getBoundingClientRect(),b=n.querySelector('b'),r=b.getBoundingClientRect(),a=document.getElementById('app').getBoundingClientRect();return {end:i.right,start:r.left,overflow:b.scrollWidth>b.clientWidth+1,inside:i.left>=a.left&&i.top>=a.top&&r.right<=a.right};});
    assert(metrics.start>=metrics.end,'Large home jar never covers the balance');assert(!metrics.overflow);assert(metrics.inside,'Currency remains inside viewport');
   }
   await page.screenshot({path:`${dir}/home-${viewport.width}.png`});
   for(const panel of ['recipes','shop','rewards']){
    await page.evaluate(type=>__polishQA.menu(type),panel);await page.waitForTimeout(220);
    const metrics=await page.locator('#panelTitle').evaluate(n=>{const a=n.querySelector('span:last-child'),i=a.querySelector('img').getBoundingClientRect(),b=a.querySelector('b').getBoundingClientRect(),c=document.getElementById('closePanelBtn').getBoundingClientRect();return {iconEnd:i.right,numberStart:b.left,balanceEnd:a.getBoundingClientRect().right,closeStart:c.left};});
    assert(metrics.numberStart>=metrics.iconEnd,'Modal jar never covers currency digits');assert(metrics.balanceEnd<=metrics.closeStart,'Balance leaves room for Close');
    await page.screenshot({path:`${dir}/${panel}-${viewport.width}.png`});
    await page.evaluate(()=>__polishQA.close());
   }
   await page.evaluate(()=>{__energyQA.start();document.getElementById('runResearchScore').textContent='999';});
   const hud=await page.locator('#runResearchHud').evaluate(n=>{const i=n.querySelector('img').getBoundingClientRect(),b=n.querySelector('b').getBoundingClientRect();return {iconEnd:i.right,start:b.left,end:b.right,bounds:n.getBoundingClientRect().right};});
   assert(hud.start>=hud.iconEnd&&hud.end<=hud.bounds,'In-run currency has room for three digits and its jar');
   await page.waitForTimeout(300);await page.evaluate(()=>__energyQA.repaint());await page.screenshot({path:`${dir}/hud-${viewport.width}.png`});
   await page.evaluate(()=>__consoleQA.home('fire',1));
   if(viewport.width===440){
    await page.route('**/home-75.webp*',async r=>{await new Promise(resolve=>setTimeout(resolve,2400));await r.continue();});
    await page.evaluate(()=>__polishQA.damage());await page.waitForTimeout(400);
    assert(await page.locator('.planet-damage-notice').evaluate(n=>Number(getComputedStyle(n).opacity)>.5),'Slow planet image does not delay impact feedback');
    assert(+(await page.locator('.planet-core-value>b').textContent()).replace('%','')<80);
    await page.waitForFunction(()=>!SlimePlanetCarousel.isBusy(),null,{timeout:8000});
    assert.equal(await page.locator('.planet-core-value>b').textContent(),'70%');
    assert.equal(await page.locator('#homePlanetsPanel').getAttribute('data-tone'),'yellow');
   }
   assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,currencyLegible:true,modalSpacing:true,hudReadable:true,slowStageFeedback:true,errors}));await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
