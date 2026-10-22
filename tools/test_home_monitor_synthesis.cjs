const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const source = fs.readFileSync('game.js', 'utf8');
const hook = fs.readFileSync('tools/test_home_console_browser.cjs', 'utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const colorsHook = 'window.__monitorColors=Object.fromEntries(FORM_INDEX.map(form=>[form.id,form.color]));';
const out = 'outputs/home-synthesis-restored-652';
const rgb = hex => `rgb(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
let browser;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [], missing = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400 && response.url().includes('/assets/')) missing.push(response.url()); });
  await page.route('**/game.js*', route => route.fulfill({ contentType: 'application/javascript', body: source.replace('  init().catch(error => {', () => hook + colorsHook + '  init().catch(error => {') }));
  await page.goto('http://127.0.0.1:8766/');
  await page.waitForFunction(() => window.SlimeGameDebug && window.__consoleQA, null, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const colors = await page.evaluate(() => window.__monitorColors);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 467, height: 833 }, { width: 467, height: 634 }]) {
    await page.setViewportSize(viewport);
    for (const [id, color] of Object.entries(colors)) for (const stage of [1, 3]) {
      await page.evaluate(([id, stage]) => window.__consoleQA.home(id, stage), [id, stage]);
      await page.evaluate(() => window.SlimeHomeConsole.layout());
      const monitor = await page.locator('#homeMutationInfo').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const pieces = [...element.children].filter(child => !child.hidden).map(child => {
          const box = child.getBoundingClientRect();
          return { text: child.textContent, top: box.top, bottom: box.bottom, overflow: child.scrollWidth - child.clientWidth };
        });
        return { bounds: bounds.toJSON(), pieces, color: getComputedStyle(element.querySelector('.console-task-track i')).backgroundColor, full: element.querySelector('.console-task-track i').style.width, overflow: element.scrollHeight - element.clientHeight };
      });
      assert.equal(monitor.color, rgb(color), `${id} stage ${stage}: mutation-colored progress`);
      assert(monitor.overflow <= 1 && monitor.pieces.every(p => p.overflow <= 1 && p.bottom <= monitor.bounds.bottom + 1), JSON.stringify({ viewport, id, stage, monitor }));
      assert(monitor.pieces.every((p, i) => !i || p.top >= monitor.pieces[i - 1].bottom - 1), `${id}: clear, non-overlapping information rows`);
      if (stage === 3) assert.equal(monitor.full, '100%');
      if (id === 'telekinesis' && stage === 3 && viewport.height > 700) {
        await page.waitForTimeout(120);
        await page.screenshot({ path: `${out}/${viewport.width}-max-psionics.png` });
        await page.locator('#homeMutationInfo').screenshot({ path: `${out}/${viewport.width}-monitor.png` });
      }
    }

  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.__consoleQA.home('fire', 2));
  await page.locator('#homeMutationSelector').click();
  await page.locator('[data-home-mutation="frost"]').click();
  await page.waitForFunction(() => document.getElementById('homeSynthesisFx').classList.contains('is-active'));
  assert.equal(await page.locator('#homeSynthesisFx svg path').count(), 2, 'Original pair of scanner fields restored');
  assert.equal(await page.locator('.console-scan-plane,.console-charge-beam,.console-scan-particle,.console-synthesis-ring').count(), 0, 'Later effect additions removed');
  await page.waitForTimeout(300);
  await page.screenshot({path:`${out}/390-restored-synthesis.png`});
  await page.waitForFunction(() => !window.__consoleQA.state().transition);
  assert(!await page.locator('#homeSynthesisFx').evaluate(e => e.classList.contains('is-active')), 'Original synthesis finishes and cleans up');
  assert((await page.locator('#adminMenuBtn img').getAttribute('src')).includes('gear-grey-v1'), 'Generated grey header gear installed');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.__consoleQA.home('fire', 2));
  await page.locator('#homeMutationSelector').click(); await page.locator('[data-home-mutation="frost"]').click();
  await page.waitForFunction(() => !window.__consoleQA.state().transition);
  assert(!await page.locator('#homeSynthesisFx').evaluate(e => e.classList.contains('is-active')), 'Reduced motion skips scanning');
  assert.deepEqual(errors, []); assert.deepEqual(missing, []);
  await browser.close();
  console.log('Home polish passed: 9 mutations, 4 layouts, complete-state colors, aligned information, restored original synthesis and reduced motion.');
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1; });
