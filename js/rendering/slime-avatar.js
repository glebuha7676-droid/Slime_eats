(() => {
  'use strict';

  const defaultColors = window.SlimeGameConfig?.SKINS?.[0]?.colors || ['#e9ff9c', '#67d348', '#2fa345'];

  function traceSlimeBody(targetCtx, skinId, radius, tipX) {
    targetCtx.beginPath();
    if (skinId === 'dumpling') {
      targetCtx.moveTo(0, -radius * .68);
      targetCtx.bezierCurveTo(radius * .58, -radius * .67, radius * .9, -radius * .33, radius * .92, radius * .15);
      targetCtx.bezierCurveTo(radius * .91, radius * .65, radius * .55, radius * .83, 0, radius * .84);
      targetCtx.bezierCurveTo(-radius * .55, radius * .83, -radius * .91, radius * .65, -radius * .92, radius * .15);
      targetCtx.bezierCurveTo(-radius * .9, -radius * .33, -radius * .58, -radius * .67, 0, -radius * .68);
    } else if (skinId === 'ball') {
      targetCtx.arc(0, 0, radius * .91, 0, Math.PI * 2);
    } else if (skinId === 'cat') {
      targetCtx.moveTo(0, -radius * .83);
      targetCtx.bezierCurveTo(radius * .53, -radius * .84, radius * .91, -radius * .39, radius * .91, radius * .16);
      targetCtx.bezierCurveTo(radius * .88, radius * .68, radius * .5, radius * .92, 0, radius * .93);
      targetCtx.bezierCurveTo(-radius * .5, radius * .92, -radius * .88, radius * .68, -radius * .91, radius * .16);
      targetCtx.bezierCurveTo(-radius * .91, -radius * .39, -radius * .53, -radius * .84, 0, -radius * .83);
    } else if (skinId === 'water') {
      targetCtx.moveTo(tipX, -radius * 1.08);
      targetCtx.bezierCurveTo(radius * .12, -radius * .87, radius * .79, -radius * .57, radius * .91, radius * .13);
      targetCtx.bezierCurveTo(radius * .95, radius * .64, radius * .5, radius * .94, 0, radius * .95);
      targetCtx.bezierCurveTo(-radius * .5, radius * .94, -radius * .95, radius * .64, -radius * .91, radius * .13);
      targetCtx.bezierCurveTo(-radius * .79, -radius * .57, -radius * .12, -radius * .87, tipX, -radius * 1.08);
    } else {
      targetCtx.moveTo(tipX, -radius);
      targetCtx.bezierCurveTo(tipX + radius * .15, -radius * .99, radius * .16, -radius * .86, radius * .26, -radius * .79);
      targetCtx.bezierCurveTo(radius * .67, -radius * .68, radius * .93, -radius * .31, radius * .91, radius * .16);
      targetCtx.bezierCurveTo(radius * .88, radius * .68, radius * .5, radius * .92, 0, radius * .93);
      targetCtx.bezierCurveTo(-radius * .5, radius * .92, -radius * .88, radius * .68, -radius * .91, radius * .16);
      targetCtx.bezierCurveTo(-radius * .93, -radius * .31, -radius * .67, -radius * .68, -radius * .26, -radius * .79);
      targetCtx.bezierCurveTo(-radius * .16, -radius * .86, tipX - radius * .15, -radius * .99, tipX, -radius);
    }
    targetCtx.closePath();
  }

  function drawMealCoating(targetCtx, aura, skinId, radius, tipX, timestamp) {
    if (aura !== 'special' && aura !== 'secret') return;
    targetCtx.save();
    traceSlimeBody(targetCtx, skinId, radius, tipX);
    targetCtx.clip();

    if (aura === 'special') {
      const drift = timestamp / 950;
      const dx = Math.cos(drift) * radius;
      const dy = Math.sin(drift) * radius * .55;
      const rainbow = targetCtx.createLinearGradient(-dx, -dy, dx, dy);
      rainbow.addColorStop(0, '#ff4f91');
      rainbow.addColorStop(.18, '#ff9e45');
      rainbow.addColorStop(.36, '#ffe750');
      rainbow.addColorStop(.54, '#48df8a');
      rainbow.addColorStop(.72, '#4bc8ff');
      rainbow.addColorStop(.88, '#8d75ff');
      rainbow.addColorStop(1, '#ed65da');
      targetCtx.globalAlpha = .46;
      targetCtx.fillStyle = rainbow;
      targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

      const sheenX = ((timestamp / 680) % 1) * radius * 3 - radius * 1.5;
      const sheen = targetCtx.createLinearGradient(sheenX - radius * .32, 0, sheenX + radius * .32, 0);
      sheen.addColorStop(0, 'rgba(255,255,255,0)');
      sheen.addColorStop(.5, 'rgba(255,255,255,.62)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      targetCtx.globalAlpha = .46;
      targetCtx.fillStyle = sheen;
      targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
    } else {
      const pulse = .5 + Math.sin(timestamp / 105) * .5;
      const curse = targetCtx.createLinearGradient(-radius * .72, -radius, radius * .62, radius);
      curse.addColorStop(0, `rgba(255,104,151,${.7 + pulse * .08})`);
      curse.addColorStop(.48, `rgba(155,29,103,${.75 + pulse * .08})`);
      curse.addColorStop(1, `rgba(61,11,81,${.82 + pulse * .08})`);
      targetCtx.fillStyle = curse;
      targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

      for (let index = 0; index < 2; index += 1) {
        const angle = timestamp / (280 + index * 70) + index * Math.PI;
        const omenX = Math.cos(angle) * radius * .34;
        const omenY = Math.sin(angle * .82) * radius * .28;
        const omen = targetCtx.createRadialGradient(omenX, omenY, 0, omenX, omenY, radius * (.48 + index * .08));
        omen.addColorStop(0, index ? 'rgba(255,228,235,.48)' : 'rgba(255,91,143,.58)');
        omen.addColorStop(.45, 'rgba(255,44,112,.25)');
        omen.addColorStop(1, 'rgba(117,8,53,0)');
        targetCtx.fillStyle = omen;
        targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
      }
    }
    targetCtx.restore();

    targetCtx.save();
    traceSlimeBody(targetCtx, skinId, radius, tipX);
    if (aura === 'special') {
      const outline = targetCtx.createLinearGradient(-radius, 0, radius, 0);
      outline.addColorStop(0, '#ff4f91');
      outline.addColorStop(.25, '#ffd84f');
      outline.addColorStop(.5, '#4bdf91');
      outline.addColorStop(.75, '#4fc8ff');
      outline.addColorStop(1, '#b76fff');
      targetCtx.strokeStyle = outline;
      targetCtx.globalAlpha = .82;
      targetCtx.shadowColor = '#fff';
      targetCtx.shadowBlur = 5;
    } else {
      const pulse = .5 + Math.sin(timestamp / 105) * .5;
      targetCtx.strokeStyle = `rgba(255,86,137,${.76 + pulse * .2})`;
      targetCtx.globalAlpha = 1;
      targetCtx.shadowColor = '#8c145c';
      targetCtx.shadowBlur = 7 + pulse * 4;
    }
    targetCtx.lineWidth = Math.max(2.4, radius * .05);
    targetCtx.stroke();
    targetCtx.restore();
  }

  function drawSlimeAvatar(targetCtx, {
    x, y, radius, emotion = 'focused', colors = defaultColors,
    skin = 'classic',
    scaleX = 1, scaleY = 1, rotation = 0, alpha = 1,
    gazeX = 0, gazeY = 0, blink = false, aura = '', petPoint = null, tipSway = 0,
    timestamp = performance.now()
  }) {
    if (aura) {
      targetCtx.save();
      targetCtx.translate(x, y);
      if (aura === 'epic') {
        const auraPulse = 1 + Math.sin(timestamp / 180) * .04;
        const epicGlow = targetCtx.createRadialGradient(0, 0, radius * .58, 0, 0, radius + 19);
        epicGlow.addColorStop(0, 'rgba(155,83,238,.5)');
        epicGlow.addColorStop(.58, 'rgba(180,108,255,.32)');
        epicGlow.addColorStop(1, 'rgba(141,68,225,0)');
        targetCtx.globalAlpha = .9;
        targetCtx.fillStyle = epicGlow;
        targetCtx.beginPath(); targetCtx.arc(0, 0, (radius + 19) * auraPulse, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.globalAlpha = .82;
        for (let index = 0; index < 7; index += 1) {
          const side = index % 2 ? 1 : -1;
          const phase = (timestamp / 780 + index * .19) % 1;
          const px = side * radius * (.55 + (index % 3) * .16);
          const py = radius * .45 - phase * radius * 1.55;
          const size = 2.5 + (1 - phase) * 2.5;
          targetCtx.fillStyle = index % 3 === 0 ? '#f0c4ff' : '#9f6cff';
          targetCtx.save(); targetCtx.translate(px, py); targetCtx.rotate(Math.PI / 4 + phase); targetCtx.fillRect(-size, -size, size * 2, size * 2); targetCtx.restore();
        }
      } else if (aura === 'special') {
        const glow = targetCtx.createRadialGradient(0, 0, radius * .68, 0, 0, radius + 13);
        glow.addColorStop(0, 'rgba(255,244,157,.2)');
        glow.addColorStop(.58, 'rgba(255,188,55,.2)');
        glow.addColorStop(1, 'rgba(173,99,255,0)');
        targetCtx.fillStyle = glow;
        targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 13, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.globalAlpha = .62;
        targetCtx.strokeStyle = '#ffd84f';
        targetCtx.lineCap = 'round';
        for (let index = 0; index < 8; index += 1) {
          const angle = index / 8 * Math.PI * 2 + timestamp / 2800;
          const inner = radius + 3;
          const outer = radius + (index % 2 ? 8 : 13);
          targetCtx.lineWidth = index % 2 ? 2 : 3.5;
          targetCtx.beginPath(); targetCtx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner); targetCtx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer); targetCtx.stroke();
        }
        const rainbow = ['#ff5f9f', '#ffb24e', '#ffe45a', '#4ddd8a', '#4fcaff', '#a875ff'];
        rainbow.forEach((color, index) => {
          const angle = index / rainbow.length * Math.PI * 2 + timestamp / 1500;
          const twinkle = .55 + Math.sin(timestamp / 170 + index * 1.7) * .45;
          const px = Math.cos(angle) * (radius + 7);
          const py = Math.sin(angle) * (radius * .8 + 5);
          const size = 1.8 + twinkle * 1.8;
          targetCtx.globalAlpha = .58 + twinkle * .32;
          targetCtx.fillStyle = color;
          targetCtx.beginPath(); targetCtx.arc(px, py, size, 0, Math.PI * 2); targetCtx.fill();
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.arc(px - .7, py - .7, Math.max(.7, size * .25), 0, Math.PI * 2); targetCtx.fill();
        });
      } else if (aura === 'secret') {
        const pulse = .5 + Math.sin(timestamp / 125) * .5;
        const glow = targetCtx.createRadialGradient(0, 0, radius * .7, 0, 0, radius + 14);
        glow.addColorStop(0, `rgba(255,92,143,${.15 + pulse * .08})`);
        glow.addColorStop(.7, `rgba(112,17,91,${.3 + pulse * .1})`);
        glow.addColorStop(1, 'rgba(42,5,54,0)');
        targetCtx.fillStyle = glow;
        targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 14, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.shadowColor = '#c0185a';
        targetCtx.shadowBlur = 7;
        for (let index = 0; index < 6; index += 1) {
          const phase = (timestamp / 820 + index * .17) % 1;
          const angle = index / 6 * Math.PI * 2 + phase * .72;
          const distance = radius + 15 - phase * 22;
          const px = Math.cos(angle) * distance;
          const py = Math.sin(angle) * distance * .82;
          const size = 2.3 + (1 - phase) * 2.7;
          targetCtx.globalAlpha = Math.sin(phase * Math.PI) * .82;
          targetCtx.fillStyle = index % 3 === 0 ? '#ffe2ec' : index % 2 ? '#ff5b9f' : '#bd38a2';
          targetCtx.beginPath(); targetCtx.arc(px, py, size, 0, Math.PI * 2); targetCtx.fill();
        }
      }
      targetCtx.restore();
    }

    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation);
    targetCtx.scale(scaleX, scaleY);

    const skinId = String(skin || 'classic');
    const outline = '#26334a';
    const gradient = targetCtx.createRadialGradient(-radius * .25, -radius * .35, radius * .12, 0, 0, radius * 1.1);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(.58, colors[1]);
    gradient.addColorStop(1, colors[2]);
    targetCtx.fillStyle = gradient;
    targetCtx.strokeStyle = outline;
    targetCtx.lineWidth = Math.max(2.7, radius * .09);
    const tipX = tipSway * radius;

    if (skinId === 'cat') {
      for (const side of [-1, 1]) {
        targetCtx.fillStyle = gradient;
        targetCtx.beginPath();
        targetCtx.moveTo(side * radius * .72, -radius * .52);
        targetCtx.quadraticCurveTo(side * radius * .69, -radius * .92, side * radius * .34, -radius * .78);
        targetCtx.quadraticCurveTo(side * radius * .43, -radius * .59, side * radius * .72, -radius * .52);
        targetCtx.closePath(); targetCtx.fill(); targetCtx.stroke();
        targetCtx.globalAlpha = alpha * .72;
        targetCtx.fillStyle = '#ffd2df';
        targetCtx.beginPath();
        targetCtx.moveTo(side * radius * .61, -radius * .6);
        targetCtx.lineTo(side * radius * .61, -radius * .79);
        targetCtx.lineTo(side * radius * .43, -radius * .71);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.globalAlpha = alpha;
      }
    } else if (skinId === 'dumpling') {
      targetCtx.fillStyle = gradient;
      targetCtx.beginPath();
      targetCtx.ellipse(0, -radius * .61, radius * .25, radius * .2, 0, 0, Math.PI * 2);
      targetCtx.fill(); targetCtx.stroke();
    }

    targetCtx.fillStyle = gradient;
    traceSlimeBody(targetCtx, skinId, radius, tipX);
    targetCtx.fill();
    targetCtx.stroke();

    drawMealCoating(targetCtx, aura, skinId, radius, tipX, timestamp);

    targetCtx.globalAlpha = alpha * .25;
    targetCtx.fillStyle = '#fff';
    targetCtx.beginPath();
    targetCtx.ellipse(-radius * .28, -radius * .32, radius * .23, radius * .13, -.5, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.globalAlpha = alpha;

    if (petPoint) {
      targetCtx.globalAlpha = alpha * .62;
      targetCtx.fillStyle = '#fff';
      targetCtx.beginPath();
      targetCtx.ellipse(petPoint.x * radius, petPoint.y * radius, radius * .13, radius * .075, -.45, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    }

    if (skinId === 'honey') {
      const honeyCap = targetCtx.createLinearGradient(0, -radius * 1.04, 0, -radius * .21);
      honeyCap.addColorStop(0, '#fff1a6');
      honeyCap.addColorStop(.46, '#ffc53d');
      honeyCap.addColorStop(1, '#e89118');
      targetCtx.fillStyle = honeyCap;
      targetCtx.strokeStyle = outline;
      targetCtx.lineWidth = Math.max(2.2, radius * .065);
      targetCtx.beginPath();
      targetCtx.moveTo(-radius * .64, -radius * .49);
      targetCtx.bezierCurveTo(-radius * .61, -radius * .74, -radius * .4, -radius * .87, -radius * .18, -radius * .88);
      targetCtx.bezierCurveTo(-radius * .12, -radius * 1.04, radius * .03, -radius * 1.1, radius * .14, -radius * .9);
      targetCtx.bezierCurveTo(radius * .37, -radius * .86, radius * .6, -radius * .72, radius * .64, -radius * .49);
      targetCtx.bezierCurveTo(radius * .6, -radius * .39, radius * .53, -radius * .36, radius * .45, -radius * .43);
      targetCtx.bezierCurveTo(radius * .39, -radius * .48, radius * .39, -radius * .24, radius * .28, -radius * .23);
      targetCtx.bezierCurveTo(radius * .16, -radius * .22, radius * .2, -radius * .46, radius * .07, -radius * .43);
      targetCtx.bezierCurveTo(-radius * .04, -radius * .4, -radius * .01, -radius * .29, -radius * .1, -radius * .28);
      targetCtx.bezierCurveTo(-radius * .22, -radius * .26, -radius * .19, -radius * .48, -radius * .33, -radius * .44);
      targetCtx.bezierCurveTo(-radius * .46, -radius * .4, -radius * .5, -radius * .35, -radius * .58, -radius * .4);
      targetCtx.bezierCurveTo(-radius * .62, -radius * .43, -radius * .63, -radius * .46, -radius * .64, -radius * .49);
      targetCtx.closePath(); targetCtx.fill(); targetCtx.stroke();
      targetCtx.globalAlpha = alpha * .68;
      targetCtx.fillStyle = '#fff8cf';
      targetCtx.beginPath(); targetCtx.ellipse(-radius * .25, -radius * .72, radius * .17, radius * .075, -.34, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    } else if (skinId === 'ball') {
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.arc(0, 0, radius * .84, 0, Math.PI * 2);
      targetCtx.clip();
      targetCtx.globalAlpha = alpha * .45;
      targetCtx.strokeStyle = '#526079';
      targetCtx.lineWidth = Math.max(1.6, radius * .038);
      targetCtx.lineCap = 'round';
      targetCtx.beginPath();
      targetCtx.moveTo(-radius * .12, -radius * .35);
      targetCtx.lineTo(-radius * .38, -radius * .15);
      targetCtx.lineTo(-radius * .61, -radius * .07);
      targetCtx.moveTo(radius * .12, -radius * .35);
      targetCtx.lineTo(radius * .38, -radius * .15);
      targetCtx.lineTo(radius * .61, -radius * .07);
      targetCtx.moveTo(-radius * .52, radius * .12);
      targetCtx.lineTo(-radius * .34, radius * .48);
      targetCtx.lineTo(-radius * .16, radius * .58);
      targetCtx.moveTo(radius * .52, radius * .12);
      targetCtx.lineTo(radius * .34, radius * .48);
      targetCtx.lineTo(radius * .16, radius * .58);
      targetCtx.stroke();

      const drawPanel = (centerX, centerY, size, rotation = -Math.PI / 2) => {
        targetCtx.beginPath();
        for (let index = 0; index < 5; index += 1) {
          const angle = rotation + index * Math.PI * 2 / 5;
          const panelX = centerX + Math.cos(angle) * size;
          const panelY = centerY + Math.sin(angle) * size;
          if (index === 0) targetCtx.moveTo(panelX, panelY);
          else targetCtx.lineTo(panelX, panelY);
        }
        targetCtx.closePath();
        targetCtx.fill();
      };
      targetCtx.globalAlpha = alpha * .94;
      targetCtx.fillStyle = '#26334a';
      drawPanel(0, -radius * .57, radius * .2);
      drawPanel(-radius * .76, radius * .04, radius * .23, -Math.PI / 2 + .16);
      drawPanel(radius * .76, radius * .04, radius * .23, -Math.PI / 2 - .16);
      drawPanel(0, radius * .72, radius * .21, Math.PI / 2);
      targetCtx.restore();
      targetCtx.globalAlpha = alpha * .78;
      targetCtx.fillStyle = '#fff';
      targetCtx.beginPath();
      targetCtx.ellipse(-radius * .34, -radius * .34, radius * .15, radius * .075, -.55, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    } else if (skinId === 'water') {
      targetCtx.globalAlpha = alpha * .6;
      targetCtx.fillStyle = '#eaffff';
      targetCtx.beginPath(); targetCtx.arc(-radius * .54, -radius * .06, radius * .065, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.beginPath(); targetCtx.arc(radius * .49, -radius * .42, radius * .045, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    } else if (skinId === 'dumpling') {
      targetCtx.globalAlpha = alpha * .7;
      targetCtx.strokeStyle = '#a87b57';
      targetCtx.lineWidth = Math.max(1.7, radius * .045);
      for (const side of [-1, 0, 1]) {
        targetCtx.beginPath();
        targetCtx.moveTo(side * radius * .11, -radius * .69);
        targetCtx.quadraticCurveTo(side * radius * .23, -radius * .5, side * radius * .3, -radius * .39);
        targetCtx.stroke();
      }
      targetCtx.globalAlpha = alpha;
    }

    const eyeY = -radius * .12;
    const eyeX = radius * .245;
    const chewPulse = (Math.sin(timestamp / 48 - Math.PI / 2) + 1) / 2;
    const chewSquint = emotion === 'chewing';
    const anticipationSquint = emotion === 'anticipating' || emotion === 'savoring';
    const closedHappy = emotion === 'petting' || emotion === 'pleased';
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    const cheekPuff = chewSquint ? 1 + (1 - chewPulse) * .16 : 1;
    targetCtx.globalAlpha = alpha * (closedHappy ? .68 : chewSquint ? .58 + (1 - chewPulse) * .12 : .48);
    targetCtx.fillStyle = '#f78591';
    targetCtx.beginPath(); targetCtx.ellipse(-radius * .45, radius * .14, radius * .14 * cheekPuff, radius * .075 * cheekPuff, 0, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.ellipse(radius * .45, radius * .14, radius * .14 * cheekPuff, radius * .075 * cheekPuff, 0, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.globalAlpha = alpha;

    if (emotion === 'hurt') {
      targetCtx.strokeStyle = outline;
      targetCtx.lineWidth = Math.max(2.5, radius * .085);
      for (const side of [-1, 1]) {
        const eyeCenter = eyeX * side;
        targetCtx.beginPath(); targetCtx.moveTo(eyeCenter - radius * .09, eyeY - radius * .08); targetCtx.lineTo(eyeCenter + radius * .09, eyeY + radius * .08); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.moveTo(eyeCenter + radius * .09, eyeY - radius * .08); targetCtx.lineTo(eyeCenter - radius * .09, eyeY + radius * .08); targetCtx.stroke();
      }
      targetCtx.beginPath(); targetCtx.arc(0, radius * .29, radius * .17, Math.PI + .18, Math.PI * 2 - .18); targetCtx.stroke();
    } else {
      const squint = emotion === 'impact' || emotion === 'power';
      if (squint) {
        targetCtx.strokeStyle = outline;
        targetCtx.lineWidth = Math.max(2.5, radius * .08);
        targetCtx.beginPath(); targetCtx.moveTo(-eyeX - radius * .11, eyeY - radius * .03); targetCtx.lineTo(-eyeX + radius * .11, eyeY + radius * .06); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.moveTo(eyeX + radius * .11, eyeY - radius * .03); targetCtx.lineTo(eyeX - radius * .11, eyeY + radius * .06); targetCtx.stroke();
      } else if (blink || closedHappy || chewSquint || anticipationSquint) {
        targetCtx.strokeStyle = outline;
        targetCtx.lineWidth = Math.max(2.5, radius * .075);
        for (const side of [-1, 1]) {
          targetCtx.beginPath();
          targetCtx.arc(eyeX * side, eyeY + radius * .05, radius * .14, Math.PI + .12, Math.PI * 2 - .12);
          targetCtx.stroke();
        }
      } else {
        const wide = emotion === 'joy' || emotion === 'surprised' || emotion === 'hungry';
        const eyeW = radius * (wide ? .185 : .17);
        const eyeH = radius * (wide ? .225 : .205);
        targetCtx.strokeStyle = outline;
        targetCtx.lineWidth = Math.max(2.2, radius * .07);
        for (const side of [-1, 1]) {
          const eyeCenter = eyeX * side;
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.ellipse(eyeCenter, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); targetCtx.fill(); targetCtx.stroke();
          const pupilX = eyeCenter + gazeX * radius * .055;
          const pupilY = eyeY + radius * .015 + gazeY * radius * .05;
          targetCtx.fillStyle = outline;
          targetCtx.beginPath(); targetCtx.ellipse(pupilX, pupilY, radius * .065, radius * .095, 0, 0, Math.PI * 2); targetCtx.fill();
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.arc(pupilX - radius * .018, pupilY - radius * .03, Math.max(1, radius * .018), 0, Math.PI * 2); targetCtx.fill();
        }
      }

      targetCtx.strokeStyle = outline;
      targetCtx.fillStyle = outline;
      targetCtx.lineWidth = Math.max(2.3, radius * .075);
      if (emotion === 'surprised' || emotion === 'hungry') {
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .27, radius * .115, radius * (emotion === 'hungry' ? .18 : .16), 0, 0, Math.PI * 2); targetCtx.fill();
        if (emotion === 'hungry') {
          targetCtx.fillStyle = '#f78591';
          targetCtx.beginPath(); targetCtx.ellipse(0, radius * .35, radius * .07, radius * .04, 0, 0, Math.PI * 2); targetCtx.fill();
        }
      } else if (emotion === 'chewing') {
        const mouthOpen = Math.max(0, (chewPulse - .46) / .54);
        if (mouthOpen < .08) {
          targetCtx.beginPath();
          targetCtx.arc(0, radius * .18, radius * .13, .16, Math.PI - .16);
          targetCtx.stroke();
        } else {
          const easedOpen = mouthOpen * mouthOpen * (3 - 2 * mouthOpen);
          targetCtx.beginPath();
          targetCtx.ellipse(0, radius * (.225 + easedOpen * .018), radius * (.075 + easedOpen * .035), radius * (.018 + easedOpen * .078), 0, 0, Math.PI * 2);
          targetCtx.fill();
        }
      } else if (emotion === 'anticipating' || emotion === 'savoring') {
        targetCtx.beginPath();
        targetCtx.arc(0, radius * .15, radius * .13, .18, Math.PI - .18);
        targetCtx.stroke();
      } else if (emotion === 'joy' || closedHappy) {
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .25, radius * .19, radius * .145, 0, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = '#f78591';
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .32, radius * .105, radius * .05, 0, 0, Math.PI * 2); targetCtx.fill();
      } else if (squint) {
        targetCtx.beginPath(); targetCtx.arc(0, radius * .16, radius * .19, .12, Math.PI - .12); targetCtx.stroke();
      } else {
        targetCtx.beginPath(); targetCtx.arc(0, radius * .15, radius * .165, .12, Math.PI - .12); targetCtx.stroke();
      }
    }

    if (skinId === 'cat') {
      targetCtx.globalAlpha = alpha * .75;
      targetCtx.strokeStyle = outline;
      targetCtx.lineWidth = Math.max(1.4, radius * .035);
      for (const side of [-1, 1]) {
        for (let index = -1; index <= 1; index += 1) {
          targetCtx.beginPath();
          targetCtx.moveTo(side * radius * .43, radius * (.12 + index * .08));
          targetCtx.lineTo(side * radius * .76, radius * (.08 + index * .13));
          targetCtx.stroke();
        }
      }
      targetCtx.globalAlpha = alpha;
    }
    targetCtx.restore();
  }

  window.SlimeAvatarRenderer = Object.freeze({ drawSlimeAvatar });
})();
