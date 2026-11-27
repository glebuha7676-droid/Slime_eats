// Isolated browser profile: visual QA of the real candy generator and asset redirects.
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+energy+`window.__candyBlocks={
 async show(){
  __energyQA.start('fire',1,123,3);cancelAnimationFrame(run.animationId);
  const sprites=ensureWorldSprites(3),names=['cookie-packed','candy-normal','candy-reinforced'];
  const images=[...names.map(n=>sprites[n]),...ASSETS.ensureWorldBackgroundLayers(3).map(l=>l.image),...names.map(n=>ASSETS.projectSprite(SlimeWorldCatalog.assetSource(3,n)))];
  await Promise.all(images.map(im=>im.decode().catch(()=>{})));
  let first=7;for(let row=7;row<run.rowCount-12;row++){
   const field=run.blocks.filter(b=>!b.dead&&b.row>=row&&b.row<row+10&&!b.hazard&&!b.flaskTier&&!b.special);
   if(['dense','hard','reinforced'].every(t=>field.filter(b=>b.tier===t).length>=3)){first=row;break;}
  }
  run.cameraY=285+first*run.cellSize;run.slime.y=run.cameraY+220;run.slime.x=run.cellSize*2.5;run.slime.vx=run.slime.vy=0;run.launchEntryUntil=0;
  updateRunUI();renderCanvas(performance.now());return {world:run.worldId,images:names.map(n=>({name:n,src:sprites[n].src,width:sprites[n].naturalWidth})),mapping:SlimeAssetPaths.resolve('assets/Мир 3/Прочный блок.webp')};
 },paint(){renderCanvas(performance.now());}
};`;
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/candy-blocks-v1';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:440,height:840},{width:320,height:568}]){
  const p=await b.newPage({viewport}),errors=[],missing=[];p.on('pageerror',e=>errors.push(e.stack));p.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))missing.push(r.url());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=candy-blocks-1');await p.waitForFunction(()=>window.__candyBlocks&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  const state=await p.evaluate(()=>__candyBlocks.show());await p.waitForTimeout(750);await p.evaluate(()=>__candyBlocks.paint());
  assert.equal(state.world,3);assert(state.images.every(i=>i.width===384&&i.src.includes('/candy-blocks-v1/')));assert(state.mapping.endsWith('berry-candy-strong-v2.webp'));assert(await p.locator('#shaft').isVisible());
  await p.screenshot({path:dir+'/candy-'+viewport.width+'.png'});assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log(JSON.stringify({viewport,...state,errors,missing}));await p.close();
 }}finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
