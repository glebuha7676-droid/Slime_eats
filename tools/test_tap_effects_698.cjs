const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const context={window:{SlimeGameAssets:{versionedAsset:x=>x},matchMedia:()=>({matches:false})},Image:class{constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=512}}};
vm.runInNewContext(fs.readFileSync('js/rendering/menu-petpet.js','utf8'),context);
vm.runInNewContext(fs.readFileSync('js/rendering/slime-emotions.js','utf8'),context);
const api=context.window.SlimeTapEmotions,state=api.create();let draws=[],moves=[],rotations=[],depth=0;
const ctx={save(){depth++},restore(){depth--},drawImage(...args){draws.push(args)},translate(...args){moves.push(args)},rotate(v){rotations.push(v)},scale(){},globalAlpha:1};
function frame(t){draws=[];moves=[];rotations=[];const pose=api.sample(state,t);api.draw(ctx,state,{x:130,y:125,radius:70,now:t});assert.equal(depth,0);return {pose,draws:[...draws],moves:[...moves],rotations:[...rotations]}}
api.trigger(state,'love',1000);const first=frame(1300),second=frame(1800);
assert.equal(first.draws.length,1);assert.equal(second.draws.length,1);assert(second.moves[0][1]<first.moves[0][1]);assert.notEqual(first.rotations[0],second.rotations[0]);assert.notEqual(first.moves[0][0],second.moves[0][0]);assert.equal(frame(2800).draws.length,0);
api.trigger(state,'love',3000);api.trigger(state,'love',3100);assert.equal(frame(3300).draws.length,2,'One heart per actual click, not a burst');api.clear(state);
api.trigger(state,'laugh',4000);state.clicks[0].angle=0;assert(Math.abs(frame(4120).pose.scaleX-1)>.07,'Jelly responds clearly');assert.equal(frame(4350).draws.length,0,'Fast poke ends in 340 ms');
const angles=new Set();for(let i=0;i<30;i++){api.trigger(state,'laugh',5000+i*10);angles.add(state.clicks.at(-1).angle)}assert(angles.size>20);assert(state.clicks.length<=10);
api.clear(state);api.trigger(state,'petpet',6000);let petSeen=false;for(let t=6000;t<9000;t+=16){const f=frame(t);if(f.draws.length)petSeen=true}assert(petSeen);assert.equal(state.pet.active,false);api.clear(state);assert.equal(state.clicks.length,0);assert.equal(state.pet.active,false);
console.log('One heart per click; rising/sway/rotation; expiry; fast random poke; strong jelly recoil; old petpet playback and cleanup; balanced canvas transforms passed.');
