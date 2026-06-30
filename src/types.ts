/**
 * Shared vocabulary for the Kenyan deterministic layer.
 *
 * Rampart's ML model emits a fixed 20-label `PiiLabel` set (names, addresses,
 * SSN, card, ...). It cannot represent Kenyan structured identifiers like a KRA
 * PIN or an M-Pesa code without retraining, and several of ours (M-Pesa codes,
 * company names) have no upstream label at all. So rampart-ke detects these in
 * its own deterministic pass and mints its own friendly placeholders
 * (`[KRA_PIN_1]`, `[MPESA_CODE_1]`, ...) *before* handing residual text to the
 * upstream guard, which still catches names/addresses with the model.
 */

import type { GuardOptions } from "@nationaldesignstudio/rampart";

/** Kenyan-specific entity classes the deterministic recognizers can emit. */
export type KenyanLabel =
  | "KRA_PIN"
  | "MPESA_CODE"
  | "MPESA_PAYBILL"
  | "KE_PHONE"
  | "NATIONAL_ID"
  | "MAISHA_NAMBA"
  | "SHIF" // Social Health Insurance Fund (under SHA), replaced NHIF in 2024
  | "NHIF" // legacy, still seen on older records
  | "NSSF"
  | "BANK_ACCOUNT"
  | "PASSPORT"
  | "ORG_KE"
  | "LOCATION_KE";

/** A detected entity over the *original* (raw) text. */
export interface KenyanMatch {
  /** Inclusive start offset into the raw input. */
  readonly start: number;
  /** Exclusive end offset into the raw input. */
  readonly end: number;
  /** The classified Kenyan entity type. */
  readonly label: KenyanLabel;
  /** The raw substring covered, retained for placeholder rehydration. */
  readonly value: string;
  /** Detector confidence in [0, 1]. Validator-backed rules report 1. */
  readonly score: number;
}

/** A deterministic detector for one Kenyan entity class. */
export interface Recognizer {
  readonly label: KenyanLabel;
  /**
   * Overlap-resolution priority; higher wins when two matches overlap.
   * Tight structured identifiers outrank broad org/location matches.
   */
  readonly priority: number;
  /** Find all matches of this class in `text`, with raw offsets. */
  detect(text: string): KenyanMatch[];
}

/**
 * Options for {@link createKenyanGuard}. Extends the upstream `GuardOptions`
 * (so `model`, `device`, `keepLabels`, `heuristicsOnly`, `minScore`, etc. all
 * pass straight through to the Rampart guard) and adds a recognizer override.
 */
export interface KenyanGuardOptions extends GuardOptions {
  /** Kenyan recognizers to run; defaults to the full built-in set. */
  readonly recognizers?: readonly Recognizer[];
}
