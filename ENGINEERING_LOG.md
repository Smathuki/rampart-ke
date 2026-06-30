# rampart-ke — Engineering Log

A running record of the design decisions, nuances, and bugs fixed while building
`rampart-ke`. Append a dated entry whenever something non-obvious is decided or fixed.
Newest entries at the top.

---

## Architecture (why it's built this way)

- **Thin wrapper, not a fork.** `rampart-ke` depends on `@nationaldesignstudio/rampart`
  (CC BY 4.0) and layers Kenyan detection *on top*. Clean upstream upgrades, clear
  attribution, npm-publishable. We never edit upstream source.
- **Kenyan structured IDs live in a deterministic pre-mask layer.** The Rampart model has a
  **fixed 20-label `PiiLabel` schema** — you cannot add `KRA_PIN`/`MPESA_CODE` model labels
  without retraining, and some of ours (M-Pesa codes, company names) have *no* upstream label
  at all. So Kenyan IDs are detected by regex/validator recognizers that mint our own friendly
  placeholders (`[KRA_PIN_1]`, `[MPESA_CODE_1]`), then residual text goes to the upstream guard.
- **Two integration seams, used deliberately:**
  - Kenyan pre-mask runs first (our `KenyanEntityTable`), then `guard.protect()` handles
    names/addresses (model) + email/URL/IP/SSN/card (upstream heuristics).
  - Name redaction is routed through ChatGuard's `ner` seam wrapped with our boundary-repair
    (see 2026-06-30 fragmentation fix).
- **Geography policy:** the 47 counties are *kept* (coarse geography is useful and not
  identifying); fine-grained estates/roads/P.O. boxes are *redacted*. ZIP is dropped (Kenya has none).

## Verified facts about upstream Rampart (correcting early assumptions)

- License is **CC BY 4.0** → forking/commercial use allowed *with attribution*. (Early advice
  that we "shouldn't touch the code" was wrong.)
- Upstream deterministic layer covers **only** SSN, credit card (Luhn), email, URL, IP.
  Phone, tax IDs, names, addresses are all the **model**.
- Custom `ner` passed to `createGuard` **receives pre-masked text and replaces the model**;
  ChatGuard projects its spans back to raw coords, then `scrub` → `applyPolicy` → `mergeSpans`
  reconciles overlaps. (Source confirmed in `node_modules/.../src/{guard,policy,session,premask}.ts`.)

---

## Changelog

### 2026-06-30 — Token-edge fragmentation on names (FIXED)
- **Symptom:** `"JOHN OCHIENG"` redacted to `[GIVEN_NAME_1] [SURNAME_1] G` — the trailing `G`
  was left exposed.
- **Root cause:** WordPiece tokenization. The model labeled the `OCHIEN` subword span and missed
  the final `G` fragment. A single under-covered span has no overlapping partner, so upstream's
  `mergeSpans` could not repair it.
- **Fix:** `src/ner.ts` — `repairSpanBoundaries()` snaps every model span out to whole-word
  boundaries (grows left/right only while splitting a contiguous word of letters/digits/name
  apostrophes; never crosses a space). Wired in as the default detector via the `ner` seam, so
  no fork is needed. Recall-biased: only ever grows a redaction.
- **Verified:** unit regression on the literal `JOHN OCHIENG` case + leading-fragment + `Murang'a`
  apostrophe + "don't cross a space" (`__tests__/ner.test.ts`), and full-model E2E on
  `"My name is John Ochieng"` leaves no `Ochien`/`chieng` fragment.
- **Known gap:** repair runs on the main thread only; if a caller uses `worker` mode the
  unrepaired upstream detector is used. Hyphenated multi-word place names (e.g. `Taita-Taveta`)
  are not joined across the hyphen by design (conservative).

### 2026-06-30 — Passport recognizer missed "No." (FIXED)
- **Symptom:** `"Passport No. A1234567"` was not detected.
- **Root cause:** the cue (`no\.?`) was matched case-sensitively while the ID class is anchored
  uppercase; capital `No.` fell through, then `[A-Z]{1,2}` greedily failed on the lowercase `o`.
- **Fix:** made the cue case-tolerant (`[Nn][Oo]\.?|[Nn]umber`) and the separator explicit
  (`[\s:.#-]{0,6}`) without loosening the uppercase ID class. (`src/recognizers/bank.ts`)

### 2026-06-30 — M-Pesa code recognizer was dangerously broad (HARDENED at design time)
- **Nuance:** the originally-proposed `/\b[A-Z0-9]{10}\b/` matches *any* 10-char token
  (order IDs, hashes, SKUs) → mass over-redaction.
- **Decision:** require start-letter + at least one digit, AND a **context gate** (M-PESA / Ksh /
  confirmed / received / ref … within ~45 chars, or a short SMS-length input). (`src/recognizers/mpesa.ts`)
- **Guarded by:** `__tests__/falsePositives.test.ts` — benign Kenyan text that must yield zero
  redactions. This corpus is the precision gate; tune recognizers against it, not in isolation.

### 2026-06-30 — Context-anchoring for ambiguous IDs (DESIGN)
- National ID (7–8 digits), bank account, and passport are **only** matched after their cue
  word ("ID"/"kitambulisho", "a/c"/"account", "passport"), and only the value (not the cue) is
  redacted (via the regex `d`-flag capture-group offsets in `src/recognizers/util.ts`). Bare
  numbers are never redacted on shape alone.

### 2026-06-30 — Health scheme localization (DESIGN)
- **NHIF was replaced by SHA/SHIF in 2024.** `SHA` and `SHIF` map to the current `SHIF` label;
  `NHIF` is kept as a legacy label; `NSSF` distinct. (`src/recognizers/health.ts`)

### 2026-06-30 — Company-name false positives (DESIGN)
- Org suffixes (`Limited`/`Ltd`/`PLC`/`SACCO`/`Holdings`…) are matched **case-sensitively** and
  must follow ≥1 capitalised token, so "limited time", "the group" don't trigger.
  (`src/recognizers/org.ts`)

### 2026-06-30 — Friendly placeholders survive the upstream pass (VERIFIED)
- Our `[KRA_PIN_1]`-style tokens are inserted before `guard.protect()`. Risk: upstream could
  mangle them. The offline integration test confirms they pass through untouched and the full
  `reveal()` round-trips to the original input. (`__tests__/integration.test.ts`)

---

## Open items / Phase 2

- **Model fine-tuning on synthetic Kenyan names/places** — lifts recall on existing labels
  (GIVEN_NAME/SURNAME/STREET_NAME) for Kenyan data. New structured types stay deterministic.
- **Non-Latin scripts** (Arabic-script Somali names): base model ~13.7% recall upstream.
- **Worker-mode boundary repair** — move `repairSpanBoundaries` into the worker pipeline.
- **Gazetteer growth** — extend `src/data/{estates,roads-via-regex}` coverage; consider an
  official place-name source.

## Test coverage (current)

`npm test` (offline): recognizers, premask/overlap, false-positive corpus, NER boundary repair,
integration (heuristics-only). `RAMPART_KE_E2E=1 npm test` adds the full-model end-to-end check.
