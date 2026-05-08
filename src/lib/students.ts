export type Student = {
  id: string;
  name: string;
  className: string;
  parentWa: string; // format internasional tanpa +, contoh: 6281234567890
};

export const STUDENTS: Student[] = [
  { id: "s1", name: "Ahmad Fauzan", className: "TK B1", parentWa: "6282142124899" },
  { id: "s2", name: "Aisyah Putri", className: "TK B1", parentWa: "6282142124899" },
  { id: "s3", name: "Bima Pratama", className: "TK B1", parentWa: "6282142124899" },
  { id: "s4", name: "Citra Lestari", className: "TK B1", parentWa: "6282142124899" },
  { id: "s5", name: "Daffa Hakim", className: "TK A2", parentWa: "6282142124899" },
  { id: "s6", name: "Elsa Maharani", className: "TK A2", parentWa: "6282142124899" },
  { id: "s7", name: "Fariz Ramadhan", className: "TK A2", parentWa: "6282142124899" },
  { id: "s8", name: "Gita Anindya", className: "TK A2", parentWa: "6282142124899" },
];

export type IndicatorKey = "agama" | "fisik" | "kognitif" | "sosial";

export const INDICATORS: { key: IndicatorKey; label: string }[] = [
  { key: "agama", label: "Nilai Agama & Moral" },
  { key: "fisik", label: "Fisik Motorik" },
  { key: "kognitif", label: "Kognitif" },
  { key: "sosial", label: "Sosial Emosional" },
];

export type Scores = Record<IndicatorKey, number>;

export function scoreToCategory(score: number) {
  if (score <= 4) return { code: "BB", label: "Belum Berkembang", narrative: "Ananda masih memerlukan bimbingan dan stimulasi lebih lanjut dalam aspek ini." };
  if (score <= 6) return { code: "MB", label: "Mulai Berkembang", narrative: "Ananda sudah mulai menunjukkan ketertarikan dan perkembangan awal pada aspek ini." };
  if (score <= 8) return { code: "BSH", label: "Berkembang Sesuai Harapan", narrative: "Ananda menunjukkan perkembangan yang sangat baik dan konsisten sesuai dengan usianya." };
  return { code: "BSB", label: "Berkembang Sangat Baik", narrative: "Ananda menunjukkan kemampuan luar biasa, sangat mandiri, dan sering menjadi contoh bagi teman-temannya di aspek ini." };
}

export function formatDateID(d: Date) {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
