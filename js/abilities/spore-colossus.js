(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t*t*(3-2*t);
  const HERO='assets/vfx/spores-giant-mushroom-v2.webp';
  const SEED='assets/vfx/spores-giant-seed-v1.webp';
  const POD='assets/vfx/spores-giant-pod-v1.webp';
  const CLOUD='assets/vfx/spores-impact-cloud-v1.webp';
  const sprite=path=>window.SlimeGameAssets.projectSprite(path);
  let shadow;
  function shadowSprite(){
    if(shadow)return shadow;
    shadow=document.createElement('canvas');shadow.width=128;shadow.height=48;
    const c=shadow.getContext('2d');c.scale(1,.375);
    const g=c.createRadialGradient(64,64,6,64,64,64);
    g.addColorStop(0,'rgba(12,45,29,.52)');g.addColorStop(.5,'rgba(17,54,34,.3)');g.addColorStop(1,'rgba(17,54,34,0)');
    c.fillStyle=g;c.fillRect(0,0,128,128);return shadow;
  }
  function start(run,at,x,y){
    const p=run.ultimateProfile;if(p?.kind!=='giantMushroom')return false;
    const cell=run.cellSize,col=(run.columns-1)/2;
    const row=Math.ceil((y+cell*3.1-run.blockRowOrigin)/cell);
    run.giantMushroom={startedAt:at,originX:x,originY:y,spawnX:run.gridOffsetX+(col+.5)*cell,
      spawnY:run.blockRowOrigin+row*cell,jumps:[],impacts:0,hatched:false,
      clouds:[],motes:Array.from({length:24},()=>({at:-Infinity})),moteCursor:0,shakeAt:-Infinity};
    sprite(HERO);sprite(SEED);sprite(POD);sprite(CLOUD);return true;
  }
  function emit(e,x,y,at,cell,count,kind){
    // Event-only allocation. The 24 decorative spores are reused for the whole ability.
    e.clouds.push({x,y,at,size:cell*(kind==='hatch'?3.8:5.8),life:kind==='hatch'?650:780});
    if(e.clouds.length>3)e.clouds.shift();
    for(let i=0;i<count;i++){
      const m=e.motes[e.moteCursor++%e.motes.length],a=Math.PI*(1.08+i*.84/Math.max(1,count-1));
      Object.assign(m,{x,y,at,life:560+(i%4)*65,vx:Math.cos(a)*cell*(1.2+(i%3)*.6),
        vy:Math.sin(a)*cell*(1.2+(i%4)*.3),size:cell*(.05+(i%3)*.025),phase:i*2.4});
    }
  }
  function startPop(run,at){
    run.sporePop={startedAt:at,fired:false,clouds:[],motes:Array.from({length:24},()=>({at:-Infinity})),moteCursor:0};
    sprite(CLOUD);sprite(SEED);
  }
  function updatePop(run,at,s){
    const e=run.sporePop;if(!e)return;
    const p=run.ultimateProfile,cell=run.cellSize;
    if(!e.fired&&at-e.startedAt>=p.chargeMs){
      e.fired=true;e.x=run.slime.x;e.y=run.slime.y;e.burstAt=at;
      // A single local hit; helper hits also keep the ultimate attribution.
      for(const b of s.blocksNearY(e.y,cell*1.8)){
        if(!s.elementalDamageable(b))continue;
        const dx=(b.x+b.w/2-e.x)/cell,dy=(b.y+b.h/2-e.y)/cell;
        if(dx*dx+dy*dy<=2.6)s.damageBlockByElement(b,1,'sporeUltimate',at);
      }
      for(let i=0;i<p.miniCount;i++)s.spawnMiniSlime(Math.PI*(.12+.76*i/(p.miniCount-1)),cell*(3.4+(i%2)*.5),2,'',at,run.slime,true);
      emit(e,e.x,e.y+cell*.3,at,cell,s.lowPower?.()?8:16,'stomp');
      run.shake=Math.max(run.shake||0,s.reducedMotion?.()?1:4);s.sound('hitHard');s.feedback(8);
    }
    if(at-e.startedAt>=p.durationMs)run.sporePop=null;
  }
  function planJump(run,e,index,at,p){
    const cell=run.cellSize,previous=e.jumps[index-1];
    const fromX=previous?previous.toX:e.spawnX,fromY=previous?previous.toY:e.spawnY;
    // World-space route: camera and player position never hold the giant back.
    // Safe centres leave room for the cap even at maximum landing squash.
    const col=index%2===0?2:run.columns-3;
    const row=Math.max(0,Math.round((fromY-run.blockRowOrigin)/cell)+3);
    return {startedAt:at,impactAt:at+p.windupMs+p.jumpMs,fromX,fromY,
      toX:run.gridOffsetX+(col+.5)*cell,toY:run.blockRowOrigin+row*cell,impacted:false};
  }
  function stomp(run,e,j,at,s){
    const cell=run.cellSize,row=Math.round((j.toY-run.blockRowOrigin)/cell),col=Math.floor((j.toX-run.gridOffsetX)/cell);
    for(const b of s.blocksNearY(j.toY,cell*2.6)){
      if(!s.elementalDamageable(b)||Math.abs(b.col-col)>2||b.row<row-2||b.row>row+2)continue;
      const crush=Math.abs(b.col-col)<=1&&b.row>=row-1&&b.row<=row+1;
      s.damageBlockByElement(b,crush?Math.max(1,b.hp):1,'sporeGiant',at);
    }
    const reduced=s.reducedMotion?.()||false,low=s.lowPower?.()||false;
    emit(e,j.toX,j.toY,at,cell,low||reduced?8:16,'stomp');e.shakeAt=at;e.impacts++;
    run.shake=Math.max(run.shake||0,reduced?1.4:7.5);
    s.sound('hitHard');s.feedback(reduced?5:[12,18,8]);
  }
  function update(run,at,s){
    updatePop(run,at,s);
    const e=run.giantMushroom;if(!e)return;
    const p=run.ultimateProfile,growEnd=p.launchMs+p.growMs+p.hatchMs;
    if(!e.hatched&&at-e.startedAt>=growEnd){
      e.hatched=true;emit(e,e.spawnX,e.spawnY,at,run.cellSize,s.lowPower?.()?8:12,'hatch');s.sound('epic');
    }
    for(let i=0;i<p.jumpCount;i++){
      const jumpAt=e.startedAt+growEnd+i*p.cycleMs;if(at<jumpAt)break;
      const j=e.jumps[i]||(e.jumps[i]=planJump(run,e,i,jumpAt,p));
      if(!j.impacted&&at>=j.impactAt){j.impacted=true;stomp(run,e,j,at,s);}
    }
    let write=0;for(let i=0;i<e.clouds.length;i++){const cloud=e.clouds[i];if(at-cloud.at<cloud.life)e.clouds[write++]=cloud;}e.clouds.length=write;
    const shakeAge=at-e.shakeAt;
    if(shakeAge>=0&&shakeAge<250&&!s.reducedMotion?.())run.shake=Math.max(run.shake||0,7.5*(1-shakeAge/250)**2);
    if(at-e.startedAt>=p.durationMs)run.giantMushroom=null;
  }
  function pose(run,at){
    const e=run.giantMushroom;if(!e)return null;
    const p=run.ultimateProfile,age=Math.max(0,at-e.startedAt),cell=run.cellSize;
    if(age<p.launchMs){
      const t=clamp(age/p.launchMs,0,1);
      return {phase:'seed',x:mix(e.originX,e.spawnX,t),y:mix(e.originY,e.spawnY,t)-Math.sin(Math.PI*t)*cell*.9,
        seedSize:cell*.22,sx:1,sy:1,hero:0,pod:0,alpha:1};
    }
    if(age<p.launchMs+p.growMs){
      const t=ease(clamp((age-p.launchMs)/p.growMs,0,1));
      return {phase:'growing',x:e.spawnX,y:e.spawnY,seedSize:cell*(.22+2.0*t),sx:1+Math.sin(t*Math.PI*6)*.025*t,
        sy:1,hero:0,pod:t,alpha:1};
    }
    if(age<p.launchMs+p.growMs+p.hatchMs){
      const t=clamp((age-p.launchMs-p.growMs)/p.hatchMs,0,1);
      return {phase:'hatching',x:e.spawnX,y:e.spawnY,seedSize:cell*2.22,sx:1+.1*Math.sin(t*Math.PI),sy:.6+.4*ease(t),hero:ease(t),pod:1-ease(t),alpha:1};
    }
    const local=age-p.launchMs-p.growMs-p.hatchMs,index=Math.min(p.jumpCount-1,Math.floor(local/p.cycleMs));
    const j=e.jumps[index],t=local-index*p.cycleMs;
    const last=e.jumps[e.jumps.length-1];
    const q={phase:'settled',x:last?last.toX:e.spawnX,y:last?last.toY:e.spawnY,sx:1,sy:1,hero:1,pod:0,alpha:clamp((p.durationMs-age)/450,0,1)};
    if(!j||local>=p.jumpCount*p.cycleMs)return q;
    if(t<p.windupMs){const press=ease(t/p.windupMs);return {...q,phase:'crouching',x:j.fromX,y:j.fromY,sx:1+press*.23,sy:1-press*.36};}
    if(t<p.windupMs+p.jumpMs){
      const flight=(t-p.windupMs)/p.jumpMs,release=ease(clamp(flight/.16,0,1));
      return {...q,phase:'jumping',x:mix(j.fromX,j.toX,ease(flight)),y:mix(j.fromY,j.toY,flight)-Math.sin(Math.PI*flight)*cell*2.3,
        sx:mix(1.23,.86,release)+.1*flight,sy:mix(.64,1.24,release)-.17*flight,tilt:Math.sin(flight*Math.PI)*(j.toX-j.fromX)/cell*.055};
    }
    const recover=clamp((t-p.windupMs-p.jumpMs)/(p.cycleMs-p.windupMs-p.jumpMs),0,1),pulse=Math.cos(recover*Math.PI*2)*Math.exp(-recover*4)*(1-recover);
    return {...q,phase:'landing',x:j.toX,y:j.toY,sx:1+pulse*.27,sy:1-pulse*.36};
  }
  function shiftClock(run,delta){
    const pop=run.sporePop;
    if(pop){pop.startedAt+=delta;if(pop.burstAt)pop.burstAt+=delta;for(const c of pop.clouds)c.at+=delta;for(const m of pop.motes)if(Number.isFinite(m.at))m.at+=delta;}
    const e=run.giantMushroom;if(!e)return;e.startedAt+=delta;
    if(Number.isFinite(e.shakeAt))e.shakeAt+=delta;
    for(const j of e.jumps){j.startedAt+=delta;j.impactAt+=delta;}
    for(const c of e.clouds)c.at+=delta;for(const m of e.motes)if(Number.isFinite(m.at))m.at+=delta;
  }
  function drawObject(c,art,x,y,width,sx=1,sy=1,alpha=1,tilt=0){
    if(!art.complete||!art.naturalWidth||alpha<=0)return;
    const h=width*art.naturalHeight/art.naturalWidth;
    c.save();c.translate(x,y);c.rotate(tilt);c.scale(sx,sy);c.globalAlpha=alpha;c.drawImage(art,-width/2,-h,width,h);c.restore();
  }
  function draw(c,run,at){
    if(run.sporePop)drawPuffs(c,run,at,run.sporePop);
    const e=run.giantMushroom,q=pose(run,at);if(!e||!q)return;
    const cell=run.cellSize,camera=run.cameraY,view=run.viewHeight||780,seed=sprite(SEED);
    c.save();c.globalCompositeOperation='source-over';
    if(q.y-camera>-cell&&q.y-camera<view+cell*4){
      if(q.hero>0){
        c.globalAlpha=q.alpha*.65;const size=cell*2.6;
        c.drawImage(shadowSprite(),q.x-size/2,q.y-camera-cell*.11,size,cell*.3);
      }
      if(q.phase==='seed')drawObject(c,seed,q.x,q.y-camera,q.seedSize,1,1,q.alpha);
      else if(q.hero<1){
        if(q.phase==='growing')drawObject(c,seed,q.x,q.y-camera,q.seedSize,q.sx,q.sy,1-q.pod);
        drawObject(c,sprite(POD),q.x,q.y-camera,q.seedSize,q.sx,q.sy,q.pod);
      }
      if(q.hero>0)drawObject(c,sprite(HERO),q.x,q.y-camera,cell*3.05,q.sx,q.sy,q.hero*q.alpha,q.tilt||0);
    }
    c.restore();drawPuffs(c,run,at,e);
  }
  function drawPuffs(c,run,at,e){
    const cell=run.cellSize,camera=run.cameraY,view=run.viewHeight||780,cloud=sprite(CLOUD),seed=sprite(SEED);
    c.save();c.globalCompositeOperation='source-over';
    for(const b of e.clouds){
      const t=clamp((at-b.at)/b.life,0,1),w=b.size*(.8+t*.65),h=w*(cloud.naturalHeight||135)/(cloud.naturalWidth||384);
      if(b.y-camera<-h||b.y-camera>view+h)continue;
      if(cloud.complete&&cloud.naturalWidth){c.globalAlpha=(1-t)**1.6*.8;c.drawImage(cloud,b.x-w/2,b.y-camera-h*.35,w,h);}
    }
    for(const m of e.motes){
      const age=at-m.at;if(age<0||age>=m.life)continue;const seconds=age/1000,t=age/m.life;
      const x=m.x+m.vx*seconds+Math.sin(t*5+m.phase)*cell*.08,y=m.y+m.vy*seconds-30*seconds*seconds-camera;
      if(y<-20||y>view+20)continue;c.globalAlpha=(1-t)*.8;
      if(seed.complete&&seed.naturalWidth)c.drawImage(seed,x-m.size/2,y-m.size/2,m.size,m.size*.86);
    }
    c.restore();
  }
  window.SlimeSporeColossus=Object.freeze({start,startPop,update,draw,pose,shiftClock});
})();
