const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const source = fs.readFileSync('game.js', 'utf8');
const hook = fs.readFileSync('tools/test_home_console_browser.cjs', 'utf8').match(/const hook=`([\s\S]*?)`;/)[1];

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    fs.mkdirSync('output/home-planets-shell/live', { recursive: true });
    for (const viewport of [{width:440,height:840},{width:320,height:568},{width:1280,height:900}]) {
      const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/game.js*', route => route.fulfill({ contentType:'application/javascript', body:source.replace('  init().catch(error => {', () => hook + '  init().catch(error => {') }));
      await page.goto('http://127.0.0.1:8766/?v=home-live-1');
      await page.waitForFunction(() => window.__consoleQA && document.documentElement.classList.contains('app-ready'), null, {timeout:90000});
      await page.evaluate(() => window.__consoleQA.home('fire', 1));
      await page.waitForTimeout(180);
      await page.locator('#foodChoices img.food-model').evaluate(i => i.decode());
      const metrics = await page.evaluate(() => {
        const box = id => document.getElementById(id).getBoundingClientRect().toJSON();
        const food = document.querySelector('#foodChoices .conveyor-food-pick');
        const image = food.querySelector('.food-model').getBoundingClientRect();
        const [iw,ih,left,top,right,bottom] = window.SlimeFoodGroundBounds[food.dataset.foodId];
        const opaque = {centerX:image.left+(left+right)/iw*image.width/2,bottom:image.top+bottom/ih*image.height};
        return { app:box('app'),food:box('foodChoices'),selector:box('conveyorDispensers'),play:box('worldStartBtn'),opaque,
          text:[...document.querySelectorAll('#homeMutationInfo>span,#homeMutationInfo>b')].filter(e => e.getClientRects().length).map(e => ({text:e.textContent,overflow:e.scrollWidth>e.clientWidth+1})) };
      });
      assert(metrics.text.every(item => !item.overflow), JSON.stringify(metrics.text));
      assert(metrics.play.bottom <= metrics.app.bottom+1, 'Play must fit above bottom edge');
      const registration=await page.evaluate(()=>{
        const art=document.getElementById('homeConsoleTop').getBoundingClientRect();
        const face=document.querySelector('.console-selector-face').getBoundingClientRect();
        return {dx:face.x+face.width/2-art.x-640/1176*art.width,dy:face.y+face.height/2-art.y-195/1176*art.width,width:face.width,expected:192/1176*art.width};
      });
      assert(Math.abs(registration.dx)<.1&&Math.abs(registration.dy)<.1,'Emblem is registered to the master socket center');
      assert(Math.abs(registration.width-registration.expected)<.1,'Emblem fills the socket');
      assert(Math.abs(metrics.opaque.centerX-metrics.food.x-metrics.food.width/2)<.5, 'Food opaque bounds centered');
      assert(Math.abs(metrics.opaque.bottom-metrics.food.bottom)<.5, 'Food feet rest on shelf anchor');
      assert(await page.locator('#worldStartBtn').isDisabled(), 'Feed before launching');
      await page.screenshot({path:`output/home-planets-shell/live/home-${viewport.width}.png`});
      const selector = await page.locator('#homeMutationSelector').boundingBox();
      const faceBefore = await page.locator('.console-selector-face').boundingBox();
      await page.mouse.move(selector.x+selector.width/2, selector.y+selector.height/2);
      await page.mouse.down();
      await page.waitForTimeout(160);
      assert.notEqual(await page.locator('.console-selector-face').evaluate(e => getComputedStyle(e).transform), 'none', 'Emblem depresses');
      const faceDown = await page.locator('.console-selector-face').boundingBox();
      assert(Math.abs(faceBefore.x-faceDown.x)<.1, 'Press never shifts the emblem sideways');
      assert(Math.abs(faceBefore.width-faceDown.width)<.1, 'Press never scales the emblem');
      assert(Math.abs(faceDown.y-faceBefore.y-2)<.1, 'Press only moves down by 2px');
      await page.mouse.up();
      await page.waitForTimeout(180);
      assert(await page.locator('#homeMonitorPicker').isVisible());
      assert.equal(await page.locator('[data-home-mutation]').count(), 9);
      const picker = await page.locator('#homeMonitorPicker').boundingBox();
      assert(picker.width > metrics.app.width*.9, 'Picker spans synthesis and monitor');
      await page.screenshot({path:`output/home-planets-shell/live/picker-${viewport.width}.png`});
      await page.locator('[data-home-mutation="frost"]').click();
      await page.waitForFunction(() => window.__consoleQA.state().selected==='frost' && !window.__consoleQA.state().transition);
      assert(!await page.locator('#homeMonitorPicker').isVisible());
      await page.locator('#homeMutationSelector').click();
      await page.keyboard.press('Escape');
      assert(!await page.locator('#homeMonitorPicker').isVisible());
      assert.equal(await page.locator('#homeMutationReroll').count(),0,'Reroll is removed from the home');
      for(const stage of [1,2,3]) {
        await page.evaluate(stage=>window.__consoleQA.home('cosmos',stage),stage);
        const icon=page.locator('#homeMutationStage img');await icon.evaluate(i=>i.decode());
        assert.equal(await icon.getAttribute('alt'),`${['I','II','III'][stage-1]} стадия мутации`);
        await page.screenshot({path:`output/home-planets-shell/live/stage-${stage}-${viewport.width}.png`});
      }
      await page.evaluate(()=>window.__consoleQA.home('frost',1));
      if(viewport.width===440) {
        for(const id of ['fire','frost','electric','cosmos','nano','telekinesis','cloning','phantom','glitch']) {
          await page.evaluate(id=>window.__consoleQA.home(id,2),id);
          const emblem=page.locator('.console-selector-face>img:not(.console-emblem-previous)');await emblem.evaluate(i=>i.decode());
          await page.waitForTimeout(320);
          const fit=await emblem.evaluate(image=>{
            const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;
            const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
            let left=c.width,top=c.height,right=0,bottom=0;
            for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>16){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
            const r=image.getBoundingClientRect(),face=image.parentElement.getBoundingClientRect();
            return {dx:r.x+(left+right)/2/c.width*r.width-face.x-face.width/2,dy:r.y+(top+bottom)/2/c.height*r.height-face.y-face.height/2,dw:(right-left)/c.width*r.width-face.width,dh:(bottom-top)/c.height*r.height-face.height};
          });
          assert(Object.values(fit).every(value=>Math.abs(value)<.12),`${id} opaque bounds must fill and center in the socket: ${JSON.stringify(fit)}`);
        }
        await page.evaluate(()=>window.__consoleQA.home('frost',1));
      }
      if (viewport.width === 440) {
        const food = await page.locator('#foodChoices .conveyor-food-pick').boundingBox();
        const mouth = await page.locator('#menuSlimeMouth').boundingBox();
        await page.mouse.move(food.x+food.width/2, food.y+food.height/2);
        await page.mouse.down();
        await page.mouse.move(mouth.x+mouth.width/2, mouth.y+mouth.height/2, {steps:12});
        await page.mouse.up();
        await page.waitForFunction(() => !document.getElementById('worldStartBtn').disabled, null, {timeout:10000});
        await page.locator('#worldStartBtn').evaluate(async element => {
          const url = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
          if (!url.includes('play-active')) throw Error('Active play artwork missing');
          const image = new Image(); image.src = url; await image.decode();
        });
        await page.screenshot({path:'output/home-planets-shell/live/fed-440.png'});
        await page.locator('#worldStartBtn').click();
        await page.waitForFunction(() => document.body.dataset.screen==='drop', null, {timeout:15000});
      }
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({viewport,aligned:true,pickerWidth:picker.width,errors}));
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
