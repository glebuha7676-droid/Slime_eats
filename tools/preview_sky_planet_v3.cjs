const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.skyPlanetPreview=()=>{__consoleQA.home('fire',2);save.world=5;save.unlockedWorlds=[1,3,4,5];save.planetCampaign=PLANETS.normalize({selected:'desert',cores:{desert:37},unlocked:PLANETS.ids});session=null;newDraft();renderDraft();renderWorldCarousel();syncInteractionLayers();};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/concepts/sky-planet-v3';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:440,height:840},{width:320,height:568}]){
  const p=await browser.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')console.log('Browser:',m.text());});
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8767/?v=sky-planet-3');await p.waitForTimeout(5000);console.log('Boot',await p.evaluate(()=>({state:document.documentElement.className,hook:!!window.skyPlanetPreview,debug:!!window.SlimeGameDebug,text:document.body.innerText.slice(-500)})));await p.waitForFunction(()=>window.skyPlanetPreview&&document.documentElement.classList.contains('app-ready'),null,{timeout:60000});
  await p.evaluate(()=>skyPlanetPreview());await p.waitForTimeout(1600);
  const state=await p.evaluate(()=>{const img=document.querySelector('.planet-card.is-selected .planet-image'),panel=document.querySelector('#homePlanetsPanel'),b=img.getBoundingClientRect(),r=panel.getBoundingClientRect();return {src:img.src,loaded:img.complete&&img.naturalWidth>0,image:{top:b.top,left:b.left,width:b.width,height:b.height},panel:{top:r.top,bottom:r.bottom,left:r.left,right:r.right}};});
  assert(state.loaded&&state.src.includes('sky-v3'));assert.deepEqual(errors,[]);
  await p.screenshot({path:dir+'/home-'+viewport.width+'.png'});fs.writeFileSync(dir+'/layout-'+viewport.width+'.json',JSON.stringify(state,null,2));console.log(JSON.stringify({viewport,...state,errors}));await p.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
