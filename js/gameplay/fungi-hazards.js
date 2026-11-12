/* Sky fungus: contact spores, aimed triple volleys, seven-row confusion fog. */
(() => {
  'use strict';
  const art={},fx={},TAU=Math.PI*2;
  const CONFIG=Object.freeze({poison:2,poisonRate:6,tick:.25,hitGrace:.8,aim:.65,cooldown:2.4,shotSpeed:1.8,cloudRows:7,maxShots:9});
  const bounds={spore:[.1124,.1539,.878,.9019],base:[.0989,.1045,.9003,.9187],toad:[.0885,.1132,.8812,.8995],shot:[.2241,.2831,.7663,.7879]};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const awake=b=>!b.dead&&!b.glitchNeutralized&&!b.frozen&&!b.elementalSnow&&!b.elementalSnowflake;
  const visible=(run,y,margin=120)=>y>=run.cameraY-margin&&y<=run.cameraY+840+margin;
  function preload(){
    if(typeof Image==='undefined')return;
    for(const [key,name]of Object.entries({spore:'contact-spore',base:'turret-base',head:'turret-head',toad:'toadstool',shot:'poison-spore',cloud:'confusion-cloud'}))if(!art[key]){
      const image=new Image(),path=`assets/hazards/fungi-v1/${name}.webp`;image.decoding='async';image.src=window.SlimeGameAssets?.versionedAsset(path)||path;art[key]=image;
      if(key==='cloud')image.onload=warmFog;
    }
    if(!fx.glow){
      const image=document.createElement('canvas');image.width=image.height=64;fx.glow=image;
      const c=image.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,31);g.addColorStop(0,'#f4ffbde8');g.addColorStop(.35,'#a5ff6665');g.addColorStop(1,'#72eb4800');c.fillStyle=g;c.fillRect(0,0,64,64);
      const pink=document.createElement('canvas');pink.width=pink.height=24;fx.pink=pink;const p=pink.getContext('2d'),pg=p.createRadialGradient(12,12,1,12,12,11);pg.addColorStop(0,'#fff0f8ef');pg.addColorStop(.30,'#ffb8dfc0');pg.addColorStop(1,'#ee77c500');p.fillStyle=pg;p.fillRect(0,0,24,24);
      const haze=document.createElement('canvas');haze.width=haze.height=128;fx.haze=haze;
      const h=haze.getContext('2d'),hg=h.createRadialGradient(64,64,0,64,64,90);
      hg.addColorStop(0,'#e677bc00');hg.addColorStop(.44,'#e677bc10');hg.addColorStop(.76,'#ea77c263');hg.addColorStop(1,'#a04dc6a6');
      h.fillStyle=hg;h.fillRect(0,0,128,128);
    }
  }
  function warmFog(){
    if(fx.fog||!art.cloud?.naturalWidth)return;
    const image=document.createElement('canvas');image.width=432;image.height=504;const c=image.getContext('2d');
    // Actual cloud texture is tiled at its original proportions, never stretched into a rectangle.
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const size=244,x=(col*.34+.16)*432+(row%2?16:-10),y=(row*.33+.17)*504;
      c.globalAlpha=.58;c.drawImage(art.cloud,x-size/2,y-size/2,size,size);
    }
    c.globalAlpha=1;c.globalCompositeOperation='destination-in';
    const g=c.createLinearGradient(0,0,0,504);g.addColorStop(0,'#fff0');g.addColorStop(.10,'#ffff');g.addColorStop(.9,'#ffff');g.addColorStop(1,'#fff0');c.fillStyle=g;c.fillRect(0,0,432,504);fx.fog=image;
  }
  function init(run,blocks=run.blocks){
    run.fungiHazards=blocks.filter(b=>b.fungi);run.fungiShots=[];run.fungiBursts=[];run.fungiTime=0;
    run.fungiStatus={poison:0,tick:0,grace:0,confused:false,visual:0};
    for(const b of run.fungiHazards)Object.assign(b.fungi,{state:'idle',age:0,angle:-Math.PI/2,recoil:0,cloudAlpha:b.fungi.kind==='toadstool'?1:0,exploded:false});
    if(run.fungiHazards.length)preload();
  }
  function contains(run,b){const s=run.slime,half=run.cellSize*CONFIG.cloudRows/2;return Math.abs(s.y-(b.y+b.h/2))<half&&s.x>=run.gridOffsetX&&s.x<=run.gridOffsetX+run.columns*run.cellSize;}
  function refreshConfusion(run){
    if(!run?.fungiStatus)return false;
    return run.fungiStatus.confused=!run.evacuation&&!run.coreEncounter&&(run.fungiHazards||[]).some(b=>b.fungi.kind==='toadstool'&&awake(b)&&contains(run,b));
  }
  function invert(run,input){return refreshConfusion(run)?{x:-input.x,y:-input.y,up:input.down,down:input.up}:input;}
  function poison(run){
    const s=run?.fungiStatus;if(!s||s.grace>0||run.evacuation||run.coreEncounter||run.ended)return false;
    if(s.poison<=0)s.tick=0;s.poison=CONFIG.poison;s.grace=CONFIG.hitGrace;return true;
  }
  function detonate(run,b,hooks={}){
    if(!b?.fungi||b.fungi.kind!=='spore'||b.fungi.exploded||!awake(b))return false;
    b.fungi.exploded=true;const x=b.x+b.w/2,y=b.y+b.h/2;
    if(visible(run,y))burst(run,x,y,1);
    hooks.destroy?.(b);hooks.poison?.(x,y);return true;
  }
  function burst(run,x,y,size){run.fungiBursts.push({x,y,size,age:0});if(run.fungiBursts.length>10)run.fungiBursts.shift();}
  function update(run,dt,hooks={},realDt=dt){
    if(!run?.fungiStatus||!(dt>0)||run.paused)return;
    const f=run.fungiStatus;
    if(run.evacuation||run.coreEncounter){f.poison=0;f.confused=false;f.visual=0;run.fungiShots.length=0;return;}
    run.fungiTime+=dt;f.grace=Math.max(0,f.grace-realDt);refreshConfusion(run);
    f.visual+=(Number(f.confused)-f.visual)*(1-Math.exp(-realDt*(f.confused?8:5)));
    if(f.poison>0){
      const elapsed=Math.min(realDt,f.poison);f.poison=Math.max(0,f.poison-realDt);f.tick+=elapsed;
      while(f.tick+1e-8>=CONFIG.tick){f.tick=Math.max(0,f.tick-CONFIG.tick);hooks.drain?.(CONFIG.poisonRate*CONFIG.tick);if(run.evacuation||run.ended)break;}
    }
    let live=0;for(const p of run.fungiBursts){p.age+=dt;if(p.age<.5)run.fungiBursts[live++]=p;}run.fungiBursts.length=live;
    const s=run.slime,cell=run.cellSize;
    for(const b of run.fungiHazards){
      const h=b.fungi;if(h.kind==='toadstool'){h.cloudAlpha+=(Number(awake(b))-h.cloudAlpha)*(1-Math.exp(-dt*6));if(awake(b))h.age+=dt;continue;}
      if(h.kind!=='fungusTurret'||!awake(b))continue;
      h.age+=dt;h.recoil=Math.max(0,h.recoil-dt*6);
      const x=b.x+b.w/2,y=b.y+b.h/2,dx=s.x-x,dy=s.y-y;
      if(Math.hypot(dx,dy)>cell*5||!visible(run,y)){h.state='idle';h.age=0;continue;}
      const target=Math.atan2(dy,dx),error=Math.atan2(Math.sin(target-h.angle),Math.cos(target-h.angle));h.angle+=clamp(error,-dt*4.5,dt*4.5);
      if(h.state==='idle'){h.state='aim';h.age=0;}
      if(h.state==='cooldown'&&h.age>=CONFIG.cooldown){h.state='aim';h.age=0;}
      if(h.state==='aim'&&h.age>=CONFIG.aim&&Math.abs(error)<.15&&run.fungiShots.length<=CONFIG.maxShots-3){
        for(let i=-1;i<=1;i++){
          const a=h.angle+i*.22,forward=cell*.38,side=i*cell*.19;
          run.fungiShots.push({x:x+Math.cos(h.angle)*forward-Math.sin(h.angle)*side,y:y+Math.sin(h.angle)*forward+Math.cos(h.angle)*side,vx:Math.cos(a)*cell*CONFIG.shotSpeed,vy:Math.sin(a)*cell*CONFIG.shotSpeed,r:cell*.13,life:3});
        }h.state='cooldown';h.age=0;h.recoil=1;
      }
    }
    live=0;
    for(const p of run.fungiShots){
      p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
      if(p.life<=0||p.x<run.gridOffsetX-cell||p.x>run.gridOffsetX+run.columns*cell+cell)continue;
      if(Math.hypot(p.x-s.x,p.y-s.y)<s.radius+p.r){hooks.poison?.(p.x,p.y);if(visible(run,p.y))burst(run,p.x,p.y,.45);continue;}
      run.fungiShots[live++]=p;
    }run.fungiShots.length=live;
  }
  function stamp(c,image,x,y,w,h=w,alpha=1){if(!image||image.complete===false||image.naturalWidth===0)return;const a=c.globalAlpha;c.globalAlpha*=alpha;c.drawImage(image,x-w/2,y-h/2,w,h);c.globalAlpha=a;}
  function fit(c,key,x,y,size){const im=art[key];if(!im?.complete||!im.naturalWidth)return;const b=bounds[key],w=(b[2]-b[0])*im.naturalWidth,h=(b[3]-b[1])*im.naturalHeight,k=size/Math.max(w,h);c.drawImage(im,b[0]*im.naturalWidth,b[1]*im.naturalHeight,w,h,x-w*k/2,y-h*k/2,w*k,h*k);}
  function drawBlock(c,run,b,sy,reduced=false){
    if(!b.fungi||b.elementalSnow||b.elementalSnowflake)return false;
    const h=b.fungi,x=b.x+b.w/2,y=sy+b.h/2,time=run.fungiTime||0;
    if(h.kind==='spore')fit(c,'spore',x,y,b.w*.88*(reduced?1:1+.018*Math.sin(time*3+b.id)));
    else if(h.kind==='toadstool'){
      const phase=(h.age%1.8)/1.8,spray=phase<.4?Math.sin(phase/.4*Math.PI):0;
      fit(c,'toad',x+(reduced?0:Math.sin(time*36)*spray),y,b.w*.9*(1+spray*.025));
    }else{
      fit(c,'base',x,y,b.w*.94);const q=h.state==='aim'?clamp(h.age/CONFIG.aim):0,size=b.w*1.12;
      c.save();c.translate(x,y);c.rotate(h.angle+Math.PI/2);c.translate(0,h.recoil*2.5);c.scale(1+q*.08,1+q*.08);
      if(art.head?.complete&&art.head.naturalWidth)c.drawImage(art.head,-size*.49,-size*.58,size,size);
      stamp(c,fx.glow,0,-size*.39,b.w*(.2+q*.16),undefined,q*.55);c.restore();
    }return true;
  }
  function drawFields(c,run,reduced=false){
    if(!fx.fog)return;
    const cell=run.cellSize,width=run.columns*cell,height=CONFIG.cloudRows*cell;
    for(const b of run.fungiHazards||[]){
      const h=b.fungi;if(h.kind!=='toadstool'||h.cloudAlpha<.01||!visible(run,b.y,height/2))continue;
      const x=run.gridOffsetX+width/2,y=b.y+b.h/2-run.cameraY;
      stamp(c,fx.fog,x,y,width,height,h.cloudAlpha);
      if(!awake(b)||reduced)continue;
      for(let i=0;i<10;i++){
        const age=(h.age+i*.035)%1.8;if(age>.65)continue;
        const a=i*2.399+b.id,r=cell*age*(1.3+(i%3)*.4),alpha=(1-age/.65)*h.cloudAlpha;
        stamp(c,fx.pink,b.x+b.w/2+Math.cos(a)*r,y+Math.sin(a)*r*.75-cell*age*.3,8+(i%3)*3,undefined,alpha*.85);
      }
    }
  }
  function draw(c,run,reduced=false){
    for(const p of run.fungiShots||[]){if(!visible(run,p.y,40))continue;stamp(c,fx.glow,p.x,p.y-run.cameraY,run.cellSize*.65,undefined,.5);fit(c,'shot',p.x,p.y-run.cameraY,p.r*2.1);}
    for(const p of run.fungiBursts||[]){
      if(!visible(run,p.y))continue;const q=p.age/.5,alpha=(1-q)**1.5,size=run.cellSize*p.size;
      stamp(c,fx.glow,p.x,p.y-run.cameraY,size*(.5+q*1.8),undefined,alpha*.7);
      const count=reduced?4:8;c.save();c.globalAlpha*=alpha;
      for(let i=0;i<count;i++){const a=i*TAU/count;fit(c,'shot',p.x+Math.cos(a)*q*size*.75,p.y-run.cameraY+Math.sin(a)*q*size*.75,size*(.13+q*.08));}c.restore();
    }
  }
  function applyCamera(c,run,width,height,reduced=false){
    const strength=run.fungiStatus?.visual||0;
    if(strength<.005||reduced||run.ended||run.coreEncounter||run.evacuation)return;
    const t=run.fungiTime;
    // Slow opposing waves stretch and tilt the shaft. Overscan covers the corners.
    const swell=Math.sin(t*2.4);
    const scaleX=1+strength*(.085+swell*.01);
    const scaleY=1+strength*(.065+swell*.012+Math.cos(t*2.1)*.012);
    c.translate(width/2+Math.sin(t*2.3)*strength*4,height/2+Math.sin(t*1.7)*strength*4);
    c.rotate(Math.sin(t*1.9)*strength*.02);
    c.transform(scaleX,0,Math.sin(t*2.9+.6)*strength*.01,scaleY,0,0);
    c.translate(-width/2,-height/2);
  }

  function drawStatus(c,run,width,height){
    const status=run.fungiStatus;
    if(!status||run.ended||run.coreEncounter||run.evacuation)return;
    if(status.visual>.01){
      c.save();
      c.globalAlpha*=status.visual;
      c.fillStyle='#e268b124';
      c.fillRect(0,0,width,height);
      if(fx.haze)c.drawImage(fx.haze,0,0,width,height);
      c.restore();
    }
    if(status.poison<=0)return;

    const slime=run.slime;
    const x=clamp(slime.x,24,width-24);
    const slimeY=slime.y-run.cameraY;
    const above=slimeY-slime.radius-17;
    const y=above>=80?above:slimeY+slime.radius+17;
    c.save();
    c.fillStyle='#201b32b3';
    c.beginPath();
    c.roundRect(x-21,y-9,42,22,9);
    c.fill();
    c.fillStyle='#292139';
    c.strokeStyle='#b2e58c';
    c.lineWidth=1.5;
    c.beginPath();
    c.roundRect(x-21,y-11,42,22,9);
    c.fill();
    c.stroke();
    fit(c,'shot',x-10,y,13);
    c.fillStyle='#f3ffd6';
    c.font='1000 17px "Slime Nunito", sans-serif';
    c.textAlign='center';
    c.textBaseline='middle';
    c.fillText(String(Math.ceil(status.poison)),x+8,y+1);
    c.restore();
  }
  const api=Object.freeze({CONFIG,preload,init,contains,refreshConfusion,invert,poison,detonate,update,drawBlock,drawFields,draw,applyCamera,drawStatus});
  if(typeof window!=='undefined')window.SlimeFungiHazards=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
