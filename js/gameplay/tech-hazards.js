/* Destructible candy-world machines. Timers use simulation time, art is prepared once. */
(() => {
  'use strict';
  const art={},TAU=Math.PI*2;
  const paths={mine:'mine',base:'turret-base',head:'turret-head',single:'laser-single',double:'laser-double',slow:'slow-core'};
  const TURRET_RANGE=7,TURRET_AIM=.6,TURRET_COOLDOWN=1.3,MINE_FUSE=1;
  const FIELD_ROWS=3,FIELD_SLOW=.62;
  let glow,beam,field,sweep;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function preload(){
    if(typeof Image==='undefined')return;
    for(const [key,name]of Object.entries(paths))if(!art[key]){
      const path=`assets/hazards/techno-v1/${name}.webp`,image=new Image();
      image.decoding='async';image.src=window.SlimeGameAssets?.versionedAsset(path)||path;art[key]=image;
    }
    if(glow)return;
    glow=document.createElement('canvas');glow.width=glow.height=96;
    let c=glow.getContext('2d'),g=c.createRadialGradient(48,48,0,48,48,48);
    for(const [p,color]of [[0,'#fff9eaff'],[.12,'#fff1edff'],[.3,'#ff4e67e0'],[.6,'#ee133b50'],[1,'#ea123000']])g.addColorStop(p,color);
    c.fillStyle=g;c.fillRect(0,0,96,96);
    beam=document.createElement('canvas');beam.width=8;beam.height=64;c=beam.getContext('2d');
    g=c.createLinearGradient(0,0,0,64);
    for(const [p,color]of [[0,'#f7194700'],[.2,'#fa174a28'],[.35,'#ff234aa0'],[.45,'#ff9dbe'],[.49,'#fff7f4'],[.51,'#fff7f4'],[.55,'#ff9dbe'],[.65,'#ff234aa0'],[.8,'#fa174a28'],[1,'#f7194700']])g.addColorStop(p,color);
    c.fillStyle=g;c.fillRect(0,0,8,64);
    field=document.createElement('canvas');field.width=field.height=384;c=field.getContext('2d');
    g=c.createLinearGradient(0,0,0,384);
    for(const [p,color]of [[0,'#ba9bffad'],[.024,'#51378872'],[.28,'#30195471'],[.5,'#8d54d248'],[.72,'#30195471'],[.976,'#51378872'],[1,'#ba9bffad']])g.addColorStop(p,color);
    c.fillStyle=g;c.fillRect(0,0,384,384);
    c.lineWidth=2;c.strokeStyle='#deccffbb';c.strokeRect(1,1,382,382);
    c.strokeStyle='#d1acff8a';c.lineWidth=3;
    for(const side of [0,1]){
      c.save();if(side){c.translate(384,384);c.rotate(Math.PI);}
      c.beginPath();c.moveTo(5,34);c.lineTo(5,17);c.lineTo(17,5);c.lineTo(52,5);c.stroke();
      c.beginPath();c.moveTo(379,34);c.lineTo(379,17);c.lineTo(367,5);c.lineTo(332,5);c.stroke();
      for(let i=0;i<6;i++){
        const x=18+i*64,y=74+(i%2)*57;
        c.beginPath();c.moveTo(x,y-4);c.lineTo(x+10,y+5);c.lineTo(x+20,y-4);c.stroke();
      }
      c.restore();
    }
    sweep=document.createElement('canvas');sweep.width=4;sweep.height=64;c=sweep.getContext('2d');
    g=c.createLinearGradient(0,0,0,64);g.addColorStop(0,'#b69bff00');g.addColorStop(.5,'#d6b5ff90');g.addColorStop(1,'#b69bff00');
    c.fillStyle=g;c.fillRect(0,0,4,64);
  }
  function init(run,blocks=run.blocks){
    run.techHazards=blocks.filter(b=>b.tech);run.techShots=[];run.techTime=0;
    if(run.techHazards.length)preload();
    for(const b of run.techHazards){Object.assign(b.tech,{state:b.tech.kind==='laser'?'active':'idle',age:0,angle:0,recoil:0,flash:0,pulse:0,beepClock:0});if(b.tech.kind==='laser')b.tech.ranges=beamRanges(run,b);}
  }
  const awake=(run,b)=>!b.dead&&!b.glitchNeutralized&&!b.frozen&&!b.elementalSnow&&!b.elementalSnowflake;
  const visible=(run,y,margin=100)=>y>=run.cameraY-margin&&y<=run.cameraY+840+margin;
  function inGravityField(run){
    if(!run||run.evacuation||run.coreEncounter)return false;
    const {x,y}=run.slime;
    return x>=run.gridOffsetX&&x<=run.gridOffsetX+run.columns*run.cellSize
      && (run.techHazards||[]).some(b=>b.tech.kind==='slowCore'&&awake(run,b)
        && Math.abs(y-b.y-b.h/2)<=run.cellSize*FIELD_ROWS);
  }
  function slowFactor(run){return !run?.paused&&inGravityField(run)?1-FIELD_SLOW:1;}
  function beamRanges(run,b){
    if(b.tech.ranges)return b.tech.ranges;
    if(b.tech.double)return [[run.gridOffsetX,b.x+3],[b.x+b.w-3,run.gridOffsetX+run.columns*run.cellSize]];
    return b.tech.direction<0?[[run.gridOffsetX,b.x+3]]:[[b.x+b.w-3,run.gridOffsetX+run.columns*run.cellSize]];
  }
  function update(run,dt,hooks={},realDt=dt){
    if(!run?.techHazards?.length||!(dt>0)||run.paused||run.evacuation||run.coreEncounter)return;
    run.techTime+=dt;
    const s=run.slime,cell=run.cellSize;
    for(const b of run.techHazards){
      if(!awake(run,b))continue;
      const t=b.tech,x=b.x+b.w/2,y=b.y+b.h/2,dx=s.x-x,dy=s.y-y,distance=Math.hypot(dx,dy);
      t.age+=t.kind==='mine'&&t.state==='armed'?realDt:dt;
      t.flash=Math.max(0,t.flash-dt);t.recoil=Math.max(0,t.recoil-dt*7);
      if(t.kind==='turret'){
        const inRange=distance<=cell*TURRET_RANGE;
        if(!inRange){if(t.state==='aim'){t.state='idle';t.age=0;}continue;}
        const target=Math.atan2(dy,dx),error=Math.atan2(Math.sin(target-t.angle),Math.cos(target-t.angle));
        t.angle+=clamp(error,-dt*5,dt*5);
        if(t.state==='idle'){t.state='aim';t.age=0;}
        if(t.state==='cooldown'&&t.age>=TURRET_COOLDOWN){t.state='aim';t.age=0;}
        if(t.state==='aim'&&t.age>=TURRET_AIM&&Math.abs(error)<.14&&run.techShots.length<5){
          const vx=Math.cos(t.angle),vy=Math.sin(t.angle),muzzle=cell*.35;
          run.techShots.push({x:x+vx*muzzle,y:y+vy*muzzle,vx:vx*cell*1.65,vy:vy*cell*1.65,r:cell*.13,life:4.5,source:b});
          t.state='cooldown';t.age=0;t.recoil=1;t.flash=.15;
        }
      }else if(t.kind==='mine'){
        if(t.state==='idle'&&distance<cell*2.6){t.state='armed';t.age=0;t.beepClock=0;}
        if(visible(run,y,0)){
          const armed=t.state==='armed';
          t.pulse+=realDt*(armed?11+clamp(t.age/MINE_FUSE)*13:3);
          t.beepClock-=realDt;
          if(t.beepClock<=0){hooks.beep?.(armed);t.beepClock=armed?.22-.13*clamp(t.age/MINE_FUSE):1.25;}
        }else t.beepClock=0;
        if(t.state==='armed'&&t.age+1e-8>=MINE_FUSE){
          t.state='spent';
          hooks.detonate?.(b);
          if(Math.hypot(s.x-x,s.y-y)<cell*1.65+s.radius)hooks.hurt?.(x,y);
        }
      }else if(t.kind==='slowCore'){
        if(visible(run,y,cell*FIELD_ROWS))t.pulse+=dt;
      }else{
        if(t.state==='active'&&Math.abs(dy)<s.radius+cell*.12){
          for(const [from,to]of beamRanges(run,b))if(s.x+s.radius>from&&s.x-s.radius<to){hooks.hurt?.(s.x,y);break;}
        }
      }
      if(run.evacuation)break;
    }
    let alive=0;
    for(const p of run.techShots){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
      if(p.life<=0||p.x<run.gridOffsetX-30||p.x>run.gridOffsetX+run.columns*cell+30)continue;
      if(Math.hypot(p.x-s.x,p.y-s.y)<s.radius+p.r){hooks.hurt?.(p.x,p.y);continue;}
      run.techShots[alive++]=p;
    }
    run.techShots.length=alive;
  }
  function stamp(c,image,x,y,w,h,alpha=1){
    if(!image||image.complete===false||image.naturalWidth===0)return;
    const previous=c.globalAlpha;c.globalAlpha*=alpha;c.drawImage(image,x-w/2,y-h/2,w,h);c.globalAlpha=previous;
  }
  function drawBlock(c,run,b,sy,reduced=false){
    const t=b.tech;if(!t)return false;
    const image=t.kind==='turret'?art.base:t.kind==='mine'?art.mine:t.kind==='slowCore'?art.slow:t.double?art.double:art.single;
    if(!image?.complete||!image.naturalWidth)return false;
    const size=b.w*.92,x=b.x+b.w/2,y=sy+b.h/2;
    c.save();
    if(t.kind==='laser'&&t.direction<0&&!t.double){
      c.save();c.translate(x,y);c.scale(-1,1);stamp(c,image,0,0,size,size);c.restore();
    }else stamp(c,image,x,y,size,size);
    if(t.kind==='turret'){
      c.save();c.translate(x,y);c.rotate(t.angle+Math.PI/2);c.translate(0,t.recoil*3);
      stamp(c,art.head,0,0,size,size);
      const charge=t.state==='aim'?clamp(t.age/TURRET_AIM):0;
      stamp(c,glow,0,-size*.35,12+charge*13,12+charge*13,charge*.75+t.flash*4);
      c.restore();
    }else if(t.kind==='mine'){
      const armed=t.state==='armed',pulse=reduced?.6:.5+.5*Math.sin(t.pulse);
      stamp(c,glow,x,y,size*.70,size*.70,(armed?.45:.12)+pulse*(armed?.55:.18));
      if(armed){
        c.strokeStyle='#ff6178';c.globalAlpha=.25+pulse*.55;c.lineWidth=2;
        c.beginPath();c.arc(x,y,size*(.42+t.age*.035),-Math.PI/2,-Math.PI/2+TAU*clamp(t.age/MINE_FUSE));c.stroke();
      }
    }else if(t.kind==='slowCore'){
      if(awake(run,b))stamp(c,sweep,x,y,size*.72,size*.36,reduced?.6:.6+.3*Math.sin(t.pulse*4));
    }else{
      const power=t.state==='active'?1:.1;
      stamp(c,glow,x,y,size*.42,size*.42,power*.75);

    }
    if(b.hp<b.maxHp){
      c.globalAlpha=1;
      for(let i=0;i<b.maxHp;i++){c.fillStyle=i<b.hp?'#ff6d8b':'#343343';c.fillRect(x+(i-(b.maxHp-1)/2)*8-2,y-size*.40,5,3);}
    }
    c.restore();return true;
  }
  function draw(c,run,reduced=false){
    if(!run.techHazards?.length)return;
    const cell=run.cellSize,time=run.techTime||0;
    c.save();
    for(const b of run.techHazards){
      const isField=b.tech.kind==='slowCore';
      if(!awake(run,b)||!visible(run,b.y,cell*(isField?FIELD_ROWS+1:2)))continue;
      if(isField&&field){
        const width=run.columns*cell,height=cell*FIELD_ROWS*2;
        const left=run.gridOffsetX,top=b.y+b.h/2-run.cameraY-height/2;
        c.drawImage(field,left,top,width,height);
        if(!reduced)for(let i=0;i<3;i++){
          const phase=(b.tech.pulse*.38+i/3)%1;
          stamp(c,sweep,left+width/2,top+phase*height,width,cell*.42,Math.sin(phase*Math.PI)*.53);
        }
      }
      if(b.tech.kind==='mine'){
        const y=b.y+b.h/2-run.cameraY,armed=b.tech.state==='armed';
        const pulse=reduced?.5:.5+.5*Math.sin(b.tech.pulse);
        c.fillStyle=armed?'rgba(255,52,82,.045)':'rgba(255,92,117,.025)';
        c.strokeStyle=armed?'rgba(255,92,117,.48)':'rgba(255,129,146,.24)';c.lineWidth=1.6;
        c.beginPath();c.arc(b.x+b.w/2,y,cell*2.6,0,TAU);c.fill();c.stroke();
        if(armed){
          c.strokeStyle='rgba(255,92,117,'+(.28+pulse*.35)+')';c.lineWidth=2;
          c.beginPath();c.arc(b.x+b.w/2,y,cell*1.65,0,TAU);c.stroke();
        }
      }
      if(b.tech.kind!=='laser'||!visible(run,b.y,0))continue;
      const t=b.tech,y=b.y+b.h/2-run.cameraY;
      for(const [from,to]of beamRanges(run,b)){
        if(t.state==='active'){
          const width=cell*(reduced?.82:.82+.035*Math.sin(time*25+b.id));
          c.drawImage(beam,from,y-width/2,to-from,width);
          stamp(c,glow,t.double?(from===run.gridOffsetX?to:from):t.direction<0?to:from,y,cell*.5,cell*.5,.92);

        }
      }
    }
    for(const p of run.techShots){
      if(!visible(run,p.y,30))continue;
      const y=p.y-run.cameraY,speed=Math.hypot(p.vx,p.vy)||1;
      if(!reduced)for(let i=2;i>=1;i--)stamp(c,glow,p.x-p.vx/speed*p.r*i,y-p.vy/speed*p.r*i,p.r*(5-i),p.r*(5-i),.25/i);
      stamp(c,glow,p.x,y,p.r*6,p.r*6);
      c.fillStyle='#fff4ee';c.beginPath();c.arc(p.x,y,p.r*.45,0,TAU);c.fill();
    }
    c.restore();
  }
  function drawAffected(c,run,x,y,r,reduced=false){
    if(!inGravityField(run))return;
    const clock=run.techTime||0;
    stamp(c,sweep,x,y+r*.1,r*2.85,r*.62,.76);
    c.save();
    c.strokeStyle='#e4ccff';c.lineWidth=2;c.lineJoin='round';
    for(let i=0;i<3;i++){
      const phase=reduced?i/3:(clock*1.7+i/3)%1;
      c.globalAlpha=Math.sin(phase*Math.PI)*.85;
      const py=y+r*(1.24-phase*2.48),px=r*(.98+phase*.32);
      c.beginPath();
      for(const sign of [-1,1]){
        c.moveTo(x+sign*(px+r*.14),py+r*.13);
        c.lineTo(x+sign*px,py);
        c.lineTo(x+sign*(px+r*.14),py-r*.13);
      }
      c.stroke();
    }
    c.restore();
  }
  const api=Object.freeze({preload,init,update,drawBlock,draw,drawAffected,beamRanges,slowFactor});
  if(typeof window!=='undefined')window.SlimeTechHazards=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
