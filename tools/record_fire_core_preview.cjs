// Ephemeral browser profile only: record the sequence without touching the player's save.
const fs=require('node:fs'),{chromium}=require('playwright');
const kind=['electric','frost','cosmos','techno','phantom','psionic','glitch','spores'].includes(process.argv[2])?process.argv[2]:'fire',qa=`__${kind}QA`,output=kind==='fire'?'output/fire-style-v3':`output/${kind}-core-v1`;
const source=fs.readFileSync('game.js','utf8'),base=fs.readFileSync('tools/test_home_console_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const core=fs.readFileSync('tools/test_core_encounter.cjs','utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const fire=fs.readFileSync(`tools/test_${kind}_core_strike.cjs`,'utf8').match(/const hook=base\+coreHook\+`([\s\S]*?)`;/)[1];
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:360,height:688}});
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>base+core+fire+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8766/?v=electric-core-1');await page.waitForFunction(qa=>window[qa]&&document.documentElement.classList.contains('app-ready'),qa,{timeout:90000});
  const client=await page.context().newCDPSession(page);let recording=false,frames=[],folder='';
  client.on('Page.screencastFrame',event=>{
   if(recording){const file=`frame-${String(frames.length).padStart(4,'0')}.jpg`;fs.writeFileSync(folder+'/'+file,Buffer.from(event.data,'base64'));frames.push({file,time:event.metadata.timestamp});}
   client.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  });
  for(const reserve of [100,5]){
   folder=`${output}/preview-${reserve}`;fs.mkdirSync(folder,{recursive:true});frames=[];
   await page.evaluate(({qa,reserve})=>window[qa].start(reserve),{qa,reserve});await page.waitForFunction(({qa,kind})=>window[qa].state()[kind],{qa,kind});recording=true;
   await client.send('Page.startScreencast',{format:'jpeg',quality:86,maxWidth:360,maxHeight:688,everyNthFrame:3});
   await page.waitForFunction(qa=>window[qa].state().phase==='armed',qa);await page.waitForTimeout(320);
   await page.mouse.click(180,365);await page.waitForFunction(qa=>window[qa].state().evacPhase==='pull',qa,{timeout:7000});await page.waitForTimeout(600);
   recording=false;await client.send('Page.stopScreencast');fs.writeFileSync(folder+'/frames.json',JSON.stringify(frames));console.log(JSON.stringify({reserve,frames:frames.length}));
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
