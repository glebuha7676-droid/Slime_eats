/* Shared Strength for hazards, maneuvers and abilities. */
(() => {
  'use strict';
  const CONFIG=Object.freeze({max:100,hazard:15,pickup:12,hazardGraceMs:800});
  const clamp=v=>Math.max(0,Math.min(CONFIG.max,Number(v)||0));
  function init(run){
    run.energy=CONFIG.max;run.maxEnergy=CONFIG.max;run.energyEvent=null;
    run.energyStats={hazardHits:0,hazardSpent:0,pickups:0,recovered:0,discharged:0};
    run.energyHazardAt=-Infinity;
  }
  function change(run,delta,kind,at=0){
    const before=run.energy;run.energy=Math.round(clamp(before+delta)*10000)/10000;const actual=Math.round((run.energy-before)*10000)/10000;
    if(actual)run.energyEvent={id:(run.energyEvent?.id||0)+1,kind,delta:actual,at};
    return actual;
  }
  function hazard(run,at){if(at-(run.energyHazardAt??-Infinity)<CONFIG.hazardGraceMs)return 0;run.energyHazardAt=at;const spent=-change(run,-CONFIG.hazard,'hazard',at);run.energyStats.hazardHits++;run.energyStats.hazardSpent+=spent;return spent;}
  function recover(run,amount=CONFIG.pickup,at=0){const gain=change(run,amount,'recover',at);run.energyStats.recovered+=gain;return gain;}
  function discharge(run,at){const spent=-change(run,-run.energy,'discharge',at);run.energyStats.discharged+=spent;return spent;}
  const coreDamage=energy=>Math.round(10+clamp(energy)/10);
  const api=Object.freeze({CONFIG,init,change,hazard,recover,discharge,coreDamage});
  if(typeof window!=='undefined')window.SlimeAnomalyEnergy=api;
  if(typeof module!=='undefined')module.exports=api;
})();
