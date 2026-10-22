(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const center = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const mix = (a, b, t) => a + (b - a) * t;
  const TAU = Math.PI * 2;
  const cache = new Map();
  const ROCK = 'assets/vfx/fire-volcano-rock-v1.webp';
  const SNOW = 'assets/vfx/frost-snowball-v2.webp';
  const FLAKE = 'assets/vfx/frost-storm-flake-v1-lossless.webp';

  // One small raster per colour, shared by all particles. No live canvas blur filters.
  function glow(colour) {
    if (cache.has(colour)) return cache.get(colour);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    const colours = {
      fire: ['255,255,218', '255,198,49', '255,78,8'],
      frost: ['255,255,255', '173,248,255', '59,168,255'],
      electric: ['255,255,255', '202,230,255', '105,103,255']
    }[colour];
    g.addColorStop(0, `rgba(${colours[0]},1)`);
    g.addColorStop(.14, `rgba(${colours[0]},.96)`);
    g.addColorStop(.34, `rgba(${colours[1]},.8)`);
    g.addColorStop(.62, `rgba(${colours[2]},.29)`);
    g.addColorStop(1, `rgba(${colours[2]},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 128, 128); cache.set(colour, canvas); return canvas;
  }
  function sprite(source) { return window.SlimeGameAssets.projectSprite(source); }
  function snowDust() {
    if(cache.has('snowDust'))return cache.get('snowDust');
    const image=document.createElement('canvas');image.width=image.height=64;
    const c=image.getContext('2d'),g=c.createRadialGradient(32,32,0,32,32,30);
    g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.45,'rgba(228,242,255,.58)');g.addColorStop(1,'rgba(228,242,255,0)');
    c.fillStyle=g;c.fillRect(0,0,64,64);cache.set('snowDust',image);return image;
  }
  function lightningBall() {
    if(cache.has('ball'))return cache.get('ball');
    const image=document.createElement('canvas');image.width=image.height=128;
    const c=image.getContext('2d'),g=c.createRadialGradient(52,46,3,64,64,62);
    g.addColorStop(0,'#ffffff');g.addColorStop(.2,'#e0ffff');g.addColorStop(.5,'#79ceff');
    g.addColorStop(.76,'#6860e9');g.addColorStop(.86,'#c1d9ff');g.addColorStop(1,'rgba(124,139,255,0)');
    c.fillStyle=g;c.fillRect(0,0,128,128);cache.set('ball',image);return image;
  }
  function light(c, colour, x, y, size, alpha = 1, stretch = 1) {
    if (alpha <= 0 || size <= 0) return;
    c.globalAlpha = alpha; c.drawImage(glow(colour), x - size / 2, y - size * stretch / 2, size, size * stretch);
  }
  function area(run, s, x, y, radius, at, ice) {
    for (const b of s.blocksNearY(y, radius + run.cellSize)) {
      if (!(ice ? s.frostFreezable(b) : s.elementalDamageable(b))) continue;
      // Circle against the actual block rectangle includes blocks touching the flash edge.
      const dx = x - clamp(x, b.x, b.x + b.w), dy = y - clamp(y, b.y, b.y + b.h);
      if (dx * dx + dy * dy <= radius * radius) {
        if (ice) s.turnBlockToSnow(b, at, true); else s.igniteBlock(b, at, run.elementalAuraId);
      }
    }
  }
  function bolt(from, to, at, seed = 0) { return { from, to, at, seed }; }
  function updateDischarge(run,e,at,s){
    const p=run.ultimateProfile,reach=run.cellSize*p.reachCells;
    const front=reach*clamp((at-e.startedAt)/p.growMs,0,1);
    for(const target of e.dischargeTargets){
      if(target.distance>front+1e-5||e.hitAt.has(target.block))continue;
      e.hitAt.set(target.block,at);
      if(!s.elementalDamageable(target.block))continue;
      s.damageBlockByElement(target.block,1,'electric',at);
      e.bursts.push({...center(target.block),at});
    }
  }
  function start(run, type, at, x, y, s) {
    const p = run.ultimateProfile;
    if (!p || p.stage >= 3 || !['fire', 'frost', 'electric'].includes(type)) return false;
    const cell = run.cellSize;
    const e = run.stagedUltimate = {
      kind: p.kind, type, startedAt: at, lastAt: at, x, y, originY: y,
      lastY: y, endY: y + (p.rows || 0) * cell, bolts: [], bursts: [], trail: [], nextStrikeAt: at,
      hitAt: new Map(), rocks: []
    };
    if (p.kind === 'fireFlash' || p.kind === 'frostFlash') area(run, s, x, y, cell * 1.85, at, type === 'frost');
    if (p.kind === 'volcano') {
      sprite(ROCK);
      const left = run.gridOffsetX + cell * .5, right = run.gridOffsetX + (run.columns - .5) * cell;
      // Staggered launches, four separate arcs; every rock starts at the slime.
      e.rocks = [-1.9, -.65, .65, 1.9].map((offset, i) => ({
        delay: i * 110, flightMs: 1220 + (i % 2) * 90,
        fromX: x, fromY: y - run.slime.radius * (run.categoryVisuals?.fire >= 3 ? 1.65 : .89), toX: clamp(x + offset * cell, left, right),
        toY: y + (3.6 + (i % 2) * 1.25) * cell,
        x, y, launched: false, landed: false, trail: [], seed: i
      }));
    }
    if (p.kind === 'snowball') {
      sprite(SNOW);
      e.col = clamp(Math.floor((x - run.gridOffsetX) / cell), 1, run.columns - 2);
      e.x = run.gridOffsetX + (e.col + .5) * cell;
      e.frozenRows = new Set();
    }
    if (p.kind === 'discharge') {
      const reach = p.reachCells * cell;
      e.bolts = [[0,-1], [1,0], [0,1], [-1,0]].map(([dx,dy], i) => ({...bolt({ x,y }, { x:x+dx*reach, y:y+dy*reach }, at, i),growMs:p.growMs}));
      e.dischargeTargets=[];
      for (const b of s.blocksNearY(y, reach + cell)) {
        if (!s.elementalDamageable(b)) continue;
        const q = center(b), dx = Math.abs(q.x-x), dy = Math.abs(q.y-y);
        if ((dx < cell*.48 && dy <= reach+1e-5) || (dy < cell*.48 && dx <= reach+1e-5)) e.dischargeTargets.push({block:b,distance:Math.max(dx,dy)});
      }
      updateDischarge(run,e,at,s);
    }
    return true;
  }
  function update(run, at, s) {
    const e = run.stagedUltimate;
    if (!e) return;
    const p = run.ultimateProfile, cell = run.cellSize, elapsed = at - e.startedAt;
    e.bursts = e.bursts.filter(b => at - b.at < (e.kind === 'discharge' ? 220 : 600));
    e.bolts = e.bolts.filter(b => at - b.at < (e.kind === 'discharge' ? 600 : 190));
    if (e.kind === 'discharge') {
      updateDischarge(run,e,at,s);
    } else if (e.kind === 'volcano') {
      for (const rock of e.rocks) {
        const t = clamp((elapsed-rock.delay)/rock.flightMs, 0, 1);
        if (elapsed < rock.delay || rock.landed) continue;
        if (!rock.launched) {
          rock.launched = true;
          rock.fromX = run.slime.x - run.slime.radius * .015;
          rock.fromY = run.slime.y - run.slime.radius * (run.categoryVisuals?.fire >= 3 ? 1.65 : .89);
        }
        rock.x = mix(rock.fromX, rock.toX, t);
        // Cubic controls send the stone vertically up first, then down from above.
        const a = 1-t;
        rock.y = a*a*a*rock.fromY + 3*a*a*t*(rock.fromY-cell*4.4) + 3*a*t*t*(rock.toY-cell*5.1) + t*t*t*rock.toY;
        if (at-e.lastAt >= 24) { rock.trail.push({x:rock.x,y:rock.y}); if (rock.trail.length > 6) rock.trail.shift(); }
        if (t >= 1) {
          rock.landed = true;
          area(run, s, rock.toX, rock.toY, cell*1.25, at, false);
          e.bursts.push({x:rock.toX,y:rock.toY,at});
        }
      }
    } else if (e.kind === 'snowball' || e.kind === 'ballLightning') {
      const t = clamp(elapsed / p.travelMs, 0, 1);
      e.y = mix(e.originY, e.endY, t);
      if (e.kind === 'snowball') {
        // Sweep all crossed rows even on a slow frame; exactly three columns, seven rows / 50 m.
        for (const b of s.blocksNearY((e.lastY+e.y)/2, (e.y-e.lastY)/2+cell)) {
          const q = center(b);
          if (q.y <= e.originY || q.y > e.endY || q.y > e.y || Math.abs(b.col-e.col)>1 || e.frozenRows.has(b.row)) continue;
          if (s.frostFreezable(b)) s.turnBlockToSnow(b, at, true);
        }
        const first = Math.floor((e.originY-run.blockRowOrigin-cell*.5)/cell)+1;
        const last = Math.floor((e.y-run.blockRowOrigin-cell*.5)/cell);
        for (let row=first;row<=last;row++) e.frozenRows.add(row);
      } else if (at >= e.nextStrikeAt && elapsed <= p.travelMs) {
        // One pulse per update, never an accumulated burst after a stall.
        e.nextStrikeAt = at + p.strikeIntervalMs;
        const candidates = s.blocksNearY(e.y, cell*2.15).filter(b => {
          if (!s.elementalDamageable(b) || at-(e.hitAt.get(b) ?? -Infinity)<(p.targetCooldownMs||650)) return false;
          const q = center(b); return Math.hypot(q.x-e.x,q.y-e.y)<=cell*2.15;
        }).sort((a,b)=> {
          const ac=center(a),bc=center(b);
          return Math.hypot(ac.x-e.x,ac.y-e.y)-Math.hypot(bc.x-e.x,bc.y-e.y);
        });
        candidates.slice(0,2).forEach((b,i)=> {
          e.bolts.push({...bolt({x:e.x,y:e.y},center(b),at,i+elapsed),power:1.25});
          e.hitAt.set(b,at); s.damageBlockByElement(b,p.damage||1,'electric',at);
        });
      }
      e.lastY=e.y;
      if (at-e.lastAt>=24 && t<1) { e.trail.push({x:e.x,y:e.y,at}); if(e.trail.length>8)e.trail.shift(); }
    }
    if(at-e.lastAt>=24)e.lastAt=at;
    if (elapsed >= p.durationMs) run.stagedUltimate = null;
  }
  function shiftClock(run, delta) {
    const e = run.stagedUltimate; if(!e)return;
    for(const key of ['startedAt','lastAt','nextStrikeAt'])e[key]+=delta;
    for(const item of [...e.bolts,...e.bursts,...e.trail])if(item.at!==undefined)item.at+=delta;
    for(const [b,at]of e.hitAt)e.hitAt.set(b,at+delta);
  }
  function drawBolt(c, b, camera, at, cell, life) {
    const alpha=clamp(1-Math.max(0,at-b.at-(b.growMs||0))/(life-(b.growMs||0)),0,1); if(!alpha)return;
    const dx=b.to.x-b.from.x,dy=b.to.y-b.from.y,len=Math.hypot(dx,dy)||1;
    const segments=Math.max(3,Math.ceil(len/(cell*.23)));
    if(!b.path){
      b.path=[];
      for(let i=0;i<=segments;i++){
        const t=i/segments,offset=i===0||i===segments?0:Math.sin(i*9.73+b.seed)*cell*.12;
        b.path.push([b.from.x+dx*t-dy/len*offset,b.from.y+dy*t+dx/len*offset]);
      }
    }
    const progress=b.growMs?clamp((at-b.at)/b.growMs,0,1):1;
    if(progress<=0)return;
    const last=progress*segments,whole=Math.floor(last);
    const path=()=>{
      c.beginPath();c.moveTo(b.path[0][0],b.path[0][1]-camera);
      for(let i=1;i<=whole;i++)c.lineTo(b.path[i][0],b.path[i][1]-camera);
      if(whole<segments){const a=b.path[whole],z=b.path[whole+1],t=last-whole;c.lineTo(mix(a[0],z[0],t),mix(a[1],z[1],t)-camera);}
    };
    c.lineJoin=c.lineCap='round';
    for(const [width,colour,a]of [[12,'#8878ff',.16],[5,'#76beff',.65],[1.7,'#f7ffff',1]]){
      c.strokeStyle=colour;c.globalAlpha=alpha*a;c.lineWidth=width*(b.power||1);path();c.stroke();
    }
    if(b.growMs&&progress<1)light(c,'electric',b.from.x+dx*progress,b.from.y+dy*progress-camera,cell*.7,alpha);
  }
  function transferFlame(){
    if(cache.has('transferFlame'))return cache.get('transferFlame');
    const image=document.createElement('canvas');image.width=image.height=96;
    const c=image.getContext('2d');c.translate(48,63);
    c.drawImage(glow('fire'),-46,-63,92,92);
    // Paint once into a shared raster. Live effects only transform and blend it.
    const flame=(scale,colour)=>{
      c.save();c.scale(scale,scale);c.fillStyle=colour;c.beginPath();c.moveTo(0,17);
      c.bezierCurveTo(-27,15,-25,-12,-12,-24);c.bezierCurveTo(-7,-13,-5,-31,3,-47);
      c.bezierCurveTo(7,-29,27,-21,23,0);c.bezierCurveTo(20,14,9,18,0,17);c.fill();c.restore();
    };
    flame(1,'#ff6b12');flame(.72,'#ffd33d');flame(.42,'#fff8d4');
    cache.set('transferFlame',image);return image;
  }
  function drawFireTransfer(c,e,camera,cell,lowPower=false){
    const age=(e.maxLife-e.life)*1000,travel=e.travelMs||220,t=clamp(age/travel,0,1);
    const controlX=(e.fromX+e.x)/2,controlY=(e.fromY+e.y)/2-cell*.22;
    const point=t=>({x:(1-t)**2*e.fromX+2*(1-t)*t*controlX+t*t*e.x,
      y:(1-t)**2*e.fromY+2*(1-t)*t*controlY+t*t*e.y});
    c.save();c.globalCompositeOperation='lighter';
    if(t<1){
      const tail=lowPower?3:5;
      for(let i=tail;i>0;i--){const q=point(Math.max(0,t-i*.075));light(c,'fire',q.x,q.y-camera,cell*(.17+(tail-i)*.045),(.1+(tail-i)*.045)*Math.min(1,t*5));}
      const q=point(t);light(c,'fire',q.x,q.y-camera,cell*.85,.8);
      c.globalCompositeOperation='source-over';c.globalAlpha=1;c.translate(q.x,q.y-camera);
      c.rotate(Math.atan2((1-t)*(controlY-e.fromY)+t*(e.y-controlY),(1-t)*(controlX-e.fromX)+t*(e.x-controlX))+Math.PI/2);
      const size=cell*.58;c.drawImage(transferFlame(),-size/2,-size*.66,size,size);
    }else{
      const fade=clamp(1-(age-travel)/300,0,1);
      light(c,'fire',e.x,e.y-camera,cell*(1.3+(1-fade)*.5),fade*fade*.95);
      for(let i=0;i<(lowPower?3:5);i++){
        const a=i*TAU/5-.5,r=cell*(.12+(1-fade)*.42);
        light(c,'fire',e.x+Math.cos(a)*r,e.y-camera+Math.sin(a)*r,cell*.16*fade,fade*.75);
      }
    }
    c.restore();
  }
  function drawFlash(c,e,run,at) {
    const t=clamp((at-e.startedAt)/(e.kind==='frostFlash'?850:800),0,1),cell=run.cellSize;
    const fade=Math.pow(1-t,1.8),size=cell*(1.1+4.7*Math.sqrt(t)),y=e.y-run.cameraY;
    c.globalCompositeOperation='lighter';
    light(c,e.type,e.x,y,size,fade*.95);
    light(c,e.type,e.x,y,size*1.2,fade*.5,.55);
    for(let i=0;i<12;i++){
      const a=i*TAU/12+.12*Math.sin(i*3),r=cell*1.85*Math.sin(t*Math.PI*.5);
      light(c,e.type,e.x+Math.cos(a)*r,y+Math.sin(a)*r,cell*(.55+.35*Math.sin(i*7))*fade,fade*.75,e.type==='fire'?1.8:1);
    }
    if(e.type==='frost'){
      const image=sprite(FLAKE);c.globalCompositeOperation='source-over';
      if(image.complete&&image.naturalWidth)for(let i=0;i<8;i++){
        const a=i*TAU/8,r=cell*1.85*Math.sqrt(t),size=cell*.3*(1-t*.5);
        c.globalAlpha=fade*.85;c.save();c.translate(e.x+Math.cos(a)*r,y+Math.sin(a)*r);c.rotate(a+t);
        c.drawImage(image,-size/2,-size/2,size,size);c.restore();
      }
    }
  }
  function drawSnow(c,e,run,at) {
    const p=run.ultimateProfile,alpha=clamp((p.durationMs-(at-e.startedAt))/250,0,1);
    if(!alpha)return;
    const cell=run.cellSize,r=cell*1.38,x=e.x,y=e.y-run.cameraY;
    c.globalCompositeOperation='source-over';
    e.trail.forEach((q,i)=>{
      const age=clamp((at-q.at)/360,0,1),size=r*(.32+age*.4);
      c.globalAlpha=alpha*(1-age)*.65;
      c.drawImage(snowDust(),q.x+(i%2?-.45:.45)*r-size/2,q.y-run.cameraY-r*.55-size/2,size,size);
    });
    c.save();c.translate(x,y);c.rotate((e.y-e.originY)/r);c.globalAlpha=alpha;
    const image=sprite(SNOW);if(image.complete&&image.naturalWidth)c.drawImage(image,-r,-r,r*2,r*2);
    c.restore();
  }
  function draw(c,run,at) {
    const e=run.stagedUltimate;if(!e)return;
    const cell=run.cellSize,camera=run.cameraY,elapsed=at-e.startedAt;
    c.save();
    if(e.kind==='fireFlash'||e.kind==='frostFlash')drawFlash(c,e,run,at);
    if(e.kind==='snowball')drawSnow(c,e,run,at);
    if(e.kind==='volcano'){
      const image=sprite(ROCK);
      for(const rock of e.rocks){
        if(elapsed<rock.delay||rock.landed)continue;
        c.globalCompositeOperation='lighter';
        rock.trail.forEach((q,i)=>light(c,'fire',q.x,q.y-camera,cell*.65,(i+1)/6*.48));
        light(c,'fire',rock.x,rock.y-camera,cell*1.65,.65);
        c.globalCompositeOperation='source-over';c.globalAlpha=1;
        c.save();c.translate(rock.x,rock.y-camera);c.rotate(Math.sin((elapsed-rock.delay)/400+rock.seed)*.22);
        if(image.complete&&image.naturalWidth)c.drawImage(image,-cell*.44,-cell*.5,cell*.88,cell*.88);c.restore();
      }
      c.globalCompositeOperation='lighter';
      for(const burst of e.bursts){const t=(at-burst.at)/600;light(c,'fire',burst.x,burst.y-camera,cell*(1.3+3*t),(1-t)**2);}
    }
    if(e.kind==='ballLightning'){
      const alpha=clamp((run.ultimateProfile.durationMs-elapsed)/350,0,1),x=e.x,y=e.y-camera;
      c.globalCompositeOperation='lighter';
      e.trail.forEach((q,i)=>light(c,'electric',q.x,q.y-camera,cell*.9,alpha*(i+1)/8*.25));
      light(c,'electric',x,y,cell*1.9,alpha*.9);
      c.globalCompositeOperation='source-over';c.globalAlpha=alpha;
      c.drawImage(lightningBall(),x-cell*.46,y-cell*.46,cell*.92,cell*.92);
      c.globalCompositeOperation='lighter';
      // Short orbiting arcs belong to the ball, distinct from the aimed strikes.
      for(let i=0;i<3;i++){
        const a=elapsed/270+i*TAU/3;
        drawBolt(c,bolt({x:x+Math.cos(a)*cell*.28,y:e.y+Math.sin(a)*cell*.28},{x:x+Math.cos(a+.8)*cell*.5,y:e.y+Math.sin(a+.8)*cell*.5},at,i),camera,at,cell,190);
      }
    }
    c.globalCompositeOperation='lighter';
    if(e.kind==='discharge'){
      light(c,'electric',e.x,e.y-camera,cell*(1.4+elapsed/450),Math.max(0,1-elapsed/500));
      for(const burst of e.bursts)light(c,'electric',burst.x,burst.y-camera,cell*.85,Math.max(0,1-(at-burst.at)/220)*.7);
    }
    for(const b of e.bolts)drawBolt(c,b,camera,at,cell,e.kind==='discharge'?600:190);
    c.restore();
  }
  window.SlimeElementalUltimates=Object.freeze({start,update,draw,drawFireTransfer,shiftClock});
})();
