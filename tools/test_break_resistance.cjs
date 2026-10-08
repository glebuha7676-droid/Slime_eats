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
const fresh=()=>{run.slime={vx:100,vy:300};run.breakImpactAt=-Infinity;run.breakImpactUntil=0;};
fresh();context.applyBreakResistance({tier:'dense'},1000);const fragile=run.slime.vy;
assert(fragile>0&&fragile<220,'Fragile rock must noticeably absorb speed without rebound');
context.applyBreakResistance({tier:'dense'},1030);assert.equal(run.slime.vy,fragile,'Neighboring tiles must count as one impact');
context.applyFallSteering(run.slime,.1,1050);const protectedGain=run.slime.vy-fragile;
run.breakImpactUntil=0;const before=run.slime.vy;context.applyFallSteering(run.slime,.1,1050);
assert(protectedGain<(run.slime.vy-before)*.5,'Holding down must not erase resistance');
fresh();context.applyBreakResistance({tier:'reinforced',elementalSnow:true},1000);const snow=run.slime.vy;
fresh();context.applyBreakResistance({tier:'reinforced',elementalSnowflake:true},1000);const flake=run.slime.vy;
assert(fragile<snow&&snow<flake&&flake<300,'Snow must still resist, less than rock; snowflakes less than snow');
fresh();run.slime.vy=-300;context.applyBreakResistance({tier:'dense'},1000);assert(run.slime.vy<0,'Braking must preserve the direction of flight');
vm.runInNewContext(source.slice(source.indexOf('  function crackStageFor('),source.indexOf('  function drawCrackStage(')),context);
assert.equal(context.crackStageFor(.8),1,'The first hit on a strong block must show a fracture');
console.log(JSON.stringify({fragile,snow,snowflake:flake,protectedDiveGain:protectedGain}));
