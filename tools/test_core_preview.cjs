const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const dir='output/core-preview-v1';fs.mkdirSync(dir,{recursive:true});
 try{
  for(const width of [440,320]){
   const p=await b.newPage({viewport:{width,height:width===440?840:568}}),errors=[];p.on('pageerror',e=>errors.push(e.stack));
   await p.goto('http://127.0.0.1:8766/?v=core-preview-1');
   await p.waitForFunction(()=>document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   const before=await p.evaluate(()=>JSON.stringify({...localStorage}));
   await p.locator('#adminMenuBtn').click();await p.locator('#adminCorePreviewBtn').click();
   await p.waitForFunction(()=>SlimeCorePreview.state()?.preview);
   await p.waitForFunction(()=>SlimeCorePreview.state().phase==='armed');
   assert.equal((await p.evaluate(()=>SlimeCorePreview.state())).reserve,100);
   await p.locator('#corePreview [data-action=pause]').click();
   const time=(await p.evaluate(()=>SlimeCorePreview.state())).elapsed;await p.waitForTimeout(250);
   assert.equal((await p.evaluate(()=>SlimeCorePreview.state())).elapsed,time);
   await p.screenshot({path:`${dir}/compact-${width}.png`});
   await p.locator('#corePreview [data-action=settings]').click();
   await p.screenshot({path:`${dir}/settings-${width}.png`});
   const box=await p.locator('#corePreview').boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);assert(box.y>50);
   await p.locator('#corePreview [name=mutation]').selectOption('telekinesis');
   await p.locator('#corePreview [data-energy="25"]').click();
   await p.waitForFunction(()=>SlimeCorePreview.state().phase==='armed');
   let s=await p.evaluate(()=>SlimeCorePreview.state());assert.equal(s.kind,'psionic');assert.equal(s.reserve,25);
   await p.locator('#corePreview [data-action=settings]').click();
   const shaft=await p.locator('#shaft').boundingBox();await p.mouse.click(shaft.x+shaft.width*.6,shaft.y+shaft.height*.5);
   await p.waitForFunction(()=>SlimeCorePreview.state().phase==='done',null,{timeout:20000});
   s=await p.evaluate(()=>SlimeCorePreview.state());assert.equal(s.damage,13);assert(await p.locator('#resultOverlay').evaluate(e=>e.classList.contains('hidden')));
   assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage})),before,'Preview cannot write progress');
   await p.locator('#corePreview [data-action=repeat]').click();
   await p.waitForFunction(()=>!SlimeCorePreview.state().ended);assert.equal((await p.evaluate(()=>SlimeCorePreview.state())).mutation,'telekinesis');
   if(width===440){
    await p.locator('#corePreview [data-action=settings]').click();
    for(const [id,kind]of [['fire','fire'],['electric','electric'],['frost','frost'],['cosmos','cosmos'],['nano','techno'],['phantom','phantom'],['cloning','spores'],['glitch','glitch']]){
     await p.locator('#corePreview [name=mutation]').selectOption(id);await p.waitForFunction(()=>SlimeCorePreview.state().phase!=='fall');
     assert.equal((await p.evaluate(()=>SlimeCorePreview.state())).kind,kind);
    }
    await p.locator('#corePreview [name=mutation]').selectOption('fire');
    await p.locator('#corePreview [name=stage]').selectOption('1');
    await p.locator('#corePreview [name=world]').selectOption('3');
    await p.locator('#corePreview [name=hp]').selectOption('5');
    await p.locator('#corePreview [data-energy="100"]').click();
    await p.waitForFunction(()=>SlimeCorePreview.state().phase==='done',null,{timeout:20000});
    s=await p.evaluate(()=>SlimeCorePreview.state());assert.equal(s.stage,1);assert.equal(s.damage,5);assert.equal(s.coreHp,0);
    await p.locator('#corePreview [name=energy]').fill('0');await p.locator('#corePreview [name=energy]').dispatchEvent('change');
    await p.waitForFunction(()=>SlimeCorePreview.state().phase==='done',null,{timeout:9000});assert.equal((await p.evaluate(()=>SlimeCorePreview.state())).damage,0);
   }
   assert.deepEqual(errors,[]);assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage})),before);
   await p.reload();await p.waitForFunction(()=>document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
   assert.equal(await p.locator('#corePreview').count(),0);assert.equal(await p.evaluate(()=>document.body.dataset.screen),'home');
   console.log(JSON.stringify({width,realAdminEntry:true,replay:true,charge:true,pause:true,noProgressWrites:true,reloadExits:true,errors}));
   await p.close();
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
