/* The three Infinity forms share the mine finale but choreograph distinct sphere strikes. */
(() => {
  'use strict';
  const {stamp,clock,onScreen,coreSurfaceY}=window.SlimeCoreVfx;
  const {drawEnergyOrb,drawEnergyWake}=window.SlimeInfinity;
  const clamp=t=>Math.max(0,Math.min(1,t));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const lerp=(a,b,p)=>a+(b-a)*p;
  const TAU=Math.PI*2;
  const PALETTES={
    blue:{core:'#69cbff',edge:'#406aff',white:'#ddfaff',radius:20},
    red:{core:'#ff7a9d',edge:'#f52e68',white:'#ffe2ea',radius:24},
    purple:{core:'#d790ff',edge:'#7950fa',white:'#fff0ff',radius:36}
  };
  let vignette;

  function prepare(){
    if(vignette)return;
    vignette=document.createElement('canvas');vignette.width=220;vignette.height=420;
    const c=vignette.getContext('2d'),shade=c.createRadialGradient(110,175,25,110,175,255);
    shade.addColorStop(0,'#08052519');shade.addColorStop(.57,'#08052166');shade.addColorStop(1,'#060318e8');
    c.fillStyle=shade;c.fillRect(0,0,220,420);
    for(const palette of Object.values(PALETTES)){
      const light=document.createElement('canvas');light.width=light.height=128;
      const pen=light.getContext('2d'),g=pen.createRadialGradient(64,64,0,64,64,64);
      g.addColorStop(0,palette.white);g.addColorStop(.15,palette.core+'d9');
      g.addColorStop(.39,palette.edge+'77');g.addColorStop(.72,palette.edge+'29');g.addColorStop(1,palette.edge+'00');
      pen.fillStyle=g;pen.fillRect(0,0,128,128);palette.glow=light;
    }
  }

  function ellipse(c,x,y,rx,ry,turn,start,end){
    c.beginPath();c.ellipse(x,y,rx,ry,turn,start,end);c.stroke();
  }

  function aura(c,x,y,strength,time,e,front){
    if(strength<.006)return;
    const {shot}=e.infinity,palette=PALETTES[shot],low=e.lowPower||e.reduced;
    const spread=46+e.power*35;
    c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
    if(!front){
      stamp(c,palette.glow,x,y+9,spread*3.65,spread*3.0,strength*.26);
      if(shot==='purple'){
        stamp(c,PALETTES.blue.glow,x-spread*.54,y-10,spread*2,spread*2.2,strength*.22);
        stamp(c,PALETTES.red.glow,x+spread*.61,y+22,spread*2,spread*2.1,strength*.16);
      }
    }
    const count=low?7:front?14:25;
    if(!e.reduced)for(let i=0;i<count;i++){
      const age=(time/(725+(i%6)*116)+i*.371)%1;
      const a=i*2.39996+age*(i%2===0?1.45:-1.97)+Math.sin(time/880+i)*.3;
      const dist=spread*(1.45-.88*age)*(front?.81:1);
      const px=x+Math.cos(a)*dist,py=y+12+Math.sin(a)*dist*.75;
      const length=(2+i%4)*(1.05-age*.44)*(e.finisher?1.4:1);
      const tint=shot==='purple'&&i%4<2?PALETTES[i%4===0?'blue':'red']:palette;
      c.globalAlpha=strength*Math.sin(age*Math.PI)*(front?.74:.94);
      c.strokeStyle=i%3?tint.core:tint.white;c.lineWidth=i%6===0?1.7:.85;
      c.beginPath();c.moveTo(px,py);
      c.lineTo(px+Math.cos(a+1.12)*length,py+Math.sin(a+1.12)*length);c.stroke();
    }
    if(front&&strength>.1){
      const rotation=e.reduced?-.24:-.22+Math.sin(time/470)*.14;
      c.globalAlpha=strength*.52;c.strokeStyle=palette.core;c.lineWidth=1+e.power*.6;
      ellipse(c,x,y+14,spread*.83,spread*.47,rotation,.32,2.3);
      c.globalAlpha=strength*.33;c.strokeStyle=palette.white;c.lineWidth=.9;
      ellipse(c,x,y+10,spread*.99,spread*.59,-rotation,2.8,3.76);
    }
    c.restore();
  }

  function spheres(c,run,e,age,time){
    const s=run.slime,p=e.infinity,low=e.lowPower||e.reduced;
    const x=e.castX??s.x,y=(e.castY??s.y)-run.cameraY;
    const charge=smooth((e.transfer-.09)/.87),limit=e.overdrive||0;
    const size=10+24*e.power+9*limit;
    const bob=e.reduced?0:Math.sin(time/350)*5;
    const startY=y+s.radius*.72+28;
    if(p.shot!=='purple'){
      const tuck=smooth(age/p.launch),side=p.shot==='red'?1:-1;
      drawEnergyOrb(c,x+side*(60+18*e.power)*(1-tuck),startY+bob*(1-tuck),size*charge*(1-.22*tuck),p.shot,time,low,charge);
      return;
    }
    const fold=smooth(age/p.fusion);
    const gap=(63+20*e.power+8*limit)*(1-fold);
    const bend=e.reduced?0:Math.sin(fold*Math.PI)*31;
    const blue=smooth((charge-.045)/.85),red=smooth((charge-.19)/.72);
    const fade=1-smooth((fold-.75)/.25);
    drawEnergyOrb(c,x-gap,startY-12*(1-fold)-bend+bob*(1-fold),size*blue*(1-.23*fold),'blue',time,low,fade*blue);
    drawEnergyOrb(c,x+gap,startY+10*(1-fold)+bend-bob*(1-fold),size*red*(1-.23*fold),'red',time-123,low,fade*red);
    const fused=smooth((age-p.fusion+43)/127);
    if(fused){
      const growing=smooth((age-p.fusion)/(p.launch-p.fusion));
      const burst=Math.exp(-Math.abs(age-p.fusion)*.013);
      const scale=lerp(.47,.83,growing)+.12*burst;
      c.save();c.globalCompositeOperation='lighter';
      stamp(c,PALETTES.purple.glow,x,startY,(e.finisher?318:232)*burst,76*burst,burst*(e.reduced?.26:.81));
      c.restore();
      drawEnergyOrb(c,x,startY,projectileRadius(e)*scale,'purple',time,low,fused);
    }
  }

  function projectileRadius(e){
    const base=PALETTES[e.infinity.shot].radius;
    return base+e.power*(base*.68)+(e.finisher?base*.20:0);
  }

  function flight(c,run,e,time){
    const p=e.infinity,s=run.slime,x=e.castX,ground=coreSurfaceY(run,x,e.contactDepth);
    const start=e.castY-run.cameraY+s.radius*.72+28;
    const t=clamp((e.phaseTime-p.launch)/(p.hit-p.launch)),position=t*t*(1.64-.64*t);
    const radius=projectileRadius(e)*lerp(p.shot==='purple'?.83:.67,1,position);
    const y=lerp(start,ground-radius*.77,position);
    const wake=Math.min(y-start+25,(e.finisher?180:118)*smooth(t/.64));
    drawEnergyWake(c,x,y,radius,wake,p.shot,time,.84);
    drawEnergyOrb(c,x,y,radius,p.shot,time,e.reduced||e.lowPower);
  }

  function wave(c,x,y,r,t,palette,inward){
    if(t<0||t>=1)return;
    const spread=r*(inward?lerp(1,.11,smooth(t)):.18+.82*Math.pow(t,.62));
    const opacity=inward?Math.sin(t*Math.PI)*.92:(1-t)**1.55;
    c.globalAlpha=opacity;c.lineWidth=1.3+3.5*(1-t);c.strokeStyle=palette.core;
    ellipse(c,x,y,spread,spread*.28,-.04,0,TAU);
    c.globalAlpha=opacity*.88;c.strokeStyle=palette.white;c.lineWidth=1.2;
    ellipse(c,x,y-2,spread*.91,spread*.23,.025,.14,2.91);
  }

  function collision(c,run,e,time){
    const age=e.elapsed-e.hitAt,shot=e.infinity.shot,palette=PALETTES[shot],x=e.castX;
    const ground=coreSurfaceY(run,x,e.contactDepth),r=projectileRadius(e);
    const strength=clamp(.31+e.power*.51+(e.finisher?.11:0));
    const fade=1-smooth((age-(e.finisher?1520:70))/(e.finisher?810:490));
    if(fade<=.003)return;
    c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
    const surge=e.finisher?smooth((age-820)/250)*(1-smooth((age-1110)/520)):0;
    const pulse=e.reduced?1:.86+.14*Math.sin(time/87)+.28*surge;
    const lightWidth=(shot==='purple'?5.35:4.25)*r;
    const compressed=smooth(age/(shot==='blue'?290:195));
    if(compressed<1){
      drawEnergyOrb(c,x,ground-r*.77*(1-compressed),r*(1-compressed*.89),shot,time,e.reduced||e.lowPower,1-compressed*.82);
    }
    stamp(c,palette.glow,x,ground-17,lightWidth,lightWidth*.58,strength*fade*(e.reduced?.46:.96)*pulse);
    stamp(c,palette.glow,x,ground-19,lightWidth*(.6+smooth(age/340)),lightWidth*.31,strength*Math.exp(-age/240)*.88);
    if(!e.reduced){
      wave(c,x,ground,r*(shot==='purple'?3.65:3.25),age/525,palette,shot==='blue');
      if(shot==='blue')wave(c,x,ground,r*1.85,(age-275)/390,palette,false);
      if(shot==='purple'||e.finisher)wave(c,x,ground,r*(e.finisher?3.95:2.75),(age-236)/650,palette,false);
      if(e.finisher)wave(c,x,ground,r*4.3,(age-1020)/810,palette,false);
    }
    const count=e.reduced?0:e.lowPower?10:e.finisher?34:22;
    for(let i=0;i<count;i++){
      const start=i%5*26,cycle=e.finisher?620+i%7*87:530+i%6*75;
      const t=(e.finisher?(age-start)%cycle:age-start)/cycle;
      if(t<0||t>=1)continue;
      const a=Math.PI+(i+.28)*Math.PI/count,dist=r*(.28+3.1*(shot==='blue'?1-t:1-(1-t)**2));
      const px=x+Math.cos(a)*dist,py=coreSurfaceY(run,px,e.contactDepth)-4+Math.sin(a)*dist*.54;
      const tail=(3+i%5)*(1+e.power*.7);
      c.strokeStyle=i%4===0?palette.white:palette.core;c.lineWidth=i%6===0?2:1;
      c.globalAlpha=strength*fade*Math.sin(t*Math.PI);
      c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(a)*tail,py+Math.sin(a)*tail);c.stroke();
    }
    c.restore();
  }

  function draw(c,run,front=false){
    const e=run.coreEncounter;
    if(!e?.infinity||run.evacuation||!onScreen(run))return;
    prepare();
    const s=run.slime,time=clock(e),p=e.infinity,casting=e.phase==='burn';
    const preCast=e.phase==='approach'||e.phase==='overdrive'||e.phase==='armed'||e.phase==='release';
    const strength=clamp(e.aura*.84+e.transfer*.07)*(e.hit?.36:1);
    aura(c,s.x,s.y-run.cameraY,strength,time,e,front);
    if(front)return;
    if(preCast||(casting&&e.phaseTime<p.launch))spheres(c,run,e,casting?e.phaseTime:0,time);
    else if(casting&&!e.hit)flight(c,run,e,time);
    if(e.hit)collision(c,run,e,time);
  }

  function backdrop(c,run){
    const e=run.coreEncounter;
    if(!e?.infinity||run.evacuation)return;
    prepare();
    const cast=e.phase==='burn',age=e.hit?e.elapsed-e.hitAt:0;
    const dark=e.hit?.74*(1-smooth(age/(e.finisher?2000:800)))
      : e.transfer*(.49+.17*(e.overdrive||0)+(cast?.10:0));
    stamp(c,vignette,220,420,520,940,e.reduced?dark*.54:dark);
  }

  window.SlimeInfinityCoreStrike=Object.freeze({prepare,draw,backdrop});
})();
