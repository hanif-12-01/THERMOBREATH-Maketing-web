import { site, navigation, stages, pillars, markets, milestones, team, faq } from './content.mjs';
import { model, views, parts } from './product.mjs';
import { renderBreath } from './breath.mjs';
import benchmark from '../public/research/soh-baseline.json' with { type: 'json' };

const paths = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  diagonal: '<path d="M6 18 18 6M8 6h10v10"/>',
  lungs: '<path d="M12 3v8m0 0-4 4m4-4 4 4M9 7C6 4 3 9 2 15c-1 5 1 7 5 6 2 0 3-1 3-3V9m5-2c3-3 6 2 7 8 1 5-1 7-5 6-2 0-3-1-3-3V9"/>',
  wind: '<path d="M3 8h12a2 2 0 1 0-2-2M2 12h17a2 2 0 1 0-2-2M4 16h10a2 2 0 1 1-2 2"/>',
  sensor: '<circle cx="12" cy="12" r="9"/><path d="M7 12h2l2-4 2 8 2-4h2"/>',
  wave: '<path d="M2 12h5l3-7 4 14 3-7h5"/>',
  chip: '<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/><rect x="9" y="9" width="6" height="6" rx="1"/>',
  network: '<circle cx="12" cy="5" r="3"/><circle cx="5" cy="18" r="3"/><circle cx="19" cy="18" r="3"/><path d="m10 8-4 7m8-7 4 7M8 18h8"/>',
  screen: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M7 21h10m-5-4v4M6 11h3l2-3 2 5 2-2h3"/>',
  clinic: '<path d="M4 22V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v17M2 22h20M12 6v6M9 9h6m-6 13v-6h6v6"/>',
  factory: '<path d="M2 22V10l7 4V9l7 5 2-11h3l1 19ZM5 18h2m4 0h2m4 0h2"/>',
  flask: '<path d="M8 3h8m-6 0v7L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-9V3M8 15h8"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10L3 7m9 5 9-5m-9 5v10"/>',
  person: '<circle cx="12" cy="8" r="3.2"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
};
const icon = (name, extra = '') => `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
const eyebrow = (text) => `<p class="eyebrow">${text}</p>`;
const image = ({ image, alt }, attrs = '') => `<img src="${image}" alt="${alt}" width="1000" height="1000" ${attrs}>`;
const title = (label, id, headline, description = '') => `<header class="section-title">${eyebrow(label)}<h2 id="${id}">${headline}</h2>${description ? `<p class="intro">${description}</p>` : ''}</header>`;
const productWord = '<span class="product-word">THERMO<span>BREATH</span></span>';
const brand = `<a href="#home" class="brand" aria-label="Aethera, beranda"><span class="brand-mark">${icon('wind')}</span>Aethera<span class="brand-dot">.</span></a>`;
const link = (text, anchor, style = '') => `<a class="button ${style}" href="${anchor}">${text}${icon('arrow')}</a>`;
const disclosure = 'SIMULASI — BUKAN HASIL DIAGNOSIS MEDIS.';
const indexLabel = (index) => String(index + 1).padStart(2, '0');

const air = `<svg class="airlines" viewBox="0 0 700 470" fill="none" preserveAspectRatio="none" aria-hidden="true">
  ${Array.from({ length: 12 }, (_, i) => `<path d="M-25 ${255 + i * 11} C175 ${310 + i * 7} 230 ${118 + i * 12} 405 ${168 + i * 9} S560 ${299 + i * 6} 730 ${113 + i * 19}"/>`).join('')}
</svg>`;

const trace = `<svg viewBox="0 0 420 126" preserveAspectRatio="none" class="trace" aria-hidden="true"><path d="M0 92C40 94 55 97 73 89S104 70 114 78 141 108 159 83 182 13 202 28 213 93 235 82 266 18 281 36 316 103 341 79 369 62 383 70 402 85 420 69"/><path d="M0 99C49 104 73 110 110 91S146 71 177 92 212 94 236 61 274 68 307 83 351 97 374 84 396 78 420 83"/></svg>`;

function renderBenchmark() {
  const percent = new Intl.NumberFormat('id-ID', { style: 'percent', minimumFractionDigits: 2 });
  const count = new Intl.NumberFormat('id-ID').format(benchmark.samples);
  const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(benchmark.evaluationDate));
  return `<details class="benchmark">
    <summary>${icon('wave')}<span>Lihat hasil eksperimen AI</span><span class="plus" aria-hidden="true"></span></summary>
    <div class="benchmark-body">
      <header>
        <h3>Eksperimen awal machine learning</h3>
        <p class="benchmark-label">Benchmark S-OH — ${benchmark.classes} Kategori — Bukan Evaluasi Pneumonia.</p>
        <p>Perbandingan tiga metode klasifikasi sinyal pada dataset E-Nose publik. S-OH tidak memuat label pneumonia.</p>
      </header>
      <figure class="benchmark-chart">
        <figcaption>Accuracy <span>· Persentase prediksi kategori yang tepat</span></figcaption>
        <ul>${benchmark.models.map(({ name, accuracy }) => `<li>
          <div><span>${name}</span><strong>${percent.format(accuracy)}</strong></div>
          <span class="benchmark-meter" aria-hidden="true"><span style="width:${accuracy * 100}%"></span></span>
        </li>`).join('')}</ul>
        <div class="benchmark-scale" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div>
      </figure>
      <div class="benchmark-notes">
        <p>${count} sampel · Validasi silang ${benchmark.folds} lipatan berstrata dengan pengacakan · Baseline ${date}. Skor dihitung dari prediksi pada lipatan yang ditahan saat pelatihan.</p>
        <div class="benchmark-sources"><a href="./research/soh-baseline.json">Data evaluasi ${benchmark.experiment} (JSON)</a><a href="${benchmark.datasetUrl}">Kartu dataset S-OH ${icon('diagonal')}</a></div>
      </div>
    </div>
  </details>`;
}

export function renderPage() {
  const social = site.origin ? new URL('/images/social.webp', site.origin).href : './images/social.webp';
  const menu = navigation.map(([label, id]) => `<a href="#${id}">${label}</a>`).join('');
  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="theme-color" content="#edf6ff">
  <title>Aethera — THERMOBREATH | Riset Teknologi Napas</title>
  <meta name="description" content="${site.description}">
  <meta name="robots" content="${site.draft ? 'noindex, nofollow' : 'index, follow'}">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="id_ID">
  <meta property="og:title" content="Aethera — ${site.tagline}">
  <meta property="og:description" content="${site.description}">
  <meta property="og:image" content="${social}">
  <meta property="og:image:alt" content="Aethera dan visual konsep THERMOBREATH">
  ${site.origin ? `<link rel="canonical" href="${site.origin}"><meta property="og:url" content="${site.origin}">` : ''}
  <link rel="icon" href="./favicon.svg" type="image/svg+xml">
  <link rel="preload" href="./fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="./assets/site.css">
  <noscript><style>@media (max-width: 895px) { .navigation { display: flex; position: static; flex-wrap: wrap; padding: 0; box-shadow: none; border: 0; } }</style></noscript>
  <script type="module" src="./assets/site.mjs"></script>
  <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'Organization', name: site.name, ...(site.origin && { url: site.origin }) })}</script>
</head>
<body>
  <a class="skip" href="#main">Lompat ke konten</a>
  <header class="topbar">
    <div class="shell nav-layout">
      ${brand}
      <button type="button" class="menu-toggle" data-menu aria-controls="navigation" aria-expanded="false" hidden>${icon('menu')}<span>Menu</span></button>
      <nav id="navigation" class="navigation" aria-label="Navigasi utama">${menu}</nav>
      ${link('Kemitraan', '#contact', 'nav-cta')}
    </div>
  </header>
  <main id="main">
    <section class="hero" id="home" aria-labelledby="hero-title">
      <div class="shell hero-layout">
        <div class="hero-copy">
          ${eyebrow('Inovasi teknologi kesehatan')}
          <h1 id="hero-title">Membaca napas.<br><em>Membuka kemungkinan.</em></h1>
          <div class="hero-info">
            <p>Aethera memperkenalkan <strong>THERMOBREATH</strong>, konsep E-Nose berbasis AI untuk meneliti pendekatan skrining awal pneumonia melalui pola respons sensor terhadap senyawa dalam napas.</p>
            <div class="actions">${link('Jelajahi THERMOBREATH', '#thermobreath')}${link('Diskusikan kolaborasi', '#contact', 'secondary')}</div>
          </div>
        </div>
        <figure class="breath-figure" data-breath>
          <div class="breath-stations" aria-hidden="true">
            <span>Napas</span><span>Sensor</span><span>Sinyal</span>
          </div>
          <div class="breath-stage" data-breath-stage>
            ${renderBreath()}
            <button class="breath-trigger" type="button" aria-pressed="false" aria-controls="breath-art" aria-describedby="breath-caption" hidden>
              <span>${icon('wave')} <span>Ubah napas jadi sinyal</span></span>
            </button>
          </div>
          <figcaption id="breath-caption">Visualisasi konseptual napas, sensor, dan sinyal.</figcaption>
          <span class="visually-hidden" data-breath-status role="status"></span>
        </figure>
      </div>
    </section>

    <div class="discipline-rail"><div class="shell rail-layout">${pillars.map(([name, , , symbol]) => `<a href="#pillars">${icon(symbol)}<span>${name}</span>${icon('diagonal', 'rail-arrow')}</a>`).join('')}</div></div>

    <section class="shell section problem" aria-labelledby="problem-title">
      <div>${title('Tantangan', 'problem-title', 'Sinyal napas layak diteliti.')}
        <p class="intro">Evaluasi pneumonia memerlukan penilaian klinis dan, bila diperlukan, pemeriksaan lanjutan. Aethera meneliti apakah pola respons terhadap senyawa dalam napas dapat mendukung pendekatan skrining awal yang lebih praktis.</p>
        <p>Kebutuhan kesehatan pernapasan juga relevan bagi pekerja yang terpapar debu dan polutan. Pemantauan paparan kerja dan penelitian skrining pneumonia memiliki tujuan evaluasi yang berbeda.</p>
        <a class="text-link" href="https://www.who.int/news-room/fact-sheets/detail/pneumonia">Latar belakang pneumonia dari WHO ${icon('diagonal')}</a>
      </div>
      <div class="lung-figure" aria-hidden="true">
        ${air}<div class="lung-ring"></div>${icon('lungs', 'lung-mark')}<div class="sample-line"></div>
      </div>
    </section>

    <section class="tinted section" id="thermobreath" aria-labelledby="product-title">
      <div class="shell">
        ${title('Perangkat unggulan Aethera', 'product-title', productWord, 'Jelajahi rancangan THERMOBREATH secara interaktif. Putar perangkat, lihat susunan konseptual komponennya, dan pahami bagaimana setiap bagian mendukung sistem E-Nose.')}
        <p class="architecture-note" id="explorer-note">Conceptual Product Architecture — Hardware Configuration Under Development.</p>
        <div class="explorer" data-explorer data-model="${model.path}" data-runtime="${model.runtime}" data-model-label="${model.label}" data-animation="${model.animation}" data-bounds='${JSON.stringify(model.bounds)}' aria-describedby="explorer-note">
          <div class="stage">
            <div class="panel-top"><h3>Explore Inside THERMOBREATH</h3><span class="viewer-mode" data-mode-label>Perangkat utuh</span></div>
            <div class="viewport" id="product-viewport">
              <div class="viewport-grid" aria-hidden="true"></div>
              <div class="assembly-axis" aria-hidden="true"></div>
              ${image(views[0], 'class="poster" data-poster loading="lazy"')}
              <div class="poster-markers" data-markers hidden>
                ${parts.map((part, i) => part.marker ? `<button class="marker" type="button" style="--x:${part.marker[0]}%;--y:${part.marker[1]}%" data-marker="${i}" aria-label="${i + 1}. ${part.name}">${i + 1}</button>` : '').join('')}
              </div>
            </div>
            <div class="explorer-controls" data-controls hidden>
              <div class="viewbar">
                <div class="view-options" role="group" aria-label="Sudut perangkat">
                  ${views.map(({ id, label, orbit, image: source, alt }, i) => `<button type="button" data-view="${id}" data-orbit="${orbit}" data-image="${source}" data-alt="${alt}" aria-pressed="${i === 0}" aria-controls="product-viewport">${label}</button>`).join('')}
                </div>
                <button type="button" class="load-model" data-load aria-controls="product-viewport">${icon('cube')}<span>Buka model 3D</span></button>
                <div class="camera-tools" data-camera-tools hidden>
                  <div class="zoom-controls" role="group" aria-label="Zoom perangkat">
                    <button type="button" data-zoom="out" aria-label="Perkecil model">−</button>
                    <button type="button" data-zoom="in" aria-label="Perbesar model">+</button>
                  </div>
                  <button type="button" class="small-control" data-reset>Reset Kamera</button>
                </div>
              </div>
              <div class="assembly-controls" data-assembly-controls hidden>
                <div class="assembly-buttons">
                  <button type="button" class="load-model" data-explode aria-controls="product-viewport">${icon('cube')}<span>Bongkar Perangkat</span></button>
                  <button type="button" class="small-control" data-assembled disabled>Perangkat Utuh</button>
                  <button type="button" class="small-control" data-overview hidden>Lihat susunan</button>
                </div>
                <div class="scrubber">
                  <label for="explosion-progress">Tingkat Pembongkaran</label><span data-progress-label aria-hidden="true">0%</span>
                  <input type="range" id="explosion-progress" min="0" max="100" value="0" step="1" aria-valuetext="0 persen">
                </div>
              </div>
              <p class="viewer-status" data-viewer-status role="status"></p>
            </div>
          </div>
          <div class="components">
            <div class="panel-top"><h3>Komponen utama</h3></div>
            <div class="component-list">
              ${parts.map(({ id, name, label, text, role, anchor, normal, offset, window, orbit, internal }, i) => `<details class="part" data-part="${i}" data-component="${id}" data-geometry='${JSON.stringify({ anchor, normal, offset, window, orbit, internal })}' name="parts">
                <summary><span class="part-number" aria-hidden="true">${i + 1}</span><span>${name}</span><span class="plus" aria-hidden="true"></span></summary>
                <div class="part-copy"><span>${label}</span><p>${text}</p><p>${role}</p></div>
              </details>`).join('')}
            </div>
            <p class="panel-note">Visualisasi internal bersifat ilustratif. Konfigurasi hardware masih dalam pengembangan.</p>
          </div>
        </div>
        <div class="device-notes">
          <div>${icon('cube')}<div><h3>Casing &amp; ergonomi</h3><p>Bentuk genggam untuk dievaluasi pada prototipe fisik.</p></div></div>
          <div>${icon('wind')}<div><h3>Ventilasi</h3><p>Area ventilasi eksterior untuk rancangan sirkulasi perangkat.</p></div></div>
          <div>${icon('sensor')}<div><h3>Tombol operasi</h3><p>Kontrol fisik untuk mengawali pengambilan sampel.</p></div></div>
        </div>
      </div>
    </section>

    <section class="section shell" id="technology" aria-labelledby="tech-title">
      ${title('Teknologi & sains', 'tech-title', 'Dari napas ke informasi.', 'Lima tahap menjelaskan rancangan THERMOBREATH dan pekerjaan riset di baliknya.')}
      <div class="flow" data-flow>
        <div class="flow-controls" data-flow-controls role="group" aria-label="Tahap cara kerja" hidden>${stages.map(([label, , , symbol], i) => `<button class="flow-step" type="button" data-step="${i}" aria-controls="step-${i}" aria-pressed="${i === 0}"><span class="flow-symbol">${icon(symbol)}</span><span>${label}</span></button>`).join('')}</div>
        <div class="flow-display">
          <div>${stages.map(([, name, text], i) => `<article id="step-${i}" class="flow-detail" data-step-content><p class="eyebrow">Tahap ${indexLabel(i)} / 05</p><h3>${name}</h3><p>${text}</p></article>`).join('')}</div>
          <div class="trace-panel" aria-hidden="true">${trace}</div>
        </div>
      </div>
      <div class="science-grid">
        <article class="info-panel"><h3>Alur sistem</h3><p class="architecture">Napas <span>→</span> MOS / suhu / kelembapan / aliran <span>→</span> Pengolahan sinyal <span>→</span> Ekstraksi fitur <span>→</span> Riset AI <span>→</span> Antarmuka digital</p><p>Respons MOS dipengaruhi campuran gas dan kondisi sampel. Data berlabel yang sesuai diperlukan untuk mengevaluasi keterkaitan pola dengan kondisi klinis.</p><a href="#progress" class="text-link">Lihat status riset ${icon('arrow')}</a></article>
        <article class="info-panel signal-ui"><h3>Tampilan LCD &amp; pemantauan</h3><div class="screen-demo"><span>THERMOBREATH / DATA SENSOR</span>${trace}<span>Contoh visualisasi sinyal</span></div><p><strong>Concept UI — Simulated Data — Not for Clinical Use.</strong> ${disclosure}</p></article>
      </div>
      ${renderBenchmark()}
    </section>

    <section class="section dark" id="pillars" aria-labelledby="pillars-title">
      <div class="shell">
        ${title('Aethera', 'pillars-title', 'Tiga disiplin, satu visi.', 'Membangun teknologi kesehatan pernapasan yang dapat diuji dan dikembangkan bersama.')}
        <div class="pillars">${pillars.map(([name, line, detail, symbol]) => `<article>${icon(symbol)}<h3>${name}</h3><p>${line}</p><details><summary>Pelajari lebih lanjut<span class="plus" aria-hidden="true"></span></summary><p>${detail}</p></details></article>`).join('')}</div>
      </div>
    </section>

    <section class="section shell" id="applications" aria-labelledby="market-title">
      ${title('Aplikasi potensial', 'market-title', 'Dari riset ke kebutuhan institusi.', 'Empat segmen menjadi fokus eksplorasi kebutuhan, studi kelayakan, dan kemitraan pengembangan.')}
      <div class="markets">${markets.map(([name, examples, detail, symbol]) => `<details name="markets"><summary><span class="market-icon">${icon(symbol)}</span><span><strong>${name}</strong><span>${examples}</span></span><span class="plus" aria-hidden="true"></span></summary><p>${detail}</p></details>`).join('')}</div>
      <div class="investor panel">
        <div>${eyebrow('Peluang kemitraan')}<h3>Adopsi dimulai dari validasi.</h3><p>Pendekatan Aethera menggabungkan respons sensor gas dengan konteks sampel. Nilai bagi institusi akan diuji melalui prototipe, evaluasi data, dan studi bersama calon mitra.</p></div>
        <div><h4>Opsi bisnis yang dievaluasi</h4><ul><li><strong>B2B</strong> — pengadaan perangkat dan dukungan institusi.</li><li><strong>B2G</strong> — program pengembangan atau jalur pengadaan publik.</li><li><strong>B2A</strong> — kolaborasi akademik dan evaluasi metode.</li></ul><p>Hambatan utama meliputi akses data klinis, pemilihan hardware, dan pembuktian kelayakan di alur kerja institusi.</p></div>
      </div>
    </section>

    <section class="section tinted" id="progress" aria-labelledby="progress-title">
      <div class="shell roadmap">
        <div>${title('Riset & pengembangan', 'progress-title', 'Progres yang dapat ditelusuri.', 'Fondasi software sudah diuji secara internal. Akses data dan integrasi perangkat membuka tahap evaluasi selanjutnya.')}</div>
        <ol class="timeline">${milestones.map(([status, kind, name, text]) => `<li><span class="state ${kind}">${status}</span><h3>${name}</h3><p>${text}</p></li>`).join('')}</ol>
      </div>
    </section>

    <section class="section shell" id="team" aria-labelledby="team-title">
      ${title('Tim', 'team-title', 'Orang di balik gagasan.', site.draft ? 'Profil tim akan ditampilkan setelah nama, peran, dan foto disetujui untuk publikasi.' : 'Tim pengembangan Aethera dan THERMOBREATH.')}
      <div class="team-grid">${team.map(({ name, role, photo, contribution, bio }, i) => `<article class="person"><div class="portrait">${photo ? `<img src="${photo}" alt="Potret ${name}" loading="lazy" width="240" height="240">` : icon('person')}</div><h3>${site.draft || role ? name : `Anggota ${i + 1}`}</h3><p>${role || 'Peran menunggu konfirmasi'}${contribution ? ` · ${contribution}` : ''}</p>${bio ? `<p>${bio}</p>` : ''}</article>`).join('')}</div>
    </section>

    <section class="section tinted" id="faq" aria-labelledby="faq-title">
      <div class="shell faq-layout">${title('FAQ', 'faq-title', 'Pertanyaan umum.')}
        <div class="faq-list">${faq.map(([question, answer]) => `<details name="faq"><summary>${question}<span class="plus" aria-hidden="true"></span></summary><p>${answer}</p></details>`).join('')}</div>
      </div>
    </section>

    <section class="section contact dark" id="contact" aria-labelledby="contact-title">
      <div class="shell contact-layout">
        <div>${title('Kemitraan', 'contact-title', 'Mari kembangkan riset napas bersama.', 'Aethera terbuka untuk dialog seputar studi biomedis, prototipe, rekayasa sensor, dan evaluasi peluang penerapan.')}</div>
        <div class="contact-action">${site.email ? `${link('Hubungi tim Aethera', `mailto:${site.email}`)}${link('Minta ringkasan proyek', `mailto:${site.email}?subject=Ringkasan%20proyek%20THERMOBREATH`, 'secondary')}` : `<p class="contact-status"><span></span>Kanal kontak resmi sedang disiapkan</p>${link('Lihat progres pengembangan', '#progress', 'secondary')}`}</div>
      </div>
    </section>
  </main>
  <footer class="footer">
    <div class="shell">
      <div class="footer-main"><div>${brand}<p>Riset napas dan teknologi kesehatan.<br>Produk unggulan ${productWord}.</p>${site.email ? `<a href="mailto:${site.email}">${site.email}</a>` : ''}</div><nav aria-label="Navigasi footer">${menu}</nav></div>
      <details id="privacy"><summary>Privasi <span class="plus" aria-hidden="true"></span></summary><p>Situs ini menyajikan informasi proyek tanpa formulir, analitik, atau pengumpulan data kesehatan. Tautan eksternal mengikuti kebijakan situs tujuan.</p></details>
      <div class="footer-base"><p>© ${site.year} Aethera</p><p>THERMOBREATH masih dalam tahap riset dan belum tervalidasi untuk penggunaan klinis.</p></div>
    </div>
  </footer>
</body>
</html>`;
}
