/**
 * rampart-ke — Kenya-localized, on-device PII redaction.
 *
 * A thin wrapper around `@nationaldesignstudio/rampart`. Two layers run, both
 * entirely on the device, before any text is sent to a server or LLM:
 *
 *   1. Kenyan deterministic recognizers (this package) detect structured local
 *      identifiers — KRA PIN, M-Pesa codes, phone numbers, National ID / Maisha
 *      Namba, SHA/SHIF, NSSF, bank/passport, company names, estates/roads — and
 *      replace them with friendly placeholders like [KRA_PIN_1], [MPESA_CODE_1].
 *   2. The upstream Rampart guard then catches names and addresses with its
 *      quantized ONNX model, keeping coarse geography (towns / counties).
 *
 * Real values never leave the device; only placeholdered text does.
 */

import { createGuard, type ChatGuard, type NerDetector } from "@nationaldesignstudio/rampart";
import { DEFAULT_RECOGNIZERS } from "./recognizers/index.js";
import { detectKenyan } from "./premask.js";
import { createRepairingNer } from "./ner.js";
import { KenyanEntityTable, type KenyanEntity } from "./session.js";
import { KE_KEEP_LABELS } from "./policy.js";
import type { KenyanGuardOptions, Recognizer } from "./types.js";

/** Result of protecting one message. */
export interface KenyanProtectResult {
  /** Text with PII replaced by placeholders. Safe to send/log. */
  readonly text: string;
  /** All placeholders introduced this turn (Kenyan layer + upstream). */
  readonly placeholders: readonly string[];
  /** The Kenyan-layer detections, for audit / the demo's detection panel. */
  readonly entities: readonly KenyanEntity[];
}

/**
 * A per-conversation Kenyan PII guard. Wraps an upstream `ChatGuard` and a
 * Kenyan entity table; placeholder identity is stable across turns.
 */
export class KenyanGuard {
  private constructor(
    private readonly guard: ChatGuard,
    private readonly table: KenyanEntityTable,
    private readonly recognizers: readonly Recognizer[],
  ) {}

  static async create(options: KenyanGuardOptions = {}): Promise<KenyanGuard> {
    const { recognizers = DEFAULT_RECOGNIZERS, keepLabels = KE_KEEP_LABELS, ...upstream } = options;

    // By default, route the model through our boundary-repair wrapper so
    // WordPiece token-edge fragments on names are swallowed before redaction.
    // Respect an explicitly supplied detector; skip for heuristics-only and
    // worker modes (the worker runs its own pipeline off the main thread).
    let ner: NerDetector | undefined = upstream.ner;
    if (ner === undefined && upstream.heuristicsOnly !== true && upstream.worker === undefined) {
      ner = await createRepairingNer({
        model: upstream.model,
        device: upstream.device ?? "wasm",
        minScore: upstream.minScore,
      });
    }

    const guard = await createGuard({ ...upstream, keepLabels, ner });
    return new KenyanGuard(guard, new KenyanEntityTable(), recognizers);
  }

  /**
   * Redact Kenyan structured IDs deterministically, then hand the residual text
   * to the upstream guard for names/addresses. Run on the user's text BEFORE it
   * reaches any AI SDK or server.
   */
  async protect(text: string): Promise<KenyanProtectResult> {
    const matches = detectKenyan(text, this.recognizers);
    const masked = this.table.mask(text, matches);
    const upstream = await this.guard.protect(masked.text);
    return {
      text: upstream.text,
      placeholders: [...masked.placeholders, ...upstream.placeholders],
      entities: masked.entities,
    };
  }

  /** Restore real values (Kenyan layer + upstream) in a complete reply. */
  reveal(reply: string): string {
    return this.table.reveal(this.guard.reveal(reply));
  }
}

/** Build a conversation guard. See {@link KenyanGuardOptions}. */
export async function createKenyanGuard(options?: KenyanGuardOptions): Promise<KenyanGuard> {
  return KenyanGuard.create(options);
}

let sharedGuard: Promise<KenyanGuard> | undefined;

/**
 * One-shot convenience: protect a single string using a lazily-created shared
 * guard. Handy for demos and scripts; for a chat session prefer
 * {@link createKenyanGuard} so placeholders stay stable across turns.
 */
export async function protectKE(
  text: string,
  options?: KenyanGuardOptions,
): Promise<KenyanProtectResult> {
  if (!sharedGuard) sharedGuard = KenyanGuard.create(options);
  return (await sharedGuard).protect(text);
}

export { DEFAULT_RECOGNIZERS } from "./recognizers/index.js";
export { detectKenyan } from "./premask.js";
export { repairSpanBoundaries, withBoundaryRepair, keepCounties, createRepairingNer } from "./ner.js";
export { KenyanEntityTable } from "./session.js";
export { KE_KEEP_LABELS } from "./policy.js";
export { LABEL_DESCRIPTIONS } from "./labels.js";
export type { KenyanEntity, KenyanScrubResult } from "./session.js";
export type { KenyanGuardOptions, KenyanLabel, KenyanMatch, Recognizer } from "./types.js";
