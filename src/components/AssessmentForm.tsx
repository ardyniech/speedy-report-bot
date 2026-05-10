import { useEffect, useMemo, useState } from "react";
import {
  ELEMENTS,
  CATEGORIES,
  buildDefaultScores,
  summarizeElement,
  formatDateID,
  type Score,
  type Scores,
  type Student,
  type ElementKey,
} from "@/lib/students";
import { buildWaLink, generatePdf, previewPdfUrl, pdfFileName } from "@/lib/report";
import { useSchool } from "@/lib/school";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  hasDraft,
  useReports,
  type SavedReport,
} from "@/lib/drafts";
import { toast } from "sonner";
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
} from "lucide-react";

const SCORE_OPTIONS: Score[] = [1, 2, 3, 4];

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
  const [openEl, setOpenEl] = useState<ElementKey>("agama");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { reports, add: addReport, remove: removeReport } = useReports(student.id);

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

  const openPreview = (s: Scores = scores) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(previewPdfUrl(student, s, school));
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

  const handleSaveOnly = () => {
    addReport(scores);
    clearDraft(student.id);
    toast.success("Penilaian disimpan", {
      description: "Tersedia di Riwayat siswa.",
    });
    onDone(student);
  };

  const handleSubmit = () => {
    addReport(scores);
    clearDraft(student.id);
    generatePdf(student, scores, school);
    const link = buildWaLink(student, scores, school);
    window.open(link, "_blank");
    toast.success("PDF terunduh & WhatsApp dibuka", {
      description: "Lampirkan PDF di chat WA orang tua.",
    });
    onDone(student);
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

      <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border sm:p-6">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
          {student.className}
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{student.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kurikulum Merdeka PAUD · {totalIndicators} indikator · skala 1–4 (BB/MB/BSH/BSB)
        </p>

        {/* Legend */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
          {SCORE_OPTIONS.map((s) => (
            <div key={s} className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
              <span className="grid h-5 w-5 place-items-center rounded bg-primary/15 text-[10px] font-bold text-primary">
                {s}
              </span>
              <span className="font-semibold text-foreground">{CATEGORIES[s].code}</span>
              <span className="truncate text-muted-foreground">{CATEGORIES[s].label}</span>
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
                    {/* Bulk set */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">Set semua:</span>
                      {SCORE_OPTIONS.map((v) => (
                        <button
                          key={v}
                          onClick={() => setAllInElement(el.key, v)}
                          className="rounded-md bg-card px-2 py-1 font-semibold ring-1 ring-border hover:bg-primary hover:text-primary-foreground"
                        >
                          {v} · {CATEGORIES[v].code}
                        </button>
                      ))}
                    </div>

                    <ol className="space-y-2">
                      {el.indicators.map((ind, idx) => {
                        const cur = scores[ind.id];
                        return (
                          <li key={ind.id} className="rounded-lg bg-muted/30 p-3">
                            <div className="mb-2 flex gap-2 text-sm">
                              <span className="shrink-0 font-semibold text-primary">{idx + 1}.</span>
                              <span className="text-foreground">{ind.label}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {SCORE_OPTIONS.map((v) => {
                                const active = cur === v;
                                return (
                                  <button
                                    key={v}
                                    onClick={() => setScore(ind.id, v)}
                                    className={`rounded-md py-2 text-xs font-bold transition ${
                                      active
                                        ? "bg-primary text-primary-foreground shadow"
                                        : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
                                    }`}
                                  >
                                    <div>{v}</div>
                                    <div className="text-[10px] font-semibold opacity-80">
                                      {CATEGORIES[v].code}
                                    </div>
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

        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={handleSaveOnly}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-4 font-semibold text-white shadow-md transition hover:opacity-90 active:scale-[0.98]"
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
              generatePdf(student, scores, school);
              toast.success("PDF terunduh");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-4 font-semibold text-secondary-foreground ring-1 ring-border transition hover:bg-muted active:scale-[0.98]"
          >
            <FileDown className="h-5 w-5" />
            Download
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 active:scale-[0.98]"
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
              <div className="truncate text-xs text-muted-foreground">{pdfFileName(student)}</div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => {
                  generatePdf(student, scores, school);
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
            openPreview(rep.scores);
          }}
        />
      )}
    </div>
  );
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
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-card shadow-xl ring-1 ring-border sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">Riwayat Laporan</div>
            <div className="truncate text-xs text-muted-foreground">{student.name}</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md bg-muted hover:bg-muted/70"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-3">
          {reports.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-muted-foreground">
              Belum ada laporan tersimpan untuk siswa ini.
            </div>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => {
                const d = new Date(r.savedAt);
                const dateStr = formatDateID(d);
                const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
                return (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-muted/40 p-3 ring-1 ring-border"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{dateStr}</div>
                      <div className="text-xs text-muted-foreground">Pukul {time}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        onClick={() => onPreview(r)}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Hapus laporan ini?")) onRemove(r.id);
                        }}
                        className="grid h-8 w-8 place-items-center rounded-md bg-card text-muted-foreground ring-1 ring-border hover:text-destructive"
                        aria-label="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
