(() => {
  'use strict';

  // The hooks use avatar coordinates, ready for the game's renderer later.
  const assets = {};
  for (const [key, file] of Object.entries({
    psionicsAntennae: 'psionics-antennae-v1.png',
    psionicsAntennaeUltra: 'psionics-antennae-ultra-v1.png'
  })) {
    const image = new Image();
    image.src = `effects-lab/assets/${file}`;
    assets[key] = image;
  }
  assets.nanoDrone = new Image();
  assets.nanoDrone.src = 'effects-lab/assets/techno-drone-red-v1.webp';
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
  frostBodyImage.src = 'assets/ui/slime/forms/slime-body-frost-v1.webp?v=1';
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

  function fireBodyParticles(ctx, {x, y, radius, timestamp, levels}) {
    if (levels.fire < 2) return;
    const origins = [
      [-.77, .50], [.78, .46], [-.92, .12], [.92, .08],
      [-.77, -.32], [.75, -.39], [-.42, -.72], [.40, -.74],
      [-.58, .30], [.62, .27]
    ];
    ctx.save();
    for (let index = 0; index < origins.length; index++) {
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

  function frostSnowflakes(ctx, {x, y, radius, timestamp, levels}) {
    if (levels.frost < 2) return;
    const origins = [
      [-1.00, .25], [-.83, -.44], [-.45, -.83], [.35, -.87],
      [.82, -.45], [1.00, .18], [.86, .56], [-.86, .58]
    ];
    for (let index = 0; index < origins.length; index++) {
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

  function cosmosAura(ctx, {x, y, radius, timestamp, levels}) {
    const flow = cosmosFlow(timestamp);
    const comet = levels.cosmos >= 2 ? flow.energy : 0;
    const breathe = 1 + Math.sin(timestamp / 2650) * .018;
    const field = (cx, cy, rx, ry, colors, opacity = 1) => {
      ctx.save();
      ctx.translate(x + radius * (cx + flow.x), y + radius * (cy + flow.y));
      ctx.scale(radius * rx * breathe, radius * ry * breathe);
      ctx.globalAlpha = opacity;
      const mist = ctx.createRadialGradient(0, 0, .12, 0, 0, 1);
      mist.addColorStop(0, colors[0]);
      mist.addColorStop(.56, colors[1]);
      mist.addColorStop(1, 'rgba(59,10,133,0)');
      ctx.fillStyle = mist;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    if (levels.cosmos >= 2) {
      ctx.save();
      field(0, .02, 1.34 + comet * .32, 1.28 + comet * .30,
        ['rgba(49,7,125,.77)', 'rgba(98,28,194,.43)']);
      ctx.globalCompositeOperation = 'screen';
      field(-.76, -.15, .55 + comet * .17, .76 + comet * .15,
        ['rgba(193,104,255,.62)', 'rgba(111,38,219,.28)']);
      field(.75, .10, .57 + comet * .17, .73 + comet * .15,
        ['rgba(170,91,255,.64)', 'rgba(107,36,215,.30)']);
      field(0, -.78, .75 + comet * .20, .47 + comet * .12,
        ['rgba(193,126,255,.34)', 'rgba(124,52,224,.13)']);
      field(0, .79, .77 + comet * .20, .44 + comet * .12,
        ['rgba(149,95,242,.31)', 'rgba(89,41,186,.13)']);
      if (comet > .01) field(0, .04, 1.65, 1.53,
        ['rgba(161,63,255,.47)', 'rgba(112,40,219,.22)'], comet);
      ctx.restore();
    }

    const stars = [
      [-1.10,-.38],[-1.08,.46],[-.48,-1.14],
      [.62,-1.10],[1.12,-.28],[1.06,.52],[-.16,1.10]
    ];
    for (let index = 0; index < stars.length; index++) {
      const [ox, oy] = stars[index];
      const phase = (timestamp / (1950 + index * 130) + index * .31) % 1;
      const twinkle = Math.pow(Math.max(0, Math.sin(phase * Math.PI)), 6);
      const px = x + radius * ox;
      const py = y + radius * oy;
      ctx.save();
      ctx.globalAlpha = .25 + twinkle * .74;
      ctx.shadowColor = '#dfb8ff';
      ctx.shadowBlur = radius * (.045 + twinkle * .11);
      ctx.fillStyle = '#fff9ff';
      ctx.beginPath();
      ctx.arc(px, py, radius * (.011 + twinkle * .016), 0, Math.PI * 2);
      ctx.fill();
      if (twinkle > .28) {
        const arm = radius * (.025 + twinkle * .055);
        ctx.strokeStyle = '#fff5ff';
        ctx.lineWidth = Math.max(.8, radius * .012 * twinkle);
        ctx.beginPath();
        ctx.moveTo(px - arm, py);
        ctx.lineTo(px + arm, py);
        ctx.moveTo(px, py - arm);
        ctx.lineTo(px, py + arm);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (levels.cosmos < 2) return;

    // Independent, sparse gravity markers drift in both directions.
    const arrows = [[-1.13,-.02,-1],[1.14,.18,1],[-.79,.78,1],[.82,-.78,-1]];
    for (let index = 0; index < arrows.length; index++) {
      const [ox, oy, direction] = arrows[index];
      const phase = (timestamp / (4200 + index * 440) + index * .26) % 1;
      const fade = phase < .30 ? Math.sin(phase / .30 * Math.PI) ** 2 : 0;
      if (fade < .08) continue;
      const px = x + radius * ox;
      const py = y + radius * (oy + direction * (phase - .5) * .28);
      const size = radius * .078;
      ctx.save();
      ctx.translate(px, py);
      if (direction < 0) ctx.rotate(Math.PI);
      ctx.globalAlpha = fade * .88;
      ctx.shadowColor = '#b457ff';
      ctx.shadowBlur = radius * .085;
      ctx.fillStyle = '#bc70ff';
      ctx.beginPath();
      ctx.moveTo(-size * .25, -size * .68);
      ctx.lineTo(size * .25, -size * .68);
      ctx.lineTo(size * .25, size * .10);
      ctx.lineTo(size * .52, size * .10);
      ctx.lineTo(0, size * .82);
      ctx.lineTo(-size * .52, size * .10);
      ctx.lineTo(-size * .25, size * .10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function cosmosFlow(timestamp) {
    return {
      energy: .84 + Math.sin(timestamp / 1500) * .07,
      x: Math.sin(timestamp / 1350) * .035,
      y: Math.sin(timestamp / 1650 + .7) * .025
    };
  }

  function cosmosCometWake(ctx, {x, y, radius, timestamp, levels}) {
    if (levels.cosmos < 2) return;
    const flow = cosmosFlow(timestamp);
    const strength = flow.energy;
    const length = radius * (.85 + strength * 1.15);
    const width = radius * (.52 + strength * .34);
    const sway = Math.sin(timestamp / 1050) * radius * .075;
    ctx.save();
    ctx.translate(x + flow.x * radius, y + flow.y * radius);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = strength;
    const halo = ctx.createRadialGradient(0, 0, radius * .28, 0, 0, radius * 1.9);
    halo.addColorStop(0, 'rgba(247,228,255,.36)');
    halo.addColorStop(.48, 'rgba(171,72,255,.36)');
    halo.addColorStop(1, 'rgba(68,20,159,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, radius * 1.9, 0, Math.PI * 2); ctx.fill();
    const outer = ctx.createLinearGradient(0, radius * .68, 0, -length);
    outer.addColorStop(0, 'rgba(255,239,255,.80)');
    outer.addColorStop(.24, 'rgba(215,113,255,.76)');
    outer.addColorStop(.64, 'rgba(110,35,245,.48)');
    outer.addColorStop(1, 'rgba(53,15,155,0)');
    ctx.fillStyle = outer;
    ctx.shadowColor = '#a340ff';
    ctx.shadowBlur = radius * .21;
    ctx.beginPath();
    ctx.moveTo(-radius * .77, radius * .32);
    ctx.bezierCurveTo(-radius * .96, -radius * .15, -width * .73, -length * .65, sway, -length);
    ctx.bezierCurveTo(width * .73, -length * .65, radius * .96, -radius * .15, radius * .77, radius * .32);
    ctx.quadraticCurveTo(0, radius * .89, -radius * .77, radius * .32);
    ctx.fill();
    const core = ctx.createLinearGradient(0, radius * .52, 0, -length * .78);
    core.addColorStop(0, 'rgba(255,255,255,.83)');
    core.addColorStop(.3, 'rgba(236,184,255,.72)');
    core.addColorStop(1, 'rgba(136,60,255,0)');
    ctx.fillStyle = core;
    ctx.shadowBlur = radius * .10;
    ctx.beginPath();
    ctx.moveTo(-radius * .43, radius * .45);
    ctx.bezierCurveTo(-radius * .53, -radius * .12, -radius * .22 + sway * .3, -length * .52, sway * .3, -length * .78);
    ctx.bezierCurveTo(radius * .24 + sway * .3, -length * .5, radius * .53, -radius * .12, radius * .43, radius * .45);
    ctx.quadraticCurveTo(0, radius * .67, -radius * .43, radius * .45);
    ctx.fill();
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

  function psionicsGlow(ctx, x, y, width, height, colors, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(width, height);
    ctx.globalAlpha = opacity;
    const glow = ctx.createRadialGradient(0, 0, .02, 0, 0, 1);
    colors.forEach(([at, color]) => glow.addColorStop(at, color));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
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

  function phantomHalo(ctx, {x, y, radius, phantomActive = false}) {
    if (phantomActive) return;
    ctx.save();
    const outerRadius = radius * 2.05;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, outerRadius);
    halo.addColorStop(0, 'rgba(215,223,227,0)');
    halo.addColorStop(.52, 'rgba(215,223,227,0)');
    halo.addColorStop(.67, 'rgba(202,211,217,.11)');
    halo.addColorStop(.77, 'rgba(180,190,199,.27)');
    halo.addColorStop(.9, 'rgba(213,222,228,.09)');
    halo.addColorStop(1, 'rgba(213,222,228,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
    ctx.fill();
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

  function glitchBodyFragments(ctx, {x, y, radius, timestamp}) {
    if (!glitchPixelCtx) return;
    const left = Math.max(0, Math.floor(x - radius * 1.24));
    const top = Math.max(0, Math.floor(y - radius * 1.24));
    const width = Math.min(ctx.canvas.width - left, Math.ceil(radius * 2.48));
    const height = Math.min(ctx.canvas.height - top, Math.ceil(radius * 2.48));
    if (width <= 0 || height <= 0) return;
    if (glitchPixelCanvas.width !== width || glitchPixelCanvas.height !== height) {
      glitchPixelCanvas.width = width;
      glitchPixelCanvas.height = height;
    }
    glitchPixelCtx.clearRect(0, 0, width, height);
    glitchPixelCtx.drawImage(ctx.canvas, left, top, width, height, 0, 0, width, height);

    // Match the food effect: a handful of broad cyan/magenta data slices,
    // followed by two square pixels. Each fragment has its own short pulse.
    const fragments = [
      [-.67, -.47, .43, 120], [.58, -.34, .38, 1180],
      [-.56, .08, .48, 2020], [.56, .39, .44, 780],
      [-.16, .70, .51, 1630], [-.10, -.76, .12, 2430], [.33, .63, .14, 370]
    ];
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    fragments.forEach(([bx, by, span, offset], index) => {
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
    if (state.levels.cloning >= 2) flyingSpores(ctx, state);
    if (state.levels.cosmos) {
      cosmosAura(ctx, state);
      cosmosCometWake(ctx, state);
    }
    if (state.levels.telekinesis >= 2) psionicsAura(ctx, state);
    if (state.levels.telekinesis) psionicsAntennae(ctx, state);
    if (state.levels.phantom) phantomHalo(ctx, state);
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
    if (state.levels.fire && state.levels.fire < 3) flame(ctx, state);
    if (state.levels.nano) nanoDrone(ctx, state);
    if (state.levels.glitch) glitchBodyFragments(ctx, state);
  }

  function drawComposite() {}

  window.MutationEffectDraft = Object.freeze({ drawBehind, drawInside, drawFront, drawComposite, isFrostBreathing, nanoEyeOpenness, psionicsMotion });
})();
