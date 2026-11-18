# Blender ke web · THERMOBREATH

Model konsep web adalah turunan dari `Asset Blender/objek 3d alat.blend` dengan referensi visual infografis. Aset kerja yang bisa diedit ada di `THERMOBREATH_Konsep_Infografis.blend` pada folder ini. Tekstur LCD dikemas di file tersebut. Render memakai respons sensor contoh berlabel simulasi.

## Kontrak aset

| Aspek | Kontrak |
|---|---|
| Sumber yang bisa diedit | `docs/3d/THERMOBREATH_Konsep_Infografis.blend` |
| Aset tayang | `public/models/thermobreath-concept.glb` |
| Model pengganti | `public/models/thermobreath.glb` atau GLTF dengan seluruh buffer dan tekstur relatif disertakan |
| Poster | `public/images/product/thermobreath-poster.webp`, 1000 × 1000, transparan. Samping dan belakang disimpan terpisah. |
| Material | PBR Principled. Putih satin, panel/kerah/tombol biru, bezel gelap, layar navy dan corong bening. Panggang material prosedural jika dipakai. |
| Axis & origin | Meter, Blender +Z ke atas dan depan menghadap −Y. Ekspor glTF Y-up, depan +Z. Origin di sekitar pusat casing. Arah sumbu hotspot mengikuti glTF. |
| Kamera | Front `-22deg 76deg auto`; side `-75deg 82deg auto`; rear `160deg 78deg auto`. Sumbu foto diselaraskan melalui render Blender. |
| Anchor eksterior | `src/product.mjs`, posisi dan normal absolut GLTF pada dua titik aktual, mouthpiece dan LCD. Internal masih dijelaskan lewat daftar DOM. Kalibrasi ulang ketika geometri berubah. |
| Tampilan terurai | Siapkan mesh/part bernama dan origin konsisten, serta animasi GLTF atau model kedua dan poster. Gunakan label “Susunan konseptual” sampai tata letak hardware ditetapkan. Uji reset dan navigasi keyboard. |
| Anggaran | Model konsep di bawah 1 MB. Target GLB final ≤2 MB, poster ≤180 KB. Ukur waktu decode dan waktu tampil pada laptop dan ponsel. |

## Pipeline

1. **Blender** · Kerjakan salinan. Pertahankan komponen bernama dan buang objek studio, alternatif tersembunyi, geometri bertumpuk, serta material tak terpakai dari seleksi ekspor.
2. **GLB Export** · Pilih objek produk, terapkan modifier yang dibutuhkan saat ekspor, aktifkan +Y Up, dan ekspor GLB dengan material serta tekstur terkandung. Uji material transparan, khususnya corong.
3. **Optimization** · Batasi tekstur, hilangkan material duplikat, dan sederhanakan mesh yang tak terlihat. Mulai tanpa Draco atau KTX2 agar viewer tidak perlu decoder tambahan. Gunakan kompresi hanya bila penghematan dan dukungan browser terukur, dengan decoder lokal jika diperlukan.
4. **Website Integration** · Ganti `model.path` dan entri `views` pada `src/product.mjs`, lalu kalibrasi `parts[].position` dan `normal`. Viewer dimuat saat diklik. Tiga poster dan semua detail komponen tetap dapat dipakai tanpa WebGL.
5. **Browser Testing** · Build, buka localhost, uji orbit dengan drag/touch, tiga preset dan fokus hotspot. Matikan WebGL untuk menguji poster dan periksa modul/GLB belum diminta saat halaman pertama dimuat. Uji perspektif lokal, uji ponsel nyata, dan cek texture transmission.

## Regenerasi aset draf ini

Jalankan `scripts/make_lcd.py` dengan Python/Pillow. Gunakan Blender 5.3 dalam mode background, buka sumber asli dengan `--disable-autoexec`, jalankan `scripts/export_concept.py`, dan berikan path absolut workspace web sesudah `--`. Jalankan `scripts/prepare_images.py` untuk WebP dan gambar sosial. Aset turunan hanya ditulis di workspace web.
