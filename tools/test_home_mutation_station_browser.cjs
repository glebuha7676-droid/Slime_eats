const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__stationQA={
 home(id='fire',stage=2){if(run)cancelAnimationFrame(run.animationId);run=null;closePanel();els.resultOverlay.classList.add('hidden');tutorialMemoState=null;clearMenuMutationPresentation();
 const ids=allMutations().map(m=>m.id);save=normalizeSave({schemaVersion:29,world:1,unlockedWorlds:[1,3,4],unlockedMutations:ids,mutationLevels:Object.fromEntries(ids.map(id=>[id,stage])),mutationMastery:Object.fromEntries(ids.map(id=>[id,120])),selectedMutation:id,activeMutationPool:['fire','frost','phantom'],researchUnits:300,tutorialStep:'done',onboarding:{enabled:false},sound:false});session=null;newDraft();showScreen('home');renderDraft();syncInteractionLayers();},
 state(){return {selected:save.selectedMutation,pool:save.activeMutationPool,levels:save.mutationLevels,mastery:save.mutationMastery,plasma:save.researchUnits,offer:session?.offer.filter(Boolean).map(f=>({id:f.id,stage:f.stage,family:foodRecipeFamily(f)})),foods:session?.foods.map(f=>({id:f.id,stage:f.stage,family:foodRecipeFamily(f)})),run:run&&{mutation:run.mutationId,stage:run.ultimateStage},busy:menuSlimeIsBusy()};},
 open(id){openHomeMutationDetails(id);},fresh(){closePanel();save=normalizeSave({schemaVersion:29,tutorialStep:'done',unlockedMutations:[],onboarding:{enabled:false},sound:false});session=null;newDraft();syncInteractionLayers();},
 };`;
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});fs.mkdirSync('tmp/home-630',{recursive:true});
 const errors=[];
 for(const viewport of [{width:440,height:820},{width:390,height:844},{width:320,height:568},{width:1280,height:1000}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8765/?v=630');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__stationQA,null,{timeout:60000});await page.evaluate(()=>window.__stationQA.home());await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  const geometry=await page.evaluate(()=>{
   const r=id=>document.getElementById(id).getBoundingClientRect().toJSON(),app=r('app'),active=document.querySelector('.home-mutation-medal.is-current').getBoundingClientRect();
   const info=document.getElementById('homeMutationInfo'),text=[...info.children].map(e=>({text:e.textContent,overflow:e.scrollWidth>e.clientWidth+1,y:e.getBoundingClientRect().y,bottom:e.getBoundingClientRect().bottom}));
   return {app,world:r('worldCarousel'),play:r('worldStartBtn'),food:r('foodChoices'),info:r('homeMutationInfo'),carousel:r('conveyorDispensers'),center:active.x+active.width/2,text,bodyOverflow:document.documentElement.scrollHeight-innerHeight};
  });
  console.log(`Aligned ${viewport.width}×${viewport.height}: world ${geometry.world.width.toFixed(1)}×${geometry.world.height.toFixed(1)}, three emblems, no overflow`);
  assert(geometry.world.width>geometry.app.width*.65,'World preview retains useful width');assert(geometry.world.height>=65,'World preview is readable');assert(geometry.play.width>geometry.app.width*.65,'Play fills its opening');
  assert(Math.abs(geometry.center-(geometry.app.x+geometry.app.width/2))<2,'Selected mutation centered in cradle');
  assert.equal(await page.locator('.home-mutation-medal:not(.is-outside)').count(),3);assert.equal(await page.locator('#foodChoices .conveyor-food-pick').count(),1);
  const medals=await page.locator('.home-mutation-medal:not(.is-outside)').evaluateAll(buttons=>buttons.map(button=>{const r=button.getBoundingClientRect(),image=button.querySelector('img').getBoundingClientRect();return {active:button.classList.contains('is-current'),height:image.height,centerY:image.y+image.height/2,buttonCenterY:r.y+r.height/2,buttonHeight:r.height};}));
  const selectedMedal=medals.find(m=>m.active);assert(selectedMedal.height>medals.find(m=>!m.active).height*1.2,'Current medal grows');assert(selectedMedal.height<=selectedMedal.buttonHeight+1,'Current medal remains inside the frame opening');assert(Math.abs(selectedMedal.centerY-selectedMedal.buttonCenterY)<1,'Current medal is vertically centered');
  assert(geometry.play.bottom<=geometry.app.bottom+1);assert(geometry.food.bottom<geometry.carousel.top);assert(geometry.carousel.bottom<geometry.world.top);assert(geometry.bodyOverflow<=1);
  assert(geometry.text.every(t=>!t.overflow),'Information does not clip horizontally');
  assert(geometry.text.every(t=>t.bottom<=geometry.info.bottom+1),'Information stays inside its vertical niche');
  await page.screenshot({path:`tmp/home-630/${viewport.width}-home.png`});
  if(process.env.STATION_LAYOUT_ONLY){console.log(await page.locator('.home-mutation-medal.is-current').evaluate(e=>{const im=e.querySelector('img'),frame=document.getElementById('homeMutationFrame'),style=getComputedStyle(im);return {button:e.getBoundingClientRect().toJSON(),image:im.getBoundingClientRect().toJSON(),fit:style.objectFit,align:style.alignSelf,frame:frame.getBoundingClientRect().toJSON(),mask:getComputedStyle(frame).mask,padding:getComputedStyle(frame).padding}}));await page.close();continue;}
  await page.locator('#homeMutationNext').click();await page.waitForTimeout(400);let state=await page.evaluate(()=>window.__stationQA.state());assert.equal(state.selected,'frost');assert.deepEqual(state.pool,['frost']);assert.equal(state.offer.length,1);assert.equal(state.offer[0].family,'ice');assert.equal(state.plasma,300);
  if(process.env.STATION_DEBUG)console.log(await page.locator('[data-home-mutation="electric"]').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {rect:r.toJSON(),pe:s.pointerEvents,z:s.zIndex,opacity:s.opacity,classes:e.className,at:document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2).map(n=>n.id||n.className),before:getComputedStyle(e.parentElement,'::before').content,after:getComputedStyle(e.parentElement,'::after').content,wardrobe:document.querySelector('#wardrobeBtn').getBoundingClientRect().toJSON()}}));
  const electricBox=await page.locator('[data-home-mutation="electric"]').boundingBox();await page.mouse.move(electricBox.x+electricBox.width/2,electricBox.y+electricBox.height/2);await page.waitForTimeout(100);
  if(process.env.STATION_DEBUG)console.log('hover',await page.locator('[data-home-mutation="electric"]').evaluate(e=>{const r=e.getBoundingClientRect();return {rect:r.toJSON(),transform:getComputedStyle(e).transform,at:document.elementsFromPoint(r.x+r.width/2,r.y+r.height/2).map(n=>n.id||n.className)}}));
  await page.mouse.click(electricBox.x+electricBox.width/2,electricBox.y+electricBox.height/2);await page.waitForTimeout(400);state=await page.evaluate(()=>window.__stationQA.state());assert.equal(state.selected,'electric');assert.equal(state.offer[0].stage,2);
  await page.locator('#foodChoices .conveyor-food-pick').click();await page.waitForFunction(()=>window.__stationQA.state().foods.length===1);await page.waitForFunction(()=>!document.getElementById('worldStartBtn').disabled,null,{timeout:10000});
  state=await page.evaluate(()=>window.__stationQA.state());assert.equal(state.foods[0].family,'electric');assert.equal(state.offer.length,0);
  await page.locator('#homeMutationPrev').click();await page.waitForTimeout(350);state=await page.evaluate(()=>window.__stationQA.state());assert.equal(state.selected,'frost');assert.equal(state.foods.length,0);assert.equal(state.offer.length,1);assert.equal(state.mastery.fire,120);
  // Laboratory choice uses the same single selection, including after a meal.
  await page.evaluate(()=>window.__stationQA.open('phantom'));await page.locator('#mutationChooseBtn').click();await page.locator('#closePanelBtn').click();await page.waitForTimeout(350);
  state=await page.evaluate(()=>window.__stationQA.state());assert.equal(state.selected,'phantom');assert.deepEqual(state.pool,['phantom']);assert.equal(state.offer[0].family,'phantom');assert(await page.locator('#homeMutationNext').isEnabled());
  if(viewport.width===390){
   await page.reload();await page.waitForFunction(()=>window.SlimeGameDebug&&window.__stationQA,null,{timeout:60000});state=await page.evaluate(()=>window.__stationQA.state());assert.equal(state.selected,'phantom');assert.equal(state.offer.length,1);assert.deepEqual(state.pool,['phantom']);
   await page.locator('#foodChoices .conveyor-food-pick').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.getElementById('worldStartBtn').disabled,null,{timeout:10000});await page.locator('#worldStartBtn').click();await page.waitForFunction(()=>document.body.dataset.screen==='drop',null,{timeout:10000});state=await page.evaluate(()=>window.__stationQA.state());assert.equal(state.run.mutation,'phantom');assert.equal(state.run.stage,2);
  }
  if(viewport.width===440){await page.evaluate(()=>window.__stationQA.fresh());assert.equal(await page.locator('#foodChoices .conveyor-food-pick').count(),0);assert(await page.locator('#worldStartBtn').isDisabled());await page.locator('#homeMutationInfo').click();assert(await page.locator('#labSynthesisPane').isVisible());}
  await page.close();
 }
 assert.deepEqual(errors,[]);await browser.close();console.log('Home station: niches at 320/390/440/desktop, centered three-medal carousel, one meal, task preservation, lab selection, keyboard feed and run launch passed.');
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
