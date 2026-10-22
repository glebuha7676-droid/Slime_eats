const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const out=process.env.DAMAGE_QA_OUT||'outputs/damage-crash-672';fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync('game.js','utf8');
const qa=fs.readFileSync('tools/test_psionic_damage_666.cjs','utf8');
const baseHook=qa.split('const hook=`')[1].split('`;')[0]
 .replace('await SlimeDamageFeedback.preload();','')
 .replace('startDrop({fromPortal:true});','save.world=window.__qaWorld||1;session.worldId=save.world;startDrop({fromPortal:true});')
 .replaceAll('ensureWorldBackgroundLayers(1)','ensureWorldBackgroundLayers(run.worldId)')
 .replaceAll('ensureWorldSprites(1)','ensureWorldSprites(run.worldId)');
const hook=baseHook+`window.__damage672={
 async setup(stage,family,world){window.__qaWorld=world;await __psiQA.setup(stage,family);
  const block=run.blocks.find(b=>b.col===3&&b.y>run.cameraY+250&&b.y<run.cameraY+400);
  Object.assign(block,{dead:false,hazard:true,unbreakable:true,special:null,hp:1,maxHp:1,material:world===4?'lavaRock':'hazard'});
  return {world:run.worldId};},
 hit(){return __psiQA.hit();},
 frame(age){const at=__psiQA.base+age;run.paused=false;run.lastTime=at-16.67;run.nextFrameAt=0;gameFrame(at);cancelAnimationFrame(run.animationId);run.paused=true;return {health:run.health,lastTime:run.lastTime,x:run.slime.x,y:run.slime.y};},
 snapshot(){return {health:run.health,ended:run.ended,lastTime:run.lastTime};},
 stress(){
  const records=[];run.paused=true;save.sound=true;
  const block=run.blocks.find(b=>b.hazard&&!b.dead);
  run.blocks.forEach(b=>{if(b!==block)b.dead=true;});
  for(let trial=0;trial<360;trial++){
   const at=10000+trial*2500,side=trial%4;
   run.health=3;run.ended=false;run.hurtFlashUntil=0;run.damageInvulnerableUntil=0;run.hitCooldowns.clear();
   run.slime.radius=massRadiusForLevel(0,run.cellSize);run.slime.vx=side===0?305:side===1?-305:0;run.slime.vy=side===2?305:side===3?-305:0;
   const radius=run.slime.radius*.76,inset=block.w*.08;
   run.slime.x=side===0?block.x+inset-radius+1:side===1?block.x+block.w-inset+radius-1:block.x+block.w/2;
   run.slime.y=side===2?block.y+inset-radius+1:side===3?block.y+block.h-inset+radius-1:block.y+block.h/2;
   run.cameraY=block.y-250;
   updatePhysics(.001,at);renderCanvas(at);
   if(run.health!==2)throw Error('Missed spike hit: '+trial+' '+run.health);
   for(let frame=1;frame<=8;frame++){updatePhysics(.016,at+frame*17);renderCanvas(at+frame*17);}
   records.push({trial,health:run.health,x:run.slime.x,y:run.slime.y});
  }
  return records;
 },death(){
  run.health=1;run.damageInvulnerableUntil=0;
  const hit=__psiQA.hit();return {hit,ended:run.ended};
 },patrol(){
  const block=run.blocks.find(b=>b.motion?.axis==='x'&&b.hazard&&!b.dead);
  if(!block)throw Error('No horizontal patrol');
  run.blocks.forEach(b=>{if(b!==block)b.dead=true;});
  const records=[];run.health=3;
  for(let frame=0;frame<1200;frame++){
   const at=10000+frame*17;updateMovingHazards(at);
   if(frame%120===0){run.health=3;run.damageInvulnerableUntil=0;run.slime.x=block.x>VIEW_W/2?VIEW_W-run.slime.radius:run.slime.radius;run.slime.y=block.y+block.h/2;run.slime.vx=0;run.slime.vy=0;run.hitCooldowns.clear();}
   updatePhysics(.017,at);renderCanvas(at);
   if(!Number.isFinite(run.slime.x)||!Number.isFinite(run.slime.y))throw Error('Non-finite patrol frame '+frame);
   if(run.ended)break;
   records.push({frame,health:run.health,x:run.slime.x,y:run.slime.y});
  }
  return records;
 }
};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const errors=[],records=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.stack));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__damage672&&window.SlimeGameDebug,null,{timeout:60000});
  if(process.env.DAMAGE_STRESS){
   await page.evaluate(()=>__damage672.setup(1,'fire',1));
   const stress=await page.evaluate(()=>__damage672.stress());
   await page.evaluate(()=>__damage672.setup(1,'fire',1));
   const patrol=await page.evaluate(()=>__damage672.patrol());
   await page.evaluate(()=>__damage672.setup(1,'fire',1));
   const death=await page.evaluate(()=>__damage672.death());
   fs.writeFileSync(out+'/stress.json',JSON.stringify({errors,stress,patrol,death},null,2));console.log('Spike stress hits: '+stress.length+'; patrol frames: '+patrol.length+'; death: '+JSON.stringify(death));return;
  }
  for(const world of await page.evaluate(()=>SlimeGameConfig.WORLDS.filter(w=>w.active!==false&&!w.comingSoon).map(w=>w.id)))for(const family of ['electric','fire','frost','cosmos','nano','telekinesis','cloning','phantom','glitch'])for(const stage of [1,2,3]){
   const record={world,family,stage};
   try{
    record.setup=await page.evaluate(({stage,family,world})=>__damage672.setup(stage,family,world),{stage,family,world});
    record.hit=await page.evaluate(()=>__damage672.hit());
    for(const age of [16,80,240,500,800,1200,2100])record.after=await page.evaluate(age=>__damage672.frame(age),age);
    assert.equal(record.hit.health,2);
    assert.ok(Number.isFinite(record.after.x)&&Number.isFinite(record.after.y));
   }catch(error){record.error=error.stack;}
   records.push(record);
  }
  fs.writeFileSync(out+'/checks.json',JSON.stringify({errors,records},null,2));
  const failures=records.filter(r=>r.error);console.log(JSON.stringify({errors,failures:failures.slice(0,4),failed:failures.length,count:records.length},null,2));assert.equal(failures.length,0);assert.equal(errors.length,0);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
