/* A planted spore mine, growing mycelium, and one big rolling mushroom cloud. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const POD='assets/vfx/spores-core-graft-v2/graft.webp',SEED='assets/vfx/spores-giant-seed-v1.webp',CLOUD='assets/vfx/spores-impact-cloud-v1.webp';
  const TAU=Math.PI*2,puffs=[];
  let pod,seed,cloud,halo,hot,mote,particle,vignette;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);},lerp=(a,b,t)=>a+(b-a)*t;
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [p,color]of stops)g.addColorStop(p,color);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function sprite(path,onload){const im=new Image();im.decoding='async';im.onload=onload;im.src=window.SlimeGameAssets?.versionedAsset(path)||path;return im;}
  function prepare(){
    if(halo)return;
    halo=radial(128,[[0,'#f8ffbdc5'],[.25,'#d9fc7f8a'],[.60,'#84cf4538'],[1,'#57984200']]);
    hot=radial(128,[[0,'#ffffed'],[.14,'#fff9c9f0'],[.40,'#e6ff8b9c'],[.72,'#9bdb4730'],[1,'#71af3900']]);
    mote=radial(24,[[0,'#ffffe4'],[.17,'#edffb7db'],[.46,'#b4ee6b60'],[1,'#91d45700']]);
    vignette=radial(128,[[0,'#1c281200'],[.45,'#1c281200'],[1,'#233711c4']]);
    pod=sprite(POD);seed=sprite(SEED,()=>{particle=canvas(48,48);const x=particle.getContext('2d');x.drawImage(halo,0,0,48,48);x.drawImage(seed,7,7,34,34);});
    cloud=sprite(CLOUD,()=>{
      for(let i=0;i<3;i++){
        const c=canvas(128,128),x=c.getContext('2d'),side=cloud.naturalHeight*.86,sx=cloud.naturalWidth*(.20+i*.22)-side/2;
        x.drawImage(cloud,Math.max(0,sx),0,side,side,0,0,128,128);
        const mask=x.createRadialGradient(64,64,20,64,64,62);mask.addColorStop(0,'#fff');mask.addColorStop(.6,'#ffffffdb');mask.addColorStop(1,'#fff0');
        x.globalCompositeOperation='destination-in';x.fillStyle=mask;x.fillRect(0,0,128,128);puffs.push(c);
      }
    });
  }
  const ready=()=>!!(pod?.complete&&pod.naturalWidth&&seed?.complete&&seed.naturalWidth&&cloud?.complete&&cloud.naturalWidth&&puffs.length===3);
  const stamp=VFX.stamp;
  function planting(run){
    const e=run.coreEncounter,s=run.slime;if(!e)return {active:false,planted:false,growth:0,x:s.x,y:s.y};
    const progress=e.transfer??clamp(e.elapsed/2100),growth=smooth((progress-.14)/.86);
    return {active:growth>.001,planted:true,growth,x:run.coreArena.x,y:run.coreArena.surfaceY+20};
  }
  function charge(c,run,front){
    const e=run.coreEncounter,s=run.slime,y=s.y-run.cameraY,p=clamp(e.aura,0,e.finisher?1.5:1),t=VFX.clock(e)*(e.reduced?.3:1),low=e.lowPower||e.reduced;
    if(p<=.002)return;
    const size=s.radius*(3.2+p*5.5);
    if(!front){
      stamp(c,halo,s.x,y-s.radius*.12,size*1.12,size,p*.65);
      for(let i=0;i<(low?3:7);i++){
        const a=i*2.399+t/3100,r=s.radius*(.8+p*1.4),w=s.radius*(1.8+p*2.5),life=.8+.2*Math.sin(t/550+i);
        stamp(c,puffs[i%3],s.x+Math.cos(a)*r,y+Math.sin(a)*r*.65,w,w*.85,p*life*.34);
      }
      stamp(c,hot,s.x,y-s.radius*.10,s.radius*(1.9+p*1.8),s.radius*(1.9+p*1.8),p*.26);
    }else{
      stamp(c,puffs[1],s.x-s.radius*.8,y+s.radius*.8,s.radius*2,s.radius*.9,p*.12);
      stamp(c,puffs[2],s.x+s.radius*.85,y+s.radius*.8,s.radius*2,s.radius*.9,p*.12);
    }
    const count=low?10:14+Math.round(e.power*24);
    for(let i=0;i<count;i++){
      if((i%5===0)!==front)continue;
      const q=(t/(1750+i%5*200)+i*.193)%1,a=i*2.399+Math.sin(t/700+i)*.25,r=s.radius*(1.1+p*2.2)*(1-q*.35);
      const px=s.x+Math.cos(a)*r+Math.sin(q*TAU+i)*6,py=y+s.radius*.9-q*s.radius*(2.4+p*1.6)+Math.sin(a)*r*.38,size=5+p*(4+i%4*2);
      stamp(c,i%4===0?particle:mote,px,py,size,size,Math.sin(q*Math.PI)*p*.90,a*.12);
    }
  }
  function mine(c,run){
    const e=run.coreEncounter,g=planting(run),p=e.power,t=e.elapsed,ground=run.coreArena.surfaceY-run.cameraY;
    if(!g.active)return;
    const hitAge=e.hit?(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt):-1,fade=hitAge<0?1:1-smooth(hitAge/160);
    if(fade<=.002)return;
    const spread=smooth(g.growth/.90),inflate=smooth((g.growth-.30)/.70);
    const width=lerp(30,105+p*465,spread),pulse=e.reduced?1:1+Math.sin(t/155)*.014*inflate;
    const overgrowth=e.finisher?1+.65*smooth(e.overdrive||0):1;
    const tension=e.phase==='burn'?1-.06*smooth(e.phaseTime/90)+.20*smooth((e.phaseTime-90)/90):1;
    const height=lerp(5,(105+p*465)*.40,inflate)*pulse*tension*overgrowth;
    // The graft's center is buried in the shell; spreading roots follow its convex cap.
    const cy=ground+height*.13;
    stamp(c,halo,run.coreArena.x,ground+20,width*1.10,height*.85,g.growth*fade*.28);
    stamp(c,pod,run.coreArena.x,cy,width,height,fade);
    const feeds=e.lowPower||e.reduced?9:e.finisher?30:20;
    for(let i=0;i<feeds;i++){
      const q=((t-300)/(650+i%4*110)+i*.217)%1;if(q<0)continue;
      const n=1-q,side=i%2?1:-1,sourceX=run.slime.x+side*(12+i%3*12),sourceY=run.slime.y-run.cameraY+run.slime.radius*.65;
      const tx=run.coreArena.x+Math.sin(i*2.4)*width*.13,ty=ground-height*.20;
      const px=n*n*sourceX+2*n*q*(sourceX+side*(55+i%4*16))+q*q*tx,py=n*n*sourceY+2*n*q*((sourceY+ty)*.5-20)+q*q*ty;
      const size=4+q*(5+p*4),alpha=Math.sin(q*Math.PI)*fade*(.28+.65*g.growth);
      stamp(c,i%5===0?particle:mote,px,py,size,size,alpha,q*.7);
    }
    if(e.finisher&&e.overdrive>0){
      const breath=.85+.15*Math.sin(t/140),growth=smooth(e.overdrive);
      stamp(c,hot,run.coreArena.x,ground-height*.36,width*.45,height*.82,fade*growth*breath*.38);
      for(let j=0;j<(e.lowPower||e.reduced?6:14);j++){
        const q=(t/(800+j%4*110)+j*.217)%1,a=j*2.399,range=90+growth*90;
        stamp(c,mote,run.coreArena.x+Math.cos(a)*range*(1-q),ground-height*.25+Math.sin(a)*range*.5*(1-q),6+q*11,6+q*11,Math.sin(q*Math.PI)*growth*fade*.85);
      }
    }
    const nodes=e.lowPower||e.reduced?4:8,r=run.coreArena.radius||418;
    for(let i=0;i<nodes;i++){
      const side=i%2?1:-1,offset=width*(.12+Math.floor(i/2)*.085),arrival=smooth((g.growth-.13-Math.floor(i/2)*.12)/.26);
      const py=ground+r-Math.sqrt(Math.max(1,r*r-offset*offset))+20;
      const size=(9+p*12)*arrival,alpha=arrival*fade*(.34+.10*Math.sin(t/210-i));
      stamp(c,mote,run.coreArena.x+side*offset,py,size*2.4,size*1.5,alpha);
    }
    if(e.phase==='burn')stamp(c,hot,run.coreArena.x,ground-height*.1,width*.66,height*.95,smooth(e.phaseTime/180)*fade*.65);
  }
  function blast(c,run){
    const e=run.coreEncounter;if(!e.hit)return;
    const p=e.power,age=(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt),t=age/1000,low=e.lowPower||e.reduced,end=run.coreArena.surfaceY-run.cameraY,x=run.coreArena.x;
    const rise=1-(1-clamp(age/850))**2.4,expand=1-(1-clamp(age/620))**2.5,fade=1-smooth((age-750)/650),birth=smooth(age/120);
    if(fade<=.002)return;
    const boost=e.finisher?1.16:1,height=(70+290*p)*rise*boost,width=(120+500*p)*expand*boost,capY=end-height;
    stamp(c,halo,x,end,150+expand*(150+350*p),50+110*p,fade*(1-clamp(age/550))*.65);
    stamp(c,hot,x,end-12,80+310*p+expand*130,50+170*p,(1-clamp(age/330))**1.5*.98);
    // Growing central stalk, shaded by the original cloud art; the cap rolls above it.
    for(let i=0;i<(low?4:7);i++){
      const u=i/(low?3:6),w=(42+p*88)*(1+.38*u)*birth,py=end-height*u*.86+Math.sin(t*2+i)*3*(e.reduced?0:1);
      stamp(c,puffs[i%3],x+Math.sin(i*2.1+t*2)*w*.09,py,w,w*(1.15+u*.3),birth*fade*(.60+.12*p));
    }
    if(cloud?.complete&&cloud.naturalWidth)stamp(c,cloud,x,capY,width,width*.36,birth*fade*.94);
    for(let i=0;i<(low?3:6);i++){
      const u=i/(low?2:5)*2-1,w=width*(.24+.035*Math.cos(i)),py=capY-width*.025*(1-u*u);
      stamp(c,puffs[i%3],x+u*width*.34,py,w,w*.80,birth*fade*.52,Math.sin(t*1.5+i)*.05);
    }
    stamp(c,hot,x,capY+width*.06,width*.44,width*.30,birth*fade*(1-clamp(age/820))*.22);
    // Airborne pollen, thrown out with the blast then floating away.
    const count=low?10:16+Math.round(p*16);
    for(let i=0;i<count;i++){
      const delay=i%4*.025,sec=Math.max(0,t-delay);if(t<delay)continue;
      const a=i*2.399,speed=(45+150*p)*(.6+i%4*.18),px=x+Math.cos(a)*speed*sec,py=end-25-(90+p*190)*sec+Math.sin(a)*speed*sec*.55+60*sec*sec;
      const life=(1-clamp(sec/1.6))**1.5,size=(7+p*(6+i%3*3))*(1-clamp(sec/1.7)*.3);
      stamp(c,i%3===0?particle:mote,px,py,size,size,life*.90,sec*(i%2?1:-1)*.3);
    }
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.spores||run.evacuation||!VFX.onScreen(run))return;prepare();
    charge(c,run,front);if(front)return;mine(c,run);blast(c,run);
  }
  function backdrop(c,run){
    const e=run.coreEncounter;if(!e?.spores||run.evacuation||!VFX.onScreen(run))return;prepare();
    const a=['approach','overdrive','armed','release'].includes(e.phase)?(e.transfer||0)*.17:e.phase==='burn'?.20*(1-smooth((e.phaseTime-800)/650)):0;
    if(a>.002){c.save();c.globalAlpha*=a;c.drawImage(vignette,0,0,440,840);c.restore();}
  }
  window.SlimeSporesCoreStrike=Object.freeze({POD,SEED,CLOUD,prepare,ready,planting,draw,backdrop});
})();

