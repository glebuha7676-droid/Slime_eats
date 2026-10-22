/* Modular home artwork and responsive controls. Saved gameplay remains in game.js. */
(() => {
  'use strict';
  let state, observer, frame=0, ignoreClickUntil=0;
  const $=id=>document.getElementById(id);
  const roman=stage=>['I','II','III'][Math.max(0,stage-1)];
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;layout();});}
  // Screen boxes are measured in CSS pixels. Each separate sprite has its own
  // source window; transparent export margins never affect the control layout.
  function place(element,box,app){
    if(!element?.offsetParent)return;
    const parent=element.offsetParent.getBoundingClientRect(),[x,y,w,h]=box;
    for(const[k,v]of Object.entries({position:'absolute',left:`${app.left+x-parent.left}px`,top:`${app.top+y-parent.top}px`,width:`${w}px`,height:`${h}px`}))element.style.setProperty(k,v,'important');
  }
  function sprite(id,box,source,size,app){
    const e=$(id);if(!e)return;place(e,box,app);
    const sx=box[2]/source[2],sy=box[3]/source[3];
    e.style.backgroundSize=`${size[0]*sx}px ${size[1]*sy}px`;
    e.style.backgroundPosition=`${-source[0]*sx}px ${-source[1]*sy}px`;
  }
  function layout(){
    if(document.body.dataset.screen!=='home')return;
    const app=$('app')?.getBoundingClientRect(),root=$('homeScreen');if(!app?.width||!root)return;
    const w=app.width,h=app.height,u=w/390;
    const lower=Math.min(w*1.32,h*(h<650?.58:.62)),top=h-lower;
    const bay=lower*.30,railY=top+lower*.316,railH=lower*.125;
    root.style.setProperty('--station-unit',`${w/919}px`);
    root.style.setProperty('--station-font-unit',`${u}px`);
    place($('stationRoom'),[0,0,w,top+20],app);
    sprite('stationConsole',[0,top-8,w,lower+12],[12,28,1145,1285],[1169,1345],app);
    // Portal and pedestal retain one scale and one perspective.
    const portalW=w*1.06,portalH=portalW*1070/1470,portalY=top-portalH*.91;
    sprite('stationPedestal',[(w-portalW)/2,portalY,portalW,portalH],[0,0,1470,1070],[1470,1070],app);
    place($('stationPortalCore'),[w*.316,portalY+portalH*.136,w*.384,w*.384],app);
    // Barrel is a true separate object. The food target is only its clear window.
    const barrelW=w*.435,barrelH=Math.min(bay*.96,barrelW*1060/1360),barrelX=w*.035,barrelY=top+bay*.06;
    sprite('stationBarrel',[barrelX,barrelY,barrelW,barrelH],[12,65,1360,1000],[1394,1128],app);
    place($('foodChoices'),[barrelX+barrelW*.255,barrelY+barrelH*.22,barrelW*.49,barrelH*.58],app);
    place($('homeMutationInfo'),[w*.475,top+bay*.075,w*.475,bay*.86],app);
    place($('conveyorDispensers'),[w*.19,railY,w*.62,railH],app);
    const arrowW=Math.max(44,w*.125),arrowH=railH*1.16;
    place($('homeMutationPrev'),[w*.04,railY-(arrowH-railH)/2,arrowW,arrowH],app);
    place($('homeMutationNext'),[w*.96-arrowW,railY-(arrowH-railH)/2,arrowW,arrowH],app);
    place($('homeMutationFrame'),[w/2-railH*.56,railY-railH*.06,railH*1.12,railH*1.12],app);
    const worldBox=[w*.065,top+lower*.483,w*.87,lower*.30];
    sprite('stationWorldFrame',worldBox,[20,110,1780,650],[1824,862],app);
    place($('worldCarousel'),[worldBox[0]+worldBox[2]*.064,worldBox[1]+worldBox[3]*.15,worldBox[2]*.873,worldBox[3]*.70],app);
    const wa=Math.max(42,w*.12),way=worldBox[1]+worldBox[3]/2-wa*.55;
    place($('worldPrevBtn'),[w*.035,way,wa,wa*1.1],app);
    place($('worldNextBtn'),[w*.965-wa,way,wa,wa*1.1],app);
    const heading=root.querySelector('.world-terminal-heading');
    place(heading,[w*.32,worldBox[1]-worldBox[3]*.035,w*.36,Math.max(23,worldBox[3]*.20)],app);
    const playBox=[w*.09,top+lower*.807,w*.82,lower*.18];
    sprite('stationPlayFrame',playBox,[90,65,1990,605],[2172,724],app);
    place($('worldStartBtn'),[playBox[0]+playBox[2]*.063,playBox[1]+playBox[3]*.155,playBox[2]*.874,playBox[3]*.68],app);
    const shell=root.querySelector('.world-terminal-shell');
    for(const[name,id]of Object.entries({screen:'worldCarousel',play:'worldStartBtn',previous:'worldPrevBtn',next:'worldNextBtn'})){
      const e=$(id);if(!e||!shell)continue;
      for(const key of ['left','top','width','height'])shell.style.setProperty(`--terminal-${name}-${key}`,e.style.getPropertyValue(key));
    }
    const playground=root.querySelector('.slime-playground'),ground=root.querySelector('.slime-ground-shadow');
    if(playground&&ground){
      const r=ground.getBoundingClientRect(),x=parseFloat(playground.style.getPropertyValue('--station-slime-x'))||0,y=parseFloat(playground.style.getPropertyValue('--station-slime-y'))||0;
      playground.style.setProperty('--station-slime-x',`${x+app.left+w/2-r.left-r.width/2}px`);
      playground.style.setProperty('--station-slime-y',`${y+app.top+portalY+portalH*.72-r.top-r.height/2}px`);
    }
    const buttonSize=Math.max(70,Math.min(100,w*.235)),buttonY=Math.max(64,top-buttonSize-70*u);
    for(const[selector,right]of [['.mutation-lab-button',false],['#wardrobeBtn',true]]){
      const e=root.querySelector(selector);if(!e)continue;
      for(const[k,v]of Object.entries({position:'absolute',gridColumn:'auto',gridRow:'auto',display:'grid',right:'auto',bottom:'auto',minWidth:'0',minHeight:'0',margin:'0',transform:'none'}))e.style.setProperty(k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),v,'important');
      place(e,[right?w-buttonSize-7*u:7*u,buttonY,buttonSize,buttonSize],app);
    }
    window.SlimeFoodGrounding?.schedule();
  }
  function step(direction){
    const owned=state?.mutations.filter(m=>m.available)||[];
    if(owned.length<2||state.busy)return;
    const i=owned.findIndex(m=>m.id===state.selected);
    state.onSelect(owned[(i+direction+owned.length)%owned.length].id);
  }
  function render(next){
    state=next;
    const root=$('homeScreen'),host=$('conveyorDispensers');if(!root||!host)return;
    if(!$('homeStationArt')){
      const art=document.createElement('div');art.id='homeStationArt';art.setAttribute('aria-hidden','true');
      art.innerHTML='<i id="stationRoom"></i><i id="stationPortalCore"></i><i id="stationPedestal"></i><i id="stationConsole"></i><i id="stationBarrel"></i><i id="stationWorldFrame"></i><i id="stationPlayFrame"></i>';
      $('app').prepend(art);
      root.querySelector('.world-terminal-shell').append($('stationWorldFrame'),$('stationPlayFrame'));
      for(const id of ['homeMutationPrev','homeMutationNext','worldPrevBtn','worldNextBtn'])$(id).innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M12 8 L23 16 L12 24"/></svg>';
      const activeFrame=document.createElement('i');activeFrame.id='homeMutationFrame';activeFrame.setAttribute('aria-hidden','true');$('conveyor').append(activeFrame);
      observer=new ResizeObserver(schedule);observer.observe($('app'));
      window.addEventListener('resize',schedule);
      host.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(event.key.startsWith('Arrow'))step(event.key==='ArrowLeft'?-1:1);else{const owned=state.mutations.filter(m=>m.available);if(owned.length)state.onSelect(owned[event.key==='Home'?0:owned.length-1].id);}});
      let startX=0,startY=0;
      host.addEventListener('pointerdown',event=>{startX=event.clientX;startY=event.clientY;});
      host.addEventListener('pointerup',event=>{const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.abs(dx)>25&&Math.abs(dx)>Math.abs(dy)){ignoreClickUntil=performance.now()+300;step(dx>0?-1:1);}});
      $('homeMutationPrev').addEventListener('click',()=>step(-1));
      $('homeMutationNext').addEventListener('click',()=>step(1));
      $('homeMutationInfo').addEventListener('click',()=>state.onDetails(state.selected));
    }
    const owned=state.mutations.filter(m=>m.available),index=state.mutations.findIndex(m=>m.id===state.selected),count=state.mutations.length;
    for(const [i,mutation]of state.mutations.entries()){
      let button=host.querySelector(`[data-home-mutation="${mutation.id}"]`);
      if(!button){button=document.createElement('button');button.type='button';button.dataset.homeMutation=mutation.id;button.className='home-mutation-medal';button.innerHTML='<img alt=""><span class="home-mutation-lock" aria-hidden="true">?</span>';host.append(button);button.addEventListener('click',()=>{if(performance.now()<ignoreClickUntil)return;const m=state.mutations.find(m=>m.id===button.dataset.homeMutation);if(m.available)state.onSelect(m.id);else state.onDetails(m.id);});}
      let offset=(i-index+count)%count;if(offset>count/2)offset-=count;
      button.style.setProperty('--mutation-offset',offset);
      // The generic game's press transform must not replace centering.
      button.style.setProperty('transform','translate(-50%,-50%)','important');
      button.classList.toggle('is-current',offset===0);button.classList.toggle('is-locked',!mutation.available);
      button.classList.toggle('is-outside',Math.abs(offset)>1);
      button.setAttribute('aria-pressed',String(offset===0));button.setAttribute('aria-hidden',String(Math.abs(offset)>1));
      button.setAttribute('aria-label',mutation.available?mutation.name:'Открыть новую мутацию');button.tabIndex=offset===0?0:-1;
      button.disabled=state.busy;
      const image=button.querySelector('img');if(image.getAttribute('src')!==mutation.image)image.src=mutation.image;
    }
    for(const id of ['homeMutationPrev','homeMutationNext'])$(id).disabled=state.busy||owned.length<2;
    const info=$('homeMutationInfo'),mutation=state.mutations[index]||state.mutations[0];
    info.classList.toggle('is-ready',!!state.task?.ready);info.classList.toggle('is-empty',!state.stage);info.disabled=state.busy;
    const name=state.stage?mutation.name:'МУТАЦИЯ';
    info.querySelector('.station-mutation-name').textContent=name;
    info.classList.toggle('is-long-name',name.length>10);
    info.querySelector('.station-stage').textContent=state.stage?roman(state.stage):'—';
    const task=state.task,max=task?.max;
    info.querySelector('.station-task-kicker').textContent=!state.stage?'ЛАБОРАТОРИЯ':max?'РАЗВИТИЕ':task.ready?`ОТКРЫТЬ ${roman(task.targetStage)}`:`РАЗВИТИЕ · ДО ${roman(task.targetStage)}`;
    info.querySelector('.station-task-label').textContent=!state.stage?'Открой первую мутацию':max?'Все стадии открыты':task.label;
    info.querySelector('.station-task-counter').textContent=!state.stage?'?':max?'✓':`${Math.min(task.current,task.target)} / ${task.target}`;
    info.querySelector('.station-task-fill').style.width=`${!state.stage?0:max?100:task.percent}%`;
    info.style.setProperty('--station-mutation-color',state.color||'#23c7ed');
    info.setAttribute('aria-label',`${name}. ${info.querySelector('.station-task-label').textContent}. Посмотреть развитие`);
    schedule();
  }
  window.SlimeHomeStation=Object.freeze({render,layout,schedule});
})();
