/* One generated root network coats existing rock; breaking its knot removes only the armour. */
(() => {
  'use strict';
  const art={};
  function preload(){
    if(typeof Image==='undefined')return;
    for(const key of ['network','core'])if(!art[key]){
      const path=`assets/hazards/bramble-v1/${key}.webp`,image=new Image();
      image.decoding='async';image.src=window.SlimeGameAssets?.versionedAsset(path)||path;art[key]=image;
    }
  }
  function init(run,blocks=run.blocks){
    run.brambleGroups=new Map();run.brambleBursts=[];
    for(const b of blocks)if(b.bramble&&!b.dead){
      const data=b.bramble;let group=run.brambleGroups.get(data.groupId);
      if(!group){group={blocks:[],released:false};run.brambleGroups.set(data.groupId,group);}
      group.blocks.push(b);if(data.core)group.core=b;
    }
    if(run.brambleGroups.size)preload();
  }
  function collapse(run,core,at){
    if(!core?.dead||!core.bramble?.core)return 0;
    const group=run.brambleGroups?.get(core.bramble.groupId);if(!group||group.released)return 0;
    group.released=true;const visible=[];
    for(const b of group.blocks)if(!b.dead){
      if(b.y+b.h>run.cameraY-60&&b.y<run.cameraY+900)
        visible.push({x:b.x,y:b.y,w:b.w,h:b.h,bramble:{...b.bramble}});
      // Snow/other conversions retain their own HP. Damage already dealt is never healed.
      if(!b.elementalSnow&&!b.elementalSnowflake&&!b.frozenOre){
        b.maxHp=b.bramble.baseMaxHp;
        b.hp=Math.min(b.hp,b.maxHp);
      }
      b.bramble=null;
    }
    if(visible.length){
      run.brambleBursts.push({at,parts:visible});
      if(run.brambleBursts.length>4)run.brambleBursts.shift();
      run.shake=Math.max(run.shake||0,3);
    }
    // Releasing armour is not a destroyed block: no extra currency, mastery or ultimate charge.
    return 0;
  }
  function ready(image){return image?.complete&&image.naturalWidth>0;}
  function drawRoot(c,b,sy){
    const image=art.network,d=b.bramble;if(!d||!ready(image))return;
    const sw=image.naturalWidth/d.columns,sh=image.naturalHeight/3;
    const col=d.mirror?d.columns-1-d.localCol:d.localCol;
    if(d.mirror){c.save();c.translate(b.x+b.w,sy);c.scale(-1,1);c.drawImage(image,col*sw,d.localRow*sh,sw,sh,0,0,b.w,b.h);c.restore();}
    else c.drawImage(image,col*sw,d.localRow*sh,sw,sh,b.x,sy,b.w,b.h);
  }
  function drawBlock(c,run,b,sy,at,reduced=false){
    if(!b.bramble||b.elementalSnow||b.elementalSnowflake||b.frozenOre)return;
    drawRoot(c,b,sy);
    if(b.bramble.core&&ready(art.core)){
      const pulse=reduced?1:1+.025*Math.sin(at/300),size=b.w*.98*pulse;
      c.drawImage(art.core,b.x+(b.w-size)/2,sy+(b.h-size)/2,size,size);
    }
  }
  function draw(c,run,at){
    const bursts=run.brambleBursts;if(!bursts?.length)return;
    let keep=0;
    for(const burst of bursts){
      const p=Math.max(0,(at-burst.at)/480);if(p>=1)continue;bursts[keep++]=burst;
      c.save();c.globalAlpha*=(1-p)**1.5;
      // Keep branches joined while the coating fades; never stretch or scatter rectangular tiles.
      for(const b of burst.parts){const y=b.y-run.cameraY;if(y+b.h<0||y>900)continue;drawRoot(c,b,y);}
      c.restore();
    }bursts.length=keep;
  }
  function shiftClock(run,delta){for(const b of run.brambleBursts||[])b.at+=delta;}
  const api=Object.freeze({preload,init,collapse,drawBlock,draw,shiftClock});
  if(typeof window!=='undefined')window.SlimeBrambleObstacles=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
