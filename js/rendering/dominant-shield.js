(() => {
  'use strict';
  const palettes = Object.freeze({
    base: ['#47dfff', '#dfffff', '#1668b9'],
    fire: ['#ff863d', '#fff1a4', '#c83c27'],
    electric: ['#ffe43f', '#ffffc5', '#d68c16'],
    frost: ['#79d9ff', '#f1ffff', '#3677d7'],
    nano: ['#ff5779', '#ffe8ee', '#842c58'],
    cloning: ['#8de769', '#edffc0', '#318b63'],
    glitch: ['#ec6cdd', '#a1f4ff', '#486bdc'],
    cosmos: ['#b487ff', '#f2e6ff', '#6540b8'],
    telekinesis: ['#dba5ff', '#f9eaff', '#8247c4'],
    phantom: ['#bdcced', '#ffffff', '#667caa']
  });
  const icons = new Map();
  const palette = type => palettes[type] || palettes.base;
  function dominant(levels = {}) {
    let type = 'base', highest = 0;
    for (const key of Object.keys(palettes)) {
      if ((levels[key] || 0) > highest) { highest = levels[key]; type = key; }
    }
    return type;
  }
  function icon(type) {
    if (icons.has(type)) return icons.get(type);
    const [color, light, dark] = palette(type);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="b" cx="32%" cy="25%" r="80%"><stop stop-color="${light}" stop-opacity=".8"/><stop offset=".6" stop-color="${color}" stop-opacity=".5"/><stop offset="1" stop-color="${dark}"/></radialGradient><linearGradient id="s" x2="0" y2="1"><stop stop-color="${light}"/><stop offset=".48" stop-color="${color}"/><stop offset="1" stop-color="${dark}"/></linearGradient></defs><circle cx="50" cy="50" r="43" fill="url(#b)" stroke="${dark}" stroke-width="3"/><circle cx="50" cy="50" r="40" fill="none" stroke="${light}" stroke-width="2"/><path d="M50 26 Q62 33 72 33 L69 56 Q66 69 50 77 Q34 69 31 56 L28 33 Q38 33 50 26Z" fill="url(#s)" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/><path d="M37 38 Q45 36 50 33" stroke="white" stroke-opacity=".85" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M18 37 Q20 24 35 18" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="74" cy="77" rx="6" ry="3" fill="${light}" transform="rotate(-35 74 77)"/></svg>`;
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    icons.set(type, url); return url;
  }
  function bubble(ctx, x, y, radius, type, timestamp, age = 1000) {
    const [color, light, dark] = palette(type);
    const enter = Math.min(1, Math.max(0, age / 210));
    const r = (radius + 13) * (.78 + enter * .22) * (1 + Math.sin(timestamp / 480) * .025);
    ctx.save(); ctx.translate(x, y);
    const fill = ctx.createRadialGradient(-r * .3, -r * .4, r * .12, 0, 0, r);
    fill.addColorStop(0, `${light}35`); fill.addColorStop(.72, `${color}14`);
    fill.addColorStop(.92, `${color}58`); fill.addColorStop(1, `${dark}99`);
    ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, r - 1, 0, Math.PI * 2); ctx.stroke();
    ctx.lineCap = 'round'; ctx.strokeStyle = light; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, r - 4, Math.PI * 1.08, Math.PI * 1.4); ctx.stroke();
    ctx.lineWidth = 2; ctx.globalAlpha = .75;
    ctx.beginPath(); ctx.arc(0, 0, r - 4, .2, .56); ctx.stroke(); ctx.restore();
  }
  function pop(ctx, burst, timestamp, cameraY) {
    const t = Math.min(1, Math.max(0, (timestamp - burst.at) / 520));
    if (t >= 1) return;
    const [color, light] = palette(burst.type), r = burst.radius + 13;
    ctx.save(); ctx.translate(burst.x, burst.y - cameraY);
    const blast = Math.max(0, 1 - t * 3);
    ctx.globalAlpha = blast * .65; ctx.fillStyle = light;
    ctx.beginPath();
    for (let i=0;i<16;i++) {
      const a=i*Math.PI/8, reach=r*(i%2 ? .55+t : 1.05+t*1.8);
      i ? ctx.lineTo(Math.cos(a)*reach,Math.sin(a)*reach) : ctx.moveTo(Math.cos(a)*reach,Math.sin(a)*reach);
    }
    ctx.closePath();ctx.fill();
    ctx.globalAlpha=(1-t)*.8;ctx.strokeStyle=color;ctx.lineWidth=4*(1-t)+.8;
    ctx.beginPath();ctx.arc(0,0,r*(1+t*.85),0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha = (1 - t) * .95; ctx.lineCap = 'round';
    ctx.strokeStyle = light; ctx.lineWidth = 3 * (1 - t) + 1;
    // The membrane separates into curved pieces, then tiny droplets.
    for (let i = 0; i < 7; i++) {
      const a = i * Math.PI * 2 / 7, spread = r * (1 + t * .5);
      ctx.beginPath(); ctx.arc(Math.cos(a) * t * r * .28, Math.sin(a) * t * r * .28,
        spread, a, a + .33 * (1 - t)); ctx.stroke();
      ctx.fillStyle = i % 2 ? color : light;
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * (1 + t * 1.05),
        Math.sin(a) * r * (1 + t * 1.05), 2.4 * (1 - t) + .5, 4 * (1 - t) + .5, a, 0, Math.PI * 2); ctx.fill();
    }
    if (t < .25) {
      ctx.globalAlpha = (1 - t / .25) * .65; ctx.fillStyle = light;
      ctx.beginPath(); ctx.arc(0, 0, r * (1 + t), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  window.DominantShield = Object.freeze({ dominant, palette, icon, bubble, pop });
})();
