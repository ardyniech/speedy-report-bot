import { useState } from "react";
import { INDICATORS, scoreToCategory, type Scores, type Student } from "@/lib/students";
import { buildWaLink, generatePdf } from "@/lib/report";
import { toast } from "sonner";
import { ArrowLeft, FileDown, Send, Check } from "lucide-react";

const DEFAULT: Scores = { agama: 7, fisik: 7, kognitif: 7, sosial: 7 };

export function AssessmentForm({
  student,
  onBack,
  onDone,
}: {
  student: Student;
  onBack: () => void;
  onDone: (s: Student) => void;
}) {
  const [scores, setScores] = useState<Scores>(DEFAULT);

  const setScore = (key: keyof Scores, val: number) =>
    setScores((s) => ({ ...s, [key]: val }));

  const handleSubmit = () => {
    generatePdf(student, scores);
    const link = buildWaLink(student, scores);
    window.open(link, "_blank");
    toast.success("PDF terunduh & WhatsApp dibuka", {
      description: "Lampirkan PDF di chat WA orang tua.",
    });
    onDone(student);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke daftar siswa
      </button>

      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
          {student.className}
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground">{student.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih skor 1–10 untuk setiap aspek perkembangan hari ini.
        </p>

        <div className="mt-6 space-y-5">
          {INDICATORS.map((ind) => {
            const cat = scoreToCategory(scores[ind.key]);
            return (
              <div key={ind.key} className="rounded-xl bg-muted/40 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-foreground">{ind.label}</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {cat.code}
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const active = scores[ind.key] === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setScore(ind.key, n)}
                        className={`aspect-square rounded-lg text-sm font-semibold transition-all ${
                          active
                            ? "bg-primary text-primary-foreground scale-110 shadow-md"
                            : "bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs italic text-muted-foreground">{cat.narrative}</p>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90 active:scale-[0.98]"
        >
          <Send className="h-5 w-5" />
          Simpan & Kirim WA
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <FileDown className="h-3 w-3" /> PDF otomatis terunduh, WA siap dengan pesan terisi
        </p>
      </div>
    </div>
  );
}

export function DoneIcon() {
  return <Check className="h-4 w-4 text-emerald-500" />;
}
