const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const extra=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+extra+`window.__portalQA={
 prepare(world=1,fed=true){__consoleQA.home('fire',1);save.planetCampaign=PLANETS.normalize({unlocked:['home','candy','magma','desert'],selected:PLANETS.forWorld(world).id});save.world=world;carouselWorldId=world;session.foods=fed?[session.offer.find(Boolean)]:[];recalcStats();renderDraft();clearMenuMutationPresentation();syncWorldStartButton(true);SlimeHomeConsole.layout();},
 state(){return {screen:document.body.dataset.screen,launching:menuLaunchInProgress,phase:run?.evacuation?.phase,energy:run?.energy,ended:run?.ended,arrivalY:run?.arrivalPortalScreenY,hudBottom:run?runHudBottomLogical():null,frames:SlimePortalWindow.stats(),hits:window.__portalDraws||[]};},
 menu(){renderPanel('wardrobe');},close(){closePanel();},
 exhaust(){if(!run)__energyQA.start();cancelAnimationFrame(run.animationId);run.slime.y=run.blocks.find(b=>b.row===18).y-150;run.cameraY=run.slime.y-260;run.energy=0;endRun(false,'Нет силы');run.lastTime=0;run.animationId=requestAnimationFrame(gameFrame);},
 stop(){if(run)cancelAnimationFrame(run.animationId);}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const dir='output/portal-window-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:440,height:840}}),errors=[],failed=[];page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))failed.push(r.url());});
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  const portalSource=fs.readFileSync('js/rendering/portal-window.js','utf8');
  await page.route('**/js/rendering/portal-window.js*',r=>r.fulfill({contentType:'application/javascript',body:portalSource+`;{const original=SlimePortalWindow;window.__portalDraws=[];window.SlimePortalWindow={...original,draw(ctx,o){window.__portalDraws.push({scene:o.scene,world:o.world,y:o.y,width:o.width});if(window.__portalDraws.length>15)window.__portalDraws.shift();return original.draw(ctx,o);}};}`}));
  await page.goto('http://127.0.0.1:8766/?v=sky-core-1');await page.waitForFunction(()=>window.__portalQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000,polling:250});
  const labBackdrop=await page.evaluate(()=>getComputedStyle(document.body).backgroundImage);
  await page.evaluate(()=>__portalQA.prepare(1,false));await page.waitForTimeout(350);
  assert.equal(await page.locator('#launchPortal').evaluate(n=>getComputedStyle(n).opacity),'0');
  assert(!await page.evaluate(()=>SlimePortalWindow.stats().homeLoop),'The unfed slime leaves the portal off');
  for(const world of [1,3,4,5]){
   await page.evaluate(id=>__portalQA.prepare(id),world);await page.waitForFunction(()=>Number(getComputedStyle(document.getElementById('launchPortal')).opacity)>.99);await page.waitForTimeout(450);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundImage),labBackdrop);
   assert(await page.evaluate(id=>SlimePortalWindow.stats().cachedScenes.some(key=>key===`mine-${id}`||key.startsWith(`mine-${id}-`)),world));
   const root=page.locator('#launchPortal');assert.equal(await root.evaluate(n=>getComputedStyle(n).display),'block');assert.equal(await root.evaluate(n=>getComputedStyle(n).opacity),'1');assert.equal(await root.getAttribute('data-portal-world'),String(world));
   const registration=await page.evaluate(()=>{
    const root=document.getElementById('launchPortal'),front=document.getElementById('launchPortalFront'),r=root.getBoundingClientRect(),f=front.getBoundingClientRect(),a=document.getElementById('app').getBoundingClientRect(),x=front.getContext('2d');
    const alphas=[];for(let i=0;i<8;i++){const angle=i*Math.PI/4,px=(r.x+r.width/2+Math.cos(angle)*r.width/2-f.x)/f.width*front.width,py=(r.y+r.height/2+Math.sin(angle)*r.height/2-f.y)/f.height*front.height;const data=x.getImageData(Math.round(px)-1,Math.round(py)-1,3,3).data;let sum=0;for(let n=3;n<data.length;n+=4)sum+=data[n];alphas.push(sum/9);}
    return {left:r.x-a.x,top:r.y-a.y,width:r.width,height:r.height,appWidth:a.width,alphas,front:Number(getComputedStyle(front).zIndex),slime:Number(getComputedStyle(document.getElementById('slime')).zIndex)};
   });
   for(const [key,native]of Object.entries({left:296,top:192,width:312,height:314}))assert(Math.abs(registration[key]-native/907*registration.appWidth)<1,'Portal follows the measured inner outline');
   assert(registration.alphas.every(a=>a>25),'Front energy covers the portal contour');assert(registration.front<registration.slime,'The slime stays in front of the entire portal');assert.equal(await page.locator('.slime-center-stage').evaluate(n=>getComputedStyle(n).isolation),'auto','The slime is not trapped beneath the ring in a separate stacking context');
   await page.screenshot({path:dir+'/home-world-'+world+'.png'});
   if(world===1){
    const r=await root.boundingBox();await page.locator('#slime').evaluate(n=>n.style.visibility='hidden');
    await page.screenshot({path:dir+'/aperture-reference-fit.png',clip:{x:Math.max(0,r.x-42),y:Math.max(0,r.y-35),width:r.width+84,height:r.height+70}});
    await page.locator('#slime').evaluate(n=>n.style.visibility='');
    fs.writeFileSync(dir+'/registration.json',JSON.stringify(registration,null,2));
   }
  }
  await page.evaluate(()=>__portalQA.prepare(1));await page.waitForTimeout(180);
  await page.evaluate(()=>__portalQA.menu());await page.waitForTimeout(100);const before=(await page.evaluate(()=>__portalQA.state())).frames.homeFrames;await page.waitForTimeout(220);assert.equal((await page.evaluate(()=>__portalQA.state())).frames.homeFrames,before,'Hidden portal animation is paused');
  await page.evaluate(()=>__portalQA.close());await page.waitForTimeout(120);assert((await page.evaluate(()=>__portalQA.state())).frames.homeFrames>before,'The fed portal resumes when the panel closes');
  await page.waitForFunction(()=>!document.getElementById('worldStartBtn').disabled);await page.locator('#worldStartBtn').click();
  await page.waitForTimeout(600);let s=await page.evaluate(()=>__portalQA.state());assert.equal(s.screen,'home');assert(s.launching);assert(await page.locator('#launchPortalFront').evaluate(n=>Number(getComputedStyle(n).zIndex)<Number(getComputedStyle(document.getElementById('slime')).zIndex)),'The portal stays behind the slime during suction too');assert.equal(await page.locator('#launchPortal').evaluate(n=>getComputedStyle(n).opacity),'1');assert(await page.locator('#slime').evaluate(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).a<.8),'The slime is visibly entering the portal');
  assert(s.frames.cachedScenes.includes('mine-1-100'),'The selected shaft is shown when launching');
  await page.screenshot({path:dir+'/departure-visible.png'});
  await page.waitForTimeout(180);await page.screenshot({path:dir+'/departure-inside.png'});
  await page.waitForFunction(()=>__portalQA.state().screen==='drop',null,{timeout:4000});await page.waitForTimeout(170);s=await page.evaluate(()=>__portalQA.state());
  assert(s.arrivalY>s.hudBottom+50,'Arrival portal is below the HUD');assert(s.hits.some(h=>h.scene==='lab'&&h.width===116));
  await page.screenshot({path:dir+'/arrival-laboratory.png'});
  await page.evaluate(()=>__portalQA.exhaust());await page.waitForFunction(()=>__portalQA.state().phase==='open');await page.waitForTimeout(400);
  s=await page.evaluate(()=>__portalQA.state());assert(s.frames.labReady);assert(s.frames.cachedScenes.includes('lab'));assert(s.hits.some(h=>h.scene==='lab'&&h.width===150),'Rescue shares the renderer and shows the laboratory');
  await page.screenshot({path:dir+'/rescue-laboratory.png'});await page.waitForFunction(()=>__portalQA.state().ended,null,{timeout:6000});
  for(const viewport of [{width:320,height:568},{width:390,height:844}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(180);await page.evaluate(()=>__portalQA.prepare());await page.waitForTimeout(300);
   const r=await page.locator('#launchPortal').boundingBox(),app=await page.locator('#app').boundingBox();assert(r.x>=app.x&&r.x+r.width<=app.x+app.width);
   await page.screenshot({path:dir+'/home-'+viewport.width+'.png'});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);const checks={unfedPortalOff:true,fedPortalShowsMine:true,slimeAbovePortal:true,departureVisible:true,currentMineLayers:[1,3,4],arrivalVisible:true,laboratoryReturn:true,sharedRenderer:true,hiddenPaused:true,narrowLayout:true,noAssetErrors:true,errors};fs.writeFileSync(dir+'/checks.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
