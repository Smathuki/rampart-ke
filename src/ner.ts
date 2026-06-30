/**
 * Boundary-repairing NER detector.
 *
 * The Rampart model is a WordPiece token classifier. Tokenization can make it
 * under-cover a word — e.g. it labels "OCHIEN" of "OCHIENG" and leaves a
 * trailing "G" exposed, so "JOHN OCHIENG" redacts to "[GIVEN_NAME_1] [SURNAME_1] G".
 *
 * We plug into ChatGuard's `ner` seam: run the real model, then snap every span
 * out to whole-word boundaries before it reaches the merge/redact step. The fix
 * is recall-biased — we only ever grow a redaction, never shrink one.
 */

import {
  detectNer,
  loadNerClassifier,
  type NerDetector,
  type NerOptions,
  type Span,
} from "@nationaldesignstudio/rampart";
import { COUNTY_SET } from "./data/counties.js";

/**
 * Characters that count as part of a single word when repairing a boundary:
 * letters, digits, and the apostrophes used in names like Murang'a / O'Brien.
 * Spaces and punctuation are NOT word chars, so a span never grows past the
 * word it already touches into a neighbouring token.
 */
const WORD_CHAR = /[A-Za-z0-9'’]/;

const isWord = (ch: string | undefined): boolean => ch !== undefined && WORD_CHAR.test(ch);

/**
 * For each span, if it begins or ends in the middle of a contiguous word,
 * extend it to cover the whole word so no fragment is left behind.
 */
export function repairSpanBoundaries(text: string, spans: readonly Span[]): Span[] {
  return spans.map((span) => {
    let start = span.start;
    let end = span.end;
    // Grow left while we're splitting a word at the start edge.
    while (start > 0 && isWord(text[start - 1]) && isWord(text[start])) start--;
    // Grow right while we're splitting a word at the end edge.
    while (end < text.length && isWord(text[end]) && isWord(text[end - 1])) end++;
    if (start === span.start && end === span.end) return span;
    return { ...span, start, end, text: text.slice(start, end) };
  });
}

/** Wrap any NER detector so its spans are repaired to whole-word boundaries. */
export function withBoundaryRepair(detect: NerDetector): NerDetector {
  return async (text) => repairSpanBoundaries(text, await detect(text));
}

/**
 * Drop model spans whose text is one of the 47 counties. The model sometimes
 * mislabels a county as a GIVEN_NAME (seen with "Nairobi" in Swahili context),
 * which would redact coarse geography we deliberately keep for analytics. This
 * enforces the keep-county policy regardless of the label the model assigned.
 * A trailing " County" is tolerated ("Nairobi County" → kept).
 */
export function keepCounties(spans: readonly Span[]): Span[] {
  return spans.filter((s) => {
    const name = s.text.trim().replace(/\s+county$/i, "").toLowerCase();
    return !COUNTY_SET.has(name);
  });
}

/**
 * Build the default boundary-repairing detector: the real Rampart ONNX
 * classifier, wrapped so token-edge fragments are swallowed before redaction
 * and counties are never redacted.
 */
export async function createRepairingNer(options: NerOptions = {}): Promise<NerDetector> {
  const classifier = await loadNerClassifier(options);
  return async (text) =>
    keepCounties(repairSpanBoundaries(text, await detectNer(text, classifier, options.minScore)));
}
