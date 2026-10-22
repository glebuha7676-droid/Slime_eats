const fs=require('node:fs'),assert=require('node:assert/strict'),sharp=require('sharp'),{chromium}=require('playwright');
const out=process.env.SLIME_VFX_QA_OUT||'outputs/psionic-damage-666';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__psiQA={base:10000,mode:'',
 async setup(stage=3,family='telekinesis'){
  if(run)cancelAnimationFrame(run.animationId);
  closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();
  save=normalizeSave({schemaVersion:29,world:1,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:[family],mutationLevels:{[family]:stage},activeMutationPool:[family],selectedMutation:family,sound:false});
  session=null;newDraft();session.foods=[foodForMutation(family)];session.offer=[null,null,null];session.offerTransition=false;session.rerollPending=false;recalcStats();syncMenuCategoryVisuals({instant:true});clearMenuMutationPresentation();
  await preloadMenuAppearance({[family]:stage});await SlimeDamageFeedback.preload();
  startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);run.paused=true;
  await Promise.all(ensureWorldBackgroundLayers(1).map(l=>l.image.decode()));
  await Promise.all(Object.values(ensureWorldSprites(1)).map(i=>i.decode().catch(()=>{})));
  run.launchEntryUntil=0;run.launchEntryStartedAt=0;run.shake=0;run.flasks=[];
  run.cameraY=900;run.slime.x=VIEW_W/2;run.slime.y=run.cameraY+205;run.slime.vx=0;run.slime.vy=0;run.barrier=0;
  for(const b of run.blocks)if(b.col>=2&&b.col<=3&&b.y<run.slime.y+run.slime.radius&&b.y>run.cameraY-80)b.dead=true;
  run.damageInvulnerableUntil=0;run.ultimateStage=stage;run.ultimateProfile=ULTIMATE_STAGES.get(family,stage);
  renderCanvas(this.base);return {variant:elementalBodyVariant(run.categoryVisuals),stage:run.ultimateStage,health:run.health};
 },cast(stage){
  this.mode='psi'+stage;run.elementalAbilityActive='telekinesis';run.elementalAbilityUntil=this.base+4200;
  if(stage===3)startTelekinesisPress(this.base,run.slime.y);else startTelekinesisCycle(this.base,stage,true);
  renderCanvas(this.base);
  return {targets:run.telekinesisPress?.targets.filter(b=>!b.hazard).length,projectiles:run.telekinesisCycle?.projectiles.length};
 },frame(age){
  const at=this.base+age;
  if(this.mode==='psi3')updateTelekinesisPress(at);
  if(this.mode==='psi2')updateTelekinesis(at);
  run.shake=0;renderCanvas(at);
  return {press:run.telekinesisPress?{collided:run.telekinesisPress.collided,progress:telekinesisPressProgress(run.telekinesisPress,at),alive:run.telekinesisPress.targets.filter(b=>!b.dead&&!b.hazard).length}:null,
   cycle:run.telekinesisCycle?.projectiles.map(p=>({launched:p.launched,impacted:p.impacted,detached:p.detached})),health:run.health};
 },hit(shield=false){
  this.mode='damage';run.elementalAbilityActive='';run.telekinesisPress=null;run.telekinesisCycle=null;run.damageInvulnerableUntil=0;run.psionicBarrier=null;run.barrier=shield?1:0;
  const block=run.blocks.filter(b=>b.hazard&&!b.dead&&b.y>run.cameraY+200&&b.y<run.cameraY+570)
    .sort((a,b)=>Math.abs(a.x+a.w/2-VIEW_W/2)-Math.abs(b.x+b.w/2-VIEW_W/2))[0];
  if(!block)throw Error('Fixture has no visible hazard');
  run.slime.x=block.x+block.w/2;run.slime.y=block.y-run.slime.radius+3;
  resolveHazardHit(block,{nx:0,ny:-1,penetration:3},this.base);run.shake=0;renderCanvas(this.base);
  return {health:run.health,at:run.lastHeartLossAt,impact:run.hazardImpact,until:run.hurtFlashUntil,variant:elementalBodyVariant(run.categoryVisuals)};
 },repeatHit(){const block=run.blocks.find(b=>b.hazard&&!b.dead);resolveHazardHit(block,{nx:0,ny:-1,penetration:1},this.base+100);return run.health;},
 pausePress(){const before=telekinesisPressProgress(run.telekinesisPress,this.base+700);shiftRunClock(5000);const after=telekinesisPressProgress(run.telekinesisPress,this.base+5700);return {before,after};},
 canvas(){return els.canvas.toDataURL('image/png').split(',')[1];}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],records={};
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__psiQA&&window.SlimeGameDebug,null,{timeout:60000});
  records.forms=await page.evaluate(async()=>{
   await SlimePsionicFeedback.preload();await SlimeDamageFeedback.preload();
   const motion=[0,200,800,2000,4000].map(t=>MutationEffectDraft.psionicsMotion(t,90).offset);
   const block={x:0,y:300,w:72,h:72,row:4,col:0};
   const poses=[0,.5,1].map(p=>SlimePsionicFeedback.pressPose(block,p,220,500));
   const states=[0,65,160,390,700,1300,2001].map(age=>SlimeDamageFeedback.reaction(10000+age,10000,12000));
   const reduced=SlimeDamageFeedback.reaction(10700,10000,12000,true);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=400;const raw=canvas.getContext('2d');let bitmaps=0;const rotations=[];
   const target=new Proxy(raw,{get(ctx,key){if(['beginPath','arc','stroke','fillRect','lineTo','strokeRect','fill'].includes(key))return()=>{throw Error('Vector damage graphics: '+key);};if(key==='drawImage')return(...a)=>{bitmaps++;return ctx.drawImage(...a);};if(key==='rotate')return a=>{rotations.push(a);return ctx.rotate(a);};const v=ctx[key];return typeof v==='function'?v.bind(ctx):v;},set(ctx,k,v){ctx[k]=v;return true;}});
   SlimeDamageFeedback.draw(target,{at:10080,startedAt:10000,impact:{x:200,y:200,nx:0,ny:-1},cameraY:0,radius:40});
   rotations.length=0;
   SlimeDamageFeedback.draw(target,{at:10080,startedAt:10000,impact:{x:200,y:200,nx:1,ny:0},cameraY:0,radius:40});
   const sideImpactRotation=rotations[0];
   function bounds(tint){raw.clearRect(0,0,400,400);SlimeAvatarRenderer.drawSlimeAvatar(raw,{x:200,y:220,radius:80,bodyVariant:'psionicsUltra',appearance:'cute-v2',hideFace:true,hitTint:tint});const pixels=raw.getImageData(0,0,400,400).data;let min=400,max=0;for(let y=0;y<400;y++)for(let x=0;x<400;x++)if(pixels[(y*400+x)*4+3]>100){min=Math.min(min,y);max=Math.max(max,y);}return max-min;}
   await SlimeAvatarRenderer.preloadAppearance({bodyVariant:'psionicsUltra'});
   return {motion,poses,states,reduced,bitmaps,sideImpactRotation,bodyHeights:[bounds(''),bounds(states[1].tint)]};
  });
  assert(records.forms.motion.every(v=>v===0));assert(records.forms.poses[2].scaleX<=.04);assert.equal(records.forms.poses[2].x,220);assert(records.forms.bitmaps>=1);assert.equal(records.forms.reduced.alpha,1);assert.equal(records.forms.sideImpactRotation,0,'A side hit must emit horizontally');assert(Math.abs(records.forms.bodyHeights[0]-records.forms.bodyHeights[1])<=2,'Damage must retain the mutation silhouette');assert.equal(records.forms.states.at(-1).active,false);
  await page.evaluate(()=>__psiQA.setup(3));records.third=await page.evaluate(()=>__psiQA.cast(3));
  for(const age of [0,400,800,1120,1270,1295,1480,1900,2350]){
   const state=await page.evaluate(age=>__psiQA.frame(age),age);records['third-'+age]=state;
   await page.screenshot({path:`${out}/third-${age}.png`});
  }
  assert.equal(records['third-1270'].press.collided,false);assert.equal(records['third-1295'].press.collided,true);assert.equal(records['third-1295'].press.alive,0);assert.equal(records['third-2350'].press,null);
  await page.evaluate(()=>__psiQA.setup(3));await page.evaluate(()=>__psiQA.cast(3));records.pause=await page.evaluate(()=>__psiQA.pausePress());assert.equal(records.pause.before,records.pause.after);
  await page.evaluate(()=>__psiQA.setup(2));records.second=await page.evaluate(()=>__psiQA.cast(2));assert.equal(records.second.projectiles,8);
  for(const age of [0,400,800,1300,1650,2300,2900,3300]){records['second-'+age]=await page.evaluate(age=>__psiQA.frame(age),age);await page.screenshot({path:`${out}/second-${age}.png`});}
  assert(records['second-800'].cycle.every(p=>p.detached));assert(records['second-2900'].cycle.some(p=>p.impacted));
  await page.evaluate(()=>__psiQA.setup(3));records.damage=await page.evaluate(()=>__psiQA.hit());assert.equal(records.damage.health,2);assert.equal(records.damage.variant,'psionicsUltra');assert.equal(await page.evaluate(()=>__psiQA.repeatHit()),2,'Invulnerability must prevent a second heart loss');
  for(const age of [30,90,170,350,750,1500,2010]){await page.evaluate(age=>__psiQA.frame(age),age);await page.screenshot({path:`${out}/damage-${age}.png`});}
  await page.evaluate(()=>__psiQA.setup(3));records.shield=await page.evaluate(()=>__psiQA.hit(true));assert.equal(records.shield.health,3);assert.equal(records.shield.at,0,'Shield hit must not trigger health-loss feedback');
  // Three short actual-renderer sequences; tile art, bodies and VFX all come from the game.
  const frames=[];
  for(const [stage,mode] of [[2,'second'],[3,'third'],[3,'damage']]){
   await page.evaluate(stage=>__psiQA.setup(stage),stage);
   await page.evaluate(({stage,mode})=>mode==='damage'?__psiQA.hit():__psiQA.cast(stage),{stage,mode});
   const sequence=[];
   for(let i=0;i<44;i++){
    await page.evaluate(age=>__psiQA.frame(age),i*(mode==='second'?80:55));
    sequence.push(await sharp(Buffer.from(await page.evaluate(()=>__psiQA.canvas()),'base64')).resize(220,420).png().toBuffer());
   }
   frames.push(sequence);
  }
  const inputs=[];for(let frame=0;frame<44;frame++)for(let col=0;col<3;col++)inputs.push({input:frames[col][frame],left:col*220,top:frame*420});
  await sharp({create:{width:660,height:420*44,channels:4,background:'#15384d'}}).composite(inputs).png().toFile(`${out}/animation-strip.png`);
  fs.writeFileSync(`${out}/checks.json`,JSON.stringify({errors,records},null,2));assert.deepEqual(errors,[]);
  console.log('Psionic II/III timing, eight throws, full press destruction, pause, no idle hover, preserved damage silhouette, one-heart loss, shield/invulnerability, and raster-only impact passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
