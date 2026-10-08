(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  function timing(elapsed, duration, ultra = false) {
    const progress = clamp(elapsed / duration);
    return { progress,
      blend: smooth((progress - (ultra ? .59 : .05)) / (ultra ? .29 : .85)),
      energy: ultra ? smooth((progress - .1) / .4) * (1 - smooth((progress - .68) / .3)) : 0,
      flash: ultra ? smooth((progress - .55) / .05) * (1 - smooth((progress - .62) / .13)) : 0 };
  }
  function create(canvas, { now, ultra, reducedMotion, silhouetteSource }) {
    const previous = document.createElement('canvas');
    const current = document.createElement('canvas');
    previous.width = current.width = canvas.width;
    previous.height = current.height = canvas.height;
    previous.getContext('2d').drawImage(canvas, 0, 0);
    let silhouette, flashSilhouette;
    if (ultra && !reducedMotion) {
      silhouette = document.createElement('canvas');
      silhouette.width = silhouette.height = canvas.width;
      const context = silhouette.getContext('2d');
      context.drawImage(silhouetteSource || previous, 0, 0);
      context.globalCompositeOperation = 'source-in';
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      // Thicken alpha using compositing, which also works with file:// artwork.
      // Pixel readback throws SecurityError on those local, tainted canvases.
      context.globalCompositeOperation = 'source-over';
      for (let pass = 0; pass < 3; pass++) context.drawImage(silhouette, 0, 0);
      flashSilhouette = document.createElement('canvas');
      flashSilhouette.width = flashSilhouette.height = canvas.width;
      const flashContext = flashSilhouette.getContext('2d');
      flashContext.shadowColor = '#f3fcff';
      flashContext.shadowBlur = canvas.width / 260 * 6;
      flashContext.drawImage(silhouette, 0, 0);
    }
    return { previous, current, silhouette, flashSilhouette, startedAt: now, createdAt: now, lastAt: now, ultra,
      duration: reducedMotion ? 160 : ultra ? 2600 : 380, reducedMotion, assetsReady: true, finished: false };
  }
  function state(reveal, timestamp) {
    // A missing or stalled image must never lock feeding and Play forever.
    if (!reveal.assetsReady && timestamp - reveal.createdAt > 8000) reveal.assetsReady = true;
    // Wait behind the silhouette if the new body has not finished decoding.
    if (!reveal.assetsReady && timestamp - reveal.startedAt > reveal.duration * .52) {
      reveal.startedAt += timestamp - reveal.lastAt;
    }
    reveal.lastAt = timestamp;
    return timing(timestamp - reveal.startedAt, reveal.duration, reveal.ultra && !reveal.reducedMotion);
  }
  function needsCurrent(reveal, timestamp) {
    return !reveal.ultra || reveal.reducedMotion || state(reveal, timestamp).blend > 0;
  }
  function draw(target, reveal, timestamp) {
    const { progress, blend, flash } = state(reveal, timestamp);
    reveal.finished = progress >= 1;
    if (blend > 0) {
      const copy = reveal.current.getContext('2d');
      copy.clearRect(0, 0, reveal.current.width, reveal.current.height);
      copy.drawImage(target.canvas, 0, 0);
    }
    target.clearRect(0, 0, 260, 260);
    target.save();
    const ultra = reveal.ultra && !reveal.reducedMotion;
    const contraction = ultra ? 1 - smooth(progress / .55) * .09 : 1;
    target.translate(130, 130);
    target.scale(contraction, contraction);
    target.globalAlpha = 1 - blend;
    target.drawImage(reveal.previous, -130, -130, 260, 260);
    if (ultra) {
      target.globalAlpha = (1 - blend) * smooth((progress - .08) / .42);
      target.drawImage(reveal.silhouette, -130, -130, 260, 260);
    }
    target.restore();
    if (blend > 0) {
      target.save(); target.translate(130, 130);
      const settle = ultra ? 1 + Math.sin(Math.PI * smooth((progress - .59) / .41)) * .045 : 1;
      target.scale(settle, settle); target.globalAlpha = blend;
      if (!ultra) target.globalCompositeOperation = 'lighter';
      target.drawImage(reveal.current, -130, -130, 260, 260);
      target.restore();
    }
    if (!ultra) return;
    if (flash > 0) {
      target.save(); target.translate(130, 130);
      const pulse = contraction + flash * .06;
      target.scale(pulse, pulse);
      target.globalAlpha = flash * (1 - blend);
      target.drawImage(reveal.flashSilhouette, -130, -130, 260, 260);
      target.restore();
    }
  }
  const api = Object.freeze({ create, draw, timing, needsCurrent });
  if (typeof window !== 'undefined') window.MenuMutationReveal = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
