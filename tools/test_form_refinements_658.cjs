const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1100,height:560}}),requests=[];
 page.on('request',request=>requests.push(request.url()));
 await page.goto('http://127.0.0.1:8766/editors/psionics-forms-658.html');
 await page.waitForFunction(()=>window.previewReady);await page.evaluate(()=>window.previewPaused=true);
 const effects=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  const state={x:256,y:280,baseY:280,radius:100,timestamp:1000,psionicsEnergy:1,bodyTransform:{rotation:0,scaleX:1,scaleY:1}};
  const bottom=[];
  for(const stage of [1,2,3]){
   ctx.clearRect(0,0,512,512);state.levels={telekinesis:stage};
   MutationEffectDraft.drawBehind(ctx,state);MutationEffectDraft.drawFront(ctx,state);
   const pixels=ctx.getImageData(0,350,512,162).data;
   let total=0;for(let i=3;i<pixels.length;i+=4)total+=pixels[i];bottom.push(total);
  }
  const tipEnergy=[];
  for(const timestamp of [Math.PI/2*185,Math.PI*1.5*185]){
   ctx.clearRect(0,0,512,512);MutationEffectDraft.drawBehind(ctx,{...state,timestamp,levels:{telekinesis:3}});
   const pixels=ctx.getImageData(0,0,512,280).data;
   let total=0;for(let i=0;i<pixels.length;i+=4)total+=(pixels[i]+pixels[i+1]+pixels[i+2])*pixels[i+3]/255;tipEnergy.push(total);
  }
  return {bottom,tipEnergy};
 });
 assert.deepEqual(effects.bottom,[0,0,0],'No psionic effect under the slime at any stage');
 assert.ok(effects.tipEnergy[0]>effects.tipEnergy[1]*1.005,'Horn tips must pulse');
 await page.goto('http://127.0.0.1:8766/editors/techno-forms-657.html');
 await page.waitForFunction(()=>window.previewReady);await page.evaluate(()=>window.previewPaused=true);
 const eyes=await page.evaluate(()=>{
  function render(gazeX,nanoEyeOpenness){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
   SlimeAvatarRenderer.drawSlimeAvatar(ctx,{x:256,y:256,radius:200,bodyVariant:'technoUltra',nanoEyeOpenness,gazeX,gazeY:0,timestamp:1000,appearance:'cute-v2',emotion:'focused'});
   return {url:canvas.toDataURL(),pixels:ctx.getImageData(0,0,512,512).data};
  }
  const left=render(-1,0),right=render(1,0),opening=render(-1,1),changes=[0,0];
  for(let y=210;y<300;y++)for(let x=140;x<375;x++){
   const i=(y*512+x)*4;
   if(left.pixels[i]!==right.pixels[i]||left.pixels[i+1]!==right.pixels[i+1]||left.pixels[i+2]!==right.pixels[i+2])changes[x<256?0:1]++;
  }
  return {noOpening:left.url===opening.url,changes};
 });
 assert.equal(eyes.noOpening,true,'Legacy ultimate eye opening must have no visual effect');
 assert.ok(eyes.changes.every(count=>count>30),'Normal left pupil and robotic right pupil must follow gaze');
 assert.ok(!requests.some(url=>url.includes('nano-eye-tunnel')),'Tunnel eye asset must never be requested');
 await page.goto('http://127.0.0.1:8766/editors/electric-forms-656.html');await page.waitForFunction(()=>window.previewReady);
 const shape=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');
  SlimeAvatarRenderer.drawSlimeAvatar(ctx,{x:256,y:280,radius:100,bodyVariant:'electricCharged',hideFace:true,appearance:'cute-v2'});
  const pixels=ctx.getImageData(0,0,512,512).data;let minX=512,maxX=0,minY=512,maxY=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(pixels[(y*512+x)*4+3]>100){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  return {width:maxX-minX+1,height:maxY-minY+1};
 });
 assert.ok(Math.abs(shape.height/shape.width-1)<.06,'Electric II must retain the rounded proportions of the new storm-transition artwork');
 fs.mkdirSync('outputs/elemental-forms-655',{recursive:true});
 fs.writeFileSync('outputs/elemental-forms-655/refinements-658-checks.json',JSON.stringify({effects,eyes,shape},null,2));
 console.log('Refinements passed: no lower psionic aura, pulsing horn tips, both pupils move, no tunnel/opening, rounded Electric II.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
