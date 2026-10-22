const fs=require('node:fs'),sharp=require('sharp'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__worldArtPreview={home(){closeOnboardingMemo(true);closePanel();clearMenuMutationPresentation();save=normalizeSave({schemaVersion:29,world:1,unlockedWorlds:[1,3,4],tutorialStep:'done',onboarding:{enabled:false},sound:false});session=null;newDraft();showScreen('home');renderDraft();},select(world){selectHomeWorld(world);window.SlimeHomeConsole.layout();}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const out='outputs/world-previews-664';fs.mkdirSync(out,{recursive:true});
 const errors=[],records=[];
 for(const viewport of [{width:467,height:634},{width:390,height:844},{width:320,height:568}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:2});page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__worldArtPreview&&window.SlimeGameDebug,null,{timeout:60000});
  await page.evaluate(()=>window.__worldArtPreview.home());await page.evaluate(()=>document.fonts.ready);
  for(const [id,name] of [[1,'stone'],[3,'candy'],[4,'magma']]){
   await page.evaluate(id=>window.__worldArtPreview.select(id),id);
   await page.locator('#worldTerminalPreview').evaluate(image=>image.decode());await page.waitForTimeout(170);
   const record=await page.evaluate(()=>{const world=document.getElementById('worldCarousel'),image=document.getElementById('worldTerminalPreview'),title=document.getElementById('worldTerminalName');return {image:image.getAttribute('src'),name:title.textContent,meters:document.getElementById('worldTerminalNumber').textContent,locked:world.classList.contains('locked'),world:world.getBoundingClientRect().toJSON(),imageSize:[image.naturalWidth,image.naturalHeight],titleOverflows:title.scrollWidth>title.clientWidth+1};});
   records.push({viewport,id,...record});
   await page.screenshot({path:`${out}/${viewport.width}-${name}-home.png`});
   const r=record.world,app=await page.locator('#app').boundingBox();
   const x=Math.max(0,app.x),y=Math.max(0,r.y-23),width=Math.min(app.width,viewport.width-x),height=Math.min(r.height+36,viewport.height-y);
   await page.screenshot({path:`${out}/${viewport.width}-${name}-niche.png`,clip:{x,y,width,height}});
  }
  await page.close();
 }
 fs.writeFileSync(`${out}/layout-checks.json`,JSON.stringify({errors,records},null,2));
 const cards=[];for(const name of ['stone','candy','magma']){
  const data=await sharp(`${out}/467-${name}-niche.png`).resize({width:800}).png().toBuffer();const {height}=await sharp(data).metadata();cards.push({data,height});
 }
 const totalHeight=cards.reduce((sum,c)=>sum+c.height,0)+24*4;
 let top=24;const inputs=cards.map(c=>{const item={input:c.data,left:24,top};top+=c.height+24;return item;});
 await sharp({create:{width:848,height:totalHeight,channels:4,background:'#20566c'}}).composite(inputs).png().toFile(`${out}/three-worlds-in-niche.png`);
 if(errors.length)throw Error(errors.join('\n'));
 if(records.some(record=>record.locked||record.titleOverflows||record.imageSize[0]!==1200))throw Error('World art was not displayed correctly; see layout-checks.json');
 console.log('Three world previews rendered in the game at 467, 390 and 320 px; titles fit and images loaded.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
