/* The round ultimate shows its cost and announces the first ready state. */
(() => {
  'use strict';
  let owner,control,button,state,cue,announced=false,wasReady=false;
  const text=(node,next)=>{if(node.textContent!==next)node.textContent=next;};
  function mount(){
    if(control)return;
    button=document.getElementById('abilityBtn');control=button.parentElement;
    state=control.querySelector('.ability-state');cue=document.getElementById('abilityReadyCue');
    cue.addEventListener('animationend',event=>{if(event.target===cue)cue.hidden=true;});
    button.addEventListener('pointerdown',()=>{if(!button.disabled)cue.hidden=true;});
  }
  function render(run,{ready=false,active=false,cooldownMs=0,enoughStrength=true,visible=true,source=''}={}){
    mount();
    if(owner!==run){owner=run;announced=false;wasReady=false;cue.hidden=true;void cue.offsetWidth;button.classList.remove('ability-became-ready');}
    const blocked=!!(run.coreEncounter||run.evacuation||run.ended||run.mechSuit||run.ultimateIntro);
    ready=visible&&ready&&!blocked;
    control.dataset.state=ready?'ready':active?'active':cooldownMs?'cooldown':'unavailable';
    control.dataset.paused=String(Boolean(run.paused));cue.dataset.paused=control.dataset.paused;
    state.hidden=!ready&&(active||cooldownMs>0||enoughStrength);
    text(state,ready?'−20% СИЛЫ':'НУЖНО 20%');
    if(ready&&!wasReady){
      button.classList.remove('ability-became-ready');void button.offsetWidth;button.classList.add('ability-became-ready');
    }
    if(!ready)button.classList.remove('ability-became-ready');
    if(ready&&!announced&&!run.paused&&(window.SlimeUIActivity?.isActive(control)??true)){
      announced=true;cue.querySelector('img').src=source;text(cue.querySelector('span'),'Суперсила готова!');cue.hidden=false;
    }
    if(!visible||blocked||!ready)cue.hidden=true;
    wasReady=ready;
  }
  window.SlimeRunAbilityHud=Object.freeze({render});
})();
