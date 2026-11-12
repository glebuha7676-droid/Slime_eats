/* Flooded desert encounters. Visual warping uses generated sprites, physics uses simulation time. */
(() => {
  'use strict';
  const TAU=Math.PI*2,art={},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function preload(){
    if(typeof Image==='undefined')return;
    for(const name of ['vortex','tentacle','sea-mine'])if(!art[name]){
      const image=new Image(),path=`assets/hazards/water-v1/${name}.webp`;
      image.decoding='async';image.src=window.SlimeGameAssets?.versionedAsset(path)||path;art[name]=image;
    }
  }
  function init(run,blocks=run.blocks){
    run.waterHazards=blocks.filter(b=>b.water);run.waterTime=0;run.waterGrab=null;run.waterBursts=[];
    if(run.waterHazards.length)preload();
    for(const b of run.waterHazards)Object.assign(b.water,{state:'idle',age:0,hitCooldown:0,exploded:false,points:new Float32Array(58),ribbon:new Float32Array(116)});
  }
  const awake=b=>!b.dead&&!b.glitchNeutralized&&!b.frozen&&!b.elementalSnow&&!b.elementalSnowflake;
  const visible=(run,y,margin=150)=>y>=run.cameraY-margin&&y<=run.cameraY+840+margin;
  function release(run){
    const g=run.waterGrab;if(!g)return;
    run.slime.vx=g.source.water.side*200;run.slime.vy=240;
    run.waterGrab=null;
    if(!g.source.dead){g.source.water.state='retract';g.source.water.age=0;}
  }
  function detonate(run,b,hooks={}){
    if(!b?.water||b.water.exploded)return false;
    b.water.exploded=true;b.water.state='spent';
    const x=b.x+b.w/2,y=b.y+b.h/2;
    if(visible(run,y))run.waterBursts.push({x,y,age:0});
    hooks.detonate?.(b);
    if(Math.hypot(run.slime.x-x,run.slime.y-y)<run.cellSize*1.65+run.slime.radius)hooks.hurt?.(x,y);
    return true;
  }
  function update(run,dt,input={},hooks={}){
    if(!run?.waterHazards?.length||!(dt>0)||run.paused||run.evacuation||run.coreEncounter)return;
    run.waterTime+=dt;
    let live=0;for(const p of run.waterBursts){p.age+=dt;if(p.age<.65)run.waterBursts[live++]=p;}run.waterBursts.length=live;
    const s=run.slime,cell=run.cellSize;
    if(run.waterGrab){
      const g=run.waterGrab;
      if(!awake(g.source))release(run);
      else{
        g.age+=dt*(1+Math.abs(input.x||0)*.6+(input.down||0)*.8);
        const blend=smooth(g.age/.14);s.x=g.fromX+(g.x-g.fromX)*blend;s.y=g.fromY+(g.y-g.fromY)*blend;s.vx=s.vy=0;
        if(g.age>=.62)release(run);
      }
    }
    for(const b of run.waterHazards){
      if(!awake(b))continue;
      const h=b.water,x=b.x+b.w/2,y=b.y+b.h/2;
      h.age+=dt;h.hitCooldown=Math.max(0,h.hitCooldown-dt);
      if(h.kind==='vortex'){
        if(Math.hypot(s.x-x,s.y-y)<cell*.38&&!h.hitCooldown&&!run.waterGrab){h.hitCooldown=1.1;hooks.hurt?.(x,y);}
      }else if(h.kind==='seaMine'){
        if(Math.hypot(s.x-x,s.y-y)<cell*.37+s.radius)hooks.mine?.(b);
      }else{
        const inRange=Math.abs(s.y-y)<cell*2.4&&(h.side>0?s.x<run.gridOffsetX+cell*3:s.x>run.gridOffsetX+cell*3);
        if(h.state==='idle'&&inRange&&visible(run,y)){
          h.state='warning';h.age=0;h.targetX=clamp(s.x,run.gridOffsetX+cell*.7,run.gridOffsetX+cell*5.3);h.targetY=y+cell*.8;
        }
        if(h.state==='warning'&&h.age>=.7){h.state='strike';h.age=0;}
        if(h.state==='strike'){
          if(!hooks.immune&&h.age>=.18&&h.age<.38&&Math.hypot(s.x-h.targetX,s.y-h.targetY)<s.radius+cell*.35&&!run.waterGrab){
            hooks.hurt?.(h.targetX,h.targetY);
            if(!run.evacuation){run.waterGrab={source:b,x:h.targetX,y:h.targetY,fromX:s.x,fromY:s.y,age:0};h.state='hold';h.age=0;}
          }else if(h.age>=.46){h.state='retract';h.age=0;}
        }
        if(h.state==='retract'&&h.age>=.45){h.state='cooldown';h.age=0;}
        if(h.state==='cooldown'&&h.age>=2.8){h.state='idle';h.age=0;}
      }
      if(run.evacuation)break;
    }
  }
  function applyForces(run,dt,input={}){
    if(!run?.waterHazards?.length||run.waterGrab)return;
    const s=run.slime,cell=run.cellSize;
    for(const b of run.waterHazards){
      if(!awake(b)||b.water.kind!=='vortex')continue;
      const dx=b.x+b.w/2-s.x,dy=b.y+b.h/2-s.y,d=Math.hypot(dx,dy),range=cell*2;
      if(d>=range||d<.01)continue;
      const strength=smooth(1-d/range),down=clamp(input.down||0),side=clamp(Math.abs(input.x||0));
      s.vx+=(dx/d*cell*2.8-dy/d*cell*.65-s.vx*.65)*strength*dt*4*(1-side*.35);
      s.vy+=(dy/d*cell*2.1+dx/d*cell*.4-s.vy)*strength*dt*5*(1-down*.7);
      s.vy+=down*cell*3.5*strength*dt;
    }
  }
  function stamp(c,image,x,y,w,h,alpha=1){
    if(!image?.complete||!image.naturalWidth)return;
    const old=c.globalAlpha;c.globalAlpha*=alpha;c.drawImage(image,x-w/2,y-h/2,w,h);c.globalAlpha=old;
  }
  function drawBlock(c,run,b,sy){
    if(!b.water)return false;
    if(b.water.kind==='seaMine')stamp(c,art['sea-mine'],b.x+b.w/2,sy+b.h/2,b.w*.9,b.h*.9);
    return true;
  }
  function drawVortices(c,run,reduced=false){
    if(!run.waterHazards?.length)return;
    for(const b of run.waterHazards){
      if(!awake(b)||b.water.kind!=='vortex'||!visible(run,b.y,run.cellSize*2))continue;
      const size=run.cellSize*2.85;
      c.save();c.translate(b.x+b.w/2,b.y+b.h/2-run.cameraY);
      if(!reduced)c.rotate(run.waterTime*.55+b.id);
      stamp(c,art.vortex,0,0,size,size,.92);c.restore();
    }
  }
  function tentaclePoints(run,b){
    const h=b.water,cell=run.cellSize,rootX=h.side>0?run.gridOffsetX-10:run.gridOffsetX+run.columns*cell+10,rootY=b.y+cell*.7;
    const extension=h.state==='strike'?smooth(h.age/.22):h.state==='hold'?1:h.state==='retract'?1-smooth(h.age/.45):0;
    const tipX=rootX+h.side*cell*.9+(h.targetX-rootX-h.side*cell*.9||0)*extension;
    const tipY=rootY+(h.targetY-rootY||0)*extension;
    const g=run.waterGrab,held=g?.source===b;
    for(let i=0;i<=28;i++){
      const u=i/28;let x,y;
      if(held&&u>.60){const a=(u-.6)/.4*TAU*.90+(h.side>0?Math.PI:0),r=run.slime.radius*1.05;x=g.x+Math.cos(a)*r;y=g.y+Math.sin(a)*r*.8;}
      else{
        const q=held?u/.60:u,endX=held?g.x-h.side*run.slime.radius*1.05:tipX,endY=held?g.y:tipY;
        x=rootX+(endX-rootX)*q;y=rootY+(endY-rootY)*q-Math.sin(q*Math.PI)*cell*(.2+extension*.35);
      }
      h.points[i*2]=x;h.points[i*2+1]=y-run.cameraY;
    }
  }
  function clipTriangle(c,ax,ay,bx,by,cx,cy){
    const mx=(ax+bx+cx)/3,my=(ay+by+cy)/3;
    const al=Math.hypot(ax-mx,ay-my)||1,bl=Math.hypot(bx-mx,by-my)||1,cl=Math.hypot(cx-mx,cy-my)||1;
    // Shared mesh seams overlap by half a pixel to avoid antialiasing cuts in the skin.
    c.beginPath();c.moveTo(ax+(ax-mx)/al*.6,ay+(ay-my)/al*.6);
    c.lineTo(bx+(bx-mx)/bl*.6,by+(by-my)/bl*.6);
    c.lineTo(cx+(cx-mx)/cl*.6,cy+(cy-my)/cl*.6);c.closePath();c.clip();
  }
  function drawRibbonQuad(c,image,v,offset,sourceY,nextSourceY){
    const ax=v[offset],ay=v[offset+1],bx=v[offset+2],by=v[offset+3];
    const cx=v[offset+4],cy=v[offset+5],dx=v[offset+6],dy=v[offset+7];
    const width=image.naturalWidth,height=nextSourceY-sourceY;
    // Two affine triangles share exact edges. The texture bends as one continuous skin.
    c.save();clipTriangle(c,ax,ay,bx,by,cx,cy);
    let a=(bx-ax)/width,b=(by-ay)/width,u=(cx-ax)/height,d=(cy-ay)/height;
    c.transform(a,b,u,d,ax-u*sourceY,ay-d*sourceY);c.drawImage(image,0,0);c.restore();
    c.save();clipTriangle(c,bx,by,dx,dy,cx,cy);
    a=(dx-cx)/width;b=(dy-cy)/width;u=(dx-bx)/height;d=(dy-by)/height;
    c.transform(a,b,u,d,dx-a*width-u*nextSourceY,dy-b*width-d*nextSourceY);c.drawImage(image,0,0);c.restore();
  }
  function drawTentacle(c,run,b,front=false){
    const image=art.tentacle;if(!image?.complete||!image.naturalWidth)return;
    const h=b.water,held=run.waterGrab?.source===b;
    if(front&&!held)return;
    tentaclePoints(run,b);
    const extension=h.state==='strike'?smooth(h.age/.22):h.state==='hold'?1:h.state==='retract'?1-smooth(h.age/.45):0;
    const textureHeight=image.naturalHeight*(.30+extension*.70),rows=textureHeight/28,halfWidth=run.cellSize*.38;
    for(let i=0;i<=28;i++){
      const before=Math.max(0,i-1)*2,after=Math.min(28,i+1)*2;
      const dx=h.points[after]-h.points[before],dy=h.points[after+1]-h.points[before+1],length=Math.hypot(dx,dy)||1;
      const nx=-dy/length*halfWidth,ny=dx/length*halfWidth,x=h.points[i*2],y=h.points[i*2+1];
      h.ribbon[i*4]=x+nx;h.ribbon[i*4+1]=y+ny;h.ribbon[i*4+2]=x-nx;h.ribbon[i*4+3]=y-ny;
    }
    for(let i=0;i<28;i++){
      const isFront=held&&i>=17&&(h.points[i*2+1]+h.points[i*2+3])/2>run.waterGrab.y-run.cameraY+run.slime.radius*.15;
      if(front!==isFront)continue;
      drawRibbonQuad(c,image,h.ribbon,i*4,textureHeight-i*rows,textureHeight-(i+1)*rows);
    }
  }
  function draw(c,run,front=false,reduced=false){
    if(!run.waterHazards?.length)return;
    c.save();
    for(const b of run.waterHazards){
      if(!awake(b)||b.water.kind!=='tentacle'||!visible(run,b.y,250))continue;
      const h=b.water;
      if(!front&&h.state==='warning'){
        const p=clamp(h.age/.7),x=h.targetX,y=h.targetY-run.cameraY,r=run.cellSize*.52;
        c.fillStyle='rgba(255,124,149,.12)';c.strokeStyle='#ffb5bf';c.lineWidth=2;
        c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.stroke();
        c.strokeStyle='#ff6388';c.lineWidth=3;c.beginPath();c.arc(x,y,r,-Math.PI/2,-Math.PI/2+TAU*p);c.stroke();
      }
      drawTentacle(c,run,b,front);
    }
    if(!front)for(const p of run.waterBursts){
      if(!visible(run,p.y))continue;
      const q=p.age/.65,r=run.cellSize*(.35+q*2);
      c.globalAlpha=(1-q)**2;c.strokeStyle='#bafaff';c.lineWidth=5*(1-q)+1;
      c.beginPath();c.ellipse(p.x,p.y-run.cameraY,r,r*.8,0,0,TAU);c.stroke();
    }
    c.restore();
  }
  const api=Object.freeze({preload,init,update,applyForces,release,detonate,drawBlock,drawVortices,draw});
  if(typeof window!=='undefined')window.SlimeWaterHazards=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
