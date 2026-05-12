import jsPDF from "jspdf";
import {
  ELEMENTS,
  scoreToCategory,
  summarizeElement,
  formatDateID,
  formatISODateID,
  parseISODate,
  type Scores,
  type Student,
} from "./students";
import type { SchoolSettings } from "./school";
import { getNarrative } from "./narratives";

export { scoreToCategory };

function formatReportDate(reportDate?: string) {
  return reportDate ? formatISODateID(reportDate) : formatDateID(new Date());
}

export function buildWaMessage(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const date = formatReportDate(reportDate);
  const lines: string[] = [
    `*Laporan Penilaian Harian*`,
    school.name,
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
  lines.push("Terima kasih atas kerja sama Ayah/Bunda. 🌸", `_— ${school.teacherName}_`);
  return lines.join("\n");
}

export function buildWaLink(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const text = encodeURIComponent(buildWaMessage(student, scores, school, reportDate));
  return `https://wa.me/${student.parentWa}?text=${text}`;
}

function buildPdf(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = 40;

  const ensureSpace = (need: number) => {
    if (y + need > H - 50) {
      doc.addPage();
      y = 50;
    }
  };

  // === HEADER / KOP ===
  const logoSize = 56;
  if (school.logoDataUrl) {
    try {
      const fmt = school.logoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(school.logoDataUrl, fmt, M, y, logoSize, logoSize);
    } catch {
      // ignore bad image
    }
  }
  const textX = school.logoDataUrl ? M + logoSize + 14 : W / 2;
  const align = school.logoDataUrl ? "left" : "center";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(school.name.toUpperCase(), textX, y + 16, { align });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(school.address, textX, y + 30, { align });
  if (school.phone) doc.text(`Telp. ${school.phone}`, textX, y + 42, { align });

  y += logoSize + 8;
  doc.setLineWidth(1.5);
  doc.line(M, y, W - M, y);
  doc.setLineWidth(0.5);
  doc.line(M, y + 3, W - M, y + 3);
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("LAPORAN PENILAIAN HARIAN", W / 2, y, { align: "center" });
  y += 14;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Kurikulum Merdeka PAUD", W / 2, y, { align: "center" });
  y += 20;

  // === INFO SISWA ===
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const info: [string, string][] = [
    ["Nama Siswa", student.name],
    ["Kelas", student.className],
    ["Tanggal", formatReportDate(reportDate)],
  ];
  info.forEach(([k, v]) => {
    doc.text(k, M + 5, y);
    doc.text(`: ${v}`, M + 90, y);
    y += 14;
  });
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Skala 1–4  •  1 BB (Belum Berkembang)  •  2 MB (Mulai Berkembang)  •  3 BSH (Sesuai Harapan)  •  4 BSB (Sangat Baik)", M, y);
  y += 14;

  // === ELEMENTS ===
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
      const cat = scoreToCategory(score);
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

  // === CATATAN ===
  ensureSpace(80);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Catatan Perkembangan", M, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  ELEMENTS.forEach((el) => {
    const sum = summarizeElement(el, scores);
    const text = `• ${el.short}: ${getNarrative(sum.dominant.code)}`;
    const lines = doc.splitTextToSize(text, W - 2 * M) as string[];
    ensureSpace(lines.length * 12 + 6);
    doc.text(lines, M, y);
    y += lines.length * 12 + 4;
  });

  // === TANDA TANGAN (dua kolom) ===
  ensureSpace(120);
  y += 18;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const placeDate = `${school.city}, ${formatReportDate(reportDate)}`;
  doc.text(placeDate, W - M, y, { align: "right" });
  y += 18;

  const colW = (W - 2 * M) / 2;
  const leftX = M + colW / 2;
  const rightX = W - M - colW / 2;
  const sigTop = y;

  doc.text("Mengetahui,", leftX, sigTop, { align: "center" });
  doc.text("Guru Kelas,", rightX, sigTop, { align: "center" });
  doc.text("Kepala Sekolah", leftX, sigTop + 12, { align: "center" });

  const nameY = sigTop + 70;
  doc.setFont("helvetica", "bold");
  doc.text(school.principalName, leftX, nameY, { align: "center" });
  doc.text(school.teacherName, rightX, nameY, { align: "center" });
  doc.setLineWidth(0.5);
  doc.line(leftX - 70, nameY + 3, leftX + 70, nameY + 3);
  doc.line(rightX - 70, nameY + 3, rightX + 70, nameY + 3);

  return doc;
}

export function pdfFileName(student: Student, reportDate?: string) {
  const datePart = reportDate ?? "";
  const base = `Laporan-${student.name.replace(/\s+/g, "_")}`;
  return datePart ? `${base}-${datePart}.pdf` : `${base}.pdf`;
}

export function generatePdf(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const doc = buildPdf(student, scores, school, reportDate);
  doc.save(pdfFileName(student, reportDate));
}

export function previewPdfUrl(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const doc = buildPdf(student, scores, school, reportDate);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

// Hindari unused-import warning bila helper di atas tidak terpakai pada beberapa build.
void formatDateID;
void parseISODate;

