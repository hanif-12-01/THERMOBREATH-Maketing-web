import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [modulePath, executablePath, origin = 'http://127.0.0.1:4173/', shots = 'docs/qa/ux-002'] = process.argv.slice(2);
if (!modulePath) throw new Error('Pass the path to an installed playwright/index.mjs');
const { chromium } = await import(pathToFileURL(modulePath).href);
const browser = await chromium.launch({ executablePath, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const evidence = [];
const errors = [];
const motionPath = '#breath-art .breath-core';

function track(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().startsWith(origin)) errors.push(`${response.status()} ${response.url()}`);
  });
}

try {
  for (const [width, height] of [[360, 800], [390, 844], [768, 940], [1024, 900], [1440, 960]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
    track(page);
    if (width === 390) {
      await page.route('**/assets/breath.mjs', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 250));
        await route.continue();
      });
    }
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.addInitScript(() => {
      window.qaVitals = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        window.qaVitals.lcp = list.getEntries().at(-1)?.startTime ?? 0;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.qaVitals.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const response = await page.goto(origin, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.team-grid article').count(), 6);
    assert(await page.locator('#breath-art').isVisible());
    assert.equal(await page.locator('.hero img').count(), 0);
    const layout = await page.evaluate(() => ({
      width: window.innerWidth,
      contentWidth: document.documentElement.scrollWidth,
      lcp: window.qaVitals.lcp,
      cls: window.qaVitals.cls,
    }));
    assert.equal(layout.width, layout.contentWidth, `Overflow at ${width}px`);
    assert(layout.cls < .01, `Unexpected load layout shift at ${width}px: ${layout.cls}`);
    assert(!requests.some((url) => url.includes('.glb') || url.includes('model-viewer')), '3D must load only on demand');
    if (width === 390 || width === 1440) {
      const size = width === 390 ? 'mobile' : 'desktop';
      await page.screenshot({ path: `${shots}-hero-after-${size}.png` });
    }
    await page.keyboard.press('Tab');
    assert(await page.locator('.skip').evaluate((el) => el === document.activeElement), 'Skip link should get focus first');
    if (width <= 895) {
      const menu = page.getByRole('button', { name: 'Menu', exact: true });
      await menu.click();
      assert(await page.getByRole('navigation', { name: 'Navigasi utama' }).isVisible());
      await page.keyboard.press('Escape');
      assert.equal(await menu.getAttribute('aria-expanded'), 'false');
      assert(await menu.evaluate((el) => el === document.activeElement));
    }
    const breath = page.getByRole('button', { name: 'Ubah napas jadi sinyal' });
    const initialPath = await page.locator(motionPath).getAttribute('d');
    await breath.focus();
    await page.keyboard.press('Space');
    assert.equal(await breath.getAttribute('aria-pressed'), 'true');
    assert.notEqual(await page.locator(motionPath).getAttribute('d'), initialPath, 'Reduced motion should show a static signal state');
    assert.equal(await page.locator('[data-breath-pulse]').getAttribute('opacity'), '0');
    await page.keyboard.press('Enter');
    assert.equal(await breath.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator(motionPath).getAttribute('d'), initialPath);

    await page.locator('.hero-copy a[href="#contact"]').click();
    assert.equal(new URL(page.url()).hash, '#contact');
    await page.locator('.hero-copy a[href="#thermobreath"]').click();
    assert.equal(new URL(page.url()).hash, '#thermobreath');
    for (const view of ['side', 'rear', 'front']) {
      await page.locator(`[data-view="${view}"]`).click();
      assert.equal(await page.locator(`[data-view="${view}"]`).getAttribute('aria-pressed'), 'true');
      await page.locator('[data-poster]').evaluate((img) => img.decode());
    }
    await page.locator('[data-markers] [data-marker="5"]').click();
    assert(await page.locator('details[data-part="5"]').evaluate((el) => el.open));
    await page.locator('[data-step="3"]').click();
    assert(await page.locator('#step-3').isVisible());
    assert(!(await page.locator('#step-0').isVisible()));
    assert.equal(await page.locator('[data-step]').count(), 5);
    const benchmark = page.locator('.benchmark');
    const summary = benchmark.locator('summary');
    assert(!(await benchmark.locator('figure').isVisible()));
    await summary.focus();
    await page.keyboard.press('Enter');
    assert(await benchmark.getByText('Benchmark S-OH — 9 Kategori — Bukan Evaluasi Pneumonia.').isVisible());
    const scores = await benchmark.locator('li strong').allTextContents();
    assert.deepEqual(scores, ['37,12%', '43,76%', '40,60%']);
    assert(await page.locator('#step-3').isVisible());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    const jsonUrl = await benchmark.getByRole('link', { name: /Data evaluasi/ }).getAttribute('href');
    const data = await (await page.request.get(new URL(jsonUrl, page.url()).href)).json();
    assert.deepEqual([data.experiment, data.samples, data.classes, data.folds], ['TASK-ML-003', 1234, 9, 5]);
    if (width === 390 || width === 1440) {
      const size = width === 390 ? 'mobile' : 'desktop';
      await summary.evaluate((element) => element.blur());
      await page.locator('#technology').screenshot({
        path: `${shots}-technology-${size}.png`,
        style: '.topbar { position: static !important; } .skip { visibility: hidden !important; }',
      });
    }
    await summary.click();
    assert(!(await benchmark.locator('figure').isVisible()));
    await page.locator('.faq-list summary').nth(4).click();
    assert(await page.getByText(/Kemampuan mendeteksi pneumonia belum terbukti/).isVisible());
    for (const label of ['Beranda', 'THERMOBREATH', 'Teknologi', 'Aplikasi', 'Progres', 'Tim', 'Kontak']) {
      const nav = page.getByRole('navigation', { name: 'Navigasi utama' });
      if (width <= 895) await page.getByRole('button', { name: 'Menu', exact: true }).click();
      const item = nav.getByRole('link', { name: label, exact: true });
      const hash = await item.getAttribute('href');
      await item.click();
      assert.equal(new URL(page.url()).hash, hash);
    }
    assert(await page.getByText('Kanal kontak resmi sedang disiapkan').isVisible());
    if (width === 1440) {
      await page.getByRole('button', { name: 'Buka model 3D' }).click();
      await page.getByRole('button', { name: 'Kembali ke gambar' }).waitFor({ timeout: 20000 });
      assert(await page.locator('model-viewer').evaluate((el) => el.loaded));
      await page.getByRole('button', { name: 'Belakang', exact: true }).click();
      assert.match(await page.locator('model-viewer').getAttribute('camera-orbit'), /^160deg/);
      await page.getByRole('button', { name: 'Depan', exact: true }).click();
      const model = page.locator('model-viewer');
      await model.scrollIntoViewIfNeeded();
      const before = await model.evaluate((element) => element.getCameraOrbit().theta);
      const bounds = await model.boundingBox();
      const x = bounds.x + bounds.width * .33;
      const y = bounds.y + bounds.height * .64;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 85, y + 12, { steps: 9 });
      await page.mouse.up();
      await page.waitForFunction((theta) =>
        Math.abs(document.querySelector('model-viewer').getCameraOrbit().theta - theta) > .05, before);
      await page.getByRole('button', { name: 'Depan', exact: true }).click();
      await page.getByRole('button', { name: 'Kembali ke gambar' }).click();
      assert(await page.locator('[data-poster]').isVisible());
    }
    evidence.push({ ...layout, width, height, keyboardReducedMotion: 'PASS', benchmark: 'PASS', result: 'PASS' });
    await page.close();
  }

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'no-preference' });
  track(desktop);
  await desktop.goto(origin, { waitUntil: 'networkidle' });
  const stage = desktop.locator('[data-breath-stage]');
  const bounds = await stage.boundingBox();
  const idle = await desktop.locator(motionPath).getAttribute('d');
  const changedPath = (prior) => desktop.waitForFunction(
    ([selector, previous]) => document.querySelector(selector).getAttribute('d') !== previous,
    [motionPath, prior], { timeout: 4000 });
  await desktop.mouse.move(bounds.x + bounds.width * .23, bounds.y + bounds.height * .7);
  await changedPath(idle);
  await desktop.mouse.move(5, 110);
  await desktop.waitForFunction(([selector, prior]) => document.querySelector(selector).getAttribute('d') === prior,
    [motionPath, idle], { timeout: 4000 });
  const desktopTrigger = desktop.getByRole('button', { name: 'Ubah napas jadi sinyal' });
  await desktopTrigger.click();
  assert.equal(await desktopTrigger.getAttribute('aria-pressed'), 'true');
  await desktop.waitForFunction(() => Number(document.querySelector('[data-breath-pulse]').getAttribute('opacity')) > .08);
  await changedPath(idle);
  await desktop.waitForFunction(() => document.querySelector('[data-breath-pulse]').getAttribute('opacity') === '0');
  await desktop.screenshot({ path: `${shots}-hero-signal.png` });
  await desktopTrigger.click();
  await desktop.mouse.move(5, 110);
  await desktop.waitForFunction(([selector, prior]) => document.querySelector(selector).getAttribute('d') === prior,
    [motionPath, idle], { timeout: 4000 });
  await desktop.evaluate(() => window.scrollTo({ top: 180, behavior: 'instant' }));
  await changedPath(idle);
  assert.equal(await desktop.evaluate(() => window.scrollY), 180);
  await desktop.locator('#technology').scrollIntoViewIfNeeded();
  await desktop.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const inactiveWrites = await desktop.locator(motionPath).evaluate(async (node) => {
    let writes = 0;
    const observer = new MutationObserver((entries) => { writes += entries.length; });
    observer.observe(node, { attributes: true, attributeFilter: ['d'] });
    await new Promise((resolve) => setTimeout(resolve, 250));
    observer.disconnect();
    return writes;
  });
  assert.equal(inactiveWrites, 0);
  evidence.push({ pointerBendAndReset: 'PASS', clickPulseAndReplay: 'PASS', scrollMorph: 'PASS', offscreenPathWrites: inactiveWrites });
  await desktop.close();

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  track(touch);
  const cdp = await touch.context().newCDPSession(touch);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await touch.goto(origin, { waitUntil: 'networkidle' });
  const touchTrigger = touch.getByRole('button', { name: 'Ubah napas jadi sinyal' });
  await touch.evaluate(() => {
    window.qaIntervals = [];
    let previous = performance.now();
    const capture = (now) => {
      window.qaIntervals.push(now - previous);
      previous = now;
      if (window.qaIntervals.length < 75) requestAnimationFrame(capture);
    };
    requestAnimationFrame(capture);
  });
  await touchTrigger.tap();
  assert.equal(await touchTrigger.getAttribute('aria-pressed'), 'true');
  await touch.waitForFunction(() => Number(document.querySelector('[data-breath-pulse]').getAttribute('opacity')) > .08);
  await touch.waitForFunction(() => window.qaIntervals.length === 75);
  const frameIntervals = await touch.evaluate(() => window.qaIntervals.slice(1).sort((a, b) => a - b));
  await touchTrigger.tap();
  assert.equal(await touchTrigger.getAttribute('aria-pressed'), 'false');
  evidence.push({ touchTapAndReplay: 'PASS', emulatedMobileCpuThrottle: '4×', frameIntervalP95Ms: Number(frameIntervals[Math.ceil(frameIntervals.length * .95) - 1].toFixed(1)) });
  await touch.close();

  const fallback = await browser.newPage({ viewport: { width: 390, height: 844 } });
  track(fallback);
  await fallback.addInitScript(() => {
    const context = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith('webgl') ? null : context.call(this, type, ...args);
    };
  });
  await fallback.goto(origin);
  await fallback.getByRole('button', { name: 'Buka model 3D' }).click();
  assert(await fallback.getByRole('status').getByText(/Model 3D tidak tersedia/).isVisible());
  await fallback.getByRole('button', { name: 'Samping', exact: true }).click();
  await fallback.locator('[data-poster]').evaluate((img) => img.decode());
  evidence.push({ noWebGL: 'PASS' });
  await fallback.close();
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJs.goto(origin);
  assert(await noJs.locator('#breath-art').isVisible());
  assert(!(await noJs.getByRole('button', { name: 'Ubah napas jadi sinyal' }).isVisible()));
  await noJs.locator('.benchmark summary').click();
  assert(await noJs.locator('.benchmark-chart').isVisible());
  assert(await noJs.locator('#step-3').isVisible());
  assert(await noJs.getByRole('navigation', { name: 'Navigasi utama' }).isVisible());
  evidence.push({ noJavaScript: 'PASS' });
  await noJs.close();
  assert.deepEqual(errors, []);
  evidence.push({ consoleAndHttpErrors: errors });
  console.log(JSON.stringify(evidence, null, 2));
  await writeFile(`${shots}-browser-results.json`, JSON.stringify(evidence, null, 2) + '\n');
} finally {
  await browser.close();
}
