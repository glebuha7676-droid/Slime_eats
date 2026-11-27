const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],energy=fs.readFileSync('tools/test_anomaly_energy.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+energy+`window.__fireV4={
 setup(stage){
  __energyQA.start('fire',stage);cancelAnimationFrame(run.animationId);document.body.classList.remove('portal-arrival');
  const cell=run.cellSize,template=run.blocks.find(b=>!b.dead&&!b.hazard&&!b.special);run.blocks=[];run.blockRowOrigin=285;run.gridOffsetX=0;
  for(let row=0;row<20;row++)for(let col=0;col<6;col++)run.blocks.push({...template,id:'fireQA-'+row+'-'+col,row,col,x:col*cell+2,y:285+row*cell+2,w:cell-4,h:cell-4,tier:'hard',hp:6,maxHp:6,flaskTier:0,dead:false,hazard:false,special:null,tech:null,water:null,unbreakable:false,fireDamageAt:0,fireFlashUntil:0,firePersistent:false,ultimateChargeExcluded:false});
  indexRunBlocks();run.burningBlocks=new Set();run.slime.x=cell*3;run.slime.y=285+cell*2.4;run.slime.vx=run.slime.vy=0;run.cameraY=run.slime.y-240;
  run.ultimateStage=stage;run.ultimateProfile=ULTIMATE_STAGES.get('fire',stage);run.elementalAbilityCharges=1;run.ultimateCharge=65;run.specialEffects=[];run.damageInvulnerableUntil=0;
  run.phoenixUltimate=null;run.phoenixWaves=[];run.stagedUltimate=null;
  updateRunUI();renderCanvas(performance.now());
 },
 activate(){this.at=performance.now();activateElementalAbility(this.at);if(run.ultimateIntro){run.ultimateIntro=null;commitElementalAbility('fire',this.at,run.slime.x,run.slime.y);}},
 frame(ms,follow=false){const at=this.at+ms;ELEMENTAL_ULTIMATES.update(run,at,stagedUltimateServices);updatePhoenixUltimate(at);if(follow&&run.phoenixUltimate)run.cameraY=phoenixFlight(run.phoenixUltimate,at).y-420;renderCanvas(at);return this.state();},
 state(){return {passive:elementalLevel('fire'),ultimate:run.ultimateStage,kind:run.stagedUltimate?.kind,phoenix:!!run.phoenixUltimate,burning:run.blocks.filter(b=>b.fireDamageAt>0).map(b=>({row:b.row,col:b.col,persistent:b.firePersistent})),charge:run.ultimateCharge};},
 burn(stage,physical=false){
  this.setup(stage);const b=run.blocks.find(b=>b.row===6&&b.col===2);b.hp=1;igniteBlock(b,1000);
  if(physical)destroyBlock(b,'impact',1100);else updateBurningBlocks(2200);
  const neighbors=run.blocks.filter(v=>!v.dead&&v.fireDamageAt>0).map(v=>({row:v.row,col:v.col,spread:v.fireSpreadLeft}));
  updateBurningBlocks(16000);
  return {neighbors,dead:run.blocks.filter(v=>v.dead).map(v=>({row:v.row,col:v.col}))};
 },
 duration(stage){this.setup(stage);const b=run.blocks.find(b=>b.row===6&&b.col===2);igniteBlock(b,1000);updateBurningBlocks(10000);return {hp:b.hp,dead:b.dead};},
 automatic(){__consoleQA.home('fire',3);save.mutationUltimateStages.fire=1;selectedLaboratoryMutationId='fire';laboratoryView='mutations';renderRecipesPanel();$('#mutationStage1').click();const state={active:selectedUltimateStage('fire'),preview:$('#slimeUltimateDetails').textContent};closePanel();return state;}
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disk-cache-size=1','--media-cache-size=1']}),dir='output/fire-stages-v4';fs.mkdirSync(dir,{recursive:true});
 try{for(const viewport of [{width:440,height:840},{width:320,height:568}]){
  const p=await browser.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=fire-stages-4');await p.waitForFunction(()=>window.__fireV4&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});await p.waitForTimeout(1800);
  const selection=await p.evaluate(()=>__fireV4.automatic());assert.equal(selection.active,3,'Previewing an old grade never downgrades fire');assert(selection.preview.includes('Огненный шар'));
  for(const stage of [1,2,3]){
   const d=await p.evaluate(n=>__fireV4.duration(n),stage);assert.equal(d.hp,stage===3?0:4);assert.equal(d.dead,stage===3);
   const burn=await p.evaluate(n=>__fireV4.burn(n),stage);
   assert.equal(burn.neighbors.length,stage===1?0:1);
   if(stage>1){const neighbor=burn.neighbors[0];assert.equal(Math.abs(neighbor.row-6)+Math.abs(neighbor.col-2),1);assert.equal(neighbor.spread,0);}
   assert.equal(burn.dead.length,stage===3?2:1,'A transferred flame never starts another generation');
   assert.equal((await p.evaluate(n=>__fireV4.burn(n,true),stage)).neighbors.length,0,'Breaking a burning block physically does not spread fire');
  }
  const totals=[];
  for(const stage of [1,2,3]){
   await p.evaluate(n=>__fireV4.setup(n),stage);await p.waitForTimeout(700);await p.evaluate(()=>__fireV4.activate());
   const partial=await p.evaluate(n=>__fireV4.frame(n===3?250:300),stage);
   if(stage===3){assert.equal(partial.burning.length,0,'Phoenix arrives before it ignites rows');await p.screenshot({path:dir+'/phoenix-arrival-'+viewport.width+'.png'});}
   const middle=await p.evaluate(n=>__fireV4.frame(n===3?900:450,n===3),stage);assert(middle.burning.length>0);assert.equal(middle.charge,0);
   await p.screenshot({path:dir+'/stage-'+stage+'-'+viewport.width+'.png'});
   const state=await p.evaluate(n=>__fireV4.frame(n===3?2000:n===2?900:650),stage);
   const width=[2,4,6][stage-1],rows=[4,6,10][stage-1];assert.equal(state.burning.length,width*rows);assert.equal(new Set(state.burning.map(v=>v.col)).size,width);assert.equal(new Set(state.burning.map(v=>v.row)).size,rows);totals.push(state.burning.length);
   assert(state.burning.every(v=>v.persistent===(stage===3)));
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({viewport,ignitedBlocks:totals,oneNeighbor:true,noChain:true,automaticGrade:true,errors}));await p.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
