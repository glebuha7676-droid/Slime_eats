(() => {
  'use strict';

  const DURATION = 2.95;
  const REVEAL = 2.16;
  const { smooth, lightTexture, beamTexture, beam, rewardSparks } = window.SlimeLabLight;

  function play(tray, { isActive, onProgress, onReveal }) {
    const canvas = tray.querySelector('.lab-synthesis-visual');
    const dish = tray.querySelector('.lab-tray-food-art');
    const context = canvas?.getContext('2d');
    if (!context || !dish?.naturalWidth) return Promise.resolve();

    const halo = lightTexture();
    const mainBeam = beamTexture(.20, .96);
    const sideBeam = beamTexture(.39, .93, .07);
    const lenses = [...tray.querySelectorAll('.lab-chamber-node'), tray.querySelector('.lab-synthesis-nozzle')];
    const effects = tray.querySelector('.lab-food-effects');
    const sprite = document.createElement('canvas');
    const buffer = document.createElement('canvas');
    const food = buffer.getContext('2d');
    if (!food) return Promise.resolve();
    let geometry;
    let needsLayout = true;
    let revealed = false;
    const observer = new ResizeObserver(() => { needsLayout = true; });
    observer.observe(tray);

    function layout() {
      const frame = tray.getBoundingClientRect();
      const rect = dish.getBoundingClientRect();
      const width = tray.clientWidth;
      const height = tray.clientHeight;
      if (!width || !height) return;
      const sx = width / frame.width;
      const sy = height / frame.height;
      const density = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      const dishWidth = rect.width * sx;
      const dishHeight = rect.height * sy;
      sprite.width = buffer.width = Math.ceil(dishWidth * density);
      sprite.height = buffer.height = Math.ceil(dishHeight * density);
      sprite.getContext('2d').drawImage(dish, 0, 0, sprite.width, sprite.height);
      // The beam starts at the same element that lights the painted lens.
      const emitters = lenses.map(lens => {
        const lensRect = lens.getBoundingClientRect();
        return {
          x: (lensRect.left + lensRect.width / 2 - frame.left) * sx,
          y: (lensRect.top + lensRect.height / 2 - frame.top) * sy
        };
      });
      const bounds = window.SlimeFoodGroundBounds?.[dish.closest('.lab-tray-food').dataset.foodId];
      const visibleTop = bounds ? bounds[3] / bounds[1] : 0;
      const visibleBottom = bounds ? bounds[5] / bounds[1] : 1;
      geometry = {
        width, height, density, dishWidth, dishHeight, visibleTop, visibleBottom, emitters,
        dishX: (rect.left - frame.left) * sx, dishY: (rect.top - frame.top) * sy,
        plate: height - .265 * width
      };
      needsLayout = false;
    }

    function draw(time) {
      if (needsLayout) layout();
      if (!geometry) return;
      const { width, height, density, plate, dishWidth, dishHeight, dishX, dishY, visibleTop, visibleBottom, emitters } = geometry;
      const center = width / 2;
      const meeting = Math.max(width * .56, plate - width * .17);
      const charge = smooth(.03, .88, time);
      const release = smooth(REVEAL - .06, REVEAL + .30, time);
      const power = charge * (1 - release) * (.86 + .14 * Math.sin(time * (8 + 4 * time)));
      const sidePower = smooth(.18, .91, time) * (1 - release);
      const burst = smooth(2.00, REVEAL, time) * (1 - smooth(REVEAL + .08, 2.58, time));
      const orbit = smooth(.38, .92, time) * (1 - smooth(1.82, REVEAL, time));
      const material = smooth(.65, REVEAL, time);

      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, width, height);
      const glow = (x, y, radiusX, radiusY, opacity) => {
        context.globalAlpha = opacity;
        context.drawImage(halo, x - radiusX, y - radiusY, radiusX * 2, radiusY * 2);
      };
      const [leftLens, rightLens, nozzle] = emitters;
      lenses[0].style.opacity = sidePower * (.85 + .15 * Math.sin(time * 10));
      lenses[1].style.opacity = sidePower * (.85 + .15 * Math.sin(time * 10 + Math.PI));
      lenses[2].style.opacity = power;
      if (effects) effects.style.opacity = smooth(2.63, DURATION, time);
      beam(context, mainBeam, nozzle.x, nozzle.y, center, plate + width * .01, width * .54, power);
      beam(context, sideBeam, leftLens.x, leftLens.y, center + width * .065, meeting + width * .13, width * .21, sidePower * .6);
      beam(context, sideBeam, rightLens.x, rightLens.y, center - width * .065, meeting + width * .13, width * .21, sidePower * .6);

      if (material > 0) {
        const edge = visibleBottom + .13 - (visibleBottom - visibleTop + .27) * material;
        food.globalCompositeOperation = 'source-over';
        food.clearRect(0, 0, buffer.width, buffer.height);
        food.drawImage(sprite, 0, 0);
        food.globalCompositeOperation = 'source-atop';
        food.fillStyle = `rgba(193,245,255,${.86 * (1 - smooth(1.87, 2.39, time))})`;
        food.fillRect(0, 0, buffer.width, buffer.height);
        if (material < 1) {
          const reveal = food.createLinearGradient(0, (edge - .11) * buffer.height, 0, (edge + .11) * buffer.height);
          reveal.addColorStop(0, 'transparent');
          reveal.addColorStop(1, '#fff');
          food.globalCompositeOperation = 'destination-in';
          food.fillStyle = reveal;
          food.fillRect(0, 0, buffer.width, buffer.height);
        }
        const pop = smooth(REVEAL - .08, REVEAL + .07, time) * (1 - smooth(REVEAL + .07, 2.65, time));
        const scale = .84 + .16 * material + pop * .21;
        const lift = width * (.015 + .024 * material) * (1 - smooth(REVEAL, 2.89, time));
        context.globalAlpha = smooth(.65, 1.14, time);
        context.drawImage(buffer, center + (dishX - center) * scale, plate + (dishY - plate) * scale - lift,
          dishWidth * scale, dishHeight * scale);
      }

      const ripple = smooth(REVEAL, 2.74, time);
      if (time >= REVEAL && time < 2.74) {
        const spread = .08 + .29 * ripple;
        context.globalAlpha = .86 * (1 - ripple);
        context.strokeStyle = '#c5f7ff';
        context.lineWidth = 1.8 - ripple;
        context.beginPath();
        context.ellipse(center, plate, width * spread, width * spread * .22, 0, 0, 2 * Math.PI);
        context.stroke();
        context.globalAlpha *= .62;
        context.strokeStyle = '#fff1af';
        context.beginPath();
        context.ellipse(center, plate, width * spread * .74, width * spread * .16, 0, 0, 2 * Math.PI);
        context.stroke();
      }
      const flashY = (meeting + dishY + dishHeight * (visibleTop + visibleBottom) * .5) * .5;
      glow(center, flashY, width * (.23 + ripple * .18), width * (.24 + ripple * .14), burst * .94);
      glow(center, flashY, width * .105, width * .12, burst * .85);
      const pullTime = Math.min(time, REVEAL);
      for (let index = 0; index < 19; index++) {
        const arrival = (index / 19 + pullTime * .83) % 1;
        const angle = index * 2.4 + arrival * 1.7 + pullTime * 1.5;
        const pull = smooth(0, 1, arrival);
        const distance = width * (.23 - pull * .15 - material * .035 + ripple * .25);
        const x = center + Math.cos(angle) * distance;
        const y = meeting + Math.sin(angle) * distance * .66;
        const radius = 2.9 + index % 4 * .62;
        const inward = orbit * smooth(.0, .2, arrival) * (1 - smooth(.80, 1, arrival));
        glow(x, y, radius, radius, Math.max(inward * .87, .76 * ripple * (1 - ripple) * 4));
      }
      rewardSparks(context, center, flashY, width * 1.14, smooth(REVEAL, 2.89, time), true);
      context.globalAlpha = 1;
    }

    return new Promise(resolve => {
      let startedAt;
      const finish = () => {
        observer.disconnect();
        context.clearRect(0, 0, canvas.width / (geometry?.density || 1), canvas.height / (geometry?.density || 1));
        lenses.forEach(lens => lens.style.removeProperty('opacity'));
        effects?.style.removeProperty('opacity');
        resolve();
      };
      function tick(timestamp) {
        if (!isActive()) { finish(); return; }
        startedAt ??= timestamp;
        const time = Math.min(DURATION, (timestamp - startedAt) / 1000);
        draw(time);
        onProgress(Math.min(time / REVEAL, 1));
        if (!revealed && time >= REVEAL) {
          revealed = true;
          onReveal();
        }
        if (time < DURATION) requestAnimationFrame(tick);
        else finish();
      }
      requestAnimationFrame(tick);
    });
  }

  window.SlimeLabSynthesisAnimation = Object.freeze({ play });
})();
