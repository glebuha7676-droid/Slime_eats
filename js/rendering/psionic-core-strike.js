/* Existing psionic rock, accelerated spin and a single heavy telekinetic throw. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const ROCK='effects-lab/assets/telekinesis-rock-right-v1-lossless.webp',TAU=Math.PI*2,FRAMES=16,auras=[],rocks=new Map();
  let halo,hot,ring,mote,dust,vignette,mix;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [p,col]of stops)g.addColorStop(p,col);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function auraFrame(a){
    const c=canvas(256,256),x=c.getContext('2d');x.globalCompositeOperation='lighter';
    x.globalAlpha=.68;x.drawImage(halo,4,15,248,226);
    for(let i=0;i<3;i++){const angle=a+i*2.1,px=128+Math.cos(angle)*21,py=128+Math.sin(angle)*15;x.globalAlpha=.12;x.drawImage(halo,px-65,py-49,130,98);}
    x.globalAlpha=.42+Math.sin(a*2)*.025;x.drawImage(hot,81,79,94,98);return c;
  }
  const WORLD_ROCKS={3:'candy',4:'magma',5:'desert'};
  const rockPath=worldId=>WORLD_ROCKS[worldId]?'assets/vfx/psionic-rocks/'+WORLD_ROCKS[worldId]+'.webp':ROCK;
  function loadRock(path){
    if(rocks.has(path))return;
    rocks.set(path,null);
    const image=new Image();image.decoding='async';image.onload=()=>{
      const body=canvas(256,256);const x=body.getContext('2d');x.imageSmoothingQuality='high';if(path!==ROCK)x.drawImage(image,0,0,256,256);else x.drawImage(image,image.naturalWidth*296/1254,image.naturalHeight*336/1254,image.naturalWidth*677/1254,image.naturalHeight*633/1254,15,22,226,212);
      const edge=canvas(256,256);const e=edge.getContext('2d');e.shadowColor='#12cfff';e.shadowBlur=16;e.drawImage(body,0,0);e.shadowBlur=7;e.drawImage(body,0,0);e.shadowBlur=0;e.globalCompositeOperation='destination-out';e.drawImage(body,0,0);
      const fragments=[];
      for(let i=0;i<10;i++){
        const f=canvas(72,72),q=f.getContext('2d');q.beginPath();q.moveTo(8,11);q.lineTo(43+i%3*5,3);q.lineTo(68,31);q.lineTo(51,68);q.lineTo(12,59);q.closePath();q.clip();q.drawImage(body,32+(i%3)*44,30+(Math.floor(i/3)%3)*44,100,100,0,0,72,72);fragments.push(f);
      }
      rocks.set(path,{body,edge,fragments});
    };image.src=window.SlimeGameAssets?.versionedAsset(path)||path;
  }
  function prepare(worldId){
    loadRock(ROCK);
    loadRock(rockPath(worldId));
    if(halo)return;
    halo=radial(128,[[0,'#effcffa8'],[.23,'#66eaff79'],[.58,'#05b0ff39'],[1,'#0067f000']]);hot=radial(128,[[0,'#fff'],[.15,'#ddfcfff2'],[.38,'#12cfff9d'],[.72,'#0088ff2b'],[1,'#0088ff00']]);
    ring=radial(128,[[0,'#12cfff00'],[.43,'#12cfff00'],[.64,'#12cfff32'],[.7,'#e6fcffbf'],[.77,'#12cfff5c'],[1,'#0088ff00']]);vignette=radial(128,[[0,'#071d3300'],[.46,'#071d3300'],[1,'#071d33df']]);
    dust=radial(128,[[0,'#d6e7ed9c'],[.30,'#9ab9ca62'],[.66,'#739bac2e'],[1,'#63869700']]);
    mote=canvas(24,32);let c=mote.getContext('2d');c.drawImage(halo,0,0,24,32);c.fillStyle='#effcff';c.beginPath();c.ellipse(12,16,1.2,2.8,0,0,TAU);c.fill();
    for(let i=0;i<FRAMES;i++)auras.push(auraFrame(i/FRAMES*TAU));mix=canvas(256,256);
  }
  const stamp=VFX.stamp;
  function charge(c,run,e,t,front){
    const s=run.slime,y=s.y-run.cameraY,p=clamp(e.aura,0,e.finisher?1.5:1);if(p<=.002)return;
    if(front){for(const side of [-1,1])stamp(c,halo,s.x+side*s.radius*.85,y,s.radius*.9,s.radius*1.3,p*.16);return;}
    const size=s.radius*(3+p*5);
    if(VFX.visible(s.x,y-s.radius*.1,size,size))VFX.blend(auras,mix,t/(e.reduced?6000:1700),FRAMES);
    stamp(c,halo,s.x,y-s.radius*.1,size*1.12,size,p*.55);stamp(c,mix,s.x,y-s.radius*.1,size,size,p*.90);
    for(let j=0;j<(e.lowPower||e.reduced?8:22);j++){
      const q=(t/(1600+j%5*190)+j*.317)%1,a=j*2.399,range=s.radius*(1.2+p*1.7)*(1-q*.30);
      const px=s.x+Math.cos(a)*range+Math.sin(q*4+j)*4,py=y+Math.sin(a)*range*.70-q*s.radius*.65;
      stamp(c,mote,px,py,3+p*4,4+p*5,Math.sin(q*Math.PI)*Math.sqrt(p)*.65,q*.8+j);
    }
    const r=e.rock;if(r.alpha>.002&&!r.broken)for(let j=0;j<(e.lowPower||e.reduced?4:9);j++){
      const q=(t/(650+j%3*120)+j*.217)%1,dx=r.x-s.x,dy=r.y-s.y;
      stamp(c,mote,s.x+dx*q+Math.sin(q*Math.PI)*(j%2?12:-12),y+dy*q,5+p*4,8+p*6,Math.sin(q*Math.PI)*p*.82,Math.atan2(dy,dx)-Math.PI/2);
    }
  }
  function extraction(c,run,e,r,art){
    if(!r?.torn||r.ripAt==null)return;
    const age=(e.elapsed-r.ripAt)/1000;if(age<0||age>1.15)return;
    const p=e.power,low=e.lowPower||e.reduced,x=r.wallX,y=r.wallY-run.cameraY,fade=(1-age/1.15)**1.5;
    stamp(c,hot,x,y,75+p*100,65+p*95,Math.max(0,1-age/.23)*(.55+p*.3));
    for(let i=0;i<(low?2:4);i++){
      const q=clamp(age/(.7+i*.1)),px=x-r.side*(12+q*(22+i*13)),py=y+(i-1.5)*23+q*q*35;
      stamp(c,dust,px,py,45+q*(50+p*40),35+q*50,fade*(.18+p*.20));
    }
    for(let i=0;i<(low?5:10);i++){
      const delay=i%3*.025,t=Math.max(0,age-delay);if(age<delay)continue;
      const speed=(45+p*105)*(.65+i%3*.2),px=x-r.side*speed*t,py=y+(i%3-1)*18-(75+i%4*29)*t+240*t*t,size=(7+p*12)*(.6+i%3*.25);
      stamp(c,art?.fragments[i%10],px,py,size,size,fade*.9,t*(i%2?5:-7));
    }
  }
  function drawRock(c,run,e,r,t,p,low,art){
    extraction(c,run,e,r,art);
    if(r.alpha>.002){
      const y=r.y-run.cameraY,size=r.size;
      stamp(c,halo,r.x,y,size*1.45,size*1.45,r.alpha*(.27+.3*p));
      if(e.phase==='burn'&&!r.broken&&!low)for(let i=2;i>=1;i--){
        const q=clamp((e.phaseTime-(r.secondary?window.SlimeCoreEncounter.PSIONIC.secondDelay:0)-i*25)/360)**2.5,n=1-q,cx=(r.castX??e.castRockX)+(r.side||-1)*45,cy=((r.castY??e.castRockY)+r.targetY)*.5-12;
        const x=n*n*(r.castX??e.castRockX)+2*n*q*cx+q*q*r.targetX,by=n*n*(r.castY??e.castRockY)+2*n*q*cy+q*q*r.targetY;
        stamp(c,art?.edge,x,by-run.cameraY,size,size,r.alpha*(3-i)*.09,r.angle+(r.side||-1)*i*.23);
      }
      stamp(c,art?.edge,r.x,y,size,size,r.alpha*.85,r.angle);stamp(c,art?.body,r.x,y,size,size,r.alpha,r.angle);
      if(!r.broken)for(let i=0;i<(low?4:8);i++){
        const a=r.angle*.55+i*TAU/(low?4:8),orbit=size*(.44+.04*Math.sin(t/160+i));
        stamp(c,mote,r.x+Math.cos(a)*orbit,y+Math.sin(a)*orbit*.8,5+p*4,8+p*6,r.alpha*(.55+.3*p),a);
      }
    }
    if(r.secondary?r.broken:e.hit){
      const age=r.secondary?Math.max(0,(e.attackAge||0)-(r.hitAttackAge||0)):(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt),q=clamp(age/950),x=r.targetX,y=VFX.coreSurfaceY(run,x),fade=(1-q)**1.6;
      if(!e.extraRock){stamp(c,hot,x,y,100+p*320,55+p*150,Math.max(0,1-age/480)*.95);stamp(c,ring,x,y,75+(100+p*260)*Math.sqrt(q),40+(45+p*110)*Math.sqrt(q),fade*.84);}
      for(let i=0;i<(low?6:10);i++){
        const a=-Math.PI*.94+i/(low?6:10)*Math.PI*.88,speed=140+p*155+i%3*19,seconds=age/1000;
        const sx=x+Math.cos(a)*speed*seconds,sy=y+Math.sin(a)*speed*seconds+210*seconds*seconds,sz=(13+p*38)*(.78+i%3*.15);
        stamp(c,art?.fragments[i],sx,sy,sz,sz,fade,r.impactAngle*.2+seconds*(i%2?6:-8));
        if(!low&&i%2===0)stamp(c,mote,sx,sy,5+p*4,8+p*6,fade*.65);
      }
    }
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.psionic||run.evacuation||!VFX.onScreen(run))return;prepare(run.worldId);
    const t=VFX.clock(e),p=e.power,low=e.lowPower||e.reduced;c.save();charge(c,run,e,t,front);
    if(!front){
      const art=rocks.get(rockPath(run.worldId))||rocks.get(ROCK);
      drawRock(c,run,e,e.rock,t,p,low,art);
      if(e.extraRock){
        drawRock(c,run,e,e.extraRock,t,p,low,art);
        if(e.extraRock.broken){
          const x=run.coreArena.x,y=VFX.coreSurfaceY(run,x,6);
          const age=(e.attackAge||0)-e.extraRock.hitAttackAge,spread=Math.sqrt(clamp(age/700));
          const flash=1-smooth(age/430);
          stamp(c,halo,x,y,390+180*spread,220+110*spread,flash);
          stamp(c,hot,x,y,420,235,flash);
          stamp(c,ring,x,y,125+420*spread,68+170*spread,1-smooth(age/780));
        }
      }
    }
    c.restore();
  }
  function backdrop(c,run){const e=run.coreEncounter;if(!e?.psionic||run.evacuation||!VFX.onScreen(run))return;prepare();const a=e.phase==='release'?.38:['approach','overdrive','armed'].includes(e.phase)?e.transfer*.21:e.phase==='burn'?.18*(1-clamp(e.phaseTime/360)):0;if(a>.001){c.save();c.globalAlpha=a;c.drawImage(vignette,0,0,440,840);c.restore();}}
  const ready=worldId=>!!rocks.get(rockPath(worldId));
  window.SlimePsionicCoreStrike=Object.freeze({ROCK,prepare,ready,draw,backdrop});
})();
