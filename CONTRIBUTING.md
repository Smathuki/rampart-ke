# Contributing to rampart-ke

Thanks for helping protect Kenyans' data. `rampart-ke` keeps personal data on-device — redacted
before it ever leaves the browser — so the bar for changes is **privacy first, precision second,
features third**.

> ⚠️ **Never paste real personal data (real KRA PINs, IDs, M-Pesa codes, phone numbers) into
> issues, PRs, or test fixtures.** Use clearly fictional values, as the existing samples do.

## Development setup

```bash
npm install
npm test            # fast, offline suite (recognizers, premask, repair, false positives)
npm run dev         # the offline browser demo at http://localhost:5173
npm run build       # emit dist/ (types + JS)
```

Requires Node 18+. The full-model end-to-end test downloads the ONNX weights and is opt-in:

```bash
RAMPART_KE_E2E=1 npm test
```

## Project layout

| Path | What |
| --- | --- |
| `src/recognizers/` | one file per Kenyan identifier (regex/validator detectors) |
| `src/data/` | gazetteers — counties (kept), estates/roads (redacted), org suffixes |
| `src/premask.ts` | overlap resolution into a disjoint match set |
| `src/session.ts` | the reversible `[KRA_PIN_1]` placeholder table |
| `src/ner.ts` | boundary-repair wrapper around the upstream model |
| `src/index.ts` | public API (`createKenyanGuard`, `protectKE`) |
| `__tests__/` | unit + false-positive + integration tests |

## How to add a new recognizer (the most common contribution)

1. Create `src/recognizers/<name>.ts` exporting a `Recognizer` (see `kra.ts` for the simplest
   example). Use the `scan()` helper in `recognizers/util.ts`; for context-anchored patterns use a
   capture group with the regex `d` flag so only the value (not the cue word) is redacted.
2. Register it in `src/recognizers/index.ts` (`DEFAULT_RECOGNIZERS`) and pick a sensible
   `priority` (tight structured IDs outrank broad org/location matches).
3. Add a label to `KenyanLabel` in `src/types.ts` and a description in `src/labels.ts`.
4. **Add tests** in `__tests__/recognizers.test.ts`: at least one positive and one negative case.

### The precision rule (non-negotiable)

Over-redaction destroys utility and undermines the whole pitch. So:

- **Prefer context-anchoring over shape-only matching.** A bare 8-digit number or a 10-char token
  must NOT be redacted on shape alone — require a nearby cue (e.g. "ID", "Paybill", "M-PESA").
- **Every change must keep [`__tests__/falsePositives.test.ts`](__tests__/falsePositives.test.ts)
  green.** If your recognizer could fire on benign Kenyan text, add that text to the corpus and make
  it pass at zero redactions.

## Gazetteers

To add estates/roads (redacted) or counties (kept), edit `src/data/`. Keep counties and estates
disjoint — a county is coarse geography we deliberately keep for analytics.

## Commits & PRs

- Clear, present-tense commit messages explaining *why*.
- For any notable bug fix or non-obvious design decision, add a dated entry to
  [`ENGINEERING_LOG.md`](ENGINEERING_LOG.md).
- CI (`npm ci` → typecheck → build → `npm test`) must pass. Match the existing TypeScript style
  (strict mode, no new lint errors).

## Licensing & attribution

Contributions are accepted under **CC BY 4.0**, the same license as this project and the upstream
[Rampart](https://github.com/nationaldesignstudio/rampart) model by National Design Studio. Don't
remove the upstream attribution in `LICENSE` / `README.md`.
