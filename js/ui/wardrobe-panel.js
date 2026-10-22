(() => {
  'use strict';
  function mount({root,title,getSave,commit,onChange,drawAvatar,sound,formatBalance=String}) {
    const model=window.SlimeWardrobe;
    let category='accessories',viewId='',frame=0,lastFrame=0,busy=false,timeout=0,destroyed=false,synthStarted=-Infinity,happyUntil=0,displayInventory=null,prizeImage=null;
    const tapEmotion=window.SlimeTapEmotions.create();
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scrollPositions={accessories:0,emotions:0};
    const last=getSave().wardrobe.lastPrize;
    if(last){category=last.category;viewId=last.id;}
    const flask='<img src="assets/ui/research-flask-blue-v1.webp" alt="" aria-hidden="true">';
    root.innerHTML=`<section class="wardrobe" aria-label="Гардероб слайма">
      <div class="wardrobe-tabs" role="tablist" aria-label="Коллекция"><button type="button" role="tab" id="wardrobeAccessoriesTab" data-category="accessories">АКСЕССУАРЫ</button><button type="button" role="tab" id="wardrobeEmotionsTab" data-category="emotions">ЭМОЦИИ</button></div>
      <div class="wardrobe-scene"><img class="wardrobe-room" src="assets/ui/wardrobe/room-pedestal-v3.webp?v=687" alt=""><button type="button" id="wardrobePet" aria-label="Слайм в комнате примерки"><canvas width="720" height="480"></canvas></button><span class="wardrobe-preview-note">ГАРДЕРОБ</span>
      <div class="wardrobe-item-info"><div><h3 id="wardrobeItemName"></h3><p id="wardrobeItemHint"></p></div><span id="wardrobeWornStatus" hidden>НАДЕТО</span><button type="button" id="wardrobeEquip"></button></div></div>
      <section class="wardrobe-collection" role="tabpanel"><header><h3 id="wardrobeCollectionTitle"></h3><span id="wardrobeCount"></span></header><div class="wardrobe-grid-scroll" tabindex="0" role="group" aria-label="Коллекция, прокрути для просмотра"><div class="wardrobe-grid"></div></div><span class="wardrobe-scroll-cue" aria-hidden="true"></span></section>
      <section class="wardrobe-synthesis" aria-label="Синтез нового предмета"><div class="wardrobe-appliance"><img src="assets/ui/wardrobe/cosmetic-cylinder-v1.webp?v=690" alt="Компактный синтезатор с камерой выдачи" draggable="false"><canvas class="wardrobe-synth-fx" aria-hidden="true"></canvas><span class="wardrobe-output" aria-hidden="true">?</span></div><div class="wardrobe-synth-controls"><header><h3 id="wardrobeSynthTitle"></h3><p id="wardrobeSynthHint"></p><p id="wardrobeMessage" class="wardrobe-message" role="status" aria-live="polite" hidden></p></header><button type="button" id="wardrobeSynthesize"><span></span><span class="wardrobe-price">${flask}<b></b></span></button><p class="wardrobe-synth-footnote">Случайный предмет из закрытых</p></div></section>
    </section>`;
    title.innerHTML=`<span>Гардероб</span><span class="wardrobe-balance">${flask}<b></b></span>`;
    const $=selector=>root.querySelector(selector),scene=$('.wardrobe-scene'),canvas=$('#wardrobePet canvas'),ctx=canvas.getContext('2d');
    const appliance=$('.wardrobe-appliance'),fx=$('.wardrobe-synth-fx'),fxCtx=fx.getContext('2d');
    const scroller=$('.wardrobe-grid-scroll');
    function item(){return model.catalogs[category].find(entry=>entry.id===viewId)||model.catalogs[category][0]}
    function equipped(){return getSave().wardrobe[category==='accessories'?'accessory':'emotion']}
    function message(text){$('#wardrobeMessage').textContent=text;$('#wardrobeMessage').hidden=!text;$('#wardrobeSynthHint').hidden=Boolean(text)}
    function updateScrollCue(){
      $('.wardrobe-collection').classList.toggle('has-more',scroller.scrollTop+scroller.clientHeight<scroller.scrollHeight-3);
    }
    function onScroll(){scrollPositions[category]=scroller.scrollTop;updateScrollCue()}
    function revealCard(){
      const card=$(`[data-item="${viewId}"]`);if(!card)return;
      const rect=card.getBoundingClientRect(),view=scroller.getBoundingClientRect();
      if(rect.bottom>view.bottom-3)scroller.scrollTop+=rect.bottom-view.bottom+3;
      else if(rect.top<view.top+3)scroller.scrollTop+=rect.top-view.top-3;
      updateScrollCue();
    }
    function refresh() {
      if(destroyed)return;
      const focusedItem=document.activeElement?.dataset.item;
      const save=getSave(),state=busy&&displayInventory?displayInventory:save.wardrobe,catalog=model.catalogs[category],pool=model.remaining(state,category),cost=model.costs[category];
      if(!catalog.some(entry=>entry.id===viewId))viewId=catalog.find(entry=>entry.id===equipped())?.id||catalog[0].id;
      const current=item(),owned=!current.comingSoon&&state[category].includes(current.id),worn=equipped()===current.id;
      const fresh=state.lastPrize?.category===category&&state.lastPrize.id===current.id;
      title.querySelector('.wardrobe-balance b').textContent=formatBalance(save.researchUnits);
      for(const tab of root.querySelectorAll('[data-category]')){const selected=tab.dataset.category===category;tab.setAttribute('aria-selected',String(selected));tab.setAttribute('aria-controls','wardrobeCollection');tab.disabled=busy;}
      const panel=$('.wardrobe-collection');panel.id='wardrobeCollection';panel.setAttribute('aria-labelledby',category==='accessories'?'wardrobeAccessoriesTab':'wardrobeEmotionsTab');
      $('#wardrobeItemName').textContent=current.comingSoon?current.name+' — скоро':owned?current.name:category==='accessories'?'Аксессуар закрыт':'Эмоция закрыта';
      $('#wardrobeItemHint').textContent=current.comingSoon?'Появится в обновлении.':owned?(category==='accessories'?'Посмотри, как сидит на слайме.':'Нажми на слайма — попробуй эмоцию!'):'Откроется при синтезе.';
      const apply=$('#wardrobeEquip');apply.disabled=!owned||busy;
      apply.textContent=worn?(category==='accessories'?'СНЯТЬ':'ВЫБРАНО'):owned?(category==='accessories'?'НАДЕТЬ':'ВЫБРАТЬ'):'ЗАКРЫТО';
      if(worn&&category==='emotions')apply.disabled=true;
      apply.classList.toggle('is-equipped',worn);
      $('#wardrobeWornStatus').hidden=!worn;
      $('#wardrobeWornStatus').textContent=category==='accessories'?'НАДЕТО':'ВЫБРАНО';
      $('.wardrobe-preview-note').textContent=fresh?'НОВЫЙ ПРЕДМЕТ':'ГАРДЕРОБ';
      scene.classList.toggle('is-new',fresh);
      $('#wardrobeCollectionTitle').textContent=category==='accessories'?'Аксессуары':'Эмоции';
      const available=catalog.filter(entry=>!entry.comingSoon);
      $('#wardrobeCount').textContent=`${available.filter(entry=>state[category].includes(entry.id)).length} / ${available.length}`;
      $('.wardrobe-grid').innerHTML=catalog.map((entry,index)=>{
        const soon=!!entry.comingSoon,open=!soon&&state[category].includes(entry.id),active=!soon&&entry.id===equipped();
        const name=soon?entry.name:open?entry.name:category==='accessories'?'Аксессуар '+(index+1):entry.name;
        const art=(open||category==='emotions'&&!soon)&&entry.image?`<img class="wardrobe-item-art" src="${window.SlimeGameAssets.versionedAsset(entry.image)}" alt="" aria-hidden="true" draggable="false">`:'<img class="wardrobe-lock-icon" src="assets/ui/lock.webp" alt="" aria-hidden="true" draggable="false">';
        return `<button type="button" class="wardrobe-card ${entry.id===viewId?'is-viewed':''} ${active?'is-equipped':''} ${fresh&&entry.id===viewId&&!busy?'is-prize':''} ${open?'':'is-locked'} ${soon?'is-coming-soon':''}" data-item="${entry.id}" aria-label="${name}${soon?', скоро':active?', выбрано':open?', открыто':', закрыто'}" aria-pressed="${entry.id===viewId}" ${busy?'disabled':''}>${art}<span>${name}</span>${!open&&!soon&&category==='emotions'?'<img class="wardrobe-small-lock" src="assets/ui/lock.webp" alt="">':''}${active?'<i class="wardrobe-worn">'+(category==='accessories'?'НАДЕТО':'ВЫБРАНО')+'</i>':!open?'<small class="wardrobe-locked-label">'+(soon?'Скоро':'Закрыто')+'</small>':''}</button>`;
      }).join('');
      scroller.scrollTop=scrollPositions[category];
      if(focusedItem)$(`[data-item="${focusedItem}"]`)?.focus({preventScroll:true});
      updateScrollCue();
      $('#wardrobeSynthTitle').textContent=category==='accessories'?'Синтез аксессуара':'Синтез эмоции';
      const missing=Math.max(0,cost-save.researchUnits);
      $('#wardrobeSynthHint').textContent=busy?'Создаём новый предмет…':!pool.length?'Все предметы уже открыты':missing?`Не хватает ${missing} колб`:'Новый предмет без повторов';
      $('.wardrobe-synth-footnote').textContent=!pool.length?'Коллекция собрана':category==='accessories'?'Случайный аксессуар из закрытых':'Случайная эмоция из закрытых';
      const button=$('#wardrobeSynthesize');button.disabled=busy||!pool.length||missing>0;
      button.querySelector('span').textContent=busy?'СИНТЕЗ…':pool.length?'СИНТЕЗИРОВАТЬ':'ОТКРЫТО';
      button.setAttribute('aria-label',busy?'Идёт синтез':!pool.length?'Коллекция собрана':`Синтезировать ${category==='accessories'?'аксессуар':'эмоцию'} за ${cost} колб`);
      button.querySelector('.wardrobe-price').hidden=!pool.length||busy;
      button.querySelector('b').textContent=cost;
      appliance.classList.toggle('is-complete',!pool.length);
      appliance.classList.toggle('is-unavailable',missing>0&&!busy);
      $('.wardrobe-output').textContent=pool.length?'?':'✓';
    }
    function synthesize() {
      if(busy)return;
      const before=structuredClone(getSave().wardrobe);
      const result=model.purchase(getSave(),category);
      if(!result.ok){message(result.reason==='balance'?'Собирай колбы в шахте.':result.reason==='complete'?'Коллекция уже собрана!':'Попробуй ещё раз.');refresh();return}
      // Ownership and payment are one save operation, before the decorative reveal.
      commit();onChange();busy=true;displayInventory=before;synthStarted=performance.now();message('');sound('synth');
      prizeImage=null;if(result.item.image){prizeImage=new Image();prizeImage.src=window.SlimeGameAssets.versionedAsset(result.item.image);}
      scene.classList.remove('is-new');root.classList.add('wardrobe-synthesizing');refresh();
      timeout=setTimeout(()=>{
        if(destroyed)return;
        busy=false;displayInventory=null;root.classList.remove('wardrobe-synthesizing');viewId=result.item.id;
        refresh();revealCard();message(`Открыто: ${result.item.name}!`);sound('coin');happyUntil=performance.now()+650;
      },reduce?160:1350);
    }
    function handle(event) {
      const button=event.target.closest('button');if(!button||button.disabled)return;
      if(button.dataset.category){category=button.dataset.category;viewId='';message('');refresh();sound('tap')}
      else if(button.dataset.item){viewId=button.dataset.item;message('');refresh();sound('tap')}
      else if(button.id==='wardrobePet'){const id=category==='emotions'&&getSave().wardrobe.emotions.includes(item().id)&&!item().comingSoon?item().id:getSave().wardrobe.emotion;window.SlimeTapEmotions.trigger(tapEmotion,id,performance.now());sound('happy')}
      else if(button.id==='wardrobeSynthesize')synthesize();
      else if(button.id==='wardrobeEquip'){
        const save=getSave();if(!save.wardrobe[category].includes(item().id))return;
        save.wardrobe[category==='accessories'?'accessory':'emotion']=category==='accessories'&&equipped()===viewId?'none':viewId;
        save.wardrobe.lastPrize=null;commit();onChange();refresh();sound('tap');
      }
    }
    function drawSynthesis(now) {
      let w=appliance.clientWidth,h=appliance.clientHeight;const dpr=Math.min(devicePixelRatio||1,2);
      if(fx.width!==Math.round(w*dpr)||fx.height!==Math.round(h*dpr)){fx.width=Math.round(w*dpr);fx.height=Math.round(h*dpr)}
      fxCtx.setTransform(dpr,0,0,dpr,0,0);fxCtx.clearRect(0,0,w,h);
      const age=now-synthStarted,active=age>=0&&age<1950;
      appliance.classList.toggle('is-celebrating',active&&!reduce);
      if(!active||reduce)return;
      const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>1-Math.pow(1-clamp(v),3);
      const art=appliance.querySelector('img'),scale=Math.min(w/(art.naturalWidth||420),h/(art.naturalHeight||600));
      const aw=(art.naturalWidth||420)*scale,ah=(art.naturalHeight||600)*scale;
      fxCtx.save();fxCtx.translate((w-aw)/2,(h-ah)/2);w=aw;h=ah;
      fxCtx.beginPath();fxCtx.roundRect(w*.15,h*.22,w*.70,h*.58,w*.08);fxCtx.clip();
      const emotional=category==='emotions',tint=emotional?'#e9bcfa':'#88edf4',light=emotional?'#fff0fa':'#e7fffb';
      const cx=w*.50,cy=h*.55,pop=clamp((age-1350)/600),gather=clamp((age-680)/550),fade=1-ease((age-1700)/250);
      // Small buoyant bubbles rise from the bottom and curl into a floating capsule.
      if(age<1370)for(let i=0;i<12;i++){
        const travel=clamp((age-i*38)/780),curl=gather*gather;
        if(travel<=0||travel>=1)continue;
        const start=w*(.24+(i%5)*.13),x=start+(cx-start)*curl+Math.sin(travel*5+i)*w*.035*(1-curl);
        const y=h*.77-travel*h*.40+(cy-(h*.77-travel*h*.40))*curl;
        const r=w*(.015+(i%3)*.005)*(1-curl*.5);
        fxCtx.globalAlpha=Math.sin(travel*Math.PI)*.70;fxCtx.fillStyle=tint;fxCtx.beginPath();fxCtx.arc(x,y,r,0,Math.PI*2);fxCtx.fill();
        fxCtx.fillStyle=light;fxCtx.beginPath();fxCtx.arc(x-r*.27,y-r*.30,r*.24,0,Math.PI*2);fxCtx.fill();
      }
      fxCtx.globalAlpha=1;
      if(age>420&&age<1400){
        const arrive=ease((age-420)/430),squeeze=Math.sin(clamp((age-1140)/210)*Math.PI)*.10;
        const rx=w*.235*arrive*(1+squeeze),ry=w*.24*arrive*(1-squeeze),y=cy-Math.sin(age/210)*h*.009;
        fxCtx.fillStyle=tint;fxCtx.beginPath();fxCtx.ellipse(cx,y,rx,ry,0,0,Math.PI*2);fxCtx.fill();
        fxCtx.save();fxCtx.beginPath();fxCtx.ellipse(cx,y,rx,ry,0,0,Math.PI*2);fxCtx.clip();
        fxCtx.fillStyle=emotional?'#bd86de':'#32b8da';fxCtx.fillRect(cx-rx,y,rx*2,ry);fxCtx.restore();
        fxCtx.strokeStyle=light;fxCtx.lineWidth=Math.max(1,w*.012);fxCtx.beginPath();fxCtx.moveTo(cx-rx*.85,y);fxCtx.lineTo(cx+rx*.85,y);fxCtx.stroke();
        fxCtx.fillStyle=light;fxCtx.beginPath();fxCtx.ellipse(cx-rx*.28,y-ry*.42,rx*.20,ry*.12,-.5,0,Math.PI*2);fxCtx.fill();
      }
      if(age>=1350){
        for(let i=0;i<9;i++){
          const angle=i*Math.PI*2/9-Math.PI/2,r=w*(.13+ease(pop)*.22),x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r*.78;
          fxCtx.globalAlpha=(1-pop)*fade;fxCtx.fillStyle=i%2?tint:light;fxCtx.beginPath();fxCtx.arc(x,y,Math.max(.6,w*.023*(1-pop)),0,Math.PI*2);fxCtx.fill();
        }
        fxCtx.globalAlpha=fade;
        const grow=.75+.25*ease((age-1350)/230)+Math.sin(clamp((age-1350)/300)*Math.PI)*.10;
        if(prizeImage?.complete&&prizeImage.naturalWidth){
          const k=Math.min(w*.60/prizeImage.naturalWidth,h*.34/prizeImage.naturalHeight)*grow;
          fxCtx.drawImage(prizeImage,cx-prizeImage.naturalWidth*k/2,cy-prizeImage.naturalHeight*k/2,prizeImage.naturalWidth*k,prizeImage.naturalHeight*k);
        }else{
          // A cheerful bubble celebrates an emotion without inventing its artwork.
          const r=w*.15*grow;fxCtx.fillStyle=tint;fxCtx.beginPath();fxCtx.arc(cx,cy,r,0,Math.PI*2);fxCtx.fill();
          fxCtx.strokeStyle='#62547e';fxCtx.lineWidth=Math.max(1,w*.015);fxCtx.lineCap='round';
          for(const side of [-1,1]){fxCtx.beginPath();fxCtx.arc(cx+side*r*.32,cy-r*.10,r*.14,Math.PI,Math.PI*2);fxCtx.stroke()}
          fxCtx.beginPath();fxCtx.arc(cx,cy+r*.05,r*.34,.15,Math.PI-.15);fxCtx.stroke();
        }
      }
      fxCtx.restore();
    }
    function draw(now) {
      frame=0;if(destroyed||!root.isConnected||!window.SlimeUIActivity.isActive(root))return;
      frame=requestAnimationFrame(draw);if(document.hidden||now-lastFrame<32)return;lastFrame=now;
      const w=scene.clientWidth,h=scene.clientHeight;if(!w||!h)return;
      const dpr=Math.min(devicePixelRatio||1,2);
      if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr)}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const cover=Math.max(w/1536,h/1024),foot=1024*.76*cover+(h-1024*cover)/2;
      const radius=Math.min(w*.29,h*.36,(foot-8)/2.15),y=foot-radius*.98;
      canvas.style.setProperty('--wardrobe-foot',`${foot/h*100}%`);
      ctx.save();
      const blinkPhase=now%4700;
      const shown=busy&&displayInventory?displayInventory:getSave().wardrobe;
      const accessory=category==='accessories'&&shown.accessories.includes(item().id)?item().id:shown.accessory;
      const reaction=window.SlimeTapEmotions.sample(tapEmotion,now);
      const options={x:w/2,y,radius,accessory,scaleX:reaction.scaleX,scaleY:reaction.scaleY,emotion:reaction.active?reaction.emotion:now<happyUntil?'pleased':'focused',blink:!reaction.active&&now>=happyUntil&&blinkPhase>4420&&blinkPhase<4530,timestamp:now};
      drawAvatar(ctx,options,now);
      ctx.restore();window.SlimeTapEmotions.draw(ctx,tapEmotion,{x:w/2,y,radius,now,reducedMotion:reduce});drawSynthesis(now);
    }
    const wake=()=>{if(!destroyed&&!frame&&window.SlimeUIActivity.isActive(root))frame=requestAnimationFrame(draw)};
    document.addEventListener('slime:ui-visibility',wake);
    const observer=new ResizeObserver(updateScrollCue);observer.observe(scroller);
    root.addEventListener('click',handle);scroller.addEventListener('scroll',onScroll,{passive:true});refresh();revealCard();frame=requestAnimationFrame(draw);
    return {refresh,destroy(){destroyed=true;document.removeEventListener('slime:ui-visibility',wake);window.SlimeTapEmotions.clear(tapEmotion);cancelAnimationFrame(frame);clearTimeout(timeout);observer.disconnect();root.removeEventListener('click',handle);scroller.removeEventListener('scroll',onScroll);root.classList.remove('wardrobe-synthesizing')}};
  }
  window.SlimeWardrobePanel=Object.freeze({mount});
})();
