# rampart-ke

[![CI](https://github.com/Smathuki/rampart-ke/actions/workflows/ci.yml/badge.svg)](https://github.com/Smathuki/rampart-ke/actions/workflows/ci.yml)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](LICENSE)

**Kenya-localized, on-device PII redaction.** A thin wrapper around
[Rampart](https://huggingface.co/nationaldesignstudio/rampart) (National Design Studio) that scrubs
Kenyan personal data **in the browser, before any byte leaves the device** — so it never reaches a
server, a log, or a foreign AI API.

This is built for the Kenyan [Data Protection Act, 2019](https://www.odpc.go.ke/) reality: the only
data you can be sure stays in the country is the data that never leaves the user's device.

---

## How it works

Two layers run locally, in order:

1. **Kenyan deterministic layer** (this package) — regex/validator recognizers for structured local
   identifiers. They mint friendly placeholders like `[KRA_PIN_1]`, `[MPESA_CODE_1]`.
2. **Rampart model** — the upstream 14.7 MB quantized ONNX MiniLM catches names and addresses, and
   keeps coarse geography (towns / counties) for analytics.

```
user text
  → Kenyan recognizers   → mask KRA PIN, M-Pesa, phone, IDs, orgs, estates …
  → Rampart guard        → mask names / addresses (model) + email/URL/IP/SSN/card (heuristics)
  → placeholdered text   → safe to send to an LLM or server
assistant reply
  → guard.reveal()       → restores the real values, on-device, for display
```

Real values live only in an in-memory table on the client. Only placeholdered text leaves the device.

## Install

```bash
npm install rampart-ke @nationaldesignstudio/rampart @huggingface/transformers
```

## Usage

```ts
import { createKenyanGuard } from "rampart-ke";

const guard = await createKenyanGuard(); // loads the on-device model (cached after first run)

const { text, entities } = await guard.protect(
  "QFT3X1AB9Z Confirmed. Ksh2,500 sent to John Ochieng 0712345678. KRA PIN A012345678Z.",
);
// text → "[MPESA_CODE_1] Confirmed. Ksh2,500 sent to [GIVEN_NAME_1] [SURNAME_1] [KE_PHONE_1]. KRA PIN [KRA_PIN_1]."

const reply = await callYourLLM(text);     // the model only ever sees placeholders
const shown = guard.reveal(reply);          // real values restored locally before display
```

For a quick one-off without managing a guard instance:

```ts
import { protectKE } from "rampart-ke";
const { text } = await protectKE("My KRA PIN is A012345678Z");
```

Offline / fast path (skip the ML model — Kenyan recognizers + upstream heuristics only):

```ts
const guard = await createKenyanGuard({ heuristicsOnly: true });
```

## What it detects (Kenyan layer)

| Placeholder        | What it catches                                              |
| ------------------ | ------------------------------------------------------------ |
| `[KRA_PIN_n]`      | KRA PIN — `A`/`P` + 9 digits + check letter                  |
| `[MPESA_CODE_n]`   | M-Pesa confirmation codes (context-gated to cut false hits)  |
| `[MPESA_PAYBILL_n]`| Paybill / Till / Buy-Goods short codes                       |
| `[KE_PHONE_n]`     | `+254` / `254` / `07xx` / `01xx` numbers                     |
| `[NATIONAL_ID_n]`  | National ID (context-anchored to "ID" / "kitambulisho")      |
| `[MAISHA_NAMBA_n]` | Maisha Namba                                                 |
| `[SHIF_n]`         | SHA / SHIF number (current health scheme)                    |
| `[NHIF_n]`         | NHIF number (legacy)                                         |
| `[NSSF_n]`         | NSSF number                                                  |
| `[BANK_ACCOUNT_n]` | Bank account (context-anchored to "a/c" / "account")         |
| `[PASSPORT_n]`     | Passport number (context-anchored)                           |
| `[ORG_KE_n]`       | Company names — "… Limited / Ltd / PLC / SACCO / Holdings"    |
| `[LOCATION_KE_n]`  | Estates, named roads, P.O. boxes                             |
| `[NAME_KE_n]`      | Names after a Swahili/Sheng cue ("Jina langu ni …", "Mimi ni …") |

**Geography policy:** the 47 counties are *kept* (coarse geography is useful and not identifying) —
enforced even when the model mislabels a county as a name; fine-grained estates/roads/P.O. boxes are
*redacted*. See [`src/policy.ts`](src/policy.ts), [`src/ner.ts`](src/ner.ts), and [`src/data/`](src/data/).

## Precision

Over-redaction destroys utility, so ambiguous patterns (M-Pesa codes, National ID, bank/passport)
are **context-anchored**, not matched on shape alone. The precision gate lives in
[`__tests__/falsePositives.test.ts`](__tests__/falsePositives.test.ts) — benign Kenyan text that
must produce zero redactions. Tune recognizers against that corpus, not in isolation.

## Demo

```bash
npm run dev      # open the printed localhost URL
```

Pick a sample (M-Pesa receipt, intake form, Swahili mix), hit **Redact on-device**. To prove it's
local: load once so the model caches, then **disconnect Wi-Fi** and redact again — it still works.
(The ~15 MB weights download once; redaction itself is fully offline.)

## Limitations & roadmap

- **Names rely on the upstream model**, which was trained on Western naming traditions. It catches
  many Latin-script Kenyan names contextually but will miss culturally-specific ones. The model
  schema is fixed, so improving this means **fine-tuning on synthetic Kenyan names/places** — the
  natural Phase 2 (and a clean grant deliverable). New *structured* types (KRA, M-Pesa) stay in the
  deterministic layer regardless.
- **Non-Latin scripts** (e.g. Arabic-script Somali names) are poorly handled by the base model
  (~13.7% recall upstream).
- This is a **first-line control**, not full DPA compliance on its own.

## Tests

```bash
npm test                 # fast, offline (recognizers, premask, false-positives, integration)
RAMPART_KE_E2E=1 npm test  # also runs the full-model end-to-end test (downloads weights)
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) — especially the **precision rule** (prefer context-anchoring
over shape-only matching; keep the false-positive corpus green) and the guide to adding a recognizer.
Never put real personal data in issues, PRs, or fixtures.

## Attribution & license

rampart-ke is a derivative of **Rampart** by **National Design Studio**, used under
**CC BY 4.0**, and is released under the same license. See [`LICENSE`](LICENSE). The Rampart model
itself and its training data ([OpenPII 1.5M](https://huggingface.co/datasets/ai4privacy/pii-masking-openpii-1.5m))
are also CC BY 4.0.
