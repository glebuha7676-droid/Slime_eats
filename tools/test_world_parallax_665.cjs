const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright'),sharp=require('sharp');
const out='outputs/world-parallax-665';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__parallaxQA={
 async start(id){
  if(run)cancelAnimationFrame(run.animationId);
  closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();
  save=normalizeSave({schemaVersion:29,world:id,unlockedWorlds:[1,3,4],tutorialStep:'done',onboarding:{enabled:false},sound:false});
  session=null;newDraft();session.foods=[foodForMutation('ice')];session.offerTransition=false;session.rerollPending=false;
  clearMenuMutationPresentation();startDrop({fromPortal:true});cancelAnimationFrame(run.animationId);run.paused=true;
  run.launchEntryUntil=0;run.launchEntryStartedAt=0;run.shake=0;
  await Promise.all(ensureWorldBackgroundLayers(id).map(l=>l.image.decode()));
  await Promise.all(Object.values(ensureWorldSprites(id)).map(i=>i.decode().catch(()=>{})));
  return {id:run.worldId,layers:ensureWorldBackgroundLayers(id).map(l=>({source:l.image.src,speed:l.speed,size:[l.image.naturalWidth,l.image.naturalHeight]}))};
 },frame(camera,clearPassage=false){
  run.cameraY=camera;run.slime.y=camera+215;run.slime.vx=0;run.slime.vy=120;
  if(clearPassage)for(const block of run.blocks)if(block.col>=2&&block.col<=3&&block.y<camera+640&&block.y>camera-100)block.dead=true;
  const occupied=new Set(run.blocks.filter(b=>!b.dead&&Math.abs(b.y+b.h/2-run.slime.y)<b.h*.6).map(b=>b.col));
  const lane=Array.from({length:run.columns},(_,i)=>i).filter(i=>!occupied.has(i));
  run.slime.x=(lane[Math.floor(lane.length/2)]??2)*run.cellSize+run.cellSize/2;
  renderCanvas(4000);return {camera:run.cameraY,slimeY:run.slime.y,world:run.worldId};
 }};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],failed=[],records=[];
 try{
 const page=await browser.newPage({viewport:{width:1120,height:900},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8766/editors/world-parallax-665.html');await page.evaluate(()=>parallaxReady);await page.locator('#toggle').click();
 await page.evaluate(()=>drawParallaxPreview(1800));await page.screenshot({path:`${out}/three-worlds.png`});
 // Pixel-level coverage at arbitrary scroll positions, negative entry camera,
 // fractional DPR, and both sides of every reflection boundary.
 const rasterChecks=await page.evaluate(()=>{
  const results=[];const canvas=document.createElement('canvas');canvas.width=550;canvas.height=1050;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.setTransform(1.25,0,0,1.25,0,.37);
  const sample=document.createElement('canvas');sample.width=8;sample.height=12;
  const sc=sample.getContext('2d');sc.fillStyle='rgba(220,160,80,.5)';sc.fillRect(0,0,8,12);
  const image={complete:true,naturalWidth:8,naturalHeight:12};
  // Real canvas is itself a CanvasImageSource; natural dimensions describe its tile.
  Object.assign(sample,image);
  for(const speed of [.08,.26])for(const camera of [-700,-68,0,42,2538.3,660/speed-.01,660/speed+.01,1320/speed+.01,60000]){
   ctx.clearRect(0,0,440,840);const draws=SlimeWorldBackground.draw(ctx,{layers:[{image:sample,speed,opacity:1}],width:440,height:840,cameraY:camera});
   const pixels=ctx.getImageData(100,1,1,1048).data;let min=255,max=0;for(let i=3;i<pixels.length;i+=4){min=Math.min(min,pixels[i]);max=Math.max(max,pixels[i]);}
   if(min<126||max>130)throw Error('Gap or doubled alpha at tile join: '+JSON.stringify({speed,camera,min,max}));
   results.push({speed,camera,min,max,draws});
  }
  for(const set of layers){
   if(set[0].speed>=set[1].speed||set[1].speed>=1)throw Error('Depth order is invalid');
   for(const l of set){
    const height=l.image.naturalHeight*440/l.image.naturalWidth;
    for(const camera of [-68,0,height/l.speed-.1,height/l.speed+.1,100000]){
     ctx.clearRect(0,0,440,840);const draws=SlimeWorldBackground.draw(ctx,{layers:[l],width:440,height:840,cameraY:camera});
     if(draws>4)throw Error('Unbounded tile count');
     if(l===set[0]){const pixels=ctx.getImageData(100,1,1,1048).data;for(let i=3;i<pixels.length;i+=4)if(pixels[i]!==255)throw Error('Opaque layer has a gap');}
    }
   }
  }
  return results;
 });
 fs.writeFileSync(`${out}/raster-checks.json`,JSON.stringify(rasterChecks,null,2));
 // Actual gameplay, isolated from the user's browser and save.
 const game=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1.5});
 game.on('pageerror',e=>errors.push(e.message));game.on('response',r=>{if(r.status()>=400)failed.push({status:r.status(),url:r.url()});});
 await game.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await game.goto('http://127.0.0.1:8766/');await game.waitForFunction(()=>window.__parallaxQA&&window.SlimeGameDebug,null,{timeout:60000});
 for(const [id,name] of [[1,'stone'],[3,'candy'],[4,'magma']]){
  const record=await game.evaluate(id=>__parallaxQA.start(id),id);records.push(record);await game.waitForTimeout(120);
  await game.evaluate(()=>__parallaxQA.frame(1800));await game.screenshot({path:`${out}/${name}-game.png`});
  await game.evaluate(()=>__parallaxQA.frame(1800,true));await game.screenshot({path:`${out}/${name}-cleared-passage.png`});
  assert.equal(record.layers.length,2);assert(record.layers.every(l=>l.size[0]===768));
 }
 // A compact three-world movement preview made from the exact runtime renderer.
 const strips=[];
 for(let f=0;f<44;f++){
  const data=await page.evaluate(y=>{drawParallaxPreview(y);const c=document.createElement('canvas');c.width=660;c.height=400;const ctx=c.getContext('2d');canvases.forEach((a,i)=>ctx.drawImage(a,i*220,0,220,400));return c.toDataURL('image/png').split(',')[1];},600+f*42);
  strips.push({input:Buffer.from(data,'base64'),left:0,top:f*400});
 }
 await sharp({create:{width:660,height:400*44,channels:4,background:'#102c3e'}}).composite(strips).png().toFile(`${out}/animation-strip.png`);
 fs.writeFileSync(`${out}/checks.json`,JSON.stringify({errors,failed,records},null,2));
 assert.deepEqual(errors,[]);
 assert.equal(failed.filter(r=>r.url.includes('/backgrounds/parallax-v3/')).length,0);
 console.log('Three worlds: two loaded layers each; alpha joins/negative camera/fractional DPR/long scroll passed; actual gameplay rendered without page errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
