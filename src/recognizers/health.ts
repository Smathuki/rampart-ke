import type { KenyanLabel, KenyanMatch, Recognizer } from "../types";

/**
 * Health & social-security membership numbers, context-anchored to their
 * scheme name:
 *   SHA / SHIF — Social Health Authority / Fund (replaced NHIF in 2024)
 *   NHIF       — legacy, still on older records
 *   NSSF       — National Social Security Fund
 * Group 1 is the scheme (selects the label); group 2 is the redacted number.
 */
const HEALTH = /\b(SHA|SHIF|NHIF|NSSF)\b\D{0,12}(\d{4,12})\b/gid;

function labelFor(scheme: string): KenyanLabel {
  const s = scheme.toUpperCase();
  if (s === "NHIF") return "NHIF";
  if (s === "NSSF") return "NSSF";
  return "SHIF"; // SHA and SHIF both map to the current SHIF label
}

export const healthRecognizer: Recognizer = {
  label: "SHIF",
  priority: 80,
  detect(text) {
    const out: KenyanMatch[] = [];
    for (const m of text.matchAll(HEALTH)) {
      const span = m.indices?.[2];
      const value = m[2];
      const scheme = m[1];
      if (!span || value == null || scheme == null) continue;
      out.push({ start: span[0], end: span[1], label: labelFor(scheme), value, score: 1 });
    }
    return out;
  },
};
