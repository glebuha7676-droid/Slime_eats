(() => {
  'use strict';

  // Blend the end into the start once, in premultiplied alpha, so upright cave
  // ledges can repeat without turning formations upside down or doubling alpha.
  const loopTextures = new WeakMap();
  const solidEdgeTextures = new WeakMap();
  let solidEdgeFilter;
  function solidEdges(image) {
    if (solidEdgeTextures.has(image)) return solidEdgeTextures.get(image);
    if (!solidEdgeFilter) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      const filter = document.createElementNS(ns, 'filter');
      filter.id = 'cave-solid-alpha-v15';
      filter.setAttribute('color-interpolation-filters', 'sRGB');
      const transfer = document.createElementNS(ns, 'feComponentTransfer');
      const alpha = document.createElementNS(ns, 'feFuncA');
      alpha.setAttribute('type', 'linear');
      alpha.setAttribute('slope', '64'); alpha.setAttribute('intercept', '-62');
      transfer.append(alpha); filter.append(transfer); svg.append(filter);
      document.body.append(svg);
      solidEdgeFilter = `url(#${filter.id})`;
    }
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const c = canvas.getContext('2d');
    c.filter = solidEdgeFilter;
    c.drawImage(image, 0, 0);
    c.filter = 'none';
    Object.assign(canvas, { complete: true, naturalWidth: canvas.width, naturalHeight: canvas.height });
    solidEdgeTextures.set(image, canvas);
    return canvas;
  }
  function uprightLoop(image, fraction, opaque = false) {
    let cached = loopTextures.get(image);
    if (!cached) { cached = new Map(); loopTextures.set(image, cached); }
    const key = `${fraction}:${opaque}`;
    if (cached.has(key)) return cached.get(key);
    const width = image.naturalWidth, height = image.naturalHeight;
    const overlap = Math.max(1, Math.min(Math.floor(height / 3), Math.round(height * fraction)));
    const period = height - overlap;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = period;
    const c = canvas.getContext('2d');
    c.drawImage(image, 0, 0, width, period, 0, 0, width, period);
    const startMask = c.createLinearGradient(0, 0, 0, overlap);
    startMask.addColorStop(0, 'rgba(255,255,255,0)');
    startMask.addColorStop(1, 'rgba(255,255,255,1)');
    c.globalCompositeOperation = 'destination-in';
    c.fillStyle = startMask;
    c.fillRect(0, 0, width, period);

    // Canvas compositing works for file:// images too. Pixel readback would
    // throw SecurityError and stop the whole game frame for local files.
    const endBand = document.createElement('canvas');
    endBand.width = width; endBand.height = overlap;
    const endContext = endBand.getContext('2d');
    endContext.drawImage(image, 0, period, width, overlap, 0, 0, width, overlap);
    const endMask = endContext.createLinearGradient(0, 0, 0, overlap);
    endMask.addColorStop(0, 'rgba(255,255,255,1)');
    endMask.addColorStop(1, 'rgba(255,255,255,0)');
    endContext.globalCompositeOperation = 'destination-in';
    endContext.fillStyle = endMask;
    endContext.fillRect(0, 0, width, overlap);
    c.globalCompositeOperation = 'lighter';
    c.drawImage(endBand, 0, 0);
    if (opaque) {
      c.globalCompositeOperation = 'destination-over';
      c.fillStyle = '#000';
      c.fillRect(0, 0, width, period);
    }
    c.globalCompositeOperation = 'source-over';
    Object.assign(canvas, { complete: true, naturalWidth: width, naturalHeight: period });
    cached.set(key, canvas);
    return canvas;
  }

  // Shared device-pixel-aligned edges avoid gaps between consecutive tiles.
  function draw(ctx, { layers, width, height, cameraY = 0, padding = 0 }) {
    const transform = ctx.getTransform();
    const scaleY = Math.abs(transform.d) || 1;
    const snap = y => (Math.round(y * scaleY + transform.f) - transform.f) / scaleY;
    let count = 0;
    ctx.save();
    for (const layer of layers) {
      const sourceImage = layer.image;
      if (!sourceImage?.complete || !sourceImage.naturalWidth || !sourceImage.naturalHeight) continue;
      const edgedImage = layer.solidEdges ? solidEdges(sourceImage) : sourceImage;
      const image = layer.loopBlend ? uprightLoop(edgedImage, layer.loopBlend, layer.opaque) : edgedImage;
      const imageWidth = width * (layer.scale || 1);
      const imageX = (width - imageWidth) / 2;
      const tileHeight = image.naturalHeight * imageWidth / image.naturalWidth;
      const scroll = cameraY * layer.speed;
      const first = Math.floor(scroll / tileHeight);
      const offset = first * tileHeight - scroll;
      ctx.save();
      ctx.globalAlpha *= layer.opacity ?? 1;
      const paintTile=(y,h)=>{
        ctx.drawImage(image,imageX,y,imageWidth,h);
        if(!padding || imageX <= -padding)return;
        const source=Math.min(image.naturalWidth,image.naturalWidth*padding/width);
        ctx.save();ctx.scale(-1,1);ctx.drawImage(image,0,0,source,image.naturalHeight,0,y,padding,h);ctx.restore();
        ctx.save();ctx.translate(width*2,0);ctx.scale(-1,1);ctx.drawImage(image,image.naturalWidth-source,0,source,image.naturalHeight,width-padding,y,padding,h);ctx.restore();
      };
      for (let index = padding && offset > -padding ? -1 : 0; offset + index * tileHeight < height+padding; index += 1) {
        const top = snap(offset + index * tileHeight);
        const bottom = snap(offset + (index + 1) * tileHeight);
        if (!layer.directRepeat && !layer.loopBlend && Math.abs((first + index) % 2) === 1) {
          ctx.save();
          ctx.translate(0, bottom);
          ctx.scale(1, -1);
          paintTile(0,bottom-top);
          ctx.restore();
        } else paintTile(top,bottom-top);
        count += 1;
      }
      ctx.restore();
    }
    ctx.restore();
    return count;
  }

  window.SlimeWorldBackground = Object.freeze({ draw });
})();
