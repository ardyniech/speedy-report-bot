import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  STUDENTS,
  WEEK_DAYS,
  formatDateID,
  formatISODateID,
  todayISO,
  todayWeekDay,
  type Student,
  type WeekDay,
} from "@/lib/students";
import { AssessmentForm } from "@/components/AssessmentForm";
import { SchoolSettingsDialog } from "@/components/SchoolSettingsDialog";
import { useSchool } from "@/lib/school";
import { listReports, hasDraft } from "@/lib/drafts";
import { generatePdf, buildWaLink } from "@/lib/report";
import { Toaster } from "@/components/ui/sonner";
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
import { Sparkles, Check, ChevronRight, GraduationCap, CalendarDays, Send } from "lucide-react";

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
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dayFilter, setDayFilter] = useState<WeekDay | "all">("all");
  const [todayLabel, setTodayLabel] = useState<string>("");
  const [progressDate, setProgressDate] = useState<string>(() => todayISO());
  // Tick ulang saat draft di tab/komponen lain berubah agar progress fresh.
  const [storageTick, setStorageTick] = useState(0);
  const school = useSchool();

  // Hindari hydration mismatch: render tanggal hanya di client.
  useEffect(() => {
    setTodayLabel(formatDateID(new Date()));
    const td = todayWeekDay();
    if (td) setDayFilter(td);
  }, []);

  // Re-hitung doneIds setiap kali kembali ke daftar (active null) atau localStorage berubah.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("reports:") || e.key.startsWith("draft:")) {
        setStorageTick((t) => t + 1);
      }
    };
    const onFocus = () => setStorageTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const classes = useMemo(() => Array.from(new Set(STUDENTS.map((s) => s.className))), []);
  const filtered = useMemo(
    () =>
      STUDENTS.filter(
        (s) =>
          (classFilter === "all" || s.className === classFilter) &&
          (dayFilter === "all" || s.day === dayFilter),
      ),
    [classFilter, dayFilter],
  );

  // Sumber kebenaran progress = laporan tersimpan untuk tanggal yg dipilih.
  const doneIds = useMemo(() => {
    if (typeof window === "undefined") return new Set<string>();
    const ids = new Set<string>();
    for (const s of STUDENTS) {
      if (listReports(s.id).some((r) => r.reportDate === progressDate)) ids.add(s.id);
    }
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressDate, storageTick, active]);

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
            <span className="hidden text-right text-xs text-muted-foreground sm:block" suppressHydrationWarning>
              {todayLabel}
            </span>
            <SchoolSettingsDialog />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 pb-20">
        {active ? (
          <AssessmentForm
            student={active}
            onBack={() => {
              setStorageTick((t) => t + 1);
              setActive(null);
            }}
            onDone={(_s) => {
              setStorageTick((t) => t + 1);
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
                {doneCount} dari {filtered.length} siswa sudah dinilai untuk{" "}
                <span className="font-semibold">{formatISODateID(progressDate)}</span>.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="date"
                  value={progressDate}
                  max={todayISO()}
                  onChange={(e) => setProgressDate(e.target.value || todayISO())}
                  className="rounded-md bg-white/15 px-2 py-1 text-xs text-white ring-1 ring-white/30 focus:outline-none [color-scheme:dark]"
                />
                {progressDate !== todayISO() && (
                  <button
                    onClick={() => setProgressDate(todayISO())}
                    className="rounded-md bg-white/15 px-2 py-1 text-xs font-medium text-white ring-1 ring-white/30 hover:bg-white/25"
                  >
                    Hari ini
                  </button>
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${filtered.length ? (doneCount / filtered.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="mb-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" /> Hari
                </span>
                <FilterChip active={dayFilter === "all"} onClick={() => setDayFilter("all")}>
                  Semua
                </FilterChip>
                {WEEK_DAYS.map((d) => (
                  <FilterChip key={d} active={dayFilter === d} onClick={() => setDayFilter(d)}>
                    {d}
                  </FilterChip>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Kelas
                </span>
                <FilterChip active={classFilter === "all"} onClick={() => setClassFilter("all")}>
                  Semua
                </FilterChip>
                {classes.map((c) => (
                  <FilterChip key={c} active={classFilter === c} onClick={() => setClassFilter(c)}>
                    {c}
                  </FilterChip>
                ))}
              </div>
            </div>

            <BulkSendBar students={filtered} school={school} />

            {filtered.length === 0 && (
              <div className="mb-4 rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-border">
                Tidak ada siswa untuk filter ini.
              </div>
            )}

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
                          {s.className} · {s.day} {done && "• Selesai"}
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

function BulkSendBar({
  students,
  school,
}: {
  students: Student[];
  school: ReturnType<typeof useSchool>;
}) {
  const [date, setDate] = useState<string>(() => todayISO());
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    return students.map((s) => {
      const reps = listReports(s.id).filter((r) => r.reportDate === date);
      // Pakai laporan paling baru pada tanggal tsb
      const latest = reps[0];
      return { student: s, hasReport: !!latest, report: latest };
    });
  }, [students, date]);

  const ready = rows.filter((r) => r.hasReport);
  const missing = rows.filter((r) => !r.hasReport);

  const runBulk = async () => {
    if (ready.length === 0) {
      toast.error("Tidak ada laporan tersimpan", {
        description: `Belum ada siswa terfilter yang punya laporan pada ${formatISODateID(date)}.`,
      });
      return;
    }
    setOpen(false);
    let i = 0;
    for (const row of ready) {
      generatePdf(row.student, row.report.scores, school, date);
      const link = buildWaLink(row.student, row.report.scores, school, date);
      // Buka WA di tab baru dengan jeda kecil agar tidak diblok popup
      setTimeout(() => window.open(link, "_blank"), i * 600);
      i++;
    }
    toast.success(`Mengirim ${ready.length} laporan`, {
      description: missing.length
        ? `${missing.length} siswa dilewati (belum ada laporan tersimpan).`
        : "Semua siswa terfilter diproses.",
    });
  };

  if (students.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-muted/40 p-3 ring-1 ring-border">
      <div className="flex items-center gap-2 text-xs">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">Tanggal</span>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value || todayISO())}
          className="rounded-md bg-background px-2 py-1 text-sm ring-1 ring-border focus:outline-none focus:ring-primary"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
        >
          <Send className="h-4 w-4" /> Kirim Massal ({students.length})
        </button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim laporan ke {ready.length} orang tua?</AlertDialogTitle>
            <AlertDialogDescription>
              Tanggal: <span className="font-semibold text-foreground">{formatISODateID(date)}</span>.
              Untuk setiap siswa: PDF akan diunduh dan tab WhatsApp akan terbuka berurutan.
              Pastikan browser mengizinkan popup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-56 overflow-y-auto rounded-lg ring-1 ring-border">
            <ul className="divide-y divide-border text-sm">
              {rows.map((r) => (
                <li key={r.student.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-foreground">{r.student.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.student.className} · {r.student.day}
                    </div>
                  </div>
                  {r.hasReport ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      Siap
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                      Tidak ada laporan
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={runBulk} disabled={ready.length === 0}>
              Kirim ({ready.length})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
