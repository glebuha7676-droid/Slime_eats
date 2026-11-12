/* Ground-born frost wave: small advancing roots, then a field of faceted ice through the core. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const TAU=Math.PI*2,FRAMES=16,auras=[],spikes=[];
  let halo,hot,mist,flake,vignette,coldWash,snowDust,mix,mixCtx,puncture,breach;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){
    const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    for(const [p,col]of stops)g.addColorStop(p,col);x.fillStyle=g;x.fillRect(0,0,size,size);return c;
  }
  function polygon(x,points,fill){x.beginPath();x.moveTo(...points[0]);for(let i=1;i<points.length;i++)x.lineTo(...points[i]);x.closePath();x.fillStyle=fill;x.fill();}
  function ice(v){
    const c=canvas(64,192),x=c.getContext('2d'),tip=29+v*1.5;
    // One continuous crystal, with broad readable faces instead of chipped contours.
    const outline=[[6,177],[12,108],[tip,5],[51,96],[59,177],[33,188]];
    const body=x.createLinearGradient(7,80,56,150);body.addColorStop(0,'#469cce');body.addColorStop(.32,'#b1f3ff');body.addColorStop(.59,'#68c9ef');body.addColorStop(1,'#287ba8');
    x.shadowColor='#8be9ff';x.shadowBlur=6;polygon(x,outline,body);x.shadowBlur=0;
    const light=x.createLinearGradient(25,8,27,185);light.addColorStop(0,'#fff');light.addColorStop(.28,'#e9ffff');light.addColorStop(1,'#a1e2f4');
    polygon(x,[[tip,8],[29,102],[33,185],[11,176],[18,101]],light);
    polygon(x,[[tip,8],[44,105],[53,176],[33,185],[29,102]],'#398ebc99');
    polygon(x,[[tip,8],[31,101],[33,179],[27,102]],'#f3ffffb3');
    x.strokeStyle='#d8fcffb3';x.lineWidth=1.1;x.lineJoin='round';x.beginPath();x.moveTo(11,176);x.lineTo(18,101);x.lineTo(tip,8);x.lineTo(44,105);x.stroke();
    return c;
  }
  function auraFrame(a){
    const c=canvas(256,256),x=c.getContext('2d');
    x.globalCompositeOperation='lighter';
    x.globalAlpha=.65;x.drawImage(halo,5,12,246,230);
    for(let i=0;i<6;i++){
      const angle=a*(i%2?1:-1)+i*2.399,r=24+i%3*9,px=128+Math.cos(angle)*r,py=128+Math.sin(angle)*r*.65;
      x.globalAlpha=.14+Math.sin(a+i)*.025;x.drawImage(mist,px-54,py-38,108,76);
    }
    x.globalAlpha=.55;x.drawImage(hot,71,66,114,124);
    return c;
  }
  function strength(e){
    const reserve=(e.finisher?100+50*(e.overdrive||0):e.strikeEnergy),peak=reserve==null?e.power:reserve>100?Math.min(1.5,reserve/100):reserve>=75?1:reserve>=50?.72:reserve>=25?.46:.22;
    return clamp((e.aura||0)/Math.max(.001,e.power||1))*peak;
  }
  function weatherStrength(e){
    const reserve=(e.finisher?100+50*(e.overdrive||0):e.strikeEnergy),peak=reserve==null?e.power:reserve>100?Math.min(1.5,reserve/100):reserve>=75?1:reserve>=50?.72:reserve>=25?.46:.22;
    if(e.phase==='burn')return peak*(1-.75*smooth((e.phaseTime-450)/650));
    if(e.phase==='afterglow')return peak*.25*(1-smooth(e.phaseTime/380));
    return strength(e);
  }
  function prepare(){
    if(halo)return;
    breach=canvas(384,160);const bc=breach.getContext('2d');
    bc.shadowColor='#12364c';bc.shadowBlur=10;
    polygon(bc,[[12,105],[53,67],[102,83],[143,54],[197,74],[249,53],[306,75],[372,104],[338,141],[262,152],[186,141],[89,151],[26,131]],'#133e5bd9');
    bc.shadowBlur=0;
    for(let i=0;i<20;i++){
      const x=24+(i*.618%1)*330,y=83+(i*.373%1)*50,w=19+(i%4)*8,h=15+(i%3)*9;
      polygon(bc,[[x-w*.6,y],[x-w*.2,y-h],[x+w*.65,y-h*.35],[x+w*.4,y+h*.35],[x-w*.4,y+h*.4]],['#78c9e7db','#c2f6ffdf','#3e94c4d9'][i%3]);
      polygon(bc,[[x-w*.2,y-h],[x+w*.65,y-h*.35],[x,y+h*.12]],'#ecffffbd');
    }
    puncture=canvas(64,32);const cut=puncture.getContext('2d');cut.translate(32,16);cut.scale(1,.30);const hole=cut.createRadialGradient(0,0,2,0,0,26);hole.addColorStop(0,'#09223c');hole.addColorStop(.5,'#16406bd9');hole.addColorStop(.7,'#a5ecff99');hole.addColorStop(1,'#8ce6ff00');cut.fillStyle=hole;cut.fillRect(-32,-48,64,96);
    halo=radial(128,[[0,'#f5ffffb0'],[.24,'#baf7ff72'],[.6,'#55beec30'],[1,'#2995d000']]);
    hot=radial(128,[[0,'#fff'],[.15,'#e8ffffdf'],[.4,'#a5f1ff7b'],[.73,'#55bee71f'],[1,'#55bee700']]);
    mist=radial(128,[[0,'#e3ffffa3'],[.35,'#b4eeff60'],[.74,'#87d5ec20'],[1,'#87d5ec00']]);
    vignette=radial(128,[[0,'#0a223100'],[.46,'#0a223100'],[1,'#0a2231df']]);
    coldWash=canvas(128,256);const wash=coldWash.getContext('2d'),g=wash.createLinearGradient(0,0,0,256);g.addColorStop(0,'#277cd669');g.addColorStop(.45,'#79d8ff3b');g.addColorStop(1,'#b2f3ff5c');wash.fillStyle=g;wash.fillRect(0,0,128,256);
    snowDust=radial(32,[[0,'#ffffffef'],[.18,'#edffffb7'],[.5,'#c5f7ff4c'],[1,'#a4efff00']]);
    flake=canvas(64,64);const x=flake.getContext('2d');x.drawImage(halo,0,0,64,64);x.translate(32,32);x.strokeStyle='#f5ffff';x.lineWidth=1.8;x.lineCap='round';x.shadowColor='#7bdeff';x.shadowBlur=6;
    for(let i=0;i<6;i++){x.save();x.rotate(i*TAU/6);x.beginPath();x.moveTo(0,0);x.lineTo(0,-16);x.moveTo(0,-10);x.lineTo(-4,-6);x.moveTo(0,-10);x.lineTo(4,-6);x.stroke();x.restore();}
    for(let i=0;i<5;i++)spikes.push(ice(i));
    for(let i=0;i<FRAMES;i++)auras.push(auraFrame(i/FRAMES*TAU));mix=canvas(256,256);mixCtx=mix.getContext('2d');
  }
  const stamp=VFX.stamp;
  function spike(c,x,y,w,h,angle,alpha,variant){
    if(alpha<=.002||h<1||!VFX.visible(x+Math.sin(angle)*h*.45,y-Math.cos(angle)*h*.45,w,h,angle))return;c.save();c.globalAlpha*=alpha;c.translate(x,y);c.rotate(angle);c.drawImage(spikes[variant%5],-w*.5,-h*.95,w,h);c.restore();
  }
  function charge(c,e,s,y,t,p,low,front){
    const r=s.radius;
    if(front){for(const side of [-1,1])stamp(c,halo,s.x+side*r*.83,y,r*.95,r*1.4,p*.20);return;}
    const size=r*(2.7+p*5.3);
    if(VFX.visible(s.x,y-r*.12,size,size))VFX.blend(auras,mix,t/1900,FRAMES);
    stamp(c,halo,s.x,y-r*.08,size*1.25,size*1.10,p*.65);stamp(c,mix,s.x,y-r*.12,size,size,p*.95);
    c.save();c.globalCompositeOperation='lighter';stamp(c,hot,s.x,y-r*.12,r*(2+p*2.3),r*(2+p*2.5),p*.48);c.restore();
    const flakes=low?10:e.phase==='burn'?12+Math.round(p*4):16+Math.round(p*24);
    for(let j=0;j<flakes;j++){
      const q=(t/(1200+j%5*140)+j*.217)%1,seed=j*.618%1,a=j*2.399+q*.65,range=r*(.12+(2+p*3)*(1-q)**.8);
      const px=s.x+Math.cos(a)*range+Math.sin(q*4+j)*r*.13*(1-q),py=y+Math.sin(a)*range*.78-r*.1;
      const size=(8+p*11)*(.60+seed*.65)*(1-q*.43),fade=smooth(q/.13)*(1-smooth((q-.72)/.28));
      stamp(c,flake,px,py,size,size,fade*Math.sqrt(p)*(.62+seed*.35),t/1700+j);
    }
  }
  function roots(c,run,e,age,p,low){
    const start=(e.castY??run.slime.y)-run.cameraY+run.slime.radius*.9,end=run.coreArena.surfaceY-run.cameraY;
    const fade=1-smooth((age-710)/390);
    const rows=e.finisher?(low?3:4):low?6:8;
    for(let row=0;row<rows;row++){
      const f=row/(rows-1),growth=smooth((age-row*32)/95),y=start+(end-start)*f;
      if(!growth)continue;
      for(const side of [-1,1]){
        const x=run.slime.x+side*(163+35*f),h=(12+p*26)*(.8+f*.3)*growth;
        if(row%4===0)stamp(c,mist,x,y+3,34+p*23,12+p*12,growth*fade*.60);
        spike(c,x,y,10+p*11,h,-side*(1.05-f*.55),fade*(.68+f*.14),row+(side>0?1:0));
      }
    }
  }
  function field(c,run,e,age,p,low){
    const a=run.coreArena,surface=a.surfaceY-run.cameraY;
    const fade=1-smooth((age-(e.finisher?1000:820))/350),count=low?5:e.finisher?9:7;
    if(age<235||fade<=.002)return;
    const wake=smooth((age-235)/140);
    // A shared fractured mass inside the core anchors the slabs; no crown at its outline.
    stamp(c,breach,a.x,surface+68,340+p*60,100+p*20,wake*fade);
    stamp(c,mist,a.x,surface+65,370+p*45,100,wake*fade*.32);
    for(let i=0;i<count;i++){
      const x=a.x-155+i/(count-1)*310+Math.sin(i*7.1)*10,dx=x-a.x;
      const y=VFX.coreSurfaceY(run,x)+58+(i%3)*17;
      const angle=Math.sin(i*2.1)*.26+dx/418*.35;
      const delay=245+Math.abs(dx)/170*65+(i%3)*10,q=clamp((age-delay)/70);
      if(q<=0)continue;
      const thrust=1-(1-q)**3,variety=.72+.38*(1-Math.abs(dx)/200)+.15*Math.sin(i*5.1)**2;
      const h=(e.finisher?150+p*100:85+p*95)*variety,w=(e.finisher?42+p*18:30+p*16)*variety;
      const travel=h*.82*(1-thrust),baseX=x-Math.sin(angle)*travel,baseY=y+Math.cos(angle)*travel;
      c.save();c.beginPath();c.rect(x-w*3,surface-h*1.6,w*6,y-surface+h*1.6+12);c.clip();
      spike(c,baseX,baseY,w,h,angle,fade*smooth(q/.22),i);c.restore();
      stamp(c,puncture,x,y+2,w*1.1,18,fade*Math.min(1,q*3),angle*.35);
      stamp(c,hot,x,y,34+p*20,20+p*13,Math.sin(q*Math.PI)*fade*.85);
      const burst=clamp((age-delay-12)/230);
      if(burst>0&&burst<1)for(let j=0;j<(low?2:4);j++){
        const side=j%2?1:-1,dist=burst*(25+p*35)*(1+j*.18);
        stamp(c,spikes[(i+j)%5],x+side*dist,y-Math.sin(burst*Math.PI)*(24+p*25)+burst*burst*18,7+p*4,14+p*8,(1-burst)*fade*.8,side*(.4+burst*1.3));
      }
    }
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.frost||run.evacuation||!VFX.onScreen(run))return;prepare();
    const s=run.slime,y=s.y-run.cameraY,t=VFX.clock(e)*(e.reduced?.16:1),p=strength(e),low=e.lowPower||e.reduced;
    const age=e.phase==='burn'?e.phaseTime:e.phase==='afterglow'?1100+e.phaseTime:-1;
    c.save();if(p>.002)charge(c,e,s,y,t,p,low,front);
    if(!front&&age>=0){roots(c,run,e,age,e.power,low);field(c,run,e,age,e.power,low);}c.restore();
  }
  function backdrop(c,run){
    const e=run.coreEncounter;if(!e?.frost||run.evacuation||!VFX.onScreen(run))return;prepare();
    const alpha=e.phase==='release'?.34:['approach','overdrive','armed'].includes(e.phase)?e.transfer*.20:e.phase==='burn'?.15*(1-clamp(e.phaseTime/200)):0;
    if(alpha>.001){c.save();c.globalAlpha=alpha;c.drawImage(vignette,0,0,440,840);c.restore();}
    const p=weatherStrength(e);if(p<=.002)return;
    const t=VFX.clock(e)*(e.reduced?.16:1),low=e.lowPower||e.reduced;
    c.save();c.globalAlpha=p*.64;c.drawImage(coldWash,0,0,440,840);c.restore();
    for(let i=0;i<(low?3:6);i++){
      const side=i%2?1:-1,x=(side<0?0:440)+Math.sin(t/1700+i)*16,y=170+(i*.317%1)*490;
      stamp(c,mist,x,y,120+p*185,70+p*80,p*(.12+(i%3)*.025));
    }
    for(let i=0;i<(low?10:14+Math.round(p*20));i++){
      const seed=i*.618%1,q=(t/(1900+i%5*170)+i*.317)%1;
      const x=-60+((seed*560+t*(.045+seed*.035))%560),y=90+q*720,w=(2+p*4)*(.6+seed*.8);
      stamp(c,i%7===0?flake:snowDust,x,y,w*(i%7===0?2.5:1),w*(i%7===0?2.5:1.8),Math.sin(q*Math.PI)*p*(.35+seed*.35),-.8+t/9000);
    }
  }
  window.SlimeFrostCoreStrike=Object.freeze({prepare,draw,backdrop});
})();
