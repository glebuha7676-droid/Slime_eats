const assert=require('node:assert/strict'),VFX=require('../js/rendering/core-vfx.js'),souls=require('../js/gameplay/phantom-core-wave.js');
const run={cameraY:1000,slime:{x:220,y:1300,radius:30},coreArena:{x:220,radius:418,surfaceY:1745,centerY:2163},coreEncounter:{power:1.5,finisher:true,overdrive:1,elapsed:4000,castElapsed:4000,castX:220,castY:1300}};
assert.equal(VFX.coreSurfaceY(run,220),745);
for(const dx of [30,100,200]){
 const left=VFX.coreSurfaceY(run,220-dx),right=VFX.coreSurfaceY(run,220+dx);
 assert.equal(left,right);assert(right>745);assert.equal(VFX.coreSurfaceY(run,220+dx,25),right+25);
}
const volley=souls.create(run,150,()=>.4);assert.equal(volley.length,50);
for(const soul of volley){
 assert(Math.abs(soul.x-220)<=66);assert(soul.duration>=300&&soul.duration<=415);
 const end=souls.sample(soul,soul.delay+soul.duration,{});assert(Math.abs(end.x-soul.x)<.001&&Math.abs(end.y-soul.y)<.001);
}
assert(Math.max(...volley.map(s=>s.delay+s.duration))<2200);
const vm=require('node:vm'),fs=require('node:fs'),context={window:{}};vm.runInNewContext(fs.readFileSync('js/rendering/world-background.js','utf8'),context);
const draws=[],ctx={getTransform:()=>({d:1,f:0}),save(){},restore(){},translate(){},scale(){},globalAlpha:1,drawImage(...args){draws.push(args);}};
const layers=[{speed:.2,image:{complete:true,naturalWidth:440,naturalHeight:840}}];
context.window.SlimeWorldBackground.draw(ctx,{layers,width:440,height:840,cameraY:0,padding:40});
assert(draws.some(d=>d.length===9&&d[7]===40),'Mirrored edge strips cover shake');
assert(draws.filter(d=>d.length===5).length>=3,'Extra vertical tiles cover both viewport edges, including reflected rows');
console.log(JSON.stringify({sphericalContacts:true,depth:true,phantomBeamFunnel:true,allFiftyArrive:true,backgroundOverscan:true}));
