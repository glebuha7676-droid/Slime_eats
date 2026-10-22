(() => {
  'use strict';
  const STAR='assets/vfx/cosmos-falling-star-v1.webp';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const center=b=>({x:b.x+b.w/2,y:b.y+b.h/2});
  const sprite=()=>window.SlimeGameAssets.projectSprite(STAR);
  let glow;
  function halo(){
    if(glow)return glow;
    glow=document.createElement('canvas');glow.width=glow.height=96;
    const c=glow.getContext('2d'),g=c.createRadialGradient(48,48,0,48,48,47);
    g.addColorStop(0,'rgba(255,255,239,1)');g.addColorStop(.14,'rgba(255,241,161,.95)');
    g.addColorStop(.36,'rgba(164,180,255,.55)');g.addColorStop(1,'rgba(128,98,255,0)');
    c.fillStyle=g;c.fillRect(0,0,96,96);return glow;
  }
  function start(run,at){
    const p=run.ultimateProfile;if(!['planetBoost','starfall'].includes(p?.kind))return false;
    run.cosmosStagedUltimate={kind:p.kind,startedAt:at,stars:[],bursts:[],hits:new Map(),launched:0,impacts:0};
    if(p.kind==='starfall'){
      sprite();
      for(let i=0;i<p.starCount;i++)run.cosmosStagedUltimate.stars.push({index:i,launchAt:at+i*p.starIntervalMs,launched:false,impacted:false});
    }
    return true;
  }
  function orbitBoost(run,at){
    const e=run.cosmosStagedUltimate,p=run.ultimateProfile;
    if(e?.kind!=='planetBoost'||at<e.startedAt||at>=e.startedAt+p.durationMs)return {scale:1,strength:0,damage:1,active:false};
    const age=at-e.startedAt,strength=clamp(Math.min(age/180,(p.durationMs-age)/280),0,1);
    const eased=strength*strength*(3-2*strength);
    return {scale:mix(1,p.planetScale,eased),strength:eased,damage:p.damage,active:true};
  }
  function pickTarget(run,e,index,s){
    const cell=run.cellSize,minY=Math.max(run.slime.y+cell*.7,run.cameraY+cell*1.4);
    const maxY=run.cameraY+(run.viewHeight||780)-cell*.8;
    if(minY>maxY)return null;
    const desiredCol=[2,4,1,3,5,0][index%6]%run.columns;
    const desiredY=mix(minY,maxY,.2+(index%4)*.2);
    let best=null,score=Infinity;
    for(const b of s.blocksNearY((minY+maxY)/2,(maxY-minY)/2+cell)){
      if(!s.elementalDamageable(b)||b.special)continue;
      const q=center(b);if(q.y<minY||q.y>maxY)continue;
      let reserved=0;for(const star of e.stars)if(star.launched&&!star.impacted&&star.target===b)reserved++;
      const rank=Math.abs(b.col-desiredCol)*cell*2+Math.abs(q.y-desiredY)*.4+reserved*cell*3+(e.hits.get(b)||0)*cell*1.5;
      if(rank<score){score=rank;best=b;}
    }
    return best;
  }
  function launch(run,e,star,s){
    const cell=run.cellSize,target=pickTarget(run,e,star.index,s),q=target?center(target):{
      x:run.gridOffsetX+((star.index*5)%run.columns+.5)*cell,
      y:run.cameraY+(run.viewHeight||780)+cell};
    star.target=target;star.toX=q.x;star.toY=q.y;
    star.fromX=clamp(q.x+Math.sin(star.index*2.4)*cell*.7,run.gridOffsetX+cell*.25,run.gridOffsetX+(run.columns-.25)*cell);
    star.fromY=run.cameraY-cell*.55;
    star.flightMs=clamp((star.toY-star.fromY)/(cell*12)*1000,580,1000);
    star.launched=true;e.launched++;
  }
  function point(star,at){
    const t=clamp((at-star.launchAt)/star.flightMs,0,1),fall=t*.45+t*t*.55;
    return {x:mix(star.fromX,star.toX,t),y:mix(star.fromY,star.toY,fall),t};
  }
  function impact(run,e,star,at,s){
    star.impacted=true;
    let target=star.target;
    if(!s.elementalDamageable(target)||target.special){
      // A destroyed destination can hand the star to one nearby block below it.
      target=s.blocksNearY(star.toY+run.cellSize*.5,run.cellSize)
        .filter(b=>s.elementalDamageable(b)&&!b.special&&Math.abs(center(b).x-star.toX)<run.cellSize*.48
          &&center(b).y>=star.toY&&center(b).y<=star.toY+run.cellSize*1.5)
        .sort((a,b)=>a.y-b.y)[0];
    }
    if(!target)return;
    const q=center(target);
    // Exactly one target and one damage call per star. No area query for damage.
    s.damageBlockByElement(target,run.ultimateProfile.damage||1,'cosmosStarfall',at);e.hits.set(target,(e.hits.get(target)||0)+1);e.impacts++;
    e.bursts.push({...q,at,index:star.index});if(e.bursts.length>8)e.bursts.shift();
    s.sound?.(target.dead?'break':'hit');
  }
  function update(run,at,s){
    const e=run.cosmosStagedUltimate;if(!e)return;
    if(e.kind==='starfall'){
      for(const star of e.stars){
        if(at<star.launchAt)break;
        if(!star.launched)launch(run,e,star,s);
        if(!star.impacted&&at>=star.launchAt+star.flightMs)impact(run,e,star,at,s);
      }
      let write=0;for(const b of e.bursts)if(at-b.at<420)e.bursts[write++]=b;e.bursts.length=write;
    }
    if(at-e.startedAt>=run.ultimateProfile.durationMs)run.cosmosStagedUltimate=null;
  }
  function draw(c,run,at,lowPower=false){
    const e=run.cosmosStagedUltimate;if(e?.kind!=='starfall')return;
    const image=sprite(),cell=run.cellSize,camera=run.cameraY,view=run.viewHeight||780;
    c.save();
    for(const star of e.stars){
      if(!star.launched||star.impacted||at<star.launchAt)continue;
      const q=point(star,at);if(q.y-camera<-cell||q.y-camera>view+cell)continue;
      if(window.SlimeMutationImpacts)window.SlimeMutationImpacts.starTrail(c,image,star,at,point,camera,cell,lowPower);
      else {
      c.globalCompositeOperation='lighter';
      const count=lowPower?3:5;
      for(let i=count;i>0;i--){
        const tail=point(star,Math.max(star.launchAt,at-i*23)),size=cell*(.1+(count-i)*.035);
        c.globalAlpha=.12+(count-i)*.045;c.drawImage(halo(),tail.x-size/2,tail.y-camera-size/2,size,size);
      }
      const glowSize=cell*.75;c.globalAlpha=.65;c.drawImage(halo(),q.x-glowSize/2,q.y-camera-glowSize/2,glowSize,glowSize);
      }
      c.globalCompositeOperation='source-over';c.globalAlpha=1;c.save();c.translate(q.x,q.y-camera);
      c.rotate((star.index%2?1:-1)*(at-star.launchAt)*.003);
      const size=cell*.46;if(image.complete&&image.naturalWidth)c.drawImage(image,-size/2,-size/2,size,size);
      c.restore();
    }
    c.globalCompositeOperation='lighter';
    for(const b of e.bursts){
      if(window.SlimeMutationImpacts){window.SlimeMutationImpacts.starImpact(c,image,b,camera,cell,at,lowPower);continue;}
      const t=clamp((at-b.at)/420,0,1),size=cell*(.65+t*.7);
      c.globalAlpha=(1-t)**2*.8;c.drawImage(halo(),b.x-size/2,b.y-camera-size/2,size,size);
      if(!image.complete||!image.naturalWidth)continue;
      c.globalCompositeOperation='source-over';
      for(let i=0;i<(lowPower?2:3);i++){
        const a=i*Math.PI*2/3+b.index,r=cell*t*.6,w=cell*.1*(1-t);
        c.globalAlpha=(1-t)*.65;c.drawImage(image,b.x+Math.cos(a)*r-w/2,b.y-camera+Math.sin(a)*r-w/2,w,w);
      }
      c.globalCompositeOperation='lighter';
    }
    c.restore();
  }
  function shiftClock(run,delta){
    const e=run.cosmosStagedUltimate;if(!e)return;e.startedAt+=delta;
    for(const star of e.stars)star.launchAt+=delta;for(const b of e.bursts)b.at+=delta;
  }
  window.SlimeCosmosUltimates=Object.freeze({start,update,draw,shiftClock,orbitBoost});
})();
