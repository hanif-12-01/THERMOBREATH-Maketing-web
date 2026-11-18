export const site = {
  name: 'Aethera',
  product: 'THERMOBREATH',
  tagline: 'Membaca napas. Membuka kemungkinan.',
  description: 'Aethera mengembangkan THERMOBREATH, konsep E-Nose berbasis AI untuk meneliti pendekatan skrining awal pneumonia melalui pola respons sensor terhadap senyawa dalam napas.',
  origin: '',
  email: '',
  draft: true,
  year: new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric' }).format(new Date()),
};

export const navigation = [
  ['Beranda', 'home'], ['THERMOBREATH', 'thermobreath'], ['Teknologi', 'technology'],
  ['Aplikasi', 'applications'], ['Progres', 'progress'], ['Tim', 'team'], ['Kontak', 'contact'],
];

export const stages = [
  ['Napas', 'Pengambilan sampel', 'Mouthpiece mengarahkan hembusan napas ke jalur sampel yang masih dirancang.', 'wind'],
  ['Sensor', 'Respons sensor', 'Sensor metal oxide semiconductor (MOS) merespons campuran gas. Suhu, kelembapan, dan aliran membantu memberi konteks pada respons.', 'sensor'],
  ['Sinyal', 'Pengolahan sinyal', 'Pipeline riset memeriksa kelengkapan dan mutu sinyal, menyiapkannya, lalu mengekstrak karakteristik seperti perubahan respons.', 'wave'],
  ['AI', 'Analisis pola', 'Metode machine learning seperti XGBoost akan dievaluasi pada data berlabel yang sesuai. Eksperimen yang sudah berjalan memakai data nonpneumonia.', 'chip'],
  ['Informasi', 'Antarmuka digital', 'LCD dan antarmuka IoT dirancang menyajikan informasi pengukuran dan status sistem. Informasi klinis memerlukan evaluasi tersendiri.', 'screen'],
];

export const pillars = [
  ['Sains biomedis', 'Riset napas dimulai dari pertanyaan klinis.', 'Bersama peneliti dan tenaga kesehatan, Aethera ingin memahami bagaimana pengambilan sampel, faktor pengganggu, dan label klinis memengaruhi evaluasi pola napas.', 'lungs'],
  ['Rekayasa & AI', 'Dari respons sensor ke data yang bisa diuji.', 'Pengembangan menggabungkan konsep E-Nose, konteks lingkungan dan aliran, pemeriksaan kualitas sinyal, serta evaluasi model pada data berlabel.', 'chip'],
  ['Bisnis & kemitraan', 'Validasi menentukan jalur adopsi.', 'Kebutuhan institusi, biaya perawatan, dan kelayakan pengadaan akan dievaluasi bersama calon mitra sebelum komersialisasi.', 'network'],
];

export const markets = [
  ['Layanan kesehatan', 'Rumah sakit, klinik, dan puskesmas', 'Menelaah kebutuhan skrining awal, kondisi pengambilan sampel, dan peran teknologi pendukung pada alur layanan.', 'clinic'],
  ['Kesehatan kerja', 'Pertambangan, konstruksi, manufaktur, dan pengelolaan limbah', 'Mengeksplorasi kebutuhan pemantauan pernapasan pekerja pada konteks paparan polutan. Paparan kerja dan pneumonia merupakan konteks risiko yang berbeda.', 'factory'],
  ['Riset & akademik', 'Universitas, laboratorium, dan pusat riset biomedis', 'Mengembangkan protokol, menguji sensor, dan mengevaluasi metode analisis pola respons napas.', 'flask'],
  ['Kesehatan publik', 'Pemerintah dan lembaga kesehatan masyarakat', 'Mengkaji kebutuhan program riset, kelayakan penerapan, dan mekanisme pengadaan bila bukti mendukung.', 'network'],
];

export const milestones = [
  ['Selesai', 'done', 'Fondasi riset', 'Kajian awal E-Nose dan pemetaan kebutuhan sensor dan data telah disusun.'],
  ['Selesai', 'done', 'Pipeline dan eksperimen nonpneumonia', 'Pipeline sinyal dan ekstraksi fitur dikembangkan. S-OH dipakai sebagai benchmark metodologi; Pamplona dan VOC45 dikaji untuk kompatibilitas.'],
  ['Diuji internal', 'tested', 'Antarmuka data prototipe', 'Penerimaan dan validasi format CSV sensor simulasi telah didemonstrasikan di lingkungan riset internal.'],
  ['Menunggu keputusan', 'paused', 'Desain dan integrasi perangkat', 'Konfigurasi sensor dan integrasi software dengan perangkat fisik menunggu keputusan tim biomedis dan hardware.'],
  ['Terhambat', 'blocked', 'Dataset MOS berlabel pneumonia', 'Dataset yang memenuhi kebutuhan pelatihan belum diperoleh. Spesifikasi data dan opsi kolaborasi sedang dikaji.'],
  ['Direncanakan', 'planned', 'Evaluasi klinis', 'Studi bersama institusi berwenang memerlukan protokol, persetujuan etik, data yang sesuai, dan pengujian prospektif.'],
];

export const team = [
  { name: 'Anggota 1' },
  { name: 'Anggota 2' },
  { name: 'Anggota 3' },
  { name: 'Anggota 4' },
  { name: 'Anggota 5' },
  { name: 'Anggota 6' },
];

export const faq = [
  ['Apa itu Aethera?', 'Aethera adalah startup HealthTech yang mempertemukan sains biomedis, rekayasa dan AI, serta pengembangan bisnis untuk riset teknologi kesehatan pernapasan.'],
  ['Apa itu THERMOBREATH?', 'THERMOBREATH adalah konsep perangkat E-Nose portabel dari Aethera untuk meneliti pendekatan skrining awal pneumonia melalui pola respons sensor terhadap senyawa dalam napas.'],
  ['Bagaimana prinsip kerja E-Nose?', 'Sensor gas bereaksi terhadap campuran senyawa dalam sampel. Sistem menganalisis pola respons sensor, dengan suhu, kelembapan, dan aliran sebagai konteks tambahan.'],
  ['Apa peran AI?', 'AI diteliti untuk mengenali pola pada fitur sinyal. XGBoost adalah salah satu metode kandidat. Evaluasinya membutuhkan data berlabel yang sesuai dengan pertanyaan riset.'],
  ['Apakah THERMOBREATH sudah bisa mendeteksi pneumonia?', 'Kemampuan mendeteksi pneumonia belum terbukti. Model pneumonia belum tervalidasi secara klinis dan keputusan medis tetap memerlukan pemeriksaan dari tenaga kesehatan.'],
  ['Apa perbedaan situs ini dan dashboard penelitian?', 'Situs ini memperkenalkan Aethera dan progres THERMOBREATH. Dashboard internal digunakan tim untuk meninjau eksperimen serta mutu data sensor.'],
  ['Siapa calon pengguna THERMOBREATH?', 'Segmen yang sedang dievaluasi mencakup institusi layanan kesehatan, kesehatan kerja, lembaga riset, serta kesehatan publik.'],
  ['Bagaimana cara berkolaborasi?', site.email ? 'Lihat bagian kolaborasi untuk menghubungi tim Aethera melalui email resmi.' : 'Lihat bagian kolaborasi untuk topik kemitraan yang sedang dijajaki. Kanal resmi sedang disiapkan.'],
];
