const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const kind=['electric','frost','techno','phantom','psionic','glitch','spores'].includes(process.argv[2])?process.argv[2]:'fire';
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/__vfx_style_test__',r=>r.fulfill({contentType:'text/html',body:'<canvas width="440" height="840"></canvas>'}));
  await p.goto('http://127.0.0.1:8766/__vfx_style_test__');
  await p.addScriptTag({content:fs.readFileSync('js/rendering/core-vfx.js','utf8')});
  if(kind==='phantom')await p.addScriptTag({content:fs.readFileSync('js/rendering/phantom-soul-vfx.js','utf8')});
  if(kind==='phantom')await p.addScriptTag({content:fs.readFileSync('js/gameplay/phantom-core-wave.js','utf8')});
  await p.addScriptTag({content:fs.readFileSync(`js/rendering/${kind}-core-strike.js`,'utf8')});
  if(kind==='techno'){await p.evaluate(()=>SlimeTechnoCoreStrike.prepare());await p.waitForFunction(()=>SlimeTechnoCoreStrike.ready());}
  if(kind==='phantom'){await p.evaluate(()=>SlimePhantomCoreStrike.prepare());await p.waitForFunction(()=>SlimePhantomCoreStrike.ready());}
  if(kind==='psionic'){await p.evaluate(()=>SlimePsionicCoreStrike.prepare());await p.waitForFunction(()=>SlimePsionicCoreStrike.ready());}
  if(kind==='spores'){await p.evaluate(()=>SlimeSporesCoreStrike.prepare());await p.waitForFunction(()=>SlimeSporesCoreStrike.ready());}
  const checks=await p.evaluate(kind=>{
   const fx=kind==='spores'?SlimeSporesCoreStrike:kind==='glitch'?SlimeGlitchCoreStrike:kind==='psionic'?SlimePsionicCoreStrike:kind==='phantom'?SlimePhantomCoreStrike:kind==='techno'?SlimeTechnoCoreStrike:kind==='frost'?SlimeFrostCoreStrike:kind==='electric'?SlimeElectricCoreStrike:SlimeFireCoreStrike,c=document.querySelector('canvas'),x=c.getContext('2d'),started=performance.now();fx.prepare();const prepareMs=performance.now()-started;
   let gradients=0,stamps=0,strokes=0;const linear=x.createLinearGradient.bind(x),radial=x.createRadialGradient.bind(x),image=x.drawImage.bind(x),stroke=x.stroke.bind(x);
   x.createLinearGradient=(...a)=>{gradients++;return linear(...a);};x.createRadialGradient=(...a)=>{gradients++;return radial(...a);};x.drawImage=(...a)=>{stamps++;return image(...a);};
   x.stroke=(...a)=>{strokes++;return stroke(...a);};
   const paint=reserve=>{
    const power=(reserve/100)**.65,run={slime:{x:220,y:340,radius:30},cameraY:0,coreArena:{surfaceY:710,x:220},coreEncounter:{[kind]:true,elapsed:2700,phaseTime:kind==='frost'?650:220,phase:'burn',power,aura:power,jet:1,hit:true,hitAt:2550,strikeEnergy:reserve}};
    if(kind==='phantom'){Object.assign(run.coreEncounter,{souls:SlimePhantomCoreWave.create(run,reserve),castX:220,castY:340,phaseTime:680});}
    if(kind==='psionic'){Object.assign(run.coreEncounter,{hit:false,castRockX:108,castRockY:240,castRockAngle:20,rock:{x:108,y:240,size:52+136*power,angle:20,alpha:1,broken:false,targetX:220,targetY:710-(52+136*power)*.4}});}
    x.clearRect(0,0,440,840);fx.draw(x,run);fx.draw(x,run,true);return run;
   };
   // Techno now has a deliberately constant-size cannon: compare only the emitted beam below it.
   const from=kind==='techno'?560*440*4+3:3;
   paint(5);let pixels=x.getImageData(0,0,440,840).data;let small=0;for(let i=from;i<pixels.length;i+=4)if(pixels[i]>80)small++;
   const run=paint(100);pixels=x.getImageData(0,0,440,840).data;let large=0;for(let i=from;i<pixels.length;i+=4)if(pixels[i]>80)large++;
   stamps=0;strokes=0;const t=performance.now();for(let i=0;i<240;i++){run.coreEncounter.elapsed=2600+i*16;fx.draw(x,run);fx.draw(x,run,true);}const drawMs=(performance.now()-t)/240,stampsPerFrame=stamps/240,strokesPerFrame=strokes/240;
   const held=paint(100);fx.draw(x,held);fx.draw(x,held,true);
   let clears=0,allocations=0;const proto=CanvasRenderingContext2D.prototype,clear=proto.clearRect,create=document.createElement.bind(document);
   proto.clearRect=function(...a){if(this.canvas!==c)clears++;return clear.apply(this,a);};document.createElement=(...a)=>{if(a[0]==='canvas')allocations++;return create(...a);};
   for(let i=0;i<20;i++){fx.draw(x,held);fx.draw(x,held,true);}
   const heldBufferClears=clears;stamps=0;strokes=0;held.cameraY=100000;fx.backdrop(x,held);fx.draw(x,held);fx.draw(x,held,true);
   const offscreenDraws=stamps+strokes;proto.clearRect=clear;document.createElement=create;
   return {prepareMs,drawMs,stampsPerFrame,strokesPerFrame,gradients,smallPixels:small,largePixels:large,heldBufferClears,offscreenDraws,liveCanvasAllocations:allocations};
  },kind);
  assert.equal(checks.gradients,0,'Live drawing uses cached textures, without rebuilding gradients');assert(checks.stampsPerFrame<(kind==='spores'||kind==='glitch'?130:kind==='phantom'?160:kind==='frost'?110:80)&&checks.strokesPerFrame<90,'The effect has a bounded draw budget');assert(checks.largePixels>checks.smallPixels*3,'Preserved strength changes the actual rendered footprint');assert.deepEqual(errors,[]);
  assert.equal(checks.heldBufferClears,0,'Held frames reuse their texture blends and scene snapshots');assert.equal(checks.offscreenDraws,0,'Completely invisible finishers do not render');assert.equal(checks.liveCanvasAllocations,0,'No canvas allocation in the warm drawing loop');
  console.log(JSON.stringify({kind,...checks,errors}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
