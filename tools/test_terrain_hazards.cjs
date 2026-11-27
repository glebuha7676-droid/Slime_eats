const assert=require('node:assert/strict');
const terrain=require('../js/generation/world1-descent.js');
const hazards=require('../js/gameplay/thorn-hazards.js');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let seed=1;seed<=300;seed++){
 let baseline;
 for(let stage=1;stage<=4;stage++){
  const p=terrain.build({stage,random:rng(seed)}),flat=p.cells.flat();
  assert.equal(p.hazards.length,10);
  assert.deepEqual(['static','chaser','bramble'].map(t=>p.hazards.filter(h=>h.kind===t).length),[[10,0,0],[4,6,0],[3,3,4],[4,3,3]][stage-1]);
  assert(!p.cells.slice(0,21).flat().some(b=>b.tier==='reinforced'));
  for(const [i,s]of p.sections.entries()){
   const w=terrain.ROCK_WEIGHTS[i];
   for(const tier of ['dense','reinforced'])assert.equal(s.counts[tier],Math.round(s.count*w[tier]/100));
  }
  assert(p.sections[1].counts.hard>p.sections[1].counts.dense);
  assert(p.sections[2].counts.reinforced>p.sections[2].counts.hard);
  for(let y=0;y<p.rows;y++){
   assert(Math.abs((p.pathStarts[y-1]??p.pathStarts[y])-p.pathStarts[y])<=1);
   const b=p.cells[y][p.guideCols[y]];
   assert(b.hazard||b.dead||b.tier==='dense');
   assert(p.hazards.filter(h=>h.row>=y&&h.row<y+14).length<=2);
  }
  const rock=flat.map(b=>b.tier);
  if(baseline)assert.deepEqual(rock,baseline,'Enemy stage cannot change underlying terrain');
  else baseline=rock;
  assert.equal(p.rewardBudgets.length,3);
  assert(p.rewardBudgets.every((v,i)=>v>=50+i*20));
 }
}
const b={id:1,x:100,y:400,w:60,h:60,row:5,col:1,chase:{x:100,y:400,state:'idle',age:0}};
const run={cellSize:60,rowCount:105,columns:6,gridOffsetX:0,blockRowOrigin:100,movingHazards:[b],blocksByRow:new Map([[5,[b]]]),slime:{x:230,y:480}};
run.slime={x:130,y:851};hazards.update(run,.1);assert.equal(b.chase.state,'idle');
run.slime={x:130,y:850};hazards.update(run,.01);assert.equal(b.chase.state,'alert');
b.chase.state='idle';run.slime={x:230,y:480};
hazards.update(run,.1);assert.equal(b.chase.state,'alert');assert.equal(b.x,100);
hazards.update(run,.15);assert.equal(b.chase.state,'chasing');assert(b.x>100);assert(b.x<110);
for(let i=0;i<20;i++)hazards.update(run,.02);
assert(b.y>400);assert.equal([...run.blocksByRow.values()].flat().filter(x=>x===b).length,1);
run.paused=true;const stopped=[b.x,b.y];hazards.update(run,.5);assert.deepEqual([b.x,b.y],stopped);run.paused=false;
run.slime.y=2000;hazards.update(run,.1);assert.equal(b.chase.state,'returning');
for(let i=0;i<100;i++)hazards.update(run,.02);
assert.deepEqual([b.x,b.y,b.chase.state],[100,400,'idle']);
run.slime={x:280,y:430};hazards.update(run,.1);assert.equal(b.chase.state,'alert','5x5 detection square reaches 2.5 cells from spawn center');
b.frozen=true;const age=b.chase.age;hazards.update(run,.3);assert.equal(b.chase.age,age);
console.log('1200 layouts: independent terrain, 20/50/30 bands, fixed threat budget, stage ratios, spacing, aggro/return and pause passed.');
