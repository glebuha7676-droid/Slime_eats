/* Shared tap reactions. One heart per tap; all motion uses the caller's clock. */
(() => {
  'use strict';
  const images={};
  for(const [name,path]of Object.entries({finger:'assets/ui/tutorial-pointer-v3-lossless.webp',heart:'assets/ui/heart-jelly.webp'})){
    const image=new Image();image.src=window.SlimeGameAssets.versionedAsset(path);images[name]=image;
  }
  const clamp=v=>Math.max(0,Math.min(1,v));
  const lifetime=click=>click.kind==='love'?1700:500;
  function create(){return {clicks:[],lastAngle:null,pet:window.MenuPetpet.create({reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false}),petPose:null}}
  function clear(state){state.clicks.length=0;window.MenuPetpet.cancel(state.pet);state.petPose=null}
  function trigger(state,id,now){
    if(id==='petpet'){
      state.clicks.length=0;window.MenuPetpet.press(state.pet,now);
      state.pet.held=false;state.pet.until=now+780;return;
    }
    window.MenuPetpet.cancel(state.pet);state.petPose=null;
    const kind=id==='love'?'love':'laugh';
    let angle=Math.random()*Math.PI*2;
    if(state.lastAngle!==null&&Math.cos(angle-state.lastAngle)>.65)angle+=Math.PI*.8;
    state.lastAngle=angle;
    state.clicks=state.clicks.filter(click=>now-click.at<lifetime(click)).slice(-9);
    state.clicks.push({kind,at:now,angle,drift:Math.random()*2-1,phase:Math.random()*Math.PI*2});
  }
  function sample(state,now){
    state.clicks=state.clicks.filter(click=>now-click.at<lifetime(click));
    const pet=state.petPose=window.MenuPetpet.sample(state.pet,now);
    if(pet.active)return {active:true,emotion:'petting',scaleX:pet.scaleX,scaleY:pet.scaleY};
    const last=state.clicks.at(-1),age=last?now-last.at:Infinity;
    const active=age<(last?.kind==='love'?950:500);
    if(last?.kind==='love'){
      const bounce=Math.sin(clamp(age/420)*Math.PI)*.045;
      return {active,emotion:'joy',scaleX:1+bounce,scaleY:1-bounce};
    }
    // Fast contact followed by a damped jelly rebound, oriented to the finger.
    const t=Math.max(0,age-45),hit=active?Math.sin(t/58)*Math.exp(-t/115)*.20:0;
    const strength=state.pet.reducedMotion ? .25 : 1,direction=Math.cos((last?.angle||0)*2)>=0 ? 1 : -1;
    return {active,emotion:'surprised',scaleX:1-hit*direction*strength,scaleY:1+hit*direction*strength};
  }
  function draw(ctx,state,{x,y,radius,now,reducedMotion=false}){
    ctx.save();
    if(state.petPose?.active)window.MenuPetpet.drawHand(ctx,state.petPose,{x,top:y-radius*.98,radius});
    for(const click of state.clicks){
      const age=now-click.at;
      if(click.kind==='love'){
        const p=age/1700;if(p<0||p>=1||!images.heart.complete||!images.heart.naturalWidth)continue;
        const sway=reducedMotion?0:Math.sin(p*Math.PI*2.6+click.phase)-Math.sin(click.phase);
        const px=x+radius*(click.drift*.30+sway*.16+click.drift*p*.30);
        const py=y-radius*(.25+p*(reducedMotion ? .55 : 1.50));
        const appear=1-Math.pow(1-clamp(p/.14),3),fade=1-clamp((p-.64)/.36);
        const size=radius*.34*appear*(1+Math.sin(clamp(p/.22)*Math.PI)*.10);
        ctx.save();ctx.globalAlpha=appear*fade;ctx.translate(px,py);
        ctx.rotate(reducedMotion?0:Math.sin(p*Math.PI*2.6+click.phase)*.32+click.drift*p*.22);
        ctx.scale(reducedMotion?1:.92+Math.cos(p*Math.PI*2.6+click.phase)*.08,1);
        ctx.drawImage(images.heart,-size/2,-size/2,size,size);ctx.restore();
      }else{
        const p=age/340;if(p<0||p>=1||!images.finger.complete||!images.finger.naturalWidth)continue;
        const contact=clamp(p/.23),withdraw=clamp((p-.35)/.65);
        const distance=radius*(1.32-.80*(1-Math.pow(1-contact,3))+.98*withdraw*withdraw);
        const px=x+Math.cos(click.angle)*distance,py=y+Math.sin(click.angle)*distance*.82,size=radius*1.15;
        ctx.save();ctx.globalAlpha=Math.min(1,p*15,(1-p)*5);ctx.translate(px,py);ctx.rotate(click.angle-Math.PI/4);
        ctx.drawImage(images.finger,-size*.18,-size*.14,size,size);ctx.restore();
      }
    }
    ctx.restore();
  }
  window.SlimeTapEmotions=Object.freeze({create,clear,trigger,sample,draw});
})();
