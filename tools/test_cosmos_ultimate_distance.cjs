const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const take=name=>{const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);assert.ok(a>=0&&b>a,name);return source.slice(a,b);};
let travelled=[];
const c={Math,performance:{now:()=>1000},VIEW_W:360,VIEW_H:780,
  ELEMENTAL_ABILITY_DURATION_MS:{cosmos:5500},COSMOS_ULTIMATE_CHARGE_MS:920,
  COSMOS_ULTIMATE_RAMP_MS:270,COSMOS_ULTIMATE_FADE_START_MS:4000,COSMOS_ULTIMATE_ROWS:20,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),lerp:(a,b,t)=>a+(b-a)*t,
  fallSteeringVector:()=>({x:0}),normalFallSpeedLimit:()=>270,
  sound(){},feedback(){},impact(){},pushElementalEffect(){},updateRunUI(){},updateFlasks(){},
  getPortalGeometry:()=>({bottom:10000}),slimeTouchesPortal:()=>false,
  breakCosmosUltimatePath(x,y){travelled.push([y,c.run.slime.y]);},beginPortalEntry(){throw Error('unexpected portal entry');},
};vm.createContext(c);
vm.runInContext(['commitElementalAbility','cosmosUltimatePower','updateCosmosUltimateMotion'].map(take).join('\n'),c);
for(const step of [16,33,100]){
  travelled=[];c.run={slime:{x:180,y:700,radius:20,vx:0,vy:70,wobble:0},cellSize:60,
    elementalAuraId:0,damageInvulnerableUntil:0,shake:0,flightDistance:0,maxFlight:0,
    rowCount:100,world:{targetDepth:500},portalY:7000,cameraY:300,maxDepth:0,health:3};
  c.commitElementalAbility('cosmos',1000,180,700);
  assert.equal(c.run.cosmosUltimate.endY,1900,'twenty rows from the activation position');
  for(let now=1000;now<6500&&!c.run.cosmosUltimate.finishedAt;now+=step)c.updateCosmosUltimateMotion(step/1000,now);
  const u=c.run.cosmosUltimate;
  assert.ok(u.finishedAt,'ult reaches its distance limit before timeout');
  assert.equal(c.run.slime.y,1900,'no overshoot even with 100 ms frames');
  assert.ok(travelled.every(([a,b])=>a<=1900&&b<=1900),'destruction stays inside travel limit');
  assert.equal(c.updateCosmosUltimateMotion(.1,u.finishedAt+100),false,'normal physics resumes during cosmetic fade');
  assert.equal(c.run.slime.y,1900,'fading comet cannot keep drilling');
  assert.equal(c.run.elementalAbilityUntil,u.finishedAt+420,'bounded visual fade');
  assert.equal(c.run.damageInvulnerableUntil,u.finishedAt+180,'invulnerability does not linger for old duration');
}
console.log('Cosmos ultimate: exact twenty-row travel at 60/30/10 FPS, no overshoot or continued drilling, normal physics during fade passed.');
