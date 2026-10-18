const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const start=source.indexOf('  function phantomActive('),end=source.indexOf('  const GLITCH_BUGS',start);
const constants=[...source.matchAll(/const (PHANTOM_\w+_MS) = (\d+);/g)].map(([,k,v])=>`const ${k}=${v};`).join('\n');
const take=name=>{const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);assert.ok(a>=0&&b>a,name);return source.slice(a,b)};
let stage=2,terrain=[],rewards=0;
const context={Math,performance:{now:()=>1000},window:{},VIEW_W:360,VIEW_H:780,
  ELEMENTAL_ULTIMATES:{shiftClock(){}},TECHNO_ULTIMATES:{shiftClock(){}},SPORE_COLOSSUS:{shiftClock(){}},COSMOS_ULTIMATES:{shiftClock(){}},
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),lerp:(a,b,t)=>a+(b-a)*t,
  elementalLevel:()=>stage,blockCenter:b=>({x:b.x+b.w/2,y:b.y+b.h/2}),
  elementalDamageable:b=>!!b&&!b.dead&&!b.hazard&&!b.unbreakable,
  blocksNearY:(y,r)=>terrain.filter(b=>b.y<y+r&&b.y+b.h>y-r),
  circleRectCollision:(c,b,r)=>Math.hypot(c.x-Math.max(b.x,Math.min(c.x,b.x+b.w)),c.y-Math.max(b.y,Math.min(c.y,b.y+b.h)))<r,
  chooseMaterial:()=> 'fragile',FLASK_VALUES:{1:1,2:3,3:5},fallSteeringVector:()=>({x:0,y:1}),speedDrillActive:()=>false,jellyZoneForSlime:()=>null,sound(){},feedback(){},shareGlitchHit(){},createDebris(){},
  destroyBlock(b,cause){if(b.dead||b.hazard&&cause!=='phantomExpress')return false;b.dead=true;b.hp=0;rewards+=b.flaskValue||0;context.run.phantomMarkedBlocks.delete(b);return true;},
  Image:function(){this.complete=true;this.naturalWidth=291;},versionedAsset:p=>p,
};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/rendering/phantom-effects.js'),'utf8'),context);
vm.runInContext(constants+source.slice(start,end)+take('damageBlockByElement')+take('nearbyGridBlocks'),context);
function fresh(level=2){
  stage=level;rewards=0;terrain=Array.from({length:22*6},(_,i)=>({row:Math.floor(i/6),col:i%6,x:i%6*60,y:Math.floor(i/6)*60,w:60,h:60,hp:3,maxHp:3,tier:'reinforced',dead:false}));
  const rows=new Map(Array.from({length:22},(_,r)=>[r,terrain.filter(b=>b.row===r)]));
  context.run={slime:{x:180,y:90,radius:23,vx:0,vy:100},worldId:1,world:{},cellSize:60,columns:6,rowCount:22,gridOffsetX:0,blockRowOrigin:0,portalY:1400,cameraY:0,
    blocksByRow:rows,phantomMarkNextAt:3500,phantomVolleyRemaining:0,phantomVolleyNextAt:0,phantomSpiritSequence:0,phantomPortalNextAt:10000,phantomFlights:[null,null],phantomSalvoFlights:[],phantomPortals:[],phantomMarkedBlocks:new Set(),phantomBursts:[],phantomUntil:0,
    steer:{touchY:0,touchRawY:.7},shake:0,damageInvulnerableUntil:0};return context.run;
}
const at=(r,c)=>terrain.find(b=>b.row===r&&b.col===c);
let run=fresh(1);at(3,2).tier='dense';at(3,2).hp=1;at(3,3).hazard=true;
context.updatePhantomCompanions(3499);assert(run.phantomFlights.every(f=>!f));
context.updatePhantomCompanions(3500);const first=run.phantomFlights[0];
assert.equal(first.targets.length,1);assert(first.emission);assert(first.targets.every(b=>b.hp>1&&!b.hazard));
assert.equal(run.phantomMarkNextAt,7000);assert.equal(run.phantomFlights[1],null);
const arrival=3500+first.duration, target=first.targets[0];target.flaskTier=3;target.flaskValue=5;
context.updatePhantomCompanions(arrival-1);assert(!target.phantomMarked);
context.updatePhantomCompanions(arrival);assert(target.phantomMarked);assert.equal(target.hp,1);assert.equal(target.maxHp,1);
assert.equal(target.flaskValue,5);assert.equal(target.phantomDetonateAt,arrival+1450);
assert(run.phantomFlights.every(f=>!f));context.updatePhantomCompanions(arrival+179);assert(run.phantomFlights.every(f=>!f));
context.updatePhantomCompanions(arrival+180);const second=run.phantomFlights[1];assert(second);assert.equal(run.phantomFlights[0],null);
assert.notEqual(second.targets[0],target);assert.notEqual(second.targets[0].col,target.col,'spirits aim in different directions');
context.updatePhantomCompanions(arrival+180+second.duration);assert.equal(run.phantomMarkedBlocks.size,2);
context.updatePhantomDetonations(arrival+1449);assert(!target.dead);
context.updatePhantomDetonations(arrival+1450);assert(target.dead);assert.equal(rewards,5);
context.updatePhantomDetonations(arrival+2000);assert.equal(rewards,5,'delayed reward is idempotent');
assert.equal(context.updatePhantomCycle(20000),false,'base never enters phasing automatically');assert.equal(run.phantomPortals.length,0);

run=fresh(1);run.ultimateProfile={kind:'phantomSalvo',spiritCount:8};
const beforeY=run.slime.y;context.startPhantomSalvo(1000);
assert.equal(run.phantomSalvoFlights.length,8);assert.equal(new Set(run.phantomSalvoFlights.map(f=>f.targets[0])).size,8);
assert(run.phantomSalvoFlights.every(f=>f.startedAt===1000),'all eight spirits launch together');
assert.equal(run.phantomUntil,0);assert.equal(run.slime.y,beforeY,'salvo never dashes or phases');
context.updatePhantomSalvo(1649);assert.equal(run.phantomMarkedBlocks.size,0);
context.updatePhantomSalvo(2100);assert.equal(run.phantomSalvoFlights.length,0);assert.equal(run.phantomMarkedBlocks.size,8);
assert([...run.phantomMarkedBlocks].every(b=>b.phantomMarkCause==='phantomSalvo'&&b.hp===3));
context.updatePhantomDetonations(4000);assert.equal(run.phantomMarkedBlocks.size,0);
run=fresh(1);for(const b of terrain)b.dead=true;context.startPhantomSalvo(1000);
assert.equal(run.phantomSalvoFlights.length,8,'empty space still shows the full visual salvo');
assert(run.phantomSalvoFlights.every(f=>f.targets.length===0));context.updatePhantomSalvo(2200);
assert.equal(run.phantomSalvoFlights.length,0);assert.equal(run.phantomMarkedBlocks.size,0);

// Exact cross: four orthogonal cells lose one HP, even if already marked.
run=fresh();const center=at(5,2),cross=[at(4,2),at(6,2),at(5,1),at(5,3)],diagonals=[at(4,1),at(4,3),at(6,1),at(6,3)];
context.markPhantomBlock(center,1000,true);context.markPhantomBlock(cross[0],1400,false);
context.updatePhantomDetonations(2450);assert(center.dead);
assert(cross.every(b=>b.hp===2),'cross deals exactly one including spectral-marked rock');assert(diagonals.every(b=>b.hp===3),'no diagonal damage');
context.updatePhantomDetonations(2450);assert(cross.every(b=>b.hp===2),'no duplicate blast next frame');
run=fresh();const guarded=at(5,3);guarded.hazard=guarded.unbreakable=true;guarded.hp=Infinity;
context.markPhantomBlock(at(5,2),1000,true);context.updatePhantomDetonations(2450);assert(!guarded.dead&&guarded.hp===Infinity);

run=fresh();run.ultimateProfile={kind:'phantomRealm'};context.startPhantomPhase(1000);
assert.equal(run.phantomUntil,6000);assert(context.updatePhantomCycle(5999));
context.markPhantomPath(180,90,150,510,1100);const phaseMarks=[...run.phantomMarkedBlocks];
assert(phaseMarks.length>0&&phaseMarks.every(b=>b.phantomMarkCause==='phantomRealm'));
run.slime.x=150;run.slime.y=510;context.updatePhantomCycle(6000);assert.equal(run.phantomUntil,0);
assert.equal(run.phantomPhase,null);assert(at(8,2).dead,'safe materialization frees the occupied cell');

run=fresh();run.phantomUntil=1100;run.slime.x=at(1,2).x+30;run.slime.y=at(1,2).y+30;at(1,2).hazard=at(1,2).unbreakable=true;
context.updatePhantomCycle(1100);assert.equal(at(1,2).dead,false,'phasing exit does not destroy spikes');
assert.notEqual(run.slime.x,150,'safe exit relocates out of a spike');

run=fresh(3);run.slime.x=350;run.slime.y=90;context.startPhantomExpress(1000);const express=run.phantomExpress;
assert.equal(express.startCol,2,'four-cell lane clamps to right wall');assert.equal(express.endRow-express.startRow+1,12);
const spike=at(4,3);spike.hazard=spike.unbreakable=true;spike.hp=Infinity;at(6,4).flaskValue=5;
context.updatePhantomExpress(1639);assert.equal(spike.dead,false,'opening portal does not delete everything instantly');
context.updatePhantomExpress(2200);assert.equal(spike.dead,true,'train destroys spikes as it advances');
context.updatePhantomExpress(3400);
const cleared=terrain.filter(b=>b.dead);assert.equal(cleared.length,48,'exactly four columns and twelve rows');
assert.ok(terrain.filter(b=>b.col<2).every(b=>!b.dead),'outside train corridor stays intact');
assert.equal(rewards,5,'vein credit awarded exactly once');context.updatePhantomExpress(3600);assert.equal(rewards,5);
context.updatePhantomExpress(3800);assert.equal(run.phantomExpress,null,'short animation fully cleans up');
assert.doesNotMatch(source.slice(start,end),/run\.blocks\.filter/,'bounded row queries only');
assert.match(take('resolveBlockHit'),/let damage = block.phantomMarked \? 2 : 1/);
assert.match(take('destroyBlock'),/cause !== 'phantomExpress'/,'real hazard guard permits express');
// Pause/resume shifts missions, portal lifetimes, phasing and train together.
run=fresh(3);run.hitCooldowns=new Map();run.blocks=terrain;
run.phantomEnteredAt=100;run.phantomUntil=3100;
run.phantomFlights[0]=context.phantomSpiritFlight(0,[at(4,2),at(4,3)],100,1200);
run.phantomPortals=[{createdAt:200,expiresAt:7200}];run.phantomBursts=[{startedAt:300}];
run.phantomExpress={startedAt:400};
run.phantomSalvoFlights=Array.from({length:8},()=>({startedAt:150}));
vm.runInContext(take('shiftRunClock'),context);context.shiftRunClock(6000);
assert.equal(run.phantomMarkNextAt,9500);assert.equal(run.phantomPortalNextAt,16000);
assert.equal(run.phantomUntil,9100);assert.equal(run.phantomFlights[0].startedAt,6100);
assert.equal(run.phantomPortals[0].expiresAt,13200);assert.equal(run.phantomExpress.startedAt,6400);
assert.equal(run.phantomBursts[0].startedAt,6300,'exit burst shifts only once');
assert(run.phantomSalvoFlights.every(f=>f.startedAt===6150),'pause shifts all eight spirits');
console.log('Phantom: sequential directional spirits, fragile timed marks/vein rewards, eight-spirit salvo/exact 1-damage cross, five-second realm, safe exit, unchanged 4x12 train and pause passed.');
