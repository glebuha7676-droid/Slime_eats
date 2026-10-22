const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='outputs/electric-storm-670';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__storm670={async show(){closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();save=normalizeSave({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['electric'],mutationLevels:{electric:3},activeMutationPool:['electric'],selectedMutation:'electric',sound:false});session=null;newDraft();session.foods=[foodForMutation('electric')];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();await preloadMenuAppearance({electric:3});await SlimeAvatarRenderer.whenReady();drawMenuSlime(1000);return {variant:elementalBodyVariant({electric:3}),stage:session.foods[0].stage};}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],requests=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/');
  await page.waitForFunction(()=>window.SlimeGameDebug&&window.__storm670,null,{timeout:60000});
  const record=await page.evaluate(()=>__storm670.show());assert.equal(record.variant,'electricUltra');assert.equal(record.stage,3);
  await page.waitForTimeout(150);await page.screenshot({path:out+'/home.png'});
  assert(requests.some(url=>url.includes('slime-body-electric-storm-v1.webp')));
  await page.setViewportSize({width:1100,height:650});
  await page.goto('http://127.0.0.1:8766/editors/electric-forms-656.html');await page.waitForFunction(()=>window.previewReady);
  await page.evaluate(()=>{window.previewPaused=true;electricFormsPreview.draw(1000);});
  await page.screenshot({path:out+'/three-stages.png'});
  await page.locator('article').nth(2).screenshot({path:out+'/storm-lord.png'});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/checks.json',JSON.stringify({record,errors,assetRequested:true},null,2));
  console.log('New electric III body loaded in the actual home screen and stage preview with separate eyes; no JavaScript errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
