import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { STUDENTS, formatDateID, type Student } from "@/lib/students";
import { AssessmentForm } from "@/components/AssessmentForm";
import { SchoolSettingsDialog } from "@/components/SchoolSettingsDialog";
import { useSchool } from "@/lib/school";
import { Toaster } from "@/components/ui/sonner";
import { Sparkles, Check, ChevronRight, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Penilaian Harian TK — Cepat & Otomatis" },
      { name: "description", content: "Aplikasi penilaian harian siswa TK: input skor, generate PDF, kirim WhatsApp ke orang tua dalam hitungan detik." },
    ],
  }),
});

function Index() {
  const [active, setActive] = useState<Student | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [classFilter, setClassFilter] = useState<string>("all");
  const school = useSchool();

  const classes = useMemo(() => Array.from(new Set(STUDENTS.map((s) => s.className))), []);
  const filtered = classFilter === "all" ? STUDENTS : STUDENTS.filter((s) => s.className === classFilter);
  const doneCount = filtered.filter((s) => doneIds.has(s.id)).length;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
              {school.logoDataUrl ? (
                <img src={school.logoDataUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <GraduationCap className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-bold leading-tight">{school.name}</h1>
              <p className="text-xs text-muted-foreground">Penilaian Harian</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-right text-xs text-muted-foreground sm:block">
              {formatDateID(new Date())}
            </span>
            <SchoolSettingsDialog />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-20">
        {active ? (
          <AssessmentForm
            student={active}
            onBack={() => setActive(null)}
            onDone={(s) => {
              setDoneIds((d) => new Set(d).add(s.id));
              setActive(null);
            }}
          />
        ) : (
          <>
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground shadow-lg">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider opacity-90">
                <Sparkles className="h-3.5 w-3.5" /> Hari ini
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
                Selamat mengajar, Bu Guru!
              </h2>
              <p className="mt-1 text-sm opacity-90">
                {doneCount} dari {filtered.length} siswa sudah dinilai.
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${filtered.length ? (doneCount / filtered.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <FilterChip active={classFilter === "all"} onClick={() => setClassFilter("all")}>
                Semua
              </FilterChip>
              {classes.map((c) => (
                <FilterChip key={c} active={classFilter === c} onClick={() => setClassFilter(c)}>
                  {c}
                </FilterChip>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((s) => {
                const done = doneIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s)}
                    className="group flex items-center justify-between rounded-xl bg-card p-4 text-left ring-1 ring-border transition hover:ring-primary/40 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${
                          done ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
                        }`}
                      >
                        {done ? <Check className="h-5 w-5" /> : s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {s.className} {done && "• Selesai"}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-foreground text-background"
          : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
