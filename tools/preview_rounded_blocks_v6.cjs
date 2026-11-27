// Read-only visual QA in isolated browser storage; reuse the established run hook.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const terrain=fs.readFileSync('tools/verify_mutation_terrain_v3.cjs','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+terrain.match(/const hook=base\+`([\s\S]*?)`;/)[1];
const out='output/concepts/rounded-blocks-v6';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const report=[],errors=[],missing=[];
 try {
  for(const width of [440,320]) {
   const page=await browser.newPage({viewport:{width,height:840}});
   page.on('pageerror',e=>errors.push(e.stack));
   page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))missing.push(r.url());});
   await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await page.goto('http://127.0.0.1:8766/?v=rounded-blocks-6');
   await page.waitForFunction(()=>window.__terrainQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   for(const world of [1,3]) {
    const state=await page.evaluate(w=>__terrainQA.run(w),world);
    assert.equal(state.world,world);
    assert(state.materials.every(m=>m.width===384));
    assert(state.materials.every(m=>m.src.includes(world===1?'slime-blocks-v6':m.name==='candy-normal'?'chocolate-normal':'candy-blocks-v2')));
    await page.waitForTimeout(250);await page.evaluate(()=>__terrainQA.paint());
    await page.screenshot({path:`${out}/run-${world}-${width}.png`});
    report.push({width,...state});
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({report,errors,missing},null,2));
  console.log('Worlds 1 and 3 passed at 440 and 320px; all current block images decoded, no JS errors or missing assets.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
