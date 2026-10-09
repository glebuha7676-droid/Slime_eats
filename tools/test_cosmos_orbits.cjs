const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const context = { window: {}, Math, performance: { now: () => 1000 },
  sound() {}, lerp: (a,b,t) => a + (b-a)*t, clamp: (n,a,b) => Math.min(b, Math.max(a,n)) };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/rendering/cosmos-orbits.js'), 'utf8'), context);
const model = context.window.SlimeCosmosOrbits;
const take = name => {
  const start = source.indexOf(`  function ${name}(`), end = source.indexOf('\n  function ', start + 20);
  assert.ok(start >= 0 && end > start, name); return source.slice(start, end);
};
vm.runInContext(['cosmosOrbitsEnabled','updateCosmosOrbits','cosmosUltimatePower','cosmosCometVisualStrength','setKeyboardSteering','blocksNearY'].map(take).join('\n'), context);
context.elementalDamageable = b => b && !b.dead && !b.hazard && !b.unbreakable;
context.elementalLevel = () => context.run.categoryVisuals.cosmos;
context.damageBlockByElement = (b, amount, cause) => { assert.equal(amount, 1); assert.equal(cause, 'cosmosOrbit'); b.hp -= amount; if (b.hp <= 0) b.dead = true; };
function fresh(level = 1) {
  context.run = { categoryVisuals: { cosmos: level }, slime: { x: 120, y: 240, radius: 20 },
    cellSize:40, blockRowOrigin:40, blocksByRow:new Map(), cosmosOrbitClock:0,
    cosmosOrbitAlpha:0, cosmosOrbitPrevious:null, cosmosOrbitContacts:[new Set(),new Set()],
    cosmosOrbitCooldowns:new WeakMap(),
    cosmosOrbitHitUntil:[0,0], cosmosOrbitSoundAt:0, elementalAbilityActive:'' };
  Object.defineProperty(context.run, 'blocks', { get() { throw Error('Orbits must query the row index, not scan the full shaft'); } });
  return context.run;
}
function placeAt(p, hp = 20, extra = {}) {
  const b = { x:p.x-8,y:p.y-8,w:16,h:16,hp,...extra };
  const row = Math.floor((b.y-context.run.blockRowOrigin)/40);
  context.run.blocksByRow.set(row,[...(context.run.blocksByRow.get(row)||[]),b]);
  return b;
}
let run = fresh();
assert.equal(model.samples({...run.slime, level:0}).length, 0);
assert.equal(model.samples({...run.slime, level:1}).length, 1);
const two = model.samples({...run.slime,level:2,clock:0});
const moved = model.samples({...run.slime,level:2,clock:100});
assert.equal(two.length,2); assert.ok(two[0].orbit > two[1].orbit);
assert.ok(moved[0].angle > two[0].angle && moved[1].angle < two[1].angle);
assert.equal(two[0].orbit,80); assert.equal(two[1].orbit,40);
assert.ok(moved[0].angle-two[0].angle > two[1].angle-moved[1].angle,'outer planet rotates faster');
assert.ok(moved[0].angle-two[0].angle<.13&&two[1].angle-moved[1].angle<.08,'both orbits use relaxed angular speeds');
assert.ok(two[0].radius > two[1].radius, 'the outer planet is medium, the inner is small');
const first = model.samples({...run.slime,level:1,clock:16})[0];
const block = placeAt(first), hazard = placeAt(first, Infinity, {hazard:true,unbreakable:true}), medkit = placeAt(first,1,{special:'gel'});
context.updateCosmosOrbits(.016,1000);
assert.equal(block.hp,19); assert.equal(hazard.hp,Infinity); assert.equal(medkit.hp,1);
context.updateCosmosOrbits(.016,1016); assert.equal(block.hp,19,'continuous overlap gives one damage, not one per frame');
run.slime.x+=100; context.updateCosmosOrbits(.016,1032);
run.slime.x-=100; context.updateCosmosOrbits(.016,1048);
assert.equal(block.hp,19,'re-entering before two seconds cannot deal another hit');
run.cosmosOrbitClock=2000; run.cosmosOrbitPrevious=null;
run.cosmosOrbitContacts=[new Set(),new Set()];
const returning = model.samples({...run.slime,level:1,clock:2016})[0];
block.x=returning.x-8; block.y=returning.y-8;
run.blocksByRow.clear();
run.blocksByRow.set(Math.floor((block.y-run.blockRowOrigin)/40),[block]);
context.updateCosmosOrbits(.016,3050);
assert.equal(block.hp,18,'a fresh touch after two simulation seconds deals one more hit');
assert.equal(run.slime.y,240,'planets never pull or propel the slime');
const clock = run.cosmosOrbitClock;
run.paused=true; context.updateCosmosOrbits(.1,1100); assert.equal(run.cosmosOrbitClock,clock);
run.paused=false; context.updateCosmosOrbits(.008,1110); assert.equal(run.cosmosOrbitClock,clock+8,'orbit follows simulation time including slow motion');

run = fresh(2);
const p = model.samples({...run.slime,level:2,clock:16});
const outer = placeAt(p[0]), inner = placeAt(p[1]);
context.updateCosmosOrbits(.016,1000);
assert.equal(outer.hp,19); assert.equal(inner.hp,19,'stage II enables both colliders');
const shared=fresh(2), wide={x:0,y:0,w:1000,h:1000,hp:5};
for(let row=0;row<20;row++) shared.blocksByRow.set(row,[wide]);
context.updateCosmosOrbits(.016,1000);
assert.equal(wide.hp,4,'both planets share the two-second cooldown of each block');
context.run=run;
run.ultimateIntro={type:'cosmos'};
context.updateCosmosOrbits(.016,1016);
assert.equal(context.cosmosOrbitsEnabled(1016),false); assert.equal(run.cosmosOrbitAlpha,0);
assert.equal(run.cosmosOrbitPrevious,null); assert.ok(run.cosmosOrbitContacts.every(s=>!s.size));
run.ultimateIntro=null; run.elementalAbilityActive='cosmos';
context.updateCosmosOrbits(.016,1032); assert.equal(context.cosmosOrbitsEnabled(1032),false);
run.elementalAbilityActive=''; run.cosmosUltimate={fadeUntil:1200};
assert.equal(context.cosmosOrbitsEnabled(1100),false);
run.cosmosUltimate=null;
assert.equal(context.cosmosOrbitsEnabled(1201),true);
run.slime.y+=400; context.updateCosmosOrbits(.016,1201);
assert.equal(run.cosmosOrbitAlpha,.08,'return fades in rather than popping');
assert.equal(outer.hp,19); assert.equal(inner.hp,19,'return cannot sweep through the entire ultimate path');

// Fast falls still hit a small block crossed between rendered frames.
run=fresh(); const initial=model.samples({...run.slime,level:1,clock:16})[0];
context.updateCosmosOrbits(.016,1000);
const crossing=placeAt({x:initial.x,y:initial.y+40},5);
run.slime.y+=80; context.updateCosmosOrbits(.016,1016);
assert.equal(crossing.hp,4,'swept contact prevents tunnelling at low FPS');

context.save={tutorialStep:'done'}; context.speedDrillActive=()=>false; context.jellyZoneForSlime=()=>null; context.phantomActive=()=>false;
run.steer={};
assert.equal(context.setKeyboardSteering('KeyA',true),true); assert.equal(run.steer.keyLeft,true);
assert.equal(context.setKeyboardSteering('KeyD',true),true); assert.equal(run.steer.keyRight,true);
assert.equal(context.setKeyboardSteering('KeyW',true),false,'cosmos no longer enables upward gravity');
assert.equal(context.setKeyboardSteering('KeyS',true),true); assert.equal(run.steer.keyDown,true);
assert.equal(context.cosmosCometVisualStrength(2000),0,'passive comet wake is gone');
run.cosmosUltimate={startedAt:1000,chargeUntil:1500,fadeStartedAt:5000,fadeUntil:6500};
assert.equal(context.cosmosCometVisualStrength(2000),1,'ultimate comet visuals remain');
assert.doesNotMatch(source,/gravitySwitch|setGravityDirection|cosmosBoostActive|updateCosmosCometEntry/);
assert.ok(html.indexOf('js/rendering/cosmos-orbits.js') < html.indexOf('game.js?v='));
console.log('Cosmos: I/II orbit geometry, opposite rotation, one damage per contact, row-index queries, safe hazards, swept collisions, pause/slow motion, hidden ultimate and smooth return, normal steering passed.');
