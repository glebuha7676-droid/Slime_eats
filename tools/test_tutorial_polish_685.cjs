const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='outputs/tutorial-685';fs.mkdirSync(out,{recursive:true});
const hook=require('./test_tutorial_685.cjs').hook+`window.__polish685={
 layout(x,y,expanded){
  __lesson685.freeze();run.launchEntryUntil=0;run.launchEntryStartedAt=0;run.portalEntry=null;run.shake=0;
  run.tutorialGoalAvailable=true;run.tutorialLessonTime=20000;run.tutorialGoalExpandedUntil=expanded?30000:10000;
  run.masteryGain=130;run.cameraY=2000;run.slime.x=x;run.slime.y=2000+y;
  const original=ctx.drawImage,draws=[];
  ctx.drawImage=function(image,...args){if((image.src||'').includes('slime-body-fire-warm')&&args.length===4){
   const [left,top,width,height]=args,m=ctx.getTransform(),c=els.canvas.getBoundingClientRect();
   const p=[[left,top],[left+width,top],[left,top+height],[left+width,top+height]].map(([x,y])=>({x:c.left+(m.a*x+m.c*y+m.e)*c.width/els.canvas.width,y:c.top+(m.b*x+m.d*y+m.f)*c.height/els.canvas.height}));
   draws.push({left:Math.min(...p.map(v=>v.x)),right:Math.max(...p.map(v=>v.x)),top:Math.min(...p.map(v=>v.y)),bottom:Math.max(...p.map(v=>v.y))});
  }return original.call(this,image,...args)};
  try{renderCanvas(performance.now())}finally{ctx.drawImage=original}
  updateRunUI();positionTutorialRunGoal();run.tutorialGoalMotion?.finish();
  const e=document.querySelector('#tutorialRunGoal');return {rect:e.getBoundingClientRect().toJSON(),draws,overflow:e.scrollWidth-e.clientWidth};
 },
 advance(ms){run.tutorialLessonTime+=ms;updateTutorialRun(performance.now());positionTutorialRunHint();return __lesson685.state()},
 attemptReplace(){return setTutorialRunHint('heal','replacement','must not interrupt')},
 ready(id,stage,count){
  __lesson685.freeze();save.onboarding.enabled=false;save.tutorialStep='done';save.mutationLevels[id]=stage;
  if(!save.unlockedMutations.includes(id))save.unlockedMutations.push(id);
  save.mutationMastery[id]=0;run.mutationId=id;run.masteryGain=count;run.ended=false;run.tutorialPhase=0;
  endRun(false,'QA');renderResultSlimeProgress(run.experienceBefore);
  return {ready:document.querySelector('#resultSlimeProgress').classList.contains('is-evolution-ready'),text:document.querySelector('#resultSlimeProgress').innerText,outlineHidden:els.tutorialLayer.hidden,goalHidden:document.querySelector('#tutorialRunGoal').hidden};
 },
 frozen(){
  __lesson685.freeze();run.launchEntryUntil=0;run.launchEntryStartedAt=0;run.portalEntry=null;
  const row=20;run.cameraY=285+row*run.cellSize-240;run.slime.y=run.cameraY+90;
  const b=run.blocks.find(b=>b.row===row&&b.col===2&&!b.hazard&&!b.special);turnBlockToSnow(b,performance.now()-1000,true);
  return {snow:b.elementalSnow,hp:b.hp,source:ensureWorldSprites(2)['snow-packed'].src};
 }
};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],records=[];p.on('pageerror',e=>errors.push(e.stack));
 const src=fs.readFileSync('game.js','utf8');await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:src.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=685');await p.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});
 const setup=async(second=false)=>{await p.evaluate(second=>__lesson685.setup({schemaVersion:29,tutorialStep:second?'second-play':'play',onboarding:{version:7,enabled:true,controlsLearned:true,fireLearned:true,abilityLearned:true},unlockedMutations:['fire'],mutationLevels:{fire:second?2:1},activeMutationPool:['fire'],sound:false},true),second);await p.locator('#worldStartBtn').click();await p.waitForFunction(second=>__lesson685.state().phase===(second?2:1),second);await p.evaluate(()=>__lesson685.repaint())};
 await setup();
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1280,height:900}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(150);
  for(const expanded of [false,true])for(const x of [45,110,220,330,395])for(const y of [90,150,240,450,650]){
   const r=await p.evaluate(({x,y,expanded})=>__polish685.layout(x,y,expanded),{x,y,expanded});
   assert(r.draws.length);assert(r.rect.left>=0&&r.rect.right<=viewport.width+1);assert(r.overflow<=1);
   for(const b of r.draws)assert(!(r.rect.left<b.right&&r.rect.right>b.left&&r.rect.top<b.bottom&&r.rect.bottom>b.top),JSON.stringify({viewport,x,y,expanded,r}));records.push({viewport,x,y,expanded,...r});
  }
  await p.evaluate(()=>__polish685.layout(220,250,true));await p.screenshot({path:out+'/goal-'+viewport.width+'.png'});
 }
 await p.setViewportSize({width:390,height:844});await setup(true);
 await p.evaluate(()=>__lesson685.at('hazard'));assert.equal(await p.evaluate(()=>__polish685.attemptReplace()),false);
 await p.evaluate(()=>__polish685.advance(1000));assert.equal((await p.evaluate(()=>__lesson685.state())).hint,'hazard');
 await p.evaluate(()=>__polish685.advance(5100));assert(await p.locator('#tutorialRunHint').evaluate(e=>e.classList.contains('is-leaving')));assert(await p.locator('#tutorialRunHint').isVisible());
 await p.evaluate(()=>__polish685.advance(400));assert(await p.locator('#tutorialRunHint').isHidden());
 await p.evaluate(()=>__lesson685.at('heal'));assert((await p.locator('#tutorialRunHint').innerText()).includes('Поможет, если ранишься'));await p.screenshot({path:out+'/heal-full-health.png'});
 const definitions=await p.evaluate(()=>window.SlimeMutationMastery.definitions);
 for(const [id,def]of Object.entries(definitions)){
  const r=await p.evaluate(({id,count})=>__polish685.ready(id,1,count),{id,count:def.goals[0]});assert(r.ready,id);assert(r.text.includes('Можно развить'));assert(!r.text.includes('В ЛАБОРАТОРИИ'));assert(r.outlineHidden&&r.goalHidden);
 }
 assert(!(await p.evaluate(()=>__polish685.ready('fire',2,749))).ready);assert((await p.evaluate(()=>__polish685.ready('fire',2,750))).ready);
 for(const viewport of [{width:320,height:568},{width:390,height:844}]){await p.setViewportSize(viewport);await p.waitForTimeout(250);await p.screenshot({path:out+'/result-ready-'+viewport.width+'.png'});assert(await p.locator('#resultSlimeProgress p').isVisible());const r=await p.locator('#resultSlimeProgress').boundingBox();assert(r.x>=0&&r.x+r.width<=viewport.width+1)}
 await setup();const frozen=await p.evaluate(()=>__polish685.frozen());assert(frozen.snow&&frozen.hp===1);assert(frozen.source.includes('frost-snow-front-v1.webp'));await p.waitForTimeout(300);await p.evaluate(()=>__lesson685.repaint());await p.screenshot({path:out+'/snow-in-mine.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/polish-checks.json',JSON.stringify({records,errors,frozen},null,2));console.log('150 painted body positions, non-interrupting cards, readable/fading hints, all nine evolution banners, 750 gate and snowy tile passed.');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
