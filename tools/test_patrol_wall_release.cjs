const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../game.js'), 'utf8');
function extract(name) {
  const start = source.indexOf(`  function ${name}(`);
  assert.ok(start >= 0, name);
  return source.slice(start, source.indexOf('\n  function ', start + 10));
}
const context = {
  Math, VIEW_W:440, VIEW_H:840,
  BALANCE:{gravityBase:570,gravityPerWorld:0,bounceGraceMs:120,sideBounceMax:150},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)), lerp:(a,b,t)=>a+(b-a)*t,
  save:{onboarding:{controlsLearned:true}},
  mechSuitActive:()=>false, updateCosmosUltimateMotion:()=>false,
  updatePhantomCycle:()=>false, speedDrillActive:()=>false, isSlimeFrozen:()=>false,
  elementalLevel:()=>0, mechSlowZoneImmune:()=>false, honeyZoneForSlime:()=>null,
  jellyZoneForSlime:()=>null, freezeZoneForSlime:()=>null, normalFallSpeedLimit:()=>305,
  fallSteeringVector:()=>({x:0,y:0,down:0}), massRadiusForLevel:()=>30,
  updateSpeedPassive(){}, applyFallSteering(){}, updateHoneyState(){},
  updateJellyState(){}, updateFreezeZoneState(){}, updateFlasks(){},
  applyPortalAttraction(){}, slimeTouchesPortal:()=>false,
  getPortalGeometry:()=>({bottom:10000}), resetMassPierce(){}, resetCombo(){},
  sound(){}, feedback(){}, impact(){}, updateRunUI(){},
  endRun(){throw Error('Unexpected death')},
  blocksNearY:()=>context.run.blocks,
  resolveBlockHit:(block,collision,time)=>context.resolveHazardHit(block,collision,time)
};
vm.createContext(context);
for (const name of ['circleRectCollision','stabilizeSlimeContact','applyBlockBounce',
  'releaseSlimeFromPatrol','resolveHazardHit','updatePhysics']) vm.runInContext(extract(name), context);
for (const side of ['left','right']) for (const contact of ['damage','invulnerable','cooldown']) {
  const block={id:1,hazard:true,x:side==='left'?32:338,y:600,w:70,h:70,motion:{axis:'x'}};
  context.run={worldId:1,world:{targetDepth:500},rowCount:70,cellSize:70,
    health:3,barrier:0,slime:{x:side==='left'?30:410,y:636,radius:30,vx:0,vy:80,wobble:0},
    blocks:[block],hitCooldowns:new Map(contact==='cooldown'?[[1,990]]:[]),
    bounceGraceUntil:0,damageInvulnerableUntil:contact==='invulnerable'?5000:0,
    cameraY:0,portalY:10000,flightDistance:0,maxFlight:0,maxDepth:0,
    shake:0,healthFlashTime:0,lowMotionTime:0};
  context.updatePhysics(1/60,1000);
  const slime=context.run.slime;
  assert.ok(slime.x>=slime.radius && slime.x<=440-slime.radius,`${side}/${contact}: stays in shaft`);
  assert.ok(slime.y+slime.radius<block.y,`${side}/${contact}: released above patrol`);
  assert.ok(slime.vy<=-320,`${side}/${contact}: upward launch`);
  assert.ok(side==='left'?slime.vx>0:slime.vx<0,'Launch steers inward');
  assert.equal(context.run.health,contact==='damage'?2:3,'No extra damage on cooldown');
}
context.run={slime:{x:120,y:620,radius:30,vx:0,vy:80}};
const original={...context.run.slime};
assert.equal(context.releaseSlimeFromPatrol({hazard:true,x:150,y:600,w:70,motion:{axis:'x'}},{nx:-1},1000),false);
assert.equal(context.releaseSlimeFromPatrol({hazard:true,x:20,y:600,w:70},{nx:-1},1000),false);
assert.equal(context.releaseSlimeFromPatrol({hazard:true,x:20,y:600,w:70,motion:{axis:'x'}},{nx:0,ny:-1},1000),false);
assert.deepEqual(context.run.slime,original,'Normal contacts keep their existing bounce');
console.log('Patrol edge release passed: both walls, damage, invulnerability and contact cooldown');
