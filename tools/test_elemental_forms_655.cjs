const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const phantomHook=`window.__formsQA.spirits=function(){const original=window.SlimePhantomEffects;let count=0;window.SlimePhantomEffects={...original,spirit(...args){count++;return original.spirit(...args);}};try{drawMenuSlime(1000);}finally{window.SlimePhantomEffects=original;}return count;};
window.__formsQA.psionicPoses=async function(stage){await preloadMenuAppearance({telekinesis:stage});const canvas=document.createElement('canvas');canvas.width=canvas.height=320;const raw=canvas.getContext('2d');let recordedY;const target=new Proxy(raw,{get(ctx,key){if(key==='drawImage')return(image,...args)=>{if(image.src?.includes('/slime-body-psionics-'))recordedY=ctx.getTransform().f;return ctx.drawImage(image,...args);};const value=ctx[key];return typeof value==='function'?value.bind(ctx):value;},set(ctx,key,value){ctx[key]=value;return true;}});return [0,Math.PI*620].map(timestamp=>{drawElementalSlimeAvatar(target,{x:160,y:160,radius:70,appearance:'cute-v2',emotion:'focused'},{telekinesis:stage},timestamp);return recordedY;});};`;
const hook=`window.__formsQA={async stage(family,stage){closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();save=normalizeSave({schemaVersion:29,tutorialStep:'done',onboarding:{enabled:false},unlockedMutations:[family],mutationLevels:{[family]:stage},activeMutationPool:[family],selectedMutation:family,sound:false});session=null;newDraft();session.foods=[foodForMutation(family)];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();await preloadMenuAppearance({[family]:stage});await window.SlimeAvatarRenderer.whenReady();drawMenuSlime(performance.now());return {level:mutationLevel(family),food:session.foods[0].stage,ultimate:selectedUltimateStage(family),variant:elementalBodyVariant({[family]:stage})};}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+phantomHook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.SlimeGameDebug&&window.__formsQA,null,{timeout:60000});
 fs.mkdirSync('outputs/elemental-forms-655',{recursive:true});
 const variants={fire:['fireWarm','fireVolcano','fireUltra'],frost:['frostChilled','frostFreezing','frostUltra'],electric:['electricSparks','electricCharged','electricUltra'],nano:['technoImplants','technoUpgraded','technoUltra'],telekinesis:['psionicsBudding','psionicsCrowned','psionicsUltra'],cloning:['sporesStage1','sporesStage2','sporesUltra'],phantom:['phantomAwakening','phantomShifting','phantomUltra'],glitch:['glitchFragments','glitchArcade','glitchUltra'],cosmos:['','cosmosPetrifying','cosmosUltra']};
 for(const family of Object.keys(variants))for(const stage of [1,2,3]){
  const state=await page.evaluate(([family,stage])=>window.__formsQA.stage(family,stage),[family,stage]);
  assert.equal(state.food,stage);assert.equal(state.ultimate,stage);assert.equal(state.variant,variants[family][stage-1]);
  if(family==='phantom'){
   const spirits=await page.evaluate(()=>window.__formsQA.spirits());
   assert.equal(spirits,stage===3?2:0,'Ghost companions belong only to Phantom III');
  }
  await page.waitForTimeout(250);await page.screenshot({path:`outputs/elemental-forms-655/live-${family}-${stage}.png`});
 }
 const poseII=await page.evaluate(()=>window.__formsQA.psionicPoses(2)),poseIII=await page.evaluate(()=>window.__formsQA.psionicPoses(3));
 assert.equal(poseII[0],poseII[1],'Psionic II should not levitate');
 assert.equal(poseIII[0],poseIII[1],'Psionic III no longer levitates');
 await page.setViewportSize({width:1100,height:560});
 for(const [family,file] of [['fire','fire-forms-653.html'],['frost','frost-forms-655.html'],['electric','electric-forms-656.html'],['nano','techno-forms-657.html'],['telekinesis','psionics-forms-658.html'],['cloning','spores-forms-659.html'],['phantom','phantom-forms-661.html'],['glitch','glitch-forms-662.html'],['cosmos','cosmos-forms-663.html']]){
  await page.goto(`http://127.0.0.1:8766/editors/${file}`);await page.waitForFunction(()=>window.previewReady,null,{timeout:20000});await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>window.previewPaused=true);await page.waitForTimeout(30);
  await page.evaluate(family=>window[`${family}FormsPreview`].draw(1000),family);
  await page.screenshot({path:`outputs/elemental-forms-655/${family}-three-stages.png`});
 }
 const overlayPixel = await page.evaluate(async()=>{
  await SlimeAvatarRenderer.preloadAppearance({bodyVariant:'frostFreezing'});
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  SlimeAvatarRenderer.drawSlimeAvatar(ctx,{x:256,y:256,radius:512/2.36,bodyVariant:'frostFreezing',appearance:'cute-v2',emotion:'focused',afterLayer(layer){layer.fillStyle='#0000ff';layer.fillRect(-150,-150,300,300);}});
  return Array.from(ctx.getImageData(300,260,1,1).data);
 });
 assert.deepEqual(overlayPixel,[0,0,255,255],'Frost II must not add a legacy nose layer over the final overlay');
 assert.deepEqual(errors,[]);console.log('27 forms passed: correct stages and bodies, Phantom spirits only on III, no Psionic hover, no JavaScript errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
