const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='outputs/wardrobe-688';fs.mkdirSync(out,{recursive:true});
const hook=fs.readFileSync('tools/test_wardrobe_686.cjs','utf8').split('const hook=`')[1].split('`;')[0];
const source=fs.readFileSync('game.js','utf8'),config=fs.readFileSync('js/config/wardrobe.js','utf8');
// Recorded geometry of the previously accepted 687 screen, without depending on generated test files.
const legacy390={roomHeight:187.61,synthBottom:778.13};
const fixture=kind=>Array.from({length:kind==='accessories'?30:36},(_,i)=>({id:'qa-'+kind+'-'+i,name:'Тестовый предмет '+(i+7)}));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});let page;try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=page=await context.newPage();
 const errors=[],records=[];let large=false;p.on('pageerror',e=>errors.push(e.stack));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.route('**/js/config/wardrobe.js*',r=>r.fulfill({contentType:'application/javascript',body:large?config.replace('const catalogs = {accessories,emotions};',`const catalogs = {accessories:[...accessories,...${JSON.stringify(fixture('accessories'))}],emotions:[...emotions,...${JSON.stringify(fixture('emotions'))}]};`):config}));
 await p.goto('http://127.0.0.1:8766/?v=688');await p.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});await p.evaluate(()=>__wardrobeQA.setup());await p.locator('#wardrobeBtn').click();
 for(const viewport of [{width:320,height:650},{width:390,height:844},{width:1280,height:900}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(120);
  const layout=await p.locator('.wardrobe').evaluate(el=>{const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return {root:rect(el),room:rect(el.querySelector('.wardrobe-scene')),synth:rect(el.querySelector('#wardrobeSynthesize')),scroll:el.scrollHeight,client:el.clientHeight}});
  assert(layout.scroll<=layout.client+2,JSON.stringify({viewport,layout}));assert(layout.synth.bottom<=layout.root.bottom+1,'Synthesis fits');
  if(viewport.width===390){assert(layout.room.height>legacy390.roomHeight+20,'More room below the larger slime');assert(layout.synth.bottom>legacy390.synthBottom+10,'The synthesis machine is lower')}
  assert.equal(await p.locator('#wardrobePet canvas').evaluate(e=>getComputedStyle(e).animationName),'slimeWait');
  await p.screenshot({path:out+'/accessories-'+viewport.width+'.png'});records.push({viewport,layout});
 }
 await p.setViewportSize({width:390,height:844});
 const before=await p.locator('#wardrobePet canvas').evaluate(e=>getComputedStyle(e).transform);await p.waitForTimeout(350);assert.notEqual(await p.locator('#wardrobePet canvas').evaluate(e=>getComputedStyle(e).transform),before,'Existing home breathing animation really moves');
 await p.locator('#wardrobeEmotionsTab').click();const locks=await p.locator('.wardrobe-card.is-locked').evaluateAll(cards=>cards.map(c=>({label:c.querySelector('.wardrobe-locked-label').textContent,loaded:c.querySelector('img').complete&&c.querySelector('img').naturalWidth>0,size:c.querySelector('img').getBoundingClientRect().width})));
 assert.equal(locks.length,5);assert(locks.every(l=>l.label==='Закрыто'&&l.loaded&&l.size>=24));await p.locator('[data-item=love]').click();assert.equal(await p.locator('#wardrobeItemName').innerText(),'Эмоция закрыта');assert(await p.locator('#wardrobeEquip').isDisabled());await p.screenshot({path:out+'/emotions-390.png'});
 large=true;await p.reload();await p.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});await p.evaluate(()=>__wardrobeQA.setup());await p.locator('#wardrobeBtn').click();
 assert.equal(await p.locator('.wardrobe-card').count(),36);await p.waitForTimeout(350);const scroll=p.locator('.wardrobe-grid-scroll'),synth=p.locator('#wardrobeSynthesize');const pinned=await synth.boundingBox();
 assert(await scroll.evaluate(e=>e.scrollHeight>e.clientHeight*4));await scroll.evaluate(e=>e.scrollTop=e.scrollHeight);await p.waitForTimeout(100);const bottom=await scroll.evaluate(e=>e.scrollTop);assert(bottom>0);assert.deepEqual(await synth.boundingBox(),pinned,'Many accessories never move the machine');await p.locator('[data-item="qa-accessories-29"]').click();assert(await p.locator('#wardrobeEquip').isDisabled());await p.screenshot({path:out+'/many-accessories.png'});
 await p.locator('#wardrobeEmotionsTab').click();assert.equal(await p.locator('.wardrobe-card').count(),42);await scroll.focus();await p.keyboard.press('End');await p.waitForTimeout(200);assert(await scroll.evaluate(e=>e.scrollTop>0),'Keyboard reaches later emotions');await p.screenshot({path:out+'/many-emotions.png'});
 await p.locator('#wardrobeAccessoriesTab').click();assert(Math.abs(await scroll.evaluate(e=>e.scrollTop)-bottom)<2,'Each category remembers its scroll position');
 await p.evaluate(()=>Math.random=()=>.999999);await synth.click();await p.waitForTimeout(2300);assert.equal(await p.locator('#wardrobeItemName').innerText(),'Тестовый предмет 36');assert.deepEqual(await synth.boundingBox(),pinned,'New-item status does not push the machine');assert(await p.locator('[data-item="qa-accessories-29"]').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.closest('.wardrobe-grid-scroll').getBoundingClientRect();return a.top>=b.top-1&&a.bottom<=b.bottom+1}),'New item revealed inside its own scroller');await p.screenshot({path:out+'/many-unlocked.png'});
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('#wardrobePet canvas').evaluate(e=>getComputedStyle(e).animationName),'none');assert.deepEqual(errors,[]);
 fs.writeFileSync(out+'/checks.json',JSON.stringify({records,locks,accessoryCount:36,emotionCount:42,errors},null,2));console.log('Larger room/slime, lower pinned synthesizer, home idle motion, readable locks, 36 accessories/42 emotions, independent scroll positions, keyboard reachability, scoped prize reveal and reduced motion passed.');
 }catch(e){if(page)await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
