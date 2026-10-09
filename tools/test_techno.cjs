const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const take=name=>{const start=source.indexOf(`  function ${name}(`),end=source.indexOf('\n  function ',start+20);assert.ok(start>=0&&end>start,name);return source.slice(start,end)};
const constants=source.slice(source.indexOf('  const NANO_SHOT_INTERVAL_MS'),source.indexOf('  function mechSuitActive('));
let terrain=[],rewards=0,bursts=0;
const context={Math,performance:{now:()=>1000},window:{},VIEW_W:440,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),blockCenter:b=>({x:b.x+b.w/2,y:b.y+b.h/2}),
  elementalLevel:()=>context.run.categoryVisuals.nano,elementalDamageable:b=>!b.dead&&!b.hazard&&!b.unbreakable,
  blocksNearY:()=>terrain,nearbyGridBlocks:b=>terrain.filter(n=>n!==b&&Math.abs(n.row-b.row)+Math.abs(n.col-b.col)===1),
  updateShieldMines(){},sound(){},spawnSpecialBurst(){bursts++},
  damageBlockByElement(b,amount,cause){if(b.dead||(b.hazard||b.unbreakable)&&cause!=='mech')return;b.hp=b.hazard?0:b.hp-amount;if(b.hp<=0){b.dead=true;rewards+=b.flaskValue||0;}},
};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/rendering/techno-feedback.js'),'utf8'),context);
vm.runInContext(constants+['nanoDronePosition','nanoEyePosition','nanoMineTargets','queueNanoMines','updateNanoMines','updateNanoDrones','nanoRunEyeOpenness'].map(take).join('\n'),context);
function fresh(level=2){
  rewards=bursts=0;
  terrain=Array.from({length:18},(_,i)=>({id:i,row:2+Math.floor(i/6),col:i%6,x:i%6*60,y:220+Math.floor(i/6)*60,w:60,h:60,hp:5,maxHp:5,flaskValue:i===2?5:0}));
  context.run={categoryVisuals:{nano:level},slime:{x:180,y:130,radius:28},cellSize:60,
    nanoShots:[],nanoMines:[],nanoDisintegrations:[],nanoMineBlasts:[],nanoNextShotAt:[Infinity],nanoNextMineAt:1000,
    nanoEyeOpenedAt:0,nanoEyeOffset:{x:11,y:2},shake:0};
  Object.defineProperty(context.run,'blocks',{get(){throw Error('Techno must query nearby rows, not the whole mine')}});
  return context.run;
}
let run=fresh(1);const rich=terrain[2],hazard=terrain[3];hazard.hazard=true;hazard.hp=Infinity;
run.nanoShots=[{target:rich,startedAt:1000,hit:false}];
context.updateNanoDrones(1134);assert.equal(rich.hp,5,'laser has a short readable travel/tint');
context.updateNanoDrones(1135);assert.equal(rich.dead,true,'laser disintegrates a strong block in one hit');
assert.equal(rewards,5,'vein reward awarded once');assert.equal(run.nanoDisintegrations.length,1);
context.updateNanoDrones(1150);assert.equal(rewards,5);assert.equal(run.nanoDisintegrations.length,1);
run.nanoShots=[{target:hazard,startedAt:1000,hit:false}];context.updateNanoDrones(1155);assert.equal(hazard.dead,undefined,'ordinary drone does not destroy spikes');

run=fresh();context.updateNanoDrones(1000);
assert.equal(run.nanoMines.length,3);assert.equal(new Set(run.nanoMines.map(m=>m.target)).size,3);
assert.equal(new Set(run.nanoMines.map(m=>m.target.col)).size,3,'salvo targets distinct columns');
assert.deepEqual(Array.from(run.nanoMines,m=>m.launchedAt),[1420,1720,2020]);
assert.equal(run.nanoNextMineAt,10000,'nine-second cooldown');
context.updateNanoDrones(1419);assert.equal(run.nanoMines.filter(m=>m.launched).length,0);
run.slime.x+=25;run.slime.y+=12;
context.updateNanoDrones(1420);assert.equal(run.nanoMines.filter(m=>m.launched).length,1);
assert.equal(run.nanoMines[0].fromX,216);assert.equal(run.nanoMines[0].fromY,144,'launch follows the current eye, not the queued position');
context.updateNanoDrones(1720);assert.equal(run.nanoMines.filter(m=>m.launched).length,2);
const firstTarget=run.nanoMines[0].target;
context.updateNanoDrones(2020);assert.equal(bursts,1);assert.ok(firstTarget.hp<=3,'mine center hits harder');
assert.equal(run.nanoMines.filter(m=>m.launched).length,2);
context.updateNanoDrones(2320);context.updateNanoDrones(2620);
assert.equal(bursts,3);assert.equal(run.nanoMines.length,0);assert.equal(run.nanoMineBlasts.length,2);
context.updateNanoDrones(5000);assert.equal(run.nanoMines.length,0,'no extra batch before cooldown');

run=fresh();context.updateNanoDrones(1000);run.nanoMines[0].target.dead=true;
context.updateNanoDrones(1420);assert.equal(run.nanoMines[0].target.dead,undefined,'destroyed queued target is replaced safely');
run=fresh();context.updateNanoDrones(1000);context.updateNanoDrones(2400);
assert.equal(run.nanoMines.filter(m=>m.launched).length,1,'a stalled frame cannot launch all three mines at once');
context.updateNanoDrones(2699);assert.equal(run.nanoMines.filter(m=>m.launched).length,1);
context.updateNanoDrones(2700);assert.equal(run.nanoMines.filter(m=>m.launched).length,2);
run=fresh(1);run.nanoNextShotAt=[1000];context.updateNanoDrones(1000);
assert.equal(run.nanoShots.length,1);assert.equal(run.nanoShots[0].target.nanoLaserUntil,1135);
assert.equal(run.nanoShots[0].target.row,4,'turret prefers intact blocks farther ahead');
run=fresh(1);terrain.forEach(b=>b.hp=4);
const intact=terrain[8];intact.hp=5;
const marked=terrain[14];marked.hp=5;marked.phantomMarked=true;
run.nanoNextShotAt=[1000];context.updateNanoDrones(1000);
assert.equal(run.nanoShots[0].target,intact,'cracked and spectral-cracked blocks are excluded even when farther away');
run=fresh(1);terrain.forEach(b=>b.hp=4);run.nanoNextShotAt=[1000];context.updateNanoDrones(1000);
assert.equal(run.nanoShots.length,0,'no cracked-target fallback when there are no intact blocks');
const model=context.window.SlimeTechnoFeedback,mine={fromX:20,fromY:40,toX:200,toY:260,bend:70,side:1};
assert.equal(model.minePoint(mine,0).x,20);assert.equal(model.minePoint(mine,0).y,40);
assert.equal(model.minePoint(mine,1).x,200);assert.equal(model.minePoint(mine,1).y,260);
assert.ok(model.minePoint(mine,.15).y<40,'mine first exits upward in a visible arc');
assert.doesNotMatch(take('updateNanoDrones'),/run\.blocks\.filter/);
run=fresh(3);context.mechMuzzlePosition=side=>({x:run.slime.x+side*30,y:run.slime.y});
run.mechSuit={phase:'active',nextShotAt:1000};context.updateNanoDrones(1000);
const mechTargets=run.nanoShots.map(s=>s.target);assert.equal(mechTargets.length,2);
assert.ok(mechTargets.every(b=>b.nanoLaserUntil===1090),'mech beams prime the same red scan before impact');
context.updateNanoDrones(1089);assert.ok(mechTargets.every(b=>!b.dead),'beam travel remains readable');
context.updateNanoDrones(1090);assert.ok(mechTargets.every(b=>b.dead),'mech blasters disintegrate strong blocks in one hit');
assert.equal(run.nanoDisintegrations.length,2,'both blasters use the drone disintegration feedback');
const rewarded=rewards;context.updateNanoDrones(1100);
assert.equal(rewards,rewarded);assert.equal(run.nanoDisintegrations.length,2,'no duplicated death animation or vein credit');
const spike=terrain[5];spike.hazard=spike.unbreakable=true;spike.hp=Infinity;
run.nanoShots=[{target:spike,startedAt:1200,hit:false,mech:true}];context.updateNanoDrones(1290);
assert.equal(spike.dead,true,'mech blasters still destroy spikes');
assert.equal(run.nanoDisintegrations.length,3);
console.log('Techno: instant laser/rewards, safe spikes, three spaced targets, 300ms sequential eye launches, 9s cooldown, dead-target replacement, stronger blasts and curved flight passed.');
