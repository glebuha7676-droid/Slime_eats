/* A finite mine's core finale. Elapsed time advances only in the active run loop. */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  const CORE_ASSET='assets/vfx/hostile-cores-v27/shell-100.webp';
  const energy=typeof window!=='undefined'?window.SlimeAnomalyEnergy:require('./anomaly-energy.js');
  const soulWave=typeof window!=='undefined'?window.SlimePhantomCoreWave:require('./phantom-core-wave.js');
  const damage=power=>energy.coreDamage(power);
  const visualStrength=reserve=>Math.pow(clamp(reserve/100),.65);
  const cosmosTier=reserve=>reserve>=75?4:reserve>=50?3:reserve>=25?2:1;
  const FINISHER=Object.freeze({overdrive:850,pressure:2250,power:1.5});
  // Cinematic power is independent of saved energy and of the single persisted HP change.
  const visualReserve=e=>e?.finisher?100+50*(e.overdrive||0):e?.strikeEnergy??0;
  const IMPACTS=Object.freeze([
    Object.freeze({tier:1,power:.25,press:.008,kick:2,shake:2.5,duration:330,shards:6,size:10,speed:145,light:.20,wallCount:4,wallSize:8,dust:0}),
    Object.freeze({tier:2,power:.5,press:.013,kick:3.5,shake:5,duration:430,shards:10,size:13,speed:185,light:.35,wallCount:7,wallSize:11,dust:2}),
    Object.freeze({tier:3,power:.75,press:.019,kick:5,shake:8,duration:550,shards:15,size:16,speed:235,light:.52,wallCount:12,wallSize:15,dust:4}),
    Object.freeze({tier:4,power:1,press:.027,kick:7,shake:18,duration:950,shards:21,size:20,speed:285,light:.72,wallCount:26,wallSize:23,dust:8})
  ]);
  const impactProfile=reserve=>IMPACTS[cosmosTier(reserve)-1];
  let psionicPullSequence=0;
  const strikeKind=run=>run.mutationId==='fire'||run.elementalAbilityType==='fire'?'fire':run.mutationId==='electric'||run.elementalAbilityType==='electric'?'electric':run.mutationId==='frost'||run.elementalAbilityType==='frost'?'frost':run.mutationId==='cosmos'||run.elementalAbilityType==='cosmos'?'cosmos':run.mutationId==='nano'||run.elementalAbilityType==='nano'?'techno':run.mutationId==='phantom'||run.elementalAbilityType==='phantom'?'phantom':run.mutationId==='telekinesis'||run.elementalAbilityType==='telekinesis'?'psionic':run.mutationId==='glitch'||run.elementalAbilityType==='glitch'?'glitch':run.mutationId==='cloning'||run.elementalAbilityType==='cloning'?'spores':'';
  const fracture=hp=>hp<=0?4:hp<=25?3:hp<=50?2:hp<=75?1:0;
  let sourceSprite,sourceGlow,sourceWhite,sprite,wallSprite,glow,coreGlow,skyGlow,impactGlow,impactWave,wallDust,coreWhite,limitGlow,criticalGlow,warmGlitch=false;const planetGlows=new Map(),shards=[],wallChips=[];
  const damageSprites={shell:{},heart:{}};
  const asset=path=>typeof window!=='undefined'?window.SlimeGameAssets?.versionedAsset(path)||path:path;
  function preload(){
    if(typeof Image==='undefined')return;
    if(!sprite){
      for(const family of ['shell','heart'])for(const hp of [100,75,50,25]){
        const image=new Image();image.decoding='async';
        if(hp===100)image.onload=prewarmImpact;
        damageSprites[family][hp]=image;
        image.src=asset(`assets/vfx/hostile-cores-v27/${family}-${hp}.webp`);
      }
      sprite=damageSprites.shell[100];sourceSprite=damageSprites.heart[100];
    }
    if(!wallSprite){wallSprite=new Image();wallSprite.decoding='async';wallSprite.onload=prewarmImpact;wallSprite.src=asset('effects-lab/assets/telekinesis-rock-right-v1-lossless.webp');}
  }
  function shellArt(worldId,hp=100){
    preload();
    const family=Number(worldId)===6?'heart':'shell';
    const stage=hp>75?100:hp>50?75:hp>25?50:25;
    const image=damageSprites[family][stage],base=damageSprites[family][100];
    // Sprites share one export-time frame. No local-image pixel reads in the renderer.
    return image?.complete&&image.naturalWidth?image:base?.complete&&base.naturalWidth?base:null;
  }
  function prewarmImpact(){
    textures();
    if(sprite?.complete&&sprite.naturalWidth){
      if(!coreWhite){coreWhite=canvas(256,256);const x=coreWhite.getContext('2d');x.drawImage(sprite,0,0,256,256);x.globalCompositeOperation='source-in';x.fillStyle='#f5e7ff';x.fillRect(0,0,256,256);}
      for(let i=0;i<21;i++)if(!shards[i]){
        const shard=canvas(40,40),c=shard.getContext('2d');c.beginPath();c.moveTo(4,9);c.lineTo(24,2);c.lineTo(38,17);c.lineTo(29,37);c.lineTo(9,33);c.closePath();c.clip();
        c.drawImage(sprite,sprite.naturalWidth*((i%3)*.19+.13),sprite.naturalHeight*(.1+(i%2)*.16),64,64,0,0,40,40);shards[i]=shard;
      }
      warmGlitchShell();
    }
    if(wallSprite?.complete&&wallSprite.naturalWidth)for(let i=0;i<26;i++)if(!wallChips[i]){
      const chip=canvas(40,40),c=chip.getContext('2d');c.beginPath();c.moveTo(4,9);c.lineTo(25,2);c.lineTo(38,17);c.lineTo(28,38);c.lineTo(8,32);c.closePath();c.clip();
      c.drawImage(wallSprite,wallSprite.naturalWidth*(.25+i%3*.09),wallSprite.naturalHeight*(.28+i%2*.12),wallSprite.naturalWidth*.22,wallSprite.naturalHeight*.22,0,0,40,40);wallChips[i]=chip;
    }
  }
  function warmGlitchShell(){
    if(warmGlitch&&sprite?.complete&&sprite.naturalWidth&&typeof window!=='undefined'){
      window.SlimeGlitchCoreStrike?.warmCore(sprite);warmGlitch=false;
    }
  }
  function arena(run,width=440,height=840){
    const lastBottom=Math.max(285+run.rowCount*run.cellSize,...run.blocks.filter(b=>!b.dead).map(b=>b.y+b.h));
    const surfaceY=lastBottom+height*1.05;
    const heart=Number(run.worldId)===6,radius=width*(heart?.43:.72);
    return {x:width/2,radius,surfaceY,centerY:surfaceY+radius,
      triggerY:surfaceY-height*(strikeKind(run) ? .66 : .76),cameraY:surfaceY-height*(heart?.50:.58)};
  }
  function begin(run,hp,{hudBottom=92}={}){
    const a=run.coreArena,strikeEnergy=clamp(run.energy,0,100);
    if(strikeEnergy<=0)return null;
    run.slime.y=Math.min(run.slime.y,a.surfaceY-350);
    const kind=strikeKind(run),fire=kind==='fire',electric=kind==='electric',frost=kind==='frost',cosmos=kind==='cosmos',techno=kind==='techno',phantom=kind==='phantom',psionic=kind==='psionic',glitch=kind==='glitch',spores=kind==='spores';
    run.coreEncounter={kind,fire,electric,frost,cosmos,techno,phantom,psionic,glitch,spores,cinematic:!!kind,phase:'approach',elapsed:0,phaseTime:0,startX:run.slime.x,startY:run.slime.y,startCamera:Math.min(run.cameraY,a.cameraY),
      strikeEnergy,plannedDamage:damage(strikeEnergy),finisher:hp>0&&hp<=damage(strikeEnergy),hudOffset:Math.max(0,hudBottom+10-102),
      beforeHp:hp,afterHp:hp,shownHp:hp,hit:false,slimeScale:1,slimeAlpha:1,
      startVy:clamp(run.slime.vy||260,100,650),aura:0,transfer:0,power:kind?visualStrength(strikeEnergy):undefined,zoom:1};
    if(cosmos){run.coreEncounter.powerTier=cosmosTier(strikeEnergy);run.coreEncounter.power=run.coreEncounter.powerTier/4;}
    if(techno){run.coreEncounter.powerTier=cosmosTier(strikeEnergy);run.coreEncounter.power=(droneCount(strikeEnergy)-1)/6;}
    if(phantom){run.coreEncounter.powerTier=cosmosTier(strikeEnergy);run.coreEncounter.power=run.coreEncounter.powerTier/4;}
    if(glitch){run.coreEncounter.powerTier=cosmosTier(strikeEnergy);run.coreEncounter.power=run.coreEncounter.powerTier/4;warmGlitch=true;warmGlitchShell();}
    if(spores){run.coreEncounter.powerTier=cosmosTier(strikeEnergy);run.coreEncounter.power=run.coreEncounter.powerTier/4;}
    if(psionic){const side=++psionicPullSequence%2?-1:1;run.coreEncounter.rock={size:rockSize(visualReserve(run.coreEncounter)),side,wallX:side<0?12:428,holdX:220+side*112,x:side<0?12:428,y:run.slime.y+150,angle:0,alpha:0,broken:false,torn:false};}
    return run.coreEncounter;
  }
  function phase(e,name){e.phase=name;e.phaseTime=0;}
  const FIRE=Object.freeze({gather:1950,auto:1500,release:110,burn:760,hit:100,settle:340});
  const ELECTRIC=Object.freeze({...FIRE,burn:520,hit:70,settle:280});
  const FROST=Object.freeze({...FIRE,burn:1100,hit:410,settle:380});
  const COSMOS=Object.freeze({...FIRE,hit:280,gravity:1320,airDrag:1.4});
  const TECHNO=Object.freeze({...FIRE,gather:2850,release:130,burn:1050,hit:100,settle:500});
  const PHANTOM=Object.freeze({...FIRE,gather:2450,burn:1780,settle:380});
  const PSIONIC=Object.freeze({...FIRE,gather:2450,burn:1050,hit:360,secondDelay:22,settle:380});
  const GLITCH=Object.freeze({...FIRE,gather:2150,burn:980,hit:320,settle:360});
  const SPORES=Object.freeze({...FIRE,gather:2350,burn:1450,hit:180,settle:380});
  const rockSize=reserve=>52+136*(reserve>100?1+(reserve-100)/100:visualStrength(reserve));
  const PHANTOM_FINISHER=Object.freeze({...PHANTOM,burn:2200});
  const droneCount=reserve=>reserve>100?7+Math.ceil((reserve-100)/50*8):[2,3,5,7][cosmosTier(reserve)-1];
  const timings=e=>e.spores?SPORES:e.glitch?GLITCH:e.psionic?PSIONIC:e.phantom?(e.finisher?PHANTOM_FINISHER:PHANTOM):e.techno?TECHNO:e.frost?FROST:e.electric?ELECTRIC:FIRE;
  function evacuateWhenReady(run,hooks){
    const e=run.coreEncounter;
    if(e.rescueStarted)return;
    if(e.finisher&&!(typeof window!=='undefined'&&window.SlimeCorePurification?.evacuationReady(run)))return;
    e.rescueStarted=true;e.zoom=1;e.jet=0;e.aura=0;phase(e,'impact');hooks.evacuate?.();
  }
  function requestStrike(run){
    const e=run?.coreEncounter;if(!e?.cinematic||e.phase!=='armed'||run.paused||run.evacuation)return false;
    if(e.psionic){e.castRockX=e.rock.x;e.castRockY=e.rock.y;e.castRockAngle=e.rock.angle;if(e.extraRock){e.extraRock.castX=e.extraRock.x;e.extraRock.castY=e.extraRock.y;e.extraRock.castAngle=e.extraRock.angle;}}
    e.castElapsed=e.elapsed;
    e.castX=run.slime.x;e.castY=run.slime.y;e.releaseZoom=e.zoom;phase(e,'release');return true;
  }
  function transfer(run,e,t){
    e.transfer=clamp(t);e.aura=smooth(e.transfer)*e.power;
    const next=e.strikeEnergy*(1-e.transfer),spent=-energy.change(run,next-run.energy,'core-transfer',e.elapsed);
    if(run.energyStats)run.energyStats.discharged+=Math.max(0,spent);
  }
  function preparationPose(run){
    const e=run?.coreEncounter;if(!e||run.evacuation)return {preparing:false,eyeClosure:0,mouthStyle:''};
    const preparing=['approach','overdrive','armed','release'].includes(e.phase);
    const progress=e.phase==='approach'?e.cinematic?(e.transfer||0):clamp(e.phaseTime/2400):1;
    const closed=smooth((progress-.12)/.88);
    const eyeClosure=preparing?closed:['burn','launch'].includes(e.phase)?1-smooth(e.phaseTime/150):0;
    return {preparing,eyeClosure,mouthStyle:'concentrated'};
  }
  function cosmosMotion(run,dt,hooks){
    const e=run.coreEncounter,a=run.coreArena,s=run.slime;
    if(e.phase==='burn'){
      if(!e.released){
        e.released=true;const rng=hooks.random||Math.random,side=rng()<.5?-1:1;
        e.contactX=a.x+side*(16+rng()*30);const r=a.radius||418,cy=a.centerY??a.surfaceY+r;
        e.contactY=cy-Math.sqrt(r*r-(e.contactX-a.x)**2);
        e.contactSlimeY=e.contactY-s.radius*.73;
        e.reboundSpeed=800+rng()*85;e.tangentJitter=(rng()-.5)*28;
        hooks.launch?.();
      }
      const t=clamp(e.phaseTime/COSMOS.hit),p=t**2.5,velocity=2.5*t**1.5/(COSMOS.hit/1000);
      s.x=lerp(e.castX,e.contactX,p);s.y=lerp(e.castY,e.contactSlimeY,p);
      s.vx=(e.contactX-e.castX)*velocity;s.vy=(e.contactSlimeY-e.castY)*velocity;
      e.flightAngle=Math.atan2(s.vy,s.vx)-Math.PI/2;
      e.bodyStretch=clamp(s.vy/2200,0,.22);e.bodyTilt=clamp(s.vx/1800,-.18,.18);
      e.slimeScale=lerp(.98,1.02,smooth(t/.35));e.impactSquash=-.13*Math.sin(t*Math.PI);e.jet=1;e.aura=e.power;
      e.zoom=lerp(e.releaseZoom||1.075,1.025,smooth(p));
      if(t===1&&!e.hit){
        const r=a.radius||418,nx=(e.contactX-a.x)/r,ny=-Math.sqrt(1-nx*nx),dot=s.vx*nx+s.vy*ny;
        const reflectedX=s.vx-2*dot*nx,reflectedY=s.vy-2*dot*ny,restitution=e.reboundSpeed/Math.abs(reflectedY);
        s.vx=clamp(reflectedX*restitution+e.tangentJitter,-230,230);s.vy=-e.reboundSpeed;
        e.bounceStartX=s.x;e.bounceStartY=s.y;e.bounceVx=s.vx;e.bounceVy=s.vy;
        e.contactStretch=e.bodyStretch;e.contactTilt=e.bodyTilt;
        e.reboundMs=e.reboundSpeed/COSMOS.gravity*1000+70;
        e.hit=true;e.hitAt=e.elapsed;e.hitY=e.contactY;e.damage=e.plannedDamage;
        e.afterHp=hooks.impact?.(e.damage)??Math.max(0,e.beforeHp-e.damage);e.actualDamage=e.beforeHp-e.afterHp;
        run.shake=e.reduced?1:e.finisher?28:3+10*e.power;e.hitStop=e.reduced?0:e.finisher?180:60+65*e.power;e.impactSquash=.08;phase(e,'rebound');
      }
    }else{
      const decay=Math.exp(-COSMOS.airDrag*dt);s.x+=s.vx*(1-decay)/COSMOS.airDrag;s.vx*=decay;
      s.y+=s.vy*dt+.5*COSMOS.gravity*dt*dt;s.vy+=COSMOS.gravity*dt;
      const edge=s.radius+12;if(s.x<edge){s.x=edge;s.vx=Math.abs(s.vx)*.55;}else if(s.x>440-edge){s.x=440-edge;s.vx=-Math.abs(s.vx)*.55;}
      e.bodyStretch=lerp(e.contactStretch,-.08,smooth(e.phaseTime/180));
      e.bodyTilt=lerp(e.contactTilt,clamp(s.vx/1600,-.18,.18),smooth(e.phaseTime/180));
      e.slimeScale=lerp(1.02,1,smooth(e.phaseTime/130));e.impactSquash=(.08+.10*Math.sin(clamp(e.phaseTime/120)*Math.PI))*(1-smooth(e.phaseTime/180));
      e.aura=e.power*(1-smooth(e.phaseTime/310));e.jet=1-smooth(e.phaseTime/260);e.zoom=lerp(1.025,1,smooth(e.phaseTime/360));
      if(e.phaseTime>=e.reboundMs&&!e.rescueStarted){
        if(e.finisher){e.jet=0;e.settleY=s.y;s.vy=0;s.vx=0;phase(e,'afterglow');}
        else evacuateWhenReady(run,hooks);
      }
    }
  }
  function phantomMotion(run,hooks){
    const e=run.coreEncounter,s=run.slime,t=e.phaseTime;
    if(!e.released){e.released=true;e.souls=soulWave.create(run,visualReserve(e),hooks.random||Math.random);e.phantomHitCount=0;e.soulCount=e.souls.length;run.shake=Math.max(run.shake||0,e.reduced?0:2+4*e.power);hooks.launch?.();}
    s.x=e.castX;s.y=e.castY-7*smooth(t/240)+5*smooth((t-1900)/580);s.vx=0;s.vy=0;
    e.slimeScale=1;e.slimeAlpha=1;e.impactSquash=0;
    e.jet=1-smooth((t-100)/470);e.aura=e.power*(1-.85*smooth((t-180)/1000));e.zoom=lerp(e.releaseZoom||1.075,1.018,smooth(t/PHANTOM.burn));
    for(const soul of e.souls){
      if(soul.hit||t<soul.delay+soul.duration)continue;
      soul.hit=true;soul.hitAt=e.elapsed;e.phantomHitCount++;e.lastSoulHitAt=e.elapsed;
      if(!e.hit){
        e.hit=true;e.hitAt=e.elapsed;e.hitY=soul.y;e.damage=e.plannedDamage;
        // Persist the whole, guaranteed volley once; individual contacts animate its delivery.
        e.afterHp=hooks.impact?.(e.damage)??Math.max(0,e.beforeHp-e.damage);e.actualDamage=e.beforeHp-e.afterHp;
        e.hitStop=e.reduced?0:35;
      }
      run.shake=Math.max(run.shake,e.reduced?.4:1+e.power*2.4);
    }
    if(t>=(e.finisher?2200:PHANTOM.burn)){e.jet=0;e.slimeAlpha=1;e.slimeScale=1;e.settleY=s.y;phase(e,'afterglow');}
  }
  function gatherRock(run,r=run.coreEncounter.rock){
    const e=run.coreEncounter,s=run.slime,age=e.elapsed-(r.spawnAt||0),ripDelay=r.secondary?240:620;
    if(age<(r.secondary?30:180))return;
    r.wallY??=run.cameraY+340;
    if(!r.torn&&age>=ripDelay){r.torn=true;r.ripAt=e.elapsed;run.shake=Math.max(run.shake||0,e.reduced?0:2.5+4*e.power);e.hitStop=e.reduced?0:30+25*e.power;}
    if(!r.torn){
      const tension=smooth((age-(r.secondary?30:180))/(r.secondary?210:440));r.x=r.wallX+(e.reduced?0:Math.sin(e.elapsed*.052)*1.5*tension);r.y=r.wallY;r.angle=Math.sin(e.elapsed*.017)*.035*tension;r.alpha=smooth((age-(r.secondary?30:180))/150)*.65;r.pullProgress=0;return;
    }
    const t=clamp((e.elapsed-r.ripAt)/540),p=1-(1-t)**3,n=1-p,hold=r.holdX,cy=s.y-95+(e.finisher?9*smooth(e.overdrive||0):0)-(r.secondary?12:0);
    r.x=n*n*r.wallX+2*n*p*(r.wallX+(hold-r.wallX)*.72)+p*p*hold;
    r.y=n*n*r.wallY+2*n*p*(r.wallY+(cy-r.wallY)*.55-64)+p*p*cy;r.alpha=.65+.35*smooth(t/.28);r.pullProgress=p;
    const spin=Math.max(0,(e.elapsed-r.ripAt-120)/1000),ramp=Math.min(spin,1.1);
    r.angle=-r.side*(.9*spin+23*ramp**3/(3*1.1**2)+Math.max(0,spin-1.1)*23);
  }
  function rockContactY(arena,x){
    const radius=arena.radius||418,dx=x-arena.x;
    return (arena.centerY??arena.surfaceY+radius)-Math.sqrt(radius*radius-dx*dx);
  }
  function psionicMotion(run,hooks){
    const e=run.coreEncounter,a=run.coreArena,s=run.slime,r=e.rock,t=e.phaseTime,p=clamp(t/PSIONIC.hit),q=p**2.5;
    if(!e.released){e.released=true;r.targetX=a.x+(e.extraRock?r.side*52:0);r.targetY=rockContactY(a,r.targetX)-r.size*.4;hooks.launch?.();}
    const controlX=e.castRockX+(r.side||-1)*45,controlY=(e.castRockY+r.targetY)*.5-12,n=1-q;
    r.x=n*n*e.castRockX+2*n*q*controlX+q*q*r.targetX;r.y=n*n*e.castRockY+2*n*q*controlY+q*q*r.targetY;
    r.angle=e.castRockAngle-(r.side||-1)*t*.026;r.alpha=e.hit?1-smooth((t-PSIONIC.hit)/(e.finisher?560:110)):1;
    if(e.finisher&&e.hit){r.angle=r.impactAngle;r.y=r.targetY+10*smooth((t-PSIONIC.hit)/400);}
    s.x=e.castX;s.y=e.castY-11*smooth(t/180)+5*smooth((t-620)/430);s.vx=0;s.vy=0;
    e.slimeScale=lerp(.98,1.03,smooth(t/140));e.impactSquash=-.10*Math.sin(clamp(t/190)*Math.PI);
    e.aura=e.power*(1-.8*smooth((t-PSIONIC.hit)/550));e.jet=1-smooth((t-PSIONIC.hit)/380);e.zoom=lerp(e.releaseZoom||1.075,1.018,smooth(t/PSIONIC.burn));
    if(p===1&&!e.hit){
      e.hit=true;e.hitAt=e.elapsed;e.hitY=a.surfaceY;e.damage=e.plannedDamage;r.broken=true;r.impactAngle=r.angle;
      e.afterHp=hooks.impact?.(e.damage)??Math.max(0,e.beforeHp-e.damage);e.actualDamage=e.beforeHp-e.afterHp;
      e.hitStop=e.reduced||e.extraRock?0:75+45*e.power;run.shake=e.reduced?1:4+9*e.power;
    }
    const second=e.extraRock;
    if(second){
      const p2=clamp((t-PSIONIC.secondDelay)/PSIONIC.hit),q2=p2**2.5,n2=1-q2;
      second.targetX=a.x+second.side*52;second.targetY=rockContactY(a,second.targetX)-second.size*.4;
      const cx=second.castX+second.side*45,cy=(second.castY+second.targetY)*.5-12;
      second.x=n2*n2*second.castX+2*n2*q2*cx+q2*q2*second.targetX;
      second.y=n2*n2*second.castY+2*n2*q2*cy+q2*q2*second.targetY;
      second.angle=second.castAngle-second.side*Math.max(0,t-PSIONIC.secondDelay)*.026;
      second.alpha=1-smooth((t-PSIONIC.secondDelay-PSIONIC.hit)/560);
      if(p2===1&&!second.broken){second.broken=true;second.impactAngle=second.angle;second.hitAt=e.elapsed;second.hitAttackAge=e.attackAge||0;e.hitStop=e.reduced?0:135;}
      if(second.broken){second.angle=second.impactAngle;second.y=second.targetY+10*smooth((t-PSIONIC.hit-PSIONIC.secondDelay)/400);}
    }
    if(t>=PSIONIC.burn){e.jet=0;r.alpha=0;e.settleY=s.y;phase(e,'afterglow');}
  }
  function cinematicUpdate(run,dt,hooks){
    const e=run.coreEncounter,a=run.coreArena,s=run.slime,T=timings(e),peakZoom=1+(e.reduced?0:.02+.055*e.power+(e.finisher?.12*(e.overdrive||0):0));
    s.wobble+=dt*(3+e.aura*5);run.shake=Math.max(0,(run.shake||0)-dt*26);
    if(e.phase==='approach'){
      const t=clamp(e.phaseTime/T.gather),end=a.cameraY+(e.techno||e.psionic?240:220),d=end-e.startY,m0=Math.min(d*2,e.startVy*T.gather/1000),m1=12*T.gather/1000;
      s.x=lerp(e.startX,a.x,smooth(t));s.y=(2*t*t*t-3*t*t+1)*e.startY+(t*t*t-2*t*t+t)*m0+(-2*t*t*t+3*t*t)*end+(t*t*t-t*t)*m1;
      s.vy=lerp(e.startVy,12,t);s.vx=0;
      e.cameraTarget=a.cameraY;
      // Look ahead early in the descent without moving the slime under the HUD.
      run.cameraY=Math.min(lerp(e.startCamera,e.cameraTarget,smooth(t/.55)),s.y-145);
      transfer(run,e,t);e.slimeScale=1-.02*smooth(t);e.impactSquash=.012*smooth(t);e.zoom=lerp(1,peakZoom,smooth(t));
      if(t===1){run.cameraY=e.cameraTarget;e.armY=s.y;e.gatherPower=e.power;e.gatherZoom=e.zoom;e.overdriveStart=e.elapsed;phase(e,e.finisher?'overdrive':'armed');if(!e.finisher)hooks.armed?.();}
      if(e.spores&&!e.sporeSeed&&e.elapsed>=260)e.sporeSeed={x:s.x,y:s.y+s.radius*.35,startedAt:e.elapsed,side:s.x<a.x?-1:1};
    }else if(e.phase==='overdrive'){
      const p=smooth(e.phaseTime/FINISHER.overdrive);e.overdrive=p;e.power=lerp(e.gatherPower,FINISHER.power,p);e.powerTier=4;e.aura=e.power;
      if(e.rock){
        e.rock.size=rockSize(visualReserve(e))*(1-.32*p);e.rock.holdX=a.x+e.rock.side*lerp(112,86,p);
        if(p>.035&&!e.extraRock){const side=-e.rock.side;e.extraRock={secondary:true,spawnAt:e.elapsed,size:e.rock.size*.93,side,wallX:side<0?12:428,wallY:run.cameraY+245,holdX:a.x+side*86,x:side<0?12:428,y:run.cameraY+245,angle:0,alpha:0,broken:false,torn:false};}
        if(e.extraRock)e.extraRock.size=e.rock.size*.93;
      }
      s.x=a.x;s.y=e.armY+5*p;s.vy=5;s.vx=0;e.zoom=e.reduced?1:lerp(e.gatherZoom||1.075,1.2225,p);e.impactSquash=.012;
      if(p>.55&&!e.limitSurge){e.limitSurge=true;e.limitSurgeAt=e.elapsed;e.hitStop=e.reduced?0:55;hooks.overdrive?.();}
      if(p===1){e.power=FINISHER.power;e.aura=FINISHER.power;e.armY=s.y;phase(e,'armed');hooks.armed?.();}
    }else if(e.phase==='armed'){
      s.x=a.x;s.y=e.armY+12*e.phaseTime/1000;s.vy=12;s.vx=0;e.impactSquash=.012+(e.reduced?0:Math.sin(e.elapsed/320)*.002);e.zoom=peakZoom;
      if(e.phaseTime>=T.auto)requestStrike(run);
    }else if(e.psionic&&e.phase==='burn'){
      psionicMotion(run,hooks);
    }else if(e.phantom&&e.phase==='burn'){
      phantomMotion(run,hooks);
    }else if(e.cosmos&&(e.phase==='burn'||e.phase==='rebound')){
      cosmosMotion(run,dt,hooks);
    }else if(e.phase==='burn'){
      if(!e.released){e.released=true;e.impactSquash=0;hooks.launch?.();}
      const t=e.phaseTime,F=clamp(t/T.burn);s.x=e.castX+(e.reduced?0:Math.sin(t/27)*1.1*(1-F));s.y=e.castY-(12+23*e.power)*smooth(t/150)+10*smooth((t-320)/440);s.vx=0;s.vy=-12;
      if(e.frost)s.y=e.castY+13*smooth(t/90)-22*smooth((t-140)/240);
      if(e.techno)s.y=e.castY-(8+12*e.power)*smooth(t/140)+6*smooth((t-650)/400);
      e.slimeScale=lerp(.98,1.04,smooth(t/115));e.impactSquash=-.10*Math.sin(clamp(t/160)*Math.PI);e.zoom=lerp(peakZoom,1.018,smooth(F));
      e.jet=e.electric?smooth(t/35)*(1-smooth((t-320)/200)):smooth(t/65)*(1-smooth((t-490)/270));e.aura=e.power*(1-.8*smooth((t-(e.electric?220:360))/(e.electric?300:400)));
      if(e.frost){e.jet=smooth(t/70)*(1-smooth((t-220)/200));e.aura=e.power*(1-.8*smooth((t-600)/500));}
      if(e.techno){e.jet=smooth(t/65)*(1-smooth((t-780)/270));e.aura=e.power*(1-.8*smooth((t-700)/350));}
      if(e.glitch){s.x=e.castX;s.y=e.castY-10*smooth(t/130)+7*smooth((t-420)/560);s.vy=0;e.slimeScale=1;e.impactSquash=0;e.jet=smooth(t/55)*(1-smooth((t-650)/330));e.aura=e.power*(1-smooth((t-320)/500));}
      if(e.spores){s.x=e.castX;s.y=e.castY-(7+8*e.power)*smooth((t-180)/240)+6*smooth((t-850)/600);s.vy=0;e.slimeScale=1;e.impactSquash=0;e.jet=smooth(t/55)*(1-smooth((t-1120)/330));e.aura=e.power*(1-smooth((t-240)/750));}
      if(t>=T.hit&&!e.hit){
        e.hit=true;e.hitAt=e.elapsed;e.hitY=a.surfaceY;e.damage=e.plannedDamage;e.afterHp=hooks.impact?.(e.damage)??Math.max(0,e.beforeHp-e.damage);e.actualDamage=e.beforeHp-e.afterHp;run.shake=e.reduced?1:2+7*e.power;e.hitStop=e.reduced?0:55+40*e.power;
      }
      if(t>=T.burn){e.jet=0;e.settleY=s.y;phase(e,'afterglow');}
    }else if(e.phase==='afterglow'){
      const t=clamp(e.phaseTime/T.settle);s.y=e.settleY+8*t;s.vy=24;s.vx=0;e.aura=e.power*(1-t)*.2;e.impactSquash=0;e.zoom=lerp(1.018,1,smooth(t));
      if(t===1)evacuateWhenReady(run,hooks);
    }
    if(e.psionic&&['approach','overdrive','armed'].includes(e.phase))gatherRock(run);
    if(e.extraRock&&['overdrive','armed'].includes(e.phase))gatherRock(run,e.extraRock);
    if(e.finisher&&e.hit&&e.phase==='burn'){
      // Keep a live stream: phase progress is slower, particle animation retains its real clock.
      const fade=1-smooth((e.elapsed-e.hitAt-FINISHER.pressure+400)/500);
      e.jet=Math.max(e.jet,fade);e.aura=Math.max(e.aura,FINISHER.power*.85*fade);
    }
    if(e.finisher&&e.phase==='burn'&&!e.reduced){
      e.zoom=lerp(e.releaseZoom||1.2225,1.045,smooth((e.elapsed-e.castElapsed)/480));
    }
    if(e.hit)e.shownHp=lerp(e.beforeHp,e.afterHp,smooth((e.elapsed-e.hitAt-140)/620));
  }
  function applyCinematic(ctx,run){
    const e=run.coreEncounter;if(!e?.cinematic||run.evacuation)return;
    const zoom=e.zoom||1,t=e.elapsed,still=e.phase==='release'||e.hitStop>0;
    const tremor=e.reduced||still||e.hit?0:(e.transfer||0)*(e.power||0)*(1.8+(e.finisher?2.2*(e.overdrive||0):0));
    ctx.translate(Math.sin(t*.071)*tremor,Math.sin(t*.097)*tremor*.55);
    const focus=e.finisher?lerp(420,340,e.overdrive||0):420;e.focusY=focus;
    ctx.translate(220,focus);ctx.scale(zoom,zoom);ctx.translate(-220,-focus);
  }
  function update(run,dt,hooks={}){
    const e=run.coreEncounter,a=run.coreArena,s=run.slime;if(!e)return;
    dt=clamp(dt,0,.05);
    if(e.cinematic&&!run.evacuation&&e.phase==='release'){
      e.phaseTime+=dt*1000;run.slime.vx=0;run.slime.vy=0;
      if(e.phaseTime>=(e.reduced?45:e.finisher?170:e.techno?TECHNO.release:FIRE.release)){phase(e,'burn');}
      return;
    }
    if(e.cinematic&&!run.evacuation&&e.hitStop>0){e.hitStop=Math.max(0,e.hitStop-dt*1000);return;}
    let attackRate=e.phase==='approach'?1.12:!e.finisher&&e.phase==='burn'&&!e.cosmos?1.12:1;
    if(e.finisher&&e.hit&&!run.evacuation){
      if(e.phase==='burn')attackRate=e.pressureRate??=Math.max(.01,(timings(e).burn-e.phaseTime)/FINISHER.pressure);
      e.attackAge=(e.attackAge||0)+dt*1000*(e.cosmos?1/2:attackRate);
    }
    e.elapsed+=dt*1000;e.phaseTime+=dt*1000*attackRate;
    if(e.cinematic&&!run.evacuation){cinematicUpdate(run,dt,hooks);if(e.hit){const p=impactProfile(visualReserve(e)),age=e.elapsed-(e.extraRock?.hitAt||e.hitAt);run.shake=e.reduced?Math.min(.6,run.shake):p.shake*(e.finisher&&(e.cosmos||e.extraRock?.broken)?1.6:1)*Math.pow(1-clamp(age/p.duration),1.7);}return;}
    if(e.hit){
      e.shownHp=lerp(e.beforeHp,e.afterHp,smooth((e.elapsed-e.hitAt-140)/620));
      if(e.finisher&&!run.evacuation)evacuateWhenReady(run,hooks);
      return;
    }
    s.wobble+=dt*3;run.shake=Math.max(0,run.shake-dt*26);
    const hover=a.surfaceY-150;
    if(e.phase==='approach'){
      const p=1-Math.pow(1-clamp(e.phaseTime/2400),2);s.x=lerp(e.startX,a.x,p);s.y=lerp(e.startY,hover,p);
      run.cameraY=lerp(e.startCamera,a.cameraY,smooth(e.phaseTime/1200));s.vy=lerp(260,8,p);s.vx=0;
      if(e.phaseTime>=2400){s.x=a.x;s.y=hover;run.cameraY=a.cameraY;e.launchX=s.x;e.launchY=s.y;phase(e,'launch');hooks.launch?.();}
    }else if(e.phase==='launch'){
      const p=clamp(e.phaseTime/540),v=Math.pow(p,2.65);s.x=lerp(e.launchX,a.x,v);s.y=lerp(e.launchY,a.surfaceY-s.radius*.42,v);s.vy=300+p*1100;s.vx=0;
      if(p===1&&!e.hit){
        e.hit=true;e.hitY=s.y;e.hitAt=e.elapsed;e.damage=e.plannedDamage;e.afterHp=hooks.impact?.(e.damage)??Math.max(0,e.beforeHp-e.damage);
        e.actualDamage=e.beforeHp-e.afterHp;run.shake=(e.reduced||hooks.reduced) ? .6 : impactProfile(e.strikeEnergy).shake;s.vy=0;phase(e,'impact');
      }
    }
  }
  function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  function field(size,stops){const c=canvas(size,size),x=c.getContext('2d'),g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);for(const [p,color]of stops)g.addColorStop(p,color);x.fillStyle=g;x.fillRect(0,0,size,size);return c;}
  function impactResponse(reserve,age){
    const p=impactProfile(reserve),t=Math.max(0,age),fade=Math.exp(-t/240);
    if(!Number.isFinite(t)||t>1200)return {compression:0,kick:0,light:0};
    return {compression:p.press*(.22+.78*Math.sin(clamp(t/210)*Math.PI))*Math.exp(-t/340),
      kick:p.kick*Math.cos(t*.019)*fade,light:p.light*Math.pow(1-clamp(t/420),1.7)};
  }
  function textures(){
    limitGlow??=field(192,[[0,'#ffffffee'],[.16,'#fffaf6c0'],[.40,'#f3f8ff48'],[1,'#ffffff00']]);
    criticalGlow??=field(192,[[0,'#fff6d8dc'],[.2,'#ffb36a9c'],[.48,'#ff49665c'],[1,'#ff265a00']]);
    if(glow)return;
    glow=canvas(128,128);let c=glow.getContext('2d'),g=c.createRadialGradient(64,64,0,64,64,64);
    g.addColorStop(0,'#edfff4');g.addColorStop(.17,'#b5ffe8bd');g.addColorStop(.48,'#54edc43f');g.addColorStop(1,'#27cdd900');c.fillStyle=g;c.fillRect(0,0,128,128);
    coreGlow=canvas(256,256);c=coreGlow.getContext('2d');g=c.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0,'#bcff7080');g.addColorStop(.55,'#88ed7435');g.addColorStop(1,'#5a51ba00');c.fillStyle=g;c.fillRect(0,0,256,256);
    impactGlow=field(192,[[0,'#fff9fff2'],[.16,'#eed5ffe0'],[.42,'#b97fff7a'],[.72,'#8d45dd26'],[1,'#7839c000']]);
    impactWave=field(192,[[0,'#e7c8ff00'],[.37,'#e7c8ff00'],[.54,'#f7eaff36'],[.64,'#e6c0ff79'],[.78,'#b77cff25'],[1,'#9553dd00']]);
    wallDust=field(128,[[0,'#d8dbe4ac'],[.22,'#bdc3d18a'],[.5,'#9daabe4f'],[.76,'#8195aa1b'],[1,'#71869b00']]);
  }
  function drawCore(ctx,run,timestamp){
    const a=run.coreArena;if(!a)return;preload();textures();
    if(typeof window!=='undefined'&&window.SlimeCorePurification?.revealed(run))return;
    const e=run.coreEncounter,y=a.centerY-run.cameraY,r=a.radius;
    if(y-r>840+80||y+r<0)return;
    const sky=run.worldId===5,anomalous=run.worldId===6,shell=shellArt(run.worldId,e?.beforeHp??a.hp??100);
    if(sky)skyGlow??=field(256,[[0,'#91e3ff95'],[.55,'#58bdff55'],[1,'#2763bb00']]);
    if(anomalous)sourceGlow??=field(256,[[0,'#e3ff8caa'],[.39,'#b6e94066'],[.68,'#9762d941'],[1,'#6545aa00']]);
    if(!anomalous&&!sky&&!planetGlows.has(run.worldId)){
      const [,mid,light]=window.SlimeCoreFractures.palette(window.SlimeCoreFractures.forWorld(run.worldId));
      planetGlows.set(run.worldId,field(256,[[0,light+'85'],[.55,mid+'45'],[1,mid+'00']]));
    }
    const age=e?.elapsed??timestamp,instability=anomalous?1-clamp((a.hp??100)/100):0;
    const pressure=anomalous?Math.sin(age/360)*Math.sin(age/1130):0;
    const beat=Math.max(0,Math.sin(age*Math.PI*2/960))**8+.5*Math.max(0,Math.sin((age-170)*Math.PI*2/960))**10;
    const pulse=1+(e?.reduced?0:anomalous?beat*.024:Math.sin(age/650)*.006);
    const hitAge=e?.hit?e.elapsed-e.hitAt:Infinity,pulseAge=e?.phantom&&e.hit?e.elapsed-e.lastSoulHitAt:hitAge,impact=1-clamp(pulseAge/650);
    const profile=impactProfile(visualReserve(e)),reaction=impactResponse(visualReserve(e),hitAge);
    const secondary=e?.phantom?impactResponse(visualReserve(e),pulseAge):null;
    ctx.save();
    if(e?.hit){const push=reaction.compression+(secondary?.compression||0)*.22;ctx.translate(a.x,y+reaction.kick);ctx.scale(1+push,1-push*.72);ctx.translate(-a.x,-y);}
    ctx.globalAlpha=.58+Math.sin(age/800)*.08+(anomalous?pressure*(.07+instability*.08):0);ctx.drawImage(anomalous?sourceGlow:sky?skyGlow:planetGlows.get(run.worldId),a.x-r*1.3,y-r*1.35,r*2.6,r*2.6);ctx.globalAlpha=1;
    const size=r*2*pulse*(1+impact*.013),left=a.x-size/2,top=y-size/2;
    if(shell){
      if(e?.glitch&&!run.evacuation&&window.SlimeGlitchCoreStrike)window.SlimeGlitchCoreStrike.drawShell(ctx,run,shell,left,top,size);
      else ctx.drawImage(shell,left,top,size,size);
    }
    else{ctx.fillStyle=sky?'#245582':'#573174';ctx.beginPath();ctx.arc(a.x,y,r,0,Math.PI*2);ctx.fill();}
    const damaged=e?.hit?shellArt(run.worldId,e.afterHp):null,reveal=e?.hit?smooth((hitAge-80)/540):0;
    if(damaged&&damaged!==shell&&!e?.purification){ctx.globalAlpha=reveal;ctx.drawImage(damaged,left,top,size,size);ctx.globalAlpha=1;}
    if(reaction.light>0&&sprite?.complete&&sprite.naturalWidth){
      if(!coreWhite){coreWhite=canvas(256,256);const x=coreWhite.getContext('2d');x.drawImage(sprite,0,0,256,256);x.globalCompositeOperation='source-in';x.fillStyle='#f5e7ff';x.fillRect(0,0,256,256);}
      if(anomalous&&!sourceWhite&&sourceSprite?.complete&&sourceSprite.naturalWidth){sourceWhite=canvas(256,256);const x=sourceWhite.getContext('2d');x.drawImage(shell,0,0,256,256);x.globalCompositeOperation='source-in';x.fillStyle='#f7ffe1';x.fillRect(0,0,256,256);}
      ctx.globalAlpha=reaction.light;ctx.drawImage(anomalous&&sourceWhite?sourceWhite:coreWhite,left,top,size,size);ctx.globalAlpha=1;
    }
    if(hitAge<950){
      const q=clamp(hitAge/950),fx=e.contactX??a.x,fy=a.surfaceY-run.cameraY;
      const width=110+profile.power*290+Math.sqrt(q)*(90+profile.power*190),height=width*.26;
      ctx.globalAlpha=(1-q)**1.7*(.22+profile.power*.4);ctx.drawImage(impactWave,fx-width/2,fy-height/2,width,height);
      ctx.globalAlpha=reaction.light*.62;const w=150+profile.power*330;ctx.drawImage(impactGlow,fx-w/2,fy-w*.28,w,w*.56);ctx.globalAlpha=1;
    }
    if(hitAge<850&&!e?.cosmos){ctx.globalAlpha=Math.pow(1-clamp(hitAge/850),1.6);ctx.drawImage(glow,a.x-190,a.surfaceY-run.cameraY-170,380,340);}
    if(hitAge<1250&&sprite?.complete&&sprite.naturalWidth){
      const t=hitAge/1000,count=e?.reduced?4:e?.lowPower?Math.ceil(profile.shards*.65):profile.shards;
      for(let i=0;i<count;i++){
        if(!shards[i]){
          const shard=canvas(40,40),c=shard.getContext('2d');c.beginPath();c.moveTo(4,9);c.lineTo(24,2);c.lineTo(38,17);c.lineTo(29,37);c.lineTo(9,33);c.closePath();c.clip();
          const sx=(i%3)*.19+.13,sy=.1+(i%2)*.16;c.drawImage(sprite,sprite.naturalWidth*sx,sprite.naturalHeight*sy,64,64,0,0,40,40);shards[i]=shard;
        }
        const angle=-Math.PI*.94+((i*.618+.13)%1)*Math.PI*.88,speed=profile.speed*(.65+(i*.373%1)*.7),sz=profile.size*(.65+(i*.217%1)*.7);
        ctx.save();ctx.globalAlpha=Math.max(0,1-t/1.25);ctx.translate(a.x+Math.cos(angle)*speed*t,a.surfaceY-run.cameraY+Math.sin(angle)*speed*t+100*t*t);
        ctx.rotate(t*(i%2?3:-3));ctx.drawImage(shards[i],-sz/2,-sz/2,sz,sz);ctx.restore();
      }
    }
    ctx.restore();
    // Distant wall fragments sell the weight of the hit without making the core rubbery.
    if(e?.finisher&&e.hit&&!e.reduced){
      const stamp=window.SlimeCoreVfx.stamp,pressure=smooth(hitAge/3800),count=e.lowPower?4:10;
      for(let i=0;i<count;i++){
        const q=(hitAge/(850+i%4*95)+i*.217)%1,side=i%2?1:-1;
        const px=(side<0?9:431)-side*q*(22+pressure*44),py=135+(i%4)*85+q*q*420;
        const sz=(8+pressure*11)*(1+i%3*.15);
        stamp(ctx,wallChips[i],px,py,sz,sz,Math.sin(q*Math.PI)*.84,side*q*2.5);
      }
    }
    if(hitAge<1800&&sprite?.complete&&sprite.naturalWidth){
      const count=e?.reduced?2:e?.lowPower?Math.ceil(profile.wallCount*.55):profile.wallCount,t=hitAge/1000;
      for(let i=0;i<count;i++){
        if(!shards[i%profile.shards])continue;
        if(!wallChips[i]&&wallSprite?.complete&&wallSprite.naturalWidth){
          const chip=canvas(40,40),c=chip.getContext('2d');c.beginPath();c.moveTo(4,9);c.lineTo(25,2);c.lineTo(38,17);c.lineTo(28,38);c.lineTo(8,32);c.closePath();c.clip();
          c.drawImage(wallSprite,wallSprite.naturalWidth*(.25+i%3*.09),wallSprite.naturalHeight*(.28+i%2*.12),wallSprite.naturalWidth*.22,wallSprite.naturalHeight*.22,0,0,40,40);wallChips[i]=chip;
        }
        const delay=(i%5)*.045,age=t-delay;if(age<0)continue;
        const side=i%2?1:-1,sx=side<0?14:426,sy=115+(i*.317%1)*465;
        const size=profile.wallSize*(.6+(i*.217%1)*.9),inward=(28+profile.power*84)*(1+(i%3)*.22);
        const px=sx-side*inward*age,py=sy+age*(i%3*28-45)+170*age*age;if(py-size>860)continue;
        ctx.save();ctx.globalAlpha=Math.max(0,1-age/1.65)*(.52+profile.power*.40);ctx.translate(px,py);ctx.rotate(age*(i%2?2.2:-2.8));
        ctx.drawImage(wallChips[i]||shards[i%profile.shards],-size/2,-size/2,size,size);ctx.restore();
      }
      if(!e?.reduced)for(let i=0;i<(e?.lowPower?Math.ceil(profile.dust/2):profile.dust);i++){
        const age=t-(i%4)*.055;if(age<0||age>1.55)continue;
        const q=clamp(age/1.55),side=i%2?1:-1,w=65+Math.sqrt(q)*(65+profile.power*100),h=w*(.8+i%3*.13);
        const px=(side<0?4:436)-side*Math.sqrt(q)*(18+profile.power*36),py=160+(i*.317%1)*415+q*q*95;
        ctx.save();ctx.globalAlpha=smooth(age/.09)*(1-q)**1.5*(.18+profile.power*.24);ctx.drawImage(wallDust,px-w/2,py-h/2,w,h);ctx.restore();
      }
    }
  }
  function text(ctx,value,x,y,size,color='#f3fff7',align='center'){
    ctx.font=`900 ${size}px "Slime Nunito",Nunito,sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(String(value),x,y);
  }
  function drawOverdrive(ctx,run){
    const e=run.coreEncounter;if(!e?.finisher||run.evacuation||!['overdrive','armed','release'].includes(e.phase))return;
    textures();const p=e.overdrive||0,s=run.slime,y=s.y-run.cameraY,flash=smooth(p)*(.64+.08*Math.sin(e.elapsed/130)),stamp=window.SlimeCoreVfx.stamp;
    ctx.save();ctx.globalCompositeOperation='lighter';
    stamp(ctx,limitGlow,s.x,y,100+p*220,100+p*220,flash*(e.reduced?.12:.46));
    for(let i=0;i<(e.lowPower||e.reduced?6:14);i++){
      const q=(e.elapsed/600+i*.271)%1,a=i*2.399,dist=(1-q)*(100+p*75);
      stamp(ctx,limitGlow,s.x+Math.cos(a)*dist,y+Math.sin(a)*dist*.8,8+q*12,8+q*12,Math.sin(q*Math.PI)*p*.8);
    }
    ctx.restore();
  }
  function box(ctx,x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
  function drawCritical(ctx,run){
    const e=run.coreEncounter,age=Math.max(0,e.elapsed-e.hitAt),fade=1-smooth((age-2700)/1100);if(fade<=0)return;
    textures();const stamp=window.SlimeCoreVfx.stamp,y=clamp(run.coreArena.surfaceY-run.cameraY-115-Math.min(30,age*.015),210,650);
    const pop=e.reduced?1:1+.60*Math.exp(-age/125)*Math.cos(age/95)+.08*Math.exp(-age/460)*Math.sin(age/58);
    ctx.save();ctx.globalAlpha=fade;
    stamp(ctx,criticalGlow,220,y,340+Math.min(180,age*.3),140,.40+.35*Math.exp(-age/300));
    if(!e.reduced)for(let i=0;i<(e.lowPower?4:8);i++){
      const q=clamp(age/600),a=i*Math.PI/4+.18,range=70+q*130;
      stamp(ctx,limitGlow,220+Math.cos(a)*range,y+Math.sin(a)*range*.40,12*(1-q)+4,12*(1-q)+4,(1-q)**2*.9);
    }
    ctx.translate(220,y);ctx.scale(pop,pop);if(!e.reduced)ctx.rotate(-.09*Math.exp(-age/220));
    ctx.font='1000 82px "Slime Nunito",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
    ctx.lineWidth=13;ctx.strokeStyle='#431429';ctx.fillStyle='#651b36';ctx.strokeText('9999',0,6);ctx.fillText('9999',0,6);
    ctx.lineWidth=6;ctx.strokeStyle='#9e2446';ctx.fillStyle='#ff4d68';ctx.strokeText('9999',0,0);ctx.fillText('9999',0,0);
    const flash=e.reduced?0:1-clamp(age/190);
    if(flash>0){ctx.globalAlpha=fade*flash*.90;ctx.fillStyle='#fff6dc';ctx.fillText('9999',0,0);}
    ctx.restore();
  }
  function drawHud(ctx,run){
    const e=run.coreEncounter;if(!e)return;const a=run.coreArena;
    if(e.cinematic){
      ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';const cold=e.electric||e.frost||e.cosmos||e.phantom||e.psionic||e.glitch;
      if(e.phase==='armed'){
        const p=smooth(e.phaseTime/180),y=Math.max(185+(e.hudOffset||0),Math.min(458,run.slime.y-run.cameraY+(e.techno?-119:95)));
        ctx.globalAlpha=p;ctx.font='1000 32px "Slime Nunito",sans-serif';ctx.lineWidth=4;ctx.strokeStyle=cold?'#153452cc':'#48271acc';ctx.fillStyle=cold?'#e7fbff':'#fff3ca';ctx.strokeText('УДАРЬ!',220,y);ctx.fillText('УДАРЬ!',220,y);
        ctx.font='900 12px "Slime Nunito",sans-serif';ctx.lineWidth=3;ctx.fillStyle=cold?'#bcefff':'#ffe3aa';ctx.strokeText('НАЖМИ НА ЭКРАН',220,y+29);ctx.fillText('НАЖМИ НА ЭКРАН',220,y+29);
      }
      if(e.hit&&e.finisher)drawCritical(ctx,run);
      if(e.hit&&!e.finisher){const critical=e.beforeHp>0&&e.afterHp<=0&&e.actualDamage>0,age=e.elapsed-e.hitAt,scale=1+Math.sin(clamp(age/320)*Math.PI)*(critical?.30:.17);ctx.globalAlpha=1-smooth((age-(e.finisher?2850:1050))/(e.finisher?1000:1200));ctx.translate(220,a.surfaceY-run.cameraY-82-Math.min(22,age*.012));ctx.scale(scale,scale);ctx.font=`1000 ${e.finisher?64:critical?52:43}px "Slime Nunito",sans-serif`;ctx.lineWidth=critical?6:5;ctx.strokeStyle=critical?'#50152ce0':cold?'#183d67c0':'#4a261bc0';ctx.fillStyle=critical?'#ff626b':cold?'#e0fbff':'#fff0a5';const amount=e.phantom&&!critical?Math.max(1,Math.round(e.actualDamage*e.phantomHitCount/e.soulCount)):e.actualDamage;const n=e.finisher?'9999':e.actualDamage?`−${amount}%`:'ОЧИЩЕНО';ctx.strokeText(n,0,0);ctx.fillText(n,0,0);}
      ctx.restore();return;
    }
    ctx.save();ctx.translate(0,e.hudOffset||0);const fade=e.phase==='approach'?smooth((e.phaseTime-550)/500):1;ctx.globalAlpha=fade;
    box(ctx,58,102,324,52,13,'#0b2d42c9');text(ctx,run.worldId===6?'СЕРДЦЕ МАТЕРИНСКОГО ЦВЕТКА':'ЯДРО',72,115,11,'#b9d7dc','left');text(ctx,`${Math.round(e.shownHp)}%`,367,115,14,'#f2ffdc','right');
    box(ctx,72,131,296,9,4,'#071e32');const hp=clamp(e.shownHp/100);if(hp>0)box(ctx,72,131,296*hp,9,4,e.shownHp>50?'#a7eb6d':e.shownHp>25?'#ffe07b':'#ff827a');
    if(!e.hit){
      text(ctx,`${run.worldId===6?'УДАР ПО СЕРДЦУ':'УДАР ПО ЯДРУ'}: ${Math.min(e.beforeHp,e.plannedDamage)}%`,220,185,20,'#ecffd0');
    }else if(e.hit){
      const age=e.elapsed-e.hitAt,scale=1+Math.sin(clamp(age/330)*Math.PI)*.2;
      ctx.save();ctx.translate(220,(run.evacuation?246:a.surfaceY-run.cameraY-86)-Math.min(25,age*.012));ctx.scale(scale,scale);
      text(ctx,e.actualDamage?`−${e.actualDamage}%`:'ОЧИЩЕНО',0,0,e.afterHp<=0?54:46,e.afterHp<=0?'#ff626b':'#fff4a8');ctx.restore();
      if(age<380){ctx.globalAlpha=Math.max(0,(e.reduced?.08:.23)*Math.pow(1-age/380,2));ctx.fillStyle='#deffe6';ctx.fillRect(0,0,440,840);}
    }
    ctx.restore();
  }
  const ready=()=>!!(coreWhite&&shards.length===21&&wallChips.length===26&&Object.values(damageSprites).every(stages=>Object.values(stages).every(image=>image.complete&&image.naturalWidth)));
  const api=Object.freeze({CORE_ASSET,FINISHER,FIRE,ELECTRIC,FROST,COSMOS,TECHNO,PHANTOM,PSIONIC,GLITCH,SPORES,rockSize,droneCount,strikeKind,damage,visualStrength,visualReserve,cosmosTier,impactProfile,impactResponse,preparationPose,fracture,arena,begin,requestStrike,update,applyCinematic,preload,ready,shellArt,drawCore,drawOverdrive,drawHud});
  if(typeof window!=='undefined')window.SlimeCoreEncounter=api;
  if(typeof module!=='undefined')module.exports=api;
})();
