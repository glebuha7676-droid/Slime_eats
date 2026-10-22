const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='outputs/frost-transition-673';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__frost673={async setup(){closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();save=normalizeSave({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:['frost'],mutationLevels:{frost:2},activeMutationPool:['frost'],selectedMutation:'frost',sound:false});session=null;newDraft();await preloadMenuAppearance({frost:2});await SlimeAvatarRenderer.whenReady();return this.state();},state(){return {variant:elementalBodyVariant({frost:2}),foods:session.foods.length,busy:menuSlimeIsBusy(),stage:session.foods[0]?.stage};}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[],requests=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.stack));page.on('request',r=>requests.push(r.url()));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__frost673&&window.SlimeGameDebug,null,{timeout:60000});
  const before=await page.evaluate(()=>__frost673.setup());assert.equal(before.variant,'frostFreezing');
  await page.waitForFunction(()=>!__frost673.state().busy);
  await page.locator('#foodChoices .conveyor-food-pick').click();
  for(const [i,delay] of [200,350,650,1000,1300].entries()){await page.waitForTimeout(delay);await page.screenshot({path:out+'/feeding-'+i+'.png'});}
  await page.waitForFunction(()=>__frost673.state().foods===1&&!__frost673.state().busy,null,{timeout:15000});
  const after=await page.evaluate(()=>__frost673.state());assert.equal(after.stage,2);await page.screenshot({path:out+'/home-fed.png'});
  assert(requests.some(url=>url.includes('slime-body-frost-freezing-v1.webp')));
  assert(!requests.some(url=>url.includes('slime-body-frost-snowman')));
  const transforms=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const raw=canvas.getContext('2d');
   const records=[];let resets=0;
   const ctx=new Proxy(raw,{get(c,key){if(key==='setTransform')return()=>{resets++;throw Error('Avatar must not reset the caller transform');};const value=c[key];return typeof value==='function'?value.bind(c):value;},set(c,k,v){c[k]=v;return true;}});
   for(const emotion of ['focused','chewing','savoring','pleased','hurt'])for(const rotation of [-.2,0,.2]){
    raw.setTransform(1.1,.04,-.03,.95,9,12);const before=Array.from(raw.getTransform().toFloat64Array());
    SlimeAvatarRenderer.drawSlimeAvatar(ctx,{x:220,y:230,radius:85,appearance:'cute-v2',bodyVariant:'frostFreezing',emotion,rotation,scaleX:1.07,scaleY:.91,faceScaleX:.94,faceScaleY:1.08,timestamp:1000});
    records.push({emotion,rotation,before,after:Array.from(raw.getTransform().toFloat64Array())});
   }
   return {resets,records};
  });
  assert.equal(transforms.resets,0);for(const state of transforms.records)assert.deepEqual(state.after,state.before);
  await page.setViewportSize({width:1100,height:650});await page.goto('http://127.0.0.1:8766/editors/frost-forms-655.html');await page.waitForFunction(()=>window.previewReady);
  await page.evaluate(()=>{window.previewPaused=true;frostFormsPreview.draw(1000);});await page.screenshot({path:out+'/three-stages.png'});await page.locator('article').nth(1).screenshot({path:out+'/frost-II.png'});
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/checks.json',JSON.stringify({before,after,transforms,errors},null,2));
  console.log('Frost II: actual feeding completes, new body loaded, no snowman layer or transform resets, caller transforms preserved in 15 poses, no JavaScript errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
