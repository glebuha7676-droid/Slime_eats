/* One visible resource. Strength and distance share a bounded, pausable easing loop. */
(() => {
  'use strict';
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const feedbackClasses=['is-hazard','is-recover','is-spend','is-exhaustion-flash'];
  const lowAt=50,criticalAt=25;
  let root,hud,fill,value,delta,label,status,distance,copy,route,emblem;
  let shown=100,target=100,distanceShown=0,distanceTarget=0,last=0,raf=0,eventId=0,pickups=0,owner,warning='',feedback=0,wasExhausted=false;
  const clamp=n=>Math.max(0,Math.min(100,Number(n)||0));
  function percent(n){
    const rounded=Math.round(n);
    if(n>criticalAt&&n<lowAt)return Math.min(lowAt-1,Math.max(criticalAt+1,rounded));
    return n>0?Math.max(1,rounded):0;
  }
  const active=()=>!owner?.paused&&(window.SlimeUIActivity?.isActive(root)??(!document.hidden&&document.body.dataset.screen==='drop'));
  const text=(node,next)=>{if(node.textContent!==next)node.textContent=next;};
  function paint(){
    fill.style.width=`${shown}%`;
    root.classList.toggle('is-burning',shown>target&&!root.classList.contains('is-transferring'));
    text(distance,String(Math.round(distanceShown)));
  }
  function moving(){return shown!==target||distanceShown!==distanceTarget||feedback>0;}
  function wake(){if(!raf&&moving()&&active()){last=performance.now();raf=requestAnimationFrame(frame);}}
  function frame(now){
    raf=0;if(!root||!active()){last=0;return;}
    const dt=Math.min(.05,(now-last)/1000||.016);last=now;
    shown=motion.matches?target:shown+(target-shown)*(1-Math.exp(-dt*(target>shown?12:15)));
    distanceShown=motion.matches||distanceTarget===0?distanceTarget:distanceShown+(distanceTarget-distanceShown)*(1-Math.exp(-dt*11));
    if(Math.abs(target-shown)<.03)shown=target;
    if(Math.abs(distanceTarget-distanceShown)<.1)distanceShown=distanceTarget;
    if(feedback>0){feedback=Math.max(0,feedback-dt);if(!feedback)clearFeedback();}
    paint();if(moving())raf=requestAnimationFrame(frame);
  }
  function mount(){
    if(root)return true;
    root=document.getElementById('anomalyEnergy');if(!root)return false;
    hud=root.closest('.run-top-hud');fill=root.querySelector('.anomaly-energy-fill');
    value=root.querySelector('.anomaly-energy-value');delta=root.querySelector('.anomaly-energy-delta');label=root.querySelector('.anomaly-energy-label');
    emblem=root.querySelector(':scope > img');
    distance=document.getElementById('runDistanceValue');copy=document.getElementById('runDistanceCopy');route=distance.closest('.run-route');
    status=document.createElement('span');status.className='core-encounter-accessible';status.setAttribute('role','status');status.setAttribute('aria-live','polite');root.append(status);
    return true;
  }
  function clearFeedback(){
    feedback=0;
    root.classList.remove(...feedbackClasses);
    delta.textContent='';
  }
  function respond(kind,amount){
    clearFeedback();
    void root.offsetWidth;
    root.classList.add(kind==='empty'?'is-exhaustion-flash':kind==='recover'?'is-recover':kind==='ability'?'is-spend':'is-hazard');
    feedback=.92;
    if(kind==='empty')return;
    delta.textContent=kind==='recover'&&Math.round(amount)===0?'МАКС.':`${amount>0?'+':'−'}${Math.round(Math.abs(amount))}%`;
  }
  function render(run){
    if(!mount())return;
    const depth=Math.max(0,Math.floor(run.maxDepth||0)),goal=Math.max(1,Number(run.world?.targetDepth)||500);
    const remaining=run.endless?depth:Math.max(0,goal-depth);
    if(owner!==run){
      cancelAnimationFrame(raf);raf=0;last=0;owner=run;shown=clamp(run.energy);distanceShown=remaining;eventId=run.energyEvent?.id||0;pickups=run.energyStats?.pickups||0;warning='';wasExhausted=false;
      clearFeedback();
      root.dataset.mutation=run.elementalAbilityType||run.mutationId||'neutral';
      const source=run.strengthEmblem||'assets/ui/anomaly-energy-v1/pickup.webp';
      emblem.src=window.SlimeGameAssets?.versionedAsset(source)||source;
    }
    target=clamp(run.energy);distanceTarget=remaining;
    const transfer=!!(run.coreEncounter?.cinematic&&!run.evacuation);
    const spent=target<=0&&!transfer,critical=target<=criticalAt&&!spent&&!transfer,low=target<lowAt&&!spent&&!transfer;
    const exhausted=spent&&!run.evacuation?.completed&&!run.coreEncounter?.hit;
    const justExhausted=exhausted&&!wasExhausted;
    wasExhausted=exhausted;
    root.classList.toggle('is-last',critical&&target<=8);
    root.classList.toggle('is-exhausted',exhausted);
    root.classList.toggle('is-transferring',transfer);
    root.classList.toggle('is-electric-transfer',transfer&&run.coreEncounter.electric);
    root.classList.toggle('is-frost-transfer',transfer&&run.coreEncounter.frost);
    root.classList.toggle('is-cosmos-transfer',transfer&&run.coreEncounter.cosmos);
    root.classList.toggle('is-techno-transfer',transfer&&run.coreEncounter.techno);
    root.classList.toggle('is-phantom-transfer',transfer&&run.coreEncounter.phantom);
    root.classList.toggle('is-psionic-transfer',transfer&&run.coreEncounter.psionic);
    root.classList.toggle('is-glitch-transfer',transfer&&run.coreEncounter.glitch);
    root.classList.toggle('is-spores-transfer',transfer&&run.coreEncounter.spores);
    if(transfer&&run.coreEncounter.phase==='armed')shown=target;
    root.classList.toggle('is-low',low);root.classList.toggle('is-critical',critical);root.classList.toggle('is-depleted',spent);
    const displayed=percent(target);
    text(value,`${displayed}%`);
    text(label,transfer?(run.coreEncounter.phase==='armed'?'УДАР ГОТОВ':run.coreEncounter.hit?'АТАКА':'В УДАР'):spent?(exhausted?'НЕТ СИЛЫ':'ДОМОЙ'):critical?'СИЛА КОНЧАЕТСЯ':low?'МАЛО СИЛЫ':'СИЛА');
    const nextWarning=transfer?`Сила собирается в ${run.coreEncounter.spores?'споровую':run.coreEncounter.glitch?'цифровую':run.coreEncounter.psionic?'голубую телекинетическую':run.coreEncounter.phantom?'призрачную':run.coreEncounter.techno?'красную плазменную':run.coreEncounter.cosmos?'кометную':run.coreEncounter.frost?'ледяную':run.coreEncounter.electric?'электрическую':'огненную'} ауру.`:exhausted?'Сила израсходована. Возвращаемся в лабораторию.':critical?'Сила кончается! Подбери сгусток силы.':low?'Осталось мало силы.':'';
    if(warning!==nextWarning){warning=nextWarning;status.textContent=warning;}
    text(copy,run.endless?'Глубина':run.coreArena?'До ядра':'До выхода');
    route.classList.toggle('is-near-core',!run.endless&&remaining<=75);
    route.setAttribute('aria-label',run.endless?`Глубина ${depth} метров`:`${run.coreArena?'До ядра':'До выхода'} ${remaining} метров`);
    root.setAttribute('aria-valuenow',String(displayed));
    root.setAttribute('aria-valuetext',`${displayed} процентов силы слайма`);
    hud.dataset.paused=String(Boolean(run.paused));root.dataset.paused=hud.dataset.paused;route.dataset.paused=hud.dataset.paused;
    const ev=run.energyEvent;
    const fullPickup=(run.energyStats?.pickups||0)>pickups&&target>=100&&(!ev||ev.id===eventId);
    pickups=run.energyStats?.pickups||0;
    if(transfer&&feedback>0)clearFeedback();
    if(justExhausted)respond('empty',0);
    if(ev&&ev.id!==eventId){
      eventId=ev.id;
      // A nearby block must not cancel the pickup/hazard response on the next frame.
      if(!spent&&!transfer&&(ev.kind==='recover'||ev.kind==='hazard'||ev.kind==='ability')){
        respond(ev.kind,ev.delta);
      }
    }
    if(fullPickup&&!transfer)respond('recover',0);
    if(run.ended||motion.matches){shown=target;distanceShown=distanceTarget;}
    if(!raf){paint();wake();}
  }
  function refresh(){if(owner)render(owner);}
  document.addEventListener('visibilitychange',refresh);document.addEventListener('slime:ui-visibility',refresh);motion.addEventListener('change',refresh);
  window.SlimeAnomalyEnergyHud=Object.freeze({render});
})();
