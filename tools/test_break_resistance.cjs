const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('game.js','utf8');const config={window:{}};
vm.runInNewContext(fs.readFileSync('js/config/game-config.js','utf8'),config);
const run={slime:{vx:100,vy:300},steer:true};
const context={run,BALANCE:config.window.SlimeGameConfig.PHYSICS,BLOCK_TIERS:config.window.SlimeGameConfig.BLOCK_TIERS,
 performance:{now:()=>1000},elementalLevel:()=>0,isSlimeFrozen:()=>false,
 fallSteeringVector:()=>({x:0,down:1}),normalFallSpeedLimit:()=>305,
 clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),lerp:(a,b,t)=>a+(b-a)*t};
assert(context.BALANCE);
vm.runInNewContext(source.slice(source.indexOf('  function applyBreakResistance('),source.indexOf('  function resolveBlockHit('))+
 source.slice(source.indexOf('  function applyFallSteering('),source.indexOf('  function normalFallSpeedLimit(')),context);
const fresh=()=>{run.slime={vx:100,vy:300};run.breakImpactAt=-Infinity;};
fresh();context.applyBreakResistance({tier:'dense'},1000);const fragile=run.slime.vy;
assert(fragile>0&&fragile<220,'Fragile rock must noticeably absorb speed without rebound');
context.applyBreakResistance({tier:'dense'},1030);assert.equal(run.slime.vy,fragile,'Neighboring tiles must count as one impact');
context.applyFallSteering(run.slime,.1,1050);
assert.equal(run.slime.vy,fragile,'Lateral steering applies no free downward thrust');
fresh();context.applyBreakResistance({tier:'reinforced',elementalSnow:true},1000);const snow=run.slime.vy;
fresh();context.applyBreakResistance({tier:'reinforced',elementalSnowflake:true},1000);const flake=run.slime.vy;
assert.equal(snow,300,'Snow must preserve speed');
assert(fragile<flake&&flake<300,'The separate snowflake block applies its own light resistance');
fresh();run.slime.vy=-300;context.applyBreakResistance({tier:'dense'},1000);assert(run.slime.vy<0,'Braking must preserve the direction of flight');
vm.runInNewContext(source.slice(source.indexOf('  function crackStageFor('),source.indexOf('  function drawCrackStage(')),context);
assert.equal(context.crackStageFor(.8),1,'The first hit on a strong block must show a fracture');
vm.runInNewContext(
  source.match(/const FALL_MOMENTUM = Object\.freeze\(\{[\s\S]*?\}\);/)[0] +
  source.slice(source.indexOf('  function resetFallMomentum('),source.indexOf('  function updatePhysics(')),
  context
);
const descent={};
const speed=(dt,expected)=>assert(Math.abs(context.advanceFallMomentum(descent,dt)-expected)<1e-8);
context.spendFallMomentum(descent,1);
speed(.0275,.9);
context.spendFallMomentum(descent,1);
speed(.055,.6);
context.spendFallMomentum(descent,1);
context.spendFallMomentum(descent,1);
speed(.055,.6);
speed(.1425,.8);
speed(.1425,1);
speed(.33,1);
speed(.5,1.24);
speed(.5,1.48);
speed(1,1.6);
context.spendFallMomentum(descent,1);
speed(.055,1.4);
speed(.615,1.4);
speed(2,1.6);
vm.runInNewContext(source.slice(source.indexOf('  function descentSpeedRatio('),source.indexOf('  function coreEncounterStatus(')),context);
const fastFall={slime:{vy:305},fallSpeedScale:1.6};
const ram=(hp, state=fastFall)=>context.ramDamageForRock({hp},state,305);
assert.deepEqual([1,1.199,1.2,1.399,1.4,1.599,1.6].map(scale=>ram(3,{...fastFall,fallSpeedScale:scale})),[0,0,1,1,2,2,3]);
assert.equal(ram(2),2);
assert.equal(ram(3,{...fastFall,slime:{vy:-305}}),0);
assert.equal(context.ramDamageForRock({hp:3,hazard:true},fastFall,305),0);
for (const remaining of [1.4,1.2,1]) {
  assert.equal(ram(1),1);
  context.spendFallMomentum(fastFall,1);
  assert(Math.abs(context.availableFallMomentum(fastFall)-remaining)<1e-8);
}
assert.equal(ram(1),0,'The same frame cannot spend the same momentum twice');
const fullRam={slime:{vy:305},fallSpeedScale:1.6};
context.spendFallMomentum(fullRam,2,true);
assert(Math.abs(fullRam.fallSpeedScale-1.2)<1e-8);
assert.equal(fullRam.slime.vy,305,'A successful ram spends charge without applying the impact brake');
context.spendFallMomentum(fullRam,1,true);
assert(Math.abs(fullRam.fallSpeedScale-1)<1e-8);
vm.runInNewContext(source.slice(source.indexOf('  function pressThroughRock('),source.indexOf('  function resolveBlockHit(')),context);
context.resetFallMomentum(run);
run.slime.vy=305;
const softRock={tier:'dense',maxHp:1};
const hardRock={tier:'hard',maxHp:2};
const hitFromAbove={nx:0,ny:-1};
context.pressThroughRock(softRock,hitFromAbove,1000,1,true);
const softSpeed=run.slime.vy;
context.pressThroughRock(hardRock,hitFromAbove,1200,1,true);
assert(softSpeed<305&&run.slime.vy<softSpeed&&run.slime.vy>0,'Resistance reduces downward speed and keeps penetration');
assert(hardRock.rockBreakPose.duration>softRock.rockBreakPose.duration);
assert.equal(hardRock.rockBreakPose.hpRatio,.5);
console.log(JSON.stringify({fragile,snow,snowflake:flake}));
