import { useEffect, useRef, useState } from "react";
import { todayISO, type Scores } from "./students";

const DRAFT_VERSION = 2;
const draftKey = (id: string) => `draft:${id}`;
const reportsKey = (id: string) => `reports:${id}`;

export type DraftEnvelope = {
  v: number;
  studentId: string;
  scores: Scores;
  updatedAt: string; // ISO
};

export type SavedReport = {
  id: string;
  /** Tanggal laporan (YYYY-MM-DD) yang dipilih guru. */
  reportDate: string;
  /** Waktu sistem ketika data disimpan (ISO). */
  savedAt: string;
  scores: Scores;
};

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* ---------- Drafts ---------- */

export function loadDraft(studentId: string): Scores | null {
  // Try modern envelope first, fall back to legacy "scores-only" payload.
  const raw = safeRead<unknown>(draftKey(studentId));
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.v === "number" && obj.scores && typeof obj.scores === "object") {
    return obj.scores as Scores;
  }
  // Legacy: stored Scores directly
  return raw as Scores;
}

export function loadDraftEnvelope(studentId: string): DraftEnvelope | null {
  const raw = safeRead<unknown>(draftKey(studentId));
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.v === "number" && obj.scores) return obj as DraftEnvelope;
  // Wrap legacy
  return {
    v: 1,
    studentId,
    scores: raw as Scores,
    updatedAt: new Date(0).toISOString(),
  };
}

export function saveDraft(studentId: string, scores: Scores): boolean {
  const env: DraftEnvelope = {
    v: DRAFT_VERSION,
    studentId,
    scores,
    updatedAt: new Date().toISOString(),
  };
  return safeWrite(draftKey(studentId), env);
}

export function clearDraft(studentId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(draftKey(studentId));
  } catch {
    // ignore
  }
}

export function hasDraft(studentId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(draftKey(studentId)) !== null;
  } catch {
    return false;
  }
}

/**
 * Hook autosave yang anti-celah:
 * - Debounce tulis (default 250ms) supaya hemat IO.
 * - Flush sinkron saat tab disembunyikan / ditutup (`visibilitychange`,
 *   `pagehide`, `beforeunload`) — tidak ada kondisi data hilang gara-gara
 *   guru langsung tutup browser.
 * - Sinkronisasi antar-tab via `storage` event: jika tab lain memperbarui
 *   draft yang sama, scores di tab ini akan ikut diperbarui.
 * - Idempoten: tidak menulis ulang jika scores belum berubah.
 *
 * Returns: { savedAt, flush, status }
 *   - savedAt: timestamp ISO simpan terakhir (untuk indikator UI).
 *   - flush(): paksa simpan sekarang (mis. sebelum pindah halaman).
 *   - status: "idle" | "saving" | "saved" | "error".
 */
export function useAutoSaveDraft(
  studentId: string,
  scores: Scores,
  options?: { debounceMs?: number; onExternalChange?: (scores: Scores) => void },
) {
  const debounceMs = options?.debounceMs ?? 250;
  const onExternal = options?.onExternalChange;
  const [savedAt, setSavedAt] = useState<string | null>(() => {
    const env = loadDraftEnvelope(studentId);
    return env?.updatedAt ?? null;
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const lastSerialized = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingScores = useRef<Scores>(scores);
  pendingScores.current = scores;

  const writeNow = () => {
    const serialized = JSON.stringify(pendingScores.current);
    if (serialized === lastSerialized.current) {
      setStatus("saved");
      return;
    }
    setStatus("saving");
    const ok = saveDraft(studentId, pendingScores.current);
    if (ok) {
      lastSerialized.current = serialized;
      setSavedAt(new Date().toISOString());
      setStatus("saved");
    } else {
      setStatus("error");
    }
  };

  // Debounced write on score change.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(writeNow, debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, scores, debounceMs]);

  // Flush on hide/close + cross-tab sync.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const flush = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      writeNow();
    };

    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    const onPageHide = () => flush();
    const onBeforeUnload = () => flush();

    const onStorage = (e: StorageEvent) => {
      if (e.key !== draftKey(studentId) || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as DraftEnvelope | Scores;
        const remoteScores =
          typeof parsed === "object" && parsed && "scores" in (parsed as DraftEnvelope)
            ? (parsed as DraftEnvelope).scores
            : (parsed as Scores);
        const remoteSerialized = JSON.stringify(remoteScores);
        if (remoteSerialized !== JSON.stringify(pendingScores.current)) {
          lastSerialized.current = remoteSerialized;
          setSavedAt(new Date().toISOString());
          onExternal?.(remoteScores);
        }
      } catch {
        // ignore
      }
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("storage", onStorage);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  return { savedAt, status, flush: writeNow };
}

/* ---------- Reports ---------- */

export function listReports(studentId: string): SavedReport[] {
  const list = safeRead<SavedReport[]>(reportsKey(studentId)) ?? [];
  return list.map((r) => ({
    ...r,
    reportDate: r.reportDate ?? (r.savedAt ? r.savedAt.slice(0, 10) : todayISO()),
  }));
}

export function saveReport(studentId: string, scores: Scores, reportDate: string): SavedReport {
  const list = listReports(studentId);
  const rep: SavedReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reportDate,
    savedAt: new Date().toISOString(),
    scores: { ...scores },
  };
  safeWrite(reportsKey(studentId), [rep, ...list]);
  return rep;
}

export function deleteReport(studentId: string, reportId: string) {
  const list = listReports(studentId).filter((r) => r.id !== reportId);
  safeWrite(reportsKey(studentId), list);
}

export function useReports(studentId: string) {
  const [reports, setReports] = useState<SavedReport[]>(() => listReports(studentId));
  const refresh = () => setReports(listReports(studentId));
  useEffect(() => {
    setReports(listReports(studentId));
  }, [studentId]);
  return {
    reports,
    refresh,
    remove: (id: string) => {
      deleteReport(studentId, id);
      refresh();
    },
    add: (scores: Scores, reportDate: string) => {
      saveReport(studentId, scores, reportDate);
      refresh();
    },
  };
}
