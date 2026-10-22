const assert=require('node:assert/strict'),R=require('../js/config/daily-rewards.js');
const noon=(day,hour=12)=>new Date(2026,9,day,hour).getTime();
let model=R.normalize(null),total=0;
for(let i=0;i<8;i++){
 const now=noon(21+i*2),s=R.status(model,now),claim=R.claim(model,now);
 assert.equal(s.day,i%7+1);assert(claim);assert.equal(claim.amount,R.DAILY[i%7]);total+=claim.amount;model=claim.model;
 assert.equal(R.claim(model,now+1000),null,'No duplicate daily claim');
 assert.equal(R.status(model,now-86400000).dailyAvailable,false,'Rewinding the clock does not issue another gift');
}
assert.equal(total,R.DAILY.reduce((a,b)=>a+b)+10);
model=R.normalize(null);
model=R.reserve(model,'free',noon(21));assert(model);assert.equal(R.reserve(model,'free',noon(21,23)),null);
assert(R.status(model,noon(22,0)).freeAvailable);
model=R.reserve(model,'ad',noon(21));assert.equal(R.status(model,noon(21)+1).adRemaining,1);
assert.equal(R.reserve(model,'ad',noon(21)+R.AD_COOLDOWN-1),null);
model=R.reserve(model,'ad',noon(21)+R.AD_COOLDOWN);assert(model);
assert.equal(R.status(model,noon(21)+R.AD_COOLDOWN*2).adRemaining,0);
assert.equal(R.status(model,noon(20)).adRemaining,0,'Rewinding the date does not reset the daily ad quota');
assert.equal(R.reserve(model,'ad',noon(21)+R.AD_COOLDOWN*3),null);
assert.equal(R.status(model,noon(22)).adRemaining,2);
for(let index=0;index<8;index++)for(const jitter of [0,.2,.5,.8,1])for(const from of [0,83,275,359]){
 const spin=R.createSpin(index,{now:noon(21),from,random:()=>jitter});
 assert.equal(R.indexAtAngle(spin.toAngle),index,'Pointer agrees with the issued reward');
 assert.equal(R.spinAngle(spin,spin.startedAt),from);assert.equal(R.spinAngle(spin,spin.endsAt),spin.toAngle);
 const normalized=R.normalizePending(JSON.parse(JSON.stringify(spin)));assert.equal(normalized.toAngle,spin.toAngle);assert.equal(normalized.amount,R.WHEEL[index]);
}
model=R.normalize(null,{dailyStreak:6,lastDailyDate:'2026-10-21',lastWheelDate:'2026-10-21',wheelAdDate:'2026-10-21',wheelAdSpins:2});
assert.equal(R.status(model,noon(21)).dailyAvailable,false);assert.equal(R.status(model,noon(21)).freeAvailable,false);assert.equal(R.status(model,noon(22)).day,7);
assert.equal(R.status(model,noon(21)).adRemaining,0);
assert.equal(R.normalizePending({rewardIndex:99}),null);assert.equal(R.normalizePending({rewardIndex:4}).version,undefined);
assert.equal(R.formatWait(3600001),'01:00:01');
console.log('Seven-day cycle without missed-day resets, midnight timers, ad limits/cooldown, migration and 160 exact wheel landings passed.');
