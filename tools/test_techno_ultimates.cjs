const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const context={window:{SlimeGameAssets:{projectSprite:()=>({})}}};
for(const file of ['js/config/ultimate-stages.js','js/abilities/techno-ultimates.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),context);
const U=context.window.SlimeUltimateStages,T=context.window.SlimeTechnoUltimates;
let r,hits,disintegrated;
const services={
 blocksNearY:(y,radius)=>r.blocks.filter(b=>Math.abs(b.y+b.h/2-y)<=radius+60),
 elementalDamageable:b=>!!b&&!b.dead&&!b.hazard&&!b.unbreakable,
 nanoEyePosition:()=>({x:r.slime.x+8,y:r.slime.y+1}),sound(){},
 damageBlockByElement:(b,n,cause)=>{b.hp-=n;if(b.hp<=0)b.dead=true;hits.push({b,n,cause})},
 disintegrate:(b,at)=>{if(!b||b.dead||b.hazard||b.unbreakable||b.special)return false;b.dead=true;b.hp=0;disintegrated.push({b,at});return true;}
};
function fresh(stage){hits=[];disintegrated=[];r={ultimateProfile:U.get('nano',stage),cellSize:60,columns:6,gridOffsetX:0,blockRowOrigin:0,slime:{x:210,y:150},nanoShots:[],blocks:[],cameraY:0};
 for(let row=0;row<24;row++)for(let col=0;col<6;col++)r.blocks.push({row,col,x:col*60,y:row*60,w:60,h:60,hp:5,maxHp:5,flaskTier:3,flaskValue:5});
 T.start(r,'nano',1000,210,150,services);return r.technoUltimate;
}
let e=fresh(1);assert.equal(e.mines.length,5);assert.equal(new Set(e.mines.map(m=>m.target)).size,5);assert(new Set(e.mines.map(m=>m.target.col)).size>=4);
assert(e.mines.every(m=>m.toY>r.slime.y));assert(e.mines.every(m=>!m.launched));
for(let at=1000;at<=2450;at+=16)T.update(r,at,services);
assert.equal(e.mines.length,0);assert(hits.length>5);assert(hits.every(h=>h.cause==='nanoUltimate'));assert(hits.every(h=>h.b.flaskValue===5));
// A mined target disappearing before launch does not duplicate another reservation.
e=fresh(1);e.mines[0].target.dead=true;T.update(r,1120,services);assert(e.mines[0].launched);assert(!e.mines[0].target.dead);assert.equal(new Set(e.mines.map(m=>m.target)).size,5);
// Empty tail of a mine still emits five projectiles without inventing blocks.
e=fresh(1);r.blocks=[];r.technoUltimate=null;T.start(r,'nano',1000,210,150,services);assert.equal(r.technoUltimate.mines.length,5);for(let at=1000;at<=2990;at+=16)T.update(r,at,services);assert.equal(hits.length,0);
e=fresh(2);assert.equal(e.phase,'descending');assert(e.y>r.slime.y+60);assert.equal(e.activeUntil-e.landAt,5000);
const landing=e.landingTarget;T.update(r,1699,services);assert.equal(landing.dead,undefined,'Landing cannot break early');
T.update(r,1700,services);assert.equal(e.phase,'active');assert.equal(landing.nanoLaserUntil,1785);assert.equal(disintegrated.length,0,'Landing tint is visible before dissolve');
T.update(r,1785,services);assert(landing.dead,'Block below turret dissolves');
const initial=disintegrated.length;let previousShots=0,previousShotAt=0,maxBullets=0,maxTurn=0,prevAngle=e.angle;
for(let at=1801;at<=6793;at+=16){
 T.update(r,at,services);maxBullets=Math.max(maxBullets,e.bullets.length);maxTurn=Math.max(maxTurn,Math.abs(e.angle-prevAngle));prevAngle=e.angle;
 if(e.shotsFired>previousShots){
  if(previousShotAt)assert(at-previousShotAt>=200,'Cadence never becomes a catch-up barrage');
  previousShotAt=at;previousShots=e.shotsFired;
  const b=e.bullets.at(-1),m=T.muzzle(e,60);
  assert(Math.abs(m.x-b.fromX)<1e-8&&Math.abs(m.y-b.fromY)<1e-8,'Shot starts at the rotated muzzle');
  assert(b.toY>b.fromY,'Projectiles go down');assert(!b.target.dead,'No immediate hits at launch');assert.equal(b.target.nanoLaserUntil,b.startedAt+b.travelMs);
  assert.equal(new Set(e.bullets.map(b=>b.target)).size,e.bullets.length);
 }
}
assert(e.shotsFired>=16&&e.shotsFired<=25,`Rapid but bounded five-second firing: ${e.shotsFired}`);
assert(maxBullets<=2);assert(maxTurn<.14,'Head turns smoothly at bounded angular speed');assert(disintegrated.length>initial+12);assert.equal(e.phase,'exiting');
assert(disintegrated.every(({b})=>b.flaskTier===3&&b.flaskValue===5));
const total=e.shotsFired;T.update(r,7000,services);assert.equal(e.shotsFired,total,'No firing beyond active five seconds');T.update(r,7201,services);assert.equal(r.technoUltimate,null);
// Partial blocks and hazards never become gun targets.
e=fresh(2);for(const b of r.blocks){if(b.col===0)b.hazard=true;if(b.col===1)b.hp=2;}
for(let at=1000;at<=4300;at+=16){T.update(r,at,services);assert(e.bullets.every(b=>!b.target.hazard&&b.target.hp===b.target.maxHp));}
// Pause includes incoming bullets, red target tint and the remaining firing window.
e=fresh(2);for(let at=1000;at<=2050;at+=16)T.update(r,at,services);
const at=e.lastAt,angle=e.angle,shots=e.shotsFired,end=e.activeUntil,bullet=e.bullets[0],tint=bullet?.target.nanoLaserUntil;
T.shiftClock(r,10000);assert.equal(e.activeUntil,end+10000);T.update(r,at+10000,services);assert.equal(e.angle,angle);assert.equal(e.shotsFired,shots);if(bullet)assert.equal(bullet.target.nanoLaserUntil,tint+10000);
e=fresh(3);assert.equal(e,undefined);assert.equal(U.get('nano',3).mechMs,10000);assert.equal(U.get('nano',3).name,'Титан');
for(let stage=1;stage<=3;stage++)assert.equal(U.get('nano',stage).description,undefined);
console.log('Techno: five distinct mines, retargeting, landing/block dissolve, 5-second cadence, smooth aiming, exact muzzle, delayed hits, bounded bullets, preserved veins, pause and Titan passed');
