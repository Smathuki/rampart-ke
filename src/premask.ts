/**
 * Overlap resolution for the Kenyan deterministic layer.
 *
 * Each recognizer scans the raw text independently and may report matches that
 * overlap another recognizer's (e.g. a phone number inside an address line).
 * {@link detectKenyan} reduces them to a disjoint, start-sorted set so the
 * session table can splice placeholders without corrupting offsets.
 */

import type { KenyanMatch, Recognizer } from "./types";

/**
 * Run every recognizer over `text` and collapse the results into a
 * non-overlapping set. Conflicts are resolved by: earliest start first, then
 * longer span, then higher recognizer priority. Biased to keep a redaction
 * rather than drop one (recall over precision), per the threat model.
 */
export function detectKenyan(
  text: string,
  recognizers: readonly Recognizer[],
): KenyanMatch[] {
  const priority = new Map(recognizers.map((r) => [r.label, r.priority]));

  const all: KenyanMatch[] = [];
  for (const r of recognizers) {
    for (const m of r.detect(text)) {
      if (m.end > m.start) all.push(m);
    }
  }

  all.sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenA !== lenB) return lenB - lenA;
    return (priority.get(b.label) ?? 0) - (priority.get(a.label) ?? 0);
  });

  const kept: KenyanMatch[] = [];
  let lastEnd = -1;
  for (const m of all) {
    if (m.start >= lastEnd) {
      kept.push(m);
      lastEnd = m.end;
    }
  }
  return kept;
}
