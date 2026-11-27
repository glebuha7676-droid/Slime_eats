const fs=require('fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const p=await b.newPage();await p.setContent('<canvas width="440" height="840"></canvas>');
  await p.addScriptTag({content:fs.readFileSync('js/rendering/core-vfx.js','utf8')});
  await p.evaluate(()=>{window.__canvases=[];const create=document.createElement.bind(document);document.createElement=(...a)=>{const c=create(...a);if(a[0]==='canvas')__canvases.push(c);return c;};});
  const source=fs.readFileSync('js/rendering/fire-core-strike.js','utf8');
  const old=source.replace('const AURA={w:224,h:288,x:112,y:224},FRONT_AURA={w:128,h:144,x:64,y:100};','const AURA={w:256,h:320,x:128,y:246},FRONT_AURA=AURA;');
  await p.addScriptTag({content:old});await p.evaluate(()=>{window.__old=SlimeFireCoreStrike;__old.prepare();window.__oldBytes=__canvases.reduce((n,c)=>n+c.width*c.height*4,0);__canvases.length=0;});
  await p.addScriptTag({content:source});
  const r=await p.evaluate(()=>{
   const V=SlimeCoreVfx;SlimeFireCoreStrike.prepare();const newBytes=__canvases.reduce((n,c)=>n+c.width*c.height*4,0);
   const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=440;a.height=b.height=840;
   const x=a.getContext('2d'),y=b.getContext('2d');let maxDifference=0,changed=0,samples=0;
   for(const radius of [20,30,50])for(const power of [.25,1])for(const elapsed of [300,900,1700]){
    const run={slime:{x:220,y:400,radius},cameraY:0,coreArena:{surfaceY:740},coreEncounter:{fire:true,phase:'armed',elapsed,aura:power,power,jet:0}};
    x.clearRect(0,0,440,840);y.clearRect(0,0,440,840);__old.draw(x,run);__old.draw(x,run,true);SlimeFireCoreStrike.draw(y,run);SlimeFireCoreStrike.draw(y,run,true);
    const aa=x.getImageData(0,0,440,840).data,bb=y.getImageData(0,0,440,840).data;
    for(let i=0;i<aa.length;i+=4){
     let d=Math.abs(aa[i+3]-bb[i+3]);for(let ch=0;ch<3;ch++)d=Math.max(d,Math.abs(aa[i+ch]*aa[i+3]-bb[i+ch]*bb[i+3])/255);
     maxDifference=Math.max(d,maxDifference);if(d>3)changed++;
    }samples++;
   }
   // Repeated texture time performs no extra cache draws.
   const f=[document.createElement('canvas'),document.createElement('canvas')],target=document.createElement('canvas');f.forEach(c=>{c.width=c.height=4;});target.width=target.height=4;
   let calls=0;const cx=target.getContext('2d'),draw=cx.drawImage.bind(cx);cx.drawImage=(...a)=>{calls++;return draw(...a);};V.blend(f,target,.2);const first=calls;V.blend(f,target,.2);
   return {oldBytes:__oldBytes,newBytes,savedBytes:__oldBytes-newBytes,maxDifference,changed,samples,repeatBlendDraws:calls-first};
  });
  // Different texture extents can change GPU resampling rounding by a few alpha units.
  assert(r.newBytes<r.oldBytes*.72);assert(r.changed<=10&&r.maxDifference<=4,'Compact atlas preserves visible fire pixels within raster rounding');assert.equal(r.repeatBlendDraws,0);
  fs.writeFileSync('output/core-vfx-performance/fire-cache.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
