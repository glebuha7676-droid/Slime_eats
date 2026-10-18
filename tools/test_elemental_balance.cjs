const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('game.js','utf8');
function take(name){const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);assert(a>=0&&b>a,name);return source.slice(a,b);}
const fixedMath=Object.create(Math);fixedMath.random=()=>.1;
let hits=[],effects=[],stage=1;
const c={Math:fixedMath,Set,Map,performance:{now:()=>1000},FIRE_BURN_HITS:3,FIRE_BURN_INTERVAL_MS:1200,FIRE_TRANSFER_MS:220,ELECTRIC_IMPACT_WINDOW_MS:72,VIEW_H:780,
 elementalLevel:()=>stage,shareGlitchHit(){},blockCenter:b=>({x:b.x+b.w/2,y:b.y+b.h/2}),rand:(a,b)=>(a+b)/2,
 pushElementalEffect:(...args)=>effects.push(args),frostTargetAvailable:b=>!b.dead&&!b.special&&!b.hazard&&!b.unbreakable,
 snowTargetScore:b=>b.row,chooseSpacedFrostTargets:(blocks,count)=>blocks.slice(0,count),reserveFrostProjectileTarget(){},
 damageBlockByElement(b,n,cause,at){hits.push({b,n,cause,at});b.hp-=n;if(b.hp<=0){b.dead=true;c.spreadFireFromBrokenBlock(b,at,cause);}}
};vm.createContext(c);
vm.runInContext(['nearbyGridBlocks','elementalDamageable','igniteBlock','spreadFireFrom','spreadFireFromBrokenBlock','updateBurningBlocks','electricChainTargets','strikeElectricChain','dischargeFromImpact','scatterSnowShards'].map(take).join('\n'),c);
function fresh(){hits=[];effects=[];c.run={cellSize:60,cameraY:0,burningBlocks:new Set(),blocks:[],blocksByRow:new Map()};}
function block(row,col,hp=4){const b={id:row+'-'+col,row,col,x:col*60,y:row*60,w:60,h:60,hp,maxHp:hp};c.run.blocks.push(b);if(!c.run.blocksByRow.has(row))c.run.blocksByRow.set(row,[]);c.run.blocksByRow.get(row).push(b);return b;}
fresh();let b=block(1,1,5);assert(c.igniteBlock(b,1000));assert.equal(b.fireTicksLeft,3);assert.equal(b.fireDamageAt,2200);
assert(!c.igniteBlock(b,2100),'Touching again cannot reset or replenish an active burn');
for(const [at,hp,left] of [[2199,5,3],[2200,4,2],[3399,4,2],[3400,3,1],[4600,2,0],[10000,2,0]]){c.updateBurningBlocks(at);assert.equal(b.hp,hp);assert.equal(b.fireTicksLeft,left);}
assert.equal(hits.length,3);assert.equal(c.run.burningBlocks.size,0);assert.equal(effects.length,0,'A surviving block never transfers fire');
// A touched 4-HP rock breaks after three ticks. Its untouched neighbour survives with 1 HP.
fresh();b=block(1,1,3);const below=block(2,1,4),side=block(1,2,4),diagonal=block(2,2,4);c.igniteBlock(b,1000);
c.updateBurningBlocks(3400);assert.equal(effects.length,0,'Burn damage alone never spreads before destruction');
c.updateBurningBlocks(4600);assert(b.dead);assert.equal(below.fireTicksLeft,3);assert(!side.fireDamageAt&&!diagonal.fireDamageAt);
assert.equal(effects.length,1);assert.equal(effects[0][0],'fireTransfer');assert.equal(below.fireIgnitedAt,4820);
c.updateBurningBlocks(8420);assert.equal(below.hp,1);assert.equal(below.fireTicksLeft,0);assert.equal(effects.length,1,'No automatic chain through a surviving strong neighbour');
// Empty cells, corner-only contact, hazards and unbreakables cannot bridge a fire chain.
fresh();const dead=block(1,1);dead.dead=true;block(2,2);block(3,1);block(1,2).hazard=true;block(2,1).unbreakable=true;
c.spreadFireFrom(dead,1000);assert.equal(effects.length,0);assert.equal(c.run.burningBlocks.size,0);
fresh();b=block(1,1,6);c.igniteBlock(b,1000,9);c.updateBurningBlocks(5000);assert.equal(b.hp,3);assert.equal(hits.length,3);assert(hits.every(h=>h.cause==='fireUltimate'),'Ultimate ownership survives all delayed ticks');
// The exact same passive burn works at each cosmetic/ultimate grade.
for(stage=1;stage<=3;stage++){fresh();b=block(1,1,1);block(2,1);c.igniteBlock(b,1000);c.updateBurningBlocks(2200);assert.equal(effects.length,1);assert.equal(c.run.blocks[1].fireTicksLeft,3);}
// Two additional targets are distinct and can never return to the source.
stage=1;fresh();for(let row=0;row<5;row++)for(let col=0;col<5;col++)block(row,col,8);
const touched=c.run.blocks.find(b=>b.row===1&&b.col===2),other=c.run.blocks.find(b=>b.row===1&&b.col===3);
assert.equal(c.dischargeFromImpact(touched,2,1000),2);assert.equal(hits.length,2);assert(hits.every(h=>h.b!==touched));assert.equal(new Set(hits.map(h=>h.b)).size,2);
assert.equal(c.dischargeFromImpact(other,2,1000),0);assert.equal(c.dischargeFromImpact(other,2,1040),0);assert.equal(hits.length,2,'One corner collision produces one chain');
assert.equal(c.dischargeFromImpact(other,2,1100),2,'The next separate collision can discharge');
fresh();b=block(1,1);const neighbour=block(2,1);assert.equal(c.dischargeFromImpact(b,2,1000),1);assert.equal(hits[0].b,neighbour);assert.equal(b.hp,4,'No return hit on a short chain');
// Frost still freezes through its existing projectile path, with exactly two emissions.
for(stage=1;stage<=3;stage++){fresh();b=block(1,2);for(let row=3;row<10;row++)block(row,row%5);assert.equal(c.scatterSnowShards(b,1000),2);assert.equal(effects.length,2);assert(effects.every(e=>e[0]==='snowShard'&&e[3].transformKind==='snow'));}
assert(source.includes('dischargeFromImpact(block, ELECTRIC_CHAIN_LENGTH, timestamp)'));
assert(source.includes('const ELECTRIC_CHAIN_LENGTH = 2;'));
console.log('Elemental balance: three 1.2s fire ticks, no reset, delayed ownership, adjacent-only single transfer, no gap bridging, exactly two additional lightning targets, one chain per collision, two frost shards and stage-independent base passed');
