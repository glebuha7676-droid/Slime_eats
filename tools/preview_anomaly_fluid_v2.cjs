const fs=require('node:fs'),assert=require('node:assert/strict'),sharp=require('sharp'),{chromium}=require('playwright');
(async()=>{
 const root='assets/ui/anomaly-fluid-v2/',out='output/anomaly-fluid-v2';fs.mkdirSync(out,{recursive:true});
 const records=[];
 for(const n of [1,3,5]){
  const {data,info}=await sharp(root+`block-plus-${n}.webp`).resize(64,64).raw().toBuffer({resolveWithObject:true});
  let colored=0;for(let i=0;i<data.length;i+=info.channels){const[r,g,b]=data.slice(i,i+3);if((b>g*1.35&&r>g*1.2)||(g>r*1.2&&g>b*1.5))colored++;}
  records.push({reward:n,coloredFraction:colored/(64*64)});
 }
 assert(records[1].coloredFraction>records[0].coloredFraction*1.3);assert(records[2].coloredFraction>records[1].coloredFraction*1.5);
 const jar=await sharp(root+'jar.webp').metadata();assert(jar.hasAlpha);
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1040,height:650},deviceScaleFactor:1}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8766/'+root+'preview.html');await page.evaluate(()=>document.fonts.ready);
  await page.locator('img').evaluateAll(images=>Promise.all(images.map(i=>i.decode())));
  await page.screenshot({path:out+'/comparison.png',fullPage:true});
  await page.setViewportSize({width:440,height:840});
  await page.route('**/anomaly-jar-v1.webp*',r=>r.fulfill({contentType:'image/webp',body:fs.readFileSync(root+'jar.webp')}));
  await page.goto('http://127.0.0.1:8766/?v=anomaly-fluid-v2-preview');
  await page.waitForFunction(()=>document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
  await page.locator('.research-wallet img').first().evaluate(i=>i.decode());
  await page.screenshot({path:out+'/home-preview.png'});
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/checks.json',JSON.stringify({records,transparentJar:true,errors},null,2));console.log(JSON.stringify(records));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
