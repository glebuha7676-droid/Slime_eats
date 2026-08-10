(() => {
  'use strict';
  const extraStyles = document.createElement('link'); extraStyles.rel = 'stylesheet'; extraStyles.href = 'world-editor-extra.css?v=1'; document.head.append(extraStyles);
  const positionStyles = document.createElement('style'); positionStyles.textContent = '.game-tile img{transform:translate(var(--x),var(--y)) scale(var(--s));transform-origin:center}.ore-pool{display:flex;flex-wrap:wrap;gap:6px;border:2px solid #8793aa;border-radius:10px;padding:8px}.ore-pool legend{font-size:11px;font-weight:1000;color:#35425d}.ore-pool label{display:flex;align-items:center;gap:3px;font-size:10px}.ore-pool input{width:auto}.add-block-button,.delete-block{border:2px solid #35425d;border-radius:10px;padding:7px 9px;font-size:10px;font-weight:1000}.add-block-button{background:#b6f0df}.delete-block{background:#ffbec0;color:#6d2730}.preview-toggle{display:flex!important;align-items:center;gap:7px}.preview-toggle input{width:auto!important}'; document.head.append(positionStyles);
  const textureResetStyles = document.createElement('style'); textureResetStyles.textContent = '.reset-block-image{grid-column:1/-1;border:2px solid #35425d;border-radius:10px;padding:8px;background:#ffe2b7;color:#653e13;font-size:10px;font-weight:1000}.reset-block-image:disabled{opacity:.5;cursor:not-allowed}'; document.head.append(textureResetStyles);
  const api=window.SlimeWorldCatalog, $=id=>document.getElementById(id); let data=api.load(), wi=0,li=0,bid='';
  const e={wl:$('worldList'),lt:$('levelTabs'),depth:$('levelDepth'),sp:$('spawnList'),top:$('bgTop'),bottom:$('bgBottom'),accent:$('worldAccent'),image:$('bgImage'),x:$('bgX'),y:$('bgY'),scale:$('bgScale'),xv:$('bgXValue'),yv:$('bgYValue'),sv:$('bgScaleValue'),preview:$('backgroundPreview'),bl:$('blockList'),bc:$('blockControls'),bt:$('blockTitle'),title:$('blocksTitle'),name:$('worldName')};
  const localSource=source=>/^(?:data:|https?:|blob:)/i.test(source)?source:`../../${source.replace(/^\.\//,'')}`;
  const world=()=>data.worlds[wi], level=()=>world().levels[li], selected=()=>world().blocks.find(b=>b.id===bid), image=(w,b)=>localSource(b.image||api.assetSource(w.id,b.type==='ore'&&b.oreVariant&&b.oreVariant!=='random'?`ore-${b.oreVariant}`:b.sprite));
  function blockControls(){const b=selected();if(!b){e.bt.textContent='Настройка блока';e.bc.className='block-controls empty';e.bc.textContent='Выбери блок выше.';return}e.bt.textContent=b.label;e.bc.className='block-controls';e.bc.innerHTML=`<label>Название<input data-field="label" maxlength="32" value="${b.label}"></label><label>Прочность ×<input data-field="hp" type="number" min="0.1" max="5" step=".05" value="${b.hp}"></label><label class="wide">Картинка блока<input data-image type="file" accept="image/png,image/jpeg,image/webp"></label><img class="block-preview" src="${image(world(),b)}"><div><div class="range-row"><label>X<input data-range="x" type="range" min="-45" max="45" value="${b.x||0}"></label><output>${b.x||0}%</output></div><div class="range-row"><label>Y<input data-range="y" type="range" min="-45" max="45" value="${b.y||0}"></label><output>${b.y||0}%</output></div><div class="range-row"><label>Масштаб<input data-range="scale" type="range" min="55" max="155" value="${Math.round((b.scale||1)*100)}"></label><output>${Math.round((b.scale||1)*100)}%</output></div></div>${b.type==='bomb'?'<label class="wide">Радиус взрыва<input data-field="explosionRadius" type="number" min="40" max="260" value="'+(b.explosionRadius||125)+'"></label>':''}${(b.type==='spring'||b.type==='blizzard')?'<label class="wide">Сила отталкивания<input data-field="push" type="number" min=".4" max="2.5" step=".05" value="'+(b.push||1)+'"></label>':''}`}
  function render(){const w=world(),l=level(),bg=w.background;e.wl.innerHTML=data.worlds.map((x,i)=>`<button class="world-choice ${i===wi?'active':''}" data-world="${i}">${i+1}. ${x.name}</button>`).join('');e.lt.innerHTML=w.levels.map((_,i)=>`<button class="level-tab ${i===li?'active':''}" data-level="${i}">${i+1}</button>`).join('');e.depth.value=l.depth;e.name.value=w.name;e.title.textContent='Все блоки: '+w.name;e.top.value=bg.top;e.bottom.value=bg.bottom;e.accent.value=w.accent;e.x.value=bg.x;e.y.value=bg.y;e.scale.value=Math.round(bg.scale*100);e.xv.textContent=bg.x+'%';e.yv.textContent=bg.y+'%';e.sv.textContent=Math.round(bg.scale*100)+'%';e.preview.style.background=`${bg.image?`url(${bg.image}) ${50+bg.x}% ${50+bg.y}%/${bg.scale*100}% auto no-repeat,`:''}linear-gradient(${bg.top},${bg.bottom})`;e.sp.innerHTML=w.blocks.map(b=>`<div class="spawn-row"><label><input type="checkbox" data-enabled="${b.id}" ${l.enabled.includes(b.id)?'checked':''}>${b.label}</label><input type="number" data-weight="${b.id}" min="0" max="100" value="${l.weights[b.id]||0}"></div>`).join('');e.bl.innerHTML=w.blocks.map(b=>`<button class="block-choice ${b.id===bid?'active':''}" data-block="${b.id}"><img class="block-thumb" src="${image(w,b)}"><span>${b.label}</span></button>`).join('');blockControls()}
  function readImage(file,done){if(!file||file.size>1100000)return;const r=new FileReader;r.onload=()=>done(String(r.result));r.readAsDataURL(file)}
  function exportWorlds(){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='slime-worlds-publish.json';link.click();URL.revokeObjectURL(url);const button=$('exportWorlds');button.textContent='ФАЙЛ СКАЧАН ✓';setTimeout(()=>button.textContent='ЭКСПОРТ ДЛЯ ПУБЛИКАЦИИ',1600)}
  function importWorlds(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;if(file.size>25000000){alert('Файл больше 25 МБ. Уменьши изображения и попробуй снова.');return}const reader=new FileReader();reader.onload=()=>{try{data=api.fromExport(JSON.parse(String(reader.result)));api.save(data);data=api.load();wi=0;li=0;bid='';render();const button=$('saveWorlds');button.textContent='ИМПОРТИРОВАНО ✓';setTimeout(()=>button.textContent='СОХРАНИТЬ В ЭТОМ БРАУЗЕРЕ',1600)}catch{alert('Не удалось прочитать каталог миров. Проверь JSON-файл.')}};reader.readAsText(file)}
  document.addEventListener('click',ev=>{const a=ev.target.closest('[data-world]'),l=ev.target.closest('[data-level]'),b=ev.target.closest('[data-block]');if(a){wi=+a.dataset.world;li=0;bid='';render()}if(l){li=+l.dataset.level;render()}if(b){bid=b.dataset.block;render()}});
  document.addEventListener('input',ev=>{const t=ev.target,w=world(),l=level(),b=selected();if(t===e.depth)l.depth=+t.value;if(t===e.name)w.name=t.value;if(t===e.top)w.background.top=t.value;if(t===e.bottom)w.background.bottom=t.value;if(t===e.accent)w.accent=t.value;if(t===e.x||t===e.y||t===e.scale)w.background[t===e.x?'x':t===e.y?'y':'scale']=t===e.scale?+t.value/100:+t.value;if(t.dataset.enabled)l.enabled=t.checked?[...new Set([...l.enabled,t.dataset.enabled])]:l.enabled.filter(x=>x!==t.dataset.enabled);if(t.dataset.weight)l.weights[t.dataset.weight]=Math.max(0,+t.value||0);if(b&&t.dataset.field)b[t.dataset.field]=t.type==='number'?+t.value:t.value;if(b&&t.dataset.range){b[t.dataset.range]=t.dataset.range==='scale'?+t.value/100:+t.value;t.closest('.range-row').querySelector('output').textContent=t.value+'%'}if([e.top,e.bottom,e.x,e.y,e.scale].includes(t))render()});
  document.addEventListener('change',ev=>{if(ev.target===e.image)readImage(ev.target.files[0],v=>{world().background.image=v;render()});if(ev.target.matches('[data-image]'))readImage(ev.target.files[0],v=>{selected().image=v;render()})});
  $('saveWorlds').onclick=()=>{api.save(data);data=api.load();$('saveWorlds').textContent='СОХРАНЕНО ЛОКАЛЬНО ✓';setTimeout(()=>$('saveWorlds').textContent='СОХРАНИТЬ В ЭТОМ БРАУЗЕРЕ',1200)};$('exportWorlds').onclick=exportWorlds;$('importWorlds').onchange=importWorlds;$('resetWorlds').onclick=()=>{if(confirm('Сбросить все локальные изменения и вернуться к опубликованным мирам?')){localStorage.removeItem(api.STORAGE_KEY);localStorage.removeItem(api.STORAGE_KEY+'_custom');data=api.defaults();wi=li=0;bid='';render()}};render();
  // Превью специально использует те же координаты, что и игровая плитка:
  // в нём сразу видно, не вылезает ли картинка за границы блока.
  const livePreview = document.createElement('div');
  livePreview.id = 'worldPreview'; livePreview.className = 'world-preview';
  e.preview.after(livePreview);
  function paintWorldPreview() {
    const w = world(), enabled = new Set(level().enabled);
    livePreview.style.background = e.preview.style.background;
    livePreview.innerHTML = w.blocks.filter(b => enabled.has(b.id)).slice(0, 12).map(b => `<div class="preview-tile"><img src="${image(w,b)}" style="--x:${b.x||0}%;--y:${b.y||0}%;--s:${b.scale||1}"><span>${b.label}</span></div>`).join('') || '<p>В этом уровне нет включённых блоков.</p>';
  }
  function enhanceBlockPreview() {
    const b = selected(), picture = e.bc.querySelector('.block-preview');
    if (!b || !picture) return;
    if (!picture.parentElement.classList.contains('block-frame')) {
      const frame = document.createElement('div'); frame.className = 'block-frame';
      picture.replaceWith(frame); frame.append(picture);
    }
    picture.style.objectFit = 'contain';
    picture.style.transform = `translate(${b.x || 0}%, ${b.y || 0}%) scale(${b.scale || 1})`;
    if (b.type === 'gel' && !e.bc.querySelector('[data-field="healAmount"]')) e.bc.insertAdjacentHTML('beforeend', `<label class="wide">Восстанавливает массы<input data-field="healAmount" type="number" min="1" max="100" value="${b.healAmount || 16}"></label>`);
  }
  const renderEditorBase = render;
  render = function () { renderEditorBase(); enhanceBlockPreview(); paintWorldPreview(); };
  document.addEventListener('input', event => { if (event.target.dataset.field || event.target.dataset.range || event.target.dataset.enabled || event.target.dataset.weight) { enhanceBlockPreview(); paintWorldPreview(); } });
  const gamePreviewButton = document.createElement('button');
  gamePreviewButton.className = 'game-preview-button'; gamePreviewButton.textContent = 'ПОСМОТРЕТЬ СТЫКОВКУ БЛОКОВ';
  document.querySelector('.world-toolbar').append(gamePreviewButton);
  const addBlockButton = document.createElement('button');
  addBlockButton.className = 'add-block-button'; addBlockButton.textContent = '+ ДОБАВИТЬ БЛОК'; e.title.parentElement.append(addBlockButton);
  addBlockButton.onclick = () => { const w = world(), sprite = w.id === 2 ? 'snow-packed' : w.id === 3 ? 'cookie-packed' : 'stone'; const block = { id:`custom_${Date.now().toString(36)}`, label:'Новый блок', type:'custom', spawnType:'dense', sprite, hp:1, x:0, y:0, scale:1, previewEnabled:true }; w.blocks.push(block); level().enabled.push(block.id); bid=block.id; render(); };
  const modal = document.createElement('div'); modal.className = 'game-preview-modal';
  document.body.append(modal);
  function showGamePreview() {
    const w = world(), enabledAcrossWorld = new Set(w.levels.flatMap(item => item.enabled));
    const basePool = w.blocks.filter(block => enabledAcrossWorld.has(block.id) && block.previewEnabled !== false);
    const oreVariants = ['coal','iron','gold','diamond'];
    const pool = basePool.flatMap(block => block.type === 'ore' && block.oreVariant === 'random' ? oreVariants.filter(oreVariant => block.oreEnabled?.includes(oreVariant)).map(oreVariant => ({ ...block, oreVariant })) : [block]);
    const soft = pool.filter(block => block.id === 'soft');
    const dense = pool.filter(block => block.id === 'dense');
    const hard = pool.filter(block => block.id === 'hard');
    const reinforced = pool.filter(block => block.id === 'reinforced');
    const extras = pool.filter(block => !['soft','dense','hard','reinforced'].includes(block.id));
    const pick = list => list[Math.floor(Math.random() * list.length)] || null;
    const mainRock = () => Math.random() < .56 ? pick(dense) || pick(hard) : pick(hard) || pick(dense);
    const belowLayers = () => {
      const roll = Math.random();
      if (roll < .76) return mainRock();          // основная масса шахты
      if (roll < .87) return pick(reinforced) || mainRock();
      return pick(extras) || mainRock();          // редкие вкрапления — не каша из них
    };
    const tiles = Array.from({ length: 48 }, (_, index) => {
      const row = Math.floor(index / 6);
      // Сначала три понятных слоя прочности, затем плотная порода с редкими событиями.
      const block = row === 0 ? pick(soft) || pick(dense) : row === 1 ? pick(dense) || pick(soft) : row === 2 ? pick(hard) || pick(dense) : belowLayers();
      return block ? `<div class="game-tile"><img src="${image(w,block)}" style="--x:${block.x||0}%;--y:${block.y||0}%;--s:${block.scale||1}"><b>${Math.max(1, Math.round(4 + Math.random() * 26))}</b></div>` : '';
    }).join('');
    modal.innerHTML = `<section class="game-preview-panel" style="--preview-bg:${e.preview.style.background}"><header><div><small>ПРЕВЬЮ В ИГРЕ</small><h2>${w.name} · уровень ${li + 1}</h2></div><button data-close-preview>×</button></header><div class="game-grid">${tiles}</div><footer><span>6 × 8 блоков · реальные границы и стыковка</span><button data-reroll-preview>ДРУГАЯ РАСКЛАДКА</button></footer></section>`;
    modal.classList.add('show');
  }
  gamePreviewButton.onclick = showGamePreview;
  modal.addEventListener('click', event => { if (event.target === modal || event.target.closest('[data-close-preview]')) modal.classList.remove('show'); if (event.target.closest('[data-reroll-preview]')) showGamePreview(); });
  const enhanceBlockBase = enhanceBlockPreview;
  enhanceBlockPreview = function () { enhanceBlockBase(); const b = selected(); if (!b) return; if (!e.bc.querySelector('[data-preview-toggle]')) e.bc.insertAdjacentHTML('beforeend', `<label class="wide preview-toggle"><input data-preview-toggle type="checkbox" ${b.previewEnabled !== false ? 'checked' : ''}> Показывать в окне стыковки</label>`); if (b.type === 'custom' && !e.bc.querySelector('[data-delete-block]')) e.bc.insertAdjacentHTML('beforeend', '<label class="wide">Поведение в шахте<select data-field="spawnType"><option value="dense">Непрочный</option><option value="hard">Обычный</option><option value="reinforced">Прочный</option><option value="ore">Рудный</option><option value="special">Особый</option></select></label><button class="delete-block wide" data-delete-block>УДАЛИТЬ ДОБАВЛЕННЫЙ БЛОК</button>'); if (b?.type === 'ore' && !e.bc.querySelector('[data-field="oreVariant"]')) e.bc.insertAdjacentHTML('beforeend', `<label class="wide">Вариант руды<select data-field="oreVariant"><option value="random">Случайная руда</option><option value="coal">Уголь</option><option value="iron">Железо</option><option value="gold">Золото</option><option value="diamond">Алмаз</option></select></label><fieldset class="ore-pool wide"><legend>Руды в пуле игры и превью</legend>${['coal','iron','gold','diamond'].map(id=>`<label><input type="checkbox" data-ore="${id}" ${(b.oreEnabled||[]).includes(id)?'checked':''}>${id}</label>`).join('')}</fieldset>`); const select = e.bc.querySelector('[data-field="oreVariant"]'); if (select) select.value = b.oreVariant || 'random'; const spawn = e.bc.querySelector('[data-field="spawnType"]'); if (spawn) spawn.value = b.spawnType || 'dense'; };
  document.addEventListener('change', event => { if (event.target.dataset.previewToggle) { selected().previewEnabled = event.target.checked; paintWorldPreview(); } if (event.target.dataset.field === 'oreVariant') { selected().oreVariant = event.target.value; render(); } if (event.target.dataset.field === 'spawnType') { selected().spawnType = event.target.value; } if (event.target.dataset.ore) { const b = selected(), id = event.target.dataset.ore; b.oreEnabled = event.target.checked ? [...new Set([...(b.oreEnabled||[]),id])] : (b.oreEnabled||[]).filter(item=>item!==id); paintWorldPreview(); } });
  document.addEventListener('click', event => { if (!event.target.closest('[data-delete-block]')) return; const id = selected()?.id; world().blocks = world().blocks.filter(block => block.id !== id); world().levels.forEach(item => item.enabled = item.enabled.filter(blockId => blockId !== id)); bid=''; render(); });
  // A texture uploaded by mistake is stored with the block and otherwise keeps
  // overriding its normal game sprite. Let the editor clear just that image.
  const enhanceBlockWithTextureReset = enhanceBlockPreview;
  enhanceBlockPreview = function () {
    enhanceBlockWithTextureReset();
    const block = selected();
    if (!block || e.bc.querySelector('[data-reset-block-image]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'reset-block-image wide';
    button.dataset.resetBlockImage = 'true';
    button.textContent = 'СБРОСИТЬ ЗАГРУЖЕННУЮ КАРТИНКУ';
    button.disabled = !block.image;
    e.bc.append(button);
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-reset-block-image]');
    if (!button) return;
    const block = selected();
    if (!block?.image) return;
    block.image = '';
    block.x = 0;
    block.y = 0;
    block.scale = 1;
    render();
  });
  const oreTextureStyles = document.createElement('style');
  oreTextureStyles.textContent = '.ore-texture-editor{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ore-texture-card{border:2px solid #8793aa;border-radius:12px;padding:9px;background:#f8fbff;display:grid;gap:7px}.ore-texture-card h4{margin:0;color:#35425d}.ore-texture-preview{width:100%;aspect-ratio:1;object-fit:contain;border-radius:8px;background:#dfe8f4}.ore-texture-card .range-row{grid-template-columns:1fr auto}.ore-texture-reset{border:1px solid #9c5360;border-radius:8px;background:#ffd7dc;color:#6d2730;font-weight:900;padding:6px}.ore-texture-reset:disabled{opacity:.45}@media(max-width:760px){.ore-texture-editor{grid-template-columns:1fr}}';
  document.head.append(oreTextureStyles);
  const oreLabels = { coal:'Уголь', iron:'Железо', gold:'Золото', diamond:'Алмаз' };
  const oreIds = Object.keys(oreLabels);
  const oreTexture = (block, id) => {
    block.oreTextures ||= {};
    block.oreTextures[id] ||= { image:'', x:0, y:0, scale:1 };
    return block.oreTextures[id];
  };
  const oreTextureSource = (w, block, id) => {
    const texture = oreTexture(block, id);
    return localSource(texture.image || api.assetSource(w.id, `ore-${id}`));
  };
  const enhanceWithOreTextures = enhanceBlockPreview;
  enhanceBlockPreview = function () {
    enhanceWithOreTextures();
    const block = selected();
    if (block?.type !== 'ore' || e.bc.querySelector('.ore-texture-editor')) return;
    e.bc.querySelector('[data-field="oreVariant"]')?.closest('label')?.remove();
    e.bc.querySelector('.ore-pool')?.remove();
    const section = document.createElement('section');
    section.className = 'ore-texture-editor';
    section.innerHTML = oreIds.map(id => {
      const texture = oreTexture(block, id);
      return `<article class="ore-texture-card" data-ore-card="${id}"><h4>${oreLabels[id]}</h4><img class="ore-texture-preview" src="${oreTextureSource(world(), block, id)}" style="transform:translate(${texture.x}%,${texture.y}%) scale(${texture.scale})"><label>Своя текстура<input type="file" data-ore-image="${id}" accept="image/png,image/jpeg,image/webp"></label><div class="range-row"><label>X<input type="range" min="-45" max="45" value="${texture.x}" data-ore-range="x" data-ore-id="${id}"></label><output>${texture.x}%</output></div><div class="range-row"><label>Y<input type="range" min="-45" max="45" value="${texture.y}" data-ore-range="y" data-ore-id="${id}"></label><output>${texture.y}%</output></div><div class="range-row"><label>Масштаб<input type="range" min="55" max="155" value="${Math.round(texture.scale * 100)}" data-ore-range="scale" data-ore-id="${id}"></label><output>${Math.round(texture.scale * 100)}%</output></div><button type="button" class="ore-texture-reset" data-reset-ore="${id}" ${texture.image ? '' : 'disabled'}>СБРОСИТЬ ТЕКСТУРУ</button></article>`;
    }).join('');
    e.bc.append(section);
  };
  document.addEventListener('change', event => {
    const id = event.target.dataset.oreImage;
    if (!id || selected()?.type !== 'ore') return;
    readImage(event.target.files[0], value => {
      oreTexture(selected(), id).image = value;
      render();
    });
  });
  document.addEventListener('input', event => {
    const field = event.target.dataset.oreRange;
    const id = event.target.dataset.oreId;
    if (!field || !id || selected()?.type !== 'ore') return;
    const texture = oreTexture(selected(), id);
    texture[field] = field === 'scale' ? +event.target.value / 100 : +event.target.value;
    const card = event.target.closest('[data-ore-card]');
    event.target.closest('.range-row').querySelector('output').textContent = event.target.value + '%';
    card.querySelector('img').style.transform = `translate(${texture.x}%,${texture.y}%) scale(${texture.scale})`;
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-reset-ore]');
    if (!button || selected()?.type !== 'ore') return;
    selected().oreTextures[button.dataset.resetOre] = { image:'', x:0, y:0, scale:1 };
    render();
  });
  render();
})();
