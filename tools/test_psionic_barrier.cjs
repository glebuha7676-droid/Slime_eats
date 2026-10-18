const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('game.js','utf8');
function take(name){const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);assert(a>=0&&b>a,name);return source.slice(a,b);}
let awarded=0;
const c={Math,Set,performance:{now:()=>1000},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
 ULTIMATE_BLOCKS_REQUIRED:65,ULTIMATE_POST_USE_CHARGE:10,ULTIMATE_BREAK_CAUSES:new Set(['psionicBarrier','telekinesisStorm']),
 blockCenter:b=>({x:b.x+b.w/2,y:b.y+b.h/2}),elementalDamageable:b=>!!b&&!b.dead&&!b.hazard&&!b.unbreakable,
 blockIsGolden:()=>false,shareGlitchHit(){},spreadFireFromBrokenBlock(){},awardRunExperience(){awarded++;},registerBrokenBlock(){},createDebris(){},
 sound(){},feedback(){},impact(){},updateRunUI(){},resetCombo(){},applyBlockBounce(){},mechSuitActive:()=>false,endRun(){},spawnSpecialBurst(){},
 blocksNearY:(y,radius)=>c.run.blocks.filter(b=>Math.abs(b.y+b.h/2-y)<=radius+40)};
vm.createContext(c);
vm.runInContext(['circleRectCollision','psionicBarrierActive','psionicBarrierRadius','startPsionicBarrier','explodePsionicHazard','updatePsionicBarrier','ultimateChargeBlocked','finishUltimateRecharge','destroyBlock','damageBlockByElement','resolveHazardHit'].map(take).join('\n'),c);
function fresh(){awarded=0;c.run={worldId:1,cellSize:40,slime:{x:100,y:100,radius:16,vx:0,vy:100},health:3,barrier:25,shake:0,blocks:[],blocksDestroyed:0,elementalAbilityType:'telekinesis',elementalAbilityCharges:0,elementalAbilityActive:'telekinesis',ultimateCharge:0,ultimateRechargePending:'elemental',damageInvulnerableUntil:0,ultimateProfile:{durationMs:3000},psionicBarrierBursts:[]};}
function b(row,col,extra={}){const b={id:row+':'+col,row,col,x:col*40,y:row*40,w:40,h:40,hp:4,maxHp:4,...extra};c.run.blocks.push(b);return b;}
fresh();const near=b(2,3,{hazard:true,unbreakable:true,hp:Infinity}),corner=b(3,3),side=b(2,4),far=b(2,6,{hazard:true,unbreakable:true,hp:Infinity});
assert.equal(c.psionicBarrierRadius(),38);c.startPsionicBarrier(1000);assert(near.dead,'Bubble destroys a spike before the slime touches it');assert.equal(corner.hp,3);assert.equal(side.hp,3);assert(!far.dead);
assert.equal(c.run.health,3);assert.equal(c.run.barrier,25,'Ordinary shield remains untouched');assert.equal(c.run.psionicBarrier.until,4000);assert.equal(c.run.ultimateCharge,0);
const before=awarded;c.updatePsionicBarrier(1000);assert.equal(awarded,before,'The same spike only explodes once');assert.equal(c.run.psionicBarrierBursts.length,1);
const next=b(3,2,{hazard:true,unbreakable:true,hp:Infinity});assert.equal(c.resolveHazardHit(next,{nx:0,ny:-1,penetration:2},1500),false);assert(next.dead);assert.equal(c.run.health,3);assert.equal(c.run.barrier,25);assert.equal(c.run.psionicBarrier.until,4000,'Contacts do not consume or extend the three-second barrier');
c.updatePsionicBarrier(3999);assert(c.psionicBarrierActive(3999));c.updatePsionicBarrier(4000);assert.equal(c.run.psionicBarrier,null);assert(!c.psionicBarrierActive(4000));
const outside=b(1,1,{hazard:true,unbreakable:true,hp:Infinity});assert.equal(c.explodePsionicHazard(outside,4000),false);assert(!outside.dead,'An expired barrier cannot destroy new spikes');
fresh();const a=b(2,3,{hazard:true,unbreakable:true,hp:Infinity}),other=b(2,4,{hazard:true,unbreakable:true,hp:Infinity});c.startPsionicBarrier(1000);assert(a.dead);assert(!other.dead,'Blast does not chain to untouched spikes outside the bubble');
const constants=source.slice(source.indexOf('  const ULTIMATE_BLOCKS_REQUIRED ='),source.indexOf('  const STARTER_MUTATIONS ='));assert(constants.includes("'psionicBarrier'"));assert(constants.includes("'telekinesisStorm'"));
console.log('Psionic barrier: 3 seconds, enlarged physical bubble, spike destruction before body contact, surrounding damage, no spike chain reaction, no repeated rewards, no hearts/normal-shield consumption and exact expiry passed');
