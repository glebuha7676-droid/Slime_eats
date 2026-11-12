/* Electric ability palette and rounded layered arcs; shared choreography with the fire finisher. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const TAU=Math.PI*2,COUNT=24,ORB_SIZE=320,ORB_CENTRE=160,auras=[],points=new Float32Array(50);
  let halo,hot,spark,vignette,mix,mixCtx;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){
    const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    for(const [p,col]of stops)g.addColorStop(p,col);x.fillStyle=g;x.fillRect(0,0,size,size);return c;
  }
  function auraFrame(a){
    const c=canvas(ORB_SIZE,ORB_SIZE),x=c.getContext('2d'),pulse=1+Math.sin(a*2)*.025;
    x.translate(ORB_CENTRE,ORB_CENTRE);x.scale(pulse,pulse);
    x.globalCompositeOperation='lighter';x.drawImage(halo,-117,-117,234,234);
    x.globalCompositeOperation='source-over';
    const g=x.createRadialGradient(0,0,2,0,0,69);
    for(const [p,col]of [[0,'#fffffff2'],[.20,'#efffffe6'],[.42,'#bcefffc9'],[.66,'#79b8ff94'],[.86,'#9c8bff57'],[1,'#8271ff00']])g.addColorStop(p,col);
    x.fillStyle=g;x.shadowColor='#8a79ff';x.shadowBlur=22;x.beginPath();x.arc(0,0,69,0,TAU);x.fill();x.shadowBlur=0;
    // Bright soft heart, without decorative rings or moving inner curves.
    x.globalCompositeOperation='lighter';x.globalAlpha=.25+Math.sin(a*2)*.035;const heart=84+Math.sin(a)*5;x.drawImage(hot,-heart/2,-heart/2,heart,heart);
    x.shadowBlur=0;x.globalAlpha=1;
    // Short radial shots have their own envelopes; no continuously drawn spokes.
    for(let i=0;i<10;i++){
      const q=(a/TAU*(1+i%3)+i*.193)%1;if(q>.25)continue;
      const life=q/.25,angle=i*2.399+Math.sin(a+i)*.09,reach=60+(28+i%4*16)*Math.sin(life*Math.PI*.7);
      const end=Math.sin(angle)>.55?Math.min(91,reach):reach,alpha=Math.sin(life*Math.PI)**.7;
      const from=10+i%3*4,segments=9,coords=[];
      for(let j=0;j<=segments;j++){const f=j/segments,r=from+(end-from)*f,n=(Math.sin(f*24+a*(2+i%2)+i)*5+Math.sin(f*45-a*3+i)*3)*Math.sin(f*Math.PI);coords.push([Math.cos(angle)*r-Math.sin(angle)*n,Math.sin(angle)*r+Math.cos(angle)*n]);}
      for(const [w,color,k]of [[12,'#7464ff',.15],[6,'#80bdff',.40],[2.4,'#c3f5ff',.9],[.9,'#ffffff',1]]){
        x.globalAlpha=alpha*k;x.lineWidth=w;x.lineCap=x.lineJoin='round';x.strokeStyle=color;x.beginPath();x.moveTo(...coords[0]);for(let j=1;j<coords.length;j++)x.lineTo(...coords[j]);x.stroke();
      }
      if(i%2===0){x.globalAlpha=alpha*.6;x.drawImage(hot,Math.cos(angle)*end-9,Math.sin(angle)*end-9,18,18);}
    }
    return c;
  }
  function prepare(){
    if(halo)return;
    // Same blue / violet / white colours as the existing electric bolts and impacts.
    halo=radial(128,[[0,'#e8ffffa0'],[.24,'#a9e7ff6e'],[.58,'#797af136'],[1,'#6555ed00']]);
    hot=radial(128,[[0,'#ffffff'],[.13,'#e0ffffec'],[.38,'#8edbff91'],[.68,'#7772f42c'],[1,'#7772f400']]);
    vignette=radial(128,[[0,'#0b123500'],[.46,'#0b123500'],[1,'#0b1235df']]);
    spark=canvas(24,32);const x=spark.getContext('2d');x.drawImage(halo,0,0,24,32);x.fillStyle='#efffff';x.beginPath();x.ellipse(12,16,2,3.4,-.2,0,TAU);x.fill();
    for(let i=0;i<COUNT;i++)auras.push(auraFrame(i/COUNT*TAU));
    mix=canvas(ORB_SIZE,ORB_SIZE);mixCtx=mix.getContext('2d');
  }
  const stamp=VFX.stamp;
  function globe(c,time,x,y,radius,alpha){
    if(alpha<=.002||!VFX.visible(x,y,radius*5,radius*5))return;
    VFX.blend(auras,mix,time,COUNT);
    stamp(c,mix,x,y,radius*5,radius*5,alpha);
  }
  // Smoothly moving bends, with fixed endpoints. No random path rebuilds or live blur.
  function arc(c,x1,y1,x2,y2,width,amplitude,time,seed,alpha=1){
    const dx=x2-x1,dy=y2-y1,length=Math.hypot(dx,dy)||1,segments=Math.min(24,Math.max(7,Math.ceil(length/17)));
    for(let i=0;i<=segments;i++){
      const f=i/segments,shape=Math.sin(f*Math.PI);
      const n=Math.sin(f*29+seed+time*.024)*.56+Math.sin(f*57-seed*1.7-time*.037)*.31+Math.sin(f*13+time*.009+seed)*.35;
      const offset=n*amplitude*shape;
      points[i*2]=x1+dx*f-dy/length*offset;points[i*2+1]=y1+dy*f+dx/length*offset;
    }
    c.save();c.lineCap=c.lineJoin='round';
    for(let layer=0;layer<4;layer++){
      c.globalAlpha=alpha*[.12,.30,.80,.97][layer];c.strokeStyle=['#7772ed','#849fff','#a9edff','#f7ffff'][layer];
      c.lineWidth=[width+13,width+6,width+2,Math.max(.8,width*.42)][layer];
      c.beginPath();c.moveTo(points[0],points[1]);for(let i=1;i<=segments;i++)c.lineTo(points[i*2],points[i*2+1]);c.stroke();
    }
    c.restore();
  }
  function charge(c,e,s,y,t,p,low,front){
    if(p<=.002)return;
    const x=s.x,r=s.radius,orbR=r*(.30+1.45*Math.sqrt(p)),cy=y-r*.12;
    if(!front){
      stamp(c,halo,x,cy,orbR*4,orbR*4,p*.50);
      globe(c,t/1380,x,cy,orbR,p*.85);
      const count=low?10:28;
      for(let i=0;i<count;i++){
        const q=(t/(850+i%5*115)+i*.217)%1,a=i*2.399+q*.52,range=orbR*(.12+2.2*(1-q)**.8);
        const px=x+Math.cos(a)*range,py=cy+Math.sin(a)*range*.83;
        const size=(4+p*4)*(1-q*.4),fade=Math.sin(q*Math.PI)*Math.sqrt(p);
        stamp(c,spark,px,py,size,size*1.5,fade*.92,a-Math.PI/2);
        if(!low&&i%7===0&&q>.65)stamp(c,hot,px,py,12,12,fade*.26);
      }
    }else for(const side of [-1,1])stamp(c,halo,x+side*r*.85,y-r*.05,r*.8,r*1.5,p*.18);
  }
  function surfaceArc(c,run,x1,x2,width,time,seed,depth,alpha){
    const segments=20;
    for(let i=0;i<=segments;i++){
      const f=i/segments,x=x1+(x2-x1)*f;
      points[i*2]=x;points[i*2+1]=VFX.coreSurfaceY(run,x,depth)+(Math.sin(f*31+time*.023+seed)*4+Math.sin(f*57-time*.03)*2)*Math.sin(f*Math.PI);
    }
    c.save();c.lineCap=c.lineJoin='round';
    for(let layer=0;layer<3;layer++){
      c.globalAlpha=Math.min(1,alpha*[.16,.55,.94][layer]);c.strokeStyle=['#7772ed','#a0cfff','#f4ffff'][layer];c.lineWidth=[width+9,width+3,Math.max(.8,width*.45)][layer];
      c.beginPath();c.moveTo(points[0],points[1]);for(let i=1;i<=segments;i++)c.lineTo(points[i*2],points[i*2+1]);c.stroke();
    }c.restore();
  }
  function discharge(c,run,e,y,t,low){
    const s=run.slime,p=e.power,intensity=e.jet*(.48+.52*p),reach=clamp(e.phaseTime/70),start=y+s.radius*.48,end=run.coreArena.surfaceY-run.cameraY;
    const peak=e.strikeEnergy!=null?(e.finisher||e.strikeEnergy>=75):p>=.99;
    const count=e.finisher?(low?5:11):peak?(low?4:7):Math.min(low?3:6,1+Math.floor(p*5)),width=1.1+p*6.5+(peak?7:0),spread=12+p*94+(peak?20:0);
    stamp(c,hot,s.x,start,24+p*78+(peak?35:0),30+p*84,intensity*(peak?.95:.8));
    stamp(c,halo,s.x,(start+end)*.5,40+p*190+(peak?65:0),(end-start)*1.1,intensity*(peak?.65:.42));
    if(peak)for(let j=0;j<(low?1:3);j++){
      const f=.22+j*.29,pulse=.82+.18*Math.sin(t/48+j*2.1);
      stamp(c,hot,s.x+Math.sin(t/85+j)*12,start+(end-start)*f*reach,90,115,intensity*pulse*.34);
    }
    for(let i=0;i<count;i++){
      const side=count===1?0:i/(count-1)*2-1,rootX=s.x+side*s.radius*.36,targetX=run.coreArena.x+side*spread;
      const depth=(i%3)*13,targetY=start+(VFX.coreSurfaceY(run,targetX,depth)-start)*reach;
      arc(c,rootX,start,rootX+(targetX-rootX)*reach,targetY,width*(i===Math.floor(count/2)?(peak?1.28:1):.65),7+p*22+(peak?7:0),t*(peak?1.18:1),i*3.7,intensity*(.87+.10*Math.sin(t/80+i)));
      if(!low&&p>.35&&i%2===0&&reach===1){
        const branchY=start+(end-start)*.57;
        const bx=targetX+side*(15+p*22);
        arc(c,s.x+side*spread*.5,branchY,bx,VFX.coreSurfaceY(run,bx,depth+10),width*(peak?.45:.35),6+p*12,t,i*3.7+9,intensity*(peak?.78:.52));
      }
      if(e.hit&&i%2===0)stamp(c,hot,targetX,VFX.coreSurfaceY(run,targetX,depth),38+p*38,22+p*22,intensity*.55);
    }
    if(!e.hit)return;
    const age=(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt);
    stamp(c,hot,run.coreArena.x,end,70+p*255+(peak?65:0),38+p*110+(peak?25:0),intensity*.95);
    const sparks=low?6:peak?24:17;
    for(let i=0;i<sparks;i++){
      const q=(age/(440+i%4*65)+i*.193)%1,a=Math.PI+Math.PI*(i+.5)/sparks,range=q*(28+p*140);
      const px=run.coreArena.x+Math.cos(a)*range;
      stamp(c,spark,px,VFX.coreSurfaceY(run,px)+Math.sin(a)*range*.7+30*q*q,4+p*4,8+p*7,intensity*(1-q)*.92,a+Math.PI/2);
    }
    for(let i=0;i<(low?2:4);i++){
      const side=i%2?1:-1,offset=i<2?0:1;
      const tip=run.coreArena.x+side*(25+p*(55+offset*48));
      surfaceArc(c,run,run.coreArena.x+side*12,tip,.9+p*1.5,t,i+12,8+offset*22,intensity*(offset?.48:.84));
    }
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.electric||run.evacuation||!VFX.onScreen(run))return;prepare();
    const s=run.slime,y=s.y-run.cameraY,t=VFX.clock(e)*(e.reduced?.16:1),p=clamp(e.aura,0,e.finisher?1.5:1),low=e.lowPower||e.reduced;
    if(p<.002&&!e.jet)return;c.save();charge(c,e,s,y,t,p,low,front);
    if(!front&&e.phase==='burn'&&e.jet>.001)discharge(c,run,e,y,t,low);c.restore();
  }
  function backdrop(c,run){
    const e=run.coreEncounter;if(!e?.electric||run.evacuation||!VFX.onScreen(run))return;prepare();
    const alpha=e.phase==='release'?.35:['approach','overdrive','armed'].includes(e.phase)?e.transfer*.21:e.phase==='burn'?.17*(1-clamp(e.phaseTime/160)):0;
    if(alpha>.001){c.save();c.globalAlpha=alpha;c.drawImage(vignette,0,0,440,840);c.restore();}
  }
  window.SlimeElectricCoreStrike=Object.freeze({prepare,draw,backdrop});
})();
