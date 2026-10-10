const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('game.js','utf8');
const take=name=>{const i=source.indexOf(`  function ${name}(`);assert.ok(i>=0,name);return source.slice(i,source.indexOf('\n  function ',i+10));};
let now=1000,frames=new Map(),next=1,writes=0,reflows=0,allocations=0;
const node=()=>({textContent:'',classList:{add(){},remove(){}},setAttribute(){},get offsetWidth(){reflows++;return 100;}});
const c={Math,performance:{now:()=>now},window:{},Path2D:class{moveTo(){}lineTo(){}closePath(){}},
 run:{cameraY:0,worldId:1,particles:[],specialEffects:[],shake:0,world:{},researchData:0},save:{researchUnits:0},
 VIEW_H:750,graphicsBudget:1,isMobileDevice:()=>false,isLowPowerDevice:()=>false,effectDensity:()=>1,
 materialColor:()=> '#637b87',persist:()=>writes++,runResearchPulseTimer:0,
 requestAnimationFrame:fn=>{frames.set(next,fn);return next++;},cancelAnimationFrame:id=>frames.delete(id),
 clearTimeout(){},setTimeout:()=>1,els:{runResearchScore:node(),runResearchGain:node(),runResearchHud:node()},
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),turnBlockToSnow:b=>{b.transformed=(b.transformed||0)+1;},turnBlockToSnowflake(){}};
vm.createContext(c);
vm.runInContext(fs.readFileSync('js/rendering/block-break-feedback.js','utf8'),c);
const fx=c.window.SlimeBlockBreakFeedback;
c.window.SlimeBlockBreakFeedback={...fx,emit:(b,o)=>{const r=fx.emit(b,o);allocations+=r.particles.length;return r;}};
for(const name of ['particleLimit','trimParticles','takeDecorativeParticles','appendTransientEffect',
 'createDebris','awardFlaskData','flushRunResearchAwards','pushElementalEffect','updateSpecialEffects','updateParticles','nearbyGridBlocks'])vm.runInContext(take(name),c);
for(let i=0;i<100;i++){
 c.createDebris({x:i%6*64,y:120,w:64,h:64,tier:'hard'},9,true);
 assert.equal(c.awardFlaskData(i%3===0?5:3),i%3===0?5:3);
}
assert.equal(c.save.researchUnits,368,'All rewards arrive immediately');
assert.equal(c.run.researchData,368);
assert.equal(writes,0);assert.equal(reflows,0);assert.equal(frames.size,1,'One presentation job per burst');
assert.ok(allocations<=120,`Allocation budget applies before particles are created: ${allocations}`);
assert.equal(c.run.specialEffects.length,12);
const jobs=[...frames.values()];frames.clear();jobs.forEach(fn=>fn());
assert.equal(writes,1,'One durable save per reward burst');assert.equal(reflows,2);
assert.equal(c.els.runResearchGain.textContent,'+368','Combined gain remains visible');
c.awardFlaskData(5);c.flushRunResearchAwards();assert.equal(frames.size,0,'Pause/end flush cancels pending work');
assert.equal(writes,2);assert.equal(c.save.researchUnits,373);
c.flushRunResearchAwards();assert.equal(writes,2,'Flush is idempotent');
// Decorative pressure cannot discard a frost projectile or its eventual transform.
c.run.specialEffects=[];c.run.blocks=[{id:17}];
c.pushElementalEffect('snowShard',100,200,{targetBlockId:17,transformKind:'snow',life:.01});
for(let i=0;i<100;i++)c.pushElementalEffect('firePulse',100,200);
assert.ok(c.run.specialEffects.some(e=>e.targetBlockId===17));
c.updateSpecialEffects(.02);assert.equal(c.run.blocks[0].transformed,1);
const particles=c.run.particles,effects=c.run.specialEffects;
c.updateParticles(1);c.updateSpecialEffects(1);
assert.equal(c.run.particles,particles);assert.equal(c.run.specialEffects,effects,'No new arrays per update');
assert.equal(particles.length,0);assert.equal(effects.length,0);
now+=60;assert.ok(c.takeDecorativeParticles(10)>0,'Decorative budget refills');
const sourceBlock={row:2,col:2},neighbour={row:3,col:2};
c.run.blocksByRow=new Map([[3,[neighbour]]]);
Object.defineProperty(c.run,'blocks',{get(){throw Error('No full terrain scan for neighbours');}});
assert.deepEqual([...c.nearbyGridBlocks(sourceBlock)],[neighbour]);
console.log('Mass effects passed: pre-allocation cap, complete rewards, one save/UI job, lifecycle flush, protected frost projectiles and indexed neighbours');
