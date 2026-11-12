/* A contracting sphere of spectral comets; no portal or illustrated ghost sprites. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx,SOUL=window.SlimePhantomSoulVfx,TAU=Math.PI*2,orbits=[];
  let halo,hot,vignette,owner,clockAt=-1,orbitX,orbitY,orbitCount;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function radial(size,stops){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [p,color]of stops)g.addColorStop(p,color);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function prepare(){
    if(halo)return;SOUL.prepare();
    halo=radial(128,[[0,'#eaffffae'],[.25,'#b9ebe68a'],[.58,'#8eb8e23c'],[1,'#9da1ef00']]);
    hot=radial(128,[[0,'#fff'],[.13,'#fbffffe8'],[.36,'#d7f4ffa8'],[.64,'#b3bcf141'],[1,'#929ee500']]);
    vignette=radial(128,[[0,'#0a182800'],[.45,'#0a182800'],[1,'#221b3ad8']]);
    for(let i=0;i<50;i++)orbits.push({point:{},far:{},old:{},mid:{}});

  }
  function swarm(c,run,front){
    const e=run.coreEncounter;if(!['approach','overdrive','armed','release'].includes(e.phase))return;
    const s=run.slime,low=e.lowPower||e.reduced,wave=window.SlimePhantomCoreWave,n=wave.count((e.finisher?100+50*(e.overdrive||0):e.strikeEnergy)),count=low?Math.min(14,n):n,clock=VFX.clock(e);
    if(owner!==e||clockAt!==clock||orbitX!==s.x||orbitY!==s.y||orbitCount!==count){
      for(let i=0;i<count;i++){const index=low?Math.floor(i*n/count):i,slot=orbits[i];wave.orbit(run,index,clock,slot.point);if(!low)wave.orbit(run,index,clock-230,slot.far);wave.orbit(run,index,clock-150,slot.old);wave.orbit(run,index,clock-70,slot.mid);}
      owner=e;clockAt=clock;orbitX=s.x;orbitY=s.y;orbitCount=count;
    }
    for(let i=0;i<count;i++){
      const slot=orbits[i],point=slot.point;if(point.front!==front||point.alpha<=.002)continue;
      const face=front?.18+.82*smooth((Math.hypot((point.x-s.x)/(s.radius*1.05),(point.y-s.y)/(s.radius*.80))-.82)/.70):1;
      const alpha=point.alpha*face*.92,size=(39+e.power*18)*point.depth,tint=i%3;
      if(!low){SOUL.trail(c,slot.far,slot.old,run.cameraY,size*.25,alpha*.24,tint);SOUL.trail(c,slot.old,slot.mid,run.cameraY,size*.33,alpha*.42,tint);}
      SOUL.trail(c,low?slot.old:slot.mid,point,run.cameraY,size*.42,alpha*.65,tint);
      SOUL.head(c,point,slot.mid,run.cameraY,size,alpha,tint);
    }
  }
  function burst(c,run){
    const e=run.coreEncounter;if(e.phase!=='burn'||e.reduced)return;
    const q=clamp(e.phaseTime/440),fade=(1-q)**1.8,spread=(1-(1-q)**3)*(40+e.power*100),x=e.castX,y=e.castY-run.cameraY;
    if(fade<=.002)return;
    VFX.stamp(c,hot,x,y,60+spread*2.1,60+spread*1.9,fade*(.35+.35*e.power));
    for(let i=0;i<(e.lowPower?3:5);i++){
      const a=i*TAU/(e.lowPower?3:5)+.35,sz=38+e.power*65+q*55;
      VFX.stamp(c,SOUL.halo(i),x+Math.cos(a)*spread,y+Math.sin(a)*spread*.75,sz,sz,fade*.58);
    }
  }
  function flight(c,run){
    const e=run.coreEncounter;if(!e.souls)return;
    const age=e.phase==='burn'?e.phaseTime:e.phase==='afterglow'?(e.finisher?2200:1780)+e.phaseTime:2200,wave=window.SlimePhantomCoreWave,low=e.lowPower||e.reduced;
    c.save();
    for(const soul of e.souls){
      if(e.finisher&&age<soul.delay)continue;
      if(low&&soul.index%Math.max(1,Math.ceil(e.souls.length/20)))continue;
      if(soul.hit){
        const q=clamp((e.elapsed-soul.hitAt)/300);if(q===1)continue;
        const size=(28+e.power*45)*(1+q*.8);VFX.stamp(c,SOUL.halo(soul.index),soul.x,soul.y-run.cameraY,size,size*.8,(1-q)**2*.95);continue;
      }
      const point=wave.sample(soul,age,soul.sample),a=wave.sample(soul,age-(e.finisher?42:80),soul.tailA),b=wave.sample(soul,age-(e.finisher?95:180),soul.tailB),d=wave.sample(soul,age-(e.finisher?155:300),soul.tailC);
      if(age-soul.delay<(e.finisher?42:80)){a.x=soul.tailX;a.y=soul.tailY;}
      if(age-soul.delay<(e.finisher?95:180)){b.x=soul.tailX;b.y=soul.tailY;}
      if(age-soul.delay<(e.finisher?155:300)){d.x=soul.tailX;d.y=soul.tailY;}
      const alpha=1-smooth((point.p-.96)/.04),size=(e.finisher?14+e.power*11:43+e.power*22)*soul.size,tint=soul.index%3;
      if(!low){SOUL.trail(c,d,b,run.cameraY,size*.22,alpha*.28,tint);SOUL.trail(c,b,a,run.cameraY,size*.30,alpha*.48,tint);}
      SOUL.trail(c,low?b:a,point,run.cameraY,size*.40,alpha*.76,tint);
      SOUL.head(c,point,a,run.cameraY,size,alpha,tint);
      if(e.finisher)for(let j=0;j<(low?1:2);j++){
        const echo=j?soul.echoB:soul.echoA,tail=j?soul.echoTailB:soul.echoTailA,side=j?1:-1;
        const offset=side*(18+(soul.index%4)*6)*Math.sin(point.p*Math.PI)*Math.cos(point.p*7+soul.phase);
        echo.x=point.x+offset;echo.y=point.y+side*(8+soul.index%3*4);
        tail.x=b.x+side*(18+(soul.index%4)*6)*Math.sin(b.p*Math.PI)*Math.cos(b.p*7+soul.phase);tail.y=b.y+side*(8+soul.index%3*4);
        SOUL.trail(c,tail,echo,run.cameraY,size*.26,alpha*.50,(tint+j+1)%3);
        SOUL.head(c,echo,tail,run.cameraY,size*.72,alpha*.82,(tint+j+1)%3);
      }
    }
    c.restore();
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.phantom||run.evacuation||!VFX.onScreen(run))return;prepare();
    const s=run.slime,y=s.y-run.cameraY,p=clamp(e.aura,0,e.finisher?1.5:1);
    if(!front){
      const size=s.radius*(3.4+p*5.4);
      VFX.stamp(c,halo,s.x,y-s.radius*.12,size*1.12,size,p*.72);
      VFX.stamp(c,hot,s.x,y-s.radius*.12,s.radius*(1.7+p*1.6),s.radius*(1.9+p*1.6),p*.32);
      burst(c,run);flight(c,run);
    }
    swarm(c,run,front);
  }
  function backdrop(c,run){
    const e=run.coreEncounter;if(!e?.phantom||run.evacuation||!VFX.onScreen(run))return;prepare();
    const a=['approach','overdrive','armed','release'].includes(e.phase)?(e.transfer||0)*.25:e.phase==='burn'?.24*(1-smooth((e.phaseTime-1000)/780)):0;
    if(a>.001){c.save();c.globalAlpha=a;c.drawImage(vignette,0,0,440,840);c.restore();}
  }
  window.SlimePhantomCoreStrike=Object.freeze({PATHS:[],prepare,ready:()=>!!halo,draw,backdrop});
})();

