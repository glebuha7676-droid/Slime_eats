(() => {
  'use strict';

  // The effect takes any square block sprite, so the same renderer can later be
  // called from the game without the workbench UI.
  const pixels = document.createElement('canvas');
  pixels.width = 46;
  pixels.height = 46;
  const pixelCtx = pixels.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawGlitchBlock(ctx, sprite, x, y, size, timestamp, salt = 0) {
    if (!(sprite?.naturalWidth || sprite?.width)) return;
    const grid = Math.max(18, Math.min(46, Math.round(size / 4.1)));
    if (pixels.width !== grid) pixels.width = pixels.height = grid;
    const step = reducedMotion ? 0 : Math.floor(timestamp / 90);
    let seed = (Math.imul(step + 1 + salt * 31, 747796405) ^ 2891336453) >>> 0;
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const cell = size / grid;

    pixelCtx.clearRect(0, 0, grid, grid);
    pixelCtx.imageSmoothingEnabled = true;
    pixelCtx.drawImage(sprite, 0, 0, grid, grid);
    const colors = ['#50f5ff', '#ff58d9', '#a97bff', '#eaffff', '#142643'];
    for (let i = 0; i < Math.max(11, Math.round(grid * grid * .025)); i++) {
      const px = Math.floor(random() * grid);
      const py = Math.floor(random() * grid);
      const w = 1 + Math.floor(random() * 3);
      const h = 1 + Math.floor(random() * 2);
      pixelCtx.globalAlpha = .52 + random() * .42;
      pixelCtx.fillStyle = colors[Math.floor(random() * colors.length)];
      pixelCtx.fillRect(px, py, w, h);
    }
    pixelCtx.globalAlpha = 1;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pixels, x, y, size, size);
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();

    // A few rows jump independently while the underlying block stays put.
    for (let i = 0; i < Math.max(2, Math.round(grid / 9)); i++) {
      const row = 4 + Math.floor(random() * (grid - 9));
      const rows = 1 + Math.floor(random() * 3);
      const offset = (random() < .5 ? -1 : 1) * (1 + Math.floor(random() * 3)) * cell;
      ctx.drawImage(pixels, 0, row, grid, rows,
        x + offset, y + row * cell, size, rows * cell);
      ctx.globalAlpha = .36 + random() * .32;
      ctx.fillStyle = i % 2 ? '#ff67e7' : '#5cf4ff';
      ctx.fillRect(x + Math.floor(random() * (grid - 8)) * cell,
        y + row * cell, (2 + Math.floor(random() * 6)) * cell, cell * .65);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawBurningBlock(ctx, x, y, size, timestamp, seed = 0) {
    const time = reducedMotion ? 0 : timestamp / 390 + seed * .27;
    const sway = (Math.sin(time) * .65 + Math.sin(time * 1.7) * .35) * size * .075;
    const pulse = 1 + Math.sin(time * 1.3) * .065;
    const width = size * .39;
    const height = size * .79;
    const trace = (pathWidth, pathHeight, tipSway) => {
      ctx.beginPath();
      ctx.moveTo(0, size * .018);
      ctx.bezierCurveTo(-pathWidth * .94, 0, -pathWidth * .86, -pathHeight * .35, -pathWidth * .43, -pathHeight * .59);
      ctx.bezierCurveTo(-pathWidth * .08, -pathHeight * .79, tipSway * .72, -pathHeight * .91, tipSway, -pathHeight);
      ctx.bezierCurveTo(pathWidth * .48 + tipSway * .55, -pathHeight * .72, pathWidth * .82, -pathHeight * .38, pathWidth * .82, -pathHeight * .2);
      ctx.bezierCurveTo(pathWidth * .82, -pathHeight * .045, pathWidth * .5, size * .018, 0, size * .018);
      ctx.closePath();
    };
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    const heat = reducedMotion ? .16 : .12 + (.5 + Math.sin(timestamp / 310 + seed * .6) * .5) * .12;
    ctx.fillStyle = `rgba(231,43,27,${heat})`;
    ctx.fillRect(x, y, size, size);
    ctx.translate(x + size * .5, y + size * .88);
    ctx.scale(1 / pulse, pulse);
    const glowRadius = size * .54;
    const glow = ctx.createRadialGradient(0, -height * .32, 0, 0, -height * .32, glowRadius);
    glow.addColorStop(0, 'rgba(255,236,87,.46)');
    glow.addColorStop(1, 'rgba(255,139,13,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -height * .32, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = '#ff7b0c';
    ctx.shadowBlur = size * .20;
    const outer = ctx.createLinearGradient(0, -height, 0, size * .02);
    outer.addColorStop(0, '#ff3b0c');
    outer.addColorStop(.45, '#ff7c08');
    outer.addColorStop(1, '#ffbb13');
    ctx.fillStyle = outer;
    trace(width, height, sway);
    ctx.fill();
    ctx.shadowBlur = size * .08;
    ctx.fillStyle = '#ffdc28';
    trace(width * .73, height * .79, sway * .44);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff8ae';
    trace(width * .39, height * .58, sway * .17);
    ctx.fill();
    for (let index = 0; index < 3; index++) {
      const phase = reducedMotion ? index / 3 : (timestamp / (760 + index * 140) + index * .37) % 1;
      ctx.globalAlpha = Math.sin(phase * Math.PI) * .78;
      ctx.fillStyle = index === 1 ? '#fff7a0' : '#ffac1c';
      ctx.beginPath();
      ctx.ellipse(
        size * ((index - 1) * .14 + Math.sin(time * .75 + index) * .025),
        -height * (.33 + phase * .75),
        size * .025, size * .041, 0, 0, Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  }

  const phantomClouds = [
    [.19,.75,.33,.21,0], [.44,.68,.39,.25,1.4],
    [.74,.75,.33,.22,2.8], [.33,.42,.34,.20,4.1],
    [.68,.37,.37,.23,5.4]
  ];
  const phantomNoise = (index, cycle, salt) => {
    const value = Math.sin((index + 1) * 91.7 + cycle * 17.13 + salt * 47.29) * 43758.5453;
    return value - Math.floor(value);
  };

  function drawPhantomBlock(ctx, sprite, x, y, size, timestamp, seed = 0) {
    if (!(sprite?.naturalWidth || sprite?.width)) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    ctx.filter = 'grayscale(1) brightness(1.18) contrast(.72)';
    ctx.drawImage(sprite, x, y, size, size);
    ctx.filter = 'none';
    ctx.fillStyle = 'rgba(166,184,205,.68)';
    ctx.fillRect(x, y, size, size);

    // Overlapping, slowly drifting clouds read as mist rather than separate rings.
    phantomClouds.forEach(([cloudX, cloudY, width, height, offset], index) => {
      const motionX = reducedMotion ? 0 : Math.sin(timestamp / (1350 + index * 170) + offset) * .045;
      const motionY = reducedMotion ? 0 : Math.cos(timestamp / (1800 + index * 160) + offset) * .055;
      ctx.save();
      ctx.translate(x + size * (cloudX + motionX), y + size * (cloudY + motionY));
      ctx.scale(size * width, size * height);
      const cloud = ctx.createRadialGradient(0, 0, .04, 0, 0, 1);
      cloud.addColorStop(0, 'rgba(247,251,255,.49)');
      cloud.addColorStop(.48, 'rgba(229,240,251,.31)');
      cloud.addColorStop(1, 'rgba(215,231,248,0)');
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Each mote gets a new position and drift when it fades out and respawns.
    for (let index = 0; index < 11; index++) {
      const elapsed = reducedMotion ? (index + .5) / 11 : timestamp / (1450 + index * 87) + index * .137;
      const cycle = Math.floor(elapsed);
      const phase = elapsed - cycle;
      const originX = .08 + phantomNoise(index + seed, cycle, 1) * .84;
      const originY = .61 + phantomNoise(index + seed, cycle, 2) * .31;
      const driftX = (phantomNoise(index + seed, cycle, 3) - .5) * .25;
      const rise = .28 + phantomNoise(index + seed, cycle, 4) * .39;
      const px = x + size * (originX + driftX * phase);
      const py = y + size * (originY - rise * phase);
      const opacity = Math.sin(phase * Math.PI) * (.35 + phantomNoise(index + seed, cycle, 5) * .36);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#f6fbff';
      ctx.shadowColor = '#e7f4ff';
      ctx.shadowBlur = size * .035;
      ctx.beginPath();
      ctx.arc(px, py, size * (.009 + phantomNoise(index + seed, cycle, 6) * .009), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNanoTarget(ctx, x, y, size, timestamp) {
    const pulse = reducedMotion ? .5 : .5 + Math.sin(timestamp / 370) * .5;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const gap = size * .115;
    const reach = size * .335;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    ctx.translate(cx, cy);
    ctx.lineCap = 'round';
    const drawMarks = () => {
      ctx.beginPath();
      ctx.moveTo(-reach, 0); ctx.lineTo(-gap, 0);
      ctx.moveTo(gap, 0); ctx.lineTo(reach, 0);
      ctx.moveTo(0, -reach); ctx.lineTo(0, -gap);
      ctx.moveTo(0, gap); ctx.lineTo(0, reach);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, size * .048, 0, Math.PI * 2);
      ctx.stroke();
    };
    ctx.strokeStyle = '#5d0716';
    ctx.lineWidth = size * .11;
    drawMarks();
    ctx.strokeStyle = '#ff1738';
    ctx.lineWidth = size * .078;
    ctx.shadowColor = '#ff163d';
    ctx.shadowBlur = size * (.13 + pulse * .085);
    drawMarks();
    ctx.strokeStyle = '#ffb3b6';
    ctx.lineWidth = size * .024;
    ctx.shadowBlur = size * .035;
    drawMarks();
    ctx.restore();
  }

  const shockVeins = [
    [[.10,.18],[.31,.27],[.39,.43],[.63,.37],[.83,.53]],
    [[.20,.78],[.39,.61],[.53,.70],[.77,.55]],
    [[.69,.13],[.61,.32],[.73,.42]]
  ];
  function drawElectricShockBlock(ctx, sprite, x, y, size, age, seed = 0) {
    if (!(sprite?.naturalWidth || sprite?.width) || age < 0 || age > 620) return;
    const fade = Math.pow(1 - age / 620, 1.45);
    const flicker = reducedMotion ? .9 : .72 + Math.abs(Math.sin(age / 54 + seed)) * .28;
    const energy = fade * flicker;
    const tick = reducedMotion ? 0 : Math.floor(age / 65);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = energy * .78;
    ctx.filter = 'grayscale(1) invert(1) brightness(2.15) contrast(1.22)';
    ctx.drawImage(sprite, x, y, size, size);
    ctx.filter = 'none';
    ctx.globalAlpha = energy * .43;
    ctx.fillStyle = '#ffe139';
    ctx.fillRect(x, y, size, size);
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    shockVeins.forEach((points, veinIndex) => {
      if (veinIndex === 2 && (tick + seed) % 3 === 0) return;
      ctx.beginPath();
      points.forEach(([px, py], pointIndex) => {
        const jitter = ((tick * 13 + seed * 17 + veinIndex * 23 + pointIndex * 11) % 7 - 3) * .009;
        const bx = x + size * (px + (pointIndex ? jitter : 0));
        const by = y + size * (py - (pointIndex ? jitter * .7 : 0));
        pointIndex ? ctx.lineTo(bx, by) : ctx.moveTo(bx, by);
      });
      ctx.globalAlpha = energy * .85;
      ctx.strokeStyle = '#ffce22';
      ctx.lineWidth = size * .072;
      ctx.shadowColor = '#ffb800';
      ctx.shadowBlur = size * .13;
      ctx.stroke();
      ctx.strokeStyle = '#fffdf0';
      ctx.lineWidth = size * .027;
      ctx.shadowBlur = size * .04;
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawElectricLink(ctx, fromX, fromY, toX, toY, age, seed = 0) {
    if (age < 0 || age > 330) return;
    const reveal = reducedMotion ? 1 : Math.min(1, age / 125);
    const fade = age < 155 ? 1 : Math.max(0, (330 - age) / 175);
    const endX = fromX + (toX - fromX) * reveal;
    const endY = fromY + (toY - fromY) * reveal;
    const dx = endX - fromX, dy = endY - fromY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / distance, normalY = dx / distance;
    const tick = reducedMotion ? 0 : Math.floor(age / 55);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let joint = 0; joint <= 6; joint++) {
      const part = joint / 6;
      const jitter = joint === 0 || joint === 6 ? 0
        : Math.sin(seed * 2.9 + joint * 17.1 + tick * 8.3) * Math.sin(part * Math.PI) * 6;
      const bx = fromX + dx * part + normalX * jitter;
      const by = fromY + dy * part + normalY * jitter;
      joint ? ctx.lineTo(bx, by) : ctx.moveTo(bx, by);
    }
    ctx.globalAlpha = fade * .40;
    ctx.strokeStyle = '#ffaf00';
    ctx.lineWidth = 9;
    ctx.shadowColor = '#ffce20';
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#ffe343';
    ctx.lineWidth = 4.2;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.strokeStyle = '#fffef0';
    ctx.lineWidth = 1.7;
    ctx.shadowBlur = 3;
    ctx.stroke();
    ctx.restore();
  }

  const fractureLines = [
    {stage: 1, width: 1, points: [[.06,.20],[.17,.25],[.20,.23],[.28,.34],[.35,.38],[.39,.33],[.47,.38],[.50,.48],[.59,.47],[.64,.52]]},
    {stage: 1, width: .38, points: [[.39,.33],[.43,.28],[.42,.24],[.51,.17]]},
    {stage: 2, width: .84, points: [[.50,.48],[.45,.57],[.49,.62],[.55,.65],[.51,.72],[.54,.79],[.50,.86]]},
    {stage: 2, width: .46, points: [[.28,.34],[.27,.43],[.21,.45],[.23,.48],[.12,.55]]},
    {stage: 2, width: .53, points: [[.64,.52],[.71,.43],[.69,.38],[.79,.36],[.86,.29]]},
    {stage: 3, width: .77, points: [[.64,.52],[.72,.56],[.73,.61],[.80,.65],[.82,.72],[.95,.77]]},
    {stage: 3, width: .44, points: [[.55,.65],[.63,.70],[.67,.68],[.70,.76],[.68,.88]]},
    {stage: 3, width: .33, points: [[.50,.86],[.44,.88],[.46,.93],[.42,.98]]},
    {stage: 3, width: .39, points: [[.27,.43],[.23,.55],[.24,.61],[.14,.68],[.09,.73]]},
    {stage: 3, width: .30, points: [[.42,.24],[.36,.19],[.38,.14],[.31,.06]]}
  ].map(fracture => {
    const path = new Path2D();
    fracture.points.forEach(([px, py], index) => index ? path.lineTo(px, py) : path.moveTo(px, py));
    return {...fracture, path};
  });
  // One readable fracture palette on dirt, stone, ice and essence alike.
  function drawCrackedBlock(ctx, x, y, size, stage, timestamp, stageChangedAt, seed = 0) {
    const age = Math.max(0, timestamp - stageChangedAt);
    const pulse = reducedMotion ? 0 : Math.max(0, 1 - age / 110);
    ctx.save();
    const opacity = ctx.globalAlpha;
    ctx.beginPath(); ctx.rect(x + size * .04, y + size * .04, size * .92, size * .92); ctx.clip();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate((seed % 4) * Math.PI / 2);
    ctx.scale(size * 1.14, size * 1.14); ctx.translate(-.5, -.5);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const fracture of fractureLines) {
      if (fracture.stage > stage) continue;
      const thickness = Math.max(3.1, size * .057) * fracture.width * (stage === 3 ? 1.18 : 1)
        * (1 + (fracture.stage === stage ? pulse * .18 : 0)) / (size * 1.14);
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = '#071f2d'; ctx.lineWidth = thickness + 1.4 / size; ctx.stroke(fracture.path);
      ctx.save();ctx.translate(-.008,-.008);
      ctx.strokeStyle = '#fff2bd';ctx.lineWidth = Math.max(.8 / size,thickness * .34);ctx.stroke(fracture.path);
      ctx.restore();
    }
    ctx.restore();
  }

  window.BlockEffectDraft = { drawGlitchBlock, drawBurningBlock, drawCrackedBlock,
    drawPhantomBlock, drawNanoTarget, drawElectricShockBlock, drawElectricLink };
})();
