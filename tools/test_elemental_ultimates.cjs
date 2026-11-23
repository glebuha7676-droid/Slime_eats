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
function fresh(id,stage){hits=[];r={ultimateProfile:U.get(id,stage),cellSize:60,columns:6,gridOffsetX:0,blockRowOrigin:0,elementalAuraId:1,slime:{x:210,y:150,radius:24,vx:0,vy:120},blocks:[]};
 for(let row=0;row<20;row++)for(let col=0;col<6;col++)r.blocks.push({row,col,x:col*60,y:row*60,w:60,h:60,hp:4,flaskTier:3,flaskValue:5});
 return r;
}
function indexTiles() {
  r.blocksByRow = new Map();
  for (const b of r.blocks) r.blocksByRow.set(b.row,[...(r.blocksByRow.get(b.row)||[]),b]);
}
function fireFlashCells(x, y, delay) {
  fresh('fire', 2);
  indexTiles();
  E.startFireFlash(r, 1000);
  r.slime.x = x;
  r.slime.y = y;
  E.update(r, 1289, services);
  assert.equal(hits.length, 0);
  assert.equal(E.fireCastLight(r,1000),null);
  assert(E.fireCastLight(r,1095).glow>.9);
  assert(E.fireCastLight(r,1289).glow>.9);
  E.update(r, 1000 + delay, services);
  E.update(r, 1405, services);
  assert(E.fireCastLight(r,1405).glow>.4);
  assert.equal(E.fireCastLight(r,1570),null);
  assert.equal(new Set(hits).size, hits.length);
  const result = hits.map(b => [b.row, b.col, b.fireDamageAt]);
  E.update(r, 1715, services);
  assert.equal(r.fireFlash, null);
  return result;
}
const area = (row,col) => Array.from({length:9},(_,i)=>[row+Math.floor(i/3),col+i%3]);
const centered = fireFlashCells(210, 222, 290);
assert.deepEqual(centered, area(5,2).map(cell=>[...cell,2290]));
assert.deepEqual(fireFlashCells(210, 222, 405), centered, 'A delayed frame preserves the ignition time');
assert.deepEqual(fireFlashCells(1, 222, 290).map(([row,col])=>[row,col]),area(5,0));
assert.deepEqual(fireFlashCells(355, 222, 290).map(([row,col])=>[row,col]),area(5,3));
for (const y of [181,208,239]) {
  assert.deepEqual(fireFlashCells(210, y, 290), centered, 'One full row stays clear at every height inside a tile');
}
assert.equal(fireFlashCells(210, -300, 290).length,0);
fresh('fire', 2);
indexTiles();
E.startFireFlash(r, 1000);
r.slime.x=150;
r.slime.y=222;
E.shiftClock(r, 10000);
E.update(r, 11289, services);
assert.equal(hits.length,0);
E.update(r, 11290, services);
assert.equal(hits.length,9);
assert.equal(r.fireFlash.x,150);
assert.equal(r.fireFlash.y,390);

const source = fs.readFileSync('game.js','utf8');
const frost = { clamp:(x,a,b)=>Math.max(a,Math.min(b,x)), lerp:(a,b,t)=>a+(b-a)*t,
  feedback(){}, sound(){}, turnBlockToSnow(block, at){hits.push([block.row,block.col,at]);} };
const frostLogic = ['firstFrostRow','startFrostFlake','updateFrostFlake'].map(name =>
  source.match(new RegExp('  function '+name+'[(][\\s\\S]*?(?=\\n  function )'))[0]);
vm.runInNewContext(source.match(/  const FROST_FLAKE_[A-Z_]+ = [^;]+;/g).concat(frostLogic).join('\n'), frost);
function frostPath(x, y, vx, step) {
  fresh('frost',1);
  r.slime.vx = vx;
  indexTiles();
  frost.run = r;
  frost.startFrostFlake(x,y,1000);
  assert.equal(r.frostFlake.toY-y,300);
  for (let elapsed = step; elapsed < 520; elapsed += step) frost.updateFrostFlake(1000+elapsed);
  frost.updateFrostFlake(1520);
  assert(hits.length===10 && r.frostFlake.burst);
  const frozen = [...hits];
  frost.updateFrostFlake(1980);
  assert.equal(r.frostFlake,null);
  assert.deepEqual(hits,frozen);
  return frozen;
}
const trail = frostPath(180, 145, 0, 16);
assert.deepEqual(frostPath(180,145,0,520),trail);
assert.deepEqual([...new Set(trail.map(([row])=>row))],[2,3,4,5,6]);
for (const [x, vx, pair] of [[8,0,[0,1]],[210,-40,[2,3]],[210,0,[3,4]],[353,0,[4,5]]]) {
  assert.deepEqual([...new Set(frostPath(x,150,vx,30).map(([,col])=>col))],pair);
}

for (const [x, direction, dt] of [[180, 0, 1 / 60], [180, -1, 1 / 120], [180, 1, .034], [26, -1, .034]]) {
  fresh('electric', 1);
  r.slime.x = x;
  const y = r.slime.y;
  E.startElectricDash(r, 2000, direction, 360);
  let ended = false, steps = 0;
  while (!ended && steps++ < 50) {
    ended = E.driveElectricDash(r, dt);
    r.slime.x += r.slime.vx * dt;
    r.slime.y += r.slime.vy * dt;
    E.sampleElectricDash(r, 2000 + steps * dt * 1000);
  }
  assert(ended);
  assert(Math.abs(Math.hypot(r.slime.x - x, r.slime.y - y) - 180) < 1e-6);
  assert.equal(Math.sign(r.slime.x - x), direction);
  assert(r.slime.x >= r.slime.radius - 1e-6 && r.slime.x <= 360 - r.slime.radius);
  assert(r.electricDash.trail.length > 2 && r.electricDash.trail.length <= 13);
  r.electricDash.endedAt = 2300;
  E.shiftClock(r, 1000);
  assert.equal(r.electricDash.endedAt, 3300);
  E.update(r, 3485, services);
  assert.equal(r.electricDash, null);
}
console.log('Elemental attacks: a centered 3x3 fire flash, five-row frost trail and three-cell dash across diagonal, wall and frame-rate cases passed');
