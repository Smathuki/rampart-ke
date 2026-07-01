/**
 * rampart-ke hosted redaction API + landing page server.
 *
 * Zero external dependencies (Node built-ins only). It wraps the rampart-ke
 * library server-side for organisations that cannot run client-side WebAssembly
 * (legacy systems, back-office batch jobs). Host it IN-COUNTRY (e.g. a Kenyan
 * data centre) so citizen data still never leaves Kenya.
 *
 * Note: the on-device library remains the recommended path — there, data never
 * leaves the browser at all. This API is the fallback for systems that can't.
 *
 *   POST /api/redact   { "text": "..." }  -> { redacted, redactions, labels }
 *   GET  /api/health                       -> { ok: true, ready }
 *   GET  /api/report                       -> ODPC-style HTML compliance report
 *   GET  /*                                 -> static landing page from ../site
 */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createKenyanGuard, ComplianceRecorder, generateComplianceReport } from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE = join(__dirname, "..", "site");
const PORT = Number(process.env.PORT ?? 8787);
const MAX_BODY = 100_000; // cap request size (chars)

// One shared guard (loads the ONNX model once) + a PII-free audit recorder.
let guardPromise;
let ready = false;
const recorder = new ComplianceRecorder();
function getGuard() {
  return (guardPromise ??= createKenyanGuard({ device: "cpu" }).then((g) => {
    ready = true;
    return g;
  }));
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
};

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...CORS, ...headers });
  res.end(body);
}
function json(res, status, obj) {
  send(res, status, JSON.stringify(obj), { "content-type": "application/json" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > MAX_BODY) reject(new Error("payload too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function countLabels(placeholders) {
  const out = {};
  for (const token of placeholders) {
    const m = /^\[([A-Z][A-Z0-9_]*)_\d+\]$/.exec(token);
    if (m) out[m[1]] = (out[m[1]] ?? 0) + 1;
  }
  return out;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");

  if (req.method === "OPTIONS") return send(res, 204, "");

  if (url.pathname === "/api/health") {
    return json(res, 200, { ok: true, ready });
  }

  if (req.method === "POST" && url.pathname === "/api/redact") {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body || "{}");
      if (typeof parsed.text !== "string") {
        return json(res, 400, { error: "body must be { text: string }" });
      }
      const guard = await getGuard();
      const result = await guard.protect(parsed.text);
      recorder.record(result);
      return json(res, 200, {
        redacted: result.text,
        redactions: result.placeholders.length,
        labels: countLabels(result.placeholders),
      });
    } catch (err) {
      return json(res, 400, { error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (url.pathname === "/api/report") {
    const { html } = generateComplianceReport(recorder.summary(), { organisation: "Hosted API demo" });
    return send(res, 200, html, { "content-type": "text/html; charset=utf-8" });
  }

  // Static landing page.
  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = normalize(join(SITE, rel));
  if (!filePath.startsWith(SITE)) return send(res, 403, "forbidden");
  if (existsSync(filePath)) {
    const data = await readFile(filePath);
    return send(res, 200, data, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
  }
  return send(res, 404, "not found");
});

server.listen(PORT, () => {
  console.log(`rampart-ke API + landing page → http://localhost:${PORT}`);
  console.log("Warming the on-device model…");
  getGuard().then(() => console.log("Model ready. POST /api/redact is live."));
});
