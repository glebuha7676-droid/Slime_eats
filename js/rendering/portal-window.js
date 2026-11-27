/* One portal material for the laboratory, shaft arrival and rescue. Artwork stays still;
   only cached soft edge textures, a little depth and bounded motes move. */
(() => {
  'use strict';
  const LAB='assets/ui/portal-window-v2/laboratory-return.webp';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const TAU=Math.PI*2;
  const departureMotes=Array.from({length:22},(_,index)=>{
    const angle=index*2.399963;
    return {angle,x:Math.cos(angle),y:Math.sin(angle),speed:.64+(index%7)*.076,size:.027+(index%4)*.012};
  });
  const scenes=new Map(),watched=new WeakSet();let lab,rim,halo,shade,mote,wisp,home;
  function canvas(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function preload(scene='lab',world=1,stage=0){
    if(scene==='lab'){
      if(!lab){lab=new Image();lab.decoding='async';lab.src=window.SlimeGameAssets.versionedAsset(LAB);lab.onload=()=>{scenes.delete('lab');wake();};}
      return [lab];
    }
    const images=window.SlimeGameAssets.ensureWorldBackgroundLayers(world,stage).map(l=>l.image);
    for(const image of images)if(!watched.has(image)){watched.add(image);image.addEventListener('load',wake,{once:true});}
    return images;
  }
  function snapshot(scene,world,stage){
    const images=preload(scene,world,stage),key=scene==='lab'?'lab':stage?`mine-${world}-${stage}`:`mine-${world}`;
    if(scenes.has(key))return scenes.get(key);
    if(!images.length||images.some(i=>!i.complete||!i.naturalWidth))return scene==='mine'&&stage?snapshot(scene,world,0):null;
    const c=canvas(512),x=c.getContext('2d');x.fillStyle='#164a60';x.fillRect(0,0,512,512);
    for(const [index,img]of images.entries()){
      const side=Math.min(img.naturalWidth,img.naturalHeight);
      const sy=(img.naturalHeight-side)*(scene==='lab'?0:.38+index*.05);
      x.drawImage(img,0,sy,side,side,0,0,512,512);
    }
    scenes.set(key,c);return c;
  }
  function radial(size,stops){const c=canvas(size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [at,color]of stops)g.addColorStop(at,color);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function textures(){
    if(rim)return;
    rim=canvas(256);const x=rim.getContext('2d'),data=x.createImageData(256,256);
    // Make the softly uneven luminous membrane once; no per-frame pixel work or thin strokes.
    for(let py=0;py<256;py++)for(let px=0;px<256;px++){
      const dx=px-127.5,dy=py-127.5,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx);
      const edge=108+Math.sin(a*3)*1.25+Math.sin(a*7+.4)*.65;
      const core=Math.exp(-Math.pow((r-edge)/3,2));
      const soft=Math.exp(-Math.pow((r-edge)/6.5,2));
      const light=.68+.19*Math.sin(a*4+.8)+.13*Math.sin(a*9);
      const n=(py*256+px)*4;data.data[n]=Math.round(100+155*core);data.data[n+1]=Math.round(215+40*core);data.data[n+2]=Math.round(224+31*core);data.data[n+3]=Math.round(clamp((soft*.74+core*.4)*light)*255);
    }
    x.putImageData(data,0,0);
    halo=radial(256,[[0,'#caffef00'],[.62,'#7be9e700'],[.8,'#72e4e744'],[.9,'#5ccfe632'],[1,'#53b8dc00']]);
    shade=radial(256,[[0,'#071e2700'],[.48,'#092e3600'],[.72,'#07242b12'],[.9,'#092a4058'],[1,'#052334c0']]);
    mote=radial(48,[[0,'#f1fffbd9'],[.2,'#bcfff3a0'],[.55,'#71e8ec30'],[1,'#60cede00']]);
    wisp=canvas(128);const w=wisp.getContext('2d');
    for(let i=0;i<9;i++){const size=8+i*2;w.globalAlpha=.22;w.drawImage(mote,12+i*10-size/2,64+Math.sin(i*.45)*7-size/2,size,size);}
  }
  function draw(ctx,{x,y,width=150,height=width,timestamp=0,scene='lab',world=1,stage=0,open=1,alpha=1,reduced=false,power=0,fillAperture=false,layer='both'}={}){
    if(open<=.001||alpha<=.001||width<=0||height<=0)return false;textures();
    const image=layer==='front'?null:snapshot(scene,world,stage),t=reduced?0:timestamp;
    const fit=fillAperture?1/216:1.15/256;
    // Use a single diameter in both axes, including opening/closing and home crops.
    const diameter=Math.max(width,height);
    ctx.save();ctx.translate(x,y);ctx.scale(diameter*fit*open,diameter*fit*open);ctx.globalAlpha*=alpha;
    if(layer!=='front'){
      ctx.save();ctx.beginPath();ctx.arc(0,0,108,0,Math.PI*2);ctx.clip();
      if(image){const zoom=1.015+Math.sin(t/2200)*.006,shift=Math.sin(t/2800)*1.2;ctx.drawImage(image,-128*zoom+shift,-128*zoom,256*zoom,256*zoom);}
      else{ctx.fillStyle='#164c63';ctx.fillRect(-128,-128,256,256);}
      ctx.drawImage(shade,-128,-128,256,256);
      ctx.save();ctx.globalAlpha*=.1+power*.07;ctx.drawImage(mote,-110+Math.sin(t/2300)*10,-109,118,118);ctx.restore();ctx.restore();
    }
    if(layer!=='back'){
      ctx.drawImage(halo,-145,-145,290,290);
      const rimAlpha=ctx.globalAlpha;
      if(!reduced){
        const count=power>.15?12:5;
        for(let i=0;i<count;i++){
          const p=(t/(2100-power*850)+i/count)%1,a=i*2.399-p*1.2,rr=106*(1-smooth(p));
          const size=(6+power*8)*(1-p*.55);
          ctx.globalAlpha=rimAlpha*Math.sin(p*Math.PI)*(.19+power*.28);ctx.drawImage(mote,Math.cos(a)*rr-size/2,Math.sin(a)*rr-size/2,size,size);
        }
      }
      ctx.globalAlpha=rimAlpha;
      ctx.save();ctx.rotate(t/(6500-power*4300));ctx.drawImage(rim,-128,-128);ctx.restore();
      ctx.save();ctx.globalAlpha*=.46;ctx.rotate(-t/22000+.8);ctx.drawImage(rim,-129,-129,258,258);ctx.restore();
      const count=reduced?0:6;
      for(let i=0;i<count;i++){
        const phase=(t/2400+i/count)%1,a=i*2.399+t/6200,rr=104+(1-phase)*14;
        const size=5+Math.sin(phase*Math.PI)*4;
        ctx.globalAlpha=rimAlpha*Math.sin(phase*Math.PI)*.52;ctx.drawImage(mote,Math.cos(a)*rr-size/2,Math.sin(a)*rr-size/2,size,size);
      }
      ctx.globalAlpha=rimAlpha;
      if(!reduced)for(let i=0;i<3;i++){
        const a=t/(4300-power*2200)+i*Math.PI*2/3;
        ctx.save();ctx.translate(Math.cos(a)*109,Math.sin(a)*109);ctx.rotate(a+Math.PI/2);ctx.scale(1,.55);ctx.globalAlpha*=.48+power*.4;ctx.drawImage(wisp,-64,-64);ctx.restore();
      }
    }
    ctx.restore();return layer==='front'||Boolean(image);
  }
  function launchParticles(ctx,{x,y,radius,progress,trailX=0,trailY=0,arrival=false}){
    const burst=clamp((progress-(arrival?0:.14))/(arrival?.62:.43));
    const spiral=arrival?0:smooth(progress/.2)*(1-smooth((progress-.35)/.38));
    const stream=arrival?1-smooth(progress/.78):smooth((progress-.31)/.16)*(1-smooth((progress-.74)/.22));
    const burstLight=Math.sin(burst*Math.PI)*(arrival?.75:.88);
    if(burstLight<.005&&spiral<.005&&stream<.005)return;
    textures();
    ctx.save();
    const opacity=ctx.globalAlpha;
    if(burstLight>.005){
      ctx.globalAlpha=opacity*burstLight*.81;
      const ring=(1+burst*.48)*radius*1.16;
      ctx.drawImage(rim,x-ring,y-ring,ring*2,ring*2);
      ctx.globalAlpha=opacity*burstLight*.46;
      ctx.drawImage(halo,x-ring*1.28,y-ring*1.28,ring*2.56,ring*2.56);
    }
    departureMotes.forEach((particle,index)=>{
      const size=particle.size*radius*(2.15-burst*.56);
      if(burstLight>.005){
        const distance=radius*(.92+burst*particle.speed*.52);
        ctx.globalAlpha=opacity*burstLight*(.65+index%4*.1);
        ctx.drawImage(mote,x+particle.x*distance-size/2,y+particle.y*distance-size/2,size,size);
      }
      if(spiral>.005&&index<12){
        const p=(progress*2.2+index/12)%1;
        const angle=particle.angle+p*1.7;
        const distance=radius*(.58+p*.48);
        ctx.globalAlpha=opacity*spiral*Math.sin(p*Math.PI)*.85;
        ctx.drawImage(mote,x+Math.cos(angle)*distance-size/2,y+Math.sin(angle)*distance-size/2,size,size);
      }
      if(stream>.005&&index<16){
        const p=(progress*3.3+index/16)%1;
        const spread=radius*(.10+p*.28);
        const shift=arrival?progress*radius*.85:0;
        ctx.globalAlpha=opacity*stream*Math.sin(p*Math.PI)*.9;
        ctx.drawImage(mote,x+trailX*p+particle.x*spread-size/2,
          y+trailY*p+particle.y*spread+shift-size,(size*.7),size*1.9);
      }
    });
    ctx.restore();
  }

  const departureMs = reduced => reduced ? 140 : 720;

  function capturePose(p,dx,dy,reduced){
    const lift=smooth((p-.12)/.32);
    const pull=Math.pow(smooth((p-.13)/.79),1.2);
    const anticipation=reduced?0:Math.sin(smooth(p/.31)*Math.PI);
    const stretch=reduced?0:Math.sin(Math.PI*lift)*(1-pull)*.27;
    const scale=1-pull*.985;
    return {
      x:dx*pull+(reduced?0:Math.sin(pull*TAU)*4.5),
      y:dy*pull+anticipation*7-lift*(1-pull)*6,
      sx:scale*(1+anticipation*.08-stretch*.48),
      sy:scale*(1-anticipation*.12+stretch),
      tilt:reduced?0:Math.sin(Math.PI*pull)*.095,
      alpha:1-smooth((p-.76)/.19)
    };
  }

  function ready(stage){return stage.classList.contains('portal-ready')||stage.classList.contains('launch-charging')||stage.classList.contains('launch-opening');}
  function active(){return Boolean(home&&ready(home.stage)&&window.SlimeUIActivity?.isActive(home.root));}
  function resize(){
    if(!home)return;const r=home.root.getBoundingClientRect(),parent=home.stage.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
    if(r.width<=0||r.height<=0)return;
    const pixelWidth=Math.ceil(r.width*dpr),pixelHeight=Math.ceil(r.height*dpr);
    if(home.canvas.width!==pixelWidth||home.canvas.height!==pixelHeight){
      home.canvas.width=pixelWidth;home.canvas.height=pixelHeight;
    }
    const pad=r.width*.24;
    for(const [key,value]of Object.entries({left:r.x-parent.x-pad,top:r.y-parent.y-pad,width:r.width+pad*2,height:r.height+pad*2}))home.front.style.setProperty(key,`${value}px`,'important');
    const frontWidth=Math.ceil((r.width+pad*2)*dpr),frontHeight=Math.ceil((r.height+pad*2)*dpr);
    if(home.front.width!==frontWidth||home.front.height!==frontHeight){
      home.front.width=frontWidth;home.front.height=frontHeight;
    }
    home.dpr=dpr;
  }
  function frame(now){
    if(!home)return;
    home.raf=0;
    if(!active()){home.last=0;return;}
    const dt=home.last?Math.min(50,now-home.last):16;
    home.last=now;
    home.clock+=dt;
    const capturing=home.stage.classList.contains('launch-opening');
    const reduced=home.reduced;
    if(capturing&&!home.capturing){
      const portal=home.root.getBoundingClientRect();
      const slime=home.slime.getBoundingClientRect();
      home.dx=portal.left+portal.width/2-slime.left-slime.width/2;
      home.dy=portal.top+portal.height/2-slime.top-slime.height/2;
      home.captureStart=now;
      home.captureOpen=home.open;
      home.captureProgress=0;
    }
    home.capturing=capturing;
    const p=capturing?clamp((now-home.captureStart)/departureMs(reduced)):0;
    if(!capturing)home.open=Math.min(1,home.open+dt/(reduced?100:360));
    if(now-home.drawAt>=(capturing?15:30)||(!capturing&&home.open<1)){
      let pose;
      if(capturing){
        pose=capturePose(p,home.dx,home.dy,reduced);
        home.slime.style.setProperty('--portal-capture-transform',
          `translate(${pose.x}px,${pose.y}px) rotate(${pose.tilt}rad) scale(${pose.sx},${pose.sy})`);
        home.slime.style.setProperty('--portal-capture-alpha',String(pose.alpha));
        home.open=home.captureOpen+(1-home.captureOpen)*smooth(p/.32);
      }
      const c=home.canvas,front=home.front;
      const back=home.backCtx,fx=home.frontCtx;
      const power=capturing?smooth(p/.45)*(1-smooth((p-.83)/.24)):0;
      const options={width:c.width,height:c.height,timestamp:home.clock,
        world:home.world,stage:home.backgroundStage,open:smooth(home.open),reduced,power,fillAperture:true};
      back.clearRect(0,0,c.width,c.height);
      fx.clearRect(0,0,front.width,front.height);
      draw(back,{...options,x:c.width/2,y:c.height/2,scene:'mine',layer:'back'});
      if(capturing){
        const swallow=smooth((p-.72)/.23);
        if(swallow>.005)draw(fx,{...options,x:front.width/2,y:front.height/2,scene:'mine',layer:'back',alpha:swallow*.78});
      }
      draw(fx,{...options,x:front.width/2,y:front.height/2,layer:'front'});
      if(capturing&&!reduced){
        launchParticles(fx,{x:front.width/2,y:front.height/2,radius:c.width*.5,
          progress:p,trailX:(pose.x-home.dx)*home.dpr,trailY:(pose.y-home.dy)*home.dpr});
      }
      home.drawAt=now;
      if(capturing)home.captureProgress=p;
      home.frames++;
    }
    if(!reduced||capturing||home.open<1)home.raf=requestAnimationFrame(frame);
  }

  function resetDeparture(){
    if(!home)return;
    home.capturing=false;
    home.captureProgress=0;
    home.slime.style.removeProperty('--portal-capture-transform');
    home.slime.style.removeProperty('--portal-capture-alpha');
  }

  function warmHomeDeparture(){
    if(!home)return;
    textures();
    snapshot('mine',home.world,home.backgroundStage);
  }
  function wake(){
    if(!home)return;
    if(!active()){if(home.raf)cancelAnimationFrame(home.raf);home.raf=0;home.last=0;return;}
    if(!home.raf){home.last=0;home.drawAt=-Infinity;home.raf=requestAnimationFrame(frame);}
  }
  function syncHome(world=1,backgroundStage=0){
    const root=document.getElementById('launchPortal'),stage=document.getElementById('slimeStage');if(!root||!stage)return;
    if(!home){
      const c=canvas(320);c.className='portal-window-canvas';c.setAttribute('aria-hidden','true');root.append(c);root.classList.add('portal-window-live');
      const front=canvas(320);front.id='launchPortalFront';front.className='portal-window-front';front.setAttribute('aria-hidden','true');stage.append(front);
      const motion=matchMedia('(prefers-reduced-motion: reduce)');
      home={root,stage,front,slime:document.getElementById('slime'),canvas:c,backCtx:c.getContext('2d'),frontCtx:front.getContext('2d'),
        reduced:motion.matches,raf:0,last:0,clock:0,capturing:false,open:0,drawAt:-Infinity,frames:0};
      motion.addEventListener?.('change',event=>{home.reduced=event.matches;wake();});
      new ResizeObserver(()=>{resize();wake();}).observe(root);
      new MutationObserver(()=>{
        if(!ready(stage))home.open=0;
        if(home.capturing&&!stage.classList.contains('launch-opening'))resetDeparture();
        wake();
      }).observe(stage,{attributes:true,attributeFilter:['class']});
      resize();
      if(window.requestIdleCallback)requestIdleCallback(textures);
      else setTimeout(textures,180);
    }
    if(home.world===world&&home.backgroundStage===backgroundStage){wake();return;}
    home.world=world;home.backgroundStage=backgroundStage;root.dataset.portalWorld=String(world);root.dataset.portalDestination='mine';preload('mine',world,backgroundStage);wake();
  }
  document.addEventListener('slime:ui-visibility',wake);document.addEventListener('visibilitychange',wake);
  window.SlimePortalWindow=Object.freeze({LAB,preload,draw,syncHome,warmHomeDeparture,resetDeparture,departureMs,
    departureFinished:()=>!home||home.captureProgress>=.97,launchParticles,
    stats:()=>({labReady:Boolean(lab?.complete&&lab.naturalWidth),cachedScenes:[...scenes.keys()],homeFrames:home?.frames||0,homeActive:active(),homeLoop:Boolean(home?.raf)})});
})();
