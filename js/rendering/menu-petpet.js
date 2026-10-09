/* Two generated glove poses, one continuous spring, no per-click timers. */
(() => {
  'use strict';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const TAU = Math.PI * 2;
  function create({ reducedMotion = false } = {}) {
    return { reducedMotion, held:false, until:0, lastPress:-Infinity, lastSample:0,
      phase:0, period:390, pressure:0, velocity:0, visibility:0, frame:0, active:false };
  }
  function press(state, now) {
    const gap = now - state.lastPress;
    if (!state.active) { state.phase = 0; state.lastSample = now; }
    // Fast taps become the familiar petpet rhythm, without rewinding the spring.
    state.period = gap < 450 ? clamp(gap * 1.25, 245, 390) : 390;
    state.lastPress = now;
    state.until = Math.max(state.until, now + 480);
    state.held = true;
    state.active = true;
  }
  function release(state, now) {
    state.held = false;
    // Finish the current squeeze, then let the spring and glove settle.
    state.until = Math.min(state.until, now + Math.max(100, (1 - state.phase) * state.period));
  }
  function cancel(state) {
    state.held = state.active = false;
    state.pressure = state.velocity = state.visibility = state.until = state.lastSample = 0;
    state.frame = 0;
    state.lastPress = -Infinity;
  }
  function sample(state, now) {
    const elapsed = state.lastSample ? Math.max(0, Math.min(64, now - state.lastSample)) : 0;
    state.lastSample = now;
    const driving = state.held || now < state.until;
    const steps = Math.max(1, Math.ceil(elapsed / 12));
    const dt = elapsed / steps / 1000;
    for (let step = 0; step < steps; step++) {
      if (driving) state.phase = (state.phase + dt * 1000 / state.period) % 1;
      const desired = driving ? Math.pow(Math.max(0, Math.sin(state.phase * TAU)), .65) : 0;
      state.velocity += (620 * (desired - state.pressure) - 23 * state.velocity) * dt;
      state.pressure += state.velocity * dt;
      const visible = driving || Math.abs(state.pressure) > .035 ? 1 : 0;
      state.visibility += (visible - state.visibility) * Math.min(1, dt * (visible ? 28 : 15));
    }
    if (!driving && Math.abs(state.pressure) < .002 && Math.abs(state.velocity) < .035 && state.visibility < .015) cancel(state);
    const pressure = clamp(state.pressure, -.20, 1.12);
    if (pressure > .55) state.frame = 1;
    else if (pressure < .42) state.frame = 0;
    const strength = state.reducedMotion ? .25 : 1;
    const rub = Math.sin(state.phase * TAU * 2) * Math.max(0, pressure) * strength;
    return { active:state.active, pressure, opacity:state.visibility,
      scaleX:1 + pressure * .14 * strength, scaleY:1 - pressure * .12 * strength,
      shakeX:rub * 2.1, shakeY:rub * .9, tilt:rub * .018,
      frame:state.frame };
  }

  let glove, ready;
  if (typeof Image !== 'undefined') {
    glove = new Image();
    glove.decoding = 'async';
    ready = new Promise((resolve, reject) => {
      glove.onload = () => resolve(glove.decode ? glove.decode() : undefined);
      glove.onerror = () => reject(new Error('Petpet glove unavailable'));
    });
    ready.catch(() => {}); // Startup reports the error through the loading screen.
    glove.src = window.SlimeGameAssets.versionedAsset('assets/ui/petpet-grip-v7-lossless.webp');
  }
  function drawHand(target, pose, { x, top, radius }) {
    if (pose.opacity < .005 || !glove?.complete || !glove.naturalWidth) return;
    const size = radius * 2.48;
    // Draw each complete opaque glove in front of the crown. No masks cut
    // through the hand; the upper fingers flex with the thumb's rubbing stroke.
    const left = x + radius * .29 - size * .74 + pose.shakeX * .9;
    const y = top + 31 - size * .50 - (1 - pose.opacity) * 8 + pose.shakeY * .8;
    target.save();
    target.globalAlpha = pose.opacity;
    // Small wrist tremor follows the same rubbing beat as the slime's squeeze.
    target.translate(left + size * .18, y + size * .55);
    target.rotate((pose.tilt || 0) * .6);
    const cell = glove.naturalHeight;
    target.drawImage(glove, pose.frame * cell, 0, cell, cell, -size * .18, -size * .55, size, size);
    target.restore();
  }
  const api = Object.freeze({ create, press, release, cancel, sample, drawHand, whenReady:() => ready });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.MenuPetpet = api;
})();
