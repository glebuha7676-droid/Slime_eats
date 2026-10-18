const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__previewQA={
 home(id){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');els.runMenuOverlay.classList.add('hidden');tutorialMemoState=null;
 save=normalizeSave({schemaVersion:29,world:id,unlockedWorlds:[1,3,4],worldBest:{1:500,3:1000},unlockedMutations:['fire'],mutationLevels:{fire:1},activeMutationPool:['fire'],tutorialStep:'done',onboarding:{enabled:false},sound:false});save.tutorialStep='done';save.onboarding.enabled=false;session=null;newDraft();carouselWorldId=id;showScreen('home');renderDraft();updatePersistentUI();syncInteractionLayers();return {active:ACTIVE_WORLD_IDS,numbers:ACTIVE_WORLD_IDS.map(worldDisplayNumber)};},
 migrate(){const s=normalizeSave({schemaVersion:29,world:2,unlockedWorlds:[1,2,3,4],worldBest:{1:500,3:230},researchUnits:321,mutationLevels:{fire:2},unlockedMutations:['fire'],tutorialStep:'done',onboarding:{enabled:false}});return {world:s.world,unlocked:s.unlockedWorlds,best:s.worldBest[3],plasma:s.researchUnits,stage:s.mutationLevels.fire};},
 run(id){this.home(id);session.foods=[foodForMutation('fire')];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);renderCanvas(performance.now());return {world:run.worldId,blocks:run.blocks.length,depth:run.world.targetDepth};},
 panel(name){closePanel();if(name==='shop'){renderShopPanel('skins');els.panelOverlay.classList.remove('hidden');}else renderPanel(name);},
 menu(){this.run(1);openRunMenu();},result(){this.run(1);endRun(false,'Проверка интерфейса');}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await page.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},sound:false})));
 await page.goto('http://127.0.0.1:8765/?v=616');await page.waitForFunction(()=>window.__previewQA&&window.SlimeGameDebug,{timeout:60000});fs.mkdirSync('tmp/previews-616',{recursive:true});
 for(const [id,theme]of [[1,'stone'],[3,'candy'],[4,'volcano']]){
  const s=await page.evaluate(id=>window.__previewQA.home(id),id);assert.deepEqual(s.active,[1,3,4]);assert.deepEqual(s.numbers,[1,2,3]);
  await page.locator('#worldTerminalPreview').evaluate(i=>i.decode());assert((await page.locator('#worldTerminalPreview').getAttribute('src')).includes('preview-'+theme+'-v4'));
  assert.equal(await page.locator('.world-carousel-dot').count(),3);assert(!(await page.locator('#worldTerminalName').textContent()).includes('ЛЕД'));
  await page.screenshot({path:'tmp/previews-616/'+theme+'.png'});
 }
 assert.deepEqual(await page.evaluate(()=>window.__previewQA.migrate()),{world:3,unlocked:[1,3,4],best:230,plasma:321,stage:2});
 for(const id of [1,3,4]){const s=await page.evaluate(id=>window.__previewQA.run(id),id);assert.equal(s.world,id);assert(s.blocks>500);}
 await page.evaluate(()=>window.__previewQA.home(1));
 for(const name of ['shop','rewards']){
  await page.evaluate(name=>window.__previewQA.panel(name),name);await page.waitForTimeout(150);
  const rows=await page.locator('#panelOverlay .buy-btn:visible').evaluateAll(items=>items.map(e=>({w:e.clientWidth,scroll:e.scrollWidth,shadow:getComputedStyle(e).boxShadow})));
  assert(rows.length&&rows.every(e=>e.scroll<=e.w+1&&e.shadow.includes('inset')));
  assert(await page.locator('#closePanelBtn').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=18));
 }
 await page.evaluate(()=>window.__previewQA.menu());assert((await page.locator('#resumeRunBtn').evaluate(e=>getComputedStyle(e).backgroundPosition)).startsWith('6px'));
 await page.evaluate(()=>window.__previewQA.result());await page.waitForFunction(()=>!document.querySelector('#continueBtn').disabled);assert((await page.locator('#continueBtn').evaluate(e=>getComputedStyle(e).backgroundPosition)).startsWith('6px'));
 assert.deepEqual(errors,[]);console.log('Three worlds only: stone → candy → volcano; sequential labels, artwork, save migration, all three runs, UI buttons/close glyph and results passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
