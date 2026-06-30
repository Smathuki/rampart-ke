import type { KenyanMatch, Recognizer } from "../types";
import { scan } from "./util";

/**
 * M-Pesa transaction (confirmation) code: 10 characters, upper-case, starts
 * with a letter and mixes letters and digits, e.g. `QFT3X1AB9Z`.
 *
 * A bare 10-char token is far too common to redact on shape alone (order IDs,
 * hashes, SKUs). So a candidate is only accepted when M-Pesa context appears
 * nearby, OR the whole input is a short SMS-length string. This is the single
 * highest false-positive risk in the library, so it is gated hard.
 */
const CANDIDATE = /\b[A-Z][A-Z0-9]{9}\b/g;
const CONTEXT =
  /m-?pesa|confirmed|\bksh\b|\bkes\b|received|sent to|paid to|pay to|transaction|\btxn\b|reference|\bref\b|new balance|withdraw/i;
const CONTEXT_WINDOW = 45;
const SHORT_INPUT = 60;

function hasDigit(s: string): boolean {
  return /\d/.test(s);
}

export const mpesaCodeRecognizer: Recognizer = {
  label: "MPESA_CODE",
  priority: 95,
  detect(text) {
    const out: KenyanMatch[] = [];
    for (const m of text.matchAll(CANDIDATE)) {
      if (typeof m.index !== "number") continue;
      const value = m[0];
      if (!hasDigit(value)) continue; // pure-letter SHOUTING words are not codes
      const from = Math.max(0, m.index - CONTEXT_WINDOW);
      const to = Math.min(text.length, m.index + value.length + CONTEXT_WINDOW);
      const around = text.slice(from, to);
      if (text.length <= SHORT_INPUT || CONTEXT.test(around)) {
        out.push({ start: m.index, end: m.index + value.length, label: "MPESA_CODE", value, score: 0.9 });
      }
    }
    return out;
  },
};

/**
 * M-Pesa Paybill / Till / Buy-Goods number: a 5–7 digit business short code,
 * only redacted when introduced by its keyword.
 */
const PAYBILL = /\b(?:pay\s?bill|buy\s?goods|till(?:\s*(?:no\.?|number))?)\b\D{0,15}(\d{5,7})\b/gid;

export const mpesaPaybillRecognizer: Recognizer = {
  label: "MPESA_PAYBILL",
  priority: 90,
  detect(text) {
    return scan(text, PAYBILL, "MPESA_PAYBILL", 1);
  },
};
