const assert=require('node:assert/strict'),GEN=require('../js/generation/world1-descent.js'),WATER=require('../js/gameplay/water-hazards.js');
const random=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let seed=1;seed<=120;seed++)for(let stage=1;stage<=4;stage++){
 const p=GEN.build({worldId:5,stage,random:random(seed)});
 assert.deepEqual(['vortex','tentacle','seaMine'].map(k=>p.hazards.filter(h=>h.kind===k).length),[[10,0,0],[4,6,0],[3,3,4],[4,3,3]][stage-1]);
 assert.equal(p.hazards.length,10);assert(!p.cells.slice(0,21).flat().some(b=>b.tier==='reinforced'));
 assert(p.hazards.every(h=>p.cells[h.row][h.col].water&&!p.cells[h.row][h.col].motion));
}
function scene(kind){
 const b={x:0,y:500,w:70,h:70,water:{kind,side:1}},run={blocks:[b],cellSize:70,columns:6,gridOffsetX:0,cameraY:200,slime:{x:130,y:370,vx:0,vy:300,radius:24}};
 WATER.init(run);return {run,b};
}
{
 const {run,b}=scene('tentacle');let hits=0;
 WATER.update(run,.01,{}, {hurt:()=>hits++});assert.equal(b.water.state,'warning');
 for(let i=0;i<69;i++)WATER.update(run,.01);assert.equal(hits,0);
 WATER.update(run,.02);assert.equal(b.water.state,'strike');
 run.slime.x=b.water.targetX;run.slime.y=b.water.targetY;
 for(let i=0;i<25;i++)WATER.update(run,.01,{}, {hurt:()=>hits++});assert(run.waterGrab);assert.equal(hits,1);
 const age=run.waterGrab.age;run.paused=true;WATER.update(run,.2);assert.equal(run.waterGrab.age,age);run.paused=false;
 for(let i=0;i<35;i++)WATER.update(run,.01,{down:1,x:1});assert.equal(run.waterGrab,null);assert.equal(hits,1);
 assert(run.slime.vy>0);assert(run.slime.vx>0);
}
{
 const {run,b}=scene('tentacle');WATER.update(run,.01);
 for(let i=0;i<75;i++)WATER.update(run,.01);run.slime.x=b.water.targetX;run.slime.y=b.water.targetY;
 for(let i=0;i<20;i++)WATER.update(run,.01);assert(run.waterGrab);
 b.dead=true;WATER.update(run,.01);assert.equal(run.waterGrab,null);
}
{
 const {run,b}=scene('seaMine');let n=0;
 WATER.detonate(run,b,{detonate:()=>{n++;b.dead=true;}});WATER.detonate(run,b,{detonate:()=>n++});assert.equal(n,1);
}
{
 function fall(input){
  const {run,b}=scene('vortex');b.x=175;run.slime={x:185,y:465,vx:0,vy:200,radius:24};
  for(let i=0;i<120;i++){
   const s=run.slime;s.vy+=700/120;s.vx+=(input.x*230-s.vx)*8/120;
   WATER.applyForces(run,1/120,input);s.x+=s.vx/120;s.y+=s.vy/120;
  }
  return run.slime;
 }
 const idle=fall({x:0,down:0}),escape=fall({x:1,down:1});assert(escape.y>idle.y+70);assert(escape.x>idle.x+70);
}
console.log('480 flooded-desert layouts; vortex escape, telegraph, finite grab, input escape, source destruction and single mine explosion passed.');
