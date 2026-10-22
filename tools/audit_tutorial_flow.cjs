const fs = require('node:fs');
const {chromium} = require('playwright');
const source = fs.readFileSync('game.js','utf8');
const hook = `window.__tutorialAudit={
 state(){const instruction=tutorialTarget(),target=instruction&&document.querySelector(instruction[0]);return {step:save.tutorialStep,instruction,level:mutationLevel('fire'),levels:save.mutationLevels,pool:save.activeMutationPool,foods:session?.foods.map(f=>f.id),offer:session?.offer.filter(Boolean).map(f=>f.id),progress:save.mutationProgress,flasks:save.researchUnits,quest:save.onboarding.quest,target:target&&{disabled:target.disabled,visible:!!target.getClientRects().length},centralPickerAllowed:tutorialInputAllowed(document.getElementById('homeMutationSelector')),monitorAllowed:tutorialInputAllowed(document.getElementById('homeMutationInfo')),toast:document.getElementById('toast').textContent};},
 firstReturn(){closeOnboardingMemo(true);closePanel();run=null;save.onboarding.firstRunFinished=true;setTutorialStep('post-run');newDraft();queueSecondTutorialGift();},
 optional(quest){closeOnboardingMemo(true);closePanel();run=null;save=normalizeSave({schemaVersion:29,tutorialStep:'done',unlockedMutations:['fire','frost'],mutationLevels:{fire:1,frost:1},activeMutationPool:['fire'],selectedMutation:'fire',researchUnits:25,onboarding:{enabled:true,firstRunFinished:true,secondRunFinished:true,controlsLearned:true,veinsLearned:true,quest},sound:false});session=null;newDraft();renderOnboardingQuest();},
 openQuest(){openOnboardingQuest();},
 legacyUpgrade(){closeOnboardingMemo(true);closePanel();run=null;save=normalizeSave({schemaVersion:29,tutorialStep:'upgrade-fire',unlockedMutations:['fire'],mutationLevels:{fire:1},mutationMastery:{fire:0},activeMutationPool:['fire'],researchUnits:50,onboarding:{enabled:true},sound:false});session=null;newDraft();selectedLaboratoryMutationId='fire';laboratoryView='mutations';renderPanel('recipes');return this.state();},
 freshSkip(){closeOnboardingMemo(true);closePanel();run=null;save=normalizeSave({schemaVersion:29,tutorialStep:'home-mutations',onboarding:{enabled:true},sound:false});session=null;newDraft();skipTutorial();return this.state();}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[],report={states:[]};page.on('pageerror',e=>{errors.push(e.message);console.log('Runtime error:',e.message);});page.on('console',m=>{if(m.type()==='error')console.log('Console:',m.text());});
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 // Isolate the tutorial audit from unrelated deleted warm-up assets. The
 // production manifest stays untouched and the missing files are reported.
 await page.route('**/js/core/boot-manifest.js*',r=>{const vm=require('node:vm'),context={window:{}};vm.runInNewContext(fs.readFileSync('js/core/boot-manifest.js','utf8'),context);const manifest=context.window.SlimeBootManifest;report.missingWarmupAssets=manifest.assets.filter(a=>!fs.existsSync(a.url)).map(a=>a.url);manifest.assets=manifest.assets.filter(a=>fs.existsSync(a.url));return r.fulfill({contentType:'application/javascript',body:'window.SlimeBootManifest='+JSON.stringify(manifest)+';'});});
 await page.goto('http://127.0.0.1:8766/');try{await page.waitForFunction(()=>window.SlimeGameDebug&&window.__tutorialAudit,null,{timeout:20000});}catch(error){console.log(await page.evaluate(()=>({debug:!!window.SlimeGameDebug,audit:!!window.__tutorialAudit,boot:document.getElementById('bootStatus').textContent,percent:document.getElementById('bootPercent').textContent,body:document.body.innerText.slice(0,1000)})));await browser.close();throw error;}
 fs.mkdirSync('outputs/tutorial-audit-652',{recursive:true});
 const snapshot=async name=>report.states.push({name,...await page.evaluate(()=>window.__tutorialAudit.state())});
 try {
  await snapshot('fresh');await page.locator('.mutation-lab-button').click();
  await page.waitForFunction(()=>window.__tutorialAudit.state().step==='gift');await page.locator('#tutorialGiftClaimBtn').click();
  await page.waitForFunction(()=>window.__tutorialAudit.state().step==='reactor');await snapshot('reactor');
  let taps=0;while((await page.evaluate(()=>window.__tutorialAudit.state())).step==='reactor'&&taps<8){await page.locator('#mutationCapsuleBtn').click();taps++;}
  report.reactorTaps=taps;await snapshot('ready-to-synthesize');
  await page.locator('#mutationSynthesizeBtn').click();await page.waitForFunction(()=>window.__tutorialAudit.state().step==='core',null,{timeout:20000});
  await page.locator('#mutationMystery').click();await page.waitForFunction(()=>window.__tutorialAudit.state().step==='prize');
  await page.locator('#mutationPrize .mutation-prize-cta').click();await page.waitForFunction(()=>window.__tutorialAudit.state().step==='fire-slot');await snapshot('fire-unlocked');
  await page.locator('[data-lab-mutation="fire"]').click();await snapshot('choose-fire');
  await page.locator('#mutationChooseBtn').click();await page.waitForFunction(()=>window.__tutorialAudit.state().step==='close-lab');await page.locator('#closePanelBtn').click();await snapshot('feed');
  await page.screenshot({path:'outputs/tutorial-audit-652/first-feed.png'});
  const food=await page.locator('.conveyor-food-pick').boundingBox(),slime=await page.locator('.console-slime-hit').boundingBox();
  await page.mouse.move(food.x+food.width/2,food.y+food.height/2);await page.mouse.down();await page.mouse.move(slime.x+slime.width/2,slime.y+slime.height/2,{steps:12});await page.mouse.up();
  await page.waitForFunction(()=>window.__tutorialAudit.state().step==='feed-count',null,{timeout:12000});await page.waitForTimeout(1100);await page.locator('#tutorialMemoNext').click();await snapshot('first-play');
 } catch(error){report.freshFlowError=error.message;await page.screenshot({path:'outputs/tutorial-audit-652/fresh-flow-block.png'});await snapshot('fresh-flow-stopped');}
 await page.evaluate(()=>window.__tutorialAudit.firstReturn());await page.waitForFunction(()=>window.__tutorialAudit.state().step==='second-feed');await snapshot('after-first-run');
 await page.evaluate(()=>window.__tutorialAudit.optional('play-frost'));await page.waitForTimeout(150);await page.screenshot({path:'outputs/tutorial-audit-652/optional-quest.png'});await page.evaluate(()=>window.__tutorialAudit.openQuest());
 report.playFrostQuestDestination=await page.evaluate(()=>({panel:!document.getElementById('panelOverlay').classList.contains('hidden'),view:document.querySelector('.mutation-lab-v2')?.dataset.view,mutation:document.querySelector('.mutation-info-pane')?.dataset.mutationId}));
 report.legacyUpgrade=await page.evaluate(()=>window.__tutorialAudit.legacyUpgrade());
 report.skip=await page.evaluate(()=>window.__tutorialAudit.freshSkip());report.errors=errors;
 fs.writeFileSync('outputs/tutorial-audit-652/audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
