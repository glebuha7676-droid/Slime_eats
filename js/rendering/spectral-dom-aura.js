(() => {
  'use strict';
  // One loop for visible UI sprites; geometry changes only on layout/load.
  const entries=new Map(),art=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=0;
  function sprite(source){
    if(!art.has(source)){const image=new Image();image.onload=wake;image.src=source;art.set(source,image);}
    return art.get(source);
  }
  function geometry(entry){
    const {image,fx,canvas}=entry;
    const base=fx.getBoundingClientRect(),rect=image.getBoundingClientRect();
    if(!base.width||!base.height||!rect.width||!rect.height)return;
    const sx=base.width/fx.offsetWidth,sy=base.height/fx.offsetHeight;
    if(!sx||!sy)return;
    const w=rect.width/sx,h=rect.height/sy,pad=Math.max(w,h)*.28;
    const width=w+pad*2,height=h+pad*2,dpr=Math.min(devicePixelRatio||1,2);
    canvas.style.cssText=`position:absolute;pointer-events:none;left:${(rect.left-base.left)/sx-pad}px;top:${(rect.top-base.top)/sy-pad}px;width:${width}px;height:${height}px`;
    const pixelsW=Math.ceil(width*dpr),pixelsH=Math.ceil(height*dpr);
    if(canvas.width!==pixelsW||canvas.height!==pixelsH){canvas.width=pixelsW;canvas.height=pixelsH;}
    entry.rect=[pad,pad,w,h];entry.dpr=dpr;entry.dirty=false;
  }
  function wake(){
    if(frame||document.hidden)return;
    for(const entry of entries.values())if(entry.visible){frame=requestAnimationFrame(draw);break;}
  }
  function draw(time){
    frame=0;
    if(document.hidden)return;
    if(reduced.matches||time-last>=40){
      last=time;
      for(const entry of entries.values()){
        if(!entry.visible)continue;
        if(entry.dirty)geometry(entry);
        const source=sprite(entry.image.currentSrc||entry.image.src);
        if(!entry.rect||!source.complete||!source.naturalWidth)continue;
        const ctx=entry.canvas.getContext('2d');ctx.setTransform(entry.dpr,0,0,entry.dpr,0,0);
        ctx.clearRect(0,0,entry.canvas.width/entry.dpr,entry.canvas.height/entry.dpr);
        window.SlimeSpectralGlow.draw(ctx,source,entry.rect,reduced.matches?0:time,.85);
      }
    }
    if(!reduced.matches)wake();
  }
  const resize=new ResizeObserver(items=>{
    for(const item of items)for(const entry of entries.values())if(item.target===entry.image||item.target===entry.host)entry.dirty=true;
    wake();
  });
  const visibility=new IntersectionObserver(items=>{
    for(const item of items){const entry=entries.get(item.target);if(entry){entry.visible=item.isIntersecting;entry.dirty=true;}}
    wake();
  });
  function attach(fx){
    if(entries.has(fx))return;
    const host=fx.parentElement,image=host.querySelector('.food-model')||host.querySelector(':scope > img');
    if(!image)return;
    const canvas=document.createElement('canvas');canvas.className='spectral-ui-aura';fx.appendChild(canvas);
    const entry={host,fx,image,canvas,dirty:true,visible:false};entries.set(fx,entry);
    image.addEventListener('load',()=>{entry.dirty=true;wake();});
    resize.observe(host);resize.observe(image);visibility.observe(fx);
  }
  const observer=new MutationObserver(records=>{
    for(const record of records){
      if(record.type==='attributes'){
        for(const entry of entries.values())if(record.target===entry.image){entry.dirty=true;wake();}
      }else for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches('.mutation-phantom-fx'))attach(node);
        node.querySelectorAll('.mutation-phantom-fx').forEach(attach);
      }
    }
    for(const [fx,entry]of entries)if(!fx.isConnected){visibility.unobserve(fx);resize.unobserve(entry.host);resize.unobserve(entry.image);entries.delete(fx);}
  });
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','src']});
  document.querySelectorAll('.mutation-phantom-fx').forEach(attach);
  document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
})();
