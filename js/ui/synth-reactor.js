/* Cylindrical reagent, blue bubbles and procedural plasma; no generated VFX. */
(() => {
  'use strict';
  let release = () => {};
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
    const holder = capsule.querySelector('.mutation-glass');
    const liquid = capsule.querySelector('#mutationLiquid');
    if (!holder || !liquid) return;
    const canvas = document.createElement('canvas'); canvas.className = 'synth-reactor-canvas';
    canvas.setAttribute('aria-hidden','true'); holder.append(canvas);
    const c = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion:reduce)');
    let frame = 0, closed = false, w = 1, h = 1, cssW=1,cssH=1,shape=shapes.wide,glassPath,fill = 0, target = 0;
    let last = 0, drawn = 0, activity = 0, rippleAt = -10000;
    let wasSplash = false;
    const bubble = document.createElement('canvas'); bubble.width = bubble.height = 40;
    const bc = bubble.getContext('2d');
    const bg = bc.createRadialGradient(13,11,1,20,20,17);
    bg.addColorStop(0,'#edfcff'); bg.addColorStop(.2,'#a4efff');
    bg.addColorStop(.5,'#24bbef'); bg.addColorStop(.83,'#087ec5'); bg.addColorStop(1,'#44cfff00');
    bc.fillStyle=bg;bc.beginPath();bc.arc(20,20,18,0,Math.PI*2);bc.fill();
    bc.fillStyle='#e8fbff';bc.beginPath();bc.ellipse(14,12,4,2.5,-.5,0,Math.PI*2);bc.fill();
    function visible() { return !closed && capsule.isConnected && !!holder.offsetParent && window.SlimeUIActivity.isActive(capsule); }
    function wake() { if (visible() && !frame) frame=requestAnimationFrame(draw); }
    function sync() {
      target=Math.max(0,Math.min(1,(parseFloat(liquid.style.getPropertyValue('--liquid-fill'))||0)/100));
      if (capsule.matches('.is-draining,.is-dispensing,.is-core-ready,.is-output-selected,.is-complete')) target=0;
      if (capsule.matches('.is-dispensing,.is-core-ready,.is-output-selected,.is-complete')) fill=0;
      const splash=liquid.classList.contains('is-splashing');
      if (splash&&!wasSplash) rippleAt=performance.now();
      wasSplash=splash;wake();
    }
    function resize() {
      cssW=Math.max(1,holder.clientWidth);cssH=Math.max(1,holder.clientHeight);
      shape=getComputedStyle(capsule.querySelector('.machine-tall')).display!=='none'?shapes.tall:shapes.wide;
      w=shape.box[2];h=shape.box[3];
      glassPath=new Path2D();glassPath.addPath(new Path2D(shape.glass),new DOMMatrix().translate(-shape.box[0],-shape.box[1]));
      canvas.dataset.shape=shape===shapes.tall?'tall':'wide';
      const pipe=capsule.querySelector('.mutation-transfer-flow');
      pipe?.setAttribute('viewBox',`0 0 ${shape.width} ${shape.height}`);
      pipe?.querySelectorAll('g path').forEach(p=>p.setAttribute('d',shape.pipe));
      pipe?.querySelector('.synth-pipe-mask')?.setAttribute('d',shape.pipeMask);
      const dpr=Math.min(1.5,devicePixelRatio||1);
      canvas.width=Math.round(cssW*dpr);canvas.height=Math.round(cssH*dpr);
      c.setTransform(dpr,0,0,dpr,0,0);drawn=0;wake();
    }
    function draw(at) {
      frame=0;if(!visible())return;
      const dt=Math.min(.08,last?(at-last)/1000:1/30);last=at;
      const processing=capsule.classList.contains('is-processing');
      fill=reduced.matches?target:fill+(target-fill)*(1-Math.exp(-dt*(target<fill?5.5:7)));
      activity+=(Number(processing)-activity)*(1-Math.exp(-dt*7));
      if(Math.abs(fill-target)<.0005)fill=target;
      if(at-drawn>=32||reduced.matches||(fill===target&&canvas.dataset.fill!==fill.toFixed(3))){
        drawn=at;c.clearRect(0,0,cssW,cssH);
        if(fill>.001){
          const cap=shape.cap,bottom=shape.bottom-shape.box[1];
          const y=bottom-(bottom-(shape.top-shape.box[1]))*fill;
          c.save();c.scale(cssW/shape.width,cssH/shape.height);c.translate(shape.box[0],shape.box[1]);c.clip(glassPath);
          c.save();c.beginPath();c.moveTo(0,y);
          c.bezierCurveTo(w*.2,y-cap*1.33,w*.8,y-cap*1.33,w,y);
          c.lineTo(w,h);c.lineTo(0,h);c.closePath();
          const body=c.createLinearGradient(0,0,w,0);
          body.addColorStop(0,'#087bbdcc');body.addColorStop(.22,'#23bfe2c9');body.addColorStop(.52,'#37dbedc9');body.addColorStop(.84,'#159ed4d9');body.addColorStop(1,'#086ca7df');
          c.fillStyle=body;c.fill();c.clip();
          if(activity>.01){
            const glow=c.createRadialGradient(w*.5,y+(bottom-y)*.52,0,w*.5,y+(bottom-y)*.52,w*.6);
            glow.addColorStop(0,`rgba(180,249,255,${activity*.65})`);glow.addColorStop(.45,`rgba(38,208,255,${activity*.38})`);glow.addColorStop(1,'#06a5ef00');
            c.fillStyle=glow;c.fillRect(0,y,w,bottom-y);
            for(let strand=0;strand<3;strand++){
              c.beginPath();for(let i=0;i<=64;i++){
                const p=i/64,px=w*(.5+Math.sin(p*9-at*.004+strand*2.1)*(.12+.17*Math.sin(p*Math.PI))),py=y+(bottom-y)*p;
                if(i)c.lineTo(px,py);else c.moveTo(px,py);
              }
              c.strokeStyle=`rgba(193,249,255,${activity*(strand===1?.72:.45)})`;c.lineWidth=Math.max(1,w*.014);c.shadowColor='#4fd8ff';c.shadowBlur=6;c.stroke();c.shadowBlur=0;
            }
          }
          const time=reduced.matches?1.7:at/1000;
          for(let i=0;i<(processing?12:7);i++){
            const speed=processing?.38:.12,phase=(time*speed*(.7+(i%3)*.19)+i*.173)%1;
            const bx=w*(.12+((i*.317)%1)*.76)+Math.sin(time*1.5+i)*w*.025;
            const by=bottom-phase*Math.max(1,bottom-y),size=w*(.045+(i%4)*.012);
            c.globalAlpha=.8*Math.min(1,phase*7,(1-phase)*6);c.drawImage(bubble,bx-size/2,by-size/2,size,size);
          }
          c.globalAlpha=1;c.restore();
          const surface=c.createLinearGradient(0,y-cap,0,y+cap);
          surface.addColorStop(0,'#c0faffd9');surface.addColorStop(.5,'#65e7f4db');surface.addColorStop(1,'#16a9d2d9');
          c.fillStyle=surface;c.beginPath();c.ellipse(w/2,y,w*.494,cap,0,0,Math.PI*2);c.fill();
          c.strokeStyle='#b5faffbc';c.lineWidth=2;c.stroke();
          const ripple=(at-rippleAt)/700;
          if(!reduced.matches&&ripple>=0&&ripple<1){c.strokeStyle=`rgba(225,255,255,${(1-ripple)*.8})`;c.beginPath();c.ellipse(w/2,y,w*(.12+.36*ripple),cap*(.2+.8*ripple),0,0,Math.PI*2);c.stroke();}
          c.restore();
        }
        canvas.dataset.fill=fill.toFixed(3);
      }
      if(!reduced.matches&&(fill>.001||Math.abs(fill-target)>.0005||activity>.01))wake();
    }
    const observer=new MutationObserver(sync);
    observer.observe(capsule,{attributes:true,attributeFilter:['class']});
    observer.observe(liquid,{attributes:true,attributeFilter:['style','class']});
    const panel=capsule.closest('.mutation-lab-v2');if(panel)observer.observe(panel,{attributes:true,attributeFilter:['data-view']});
    const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(holder);
    document.addEventListener('visibilitychange',wake);document.addEventListener('slime:ui-visibility',wake);reduced.addEventListener('change',sync);
    release=()=>{closed=true;cancelAnimationFrame(frame);observer.disconnect();sizeObserver.disconnect();document.removeEventListener('visibilitychange',wake);document.removeEventListener('slime:ui-visibility',wake);reduced.removeEventListener('change',sync);canvas.remove();};
    sync();resize();
  }
  window.SlimeSynthReactor=Object.freeze({mount,shapes,stop:()=>release()});
})();
