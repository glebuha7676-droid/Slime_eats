/* Approved illustrated home console. Gameplay/save changes stay in game.js. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const illustratedShell = document.body.classList.contains('home-shell-empty');
  const emptyShell = illustratedShell && !document.body.classList.contains('home-shell-live');
  let state, frame = 0, pickerOpen = false;
  const roman = n => ['I', 'II', 'III'][Math.max(0, Math.min(2, n - 1))];
  document.body.classList.add('home-console');
  function schedule() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; layout(); }); }
  function place(element, x, y, width, height) {
    if (!element?.offsetParent) return;
    const app = $('app').getBoundingClientRect(), parent = element.offsetParent.getBoundingClientRect();
    for (const [key, value] of Object.entries({left: app.left + x - parent.left, top: app.top + y - parent.top, width, height})) {
      element.style.setProperty(key, `${value}px`, 'important');
    }
  }
  function fitFood() {
    for (const button of document.querySelectorAll('#foodChoices .conveyor-food-pick')) {
      const image = button.querySelector('.food-model');
      const bounds = window.SlimeFoodGroundBounds?.[button.dataset.foodId];
      if (!image || !bounds) continue;
      const [width, height, left, top, right, bottom] = bounds;
      button.disabled = !!state.busy;
      const scale = Math.min(button.clientWidth / (right - left), button.clientHeight / (bottom - top));
      for (const [key, value] of Object.entries({width: width * scale, height: height * scale,
        left: button.clientWidth / 2 - (left + right) / 2 * scale, top: button.clientHeight - bottom * scale})) {
        image.style.setProperty(`--console-food-${key}`, `${value}px`);
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
  async function animateFood(phase) {
    if (emptyShell) return;
    layout();
    const content = document.querySelector('#foodChoices .console-food-content');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (phase === 'out' && !content) return;
    const fx = $('homeSynthesisFx');
    let animation;
    if (phase === 'in') {
      if (content) content.style.opacity = '0';
      await Promise.all([...(content?.querySelectorAll('img') || [])].map(image => image.decode().catch(() => {})));
      fx.classList.toggle('is-active', !reduced);
    }
    try {
      if (content?.animate) {
        const frames = phase === 'out'
          ? [{opacity:1,filter:'none',clipPath:'inset(0 0 0 0)'},{opacity:.55,filter:'brightness(1.25) blur(1px)',clipPath:'inset(0 0 48% 0)',offset:.55},{opacity:0,filter:'blur(2px)',clipPath:'inset(0 0 100% 0)'}]
          : [{opacity:0,filter:'brightness(1.35)',clipPath:'inset(100% 0 0 0)'},{opacity:.95,filter:'brightness(1.15)',clipPath:'inset(45% 0 0 0)',offset:.55},{opacity:1,filter:'none',clipPath:'inset(0 0 0 0)'}];
        animation = content.animate(frames, {duration:reduced ? 70 : phase === 'out' ? 260 : 680, delay:phase === 'in' && !reduced ? 80 : 0, easing:phase === 'in' ? 'linear' : 'ease-in',fill:'both'});
        await animation.finished.catch(() => {});
      }
    } finally {
      if (content) content.style.removeProperty('opacity');
      animation?.cancel();
      fx.classList.remove('is-active');
    }
  }
  function layout() {
    if (!state || document.body.dataset.screen !== 'home') return;
    const app = $('app').getBoundingClientRect(), w = app.width, h = app.height, u = w / 455;
    if (!w || !h) return;
    if (illustratedShell) {
      // Both masters share one width scale; do not squash the round socket.
      const edge = -2, width = w + 4, scale = width / 1176;
      const topHeight = 600 * scale, bottomHeight = 400 * scale;
      const start = Math.min(w * .75, h - topHeight - bottomHeight - 24);
      const bottom = h + 4, height = bottom - start;
      place($('homeConsoleBody'), edge, start, width, height);
      place($('homeConsoleTop'), edge, start, width, topHeight);
      place($('homeConsoleMiddle'), edge, start + topHeight, width, height - topHeight - bottomHeight);
      place($('homeConsoleBottom'), edge, bottom - bottomHeight, width, bottomHeight);
      place($('slimeStage'), 0, 0, w, h * .40);
      place($('slime'), w * .13, w * .11, w * .74, w * .74);
      // Inner opening in laboratory-soft-v2 (907px wide); the ring is already painted.
      place($('launchPortal'), w * 296 / 907, w * 192 / 907, w * 312 / 907, w * 314 / 907);
      const tool = w * .225;
      place(document.querySelector('.mutation-lab-button'), w * .018, w * .225, tool, tool);
      place($('wardrobeBtn'), w - tool - w * .018, w * .225, tool, tool);
      $('homeScreen').style.setProperty('--console-unit', `${u}px`);
      fitMenuIcons(tool);
      if (!emptyShell) {
        const native = (element, x, y, width, height) => place(element, edge + x * scale, start + y * scale, width * scale, height * scale);
        native($('foodChoices'), 100, 92, 310, 234);
        native($('homeSynthesisFx'), 80, 70, 350, 260);
        // Register the face to the opening in the master, not a visual nudge.
        native($('conveyorDispensers'), 544, 99, 192, 192);
        native($('homeMutationInfo'), 788, 51, 317, 285);
        place($('homeMonitorPicker'), edge + 20 * scale, start + 12 * scale, 1136 * scale, Math.max(144, 362 * scale));
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
  function setPicker(open, restoreFocus = false) {
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
    const synthesis = document.createElement('div'); synthesis.id = 'homeSynthesisFx'; synthesis.setAttribute('aria-hidden','true');
    synthesis.innerHTML = '<svg class="console-scanner-field" viewBox="0 0 140 82" preserveAspectRatio="none"><defs><linearGradient id="consoleScanLeft"><stop stop-color="#c2ffff" stop-opacity=".48"/><stop offset="1" stop-color="#c2ffff" stop-opacity=".04"/></linearGradient><linearGradient id="consoleScanRight" x1="1" x2="0"><stop stop-color="#c2ffff" stop-opacity=".48"/><stop offset="1" stop-color="#c2ffff" stop-opacity=".04"/></linearGradient></defs><path d="M0 15 L70 0 V82 L0 35 Z" fill="url(#consoleScanLeft)"/><path d="M140 15 L70 0 V82 L140 35 Z" fill="url(#consoleScanRight)"/></svg><i class="console-scanner-flash left"></i><i class="console-scanner-flash right"></i><i class="console-scan-line"></i>';
    $('conveyor').append(synthesis);
    $('conveyorDispensers').innerHTML = '<button id="homeMutationSelector" type="button" aria-label="Сменить мутацию" aria-controls="homeMonitorPicker" aria-expanded="false"><span class="console-selector-face"><img alt=""></span><span class="console-empty-medal" aria-hidden="true">+</span><b>СМЕНИТЬ</b></button><span id="homeMutationStage" class="console-selector-stage"><img alt=""></span>';
    const info = document.createElement('button'); info.id = 'homeMutationInfo'; info.type = 'button';
    info.innerHTML = '<span class="console-mutation-heading"><b class="console-mutation-name"></b><span class="console-stage"></span></span><span class="console-task-kicker"></span><span class="console-task-label"></span><span class="console-task-track" role="progressbar"><i></i></span><b class="console-task-counter"></b><span class="console-evolution-callout" hidden><span class="console-evolution-stage"></span><strong class="console-evolution-title">ГОТОВО<br>К РАЗВИТИЮ</strong><span class="console-evolution-action">РАЗВИТЬ <span aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h15M13 5l7 7-7 7"/></svg></span></span></span>';
    $('conveyor').append(info);
    const picker = document.createElement('section'); picker.id = 'homeMonitorPicker'; picker.hidden = true;
    picker.setAttribute('aria-label', 'Выбор мутации');
    picker.innerHTML = '<div class="console-picker-heading"><b>ВЫБЕРИ МУТАЦИЮ</b><button type="button" aria-label="Закрыть выбор мутации">×</button></div><div class="console-mutation-grid" role="group" aria-label="Мутации"></div>';
    $('conveyor').append(picker);
    picker.querySelector('.console-picker-heading button').addEventListener('click', () => setPicker(false, true));
    $('homeMutationSelector').addEventListener('click', () => !state.busy && setPicker(!pickerOpen));
    document.addEventListener('pointerdown', event => { if (pickerOpen && !picker.contains(event.target) && !$('conveyorDispensers').contains(event.target)) setPicker(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && pickerOpen) { event.preventDefault(); setPicker(false, true); } });
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
      const stageSource = ['assets/ui/home-planets/stages-round-v2/stage-i.webp','assets/ui/home-planets/stages-round-v2/stage-ii.webp','assets/ui/home-planets/stages-round-v2/stage-iii.webp'][Math.max(0, Math.min(2, state.stage - 1))];
      if (stageImage.getAttribute('src') !== stageSource) stageImage.src = stageSource;
      stageImage.alt = `${roman(state.stage)} стадия мутации`;
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
    selector.setAttribute('aria-label', `${state.stage ? mutation.name + '. ' : ''}Сменить мутацию`);
    $('homeFoodHeading').textContent = state.fed ? 'ГОТОВО' : state.stage ? 'СЪЕШЬ' : 'СИНТЕЗ';
    const info = $('homeMutationInfo'), task = state.task;
    info.style.setProperty('--console-mutation-color', mutation?.color || '#51d9e7');
    info.disabled = state.busy;
    info.querySelector('.console-mutation-name').textContent = state.stage ? mutation.name : 'МУТАЦИЯ';
    info.classList.toggle('is-long-name', (mutation?.name.length || 0) > 6);
    info.querySelector('.console-stage').textContent = state.stage ? roman(state.stage) : '—';
    info.querySelector('.console-task-kicker').textContent = !state.stage ? 'ЛАБОРАТОРИЯ' : task.max ? 'РАЗВИТИЕ' : `ДО ${roman(task.targetStage)} СТАДИИ`;
    info.querySelector('.console-task-label').textContent = !state.stage ? 'Открой первую мутацию' : task.max ? 'Все стадии открыты' : task.label;
    const percent = !state.stage ? 0 : task.max ? 100 : task.percent;
    info.querySelector('.console-task-track i').style.width = `${percent}%`;
    const track = info.querySelector('.console-task-track');
    track.setAttribute('aria-label', 'Развитие мутации'); track.setAttribute('aria-valuemin', '0'); track.setAttribute('aria-valuemax', String(task?.target || 100)); track.setAttribute('aria-valuenow', String(!state.stage ? 0 : task.max ? task.target : Math.min(task.current, task.target)));
    info.querySelector('.console-task-counter').textContent = !state.stage ? 'В лабораторию' : task.max ? 'III / III' : `${Math.min(task.current, task.target)} / ${task.target}`;
    const ready = !!(state.stage && task?.ready && !task.max);
    info.classList.toggle('is-ready', ready);
    for (const element of info.querySelectorAll('.console-task-kicker,.console-task-label,.console-task-track,.console-task-counter')) element.hidden = ready;
    info.querySelector('.console-evolution-callout').hidden = !ready;
    info.querySelector('.console-evolution-stage').textContent = ready ? `${roman(task.targetStage)} СТАДИЯ` : '';
    info.setAttribute('aria-label', ready
      ? `${mutation.name}. Можно развить до ${roman(task.targetStage)} стадии. Открыть мутацию в лаборатории`
      : `${state.stage ? mutation.name : 'Мутации'}. ${info.querySelector('.console-task-label').textContent}. Посмотреть развитие`);
    const grid = $('homeMonitorPicker').querySelector('.console-mutation-grid');
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
  window.SlimeHomeConsole = Object.freeze({emptyShell, tutorialSuspended:illustratedShell, render, layout, schedule, prepareFoodDrag, disintegrateFood:() => animateFood('out'), synthesizeFood:() => animateFood('in')});
})();
