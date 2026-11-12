/* Only the foreground screen owns animated UI work. No polling loop. */
(() => {
  'use strict';
  let overlay=null,screen='home',blocked=false,key='';
  const paused=new Set();
  function isActive(element){
    if(document.hidden||blocked||!element?.isConnected||element.closest('[hidden],.hidden,[inert]'))return false;
    // The viewport's brief boot reveal belongs to the whole app. Pausing it
    // when a menu opens can leave every screen permanently translucent.
    if(element.id==='phoneViewport')return true;
    if(overlay)return overlay.contains(element);
    if(element.closest('#tutorialLayer,.tutorial-dialog,.tutorial-intro-note'))return true;
    const branch=element.closest('#homeScreen,#dropScreen');
    if(branch)return branch.id===`${screen}Screen`;
    return !!element.closest('#app,#homeRewardFlightLayer');
  }
  function sync(layer=overlay,nextScreen=screen,ad=blocked){
    overlay=layer;screen=nextScreen;blocked=ad;
    const next=`${overlay?.id||screen}:${document.hidden}:${blocked}`;
    if(next===key)return;key=next;
    const app=document.getElementById('app');
    app?.classList.toggle('ui-animation-paused',!!overlay||document.hidden||blocked);
    document.getElementById('tutorialLayer')?.classList.toggle('ui-animation-paused',!!overlay||document.hidden||blocked);
    for(const id of ['homeScreen','dropScreen','panelOverlay','adminToolsOverlay','resultOverlay','runMenuOverlay','gameCompleteOverlay','adOverlay']){
      const root=document.getElementById(id);if(!root)continue;
      root.classList.toggle('ui-animation-paused',document.hidden||blocked||(id.endsWith('Screen')?!!overlay||id!==`${screen}Screen`:root!==overlay));
    }
    for(const animation of document.getAnimations()){
      const target=animation.effect?.target;if(!target)continue;
      if(!isActive(target)&&animation.playState==='running'){animation.pause();paused.add(animation);}
    }
    for(const animation of paused){
      const target=animation.effect?.target;
      if(!target?.isConnected||['idle','finished'].includes(animation.playState)){paused.delete(animation);continue;}
      if(isActive(target)){animation.play();paused.delete(animation);}
    }
    document.dispatchEvent(new Event('slime:ui-visibility'));
  }
  document.addEventListener('visibilitychange',()=>sync());
  window.SlimeUIActivity=Object.freeze({isActive,sync});
})();
