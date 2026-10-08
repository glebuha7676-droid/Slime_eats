const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const take = name => {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 20);
  assert.ok(start >= 0 && end > start, name);
  return source.slice(start, end);
};
const window = {}, run = { worldId:1, cellSize:40, blocks:[], blocksByRow:new Map(),
  slime:{x:100,y:70,radius:22,vx:0,vy:100}, health:3, shake:0,
  barrier:25, damageInvulnerableUntil:0, shieldMines:[], specialEffects:[],
  sporeProjectiles:[], ultimateRechargePending:'shield', categoryVisuals:{} };
let recharge = 0;
const context = { window, run, Math, VIEW_W:240, performance:{now:()=>1000},
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
  mechSuitActive:()=>false, applyBlockBounce(){}, sound(){}, feedback(){}, impact(){}, updateRunUI(){},
  finishUltimateRecharge(){ recharge++;run.ultimateRechargePending=''; },
  igniteBlock:(b,t)=>{b.fireDamageAt=t+1000;}, turnBlockToSnow:b=>{b.elementalSnow=true;},
  infectGlitchGroup:blocks=>{for(const b of blocks)b.glitchInfected=true;},
  damageBlockByElement:(b,n)=>{b.hp=Math.max(0,b.hp-n);},
  pushElementalEffect:(type,x,y,extra)=>run.specialEffects.push({type,x,y,...extra}),
  ensureSporeSprites(){},launchSpore:(block,t,options)=>run.sporeProjectiles.push({block,...options}),
  spawnSpecialBurst(){}, resetCombo(){}, endRun(){}, createDebris(){}
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'..','js/rendering/dominant-shield.js'),'utf8'),context);
vm.runInContext(['blockCenter','nearbyGridBlocks','elementalDamageable','shieldDominant','burstDominantShield',
  'applyDominantShieldReaction','updateShieldMines','resolveHazardHit'].map(take).join('\n'),context);
const shield = window.DominantShield;
assert.equal(shield.dominant({}), 'base');
assert.equal(shield.dominant({fire:1,frost:2}), 'frost');
assert.equal(shield.dominant({nano:2,fire:1}), 'nano');
const colors = new Set(), icons = new Set();
for(const type of ['fire','frost','electric','nano','cloning','glitch','cosmos','telekinesis','phantom']) {
  colors.add(shield.palette(type)[0]); icons.add(shield.icon(type));
  assert.equal(shield.icon(type),shield.icon(type),'Cached icon');
  const spike = {id:0,row:3,col:2,x:80,y:120,w:40,h:40,hazard:true,unbreakable:true,hp:Infinity,dead:false};
  run.blocks=[spike];run.blocksByRow=new Map();run.barrier=25;run.shieldMines=[];
  run.sporeProjectiles=[];run.specialEffects=[];run.categoryVisuals={[type]:2};
  run.damageInvulnerableUntil=0;run.ultimateRechargePending='shield';
  for(let row=2;row<=7;row++)for(let col=0;col<6;col++) {
    if(row===3&&col===2)continue;
    const b={id:row*6+col,row,col,x:col*40,y:row*40,w:40,h:40,hp:4,dead:false};
    run.blocks.push(b);if(!run.blocksByRow.has(row))run.blocksByRow.set(row,[]);run.blocksByRow.get(row).push(b);
  }
  const neighbors = context.nearbyGridBlocks(spike,context.elementalDamageable);
  context.applyDominantShieldReaction(spike,1000);
  assert.equal(run.barrier,25,'Activation reaction leaves the bubble intact');
  const beforeBurst=run.specialEffects.length+run.sporeProjectiles.length+run.shieldMines.length;
  assert.equal(context.resolveHazardHit(spike,{nx:0,ny:-1,penetration:2},1000),true);
  assert.equal(run.health,3,type+' consumes no heart');assert.equal(run.barrier,0);
  assert.equal(spike.dead,false,'Shield never destroys the spike');
  assert.equal(run.shieldPop.type,type);assert.equal(run.ultimateRechargePending,'');
  assert.equal(beforeBurst,run.specialEffects.length+run.sporeProjectiles.length+run.shieldMines.length,'Breaking the shield must not apply the reaction again');
  const count=run.specialEffects.length+run.sporeProjectiles.length+run.shieldMines.length;
  assert.equal(context.burstDominantShield(spike,1001),false,'One reaction per shield');
  assert.equal(count,run.specialEffects.length+run.sporeProjectiles.length+run.shieldMines.length);
  if(type==='fire')assert.ok(neighbors.every(b=>b.fireDamageAt===2000));
  if(type==='frost')assert.ok(neighbors.every(b=>b.elementalSnow));
  if(type==='glitch')assert.ok(neighbors.every(b=>b.glitchInfected));
  if(type==='electric') {
    assert.equal(run.specialEffects.length,2);
    for(const [i,side] of [[0,-1],[1,1]])assert.ok(run.specialEffects[i].points.slice(1).every(p=>side*(p.x-100)>0));
  }
  if(type==='nano') {
    assert.equal(run.shieldMines.length,2);assert.notEqual(run.shieldMines[0].target,run.shieldMines[1].target);
    assert.ok(run.shieldMines.every(m=>m.target.row>spike.row));
    context.updateShieldMines(1400);assert.equal(run.shieldMines.length,2);
    context.updateShieldMines(1600);assert.equal(run.shieldMines.length,0);
  }
  if(type==='cloning')assert.equal(run.sporeProjectiles.length,2);
  if(['cosmos','telekinesis','phantom'].includes(type))assert.ok(run.blocks.slice(1).every(b=>b.hp===4));
}
assert.equal(colors.size,9);assert.equal(icons.size,9);assert.equal(recharge,9);
console.log('Nine shield colours/icons; one protected hit; six reactions around the hit block; two mines/spores; recharge; other dominants cosmetic only.');
