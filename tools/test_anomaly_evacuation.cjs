const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const E=require('../js/gameplay/anomaly-evacuation.js');
for(const completed of [false,true]){
 const r={slime:{x:120,y:300,radius:25,vx:70,vy:120},cameraY:100,baseSlimeRadius:25,blocks:[{x:85,y:405,w:75,h:75,hp:3,dead:false}],shake:0};
 const first=E.begin(r,{completed});assert.equal(E.begin(r,{completed}),first,'Begin is idempotent');
 let count=0;const phases=new Set();let last={x:r.slime.x,y:r.slime.y};
 for(let i=0;i<350;i++){
  E.update(r,.02,{complete:()=>count++});phases.add(r.evacuation.phase);
  assert(Math.hypot(r.slime.x-last.x,r.slime.y-last.y)<14,'No positional jumps');last={x:r.slime.x,y:r.slime.y};
  assert(r.slime.y<=r.evacuation.floor+.01,'The unpowered slime cannot pass through the floor');
 }
 assert.equal(count,1);assert.equal(r.blocks[0].hp,3);assert.equal(r.evacuation.neutral,1);assert.equal(r.evacuation.alpha,0);assert.equal(r.evacuation.portalScale,0);
 for(const phase of ['release','open','pull','close','done'])assert(phases.has(phase));
}
const src=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const extra=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+extra+`window.__evacQA={
 start(id='fire',side='left'){
  __energyQA.start(id,3);run.energy=15;updateRunUI();
  const col=side==='left'?2:4,b=run.blocks.find(b=>b.row===15&&b.col===col);Object.assign(b,{dead:false,hazard:false,special:null,hp:3,maxHp:3,unbreakable:false,flaskTier:0});
  for(const c of run.blocks)if(c.col===col&&c.row>=12&&c.row<15){c.dead=true;c.hp=0;}
  this.floor=b;run.slime.x=b.x+b.w/2;run.slime.y=b.y-run.slime.radius-48;run.slime.vx=0;run.slime.vy=110;run.cameraY=run.slime.y-270;run.depth=70;run.maxDepth=70;renderCanvas(performance.now());return this.state();
 },
 exhaust(){ENERGY.change(run,-run.energy,'hazard',performance.now());endRun(false,'Нет силы');run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);return this.state();},
 state(){const e=run?.evacuation;return {energy:run.energy,ended:run.ended,completed:run.completed,paused:run.paused,totalRuns:save.totalRuns,blocks:run.blocksDestroyed,hp:this.floor?.hp,phase:e?.phase,elapsed:e?.elapsed,phaseTime:e?.phaseTime,neutral:e?.neutral,flash:e?.flash,scale:e?.scale,alpha:e?.alpha,portalScale:e?.portalScale,portalX:e?.portalX,portalY:e?.portalY,side:e?.side,grounded:e?.grounded,worldTime:e?.worldTime,floorY:e?.floor,avatar:window.__neutralAvatar,success:e?.completed,slime:{x:run.slime.x,y:run.slime.y,radius:run.slime.radius},camera:run.cameraY,coreHp:save.planetCampaign.cores.home,coreDamage:run.coreEncounter?.actualDamage,corePending:save.planetCampaign.pending.length};},
 breakAttempt(){const b=this.floor;resolveBlockHit(b,{nx:0,ny:-1,penetration:1},performance.now());restoreAnomalyEnergy(18);activateAbility();return this.state();},
 setEnergy(n){run.energy=n;updateRunUI();},
 core(){this.floor=null;__energyQA.start('electric',3);__energyQA.core(60);},
 restart(){updatePersistentUI();restartCurrentRun();}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/anomaly-evacuation-v2';fs.mkdirSync(dir,{recursive:true});
 try{
 const p=await b.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 const avatarSource=fs.readFileSync('js/rendering/slime-avatar.js','utf8');
 await p.route('**/js/rendering/slime-avatar.js*',r=>r.fulfill({contentType:'application/javascript',body:avatarSource+`;{const original=window.SlimeAvatarRenderer;window.SlimeAvatarRenderer={...original,drawSlimeAvatar(ctx,o){if(ctx.canvas.id==='physicsCanvas'&&o.appearance==='cute-v2'&&!o.bodyVariant)window.__neutralAvatar={skin:o.skin,appearance:o.appearance,colors:o.colors};return original.drawSlimeAvatar(ctx,o);}};}`}));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:src.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=evacuation-2');await p.waitForFunction(()=>window.__evacQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
 await p.waitForTimeout(400);await p.evaluate(()=>__evacQA.start());
 assert.equal(await p.locator('.anomaly-energy-label').textContent(),'СИЛА КОНЧАЕТСЯ');assert(await p.locator('#anomalyEnergy').evaluate(n=>n.classList.contains('is-critical')));
 await p.evaluate(()=>__evacQA.setEnergy(36));assert(!await p.locator('#anomalyEnergy').evaluate(n=>n.classList.contains('is-low')));
 await p.evaluate(()=>__evacQA.setEnergy(25));assert.equal(await p.locator('.anomaly-energy-label').textContent(),'МАЛО СИЛЫ');
 await p.evaluate(()=>__evacQA.setEnergy(15));assert.equal(await p.locator('.anomaly-energy-value').textContent(),'15%');
 await p.screenshot({path:dir+'/warning.png'});
 let s=await p.evaluate(()=>__evacQA.exhaust());assert(!s.ended);assert.equal(s.phase,'release');
 await p.waitForTimeout(220);await p.screenshot({path:dir+'/transformation-flash.png'});
 await p.waitForFunction(()=>__evacQA.state().phase==='open');await p.waitForTimeout(220);
 s=await p.evaluate(()=>__evacQA.state());assert.equal(s.neutral,1);assert(!s.grounded,'The slime is caught in midair instead of landing');assert(s.slime.y<s.floorY-8);assert.equal(s.avatar.skin,'classic');assert.equal(s.avatar.appearance,'cute-v2');assert.deepEqual(s.avatar.colors,['#e9ff9c','#67d348','#2fa345']);assert.equal(s.hp,3);assert(s.portalScale>0&&s.portalScale<1);assert(s.portalX>s.slime.x);
 await p.screenshot({path:dir+'/portal-growing.png'});
 const attempt=await p.evaluate(()=>__evacQA.breakAttempt());assert.equal(attempt.hp,3);assert.equal(attempt.energy,0);assert.equal(attempt.blocks,s.blocks);
 await p.locator('#endRunBtn').click();const paused=await p.evaluate(()=>__evacQA.state());assert(paused.paused);await p.waitForTimeout(300);assert.equal((await p.evaluate(()=>__evacQA.state())).elapsed,paused.elapsed);
 await p.locator('#resumeRunBtn').click();await p.waitForFunction(()=>__evacQA.state().phase==='pull');await p.waitForTimeout(450);
 await p.screenshot({path:dir+'/pulled-into-portal.png'});
 await p.waitForFunction(()=>__evacQA.state().ended,null,{timeout:6000});s=await p.evaluate(()=>__evacQA.state());assert.equal(s.totalRuns,1);assert.equal(s.completed,false);assert.equal(s.hp,3);
 await p.screenshot({path:dir+'/evacuated-result.png'});
 await p.evaluate(()=>__evacQA.start('frost','right'));await p.evaluate(()=>__evacQA.exhaust());await p.waitForFunction(()=>__evacQA.state().phase==='open');s=await p.evaluate(()=>__evacQA.state());assert(s.portalX<s.slime.x,'Portal chooses the opposite free side');
 await p.locator('#endRunBtn').click();await p.evaluate(()=>__evacQA.restart());s=await p.evaluate(()=>__evacQA.state());assert.equal(s.phase,undefined);assert.equal(s.energy,100);assert(!await p.locator('#shaft').evaluate(n=>n.classList.contains('is-evacuating')));
 await p.evaluate(()=>__evacQA.core());await p.waitForFunction(()=>__evacQA.state().success===true,null,{timeout:10000});
 s=await p.evaluate(()=>__evacQA.state());assert.equal(s.coreDamage,16);assert.equal(s.coreHp,84);assert.equal(s.energy,0);assert.equal(s.phase,'release');
 await p.waitForFunction(()=>__evacQA.state().phase==='open');await p.waitForTimeout(400);await p.screenshot({path:dir+'/core-same-rescue.png'});
 await p.waitForFunction(()=>__evacQA.state().ended,null,{timeout:6000});s=await p.evaluate(()=>__evacQA.state());assert.equal(s.completed,true);assert.equal(s.coreHp,84);assert.equal(s.corePending,1);assert.equal(s.totalRuns,1);
 await p.setViewportSize({width:320,height:568});await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);await p.evaluate(()=>__evacQA.start('phantom'));await p.evaluate(()=>__evacQA.exhaust());await p.waitForFunction(()=>__evacQA.state().phase==='open');await p.waitForTimeout(420);await p.screenshot({path:dir+'/narrow-reduced-motion.png'});
 for(const id of ['cosmos','nano','telekinesis','cloning','glitch']){
   await p.evaluate(id=>__evacQA.start(id),id);await p.evaluate(()=>__evacQA.exhaust());
   await p.waitForFunction(()=>__evacQA.state().phase==='open');assert.equal((await p.evaluate(()=>__evacQA.state())).neutral,1);
 }
 await p.evaluate(()=>__evacQA.core());await p.waitForFunction(()=>__evacQA.state().phase==='open',null,{timeout:8000});await p.waitForTimeout(250);await p.screenshot({path:dir+'/narrow-core-rescue.png'});
 assert.deepEqual(errors,[]);const checks={unitContinuity:true,modernReferenceBody:true,noLandingPause:true,allNineForms:true,solidFloor:true,noMorePower:true,portalBothSides:true,pause:true,restart:true,coreSameRescue:true,rewardOnce:true,warning:true,recoveryClearsWarning:true,reducedMotion:true,errors};fs.writeFileSync(dir+'/checks.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
