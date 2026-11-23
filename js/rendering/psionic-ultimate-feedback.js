(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
  let glow;
  const edgeFrames=[];
  let washTexture,columnTexture;
  function glowTexture(){
    if(glow)return glow;
    glow=document.createElement('canvas');glow.width=glow.height=128;
    const c=glow.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'rgba(240,252,255,.98)');g.addColorStop(.13,'rgba(102,234,255,.97)');
    g.addColorStop(.38,'rgba(5,176,255,.62)');g.addColorStop(1,'rgba(0,103,240,0)');
    c.fillStyle=g;c.fillRect(0,0,128,128);return glow;
  }
  function preparePressureTextures(){
    if(edgeFrames.length)return;
    for(let frame=0;frame<8;frame++){
      const canvas=document.createElement('canvas');canvas.width=64;canvas.height=512;
      const c=canvas.getContext('2d'),phase=frame*TAU/8;
      const wave=y=>32+Math.sin(y*.025-phase)*2.4+Math.sin(y*.057+phase)*1.2;
      c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(wave(0),0);
      for(let y=0;y<512;y+=32){const end=Math.min(512,y+32),mid=(y+end)/2;c.bezierCurveTo(wave(mid),y+10,wave(mid),end-10,wave(end),end);}
      for(const [color,width,alpha] of [['#087ce8',21,.32],['#074a91',9,.5],['#12cfff',6.5,.98],['#d7fcff',2.1,1]]){
        c.globalAlpha=alpha;c.strokeStyle=color;c.lineWidth=width;c.stroke();
      }
      edgeFrames.push(canvas);
    }
    washTexture=document.createElement('canvas');washTexture.width=128;washTexture.height=1;
    let c=washTexture.getContext('2d'),g=c.createLinearGradient(0,0,128,0);
    g.addColorStop(0,'rgba(0,118,238,0)');g.addColorStop(1,'rgba(0,196,255,1)');c.fillStyle=g;c.fillRect(0,0,128,1);
    columnTexture=document.createElement('canvas');columnTexture.width=96;columnTexture.height=1;
    c=columnTexture.getContext('2d');g=c.createLinearGradient(0,0,96,0);
    g.addColorStop(0,'rgba(0,135,255,0)');g.addColorStop(.4,'rgba(0,191,255,.52)');
    g.addColorStop(.48,'rgba(113,235,255,.9)');g.addColorStop(.5,'rgba(241,254,255,1)');
    g.addColorStop(.52,'rgba(113,235,255,.9)');g.addColorStop(.6,'rgba(0,191,255,.52)');g.addColorStop(1,'rgba(0,135,255,0)');
    c.fillStyle=g;c.fillRect(0,0,96,1);
  }
  function preload(){glowTexture();preparePressureTextures();return Promise.resolve();}
  function sprite(ctx,kind,x,y,w,h,alpha=1,rotation=0){
    if(alpha<=0||w<=0||h<=0)return;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalAlpha*=clamp(alpha);
    ctx.drawImage(glowTexture(),-w/2,-h/2,w,h);ctx.restore();
  }
  function pressPose(block,progress,centerX){
    const p=clamp(progress);
    return {x:(block.x+block.w/2)*(1-p)+centerX*p,y:block.y+block.h/2,
      scaleX:Math.max(.035,1-p*.965),scaleY:1,rotation:0};
  }
  function forceEdge(ctx,x,top,bottom,age,alpha,reduced){
    if(alpha<=0)return;
    preparePressureTextures();
    const phase=reduced?0:age/75,index=Math.floor(phase)%8,blend=phase-Math.floor(phase);
    const base=ctx.globalAlpha;ctx.save();
    ctx.globalAlpha=base*alpha*(1-blend);ctx.drawImage(edgeFrames[index],x-32,top,64,bottom-top);
    if(blend>.001){ctx.globalAlpha=base*alpha*blend;ctx.drawImage(edgeFrames[(index+1)%8],x-32,top,64,bottom-top);}
    ctx.restore();
  }
  function press(ctx,{top,bottom,originY=top,width,cell,progress,age,collided,release=0,back=false,reduced=false}){
    if(bottom<=top)return;
    const p=clamp(progress),middle=width/2,charge=clamp(age/260),front=p*(middle-3);
    if(!collided){
      if(back){
        preparePressureTextures();ctx.save();ctx.globalAlpha*=charge*(.11+p*.14);
        ctx.drawImage(washTexture,0,top,Math.max(.01,front),bottom-top);
        ctx.translate(width,0);ctx.scale(-1,1);ctx.drawImage(washTexture,0,top,Math.max(.01,front),bottom-top);
        ctx.restore();return;
      }
      forceEdge(ctx,front,top,bottom,age,charge*(.65+p*.3),reduced);
      forceEdge(ctx,width-front,top,bottom,age,charge*(.65+p*.3),reduced);
      const count=reduced?6:14;
      for(let i=0;i<count;i++){
        const t=(age/(510+i*23)+i*.217)%1,side=i%2?-1:1;
        const x=middle+side*(middle-front+12)*Math.pow(1-t,1.4);
        const y=top+(i*.618%1)*(bottom-top)+Math.sin(t*Math.PI)*cell*.12;
        sprite(ctx,'mote',x,y,cell*.13,cell*.075,Math.sin(t*Math.PI)*charge*.8);
      }
    }else if(!back){
      const flash=clamp(1-release/.22),fade=(1-release)**2;
      if(flash>0){preparePressureTextures();ctx.save();ctx.globalAlpha*=flash;ctx.drawImage(columnTexture,middle-40,top,80,bottom-top);ctx.restore();}
      const spacing=cell*2.3,start=originY+Math.floor((top-originY)/spacing)*spacing;
      ctx.save();ctx.strokeStyle='#54dfff';ctx.lineWidth=1.8;ctx.globalAlpha=fade*.7;
      for(let y=start+cell;y<bottom;y+=spacing){
        ctx.beginPath();ctx.ellipse(middle,y,9+release*width*.48,4+release*cell*.3,0,0,TAU);ctx.stroke();
        sprite(ctx,'mote',middle,y,cell*(.6+flash*.6),cell*.5,flash*.85);
      }
      ctx.restore();
    }
  }
  function grip(ctx,x,y,size,alpha=1){
    const half=size*.48,corner=size*.19;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha*=alpha*.9;
    ctx.strokeStyle='#74eaff';ctx.lineWidth=1.9;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();
    for(const sx of [-1,1])for(const sy of [-1,1]){
      ctx.moveTo(sx*(half-corner),sy*half);ctx.lineTo(sx*half,sy*half);ctx.lineTo(sx*half,sy*(half-corner));
    }
    ctx.stroke();ctx.restore();
  }
  function ribbon(ctx,x0,y0,x1,y1,size,alpha=1){
    const dx=x1-x0,dy=y1-y0,distance=Math.hypot(dx,dy);if(distance<2)return;
    const length=Math.min(distance,size*3),ux=dx/distance,uy=dy/distance;
    ctx.save();ctx.lineCap='round';
    const g=ctx.createLinearGradient(x1-ux*length,y1-uy*length,x1,y1);
    g.addColorStop(0,'rgba(0,134,255,0)');g.addColorStop(.68,'rgba(0,208,255,.52)');g.addColorStop(1,'rgba(186,249,255,.98)');
    ctx.globalAlpha*=alpha;ctx.strokeStyle=g;ctx.lineWidth=Math.max(1.5,size*.16);
    ctx.beginPath();ctx.moveTo(x1-ux*length,y1-uy*length);ctx.lineTo(x1,y1);ctx.stroke();ctx.restore();
    sprite(ctx,'mote',x1,y1,size*.7,size*.7,alpha*.35);
  }
  function burst(ctx,b,camera,cell,at,life=330){
    const t=clamp((at-b.startedAt)/life);if(t>=1)return;
    const x=b.x,y=b.y-camera,fade=(1-t)**1.6;
    sprite(ctx,'mote',x,y,cell*(.65+t*1.8),cell*(.65+t*1.8),fade*.8);
    ctx.save();ctx.globalAlpha=fade*.6;ctx.strokeStyle='#5ee8ff';ctx.lineWidth=2.5-t;
    ctx.beginPath();ctx.arc(x,y,cell*(.15+t*.66),0,TAU);ctx.stroke();ctx.restore();
    for(let i=0;i<5;i++){
      const a=i*TAU/5+.3,r=cell*(.15+t*.75),s=cell*.13*(1-t);
      sprite(ctx,'mote',x+Math.cos(a)*r,y+Math.sin(a)*r,s,s,fade*.8);
    }
  }
  function caster(ctx,x,y,radius,energy,at){
    const cy=y-radius*1.75;
    sprite(ctx,'mote',x,cy,radius*2.8,radius*2.2,energy*.43);
    ctx.save();ctx.globalAlpha*=energy;ctx.fillStyle='#ddf5ff';ctx.strokeStyle='#27cdff';ctx.lineWidth=1.5;
    const h=radius*.34;ctx.beginPath();ctx.moveTo(x,cy-h);ctx.lineTo(x+h*.48,cy);ctx.lineTo(x,cy+h);ctx.lineTo(x-h*.48,cy);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.globalAlpha*=.5;ctx.lineWidth=1.2;
    for(let i=0;i<2;i++){
      const r=radius*(.62+i*.25);ctx.beginPath();ctx.ellipse(x,cy,r,r*.32,Math.sin(at/320+i)*.12,at/(430+i*120),at/(430+i*120)+Math.PI*1.2);ctx.stroke();
    }
    ctx.restore();
  }
  function field(ctx, x, y, radius, age, strength, front, reduced) {
    if (strength <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= strength;
    const phase = age / (reduced ? 1650 : 560);
    if (!front) {
      sprite(ctx, 'mote', 0, 0, radius * 3, radius * 2.8, .28);
      const surface = ctx.createLinearGradient(0, -radius, 0, radius);
      surface.addColorStop(0, 'rgba(203,183,255,.31)');
      surface.addColorStop(.48, 'rgba(79,36,171,.16)');
      surface.addColorStop(1, 'rgba(75,224,255,.34)');
      ctx.fillStyle = surface;
      ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * .9, 0, 0, TAU); ctx.fill();
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = front ? 2.1 : 1.4;
    const rim = ctx.createLinearGradient(-radius,-radius,radius,radius);
    rim.addColorStop(0,'rgba(183,154,255,.13)');
    rim.addColorStop(.38,front ? '#efffff' : '#b69eff');
    rim.addColorStop(.66,front ? '#72e6ff' : '#85b6f5');
    rim.addColorStop(1,'rgba(125,191,255,.16)');
    ctx.strokeStyle = rim;
    const turn = phase + (front ? 0 : Math.PI);
    ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * .9, 0, turn, turn + Math.PI * 1.18); ctx.stroke();
    ctx.lineWidth = 1.35;
    ctx.strokeStyle = rim;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 1.11, radius * .44, front ? -.29 : .46, -phase, -phase + 2.7);
    ctx.stroke();
    for (let i = 0; i < (reduced ? 3 : 6); i++) {
      const angle = phase * (i % 2 ? -.68 : .84) + i * 2.399;
      const r = radius * (.83 + (i % 3) * .12);
      if ((Math.sin(angle) > 0) !== front) continue;
      const px = Math.cos(angle) * r, py = Math.sin(angle) * r * .76;
      ctx.fillStyle = i % 2 ? '#e9ccff' : '#b7fbff';
      const s = i % 3 === 0 ? 3.1 : 1.9;
      ctx.beginPath(); ctx.moveTo(px, py - s); ctx.lineTo(px + s * .55, py);
      ctx.lineTo(px, py + s); ctx.lineTo(px - s * .55, py); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function castTrail(ctx, points, camera, width, alpha = 1) {
    if (points.length < 2 || alpha <= 0) return;
    const tail = points[0], head = points.at(-1);
    if (Math.hypot(head.x - tail.x, head.y - tail.y) < 1) return;
    const g = ctx.createLinearGradient(tail.x, tail.y - camera, head.x, head.y - camera);
    g.addColorStop(0, 'rgba(133,77,254,0)');
    g.addColorStop(.44, 'rgba(159,105,255,.48)');
    g.addColorStop(.77, 'rgba(121,228,255,.83)');
    g.addColorStop(1, '#efffff');
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tail.x, tail.y - camera);
    for (let i = 1; i < points.length-1; i++) {
      const p = points[i], next = points[i+1];
      ctx.quadraticCurveTo(p.x,p.y-camera,(p.x+next.x)*.5,(p.y+next.y)*.5-camera);
    }
    ctx.lineTo(head.x,head.y-camera);
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.globalAlpha *= .5;
    ctx.stroke();
    ctx.globalAlpha *= 2;
    ctx.lineWidth = Math.max(1.2, width * .18);
    ctx.stroke();
    ctx.restore();
  }

  function castImpact(ctx, effect, camera, cell, age, reduced) {
    if (age < 0 || age >= 450) return;
    const t = age / 450, fade = 1 - t;
    const { x, y, power } = effect;
    const radius = cell * power * (.16 + (1 - fade ** 3) * .77);
    sprite(ctx, 'mote', x, y - camera, cell * 2.7 * power, cell * 2.3 * power, fade ** 5 * .76);
    ctx.save();
    ctx.translate(x, y - camera);
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = fade ** 2 * (i ? .66 : .94);
      ctx.strokeStyle = i ? '#ad93ff' : '#95f4ff';
      ctx.lineWidth = (i ? 2.3 : 3.4) * fade + .55;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (i ? .76 : 1), radius * (i ? .63 : .84), -.26, i * 2.8, i * 2.8 + 4.9);
      ctx.stroke();
    }
    for (let i = 0; i < (reduced ? 5 : 11); i++) {
      const angle = i * 2.399;
      const travel = radius * (.78 + i % 4 * .13);
      const tip = (.04 + (i % 3) * .035) * cell * fade;
      ctx.globalAlpha = fade * .86;
      ctx.strokeStyle = i % 2 ? '#e3c6ff' : '#c1fcff';
      ctx.lineWidth = 1 + fade * 1.4;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * travel, Math.sin(angle) * travel);
      ctx.lineTo(Math.cos(angle) * (travel + tip), Math.sin(angle) * (travel + tip)); ctx.stroke();
    }
    ctx.restore();
  }

  function shard(ctx, x, y, size, spin, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.globalAlpha *= alpha;
    const rock = ctx.createLinearGradient(-size*.27,-size*.55,size*.16,size*.48);
    rock.addColorStop(0,'#defaff');
    rock.addColorStop(.28,color);
    rock.addColorStop(.72,color);
    rock.addColorStop(1,'#3b2f67');
    ctx.fillStyle = rock;
    ctx.beginPath();
    ctx.moveTo(-size*.6,size*.21); ctx.lineTo(-size*.35,-size*.31);
    ctx.lineTo(size*.31,-size*.55); ctx.lineTo(size*.72,-size*.21);
    ctx.lineTo(size*.15,size*.45); ctx.lineTo(-size*.28,size*.49); ctx.closePath(); ctx.fill();
    const facet = ctx.createLinearGradient(-size*.5,-size*.24,size*.66,-size*.12);
    facet.addColorStop(0,'rgba(200,226,255,.15)');
    facet.addColorStop(1,'rgba(233,248,255,.89)');
    ctx.beginPath(); ctx.moveTo(-size*.35,-size*.31); ctx.lineTo(size*.31,-size*.55);
    ctx.lineTo(size*.72,-size*.21); ctx.lineTo(size*.03,size*.03); ctx.closePath();
    ctx.fillStyle = facet; ctx.fill();
    ctx.restore();
  }

  window.SlimePsionicFeedback=Object.freeze({preload,sprite,pressPose,press,grip,ribbon,burst,caster,field,castTrail,castImpact,shard,cacheStats:()=>({edgeFrames:edgeFrames.length,gradientTextures:Number(Boolean(washTexture))+Number(Boolean(columnTexture))})});
})();
