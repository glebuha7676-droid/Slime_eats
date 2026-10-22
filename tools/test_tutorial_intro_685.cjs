const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='outputs/tutorial-685';fs.mkdirSync(out,{recursive:true});
const hook=require('./test_tutorial_685.cjs').hook+`window.__introEvents=[];
new MutationObserver(()=>{const phase=document.body.dataset.tutorialIntro||'finished';if(__introEvents.at(-1)?.phase!==phase)__introEvents.push({phase,at:performance.now()})}).observe(document.body,{attributes:true,attributeFilter:['data-tutorial-intro']});
window.__intro685={
 focusFrames(){
  __lesson685.freeze();renderTutorial();const focus=run.tutorialHint.focus,records=[];let mutations=0;
  const observer=new MutationObserver(rows=>mutations+=rows.length);observer.observe(els.tutorialFocus,{attributes:true,subtree:true});
  const original=ctx.stroke;let strokes=0;ctx.stroke=function(...args){if(ctx.strokeStyle==='#ffdc67')strokes++;return original.apply(this,args)};
  try{for(let i=0;i<12;i++){run.cameraY+=1;renderCanvas(performance.now());renderTutorial();records.push({id:run.tutorialHint.focus?.id,rect:tutorialWorldBounds(focus)})}}finally{ctx.stroke=original}
  mutations+=observer.takeRecords().length;observer.disconnect();return {mutations,strokes,records,layerHidden:els.tutorialLayer.hidden};
 },
 complete(){run.masteryGain=250;updateRunUI();return {until:run.tutorialGoalExpandedUntil,now:run.tutorialLessonTime}},
 goalDuration(){return run.tutorialGoalExpandedUntil-run.tutorialLessonTime},
 goalTick(ms){run.tutorialLessonTime+=ms;updateRunUI();return run.tutorialGoalExpandedUntil},
 result(){endRun(false,'QA');return document.querySelector('#resultSlimeProgress').innerText}
};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 const source=fs.readFileSync('game.js','utf8');await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=685');await p.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});
 for(const phase of ['hello','emblem','synthesis','offer']){
  await p.waitForFunction(phase=>document.body.dataset.tutorialIntro===phase,phase,{timeout:10000});
  assert(await p.locator('#tutorialLayer').isHidden());
  if(phase==='hello'){assert.equal(await p.locator('.console-selector-face').evaluate(e=>getComputedStyle(e).visibility),'hidden');assert.equal(await p.locator('.console-food-content').evaluate(e=>getComputedStyle(e).visibility),'hidden')}
  if(phase==='emblem'){assert.equal(await p.locator('.console-selector-face').evaluate(e=>getComputedStyle(e).visibility),'visible');assert.equal(await p.locator('.console-food-content').evaluate(e=>getComputedStyle(e).visibility),'hidden')}
  await p.waitForTimeout(260);await p.screenshot({path:out+'/intro-'+phase+'.png'});
 }
 await p.waitForFunction(()=>!window.SlimeTutorialIntro.active);assert((await p.evaluate(()=>__lesson685.state())).flags.introSeen);
 const introEvents=await p.evaluate(()=>__introEvents);await p.reload();await p.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});assert(!await p.evaluate(()=>window.SlimeTutorialIntro.active),'The first meeting is not repeated after reload');
 await p.waitForFunction(()=>!document.querySelector('.conveyor-food-pick')?.disabled);const food=await p.locator('.conveyor-food-pick').boundingBox(),slime=await p.locator('#slime').boundingBox();await p.mouse.move(food.x+food.width/2,food.y+food.height/2);await p.mouse.down();await p.mouse.move(slime.x+slime.width/2,slime.y+slime.height/2,{steps:12});await p.mouse.up();await p.waitForFunction(()=>__lesson685.state().step==='play');await p.locator('#worldStartBtn').click();await p.waitForFunction(()=>__lesson685.state().memo==='controls');await p.evaluate(()=>__lesson685.freeze());
 assert(await p.locator('#tutorialMemoNext').isHidden());await p.keyboard.press('ArrowLeft');await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>__lesson685.state().memo),'controls','Early movement/taps do not dismiss the lesson');
 await p.waitForFunction(()=>performance.now()>=__lesson685.state().readyAt);await p.keyboard.press('Space');assert.equal(await p.evaluate(()=>__lesson685.state().memo),'controls','The lesson waits for movement, not a confirmation key');
 await p.locator('#shaft').dispatchEvent('pointerdown',{pointerId:12,pointerType:'touch',clientX:170,clientY:400,buttons:1});await p.locator('#shaft').dispatchEvent('pointermove',{pointerId:12,pointerType:'touch',clientX:145,clientY:400,buttons:1});await p.locator('#shaft').dispatchEvent('pointerup',{pointerId:12,pointerType:'touch',clientX:145,clientY:400,buttons:0});assert((await p.evaluate(()=>__lesson685.state())).flags.controlsLearned);assert(await p.locator('#tutorialMemo').isHidden());assert(await p.locator('#tutorialSteeringDemo').isHidden());
 const setup=async(second=false,controls=true)=>{await p.evaluate(({second,controls})=>__lesson685.setup({schemaVersion:29,tutorialStep:second?'second-play':'play',onboarding:{version:7,enabled:true,introSeen:true,controlsLearned:controls,fireLearned:true,abilityLearned:true},unlockedMutations:['fire'],mutationLevels:{fire:second?2:1},activeMutationPool:['fire'],sound:false},true),{second,controls});await p.locator('#worldStartBtn').click();await p.waitForFunction(second=>__lesson685.state().phase===(second?2:1),second);await p.evaluate(()=>__lesson685.repaint())};
 await setup(false,false);await p.evaluate(()=>__lesson685.control());await p.waitForFunction(()=>performance.now()>=__lesson685.state().readyAt);await p.keyboard.press('ArrowRight');assert((await p.evaluate(()=>__lesson685.state())).flags.controlsLearned);
 await setup(true);await p.evaluate(()=>__lesson685.at('hazard'));const focus=await p.evaluate(()=>__intro685.focusFrames());assert.equal(focus.mutations,0);assert(focus.layerHidden&&focus.strokes>=12);assert(focus.records.every(v=>v.id===focus.records[0].id));assert(focus.records.at(-1).rect.top<focus.records[0].rect.top);await p.screenshot({path:out+'/static-block-focus.png'});
 for(const kind of ['hazard','heal','plasma']){await p.evaluate(kind=>__lesson685.at(kind),kind);const text=await p.locator('#tutorialRunHint').innerText();assert(!text.includes('Мороз'));assert(text.length<75);assert(await p.locator('#tutorialRunHint strong').evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=20));await p.waitForTimeout(380);await p.screenshot({path:out+'/short-'+kind+'.png'})}
 await setup();await p.evaluate(()=>__lesson685.goal());assert.equal(await p.evaluate(()=>__intro685.goalDuration()),3800);await p.evaluate(()=>__lesson685.dock());const complete=await p.evaluate(()=>__intro685.complete());assert.equal(complete.until-complete.now,3000);assert(await p.locator('#tutorialRunGoal').evaluate(e=>e.classList.contains('is-expanded')));assert((await p.locator('#tutorialRunGoal').innerText()).includes('Задание выполнено'));await p.screenshot({path:out+'/goal-completed.png'});
 assert.equal(await p.evaluate(()=>__intro685.goalTick(500)),complete.until,'The success message is not restarted by subsequent updates');await p.evaluate(()=>__intro685.goalTick(2600));assert(await p.locator('#tutorialRunGoal').evaluate(e=>e.classList.contains('is-mini')));
 const result=await p.evaluate(()=>__intro685.result());assert(result.includes('Можно развить'));assert(!result.includes('В ЛАБОРАТОРИИ')&&!result.includes('ГОТОВО К РАЗВИТИЮ'));assert((await p.locator('#resultSlimeProgress').boundingBox()).height<100);await p.waitForTimeout(500);await p.screenshot({path:out+'/result-simple.png'});
 for(const viewport of [{width:320,height:568},{width:1280,height:900}]){
  const small=await browser.newPage({viewport,isMobile:true,hasTouch:true});small.on('pageerror',e=>errors.push(e.stack));
  await small.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await small.goto('http://127.0.0.1:8766/?v=685');await small.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});await small.waitForFunction(()=>document.body.dataset.tutorialIntro==='emblem');await small.waitForTimeout(300);
  const note=await small.locator('.tutorial-intro-note').boundingBox(),device=await small.locator('#foodChoices').boundingBox();assert(note.x>=0&&note.x+note.width<=viewport.width+1);assert(note.y+note.height<=viewport.height);assert(note.y>=device.y+device.height,'The meeting never covers the synthesizer');await small.screenshot({path:out+'/intro-emblem-'+viewport.width+'.png'});await small.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/introduction-checks.json',JSON.stringify({introEvents,focus,complete,result,errors},null,2));console.log('First meeting and saved completion, guarded touch/keyboard movement, no extra button, static world focus, short large copy, completion reveal and simple results passed.');
}catch(e){for(const p of browser.contexts().flatMap(c=>c.pages())){console.log(await p.evaluate(()=>window.__lesson685?.state()).catch(()=>null));await p.screenshot({path:out+'/intro-failure.png'}).catch(()=>{})}throw e}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
