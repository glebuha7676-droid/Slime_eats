const assert = require('node:assert/strict');
const reveal = require('../js/rendering/menu-mutation-reveal.js');
const gradient = {addColorStop(){}};
function canvas() {
  const result = {width:520,height:520};
  result.getContext=()=>({canvas:result,drawImage(){},clearRect(){},fillRect(){},
    save(){},restore(){},translate(){},scale(){},createRadialGradient:()=>gradient});
  return result;
}
global.document={createElement:canvas};
assert.equal(reveal.timing(1200,2600,true).blend,0,'The form must remain concealed before the flash');
assert.ok(reveal.timing(1560,2600,true).flash>.99,'The reveal needs one clear flash');
assert.equal(reveal.timing(2200,2600,true).flash,0,'Do not strobe after the reveal');
assert.ok(reveal.timing(190,380,false).blend>.4,'Ordinary meals should stay quick');
const target=canvas().getContext('2d');
const animation=reveal.create(target.canvas,{now:0,ultra:true,reducedMotion:false});
animation.assetsReady=false;
reveal.needsCurrent(animation,1000);reveal.draw(target,animation,1000);
reveal.needsCurrent(animation,5000);reveal.draw(target,animation,5000);
assert.equal(animation.finished,false,'A slow image must not reveal an incomplete form');
assert.equal(reveal.needsCurrent(animation,5001),false);
animation.assetsReady=true;
reveal.draw(target,animation,animation.startedAt+animation.duration);
assert.equal(animation.finished,true,'Loading must release the transformation');
const reduced=reveal.create(target.canvas,{now:0,ultra:true,reducedMotion:true});
assert.equal(reduced.duration,160);
reveal.draw(target,reduced,160);assert.equal(reduced.finished,true);
const taintedDocument=global.document;global.document={createElement(){const c=canvas(),original=c.getContext;c.getContext=()=>({...original(),getImageData(){throw new Error('SecurityError');}});return c;}};
assert.doesNotThrow(()=>reveal.create(canvas(),{now:0,ultra:true,reducedMotion:false}),'file:// must not read pixels');
global.document=taintedDocument;
const stalled=reveal.create(canvas(),{now:0,ultra:true,reducedMotion:false});stalled.assetsReady=false;reveal.draw(target,stalled,9000);reveal.draw(target,stalled,12000);assert.ok(stalled.finished,'A missing asset must not hold controls forever');
console.log('Menu reveal: anticipation, one flash, image wait and reduced motion passed.');
