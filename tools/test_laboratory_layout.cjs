const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__labQA={open(id,level=1){skipTutorial();closeOnboardingMemo(true);save.tutorialStep='done';save.onboarding.enabled=false;
 save.unlockedMutations=FORM_INDEX.map(f=>f.id);save.mutationLevels=Object.fromEntries(save.unlockedMutations.map(id=>[id,level]));save.mutationExperience=Object.fromEntries(save.unlockedMutations.map(id=>[id,level===1?580:1200]));save.mutationMastery=Object.fromEntries(save.unlockedMutations.map(id=>[id,window.SlimeMutationMastery.definitions[id].goals[0]+5]));save.researchUnits=250;session=null;newDraft();selectedLaboratoryMutationId=id;renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();$('#toast').className='toast';},admin(){closePanel();openAdminTools();},feed(){chooseFood(0);},state(){return {levels:save.mutationLevels,xp:save.mutationExperience,unlocked:save.unlockedMutations,food:session?.foods.map(f=>({stage:f.stage,family:foodRecipeFamily(f)})),visual:menuCategoryLevels()};}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8765/?v=614');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__labQA,{timeout:60000});await page.evaluate(()=>document.fonts.ready);
 fs.mkdirSync('tmp/lab-614',{recursive:true});
 const ids=['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch'];
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1280,height:1000}]){
  await page.setViewportSize(viewport);
  for(const id of ids){
   await page.evaluate(id=>window.__labQA.open(id),id);await page.waitForFunction(()=>[...document.querySelectorAll('.slime-evolution-food img')].every(i=>i.complete&&i.naturalWidth>0));await page.evaluate(()=>Promise.all([...document.querySelectorAll('.slime-evolution-food img')].map(i=>i.decode())));await page.waitForTimeout(80);
   const result=await page.evaluate(()=>{
    const pane=document.querySelector('.mutation-info-pane'),pr=pane.getBoundingClientRect();
    const nodes=['.slime-mutation-header','.slime-base-kit','.slime-evolution-track','.slime-ultimate-kit','.mutation-choose-btn'];
    return {overflow:pane.scrollHeight-pane.clientHeight,children:nodes.map(s=>{const e=pane.querySelector(s),r=e.getBoundingClientRect();return {s,left:r.left-pr.left,right:r.right-pr.right,top:r.top-pr.top,bottom:r.bottom-pr.bottom,overflow:e.scrollHeight-e.clientHeight,height:r.height}}),fx:!!pane.querySelector('.mutation-info-fx'),text:pane.querySelector('.slime-base-kit p').innerText,rootOverflow:document.querySelector('#panelContent').scrollHeight-document.querySelector('#panelContent').clientHeight};
   });
   assert(result.fx,id+' keeps its emblem effect');assert(result.text.length>20);
   assert(result.overflow<=1,JSON.stringify({viewport,id,result}));assert(result.rootOverflow<=1);
   for(const node of result.children){assert(node.left>=-1&&node.right<=1&&node.top>=-1&&node.bottom<=1,JSON.stringify({viewport,id,node}));if(!['.slime-mutation-header','.slime-evolution-track'].includes(node.s))assert(node.overflow<=1,JSON.stringify({viewport,id,node}));}
   if(['fire','phantom','glitch'].includes(id)){
    await page.waitForTimeout(250);await page.screenshot({path:`tmp/lab-614/${viewport.width}-${id}.png`});
   }
  }
 }
 await page.setViewportSize({width:390,height:844});
 for(const stage of [1,2,3]){
  await page.evaluate(stage=>window.__labQA.open('phantom',stage),stage);
  assert.equal(await page.locator('.slime-current-stage b').textContent(),['I','II','III'][stage-1]);
  assert.equal(await page.locator('.slime-evolution-food .food-mini-model').count(),3,'Food previews remain visible at every stage');
  const button=await page.locator('#mutationChooseBtn').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow,filter:getComputedStyle(e).filter}));
  assert.equal(button.bg,'rgb(16, 191, 241)');assert(button.shadow.includes('inset'));assert.equal(button.filter,'none');
  await page.locator('[data-preview-stage="2"]').click({position:{x:35,y:10}});
  assert.equal(await page.locator('#slimeUltimateDetails h4').textContent(),'Мир духов');
  assert.equal(await page.locator('.slime-current-stage b').textContent(),['I','II','III'][stage-1],'Preview never changes the owned stage');
  assert.equal(await page.locator('.slime-development-card.is-current').count(),1);
 }
 await page.evaluate(()=>window.__labQA.open('fire'));await page.locator('#mutationUpgradeBtn').click();
 assert(await page.locator('#mutationEvolutionConfirmBtn').isVisible());await page.locator('[data-evolution-cancel]').click();
 await page.locator('#labSynthesisTab').click();assert(await page.locator('#labSynthesisPane').isVisible());
 await page.locator('#labMutationsTab').click();assert(await page.locator('#labMutationsPane').isVisible());
 await page.locator('#closePanelBtn').click();await page.evaluate(()=>window.__labQA.feed());await page.waitForTimeout(1700);
 for(const stage of [1,2,3,1]){
  await page.evaluate(()=>window.__labQA.admin());await page.locator(`[data-admin-mutation-stage="${stage}"]`).click();
  const state=await page.evaluate(()=>window.__labQA.state());assert.equal(state.unlocked.length,9);assert(Object.values(state.levels).every(v=>v===stage));assert(Object.values(state.xp).every(v=>v>=580),'Existing XP survives stage presets');
  if(state.food.length)assert.equal(state.visual[state.food[0].family],stage,'Fed slime updates immediately');
 }
 await page.evaluate(()=>window.__labQA.admin());await page.waitForTimeout(450);await page.screenshot({path:'tmp/lab-614/admin.png'});
 assert.equal(await page.locator('[data-admin-mutation-stage]').count(),3);assert.deepEqual(errors,[]);
 console.log('Laboratory: all nine mutations, visible effects/text, no clipped sections at 320/390/desktop; admin I→II→III→I, XP preservation and live food cosmetics passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
