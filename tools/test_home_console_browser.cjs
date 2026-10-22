const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__consoleQA={
 home(id='fire',stage=2,locked=false){if(run)cancelAnimationFrame(run.animationId);run=null;closePanel();els.resultOverlay.classList.add('hidden');tutorialMemoState=null;clearMenuMutationPresentation();
 const ids=allMutations().map(m=>m.id);save=normalizeSave({schemaVersion:29,world:1,unlockedWorlds:locked?[1]:[1,3,4],unlockedMutations:ids,mutationLevels:Object.fromEntries(ids.map(id=>[id,stage])),mutationMastery:Object.fromEntries(ids.map(id=>[id,25])),selectedMutation:id,activeMutationPool:[id],researchUnits:300,tutorialStep:'done',onboarding:{enabled:false},sound:false});session=null;newDraft();showScreen('home');renderDraft();syncInteractionLayers();},
 state(){return {selected:save.selectedMutation,pool:save.activeMutationPool,mastery:save.mutationMastery,plasma:save.researchUnits,world:carouselWorld().id,offer:session?.offer.filter(Boolean).map(f=>({id:f.id,stage:f.stage,family:foodRecipeFamily(f)})),foods:session?.foods.map(f=>({id:f.id,stage:f.stage,family:foodRecipeFamily(f)})),run:run&&{mutation:run.mutationId,stage:run.ultimateStage},busy:menuSlimeIsBusy(),transition:!!session?.offerTransition};},
 foodIds(){return FOODS.filter(food=>food.stage<=3).map(food=>food.id);},
 showFood(id){session.foods=[];session.offer=[FOODS.find(food=>food.id===id),null,null];renderDraft();window.SlimeHomeConsole.layout();},
 fresh(){closePanel();save=normalizeSave({schemaVersion:29,tutorialStep:'done',unlockedMutations:[],activeMutationPool:[],onboarding:{enabled:false},sound:false});session=null;newDraft();syncInteractionLayers();}
};`;
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 fs.mkdirSync('outputs/home-console-integration',{recursive:true});
 const errors=[],failures=[];
 const viewports=process.env.CONSOLE_NARROW?[{width:320,height:568}]:process.env.CONSOLE_QUICK?[{width:390,height:844}]:[{width:390,height:844},{width:320,height:568},{width:440,height:820},{width:467,height:634},{width:1280,height:1000}];
 for(const viewport of viewports){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400&&response.url().includes('/assets/ui/home-modular/'))failures.push(response.url());});
  await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/?v=640');
  await page.waitForFunction(()=>window.SlimeGameDebug&&window.__consoleQA,null,{timeout:60000});
  await page.evaluate(()=>window.__consoleQA.home());await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(600);
  const geometry=await page.evaluate(()=>{
   const box=id=>document.getElementById(id).getBoundingClientRect().toJSON();
   return {app:box('app'),slime:box('slime'),food:box('foodChoices'),monitor:box('homeMutationInfo'),selector:box('conveyorDispensers'),world:box('worldCarousel'),play:box('worldStartBtn'),console:box('homeConsoleBody'),overflow:document.documentElement.scrollHeight-innerHeight,
    text:[...document.querySelectorAll('#homeMutationInfo>span,#homeMutationInfo>b')].map(e=>({text:e.textContent,overflow:e.scrollWidth>e.clientWidth+1})),
    image:document.querySelector('#foodChoices img.food-model').getBoundingClientRect().toJSON(),
    menuIcons:[...document.querySelectorAll('.mutation-trio-icon img,#wardrobeBtn>img')].map(e=>({src:e.getAttribute('src'),box:e.getBoundingClientRect().toJSON(),style:{left:getComputedStyle(e).left,top:getComputedStyle(e).top,width:getComputedStyle(e).width,height:getComputedStyle(e).height,transform:getComputedStyle(e).transform}}))};
  });
  fs.writeFileSync(`outputs/home-console-integration/${viewport.width}-geometry.json`,JSON.stringify(geometry,null,2));
  await page.screenshot({path:`outputs/home-console-integration/${viewport.width}-home.png`});
  console.log('Layout',viewport, {world:[Math.round(geometry.world.width),Math.round(geometry.world.height)],playBottom:Math.round(geometry.play.bottom),overflow:geometry.overflow});
  const alignment=await page.evaluate(()=>{
   const body=document.getElementById('homeConsoleBody').getBoundingClientRect(),u=body.width/469;
   const face=document.querySelector('.console-selector-face').getBoundingClientRect();
   const visible=(selector,bounds)=>{const r=document.querySelector(selector).getBoundingClientRect(),[sw,sh,l,t,x,y]=bounds;return {left:r.left+l/sw*r.width,top:r.top+t/sh*r.height,right:r.left+x/sw*r.width,bottom:r.top+y/sh*r.height};};
   const icons=[visible('.mutation-trio-fire',[640,640,30,27,608,596]),visible('.mutation-trio-frost',[640,640,30,27,609,596]),visible('.mutation-trio-electric',[640,640,30,26,608,596])];
   const trio={left:Math.min(...icons.map(b=>b.left)),right:Math.max(...icons.map(b=>b.right)),top:Math.min(...icons.map(b=>b.top)),bottom:Math.max(...icons.map(b=>b.bottom))};
   const cap=visible('#wardrobeBtn>img',[256,256,14,22,246,218]);
   return {socketError:Math.hypot(face.left+face.width/2-body.left-234.5*u,face.top+face.height/2-body.top-96.5*u),faceWidth:face.width/u,
    menu:[[trio,'.mutation-lab-button'],[cap,'#wardrobeBtn']].map(([v,selector])=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:(v.left+v.right)/2-r.left-r.width/2,y:(v.top+v.bottom)/2-r.top-r.height*.45};})};
  });
  assert(alignment.socketError<.3&&Math.abs(alignment.faceWidth-65.52)<.2,'Emblem centered in the illustrated inner socket');
  assert(alignment.menu.every(icon=>Math.abs(icon.x)<.5&&Math.abs(icon.y)<.5),'Opaque menu icon bounds share their button content centers');
  if(process.env.CONSOLE_LAYOUT_ONLY){await page.close();continue;}
  assert.equal(await page.locator('#foodChoices .conveyor-food-pick').count(),1,'Exactly one meal offered');
  assert.equal(await page.locator('.conveyor-dispenser').count(),0,'Old three dispensers removed');
  assert(geometry.world.width>geometry.app.width*.70,'Large world display');
  assert(geometry.play.bottom<=geometry.app.bottom+1,'Play fits screen');
  assert(geometry.food.bottom<geometry.world.top,'Food and world do not overlap');
  assert(geometry.slime.top+geometry.slime.height*197/260<geometry.console.top+2,'Painted slime feet stay above console');
  assert.equal(await page.locator('.slime-ground-shadow').evaluate(e=>getComputedStyle(e).display),'none','No shadow under slime');
  assert(Math.abs(geometry.console.top+8*geometry.app.width/455-geometry.app.width*.72-geometry.app.top)<1,'Console meets pedestal floor');
  assert(geometry.console.left<geometry.app.left&&geometry.console.bottom>geometry.app.bottom,'Exterior side and bottom rim bleeds outside viewport');
  assert(Math.abs(geometry.slime.width/geometry.app.width-.74)<.01,'Smaller slime keeps its platform anchor during idle breathing');
  assert(await page.locator('.mutation-lab-button').evaluate(e=>getComputedStyle(e,'::before').backgroundImage.includes('round-menu-button-clean.webp')),'New segmented button artwork is installed');
  assert(await page.locator('#wardrobeBtn>span').evaluate(e=>parseFloat(getComputedStyle(e).webkitTextStrokeWidth)>1),'Menu labels have a base-colored outline');
  assert(geometry.overflow<=1,'No page scroll');
  assert(geometry.text.every(item=>!item.overflow),'Monitor text does not clip');
  assert(geometry.image.width>25&&geometry.image.height>25,'Food artwork has useful size');
  assert(await page.locator('#foodChoices .food-mutation-fx').evaluate(e=>getComputedStyle(e).display!=='none'),'Food mutation effect restored');
  assert(await page.locator('#worldStartBtn').isDisabled(),'Hungry action inactive');
  assert((await page.locator('#worldStartBtn').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('play-inactive'),'Inactive artwork');
  if(viewport.width===390){
   const medal=await page.locator('#homeMutationSelector').boundingBox();await page.mouse.move(medal.x+medal.width/2,medal.y+medal.height/2);await page.mouse.down();await page.waitForTimeout(130);
   assert.notEqual(await page.locator('.console-selector-face').evaluate(e=>getComputedStyle(e).transform),'none','Emblem has a physical press response');await page.mouse.up();
  }else await page.locator('#homeMutationSelector').click();
  assert(await page.locator('#homeMonitorPicker').isVisible(),'Selector opens mutations on monitor');
  assert(await page.locator('#homeMutationInfo').isHidden());
  assert.equal(await page.locator('.console-picker-heading').count(),0,'No cramped header or close button');
  assert(await page.locator('.console-mutation-grid button').evaluateAll(buttons=>buttons.every(button=>{const r=button.getBoundingClientRect();return r.width>=44&&r.height>=44;})),'Mutation targets are at least 44 pixels');
  await page.screenshot({path:`outputs/home-console-integration/${viewport.width}-picker.png`});
  await page.locator('[data-home-mutation="frost"]').click();
  assert(await page.evaluate(()=>window.__consoleQA.state().transition),'Selection is gated during synthesis');
  assert.equal(await page.locator('.console-mutation-name').textContent(),'МОРОЗ','Monitor updates immediately while old food dissolves');
  assert(await page.locator('.console-emblem-previous').count()===1,'Emblem crossfades instead of popping');
  assert(await page.locator('.console-selector-face').evaluate(e=>Math.abs(e.offsetWidth/e.parentElement.offsetWidth-.72)<.02),'Central emblem fits inner socket without covering the metal rim');
  await page.waitForFunction(()=>document.getElementById('homeSynthesisFx').classList.contains('is-active'));
  await page.waitForTimeout(300);
  await page.screenshot({path:`outputs/home-console-integration/${viewport.width}-synthesis.png`});
  await page.waitForFunction(()=>window.__consoleQA.state().selected==='frost'&&!window.__consoleQA.state().transition);
  let state=await page.evaluate(()=>window.__consoleQA.state());
  assert.equal(state.selected,'frost');assert.deepEqual(state.pool,['frost']);assert.equal(state.offer[0].family,'ice');assert.equal(state.offer.length,1);
  assert.equal(state.plasma,300);assert.equal(state.mastery.fire,25);
  assert(await page.locator('#homeMonitorPicker').isHidden(),'Choice restores task monitor');
  await page.locator('#homeMutationSelector').click();await page.keyboard.press('Escape');assert(await page.locator('#homeMonitorPicker').isHidden(),'Escape closes chooser');
  await page.locator('#worldNextBtn').click();await page.waitForTimeout(350);state=await page.evaluate(()=>window.__consoleQA.state());assert.equal(state.world,3,'World arrow changes world');
  await page.locator('#worldPrevBtn').click();await page.waitForTimeout(350);state=await page.evaluate(()=>window.__consoleQA.state());assert.equal(state.world,1);
  if(viewport.width===320){
   const food=await page.locator('#foodChoices .conveyor-food-pick').boundingBox(),slime=await page.locator('#slime').boundingBox();
   await page.mouse.move(food.x+food.width/2,food.y+food.height/2);await page.mouse.down();await page.mouse.move(food.x+food.width/2+15,food.y+food.height/2-12,{steps:3});
   assert.equal(await page.locator('.food-drag-ghost').count(),1,'One dragged food');
   assert.equal(await page.locator('#foodChoices .conveyor-food-pick').evaluate(e=>getComputedStyle(e).opacity),'0','Original food hidden during drag');
   await page.mouse.move(slime.x+slime.width/2,slime.y+slime.height/2,{steps:8});await page.mouse.up();
  }
  else {await page.locator('#foodChoices .conveyor-food-pick').focus();await page.keyboard.press('Enter');}
  await page.waitForFunction(()=>!document.getElementById('worldStartBtn').disabled,null,{timeout:20000});
  await page.waitForTimeout(420);
  const aperture=await page.locator('#launchPortal').evaluate(e=>{const r=e.getBoundingClientRect(),a=document.getElementById('app').getBoundingClientRect();return {x:(r.left-a.left)/a.width,y:(r.top-a.top)/a.width,w:r.width/a.width,h:r.height/a.width,opacity:getComputedStyle(e).opacity};});
  for(const [key,native] of Object.entries({x:354,y:186,w:318,h:330}))assert(Math.abs(aperture[key]-native/1024)<.001,`Portal ${key} matches illustrated aperture`);
  assert.equal(aperture.opacity,'1','Portal fills aperture after feeding');
  state=await page.evaluate(()=>window.__consoleQA.state());assert.equal(state.foods.length,1);assert.equal(state.foods[0].family,'ice');assert.equal(state.offer.length,0);
  assert((await page.locator('#worldStartBtn').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('play-active'),'Ready artwork');
  await page.screenshot({path:`outputs/home-console-integration/${viewport.width}-ready.png`});
  if(viewport.width===390){
   await page.locator('#slime').evaluate(e=>e.style.visibility='hidden');
   await page.screenshot({path:'outputs/home-console-integration/390-portal-aperture.png'});
   await page.locator('#slime').evaluate(e=>e.style.removeProperty('visibility'));
  }
  if(viewport.width===440){
   await page.locator('#homeMutationSelector').click();await page.locator('[data-home-mutation="electric"]').click();
   await page.waitForFunction(()=>window.__consoleQA.state().selected==='electric'&&!window.__consoleQA.state().transition);
   state=await page.evaluate(()=>window.__consoleQA.state());assert.equal(state.foods.length,0,'Changing mutation replaces eaten meal');assert.equal(state.offer.length,1);assert.equal(state.mastery.frost,25);
   await page.evaluate(()=>{window.__consoleQA.home('phantom',3);});await page.waitForTimeout(150);
   assert((await page.locator('#homeMutationInfo').textContent()).includes('Все стадии открыты'),'Stage III completed state');
  }
  if(viewport.width===320){
   await page.evaluate(()=>window.__consoleQA.home());await page.waitForTimeout(100);
   for(const id of ['electric','cosmos','nano','telekinesis','cloning','phantom','glitch','fire']){
    await page.locator('#homeMutationSelector').click();await page.locator(`[data-home-mutation="${id}"]`).click();
    await page.waitForFunction(id=>window.__consoleQA.state().selected===id&&!window.__consoleQA.state().transition,id);
    const fits=await page.locator('#homeMutationInfo').evaluate(e=>[...e.children].every(child=>child.scrollWidth<=child.clientWidth+1&&child.getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom+1));
    if(!fits){await page.screenshot({path:`outputs/home-console-integration/320-${id}-overflow.png`});console.log(await page.locator('#homeMutationInfo').evaluate(e=>({box:e.getBoundingClientRect().toJSON(),children:[...e.children].map(child=>({text:child.textContent,scrollWidth:child.scrollWidth,width:child.clientWidth,height:child.clientHeight,bottom:child.getBoundingClientRect().bottom}))})));}
    assert(fits,`Monitor fits ${id} at 320px`);
   }
  }
  if(viewport.width===390){
   await page.reload();await page.waitForFunction(()=>window.SlimeGameDebug&&window.__consoleQA,null,{timeout:60000});await page.waitForTimeout(200);
   state=await page.evaluate(()=>window.__consoleQA.state());assert.equal(state.selected,'frost');assert.deepEqual(state.pool,['frost']);assert.equal(state.foods.length,1,'Meal restored');
   const play=await page.locator('#worldStartBtn').boundingBox();await page.mouse.move(play.x+play.width/2,play.y+play.height/2);await page.mouse.down();await page.waitForTimeout(130);
   assert.notEqual(await page.locator('#worldStartBtn').evaluate(e=>getComputedStyle(e).transform),'none','Button physically depresses');
   await page.mouse.up();await page.waitForFunction(()=>document.body.dataset.screen==='drop',null,{timeout:15000});
   state=await page.evaluate(()=>window.__consoleQA.state());assert.equal(state.run.mutation,'frost');assert.equal(state.run.stage,2);
   await page.evaluate(()=>window.__consoleQA.home('fire',2,true));await page.waitForTimeout(250);await page.locator('#worldNextBtn').click();await page.waitForTimeout(350);
   assert(await page.locator('#worldCarousel').evaluate(e=>e.classList.contains('locked')),'Locked world stays locked');assert(await page.locator('#worldStartBtn').isDisabled());
   assert(await page.locator('.world-terminal-title').isHidden(),'Locked world has no empty meter badge');
   assert((await page.locator('#worldCarousel').evaluate(e=>getComputedStyle(e).clipPath)).includes('29.3%'),'World image follows stepped bezel under heading');
   await page.screenshot({path:'outputs/home-console-integration/390-locked.png'});
   await page.evaluate(()=>window.__consoleQA.fresh());await page.waitForTimeout(250);assert.equal(await page.locator('#foodChoices .conveyor-food-pick').count(),0);assert(await page.locator('#worldStartBtn').isDisabled());
   await page.locator('#homeMutationInfo').click();assert(await page.locator('#labSynthesisPane').isVisible(),'Empty save opens synthesis');
   await page.evaluate(()=>window.__consoleQA.home());
   const foodIds=await page.evaluate(()=>window.__consoleQA.foodIds());
   for(const id of foodIds){
    const fits=await page.evaluate(id=>{
     window.__consoleQA.showFood(id);const button=document.querySelector('#foodChoices .conveyor-food-pick'),image=button.querySelector('.food-model'),b=button.getBoundingClientRect(),r=image.getBoundingClientRect(),[width,height,left,top,right,bottom]=window.SlimeFoodGroundBounds[id];
     const visible={left:r.left+left/width*r.width,right:r.left+right/width*r.width,top:r.top+top/height*r.height,bottom:r.top+bottom/height*r.height};
     const device=document.getElementById('homeConsoleBody').getBoundingClientRect(),u=device.width/469;
     return visible.left>=b.left-1&&visible.right<=b.right+1&&Math.abs(visible.top-b.top)<1&&Math.abs(visible.bottom-(device.top+157*u))<1&&Math.abs((visible.bottom-visible.top)-82*u)<1;
    },id);assert(fits,`Visible food ${id} fits chamber and common shelf baseline`);
   }
   await page.evaluate(()=>window.__consoleQA.home());await page.waitForTimeout(100);
   const cancelFood=await page.locator('#foodChoices .conveyor-food-pick').boundingBox();await page.mouse.move(cancelFood.x+cancelFood.width/2,cancelFood.y+cancelFood.height/2);await page.mouse.down();await page.mouse.move(cancelFood.x+cancelFood.width/2+16,cancelFood.y+cancelFood.height/2-12,{steps:3});
   assert.equal(await page.locator('#foodChoices .conveyor-food-pick').evaluate(e=>getComputedStyle(e).opacity),'0');
   await page.mouse.move(5,300,{steps:5});await page.mouse.up();await page.waitForTimeout(300);
   assert.equal(await page.locator('.food-drag-ghost').count(),0,'Cancelled drag removes copy');assert.equal(await page.locator('#foodChoices .conveyor-food-pick').evaluate(e=>getComputedStyle(e).opacity),'1','Cancelled drag restores original');assert.equal((await page.evaluate(()=>window.__consoleQA.state())).foods.length,0);
  }
  await page.close();
 }
 assert.deepEqual(errors,[],'No runtime errors');assert.deepEqual(failures,[],'All new artwork loaded');
 await browser.close();console.log('Console integration passed: responsive layout, monitor chooser, one meal, world selection, inactive/ready/press states, save restore and run launch.');
})().catch(async error=>{console.error(error);await browser?.close();process.exitCode=1;});
