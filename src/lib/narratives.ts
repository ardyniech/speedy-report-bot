import { useEffect, useState } from "react";
import { CATEGORY_BANDS } from "./students";

export type NarrativeMap = Record<string, string>; // code -> narrative

const KEY = "narratives:v1";

export function defaultNarratives(): NarrativeMap {
  const out: NarrativeMap = {};
  CATEGORY_BANDS.forEach((b) => (out[b.code] = b.narrative));
  return out;
}

export function loadNarratives(): NarrativeMap {
  if (typeof window === "undefined") return defaultNarratives();
  try {
    const raw = localStorage.getItem(KEY);
    const def = defaultNarratives();
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const merged: NarrativeMap = { ...def };
    for (const k of Object.keys(parsed)) {
      const v = parsed[k];
      if (typeof v === "string" && v.trim()) merged[k] = v;
    }
    return merged;
  } catch {
    return defaultNarratives();
  }
}

export function saveNarratives(map: NarrativeMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // ignore quota
  }
}

export function resetNarratives() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function getNarrative(code: string): string {
  return loadNarratives()[code] ?? defaultNarratives()[code] ?? "";
}

export function useNarratives() {
  const [map, setMap] = useState<NarrativeMap>(() => loadNarratives());
  useEffect(() => {
    setMap(loadNarratives());
  }, []);
  const update = (next: NarrativeMap) => {
    setMap(next);
    saveNarratives(next);
  };
  const reset = () => {
    const def = defaultNarratives();
    setMap(def);
    resetNarratives();
  };
  return { map, update, reset };
}
