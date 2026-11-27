const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+energy+`window.__strengthQA={
 start(){__energyQA.start();renderCanvas(performance.now());},
 set(n,kind='impact'){ENERGY.change(run,n-run.energy,kind,performance.now());updateRunUI();},
 depth(n,endless=false){run.maxDepth=n;run.endless=endless;updateRunUI();},
 pause(n){run.paused=n;updateRunUI();},
 complete(){run.evacuation={completed:true};run.energy=0;window.SlimeAnomalyEnergyHud.render(run);},
 repaint(){window.SlimeAnomalyEnergyHud.render(run);},
 menu(){renderPanel('settings');},close(){closePanel();}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/strength-hud-v5';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:440,height:840},{width:1280,height:900}]){
   const p=await b.newPage({viewport}),errors=[],failed=[];
   p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto('http://127.0.0.1:8766/?v=strength-edge-1');await p.waitForFunction(()=>window.__strengthQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   await p.evaluate(()=>__strengthQA.start());await p.waitForTimeout(350);await p.evaluate(()=>__energyQA.repaint());
   assert.equal(await p.locator('.anomaly-energy-label').textContent(),'СИЛА');assert.equal(await p.locator('#runDistanceCopy').textContent(),'До ядра');assert.equal(await p.locator('#runDistanceValue').textContent(),'500');assert.equal(await p.locator('.run-route-track').count(),0);
   const geometry=await p.evaluate(()=>{
    const box=s=>document.querySelector(s).getBoundingClientRect().toJSON();
    const label=document.querySelector('.anomaly-energy-label');
    return {hud:box('.run-top-hud'),strength:box('#anomalyEnergy'),wallet:box('#runResearchHud'),pause:box('#endRunBtn'),route:box('.run-route'),label:box('.anomaly-energy-label'),value:box('.anomaly-energy-value'),overflow:label.scrollWidth>label.clientWidth+1};
   });
   assert(geometry.hud.height<80,'Compact HUD gives the field more room');assert(geometry.strength.right<geometry.wallet.left&&geometry.wallet.right<=geometry.pause.left,'Strength, currency, and Pause have distinct slots');assert(geometry.route.top>geometry.hud.bottom+5,'Distance is detached below the header');assert(!geometry.overflow);assert(geometry.label.right<geometry.value.left,'Label never covers percentage');
   await p.screenshot({path:`${dir}/full-${viewport.width}.png`});
   if(viewport.width===440){
    const themes=[];
    for(const id of ['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch']){
     await p.evaluate(id=>{__energyQA.start(id,1);__energyQA.repaint();},id);
     await p.waitForFunction(()=>{const img=document.querySelector('#anomalyEnergy > img');return img.complete&&img.naturalWidth>0;});
     const theme=await p.locator('#anomalyEnergy').evaluate(n=>({id:n.dataset.mutation,src:n.querySelector(':scope > img').src,fill:getComputedStyle(n.querySelector('.anomaly-energy-fill')).backgroundImage}));
     assert.equal(theme.id,id);assert(theme.src.includes('emblem-'),'Current mutation emblem replaces the pickup icon');themes.push(theme.fill);
     await p.evaluate(()=>__strengthQA.set(50));
     assert.equal(await p.locator('.anomaly-energy-fill').evaluate(n=>getComputedStyle(n).backgroundImage),theme.fill,'50% keeps the mutation color');
    }
    assert.equal(new Set(themes).size,9);await p.evaluate(()=>__strengthQA.start());await p.waitForTimeout(200);
   }
   const bar=p.locator('.anomaly-energy-fill');
   const barColor=()=>bar.evaluate(n=>getComputedStyle(n).getPropertyValue('--strength-mid').trim());
   await p.evaluate(()=>__strengthQA.set(49.9));
   assert.equal(await barColor(),'#ffd647');
   assert.equal(await p.locator('.anomaly-energy-value').textContent(),'49%');
   await p.evaluate(()=>__strengthQA.set(25.1));
   assert.equal(await barColor(),'#ffd647');
   await p.evaluate(()=>__strengthQA.set(25));
   assert.equal(await barColor(),'#ff554c');
   await p.evaluate(()=>__strengthQA.start());
   await p.waitForTimeout(300);
   const line=p.locator('.anomaly-energy-drain');
   const lineOpacity=()=>line.evaluate(n=>Number(getComputedStyle(n).opacity));
   assert.equal(await lineOpacity(),0);
   await p.evaluate(()=>{__strengthQA.depth(123);__strengthQA.set(62,'hazard');});
   await p.waitForSelector('#anomalyEnergy.is-burning');
   assert(await p.locator('#anomalyEnergy').evaluate(n=>n.classList.contains('is-hazard')));assert.equal(await p.locator('.anomaly-energy-delta').textContent(),'−38%');
   assert.equal(await lineOpacity(),1);
   const attached=await line.evaluate(n=>Math.abs(n.getBoundingClientRect().right-n.parentElement.getBoundingClientRect().right)<.5);
   assert(attached,'The line follows the fill edge exactly');
   await p.screenshot({path:`${dir}/spent-${viewport.width}.png`});
   await p.waitForSelector('#anomalyEnergy.is-burning',{state:'detached'});
   assert.equal(await lineOpacity(),0);
   await p.waitForFunction(()=>document.querySelector('#runDistanceValue').textContent==='377');
   await p.evaluate(()=>{__strengthQA.set(80,'recover');__strengthQA.set(79.72);});await p.waitForTimeout(160);
   assert(await p.locator('#anomalyEnergy').evaluate(n=>n.classList.contains('is-recover')),'Ordinary contacts do not cancel the pickup response');assert.equal(await p.locator('.anomaly-energy-delta').textContent(),'+18%');
   assert.equal(await lineOpacity(),0);
   assert.equal(await p.locator('.anomaly-energy-wave').evaluate(n=>getComputedStyle(n).animationName),'strength-refill-wave');
   const overlap=await p.evaluate(()=>{const a=document.querySelector('.anomaly-energy-delta').getBoundingClientRect(),b=document.querySelector('.run-distance').getBoundingClientRect();return a.right>b.left&&a.left<b.right&&a.bottom>b.top&&a.top<b.bottom;});assert(!overlap,'Gain/loss feedback never covers distance');
   await p.screenshot({path:`${dir}/recover-${viewport.width}.png`});
   await p.evaluate(()=>__strengthQA.pause(true));
   const before=await p.locator('.anomaly-energy-fill').getAttribute('style');await p.waitForTimeout(220);assert.equal(await p.locator('.anomaly-energy-fill').getAttribute('style'),before,'Paused run freezes easing');assert.equal(await p.locator('#runDistanceValue').evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
   await p.evaluate(()=>__strengthQA.pause(false));await p.waitForTimeout(1000);assert.equal(await p.locator('.anomaly-energy-delta').textContent(),'');
   await p.evaluate(()=>__strengthQA.set(15,'hazard'));assert.equal(await p.locator('.anomaly-energy-value').textContent(),'15%','Critical value is immediate');assert.equal(await p.locator('.anomaly-energy-label').textContent(),'СИЛА КОНЧАЕТСЯ');
   await p.waitForTimeout(230);await p.screenshot({path:`${dir}/critical-${viewport.width}.png`});
   assert(await p.locator('.anomaly-energy-label').evaluate(n=>n.scrollWidth<=n.clientWidth+1),'Warning fits narrow HUD');
   await p.evaluate(()=>__strengthQA.depth(500));await p.waitForTimeout(100);assert.equal(await p.locator('#runDistanceValue').textContent(),'0');
   await p.evaluate(()=>__strengthQA.depth(1220,true));await p.waitForTimeout(1000);assert.equal(await p.locator('#runDistanceCopy').textContent(),'Глубина');assert.equal(await p.locator('#runDistanceValue').textContent(),'1220');
   await p.evaluate(()=>__strengthQA.set(.2,'maneuver'));assert.equal(await p.locator('#anomalyEnergy.is-last .anomaly-energy-value').textContent(),'1%');
   await p.evaluate(()=>__strengthQA.set(0,'maneuver'));assert.equal(await p.locator('#anomalyEnergy.is-exhaustion-flash .anomaly-energy-value').textContent(),'0%');
   await p.waitForTimeout(120);await p.screenshot({path:`${dir}/empty-${viewport.width}.png`});
   await p.waitForSelector('#anomalyEnergy.is-exhaustion-flash',{state:'detached'});
   await p.evaluate(()=>__strengthQA.repaint());assert.equal(await p.locator('#anomalyEnergy.is-exhaustion-flash').count(),0,'Empty flash plays once');
   await p.evaluate(()=>{__strengthQA.start();__strengthQA.complete();});
   assert.equal(await p.locator('#anomalyEnergy.is-exhausted').count(),0,'Completed descent does not trigger the danger signal');
   assert.equal(await p.locator('.anomaly-energy-label').textContent(),'ДОМОЙ');
   await p.evaluate(()=>__strengthQA.start());
   await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>__strengthQA.set(50,'recover'));assert.equal(await p.locator('.anomaly-energy-value').textContent(),'50%');assert.equal(await p.locator('#runDistanceValue').evaluate(n=>getComputedStyle(n).animationName),'none');
   assert.equal(await lineOpacity(),0);
   await p.evaluate(()=>__strengthQA.start());assert.equal(await p.locator('.anomaly-energy-value').textContent(),'100%');assert.equal(await p.locator('.anomaly-energy-delta').textContent(),'');await p.evaluate(()=>__energyQA.pickup());assert.equal(await p.locator('.anomaly-energy-delta').textContent(),'МАКС.','Full pickup acknowledges its cap without claiming extra strength');
   assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({viewport,compact:true,oneBar:true,legible:true,feedback:true,pause:true,critical:true,endless:true,restart:true,reducedMotion:true,errors}));await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
