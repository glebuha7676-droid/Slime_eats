const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const game=fs.readFileSync(path.join(root,'game.js'),'utf8');
const hook=`window.__singleSlimeQA={normalizeSave,chooseFood,startDrop,endRun,newDraft,renderRecipesPanel,renderWalletBalances,upgradeMutation,prepareHomeRewardFlight,settleHomeRewardFlight,restoreTutorial,closeOnboardingMemo,
 setFixture(value){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');syncInteractionLayers();settleHomeRewardFlight();clearMenuMutationPresentation();save=normalizeSave(value);session=null;newDraft();},
 setRunXP(xp){run.experienceEarned=xp;},learnVeins(){save.onboarding.veinsLearned=true;},freeze(){cancelAnimationFrame(run.animationId);run.paused=true;},
 openMutation(id){renderPanel('recipes');selectedLaboratoryMutationId=id;laboratoryView='mutations';renderRecipesPanel();},
 state(){return {save:structuredClone(save),foods:session?.foods.map(f=>({id:f.id,stage:f.stage,family:foodRecipeFamily(f)})),offer:session?.offer.map(f=>f&&({id:f.id,stage:f.stage})),visual:menuCategoryLevels(),run:run&&{mutationId:run.mutationId,passiveLevels:run.passiveLevels,categoryVisuals:run.categoryVisuals,ability:run.elementalAbilityType,experienceBefore:run.experienceBefore,experienceAfter:run.experienceAfter}};}};
`;
const ids=['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch'];
const fixture={schemaVersion:29,unlockedMutations:ids,mutationLevels:Object.fromEntries(ids.map(id=>[id,1])),mutationExperience:Object.fromEntries(ids.map(id=>[id,0])),selectedMutation:'fire',activeMutationPool:['fire','frost','phantom'],researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false,world:1,unlockedWorlds:[1]};
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-timer-throttling']});
 const context=await browser.newContext({viewport:{width:1280,height:1000},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/game.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:game.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await page.addInitScript(v=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify(v)),fixture);
 await page.goto('http://127.0.0.1:8765/?v=592',{waitUntil:'load'});
 await page.waitForFunction(()=>window.SlimeGameDebug&&document.getElementById('bootScreen').dataset.state!=='error',{timeout:60000});
 await page.waitForTimeout(800);
 for(const id of ids){
  const data={...fixture,selectedMutation:id,activeMutationPool:[id]};
  await page.evaluate(v=>window.__singleSlimeQA.setFixture(v),data);
  await page.evaluate(()=>window.__singleSlimeQA.chooseFood(0));
  await page.waitForTimeout(1900);
  let state=await page.evaluate(()=>window.__singleSlimeQA.state());
  assert.equal(state.foods.length,1);assert.equal(state.visual[id],1);
  assert.ok(state.offer.every(f=>!f),'One dish finishes preparation');
  await page.evaluate(()=>window.__singleSlimeQA.startDrop());
  await page.waitForTimeout(120);
  await page.evaluate(()=>window.__singleSlimeQA.freeze());
  state=await page.evaluate(()=>window.__singleSlimeQA.state());
  assert.equal(state.run.mutationId,id);assert.equal(state.run.ability,id);assert.equal(state.run.passiveLevels[id],2);assert.equal(state.run.categoryVisuals[id],1);
  await page.evaluate(()=>{window.__singleSlimeQA.setRunXP(30);window.__singleSlimeQA.endRun(false,'QA');});
  state=await page.evaluate(()=>window.__singleSlimeQA.state());
  assert.equal(state.save.mutationExperience[id],30);assert.ok(ids.filter(other=>other!==id).every(other=>state.save.mutationExperience[other]===0));
 }
 console.log('All nine stage-I slimes: single dish, two base powers, ultimate, personal reward ownership passed');
 await page.evaluate(v=>window.__singleSlimeQA.setFixture(v),{...fixture,mutationLevels:{fire:2,frost:1,phantom:3},mutationExperience:{fire:1000,frost:0,phantom:2200}});
 let state=await page.evaluate(()=>window.__singleSlimeQA.state());assert.equal(state.offer[0].stage,2);assert.equal(state.offer[2].stage,3);
 await page.waitForTimeout(1300);await page.screenshot({path:path.join(root,'tmp/single-slime-home-desktop.png')});
 await page.evaluate(()=>window.__singleSlimeQA.openMutation('fire'));
 await page.waitForTimeout(700);
 await page.screenshot({path:path.join(root,'tmp/single-slime-lab-desktop.png')});
 assert.equal(await page.locator('#mutationUpgradeBtn').isEnabled(),false,'Insufficient personal XP blocks evolution');
 await page.evaluate(v=>window.__singleSlimeQA.setFixture(v),{...fixture,mutationExperience:{fire:500}});
 await page.evaluate(()=>window.__singleSlimeQA.openMutation('fire'));
 await page.locator('#mutationUpgradeBtn').click();await page.waitForTimeout(1600);
 state=await page.evaluate(()=>window.__singleSlimeQA.state());assert.equal(state.save.mutationLevels.fire,2);assert.equal(state.save.mutationExperience.fire,500);assert.equal(state.save.researchUnits,350);assert.equal(state.offer[0].stage,2);
 const migrated=await page.evaluate(v=>window.__singleSlimeQA.normalizeSave(v),{...fixture,schemaVersion:28,playerExperience:10000,mutationExperience:undefined,mutationLevels:{fire:3,frost:2,phantom:1},unlockedWorlds:[1,3],worldBest:{1:500}});
 assert.equal(migrated.mutationExperience.fire,2000);assert.equal(migrated.mutationExperience.frost,500);assert.equal(migrated.mutationExperience.phantom,0);assert.equal(migrated.researchUnits,400);assert.ok(migrated.unlockedWorlds.includes(3));assert.ok(!Object.hasOwn(migrated,'playerExperience'));
 console.log('Actual save migration, stage-specific dishes, XP gate and paid evolution passed');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(v=>window.__singleSlimeQA.setFixture(v),{...fixture,mutationLevels:{fire:2,frost:1,phantom:3},mutationExperience:{fire:1000,frost:0,phantom:2200}});
 await page.waitForTimeout(450);await page.screenshot({path:path.join(root,'tmp/single-slime-home-mobile.png')});
 await page.evaluate(()=>window.__singleSlimeQA.openMutation('phantom'));await page.waitForTimeout(650);await page.screenshot({path:path.join(root,'tmp/single-slime-lab-mobile.png')});
 const widths=await page.evaluate(()=>({window:innerWidth,document:document.documentElement.scrollWidth,panel:document.getElementById('panelContent').clientWidth,content:document.getElementById('panelContent').scrollWidth}));assert.ok(widths.document<=widths.window+1);assert.ok(widths.content<=widths.panel+1);
 // Result progress and home flight are both presentation; reward is already saved exactly once.
 await page.evaluate(v=>window.__singleSlimeQA.setFixture(v),{...fixture,mutationExperience:{fire:480}});
 await page.evaluate(()=>window.__singleSlimeQA.chooseFood(0));await page.waitForTimeout(1800);
 await page.evaluate(()=>window.__singleSlimeQA.startDrop());await page.waitForTimeout(100);
 await page.evaluate(()=>{window.__singleSlimeQA.freeze();window.__singleSlimeQA.setRunXP(60);window.__singleSlimeQA.endRun(false,'QA');});
 await page.waitForTimeout(2700);await page.screenshot({path:path.join(root,'tmp/single-slime-result-mobile.png')});
 assert.ok((await page.locator('#resultSlimeProgress').innerText()).includes('540 / 500'));
 await page.locator('#continueBtn').click();await page.waitForTimeout(2600);
 assert.equal((await page.evaluate(()=>window.__singleSlimeQA.state())).save.mutationExperience.fire,540);
 assert.ok((await page.locator('#playerLevelExperience').innerText()).includes('ГОТОВ'));
 assert.equal(await page.locator('#conveyorChoiceCount').count(),0);
 await page.evaluate(v=>window.__singleSlimeQA.setFixture(v),{...fixture,activeMutationPool:['fire'],selectedMutation:'fire',tutorialStep:'feed',onboarding:{enabled:true}});
 await page.evaluate(()=>window.__singleSlimeQA.chooseFood(0));await page.waitForTimeout(2100);
 assert.equal((await page.evaluate(()=>window.__singleSlimeQA.state())).save.tutorialStep,'feed-count');
 assert.ok((await page.locator('#tutorialMemoContent').innerText()).includes('Способности уже доступны'));
 await page.locator('#tutorialMemoNext').click();
 await page.evaluate(()=>window.__singleSlimeQA.startDrop());await page.waitForTimeout(100);
 await page.evaluate(()=>{window.__singleSlimeQA.freeze();window.__singleSlimeQA.setRunXP(30);window.__singleSlimeQA.endRun(true,'QA');});
 await page.waitForTimeout(2600);await page.locator('#continueBtn').click();await page.waitForTimeout(2700);
 assert.equal((await page.evaluate(()=>window.__singleSlimeQA.state())).save.tutorialStep,'second-feed');
 await page.evaluate(()=>window.__singleSlimeQA.chooseFood(0));await page.waitForTimeout(1800);
 assert.equal((await page.evaluate(()=>window.__singleSlimeQA.state())).save.tutorialStep,'second-play');
 await page.evaluate(()=>window.__singleSlimeQA.startDrop());await page.waitForTimeout(100);
 await page.evaluate(()=>{window.__singleSlimeQA.freeze();window.__singleSlimeQA.learnVeins();window.__singleSlimeQA.setRunXP(40);window.__singleSlimeQA.endRun(true,'QA');});
 const tutorialSave=(await page.evaluate(()=>window.__singleSlimeQA.state())).save;
 assert.equal(tutorialSave.tutorialStep,'done');assert.equal(tutorialSave.onboarding.quest,'unlock-frost');assert.equal(tutorialSave.mutationLevels.fire,1,'Teaching no longer forces an evolution');
 console.log('Both tutorial preparations use one meal and reach optional progression without forced mixing or evolution');
 assert.deepEqual(errors,[]);
 console.log('Desktop/mobile panels, no horizontal overflow, result progress and reward flight without duplicate XP passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
