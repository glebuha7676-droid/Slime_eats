const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8');
const start=source.indexOf('  function phantomActive('),end=source.indexOf('  const GLITCH_BUGS',start);
const constants=[...source.matchAll(/const (PHANTOM_\w+_MS) = (\d+);/g)].map(([,k,v])=>`const ${k}=${v};`).join('\n');
const take=name=>{const a=source.indexOf(`  function ${name}(`),b=source.indexOf('\n  function ',a+20);assert.ok(a>=0&&b>a,name);return source.slice(a,b)};
let stage=2,terrain=[],rewards=0;
const context={Math,performance:{now:()=>1000},window:{},VIEW_W:360,VIEW_H:780,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),lerp:(a,b,t)=>a+(b-a)*t,
  elementalLevel:()=>stage,blockCenter:b=>({x:b.x+b.w/2,y:b.y+b.h/2}),
  elementalDamageable:b=>!!b&&!b.dead&&!b.hazard&&!b.unbreakable,
  blocksNearY:(y,r)=>terrain.filter(b=>b.y<y+r&&b.y+b.h>y-r),
  circleRectCollision:(c,b,r)=>Math.hypot(c.x-Math.max(b.x,Math.min(c.x,b.x+b.w)),c.y-Math.max(b.y,Math.min(c.y,b.y+b.h)))<r,
  speedDrillActive:()=>false,jellyZoneForSlime:()=>null,sound(){},feedback(){},shareGlitchHit(){},createDebris(){},
  destroyBlock(b,cause){if(b.dead||b.hazard&&cause!=='phantomExpress')return false;b.dead=true;b.hp=0;rewards+=b.flaskValue||0;context.run.phantomMarkedBlocks.delete(b);return true;},
  Image:function(){this.complete=true;this.naturalWidth=291;},versionedAsset:p=>p,
};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/rendering/phantom-effects.js'),'utf8'),context);
vm.runInContext(constants+source.slice(start,end)+take('damageBlockByElement'),context);
function fresh(level=2){
  stage=level;rewards=0;terrain=Array.from({length:22*6},(_,i)=>({row:Math.floor(i/6),col:i%6,x:i%6*60,y:Math.floor(i/6)*60,w:60,h:60,hp:3,maxHp:3,tier:'reinforced',dead:false}));
  const rows=new Map(Array.from({length:22},(_,r)=>[r,terrain.filter(b=>b.row===r)]));
  context.run={slime:{x:180,y:90,radius:23,vx:0,vy:100},cellSize:60,columns:6,rowCount:22,gridOffsetX:0,blockRowOrigin:0,portalY:1400,cameraY:0,
    blocksByRow:rows,phantomMarkNextAt:5000,phantomPortalNextAt:10000,phantomFlights:[null,null],phantomPortals:[],phantomMarkedBlocks:new Set(),phantomBursts:[],phantomUntil:0,
    steer:{touchY:0,touchRawY:.7},shake:0,damageInvulnerableUntil:0};return context.run;
}
const at=(r,c)=>terrain.find(b=>b.row===r&&b.col===c);
let run=fresh(1);at(3,2).tier='dense';at(3,2).hp=1;at(3,3).hazard=true;
context.updatePhantomCompanions(4999);assert.equal(run.phantomFlights[0],null);
context.updatePhantomCompanions(5000);const targets=run.phantomFlights[0].targets;
assert.ok(targets.length>=2&&targets.length<=4);assert.ok(targets.every(b=>b.hp>1&&!b.hazard));
assert.equal(run.phantomMarkNextAt,10000);
const markDone=5000+run.phantomFlights[0].duration;
assert.ok(markDone>=6800,'gentle departure and return take at least 1.8 seconds');
context.updatePhantomCompanions(markDone);assert.equal(run.phantomMarkedBlocks.size,targets.length);
assert.equal(run.phantomFlights[0],null);assert.equal(run.phantomFlights[1],null,'stage I has only marking spirit');
const target=targets[0];context.damageBlockByElement(target,1,'impact',6300);assert.equal(target.hp,1,'a normal hit on spectral cracks deals two damage');
context.damageBlockByElement(target,1,'impact',6400);assert.equal(target.dead,true);assert.equal(run.phantomMarkedBlocks.has(target),false);
assert.equal(context.updatePhantomCycle(20000),false,'stage I never turns intangible on a timer');

run=fresh();context.updatePhantomCompanions(10000);assert.ok(run.phantomFlights[1]);
assert.ok(run.phantomFlights[1].targets.every(b=>b.y-run.slime.y>run.cellSize*5&&b.y-run.slime.y<run.cellSize*8),'portal spirit chooses a rock five to eight rows ahead');
assert.equal(run.phantomFlights[0],null,'portal and marking spirits never set off together');
const arrival=10000+run.phantomFlights[1].duration/2;
context.updatePhantomCompanions(arrival-1);assert.equal(run.phantomPortals.length,0,'portal opens only on arrival at the route end');
context.updatePhantomCompanions(arrival+1);const portal=run.phantomPortals[0];assert.ok(portal);assert.ok(run.phantomFlights[1].targets[0].dead);
assert.equal(run.phantomFlights[0],null,'marking spirit waits while portal spirit returns');
context.updatePhantomCompanions(10000+run.phantomFlights[1].duration+1);
assert.equal(run.phantomFlights[1],null);context.updatePhantomCompanions(14000);
assert.ok(run.phantomFlights[0],'marking spirit sets off separately after return');
assert.equal(run.phantomPortalNextAt,20000);assert.equal(context.updatePhantomCycle(14000),false,'only touching the portal starts phasing');
run.slime.x=portal.x;run.slime.y=portal.y;assert.equal(context.updatePhantomCycle(14000),true);
assert.equal(portal.used,true);assert.equal(run.phantomUntil,17000);assert.equal(run.steer.touchY,.7);
assert.equal(context.updatePhantomCycle(16999),true);
run.slime.x=150;run.slime.y=510;const inside=at(8,2);
assert.equal(context.updatePhantomCycle(17000),false);assert.equal(inside.dead,true,'materialization destroys the occupied rock');
assert.equal(run.phantomBursts.length,1);assert.ok(at(9,2).phantomMarked,'exit weakens blocks ahead');
assert.equal(at(9,2).hp,3,'exit vulnerability does not damage every old mark');
context.updatePhantomCycle(17001);assert.equal(run.phantomBursts.length,1,'no repeated exit explosion');
context.updatePhantomCompanions(19000);assert.equal(run.phantomPortals.length,0,'used and expired portals cleaned up');

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
vm.runInContext(take('shiftRunClock'),context);context.shiftRunClock(6000);
assert.equal(run.phantomMarkNextAt,11000);assert.equal(run.phantomPortalNextAt,16000);
assert.equal(run.phantomUntil,9100);assert.equal(run.phantomFlights[0].startedAt,6100);
assert.equal(run.phantomPortals[0].expiresAt,13200);assert.equal(run.phantomExpress.startedAt,6400);
assert.equal(run.phantomBursts[0].startedAt,6300,'exit burst shifts only once');
console.log('Phantom: dense clusters/2–4 marks/5s, vulnerability 2 damage, portal-only phasing/10s/3s, safe materialization, progressive 4×12 train/spikes/veins and cleanup passed.');
