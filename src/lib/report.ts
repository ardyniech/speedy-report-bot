import jsPDF from "jspdf";
import {
  ELEMENTS,
  CATEGORIES,
  scoreToCategory,
  summarizeElement,
  formatDateID,
  type Scores,
  type Student,
} from "./students";

export function buildWaMessage(student: Student, scores: Scores) {
  const date = formatDateID(new Date());
  const lines: string[] = [
    `*Laporan Penilaian Harian*`,
    `TK Ceria Bunda`,
    ``,
    `Nama   : ${student.name}`,
    `Kelas  : ${student.className}`,
    `Tanggal: ${date}`,
    ``,
    `*Ringkasan Capaian Pembelajaran:*`,
  ];
  ELEMENTS.forEach((el) => {
    const sum = summarizeElement(el, scores);
    lines.push(`• ${el.short} — dominan ${sum.dominant.code} (${sum.dominant.label})`);
  });
  lines.push("", "Detail lengkap 60 indikator terlampir pada PDF. 📄", "");
  lines.push("Terima kasih atas kerja sama Ayah/Bunda. 🌸", "_— Bu Guru_");
  return lines.join("\n");
}

export function buildWaLink(student: Student, scores: Scores) {
  const text = encodeURIComponent(buildWaMessage(student, scores));
  return `https://wa.me/${student.parentWa}?text=${text}`;
}

export function generatePdf(student: Student, scores: Scores) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = 50;

  const ensureSpace = (need: number) => {
    if (y + need > H - 50) {
      doc.addPage();
      y = 50;
    }
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TK CERIA BUNDA", W / 2, y, { align: "center" });
  y += 16;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Pendidikan No. 1 — Telp. (021) 555-0100", W / 2, y, { align: "center" });
  y += 12;
  doc.setLineWidth(1);
  doc.line(M, y, W - M, y);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("LAPORAN PENILAIAN HARIAN — KURIKULUM MERDEKA PAUD", W / 2, y, { align: "center" });
  y += 22;

  // Info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const info: [string, string][] = [
    ["Nama Siswa", student.name],
    ["Kelas", student.className],
    ["Tanggal", formatDateID(new Date())],
  ];
  info.forEach(([k, v]) => {
    doc.text(k, M + 5, y);
    doc.text(`: ${v}`, M + 90, y);
    y += 14;
  });
  y += 6;

  // Legend
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Skala: 1=BB (Belum Berkembang)  2=MB (Mulai Berkembang)  3=BSH (Sesuai Harapan)  4=BSB (Sangat Baik)", M, y);
  y += 14;

  // For each element
  ELEMENTS.forEach((el) => {
    ensureSpace(50);
    const sum = summarizeElement(el, scores);
    doc.setFillColor(245, 230, 220);
    doc.rect(M, y, W - 2 * M, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(el.label, M + 8, y + 15);
    doc.text(`Dominan: ${sum.dominant.code}`, W - M - 8, y + 15, { align: "right" });
    y += 26;

    // Table header
    doc.setFontSize(8.5);
    doc.setFillColor(240, 240, 240);
    doc.rect(M, y, W - 2 * M, 16, "F");
    doc.text("No", M + 4, y + 11);
    doc.text("Indikator", M + 28, y + 11);
    doc.text("Skor", W - M - 50, y + 11);
    doc.text("Kat.", W - M - 22, y + 11);
    y += 16;

    doc.setFont("helvetica", "normal");
    el.indicators.forEach((ind, i) => {
      const score = scores[ind.id] ?? 3;
      const cat = CATEGORIES[score];
      const labelLines = doc.splitTextToSize(ind.label, W - 2 * M - 90) as string[];
      const rowH = Math.max(14, labelLines.length * 10 + 4);
      ensureSpace(rowH);
      doc.rect(M, y, W - 2 * M, rowH);
      doc.text(String(i + 1), M + 4, y + 10);
      doc.text(labelLines, M + 28, y + 10);
      doc.text(String(score), W - M - 50, y + 10);
      doc.text(cat.code, W - M - 22, y + 10);
      y += rowH;
    });
    y += 10;
  });

  // Narrative summary
  ensureSpace(80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Catatan Perkembangan", M, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  ELEMENTS.forEach((el) => {
    const sum = summarizeElement(el, scores);
    const text = `• ${el.short}: ${sum.dominant.narrative}`;
    const lines = doc.splitTextToSize(text, W - 2 * M) as string[];
    ensureSpace(lines.length * 12 + 6);
    doc.text(lines, M, y);
    y += lines.length * 12 + 4;
  });

  ensureSpace(80);
  y += 20;
  doc.text("Hormat kami,", W - 180, y);
  y += 50;
  doc.setFont("helvetica", "bold");
  doc.text("Guru Kelas", W - 180, y);

  doc.save(`Laporan-${student.name.replace(/\s+/g, "_")}.pdf`);
}
