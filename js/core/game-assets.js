(() => {
  'use strict';

  const config = window.SlimeGameConfig;
  if (!config) throw new Error('SlimeGameConfig must be loaded before game-assets.js');

  const {
    ASSET_REVISION,
    FOOD_ASSET_ROOT,
    UI_ASSET_ROOT,
    FOOD_EDITOR_STORAGE_KEY,
    FOOD_ART_OFFSETS,
    WORLD_SPRITE_NAMES
  } = config;
  const foodRarities = new Set(config.FOOD_RARITIES);
  const foodCategories = new Set(config.FOOD_CATEGORIES);
  const worldSprites = {};
  const editorSprites = {};
  const thumbnailFitCache = new Map();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function versionedAsset(source) {
    const value = String(source || '');
    if (!/^assets\//i.test(value)) return value;
    return `${value}${value.includes('?') ? '&' : '?'}v=${ASSET_REVISION}`;
  }

  function ensureWorldSprites(worldId) {
    if (worldSprites[worldId] || !WORLD_SPRITE_NAMES[worldId]) return worldSprites[worldId] || null;
    worldSprites[worldId] = Object.fromEntries(WORLD_SPRITE_NAMES[worldId].map(name => {
      const image = new Image();
      const extension = worldId === 3 ? 'png' : 'webp';
      const catalogSource = window.SlimeWorldCatalog?.assetSource?.(worldId, name);
      image.src = versionedAsset(catalogSource || `assets/world${worldId}/${name}.${extension}`);
      return [name, image];
    }));
    return worldSprites[worldId];
  }

  function loadCrackStages() {
    return [null, 25, 50, 75].map(damage => {
      if (!damage) return null;
      const image = new Image();
      image.src = versionedAsset(`assets/cracks/universal/damage-${damage}.png`);
      return image;
    });
  }

  const crackStageSprites = Object.freeze(loadCrackStages());

  const vfxSprites = Object.fromEntries([
    'heal-cross',
    'spring-gust',
    'cryo-1',
    'cryo-2',
    'cryo-3',
    'cryo-4',
    'snowflake-hit',
    'apple-grow',
    'apple-shrink',
    'damage-splash',
    'bomb-1',
    'bomb-2',
    'bomb-3',
    'bomb-4',
    'geyser-compact-1',
    'geyser-compact-2',
    'geyser-compact-3',
    'geyser-compact-4',
    'meteor-flight',
    'meteor-impact-1',
    'meteor-impact-2',
    'combo-stage-1',
    'combo-stage-2',
    'combo-stage-3',
    'combo-stage-4',
    'combo-stage-5'
  ].map(name => {
    const image = new Image();
    const geyserFrame = name.match(/^geyser-compact-(\d)$/)?.[1];
    const comboStage = name.match(/^combo-stage-(\d)$/)?.[1];
    image.src = versionedAsset(geyserFrame
      ? `assets/vfx/geyser-compact/frame-${geyserFrame}.png`
      : comboStage
        ? `assets/ui/combo/stage-${comboStage}.png`
        : `assets/vfx/${name}.png`);
    return [name, image];
  }));

  function editorSprite(source) {
    if (!source) return null;
    if (!editorSprites[source]) {
      const image = new Image();
      image.src = versionedAsset(source);
      editorSprites[source] = image;
    }
    return editorSprites[source];
  }

  function foodImageSource(food) {
    const customImage = String(food.image || '').trim();
    const isEmbeddedImage = /^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(customImage);
    const isProjectAsset = /^assets\/(?:ЕДА|food)\/[\p{L}\p{N} _()./-]+\.(?:png|jpe?g|webp|gif)$/iu.test(customImage);
    if (isEmbeddedImage) return customImage;
    return versionedAsset(isProjectAsset ? customImage : `${FOOD_ASSET_ROOT}${food.id}.webp`);
  }

  function escapeAttribute(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function foodArtMarkup(food, className = 'food-model') {
    const [baseX, baseY] = FOOD_ART_OFFSETS[food.id] || [0, 0];
    const clampArt = (value, fallback, min, max) => Number.isFinite(Number(value))
      ? Math.max(min, Math.min(max, Number(value)))
      : fallback;
    const x = clampArt(food.artX, baseX, -30, 30);
    const y = clampArt(food.artY, baseY, -30, 30);
    const scale = clampArt(food.artScale, 1, .55, 1.6);
    return `<img class="${className}" src="${escapeAttribute(foodImageSource(food))}" alt="" draggable="false" decoding="async" style="--food-x:${x}%;--food-y:${y}%;--food-scale:${scale}">`;
  }

  function centerFoodThumbnail(image) {
    if (!image) return;
    const applyFit = fit => {
      image.style.setProperty('--food-thumb-x', `${fit.x}%`);
      image.style.setProperty('--food-thumb-y', `${fit.y}%`);
      image.style.setProperty('--food-thumb-scale', String(fit.scale));
    };
    const analyze = () => {
      const source = image.currentSrc || image.src;
      const cached = thumbnailFitCache.get(source);
      if (cached) return applyFit(cached);
      if (!image.naturalWidth || !image.naturalHeight) return;
      try {
        const sampleEdge = 96;
        const ratio = sampleEdge / Math.max(image.naturalWidth, image.naturalHeight);
        const width = Math.max(1, Math.round(image.naturalWidth * ratio));
        const height = Math.max(1, Math.round(image.naturalHeight * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0, width, height);
        const pixels = context.getImageData(0, 0, width, height).data;
        let minX = width;
        let minY = height;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            if (pixels[(y * width + x) * 4 + 3] < 18) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
        if (maxX < minX || maxY < minY) return;
        const edge = Math.max(width, height);
        const visibleWidth = (maxX - minX + 1) / edge;
        const visibleHeight = (maxY - minY + 1) / edge;
        const centerX = ((minX + maxX + 1) / 2 - width / 2) / edge;
        const centerY = ((minY + maxY + 1) / 2 - height / 2) / edge;
        const scale = clamp(.88 / Math.max(visibleWidth, visibleHeight), .72, 1.55);
        const fit = {
          scale: Math.round(scale * 1000) / 1000,
          x: Math.round(-centerX * scale * 1000) / 10,
          y: Math.round(-centerY * scale * 1000) / 10
        };
        thumbnailFitCache.set(source, fit);
        applyFit(fit);
      } catch (_) {
        applyFit({ x: 0, y: 0, scale: 1 });
      }
    };
    if (image.complete && image.naturalWidth) analyze();
    else image.addEventListener('load', analyze, { once: true });
  }

  function uiIconMarkup(name, className = 'ui-inline-icon') {
    return `<img class="${className}" src="${UI_ASSET_ROOT}${name}.webp" alt="" aria-hidden="true" draggable="false" decoding="async">`;
  }

  function normalizeEditorFood(value) {
    if (!value || typeof value !== 'object') return null;
    const id = String(value.id || '').trim();
    const name = String(value.name || '').trim();
    if (!/^[a-z][A-Za-z0-9_-]{0,47}$/.test(id) || !name) return null;
    const clampNumber = (number, min, max) => Math.max(min, Math.min(max, Number(number) || 0));
    const rarity = foodRarities.has(value.rarity) ? value.rarity : 'common';
    const category = foodCategories.has(value.category) ? value.category : 'mass';
    const image = String(value.image || '').trim();
    const hasArtTransform = ['artX', 'artY', 'artScale'].some(key => Object.hasOwn(value, key));
    return {
      id,
      name,
      icon: String(value.icon || '🍓').slice(0, 8),
      rarity,
      category,
      minConveyor: Math.round(clampNumber(value.minConveyor || 1, 1, 5)),
      mass: clampNumber(value.mass, 0, 999),
      power: clampNumber(value.power, 0, 99),
      defense: clampNumber(value.defense, 0, 9.99),
      elasticity: clampNumber(value.elasticity, 0, 9.99),
      ability: clampNumber(value.ability, 0, 999),
      coinMultiplier: clampNumber(value.coinMultiplier, 0, 99),
      effect: String(value.effect || '').trim(),
      effectText: String(value.effectText || '').trim(),
      ...(Array.isArray(value.worlds) ? { worlds: value.worlds.map(Number).filter(worldId => worldId >= 1 && worldId <= 4) } : {}),
      ...(image ? { image } : {}),
      ...(hasArtTransform ? {
        artX: clampNumber(value.artX, -30, 30),
        artY: clampNumber(value.artY, -30, 30),
        artScale: clampNumber(value.artScale || 1, .55, 1.6)
      } : {})
    };
  }

  function loadFoodCatalog() {
    const baseCatalog = Array.isArray(window.SLIME_FOOD_CATALOG) ? window.SLIME_FOOD_CATALOG : [];
    try {
      const savedCatalog = JSON.parse(localStorage.getItem(FOOD_EDITOR_STORAGE_KEY) || 'null');
      if (!Array.isArray(savedCatalog) || !savedCatalog.length) return baseCatalog;
      const ids = new Set();
      const catalog = savedCatalog
        .map(normalizeEditorFood)
        .filter(food => food && !ids.has(food.id) && ids.add(food.id));
      return catalog.length ? catalog : baseCatalog;
    } catch (_) {
      return baseCatalog;
    }
  }

  window.SlimeGameAssets = Object.freeze({
    FOODS: loadFoodCatalog(),
    WORLD_SPRITES: worldSprites,
    CRACK_STAGE_SPRITES: crackStageSprites,
    VFX_SPRITES: vfxSprites,
    versionedAsset,
    ensureWorldSprites,
    editorSprite,
    foodImageSource,
    foodArtMarkup,
    centerFoodThumbnail,
    uiIconMarkup,
    normalizeEditorFood,
    loadFoodCatalog
  });
})();
