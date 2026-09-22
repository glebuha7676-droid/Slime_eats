(() => {
  'use strict';

  const canvas = document.querySelector('#blockCanvas');
  const ctx = canvas.getContext('2d');
  const damageButton = document.querySelector('#damageButton');
  const fireButton = document.querySelector('#fireButton');
  const restoreButton = document.querySelector('#restoreButton');
  const hpLabel = document.querySelector('#hpLabel');
  const stateLabel = document.querySelector('#stateLabel');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const blockImage = new Image();
  blockImage.src = '../assets/%D0%9C%D0%B8%D1%80%201/%D0%9E%D0%B1%D1%8B%D1%87%D0%BD%D1%8B%D0%B9%20%D0%B1%D0%BB%D0%BE%D0%BA.webp';

  const block = {
    x: 150,
    y: 150,
    size: 340,
    maxHp: 4,
    hp: 4,
    damageStartedAt: -Infinity,
    previousStage: 0,
    fireStartedAt: null,
    scorchStartedAt: null,
    destroyStartedAt: null,
    restoreStartedAt: performance.now(),
    particles: []
  };

  const crackGroups = [
    [
      [[.52,.47],[.47,.55],[.5,.66],[.43,.79]],
      [[.52,.47],[.46,.39],[.44,.27]],
      [[.52,.47],[.63,.51],[.72,.47]],
      [[.47,.55],[.36,.58],[.31,.66]]
    ],
    [
      [[.44,.27],[.51,.18],[.49,.07]],
      [[.52,.47],[.61,.37],[.69,.26],[.72,.12]],
      [[.43,.79],[.5,.86],[.47,.97]],
      [[.31,.66],[.2,.62],[.08,.68]],
      [[.72,.47],[.8,.55],[.94,.53]],
      [[.61,.37],[.58,.28],[.61,.2]],
      [[.5,.66],[.62,.72],[.68,.86]]
    ],
    [
      [[.46,.39],[.35,.32],[.24,.19],[.12,.16]],
      [[.36,.58],[.26,.49],[.13,.48],[.02,.4]],
      [[.2,.62],[.22,.75],[.14,.9]],
      [[.62,.72],[.76,.68],[.88,.75],[.98,.74]],
      [[.69,.26],[.81,.23],[.93,.13]],
      [[.8,.55],[.83,.43],[.96,.36]],
      [[.5,.86],[.6,.92],[.63,1]],
      [[.24,.19],[.27,.08],[.21,0]],
      [[.76,.68],[.78,.82],[.86,.94]]
    ]
  ];

  function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
  function easeOut(value) { return 1 - Math.pow(1 - clamp(value), 3); }
  function easeInOut(value) { const t = clamp(value); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function crackStage() { return Math.min(3, block.maxHp - block.hp); }

  function updateLabels(now) {
    hpLabel.textContent = `${block.hp} / ${block.maxHp}`;
    if (block.destroyStartedAt !== null) stateLabel.textContent = 'РАЗРУШЕН';
    else if (block.fireStartedAt !== null) stateLabel.textContent = 'ГОРИТ';
    else if (block.hp < block.maxHp) stateLabel.textContent = 'ПОВРЕЖДЁН';
    else stateLabel.textContent = now - block.restoreStartedAt < 500 ? 'ВОССТАНОВЛЕН' : 'ЦЕЛЫЙ';
  }

  function spawnImpactParticles() {
    const cx = block.x + block.size * .52;
    const cy = block.y + block.size * .47;
    for (let index = 0; index < 12; index += 1) {
      const angle = Math.PI * 2 * index / 12 + Math.random() * .28;
      const speed = 55 + Math.random() * 80;
      block.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 25,
        size: 3 + Math.random() * 6,
        born: performance.now(),
        life: 360 + Math.random() * 220
      });
    }
  }

  function damage() {
    if (block.destroyStartedAt !== null || block.hp <= 0) return;
    block.previousStage = crackStage();
    block.hp -= 1;
    block.damageStartedAt = performance.now();
    spawnImpactParticles();
    if (block.hp <= 0) {
      block.fireStartedAt = null;
      block.destroyStartedAt = performance.now();
    }
    updateLabels(performance.now());
  }

  function ignite() {
    if (block.destroyStartedAt !== null || block.fireStartedAt !== null) return;
    block.fireStartedAt = performance.now();
    updateLabels(performance.now());
  }

  function restore() {
    block.hp = block.maxHp;
    block.previousStage = 0;
    block.damageStartedAt = -Infinity;
    block.fireStartedAt = null;
    block.scorchStartedAt = null;
    block.destroyStartedAt = null;
    block.restoreStartedAt = performance.now();
    block.particles.length = 0;
    updateLabels(performance.now());
  }

  function tracePartialLine(points, amount) {
    if (amount <= 0 || points.length < 2) return;
    const lengths = [];
    let total = 0;
    for (let index = 1; index < points.length; index += 1) {
      const dx = points[index][0] - points[index - 1][0];
      const dy = points[index][1] - points[index - 1][1];
      const length = Math.hypot(dx, dy);
      lengths.push(length);
      total += length;
    }
    let remaining = total * clamp(amount);
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length && remaining > 0; index += 1) {
      const length = lengths[index - 1];
      if (remaining >= length) {
        ctx.lineTo(points[index][0], points[index][1]);
        remaining -= length;
      } else {
        const ratio = remaining / length;
        ctx.lineTo(
          points[index - 1][0] + (points[index][0] - points[index - 1][0]) * ratio,
          points[index - 1][1] + (points[index][1] - points[index - 1][1]) * ratio
        );
        remaining = 0;
      }
    }
  }

  function drawCracks(now) {
    const stage = crackStage();
    if (!stage) return;
    const reveal = reduceMotion ? 1 : easeOut((now - block.damageStartedAt) / 300);
    const bx = block.x;
    const by = block.y;
    const size = block.size;

    ctx.save();
    ctx.beginPath();
    ctx.rect(bx + 3, by + 3, size - 6, size - 6);
    ctx.clip();
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'butt';

    for (let group = 0; group < stage; group += 1) {
      const groupReveal = group === stage - 1 ? reveal : 1;
      crackGroups[group].forEach((normalized, lineIndex) => {
        const points = normalized.map(([x, y]) => [bx + x * size, by + y * size]);
        const primary = lineIndex < 2;
        const darkWidth = group === 0
          ? (primary ? 5.5 : 4.2)
          : group === 1
            ? (primary ? 4.8 : 3.35)
            : (primary ? 4.1 : 2.65);
        tracePartialLine(points, groupReveal);
        ctx.strokeStyle = 'rgba(21,25,34,.88)';
        ctx.lineWidth = darkWidth;
        ctx.shadowColor = 'rgba(7,10,16,.48)';
        ctx.shadowBlur = primary ? 3 : 1.5;
        ctx.stroke();

        tracePartialLine(points, groupReveal);
        ctx.strokeStyle = 'rgba(7,10,16,.96)';
        ctx.lineWidth = Math.max(1.25, darkWidth * .43);
        ctx.shadowBlur = 0;
        ctx.stroke();

        ctx.save();
        ctx.translate(-1.2, -1.2);
        tracePartialLine(points, groupReveal);
        ctx.strokeStyle = 'rgba(235,241,252,.3)';
        ctx.lineWidth = primary ? 1 : .7;
        ctx.stroke();
        ctx.restore();
      });
    }
    ctx.restore();
  }

  function flamePath(x, baseY, width, height, lean, phase) {
    ctx.beginPath();
    ctx.moveTo(x - width * .5, baseY);
    ctx.bezierCurveTo(x - width * .64, baseY - height * .28, x - width * .22 + lean, baseY - height * .63, x + lean * .45, baseY - height);
    ctx.bezierCurveTo(x + width * .18 + lean, baseY - height * (.72 + phase * .04), x + width * .62, baseY - height * .26, x + width * .5, baseY);
    ctx.closePath();
  }

  function drawFire(now) {
    if (block.fireStartedAt === null) return;
    const age = now - block.fireStartedAt;
    const duration = 4300;
    if (age >= duration) {
      block.fireStartedAt = null;
      block.scorchStartedAt = now;
      damage();
      return;
    }
    const attack = easeOut(age / 320);
    const release = clamp((duration - age) / 520);
    const intensity = attack * release;
    const x = block.x + block.size * .5;
    const baseY = block.y + block.size * .69;
    const r = block.size;
    const flicker = .5 + Math.sin(now / 67) * .5;

    ctx.save();
    ctx.beginPath();
    ctx.rect(block.x + 3, block.y + 3, block.size - 6, block.size - 6);
    ctx.clip();

    const char = ctx.createRadialGradient(x, baseY - r * .12, 0, x, baseY - r * .1, r * .32);
    char.addColorStop(0, `rgba(42,22,20,${.2 + age / duration * .3})`);
    char.addColorStop(.6, `rgba(90,38,22,${.08 + age / duration * .14})`);
    char.addColorStop(1, 'rgba(90,38,22,0)');
    ctx.fillStyle = char;
    ctx.fillRect(block.x, block.y, block.size, block.size);

    ctx.globalCompositeOperation = 'screen';
    const glow = ctx.createRadialGradient(x, baseY - r * .16, 0, x, baseY - r * .12, r * .37);
    glow.addColorStop(0, `rgba(255,238,115,${intensity * .5})`);
    glow.addColorStop(.42, `rgba(255,104,20,${intensity * .27})`);
    glow.addColorStop(1, 'rgba(190,28,12,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(block.x, block.y, block.size, block.size);
    ctx.globalCompositeOperation = 'source-over';

    const flameProfile = [
      { offset: -.24, width: .16, height: .29 },
      { offset: -.115, width: .19, height: .43 },
      { offset: .015, width: .215, height: .51 },
      { offset: .145, width: .18, height: .37 },
      { offset: .255, width: .145, height: .27 }
    ];
    flameProfile.forEach((profile, index) => {
      const phase = now / (125 + index * 11) + index * 1.83;
      const wave = Math.sin(phase);
      const width = r * profile.width;
      const height = r * (profile.height + flicker * .055);
      const centerX = x + profile.offset * r + wave * r * .018;
      const lean = wave * width * .2;

      ctx.globalAlpha = intensity * .93;
      ctx.fillStyle = '#d83216';
      ctx.shadowColor = '#ff4b1d';
      ctx.shadowBlur = 14;
      flamePath(centerX, baseY, width, height, lean, wave);
      ctx.fill();

      ctx.fillStyle = '#ff871d';
      ctx.shadowColor = '#ff9b1f';
      ctx.shadowBlur = 8;
      flamePath(centerX, baseY - 2, width * .66, height * .76, lean * .65, wave);
      ctx.fill();

      ctx.fillStyle = '#ffe66c';
      ctx.shadowColor = '#ffe24f';
      ctx.shadowBlur = 5;
      flamePath(centerX, baseY - 3, width * .31, height * .47, lean * .3, wave);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'screen';
    for (let index = 0; index < 8; index += 1) {
      const phase = (now / (540 + index * 33) + index * .19) % 1;
      const alpha = Math.sin(phase * Math.PI) * intensity;
      const px = x + Math.sin(index * 2.73) * r * .24 + Math.sin(now / 230 + index) * 5;
      const py = baseY - r * (.17 + phase * .55);
      ctx.globalAlpha = alpha * .92;
      ctx.fillStyle = index % 3 ? '#ff9c21' : '#fff09a';
      ctx.shadowColor = '#ff521c';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 1.7 + index % 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.lineCap = 'round';
    for (let index = 0; index < 3; index += 1) {
      const phase = (now / (1500 + index * 170) + index * .31) % 1;
      const smokeAlpha = Math.sin(phase * Math.PI) * intensity * .18;
      ctx.globalAlpha = smokeAlpha;
      ctx.strokeStyle = '#5e6870';
      ctx.lineWidth = 8 - phase * 4;
      ctx.beginPath();
      ctx.moveTo(x + (index - 1) * 25, block.y + block.size * .38);
      ctx.bezierCurveTo(x + Math.sin(now / 410 + index) * 24, block.y + block.size * .25, x - 24 + index * 17, block.y + block.size * .16, x + (index - 1) * 15, block.y + block.size * .07);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawResidualScorch(now) {
    if (block.scorchStartedAt === null) return;
    const age = now - block.scorchStartedAt;
    const alpha = 1 - clamp(age / 900);
    if (alpha <= 0) {
      block.scorchStartedAt = null;
      return;
    }
    const x = block.x + block.size * .5;
    const y = block.y + block.size * .56;
    const scorch = ctx.createRadialGradient(x, y, 0, x, y, block.size * .27);
    scorch.addColorStop(0, `rgba(40,22,21,${alpha * .34})`);
    scorch.addColorStop(.62, `rgba(91,39,23,${alpha * .16})`);
    scorch.addColorStop(1, 'rgba(91,39,23,0)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(block.x + 3, block.y + 3, block.size - 6, block.size - 6);
    ctx.clip();
    ctx.fillStyle = scorch;
    ctx.fillRect(block.x, block.y, block.size, block.size);
    ctx.restore();
  }

  function drawParticles(now) {
    ctx.save();
    for (const particle of block.particles) {
      const age = now - particle.born;
      if (age >= particle.life) continue;
      const t = age / 1000;
      const alpha = 1 - age / particle.life;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#78818e';
      ctx.save();
      ctx.translate(particle.x + particle.vx * t, particle.y + particle.vy * t + 180 * t * t);
      ctx.rotate(t * particle.vx * .025);
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * .72);
      ctx.restore();
    }
    ctx.restore();
    block.particles = block.particles.filter(particle => now - particle.born < particle.life);
  }

  function drawIntactBlock(now, alpha = 1, scale = 1) {
    const impactAge = now - block.damageStartedAt;
    const impact = reduceMotion ? 0 : Math.max(0, Math.sin(clamp(impactAge / 230) * Math.PI)) * .055;
    const restoreAge = now - block.restoreStartedAt;
    const restoreScale = reduceMotion ? 1 : .82 + easeOut(restoreAge / 330) * .18;
    const x = block.x + block.size / 2;
    const y = block.y + block.size / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale((scale - impact) * restoreScale, (scale + impact * .7) * restoreScale);
    ctx.translate(-x, -y);
    if (blockImage.complete && blockImage.naturalWidth) ctx.drawImage(blockImage, block.x, block.y, block.size, block.size);
    else {
      ctx.fillStyle = '#858c98';
      ctx.fillRect(block.x, block.y, block.size, block.size);
    }
    drawCracks(now);
    drawResidualScorch(now);
    drawFire(now);
    ctx.restore();
  }

  function drawDestroyed(now) {
    const age = now - block.destroyStartedAt;
    const breakProgress = easeInOut(age / 650);
    const fade = 1 - clamp((age - 420) / 430);
    const size = block.size / 3;
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 3; column += 1) {
        const index = row * 3 + column;
        const centerX = block.x + (column + .5) * size;
        const centerY = block.y + (row + .5) * size;
        const dx = (column - 1) * (38 + index * 2) * breakProgress;
        const dy = (row - 1) * 26 * breakProgress + 82 * breakProgress * breakProgress;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(centerX + dx, centerY + dy);
        ctx.rotate((column - row) * .12 * breakProgress);
        ctx.drawImage(blockImage, column * blockImage.naturalWidth / 3, row * blockImage.naturalHeight / 3, blockImage.naturalWidth / 3, blockImage.naturalHeight / 3, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
    }
    if (age > 1250) restore();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const shadow = ctx.createRadialGradient(320, 515, 0, 320, 515, 180);
    shadow.addColorStop(0, 'rgba(42,75,70,.2)');
    shadow.addColorStop(1, 'rgba(42,75,70,0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(320, 515, 175, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    if (block.destroyStartedAt === null) drawIntactBlock(now);
    else drawDestroyed(now);
    drawParticles(now);

    updateLabels(now);
  }

  damageButton.addEventListener('click', damage);
  fireButton.addEventListener('click', ignite);
  restoreButton.addEventListener('click', restore);
  updateLabels(performance.now());
  requestAnimationFrame(frame);
})();
