const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const dir='output/source-rock-tiers-v5';fs.mkdirSync(dir,{recursive:true});
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1].replace("['home','candy','magma']","['home','candy','magma','desert','source']");
const hook=base+energy+`window.__rockSpritesQA={
 async check(){
  __energyQA.start('fire',1,123,6);cancelAnimationFrame(run.animationId);
  await Promise.all(Object.values(ensureWorldSprites(6)).map(image=>image.decode()));
  const rows=[];
  for(const tier of ['dense','hard','reinforced'])for(const infected of [false,true]){
   const natural=run.blocks.find(b=>!b.dead&&!b.hazard&&!b.special&&b.tier===tier);
   const block={...natural,x:20,w:72,h:72,flaskTier:infected?({dense:1,hard:2,reinforced:3}[tier]):0};
   const calls=[],draw=ctx.drawImage;
   ctx.drawImage=function(image,...args){calls.push(image.currentSrc||image.src||'canvas');return draw.call(this,image,...args)};
   try{drawBlock(block,100,performance.now());}finally{ctx.drawImage=draw;}
   rows.push({tier,infected,exists:!!natural,calls});
  }
  run.cameraY=285;run.slime.y=run.cameraY+200;run.slime.x=220;run.slime.vx=run.slime.vy=0;
  await Promise.all(ensureWorldBackgroundLayers(6,100).map(l=>l.image.decode()));updateRunUI();renderCanvas(performance.now());return rows;
 },paint(){renderCanvas(performance.now());}
};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{const p=await browser.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8770/?v=source-rock-tiers-5');await p.waitForTimeout(3000);await p.waitForFunction(()=>window.__rockSpritesQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000});
 const rows=await p.evaluate(()=>__rockSpritesQA.check());
 for(const row of rows){const name={dense:'fragile',hard:'normal',reinforced:'strong'}[row.tier];assert(row.exists);assert(row.calls.some(src=>src.includes('/anomaly-blocks-v3/block-'+name+'.webp')),row.tier+' must use its own artwork');if(row.infected)assert(row.calls.some(src=>src.includes('/anomaly-veins-v3/vein-'+({dense:1,hard:3,reinforced:5}[row.tier])+'.webp')));}
 await p.waitForTimeout(300);await p.evaluate(()=>__rockSpritesQA.paint());await p.screenshot({path:dir+'/mine.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync(dir+'/checks.json',JSON.stringify({rows,errors},null,2));console.log(JSON.stringify({cases:rows.length,distinctSprites:3,infectedOverlays:true,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
