const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'game.js'),'utf8');
const hook=`window.__ultimateQA={
 prepare(id,stage){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');tutorialMemoState=null;syncInteractionLayers();clearMenuSlimeInteraction();clearMenuMutationPresentation();
 save=normalizeSave({schemaVersion:29,unlockedMutations:FORM_INDEX.map(f=>f.id),mutationLevels:{[id]:stage},activeMutationPool:[id],selectedMutation:id,researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false});session=null;newDraft();session.foods=[foodForMutation(id)];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);run.elementalAbilityCharges=1;run.ultimateCharge=65;updateRunUI();},
 status(){return {stage:run.ultimateStage,profile:run.ultimateProfile,ability:run.elementalAbilityType,active:run.elementalAbilityActive,intro:!!run.ultimateIntro,charges:run.elementalAbilityCharges,passives:run.passiveLevels};},
 render(){renderCanvas(performance.now());if(run.ultimateIntro)drawUltimateIntro(run.ultimateIntro.startedAt+400);},
 open(id){run=null;showScreen('home');selectedLaboratoryMutationId=id;renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();},
 finish(){cancelAnimationFrame(run.animationId);run.ultimateIntro=null;endRun(false,'QA');}
};
`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await page.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['fire'],mutationLevels:{fire:1},activeMutationPool:['fire'],sound:false})));
 await page.goto('http://127.0.0.1:8765/?v=593');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__ultimateQA,{timeout:60000});
 assert.equal(await page.locator('#formIndexBtn').count(),0);assert.equal(await page.locator('#wardrobeBtn').count(),1);assert.equal(await page.locator('.player-level-wallet').isVisible(),false);
 for(const id of ['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch'])for(const stage of [1,2,3]){
  await page.evaluate(([id,stage])=>window.__ultimateQA.prepare(id,stage),[id,stage]);
  assert.equal(await page.locator('#abilityBtn').getAttribute('data-ultimate-stage'),String(stage));
  await page.locator('#abilityBtn').click({force:true});
  const state=await page.evaluate(()=>window.__ultimateQA.status());assert.equal(state.stage,stage);assert.equal(state.charges,0);assert.equal(state.passives[id],2);
  assert.equal(state.intro,stage===3);if(stage<3)assert.equal(state.active,id);
  if(id==='fire'){await page.evaluate(()=>window.__ultimateQA.render());await page.screenshot({path:path.join(root,`tmp/ultimate-fire-${stage}-mobile.png`)});}
 }
 console.log('27 browser activations: fixed base abilities, I/II immediate feedback, III full intro, stage snapshot and charge consumption passed');
 await page.evaluate(()=>window.__ultimateQA.prepare('phantom',2));await page.evaluate(()=>window.__ultimateQA.open('phantom'));await page.waitForTimeout(500);
 await page.screenshot({path:path.join(root,'tmp/ultimate-lab-mobile.png')});
 const width=await page.evaluate(()=>{const p=document.getElementById('panelContent');return p.scrollWidth-p.clientWidth});assert.ok(width<=1);
 await page.locator('#closePanelBtn').click();await page.waitForTimeout(200);await page.screenshot({path:path.join(root,'tmp/ultimate-home-mobile.png')});
 await page.setViewportSize({width:1280,height:1000});await page.waitForTimeout(200);await page.screenshot({path:path.join(root,'tmp/ultimate-home-desktop.png')});
 assert.deepEqual(errors,[]);console.log('Accessory relocation, temporary header hiding and desktop/mobile layouts passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
