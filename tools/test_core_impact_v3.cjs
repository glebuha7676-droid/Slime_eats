const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright'),CORE=require('../js/gameplay/core-encounter.js');
const reserves=[5,35,60,85],profiles=reserves.map(CORE.impactProfile);
assert.deepEqual(profiles.map(p=>p.tier),[1,2,3,4]);
for(let i=1;i<4;i++)for(const key of ['press','kick','shake','shards','size','speed','light','wallCount','wallSize','dust'])assert(profiles[i][key]>profiles[i-1][key]);
for(const reserve of reserves)for(let age=0;age<1500;age+=10){const r=CORE.impactResponse(reserve,age);assert(r.compression>=0&&r.compression<.03);assert(Math.abs(r.kick)<=7);assert(Number.isFinite(r.light));}
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1],core=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const hook=base+core+`window.__impactQA={
 start(){__consoleQA.home('cosmos',3);__coreQA.start();},
 margins(){const c=document.createElement('canvas');c.width=440;c.height=600;const x=c.getContext('2d');const fake={...run,cameraY:0,slime:{x:220,y:300,radius:30},coreEncounter:{...run.coreEncounter,phase:'armed',aura:1,power:1,hit:false,elapsed:2500}};SlimeCosmosCoreStrike.draw(x,fake,true);const p=x.getImageData(180,357,80,30).data;let beyond=0;for(let i=3;i<p.length;i+=4)beyond+=p[i];return beyond;},
 frame(reserve,hp=100,age=120){hideRunMenu();cancelAnimationFrame(run.animationId);run.paused=true;run.evacuation=null;run.energy=reserve;run.slime.y=run.coreArena.surfaceY-150;run.cameraY=run.coreArena.surfaceY-720;CORE.begin(run,hp);const e=run.coreEncounter;Object.assign(e,{phase:'rebound',elapsed:2000+age,hitAt:2000,hit:true,hitStop:0,aura:0,zoom:1,contactX:220,contactY:run.coreArena.surfaceY,contactSlimeY:run.coreArena.surfaceY-24,castX:220,castY:run.coreArena.surfaceY-330,afterHp:Math.max(0,hp-CORE.damage(reserve)),actualDamage:Math.min(hp,CORE.damage(reserve))});run.slime.y=run.coreArena.surfaceY-180;run.slime.vx=0;run.slime.vy=-400;run.shake=0;renderCanvas(performance.now());return {profile:CORE.impactProfile(reserve),reaction:CORE.impactResponse(reserve,age)};}
};`;
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),dir='output/core-impact-v3';fs.mkdirSync(dir,{recursive:true});
 try{
  const p=await b.newPage({viewport:{width:440,height:840}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
  await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await p.goto('http://127.0.0.1:8766/?v=core-impact-3');await p.waitForFunction(()=>window.__impactQA&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});await p.evaluate(()=>__impactQA.start());await p.waitForFunction(()=>__coreQA.state().phase==='armed');
  await p.evaluate(()=>__coreQA.pause());assert(await p.evaluate(()=>__impactQA.margins())>100,'Front glow continues smoothly below the old 112px cache boundary');
  for(const reserve of reserves){await p.evaluate(n=>__impactQA.frame(n),reserve);await p.screenshot({path:dir+'/impact-'+reserve+'.png'});}
  const full=await p.evaluate(()=>__impactQA.frame(85,100)),weakCore=await p.evaluate(()=>__impactQA.frame(85,5));assert.deepEqual(full,weakCore,'Reaction depends on strike strength, not remaining core health');await p.screenshot({path:dir+'/low-hp-core.png'});
  await p.evaluate(()=>__impactQA.frame(100,100,360));await p.screenshot({path:dir+'/environment-max.png'});assert.deepEqual(errors,[]);console.log(JSON.stringify({tiers:profiles.map(p=>p.tier),expandedGlow:true,smallDeformation:true,independentOfHp:true,errors}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
