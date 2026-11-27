const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=`window.__anomalySceneQA={async prepare(){
 closePanel();clearMenuSlimeInteraction();clearMenuMutationPresentation();
 save=normalizeSave({schemaVersion:29,unlockedMutations:['fire'],mutationLevels:{fire:1},selectedMutation:'fire',activeMutationPool:['fire'],researchUnits:240,tutorialStep:'done',onboarding:{enabled:false},sound:false});
 session=null;newDraft();session.foods=[foodForMutation('fire',1)];session.offer=[null,null,null];recalcStats();syncMenuCategoryVisuals({instant:true});renderDraft();startDrop();cancelAnimationFrame(run.animationId);
 await Promise.all([...Object.values(ensureWorldSprites(1)),...ensureWorldBackgroundLayers(1).map(l=>l.image)].map(i=>i.decode().catch(()=>{})));
 await preloadMenuAppearance({fire:1});
 const cell=run.cellSize,origin=run.blockRowOrigin;
 const targets=[{row:3,col:1,tier:1},{row:4,col:4,tier:2},{row:6,col:1,tier:3}];
 for(const target of targets){const block=run.blocks.find(b=>b.row===target.row&&b.col===target.col);if(block)Object.assign(block,{dead:false,hazard:false,special:'',unbreakable:false,tier:['dense','hard','reinforced'][target.tier-1],flaskTier:target.tier,flaskValue:[1,3,5][target.tier-1],flaskGranted:false,hp:2,maxHp:2,visualId:null});}
 for(const b of run.blocks)if(b.row>=2&&b.row<=6&&(b.col===2||b.col===3))b.dead=true;
 indexRunBlocks();run.flasks=[];run.slime.x=run.gridOffsetX+3*cell;run.slime.y=origin+4.3*cell;run.slime.vx=run.slime.vy=0;run.cameraY=origin+2*cell-130;
 run.depth=run.maxDepth=120;run.researchData=12;updateRunUI();renderCanvas(performance.now());
 return targets.map(t=>({reward:[1,3,5][t.tier-1],source:WORLD_SPRITES[1][['ground-weak-liquid','stone-liquid','stone-reinforced-liquid'][t.tier-1]].src}));
},async frost(){
 await Promise.all(Object.values(ensureWorldSprites(2)).map(i=>i.decode().catch(()=>{})));
 const deposits=run.blocks.filter(b=>b.flaskTier&&!b.dead);for(const block of deposits)block.elementalSnow=true;
 renderCanvas(performance.now());const block=deposits.find(b=>b.flaskTier===1&&b.row===3&&b.col===1);
 const x=Math.floor((block.x+block.w*.35)/VIEW_W*els.canvas.width),y=Math.floor((block.y-run.cameraY+block.h*.25)/VIEW_H*els.canvas.height);
 return {pixel:[...ctx.getImageData(x,y,1,1).data],rewards:[1,2,3].map(t=>deposits.find(b=>b.flaskTier===t).flaskValue||FLASK_VALUES[t])};
}};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:440,height:840},deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await page.goto('http://127.0.0.1:8766/?v=anomaly-in-game-v2');await page.waitForFunction(()=>window.__anomalySceneQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
 const records=await page.evaluate(()=>__anomalySceneQA.prepare());assert(records.every(r=>r.source.includes('anomaly-fluid-v2')));assert.deepEqual(errors,[]);
 await page.waitForTimeout(350);
 const layout=await page.evaluate(()=>({screen:document.body.dataset.screen,body:document.body.className,scroll:scrollY,elements:[...document.querySelectorAll('#app,.phone-viewport,#dropScreen,#gameCanvas,.topbar')].map(e=>{const s=getComputedStyle(e);return {id:e.id,cls:e.className,box:e.getBoundingClientRect().toJSON(),display:s.display,visibility:s.visibility,opacity:s.opacity,transform:s.transform,overflow:s.overflow}}),top:document.elementsFromPoint(220,300).map(e=>e.id||e.className)}));
 assert.equal(layout.elements.find(e=>e.id==='phoneViewport').opacity,'1','Boot reveal must finish across a screen change');
 fs.mkdirSync('output/anomaly-fluid-v2',{recursive:true});
 await page.screenshot({path:'output/anomaly-fluid-v2/in-game-mini.png',clip:{x:0,y:0,width:440,height:520}});
 const frost=await page.evaluate(()=>__anomalySceneQA.frost());assert.deepEqual(frost.rewards,[1,3,5]);assert(frost.pixel[1]>180&&frost.pixel[2]>190,'The resource face must not cover transformed snow with gray stone');
 assert.deepEqual(errors,[]);
 fs.writeFileSync('output/anomaly-fluid-v2/game-preview-checks.json',JSON.stringify({records,layout,frost,errors},null,2));console.log(JSON.stringify({records,frost,errors}));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
