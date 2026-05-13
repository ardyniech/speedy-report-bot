import { ELEMENTS, type Element as ElementDef, type ElementKey } from "./students";

/**
 * Saran untuk orang tua / wali, dipetakan per aspek (Agama / Jati Diri / Literasi)
 * dan per kategori capaian dominan (BB / MB / BSH / BSB).
 *
 * Dipakai oleh PDF generator untuk menghasilkan rekomendasi otomatis di setiap
 * halaman aspek. Bahasa hangat, langsung-pakai, dan ringkas (1 kalimat / poin).
 */
export type SuggestionMap = Record<ElementKey, Record<string, string[]>>;

export const PARENT_SUGGESTIONS: SuggestionMap = {
  agama: {
    BB: [
      "Ajak ananda berdoa pendek bersama sebelum makan dan tidur, contohkan dengan suara jelas agar mudah ditiru.",
      "Biasakan mengucap salam saat masuk dan keluar rumah; berikan pelukan singkat sebagai apresiasi.",
      "Ceritakan satu kisah teladan singkat (3–5 menit) sebelum tidur tentang kejujuran atau berbagi.",
      "Latih ucapan ‘tolong’, ‘maaf’, dan ‘terima kasih’ lewat permainan peran sederhana.",
    ],
    MB: [
      "Konsisten ajak ananda berdoa bersama; beri pujian spesifik saat ia mau memimpin doa pendek.",
      "Libatkan ananda merapikan mainan & membuang sampah sendiri sebagai bentuk tanggung jawab harian.",
      "Buat ‘kartu kebaikan’ — catat 1 perbuatan baik tiap hari dan rayakan tiap minggu.",
      "Ajak menengok tetangga/teman yang sakit agar empati tumbuh nyata.",
    ],
    BSH: [
      "Berikan kepercayaan kecil: memimpin doa keluarga, membagi makanan ke saudara, atau menyiram tanaman.",
      "Diskusikan bersama mengapa kita berbagi dan mengapa berkata jujur — biarkan ananda yang menjawab.",
      "Perkenalkan kebiasaan ibadah harian sesuai usia agar konsistensinya makin matang.",
      "Apresiasi sikap baik dengan kata-kata, bukan hadiah materi, agar motivasinya tumbuh dari dalam.",
    ],
    BSB: [
      "Beri tantangan peran: minta ananda mengingatkan adik/teman untuk berdoa atau merapikan mainan.",
      "Libatkan dalam kegiatan sosial keluarga (sedekah, menjenguk, kerja bakti) agar kepekaannya menguat.",
      "Ajak menulis/menggambar ‘jurnal syukur’ mingguan: 3 hal yang ia syukuri.",
      "Pertahankan rutinitas ibadah keluarga; ananda butuh teladan konsisten dari Ayah & Bunda.",
    ],
  },
  jatiDiri: {
    BB: [
      "Beri waktu lebih untuk transisi (pulang sekolah, mandi, tidur); hindari terburu-buru agar emosinya stabil.",
      "Latih kemandirian kecil: memakai sepatu sendiri, menaruh tas di tempatnya, sambil didampingi.",
      "Sediakan ruang aman saat ananda kesal — peluk, akui perasaannya, baru ajak bicara.",
      "Ajak bermain motorik kasar (lari, lompat, panjat aman) minimal 30 menit setiap hari.",
    ],
    MB: [
      "Bangun rutinitas harian yang konsisten (jam makan, mandi, tidur) agar ananda tahu apa yang akan terjadi.",
      "Ajari ananda menyebut nama emosinya: ‘kamu sedang kesal ya?’ — bantu ia mengenali perasaan.",
      "Beri tugas kecil yang bisa diselesaikan sendiri (lipat baju kaos kaki, susun piring plastik).",
      "Sering bermain bersama teman seusia agar keberaniannya tumbuh.",
    ],
    BSH: [
      "Tambahkan tanggung jawab baru sesuai usia: menyiapkan bekal sederhana, memilih baju sendiri.",
      "Ajak ananda menyelesaikan konflik kecil sendiri lebih dulu, baru bantu jika ia kewalahan.",
      "Dorong aktivitas yang melatih ketahanan (bersepeda, berenang, senam) secara rutin.",
      "Libatkan ananda saat membuat kesepakatan keluarga — ia akan lebih patuh pada aturan yang ia ikut buat.",
    ],
    BSB: [
      "Beri tantangan kepemimpinan: jadi ‘kakak’ untuk adik/teman bermain dalam kegiatan sederhana.",
      "Perkenalkan kegiatan terstruktur (klub olahraga, seni, atau bela diri) untuk menyalurkan energi.",
      "Ajak refleksi singkat tiap malam: ‘apa yang membuatmu bangga hari ini?’.",
      "Jaga keseimbangan — anak yang sangat mandiri tetap butuh pelukan dan validasi dari orang tua.",
    ],
  },
  literasi: {
    BB: [
      "Bacakan buku cerita bergambar 10 menit setiap malam; tunjuk gambar sambil bertanya sederhana.",
      "Sediakan krayon & kertas kosong tanpa instruksi — biarkan ananda mencoret bebas.",
      "Bermain hitung benda sehari-hari: ‘ada berapa sendok di meja?’.",
      "Nyanyikan lagu anak yang berulang agar kosakata dan irama tumbuh.",
    ],
    MB: [
      "Tunjukkan huruf dari nama ananda di mana pun terlihat (kemasan, papan jalan, buku).",
      "Bermain menyortir benda berdasarkan warna/bentuk/ukuran sambil menyebutkan namanya.",
      "Ajak menebak jalan cerita: ‘kira-kira selanjutnya apa yang akan terjadi?’.",
      "Sediakan loose parts (tutup botol, kancing, ranting kecil) untuk eksplorasi mandiri.",
    ],
    BSH: [
      "Mulai latihan menulis nama sendiri di buku/garis bantu, 5 menit per hari.",
      "Lakukan ‘percobaan dapur’ sederhana (es mencair, minyak & air) sambil mengajak ananda memprediksi hasil.",
      "Ajak menceritakan ulang cerita yang baru dibaca dengan bahasanya sendiri.",
      "Mainkan permainan berhitung saat di mobil/jalan kaki (hitung kendaraan, langkah, dll.).",
    ],
    BSB: [
      "Sediakan buku dengan kalimat lebih panjang; ajak ananda ‘membaca’ kembali lewat gambar.",
      "Beri proyek mini akhir pekan: membuat kartu ucapan, menyusun puzzle 30+ keping, atau prakarya bertema.",
      "Ajak diskusi terbuka: ‘mengapa daun jatuh?’, ‘bagaimana kalau hujan tidak berhenti?’ — jawaban tidak harus benar.",
      "Perkenalkan teknologi sederhana yang aman (kamera, perekam suara) untuk menyalurkan kreativitasnya.",
    ],
  },
};

export function getParentSuggestions(elKey: ElementKey, code: string): string[] {
  return PARENT_SUGGESTIONS[elKey]?.[code] ?? PARENT_SUGGESTIONS[elKey]?.["BSH"] ?? [];
}

/** Kalimat penutup singkat untuk halaman aspek terakhir. */
export function closingSuggestion(): string {
  return (
    "Setiap anak tumbuh dengan ritme yang berbeda. Dukungan, kesabaran, dan kehadiran Ayah/Bunda di rumah " +
    "adalah pondasi terkuat bagi perkembangan ananda. Mari kita lanjutkan kerja sama ini dengan hangat dan konsisten."
  );
}

// Hindari unused-warning ketika dipakai parsial.
void ELEMENTS;
export type _ElementDef = ElementDef;
