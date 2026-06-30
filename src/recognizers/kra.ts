import type { Recognizer } from "../types";
import { scan } from "./util";

/**
 * KRA PIN: a leading letter (A = individual, P = non-individual), 9 digits, and
 * a trailing check letter — 11 chars total, e.g. `A012345678Z`. Format-tight,
 * so false positives are rare; we normalise the value to upper case.
 */
const KRA_PIN = /\b[AP]\d{9}[A-Z]\b/gi;

export const kraPinRecognizer: Recognizer = {
  label: "KRA_PIN",
  priority: 100,
  detect(text) {
    return scan(text, KRA_PIN, "KRA_PIN").map((m) => ({ ...m, value: m.value.toUpperCase() }));
  },
};
