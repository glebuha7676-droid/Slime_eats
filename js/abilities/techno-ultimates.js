(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const center=b=>({x:b.x+b.w/2,y:b.y+b.h/2});
  const mix=(a,b,t)=>a+(b-a)*t;
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const BASE='assets/vfx/techno-turret-base-v1.webp';
  const HEAD='assets/vfx/techno-turret-head-v1.webp';
  const MINE='effects-lab/assets/techno-mini-drone-red-v2-lossless.webp';
  // Anchors on the untrimmed artwork; muzzle and sprite share one rotation transform.
  const HEAD_PIVOT={x:.496094,y:.507813}, HEAD_MUZZLE={x:.498047,y:.865234}, BASE_PIVOT={x:.496,y:.533};
  const sprite=source=>window.SlimeGameAssets.projectSprite(source);
  let flare;
  function flareSprite(){
    if(flare)return flare;
    flare=document.createElement('canvas');flare.width=flare.height=96;
    const c=flare.getContext('2d'),g=c.createRadialGradient(48,48,0,48,48,48);
    g.addColorStop(0,'rgba(255,255,238,1)');g.addColorStop(.18,'rgba(255,231,185,.96)');
    g.addColorStop(.4,'rgba(255,52,73,.75)');g.addColorStop(1,'rgba(255,28,56,0)');
    c.fillStyle=g;c.fillRect(0,0,96,96);return flare;
  }
  function muzzle(e,cell){
    const size=cell*1.8,dx=(HEAD_MUZZLE.x-HEAD_PIVOT.x)*size,dy=(HEAD_MUZZLE.y-HEAD_PIVOT.y)*size;
    return {x:e.x+Math.cos(e.angle)*dx-Math.sin(e.angle)*dy,y:e.y+Math.sin(e.angle)*dx+Math.cos(e.angle)*dy};
  }
  function targets(run,s,y,rows=7.5){
    const cell=run.cellSize;
    return s.blocksNearY(y+cell*rows*.5,cell*rows*.55).filter(b=>
      s.elementalDamageable(b)&&!b.special&&center(b).y>y+cell*.85&&center(b).y<=y+cell*rows);
  }
  function start(run,type,at,x,y,s){
    const p=run.ultimateProfile;
    if(type!=='nano'||!p||p.stage>=3)return false;
    const cell=run.cellSize;
    const e=run.technoUltimate={kind:p.kind,startedAt:at,lastAt:at,x,y,angle:0,aim:null,
      mines:[],blasts:[],bullets:[],reserved:new Set(),shotsFired:0,lastShotAt:-Infinity};
    if(p.kind==='mineSalvo'){
      sprite(MINE);
      const chosen=[],pool=targets(run,s,y);
      for(let i=0;i<p.mineCount;i++){
        pool.sort((a,b)=>{
          const score=b=>Math.min(...chosen.map(q=>Math.abs(q.col-b.col)*2+Math.abs(q.row-b.row)),8)+(b.hp>=2?.7:0);
          return score(b)-score(a);
        });
        const target=pool.shift()||null;if(target)chosen.push(target);
        const to=target?center(target):{x:run.gridOffsetX+(.5+(i+1)%run.columns)*cell,y:y+cell*(3+i*.5)};
        e.mines.push({target,toX:to.x,toY:to.y,fromX:x,fromY:y,markedAt:at,
          launchedAt:at+100+i*130,launched:false,side:i%2?-1:1,bend:cell*(.85+i*.05)});
      }
    }else{
      sprite(BASE);sprite(HEAD);
      const desired=y+cell*2.8;
      const landing=targets(run,s,y,4.5).sort((a,b)=>{
        const score=b=>Math.abs(center(b).y-desired)+Math.abs(center(b).x-x)*.85;
        return score(a)-score(b);
      })[0];
      const point=landing?center(landing):{x:clamp(x,run.gridOffsetX+cell,run.gridOffsetX+(run.columns-1)*cell),y:desired};
      Object.assign(e,{x:point.x,y:point.y,fromX:x,fromY:y-cell*2.8,landingTarget:landing||null,
        landAt:at+p.landMs,activeUntil:at+p.landMs+p.activeMs,nextShotAt:at+p.landMs+150,
        phase:'descending',landed:false,landingHitAt:0,landedAt:0});
    }
    return true;
  }
  function mark(b,at,until){if(!b||b.dead)return;b.nanoLaserStartedAt=at;b.nanoLaserUntil=until;}
  function updateMines(run,e,at,s){
    const cell=run.cellSize;
    e.mines=e.mines.filter(m=>{
      if(at<m.launchedAt)return true;
      if(!m.launched){
        if(!s.elementalDamageable(m.target)){
          const excluded=new Set(e.mines.filter(q=>q!==m).map(q=>q.target));
          const replacement=targets(run,s,run.slime.y).find(b=>!excluded.has(b));
          if(replacement){m.target=replacement;const to=center(replacement);m.toX=to.x;m.toY=to.y;}
        }
        const eye=s.nanoEyePosition();m.fromX=eye.x;m.fromY=eye.y;m.launched=true;m.launchedAt=at;
        run.nanoEyeOpenedAt=at-155;
      }
      if(at-m.launchedAt<650)return true;
      const hit=targets(run,s,m.toY-cell*2,3.5).filter(b=>{
        const q=center(b);return Math.abs(q.x-m.toX)<=cell*1.05&&Math.abs(q.y-m.toY)<=cell*1.05
          &&(Math.abs(q.x-m.toX)<cell*.45||Math.abs(q.y-m.toY)<cell*.45);
      });
      for(const b of hit)s.damageBlockByElement(b,b===m.target?2:1,'nanoUltimate',at);
      e.blasts.push({x:m.toX,y:m.toY,size:cell,at});run.shake=Math.max(run.shake||0,2.8);
      s.sound('break');return false;
    });
    e.blasts=e.blasts.filter(b=>at-b.at<430);
  }
  function updateTurret(run,e,at,s){
    const p=run.ultimateProfile,cell=run.cellSize;
    if(!e.landed&&at>=e.landAt){
      e.landed=true;e.phase='active';e.landedAt=at;e.landingHitAt=at+85;
      mark(e.landingTarget,at,e.landingHitAt);
      run.shake=Math.max(run.shake||0,3);s.sound('hitHard');
    }
    if(e.landingHitAt&&at>=e.landingHitAt){s.disintegrate(e.landingTarget,at);e.landingHitAt=0;}
    e.bullets=e.bullets.filter(b=>{
      if(at-b.startedAt<b.travelMs)return true;
      s.disintegrate(b.target,at);e.reserved.delete(b.target);return false;
    });
    if(!e.landed)return;
    if(at>=e.activeUntil){e.phase='exiting';return;}
    // Keep the barrel on the fired round through its muzzle flash/recoil.
    if(at-e.lastShotAt<110)return;
    if(e.aim&&(!s.elementalDamageable(e.aim)||e.reserved.has(e.aim)))e.aim=null;
    if(!e.aim){
      const pending=new Set((run.nanoShots||[]).map(b=>b.target));
      const desired=Math.max(e.y+cell*3,run.slime.y+cell*1.3);
      const candidates=targets(run,s,e.y,9).filter(b=>!e.reserved.has(b)&&!pending.has(b)
        &&b.hp>=b.maxHp&&!b.phantomMarked&&Math.abs(center(b).x-e.x)<(center(b).y-e.y)*1.3);
      candidates.sort((a,b)=>{
        const score=b=>Math.abs(center(b).y-desired)*.8+Math.abs(center(b).x-e.x)*.35;
        return score(a)-score(b);
      });e.aim=candidates[0]||null;
    }
    if(!e.aim)return;
    const target=center(e.aim),wanted=Math.atan2(target.y-e.y,target.x-e.x)-Math.PI/2;
    const dt=clamp((at-e.lastAt)/1000,0,.08),delta=angleDelta(e.angle,wanted);
    e.angle+=clamp(delta,-dt*8,dt*8);
    if(at<e.nextShotAt||Math.abs(angleDelta(e.angle,wanted))>.08)return;
    const from=muzzle(e,cell),distance=Math.hypot(target.x-from.x,target.y-from.y);
    const travelMs=clamp(distance/(cell*.024),110,300);
    const b={fromX:from.x,fromY:from.y,toX:target.x,toY:target.y,target:e.aim,startedAt:at,travelMs};
    e.bullets.push(b);e.reserved.add(e.aim);mark(e.aim,at,at+travelMs);
    e.aim=null;e.lastShotAt=at;e.shotsFired++;e.nextShotAt=at+p.shotIntervalMs;
    s.sound('tap');
  }
  function update(run,at,s){
    const e=run.technoUltimate;if(!e)return;
    if(e.kind==='mineSalvo')updateMines(run,e,at,s);else updateTurret(run,e,at,s);
    e.lastAt=at;
    if(at-e.startedAt>=run.ultimateProfile.durationMs)run.technoUltimate=null;
  }
  function shiftClock(run,delta,shiftedTargets=new Set()){
    const e=run.technoUltimate;if(!e)return;
    for(const key of ['startedAt','lastAt','landAt','activeUntil','nextShotAt','lastShotAt','landedAt','landingHitAt'])if(Number.isFinite(e[key])&&e[key]!==0)e[key]+=delta;
    for(const m of e.mines){m.markedAt+=delta;m.launchedAt+=delta;}
    for(const b of e.blasts)b.at+=delta;
    for(const b of e.bullets)b.startedAt+=delta;
    for(const b of [e.landingTarget,...e.bullets.map(b=>b.target)])if(b&&b.nanoLaserUntil>0&&!shiftedTargets.has(b)){
      b.nanoLaserStartedAt+=delta;b.nanoLaserUntil+=delta;shiftedTargets.add(b);
    }
  }
  function flash(c,x,y,size,alpha){if(alpha<=0)return;c.globalAlpha=alpha;c.drawImage(flareSprite(),x-size/2,y-size/2,size,size);}
  function drawMines(c,run,e,at){
    const art=sprite(MINE),cell=run.cellSize,camera=run.cameraY;
    for(const m of e.mines){
      if(m.target&&!m.target.dead&&window.BlockEffectDraft)window.BlockEffectDraft.drawNanoTarget(c,m.target.x,m.target.y-camera,Math.min(m.target.w,m.target.h),at);
      if(!m.launched)continue;
      const t=clamp((at-m.launchedAt)/650,0,1),point=window.SlimeTechnoFeedback.minePoint(m,t),size=cell*.38;
      window.SlimeTechnoFeedback.mineWake(c,m,t,camera,size);
      c.save();c.translate(point.x,point.y-camera);c.rotate(point.angle-Math.PI/2);
      if(art.complete&&art.naturalWidth)c.drawImage(art,art.naturalWidth*277/1254,art.naturalHeight*268/1254,
        art.naturalWidth*695/1254,art.naturalHeight*688/1254,-size/2,-size/2,size,size);c.restore();
    }
    for(const b of e.blasts)window.SlimeTechnoFeedback.mineBlast(c,b,camera,at);
  }
  function drawTurret(c,run,e,at){
    const p=run.ultimateProfile,cell=run.cellSize,camera=run.cameraY;
    const t=clamp((at-e.startedAt)/p.landMs,0,1),fall=t*t;
    const x=e.landed?e.x:mix(e.fromX,e.x,t),y=(e.landed?e.y:mix(e.fromY,e.y,fall))-camera;
    const alpha=clamp((p.durationMs-(at-e.startedAt))/450,0,1);
    if(y>-cell*2&&y<(run.viewHeight||900)+cell*2){
      const base=sprite(BASE),head=sprite(HEAD),scale=.74+t*.26,bs=cell*1.9*scale,hs=cell*1.8*scale;
      const landedAge=e.landed?at-e.landedAt:Infinity;
      if(landedAge<420){c.globalCompositeOperation='lighter';flash(c,e.x,e.y-camera,cell*(1.4+landedAge/180),(1-landedAge/420)*.7);}
      c.globalCompositeOperation='source-over';c.globalAlpha=alpha;
      if(base.complete&&base.naturalWidth)c.drawImage(base,x-bs*BASE_PIVOT.x,y-bs*BASE_PIVOT.y,bs,bs);
      const recoilAge=at-e.lastShotAt,recoil=recoilAge<110?Math.sin(recoilAge/110*Math.PI)*cell*.06:0;
      c.save();c.translate(x+Math.sin(e.angle)*recoil,y-Math.cos(e.angle)*recoil);c.rotate(e.angle);
      if(head.complete&&head.naturalWidth)c.drawImage(head,-hs*HEAD_PIVOT.x,-hs*HEAD_PIVOT.y,hs,hs);c.restore();
      if(recoilAge<100){const point=muzzle(e,cell);c.globalCompositeOperation='lighter';flash(c,point.x,point.y-camera,cell*.75,(1-recoilAge/100)*alpha);}
    }
    c.globalCompositeOperation='lighter';c.lineCap='round';
    for(const b of e.bullets){
      const progress=clamp((at-b.startedAt)/b.travelMs,0,1),dx=b.toX-b.fromX,dy=b.toY-b.fromY,d=Math.hypot(dx,dy)||1;
      const bx=mix(b.fromX,b.toX,progress),by=mix(b.fromY,b.toY,progress)-camera;
      if(by<-cell||by>(run.viewHeight||900)+cell)continue;
      const length=Math.min(cell*.34,d*progress),tx=bx-dx/d*length,ty=by-dy/d*length;
      c.globalAlpha=1;
      for(const [colour,width]of [['#ff263e',6],['#ffe8cd',2.5]]){c.strokeStyle=colour;c.lineWidth=width;c.beginPath();c.moveTo(tx,ty);c.lineTo(bx,by);c.stroke();}
      flash(c,bx,by,cell*.46,.5);
    }
  }
  function draw(c,run,at){const e=run.technoUltimate;if(!e)return;c.save();if(e.kind==='mineSalvo')drawMines(c,run,e,at);else drawTurret(c,run,e,at);c.restore();}
  window.SlimeTechnoUltimates=Object.freeze({start,update,draw,shiftClock,muzzle});
})();
