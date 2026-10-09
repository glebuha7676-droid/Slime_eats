(() => {
  'use strict';
  const cache=new WeakMap(),contourSources=new WeakMap(),size=384,pad=64;
  const contours=Object.entries(window.SlimeSpectralContours||{}).map(([path,anchors])=>[
    window.SlimeAssetPaths?.resolve(path)||path,anchors
  ]);
  const wisp=new Image();wisp.src=(window.SlimeGameAssets?.versionedAsset||(p=>p))('assets/vfx/spectral-aura-wisp-v1-lossless.webp');
  function canvas(){const c=document.createElement('canvas');c.width=c.height=size+pad*2;return c;}
  function layers(image){
    if(cache.has(image))return cache.get(image);
    const mask=canvas(),m=mask.getContext('2d');
    m.drawImage(image,pad,pad,size,size);
    m.globalCompositeOperation='source-in';m.fillStyle='#b0ffe3';m.fillRect(0,0,mask.width,mask.height);
    // Pixel reads can throw SecurityError for local files / restricted hosts.
    // Use the exact same anchors baked from source alpha at asset preparation.
    let source=String((contourSources.get(image)||image).src||'').split('?')[0];
    try{source=decodeURIComponent(source);}catch{}
    const anchors=contours.find(([path])=>source===path||source.endsWith('/'+path))?.[1]||[];
    const outer=canvas(),o=outer.getContext('2d');
    for(const [color,blur,alpha]of [['#56e6eb',46,1],['#92ffe0',24,1],['#d0fff0',12,.85]]){
      o.globalAlpha=alpha;o.shadowColor=color;o.shadowBlur=blur;o.drawImage(mask,0,0);
    }
    o.shadowBlur=0;o.globalAlpha=1;o.globalCompositeOperation='destination-out';o.drawImage(mask,0,0);
    // Blur the inverse alpha into the body, then intersect its true alpha.
    // This makes light on the INSIDE of any silhouette, including deformed sprites.
    const inverse=canvas(),v=inverse.getContext('2d');
    v.fillStyle='#c4ffeb';v.fillRect(0,0,inverse.width,inverse.height);
    v.globalCompositeOperation='destination-out';v.drawImage(mask,0,0);
    const inner=canvas(),i=inner.getContext('2d');
    for(const [color,blur]of [['#78ffd8',26],['#ecfff7',12]]){
      i.shadowColor=color;i.shadowBlur=blur;i.drawImage(inverse,0,0);
    }
    i.shadowBlur=0;i.globalCompositeOperation='destination-in';i.drawImage(mask,0,0);
    i.globalCompositeOperation='source-over';i.globalAlpha=.16;i.drawImage(mask,0,0);
    const result={outer,inner,anchors};cache.set(image,result);return result;
  }
  function draw(ctx,image,rect,time,strength=1,part='all'){
    if(!image||strength<=0)return;
    const {outer,inner,anchors}=layers(image),[x,y,w,h]=rect,px=w*pad/size,py=h*pad/size;
    const ow=w+px*2,oh=h+py*2;
    ctx.save();const alpha=ctx.globalAlpha*strength;
    if(part!=='inner'){
      // The base never slides or scales away from the body. Only fuzzy tips
      // breathe around fixed points sampled from the actual alpha contour.
      ctx.globalAlpha=Math.min(1,alpha*.98);ctx.drawImage(outer,x-px,y-py,ow,oh);
      if(wisp.complete&&wisp.naturalWidth)for(let n=0;n<anchors.length;n++){
        const a=anchors[n],phase=time/430+n*1.71,length=Math.min(w,h)*(.20+.025*Math.sin(phase));
        ctx.save();ctx.translate(x+a.x*w,y+a.y*h);
        ctx.rotate(a.angle+Math.PI/2+.09*Math.sin(phase));
        ctx.globalAlpha=Math.min(1,alpha*(.42+.08*Math.sin(phase+.7)));
        ctx.drawImage(wisp,-length*.34,-length*.84,length*.68,length);ctx.restore();
      }
    }
    if(part!=='outer'){
      ctx.globalCompositeOperation='screen';ctx.globalAlpha=Math.min(1,alpha*1.15);
      ctx.drawImage(inner,x-px,y-py,ow,oh);
    }ctx.restore();
  }
  function useContour(target,source){contourSources.set(target,source);}
  window.SlimeSpectralGlow=Object.freeze({draw,layers,useContour});
})();
