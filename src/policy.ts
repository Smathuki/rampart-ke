import type { PiiLabel } from "@nationaldesignstudio/rampart";

/**
 * Upstream keep-set localised for Kenya.
 *
 * Rampart's default keeps {CITY, STATE, ZIP_CODE}. Kenya has no postal ZIP, so
 * we drop it and keep only coarse geography (towns / counties) for analytics.
 * Fine-grained geography — estates, roads, P.O. boxes — is redacted by the
 * Kenyan `location` recognizer *before* the upstream guard runs, and the 47
 * counties are intentionally left unmasked so they survive into the kept set.
 */
export const KE_KEEP_LABELS: readonly PiiLabel[] = ["CITY", "STATE"];
