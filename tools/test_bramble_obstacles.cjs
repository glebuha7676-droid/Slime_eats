const assert=require('node:assert/strict'),gen=require('../js/generation/world1-descent.js'),roots=require('../js/gameplay/bramble-obstacles.js');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let seed=1;seed<=100;seed++){
 const p=gen.build({stage:3,random:rng(seed)});
 for(const h of p.hazards.filter(h=>h.kind==='bramble')){
  const cells=p.cells.flat().filter(b=>b.bramble?.groupId===h.encounterId);
  assert.equal(cells.length,18);assert.equal(cells.filter(b=>b.bramble.core).length,1);
  assert(cells.every(b=>!b.dead&&!b.hazard&&!b.flaskTier));
  assert(p.cells[h.row-1].every(b=>b.bramble&&!b.bramble.core),'Solid armoured row shields the knot across the full shaft');
  assert.equal(new Set(cells.map(b=>b.col)).size,6);
 }
}
const blocks=Array.from({length:18},(_,i)=>({id:i,x:i%6*60,y:Math.floor(i/6)*60,w:60,h:60,hp:4,maxHp:4,bramble:{groupId:1,core:i===9,baseMaxHp:1+i%3}}));
const run={blocks,cameraY:0};roots.init(run);
blocks[0].hp=1;blocks[1].dead=true;blocks[2].elementalSnow=true;blocks[2].hp=blocks[2].maxHp=1;
blocks[9].dead=true;
assert.equal(roots.collapse(run,blocks[9],1000),0);
assert.equal(blocks.filter(b=>b.dead).length,2,'Only explicitly destroyed rock and the knot die');
assert.equal(blocks[0].hp,1,'Damage already dealt is not healed');
assert.equal(blocks[2].maxHp,1,'Snow conversion is not reversed');
for(const b of blocks.filter(b=>!b.dead))assert(!b.bramble&&b.hp<=b.maxHp&&b.maxHp<=3);
assert.equal(run.brambleBursts.length,1);roots.collapse(run,blocks[9],1100);assert.equal(run.brambleBursts.length,1);
roots.shiftClock(run,400);assert.equal(run.brambleBursts[0].at,1400);
console.log('400 full-width root networks; 4 HP armour release preserves terrain, prior damage, snow and single collapse.');
