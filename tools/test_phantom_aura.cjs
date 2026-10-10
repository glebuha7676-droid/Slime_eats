const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const renderer=fs.readFileSync(path.join(__dirname,'../js/rendering/slime-avatar.js'),'utf8');
const game=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const take=(source,name)=>{
  const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);
  assert.ok(a>=0&&b>a,name);return source.slice(a,b);
};
let created=0;
const cachedContexts=[];
const alphaPixels=new Uint8ClampedArray(512*512*4).fill(255);
function ctx(){return {globalAlpha:1,log:[],roots:[],turns:[],save(){},restore(){},
  translate(x,y){this.roots.push([x,y]);},rotate(a){this.turns.push(a);},
  getImageData(){throw new Error('SecurityError: pixel reads are unavailable');},
  drawImage(image,...rect){this.log.push({image,rect,op:this.globalCompositeOperation,blur:this.shadowBlur});},fillRect(){}};}
const forms=Object.fromEntries(['glitchUltra','fireUltra','electricUltra','phantomUltra'].map(id=>[id,{src:id,naturalWidth:768,naturalHeight:768}]));
const c={Math,formBodyImages:forms,referenceBodyImage:{src:'base'},bodyLayers:new Map(),spectralBodyLayers:new WeakMap(),
  window:{},Image:function(){this.complete=true;this.naturalWidth=192;this.naturalHeight=288;},
  document:{createElement(){created++;const context=ctx();cachedContexts.push(context);return{getContext:()=>context};}}};
vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/config/spectral-contours.js'),'utf8'),c);
const known=c.window.SlimeSpectralContours['effects-lab/assets/phantom-ultra-body-v7-lossless.webp'];
c.window.SlimeSpectralContours={...c.window.SlimeSpectralContours,base:known,phantomUltra:known,glitchUltra:known,fireUltra:known,electricUltra:known};
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/rendering/spectral-glow.js'),'utf8'),c);
vm.runInContext(['referenceBodyRect','drawSpectralBodyAura','drawReferenceBody'].map(n=>take(renderer,n)).join('\n'),c);
for(const image of [c.referenceBodyImage,forms.phantomUltra,forms.glitchUltra,forms.fireUltra,forms.electricUltra]){
  for(const radius of [23,70]){
    const main=ctx();c.drawSpectralBodyAura(main,radius,image,1000,.85,'inner');c.drawReferenceBody(main,radius,'',image,'');
    const outer=main.log[0].rect,body=main.log[1].rect,margin=64/384;
    assert.ok(Math.abs((outer[0]+body[2]*margin)-body[0])<1e-9);
    assert.ok(Math.abs((outer[1]+body[3]*margin)-body[1])<1e-9);
    assert.ok(Math.abs(outer[2]/body[2]-(1+margin*2))<1e-9,'aura uses exactly the body geometry for every form/radius');
    assert.ok(main.log.every(d=>!d.blur),'live draw never computes blur');
  }
}
assert.equal(created,45,'nine one-time canvases per silhouette, including four small edge frames');
for(let t=0;t<6000;t+=16)c.drawSpectralBodyAura(ctx(),40,forms.phantomUltra,t,.85);
assert.equal(created,45,'no canvas allocations during animation');
for(let i=0;i<cachedContexts.length;i+=9){
  assert.ok(cachedContexts[i].log[0].image.src,'mask is drawn from actual body artwork');
  assert.equal(cachedContexts[i+1].log.at(-1).op,'destination-out','body alpha removed from glow');
  assert.ok(cachedContexts[i+4].log.some(d=>d.blur>=46),'wide diffuse fringe is baked into the cache');
  assert.ok(cachedContexts[i+1].log.every(d=>d.rect[0]===0&&d.rect[1]===0),'no shifted mask copies forming a sharp rim');
  assert.ok(cachedContexts[i+3].log.some(d=>d.op==='destination-in'),'inner light is intersected with the real body alpha');
}
const firstOuter=ctx(),laterOuter=ctx();
c.drawSpectralBodyAura(firstOuter,70,forms.phantomUltra,0,1);
c.drawSpectralBodyAura(laterOuter,70,forms.phantomUltra,1100,1);
assert.deepEqual(firstOuter.log[0].rect,laterOuter.log[0].rect,'base aura stays exactly on the body');
assert.deepEqual(firstOuter.roots,[],'no detached ornaments around the contour');
assert.deepEqual(laterOuter.turns,[],'no rotating wisps');
assert.notEqual(firstOuter.log[1].image,laterOuter.log[1].image,'the diffuse edge changes cached frames');
assert.deepEqual(firstOuter.log[1].rect,laterOuter.log[1].rect,'moving edge retains the body origin and size');
let captured;
const w={Math,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),effectDensity:()=>1,ctx:{},menuSlimeCtx:{},
  drawSlimeAvatar:(_target,options)=>captured=options,
  window:{MutationEffectDraft:{drawBehind(){},drawFront(){},drawComposite(){}}}};
vm.createContext(w);vm.runInContext(take(game,'drawElementalSlimeAvatar'),w);
for(const level of [1,2,3]){
  w.drawElementalSlimeAvatar({}, {x:0,y:0,radius:40}, {phantom:level},1000);
  assert.equal(captured.phantomEyes,level===3,'stage II retains the normal eyes');
  assert.equal(captured.bodyFilter,'','stage II retains original body colour');
  assert.equal(captured.ghostAura>0,level>=2,'no slime aura on stage I');
  assert.equal(captured.bodyVariant,level===3?'phantomUltra':'');
}
w.drawElementalSlimeAvatar({}, {x:0,y:0,radius:40,silhouetteOnly:true}, {phantom:3},1000);
assert.equal(captured.ghostAura,0,'form reveal mask excludes external aura');
console.log('Phantom aura: exact body alpha, shared form geometry, cached blur/no per-frame allocation; stage I no aura, stage II unchanged face/colour passed.');
