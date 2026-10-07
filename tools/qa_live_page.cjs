const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'slime-live-qa-'));
const port = 9236;
let url = process.argv[2] || 'https://glebuha7676-droid.github.io/Slime_eats/?qa=live';
const waitMs = Number(process.argv[3] || 8000);
const mobile = process.argv[4] === 'mobile';
const screenshotPath = process.argv[5];
const showReadyButton = process.argv[6] === 'ready';
const cssOverridePath = process.argv[7];
const viewportWidth = Number(process.argv[8] || 390);
const viewportHeight = Number(process.argv[9] || 844);
const setupJsPath = process.argv[10];
const browser = spawn(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-allow-origins=*', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, 'about:blank'
], { stdio: 'ignore', windowsHide: true });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let server;

(async () => {
  if (url === 'local') {
    const root = path.resolve(__dirname, '..');
    server = http.createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(root) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end();
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
      response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(response);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}/`;
  }
  let target;
  for (let i = 0; i < 100; i++) {
    try {
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      target = targets.find(item => item.type === 'page');
      if (target) break;
    } catch (_) { /* Browser starting. */ }
    await sleep(100);
  }
  if (!target) throw new Error('Chrome did not start');
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  const requests = new Map();
  const issues = [];
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.method === 'Network.requestWillBeSent') requests.set(message.params.requestId, message.params.request.url);
    if (message.method === 'Network.loadingFinished' || message.method === 'Network.loadingFailed') requests.delete(message.params.requestId);
    if (message.method === 'Runtime.exceptionThrown')
      issues.push(`EXCEPTION ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`);
    if (message.method === 'Network.loadingFailed')
      issues.push(`FAILED ${message.params.errorText} ${message.params.requestId}`);
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400)
      issues.push(`HTTP ${message.params.response.status} ${message.params.response.url}`);
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
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.enable');
  if (mobile) {
    await send('Emulation.setDeviceMetricsOverride', { width: viewportWidth, height: viewportHeight, deviceScaleFactor: 2, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await send('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36' });
  }
  await send('Page.navigate', { url });
  await sleep(waitMs);
  if (cssOverridePath && cssOverridePath !== 'none') {
    const css = fs.readFileSync(cssOverridePath, 'utf8');
    await send('Runtime.evaluate', { expression: `(()=>{const s=document.createElement('style');s.textContent=${JSON.stringify(css)};document.head.appendChild(s)})()` });
  }
  if (showReadyButton) {
    await send('Runtime.evaluate', { expression: `(()=>{const b=document.querySelector('#worldStartBtn');b.disabled=false;b.classList.remove('hungry');b.classList.add('ready')})()` });
    await sleep(1800);
  }
  if (setupJsPath && setupJsPath !== 'none') {
    await send('Runtime.evaluate', { expression: fs.readFileSync(setupJsPath, 'utf8'), awaitPromise: true });
    await sleep(700);
  }
  const result = await send('Runtime.evaluate', {
    expression: `({url:location.href,ready:document.readyState,htmlClass:document.documentElement.className,screen:document.body.dataset.screen,debug:!!window.SlimeGameDebug,home:!!document.querySelector('#homeScreen.active'),visible:!!document.querySelector('.phone-viewport')&&getComputedStyle(document.querySelector('.phone-viewport')).visibility,depth:document.querySelector('#depthValue')?.textContent,research:document.querySelector('#runResearchScore')?.textContent,level:document.querySelector('#coinsLabel')?.textContent,levelProgress:document.querySelector('#playerLevelExperience')?.textContent,worldLock:document.querySelector('#worldTerminalLock')?.textContent,worldLocked:!document.querySelector('#worldTerminalLock')?.hidden,play:(()=>{let b=document.querySelector('#worldStartBtn'),p=getComputedStyle(b,'::before'),r=b.getBoundingClientRect();return {rect:[r.x,r.y,r.width,r.height],before:{content:p.content,display:p.display,background:p.backgroundImage,opacity:p.opacity,visibility:p.visibility,zIndex:p.zIndex},style:getComputedStyle(b).cssText}})(),domReadyMs:Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd||0),loadMs:Math.round(performance.getEntriesByType('navigation')[0]?.loadEventEnd||0),slowest:performance.getEntriesByType('resource').sort((a,b)=>b.responseEnd-a.responseEnd).slice(0,8).map(x=>({name:x.name.split('/').pop(),end:Math.round(x.responseEnd),duration:Math.round(x.duration)}))})`,
    returnByValue: true
  });
  console.log(JSON.stringify({ state: result.result.value, pending: [...requests.values()], issues }, null, 2));
  if (screenshotPath) {
    const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(screenshotPath, Buffer.from(capture.data, 'base64'));
  }
  socket.close();
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  browser.kill();
  server?.close();
  await sleep(700);
  const tempRoot = fs.realpathSync(os.tmpdir());
  const generatedProfile = path.resolve(profile);
  if (path.dirname(generatedProfile) === tempRoot && path.basename(generatedProfile).startsWith('slime-live-qa-')) {
    try { fs.rmSync(generatedProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
    catch (error) { console.warn(`Could not remove QA profile: ${error.message}`); }
  }
});
