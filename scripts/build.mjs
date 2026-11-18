import { cp, mkdir, writeFile } from 'node:fs/promises';
import { site } from '../src/content.mjs';
import { renderPage } from '../src/page.mjs';

const root = new URL('../', import.meta.url);
const target = new URL('dist/', root);
await mkdir(new URL('assets/', target), { recursive: true });
await cp(new URL('public/', root), target, { recursive: true });

for (const file of ['site.css', 'site.mjs', 'breath.mjs', 'explorer.mjs', 'explosion.mjs']) {
  await cp(new URL(`src/${file}`, root), new URL(`assets/${file}`, target));
}

if (!site.draft && !site.origin) throw new Error('Set an approved canonical origin before enabling indexing.');
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
  (site.origin && !site.draft ? `<url><loc>${new URL('/', site.origin).href.replaceAll('&', '&amp;')}</loc></url>` : '') +
  '</urlset>\n';
const robots = `User-agent: *\nDisallow:${site.draft ? ' /' : ''}\n` +
  (site.origin && !site.draft ? `Sitemap: ${new URL('/sitemap.xml', site.origin).href}\n` : '');
await Promise.all([
  writeFile(new URL('index.html', target), renderPage()),
  writeFile(new URL('sitemap.xml', target), sitemap),
  writeFile(new URL('robots.txt', target), robots),
]);
console.log('Build statis selesai di dist/.');
