/* Isolated first-step art review. Does not change runtime, saves or main menu. */
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const source=fs.readFileSync('game.js','utf8');
const hook=fs.readFileSync('tools/test_world_previews_browser.cjs','utf8').match(/const hook=`([\s\S]*?)`;/)[1];
let browser;
(async()=>{
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 fs.mkdirSync('output/home-adaptation-step1',{recursive:true});
 for(const viewport of [{width:390,height:844},{width:440,height:820}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:2}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js*',r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
  await page.goto('http://127.0.0.1:8765/?v=627');await page.waitForFunction(()=>window.__previewQA&&window.SlimeGameDebug,null,{timeout:60000});
  await page.evaluate(()=>window.__previewQA.home(1));await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  await page.addStyleTag({content:'#tutorialLayer,#tutorialQuest,#tutorialAdminBtn,#tutorialPauseBtn{display:none!important}.tutorial-outline-source{outline:none!important;box-shadow:none!important}'});
  await page.evaluate(()=>document.querySelectorAll('.tutorial-outline-source').forEach(e=>e.classList.remove('tutorial-outline-source')));
  const baseline=await page.evaluate(()=>({slime:[getComputedStyle(document.getElementById('slime')).width,getComputedStyle(document.getElementById('slime')).height],world:document.getElementById('worldCarousel').getBoundingClientRect().toJSON(),play:document.getElementById('worldStartBtn').getBoundingClientRect().toJSON()}));
  await page.screenshot({path:`output/home-adaptation-step1/${viewport.width}-baseline.png`});
  await page.addStyleTag({content:`
   #conveyor{visibility:hidden!important}
   #componentReview{position:fixed;z-index:40;box-sizing:border-box;overflow:hidden;border:3px solid #9dd4df;border-radius:18px;background:linear-gradient(110deg,#75b9cc,#a4dce3 46%,#6ab0c5);box-shadow:inset 0 2px #dcf5f4,inset 0 -3px #46849a;color:#f4fdff;font-family:Nunito,sans-serif;pointer-events:none}
   #componentReview *{box-sizing:border-box}
   .review-chamber{position:absolute;background:url('/output/home-adaptation-step1/chamber-v2.webp') no-repeat}
   .review-food{position:absolute;object-fit:contain;filter:drop-shadow(0 2px 1px #0c40504d)}
   .review-info{position:absolute;border:2px solid #73adbe;border-radius:13px;background:#16465b;padding:9px 10px;box-shadow:inset 0 1px #35758a;display:flex;flex-direction:column;justify-content:space-between;gap:5px}
   .review-title{display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:23px;font-weight:1000;line-height:1.1}
   .review-title i{font-style:normal;font-size:19px;padding:2px 8px;border-radius:7px;background:#d4eef0;color:#245469;box-shadow:inset 0 1px white,inset 0 -2px #95bfc8}
   .review-kicker{color:#a9d1dd;font-size:10px;font-weight:800;letter-spacing:.04em}
   .review-task{font-size:14px;font-weight:800;line-height:1.1}
   .review-track{position:relative;min-height:23px;background:#0d2f42;border:1px solid #5897a9;border-radius:7px;padding:2px;display:flex;align-items:center;justify-content:flex-end;overflow:hidden}
   .review-track::before{content:'';position:absolute;left:2px;top:2px;bottom:2px;width:60%;border-radius:4px;background:#ff953d}
   .review-track b{position:relative;background:#0d2f42;padding:1px 4px;border-radius:3px;color:white;font-size:12px;font-weight:1000;font-variant-numeric:tabular-nums}
   .review-feed{position:absolute;text-align:center;color:#eafcff;font-size:10px;font-weight:900;text-shadow:0 1px 2px #164c64}
   .review-rail{position:absolute;display:flex;align-items:center;justify-content:space-around;border:2px solid #79b9ca;border-radius:18px;background:#17465c;box-shadow:inset 0 2px #123e53,0 1px #c0e6e8}
   .review-medal{position:relative;display:grid;place-items:center;width:29%;height:100%}
   .review-medal img{width:76%;height:76%;object-fit:contain}
   .review-medal.current::before{content:'';position:absolute;width:100%;height:106%;border:3px solid #b8e0e7;border-radius:13px;box-shadow:inset 0 0 0 1px #4a7f94,0 2px #3d758c}
   .review-medal.current img{width:98%;height:98%}
   .review-arrow{position:absolute;object-fit:contain}
   .review-arrow.previous{transform:scaleX(-1)}
  `});
  const geometry=await page.evaluate(()=>{
   const app=document.getElementById('app').getBoundingClientRect(),art=document.querySelector('.synth-terminal-art').getBoundingClientRect(),heading=document.querySelector('.world-terminal-heading').getBoundingClientRect();
   const y=art.y,h=heading.y-y-2,w=app.width,u=w/390;
   const panel=document.createElement('section');panel.id='componentReview';panel.setAttribute('aria-label','Первая примерка камеры синтеза');
   panel.style.cssText=`left:${app.x}px;top:${y}px;width:${w}px;height:${h}px`;
   panel.innerHTML=`<i class="review-chamber"></i><img class="review-food" src="/assets/food/02-pepper.webp" alt=""><span class="review-feed">СЪЕШЬ</span><div class="review-info"><div class="review-title">ОГОНЬ<i>II</i></div><small class="review-kicker">РАЗВИТИЕ · ДО III</small><span class="review-task">Подожги блоки</span><span class="review-track"><b>120 / 200</b></span></div><div class="review-rail">${['emblem-v7-phantom-lossless.webp','emblem-v2-fire.webp','emblem-v2-frost.webp'].map((n,i)=>`<span class="review-medal ${i===1?'current':''}"><img src="/assets/ui/recipe-categories/${n}" alt=""></span>`).join('')}</div><img class="review-arrow previous" src="/assets/ui/world-terminal/arrow-clean-right-v1.svg" alt=""><img class="review-arrow next" src="/assets/ui/world-terminal/arrow-clean-right-v1.svg" alt="">`;
   document.body.append(panel);
   const set=(s,x,y,w,h)=>{const e=panel.querySelector(s);Object.assign(e.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});return e};
   const railH=49*u,railY=h-railH-12*u,rowH=railY-13*u;
   // Source physical housing: x=185..1470,y=150..908. Scale uniformly.
   const housingW=w*.458,scale=housingW/1285,housingH=758*scale,cy=(rowH-housingH)/2+4*u;
   const chamber=set('.review-chamber',0,cy,housingW+4*u,housingH);
   chamber.style.backgroundSize=`${1479*scale}px ${1064*scale}px`;
   chamber.style.backgroundPosition=`${4*u-185*scale}px ${-150*scale}px`;
   const windowBox={x:4*u+(430-185)*scale,y:cy+105*scale,width:790*scale,height:560*scale};
   // Visible pepper alpha bounds [116,102,1154,1139] in its 1254 image.
   const foodScale=Math.min(windowBox.width*.94/1038,windowBox.height*.94/1037);
   const food=set('.review-food',windowBox.x+windowBox.width/2-(116+1038/2)*foodScale,windowBox.y+windowBox.height*.93-1139*foodScale,1254*foodScale,1254*foodScale);
   set('.review-feed',windowBox.x,cy+housingH-8*u,windowBox.width,12*u);
   set('.review-info',w*.472,7*u,w*.483,rowH-3*u);
   set('.review-rail',w*.17,railY,w*.66,railH);
   set('.review-arrow.previous',w*.025,railY-2*u,w*.13,railH+4*u);
   set('.review-arrow.next',w*.845,railY-2*u,w*.13,railH+4*u);
   return {panel:{x:app.x,y,width:w,height:h},housing:{x:app.x+4*u,y:y+cy,width:housingW,height:housingH},window:{...windowBox,y:y+windowBox.y},foodVisible:{width:1038*foodScale,height:1037*foodScale},world:document.getElementById('worldCarousel').getBoundingClientRect().toJSON(),play:document.getElementById('worldStartBtn').getBoundingClientRect().toJSON(),slime:[getComputedStyle(document.getElementById('slime')).width,getComputedStyle(document.getElementById('slime')).height]};
  });
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('#componentReview img')].map(i=>i.decode())));
  await page.waitForTimeout(100);
  assert.deepEqual(geometry.slime,baseline.slime);assert.deepEqual(geometry.world,baseline.world);assert.deepEqual(geometry.play,baseline.play);
  assert(geometry.foodVisible.width>=70&&geometry.foodVisible.height>=70,'Food remains large');assert.deepEqual(errors,[]);
  await page.screenshot({path:`output/home-adaptation-step1/${viewport.width}-fitted.png`});
  fs.writeFileSync(`output/home-adaptation-step1/${viewport.width}-fitted.json`,JSON.stringify({baseline,geometry},null,2));
  console.log(viewport,geometry);await page.close();
 }
 await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
