(() => {
  'use strict';
  const cache=new WeakMap(),contourSources=new WeakMap(),size=384,pad=64;
  const contours=Object.entries(window.SlimeSpectralContours||{}).map(([path,anchors])=>[
    window.SlimeAssetPaths?.resolve(path)||path,anchors
  ]);
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
    for(const [color,blur,alpha]of [['#92ffe0',24,1],['#d0fff0',12,.85]]){
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
    // Four small, pre-baked frames gently deform only the diffuse outer edge.
    // The body and the near glow stay fixed. No extra wisps or live blur.
    const fringe=canvas(),f=fringe.getContext('2d');
    f.shadowColor='#56e6eb';f.shadowBlur=46;f.globalAlpha=.8;f.drawImage(mask,0,0);
    f.shadowBlur=0;f.globalAlpha=1;f.globalCompositeOperation='destination-out';f.drawImage(mask,0,0);
    const waves=[];
    for(let n=0;n<4;n++){
      const c=document.createElement('canvas');c.width=c.height=192;
      const q=c.getContext('2d'),phase=n*Math.PI/2;
      for(let row=0;row<192;row++){
        const shift=Math.sin(row/192*Math.PI*3+phase)*1.7+Math.sin(row/192*Math.PI*5-phase)*.6;
        q.drawImage(fringe,0,row*512/192,512,512/192,shift,row,192,1);
      }
      q.globalCompositeOperation='destination-out';q.drawImage(mask,0,0,192,192);
      waves.push(c);
    }
    const result={outer,inner,anchors,waves};cache.set(image,result);return result;
  }
  function draw(ctx,image,rect,time,strength=1,part='all'){
    if(!image||strength<=0)return;
    const {outer,inner,waves}=layers(image),[x,y,w,h]=rect,px=w*pad/size,py=h*pad/size;
    const ow=w+px*2,oh=h+py*2;
    ctx.save();const alpha=ctx.globalAlpha*strength;
    if(part!=='inner'){
      // A continuous, softly blended fringe follows the exact silhouette.
      ctx.globalAlpha=Math.min(1,alpha*.98);ctx.drawImage(outer,x-px,y-py,ow,oh);
      const phase=((time/850)%4+4)%4,index=Math.floor(phase),blend=phase-index;
      ctx.globalAlpha=Math.min(1,alpha*(1-blend));ctx.drawImage(waves[index],x-px,y-py,ow,oh);
      ctx.globalAlpha=Math.min(1,alpha*blend);ctx.drawImage(waves[(index+1)%4],x-px,y-py,ow,oh);
    }
    if(part!=='outer'){
      ctx.globalCompositeOperation='screen';ctx.globalAlpha=Math.min(1,alpha*1.15);
      ctx.drawImage(inner,x-px,y-py,ow,oh);
    }ctx.restore();
  }
  function useContour(target,source){contourSources.set(target,source);}
  window.SlimeSpectralGlow=Object.freeze({draw,layers,useContour});
})();
