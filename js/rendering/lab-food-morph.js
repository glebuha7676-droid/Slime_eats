(() => {
  'use strict';

  const { smooth, lightTexture, beamTexture, beam, rewardSparks } = window.SlimeLabLight;
  const DURATION = 2.34;
  const REVEAL = 1.46;
  const interpolate = (from, to, weight) => from + (to - from) * weight;
  const angleStep = Math.PI * (3 - Math.sqrt(5));

  // Signed distances let one contour change shape without showing two sprites.
  function distanceTo(mask, width, height, inside) {
    const distance = Float32Array.from(mask, value => value === inside ? 0 : width + height);
    for (const direction of [1, -1]) {
      for (let row = 0; row < height; row++) {
        const y = direction === 1 ? row : height - 1 - row;
        for (let column = 0; column < width; column++) {
          const x = direction === 1 ? column : width - 1 - column;
          const index = y * width + x;
          const previousX = x - direction;
          const previousY = y - direction;
          let closest = distance[index];
          if (previousX >= 0 && previousX < width) closest = Math.min(closest, distance[index - direction] + 1);
          if (previousY >= 0 && previousY < height) {
            const previousRow = previousY * width;
            closest = Math.min(closest, distance[previousRow + x] + 1);
            if (x > 0) closest = Math.min(closest, distance[previousRow + x - 1] + Math.SQRT2);
            if (x < width - 1) closest = Math.min(closest, distance[previousRow + x + 1] + Math.SQRT2);
          }
          distance[index] = closest;
        }
      }
    }
    return distance;
  }

  function readMask(context, dish, width, height) {
    context.clearRect(0, 0, width, height);
    context.drawImage(dish.image, dish.x, dish.y, dish.width, dish.height);
    const pixels = context.getImageData(0, 0, width, height).data;
    return Uint8Array.from({ length: width * height }, (_, index) => pixels[index * 4 + 3] >= 96 ? 1 : 0);
  }

  function signedDistances(mask, width, height) {
    const inside = distanceTo(mask, width, height, 1);
    const outside = distanceTo(mask, width, height, 0);
    return inside.map((value, index) => outside[index] - value);
  }

  function unpackMask(image, box, width, height) {
    const shapes = window.SlimeLabFoodShapes;
    const source = image.getAttribute('src').split(/[?#]/)[0];
    const encoded = shapes?.masks[source];
    if (!encoded) return null;
    const { size } = shapes;
    const bits = atob(encoded);
    const mask = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
      const row = Math.floor((y + .5 - box.top) * size / box.height);
      if (row < 0 || row >= size) continue;
      for (let x = 0; x < width; x++) {
        const column = Math.floor((x + .5 - box.left) * size / box.width);
        if (column < 0 || column >= size) continue;
        const index = row * size + column;
        mask[y * width + x] = (bits.charCodeAt(index >> 3) >> (index & 7)) & 1;
      }
    }
    return mask;
  }

  function dishGeometry(tray, image) {
    const rect = image.getBoundingClientRect();
    const frame = tray.getBoundingClientRect();
    const scaleX = tray.offsetWidth / frame.width;
    const scaleY = tray.offsetHeight / frame.height;
    const offset = (getComputedStyle(image.parentElement).translate.split(' ')[1] || '0');
    const result = {
      image,
      x: (rect.left - frame.left) * scaleX,
      y: (rect.top - frame.top) * scaleY - (parseFloat(offset) || 0),
      width: rect.width * scaleX,
      height: rect.height * scaleY
    };
    const bounds = window.SlimeFoodGroundBounds?.[image.closest('.lab-tray-food').dataset.foodId];
    if (!bounds) return { ...result, visible: result };
    const [width, height, left, top, right, bottom] = bounds;
    const visible = {
      x: result.x + result.width * left / width,
      y: result.y + result.height * top / height,
      width: result.width * (right - left) / width,
      height: result.height * (bottom - top) / height
    };
    return { ...result, visible };
  }

  function prepare(tray, outgoing, incoming) {
    const dishes = [outgoing, incoming].map(image => dishGeometry(tray, image));
    if (dishes.some(dish => !dish.width || !dish.height)) return null;
    const margin = 8;
    const extentX = Math.max(...dishes.map(dish => dish.visible.width));
    const extentY = Math.max(...dishes.map(dish => dish.visible.height));
    const width = extentX + margin * 2;
    const height = extentY + margin * 2;
    const resolution = Math.min(2, 144 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * resolution);
    canvas.height = Math.ceil(height * resolution);
    const scratch = document.createElement('canvas');
    scratch.width = canvas.width;
    scratch.height = canvas.height;
    const template = scratch.getContext('2d', { willReadFrequently: true });
    const display = canvas.getContext('2d');
    if (!template || !display) return null;

    // Normalize around the visible art so the parts grow into each other as the overall bounds move.
    const aligned = dishes.map(dish => {
      const sx = extentX / dish.visible.width;
      const sy = extentY / dish.visible.height;
      return {
        image: dish.image,
        x: (margin + (dish.x - dish.visible.x) * sx) * resolution,
        y: (margin + (dish.y - dish.visible.y) * sy) * resolution,
        width: dish.width * sx * resolution,
        height: dish.height * sy * resolution
      };
    });
    const box = {
      left: margin * resolution, top: margin * resolution,
      width: extentX * resolution, height: extentY * resolution
    };
    const packed = () => aligned.map(dish => unpackMask(dish.image, box, canvas.width, canvas.height));
    let masks = location.protocol === 'file:' ? packed() : [];
    if (masks.length !== 2 || masks.some(mask => !mask)) {
      try {
        masks = aligned.map(dish => readMask(template, dish, canvas.width, canvas.height));
      } catch {
        // Protected external art can be drawn and recolored, but its pixels may be unreadable.
        masks = packed();
      }
    }
    const [before, after] = masks.map(mask => mask && signedDistances(mask, canvas.width, canvas.height));
    const output = display.createImageData(canvas.width, canvas.height);
    const pixels = output.data;
    pixels.fill(255);
    let previous = -1;
    function paint(blend, revealed) {
      if (!before || !after) {
        const stage = Number(revealed);
        if (stage === previous) return;
        previous = stage;
        const dish = aligned[stage];
        display.clearRect(0, 0, canvas.width, canvas.height);
        display.drawImage(dish.image, dish.x, dish.y, dish.width, dish.height);
        display.globalCompositeOperation = 'source-in';
        display.fillStyle = '#fff';
        display.fillRect(0, 0, canvas.width, canvas.height);
        display.globalCompositeOperation = 'source-over';
        return;
      }
      if (blend === previous) return;
      previous = blend;
      const swell = Math.sin(Math.PI * blend) * 1.8 * resolution;
      for (let index = 0; index < before.length; index++) {
        const distance = interpolate(before[index], after[index], blend) + swell;
        pixels[index * 4 + 3] = Math.max(0, Math.min(255, 128 + distance * 180));
      }
      display.putImageData(output, 0, 0);
    }
    return { canvas, paint, dishes, marginX: margin / extentX, marginY: margin / extentY };
  }

  function play(tray, outgoing, incoming, { isActive, onReveal }) {
    const canvas = tray.querySelector('.lab-evolution-visual');
    const context = canvas?.getContext('2d');
    let morph = prepare(tray, outgoing, incoming);
    if (!context || !morph) return Promise.resolve();

    const initialOffset = parseFloat(getComputedStyle(outgoing.parentElement).translate.split(' ')[1]) || 0;
    const halo = lightTexture();
    const projectorBeam = beamTexture(.46, .93, .06);
    const lenses = [...tray.querySelectorAll('.lab-evolution-lens')];
    const indicators = [...tray.querySelectorAll('.lab-evolution-indicator')];
    const effects = [...tray.querySelectorAll('.lab-food-effects')];
    let geometry;
    let resized = false;
    const observer = new ResizeObserver(() => { resized = true; });
    observer.observe(tray);

    function layout() {
      const frame = tray.getBoundingClientRect();
      const width = tray.clientWidth;
      const height = tray.clientHeight;
      if (!width || !height) return;
      const sx = width / frame.width;
      const sy = height / frame.height;
      const density = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      const projectors = lenses.map(lens => {
        const rect = lens.getBoundingClientRect();
        return {
          x: (rect.left + rect.width / 2 - frame.left) * sx,
          y: (rect.top + rect.height / 2 - frame.top) * sy
        };
      });
      geometry = { width, height, density, projectors };
    }

    function draw(time) {
      const { width, height, density, projectors } = geometry;
      const strength = smooth(.02, .43, time) * (1 - smooth(REVEAL, 2.03, time));
      const blend = smooth(.39, 1.38, time);
      const lift = interpolate(initialOffset, -13, smooth(0, .58, time)) + 14 * smooth(REVEAL, DURATION, time);
      const shock = smooth(1.30, REVEAL, time) * (1 - smooth(REVEAL + .045, 1.89, time));
      const ripple = smooth(REVEAL, 2.1, time);
      const pop = smooth(REVEAL - .06, REVEAL + .095, time) * (1 - smooth(REVEAL + .095, 2.12, time));
      const scale = 1 + pop * .125;
      const [before, after] = morph.dishes;
      const [leftLens, rightLens] = projectors;
      const span = rightLens.x - leftLens.x;
      const x = width / 2;
      const plate = (leftLens.y + rightLens.y) * .5 + span * .04;
      const beforeCenter = before.visible.y + before.visible.height * .5;
      const afterCenter = after.visible.y + after.visible.height * .5;
      const y = interpolate(beforeCenter, afterCenter, blend) + lift;

      context.setTransform(density, 0, 0, density, 0, 0);
      context.clearRect(0, 0, width, height);
      const glow = (cx, cy, rx, ry, opacity) => {
        if (opacity <= 0) return;
        context.globalAlpha = opacity;
        context.drawImage(halo, cx - rx, cy - ry, rx * 2, ry * 2);
      };
      for (const [index, lens] of projectors.entries()) {
        const power = strength * (.90 + .10 * Math.sin(time * 14 - index * 1.5));
        const target = x + (index ? -.07 : .07) * span;
        lenses[index].style.opacity = power;
        indicators[index].style.opacity = Math.max(strength * (.77 + .23 * Math.sin(time * 13 - index * 2.65)), pop);
        beam(context, projectorBeam, lens.x, lens.y, target, y - 12, span * .29, power * .76);
      }
      if (effects[0]) effects[0].style.opacity = 1 - smooth(0, .26, time);
      if (effects[1]) effects[1].style.opacity = smooth(1.91, DURATION, time);
      glow(x, plate, span * .54, span * .1, strength * .55);
      glow(x, y, span * .37, span * .34, strength * .33);

      context.save();
      context.translate(x, y);
      context.scale(scale, scale);
      context.translate(-x, -y + lift);
      const hot = smooth(.12, .38, time) * (1 - smooth(REVEAL, 1.9, time));
      const incomingColor = smooth(REVEAL, 1.73, time);
      const coloredDish = time < REVEAL ? before : after;
      const colorAmount = time < REVEAL ? 1 - smooth(.12, .39, time) : incomingColor;
      if (colorAmount > 0) {
        context.globalAlpha = colorAmount;
        context.drawImage(coloredDish.image, coloredDish.x, coloredDish.y, coloredDish.width, coloredDish.height);
      }
      if (hot > 0) {
        morph.paint(blend, time >= REVEAL);
        const silhouetteWidth = interpolate(before.visible.width, after.visible.width, blend);
        const silhouetteHeight = interpolate(before.visible.height, after.visible.height, blend);
        const padX = silhouetteWidth * morph.marginX;
        const padY = silhouetteHeight * morph.marginY;
        context.globalAlpha = hot;
        context.shadowColor = '#69d9ff';
        context.shadowBlur = 10 * density;
        context.drawImage(morph.canvas,
          interpolate(before.visible.x, after.visible.x, blend) - padX,
          interpolate(before.visible.y, after.visible.y, blend) - padY,
          silhouetteWidth + padX * 2, silhouetteHeight + padY * 2);
      }
      context.restore();

      const gather = smooth(.1, .34, time) * (1 - smooth(1.25, REVEAL, time));
      context.globalCompositeOperation = 'lighter';
      if (gather > 0) {
        for (let index = 0; index < 30; index++) {
          const phase = (index / 30 + time * (.66 + (index % 4) * .08)) % 1;
          const angle = index * angleStep + phase * 2.8 + time * 2.2;
          const distance = span * (.43 - .35 * smooth(0, 1, phase));
          const radius = 2 + index % 5 * .59;
          glow(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * .74,
            radius, radius, gather * smooth(0, .18, phase) * (1 - smooth(.79, 1, phase)));
        }
      }
      if (ripple > 0 && ripple < 1) {
        context.globalAlpha = (1 - ripple) * .68;
        context.strokeStyle = '#c6f7ff';
        context.lineWidth = 2 - ripple;
        context.beginPath();
        context.ellipse(x, plate, span * (.16 + ripple * .44), span * (.038 + ripple * .064), 0, 0, Math.PI * 2);
        context.stroke();
        for (let index = 0; index < 24; index++) {
          const angle = index * angleStep;
          const distance = span * (.08 + ripple * (.24 + (index % 7) * .032));
          const radius = 2 + index % 7 * .55;
          glow(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * .7 - ripple * 9,
            radius, radius, (1 - ripple) * .86);
        }
      }
      glow(x, y, span * (.15 + ripple * .37), span * (.23 + ripple * .17), shock);
      glow(x, y, span * .23, span * .31, shock * .87);
      context.globalCompositeOperation = 'source-over';
      rewardSparks(context, x, y, width, smooth(REVEAL, 2.29, time), true);
      context.globalAlpha = 1;
    }

    tray.classList.add('is-evolving');
    layout();
    if (geometry) draw(0);
    return new Promise(resolve => {
      let time = 0;
      let previous;
      let revealed = false;
      function finish() {
        observer.disconnect();
        resolve();
      }
      function tick(timestamp) {
        if (!isActive()) { finish(); return; }
        if (geometry && resized && (tray.clientWidth !== geometry.width || tray.clientHeight !== geometry.height)) {
          morph = prepare(tray, outgoing, incoming) || morph;
          layout();
        }
        resized = false;
        time = Math.min(DURATION, time + Math.min(.045, (timestamp - (previous ?? timestamp)) / 1000));
        previous = timestamp;
        if (geometry) draw(time);
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

  window.SlimeLabFoodMorph = Object.freeze({ play });
})();
