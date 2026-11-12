/* Planet presentation/progression is separate from legacy mine slot numbers. */
(() => {
  'use strict';
  // New art currently has two states. Keep all gameplay milestones while
  // showing the same infected world until its core is fully cleansed.
  const floraFrames=id=>Object.freeze(Object.fromEntries([100,75,50,25,0].map(stage=>
    [stage,`assets/ui/planets/mutation-flora-v1/${id}-${stage===0?0:100}.webp`])));
  const planets=Object.freeze([
    {id:'home',worldId:1,name:'СЛАЙМОВЫЙ МИР',theme:'Заражён мутагеном',frames:floraFrames('home')},
    {id:'candy',worldId:3,name:'КОНФЕТНЫЙ МИР',theme:'Заражён мутагеном',frames:floraFrames('candy')},
    {id:'magma',worldId:4,name:'МАГМОВЫЙ МИР',theme:'Заражён мутагеном',frames:floraFrames('magma')},
    // Keep the legacy ID so existing core damage, unlocks and pending rewards survive.
    {id:'desert',worldId:5,name:'НЕБЕСНЫЙ МИР',theme:'Заражён мутагеном',frames:floraFrames('sky')},
    {id:'source',worldId:6,name:'МАТЕРИНСКИЙ АСТЕРОИД',theme:'Очаг Аномалии',frames:floraFrames('source')}
  ]);
  const ids=planets.map(p=>p.id),milestones=Object.freeze([75,50,25,0]);
  const get=id=>planets.find(p=>p.id===id)||planets[0];
  const forWorld=id=>planets.find(p=>p.worldId===Number(id))||null;
  const hp=value=>Math.max(0,Math.min(100,Math.round(Number(value)||0)));
  function stage(value){const n=hp(value);return n>75?100:n>50?75:n>25?50:n>0?25:0;}
  const tone=value=>value<=0?'clear':value>75?'green':value>50?'yellow':value>25?'orange':'red';
  function normalize(value,legacy={}){
    const source=value&&typeof value==='object'?value:null;
    const cores=Object.fromEntries(ids.map(id=>[id,source?.cores?.[id]==null?100:hp(source.cores[id])]));
    const unlocked=new Set(['home',...(Array.isArray(source?.unlocked)?source.unlocked:[]).filter(id=>ids.includes(id))]);
    if(!source)for(const worldId of Array.isArray(legacy.unlockedWorlds)?legacy.unlockedWorlds:[]){const planet=forWorld(worldId);if(planet)unlocked.add(planet.id);}
    for(let i=1;i<ids.length;i++)if(cores[ids[i-1]]===0)unlocked.add(ids[i]);
    const selected=ids.includes(source?.selected)?source.selected:forWorld(legacy.world)?.id||'home';
    const pending=(Array.isArray(source?.pending)?source.pending:[]).filter(e=>e&&ids.includes(e.planetId)&&Number.isFinite(+e.from)&&Number.isFinite(+e.to)&&+e.from>+e.to).slice(-12).map(e=>({id:String(e.id),planetId:e.planetId,from:hp(e.from),to:hp(e.to),damage:hp(e.from)-hp(e.to)}));
    return {version:1,cores,selected,unlocked:[...unlocked],nextEvent:Math.max(1,Math.floor(+source?.nextEvent||1)),pending};
  }
  const isUnlocked=(campaign,id)=>normalize(campaign).unlocked.includes(id);
  function applyDamage(value,id,amount){
    const campaign=normalize(value);if(!ids.includes(id)||!isUnlocked(campaign,id))return {campaign,event:null};
    const from=campaign.cores[id],to=Math.max(0,from-hp(amount));
    if(to===from)return {campaign,event:null};
    const event={id:`core-${campaign.nextEvent++}`,planetId:id,from,to,damage:from-to};
    campaign.cores[id]=to;campaign.selected=id;campaign.pending.push(event);
    const index=ids.indexOf(id);if(to===0&&ids[index+1]&&!campaign.unlocked.includes(ids[index+1]))campaign.unlocked.push(ids[index+1]);
    return {campaign,event};
  }
  function acknowledge(value,id){const result=normalize(value);result.pending=result.pending.filter(e=>e.id!==id);return result;}
  const api=Object.freeze({planets,ids,milestones,get,forWorld,stage,tone,normalize,isUnlocked,applyDamage,acknowledge});
  if(typeof window!=='undefined')window.SlimePlanetCampaign=api;
  if(typeof module!=='undefined')module.exports=api;
})();
