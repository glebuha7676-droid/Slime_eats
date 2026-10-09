(() => {
  'use strict';
  const sprites = new Map();
  const haloSprites = new Map(), starSprites = new Map();
  const TAU = Math.PI * 2;
  const STARS = [[-1.10,-.38],[-1.08,.46],[-.48,-1.14],
    [.62,-1.10],[1.12,-.28],[1.06,.52],[-.16,1.10]];

  // The game uses these same positions for both drawing and collision checks.
  function samples({ x, y, radius, level, clock = 0, compact = false, cellSize = radius * 2 }) {
    const count = level >= 2 ? 2 : level >= 1 ? 1 : 0;
    const planets = [];
    for (let index = 0; index < count; index++) {
      const orbit = compact ? radius * (index ? 1.18 : 1.48) : cellSize * (index ? 1 : 2);
      const angle = index ? 2.2 - clock * .00072 : -.45 + clock * .00115;
      const planetRadius = Math.max(compact ? 4 : 5, radius * (compact ? (index ? .18 : .25) : (index ? .28 : .44)));
      planets.push({ index, orbit, angle, radius: planetRadius,
        x: x + Math.cos(angle) * orbit, y: y + Math.sin(angle) * orbit });
    }
    return planets;
  }

  function touches(planet, block) {
    const dx = planet.x - Math.max(block.x, Math.min(block.x + block.w, planet.x));
    const dy = planet.y - Math.max(block.y, Math.min(block.y + block.h, planet.y));
    return dx * dx + dy * dy <= planet.radius * planet.radius;
  }

  function sprite(index) {
    if (sprites.has(index)) return sprites.get(index);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d'), r = 37;
    c.translate(64, 64);
    if (!index) {
      c.save(); c.rotate(-.35);
      c.strokeStyle = '#463080'; c.lineWidth = 10;
      c.beginPath(); c.ellipse(0, 0, 56, 16, 0, Math.PI, TAU); c.stroke();
      c.strokeStyle = '#b8a1ff'; c.lineWidth = 5; c.stroke(); c.restore();
    }
    const body = c.createRadialGradient(-13, -17, 2, 5, 7, 45);
    body.addColorStop(0, index ? '#d4ffff' : '#ffd4ff');
    body.addColorStop(.38, index ? '#64e1f7' : '#bc8bff');
    body.addColorStop(1, index ? '#2878b6' : '#5d3396');
    c.fillStyle = body; c.strokeStyle = index ? '#215677' : '#3d246c'; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
    c.save(); c.clip(); c.rotate(-.23);
    c.strokeStyle = index ? '#208fa980' : '#7e47b88c'; c.lineWidth = 8;
    for (const y of [-9, 12]) {
      c.beginPath(); c.moveTo(-42, y); c.quadraticCurveTo(0, y + 12, 42, y - 2); c.stroke();
    }
    c.restore();
    if (!index) {
      c.save(); c.rotate(-.35); c.strokeStyle = '#e7c6ff'; c.lineWidth = 6;
      c.beginPath(); c.ellipse(0, 0, 56, 16, 0, 0, Math.PI); c.stroke(); c.restore();
    }
    c.strokeStyle = '#ffffffc9'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.arc(-2, -2, 27, Math.PI * 1.08, Math.PI * 1.40); c.stroke();
    sprites.set(index, canvas); return canvas;
  }

  function halo(index) {
    if(haloSprites.has(index))return haloSprites.get(index);
    const c=document.createElement('canvas');c.width=c.height=96;
    const x=c.getContext('2d'),g=x.createRadialGradient(48,48,3,48,48,46);
    g.addColorStop(0,index?'#c8ffffcc':'#f1dcffcc');
    g.addColorStop(.25,index?'#68dbff75':'#c18bff75');g.addColorStop(1,'#a9caff00');
    x.fillStyle=g;x.fillRect(0,0,96,96);haloSprites.set(index,c);return c;
  }
  function starSprite(index){
    if(starSprites.has(index))return starSprites.get(index);
    const c=document.createElement('canvas');c.width=c.height=48;
    const x=c.getContext('2d');x.drawImage(halo(index),0,0,48,48);
    x.fillStyle='#f9ffff';x.shadowColor=index?'#85edff':'#e4aaff';x.shadowBlur=5;
    x.beginPath();x.moveTo(24,6);x.quadraticCurveTo(26,22,42,24);
    x.quadraticCurveTo(26,26,24,42);x.quadraticCurveTo(22,26,6,24);
    x.quadraticCurveTo(22,22,24,6);x.fill();
    starSprites.set(index,c);return c;
  }
  function draw(ctx, state, front = false) {
    const planets = samples(state);
    if (!planets.length || state.alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= state.alpha ?? 1;
    // Fixed, softly twinkling stars frame the slime rather than tracing its orbits.
    for (let index = 0; index < STARS.length; index++) {
      const [ox, oy] = STARS[index];
      if ((oy >= 0) !== front) continue;
      const phase = ((state.clock || 0) / (1950 + index * 130) + index * .31) % 1;
      const twinkle = Math.sin(phase * Math.PI) ** 6;
      const size = Math.max(5, state.radius * (.11 + twinkle * .14));
      ctx.globalAlpha = (state.alpha ?? 1) * (.25 + twinkle * .74);
      ctx.drawImage(starSprite(index % 2), state.x + state.radius * ox - size / 2,
        state.y + state.radius * oy - size / 2, size, size);
    }
    for (const planet of planets) {
      if ((Math.sin(planet.angle) >= 0) !== front) continue;
      const pulse = state.hitUntil?.[planet.index] > (state.timestamp || 0) ? 1.18 : 1;
      const size = planet.radius * 128 / 37 * pulse;
      const aura=planet.radius*(pulse>1?5.4:4.5);
      ctx.globalAlpha=(state.alpha??1)*.65;
      ctx.drawImage(halo(planet.index),planet.x-aura/2,planet.y-aura/2,aura,aura);
      ctx.globalAlpha=state.alpha??1;
      ctx.drawImage(sprite(planet.index), planet.x - size / 2, planet.y - size / 2, size, size);
    }
    ctx.restore();
  }

  window.SlimeCosmosOrbits = Object.freeze({ samples, touches, draw });
})();
