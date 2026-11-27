const assert=require('node:assert/strict');
const CORE=require('../js/gameplay/core-encounter.js');
const PURIFY=require('../js/rendering/core-purification.js');
global.window={SlimeCorePurification:PURIFY};
const ids=['fire','electric','frost','cosmos','nano','phantom','telekinesis','glitch','cloning','infinity'];
const rows=[];
for(const id of ids)for(const energy of [1,25,100]){
 const run={worldId:1,mutationId:id,ultimateStage:3,energy,cameraY:900,blocks:[],shake:0,slime:{x:180,y:1100,vy:305,vx:0,radius:30,wobble:0},coreArena:{x:220,radius:418,surfaceY:1800,centerY:2218,cameraY:1237}};
 const e=CORE.begin(run,5);assert(e.finisher);assert.equal(e.plannedDamage,CORE.damage(energy));
 let hits=0,bursts=0,evacuations=0,hitTime,burnEnd,burstTime,evacTime,overdrive=false;
 const dt=1/60;
 for(let frame=0;frame<1400;frame++){
  if(e.phase==='overdrive')overdrive=true;
  if(e.phase==='armed'){assert.equal(e.power,1.5);assert.equal(CORE.visualReserve(e),150);CORE.requestStrike(run);}
  const previous=e.phase;
  CORE.update(run,dt,{random:()=>.4,impact:n=>{hits++;hitTime=e.elapsed;assert.equal(n,CORE.damage(energy));return 0;},evacuate:()=>{
   evacuations++;assert(PURIFY.revealed(run),'Shell bursts before rescue');assert(PURIFY.evacuationReady(run));
   evacTime=e.purification.age;run.evacuation={finished:false,elapsed:0};
  }});
  if(previous==='burn'&&e.phase!=='burn')burnEnd=e.elapsed;
  if(run.evacuation){run.evacuation.elapsed+=dt*1000;run.evacuation.finished=run.evacuation.elapsed>=2400;}
  PURIFY.update(run,dt,{burst:()=>{bursts++;burstTime=e.purification.age;}});
  if(PURIFY.finished(run))break;
 }
 assert(overdrive);assert.equal(hits,1);assert.equal(bursts,1);assert.equal(evacuations,1);assert(PURIFY.finished(run),id+' finishes');
 assert.equal(e.strikeEnergy,energy);assert.equal(e.actualDamage,5);if(id==='phantom')assert.equal(e.soulCount,50);if(id==='nano')assert.equal(CORE.droneCount(CORE.visualReserve(e)),15);if(id==='telekinesis'){assert(e.extraRock?.torn&&e.extraRock.broken);assert.notEqual(e.extraRock.side,e.rock.side);assert(Number.isFinite(e.extraRock.x+e.extraRock.y));}
 assert(burstTime>=PURIFY.TIMES.pressure+PURIFY.TIMES.tension-20);
 assert(evacTime-burstTime>=PURIFY.TIMES.evacuate-20);
 if(id!=='cosmos')assert(Math.abs(burnEnd-hitTime-CORE.FINISHER.pressure)<75,id+' sustained attack has a bounded shorter duration');
 rows.push({id,energy,attackMs:Math.round(burnEnd-hitTime),burstMs:Math.round(burstTime),rescueMs:Math.round(evacTime)});
}
for(const [hp,energy,final]of [[15,100,true],[21,100,false],[20,1,false],[0,100,false]]){
 const run={energy,mutationId:'fire',cameraY:0,slime:{x:220,y:500,vy:305,radius:30},coreArena:{x:220,surfaceY:1800,cameraY:1200}};
 assert.equal(CORE.begin(run,hp).finisher,final);
}
for(const [stage,shot]of [[1,'blue'],[2,'red'],[3,'purple']]){
 const energy=50, run={mutationId:'infinity',infinity:{stage},energy,cameraY:900,shake:0,
  slime:{x:180,y:1100,vy:305,vx:0,radius:30,wobble:0},coreArena:{x:220,surfaceY:1800,cameraY:1237}};
 const e=CORE.begin(run,100),events=[];
 assert.equal(e.infinity.shot,shot);
 // Exercise automatic release and verify the order of the audiovisual cues.
 for(let i=0;i<480&&!e.rescueStarted;i++)CORE.update(run,1/60,{
  armed:()=>events.push('armed'),
  fusion:()=>events.push('fusion'),
  launch:()=>events.push('launch'),
  impact:damage=>{events.push('impact');assert.equal(damage,15);return 100-damage;},
  evacuate:()=>events.push('evacuation')
 });
 assert.deepEqual(events,stage===3?['armed','fusion','launch','impact','evacuation']:['armed','launch','impact','evacuation']);
 assert.equal(e.afterHp,85);
 assert.equal(run.energy,0);
}
console.log(JSON.stringify({finishers:rows,damageUnchanged:true,prediction:true,singleCommit:true,infinityStages:true}));
