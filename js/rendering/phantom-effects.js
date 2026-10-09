(() => {
  'use strict';
  const unit = n => Math.max(0, Math.min(1, n));
  const mix = (a,b,t) => a+(b-a)*t;
  const palette = ['#a0ffd0','#6dbbff'];
  const ghostImages = [], glowSprites = new Map();
  const tintedGhosts = new Map();
  let gateImage = null, gateSwirl = null, realmTexture = null;
  const trails = new WeakMap();
  function ensureGhosts() {
    if(ghostImages.length)return;
    const version=window.SlimeGameAssets?.versionedAsset || (p=>p);
    for(const path of ['assets/vfx/phantom-spirit-mint-v2-lossless.webp','assets/vfx/phantom-spirit-blue-v2-lossless.webp']){
      const image=new Image();image.src=version(path);ghostImages.push(image);
    }
  }
  function glowSprite(index) {
    if(glowSprites.has(index))return glowSprites.get(index);
    const c=document.createElement('canvas');c.width=c.height=96;
    const x=c.getContext('2d'),color=palette[index];
    const halo=x.createRadialGradient(48,45,6,48,45,45);
    halo.addColorStop(0,color+'65');halo.addColorStop(.5,color+'35');halo.addColorStop(1,color+'00');
    x.fillStyle=halo;x.fillRect(0,0,96,96);glowSprites.set(index,c);return c;
  }
  function spiritBody(index) {
    const image=ghostImages[index];
    if(!image?.complete||!image.naturalWidth)return null;
    if(tintedGhosts.has(index))return tintedGhosts.get(index);
    const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
    const x=c.getContext('2d');x.drawImage(image,0,0);
    x.globalCompositeOperation='source-atop';x.globalAlpha=index?.34:.22;
    x.fillStyle=index?'#279bff':'#56ffad';x.fillRect(0,0,c.width,c.height);
    window.SlimeSpectralGlow.useContour?.(c,image);
    tintedGhosts.set(index,c);return c;
  }
  function idle(x,y,r,index,time) {
    const a=time/1100+index*Math.PI,depth=Math.sin(a);
    return {x:x+Math.cos(a)*r*1.25,y:y-r*.15+depth*r*.82,front:depth>=0};
  }
  function flightPoint(flight,time,idlePoint) {
    const p=unit((time-flight.startedAt)/flight.duration);
    const points=[flight.from,...flight.points,idlePoint];
    const route=(1-Math.cos(p*Math.PI))/2*(points.length-1);
    const i=Math.min(points.length-2,Math.floor(route)),t=route-i;
    const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
    const curve=key=>.5*((2*b[key])+(-a[key]+c[key])*t
      +(2*a[key]-5*b[key]+4*c[key]-d[key])*t*t+(-a[key]+3*b[key]-3*c[key]+d[key])*t*t*t);
    // Smooth acceleration only at departure/return; continuous tangents through
    // each rock keep the spirit gliding rather than stopping at every waypoint.
    return {x:curve('x'),y:curve('y'),p,route};
  }
  function spirit(ctx,p,size,index,time,alpha=1) {
    ensureGhosts();const image=spiritBody(index);
    if(!image||alpha<=0)return;
    let histories=trails.get(ctx);if(!histories){histories=[[],[]];trails.set(ctx,histories);}
    const history=histories[index],last=history[history.length-1];
    if(last&&(time<last.time||time-last.time>280||Math.hypot(p.x-last.x,p.y-last.y)>size*4))history.length=0;
    while(history.length&&(time-history[0].time>240||history.length>6))history.shift();
    if(!history.length||time-history[history.length-1].time>=32)history.push({x:p.x,y:p.y,time});
    ctx.save();ctx.lineCap='round';
    // A short tapered wake, capped in distance as well as age, follows flights.
    const tail=history.map(q=>{
      const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),scale=d>size*1.45?size*1.45/d:1;
      return {x:p.x+dx*scale,y:p.y+dy*scale,time:q.time};
    });
    tail.push({x:p.x,y:p.y,time});
    for(let i=1;i<tail.length;i++){
      const life=unit(1-(time-tail[i].time)/240);
      ctx.globalAlpha=alpha*life*.22;ctx.strokeStyle=palette[index];ctx.lineWidth=size*(.055+life*.1);
      ctx.beginPath();ctx.moveTo(tail[i-1].x,tail[i-1].y);ctx.lineTo(tail[i].x,tail[i].y);ctx.stroke();
    }
    ctx.globalAlpha=alpha*(.67+.08*Math.sin(time/370+index));
    ctx.drawImage(glowSprite(index),p.x-size*.68,p.y-size*.72,size*1.36,size*1.44);
    const w=size*(index===1?.8:.98),h=w*image.height/image.width*(index===1?1.12:1);
    ctx.globalAlpha=alpha*(index===1?.76:.86);ctx.drawImage(image,p.x-w/2,p.y-h*.52,w,h);
    window.SlimeSpectralGlow.draw(ctx,image,[p.x-w/2,p.y-h*.52,w,h],time,.82);ctx.restore();
  }
  function cracks(ctx,block,y,time) {
    const w=block.w,h=block.h,seed=(block.row*17+block.col*11)%7;
    const flash=unit(1-(time-(block.phantomMarkedAt||0))/360);
    ctx.save();ctx.translate(block.x,y);ctx.lineJoin='round';ctx.lineCap='round';
    const path=()=>{ctx.beginPath();ctx.moveTo(w*.16,h*.06);ctx.lineTo(w*.43,h*.28);ctx.lineTo(w*.36,h*.46);ctx.lineTo(w*.60,h*.58);ctx.lineTo(w*.48,h*.92);
      ctx.moveTo(w*.43,h*.28);ctx.lineTo(w*.68,h*.22);ctx.lineTo(w*.88,h*.34);
      ctx.moveTo(w*.36,h*.46);ctx.lineTo(w*.17,h*.60);ctx.lineTo(w*.08,h*.82);
      ctx.moveTo(w*.60,h*.58);ctx.lineTo(w*.79,h*.71);ctx.lineTo(w*.94,h*.68);};
    const pulse=.83+Math.sin(time/320+seed)*.12;
    ctx.globalAlpha=.45*pulse;ctx.strokeStyle='#2ffff0';ctx.lineWidth=6+flash*3;path();ctx.stroke();
    ctx.globalAlpha=pulse;ctx.strokeStyle='#87ffe0';ctx.lineWidth=2.8;path();ctx.stroke();
    ctx.strokeStyle='#edfff7';ctx.lineWidth=1.2;path();ctx.stroke();
    if(flash){ctx.globalAlpha=flash*.28;ctx.fillStyle='#a3ffdc';ctx.fillRect(1,1,w-2,h-2);}ctx.restore();
  }
  function portal(ctx,x,y,width,time,alpha=1,layer='all') {
    if(width<1||alpha<=0)return;
    ensureGate();const w=width*1.22*(1+.018*Math.sin(time/850)),h=width*.46;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=alpha*(.9+.05*Math.sin(time/510));
    if(layer==='front'){
      // Only the near lip covers the train; its centre stays the emergence point.
      ctx.beginPath();ctx.rect(-w/2,h*.19,w,h*.31);ctx.clip();
    }
    if(gateImage.complete&&gateImage.naturalWidth)ctx.drawImage(gateImage,-w/2,-h/2,w,h);
    ctx.restore();
  }
  function ensureGate() {
    if(gateImage)return;
    gateImage=new Image();gateImage.src=(window.SlimeGameAssets?.versionedAsset|| (p=>p))('assets/vfx/phantom-portal-round-v2-lossless.webp');
  }
  function gate(ctx,x,y,width,time,alpha=1) {
    if(alpha<=0)return;
    ensureGate();
    ctx.save();ctx.translate(x,y);
    ctx.globalAlpha=alpha*.62;ctx.drawImage(glowSprite(0),-width*.8,-width*.8,width*1.6,width*1.6);
    if(gateImage.complete&&gateImage.naturalWidth){
      const w=width*(1.22+.025*Math.sin(time/740));
      ctx.rotate(.018*Math.sin(time/1100));
      ctx.globalAlpha=alpha*(.91+.06*Math.sin(time/570));ctx.drawImage(gateImage,-w/2,-w/2,w,w);
      if(!gateSwirl){
        gateSwirl=document.createElement('canvas');gateSwirl.width=gateSwirl.height=192;
        const c=gateSwirl.getContext('2d'),iw=gateImage.naturalWidth,ih=gateImage.naturalHeight;
        c.drawImage(gateImage,iw*.24,ih*.24,iw*.52,ih*.52,0,0,192,192);
        const mask=c.createRadialGradient(96,96,48,96,96,94);
        mask.addColorStop(0,'#fff');mask.addColorStop(1,'#ffffff00');
        c.globalCompositeOperation='destination-in';c.fillStyle=mask;c.fillRect(0,0,192,192);
      }
      ctx.rotate(time/12000);ctx.globalAlpha=alpha*.48;
      ctx.drawImage(gateSwirl,-w*.26,-w*.26,w*.52,w*.52);
    }
    ctx.restore();
  }
  function burst(ctx,effect,camera,cell,time) {
    const t=unit((time-effect.startedAt)/850);if(t>=1)return;
    const spread=1-(1-t)**3,fade=(1-t)**1.6;
    ctx.save();ctx.translate(effect.x,effect.y-camera);ctx.globalCompositeOperation='lighter';
    const size=cell*(.8+spread*3.8);
    ctx.globalAlpha=fade*.85;ctx.drawImage(glowSprite(0),-size/2,-size/2,size,size);
    // Soft raster wisps, no drawn ring or geometric rays.
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4+.2,d=cell*spread*(.75+(i%3)*.14),w=cell*(.65+.45*t);
      ctx.globalAlpha=fade*(i%2?.55:.75);
      ctx.drawImage(glowSprite(i%2),Math.cos(a)*d-w/2,Math.sin(a)*d-w/2,w,w);
    }
    const flash=unit(1-t/.25),core=cell*(.45+t*2.4);
    ctx.globalAlpha=flash;ctx.drawImage(glowSprite(0),-core/2,-core/2,core,core);ctx.restore();
  }
  function realm(ctx,width,height,time,strength,entry={}) {
    if(!realmTexture){
      realmTexture=document.createElement('canvas');realmTexture.width=realmTexture.height=256;
      const x=realmTexture.getContext('2d');
      const shade=x.createRadialGradient(128,118,32,128,128,182);
      shade.addColorStop(0,'#53e8c922');shade.addColorStop(.55,'#268aa653');shade.addColorStop(1,'#123858b0');
      x.fillStyle=shade;x.fillRect(0,0,256,256);
      for(let i=0;i<6;i++)x.drawImage(glowSprite(i%2),(i*79)%220-40,(i*53)%210-35,110,150);
    }
    const age=Math.max(0,time-(entry.at??time-700)),progress=unit(age/620);
    const spread=progress*progress*(3-2*progress),size=Math.hypot(width,height)*2.5*spread;
    ctx.save();ctx.globalAlpha=strength*.72*spread;ctx.drawImage(realmTexture,0,0,width,height);
    ctx.globalCompositeOperation='lighter';ctx.globalAlpha=strength*(.26+.08*Math.sin(time/630));
    ctx.drawImage(glowSprite(0),(entry.x??width/2)-size/2,(entry.y??height*.4)-size/2,size,size);
    for(let i=0;i<6;i++){
      const x=(i*73+time*.009)%width,y=(i*113-time*.018+height*10)%height;
      ctx.globalAlpha=strength*spread*.48;ctx.drawImage(glowSprite(i%2),x-10,y-10,20,20);
    }ctx.restore();
  }
  function expressGeometry(e,time,cell) {
    const age=Math.max(0,time-e.startedAt),fade=unit((2800-age)/380);
    const rail=unit((age-380)/240),travel=unit((age-640)/1600);
    const height=cell*2.05*1200/291;
    return {age,fade,rail,travel,height,frontY:mix(e.portalY,e.endY+height,travel),portalWidth:cell*4*unit(age/450)};
  }
  function express(ctx,e,camera,cell,time,train,rails) {
    const g=expressGeometry(e,time,cell);if(g.age>=2800)return;
    const left=e.centerX-cell*2,top=e.portalY-camera,end=e.endY-camera;
    ctx.save();ctx.globalAlpha=g.fade;
    ctx.beginPath();ctx.rect(left-4,top,cell*4+8,Math.max(0,(end-top)*g.rail));ctx.clip();
    ctx.fillStyle='rgba(44,208,173,.16)';ctx.fillRect(left,top,cell*4,end-top);
    const tileH=cell*2.2,trackW=cell*2.35;
    if(rails?.complete&&rails.naturalWidth)for(let y=top;y<Math.min(end,top+(end-top)*g.rail);y+=tileH){
      ctx.globalAlpha=g.fade*.62;ctx.drawImage(rails,e.centerX-trackW/2,y,trackW,tileH);
      window.SlimeSpectralGlow.draw(ctx,rails,[e.centerX-trackW/2,y,trackW,tileH],time,.9);}
    ctx.globalAlpha=g.fade*.75;ctx.strokeStyle='#6bffe1';ctx.lineWidth=2;
    for(const x of [e.centerX-cell*.84,e.centerX+cell*.84]){ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,end);ctx.stroke();}ctx.restore();
    // Hole and back rim are behind the train. Only the near rim crosses it;
    // the locomotive first becomes visible at the actual portal centre.
    portal(ctx,e.centerX,top,g.portalWidth,time,g.fade,'back');
    if(g.age>=640){
      ctx.save();ctx.globalAlpha=g.fade;ctx.beginPath();ctx.rect(left-20,top,cell*4+40,Math.max(0,end-top+g.height));ctx.clip();
      const front=g.frontY-camera;
      if(train?.complete&&train.naturalWidth){
        const w=cell*2.05,tx=e.centerX-w/2,ty=front-g.height;
        const aura=window.SlimeSpectralGlow.layers(train).outer,px=w/6,py=g.height/6;
        // Three fading silhouettes form a bounded spectral wake; all blur is cached.
        for(let i=3;i>=1;i--){ctx.globalAlpha=g.fade*(4-i)*.045;
          ctx.drawImage(aura,tx-px,ty-py-cell*i*.44,w+2*px,g.height+2*py);}
        ctx.globalAlpha=g.fade*.72;ctx.drawImage(train,tx,ty,w,g.height);
        window.SlimeSpectralGlow.draw(ctx,train,[tx,ty,w,g.height],time,1);
      }
      ctx.globalAlpha=g.fade*.76;ctx.drawImage(glowSprite(0),left,front-cell*.65,cell*4,cell*1.2);
      ctx.restore();
    }
    portal(ctx,e.centerX,top,g.portalWidth,time,g.fade,'front');
    const birth=unit(1-(g.age-640)/460);
    if(g.age>=640&&birth>0){
      ctx.save();ctx.globalAlpha=birth*.6;
      ctx.drawImage(glowSprite(0),e.centerX-cell*.8,top-cell*.36,cell*1.6,cell*.72);
      ctx.strokeStyle='#e1fff1';ctx.lineWidth=1.5;
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3+time/600,d=cell*(.7+(1-birth)*.3);
        const x=e.centerX+Math.cos(a)*d,y=top+Math.sin(a)*d*.26;
        ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();
      }ctx.restore();
    }
  }
  window.SlimePhantomEffects=Object.freeze({ensureGhosts,idle,flightPoint,spirit,cracks,portal,gate,burst,realm,express,expressGeometry});
})();
