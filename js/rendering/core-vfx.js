/* Shared, allocation-free hot paths for the nine core finishers. */
(() => {
  'use strict';
  const blends=new WeakMap(),WIDTH=440,HEIGHT=840,MARGIN=32;
  function visible(x,y,w,h,angle=0){
    if(!(w>0&&h>0)||!Number.isFinite(x+y))return false;
    const rx=angle?(w+h)*.5:w*.5,ry=angle?rx:h*.5;
    return x+rx>=-MARGIN&&x-rx<=WIDTH+MARGIN&&y+ry>=-MARGIN&&y-ry<=HEIGHT+MARGIN;
  }
  function stamp(c,image,x,y,w,h,alpha=1,angle=0){
    if(!image||alpha<=.002||image.complete===false||image.naturalWidth===0||!visible(x,y,w,h,angle))return;
    alpha=Math.min(1,alpha);
    if(angle){
      c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.drawImage(image,-w/2,-h/2,w,h);c.restore();
    }else{
      // Most glow/cloud/portal stamps need no transform or state-stack round trip.
      const previous=c.globalAlpha;c.globalAlpha=previous*alpha;c.drawImage(image,x-w/2,y-h/2,w,h);c.globalAlpha=previous;
    }
  }
  function blend(frames,target,time,count=frames.length,loop=true){
    const at=loop?((time%1)+1)%1*count:Math.max(0,Math.min(count-1,time));
    const i=Math.floor(at),f=at-i,j=loop?(i+1)%count:Math.min(i+1,count-1);
    let state=blends.get(target);
    if(!state){state={context:target.getContext('2d'),frames:null,i:-1,j:-1,f:-1};blends.set(target,state);}
    if(state.frames===frames&&state.i===i&&state.j===j&&state.f===f)return target;
    const x=state.context;x.clearRect(0,0,target.width,target.height);
    x.globalCompositeOperation='source-over';x.globalAlpha=1-f;x.drawImage(frames[i],0,0);
    if(f>0){x.globalCompositeOperation='lighter';x.globalAlpha=f;x.drawImage(frames[j],0,0);}
    state.frames=frames;state.i=i;state.j=j;state.f=f;return target;
  }
  const clock=e=>e.lowPower||e.reduced?Math.floor(e.elapsed/33.3333333333)*33.3333333333:e.elapsed;
  function onScreen(run){
    const sy=run.slime.y-run.cameraY,ground=run.coreArena?.surfaceY!=null?run.coreArena.surfaceY-run.cameraY:sy,r=run.coreEncounter?.rock;
    let top=Math.min(sy-600,ground-500),bottom=Math.max(sy+220,ground+500);
    if(r&&Number.isFinite(r.y)){top=Math.min(top,r.y-run.cameraY-r.size);bottom=Math.max(bottom,r.y-run.cameraY+r.size);}
    return top<=HEIGHT+MARGIN&&bottom>=-MARGIN;
  }
  function coreSurfaceY(run,x,depth=0){
    const a=run.coreArena,r=a.radius||418,dx=Math.max(-r+.01,Math.min(r-.01,x-a.x));
    return (a.centerY??a.surfaceY+r)-run.cameraY-Math.sqrt(r*r-dx*dx)+depth;
  }
  const api=Object.freeze({visible,stamp,blend,clock,onScreen,coreSurfaceY});
  if(typeof window!=='undefined')window.SlimeCoreVfx=api;
  if(typeof module!=='undefined')module.exports=api;
})();

