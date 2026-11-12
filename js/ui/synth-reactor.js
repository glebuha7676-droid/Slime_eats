/* Layered glass, translucent raster reagent and timed transfer/dispensing. */
(() => {
  'use strict';
  let release = () => {};
  const timings=Object.freeze({mix:3800,drain:880,door:780,prizeDelay:160});
  function prepareLoopTexture(image) {
    const width=256,height=1024,band=64;
    const source=document.createElement('canvas');source.width=width;source.height=height;
    source.getContext('2d').drawImage(image,0,0,width,height);
    const soft=document.createElement('canvas');soft.width=width;soft.height=height;
    const s=soft.getContext('2d');s.drawImage(source,0,0);
    // Flatten the texture's end gradients before reflecting it. This gives
    // matching color AND a gentle tangent, without a ghosted crossfade.
    for(let y=0;y<band;y++){
      const t=y/band,sample=t*t*(2-t)*band;
      s.drawImage(source,0,sample,width,1,0,y,width,1);
      s.drawImage(source,0,height-1-sample,width,1,0,height-1-y,width,1);
    }
    const loop=document.createElement('canvas');loop.width=width;loop.height=height*2;
    const g=loop.getContext('2d');g.drawImage(soft,0,0);
    g.save();g.translate(0,height*2);g.scale(1,-1);g.drawImage(soft,0,0);g.restore();
    const edge=g.createLinearGradient(0,0,width,0);
    edge.addColorStop(0,'#0000');edge.addColorStop(.19,'#000');edge.addColorStop(.81,'#000');edge.addColorStop(1,'#0000');
    g.globalCompositeOperation='destination-in';g.fillStyle=edge;g.fillRect(0,0,width,loop.height);
    g.globalCompositeOperation='source-over';
    // Exact matching boundary rows, including alpha; no readback in gameplay.
    g.clearRect(0,loop.height-1,width,1);g.drawImage(loop,0,0,width,1,0,loop.height-1,width,1);
    return loop;
  }
  function paintLoop(target,texture,x,y,width,height,offset) {
    const period=texture.height/texture.width*width;
    const shift=((offset%period)+period)%period;
    target.save();target.beginPath();target.rect(x,y,width,height);target.clip();
    for(let top=y-shift;top<y+height;top+=period)target.drawImage(texture,x,top,width,period);
    target.restore();
  }
  // Traced in native artwork pixels, including both fixture cut-ins and the
  // bowed front edge. These are visible glass contours, not rounded boxes.
  const shapes=Object.freeze({
    wide:{width:1024,height:964,box:[111,202,422,417],top:211,bottom:566,cap:51,
      glass:'M160 202 C243 229 413 230 490 202 C511 212 527 225 533 239 L533 518 C534 543 514 560 490 575 L490 592 C414 627 237 627 160 592 L160 579 C132 565 111 546 111 521 L111 239 C119 224 141 211 160 202 Z',
      pipe:'M568 168 H713 Q759 168 759 215 V248',
      pipeMask:'M568 141 H683 V196 H568 Z M721 146 C766 148 787 173 787 215 V248 H733 V214 C733 203 728 199 721 198 Z'},
    tall:{width:1024,height:1365,box:[96,239,453,740],top:247,bottom:922,cap:56,
      glass:'M151 239 C239 262 416 264 504 239 C524 248 542 261 549 276 L549 880 C549 907 525 924 496 940 L496 955 C418 985 230 985 151 955 L151 938 C121 923 96 905 96 880 L96 276 C104 260 128 246 151 239 Z',
      pipe:'M590 195 H728 Q779 195 779 251 V313',
      pipeMask:'M590 158 H691 V234 H590 Z M733 170 C786 172 816 201 816 253 V313 H744 V254 C744 240 740 236 733 233 Z'}
  });
  function mount(capsule) {
    release();
    if (!capsule) return;
    const holder=capsule.querySelector('.mutation-glass'),liquid=capsule.querySelector('#mutationLiquid');
    if(!holder||!liquid)return;
    const canvas=document.createElement('canvas');canvas.className='synth-reactor-canvas';
    canvas.dataset.reagent='violet-green';canvas.dataset.layers='liquid-under-glass';
    canvas.setAttribute('aria-hidden','true');holder.append(canvas);
    const c=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
    let frame=0,closed=false,cssW=1,cssH=1,w=1,h=1,shape=shapes.wide,glassPath,pipeMask;
    let fill=0,target=0,last=0,drawn=0,clock=0,travel=0,bubbleClock=0,activity=0,depositAt=-10000;
    let phase='',phaseAt=0,drainFill=0,coat=null,art=null,mixture=null;
    const sample=new Image();sample.decoding='async';
    sample.onload=()=>{
      mixture=prepareLoopTexture(sample);
      canvas.dataset.motion='upward-loop';
      canvas.dataset.texture='ready';drawn=0;wake();
    };
    sample.src=window.SlimeGameAssets.versionedAsset('assets/ui/anomaly-fluid-v2/flow-strip-v3.webp');
    const bubble=document.createElement('canvas');bubble.width=bubble.height=48;
    const bc=bubble.getContext('2d'),bg=bc.createRadialGradient(17,14,1,24,24,21);
    bg.addColorStop(0,'#f0ffcaaa');bg.addColorStop(.23,'#d3f58b80');bg.addColorStop(.62,'#87c26b44');bg.addColorStop(1,'#7ca98900');
    bc.fillStyle=bg;bc.fillRect(0,0,48,48);
    const plasma=document.createElement('canvas');plasma.width=plasma.height=64;
    const pc=plasma.getContext('2d'),pg=pc.createRadialGradient(32,32,0,32,32,32);
    pg.addColorStop(0,'#deffa9dd');pg.addColorStop(.2,'#b8ed5aaa');pg.addColorStop(.5,'#9864c966');pg.addColorStop(1,'#7851aa00');
    pc.fillStyle=pg;pc.fillRect(0,0,64,64);
    function visible(){return !closed&&capsule.isConnected&&!!holder.offsetParent&&window.SlimeUIActivity.isActive(capsule);}
    function wake(){if(visible()&&!frame)frame=requestAnimationFrame(draw);}
    function sync(){
      const next=capsule.matches('.is-dispensing,.is-core-ready,.is-output-selected,.is-complete')?'output'
        :capsule.classList.contains('is-draining')?'draining'
        :capsule.classList.contains('is-processing')?'mixing'
        :capsule.classList.contains('is-synthesis-ready')?'ready':'idle';
      if(next!==phase){phase=next;phaseAt=performance.now();if(phase==='draining')drainFill=fill;drawn=0;}
      let nextTarget=Math.max(0,Math.min(1,(parseFloat(liquid.style.getPropertyValue('--liquid-fill'))||0)/100));
      if(['draining','output'].includes(phase))nextTarget=0;
      if(nextTarget>target+.0001)depositAt=performance.now();
      target=nextTarget;if(phase==='output')fill=0;
      canvas.dataset.phase=phase;wake();
    }
    function buildCoat(){
      if(!art?.complete||!art.naturalWidth)return;
      // Reuse the painted front reflections, so the reagent stays BEHIND glass.
      coat=document.createElement('canvas');coat.width=w;coat.height=h;
      const g=coat.getContext('2d');
      g.drawImage(art,shape.box[0],shape.box[1],w,h,0,0,w,h);
      const mask=g.createLinearGradient(0,0,w,0);
      for(const [stop,alpha] of [[0,.72],[.06,.45],[.14,.85],[.23,.35],[.32,.07],[.68,.05],[.88,.24],[.97,.57],[1,.75]])mask.addColorStop(stop,`rgba(0,0,0,${alpha})`);
      g.globalCompositeOperation='destination-in';g.fillStyle=mask;g.fillRect(0,0,w,h);
      canvas.dataset.glass='ready';
      drawn=0;wake();
    }
    function resize(){
      cssW=Math.max(1,holder.clientWidth);cssH=Math.max(1,holder.clientHeight);
      art=[...capsule.querySelectorAll('.mutation-machine-art')].find(i=>getComputedStyle(i).display!=='none');
      shape=art?.classList.contains('machine-tall')?shapes.tall:shapes.wide;
      w=shape.box[2];h=shape.box[3];
      glassPath=new Path2D();glassPath.addPath(new Path2D(shape.glass),new DOMMatrix().translate(-shape.box[0],-shape.box[1]));
      pipeMask=new Path2D(shape.pipeMask);canvas.dataset.shape=shape===shapes.tall?'tall':'wide';
      const dpr=Math.min(1.5,devicePixelRatio||1);
      canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
      c.setTransform(canvas.width/cssW,0,0,canvas.height/cssH,0,0);
      coat=null;buildCoat();drawn=0;wake();
    }
    const artLoads=[...capsule.querySelectorAll('.mutation-machine-art')];
    artLoads.forEach(image=>image.addEventListener('load',buildCoat));
    function drawLiquid(at){
      const bottom=shape.bottom-shape.box[1],top=shape.top-shape.box[1];
      const deposit=Math.max(0,1-(at-depositAt)/650);
      const bob=reduced.matches?0:Math.sin(clock*3.1)*activity*1.5+Math.sin((at-depositAt)/110)*deposit*2.5;
      const y=bottom-(bottom-top)*fill+bob;
      const cap=shape.cap*.64*Math.min(1,fill*15);
      c.save();c.scale(cssW/shape.width,cssH/shape.height);c.translate(shape.box[0],shape.box[1]);c.clip(glassPath);
      if(fill>.001){
        c.save();c.beginPath();c.moveTo(0,y);
        c.bezierCurveTo(w*.23,y-cap*1.3,w*.77,y-cap*1.3,w,y);c.lineTo(w,h);c.lineTo(0,h);c.closePath();
        const body=c.createLinearGradient(0,0,w,0);
        body.addColorStop(0,'#26123ec2');body.addColorStop(.3,'#56317aa6');body.addColorStop(.65,'#4d287cae');body.addColorStop(1,'#24113dba');
        c.fillStyle=body;c.fill();c.clip();
        if(mixture){
          c.globalAlpha=.59;
          paintLoop(c,mixture,w*.09,0,w*.82,h,reduced.matches?0:travel*w);
          c.globalAlpha=1;
        }
        const time=reduced.matches?1.7:clock;
        for(let i=0;i<13;i++){
          const appear=i<3?1:Math.max(0,Math.min(1,(activity-.15)/.65));
          if(appear<.01)continue;
          const p=((reduced.matches ? .0765 : bubbleClock)*(1+i*.075)+i*.173)%1;
          const bx=w*(.16+(i*.257%1)*.68)+Math.sin(time+i)*w*.012;
          const by=bottom-p*Math.max(1,bottom-y),size=w*(.034+i%4*.012);
          c.globalAlpha=(.5+activity*.3)*appear*Math.min(1,p*6,(1-p)*7);c.drawImage(bubble,bx-size/2,by-size/2,size,size);
        }
        c.globalAlpha=1;c.restore();
        const surface=c.createLinearGradient(0,y-cap,0,y+cap);
        surface.addColorStop(0,'#b0a2c66e');surface.addColorStop(.48,'#714d9c8c');surface.addColorStop(1,'#34234888');
        c.fillStyle=surface;c.beginPath();c.ellipse(w/2,y,w*.493,cap,0,0,Math.PI*2);c.fill();
        // A soft patch of the reagent's color, without drawn arcs or rings.
        const sheen=c.createRadialGradient(w*.38,y-cap*.18,0,w*.38,y-cap*.18,w*.28);
        sheen.addColorStop(0,'#d0ef9580');sheen.addColorStop(1,'#b9df7e00');
        c.save();c.beginPath();c.ellipse(w/2,y,w*.49,cap*.9,0,0,Math.PI*2);c.clip();c.fillStyle=sheen;c.fillRect(0,y-cap,w,cap*2);c.restore();
      }
      if(coat){c.globalAlpha=.85;c.drawImage(coat,0,0,w,h);c.globalAlpha=1;}
      c.restore();
    }
    function pipePoint(t){
      const tall=shape===shapes.tall,start=tall?590:568,corner=tall?728:713,y=tall?195:168,end=tall?779:759,cy=tall?251:215,bottom=tall?313:248;
      if(t<.5)return [start+(corner-start)*t*2,y];
      if(t<.8){const q=(t-.5)/.3;return [(1-q)*(1-q)*corner+2*(1-q)*q*end+q*q*end,(1-q)*(1-q)*y+2*(1-q)*q*y+q*q*cy];}
      return [end,cy+(bottom-cy)*(t-.8)/.2];
    }
    function drawTransfer(at){
      canvas.dataset.transfer=phase==='draining'&&!reduced.matches?'1':'0';
      if(canvas.dataset.transfer==='0')return;
      const elapsed=(at-phaseAt)/timings.drain,envelope=Math.min(1,elapsed*6,(1-elapsed)*8);
      if(envelope<=0)return;
      c.save();c.scale(cssW/shape.width,cssH/shape.height);c.clip(pipeMask);
      for(let i=0;i<4;i++){
        const t=(((at-phaseAt)/550-i*.24)%1+1)%1,[x,y]=pipePoint(t);
        c.globalAlpha=.75*envelope;c.drawImage(plasma,x-27,y-27,54,54);
      }
      c.restore();
    }
    function draw(at){
      frame=0;if(!visible())return;
      const dt=Math.min(.06,last?(at-last)/1000:1/30);last=at;
      const phaseProgress=Math.max(0,Math.min(1,(at-phaseAt)/(phase==='mixing'?timings.mix:timings.drain)));
      const requestedActivity=phase==='mixing' ? .3+.1*phaseProgress+.65*Math.sin(phaseProgress*Math.PI) : phase==='draining' ? .4*(1-phaseProgress) : 0;
      activity+=(requestedActivity-activity)*(1-Math.exp(-dt*5));
      // Integrate velocity rather than multiplying absolute time by activity:
      // entering/leaving synthesis must never jump the fluid or bubble phase.
      if(!reduced.matches){clock+=dt*(.65+activity*1.1);travel+=dt*(.035+activity*.30);bubbleClock+=dt*(.045+activity*.50);}
      if(phase==='draining'){
        const t=Math.min(1,(at-phaseAt)/(timings.drain-70)),ease=t*t*(3-2*t);
        fill=reduced.matches?0:drainFill*(1-ease);
      }else fill=reduced.matches?target:fill+(target-fill)*(1-Math.exp(-dt*9));
      if(Math.abs(fill-target)<.0005)fill=target;
      if(at-drawn>=32||reduced.matches||drawn===0){
        drawn=at;c.clearRect(0,0,cssW,cssH);drawLiquid(at);drawTransfer(at);canvas.dataset.fill=fill.toFixed(3);
      }
      if(!reduced.matches&&(fill>.001||Math.abs(fill-target)>.0005||phase==='draining'||activity>.01))wake();
    }
    const observer=new MutationObserver(sync);
    observer.observe(capsule,{attributes:true,attributeFilter:['class']});observer.observe(liquid,{attributes:true,attributeFilter:['style','class']});
    const panel=capsule.closest('.mutation-lab-v2');if(panel)observer.observe(panel,{attributes:true,attributeFilter:['data-view']});
    const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(holder);
    document.addEventListener('visibilitychange',wake);document.addEventListener('slime:ui-visibility',wake);reduced.addEventListener('change',sync);
    release=()=>{closed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();sample.onload=null;artLoads.forEach(image=>image.removeEventListener('load',buildCoat));document.removeEventListener('visibilitychange',wake);document.removeEventListener('slime:ui-visibility',wake);reduced.removeEventListener('change',sync);canvas.remove();coat=null;};
    sync();resize();
  }
  window.SlimeSynthReactor=Object.freeze({mount,shapes,timings,prepareLoopTexture,paintLoop,stop:()=>release()});
})();
