# rampart-ke hosted API

A small, zero-dependency Node server that wraps the rampart-ke library **server-side** and serves the
landing page. It exists for organisations that **cannot run client-side WebAssembly** (legacy systems,
back-office batch jobs).

> **On-device is still the recommended path** — there, data never leaves the browser at all. With this
> API, the text *does* reach the server, so **host it inside your own infrastructure / a Kenyan data
> centre** (Safaricom, Africa Data Centres, iColo). Never a foreign cloud region. That keeps citizen
> data in Kenya.

## Run locally

```bash
npm run serve            # builds dist/ then starts the server
# → http://localhost:8787  (landing page + API)
```

First request warms the on-device model (a few seconds); subsequent calls are fast.

## Docker

```bash
docker build -f server/Dockerfile -t rampart-ke .
docker run -p 8787:8787 rampart-ke
```

## Endpoints

| Method | Path | Body / result |
| --- | --- | --- |
| POST | `/api/redact` | `{ "text": "..." }` → `{ redacted, redactions, labels }` |
| GET | `/api/health` | `{ ok: true, ready }` |
| GET | `/api/report` | ODPC-style HTML compliance report (counts only) |
| GET | `/*` | the static landing page (`site/`) |

```bash
curl -s http://localhost:8787/api/redact \
  -H 'content-type: application/json' \
  -d '{"text":"My KRA PIN is A012345678Z, call 0712345678"}'
```

The server records **PII-free** counts (label + day) for the compliance report — no text or values are
stored.
