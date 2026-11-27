const assert=require('node:assert/strict'),ICE=require('../js/gameplay/ice-hazards.js'),gen=require('../js/generation/world1-descent.js');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let seed=1;seed<=120;seed++)for(let stage=1;stage<=4;stage++){
 const p=gen.build({worldId:4,stage,random:rng(seed)});
 assert.deepEqual(['frostSpike','iceMortar','iceBlock'].map(t=>p.hazards.filter(h=>h.kind===t).length),[[10,0,0],[4,6,0],[3,3,4],[4,3,3]][stage-1]);
 assert.equal(p.hazards.length,10);
 for(const h of p.hazards){const b=p.cells[h.row][h.col];assert(b.ice&&!b.motion&&!b.chase&&!b.flaskTier);assert.equal(b.hazard,h.kind!=='iceBlock');}
 assert(p.rewardBudgets.every((v,i)=>v>=50+i*20));
}
function scene(kind='iceMortar'){
 const b={id:1,x:180,y:480,w:60,h:60,ice:{kind}},run={blocks:[b],columns:6,cellSize:60,gridOffsetX:0,blockRowOrigin:0,cameraY:200,slime:{x:270,y:390,radius:18,vx:15,vy:200}};
 ICE.init(run);return {run,b};
}
{
 const {run}=scene('iceBlock');assert(ICE.addFrost(run));assert.equal(run.iceStatus.stacks,1);assert.equal(ICE.slowFactor(run),.8);
 for(let i=0;i<20;i++)assert(!ICE.addFrost(run),'A continuous contact cannot stack once per frame');
 ICE.update(run,.81);assert(ICE.addFrost(run));assert.equal(run.iceStatus.stacks,2);assert.equal(ICE.slowFactor(run),.6);assert.equal(run.iceStatus.slow,3);
 ICE.update(run,.81);assert(ICE.addFrost(run));assert(ICE.locked(run));assert.equal(run.iceStatus.freeze,2);
 const anchor=[run.slime.x,run.slime.y];run.slime.x+=50;run.slime.y+=100;assert(ICE.hold(run,.02));assert.deepEqual([run.slime.x,run.slime.y],anchor);assert.equal(run.slime.vy,0);
 run.paused=true;ICE.update(run,10);assert.equal(run.iceStatus.freeze,2);run.paused=false;
 ICE.update(run,1.99);assert(ICE.locked(run));ICE.update(run,.02);assert(!ICE.locked(run));assert.equal(run.iceStatus.stacks,3);
 assert(Math.abs(ICE.slowFactor(run)-.4)<1e-8);
 assert(ICE.addFrost(run));assert(!ICE.locked(run),'Refreshing capped frost does not lock the slime again');
 ICE.update(run,3);assert.equal(run.iceStatus.stacks,0);assert.equal(ICE.slowFactor(run),1);
}
{
 const {run}=scene('iceBlock');ICE.addFrost(run);ICE.update(run,.01,{},3);assert.equal(run.iceStatus.stacks,0,'Slow motion does not lengthen the three-second debuff');
}
{
 const {run,b}=scene();let hits=0;ICE.update(run,.2);assert.equal(b.ice.state,'aim');const target=[b.ice.targetX,b.ice.targetY];
 run.slime.x=40;run.slime.y=700;ICE.update(run,.46);assert.equal(run.iceShots.length,1);assert.deepEqual([run.iceShots[0].tx,run.iceShots[0].ty],target);
 b.dead=true;run.slime.x=target[0]+60;run.slime.y=target[1];ICE.update(run,1.11,{hurt:()=>hits++});assert.equal(hits,1);assert.equal(run.iceShots.length,0);
 ICE.update(run,4,{hurt:()=>hits++});assert.equal(hits,1,'A dead source launches no more shots');
 run.slime.x=target[0]+60;run.slime.y=target[1]+60;assert(!ICE.crossHit(run,...target),'Diagonal cells are safe');
 for(const [dx,dy]of ICE.CROSS){run.slime.x=target[0]+60*dx;run.slime.y=target[1]+60*dy;assert(ICE.crossHit(run,...target));}
}
{
 const {run,b}=scene();ICE.update(run,.2);b.dead=true;ICE.update(run,2);assert.equal(run.iceShots.length,0,'Breaking the launcher during aim prevents its shot');
}
console.log('480 magma layouts; fixed cross targets, finite shots, frost cadence, pause, independent timers, 2s stationary freeze and thaw passed.');
