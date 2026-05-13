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
  type Element as ElementDef,
} from "./students";
import type { SchoolSettings } from "./school";
import { getNarrative } from "./narratives";
import { getParentSuggestions, closingSuggestion } from "./suggestions";

export { scoreToCategory };

function formatReportDate(reportDate?: string) {
  return reportDate ? formatISODateID(reportDate) : formatDateID(new Date());
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

/* ============================================================
   WhatsApp message
   ============================================================ */

export function buildWaMessage(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const date = formatReportDate(reportDate);
  const lines: string[] = [
    `*Laporan Perkembangan Ananda*`,
    school.name,
    ``,
    `Nama   : ${student.name}`,
    `Kelas  : ${student.className}`,
    `Tanggal: ${date}`,
    ``,
    `*Ringkasan Capaian:*`,
  ];
  ELEMENTS.forEach((el) => {
    const sum = summarizeElement(el, scores);
    lines.push(`• ${el.short} — ${sum.dominant.code} (${sum.dominant.label})`);
  });
  lines.push(
    "",
    "Detail naratif & saran untuk di rumah terlampir pada PDF (3 halaman). 📄",
    "",
    "Terima kasih atas kerja sama Ayah/Bunda. 🌸",
    `_— ${school.teacherName}_`,
  );
  return lines.join("\n");
}

export function buildWaLink(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const text = encodeURIComponent(buildWaMessage(student, scores, school, reportDate));
  return `https://wa.me/${student.parentWa}?text=${text}`;
}

/* ============================================================
   Narrative composer (per aspek)
   ============================================================ */

function composeAspectNarrative(student: Student, el: ElementDef, scores: Scores) {
  const sum = summarizeElement(el, scores);
  const cat = sum.dominant;
  const fname = firstName(student.name);

  const ranked = el.indicators
    .map((ind) => ({ ind, s: scores[ind.id] ?? 3 }))
    .sort((a, b) => b.s - a.s);

  const top = ranked.slice(0, 2).filter((r) => r.s >= 3);
  const low = [...ranked].reverse()[0];

  const dist = `Dari ${el.indicators.length} indikator yang diamati: ` +
    `BB ${sum.counts.BB}, MB ${sum.counts.MB}, BSH ${sum.counts.BSH}, BSB ${sum.counts.BSB} ` +
    `(rata-rata ${sum.avg.toFixed(2)} dari skala 1–4).`;

  const opening =
    `Pada aspek ${el.short.toLowerCase()}, ${fname} secara umum berada pada kategori ` +
    `${cat.code} — ${cat.label}. ${getNarrative(cat.code)}`;

  const stripDot = (s: string) => s.replace(/\.+$/, "").toLowerCase();
  const strengths = top.length
    ? ` Kekuatan yang terlihat menonjol antara lain ${top
        .map((t) => `kemampuan untuk ${stripDot(t.ind.label)} (${scoreToCategory(t.s).code})`)
        .join(" serta ")}.`
    : "";

  const focus =
    low && low.s <= 2
      ? ` Hal yang masih membutuhkan pendampingan lebih konsisten adalah ${stripDot(low.ind.label)}; ` +
        `dengan latihan yang menyenangkan di rumah, ananda akan terus tumbuh pada area ini.`
      : "";

  const closing =
    cat.code === "BSB"
      ? ` Pertahankan kebiasaan baik ini, dan beri ananda tantangan-tantangan baru yang sesuai usianya.`
      : cat.code === "BSH"
        ? ` Capaian ini sudah sesuai harapan; konsistensi rutinitas di rumah akan menjaga ritme perkembangannya.`
        : cat.code === "MB"
          ? ` Dengan pengulangan yang sabar dan suasana yang hangat, kemampuan ananda akan semakin matang.`
          : ` Mari kita dampingi ananda dengan sabar — fondasi yang kuat membutuhkan waktu dan kehadiran kita.`;

  return { dist, paragraph: opening + strengths + focus + closing, dominantCode: cat.code };
}

/* ============================================================
   PDF builder — 1 aspek = 1 halaman (3 halaman / siswa)
   ============================================================ */

function buildPdf(student: Student, scores: Scores, school: SchoolSettings, reportDate?: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;

  const renderHeader = (pageNo: number, total: number) => {
    let y = 40;
    const logoSize = 44;
    if (school.logoDataUrl) {
      try {
        const fmt = school.logoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
        doc.addImage(school.logoDataUrl, fmt, M, y, logoSize, logoSize);
      } catch {
        // ignore
      }
    }
    const tx = school.logoDataUrl ? M + logoSize + 12 : M;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(school.name.toUpperCase(), tx, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(school.address, tx, y + 26);
    if (school.phone) doc.text(`Telp. ${school.phone}`, tx, y + 37);

    // Page indicator (right)
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.text(`Halaman ${pageNo} dari ${total}`, W - M, y + 14, { align: "right" });

    y = 40 + logoSize + 8;
    doc.setLineWidth(1.2);
    doc.line(M, y, W - M, y);
    doc.setLineWidth(0.4);
    doc.line(M, y + 3, W - M, y + 3);
    return y + 18;
  };

  const renderStudentBlock = (yStart: number) => {
    let y = yStart;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("LAPORAN PERKEMBANGAN ANANDA", W / 2, y, { align: "center" });
    y += 14;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Kurikulum Merdeka PAUD", W / 2, y, { align: "center" });
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const labelX = M;
    const sepX = M + 90;
    const info: [string, string][] = [
      ["Nama Siswa", student.name],
      ["Kelas", student.className],
      ["Tanggal", formatReportDate(reportDate)],
    ];
    info.forEach(([k, v]) => {
      doc.text(k, labelX, y);
      doc.text(`: ${v}`, sepX, y);
      y += 13;
    });
    return y + 6;
  };

  const drawWrapped = (text: string, x: number, y: number, maxW: number, lh = 13) => {
    const lines = doc.splitTextToSize(text, maxW) as string[];
    doc.text(lines, x, y);
    return y + lines.length * lh;
  };

  const renderFooter = (pageNo: number, total: number) => {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `${school.name}  •  ${formatReportDate(reportDate)}  •  Halaman ${pageNo}/${total}`,
      W / 2,
      H - 24,
      { align: "center" },
    );
    doc.setTextColor(0, 0, 0);
  };

  const renderSignature = (yStart: number) => {
    let y = yStart;
    if (y > H - 170) {
      // not enough space — push down a bit so it still fits
      y = H - 170;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const placeDate = `${school.city}, ${formatReportDate(reportDate)}`;
    doc.text(placeDate, W - M, y, { align: "right" });
    y += 16;

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
  };

  const total = ELEMENTS.length;
  ELEMENTS.forEach((el, idx) => {
    if (idx > 0) doc.addPage();
    const pageNo = idx + 1;
    let y = renderHeader(pageNo, total);
    y = renderStudentBlock(y);

    // Aspect badge bar
    const { paragraph, dist, dominantCode } = composeAspectNarrative(student, el, scores);
    doc.setFillColor(245, 230, 220);
    doc.rect(M, y, W - 2 * M, 26, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Aspek ${pageNo}. ${el.label}`, M + 10, y + 17);
    doc.text(`Capaian: ${dominantCode}`, W - M - 10, y + 17, { align: "right" });
    y += 34;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    y = drawWrapped(el.description, M, y, W - 2 * M, 12) + 6;

    // Distribusi singkat
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    y = drawWrapped(dist, M, y, W - 2 * M, 12) + 8;
    doc.setTextColor(0, 0, 0);

    // Narasi paragraf
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Catatan Perkembangan", M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    y = drawWrapped(paragraph, M, y, W - 2 * M, 14) + 12;

    // Saran orang tua
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Saran untuk Ayah / Bunda di Rumah", M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const tips = getParentSuggestions(el.key, dominantCode);
    tips.forEach((t) => {
      const bullet = `•  ${t}`;
      const lines = doc.splitTextToSize(bullet, W - 2 * M - 8) as string[];
      doc.text(lines, M + 4, y);
      y += lines.length * 13 + 3;
    });

    // Penutup di halaman terakhir + tanda tangan
    if (pageNo === total) {
      y += 8;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      y = drawWrapped(closingSuggestion(), M, y, W - 2 * M, 13) + 16;
      renderSignature(y);
    }

    renderFooter(pageNo, total);
  });

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

void formatDateID;
void parseISODate;
