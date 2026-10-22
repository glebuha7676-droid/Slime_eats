const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const mode=process.argv.includes('--before')?'before':'after',out='outputs/psionic-press-669';fs.mkdirSync(out,{recursive:true});
const common=fs.readFileSync('tools/test_psionic_damage_666.cjs','utf8').match(/const hook=(`[^`]*`);/)[1],baseHook=vm.runInNewContext(common);
const extra=`window.__press669={
 async setup(){await __psiQA.setup(3);},
 seed(){__psiQA.cast(3);const p=run.telekinesisPress;
  for(const b of p.targets){b.flaskTier=b.hazard?0:1;b.flaskValue=b.hazard?0:1;b.flaskGranted=false;}
  return {targets:p.targets.length,spikes:p.targets.filter(b=>b.hazard).length};
 },measure(){
  const counters={},originals={},methods=['createLinearGradient','createRadialGradient','bezierCurveTo','stroke','transform','translate','rotate','scale','drawImage'];
  for(const key of methods){originals[key]=ctx[key];ctx[key]=function(...args){counters[key]=(counters[key]||0)+1;return originals[key].apply(this,args);};}
  try{for(let i=0;i<10;i++)__psiQA.frame(700);for(const key of methods)counters[key]=0;
   const start=performance.now();for(let i=0;i<80;i++)__psiQA.frame(700);const elapsed=performance.now()-start;
   return {msPerFrame:elapsed/80,perFrame:Object.fromEntries(methods.map(k=>[k,(counters[k]||0)/80]))};
  }finally{for(const key of methods)ctx[key]=originals[key];}
 },collapse(){
  const p=run.telekinesisPress,before=run.researchData;
  const expected=p.targets.reduce((sum,b)=>sum+(!b.dead&&!b.flaskGranted?b.flaskValue||0:0),0);
  let essenceCalls=0;const original=window.SlimeBlockBreakFeedback;
  window.SlimeBlockBreakFeedback={...original,emitEssence(...a){essenceCalls++;return original.emitEssence(...a);}};
  let elapsed;
  try{const start=performance.now();__psiQA.frame(1295);elapsed=performance.now()-start;}
  finally{window.SlimeBlockBreakFeedback=original;}
  return {ms:elapsed,expected,gain:run.researchData-before,essenceCalls,particles:run.particles.length,
   liveTargets:p.targets.filter(b=>!b.dead).length,
   liveSpikesInRange:run.blocks.filter(b=>b.hazard&&!b.dead&&b.row>=p.firstRow&&b.row<=p.lastRow).length,
   survivingOutside:run.blocks.filter(b=>b.hazard&&!b.dead&&(b.row<p.firstRow||b.row>p.lastRow)).length};
 },guards(){
  const block=run.blocks.find(b=>b.hazard&&!b.dead);return {ordinary:destroyBlock(block,'impact',11000),storm:destroyBlock(block,'telekinesisStorm',11000),alive:!block.dead};
 },mixedRewards(){
  const p=run.telekinesisPress;let index=0;
  for(const b of p.targets){b.flaskTier=b.hazard?0:1+index%3;b.flaskValue=b.hazard?0:[1,3,5][index%3];b.flaskGranted=false;index++;}
  const already=p.targets.find(b=>!b.hazard);already.flaskGranted=true;
 },cacheStats(){return SlimePsionicFeedback.cacheStats?.()||null;}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let seed=669;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
 const source=fs.readFileSync('game.js','utf8');await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>baseHook+extra+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/');
 try{await page.waitForFunction(()=>window.SlimeGameDebug&&window.__press669,null,{timeout:25000});}
 catch(error){console.error({errors,boot:await page.locator('#bootStatus').textContent(),hook:await page.evaluate(()=>Boolean(window.__press669))});throw error;}
 await page.evaluate(()=>__press669.setup());const initial=await page.evaluate(()=>__press669.seed());
 await page.waitForTimeout(240);
 const render=await page.evaluate(()=>__press669.measure());await page.screenshot({path:`${out}/${mode}-press.png`});
 const collapse=await page.evaluate(()=>__press669.collapse());await page.screenshot({path:`${out}/${mode}-collapse.png`});
 const guards=await page.evaluate(()=>__press669.guards()),cache=await page.evaluate(()=>__press669.cacheStats());
 let mixed;
 if(mode==='after'){
  await page.evaluate(()=>__press669.setup());await page.evaluate(()=>__press669.seed());await page.evaluate(()=>__press669.mixedRewards());
  mixed=await page.evaluate(()=>__press669.collapse());assert.equal(mixed.gain,mixed.expected,'Mixed vein values and already granted rewards must be preserved');
 }
 const result={errors,initial,render,collapse,guards,cache,mixed};fs.writeFileSync(`${out}/${mode}.json`,JSON.stringify(result,null,2));
 assert.deepEqual(errors,[]);assert.equal(collapse.gain,collapse.expected);assert.equal(guards.alive,true);
 if(mode==='after'){
  assert(initial.spikes>0,'Spike enemies must be press targets');assert.equal(collapse.liveTargets,0);assert.equal(collapse.liveSpikesInRange,0);assert(collapse.survivingOutside>0);
  assert(collapse.essenceCalls<=1,'One consolidated collection burst');assert(collapse.particles<=24,'Bounded collapse particles');
  const before=JSON.parse(fs.readFileSync(`${out}/before.json`,'utf8'));
  assert(render.perFrame.bezierCurveTo<before.render.perFrame.bezierCurveTo*.5,'Pressure front paths must be cached');
  assert(render.perFrame.createLinearGradient<before.render.perFrame.createLinearGradient,'No new pressure gradient objects each frame');
 }
 console.log(JSON.stringify(result));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
