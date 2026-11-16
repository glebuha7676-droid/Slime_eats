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
  const ashSprites=new Map();
  const ashColours = ['#29232b', '#554750', '#877681'];
  const charSprites = new WeakMap();
  let charFill;
  function effectCanvas() {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(64, 64);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    return canvas;
  }
  function charTexture() {
    if (charFill) return charFill;
    charFill = effectCanvas();
    const target = charFill.getContext('2d');
    const char = target.createLinearGradient(0, 0, 33, 64);
    char.addColorStop(0, '#484148');
    char.addColorStop(.36, '#30292f');
    char.addColorStop(1, '#1e1921');
    target.fillStyle = char;
    target.fillRect(0, 0, 64, 64);
    target.strokeStyle = '#19151e';
    target.lineWidth = 2.6;
    target.beginPath();
    target.moveTo(21, 0); target.lineTo(28, 19);
    target.lineTo(25, 34); target.lineTo(41, 43); target.lineTo(50, 64);
    target.moveTo(25, 34); target.lineTo(12, 39); target.lineTo(0, 53);
    target.moveTo(28, 19); target.lineTo(44, 15); target.lineTo(64, 24);
    target.stroke();
    target.strokeStyle = '#ce694683';
    target.lineWidth = 1.2;
    target.beginPath();
    target.moveTo(20, 4); target.lineTo(26, 18);
    target.moveTo(27, 35); target.lineTo(39, 42);
    target.moveTo(44, 16); target.lineTo(54, 21);
    target.stroke();
    return charFill;
  }

  function charForSprite(sprite) {
    if (!sprite) return charTexture();
    const cached = charSprites.get(sprite);
    if (cached) return cached;
    const canvas = effectCanvas();
    const target = canvas.getContext('2d');
    target.drawImage(sprite, 0, 0, 64, 64);
    // The source alpha is retained through recoloring and texture.
    target.globalCompositeOperation = 'source-atop';
    target.fillStyle = '#221d23f0';
    target.fillRect(0, 0, 64, 64);
    target.globalAlpha = .39;
    target.drawImage(charTexture(), 0, 0);
    charSprites.set(sprite, canvas);
    return canvas;
  }

  function drawChar(ctx, face, progress) {
    if (progress <= 0) return;
    const opacity = progress * progress * (3 - 2 * progress);
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.drawImage(charForSprite(face.sprite), face.x, face.y, face.width, face.height);
    ctx.restore();
  }
  function ashSprite(color) {
    if (ashSprites.has(color)) return ashSprites.get(color);
    const canvas = effectCanvas();
    const target = canvas.getContext('2d');
    const haze = target.createRadialGradient(32, 31, 3, 32, 32, 31);
    haze.addColorStop(0, color);
    haze.addColorStop(.42, color + 'bf');
    haze.addColorStop(1, color + '00');
    target.fillStyle = haze;
    target.fillRect(0, 0, 64, 64);
    ashSprites.set(color, canvas);
    return canvas;
  }
  function shardSprite(color,variant) {
    const key=color+':'+variant;
    if(shardSprites.has(key))return shardSprites.get(key);
    if(typeof OffscreenCanvas==='undefined' && typeof document==='undefined')return null;
    const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(48,48):document.createElement('canvas');
    canvas.width=canvas.height=48;
    const target=canvas.getContext('2d');
    if(!target)return null;
    target.translate(24,24);target.scale(14,14);
    target.fillStyle=color;target.strokeStyle='#182236bd';target.lineWidth=.145;
    target.fill(outlines[variant]);target.stroke(outlines[variant]);
    target.strokeStyle='#fff5e3c4';target.lineWidth=.13;target.lineCap='round';
    target.beginPath();target.moveTo(-.55,-.53);target.lineTo(.35,-.72);target.stroke();
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
    const pressure = strong && block.rockBreakPose && block.tier !== 'soft' && block.tier !== 'dense' ? block.rockBreakPose : null;
    for(let i=0;i<total;i++) {
      const spark=strong && i%5===0, angle=Math.PI*2*i/total+random(-.23,.23);
      const speed=random(strong?100:50,strong?208:125), life=random(spark?.12:.21,spark?.23:.41);
      let vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed - 45;
      if (pressure) {
        const spread = speed * (i % 2 ? 1 : -1);
        const depth = Math.sin(angle) * speed * .25;
        vx = -pressure.ny * spread + pressure.nx * depth;
        vy = pressure.nx * spread + pressure.ny * depth;
      }
      particles.push({kind:'debris',shape:spark?'spark':'shard',variant:i%4,
        x:cx+Math.cos(angle)*block.w*.2,y:cy+Math.sin(angle)*block.h*.2,
        vx,vy,gravity:spark?65:490,
        life,maxLife:life,size:random(spark?1.2:2.6,spark?2:6.2),color:spark?'#fff2d5':block.flaskTier&&i%4===1?'#29c9f3':palette(color)[i%2],
        rotation:angle,spin:random(-8,8)});
    }
    return {particles,impact:strong?{type:'blockBreak',x:cx,y:cy,life:.28,maxLife:.28,
      radius:Math.min(block.w,block.h)*.46,color}:null};
  }
  function emitRockContact(block, x, y, { nx, ny }, count, ramDamage = 0,
    { strong = false, metal = false, color = '#8b758a', power = .65 } = {}) {
    const particles = [];
    const ram = ramDamage > 0;
    const heavy = ramDamage === 3;
    for (let i = 0; i < count; i += 1) {
      const chip = !ram && !metal && i % 3 === 1;
      const spread = heavy ? random(200, 375) : ram ? random(145, 265) : random(45, strong ? 185 : 150);
      const travel = spread * (i % 2 ? -1 : 1);
      const outward = ram ? random(45, 135) : random(28, strong ? 120 : 90);
      const life = chip ? random(.19, .29) : random(.14, .26);
      particles.push({
        kind: 'debris', shape: chip ? 'shard' : 'spark', x, y, variant: i % 4,
        vx: nx * outward - ny * travel, vy: ny * outward + nx * travel,
        gravity: chip ? 350 : 130, life, maxLife: life,
        size: chip ? random(1.8, 3.2) : ram ? random(1.5, 3) : random(1, 2.25),
        rotation: random(-1, 1), spin: random(-9, 9),
        color: chip ? color : ram ? (i % 3 ? '#e3faff' : '#82dffa') : metal && i % 3 === 0 ? '#ff9b52' : '#fff1cd'
      });
    }
    const life = heavy ? .34 : ram ? .25 : strong ? .245 : .215;
    return { particles, impact: { type: ram ? 'rockSpeedImpact' : 'rockContact', x, y, nx, ny, heavy,
      radius: Math.min(block.w, block.h) * (heavy ? 1.02 : ram ? .58 + .08 * ramDamage : .33 + .13 * power + (strong ? .09 : 0)),
      life, maxLife: life, metal } };
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
  function emitAsh(block, count, face = null) {
    const width = face?.width ?? block.w, height = face?.height ?? block.h;
    const x = (face?.x ?? block.x) + width / 2, y = (face?.y ?? block.y) + height / 2;
    const particles = [];
    for (let i = 0; i < count; i += 1) {
      const ember = i % 6 === 0;
      const chip = !ember && i % 3 !== 2;
      const life = ember ? random(.16, .36) : random(.32, .64);
      const offset = random(-.43, .43);
      particles.push({
        kind: 'debris', shape: ember ? 'ashEmber' : chip ? 'coalChip' : 'ash',
        x: x + offset * width, y: y + random(-.46, .46) * height,
        vx: offset * 132 + random(-26, 26), vy: random(-91, -24), gravity: chip ? 260 : ember ? 22 : 41,
        size: ember ? random(1.4, 2.6) : chip ? random(1.5, 3.8) : random(2.4, 6.6), life, maxLife: life,
        rotation: random(-1, 1), spin: random(-8, 8),
        color: ember ? '#ffd37a' : ashColours[i % ashColours.length]
      });
    }
    return { particles, impact: { type: 'blockAsh', x, y, width, height, sprite: face?.sprite, life: .48, maxLife: .48 } };
  }
  function drawParticle(ctx,p,y) {
    if (p.shape === 'coalChip') {
      const life = p.life / p.maxLife;
      const size = p.size * (.45 + .55 * life);
      ctx.save();
      ctx.translate(p.x, y);
      ctx.rotate(p.rotation + (p.maxLife - p.life) * p.spin);
      ctx.fillStyle = p.color;
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.globalAlpha *= life * .85;
      ctx.fillStyle = '#ff974f';
      ctx.fillRect(-size * .72, -size * .86, size * 1.4, size * .42);
      ctx.restore();
      return;
    }
    if (p.shape === 'ash') {
      const size = p.size * (1 + (1 - p.life / p.maxLife) * .55);
      const dust = ashSprite(p.color);
      ctx.drawImage(dust, p.x - size, y - size * .7, size * 2, size * 1.4);
      return;
    }
    if (p.shape === 'ashEmber') {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.ellipse(p.x, y, p.size * .66, p.size, .22, 0, Math.PI * 2); ctx.fill();
      return;
    }
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
    ctx.fillStyle=p.color;ctx.strokeStyle='#182236bd';ctx.lineWidth=.145;
    ctx.fill(outlines[p.variant]);ctx.stroke(outlines[p.variant]);
    ctx.strokeStyle='#fff5e3c4';ctx.lineWidth=.13;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-.55,-.53);ctx.lineTo(.35,-.72);ctx.stroke();
    ctx.restore();
  }
  function drawImpact(ctx,e,cameraY) {
    const t=1-Math.max(0,e.life/e.maxLife), y=e.y-cameraY;
    if (e.type === 'blockAsh') {
      const shell = Math.max(0, 1 - t / .27);
      if (shell > 0) {
        const art = charForSprite(e.sprite);
        ctx.save();
        ctx.globalAlpha *= shell ** 1.4;
        for (let row = 0; row < 4; row += 1) {
          for (let col = 0; col < 4; col += 1) {
            const drift = (1 - shell) * (.45 + (row * 3 + col * 2) % 5 * .16);
            const w = e.width / 4, h = e.height / 4;
            const px = e.x - e.width / 2 + w * (col + (col - 1.5) * drift * .55);
            const py = y - e.height / 2 + h * (row - drift * (1 + (row + col) % 3 * .42));
            ctx.drawImage(art, col * 16, row * 16, 16, 16, px, py, w * (1 - drift * .23), h * (1 - drift * .23));
          }
        }
        ctx.restore();
      }
      window.SlimeMutationImpacts?.halo(ctx, 'fire', e.x, y, e.width * (1.1 + t), Math.max(0, 1 - t * 4) ** 2 * .63, .7);
      const alpha = (1 - t) ** 1.7 * Math.min(1, .48 + t * 10);
      ctx.globalAlpha *= alpha;
      for (let i = 0; i < 3; i += 1) {
        const spread = (.54 + t * .44) * e.width;
        const rise = y - e.height * (.38 + t * .57 + i * .055);
        const x = e.x + (i - 1) * e.width * (.18 + t * .29);
        ctx.drawImage(ashSprite(ashColours[i]), x - spread, rise, spread * 2, e.height * (.82 + t * .65));
      }
      return;
    }
    ctx.translate(e.x,y);
    if (e.type === 'rockSpeedImpact' || e.type === 'rockContact') {
      const ram = e.type === 'rockSpeedImpact';
      ctx.rotate(Math.atan2(-e.nx, e.ny));
      const width = e.radius * (.49 + t * .84);
      const fade = (1 - t) ** 1.8;
      if (ram) window.SlimeMutationImpacts?.halo(ctx, 'frost', 0, 0, e.radius * 2.7, fade * .85, .48);
      else {
        const flash = Math.max(0, 1 - t * 2.5);
        window.SlimeMutationImpacts?.halo(ctx, e.metal ? 'fire' : 'rock', 0, 0,
          e.radius * (2.8 + t), flash * .86, .65);
      }
      if (e.heavy) {
        const size = e.radius * (1.1 + t * 2);
        window.SlimeMutationImpacts?.halo(ctx, 'rock', 0, e.radius * .18, size, fade * .95, .58);
        ctx.globalAlpha = fade * .67;
        ctx.strokeStyle = '#e3fcff';
        ctx.lineWidth = 1.5 + fade * 2.6;
        ctx.beginPath();
        ctx.ellipse(0, e.radius * t * .27, size * .37, size * .17, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = fade;
      ctx.strokeStyle = ram ? '#bdffff' : e.metal ? '#ffd596' : '#fff2ce';
      ctx.lineWidth = 1 + (1 - t) * (ram ? 5 : 3);
      ctx.lineCap = 'round';
      const sweep = e.radius * t * .34;
      ctx.beginPath();
      ctx.moveTo(-width, sweep);
      ctx.quadraticCurveTo(0, sweep + e.radius * (.27 + t * .24), width, sweep);
      ctx.stroke();
      ctx.globalAlpha = fade * .82;
      ctx.fillStyle = ram ? '#f5ffff' : '#fff9e1';
      ctx.beginPath();
      ctx.ellipse(0, 1, width * .59, Math.max(1, e.radius * (ram ? .20 : .12) * (1 - t)), 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    if(e.type==='essenceCollect'){
      window.SlimeMutationImpacts?.halo(ctx,'frost',0,0,e.radius*2*(.5+t),Math.pow(1-t,2)*.32);
      ctx.globalAlpha=Math.min(1,(1-t)*2.4);
      const pop=1+Math.sin(Math.min(1,t/.2)*Math.PI)*.12;
      ctx.font='1000 25px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
      const textWidth=ctx.measureText(`+${e.value}`).width,dx=textWidth/2+8;
      const fit=Math.min(1,e.radius/.6*.94/(textWidth+36));
      ctx.translate(0,-18-t*40);ctx.scale(fit,pop*fit);
      ctx.fillStyle='#052d4a';ctx.beginPath();ctx.ellipse(3,1,textWidth/2+18,18,0,0,Math.PI*2);ctx.fill();
      ctx.lineWidth=4;ctx.strokeStyle='#031b34';ctx.strokeText(`+${e.value}`,-5,0);
      ctx.fillStyle='#ecffff';ctx.fillText(`+${e.value}`,-5,0);
      const currency = window.SlimeGameAssets?.projectSprite('assets/ui/anomaly-core-v56/currency.webp');
      if (currency?.complete && currency.naturalWidth) ctx.drawImage(currency, dx - 12, -12, 24, 24);
      return;
    }
    window.SlimeMutationImpacts?.halo(ctx, 'rock', 0, 0, e.radius * (1.25 + t * 1.35), (1 - t) ** 2 * .44, .72);
    const split = Math.max(0, (t - .12) / .88);
    const release = 1 - (1 - split) ** 2;
    const fragment = Math.max(0, 1 - t * 1.22);
    const pinch = Math.sin(Math.PI * Math.min(1, t / .28));
    const spread = e.radius * (.30 + .77 * release);
    for (let i = 0; i < 4; i += 1) {
      const sprite = shardSprite(e.color, i);
      if (!sprite) break;
      const sx = i % 2 ? 1 : -1;
      const sy = i < 2 ? -1 : 1;
      const size = e.radius * (.86 + i % 3 * .12) * (.58 + .42 * fragment);
      ctx.save();
      ctx.translate(sx * spread, sy * spread * .83 + e.radius * t * t * .45);
      ctx.rotate(sx * sy * (.12 + release * .78));
      ctx.scale(1 + .19 * pinch, 1 - .23 * pinch);
      ctx.globalAlpha = fragment ** 1.38 * .96;
      ctx.drawImage(sprite, -size, -size, size * 2, size * 2);
      ctx.restore();
    }
  }
  window.SlimeBlockBreakFeedback=Object.freeze({emit,emitRockContact,emitEssence,emitAsh,drawChar,drawParticle,drawImpact});
})();
