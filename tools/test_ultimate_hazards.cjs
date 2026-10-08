const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'game.js'), 'utf8');
const take = name => {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 20);
  assert.ok(start >= 0 && end > start, name);
  return source.slice(start, end);
};
const run = { worldId: 1, slime: {x:100,y:100,radius:20,vx:0,vy:100},
  cellSize:40,columns:6,blockRowOrigin:0,blocksByRow:new Map(),
  health:3,barrier:0,blocksDestroyed:0,experienceEarned:0,particles:[],shake:0,
  ultimateCharge:0,elementalAbilityCharges:0,shieldCharges:0,glitchInfectedBlocks:new Set() };
const context = { run, Math, performance:{now:()=>1000},
  mechSuitActive:()=>run.mechSuit?.phase==='active', elementalDamageable:b=>!b.dead&&!b.hazard&&!b.unbreakable,
  ultimateChargeBlocked:c=>['cosmosUltimate','mech'].includes(c), blockIsGolden:()=>false,
  spreadFireFromBrokenBlock(){}, registerBrokenBlock(){}, createDebris(){}, elementalLevel:()=>0,
  sound(){},feedback(){},impact(){},shareGlitchHit(){},
};
vm.createContext(context);
vm.runInContext(['awardRunExperience','destroyBlock','damageBlockByElement','resolveHazardHit','breakCosmosUltimatePath'].map(take).join('\n'),context);
const spike = overrides=>({id:1,row:2,col:2,x:80,y:80,w:40,h:40,hp:Infinity,maxHp:Infinity,dead:false,hazard:true,unbreakable:true,...overrides});
let block = spike();
assert.equal(context.destroyBlock(block,'impact'),false);
assert.equal(context.damageBlockByElement(block,100,'nano'),false);
assert.equal(block.dead,false,'Ordinary attacks must not remove spikes');
run.cosmosUltimate={fadeUntil:2000};
assert.equal(context.resolveHazardHit(block,null,1000),false,'Cosmos needs no collision/bounce');
assert.equal(block.dead,true);assert.equal(block.hp,0);assert.equal(run.health,3);
assert.equal(run.blocksDestroyed,1);assert.equal(run.ultimateCharge,0);assert.equal(run.experienceEarned,0);
assert.equal(context.damageBlockByElement(block,100,'cosmosUltimate'),false);
assert.equal(run.blocksDestroyed,1,'Repeated hits cannot count the hazard twice');
block=spike({id:2});run.blocksByRow.set(2,[block]);
context.breakCosmosUltimatePath(100,100,1100);
assert.equal(block.dead,true,'Comet path crushes spikes');
run.cosmosUltimate=null;run.mechSuit={phase:'active'};block=spike({id:3});
assert.equal(context.resolveHazardHit(block,null,1200),false);
assert.equal(block.dead,true,'Mech contact crushes spikes');
block=spike({id:4});assert.equal(context.damageBlockByElement(block,2,'mech',1300),true);
assert.equal(block.dead,true,'Mech shots crush spikes');assert.equal(run.health,3);
console.log('Spikes: ordinary attacks blocked; comet, mech contact and shots destroy them without bounce, duplicate rewards or null-collision errors.');
