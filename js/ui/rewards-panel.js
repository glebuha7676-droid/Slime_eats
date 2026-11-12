(() => {
  'use strict';
  const rules=window.SlimeDailyRewards;
  function markup({model,tab,asset}){
    const s=rules.status(model),flask=asset('assets/ui/anomaly-core-v56/currency.webp'),gift=asset('assets/ui/gift.webp');
    const days=rules.DAILY.map((amount,i)=>{
      const received=i<model.dailyClaimed&&!(s.dailyAvailable&&model.dailyClaimed===7);
      const current=i===s.day-1;
      return `<div class="reward-day ${received?'is-received':''} ${current?'is-today':''} ${i===6?'is-final':''}" aria-label="День ${i+1}: ${amount} осколков${received?', получено':current?', следующий подарок':''}"><small>ДЕНЬ ${i+1}</small><img src="${i===6?gift:flask}" alt=""><b>${amount}</b><span>${received?'Получено':current?s.dailyAvailable?'Сегодня':'Получено':i===6?'Большой подарок':''}</span></div>`;
    }).join('');
    return `<section class="rewards-hub" aria-label="Ежедневные подарки и колесо">
      <div class="rewards-tabs" role="tablist" aria-label="Подарки"><button id="rewardDailyTab" role="tab" aria-controls="rewardDailyPane" aria-selected="${tab==='daily'}" tabindex="${tab==='daily'?0:-1}" data-rewards-tab="daily">ПОДАРКИ <i data-daily-dot ${s.dailyAvailable?'':'hidden'}></i></button><button id="rewardWheelTab" role="tab" aria-controls="rewardWheelPane" aria-selected="${tab==='wheel'}" tabindex="${tab==='wheel'?0:-1}" data-rewards-tab="wheel">КОЛЕСО <i data-wheel-dot ${s.freeAvailable?'':'hidden'}></i></button></div>
      <div class="rewards-pane" id="rewardDailyPane" role="tabpanel" aria-labelledby="rewardDailyTab" ${tab==='daily'?'':'hidden'}>
        <div class="daily-feature"><img src="${gift}" alt=""><div><small id="dailyDayCaption">ДЕНЬ ${s.day} ИЗ 7</small><h3 id="dailyTitle">${s.dailyAvailable?'Твой подарок!':'Подарок получен'}</h3><div class="daily-amount"><img src="${flask}" alt="Осколки"><b id="dailyAmount">+${s.amount}</b></div></div></div>
        <p class="rewards-intro">Собери все 7 подарков.<br>Пропустишь день — прогресс останется.</p>
        <div class="reward-week">${days}</div>
        <button id="dailyClaimBtn" class="reward-action" type="button" ${s.dailyAvailable?'':'disabled'}>${s.dailyAvailable?`ЗАБРАТЬ ${s.amount} ОСКОЛКОВ`:'ПОЛУЧЕНО'}</button>
        <p id="dailyTimer" class="reward-timer"></p>
        <p class="reward-footnote">После седьмого подарка начнётся новый круг.</p>
      </div>
      <div class="rewards-pane" id="rewardWheelPane" role="tabpanel" aria-labelledby="rewardWheelTab" ${tab==='wheel'?'':'hidden'}>
        <div class="wheel-heading"><h3>Крути и забирай!</h3><p>Один бесплатный запуск каждый день</p></div>
        <div class="gift-wheel-stage"><div class="gift-wheel-frame"><canvas id="rewardWheelDisc" width="640" height="640" role="img" aria-label="Колесо: ${rules.WHEEL.join(', ')} осколков, шансы равные"></canvas><div class="gift-wheel-hub"><img src="${gift}" alt=""></div><i class="wheel-bolt bolt-a"></i><i class="wheel-bolt bolt-b"></i><i class="wheel-bolt bolt-c"></i><i class="wheel-bolt bolt-d"></i></div><span class="gift-wheel-pointer" aria-hidden="true"></span></div>
        <div id="wheelPrize" class="wheel-prize" role="status" aria-live="polite"><img src="${flask}" alt=""><div><strong id="wheelPrizeTitle">До 75 осколков</strong><small id="wheelPrizeCopy">Осколки для новых форм и мутаций</small></div></div>
        <button id="wheelSpinBtn" class="reward-action" type="button"></button>
        <p id="wheelTimer" class="reward-timer"></p>
        <p id="wheelAdHint" class="reward-footnote"></p>
        <details class="reward-odds"><summary>Что может выпасть?</summary><p>${rules.WHEEL.map(n=>`${n} осколков`).join(' · ')}.<br>8 равных секторов — по 12,5% на каждый.</p></details>
      </div>
      <div class="reward-flights" aria-hidden="true"></div>
    </section>`;
  }
  async function drawWheel(canvas,asset){
    if(!canvas)return;await document.fonts.ready;
    const image=new Image();image.src=asset('assets/ui/anomaly-core-v56/currency.webp');try{await image.decode()}catch(_){}
    const ctx=canvas.getContext('2d'),size=640,c=size/2,r=c-3;
    const colors=[['#8fdce8','#54b6cc'],['#e7dfb6','#c9b976'],['#9ed9bb','#60b492'],['#aacfe8','#6ba4c9'],['#b7b9df','#858ebc'],['#9cdaca','#64b9ae'],['#edcea0','#d5a461'],['#efce72','#dbad45']];
    ctx.clearRect(0,0,size,size);
    for(let i=0;i<8;i++){
      const mid=-Math.PI/2+i*Math.PI/4,a=mid-Math.PI/8,b=mid+Math.PI/8;
      const g=ctx.createRadialGradient(c,c,50,c,c,r);g.addColorStop(0,colors[i][1]);g.addColorStop(1,colors[i][0]);
      ctx.beginPath();ctx.moveTo(c,c);ctx.arc(c,c,r,a,b);ctx.closePath();ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#d8f5ec';ctx.lineWidth=3;ctx.stroke();
      ctx.save();ctx.translate(c+Math.cos(mid)*r*.66,c+Math.sin(mid)*r*.66);ctx.rotate(mid+Math.PI/2);
      if(image.naturalWidth)ctx.drawImage(image,-31,-57,62,62);
      ctx.font='1000 44px "Slime Nunito",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#e9fbfb';ctx.fillStyle='#12455c';ctx.strokeText(String(rules.WHEEL[i]),0,27);ctx.fillText(String(rules.WHEEL[i]),0,27);ctx.restore();
    }
    ctx.beginPath();ctx.arc(c,c,r-2,0,Math.PI*2);ctx.strokeStyle='#327a91';ctx.lineWidth=7;ctx.stroke();
  }
  function update(root,{model,pending,busy,tab,now=Date.now()}){
    if(!root)return;const s=rules.status(model,now),q=sel=>root.querySelector(sel);
    root.querySelectorAll('[data-daily-dot]').forEach(e=>e.hidden=!s.dailyAvailable);
    root.querySelectorAll('[data-wheel-dot]').forEach(e=>e.hidden=!s.freeAvailable);
    const daily=q('#dailyClaimBtn');
    daily.disabled=!s.dailyAvailable&&!s.freeAvailable;
    daily.classList.toggle('is-secondary',!s.dailyAvailable&&s.freeAvailable);
    daily.textContent=s.dailyAvailable?`ЗАБРАТЬ ${s.amount} ОСКОЛКОВ`:s.freeAvailable?'К БЕСПЛАТНОМУ КОЛЕСУ →':'ПОЛУЧЕНО';
    q('#dailyTimer').textContent=s.dailyAvailable?'Бесплатно. Без рекламы.':`Следующий подарок через ${rules.formatWait(s.dailyWait)}`;
    const button=q('#wheelSpinBtn');button.disabled=!!pending||busy||(!s.freeAvailable&&!s.adAvailable);
    button.classList.toggle('is-video',!s.freeAvailable);
    button.textContent=pending?'ВРАЩАЕТСЯ…':busy?'ОТКРЫВАЕМ ВИДЕО…':s.freeAvailable?'КРУТИТЬ БЕСПЛАТНО':s.adRemaining===0?'НА СЕГОДНЯ ВСЁ':s.adWait>0?`ПОДОЖДИ ${rules.formatWait(s.adWait)}`:'▶ ЕЩЁ ЗАПУСК ЗА ВИДЕО';
    q('#wheelTimer').textContent=s.freeAvailable?'Бесплатный запуск доступен':`Бесплатно через ${rules.formatWait(s.wheelWait)}`;
    q('#wheelAdHint').textContent=s.freeAvailable?'Каждый запуск приносит осколки.':s.adRemaining>0?`По желанию: ещё ${s.adRemaining} ${s.adRemaining===1?'запуск':'запуска'} за видео сегодня`:'Дополнительные запуски обновятся завтра';
    const prize=model.lastPrize?.kind==='wheel'?model.lastPrize:null;
    q('#wheelPrize').classList.toggle('has-prize',!!prize&&!pending);
    const title=pending?'Выбираем подарок…':prize?`Твой приз: +${prize.amount} осколков`:'До 75 осколков';
    const copy=pending?'Указатель покажет выигрыш':prize?'Осколки уже на счёте':'Для новых форм и мутаций';
    // The live region announces a new prize once, not every countdown tick.
    if(q('#wheelPrizeTitle').textContent!==title)q('#wheelPrizeTitle').textContent=title;
    if(q('#wheelPrizeCopy').textContent!==copy)q('#wheelPrizeCopy').textContent=copy;
    if(!pending)q('#rewardWheelDisc').style.transform=`rotate(${model.wheelAngle}deg)`;
  }
  function celebrate(root,source,asset,reduced){
    if(!root)return;const target=document.querySelector('#panelTitle .rewards-balance'),layer=root.querySelector('.reward-flights');
    if(!source||!target||!layer)return;
    if(reduced){target.animate([{opacity:.6},{opacity:1}],{duration:200});return}
    source.animate([{transform:'scale(.94)',opacity:.7},{transform:'scale(1.04)',opacity:1,offset:.55},{transform:'none',opacity:1}],{duration:470,easing:'ease-out'});
    const a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
    for(let i=0;i<7;i++){
      const img=document.createElement('img');img.src=asset('assets/ui/anomaly-core-v56/currency.webp');img.style.left=`${a.left+a.width/2}px`;img.style.top=`${a.top+a.height/2}px`;layer.append(img);
      const dx=b.left+b.width/2-a.left-a.width/2,dy=b.top+b.height/2-a.top-a.height/2;
      const animation=img.animate([{transform:'translate(-50%,-50%) scale(.5)',opacity:0},{transform:`translate(calc(-50% + ${(i-3)*12}px),calc(-50% - 26px)) scale(1)`,opacity:1,offset:.22},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.35)`,opacity:0}],{duration:800,delay:i*65,easing:'cubic-bezier(.2,.6,.3,1)'});
      animation.finished.then(()=>img.remove()).catch(()=>img.remove());
    }
  }
  window.SlimeRewardsPanel=Object.freeze({markup,drawWheel,update,celebrate});
})();
