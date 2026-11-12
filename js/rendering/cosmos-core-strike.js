/* The actual stage-III comet aura is baked by the game's existing painter. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const TAU=Math.PI*2,FRAMES=12,BLAST_FRAMES=20,back=[],front=[],blasts=[];
  const BACK={w:288,h:480,x:144,y:320},FRONT={w:224,h:224,x:112,y:112};
  let halo,hot,ring,star,vignette,trail,mixBack,mixFront,mixBlast,cloud;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){
    const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    for(const [p,col]of stops)g.addColorStop(p,col);x.fillStyle=g;x.fillRect(0,0,size,size);return c;
  }
  function feather(c){
    const x=c.getContext('2d'),m=18;
    x.save();x.globalCompositeOperation='destination-in';
    for(const axis of [0,1]){const n=axis?c.height:c.width,g=x.createLinearGradient(0,0,axis?0:n,axis?n:0);g.addColorStop(0,'#0000');g.addColorStop(m/n,'#000');g.addColorStop(1-m/n,'#000');g.addColorStop(1,'#0000');x.fillStyle=g;x.fillRect(0,0,c.width,c.height);}
    x.restore();
  }
  function prepare(painter){
    if(!halo){
      halo=radial(128,[[0,'#fff2ffab'],[.25,'#e278ff71'],[.6,'#792aff38'],[1,'#2e109b00']]);
      hot=radial(128,[[0,'#fff'],[.15,'#fff2ffeb'],[.36,'#ecaaff9c'],[.68,'#9d45ff32'],[1,'#9d45ff00']]);
      ring=radial(128,[[0,'#b767ff00'],[.27,'#b767ff00'],[.47,'#c993ff20'],[.61,'#ecd4ff58'],[.74,'#aa64ff39'],[1,'#aa64ff00']]);
      cloud=radial(128,[[0,'#fcddffc4'],[.2,'#db86ffb0'],[.48,'#a138ff75'],[.74,'#6d17db2b'],[1,'#5e19bd00']]);
      vignette=radial(128,[[0,'#17103200'],[.45,'#17103200'],[1,'#171032df']]);
      star=canvas(32,32);let c=star.getContext('2d');c.drawImage(halo,0,0,32,32);c.fillStyle='#fff2ff';c.beginPath();c.moveTo(16,8);c.quadraticCurveTo(17,15,23,16);c.quadraticCurveTo(17,17,16,24);c.quadraticCurveTo(15,17,9,16);c.quadraticCurveTo(15,15,16,8);c.fill();
      trail=canvas(96,256);c=trail.getContext('2d');let g=c.createLinearGradient(0,0,96,0);
      for(const [p,col]of [[0,'#662bf200'],[.20,'#662bf24f'],[.42,'#d25aff99'],[.50,'#fff2ffca'],[.58,'#d25aff99'],[.8,'#662bf24f'],[1,'#662bf200']])g.addColorStop(p,col);
      c.fillStyle=g;c.fillRect(0,0,96,256);c.globalCompositeOperation='destination-in';g=c.createLinearGradient(0,0,0,256);g.addColorStop(0,'#0000');g.addColorStop(.3,'#0007');g.addColorStop(1,'#000');c.fillStyle=g;c.fillRect(0,0,96,256);
      // Volumetric burst is baked once: layered soft plasma, no contour arcs.
      for(let i=0;i<BLAST_FRAMES;i++){
        const q=i/(BLAST_FRAMES-1),b=canvas(320,224),x=b.getContext('2d'),spread=Math.pow(q,.6),fade=(1-q)**1.4;
        x.globalCompositeOperation='lighter';
        for(let j=0;j<9;j++){
          const a=Math.PI+(j+.5)/9*Math.PI,d=(22+spread*96)*(1+(j%3)*.07),w=38+spread*(39+j%3*8);
          stamp(x,cloud,160+Math.cos(a)*d,145+Math.sin(a)*d*.75,w*1.4,w,fade*(.68+j%2*.12));
        }
        stamp(x,cloud,160,142,160+spread*145,105+spread*72,fade*.9);
        stamp(x,hot,160,147,105+spread*110,65+spread*65,Math.max(0,1-q*2.1));
        feather(b);blasts.push(b);
      }
      mixBlast=canvas(320,224);
    }
    if(painter&&!back.length){
      for(let i=0;i<FRAMES;i++){
        const t=i/FRAMES*TAU*72,b=canvas(BACK.w,BACK.h),f=canvas(FRONT.w,FRONT.h);
        painter(b.getContext('2d'),t,BACK.x,BACK.y,30,false);painter(f.getContext('2d'),t,FRONT.x,FRONT.y,30,true);feather(b);feather(f);back.push(b);front.push(f);
      }
      mixBack=canvas(BACK.w,BACK.h);mixFront=canvas(FRONT.w,FRONT.h);
    }
  }
  const stamp=VFX.stamp;
  function aura(c,e,s,y,t,isFront){
    if(!back.length||e.aura<=.002)return;
    const frames=isFront?front:back,mixed=isFront?mixFront:mixBack;
    const p=clamp(e.aura,0,e.finisher?1.5:1),scale=s.radius/30*(.42+.58*Math.sqrt(p)),rotation=['burn','rebound'].includes(e.phase)?(e.flightAngle??0):0;
    const bounds=isFront?FRONT:BACK,span=(bounds.w+bounds.h)*scale;
    if(!VFX.visible(s.x,y,span,span))return;
    VFX.blend(frames,mixed,t/452.39,FRAMES);
    const fade=e.hit?1-smooth(((e.finisher?(e.attackAge||0):e.elapsed-e.hitAt))/150):1;
    c.save();c.globalCompositeOperation='lighter';c.translate(s.x,y);c.rotate(rotation);c.globalAlpha=p*fade;
    c.drawImage(mixed,-bounds.x*scale,-bounds.y*scale,bounds.w*scale,bounds.h*scale);
    c.restore();
  }
  function draw(c,run,isFront=false){
    const e=run.coreEncounter;if(!e?.cosmos||run.evacuation||!VFX.onScreen(run))return;prepare();
    const s=run.slime,y=s.y-run.cameraY,t=VFX.clock(e)*(e.reduced?.16:1),p=e.power,low=e.lowPower||e.reduced;
    c.save();
    if(!isFront){
      const hitAge=e.hit?(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt):0;
      if(e.phase==='burn'||e.hit&&hitAge<180){
        const endX=e.hit?e.contactX:s.x,endY=(e.hit?e.contactSlimeY:s.y)-run.cameraY,dx=endX-e.castX,dy=endY-(e.castY-run.cameraY),length=Math.hypot(dx,dy);
        const alpha=e.hit?1-smooth(hitAge/180):1;
        if(length>5){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha*(.25+.6*p);c.translate(e.castX,e.castY-run.cameraY);c.rotate(Math.atan2(dy,dx)-Math.PI/2);c.drawImage(trail,-s.radius*(.7+p),0,s.radius*(1.4+2*p),length);c.restore();}
      }
      if(e.aura>.002){
        stamp(c,halo,s.x,y,s.radius*(3+3*e.aura),s.radius*(3+3*e.aura),e.aura*.42);
        if(['approach','overdrive','armed','release'].includes(e.phase))for(let i=0;i<(low?6:14);i++){
          const q=(t/(700+i%3*110)+i*.193)%1,a=i*2.399+t/1600,r=s.radius*(3.2+i%3*.3)*(1-q)**.75;
          stamp(c,star,s.x+Math.cos(a)*r,y+Math.sin(a)*r*.8,5+e.aura*4,5+e.aura*4,Math.sin(q*Math.PI)*Math.sqrt(e.aura)*.85,t/1200+i);
        }
      }
      if(e.hit&&hitAge<1000){
        const q=clamp(hitAge/1000),x=e.contactX,cy=e.contactY-run.cameraY,fade=(1-q)**1.8;
        VFX.blend(blasts,mixBlast,q*(BLAST_FRAMES-1),BLAST_FRAMES,false);
        const width=180+p*430,height=110+p*250;
        stamp(c,halo,x,cy,200+p*440,115+p*260,fade*(.45+p*.3));
        stamp(c,mixBlast,x,cy-height*.15,width,height,1);
        stamp(c,hot,x,cy,65+p*165,45+p*95,Math.max(0,1-hitAge/230));
        stamp(c,ring,x,cy,90+(110+p*310)*Math.sqrt(q),45+(45+p*125)*Math.sqrt(q),fade*.52);
        for(let i=0;i<(low?6:10+Math.round(p*8));i++){
          const a=Math.PI+((i*.618+.23)%1)*Math.PI,d=Math.pow(q,.65)*(70+p*210)*(.42+(i*.373%1)*.74),sz=(3+p*5)*(.6+(i*.217%1)*.8)*(1-q*.6);
          stamp(c,star,x+Math.cos(a)*d,cy+Math.sin(a)*d*.70+q*q*80,sz,sz,fade*.9,a+t/500);
        }
      }
      if(e.finisher&&e.hit){
        const age=e.elapsed-e.hitAt,q=clamp(age/600),fade=(1-q)**1.8,x=e.contactX,cy=e.contactY-run.cameraY;
        c.save();c.globalCompositeOperation='lighter';
        stamp(c,halo,x,cy,440+q*520,260+q*310,fade*.88);
        stamp(c,hot,x,cy,220+Math.sqrt(q)*350,140+Math.sqrt(q)*210,(1-clamp(age/260))*.98);
        stamp(c,ring,x,cy,160+Math.sqrt(q)*850,75+Math.sqrt(q)*330,fade*.95);
        for(let i=0;i<(low?6:18);i++){
          const angle=Math.PI+(i+.4)/(low?6:18)*Math.PI,d=Math.sqrt(q)*(130+(i%4)*46),sz=(14+i%3*6)*(1-q*.65);
          stamp(c,star,x+Math.cos(angle)*d,cy+Math.sin(angle)*d*.75,sz,sz,fade*.95,angle);
        }c.restore();
      }
    }
    aura(c,e,s,y,t,isFront);
    if(isFront&&e.hit){const age=(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt);stamp(c,hot,e.contactX,e.contactY-run.cameraY,70+p*180,55+p*100,Math.max(0,1-age/150)*.75);}
    c.restore();
  }
  function backdrop(c,run){
    const e=run.coreEncounter;if(!e?.cosmos||run.evacuation||!VFX.onScreen(run))return;prepare();
    const alpha=e.phase==='release'?.36:['approach','overdrive','armed'].includes(e.phase)?e.transfer*.21:e.phase==='burn'?.16:0;
    if(alpha>.001){c.save();c.globalAlpha=alpha;c.drawImage(vignette,0,0,440,840);c.restore();}
    if(e.hit&&!e.reduced){const flash=1-clamp(((e.finisher?(e.attackAge||0):e.elapsed-e.hitAt))/140);if(flash>0){c.save();c.globalAlpha=flash*flash*(.025+.075*e.power);c.fillStyle='#f5d8ff';c.fillRect(0,0,440,840);c.restore();}}
  }
  window.SlimeCosmosCoreStrike=Object.freeze({prepare,draw,backdrop});
})();
