/* Glitch finisher: soft RGB data cloud, downward rupture, displaced core layers and snap-back. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const TAU=Math.PI*2,tiles=[],echoes=[],shellTint=[],chips=[];
  let halo,magenta,hot,mote,pixel,vignette,coreSource,scene,sceneCtx,chroma,chromaCtx;
  let sceneOwner,sceneTick=-1,sceneHit,tintTick=-1,bufferScale=0;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);},lerp=(a,b,t)=>a+(b-a)*t;
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [p,color] of stops)g.addColorStop(p,color);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function prepare(){
    if(halo)return;
    halo=radial(128,[[0,'#ecffffcd'],[.24,'#98fff995'],[.58,'#40e8e93e'],[1,'#47d6f000']]);
    magenta=radial(128,[[0,'#fff1ffac'],[.26,'#ff8de57e'],[.58,'#d644df35'],[1,'#c740ed00']]);
    hot=radial(128,[[0,'#fff'],[.12,'#f4fffff5'],[.35,'#b6ffffb0'],[.62,'#86b7f146'],[1,'#9697f000']]);
    mote=radial(32,[[0,'#fff'],[.15,'#e0ffffd0'],[.45,'#83f8f666'],[1,'#83f8f600']]);
    vignette=radial(128,[[0,'#0b182f00'],[.48,'#0b182f00'],[1,'#24102fe0']]);
    scene=canvas(1,1);sceneCtx=scene.getContext('2d');
    chroma=canvas(1,1);chromaCtx=chroma.getContext('2d');
    pixel=canvas(16,16);const px=pixel.getContext('2d');px.drawImage(mote,0,0,16,16);px.fillStyle='#dffffb';px.fillRect(5,5,6,6);
    for(let i=0;i<3;i++){
      const c=canvas(48,48),x=c.getContext('2d'),color=['#8afff1','#ff8de6','#f6ffff'][i];
      x.drawImage(i===1?magenta:halo,0,0,48,48);x.shadowColor=color;x.shadowBlur=7;
      x.fillStyle=color;x.beginPath();x.roundRect(17,16,14,15,2);x.fill();x.shadowBlur=0;
      x.fillStyle='#fff';x.globalAlpha=.7;x.fillRect(19,18,5,5);tiles.push(c);
    }
  }
  function buffers(low){
    const scale=low?.5:1;
    if(scale!==bufferScale){scene.width=440*scale;scene.height=840*scale;chroma.width=low?1:440;chroma.height=low?1:840;bufferScale=scale;sceneOwner=null;}
    return scale;
  }
  function capture(painter,low=false){
    prepare();buffers(low);const body=canvas(128,128);painter(body.getContext('2d'));
    for(let i=0;i<2;i++){const c=canvas(128,128),x=c.getContext('2d');x.drawImage(body,0,0);x.globalCompositeOperation='source-in';x.fillStyle=i?'#ff76dc':'#70fff0';x.fillRect(0,0,128,128);echoes[i]=c;}echoes[2]=body;
  }
  const stamp=VFX.stamp;
  function rupture(run){
    const e=run.coreEncounter;if(!e?.glitch||run.evacuation||e.phase!=='burn')return 0;
    const t=e.phaseTime;return smooth((t-115)/205)*(1-smooth((t-320)/245));
  }
  function cacheShell(source){
    if(coreSource===source)return;coreSource=source;shellTint.length=0;chips.length=0;
    for(const color of ['#60ffed','#ff63df']){
      const c=canvas(256,256),x=c.getContext('2d');x.drawImage(source,0,0,256,256);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,256,256);shellTint.push(c);
    }
    for(let i=0;i<8;i++){
      const c=canvas(48,48),x=c.getContext('2d'),sx=source.width*(.21+(i%4)*.14),sy=source.height*(.10+Math.floor(i/4)*.10);
      x.drawImage(source,sx,sy,source.width*.09,source.height*.09,7,7,34,34);
      x.globalCompositeOperation='source-atop';x.globalAlpha=.5;x.fillStyle=i%2?'#ff75de':'#7bfff1';x.fillRect(0,0,48,48);chips.push(c);
    }
  }
  function drawShell(c,run,source,left,top,size){
    prepare();const e=run.coreEncounter,q=rupture(run);
    if(coreSource!==source)cacheShell(source);
    if(q<=.002){c.drawImage(source,left,top,size,size);return;}
    const low=e.lowPower||e.reduced,bands=low?12:32,shift=(e.reduced?2:8+42*e.power)*q,age=e.phaseTime;
    for(let i=0;i<bands;i++){
      const y=top+i/bands*size,h=size/bands;if(y>860||y+h<0)continue;
      const offset=Math.sin(i*8.71)*(i%3===0?1:.55)*shift*(.9+.1*Math.sin(age/55+i));
      if(!low){
        c.save();c.globalAlpha*=q*.34;c.drawImage(shellTint[i%2],0,i/bands*256,256,256/bands,left-offset*.65,y,size,h+.5);c.restore();
      }
      c.drawImage(source,0,i/bands*source.height,source.width,source.height/bands,left+offset,y,size,h+.5);
    }
  }
  function charge(c,run,front){
    const e=run.coreEncounter,s=run.slime,y=s.y-run.cameraY,p=clamp(e.aura,0,e.finisher?1.5:1),t=VFX.clock(e)*(e.reduced?.28:1),low=e.lowPower||e.reduced;
    if(p<=.002)return;
    if(!front){
      const size=s.radius*(3.2+p*5.8),breath=.93+.07*Math.sin(t/240);
      stamp(c,magenta,s.x+s.radius*.9,y-s.radius*.25,size*1.12,size*.98,p*.82*breath);
      stamp(c,halo,s.x-s.radius*.5,y,size*1.12,size,p*.90);
      stamp(c,hot,s.x,y-s.radius*.07,s.radius*(2+p*2.7),s.radius*(2+p*2.7),p*.56);
      // Brief chromatic afterimages of the actual equipped form, never a new skin.
      const beat=(t%300)/300,burst=Math.max(Math.sin(clamp((beat-.04)/.24)*Math.PI)**2,Math.sin(clamp((beat-.42)/.18)*Math.PI)**2),split=e.reduced?0:(.40+.60*burst)*p;
      const jump=Math.floor(t/32),offset=(4+7*Math.min(1.5,p))*Math.min(1,split)*(.8+.2*Math.sin(jump*5.9));
      if(split>.005)for(let i=0;i<2;i++){
        const side=i?1:-1;stamp(c,echoes[i],s.x+side*(offset+3),y+side*(1+2*p)*burst,s.radius*128/36,s.radius*128/36,split*.67);
        stamp(c,echoes[2],s.x+side*offset,y+side*(1+2*p)*burst,s.radius*128/36,s.radius*128/36,split*.36);
        if(!low&&echoes[i]&&p>.4&&burst>.10)for(let j=0;j<4;j++){
          const sy=26+j*17,sh=12,w=s.radius*128/36,h=w*sh/128,dx=side*(offset+Math.sin(j*8.7+jump)*6*p);
          c.save();c.globalAlpha*=split*.56;c.drawImage(echoes[i],0,sy,128,sh,s.x-w/2+dx,y-w/2+sy/128*w,w,h);c.restore();
        }
      }
    }
    const count=low?8:10+Math.round(e.power*14);
    for(let i=0;i<count;i++){
      if((i%4===0)!==front)continue;
      const q=(t/(1300+i%5*170)+i*.173)%1,a=i*2.399+q*TAU*1.2+t/1300,r=s.radius*(1.3+(1-q)*(1.1+p*2.3));
      const px=s.x+Math.cos(a)*r,py=y+Math.sin(a)*r*.75-q*s.radius*.5;
      const life=Math.sin(q*Math.PI),size=(10+p*28)*(1-q*.4),alpha=p*life*(front?.55:.92);
      stamp(c,tiles[i%3],px,py,size*(i%3===0?1.5:1),size,alpha);
      if(!low&&!front&&i%6===0)stamp(c,tiles[(i+1)%3],px+(i%2?1:-1)*size*.44,py+size*.30,size*.65,size*.40,alpha*.65);
      // Small detached strips of the real silhouette make the halo feel digitally unstable.
      if(!low&&!front&&i%9===1&&echoes[0]){
        const pulse=Math.sin(q*Math.PI)**3,sw=128,sh=12+(i%3)*7,sy=30+(i*13%55),w=s.radius*(1.3+p*.8),h=w*sh/sw;
        c.save();c.globalAlpha*=alpha*pulse*.28;c.drawImage(echoes[i%2],0,sy,sw,sh,px-w/2,py-h/2,w,h);c.restore();
      }
    }
    // Denser, smaller data pixels follow the vortex instead of a larger cloud of lights.
    const bits=low?8:12+Math.round(e.power*14);
    for(let i=0;i<bits;i++){
      if((i%5===0)!==front)continue;
      const q=(t/(1050+i%4*155)+i*.217)%1,a=i*2.399+q*TAU*1.8+t/1100,r=s.radius*(1.1+(1-q)*(1.1+p*2.9));
      const size=4+p*(3+i%3),alpha=Math.sin(q*Math.PI)*p*.9;
      stamp(c,pixel,s.x+Math.cos(a)*r,y+Math.sin(a)*r*.65-q*s.radius*.35,size,size,alpha);
    }
  }
  function wave(c,run){
    const e=run.coreEncounter,s=run.slime,p=e.power,t=e.phaseTime,low=e.lowPower||e.reduced,start=(e.castY??s.y)-run.cameraY+s.radius*.5,end=run.coreArena.surfaceY-run.cameraY;
    if(t<320){const q=clamp(t/320),size=s.radius*(2+2*p)*(1-smooth(q));stamp(c,hot,s.x,start-s.radius*.5,size,size,Math.sin(q*Math.PI)*p*.85);}
    if(!e.hit)return;
    const age=(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt),q=clamp(age/660),fade=(1-q)**1.8,spread=55+Math.sqrt(q)*(80+200*p);
    stamp(c,magenta,run.coreArena.x+spread*.17,end,spread*2.3,spread*.83,fade*.72);
    stamp(c,halo,run.coreArena.x-spread*.10,end-9,spread*2.4,spread*.92,fade*.84);
    stamp(c,hot,run.coreArena.x,end-8,110+330*p+q*160,60+180*p,fade*.96);
    for(let i=0;i<(low?8:12+Math.round(p*12));i++){
      const a=-Math.PI*.96+((i*.618+.07)%1)*Math.PI*.92,velocity=(85+p*240)*(.5+(i*.373%1)*.8),sec=age/1000;
      const x=run.coreArena.x+Math.cos(a)*velocity*sec,y=end+Math.sin(a)*velocity*sec+80*sec*sec,size=(12+p*(18+i%4*4))*(1-q*.45);
      stamp(c,i%3===0&&chips.length?chips[i%chips.length]:tiles[i%3],x,y,size*(i%2?1.35:1),size,fade*(i%3===0?1:.88),e.reduced?0:sec*(i%2?1:-1)*.6);
    }
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.glitch||run.evacuation||!VFX.onScreen(run))return;prepare();
    charge(c,run,front);if(!front&&e.phase==='burn')wave(c,run);
    if(front)crash(c,run);
    if(front&&e.hit){
      const q=clamp(((e.finisher?(e.attackAge||0):e.elapsed-e.hitAt))/170),alpha=(1-q)**2*(e.reduced?.035:.075+.045*e.power);
      if(alpha>.002){c.save();c.globalAlpha*=alpha;c.fillStyle='#e2fffc';c.fillRect(0,92,440,748);c.restore();}
    }
  }
  function crashAmount(run){
    const e=run.coreEncounter;if(!e?.glitch||run.evacuation)return 0;
    if(e.finisher&&['overdrive','armed','release'].includes(e.phase))return smooth(e.overdrive||0)*(.40+.12*Math.sin(e.elapsed/160));
    if(e.phase!=='burn')return 0;
    const t=e.phaseTime;return smooth((t-65)/150)*(1-smooth((t-345)/340))*e.power;
  }
  function crash(c,run){
    const e=run.coreEncounter,amount=crashAmount(run);if(amount<=.002||e.reduced)return;
    // Snapshot the complete newly drawn scene (including the hero) before corrupting it.
    // Fresh input every frame prevents feedback and smearing; neither HUD nor damage text is captured.
    const scale=buffers(e.lowPower),tick=Math.floor(VFX.clock(e)/72),color=Math.floor(VFX.clock(e)/90)%2;
    if(sceneOwner!==e||sceneTick!==tick||sceneHit!==e.hitAt){
      sceneCtx.clearRect(0,0,scene.width,scene.height);sceneCtx.drawImage(c.canvas,0,0,c.canvas.width,c.canvas.height,0,0,scene.width,scene.height);
      sceneOwner=e;sceneTick=tick;sceneHit=e.hitAt;tintTick=-1;
    }
    if(!e.lowPower&&tintTick!==color){
      chromaCtx.globalCompositeOperation='source-over';chromaCtx.clearRect(0,0,440,840);chromaCtx.drawImage(scene,0,0);
      chromaCtx.globalCompositeOperation='multiply';chromaCtx.fillStyle=color?'#ff65db':'#70ffed';chromaCtx.fillRect(0,0,440,840);tintTick=color;
    }
    if(e.phase!=='burn'){
      // Reality slips in staggered slices around the hero; the face and HUD remain intact.
      const focus=e.focusY??420,y=focus+(run.slime.y-run.cameraY-focus)*(e.zoom||1),count=e.lowPower?5:10;
      c.save();c.setTransform(c.canvas.width/440,0,0,c.canvas.height/840,0,0);
      for(let i=0;i<count;i++){
        const py=clamp(y-190+i/(count-1)*380,100,790),h=14+(i%3)*9;
        if(Math.abs(py-y)<48)continue;
        const w=160+e.overdrive*150,x=220-w/2,shift=Math.sin(i*7.9+tick*2.3)*(18+e.overdrive*42)*amount;
        if(!e.lowPower){c.globalAlpha=amount*.58;c.drawImage(chroma,x,py,w,h,x-shift*.6,py-2,w,h+3);}
        c.globalAlpha=.30+amount*.55;c.drawImage(scene,x*scale,py*scale,w*scale,h*scale,x+shift,py+(i%2?1:-1)*4*amount,w,h);
      }
      c.restore();return;
    }
    const cols=e.lowPower?2:e.powerTier>=3?4:3,rows=e.lowPower?4:6,jump=tick,range=(8+88*e.power*e.power)*amount;
    c.save();c.setTransform(c.canvas.width/440,0,0,c.canvas.height/840,0,0);
    c.globalAlpha=amount*.92;c.fillStyle='#061727';c.fillRect(0,96,440,744);
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const i=row*cols+col,w=440/cols,h=744/rows,x=col*w,y=96+row*h;
      const dx=Math.sin(i*9.71+jump*2.8)*range,dy=Math.cos(i*5.17-jump)*range*.19;
      // Bright separated channels remain visible in the gaps between large displaced image chunks.
      if(!e.lowPower&&i%2===0){c.globalAlpha=amount*.62;c.drawImage(chroma,x,y,w,h,x-dx*.65,y-dy,w,h);}
      c.globalAlpha=.40+.60*amount;c.drawImage(scene,x*scale,y*scale,w*scale,h*scale,x+dx,y+dy,w,h);
    }
    // A second full-width discontinuity tears through the core cap at peak corruption.
    const end=run.coreArena.surfaceY-run.cameraY,bandY=clamp(end-28,96,790),bandH=22+28*e.power;
    c.globalAlpha=amount*.90;c.drawImage(scene,0,bandY*scale,440*scale,bandH*scale,Math.sin(jump*4.1)*range,bandY-amount*11,440,bandH);
    c.restore();
  }
  function backdrop(c,run){
    const e=run.coreEncounter;if(!e?.glitch||run.evacuation||!VFX.onScreen(run))return;prepare();
    const a=['approach','overdrive','armed','release'].includes(e.phase)?(e.transfer||0)*.24:e.phase==='burn'?.23*(1-smooth((e.phaseTime-320)/660)):0;
    if(a>.002){c.save();c.globalAlpha*=a;c.drawImage(vignette,0,0,440,840);c.restore();}
  }
  const warmCore=source=>{prepare();cacheShell(source);};
  window.SlimeGlitchCoreStrike=Object.freeze({prepare,capture,warmCore,rupture,crashAmount,drawShell,draw,backdrop});
})();

