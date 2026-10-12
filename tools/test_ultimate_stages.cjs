const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../game.js'),'utf8');
const moduleContext={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../js/config/ultimate-stages.js'),'utf8'),moduleContext);
const U=moduleContext.window.SlimeUltimateStages;
function take(name){const a=source.indexOf(`  function ${name}(`);let b=source.indexOf('\n  function ',a+20);const async=source.indexOf('\n  async function ',a+20);if(async>=0&&async<b)b=async;assert.ok(a>=0&&b>a,name);return source.slice(a,b);}
const c={Math,Set,performance:{now:()=>1000},adminInfiniteUltimate:false,
 ELEMENTAL_ABILITY_DURATION_MS:{fire:2000,frost:6000,electric:4600,cosmos:5500,nano:10000,telekinesis:2500,cloning:5800,phantom:2800,glitch:1800},
 ELECTRIC_STORM_STRIKES:5,ELECTRIC_STORM_BRANCH_LENGTH:4,PHOENIX_FIRE_ROWS:14,COSMOS_ULTIMATE_CHARGE_MS:920,COSMOS_ULTIMATE_ROWS:20,COSMOS_ULTIMATE_FADE_START_MS:4000,
 MECH_LAND_MS:600,MECH_ACTIVE_MS:10000,CLONE_ULTIMATE_BURST_MS:540,GLITCH_TITLE_MS:800,
 PHANTOM_MARK_INTERVAL_MS:5000,PHANTOM_PORTAL_INTERVAL_MS:10000,
 TELEKINESIS_PRESS_DISTANCE_CELLS:11.2,TELEKINESIS_PRESS_COLLIDE_MS:1280,
 clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),sound(){},feedback(){},updateRunUI(){},impact(){},startFrostStorm(){},startGlitchChoice(){},startTelekinesisPress(){},startPhantomExpress(){},ensurePhantomExpressSprites(){},materializePhantom(){},
 playAbilityActivation(stage){c.tapStage=stage},startUltimateIntro(type){c.run.ultimateIntro={type};c.intros++},
};vm.createContext(c);
vm.runInContext(['activateElementalAbility','commitElementalAbility'].map(take).join('\n'),c);
const fresh=(id,stage)=>({ultimateStage:stage,ultimateProfile:U.get(id,stage),elementalAbilityType:id,elementalAbilityCharges:1,ultimateCharge:65,elementalAuraId:0,
 slime:{x:180,y:700,radius:20,vx:30,vy:100},cellSize:60,columns:6,gridOffsetX:0,blockRowOrigin:190,rowCount:100,portalY:7000,damageInvulnerableUntil:0,shake:0,blocksByRow:new Map()});
for(const id of Object.keys(U.profiles)) for(const stage of [1,2,3]){
 c.run=fresh(id,stage);c.intros=0;c.tapStage=0;
 assert.equal(c.activateElementalAbility(1000),true);
 assert.equal(c.run.elementalAbilityCharges,0);assert.equal(c.run.ultimateCharge,0);
 if(stage<3){assert.equal(c.intros,0,'Lower grades never run the flying button intro');assert.equal(c.tapStage,stage);assert.equal(c.run.elementalAbilityActive,id,'First and second grades commit immediately');}
 else{assert.equal(c.intros,1,'III keeps the full intro');assert.equal(c.run.elementalAbilityActive,undefined);c.run.ultimateIntro=null;c.commitElementalAbility(id,1000,180,700);}
 const p=U.get(id,stage);
 if(id==='cosmos')assert.equal(c.run.cosmosUltimate.endY,700+p.orbitRows*60);
 if(id==='electric'){assert.equal(c.run.electricStorm.strikeLimit,p.strikes);assert.equal(c.run.electricStorm.branchLength,p.branchLength)}
 if(id==='fire')assert.equal(c.run.phoenixUltimate.rows,p.rows);
 if(id==='nano')assert.equal(c.run.mechSuit.expireAt-c.run.mechSuit.landAt,p.mechMs);
 if(id==='cloning')assert.equal(c.run.cloneUltimate.count,p.sporeCount);
 assert.equal(c.activateElementalAbility(1001),false,'A second tap never spends or activates again');
}
// Real phantom and press geometry, not just configuration values.
vm.runInContext(['startPhantomExpress','startTelekinesisPress'].map(take).join('\n'),c);
for(const stage of [1,2,3]){
 c.run=fresh('phantom',stage);c.startPhantomExpress(1000);const e=c.run.phantomExpress,p=U.get('phantom',stage);
 assert.equal(e.width,p.trainWidth);assert.equal(e.endRow-e.startRow+1,p.trainRows);
 assert.equal(e.centerX,(e.startCol+p.trainWidth/2)*60);
 c.run=fresh('telekinesis',stage);c.startTelekinesisPress(1000,700);
 assert.equal(c.run.telekinesisPress.bottomY-c.run.telekinesisPress.topY,U.get('telekinesis',stage).pressRows*60);
}
assert.equal(U.get('fire',3).meters,100);assert.equal(U.get('frost',3).durationMs,6000);assert.equal(U.get('electric',3).strikes,5);assert.equal(U.get('cosmos',3).orbitRows,20);assert.equal(U.get('nano',3).mechMs,10000);assert.equal(U.get('phantom',3).trainWidth,4);assert.equal(U.get('phantom',3).trainRows,12);assert.equal(U.get('cloning',3).sporeCount,8);assert.equal(U.get('glitch',3).rewriteRows,10);
Object.assign(c,{glitchSlimeCell:()=>({row:8,col:3}),glitchDeletableBlock:b=>!b.dead,glitchEligibleBlock:b=>!b.dead&&!b.hazard});
vm.runInContext(take('executeGlitchBug'),c);
for(const stage of [1,2,3])for(const kind of ['delete','hack','infect','change']){
 c.run=fresh('glitch',stage);const p=c.run.ultimateProfile;
 c.run.blocks=Array.from({length:25*6},(_,id)=>({id,row:Math.floor(id/6),col:id%6,hazard:kind==='hack',dead:false}));
 Object.assign(c.run,{glitchDeleteQueue:[],glitchHackQueue:[],glitchSpreadQueue:[]});
 c.executeGlitchBug(kind,1000);
 if(kind==='delete'){assert.ok(c.run.glitchDeleteQueue.length<=p.deleteCap);assert.ok(c.run.glitchDeleteQueue.every(({block:b})=>b.row<=8+p.glitchRows));}
 if(kind==='hack')assert.ok(c.run.glitchHackQueue.every(({block:b})=>b.row<=8+p.glitchRows));
 if(kind==='infect')assert.ok(c.run.glitchSpreadQueue.flatMap(item=>item.blocks).every(b=>Math.max(Math.abs(b.row-8),Math.abs(b.col-3))<=p.infectRadius));
 if(kind==='change'){assert.equal(c.run.glitchChange.rows,p.rewriteRows);assert.equal(c.run.blocks.filter(b=>b.glitchRewriteUntil).length,p.rewriteRows*6);}
}
console.log('27 ultimate grades: charge consumption, immediate I/II, full III intro, real range/duration/count limits and unchanged maximum powers passed');
