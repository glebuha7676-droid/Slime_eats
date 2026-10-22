const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const mutationProgressColor=async page=>{const color=await page.locator('#labMutationsPane').evaluate(e=>({expected:e.style.getPropertyValue('--mutation-task-color'),actual:getComputedStyle(e.querySelector('.slime-task-meter>i')).backgroundColor}));assert.equal(color.actual,`rgb(${[1,3,5].map(i=>parseInt(color.expected.slice(i,i+2),16)).join(', ')})`,'Progress always uses the mutation color, including complete development');};
const hook=`window.__labRefineQA={
 open(id='fire',stage=2,value=19,balance=10000,active='frost'){
  if(run)cancelAnimationFrame(run.animationId);run=null;skipTutorial();closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();
  const ids=allMutations().map(m=>m.id);
  save=normalizeSave({schemaVersion:29,world:1,unlockedWorlds:[1,3,4],tutorialStep:'done',onboarding:{enabled:false},sound:false,unlockedMutations:ids,mutationLevels:Object.fromEntries(ids.map(m=>[m,stage])),mutationMastery:Object.fromEntries(ids.map(m=>[m,value])),selectedMutation:active,activeMutationPool:[active],researchUnits:balance});
  session=null;newDraft();showScreen('home');laboratoryView='mutations';selectedLaboratoryMutationId=id;renderPanel('recipes');laboratoryView='mutations';selectedLaboratoryMutationId=id;renderRecipesPanel();$('#toast').className='toast';
 },
 reopen(){closePanel();renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();},
 start(){closePanel();session.foods=[foodForMutation(selectedLaboratoryMutationId)];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);return {stage:run.ultimateStage,profileStage:run.ultimateProfile.stage,passives:run.passiveLevels,level:mutationLevel(selectedLaboratoryMutationId),foodStage:session.foods[0].stage};},
 normalized(value){return normalizeSave(value).mutationUltimateStages;},
 state(){return {ultimateStages:save.mutationUltimateStages,levels:save.mutationLevels,mastery:save.mutationMastery,flasks:save.researchUnits,active:save.activeMutationPool,selected:save.selectedMutation,view:laboratoryView,transition:!!session?.offerTransition,upgrading:mutationUpgrading,animating:mutationAnimating,tutorial:save.tutorialStep,memo:tutorialMemoState};}
};`;
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[],badAssets=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))badAssets.push(r.url());});
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__labRefineQA,null,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
 fs.mkdirSync('outputs/lab-redesign-integration',{recursive:true});
 const ids=['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch'];
 const viewports=process.env.LAB_QUICK?[{width:390,height:844}]:[{width:390,height:844},{width:320,height:568},{width:390,height:758},{width:440,height:820},{width:467,height:833},{width:467,height:634},{width:1280,height:1000}];
 for(const viewport of viewports){
  await page.setViewportSize(viewport);
  for(const id of ids){
   await page.evaluate(id=>window.__labRefineQA.open(id),id);
   await page.waitForFunction(()=>[...document.querySelectorAll('#labMutationsPane img')].every(i=>i.complete&&i.naturalWidth));
   await page.waitForTimeout(220);
   const geometry=await page.locator('.lab-redesign').evaluate(root=>{
    const r=root.getBoundingClientRect(),pane=root.querySelector('#labMutationsPane'),p=pane.getBoundingClientRect();
    return {root:[r.x,r.y,r.width,r.height],overflow:root.scrollHeight-root.clientHeight,paneOverflow:pane.scrollHeight-pane.clientHeight,
     pieces:[...pane.children].map(e=>{const b=e.getBoundingClientRect();return {name:e.className,above:b.top-p.top,below:b.bottom-p.bottom,h:b.height,overflow:e.scrollHeight-e.clientHeight,textOverflow:e.scrollWidth-e.clientWidth};}),
     copy:[...root.querySelectorAll('.slime-mutation-heading h3,.slime-base-kit p,.slime-task-kicker,.slime-header-task>strong,.slime-ultimate-copy h4,.slime-ultimate-copy p')].map(e=>{const b=e.getBoundingClientRect(),p=e.closest('header,section,.slime-header-task').getBoundingClientRect();return {text:e.textContent,bottom:b.bottom-p.bottom,overflow:e.scrollWidth-e.clientWidth};}),
     collection:[...root.querySelectorAll('.mutation-collection-slot')].map(e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom-r.bottom};})};
   });
   fs.writeFileSync(`outputs/lab-redesign-integration/${viewport.width}-${id}.json`,JSON.stringify(geometry,null,2));
   if(['fire','telekinesis','glitch'].includes(id))await page.screenshot({path:`outputs/lab-redesign-integration/${viewport.width}-${id}.png`});if(viewport.width===467&&viewport.height===833&&id==='fire')await page.screenshot({path:'outputs/lab-redesign-integration/final-mobile-467.png'});
   assert(geometry.overflow<=1&&geometry.paneOverflow<=1,JSON.stringify({viewport,id,geometry}));
   assert(geometry.pieces.every(p=>p.above>=-1&&p.below<=1&&p.overflow<=1&&p.textOverflow<=1),JSON.stringify({viewport,id,pieces:geometry.pieces}));
   assert(geometry.copy.every(p=>p.bottom<=1&&p.overflow<=1),JSON.stringify({viewport,id,copy:geometry.copy}));
   assert(await page.locator('.mutation-collection-slot').last().evaluate(e=>{const b=e.getBoundingClientRect(),modal=e.closest('.panel-modal'),m=modal.getBoundingClientRect(),s=getComputedStyle(modal);return m.bottom-b.bottom>=parseFloat(s.borderBottomWidth)+parseFloat(s.paddingBottom)-1;}),'Collection stays above the lower metal lip');
   assert(geometry.collection.length===9&&geometry.collection.every(b=>b.w>=44&&b.h>=44&&b.bottom<=1),'Nine touchable mutation targets fit');
   const rows=[...new Set(geometry.collection.map(b=>Math.round(b.y)))];assert.equal(rows.length,2,'Two rows of mutation emblems');
   const bottomRow=geometry.collection.filter(b=>Math.round(b.y)===rows[1]),topRow=geometry.collection.filter(b=>Math.round(b.y)===rows[0]);
   assert.equal(topRow.length,5);assert.equal(bottomRow.length,4);assert(Math.abs((bottomRow[0].x+bottomRow[3].x+bottomRow[3].w)/2-(topRow[0].x+topRow[4].x+topRow[4].w)/2)<1,'Last four icons centered');
   assert.equal(await page.locator('.slime-current-stage').count(),0,'No extra stage badge beside title');
   assert.equal(await page.locator('.slime-development-card.is-owned-stage .slime-stage-status').innerText(),'Активная');
   assert.equal(await page.locator('.slime-stage-owned-mark').count(),0,'Stage selection uses a frame and label without checks');
   const concealed=page.locator('.slime-development-card.is-locked:not(.is-ready) .food-mini-model');
   if(await concealed.count())assert(await concealed.first().evaluate(e=>parseFloat(getComputedStyle(e).opacity)<.1),`${id}: closed food concealed`);
   assert(await page.locator('.slime-header-task').evaluate(e=>!e.closest('header')),'Task is separate from description');await mutationProgressColor(page);
  }
  console.log('Lab layout passed',viewport);
 }
 if(!process.env.LAB_LAYOUT_ONLY){
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__labRefineQA.open());
  assert((await page.locator('.slime-task-kicker').innerText()).includes('III'));assert.equal(await page.locator('.slime-header-task>b').innerText(),'19 / 200');
  assert((await page.locator('.slime-header-task>strong').innerText()).includes('200'));
  await page.locator('[data-preview-stage="3"]').click();
  assert((await page.locator('.slime-ultimate-picture>img').getAttribute('src')).includes('phoenix-feather.webp'),'Phoenix uses an attribute instead of a slime');
  assert(await page.locator('.slime-ultimate-picture').evaluate(e=>e.getBoundingClientRect().width>=64),'Readable ultimate attribute');await page.waitForTimeout(260);assert.equal(await page.locator('[data-preview-stage="3"]').evaluate(e=>getComputedStyle(e).borderTopColor),'rgb(242, 217, 146)','Preview has only a yellow outline');assert.equal(await page.locator('[data-preview-stage="3"]').evaluate(e=>getComputedStyle(e).boxShadow),'none');await page.screenshot({path:'outputs/lab-redesign-integration/390-preview-phoenix.png'});
  await page.locator('[data-preview-stage="1"]').click();assert.equal(await page.locator('.slime-ultimate-copy h4').innerText(),'Вспышка');
  assert.equal(await page.locator('.slime-development-card.is-owned-stage').getAttribute('data-development-stage'),'1','Unlocked stage is equipped immediately');
  assert.equal((await page.evaluate(()=>window.__labRefineQA.state())).levels.fire,2,'Choosing an ultimate preserves unlock level');
  await page.locator('[data-preview-stage="2"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.slime-ultimate-copy h4').innerText(),'Феникс');
  await page.locator('#mutationChooseBtn').click();assert.equal((await page.evaluate(()=>window.__labRefineQA.state())).transition,false,'Laboratory selection finishes without a hidden food animation');await page.waitForFunction(()=>window.__labRefineQA.state().active[0]==='fire'&&document.getElementById('mutationChooseBtn').disabled&&document.getElementById('mutationChooseBtn').textContent==='ВЫБРАНО');
  assert.equal(await page.locator('#mutationChooseBtn').innerText(),'ВЫБРАНО');assert.equal((await page.evaluate(()=>window.__labRefineQA.state())).flasks,10000,'Equipping costs no currency');
  await page.locator('#labSynthesisTab').click();assert(await page.locator('#labSynthesisPane').isVisible());await page.screenshot({path:'outputs/lab-redesign-integration/390-synthesis.png'});
  await page.locator('#labMutationsTab').click();assert(await page.locator('#labMutationsPane').isVisible());
  for(const id of ids){
   await page.evaluate(id=>window.__labRefineQA.open(id,3),id);
   await page.locator('[data-preview-stage="2"]').click();
   const chosen=await page.evaluate(()=>window.__labRefineQA.state());assert.equal(chosen.ultimateStages[id],2);assert.equal(chosen.levels[id],3);
   await page.evaluate(()=>window.__labRefineQA.reopen());assert.equal(await page.locator('.slime-development-card.is-owned-stage').getAttribute('data-development-stage'),'2','Equipped stage survives reopening');
   const run=await page.evaluate(()=>window.__labRefineQA.start());assert.equal(run.stage,2,`${id}: run equips the chosen older ultimate`);assert.equal(run.profileStage,2);assert.equal(run.foodStage,3,'Unlocked food remains available');assert.equal(run.passives[id],2,'Base mutation effect unchanged');
  }
  await page.evaluate(()=>window.__labRefineQA.open('fire',3));await page.locator('[data-preview-stage="1"]').click();await page.reload();await page.waitForFunction(()=>window.SlimeGameDebug&&window.__labRefineQA,null,{timeout:60000});assert.equal((await page.evaluate(()=>window.__labRefineQA.state())).ultimateStages.fire,1,'Ultimate choice persists through reload');
  const normalized=await page.evaluate(()=>window.__labRefineQA.normalized({schemaVersion:29,unlockedMutations:['fire','frost'],mutationLevels:{fire:2,frost:3},mutationUltimateStages:{fire:99,frost:-2,unknown:3}}));assert.deepEqual(normalized,{fire:2},'Save clamps choices to unlocks and ignores invalid mutations/stages');
  await page.evaluate(()=>window.__labRefineQA.open('fire',1,50,250));await page.locator('#mutationUpgradeBtn').click();
  assert(await page.locator('#mutationEvolutionConfirmBtn').isVisible());
  await page.locator('[data-evolution-cancel]').click();assert.equal((await page.evaluate(()=>window.__labRefineQA.state())).levels.fire,1,'Cancel keeps stage');
  await page.locator('#mutationUpgradeBtn').click();await page.locator('#mutationEvolutionConfirmBtn').click();await page.waitForFunction(()=>window.__labRefineQA.state().levels.fire===2&&!window.__labRefineQA.state().upgrading&&!window.__labRefineQA.state().animating);
  let state=await page.evaluate(()=>window.__labRefineQA.state());assert.equal(state.flasks,200);assert.equal(state.mastery.fire,50,'Opening preserves real task count');
  await page.evaluate(()=>window.__labRefineQA.open('fire',2,200,0));await page.locator('#mutationUpgradeBtn').click();assert(await page.locator('#mutationEvolutionConfirmBtn').isDisabled(),'Insufficient flasks cannot buy stage');await page.locator('[data-evolution-cancel]').click();
  await page.evaluate(()=>window.__labRefineQA.open('fire',2,200,100));await page.locator('#mutationUpgradeBtn').click();await page.locator('[data-evolution-cancel]').click();await page.locator('[data-preview-stage="1"]').click();await page.locator('#mutationUpgradeBtn').click();await page.locator('#mutationEvolutionConfirmBtn').click();await page.waitForFunction(()=>window.__labRefineQA.state().levels.fire===3&&!window.__labRefineQA.state().upgrading&&!window.__labRefineQA.state().animating);
  state=await page.evaluate(()=>window.__labRefineQA.state());assert.equal(state.ultimateStages.fire,1,'Unlocking the next stage preserves an explicit older ultimate');assert.equal(state.flasks,0);assert.equal(state.mastery.fire,200);
  assert.equal(await page.locator('#mutationUpgradeBtn').count(),0);assert.equal(await page.locator('.slime-task-kicker').innerText(),'Все стадии открыты');
  await page.screenshot({path:'outputs/lab-redesign-integration/390-complete.png'});
  for(const stage of [1,3])for(const id of ids){await page.setViewportSize({width:320,height:568});await page.evaluate(([id,stage])=>window.__labRefineQA.open(id,stage,0),[id,stage]);assert(await page.locator('#labMutationsPane').evaluate(e=>e.scrollHeight-e.clientHeight<=1),`${id} stage ${stage} fits 320px`);assert(await page.locator('.slime-header-task').evaluate(e=>e.scrollHeight-e.clientHeight<=1),`${id} stage ${stage}: task fits`);await mutationProgressColor(page);assert(await page.locator('.slime-ultimate-copy').evaluate(e=>e.getBoundingClientRect().bottom<=e.closest('section').getBoundingClientRect().bottom+1),`${id} stage ${stage}: ultimate description fits`);}
  await page.locator('#closePanelBtn').click();assert(await page.locator('#panelOverlay').isHidden());
 }
 assert.deepEqual(errors,[],'No runtime errors');assert.deepEqual(badAssets,[],'All art loads');
 await browser.close();console.log('Laboratory redesign passed: nine mutations, layouts, ownership/preview, selection, stage gating, payment and max stage.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
