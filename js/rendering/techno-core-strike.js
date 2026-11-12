/* One full-size cannon, supplied by round drones that arrive and hold their stations. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const GUN='assets/vfx/techno-core-v1/plasma-cannon.webp',DRONE='effects-lab/assets/techno-mini-drone-red-v2-lossless.webp';
  const TAU=Math.PI*2,FRAMES=16,auras=[],beams=[];
  // Staggered compact orbit: no aligned columns, and the face and strike prompt stay clear.
  const DOCKS=[[49,7],[-44,-28],[19,-51],[-18,48],[64,-31],[-61,20],[41,48],[-79,-47],[77,43],[-37,-76],[54,-78],[-82,61],[92,-7],[-6,-99],[11,82]];
  let cannon,drone,droneArt,halo,hot,mist,ember,ring,vignette,mixAura,mixBeam,dataMote,plasmaCore;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [p,col]of stops)g.addColorStop(p,col);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function sprite(path){const img=new Image();img.decoding='async';img.src=window.SlimeGameAssets?.versionedAsset(path)||path;return img;}
  function auraFrame(a){
    const c=canvas(256,256),x=c.getContext('2d');x.globalCompositeOperation='lighter';
    x.globalAlpha=.62;x.drawImage(halo,8,20,240,216);
    for(let i=0;i<3;i++){const t=a+i*2.1,px=128+Math.cos(t)*21,py=128+Math.sin(t)*13;x.globalAlpha=.12;x.drawImage(hot,px-49,py-43,98,86);}
    x.globalAlpha=.36+Math.sin(a*2)*.035;x.drawImage(hot,84,80,88,96);
    return c;
  }
  function beamFrame(a){
    const c=canvas(144,320),x=c.getContext('2d');
    const centre=f=>72+Math.sin(f*10-a)*1.3+Math.sin(f*23+a*2)*.6;
    const width=f=>3+24*smooth(f/.37)+Math.sin(f*21-a*2)*Math.min(1,f/.37)*1.5;
    const trace=scale=>{x.beginPath();for(let i=0;i<=40;i++){const f=i/40,px=centre(f)-width(f)*scale,y=9+f*294;if(i===0)x.moveTo(px,y);else x.lineTo(px,y);}x.quadraticCurveTo(centre(1),319,centre(1)+width(1)*scale,303);for(let i=39;i>=0;i--){const f=i/40;x.lineTo(centre(f)+width(f)*scale,9+f*294);}x.closePath();x.fill();};
    const red=x.createLinearGradient(0,0,144,0);for(const [p,col]of [[0,'#b80c2b00'],[.15,'#db123f'],[.40,'#ff3e5b'],[.60,'#ff3e5b'],[.85,'#db123f'],[1,'#b80c2b00']])red.addColorStop(p,col);
    x.shadowColor='#ff234c';x.shadowBlur=20;x.fillStyle=red;trace(1.12);x.shadowBlur=5;
    const plasma=x.createLinearGradient(0,0,144,0);plasma.addColorStop(0,'#ff365a');plasma.addColorStop(.38,'#ff949b');plasma.addColorStop(.53,'#ffe2d3');plasma.addColorStop(.72,'#ff8293');plasma.addColorStop(1,'#f51b4e');x.fillStyle=plasma;trace(.64);x.shadowBlur=0;
    x.fillStyle='#fff8eb';trace(.38);
    x.globalCompositeOperation='lighter';x.globalAlpha=.60;x.fillStyle='#fff';trace(.16);x.globalAlpha=1;x.globalCompositeOperation='source-over';
    for(let i=0;i<4;i++){const f=(a/TAU+i/4)%1;x.save();x.globalAlpha=Math.sin(f*Math.PI)*.55;x.translate(centre(f)+Math.sin(i*3)*8,10+f*294);x.scale(4,18+f*8);const g=x.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');x.fillStyle=g;x.fillRect(-1,-1,2,2);x.restore();}
    return c;
  }
  function prepare(){
    if(halo)return;cannon=sprite(GUN);drone=sprite(DRONE);
    plasmaCore=canvas(64,320);const pc=plasmaCore.getContext('2d'),core=pc.createLinearGradient(0,0,64,0);
    for(const [at,color]of [[0,'#ff335900'],[.18,'#ff547b65'],[.36,'#ffbdc4d9'],[.46,'#fff7f1'],[.54,'#ffffff'],[.64,'#ffbdc4d9'],[.82,'#ff547b65'],[1,'#ff335900']])core.addColorStop(at,color);
    pc.fillStyle=core;pc.beginPath();pc.moveTo(26,0);pc.bezierCurveTo(26,50,0,85,0,128);pc.lineTo(0,320);pc.lineTo(64,320);pc.lineTo(64,128);pc.bezierCurveTo(64,85,38,50,38,0);pc.closePath();pc.fill();const ends=pc.createLinearGradient(0,0,0,320);ends.addColorStop(0,'#fff0');ends.addColorStop(.035,'#fff');ends.addColorStop(.965,'#fff');ends.addColorStop(1,'#fff0');pc.globalCompositeOperation='destination-in';pc.fillStyle=ends;pc.fillRect(0,0,64,320);
    drone.onload=()=>{droneArt=canvas(128,128);const x=droneArt.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(drone,drone.naturalWidth*277/1254,drone.naturalHeight*268/1254,drone.naturalWidth*695/1254,drone.naturalHeight*688/1254,5,5,118,118);};
    halo=radial(128,[[0,'#fff1e6a6'],[.24,'#ff747b76'],[.6,'#ed174331'],[1,'#b7082e00']]);hot=radial(128,[[0,'#fff9eb'],[.16,'#ffe8dedf'],[.40,'#ff344d9c'],[.72,'#f11d4625'],[1,'#f11d4600']]);
    mist=radial(128,[[0,'#e7c2c07d'],[.4,'#cf7f8650'],[1,'#71394400']]);ring=radial(128,[[0,'#ff2b5100'],[.43,'#ff2b5100'],[.64,'#ffa1a42d'],[.70,'#ffe5dab5'],[.77,'#ff355b4f'],[1,'#ff355b00']]);vignette=radial(128,[[0,'#200f2100'],[.46,'#200f2100'],[1,'#200f21df']]);
    ember=canvas(24,32);let x=ember.getContext('2d');x.drawImage(halo,0,0,24,32);x.fillStyle='#ffe7d8';x.beginPath();x.ellipse(12,16,1.2,3,-.15,0,TAU);x.fill();
    dataMote=canvas(24,24);x=dataMote.getContext('2d');x.drawImage(halo,0,0,24,24);x.fillStyle='#ffd4cc';x.shadowColor='#ff2e56';x.shadowBlur=4;x.beginPath();x.roundRect(9,9,6,6,1.5);x.fill();
    for(let i=0;i<FRAMES;i++){auras.push(auraFrame(i/FRAMES*TAU));beams.push(beamFrame(i/FRAMES*TAU));}mixAura=canvas(256,256);mixBeam=canvas(144,320);
  }
  const stamp=VFX.stamp;
  function animated(c,frames,mix,time,x,y,w,h,alpha){if(alpha<=.002||!VFX.visible(x,y,w,h))return;VFX.blend(frames,mix,time,FRAMES);stamp(c,mix,x,y,w,h,alpha);}
  function geometry(run){
    const e=run.coreEncounter,p=e.power,h=168,w=h*497/592;
    const recoil=e.phase==='burn'?(4+8*p)*Math.sin(clamp(e.phaseTime/220)*Math.PI)*Math.exp(-e.phaseTime/280):0,y=run.slime.y-run.cameraY+118-recoil;
    return {x:run.slime.x,y,w,h,recoil,muzzleY:y+h*.343,reactorY:y-h*.21};
  }
  function dronePose(run,index,g=geometry(run)){
    const e=run.coreEncounter,[offsetX,offsetY]=DOCKS[index],side=Math.sign(offsetX),t=VFX.clock(e),q=index===0?1:index>=7?clamp((t-(e.overdriveStart||2850)-(index-7)*45)/430):clamp((t-260-index*135)/720),u=smooth(q),cool=e.phase==='afterglow'?1-smooth(e.phaseTime/450):1;
    const dx=run.slime.x+offsetX,dy=run.slime.y-run.cameraY+offsetY,sx=side<0?-30:470,sy=dy-90-index%3*15,cx=lerp(sx,dx,.5)+side*38,cy=dy-55;
    return {side,q,feed:smooth((q-.82)/.18),alpha:cool*smooth(q/.16),size:25,
      x:(1-u)**2*sx+2*(1-u)*u*cx+u*u*dx+side*(1-cool)*18,
      y:(1-u)**2*sy+2*(1-u)*u*cy+u*u*dy+(e.reduced?0:Math.sin(t/620+index)*1.4*u)-(1-cool)*10};
  }
  function deployment(c,run,e,t,g){
    const count=e.finisher?15:e.strikeEnergy!=null&&window.SlimeCoreEncounter?window.SlimeCoreEncounter.droneCount((e.finisher?100+50*(e.overdrive||0):e.strikeEnergy)):(e.power<.3?2:e.power<.5?3:e.power<.85?5:7),cool=e.phase==='afterglow'?1-smooth(e.phaseTime/450):1;
    if(cool<=.002)return;
    const arrival=smooth((t-120)/780),gx=lerp(530,g.x,arrival),gy=lerp(g.y+75,g.y,arrival);
    if(arrival>0&&cannon.complete&&cannon.naturalWidth)stamp(c,cannon,gx,gy,g.w,g.h,cool*smooth((t-120)/150),.12*(1-arrival));
    for(let i=0;i<count;i++){
      const d=dronePose(run,i,g);if(d.alpha<=.002)continue;
      stamp(c,halo,d.x,d.y,35,35,d.alpha*(.22+d.feed*.18));if(droneArt)stamp(c,droneArt,d.x,d.y,d.size,d.size,d.alpha,d.side*(1-d.q)*.18);
      if(d.feed>.002){
        stamp(c,hot,d.x,d.y,13,13,d.alpha*d.feed*(.38+.09*Math.sin(t/125+i)));
        for(let j=0;j<(e.lowPower||e.reduced?1:3);j++){
          const receiver=g;
          const q=(t/(710+i%3*90)+i*.173+j/3)%1,n=1-q,targetX=receiver.x+d.side*receiver.w*.30,targetY=receiver.reactorY+(i%3-1)*10;
          const px=n*n*d.x+2*n*q*(lerp(d.x,targetX,.5)+d.side*12)+q*q*targetX,py=n*n*d.y+2*n*q*(lerp(d.y,targetY,.5)-22)+q*q*targetY;
          const size=7+e.power*2;stamp(c,dataMote,px,py,size,size,Math.sin(q*Math.PI)*d.alpha*d.feed*(e.phase==='burn'?1:.64+.32*e.power));
        }
      }
    }
    if(arrival===1){
      const charge=(e.phase==='burn'?e.jet:smooth((e.transfer-.16)/.84))*(.35+.65*e.power),pulse=.94+.06*Math.sin(t/100);
      stamp(c,hot,g.x,g.reactorY,g.w*.68,g.h*.5,cool*charge*pulse*.58);const aperture=8+23*charge;
      stamp(c,halo,g.x,g.muzzleY,aperture*2.2,aperture*1.55,cool*charge*.88);
      stamp(c,hot,g.x,g.muzzleY,aperture,aperture*.76,cool*charge*pulse);
      if(e.phase!=='burn')for(let j=0;j<(e.lowPower||e.reduced?3:7);j++){
        const q=(t/(520+j%3*80)+j*.23)%1,a=j*2.399,r=(1-q)*(21+charge*24);
        stamp(c,ember,g.x+Math.cos(a)*r,g.muzzleY+Math.sin(a)*r*.55,6,9,Math.sin(q*Math.PI)*charge*cool,a);
      }
      if(e.phase==='afterglow')for(const side of [-1,1]){const q=clamp(e.phaseTime/500);stamp(c,mist,g.x+side*g.w*.35,g.y-g.h*.1-q*22,g.w*.4+q*25,20+q*40,Math.sin(q*Math.PI)*.36);}
    }
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.techno||run.evacuation||!VFX.onScreen(run))return;prepare();
    const s=run.slime,y=s.y-run.cameraY,p=clamp(e.aura,0,e.finisher?1.5:1),t=VFX.clock(e),low=e.lowPower||e.reduced,g=geometry(run);
    c.save();
    if(front){stamp(c,halo,s.x,y+s.radius*.58,s.radius*2.3,s.radius*.8,p*.23);c.restore();return;}
    if(p>.002){
      const size=s.radius*(3+p*5);stamp(c,halo,s.x,y-s.radius*.08,size*1.20,size,p*.62);animated(c,auras,mixAura,t/(e.reduced?6000:1750),s.x,y-s.radius*.12,size,size,p*.90);
    }
    deployment(c,run,e,t,g);
    if(e.phase==='burn'&&e.jet>.001){
      const gun=g;
      const reach=smooth(e.phaseTime/90),end=run.coreArena.surfaceY-run.cameraY,length=(end-gun.muzzleY)*reach,width=48+196*e.power,q=e.jet*(gun.alpha??1);
      if(length>2){stamp(c,halo,gun.x,gun.muzzleY+length*.55,width,length*1.1,q*.68);animated(c,beams,mixBeam,t/(e.reduced?1500:360),gun.x,gun.muzzleY+length*.5,width,length*1.06,q);}
      stamp(c,hot,gun.x,gun.muzzleY,24+35*e.power,20+30*e.power,q*.92);
      if(length>2){
        const count=low?2:4;
        for(let j=0;j<count;j++){
          const f=(t/(240+j%3*35)+j*.193)%1,offset=Math.sin(t/80+j*2.1)*width*.10;
          stamp(c,hot,gun.x+offset,gun.muzzleY+f*length,width*.25,42+e.power*45,q*Math.sin(f*Math.PI)*.25);
        }
      }
      if(e.hit){const age=(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt),fade=1-clamp(age/1100);stamp(c,hot,gun.x,end,90+260*e.power,50+120*e.power,q*.95);stamp(c,ring,gun.x,end,110+Math.sqrt(clamp(age/650))*(90+180*e.power),40+70*e.power,q*fade*.75);
        for(let i=0;i<(low?6:15);i++){const f=(age/(450+i%3*90)+i*.193)%1,a=Math.PI+(i+.5)/(low?6:15)*Math.PI,r=f*(40+e.power*150);stamp(c,ember,gun.x+Math.cos(a)*r,end+Math.sin(a)*r*.6+f*f*28,4+e.power*4,8+e.power*8,q*(1-f)*.9,a+Math.PI/2);}}
      if(length>2)stamp(c,plasmaCore,gun.x,gun.muzzleY+length*.5,width*.36,length,q);
    }
    c.restore();
  }
  function backdrop(c,run){const e=run.coreEncounter;if(!e?.techno||run.evacuation||!VFX.onScreen(run))return;prepare();const a=e.phase==='release'?.38:['approach','overdrive','armed'].includes(e.phase)?e.transfer*.21:e.phase==='burn'?.16*(1-clamp(e.phaseTime/180)):0;if(a>.001){c.save();c.globalAlpha=a;c.drawImage(vignette,0,0,440,840);c.restore();}}
  const ready=()=>!!(cannon?.complete&&cannon.naturalWidth&&droneArt);
  window.SlimeTechnoCoreStrike=Object.freeze({GUN,DRONE,prepare,ready,geometry,dronePose,draw,backdrop});
})();
