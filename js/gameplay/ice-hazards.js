/* Magma's ice anomaly: contact frost, telegraphed snow mortars and breakable ice. */
(() => {
  'use strict';
  const TAU=Math.PI*2,art={},fx={},CROSS=Object.freeze([[0,0],[-1,0],[1,0],[0,-1],[0,1]]);
  const CONFIG=Object.freeze({slow:3,slowPerStack:.2,maxStacks:3,freeze:2,hitGrace:.8,aim:.65,flight:1.1,cooldown:2.4});
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function preload(){
    if(typeof Image==='undefined')return;
    const paths={spike:'assets/hazards/ice-v2/frost-spike.webp',block:'assets/hazards/ice-v2/ice-block.webp',mortar:'assets/hazards/ice-v1/snow-mortar.webp',snow:'assets/vfx/frost-snowball-v2.webp'};
    for(const [key,path]of Object.entries(paths))if(!art[key]){const image=new Image();image.decoding='async';image.src=window.SlimeGameAssets?.versionedAsset(path)||path;art[key]=image;}
    warmFx();
  }
  function warmFx(){
    if(fx.glow||typeof document==='undefined')return;
    const make=(name,size)=>{const image=document.createElement('canvas');image.width=image.height=size;fx[name]=image;return image.getContext('2d');};
    let c=make('glow',96),g=c.createRadialGradient(48,48,1,48,48,47);
    for(const [p,color]of [[0,'#faffffff'],[.18,'#edfbffdb'],[.43,'#9ae8ff75'],[1,'#7bd3ff00']])g.addColorStop(p,color);
    c.fillStyle=g;c.fillRect(0,0,96,96);
    c=make('puff',128);
    for(const [x,y,r]of [[38,58,25],[83,49,26],[79,83,25],[47,86,22],[58,36,22],[62,62,33]]){
      g=c.createRadialGradient(x-4,y-5,2,x,y,r);g.addColorStop(0,'#f6fdfff0');g.addColorStop(.52,'#d4f3ffc0');g.addColorStop(1,'#b9eaff00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }
    c=make('flake',40);c.lineCap='round';c.lineJoin='round';c.strokeStyle='#ecfcff';c.lineWidth=2;c.shadowColor='#a1e9ff';c.shadowBlur=3;
    for(let i=0;i<6;i++){const a=i*TAU/6,dx=Math.cos(a),dy=Math.sin(a);c.beginPath();c.moveTo(20,20);c.lineTo(20+dx*12,20+dy*12);for(const sign of [-1,1]){c.moveTo(20+dx*8,20+dy*8);c.lineTo(20+dx*4-dy*sign*3,20+dy*4+dx*sign*3);}c.stroke();}
    c=make('marker',256);c.translate(128,128);c.scale(72,72);c.lineJoin='round';c.lineCap='round';
    const points=[[-.45,-1.45],[.45,-1.45],[.45,-.45],[1.45,-.45],[1.45,.45],[.45,.45],[.45,1.45],[-.45,1.45],[-.45,.45],[-1.45,.45],[-1.45,-.45],[-.45,-.45]];
    c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
    c.fillStyle='rgba(124,216,255,.18)';c.fill();c.strokeStyle='rgba(16,57,88,.90)';c.lineWidth=.09;c.stroke();c.strokeStyle='#ddfaff';c.lineWidth=.026;c.stroke();
  }
  const awake=b=>!b.dead&&!b.glitchNeutralized&&!b.frozen&&!b.elementalSnow&&!b.elementalSnowflake;
  const visible=(run,y,margin=120)=>y>=run.cameraY-margin&&y<=run.cameraY+840+margin;
  function init(run,blocks=run.blocks){
    run.iceHazards=blocks.filter(b=>b.ice);run.iceShots=[];run.iceBursts=[];run.iceMuzzles=[];run.iceTime=0;
    run.iceStatus={stacks:0,slow:0,freeze:0,grace:0,flash:0,thaw:0,x:0,y:0};
    for(const b of run.iceHazards)Object.assign(b.ice,{state:'idle',age:0,recoil:0});
    if(run.iceHazards.length)preload();
  }
  function addFrost(run){
    const f=run.iceStatus;if(!f||f.freeze>0||f.grace>0||run.evacuation||run.coreEncounter)return false;
    const wasCapped=f.stacks===CONFIG.maxStacks;
    f.stacks=Math.min(CONFIG.maxStacks,f.stacks+1);f.slow=CONFIG.slow;f.grace=CONFIG.hitGrace;f.flash=.3;
    if(!wasCapped&&f.stacks===CONFIG.maxStacks){
      f.freeze=CONFIG.freeze;
      f.x=clamp(run.slime.x,run.gridOffsetX+run.slime.radius,run.gridOffsetX+run.columns*run.cellSize-run.slime.radius);
      f.y=run.slime.y;run.slime.x=f.x;run.slime.vx=run.slime.vy=0;run.shake=Math.max(run.shake||0,4);
    }
    return true;
  }
  function slowFactor(run){return 1-(run?.iceStatus?.stacks||0)*CONFIG.slowPerStack;}
  function locked(run){return (run?.iceStatus?.freeze||0)>0;}
  function hold(run,dt){
    if(!locked(run))return false;
    const f=run.iceStatus,s=run.slime;s.x=f.x;s.y=f.y;s.vx=s.vy=0;s.wobble+=dt*2;run.lowMotionTime=0;
    run.shake=Math.max(0,(run.shake||0)-dt*20);return true;
  }
  function tickStatus(run,dt){
    const f=run.iceStatus;if(!f)return;
    f.grace=Math.max(0,f.grace-dt);f.flash=Math.max(0,f.flash-dt);f.thaw=Math.max(0,f.thaw-dt);
    f.slow=Math.max(0,f.slow-dt);
    if(!f.slow)f.stacks=0;
    if(f.freeze>0){
      f.freeze=Math.max(0,f.freeze-dt);
      if(!f.freeze){f.thaw=.28;run.slime.vx=0;run.slime.vy=90;}
    }
  }
  function crossHit(run,x,y){
    const s=run.slime,cell=run.cellSize,r=s.radius*.8;
    return CROSS.some(([dx,dy])=>{
      const px=x+dx*cell,py=y+dy*cell,half=cell*.45;
      const ox=Math.max(0,Math.abs(s.x-px)-half),oy=Math.max(0,Math.abs(s.y-py)-half);
      return ox*ox+oy*oy<r*r;
    });
  }
  function target(run,b){
    const s=run.slime,cell=run.cellSize;
    const col=clamp(Math.floor((s.x-run.gridOffsetX)/cell),0,run.columns-1);
    const row=Math.max(0,Math.floor((s.y-run.blockRowOrigin)/cell));
    b.ice.targetX=run.gridOffsetX+(col+.5)*cell;b.ice.targetY=run.blockRowOrigin+(row+.5)*cell;
  }
  function update(run,dt,hooks={},statusDt=dt){
    if(!run?.iceStatus||!(dt>0)||run.paused)return;
    if(run.evacuation||run.coreEncounter){Object.assign(run.iceStatus,{stacks:0,slow:0,freeze:0,thaw:0});run.iceShots.length=run.iceBursts.length=run.iceMuzzles.length=0;return;}
    tickStatus(run,statusDt);run.iceTime+=dt;
    let alive=0;
    for(const p of run.iceBursts){p.age+=dt;if(p.age<.65)run.iceBursts[alive++]=p;}run.iceBursts.length=alive;
    alive=0;for(const p of run.iceMuzzles){p.age+=dt;if(p.age<.44)run.iceMuzzles[alive++]=p;}run.iceMuzzles.length=alive;
    // Existing snowballs finish their fixed trajectory even if the launcher is broken.
    alive=0;
    for(const p of run.iceShots){
      p.age+=dt;
      if(p.age>=CONFIG.flight){
        if(visible(run,p.ty,run.cellSize*2))run.iceBursts.push({x:p.tx,y:p.ty,age:0});
        if(crossHit(run,p.tx,p.ty))hooks.hurt?.(p.tx,p.ty);
      }else run.iceShots[alive++]=p;
    }run.iceShots.length=alive;
    for(const b of run.iceHazards){
      const h=b.ice;if(h.kind!=='iceMortar'||!awake(b))continue;
      h.recoil=Math.max(0,h.recoil-dt*5);
      if(h.state==='aim'&&!visible(run,h.targetY,run.cellSize*2)){h.state='cooldown';h.age=0;}
      if(h.state==='cooldown'){h.age+=dt;if(h.age>=CONFIG.cooldown){h.state='idle';h.age=0;}}
      if(h.state==='idle'&&visible(run,b.y)&&Math.abs(run.slime.y-b.y)<run.cellSize*4.5&&run.iceShots.length<3){target(run,b);h.state='aim';h.age=0;}
      if(h.state==='aim'){
        h.age+=dt;
        if(h.age>=CONFIG.aim){
          const x=b.x+b.w/2,y=b.y+b.h*.22;
          run.iceShots.push({sx:x,sy:y,tx:h.targetX,ty:h.targetY,age:0});
          if(visible(run,y,run.cellSize)){run.iceMuzzles.push({x,y,age:0,seed:b.id});if(run.iceMuzzles.length>6)run.iceMuzzles.shift();}
          h.state='cooldown';h.age=0;h.recoil=1;hooks.shoot?.(b);
        }
      }
    }
  }
  function stamp(c,image,x,y,size,alpha=1){
    if(!image||image.complete===false||image.naturalWidth===0)return;
    const old=c.globalAlpha;c.globalAlpha*=alpha;c.drawImage(image,x-size/2,y-size/2,size,size);c.globalAlpha=old;
  }
  function terrainStamp(c,image,x,y,size,bounds){
    const iw=image.naturalWidth,ih=image.naturalHeight,sx=iw*bounds[0],sy=ih*bounds[1],sw=iw*(bounds[2]-bounds[0]),sh=ih*(bounds[3]-bounds[1]),k=size/Math.max(sw,sh);
    c.drawImage(image,sx,sy,sw,sh,x-sw*k/2,y-sh*k/2,sw*k,sh*k);
  }
  function snowPosition(p,age,cell){
    const t=clamp(age/CONFIG.flight),u=1-t,cy=Math.min(p.sy,p.ty)-cell*3;
    return {x:p.sx*u+p.tx*t,y:u*u*p.sy+2*u*t*cy+t*t*p.ty,t};
  }
  function flake(c,x,y,r){
    c.beginPath();for(let i=0;i<3;i++){const a=i*Math.PI/3,dx=Math.cos(a)*r,dy=Math.sin(a)*r;c.moveTo(x-dx,y-dy);c.lineTo(x+dx,y+dy);}c.stroke();
  }
  function drawBlock(c,run,b,sy){
    if(!b.ice||b.elementalSnow||b.elementalSnowflake)return false;
    const h=b.ice,image=h.kind==='frostSpike'?art.spike:h.kind==='iceMortar'?art.mortar:art.block;
    if(!image?.complete||!image.naturalWidth)return false;
    const x=b.x+b.w/2,y=sy+b.h/2;
    if(h.kind==='iceMortar'){
      const charge=h.state==='aim'?clamp(h.age/CONFIG.aim):0;
      stamp(c,image,x,y+(h.recoil||0)*3,b.w*.94*(1+charge*.045-(h.recoil||0)*.025));
    }else terrainStamp(c,image,x,y,b.w*(h.kind==='frostSpike'?.96:.98),h.kind==='frostSpike'?[.063,.08692,.93541,.88437]:[.0622,.07815,.93461,.94498]);
    if(h.kind==='iceBlock'){
      if(b.hp<b.maxHp){c.save();c.strokeStyle='#275483';c.lineWidth=2;c.beginPath();c.moveTo(b.x+b.w*.25,sy+2);c.lineTo(x,y);c.lineTo(b.x+b.w*.7,sy+b.h-2);c.stroke();c.restore();}
    }
    return true;
  }
  function marker(c,run,x,y,p){
    if(!visible(run,y,run.cellSize*2))return;
    const cell=run.cellSize,sy=y-run.cameraY;p=clamp(p);
    c.save();stamp(c,fx.marker,x,sy,cell*256/72,.75+p*.25);
    stamp(c,fx.glow,x,sy,cell*.8,.12+p*.13);
    c.fillStyle='rgba(19,62,92,.88)';c.beginPath();c.arc(x,sy,cell*.20,0,TAU);c.fill();
    c.strokeStyle='#72bfdc';c.lineWidth=1.5;c.stroke();
    c.strokeStyle='#f4fdff';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.arc(x,sy,cell*.20,-Math.PI/2,-Math.PI/2+TAU*p);c.stroke();
    stamp(c,fx.flake,x,sy,cell*.25);c.fillStyle='#fff';c.beginPath();c.arc(x,sy,2,0,TAU);c.fill();c.restore();
  }
  function draw(c,run,reduced=false){
    if(!run.iceHazards?.length)return;
    const cell=run.cellSize;
    for(const b of run.iceHazards)if(awake(b)&&b.ice.state==='aim'){
      const q=clamp(b.ice.age/CONFIG.aim),x=b.x+b.w/2,y=b.y+b.h*.22-run.cameraY;
      marker(c,run,b.ice.targetX,b.ice.targetY,q*.35);
      if(!visible(run,b.y,cell))continue;
      stamp(c,fx.glow,x,y,cell*(.3+q*.55),q*.5);
      const count=reduced?3:6;
      for(let i=0;i<count;i++){
        const a=i*TAU/count+b.id*.4,phase=(run.iceTime*.8+i/count)%1,r=cell*(.15+(1-phase)*.4);
        stamp(c,fx.flake,x+Math.cos(a)*r,y+Math.sin(a)*r*.65,cell*.13,q*(.25+phase*.5));
      }
    }
    for(const m of run.iceMuzzles||[]){
      if(!visible(run,m.y,cell))continue;
      const q=clamp(m.age/.44),x=m.x,y=m.y-run.cameraY,fade=(1-q)**1.5;
      stamp(c,fx.glow,x,y,cell*(.55+q*.5),fade*.8);
      stamp(c,fx.puff,x,y-cell*q*.6,cell*(.40+q*.95),fade*.85);
      const count=reduced?4:8;
      for(let i=0;i<count;i++){
        const a=-Math.PI/2+(i/(count-1)-.5)*2.1,r=cell*q*(.45+(i%3)*.14);
        stamp(c,fx.flake,x+Math.cos(a)*r,y+Math.sin(a)*r+cell*q*q*.18,cell*(.13+(i%2)*.05),fade);
      }
    }
    for(const p of run.iceShots){
      const {x,y,t}=snowPosition(p,p.age,cell);
      marker(c,run,p.tx,p.ty,.35+t*.65);
      if(!visible(run,y,cell))continue;
      const samples=reduced?2:4;
      for(let i=samples;i>=1;i--){
        if(p.age<i*.045)continue;
        const previous=snowPosition(p,p.age-i*.045,cell);
        stamp(c,fx.puff,previous.x,previous.y-run.cameraY,cell*(.23+(samples-i)*.035),.08+(samples-i)*.035);
      }
      stamp(c,fx.glow,x,y-run.cameraY,cell*.8,.27);
      stamp(c,art.snow,x,y-run.cameraY,cell*(.35+.10*Math.sin(t*Math.PI)+.05*clamp((t-.8)/.2)));
    }
    for(const p of run.iceBursts){
      if(!visible(run,p.y,cell*2))continue;
      const t=clamp(p.age/.65),fade=(1-t)**1.4,y=p.y-run.cameraY;
      stamp(c,fx.marker,p.x,y,cell*256/72,Math.max(0,1-t*4)*.7);
      stamp(c,fx.glow,p.x,y,cell*(.6+t*1.5),fade*.8);
      for(const [dx,dy]of CROSS){
        const q=clamp((p.age-((dx!==0||dy!==0)? .045 : 0))/.55);if(!q)continue;
        stamp(c,fx.puff,p.x+dx*cell*(.55+q*.4),y+dy*cell*(.55+q*.4)-cell*q*.10,cell*(.35+q*.7),(1-q)**1.3*.8);
      }
      const count=reduced?6:12;
      for(let i=0;i<count;i++){
        const a=i*TAU/count+.25,r=cell*t*(.55+(i%3)*.32);
        stamp(c,fx.flake,p.x+Math.cos(a)*r,y+Math.sin(a)*r-cell*t*.18+cell*t*t*.38,cell*(.12+(i%3)*.035),fade);
      }
    }
  }
  function drawStatus(c,run,reduced=false){
    const f=run.iceStatus;if(!f?.stacks||run.evacuation||run.coreEncounter)return;
    const s=run.slime,x=s.x,y=s.y-run.cameraY,r=s.radius;
    c.save();
    const above=r*(f.freeze>0?1.35:1);
    c.fillStyle='rgba(22,61,87,.90)';c.beginPath();c.roundRect(x-28,y-above-26,56,22,8);c.fill();
    c.strokeStyle='#e6fbff';c.lineWidth=2;
    for(let i=0;i<3;i++){
      c.globalAlpha=i<f.stacks?1:.3;flake(c,x+(i-1)*15,y-above-17,5);
    }
    c.globalAlpha=.9;c.fillStyle='#225071';c.fillRect(x-21,y-above-9,42,2);
    c.fillStyle='#b8edff';c.fillRect(x-21,y-above-9,42*f.slow/CONFIG.slow,2);
    c.restore();
  }
  function drawSlimeIce(c,run,x,y,r,{front=false,reduced=false}={}){
    const f=run.iceStatus;if(!f?.stacks&&!f?.thaw)return;
    if(f.freeze>0){
      const close=reduced?1:1-(1-clamp((CONFIG.freeze-f.freeze)/.15))**3;
      const size=r*(2.2+close*.94);
      stamp(c,art.block,x,y,size,front?.58:.96);
      if(front&&f.flash>0)stamp(c,fx.glow,x,y,size*1.2,f.flash*.8);
    }
    if(!front)return;
    if(f.freeze<=0&&f.flash>0)stamp(c,fx.puff,x,y+r*.45,r*2.5,f.flash*(.7+f.stacks*.36));
    if(f.thaw>0&&!reduced){
      const age=1-f.thaw/.28;
      for(let i=0;i<6;i++){
        const angle=i*TAU/6+.27,distance=r*(.92+age*.92);
        stamp(c,fx.flake,x+Math.cos(angle)*distance,y+Math.sin(angle)*distance+age*age*r*.4,r*.40,(1-age)*.85);
      }
    }
  }
  const api=Object.freeze({CONFIG,CROSS,preload,init,addFrost,slowFactor,locked,hold,crossHit,update,drawBlock,draw,drawStatus,drawSlimeIce});
  if(typeof window!=='undefined')window.SlimeIceHazards=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
