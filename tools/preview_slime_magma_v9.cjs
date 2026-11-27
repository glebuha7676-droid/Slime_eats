// Inspect real runs with isolated storage and the established terrain QA hook.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const terrain=fs.readFileSync('tools/verify_mutation_terrain_v3.cjs','utf8');
const hook=base+terrain.match(/const hook=base\+`([\s\S]*?)`;/)[1];
const out='output/concepts/slime-magma-blocks-v9';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const report=[],errors=[],missing=[];
 try {
  for(const width of [440,320]) {
   const page=await browser.newPage({viewport:{width,height:840}});
   page.on('pageerror',e=>errors.push(e.stack));
   page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))missing.push(r.url());});
   await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await page.goto('http://127.0.0.1:8766/?v=slime-magma-9');
   await page.waitForFunction(()=>window.__terrainQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   for(const world of [1,4]) {
    const state=await page.evaluate(w=>__terrainQA.run(w),world);
    assert.equal(state.world,world);
    assert(state.materials.every(m=>m.width===384));
    assert(state.materials.every(m=>m.src.includes(world===1?'slime-blocks-v6':'rounded-blocks-v4')));
    if(world===1)assert(state.materials[0].src.includes('bubbles-v9'));
    await page.waitForTimeout(250);await page.evaluate(()=>__terrainQA.paint());
    await page.screenshot({path:`${out}/run-${world}-${width}.png`});report.push({width,...state});
   }
   const aliases=await page.evaluate(()=>['assets/Мир 4/Непрочный блок.webp','assets/Мир 4/Обычный блок.webp','assets/Мир 4/Прочный блок.webp','assets/world1/slime-blocks-v6/block-fragile-soft-v8.webp'].map(s=>SlimeAssetPaths.resolve(s)));
   assert(aliases.slice(0,3).every(s=>s.includes('/rounded-blocks-v4/')));assert(aliases[3].includes('bubbles-v9'));
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:960,height:550}});
  await page.goto('http://127.0.0.1:8766/'+out+'/preview.html');
  await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  await page.screenshot({path:out+'/preview.png',fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({report,errors,missing},null,2));
  console.log('Worlds 1/4 at 440/320px: current materials decoded, legacy aliases passed, no missing assets or JS errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
