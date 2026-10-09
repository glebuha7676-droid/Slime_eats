const assert = require('node:assert/strict');
const pet = require('../js/rendering/menu-petpet.js');
const state = pet.create();
pet.press(state, 1000);
let mostCompressed=1, largestRebound=1, previous=pet.sample(state,1000);
const frames=new Set();
for (let now=1016;now<6000;now+=16) {
  if (now<2800 && now%112<16) {
    const before=state.pressure;
    pet.press(state,now); pet.release(state,now+10);
    assert.equal(state.pressure,before,'Frequent clicks must not rewind the visible pose');
  }
  if(now===1032)pet.release(state,now);
  const pose=pet.sample(state,now);
  frames.add(pose.frame);
  assert.ok(Number.isFinite(pose.scaleX)&&Number.isFinite(pose.scaleY));
  assert.ok(Math.abs(pose.scaleY-previous.scaleY)<.12,'The spring must remain continuous between frames');
  assert.ok(pose.scaleY>=.86&&pose.scaleY<=1.025,'The grip must keep the head close to the stationary upper fingers');
  mostCompressed=Math.min(mostCompressed,pose.scaleY); largestRebound=Math.max(largestRebound,pose.scaleY);
  previous=pose;
}
assert.ok(mostCompressed<.9,'A pet should visibly squeeze the slime');
assert.ok(largestRebound>1.006,'The slime should spring back, not just fade');
assert.deepEqual([...frames].sort(),[0,1],'Both generated gripping poses must be used');
assert.equal(state.active,false,'The glove must disappear after clicking stops');
const held=pet.create();pet.press(held,1000);
for(let now=1016;now<6000;now+=16)pet.sample(held,now);
assert.equal(held.active,true,'Holding should keep a bounded repeating rhythm');
pet.cancel(held);assert.equal(pet.sample(held,9000).scaleY,1);
assert.equal(held.active,false,'Feeding, blur and cancellation must immediately stop petting');
const reduced=pet.create({reducedMotion:true});pet.press(reduced,1000);
for(let now=1016;now<2200;now+=16)assert.ok(pet.sample(reduced,now).scaleY>.91);
// A throttled/background callback cannot inject several seconds into the spring.
assert.ok(pet.sample(reduced,90000).scaleY>.91);
// Whole opaque sprites share a wrist anchor and must never be cut into masks.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
class GloveImage { constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=512;} }
const drawing={window:{SlimeGameAssets:{versionedAsset:p=>p}},Image:GloveImage};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/rendering/menu-petpet.js'),'utf8'),drawing);
const draws=[],context={save(){},restore(){},translate(){},rotate(){},drawImage(...args){draws.push(args.slice(1));}};
const anchor={x:130,top:60,radius:70};
for(const frame of [0,1])drawing.window.MenuPetpet.drawHand(context,{opacity:1,pressure:frame,frame,shakeX:0,shakeY:0},anchor);
assert.equal(draws[0][0],0);assert.equal(draws[1][0],512,'Both complete generated poses are used');
assert.deepEqual(draws[0].slice(4),draws[1].slice(4),'Glove poses share a wrist anchor');
const shake=pet.create();pet.press(shake,1000);let peakShake=0;
for(let now=1016;now<2500;now+=16){const pose=pet.sample(shake,now);peakShake=Math.max(peakShake,Math.abs(pose.shakeX));assert.ok(Math.abs(pose.shakeX)<2.4&&Math.abs(pose.tilt)<.021);}
assert.ok(peakShake>1,'Slime reacts with a small rhythmic shake');
console.log('Petpet: continuous rapid taps, visible squash/rebound, held rhythm, cleanup and reduced motion passed');
