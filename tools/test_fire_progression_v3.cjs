const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+energy+`window.__fireV3={
 setup(stage,ultimate=stage){
  __energyQA.start('fire',stage);cancelAnimationFrame(run.animationId);
  const cell=run.cellSize,template=run.blocks.find(b=>!b.dead&&!b.hazard&&!b.special);run.blocks=[];
  for(let row=0;row<16;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:'fireQA-'+row+'-'+col,row,col,x:col*cell+2,y:285+row*cell+2,w:cell-4,h:cell-4,tier:'hard',hp:6,maxHp:6,flaskTier:0,dead:false,hazard:false,special:null,unbreakable:false,fireDamageAt:0,fireFlashUntil:0,firePersistent:false,ultimateChargeExcluded:false});
  indexRunBlocks();run.burningBlocks=new Set();run.slime.x=cell*3;run.slime.y=285+cell*2.4;run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-250;
  run.ultimateStage=ultimate;run.ultimateProfile=ULTIMATE_STAGES.get('fire',ultimate);run.elementalAbilityCharges=1;run.ultimateCharge=65;run.specialEffects=[];
  updateRunUI();renderCanvas(performance.now());
 },
 activate(){this.at=performance.now();activateElementalAbility(this.at);},
 frame(ms){const at=this.at+ms;ELEMENTAL_ULTIMATES.update(run,at,stagedUltimateServices);renderCanvas(at);return this.state();},
 state(){return {passive:elementalLevel('fire'),ultimate:run.ultimateStage,origin:run.stagedUltimate?.y,rocks:run.stagedUltimate?.rocks,burning:run.blocks.filter(b=>b.fireDamageAt>0).map(b=>({row:b.row,col:b.col,y:b.y+b.h/2,persistent:b.firePersistent})),charge:run.ultimateCharge};},
 burn(stage){this.setup(stage,1);const b=run.blocks.find(b=>b.row===6&&b.col===2);igniteBlock(b,1000);updateBurningBlocks(10000);return {passive:elementalLevel('fire'),hp:b.hp,dead:b.dead,count:run.blocks.filter(b=>b.dead).length,burning:run.blocks.filter(b=>b.fireDamageAt>0&&!b.dead).length};}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/fire-progression-v3';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:440,height:840},{width:320,height:568}]){
  const p=await b.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=fire-progression-3');await p.waitForFunction(()=>window.__fireV3&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  const burns=[];for(const stage of [1,2,3])burns.push(await p.evaluate(n=>__fireV3.burn(n),stage));
  assert.equal(burns[0].hp,3);assert.equal(burns[1].hp,3);assert.equal(burns[2].dead,true);assert.equal(burns[2].passive,3,'An earlier selected ultimate does not downgrade the passive');
  await p.evaluate(()=>__fireV3.setup(1));await p.waitForTimeout(750);await p.evaluate(()=>__fireV3.activate());let s=await p.evaluate(()=>__fireV3.frame(260));assert(s.burning.length>0);assert(s.burning.every(b=>b.y>s.origin));assert.equal(s.passive,1);assert.equal(s.charge,0);assert(await p.locator('#shaft').isVisible());await p.screenshot({path:dir+'/wave-'+viewport.width+'.png'});
  await p.evaluate(()=>__fireV3.setup(2));await p.waitForTimeout(750);await p.evaluate(()=>__fireV3.activate());s=await p.evaluate(()=>__fireV3.frame(760));assert.equal(s.rocks.length,4);assert.equal(new Set(s.rocks.map(r=>r.toX)).size,4);await p.screenshot({path:dir+'/volcano-flight-'+viewport.width+'.png'});
  s=await p.evaluate(()=>__fireV3.frame(1750));assert(s.rocks.every(r=>r.landed));assert(s.burning.length>0);await p.screenshot({path:dir+'/volcano-impact-'+viewport.width+'.png'});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,burns,forwardWave:true,spreadRocks:true,errors}));await p.close();
 }}finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
