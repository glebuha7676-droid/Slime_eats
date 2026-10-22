const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const base=require('./test_tutorial_682.cjs').hook;
const hook=base+`window.__lesson682.drive=function(frames){
 const original=performance.now.bind(performance),records=[];let at=this.clock||original();
 Object.defineProperty(performance,'now',{configurable:true,value:()=>at});
 cancelAnimationFrame(run.animationId);run.lastTime=at;
 try{for(let i=0;i<frames&&!run.ended;i++){
   at+=1000/60;
   if(tutorialMemoState?.kind==='controls'&&at>=tutorialMemoState.readyAt)closeOnboardingMemo();
   const row=Math.max(0,Math.min(run.rowCount-1,Math.floor((run.slime.y-285)/run.cellSize)+1));
   let col=run.tutorialRoute?.[row]??2;
   const h=run.tutorialHazard;
   if(h && run.slime.y>285+h.row*run.cellSize-run.cellSize*6 && run.slime.y<285+(h.row+2)*run.cellSize){
     const choices=[h.col-1,h.col+1].filter(c=>c>=0&&c<run.columns);
     col=choices.find(c=>run.blocks.find(b=>b.row===h.row&&b.col===c)?.tier==='dense')??choices[0];
   }
   const target=(col+.5)*run.cellSize;
   run.steer.keyLeft=run.slime.x>target+14;run.steer.keyRight=run.slime.x<target-14;
   if(run.tutorialHint?.kind==='ability'&&run.elementalAbilityCharges>0)activateAbility();
   gameFrame(at);cancelAnimationFrame(run.animationId);
   if(this.lastHint!==run.tutorialHint?.kind){this.lastHint=run.tutorialHint?.kind;records.push({at,hint:this.lastHint,depth:run.depth,y:run.slime.y,camera:run.cameraY,gain:run.masteryGain,health:run.health,flags:{...save.onboarding}});}
 }this.clock=at;return {records,state:this.state(),matrix:ctx.getTransform().toJSON(),slime:run.slime};
 }finally{Object.defineProperty(performance,'now',{configurable:true,value:original});}
};`;
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const errors=[],records=[];p.on('pageerror',e=>errors.push(e.stack));
 const source=fs.readFileSync('game.js','utf8');await p.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
 await p.goto('http://127.0.0.1:8766/?v=683');await p.waitForFunction(()=>window.SlimeGameDebug);await p.evaluate(()=>__lesson682.setup({schemaVersion:29,tutorialStep:'play',onboarding:{version:7,enabled:true},unlockedMutations:['fire'],mutationLevels:{fire:1},activeMutationPool:['fire'],sound:false},true));await p.locator('#worldStartBtn').click();await p.waitForFunction(()=>__lesson682.state().phase===1);await p.evaluate(()=>__lesson682.freeze());
 for(let batch=0;batch<150;batch++){
   const result=await p.evaluate(()=>__lesson682.drive(120));records.push(result);console.log(JSON.stringify({batch,...result.state,matrix:result.matrix}));
   if(result.records.some(r=>r.hint))await p.screenshot({path:'outputs/tutorial-682/natural-'+batch+'.png'});
   if(result.state.ended)break;
 }
 fs.writeFileSync('outputs/tutorial-682/natural-checks.json',JSON.stringify({records,errors},null,2));assert.deepEqual(errors,[]);
 const last=records.at(-1).state;assert(last.ended,'First mine should finish');assert(last.mastery>=250,'Ordinary gameplay earns first form');assert(last.flags.fireLearned);assert.equal(last.flags.hazardLearned,false);assert.equal(last.flags.healLearned,false);assert(last.flags.abilityLearned);
 console.log('Natural first run passed');
 await p.evaluate(()=>__lesson682.setup({schemaVersion:29,tutorialStep:'second-play',onboarding:{version:7,enabled:true,controlsLearned:true,fireLearned:true,abilityLearned:true},unlockedMutations:['fire'],mutationLevels:{fire:2},activeMutationPool:['fire'],sound:false},true));
 await p.locator('#worldStartBtn').click();await p.waitForFunction(()=>__lesson682.state().phase===2);await p.evaluate(()=>{__lesson682.freeze();__lesson682.clock=0;__lesson682.lastHint=null;});
 const second=[];
 for(let batch=0;batch<100;batch++){
   const r=await p.evaluate(()=>__lesson682.drive(120));second.push(r);
   if(r.records.some(r=>r.hint))await p.screenshot({path:'outputs/tutorial-682/second-natural-'+batch+'.png'});
   if(r.state.ended)break;
 }
 fs.writeFileSync('outputs/tutorial-682/natural-second-checks.json',JSON.stringify({records:second,errors},null,2));
 const end=second.at(-1).state;assert(end.ended);assert(end.flags.hazardLearned);assert(end.flags.healLearned);assert(end.flags.veinsLearned);assert(end.balance>=50);assert.deepEqual(errors,[]);console.log('Natural second run passed');

}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
