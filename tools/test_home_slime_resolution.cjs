const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const consoleHook=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=consoleHook+`window.__slimeSharpQA={
 async pose(id='classic',stage=1){
   __consoleQA.home(id==='classic'?'fire':id,stage);
   if(id!=='classic')session.foods=[session.offer.find(Boolean)];
   syncMenuCategoryVisuals({instant:true});
   await preloadMenuAppearance(menuCategoryLevels());
   await window.SlimeAvatarRenderer.whenReady();
   cancelAnimationFrame(menuSlimeAnimationId);menuSlimeAnimationId=0;
   drawMenuSlime(2000);
 },
 paint(){cancelAnimationFrame(menuSlimeAnimationId);menuSlimeAnimationId=0;drawMenuSlime(2000);}
};`;
const baseline=process.argv.includes('--before'),out='output/home-slime-sharpness/'+(baseline?'before':'after');
fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const records=[],errors=[];
 for(const config of [{width:440,height:840,dpr:1},{width:390,height:844,dpr:2},{width:320,height:568,dpr:3},{width:1280,height:900,dpr:1}]){
  const page=await browser.newPage({viewport:{width:config.width,height:config.height},deviceScaleFactor:config.dpr});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/?v=slime-sharpness');
  await page.waitForFunction(()=>window.__slimeSharpQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  await page.evaluate(()=>__slimeSharpQA.pose());await page.waitForTimeout(120);await page.evaluate(()=>__slimeSharpQA.paint());
  const measure=()=>page.locator('#menuSlimeCanvas').evaluate(c=>{const r=c.getBoundingClientRect();return {width:c.width,height:c.height,cssWidth:r.width,cssHeight:r.height,pixelRatio:c.width/c.clientWidth,bytes:c.width*c.height*4,transform:c.getContext('2d').getTransform().a,filter:getComputedStyle(c).filter}});
  const metrics=await measure();records.push({config,metrics});
  if(!baseline){assert(metrics.pixelRatio>=Math.min(config.dpr,2)-.01,'Canvas must match display density, capped at 2x');assert(metrics.bytes<=1024*1024*4,'Bounded canvas allocation');assert(Math.abs(metrics.transform-metrics.width/260)<.001);}
  await page.screenshot({clip:await page.locator('#slime').boundingBox(),path:`${out}/classic-${config.width}-${config.dpr}x.png`});
  if(config.width===440){
   for(const [id,stage] of [['fire',1],['frost',2],['cosmos',2]]){
    await page.evaluate(([id,stage])=>__slimeSharpQA.pose(id,stage),[id,stage]);await page.waitForTimeout(120);await page.evaluate(()=>__slimeSharpQA.paint());
    await page.screenshot({clip:await page.locator('#slime').boundingBox(),path:`${out}/${id}-${stage}.png`});
   }
   await page.screenshot({path:out+'/home.png'});
   await page.setViewportSize({width:320,height:568});await page.waitForTimeout(300);await page.evaluate(()=>__slimeSharpQA.paint());
   const resized=await measure();records.push({resized});
   if(!baseline)assert(resized.pixelRatio>=.99,'Canvas follows layout resize');
   const size=await page.locator('#menuSlimeCanvas').evaluate(c=>c.width);
   await page.evaluate(()=>__slimeSharpQA.paint());assert.equal(await page.locator('#menuSlimeCanvas').evaluate(c=>c.width),size,'No allocations per frame');
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/checks.json',JSON.stringify({records,errors},null,2));console.log(JSON.stringify({baseline,records,errors}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
