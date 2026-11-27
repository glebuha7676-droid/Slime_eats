const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=\x60([\s\S]*?)\x60;/)[1],core=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+\x60([\s\S]*?)\x60;/)[1];
const hook=base+core+`window.__vfxPerf={
 async measure(id,low){
  __consoleQA.home(id,3);__coreQA.start({energy:100});cancelAnimationFrame(run.animationId);
  await preloadMenuAppearance(run.categoryVisuals);await SlimeAvatarRenderer.whenReady();
  beginCoreEncounter();run.paused=false;const e=run.coreEncounter;e.lowPower=low;e.reduced=false;
  const fx=({fire:SlimeFireCoreStrike,electric:SlimeElectricCoreStrike,frost:SlimeFrostCoreStrike,cosmos:SlimeCosmosCoreStrike,techno:SlimeTechnoCoreStrike,phantom:SlimePhantomCoreStrike,psionic:SlimePsionicCoreStrike,glitch:SlimeGlitchCoreStrike,spores:SlimeSporesCoreStrike})[e.kind];
  while(!CORE.ready()||fx.ready&&!fx.ready())await new Promise(r=>setTimeout(r,15));
  const target=document.createElement('canvas');target.width=440;target.height=840;const c=target.getContext('2d');
  const draws=[],shots=[],proto=CanvasRenderingContext2D.prototype,create=document.createElement.bind(document),clear=proto.clearRect;
  let active=false,allocations=0,clears=0,hitCount=0,evacuations=0,armShot=false,hitShot=false,armedClears=0;
  document.createElement=(...args)=>{if(active&&args[0]==='canvas')allocations++;return create(...args);};
  proto.clearRect=function(...args){if(active)clears++;return clear.apply(this,args);};
  const paint=()=>{c.clearRect(0,0,440,840);c.fillStyle='#0c2c40';c.fillRect(0,0,440,840);CORE.drawCore(c,run,e.elapsed);fx.backdrop(c,run);fx.draw(c,run);fx.draw(c,run,true);};
  const shot=()=>{renderCanvas(performance.now()+e.elapsed);return els.canvas.toDataURL('image/webp',.80).split(',')[1];};
  try{
   for(let i=0;i<500&&!e.rescueStarted;i++){
    if(e.phase==='armed'){
      paint();clears=0;active=true;for(let j=0;j<8;j++){fx.draw(c,run);fx.draw(c,run,true);}active=false;armedClears=clears;
      if(!armShot&&!low){shots.push({phase:'armed',data:shot()});armShot=true;}
      CORE.requestStrike(run);
    }
    CORE.update(run,1/60,{impact:n=>{hitCount++;return 80-n;},evacuate:()=>evacuations++});
    const start=performance.now();active=i>4;paint();active=false;draws.push(performance.now()-start);
    if(e.hit&&!hitShot&&!low&&e.elapsed-e.hitAt>=200){shots.push({phase:'impact',data:shot()});hitShot=true;}
   }
   if(hitCount!==1||evacuations!==1||e.actualDamage!==20)throw new Error('Broken sequence: '+id);
   paint();clears=0;active=true;for(let i=0;i<12;i++){fx.draw(c,run);fx.draw(c,run,true);}active=false;
   const heldClears=clears;
   run.cameraY+=100000;clears=0;active=true;fx.backdrop(c,run);fx.draw(c,run);fx.draw(c,run,true);active=false;
   const offscreenClears=clears;draws.sort((a,b)=>a-b);
   return {id,kind:e.kind,low,frames:draws.length,p95:draws[Math.floor(draws.length*.95)],max:draws.at(-1),liveCanvasAllocations:allocations,armedClears,heldClears,offscreenClears,hitCount,evacuations,shots};
  }finally{active=false;document.createElement=create;proto.clearRect=clear;}
 }
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),out='output/core-vfx-performance';fs.mkdirSync(out,{recursive:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=core-vfx-perf-1');await p.waitForFunction(()=>window.__vfxPerf&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  const rows=[];
  for(const id of ['fire','electric','frost','cosmos','nano','phantom','telekinesis','glitch','cloning'])for(const low of [false,true]){
   const r=await p.evaluate(({id,low})=>__vfxPerf.measure(id,low),{id,low});
   for(const s of r.shots)fs.writeFileSync(out+'/'+id+'-'+s.phase+'.webp',Buffer.from(s.data,'base64'));delete r.shots;
   assert.equal(r.liveCanvasAllocations,0,id+' must prepare its canvases before the live sequence');assert.equal(r.armedClears,0);assert.equal(r.heldClears,0);assert.equal(r.offscreenClears,0);
   rows.push(r);console.log(JSON.stringify(r));
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/all-nine.json',JSON.stringify({rows,errors},null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
