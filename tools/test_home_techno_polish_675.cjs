const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.__polish675={async fed(){__consoleQA.home('nano',3);session.foods=[foodForMutation('nano')];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();await preloadMenuAppearance({nano:3});await SlimeAvatarRenderer.whenReady();SlimeHomeConsole.layout();}};`;
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=675');await p.waitForFunction(()=>window.__polish675&&window.SlimeGameDebug);await p.evaluate(()=>document.fonts.ready);fs.mkdirSync('outputs/home-techno-675',{recursive:true});
 const records=[];
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:467,height:634}]){
  await p.setViewportSize(viewport);await p.evaluate(()=>__polish675.fed());await p.waitForTimeout(600);
  const portal=await p.locator('#launchPortal').evaluate(e=>{const r=e.getBoundingClientRect(),a=document.getElementById('app').getBoundingClientRect();return {x:(r.x-a.x)/a.width,y:(r.y-a.y)/a.width,w:r.width/a.width,h:r.height/a.width,opacity:getComputedStyle(e).opacity,clip:getComputedStyle(e).clipPath};});
  for(const [key,v]of Object.entries({x:354,y:186,w:318,h:330}))assert(Math.abs(portal[key]-v/1024)<.001);assert(Number(portal.opacity)>.99);assert(portal.clip.startsWith('ellipse'));records.push({viewport,portal});
  if(viewport.width===390){await p.screenshot({path:'outputs/home-techno-675/home.png'});await p.locator('#slime').evaluate(e=>e.style.visibility='hidden');await p.screenshot({path:'outputs/home-techno-675/portal.png'});await p.locator('#slime').evaluate(e=>e.style.removeProperty('visibility'));}
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/home-techno-675/checks.json',JSON.stringify(records,null,2));console.log('Portal aperture fits the room in 3 layouts; Techno III fed home renders without errors.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
