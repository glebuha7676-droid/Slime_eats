/* Reward rules are independent of the panel, animation and ad provider. */
(() => {
  'use strict';
  const DAILY = Object.freeze([10,15,20,25,30,40,60]);
  const WHEEL = Object.freeze([10,15,20,25,30,40,50,75]);
  const AD_LIMIT=2, AD_COOLDOWN=5*60*1000, SPIN_MS=4600;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const integer=(v,fallback=0)=>Number.isFinite(+v)?Math.max(0,Math.floor(+v)):fallback;
  const dayKey=(now=Date.now())=>{const d=new Date(now);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const nextDay=now=>{const d=new Date(now);d.setHours(24,0,0,0);return d.getTime()};
  const legacyReady=key=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(key||''))return 0;
    const [y,m,d]=key.split('-').map(Number),time=new Date(y,m-1,d).getTime();
    return Number.isFinite(time)?nextDay(time):0;
  };
  function normalize(value,legacy={}){
    if(!value||value.version!==2)return {version:2,dailyClaimed:clamp(integer(legacy.dailyStreak),0,7),dailyReadyAt:legacyReady(legacy.lastDailyDate),wheelReadyAt:legacyReady(legacy.lastWheelDate),adDay:legacy.wheelAdDate||'',adSpins:clamp(integer(legacy.wheelAdSpins),0,2),adResetAt:legacyReady(legacy.wheelAdDate),adReadyAt:0,wheelAngle:0,lastPrize:null};
    return {version:2,dailyClaimed:clamp(integer(value.dailyClaimed),0,7),dailyReadyAt:integer(value.dailyReadyAt),wheelReadyAt:integer(value.wheelReadyAt),adDay:/^\d{4}-\d{2}-\d{2}$/.test(value.adDay||'')?value.adDay:'',adSpins:clamp(integer(value.adSpins),0,2),adResetAt:integer(value.adResetAt)||legacyReady(value.adDay),adReadyAt:integer(value.adReadyAt),wheelAngle:((+value.wheelAngle||0)%360+360)%360,lastPrize:value.lastPrize&&[...DAILY,...WHEEL].includes(+value.lastPrize.amount)?{id:String(value.lastPrize.id||''),amount:+value.lastPrize.amount,kind:value.lastPrize.kind==='daily'?'daily':'wheel',at:integer(value.lastPrize.at)}:null};
  }
  function status(model,now=Date.now()){
    const dailyAvailable=now>=model.dailyReadyAt,freeAvailable=now>=model.wheelReadyAt;
    const day=dailyAvailable?model.dailyClaimed%7+1:Math.max(1,model.dailyClaimed);
    const adSpins=now>=(model.adResetAt||0)?0:model.adSpins;
    const adRemaining=AD_LIMIT-adSpins;
    return {dailyAvailable,freeAvailable,day,amount:DAILY[day-1],dailyWait:Math.max(0,model.dailyReadyAt-now),wheelWait:Math.max(0,model.wheelReadyAt-now),adRemaining,adWait:Math.max(0,model.adReadyAt-now),adAvailable:adRemaining>0&&now>=model.adReadyAt};
  }
  function claim(model,now=Date.now()){
    const s=status(model,now);if(!s.dailyAvailable)return null;
    return {amount:s.amount,day:s.day,model:{...model,dailyClaimed:s.day,dailyReadyAt:nextDay(now)}};
  }
  function reserve(model,source,now=Date.now()){
    const s=status(model,now);
    if(source==='free')return s.freeAvailable?{...model,wheelReadyAt:nextDay(now)}:null;
    if(source!=='ad'||!s.adAvailable)return null;
    return {...model,adDay:dayKey(now),adSpins:(now>=(model.adResetAt||0)?0:model.adSpins)+1,adResetAt:nextDay(now),adReadyAt:now+AD_COOLDOWN};
  }
  const mod=angle=>(angle%360+360)%360;
  function createSpin(index,{now=Date.now(),from=0,random=Math.random}={}){
    index=clamp(integer(index),0,WHEEL.length-1);
    const jitter=(clamp(random(),0,1)-.5)*14;
    const to=from+6*360+mod(-index*45+jitter-mod(from));
    return {version:2,id:`wheel-${now}-${index}-${Math.floor(random()*1e6)}`,rewardIndex:index,amount:WHEEL[index],startedAt:now,endsAt:now+SPIN_MS,fromAngle:from,toAngle:to};
  }
  function normalizePending(value){
    if(!value||!Number.isInteger(value.rewardIndex))return null;
    if(value.version!==2)return value.rewardIndex>=0&&value.rewardIndex<6?{rewardIndex:value.rewardIndex,startedAt:integer(value.startedAt)}:null;
    if(value.rewardIndex<0||value.rewardIndex>=WHEEL.length)return null;
    const startedAt=integer(value.startedAt);
    return {...createSpin(value.rewardIndex,{now:startedAt,from:0,random:()=>.5}),id:String(value.id||`wheel-${startedAt}`),fromAngle:Number.isFinite(+value.fromAngle)?+value.fromAngle:0,toAngle:Number.isFinite(+value.toAngle)?+value.toAngle:-value.rewardIndex*45,endsAt:startedAt+SPIN_MS};
  }
  const indexAtAngle=angle=>Math.floor(mod(-angle+22.5)/45)%8;
  const spinAngle=(pending,now)=>{const t=clamp((now-pending.startedAt)/SPIN_MS,0,1);return pending.fromAngle+(pending.toAngle-pending.fromAngle)*(1-Math.pow(1-t,4))};
  const formatWait=ms=>{const seconds=Math.max(0,Math.ceil(ms/1000));return [Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(v=>String(v).padStart(2,'0')).join(':')};
  const api=Object.freeze({DAILY,WHEEL,AD_LIMIT,AD_COOLDOWN,SPIN_MS,dayKey,nextDay,normalize,status,claim,reserve,createSpin,normalizePending,indexAtAngle,spinAngle,formatWait,mod});
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof window!=='undefined')window.SlimeDailyRewards=api;
})();
