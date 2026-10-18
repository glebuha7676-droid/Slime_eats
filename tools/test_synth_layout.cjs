const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__synthQA={open(mode='ready'){skipTutorial();closeOnboardingMemo(true);save.tutorialStep='done';save.onboarding.enabled=false;save.unlockedMutations=['fire','frost','electric'];save.mutationLevels={fire:1,frost:1,electric:1};save.researchUnits=9900;save.mutationProgress=mode==='ready'?currentMutationCost():Math.floor(currentMutationCost()/2);session=null;newDraft();selectedLaboratoryMutationId='fire';renderPanel('recipes');laboratoryView='synthesis';renderRecipesPanel();$('#toast').className='toast';}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8765/?v=627');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__synthQA);await page.evaluate(()=>document.fonts.ready);
 fs.mkdirSync('tmp/synth-627',{recursive:true});
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1280,height:1000}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>window.__synthQA.open());
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('.mutation-machine-art')].map(i=>i.decode())));await page.waitForTimeout(150);
  const layout=await page.evaluate(()=>{
   const rect=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom,r:r.right}};
   const art=[...document.querySelectorAll('.mutation-machine-art')].find(i=>getComputedStyle(i).display!=='none');
   const hint=document.querySelector('#mutationCapsuleHint');
   return {pane:rect('#labSynthesisPane'),capsule:rect('#mutationCapsuleBtn'),machine:rect('.mutation-machine-visual'),controls:rect('.mutation-synth-controls'),hatch:rect('.mutation-dispenser'),hintOverflow:hint.scrollHeight-hint.clientHeight,kind:art.className,overflow:document.querySelector('#panelContent').scrollHeight-document.querySelector('#panelContent').clientHeight};
  });
  console.log(viewport,layout);
  assert(layout.machine.y>=layout.capsule.y-1);assert(layout.machine.b<=layout.capsule.b+1);assert(layout.machine.r<=layout.pane.r+1);assert(layout.controls.b<=layout.pane.b+1);assert(layout.overflow<=1);
  assert(Math.abs(layout.machine.w/layout.machine.h-(layout.kind.includes('machine-tall')?1190/1322:1327/1186))<.01);
  assert(layout.hintOverflow<=1,'Machine instructions fit the plaque');
  if(layout.kind.includes('machine-tall'))assert(layout.hatch.w/layout.hatch.h>.85&&layout.hatch.w/layout.hatch.h<1.2,'Compact output hatch');
  if(viewport.width===390){assert(layout.kind.includes('machine-tall'));assert(layout.machine.h>340);}
  await page.screenshot({path:`tmp/synth-627/${viewport.width}-ready.png`});
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.__synthQA.open('half'));await page.waitForTimeout(500);await page.screenshot({path:'tmp/synth-627/half.png'});
 await page.evaluate(()=>window.__synthQA.open());await page.locator('#mutationSynthesizeBtn').click();
 await page.waitForFunction(()=>document.querySelector('#mutationCapsuleBtn')?.classList.contains('is-core-ready'),{timeout:15000});
 await page.waitForTimeout(250);await page.screenshot({path:'tmp/synth-627/output.png'});
 assert(await page.locator('#mutationMystery img').count());assert.deepEqual(errors,[]);await browser.close();console.log('Synthesis layout and reveal passed');
})().catch(e=>{console.error(e);process.exit(1)});
