(() => {
  'use strict';
  const source='assets/vfx/damage-impact-666.webp';
  let artwork;
  function image(){return artwork ||= window.SlimeGameAssets.projectSprite(source);}
  function preload(){return image().decode().catch(()=>{});}
  function reaction(at,startedAt,until,reduced=false){
    const age=at-startedAt,active=age>=0&&at<until;
    if(!active)return {age,active:false,alpha:1,flinch:0,tint:''};
    const flinch=age<240?Math.sin(Math.PI*age/240):0;
    const tint=age<220?'damage-red-strong':age<650?'damage-red-medium':age<1000?'damage-red-soft':'';
    const alpha=reduced||age<650?1:.54+.46*(.5+.5*Math.cos((age-650)*Math.PI*2/400));
    return {age,active,alpha,flinch,tint};
  }
  function draw(ctx,{at,startedAt,impact,cameraY,radius,reduced=false}){
    const age=at-startedAt;if(age<0||age>=580||!impact)return;
    const art=image();if(!art.complete||!art.naturalWidth)return;
    const t=age/580,nx=impact.nx??0,ny=impact.ny??-1;
    const angle=Math.atan2(ny,nx),fade=(1-t)**1.7;
    const size=radius*(1.25+Math.min(1,t/.2)*1.05);
    ctx.save();ctx.translate(impact.x,impact.y-cameraY);ctx.rotate(angle);
    ctx.globalAlpha*=fade*.92;
    ctx.drawImage(art,-size*.44,-size*.5,size,size);
    if(!reduced)for(let i=0;i<4;i++){
      const a=(i-1.5)*.63,travel=radius*(.4+t*(1.4+i%2*.4));
      const drop=radius*(.26-i%2*.05)*(1-t*.65);
      ctx.save();ctx.translate(Math.cos(a)*travel,Math.sin(a)*travel);
      ctx.rotate(a+t);ctx.globalAlpha*=.75;
      ctx.drawImage(art,-drop/2,-drop/2,drop,drop);ctx.restore();
    }
    ctx.restore();
  }
  window.SlimeDamageFeedback=Object.freeze({preload,reaction,draw});
})();
