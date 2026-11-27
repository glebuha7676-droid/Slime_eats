const assert = require('node:assert/strict');
const reveal = require('../js/rendering/menu-mutation-reveal.js');
const gradient = {addColorStop(){}};
function canvas() {
  const result = {width:520,height:520};
  result.getContext=()=>({canvas:result,drawImage(){},clearRect(){},fillRect(){},
    save(){},restore(){},translate(){},scale(){},beginPath(){},arc(){},fill(){},
    createRadialGradient:()=>gradient,createLinearGradient:()=>gradient});
  return result;
}
global.document={createElement:canvas};
const frame = progress => reveal.timing(progress * 1000, 1000);
assert.ok(frame(.08).height > .1, 'Takeoff starts immediately after swallowing');
assert.equal(frame(.34).height,1,'Height peaks at the apex');
assert.equal(frame(.34).light,1,'Light peaks with the jump');
assert.equal(frame(.34).white,1,'The glowing silhouette is fully white at the apex');
assert.ok(frame(.24).white > .35 && frame(.24).white < .6,'The silhouette brightens gradually during ascent');
assert.equal(frame(.415).white,1,'The silhouette holds while the slime hovers');
assert.ok(frame(.50).white > .4 && frame(.50).white < .65,'The new colors emerge gradually during descent');
assert.equal(frame(.59).white,0,'The silhouette clears while the slime is still in the air');
assert.ok(frame(.43).height > .97 && frame(.43).blend > 0, 'The form changes while the slime hovers');
assert.ok(frame(.62).height < frame(.48).height && frame(.62).blend < 1, 'Transformation continues into the descent');
assert.equal(frame(.78).height,0,'The slime meets the platform');
assert.equal(frame(.78).blend,1,'The form finishes transforming by touchdown');
assert.equal(frame(.78).light,0,'The glow fades by touchdown');
assert.ok(frame(.84).scaleY < 1 && frame(.945).scaleY > 1, 'Landing compression releases into a small rebound');
assert.deepEqual(frame(1),{progress:1,height:0,blend:1,light:0,white:0,scaleX:1,scaleY:1});
const reset = reveal.timing(170, 400, false, true);
assert.equal(reset.height, 0, 'Losing a form keeps the slime on the platform');
assert.equal(reset.white, 0, 'Losing a form does not trigger the transformation flash');
assert.ok(reset.blend > 0 && reset.blend < 1 && reset.scaleY < 1, 'The form fades as the slime softly compresses');
const target=canvas().getContext('2d');
function playFrames(animation, end) {
  for (let at = animation.lastFrameAt + 16; at < end; at += 16) reveal.draw(target, animation, at);
  reveal.draw(target, animation, end);
}
const animation=reveal.create(target.canvas,{now:0,ultra:true,reducedMotion:false});
animation.assetsReady=false;
playFrames(animation,1600);
assert.equal(animation.finished,false,'A slow image must not reveal an incomplete form');
assert.equal(reveal.needsCurrent(animation,1601),false);
assert.ok(reveal.timing(1601-animation.startedAt,animation.duration).height > .99,'Loading holds at the apex');
animation.assetsReady=true;
playFrames(animation,animation.startedAt+animation.duration+.01);
assert.equal(animation.finished,true,'Loading must release the transformation');
const reduced=reveal.create(target.canvas,{now:0,ultra:true,reducedMotion:true});
assert.equal(reduced.duration,160);
playFrames(reduced,160);assert.equal(reduced.finished,true);
const quick=reveal.create(target.canvas,{now:0,quick:true,ultra:false,reducedMotion:false});
assert.ok(quick.duration < animation.duration);
quick.assetsReady=false;
reveal.draw(target,quick,500);
assert.ok(500-quick.startedAt<=40,'A delayed frame cannot skip takeoff');
assert.equal(reveal.needsCurrent(quick,500),false);
quick.assetsReady=true;
playFrames(quick,quick.startedAt+quick.duration+.01);assert.equal(quick.finished,true);
const taintedDocument=global.document;global.document={createElement(){const c=canvas(),original=c.getContext;c.getContext=()=>({...original(),getImageData(){throw new Error('SecurityError');}});return c;}};
assert.doesNotThrow(()=>reveal.create(canvas(),{now:0,ultra:true,reducedMotion:false}),'file:// must not read pixels');
global.document=taintedDocument;
const stalled=reveal.create(canvas(),{now:0,ultra:true,reducedMotion:false});stalled.assetsReady=false;playFrames(stalled,3000);assert.ok(stalled.finished,'A missing asset must not hold controls forever');
console.log('Menu reveal: immediate takeoff, apex glow and hover, transformation by touchdown, soft rebound, asset wait and reduced motion passed.');
