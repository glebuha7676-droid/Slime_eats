const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__technoQA={
 prepare(stage){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');tutorialMemoState=null;syncInteractionLayers();clearMenuSlimeInteraction();clearMenuMutationPresentation();
 save=normalizeSave({schemaVersion:29,unlockedMutations:FORM_INDEX.map(f=>f.id),mutationLevels:{nano:stage},activeMutationPool:['nano'],selectedMutation:'nano',researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false});save.tutorialStep='done';save.onboarding.enabled=false;session=null;newDraft();session.foods=[foodForMutation('nano')];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);
 const cell=run.cellSize,template=run.blocks.find(b=>!b.hazard&&!b.special&&!b.unbreakable);run.blocks=[];
 for(let row=0;row<24;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:'qa-'+row+'-'+col,row,col,x:run.gridOffsetX+col*cell+2,y:run.blockRowOrigin+row*cell+2,w:cell-4,h:cell-4,tier:'hard',hp:4,maxHp:4,flaskTier:col%3+1,flaskValue:[1,3,5][col%3],dead:false,elementalSnow:false,elementalSnowflake:false,fireDamageAt:0,electricFlashUntil:0});
 indexRunBlocks();run.slime.x=run.gridOffsetX+3.5*cell;run.slime.y=run.blockRowOrigin+2.5*cell;run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-200;
 run.nanoNextShotAt=[performance.now()+100000];run.nanoNextMineAt=performance.now()+100000;run.elementalAbilityCharges=1;run.ultimateCharge=65;updateRunUI();renderCanvas(performance.now());this.elapsed=0;this.start=0;},
 step(ms){this.start=this.start||run.technoUltimate?.startedAt||run.ultimateIntro?.startedAt||performance.now();
  if(run.ultimateIntro){const i=run.ultimateIntro;run.ultimateIntro=null;commitElementalAbility('nano',this.start,i.originX,i.originY);}
  for(let age=this.elapsed+16;age<=ms;age+=16)updateElementalEffects(this.start+age);if(run.mechSuit)updatePhysics(0,this.start+ms);updateElementalEffects(this.start+ms);this.elapsed=ms;renderCanvas(this.start+ms);return this.state();},
 state(){const e=run.technoUltimate;return {kind:e?.kind,mines:e?.mines.map(m=>({target:m.target?.id,launched:m.launched})),phase:e?.phase,shots:e?.shotsFired,bullets:e?.bullets.map(b=>({from:[b.fromX,b.fromY],to:[b.toX,b.toY],hit:b.target.dead})),angle:e?.angle,landingDead:e?.landingTarget?.dead,activeMs:e?e.activeUntil-e.landAt:0,dead:run.blocks.filter(b=>b.dead).length,hurt:run.blocks.filter(b=>b.hp<4).length,dissolves:run.nanoDisintegrations.length,flasks:run.researchData,xp:run.experienceEarned,mech:run.mechSuit?.phase,charges:run.elementalAbilityCharges,intro:!!run.ultimateIntro};},
 pause(ms){const e=run.technoUltimate,angle=e.angle,end=e.activeUntil,shots=e.shotsFired;shiftRunClock(ms);this.start+=ms;return {angleBefore:angle,angleAfter:e.angle,remainingBefore:end-(this.start-ms+this.elapsed),remainingAfter:e.activeUntil-(this.start+this.elapsed),shotsBefore:shots,shotsAfter:e.shotsFired};},
 open(){run=null;showScreen('home');selectedLaboratoryMutationId='nano';renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},stop(){if(run)cancelAnimationFrame(run.animationId);}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await p.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['nano'],mutationLevels:{nano:1},activeMutationPool:['nano'],sound:false})));
 await p.goto('http://127.0.0.1:8765/?v=603');await p.waitForFunction(()=>window.SlimeGameDebug&&window.__technoQA,{timeout:60000});fs.mkdirSync('tmp/techno-603',{recursive:true});
 await p.evaluate(()=>window.__technoQA.prepare(1));await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});
 let data=await p.evaluate(()=>window.__technoQA.state());assert.equal(data.kind,'mineSalvo');assert.equal(data.mines.length,5);assert.equal(new Set(data.mines.map(m=>m.target)).size,5);assert.equal(data.mech,undefined);assert.equal(data.intro,false);
 await p.evaluate(()=>window.__technoQA.step(520));await p.screenshot({path:'tmp/techno-603/mines.png'});
 data=await p.evaluate(()=>window.__technoQA.step(1600));assert.equal(data.mines.length,0);assert(data.hurt>=5);assert.equal(data.charges,0);
 await p.evaluate(()=>window.__technoQA.prepare(2));await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});
 data=await p.evaluate(()=>window.__technoQA.step(450));assert.equal(data.phase,'descending');assert.equal(data.dead,0);await p.screenshot({path:'tmp/techno-603/descending.png'});
 data=await p.evaluate(()=>window.__technoQA.step(800));assert(data.landingDead);assert(data.dissolves>0);assert.equal(data.activeMs,5000);await p.screenshot({path:'tmp/techno-603/landing.png'});
 data=await p.evaluate(()=>window.__technoQA.step(1150));assert(data.shots>0);assert(data.bullets.length>0&&data.bullets.length<=2);await p.screenshot({path:'tmp/techno-603/shooting.png'});
 const paused=await p.evaluate(()=>window.__technoQA.pause(10000));assert.equal(paused.angleAfter,paused.angleBefore);assert.equal(paused.remainingAfter,paused.remainingBefore);assert.equal(paused.shotsAfter,paused.shotsBefore);
 data=await p.evaluate(()=>window.__technoQA.step(5900));assert.equal(data.phase,'exiting');assert(data.shots>=16);assert(data.dead>=16);assert(data.flasks>0);assert(data.xp>0);assert(data.dissolves<=12);
 data=await p.evaluate(()=>window.__technoQA.step(6250));assert.equal(data.kind,undefined);assert.equal(data.charges,0);
 await p.evaluate(()=>window.__technoQA.prepare(3));await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});assert.equal((await p.evaluate(()=>window.__technoQA.state())).intro,true);
 data=await p.evaluate(()=>window.__technoQA.step(1300));assert.equal(data.kind,undefined);assert.equal(data.mech,'active');
 await p.evaluate(()=>window.__technoQA.open());
 for(const [stage,title]of [[1,'Минный залп'],[2,'Турель'],[3,'Титан']]){await p.locator('[data-preview-stage="'+stage+'"]').click();assert.equal(await p.locator('#slimeUltimateDetails h4').textContent(),title);assert.equal(await p.locator('#slimeUltimateDetails p').count(),1);}
 // Real frame loop, independent of the controlled visual fixture clock.
 await p.evaluate(()=>window.__technoQA.prepare(2));await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});await p.evaluate(()=>window.__technoQA.live());await p.waitForTimeout(2000);await p.evaluate(()=>window.__technoQA.stop());
 assert.deepEqual(errors,[]);console.log('Browser techno: five mines, descending/landing/separate rotating turret, real disintegration+XP+flasks, 5-second firing, pause, live loop, Titan and three titles without descriptions passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
