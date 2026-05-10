import { useEffect, useState } from "react";
import type { Scores } from "./students";

const draftKey = (id: string) => `draft:${id}`;
const reportsKey = (id: string) => `reports:${id}`;

export type SavedReport = {
  id: string;
  savedAt: string; // ISO
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
  return safeRead<SavedReport[]>(reportsKey(studentId)) ?? [];
}
export function saveReport(studentId: string, scores: Scores): SavedReport {
  const list = listReports(studentId);
  const rep: SavedReport = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
    add: (scores: Scores) => {
      saveReport(studentId, scores);
      refresh();
    },
  };
}
