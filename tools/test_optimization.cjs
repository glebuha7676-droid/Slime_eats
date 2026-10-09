const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8');
function take(name) {
  const start=source.indexOf(`  function ${name}(`),end=source.indexOf('\n  function ',start+10);
  assert.ok(start>=0&&end>start); return source.slice(start,end);
}
// Import the real save normalization with a save binding that is deliberately
// inaccessible, reproducing the first boot rather than merely a later reload.
const normalize=take('normalizeSave');
assert.ok(!normalize.includes('levelTargetDepth('),'Saved progress must use permanent world lengths, not transient tutorial state');
const fire=new Map([[0,{dead:false,fireDamageAt:100,fireUltimateAuraId:0}],[1,{dead:true,fireDamageAt:100}],[2,{dead:false,fireDamageAt:300}]]);
let hits=0;
const c={run:{ended:false,burningBlocks:new Set(fire.values()),phoenixWaves:[],electricStormBolts:[],electricStormHits:[]},performance:{now:()=>200},
  finishMechSuit(){},updateShieldLifetime(){},finishUltimateRecharge(){},updateFrostStorm(){},updateNanoDrones(){},updatePhantomCompanions(){},updateTelekinesisPress(){},updateTelekinesis(){},updateCloningUltimate(){},updateSpores(){},damageBlockByElement:()=>hits++};
Object.defineProperty(c.run,'blocks',{get(){throw new Error('No full terrain scan is permitted each frame');}});
vm.runInNewContext(take('updateElementalEffects'),c);
c.updateElementalEffects(200);assert.equal(hits,1);assert.equal(c.run.burningBlocks.size,1);
c.updateElementalEffects(400);assert.equal(hits,2);assert.equal(c.run.burningBlocks.size,0);
const award=take('awardFlaskData');
assert.ok(award.includes('persist({ refreshUI: false })'));
assert.ok(!award.includes('updatePersistentUI()'),'Collecting currency must not rebuild hidden home UI');
const manifest={window:{}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/core/boot-manifest.js'),'utf8'),manifest);
for(const asset of manifest.window.SlimeBootManifest.assets) assert.ok(fs.existsSync(require('node:path').join(__dirname,'..',asset.url)),asset.url);
assert.ok(!manifest.window.SlimeBootManifest.assets.some(a=>a.url.includes('ЕДА/Новая')),'Original high-resolution foods are excluded from startup');
let paints=0, pauses=0;
const frameContext={run:{ended:false,paused:false},document:{hidden:false},platformSuspended:false,windowSuspended:false,
  autoResumeRunAfterVisibility:false,requestAnimationFrame:()=>1,updateTutorialRun:()=>true,
  renderCanvas:()=>paints++,pauseRun:()=>{pauses++;return true;}};
vm.runInNewContext(take('gameFrame'),frameContext);
// Drive the real frame gate at 240Hz, independently of the screen or physics.
for(let timestamp=100;timestamp<1100;timestamp+=1000/240)frameContext.gameFrame(timestamp);
assert.ok(paints>=58&&paints<=62,`Expected 60 renders rather than 240, got ${paints}`);
frameContext.platformSuspended=true;frameContext.gameFrame(1200);
assert.equal(pauses,1);assert.equal(frameContext.autoResumeRunAfterVisibility,true);
const before=paints;frameContext.platformSuspended=false;frameContext.document.hidden=true;frameContext.gameFrame(1300);
assert.equal(paints,before,'Backgrounding must stop rendering and physics');
console.log('Optimization: active fire queue, quiet currency persistence, safe save normalization and current asset manifest passed');
