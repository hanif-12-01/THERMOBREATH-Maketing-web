import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [modulePath, executablePath, origin = 'http://127.0.0.1:4173/'] = process.argv.slice(2);
if (!modulePath) throw new Error('Pass an installed Playwright module path');
const { chromium } = await import(pathToFileURL(modulePath).href);
const browser = await chromium.launch({
  executablePath, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'],
});
const results = {};
const errors = [];
const output = 'docs/qa/web-3d-001';
const glb = '/models/thermobreath-exploded.glb';

async function open(options = {}) {
  const page = await browser.newPage(options);
  page.setDefaultTimeout(8000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return page;
}

function mode(page, value) {
  return page.locator(`[data-explorer][data-mode="${value}"]`).waitFor();
}

async function load(page, tap = false) {
  const button = page.getByRole('button', { name: 'Buka model 3D' });
  if (tap) await button.tap();
  else await button.click();
  await page.getByRole('button', { name: 'Kembali ke gambar' }).waitFor({ timeout: 17000 });
  assert(await page.locator('model-viewer').evaluate((viewer) => viewer.loaded));
}

async function shot(page, name) {
  await page.locator('[data-explorer]').screenshot({
    path: `${output}-${name}.png`,
    style: '.topbar { position: static !important; } .skip { visibility: hidden !important; }',
  });
}

const select = (page, id) => page.locator(`details[data-component="${id}"] summary`);
const slider = (page) => page.getByRole('slider', { name: 'Tingkat Pembongkaran' });
const orbit = (page) => page.locator('model-viewer').evaluate((viewer) => viewer.getCameraOrbit());

async function setProgress(page, value) {
  await slider(page).evaluate((input, percent) => {
    input.value = String(percent);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, value);
  assert.equal(await slider(page).inputValue(), String(value));
  const currentTime = await page.locator('model-viewer').evaluate((viewer) => viewer.currentTime);
  assert(Math.abs(currentTime - value / 100) < .0002);
}

try {
  const desktop = await open({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const requests = [];
  desktop.on('request', (request) => requests.push(request.url()));
  await desktop.goto(origin, { waitUntil: 'networkidle' });
  assert(!requests.some((url) => url.includes(glb)));
  await desktop.locator('#product-viewport').scrollIntoViewIfNeeded();
  await desktop.waitForFunction(() => Boolean(customElements.get('model-viewer')));
  assert(!requests.some((url) => url.includes(glb)), 'GLB must be opt-in');
  const loadStart = Date.now();
  await load(desktop);
  const loadMs = Date.now() - loadStart;
  const viewer = desktop.locator('model-viewer');
  assert.deepEqual(await viewer.evaluate((element) => element.availableAnimations), ['Assembly']);
  await desktop.getByRole('button', { name: 'Reset Kamera' }).click();
  await desktop.waitForFunction(() => Math.abs(document.querySelector('model-viewer').getCameraOrbit().theta + .38397) < .02);
  const beforeZoom = await orbit(desktop);
  await desktop.getByRole('button', { name: 'Perbesar model' }).click();
  await desktop.waitForFunction((radius) => document.querySelector('model-viewer').getCameraOrbit().radius < radius * .91, beforeZoom.radius);
  await desktop.getByRole('button', { name: 'Perkecil model' }).click();
  await desktop.waitForFunction((radius) => document.querySelector('model-viewer').getCameraOrbit().radius > radius * .94, beforeZoom.radius);
  await viewer.scrollIntoViewIfNeeded();
  const box = await viewer.boundingBox();
  const beforeRotate = await orbit(desktop);
  const dragX = box.x + box.width * .32;
  const dragY = box.y + box.height * .68;
  await desktop.mouse.move(dragX, dragY);
  await desktop.mouse.down();
  await desktop.mouse.move(dragX + 86, dragY, { steps: 8 });
  await desktop.mouse.up();
  await desktop.waitForFunction((theta) => Math.abs(document.querySelector('model-viewer').getCameraOrbit().theta - theta) > .1, beforeRotate.theta);
  for (const [label, theta] of [['Samping', -75], ['Belakang', 160], ['Depan', -22]]) {
    await desktop.getByRole('button', { name: label, exact: true }).click();
    await desktop.waitForFunction((degrees) => {
      const current = document.querySelector('model-viewer').getCameraOrbit().theta;
      return Math.cos(current - degrees * Math.PI / 180) > .9998;
    }, theta);
  }
  await desktop.getByRole('button', { name: 'Reset Kamera' }).click();
  await shot(desktop, 'assembled');

  await desktop.getByRole('button', { name: 'Bongkar Perangkat' }).click();
  await mode(desktop, 'exploded');
  assert.equal(await slider(desktop).inputValue(), '100');
  await desktop.waitForFunction(() => Math.cos(document.querySelector('model-viewer').getCameraOrbit().theta - 169 * Math.PI / 180) > .9998);
  await shot(desktop, 'exploded');
  await setProgress(desktop, 50);
  await setProgress(desktop, 82);
  await setProgress(desktop, 23);
  await setProgress(desktop, 0);
  await mode(desktop, 'assembled');
  await setProgress(desktop, 100);

  const mos = select(desktop, 'mos_sensor');
  await mos.focus();
  await desktop.keyboard.press('Enter');
  await mode(desktop, 'focusing');
  assert(await desktop.locator('details[data-component="mos_sensor"]').evaluate((el) => el.open));
  const highlights = await viewer.evaluate((element) => ({
    mos: element.model.materials.find((material) => material.name.startsWith('mos_sensor__')).emissiveFactor[2],
    lcd: element.model.materials.find((material) => material.name.startsWith('lcd_assembly__TB_LCD')).emissiveFactor[2],
  }));
  assert(highlights.mos > .6 && highlights.lcd < .6);
  await desktop.waitForFunction(() => {
    const center = document.querySelector('model-viewer').getCameraTarget();
    return Math.abs(center.x + .031) < .004 && Math.abs(center.y - .063) < .004;
  });
  await shot(desktop, 'selected');
  await desktop.getByRole('button', { name: 'Lihat susunan' }).click();
  await mode(desktop, 'exploded');
  const marker = desktop.locator('model-viewer button[data-component="mos_sensor"]');
  await marker.click();
  assert.equal(await desktop.locator('[data-explorer]').getAttribute('data-selected-component'), 'mos_sensor');
  assert(await desktop.locator('details[data-component="mos_sensor"]').evaluate((element) => element.open));
  await desktop.getByRole('button', { name: 'Lihat susunan' }).click();

  // Click an actual mesh area outside the DOM hotspot buttons.
  await viewer.scrollIntoViewIfNeeded();
  await desktop.waitForFunction(() => {
    const target = document.querySelector('model-viewer').getCameraTarget();
    return Math.abs(target.x - .01013) < .004;
  });
  const hit = await viewer.evaluate((element) => {
    const rectangle = element.getBoundingClientRect();
    for (let y = 28; y < rectangle.height - 20; y += 5) {
      for (let x = 28; x < rectangle.width - 20; x += 5) {
        const px = rectangle.left + x;
        const py = rectangle.top + y;
        if (document.elementFromPoint(px, py) instanceof HTMLButtonElement) continue;
        const id = element.materialFromPoint(px, py)?.name.split('__')[0];
        if (['power_assembly', 'flow_sensor', 'microcontroller', 'temperature_humidity'].includes(id)) return { px, py, id };
      }
    }
    return null;
  });
  assert(hit, 'Expected a pickable internal mesh outside overlays');
  await desktop.mouse.click(hit.px, hit.py);
  assert.equal(await desktop.locator('[data-explorer]').getAttribute('data-selected-component'), hit.id);
  assert(await desktop.locator(`details[data-component="${hit.id}"]`).evaluate((element) => element.open));
  await desktop.getByRole('button', { name: 'Susun Kembali' }).click();
  await mode(desktop, 'assembled');
  assert.equal(await slider(desktop).inputValue(), '0');
  const primary = desktop.locator('[data-explode]');
  await primary.evaluate((button) => { button.click(); button.click(); button.click(); });
  await mode(desktop, 'exploded');
  await desktop.getByRole('button', { name: 'Perangkat Utuh', exact: true }).click();
  await mode(desktop, 'assembled');
  assert.equal(await slider(desktop).inputValue(), '0');
  assert.equal(await viewer.evaluate((element) => element.currentTime), 0);
  await desktop.getByRole('button', { name: 'Kembali ke gambar' }).click();
  assert.equal(await viewer.count(), 0);
  results.desktop = { loadMs, orbitZoomPresets: 'PASS', assemblyAndScrub: 'PASS', selectionHighlightFocus: 'PASS',
    hotspotAndMeshSelection: 'PASS', rapidActionAndReassembly: 'PASS', closeViewer: 'PASS', lazyGlb: 'PASS' };
  await desktop.close();

  for (const width of [360, 390, 768, 1024, 1440]) {
    const page = await open({ viewport: { width, height: 920 }, reducedMotion: 'reduce' });
    await page.goto(`${origin}#thermobreath`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await load(page);
    await page.getByRole('button', { name: 'Bongkar Perangkat' }).click();
    await mode(page, 'exploded');
    assert.equal(await slider(page).inputValue(), '100');
    await slider(page).focus();
    await page.keyboard.press('ArrowLeft');
    assert.equal(await slider(page).inputValue(), '99');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.close();
  }
  results.responsiveReducedMotion = [360, 390, 768, 1024, 1440];

  const mobile = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const cdp = await mobile.context().newCDPSession(mobile);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await mobile.goto(`${origin}#thermobreath`);
  await load(mobile, true);
  await mobile.locator('[data-explode]').tap();
  await mode(mobile, 'exploded');
  const range = slider(mobile);
  await range.tap({ position: { x: 80, y: 13 } });
  assert(Number(await range.inputValue()) > 0 && Number(await range.inputValue()) < 100);
  await select(mobile, 'flow_sensor').tap();
  await mode(mobile, 'focusing');
  await mobile.waitForFunction(() => document.querySelector('#explosion-progress').value === '100');
  await mobile.getByRole('button', { name: 'Lihat susunan' }).tap();
  await mode(mobile, 'exploded');
  await mobile.waitForFunction(() => Math.abs(document.querySelector('model-viewer').getCameraTarget().x - .01013) < .004);
  await mobile.locator('#product-viewport').scrollIntoViewIfNeeded();
  await mobile.waitForFunction(() => document.querySelectorAll('model-viewer .model-marker:not([hidden])').length >= 2);
  const accessibility = await mobile.locator('[data-explorer]').ariaSnapshot();
  assert.match(accessibility, /slider "Tingkat Pembongkaran"/);
  assert.match(accessibility, /button "Perbesar model"/);
  await shot(mobile, 'mobile');
  await mobile.getByRole('button', { name: 'Perangkat Utuh', exact: true }).tap();
  await mode(mobile, 'assembled');
  results.mobile = { touchControls: 'PASS', cpuThrottling: '4x' };
  await mobile.close();

  const fallback = await open({ viewport: { width: 1024, height: 900 } });
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (name, ...args) {
      return name.startsWith('webgl') ? null : getContext.call(this, name, ...args);
    };
  });
  await fallback.goto(`${origin}#thermobreath`);
  await fallback.getByRole('button', { name: 'Buka model 3D' }).click();
  await fallback.getByText(/Model 3D tidak tersedia/).waitFor();
  await fallback.getByRole('button', { name: 'Samping', exact: true }).click();
  await fallback.locator('[data-poster]').evaluate((img) => img.decode());
  await select(fallback, 'mos_sensor').click();
  await shot(fallback, 'fallback');
  results.noWebGL = 'PASS';
  await fallback.close();

  const incomplete = await open({ viewport: { width: 1024, height: 900 } });
  await incomplete.goto(`${origin}#thermobreath`);
  await incomplete.locator('[data-explorer]').evaluate((node) => { node.dataset.model = './models/thermobreath-concept.glb'; });
  await load(incomplete);
  assert(!(await incomplete.getByRole('button', { name: 'Bongkar Perangkat' }).isVisible()));
  assert(await incomplete.getByRole('button', { name: 'Perbesar model' }).isVisible());
  await incomplete.getByText(/Tampilan terurai menunggu aset/).waitFor();
  results.assembledOnlyGlb = 'PASS';
  await incomplete.close();

  const missing = await open({ viewport: { width: 1024, height: 900 } });
  await missing.goto(`${origin}#thermobreath`);
  await missing.locator('[data-explorer]').evaluate((node) => { delete node.dataset.model; });
  await missing.getByRole('button', { name: 'Buka model 3D' }).click();
  await missing.getByText(/Model 3D tidak tersedia/).waitFor();
  assert(await missing.locator('[data-poster]').isVisible());
  assert(!(await missing.getByRole('button', { name: 'Bongkar Perangkat' }).isVisible()));
  results.missingGlbConfiguration = 'PASS';
  await missing.close();

  const failedRequest = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  const failedErrors = [];
  failedRequest.on('pageerror', (error) => failedErrors.push(error.message));
  await failedRequest.route(`**${glb}`, (route) => route.fulfill({ status: 404, body: 'Not found' }));
  await failedRequest.goto(`${origin}#thermobreath`);
  await failedRequest.getByRole('button', { name: 'Buka model 3D' }).click();
  await failedRequest.getByText(/Model 3D tidak tersedia/).waitFor();
  assert(await failedRequest.locator('[data-poster]').isVisible());
  assert.deepEqual(failedErrors, []);
  results.http404Fallback = 'PASS';
  await failedRequest.close();

  const staticPage = await open({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  await staticPage.goto(`${origin}#thermobreath`);
  await select(staticPage, 'mos_sensor').click();
  assert(await staticPage.locator('details[data-component="mos_sensor"]').evaluate((element) => element.open));
  assert(await staticPage.locator('[data-poster]').isVisible());
  results.noJavaScript = 'PASS';
  await staticPage.close();
  assert.deepEqual(errors, []);
  results.consoleErrors = errors;
  console.log(JSON.stringify(results, null, 2));
  await writeFile(`${output}-browser-results.json`, JSON.stringify(results, null, 2) + '\n');
} finally {
  await browser.close();
}
