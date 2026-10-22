const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright'),{hook:base}=require('./test_tutorial_679.cjs');
const hook=base+`window.__goal681={
 sample(x,y,ready){
  __lesson679.freeze();run.launchEntryUntil=0;run.launchEntryStartedAt=0;run.portalEntry=null;run.shake=0;
  save.onboarding.fireLearned=true;run.tutorialLessonTime=16000;run.tutorialFireExplainedAt=10000;
  run.masteryGain=ready?250:130;run.depth=246;run.cameraY=2000;run.slime.x=x;run.slime.y=2000+y;
  const original=ctx.drawImage,draws=[];
  ctx.drawImage=function(image,...args){
   if((image.src||'').includes('slime-body-fire-warm')&&args.length===4){
    const [left,top,width,height]=args,m=ctx.getTransform(),canvas=els.canvas.getBoundingClientRect();
    const points=[[left,top],[left+width,top],[left,top+height],[left+width,top+height]].map(([x,y])=>({x:canvas.left+(m.a*x+m.c*y+m.e)*canvas.width/els.canvas.width,y:canvas.top+(m.b*x+m.d*y+m.f)*canvas.height/els.canvas.height}));
    draws.push({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});
   }
   return original.call(this,image,...args);
  };
  try{renderCanvas(performance.now());}finally{ctx.drawImage=original;}
  updateRunUI();positionTutorialRunGoal();
  const goal=document.querySelector('#tutorialRunGoal'),r=goal.getBoundingClientRect();
  return {goal:r.toJSON(),draws,text:goal.innerText,mini:goal.classList.contains('is-mini'),overflow:goal.scrollWidth-goal.clientWidth};
 }
};`;
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[],records=[];p.on('pageerror',e=>errors.push(e.stack));
 const source=fs.readFileSync('game.js','utf8');await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=681');await p.waitForFunction(()=>window.SlimeGameDebug);
 await p.evaluate(()=>__lesson679.setup({schemaVersion:29,tutorialStep:'play',onboarding:{version:6,enabled:true,fireLearned:true},unlockedMutations:['fire'],mutationLevels:{fire:1},activeMutationPool:['fire'],sound:false},true));
 await p.locator('#worldStartBtn').click();await p.waitForFunction(()=>__lesson679.state().phase===1);await p.evaluate(()=>__lesson679.freeze());
 for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1280,height:900}]){
  await p.setViewportSize(viewport);await p.waitForTimeout(150);
  for(const x of [45,110,220,330,395])for(const y of [70,110,150,200,260,440,650]){
   const r=await p.evaluate(({x,y})=>__goal681.sample(x,y,true),{x,y});
   assert(r.draws.length,'Check against the actual painted body sprite');
   assert(r.goal.height<=48,'Goal is a compact ribbon');assert(r.goal.left>=0&&r.goal.right<=viewport.width+1);assert(r.overflow<=1,'Counter stays inside');
   for(const body of r.draws)assert(!(r.goal.left<body.right&&r.goal.right>body.left&&r.goal.top<body.bottom&&r.goal.bottom>body.top),'Goal never covers the painted slime');
   records.push({viewport,x,y,...r});
  }
  await p.evaluate(()=>__goal681.sample(285,200,true));await p.screenshot({path:'outputs/tutorial-679/goal-'+viewport.width+'-ready.png'});
  await p.evaluate(()=>__goal681.sample(220,110,false));await p.screenshot({path:'outputs/tutorial-679/goal-'+viewport.width+'-rebound.png'});
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('outputs/tutorial-679/goal-layout-checks.json',JSON.stringify({records,errors},null,2));console.log('105 actual body positions: compact goal, full counter and no overlap, at 320/390/desktop passed.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
