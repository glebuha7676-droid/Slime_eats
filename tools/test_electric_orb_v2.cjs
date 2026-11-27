const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await b.newPage();await p.setContent('<canvas width="440" height="600"></canvas>');await p.addScriptTag({content:fs.readFileSync('js/rendering/core-vfx.js','utf8')});await p.addScriptTag({content:fs.readFileSync('js/rendering/electric-core-strike.js','utf8')});
  const result=await p.evaluate(()=>{
   SlimeElectricCoreStrike.prepare();const c=document.querySelector('canvas'),x=c.getContext('2d');let strokes=0;const stroke=x.stroke.bind(x);x.stroke=(...a)=>{strokes++;return stroke(...a);};
   const run={cameraY:0,slime:{x:220,y:340,radius:30},coreEncounter:{electric:true,phase:'armed',aura:1,power:1,jet:0,elapsed:2500,lowPower:true}};
   SlimeElectricCoreStrike.draw(x,run);SlimeElectricCoreStrike.draw(x,run,true);const a=x.getImageData(0,0,440,600).data;
   let left=440,right=0,top=600,bottom=0;for(let j=0;j<600;j++)for(let i=0;i<440;i++)if(a[(j*440+i)*4+3]>45){left=Math.min(left,i);right=Math.max(right,i);top=Math.min(top,j);bottom=Math.max(bottom,j);}
   x.clearRect(0,0,440,600);run.coreEncounter.elapsed+=180;SlimeElectricCoreStrike.draw(x,run);SlimeElectricCoreStrike.draw(x,run,true);const d=x.getImageData(0,0,440,600).data;let changing=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i+3]-d[i+3])>15)changing++;
   return {aspect:(right-left)/(bottom-top),strokes,changing};
  });
  assert(result.aspect>.7&&result.aspect<1.5,'Aura is a round clot, not an upward flame silhouette');assert.equal(result.strokes,0,'Charge bolts and plasma are cached');assert(result.changing>300,'Orb currents and radial discharges visibly move');console.log(JSON.stringify(result));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
