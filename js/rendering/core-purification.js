/* Final hit only: the contaminated shell fractures, then reveals the living planetary core. */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);},TAU=Math.PI*2;
  const TIMES=Object.freeze({pressure:1900,tension:650,burst:600,evacuate:550,hold:2100});
  const PALETTES=Object.freeze({
    source:['#322348','#7850af','#bde742','#fbffdc'],
    home:['#113d38','#43db85','#b4ff8a','#f1ffdb'],
    candy:['#67235e','#fa61bb','#ffabd9','#fff0fb'],
    magma:['#641e29','#ff4b47','#ffab74','#fff1d2'],
    desert:['#164779','#4dbdff','#a7e7ff','#effdff']
  });
  let art,key,source;const pieces=[],skyPieces=[],sourcePieces=[];
  const active=run=>!!run?.coreEncounter?.purification;
  const revealed=run=>active(run)&&run.coreEncounter.purification.burstAt!=null;
  const finished=run=>!!run?.coreEncounter?.purification?.finished;
  const evacuationReady=run=>{const f=run?.coreEncounter?.purification;return !!f&&f.burstAt!=null&&f.age-f.burstAt>=TIMES.evacuate;};
  const planetId=run=>run.planetId||(typeof window!=='undefined'&&window.SlimePlanetCampaign?.forWorld(run.worldId)?.id)||({1:'home',3:'candy',4:'magma',5:'desert'}[run.worldId])||'home';
  const palette=id=>(typeof window!=='undefined'&&window.SlimeCoreFractures?.palette(id))||PALETTES[id]||PALETTES.home;
  function canvas(w,h=w){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function field(size,stops){const c=canvas(size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [p,color]of stops)g.addColorStop(p,color);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function shellPieces(sky=false){
    const anomaly=sky==='source';
    const shell=anomaly?window.SlimeCoreEncounter?.shellArt(6,25):sky?window.SlimeCoreEncounter?.shellArt(5,25):source;
    const parts=anomaly?sourcePieces:sky?skyPieces:pieces;
    if(anomaly&&shell===window.SlimeCoreEncounter?.shellArt(1))return parts;
    if(!shell?.width||(!sky&&!source.complete)||parts.length)return parts;
    for(let i=0;i<24;i++){
      const col=i%8,row=Math.floor(i/8),nx=-.88+col*.25,ny=-Math.sqrt(Math.max(.1,1-nx*nx))+.12+row*.20;
      const c=canvas(96),x=c.getContext('2d');
      x.beginPath();x.moveTo(13,9);x.lineTo(59,3);x.lineTo(91,29);x.lineTo(79,76);x.lineTo(37,93);x.lineTo(5,63);x.closePath();x.clip();
      const sx=clamp((nx+1)/2-.075,0,.85)*shell.width,sy=clamp((ny+1)/2-.075,0,.85)*shell.height;
      x.drawImage(shell,sx,sy,shell.width*.15,shell.height*.15,0,0,96,96);
      parts.push({image:c,nx,ny,size:.18+(i*.373%1)*.13,spin:(i%2?1:-1)*(1.1+i%4*.4)});
    }
    return parts;
  }
  function prepare(id='home'){
    if(typeof document==='undefined')return;
    if(!source){source=new Image();source.decoding='async';source.onload=()=>shellPieces();const path='assets/vfx/hostile-cores-v27/shell-25.webp';source.src=window.SlimeGameAssets?.versionedAsset(path)||path;}
    if(art&&key===id)return;key=id;const colors=palette(id),[dark,mid,light,white]=colors;
    const core=canvas(768),x=core.getContext('2d');x.beginPath();x.arc(384,384,369,0,TAU);x.clip();
    const g=x.createRadialGradient(290,220,15,384,384,380);
    for(const [p,color]of [[0,white],[.25,light],[.57,mid],[.86,mid],[1,dark]])g.addColorStop(p,color);x.fillStyle=g;x.fillRect(0,0,768,768);
    const vapor=field(128,[[0,white+'a0'],[.4,light+'55'],[1,mid+'00']]);
    for(let i=0;i<14;i++){x.save();x.globalAlpha=.12+(i%3)*.025;x.translate(384+Math.cos(i*2.399)*(70+i%4*60),384+Math.sin(i*2.399)*(65+i%3*74));x.rotate(i*1.7);x.drawImage(vapor,-170,-70,340,140);x.restore();}
    const rim=x.createRadialGradient(384,384,300,384,384,373);rim.addColorStop(0,white+'00');rim.addColorStop(.80,light+'00');rim.addColorStop(.94,light+'a0');rim.addColorStop(1,white+'df');x.fillStyle=rim;x.fillRect(0,0,768,768);
    const fractures=window.SlimeCoreFractures;
    const cracks=Array.from({length:16},(_,step)=>fractures.frame(id,(step+1)/16));
    const ray=id==='source'?null:fractures.ray(id);
    const corona=canvas(896),cx=corona.getContext('2d'),cg=cx.createRadialGradient(448,448,310,448,448,444);
    for(const [p,color]of [[0,mid+'00'],[.24,mid+'18'],[.43,light+'a0'],[.53,light+'6a'],[.76,mid+'25'],[1,mid+'00']])cg.addColorStop(p,color);cx.fillStyle=cg;cx.fillRect(0,0,896,896);
    art={core,cracks,ray,corona,colors,halo:field(256,[[0,light+'e0'],[.34,mid+'90'],[.65,mid+'30'],[1,mid+'00']]),
      hot:field(192,[[0,white],[.2,white+'ee'],[.55,light+'80'],[1,mid+'00']]),
      wave:field(192,[[0,light+'00'],[.45,light+'00'],[.59,white+'80'],[.7,light+'45'],[1,mid+'00']]),
      dust:field(128,[[0,mid+'a0'],[.4,light+'55'],[1,mid+'00']])};
    shellPieces(id==='source'?'source':id==='desert');
  }
  function update(run,dt,hooks={}){
    const e=run?.coreEncounter;if(!e?.hit||run.paused)return;
    if(!e.purification){
      if(e.beforeHp<=0||e.afterHp>0||!(e.actualDamage>0))return;
      e.purification={age:0,departureAt:null,burstAt:null,finished:false,startCamera:run.cameraY,planet:planetId(run)};
      prepare(e.purification.planet);hooks.start?.();
    }
    const f=e.purification;if(f.finished||(!run.evacuation&&e.hitStop>0))return;
    f.age+=clamp(dt,0,.05)*1000;
    if(f.burstAt==null&&f.departureAt==null){
      const pressure=smooth(f.age/TIMES.pressure);
      run.shake=Math.max(run.shake||0,e.reduced?0:(1.2+pressure*4)*(.75+.25*Math.sin(f.age*.027)));
    }
    // The shell gives way under the sustained attack, while the slime is still here.
    if(f.age>=TIMES.pressure&&f.departureAt==null){f.departureAt=f.age;f.startCamera=run.cameraY;}
    if(f.departureAt!=null){
      const since=f.age-f.departureAt,pan=smooth(since/TIMES.tension);
      if(!run.evacuation)run.cameraY=mix(f.startCamera,run.coreArena.surfaceY-540,pan);
      if(since<TIMES.tension)run.shake=e.reduced?0:(5+pan*7)*(.75+.25*Math.sin(f.age*.023));
      if(since>=TIMES.tension&&f.burstAt==null){f.burstAt=f.age;hooks.burst?.();}
    }
    if(f.burstAt!=null){
      const age=f.age-f.burstAt;run.shake=e.reduced?.4:19*Math.pow(1-clamp(age/1050),1.8);
      if(age>=TIMES.hold&&run.evacuation?.finished)f.finished=true;
    }
  }
  function applyCamera(ctx,run){
    const f=run?.coreEncounter?.purification;if(!f||f.departureAt==null)return;
    const zoom=run.coreEncounter.reduced?1:1+.045*smooth((f.age-f.departureAt)/TIMES.tension)*(1-smooth(((f.burstAt==null?-1:f.age-f.burstAt)-60)/850));
    ctx.translate(220,470);ctx.scale(zoom,zoom);ctx.translate(-220,-470);
  }
  function draw(ctx,run){
    const e=run?.coreEncounter,f=e?.purification;if(!f||!art)return;
    const a=run.coreArena,r=a.radius||418,cx=a.x,cy=(a.centerY??a.surfaceY+r)-run.cameraY,top=cy-r;
    if(cy-r>940||cy+r<0)return;
    const VFX=window.SlimeCoreVfx,stamp=VFX.stamp,low=e.lowPower||e.reduced;
    const p=smooth(f.age/TIMES.pressure),tension=f.departureAt==null?0:smooth((f.age-f.departureAt)/TIMES.tension);
    ctx.save();
    if(f.burstAt==null){
      const size=r*2,idx=p*15,i=Math.floor(idx),light=.65+.23*p+.12*tension;
      stamp(ctx,art.halo,cx,top+r*.30,r*1.8,r*1.30,p*.18+tension*.30);
      ctx.globalAlpha=light*(1-(idx-i));ctx.drawImage(art.cracks[i],cx-r,cy-r,size,size);
      if(i<15){ctx.globalAlpha=light*(idx-i);ctx.drawImage(art.cracks[i+1],cx-r,cy-r,size,size);}ctx.globalAlpha=1;
      const vents=window.SlimeCoreFractures.vents;
      if(f.planet==='source'){
        // The source is living matter: pressurized liquid, never external rays.
        for(let j=0;j<(low?4:9);j++){
          const nx=-.78+(j*.618%1)*1.56,ny=-Math.sqrt(1-nx*nx)+.025;
          const wake=smooth((p-.12-j*.025)/.58),beat=.85+Math.sin(f.age*.013+j*1.8)*.15;
          stamp(ctx,art.hot,cx+nx*r,cy+ny*r,34+p*49+tension*35,19+p*31,wake*beat*(.25+tension*.45));
          const q=(f.age/(620+j*31)+j*.27)%1,drift=q*(18+p*42);
          stamp(ctx,art.hot,cx+nx*(r+drift),cy+ny*r-drift*.45+q*q*55,7+p*13,10+p*17,Math.sin(q*Math.PI)*wake*.8);
        }
      }else for(let j=0;j<(low?3:vents.length);j++){
        const [nx,ny,birth]=vents[j],wake=smooth((p-birth)/.48);
        if(wake<=.002)continue;
        const length=(90+p*200+tension*150)*wake,width=36+p*50+tension*30;
        const px=cx+nx*r,py=cy+ny*r;
        ctx.save();ctx.translate(px,py);ctx.rotate(Math.asin(nx)*.72);
        stamp(ctx,art.ray,0,-length*.5+3,width,length,wake*(.24+p*.32+tension*.33));ctx.restore();
        stamp(ctx,art.hot,px,py,45+tension*60,25+tension*34,wake*(.32+tension*.40));
      }
    }else if(f.planet==='source'){
      drawSourceBurst(ctx,run,f,art,low);
    }else{
      const age=f.age-f.burstAt,sec=age/1000,pulse=1+(e.reduced?0:Math.sin(age/480)*.010),size=r*1.94*pulse;
      stamp(ctx,art.halo,cx,cy,size*1.30,size*1.30,.65+Math.sin(age/580)*.10);
      stamp(ctx,art.corona,cx,cy,size*896/768,size*896/768,.70+Math.sin(age/480)*.18);
      if(f.planet!=='source')stamp(ctx,art.core,cx,cy,size,size,1);
      for(let j=0;j<3;j++){
        const nx=(j-1)*.25,px=cx+nx*r,py=cy-Math.sqrt((r*.94)**2-(nx*r)**2);
        stamp(ctx,art.hot,px,py,155,95,.18+Math.sin(age/440+j)*.055);
      }
      stamp(ctx,art.hot,cx-r*.10,cy-r*.67,r*.95,r*.45,.14+Math.sin(age/430)*.04);
      const shock=clamp(age/TIMES.burst),flash=(1-clamp(age/600))**2;
      stamp(ctx,art.hot,cx,top+45,340+shock*640,270+shock*410,flash);
      stamp(ctx,art.wave,cx,top+60,120+Math.sqrt(shock)*1040,70+Math.sqrt(shock)*410,(1-shock)*.85);
      const count=low?12:24;
      const parts=f.planet==='desert'?shellPieces(true):pieces;
      for(let j=0;j<count;j++){
        const part=parts[low?j*2:j];if(!part)continue;
        const delay=(j%4)*.018,q=Math.max(0,sec-delay),life=1-smooth((q-.5)/1.1);if(life<=0)continue;
        const nx=part.nx,ny=part.ny,drift=(1-Math.exp(-q*2.4))*(160+j%5*27);
        const x=cx+nx*(r+drift),y=cy+ny*r-drift*(.7+Math.abs(ny)) +q*q*180,sz=r*part.size*(1-q*.13);
        stamp(ctx,part.image,x,y,sz,sz,life,part.spin*q);
      }
      for(let j=0;j<(low?3:7);j++){
        const q=clamp((age-j*36)/1400),x=cx+Math.sin(j*3.7)*(110+q*150),y=top+45-q*65+j%3*35;
        stamp(ctx,art.dust,x,y,70+q*170,45+q*90,Math.sin(q*Math.PI)*.24);
      }
    }
    ctx.restore();
  }
  function drawSourceBurst(ctx,run,f,art,low){
    const a=run.coreArena,r=a.radius,cx=a.x,cy=a.centerY-run.cameraY,top=cy-r;
    const age=f.age-f.burstAt,sec=age/1000,q=clamp(age/650),flash=(1-q)**2;
    const stamp=window.SlimeCoreVfx.stamp;
    stamp(ctx,art.hot,cx,top+110,430+q*540,370+q*380,flash);
    stamp(ctx,art.wave,cx,top+100,130+Math.sqrt(q)*1050,85+Math.sqrt(q)*510,(1-q)*.9);
    const parts=shellPieces('source');
    for(let j=0;j<(low?12:24);j++){
      const part=parts[low?j*2:j];if(!part)continue;
      const t=Math.max(0,sec-(j%4)*.018),life=1-smooth((t-.35)/1.1),drift=(1-Math.exp(-t*2.2))*(175+j%5*35);
      const size=r*part.size*(1-t*.2);
      stamp(ctx,part.image,cx+part.nx*(r+drift),cy+part.ny*r-drift*(.7+Math.abs(part.ny))+t*t*185,size,size,life,part.spin*t);
    }
    // Compact fluid droplets and vapour fade out; no surviving luminous sphere.
    for(let j=0;j<(low?9:22);j++){
      const angle=-Math.PI*.92+(j*.618%1)*Math.PI*.84,speed=100+j%6*27;
      const life=1-smooth((sec-.25)/1.4),size=8+j%4*5;
      stamp(ctx,art.hot,cx+Math.cos(angle)*speed*sec,top+80+Math.sin(angle)*speed*sec+sec*sec*70,size,size*1.3,life*.85);
    }
    for(let j=0;j<(low?3:6);j++){
      const t=clamp((age-j*40)/1500);
      stamp(ctx,art.dust,cx+Math.sin(j*3.7)*(80+t*140),top+70-t*40+j%3*25,65+t*145,45+t*85,Math.sin(t*Math.PI)*.30);
    }
  }
  function drawHud(ctx,run){
    const e=run?.coreEncounter,f=e?.purification;if(!f||f.burstAt==null)return;
    const age=f.age-f.burstAt,alpha=smooth((age-680)/500);if(alpha<=0)return;
    ctx.save();ctx.globalAlpha=alpha;ctx.font='1000 25px "Slime Nunito",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#10323fd9';ctx.fillStyle=art.colors[3];const label=f.planet==='source'?'ОЧАГ УНИЧТОЖЕН!':'ЯДРО ОЧИЩЕНО!';ctx.strokeText(label,220,238);ctx.fillText(label,220,238);ctx.restore();
  }
  function drawFlash(ctx,run){
    const f=run?.coreEncounter?.purification;if(!f||f.burstAt==null||!art)return;
    const age=f.age-f.burstAt,fade=(1-clamp(age/420))**1.7;if(fade<=.002)return;
    ctx.save();ctx.globalAlpha=fade*(run.coreEncounter.reduced?.18:.88);ctx.drawImage(art.hot,-240,-100,920,1080);ctx.restore();
  }
  const api=Object.freeze({TIMES,palette,planetId,prepare,update,active,revealed,finished,evacuationReady,applyCamera,draw,drawHud,drawFlash,ready:()=>!!art&&shellPieces(key==='source'?'source':key==='desert').length===24});
  if(typeof window!=='undefined')window.SlimeCorePurification=api;
  if(typeof module!=='undefined')module.exports=api;
})();
