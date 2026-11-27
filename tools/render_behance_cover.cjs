const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1600,height:1100},deviceScaleFactor:1}),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 await page.goto('http://127.0.0.1:8766/output/behance/cover-v1/index.html');await page.evaluate(()=>coverReady);
 if(errors.length||missing.length)throw Error(JSON.stringify({errors,missing}));
 await page.screenshot({path:'output/behance/cover-v1/cover-1600.png'});console.log(path.resolve('output/behance/cover-v1/cover-1600.png'));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
