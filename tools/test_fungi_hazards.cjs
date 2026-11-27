const assert=require('node:assert/strict'),F=require('../js/gameplay/fungi-hazards.js'),G=require('../js/generation/world1-descent.js'),P=require('../js/config/planet-campaign.js');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let seed=1;seed<=120;seed++)for(let stage=1;stage<=4;stage++){
 const p=G.build({worldId:5,stage,random:rng(seed)});
 assert.deepEqual(['spore','fungusTurret','toadstool'].map(k=>p.hazards.filter(h=>h.kind===k).length),[[10,0,0],[4,6,0],[3,3,4],[4,3,3]][stage-1]);
 assert.equal(p.hazards.length,10);assert.equal(p.rows,105);
 for(const h of p.hazards){const b=p.cells[h.row][h.col];assert(b.fungi&&!b.water&&!b.motion&&!b.chase&&!b.flaskTier);if(h.kind==='toadstool'){assert.equal(h.col,2);assert(p.cells[h.row][3].dead);}}
 assert(p.rewardBudgets.every((v,i)=>v>=50+i*20));
}
function scene(kind='toadstool'){
 const b={id:1,x:180,y:480,w:60,h:60,fungi:{kind}},run={blocks:[b],columns:6,cellSize:60,gridOffsetX:30,cameraY:200,slime:{x:210,y:390,radius:18}};
 F.init(run);return {run,b};
}
{
 const {run,b}=scene(),raw={x:1,y:-1,up:1,down:0};
 assert(F.contains(run,b));assert.deepEqual(F.invert(run,raw),{x:-1,y:1,up:0,down:1});assert.deepEqual(raw,{x:1,y:-1,up:1,down:0});
 run.slime.x=31;run.slime.y=301;assert(F.contains(run,b));run.slime.x=389;assert(F.contains(run,b));run.slime.y=299;assert(!F.contains(run,b));
 run.slime.y=719;assert(F.contains(run,b));run.slime.y=721;assert(!F.contains(run,b));
 run.slime.y=510;F.update(run,.1);assert(run.fungiStatus.visual>0);b.dead=true;assert.deepEqual(F.invert(run,raw),raw,'Breaking source immediately restores both axes');
 F.update(run,.1);assert(b.fungi.cloudAlpha>0&&b.fungi.cloudAlpha<1,'Fog fades independently of input restoration');F.update(run,2);assert(b.fungi.cloudAlpha<.01);
}
{
 const {run}=scene('spore');let drain=0;assert(F.poison(run));assert(!F.poison(run));
 for(let i=0;i<8;i++)F.update(run,.25,{drain:n=>drain+=n});assert.equal(drain,12);assert.equal(run.fungiStatus.poison,0);
 F.poison(run);run.paused=true;F.update(run,5,{drain:n=>drain+=n});assert.equal(drain,12);assert.equal(run.fungiStatus.poison,2);run.paused=false;
 F.update(run,.01,{drain:n=>drain+=n},1);assert.equal(drain,18,'Poison follows real time, not slow-motion time');assert(F.poison(run));
 F.update(run,2,{drain:n=>drain+=n});assert.equal(drain,30,'Refreshing does not create parallel poison streams');
 run.evacuation={};F.update(run,.1);assert.equal(run.fungiStatus.poison,0);
}
{
 const {run,b}=scene('spore');let destroyed=0,poisoned=0;const hooks={destroy:b=>{b.dead=true;destroyed++;},poison:()=>poisoned++};
 assert(F.detonate(run,b,hooks));assert(!F.detonate(run,b,hooks));assert.equal(destroyed,1);assert.equal(poisoned,1);
}
{
 const {run,b}=scene('fungusTurret');run.slime.y=300;F.update(run,.1);F.update(run,.7);assert.equal(run.fungiShots.length,3);
 const velocities=run.fungiShots.map(s=>[s.vx,s.vy]);run.slime.x=380;run.slime.y=700;F.update(run,.1);assert.deepEqual(run.fungiShots.map(s=>[s.vx,s.vy]),velocities,'Projectiles never home');
 b.dead=true;F.update(run,4);assert.equal(run.fungiShots.length,0);F.update(run,5);assert.equal(run.fungiShots.length,0);
}
{
 const saved=P.normalize({cores:{desert:37},selected:'desert',unlocked:P.ids,pending:[{id:'keep',planetId:'desert',from:50,to:37}]});
 assert.equal(saved.cores.desert,37);assert.equal(saved.pending.length,1);assert.equal(P.get('desert').name,'НЕБЕСНЫЙ МИР');assert.equal(new Set(Object.values(P.get('desert').frames)).size,5);
 for(const hp of [100,75,50,25,0])assert.equal(P.get('desert').frames[hp],'assets/ui/planets/sky-v4/sky-'+hp+'.webp');
}
console.log('Fungi: 480 layouts, 7-row full-width fog, instant input restoration, poison timing, triple volley, preserved campaign passed.');
