import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const [modulePath, chromePath, origin = 'http://127.0.0.1:4173/', output = 'lighthouse'] = process.argv.slice(2);
if (!modulePath || !chromePath) throw new Error('Pass the installed DevTools MCP third_party/index.js path and Chrome executable path');
const { puppeteer, generateReport } = await import(pathToFileURL(modulePath).href);
const browser = await puppeteer.launch({ headless: true, executablePath: chromePath });
const results = [];
try {
  // Use Chrome's complete Lighthouse worker. The MCP's smaller audit bundle
  // filters out the FCP, LCP, and TBT audits.
  const devtools = await browser.newPage();
  await devtools.goto('devtools://devtools/bundled/inspector.html');
  const [bundle, entitiesModule] = await devtools.evaluate(() => Promise.all([
    'third_party/lighthouse/lighthouse-dt-bundle.js',
    'third_party/third-party-web/third-party-web.js',
  ].map(async (file) => {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Chrome resource unavailable: ${file}`);
    return response.text();
  })));
  await devtools.close();
  const originalBuffer = globalThis.Buffer;
  globalThis.self = globalThis;
  globalThis.isVinn = true;
  globalThis.document = { documentElement: { style: { WebkitAppearance: 'WebkitAppearance' } } };
  new Function(bundle)();
  globalThis.Buffer = originalBuffer;
  const entitiesSource = Buffer.from(entitiesModule).toString('base64');
  const { ThirdPartyWeb } = await import(`data:text/javascript;base64,${entitiesSource}`);
  globalThis.thirdPartyWeb.provideThirdPartyWeb(ThirdPartyWeb);
  const run = globalThis.navigation;
  if (typeof run !== 'function') throw new Error('Lighthouse navigation runner unavailable');

  for (const device of ['mobile', 'desktop']) {
    const page = await browser.newPage();
    await page.goto(origin);
    const flags = {
      formFactor: device,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      ...(device === 'desktop' && {
        screenEmulation: { mobile: false, width: 1440, height: 1000, deviceScaleFactor: 1, disabled: false },
        throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 },
      }),
    };
    const config = { extends: 'lighthouse:default' };
    const { lhr } = await run(page, origin, { flags, config });
    if (lhr.audits['largest-contentful-paint']?.numericValue === undefined) {
      throw new Error('Full Lighthouse performance metrics unavailable');
    }
    await writeFile(`docs/qa/${output}-${device}.html`, await generateReport(lhr, 'html'));
    results.push({
      device,
      version: lhr.lighthouseVersion,
      scores: Object.fromEntries(Object.entries(lhr.categories).map(([name, category]) => [name, Math.round(category.score * 100)])),
      fcp: lhr.audits['first-contentful-paint']?.displayValue,
      lcp: lhr.audits['largest-contentful-paint']?.displayValue,
      cls: lhr.audits['cumulative-layout-shift']?.displayValue,
      tbt: lhr.audits['total-blocking-time']?.displayValue,
      warnings: lhr.runWarnings,
      failingAccessibility: lhr.categories.accessibility.auditRefs
        .map(({id}) => lhr.audits[id]).filter((audit) => audit.score === 0)
        .map(({id, title, details}) => ({ id, title, items: details?.items })),
    });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await writeFile(`docs/qa/${output}-results.json`, JSON.stringify(results, null, 2) + '\n');
} finally {
  await browser.close();
}
