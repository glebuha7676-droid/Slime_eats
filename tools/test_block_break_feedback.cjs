const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context={window:{},Path2D:class {moveTo(){}lineTo(){}closePath(){}}};
vm.runInNewContext(fs.readFileSync('js/rendering/block-break-feedback.js','utf8'),context);
const fx=context.window.SlimeBlockBreakFeedback,block={x:0,y:120,w:64,h:64,material:'stone'};
const desktop=fx.emit(block,{color:'#637b87',count:9,strong:true,density:1});
const mobile=fx.emit(block,{color:'#637b87',count:9,strong:true,density:.56});
assert(desktop.particles.length>9&&mobile.particles.length>5,'more fragments on both device budgets');
assert(desktop.particles.some(p=>p.shape==='spark')&&desktop.particles.some(p=>p.shape==='shard'));
for(const p of desktop.particles)assert(p.life>0&&p.life<.7&&Number.isFinite(p.vx+p.vy));
assert(fx.emit(block,{color:'#637b87',count:999,strong:true,density:1}).particles.length<=24);
const run={cameraY:0,particles:[],specialEffects:[],shake:0,world:{}};
Object.assign(context,{run,VIEW_H:750,materialColor:()=> '#637b87',effectDensity:()=>.56,
 isMobileDevice:()=>true,trimParticles:n=>{const cap=Math.round(n*.58);if(run.particles.length>cap)run.particles.splice(0,run.particles.length-cap);}});
const game=fs.readFileSync('game.js','utf8');
context.performance={now:()=>1000};context.graphicsBudget=1;
for(const name of ['particleLimit','takeDecorativeParticles','appendTransientEffect']){
 const start=game.indexOf(`  function ${name}(`),end=game.indexOf('\n  function ',start+10);
 vm.runInNewContext(game.slice(start,end),context);
}
vm.runInNewContext(game.slice(game.indexOf('  function createDebris('),game.indexOf('  function spawnPortalBurst(')),context);
for(let i=0;i<100;i++)context.createDebris(block,9,true);
assert(run.particles.length<=140,'a mass break stays inside the mobile particle budget');
assert.equal(run.specialEffects.length,8,'mass destruction has at most eight concurrent mobile flashes');
const before=run.particles.length;
context.createDebris({...block,y:2000},9,true);context.createDebris(block,0,true);
assert.equal(run.particles.length,before,'offscreen/disabled debris should allocate nothing');
console.log('Break feedback: shard/spark mix, bounded lifetimes, mobile mass-break cap and offscreen culling passed.');
