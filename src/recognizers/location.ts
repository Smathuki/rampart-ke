import type { KenyanMatch, Recognizer } from "../types";
import { ESTATES } from "../data/estates";
import { escapeRegExp, scan } from "./util";

/**
 * Fine-grained Kenyan geography — redacted to [LOCATION_KE_n]. Counties are
 * deliberately NOT matched here (they are kept for analytics; see policy.ts).
 * Three sources:
 *   1. P.O. Box lines, e.g. "P.O. Box 12345-00100".
 *   2. Named roads, e.g. "Moi Avenue", "Thika Road".
 *   3. An estate / neighbourhood gazetteer (data/estates.ts).
 */
const PO_BOX = /\bP\.?\s?O\.?\s?Box\s+\d{1,6}(?:\s*[-–]\s*\d{4,5})?/gi;

const ROAD =
  /\b(?:[A-Z][A-Za-z'.-]+\s+){1,3}(?:Road|Rd|Avenue|Ave|Street|St|Highway|Hwy|Way|Lane|Ln|Drive|Dr|Close|Crescent|Court)\b\.?/g;

// Longest first so "Kahawa West" wins over "Kahawa".
const ESTATE_ALT = [...ESTATES]
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp)
  .join("|");
const ESTATE = new RegExp(`\\b(?:${ESTATE_ALT})\\b`, "gi");

export const locationRecognizer: Recognizer = {
  label: "LOCATION_KE",
  priority: 50,
  detect(text): KenyanMatch[] {
    return [
      ...scan(text, PO_BOX, "LOCATION_KE", 0, 1),
      ...scan(text, ROAD, "LOCATION_KE", 0, 0.85),
      ...scan(text, ESTATE, "LOCATION_KE", 0, 0.85),
    ];
  },
};
