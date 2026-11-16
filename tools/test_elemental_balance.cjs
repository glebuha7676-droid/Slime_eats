const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('game.js','utf8');
function take(name){const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);assert(a>=0&&b>a,name);return source.slice(a,b);}
const fixedMath=Object.create(Math);fixedMath.random=()=>.1;
let hits=[],effects=[],stage=1;
const c={Math:fixedMath,Set,Map,performance:{now:()=>1000},ELECTRIC_IMPACT_WINDOW_MS:72,ELECTRIC_STORM_BOLT_MS:59,VIEW_H:780,
 elementalLevel:()=>stage,shareGlitchHit(){},recordMutationAction(){},blockCenter:b=>({x:b.x+b.w/2,y:b.y+b.h/2}),rand:(a,b)=>(a+b)/2,
 pushElementalEffect:(...args)=>effects.push(args),
 damageBlockByElement(b,n,cause,at){hits.push({b,n,cause,at});b.hp-=n;if(b.hp<=0)b.dead=true;}
};vm.createContext(c);
vm.runInContext(['nearbyGridBlocks','elementalDamageable','igniteBlock','updateBurningBlocks','pickElectricNeighbour','electricArc',
  'strikeElectricBlock','electricDashPhasesThrough','finishElectricDash','electricStormZone','launchElectricStormStrike','dischargeFromImpact'].map(take).join('\n'),c);
vm.runInContext(source.match(/const FIRE_(?:BURN_INTERVAL|FRAGILE_BURN|FINAL_BURN)_MS = .*;/g).join('\n'),c);
function fresh(){hits=[];effects=[];c.run={cellSize:60,cameraY:0,burningBlocks:new Set(),blocks:[],blocksByRow:new Map(),electricStormBolts:[],electricStormHits:[]};}
function block(row,col,hp=4){const b={id:row+'-'+col,row,col,x:col*60,y:row*60,w:60,h:60,hp,maxHp:hp};c.run.blocks.push(b);if(!c.run.blocksByRow.has(row))c.run.blocksByRow.set(row,[]);c.run.blocksByRow.get(row).push(b);return b;}
for (stage=1;stage<=3;stage+=1) {
  fresh();
  const fragile=block(3,2,1),normal=block(3,3,2),strong=block(3,4,3),reinforced=block(4,3,4);
  const unlit=block(2,2,1),unbreakable=block(2,3,3);
  const thickNormal=block(4,4,4);
  thickNormal.tier='hard';
  reinforced.bramble={};
  unbreakable.unbreakable=true;
  for (const [target,tier] of [[fragile,'dense'],[normal,'hard'],[strong,'reinforced'],[reinforced,'hard']]) {
    target.tier=tier;
    assert(c.igniteBlock(target,1000,stage===3));
    assert(!c.igniteBlock(target,1050),'Repeated hits may not accelerate active burns');
  }
  assert(c.igniteBlock(thickNormal,1000,stage===3));
  assert(!c.igniteBlock(unbreakable,1000));
  const interval=stage===1?410:245;
  c.updateBurningBlocks(1244);
  assert.equal(hits.length,0);
  c.updateBurningBlocks(1245);
  assert.deepEqual([fragile.hp,normal.hp,strong.hp],[0,stage===1?2:1,stage===1?3:2]);
  c.updateBurningBlocks(1000+interval);
  assert.deepEqual([fragile.hp,normal.hp,strong.hp,reinforced.hp],[0,1,2,3]);
  c.updateBurningBlocks(1884);
  assert.equal(normal.hp,1,'The last ordinary rock tick leaves time for charring');
  c.updateBurningBlocks(1885);
  assert.equal(normal.hp,stage===1?1:0);
  assert.equal(strong.hp,2);
  assert.equal(reinforced.hp,3);
  c.updateBurningBlocks(3200);
  assert.equal(thickNormal.hp,stage===1?3:0,'Upgraded fire continues beyond two ticks until ordinary rock is destroyed');
  assert.equal(unlit.hp,1);
  assert.equal(unlit.fireIgnitedAt,undefined);
  assert.equal(c.run.burningBlocks.size,0);
  assert(hits.every(hit=>hit.n===1 && hit.cause===(stage===3?'fireUltimate':'fire')));
  assert(c.igniteBlock(strong,4000),'An extinguished rock accepts another ignition');
  assert(!c.igniteBlock(strong,4100),'A live burn cannot be refreshed or stacked');
  c.updateBurningBlocks(4000+interval);
  assert.equal(strong.hp,1);
  assert(c.igniteBlock(strong,5000));
  c.updateBurningBlocks(5000+interval);
  assert(strong.dead);
}
// Stage I arcs once; stage II adds one forward or lateral neighbour.
for (stage = 1; stage <= 3; stage++) {
  fresh();
  for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) block(row, col, 8);
  const sourceBlock = c.run.blocks.find(b => b.row === 2 && b.col === 2);
  assert.equal(c.dischargeFromImpact(sourceBlock, 1000), stage === 1 ? 1 : 2);
  const queue = c.run.electricStormHits;
  const primary = queue[0].block;
  assert(primary !== sourceBlock && primary.row >= sourceBlock.row);
  assert.equal(queue.length, stage === 1 ? 1 : 2);
  assert.equal(hits.length, 0, 'The shock lands when the bolt reaches the block');
  assert(queue.every(hit => hit.damage === 1));
  if (stage >= 2) {
    const branch = queue[1].block;
    assert(branch !== primary && branch !== sourceBlock && branch.row >= sourceBlock.row);
    assert(Math.abs(primary.col - branch.col) <= 1 && Math.abs(primary.row - branch.row) <= 1);
    assert(queue[1].at > queue[0].at);
  }
  assert.equal(c.dischargeFromImpact(sourceBlock, 1040), 0);
  assert(c.dischargeFromImpact(sourceBlock, 1100) > 0);
}
fresh();
const sourceBlock = block(2, 1);
block(1, 0); block(1, 1); block(1, 2);
assert.equal(c.dischargeFromImpact(sourceBlock, 1000), 0, 'The three tiles behind the hit are ineligible');
fresh();
stage = 3;
Object.assign(c.run, { columns: 6, gridOffsetX: 0, blockRowOrigin: 0 });
for (let row = 0; row < 12; row++) for (let col = 0; col < 6; col++) block(row, col, 8);
const storm = { firstRow: 1, leftFirst: true };
const visited = new Set();
for (let i = 0; i < 6; i += 1) {
  const zone = c.electricStormZone(storm, i);
  assert.equal(zone.col, i % 2 ? 4 : 1);
  assert.equal(zone.row, 2 + Math.floor(i / 2) * 3 + i % 2);
  assert.equal(zone.blocks.length, 9);
  for (const tile of zone.blocks) {
    assert(!visited.has(tile), 'The six squares cover distinct tiles');
    visited.add(tile);
  }
  c.run.electricStormHits = [];
  c.run.electricStormBolts = [];
  c.launchElectricStormStrike(storm, zone, 1000);
  const [center, ...neighbors] = c.run.electricStormHits;
  assert.equal(center.block, zone.center);
  assert(center.center && center.storm);
  assert.equal(neighbors.length, 8);
  assert(neighbors.every(hit => hit.damage === 2 && hit.storm && hit.at > center.at));
  assert.equal(c.run.electricStormBolts.length, 9);
  assert(c.run.electricStormBolts.slice(1).every(bolt => bolt.from === zone.point));
}
const original = c.electricStormZone(storm, 0).center;
original.dead = true;
const excavated = c.electricStormZone(storm, 0);
assert.equal(excavated.blocks.length, 8);
assert.equal(excavated.center, undefined);
assert.equal(excavated.point.x, original.x + original.w / 2);
c.run.electricStormHits = [];
c.launchElectricStormStrike(storm, excavated, 1000);
assert(c.run.electricStormHits.every(hit => !hit.center && hit.damage === 2));
assert.equal(c.electricStormZone({ ...storm, leftFirst: false }, 0).col, 4);
Object.assign(c, {
  blocksNearY: () => c.run.blocks, isLowPowerDevice: () => false, normalFallSpeedLimit: () => 320, sound() {}, feedback() {},
  circleRectCollision: (p, b, radius) => {
    const dx = p.x-Math.max(b.x,Math.min(b.x+b.w,p.x));
    const dy = p.y-Math.max(b.y,Math.min(b.y+b.h,p.y));
    return dx*dx+dy*dy<radius*radius;
  }
});
fresh();
for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) block(row, col, 8);
c.run.electricStormHits = [];
c.run.electricStormBolts = [];
const origin = { x: 210, y: 210 };
c.run.slime = { ...origin, radius: 21, vx: 420, vy: 500 };
c.run.electricDash = { endedAt: null };
c.run.shake = 0;
c.rand = (a,b) => (a+b)/2;
c.finishElectricDash(1100);
assert(c.run.electricStormHits.length > 1);
assert(c.run.electricStormHits.every(hit => hit.damage === 1 && hit.at > 1100));
assert.equal(new Set(c.run.electricStormHits.map(hit => hit.block)).size, c.run.electricStormHits.length);
assert.equal(c.run.electricStormBolts.length, 5);
assert(c.run.electricStormBolts.every(bolt => bolt.from.x === origin.x && bolt.from.y === origin.y));
const landingBlock = c.run.blocksByRow.get(3)[3];
assert(landingBlock.dead && !c.run.electricStormHits.some(hit => hit.block === landingBlock));
assert(c.electricDashPhasesThrough({}));
assert(!c.electricDashPhasesThrough({ hazard: true }));
assert(!c.electricDashPhasesThrough({ unbreakable: true }));
const hitCount = c.run.electricStormHits.length;
c.finishElectricDash(1101);
assert.equal(c.run.electricStormHits.length, hitCount);
fresh();
for (let row = 0; row < 6; row++) for (let col = 0; col < 6; col++) block(row, col, 8);
c.run.slime = { x: 175, y: 181, radius: 21, vx: 0, vy: 500 };
c.run.electricDash = { endedAt: null };
c.run.shake = 0;
c.finishElectricDash(1100);
assert.deepEqual(c.run.blocks.filter(b=>b.dead).map(b=>[b.row,b.col]),[[2,2],[2,3],[3,2],[3,3]]);
assert(!c.run.blocks.some(b=>!b.dead && c.circleRectCollision(c.run.slime,b,c.run.slime.radius)));
console.log('Elemental balance: storm, passive lightning, five rays and clean dash exits passed');
