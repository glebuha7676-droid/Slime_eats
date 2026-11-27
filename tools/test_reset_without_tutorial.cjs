const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const source = fs.readFileSync('game.js', 'utf8');
const hook = `window.__resetQA={
  state:()=>({save:structuredClone(save),blocked:tutorialActive(),memo:!!tutorialMemoState,phase:run?.tutorialPhase||0,depth:run?.depth||0,target:run?.world.targetDepth}),
  seed:()=>{save.researchUnits=4321;save.totalRuns=8;save.worldBest[1]=321;save.unlockedMutations=['fire','frost'];save.mutationLevels={fire:2,frost:1};persist();}
};`;
const out = 'output/reset-without-tutorial';
fs.mkdirSync(out, {recursive:true});
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:440,height:840}}), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('dialog', d=>d.accept());
    await page.route('**/game.js*', r=>r.fulfill({contentType:'application/javascript',body:source.replace('  init().catch(error => {',()=>hook+'  init().catch(error => {')}));
    const ready=()=>page.waitForFunction(()=>window.__resetQA&&window.SlimeGameDebug&&document.documentElement.classList.contains('app-ready'),null,{timeout:90000});
    await page.goto('http://127.0.0.1:8766/?v=reset-no-tutorial'); await ready();
    const checkStart=async()=>{
      const s=await page.evaluate(()=>__resetQA.state());
      assert.equal(s.blocked,false); assert.equal(s.memo,false);
      assert.equal(s.save.tutorialStep,'done'); assert.equal(s.save.onboarding.enabled,false);
      assert.equal(s.save.researchUnits,0); assert.equal(s.save.totalRuns,0);
      assert.equal(s.save.worldBest[1],0); assert.deepEqual(s.save.unlockedMutations,['fire']);
      assert.equal(s.save.mutationLevels.fire,1);
      assert.equal(await page.locator('#wardrobeBtn').isDisabled(),false);
      await page.locator('#homeMutationSelector').click();
      assert(await page.locator('#homeMonitorPicker').isVisible());
      await page.keyboard.press('Escape');
      await page.locator('#wardrobeBtn').click();
      assert(await page.locator('#panelOverlay').isVisible());
      await page.locator('#closePanelBtn').click();
      return s;
    };
    await checkStart();
    await page.evaluate(()=>__resetQA.seed());
    await page.locator('#adminMenuBtn').click();
    await page.locator('#adminResetProgressBtn').click();
    assert(!await page.locator('#adminToolsOverlay').isVisible());
    await checkStart();
    await page.reload(); await ready(); await checkStart();
    // An interrupted old lesson must also stop blocking an existing player's save.
    await page.addInitScript(()=>{
      if(sessionStorage.getItem('__oldLessonSeeded'))return;
      sessionStorage.setItem('__oldLessonSeeded','1');
      const key='slime_feed_and_fall_save', envelope=JSON.parse(localStorage.getItem(key));
      const s=envelope.data||envelope;
      s.tutorialStep='frost-synthesize';s.onboarding.enabled=true;s.onboarding.pendingMemo='development';s.researchUnits=17;
      // Seed after the old page's pagehide save, before game initialization.
      localStorage.setItem(key,JSON.stringify(s));
      localStorage.removeItem(key+'_backup');
    });
    await page.reload(); await ready();
    const migrated=await page.evaluate(()=>__resetQA.state());
    assert.equal(migrated.blocked,false);assert.equal(migrated.save.onboarding.enabled,false);
    assert.equal(migrated.save.researchUnits,17);
    assert.equal(migrated.save.onboarding.pendingMemo,'');
    // Reset once more and verify the real drag/feed/launch path, without a skip hook.
    await page.locator('#adminMenuBtn').click();await page.locator('#adminResetProgressBtn').click();await checkStart();
    const food=page.locator('#foodChoices .conveyor-food-pick');await food.locator('img.food-model').evaluate(i=>i.decode());
    const f=await food.boundingBox(),m=await page.locator('#menuSlimeMouth').boundingBox();
    await page.mouse.move(f.x+f.width/2,f.y+f.height/2);await page.mouse.down();
    await page.mouse.move(m.x+m.width/2,m.y+m.height/2,{steps:12});await page.mouse.up();
    await page.waitForFunction(()=>!document.getElementById('worldStartBtn').disabled,null,{timeout:10000});
    await page.screenshot({path:out+'/after-reset.png'});
    await page.locator('#worldStartBtn').click();
    await page.waitForFunction(()=>document.body.dataset.screen==='drop',null,{timeout:15000});
    const launched=await page.evaluate(()=>__resetQA.state());assert.equal(launched.phase,0);assert.equal(launched.target,500);
    assert.deepEqual(errors,[]);
    fs.writeFileSync(out+'/checks.json',JSON.stringify({fresh:true,reset:true,reload:true,oldLessonMigration:true,launchedWithoutLesson:true,errors},null,2));
    console.log('Fresh start, admin reset, reload, interrupted lesson migration, menu input and real feed/launch passed.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
