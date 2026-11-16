(() => {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cache = new Map();
  const FIRE_FLASH_SIZE = 3;
  const FIRE_FLASH_WINDUP_MS = 290;
  const FIRE_FLASH_DURATION_MS = 425;
  const ELECTRIC_DASH_MS = 285;
  const ELECTRIC_DASH_TRAIL_MS = 185;

  // One small raster per colour, shared by all particles. No live canvas blur filters.
  function glow(colour) {
    if (cache.has(colour)) return cache.get(colour);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const c = canvas.getContext('2d'), g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    const colours = {
      fire: ['255,255,218', '255,198,49', '255,78,8']
    }[colour];
    g.addColorStop(0, `rgba(${colours[0]},1)`);
    g.addColorStop(.14, `rgba(${colours[0]},.96)`);
    g.addColorStop(.34, `rgba(${colours[1]},.8)`);
    g.addColorStop(.62, `rgba(${colours[2]},.29)`);
    g.addColorStop(1, `rgba(${colours[2]},0)`);
    c.fillStyle = g; c.fillRect(0, 0, 128, 128); cache.set(colour, canvas); return canvas;
  }
  function light(c, colour, x, y, size, alpha = 1, stretch = 1) {
    if (alpha <= 0 || size <= 0) return;
    c.globalAlpha = alpha; c.drawImage(glow(colour), x - size / 2, y - size * stretch / 2, size, size * stretch);
  }
  function startFireFlash(run, at, lowPower = false) {
    run.fireFlash = { startedAt: at, lit: false, lowPower };
  }

  function fireCastLight(run, at) {
    const flash = run.fireFlash;
    if (!flash) return null;
    const age = at - flash.startedAt;
    const released = flash.lit && age >= FIRE_FLASH_WINDUP_MS;
    const releaseAge = released ? age - FIRE_FLASH_WINDUP_MS : 0;
    const charge = clamp(age / 120, 0, 1);
    const glow = released ? (1 - clamp(releaseAge / 280, 0, 1)) ** 1.4 : 1 - (1 - charge) ** 2.2;
    const spread = clamp(releaseAge / 152, 0, 1);
    const flare = released ? (1 - spread) ** 1.75 : 0;
    return glow > 0 ? { glow, flare, spread } : null;
  }

  function updateFireFlash(run, at, services) {
    const flash = run.fireFlash;
    const ignitionAt = flash.startedAt + FIRE_FLASH_WINDUP_MS;
    if (!flash.lit && at >= ignitionAt) {
      const cell = run.cellSize;
      const { x, y } = run.slime;
      const width = Math.min(FIRE_FLASH_SIZE, run.columns);
      const col = Math.floor((x - run.gridOffsetX) / cell);
      const firstCol = clamp(col - 1, 0, run.columns - width);
      const slimeRow = Math.floor((y - run.blockRowOrigin) / cell + 1e-8);
      const firstRow = slimeRow + 2;
      flash.x = run.gridOffsetX + (firstCol + width / 2) * cell;
      flash.y = run.blockRowOrigin + (firstRow + FIRE_FLASH_SIZE / 2) * cell;
      flash.lit = true;
      services.onFireFlash?.();
      for (let row = firstRow; row < firstRow + FIRE_FLASH_SIZE; row += 1) {
        for (const block of run.blocksByRow.get(row) || []) {
          if (block.col >= firstCol && block.col < firstCol + width) {
            services.igniteBlock(block, ignitionAt);
          }
        }
      }
    }
    if (at - ignitionAt >= FIRE_FLASH_DURATION_MS) run.fireFlash = null;
  }

  function startElectricDash(run, at, horizontal, width, lowPower = false) {
    const { x, y, radius } = run.slime;
    const distance = run.cellSize * 3;
    const dx = clamp(horizontal * Math.SQRT1_2 * distance, radius - x, width - radius - x) / distance;
    run.electricDash = { elapsed: 0, spent: 0, dx, dy: Math.sqrt(1 - dx * dx), distance, lowPower,
      trail: [{ x, y, at }], endedAt: null };
  }

  function driveElectricDash(run, dt) {
    const { slime, electricDash: dash } = run;
    dash.elapsed = Math.min(ELECTRIC_DASH_MS, dash.elapsed + dt * 1000);
    const t = dash.elapsed / ELECTRIC_DASH_MS;
    const distance = dash.distance * (t + Math.sin(t * Math.PI) * .20);
    const speed = (distance - dash.spent) / dt;
    dash.spent = distance;
    slime.vx = dash.dx * speed;
    slime.vy = dash.dy * speed;
    return t >= 1;
  }

  function sampleElectricDash(run, at) {
    const { trail } = run.electricDash;
    if (at - trail.at(-1).at < 15) return;
    const { x, y } = run.slime;
    trail.push({ x, y, at });
    if (trail.length > 13) trail.shift();
  }

  function update(run, at, services) {
    if (run.fireFlash) updateFireFlash(run, at, services);
    if (run.electricDash?.endedAt != null && at - run.electricDash.endedAt >= ELECTRIC_DASH_TRAIL_MS) run.electricDash = null;
  }

  function shiftClock(run, delta) {
    if (run.fireFlash) run.fireFlash.startedAt += delta;
    if (run.electricDash) {
      if (run.electricDash.endedAt != null) run.electricDash.endedAt += delta;
      for (const point of run.electricDash.trail) point.at += delta;
    }
  }

  function drawFireFlash(c, flash, run, at, reduced) {
    const age = Math.max(0, at - flash.startedAt - FIRE_FLASH_WINDUP_MS);
    const cell = run.cellSize;
    const x = flash.x;
    const y = flash.y - run.cameraY;
    if (y < -cell * 3 || y > run.viewHeight + cell * 3) return;
    const time = clamp(age / 145, 0, 1);
    const expansion = 1 - (1 - time) ** 3;
    const glowDown = (1 - clamp(age / 178, 0, 1)) ** 2;
    const fade = (1 - clamp((age - 26) / (FIRE_FLASH_DURATION_MS - 26), 0, 1)) ** 2;
    c.save();
    c.globalCompositeOperation = 'lighter';
    light(c, 'fire', x, y, cell * (1.32 + expansion * 2.75), glowDown, .94);
    if (time > 0) {
      const arms = flash.lowPower ? 7 : 11;
      for (let i = 0; i < arms; i += 1) {
        const angle = i * Math.PI * 2 / arms + .45;
        const size = cell * (.55 + (i * .619 % 1) * .78);
        const distance = cell * expansion * (1.10 + (i * .382 % 1) * .58);
        c.save();
        c.translate(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
        c.rotate(angle);
        light(c, 'fire', 0, 0, size * 1.65, fade * .66, .82);
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = fade * .92;
        const tongue = c.createLinearGradient(-size * .62, 0, size * .66, 0);
        tongue.addColorStop(0, '#ff641400');
        tongue.addColorStop(.36, '#ff9d3ad8');
        tongue.addColorStop(.68, '#ffe28bbd');
        tongue.addColorStop(1, '#ffa13700');
        c.fillStyle = tongue;
        c.beginPath();
        c.moveTo(-size * .7, 0);
        c.bezierCurveTo(-size * .37, -size * .32, size * .25, -size * .30, size * .68, -size * .45);
        c.bezierCurveTo(size * .38, size * .22, -size * .12, size * .33, -size * .7, 0);
        c.fill();
        c.restore();
      }
    }
    if (!reduced) {
      for (let i = 0; i < (flash.lowPower ? 12 : 24); i += 1) {
        const life = clamp(age / (180 + i % 7 * 35), 0, 1);
        const angle = i * 2.39996 + .45;
        const distance = cell * (.60 + (i * .618 % 1) * 1.68) * (1 - (1 - life) ** 2.2);
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance - cell * life * life * .19;
        const alpha = Math.sin(life * Math.PI);
        light(c, 'fire', px, py, 7 + i % 4 * 3.2, alpha * .94, 1.25);
      }
    }
    c.restore();
  }

  function drawElectricDash(c, run, at, reduced) {
    const { electricDash: dash, slime, cameraY } = run;
    const effects = window.SlimeMutationImpacts;
    if (dash.endedAt == null) effects.halo(c, 'electric', slime.x, slime.y - cameraY, slime.radius * 4.3, .80);
    if (reduced) return;
    const tail = dash.trail.filter(point => at - point.at < ELECTRIC_DASH_TRAIL_MS);
    const head = dash.endedAt == null ? slime : tail.at(-1);
    if (!head) return;
    for (const [i, point] of tail.entries()) {
      const t = clamp((at - point.at) / ELECTRIC_DASH_TRAIL_MS, 0, 1);
      const fade = (1 - t) ** 1.4;
      effects.halo(c, 'electric', point.x, point.y - cameraY, slime.radius * (2.8 - t * 1.5), fade * .59, 1.25);
      if (dash.lowPower && i % 2) continue;
      const side = i % 2 ? -1 : 1;
      const spread = slime.radius * (.52 + t * .9) * side;
      const px = point.x + dash.dy * spread - dash.dx * t * 23;
      const py = point.y - cameraY - dash.dx * spread - dash.dy * t * 23;
      effects.electricDischarge(c, px, py, px - dash.dx * 19, py - dash.dy * 19, 1.1, 4.1, point.x + i, fade * .86);
      effects.halo(c, 'electric', px, py, 9, fade * .65);
    }
    const anchor = tail[0];
    if (anchor) {
      const opacity = dash.endedAt == null ? .87 : .87 * clamp(1 - (at - dash.endedAt) / 120, 0, 1);
      effects.electricDischarge(c, anchor.x, anchor.y - cameraY, head.x, head.y - cameraY, 2.1, 10,
        Math.floor(at / 57), opacity);
    }
  }

  function draw(c, run, at, reduced = false) {
    if (run.fireFlash?.lit) drawFireFlash(c, run.fireFlash, run, at, reduced);
  }
  window.SlimeElementalUltimates = Object.freeze({
    startFireFlash, fireCastLight, startElectricDash, driveElectricDash, sampleElectricDash, drawElectricDash, update, draw, shiftClock
  });
})();
