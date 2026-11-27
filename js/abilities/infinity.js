(() => {
  'use strict';

  const EMBLEM = 'assets/ui/slime/infinity/emblem-three-spheres-v2.webp';
  const SHIELD_MS = 8000;
  const SHIELD_HIT_STOP_MS = 105;
  const SHOTS = Object.freeze({
    blue: { width: 3, rows: 3, charge: 590, travel: 0, tail: 450, rgb: '39,159,255', light: '#8deeff', core: '#061d56', accent: '#447aff' },
    red: { width: 2, rows: 6, charge: 265, travel: 575, tail: 335, rgb: '255,43,80', light: '#ffc4b2', core: '#52102a', accent: '#ff4776' },
    purple: { width: 3, rows: 13, charge: 1530, travel: 860, tail: 450, rgb: '159,79,255', light: '#edc8ff', core: '#230d51', accent: '#e583fa' }
  });
  const FUSION_AT = 1080;
  const TOUCH_EPSILON = 1e-5;
  const PI2 = Math.PI * 2;
  const unit = n => Math.max(0, Math.min(1, n));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = n => { const t = unit(n); return t * t * (3 - 2 * t); };

  function create(stage, at, { shield = true } = {}) {
    return { stage, mode: 'blue', shield, nextShieldAt: shield ? at + SHIELD_MS : Infinity, shieldLitAt: at, shieldHitAt: -Infinity,
      shieldStopUntil: 0, readyAt: 0, cast: null };
  }

  function swap(state) {
    if (!state || state.stage < 2 || state.cast) return false;
    state.mode = state.mode === 'blue' ? 'red' : 'blue';
    return true;
  }

  function refreshShield(state, at) {
    if (!state || at < state.nextShieldAt) return;
    state.nextShieldAt += (1 + Math.floor((at - state.nextShieldAt) / SHIELD_MS)) * SHIELD_MS;
    if (!state.shield) state.shieldLitAt = at;
    state.shield = true;
  }

  function protectsDuringUltimate(state, at) {
    const cast = state?.cast;
    return cast?.kind === 'purple' && !cast.finished && at >= cast.at && at - cast.at < SHOTS.purple.charge + SHOTS.purple.travel;
  }

  function absorb(state, at, nx = 0, ny = -1) {
    if (!state || protectsDuringUltimate(state, at)) return false;
    refreshShield(state, at);
    if (!state.shield) return false;
    state.shield = false;
    state.shieldHitAt = at;
    state.shieldStopUntil = at + SHIELD_HIT_STOP_MS;
    state.shieldHitAngle = Math.atan2(-ny, -nx);
    return true;
  }

  function holdShieldFrame(state, at, lastAt) {
    const end = state.shieldStopUntil;
    const held = Math.max(0, Math.min(at, end) - Math.max(lastAt, state.shieldHitAt));
    if (state.cast) state.cast.at += held;
    if (at >= end) state.shieldStopUntil = 0;
    return at < end;
  }

  function blocksInBand(run, top, bottom) {
    const first = Math.floor((top - run.blockRowOrigin) / run.cellSize);
    const last = Math.floor((bottom - run.blockRowOrigin) / run.cellSize);
    const blocks = new Set(run.movingHazards);
    for (let row = first; row <= last; row += 1) {
      for (const block of run.blocksByRow.get(row) || []) blocks.add(block);
    }
    return blocks;
  }

  function start(run, kind, at, canBreak, { ignoreCooldown = false } = {}) {
    const state = run.infinity;
    if (!state || !SHOTS[kind] || state.cast || (kind === 'purple' ? state.stage < 3 : state.mode !== kind || (!ignoreCooldown && at < state.readyAt))) return false;
    const shot = SHOTS[kind];
    const { slime, cellSize: cell, gridOffsetX, columns, blockRowOrigin } = run;
    const firstCol = Math.max(0, Math.min(columns - shot.width,
      Math.round((slime.x - gridOffsetX) / cell - shot.width / 2)));
    const x = gridOffsetX + (firstCol + shot.width / 2) * cell;
    const firstRow = Math.max(0, Math.ceil((slime.y + slime.radius - blockRowOrigin - TOUCH_EPSILON) / cell));
    const startY = blockRowOrigin + firstRow * cell;
    const endY = startY + shot.rows * cell;
    const radius = shot.width * cell / 2;
    const launchY = kind === 'red' ? startY + cell * .15 : startY - radius;
    const cast = { kind, at, x, startY, endY, centerY: (startY + endY) / 2, sourceY: slime.y,
      radius, launchY, lastY: launchY, released: false, finished: false, pull: new Set(), hit: new Set() };
    if (kind === 'blue') {
      for (const block of blocksInBand(run, startY, endY)) {
        if (block.x < x + radius - TOUCH_EPSILON && block.x + block.w > x - radius + TOUCH_EPSILON
          && block.y < endY - TOUCH_EPSILON && block.y + block.h > startY + TOUCH_EPSILON
          && canBreak(block, kind)) cast.pull.add(block);
      }
    }
    state.cast = cast;
    return true;
  }

  function projectile(cast, age) {
    const shot = SHOTS[cast.kind];
    const t = unit((age - shot.charge) / shot.travel);
    const travel = cast.kind === 'purple' ? t * (1.36 - .36 * t) : t * (1.18 - .18 * t);
    return { t, y: lerp(cast.launchY, cast.endY, travel) };
  }

  function hitBySweep(cast, block, fromY, toY) {
    const dx = Math.max(block.x - cast.x, cast.x - block.x - block.w, 0);
    if (dx >= cast.radius - TOUCH_EPSILON) return false;
    const reach = Math.sqrt(cast.radius ** 2 - dx ** 2);
    const top = Math.max(cast.startY, fromY - reach);
    const bottom = Math.min(cast.endY, toY + reach);
    return bottom - top > TOUCH_EPSILON && block.y < bottom - TOUCH_EPSILON && block.y + block.h > top + TOUCH_EPSILON;
  }

  function update(run, at, { canBreak, destroy, impact, cue }) {
    const state = run.infinity;
    if (!state) return;
    refreshShield(state, at);
    const cast = state.cast;
    if (!cast) return;
    const shot = SHOTS[cast.kind];
    const age = at - cast.at;
    if (cast.kind === 'purple' && !cast.fused && age >= FUSION_AT) {
      cast.fused = true;
      if (age < shot.charge) cue?.('infinityFusion', at, age - FUSION_AT);
    }
    if (age < shot.charge) return;
    if (!cast.released) {
      cast.released = true;
      impact(cast.kind, false, at, age - shot.charge);
    }
    if (cast.kind === 'blue') {
      if (!cast.finished) {
        for (const block of cast.pull) {
          if (canBreak(block, cast.kind)) destroy(block, 'infinityBlue', at);
          if (run.ended || run.evacuation) return;
        }
        cast.finished = true;
      }
    } else if (!cast.finished) {
      const position = projectile(cast, age);
      const top = Math.max(cast.startY, cast.lastY - cast.radius);
      const bottom = Math.min(cast.endY, position.y + cast.radius);
      const cause = cast.kind === 'red' ? 'infinityRed' : 'infinityPurple';
      for (const block of blocksInBand(run, top, bottom)) {
        if (!cast.hit.has(block) && canBreak(block, cast.kind) && hitBySweep(cast, block, cast.lastY, position.y)) {
          cast.hit.add(block);
          destroy(block, cause, at);
          if (run.ended || run.evacuation) return;
        }
      }
      cast.lastY = position.y;
      if (position.t >= 1) {
        cast.finished = true;
        impact(cast.kind, true, at, age - shot.charge - shot.travel);
      }
    }
    if (age >= shot.charge + shot.travel + shot.tail) state.cast = null;
  }

  function shiftClock(state, delta) {
    if (!state) return;
    for (const key of ['nextShieldAt', 'shieldLitAt', 'shieldHitAt', 'shieldStopUntil', 'readyAt']) {
      if (Number.isFinite(state[key]) && state[key] > 0) state[key] += delta;
    }
    if (state.cast) state.cast.at += delta;
  }

  function chargeStrength(state, at) {
    if (!state?.cast || state.cast.kind === 'red') return 0;
    const age = at - state.cast.at;
    const end = SHOTS[state.cast.kind].charge;
    return smooth(age / 110) * (1 - smooth((age - end + 50) / 125));
  }

  function zoom(state, at) {
    const cast = state?.cast;
    if (cast?.kind !== 'purple') return 1;
    const age = at - cast.at;
    const release = age - SHOTS.purple.charge;
    return 1 + .103 * smooth(age / 650) * (1 - smooth((release + 70) / 335));
  }

  function cameraLead(state, at) {
    if (state?.cast?.kind !== 'purple') return 0;
    const age = at - state.cast.at;
    const release = age - SHOTS.purple.charge;
    return 172 * smooth(release / 430) * (1 - smooth((release - 610) / 580));
  }

  function cameraShake(state, at) {
    const cast = state?.cast;
    if (cast?.kind !== 'purple') return null;
    const age = at - cast.at;
    const sinceRelease = age - SHOTS.purple.charge;
    const sinceFusion = age - FUSION_AT;
    const shake = (elapsed, duration) => elapsed >= 0 ? (1 - unit(elapsed / duration)) ** 2 : 0;
    const release = shake(sinceRelease, 445);
    const fusing = shake(sinceFusion, 185);
    const tension = smooth((age - 690) / 340) * (1 - smooth((age - FUSION_AT) / 415));
    return {
      x: Math.sin(sinceRelease * .049 + .8) * release * 12 + Math.sin(sinceFusion * .069) * fusing * 4 + Math.sin(age * .085) * tension * 1.5,
      y: Math.cos(sinceRelease * .047) * release * -15 + Math.cos(sinceFusion * .055) * fusing * 3
    };
  }

  function pullPose(state, block, at) {
    const cast = state?.cast;
    if (!cast || cast.kind !== 'blue' || cast.released || !cast.pull.has(block)) return null;
    const pull = smooth((at - cast.at - 95) / 475);
    if (!pull) return null;
    const x = block.x + block.w / 2;
    const y = block.y + block.h / 2;
    return { x: (cast.x - x) * pull * .69, y: (cast.centerY - y) * pull * .69,
      spin: Math.sin(block.row * 4 + block.col * 3) * pull * .35, scale: 1 - pull * .29 };
  }

  function disc(ctx, x, y, radius, rgb, opacity) {
    const light = ctx.createRadialGradient(x, y, 0, x, y, radius);
    light.addColorStop(0, `rgba(${rgb},${opacity})`);
    light.addColorStop(.4, `rgba(${rgb},${opacity * .65})`);
    light.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = light;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function sparks(ctx, x, y, r, age, count, light, inward) {
    ctx.fillStyle = light;
    for (let i = 0; i < count; i += 1) {
      const t = ((age / (395 + i % 5 * 41) + i * .173) % 1 + 1) % 1;
      const angle = i * 2.39996 + (inward ? t : -t) * 1.65;
      const dist = r * (inward ? 2.42 - t * 1.81 : .76 + t * 1.36);
      const length = r * (.028 + (i % 3) * .034) * Math.sin(t * Math.PI);
      if (length < .4) continue;
      ctx.save();
      ctx.translate(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist);
      ctx.rotate(angle + (inward ? .19 : -.37));
      ctx.globalAlpha *= Math.sin(t * Math.PI) * .72;
      ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(length * .34, -length * .19);
      ctx.lineTo(length, 0); ctx.lineTo(length * .34, length * .19); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function orb(ctx, x, y, r, kind, age, reduced, opacity = 1) {
    if (r < 1 || opacity <= 0) return;
    const palette = SHOTS[kind];
    const angle = reduced ? .7 : age / (kind === 'blue' ? -144 : 166);
    const blue = kind === 'blue';
    ctx.save();
    ctx.globalAlpha *= opacity;
    ctx.globalCompositeOperation = 'lighter';
    disc(ctx, x, y, r * 2.2, palette.rgb, .58);
    ctx.globalCompositeOperation = 'source-over';
    const surface = ctx.createRadialGradient(x - r * .28, y - r * .32, 0, x, y, r);
    surface.addColorStop(0, blue ? '#08214f' : '#fff5ff');
    surface.addColorStop(.22, blue ? '#103568' : palette.light);
    surface.addColorStop(.52, blue ? '#1164ba' : `rgb(${palette.rgb})`);
    surface.addColorStop(.77, palette.core);
    surface.addColorStop(.93, palette.accent);
    surface.addColorStop(1, palette.light);
    ctx.fillStyle = surface;
    ctx.beginPath(); ctx.arc(x, y, r, 0, PI2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    // A pair of tapered crescents reads as plasma wrapped around the sphere.
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + side * 1.46);
      const strip = ctx.createLinearGradient(-r, 0, r, 0);
      strip.addColorStop(0, `${palette.accent}00`);
      strip.addColorStop(.28, palette.accent);
      strip.addColorStop(.68, side < 0 && kind === 'purple' ? '#9ad7ff' : palette.light);
      strip.addColorStop(1, `${palette.light}00`);
      ctx.fillStyle = strip;
      ctx.globalAlpha *= side === 1 ? .87 : .54;
      ctx.beginPath(); ctx.moveTo(-r * .99, r * .11);
      ctx.bezierCurveTo(-r * .63, -r * .48, r * .47, -r * .71, r * 1.03, -.02 * r);
      ctx.bezierCurveTo(r * .44, -r * .46, -r * .56, -r * .35, -r * .99, r * .11);
      ctx.fill();
      ctx.restore();
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(.8, r * .024);
    ctx.strokeStyle = palette.light;
    ctx.beginPath(); ctx.arc(x, y, r * 1.10, angle - .85, angle - .05);
    ctx.moveTo(x + r * 1.10 * Math.cos(angle + 2.53), y + r * 1.10 * Math.sin(angle + 2.53));
    ctx.arc(x, y, r * 1.10, angle + 2.53, angle + 3.48); ctx.stroke();
    if (!reduced) sparks(ctx, x, y, r, age, kind === 'purple' ? 16 : 10, palette.light, blue);
    ctx.restore();
  }

  function pulse(ctx, x, y, r, t, kind, inward = false) {
    if (t < 0 || t >= 1) return;
    const { rgb, light } = SHOTS[kind];
    const radius = r * (inward ? 1 - t * .78 : .16 + Math.pow(t, .58));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    disc(ctx, x, y, radius * 1.45, rgb, (1 - t) * .42);
    ctx.globalAlpha *= (1 - t) ** 1.6 * .79;
    ctx.strokeStyle = light;
    ctx.lineWidth = Math.max(.8, r * .021 * (1 - t));
    for (const scale of [1, .77]) {
      ctx.beginPath(); ctx.arc(x, y, radius * scale, 0, PI2); ctx.stroke();
    }
    ctx.restore();
  }

  function flare(ctx, x, y, radius, age, color) {
    if (age < 0 || age >= 185) return;
    const strength = (1 - age / 185) ** 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    disc(ctx, x, y, radius, color, strength * .82);
    ctx.translate(x, y);
    ctx.rotate(-.14);
    ctx.globalAlpha *= strength * .88;
    ctx.fillStyle = '#fff5ff';
    for (const [length, width] of [[radius * .67, radius * .032], [radius * .31, radius * .025]]) {
      ctx.beginPath(); ctx.moveTo(-length, 0); ctx.lineTo(0, -width);
      ctx.lineTo(length, 0); ctx.lineTo(0, width); ctx.fill();
      ctx.rotate(Math.PI / 2);
    }
    ctx.restore();
  }

  function discharge(ctx, x, y, radius, age, strength) {
    if (strength <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [index, color] of ['#88adff', '#f498e7', '#d9c0ff'].entries()) {
      const period = 213 + index * 28;
      const t = ((age + index * 69) % period) / period;
      if (t < 0 || t > .51) continue;
      ctx.save();
      ctx.rotate(index * PI2 / 3 + Math.floor((age + index * 69) / period) * .91);
      ctx.globalAlpha *= Math.sin(t / .51 * Math.PI) * strength;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, radius * .024);
      ctx.beginPath(); ctx.moveTo(radius * .74, 0);
      ctx.lineTo(radius * 1.02, -radius * .16); ctx.lineTo(radius * .99, -radius * .02);
      ctx.lineTo(radius * 1.26, -radius * .18); ctx.lineTo(radius * 1.22, -radius * .09);
      ctx.lineTo(radius * 1.43, -radius * .23); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawSummon(ctx, run, cast, age, reduced) {
    const { cellSize: cell, cameraY, viewWidth: w, viewHeight: h } = run;
    const release = age - SHOTS.purple.charge;
    const originY = cast.launchY - cameraY;
    const dim = smooth(age / 380) * (1 - smooth((release + 20) / 515));
    const join = smooth((age - 635) / (FUSION_AT - 635));
    const source = Math.max(cell * 1.36, Math.min(w - cell * 1.36, cast.x));
    const x = lerp(source, cast.x, join);
    const y = originY - cell * .22 * (1 - join);
    ctx.save();
    const shade = ctx.createRadialGradient(x, y + cell * .8, cell * .31, x, y + cell * .8, h * .61);
    shade.addColorStop(0, `rgba(28,18,58,${dim * .30})`);
    shade.addColorStop(1, `rgba(6,4,24,${dim * .79})`);
    ctx.fillStyle = shade;
    ctx.fillRect(-38, -38, w + 76, h + 76);
    if (age < FUSION_AT + 72) {
      const spread = lerp(cell * 1.01, 0, join);
      const turn = Math.sin(join * Math.PI) * cell * .47;
      const size = cell * (.27 + .19 * smooth(age / 480) - .11 * join);
      const fade = 1 - smooth((age - FUSION_AT + 70) / 140);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      disc(ctx, x - spread, y + cell * .38 - turn, cell * 2.75, '30,120,255', dim * fade * .37);
      disc(ctx, x + spread, y + cell * .38 + turn, cell * 2.75, '255,32,62', dim * fade * .37);
      ctx.restore();
      orb(ctx, x - spread, y - turn, size, 'blue', age, reduced, fade * smooth(age / 250));
      orb(ctx, x + spread, y + turn, size, 'red', age - 130, reduced, fade * smooth((age - 130) / 250));
    }
    if (age > FUSION_AT - 30 && release < 0) {
      const born = age - FUSION_AT;
      const size = cast.radius * (.24 + .61 * smooth(born / 260));
      orb(ctx, cast.x, originY, size, 'purple', born, reduced, smooth((born + 30) / 125));
      if (!reduced) discharge(ctx, cast.x, originY, size, born, smooth(born / 70));
      pulse(ctx, cast.x, originY, cell * 1.71, born / 370, 'purple');
      flare(ctx, cast.x, originY, cell * 2.45, born, '217,128,255');
    }
    ctx.restore();
  }

  function drawWake(ctx, x, y, radius, length, kind, age, intensity) {
    if (length < 1 || intensity < .01) return;
    const shot = SHOTS[kind];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    const twist = Math.sin(age / 102) * radius * .25;
    for (const side of [-1, 0, 1]) {
      const strip = ctx.createLinearGradient(0, y - length, 0, y);
      const tone = kind === 'purple' && side < 0 ? '102,112,255' : kind === 'purple' && side > 0 ? '255,106,207' : shot.rgb;
      strip.addColorStop(0, `rgba(${tone},0)`);
      strip.addColorStop(.57, `rgba(${tone},${intensity * (side ? .24 : .1)})`);
      strip.addColorStop(1, `rgba(${tone},${intensity * (side ? .88 : .52)})`);
      ctx.strokeStyle = strip;
      ctx.lineWidth = radius * (side ? .072 : .53);
      ctx.beginPath(); ctx.moveTo(x - side * radius * .40, y - length);
      ctx.bezierCurveTo(x + side * radius * .68 + twist, y - length * .76,
        x + side * radius * .22 - twist, y - length * .42, x + side * radius * .52, y - radius * .48);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw(ctx, run, at, reduced, behind) {
    const cast = run.infinity?.cast;
    if (!cast) return;
    const { cellSize: cell, cameraY, viewHeight } = run;
    const { kind, x } = cast;
    const shot = SHOTS[kind];
    const age = at - cast.at;
    const release = age - shot.charge;
    if (behind) {
      if (kind === 'purple') drawSummon(ctx, run, cast, age, reduced);
      return;
    }
    if (kind === 'blue') {
      const y = cast.centerY - cameraY;
      if (release < 0) {
        const gather = smooth(age / 430);
        const collapse = smooth((age - 475) / 115);
        for (let i = 0; i < 3; i += 1) pulse(ctx, x, y, cell * 1.65, (age - i * 100) / 420, 'blue', true);
        orb(ctx, x, y, cell * (.17 + .53 * gather - .48 * collapse), 'blue', age, reduced, smooth(age / 95));
      } else {
        flare(ctx, x, y, cell * 1.65, release, '126,222,255');
        pulse(ctx, x, y, cell * 1.94, release / shot.tail, 'blue');
      }
      return;
    }
    const startY = cast.launchY - cameraY;
    if (release < 0) {
      if (kind === 'red') {
        const ready = smooth(age / shot.charge);
        const y = lerp(cast.sourceY - cameraY + cell * .25, startY, ready);
        orb(ctx, x, y, cast.radius * (.17 + .64 * ready), 'red', age, reduced, smooth(age / 78));
      }
      return;
    }
    const position = projectile(cast, age);
    const y = position.y - cameraY;
    const afterFlight = Math.max(0, release - shot.travel);
    const fade = 1 - smooth(afterFlight / shot.tail);
    const radius = cast.radius * lerp(kind === 'purple' ? .85 : .81, .985, smooth(release / 105));
    const length = cell * (kind === 'purple' ? 4.6 : 2.25) * smooth(release / 145) * fade;
    if (y + radius > -120 && y - length < viewHeight + 100) {
      drawWake(ctx, x, y, radius, length, kind, release, fade);
      if (y - radius < viewHeight + 105) {
        orb(ctx, x, y, radius, kind, age, reduced, fade);
        if (kind === 'purple' && !reduced) discharge(ctx, x, y, radius, release, fade * .92);
      }
    }
    flare(ctx, x, startY, cell * (kind === 'purple' ? 3.05 : 1.38), release, shot.rgb);
    pulse(ctx, x, startY, cell * (kind === 'purple' ? 3.2 : 1.29), release / 390, kind);
    pulse(ctx, x, cast.endY - cameraY, radius * 1.54, (release - shot.travel) / shot.tail, kind);
  }

  function drawShieldBurst(ctx, x, y, radius, angle, age, reduced) {
    const t = age / 490;
    const expanding = 1 - (1 - t) ** 3;
    const ripple = radius * (1.1 + 1.74 * expanding);
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    flare(ctx, px, py, radius * 2.7, age, '113,213,255');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.globalAlpha *= (1 - t) ** 1.75;
    ctx.strokeStyle = '#60ccff';
    ctx.lineWidth = radius * .20 * (1 - t);
    ctx.beginPath(); ctx.arc(x, y, ripple, angle - 1.07 - t, angle + 1.07 + t); ctx.stroke();
    ctx.strokeStyle = '#d9fbff';
    ctx.lineWidth = Math.max(.8, radius * .079 * (1 - t));
    ctx.beginPath(); ctx.arc(x, y, ripple, angle - .81 - t, angle + .81 + t); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, ripple * .83, angle - .52, angle + .72); ctx.stroke();
    if (!reduced) {
      ctx.fillStyle = '#b4efff';
      for (let i = 0; i < 15; i += 1) {
        const direction = angle + (i - 7) * .164 + Math.sin(i * 19) * .11;
        const size = radius * (.079 + i % 3 * .035) * (1 - t);
        const distance = radius * (.78 + expanding * (1.20 + i % 4 * .27));
        ctx.save();
        ctx.translate(x + Math.cos(direction) * distance, y + Math.sin(direction) * distance);
        ctx.rotate(direction + t * (i % 2 ? 1.3 : -.72));
        ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(0, -size * .49);
        ctx.lineTo(size * 1.7, 0); ctx.lineTo(size * .13, size * .41); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawShield(ctx, state, x, y, radius, at, reduced, behind = false, cameraY = 0) {
    if (!state) return;
    const age = at - state.shieldHitAt;
    if (!behind && age >= 0 && age < 490) {
      const burst = state.shieldBurst;
      drawShieldBurst(ctx, burst?.x ?? x, burst ? burst.y - cameraY : y, radius, state.shieldHitAngle ?? Math.PI / 2, age, reduced);
    }
    if (!state.shield) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const forming = unit((at - state.shieldLitAt) / 495);
    const reform = 1 - smooth(forming);
    const shell = radius * 1.48;
    const centerY = y - radius * .20;
    if (behind) {
      ctx.translate(x, centerY);
      ctx.scale(1, .99);
      const halo = ctx.createRadialGradient(0, 0, shell * .28, 0, 0, shell * 1.34);
      halo.addColorStop(0, 'rgba(95,200,255,0)');
      halo.addColorStop(.43, `rgba(69,177,255,${.07 + reform * .13})`);
      halo.addColorStop(.66, `rgba(71,184,255,${.36 + reform * .24})`);
      halo.addColorStop(.80, `rgba(100,221,255,${.22 + reform * .18})`);
      halo.addColorStop(1, 'rgba(99,207,255,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(-shell * 1.34, -shell * 1.34, shell * 2.68, shell * 2.68);
      ctx.restore();
      return;
    }
    ctx.lineCap = 'round';
    const trace = ctx.createLinearGradient(x - shell, centerY - shell, x + shell, centerY + shell);
    trace.addColorStop(0, '#75bfff76'); trace.addColorStop(.23, '#b5f5fff1');
    trace.addColorStop(.52, '#88dfff98'); trace.addColorStop(.77, '#c9faffec'); trace.addColorStop(1, '#73c4ff99');
    ctx.strokeStyle = 'rgba(80,182,255,.32)';
    ctx.lineWidth = Math.max(3.2, radius * (.143 + reform * .064));
    ctx.beginPath(); ctx.ellipse(x, centerY, shell, shell * .99, 0, 0, PI2); ctx.stroke();
    ctx.strokeStyle = trace;
    ctx.lineWidth = Math.max(1.65, radius * (.057 + reform * .032));
    ctx.stroke();
    const spin = reduced ? -.75 : at / 1230;
    ctx.strokeStyle = '#e2fbff';
    ctx.lineWidth = Math.max(.9, radius * .036);
    for (let i = 0; i < 2; i += 1) {
      const a = spin + i * Math.PI;
      ctx.beginPath(); ctx.ellipse(x, centerY, shell * 1.045, shell * 1.025, 0, a, a + .55); ctx.stroke();
    }
    if (!reduced && reform > 0) pulse(ctx, x, centerY, shell * 1.32, forming, 'blue', true);
    ctx.restore();
  }

  const api = Object.freeze({ EMBLEM, create, swap, refreshShield, protectsDuringUltimate, absorb, holdShieldFrame, start, update, shiftClock, chargeStrength, zoom, cameraLead, cameraShake, pullPose, draw, drawShield, drawEnergyOrb: orb, drawEnergyWake: drawWake });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.SlimeInfinity = api;
})();
