(() => {
  'use strict';

  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  };
  let reflectionSprite;

  function sample(castAt, now, reducedMotion) {
    if (!Number.isFinite(castAt)) return null;
    const age = now - castAt;
    const duration = reducedMotion ? 240 : 365;
    if (age < 0 || age >= duration) return null;
    const rise = ease(age / 55);
    const fade = 1 - ease((age - 65) / (duration - 65));
    return {
      strength: rise * fade * (reducedMotion ? .65 : 1),
      sweep: reducedMotion ? .52 : ease(age / 290)
    };
  }

  function backLight(ctx, radius, { strength, sweep }) {
    const effects = window.SlimeMutationImpacts;
    const spread = radius * (3.5 + sweep * .5);
    effects.halo(ctx, 'anomaly', -radius * .2, radius * .04, spread, strength * .68, .93);
    effects.halo(ctx, 'frost', radius * .42, -radius * .24, radius * 2.55, strength * .35, 1.03);
  }

  function reflectionArt() {
    if (reflectionSprite) return reflectionSprite;
    const size = 96;
    const image = document.createElement('canvas');
    image.width = image.height = size;
    const ctx = image.getContext('2d');
    const center = size / 2;
    const glow = ctx.createRadialGradient(center, center, 0, center, center, center);
    glow.addColorStop(0, '#f8f1ffed');
    glow.addColorStop(.19, '#b8faffc4');
    glow.addColorStop(.49, '#7cdbf475');
    glow.addColorStop(.76, '#ae7cea32');
    glow.addColorStop(1, '#b676ff00');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
    reflectionSprite = image;
    return image;
  }

  function reflection(ctx, radius, { strength, sweep }) {
    if (strength < .01) return;
    const r = radius;
    ctx.save();
    ctx.globalAlpha *= strength * .82;
    ctx.globalCompositeOperation = 'screen';
    ctx.beginPath();
    ctx.moveTo(-.76 * r, .38 * r);
    ctx.bezierCurveTo(-.88 * r, -.09 * r, -.55 * r, -.57 * r, -.24 * r, -.70 * r);
    ctx.bezierCurveTo(.03 * r, -.84 * r, .31 * r, -.67 * r, .52 * r, -.40 * r);
    ctx.bezierCurveTo(.70 * r, -.12 * r, .75 * r, .31 * r, .65 * r, .49 * r);
    ctx.bezierCurveTo(.43 * r, .77 * r, -.60 * r, .75 * r, -.76 * r, .38 * r);
    ctx.clip();
    ctx.translate(r * (-.66 + sweep * 1.3), r * (-.15 + sweep * .31));
    ctx.rotate(.63);
    ctx.drawImage(reflectionArt(), -r * .33, -r * 1.02, r * .66, r * 2.04);
    ctx.restore();
  }

  window.SlimeAnomalyCast = Object.freeze({ sample, backLight, reflection });
})();
