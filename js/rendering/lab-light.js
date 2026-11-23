(() => {
  'use strict';

  const smooth = (start, end, time) => {
    const value = Math.max(0, Math.min(1, (time - start) / (end - start)));
    return value * value * (3 - 2 * value);
  };

  function lightTexture() {
    const texture = document.createElement('canvas');
    texture.width = texture.height = 96;
    const context = texture.getContext('2d');
    const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 48);
    gradient.addColorStop(0, '#efffff');
    gradient.addColorStop(.22, '#a8ebffcd');
    gradient.addColorStop(.52, '#5ad9ff63');
    gradient.addColorStop(1, '#55bfff00');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 96, 96);
    return texture;
  }

  function beamTexture(startWidth, endWidth, feather = .14) {
    const texture = document.createElement('canvas');
    texture.width = 192;
    texture.height = 56;
    const context = texture.getContext('2d');
    const pixels = context.createImageData(texture.width, texture.height);
    for (let x = 0; x < texture.width; x++) {
      const distance = x / (texture.width - 1);
      const halfWidth = startWidth + (endWidth - startWidth) * distance;
      const lengthFade = smooth(0, .045, distance) * (1 - smooth(.6, 1, distance));
      for (let y = 0; y < texture.height; y++) {
        const edge = Math.abs(2 * y / (texture.height - 1) - 1) / halfWidth;
        const index = (y * texture.width + x) * 4;
        pixels.data[index] = 161 + 66 * (1 - Math.min(1, edge));
        pixels.data[index + 1] = 225 + 22 * (1 - Math.min(1, edge));
        pixels.data[index + 2] = 255;
        pixels.data[index + 3] = 224 * lengthFade * (1 - smooth(feather, 1, edge));
      }
    }
    context.putImageData(pixels, 0, 0);
    return texture;
  }

  function beam(context, texture, fromX, fromY, toX, toY, breadth, opacity) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    context.save();
    context.translate(fromX, fromY);
    context.rotate(Math.atan2(dy, dx));
    context.globalAlpha = opacity;
    context.drawImage(texture, 0, -breadth / 2, Math.hypot(dx, dy), breadth);
    context.restore();
  }

  function rewardSparks(context, x, y, width, progress, warm) {
    if (progress <= 0 || progress >= 1) return;
    const spread = 1 - (1 - progress) ** 2;
    context.save();
    for (let index = 0; index < 18; index++) {
      const angle = index * 2.39996;
      const distance = width * (.055 + spread * (.17 + (index % 5) * .024));
      const size = (index % 4 === 0 ? 6 : 3) * (1 - progress * .65);
      context.globalAlpha = (1 - progress) ** .72;
      context.fillStyle = index % 3 === 0 ? '#ffffff' : warm ? '#ffdc84' : '#a5f0ff';
      context.save();
      context.translate(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * .66 + progress ** 2 * 13);
      context.rotate(angle + progress);
      context.beginPath();
      context.moveTo(0, -size);
      context.quadraticCurveTo(size * .18, -size * .18, size * .7, 0);
      context.quadraticCurveTo(size * .18, size * .18, 0, size);
      context.quadraticCurveTo(-size * .18, size * .18, -size * .7, 0);
      context.quadraticCurveTo(-size * .18, -size * .18, 0, -size);
      context.fill();
      context.restore();
    }
    context.restore();
  }

  window.SlimeLabLight = Object.freeze({ smooth, lightTexture, beamTexture, beam, rewardSparks });
})();
