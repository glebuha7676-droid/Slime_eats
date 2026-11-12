const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{SlimeGameAssets:{projectSprite:()=>({})}}};
for(const file of ['js/config/ultimate-stages.js','js/abilities/elemental-ultimates.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
const U=context.window.SlimeUltimateStages,E=context.window.SlimeElementalUltimates;
let r,hits=[];
const services={
 blocksNearY:(y,radius)=>r.blocks.filter(b=>Math.abs(b.y+b.h/2-y)<=radius+60),
 elementalDamageable:b=>!b.dead&&!b.hazard&&!b.unbreakable,
 frostFreezable:b=>!b.dead&&!b.hazard&&!b.unbreakable&&!b.special,
 igniteBlock:(b,at)=>{b.fireDamageAt=at+1000;hits.push(b)},
 turnBlockToSnow:b=>{b.elementalSnow=true;b.hp=1;hits.push(b)},
 damageBlockByElement:(b,n)=>{b.hp-=n;if(b.hp<=0)b.dead=true;hits.push(b)}
};
function fresh(id,stage){hits=[];r={ultimateProfile:U.get(id,stage),cellSize:60,columns:6,gridOffsetX:0,blockRowOrigin:0,elementalAuraId:1,slime:{x:210,y:150,radius:24},blocks:[]};
 for(let row=0;row<20;row++)for(let col=0;col<6;col++)r.blocks.push({row,col,x:col*60,y:row*60,w:60,h:60,hp:4,flaskTier:3,flaskValue:5});
 E.start(r,id,1000,210,150,services);return r.stagedUltimate;
}
// Frost remains radial; fire sweeps an exact forward rectangle with no rear damage.
let flash=fresh('frost',1);assert(hits.length>8&&hits.length<36);assert(hits.some(b=>b.row<2)&&hits.some(b=>b.row>2));assert(hits.every(b=>b.flaskValue===5&&b.flaskTier===3));E.update(r,1851,services);assert.equal(r.stagedUltimate,null);
flash=fresh('fire',1);assert.equal(hits.length,0);E.update(r,1200,services);const near=hits.length;assert(near>0);assert(hits.every(b=>b.y+b.h/2>150));
E.update(r,1650,services);assert(hits.length>near);const waveHits=hits.length;assert.equal(waveHits,8);assert.equal(new Set(hits).size,waveHits);assert(hits.every(b=>b.row>=3&&b.row<=6));
E.update(r,1800,services);assert.equal(hits.length,waveHits);E.update(r,1851,services);assert.equal(r.stagedUltimate,null);
let e=fresh('fire',2);assert.equal(e.kind,'fireWave');assert.equal(hits.length,0);
E.update(r,1900,services);assert.equal(hits.length,24,'Four columns × six rows');
assert.equal(new Set(hits.map(b=>b.col)).size,4);assert.equal(new Set(hits.map(b=>b.row)).size,6);
for(const stage of [1,2])for(const x of [1,30,180,330,359]){
 fresh('fire',stage);r.slime.x=x;E.start(r,'fire',1000,x,150,services);
 E.update(r,1000+r.ultimateProfile.growMs,services);
 assert.equal(hits.length,r.ultimateProfile.width*r.ultimateProfile.rows,'A wall never crops the attack footprint');
 assert.equal(new Set(hits).size,hits.length,'Each block is ignited once');
}
fresh('fire',2);E.update(r,1250,services);const beforePause=hits.length;E.shiftClock(r,10000);E.update(r,11250,services);assert.equal(hits.length,beforePause);E.update(r,11900,services);assert.equal(hits.length,24);
e=fresh('frost',2);E.update(r,2250,services);
const frozen=r.blocks.filter(b=>b.elementalSnow);
assert.equal(frozen.length,21,'Seven rows, exactly three columns');
assert.deepEqual([...new Set(frozen.map(b=>b.col))],[2,3,4]);
assert.deepEqual([...new Set(frozen.map(b=>b.row))],[3,4,5,6,7,8,9]);
assert(frozen.every(b=>b.flaskTier===3&&b.flaskValue===5));
assert.equal(e.y-e.originY,420,'50m = 7 cells');
// Frame rate independence: a swept update equals many small updates.
fresh('frost',2);for(let at=1000;at<=2250;at+=50)E.update(r,at,services);assert.equal(r.blocks.filter(b=>b.elementalSnow).length,21);
// Lane clamps at both boundaries, never extending beyond the mine.
for(const x of [1,359]){fresh('frost',2);r.slime.x=x;E.start(r,'frost',1000,x,150,services);E.update(r,2250,services);assert.equal(r.blocks.filter(b=>b.elementalSnow).length,21);}
e=fresh('electric',1);assert.equal(e.bolts.length,4);assert.equal(hits.length,1,'Only the centre is hit at activation');
const far=r.blocks.find(b=>b.col===3&&b.row===6);assert.equal(far.hp,4);
E.update(r,1065,services);assert(hits.length>1);assert.equal(far.hp,4,'The outer block waits for the growing front');
E.update(r,1259,services);assert.equal(far.hp,4);E.update(r,1260,services);assert.equal(far.hp,3,'Front reaches exactly four cells after 260ms');
assert(hits.every(b=>b.col===3||b.row===2),'Cross has no diagonal damage');assert.equal(new Set(hits).size,hits.length,'Centre and ray intersections never deal repeated damage');
const crossCount=hits.length;E.update(r,1500,services);assert.equal(hits.length,crossCount);
fresh('electric',1);E.update(r,1260,services);assert.equal(hits.length,crossCount,'A slow frame still crosses every target once');
e=fresh('electric',1);E.update(r,1065,services);const nearHits=hits.length;E.shiftClock(r,10000);E.update(r,11065,services);assert.equal(hits.length,nearHits);E.update(r,11260,services);assert.equal(hits.length,crossCount,'Pause preserves the moving front');
e=fresh('electric',2);for(let at=1000;at<=3400;at+=16)E.update(r,at,services);
assert(hits.length>=18&&hits.length<=24,'Frequent bounded pulses; two targets per pulse');assert(e.bolts.length<=2);assert(e.trail.length<=8);
assert(e.hitAt.size<=24);assert.equal(r.ultimateProfile.damage,2);assert.equal(r.ultimateProfile.strikeIntervalMs,220);assert(hits.every(b=>(4-b.hp)%2===0),'Every discharge deals two damage');assert(e.y<=e.endY);
// A stalled frame never fires an accumulated barrage.
fresh('electric',2);E.update(r,1000,services);const before=hits.length;E.update(r,3000,services);assert(hits.length-before<=2);
e=fresh('electric',2);E.update(r,1350,services);const y=e.y;E.shiftClock(r,10000);E.update(r,11350,services);assert.equal(e.y,y,'Pause preserves travel');assert.equal(hits.length,2,'Pause preserves strike cadence');
E.update(r,13801,services);assert.equal(r.stagedUltimate,null);
for(const id of ['fire','frost','electric']){fresh(id,3);assert.equal(r.stagedUltimate,undefined,'III still belongs to existing ultimate code');for(let stage=1;stage<=3;stage++){assert(U.get(id,stage).name);assert.equal(U.get(id,stage).description,undefined);}}
console.log('Elemental ultimates: exact 2×4 / 4×6 fire sweeps, wall clamps, pause, frost and electric behavior passed');
