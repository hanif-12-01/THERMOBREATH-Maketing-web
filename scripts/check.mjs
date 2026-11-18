import assert from 'node:assert/strict';
import { access, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/page.mjs';
import { model, parts, views } from '../src/product.mjs';
import { site } from '../src/content.mjs';

for (const dir of ['src', 'scripts']) {
  const location = new URL(`../${dir}/`, import.meta.url);
  for (const file of (await readdir(location)).filter((name) => name.endsWith('.mjs'))) {
    const path = fileURLToPath(new URL(file, location));
    const check = spawnSync(process.execPath, ['--check', path], { stdio: 'inherit' });
    assert.equal(check.status, 0, `${file} failed syntax validation`);
  }
}

const page = renderPage();
const ids = [...page.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const [, ref] of page.matchAll(/(?:href="#|aria-controls=")([^"]+)"/g)) {
  assert(ids.includes(ref), `Unresolved internal link or control: ${ref}`);
}
assert.equal((page.match(/<h1\b/g) || []).length, 1);
assert(page.includes('SIMULASI — BUKAN HASIL DIAGNOSIS MEDIS.'));
assert(!/akurasi deteksi|terbukti mendeteksi|Pneumonia \d+%/i.test(page));
assert(!site.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.email));
assert.equal(parts.length, 7);
for (const { image } of views) await access(new URL(image, new URL('../public/', import.meta.url)));
for (const file of [model.path, model.runtime, 'fonts/manrope.woff2', 'favicon.svg', 'images/social.webp']) {
  if (file) await access(new URL(file, new URL('../public/', import.meta.url)));
}
console.log('Lint, sintaks modul, dan pemeriksaan konten/aset lulus.');
