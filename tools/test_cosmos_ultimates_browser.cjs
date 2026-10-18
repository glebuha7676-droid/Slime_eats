const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__cosmosQA={
 prepare(stage){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');tutorialMemoState=null;syncInteractionLayers();clearMenuSlimeInteraction();clearMenuMutationPresentation();
 save=normalizeSave({schemaVersion:29,unlockedMutations:FORM_INDEX.map(f=>f.id),mutationLevels:{cosmos:stage},activeMutationPool:['cosmos'],selectedMutation:'cosmos',researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false});save.tutorialStep='done';save.onboarding.enabled=false;session=null;newDraft();session.foods=[foodForMutation('cosmos')];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);
 const cell=run.cellSize,origin=run.blockRowOrigin,template=run.blocks.find(b=>!b.hazard&&!b.special&&!b.unbreakable);run.blocks=[];
 for(let row=0;row<22;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:'qa-'+row+'-'+col,row,col,x:run.gridOffsetX+col*cell,y:origin+row*cell,w:cell,h:cell,tier:'hard',hp:4,maxHp:4,flaskTier:col%3+1,flaskValue:[1,3,5][col%3],dead:false,hazard:false,unbreakable:false,special:'',fireDamageAt:0,electricFlashUntil:0});
 for(const b of run.blocks)if(b.row>=1&&b.row<=3&&b.col>=2&&b.col<=4)b.dead=true;
 indexRunBlocks();run.slime.x=run.gridOffsetX+3.5*cell;run.slime.y=run.blockRowOrigin+2.5*cell;run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-200;run.elementalAbilityCharges=1;run.ultimateCharge=65;updateRunUI();renderCanvas(performance.now());this.elapsed=0;this.at=0;},
 captureStart(){this.at=run.cosmosStagedUltimate?.startedAt||performance.now();},
 step(ms){for(let age=this.elapsed+16;age<=ms;age+=16){const at=this.at+age;updateElementalEffects(at);updateCosmosOrbits(.016,at);updateParticles(.016);updateSpecialEffects(.016,at);}updateElementalEffects(this.at+ms);this.elapsed=ms;renderCanvas(this.at+ms);return this.state();},
 state(){const e=run.cosmosStagedUltimate,b=COSMOS_ULTIMATES.orbitBoost(run,this.at+this.elapsed),p=window.SlimeCosmosOrbits.samples({...run.slime,cellSize:run.cellSize,level:elementalLevel('cosmos'),clock:run.cosmosOrbitClock,planetScale:b.scale});return {kind:e?.kind,launched:e?.launched,impacts:e?.impacts,bursts:e?.bursts.length,stars:e?.stars.length,boost:b,planets:p.length,orbit:p[0]?.orbit,planetRadius:p[0]?.radius,visible:cosmosOrbitsEnabled(this.at+this.elapsed),charges:run.elementalAbilityCharges,particles:run.particles.length,dead:run.blocks.filter(b=>b.dead).length,flasks:run.researchData,intro:!!run.ultimateIntro,comet:!!run.cosmosUltimate};},
 pause(ms){const e=run.cosmosStagedUltimate,before={started:e.startedAt,launch:e.stars[0]?.launchAt,boost:COSMOS_ULTIMATES.orbitBoost(run,this.at+this.elapsed).scale};shiftRunClock(ms);this.at+=ms;return {before,after:{started:e.startedAt,launch:e.stars[0]?.launchAt,boost:COSMOS_ULTIMATES.orbitBoost(run,this.at+this.elapsed).scale}};},
 commitComet(){const intro=run.ultimateIntro;run.ultimateIntro=null;this.at=performance.now();commitElementalAbility('cosmos',this.at,intro.originX,intro.originY);return {rows:(run.cosmosUltimate.endY-run.slime.y)/run.cellSize};},
 open(){run=null;showScreen('home');selectedLaboratoryMutationId='cosmos';renderPanel('recipes');laboratoryView='mutations';renderRecipesPanel();},
 live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},stop(){if(run)cancelAnimationFrame(run.animationId);}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await page.addInitScript(()=>localStorage.setItem('slime_feed_and_fall_save',JSON.stringify({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['cosmos'],mutationLevels:{cosmos:1},activeMutationPool:['cosmos'],sound:false})));
 await page.goto('http://127.0.0.1:8765/?v=607');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__cosmosQA);fs.mkdirSync('tmp/cosmos-607',{recursive:true});
 for(const stage of [1,2]){
  await page.evaluate(stage=>window.__cosmosQA.prepare(stage),stage);await page.waitForTimeout(700);
  let data=await page.evaluate(()=>window.__cosmosQA.state());assert.equal(data.planets,1);assert.equal(data.charges,1);
  await page.locator('#abilityBtn').click({force:true});await page.evaluate(()=>window.__cosmosQA.captureStart());
  data=await page.evaluate(()=>window.__cosmosQA.step(900));assert.equal(data.kind,stage===1?'planetBoost':'starfall');assert.equal(data.planets,1);assert(data.visible);assert.equal(data.charges,0);assert(!data.comet);
  if(stage===1){assert.equal(data.boost.damage,2);assert.equal(data.boost.scale,1.85);}else{assert.equal(data.stars,16);assert(data.launched>=4&&data.launched<=5);}
  await page.screenshot({path:'tmp/cosmos-607/stage-'+stage+'.png'});
  const pause=await page.evaluate(()=>window.__cosmosQA.pause(10000));assert.equal(pause.after.started-pause.before.started,10000);assert.equal(pause.after.boost,pause.before.boost);if(stage===2)assert.equal(pause.after.launch-pause.before.launch,10000);
  data=await page.evaluate(()=>window.__cosmosQA.step(4400));
  if(stage===1)assert(data.boost.active);else{assert.equal(data.launched,16);assert.equal(data.impacts,16);assert(data.bursts<=8);assert(data.particles<=250);}
  data=await page.evaluate(()=>window.__cosmosQA.step(5050));assert.equal(data.kind,undefined);assert.equal(data.boost.damage,1);assert(data.visible);
 }
 await page.evaluate(()=>window.__cosmosQA.prepare(3));await page.waitForTimeout(700);await page.locator('#abilityBtn').click({force:true});assert((await page.evaluate(()=>window.__cosmosQA.state())).intro);const comet=await page.evaluate(()=>window.__cosmosQA.commitComet());assert(Math.abs(comet.rows-20)<1e-6);assert(!(await page.evaluate(()=>window.__cosmosQA.state())).visible);
 await page.evaluate(()=>window.__cosmosQA.open());for(const [stage,name]of [[1,'Большая планета'],[2,'Звездопад'],[3,'Кометный прорыв']]){await page.locator('[data-preview-stage="'+stage+'"]').click();assert.equal(await page.locator('#slimeUltimateDetails h4').textContent(),name);assert.equal(await page.locator('#slimeUltimateDetails p').count(),1);}
 const compact=await page.evaluate(()=>SlimeCosmosOrbits.samples({x:0,y:0,radius:40,level:3,compact:true}).length);assert.equal(compact,1);
 await page.evaluate(()=>window.__cosmosQA.prepare(2));await page.waitForTimeout(700);await page.locator('#abilityBtn').click({force:true});await page.evaluate(()=>window.__cosmosQA.live());await page.waitForTimeout(1800);await page.evaluate(()=>window.__cosmosQA.stop());await page.screenshot({path:'tmp/cosmos-607/starfall-live.png'});
 assert.deepEqual(errors,[]);console.log('Browser cosmos: one close planet, boosted live collider, five seconds, 16 sequential single-target stars, bounded effects, pause, expiry, 20-row comet, names, compact previews and live frame loop passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
