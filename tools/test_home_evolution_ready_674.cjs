const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='outputs/home-evolution-ready-674';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('game.js','utf8');
const baseHook=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=baseHook+`window.__ready674={home(id,stage,value,balance=300){__consoleQA.home(id,stage);save.mutationMastery[id]=value;save.researchUnits=balance;renderHomeConsole();return this.state();},state(){return {selected:selectedLaboratoryMutationId,view:laboratoryView,levels:save.mutationLevels,balance:save.researchUnits,stages:save.mutationUltimateStages};}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[],records=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.stack));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__ready674&&window.SlimeGameDebug,null,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
  const goals=await page.evaluate(()=>Object.fromEntries(Object.entries(SlimeMutationMastery.definitions).map(([id,d])=>[id,d.goals])));
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:467,height:634}]){
   await page.setViewportSize(viewport);
   for(const [id,thresholds] of Object.entries(goals))for(const stage of [1,2]){
    await page.evaluate(({id,stage,value})=>__ready674.home(id,stage,value),{id,stage,value:thresholds[stage-1]});
    await page.evaluate(()=>SlimeHomeConsole.layout());
    const info=page.locator('#homeMutationInfo');
    const geometry=await info.evaluate(el=>{
     const r=el.getBoundingClientRect();const nodes=[...el.querySelectorAll('.console-mutation-heading,.console-evolution-stage,.console-evolution-title,.console-evolution-action')];
     return {ready:el.classList.contains('is-ready'),hidden:[...el.querySelectorAll('.console-task-kicker,.console-task-label,.console-task-track,.console-task-counter')].every(e=>e.hidden&&getComputedStyle(e).display==='none'),overflow:el.scrollHeight-el.clientHeight,
      pieces:nodes.map(e=>{const b=e.getBoundingClientRect();return {name:e.className,top:b.top-r.top,bottom:b.bottom-r.bottom,overflow:e.scrollWidth-e.clientWidth};})};
    });
    assert(geometry.ready&&geometry.hidden);assert(geometry.overflow<=1,JSON.stringify({viewport,id,stage,geometry}));assert(geometry.pieces.every(p=>p.top>=-1&&p.bottom<=1&&p.overflow<=1),JSON.stringify({viewport,id,stage,geometry}));
    records.push({viewport,id,stage,geometry});
    if(id==='fire'&&stage===1){await page.screenshot({path:out+'/'+viewport.width+'-ready.png'});await info.screenshot({path:out+'/'+viewport.width+'-monitor.png'});}
    if(viewport.width===390){
     const before=await page.evaluate(()=>__ready674.state());await info.click();
     await page.waitForSelector('#labMutationsPane:not([hidden])');
     const after=await page.evaluate(()=>__ready674.state());assert.equal(after.selected,id);assert.equal(after.view,'mutations');assert.equal(after.levels[id],stage);assert.equal(after.balance,before.balance);assert.deepEqual(after.stages,before.stages);
     assert.equal(await page.locator('[data-preview-stage="'+(stage+1)+'"]').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#mutationEvolutionConfirmBtn').count(),0,'Opening the lab must not purchase or show a confirmation automatically');
     if(id==='fire'&&stage===1){await page.waitForTimeout(300);await page.screenshot({path:out+'/laboratory-next-stage.png'});}
    }
   }
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>__ready674.home('fire',1,49));assert(!await page.locator('#homeMutationInfo').evaluate(e=>e.classList.contains('is-ready')));assert(await page.locator('.console-task-track').isVisible());assert.equal(await page.locator('.console-task-counter').innerText(),'49 / 50');assert(await page.locator('.console-evolution-callout').isHidden());
  await page.evaluate(()=>__ready674.home('fire',3,999));assert(!await page.locator('#homeMutationInfo').evaluate(e=>e.classList.contains('is-ready')));assert.equal(await page.locator('.console-task-label').innerText(),'Все стадии открыты');assert(await page.locator('.console-task-track').isVisible());
  await page.evaluate(()=>__ready674.home('frost',1,50,0));await page.locator('#homeMutationInfo').click();assert.equal((await page.evaluate(()=>__ready674.state())).balance,0);assert.equal(await page.locator('[data-preview-stage="2"]').getAttribute('aria-selected'),'true');
  await page.evaluate(()=>__ready674.home('fire',1,50,300));await page.locator('#homeMutationInfo').click();await page.locator('#mutationUpgradeBtn').click();
  assert.equal((await page.evaluate(()=>__ready674.state())).levels.fire,1,'Stage opens only after the player confirms in the lab');
  await page.locator('#mutationEvolutionConfirmBtn').click();
  await page.waitForFunction(()=>__ready674.state().levels.fire===2&&!document.getElementById('homeMutationInfo').classList.contains('is-ready'));
  assert.equal((await page.evaluate(()=>__ready674.state())).balance,250);assert.equal(await page.locator('.console-task-counter').innerText(),'50 / 200');assert(await page.locator('.console-evolution-callout').isHidden());
  await page.locator('#closePanelBtn').click();await page.waitForTimeout(250);await page.screenshot({path:out+'/after-unlock.png'});
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>__ready674.home('fire',1,50));assert.equal(await page.locator('.console-evolution-action>span').evaluate(e=>getComputedStyle(e).animationName),'none');
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/checks.json',JSON.stringify({records,errors},null,2));console.log('Ready monitor: 9 mutations, II/III unlocks, 3 layouts; task hidden, correct lab/stage selected, no purchases or currency changes; progress/max/reduced-motion states passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
