const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../game.js'),'utf8');
const logic=source.slice(source.indexOf('  function paintPlayerExperience('),source.indexOf('  function updatePersistentUI('));
const moduleContext={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../js/config/slime-progression.js'),'utf8'),moduleContext);
vm.runInNewContext(fs.readFileSync(require.resolve('../js/config/mutation-mastery.js'),'utf8'),moduleContext);
const classes={toggle(){},remove(){}};
const wallet={classList:classes,setAttribute(){},dataset:{}};
const nodes=new Map();
const node=id=>{if(!nodes.has(id))nodes.set(id,{classList:classes,style:{},textContent:'',getAttribute(){return ''},replaceChildren(){}});return nodes.get(id)};
const context={PROGRESSION:moduleContext.window.SlimeProgression,save:{selectedMutation:'fire',researchUnits:125,mutationMastery:{fire:300,frost:10}},homeRewardFlight:null,playerExperiencePresentation:null,menuReducedMotion:true,adminInfiniteResearch:false,
 slimeDevelopment:(id,view,value)=>moduleContext.window.SlimeMutationMastery.state(id,1,value,view),slimeTaskCount:()=>context.save.mutationMastery[context.save.selectedMutation],mutationLevel:()=>1,selectedSlimeMutationId:()=>context.save.selectedMutation,slimeExperience:()=>context.save.mutationMastery[context.save.selectedMutation],mutationById:id=>({id,name:id,image:`${id}.webp`}),versionedAsset:x=>x,formatCompactNumber:String,
 document:{body:{dataset:{screen:'home'}},getElementById:node},clearTimeout(){},cancelAnimationFrame(){},
 els:{coinsLabel:{closest:()=>wallet},playerLevelProgress:{style:{},parentElement:wallet},playerLevelExperience:{},researchUnitsLabel:{closest:()=>wallet}}
};
vm.createContext(context);vm.runInContext(logic,context);
context.prepareHomeRewardFlight({mutationId:'fire',researchUnitsBefore:100,researchUnitsAfter:125,experienceBefore:240,masteryGain:60});
context.renderWalletBalances();
assert.equal(context.els.researchUnitsLabel.textContent,'100');
assert.equal(context.els.playerLevelExperience.textContent,'Подожги блоки: 240/250');
assert.equal(context.els.coinsLabel.textContent,'I');
context.save.selectedMutation='frost';
context.homeRewardFlight.flaskShown=15;context.homeRewardFlight.experienceShown=30;context.renderWalletBalances();
assert.equal(context.els.researchUnitsLabel.textContent,'115');
assert.equal(context.els.playerLevelExperience.textContent,'ГОТОВ К РАЗВИТИЮ');
assert.equal(context.els.coinsLabel.textContent,'I','Receiving XP never purchases stage II');
assert.equal(node('slimeProgressName').textContent,'fire','Flight remains bound to the played mutation');
context.settleHomeRewardFlight();
assert.equal(context.els.researchUnitsLabel.textContent,'125');
assert.equal(context.els.playerLevelExperience.textContent,'Заморозь блоки: 10/50','Changing selection does not mix two XP balances');
assert.equal(context.save.mutationMastery.fire,300,'Presentation never credits the reward again');
assert.equal(context.save.mutationMastery.frost,10);
assert.equal(context.homeRewardFlight,null);
console.log('Home reward flight: personal XP ownership, staged flasks, ready evolution without automatic purchase, cancellation without duplicated rewards passed');
