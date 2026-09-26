const { spawn } = require('child_process');
const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'slime-portal-qa-'));
const debugPort = 9223;
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
        __qaPortal: () => {
          session.foods = FOODS.slice(0, 3);
          recalcStats();
          startDrop();
          run.slime.x = VIEW_W / 2;
          run.slime.y = run.portalY;
          beginPortalEntry(performance.now());
          return true;
        },`));
    } else fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = spawn(chrome, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--remote-allow-origins=*', `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`, 'about:blank'
  ], { stdio: 'ignore', windowsHide: true });

  let target;
  for (let i = 0; i < 80; i += 1) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
      target = targets.find(item => item.type === 'page');
      if (target) break;
    } catch (_) { /* Chrome is starting. */ }
    await sleep(100);
  }
  if (!target) throw new Error('Chrome DevTools did not start');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ': ' + (message.params.exceptionDetails.exception?.description || ''));
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
  await send('Page.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}/` });
  for (let i = 0; i < 100; i += 1) {
    if (await evaluate('Boolean(window.SlimeGameDebug?.__qaPortal)')) break;
    await sleep(100);
  }
  await evaluate('window.SlimeGameDebug.__qaPortal()');
  await sleep(4300);
  const beforeContinue = await evaluate(`({ portal: document.querySelector('#resultOverlay').className,
      badge: document.querySelector('#resultBadge').textContent,
      continueDisabled: document.querySelector('#continueBtn').disabled,
      continueText: document.querySelector('#continueBtn').textContent,
      trophies: window.SlimeGameDebug.save().worldTrophies[1],
      screen: document.body.dataset.screen })`);
  await evaluate("document.querySelector('#continueBtn').click()");
  await sleep(200);
  const afterContinue = await evaluate(`({ portal: document.querySelector('#resultOverlay').className,
    screen: document.body.dataset.screen })`);
  assert.equal(beforeContinue.badge, 'МИР ПРОЙДЕН');
  assert.equal(beforeContinue.continueDisabled, false);
  assert.equal(beforeContinue.trophies, 1);
  assert.equal(beforeContinue.portal.includes('hidden'), false);
  assert.equal(afterContinue.screen, 'home');
  assert.equal(afterContinue.portal.includes('hidden'), true);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({
    beforeContinue,
    afterContinue,
    errors
  }, null, 2));
  socket.close();
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  browser?.kill();
  server?.close();
});
