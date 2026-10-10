(() => {
  'use strict';
  // Reuse four shard silhouettes; no textures, per-particle blur or pixel reads.
  const outlines = [
    [[-1,-.7],[.55,-1],[1,.15],[.1,.85],[-.8,.5]],
    [[-.95,-.35],[.1,-1],[1,.2],[.55,.85],[-.65,.7]],
    [[-.8,-.9],[.85,-.6],[.65,.8],[-.35,1],[-1,.1]],
    [[-.9,-.7],[.8,-1],[1,.65],[-.75,.9]]
  ].map(points => {
    const path = new Path2D();
    points.forEach(([x,y],i) => i ? path.lineTo(x,y) : path.moveTo(x,y));
    path.closePath();return path;
  });
  const random = (a,b) => a + Math.random() * (b-a);
  const palettes=new Map();
  const shardSprites=new Map();
  function shardSprite(color,variant) {
    const key=color+':'+variant;
    if(shardSprites.has(key))return shardSprites.get(key);
    if(typeof OffscreenCanvas==='undefined' && typeof document==='undefined')return null;
    const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(48,48):document.createElement('canvas');
    canvas.width=canvas.height=48;
    const target=canvas.getContext('2d');
    if(!target)return null;
    target.translate(24,24);target.scale(14,14);
    target.fillStyle=color;target.strokeStyle='#112c36';target.lineWidth=.22;
    target.fill(outlines[variant]);target.stroke(outlines[variant]);
    target.strokeStyle='#fff1c9';target.lineWidth=.16;target.beginPath();target.moveTo(-.55,-.53);target.lineTo(.35,-.72);target.stroke();
    if(shardSprites.size>=48)shardSprites.delete(shardSprites.keys().next().value);
    shardSprites.set(key,canvas);
    return canvas;
  }
  function palette(color){
    if(!palettes.has(color)){
      const hex=parseInt(color.slice(1),16),light=[16,8,0].map(shift=>Math.min(255,((hex>>shift)&255)+30));
      palettes.set(color,[color,`rgb(${light.join(',')})`]);
    }
    return palettes.get(color);
  }
  function emit(block, {color, count, strong, density, maxParticles = 24}) {
    const total = Math.max(0, Math.min(maxParticles, 24, Math.max(strong ? 6 : 2, Math.round(count * (strong ? 2.1 : 1.25) * density))));
    const particles = [], cx=block.x+block.w/2, cy=block.y+block.h/2;
    for(let i=0;i<total;i++) {
      const spark=strong && i%4===0, angle=Math.PI*2*i/total+random(-.23,.23);
      const speed=random(strong?110:50,strong?255:125), life=random(spark?.16:.28,spark?.3:.63);
      particles.push({kind:'debris',shape:spark?'spark':'shard',variant:i%4,
        x:cx+Math.cos(angle)*block.w*.2,y:cy+Math.sin(angle)*block.h*.2,
        vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-65,gravity:spark?70:490,
        life,maxLife:life,size:random(spark?1.5:3,spark?2.5:7),color:spark?'#fff2c3':block.flaskTier&&i%4===1?'#29c9f3':palette(color)[i%2],
        rotation:angle,spin:random(-8,8)});
    }
    return {particles,impact:strong?{type:'blockBreak',x:cx,y:cy,life:.26,maxLife:.26,
      radius:Math.min(block.w,block.h)*.46,color}:null};
  }
  function emitEssence(block,value,density,maxParticles=24){
    const particles=[],count=Math.max(0,Math.min(maxParticles,Math.max(5,Math.round((10+(block.flaskTier||1)*2)*density))));
    const x=block.x+block.w/2,y=block.y+block.h/2;
    for(let i=0;i<count;i++){
      const angle=i/count*Math.PI*2,life=random(.3,.55),speed=random(85,180);
      particles.push({kind:'debris',shape:'drop',x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-75,
        gravity:190,life,maxLife:life,size:random(2.5,5),color:i%2?'#25caff':'#c7fbff'});
    }
    return {particles,impact:{type:'essenceCollect',x,y,value,life:.9,maxLife:.9,radius:block.w*.6}};
  }
  function drawParticle(ctx,p,y) {
    if(p.shape==='drop'){
      ctx.save();ctx.translate(p.x,y);ctx.rotate(Math.atan2(p.vy,p.vx)+Math.PI/2);
      ctx.fillStyle=p.color;ctx.beginPath();ctx.moveTo(0,-p.size*1.6);
      ctx.quadraticCurveTo(p.size*1.35,-p.size*.1,p.size*.7,p.size*.65);
      ctx.quadraticCurveTo(0,p.size*1.5,-p.size*.7,p.size*.65);
      ctx.quadraticCurveTo(-p.size*1.35,-p.size*.1,0,-p.size*1.6);ctx.fill();
      ctx.restore();return;
    }
    if(p.shape==='spark') {
      const speed=Math.max(1,Math.hypot(p.vx,p.vy)), length=5+p.size*3.4;
      ctx.lineCap='round';ctx.lineWidth=p.size;ctx.strokeStyle=p.color;
      ctx.beginPath();ctx.moveTo(p.x,y);ctx.lineTo(p.x-p.vx/speed*length,y-p.vy/speed*length);ctx.stroke();
      return;
    }
    const sprite=shardSprite(p.color,p.variant);
    ctx.save();ctx.translate(p.x,y);ctx.rotate(p.rotation+(p.maxLife-p.life)*p.spin);
    if(sprite){const size=p.size*48/14;ctx.drawImage(sprite,-size/2,-size/2,size,size);ctx.restore();return;}
    ctx.scale(p.size,p.size);
    ctx.fillStyle=p.color;ctx.strokeStyle='#112c36';ctx.lineWidth=.22;
    ctx.fill(outlines[p.variant]);ctx.stroke(outlines[p.variant]);
    ctx.strokeStyle='#fff1c9';ctx.lineWidth=.16;ctx.beginPath();ctx.moveTo(-.55,-.53);ctx.lineTo(.35,-.72);ctx.stroke();
    ctx.restore();
  }
  function drawImpact(ctx,e,cameraY) {
    const t=1-Math.max(0,e.life/e.maxLife), y=e.y-cameraY, radius=e.radius*(.35+t*1.25);
    ctx.translate(e.x,y);
    if(e.type==='essenceCollect'){
      ctx.globalAlpha=Math.min(1,(1-t)*2.4);ctx.strokeStyle='#57e5ff';ctx.lineWidth=3*(1-t)+1;
      ctx.beginPath();ctx.ellipse(0,0,radius*1.35,radius*.9,0,0,Math.PI*2);ctx.stroke();
      const pop=1+Math.sin(Math.min(1,t/.2)*Math.PI)*.12;
      ctx.font='1000 25px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
      const textWidth=ctx.measureText(`+${e.value}`).width,dx=textWidth/2+8;
      const fit=Math.min(1,e.radius/.6*.94/(textWidth+36));
      ctx.translate(0,-18-t*40);ctx.scale(fit,pop*fit);
      ctx.fillStyle='#052d4a';ctx.beginPath();ctx.ellipse(3,1,textWidth/2+18,18,0,0,Math.PI*2);ctx.fill();
      ctx.lineWidth=4;ctx.strokeStyle='#031b34';ctx.strokeText(`+${e.value}`,-5,0);
      ctx.fillStyle='#ecffff';ctx.fillText(`+${e.value}`,-5,0);
      // A tiny flask identifies the reward without loading an extra bitmap.
      ctx.translate(dx,0);ctx.fillStyle='#21cfff';ctx.strokeStyle='#e4ffff';ctx.lineWidth=1.8;
      ctx.beginPath();ctx.moveTo(-3,-11);ctx.lineTo(3,-11);ctx.lineTo(3,-5);
      ctx.bezierCurveTo(12,3,9,10,0,10);ctx.bezierCurveTo(-9,10,-12,3,-3,-5);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-4,-11);ctx.lineTo(4,-11);ctx.moveTo(-5,1);ctx.lineTo(4,1);ctx.stroke();
      return;
    }
    if(t<.5) {
      ctx.globalAlpha=(1-t*2)*.8;ctx.fillStyle='#fff5d2';
      ctx.beginPath();
      for(let i=0;i<12;i++) {const a=i*Math.PI/6,r=radius*(i%2?.43:1);i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(r,0);}
      ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=Math.pow(1-t,1.6)*.8;ctx.strokeStyle='#fff2ce';ctx.lineWidth=2.5*(1-t)+.5;
    ctx.beginPath();ctx.ellipse(0,0,radius*1.15,radius*.72,0,0,Math.PI*2);ctx.stroke();
  }
  window.SlimeBlockBreakFeedback=Object.freeze({emit,emitEssence,drawParticle,drawImpact});
})();
