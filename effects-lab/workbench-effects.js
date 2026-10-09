(() => {
  'use strict';

  // The hooks use avatar coordinates, ready for the game's renderer later.
  const assets = {};
  const sources = new Map();
  const loads = new WeakMap();
  for (const [key, file] of Object.entries({
    psionicsAntennae: 'psionics-antennae-v1-lossless.webp',
    psionicsAntennaeUltra: 'psionics-antennae-ultra-v1-lossless.webp'
  })) {
    const image = new Image();
    sources.set(image, `effects-lab/assets/${file}`);
    assets[key] = image;
  }
  assets.nanoDrone = new Image();
  sources.set(assets.nanoDrone, 'effects-lab/assets/techno-drone-red-v1.webp');
  const glitchPixelCanvas = document.createElement('canvas');
  const glitchPixelCtx = glitchPixelCanvas.getContext('2d');
  let frostBottomLayer = null;
  const frostBodyImage = new Image();
  frostBodyImage.onload = () => {
    const layer = document.createElement('canvas');
    layer.width = layer.height = 512;
    const layerCtx = layer.getContext('2d');
    layerCtx.drawImage(frostBodyImage, 0, 0, 512, 512);
    layerCtx.globalCompositeOperation = 'destination-in';
    const fade = layerCtx.createLinearGradient(0, 278, 0, 455);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(.32, 'rgba(0,0,0,.18)');
    fade.addColorStop(.65, 'rgba(0,0,0,.70)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    layerCtx.fillStyle = fade;
    layerCtx.fillRect(0, 0, 512, 512);
    frostBottomLayer = layer;
  };
  sources.set(frostBodyImage, 'assets/ui/slime/forms/slime-body-frost-v1.webp?v=1');
  function load(image) {
    if (loads.has(image)) return loads.get(image);
    image.decoding = 'async';
    const promise = new Promise(resolve => {
      const timeout = setTimeout(() => resolve(false), 5000);
      const finish = result => { clearTimeout(timeout); resolve(result); };
      image.addEventListener('load', () => finish(true), { once: true });
      image.addEventListener('error', () => finish(false), { once: true });
      image.src = window.SlimeGameAssets.versionedAsset(sources.get(image));
    });
    loads.set(image, promise);
    return promise;
  }
  const preloads = new Map();
  function preload(levels) {
    const key = `${levels.telekinesis || 0}|${levels.frost || 0}|${levels.nano || 0}`;
    if (preloads.has(key)) return preloads.get(key);
    const tasks = [];
    if (levels.telekinesis) tasks.push(load(levels.telekinesis >= 3 ? assets.psionicsAntennaeUltra : assets.psionicsAntennae));
    if (levels.frost === 2) tasks.push(load(frostBodyImage));
    if (levels.nano) tasks.push(load(assets.nanoDrone));
    const promise = Promise.all(tasks);
    preloads.set(key, promise);
    return promise;
  }
  const ready = image => image.complete && image.naturalWidth > 0;
  const frostBreathPhase = timestamp => Math.max(0, Math.min(1, (((timestamp % 3350) / 3350) - .62) / .27));
  const isFrostBreathing = timestamp => {
    const phase = frostBreathPhase(timestamp);
    return phase > 0 && phase < 1;
  };

  function flame(ctx, {x, y, radius, timestamp, levels}) {
    const stronger = levels.fire >= 2;
    const time = timestamp / 390;
    const sway = (Math.sin(time) * .65 + Math.sin(time * 1.7) * .35) * radius * (stronger ? .10 : .075);
    const pulse = 1 + Math.sin(time * 1.3) * (stronger ? .09 : .065);
    const width = radius * (stronger ? .34 : .265);
    const height = radius * (stronger ? .65 : .49);
    const trace = (pathWidth, pathHeight, tipSway) => {
      ctx.beginPath();
      ctx.moveTo(0, radius * .025);
      ctx.bezierCurveTo(-pathWidth * .94, 0, -pathWidth * .86, -pathHeight * .35, -pathWidth * .43, -pathHeight * .59);
      ctx.bezierCurveTo(-pathWidth * .08, -pathHeight * .79, tipSway * .72, -pathHeight * .91, tipSway, -pathHeight);
      ctx.bezierCurveTo(pathWidth * .48 + tipSway * .55, -pathHeight * .72, pathWidth * .82, -pathHeight * .38, pathWidth * .82, -pathHeight * .2);
      ctx.bezierCurveTo(pathWidth * .82, -pathHeight * .045, pathWidth * .5, radius * .025, 0, radius * .025);
      ctx.closePath();
    };
    ctx.save();
    ctx.translate(x, y - radius * .80);
    ctx.scale(1 / pulse, pulse);
    const glowRadius = radius * (stronger ? .58 : .43);
    const glow = ctx.createRadialGradient(0, -height * .32, 0, 0, -height * .32, glowRadius);
    glow.addColorStop(0, stronger ? 'rgba(255,236,87,.64)' : 'rgba(255,236,87,.45)');
    glow.addColorStop(1, 'rgba(255,139,13,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -height * .32, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ff7b0c';
    ctx.shadowBlur = radius * (stronger ? .24 : .17);
    const outer = ctx.createLinearGradient(0, -height, 0, radius * .03);
    outer.addColorStop(0, '#ff3b0c');
    outer.addColorStop(.45, '#ff7c08');
    outer.addColorStop(1, '#ffbb13');
    ctx.fillStyle = outer;
    trace(width, height, sway);
    ctx.fill();
    ctx.shadowBlur = radius * .085;
    ctx.fillStyle = '#ffdc28';
    trace(width * .73, height * .79, sway * .44);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff8ad';
    trace(width * .39, height * .58, sway * .17);
    ctx.fill();
    for (let index = 0; index < (stronger ? 5 : 3); index++) {
      const phase = (timestamp / (760 + index * 140) + index * .37) % 1;
      const alpha = Math.sin(phase * Math.PI) * .88;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = index % 3 === 1 ? '#fff7a0' : '#ffac1c';
      ctx.beginPath();
      ctx.ellipse(
        radius * ((index - (stronger ? 2 : 1)) * (stronger ? .13 : .16) + Math.sin(time * .75 + index) * .035),
        -height * (.33 + phase * .75),
        radius * (.026 + index * .004), radius * (.046 + index * .006), 0, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function fireBodyParticles(ctx, {x, y, radius, timestamp, levels, effectDetail = 1}) {
    if (levels.fire < 2) return;
    const origins = [
      [-.77, .50], [.78, .46], [-.92, .12], [.92, .08],
      [-.77, -.32], [.75, -.39], [-.42, -.72], [.40, -.74],
      [-.58, .30], [.62, .27]
    ];
    ctx.save();
    for (let index = 0; index < origins.length; index++) {
      if (effectDetail < .8 && index % 2) continue;
      const [originX, originY] = origins[index];
      const phase = (timestamp / (1200 + index * 75) + index * .213) % 1;
      const fade = Math.sin(phase * Math.PI);
      const side = Math.sign(originX);
      const px = x + radius * (originX + side * phase * .08 + Math.sin(timestamp / 330 + index * 1.8) * .035);
      const py = y + radius * (originY - phase * (.42 + index % 3 * .08));
      const size = radius * (.030 + index % 3 * .008) * (1 - phase * .22);
      ctx.globalAlpha = fade * .62;
      ctx.fillStyle = '#e63b0a';
      ctx.beginPath();
      ctx.arc(px, py, size * 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = fade;
      ctx.shadowColor = '#ff6010';
      ctx.shadowBlur = radius * .09;
      ctx.fillStyle = index % 3 === 0 ? '#ffe958' : '#ff9a16';
      ctx.beginPath();
      ctx.moveTo(px, py - size * 1.55);
      ctx.quadraticCurveTo(px + size * 1.12, py - size * .1, px + size * .72, py + size * .55);
      ctx.quadraticCurveTo(px, py + size * 1.12, px - size * .72, py + size * .55);
      ctx.quadraticCurveTo(px - size * 1.12, py - size * .1, px, py - size * 1.55);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#fffbd6';
      ctx.beginPath();
      ctx.ellipse(px - size * .13, py + size * .26, size * .27, size * .39, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function frostFace(ctx, {x, y, radius, timestamp}) {
    // Cold breath starts at the mouth and expands into a visible, fading plume.
    const breathPhase = frostBreathPhase(timestamp);
    if (breathPhase <= 0 || breathPhase >= 1) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.shadowColor = '#62dcff';
    ctx.shadowBlur = radius * .105;
    ctx.globalAlpha = Math.sin(Math.min(1, breathPhase * 3) * Math.PI / 2) * (1 - breathPhase) * .8;
    ctx.fillStyle = '#f2ffff';
    ctx.beginPath();
    ctx.ellipse(radius * .11, radius * .31, radius * .083, radius * .044, -.16, 0, Math.PI * 2);
    ctx.fill();
    for (let index = 0; index < 6; index++) {
      const phase = Math.max(0, Math.min(1, breathPhase * 1.5 - index * .105));
      if (phase <= 0 || phase >= 1) continue;
      ctx.globalAlpha = Math.sin(phase * Math.PI) * (.91 - index * .055);
      ctx.fillStyle = index % 2 ? '#c4f5ff' : '#f4ffff';
      ctx.beginPath();
      ctx.ellipse(
        radius * (.12 + phase * .58),
        radius * (.31 - phase * .24 + Math.sin(phase * Math.PI * 2 + index) * .028),
        radius * (.064 + phase * .095),
        radius * (.042 + phase * .062),
        -.12, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function frostBottom(ctx, {radius, levels}) {
    if (levels.frost < 2 || !frostBottomLayer) return;
    ctx.save();
    ctx.drawImage(frostBottomLayer,
      -radius * 1.18, -radius * 1.18, radius * 2.36, radius * 2.36);
    ctx.restore();
  }

  function frostSnowflakes(ctx, {x, y, radius, timestamp, levels, effectDetail = 1}) {
    if (levels.frost < 2) return;
    const origins = [
      [-1.00, .25], [-.83, -.44], [-.45, -.83], [.35, -.87],
      [.82, -.45], [1.00, .18], [.86, .56], [-.86, .58]
    ];
    for (let index = 0; index < origins.length; index++) {
      if (effectDetail < .8 && index % 2) continue;
      const [originX, originY] = origins[index];
      const phase = (timestamp / (2050 + index * 145) + index * .239) % 1;
      const side = Math.sign(originX);
      const px = x + radius * (originX + side * phase * .12 + Math.sin(timestamp / 740 + index) * .035);
      const py = y + radius * (originY - phase * .33);
      const size = radius * (.055 + index % 3 * .012) * (.78 + phase * .20);
      const opacity = Math.sin(phase * Math.PI);
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(timestamp / (2400 + index * 180) + index);
      ctx.globalAlpha = opacity;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#27a8f4';
      ctx.shadowBlur = radius * .14;
      ctx.beginPath();
      for (let arm = 0; arm < 6; arm++) {
        const angle = arm * Math.PI / 3;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const bx = dx * size * .66;
        const by = dy * size * .66;
        ctx.moveTo(0, 0);
        ctx.lineTo(dx * size, dy * size);
        for (const branch of [-1, 1]) {
          const fork = angle + branch * Math.PI * .28;
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - Math.cos(fork) * size * .23, by - Math.sin(fork) * size * .23);
        }
      }
      ctx.strokeStyle = '#126cae';
      ctx.lineWidth = Math.max(2, radius * .042);
      ctx.stroke();
      ctx.shadowBlur = radius * .055;
      ctx.strokeStyle = '#f4ffff';
      ctx.lineWidth = Math.max(1, radius * .019);
      ctx.stroke();
      ctx.restore();
    }
  }

  function electricMark(ctx, {x, y, radius, timestamp}) {
    const beat = timestamp % 2050;
    const thunder = beat < 75 || (beat > 135 && beat < 205) ? 1 : 0;
    const glowStrength = .68 + thunder * .32 + Math.sin(timestamp / 95) * .045;
    ctx.save();
    ctx.translate(x, y - radius * .43);
    ctx.scale(1.19, 1.19);
    ctx.lineJoin = 'round';
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * .34);
    halo.addColorStop(0, `rgba(255,251,155,${(.54 * glowStrength).toFixed(3)})`);
    halo.addColorStop(.42, `rgba(255,217,35,${(.27 * glowStrength).toFixed(3)})`);
    halo.addColorStop(1, 'rgba(255,174,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, radius * .34, 0, Math.PI * 2);
    ctx.fill();
    const yellow = ctx.createLinearGradient(0, -radius * .19, 0, radius * .19);
    yellow.addColorStop(0, '#fffef1');
    yellow.addColorStop(.48, '#fff76b');
    yellow.addColorStop(1, '#ffbd16');
    ctx.globalAlpha = .92 + thunder * .08;
    ctx.shadowColor = '#ffe31b';
    ctx.shadowBlur = radius * (.19 + thunder * .14);
    ctx.fillStyle = yellow;
    ctx.strokeStyle = '#b76805';
    ctx.lineWidth = radius * .019;
    ctx.beginPath();
    ctx.moveTo(radius * .035, -radius * .17);
    ctx.lineTo(-radius * .105, radius * .005);
    ctx.lineTo(-radius * .01, radius * .005);
    ctx.lineTo(-radius * .075, radius * .18);
    ctx.lineTo(radius * .12, -radius * .045);
    ctx.lineTo(radius * .025, -radius * .045);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = radius * (.07 + thunder * .07);
    ctx.strokeStyle = '#fffef0';
    ctx.lineWidth = radius * .019;
    ctx.beginPath();
    ctx.moveTo(radius * .024, -radius * .116);
    ctx.lineTo(-radius * .058, -radius * .006);
    ctx.lineTo(radius * .006, -radius * .006);
    ctx.lineTo(-radius * .034, radius * .108);
    ctx.stroke();
    ctx.restore();
  }

  function electricBodyBolts(ctx, {x, y, radius, timestamp, levels}) {
    if (levels.electric < 2) return;
    const bolts = [
      [-.99, -.12, -62, 180], [-.64, -.72, -20, 1150],
      [.67, -.70, 29, 710], [.99, .04, 66, 1480],
      [.07, -.96, 4, 430], [-.88, .44, -76, 940],
      [.87, .43, 75, 1320]
    ];
    ctx.save();
    for (let index = 0; index < bolts.length; index++) {
      const [originX, originY, rotation, delay] = bolts[index];
      const phase = ((timestamp + delay) / 1720) % 1;
      if (phase < .52 || phase > .91) continue;
      const travel = (phase - .52) / .39;
      let opacity;
      let scale;
      if (phase < .65) {
        const appear = (phase - .52) / .13;
        opacity = appear;
        scale = .48 + appear * .60;
      } else if (phase < .79) {
        const hold = (phase - .65) / .14;
        opacity = 1 - hold * .18;
        scale = 1.08 - hold * .18;
      } else {
        const vanish = (phase - .79) / .12;
        opacity = .82 * (1 - vanish);
        scale = .90 - vanish * .32;
      }
      const angle = Math.atan2(originY, originX);
      const outward = radius * .23 * travel;
      const px = x + originX * radius + Math.cos(angle) * outward;
      const py = y + originY * radius + Math.sin(angle) * outward - radius * .055 * travel;
      const width = radius * (index % 3 === 1 ? .12 : .15);
      const height = width * 1.42;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(scale, scale);
      ctx.globalAlpha = opacity;
      ctx.shadowColor = '#ffe84d';
      ctx.shadowBlur = radius * .23;
      const fill = ctx.createLinearGradient(0, -height * .5, 0, height * .5);
      fill.addColorStop(0, '#fffefa');
      fill.addColorStop(.46, '#fff56d');
      fill.addColorStop(1, '#ffbf19');
      ctx.fillStyle = fill;
      ctx.strokeStyle = '#754009';
      ctx.lineWidth = Math.max(1.1, radius * .016);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(width * .04, -height * .5);
      ctx.lineTo(width * .5, -height * .5);
      ctx.lineTo(width * .17, -height * .13);
      ctx.lineTo(width * .46, -height * .13);
      ctx.lineTo(-width * .22, height * .5);
      ctx.lineTo(-width * .04, height * .05);
      ctx.lineTo(-width * .38, height * .05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function psionicsMotion(timestamp, radius) {
    const phase = timestamp / 620;
    const lift = (1 - Math.cos(phase)) * .5;
    return {
      offset: -radius * .11 * lift,
      energy: Math.max(0, Math.min(1, .42 + Math.sin(phase) * .78))
    };
  }

  const glowLayers = new Map();
  function psionicsGlow(ctx, x, y, width, height, colors, opacity) {
    const key = colors.flat().join('|');
    let layer = glowLayers.get(key);
    if (!layer) {
      layer = document.createElement('canvas'); layer.width = layer.height = 128;
      const context = layer.getContext('2d');
      const glow = context.createRadialGradient(64, 64, 1.28, 64, 64, 64);
      for (const [at, color] of colors) glow.addColorStop(at, color);
      context.fillStyle = glow; context.fillRect(0, 0, 128, 128);
      if (glowLayers.size >= 16) glowLayers.delete(glowLayers.keys().next().value);
      glowLayers.set(key, layer);
    }
    ctx.save(); ctx.globalAlpha = opacity;
    ctx.drawImage(layer, x - width, y - height, width * 2, height * 2);
    ctx.restore();
  }

  function psionicsAura(ctx, {x, y, baseY, radius, psionicsEnergy = .4}) {
    const anchorY = (baseY ?? y) + radius * .96;
    const strength = .10 + psionicsEnergy * .90;
    psionicsGlow(ctx, x, anchorY, radius * 1.23, radius * .43, [
      [0, 'rgba(12,107,151,.77)'],
      [.44, 'rgba(16,150,196,.50)'],
      [1, 'rgba(5,98,160,0)']
    ], strength);
    psionicsGlow(ctx, x, anchorY - radius * .05, radius * .84, radius * .28, [
      [0, 'rgba(244,255,255,.91)'],
      [.36, 'rgba(98,246,255,.75)'],
      [1, 'rgba(28,187,231,0)']
    ], strength);
  }

  function psionicsMist(ctx, {x, y, radius, psionicsEnergy = .4}) {
    psionicsGlow(ctx, x, y + radius * .89, radius * .88, radius * .26, [
      [0, 'rgba(229,255,255,.64)'],
      [.42, 'rgba(81,236,255,.42)'],
      [1, 'rgba(23,160,215,0)']
    ], .08 + psionicsEnergy * .55);
  }

  function psionicsAntennae(ctx, {x, y, radius, timestamp, levels, psionicsEnergy = .4}) {
    const antennae = levels.telekinesis >= 3 && ready(assets.psionicsAntennaeUltra)
      ? assets.psionicsAntennaeUltra : assets.psionicsAntennae;
    if (!ready(antennae)) return;
    const glowing = levels.telekinesis >= 2;
    const sway = Math.sin(timestamp / 1250) * radius * .012;
    const width = radius * 1.48;
    const height = radius * .99;
    ctx.save();
    // The transparent roots sit inside the slime silhouette; only the stalks emerge.
    ctx.translate(x, y - radius * 1.33);
    ctx.rotate(sway / radius);
    if (glowing) {
      for (const side of [-1, 1]) {
        psionicsGlow(ctx, side * radius * .55, radius * .20,
          radius * .32, radius * .32, [
            [0, 'rgba(238,255,255,.94)'],
            [.25, 'rgba(76,244,255,.75)'],
            [1, 'rgba(17,176,255,0)']
          ], psionicsEnergy * .88);
      }
    }
    ctx.drawImage(antennae, -width / 2, 0, width, height);
    if (glowing) {
      ctx.globalCompositeOperation = 'screen';
      for (const side of [-1, 1]) {
        psionicsGlow(ctx, side * radius * .55, radius * .20,
          radius * .145, radius * .145, [
            [0, 'rgba(255,255,255,.97)'],
            [.44, 'rgba(109,249,255,.74)'],
            [1, 'rgba(45,211,255,0)']
          ], psionicsEnergy * .78);
      }
    }
    ctx.restore();
  }

  function nanoDrone(ctx, {x, y, radius, timestamp}) {
    if (!ready(assets.nanoDrone)) return;
    const droneX = x - radius * 1.22 + Math.sin(timestamp / 720) * radius * .015;
    const droneY = y - radius * .72 + Math.sin(timestamp / 410) * radius * .035;
    const size = radius * .70;
    ctx.save();
    ctx.shadowColor = '#ff3153';
    ctx.shadowBlur = radius * .16;
    ctx.drawImage(assets.nanoDrone, droneX - size / 2, droneY - size / 2, size, size);
    ctx.restore();
  }

  function nanoEyeOpenness(timestamp) {
    const phase = timestamp % 5000;
    let openness = 0;
    if (phase >= 3150 && phase < 3450) openness = (phase - 3150) / 300;
    else if (phase >= 3450 && phase < 4200) openness = 1;
    else if (phase >= 4200 && phase < 4500) openness = 1 - (phase - 4200) / 300;
    return openness * openness * (3 - 2 * openness);
  }

  const glitchFragments = [
    [-.67, -.47, .43, 120], [.58, -.34, .38, 1180],
    [-.56, .08, .48, 2020], [.56, .39, .44, 780],
    [-.16, .70, .51, 1630], [-.10, -.76, .12, 2430], [.33, .63, .14, 370]
  ];
  const glitchFragmentActive = (timestamp, offset) => {
    const phase = ((timestamp + offset) % 2800) / 2800;
    return (phase >= .12 && phase < .32) || (phase >= .53 && phase < .67);
  };
  let glitchCopyKey = '';
  let glitchCopySource = null;
  function glitchBodyFragments(ctx, {x, y, radius, timestamp, effectDetail = 1}) {
    if (!glitchPixelCtx || !glitchFragments.some(fragment => glitchFragmentActive(timestamp, fragment[3]))) return;
    const left = Math.floor(x - radius * 1.24), top = Math.floor(y - radius * 1.24);
    const width = Math.ceil(radius * 2.48), height = width;
    if (glitchPixelCanvas.width !== width || glitchPixelCanvas.height !== height) {
      glitchPixelCanvas.width = width; glitchPixelCanvas.height = height;
      glitchCopyKey = '';
    }
    const key = `${left}|${top}|${width}|${Math.floor(timestamp / (effectDetail < .8 ? 34 : 16))}`;
    if (key !== glitchCopyKey || glitchCopySource !== ctx.canvas) {
      glitchPixelCtx.clearRect(0, 0, width, height);
      const transform = ctx.getTransform();
      // Source canvas pixels use device coordinates, fragments use game coordinates.
      glitchPixelCtx.drawImage(ctx.canvas, left * transform.a + transform.e,
        top * transform.d + transform.f, width * transform.a, height * transform.d,
        0, 0, width, height);
      glitchCopyKey = key; glitchCopySource = ctx.canvas;
    }

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    glitchFragments.forEach(([bx, by, span, offset], index) => {
      const phase = ((timestamp + offset) % 2800) / 2800;
      if (!((phase >= .12 && phase < .32) || (phase >= .53 && phase < .67))) return;
      const strong = phase < .32;
      const fx = Math.round(x + radius * bx);
      const fy = Math.round(y + radius * by);
      const shift = (index % 2 ? 1 : -1) * radius * (strong ? .105 : .055);
      ctx.globalAlpha = strong ? .94 : .72;
      ctx.shadowBlur = radius * .065;
      ctx.shadowColor = index % 2 ? '#ff48dd' : '#49f5ff';
      if (index >= 5) {
        const cell = Math.max(5, Math.round(radius * span));
        ctx.fillStyle = index % 2 ? '#ff48dd' : '#50f5ff';
        ctx.fillRect(fx + shift, fy, cell, cell);
        ctx.fillStyle = '#efffff';
        ctx.fillRect(fx + shift + cell * .18, fy + cell * .15, cell * .4, cell * .32);
        return;
      }
      const stripW = Math.max(13, Math.round(radius * span));
      const stripH = Math.max(4, Math.round(radius * (strong ? .085 : .065)));
      const sourceX = Math.max(left, Math.min(left + width - stripW, fx - stripW * .5));
      const sourceY = Math.max(top, Math.min(top + height - stripH, fy));
      ctx.drawImage(glitchPixelCanvas, sourceX - left, sourceY - top, stripW, stripH,
        sourceX + shift, sourceY, stripW, stripH);
      ctx.fillStyle = index % 2 ? '#ff48dd' : '#49f5ff';
      ctx.fillRect(fx + shift - stripW * .34, fy, stripW * .68, stripH * .72);
      ctx.fillStyle = index % 2 ? '#69f9ff' : '#ff91ec';
      ctx.fillRect(fx + shift - stripW * .20, fy + stripH, stripW * .38, Math.max(2, stripH * .44));
    });
    ctx.restore();
  }

  function flyingSpores(ctx, {x, y, radius, timestamp}) {
    const paths = [
      [-.88, -.29, -.64, -.72], [.88, -.18, .70, -.75],
      [-.95, .15, -.79, -.55], [.93, .22, .75, -.63],
      [.02, -.99, .12, -1.02]
    ];
    paths.forEach(([startX, startY, driftX, driftY], index) => {
      const phase = (timestamp / (3700 + index % 3 * 380) + index * .213) % 1;
      const sway = (Math.sin(timestamp / (390 + index * 55) + index * 2.1)
        + Math.sin(timestamp / (810 + index * 65) + index) * .55) * .075 * phase;
      const px = x + radius * (startX + driftX * phase + sway);
      const py = y + radius * (startY + driftY * phase
        + Math.cos(timestamp / (620 + index * 55) + index * 1.7) * .055 * phase);
      const size = radius * (.052 + index % 3 * .009) * (1 - phase * .18);
      ctx.save();
      ctx.globalAlpha = Math.sin(phase * Math.PI) * .68 + .08;
      const halo = ctx.createRadialGradient(px, py, 0, px, py, size * 2.8);
      halo.addColorStop(0, 'rgba(236,255,128,.7)');
      halo.addColorStop(.33, 'rgba(166,255,58,.42)');
      halo.addColorStop(1, 'rgba(130,255,34,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(px, py, size * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#399d20';
      ctx.beginPath();
      ctx.arc(px, py, size * 1.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = index % 3 === 0 ? '#e5ff60' : '#a8ff35';
      ctx.beginPath();
      ctx.arc(px, py, size * .82, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fbffd9';
      ctx.beginPath();
      ctx.arc(px - size * .20, py - size * .22, size * .34, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawBehind(ctx, state) {
    preload(state.levels);
    if (state.levels.cloning >= 2) flyingSpores(ctx, state);
    if (state.levels.telekinesis >= 2) psionicsAura(ctx, state);
    if (state.levels.telekinesis) psionicsAntennae(ctx, state);

  }
  function drawInside(ctx, state) {
    if (state.levels.frost === 2) frostBottom(ctx, state);
  }
  function drawFront(ctx, state) {
    if (state.levels.telekinesis >= 2) psionicsMist(ctx, state);
    if (state.levels.frost >= 2) frostSnowflakes(ctx, state);
    if (state.levels.frost) frostFace(ctx, state);
    if (state.levels.electric >= 2) electricBodyBolts(ctx, state);
    if (state.levels.electric && state.levels.electric < 3) electricMark(ctx, state);
    if (state.levels.fire >= 2) fireBodyParticles(ctx, state);
    if (state.levels.fire && state.levels.fire < 3) {
      // The flame root shares the body's pose; only its tip sways independently.
      ctx.save();ctx.translate(state.x,state.y);
      ctx.rotate(state.bodyTransform?.rotation||0);
      ctx.scale(state.bodyTransform?.scaleX??1,state.bodyTransform?.scaleY??1);
      flame(ctx,{...state,x:0,y:0});ctx.restore();
    }
    if (state.levels.nano) nanoDrone(ctx, state);
    if (state.levels.glitch) glitchBodyFragments(ctx, state);
  }

  function drawComposite() {}

  window.MutationEffectDraft = Object.freeze({ preload, drawBehind, drawInside, drawFront, drawComposite, isFrostBreathing, nanoEyeOpenness, psionicsMotion });
})();
