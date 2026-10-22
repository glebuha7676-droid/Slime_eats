const fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{fs.mkdirSync('outputs/accessories-689',{recursive:true});const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage();await p.goto('http://127.0.0.1:8766/?v=688');await p.waitForFunction(()=>window.SlimeGameDebug,null,{timeout:60000});
 const url=await p.evaluate(async()=>{await SlimeAvatarRenderer.whenReady();const c=document.createElement('canvas');c.width=c.height=640;SlimeAvatarRenderer.drawSlimeAvatar(c.getContext('2d'),{x:320,y:335,radius:235,emotion:'focused',timestamp:0});return c.toDataURL('image/png')});fs.writeFileSync('outputs/accessories-689/slime-fit-reference.png',Buffer.from(url.split(',')[1],'base64'));
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
