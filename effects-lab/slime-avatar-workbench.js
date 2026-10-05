(() => {
  'use strict';

  const defaultColors = window.SlimeGameConfig?.SKINS?.[0]?.colors || ['#e9ff9c', '#67d348', '#2fa345'];
  const referenceBodyImage = new Image();
  const formBodySources = Object.freeze({
    explosion: 'assets/ui/slime/forms/slime-body-explosion-v1.webp?v=1',
    frost: 'assets/ui/slime/forms/slime-body-frost-v1.webp?v=1',
    frostUltra: 'effects-lab/assets/frost-ultra-body-v1.webp',
    cosmosUltra: 'effects-lab/assets/cosmos-ultra-body-v2.png',
    technoUltra: 'effects-lab/assets/techno-ultra-body-v2.png',
    electricUltra: 'effects-lab/assets/electric-ultra-body-v7.png',
    fireUltra: 'effects-lab/assets/fire-ultra-phoenix-body-v4.png',
    glitchUltra: 'effects-lab/assets/glitch-ultra-body-v3.png',
    psionicsUltra: 'effects-lab/assets/psionics-ultra-body-v1.png',
    phantomUltra: 'effects-lab/assets/phantom-ultra-body-v6.png',
    sporesStage1: 'effects-lab/assets/spores-stage1-body-v1.png',
    sporesUltra: 'effects-lab/assets/spores-ultra-body-v5.png',
    cosmos: 'assets/ui/slime/forms/slime-body-cosmos-v1.webp?v=1',
    electric: 'assets/ui/slime/forms/slime-body-electric-v1.webp?v=1',
    fire: 'assets/ui/slime/forms/slime-body-fire-v1.webp?v=1'
  });
  const formBodyImages = Object.create(null);
  const formBodyReady = Object.create(null);
  const bodyTintCanvas = document.createElement('canvas');
  const bodyTintContext = bodyTintCanvas.getContext('2d');
  bodyTintCanvas.width = 512;
  bodyTintCanvas.height = 512;
  const tintedPupilLayers = new Map();
  const tintedCheekLayers = new Map();
  const referenceEyeSocketsImage = new Image();
  const referencePupilsImage = new Image();
  const referenceCheeksImage = new Image();
  const referenceEyeExpressionsImage = new Image();
  const referenceMouthExpressionsImage = new Image();
  const nanoCyborgEyeClosedImage = new Image();
  const nanoCyborgEyeTunnelImage = new Image();
  const psionicsEyeBaseImage = new Image();
  const psionicsPupilImage = new Image();
  const phantomPupilsImage = new Image();
  const electricEyeBaseImage = new Image();
  const electricPupilImage = new Image();
  const fireEyeBaseImage = new Image();
  const firePupilImage = new Image();
  const glitchEyeBaseImage = new Image();
  const glitchPupilImage = new Image();
  const glitchXImage = new Image();
  const glitchOImage = new Image();
  const glitchMouthImage = new Image();
  const frostEyeBaseImage = new Image();
  const frostPupilImage = new Image();
  const cosmosEyeBaseImage = new Image();
  const cosmosPupilImage = new Image();
  const sporesEyeBaseImage = new Image();
  const sporesPupilImage = new Image();
  let referenceBodyReady = false;
  let referenceEyeSocketsReady = false;
  let referencePupilsReady = false;
  let referenceCheeksReady = false;
  let referenceEyeExpressionsReady = false;
  let referenceMouthExpressionsReady = false;
  let nanoCyborgEyeClosedReady = false;
  let nanoCyborgEyeTunnelReady = false;
  let psionicsEyeBaseReady = false;
  let psionicsPupilReady = false;
  let phantomPupilsReady = false;
  let electricEyeBaseReady = false;
  let electricPupilReady = false;
  let fireEyeBaseReady = false;
  let firePupilReady = false;
  let glitchEyeBaseReady = false;
  let glitchPupilReady = false;
  let glitchXReady = false;
  let glitchOReady = false;
  let glitchMouthReady = false;
  let frostEyeBaseReady = false;
  let frostPupilReady = false;
  let cosmosEyeBaseReady = false;
  let cosmosPupilReady = false;
  let sporesEyeBaseReady = false;
  let sporesPupilReady = false;
  referenceBodyImage.decoding = 'async';
  referenceEyeSocketsImage.decoding = 'async';
  referencePupilsImage.decoding = 'async';
  referenceCheeksImage.decoding = 'async';
  referenceEyeExpressionsImage.decoding = 'async';
  referenceMouthExpressionsImage.decoding = 'async';
  referenceBodyImage.onload = () => { referenceBodyReady = true; };
  referenceEyeSocketsImage.onload = () => { referenceEyeSocketsReady = true; };
  referencePupilsImage.onload = () => { referencePupilsReady = true; };
  referenceCheeksImage.onload = () => { referenceCheeksReady = true; };
  referenceEyeExpressionsImage.onload = () => { referenceEyeExpressionsReady = true; };
  referenceMouthExpressionsImage.onload = () => { referenceMouthExpressionsReady = true; };
  nanoCyborgEyeClosedImage.onload = () => { nanoCyborgEyeClosedReady = true; };
  nanoCyborgEyeTunnelImage.onload = () => { nanoCyborgEyeTunnelReady = true; };
  psionicsEyeBaseImage.onload = () => { psionicsEyeBaseReady = true; };
  psionicsPupilImage.onload = () => { psionicsPupilReady = true; };
  phantomPupilsImage.onload = () => { phantomPupilsReady = true; };
  electricEyeBaseImage.onload = () => { electricEyeBaseReady = true; };
  electricPupilImage.onload = () => { electricPupilReady = true; };
  fireEyeBaseImage.onload = () => { fireEyeBaseReady = true; };
  firePupilImage.onload = () => { firePupilReady = true; };
  glitchEyeBaseImage.onload = () => { glitchEyeBaseReady = true; };
  glitchPupilImage.onload = () => { glitchPupilReady = true; };
  glitchXImage.onload = () => { glitchXReady = true; };
  glitchOImage.onload = () => { glitchOReady = true; };
  glitchMouthImage.onload = () => { glitchMouthReady = true; };
  frostEyeBaseImage.onload = () => { frostEyeBaseReady = true; };
  frostPupilImage.onload = () => { frostPupilReady = true; };
  cosmosEyeBaseImage.onload = () => { cosmosEyeBaseReady = true; };
  cosmosPupilImage.onload = () => { cosmosPupilReady = true; };
  sporesEyeBaseImage.onload = () => { sporesEyeBaseReady = true; };
  sporesPupilImage.onload = () => { sporesPupilReady = true; };
  referenceBodyImage.src = 'assets/ui/slime/slime-body-reference-v1.webp?v=2';
  referenceEyeSocketsImage.src = 'assets/ui/slime/slime-eye-sockets-reference-v1.webp?v=1';
  referencePupilsImage.src = 'assets/ui/slime/slime-pupils-reference-v1.webp?v=1';
  referenceCheeksImage.src = 'assets/ui/slime/slime-cheeks-reference-v1.webp?v=1';
  referenceEyeExpressionsImage.src = 'assets/ui/slime/slime-eye-expressions-v1.webp?v=1';
  referenceMouthExpressionsImage.src = 'assets/ui/slime/slime-mouth-expressions-v1.webp?v=1';
  nanoCyborgEyeClosedImage.src = 'effects-lab/assets/nano-eye-closed-v11.webp';
  nanoCyborgEyeTunnelImage.src = 'effects-lab/assets/nano-eye-tunnel-v11.webp';
  psionicsEyeBaseImage.src = 'effects-lab/assets/psionics-eye-base-v2.png';
  psionicsPupilImage.src = 'effects-lab/assets/psionics-pupil-v2.png';
  phantomPupilsImage.src = 'effects-lab/assets/phantom-pupils-v3.png';
  electricEyeBaseImage.src = 'effects-lab/assets/electric-eye-base-v1.png';
  electricPupilImage.src = 'effects-lab/assets/electric-pupil-v1.png';
  fireEyeBaseImage.src = 'effects-lab/assets/fire-eye-base-v1.png';
  firePupilImage.src = 'effects-lab/assets/fire-pupil-v1.png';
  glitchEyeBaseImage.src = 'effects-lab/assets/glitch-eye-base-v3.png';
  glitchPupilImage.src = 'effects-lab/assets/glitch-pupil-v2.png';
  glitchXImage.src = 'effects-lab/assets/glitch-symbol-x-v1.png';
  glitchOImage.src = 'effects-lab/assets/glitch-symbol-o-v1.png';
  glitchMouthImage.src = 'effects-lab/assets/glitch-mouth-v1.png';
  frostEyeBaseImage.src = 'effects-lab/assets/frost-eye-base-v1.png';
  frostPupilImage.src = 'effects-lab/assets/frost-pupil-v1.png';
  cosmosEyeBaseImage.src = 'effects-lab/assets/cosmos-eye-base-v1.png';
  cosmosPupilImage.src = 'effects-lab/assets/cosmos-pupil-v1.png';
  sporesEyeBaseImage.src = 'effects-lab/assets/spores-eye-base-v1.png';
  sporesPupilImage.src = 'effects-lab/assets/spores-pupil-v1.png';

  Object.entries(formBodySources).forEach(([form, source]) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      formBodyReady[form] = true;
    };
    image.src = source;
    formBodyImages[form] = image;
  });

  function drawReferenceBody(targetCtx, radius, tint = '', image = referenceBodyImage, filter = '') {
    const glitchUltra = image === formBodyImages.glitchUltra;
    const bodySize = radius * 2.36 * (glitchUltra ? .886 : 1);
    const fireUltra = image === formBodyImages.fireUltra;
    const bodyWidth = bodySize * (fireUltra ? .935 : 1);
    const bodyLeft = glitchUltra ? -bodySize * .5 : -bodyWidth * .5;
    const heightScale = glitchUltra ? .925 / .886
      : fireUltra ? image.naturalHeight / image.naturalWidth
      : image === formBodyImages.electricUltra ? 1.11 : 1;
    // The taller fire sprite keeps its natural proportions; its visible base aligns with the other bodies.
    const bodyTop = glitchUltra ? -radius * 1.168
      : -radius * 1.18 - bodySize * (fireUltra ? 58 / 512 : heightScale - 1);
    if (filter) {
      targetCtx.save();
      targetCtx.filter = filter;
      targetCtx.drawImage(image, bodyLeft, bodyTop, bodyWidth, bodySize * heightScale);
      targetCtx.restore();
      return;
    }
    if (!tint || !bodyTintContext) {
      targetCtx.drawImage(image, bodyLeft, bodyTop, bodyWidth, bodySize * heightScale);
      return;
    }
    bodyTintContext.clearRect(0, 0, 512, 512);
    bodyTintContext.globalCompositeOperation = 'source-over';
    bodyTintContext.globalAlpha = 1;
    bodyTintContext.drawImage(image, 0, 0, 512, 512);
    bodyTintContext.globalCompositeOperation = 'source-atop';
    bodyTintContext.fillStyle = tint;
    bodyTintContext.fillRect(0, 0, 512, 512);
    bodyTintContext.globalCompositeOperation = 'source-over';
    if (fireUltra) targetCtx.drawImage(bodyTintCanvas, bodyLeft, bodyTop, bodyWidth, bodySize * heightScale);
    else targetCtx.drawImage(bodyTintCanvas, -radius * 1.18, -radius * 1.18, radius * 2.36, radius * 2.36);
  }

  function tintedPupilLayer(tint) {
    if (!tint || !referencePupilsReady) return referencePupilsImage;
    if (tintedPupilLayers.has(tint)) return tintedPupilLayers.get(tint);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.drawImage(referencePupilsImage, 0, 0, 512, 512);
    context.globalCompositeOperation = 'color';
    context.fillStyle = tint;
    context.fillRect(0, 0, 512, 512);
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(referencePupilsImage, 0, 0, 512, 512);
    context.globalCompositeOperation = 'source-over';
    tintedPupilLayers.set(tint, canvas);
    return canvas;
  }

  function tintedCheekLayer(filter) {
    if (!filter || !referenceCheeksReady) return referenceCheeksImage;
    if (tintedCheekLayers.has(filter)) return tintedCheekLayers.get(filter);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const context = canvas.getContext('2d');
    context.filter = filter;
    context.drawImage(referenceCheeksImage, 0, 0, 512, 512);
    tintedCheekLayers.set(filter, canvas);
    return canvas;
  }

  function darkenHex(hex, factor = .52) {
    const match = /^#([0-9a-f]{6})$/i.exec(String(hex || ''));
    if (!match) return '#173f4a';
    const value = Number.parseInt(match[1], 16);
    const channel = shift => Math.round(((value >> shift) & 255) * factor);
    return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
  }

  function traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2 = false) {
    targetCtx.beginPath();
    if (cuteV2 && skinId === 'classic') {
      targetCtx.moveTo(tipX, -radius * .99);
      targetCtx.bezierCurveTo(tipX + radius * .19, -radius * .99, radius * .25, -radius * .82, radius * .42, -radius * .7);
      targetCtx.bezierCurveTo(radius * .79, -radius * .49, radius, -radius * .1, radius, radius * .36);
      targetCtx.bezierCurveTo(radius * .98, radius * .78, radius * .63, radius * .99, 0, radius * .99);
      targetCtx.bezierCurveTo(-radius * .63, radius * .99, -radius * .98, radius * .78, -radius, radius * .36);
      targetCtx.bezierCurveTo(-radius, -radius * .1, -radius * .79, -radius * .49, -radius * .42, -radius * .7);
      targetCtx.bezierCurveTo(-radius * .25, -radius * .82, tipX - radius * .19, -radius * .99, tipX, -radius * .99);
    } else if (skinId === 'dumpling') {
      targetCtx.moveTo(0, -radius * .68);
      targetCtx.bezierCurveTo(radius * .58, -radius * .67, radius * .9, -radius * .33, radius * .92, radius * .15);
      targetCtx.bezierCurveTo(radius * .91, radius * .65, radius * .55, radius * .83, 0, radius * .84);
      targetCtx.bezierCurveTo(-radius * .55, radius * .83, -radius * .91, radius * .65, -radius * .92, radius * .15);
      targetCtx.bezierCurveTo(-radius * .9, -radius * .33, -radius * .58, -radius * .67, 0, -radius * .68);
    } else if (skinId === 'ball' || skinId === 'coin') {
      targetCtx.arc(0, 0, radius * .91, 0, Math.PI * 2);
    } else if (skinId === 'cat') {
      targetCtx.moveTo(0, -radius * .83);
      targetCtx.bezierCurveTo(radius * .53, -radius * .84, radius * .91, -radius * .39, radius * .91, radius * .16);
      targetCtx.bezierCurveTo(radius * .88, radius * .68, radius * .5, radius * .92, 0, radius * .93);
      targetCtx.bezierCurveTo(-radius * .5, radius * .92, -radius * .88, radius * .68, -radius * .91, radius * .16);
      targetCtx.bezierCurveTo(-radius * .91, -radius * .39, -radius * .53, -radius * .84, 0, -radius * .83);
    } else if (skinId === 'water') {
      targetCtx.moveTo(tipX, -radius * 1.08);
      targetCtx.bezierCurveTo(radius * .12, -radius * .87, radius * .79, -radius * .57, radius * .91, radius * .13);
      targetCtx.bezierCurveTo(radius * .95, radius * .64, radius * .5, radius * .94, 0, radius * .95);
      targetCtx.bezierCurveTo(-radius * .5, radius * .94, -radius * .95, radius * .64, -radius * .91, radius * .13);
      targetCtx.bezierCurveTo(-radius * .79, -radius * .57, -radius * .12, -radius * .87, tipX, -radius * 1.08);
    } else {
      targetCtx.moveTo(tipX, -radius);
      targetCtx.bezierCurveTo(tipX + radius * .15, -radius * .99, radius * .16, -radius * .86, radius * .26, -radius * .79);
      targetCtx.bezierCurveTo(radius * .67, -radius * .68, radius * .93, -radius * .31, radius * .91, radius * .16);
      targetCtx.bezierCurveTo(radius * .88, radius * .68, radius * .5, radius * .92, 0, radius * .93);
      targetCtx.bezierCurveTo(-radius * .5, radius * .92, -radius * .88, radius * .68, -radius * .91, radius * .16);
      targetCtx.bezierCurveTo(-radius * .93, -radius * .31, -radius * .67, -radius * .68, -radius * .26, -radius * .79);
      targetCtx.bezierCurveTo(-radius * .16, -radius * .86, tipX - radius * .15, -radius * .99, tipX, -radius);
    }
    targetCtx.closePath();
  }

  function drawMealCoating(targetCtx, aura, skinId, radius, tipX, timestamp, cuteV2 = false) {
    if (aura !== 'special' && aura !== 'secret') return;
    targetCtx.save();
    traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2);
    targetCtx.clip();

    if (aura === 'special') {
      const drift = timestamp / 950;
      const dx = Math.cos(drift) * radius;
      const dy = Math.sin(drift) * radius * .55;
      const rainbow = targetCtx.createLinearGradient(-dx, -dy, dx, dy);
      rainbow.addColorStop(0, '#ff4f91');
      rainbow.addColorStop(.18, '#ff9e45');
      rainbow.addColorStop(.36, '#ffe750');
      rainbow.addColorStop(.54, '#48df8a');
      rainbow.addColorStop(.72, '#4bc8ff');
      rainbow.addColorStop(.88, '#8d75ff');
      rainbow.addColorStop(1, '#ed65da');
      targetCtx.globalAlpha = .46;
      targetCtx.fillStyle = rainbow;
      targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

      const sheenX = ((timestamp / 680) % 1) * radius * 3 - radius * 1.5;
      const sheen = targetCtx.createLinearGradient(sheenX - radius * .32, 0, sheenX + radius * .32, 0);
      sheen.addColorStop(0, 'rgba(255,255,255,0)');
      sheen.addColorStop(.5, 'rgba(255,255,255,.62)');
      sheen.addColorStop(1, 'rgba(255,255,255,0)');
      targetCtx.globalAlpha = .46;
      targetCtx.fillStyle = sheen;
      targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
    } else {
      const pulse = .5 + Math.sin(timestamp / 105) * .5;
      const curse = targetCtx.createLinearGradient(-radius * .72, -radius, radius * .62, radius);
      curse.addColorStop(0, `rgba(255,104,151,${.7 + pulse * .08})`);
      curse.addColorStop(.48, `rgba(155,29,103,${.75 + pulse * .08})`);
      curse.addColorStop(1, `rgba(61,11,81,${.82 + pulse * .08})`);
      targetCtx.fillStyle = curse;
      targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);

      for (let index = 0; index < 2; index += 1) {
        const angle = timestamp / (280 + index * 70) + index * Math.PI;
        const omenX = Math.cos(angle) * radius * .34;
        const omenY = Math.sin(angle * .82) * radius * .28;
        const omen = targetCtx.createRadialGradient(omenX, omenY, 0, omenX, omenY, radius * (.48 + index * .08));
        omen.addColorStop(0, index ? 'rgba(255,228,235,.48)' : 'rgba(255,91,143,.58)');
        omen.addColorStop(.45, 'rgba(255,44,112,.25)');
        omen.addColorStop(1, 'rgba(117,8,53,0)');
        targetCtx.fillStyle = omen;
        targetCtx.fillRect(-radius * 1.2, -radius * 1.2, radius * 2.4, radius * 2.4);
      }
    }
    targetCtx.restore();

    targetCtx.save();
    traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2);
    if (aura === 'special') {
      const outline = targetCtx.createLinearGradient(-radius, 0, radius, 0);
      outline.addColorStop(0, '#ff4f91');
      outline.addColorStop(.25, '#ffd84f');
      outline.addColorStop(.5, '#4bdf91');
      outline.addColorStop(.75, '#4fc8ff');
      outline.addColorStop(1, '#b76fff');
      targetCtx.strokeStyle = outline;
      targetCtx.globalAlpha = .82;
      targetCtx.shadowColor = '#fff';
      targetCtx.shadowBlur = 5;
    } else {
      const pulse = .5 + Math.sin(timestamp / 105) * .5;
      targetCtx.strokeStyle = `rgba(255,86,137,${.76 + pulse * .2})`;
      targetCtx.globalAlpha = 1;
      targetCtx.shadowColor = '#8c145c';
      targetCtx.shadowBlur = 7 + pulse * 4;
    }
    targetCtx.lineWidth = Math.max(2.4, radius * .05);
    targetCtx.stroke();
    targetCtx.restore();
  }

  function glitchNoise(seed) {
    let value = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
    value ^= value >>> 13;
    value = Math.imul(value, 0xc2b2ae35);
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }

  function drawCuteFaceV2(targetCtx, {
    radius, emotion, faceInk, alpha, gazeX, gazeY, blink, timestamp, emotionTime = 0,
    useReferenceFace = false, irisTint = '', cheekFilter = '', mouthStyle = '', nanoEyeOpenness = null,
    psionicsEyes = false, phantomEyes = false, sporesEyes = false, cosmosEyes = false, frostEyes = false, fireEyes = false, electricEyes = false, glitchEyes = false,
    glitchFaceLevel = 0
  }) {
    const referenceEyeScale = .74;
    const drawReferenceFaceLayer = (image, offsetX = 0, offsetY = 0, scale = referenceEyeScale) => {
      targetCtx.save();
      targetCtx.translate(offsetX, offsetY);
      targetCtx.scale(scale, scale);
      targetCtx.drawImage(image, -radius * 1.18, -radius * 1.18, radius * 2.36, radius * 2.36);
      targetCtx.restore();
    };
    const drawExpressionCell = (image, columns, rows, index, centerX, centerY, width, height) => {
      const sourceWidth = image.naturalWidth / columns;
      const sourceHeight = image.naturalHeight / rows;
      const column = index % columns;
      const row = Math.floor(index / columns);
      targetCtx.drawImage(
        image,
        column * sourceWidth,
        row * sourceHeight,
        sourceWidth,
        sourceHeight,
        centerX - width * .5,
        centerY - height * .5,
        width,
        height
      );
    };
    const eyeY = radius * .005;
    const eyeX = radius * .305;
    const closedHappy = emotion === 'petting' || emotion === 'pleased';
    const closedJoyEyes = closedHappy || emotion === 'chewing' || emotion === 'savoring';
    const closed = blink || closedHappy || emotion === 'chewing' || emotion === 'savoring' || emotion === 'anticipating';
    const squint = emotion === 'impact' || emotion === 'power';
    const surprised = emotion === 'surprised' || emotion === 'hungry';
    const joyful = emotion === 'joy' || closedHappy;
    const eyeW = radius * (surprised ? .248 : .238);
    const eyeH = radius * (surprised ? .265 : .255);
    const hasPsionicsEyes = psionicsEyes && psionicsEyeBaseReady && psionicsPupilReady;
    const hasElectricEyes = electricEyes && electricEyeBaseReady && electricPupilReady;
    const hasFireEyes = fireEyes && fireEyeBaseReady && firePupilReady;
    const hasGlitchEyes = glitchEyes && glitchEyeBaseReady && glitchPupilReady;
    const canGlitchFace = glitchFaceLevel >= 2 && (emotion === 'focused' || emotion === 'idle');
    const glitchCycle = Math.floor(timestamp / 15500);
    const glitchPhase = timestamp - glitchCycle * 15500;
    const glitchTick = Math.floor(timestamp / 390);
    const glitchChannels = [false, false, false];
    if (canGlitchFace) {
      for (let event = 0; event < 4; event += 1) {
        const seed = glitchCycle * 211 + event * 43;
        const start = 620 + event * 3550 + glitchNoise(seed + 1) * 420;
        const duration = 2050 + glitchNoise(seed + 2) * 420;
        const localTime = glitchPhase - start;
        if (localTime < 0 || localTime >= duration) continue;
        for (let channel = 0; channel < 3; channel += 1) {
          const channelSeed = seed + channel * 19;
          if (event !== 3 && channel !== event && glitchNoise(channelSeed + 3) > .59) continue;
          const delay = glitchNoise(channelSeed + 5) * (channel === 1 ? 320 : 720);
          const hold = (channel === 1 ? 1120 : channel === 2 ? 740 : 820)
            + glitchNoise(channelSeed + 7) * (channel === 1 ? 650 : 570);
          glitchChannels[channel] = localTime >= delay && localTime < delay + hold;
        }
        break;
      }
    }
    const glitchLeftActive = glitchXReady && glitchOReady && glitchChannels[0];
    const glitchRightActive = glitchXReady && glitchOReady && glitchChannels[1];
    const glitchMouthActive = glitchMouthReady && glitchChannels[2];
    const hasFrostEyes = frostEyes && frostEyeBaseReady && frostPupilReady;
    const hasCosmosEyes = cosmosEyes && cosmosEyeBaseReady && cosmosPupilReady;
    const hasSporesEyes = sporesEyes && sporesPupilReady;
    const hasNanoEye = nanoEyeOpenness !== null && nanoCyborgEyeClosedReady && nanoCyborgEyeTunnelReady;
    const referencePixel = radius * 2.36 * referenceEyeScale / 512;
    // Exact occupied rectangles from the original 512px eye and pupil layers.
    const psionicsRects = {
      '-1': {socket: [89, 191, 141, 143], pupil: [137, 218, 97, 108]},
      '1': {socket: [281, 190, 141, 144], pupil: [278, 218, 97, 108]}
    };
    const drawVariantEyePart = (image, side, rect, crop, followGaze = false) => {
      const [px, py, pw, ph] = rect;
      const destX = (px - 256) * referencePixel + (followGaze ? gazeX * radius * .034 : 0);
      const destY = (py - 256) * referencePixel + (followGaze ? gazeY * radius * .034 : 0);
      const destW = pw * referencePixel;
      const destH = ph * referencePixel;
      if (side < 0) {
        targetCtx.save();
        targetCtx.translate(destX + destW, destY);
        targetCtx.scale(-1, 1);
        targetCtx.drawImage(image, ...crop, 0, 0, destW, destH);
        targetCtx.restore();
      } else {
        targetCtx.drawImage(image, ...crop, destX, destY, destW, destH);
      }
    };
    const drawGlitchSymbol = side => {
      if (!(side < 0 ? glitchLeftActive : glitchRightActive)) return false;
      const image = side < 0 ? glitchOImage : glitchXImage;
      targetCtx.save();
      targetCtx.translate((glitchNoise(glitchTick * 19 + side * 7) - .5) * radius * .024,
        (glitchNoise(glitchTick * 23 + side * 13) - .5) * radius * .012);
      targetCtx.shadowColor = side < 0 ? '#50f7ff' : '#ff55e0';
      targetCtx.shadowBlur = radius * .045;
      drawVariantEyePart(image, side, psionicsRects[side].pupil, [102, 102, 1050, 1050], true);
      targetCtx.restore();
      return true;
    };
    const drawPsionicsPupil = side => {
      const [px, py, pw, ph] = psionicsRects[side].pupil;
      targetCtx.drawImage(psionicsPupilImage, 394, 397, 465, 504,
        (px - 256) * referencePixel + gazeX * radius * .034,
        (py - 256) * referencePixel + gazeY * radius * .034,
        pw * referencePixel, ph * referencePixel);
    };
    const drawPhantomEye = side => {
      const [px, py, pw, ph] = psionicsRects[side].pupil;
      const source = side < 0 ? [229, 465, 338, 356] : [685, 465, 339, 356];
      targetCtx.drawImage(phantomPupilsImage, ...source,
        (px - 256) * referencePixel + gazeX * radius * .034,
        (py - 256) * referencePixel + gazeY * radius * .034,
        pw * referencePixel, ph * referencePixel);
    };
    const drawSporesPupil = side => {
      const [px, py, pw, ph] = psionicsRects[side].pupil;
      const destX = (px - 256) * referencePixel + gazeX * radius * .034;
      const destY = (py - 256) * referencePixel + gazeY * radius * .034;
      const destW = pw * referencePixel;
      const destH = ph * referencePixel;
      if (side < 0) {
        targetCtx.save();
        targetCtx.translate(destX + destW, destY);
        targetCtx.scale(-1, 1);
        targetCtx.drawImage(sporesPupilImage, 0, 0, destW, destH);
        targetCtx.restore();
      } else {
        targetCtx.drawImage(sporesPupilImage, destX, destY, destW, destH);
      }
    };
    targetCtx.save();
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    if (useReferenceFace && (closedJoyEyes || blink || emotion === 'anticipating')) {
      targetCtx.strokeStyle = hasPsionicsEyes ? '#31227c' : faceInk;
      targetCtx.lineWidth = Math.max(4.2, radius * .078);
      targetCtx.lineCap = 'round';
      for (const side of [-1, 1]) {
        const cx = side * eyeX;
        targetCtx.beginPath();
        targetCtx.moveTo(cx - radius * .17, eyeY + radius * .035);
        targetCtx.bezierCurveTo(
          cx - radius * .095,
          eyeY - radius * .105,
          cx + radius * .095,
          eyeY - radius * .105,
          cx + radius * .17,
          eyeY + radius * .035
        );
        targetCtx.stroke();
      }
    } else if (useReferenceFace && emotion === 'hurt') {
      targetCtx.strokeStyle = faceInk;
      targetCtx.lineWidth = Math.max(4.2, radius * .078);
      for (const side of [-1, 1]) {
        const px = side * eyeX;
        targetCtx.beginPath();
        targetCtx.moveTo(px - radius * .15, eyeY - radius * .105);
        targetCtx.lineTo(px + radius * .15, eyeY + radius * .105);
        targetCtx.stroke();
        targetCtx.beginPath();
        targetCtx.moveTo(px + radius * .15, eyeY - radius * .105);
        targetCtx.lineTo(px - radius * .15, eyeY + radius * .105);
        targetCtx.stroke();
      }
    } else if (useReferenceFace && squint) {
      targetCtx.strokeStyle = faceInk;
      targetCtx.lineWidth = Math.max(4.2, radius * .078);
      for (const side of [-1, 1]) {
        const cx = side * eyeX;
        targetCtx.beginPath();
        targetCtx.moveTo(cx - radius * .17, eyeY + radius * .025);
        targetCtx.quadraticCurveTo(cx, eyeY - radius * .11, cx + radius * .17, eyeY + radius * .025);
        targetCtx.stroke();
      }
    } else if (emotion === 'hurt') {
      targetCtx.strokeStyle = faceInk;
      targetCtx.lineWidth = Math.max(3, radius * .072);
      for (const side of [-1, 1]) {
        const px = side * eyeX;
        targetCtx.beginPath(); targetCtx.moveTo(px - radius * .11, eyeY - radius * .08); targetCtx.lineTo(px + radius * .11, eyeY + radius * .08); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.moveTo(px + radius * .11, eyeY - radius * .08); targetCtx.lineTo(px - radius * .11, eyeY + radius * .08); targetCtx.stroke();
      }
    } else if (squint) {
      targetCtx.strokeStyle = faceInk;
      targetCtx.lineWidth = radius * .065;
      for (const side of [-1, 1]) {
        targetCtx.beginPath();
        targetCtx.moveTo(side * eyeX - radius * .12, eyeY - side * radius * .055);
        targetCtx.lineTo(side * eyeX + radius * .12, eyeY + side * radius * .055);
        targetCtx.stroke();
      }
    } else if (closed) {
      targetCtx.strokeStyle = faceInk;
      targetCtx.lineWidth = Math.max(3, radius * .07);
      for (const side of [-1, 1]) {
        targetCtx.beginPath();
        targetCtx.arc(side * eyeX, eyeY + radius * .055, radius * .15, Math.PI + .1, Math.PI * 2 - .1);
        targetCtx.stroke();
      }
    } else {
      if (useReferenceFace) {
        targetCtx.globalAlpha = alpha;
        if (hasPsionicsEyes) {
          for (const side of [-1, 1]) {
            const [sx, sy, sw, sh] = psionicsRects[side].socket;
            targetCtx.drawImage(psionicsEyeBaseImage, 235, 231, 779, 789,
              (sx - 256) * referencePixel, (sy - 256) * referencePixel,
              sw * referencePixel, sh * referencePixel);
          }
        } else if (hasElectricEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(electricEyeBaseImage, side, psionicsRects[side].socket, [130, 206, 995, 950]);
          }
        } else if (hasFireEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(fireEyeBaseImage, side, psionicsRects[side].socket, [161, 173, 926, 890]);
          }
        } else if (hasGlitchEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(glitchEyeBaseImage, side, psionicsRects[side].socket, [316, 328, 612, 600]);
          }
        } else if (hasFrostEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(frostEyeBaseImage, side, psionicsRects[side].socket, [45, 74, 1163, 1118]);
          }
        } else if (hasCosmosEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(cosmosEyeBaseImage, side, psionicsRects[side].socket, [52, 46, 1147, 1158]);
          }
        } else if (hasSporesEyes && sporesEyeBaseReady) {
          for (const side of [-1, 1]) {
            const [sx, sy, sw, sh] = psionicsRects[side].socket;
            targetCtx.drawImage(sporesEyeBaseImage,
              (sx - 256) * referencePixel, (sy - 256) * referencePixel,
              sw * referencePixel, sh * referencePixel);
          }
        } else if (hasNanoEye) {
          targetCtx.save();
          targetCtx.beginPath();
          targetCtx.rect(-radius * 2, -radius * 2, radius * 2, radius * 4);
          targetCtx.clip();
          drawReferenceFaceLayer(referenceEyeSocketsImage);
          targetCtx.restore();
        } else {
          drawReferenceFaceLayer(referenceEyeSocketsImage);
        }
        if (hasNanoEye) {
          const [sourceX, sourceY, sourceW, sourceH] = psionicsRects[1].socket;
          const socketX = (sourceX - 256) * referencePixel;
          const socketY = (sourceY - 256) * referencePixel;
          const socketW = sourceW * referencePixel;
          const socketH = sourceH * referencePixel;
          targetCtx.drawImage(nanoCyborgEyeClosedImage,
            socketX, socketY, socketW, socketH);
          if (nanoEyeOpenness > 0) {
            targetCtx.globalAlpha = alpha * Math.max(0, Math.min(1, nanoEyeOpenness));
            targetCtx.drawImage(nanoCyborgEyeTunnelImage,
              socketX, socketY, socketW, socketH);
            targetCtx.globalAlpha = alpha;
          }
          if (hasPsionicsEyes) {
            drawPsionicsPupil(-1);
          } else {
            targetCtx.save();
            targetCtx.beginPath();
            targetCtx.rect(-radius * 2, -radius * 2, radius * 2, radius * 4);
            targetCtx.clip();
            drawReferenceFaceLayer(tintedPupilLayer(irisTint), gazeX * radius * .034, gazeY * radius * .034);
            targetCtx.restore();
          }
          targetCtx.globalAlpha = alpha;
        } else if (hasPsionicsEyes) {
          drawPsionicsPupil(-1);
          drawPsionicsPupil(1);
        } else if (hasElectricEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(electricPupilImage, side, psionicsRects[side].pupil, [210, 150, 834, 989], true);
          }
        } else if (hasFireEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(firePupilImage, side, psionicsRects[side].pupil, [218, 154, 815, 938], true);
          }
        } else if (hasGlitchEyes) {
          for (const side of [-1, 1]) {
            if (!drawGlitchSymbol(side)) drawVariantEyePart(glitchPupilImage, side, psionicsRects[side].pupil, [0, 0, 1254, 1254], true);
          }
        } else if (hasFrostEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(frostPupilImage, side, psionicsRects[side].pupil, [299, 256, 657, 763], true);
          }
        } else if (hasCosmosEyes) {
          for (const side of [-1, 1]) {
            drawVariantEyePart(cosmosPupilImage, side, psionicsRects[side].pupil, [276, 223, 701, 815], true);
          }
        } else if (hasSporesEyes) {
          drawSporesPupil(-1);
          drawSporesPupil(1);
        } else if (!phantomEyes || !phantomPupilsReady) {
          if (glitchLeftActive || glitchRightActive) {
            const normalPupils = tintedPupilLayer(irisTint);
            for (const side of [-1, 1]) {
              if (drawGlitchSymbol(side)) continue;
              targetCtx.save();
              targetCtx.beginPath();
              targetCtx.rect(side < 0 ? -radius * 2 : 0, -radius * 2, radius * 2, radius * 4);
              targetCtx.clip();
              drawReferenceFaceLayer(normalPupils, gazeX * radius * .034, gazeY * radius * .034);
              targetCtx.restore();
            }
          } else {
            drawReferenceFaceLayer(tintedPupilLayer(irisTint), gazeX * radius * .034, gazeY * radius * .034);
          }
        }
        if (phantomEyes && phantomPupilsReady && !hasSporesEyes && !hasCosmosEyes && !hasFrostEyes && !hasFireEyes && !hasElectricEyes && !hasGlitchEyes) {
          drawPhantomEye(-1);
          drawPhantomEye(1);
          targetCtx.globalAlpha = alpha;
        }
      } else {
        for (const side of [-1, 1]) {
          const cx = side * eyeX;

        // The reference has a heavy upper eye contour which softly disappears
        // towards the lower edge. Two offset ellipses give that shape without
        // the rigid, startled-looking ring produced by a uniform stroke.
        targetCtx.fillStyle = faceInk;
        targetCtx.beginPath();
        targetCtx.ellipse(cx, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
        targetCtx.fill();

        const whiteY = eyeY + radius * .018;
        const whiteW = eyeW - radius * .031;
        const whiteH = eyeH - radius * .028;
        targetCtx.fillStyle = '#fff';
        targetCtx.beginPath();
        targetCtx.ellipse(cx, whiteY, whiteW, whiteH, 0, 0, Math.PI * 2);
        targetCtx.fill();

        if (drawGlitchSymbol(side)) {
          targetCtx.globalAlpha = alpha;
          continue;
        }

        const pupilX = cx + gazeX * radius * .03;
        const pupilY = eyeY + gazeY * radius * .03 + radius * .045;
        targetCtx.save();
        targetCtx.beginPath();
        targetCtx.ellipse(cx, whiteY, whiteW, whiteH, 0, 0, Math.PI * 2);
        targetCtx.clip();
        const iris = targetCtx.createLinearGradient(pupilX, pupilY - radius * .15, pupilX, pupilY + radius * .15);
        iris.addColorStop(0, '#082d35');
        iris.addColorStop(.62, '#0c4737');
        iris.addColorStop(1, '#48c539');
        targetCtx.fillStyle = iris;
        targetCtx.beginPath();
        targetCtx.ellipse(pupilX, pupilY, radius * .139, radius * .151, 0, 0, Math.PI * 2);
        targetCtx.fill();

        targetCtx.globalAlpha = alpha * .72;
        targetCtx.fillStyle = '#55d241';
        targetCtx.beginPath();
        targetCtx.ellipse(pupilX, pupilY + radius * .118, radius * .112, radius * .046, 0, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.restore();

        targetCtx.fillStyle = '#fff';
        targetCtx.beginPath();
        targetCtx.arc(pupilX - radius * .042, pupilY - radius * .068, radius * .052, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.globalAlpha = alpha * .82;
        targetCtx.beginPath();
        targetCtx.arc(pupilX + radius * .058, pupilY + radius * .075, radius * .018, 0, Math.PI * 2);
        targetCtx.fill();
          targetCtx.globalAlpha = alpha;
        }
      }
    }

    targetCtx.globalAlpha = alpha * .82;
    if (useReferenceFace) {
      targetCtx.globalAlpha = alpha;
      drawReferenceFaceLayer(tintedCheekLayer(cheekFilter), 0, radius * .035, .94);
    } else {
      for (const side of [-1, 1]) {
        const cheekX = side * radius * .54;
        const cheekY = radius * .3;
        const blush = targetCtx.createRadialGradient(cheekX - side * radius * .025, cheekY - radius * .018, 0, cheekX, cheekY, radius * .18);
        blush.addColorStop(0, cheekFilter ? '#edf8ff' : '#ffc0a9');
        blush.addColorStop(.72, cheekFilter ? '#a7c9e8' : '#ff978e');
        blush.addColorStop(.94, cheekFilter ? 'rgba(122,180,223,.74)' : 'rgba(255,133,139,.72)');
        blush.addColorStop(1, cheekFilter ? 'rgba(122,180,223,0)' : 'rgba(255,133,139,0)');
        targetCtx.fillStyle = blush;
        targetCtx.beginPath(); targetCtx.ellipse(cheekX, cheekY, radius * .17, radius * .085, 0, 0, Math.PI * 2); targetCtx.fill();
      }
    }
    targetCtx.globalAlpha = alpha;

    targetCtx.strokeStyle = faceInk;
    targetCtx.fillStyle = faceInk;
    targetCtx.lineWidth = Math.max(3.2, radius * .068);
    if (mouthStyle === 'pursed') {
      const mouthY = radius * .39;
      targetCtx.save();
      targetCtx.globalAlpha = alpha;
      targetCtx.fillStyle = '#0b6854';
      targetCtx.beginPath();
      targetCtx.ellipse(0, mouthY, radius * .080, radius * .096, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.fillStyle = '#062e31';
      targetCtx.beginPath();
      targetCtx.ellipse(0, mouthY + radius * .006, radius * .058, radius * .076, 0, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.fillStyle = 'rgba(236,255,247,.68)';
      targetCtx.beginPath();
      targetCtx.ellipse(-radius * .018, mouthY - radius * .033, radius * .017, radius * .011, -.35, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.restore();
    } else if (glitchMouthActive) {
      targetCtx.save();
      targetCtx.globalAlpha = alpha;
      targetCtx.translate((glitchNoise(glitchTick * 29 + 5) - .5) * radius * .018, 0);
      targetCtx.drawImage(glitchMouthImage, 57, 23, 1638, 864,
        -radius * .285, radius * .39 - radius * .17, radius * .57, radius * .34);
      targetCtx.restore();
    } else if (useReferenceFace && referenceMouthExpressionsReady) {
      let mouthExpression = 0;
      let mouthOffsetX = 0;
      if (emotion === 'hurt') mouthExpression = 3;
      else if (emotion === 'chewing') {
        const chewSequence = [5, 6, 7, 8, 7, 4];
        const chewStep = Math.min(chewSequence.length - 1, Math.floor(Math.max(0, emotionTime) / 114));
        mouthExpression = chewSequence[chewStep];
        if (mouthExpression === 7) mouthOffsetX = -radius * .018;
        if (mouthExpression === 8) mouthOffsetX = radius * .018;
      } else if (emotion === 'savoring' || emotion === 'anticipating' || squint) mouthExpression = 4;
      else if (surprised) mouthExpression = 2;
      else if (joyful) mouthExpression = 1;
      targetCtx.globalAlpha = alpha;
      const mouthWidth = joyful ? radius * .58 : radius * .65;
      if (hasGlitchEyes) {
        targetCtx.save();
        targetCtx.shadowColor = '#b9fff2';
        targetCtx.shadowBlur = radius * .09;
      }
      drawExpressionCell(
        referenceMouthExpressionsImage,
        3,
        3,
        mouthExpression,
        mouthOffsetX,
        radius * .39,
        mouthWidth,
        radius * .56
      );
      if (hasGlitchEyes) targetCtx.restore();
    } else if (emotion === 'hurt') {
      targetCtx.beginPath(); targetCtx.arc(0, radius * .33, radius * .13, Math.PI + .2, Math.PI * 2 - .2); targetCtx.stroke();
    } else if (emotion === 'chewing') {
      const chew = .5 + Math.sin(timestamp / 150) * .5;
      targetCtx.beginPath(); targetCtx.ellipse(0, radius * .235, radius * (.10 + .025 * chew), radius * (.025 + .065 * chew), 0, 0, Math.PI * 2); targetCtx.fill();
    } else if (emotion === 'savoring' || emotion === 'anticipating' || squint) {
      targetCtx.beginPath(); targetCtx.arc(0, radius * .16, radius * .13, .15, Math.PI - .15); targetCtx.stroke();
    } else if (surprised) {
      targetCtx.beginPath(); targetCtx.ellipse(0, radius * .25, radius * .115, radius * .145, 0, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.globalAlpha = alpha * .7;
      targetCtx.fillStyle = '#ff9b9f';
      targetCtx.beginPath(); targetCtx.ellipse(0, radius * .31, radius * .067, radius * .038, 0, 0, Math.PI * 2); targetCtx.fill();
    } else if (joyful) {
      targetCtx.beginPath();
      targetCtx.moveTo(-radius * .22, radius * .19);
      targetCtx.quadraticCurveTo(0, radius * .28, radius * .22, radius * .19);
      targetCtx.bezierCurveTo(radius * .19, radius * .51, -radius * .19, radius * .51, -radius * .22, radius * .19);
      targetCtx.closePath(); targetCtx.fill();
      targetCtx.fillStyle = '#ff9b9f';
      targetCtx.beginPath(); targetCtx.ellipse(radius * .01, radius * .41, radius * .12, radius * .06, -.08, 0, Math.PI * 2); targetCtx.fill();
    } else {
      const smileLift = Math.sin(timestamp / 1200) * radius * .006;
      targetCtx.beginPath();
      targetCtx.moveTo(-radius * .17, radius * .245 + smileLift);
      targetCtx.quadraticCurveTo(0, radius * .315, radius * .17, radius * .245 + smileLift);
      targetCtx.bezierCurveTo(radius * .15, radius * .45, -radius * .15, radius * .45, -radius * .17, radius * .245 + smileLift);
      targetCtx.closePath(); targetCtx.fill();
      targetCtx.save(); targetCtx.clip();
      targetCtx.fillStyle = '#f69a9d';
      targetCtx.beginPath(); targetCtx.ellipse(0, radius * .405, radius * .092, radius * .043, 0, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.restore();
    }
    targetCtx.restore();
  }

  function drawSlimeAvatar(targetCtx, {
    x, y, radius, emotion = 'focused', colors = defaultColors,
    skin = 'classic',
    scaleX = 1, scaleY = 1, rotation = 0, alpha = 1,
    gazeX = 0, gazeY = 0, blink = false, aura = '', petPoint = null, tipSway = 0,
    timestamp = performance.now(), emotionTime = 0,
    bodyPaint = null, backLayer = null, frontLayer = null, afterLayer = null,
    bodyHighlight = true, outlineColor = '#26334a', faceColor = null,
    faceScaleX = 1, faceScaleY = 1, appearance = 'classic', bodyTint = '', bodyFilter = '',
    bodyVariant = '', irisTint = '', cheekFilter = '', hideFace = false, mouthStyle = '', nanoEyeOpenness = null,
    psionicsEyes = false, phantomEyes = false, sporesEyes = false, cosmosEyes = false, frostEyes = false, fireEyes = false, electricEyes = false, glitchEyes = false,
    glitchFaceLevel = 0
  }) {
    if (aura) {
      targetCtx.save();
      targetCtx.translate(x, y);
      if (aura === 'epic') {
        const auraPulse = 1 + Math.sin(timestamp / 180) * .04;
        const epicGlow = targetCtx.createRadialGradient(0, 0, radius * .58, 0, 0, radius + 19);
        epicGlow.addColorStop(0, 'rgba(155,83,238,.5)');
        epicGlow.addColorStop(.58, 'rgba(180,108,255,.32)');
        epicGlow.addColorStop(1, 'rgba(141,68,225,0)');
        targetCtx.globalAlpha = .9;
        targetCtx.fillStyle = epicGlow;
        targetCtx.beginPath(); targetCtx.arc(0, 0, (radius + 19) * auraPulse, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.globalAlpha = .82;
        for (let index = 0; index < 7; index += 1) {
          const side = index % 2 ? 1 : -1;
          const phase = (timestamp / 780 + index * .19) % 1;
          const px = side * radius * (.55 + (index % 3) * .16);
          const py = radius * .45 - phase * radius * 1.55;
          const size = 2.5 + (1 - phase) * 2.5;
          targetCtx.fillStyle = index % 3 === 0 ? '#f0c4ff' : '#9f6cff';
          targetCtx.save(); targetCtx.translate(px, py); targetCtx.rotate(Math.PI / 4 + phase); targetCtx.fillRect(-size, -size, size * 2, size * 2); targetCtx.restore();
        }
      } else if (aura === 'special') {
        const glow = targetCtx.createRadialGradient(0, 0, radius * .68, 0, 0, radius + 13);
        glow.addColorStop(0, 'rgba(255,244,157,.2)');
        glow.addColorStop(.58, 'rgba(255,188,55,.2)');
        glow.addColorStop(1, 'rgba(173,99,255,0)');
        targetCtx.fillStyle = glow;
        targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 13, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.globalAlpha = .62;
        targetCtx.strokeStyle = '#ffd84f';
        targetCtx.lineCap = 'round';
        for (let index = 0; index < 8; index += 1) {
          const angle = index / 8 * Math.PI * 2 + timestamp / 2800;
          const inner = radius + 3;
          const outer = radius + (index % 2 ? 8 : 13);
          targetCtx.lineWidth = index % 2 ? 2 : 3.5;
          targetCtx.beginPath(); targetCtx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner); targetCtx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer); targetCtx.stroke();
        }
        const rainbow = ['#ff5f9f', '#ffb24e', '#ffe45a', '#4ddd8a', '#4fcaff', '#a875ff'];
        rainbow.forEach((color, index) => {
          const angle = index / rainbow.length * Math.PI * 2 + timestamp / 1500;
          const twinkle = .55 + Math.sin(timestamp / 170 + index * 1.7) * .45;
          const px = Math.cos(angle) * (radius + 7);
          const py = Math.sin(angle) * (radius * .8 + 5);
          const size = 1.8 + twinkle * 1.8;
          targetCtx.globalAlpha = .58 + twinkle * .32;
          targetCtx.fillStyle = color;
          targetCtx.beginPath(); targetCtx.arc(px, py, size, 0, Math.PI * 2); targetCtx.fill();
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.arc(px - .7, py - .7, Math.max(.7, size * .25), 0, Math.PI * 2); targetCtx.fill();
        });
      } else if (aura === 'secret') {
        const pulse = .5 + Math.sin(timestamp / 125) * .5;
        const glow = targetCtx.createRadialGradient(0, 0, radius * .7, 0, 0, radius + 14);
        glow.addColorStop(0, `rgba(255,92,143,${.15 + pulse * .08})`);
        glow.addColorStop(.7, `rgba(112,17,91,${.3 + pulse * .1})`);
        glow.addColorStop(1, 'rgba(42,5,54,0)');
        targetCtx.fillStyle = glow;
        targetCtx.beginPath(); targetCtx.arc(0, 0, radius + 14, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.shadowColor = '#c0185a';
        targetCtx.shadowBlur = 7;
        for (let index = 0; index < 6; index += 1) {
          const phase = (timestamp / 820 + index * .17) % 1;
          const angle = index / 6 * Math.PI * 2 + phase * .72;
          const distance = radius + 15 - phase * 22;
          const px = Math.cos(angle) * distance;
          const py = Math.sin(angle) * distance * .82;
          const size = 2.3 + (1 - phase) * 2.7;
          targetCtx.globalAlpha = Math.sin(phase * Math.PI) * .82;
          targetCtx.fillStyle = index % 3 === 0 ? '#ffe2ec' : index % 2 ? '#ff5b9f' : '#bd38a2';
          targetCtx.beginPath(); targetCtx.arc(px, py, size, 0, Math.PI * 2); targetCtx.fill();
        }
      }
      targetCtx.restore();
    }

    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation);
    targetCtx.scale(scaleX, scaleY);

    const skinId = String(skin || 'classic');
    const cuteV2 = appearance === 'cute-v2' || skinId === 'classic';
    const usesDefaultPalette = Array.isArray(colors)
      && colors.length === defaultColors.length
      && colors.every((color, index) => color === defaultColors[index]);
    const variantBodyImage = formBodyReady[bodyVariant] ? formBodyImages[bodyVariant] : null;
    const activeBodyImage = variantBodyImage || referenceBodyImage;
    const useReferenceBody = cuteV2
      && skinId === 'classic'
      && usesDefaultPalette
      && typeof bodyPaint !== 'function'
      && (variantBodyImage || referenceBodyReady);
    const useReferenceFace = cuteV2
      && skinId === 'classic'
      && referenceEyeSocketsReady
      && referencePupilsReady
      && referenceCheeksReady;
    const outline = cuteV2 && outlineColor === '#26334a'
      ? bodyPaint
        ? '#215a70'
        : usesDefaultPalette
          ? '#06483c'
          : darkenHex(colors[2])
      : outlineColor;
    const faceInk = faceColor || (cuteV2 ? '#083f3b' : outline);
    if (cuteV2 && colors.every((color, index) => color === defaultColors[index])) colors = ['#f7ff92', '#72f23e', '#0fc868'];
    const gradient = targetCtx.createRadialGradient(-radius * (cuteV2 ? .12 : .25), -radius * (cuteV2 ? .2 : .35), radius * (cuteV2 ? .04 : .12), 0, radius * .02, radius * 1.12);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(cuteV2 ? .42 : .58, colors[1]);
    gradient.addColorStop(1, colors[2]);
    targetCtx.fillStyle = gradient;
    targetCtx.strokeStyle = outline;
    targetCtx.lineWidth = Math.max(2.7, radius * (cuteV2 ? .082 : .09));
    const tipX = tipSway * radius;
    const layerState = { radius, tipX, skinId, timestamp, colors, cuteV2, bodyVariant };

    if (typeof backLayer === 'function') backLayer(targetCtx, layerState);

    if (skinId === 'cat') {
      for (const side of [-1, 1]) {
        targetCtx.fillStyle = gradient;
        targetCtx.beginPath();
        targetCtx.moveTo(side * radius * .72, -radius * .52);
        targetCtx.quadraticCurveTo(side * radius * .69, -radius * .92, side * radius * .34, -radius * .78);
        targetCtx.quadraticCurveTo(side * radius * .43, -radius * .59, side * radius * .72, -radius * .52);
        targetCtx.closePath(); targetCtx.fill(); targetCtx.stroke();
        targetCtx.globalAlpha = alpha * .72;
        targetCtx.fillStyle = '#ffd2df';
        targetCtx.beginPath();
        targetCtx.moveTo(side * radius * .61, -radius * .6);
        targetCtx.lineTo(side * radius * .61, -radius * .79);
        targetCtx.lineTo(side * radius * .43, -radius * .71);
        targetCtx.closePath(); targetCtx.fill();
        targetCtx.globalAlpha = alpha;
      }
    } else if (skinId === 'dumpling') {
      targetCtx.fillStyle = gradient;
      targetCtx.beginPath();
      targetCtx.ellipse(0, -radius * .61, radius * .25, radius * .2, 0, 0, Math.PI * 2);
      targetCtx.fill(); targetCtx.stroke();
    }

    if (useReferenceBody && bodyVariant === 'cosmosUltra') {
      targetCtx.save();
      targetCtx.translate(0, -radius * .018);
      targetCtx.scale(.94, .94);
      drawReferenceBody(targetCtx, radius, '', activeBodyImage, bodyFilter);
      targetCtx.restore();
    } else if (useReferenceBody) {
      drawReferenceBody(targetCtx, radius, variantBodyImage ? '' : bodyTint, activeBodyImage, bodyFilter);
    } else {
      targetCtx.fillStyle = gradient;
      traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2);
      if (typeof bodyPaint === 'function') {
        targetCtx.save();
        targetCtx.clip();
        bodyPaint(targetCtx, layerState);
        targetCtx.restore();
        traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2);
      } else {
        targetCtx.fill();
      }
      targetCtx.stroke();
    }

    if (cuteV2 && !useReferenceBody && usesDefaultPalette && typeof bodyPaint !== 'function') {
      targetCtx.save();
      traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2);
      targetCtx.clip();
      targetCtx.strokeStyle = 'rgba(91,255,99,.62)';
      targetCtx.lineWidth = radius * .055;
      traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2);
      targetCtx.stroke();
      targetCtx.restore();
    }

    if (cuteV2 && bodyHighlight && !useReferenceBody) {
      targetCtx.save();
      traceSlimeBody(targetCtx, skinId, radius, tipX, cuteV2);
      targetCtx.clip();
      const innerGlow = targetCtx.createRadialGradient(0, -radius * .08, 0, 0, -radius * .02, radius * .74);
      innerGlow.addColorStop(0, 'rgba(255,255,120,.42)');
      innerGlow.addColorStop(.55, 'rgba(235,255,144,.16)');
      innerGlow.addColorStop(1, 'rgba(255,255,255,0)');
      targetCtx.fillStyle = innerGlow;
      targetCtx.fillRect(-radius, -radius, radius * 2, radius * 2);
      targetCtx.restore();
    }

    drawMealCoating(targetCtx, aura, skinId, radius, tipX, timestamp, cuteV2);

    if (bodyHighlight && !useReferenceBody) {
      targetCtx.globalAlpha = alpha * (cuteV2 ? .6 : .25);
      targetCtx.fillStyle = '#fff';
      targetCtx.beginPath();
      targetCtx.ellipse(-radius * .35, -radius * (cuteV2 ? .54 : .36), radius * (cuteV2 ? .25 : .23), radius * (cuteV2 ? .115 : .13), -.62, 0, Math.PI * 2);
      targetCtx.fill();
      if (cuteV2) {
        targetCtx.globalAlpha = alpha * .6;
        targetCtx.beginPath(); targetCtx.arc(-radius * .12, -radius * .7, radius * .06, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.globalAlpha = alpha * .58;
        targetCtx.beginPath(); targetCtx.ellipse(radius * .16, -radius * .84, radius * .13, radius * .045, .32, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.globalAlpha = alpha * .34;
        targetCtx.beginPath(); targetCtx.ellipse(radius * .74, -radius * .16, radius * .075, radius * .045, .65, 0, Math.PI * 2); targetCtx.fill();
      }
      targetCtx.globalAlpha = alpha;
    }

    if (petPoint) {
      targetCtx.globalAlpha = alpha * .62;
      targetCtx.fillStyle = '#fff';
      targetCtx.beginPath();
      targetCtx.ellipse(petPoint.x * radius, petPoint.y * radius, radius * .13, radius * .075, -.45, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    }

    if (skinId === 'honey') {
      const honeyCap = targetCtx.createLinearGradient(0, -radius * 1.04, 0, -radius * .21);
      honeyCap.addColorStop(0, '#fff1a6');
      honeyCap.addColorStop(.46, '#ffc53d');
      honeyCap.addColorStop(1, '#e89118');
      targetCtx.fillStyle = honeyCap;
      targetCtx.strokeStyle = outline;
      targetCtx.lineWidth = Math.max(2.2, radius * .065);
      targetCtx.beginPath();
      targetCtx.moveTo(-radius * .64, -radius * .49);
      targetCtx.bezierCurveTo(-radius * .61, -radius * .74, -radius * .4, -radius * .87, -radius * .18, -radius * .88);
      targetCtx.bezierCurveTo(-radius * .12, -radius * 1.04, radius * .03, -radius * 1.1, radius * .14, -radius * .9);
      targetCtx.bezierCurveTo(radius * .37, -radius * .86, radius * .6, -radius * .72, radius * .64, -radius * .49);
      targetCtx.bezierCurveTo(radius * .6, -radius * .39, radius * .53, -radius * .36, radius * .45, -radius * .43);
      targetCtx.bezierCurveTo(radius * .39, -radius * .48, radius * .39, -radius * .24, radius * .28, -radius * .23);
      targetCtx.bezierCurveTo(radius * .16, -radius * .22, radius * .2, -radius * .46, radius * .07, -radius * .43);
      targetCtx.bezierCurveTo(-radius * .04, -radius * .4, -radius * .01, -radius * .29, -radius * .1, -radius * .28);
      targetCtx.bezierCurveTo(-radius * .22, -radius * .26, -radius * .19, -radius * .48, -radius * .33, -radius * .44);
      targetCtx.bezierCurveTo(-radius * .46, -radius * .4, -radius * .5, -radius * .35, -radius * .58, -radius * .4);
      targetCtx.bezierCurveTo(-radius * .62, -radius * .43, -radius * .63, -radius * .46, -radius * .64, -radius * .49);
      targetCtx.closePath(); targetCtx.fill(); targetCtx.stroke();
      targetCtx.globalAlpha = alpha * .68;
      targetCtx.fillStyle = '#fff8cf';
      targetCtx.beginPath(); targetCtx.ellipse(-radius * .25, -radius * .72, radius * .17, radius * .075, -.34, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    } else if (skinId === 'ball') {
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.arc(0, 0, radius * .84, 0, Math.PI * 2);
      targetCtx.clip();
      targetCtx.globalAlpha = alpha * .45;
      targetCtx.strokeStyle = '#526079';
      targetCtx.lineWidth = Math.max(1.6, radius * .038);
      targetCtx.lineCap = 'round';
      targetCtx.beginPath();
      targetCtx.moveTo(-radius * .12, -radius * .35);
      targetCtx.lineTo(-radius * .38, -radius * .15);
      targetCtx.lineTo(-radius * .61, -radius * .07);
      targetCtx.moveTo(radius * .12, -radius * .35);
      targetCtx.lineTo(radius * .38, -radius * .15);
      targetCtx.lineTo(radius * .61, -radius * .07);
      targetCtx.moveTo(-radius * .52, radius * .12);
      targetCtx.lineTo(-radius * .34, radius * .48);
      targetCtx.lineTo(-radius * .16, radius * .58);
      targetCtx.moveTo(radius * .52, radius * .12);
      targetCtx.lineTo(radius * .34, radius * .48);
      targetCtx.lineTo(radius * .16, radius * .58);
      targetCtx.stroke();

      const drawPanel = (centerX, centerY, size, rotation = -Math.PI / 2) => {
        targetCtx.beginPath();
        for (let index = 0; index < 5; index += 1) {
          const angle = rotation + index * Math.PI * 2 / 5;
          const panelX = centerX + Math.cos(angle) * size;
          const panelY = centerY + Math.sin(angle) * size;
          if (index === 0) targetCtx.moveTo(panelX, panelY);
          else targetCtx.lineTo(panelX, panelY);
        }
        targetCtx.closePath();
        targetCtx.fill();
      };
      targetCtx.globalAlpha = alpha * .94;
      targetCtx.fillStyle = '#26334a';
      drawPanel(0, -radius * .57, radius * .2);
      drawPanel(-radius * .76, radius * .04, radius * .23, -Math.PI / 2 + .16);
      drawPanel(radius * .76, radius * .04, radius * .23, -Math.PI / 2 - .16);
      drawPanel(0, radius * .72, radius * .21, Math.PI / 2);
      targetCtx.restore();
      targetCtx.globalAlpha = alpha * .78;
      targetCtx.fillStyle = '#fff';
      targetCtx.beginPath();
      targetCtx.ellipse(-radius * .34, -radius * .34, radius * .15, radius * .075, -.55, 0, Math.PI * 2);
      targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    } else if (skinId === 'water') {
      targetCtx.globalAlpha = alpha * .6;
      targetCtx.fillStyle = '#eaffff';
      targetCtx.beginPath(); targetCtx.arc(-radius * .54, -radius * .06, radius * .065, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.beginPath(); targetCtx.arc(radius * .49, -radius * .42, radius * .045, 0, Math.PI * 2); targetCtx.fill();
      targetCtx.globalAlpha = alpha;
    } else if (skinId === 'dumpling') {
      targetCtx.globalAlpha = alpha * .7;
      targetCtx.strokeStyle = '#a87b57';
      targetCtx.lineWidth = Math.max(1.7, radius * .045);
      for (const side of [-1, 0, 1]) {
        targetCtx.beginPath();
        targetCtx.moveTo(side * radius * .11, -radius * .69);
        targetCtx.quadraticCurveTo(side * radius * .23, -radius * .5, side * radius * .3, -radius * .39);
        targetCtx.stroke();
      }
      targetCtx.globalAlpha = alpha;
    }

    if (typeof frontLayer === 'function') frontLayer(targetCtx, layerState);

    if (hideFace) {
      if (typeof afterLayer === 'function') afterLayer(targetCtx, layerState);
      targetCtx.restore();
      return;
    }

    targetCtx.scale(faceScaleX, faceScaleY);
    if (cuteV2) {
      drawCuteFaceV2(targetCtx, {
        radius, emotion, faceInk, alpha, gazeX, gazeY, blink, timestamp, emotionTime,
        useReferenceFace, irisTint, cheekFilter, mouthStyle, nanoEyeOpenness, psionicsEyes, phantomEyes, sporesEyes, cosmosEyes, frostEyes, fireEyes, electricEyes, glitchEyes,
        glitchFaceLevel
      });
      if (typeof afterLayer === 'function') afterLayer(targetCtx, layerState);
      targetCtx.restore();
      return;
    }
    const eyeY = -radius * .12;
    const eyeX = radius * .245;
    const chewPulse = (Math.sin(timestamp / 48 - Math.PI / 2) + 1) / 2;
    const chewSquint = emotion === 'chewing';
    const anticipationSquint = emotion === 'anticipating' || emotion === 'savoring';
    const closedHappy = emotion === 'petting' || emotion === 'pleased';
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    const cheekPuff = chewSquint ? 1 + (1 - chewPulse) * .16 : 1;
    targetCtx.globalAlpha = alpha * (closedHappy ? .68 : chewSquint ? .58 + (1 - chewPulse) * .12 : .48);
    targetCtx.fillStyle = '#f78591';
    targetCtx.beginPath(); targetCtx.ellipse(-radius * .45, radius * .14, radius * .14 * cheekPuff, radius * .075 * cheekPuff, 0, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.beginPath(); targetCtx.ellipse(radius * .45, radius * .14, radius * .14 * cheekPuff, radius * .075 * cheekPuff, 0, 0, Math.PI * 2); targetCtx.fill();
    targetCtx.globalAlpha = alpha;

    if (emotion === 'hurt') {
      targetCtx.strokeStyle = faceInk;
      targetCtx.lineWidth = Math.max(2.5, radius * .085);
      for (const side of [-1, 1]) {
        const eyeCenter = eyeX * side;
        targetCtx.beginPath(); targetCtx.moveTo(eyeCenter - radius * .09, eyeY - radius * .08); targetCtx.lineTo(eyeCenter + radius * .09, eyeY + radius * .08); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.moveTo(eyeCenter + radius * .09, eyeY - radius * .08); targetCtx.lineTo(eyeCenter - radius * .09, eyeY + radius * .08); targetCtx.stroke();
      }
      targetCtx.beginPath(); targetCtx.arc(0, radius * .29, radius * .17, Math.PI + .18, Math.PI * 2 - .18); targetCtx.stroke();
    } else {
      const squint = emotion === 'impact' || emotion === 'power';
      if (squint) {
        targetCtx.strokeStyle = faceInk;
        targetCtx.lineWidth = Math.max(2.5, radius * .08);
        targetCtx.beginPath(); targetCtx.moveTo(-eyeX - radius * .11, eyeY - radius * .03); targetCtx.lineTo(-eyeX + radius * .11, eyeY + radius * .06); targetCtx.stroke();
        targetCtx.beginPath(); targetCtx.moveTo(eyeX + radius * .11, eyeY - radius * .03); targetCtx.lineTo(eyeX - radius * .11, eyeY + radius * .06); targetCtx.stroke();
      } else if (blink || closedHappy || chewSquint || anticipationSquint) {
        targetCtx.strokeStyle = faceInk;
        targetCtx.lineWidth = Math.max(2.5, radius * .075);
        for (const side of [-1, 1]) {
          targetCtx.beginPath();
          targetCtx.arc(eyeX * side, eyeY + radius * .05, radius * .14, Math.PI + .12, Math.PI * 2 - .12);
          targetCtx.stroke();
        }
      } else {
        const wide = emotion === 'joy' || emotion === 'surprised' || emotion === 'hungry';
        const eyeW = radius * (wide ? .185 : .17);
        const eyeH = radius * (wide ? .225 : .205);
        targetCtx.strokeStyle = faceInk;
        targetCtx.lineWidth = Math.max(2.2, radius * .07);
        for (const side of [-1, 1]) {
          const eyeCenter = eyeX * side;
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.ellipse(eyeCenter, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2); targetCtx.fill(); targetCtx.stroke();
          const pupilX = eyeCenter + gazeX * radius * .055;
          const pupilY = eyeY + radius * .015 + gazeY * radius * .05;
          targetCtx.fillStyle = faceInk;
          targetCtx.beginPath(); targetCtx.ellipse(pupilX, pupilY, radius * .065, radius * .095, 0, 0, Math.PI * 2); targetCtx.fill();
          targetCtx.fillStyle = '#fff';
          targetCtx.beginPath(); targetCtx.arc(pupilX - radius * .018, pupilY - radius * .03, Math.max(1, radius * .018), 0, Math.PI * 2); targetCtx.fill();
        }
      }

      targetCtx.strokeStyle = faceInk;
      targetCtx.fillStyle = faceInk;
      targetCtx.lineWidth = Math.max(2.3, radius * .075);
      if (emotion === 'surprised' || emotion === 'hungry') {
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .27, radius * .115, radius * (emotion === 'hungry' ? .18 : .16), 0, 0, Math.PI * 2); targetCtx.fill();
        if (emotion === 'hungry') {
          targetCtx.fillStyle = '#f78591';
          targetCtx.beginPath(); targetCtx.ellipse(0, radius * .35, radius * .07, radius * .04, 0, 0, Math.PI * 2); targetCtx.fill();
        }
      } else if (emotion === 'chewing') {
        const mouthOpen = Math.max(0, (chewPulse - .46) / .54);
        if (mouthOpen < .08) {
          targetCtx.beginPath();
          targetCtx.arc(0, radius * .18, radius * .13, .16, Math.PI - .16);
          targetCtx.stroke();
        } else {
          const easedOpen = mouthOpen * mouthOpen * (3 - 2 * mouthOpen);
          targetCtx.beginPath();
          targetCtx.ellipse(0, radius * (.225 + easedOpen * .018), radius * (.075 + easedOpen * .035), radius * (.018 + easedOpen * .078), 0, 0, Math.PI * 2);
          targetCtx.fill();
        }
      } else if (emotion === 'anticipating' || emotion === 'savoring') {
        targetCtx.beginPath();
        targetCtx.arc(0, radius * .15, radius * .13, .18, Math.PI - .18);
        targetCtx.stroke();
      } else if (emotion === 'joy' || closedHappy) {
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .25, radius * .19, radius * .145, 0, 0, Math.PI * 2); targetCtx.fill();
        targetCtx.fillStyle = '#f78591';
        targetCtx.beginPath(); targetCtx.ellipse(0, radius * .32, radius * .105, radius * .05, 0, 0, Math.PI * 2); targetCtx.fill();
      } else if (squint) {
        targetCtx.beginPath(); targetCtx.arc(0, radius * .16, radius * .19, .12, Math.PI - .12); targetCtx.stroke();
      } else {
        targetCtx.beginPath(); targetCtx.arc(0, radius * .15, radius * .165, .12, Math.PI - .12); targetCtx.stroke();
      }
    }

    if (skinId === 'cat') {
      targetCtx.globalAlpha = alpha * .75;
      targetCtx.strokeStyle = faceInk;
      targetCtx.lineWidth = Math.max(1.4, radius * .035);
      for (const side of [-1, 1]) {
        for (let index = -1; index <= 1; index += 1) {
          targetCtx.beginPath();
          targetCtx.moveTo(side * radius * .43, radius * (.12 + index * .08));
          targetCtx.lineTo(side * radius * .76, radius * (.08 + index * .13));
          targetCtx.stroke();
        }
      }
      targetCtx.globalAlpha = alpha;
    }
    if (typeof afterLayer === 'function') afterLayer(targetCtx, layerState);
    targetCtx.restore();
  }

  window.SlimeAvatarRenderer = Object.freeze({ drawSlimeAvatar });
})();
