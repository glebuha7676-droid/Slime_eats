const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),out='outputs/form-corrections-668';fs.mkdirSync(out,{recursive:true});
const hook=`window.__forms668={async show(family){closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();save=normalizeSave({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:[family],mutationLevels:{[family]:2},activeMutationPool:[family],selectedMutation:family,sound:false});session=null;newDraft();session.foods=[foodForMutation(family)];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();await preloadMenuAppearance({[family]:2});await SlimeAvatarRenderer.whenReady();drawMenuSlime(1000);return {family,variant:elementalBodyVariant({[family]:2}),stage:session.foods[0].stage};}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[],requests=[],records=[];
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__forms668,null,{timeout:60000});
 for(const family of ['cosmos','glitch']){
  const record=await page.evaluate(f=>__forms668.show(f),family);records.push(record);assert.equal(record.stage,2);
  await page.waitForTimeout(150);await page.screenshot({path:`${out}/${family}-home.png`});
 }
 assert(requests.some(p=>p.includes('slime-body-cosmos-petrifying-v2.webp')));assert(requests.some(p=>p.includes('slime-body-glitch-arcade-v2.webp')));
 await page.setViewportSize({width:1100,height:650});
 for(const [family,file] of [['cosmos','cosmos-forms-663.html'],['glitch','glitch-forms-662.html']]){
  await page.goto('http://127.0.0.1:8766/editors/'+file);await page.waitForFunction(()=>window.previewReady);await page.evaluate(f=>{window.previewPaused=true;window[f+'FormsPreview'].draw(1000);},family==='cosmos'?'cosmos':'glitch');
  await page.screenshot({path:`${out}/${family}-three-stages.png`});
 }
 fs.writeFileSync(`${out}/checks.json`,JSON.stringify({errors,records},null,2));assert.deepEqual(errors,[]);console.log('Both new stage-II sprites loaded in the actual home screen and three-stage previews without JavaScript errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
