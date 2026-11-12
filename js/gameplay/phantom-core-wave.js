/* Smooth deterministic gathering and a forceful soul fan-out, all routed into the core. */
(() => {
  'use strict';
  const TAU=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const count=reserve=>reserve>100?32+Math.ceil((Math.min(150,reserve)-100)/50*18):[8,14,22,32][reserve>=75?3:reserve>=50?2:reserve>=25?1:0];
  const clock=(e,time)=>e.lowPower||e.reduced?Math.floor(time/33.3333333333)*33.3333333333:time;
  function orbit(run,index,time,out={}){
    const e=run.coreEncounter,s=run.slime,p=e.power||.25,n=count(e.finisher?100+50*(e.overdrive||0):e.strikeEnergy??p*100);
    const spawn=e.finisher&&index>=32?(e.overdriveStart||2450)+(index-32)/18*850:60+index/(e.finisher?31:Math.max(1,n-1))*1080+Math.sin(index*7.1)*38,age=time-spawn,join=smooth(age/1040);
    const collapse=smooth((time-180)/2150),small=s.radius*(1.35+p*.80)*(1+Math.sin(index*9.1)*.11);
    const ring=s.radius*(4.1+p*1.6)*(1-collapse)+small*collapse;
    const radius=(280+Math.sin(index*8.9)*65)*(1-join)+ring*join;
    const motion=time*(e.reduced?.28:1),a=motion/(170+index%5*39)*(index%3===0?-1:1)+index*2.399;
    const incline=.52+(index%4)*.27,tilt=index*1.073,px=Math.cos(a)*radius,py=Math.sin(a)*Math.cos(incline)*radius,z=Math.sin(a)*Math.sin(incline);
    out.x=s.x+px*Math.cos(tilt)-py*Math.sin(tilt);out.y=s.y+px*Math.sin(tilt)+py*Math.cos(tilt)-s.radius*.12;
    out.front=z>.10;out.depth=.78+(z+1)*.14;out.alpha=smooth(age/210);out.radius=radius;out.join=join;
    return out;
  }
  function create(run,reserve,random=Math.random){
    const e=run.coreEncounter,a=run.coreArena,s=run.slime,r=a.radius||418,cy=a.centerY??a.surfaceY+r,out=[],n=count(reserve),p=e.power||.25;
    const at=clock(e,e.castElapsed??e.elapsed),pose={...run,slime:{...s,x:e.castX??s.x,y:e.castY??s.y}},start={},previous={};
    for(let i=0;i<n;i++){
      orbit(pose,i,at,start);orbit(pose,i,at-55,previous);
      const side=Math.abs(start.x-pose.slime.x)>8?Math.sign(start.x-pose.slime.x):i%2?1:-1;
      const x=52+random()*336,dx=x-a.x,vy=(start.y-previous.y)/55;
      out.push({index:i,side,delay:(i+random()*.35)/Math.max(1,n-1)*(e.finisher?1150:210),duration:900+random()*300,
        fromX:start.x,fromY:start.y,tailX:previous.x,tailY:previous.y,
        c1x:clamp(start.x+side*(35+random()*100)*(.65+p*.35)+(start.x-previous.x)*.8,23,417),
        c1y:start.y+(start.y-pose.slime.y)*(.35+random()*.8)+(random()-.5)*110+clamp(vy*45,-55,55),
        c2x:clamp(x+side*(25+random()*100),28,412),c2y:a.surfaceY-190+random()*110,
        x,y:cy-Math.sqrt(r*r-dx*dx)+15+random()*28,
        phase:random()*TAU,wiggle:5+random()*9,size:.80+random()*.35,
        hit:false,hitAt:0,sample:{},tailA:{},tailB:{},tailC:{},echoA:{},echoB:{},echoTailA:{},echoTailB:{}});
      if(e.finisher){
        const soul=out[out.length-1],x=a.x+Math.sin(i*2.399)*66,dx=x-a.x;
        Object.assign(soul,{delay:i/Math.max(1,n-1)*1720+(random()-.5)*48+24,duration:300+random()*115,
          fromX:pose.slime.x+Math.sin(i*2.399)*15,fromY:pose.slime.y+s.radius*.45,
          tailX:pose.slime.x+Math.sin(i*2.399)*15,tailY:pose.slime.y+s.radius*.45,
          c1x:pose.slime.x+Math.sin(i*2.399)*128,c1y:pose.slime.y+35+random()*100,c2x:a.x-Math.sin(i*2.399)*90,c2y:a.surfaceY-55-random()*100,
          x,y:cy-Math.sqrt(r*r-dx*dx)+8,wiggle:10+random()*15});
      }
    }
    return out;
  }
  function sample(soul,age,out){
    const life=clamp((age-soul.delay)/soul.duration),p=life+.18*Math.sin(life*Math.PI)*(1-life),n=1-p,fade=Math.sin(p*Math.PI);
    const wiggle=fade*(Math.sin(p*11+soul.phase)*.72+Math.sin(p*23-soul.phase)*.28)*soul.wiggle;
    out.x=n*n*n*soul.fromX+3*n*n*p*soul.c1x+3*n*p*p*soul.c2x+p*p*p*soul.x+wiggle;
    out.y=n*n*n*soul.fromY+3*n*n*p*soul.c1y+3*n*p*p*soul.c2y+p*p*p*soul.y+Math.sin(p*15+soul.phase)*fade*5;
    out.p=p;return out;
  }
  const api=Object.freeze({count,create,sample,orbit,clock});
  if(typeof window!=='undefined')window.SlimePhantomCoreWave=api;
  if(typeof module!=='undefined')module.exports=api;
})();

