// Visual QA of the new resource overlays, alias resolution and HUD jar.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out='output/concepts/mutagen-organic-v29';
const path=require('node:path'),{pathToFileURL}=require('node:url');const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const terrain=fs.readFileSync('tools/verify_mutation_terrain_v3.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1].replace('this.home(world);','this.home(world,0);').replace('const names=world===1?','const names=[1,6].includes(world)?');
const hook=base+terrain+`window.__bloomsQA={async show(world){await __terrainQA.run(world);const sprites=ensureWorldSprites(world);await Promise.all(['ground-weak-liquid','stone-liquid','stone-reinforced-liquid'].map(n=>sprites[n].decode()));run.cameraY=285+7*run.cellSize;run.slime.y=run.cameraY+210;run.slime.x=run.cellSize*2.5;let counts=[0,0,0];for(const b of run.blocks)if(b.row>=7&&b.row<18&&!b.hazard&&!b.special&&!b.dead){b.flaskTier=b.col%3+1;b.flaskValue=FLASK_VALUES[b.flaskTier];b.flaskGranted=false;counts[b.flaskTier-1]++;}updateRunUI();renderCanvas(performance.now());return {world:run.worldId,counts,values:[1,2,3].map(t=>FLASK_VALUES[t]),overlays:['ground-weak-liquid','stone-liquid','stone-reinforced-liquid'].map(n=>({src:sprites[n].src,width:sprites[n].naturalWidth})),jar:document.querySelector('#runResearchHud img').src,aliases:['assets/ui/anomaly-fluid-v2/jar.webp','assets/ui/currency/anomaly-jar-v1.webp','assets/ui/research-flask-blue-v1.webp','assets/ui/mutation-essence-v1/essence-5.webp','assets/ui/mutation-flowers-v19/jar.webp','assets/ui/mutation-flowers-v19/infection-5.webp','assets/ui/mutation-wrap-v21/jar.webp','assets/ui/mutation-wrap-v21/infection-1.webp','assets/ui/mutation-contour-v23/infection-3.webp','assets/ui/mutation-readable-v22/infection-1.webp'].map(s=>SlimeAssetPaths.resolve(s))};}};`;
(async()=>{
 fs.writeFileSync('tmp/organic-v29-game.js',source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {'));fs.writeFileSync('tmp/organic-v29.html',fs.readFileSync('index.html','utf8').replace(/<head\b[^>]*>/,m=>m+'<base href="../">').replace(/<script src="game\.js[^"]*"><\/script>/,'<script src="tmp/organic-v29-game.js"></script>'));
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[],missing=[],records=[];
 try{
  const lab=await browser.newPage({viewport:{width:1120,height:640}});await lab.goto(pathToFileURL(path.resolve(out+'/preview.html')).href);await lab.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));await lab.screenshot({path:out+'/preview.png',fullPage:true});
  for(const width of [440,320]){
   const p=await browser.newPage({viewport:{width,height:840}});p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))missing.push(r.url())});
   await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
   await p.goto(pathToFileURL(path.resolve('tmp/organic-v29.html')).href);await p.waitForFunction(()=>window.__bloomsQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   for(const world of [1,3,4,5,6]){
    const state=await p.evaluate(w=>__bloomsQA.show(w),world);assert.equal(state.world,world);assert.deepEqual(state.values,[1,3,5]);assert(state.counts.every(n=>n>0));assert(state.overlays.every((m,i)=>m.src.includes(i===2?'/mutation-growth-v24/':'/mutation-organic-v29/')&&m.width===384));assert(state.jar.includes('/mutation-readable-v22/jar.webp'));assert(state.aliases.every((s,i)=>s.includes([7,8,9].includes(i)?'/mutation-organic-v29/':[3,5].includes(i)?'/mutation-growth-v24/':'/mutation-readable-v22/')));
    await p.locator('#runResearchHud img').evaluate(i=>i.decode());await p.waitForTimeout(150);await p.evaluate(()=>__terrainQA.paint());await p.screenshot({path:`${out}/world-${world}-${width}.png`});records.push({width,...state});
    if(width===440){await p.evaluate(w=>__terrainQA.run(w),world);await p.waitForTimeout(700);await p.evaluate(()=>__terrainQA.paint());await p.screenshot({path:`${out}/natural-world-${world}.png`,animations:'disabled'});}
   }
   await p.close();
  }
  const manifest=JSON.parse(fs.readFileSync(out+'/runtime-manifest.json','utf8'));const cover=manifest.filter(m=>m.key.startsWith('infection')).map(m=>m.coverage);assert(cover[0]<cover[1]&&cover[1]<cover[2],'+1/+3/+5 coverage must increase');
  const sap=manifest.filter(m=>m.key.startsWith('infection')).map(m=>m.sapCoverage);assert(sap[0]<sap[1]&&sap[1]<sap[2],'Visible yellow-lime liquid must increase by stage');
  const jar=manifest.find(m=>m.key==='jar'),jb=jar.visibleBounds,old=jar.previousBounds;assert(jb[2]-jb[0]<=old[2]-old[0]&&jb[3]-jb[1]<=old[3]-old[1],'Jar must not grow');
  assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);fs.writeFileSync(out+'/verification.json',JSON.stringify({records,cover,sap,errors,missing},null,2));console.log('2 center-grown overlays, unchanged final stage and jar: 5 worlds at 440/320px; +1/+3/+5 coverage increases, reward values 1/3/5 preserved, aliases and image loads passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
