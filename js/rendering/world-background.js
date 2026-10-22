(() => {
  'use strict';

  // Alternate vertical reflections join identical edge rows, including on the
  // transparent layer. Shared, device-pixel-aligned edges avoid bright seams.
  function draw(ctx, { layers, width, height, cameraY = 0 }) {
    const transform = ctx.getTransform();
    const scaleY = Math.abs(transform.d) || 1;
    const snap = y => (Math.round(y * scaleY + transform.f) - transform.f) / scaleY;
    let count = 0;
    ctx.save();
    for (const layer of layers) {
      const image = layer.image;
      if (!image?.complete || !image.naturalWidth || !image.naturalHeight) continue;
      const tileHeight = image.naturalHeight * width / image.naturalWidth;
      const scroll = cameraY * layer.speed;
      const first = Math.floor(scroll / tileHeight);
      const offset = first * tileHeight - scroll;
      ctx.save();
      ctx.globalAlpha *= layer.opacity ?? 1;
      for (let index = 0; offset + index * tileHeight < height; index += 1) {
        const top = snap(offset + index * tileHeight);
        const bottom = snap(offset + (index + 1) * tileHeight);
        if (Math.abs((first + index) % 2) === 1) {
          ctx.save();
          ctx.translate(0, bottom);
          ctx.scale(1, -1);
          ctx.drawImage(image, 0, 0, width, bottom - top);
          ctx.restore();
        } else ctx.drawImage(image, 0, top, width, bottom - top);
        count += 1;
      }
      ctx.restore();
    }
    ctx.restore();
    return count;
  }

  window.SlimeWorldBackground = Object.freeze({ draw });
})();
