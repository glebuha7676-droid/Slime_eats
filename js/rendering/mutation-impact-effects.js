(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),cache=new Map(),TAU=Math.PI*2;
  const colours={frost:['#ffffff','#9cefff','#279ee9'],ghost:['#effff7','#65efcc','#389ab7'],fire:['#fff9ce','#ffad36','#ef4926'],electric:['#ffffff','#92dbff','#7469ef'],spore:['#faffd4','#b6ed6e','#4da975'],cosmos:['#fffef1','#ffe69b','#a395ed'],rock:['#fffbe8','#e5d8af','#aaa7a0'],anomaly:['#fbecff','#b676ff','#7733d5']};
  function glow(kind='rock'){
    if(cache.has(kind))return cache.get(kind);
    const image=document.createElement('canvas');image.width=image.height=128;
    const c=image.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,63),p=colours[kind]||colours.rock;
    g.addColorStop(0,p[0]+'f5');g.addColorStop(.15,p[0]+'c9');g.addColorStop(.35,p[1]+'8c');g.addColorStop(.66,p[2]+'35');g.addColorStop(1,p[2]+'00');
    c.fillStyle=g;c.fillRect(0,0,128,128);cache.set(kind,image);return image;
  }
  function halo(c,kind,x,y,size,alpha=1,stretch=1){
    if(alpha<=0||size<=0)return;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;c.drawImage(glow(kind),x-size/2,y-size*stretch/2,size,size*stretch);c.restore();
  }
  function burst(c,kind,x,y,size,t,low=false){
    t=clamp(t,0,1);const fade=(1-t)**1.7,spread=1-(1-t)**3;
    halo(c,kind,x,y,size*(.5+spread),fade*.8);
    for(let i=0;i<(low?3:6);i++){const a=i*TAU/(low?3:6)+.27,d=size*spread*(.24+(i%2)*.09),w=size*(.28+t*.2);halo(c,kind,x+Math.cos(a)*d,y+Math.sin(a)*d,w,fade*.5);}
    halo(c,kind,x,y,size*(.2+t*.4),clamp(1-t/.18,0,1)*.85);
  }
  function flake(){return window.SlimeGameAssets.projectSprite('assets/vfx/frost-storm-flake-v1-lossless.webp');}
  function frostTouch(c,e,camera,cell,low=false){
    const t=clamp(1-e.life/e.maxLife,0,1),x=e.x,y=e.y-camera,size=cell*(e.ultimate?3.6:e.type==='frostPulse'?2:e.compact?1.4:1.6);
    burst(c,'frost',x,y,size,t,low);const art=flake();if(!art.complete||!art.naturalWidth)return;c.save();
    for(let i=0;i<(low?3:6);i++){const a=i*TAU/(low?3:6)+.4,d=size*(.12+t*.4),w=cell*(.11+(i%3)*.025)*(1-t*.5);
      c.save();c.translate(x+Math.cos(a)*d,y+Math.sin(a)*d);c.rotate(a+t*(i%2?1:-1));c.globalAlpha=(1-t)**1.2;c.drawImage(art,-w/2,-w/2,w,w);c.restore();}c.restore();
  }
  function freezeBlock(c,b,sy,at){
    if(!b.frostTransformStartedAt)return;const t=clamp((at-b.frostTransformStartedAt)/(b.frostTransformDuration||470),0,1);if(t>=1)return;
    const w=b.w,h=b.h;c.save();c.beginPath();c.rect(b.x+1,sy+1,w-2,h-2);c.clip();halo(c,'frost',b.x+w/2,sy+h*(1-t),w*1.25,Math.sin(t*Math.PI)*.65,.4);
    const art=flake();if(art.complete&&art.naturalWidth)for(let i=0;i<3;i++){const x=b.x+w*(.2+i*.3),y=sy+h*((i*.27+.2)%1),appear=clamp((t-i*.12)*5,0,1),size=w*.17;c.globalAlpha=appear*(1-t)*.85;c.drawImage(art,x-size/2,y-size/2,size,size);}c.restore();
  }
  function ribbon(seed){
    const variant=Math.abs(Math.floor(seed))%6,key='bolt'+variant;if(cache.has(key))return cache.get(key);
    const image=document.createElement('canvas');image.width=256;image.height=64;const c=image.getContext('2d'),points=[];
    for(let i=0;i<=14;i++)points.push([i/14*256,32+(i===0||i===14?0:Math.sin(i*7.13+variant)*11)]);
    const path=()=>{c.beginPath();for(let i=0;i<points.length;i++)i?c.lineTo(...points[i]):c.moveTo(...points[i]);};c.lineCap=c.lineJoin='round';
    for(const [width,col,alpha]of [[20,'#8275fa',.14],[10,'#60bdff',.28],[4,'#b1efff',.92],[1.5,'#ffffff',1]]){c.globalAlpha=alpha;c.strokeStyle=col;c.lineWidth=width;path();c.stroke();}
    c.globalAlpha=.75;c.lineWidth=1;c.strokeStyle='#d6f8ff';for(const i of [4,9]){c.beginPath();c.moveTo(...points[i]);c.lineTo(points[i][0]+17,points[i][1]-16);c.lineTo(points[i][0]+26,points[i][1]-12);c.stroke();}cache.set(key,image);return image;
  }
  function electricChain(c,e,camera,cell){
    const points=e.points||[],age=(e.maxLife-e.life)*1000;
    for(let i=1;i<points.length;i++){const elapsed=age-(i-1)*80;if(elapsed<0)continue;
      const t=clamp(elapsed/75,0,1),fade=clamp(1-Math.max(0,elapsed-130)/420,0,1);if(!fade)continue;
      const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),art=ribbon((e.seed||0)+i),height=cell*.55;
      c.save();c.translate(a.x,a.y-camera);c.rotate(Math.atan2(dy,dx));c.globalAlpha=fade*(.86+.14*Math.sin(elapsed/18+i));if(t>0)c.drawImage(art,0,0,256*t,64,0,-height/2,len*t,height);c.restore();halo(c,'electric',a.x+dx*t,a.y+dy*t-camera,cell*.62,fade*.6);
    }
  }
  function electricDischarge(c, x, y, toX, toY, width, sway, seed, opacity = 1) {
    const dx = toX - x, dy = toY - y, length = Math.hypot(dx, dy);
    if (length < 1 || opacity <= 0) return;
    const segments = clamp(Math.ceil(length / 15), 3, 33);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= opacity;
    c.lineJoin = c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y);
    for (let i = 1; i < segments; i += 1) {
      const f = i / segments;
      const offset = (Math.sin(i * i * 1.63 + seed) * .63 + Math.sin(f * 24 + seed * .67) * .37)
        * sway * Math.sin(f * Math.PI) ** .5;
      c.lineTo(x + dx * f - dy / length * offset, y + dy * f + dx / length * offset);
    }
    c.lineTo(toX, toY);
    for (const [size, color] of [[6.4, '#5a52eb1f'], [3.2, '#448aff55'], [1.5, '#81e6ffc0'], [1, '#f4ffff']]) {
      c.lineWidth = width * size;
      c.strokeStyle = color;
      c.stroke();
    }
    c.restore();
  }
  function electricShock(c, x, y, w, h, age, power, seed, reduced = false) {
    const t = age / 400;
    if (t < 0 || t >= 1) return;
    const fade = (1 - clamp((age - 65) / 335, 0, 1)) ** 1.85;
    const flash = 1 - clamp(age / 82, 0, 1);
    const flicker = reduced ? 1 : .81 + .19 * Math.cos(age / 24);
    const side = Math.sin(seed * 17.21) > 0 ? 1 : -1;
    const px = u => x + u * w * side;
    const py = v => y + v * h;
    halo(c, 'electric', x, y, w * 1.52, fade * power * (.28 + flash * .16), .92);
    c.save();
    c.beginPath();
    c.roundRect(px(0) - w * .48, py(-.48), w * .96, h * .96, w * .115);
    c.globalAlpha = fade * (reduced ? .69 : .82);
    c.fillStyle = '#061435';
    c.fill();
    c.lineWidth = Math.max(1.3, w * .042);
    c.strokeStyle = '#77ceff';
    c.stroke();
    c.clip();
    halo(c, 'electric', x, y, w * 1.17, fade * (.23 + flash * .28));
    c.globalAlpha = fade * .48;
    c.beginPath();
    c.roundRect(x - w * .40, y - h * .40, w * .80, h * .80, w * .09);
    c.strokeStyle = '#77c6ff';
    c.lineWidth = 1;
    c.stroke();
    const joints = [[-.41, .31, -.09, .06], [-.09, .06, .14, -.12], [.14, -.12, .43, -.39],
      [-.09, .06, -.29, -.35], [.14, -.12, .40, .30]];
    c.globalAlpha = 1;
    for (let i = 0; i < joints.length; i += 1) {
      const [u, v, endU, endV] = joints[i];
      electricDischarge(c, px(u), py(v), px(endU), py(endV), (i < 3 ? 1.46 : .91) * (1 + flash * .36),
        w * .10, seed + i * 8.9 + (reduced ? 0 : Math.floor(age / 66) * .65), fade * flicker * (i < 3 ? 1 : .78));
    }
    halo(c, 'electric', px(.14), py(-.12), w * .44, fade * (.32 + flash * .35));
    c.restore();
    if (reduced) return;
    for (let i = 0; i < 3; i += 1) {
      const angle = seed + i * 2.39996;
      const px = x + Math.cos(angle) * w * (.37 + t * .38);
      const py = y + Math.sin(angle) * h * (.36 + t * .36);
      halo(c, 'electric', px, py, 6 + i * 2, fade * power * .63);
    }
  }
  function electricHit(c, b, sy, at, reduced) {
    electricShock(c, b.x + b.w / 2, sy + b.h / 2, b.w, b.h,
      at - b.electricFlashStartedAt, b.electricShockPower || 1, b.col * 1.7 + b.row * .4, reduced);
  }
  function frostShard(c,e,camera,cell){
    const t=clamp(1-e.life/e.maxLife,0,1),art=flake(),flight=1-(1-t)**1.48;
    const point=f=>({x:e.x+((e.toX??e.x)-e.x)*f,y:e.y+((e.toY??e.y)-e.y)*f-Math.sin(f*Math.PI)*34-camera});
    const q=point(flight);for(let i=3;i>0;i--){const p=point(Math.max(0,flight-i*.045));halo(c,'frost',p.x,p.y,cell*.19,(1-t)*(.35-i*.07));}
    if(art.complete&&art.naturalWidth){const size=cell*.2;c.save();c.translate(q.x,q.y);c.rotate(t*Math.PI*4);c.globalAlpha=(1-t)**.65;c.drawImage(art,-size/2,-size/2,size,size);c.restore();}
  }
  function sporeMist() {
    if (cache.has('sporeMist')) return cache.get('sporeMist');
    const image = document.createElement('canvas');
    image.width = image.height = 128;
    const c = image.getContext('2d');
    const gradient = c.createRadialGradient(64, 64, 0, 64, 64, 62);
    gradient.addColorStop(0, '#f1ffc2f5');
    gradient.addColorStop(.28, '#ddf6a4e6');
    gradient.addColorStop(.56, '#a8d972b8');
    gradient.addColorStop(.80, '#79ae4d3a');
    gradient.addColorStop(1, '#6c9d4300');
    c.fillStyle = gradient;
    c.fillRect(0, 0, 128, 128);
    cache.set('sporeMist', image);
    return image;
  }

  function spores(c, burst, camera, cell, at, low = false, front = false) {
    const cast = burst.kind === 'cast';
    const puff = burst.kind === 'puff';
    const duration = puff ? 340 : burst.kind === 'break' ? 520 : 680;
    const age = at - burst.startedAt;
    if (age < 0 || age >= duration || (front && (!cast || age > 265))) return;
    const tier = burst.tier ?? 1;
    const size = cell * (burst.scale ?? 1);
    const x = burst.x;
    const y = burst.y - camera;
    const t = age / duration;
    const spread = 1 - (1 - t) ** 3;
    const fade = (1 - t) ** 1.5;
    const radius = size * (.49 + spread * 1.31);
    const flash = (1 - clamp(age / (85 + tier * 23), 0, 1)) ** 2;
    const mist = sporeMist();
    c.save();

    if (front) {
      const veil = (1 - age / 265) ** 1.6 * (.34 + tier * .07);
      const width = radius * (1.34 + spread * .36);
      const alpha = c.globalAlpha;
      c.globalAlpha = alpha * veil * .57;
      c.drawImage(mist, x - width * .70, y - width * .13, width * .78, width * .65);
      c.drawImage(mist, x - width * .05, y - width * .07, width * .75, width * .56);
      c.globalAlpha = alpha * veil;
      c.drawImage(mist, x - width * .52, y - width * .12, width * 1.04, width * .67);
      c.restore();
      return;
    }

    // Keep the cloud filled while the edge rolls outward. All stamps fade to
    // transparent before their bounds, so overlaps leave no cut lines.
    const alpha = c.globalAlpha;
    c.globalAlpha = alpha * fade * (puff ? .55 : .78);
    c.drawImage(mist, x - radius, y - radius * .88, 2 * radius, 1.76 * radius);
    const count = puff ? 3 : low ? 5 : 6 + tier * 2;
    const seed = (x * .081 + burst.y * .029) % TAU;
    for (let i = 0; i < count; i += 1) {
      const angle = seed + i * 2.4 + spread * Math.sin(i * 1.9) * .24;
      const travel = radius * (.27 + (i * .37 % 1) * .56) * (.38 + spread * .62);
      const width = radius * (.66 + (i * .29 % 1) * .70);
      const px = x + Math.cos(angle) * travel;
      const py = y + Math.sin(angle) * travel * .78 - spread * radius * .13;
      c.globalAlpha = alpha * fade * (1 - t * .34) * (.26 + (i % 3) * .065);
      c.drawImage(mist, px - width * .5, py - width * .40, width, width * .80);
    }
    c.globalAlpha = alpha * fade * .42;
    c.drawImage(mist, x - radius * .62, y - radius * .53, radius * 1.24, radius * 1.06);
    c.restore();
    if (puff) return;
    halo(c, 'spore', x, y, radius * 1.9, fade * (.26 + tier * .065), .86);
    if (cast && tier > 1) {
      const edgeLight = Math.sin(Math.PI * t) * fade * (.3 + tier * .09);
      for (let i = 0; i < (low ? 2 : tier + 1); i += 1) {
        const angle = seed + i * 2.4;
        const drift = radius * (.38 + .28 * spread + .08 * (i % 2));
        halo(c, 'spore', x + Math.cos(angle) * drift, y + Math.sin(angle) * drift * .74,
          radius * (.68 + .15 * (i % 3)), edgeLight, .80);
      }
    }
    halo(c, 'spore', x, y, size * (1.08 + spread * .74), flash * (.5 + tier * .12), .94);
  }
  function starTrail(c,image,star,at,point,camera,cell,low=false){
    const q=point(star,at),prev=point(star,Math.max(star.launchAt,at-110)),dx=q.x-prev.x,dy=q.y-prev.y;
    c.save();c.translate(q.x,q.y-camera);c.rotate(Math.atan2(dy,dx)-Math.PI/2);for(let i=(low?3:6);i>=1;i--)halo(c,'cosmos',0,-cell*(i*.13),cell*(.44-i*.035),.12+(6-i)*.045,1.7);c.restore();halo(c,'cosmos',q.x,q.y-camera,cell*.85,.48);
    if(image.complete&&image.naturalWidth)for(let i=0;i<(low?1:3);i++){const tail=point(star,Math.max(star.launchAt,at-70-i*48)),size=cell*.07;c.save();c.globalAlpha=.5-i*.12;c.translate(tail.x+Math.sin(star.index+i*2)*cell*.12,tail.y-camera);c.rotate(at*.005+i);c.drawImage(image,-size/2,-size/2,size,size);c.restore();}
  }
  function starImpact(c,image,b,camera,cell,at,low=false){
    const t=clamp((at-b.at)/420,0,1);burst(c,'cosmos',b.x,b.y-camera,cell*1.7,t,low);if(!image.complete||!image.naturalWidth)return;c.save();
    for(let i=0;i<(low?3:6);i++){const a=i*TAU/(low?3:6)+b.index,d=cell*(.12+t*.85),w=cell*(.16-.09*t);c.save();c.translate(b.x+Math.cos(a)*d,b.y-camera+Math.sin(a)*d);c.rotate(a+t*3);c.globalAlpha=(1-t)**1.2;c.drawImage(image,-w/2,-w/2,w,w);c.restore();}c.restore();
  }
  window.SlimeMutationImpacts=Object.freeze({halo,burst,frostTouch,freezeBlock,electricChain,electricDischarge,electricShock,electricHit,frostShard,spores,starTrail,starImpact});
})();
