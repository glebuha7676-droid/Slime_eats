const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'game.js'),'utf8');
// This helper exists only in an isolated Playwright response, never in shipped game.js.
const hook=`window.__elementalQA={
 prepare(id,stage){
  if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');tutorialMemoState=null;syncInteractionLayers();clearMenuSlimeInteraction();clearMenuMutationPresentation();
  save=normalizeSave({schemaVersion:29,unlockedMutations:FORM_INDEX.map(f=>f.id),mutationLevels:{[id]:stage},activeMutationPool:[id],selectedMutation:id,researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false});
  session=null;newDraft();session.foods=[foodForMutation(id)];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);
  const cell=run.cellSize,template=run.blocks.find(b=>!b.hazard&&!b.special&&!b.unbreakable);run.blocks=[];
  for(let row=0;row<18;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:'qa-'+row+'-'+col,row,col,x:run.gridOffsetX+col*cell+2,y:run.blockRowOrigin+row*cell+2,w:cell-4,h:cell-4,tier:'hard',hp:4,maxHp:4,flaskTier:col%3+1,flaskValue:[1,3,5][col%3],dead:false,elementalSnow:false,elementalSnowflake:false,fireDamageAt:0,electricFlashUntil:0});
  indexRunBlocks();run.slime.x=run.gridOffsetX+3.5*cell;run.slime.y=id==='electric'?run.blocks.find(b=>b.row===2&&b.col===3).y+(cell-4)/2:run.blockRowOrigin+2.5*cell;run.cameraY=run.slime.y-200;run.slime.vx=run.slime.vy=0;
  run.elementalAbilityCharges=1;run.ultimateCharge=65;updateRunUI();renderCanvas(performance.now());
 },
 step(ms){const at=(run.stagedUltimate?.startedAt||run.ultimateIntro?.startedAt||this.at)+ms;this.at=run.stagedUltimate?.startedAt||this.at;if(run.ultimateIntro){const i=run.ultimateIntro;run.ultimateIntro=null;commitElementalAbility(i.type,at,i.originX,i.originY);this.at=at;}else updateElementalEffects(at);renderCanvas(at);return this.state();},
 dischargeInfo(){const e=run.stagedUltimate;return {origin:{x:e.x,y:e.y},cell:run.cellSize,targets:e.dischargeTargets?.map(t=>({row:t.block.row,col:t.block.col,d:t.distance})),hits:e.hitAt.size,slime:{x:run.slime.x,y:run.slime.y}};},
 state(){return {kind:run.stagedUltimate?.kind,startedAt:run.stagedUltimate?.startedAt,charges:run.elementalAbilityCharges,active:run.elementalAbilityActive,rocks:run.stagedUltimate?.rocks.map(r=>({y:r.y,landed:r.landed})),bolts:run.stagedUltimate?.bolts.length,storm:!!run.electricStorm,phoenix:!!run.phoenixUltimate,blizzard:!!run.frostStorm,snow:run.blocks.filter(b=>b.elementalSnow).length,burning:run.blocks.filter(b=>b.fireDamageAt).length,hurt:run.blocks.filter(b=>b.hp<4).length,veins:run.blocks.filter(b=>b.elementalSnow).every(b=>b.flaskValue===[1,3,5][b.flaskTier-1]),y:run.stagedUltimate?.y,endY:run.stagedUltimate?.endY};},
 firePair(){this.prepare('fire',1);for(const b of run.blocks)b.dead=true;const source=run.blocks.find(b=>b.row===6&&b.col===2),target=run.blocks.find(b=>b.row===6&&b.col===3);Object.assign(source,{dead:false,hp:1});Object.assign(target,{dead:false,hp:4,fireDamageAt:0});run.specialEffects=[];run.particles=[];indexRunBlocks();this.fireAt=performance.now();igniteBlock(source,this.fireAt);this.fireAt+=1200;updateBurningBlocks(this.fireAt);return {dead:source.dead,ticks:target.fireTicksLeft,transfer:run.specialEffects.filter(e=>e.type==='fireTransfer').length};},
 fireFrame(ms){const at=this.fireAt+ms;updateBurningBlocks(at);updateSpecialEffects(0,at);renderCanvas(at);return {life:run.specialEffects.find(e=>e.type==='fireTransfer')?.life,target:run.blocks.find(b=>b.row===6&&b.col===3).fireDamageAt};},
 firePause(ms){const target=run.blocks.find(b=>b.row===6&&b.col===3),before=target.fireDamageAt;shiftRunClock(ms);this.fireAt+=ms;return {before,after:target.fireDamageAt};},
 open(id){run=null;showScreen('home');selectedLaboratoryMutationId=id;renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();},
 pause(ms){const e=run.stagedUltimate,y=e.y;shiftRunClock(ms);updateElementalEffects(e.startedAt+500);return {before:y,after:e.y};}
};
`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await page.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['fire'],mutationLevels:{fire:1},activeMutationPool:['fire'],sound:false})));
 await page.goto('http://127.0.0.1:8765/?v=606');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__elementalQA,{timeout:60000});
 fs.mkdirSync(path.join(root,'tmp/elemental-606'),{recursive:true});
 for(const id of ['fire','frost','electric'])for(const stage of [1,2,3]){
  await page.evaluate(([id,stage])=>window.__elementalQA.prepare(id,stage),[id,stage]);
  await page.waitForTimeout(700); // Let the existing screen transition finish before visual checks.
  await page.locator('#abilityBtn').click({force:true});
  const expected=await page.evaluate(([id,stage])=>window.SlimeUltimateStages.get(id,stage),[id,stage]);
  const initial=await page.evaluate(()=>window.__elementalQA.state());assert.equal(initial.charges,0);
  if(stage<3){assert.equal(initial.kind,expected.kind);assert.equal(initial.storm,false);assert.equal(initial.phoenix,false);assert.equal(initial.blizzard,false);}
  else{const state=await page.evaluate(()=>window.__elementalQA.step(900));assert.equal(state[id==='fire'?'phoenix':id==='frost'?'blizzard':'storm'],true);continue;}
  if(stage===1){
   if(id==='fire')assert(initial.burning>8);if(id==='frost'){assert(initial.snow>8);assert(initial.veins);}if(id==='electric'){assert.equal(initial.bolts,4);assert.equal(initial.hurt,1,JSON.stringify(await page.evaluate(()=>window.__elementalQA.dischargeInfo())));const near=await page.evaluate(()=>window.__elementalQA.step(65));assert(near.hurt>1);const middle=await page.evaluate(()=>window.__elementalQA.step(130));assert(middle.hurt>near.hurt);await page.screenshot({path:path.join(root,'tmp/elemental-606/electric-1-growing.png')});const full=await page.evaluate(()=>window.__elementalQA.step(260));assert(full.hurt>middle.hurt);}
   await page.evaluate(()=>window.__elementalQA.step(260));
   await page.screenshot({path:path.join(root,'tmp/elemental-606',id+'-1.png')});
  }else{
   const mid=await page.evaluate(()=>window.__elementalQA.step(500));
   await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete),{timeout:20000});await page.waitForTimeout(100);
   await page.evaluate(()=>window.__elementalQA.step(500));
   await page.screenshot({path:path.join(root,'tmp/elemental-606',id+'-2-mid.png')});
   if(id==='fire'){assert.equal(mid.rocks.length,4);const landed=await page.evaluate(()=>window.__elementalQA.step(1750));assert(landed.rocks.every(r=>r.landed));assert(landed.burning>8);}
   if(id==='frost'){assert(mid.snow>0);const end=await page.evaluate(()=>window.__elementalQA.step(1250));assert.equal(end.snow,21);assert(end.veins);}
   if(id==='electric'){assert(mid.hurt>0);assert(mid.bolts<=2);const paused=await page.evaluate(()=>window.__elementalQA.pause(10000));assert.equal(paused.after,paused.before);}
  }
 }
 for(const id of ['fire','frost','electric']){
  await page.evaluate(id=>window.__elementalQA.prepare(id,3),id);await page.evaluate(id=>window.__elementalQA.open(id),id);
  for(const stage of [1,2,3]){await page.locator('[data-preview-stage="'+stage+'"]').click();const title=await page.locator('#slimeUltimateDetails h4').textContent();const expected=await page.evaluate(([id,stage])=>window.SlimeUltimateStages.get(id,stage).name,[id,stage]);assert.equal(title,expected);assert.equal(await page.locator('#slimeUltimateDetails p').count(),1);}
 }
 const fire=await page.evaluate(()=>window.__elementalQA.firePair());await page.waitForTimeout(700);assert(fire.dead);assert.equal(fire.ticks,3);assert.equal(fire.transfer,1);
 for(const ms of [60,140,250]){await page.evaluate(ms=>window.__elementalQA.fireFrame(ms),ms);await page.screenshot({path:path.join(root,'tmp/elemental-606/fire-transfer-'+ms+'.png')});}
 const fp=await page.evaluate(()=>window.__elementalQA.firePause(10000));assert.equal(fp.after-fp.before,10000);
 const end=await page.evaluate(()=>window.__elementalQA.fireFrame(550));assert.equal(end.life,undefined,'Transfer disappears on its real-time clock');
 assert.deepEqual(errors,[]);console.log('Browser: six effects render, real block burning/freezing/damage, original vein values, four rocks, 50m snow lane, pause, III legacy abilities and nine names without descriptions passed');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
