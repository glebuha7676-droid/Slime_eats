(() => {
  'use strict';

  const canvas = document.querySelector('#slimeCanvas');
  const ctx = canvas.getContext('2d');
  const buttons = [...document.querySelectorAll('[data-motion]')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, active: false };
  let motion = 'idle';
  let motionStartedAt = performance.now();

  function setMotion(next) {
    motion = next;
    motionStartedAt = performance.now();
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.motion === next)));
  }

  function updatePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - .5) * 2));
    pointer.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - .5) * 2));
    pointer.active = true;
  }

  function motionState(time) {
    if (reduceMotion) return { x: 0, y: 0, sx: 1, sy: 1, rotation: 0, tip: 0, expression: 'smile', speed: 0 };
    const elapsed = time - motionStartedAt;

    if (motion === 'happy') {
      const phase = (elapsed % 1500) / 1500;
      const hop = Math.max(0, Math.sin(phase * Math.PI));
      const land = Math.max(0, Math.sin((phase - .72) / .28 * Math.PI));
      return {
        x: Math.sin(phase * Math.PI * 2) * 3,
        y: -hop * 35 + land * 7,
        sx: 1 - hop * .055 + land * .12,
        sy: 1 + hop * .08 - land * .12,
        rotation: Math.sin(phase * Math.PI * 2) * .025,
        tip: Math.sin(phase * Math.PI * 2) * .06,
        expression: 'happy',
        speed: hop
      };
    }

    if (motion === 'fall') {
      const phase = (elapsed % 3600) / 3600;
      const steer = Math.sin(elapsed / 520);
      const speed = .45 + .55 * Math.sin(Math.min(1, phase / .8) * Math.PI * .5);
      return {
        x: steer * 13,
        y: -9 + Math.sin(phase * Math.PI * 2) * 5,
        sx: 1 - speed * .065,
        sy: 1 + speed * .11,
        rotation: steer * .055,
        tip: -steer * .09,
        expression: 'smile',
        speed
      };
    }

    const breathe = Math.sin(elapsed / 720);
    return {
      x: Math.sin(elapsed / 1700) * 1.4,
      y: breathe * 2.4,
      sx: 1 + breathe * .018,
      sy: 1 - breathe * .014,
      rotation: Math.sin(elapsed / 1900) * .012,
      tip: Math.sin(elapsed / 1050) * .035,
      expression: 'smile',
      speed: 0
    };
  }

  function drawWind(time, state, x, y, radius) {
    if (motion !== 'fall' || reduceMotion) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (let index = 0; index < 12; index += 1) {
      const phase = (time / (560 + index * 19) + index * .173) % 1;
      const side = index % 2 ? 1 : -1;
      const px = x + side * radius * (.78 + index % 3 * .18);
      const py = y - radius + phase * radius * 2.25;
      ctx.globalAlpha = Math.sin(phase * Math.PI) * (.15 + state.speed * .26);
      ctx.strokeStyle = index % 3 ? '#91d9c6' : '#fff';
      ctx.lineWidth = index % 3 ? 2.4 : 3.6;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - state.rotation * 70, py + 18 + state.speed * 34);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShadow(state, x, y, radius) {
    const lift = Math.max(0, -state.y);
    ctx.save();
    ctx.globalAlpha = .22 - Math.min(.1, lift / 400);
    ctx.fillStyle = '#285f52';
    ctx.filter = 'blur(7px)';
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 1.09, radius * (.57 - lift / 800), radius * .1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function frame(time) {
    requestAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const state = motionState(time);
    const x = canvas.width * .5;
    const y = canvas.height * .52;
    const radius = canvas.width * .255;
    const blinkPhase = (time - motionStartedAt) % 3900;
    const gazeX = pointer.active ? pointer.x * .72 : Math.sin(time / 1700) * .28;
    const gazeY = pointer.active ? pointer.y * .45 : Math.sin(time / 2300) * .1;

    drawWind(time, state, x, y, radius);
    drawShadow(state, x, y, radius);
    window.SlimeCharacterV2.draw(ctx, {
      x: x + state.x,
      y: y + state.y,
      radius,
      time,
      scaleX: state.sx,
      scaleY: state.sy,
      rotation: state.rotation,
      gazeX,
      gazeY,
      blink: motion !== 'happy' && blinkPhase > 3750,
      expression: state.expression,
      tipSway: state.tip
    });
  }

  buttons.forEach(button => button.addEventListener('click', () => setMotion(button.dataset.motion)));
  canvas.addEventListener('pointermove', updatePointer);
  canvas.addEventListener('pointerdown', event => {
    updatePointer(event);
    setMotion('happy');
  });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; });

  requestAnimationFrame(frame);
})();
