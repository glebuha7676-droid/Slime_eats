const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');

const game = fs.readFileSync('game.js', 'utf8');
const home = fs.readFileSync('tools/test_home_console_browser.cjs', 'utf8').match(/const hook=`([\s\S]*?)`;/)[1];
const energy = fs.readFileSync('tools/test_anomaly_energy.cjs', 'utf8').match(/const hook=base\+`([\s\S]*?)`;/)[1];
const helpers = home + energy + `
window.__thrustQA = {
  start(empty = true) {
    __energyQA.start('fire', 1);
    cancelAnimationFrame(run.animationId);
    run.energyPickups = [];
    if (empty) {
      for (const block of run.blocks) block.dead = true;
      indexRunBlocks();
    }
    Object.assign(run.slime, { x: 220, y: 1800, vx: 0, vy: 305 });
    run.cameraY = 1642;
    run.damageInvulnerableUntil = 0;
    this.time = performance.now();
    run.lastTime = this.time;
    updateRunUI();
    renderCanvas(this.time);
  },
  tick(frames, fps = 60) {
    for (let i = 0; i < frames; i++) {
      this.time += 1000 / fps;
      gameFrame(this.time);
      cancelAnimationFrame(run.animationId);
    }
    return this.state();
  },
  state() {
    return { energy: run.energy, speed: run.slime.vy, direction: run.fallManeuver.direction,
      at: run.ultimateReadyAt, evacuation: Boolean(run.evacuation), active: run.elementalAbilityActive };
  },
  input() { return fallSteeringVector(); },
  enablePhantomSteering() {
    run.passiveLevels = { ...run.passiveLevels, phantom: 1 };
    startPhantomPhase(this.time);
    updateRunUI();
  },
  hitRock() {
    const rock = run.blocks.find(block => !block.hazard && !block.special && !block.bramble && !block.unbreakable);
    Object.assign(rock, { dead: false, hp: 3, maxHp: 3, tier: 'reinforced' });
    const before = run.energy;
    run.slime.vy = 350;
    resolveBlockHit(rock, { nx: 0, ny: -1, penetration: 2 }, this.time);
    return { dead: rock.dead, energy: run.energy, before, hp: rock.hp };
  },
  hitHazard() {
    const hazard = run.blocks.find(block => block.hazard && !block.tech && !block.breakableHazard);
    hazard.dead = false;
    run.damageInvulnerableUntil = 0;
    run.slime.vy = 350;
    const before = run.energy;
    resolveBlockHit(hazard, { nx: 0, ny: -1, penetration: 2 }, this.time);
    return before - run.energy;
  },
  prepareRockColumn() {
    const rocks = run.blocks.filter(block => block.col === 3 && block.row >= 22
      && !block.hazard && !block.special && !block.bramble && !block.unbreakable).slice(0, 3);
    for (const rock of rocks) Object.assign(rock, { dead: false, hp: 3, maxHp: 3, tier: 'reinforced' });
    this.rocks = rocks;
    const first = rocks[0];
    run.slime.x = first.x + first.w / 2;
    run.slime.y = first.y - run.slime.radius - 22;
    indexRunBlocks();
  },
  brokenColumn() { return this.rocks.filter(rock => rock.dead).length; },
  setEnergy(value) {
    run.energy = value;
    updateRunUI();
  },
  tryAbility(at) { return activateElementalAbility(at); },
  completeAbility(at) {
    run.elementalAbilityActive = '';
    run.elementalAbilityUntil = 0;
    return canActivateElementalAbility(at);
  },
  pause() { pauseRun(); },
  resume() { resumeRun(); cancelAnimationFrame(run.animationId); }
};
`;

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const output = 'output/reactive-fall-v3';
  fs.mkdirSync(output, { recursive: true });
  try {
    const page = await browser.newPage({ viewport: { width: 440, height: 840 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
    page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
    await page.route('**/game.js*', route => route.fulfill({
      contentType: 'application/javascript',
      body: game.replace('  init().catch(error => {', () => helpers + '  init().catch(error => {')
    }));
    await page.goto('http://127.0.0.1:8766/?v=horizontal-stick-1');
    await page.waitForFunction(() => window.__thrustQA && document.documentElement.classList.contains('app-ready'), null, { timeout: 15000 });

    await page.evaluate(() => __thrustQA.start());
    const dive = page.locator('#fallDiveBtn');
    const brake = page.locator('#fallBrakeBtn');
    await page.keyboard.down('s');
    assert.equal(await dive.getAttribute('data-pressed'), 'true');
    const start = await page.evaluate(() => __thrustQA.tick(1));
    const fast = await page.evaluate(() => __thrustQA.tick(59));
    assert(start.speed > 305 && start.speed < 315 && Math.abs(fast.speed - 347.7) < 1);
    assert(Math.abs(fast.energy - 95) < .01);
    assert.equal(await page.locator('#anomalyEnergy.is-maneuvering .anomaly-energy-label').textContent(), '−5%/с');
    await page.waitForSelector('#anomalyEnergy.is-burning', { timeout: 2000 });
    await page.screenshot({ path: output + '/dive.png' });
    const pierced = await page.evaluate(() => __thrustQA.hitRock());
    assert(pierced.dead && pierced.energy === pierced.before, 'Thrust destroys reinforced rock with only the timed cost');
    assert(Math.abs(await page.evaluate(() => __thrustQA.hitHazard()) - 15) < .01, 'Thrust does not shield hazards');
    await page.keyboard.up('s');
    assert.equal(await dive.getAttribute('data-pressed'), 'false');

    await page.evaluate(() => __thrustQA.start());
    await page.keyboard.down('w');
    assert.equal(await brake.getAttribute('data-pressed'), 'true');
    const slow = await page.evaluate(() => __thrustQA.tick(30, 30));
    assert(slow.speed > 0 && slow.speed < 120 && Math.abs(slow.energy - 95) < .01);
    await page.keyboard.up('w');
    assert.equal(await brake.getAttribute('data-pressed'), 'false');
    const rock = await page.evaluate(() => __thrustQA.hitRock());
    assert(!rock.dead && rock.hp === 2 && rock.before === rock.energy, 'Ordinary contact respects HP and costs no Strength');

    await page.evaluate(() => __thrustQA.start());
    const bounds = await dive.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    assert.equal(await dive.getAttribute('data-pressed'), 'true');
    await page.evaluate(() => __thrustQA.tick(24));
    await page.mouse.move(bounds.x + bounds.width + 40, bounds.y - 70);
    await page.mouse.up();
    assert.equal(await dive.getAttribute('data-pressed'), 'false');
    const release = await page.evaluate(() => __thrustQA.tick(1));
    const recovered = await page.evaluate(() => __thrustQA.tick(23));
    assert(release.speed > 330 && recovered.speed < 312 && recovered.energy === release.energy);
    assert.equal(await page.locator('#anomalyEnergy.is-maneuvering').count(), 0);
    await page.waitForSelector('#anomalyEnergy.is-burning', { state: 'detached', timeout: 2000 });

    await page.evaluate(() => { __thrustQA.start(); __thrustQA.prepareRockColumn(); });
    await page.keyboard.down('s');
    await page.evaluate(() => __thrustQA.tick(48));
    await page.keyboard.up('s');
    assert.equal(await page.evaluate(() => __thrustQA.brokenColumn()), 3, 'Real physics pierces successive reinforced tiles');

    await page.evaluate(() => __thrustQA.start());
    const ability = page.locator('#abilityBtn');
    assert(await ability.isEnabled(), 'Ability is ready at the start');
    await ability.click();
    const cast = await page.evaluate(() => __thrustQA.state());
    assert.equal(cast.energy, 80);
    assert.equal(await page.locator('#anomalyEnergy.is-spend .anomaly-energy-delta').textContent(), '−20%');
    assert(await ability.isDisabled());
    assert.match(await page.locator('#abilityPercent').textContent(), /^10 с$/);
    assert.equal(await page.evaluate(at => __thrustQA.tryAbility(at - 1), cast.at), false);
    await page.evaluate(() => __thrustQA.hitRock());
    assert.equal((await page.evaluate(() => __thrustQA.state())).at, cast.at, 'Breaking rock leaves the deadline alone');
    assert.equal(await page.evaluate(at => __thrustQA.completeAbility(at - 1), cast.at), false);
    assert.equal(await page.evaluate(at => __thrustQA.completeAbility(at), cast.at), true);
    await page.evaluate(() => __thrustQA.pause());
    const paused = await page.locator('#abilityPercent').textContent();
    await page.waitForTimeout(220);
    assert.equal(await page.locator('#abilityPercent').textContent(), paused);
    await page.evaluate(() => __thrustQA.resume());
    assert((await page.evaluate(() => __thrustQA.state())).at >= cast.at + 200);
    await page.evaluate(() => { __thrustQA.start(); __thrustQA.setEnergy(19); });
    assert(await ability.isDisabled());
    assert.equal(await page.evaluate(() => __thrustQA.tryAbility(performance.now())), false);
    assert.equal((await page.evaluate(() => __thrustQA.state())).energy, 19);

    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForFunction(() => document.querySelector('#shaft').getBoundingClientRect().height <= innerHeight);
    await page.evaluate(() => __thrustQA.start());
    await page.waitForFunction(() => document.querySelector('#fallDiveBtn').getBoundingClientRect().bottom <= innerHeight);
    const [upper, lower, abilityBounds, shaft] = await Promise.all([
      brake.boundingBox(), dive.boundingBox(), ability.boundingBox(), page.locator('#shaft').boundingBox()
    ]);
    assert(upper.width >= 64 && lower.height >= 64, 'Both touch targets are large on a narrow phone');
    assert(lower.x + lower.width < abilityBounds.x && lower.y + lower.height <= 568);
    assert(Math.abs((upper.y + lower.y + lower.height) / 2 - (shaft.y + shaft.height / 2)) < 3);
    assert(Math.abs((upper.y + lower.y + lower.height) / 2 - 568 / 2) < 18);
    const opacity = button => button.evaluate(node => Number(getComputedStyle(node).opacity));
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#fallDiveBtn')).opacity) === .5);
    assert.equal(await opacity(brake), .5);
    await page.screenshot({ path: output + '/controls-320.png' });
    const touch = await page.context().newCDPSession(page);
    const stickStart = { id: 1, x: Math.round(shaft.x + shaft.width * .7), y: Math.round(shaft.y + shaft.height * .63) };
    const stickDown = { ...stickStart, y: stickStart.y + 45 };
    const stickLeft = { ...stickDown, x: stickDown.x - 38 };
    const diveTouch = { id: 2, x: Math.round(lower.x + lower.width / 2), y: Math.round(lower.y + lower.height / 2) };
    const brakeTouch = { id: 2, x: Math.round(upper.x + upper.width / 2), y: Math.round(upper.y + upper.height / 2) };
    const dispatch = (type, ...touchPoints) => touch.send('Input.dispatchTouchEvent', { type, touchPoints });
    await dispatch('touchStart', stickStart);
    await page.waitForSelector('#touchJoystick.is-active',{timeout:1500});
    await dispatch('touchMove', stickDown);
    assert.deepEqual(await page.evaluate(() => __thrustQA.input()), { x: 0, y: 0, up: 0, down: 0 });
    await dispatch('touchMove', stickLeft);
    await page.waitForFunction(() => __thrustQA.input().x === -1,null,{timeout:1500});
    assert.deepEqual(await page.evaluate(() => __thrustQA.input()), { x: -1, y: 0, up: 0, down: 0 });
    await dispatch('touchStart', stickLeft, diveTouch);
    await page.waitForSelector('#fallDiveBtn[data-pressed="true"]',{timeout:1500});
    assert.equal(await dive.getAttribute('data-pressed'), 'true');
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#fallDiveBtn')).opacity) === 1);
    assert.equal(await opacity(brake), .5);
    assert.deepEqual(await page.evaluate(() => __thrustQA.input()), { x: -1, y: 1, up: 0, down: 1 });
    assert.equal((await page.evaluate(() => __thrustQA.tick(12))).direction, 'down');
    await page.screenshot({ path: output + '/stick-and-dive-320.png' });
    await dispatch('touchCancel');
    await page.waitForFunction(() => __thrustQA.input().x === 0 && __thrustQA.input().down === 0,null,{timeout:1500});
    assert.equal(await dive.getAttribute('data-pressed'), 'false');
    assert.deepEqual(await page.evaluate(() => __thrustQA.input()), { x: 0, y: 0, up: 0, down: 0 });
    assert.equal((await page.evaluate(() => __thrustQA.tick(1))).direction, '');

    await page.evaluate(() => __thrustQA.enablePhantomSteering());
    await dispatch('touchStart', brakeTouch);
    await page.waitForFunction(() => __thrustQA.input().y === -1,null,{timeout:1500});
    assert.equal((await page.evaluate(() => __thrustQA.input())).y, -1);
    assert.equal((await page.evaluate(() => __thrustQA.tick(1))).direction, '', 'The vertical button steers the phantom without using thrust');
    await dispatch('touchEnd');
    await page.evaluate(() => __thrustQA.start());

    await page.evaluate(() => __thrustQA.setEnergy(.1));
    await page.keyboard.down('w');
    const exhausted = await page.evaluate(() => __thrustQA.tick(3));
    assert.equal(exhausted.energy, 0);
    assert(exhausted.evacuation);
    assert.equal(await page.locator('#anomalyEnergy.is-exhaustion-flash .anomaly-energy-value').textContent(), '0%');
    assert.equal(await page.locator('#anomalyEnergy.is-exhausted .anomaly-energy-label').textContent(), 'НЕТ СИЛЫ');
    assert(await dive.isHidden());
    await page.keyboard.up('w');
    assert.deepEqual(errors, []);
    console.log('Reactive fall, keyboard/pointer releases, rock and hazard contacts, timed ability, pause and depletion passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
