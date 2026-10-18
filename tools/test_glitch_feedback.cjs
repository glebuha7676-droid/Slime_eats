const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let canvases=0,captures=0,strokes=0,rectangles=0;
const ctx={canvas:{width:440,height:928},save(){},restore(){},fillRect(){rectangles++},drawImage(){captures++},stroke(){strokes++},
 createRadialGradient(){return {addColorStop(){}}}};
const env={Math,window:{},document:{createElement(){canvases++;return {width:0,height:0,getContext:()=>ctx}}}};
vm.runInNewContext(fs.readFileSync('js/rendering/glitch-feedback.js','utf8'),env);
const renderer=env.window.SlimeGlitchFeedback,block={x:50,y:200,w:60,h:60},run={cellSize:60,cameraY:0,viewHeight:928,glitchShock:{startedAt:1000,source:block,targets:[block,{...block,y:330}]}};
for(let t=1000;t<1440;t+=16)renderer.shock(ctx,run,t);
assert.equal(strokes,0,'hit echo uses local flashes and RGB slices, never lightning');assert(rectangles>0);assert.equal(canvases,1,'hit glow texture is reused');
renderer.infected(ctx,{...block,row:3,col:1},block.y,1200);
run.glitchBreakBursts=[{...block,startedAt:1000}];renderer.breaks(ctx,run,1100);
assert.equal(canvases,1,'stronger infection and break effects share the glow cache');
renderer.breaks(ctx,run,1500);assert.equal(run.glitchBreakBursts.length,0,'break burst expires');assert.equal(strokes,0);
const effect={startedAt:1500,until:1860};renderer.screen(ctx,440,928,1500,effect);const afterFirst=canvases;
for(let t=1516;t<1860;t+=16)renderer.screen(ctx,440,928,t,effect);
assert.equal(canvases,afterFirst,'screen animation reuses a single capture buffer');assert.equal(strokes,0);
renderer.screen(ctx,440,928,2000,{startedAt:2000,until:2360});assert.equal(canvases,afterFirst,'later pulses reuse the same buffer');
console.log('Glitch visuals: local white hit/RGB slices, zero lightning strokes, cached glow and reusable screen buffer passed.');
