/**
 * Compliance audit + reporting.
 *
 * Kenya's Data Protection Act (2019) requires data handlers to demonstrate how
 * they protect personal data. This module produces that evidence — counts of how
 * much PII was redacted on-device, by category and by day — and renders an
 * ODPC-style compliance report.
 *
 * Privacy by design (and the selling point): the recorder stores ONLY
 * `{ label, day, count }`. No values, no text, no hashes of values. The audit
 * log is itself free of personal data, so retaining it creates no new liability.
 */

import { LABEL_DESCRIPTIONS } from "./labels.js";

/** The minimal shape consumed from a `protect()` result. */
export interface RedactionOutcome {
  /** Placeholder tokens introduced this turn, e.g. `["[KRA_PIN_1]", "[EMAIL_1]"]`. */
  readonly placeholders: readonly string[];
}

/** A placeholder token like `[GIVEN_NAME_2]`; group 1 is the label. */
const TOKEN = /^\[([A-Z][A-Z0-9_]*)_\d+\]$/;

/** Extract the entity label from a placeholder token, or `null` if it isn't one. */
export function parsePlaceholderLabel(token: string): string | null {
  const m = TOKEN.exec(token);
  return m ? m[1]! : null;
}

export interface ComplianceSummary {
  /** Earliest day with a redaction (YYYY-MM-DD), or null if none recorded. */
  readonly from: string | null;
  /** Latest day with a redaction (YYYY-MM-DD), or null if none recorded. */
  readonly to: string | null;
  /** Number of messages/turns recorded. */
  readonly sessions: number;
  /** Total PII instances redacted. */
  readonly totalRedactions: number;
  /** Instances per label, highest first. */
  readonly byLabel: Record<string, number>;
  /** Instances per day (YYYY-MM-DD), earliest first. */
  readonly byDay: Record<string, number>;
}

/** Serialised recorder state — still contains no personal data. */
export interface RecorderState {
  readonly sessions: number;
  readonly byLabel: Record<string, number>;
  readonly byDay: Record<string, number>;
}

function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Accumulates PII-free redaction counts. Feed each `protect()` result to
 * {@link record}; read {@link summary} or hand it to {@link generateComplianceReport}.
 */
export class ComplianceRecorder {
  private sessions = 0;
  private readonly byLabel = new Map<string, number>();
  private readonly byDay = new Map<string, number>();

  /** Record one protected message. Only labels + the day are stored. */
  record(outcome: RedactionOutcome, at: Date = new Date()): void {
    this.sessions++;
    const day = toDay(at);
    let onThisDay = 0;
    for (const token of outcome.placeholders) {
      const label = parsePlaceholderLabel(token);
      if (label === null) continue;
      this.byLabel.set(label, (this.byLabel.get(label) ?? 0) + 1);
      onThisDay++;
    }
    if (onThisDay > 0) this.byDay.set(day, (this.byDay.get(day) ?? 0) + onThisDay);
  }

  summary(): ComplianceSummary {
    const days = [...this.byDay.keys()].sort();
    let total = 0;
    for (const n of this.byLabel.values()) total += n;
    return {
      from: days[0] ?? null,
      to: days[days.length - 1] ?? null,
      sessions: this.sessions,
      totalRedactions: total,
      byLabel: byCountDesc(this.byLabel),
      byDay: byKeyAsc(this.byDay),
    };
  }

  reset(): void {
    this.sessions = 0;
    this.byLabel.clear();
    this.byDay.clear();
  }

  toJSON(): RecorderState {
    return { sessions: this.sessions, byLabel: byCountDesc(this.byLabel), byDay: byKeyAsc(this.byDay) };
  }

  static fromJSON(state: RecorderState): ComplianceRecorder {
    const r = new ComplianceRecorder();
    r.sessions = state.sessions;
    for (const [k, v] of Object.entries(state.byLabel)) r.byLabel.set(k, v);
    for (const [k, v] of Object.entries(state.byDay)) r.byDay.set(k, v);
    return r;
  }
}

function byCountDesc(m: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function byKeyAsc(m: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...m.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

/** Human labels for the upstream Rampart entity classes (Kenyan ones come from LABEL_DESCRIPTIONS). */
const UPSTREAM_LABELS: Record<string, string> = {
  GIVEN_NAME: "Given name",
  SURNAME: "Surname",
  PHONE: "Phone number",
  EMAIL: "Email address",
  URL: "Web address (URL)",
  IP_ADDRESS: "IP address",
  SSN: "Social security number",
  CREDIT_CARD: "Payment card",
  TAX_ID: "Tax ID",
  BANK_ACCOUNT: "Bank account",
  ROUTING_NUMBER: "Bank routing number",
  GOVERNMENT_ID: "Government ID",
  PASSPORT: "Passport",
  DRIVERS_LICENSE: "Driver's licence",
  BUILDING_NUMBER: "Building number",
  STREET_NAME: "Street name",
  SECONDARY_ADDRESS: "Secondary address",
  CITY: "City",
  STATE: "State / county",
  ZIP_CODE: "Postal code",
};

function describeLabel(label: string): string {
  return (
    (LABEL_DESCRIPTIONS as Record<string, string>)[label] ??
    UPSTREAM_LABELS[label] ??
    label.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

export interface ComplianceReportOptions {
  readonly organisation?: string;
  readonly periodLabel?: string;
  readonly generatedAt?: Date;
  readonly packageVersion?: string;
}

export interface ComplianceReport {
  readonly markdown: string;
  /** A standalone HTML document, suitable for download / print-to-PDF. */
  readonly html: string;
}

function periodOf(summary: ComplianceSummary): string {
  if (summary.from === null || summary.to === null) return "—";
  return summary.from === summary.to ? summary.from : `${summary.from} to ${summary.to}`;
}

const STATEMENT =
  "All personal data below was redacted on the user's device, before any data was transmitted to a " +
  "server or third-party AI service, in support of the Kenya Data Protection Act, 2019. This report " +
  "contains aggregate counts only — no personal data is stored in, or derivable from, it.";

const METHOD =
  "Method: deterministic Kenyan recognizers plus an on-device ONNX model. Redaction runs client-side; " +
  "only placeholdered text ever leaves the device. This is a first-line technical control, not a " +
  "complete data-protection compliance programme.";

/** Render an ODPC-style compliance report as both Markdown and standalone HTML. */
export function generateComplianceReport(
  summary: ComplianceSummary,
  options: ComplianceReportOptions = {},
): ComplianceReport {
  const org = options.organisation ?? "Your Organisation";
  const period = options.periodLabel ?? periodOf(summary);
  const generated = (options.generatedAt ?? new Date()).toISOString().slice(0, 10);
  const version = options.packageVersion ?? "rampart-ke";
  const labelRows = Object.entries(summary.byLabel);
  const dayRows = Object.entries(summary.byDay);

  const mdLabelRows =
    labelRows.map(([l, n]) => `| ${describeLabel(l)} | \`${l}\` | ${n} |`).join("\n") ||
    "| _No redactions recorded_ |  | 0 |";
  const mdDayRows = dayRows.map(([d, n]) => `| ${d} | ${n} |`).join("\n") || "| — | 0 |";

  const markdown = `# Data Protection Compliance Report
## On-device PII redaction — powered by ${version}

**Organisation:** ${org}
**Reporting period:** ${period}
**Generated:** ${generated}

${STATEMENT}

**Total PII instances redacted:** ${summary.totalRedactions} across ${summary.sessions} message(s).

### Redactions by category
| Category | Label | Instances |
| --- | --- | --- |
${mdLabelRows}

### Redactions by day
| Day | Instances |
| --- | --- |
${mdDayRows}

---
*${METHOD}*
`;

  const htmlLabelRows =
    labelRows
      .map(([l, n]) => `<tr><td>${esc(describeLabel(l))}</td><td><code>${esc(l)}</code></td><td>${n}</td></tr>`)
      .join("") || `<tr><td colspan="2"><em>No redactions recorded</em></td><td>0</td></tr>`;
  const htmlDayRows =
    dayRows.map(([d, n]) => `<tr><td>${esc(d)}</td><td>${n}</td></tr>`).join("") ||
    `<tr><td>—</td><td>0</td></tr>`;

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>Data Protection Compliance Report — ${esc(org)}</title>
<style>
  body { font: 14px/1.6 -apple-system, Segoe UI, Roboto, sans-serif; color: #111; max-width: 720px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 22px; margin-bottom: 2px; } h2 { font-size: 15px; color: #555; font-weight: 600; margin-top: 0; }
  .meta { color: #444; margin: 14px 0; } .statement { background: #f3f6fb; border: 1px solid #d6e0f0; border-radius: 8px; padding: 12px 14px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 22px; } th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid #e3e3e3; }
  th { color: #555; } code { background: #eef; padding: 1px 5px; border-radius: 4px; } .total { font-size: 16px; font-weight: 600; }
  footer { color: #666; font-size: 12px; border-top: 1px solid #e3e3e3; padding-top: 10px; }
</style></head><body>
<h1>Data Protection Compliance Report</h1>
<h2>On-device PII redaction — powered by ${esc(version)}</h2>
<div class="meta"><strong>Organisation:</strong> ${esc(org)}<br/>
<strong>Reporting period:</strong> ${esc(period)}<br/>
<strong>Generated:</strong> ${esc(generated)}</div>
<p class="statement">${esc(STATEMENT)}</p>
<p class="total">Total PII instances redacted: ${summary.totalRedactions} across ${summary.sessions} message(s).</p>
<h3>Redactions by category</h3>
<table><thead><tr><th>Category</th><th>Label</th><th>Instances</th></tr></thead><tbody>${htmlLabelRows}</tbody></table>
<h3>Redactions by day</h3>
<table><thead><tr><th>Day</th><th>Instances</th></tr></thead><tbody>${htmlDayRows}</tbody></table>
<footer>${esc(METHOD)}</footer>
</body></html>`;

  return { markdown, html };
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
