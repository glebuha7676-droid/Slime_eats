/* The first meeting waits for two deliberate actions, not a timed slideshow. */
(() => {
  'use strict';
  let scene=null,epoch=0;
  const $=id=>document.getElementById(id);
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function position(){
    if(!scene?.note)return;
    const anchor=$('worldCarousel').getBoundingClientRect(),play=$('worldStartBtn').getBoundingClientRect(),note=scene.note;
    const width=Math.min(320,anchor.width,innerWidth-28);note.style.width=`${width}px`;
    note.style.left=`${anchor.left+(anchor.width-width)/2}px`;
    note.style.top=`${Math.max(12,Math.min(anchor.top+7,play.top-note.offsetHeight-10))}px`;
  }
  function cancel(){
    epoch++;
    if(!scene)return;
    cancelAnimationFrame(scene.frame);scene.note.remove();scene.animation?.cancel();scene.options.pose('normal');
    if(scene.kind==='synthesis'){
      document.querySelector('#foodChoices .console-food-content')?.getAnimations().forEach(animation=>animation.cancel());
      $('homeSynthesisFx')?.classList.remove('is-active');
    }
    delete document.body.dataset.tutorialIntro;scene=null;
  }
  function phase(kind,title,action=''){
    scene.kind=kind;scene.elapsed=0;scene.ready=false;
    scene.focusTarget=kind==='hello'?'slime':kind==='emblem'?'homeMutationSelector':null;
    document.body.dataset.tutorialIntro=kind;
    const heading=document.createElement('strong');heading.textContent=title;
    const detail=document.createElement('span');detail.textContent=action;detail.hidden=!action;
    scene.note.replaceChildren(heading,detail);position();
    if(!reduced())scene.note.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:240,easing:'ease-out'});
    $('homeFoodHeading').textContent='СИНТЕЗ';
    scene.options.changed();
  }
  function emblem(){
    phase('emblem','Ого! Появилась мутация!','Нажми на эмблему.');scene.options.pose('surprised');scene.options.sound('tap');
    const face=$('homeMutationSelector').querySelector('.console-selector-face');
    if(face&&!reduced())scene.animation=face.animate([{opacity:0,transform:'scale(.45) rotate(-12deg)'},{opacity:1,transform:'scale(1.08)',offset:.7},{opacity:1,transform:'none'}],{duration:520,easing:'ease-out'});
  }
  function finish(){const options=scene.options;cancel();options.complete()}
  function frame(now){
    if(!scene)return;
    if(!scene.options.valid()){cancel();return}
    const suspended=scene.options.suspended();scene.note.hidden=suspended;
    if(!suspended&&scene.focusTarget){
      const target=$(scene.focusTarget);
      if(target&&!target.closest('[inert]')&&target.getClientRects().length){
        target.focus({preventScroll:true});if(document.activeElement===target)scene.focusTarget=null;
      }
    }
    if(!suspended)scene.elapsed+=Math.min(50,Math.max(0,now-scene.last));
    scene.last=now;scene.ready=scene.elapsed>=900;
    if(scene.kind==='greeting'&&scene.elapsed>=1200)emblem();
    if(scene.kind==='synthesis'&&scene.synthesized&&scene.elapsed>=1600){finish();return}
    scene.frame=requestAnimationFrame(frame);
  }
  function accept(target){
    if(!scene||scene.options.suspended()||!scene.ready)return false;
    if(scene.kind==='hello'&&target.closest?.('#slime')){
      phase('greeting','Привет! Это твой слайм.','Кажется, ты ему понравился!');scene.options.pose('greeting');scene.options.sound('happy');return true;
    }
    if(scene.kind==='emblem'&&target.closest?.('#homeMutationSelector')){
      const id=epoch;phase('synthesis','Мутация создаёт особую еду.','Смотри, как она появляется!');scene.options.pose('curious');
      Promise.resolve().then(()=>scene?.options.synthesize()).then(()=>{
        if(scene&&id===epoch)scene.synthesized=true;
      }).catch(()=>{if(scene&&id===epoch){cancel();}});
      return true;
    }
    return false;
  }
  function start(options){
    if(scene)return;
    epoch++;
    const note=document.createElement('aside');note.className='tutorial-intro-note';note.setAttribute('role','status');note.setAttribute('aria-live','polite');document.body.append(note);
    scene={options,note,frame:0,last:performance.now(),elapsed:0,ready:false,synthesized:false};
    phase('hello','Привет! Это твой слайм.','Нажми на него — познакомьтесь!');options.pose('hello');
    scene.frame=requestAnimationFrame(frame);
  }
  window.addEventListener('resize',position,{passive:true});
  window.SlimeTutorialIntro=Object.freeze({get active(){return !!scene},get instruction(){
    if(!scene||scene.options.suspended())return null;
    return scene.kind==='hello'||scene.kind==='greeting'?['#slime','']:scene.kind==='emblem'?['#homeMutationSelector','']:null;
  },get pointerVisible(){return !!scene&&['hello','emblem'].includes(scene.kind)},start,cancel,accept});
})();
