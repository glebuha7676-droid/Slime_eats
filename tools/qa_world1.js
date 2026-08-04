const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

function startServer(missingRequests) {
  const root = path.resolve(__dirname, '..');
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };
  const server = http.createServer((request, response) => {
    const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
    const file = path.resolve(root, `.${decodeURIComponent(requested)}`);
    if (!file.startsWith(root) || !fs.existsSync(file)) {
      missingRequests.push(request.url);
      response.writeHead(404).end();
      return;
    }
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

(async () => {
  const missingRequests = [];
  const server = await startServer(missingRequests);
  const port = server.address().port;
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('response', response => {
    if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`);
  });

  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: '.qa-admin-world1.png', fullPage: true });
  await page.locator('#startDropBtn').click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: '.qa-world1-grid.png', fullPage: true });
  await page.waitForTimeout(11000);
  await page.screenshot({ path: '.qa-world1-portal-line.png', fullPage: true });
  await page.reload({ waitUntil: 'networkidle' });
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#adminResetProgressBtn').click();
  await page.locator('#adminPrevWorldBtn').click();
  const wrappedWorld = await page.locator('#adminWorldValue').textContent();
  await page.locator('#adminNextWorldBtn').click();
  await page.locator('#adminNextWorldBtn').click();
  await page.waitForTimeout(250);
  const selectedWorld = await page.locator('#worldLabel').textContent();
  await page.screenshot({ path: '.qa-world2-menu.png', fullPage: true });
  await page.locator('#startDropBtn').click();
  await page.waitForTimeout(900);
  await page.screenshot({ path: '.qa-world2-run.png', fullPage: true });
  await page.waitForTimeout(19000);
  await page.screenshot({ path: '.qa-world2-late.png', fullPage: true });

  const result = {
    title: await page.title(),
    screen: await page.locator('.screen.active').getAttribute('id'),
    wrappedWorld,
    selectedWorld,
    target: await page.locator('#worldTargetBadge').textContent(),
    canvas: await page.locator('#physicsCanvas').evaluate(canvas => ({ width: canvas.width, height: canvas.height })),
    missingRequests,
    errors,
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})();
