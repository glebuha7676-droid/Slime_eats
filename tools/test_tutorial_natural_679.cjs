const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=require('./test_tutorial_679.cjs').hook;
const hook=base+`window.__lesson679.drive=function(frames){
 const original=performance.now.bind(performance),records=[];let at=this.clock||original();
 Object.defineProperty(performance,'now',{configurable:true,value:()=>at});
 cancelAnimationFrame(run.animationId);run.lastTime=at;
 try{for(let i=0;i<frames&&!run.ended;i++){
   at+=1000/60;
   const target=run.tutorialPhase===1?(run.slime.y<900?run.startX:run.cellSize*2.5):(run.slime.y<1000?run.startX:run.cellSize*2.5);
   run.steer.keyLeft=run.slime.x>target+14;run.steer.keyRight=run.slime.x<target-14;
   if(run.tutorialHint?.kind==='hazard') {run.steer.keyLeft=run.slime.x>run.cellSize*2.5+8;run.steer.keyRight=false;}
   if(run.tutorialHint?.kind==='ability'&&run.elementalAbilityCharges>0)activateAbility();
   gameFrame(at);cancelAnimationFrame(run.animationId);
   if(this.lastHint!==run.tutorialHint?.kind){this.lastHint=run.tutorialHint?.kind;records.push({at,hint:this.lastHint,depth:run.depth,y:run.slime.y,camera:run.cameraY,gain:run.masteryGain,health:run.health,flags:{...save.onboarding}});}
 }this.clock=at;return {records,state:this.state(),matrix:ctx.getTransform().toJSON(),slime:run.slime};
 }finally{Object.defineProperty(performance,'now',{configurable:true,value:original});}
};`;
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[],records=[];p.on('pageerror',e=>errors.push(e.stack));
 const source=fs.readFileSync('game.js','utf8');await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=679');await p.waitForFunction(()=>window.SlimeGameDebug);await p.evaluate(()=>__lesson679.setup({schemaVersion:29,tutorialStep:'play',onboarding:{version:6,enabled:true},unlockedMutations:['fire'],mutationLevels:{fire:1},activeMutationPool:['fire'],sound:false},true));await p.locator('#worldStartBtn').click();await p.waitForFunction(()=>__lesson679.state().phase===1);await p.evaluate(()=>__lesson679.freeze());
 for(let batch=0;batch<150;batch++){
   const result=await p.evaluate(()=>__lesson679.drive(120));records.push(result);console.log(JSON.stringify({batch,...result.state,matrix:result.matrix}));
   if(result.records.some(r=>r.hint))await p.screenshot({path:'outputs/tutorial-679/natural-'+batch+'.png'});
   if(result.state.ended)break;
 }
 fs.writeFileSync('outputs/tutorial-679/natural-checks.json',JSON.stringify({records,errors},null,2));assert.deepEqual(errors,[]);
 const last=records.at(-1).state;assert(last.ended,'First mine should finish');assert(last.mastery>=250,'Ordinary gameplay earns first form');assert(last.flags.fireLearned);assert.equal(last.flags.hazardLearned,false);assert.equal(last.flags.healLearned,false);assert(last.flags.abilityLearned);
 console.log('Natural first run passed');
 await p.evaluate(()=>__lesson679.setup({schemaVersion:29,tutorialStep:'second-play',onboarding:{version:6,enabled:true,controlsLearned:true,fireLearned:true,abilityLearned:true},unlockedMutations:['fire'],mutationLevels:{fire:2},activeMutationPool:['fire'],sound:false},true));
 await p.locator('#worldStartBtn').click();await p.waitForFunction(()=>__lesson679.state().phase===2);await p.evaluate(()=>{__lesson679.freeze();__lesson679.clock=0;__lesson679.lastHint=null;});
 const second=[];
 for(let batch=0;batch<100;batch++){
   const r=await p.evaluate(()=>__lesson679.drive(120));second.push(r);
   if(r.records.some(r=>r.hint))await p.screenshot({path:'outputs/tutorial-679/second-natural-'+batch+'.png'});
   if(r.state.ended)break;
 }
 fs.writeFileSync('outputs/tutorial-679/natural-second-checks.json',JSON.stringify({records:second,errors},null,2));
 const end=second.at(-1).state;assert(end.ended);assert(end.flags.hazardLearned);assert(end.flags.healLearned);assert(end.flags.veinsLearned);assert(end.balance>=25);assert.deepEqual(errors,[]);console.log('Natural second run passed');

}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
