const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let allocations=0,gradients=0,liveStrokes=0;
const make=(live=false)=>({save(){},restore(){},translate(){},rotate(){},scale(){},beginPath(){},rect(){},clip(){},moveTo(){},lineTo(){},stroke(){if(live)liveStrokes++;},fillRect(){},drawImage(){},createRadialGradient(){gradients++;return {addColorStop(){}};}});
const art={complete:true,naturalWidth:384,naturalHeight:140},env={Math,window:{SlimeGameAssets:{projectSprite:()=>art}},document:{createElement(){allocations++;return {getContext:()=>make()};}}};
vm.runInNewContext(fs.readFileSync('js/rendering/mutation-impact-effects.js','utf8'),env);
const fx=env.window.SlimeMutationImpacts,c=make(true),effect={x:200,y:300,type:'frostTouch',compact:true,life:.2,maxLife:.38,points:[{x:100,y:200},{x:200,y:300},{x:260,y:350}],seed:7};
for(let t=0;t<600;t+=16){fx.frostTouch(c,effect,0,70);fx.freezeBlock(c,{x:0,w:70,h:70,frostTransformStartedAt:1000},200,1000+t);fx.electricChain(c,{...effect,life:Math.max(0,1-t/1000),maxLife:1},0,70);fx.spores(c,{x:200,y:300,startedAt:1000},0,70,1000+t);fx.burst(c,'fire',200,300,140,t/600);}
const cached=allocations;for(let i=0;i<100;i++){fx.frostTouch(c,effect,0,70);fx.spores(c,{x:200,y:300,startedAt:1000},0,70,1200);fx.electricChain(c,{...effect,life:.8,maxLife:1},0,70);}
assert.equal(allocations,cached,'steady effects allocate no canvases');assert.equal(liveStrokes,0,'no live expanding vector rings or per-frame bolt paths');assert(gradients<12);
console.log('Mutation impacts: cached frost reveal, mist and crystals, raster electric chain, spore cloud and no live rings');
