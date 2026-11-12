/* Block-fire palette and soft baked light; coherent animated flame sheets. */
(() => {
  'use strict';
  const VFX=window.SlimeCoreVfx;
  const TAU=Math.PI*2,FRAMES=24,mantles=[],fronts=[],streams=[],crowns=[];
  const AURA={w:224,h:288,x:112,y:224},FRONT_AURA={w:128,h:144,x:64,y:100};
  const CROWN={w:192,h:128,x:96,y:82};
  let halo,ember,whiteEmber,hot,vignette;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function radial(size,stops){
    const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    for(const [p,col]of stops)g.addColorStop(p,col);x.fillStyle=g;x.fillRect(0,0,size,size);return c;
  }
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function mantleFrame(angle){
    const back=canvas(AURA.w,AURA.h),front=canvas(FRONT_AURA.w,FRONT_AURA.h);
    function tongue(x,rootX,rootY,height,width,seed,alpha=1){
      const centre=q=>rootX*(1-q*.24)+Math.sin(q*5-angle+seed)*q*(4+q*8);
      const trace=scale=>{
        const points=[];for(let i=0;i<=24;i++){const q=i/24,emerge=.08+.92*smooth(q/.20);points.push([centre(q),rootY-q*height,width*emerge*Math.pow(1-q,.8)*(.85+.15*Math.sin(q*8-angle+seed))*scale]);}
        x.beginPath();x.moveTo(points[0][0]-points[0][2],points[0][1]);
        for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];x.quadraticCurveTo(a[0]-a[2],a[1],(a[0]-a[2]+b[0]-b[2])/2,(a[1]+b[1])/2);}
        const tip=points.at(-1);x.lineTo(tip[0],tip[1]);
        for(let i=points.length-2;i>=0;i--){const a=points[i+1],b=points[i];x.quadraticCurveTo(a[0]+a[2],a[1],(a[0]+a[2]+b[0]+b[2])/2,(a[1]+b[1])/2);}
        x.quadraticCurveTo(rootX,rootY+8,points[0][0]-points[0][2],points[0][1]);x.closePath();x.fill();
      };
      const outer=x.createLinearGradient(0,rootY-height,0,rootY+10);outer.addColorStop(0,'#ff682000');outer.addColorStop(.14,'#ff571a88');outer.addColorStop(.45,'#ff7416ed');outer.addColorStop(1,'#ffc32b');
      x.save();x.globalAlpha=alpha;x.shadowColor='#ff8b21';x.shadowBlur=11;x.fillStyle=outer;trace(1);
      const gold=x.createLinearGradient(0,rootY-height*.85,0,rootY+5);gold.addColorStop(0,'#ffbc3200');gold.addColorStop(.27,'#ffc63799');gold.addColorStop(.62,'#ffe56ae6');gold.addColorStop(1,'#fff5bc');
      x.shadowBlur=5;x.fillStyle=gold;trace(.65);
      const heart=x.createLinearGradient(0,rootY-height*.6,0,rootY+5);heart.addColorStop(0,'#fff9d100');heart.addColorStop(.5,'#fff8c8b0');heart.addColorStop(1,'#ffffed');x.shadowBlur=3;x.fillStyle=heart;trace(.25);x.restore();
    }
    const x=back.getContext('2d');x.translate(AURA.x,AURA.y);
    const roots=[-14,14,-8,8,0],heights=[66,78,119,111,143],widths=[18,18,18,18,20];
    for(let i=0;i<roots.length;i++)tongue(x,roots[i],8-Math.abs(roots[i])*.12,heights[i]+Math.sin(angle+i*1.7)*17,widths[i]*(1+Math.sin(angle*2+i)*.1),i*1.7,.85);
    const base=x.createRadialGradient(0,-6,4,0,-6,45);base.addColorStop(0,'#ffffddc0');base.addColorStop(.5,'#ffdc607a');base.addColorStop(.8,'#ff861c32');base.addColorStop(1,'#ff681500');x.fillStyle=base;x.fillRect(-48,-54,96,96);
    const f=front.getContext('2d');f.translate(FRONT_AURA.x,FRONT_AURA.y);
    for(const side of [-1,1])tongue(f,side*22,5,43+Math.sin(angle+side)*9,5.5,side*2.1,.42);
    // Roots sit inside the body silhouette; only the upper flanks remain in front.
    f.globalCompositeOperation='destination-out';const mask=f.createRadialGradient(0,-4,17,0,-4,28);mask.addColorStop(0,'#000');mask.addColorStop(1,'#0000');f.fillStyle=mask;f.fillRect(-29,-33,58,58);
    return [back,front];
  }
  function streamFrame(angle){
    const c=canvas(160,320),x=c.getContext('2d');
    const centre=f=>80+Math.sin(f*8-angle)*f*6+Math.sin(f*15-angle*2)*f*3;
    const width=(f,side)=>6+f**.68*(44+Math.sin(f*18-angle*2+side*.8)*7+Math.sin(f*29-angle*3+side)*3);
    const trace=scale=>{
      x.beginPath();
      for(let i=0;i<=40;i++){
        const f=i/40,y=10+f*296,px=centre(f)-width(f,-1)*scale;
        if(i===0)x.moveTo(px,y);else x.lineTo(px,y);
      }
      x.quadraticCurveTo(centre(1),321,centre(1)+width(1,1)*scale,306);
      for(let i=39;i>=0;i--){const f=i/40;x.lineTo(centre(f)+width(f,1)*scale,10+f*296);}
      x.closePath();x.fill();
    };
    const rim=x.createLinearGradient(0,0,160,0);
    for(const [p,col]of [[0,'#ff3b0c00'],[.12,'#ff3b0c'],[.38,'#ff7c08'],[.62,'#ff7c08'],[.88,'#ff3b0c'],[1,'#ff3b0c00']])rim.addColorStop(p,col);
    x.shadowColor='#ff7b0c';x.shadowBlur=12;x.fillStyle=rim;trace(1);
    const gold=x.createLinearGradient(0,0,160,0);gold.addColorStop(0,'#ff9b0c');gold.addColorStop(.36,'#ffdc28');gold.addColorStop(.52,'#ffec68');gold.addColorStop(.70,'#ffcf1f');gold.addColorStop(1,'#ff8e08');
    x.shadowBlur=5;x.fillStyle=gold;trace(.70);
    const core=x.createLinearGradient(0,0,0,320);core.addColorStop(0,'#fffbd2');core.addColorStop(.36,'#fff8aedb');core.addColorStop(.75,'#fff3a1ed');core.addColorStop(1,'#ffe86d9c');
    x.shadowBlur=0;x.fillStyle=core;trace(.30);
    // Small hot currents travel inside the jet, without sliding whole flame copies.
    x.globalAlpha=.37;
    for(let i=0;i<4;i++){
      const f=(angle/TAU+i/4)%1,y=10+f*296,sz=2+f*3;x.globalAlpha=.37*Math.sin(f*Math.PI);
      x.save();x.translate(centre(f)+Math.sin(i*3.1)*width(f,1)*.36,y);x.scale(sz,15+f*16);
      const light=x.createRadialGradient(0,0,0,0,0,1);light.addColorStop(0,'#ffffe5');light.addColorStop(1,'#ffffe500');x.fillStyle=light;x.fillRect(-1,-1,2,2);x.restore();
    }
    return c;
  }
  function crownFrame(angle){
    const c=canvas(CROWN.w,CROWN.h),x=c.getContext('2d');
    const trace=(sx,sy)=>{
      x.save();x.translate(CROWN.x,CROWN.y);x.scale(sx,sy);
      const points=[[-76,3],[-71,-9]];
      for(let i=0;i<=12;i++){
        const f=i/12,arch=Math.sin(f*Math.PI),ripple=Math.sin(f*13+angle)*7+Math.sin(f*23-angle*2)*3;
        points.push([-64+128*f,-(17+arch*27+Math.sin(f*Math.PI*3)**2*10+ripple*arch)]);
      }
      points.push([71,-9],[76,3],[66,12],[40,18],[0,20],[-40,18],[-66,12]);
      // A closed, continuous spline: rounded curling ends instead of vertical polygon walls.
      x.beginPath();x.moveTo(...points[0]);
      for(let i=0;i<points.length;i++){
        const a=points[(i-1+points.length)%points.length],b=points[i],d=points[(i+1)%points.length],e=points[(i+2)%points.length];
        x.bezierCurveTo(b[0]+(d[0]-a[0])/6,b[1]+(d[1]-a[1])/6,d[0]-(e[0]-b[0])/6,d[1]-(e[1]-b[1])/6,d[0],d[1]);
      }
      x.closePath();x.fill();x.restore();
    };
    const g=x.createLinearGradient(0,15,0,112);g.addColorStop(0,'#ff3b0c');g.addColorStop(.6,'#ff8710');g.addColorStop(1,'#ffbb13');
    x.shadowColor='#ff7b0c';x.shadowBlur=10;x.filter='blur(.8px)';x.fillStyle=g;trace(1,1);
    x.shadowBlur=4;x.filter='blur(.5px)';x.fillStyle='#ffdc28';trace(.80,.78);x.shadowBlur=0;x.filter='none';
    const heart=x.createRadialGradient(96,79,2,96,79,45);heart.addColorStop(0,'#fffbd2');heart.addColorStop(.6,'#fff8aecd');heart.addColorStop(1,'#ffed7c00');x.fillStyle=heart;x.fillRect(40,20,112,105);
    const fade=x.createLinearGradient(0,0,0,CROWN.h);fade.addColorStop(0,'#fff0');fade.addColorStop(.12,'#fff');fade.addColorStop(.64,'#fff');fade.addColorStop(1,'#fff0');
    x.globalCompositeOperation='destination-in';x.fillStyle=fade;x.fillRect(0,0,CROWN.w,CROWN.h);return c;
  }
  function prepare(){
    if(halo)return;
    vignette=radial(256,[[0,'#06162500'],[.46,'#06162500'],[1,'#061625df']]);
    halo=radial(128,[[0,'#ffe85780'],[.28,'#ffb62a59'],[.65,'#ff7b0c24'],[1,'#ff7b0c00']]);
    hot=radial(128,[[0,'#fffbd2ed'],[.18,'#fff8aec4'],[.4,'#ffdc2870'],[.7,'#ff7b0c24'],[1,'#ff7b0c00']]);
    ember=canvas(24,40);const x=ember.getContext('2d');x.drawImage(halo,0,4,24,32);x.fillStyle='#ffac1c';x.beginPath();x.ellipse(12,20,2.5,5,-.2,0,TAU);x.fill();x.fillStyle='#fff8ae';x.beginPath();x.ellipse(12,19,1.2,3,-.2,0,TAU);x.fill();
    whiteEmber=radial(32,[[0,'#fffff5'],[.16,'#ffffe7ef'],[.36,'#ffe59b92'],[.7,'#ff9d1920'],[1,'#ff7b0c00']]);
    for(let i=0;i<FRAMES;i++){const a=i/FRAMES*TAU,[back,front]=mantleFrame(a);mantles.push(back);fronts.push(front);streams.push(streamFrame(a));crowns.push(crownFrame(a));}
    for(const frames of [mantles,fronts,streams,crowns]){frames.blend=canvas(frames[0].width,frames[0].height);frames.ctx=frames.blend.getContext('2d');}
  }
  const stamp=(c,image,x,y,w,h,angle=0,alpha=1)=>VFX.stamp(c,image,x,y,w,h,alpha,angle);
  function animated(c,frames,time,x,y,w,h,alpha){
    if(alpha<=.002||!VFX.visible(x,y,w,h))return;
    VFX.blend(frames,frames.blend,time,FRAMES);
    stamp(c,frames.blend,x,y,w,h,0,alpha);
  }
  function aura(c,e,s,y,t,p,low){
    const r=s.radius,x=s.x,scale=r/30*(.40+.60*Math.sqrt(p));
    stamp(c,halo,x,y-r*.8,r*(3+p*5),r*(3+p*6),0,p*.62);
    animated(c,mantles,t/1380,x+(AURA.w/2-AURA.x)*scale*.80,y+(AURA.h/2-AURA.y)*scale,AURA.w*scale*.80,AURA.h*scale,p*.95);
    c.save();c.globalCompositeOperation='lighter';stamp(c,hot,x,y-r*.6,r*(1.5+p*1.7),r*(1.6+p*2.7),0,p*.48);c.restore();
    const count=low?12:26+Math.round(p*14);
    for(let i=0;i<count;i++){
      const q=(t/(1050+i%7*125)+i*.317)%1,side=i%2?1:-1,seed=(i*.618)%1;
      const drift=Math.sin(q*5.5+i*2.1)*q*r*.34,px=x+side*r*(.42+seed*.62)*(1-q*.22)+drift+side*q*q*r*.35;
      const py=y+r*.12-Math.pow(q,1.15)*r*(2.6+p*(3.4+seed*1.4));
      const size=(2.3+p*2.7)*(1-q*.75)*(.65+seed*.7),fade=smooth(q/.12)*(1-smooth((q-.55)/.45));
      stamp(c,i%4===0?whiteEmber:ember,px,py,size*(i%4===0?1.5:1),size*(i%4===0?1.5:2.0),side*(.1+Math.sin(q*4+i)*.2),Math.sqrt(p)*fade*(.65+seed*.3));
    }
  }
  function jet(c,run,e,y,t,low){
    const s=run.slime,p=e.power,q=e.jet,start=y+s.radius*.55,end=run.coreArena.surfaceY-run.cameraY,reach=clamp(e.phaseTime/100),length=(end-start)*reach;
    if(length<2)return;
    const width=22+p*254;
    stamp(c,halo,s.x,start+length*.58,width*1.15,length*1.15,0,q*.68);
    animated(c,streams,t/380,s.x,start+length*.5,width,length*1.06,q);
    stamp(c,hot,s.x,start,18+p*40,25+p*64,0,q*.65);
    for(let i=0;i<(low?7:17);i++){
      const f=(t/(430+i%3*65)+i*.237)%1,side=i%2?1:-1;
      const px=s.x+side*(width*.15+f*width*.31)+Math.sin(i+t/180)*4,py=start+f*length;
      stamp(c,ember,px,py,3+p*4,8+p*7,side*.22,q*Math.sin(f*Math.PI)*.85);
    }
    if(!e.hit)return;
    const age=(e.finisher?(e.attackAge||0):e.elapsed-e.hitAt);
    stamp(c,hot,run.coreArena.x,end,80+p*240,45+p*110,0,q*.92);
    const h=35+p*95,drawH=h*CROWN.h/112;
    animated(c,crowns,t/510,s.x,end+(CROWN.h/2-CROWN.y)/112*h,(65+p*295)*87/76,drawH,q*.92);
    for(let i=0;i<(low?5:12);i++){
      const f=(age/(480+i%3*95)+i*.193)%1,side=i%2?1:-1;
      stamp(c,ember,s.x+side*f*(22+p*165),end-Math.sin(f*Math.PI)*(22+p*85),4+p*4,8+p*8,side*.5,q*(1-f)*.85);
    }
  }
  function draw(c,run,front=false){
    const e=run.coreEncounter;if(!e?.fire||run.evacuation||!VFX.onScreen(run))return;prepare();
    const s=run.slime,y=s.y-run.cameraY,t=VFX.clock(e)*(e.reduced?.2:1),p=clamp(e.aura,0,e.finisher?1.5:1),low=!!e.lowPower||e.reduced;
    if(p<.002&&!e.jet)return;
    c.save();
    if(!front){aura(c,e,s,y,t,p,low);if(e.phase==='burn'&&e.jet>.001)jet(c,run,e,y,t,low);}
    else{
      const scale=s.radius/30*(.40+.60*Math.sqrt(p));
      animated(c,fronts,t/1380,s.x,y+(FRONT_AURA.h/2-FRONT_AURA.y)*scale,FRONT_AURA.w*scale,FRONT_AURA.h*scale,p*.75);
    }
    c.restore();
  }
  function backdrop(c,run){
    const e=run.coreEncounter;if(!e?.fire||run.evacuation||!VFX.onScreen(run))return;prepare();
    const amount=e.phase==='release'?.38:['approach','overdrive','armed'].includes(e.phase)?e.transfer*.21:e.phase==='burn'?.21*(1-clamp(e.phaseTime/160)):0;
    if(amount>.001){c.save();c.globalAlpha=amount;c.drawImage(vignette,0,0,440,840);c.restore();}
  }
  window.SlimeFireCoreStrike=Object.freeze({prepare,draw,backdrop});
})();
