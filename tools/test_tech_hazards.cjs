const assert=require('node:assert/strict'),gen=require('../js/generation/world1-descent.js'),TECH=require('../js/gameplay/tech-hazards.js');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let seed=1;seed<=120;seed++)for(let stage=1;stage<=4;stage++){
 const p=gen.build({worldId:3,stage,random:rng(seed)});
 assert.equal(p.hazards.length,10);
 assert.deepEqual(['mine','turret','slowCore'].map(t=>p.hazards.filter(h=>h.kind===t).length),[[10,0,0],[4,6,0],[3,3,4],[4,3,3]][stage-1]);
 assert(!p.cells.slice(0,21).flat().some(b=>b.tier==='reinforced'));
 for(const h of p.hazards){const b=p.cells[h.row][h.col];assert(b.tech&&!b.motion&&!b.chase);if(h.kind==='laser')assert(p.cells[h.row].every(c=>c.dead||c===b));}
}
function scene(kind){
 const b={id:1,x:180,y:480,w:60,h:60,hp:kind==='turret'?2:kind==='laser'?3:1,tech:{kind,direction:1}};
 const run={blocks:[b],columns:6,cellSize:60,gridOffsetX:0,blockRowOrigin:0,cameraY:200,slime:{x:270,y:590,radius:20},blocksByRow:new Map([[8,[b]]])};
 TECH.init(run);return {run,b};
}
{
 const {run,b}=scene('turret');const y=b.y+b.h/2;
 run.slime={x:b.x+b.w/2,y:y+421,radius:20};
 TECH.update(run,.1);assert.equal(b.tech.state,'idle');
 run.slime.y=y+420;
 for(let i=0;i<180;i++)TECH.update(run,.02);
 assert(run.techShots.length>=2,'A turret can fire repeatedly at seven cells');
}
{
 const {run,b}=scene('turret');let hurt=0;
 for(let i=0;i<80&&!run.techShots.length;i++)TECH.update(run,.02,{hurt:()=>hurt++});
 assert(run.techShots.length>0);const shot=run.techShots[0],vx=shot.vx,vy=shot.vy;
 run.slime.x=30;run.slime.y=700;
 const rock={x:shot.x+shot.vx*.02-5,y:shot.y+shot.vy*.02-5,w:20,h:20};
 run.blocksByRow.set(Math.floor(rock.y/60),[rock]);
 TECH.update(run,.02);assert(run.techShots.includes(shot),'Enemy projectile passes through rock');
 assert.equal(shot.vx,vx);assert.equal(shot.vy,vy);assert(b.tech.recoil>=0);assert(b.tech.angle!==0);
 run.paused=true;const life=shot.life;TECH.update(run,.5);assert.equal(shot.life,life);
}
{
 const {run,b}=scene('mine');let blasts=0,hurt=0;
 TECH.update(run,.01,{detonate:()=>blasts++});
 for(let i=0;i<49;i++)TECH.update(run,.02,{detonate:()=>blasts++});
 assert.equal(blasts,0);run.slime={x:210,y:510,radius:20};
 TECH.update(run,.002,{detonate:()=>{blasts++;b.dead=true;},hurt:()=>hurt++},.02);
 assert.equal(blasts,1);assert.equal(hurt,1);
 for(let i=0;i<100;i++)TECH.update(run,.02,{detonate:()=>blasts++});
 assert.equal(blasts,1);
}
{
 const {run,b}=scene('mine');TECH.update(run,.1);b.dead=true;let blasts=0;
 for(let i=0;i<200;i++)TECH.update(run,.02,{detonate:()=>blasts++});assert.equal(blasts,0);
}
{
 const {run,b}=scene('laser');run.slime={x:320,y:510,radius:20};let hits=0;
 TECH.update(run,.01,{hurt:()=>hits++});
 assert(hits>0);assert.equal(b.tech.state,'active');
 for(let i=0;i<20;i++)TECH.update(run,.02,{hurt:()=>hits++});
 b.dead=true;const old=hits;TECH.update(run,.2,{hurt:()=>hits++});assert.equal(hits,old);
}
{
 const {run,b}=scene('mine');run.slime={x:0,y:0,radius:20};let idle=0,armed=0;
 for(let i=0;i<180;i++)TECH.update(run,1/60,{beep:fast=>fast?armed++:idle++});
 assert(idle>=2&&armed===0);
 run.slime={x:210,y:510,radius:20};
 for(let i=0;i<70;i++)TECH.update(run,1/60,{beep:fast=>fast?armed++:idle++});
 assert(armed>=4);
 run.cameraY=3000;const before=idle+armed;
 for(let i=0;i<10;i++)TECH.update(run,.01,{beep:fast=>fast?armed++:idle++});
 assert.equal(idle+armed,before,'Offscreen mine produces no beeps');
}
{
 const {run,b}=scene('slowCore');run.slime={x:210,y:510,radius:20};let hits=0;
 TECH.update(run,.1,{hurt:()=>hits++});assert.equal(hits,0);assert.equal(TECH.slowFactor(run),.38);
 run.techHazards.push({...b,tech:{...b.tech}});assert.equal(TECH.slowFactor(run),.38,'Fields do not stack');run.techHazards.pop();
 b.dead=true;assert.equal(TECH.slowFactor(run),1,'Destroyed source immediately removes the debuff');
 b.dead=false;b.frozen=true;assert.equal(TECH.slowFactor(run),1);b.frozen=false;
 run.slime.x=359;run.slime.y+=179;assert.equal(TECH.slowFactor(run),.38);
 run.slime.y+=2;assert.equal(TECH.slowFactor(run),1);run.slime.y-=181;
 run.paused=true;assert.equal(TECH.slowFactor(run),1);
}
console.log('480 candy layouts: mine/turret/slow field stages; shots, fuses, pause, bounded non-damaging field and source destruction passed.');
