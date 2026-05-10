import { useEffect, useState } from "react";
import { todayISO, type Scores } from "./students";

const draftKey = (id: string) => `draft:${id}`;
const reportsKey = (id: string) => `reports:${id}`;

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

function safeWrite(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

export function loadDraft(studentId: string): Scores | null {
  return safeRead<Scores>(draftKey(studentId));
}
export function saveDraft(studentId: string, scores: Scores) {
  safeWrite(draftKey(studentId), scores);
}
export function clearDraft(studentId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(draftKey(studentId));
}
export function hasDraft(studentId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(draftKey(studentId)) !== null;
}

export function listReports(studentId: string): SavedReport[] {
  const list = safeRead<SavedReport[]>(reportsKey(studentId)) ?? [];
  // Backfill reportDate untuk data lama
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
