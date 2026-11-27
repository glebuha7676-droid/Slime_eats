const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright'),CORE=require('../js/gameplay/core-encounter.js');
const ids=['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch'];
for(const id of ids)for(const reserve of [5,100]){
 const run={mutationId:id,energy:reserve,slime:{x:200,y:800,vy:260,radius:30,wobble:0},cameraY:640,coreArena:{x:220,surfaceY:1450,cameraY:887}};CORE.begin(run,100);let prior=0;
 for(let i=0;i<200;i++){const e=run.coreEncounter;if(!['approach','armed'].includes(e.phase))break;const p=CORE.preparationPose(run);assert(p.eyeClosure>=prior-.001);prior=p.eyeClosure;assert(e.slimeScale>=.979);assert((e.impactSquash||0)<.016);assert.equal(p.mouthStyle,'concentrated');CORE.update(run,1/60,{});if(e.phase==='armed'&&e.phaseTime>50)break;}
 assert(prior>.98);run.evacuation={};assert.equal(CORE.preparationPose(run).eyeClosure,0);
}
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],core=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+core+`window.__prepareQA={
 async grid(stage){
  const ids=['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch'],grid=document.createElement('canvas');grid.width=480;grid.height=ids.length*136;const x=grid.getContext('2d');x.fillStyle='#173a4d';x.fillRect(0,0,grid.width,grid.height);const states=[];
  for(let row=0;row<ids.length;row++){
   __consoleQA.home(ids[row],stage);__coreQA.start();cancelAnimationFrame(run.animationId);run.paused=true;await preloadMenuAppearance(run.categoryVisuals);await SlimeAvatarRenderer.whenReady();
   for(let col=0;col<3;col++){
    run.coreEncounter=null;run.energy=100;run.slime.x=220;run.slime.y=run.coreArena.triggerY-10;run.slime.vy=260;run.cameraY=run.slime.y-158;beginCoreEncounter();const e=run.coreEncounter;
    const duration=CORE[(e.kind||'').toUpperCase()]?.gather||2400;e.phaseTime=duration*[.05,.56,.999][col];CORE.update(run,0,{});run.shake=0;renderCanvas(performance.now());
    const pose=CORE.preparationPose(run),z=e.zoom||1,px=220,py=420+(run.slime.y-run.cameraY-420)*z,dpr=els.canvas.width/440;
    x.drawImage(els.canvas,(px-52)*dpr,(py-45)*dpr,104*dpr,90*dpr,col*160+14,row*136+30,132,100);
    x.fillStyle='#eaffff';x.font='bold 12px sans-serif';x.fillText(ids[row]+' '+Math.round(pose.eyeClosure*100)+'%',col*160+8,row*136+18);states.push({id:ids[row],stage,closure:pose.eyeClosure,scale:e.slimeScale});
   }
  }
  return {image:grid.toDataURL('image/png').split(',')[1],states};
 }
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),out='output/core-preparation-v2';fs.mkdirSync(out,{recursive:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=core-prepare-2');await p.waitForFunction(()=>window.__prepareQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  for(const stage of [1,2,3]){const data=await p.evaluate(stage=>__prepareQA.grid(stage),stage);fs.writeFileSync(out+'/stage-'+stage+'.png',Buffer.from(data.image,'base64'));for(let i=0;i<data.states.length;i+=3){const a=data.states.slice(i,i+3);assert(a[0].closure<.02&&a[1].closure>.3&&a[2].closure>.99);assert(a.every(s=>s.scale>=.979));}console.log(JSON.stringify({stage,mutations:9,progressiveEyes:true,smallCompression:true}));}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({errors}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
