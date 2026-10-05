const { spawn } = require('child_process');
const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'slime-phantom-qa-'));
const port = 9224;
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
        __qaPhantom: () => {
          session.foods = FOODS.slice(0, 3);
          recalcStats();
          startDrop();
          cancelAnimationFrame(run.animationId);
          run.categoryVisuals.phantom = 2;
          const center = run.blocks.find(candidate => phantomCanMark(candidate)
            && candidate.col > 0 && candidate.col < run.columns - 1
            && run.blocksByRow.get(candidate.row)?.some(other => phantomCanMark(other) && other.col === candidate.col + 1));
          if (!center) throw new Error('No ordinary adjacent blocks to test');
          const neighbor = run.blocksByRow.get(center.row).find(block => block.col === center.col + 1);
          const remote = run.blocks.find(block => phantomCanMark(block)
            && Math.abs(block.row - center.row) > 3);
          if (!remote) throw new Error('No remote ordinary block to mark');
          center.hp = 3;
          neighbor.hp = 3;
          remote.hp = 3;
          run.slime.x = center.x + center.w / 2;
          run.slime.y = center.y + center.h / 2;
          run.slime.vx = 0;
          run.slime.vy = 0;
          const now = performance.now();
          run.phantomNextAt = now - 1;
          const entering = !updatePhantomCycle(now) && !phantomActive(now);
          renderCanvas(now);
          const phased = !phantomActive(now + PHANTOM_ENTER_MS - 1)
            && phantomActive(now + PHANTOM_ENTER_MS);
          markPhantomBlocks(now + PHANTOM_ENTER_MS);
          const marked = center.phantomMarked;
          run.slime.x = remote.x + remote.w / 2;
          run.slime.y = remote.y + remote.h / 2;
          markPhantomBlocks(now + PHANTOM_ENTER_MS + 100);
          const remoteMarked = remote.phantomMarked;
          const nextAt = run.phantomNextAt;
          const durationMs = Math.round(run.phantomUntil - run.phantomEnterUntil);
          run.steer.touchY = -1;
          updatePhysics(.15, now + PHANTOM_ENTER_MS + 120);
          const steersUp = run.slime.vy < 0;
          run.slime.x = center.x + center.w / 2;
          run.slime.y = center.y + center.h / 2;
          const exitAt = run.phantomUntil;
          const activeBeforeExit = updatePhantomCycle(exitAt - 1);
          updatePhantomCycle(exitAt);
          renderCanvas(exitAt);
          return { entering, phased, marked, remoteMarked, centerDestroyed: center.dead,
            neighborDamage: 3 - neighbor.hp, remoteDamage: 3 - remote.hp,
            burst: run.phantomBursts.length, activeBeforeExit,
            tangible: !phantomActive(exitAt), markCleared: !center.phantomMarked && !remote.phantomMarked,
            cadenceMs: Math.round(nextAt - now), durationMs, steersUp,
            emblemLoaded: Boolean(document.querySelector('link[href*="phantom.css"]')) };
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
    if (await evaluate('Boolean(window.SlimeGameDebug?.__qaPhantom)')) break;
    await sleep(100);
  }
  const result = await evaluate('window.SlimeGameDebug.__qaPhantom()');
  assert.deepEqual(result, { entering: true, phased: true, marked: true, remoteMarked: true,
    centerDestroyed: true, neighborDamage: 1, remoteDamage: 1, burst: 1,
    activeBeforeExit: true, tangible: true, markCleared: true,
    cadenceMs: 10000, durationMs: 4000,
    steersUp: true, emblemLoaded: true });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(result));
  socket.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  browser?.kill();
  server?.close();
});
