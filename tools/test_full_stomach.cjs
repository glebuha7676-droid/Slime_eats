const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../game.js'),'utf8');
const start=source.indexOf('  function dissolveUneatenFood(');
const end=source.indexOf('\n  async function advanceConveyorAfterChoice(',start);
const created=[],timers=[];
let hidden=0;
const models=Array.from({length:3},(_,index)=>({dataset:{offerIndex:String(index)},querySelector(selector){
  if(selector==='.food-model-wrap img')return{src:'food.webp',getBoundingClientRect(){return{left:10,top:10,width:100,height:100}}};
  return{style:{set visibility(value){if(value==='hidden')hidden++}}};
}}));
const context={els:{foodChoices:{querySelectorAll(){return models}}},document:{body:{appendChild(){}},createElement(){const image={style:{},remove(){this.removed=true},animate(frames,options){this.frames=frames;this.options=options;return{cancel(){}}}};created.push(image);return image}},Promise,setTimeout(fn){timers.push(fn)}};
vm.createContext(context);vm.runInContext(source.slice(start,end),context);
(async()=>{
  const normal=context.dissolveUneatenFood(1,false);
  assert.equal(created.length,12,'Only two uneaten foods dissolve, with six bounded fragments each');
  assert.equal(hidden,2);
  assert.ok(created.every(image=>image.options.duration===430 && image.frames.at(-1).opacity===0));
  timers.splice(0).forEach(fn=>fn());await normal;
  assert.ok(created.every(image=>image.removed),'No particle nodes linger after the animation');
  created.length=0;hidden=0;
  const reduced=context.dissolveUneatenFood(1,true);
  assert.equal(created.length,2,'Reduced motion uses a single fade for each food');
  timers.splice(0).forEach(fn=>fn());await reduced;
  assert.ok(created.every(image=>image.removed));
  let generated=0,rendered=0;
  const draft={foods:[{id:1},{id:2},{id:3}],offer:[null,{id:4},{id:5}],offerTransition:false};
  const noop=()=>{};
  Object.assign(context,{session:draft,matchMedia:()=>({matches:false}),
    setTimeout:fn=>{fn();return 1},stomachIsFull:()=>true,
    dissolveUneatenFood:()=>Promise.resolve(),activeMutationFamilies:()=>['fire','ice','electric'],
    foodRecipeFamily:()=> 'fire',randomFood:()=>{generated++;return{}},renderDraft:()=>{rendered++},
    persist:noop,releaseConveyorControl:noop,conveyorCanStart:()=>true,sound:noop,feedback:noop});
  context.els.conveyor={classList:{add:noop,remove:noop}};
  context.els.conveyorDispensers={querySelector:()=>({classList:{add:noop,remove:noop}})};
  const next=source.indexOf('\n  async function rerollOffer(',end);
  vm.runInContext(source.slice(end,next),context);
  await context.advanceConveyorAfterChoice(0,null);
  assert.equal(generated,0,'Full stomach must never synthesize a new portion');
  assert.equal(rendered,1);
  assert.ok(draft.offer.every(food=>food===null));
  assert.equal(draft.offerTransition,false);
  console.log('Full-stomach leftovers: selected food excluded, bounded fragments, cleanup and reduced motion passed');
})();
