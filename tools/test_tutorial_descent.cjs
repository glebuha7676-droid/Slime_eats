const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const normal = require('../js/generation/world1-descent.js');
const tutorial = require('../js/generation/tutorial-descent.js');
const original = normal.build();
const first = tutorial.build({phase:1,normal:original});
assert.equal(first.rows,35);
assert.equal(first.cells.flat().filter(c=>c.flaskTier).length,0,'The first lesson must not introduce currency');
assert.equal(first.cells[5][3].hazard,true,'The first threat is below the launch lane');
assert.ok(first.cells.slice(1,5).every(row=>row[3].tier==='dense'));
assert.ok(first.cells.flat().filter(c=>c.tier==='hard').length>20,'Normal rock variation remains');
assert.equal(first.cells[14][3].special,'gel');
assert.equal(first.cells.flat().filter(c=>c.special==='gel').length,1);
assert.ok(first.cells.slice(9).flat().some(c=>c.hazard),'Ordinary encounters remain below the opening');
assert.equal(original.cells.flat().filter(c=>c.flaskTier).length>0,true,'The normal mine is never mutated');
for(let sample=0;sample<40;sample++) {
  const second = tutorial.build({phase:2,normal:normal.build()});
  assert.equal(second.rows,42);
  assert.ok(second.cells.slice(0,18).flat().every(c=>!c.flaskTier));
  assert.ok(second.cells[18].slice(1,5).every(c=>c.flaskTier && !c.hazard && !c.dead));
  assert.deepEqual(second.cells[18].slice(1,5).map(c=>c.flaskTier),[1,2,3,3],'Plasma quantity matches rock strength');
  assert.ok(second.cells.slice(15,22).flat().every(c=>!c.hazard),'The lesson deposit has a calm approach');
  assert.ok(second.cells.slice(22).flat().some(c=>c.hazard),'Normal hazards resume after the lesson');
  for(const row of second.cells) assert.ok(row.filter(c=>!c.hazard&&!c.dead).length>=2,'Every row offers room to dodge');
  for(const c of second.cells.flat()) if(c.motion?.axis==='y') {
    assert.ok(c.motion.from>=0 && c.motion.to<42,'Moving hazards remain inside the shorter mine');
  }
}
const source = fs.readFileSync(require.resolve('../game.js'),'utf8');
function extract(name) {
  const start=source.indexOf(`  function ${name}(`);
  assert.ok(start>=0,name);
  let end=source.indexOf('\n  function ',start+10);
  const asyncEnd=source.indexOf('\n  async function ',start+10);
  if(asyncEnd>=0 && (end<0 || asyncEnd<end))end=asyncEnd;
  return source.slice(start,end);
}
const classes={add(){},remove(){},toggle(){},contains(){return true}};
const nodes = new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,dataset:{},classList:classes,style:{setProperty(){},removeProperty(){}},textContent:'',innerHTML:'',querySelector(){return node('action')},getBoundingClientRect(){return {left:0,top:0,bottom:840,width:440,height:840}}});return nodes.get(id)};
let now=100;
const context={console,JSON,Set,Math,performance:{now:()=>now},setTimeout:()=>1,clearTimeout(){},
  ONBOARDING_QUESTS:new Set(['','unlock-frost','try-mix','mix-run','upgrade-fire-3','feed-form','open-forms']),
  save:{tutorialStep:'run-wait',onboarding:{enabled:true},unlockedMutations:[],activeMutationPool:[],discoveredForms:[]},
  run:{tutorialPhase:1,worldId:1,health:3,slime:{x:256,y:510,radius:30,vx:0,vy:200},cameraY:0,blocks:[{row:5,col:3,y:650}],cellSize:440/6,gridOffsetX:0},
  els:{tutorialDodge:node('dodge'),tutorialMemo:node('memo'),shaft:node('shaft'),panelOverlay:node('panel')},
  $:node,menuReducedMotion:false,tutorialMemoState:null,tutorialSwipeOrigin:null,onboardingMemoTimer:0,
  VIEW_H:840,VIEW_W:440,document:{body:{dataset:{screen:'drop'}}},
  isMobileDevice:()=>false,persist(){},clearFallSteering(){},sound(){},feedback(){},renderTutorial(){},renderOnboardingQuest(){},queueOnboardingMemo(){},shiftRunClock(){},updateRunUI(){},mechSuitActive:()=>false,applyBlockBounce(slime){slime.vy=-240},impact(){},resetCombo(){},endRun(){throw new Error('Unexpected death')},
  setTutorialStep(step){context.save.tutorialStep=step},pauseRun(){context.run.paused=true},resumeRun(){context.run.paused=false},
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t,versionedAsset:x=>x,FORM_INDEX:[{art:'form'}],mutationLevel:()=>context.fireLevel||2,activateElementalAbility(){context.activations=(context.activations||0)+1;context.run.elementalAbilityCharges=0}
};
vm.createContext(context);
for(const name of ['normalizeOnboarding','resolveHazardHit','showTutorialControls','updateTutorialRun','finishOnboardingRun','checkOnboardingProgress','showOnboardingMemo','closeOnboardingMemo','runCompletionRewards','showTutorialAbility','activateAbility'])vm.runInContext(extract(name),context);
assert.equal(context.normalizeOnboarding(null,'done').enabled,false,'Existing completed players are not forced back into the tutorial');
assert.equal(context.normalizeOnboarding(null,'home-mutations').enabled,true);
assert.equal(context.updateTutorialRun(100),false,'No warning is shown before the real impact');
context.resolveHazardHit({row:5,col:3,x:220,y:650,w:73,h:73},{nx:0,ny:-1,penetration:1},100);
assert.equal(context.run.health,2,'The authored spike really consumes one heart');
assert.ok(context.run.slime.vy<-320,'The first impact has a slightly stronger rebound');
context.run.slime.vy=-90;
assert.equal(context.updateTutorialRun(200),false,'The rebound is visible before the memo');
context.run.slime.vy=-10;
assert.equal(context.updateTutorialRun(400),true);
assert.equal(context.run.paused,true);
context.closeOnboardingMemo();
assert.notEqual(context.save.onboarding.controlsLearned,true,'The card cannot close before one second');
now=1100;
const priorX=context.run.slime.x;
context.closeOnboardingMemo();
assert.equal(context.save.tutorialStep,'post-run');
assert.equal(context.run.paused,false);
assert.equal(context.run.slime.x,priorX,'Closing the lesson never moves the player automatically');
context.run.tutorialPhase=1;context.finishOnboardingRun(true);
assert.equal(context.save.tutorialStep,'post-run');
context.run={tutorialPhase:2,tutorialVeinRow:18,blocks:[{row:18,flaskTier:3,y:1500}],depth:99,cellSize:73,slime:{y:1300,radius:30},paused:false};
context.save.onboarding.veinsLearned=false;
assert.equal(context.updateTutorialRun(12000),false,'No plasma lesson before 100 metres');
context.run.depth=105;
context.updateTutorialRun(12000);
assert.equal(context.run.paused,true);
assert.equal(context.save.onboarding.veinsLearned,false);
now+=1000;context.closeOnboardingMemo();
assert.equal(context.save.onboarding.veinsLearned,true);
assert.equal(context.run.paused,false);
context.finishOnboardingRun(true);
assert.equal(context.save.tutorialStep,'done','Inputs are free after the second resource lesson');
assert.equal(context.save.onboarding.quest,'unlock-frost');
context.save.unlockedMutations=['fire','frost'];context.checkOnboardingProgress();
assert.equal(context.save.onboarding.quest,'mix-run');
assert.equal(context.save.onboarding.pendingMemo,'crossing','Opening Frost schedules crossing without forcing selection');
context.checkOnboardingProgress({event:'frost-selected'});
assert.equal(context.save.onboarding.quest,'mix-run');
context.run={tutorialPhase:0,categoryVisuals:{fire:2,frost:1}};context.finishOnboardingRun(true);
assert.equal(context.save.onboarding.quest,'upgrade-fire-3');
context.fireLevel=3;context.checkOnboardingProgress();
assert.equal(context.save.onboarding.quest,'feed-form');
context.save.discoveredForms=['fire'];context.checkOnboardingProgress();
assert.equal(context.save.onboarding.quest,'','Discovering the form finishes the home quests');
assert.equal(context.save.onboarding.pendingMemo,'form');
for(const phase of [1,2]) assert.equal(context.runCompletionRewards({tutorialPhase:phase},true).research,0);
for(const phase of [1,2]) assert.equal(context.runCompletionRewards({tutorialPhase:phase},true).experience,0);
assert.equal(context.runCompletionRewards({tutorialPhase:0},true).research,25);
assert.equal(context.runCompletionRewards({tutorialPhase:0},true).experience,150);
assert.equal(context.runCompletionRewards({tutorialPhase:0,endless:true},true).research,0);
assert.equal(context.runCompletionRewards({tutorialPhase:0},false).experience,0);
assert.equal(context.normalizeOnboarding({enabled:true,pendingMemo:'collect-goal'},'done').pendingMemo,'','The repeated plasma memo is migrated away');
assert.equal(context.normalizeOnboarding({enabled:true,quest:'open-forms'},'done').quest,'','The old forms task is migrated away');
context.run={tutorialPhase:0,elementalAbilityType:'fire',elementalAbilityCharges:1,damageInvulnerableUntil:0};
context.save.onboarding.abilityLearned=false;
assert.equal(context.updateTutorialRun(now),true);
assert.equal(context.run.tutorialSlowUntil,Infinity);
assert.equal(context.tutorialMemoState.kind,'ability');
context.activateAbility();
assert.equal(context.activations,1,'The highlighted control activates the real ability on the same click');
assert.equal(context.save.onboarding.abilityLearned,true);
assert.equal(context.tutorialMemoState,null);
assert.equal(context.run.tutorialSlowUntil,0);
assert.ok(Number.isFinite(context.run.damageInvulnerableUntil));
assert.equal(context.updateTutorialRun(now),false,'The ability lesson only appears once');
context.run={elementalAbilityType:'',shieldCharges:1};
context.activateAbility();
assert.equal(context.activations,1,'No shield ability is available without an ultra form');
console.log('Tutorial terrain, collision, resource lesson, optional recipe quests, save migration and one-click ultra ability lesson passed');
