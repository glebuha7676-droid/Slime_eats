const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__giantQA={
 prepare(stage=3){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');tutorialMemoState=null;syncInteractionLayers();clearMenuSlimeInteraction();clearMenuMutationPresentation();
 save=normalizeSave({schemaVersion:29,unlockedMutations:FORM_INDEX.map(f=>f.id),mutationLevels:{cloning:stage},activeMutationPool:['cloning'],selectedMutation:'cloning',researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false});save.tutorialStep='done';save.onboarding.enabled=false;session=null;newDraft();session.foods=[foodForMutation('cloning')];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);
 const cell=run.cellSize,template=run.blocks.find(b=>!b.hazard&&!b.special&&!b.unbreakable);run.blocks=[];
 for(let row=0;row<24;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:'qa-'+row+'-'+col,row,col,x:run.gridOffsetX+col*cell+2,y:run.blockRowOrigin+row*cell+2,w:cell-4,h:cell-4,tier:'hard',hp:4,maxHp:4,flaskTier:col%3+1,flaskValue:[1,3,5][col%3],dead:false,elementalSnow:false,elementalSnowflake:false,fireDamageAt:0,electricFlashUntil:0});
 if(stage<3)for(const b of run.blocks)if(b.row>=1&&b.row<=3&&b.col>=2&&b.col<=4)b.dead=true;
 indexRunBlocks();run.slime.x=run.gridOffsetX+3.5*cell;run.slime.y=run.blockRowOrigin+2.5*cell;run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-200;
 run.nextSporeAt=performance.now()+100000;run.elementalAbilityCharges=1;run.ultimateCharge=65;updateRunUI();renderCanvas(performance.now());this.elapsed=0;this.start=0;},
 commit(){const intro=run.ultimateIntro;run.ultimateIntro=null;this.start=performance.now();commitElementalAbility('cloning',this.start,intro.originX,intro.originY);},
 step(ms){for(let age=this.elapsed+16;age<=ms;age+=16){run.shake=Math.max(0,run.shake-.016*20);updateElementalEffects(this.start+age);updateMiniSlimes(.016,this.start+age);updateParticles(.016);}updateElementalEffects(this.start+ms);this.elapsed=ms;renderCanvas(this.start+ms);return this.state();},
 state(){const e=run.giantMushroom;return {phase:e?SPORE_COLOSSUS.pose(run,this.start+this.elapsed).phase:null,impacts:e?.impacts,route:e?.jumps.map(j=>({x:j.toX,y:j.toY})),pop:!!run.sporePop,minis:run.miniSlimes.length,projectiles:run.sporeProjectiles.length,pods:run.sporePods.length,clouds:e?.clouds.length,motes:e?.motes.length,clone:!!run.cloneUltimate,dead:run.blocks.filter(b=>b.dead).length,shake:run.shake,particles:run.particles.length,flasks:run.researchData,xp:run.experienceEarned,intro:!!run.ultimateIntro,charges:run.elementalAbilityCharges};},
 pause(ms){const e=run.giantMushroom,q=SPORE_COLOSSUS.pose(run,this.start+this.elapsed),before={phase:q.phase,x:q.x,y:q.y,impacts:e.impacts};shiftRunClock(ms);this.start+=ms;const a=SPORE_COLOSSUS.pose(run,this.start+this.elapsed);return {before,after:{phase:a.phase,x:a.x,y:a.y,impacts:e.impacts}};},
 open(){run=null;showScreen('home');selectedLaboratoryMutationId='cloning';renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},stop(){if(run)cancelAnimationFrame(run.animationId);},
 benchmark(){const at=run.giantMushroom.startedAt+2200;updateElementalEffects(at);const canvas=document.createElement('canvas');canvas.width=VIEW_W;canvas.height=VIEW_H;const c=canvas.getContext('2d');const t=performance.now();for(let i=0;i<240;i++){c.clearRect(0,0,VIEW_W,VIEW_H);SPORE_COLOSSUS.draw(c,run,at+i%160);}return {frames:240,ms:performance.now()-t};}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await p.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['cloning'],mutationLevels:{cloning:3},activeMutationPool:['cloning'],sound:false})));
 await p.goto('http://127.0.0.1:8765/?v=605');await p.waitForFunction(()=>window.SlimeGameDebug&&window.__giantQA,{timeout:60000});fs.mkdirSync('tmp/spore-605',{recursive:true});
 await p.evaluate(()=>window.__giantQA.prepare());await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});assert((await p.evaluate(()=>window.__giantQA.state())).intro);await p.evaluate(()=>window.__giantQA.commit());
 let data=await p.evaluate(()=>window.__giantQA.step(120));assert.equal(data.phase,'seed');assert.equal(data.dead,0);await p.screenshot({path:'tmp/spore-605/seed.png'});
 data=await p.evaluate(()=>window.__giantQA.step(850));assert.equal(data.phase,'growing');assert.equal(data.dead,0);await p.screenshot({path:'tmp/spore-605/growth.png'});
 data=await p.evaluate(()=>window.__giantQA.step(1200));assert.equal(data.phase,'hatching');await p.screenshot({path:'tmp/spore-605/hatch.png'});
 data=await p.evaluate(()=>window.__giantQA.step(1700));assert.equal(data.phase,'jumping');assert.equal(data.impacts,0);await p.screenshot({path:'tmp/spore-605/jump.png'});
 const pause=await p.evaluate(()=>window.__giantQA.pause(10000));assert.deepEqual(pause.after,pause.before);
 data=await p.evaluate(()=>window.__giantQA.step(2200));assert.equal(data.impacts,1);assert(data.dead>=6);assert(data.shake>3);assert(data.clouds>0);assert.equal(data.motes,24);assert(data.flasks>0&&data.xp>0);assert.equal(data.clone,false);await p.screenshot({path:'tmp/spore-605/stomp.png'});
 data=await p.evaluate(()=>window.__giantQA.step(6400));assert.equal(data.impacts,5);assert(data.dead>=12,JSON.stringify(data));assert(data.clouds<=3);assert(data.particles<=250);
 assert(data.route.every((j,i)=>i===0||j.y>data.route[i-1].y));
 assert(data.route.at(-1).y>data.route[0].y+500);
 await p.screenshot({path:'tmp/spore-605/final-stomp.png'});
 data=await p.evaluate(()=>window.__giantQA.step(7350));assert.equal(data.phase,null);assert.equal(data.charges,0);
 await p.evaluate(()=>window.__giantQA.open());await p.locator('[data-preview-stage="3"]').click();assert.equal(await p.locator('#slimeUltimateDetails h4').textContent(),'Грибной великан');assert.equal(await p.locator('#slimeUltimateDetails p').count(),1);
 await p.locator('[data-preview-stage="2"]').click();assert.equal(await p.locator('#slimeUltimateDetails p').count(),1);await p.locator('[data-preview-stage="3"]').click();assert.equal(await p.locator('#slimeUltimateDetails p').count(),1);
 await p.evaluate(()=>window.__giantQA.prepare());await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});await p.evaluate(()=>window.__giantQA.commit());
 const costs=await p.evaluate(()=>window.__giantQA.benchmark());console.log('Cached raster effect submission benchmark (not total frame/GPU time):',costs);
 await p.evaluate(()=>window.__giantQA.prepare());await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});await p.evaluate(()=>window.__giantQA.commit());await p.evaluate(()=>window.__giantQA.live());await p.waitForTimeout(3300);await p.evaluate(()=>window.__giantQA.stop());await p.screenshot({path:'tmp/spore-605/live.png'});
 for(const stage of [1,2]){
  await p.evaluate(stage=>window.__giantQA.prepare(stage),stage);await p.waitForTimeout(700);await p.locator('#abilityBtn').click({force:true});await p.evaluate(()=>{window.__giantQA.start=performance.now();});
  data=await p.evaluate(()=>window.__giantQA.step(300));
  if(stage===1){assert.equal(data.minis,6);assert(data.pop);assert(!data.clone);}
  else{data=await p.evaluate(()=>window.__giantQA.step(600));assert.equal(data.projectiles,4);data=await p.evaluate(()=>window.__giantQA.step(1800));}
  await p.screenshot({path:'tmp/spore-605/stage-'+stage+'.png'});
  data=await p.evaluate(()=>window.__giantQA.step(4200));assert(!data.pop);assert.equal(data.projectiles,0);assert(data.dead>9,'Helpers and planted spores damage real terrain');
 }
 assert.deepEqual(errors,[]);console.log('Browser giant mushroom: seed growth/hatch/jump/stomp, five independent impacts and first/second ultimates, shake, real rewards, pool bounds, pause, preview text and live frame loop passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
