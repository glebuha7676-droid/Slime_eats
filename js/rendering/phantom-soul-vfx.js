/* White spectral wisps painted as soft cached light, not illustrated ghost characters. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx,heads=[],tails=[],halos=[];
  const COLORS=['#b9f5e9','#c2ddff','#e2cfff'];
  let prepared=false;
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function prepare(){
    if(prepared)return;prepared=true;
    for(const color of COLORS){
      const halo=canvas(96,96),h=halo.getContext('2d'),g=h.createRadialGradient(48,48,1,48,48,46);
      g.addColorStop(0,'#f6ffffb8');g.addColorStop(.22,color+'9c');g.addColorStop(.58,color+'3a');g.addColorStop(1,color+'00');h.fillStyle=g;h.fillRect(0,0,96,96);halos.push(halo);
      const head=canvas(96,96),x=head.getContext('2d');x.globalAlpha=.45;x.drawImage(halo,0,0);x.globalAlpha=1;x.translate(48,48);
      const body=x.createRadialGradient(-1,-4,0,0,1,18);body.addColorStop(0,'#fff');body.addColorStop(.30,'#f7fffff5');body.addColorStop(.68,color+'cf');body.addColorStop(1,color+'00');
      x.fillStyle=body;x.shadowColor=color;x.shadowBlur=7;
      x.beginPath();x.moveTo(0,-14);x.bezierCurveTo(10,-15,15,-4,10,7);x.bezierCurveTo(7,13,10,19,6,23);x.bezierCurveTo(7,12,-1,13,-2,20);x.bezierCurveTo(-5,16,-11,11,-11,2);x.bezierCurveTo(-12,-6,-9,-14,0,-14);x.fill();
      x.shadowBlur=0;x.globalAlpha=.9;x.fillStyle='#fff';x.beginPath();x.ellipse(-1,-3,4,7,.10,0,Math.PI*2);x.fill();heads.push(head);
      const tail=canvas(48,160),t=tail.getContext('2d');t.drawImage(halo,0,0,48,160);t.globalCompositeOperation='lighter';t.drawImage(halo,14,-8,20,176);
      const fade=t.createLinearGradient(0,0,0,160);fade.addColorStop(0,'#fff0');fade.addColorStop(.18,'#ffffff30');fade.addColorStop(.65,'#ffffffcf');fade.addColorStop(1,'#fff');
      t.globalCompositeOperation='destination-in';t.fillStyle=fade;t.fillRect(0,0,48,160);tails.push(tail);
    }
  }
  function trail(c,a,b,camera,width,alpha,tint){
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<.6)return;
    VFX.stamp(c,tails[tint%3],(a.x+b.x)/2,(a.y+b.y)/2-camera,width,length+width*.95,alpha,Math.atan2(dy,dx)-Math.PI/2);
  }
  function head(c,p,previous,camera,size,alpha,tint){
    const dx=p.x-previous.x,dy=p.y-previous.y,angle=Math.hypot(dx,dy)>.1?Math.atan2(dy,dx)+Math.PI/2:0;
    VFX.stamp(c,heads[tint%3],p.x,p.y-camera,size,size,alpha,angle);
  }
  window.SlimePhantomSoulVfx=Object.freeze({prepare,trail,head,ready:()=>prepared,halo:(i=0)=>halos[i%3]});
})();

