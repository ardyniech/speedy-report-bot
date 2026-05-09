import { useMemo, useState } from "react";
import {
  ELEMENTS,
  CATEGORIES,
  buildDefaultScores,
  summarizeElement,
  type Score,
  type Scores,
  type Student,
  type ElementKey,
} from "@/lib/students";
import { buildWaLink, generatePdf } from "@/lib/report";
import { toast } from "sonner";
import { ArrowLeft, FileDown, Send, ChevronDown } from "lucide-react";

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
  const [scores, setScores] = useState<Scores>(() => buildDefaultScores());
  const [openEl, setOpenEl] = useState<ElementKey>("agama");

  const setScore = (id: string, val: Score) =>
    setScores((s) => ({ ...s, [id]: val }));

  const setAllInElement = (key: ElementKey, val: Score) => {
    setScores((s) => {
      const next = { ...s };
      ELEMENTS.find((e) => e.key === key)!.indicators.forEach((i) => (next[i.id] = val));
      return next;
    });
  };

  const handleSubmit = () => {
    generatePdf(student, scores);
    const link = buildWaLink(student, scores);
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
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar siswa
      </button>

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

        <div className="mt-6 grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 active:scale-[0.98]"
          >
            <Send className="h-5 w-5" />
            Simpan & Kirim WA
          </button>
          <button
            onClick={() => {
              generatePdf(student, scores);
              toast.success("PDF terunduh");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-4 font-semibold text-secondary-foreground ring-1 ring-border transition hover:bg-muted active:scale-[0.98]"
          >
            <FileDown className="h-5 w-5" />
            Download PDF
          </button>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <FileDown className="h-3 w-3" /> PDF otomatis terunduh, WA siap dengan pesan terisi
        </p>
      </div>
    </div>
  );
}
