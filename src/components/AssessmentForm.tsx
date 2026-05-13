import { useEffect, useMemo, useState } from "react";
import {
  ELEMENTS,
  CATEGORY_BANDS,
  SCORE_VALUES,
  scoreToCategory,
  buildDefaultScores,
  summarizeElement,
  formatDateID,
  formatISODateID,
  isScoresComplete,
  todayISO,
  type Score,
  type Scores,
  type Student,
  type ElementKey,
  type Element as ElementDef,
} from "@/lib/students";
import { buildWaLink, generatePdf, previewPdfUrl, pdfFileName } from "@/lib/report";
import { useSchool } from "@/lib/school";
import {
  loadDraft,
  clearDraft,
  hasDraft,
  useAutoSaveDraft,
  useReports,
  type SavedReport,
} from "@/lib/drafts";
import { useNarratives, getNarrative, type NarrativeMap } from "@/lib/narratives";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FileDown,
  Send,
  ChevronDown,
  Eye,
  X,
  Save,
  History,
  Trash2,
  Calendar as CalendarIcon,
  Search,
  AlertCircle,
  PencilLine,
  Copy,
  RotateCcw,
} from "lucide-react";

const VALID_BAND_CODES = new Set(CATEGORY_BANDS.map((b) => b.code));

function isScoresCategoryValid(scores: Scores): boolean {
  for (const el of ELEMENTS) {
    for (const ind of el.indicators) {
      const v = scores[ind.id];
      if (typeof v !== "number") return false;
      const cat = scoreToCategory(v);
      if (!VALID_BAND_CODES.has(cat.code)) return false;
      if (cat.min !== v || cat.max !== v) return false;
    }
  }
  return true;
}


export function AssessmentForm({
  student,
  onBack,
  onDone,
}: {
  student: Student;
  onBack: () => void;
  onDone: (s: Student) => void;
}) {
  const school = useSchool();
  const [scores, setScores] = useState<Scores>(
    () => loadDraft(student.id) ?? buildDefaultScores(),
  );
  const [reportDate, setReportDate] = useState<string>(() => todayISO());
  const [openEl, setOpenEl] = useState<ElementKey>("agama");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNarrativeEditor, setShowNarrativeEditor] = useState(false);
  const { reports, add: addReport, remove: removeReport } = useReports(student.id);
  const narratives = useNarratives();

  // Auto-save draft on every score change
  useEffect(() => {
    saveDraft(student.id, scores);
  }, [student.id, scores]);

  // Notify once if a draft was loaded
  useEffect(() => {
    if (hasDraft(student.id)) {
      toast.message("Draft dimuat", { description: "Lanjutkan pengisian dari terakhir." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id]);

  const openPreview = (s: Scores = scores, d: string = reportDate) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(previewPdfUrl(student, s, school, d));
  };
  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const setScore = (id: string, val: Score) =>
    setScores((s) => ({ ...s, [id]: val }));

  const setAllInElement = (key: ElementKey, val: Score) => {
    setScores((s) => {
      const next = { ...s };
      ELEMENTS.find((e) => e.key === key)!.indicators.forEach((i) => (next[i.id] = val));
      return next;
    });
  };

  const complete = useMemo(() => isScoresComplete(scores), [scores]);
  const categoryValid = useMemo(() => isScoresCategoryValid(scores), [scores]);

  const guardComplete = (): boolean => {
    if (!complete) {
      toast.error("Belum lengkap", {
        description: "Setiap indikator wajib bernilai 1–4 sebelum disimpan atau dikirim.",
      });
      return false;
    }
    if (!categoryValid) {
      toast.error("Kategori tidak valid", {
        description: "Skor 1=BB, 2=MB, 3=BSH, 4=BSB. Pastikan setiap pilihan sesuai label kategori.",
      });
      return false;
    }
    return true;
  };

  // Duplicate scores from the most recent prior saved report
  const previousReport = useMemo(() => {
    const sorted = [...reports].sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    return sorted.find((r) => r.reportDate < reportDate) ?? sorted[0] ?? null;
  }, [reports, reportDate]);

  const handleDuplicatePrev = () => {
    if (!previousReport) {
      toast.error("Tidak ada laporan sebelumnya untuk siswa ini.");
      return;
    }
    setScores({ ...previousReport.scores });
    toast.success("Nilai disalin", {
      description: `Dari laporan ${formatISODateID(previousReport.reportDate)}. Sesuaikan bila perlu.`,
    });
  };


  // Overwrite confirmation state
  const [pendingAction, setPendingAction] = useState<null | "save" | "submit">(null);
  const existingForDate = useMemo(
    () => reports.filter((r) => r.reportDate === reportDate),
    [reports, reportDate],
  );

  const performSaveOnly = () => {
    addReport(scores, reportDate);
    clearDraft(student.id);
    toast.success("Penilaian disimpan", {
      description: `Tersimpan untuk ${formatISODateID(reportDate)}.`,
    });
    onDone(student);
  };
  const performSubmit = () => {
    addReport(scores, reportDate);
    clearDraft(student.id);
    generatePdf(student, scores, school, reportDate);
    const link = buildWaLink(student, scores, school, reportDate);
    window.open(link, "_blank");
    toast.success("PDF terunduh & WhatsApp dibuka", {
      description: "Lampirkan PDF di chat WA orang tua.",
    });
    onDone(student);
  };

  const handleSaveOnly = () => {
    if (!guardComplete()) return;
    if (existingForDate.length > 0) return setPendingAction("save");
    performSaveOnly();
  };
  const handleSubmit = () => {
    if (!guardComplete()) return;
    if (existingForDate.length > 0) return setPendingAction("submit");
    performSubmit();
  };

  const totalIndicators = useMemo(
    () => ELEMENTS.reduce((n, el) => n + el.indicators.length, 0),
    [],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Daftar siswa
        </button>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleDuplicatePrev}
            disabled={!previousReport}
            title={
              previousReport
                ? `Salin dari ${formatISODateID(previousReport.reportDate)}`
                : "Belum ada laporan sebelumnya"
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" />
            Duplikat
          </button>
          <button
            onClick={() => setShowNarrativeEditor(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border hover:bg-muted"
          >
            <PencilLine className="h-3.5 w-3.5" />
            Narasi
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-card px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border hover:bg-muted"
          >
            <History className="h-3.5 w-3.5" />
            Riwayat
            {reports.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {reports.length}
              </span>
            )}
          </button>
        </div>

      </div>

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-6">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
          {student.className} · {student.day}
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{student.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kurikulum Merdeka PAUD · {totalIndicators} indikator · skala 1–4 (BB/MB/BSH/BSB)
        </p>

        {/* Date picker */}
        <label className="mt-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarIcon className="h-3.5 w-3.5" /> Tanggal Laporan
          </span>
          <input
            type="date"
            value={reportDate}
            max={todayISO()}
            onChange={(e) => setReportDate(e.target.value || todayISO())}
            className="rounded-lg bg-background px-3 py-2 text-sm font-medium text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-xs text-muted-foreground">{formatISODateID(reportDate)}</span>
        </label>

        {/* Legend (band) */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
          {CATEGORY_BANDS.map((b) => (
            <div key={b.code} className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
              <span className="grid h-5 min-w-[1.5rem] place-items-center rounded bg-primary/15 px-1 text-[10px] font-bold text-primary">
                {b.min}
              </span>
              <span className="font-semibold text-foreground">{b.code}</span>
              <span className="truncate text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Element accordions */}
        <div className="mt-5 space-y-3">
          {ELEMENTS.map((el) => {
            const open = openEl === el.key;
            const sum = summarizeElement(el, scores);
            return (
              <div key={el.key} className="overflow-hidden rounded-xl ring-1 ring-border">
                <button
                  onClick={() => setOpenEl(open ? ("" as ElementKey) : el.key)}
                  className="flex w-full items-center justify-between gap-3 bg-muted/40 px-4 py-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{el.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{el.description}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                      {sum.dominant.code}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {open && (
                  <div className="bg-card p-3 sm:p-4">
                    {/* Bulk set per band */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">Set semua:</span>
                      {CATEGORY_BANDS.map((b) => (
                        <button
                          key={b.code}
                          onClick={() => setAllInElement(el.key, b.min as Score)}
                          className="rounded-md bg-card px-2 py-1 font-semibold ring-1 ring-border hover:bg-primary hover:text-primary-foreground"
                        >
                          {b.code} ({b.min})
                        </button>
                      ))}
                    </div>

                    <ol className="space-y-2">
                      {el.indicators.map((ind, idx) => {
                        const cur = scores[ind.id];
                        const missing =
                          typeof cur !== "number" || !Number.isInteger(cur) || cur < 1 || cur > 4;
                        return (
                          <li
                            key={ind.id}
                            className={`rounded-lg p-3 ${
                              missing ? "bg-destructive/10 ring-1 ring-destructive/30" : "bg-muted/30"
                            }`}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                              <div className="flex gap-2">
                                <span className="shrink-0 font-semibold text-primary">{idx + 1}.</span>
                                <span className="text-foreground">{ind.label}</span>
                              </div>
                              {!missing && (
                                <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  {cur} · {scoreToCategory(cur).code}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {SCORE_VALUES.map((v) => {
                                const active = cur === v;
                                const cat = scoreToCategory(v);
                                return (
                                  <button
                                    key={v}
                                    onClick={() => setScore(ind.id, v)}
                                    title={`${v} · ${cat.code} — ${cat.label}`}
                                    className={`rounded-md py-2 text-xs font-bold transition ${
                                      active
                                        ? "bg-primary text-primary-foreground shadow"
                                        : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
                                    }`}
                                  >
                                    {v} · {cat.code}
                                  </button>
                                );
                              })}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!complete && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive ring-1 ring-destructive/30">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Lengkapi semua indikator (skor 1–4) sebelum menyimpan atau mengirim ke WhatsApp.
          </div>
        )}

        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={handleSaveOnly}
            disabled={!complete}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            Simpan
          </button>
          <button
            onClick={() => openPreview()}
            className="flex items-center justify-center gap-2 rounded-xl bg-card px-5 py-4 font-semibold text-foreground ring-1 ring-border transition hover:bg-muted active:scale-[0.98]"
          >
            <Eye className="h-5 w-5" />
            Preview
          </button>
          <button
            onClick={() => {
              generatePdf(student, scores, school, reportDate);
              toast.success("PDF terunduh");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-4 font-semibold text-secondary-foreground ring-1 ring-border transition hover:bg-muted active:scale-[0.98]"
          >
            <FileDown className="h-5 w-5" />
            Download
          </button>
          <button
            onClick={handleSubmit}
            disabled={!complete}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
            Kirim WA
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Save className="h-3 w-3" /> Draft otomatis tersimpan — bisa dilanjutkan kapan saja.
        </p>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/70" onClick={closePreview}>
          <div
            className="flex items-center justify-between gap-2 bg-card px-4 py-3 ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">Preview Laporan</div>
              <div className="truncate text-xs text-muted-foreground">{pdfFileName(student, reportDate)}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => {
                  generatePdf(student, scores, school, reportDate);
                  toast.success("PDF terunduh");
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <FileDown className="h-3.5 w-3.5" /> Download
              </button>
              <button
                onClick={closePreview}
                className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/70"
                aria-label="Tutup preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <iframe
            src={previewUrl}
            title="Preview PDF"
            className="flex-1 w-full bg-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showHistory && (
        <HistoryPanel
          student={student}
          reports={reports}
          onClose={() => setShowHistory(false)}
          onRemove={removeReport}
          onPreview={(rep) => {
            setShowHistory(false);
            openPreview(rep.scores, rep.reportDate);
          }}
        />
      )}

      <NarrativeEditorDialog
        open={showNarrativeEditor}
        onOpenChange={setShowNarrativeEditor}
        value={narratives.map}
        onSave={(next) => {
          narratives.update(next);
          toast.success("Template narasi disimpan");
        }}
        onReset={() => {
          narratives.reset();
          toast.message("Template narasi dikembalikan ke bawaan");
        }}
      />

      <AlertDialog open={pendingAction !== null} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan ulang untuk tanggal ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Sudah ada {existingForDate.length} laporan tersimpan untuk{" "}
              <span className="font-semibold text-foreground">{student.name}</span> pada tanggal{" "}
              <span className="font-semibold text-foreground">{formatISODateID(reportDate)}</span>.
              Menyimpan lagi akan menambah entri baru di riwayat (bukan menimpa). Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const act = pendingAction;
                setPendingAction(null);
                if (act === "save") performSaveOnly();
                else if (act === "submit") performSubmit();
              }}
            >
              Ya, simpan lagi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function reportsToCsv(student: Student, reports: SavedReport[]): string {
  const headers = ["Tanggal Laporan", "Disimpan", "Siswa", "Kelas"];
  ELEMENTS.forEach((el) => {
    el.indicators.forEach((ind, i) => headers.push(`${el.short} #${i + 1}`));
    headers.push(`${el.short} (Dominan)`);
  });
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = [headers.map(escape).join(",")];
  reports.forEach((r) => {
    const d = new Date(r.savedAt);
    const savedStr = `${r.reportDate} ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    const row: string[] = [r.reportDate, savedStr, student.name, student.className];
    ELEMENTS.forEach((el) => {
      el.indicators.forEach((ind) => row.push(String(r.scores[ind.id] ?? "")));
      const sum = summarizeElement(el, r.scores);
      row.push(sum.dominant.code);
    });
    rows.push(row.map(escape).join(","));
  });
  return rows.join("\n");
}

function downloadCsv(student: Student, reports: SavedReport[], range?: { from?: string; to?: string }) {
  const csv = reportsToCsv(student, reports);
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const suffix =
    range && (range.from || range.to)
      ? `_${range.from || "awal"}_sd_${range.to || "akhir"}`
      : "";
  a.href = url;
  a.download = `Riwayat-${student.name.replace(/\s+/g, "_")}${suffix}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function HistoryPanel({
  student,
  reports,
  onClose,
  onRemove,
  onPreview,
}: {
  student: Student;
  reports: SavedReport[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onPreview: (rep: SavedReport) => void;
}) {
  const [query, setQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const enriched = useMemo(
    () =>
      reports.map((r) => {
        const d = new Date(r.savedAt);
        const dateStr = formatISODateID(r.reportDate);
        const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        const haystack = `${r.reportDate} ${dateStr} ${time}`.toLowerCase();
        return { r, dateStr, time, haystack };
      }),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enriched.filter((x) => {
      if (q && !x.haystack.includes(q)) return false;
      if (fromDate && x.r.reportDate < fromDate) return false;
      if (toDate && x.r.reportDate > toDate) return false;
      return true;
    });
  }, [enriched, query, fromDate, toDate]);

  const exportCsv = () => {
    const data = filtered.map((x) => x.r);
    if (data.length === 0) {
      toast.error("Tidak ada data sesuai filter");
      return;
    }
    downloadCsv(student, data, { from: fromDate, to: toDate });
    toast.success(`CSV terunduh (${data.length} laporan)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-card shadow-xl ring-1 ring-border sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Riwayat Laporan</div>
            <div className="truncate text-xs text-muted-foreground">{student.name}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground ring-1 ring-border hover:bg-muted"
            >
              <FileDown className="h-3.5 w-3.5" /> CSV
            </button>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/70"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-2 border-b border-border px-3 py-2">
          <label className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 ring-1 ring-border focus-within:ring-primary">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tanggal atau jam (mis. 2026-05 atau 09:30)"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-xs text-muted-foreground hover:text-foreground"
                aria-label="Reset pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">Rentang</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md bg-background px-2 py-1 ring-1 ring-border focus:outline-none focus:ring-primary"
            />
            <span className="text-muted-foreground">s/d</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md bg-background px-2 py-1 ring-1 ring-border focus:outline-none focus:ring-primary"
            />
            <button
              onClick={() => {
                const t = todayISO();
                setFromDate(t);
                setToDate(t);
              }}
              className="rounded-md bg-card px-2 py-1 font-medium ring-1 ring-border hover:bg-muted"
            >
              Hari ini
            </button>
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="rounded-md bg-card px-2 py-1 font-medium text-muted-foreground ring-1 ring-border hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
        </div>
        <Tabs defaultValue="date" className="px-3 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="date" className="flex-1">Per Tanggal</TabsTrigger>
            <TabsTrigger value="aspek" className="flex-1">Per Aspek</TabsTrigger>
          </TabsList>
          <TabsContent value="date" className="mt-2">
            <div className="max-h-[55vh] overflow-y-auto pb-3">
              {reports.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Belum ada laporan tersimpan untuk siswa ini.
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  Tidak ada laporan cocok dengan filter.
                </div>
              ) : (
                <ul className="space-y-2">
                  {filtered.map(({ r, dateStr, time }) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 p-3 ring-1 ring-border">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">{dateStr}</div>
                        <div className="text-xs text-muted-foreground">Disimpan pukul {time}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => onPreview(r)}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                        >
                          <Eye className="h-3.5 w-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => { if (confirm("Hapus laporan ini?")) onRemove(r.id); }}
                          className="grid h-8 w-8 place-items-center rounded-md bg-card text-muted-foreground ring-1 ring-border hover:text-destructive"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabsContent>
          <TabsContent value="aspek" className="mt-2">
            <div className="max-h-[55vh] overflow-y-auto pb-3">
              <AspectHistoryView reports={filtered.map((x) => x.r)} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// keep import used to avoid TS noUnusedLocals if helper unused
void formatDateID;

function NarrativeEditorDialog({
  open,
  onOpenChange,
  value,
  onSave,
  onReset,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  value: NarrativeMap;
  onSave: (next: NarrativeMap) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState<NarrativeMap>(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilLine className="h-4 w-4" /> Template Narasi Evaluasi
          </DialogTitle>
          <DialogDescription>
            Sesuaikan teks narasi untuk setiap kategori (BB / MB / BSH / BSB). Perubahan akan dipakai pada PDF dan ringkasan WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {CATEGORY_BANDS.map((b) => (
            <div key={b.code} className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {b.code}
                </span>
                <span>{b.label}</span>
                <span className="text-xs text-muted-foreground">(skor {b.min})</span>
              </label>
              <Textarea
                value={draft[b.code] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [b.code]: e.target.value }))}
                rows={4}
                className="text-sm"
              />
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReset} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Bawaan
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              const cleaned: NarrativeMap = { ...draft };
              for (const b of CATEGORY_BANDS) {
                if (!cleaned[b.code] || !cleaned[b.code].trim()) cleaned[b.code] = b.narrative;
              }
              onSave(cleaned);
              onOpenChange(false);
            }}
          >
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AspectHistoryView({ reports }: { reports: SavedReport[] }) {
  const sorted = useMemo(
    () => [...reports].sort((a, b) => a.reportDate.localeCompare(b.reportDate)),
    [reports],
  );
  const [openKey, setOpenKey] = useState<ElementKey>(ELEMENTS[0].key);

  if (sorted.length === 0) {
    return (
      <div className="px-3 py-10 text-center text-sm text-muted-foreground">
        Belum ada laporan untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1">
      {ELEMENTS.map((el) => {
        const open = openKey === el.key;
        return (
          <div key={el.key} className="overflow-hidden rounded-xl ring-1 ring-border">
            <button
              onClick={() => setOpenKey(open ? ("" as ElementKey) : el.key)}
              className="flex w-full items-center justify-between gap-3 bg-muted/40 px-3 py-2 text-left"
            >
              <div className="text-sm font-semibold text-foreground">{el.label}</div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
              />
            </button>
            {open && <AspectTimeline element={el} reports={sorted} />}
          </div>
        );
      })}
    </div>
  );
}

function AspectTimeline({ element, reports }: { element: ElementDef; reports: SavedReport[] }) {
  const rows = reports.map((r, i) => {
    const sum = summarizeElement(element, r.scores);
    const prev = i > 0 ? summarizeElement(element, reports[i - 1].scores) : null;
    const delta = prev ? sum.avg - prev.avg : 0;
    return { r, sum, delta };
  });
  return (
    <ol className="divide-y divide-border bg-card">
      {rows.map(({ r, sum, delta }) => {
        const trend =
          delta > 0.05 ? "▲" : delta < -0.05 ? "▼" : "•";
        const trendColor =
          delta > 0.05
            ? "text-emerald-600"
            : delta < -0.05
              ? "text-destructive"
              : "text-muted-foreground";
        return (
          <li key={r.id} className="space-y-1 px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-foreground">{formatISODateID(r.reportDate)}</span>
              <span className="flex items-center gap-1.5">
                <span className={`font-bold ${trendColor}`}>{trend}</span>
                <span className="text-muted-foreground">rata-rata {sum.avg.toFixed(2)}</span>
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                  {sum.dominant.code}
                </span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {getNarrative(sum.dominant.code)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
