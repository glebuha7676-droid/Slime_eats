const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
let gradients=0,draws=0;
const canvas={width:0,height:0,getContext:()=>({createRadialGradient(){gradients++;return {addColorStop(){}}},fillRect(){}})};
const c={window:{SlimeGameAssets:{projectSprite:()=>({complete:true,naturalWidth:192,naturalHeight:181})}},document:{createElement:()=>canvas}};
for(const f of ['js/config/ultimate-stages.js','js/abilities/cosmos-ultimates.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),c);
const U=c.window.SlimeUltimateStages,C=c.window.SlimeCosmosUltimates;
let r,hits=[];
const s={blocksNearY:(y,radius)=>r.terrain.filter(b=>Math.abs(b.y+b.h/2-y)<=radius+60),
 elementalDamageable:b=>!!b&&!b.dead&&!b.hazard&&!b.unbreakable,
 damageBlockByElement:(b,n,cause)=>{hits.push({b,n,cause});b.hp-=n;if(b.hp<=0)b.dead=true;},sound(){}};
function fresh(stage=2){hits=[];r={ultimateProfile:U.get('cosmos',stage),cellSize:60,columns:6,gridOffsetX:0,blockRowOrigin:0,viewHeight:780,cameraY:0,slime:{x:210,y:150},terrain:[]};
 for(let row=0;row<22;row++)for(let col=0;col<6;col++)r.terrain.push({row,col,x:col*60,y:row*60,w:60,h:60,hp:4,maxHp:4});
 Object.defineProperty(r,'blocks',{get(){throw Error('No full-shaft scan');}});assert(C.start(r,1000));return r.cosmosStagedUltimate;}
let e=fresh(1);assert.equal(C.orbitBoost(r,999).active,false);assert.equal(C.orbitBoost(r,1000).damage,2);
assert.equal(C.orbitBoost(r,1180).scale,1.85);assert(C.orbitBoost(r,5900).scale<1.85);assert(C.orbitBoost(r,5999).active);assert.equal(C.orbitBoost(r,6000).active,false);
C.shiftClock(r,10000);assert.equal(C.orbitBoost(r,11180).scale,1.85);C.update(r,16000,s);assert.equal(r.cosmosStagedUltimate,null);
e=fresh();assert.equal(e.stars.length,16);assert.equal(e.launched,0);assert.equal(hits.length,0);
C.update(r,1000,s);assert.equal(e.launched,1);assert.equal(hits.length,0);C.update(r,1219,s);assert.equal(e.launched,1);C.update(r,1220,s);assert.equal(e.launched,2);
const first=e.stars[0];assert(first.fromY<r.cameraY);assert(first.toY>r.slime.y);assert(first.flightMs>=580&&first.flightMs<=1000);
C.shiftClock(r,10000);C.update(r,11220,s);assert.equal(e.launched,2);assert.equal(hits.length,0);assert.equal(first.launchAt,11000);
function simulate(step){const e=fresh();for(let at=1000;at<=5800;at+=step)C.update(r,at,s);C.update(r,5800,s);return {e,count:hits.length,loss:r.terrain.reduce((sum,b)=>sum+4-b.hp,0)};}
for(const step of [16,100,4800]){
 const result=simulate(step);assert.equal(result.e.launched,16);assert.equal(result.e.impacts,16);assert.equal(result.count,16);assert.equal(result.loss,32,'Exactly 32 total damage, no splash');
 assert(result.e.stars.every(star=>star.impacted));assert(hits.every(h=>h.n===2&&h.cause==='cosmosStarfall'));assert(result.e.bursts.length<=8);
 const count=hits.length;C.update(r,5900,s);assert.equal(hits.length,count,'No repeated impacts');C.update(r,6000,s);assert.equal(r.cosmosStagedUltimate,null);
}
e=fresh();r.terrain=[];C.update(r,5900,s);assert.equal(e.launched,16);assert.equal(e.impacts,0,'Empty terrain still gets 16 visual stars');
// One destroyed target may redirect to one block below, never explode an area.
fresh();r.ultimateProfile={...r.ultimateProfile,starCount:1};C.start(r,1000);C.update(r,1000,s);e=r.cosmosStagedUltimate;e.stars[0].target.dead=true;C.update(r,2200,s);assert.equal(hits.length,1);assert.equal(hits[0].n,2);
// A single cached halo and bounded analytical trails; no live blur or particle arrays.
const ctx={save(){},restore(){},translate(){},rotate(){},drawImage(){draws++;}};
e=fresh();for(let at=1000;at<6000;at+=16){C.update(r,at,s);draws=0;C.draw(ctx,r,at);assert(draws<=80,`Draw budget: ${draws}`);}
assert.equal(gradients,1);assert.equal(U.get('cosmos',3).orbitRows,20);assert.equal(U.get('cosmos',3).durationMs,5500);
console.log('Cosmos I/II: five-second planet boost, sequential 16 stars, indexed targets, exact single-target damage, no splash, bounded VFX, low-FPS completion, pause, one cached halo, empty terrain and original III passed');
