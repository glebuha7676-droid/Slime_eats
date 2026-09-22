(() => {
  'use strict';

  const PALETTE = Object.freeze({
    light: '#efffa4',
    lime: '#9cff2f',
    green: '#39dc42',
    deep: '#0ca948',
    ink: '#153c42',
    cheek: '#ff9e91'
  });

  function traceBody(ctx, radius, tipOffset = 0) {
    const r = radius;
    const tip = tipOffset * r;
    ctx.beginPath();
    ctx.moveTo(tip, -r * 1.03);
    ctx.bezierCurveTo(tip + r * .13, -r * 1.01, r * .18, -r * .84, r * .32, -r * .75);
    ctx.bezierCurveTo(r * .72, -r * .59, r * .98, -r * .2, r * .96, r * .28);
    ctx.bezierCurveTo(r * .94, r * .7, r * .65, r * .94, 0, r * .96);
    ctx.bezierCurveTo(-r * .65, r * .94, -r * .94, r * .7, -r * .96, r * .28);
    ctx.bezierCurveTo(-r * .98, -r * .2, -r * .72, -r * .59, -r * .32, -r * .75);
    ctx.bezierCurveTo(-r * .18, -r * .84, tip - r * .13, -r * 1.01, tip, -r * 1.03);
    ctx.closePath();
  }

  function star(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * .3, y - size * .3);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size * .3, y + size * .3);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * .3, y + size * .3);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x - size * .3, y - size * .3);
    ctx.closePath();
    ctx.fill();
  }

  function drawEye(ctx, side, radius, gazeX, gazeY, blink, happy) {
    const r = radius;
    const x = side * r * .275;
    const y = -r * .055;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(4, r * .052);

    if (blink || happy) {
      ctx.beginPath();
      ctx.arc(x, y + r * .035, r * .135, Math.PI + .12, Math.PI * 2 - .12);
      ctx.stroke();
      return;
    }

    ctx.fillStyle = '#fffefb';
    ctx.beginPath();
    ctx.ellipse(x, y, r * .19, r * .235, side * .025, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    const px = x + gazeX * r * .055;
    const py = y + gazeY * r * .045 + r * .012;
    const iris = ctx.createLinearGradient(px, py - r * .15, px, py + r * .16);
    iris.addColorStop(0, '#102f3a');
    iris.addColorStop(.58, '#123d37');
    iris.addColorStop(1, '#45bc2e');
    ctx.fillStyle = iris;
    ctx.beginPath();
    ctx.ellipse(px, py, r * .105, r * .15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px - r * .038, py - r * .066, r * .045, 0, Math.PI * 2);
    ctx.fill();
    star(ctx, px + r * .034, py + r * .058, r * .03);
  }

  function drawFace(ctx, radius, options) {
    const r = radius;
    const { gazeX = 0, gazeY = 0, blink = false, expression = 'smile' } = options;
    const happy = expression === 'happy';

    const blush = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .16);
    blush.addColorStop(0, 'rgba(255,170,145,.95)');
    blush.addColorStop(.64, 'rgba(255,143,133,.78)');
    blush.addColorStop(1, 'rgba(255,143,133,0)');
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * r * .5, r * .19);
      ctx.scale(1.35, .66);
      ctx.fillStyle = blush;
      ctx.beginPath();
      ctx.arc(0, 0, r * .17, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    drawEye(ctx, -1, r, gazeX, gazeY, blink, happy);
    drawEye(ctx, 1, r, gazeX, gazeY, blink, happy);

    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(4, r * .058);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * .135, r * .245);
    ctx.bezierCurveTo(-r * .095, r * .39, r * .095, r * .39, r * .135, r * .245);
    ctx.stroke();
  }

  function drawGel(ctx, radius, tipOffset) {
    const r = radius;
    const base = ctx.createRadialGradient(-r * .12, -r * .18, r * .04, 0, r * .08, r * 1.14);
    base.addColorStop(0, PALETTE.light);
    base.addColorStop(.25, '#c7ff4a');
    base.addColorStop(.58, PALETTE.lime);
    base.addColorStop(.82, PALETTE.green);
    base.addColorStop(1, PALETTE.deep);
    traceBody(ctx, r, tipOffset);
    ctx.fillStyle = base;
    ctx.fill();

    ctx.save();
    traceBody(ctx, r, tipOffset);
    ctx.clip();

    const warmCore = ctx.createRadialGradient(0, -r * .03, 0, 0, -r * .03, r * .72);
    warmCore.addColorStop(0, 'rgba(255,255,126,.44)');
    warmCore.addColorStop(.5, 'rgba(216,255,80,.14)');
    warmCore.addColorStop(1, 'rgba(115,255,74,0)');
    ctx.fillStyle = warmCore;
    ctx.fillRect(-r, -r, r * 2, r * 2);

    const depth = ctx.createLinearGradient(0, -r * .2, 0, r);
    depth.addColorStop(0, 'rgba(10,101,53,0)');
    depth.addColorStop(.7, 'rgba(0,111,55,.04)');
    depth.addColorStop(1, 'rgba(0,73,54,.2)');
    ctx.fillStyle = depth;
    ctx.fillRect(-r, -r, r * 2, r * 2);

    const leftRim = ctx.createLinearGradient(-r, 0, -r * .35, 0);
    leftRim.addColorStop(0, 'rgba(220,255,178,.65)');
    leftRim.addColorStop(.55, 'rgba(154,255,110,.16)');
    leftRim.addColorStop(1, 'rgba(154,255,110,0)');
    ctx.fillStyle = leftRim;
    ctx.fillRect(-r, -r, r * .8, r * 2);

    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = 'rgba(255,255,255,.78)';
    ctx.beginPath();
    ctx.ellipse(-r * .35, -r * .47, r * .28, r * .105, -.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath();
    ctx.ellipse(r * .47, -r * .34, r * .2, r * .055, .35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(r * .56, r * .51, r * .22, r * .14, -.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(238,255,217,.54)';
    ctx.beginPath(); ctx.arc(-r * .61, r * .4, r * .064, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-r * .56, -r * .03, r * .042, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * .68, r * .02, r * .035, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    traceBody(ctx, r, tipOffset);
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = Math.max(5, r * .055);
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = .52;
    ctx.strokeStyle = '#bbff7f';
    ctx.lineWidth = Math.max(2, r * .018);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * .7, -r * .12);
    ctx.bezierCurveTo(-r * .62, -r * .5, -r * .37, -r * .72, -r * .14, -r * .81);
    ctx.stroke();
    ctx.restore();
  }

  function draw(ctx, options = {}) {
    const {
      x = 0,
      y = 0,
      radius = 100,
      time = performance.now(),
      scaleX = 1,
      scaleY = 1,
      rotation = 0,
      gazeX = 0,
      gazeY = 0,
      blink = false,
      expression = 'smile',
      tipSway = 0,
      alpha = 1
    } = options;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);
    drawGel(ctx, radius, tipSway);
    drawFace(ctx, radius, { gazeX, gazeY, blink, expression, time });
    ctx.restore();
  }

  window.SlimeCharacterV2 = Object.freeze({ draw, traceBody, palette: PALETTE });
})();
