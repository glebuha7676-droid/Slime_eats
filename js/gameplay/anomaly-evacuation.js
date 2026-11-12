/* Shared loss-of-power / rescue sequence. All time is owned by the paused run clock. */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const TIMES=Object.freeze({release:340,open:400,pull:800,close:220});
  const TOTAL=Object.values(TIMES).reduce((sum,n)=>sum+n,0);
  const PORTAL='assets/ui/portal-window-v2/laboratory-return.webp';
  let flash;
  function preload(){if(typeof window!=='undefined')window.SlimePortalWindow?.preload('lab');}
  function floorAt(run,x,y,r){
    let floor=Infinity;
    for(const b of run.blocks||[]){
      if(b.dead||b.y<y+r*.12||b.x>x+r*.74||b.x+b.w<x-r*.74)continue;
      floor=Math.min(floor,b.y-r*.92);
    }
    if(run.coreEncounter?.hit)floor=Math.min(floor,run.coreArena.surfaceY-r*.95);
    return floor;
  }
  function begin(run,{completed=false,reason='',reduced=false,width=440,height=840,hudBottom=92,timestamp=0}={}){
    if(run.evacuation)return run.evacuation;
    preload();const s=run.slime,r=run.baseSlimeRadius||s.radius;
    const screenY=s.y-run.cameraY;
    const cameraTarget=completed?run.cameraY:Math.max(0,s.y-clamp(screenY,185,550));
    const floor=floorAt(run,s.x,s.y,r),gap=r*.45+8;
    const ballistic=completed&&run.coreEncounter?.cosmos;
    const targetY=completed?clamp(ballistic?s.y+clamp(s.vy*.24,-30,34):s.y-65,cameraTarget+195,cameraTarget+height-180):Math.max(s.y-r,Math.min(s.y+45,floor-gap));
    run.evacuation={phase:'release',elapsed:0,phaseTime:0,completed,reason,reduced,width,height,hudBottom,worldTime:timestamp,
      startCamera:run.cameraY,cameraTarget,startRadius:s.radius,radius:r,
      startX:s.x,startY:s.y,targetX:clamp(s.x+clamp(s.vx*(ballistic ? .32 : .12),ballistic?-26:-10,ballistic?26:10),r+5,width-r-5),targetY,
      vx:clamp(s.vx,-160,160),vy:completed?clamp(s.vy,-150,90):clamp(s.vy,-90,330),
      floor,neutral:0,flash:0,portalScale:0,portalAlpha:0,
      scale:1,scaleX:1,scaleY:1,alpha:1,rotation:0,captionY:completed?168+(run.coreEncounter?.hudOffset||0):screenY<240?height-145:Math.max(108,hudBottom+15),finished:false};
    const e=run.evacuation;e.side=s.x<width/2?1:-1;
    e.portalX=clamp(e.targetX+e.side*125,76,width-76);
    e.portalY=clamp(targetY-20,cameraTarget+Math.max(190,hudBottom+90),cameraTarget+height-150);
    if(typeof document!=='undefined')textures();
    s.radius=r;return e;
  }
  function phase(e,name){e.phase=name;e.phaseTime=0;}
  function drift(run,e,dt){
    const s=run.slime,duration=TIMES.release+TIMES.open,t=clamp(e.elapsed/duration);
    const along=(a,b,v)=>{
      const d=b-a,m=d>=0?clamp(v*duration/1000,0,3*d):clamp(v*duration/1000,3*d,0);
      return (2*t*t*t-3*t*t+1)*a+(t*t*t-2*t*t+t)*m+(-2*t*t*t+3*t*t)*b;
    };
    const oldX=s.x,oldY=s.y;
    s.x=along(e.startX,e.targetX,e.vx);s.y=along(e.startY,e.targetY,e.vy);
    s.vx=dt?(s.x-oldX)/dt:0;s.vy=dt?(s.y-oldY)/dt:0;
    e.suspended=t>.7;
  }
  function update(run,dt,hooks={}){
    const e=run.evacuation;if(!e||e.finished)return;
    dt=clamp(dt,0,.05);e.elapsed+=dt*1000;e.phaseTime+=dt*1000;
    e.worldTime+=dt*1000*mix(1,.16,smooth(e.elapsed/450));
    const s=run.slime;run.shake=Math.max(0,(run.shake||0)-dt*28);s.wobble=(s.wobble||0)+dt*2;
    run.cameraY=mix(e.startCamera,e.cameraTarget,smooth(e.elapsed/700));
    e.neutral=smooth((e.elapsed-130)/140);
    e.flash=Math.pow(Math.sin(clamp((e.elapsed-105)/240)*Math.PI),2)*(e.reduced?.3:.78);
    if(e.phase==='release'||e.phase==='open'){
      e.alpha=e.reduced||e.elapsed>=320?1:1-.20*Math.pow(Math.sin(e.elapsed/170*Math.PI),2);
      e.portalScale=smooth((e.elapsed-180)/(TIMES.release+TIMES.open-180));e.portalAlpha=smooth((e.elapsed-180)/160);
      if(e.elapsed>=180&&!e.portalStarted){e.portalStarted=true;hooks.portal?.();}
      const recoil=e.reduced?0:Math.sin(clamp(e.elapsed/400)*Math.PI)*.05;
      e.scaleX=1+recoil;e.scaleY=1-recoil*.6;
    }
    if(e.phase==='release'){
      drift(run,e,dt);
      if(e.phaseTime>=TIMES.release){
        phase(e,'open');
      }
    }else if(e.phase==='open'){
      drift(run,e,dt);
      e.rotation=e.reduced?0:e.side*.045*smooth(e.phaseTime/TIMES.open)+Math.sin(e.elapsed/130)*.018;
      if(e.phaseTime>=TIMES.open){e.pullX=s.x;e.pullY=s.y;phase(e,'pull');hooks.pull?.();}
    }else if(e.phase==='pull'){
      const p=clamp(e.phaseTime/TIMES.pull),t=p**1.8,n=1-t;
      const c1x=e.pullX-e.side*12,c1y=e.pullY-32;
      const c2x=e.portalX-e.side*35,c2y=e.portalY+24;
      s.x=n*n*n*e.pullX+3*n*n*t*c1x+3*n*t*t*c2x+t*t*t*e.portalX;
      s.y=n*n*n*e.pullY+3*n*n*t*c1y+3*n*t*t*c2y+t*t*t*e.portalY;
      e.scale=1-smooth((p-.18)/.82);e.alpha=1-smooth((p-.88)/.12);
      e.rotation=e.reduced?0:e.side*(Math.sin(p*Math.PI)*.14+p*p*.75);
      const stretch=e.reduced?0:Math.sin(p*Math.PI)*.27;
      e.scaleX=1+stretch;e.scaleY=1-stretch*.45;
      s.vx=0;s.vy=0;
      if(p===1){e.scale=0;e.alpha=0;phase(e,'close');}
    }else if(e.phase==='close'){
      const p=smooth(e.phaseTime/TIMES.close);e.portalScale=1-p;e.portalAlpha=1-p;
      if(e.phaseTime>=TIMES.close){e.finished=true;phase(e,'done');if(run.coreEncounter)run.coreEncounter.phase='done';hooks.complete?.(e);}
    }
  }
  function texture(size,stops){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [at,color]of stops)g.addColorStop(at,color);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function textures(){
    if(flash)return;
    flash=texture(192,[[0,'#ffffff'],[.2,'#f3fffbee'],[.48,'#cefff1b0'],[.75,'#b2f9df30'],[1,'#a8eed300']]);
  }
  function drawPortal(ctx,run){
    const e=run.evacuation;if(!e||e.portalScale<=0||e.finished)return;
    if(!e.reduced){
      textures();ctx.save();ctx.globalCompositeOperation='lighter';
      const amount=e.phase==='pull'?1:e.portalScale;
      for(let i=0;i<8;i++){
        const q=(e.elapsed/(650+i%3*90)+i*.217)%1,a=i*2.399,range=(1-q)*(70+e.portalScale*45);
        const x=e.portalX+Math.cos(a)*range,y=e.portalY-run.cameraY+Math.sin(a)*range*.75,size=5+q*7;
        ctx.globalAlpha=Math.sin(q*Math.PI)*amount*.6;ctx.drawImage(flash,x-size/2,y-size/2,size,size);
      }ctx.restore();
    }
    window.SlimePortalWindow.draw(ctx,{x:e.portalX,y:e.portalY-run.cameraY,
      width:150,height:150,open:e.portalScale,alpha:e.portalAlpha,timestamp:e.elapsed,
      scene:'lab',reduced:e.reduced,power:e.phase==='pull'?.65:.15,layer:'back'});
  }
  function drawPortalFront(ctx,run){
    const e=run.evacuation;if(!e||e.portalScale<=0||e.finished)return;
    const options={x:e.portalX,y:e.portalY-run.cameraY,width:150,height:150,open:e.portalScale,
      alpha:e.portalAlpha,timestamp:e.elapsed,scene:'lab',reduced:e.reduced,power:e.phase==='pull'?.65:.15};
    if(e.phase==='pull')window.SlimePortalWindow.draw(ctx,{...options,layer:'back',alpha:e.portalAlpha*smooth((e.phaseTime/TIMES.pull-.58)/.26)});
    window.SlimePortalWindow.draw(ctx,{...options,layer:'front'});
  }
  function drawFlash(ctx,run){
    const e=run.evacuation;if(!e||e.flash<=.001)return;textures();
    const s=run.slime,size=s.radius*(3.5+e.flash*1.1),x=s.x,y=s.y-run.cameraY;
    ctx.save();ctx.globalAlpha=e.flash;ctx.drawImage(flash,x-size/2,y-size/2,size,size);ctx.restore();
  }
  const api=Object.freeze({TIMES,PORTAL,preload,begin,update,drawPortal,drawPortalFront,drawFlash});
  if(typeof window!=='undefined')window.SlimeEvacuation=api;
  if(typeof module!=='undefined')module.exports=api;
})();
