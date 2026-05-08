import jsPDF from "jspdf";
import { INDICATORS, scoreToCategory, formatDateID, type Scores, type Student } from "./students";

export function buildWaMessage(student: Student, scores: Scores) {
  const date = formatDateID(new Date());
  const lines = [
    `*Laporan Penilaian Harian*`,
    `TK Ceria Bunda`,
    ``,
    `Nama  : ${student.name}`,
    `Kelas : ${student.className}`,
    `Tanggal: ${date}`,
    ``,
    `*Hasil Perkembangan:*`,
  ];
  INDICATORS.forEach((ind) => {
    const c = scoreToCategory(scores[ind.key]);
    lines.push(`• ${ind.label} (${scores[ind.key]}/10) - ${c.code}`);
    lines.push(`  ${c.narrative}`);
  });
  lines.push("", "Terima kasih atas kerja sama Ayah/Bunda. 🌸", "_— Bu Guru_");
  return lines.join("\n");
}

export function buildWaLink(student: Student, scores: Scores) {
  const text = encodeURIComponent(buildWaMessage(student, scores));
  return `https://wa.me/${student.parentWa}?text=${text}`;
}

export function generatePdf(student: Student, scores: Scores) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  let y = 50;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("TK CERIA BUNDA", W / 2, y, { align: "center" });
  y += 18;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Pendidikan No. 1 — Telp. (021) 555-0100", W / 2, y, { align: "center" });
  y += 14;
  doc.setLineWidth(1.2);
  doc.line(40, y, W - 40, y);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("LAPORAN PENILAIAN HARIAN SISWA", W / 2, y, { align: "center" });
  y += 26;

  // Info
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const info: [string, string][] = [
    ["Nama Siswa", student.name],
    ["Kelas", student.className],
    ["Tanggal", formatDateID(new Date())],
  ];
  info.forEach(([k, v]) => {
    doc.text(`${k}`, 50, y);
    doc.text(`: ${v}`, 140, y);
    y += 16;
  });
  y += 10;

  // Table header
  doc.setFont("helvetica", "bold");
  doc.setFillColor(240, 240, 240);
  doc.rect(40, y, W - 80, 22, "F");
  doc.text("Aspek Perkembangan", 50, y + 15);
  doc.text("Skor", 320, y + 15);
  doc.text("Kategori", 380, y + 15);
  y += 22;
  doc.setFont("helvetica", "normal");

  INDICATORS.forEach((ind) => {
    const c = scoreToCategory(scores[ind.key]);
    doc.rect(40, y, W - 80, 22);
    doc.text(ind.label, 50, y + 15);
    doc.text(`${scores[ind.key]}/10`, 320, y + 15);
    doc.text(`${c.code} — ${c.label}`, 380, y + 15);
    y += 22;
  });
  y += 18;

  // Narrative
  doc.setFont("helvetica", "bold");
  doc.text("Catatan Perkembangan:", 50, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  INDICATORS.forEach((ind) => {
    const c = scoreToCategory(scores[ind.key]);
    const text = `• ${ind.label}: ${c.narrative}`;
    const split = doc.splitTextToSize(text, W - 100);
    doc.text(split, 50, y);
    y += split.length * 14 + 4;
  });

  y += 30;
  doc.text("Hormat kami,", W - 180, y);
  y += 60;
  doc.setFont("helvetica", "bold");
  doc.text("Guru Kelas", W - 180, y);

  doc.save(`Laporan-${student.name.replace(/\s+/g, "_")}.pdf`);
}
