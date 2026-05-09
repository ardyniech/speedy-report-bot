import { useEffect, useState } from "react";

export type SchoolSettings = {
  name: string;
  address: string;
  phone: string;
  city: string;
  teacherName: string;
  principalName: string;
  logoDataUrl: string; // base64 PNG/JPG, empty if none
};

export const DEFAULT_SCHOOL: SchoolSettings = {
  name: "TK Ceria Bunda",
  address: "Jl. Pendidikan No. 1",
  phone: "(021) 555-0100",
  city: "Jakarta",
  teacherName: "Bu Sari, S.Pd",
  principalName: "Ibu Hj. Aminah, M.Pd",
  logoDataUrl: "",
};

const KEY = "school-settings-v1";

export function loadSchool(): SchoolSettings {
  if (typeof window === "undefined") return DEFAULT_SCHOOL;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SCHOOL;
    return { ...DEFAULT_SCHOOL, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCHOOL;
  }
}

export function saveSchool(s: SchoolSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("school-settings-changed"));
}

export function useSchool() {
  const [school, setSchool] = useState<SchoolSettings>(DEFAULT_SCHOOL);
  useEffect(() => {
    setSchool(loadSchool());
    const handler = () => setSchool(loadSchool());
    window.addEventListener("school-settings-changed", handler);
    return () => window.removeEventListener("school-settings-changed", handler);
  }, []);
  return school;
}
