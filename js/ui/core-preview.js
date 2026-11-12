/* Admin-only controls. The scene itself is the real game run/core/evacuation loop. */
(() => {
  'use strict';
  let api,root,timer;
  const phases={fall:'Падение к ядру',approach:'Накопление силы',overdrive:'Усиление приёма',armed:'Нажми на сцену — удар!',release:'Выпуск',burn:'Удар',launch:'Удар',impact:'Попадание',afterglow:'Затухание',evacuation:'Эвакуация',purification:'Очищение ядра',done:'Завершено — можно повторить'};
  const el=(tag,props={})=>Object.assign(document.createElement(tag),props);
  function settings(){
    return {mutation:root.querySelector('[name=mutation]').value,stage:+root.querySelector('[name=stage]').value,
      energy:+root.querySelector('[name=energy]').value,hp:+root.querySelector('[name=hp]').value,world:+root.querySelector('[name=world]').value};
  }
  function replay(){api.start(settings());refresh();}
  function position(){
    const b=document.getElementById('app').getBoundingClientRect();
    root.style.left=`${b.left+6}px`;root.style.width=`${Math.max(200,b.width-12)}px`;
    root.style.bottom=`${Math.max(6,innerHeight-b.bottom+6)}px`;
  }
  function refresh(){
    if(!api)return;const s=api.state();
    const text=(s.paused?'Пауза':phases[s.phase]||s.phase)+(s.damage?` · −${s.damage}%`: '');
    const status=root.querySelector('.core-preview-status');if(status.textContent!==text)status.textContent=text;
    root.querySelector('[data-action=pause]').textContent=s.paused?'▶':'Ⅱ';
    root.querySelector('[data-action=pause]').setAttribute('aria-label',s.paused?'Продолжить':'Пауза');
    root.querySelector('[data-action=pause]').disabled=s.ended;
  }
  function select(label,name,options,value){
    const field=el('label',{className:'core-preview-field'});field.append(el('span',{textContent:label}));
    const input=el('select',{name,'ariaLabel':label});
    for(const item of options)input.add(new Option(item.name,item.id));
    input.value=value;field.append(input);return field;
  }
  function mount(callbacks){
    if(root)return;api=callbacks;
    root=el('section',{id:'corePreview',className:'core-preview','ariaLabel':'Просмотр финальных ударов'});
    root.innerHTML=`<div class="core-preview-toolbar"><div class="core-preview-caption"><b>ПРОСМОТР УДАРОВ</b><span class="core-preview-status" role="status"></span></div><button type="button" data-action="pause" aria-label="Пауза">Ⅱ</button><button type="button" data-action="repeat" class="core-preview-repeat">↻ ПОВТОР</button><button type="button" data-action="settings" aria-expanded="false" aria-controls="corePreviewSettings" aria-label="Настройки просмотра">⚙</button></div><div id="corePreviewSettings" class="core-preview-settings" hidden></div>`;
    const panel=root.querySelector('.core-preview-settings'),row=el('div',{className:'core-preview-row'});
    row.append(select('Мутация','mutation',api.mutations.map(m=>({id:m.id,name:m.name+(m.custom?'':' · общий удар')})),api.initial),select('Форма','stage',[1,2,3].map(n=>({id:n,name:['I','II','III'][n-1]})),3));panel.append(row);
    const charge=el('div',{className:'core-preview-charge'});
    charge.innerHTML=`<label for="corePreviewEnergy">Сила при падении <output for="corePreviewEnergy">100%</output></label><input id="corePreviewEnergy" name="energy" type="range" min="0" max="100" step="1" value="100" aria-label="Сохранённая сила"><div class="core-preview-presets">${[5,25,50,75,100].map(n=>`<button type="button" data-energy="${n}">${n}%</button>`).join('')}</div>`;panel.append(charge);
    const worlds=el('div',{className:'core-preview-row'});
    worlds.append(select('Шахта','world',api.worlds,1),select('Ядро','hp',[100,75,50,25,5].map(n=>({id:n,name:n===5?'5% · финал':n+'% HP'})),100));panel.append(worlds);
    panel.append(el('p',{textContent:'Настройки сразу перезапускают сцену. R — повтор · P — пауза. Выход — обновить страницу. Прогресс не сохраняется.'}));
    document.body.append(root);position();window.addEventListener('resize',position,{passive:true});
    root.addEventListener('pointerdown',e=>e.stopPropagation());
    root.addEventListener('keydown',e=>e.stopPropagation());
    root.addEventListener('click',e=>{
      const button=e.target.closest('button');if(!button)return;
      if(button.dataset.energy){root.querySelector('[name=energy]').value=button.dataset.energy;charge.querySelector('output').textContent=button.dataset.energy+'%';replay();}
      if(button.dataset.action==='repeat')replay();
      if(button.dataset.action==='pause'){api.pause();refresh();}
      if(button.dataset.action==='settings'){panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));}
    });
    root.addEventListener('input',e=>{if(e.target.name==='energy')charge.querySelector('output').textContent=e.target.value+'%';});
    root.addEventListener('change',replay);
    document.addEventListener('keydown',e=>{
      if(e.target.closest('input,select,textarea,button')||e.repeat)return;
      if(e.code==='KeyR'){e.preventDefault();replay();}
      if(e.code==='KeyP'){e.preventDefault();api.pause();refresh();}
    });
    timer=setInterval(()=>{if(!document.hidden)refresh();},150);
    replay();
  }
  window.SlimeCorePreview=Object.freeze({mount,refresh,state:()=>api?.state(),settings:()=>api?settings():null});
})();
