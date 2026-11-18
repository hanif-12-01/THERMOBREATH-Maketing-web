import assembly from './assembly.json' with { type: 'json' };

export const model = {
  path: './models/thermobreath-exploded.glb',
  label: 'Model desain konseptual THERMOBREATH',
  runtime: './vendor/model-viewer.min.js',
  animation: assembly.animation,
  bounds: assembly.bounds,
};

export const views = [
  { id: 'front', label: 'Depan', orbit: '-22deg 76deg auto', image: './images/product/thermobreath-poster.webp', alt: 'Konsep THERMOBREATH dengan casing putih, LCD gelap, tombol biru, dan mouthpiece tembus cahaya' },
  { id: 'side', label: 'Samping', orbit: '-75deg 82deg auto', image: './images/product/thermobreath-side.webp', alt: 'Konsep sisi THERMOBREATH dengan ventilasi di bawah mouthpiece' },
  { id: 'rear', label: 'Belakang', orbit: '160deg 78deg auto', image: './images/product/thermobreath-rear.webp', alt: 'Konsep belakang THERMOBREATH dengan grip biru dan garis panel' },
];

export const parts = [
  {
    id: 'mouthpiece', name: 'Mouthpiece', label: 'Detail eksterior', marker: [24, 39], orbit: [-40, 77],
    text: 'Corong transparan mengarahkan napas ke jalur sampel.',
    role: 'Menghubungkan hembusan napas ke bagian pengambilan sampel. Geometri dan prosedur penggunaan masih perlu diuji.',
  },
  {
    id: 'mos_sensor', name: 'Sistem sensor MOS', label: 'Rancangan internal', orbit: [177, 76],
    text: 'Sensor MOS menghasilkan respons listrik terhadap campuran gas, termasuk senyawa organik volatil (VOC).',
    role: 'Respons menjadi masukan pengolahan sinyal dan ekstraksi fitur. Konfigurasi sensor menunggu keputusan Biomed.',
  },
  {
    id: 'temperature_humidity', name: 'Suhu & kelembapan', label: 'Rancangan internal', orbit: [171, 73],
    text: 'Sensor menggambarkan kondisi suhu dan kelembapan saat pengambilan sampel.',
    role: 'Kondisi ini memberi konteks untuk mengevaluasi variasi respons sensor gas dan kualitas sampel.',
  },
  {
    id: 'flow_sensor', name: 'Sensor aliran', label: 'Rancangan internal', orbit: [172, 78],
    text: 'Mengukur laju aliran di jalur sampel.',
    role: 'Informasi laju alir mendukung penilaian konsistensi pengambilan sampel. Penempatan masih konseptual.',
  },
  {
    id: 'microcontroller', name: 'Mikrokontroler', label: 'Rancangan internal', orbit: [187, 77],
    text: 'Pada rancangan sistem, pengendali mengumpulkan pembacaan sensor.',
    role: 'Pemilihan board serta pembagian proses pengolahan dan komunikasi data masih dievaluasi.',
  },
  {
    id: 'lcd_assembly', name: 'Layar LCD', label: 'Detail eksterior', marker: [63, 41], orbit: [18, 82],
    text: 'Layar depan dirancang untuk menampilkan informasi pengukuran dan status perangkat.',
    role: 'Gambar pada layar mengilustrasikan bentuk sinyal dari data simulasi.',
  },
  {
    id: 'power_assembly', name: 'Sistem daya', label: 'Rancangan internal', orbit: [167, 90],
    text: 'Opsi daya portabel untuk sensor dan elektronik masih dipertimbangkan.',
    role: 'Kapasitas, rangkaian, dan pengisian akan ditetapkan setelah kebutuhan prototipe jelas.',
  },
].map((part) => ({ ...part, ...assembly.groups[part.id], internal: !part.marker }));
