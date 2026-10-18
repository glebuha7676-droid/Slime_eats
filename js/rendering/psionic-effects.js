(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const cache=new Map(),TAU=Math.PI*2;
  function texture(kind){
    if(cache.has(kind))return cache.get(kind);
    const image=document.createElement('canvas');image.width=image.height=256;
    const c=image.getContext('2d');c.translate(128,128);
    if(kind==='bubble'){
      const fill=c.createRadialGradient(-34,-43,8,0,0,110);
      fill.addColorStop(0,'rgba(225,250,255,.2)');fill.addColorStop(.65,'rgba(112,188,255,.045)');
      fill.addColorStop(.86,'rgba(151,160,255,.13)');fill.addColorStop(.96,'rgba(110,206,255,.48)');fill.addColorStop(1,'rgba(161,237,255,.9)');
      c.fillStyle=fill;c.beginPath();c.arc(0,0,110,0,TAU);c.fill();
      c.strokeStyle='#83d9ff';c.lineWidth=3;c.stroke();c.strokeStyle='rgba(234,253,255,.8)';c.lineWidth=1.5;c.beginPath();c.arc(0,0,106,0,TAU);c.stroke();
      c.lineCap='round';c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=7;c.beginPath();c.arc(0,0,99,Math.PI*1.1,Math.PI*1.4);c.stroke();
      c.strokeStyle='rgba(192,234,255,.55)';c.lineWidth=4;c.beginPath();c.arc(0,0,100,.2,.7);c.stroke();
    }else{
      const fill=c.createRadialGradient(0,0,0,0,0,126);
      fill.addColorStop(0,'rgba(237,254,255,.96)');fill.addColorStop(.15,'rgba(170,230,255,.8)');
      fill.addColorStop(.4,'rgba(102,154,255,.32)');fill.addColorStop(1,'rgba(130,110,255,0)');
      c.fillStyle=fill;c.fillRect(-128,-128,256,256);
    }
    cache.set(kind,image);return image;
  }
  function halo(c,x,y,size,alpha=.5){
    c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;c.drawImage(texture('halo'),x-size/2,y-size/2,size,size);c.restore();
  }
  function blast(c,b,camera,cell,at,life=420){
    const t=clamp((at-b.startedAt)/life,0,1);if(t>=1)return;
    const x=b.x,y=b.y-camera,size=cell*(1+3*t),alpha=(1-t)**1.5;
    halo(c,x,y,size,alpha*.9);
    c.save();
    for(let i=0;i<5;i++){const a=i*TAU/5+.3,r=cell*(.2+t*1.3),w=cell*.2*(1-t);halo(c,x+Math.cos(a)*r,y+Math.sin(a)*r,w,alpha*.7);}
    c.restore();
  }
  function bubble(c,run,at,radius){
    const b=run.psionicBarrier;if(!b||at>=b.until)return;
    const s=run.slime,x=s.x,y=s.y-run.cameraY,age=at-b.startedAt;
    const alpha=clamp(Math.min(age/130,(b.until-at)/180),0,1);
    const pulse=Math.max(0,1-(at-(b.lastPulseAt??-Infinity))/220);
    const size=radius*256/110;
    c.save();c.globalAlpha=alpha;c.drawImage(texture('bubble'),x-size/2,y-size/2,size,size);
    if(pulse>0)halo(c,x,y,radius*2.8,pulse*.3*alpha);
    // A cyan pill stays outside the body and away from the fixed top HUD.
    const width=72,height=27,view=run.viewHeight||780;
    const desired=y+radius+8,ty=clamp(desired+height>view-8?y-radius-height-8:desired,94,view-height-8),tx=clamp(x-width/2,8,(run.viewWidth||440)-width-8);
    c.globalAlpha=alpha;c.fillStyle='#123c60';c.strokeStyle='#65d7ff';c.lineWidth=2;c.beginPath();
    c.moveTo(tx+10,ty);c.lineTo(tx+width-10,ty);c.quadraticCurveTo(tx+width,ty,tx+width,ty+10);
    c.lineTo(tx+width,ty+height-10);c.quadraticCurveTo(tx+width,ty+height,tx+width-10,ty+height);
    c.lineTo(tx+10,ty+height);c.quadraticCurveTo(tx,ty+height,tx,ty+height-10);
    c.lineTo(tx,ty+10);c.quadraticCurveTo(tx,ty,tx+10,ty);c.fill();c.stroke();
    c.fillStyle='#a1edff';c.font='900 17px Nunito, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(Math.max(0,(b.until-at)/1000).toFixed(1)+'с',tx+width/2,ty+height/2-1);
    c.fillStyle='#43cfff';c.fillRect(tx+10,ty+height-4,(width-20)*clamp((b.until-at)/(b.until-b.startedAt),0,1),2);
    c.restore();
  }
  window.SlimePsionicEffects=Object.freeze({halo,blast,bubble});
})();
