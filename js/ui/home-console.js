/* Approved illustrated home console. Gameplay/save changes stay in game.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const illustratedShell = document.body.classList.contains('home-shell-empty');
  const emptyShell = illustratedShell && !document.body.classList.contains('home-shell-live');
  let state, frame = 0, pickerOpen = false, layoutKey, foodLight;
  const roman = n => ['I', 'II', 'III'][Math.max(0, Math.min(2, n - 1))];
  document.body.classList.add('home-console');
  function schedule() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; layout(); }); }
  function place(element, x, y, width, height) {
    if (!element?.offsetParent) return;
    const app = $('app').getBoundingClientRect(), parent = element.offsetParent.getBoundingClientRect();
    for (const [key, value] of Object.entries({left: app.left + x - parent.left, top: app.top + y - parent.top, width, height})) {
      const pixels = `${value}px`;
      if (element.style.getPropertyValue(key) !== pixels) element.style.setProperty(key, pixels, 'important');
    }
  }
  function fitFood() {
    const tray = $('foodChoices');
    const trayWidth = tray.clientWidth;
    const trayHeight = tray.clientHeight;
    for (const button of document.querySelectorAll('#foodChoices .conveyor-food-pick')) {
      button.disabled = !!state.busy;
      const image = button.querySelector('.food-model');
      const bounds = window.SlimeFoodGroundBounds?.[button.dataset.foodId];
      if (!image || !bounds) continue;
      const [width, height, left, top, right, bottom] = bounds;
      const scale = Math.min(trayWidth / (right - left), trayHeight / (bottom - top));
      for (const [key, value] of Object.entries({width: width * scale, height: height * scale,
        left: trayWidth / 2 - (left + right) / 2 * scale, top: trayHeight - bottom * scale})) {
        const property = `--console-food-${key}`;
        const pixels = `${value}px`;
        if (image.style.getPropertyValue(property) !== pixels) image.style.setProperty(property, pixels);
      }
    }
  }
  function prepareFoodDrag(ghost, source) {
    const rect = source.getBoundingClientRect(), original = source.querySelector('.food-model'), image = ghost.querySelector('.food-drag-model');
    ghost.classList.add('console-food-drag');
    ghost.style.setProperty('width', `${rect.width}px`, 'important');
    ghost.style.setProperty('height', `${rect.height}px`, 'important');
    if (original && image) for (const name of ['width','height','left','top']) image.style.setProperty(`--console-food-${name}`, original.style.getPropertyValue(`--console-food-${name}`));
  }
  function fitMenuIcons(size) {
    const group = document.querySelector('.mutation-trio-icon');
    const write = (element, values) => {
      for (const [key, value] of Object.entries(values)) element.style.setProperty(key, typeof value === 'number' ? `${value}px` : value, 'important');
    };
    // Override the legacy 34px images/offsets. Positions refer to the painted
    // icons, not the differently padded square files.
    write(group, {left:0,top:0,width:size,height:size,transform:'none'});
    const fit = (image, bounds, cx, cy, width, height) => {
      const [sw,sh,left,top,right,bottom] = bounds;
      const scale = Math.min(size * width / (right-left), size * height / (bottom-top));
      write(image, {position:'absolute',left:size*cx-(left+right)*scale/2,top:size*cy-(top+bottom)*scale/2,
        width:sw*scale,height:sh*scale,'max-width':'none','max-height':'none',transform:'none','object-fit':'fill'});
    };
    fit(group.querySelector('.mutation-trio-fire'), [640,640,30,27,608,596], .38,.35,.40,.40);
    fit(group.querySelector('.mutation-trio-frost'), [640,640,30,27,609,596], .62,.35,.40,.40);
    fit(group.querySelector('.mutation-trio-electric'), [640,640,30,26,608,596], .50,.55,.40,.40);
    fit($('wardrobeBtn').querySelector('img'), [256,256,14,22,246,218], .50,.45,.64,.60);
  }
  function prepareFoodLight() {
    const light = window.SlimeLabLight;
    if (light && !foodLight) {
      foodLight = { rays: light.beamTexture(.34, .91, .05), halo: light.lightTexture() };
    }
  }

  async function flashFood(replace = () => {}, onBeam) {
    const fx = $('homeSynthesisFx');
    const light = window.SlimeLabLight;
    if (emptyShell || !fx || !light || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      replace();
      return;
    }
    layout();
    const context = fx.getContext('2d');
    const { width, height } = fx.getBoundingClientRect();
    if (!context || !width || !height) {
      replace();
      return;
    }
    prepareFoodLight();
    const { smooth, beam } = light;
    const { rays, halo } = foodLight;
    const density = Math.min(devicePixelRatio || 1, 1.5);
    fx.width = Math.ceil(width * density);
    fx.height = Math.ceil(height * density);
    context.setTransform(density, 0, 0, density, 0, 0);
    const center = width * .5;
    const focus = height * .53;
    const peak = .305;
    const duration = .76;

    function glow(x, y, radiusX, radiusY, opacity) {
      if (opacity < .005) return;
      context.globalAlpha = opacity;
      context.drawImage(halo, x - radiusX, y - radiusY, radiusX * 2, radiusY * 2);
    }

    await new Promise((resolve, reject) => {
      let started;
      let nextPaint = 0;
      let swapped = false;
      function swap() {
        try {
          replace();
          return true;
        } catch (error) {
          context.clearRect(0, 0, width, height);
          reject(error);
          return false;
        }
      }
      function frameAt(now) {
        started ??= now;
        const t = (now - started) / 1000;
        if (t < duration && now + 1 < nextPaint) {
          requestAnimationFrame(frameAt);
          return;
        }
        nextPaint = Math.max(now, nextPaint) + 1000 / 60;
        context.clearRect(0, 0, width, height);
        if (t >= duration || document.body.dataset.screen !== 'home') {
          if (!swapped && !swap()) return;
          resolve();
          return;
        }
        const surge = 1 - smooth(peak, .48, t);
        const burst = smooth(.192, peak, t) * (1 - smooth(peak + .055, .48, t));
        const ripple = smooth(peak, .70, t);
        for (const direction of [-1, 1]) {
          const x = center + direction * width * .45;
          for (const socket of [.27, .53]) {
            const y = height * socket;
            const offset = socket > .5 ? .042 : 0;
            const charge = smooth(.01 + offset, .17 + offset, t) * surge;
            const targetX = center - direction * width * .10;
            if (charge > .005) {
              if (onBeam) {
                onBeam();
                onBeam = undefined;
              }
              beam(context, rays, x, y, targetX, focus, height * .41, charge * .68);
              glow(x, y, width * .074, height * .16, charge * .90);
            }
            const travel = smooth(.045 + offset, peak, t);
            const packet = charge * Math.sin(Math.PI * travel);
            glow(x + (targetX - x) * travel, y + (focus - y) * travel,
              width * .082, height * .075, packet);
          }
        }
        glow(center, focus, width * (.42 + ripple * .15), height * (.45 + ripple * .17), burst);
        glow(center, focus, width * .31, height * .38, burst * .94);
        glow(center, height * .89, width * .40, height * .14, Math.max(smooth(.08, .2, t) * surge * .45, burst * .9));
        if (ripple > 0 && ripple < 1) {
          context.globalAlpha = (1 - ripple) * .68;
          context.strokeStyle = '#b9faff';
          context.lineWidth = 1.25;
          context.beginPath();
          context.ellipse(center, height * .88, width * (.09 + ripple * .31), height * (.028 + ripple * .055), 0, 0, Math.PI * 2);
          context.stroke();
        }
        const scatter = smooth(.21, peak + .02, t) * (1 - smooth(.42, duration, t));
        if (scatter > .005) {
          for (let i = 0; i < 22; i++) {
            const angle = i * 2.39996 + .4;
            const distance = .075 + ripple * (.19 + (i % 4) * .053);
            const radius = 1.45 + i % 4 * .58;
            glow(center + Math.cos(angle) * width * distance, focus + Math.sin(angle) * height * distance,
              radius * (1.4 - ripple * .35), radius, scatter * (.45 + (i % 3) * .24));
          }
        }
        context.globalAlpha = 1;
        if (!swapped && t >= peak) {
          swapped = true;
          if (!swap()) return;
        }
        requestAnimationFrame(frameAt);
      }
      requestAnimationFrame(frameAt);
    });
  }
  function layout() {
    if (!state || document.body.dataset.screen !== 'home') return;
    const app = $('app').getBoundingClientRect(), w = app.width, h = app.height, u = w / 455;
    if (!w || !h) return;
    const geometry = `${app.left}:${app.top}:${w}:${h}:${pickerOpen}`;
    if (geometry === layoutKey) {
      fitFood();
      return;
    }
    layoutKey = geometry;
    if (illustratedShell) {
      // Both masters share one width scale; do not squash the round socket.
      const edge = -2, width = w + 4, scale = width / 1176;
      const topHeight = 600 * scale, bottomHeight = 400 * scale;
      const bottom = h + 4;
      const minPlanetPanel = Math.max(96, Math.min(124, w * .31));
      const start = Math.max(0, Math.min(w * .75, bottom - 677 * scale - minPlanetPanel, bottom - topHeight - bottomHeight - 8));
      const height = bottom - start;
      // Give the planet panel the missing vertical space before shrinking the controls.
      const roomWidth = Math.min(w, start / .75);
      const roomLeft = (w - roomWidth) / 2;
      $('homeRoomBackdrop').style.setProperty('--console-room-width', `${roomWidth}px`);
      place($('homeConsoleBody'), edge, start, width, height);
      place($('homeConsoleTop'), edge, start, width, topHeight);
      place($('homeConsoleMiddle'), edge, start + topHeight, width, height - topHeight - bottomHeight);
      place($('homeConsoleBottom'), edge, bottom - bottomHeight, width, bottomHeight);
      place($('slimeStage'), 0, 0, w, start);
      place($('slime'), roomLeft + roomWidth * .13, roomWidth * .11, roomWidth * .74, roomWidth * .74);
      // Inner opening in laboratory-soft-v2 (907px wide); the ring is already painted.
      place($('launchPortal'), roomLeft + roomWidth * 296 / 907, roomWidth * 192 / 907, roomWidth * 312 / 907, roomWidth * 314 / 907);
      const tool = Math.max(44, roomWidth * .225);
      const toolY = Math.max(50, roomWidth * .225);
      place(document.querySelector('.mutation-lab-button'), w * .018, toolY, tool, tool);
      place($('wardrobeBtn'), w - tool - w * .018, toolY, tool, tool);
      $('homeScreen').style.setProperty('--console-unit', `${u}px`);
      fitMenuIcons(tool);
      if (!emptyShell) {
        const native = (element, x, y, width, height) => place(element, edge + x * scale, start + y * scale, width * scale, height * scale);
        native($('foodChoices'), 100, 92, 310, 234);
        native($('homeSynthesisFx'), 59, 77, 390, 256);
        // Register the face to the opening in the master, not a visual nudge.
        native($('conveyorDispensers'), 544, 99, 192, 192);
        native($('homeMutationInfo'), 788, 44, 317, 300);
        place($('homeMonitorPicker'), edge + 20 * scale, start + 12 * scale, 1136 * scale,
          Math.min(h - start - 12 * scale - 8, Math.max(144, 362 * scale)));
        native($('homeFoodHeading'), 0, 0, 1, 1);
        const playWidth = width * 880 / 1176;
        const playHeight = playWidth * 229 / 960;
        place($('worldStartBtn'), (w - playWidth) / 2, bottom - 126 * scale - playHeight / 2, playWidth, playHeight);
        window.SlimePlanetCarousel?.mount($('homeScreen'));
        const planetsTop = start + 415 * scale;
        place($('homePlanetsPanel'), edge + 64 * scale, planetsTop, 1048 * scale, bottom - 262 * scale - planetsTop);
        window.SlimePlanetCarousel?.layout();
        fitFood();
      }
      return;
    }
    // Only the featureless middle strip stretches; circles and frame corners keep one scale.
    // Bleed the exterior rim beyond the viewport. Every device control uses
    // this same origin/scale, so the art never moves independently of its UI.
    const origin = -7 * u, deviceWidth = 469 * u;
    const start = w * .72 - 8 * u, lower = h - start + 7 * u, middle = lower - 388 * u;
    const device = (element, x, top, width, height) => place(element, origin + x * u, start + top, width * u, height);
    const y = native => native <= 245 ? native * u : native >= 345 ? lower - (488 - native) * u : 245 * u + (native - 245) / 100 * middle;
    $('homeScreen').style.setProperty('--console-unit', `${u}px`);
    $('homeConsoleBody').style.setProperty('--console-unit', `${u}px`);
    $('homeScreen').style.setProperty('--console-world-height', `${y(374) - y(207)}px`);
    place($('homeConsoleBody'), origin, start, deviceWidth, lower);
    device($('homeConsoleTop'), 0, 0, 469, 245 * u);
    device($('homeConsoleMiddle'), 0, 245 * u, 469, middle);
    device($('homeConsoleBottom'), 0, lower - 143 * u, 469, 143 * u);
    place($('slimeStage'), 0, 0, w, start);
    // The avatar occupies only the central part of its particle canvas.
    // Keep the feet on the platform while reducing the painted body.
    place($('slime'), w * .13, w * .07, w * .74, w * .74);
    // Match the open aperture in the 469px room artwork, rather than the old
    // CSS laboratory frame. The physical ring supplies the visible rim.
    place($('launchPortal'), w * 354 / 1024, w * 186 / 1024, w * 318 / 1024, w * 330 / 1024);
    const tool = Math.min(99, w * .225), toolY = Math.max(66, w * .22);
    place(document.querySelector('.mutation-lab-button'), w * .018, toolY, tool, tool);
    place($('wardrobeBtn'), w - tool - w * .018, toolY, tool, tool);
    fitMenuIcons(tool);
    device($('homeFoodHeading'), 25, 23 * u, 148, 24 * u);
    device($('foodChoices'), 36, 75 * u, 134, 82 * u);
    device($('homeSynthesisFx'), 31, 75 * u, 140, 82 * u);
    device($('conveyorDispensers'), 189, 51 * u, 91, 91 * u);
    device($('homeMutationInfo'), 295, 31 * u, 143, 128 * u);
    device($('homeMonitorPicker'), 292, 28 * u, 153, 136 * u);
    device(document.querySelector('.world-terminal-heading'), 159, y(183), 151, 29 * u);
    const worldTop = start + y(207), worldHeight = y(374) - y(207);
    device($('worldCarousel'), 54, y(207), 362, worldHeight);
    device(document.querySelector('.world-terminal-title'), 104.5, y(207) + worldHeight / 2 - 47 * u, 260, 94 * u);
    const arrowWidth = Math.max(44, 48 * u), arrowHeight = Math.max(48, 57 * u);
    place($('worldPrevBtn'), origin + 20 * u, worldTop + worldHeight / 2 - arrowHeight / 2, arrowWidth, arrowHeight);
    place($('worldNextBtn'), origin + deviceWidth - 20 * u - arrowWidth, worldTop + worldHeight / 2 - arrowHeight / 2, arrowWidth, arrowHeight);
    const playWidth = 326 * u, playHeight = playWidth * 229 / 960;
    place($('worldStartBtn'), (w - playWidth) / 2, start + lower - playHeight - 13 * u, playWidth, playHeight);
    device($('abyssModeV2'), 389, y(183), 42, 27 * u);
    fitFood();
  }
  function setPicker(open, restoreFocus = false, audible = false) {
    if (audible && open !== pickerOpen) state.onPickerToggle?.(open);
    pickerOpen = open;
    $('homeMonitorPicker').hidden = !open;
    $('homeMutationInfo').hidden = open;
    $('conveyor').classList.toggle('is-picking-mutation', open);
    $('homeMutationSelector').setAttribute('aria-expanded', String(open));
    layout();
    if (open && illustratedShell && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      $('homeMonitorPicker').animate([{opacity:0,translate:'0 4px'},{opacity:1,translate:'0 0'}], {duration:160,easing:'ease-out'});
    }
    if (open) requestAnimationFrame(() => { if (pickerOpen) $('homeMonitorPicker').querySelector('[aria-pressed="true"]')?.focus(); });
    else if (restoreFocus) $('homeMutationSelector').focus();
  }
  function mount() {
    if ($('homeConsoleArt')) return;
    const art = document.createElement('div');
    art.id = 'homeConsoleArt'; art.setAttribute('aria-hidden', 'true');
    art.innerHTML = '<i id="homeRoomBackdrop"></i><div id="homeConsoleBody"><i id="homeConsoleTop"></i><i id="homeConsoleMiddle"></i><i id="homeConsoleBottom"></i></div>';
    $('app').prepend(art);
    if (emptyShell) {
      // Keep obsolete hit targets out of keyboard, pointer and accessibility trees.
      for (const id of ['conveyor', 'playSetupCard', 'quickMutationPicker']) {
        $(id).inert = true;
        $(id).setAttribute('aria-hidden', 'true');
      }
    }
    $('homeScreen').classList.add('home-console-screen');
    // The enlarged canvas has transparent particle margins. Keep those margins
    // from intercepting touches intended for the device directly beneath it.
    const slimeHit = document.createElement('span');
    slimeHit.className = 'console-slime-hit'; slimeHit.setAttribute('aria-hidden', 'true');
    $('slime').append(slimeHit);
    const heading = document.createElement('div'); heading.id = 'homeFoodHeading'; $('conveyor').append(heading);
    const synthesis = document.createElement('canvas');
    synthesis.id = 'homeSynthesisFx';
    synthesis.setAttribute('aria-hidden', 'true');
    $('conveyor').append(synthesis);
    if (window.requestIdleCallback) requestIdleCallback(prepareFoodLight);
    else setTimeout(prepareFoodLight, 160);
    $('conveyorDispensers').innerHTML = '<button id="homeMutationSelector" type="button" aria-label="Сменить мутацию" aria-controls="homeMonitorPicker" aria-expanded="false"><span class="console-selector-face"><img alt=""></span><span class="console-empty-medal" aria-hidden="true">+</span><b>СМЕНИТЬ</b></button>';
    const info = document.createElement('button');
    info.id = 'homeMutationInfo';
    info.type = 'button';
    info.innerHTML = `<b class="console-mutation-name"></b>
      <span id="homeMutationStage" class="console-stage-row"><img alt=""><span></span></span>
      <span class="lab-progress console-xp" role="progressbar" aria-label="Опыт мутации" aria-valuemin="0">
        <span class="lab-progress-track"><i></i></span><span class="lab-progress-icon" aria-hidden="true"><img src="assets/ui/lab-v3/xp.webp" alt=""></span><b></b>
      </span>
      <span class="console-mutation-action" hidden><span class="console-mutation-action-label"></span></span>`;
    $('conveyor').append(info);
    const picker = document.createElement('section'); picker.id = 'homeMonitorPicker'; picker.hidden = true;
    picker.setAttribute('aria-label', 'Выбор мутации');
    picker.innerHTML = '<div class="console-picker-heading"><b>ВЫБЕРИ МУТАЦИЮ</b><button type="button" aria-label="Закрыть выбор мутации">×</button></div><div class="console-mutation-grid" role="group" aria-label="Мутации"></div>';
    $('conveyor').append(picker);
    picker.querySelector('.console-picker-heading button').addEventListener('click', () => setPicker(false, true, true));
    $('homeMutationSelector').addEventListener('click', () => !state.busy && setPicker(!pickerOpen, false, true));
    document.addEventListener('pointerdown', event => { if (pickerOpen && !picker.contains(event.target) && !$('conveyorDispensers').contains(event.target)) setPicker(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && pickerOpen) { event.preventDefault(); setPicker(false, true, true); } });
    picker.querySelector('.console-mutation-grid').addEventListener('click', event => {
      const button = event.target.closest('[data-home-mutation]'); if (!button || state.busy) return;
      const mutation = state.mutations.find(item => item.id === button.dataset.homeMutation);
      if (mutation?.available) { setPicker(false); state.onSelect(mutation.id); }
      else if (mutation) { setPicker(false); state.onDetails(mutation.id); }
    });
    info.addEventListener('click', () => state.onDetails(state.selected));
    // Pointer feeding is native; make the same food target operable with a keyboard.
    $('foodChoices').addEventListener('keydown', event => {
      const button = event.target.closest('.conveyor-food-pick');
      if (button && ['Enter', ' '].includes(event.key)) { event.preventDefault(); state.onFeed(Number(button.dataset.offerIndex), button); }
    });
    for (const id of ['worldPrevBtn', 'worldNextBtn']) $(id).replaceChildren();
    document.querySelector('.mutation-lab-button>span:not(.mutation-trio-icon)').textContent = 'Мутации';
    $('wardrobeBtn').querySelector('span').textContent = 'Гардероб';
    const observer = new ResizeObserver(schedule); observer.observe($('app'));
    window.addEventListener('resize', schedule);
    document.fonts.ready.then(schedule);
  }
  function render(next) {
    state = next; mount();
    if (emptyShell) { schedule(); return; }
    const mutation = state.mutations.find(item => item.id === state.selected) || state.mutations[0];
    const selector = $('homeMutationSelector'), image = selector.querySelector('img');
    selector.disabled = state.busy;
    const stageBadge = $('homeMutationStage');
    stageBadge.hidden = !state.stage;
    if (state.stage) {
      const stageImage = stageBadge.querySelector('img');
      const stageSource = state.stageBadge;
      if (stageImage.getAttribute('src') !== stageSource) stageImage.src = stageSource;
      stageImage.alt = `${roman(state.stage)} стадия`;
      stageBadge.querySelector('span').textContent = ['Базовая', 'Усиленная', 'Абсолютная'][state.stage - 1];
    }
    selector.querySelector('.console-selector-face').hidden = !state.stage;
    selector.querySelector('.console-empty-medal').hidden = !!state.stage;
    if (mutation && image.getAttribute('src') !== mutation.image) {
      const previous = image.getAttribute('src') ? image.cloneNode() : null;
      image.src = mutation.image;
      if (previous) {
        const face = selector.querySelector('.console-selector-face');
        face.querySelectorAll('.console-emblem-previous').forEach(node => node.remove());
        previous.classList.add('console-emblem-previous'); face.append(previous);
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const duration = reduced ? 70 : 300;
        previous.animate([{opacity:1},{opacity:0}],{duration,fill:'forwards',easing:'ease-out'}).finished.catch(()=>{}).finally(()=>previous.remove());
        image.animate([{opacity:0},{opacity:1}],{duration,fill:'backwards',easing:'ease-out'});
      }
    }
    if (mutation?.emblemStyle) image.setAttribute('style',mutation.emblemStyle);
    else image.removeAttribute('style');
    selector.setAttribute('aria-label', `${state.stage ? mutation.name + '. ' : ''}Сменить мутацию`);
    $('homeFoodHeading').textContent = state.fed ? 'ГОТОВО' : state.stage ? 'СЪЕШЬ' : 'СИНТЕЗ';
    const info = $('homeMutationInfo');
    const task = state.task;
    info.disabled = state.busy;
    const name = state.stage ? mutation.name[0] + mutation.name.slice(1).toLocaleLowerCase('ru') : 'Мутация';
    info.querySelector('.console-mutation-name').textContent = name;
    info.classList.toggle('is-long-name', name.length > 8);
    const ready = !!(state.stage && task?.ready && !task.max);
    info.classList.toggle('is-ready', ready);
    const track = info.querySelector('.console-xp');
    track.hidden = !state.stage || ready;
    if (!track.hidden && task) {
      const current = Math.min(task.current, task.target);
      track.querySelector('i').style.width = `${task.max ? 100 : task.percent}%`;
      track.querySelector('b').textContent = task.max ? 'Максимум' : `${current} / ${task.target}`;
      track.setAttribute('aria-valuemax', String(task.target));
      track.setAttribute('aria-valuenow', String(task.max ? task.target : current));
    }
    const action = info.querySelector('.console-mutation-action');
    action.hidden = !ready && !!state.stage;
    action.querySelector('.console-mutation-action-label').textContent = ready ? 'Развить' : 'В лабораторию';
    const stageLabel = state.stage ? `, ${roman(state.stage)} стадия` : '';
    const xpLabel = !track.hidden && task ? `. Опыт: ${track.querySelector('b').textContent}` : '';
    const actionLabel = ready ? 'Развить в лаборатории' : 'Открыть лабораторию';
    info.setAttribute('aria-label', `${name}${stageLabel}${xpLabel}. ${actionLabel}`);
    const grid = $('homeMonitorPicker').querySelector('.console-mutation-grid');
    if (!state.mutations.some(item => item.reward)) grid.querySelector('[data-home-mutation="infinity"]')?.remove();
    for (const m of state.mutations) {
      let button = grid.querySelector(`[data-home-mutation="${m.id}"]`);
      if (!button) { button = document.createElement('button'); button.type = 'button'; button.dataset.homeMutation = m.id; button.innerHTML = '<img alt=""><span aria-hidden="true">?</span>'; grid.append(button); }
      button.classList.toggle('is-locked', !m.available);
      button.disabled = state.busy;
      button.setAttribute('aria-pressed', String(m.available && m.id === state.selected));
      button.setAttribute('aria-label', m.available ? m.name : 'Открыть мутацию в лаборатории');
      const icon = button.querySelector('img'); if (icon.getAttribute('src') !== m.image) icon.src = m.image;
    }
    schedule();
  }
  window.SlimeHomeConsole = Object.freeze({emptyShell, tutorialSuspended:illustratedShell, render, layout, schedule, fitFood, prepareFoodDrag, flashFood});
})();
