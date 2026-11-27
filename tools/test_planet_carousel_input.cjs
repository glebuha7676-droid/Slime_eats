const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const hook=base+`window.__carouselInput={
 seed(unlocked=true){save.planetCampaign=PLANETS.normalize(unlocked?{unlocked:PLANETS.ids,cores:{home:0,candy:0,magma:0,desert:0}}:null);syncWorldStartButton(stomachCanLaunch());SlimeHomeConsole.layout();},
 selected(){return save.planetCampaign.selected;}
};`;
(async()=>{
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
fs.mkdirSync('output/planet-carousel-input',{recursive:true});
try{for(const viewport of [{width:440,height:840},{width:390,height:844},{width:320,height:568},{width:1280,height:900}]){
 const p=await b.newPage({viewport,hasTouch:true,deviceScaleFactor:1}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=carousel-input-2');await p.waitForFunction(()=>window.__carouselInput&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
 await p.evaluate(()=>{__consoleQA.home('fire',2);__carouselInput.seed();});await p.waitForTimeout(350);
 const stage=await p.locator('.planet-stage').boundingBox(),right={x:stage.x+stage.width*.9,y:stage.y+stage.height*.5},left={x:stage.x+stage.width*.1,y:right.y};
 let index=0;const ids=['home','candy','magma','desert','source'];
 async function step(direction,hold=18){
  const point=direction===1?right:left;index=(index+direction+5)%5;
  await p.mouse.move(point.x,point.y);await p.mouse.down();
  assert.equal(await p.evaluate(()=>__carouselInput.selected()),ids[index],'Selection changes on pointer-down, before release');
  await p.waitForTimeout(hold);
  const drift=await p.evaluate(()=>{const s=document.querySelector('.planet-stage').getBoundingClientRect();return Math.max(...[...document.querySelectorAll('.planet-card')].filter(e=>Math.abs(+e.dataset.slot)<=1).map(e=>{const r=e.getBoundingClientRect();return Math.abs(r.y+r.height/2-s.y-s.height/2)}));});
  assert(drift<.55,`Press and carousel scale must never shift the vertical center: ${drift}`);
  await p.mouse.up();assert.equal(await p.evaluate(()=>__carouselInput.selected()),ids[index],'Pointer-up must not advance a second time');
 }
 // A normal finger-sized hold used to move the hitbox away and lose the click.
 await step(1,130);await p.waitForTimeout(280);
 await step(-1,130);await p.waitForTimeout(280);
 // More than one complete loop in each direction, alternating before animations finish.
 for(const direction of [1,1,1,1,1,1,1,-1,-1,-1,-1,-1,-1,-1,1,-1,1,-1])await step(direction);
 await p.waitForTimeout(320);
 const layout=await p.evaluate(()=>{
  const box=e=>e.getBoundingClientRect().toJSON(),hero=box(document.querySelector('.planet-card.is-selected')),panel=box(document.querySelector('#homePlanetsPanel')),title=box(document.querySelector('.planet-title')),number=box(document.querySelector('.planet-number'));
  return {hero,panel,title,number,sides:[...document.querySelectorAll('.planet-card')].filter(e=>Math.abs(+e.dataset.slot)===1).map(box),scroll:document.querySelector('#homePlanetsPanel').scrollLeft};
 });
 assert(layout.sides.every(s=>layout.hero.width>s.width*1.5),'Current planet is clearly larger');
 assert(Math.abs(layout.title.x+layout.title.width/2-layout.panel.x-layout.panel.width/2)<1,'Title centered without counter offset');
 assert(layout.title.y<layout.hero.bottom-5,'Title sits over the lower part of the planet');
 assert(layout.number.bottom<layout.title.y,'World number has a separate position');assert.equal(layout.scroll,0);
 const currentId=await p.evaluate(()=>__carouselInput.selected());
 await p.mouse.click(layout.hero.x+layout.hero.width*.08,layout.hero.y+layout.hero.height/2);
 assert.equal(await p.evaluate(()=>__carouselInput.selected()),currentId,'Tapping the settled current planet never navigates accidentally');
 await p.screenshot({path:`output/planet-carousel-input/home-${viewport.width}.png`});
 await p.evaluate(()=>__carouselInput.seed(false));await p.waitForTimeout(300);
 await p.touchscreen.tap(left.x,left.y);assert.equal(await p.evaluate(()=>__carouselInput.selected()),'source','Left tap wraps from first to fifth');
 await p.touchscreen.tap(right.x,right.y);assert.equal(await p.evaluate(()=>__carouselInput.selected()),'home','Right tap wraps back from fifth to first');
 await p.locator('[data-planet="home"]').focus();await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>__carouselInput.selected()),'source');
 await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>__carouselInput.selected()),'home');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,immediate:true,heldPress:true,rapidBothDirections:true,touchWrap:true,centered:true,errors}));await p.close();
}}finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
