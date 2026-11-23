(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  function timing(elapsed, duration, ultra = false) {
    const progress = clamp(elapsed / duration);
    return { progress,
      blend: smooth((progress - (ultra ? .53 : .22)) / (ultra ? .32 : .53)),
      energy: ultra ? smooth((progress - .1) / .4) * (1 - smooth((progress - .68) / .3)) : 0,
      flash: ultra ? smooth((progress - .55) / .05) * (1 - smooth((progress - .62) / .13)) : 0 };
  }
  function create(canvas, { now, ultra, quick, accent, reducedMotion, silhouetteSource }) {
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
    return { previous, current, silhouette, flashSilhouette, startedAt: now, createdAt: now, ultra, accent,
      duration: reducedMotion ? 160 : quick ? 355 : ultra ? 1840 : 560,
      maxAssetWait: quick ? 680 : 8000, reducedMotion, assetsReady: true, finished: false };
  }
  function state(reveal, timestamp) {
    // A missing or stalled image must never lock feeding and Play forever.
    if (!reveal.assetsReady && timestamp - reveal.createdAt > reveal.maxAssetWait) reveal.assetsReady = true;
    // Wait behind the silhouette if the new body has not finished decoding.
    const holdAt = reveal.duration * (reveal.ultra && !reveal.reducedMotion ? .51 : .20);
    if (!reveal.assetsReady && timestamp - reveal.startedAt > holdAt) reveal.startedAt = timestamp - holdAt;
    return timing(timestamp - reveal.startedAt, reveal.duration, reveal.ultra && !reveal.reducedMotion);
  }
  function needsCurrent(reveal, timestamp) {
    return state(reveal, timestamp).blend > 0;
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
    const squash = reveal.reducedMotion ? 0 : Math.sin(Math.PI * smooth(progress / (ultra ? .83 : .60)));
    const contraction = 1 - squash * (ultra ? .10 : .075);
    target.translate(130, 197);
    target.scale(1 + squash * .05, contraction);
    target.globalAlpha = 1 - blend;
    target.drawImage(reveal.previous, -130, -197, 260, 260);
    if (ultra) {
      target.globalAlpha = (1 - blend) * smooth((progress - .08) / .42);
      target.drawImage(reveal.silhouette, -130, -197, 260, 260);
    }
    target.restore();
    if (blend > 0) {
      target.save(); target.translate(130, 197);
      const rebound = reveal.reducedMotion ? 0 : Math.sin(Math.PI * smooth((progress - .39) / .61));
      target.scale(1 - rebound * .026, 1 + rebound * .072);
      target.globalAlpha = blend;
      target.globalCompositeOperation = 'lighter';
      target.drawImage(reveal.current, -130, -197, 260, 260);
      target.restore();
    }
    if (!reveal.reducedMotion) {
      const release = clamp((progress - (ultra ? .53 : .33)) / (ultra ? .42 : .63));
      if (release > 0 && release < 1) {
        target.save();
        target.fillStyle = reveal.accent || '#fff2bb';
        target.globalAlpha = Math.sin(Math.PI * release) * .82;
        for (let i = 0; i < (ultra ? 9 : 6); i += 1) {
          const angle = i * 2.4;
          const x = 130 + Math.cos(angle) * (53 + 36 * release);
          const y = 137 + Math.sin(angle) * (48 + 33 * release) - release * 12;
          target.beginPath();
          target.arc(x,y,(2.1+i%3*.8)*(1-.46*release),0,Math.PI*2);
          target.fill();
        }
        target.restore();
      }
    }
    if (!ultra) return;
    if (flash > 0) {
      target.save(); target.translate(130, 197);
      const pulse = contraction + flash * .06;
      target.scale(pulse, pulse);
      target.globalAlpha = flash * (1 - blend);
      target.drawImage(reveal.flashSilhouette, -130, -197, 260, 260);
      target.restore();
    }
  }
  const api = Object.freeze({ create, draw, timing, needsCurrent });
  if (typeof window !== 'undefined') window.MenuMutationReveal = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
