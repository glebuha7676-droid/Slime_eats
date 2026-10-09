const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../js/rendering/phantom-effects.js'),'utf8');
let canvases=0,images=[];
const alphaPixels=new Uint8ClampedArray(512*512*4).fill(255);
function context2d(){
  const c={log:[],path:[],save(){},restore(){},translate(){},rotate(){},scale(){},
    getImageData(){return{data:alphaPixels}},
    beginPath(){this.path=[]},moveTo(x,y){this.path.push([x,y])},lineTo(x,y){this.path.push([x,y])},
    bezierCurveTo(){},arc(){},ellipse(...args){this.lastEllipse=args;},rect(...args){this.rectArgs=args},clip(){this.log.push({kind:'clip',args:this.rectArgs})},
    fill(){if(this.fillStyle==='#123d50')this.log.push({kind:'hole'})},fillRect(){},strokeRect(){},
    stroke(){
      if(this.strokeStyle==='#dcfff3')this.log.push({kind:this.lastEllipse[5]===Math.PI?'back':'front'});
      else this.log.push({kind:'line',vertices:this.path.slice()});
    },
    drawImage(image,...args){this.log.push({kind:image.src?.includes('phantom-portal')?'portal':image.kind||'sprite',args,blur:this.shadowBlur||0})},
    createRadialGradient(){return{addColorStop(){}}},createLinearGradient(){return{addColorStop(){}}},
  };return c;
}
const environment={Math,window:{SlimeGameAssets:{versionedAsset:p=>p}},
  document:{createElement(){canvases++;return {getContext:()=>context2d()}}},
  Image:function(){this.complete=true;this.naturalWidth=384;this.naturalHeight=360;images.push(this);},
};vm.createContext(environment);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/rendering/spectral-glow.js'),'utf8'),environment);
vm.runInContext(source,environment);
const model=environment.window.SlimePhantomEffects;
const e={startedAt:1000,centerX:180,portalY:100,endY:820},cell=60;
assert.equal(model.expressGeometry(e,1640,cell).frontY,e.portalY,'locomotive starts at portal centre');
const trainImage={kind:'train',complete:true,naturalWidth:291};
const railsImage={kind:'rails',complete:true,naturalWidth:224};
let ctx=context2d();model.express(ctx,e,0,cell,1640,trainImage,railsImage);
const train=ctx.log.findIndex(e=>e.kind==='train'),back=ctx.log.findIndex(e=>e.kind==='portal'),front=ctx.log.findLastIndex(e=>e.kind==='portal');
assert.ok(back>=0&&back<train&&front>train,'raster portal behind train; near lip above train');
const trainDraw=ctx.log[train].args;assert.equal(trainDraw[1]+trainDraw[3],e.portalY,'train nose emerges in middle rather than below portal');
assert.ok(ctx.log.filter(e=>e.kind==='clip'&&e.args[2]===cell*4+40).every(entry=>entry.args[1]===e.portalY),'train reveal clip anchored at centre');
const warmed=canvases;
for(let t=1700;t<2500;t+=16)model.express(context2d(),e,0,cell,t,trainImage,railsImage);
assert.equal(canvases,warmed,'train silhouette glow never recomputed during flight');
assert.ok(ctx.log.every(d=>!d.blur),'live train draw has no dynamic blur');
ctx=context2d();let point={x:0,y:0};
for(let i=0;i<90;i++){
  point={x:i*30,y:i*5};ctx.log=[];model.spirit(ctx,point,20,0,10000+i*32,1);
  const lines=ctx.log.filter(e=>e.kind==='line');assert.ok(lines.length<=7,'bounded short trail');
  for(const line of lines)for(const [x,y]of line.vertices)assert.ok(Math.hypot(x-point.x,y-point.y)<=29.001,'even fast flight has a short spectral trail');
}
model.spirit(ctx,point,20,1,13000,1);
assert.equal(images.filter(i=>i.src.includes('phantom-spirit')).length,2,'generated raster companions');
assert.equal(canvases,warmed+11,'two tinted bodies with shared inner/outer aura plus one blue halo are cached');
const visualCaches=canvases;
ctx=context2d();model.burst(ctx,{x:100,y:200,startedAt:1000},0,60,1200);
assert.equal(ctx.log.filter(e=>e.kind==='line').length,0,'exit splash uses soft bitmap light, no vector rays or rings');
model.realm(ctx,360,780,1400,1,{at:1000,x:100,y:200});
assert.equal(canvases,visualCaches+1,'realm texture is built once');
for(let t=1500;t<2600;t+=16){model.realm(ctx,360,780,t,1,{at:1000,x:100,y:200});model.burst(ctx,{x:100,y:200,startedAt:2000},0,60,t);}
assert.equal(canvases,visualCaches+1,'realm and splash never allocate per frame');
assert.doesNotMatch(source,/function spiritSprite|body\.addColorStop|x\.ellipse\(37/,'old vector ghost removed');
const t=1100*Math.PI/2,a=model.idle(0,0,20,0,t),b=model.idle(0,0,20,1,t);
assert.equal(a.front,true);assert.equal(b.front,false,'companions orbit in front and behind the slime');
const flight={from:{x:0,y:0},points:[{x:30,y:100},{x:90,y:110}],startedAt:0,duration:2400};
const home={x:0,y:0},departure=model.flightPoint(flight,0,home),returned=model.flightPoint(flight,2400,home);
assert.equal(departure.x,0);assert.equal(departure.y,0);assert.equal(returned.x,0);assert.equal(returned.y,0);
const waypointTime=2400*Math.acos(1-2/3)/Math.PI;
const before=model.flightPoint(flight,waypointTime-.1,home),at=model.flightPoint(flight,waypointTime,home),after=model.flightPoint(flight,waypointTime+.1,home);
assert.ok(Math.abs(at.x-30)<1e-6&&Math.abs(at.y-100)<1e-6,'smooth curve actually reaches marked rock');
assert.ok(Math.hypot((at.x-before.x)-(after.x-at.x),(at.y-before.y)-(after.y-at.y))<.0001,'no sharp tangent change at a rock');
ctx=context2d();model.gate(ctx,100,200,50,1000,1);
const gateDraw=ctx.log.find(e=>e.kind==='portal');assert.equal(gateDraw.args[2],gateDraw.args[3],'gate sprite is round, not stretched vertically');
const gateCaches=canvases;
for(let t=1032;t<1900;t+=32)model.gate(context2d(),100,200,50,t,1);
assert.equal(canvases,gateCaches,'animated inner vortex is cached once');
console.log('Phantom visuals: generated raster ghosts, bounded trails, round animated gate with cached vortex and train emerging at portal centre passed.');
