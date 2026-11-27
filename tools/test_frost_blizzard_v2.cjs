const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await b.newPage();await p.setContent('<canvas width="440" height="840"></canvas>');await p.addScriptTag({content:fs.readFileSync('js/rendering/core-vfx.js','utf8')});await p.addScriptTag({content:fs.readFileSync('js/rendering/frost-core-strike.js','utf8')});
  const result=await p.evaluate(()=>{
   SlimeFrostCoreStrike.prepare();const c=document.querySelector('canvas'),x=c.getContext('2d');let gradients=0;const radial=x.createRadialGradient.bind(x);x.createRadialGradient=(...a)=>{gradients++;return radial(...a);};
   const values=[];for(const reserve of [5,35,60,85]){
    const power=(reserve/100)**.65,run={cameraY:0,slime:{x:220,y:360,radius:30},coreEncounter:{frost:true,phase:'armed',elapsed:2600,phaseTime:160,transfer:1,strikeEnergy:reserve,power,aura:power}};
    x.clearRect(0,0,440,840);SlimeFrostCoreStrike.backdrop(x,run);let a=x.getImageData(0,0,440,840).data,sum=0;for(let i=3;i<a.length;i+=4)sum+=a[i];values.push(sum);
   }
   const run={cameraY:0,slime:{x:220,y:360,radius:30},coreEncounter:{frost:true,phase:'armed',elapsed:2600,phaseTime:160,transfer:1,strikeEnergy:100,power:1,aura:1}};
   x.clearRect(0,0,440,840);SlimeFrostCoreStrike.draw(x,run);const a=x.getImageData(0,0,440,840).data;let left=440,right=0,top=840,bottom=0;for(let j=0;j<840;j++)for(let i=0;i<440;i++)if(a[(j*440+i)*4+3]>45){left=Math.min(left,i);right=Math.max(right,i);top=Math.min(top,j);bottom=Math.max(bottom,j);}
   return {values,aspect:(right-left)/(bottom-top),gradients};
  });
  for(let i=1;i<4;i++)assert(result.values[i]>result.values[i-1]*1.12,'The whole mine becomes colder at each strength tier');assert(result.aspect>.7&&result.aspect<1.65,'Diffuse cold aura is not a tall flame');assert.equal(result.gradients,0);console.log(JSON.stringify(result));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
