export type WeekDay = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat";
export const WEEK_DAYS: WeekDay[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export function todayWeekDay(d: Date = new Date()): WeekDay | null {
  // 1=Mon ... 5=Fri
  const idx = d.getDay();
  if (idx >= 1 && idx <= 5) return WEEK_DAYS[idx - 1];
  return null;
}

export type Student = {
  id: string;
  name: string;
  className: string;
  parentWa: string;
  /** Hari jadwal penilaian rutin (Senin–Jumat). */
  day: WeekDay;
};

export const STUDENTS: Student[] = [
  { id: "s1", name: "Ahmad Fauzan", className: "TK B1", parentWa: "6282142124899", day: "Senin" },
  { id: "s2", name: "Aisyah Putri", className: "TK B1", parentWa: "6282142124899", day: "Senin" },
  { id: "s3", name: "Bima Pratama", className: "TK B1", parentWa: "6282142124899", day: "Selasa" },
  { id: "s4", name: "Citra Lestari", className: "TK B1", parentWa: "6282142124899", day: "Rabu" },
  { id: "s5", name: "Daffa Hakim", className: "TK A2", parentWa: "6282142124899", day: "Rabu" },
  { id: "s6", name: "Elsa Maharani", className: "TK A2", parentWa: "6282142124899", day: "Kamis" },
  { id: "s7", name: "Fariz Ramadhan", className: "TK A2", parentWa: "6282142124899", day: "Kamis" },
  { id: "s8", name: "Gita Anindya", className: "TK A2", parentWa: "6282142124899", day: "Jumat" },
];

export type ElementKey = "agama" | "jatiDiri" | "literasi";

export type Indicator = { id: string; label: string };

export type Element = {
  key: ElementKey;
  label: string;
  short: string;
  description: string;
  indicators: Indicator[];
};

export const ELEMENTS: Element[] = [
  {
    key: "agama",
    label: "Nilai Agama dan Budi Pekerti",
    short: "Agama & Budi Pekerti",
    description: "Pengenalan Tuhan, praktik ibadah dasar, akhlak mulia, dan perilaku baik sehari-hari.",
    indicators: [
      "Mengenali Tuhan melalui ciptaan-Nya di alam sekitar.",
      "Mampu menirukan gerakan ibadah sesuai dengan agama yang dianut.",
      "Terbiasa melafalkan doa sebelum melakukan kegiatan (makan, belajar).",
      "Terbiasa melafalkan doa sesudah melakukan kegiatan.",
      "Memiliki kebiasaan mengucapkan salam saat datang dan pulang.",
      "Mampu menjawab salam dari guru atau teman dengan sopan.",
      "Menunjukkan sikap jujur dalam perkataan dan perbuatan di sekolah.",
      'Terbiasa mengucapkan "terima kasih" setelah menerima bantuan atau pemberian.',
      'Terbiasa mengucapkan kata "tolong" saat membutuhkan bantuan orang lain.',
      "Berani meminta maaf ketika menyadari telah melakukan kesalahan.",
      "Bersedia memaafkan teman yang telah berbuat salah kepadanya.",
      "Menunjukkan sikap menyayangi, tidak mengejek, dan tidak menyakiti teman.",
      "Menunjukkan sikap hormat dan patuh kepada guru serta orang yang lebih tua.",
      "Peduli kebersihan diri sendiri (mencuci tangan sebelum makan).",
      "Peduli kebersihan lingkungan (membuang sampah pada tempatnya).",
      "Menunjukkan sikap peduli dengan merawat tanaman atau hewan di sekolah.",
      "Menunjukkan sikap bersyukur (menghabiskan makanan, tidak membuang-buang makanan).",
      "Memiliki sikap toleransi dan menghargai teman yang memiliki perbedaan agama.",
      "Mampu menyebutkan tempat ibadah sesuai dengan agamanya.",
      "Memiliki kesediaan untuk berbagi makanan atau barang dengan teman.",
    ].map((label, i) => ({ id: `agama-${i + 1}`, label })),
  },
  {
    key: "jatiDiri",
    label: "Jati Diri",
    short: "Jati Diri",
    description: "Identitas diri, regulasi emosi, kemandirian, kemampuan sosial, dan motorik dasar.",
    indicators: [
      "Mampu mengenali dan menyebutkan identitas diri (nama, usia, jenis kelamin).",
      "Mengenali berbagai macam emosi diri (senang, sedih, marah, takut).",
      "Mampu mengekspresikan emosi secara wajar dan tidak tantrum berlebihan.",
      "Menunjukkan rasa percaya diri saat tampil atau berbicara di depan kelas.",
      "Menunjukkan rasa bangga terhadap hasil karya atau pencapaian diri sendiri.",
      "Mampu menenangkan diri sendiri saat merasa kesal atau kecewa.",
      "Berinisiatif untuk bermain bersama atau bergabung dalam kelompok.",
      "Memiliki kesabaran untuk menunggu giliran saat menggunakan fasilitas sekolah.",
      "Memahami dan bersedia mematuhi aturan atau kesepakatan di dalam kelas.",
      "Menunjukkan kemandirian dalam mengurus diri (memakai sepatu/sandal sendiri).",
      "Mandiri dalam merapikan tas dan barang bawaannya setelah digunakan.",
      "Berpartisipasi aktif dalam kegiatan fisik kasar (berlari, melompat, memanjat).",
      "Mampu menjaga keseimbangan tubuh (berjalan di atas papan titian).",
      "Mampu melakukan gerakan motorik halus dasar (menggunting sesuai pola/garis).",
      "Mampu memegang alat tulis (pensil/krayon) dengan genggaman yang benar.",
      "Menunjukkan kewaspadaan terhadap bahaya (menghindari benda tajam/panas).",
      "Mengenali dan bangga dengan identitas budaya asal keluarganya.",
      "Menunjukkan sikap empati saat melihat temannya sedang bersedih atau sakit.",
      'Mampu mengatakan "tidak" untuk melindungi area pribadi tubuhnya.',
      "Mampu menyesuaikan diri dengan lingkungan atau situasi baru di sekolah.",
    ].map((label, i) => ({ id: `jatiDiri-${i + 1}`, label })),
  },
  {
    key: "literasi",
    label: "Literasi dan STEAM",
    short: "Literasi & STEAM",
    description: "Kesiapan baca-tulis, konsep matematika dasar, eksplorasi sains, dan ekspresi seni.",
    indicators: [
      "Menunjukkan ketertarikan pada buku bacaan atau cerita bergambar.",
      "Mampu menyimak dan merespons instruksi guru dengan tepat.",
      "Mampu menceritakan kembali isi cerita yang baru saja didengarnya.",
      "Mengenali dan mampu menyebutkan bentuk-bentuk huruf alfabet.",
      "Mampu menulis atau meniru bentuk huruf dari namanya sendiri.",
      "Mampu mengekspresikan ide/perasaan melalui coretan, gambar, atau tulisan.",
      "Mengenali konsep angka dan lambang bilangan (1 hingga 10).",
      "Mampu menghitung benda secara berurutan dengan benar (korespondensi 1-1).",
      "Mengenali konsep warna dasar dan hasil percampuran warna.",
      "Mampu mengelompokkan benda berdasarkan bentuk geometri, ukuran, atau warna.",
      "Memahami konsep ruang dan arah (atas-bawah, luar-dalam, kanan-kiri).",
      "Memahami konsep waktu sederhana (pagi, siang, malam, hari ini, besok).",
      'Menunjukkan rasa ingin tahu yang tinggi dengan sering bertanya "mengapa/bagaimana".',
      "Melakukan eksplorasi sains sederhana (percobaan tenggelam-terapung).",
      "Mampu memecahkan masalah sederhana saat bermain (puzzle atau balok).",
      "Mampu menggunakan berbagai media lepas (loose parts) untuk membuat suatu bentuk.",
      "Menggabungkan dua atau lebih bahan berbeda untuk menciptakan karya kriya/seni.",
      "Mampu mengekspresikan diri melalui nyanyian atau gerakan tarian.",
      "Mampu memainkan atau menggunakan alat musik ritmis sederhana.",
      "Mampu menggunakan peralatan bantu/teknologi sederhana dengan aman (gunting, lem, selotip).",
    ].map((label, i) => ({ id: `literasi-${i + 1}`, label })),
  },
];

export type Score = 1 | 2 | 3 | 4;
export type Scores = Record<string, Score>;

export const CATEGORIES: Record<Score, { code: string; label: string; narrative: string }> = {
  1: {
    code: "BB",
    label: "Belum Berkembang",
    narrative:
      "Ananda belum menunjukkan ketertarikan atau kemampuan pada aspek ini dan masih membutuhkan bantuan fisik serta pendampingan penuh dari guru selama kegiatan berlangsung.",
  },
  2: {
    code: "MB",
    label: "Mulai Berkembang",
    narrative:
      "Ananda sudah mulai mau mencoba dan berpartisipasi, namun masih sering membutuhkan bimbingan, pengingat, atau instruksi verbal dari guru untuk menyelesaikannya.",
  },
  3: {
    code: "BSH",
    label: "Berkembang Sesuai Harapan",
    narrative:
      "Ananda mampu melakukan aktivitas secara mandiri dengan baik dan konsisten, menunjukkan perkembangan yang pas dan sesuai dengan harapan di usianya.",
  },
  4: {
    code: "BSB",
    label: "Berkembang Sangat Baik",
    narrative:
      "Ananda sangat menguasai aspek ini dengan luar biasa, sangat proaktif, memiliki inisiatif tinggi tanpa perlu diminta, dan bahkan mampu menjadi contoh serta membantu teman-temannya.",
  },
};

export function scoreToCategory(s: Score) {
  return CATEGORIES[s];
}

export function buildDefaultScores(): Scores {
  const out: Scores = {};
  ELEMENTS.forEach((el) => el.indicators.forEach((ind) => (out[ind.id] = 3)));
  return out;
}

export function summarizeElement(el: Element, scores: Scores) {
  const counts: Record<Score, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let sum = 0;
  el.indicators.forEach((ind) => {
    const s = scores[ind.id] ?? 3;
    counts[s]++;
    sum += s;
  });
  const avg = sum / el.indicators.length;
  const dominantScore = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as unknown as Score);
  return { counts, avg, dominant: CATEGORIES[Number(dominantScore) as Score] };
}

export function formatDateID(d: Date) {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function todayISO(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatISODateID(iso: string) {
  return formatDateID(parseISODate(iso));
}

export function isScoresComplete(scores: Scores): boolean {
  for (const el of ELEMENTS) {
    for (const ind of el.indicators) {
      const v = scores[ind.id];
      if (v !== 1 && v !== 2 && v !== 3 && v !== 4) return false;
    }
  }
  return true;
}

