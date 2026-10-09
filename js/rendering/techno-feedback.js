(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  function minePoint(mine, progress) {
    const t = clamp(progress), u = 1-t;
    const dx = mine.toX-mine.fromX, dy = mine.toY-mine.fromY;
    const bend = mine.bend || 64;
    const cx = mine.fromX + (mine.side || Math.sign(dx) || 1) * bend;
    const cy = Math.min(mine.fromY, mine.toY) - bend * 1.2;
    return {x:u*u*mine.fromX+2*u*t*cx+t*t*mine.toX,
      y:u*u*mine.fromY+2*u*t*cy+t*t*mine.toY,
      angle:Math.atan2(2*u*(cy-mine.fromY)+2*t*(mine.toY-cy),2*u*(cx-mine.fromX)+2*t*(mine.toX-cx))};
  }
  function laserTint(ctx, block, y, timestamp) {
    if (!(block.nanoLaserUntil > timestamp)) return;
    const progress=clamp((timestamp-block.nanoLaserStartedAt)/Math.max(1,block.nanoLaserUntil-block.nanoLaserStartedAt));
    ctx.save(); ctx.fillStyle=`rgba(255,25,58,${.25+progress*.55})`;
    ctx.fillRect(block.x+1,y+1,block.w-2,block.h-2);
    ctx.strokeStyle='#ffb4b4'; ctx.lineWidth=1.5;
    const scan=y+progress*block.h;
    ctx.beginPath();ctx.moveTo(block.x+2,scan);ctx.lineTo(block.x+block.w-2,scan);ctx.stroke();ctx.restore();
  }
  function disintegration(ctx, effect, cameraY, timestamp) {
    const t=clamp((timestamp-effect.at)/460), size=effect.w/6;
    if(t>=1)return;
    ctx.save();
    for(let row=0;row<6;row++)for(let col=0;col<6;col++){
      const seed=(row*31+col*17)%13, delay=seed*.009;
      const p=clamp((t-delay)/(1-delay)), shrink=Math.max(0,1-p*1.4);
      ctx.globalAlpha=(1-p)*.95;
      ctx.fillStyle=seed%3===0?'#ffede2':seed%3===1?'#ff344e':'#a61030';
      const x=effect.x+(col+.5)*size+(col-2.5)*p*size*1.5;
      const y=effect.y-cameraY+(row+.5)*effect.h/6-p*p*effect.h*.8;
      ctx.fillRect(x-size*shrink/2,y-size*shrink/2,size*shrink*.9,size*shrink*.9);
    }
    ctx.restore();
  }
  function mineWake(ctx,mine,progress,cameraY,size){
    ctx.save();ctx.lineCap='round';
    for(let i=0;i<4;i++){
      const t=Math.max(0,progress-i*.035), a=minePoint(mine,t), b=minePoint(mine,Math.max(0,t-.035));
      ctx.globalAlpha=(1-i/4)*.7;ctx.strokeStyle=i?'#ff394e':'#ffe9bb';ctx.lineWidth=size*(.19-i*.025);
      ctx.beginPath();ctx.moveTo(a.x,a.y-cameraY);ctx.lineTo(b.x,b.y-cameraY);ctx.stroke();
    }ctx.restore();
  }
  function mineBlast(ctx,effect,cameraY,timestamp){
    const t=clamp((timestamp-effect.at)/430);if(t>=1)return;
    ctx.save();ctx.globalAlpha=(1-t)*(1-t);
    ctx.strokeStyle='#ff4356';ctx.lineWidth=5*(1-t)+1;
    ctx.beginPath();ctx.arc(effect.x,effect.y-cameraY,effect.size*(.15+t*.95),0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#fff2c2';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(effect.x,effect.y-cameraY,effect.size*(.08+t*.6),0,Math.PI*2);ctx.stroke();
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4, r=effect.size*(.2+t*.8);
      ctx.beginPath();ctx.moveTo(effect.x+Math.cos(a)*r,effect.y-cameraY+Math.sin(a)*r);
      ctx.lineTo(effect.x+Math.cos(a)*(r+effect.size*.16),effect.y-cameraY+Math.sin(a)*(r+effect.size*.16));ctx.stroke();
    }ctx.restore();
  }
  window.SlimeTechnoFeedback=Object.freeze({minePoint,laserTint,disintegration,mineWake,mineBlast});
})();
