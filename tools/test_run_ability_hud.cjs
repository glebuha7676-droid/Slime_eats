const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+energy+`window.__abilityHudQA={
 start(id='fire'){__energyQA.start(id,1);renderCanvas(performance.now());},
 charge(n){run.elementalAbilityCharges=n>=100?1:0;run.ultimateCharge=Math.round(ULTIMATE_BLOCKS_REQUIRED*n/100);run.elementalAbilityActive=false;run.elementalAbilityUntil=0;run.ultimateIntro=null;updateRunUI();},
 pause(n){run.paused=n;updateRunUI();},
 activated(){return !!run.ultimateIntro||!!run.elementalAbilityActive;}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/run-clarity-v2';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:320,height:568},{width:440,height:840},{width:1280,height:900}]){
  const page=await browser.newPage({viewport}),errors=[],failed=[];page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/?v=run-clarity-2');await page.waitForFunction(()=>window.__abilityHudQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  await page.evaluate(()=>__abilityHudQA.start());await page.waitForTimeout(400);
  const geometry=await page.evaluate(()=>{const box=s=>document.querySelector(s).getBoundingClientRect().toJSON(),s=getComputedStyle(document.getElementById('runDistanceReadout'));return {hud:box('.run-top-hud'),distance:box('#runDistanceReadout'),shaft:box('#shaft'),button:box('#abilityBtn'),bg:s.backgroundColor,shadow:s.boxShadow,inside:document.querySelector('.run-top-hud').contains(document.getElementById('runDistanceReadout'))};});
  assert(!geometry.inside&&geometry.distance.top>geometry.hud.bottom+5,'Distance is detached from the metal header');assert.equal(geometry.bg,'rgba(0, 0, 0, 0)');assert.equal(geometry.shadow,'none');assert(Math.abs(geometry.distance.x+geometry.distance.width/2-geometry.shaft.x-geometry.shaft.width/2)<1,'Distance centered');
  assert(geometry.button.width>=86&&geometry.button.bottom<=geometry.shaft.bottom,'Large button fits in the shaft');
  assert(!await page.locator('.ability-icon-muted').evaluate(n=>getComputedStyle(n).filter.includes('grayscale')),'Emblem stays colorful at zero charge');assert(await page.locator('#abilityBtn').isDisabled());assert.equal(await page.locator('.ability-state').textContent(),'ЛОМАЙ БЛОКИ');
  await page.screenshot({path:`${dir}/charging-${viewport.width}.png`});
  await page.evaluate(()=>__abilityHudQA.charge(100));await page.waitForTimeout(160);
  assert(await page.locator('#abilityBtn').isEnabled());assert.equal(await page.locator('.ability-state').textContent(),'ЖМИ!');assert(await page.locator('#abilityReadyCue').isVisible());
  await page.screenshot({path:`${dir}/ready-${viewport.width}.png`});
  await page.evaluate(()=>__abilityHudQA.pause(true));assert.equal(await page.locator('#abilityBtn').evaluate(n=>getComputedStyle(n).animationPlayState.split(',')[0]),'paused');assert.equal(await page.locator('#runDistanceValue').evaluate(n=>getComputedStyle(n).animationPlayState),'paused');
  const cueTime=await page.locator('#abilityReadyCue').evaluate(n=>n.getAnimations()[0].currentTime);await page.waitForTimeout(250);assert(Math.abs(await page.locator('#abilityReadyCue').evaluate(n=>n.getAnimations()[0].currentTime)-cueTime)<20,'Ready cue pauses with the game');
  await page.evaluate(()=>__abilityHudQA.pause(false));await page.waitForTimeout(2300);assert(!await page.locator('#abilityReadyCue').isVisible());
  await page.evaluate(()=>{__abilityHudQA.charge(0);__abilityHudQA.charge(100);});await page.waitForTimeout(100);assert(!await page.locator('#abilityReadyCue').isVisible(),'First-ready cue is not repeated on every charge');
  await page.locator('#abilityBtn').click();assert(await page.evaluate(()=>__abilityHudQA.activated()),'The decorated control still activates its actual ability');
  if(viewport.width===440){for(const id of ['frost','electric','nano','cosmos','telekinesis','cloning','phantom','glitch']){await page.evaluate(id=>{__abilityHudQA.start(id);__abilityHudQA.charge(100);},id);await page.locator('#abilityBtn .ability-icon-color').evaluate(i=>i.decode());await page.screenshot({path:`${dir}/ready-${id}.png`});}}
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{__abilityHudQA.start();__abilityHudQA.charge(100);});assert.equal(await page.locator('#abilityBtn').evaluate(n=>getComputedStyle(n).animationName),'none');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);console.log(JSON.stringify({viewport,distanceDetached:true,coloredEmblem:true,readiness:true,oncePerRun:true,pause:true,activation:true,reducedMotion:true,errors}));await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
