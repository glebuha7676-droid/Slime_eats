(() => {
  'use strict';
  const ASSET='assets/ui/anomaly-energy-v1/pickup.webp';
  let sprite,glow;
  function preload(){if(!sprite){sprite=new Image();sprite.decoding='async';sprite.src=window.SlimeGameAssets?.versionedAsset(ASSET)||ASSET;}}
  function build(run){
    preload();
    for(const b of run.blocks)if(b.special==='gel'){b.dead=true;b.hp=0;b.special=null;b.flaskTier=0;}
    const count=Math.max(2,Math.round(run.world.targetDepth/(500/3))),result=[];
    for(let i=0;i<count;i++){
      const target=Math.round(run.rowCount*(count===3?[.24,.54,.82][i]:(i+1)/(count+1)));
      let choice;
      const offsets=[0];for(let d=1;d<=Math.ceil(run.rowCount/(count+1));d++)offsets.push(d,-d);
      for(const offset of offsets){
        const row=target+offset;
        if(row<2||row>=run.rowCount-2||result.some(p=>Math.abs(p.row-row)<5))continue;
        const candidates=run.blocks.filter(b=>b.row===row&&!b.hazard&&!b.bramble&&!b.ice&&!b.special&&!b.flaskTier);
        candidates.sort((a,b)=>(a.path?0:2)-(b.path?0:2)+Math.abs(a.col-(run.tutorialRoute?.[row]??2.5))-Math.abs(b.col-(run.tutorialRoute?.[row]??2.5)));
        for(const b of candidates){
          const pocket=run.blocks.filter(c=>c.col===b.col&&Math.abs(c.row-row)<=1);
          const unsafe=run.blocks.some(c=>(c.hazard||c.bramble||c.ice)&&Math.abs(c.row-row)<=2&&Math.abs(c.col-b.col)<=1);
          if(pocket.length!==3||unsafe||pocket.some(c=>c.hazard||c.bramble||c.ice||c.special||c.flaskTier||c.motion))continue;
          choice={b,pocket};break;
        }
        if(choice)break;
      }
      if(!choice)continue;
      for(const b of choice.pocket){b.dead=true;b.hp=0;b.energyPocket=true;}
      const b=choice.b;
      result.push({id:`energy-${i}`,x:b.x+b.w/2,y:b.y+b.h/2,row:b.row,col:b.col,phase:i*2.1,collected:false});
    }
    return result;
  }
  function update(run,at,onCollect){
    if(!run||run.ended||run.coreEncounter)return;
    const s=run.slime;
    for(const p of run.energyPickups||[]){
      if(p.collected)continue;
      const y=p.y+Math.sin(at/420+p.phase)*4;
      if(Math.abs(y-s.y)>s.radius+25)continue;
      if(Math.hypot(s.x-p.x,s.y-y)>s.radius+21)continue;
      p.collected=true;p.collectedAt=at;run.energyStats.pickups++;
      onCollect(window.SlimeAnomalyEnergy.CONFIG.pickup,at);
    }
  }
  function draw(ctx,run,at){
    preload();if(!sprite?.complete||!sprite.naturalWidth)return;
    if(!glow){glow=document.createElement('canvas');glow.width=glow.height=96;const c=glow.getContext('2d'),g=c.createRadialGradient(48,48,4,48,48,48);g.addColorStop(0,'#d9ffb2a0');g.addColorStop(.4,'#a5ed7048');g.addColorStop(1,'#8ce66300');c.fillStyle=g;c.fillRect(0,0,96,96);}
    for(const p of run.energyPickups||[]){
      const age=p.collected?(at-p.collectedAt)/700:0;if(p.collected&&age>=1)continue;
      let x=p.x,y=p.y-run.cameraY+Math.sin(at/420+p.phase)*4;
      if(y< -80||y>920)continue;
      const t=1-Math.pow(1-Math.min(1,age),3);
      if(p.collected){x+=(run.slime.x-x)*t;y+=(run.slime.y-run.cameraY-25-y)*t-22*Math.sin(age*Math.PI);}
      const size=p.collected?54+age*22:54+Math.sin(at/650+p.phase)*2;
      ctx.save();ctx.globalAlpha=p.collected?1-age:.75;ctx.drawImage(glow,x-size*.8,y-size*.8,size*1.6,size*1.6);
      ctx.globalAlpha=p.collected?1-age:1;ctx.translate(x,y);ctx.rotate(Math.sin(at/720+p.phase)*.08);ctx.drawImage(sprite,-size/2,-size/2,size,size);
      if(!p.collected){const label=`+${window.SlimeAnomalyEnergy.CONFIG.pickup}%`;ctx.font='900 12px "Slime Nunito",sans-serif';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#12364b';ctx.strokeText(label,0,34);ctx.fillStyle='#ecffc1';ctx.fillText(label,0,34);}
      ctx.restore();
    }
  }
  window.SlimeEnergyPickups=Object.freeze({ASSET,build,update,draw});
})();
