/* All placements are in face coordinates; body and face transforms are inherited. */
(() => {
  'use strict';
  const fits=window.SlimeAccessoryFit || {},sprites=new Map();
  const pending=Object.entries(fits).filter(([,fit])=>fit.image).map(([id,fit])=>{
    const image=new Image();image.decoding='async';
    const entry={image,ready:false};sprites.set(id,entry);
    return new Promise((resolve,reject)=>{
      image.onload=()=>{entry.ready=true;resolve()};image.onerror=()=>reject(new Error(`Accessory unavailable: ${id}`));
      image.src=window.SlimeGameAssets.versionedAsset(fit.image);
    });
  });
  const ready=Promise.all(pending);ready.catch(()=>{});
  const closedLid=(id,{blink=false,emotion='focused'}={})=>id==='lashes'&&(blink||['petting','pleased','chewing','savoring','anticipating','impact','power'].includes(emotion));
  function draw(ctx,id,{radius,cuteV2=true,blink=false,emotion='focused'}={}) {
    const fit=fits[id],sprite=sprites.get(id);if(!fit||!Number.isFinite(radius)||radius<=0)return;
    const faceScale=cuteV2?1:.82;
    if(fit.kind==='lashes'){
      if(emotion==='hurt'&&!blink)return;
      const closed=closedLid(id,{blink,emotion});
      const eyeX=cuteV2?(closed?.305:.325):.245,eyeY=cuteV2?.005:-.12;
      const openRoots=[[.055,-.223,.035,-.075],[.135,-.177,.070,-.082],[.195,-.116,.105,-.055]];
      ctx.save();ctx.fillStyle='#083b36';
      for(const side of [-1,1]){
        for(let i=0;i<3;i++){
          let [x,y,dx,dy]=openRoots[i];
          if(closed){
            // Points on the same cubic curve used by the closed eyelid.
            const u=[.59,.76,.91][i],v=1-u;
            x=v*v*v*(-.17)+3*v*v*u*(-.095)+3*v*u*u*.095+u*u*u*.17;
            y=eyeY+.035-.42*u*v;
          } else y=cuteV2?y:eyeY+(y-.023)*faceScale;
          const px=side*radius*(eyeX+x*faceScale),py=radius*y;
          const tipX=px+side*radius*dx*faceScale,tipY=py+radius*dy*faceScale;
          const bendX=px+side*radius*dx*.18*faceScale,bendY=py+radius*dy*.78*faceScale;
          const half=Math.max(.55,radius*.011)*faceScale;
          // A small curved ribbon narrows to a soft point instead of a blunt stick.
          ctx.beginPath();ctx.moveTo(px-side*half,py+radius*.008);
          ctx.quadraticCurveTo(bendX-side*half,bendY,tipX,tipY);
          ctx.quadraticCurveTo(bendX+side*half,bendY+half,px+side*half,py+radius*.008);
          ctx.closePath();ctx.fill();
        }
      }
      ctx.restore();
      return;
    }
    if(!sprite?.ready)return;
    const scale=fit.span?radius*fit.targetSpan*faceScale/fit.span:radius*fit.width*faceScale/fit.pixelWidth;
    const anchorY=cuteV2?fit.targetY:fit.targetY-(fit.coversMouth ? .12 : .15);
    ctx.save();ctx.translate(radius*(fit.targetX||0)*faceScale,radius*anchorY);if(fit.rotation)ctx.rotate(fit.rotation);
    ctx.drawImage(sprite.image,-fit.anchorX*scale,-fit.anchorY*scale,fit.pixelWidth*scale,fit.pixelHeight*scale);ctx.restore();
  }
  window.SlimeAccessories=Object.freeze({draw,whenReady:()=>ready,
    coversMouth:id=>Boolean(fits[id]?.coversMouth),coversEyes:id=>Boolean(fits[id]?.coversEyes),
    info:id=>fits[id]||null});
})();
