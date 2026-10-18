const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
let gradients=0,draws=0;
const canvas={width:0,height:0,getContext:()=>({scale(){},createRadialGradient(){gradients++;return {addColorStop(){}}},fillRect(){}})};
const c={window:{SlimeGameAssets:{projectSprite:()=>({complete:true,naturalWidth:384,naturalHeight:353})}},document:{createElement:()=>canvas}};
for(const f of ['js/config/ultimate-stages.js','js/abilities/spore-colossus.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),c);
const U=c.window.SlimeUltimateStages,G=c.window.SlimeSporeColossus;
let r,events=[];
const services={blocksNearY:(y,radius)=>r.blocks.filter(b=>Math.abs(b.y+b.h/2-y)<=radius+60),elementalDamageable:b=>!b.dead&&!b.hazard&&!b.unbreakable,
 damageBlockByElement:(b,n,cause)=>{b.hp-=n;if(b.hp<=0){b.dead=true;b.paid=(b.paid||0)+b.flaskValue;}events.push({b,cause});},sound(){},feedback(){},lowPower:()=>false,reducedMotion:()=>false};
function fresh(){events=[];r={ultimateProfile:U.get('cloning',3),cellSize:60,columns:6,gridOffsetX:0,blockRowOrigin:0,viewHeight:780,cameraY:0,slime:{x:210,y:150},shake:0,blocks:[]};
for(let row=0;row<26;row++)for(let col=0;col<6;col++)r.blocks.push({row,col,x:col*60,y:row*60,w:60,h:60,hp:4,maxHp:4,flaskTier:3,flaskValue:5});
assert(G.start(r,1000,210,150));return r.giantMushroom;}
let e=fresh();assert.equal(G.pose(r,1000).phase,'seed');assert(G.pose(r,1100).seedSize<20);assert.equal(G.pose(r,1600).phase,'growing');
assert(G.pose(r,1900).seedSize>G.pose(r,1600).seedSize);assert.equal(G.pose(r,2100).phase,'hatching');assert.equal(events.length,0,'Growth is visible before destructive stomps');
G.update(r,2320,services);assert.equal(G.pose(r,2320).phase,'crouching');assert.equal(e.impacts,0);
G.update(r,2600,services);assert.equal(G.pose(r,2600).phase,'jumping');assert.equal(e.impacts,0);
G.update(r,3130,services);assert.equal(e.impacts,1);assert.equal(G.pose(r,3150).phase,'landing');assert(G.pose(r,3150).sy<1);assert(r.shake>=7);
const killed=r.blocks.filter(b=>b.dead);assert.equal(killed.length,9,'First impact crushes a three-by-three area around the landing');assert(killed.every(b=>b.paid===5));assert(events.every(e=>e.cause==='sporeGiant'));
const before=events.length;G.update(r,3130,services);assert.equal(events.length,before,'Same impact is never paid twice');
G.update(r,3300,services);const phase=G.pose(r,3300),cloudAt=e.clouds.at(-1).at,impactAt=e.jumps[0].impactAt;
G.shiftClock(r,10000);G.update(r,13300,services);const after=G.pose(r,13300);assert.equal(after.phase,phase.phase);assert.equal(after.x,phase.x);assert.equal(after.y,phase.y);assert.equal(e.clouds.at(-1).at,cloudAt+10000);assert.equal(e.jumps[0].impactAt,impactAt+10000);
// Absolute event times make the five stomps independent of frame frequency.
function simulate(step){const e=fresh();for(let age=0;age<=7200;age+=step)G.update(r,1000+age,services);G.update(r,8200,services);return {impacts:e.impacts,dead:r.blocks.filter(b=>b.dead).map(b=>b.row*6+b.col),events:events.length,e};}
const a=simulate(16),b=simulate(100);assert.equal(a.impacts,5);assert.equal(b.impacts,5);assert.deepEqual(a.dead,b.dead);assert.equal(a.events,b.events);
assert(a.e.clouds.length<=3);assert.equal(a.e.motes.length,24);assert.equal(a.e.jumps.length,5);
G.update(r,8301,services);assert.equal(r.giantMushroom,null);
e=fresh();r.blocks[0].hazard=true;services.reducedMotion=()=>true;G.update(r,3130,services);assert(r.shake<2);assert(!r.blocks[0].dead);services.reducedMotion=()=>false;
// Raster effects stay bounded; the only procedural texture is built once.
const ctx={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){draws++;}};
e=fresh();for(let at=1000;at<8200;at+=16){G.update(r,at,services);draws=0;G.draw(ctx,r,at);assert(draws<=30,`Raster draw budget: ${draws}`);}
assert.equal(gradients,1,'No live blur or per-frame gradient construction');
assert.equal(U.get('cloning',1).miniCount,6);assert.equal(U.get('cloning',2).sporeCount,4);assert.equal(U.get('cloning',3).name,'Грибной великан');
// The player and camera stay motionless for the complete cast.
const route=a.e.jumps;assert(route.every(j=>j.toY-j.fromY===180));
assert.deepEqual(Array.from(route,j=>j.toX),[150,210,150,210,150]);
assert(route.at(-1).toY>r.viewHeight,'Independent route continues below a stationary camera');
fresh();r.cameraY=5000;for(let age=0;age<=7200;age+=100)G.update(r,1000+age,services);
assert.deepEqual(r.giantMushroom.jumps.map(j=>[j.toX,j.toY]),route.map(j=>[j.toX,j.toY]),'Camera cannot change the route');
// Stage I emits exactly six helpers once, in a downward fan, with ultimate attribution.
fresh();r.giantMushroom=null;r.ultimateProfile=U.get('cloning',1);const helpers=[];services.spawnMiniSlime=(...args)=>helpers.push(args);
G.startPop(r,1000);G.update(r,1239,services);assert.equal(helpers.length,0);
G.update(r,1240,services);assert.equal(helpers.length,6);assert(helpers.every(args=>args[0]>0&&args[0]<Math.PI&&args[6]===true));
assert(events.length>0&&events.every(e=>e.cause==='sporeUltimate'));const paid=events.length;G.update(r,1300,services);assert.equal(helpers.length,6);assert.equal(events.length,paid);
const pop=r.sporePop;G.shiftClock(r,10000);G.update(r,11300,services);assert.equal(r.sporePop,pop);G.update(r,12201,services);assert.equal(r.sporePop,null);
console.log('Spore colossus: seed/growth/hatch, five independent zigzag spring jumps, 3×3 crush, six stage-I helpers, four stage-II spores, single rewards, shockwave, pause, FPS independence, 24 pooled motes, raster draw budget and reduced motion passed');
