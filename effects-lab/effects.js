(() => {
  'use strict';

  const canvas = document.querySelector('#effectCanvas');
  const ctx = canvas.getContext('2d');
  const effectTabs = [...document.querySelectorAll('.effect-tabs button')];
  const levelButtons = [...document.querySelectorAll('.effect-choice')];
  const stateName = document.querySelector('#stateName');
  const stateIcon = document.querySelector('#stateIcon');
  const stateQuestion = document.querySelector('#stateQuestion');
  const effectTitle = document.querySelector('#effectTitle');
  const controls = document.querySelector('.controls');
  const mixPanel = document.querySelector('.mix-panel');
  const mixSlotButtons = [...document.querySelectorAll('.mix-slots button')];
  const mixPickButtons = [...document.querySelectorAll('.mix-palette button')];
  const motionButtons = [...document.querySelectorAll('[data-motion]')];
  let avatarMotion = { gazeX: 0, gazeY: 0, blink: false, tipSway: 0, emotion: null };
  const drawSlimeAvatar = (target, options) => window.SlimeAvatarRenderer.drawSlimeAvatar(target, {
    ...options,
    appearance: 'cute-v2',
    gazeX: options.gazeX ?? avatarMotion.gazeX,
    gazeY: options.gazeY ?? avatarMotion.gazeY,
    blink: Boolean(options.blink || avatarMotion.blink),
    tipSway: options.tipSway ?? avatarMotion.tipSway,
    emotion: avatarMotion.emotion || options.emotion
  });
  const classic = window.SlimeGameConfig.SKINS[0];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const iconBase = '../assets/ui/recipe-categories/';
  const effectInfo = {
    fire: { icon: 'fire-aligned.png', title: 'Огненная форма', labels: ['1 ОГОНЬ', '2 ОГНЯ', '3 ОГНЯ'], states: ['Огонь в глазах', 'Огненная пимпочка', 'Живой файербол'] },
    gold: { icon: 'gold-aligned.png', title: 'Золотая форма', labels: ['1 ЗОЛОТО', '2 ЗОЛОТА', '3 ЗОЛОТА'], states: ['Золотые блики', 'Золотой слайм', 'Слайм-монета'] },
    frost: { icon: 'frost-aligned.png', title: 'Морозная форма', labels: ['1 МОРОЗ', '2 МОРОЗА', '3 МОРОЗА'], states: ['Лёгкий иней', 'Заснеженный слайм', 'Слайм-снеговик'] },
    weight: { icon: 'weight-aligned.png', title: 'Тяжёлая форма', labels: ['1 ВЕС', '2 ВЕСА', '3 ВЕСА'], states: ['Увеличенный слайм', 'Тяжёлый слайм', 'Сумо-слайм'] },
    electricity: { icon: 'electricity-aligned.png', title: 'Электрическая форма', labels: ['1 РАЗРЯД', '2 РАЗРЯДА', '3 РАЗРЯДА'], states: ['Метка молнии', 'Заряженный слайм', 'Сгусток энергии'] },
    protection: { icon: 'protection-aligned.png', title: 'Защитная форма', labels: ['1 ЩИТ', '2 ЩИТА', '3 ЩИТА'], states: ['Эффект будет позже', 'Форма будет позже', 'Скин будет позже'] },
    mobility: { icon: 'mobility-aligned.png', title: 'Скоростная форма', labels: ['1 СКОРОСТЬ', '2 СКОРОСТИ', '3 СКОРОСТИ'], states: ['Накопление скорости', 'Бур-рывок', 'Бур-машина на 5 секунд'] },
    explosion: { icon: 'explosion-aligned.png', title: 'Взрывная форма', labels: ['1 ВЗРЫВ', '2 ВЗРЫВА', '3 ВЗРЫВА'], states: ['Спящая бомба', 'Горящий фитиль', 'Слайм-бомба'] }
  };
  const effectKeys = Object.keys(effectInfo);
  const mixVisual = Object.fromEntries(effectKeys.map(key => [key, 0]));
  const mixSlots = [null, null, null];
  let activeMixSlot = 0;
  let selectedEffect = 'fire';
  let selectedLevel = 0;
  let visualLevel = 0;
  let lastFrame = 0;
  let motionMode = 'idle';
  let motionStartedAt = 0;

  canvas.width = Math.round(360 * dpr);
  canvas.height = Math.round(420 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;

  const clamp01 = value => Math.max(0, Math.min(1, value));
  const smooth = value => {
    const normalized = clamp01(value);
    return normalized * normalized * (3 - 2 * normalized);
  };

  function mixHex(from, to, amount) {
    const parse = color => [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16));
    const a = parse(from);
    const b = parse(to);
    return `#${a.map((value, index) => Math.round(value + (b[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
  }

  function traceFireWisp(target, x, baseY, length, width, time, phase = 0, lean = 0) {
    const swayA = Math.sin(time / 185 + phase) * length * .085;
    const swayB = Math.sin(time / 245 + phase * 1.7) * length * .065;
    const tipX = x + swayA + lean * length;
    target.beginPath();
    target.moveTo(x - width * .48, baseY);
    target.bezierCurveTo(
      x - width * .72 + swayA * .22,
      baseY - length * .25,
      x - width * .22 - swayB + lean * length * .54,
      baseY - length * .78,
      tipX,
      baseY - length
    );
    target.bezierCurveTo(
      x + width * .34 + swayB + lean * length * .5,
      baseY - length * .74,
      x + width * .7 + swayA * .12,
      baseY - length * .2,
      x + width * .48,
      baseY
    );
    target.quadraticCurveTo(x, baseY + width * .12, x - width * .48, baseY);
    target.closePath();
  }

  function drawFireWisp(target, x, baseY, length, width, time, phase = 0, alpha = 1, lean = 0) {
    target.save();
    target.globalAlpha = alpha;
    target.shadowColor = '#ff4a16';
    target.shadowBlur = Math.max(5, width * .9);
    const outer = target.createLinearGradient(x, baseY, x, baseY - length);
    outer.addColorStop(0, '#ffd83d');
    outer.addColorStop(.45, '#ff7920');
    outer.addColorStop(1, '#df2d20');
    target.fillStyle = outer;
    traceFireWisp(target, x, baseY, length, width, time, phase, lean);
    target.fill();
    target.shadowBlur = 1;
    target.fillStyle = '#fff071';
    traceFireWisp(target, x, baseY - width * .02, length * .68, width * .38, time, phase + .38, lean * .62);
    target.fill();
    target.restore();
  }

  function drawFireEyes(target, x, y, radius, level, time, opacity = 1) {
    const visible = smooth(level);
    if (visible < .01) return;
    const pupilY = y - radius * .105;
    const eyeOffset = radius * .245;

    for (const side of [-1, 1]) {
      const px = x + eyeOffset * side;
      target.save();
      target.beginPath();
      target.ellipse(px, pupilY, radius * .145, radius * .185, 0, 0, Math.PI * 2);
      target.clip();
      drawEyeFlame(target, px, pupilY + radius * .105, radius, time + side * 290, visible * opacity);
      target.restore();
    }
  }

  function drawEyeFlame(target, x, baseY, radius, time, alpha) {
    const t = reduceMotion ? 0 : time / 285;
    const sway = Math.sin(t) * radius * .018 + Math.sin(t * 1.8) * radius * .008;
    const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 1.43) * .055;
    target.save();
    target.translate(x, baseY);
    target.scale(1 / pulse, pulse);
    target.globalAlpha *= alpha;
    target.shadowColor = '#ff631b';
    target.shadowBlur = radius * .055;

    target.fillStyle = '#ef4318';
    target.beginPath();
    target.moveTo(0, 0);
    target.bezierCurveTo(-radius * .082, -radius * .015, -radius * .088, -radius * .105, -radius * .041, -radius * .146);
    target.bezierCurveTo(-radius * .012, -radius * .174, sway * .55, -radius * .19, sway, -radius * .222);
    target.bezierCurveTo(radius * .079 + sway * .35, -radius * .155, radius * .083, -radius * .054, 0, 0);
    target.fill();

    target.shadowBlur = 0;
    target.fillStyle = '#ffad1e';
    target.beginPath();
    target.moveTo(0, -radius * .012);
    target.bezierCurveTo(-radius * .047, -radius * .033, -radius * .045, -radius * .098, -radius * .018, -radius * .126);
    target.bezierCurveTo(radius * .006, -radius * .151, sway * .2, -radius * .164, sway * .23, -radius * .181);
    target.bezierCurveTo(radius * .043, -radius * .126, radius * .046, -radius * .057, 0, -radius * .012);
    target.fill();
    target.fillStyle = '#fff39a';
    target.beginPath();
    target.ellipse(-radius * .008, -radius * .072, radius * .019, radius * .046, -.1, 0, Math.PI * 2);
    target.fill();
    target.restore();
  }

  function drawTipFlame(target, x, y, radius, level, time, opacity = 1) {
    const dominant = smooth(level - 1);
    if (dominant < .01) return;
    const baseY = y - radius * .84;
    drawHeadFlame(target, x, baseY, radius, time, dominant * opacity);
  }

  function drawHeadFlame(target, x, y, radius, time, alpha) {
    const t = reduceMotion ? 0 : time / 620;
    const sway = Math.sin(t) * radius * .035;
    const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 1.45) * .035;
    target.save();
    target.translate(x, y);
    target.scale(1 / pulse, pulse);
    target.globalAlpha *= alpha;
    const w = radius * .205;
    const h = radius * .56;
    const candlePath = (pathW, pathH, tipSway) => {
      target.beginPath();
      target.moveTo(0, radius * .025);
      target.bezierCurveTo(-pathW * .94, 0, -pathW * .86, -pathH * .35, -pathW * .43, -pathH * .59);
      target.bezierCurveTo(-pathW * .08, -pathH * .79, tipSway * .72, -pathH * .91, tipSway, -pathH);
      target.bezierCurveTo(pathW * .48 + tipSway * .55, -pathH * .72, pathW * .82, -pathH * .38, pathW * .82, -pathH * .2);
      target.bezierCurveTo(pathW * .82, -pathH * .045, pathW * .5, radius * .025, 0, radius * .025);
      target.closePath();
    };

    target.shadowColor = '#ff6a18';
    target.shadowBlur = radius * .13;
    const outer = target.createLinearGradient(0, -h, 0, radius * .03);
    outer.addColorStop(0, '#e93c18');
    outer.addColorStop(.55, '#ff6b18');
    outer.addColorStop(1, '#ff9d18');
    target.fillStyle = outer;
    candlePath(w, h, sway);
    target.fill();

    target.shadowBlur = radius * .045;
    target.fillStyle = '#ffb51f';
    candlePath(w * .62, h * .72, sway * .38);
    target.fill();
    target.shadowBlur = 0;
    target.fillStyle = '#fff078';
    candlePath(w * .3, h * .43, sway * .13);
    target.fill();
    target.restore();
  }

  // One connected, rounded flame with a curling tip and a hot nested core.
  function drawLivingFlame(target, x, y, height, width, time, alpha) {
    const t = reduceMotion ? 0 : time / 340;
    const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 1.37) * .075;
    const bend = Math.sin(t) * .24 + Math.sin(t * 1.91) * .07;
    target.save();
    target.translate(x, y);
    target.scale(1 / pulse, pulse);
    target.globalAlpha *= alpha;
    target.shadowColor = '#ff731b';
    target.shadowBlur = width * .24;
    for (let layer = 0; layer < 3; layer++) {
      const s = [1, .73, .4][layer];
      const w = width * s, h = height * [1, .78, .46][layer];
      target.fillStyle = ['#f54b16', '#ffb522', '#fff5a0'][layer];
      target.beginPath();
      target.moveTo(0, height * .025);
      target.bezierCurveTo(-w * .65, 0, -w * .56, -h * .36, -w * .24, -h * .57);
      target.bezierCurveTo(-w * .05, -h * .72, w * bend, -h * .83, w * (.12 + bend), -h);
      target.bezierCurveTo(w * (.58 + bend), -h * .71, w * .1, -h * .61, w * .32, -h * .41);
      target.bezierCurveTo(w * .72, -h * .15, w * .45, height * .025, 0, height * .025);
      target.fill();
      target.shadowBlur = 0;
    }
    target.restore();
  }

  const fireContour = (() => {
    const curves = [
      [0,-1,.15,-.99,.16,-.86,.26,-.79],
      [.26,-.79,.67,-.68,.93,-.31,.91,.16],
      [.91,.16,.88,.68,.5,.92,0,.93],
      [0,.93,-.5,.92,-.88,.68,-.91,.16],
      [-.91,.16,-.93,-.31,-.67,-.68,-.26,-.79],
      [-.26,-.79,-.16,-.86,-.15,-.99,0,-1]
    ];
    return curves.flatMap(c => Array.from({length: 24}, (_, i) => {
      const t = i / 24, u = 1 - t;
      return [u*u*u*c[0]+3*u*u*t*c[2]+3*u*t*t*c[4]+t*t*t*c[6],
        u*u*u*c[1]+3*u*u*t*c[3]+3*u*t*t*c[5]+t*t*t*c[7]];
    }));
  })();

  function contourFlame(target, radius, time, scale, inset = false, insetScale = .93) {
    const t = reduceMotion ? 0 : time / 720;
    target.beginPath();
    fireContour.forEach(([x,y], i) => {
      const angle = Math.atan2(y,x);
      const flow = Math.sin(angle * 7 + t * 2) * .5 + Math.sin(angle * 11 - t * 2.7) * .3 + Math.sin(angle * 4 + t) * .2;
      const heat = (.09 + Math.pow((flow + 1) * .5, 2) * .23) * scale;
      const length = Math.hypot(x,y);
      const px = radius * (x + x / length * heat + Math.sin(angle * 8 + t * 2) * heat * .25);
      const lowerExtension = inset ? Math.pow(Math.max(0, y), 4) * radius * .085 : 0;
      const py = radius * (y + y / length * heat * .5 - heat * (1.05 - y * .5)) + lowerExtension;
      if (!i) target.moveTo(px,py); else target.lineTo(px,py);
    });
    target.closePath();
    if (inset) {
      for (let i = fireContour.length - 1; i >= 0; i--) {
        const [x,y] = fireContour[i];
        if (i === fireContour.length - 1) target.moveTo(x*radius*insetScale,y*radius*insetScale);
        else target.lineTo(x*radius*insetScale,y*radius*insetScale);
      }
      target.closePath();
    }
  }

  function drawContourFire(target, {radius, timestamp}, front = false) {
    target.save();
    target.shadowColor = '#ff641c';
    target.shadowBlur = front ? 5 : 13;
    for (let i = 0; i < 3; i++) {
      target.fillStyle = ['#ee421b','#ff991b','#ffe878'][i];
      const insetScale = [0.84, 0.89, 0.925][i];
      contourFlame(target, radius, timestamp + i * 90, [1,.66,.29][i], front, insetScale);
      target.fill('evenodd');
      target.shadowBlur = 0;
    }
    target.restore();
  }

  function traceFireWreath(target, x, y, radius, time, offset = 0) {
    const leftFlicker = Math.sin(time / 250 + offset) * radius * .035;
    const rightFlicker = Math.sin(time / 290 + offset + 1.8) * radius * .035;
    const bottomPulse = Math.sin(time / 215 + offset * .7) * radius * .025;
    target.beginPath();
    target.moveTo(x - radius * .84 + leftFlicker, y - radius * .62);
    target.bezierCurveTo(
      x - radius * 1.04,
      y - radius * .14,
      x - radius * .95,
      y + radius * .72,
      x,
      y + radius * (.99 + bottomPulse / radius)
    );
    target.bezierCurveTo(
      x + radius * .95,
      y + radius * .72,
      x + radius * 1.04,
      y - radius * .14,
      x + radius * .84 + rightFlicker,
      y - radius * .62
    );
  }

  function drawFireWreathBack(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    const gradient = target.createLinearGradient(x, y + radius, x, y - radius * .7);
    gradient.addColorStop(0, '#fff15a');
    gradient.addColorStop(.46, '#ff8b20');
    gradient.addColorStop(1, '#ef3820');
    target.save();
    target.globalAlpha = amount * .88;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.shadowColor = '#ff4c17';
    target.shadowBlur = 22;
    target.strokeStyle = '#d92820';
    target.lineWidth = radius * .19;
    traceFireWreath(target, x, y, radius, time);
    target.stroke();
    target.shadowBlur = 12;
    target.strokeStyle = gradient;
    target.lineWidth = radius * .105;
    traceFireWreath(target, x, y, radius, time, 1.2);
    target.stroke();
    target.strokeStyle = '#ffe85a';
    target.lineWidth = radius * .032;
    traceFireWreath(target, x, y, radius, time, 2.4);
    target.stroke();
    target.restore();
  }

  function drawFireWreathFront(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    for (let index = 0; index < 14; index += 1) {
      const side = index % 2 === 0 ? -1 : 1;
      const travel = (time / (1120 + (index % 3) * 130) + index * .173) % 1;
      const angle = Math.PI * (.5 - side * travel * .5);
      const px = x + Math.cos(angle) * radius * 1.02;
      const py = y - radius * .5 + Math.sin(angle) * radius * 1.48;
      const waveX = Math.sin(time / 210 + index * 1.9) * radius * .018;
      const alpha = Math.sin(travel * Math.PI) * amount * .92;
      const length = radius * (.31 + (index % 3) * .055);
      const width = radius * (.115 + (index % 2) * .018);
      drawFireWisp(target, px + waveX, py, length, width, time, index * 1.31, alpha, side * (.09 + travel * .06));
    }
  }

  function drawFireUltraBack(target, { radius }) {
    if (!fireUltraImage.complete || !fireUltraImage.naturalWidth) return;
    const size = radius * 2.76;
    target.save();
    target.globalAlpha *= .96;
    target.drawImage(fireUltraImage, -size / 2, -size * .55, size, size);
    target.restore();
  }

  function paintFireUltraBody(target, { radius, timestamp }) {
    const base = target.createRadialGradient(-radius * .25, -radius * .3, radius * .08, 0, 0, radius * 1.16);
    base.addColorStop(0, '#fff881');
    base.addColorStop(.46, '#ffb322');
    base.addColorStop(.78, '#f25a1d');
    base.addColorStop(1, '#a91d22');
    target.fillStyle = base;
    target.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

    if (!fireMaterialImage.complete || !fireMaterialImage.naturalWidth) return;
    const driftX = Math.sin(timestamp / 720) * radius * .11;
    const driftY = Math.sin(timestamp / 930 + .8) * radius * .075;
    const size = radius * 2.5;
    target.save();
    target.globalAlpha *= .72;
    target.drawImage(fireMaterialImage, -size / 2 + driftX, -size / 2 + driftY, size, size);
    target.globalCompositeOperation = 'screen';
    target.globalAlpha *= .34;
    target.translate(-driftX * .5, driftY * .35);
    target.scale(-1, 1);
    target.drawImage(fireMaterialImage, -size / 2, -size / 2, size, size);
    target.restore();
  }

  function drawFireUltraFront(target, { radius }) {
    if (!fireUltraImage.complete || !fireUltraImage.naturalWidth) return;
    const sourceW = fireUltraImage.naturalWidth;
    const sourceH = fireUltraImage.naturalHeight;
    const size = radius * 2.76;
    const top = -size * .55;
    const lowerY = sourceH * .675;
    const lowerH = sourceH - lowerY;
    const sideY = sourceH * .27;
    const sideH = sourceH * .48;
    const sideW = sourceW * .23;
    target.save();
    target.globalAlpha *= .9;
    target.drawImage(fireUltraImage, 0, lowerY, sourceW, lowerH, -size / 2, top + size * lowerY / sourceH, size, size * lowerH / sourceH);
    target.drawImage(fireUltraImage, 0, sideY, sideW, sideH, -size / 2, top + size * sideY / sourceH, size * sideW / sourceW, size * sideH / sourceH);
    target.drawImage(fireUltraImage, sourceW - sideW, sideY, sideW, sideH, size / 2 - size * sideW / sourceW, top + size * sideY / sourceH, size * sideW / sourceW, size * sideH / sourceH);
    target.restore();
  }

  function fireUltraMotion(time, amount) {
    return { y: 0, scaleX: 1, scaleY: 1, rotation: 0, emotion: 'neutral' };
  }

  function paintGoldBody(target, { radius, timestamp, colors }, amount = 1) {
    const base = target.createRadialGradient(-radius * .3, -radius * .38, radius * .08, 0, 0, radius * 1.14);
    base.addColorStop(0, colors[0]);
    base.addColorStop(.56, colors[1]);
    base.addColorStop(1, colors[2]);
    target.fillStyle = base;
    target.fillRect(-radius * 1.25, -radius * 1.25, radius * 2.5, radius * 2.5);

    target.save();
    target.globalAlpha *= amount;
    target.rotate(-.28);
    const sweepX = ((timestamp % 3100) / 3100) * radius * 4.2 - radius * 2.1;
    const sheen = target.createLinearGradient(sweepX - radius * .34, 0, sweepX + radius * .34, 0);
    sheen.addColorStop(0, 'rgba(255,255,210,0)');
    sheen.addColorStop(.3, 'rgba(255,244,135,.28)');
    sheen.addColorStop(.48, 'rgba(255,255,245,.94)');
    sheen.addColorStop(.62, 'rgba(255,218,70,.42)');
    sheen.addColorStop(1, 'rgba(255,190,25,0)');
    target.fillStyle = sheen;
    target.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 4);
    target.restore();
  }

  function drawGoldSparkles(target, x, y, radius, amount, time, boost = 0) {
    if (amount < .01) return;
    const points = [[-.62,-.53],[.57,-.62],[.72,.18],[-.7,.27],[.36,.69],[-.27,.72]];
    points.forEach(([px, py], index) => {
      const phase = (time / (1370 + index * 97) + index * .19) % 1;
      const flash = Math.pow(Math.sin(phase * Math.PI), 18);
      if (flash < .06) return;
      const size = radius * (.055 + flash * (.105 + boost * .025));
      target.save();
      target.translate(x + px * radius, y + py * radius);
      target.rotate(time / 2400 + index * .8);
      target.globalAlpha = amount * (.35 + flash * .65);
      target.shadowColor = '#ffbe18';
      target.shadowBlur = size * 1.4;
      target.fillStyle = '#fff7a8';
      target.strokeStyle = '#d77a06';
      target.lineWidth = Math.max(1, radius * .014);
      target.beginPath();
      for (let point = 0; point < 8; point += 1) {
        const angle = -Math.PI / 2 + point * Math.PI / 4;
        const length = point % 2 ? size * .22 : size;
        const sx = Math.cos(angle) * length;
        const sy = Math.sin(angle) * length;
        if (!point) target.moveTo(sx, sy); else target.lineTo(sx, sy);
      }
      target.closePath();
      target.fill();
      target.stroke();
      target.restore();
    });
  }

  function drawHeadCoin(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    const coinRadius = radius * .205;
    const bob = reduceMotion ? 0 : Math.sin(time / 520) * radius * .012;
    target.save();
    target.translate(x + radius * .11, y - radius * .94 + bob);
    target.rotate(-.12 + Math.sin(time / 800) * .025);
    target.globalAlpha *= amount;
    target.shadowColor = '#c66b05';
    target.shadowBlur = radius * .075;
    const coin = target.createRadialGradient(-coinRadius * .35, -coinRadius * .42, coinRadius * .08, 0, 0, coinRadius);
    coin.addColorStop(0, '#fff5a0');
    coin.addColorStop(.46, '#ffd438');
    coin.addColorStop(1, '#e28a08');
    target.fillStyle = coin;
    target.strokeStyle = '#9a5705';
    target.lineWidth = radius * .047;
    target.beginPath();
    target.arc(0, 0, coinRadius, 0, Math.PI * 2);
    target.fill();
    target.stroke();
    target.shadowBlur = 0;
    target.strokeStyle = '#fff08a';
    target.lineWidth = radius * .018;
    target.beginPath();
    target.arc(0, 0, coinRadius * .72, 0, Math.PI * 2);
    target.stroke();
    target.fillStyle = '#b96a07';
    target.font = `900 ${Math.round(radius * .21)}px Arial`;
    target.textAlign = 'center';
    target.textBaseline = 'middle';
    target.fillText('★', 0, radius * .006);
    target.restore();
  }

  function traceCoinPolygon(target, radius, scale = 1) {
    const sides = 14;
    target.beginPath();
    for (let index = 0; index < sides; index += 1) {
      const angle = -Math.PI / 2 + index / sides * Math.PI * 2;
      const px = Math.cos(angle) * radius * scale;
      const py = Math.sin(angle) * radius * scale;
      if (!index) target.moveTo(px, py); else target.lineTo(px, py);
    }
    target.closePath();
  }

  function drawGoldCoinBack(target, { radius }) {
    target.save();
    const rim = target.createRadialGradient(-radius * .3, -radius * .35, radius * .08, 0, 0, radius);
    rim.addColorStop(0, '#fff099');
    rim.addColorStop(.48, '#e9a51a');
    rim.addColorStop(1, '#a85a05');
    target.fillStyle = rim;
    target.strokeStyle = '#7e4305';
    target.lineWidth = radius * .09;
    target.beginPath();
    target.arc(0, 0, radius * 1.01, 0, Math.PI * 2);
    target.fill();
    target.stroke();
    target.restore();
  }

  function drawGoldCoinFront(target, { radius }) {
    target.save();
    target.lineJoin = 'round';
    target.strokeStyle = '#ffd64a';
    target.lineWidth = radius * .085;
    target.beginPath();
    target.arc(0, 0, radius * .895, 0, Math.PI * 2);
    target.stroke();
    target.strokeStyle = '#fff19a';
    target.lineWidth = radius * .025;
    target.beginPath();
    target.arc(0, 0, radius * .82, 0, Math.PI * 2);
    target.stroke();
    for (let index = 0; index < 14; index += 1) {
      const angle = -Math.PI / 2 + index / 14 * Math.PI * 2;
      target.strokeStyle = index % 2 ? 'rgba(255,243,145,.85)' : 'rgba(164,88,4,.5)';
      target.lineWidth = radius * .018;
      target.beginPath();
      target.moveTo(Math.cos(angle) * radius * .84, Math.sin(angle) * radius * .84);
      target.lineTo(Math.cos(angle) * radius * .96, Math.sin(angle) * radius * .96);
      target.stroke();
    }
    target.restore();
  }

  function drawGoldForm(level, time, x, y, radius) {
    const sparkleAmount = smooth(level);
    const dominant = smooth(level - 1);
    const ultra = smooth(level - 2);
    const goldColors = ['#fff3a0', '#f6b821', '#b96808'];
    const colors = classic.colors.map((color, index) => mixHex(color, goldColors[index], dominant));
    const baseAlpha = 1 - ultra;

    if (baseAlpha > .01) {
      drawSlimeAvatar(ctx, {
        x, y, radius, skin: classic.id, colors, emotion: 'neutral',
        alpha: baseAlpha, timestamp: time,
        bodyPaint: dominant > .01 ? (target, state) => paintGoldBody(target, state, dominant) : null
      });
    }
    if (ultra > .01) {
      drawSlimeAvatar(ctx, {
        x, y, radius, skin: 'coin', colors: goldColors, emotion: 'neutral',
        alpha: ultra, timestamp: time, outlineColor: '#8d4d05',
        bodyPaint: (target, state) => paintGoldBody(target, state, 1),
        backLayer: drawGoldCoinBack,
        frontLayer: drawGoldCoinFront,
        bodyHighlight: false
      });
    }
    drawGoldSparkles(ctx, x, y, radius, sparkleAmount, time, ultra);
  }

  function drawFrostRim(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    target.save();
    target.globalAlpha = amount;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.shadowColor = '#7fdcff';
    target.shadowBlur = radius * .035;
    const frost = target.createLinearGradient(0, y + radius * .08, 0, y + radius * .96);
    frost.addColorStop(0, 'rgba(90,190,226,.18)');
    frost.addColorStop(.3, 'rgba(101,205,239,.72)');
    frost.addColorStop(.72, '#bdefff');
    frost.addColorStop(1, '#effdff');
    target.strokeStyle = frost;
    target.lineWidth = Math.max(3, radius * .09);
    target.beginPath();
    target.moveTo(x + radius * .91, y + radius * .11);
    target.bezierCurveTo(x + radius * .88, y + radius * .68, x + radius * .5, y + radius * .92, x, y + radius * .93);
    target.bezierCurveTo(x - radius * .5, y + radius * .92, x - radius * .88, y + radius * .68, x - radius * .91, y + radius * .11);
    target.stroke();

    target.restore();
  }

  function paintFrostBody(target, { radius, colors }, amount) {
    const base = target.createRadialGradient(-radius * .25, -radius * .35, radius * .12, 0, 0, radius * 1.1);
    base.addColorStop(0, colors[0]);
    base.addColorStop(.58, colors[1]);
    base.addColorStop(1, colors[2]);
    target.fillStyle = base;
    target.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

    const frozenBottom = target.createLinearGradient(0, -radius * .15, 0, radius);
    frozenBottom.addColorStop(0, 'rgba(126,214,242,0)');
    frozenBottom.addColorStop(.24, `rgba(118,210,240,${amount * .18})`);
    frozenBottom.addColorStop(.5, `rgba(128,218,245,${amount * .48})`);
    frozenBottom.addColorStop(.76, `rgba(193,242,255,${amount * .78})`);
    frozenBottom.addColorStop(1, `rgba(239,253,255,${amount * .94})`);
    target.fillStyle = frozenBottom;
    target.fillRect(-radius * 1.05, -radius * .15, radius * 2.1, radius * 1.2);
  }

  function drawColdCheeksAndBreath(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    target.save();
    target.globalAlpha = amount * .5;
    target.fillStyle = '#65c9f4';
    target.beginPath();
    target.ellipse(x - radius * .45, y + radius * .14, radius * .14, radius * .075, 0, 0, Math.PI * 2);
    target.ellipse(x + radius * .45, y + radius * .14, radius * .14, radius * .075, 0, 0, Math.PI * 2);
    target.fill();
    for (let index = 0; index < 3; index += 1) {
      const phase = (time / 1900 + index * .29) % 1;
      const driftX = radius * (.14 + phase * .36);
      const driftY = -radius * (.02 + phase * .13) + Math.sin(phase * Math.PI * 2) * radius * .02;
      target.globalAlpha = amount * Math.sin(phase * Math.PI) * .32;
      target.fillStyle = '#e8fbff';
      target.beginPath();
      target.ellipse(x + driftX, y + radius * .22 + driftY, radius * (.035 + phase * .035), radius * (.022 + phase * .02), 0, 0, Math.PI * 2);
      target.fill();
    }
    target.restore();
  }

  function drawSnowCap(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    const wobble = reduceMotion ? 0 : Math.sin(time / 1100) * radius * .008;
    target.save();
    target.translate(x, y + wobble);
    target.globalAlpha *= amount;
    target.shadowColor = '#78ccec';
    target.shadowBlur = radius * .055;
    const snow = target.createLinearGradient(0, -radius, 0, -radius * .48);
    snow.addColorStop(0, '#ffffff');
    snow.addColorStop(.68, '#dff7ff');
    snow.addColorStop(1, '#8fdaf4');
    target.fillStyle = snow;
    target.strokeStyle = '#5eadd1';
    target.lineWidth = radius * .028;
    target.beginPath();
    target.moveTo(-radius * .57, -radius * .58);
    target.bezierCurveTo(-radius * .47, -radius * .74, -radius * .25, -radius * .77, -radius * .12, -radius * .9);
    target.bezierCurveTo(-radius * .055, -radius * 1.01, radius * .02, -radius * 1.08, radius * .11, -radius * .94);
    target.bezierCurveTo(radius * .22, -radius * .8, radius * .48, -radius * .78, radius * .58, -radius * .58);
    target.bezierCurveTo(radius * .42, -radius * .5, radius * .29, -radius * .55, radius * .18, -radius * .5);
    target.bezierCurveTo(radius * .03, -radius * .43, -radius * .08, -radius * .57, -radius * .2, -radius * .49);
    target.bezierCurveTo(-radius * .34, -radius * .42, -radius * .44, -radius * .54, -radius * .57, -radius * .58);
    target.closePath();
    target.fill();
    target.stroke();
    target.restore();
  }

  function drawSnowfall(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    const flakes = [-.55,-.31,-.08,.18,.42,.61];
    flakes.forEach((offset, index) => {
      const phase = (time / (1700 + index * 83) + index * .16) % 1;
      const px = x + radius * (offset + Math.sin(phase * Math.PI * 2 + index) * .055);
      const py = y - radius * .68 + phase * radius * 1.35;
      const size = radius * (.025 + (index % 3) * .006);
      target.save();
      target.translate(px, py);
      target.rotate(phase * Math.PI + index);
      target.globalAlpha = amount * Math.sin(phase * Math.PI) * .9;
      target.strokeStyle = '#e9fbff';
      target.shadowColor = '#5fc6ef';
      target.shadowBlur = radius * .035;
      target.lineWidth = radius * .016;
      for (let arm = 0; arm < 3; arm += 1) {
        const angle = arm * Math.PI / 3;
        target.beginPath();
        target.moveTo(-Math.cos(angle) * size, -Math.sin(angle) * size);
        target.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
        target.stroke();
      }
      target.restore();
    });
  }

  function drawSnowman(target, x, y, radius, amount) {
    if (amount < .01) return;
    const twigLayer = (layerTarget, { radius: layerRadius }) => {
      layerTarget.save();
      layerTarget.strokeStyle = '#55301d';
      layerTarget.shadowColor = 'rgba(61,31,16,.28)';
      layerTarget.shadowBlur = layerRadius * .025;
      layerTarget.lineCap = 'round';
      layerTarget.lineJoin = 'round';
      for (const side of [-1, 1]) {
        layerTarget.lineWidth = layerRadius * .065;
        layerTarget.beginPath();
        layerTarget.moveTo(side * layerRadius * .76, layerRadius * .08);
        layerTarget.lineTo(side * layerRadius * 1.3, -layerRadius * .25);
        layerTarget.stroke();
        layerTarget.lineWidth = layerRadius * .035;
        layerTarget.beginPath();
        layerTarget.moveTo(side * layerRadius * 1.06, -layerRadius * .1);
        layerTarget.lineTo(side * layerRadius * 1.13, -layerRadius * .43);
        layerTarget.moveTo(side * layerRadius * 1.11, -layerRadius * .13);
        layerTarget.lineTo(side * layerRadius * 1.34, -layerRadius * .04);
        layerTarget.stroke();
      }
      layerTarget.restore();
    };

    drawSlimeAvatar(target, {
      x, y, radius, skin: classic.id, colors: ['#ffffff', '#d8f5ff', '#58afd4'],
      emotion: 'neutral', alpha: amount, outlineColor: '#285b82',
      backLayer: twigLayer, bodyHighlight: true
    });

    target.save();
    target.translate(x, y);
    target.globalAlpha *= amount;
    const carrot = target.createLinearGradient(0, 0, radius * .4, 0);
    carrot.addColorStop(0, '#ffc238');
    carrot.addColorStop(1, '#f06410');
    target.fillStyle = carrot;
    target.strokeStyle = '#8b3d09';
    target.lineWidth = radius * .027;
    target.beginPath();
    target.moveTo(-radius * .025, -radius * .015);
    target.quadraticCurveTo(radius * .11, -radius * .005, radius * .29, radius * .035);
    target.quadraticCurveTo(radius * .12, radius * .09, radius * .015, radius * .095);
    target.closePath();
    target.fill();
    target.stroke();
    target.strokeStyle = 'rgba(166,75,10,.7)';
    target.lineWidth = radius * .013;
    target.beginPath();
    target.moveTo(radius * .09, radius * .018);
    target.lineTo(radius * .13, radius * .045);
    target.moveTo(radius * .17, radius * .035);
    target.lineTo(radius * .2, radius * .057);
    target.stroke();

    target.fillStyle = '#203149';
    target.strokeStyle = '#78d3ef';
    target.lineWidth = radius * .014;
    [.45,.7].forEach(buttonY => {
      target.beginPath();
      target.arc(0, radius * buttonY, radius * .061, 0, Math.PI * 2);
      target.fill();
      target.stroke();
    });
    target.restore();
  }

  function drawFrostForm(level, time, x, y, radius) {
    const frostAmount = smooth(level);
    const dominant = smooth(level - 1);
    const ultra = smooth(level - 2);
    const frostColors = ['#eaffff', '#69cdef', '#2694c8'];
    const colors = classic.colors.map((color, index) => mixHex(color, frostColors[index], dominant));
    const baseAlpha = 1 - ultra;
    if (baseAlpha > .01) {
      drawSlimeAvatar(ctx, {
        x, y, radius, skin: classic.id, colors, emotion: 'neutral', alpha: baseAlpha, timestamp: time,
        bodyPaint: (target, state) => paintFrostBody(target, state, frostAmount)
      });
      drawFrostRim(ctx, x, y, radius, frostAmount * baseAlpha, time);
      drawColdCheeksAndBreath(ctx, x, y, radius, frostAmount * baseAlpha, time);
      drawSnowCap(ctx, x, y, radius, dominant * baseAlpha, time);
      drawSnowfall(ctx, x, y, radius, dominant * baseAlpha, time);
    }
    drawSnowman(ctx, x, y, radius, ultra);
  }

  function drawSumoHeadband(target, { radius }) {
    target.save();
    target.lineJoin = 'round';
    target.shadowColor = 'rgba(115,25,28,.28)';
    target.shadowBlur = radius * .025;
    const band = target.createLinearGradient(0, -radius * .68, 0, -radius * .39);
    band.addColorStop(0, '#ff6963');
    band.addColorStop(.5, '#e5383f');
    band.addColorStop(1, '#a92130');
    target.fillStyle = band;
    target.strokeStyle = '#782035';
    target.lineWidth = radius * .025;
    target.beginPath();
    target.moveTo(-radius * .72, -radius * .57);
    target.quadraticCurveTo(-radius * .36, -radius * .7, 0, -radius * .7);
    target.quadraticCurveTo(radius * .36, -radius * .7, radius * .72, -radius * .57);
    target.lineTo(radius * .68, -radius * .39);
    target.quadraticCurveTo(radius * .34, -radius * .5, 0, -radius * .51);
    target.quadraticCurveTo(-radius * .34, -radius * .5, -radius * .68, -radius * .39);
    target.closePath();
    target.fill();
    target.stroke();

    target.globalAlpha = .62;
    target.strokeStyle = '#ff9b91';
    target.lineWidth = radius * .018;
    target.beginPath();
    target.moveTo(-radius * .57, -radius * .58);
    target.quadraticCurveTo(0, -radius * .67, radius * .5, -radius * .57);
    target.stroke();
    target.globalAlpha = 1;

    target.beginPath();
    target.arc(radius * .69, -radius * .48, radius * .09, 0, Math.PI * 2);
    target.fill();
    target.stroke();
    target.beginPath();
    target.moveTo(radius * .72, -radius * .43);
    target.quadraticCurveTo(radius * .92, -radius * .31, radius * .82, -radius * .12);
    target.lineTo(radius * .66, -radius * .39);
    target.closePath();
    target.fill();
    target.stroke();
    target.restore();
  }

  function drawWeightForm(level, time, x, y, radius) {
    const grown = smooth(level);
    const heavy = smooth(level - 1);
    const sumo = smooth(level - 2);
    const scaleX = 1 + grown * .1 + heavy * .12 + sumo * .08;
    const scaleY = 1 + grown * .05 + heavy * .035 + sumo * .025;
    const groundedY = y - radius * .93 * (scaleY - 1);
    drawSlimeAvatar(ctx, {
      x, y: groundedY, radius, skin: classic.id, colors: classic.colors,
      emotion: 'neutral', scaleX, scaleY, timestamp: time,
      frontLayer: sumo > .01 ? drawSumoHeadband : null
    });
  }

  function traceElectricBolt(target, points) {
    target.beginPath();
    points.forEach(([px, py], index) => {
      if (!index) target.moveTo(px, py);
      else target.lineTo(px, py);
    });
  }

  function strokeElectricBolt(target, points, alpha, radius, hot = false) {
    if (alpha < .015) return;
    target.save();
    target.globalAlpha *= alpha;
    target.lineCap = 'round';
    target.lineJoin = 'round';
    target.shadowColor = hot ? '#6ffaff' : '#45a7ff';
    target.shadowBlur = radius * .075;
    target.strokeStyle = hot ? '#69efff' : '#4ea9ff';
    target.lineWidth = radius * .052;
    traceElectricBolt(target, points);
    target.stroke();
    target.shadowBlur = radius * .025;
    target.strokeStyle = hot ? '#fffaa1' : '#dffaff';
    target.lineWidth = radius * .018;
    target.stroke();
    target.restore();
  }

  function drawLightningMark(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    target.save();
    target.translate(x, y);
    target.globalAlpha *= amount;
    target.shadowColor = '#ffd51f';
    target.shadowBlur = radius * .13;
    target.fillStyle = '#ffe026';
    target.strokeStyle = '#b87405';
    target.lineWidth = radius * .025;
    target.lineJoin = 'round';
    target.beginPath();
    target.moveTo(radius * .035, -radius * .17);
    target.lineTo(-radius * .105, radius * .005);
    target.lineTo(-radius * .01, radius * .005);
    target.lineTo(-radius * .075, radius * .18);
    target.lineTo(radius * .12, -radius * .045);
    target.lineTo(radius * .025, -radius * .045);
    target.closePath();
    target.fill();
    target.stroke();
    target.restore();
  }

  function drawBodyElectricity(target, x, y, radius, amount, time, intense = false) {
    if (amount < .01) return;
    const paths = [
      [[-.7,-.28],[-.53,-.2],[-.64,-.06],[-.43,.02]],
      [[.69,-.21],[.49,-.1],[.61,.02],[.43,.16]],
      [[-.58,.38],[-.39,.3],[-.47,.5],[-.22,.58]],
      [[.58,.34],[.39,.31],[.47,.49],[.23,.59]]
    ];
    paths.forEach((path, index) => {
      const pulseBase = Math.max(0, Math.sin(time / (215 + index * 23) + index * 1.7));
      const pulse = intense ? .45 + pulseBase * .55 : Math.pow(pulseBase, 12);
      const jitter = reduceMotion ? 0 : Math.sin(time / 80 + index) * radius * .018;
      const points = path.map(([px, py], pointIndex) => [x + px * radius + (pointIndex % 2 ? jitter : -jitter), y + py * radius]);
      strokeElectricBolt(target, points, amount * pulse, radius, intense);
    });
  }

  function drawElectricAura(target, x, y, radius, amount, time, sphere = false) {
    if (amount < .01) return;
    target.save();
    target.globalAlpha = amount;
    const glow = target.createRadialGradient(x, y, radius * .5, x, y, radius * (sphere ? 1.42 : 1.23));
    glow.addColorStop(0, 'rgba(114,238,255,.16)');
    glow.addColorStop(.58, 'rgba(69,156,255,.24)');
    glow.addColorStop(1, 'rgba(70,111,255,0)');
    target.fillStyle = glow;
    target.beginPath();
    target.arc(x, y, radius * (sphere ? 1.43 : 1.25), 0, Math.PI * 2);
    target.fill();

    target.restore();
  }

  function drawElectricSparks(target, x, y, radius, amount, time, intense = false) {
    if (amount < .01) return;
    const count = intense ? 12 : 6;
    for (let index = 0; index < count; index += 1) {
      const duration = (intense ? 470 : 760) + index * 31;
      const phase = (time / duration + index * .337) % 1;
      const activePart = intense ? .72 : .5;
      const life = phase < activePart ? Math.sin(phase / activePart * Math.PI) : 0;
      if (life < .06) continue;
      const angle = index * 2.399 + Math.sin(index * 4.17) * .22;
      const travel = phase / activePart;
      const startDistance = radius * (.79 + travel * .18);
      const endDistance = radius * (.98 + travel * (intense ? .62 : .35));
      const tangentX = Math.cos(angle + Math.PI / 2);
      const tangentY = Math.sin(angle + Math.PI / 2);
      const jag = radius * (.055 + (index % 3) * .014);
      const pointAt = (distance, offset) => [
        x + Math.cos(angle) * distance + tangentX * offset,
        y + Math.sin(angle) * distance + tangentY * offset
      ];
      const points = [
        pointAt(startDistance, 0),
        pointAt(startDistance + (endDistance - startDistance) * .34, jag),
        pointAt(startDistance + (endDistance - startDistance) * .67, -jag * .72),
        pointAt(endDistance, 0)
      ];
      target.save();
      target.globalAlpha = amount * life;
      target.lineCap = 'round';
      target.lineJoin = 'round';
      target.shadowColor = '#ffd51c';
      target.shadowBlur = radius * (intense ? .11 : .075);
      target.strokeStyle = '#ffc91f';
      target.lineWidth = radius * (intense ? .055 : .045);
      traceElectricBolt(target, points);
      target.stroke();
      target.shadowBlur = radius * .025;
      target.strokeStyle = '#fff7a0';
      target.lineWidth = radius * .017;
      target.stroke();
      target.restore();
    }
  }

  function paintEnergySphere(target, { radius, timestamp }) {
    const energy = target.createRadialGradient(-radius * .18, -radius * .28, radius * .04, 0, 0, radius * 1.08);
    energy.addColorStop(0, '#afeef5');
    energy.addColorStop(.32, '#86ddea');
    energy.addColorStop(.68, '#63bedb');
    energy.addColorStop(1, '#4d8fbc');
    target.fillStyle = energy;
    target.fillRect(-radius * 1.1, -radius * 1.1, radius * 2.2, radius * 2.2);

    target.save();
    const angle = timestamp / 1320;
    const px = Math.cos(angle) * radius * .43;
    const py = Math.sin(angle * 1.27) * radius * .34;
    const halo = target.createRadialGradient(px, py, 0, px, py, radius * .43);
    halo.addColorStop(0, 'rgba(34,91,209,.92)');
    halo.addColorStop(.42, 'rgba(35,135,229,.68)');
    halo.addColorStop(1, 'rgba(39,164,233,0)');
    target.fillStyle = halo;
    target.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

    target.globalCompositeOperation = 'screen';
    const core = target.createRadialGradient(px, py, 0, px, py, radius * .32);
    core.addColorStop(0, 'rgba(255,255,255,.98)');
    core.addColorStop(.2, 'rgba(224,255,255,.98)');
    core.addColorStop(.52, 'rgba(40,235,255,.88)');
    core.addColorStop(.78, 'rgba(54,135,255,.42)');
    core.addColorStop(1, 'rgba(52,123,233,0)');
    target.fillStyle = core;
    target.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
    target.restore();
  }

  function drawEnergyTendrils(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    const count = 8;
    const random = seed => {
      const value = Math.sin(seed * 91.713) * 43758.5453;
      return value - Math.floor(value);
    };
    for (let index = 0; index < count; index += 1) {
      const duration = 520 + index * 31;
      const timeline = time / duration + index * .347;
      const cycle = Math.floor(timeline);
      const phase = timeline - cycle;
      const attack = Math.min(1, phase / .13);
      const fade = Math.max(0, 1 - (phase - .13) / .57);
      const life = attack * fade;
      if (life < .055) continue;

      const seed = cycle * 17 + index * 31;
      const angle = random(seed + 1) * Math.PI * 2;
      const turn = random(seed + 2) > .5 ? 1 : -1;
      const radialX = Math.cos(angle);
      const radialY = Math.sin(angle);
      const tangentX = -radialY * turn;
      const tangentY = radialX * turn;
      const startRadius = radius * (.89 + random(seed + 3) * .025);
      const reach = radius * (1.09 + random(seed + 4) * .32);
      const bend = radius * (.08 + random(seed + 5) * .14);
      const start = [x + radialX * startRadius, y + radialY * startRadius];
      const joint1 = [x + radialX * (startRadius + (reach - startRadius) * .34) + tangentX * bend, y + radialY * (startRadius + (reach - startRadius) * .34) + tangentY * bend];
      const joint2 = [x + radialX * (startRadius + (reach - startRadius) * .68) - tangentX * bend * .55, y + radialY * (startRadius + (reach - startRadius) * .68) - tangentY * bend * .55];
      const end = [x + radialX * reach + tangentX * bend * .18, y + radialY * reach + tangentY * bend * .18];

      const trace = () => {
        target.beginPath();
        target.moveTo(start[0], start[1]);
        target.lineTo(joint1[0], joint1[1]);
        target.lineTo(joint2[0], joint2[1]);
        target.lineTo(end[0], end[1]);
      };

      target.save();
      target.globalCompositeOperation = 'screen';
      target.globalAlpha = amount * life;
      target.lineCap = 'round';
      target.lineJoin = 'round';
      target.shadowColor = '#38dfff';
      target.shadowBlur = radius * .13;
      const boltFade = target.createLinearGradient(start[0], start[1], end[0], end[1]);
      boltFade.addColorStop(0, 'rgba(126,244,255,.5)');
      boltFade.addColorStop(.18, 'rgba(42,210,255,1)');
      boltFade.addColorStop(.76, 'rgba(118,240,255,.82)');
      boltFade.addColorStop(1, 'rgba(222,255,255,0)');
      target.strokeStyle = boltFade;
      target.lineWidth = radius * .052;
      trace();
      target.stroke();
      target.shadowBlur = radius * .035;
      const coreFade = target.createLinearGradient(start[0], start[1], end[0], end[1]);
      coreFade.addColorStop(0, 'rgba(231,255,255,.66)');
      coreFade.addColorStop(.2, 'rgba(239,255,255,1)');
      coreFade.addColorStop(.82, 'rgba(181,249,255,.9)');
      coreFade.addColorStop(1, 'rgba(255,255,255,0)');
      target.strokeStyle = coreFade;
      target.lineWidth = radius * .016;
      target.stroke();

      if (reach > radius * 1.25) {
        const branchLength = radius * (.08 + random(seed + 6) * .07);
        target.beginPath();
        target.moveTo(joint2[0], joint2[1]);
        target.lineTo(joint2[0] + tangentX * branchLength, joint2[1] + tangentY * branchLength);
        target.stroke();
      }
      target.restore();
    }
  }

  function drawElectricForm(level, time, x, y, radius) {
    const marked = smooth(level);
    const charged = smooth(level - 1);
    const ultra = smooth(level - 2);
    const chargedColors = ['#edffff', '#70e8f6', '#347ad9'];
    const colors = classic.colors.map((color, index) => mixHex(color, chargedColors[index], charged));
    const baseAlpha = 1 - ultra;

    drawElectricAura(ctx, x, y, radius, charged * baseAlpha, time, false);
    if (baseAlpha > .01) {
      drawSlimeAvatar(ctx, { x, y, radius, skin: classic.id, colors, emotion: 'neutral', alpha: baseAlpha, timestamp: time });
      drawLightningMark(ctx, x, y - radius * .56, radius, marked * baseAlpha, time);
      drawElectricSparks(ctx, x, y, radius, charged * baseAlpha, time, false);
    }
    if (ultra > .01) {
      drawElectricAura(ctx, x, y, radius, ultra, time, true);
      drawSlimeAvatar(ctx, {
        x, y, radius, skin: classic.id, colors: chargedColors, emotion: 'neutral', alpha: ultra,
        timestamp: time, outlineColor: 'rgba(0,0,0,0)', faceColor: '#214b78', bodyHighlight: false,
        scaleX: 1.045, scaleY: 1.045, faceScaleX: .957, faceScaleY: .957, bodyPaint: paintEnergySphere
      });
      drawEnergyTendrils(ctx, x, y, radius * 1.045, ultra, time);
    }
  }

  function drawBombFuse(target, x, y, radius, amount, time) {
    if (amount < .01) return;
    const startX = x;
    const startY = y - radius * .93;
    const tipX = x + radius * .065;
    const tipY = y - radius * 1.31;
    target.save();
    target.globalAlpha = amount;
    target.lineCap = 'round';
    target.lineJoin = 'round';

    target.fillStyle = '#8c7b76';
    target.strokeStyle = '#2b2b35';
    target.lineWidth = radius * .022;
    target.beginPath();
    target.ellipse(startX, startY, radius * .13, radius * .07, 0, 0, Math.PI * 2);
    target.fill();
    target.stroke();

    target.strokeStyle = '#3b3540';
    target.lineWidth = radius * .085;
    target.beginPath();
    target.moveTo(startX, startY);
    target.bezierCurveTo(x, y - radius * 1.07, x + radius * .055, y - radius * 1.18, tipX, tipY);
    target.stroke();
    target.strokeStyle = '#d9a84c';
    target.lineWidth = radius * .028;
    target.setLineDash([radius * .06, radius * .035]);
    target.lineDashOffset = 0;
    target.stroke();
    target.setLineDash([]);
    target.restore();

    target.save();
    target.globalAlpha = amount;
    target.shadowColor = '#ff7b1c';
    target.shadowBlur = radius * .1;
    target.fillStyle = '#ffb522';
    target.beginPath();
    target.arc(tipX, tipY, radius * .045, 0, Math.PI * 2);
    target.fill();
    target.restore();

    drawLivingFlame(target, tipX, tipY + radius * .025, radius * .31, radius * .19, time, amount);
    target.save();
    target.globalAlpha = amount;
    for (let index = 0; index < 2; index += 1) {
      const phase = (time / (530 + index * 70) + index * .46) % 1;
      target.globalAlpha = amount * Math.sin(phase * Math.PI);
      target.fillStyle = index ? '#ffcf38' : '#ff6b22';
      target.beginPath();
      target.arc(
        tipX + Math.sin(index * 4.3 + time / 210) * radius * .08,
        tipY - phase * radius * .27,
        radius * (.018 + (1 - phase) * .018),
        0,
        Math.PI * 2
      );
      target.fill();
    }
    target.restore();
  }

  function drawBombShell(target, { radius }) {
    target.save();
    target.fillStyle = '#777f91';
    target.strokeStyle = '#252a38';
    target.lineWidth = radius * .035;
    target.beginPath();
    target.ellipse(0, -radius * .88, radius * .18, radius * .105, 0, 0, Math.PI * 2);
    target.fill();
    target.stroke();

    target.globalAlpha = .42;
    target.strokeStyle = '#eef5ff';
    target.lineWidth = radius * .04;
    target.lineCap = 'round';
    target.beginPath();
    target.arc(-radius * .08, -radius * .08, radius * .63, Math.PI * .84, Math.PI * 1.35);
    target.stroke();
    target.restore();
  }

  function paintBombHeartbeat(target, { radius, timestamp, colors }, amount) {
    const base = target.createRadialGradient(-radius * .25, -radius * .35, radius * .12, 0, 0, radius * 1.1);
    base.addColorStop(0, colors[0]);
    base.addColorStop(.58, colors[1]);
    base.addColorStop(1, colors[2]);
    target.fillStyle = base;
    target.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

    const beat = reduceMotion ? .62 : .5 + Math.sin(timestamp / 720) * .5;
    const coreRadius = radius * (.48 + beat * .16);
    const heart = target.createRadialGradient(0, radius * .12, 0, 0, radius * .12, coreRadius);
    heart.addColorStop(0, `rgba(255,38,44,${amount * (.62 + beat * .28)})`);
    heart.addColorStop(.34, `rgba(241,31,43,${amount * (.4 + beat * .25)})`);
    heart.addColorStop(.72, `rgba(205,24,40,${amount * (.12 + beat * .15)})`);
    heart.addColorStop(1, 'rgba(173,16,38,0)');
    target.fillStyle = heart;
    target.fillRect(-radius, -radius * .8, radius * 2, radius * 1.8);

    if (beat > .05) {
      target.save();
      target.globalCompositeOperation = 'screen';
      target.globalAlpha = amount * (.12 + beat * .24);
      const hotCore = target.createRadialGradient(0, radius * .12, 0, 0, radius * .12, radius * .24);
      hotCore.addColorStop(0, 'rgba(255,224,177,.9)');
      hotCore.addColorStop(.42, 'rgba(255,83,62,.7)');
      hotCore.addColorStop(1, 'rgba(255,52,52,0)');
      target.fillStyle = hotCore;
      target.fillRect(-radius * .45, -radius * .35, radius * .9, radius * .9);
      target.restore();
    }
  }

  function drawExplosionForm(level, time, x, y, radius) {
    const sleeping = smooth(level);
    const fused = smooth(level - 1);
    const ultra = smooth(level - 2);
    const baseAlpha = 1 - ultra;
    if (baseAlpha > .01) {
      drawSlimeAvatar(ctx, {
        x, y, radius, skin: classic.id, colors: classic.colors, emotion: 'neutral',
        alpha: baseAlpha, timestamp: time,
        bodyPaint: (target, state) => paintBombHeartbeat(target, state, sleeping)
      });
    }

    if (ultra > .01) {
      drawSlimeAvatar(ctx, {
        x, y, radius, skin: 'coin', colors: ['#b7c0d1', '#596174', '#252b39'],
        emotion: 'neutral', alpha: ultra, timestamp: time,
        outlineColor: '#1d2230', frontLayer: drawBombShell, bodyHighlight: false
      });
    }

    drawBombFuse(ctx, x, y, radius, fused * baseAlpha + ultra, time);
  }

  function previewMotion(time) {
    if (reduceMotion) return { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, gazeX: 0, gazeY: 0, blink: false, tipSway: 0, emotion: null, speed: 0 };
    if (motionMode !== 'fall') {
      const breathe = Math.sin(time / 720);
      const look = Math.sin(time / 1850);
      const blinkPhase = time % 3600;
      return {
        x: Math.sin(time / 1450) * 1.4,
        y: breathe * 2.2,
        scaleX: 1 + breathe * .018,
        scaleY: 1 - breathe * .014,
        rotation: Math.sin(time / 1700) * .018,
        gazeX: look * .32,
        gazeY: Math.sin(time / 2300) * .12,
        blink: blinkPhase > 3460,
        tipSway: Math.sin(time / 980) * .035,
        emotion: null,
        speed: 0
      };
    }

    const motionTime = Math.max(0, time - motionStartedAt);
    const cycle = (motionTime % 4200) / 4200;
    const steer = Math.sin(time / 640);
    if (cycle < .68) {
      const fall = cycle / .68;
      const speed = .35 + fall * .65;
      return {
        x: steer * 8,
        y: -13 + fall * 23,
        scaleX: 1 - speed * .095,
        scaleY: 1 + speed * .15,
        rotation: steer * .085,
        gazeX: steer * .38,
        gazeY: .32,
        blink: false,
        tipSway: -steer * .12,
        emotion: fall > .54 ? 'joy' : 'focused',
        speed
      };
    }
    if (cycle < .79) {
      const impact = (cycle - .68) / .11;
      const pulse = Math.sin(impact * Math.PI);
      return {
        x: steer * 2,
        y: 10 + pulse * 7,
        scaleX: 1 + pulse * .2,
        scaleY: 1 - pulse * .22,
        rotation: steer * .025,
        gazeX: 0,
        gazeY: .15,
        blink: pulse > .35,
        tipSway: steer * .04,
        emotion: 'impact',
        speed: 1 - impact * .5
      };
    }
    const rebound = (cycle - .79) / .21;
    const lift = Math.sin(rebound * Math.PI) * (1 - rebound);
    return {
      x: -steer * 5 * (1 - rebound),
      y: 10 - lift * 42,
      scaleX: 1 - lift * .13,
      scaleY: 1 + lift * .2,
      rotation: -steer * .06 * (1 - rebound),
      gazeX: -steer * .25,
      gazeY: -.25,
      blink: false,
      tipSway: steer * .08,
      emotion: 'surprised',
      speed: .72 * (1 - rebound)
    };
  }

  function drawFallPreview(target, time, x, y, radius, motion) {
    if (motionMode !== 'fall' || reduceMotion) return;
    target.save();
    target.lineCap = 'round';
    for (let index = 0; index < 11; index += 1) {
      const phase = (time / (520 + index * 23) + index * .137) % 1;
      const side = index % 2 ? 1 : -1;
      const px = x + side * (radius * (.72 + (index % 3) * .2));
      const py = y - radius * .95 + phase * radius * 2.15;
      const length = 12 + motion.speed * 35 + (index % 4) * 4;
      target.globalAlpha = (.12 + motion.speed * .3) * Math.sin(phase * Math.PI);
      target.strokeStyle = index % 3 ? '#9cd9cf' : '#fff';
      target.lineWidth = index % 3 ? 2 : 3;
      target.beginPath(); target.moveTo(px, py); target.lineTo(px, py + length); target.stroke();
    }
    const shadow = target.createRadialGradient(x, y + radius * 1.04, 0, x, y + radius * 1.04, radius * .75);
    shadow.addColorStop(0, `rgba(42,91,77,${.18 + motion.speed * .12})`);
    shadow.addColorStop(1, 'rgba(42,91,77,0)');
    target.globalAlpha = 1;
    target.fillStyle = shadow;
    target.beginPath(); target.ellipse(x, y + radius * 1.04, radius * (.58 - motion.speed * .12), radius * .12, 0, 0, Math.PI * 2); target.fill();
    target.restore();
  }

  function draw(time) {
    requestAnimationFrame(draw);
    if (time - lastFrame < 16) return;
    lastFrame = time;
    const response = reduceMotion ? 1 : 1 - Math.exp(-.032 / .22);
    if (selectedEffect === 'mix') {
      effectKeys.forEach(key => {
        const targetLevel = Math.min(3, mixSlots.filter(value => value === key).length);
        mixVisual[key] += (targetLevel - mixVisual[key]) * response;
        if (Math.abs(targetLevel - mixVisual[key]) < .002) mixVisual[key] = targetLevel;
      });
    } else {
      visualLevel += (selectedLevel - visualLevel) * response;
      if (Math.abs(selectedLevel - visualLevel) < .002) visualLevel = selectedLevel;
    }

    ctx.clearRect(0, 0, 360, 420);
    const x = 180;
    const y = 230;
    const radius = 96;
    const characterMotion = previewMotion(time);
    avatarMotion = characterMotion;
    drawFallPreview(ctx, time, x, y, radius, characterMotion);
    ctx.save();
    ctx.translate(x + characterMotion.x, y + characterMotion.y);
    ctx.rotate(characterMotion.rotation);
    ctx.scale(characterMotion.scaleX, characterMotion.scaleY);
    ctx.translate(-x, -y);
    try {
    const fireLevel = selectedEffect === 'mix' ? mixVisual.fire : selectedEffect === 'fire' ? visualLevel : 0;
    const goldLevel = selectedEffect === 'mix' ? mixVisual.gold : selectedEffect === 'gold' ? visualLevel : 0;
    const frostLevel = selectedEffect === 'mix' ? mixVisual.frost : selectedEffect === 'frost' ? visualLevel : 0;
    const weightLevel = selectedEffect === 'mix' ? mixVisual.weight : selectedEffect === 'weight' ? visualLevel : 0;
    const electricityLevel = selectedEffect === 'mix' ? mixVisual.electricity : selectedEffect === 'electricity' ? visualLevel : 0;
    const explosionLevel = selectedEffect === 'mix' ? mixVisual.explosion : selectedEffect === 'explosion' ? visualLevel : 0;
    if (explosionLevel > .001) {
      drawExplosionForm(explosionLevel, time, x, y, radius);
      return;
    }
    if (electricityLevel > .001) {
      drawElectricForm(electricityLevel, time, x, y, radius);
      return;
    }
    if (weightLevel > .001) {
      drawWeightForm(weightLevel, time, x, y, radius);
      return;
    }
    if (frostLevel > .001) {
      drawFrostForm(frostLevel, time, x, y, radius);
      return;
    }
    if (goldLevel > .001) {
      drawGoldForm(goldLevel, time, x, y, radius);
      return;
    }
    const dominant = smooth(fireLevel - 1);
    const ultra = smooth(fireLevel - 2);
    const redColors = ['#ffb05a', '#f04b35', '#b7202c'];
    const colors = classic.colors.map((color, index) => mixHex(color, redColors[index], dominant));
    const baseAlpha = 1 - ultra;
    const motion = fireUltraMotion(time, ultra);
    const slimeY = y + motion.y;

    if (baseAlpha > .01) {
      drawSlimeAvatar(ctx, {
        x, y: slimeY, radius, skin: classic.id, colors, emotion: motion.emotion,
        scaleX: motion.scaleX, scaleY: motion.scaleY, rotation: motion.rotation,
        alpha: baseAlpha, timestamp: time
      });
      drawTipFlame(ctx, x, slimeY, radius, Math.min(fireLevel, 2), time, baseAlpha);
      drawFireEyes(ctx, x, slimeY, radius, Math.min(fireLevel, 2), time, baseAlpha);
    }
    if (ultra > .01) {
      drawSlimeAvatar(ctx, {
        x, y: slimeY, radius, skin: classic.id, colors: redColors,
        emotion: motion.emotion,
        gazeX: 0,
        gazeY: 0,
        blink: false,
        scaleX: motion.scaleX, scaleY: motion.scaleY, rotation: motion.rotation,
        alpha: ultra, timestamp: time,
        backLayer: (target, state) => drawContourFire(target, state),
        frontLayer: (target, state) => drawContourFire(target, state, true),
        bodyHighlight: true
      });
      drawFireEyes(ctx, x, slimeY, radius, 1, time, ultra);
    }
    } finally {
      ctx.restore();
    }
  }

  function renderMixSlots() {
    mixSlotButtons.forEach((button, index) => {
      const key = mixSlots[index];
      button.classList.toggle('active', index === activeMixSlot);
      button.replaceChildren();
      if (key) {
        const image = document.createElement('img');
        image.src = iconBase + effectInfo[key].icon;
        image.alt = effectInfo[key].title;
        button.append(image);
      } else {
        const number = document.createElement('span');
        number.textContent = String(index + 1);
        button.append(number);
      }
    });
  }

  function updateUi() {
    const isMix = selectedEffect === 'mix';
    effectTabs.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.effect === selectedEffect)));
    controls.hidden = isMix;
    mixPanel.hidden = !isMix;
    stateIcon.hidden = isMix;
    stateQuestion.hidden = !isMix;
    if (isMix) {
      effectTitle.textContent = 'Синергия эффектов';
      stateName.textContent = `${mixSlots.filter(Boolean).length}/3 эффектов`;
      renderMixSlots();
      return;
    }

    const info = effectInfo[selectedEffect];
    levelButtons.forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.level === selectedLevel)));
    effectTitle.textContent = info.title;
    stateIcon.src = iconBase + info.icon;
    document.querySelectorAll('.choice-icon, .double-icon img, .triple-icon img').forEach(image => { image.src = iconBase + info.icon; });
    document.querySelectorAll('.choice-title').forEach((title, index) => { title.textContent = info.labels[index]; });
    stateName.textContent = selectedLevel ? info.states[selectedLevel - 1] : 'Обычный слайм';
  }

  levelButtons.forEach(button => button.addEventListener('click', () => {
    const level = +button.dataset.level;
    selectedLevel = selectedLevel === level ? 0 : level;
    updateUi();
  }));
  mixSlotButtons.forEach(button => button.addEventListener('click', () => {
    activeMixSlot = +button.dataset.slot;
    if (mixSlots[activeMixSlot]) mixSlots[activeMixSlot] = null;
    updateUi();
  }));
  mixPickButtons.forEach(button => button.addEventListener('click', () => {
    mixSlots[activeMixSlot] = button.dataset.pick;
    const nextEmpty = mixSlots.findIndex(value => !value);
    activeMixSlot = nextEmpty >= 0 ? nextEmpty : (activeMixSlot + 1) % mixSlots.length;
    updateUi();
  }));
  effectTabs.forEach(button => button.addEventListener('click', () => {
    if (selectedEffect === button.dataset.effect) return;
    selectedEffect = button.dataset.effect;
    selectedLevel = 0;
    visualLevel = 0;
    updateUi();
  }));
  motionButtons.forEach(button => button.addEventListener('click', () => {
    motionMode = button.dataset.motion === 'fall' ? 'fall' : 'idle';
    motionStartedAt = performance.now();
    motionButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  }));

  updateUi();
  requestAnimationFrame(draw);
})();
