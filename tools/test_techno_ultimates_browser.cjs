const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const source = fs.readFileSync('game.js','utf8');
const hook = `window.__drillQA={
 prepare(stage){if(run)cancelAnimationFrame(run.animationId);run=null;els.resultOverlay.classList.add('hidden');els.panelOverlay.classList.add('hidden');tutorialMemoState=null;syncInteractionLayers();clearMenuSlimeInteraction();clearMenuMutationPresentation();
 save=normalizeSave({schemaVersion:29,unlockedMutations:FORM_INDEX.map(f=>f.id),mutationLevels:{nano:stage},activeMutationPool:['nano'],selectedMutation:'nano',researchUnits:400,tutorialStep:'done',onboarding:{enabled:false},sound:false});save.tutorialStep='done';save.onboarding.enabled=false;session=null;newDraft();session.foods=[foodForMutation('nano')];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);
 const cell=run.cellSize,template=run.blocks.find(b=>!b.hazard&&!b.special&&!b.unbreakable);run.blocks=[];
 for(let row=0;row<24;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:'qa-'+row+'-'+col,row,col,x:run.gridOffsetX+col*cell+2,y:run.blockRowOrigin+row*cell+2,w:cell-4,h:cell-4,tier:'hard',hp:4,maxHp:4,flaskTier:0,flaskValue:0,dead:false,elementalSnow:false,elementalSnowflake:false,fireDamageAt:0,electricFlashUntil:0});
 indexRunBlocks();run.launchEntryUntil=0;run.launchEntryStartedAt=0;run.portalEntry=null;run.slime.x=run.gridOffsetX+3.5*cell;run.slime.y=run.blockRowOrigin+2.5*cell;run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-200;
 run.nanoNextShotAt=performance.now()+100000;run.elementalAbilityCharges=1;run.ultimateCharge=65;updateRunUI();renderCanvas(performance.now());this.elapsed=0;this.start=performance.now();},
  prep(stage){
    this.prepare(stage);
    run.passiveLevels.nano=stage;
    run.ultimateStage=stage;
    run.ultimateProfile=ULTIMATE_STAGES.get('nano',stage);
    adminInfiniteUltimate=true;

    run.portalTransitioning=false;
    run.slime.y=run.blockRowOrigin+2.5*run.cellSize;
    run.cameraY=run.slime.y-205;
    run.blocks.find(b=>b.col===3&&b.row===2).hp=3;
    run.blocks.find(b=>b.col===3&&b.row===3).hp=1;
    updateRunUI();
    renderCanvas(performance.now());
  },
  advance(elapsed, physics=false) {
    for(let t=this.elapsed+5;t<=elapsed;t+=5) {
      updateElementalEffects(this.start+t);
      if(physics) updatePhysics(.005,this.start+t);
    }
    this.elapsed=elapsed;
    updateRunUI();renderCanvas(this.start+elapsed);
    return this.state();
  },
  passive(){run.nanoNextShotAt=this.start+1000;},
  state() {
    return { burst:run.nanoBurst?.remaining, phase:run.mechSuit?.phase,
      timer:run.mechSuit && run.mechSuit.expireAt-run.mechSuit.landAt,
      up:run.slime.vy<0, x:run.slime.x, y:run.slime.y, radius:run.slime.radius,
      explosion:!!run.mechExplosion,
      launch:run.nanoLastShotAt, hp:run.blocks.filter(b=>b.col===3&&b.row>=2&&b.row<=5).map(b=>b.hp),
      dead:run.blocks.filter(b=>b.dead).map(b=>[b.row,b.col])};
  },
  alignAttack(){this.start=run.nanoBurst.nextAt;},
  mech(){
    const intro=run.ultimateIntro;
    if (!intro) throw new Error('Ultimate control failed to start intro');
    run.ultimateIntro=null;
    commitElementalAbility('nano',this.start,intro.originX,intro.originY);
  },
  live(){run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const p=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',hook+'  init().catch(error => {')}));
 await p.goto(process.env.SLIME_TEST_URL || 'http://127.0.0.1:8765/?test=techno-drill');
 await p.waitForFunction(()=>window.__drillQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:30000});
 const state=()=>p.evaluate(()=>__drillQA.state());
 const advance=(t,physics=false)=>p.evaluate(([t,m])=>__drillQA.advance(t,m),[t,physics]);
 const prep=n=>p.evaluate(n=>__drillQA.prep(n),n);
 await prep(1);
 assert.equal(await p.locator('#abilityBtn').isVisible(),false);
 assert(await p.locator('.fall-attack-nano').isVisible());
 await p.evaluate(()=>__drillQA.passive());
 assert.equal((await advance(995)).launch,0);
 const first=(await advance(1000)).launch;
 assert(first>0);
 assert.deepEqual((await advance(1190)).hp,[2,1,4,4]);
 assert.equal((await advance(1995)).launch,first);
 assert.equal((await advance(2000)).launch-first,1000);
 await prep(2);
 await p.locator('#fallAttackBtn').click({force:true});
 assert.equal((await state()).burst,6);
 await p.evaluate(()=>__drillQA.alignAttack());
 assert.deepEqual((await advance(95)).hp,[2,0,4,4]);
 assert.deepEqual((await advance(200)).hp,[1,0,3,4]);
 assert.equal((await advance(510)).burst,1);
 assert.equal((await advance(530)).burst,undefined);
 await prep(3);
 const before=await state();
 await p.locator('#abilityBtn').click({force:true});
 await p.evaluate(()=>__drillQA.mech());
 fs.mkdirSync('tmp',{recursive:true});
 assert.equal((await advance(660,true)).phase,'descending');
 await p.screenshot({path:'tmp/techno-drill-assembly.png'});
 const landed=await advance(920,true);
 assert.equal(landed.phase,'active'); assert.equal(landed.timer,5000);
 assert.equal(landed.radius,before.radius);
 assert.equal(landed.dead.length,0);
 const bit=await advance(985,true);
 assert.equal(bit.hp[0],1);
 assert.deepEqual(bit.dead,[[3,3]]);
 const cleared=await advance(1090,true);
 assert.equal(cleared.dead.length,4);
 await p.keyboard.down('ArrowUp');
 await p.keyboard.down('ArrowLeft');
 const moved=await advance(1420,true);
 assert(moved.y>landed.y&&moved.x<landed.x&&!moved.up);
 await p.keyboard.up('ArrowUp');
 await p.keyboard.up('ArrowLeft');
 await p.screenshot({path:'tmp/techno-drill-mobile.png'});
 assert.equal((await advance(5915,true)).phase,'active');
 const exit=await advance(5925,true);
 assert.equal(exit.phase,undefined);
 assert(exit.explosion && !exit.up);
 assert((await advance(6050,true)).y > exit.y);
 await p.screenshot({path:'tmp/techno-drill-exit.png'});
 await prep(3);
 await p.locator('#abilityBtn').click({force:true});
 await p.evaluate(()=>__drillQA.live());
 await p.waitForFunction(()=>__drillQA.state().phase==='active');
 const liveY=(await state()).y;
 await p.waitForFunction(y=>__drillQA.state().y>y,liveY);
 assert.deepEqual(errors,[]);
 console.log('Techno in browser: 1 s passive, exactly 6 shots, live penetration, 2×2 footprint, 5 s, down-only steering, no exceptions.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
