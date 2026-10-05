const { spawn } = require('child_process');
const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'slime-glitch-qa-'));
const port = 9225;
const errors = [];
let browser;
let server;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
    response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    if (path.basename(file) === 'game.js') {
      const source = fs.readFileSync(file, 'utf8');
      response.end(source.replace('window.SlimeGameDebug = {', `window.SlimeGameDebug = {
        __qaGlitch: () => {
          session.foods = FOODS.slice(0, 3);
          recalcStats();
          startDrop();
          cancelAnimationFrame(run.animationId);
          run.categoryVisuals.glitch = 3;
          const now = performance.now();
          run.glitchNextInfectionAt = now - 1;
          updateGlitchEffects(now);
          const infectionSize = run.glitchInfectedBlocks.size;
          const [source, linked] = [...run.glitchInfectedBlocks];
          const extraWave = glitchFutureBlocks(block => glitchEligibleBlock(block) && !block.glitchInfected, 10).slice(0, 2);
          infectGlitchGroup(extraWave, now);
          run.cameraY = source.y - VIEW_H / 2;
          renderCanvas(now);
          run.cameraY = 0;
          const linkedHp = linked.hp;
          const extraHp = extraWave[1]?.hp;
          damageBlockByElement(source, 1, 'qa', now + 1);
          const linkedDamaged = linked.dead || linked.hp < linkedHp;
          const globalShared = extraWave[1].dead || extraWave[1].hp < extraHp;
          const cleared = run.glitchInfectedBlocks.size === 0;
          const directGroup = glitchFutureBlocks(block => glitchEligibleBlock(block) && !block.glitchInfected, 10).slice(0, 2);
          infectGlitchGroup(directGroup, now + 2);
          const directHp = directGroup[1].hp;
          destroyBlock(directGroup[0], 'telekinesisLift', now + 3);
          const directShared = directGroup[1].dead || directGroup[1].hp < directHp;

          const future = glitchFutureBlocks(block => glitchEligibleBlock(block), 10)[0];
          future.hazard = true;
          future.unbreakable = true;
          run.glitchNextNeutralizeAt = now - 1;
          updateGlitchEffects(now + 2);
          const neutralized = run.blocks.find(block => block.glitchNeutralized);
          const health = run.health;
          const bounced = transformGlitchHazard(neutralized, { nx: 0, ny: -1, penetration: 1 }, now + 3);
          const safeReward = bounced && !neutralized.hazard && run.health === health
            && (Boolean(neutralized.special) || run.flasks.some(flask => flask.glitch && flask.value === 15));

          run.elementalAbilityType = 'glitch';
          commitElementalAbility('glitch', now + 4, run.slime.x, run.slime.y);
          const choiceVisible = run.glitchChoice?.phase === 'choosing'
            && !els.glitchUltimateOverlay.classList.contains('hidden');
          selectGlitchBug('delete');
          const titleVisible = run.glitchChoice?.phase === 'announcing'
            && els.glitchUltimateOverlay.classList.contains('is-announcing')
            && els.glitchChoiceAnnouncement.children.length === GLITCH_BUGS[1].name.length;
          run.glitchChoice = null;
          hideGlitchChoice();

          executeGlitchBug('copy', now + 1000);
          const copyWorks = run.glitchClone?.until === now + 1000 + GLITCH_CLONE_MS
            && run.glitchClone.radius === run.slime.radius;
          const cloneY = run.glitchClone?.y;
          updateGlitchClone(now + 1033);
          const cloneMoves = run.glitchClone?.y !== cloneY;
          renderCanvas(now + 1000);
          executeGlitchBug('delete', now + 1100);
          const deleteTargets = run.glitchDeleteQueue.length;
          updateGlitchEffects(now + 4000);
          const deleted = deleteTargets > 0 && !run.glitchDeleteQueue.length;
          executeGlitchBug('infect', now + 4100);
          const infectionQueued = run.glitchSpreadQueue.length > 0;
          updateGlitchEffects(now + 5000);
          const spread = infectionQueued && !run.glitchSpreadQueue.length;
          executeGlitchBug('change', now + 5100);
          const changed = Boolean(run.glitchChange);
          const flasksBefore = run.flasks.length;
          updateGlitchEffects(now + 5600);
          const rewritten = changed && !run.glitchChange && run.flasks.length > flasksBefore;
          renderCanvas(now);
          return { infectionSize, linkedDamaged, globalShared, cleared, directShared, safeReward, choiceVisible, titleVisible,
            copyWorks, cloneMoves, deleted, spread, rewritten, cssLoaded: Boolean(document.querySelector('link[href*="glitch.css"]')) };
        },
        __qaGlitchPreview: () => {
          const block = run.blocks.find(item => item.glitchInfected && !item.dead);
          if (block) {
            run.cameraY = block.y - VIEW_H * .47;
            run.slime.x = Math.min(VIEW_W - 80, block.x + 100);
            run.slime.y = block.y - 70;
          }
          executeGlitchBug('copy', performance.now());
          startGlitchChoice(performance.now());
          selectGlitchBug('infect');
          renderCanvas(performance.now());
          const title = els.glitchChoiceAnnouncement;
          const rect = title?.getBoundingClientRect();
          return { text: title?.getAttribute('aria-label'), visible: els.glitchUltimateOverlay.classList.contains('is-announcing'),
            display: getComputedStyle(title).display, rect: rect && { x: rect.x, y: rect.y, width: rect.width, height: rect.height } };
        },`));
    } else fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-allow-origins=*', `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  let target;
  for (let i = 0; i < 80; i += 1) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = pages.find(page => page.type === 'page');
      if (target) break;
    } catch (_) { /* Browser starting. */ }
    await sleep(100);
  }
  if (!target) throw new Error('Chrome DevTools did not start');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id;
    pending.set(next, { resolve, reject });
    socket.send(JSON.stringify({ id: next, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await send('Runtime.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  for (let i = 0; i < 100; i += 1) {
    if (await evaluate('Boolean(window.SlimeGameDebug?.__qaGlitch)')) break;
    await sleep(100);
  }
  const result = await evaluate('window.SlimeGameDebug.__qaGlitch()');
  assert.ok(result.infectionSize >= 3 && result.infectionSize <= 5);
  for (const key of ['linkedDamaged', 'globalShared', 'cleared', 'directShared', 'safeReward', 'choiceVisible', 'titleVisible', 'copyWorks', 'cloneMoves', 'deleted', 'spread', 'rewritten', 'cssLoaded']) assert.equal(result[key], true, key);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(result));
  console.log(JSON.stringify(await evaluate('window.SlimeGameDebug.__qaGlitchPreview()')));
  await sleep(180);
  console.log(JSON.stringify(await evaluate("({display:getComputedStyle(document.getElementById('glitchChoiceAnnouncement')).display,visible:document.getElementById('glitchUltimateOverlay').classList.contains('is-announcing'),animation:getComputedStyle(document.querySelector('#glitchChoiceAnnouncement span')).animationName,rules:document.querySelector('link[href*=' + String.fromCharCode(34) + 'glitch.css' + String.fromCharCode(34) + ']').sheet?.cssRules.length})")));
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  const previewPath = path.join(os.tmpdir(), 'slime-glitch-preview.png');
  fs.writeFileSync(previewPath, Buffer.from(screenshot.data, 'base64'));
  console.log(previewPath);
  socket.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  browser?.kill();
  server?.close();
});
