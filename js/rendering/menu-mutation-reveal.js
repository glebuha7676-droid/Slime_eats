(() => {
  'use strict';
  const APEX = .34;
  const DESCENT = .48;
  const TOUCHDOWN = .78;
  const MAX_FRAME_STEP_MS = 40;
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const pulse = (progress, start, end) => Math.sin(Math.PI * clamp((progress - start) / (end - start))) ** 2;

  function timing(elapsed, duration, reducedMotion = false, reverting = false) {
    const progress = clamp(elapsed / duration);
    if (reducedMotion) {
      return { progress, blend: smooth(progress), light: 0, white: 0, height: 0, scaleX: 1, scaleY: 1 };
    }
    if (reverting) {
      const soften = pulse(progress, 0, .72);
      return { progress, blend: smooth((progress - .03) / .66), light: soften * .38, white: 0, height: 0,
        scaleX: 1 + soften * .032, scaleY: 1 - soften * .047 };
    }
    const rise = smooth(progress / APEX);
    const hover = 1 - .03 * smooth((progress - APEX) / (DESCENT - APEX));
    const fall = 1 - smooth((progress - DESCENT) / (TOUCHDOWN - DESCENT));
    const height = rise * hover * fall;
    const squash = pulse(progress, 0, .12) * .06 + pulse(progress, TOUCHDOWN, .91) * .095;
    const stretch = pulse(progress, .045, .35) * .062 + pulse(progress, .885, .99) * .029;
    return {
      progress, height,
      blend: smooth((progress - .23) / (.74 - .23)),
      light: smooth(progress / APEX) * (1 - smooth((progress - APEX) / (TOUCHDOWN - APEX))),
      white: smooth((progress - .155) / .175) * (1 - smooth((progress - .425) / .155)),
      scaleX: 1 + squash * .74 - stretch * .58,
      scaleY: 1 - squash + stretch
    };
  }

  function create(canvas, { now, ultra, quick, reverting, accent, reducedMotion }) {
    const previous = document.createElement('canvas');
    const current = document.createElement('canvas');
    previous.width = current.width = canvas.width;
    previous.height = current.height = canvas.height;
    previous.getContext('2d').drawImage(canvas, 0, 0);
    return { previous, current, startedAt: now, createdAt: now, lastFrameAt: now, ultra, reverting, accent: accent || '#a9eaff',
      duration: reducedMotion ? 160 : reverting ? 400 : quick ? 540 : ultra ? 1150 : 910,
      jumpHeight: quick ? 15 : ultra ? 26 : 21,
      maxAssetWait: reverting ? 460 : quick ? 680 : 1800, reducedMotion, assetsReady: true, finished: false };
  }

  function state(reveal, timestamp) {
    timestamp = Math.max(timestamp, reveal.lastFrameAt);
    // Preserve the flight and rebound when menu work delays a rendered frame.
    reveal.startedAt += Math.max(0, timestamp - reveal.lastFrameAt - MAX_FRAME_STEP_MS);
    reveal.lastFrameAt = timestamp;
    const holdAt = reveal.reducedMotion ? 0 : reveal.duration * (reveal.reverting ? .03 : APEX);
    if (!reveal.assetsReady && timestamp - reveal.startedAt > holdAt) {
      // Wait at a stable pose until the incoming artwork is ready.
      reveal.startedAt = timestamp - holdAt;
    }
    if (timestamp - reveal.createdAt > reveal.maxAssetWait) reveal.assetsReady = true;
    return timing(timestamp - reveal.startedAt, reveal.duration, reveal.reducedMotion, reveal.reverting);
  }

  function needsCurrent(reveal, timestamp) {
    const frame = state(reveal, timestamp);
    return reveal.assetsReady && frame.blend > 0;
  }

  function blendForms(reveal, canvas, blend) {
    if (blend === 0) return reveal.previous;
    const { current, previous } = reveal;
    const { width, height } = current;
    const incoming = current.getContext('2d');
    incoming.clearRect(0, 0, width, height);
    incoming.drawImage(canvas, 0, 0, width, height);
    if (blend === 1) return current;

    const mixed = reveal.mixed ??= document.createElement('canvas');
    if (mixed.width !== width || mixed.height !== height) {
      mixed.width = width;
      mixed.height = height;
    }
    const composite = mixed.getContext('2d');
    composite.clearRect(0, 0, width, height);
    composite.save();
    if (reveal.reducedMotion) {
      composite.globalAlpha = 1 - blend;
    }
    composite.drawImage(previous, 0, 0);
    if (reveal.reducedMotion) {
      composite.globalAlpha = blend;
    } else {
      const feather = height * .18;
      const front = (height + feather * 2) * blend - feather;
      const mask = composite.createLinearGradient(0, front - feather, 0, front + feather);
      mask.addColorStop(0, '#fff');
      mask.addColorStop(1, 'transparent');
      composite.globalCompositeOperation = 'destination-out';
      composite.fillStyle = mask;
      composite.fillRect(0, 0, width, height);
      incoming.save();
      incoming.globalCompositeOperation = 'destination-in';
      incoming.fillStyle = mask;
      incoming.fillRect(0, 0, width, height);
      incoming.restore();
    }
    composite.globalCompositeOperation = 'lighter';
    composite.drawImage(current, 0, 0);
    composite.restore();
    return mixed;
  }

  function whiteSilhouette(reveal, body, strength) {
    const silhouette = reveal.silhouette ??= document.createElement('canvas');
    if (silhouette.width !== body.width || silhouette.height !== body.height) {
      silhouette.width = body.width;
      silhouette.height = body.height;
    }
    const layer = silhouette.getContext('2d');
    layer.clearRect(0, 0, body.width, body.height);
    layer.drawImage(body, 0, 0);
    layer.save();
    layer.globalCompositeOperation = 'source-atop';
    layer.globalAlpha = strength;
    layer.fillStyle = '#fff';
    layer.fillRect(0, 0, body.width, body.height);
    layer.restore();
    return silhouette;
  }

  function draw(target, reveal, timestamp) {
    const { progress, light, white, height, scaleX, scaleY, blend: mix } = state(reveal, timestamp);
    const blend = reveal.assetsReady ? mix : 0;
    const lift = height * reveal.jumpHeight;
    reveal.finished = progress >= 1;
    const release = reveal.reverting ? clamp((progress - .06) / .86) : clamp((progress - APEX) / (.94 - APEX));
    const particles = !reveal.reducedMotion && release > 0 && release < 1;
    if (blend === 1 && scaleX === 1 && scaleY === 1 && !particles) return;

    const body = blendForms(reveal, target.canvas, blend);
    target.clearRect(0, 0, 260, 260);
    if (light > 0) {
      const y = 126 - lift;
      const halo = target.createRadialGradient(130, y, 14, 130, y, 81);
      halo.addColorStop(0, '#fffdf2');
      halo.addColorStop(.42, reveal.accent);
      halo.addColorStop(1, 'transparent');
      target.save();
      target.globalAlpha = light * (reveal.ultra ? .32 : .25);
      target.fillStyle = halo;
      target.fillRect(42, y - 88, 176, 176);
      target.restore();
    }

    target.save();
    target.translate(130, 197 - lift);
    target.scale(scaleX, scaleY);
    let image = body;
    if (white > 0) {
      image = whiteSilhouette(reveal, body, white);
      target.shadowColor = `rgba(242,253,255,${.75 * white})`;
      target.shadowBlur = body.width / 260 * 8 * white;
    }
    target.drawImage(image, -130, -197, 260, 260);
    target.restore();

    if (particles) {
      target.save();
      target.globalAlpha = smooth(release / .16) * (1 - smooth((release - .32) / .68)) * .86;
      for (let i = 0; i < (reveal.reverting ? 5 : reveal.ultra ? 11 : 8); i += 1) {
        const angle = i * 2.4;
        const travel = 47 + (29 + i % 3 * 5) * release;
        const x = 130 + Math.cos(angle) * travel;
        const y = reveal.reverting ? 145 + Math.sin(angle) * 32 - release * 23
          : 136 - reveal.jumpHeight + Math.sin(angle) * travel * .82 - release * 10;
        target.fillStyle = i % 3 === 0 ? '#fffdea' : reveal.accent;
        target.beginPath();
        target.arc(x, y, (1.7 + i % 3 * .68) * (1 - .52 * release), 0, Math.PI * 2);
        target.fill();
      }
      target.restore();
    }
  }

  const api = Object.freeze({ create, draw, timing, needsCurrent });
  if (typeof window !== 'undefined') window.MenuMutationReveal = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
