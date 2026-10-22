/* Review the generated shell with the actual game's foreground, without
   changing gameplay, save data, or the live home-screen implementation. */
const fs = require('node:fs');
const { chromium } = require('playwright');
const source = fs.readFileSync('game.js', 'utf8');
const hook = fs.readFileSync('tools/test_world_previews_browser.cjs', 'utf8').match(/const hook=`([\s\S]*?)`;/)[1];
let browser;

(async () => {
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const viewport = { width: Number(process.argv[2]) || 440, height: Number(process.argv[3]) || 820 };
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/game.js*', route => route.fulfill({ contentType: 'application/javascript', body: source.replace('  init().catch(error => {', () => hook + '  init().catch(error => {') }));
  await page.goto('http://127.0.0.1:8765/?v=627');
  await page.waitForFunction(() => window.__previewQA && window.SlimeGameDebug, null, { timeout: 60000 });
  await page.evaluate(() => window.__previewQA.home(1));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await page.addStyleTag({ content: '#tutorialLayer,#tutorialQuest,.tutorial-dialog,#tutorialPauseBtn,#tutorialAdminBtn{display:none!important}' });
  const baseline = await page.evaluate(() => Object.fromEntries(['slime', 'slimeStage', 'worldCarousel', 'worldStartBtn'].map(id => { const r = document.getElementById(id).getBoundingClientRect(); return [id, { x:r.x,y:r.y,width:r.width,height:r.height }]; })));
  const baselineBody = await page.locator('#slime').evaluate(e => [parseFloat(getComputedStyle(e).width),parseFloat(getComputedStyle(e).height)]);
  await page.addStyleTag({ content: `
    html body[data-screen="home"] #app{background:#6baec0 url("/assets/ui/home-mutation-station-v4.webp") center/100% 100% no-repeat!important}
    html body #homeScreen::before,html body #homeScreen::after,html body #homeScreen .synth-terminal-art{opacity:0!important}
    html body #conveyor{visibility:hidden!important}
    html body #playSetupCard{border:0!important;box-shadow:none!important;visibility:hidden!important}
    html body #playSetupCard :is(#worldCarousel,.world-terminal-heading,.world-terminal-arrow,#worldStartBtn){visibility:visible!important}
    #stationPreview{position:absolute;inset:0;z-index:65;pointer-events:none;font-family:Nunito,sans-serif}
    #stationPreview *{box-sizing:border-box}
    #stationPreview .food{position:absolute;left:11.8%;top:42%;width:29.5%;height:10.2%;object-fit:contain;filter:drop-shadow(0 3px 2px #071f2c66)}
    #stationPreview .info{position:absolute;left:49%;top:41.4%;width:40%;height:10.8%;display:flex;flex-direction:column;gap:8px;color:#f4fdff}
    #stationPreview .name{display:flex;align-items:center;justify-content:space-between;gap:5px;font-size:21px;font-weight:1000;line-height:1.05;text-shadow:0 2px #123d51}
    #stationPreview .stage{display:grid;place-items:center;min-width:37px;height:25px;padding:0 9px;border:1.5px solid #608c9f;border-radius:8px;background:#caebf0;color:#164a61;font-size:20px;box-shadow:inset 0 2px #efffff,inset 0 -2px #9bc8d8;text-shadow:none}
    #stationPreview .task{display:grid;gap:4px;margin-top:3px;font-size:13px;font-weight:800;line-height:1.1}
    #stationPreview .task small{color:#a5d2df;font-size:10px;letter-spacing:.05em;font-weight:800}
    #stationPreview .progress{display:flex;align-items:center;position:relative;min-height:21px;border:1.5px solid #427d97;border-radius:7px;background:#102e45;overflow:hidden}
    #stationPreview .fill{position:absolute;inset:2px auto 2px 2px;width:58%;border-radius:4px;background:#f49720}
    #stationPreview .counter{position:relative;margin-left:auto;padding:3px 5px;background:#102e45;border-radius:4px;color:white;font-size:12px;font-weight:1000;font-variant-numeric:tabular-nums}
    #stationPreview .selector{position:absolute;left:7.5%;top:55.3%;width:85%;height:5.7%;display:flex;align-items:center;justify-content:space-between;gap:5px}
    #stationPreview .mutation{position:relative;flex:0 0 12.8%;aspect-ratio:1;border:1.5px solid #567f93;border-radius:11px;background:#c9e4e6;box-shadow:inset 0 2px #f1ffff,inset 0 -3px #8fbaca;display:grid;place-items:center}
    #stationPreview .mutation img{width:97%;height:97%;object-fit:contain}
    #stationPreview .mutation.active{transform:scale(1.12);border:2px solid #40daff;background:#e1fbff;box-shadow:inset 0 2px white,0 0 0 2px #16475b}
    #stationPreview .arrow{width:8.5%;height:90%;object-fit:contain;flex:0 0 8.5%}
    #stationPreview .arrow.previous{transform:scaleX(-1)}
    /* The generated central cradle is the active item's frame. The other
       four medallions share one channel; arrows sit outside on solid casing. */
    #stationPreview .selector{left:16.8%;top:54.65%;width:66.4%;height:6.85%;gap:0}
    #stationPreview .mutation{flex:0 0 20%;height:100%;aspect-ratio:auto;border:0;border-radius:0;background:none;box-shadow:none}
    #stationPreview .mutation img{width:89%;height:89%}
    #stationPreview .mutation.active{transform:scale(1.03);border:0;background:none;box-shadow:none}
    #stationPreview .mutation.active img{width:96%;height:96%}
    #stationPreview>.arrow{position:absolute;top:55.2%;width:7%;height:5.8%}
    #stationPreview>.arrow.previous{left:2.5%}
    #stationPreview>.arrow.next{right:2.5%}
    html body #playSetupCard .world-terminal-heading{display:none!important}
    @media(max-width:400px){#stationPreview .info{gap:4px}#stationPreview .name{font-size:19px}#stationPreview .stage{height:23px;font-size:18px}#stationPreview .task{font-size:12px;margin-top:0}#stationPreview .task small{font-size:9px}#stationPreview .counter{font-size:11px}}
    @media(max-width:350px){#stationPreview .info{gap:3px;top:41%}#stationPreview .name{font-size:16px}#stationPreview .stage{min-width:30px;height:21px;font-size:17px}#stationPreview .task{font-size:11px;gap:2px}#stationPreview .task small{font-size:8px}#stationPreview .progress{min-height:17px}#stationPreview .counter{font-size:10px;padding:1px 4px}}
  ` });
  await page.evaluate(() => {
    const root = document.createElement('div'); root.id = 'stationPreview'; root.setAttribute('aria-hidden', 'true');
    const icons = ['emblem-v2-frost.webp','emblem-v2-electric.webp','emblem-v2-fire.webp','emblem-v4-cosmos.webp','emblem-v7-phantom-lossless.webp'];
    root.innerHTML = `<img class="food" src="/assets/food/02-pepper.webp" alt=""><section class="info"><div class="name"><b>ОГОНЬ</b><span class="stage">II</span></div><div class="task"><small>РАЗВИТИЕ · ДО III</small><span>Подожги блоки</span></div><div class="progress"><i class="fill"></i><b class="counter">120 / 200</b></div></section><div class="selector"><img class="arrow previous" src="/assets/ui/world-terminal/arrow-soft-v10.svg" alt="">${icons.map((icon,i)=>`<span class="mutation ${i===2?'active':''}"><img src="/assets/ui/recipe-categories/${icon}" alt=""></span>`).join('')}<img class="arrow" src="/assets/ui/world-terminal/arrow-soft-v10.svg" alt=""></div>`;
    const arrows=[...root.querySelectorAll('.selector>.arrow')];
    arrows[1].classList.add('next');arrows.forEach(arrow=>root.append(arrow));
    document.querySelector('#app').append(root);
    const app = document.querySelector('#app').getBoundingClientRect();
    // Keep the actual slime and separate portal at their original scale, while
    // aligning their floor contact to this shorter scene at each phone size.
    const ground=document.querySelector('.slime-ground-shadow').getBoundingClientRect();
    const offset=app.y+app.height*550/1711-(ground.y+ground.height/2);
    document.querySelector('.slime-playground').style.setProperty('top',`${offset}px`,'important');
    document.querySelector('.slime-playground').style.setProperty('left',`${app.x+app.width/2-(ground.x+ground.width/2)}px`,'important');
    const place = (selector, [x,y,w,h]) => {
      const e = document.querySelector(selector);
      for(const [key,value] of Object.entries({position:'fixed',left:`${app.x+x/919*app.width}px`,top:`${app.y+y/1711*app.height}px`,width:`${w/919*app.width}px`,height:`${h/1711*app.height}px`,margin:'0'})) e.style.setProperty(key,value,'important');
    };
    place('#worldCarousel',[140,1105,640,278]);
    place('.world-terminal-heading',[308,1054,302,62]);
    place('.world-terminal-arrow.previous',[75,1185,101,115]);
    place('.world-terminal-arrow.next',[740,1185,101,115]);
    place('#worldStartBtn',[170,1462,579,163]);
  });
  await page.evaluate(() => Promise.all([...document.querySelectorAll('#stationPreview img')].map(img => img.decode())));
  await page.waitForTimeout(200);
  const measured = await page.evaluate(() => ({slime:document.querySelector('#slime').getBoundingClientRect().toJSON(),world:document.querySelector('#worldCarousel').getBoundingClientRect().toJSON(),food:document.querySelector('#stationPreview .food').getBoundingClientRect().toJSON(),portalCount:document.querySelectorAll('.lab-portal-frame').length}));
  // The live slime breathes/squashes; compare its CSS body box separately.
  const bodySize = await page.locator('#slime').evaluate(e => [parseFloat(getComputedStyle(e).width),parseFloat(getComputedStyle(e).height)]);
  if (bodySize.some((size,index)=>size!==baselineBody[index])) throw new Error('Slime dimensions changed');
  if (measured.world.height > baseline.worldCarousel.height*.9 && viewport.height>=730) throw new Error('World preview is still too tall');
  if (errors.length) throw new Error(errors.join('\n'));
  fs.mkdirSync('output/mockups',{recursive:true});
  await page.screenshot({path:`output/mockups/home-station-fitted-v10-${viewport.width}.png`});
  fs.writeFileSync(`output/mockups/home-station-fitted-v10-${viewport.width}.measurements.json`,JSON.stringify({baseline,measured},null,2));
  console.log(JSON.stringify({baseline,measured},null,2));
  await browser.close();
})().catch(async error => {console.error(error);await browser?.close();process.exitCode=1;});
