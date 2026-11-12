/* World-one sentries and tethered seekers. Movement uses the game simulation clock. */
(() => {
  'use strict';
  const art={},paths={body:'assets/hazards/thorns-v1/sentry-body.webp',eyes:'assets/hazards/thorns-v1/sentry-eyes.webp',chaser:'assets/hazards/thorns-red-v2/chaser.webp'};
  function preload(){
    if(typeof Image==='undefined')return;
    for(const [key,path]of Object.entries(paths))if(!art[key]){
      const image=new Image();
      image.decoding='async';image.src=window.SlimeGameAssets?.versionedAsset(path)||path;art[key]=image;
    }
  }
  function reindex(run,b){
    const row=Math.max(0,Math.min(run.rowCount-1,Math.floor((b.y+b.h/2-run.blockRowOrigin)/run.cellSize)));
    if(row!==b.row&&run.blocksByRow){
      const old=run.blocksByRow.get(b.row),at=old?.indexOf(b)??-1;
      if(at>=0)old.splice(at,1);
      if(!run.blocksByRow.has(row))run.blocksByRow.set(row,[]);
      run.blocksByRow.get(row).push(b);
    }
    b.row=row;b.col=Math.max(0,Math.min(run.columns-1,Math.floor((b.x+b.w/2-run.gridOffsetX)/run.cellSize)));
  }
  function move(b,x,y,distance){
    const dx=x-b.x,dy=y-b.y,length=Math.hypot(dx,dy);
    if(length<=distance){b.x=x;b.y=y;return true;}
    b.x+=dx/length*distance;b.y+=dy/length*distance;return false;
  }
  function update(run,dt){
    if(!run||!(dt>0)||run.paused||run.evacuation||run.coreEncounter)return;
    for(const b of run.movingHazards||[]){
      if(b.dead||b.glitchNeutralized||b.frozen||b.elementalSnow||b.elementalSnowflake)continue;
      if(b.chase){
        const h=b.chase,s=run.slime,cell=run.cellSize;
        const dx=s.x-h.x-b.w/2,dy=s.y-h.y-b.h/2;
        const distance=Math.hypot(dx,dy);
        const within=distance<=cell*7;
        const outside=!within;
        if(h.state==='idle'&&within){h.state='alert';h.age=0;}
        if((h.state==='alert'||h.state==='chasing')&&outside){h.state='returning';h.age=0;}
        h.age+=dt;
        if(h.state==='alert'&&h.age>=.24){h.state='chasing';h.age=0;}
        if(h.state==='chasing')move(b,Math.max(run.gridOffsetX,Math.min(run.gridOffsetX+run.columns*cell-b.w,s.x-b.w/2)),s.y-b.h/2,cell*.85*dt);
        if(h.state==='returning'&&move(b,h.x,h.y,cell*1.35*dt)){h.state='idle';h.age=0;}
      }else if(b.motion){
        const m=b.motion;m.clock=(m.clock||0)+dt*1000;
        const p=m.min+(m.max-m.min)*(.5-.5*Math.cos(m.clock*Math.PI*2/m.period+m.phase));
        if(m.axis==='x')b.x=p;else b.y=p;
      }
      reindex(run,b);
    }
  }
  function draw(c,b,sy,size,at,reduced=false){
    const chaser=!!b.chase,image=chaser?art.chaser:art.body;
    if(!image?.complete||!image.naturalWidth)return false;
    const x=b.x+b.w/2,y=sy+b.h/2,alert=chaser&&b.chase.state==='alert';
    const pulse=alert?Math.sin(Math.min(1,b.chase.age/.24)*Math.PI):0;
    c.save();c.translate(x,y);c.scale(1+pulse*.10,1+pulse*.10);
    if(chaser){
      c.drawImage(image,-size/2,-size/2,size,size);
      if(alert&&!reduced){
        c.strokeStyle=`rgba(255,134,119,${(1-b.chase.age/.24)*.8})`;c.lineWidth=2;
        c.beginPath();c.arc(0,0,size*(.37+b.chase.age*.55),0,Math.PI*2);c.stroke();
      }
    }else{
      c.save();if(!reduced)c.rotate((b.motion?.clock||0)/550+b.id);
      c.drawImage(image,-size*.47,-size*.59,size*.94,size*.94);c.restore();
      if(art.eyes?.complete&&art.eyes.naturalWidth)c.drawImage(art.eyes,-size*.24,-size*.24,size*.48,size*.48);
    }
    c.restore();return true;
  }
  const api=Object.freeze({preload,update,draw});
  if(typeof window!=='undefined')window.SlimeThornHazards=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
