/* Circular planet selector and deferred, resumable core-damage presentation. */
(() => {
  'use strict';
  const model=window.SlimePlanetCampaign,reduced=matchMedia('(prefers-reduced-motion:reduce)');
  let root,stage,title,subtitle,number,health,clearedStatus,fill,trail,count,notice,state,active=null,frame=0,serial=0;
  const cards=new Map(),visualHp=new Map(),loaded=new Map();
  const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  const asset=path=>window.SlimeGameAssets?.versionedAsset(path)||path;
  const frameStage=(planet,hp)=>model.stage(hp);
  function preload(path){
    if(!path)return Promise.resolve();
    if(!loaded.has(path)){const image=new Image();image.decoding='async';image.src=asset(path);loaded.set(path,image.decode().catch(()=>{}));}
    return loaded.get(path);
  }
  function mount(parent){
    if(root)return;
    root=document.createElement('section');root.id='homePlanetsPanel';root.className='home-planets-panel';root.setAttribute('aria-label','Планеты');
    root.innerHTML='<div class="planet-stage" role="group" aria-label="Выбор планеты"></div><div class="planet-caption"><div class="planet-title-line"><b class="planet-title"></b><small class="planet-number"></small></div><span class="planet-subtitle"></span></div><div class="planet-core"><div class="planet-core-value"><small>ЯДРО</small><b>100%</b></div><div class="planet-core-meter"><div class="planet-hp-track" role="progressbar" aria-label="Здоровье заражённого ядра" aria-valuemin="0" aria-valuemax="100"><i class="planet-hp-trail"></i><i class="planet-hp-fill"></i><span class="planet-hp-phases" aria-hidden="true"><i></i><i></i><i></i><i></i></span></div></div></div><div class="planet-cleared-status" role="status" hidden><span class="planet-cleared-check" aria-hidden="true">✓</span><b>Планета очищена</b></div><div class="planet-locked-info" hidden></div><span class="planet-damage-notice" role="status" aria-live="polite"></span>';
    parent.append(root);stage=root.querySelector('.planet-stage');title=root.querySelector('.planet-title');subtitle=root.querySelector('.planet-subtitle');number=root.querySelector('.planet-number');health=root.querySelector('.planet-core');clearedStatus=root.querySelector('.planet-cleared-status');fill=root.querySelector('.planet-hp-fill');trail=root.querySelector('.planet-hp-trail');count=root.querySelector('.planet-core-value>b');notice=root.querySelector('.planet-damage-notice');
    root.append(number);
    for(const planet of model.planets){
      const button=document.createElement('button');button.type='button';button.className='planet-card';button.dataset.planet=planet.id;
      button.innerHTML='<span class="planet-focus-light" aria-hidden="true"></span><span class="planet-sphere"><img class="planet-image" alt="" draggable="false"><img class="planet-image-next" alt="" draggable="false"><span class="planet-unknown" aria-hidden="true"></span><img class="planet-lock" src="assets/ui/lock.webp" alt="Закрыто"></span>';
      const motes=document.createElement('span');motes.className='planet-cleansing-motes';motes.setAttribute('aria-hidden','true');
      for(let i=0;i<8;i++){const mote=document.createElement('i'),angle=i*Math.PI/4;mote.style.cssText=`left:${50+Math.cos(angle)*32}%;top:${50+Math.sin(angle)*32}%;--mote-x:${Math.cos(angle)*20}px;--mote-y:${Math.sin(angle)*20-8}px;--mote-delay:${i%3*65}ms`;motes.append(mote);}button.append(motes);
      // Pointer input belongs to stable side regions, not to a moving hitbox.
      // Native keyboard/assistive clicks still select this button's planet.
      button.addEventListener('click',event=>{if(event.detail===0&&!active&&!state?.busy&&planet.id!==state.campaign.selected)state.onSelect(planet.id);});
      cards.set(planet.id,button);stage.append(button);
    }
    stage.addEventListener('pointerdown',event=>{
      if(event.button!==0||!event.isPrimary||active||state?.busy)return;
      const bounds=stage.getBoundingClientRect(),x=(event.clientX-bounds.left)/bounds.width;
      const direction=x<.23?-1:x>.77?1:0;
      // Prevent native focus scrolling and respond before pointer-up.
      event.preventDefault();
      const hit=event.target.closest('.planet-card');
      if(hit?.classList.contains('is-selected')){
        const box=hit.getBoundingClientRect();
        if(Math.abs(box.left+box.width/2-bounds.left-bounds.width/2)<.75)return;
      }
      if(direction)step(direction);
      else if(hit&&Math.abs(Number(hit.dataset.slot))===1)state.onSelect(hit.dataset.planet);
    });
    root.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key)||active||state?.busy)return;
      event.preventDefault();const id=step(event.key==='ArrowLeft'?-1:1);
      requestAnimationFrame(()=>cards.get(id)?.focus({preventScroll:true}));
    });
    new ResizeObserver(layout).observe(root);
    document.addEventListener('slime:ui-visibility',wake);document.addEventListener('visibilitychange',wake);
    if(!document.documentElement.classList.contains('app-ready')){
      const bootObserver=new MutationObserver(()=>{if(document.documentElement.classList.contains('app-ready')){bootObserver.disconnect();wake();}});
      bootObserver.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    }
  }
  function step(direction){
    const index=model.ids.indexOf(state.campaign.selected),id=model.ids[(index+direction+model.ids.length)%model.ids.length];
    state.onSelect(id);return id;
  }
  function layout(){
    if(!root?.offsetParent)return;
    root.classList.toggle('is-compact',root.clientHeight<220);
    const width=stage.clientWidth,height=stage.clientHeight;if(!width||!height)return;
    stage.style.setProperty('--planet-size',`${Math.min(height*1.12,width*.68)}px`);
    for(const button of cards.values())button.style.setProperty('--planet-shift',`${Number(button.dataset.slot||0)*width*.36}px`);
  }
  function updateHealth(hp,ghost=hp){
    const planet=model.get(state.campaign.selected),unlocked=model.isUnlocked(state.campaign,planet.id),shown=Math.max(0,Math.min(100,hp));
    root.dataset.tone=model.tone(shown);root.dataset.sourceAlive=String(planet.id==='source'&&shown>0);root.style.setProperty('--source-pressure',String(1-shown/100));root.querySelector('.planet-core-value small').textContent=planet.id==='source'?'ОЧАГ':'ЯДРО';clearedStatus.querySelector('b').textContent=planet.id==='source'?'Очаг уничтожен':'Планета очищена';count.textContent=`${Math.round(shown)}%`;fill.style.width=`${shown}%`;trail.style.width=`${Math.max(shown,ghost)}%`;
    const cleared=unlocked&&!!planet.frames&&shown===0&&!active;
    clearedStatus.hidden=!cleared;health.hidden=!unlocked||!planet.frames||cleared;root.querySelector('.planet-locked-info').hidden=unlocked&&!!planet.frames;
    const index=model.ids.indexOf(planet.id),previous=model.planets[index-1];
    root.querySelector('.planet-locked-info').textContent=!unlocked?previous?`Очисти ${previous.name.toLocaleLowerCase('ru-RU')}`:'Пока закрыто':planet.frames?'':'После четырёх планет';
    if(!planet.frames)root.querySelector('.planet-locked-info').textContent='После четырёх планет';
    const bar=root.querySelector('.planet-hp-track');bar.setAttribute('aria-valuenow',String(Math.round(shown)));
  }
  function updateScene(){
    const selected=state.campaign.selected,index=model.ids.indexOf(selected);
    root.dataset.selected=selected;root.setAttribute('aria-busy',String(!!active));
    for(const [id,button] of cards){
      const planet=model.get(id),hp=visualHp.get(id)??state.campaign.cores[id];let slot=(model.ids.indexOf(id)-index+model.ids.length)%model.ids.length;if(slot>2)slot-=model.ids.length;
      const locked=!model.isUnlocked(state.campaign,id),central=slot===0;
      const previousSlot=Number(button.dataset.slot),recycling=Number.isFinite(previousSlot)&&Math.abs(previousSlot-slot)>2;
      if(recycling)button.classList.add('is-recycling');
      button.dataset.slot=slot;button.classList.toggle('is-selected',central);button.classList.toggle('is-locked',locked);button.classList.toggle('is-unknown',!planet.frames);
      button.setAttribute('aria-pressed',String(central));button.setAttribute('aria-disabled',String(!!active||!!state.busy));button.setAttribute('aria-label',`${planet.name}${locked?', закрыто':''}${central?', выбрана':''}`);
      button.tabIndex=Math.abs(slot)<=1?0:-1;button.style.setProperty('--planet-scale',central?'1':Math.abs(slot)===1?'.66':'.35');button.style.setProperty('--planet-alpha',Math.abs(slot)<=1?'1':'0');
      button.style.setProperty('--planet-shift',`${slot*stage.clientWidth*.36}px`);
      // A hidden item wraps behind the carousel, never across the center.
      if(recycling){void button.offsetWidth;button.classList.remove('is-recycling');}
      const image=button.querySelector('.planet-image'),next=button.querySelector('.planet-image-next');
      if(planet.frames){if(Math.abs(slot)<=1){const source=asset(planet.frames[frameStage(planet,hp)]);if(image.getAttribute('src')!==source)image.src=source;}image.hidden=false;next.hidden=false;}else{image.hidden=true;next.hidden=true;}
      if(!active||active.event.planetId!==id){button.style.setProperty('--planet-restore','0');button.classList.remove('is-impacting','is-restoring');next.removeAttribute('src');}
    }
    const planet=model.get(selected),hp=visualHp.get(selected)??state.campaign.cores[selected];
    title.textContent=planet.name;number.textContent=`${index+1} из ${model.ids.length}`;
    subtitle.textContent=active?.restoring?(active.event.to===0?'ПЛАНЕТА ОЧИЩЕНА!':'АНОМАЛИЯ ОТСТУПАЕТ'):!model.isUnlocked(state.campaign,selected)?'ПЛАНЕТА ЗАКРЫТА':hp===0?'':planet.theme;
    updateHealth(active?.displayHp??hp,active?.ghostHp??hp);layout();
    // Only the current planet and its visible neighbors need their pictures now.
    for(const offset of [-1,0,1]){const p=model.planets[(index+offset+model.planets.length)%model.planets.length];preload(p.frames?.[frameStage(p,visualHp.get(p.id)??state.campaign.cores[p.id])]);}
  }
  function visible(){return root?.isConnected&&!document.hidden&&document.documentElement.classList.contains('app-ready')&&document.body.dataset.screen==='home'&&window.SlimeUIActivity?.isActive(root);}
  function wake(){if(active&&!frame&&visible())frame=requestAnimationFrame(tick);}
  function begin(event){
    const token=++serial;active={event,token,elapsed:0,last:0,imageReady:false};
    root.classList.remove('is-returning','is-cleansing');notice.classList.remove('is-visible');
    visualHp.set(event.planetId,event.from);updateScene();state.onBusy?.(true);
    const planet=model.get(event.planetId),source=planet.frames?.[frameStage(planet,event.to)];
    const finishPreparation=()=>{if(active?.token!==token)return;active.imageReady=true;wake();};
    Promise.race([preload(source),new Promise(resolve=>setTimeout(resolve,5000))]).then(finishPreparation);
  }
  function finish(){
    const done=active;if(!done)return;
    const planet=model.get(done.event.planetId),button=cards.get(planet.id);visualHp.set(planet.id,done.event.to);
    const image=button.querySelector('.planet-image'),next=button.querySelector('.planet-image-next');if(planet.frames)image.src=asset(planet.frames[frameStage(planet,done.event.to)]);
    button.style.setProperty('--planet-restore','0');button.classList.remove('is-impacting','is-restoring');next.removeAttribute('src');notice.textContent='';
    root.classList.remove('is-returning','is-cleansing');notice.classList.remove('is-visible');
    state.onAcknowledge?.(done.event.id);active=null;state.onBusy?.(false);updateScene();
  }
  function tick(at){
    frame=0;if(!active)return;
    if(!visible()){active.last=0;return;}
    const a=active;a.elapsed+=a.last?Math.min(50,at-a.last):0;a.last=at;
    const reducedScale=reduced.matches?.3:1,e=a.event,planet=model.get(e.planetId),button=cards.get(e.planetId);
    let t=a.elapsed/reducedScale;
    const hitAt=120,barEnd=1250,restoreAt=1450,restoreEnd=2400,changed=frameStage(planet,e.from)!==frameStage(planet,e.to),end=changed?2850:1850;
    // Show damage immediately; a slow stage texture must not hold up the feedback.
    if(changed&&!a.imageReady&&t>restoreAt){a.elapsed=restoreAt*reducedScale;t=restoreAt;}
    if(!a.intro){a.intro=true;root.classList.add('is-returning');}
    if(t>=hitAt&&!a.hit){a.hit=true;button.classList.add('is-impacting');notice.textContent=`−${e.damage}%`;notice.classList.remove('is-visible');void notice.offsetWidth;notice.classList.add('is-visible');}
    const progress=ease((t-hitAt)/(barEnd-hitAt)),ghost=ease((t-hitAt-180)/(barEnd-hitAt));
    a.displayHp=e.from+(e.to-e.from)*progress;a.ghostHp=e.from+(e.to-e.from)*ghost;
    updateHealth(a.displayHp,a.ghostHp);
    if(changed&&a.imageReady&&t>=restoreAt){
      if(!a.restoring){a.restoring=true;root.classList.add('is-cleansing');button.classList.add('is-restoring');button.querySelector('.planet-image-next').src=asset(planet.frames[frameStage(planet,e.to)]);subtitle.textContent=e.to===0?(planet.id==='source'?'ОЧАГ УНИЧТОЖЕН!':'ПЛАНЕТА ОЧИЩЕНА!'):'АНОМАЛИЯ ОТСТУПАЕТ';}
      button.style.setProperty('--planet-restore',String(ease((t-restoreAt)/(restoreEnd-restoreAt))));
    }
    if(t>=end){finish();return;}wake();
  }
  function render(next){
    state=next;mount(document.getElementById('homeScreen'));
    if(active&&!state.campaign.pending.some(e=>e.id===active.event.id)){
      cancelAnimationFrame(frame);frame=0;active=null;serial++;state.onBusy?.(false);notice.textContent='';root.classList.remove('is-returning','is-cleansing');notice.classList.remove('is-visible');
    }
    for(const planet of model.planets){if(active?.event.planetId===planet.id)continue;const pending=state.campaign.pending.find(e=>e.planetId===planet.id);visualHp.set(planet.id,pending?.from??state.campaign.cores[planet.id]);}
    updateScene();
    const pending=state.campaign.pending[0];if(!active&&pending&&pending.planetId===state.campaign.selected)begin(pending);
    wake();
  }
  window.SlimePlanetCarousel=Object.freeze({mount,render,layout,isBusy:()=>!!active});
})();
