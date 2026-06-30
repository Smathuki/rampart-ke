/**
 * Reversible placeholder table for the Kenyan layer.
 *
 * Mirrors the design of upstream Rampart's `SessionEntityTable`, but mints
 * Kenyan-friendly tokens (`[KRA_PIN_1]`, `[MPESA_CODE_1]`) keyed on the entity
 * class, which the fixed upstream `PiiLabel` set cannot express. The map lives
 * only on the client; only placeholdered text ever leaves the device.
 */

import type { KenyanLabel, KenyanMatch } from "./types.js";

/** Matches any `[LABEL_n]` token; used to find Kenyan placeholders on reveal. */
const PLACEHOLDER_PATTERN = /\[[A-Z][A-Z0-9_]*_\d+\]/g;

export interface KenyanEntity {
  readonly label: KenyanLabel;
  readonly placeholder: string;
  readonly value: string;
}

export interface KenyanScrubResult {
  /** Text with Kenyan PII replaced by placeholders. */
  readonly text: string;
  /** Placeholders introduced or reused in this message. */
  readonly placeholders: readonly string[];
  /** Per-entity detail, for the demo's detection panel. */
  readonly entities: readonly KenyanEntity[];
}

export class KenyanEntityTable {
  private readonly counters = new Map<KenyanLabel, number>();
  private readonly forward = new Map<string, string>(); // `${label}|${norm}` -> token
  private readonly reverse = new Map<string, string>(); // token -> raw value

  /** Normalise a value so casing/whitespace noise doesn't mint duplicate tokens. */
  private normalise(value: string): string {
    return value.trim().replace(/\s+/g, " ").toUpperCase();
  }

  /** Get or mint the stable placeholder for a label+value. Idempotent. */
  placeholderFor(label: KenyanLabel, value: string): string {
    const key = `${label}|${this.normalise(value)}`;
    const existing = this.forward.get(key);
    if (existing) return existing;
    const next = (this.counters.get(label) ?? 0) + 1;
    this.counters.set(label, next);
    const token = `[${label}_${next}]`;
    this.forward.set(key, token);
    this.reverse.set(token, value);
    return token;
  }

  /**
   * Replace each (disjoint) match with its placeholder. Splices right-to-left
   * so an earlier match's offsets stay valid as later text is rewritten.
   */
  mask(raw: string, matches: readonly KenyanMatch[]): KenyanScrubResult {
    const ordered = [...matches].sort((a, b) => b.start - a.start);
    let text = raw;
    const placeholders: string[] = [];
    const entities: KenyanEntity[] = [];
    for (const m of ordered) {
      const placeholder = this.placeholderFor(m.label, m.value);
      text = text.slice(0, m.start) + placeholder + text.slice(m.end);
      placeholders.push(placeholder);
      entities.push({ label: m.label, placeholder, value: m.value });
    }
    placeholders.reverse();
    entities.reverse();
    return { text, placeholders, entities };
  }

  /** Restore real Kenyan values in a reply. Unknown tokens are left intact. */
  reveal(text: string): string {
    return text.replace(PLACEHOLDER_PATTERN, (token) => this.reverse.get(token) ?? token);
  }

  /** True if `token` is a Kenyan placeholder this table can resolve. */
  knows(token: string): boolean {
    return this.reverse.has(token);
  }
}
