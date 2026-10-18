const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__glitchQA={
 prepare(id='glitch',stage=1){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');tutorialMemoState=null;syncInteractionLayers();clearMenuSlimeInteraction();clearMenuMutationPresentation();
 save=normalizeSave({schemaVersion:29,unlockedMutations:FORM_INDEX.map(f=>f.id),mutationLevels:{[id]:stage},activeMutationPool:[id],selectedMutation:id,researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false});save.tutorialStep='done';save.onboarding.enabled=false;session=null;newDraft();session.foods=[foodForMutation(id)];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);
 const cell=run.cellSize,origin=run.blockRowOrigin,template=run.blocks.find(b=>!b.hazard&&!b.special&&!b.unbreakable);run.blocks=[];
 for(let row=0;row<26;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:row*6+col,row,col,x:run.gridOffsetX+col*cell,y:origin+row*cell,w:cell,h:cell,tier:'hard',hp:4,maxHp:4,flaskTier:0,flaskValue:0,dead:false,hazard:false,unbreakable:false,special:null,motion:null,fireDamageAt:0,electricFlashUntil:0});
 indexRunBlocks();run.slime.x=run.gridOffsetX+3.5*cell;run.slime.y=origin+2.5*cell;run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-190;
 for(const b of run.blocks)if(b.row<4)b.dead=true;
 this.target=run.blocks.filter(b=>glitchBlockVisible(b)&&b.y+cell<=run.cameraY+VIEW_H-130&&b.y+cell/2>run.slime.y+cell*2.5&&b.col===3).at(-1);Object.assign(this.target,{hazard:true,unbreakable:true,hp:Infinity,maxHp:Infinity});
 this.off=run.blocks.find(b=>b.row===22&&b.col===3);Object.assign(this.off,{hazard:true,unbreakable:true,hp:Infinity,maxHp:Infinity});
 run.elementalAbilityCharges=1;run.ultimateCharge=65;run.glitchNextInfectionAt=Infinity;run.nanoNextShotAt=[Infinity];this.at=performance.now();this.elapsed=0;updateRunUI();renderCanvas(this.at);return {targetY:this.target.y-run.cameraY,slimeY:run.slime.y-run.cameraY,cell,view:VIEW_H};},
 capture(){this.at=run.glitchDisarm?.startedAt||performance.now();},
 step(ms){updateGlitchEffects(this.at+ms);renderCanvas(this.at+ms);return this.state();},
 state(){return {hazard:this.target.hazard,offHazard:this.off.hazard,disarming:!!this.target.glitchDisarming,special:this.target.special,vein:this.target.flaskTier,value:this.target.flaskValue,dead:this.target.dead,xp:run.experienceEarned,plasma:run.researchData,choices:!!run.glitchChoice,charges:run.elementalAbilityCharges,active:run.elementalAbilityActive};},
 base(){run.glitchNextInfectionAt=this.at;updateGlitchEffects(this.at);renderCanvas(this.at+80);updateGlitchEffects(this.at+160);renderCanvas(this.at+200);return {count:run.glitchInfectedBlocks.size,visible:[...run.glitchInfectedBlocks].every(glitchBlockVisible),gap:[...run.glitchInfectedBlocks].every(b=>b.y>=run.slime.y+run.cellSize*2.5),spikeNeutralized:!!this.target.glitchNeutralized};},
 echo(){const targets=[...run.glitchInfectedBlocks],source=targets[0];damageBlockByElement(source,1,'impact',this.at+500);renderCanvas(this.at+550);return {count:targets.length,hp:targets.map(b=>b.hp),links:run.glitchInfectedBlocks.size,offHp:this.off.hp};},
 breakEcho(){const targets=[...run.glitchInfectedBlocks];for(const b of targets)b.hp=b.maxHp=1;damageBlockByElement(targets[0],1,'impact',this.at+500);renderCanvas(this.at+550);return {count:targets.length,dead:targets.filter(b=>b.dead).length,bursts:run.glitchBreakBursts.length};},
 pause(ms){const before=run.glitchDisarm.finishAt;shiftRunClock(ms);this.at+=ms;return run.glitchDisarm.finishAt-before;},
 noTarget(){for(const b of run.blocks)b.hazard=false;return {activated:activateElementalAbility(this.at),charges:run.elementalAbilityCharges};},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},stop(){if(run)cancelAnimationFrame(run.animationId);},
 techno(){run.nanoNextShotAt=[this.at];updateNanoDrones(this.at);const first=run.nanoShots[0],next=run.nanoNextShotAt[0];updateNanoDrones(this.at+135);updateNanoDrones(next);updateNanoDrones(next+135);return {dead:first.target.dead,mines:run.nanoMines.length,interval:next-this.at};},
 open(){run=null;showScreen('home');selectedLaboratoryMutationId='glitch';renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack)});page.on('console',m=>{if(m.type()==='error')console.error(m.text())});
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await page.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['glitch'],mutationLevels:{glitch:1},activeMutationPool:['glitch'],sound:false})));
 await page.goto('http://127.0.0.1:8765/?v=611');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__glitchQA,{timeout:60000});fs.mkdirSync('tmp/glitch-609',{recursive:true});
 let geometry=await page.evaluate(()=>window.__glitchQA.prepare());assert(geometry.targetY>geometry.slimeY+geometry.cell*2);
 await page.waitForTimeout(600);await page.locator('#abilityBtn').click({force:true});await page.evaluate(()=>window.__glitchQA.capture());
 let data=await page.evaluate(()=>window.__glitchQA.step(400));assert(data.hazard&&data.disarming);assert(!data.choices);assert.equal(data.charges,0);await page.screenshot({path:'tmp/glitch-609/decoding.png'});
 assert.equal(await page.evaluate(()=>window.__glitchQA.pause(10000)),10000);
 data=await page.evaluate(()=>window.__glitchQA.step(900));assert(!data.hazard&&!data.disarming);assert(data.special==='gel'||data.vein>0);assert(data.offHazard);assert.equal(data.xp,0);assert.equal(data.plasma,0);await page.screenshot({path:'tmp/glitch-609/reward.png'});
 await page.evaluate(()=>window.__glitchQA.prepare());data=await page.evaluate(()=>window.__glitchQA.noTarget());assert.equal(data.activated,false);assert.equal(data.charges,1);
 await page.evaluate(()=>window.__glitchQA.prepare());await page.waitForTimeout(600);data=await page.evaluate(()=>window.__glitchQA.base());assert(data.count>=6&&data.count<=8&&data.visible&&data.gap&&!data.spikeNeutralized);await page.screenshot({path:'tmp/glitch-609/base.png'});
 data=await page.evaluate(()=>window.__glitchQA.echo());assert.equal(data.links,0);assert(data.hp.every(h=>h===3));await page.screenshot({path:'tmp/glitch-609/echo.png'});
 await page.evaluate(()=>window.__glitchQA.prepare());await page.waitForTimeout(600);await page.evaluate(()=>window.__glitchQA.base());data=await page.evaluate(()=>window.__glitchQA.breakEcho());assert.equal(data.dead,data.count);assert.equal(data.bursts,data.count);await page.screenshot({path:'tmp/glitch-609/break.png'});
 for(const stage of [2,3]){await page.evaluate(stage=>window.__glitchQA.prepare('glitch',stage),stage);await page.waitForTimeout(600);await page.locator('#abilityBtn').click({force:true});if(stage===2)assert((await page.evaluate(()=>window.__glitchQA.state())).choices);}
 await page.evaluate(()=>window.__glitchQA.prepare('nano',1));data=await page.evaluate(()=>window.__glitchQA.techno());assert(data.dead);assert.equal(data.mines,0);assert.equal(data.interval,1200);
 await page.evaluate(()=>window.__glitchQA.prepare());await page.waitForTimeout(600);await page.locator('#abilityBtn').click({force:true});await page.evaluate(()=>window.__glitchQA.live());await page.waitForTimeout(1700);await page.evaluate(()=>window.__glitchQA.stop());assert(!(await page.evaluate(()=>window.__glitchQA.state())).hazard);
 await page.evaluate(()=>window.__glitchQA.open());await page.locator('[data-preview-stage="1"]').click();assert.equal(await page.locator('#slimeUltimateDetails h4').textContent(),'УЛЬТА — Обезоруживание');
 assert.deepEqual(errors,[]);await browser.close();console.log('Browser: visible-only glitch base, stronger echo rendering, deep disarm/visible reward/pause, no-target charge retained, II/III routing, drone 1.2s/no mines, lab title and live frame loop passed.');
})().catch(e=>{console.error(e);process.exit(1)});
