const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('game.js','utf8');
const take=name=>{const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);assert(a>=0&&b>a,name);return source.slice(a,b);};
const draws=[], sprite=id=>({id,complete:true,naturalWidth:64});
const context={performance:{now:()=>2000},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
 FLASK_VALUES:{1:1,2:3,3:5},run:{worldId:1,world:{},effects:{},particles:[],specialEffects:[]},
 ctx:{drawImage:(s,...rect)=>draws.push({id:s.id,rect}),save(){},restore(){},globalAlpha:1},
 WORLD_SPRITES:{1:{stone:sprite('stone'),'stone-reinforced':sprite('reinforced'),'ground-weak':sprite('weak'),
  'ground-weak-liquid':sprite('vein1'),'stone-liquid':sprite('vein3'),'stone-reinforced-liquid':sprite('vein5')}},
 ensureWorldSprites:()=>({'snow-packed':sprite('snow'),snowflake:sprite('snowflake')}),
 contentBlock:()=>null,projectSprite:()=>null,frostFreezable:()=>true,shareGlitchHit(){},
 markFrostTransformation(){},createDebris(){},drawSpecialBlockAura(){},drawCrackStage(){},
 awardRunExperience(){},awardFlaskData:n=>{context.reward+=n;},sound(){},effectDensity:()=>1,
 isMobileDevice:()=>false,trimParticles(){},reward:0,
 window:{SlimeBlockBreakFeedback:{emitEssence:()=>({particles:[],impact:{type:'essenceCollect'}})}}};
vm.createContext(context);
vm.runInContext(['turnBlockToSnow','turnBlockToSnowflake','drawWorldSprite','registerBrokenBlock'].map(take).join('\n'),context);
for(const [tier,value] of [[1,1],[2,3],[3,5]]) for(const transform of ['turnBlockToSnow','turnBlockToSnowflake']){
 const b={id:tier,tier:'reinforced',flaskTier:tier,hp:5,maxHp:5,x:0,y:0,w:64,h:64};
 assert.equal(context[transform](b,1000),true);
 assert.equal(b.flaskTier,tier);assert.equal(b.flaskValue,value);
 for(const progress of [0,.5,1]){
  draws.length=0;b.frostTransformStartedAt=1000;b.frostTransformDuration=470;
  assert.equal(context.drawWorldSprite(b,0,1,1000+progress*470),true);
  assert.equal(draws.at(-1).id,`vein${value}`,'original vein above both intermediate and complete snow');
 }
 context.reward=0;context.registerBrokenBlock(b);context.registerBrokenBlock(b);
 assert.equal(context.reward,value,'original reward granted once');
}
console.log('Frost veins: snow and snowflake retain +1/+3/+5 artwork throughout reveal and grant the original reward once');
