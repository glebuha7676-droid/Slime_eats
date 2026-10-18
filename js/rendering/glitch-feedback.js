(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), cache=new Map();
  function glow(color){
    if(cache.has(color))return cache.get(color);
    const image=document.createElement('canvas');image.width=image.height=128;
    const c=image.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.2,color==='cyan'?'rgba(89,255,245,.8)':'rgba(255,91,229,.8)');
    g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(0,0,128,128);cache.set(color,image);return image;
  }
  function flash(c,x,y,size,alpha,color='cyan'){
    c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;c.drawImage(glow(color),x-size/2,y-size/2,size,size);c.restore();
  }
  function shock(c,run,at,reduced=false){
    const effect=run.glitchShock;if(!effect)return;
    const t=clamp((at-effect.startedAt)/440,0,1);if(t>=1)return;
    const cell=run.cellSize;
    const visible=effect.targets.filter(b=>b.y+b.h>=run.cameraY&&b.y<=run.cameraY+run.viewHeight).slice(0,48);
    c.save();c.shadowBlur=0;
    for(let i=0;i<visible.length;i++){
      const b=visible[i],x=b.x+b.w/2,y=b.y+b.h/2-run.cameraY;
      const white=clamp(1-t/.48,0,1);
      c.globalAlpha=white*.68;c.fillStyle='#fff';c.fillRect(b.x+2,b.y-run.cameraY+2,b.w-4,b.h-4);
      flash(c,x,y,cell*1.5,white*.52);
      // Local RGB slices blink on each tile; no connecting bolts or rays.
      const frame=Math.floor(at/45);
      for(let j=0;j<(reduced?1:4);j++){
        const seed=(i*29+j*43+frame*17)%89,offset=reduced?0:(seed%13-6);
        c.globalAlpha=(1-t)*.62;c.fillStyle=j%2?'#f1ffff':seed%2?'#a8fff5':'#ffb4ed';
        c.fillRect(b.x+3+offset,b.y-run.cameraY+4+seed/89*(b.h-12),b.w-6,2+seed%4);
      }
    }
    c.restore();
  }
  function infected(c,b,sy,at,reduced=false){
    const frame=reduced?0:Math.floor(at/90),seed=b.row*17+b.col*29;
    c.save();c.globalCompositeOperation='screen';
    c.globalAlpha=.18;c.drawImage(glow('cyan'),b.x,sy,b.w,b.h);
    for(let i=0;i<(reduced?1:3);i++){
      const n=(seed+frame*23+i*41)%97,offset=reduced?0:n%9-4;
      c.globalAlpha=.48+(n%3)*.1;c.fillStyle=i%2?'#ff88e5':'#a3fff3';
      c.fillRect(b.x+3+offset,sy+5+n/97*(b.h-12),b.w-6,2+n%3);
      c.fillRect(b.x+(n%2?b.w-9:3),sy+5+(n*3%97)/97*(b.h-13),5,5);
    }
    c.restore();
  }
  function breaks(c,run,at,reduced=false){
    const bursts=run.glitchBreakBursts;if(!bursts?.length)return;
    run.glitchBreakBursts=bursts.filter(b=>at-b.startedAt<460);
    for(const b of run.glitchBreakBursts){
      const t=clamp((at-b.startedAt)/460,0,1),fade=(1-t)**1.7,x=b.x+b.w/2,y=b.y+b.h/2-run.cameraY;
      if(y < -b.h || y > run.viewHeight+b.h)continue;
      flash(c,x,y,b.w*(1.5+t),fade*.8);
      c.save();c.globalAlpha=fade;c.fillStyle='#fff';
      if(t<.2)c.fillRect(b.x+b.w*.12,b.y-run.cameraY+b.h*.12,b.w*.76,b.h*.76);
      for(let i=0;i<(reduced?3:8);i++){
        const angle=i*Math.PI/4+.2,d=b.w*(.18+t*.85),size=b.w*(.12-.07*t);
        c.fillStyle=b.safe?'#8dffc0':i%3===0?'#fff':i%2?'#ff8fe8':'#7dfff4';
        c.fillRect(x+Math.cos(angle)*d-size/2,y+Math.sin(angle)*d-size/2,size*(i%2?1.5:1),size*.75);
      }
      c.restore();
    }
  }
  let screenCanvas=null,screenToken=null;
  function screen(c,width,height,at,effect,reduced=false){
    const t=clamp((at-effect.startedAt)/(effect.until-effect.startedAt),0,1);if(t>=1)return;
    if(!screenCanvas){screenCanvas=document.createElement('canvas');}
    if(screenToken!==effect){
      screenCanvas.width=width;screenCanvas.height=height;
      screenCanvas.getContext('2d').drawImage(c.canvas,0,0,c.canvas.width,c.canvas.height,0,0,width,height);screenToken=effect;
    }
    c.save();c.globalAlpha=(1-t)*.8;
    const frame=reduced?0:Math.floor((at-effect.startedAt)/55),bands=reduced?2:7;
    for(let i=0;i<bands;i++){
      const seed=(i*127+frame*61)%701,y=90+seed/701*(height-120),h=3+seed%12,dx=reduced?0:(seed%25-12);
      c.drawImage(screenCanvas,0,y,width,h,dx,y,width,h);
      c.fillStyle=i%2?'rgba(255,90,225,.2)':'rgba(91,255,238,.25)';c.fillRect(0,y,width,h);
    }
    c.globalAlpha=(1-t)*.06;c.fillStyle='#efffff';c.fillRect(0,90,width,height-90);c.restore();
  }
  function disarm(c,run,at){
    const effect=run.glitchDisarm;if(!effect)return;
    const b=effect.block,x=b.x+b.w/2,y=b.y+b.h/2-run.cameraY,cell=run.cellSize;
    if(y<-cell||y>run.viewHeight+cell)return;
    const completed=!!effect.completedAt,t=clamp((at-effect.startedAt)/850,0,1);
    const fade=completed?clamp((effect.finishAt-at)/750,0,1):1;
    c.save();c.shadowBlur=0;
    if(!completed){
      const sx=run.slime.x,sy=run.slime.y-run.cameraY;
      c.globalAlpha=.8;c.strokeStyle='#64fff2';c.lineWidth=3;c.setLineDash([7,7]);c.lineDashOffset=-at*.06;
      c.beginPath();c.moveTo(sx,sy);c.lineTo(sx+(x-sx)*clamp(t*4,0,1),sy+(y-sy)*clamp(t*4,0,1));c.stroke();c.setLineDash([]);
      const scanY=b.y-run.cameraY+b.h*t;
      flash(c,x,scanY,cell*.85,.75);c.globalAlpha=.9;c.fillStyle='#d5fff3';c.fillRect(b.x+2,scanY,b.w-4,3);
    }else flash(c,x,y,cell*(2+(1-fade)*.6),fade*.85);
    c.globalAlpha=fade;c.strokeStyle='#70ffb2';c.lineWidth=3;
    const pad=5,len=cell*.2,l=b.x-pad,r=b.x+b.w+pad,top=b.y-run.cameraY-pad,bottom=top+b.h+pad*2;
    for(const [px,py,dx,dy]of [[l,top,1,1],[r,top,-1,1],[l,bottom,1,-1],[r,bottom,-1,-1]]){
      c.beginPath();c.moveTo(px+dx*len,py);c.lineTo(px,py);c.lineTo(px,py+dy*len);c.stroke();
    }
    const label=completed?(effect.reward==='heal'?'ЛЕЧЕНИЕ':'+'+b.flaskValue+' КОЛБ'):'ВЗЛОМ '+Math.floor(t*100)+'%';
    c.font='900 12px Nunito, sans-serif';c.textAlign='center';c.textBaseline='middle';
    const width=Math.max(cell+8,c.measureText(label).width+14),labelX=clamp(x,width/2+2,run.viewWidth-width/2-2);
    c.fillStyle='#123f40';c.fillRect(labelX-width/2,top-29,width,22);c.fillStyle='#a0ffcb';c.fillText(label,labelX,top-18);
    c.restore();
  }
  window.SlimeGlitchFeedback=Object.freeze({shock,disarm,screen,infected,breaks});
})();
